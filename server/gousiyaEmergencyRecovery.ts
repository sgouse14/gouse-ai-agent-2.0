import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { mkdir, open, readFile, rename, unlink } from 'node:fs/promises';
import { canonicalizePathForSafety, pathsOverlapByResolvedLocation } from './saqlainPathSafety.ts';
import { appendDurableAuditEvent } from './saqlainAuditLog.ts';
import { runRecoveryRehearsal, type RecoveryRehearsalResult } from './saqlainRecoveryAgent.ts';

export const GOUSIYA_MAX_GRANT_TTL_MS = 5 * 60_000;
export const GOUSIYA_DEFAULT_GRANT_TTL_MS = 2 * 60_000;
export type GousiyaEmergencyStatus = 'ISSUED' | 'CONSUMED' | 'REVOKED' | 'EXPIRED';
export type GousiyaApproverRole = 'system-owner' | 'independent-reviewer';

export interface GousiyaEmergencyGrant {
  grantId: string;
  incidentId: string;
  recoveryAgentId: string;
  sourceSnapshotDirectory: string;
  stagingRoot: string;
  issuedAt: string;
  expiresAt: string;
  status: GousiyaEmergencyStatus;
}
interface StoredGrant extends GousiyaEmergencyGrant {
  tokenDigest: string;
}

export interface GousiyaApprovalScope {
  incidentId: string;
  recoveryAgentId: string;
  sourceSnapshotDirectory: string;
  stagingRoot: string;
  requestedAt: string;
}

/**
 * Claims returned only after a trusted server-side token verifier has validated
 * the issuer, signature, audience, expiry, and approval claims in the token.
 * Never implement this verifier by trusting request-body fields.
 */
export interface VerifiedGousiyaApproval {
  subject: string;
  role: GousiyaApproverRole;
  decision: 'APPROVE' | 'DENY';
  incidentId: string;
  recoveryAgentId: string;
  sourceSnapshotDirectory: string;
  stagingRoot: string;
  issuedAt: string;
  expiresAt: string;
}

export type GousiyaApprovalTokenVerifier = (
  token: string,
  expectedScope: GousiyaApprovalScope,
) => Promise<VerifiedGousiyaApproval>;

export interface GousiyaEmergencyState {
  /** In-process view only; the durable grant store is authoritative. */
  grants: Map<string, StoredGrant>;
  auditFilePath: string;
  grantStoreFilePath: string;
  verifyApprovalToken: GousiyaApprovalTokenVerifier;
}

export function createGousiyaEmergencyState(input: {
  auditFilePath: string;
  grantStoreFilePath: string;
  verifyApprovalToken: GousiyaApprovalTokenVerifier;
}): GousiyaEmergencyState {
  if (!input.auditFilePath?.trim()) throw new Error('A durable audit path is required.');
  if (!input.grantStoreFilePath?.trim()) throw new Error('A durable grant-store path is required.');
  if (resolve(input.auditFilePath) === resolve(input.grantStoreFilePath)) {
    throw new Error('Audit log and grant store must use separate paths.');
  }
  if (typeof input.verifyApprovalToken !== 'function') {
    throw new Error('A trusted server-side approval-token verifier is required.');
  }
  return {
    grants: new Map(),
    auditFilePath: resolve(input.auditFilePath),
    grantStoreFilePath: resolve(input.grantStoreFilePath),
    verifyApprovalToken: input.verifyApprovalToken,
  };
}

function digest(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}
function equalDigest(a: string, b: string): boolean {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  return left.length === right.length && left.length === 32 && timingSafeEqual(left, right);
}
function required(value: string, field: string): string {
  if (!value?.trim()) throw new Error(field + ' is required.');
  return value.trim();
}
async function audit(state: GousiyaEmergencyState, input: {
  eventType: string;
  actorId: string;
  outcome: 'ALLOW' | 'DENY' | 'HOLD' | 'INFO';
  resource: string;
  occurredAt: string;
  details: Record<string, unknown>;
}): Promise<void> {
  await appendDurableAuditEvent(state.auditFilePath, input);
}

function syncMap(target: Map<string, StoredGrant>, source: Map<string, StoredGrant>): void {
  target.clear();
  for (const [id, grant] of source) target.set(id, { ...grant });
}

function validStoredGrant(value: unknown): value is StoredGrant {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<StoredGrant>;
  return typeof item.grantId === 'string' && item.grantId.length > 0 &&
    typeof item.incidentId === 'string' && typeof item.recoveryAgentId === 'string' &&
    typeof item.sourceSnapshotDirectory === 'string' && typeof item.stagingRoot === 'string' &&
    typeof item.issuedAt === 'string' && Number.isFinite(Date.parse(item.issuedAt)) &&
    typeof item.expiresAt === 'string' && Number.isFinite(Date.parse(item.expiresAt)) &&
    ['ISSUED', 'CONSUMED', 'REVOKED', 'EXPIRED'].includes(String(item.status)) &&
    typeof item.tokenDigest === 'string' && /^[a-f0-9]{64}$/.test(item.tokenDigest);
}

