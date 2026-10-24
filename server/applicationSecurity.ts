import { createHash } from 'node:crypto';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import {
  createFirebaseIdentityTokenAuthenticator,
  createFirebaseRestTokenActivityChecker,
  type FirebaseVerifiedIdentity,
} from './gousiyaFirebaseApprovalVerifier.ts';

const MAX_TOKEN_LENGTH = 16_384;
const IDENTITY_CACHE_TTL_MS = 30_000;
const WINDOW_MS = 60_000;
const IP_LIMIT = 120;
const USER_LIMIT = 120;
const PROVIDER_LIMIT = 20;
const HOURLY_LIMIT = 600;
const PUBLIC_PATHS = new Set(['/api/health']);
const PROJECT_ROUTES = new Set([
  'POST /api/chat', 'POST /api/intelligence', 'POST /api/boq/generate',
  'POST /api/architecture/render-prompt', 'POST /api/architecture/analyze-image',
  'POST /api/enquiries/live-quote', 'POST /api/materials/parse-pdf-specs', 'POST /api/website/diagnostics',
]);
const PROVIDER_ROUTES = new Set([
  ...PROJECT_ROUTES, 'POST /api/search/professionals', 'GET /api/search/professionals',
  'POST /api/materials/live-prices', 'GET /api/materials/live-prices',
  'POST /api/companies/ai-generate', 'POST /api/voice/tts',
]);

interface Bucket { startedAt: number; count: number; duration: number; }
export interface ApplicationApiAuthorizationInput {
  method?: string; path: string; authorization?: string | string[];
  projectIdHeader?: string | string[]; ipAddress?: string; body?: unknown;
  query?: Record<string, unknown>;
}
export interface ApplicationApiAuthorizationResult {
  allowed: boolean; status?: number; error?: string; retryAfterSeconds?: number;
  identity?: FirebaseVerifiedIdentity; projectId?: string;
}
export interface ApplicationApiAuthorizerOptions {
  authenticateToken?: (token: string) => Promise<FirebaseVerifiedIdentity>;
  getProjectMembershipsJson?: () => string | undefined; now?: () => number;
}
declare global {
  namespace Express {
    interface Request { saqlainIdentity?: FirebaseVerifiedIdentity; saqlainProjectId?: string; }
  }
}

let productionAuthenticator: ((token: string) => Promise<FirebaseVerifiedIdentity>) | undefined;
const ipBuckets = new Map<string, Bucket>();

