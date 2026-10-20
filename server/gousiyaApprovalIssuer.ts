import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { lstat, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { appendDurableAuditEvent } from './saqlainAuditLog.ts';
import type {
  GousiyaApprovalScope,
  GousiyaApprovalTokenVerifier,
  GousiyaApproverRole,
  VerifiedGousiyaApproval,
} from './gousiyaEmergencyRecovery.ts';
import type { FirebaseVerifiedIdentity } from './gousiyaFirebaseApprovalVerifier.ts';

const ISSUER = 'gousiya-approval-service';
const MAX_TOKEN_LENGTH = 16_384;
export const GOUSIYA_APPROVAL_DEFAULT_TTL_MS = 2 * 60_000;
export const GOUSIYA_APPROVAL_MAX_TTL_MS = 5 * 60_000;

export interface GousiyaApproverRegistryEntry {
  uid: string;
  active: boolean;
  roles: GousiyaApproverRole[];
}
interface ParsedRegistry {
  schemaVersion: 1;
  users: GousiyaApproverRegistryEntry[];
}
export type FirebaseIdentityAuthenticator = (token: string) => Promise<FirebaseVerifiedIdentity>;

export interface GousiyaApprovalIssuerOptions {
  projectId: string;
  registryFilePath: string;
  auditFilePath: string;
  signingSecret: string;
  authenticateFirebaseIdentity: FirebaseIdentityAuthenticator;
  now?: () => Date;
}
export interface IssueGousiyaApprovalInput {
  firebaseIdToken: string;
  role: GousiyaApproverRole;
  decision: 'APPROVE' | 'DENY';
  incidentId: string;
  recoveryAgentId: string;
  sourceSnapshotDirectory: string;
  stagingRoot: string;
  reason: string;
  ttlMs?: number;
}
export interface IssuedGousiyaApproval {
  approvalId: string;
  role: GousiyaApproverRole;
  decision: 'APPROVE' | 'DENY';
  incidentId: string;
  subject: string;
  issuedAt: string;
  expiresAt: string;
  token: string;
}
interface SignedApprovalClaims {
  iss: string;
  aud: string;
  sub: string;
  iat: number;
  exp: number;
  jti: string;
  auth_time: number;
  gousiyaApproval: {
    approvalId: string;
    role: GousiyaApproverRole;
    decision: 'APPROVE' | 'DENY';
    incidentId: string;
    recoveryAgentId: string;
    sourceSnapshotDirectory: string;
    stagingRoot: string;
    issuedAt: string;
    expiresAt: string;
  };
}
type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function requiredString(value: unknown, label: string, maxLength = 2048): string {
  if (typeof value !== 'string' || !value.trim() || value.length > maxLength) {
    throw new Error(label + ' is required and must be no longer than ' + maxLength + ' characters.');
  }
  return value.trim();
}
function encode(value: unknown): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}
function mac(content: string, secret: string): Buffer {
  return createHmac('sha256', secret).update(content, 'utf8').digest();
}
function safeEqualBase64Url(supplied: string, expected: Buffer): boolean {
  let actual: Buffer;
  try {
    if (!/^[A-Za-z0-9_-]+$/.test(supplied)) return false;
    actual = Buffer.from(supplied, 'base64url');
  } catch {
    return false;
  }
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
function parseSegment(segment: string): JsonObject {
  if (!segment || !/^[A-Za-z0-9_-]+$/.test(segment)) throw new Error('Malformed Gousiya approval token.');
  let value: unknown;
  try {
    value = JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
  } catch {
    throw new Error('Malformed Gousiya approval token.');
  }
  if (!isObject(value)) throw new Error('Malformed Gousiya approval token.');
  return value;
}
function validateSecret(secret: string): string {
  if (typeof secret !== 'string' || !/^[a-fA-F0-9]{64}$/.test(secret)) {
    throw new Error('GOUSIYA_APPROVAL_SIGNING_SECRET must be a 64-character hexadecimal key generated from 32 random bytes.');
  }
  return secret;
}
function normalizeScope(input: IssueGousiyaApprovalInput, now: Date): GousiyaApprovalScope {
  return {
    incidentId: requiredString(input.incidentId, 'incidentId', 200),
    recoveryAgentId: requiredString(input.recoveryAgentId, 'recoveryAgentId', 200),
    sourceSnapshotDirectory: requiredString(input.sourceSnapshotDirectory, 'sourceSnapshotDirectory', 2048),
    stagingRoot: requiredString(input.stagingRoot, 'stagingRoot', 2048),
    requestedAt: now.toISOString(),
  };
}

async function loadApproverRegistry(filePath: string): Promise<ParsedRegistry> {
  const path = resolve(filePath);
  const metadata = await lstat(path);
  if (!metadata.isFile() || metadata.isSymbolicLink()) {
    throw new Error('Gousiya approver registry must be a regular, non-symlink file.');
  }
  if ((metadata.mode & 0o077) !== 0) {
    throw new Error('Gousiya approver registry permissions must be owner-only (0600 or stricter).');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(path, 'utf8'));
  } catch {
    throw new Error('Gousiya approver registry is unreadable or malformed; refusing to issue approval.');
  }
  if (!isObject(parsed) || parsed.schemaVersion !== 1 || !Array.isArray(parsed.users)) {
    throw new Error('Gousiya approver registry schema is invalid.');
  }
  const seen = new Set<string>();
  const users: GousiyaApproverRegistryEntry[] = [];
  for (const entry of parsed.users) {
    if (!isObject(entry) || typeof entry.uid !== 'string' || !entry.uid.trim() ||
        entry.uid.length > 128 || typeof entry.active !== 'boolean' || !Array.isArray(entry.roles) ||
        !entry.roles.every(role => role === 'system-owner' || role === 'independent-reviewer') ||
        seen.has(entry.uid)) {
      throw new Error('Gousiya approver registry contains an invalid or duplicate user entry.');
    }
    seen.add(entry.uid);
    users.push({ uid: entry.uid, active: entry.active, roles: [...entry.roles] as GousiyaApproverRole[] });
  }
  return { schemaVersion: 1, users };
}

