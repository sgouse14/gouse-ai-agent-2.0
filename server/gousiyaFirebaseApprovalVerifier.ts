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

interface FirebaseAccountRecord {
  localId?: unknown;
  disabled?: unknown;
  validSince?: unknown;
}

export interface FirebaseRestTokenActivityCheckerOptions {
  /** Firebase Web API key. Restrict it to Identity Toolkit API in Google Cloud. */
  apiKey: string;
  /** Injectable for tests; production calls the fixed Firebase Identity Toolkit account-lookup endpoint. */
  fetchAccountInfo?: (token: string) => Promise<unknown>;
}

async function fetchFirebaseAccountInfo(token: string, apiKey: string): Promise<unknown> {
  const url = new URL('https://identitytoolkit.googleapis.com/v1/accounts:lookup');
  url.searchParams.set('key', apiKey);
  const response = await fetch(url, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({ idToken: token }),
    redirect: 'error',
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) throw new Error('Firebase account status lookup failed.');
  return response.json();
}

/**
 * Uses Firebase's documented accounts:lookup response to check current account
 * state without a second package dependency. The API returns the disabled flag
 * and validSince (seconds since epoch, the revocation boundary). The JWT
 * signature and Firebase claims must already be verified by the parent verifier.
 */
export function createFirebaseRestTokenActivityChecker(
  options: FirebaseRestTokenActivityCheckerOptions,
): FirebaseTokenActivityVerifier {
  const apiKey = options.apiKey?.trim();
  if (!apiKey || apiKey.length > 4096) throw new Error('A Firebase Web API key is required for account-status checks.');
  const fetchInfo = options.fetchAccountInfo ?? ((token: string) => fetchFirebaseAccountInfo(token, apiKey));

  return async (token: string): Promise<void> => {
    const parts = typeof token === 'string' ? token.split('.') : [];
    if (parts.length !== 3 || !parts[1]) throw new Error('Malformed Firebase ID token for account-status check.');
    let claims: JsonObject;
    try {
      const parsed: unknown = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
      if (!isObject(parsed)) throw new Error('invalid claim object');
      claims = parsed;
    } catch {
      throw new Error('Malformed Firebase ID token for account-status check.');
    }
    if (typeof claims.sub !== 'string' || !claims.sub.trim() ||
        typeof claims.auth_time !== 'number' || !Number.isSafeInteger(claims.auth_time)) {
      throw new Error('Firebase ID token lacks required account-status claims.');
    }

    const response: unknown = await fetchInfo(token);
    if (!isObject(response) || !Array.isArray(response.users) || response.users.length !== 1 ||
        !isObject(response.users[0])) {
      throw new Error('Firebase account status response is invalid; refusing approval.');
    }
    const user = response.users[0] as FirebaseAccountRecord;
    if (user.localId !== claims.sub || user.disabled !== false ||
        (typeof user.validSince !== 'string' && typeof user.validSince !== 'number')) {
      throw new Error('Firebase account is disabled, missing, or not verifiable.');
    }
    const validSinceSeconds = Number(user.validSince);
    if (!Number.isFinite(validSinceSeconds) || validSinceSeconds < 0 ||
        claims.auth_time < validSinceSeconds) {
      throw new Error('Firebase ID token is revoked or account-status data is invalid.');
    }
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