function normalizePath(path: string): string {
  const pathname = path.split('?')[0] || '/';
  return pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
}
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function getProductionAuthenticator(): (token: string) => Promise<FirebaseVerifiedIdentity> {
  if (productionAuthenticator) return productionAuthenticator;
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const apiKey = process.env.FIREBASE_WEB_API_KEY?.trim();
  if (!projectId || !apiKey) throw new Error('Firebase server identity configuration is missing.');
  productionAuthenticator = createFirebaseIdentityTokenAuthenticator({
    projectId, verifyFirebaseTokenIsActive: createFirebaseRestTokenActivityChecker({ apiKey }),
    maxAuthAgeSeconds: 7 * 24 * 60 * 60,
  });
  return productionAuthenticator;
}
function readBearer(value: string | string[] | undefined): string | null {
  const header = Array.isArray(value) ? (value.length === 1 ? value[0] : '') : value;
  if (typeof header !== 'string') return null;
  const match = /^Bearer ([^\s]+)$/i.exec(header);
  if (!match || match[1].length < 20 || match[1].length > MAX_TOKEN_LENGTH) return null;
  return match[1];
}
function isIdentityServiceUnavailable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : '';
  return /not configured|service is unavailable|account status lookup failed|certificate response|certificate cache lifetime|fetch failed|network|timed out|timeout|ENOTFOUND|EAI_AGAIN/i.test(message);
}
function useBucket(map: Map<string, Bucket>, key: string, limit: number, duration: number, now: number) {
  let bucket = map.get(key);
  if (!bucket || now < bucket.startedAt || now - bucket.startedAt >= duration) {
    bucket = { startedAt: now, count: 1, duration };
    map.set(key, bucket);
  } else if (bucket.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((bucket.startedAt + duration - now) / 1000)) };
  } else {
    bucket.count += 1;
  }
  if (map.size > 10_000) {
    for (const [savedKey, saved] of map) {
      if (now < saved.startedAt || now - saved.startedAt >= saved.duration) map.delete(savedKey);
    }
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Protects all API addresses with an IP-scoped request ceiling, including separately authenticated security routes. */
export function checkApplicationIpRateLimit(path: string, method: string | undefined, ipAddress: string | undefined, now = Date.now()) {
  const normalized = normalizePath(path);
  const upperMethod = (method || 'GET').toUpperCase();
  if (!normalized.startsWith('/api/') || upperMethod === 'OPTIONS' || PUBLIC_PATHS.has(normalized)) return { allowed: true as const };
  const result = useBucket(ipBuckets, ipAddress?.trim() || 'unknown-client', IP_LIMIT, WINDOW_MS, now);
  return result.allowed
    ? { allowed: true as const }
    : { allowed: false as const, retryAfterSeconds: result.retryAfterSeconds };
}
export function createApplicationIpRateLimitMiddleware(): RequestHandler {
  return (req, res, next) => {
    const result = checkApplicationIpRateLimit(req.originalUrl || req.path, req.method, req.ip || req.socket.remoteAddress);
    if (!result.allowed) {
      if (result.retryAfterSeconds) res.setHeader('Retry-After', String(result.retryAfterSeconds));
      res.status(429).json({ error: 'Request rate limit exceeded.' });
      return;
    }
    next();
  };
}
function membershipRegistry(raw: string | undefined): Map<string, Set<string>> | null {
  if (!raw?.trim()) return null;
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error('Project membership registry is invalid JSON.'); }
  if (!isObject(parsed)) throw new Error('Project membership registry must be an object keyed by Firebase UID.');
  const memberships = new Map<string, Set<string>>();
  for (const [uid, projects] of Object.entries(parsed)) {
    if (!uid.trim() || uid.length > 128 || !Array.isArray(projects) || projects.length > 10_000) {
      throw new Error('Project membership registry has an invalid entry.');
    }
    const ids = new Set<string>();
    for (const id of projects) {
      if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw new Error('Project membership registry contains an invalid project ID.');
      ids.add(id);
    }
    memberships.set(uid, ids);
  }
  return memberships;
}
function resolveProjectId(input: ApplicationApiAuthorizationInput): { projectId?: string; error?: string } {
  const header = Array.isArray(input.projectIdHeader)
    ? (input.projectIdHeader.length === 1 ? input.projectIdHeader[0] : '')
    : input.projectIdHeader;
  const body = isObject(input.body) ? input.body : {};
  const values = [header, body.projectId, input.query?.projectId]
    .filter((value): value is string => typeof value === 'string' && value.length > 0);
  if (values.some(value => value !== values[0])) return { error: 'Conflicting project identifiers were supplied.' };
  if (!values.length) return {};
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(values[0])) return { error: 'A valid project identifier is required.' };
  return { projectId: values[0] };
}
function exemptFromFirebaseGuard(input: ApplicationApiAuthorizationInput): boolean {
  const path = normalizePath(input.path);
  const method = (input.method || 'GET').toUpperCase();
  if (!path.startsWith('/api/') || method === 'OPTIONS' || PUBLIC_PATHS.has(path)) return true;
  // Dedicated Saqlain security routers retain their own authentication and authorization.
  return path === '/api/security' || path.startsWith('/api/security/');
}
export function createApplicationApiAuthorizer(options: ApplicationApiAuthorizerOptions = {}) {
  const now = options.now ?? Date.now;
  const getMemberships = options.getProjectMembershipsJson ?? (() => process.env.SAQLAIN_PROJECT_MEMBERSHIPS_JSON);
  const tokens = new Map<string, { identity: FirebaseVerifiedIdentity; expiresAt: number }>();
  const userBuckets = new Map<string, Bucket>();
  const providerBuckets = new Map<string, Bucket>();
  const hourlyBuckets = new Map<string, Bucket>();

  return async (input: ApplicationApiAuthorizationInput): Promise<ApplicationApiAuthorizationResult> => {
    const path = normalizePath(input.path);
    const method = (input.method || 'GET').toUpperCase();
    if (exemptFromFirebaseGuard({ ...input, path, method })) return { allowed: true };

    const token = readBearer(input.authorization);
    if (!token) return { allowed: false, status: 401, error: 'A valid Firebase bearer token is required.' };
    const nowMs = now();
    const tokenKey = createHash('sha256').update(token).digest('hex');
    let identity: FirebaseVerifiedIdentity;
    const cached = tokens.get(tokenKey);
    if (cached && nowMs < cached.expiresAt && cached.identity.tokenExpiresAt * 1000 > nowMs) {
      identity = cached.identity;
    } else {
      tokens.delete(tokenKey);
      let authenticate = options.authenticateToken;
      if (!authenticate) {
        try { authenticate = getProductionAuthenticator(); }
        catch { return { allowed: false, status: 503, error: 'Application identity verification is not configured.' }; }
      }
      try { identity = await authenticate(token); }
      catch (error) {
        const unavailable = isIdentityServiceUnavailable(error);
        return {
          allowed: false, status: unavailable ? 503 : 401,
          error: unavailable ? 'Identity verification is temporarily unavailable or not configured.' : 'A valid active Firebase identity is required.',
        };
      }
      tokens.set(tokenKey, { identity, expiresAt: Math.min(nowMs + IDENTITY_CACHE_TTL_MS, identity.tokenExpiresAt * 1000) });
      if (tokens.size > 10_000) {
        for (const [savedKey, saved] of tokens) if (nowMs >= saved.expiresAt) tokens.delete(savedKey);
      }
    }

    const userLimit = useBucket(userBuckets, identity.uid, USER_LIMIT, WINDOW_MS, nowMs);
    if (!userLimit.allowed) return { allowed: false, status: 429, error: 'User request rate limit exceeded.', retryAfterSeconds: userLimit.retryAfterSeconds };
    const hourlyLimit = useBucket(hourlyBuckets, identity.uid, HOURLY_LIMIT, 60 * 60 * 1000, nowMs);
    if (!hourlyLimit.allowed) return { allowed: false, status: 429, error: 'Hourly user quota exceeded.', retryAfterSeconds: hourlyLimit.retryAfterSeconds };

    const route = method + ' ' + path;
    const projectResult = resolveProjectId(input);
    if (projectResult.error) return { allowed: false, status: 400, error: projectResult.error };
    if (PROJECT_ROUTES.has(route) && !projectResult.projectId) return { allowed: false, status: 400, error: 'X-Project-ID is required for this project-scoped API.' };
    if (projectResult.projectId) {
      let memberships: Map<string, Set<string>> | null;
      try { memberships = membershipRegistry(getMemberships()); }
      catch { return { allowed: false, status: 503, error: 'Project authorization configuration is invalid.' }; }
      if (!memberships) return { allowed: false, status: 503, error: 'Project authorization is not configured.' };
      if (!memberships.get(identity.uid)?.has(projectResult.projectId)) return { allowed: false, status: 403, error: 'This identity is not authorized for the requested project.' };
    }
    if (PROVIDER_ROUTES.has(route)) {
      const limit = useBucket(providerBuckets, identity.uid, PROVIDER_LIMIT, WINDOW_MS, nowMs);
      if (!limit.allowed) return { allowed: false, status: 429, error: 'AI/provider request limit exceeded.', retryAfterSeconds: limit.retryAfterSeconds };
    }
    return { allowed: true, identity, projectId: projectResult.projectId };
  };
}
export function createApplicationSecurityMiddleware(options: ApplicationApiAuthorizerOptions = {}): RequestHandler {
  const authorize = createApplicationApiAuthorizer(options);
  return (req: Request, res: Response, next: NextFunction): void => {
    void authorize({
      method: req.method, path: req.originalUrl || req.path, authorization: req.header('authorization'),
      projectIdHeader: req.header('x-project-id'), ipAddress: req.ip || req.socket.remoteAddress,
      body: req.body, query: req.query as Record<string, unknown>,
    }).then(result => {
      if (!result.allowed) {
        if (result.retryAfterSeconds) res.setHeader('Retry-After', String(result.retryAfterSeconds));
        res.status(result.status ?? 503).json({ error: result.error ?? 'Application security check failed.' });
        return;
      }
      req.saqlainIdentity = result.identity;
      req.saqlainProjectId = result.projectId;
      next();
    }).catch(() => res.status(503).json({ error: 'Application security check failed closed.' }));
  };
}