function parseSignedClaims(value: JsonObject): SignedApprovalClaims | null {
  if (typeof value.iss !== 'string' || typeof value.aud !== 'string' ||
      typeof value.sub !== 'string' || typeof value.iat !== 'number' ||
      typeof value.exp !== 'number' || typeof value.jti !== 'string' ||
      typeof value.auth_time !== 'number' || !isObject(value.gousiyaApproval)) return null;
  const approval = value.gousiyaApproval;
  if (typeof approval.approvalId !== 'string' ||
      (approval.role !== 'system-owner' && approval.role !== 'independent-reviewer') ||
      (approval.decision !== 'APPROVE' && approval.decision !== 'DENY') ||
      typeof approval.incidentId !== 'string' || typeof approval.recoveryAgentId !== 'string' ||
      typeof approval.sourceSnapshotDirectory !== 'string' || typeof approval.stagingRoot !== 'string' ||
      typeof approval.issuedAt !== 'string' || typeof approval.expiresAt !== 'string') return null;
  return value as unknown as SignedApprovalClaims;
}

/**
 * Creates the server-side issuer. Identity comes from a verified Firebase ID
 * token; roles come only from the owner-only registry file. Client-supplied
 * roles, approval IDs, issue times, or expiry values are never accepted.
 */
export function createGousiyaApprovalIssuer(options: GousiyaApprovalIssuerOptions): {
  issueApproval(input: IssueGousiyaApprovalInput): Promise<IssuedGousiyaApproval>;
} {
  const projectId = requiredString(options.projectId, 'projectId', 200);
  const signingSecret = validateSecret(options.signingSecret);
  const registryFilePath = requiredString(options.registryFilePath, 'registryFilePath', 4096);
  const auditFilePath = requiredString(options.auditFilePath, 'auditFilePath', 4096);
  if (typeof options.authenticateFirebaseIdentity !== 'function') {
    throw new Error('A trusted Firebase identity authenticator is required.');
  }
  const now = options.now ?? (() => new Date());

  return {
    async issueApproval(input): Promise<IssuedGousiyaApproval> {
      const createdAt = now();
      const requestedScope = normalizeScope(input, createdAt);
      const reason = requiredString(input.reason, 'reason', 1000);
      if (input.role !== 'system-owner' && input.role !== 'independent-reviewer') {
        throw new Error('A valid approver role is required.');
      }
      if (input.decision !== 'APPROVE' && input.decision !== 'DENY') {
        throw new Error('Approval decision must be APPROVE or DENY.');
      }
      const ttlMs = input.ttlMs ?? GOUSIYA_APPROVAL_DEFAULT_TTL_MS;
      if (!Number.isSafeInteger(ttlMs) || ttlMs < 1000 || ttlMs > GOUSIYA_APPROVAL_MAX_TTL_MS) {
        throw new Error('Approval TTL must be between 1 second and 5 minutes.');
      }

      const identity = await options.authenticateFirebaseIdentity(requiredString(input.firebaseIdToken, 'firebaseIdToken', 16_384));
      const registry = await loadApproverRegistry(registryFilePath);
      const user = registry.users.find(entry => entry.uid === identity.uid);
      if (!user || !user.active || !user.roles.includes(input.role)) {
        await appendDurableAuditEvent(auditFilePath, {
          eventType: 'GOUSIYA_APPROVAL_ISSUANCE_DENIED',
          actorId: identity.uid,
          outcome: 'DENY',
          resource: requestedScope.incidentId,
          occurredAt: createdAt.toISOString(),
          details: {
            approvalRole: input.role,
            decision: input.decision,
            reason: 'Authenticated Firebase identity is not active in the trusted approver registry for the requested role.',
            approvalTokenIssued: false,
          },
        });
        throw new Error('Authenticated user is not an active approver for the requested role.');
      }

      const issuedAtSeconds = Math.floor(createdAt.getTime() / 1000);
      const expiresAtSeconds = issuedAtSeconds + Math.ceil(ttlMs / 1000);
      const approvalId = randomUUID();
      const issuedAt = new Date(issuedAtSeconds * 1000).toISOString();
      const expiresAt = new Date(expiresAtSeconds * 1000).toISOString();
      const claims: SignedApprovalClaims = {
        iss: ISSUER,
        aud: projectId,
        sub: identity.uid,
        iat: issuedAtSeconds,
        exp: expiresAtSeconds,
        jti: approvalId,
        auth_time: identity.authTime,
        gousiyaApproval: {
          approvalId,
          role: input.role,
          decision: input.decision,
          incidentId: requestedScope.incidentId,
          recoveryAgentId: requestedScope.recoveryAgentId,
          sourceSnapshotDirectory: requestedScope.sourceSnapshotDirectory,
          stagingRoot: requestedScope.stagingRoot,
          issuedAt,
          expiresAt,
        },
      };
      const signingInput = encode({ alg: 'HS256', typ: 'JWT' }) + '.' + encode(claims);
      const token = signingInput + '.' + mac(signingInput, signingSecret).toString('base64url');

      // Do not return the bearer token unless the approval event has been durably audited.
      await appendDurableAuditEvent(auditFilePath, {
        eventType: 'GOUSIYA_APPROVAL_ISSUED',
        actorId: identity.uid,
        outcome: input.decision === 'APPROVE' ? 'ALLOW' : 'DENY',
        resource: requestedScope.incidentId,
        taskId: approvalId,
        occurredAt: createdAt.toISOString(),
        details: {
          approvalId,
          approvalRole: input.role,
          decision: input.decision,
          recoveryAgentId: requestedScope.recoveryAgentId,
          sourceSnapshotDirectory: requestedScope.sourceSnapshotDirectory,
          stagingRoot: requestedScope.stagingRoot,
          reason,
          expiresAt,
          authenticatedAt: new Date(identity.authTime * 1000).toISOString(),
          bearerTokenLogged: false,
        },
      });

      return {
        approvalId,
        role: input.role,
        decision: input.decision,
        incidentId: requestedScope.incidentId,
        subject: identity.uid,
        issuedAt,
        expiresAt,
        token,
      };
    },
  };
}