async function readGrantStore(path: string): Promise<Map<string, StoredGrant>> {
  let text: string;
  try {
    text = await readFile(path, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return new Map();
    throw error;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Emergency grant store is malformed; refusing to continue.');
  }
  if (!parsed || typeof parsed !== 'object' ||
      (parsed as { schemaVersion?: unknown }).schemaVersion !== 1 ||
      !Array.isArray((parsed as { grants?: unknown }).grants)) {
    throw new Error('Emergency grant store has an unsupported schema; refusing to continue.');
  }
  const grants = new Map<string, StoredGrant>();
  for (const item of (parsed as { grants: unknown[] }).grants) {
    if (!validStoredGrant(item) || grants.has(item.grantId)) {
      throw new Error('Emergency grant store contains invalid or duplicate records; refusing to continue.');
    }
    grants.set(item.grantId, { ...item });
  }
  return grants;
}

async function writeGrantStoreAtomically(path: string, grants: Map<string, StoredGrant>): Promise<void> {
  const directory = dirname(path);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const temporaryPath = path + '.' + randomUUID() + '.tmp';
  const handle = await open(temporaryPath, 'wx', 0o600);
  try {
    await handle.writeFile(JSON.stringify({ schemaVersion: 1, grants: [...grants.values()] }) + '\n', 'utf8');
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    await rename(temporaryPath, path);
    const directoryHandle = await open(directory, 'r');
    try {
      await directoryHandle.sync();
    } finally {
      await directoryHandle.close();
    }
  } catch (error) {
    await unlink(temporaryPath).catch(() => undefined);
    throw error;
  }
}

interface TransactionResult<T> {
  value: T;
  persist: boolean;
}

/**
 * A durable single-host transactional file store. The exclusive sibling lock
 * serializes cooperating processes; atomic rename and fsync make committed
 * state survive normal process restarts. A stale lock fails closed and requires
 * operator review. Do not use this adapter on a multi-host/network filesystem
 * unless that filesystem guarantees reliable exclusive-create semantics.
 */
async function withGrantTransaction<T>(
  state: GousiyaEmergencyState,
  operation: (grants: Map<string, StoredGrant>) => Promise<TransactionResult<T>>,
): Promise<T> {
  const storePath = state.grantStoreFilePath;
  await mkdir(dirname(storePath), { recursive: true, mode: 0o700 });
  const lockPath = storePath + '.lock';
  let lockHandle;
  try {
    lockHandle = await open(lockPath, 'wx', 0o600);
  } catch {
    throw new Error('Emergency grant store is locked or has a stale lock; refusing to continue.');
  }
  let ownsLock = true;
  try {
    await lockHandle.writeFile(JSON.stringify({ pid: process.pid, acquiredAt: new Date().toISOString() }), 'utf8');
    await lockHandle.sync();
    const grants = await readGrantStore(storePath);
    const result = await operation(grants);
    if (result.persist) await writeGrantStoreAtomically(storePath, grants);
    syncMap(state.grants, grants);
    return result.value;
  } finally {
    await lockHandle.close();
    if (ownsLock) await unlink(lockPath).catch(() => undefined);
    ownsLock = false;
  }
}

function validateApproval(
  approval: VerifiedGousiyaApproval,
  expectedRole: GousiyaApproverRole,
  scope: GousiyaApprovalScope,
  now: Date,
): void {
  const issuedAt = Date.parse(approval.issuedAt);
  const expiresAt = Date.parse(approval.expiresAt);
  if (!approval.subject?.trim() || approval.role !== expectedRole || approval.decision !== 'APPROVE' ||
      approval.incidentId !== scope.incidentId ||
      approval.recoveryAgentId !== scope.recoveryAgentId ||
      approval.sourceSnapshotDirectory !== scope.sourceSnapshotDirectory ||
      approval.stagingRoot !== scope.stagingRoot ||
      !Number.isFinite(issuedAt) || !Number.isFinite(expiresAt) ||
      issuedAt > now.getTime() + 30_000 || expiresAt <= now.getTime() ||
      expiresAt <= issuedAt || expiresAt - issuedAt > GOUSIYA_MAX_GRANT_TTL_MS) {
    throw new Error('Approval identity, role, decision, scope, or validity is not acceptable.');
  }
}

/**
 * Defensive, offline break-glass coordinator. Two distinct, scoped identities
 * must approve through a trusted token verifier. Grants are stored durably and
 * consumed transactionally before filesystem work. Recovery is staging-only:
 * no production promotion, destructive action, privilege escalation, or audit
 * bypass is permitted.
 */
export async function issueGousiyaEmergencyGrant(input: {
  state: GousiyaEmergencyState;
  incidentId: string;
  recoveryAgentId: string;
  sourceSnapshotDirectory: string;
  stagingRoot: string;
  reason: string;
  ownerApprovalToken: string;
  independentReviewerApprovalToken: string;
  ttlMs?: number;
  now?: Date;
}): Promise<{ grant: GousiyaEmergencyGrant; token: string }> {
  const incidentId = required(input.incidentId, 'incidentId');
  const recoveryAgentId = required(input.recoveryAgentId, 'recoveryAgentId');
  const sourceSnapshotDirectory = required(input.sourceSnapshotDirectory, 'sourceSnapshotDirectory');
  const stagingRoot = required(input.stagingRoot, 'stagingRoot');
  const reason = required(input.reason, 'reason');
  const now = input.now ?? new Date();
  const scope: GousiyaApprovalScope = {
    incidentId, recoveryAgentId, sourceSnapshotDirectory, stagingRoot, requestedAt: now.toISOString(),
  };

  let ownerApproval: VerifiedGousiyaApproval;
  let reviewerApproval: VerifiedGousiyaApproval;
  try {
    if (!input.ownerApprovalToken?.trim() || !input.independentReviewerApprovalToken?.trim()) {
      throw new Error('Both approval tokens are required.');
    }
    [ownerApproval, reviewerApproval] = await Promise.all([
      input.state.verifyApprovalToken(input.ownerApprovalToken, scope),
      input.state.verifyApprovalToken(input.independentReviewerApprovalToken, scope),
    ]);
    validateApproval(ownerApproval, 'system-owner', scope, now);
    validateApproval(reviewerApproval, 'independent-reviewer', scope, now);
    if (ownerApproval.subject === reviewerApproval.subject) {
      throw new Error('Owner and reviewer must be different authenticated identities.');
    }
  } catch {
    await audit(input.state, {
      eventType: 'GOUSIYA_EMERGENCY_GRANT_DENIED',
      actorId: 'gousiya-emergency-coordinator',
      outcome: 'DENY',
      resource: incidentId,
      occurredAt: now.toISOString(),
      details: {
        reason: 'Approval token validation failed, approvals did not match scope, or approvers were not independent.',
        productionPromotionAllowed: false,
      },
    });
    throw new Error('Emergency grant requires valid, scoped approvals from distinct owner and independent-reviewer identities.');
  }

  const ttlMs = input.ttlMs ?? GOUSIYA_DEFAULT_GRANT_TTL_MS;
  if (!Number.isSafeInteger(ttlMs) || ttlMs < 1 || ttlMs > GOUSIYA_MAX_GRANT_TTL_MS) {
    throw new Error('Emergency grant TTL must be between 1 ms and 5 minutes.');
  }

  const canonicalSource = await canonicalizePathForSafety(sourceSnapshotDirectory);
  const canonicalStaging = await canonicalizePathForSafety(stagingRoot);
  const canonicalAudit = await canonicalizePathForSafety(input.state.auditFilePath);
  const canonicalStore = await canonicalizePathForSafety(input.state.grantStoreFilePath);
  const protectedPaths = [
    ['source', canonicalSource], ['staging', canonicalStaging],
    ['audit', canonicalAudit], ['grant store', canonicalStore],
  ] as const;
  for (let i = 0; i < protectedPaths.length; i += 1) {
    for (let j = i + 1; j < protectedPaths.length; j += 1) {
      if (pathsOverlapByResolvedLocation(protectedPaths[i][1], protectedPaths[j][1])) {
        throw new Error('Emergency recovery ' + protectedPaths[i][0] + ' and ' + protectedPaths[j][0] + ' paths must be disjoint.');
      }
    }
  }

  const grantId = randomUUID();
  const token = randomBytes(32).toString('hex');
  const grant: StoredGrant = {
    grantId, incidentId, recoveryAgentId, sourceSnapshotDirectory, stagingRoot,
    issuedAt: now.toISOString(), expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
    status: 'ISSUED', tokenDigest: digest(token),
  };

  await withGrantTransaction(input.state, async (grants) => {
    grants.set(grantId, grant);
    await audit(input.state, {
      eventType: 'GOUSIYA_EMERGENCY_GRANT_ISSUED',
      actorId: ownerApproval.subject,
      outcome: 'ALLOW',
      resource: incidentId,
      occurredAt: now.toISOString(),
      details: {
        grantId, recoveryAgentId, reason: reason.slice(0, 1000),
        ownerApproverId: ownerApproval.subject,
        independentReviewerId: reviewerApproval.subject,
        ownerRole: ownerApproval.role, reviewerRole: reviewerApproval.role,
        expiresAt: grant.expiresAt, tokenLogged: false, singleUse: true,
        productionPromotionAllowed: false, protectedOriginalsModifiable: false, auditBypassAllowed: false,
      },
    });
    return { value: undefined, persist: true };
  });

  const { tokenDigest: _secret, ...publicGrant } = grant;
  return { grant: Object.freeze({ ...publicGrant }), token };
}

/** Atomically marks a grant consumed/expired before audit or filesystem work. */
export async function executeGousiyaEmergencyRecovery(input: {
  state: GousiyaEmergencyState;
  grantId: string;
  token: string;
  incidentId: string;
  now?: Date;
}): Promise<RecoveryRehearsalResult> {
  const now = input.now ?? new Date();
  const suppliedDigest = digest(input.token ?? '');
  const reservation = await withGrantTransaction(input.state, async (grants) => {
    const grant = grants.get(input.grantId);
    if (!grant || !equalDigest(grant.tokenDigest, suppliedDigest) ||
        grant.incidentId !== input.incidentId || grant.status !== 'ISSUED') {
      return { value: { kind: 'invalid' as const }, persist: false };
    }
    if (now.getTime() >= Date.parse(grant.expiresAt)) {
      grant.status = 'EXPIRED';
      return { value: { kind: 'expired' as const, grant: { ...grant } }, persist: true };
    }
    grant.status = 'CONSUMED';
    return { value: { kind: 'consumed' as const, grant: { ...grant } }, persist: true };
  });

  if (reservation.kind === 'invalid') {
    await audit(input.state, {
      eventType: 'GOUSIYA_EMERGENCY_RECOVERY_DENIED',
      actorId: 'gousiya-emergency-coordinator',
      outcome: 'DENY',
      resource: input.incidentId || 'unknown-incident',
      occurredAt: now.toISOString(),
      details: { grantId: input.grantId, reason: 'invalid, mismatched, or already-used grant', productionPromotionAllowed: false },
    });
    throw new Error('Emergency grant is invalid, mismatched, or already used.');
  }

  const grant = reservation.grant;
  if (reservation.kind === 'expired') {
    await audit(input.state, {
      eventType: 'GOUSIYA_EMERGENCY_GRANT_EXPIRED',
      actorId: 'gousiya-emergency-coordinator',
      outcome: 'DENY',
      resource: grant.incidentId,
      occurredAt: now.toISOString(),
      details: { grantId: grant.grantId, productionPromotionAllowed: false },
    });
    throw new Error('Emergency grant has expired.');
  }

  // State is already committed as CONSUMED. A failed audit write intentionally
  // prevents recovery and cannot make this grant reusable.
  await audit(input.state, {
    eventType: 'GOUSIYA_EMERGENCY_GRANT_CONSUMED',
    actorId: 'gousiya-emergency-coordinator',
    outcome: 'ALLOW',
    resource: grant.incidentId,
    occurredAt: now.toISOString(),
    details: { grantId: grant.grantId, singleUse: true, productionPromotionAllowed: false },
  });

  const result = await runRecoveryRehearsal({
    sourceSnapshotDirectory: grant.sourceSnapshotDirectory,
    stagingRoot: grant.stagingRoot,
    auditFilePath: input.state.auditFilePath,
    recoveryAgentId: grant.recoveryAgentId,
    stagingSnapshotId: 'gousiya-' + grant.grantId,
    now,
  });
  await audit(input.state, {
    eventType: 'GOUSIYA_EMERGENCY_RECOVERY_FINISHED',
    actorId: 'gousiya-emergency-coordinator',
    outcome: result.decision === 'VERIFIED' ? 'INFO' : 'HOLD',
    resource: grant.incidentId,
    occurredAt: now.toISOString(),
    details: {
      grantId: grant.grantId, decision: result.decision, verifiedFiles: result.verifiedFiles,
      originalsModified: false, promotionAllowed: false,
    },
  });
  return result;
}

export async function revokeGousiyaEmergencyGrant(input: {
  state: GousiyaEmergencyState;
  grantId: string;
  actorId: string;
  now?: Date;
}): Promise<void> {
  const actorId = required(input.actorId, 'actorId');
  const now = input.now ?? new Date();
  const revoked = await withGrantTransaction(input.state, async (grants) => {
    const grant = grants.get(input.grantId);
    if (!grant || grant.status !== 'ISSUED') {
      throw new Error('Only an unused issued grant can be revoked.');
    }
    grant.status = 'REVOKED';
    return { value: { ...grant }, persist: true };
  });
  await audit(input.state, {
    eventType: 'GOUSIYA_EMERGENCY_GRANT_REVOKED',
    actorId,
    outcome: 'DENY',
    resource: revoked.incidentId,
    occurredAt: now.toISOString(),
    details: { grantId: revoked.grantId, productionPromotionAllowed: false },
  });
}
