import { createPublicKey, verify as verifyRs256 } from 'node:crypto';
import type {
  GousiyaApprovalScope,
  GousiyaApprovalTokenVerifier,
  GousiyaApproverRole,
  VerifiedGousiyaApproval,
} from './gousiyaEmergencyRecovery.ts';

const FIREBASE_CERTIFICATE_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
const MAX_TOKEN_LENGTH = 16_384;
const MAX_CERTIFICATE_CACHE_SECONDS = 24 * 60 * 60;
const CLOCK_SKEW_SECONDS = 30;

interface CertificateResponse {
  certificates: Record<string, string>;
  cacheMaxAgeSeconds: number;
}

export type FirebaseTokenActivityVerifier = (token: string) => Promise<void>;

/** Minimal structural contract implemented by Firebase Admin's Auth instance. */
export interface FirebaseAdminAuthLike {
  verifyIdToken(idToken: string, checkRevoked?: boolean): Promise<unknown>;
}

/** Adapter that always asks Firebase Admin to reject disabled users and revoked tokens. */
export function createFirebaseAdminTokenActivityChecker(
  auth: FirebaseAdminAuthLike,
): FirebaseTokenActivityVerifier {
  if (!auth || typeof auth.verifyIdToken !== 'function') {
    throw new Error('A Firebase Admin Auth instance is required for revocation checks.');
  }
  return async (token: string): Promise<void> => {
    await auth.verifyIdToken(token, true);
  };
}

export interface FirebaseGousiyaVerifierOptions {
  projectId: string;
  /**
   * Required server-side check; production must use Firebase Admin
   * verifyIdToken(token, true) or an equivalent account-status/revocation service.
   */
  verifyFirebaseTokenIsActive: FirebaseTokenActivityVerifier;
  /** Injectable only for deterministic tests; production uses the fixed Google certificate endpoint. */
  fetchCertificates?: () => Promise<CertificateResponse>;
  now?: () => Date;
  /** Recent authentication requirement; defaults to five minutes. */
  maxAuthAgeSeconds?: number;
}

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 2048) {
    throw new Error('Firebase approval token has an invalid ' + field + ' claim.');
  }
  return value;
}

function parseSegment(segment: string): JsonObject {
  if (!segment || !/^[A-Za-z0-9_-]+$/.test(segment)) {
    throw new Error('Malformed Firebase ID token.');
  }
  let value: unknown;
  try {
    value = JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
  } catch {
    throw new Error('Malformed Firebase ID token.');
  }
  if (!isObject(value)) throw new Error('Malformed Firebase ID token.');
  return value;
}