/** Verifies signed approval attestations issued by createGousiyaApprovalIssuer. */
export function createGousiyaApprovalTokenVerifier(options: {
  projectId: string;
  signingSecret: string;
  now?: () => Date;
}): GousiyaApprovalTokenVerifier {
  const projectId = requiredString(options.projectId, 'projectId', 200);
  const signingSecret = validateSecret(options.signingSecret);
  const now = options.now ?? (() => new Date());

  return async (token: string, expectedScope: GousiyaApprovalScope): Promise<VerifiedGousiyaApproval> => {
    if (typeof token !== 'string' || token.length < 32 || token.length > MAX_TOKEN_LENGTH) {
      throw new Error('A valid Gousiya approval token is required.');
    }
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Malformed Gousiya approval token.');
    const header = parseSegment(parts[0]);
    if (header.alg !== 'HS256' || header.typ !== 'JWT') throw new Error('Gousiya approval token algorithm is not accepted.');
    const signingInput = parts[0] + '.' + parts[1];
    if (!safeEqualBase64Url(parts[2], mac(signingInput, signingSecret))) {
      throw new Error('Gousiya approval token signature verification failed.');
    }
    const parsed = parseSignedClaims(parseSegment(parts[1]));
    if (!parsed) throw new Error('Gousiya approval token claims are malformed.');
    const nowSeconds = Math.floor(now().getTime() / 1000);
    if (parsed.iss !== ISSUER || parsed.aud !== projectId ||
        !parsed.sub.trim() || parsed.jti !== parsed.gousiyaApproval.approvalId ||
        !Number.isSafeInteger(parsed.iat) || !Number.isSafeInteger(parsed.exp) ||
        parsed.iat > nowSeconds + 30 || parsed.exp <= nowSeconds ||
        parsed.exp <= parsed.iat || parsed.exp - parsed.iat > GOUSIYA_APPROVAL_MAX_TTL_MS / 1000 ||
        parsed.auth_time > parsed.iat || parsed.auth_time > nowSeconds + 30 ||
        nowSeconds - parsed.auth_time > 5 * 60) {
      throw new Error('Gousiya approval token is expired or has invalid issuer, audience, or time claims.');
    }

    const approval = parsed.gousiyaApproval;
    if (approval.incidentId !== expectedScope.incidentId ||
        approval.recoveryAgentId !== expectedScope.recoveryAgentId ||
        approval.sourceSnapshotDirectory !== expectedScope.sourceSnapshotDirectory ||
        approval.stagingRoot !== expectedScope.stagingRoot) {
      throw new Error('Gousiya approval token does not match the requested incident scope.');
    }
    const issuedAt = Date.parse(approval.issuedAt);
    const expiresAt = Date.parse(approval.expiresAt);
    if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt) ||
        Math.floor(issuedAt / 1000) !== parsed.iat ||
        Math.floor(expiresAt / 1000) !== parsed.exp ||
        expiresAt <= now().getTime()) {
      throw new Error('Gousiya approval validity window is invalid.');
    }
    return {
      approvalId: approval.approvalId,
      subject: parsed.sub,
      role: approval.role,
      decision: approval.decision,
      incidentId: approval.incidentId,
      recoveryAgentId: approval.recoveryAgentId,
      sourceSnapshotDirectory: approval.sourceSnapshotDirectory,
      stagingRoot: approval.stagingRoot,
      issuedAt: approval.issuedAt,
      expiresAt: approval.expiresAt,
    };
  };
}