async function fetchGoogleCertificates(): Promise<CertificateResponse> {
  const response = await fetch(FIREBASE_CERTIFICATE_URL, {
    method: 'GET',
    headers: { accept: 'application/json' },
    redirect: 'error',
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) throw new Error('Firebase signing certificate service is unavailable.');
  const body: unknown = await response.json();
  if (!isObject(body) || Object.keys(body).length === 0 ||
      Object.values(body).some(value => typeof value !== 'string' || !value.includes('BEGIN CERTIFICATE'))) {
    throw new Error('Firebase signing certificate response is invalid.');
  }
  const cacheControl = response.headers.get('cache-control') ?? '';
  const match = /(?:^|,)\s*max-age=(\d+)/i.exec(cacheControl);
  if (!match) throw new Error('Firebase signing certificate cache lifetime is missing.');
  const cacheMaxAgeSeconds = Math.min(Number(match[1]), MAX_CERTIFICATE_CACHE_SECONDS);
  if (!Number.isSafeInteger(cacheMaxAgeSeconds) || cacheMaxAgeSeconds < 1) {
    throw new Error('Firebase signing certificate cache lifetime is invalid.');
  }
  return { certificates: body as Record<string, string>, cacheMaxAgeSeconds };
}

/**
 * Verifies Firebase Authentication ID tokens against Google's rotating Secure
 * Token signing certificates and Firebase issuer/audience/time claims. The
 * gousiyaApproval custom claim must only be minted by a trusted server-side
 * approval service after authorization checks; client-provided claims are not
 * trusted.
 *
 * A required injected callback checks account disablement and ID-token revocation.
 * In production, wire it to Firebase Admin verifyIdToken(token, true) or an
 * equivalent authoritative identity-status service; never use a no-op callback.
 */
export function createFirebaseGousiyaApprovalVerifier(
  options: FirebaseGousiyaVerifierOptions,
): GousiyaApprovalTokenVerifier {
  const projectId = options.projectId?.trim();
  if (!projectId || !/^[A-Za-z0-9:._-]+$/.test(projectId)) {
    throw new Error('A valid Firebase project ID is required.');
  }
  if (typeof options.verifyFirebaseTokenIsActive !== 'function') {
    throw new Error('A Firebase account-status and token-revocation checker is required.');
  }
  const maxAuthAgeSeconds = options.maxAuthAgeSeconds ?? 5 * 60;
  if (!Number.isSafeInteger(maxAuthAgeSeconds) || maxAuthAgeSeconds < 1 || maxAuthAgeSeconds > 15 * 60) {
    throw new Error('maxAuthAgeSeconds must be between 1 and 900 seconds.');
  }

  const fetchCertificates = options.fetchCertificates ?? fetchGoogleCertificates;
  const now = options.now ?? (() => new Date());
  let certificateCache: { certificates: Record<string, string>; expiresAt: number } | undefined;

  async function getCertificates(): Promise<Record<string, string>> {
    const currentTime = now().getTime();
    if (certificateCache && currentTime < certificateCache.expiresAt) return certificateCache.certificates;
    const result = await fetchCertificates();
    if (!result || !isObject(result.certificates) || Object.keys(result.certificates).length === 0 ||
        !Number.isSafeInteger(result.cacheMaxAgeSeconds) ||
        result.cacheMaxAgeSeconds < 1 || result.cacheMaxAgeSeconds > MAX_CERTIFICATE_CACHE_SECONDS ||
        Object.values(result.certificates).some(value => typeof value !== 'string' || !value.includes('BEGIN '))) {
      throw new Error('Firebase signing certificate response is invalid.');
    }
    certificateCache = {
      certificates: result.certificates,
      expiresAt: currentTime + result.cacheMaxAgeSeconds * 1000,
    };
    return certificateCache.certificates;
  }

  return async (token: string, expectedScope: GousiyaApprovalScope): Promise<VerifiedGousiyaApproval> => {
    if (typeof token !== 'string' || token.length < 20 || token.length > MAX_TOKEN_LENGTH) {
      throw new Error('A valid Firebase ID token is required.');
    }
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Malformed Firebase ID token.');
    const header = parseSegment(parts[0]);
    const claims = parseSegment(parts[1]);
    if (header.alg !== 'RS256' || header.typ !== 'JWT' || typeof header.kid !== 'string' ||
        !/^[A-Za-z0-9_-]{1,256}$/.test(header.kid)) {
      throw new Error('Firebase ID token header is not accepted.');
    }

    const certificates = await getCertificates();
    const certificate = certificates[header.kid];
    if (!certificate) throw new Error('Firebase ID token signing key is unknown.');
    try {
      const signature = Buffer.from(parts[2], 'base64url');
      if (signature.length === 0) throw new Error('empty signature');
      const publicKey = createPublicKey(certificate);
      const signedContent = Buffer.from(parts[0] + '.' + parts[1], 'utf8');
      if (!verifyRs256('RSA-SHA256', signedContent, publicKey, signature)) {
        throw new Error('bad signature');
      }
    } catch {
      throw new Error('Firebase ID token signature verification failed.');
    }

    const currentSeconds = Math.floor(now().getTime() / 1000);
    const expiration = claims.exp;
    const issuedAt = claims.iat;
    const authTime = claims.auth_time;
    if (claims.aud !== projectId ||
        claims.iss !== 'https://securetoken.google.com/' + projectId ||
        typeof claims.sub !== 'string' || !claims.sub.trim() || claims.sub.length > 128 ||
        typeof expiration !== 'number' || !Number.isSafeInteger(expiration) ||
        typeof issuedAt !== 'number' || !Number.isSafeInteger(issuedAt) ||
        typeof authTime !== 'number' || !Number.isSafeInteger(authTime) ||
        expiration <= currentSeconds ||
        issuedAt > currentSeconds + CLOCK_SKEW_SECONDS ||
        authTime > currentSeconds + CLOCK_SKEW_SECONDS ||
        issuedAt > expiration || authTime > issuedAt ||
        currentSeconds - authTime > maxAuthAgeSeconds) {
      throw new Error('Firebase ID token claims are invalid, expired, or not recently authenticated.');
    }

    const approval = claims.gousiyaApproval;
    if (!isObject(approval)) throw new Error('Firebase ID token lacks a Gousiya approval claim.');
    const subject = claims.sub;
    const role = approval.role;
    if (role !== 'system-owner' && role !== 'independent-reviewer') {
      throw new Error('Gousiya approval role is invalid.');
    }
    const decision = approval.decision;
    if (decision !== 'APPROVE' && decision !== 'DENY') {
      throw new Error('Gousiya approval decision is invalid.');
    }

    const result: VerifiedGousiyaApproval = {
      approvalId: requiredString(approval.approvalId, 'Gousiya approval ID'),
      subject,
      role: role as GousiyaApproverRole,
      decision,
      incidentId: requiredString(approval.incidentId, 'incident ID'),
      recoveryAgentId: requiredString(approval.recoveryAgentId, 'recovery agent ID'),
      sourceSnapshotDirectory: requiredString(approval.sourceSnapshotDirectory, 'source path'),
      stagingRoot: requiredString(approval.stagingRoot, 'staging path'),
      issuedAt: requiredString(approval.issuedAt, 'approval issued-at'),
      expiresAt: requiredString(approval.expiresAt, 'approval expiry'),
    };

    if (result.incidentId !== expectedScope.incidentId ||
        result.recoveryAgentId !== expectedScope.recoveryAgentId ||
        result.sourceSnapshotDirectory !== expectedScope.sourceSnapshotDirectory ||
        result.stagingRoot !== expectedScope.stagingRoot) {
      throw new Error('Firebase Gousiya approval token does not match the requested incident scope.');
    }
    const approvalIssued = Date.parse(result.issuedAt);
    const approvalExpires = Date.parse(result.expiresAt);
    if (!Number.isFinite(approvalIssued) || !Number.isFinite(approvalExpires) ||
        approvalIssued > now().getTime() + CLOCK_SKEW_SECONDS * 1000 ||
        approvalExpires <= now().getTime() ||
        approvalExpires <= approvalIssued ||
        approvalExpires - approvalIssued > 5 * 60_000 ||
        approvalExpires > expiration * 1000) {
      throw new Error('Firebase Gousiya approval validity window is invalid.');
    }

    // A valid signature does not tell us whether the account is disabled or
    // the token was revoked after issuance. Production must supply a real server
    // identity-status check; its failure rejects this approval.
    await options.verifyFirebaseTokenIsActive(token);
    return result;
  };
}
