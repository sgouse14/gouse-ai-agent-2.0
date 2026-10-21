import type { Request, RequestHandler } from 'express';
import { appendDurableAuditEvent, type AuditEventInput } from './saqlainAuditLog.ts';
import {
  createFirebaseIdentityTokenAuthenticator,
  createFirebaseRestTokenActivityChecker,
  type FirebaseVerifiedIdentity,
} from './gousiyaFirebaseApprovalVerifier.ts';
import { buildSaqlainSecuritySummary } from './saqlainSecurity.ts';

const MAX_TOKEN_LENGTH = 16_384;

export type SaqlainSummaryIdentity = Pick<FirebaseVerifiedIdentity, 'uid'>;
export type SaqlainSummaryTokenAuthenticator = (token: string) => Promise<SaqlainSummaryIdentity>;
export type SaqlainSummaryAuditWriter = (path: string, event: AuditEventInput) => Promise<unknown>;

export interface SaqlainSecuritySummaryHandlerOptions {
  /** Injectable identity verifier for tests; production uses Firebase ID-token verification. */
  authenticateToken?: SaqlainSummaryTokenAuthenticator;
  /** Injectable for tests; production uses SAQLAIN_AUDIT_FILE. */
  getAuditFilePath?: () => string | undefined;
  /** Injectable durable audit writer for deterministic tests. */
  writeAuditEvent?: SaqlainSummaryAuditWriter;
  now?: () => Date;
}

let configuredAuthenticator: SaqlainSummaryTokenAuthenticator | undefined;

function getConfiguredAuthenticator(): SaqlainSummaryTokenAuthenticator {
  if (configuredAuthenticator) return configuredAuthenticator;

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const apiKey = process.env.FIREBASE_WEB_API_KEY?.trim();
  if (!projectId || !apiKey) {
    throw new Error('Firebase identity verification is not configured.');
  }

  configuredAuthenticator = createFirebaseIdentityTokenAuthenticator({
    projectId,
    verifyFirebaseTokenIsActive: createFirebaseRestTokenActivityChecker({ apiKey }),
  });
  return configuredAuthenticator;
}

function readBearerToken(authorization: string | undefined): string | null {
  if (!authorization?.startsWith('Bearer ')) return null;
  const token = authorization.slice(7).trim();
  if (token.length < 20 || token.length > MAX_TOKEN_LENGTH || /\s/.test(token)) return null;
  return token;
}

function isIdentityProviderUnavailable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : '';
  return /service is unavailable|account status lookup failed|certificate response is invalid|certificate cache lifetime|fetch failed|network|timed out|timeout/i.test(message);
}

/**
 * Protects the workspace-level baseline security summary with a recently
 * authenticated, active Firebase identity and durable audit-before-response.
 * The report is a fixed workspace posture report; it does not access project
 * records and must not be treated as project-membership authorization.
 */
export function createSaqlainSecuritySummaryHandler(
  options: SaqlainSecuritySummaryHandlerOptions = {},
): RequestHandler {
  const authenticateToken = options.authenticateToken ?? getConfiguredAuthenticator;
  const getAuditFilePath = options.getAuditFilePath ?? (() => process.env.SAQLAIN_AUDIT_FILE?.trim() || undefined);
  const writeAuditEvent = options.writeAuditEvent ?? appendDurableAuditEvent;
  const now = options.now ?? (() => new Date());

  return async (req, res) => {
    const token = readBearerToken(req.header('authorization'));
    if (!token) {
      return res.status(401).json({ error: 'A valid Firebase bearer token is required.' });
    }

    let authenticate: SaqlainSummaryTokenAuthenticator;
    try {
      authenticate = options.authenticateToken ?? getConfiguredAuthenticator();
    } catch {
      return res.status(503).json({ error: 'Security summary identity verification is not configured.' });
    }

    let identity: SaqlainSummaryIdentity;
    try {
      identity = await authenticate(token);
    } catch (error) {
      const status = isIdentityProviderUnavailable(error) ? 503 : 401;
      return res.status(status).json({
        error: status === 503
          ? 'Identity verification is temporarily unavailable.'
          : 'A valid active Firebase identity is required.',
      });
    }

    const auditFilePath = getAuditFilePath();
    if (!auditFilePath) {
      return res.status(503).json({ error: 'Security summary audit storage is not configured.' });
    }

    const summary = buildSaqlainSecuritySummary(req as Request);
    try {
      await writeAuditEvent(auditFilePath, {
        eventType: 'SAQLAIN_SECURITY_SUMMARY_VIEWED',
        actorId: identity.uid,
        outcome: 'INFO',
        resource: 'saqlain-security-summary',
        occurredAt: now().toISOString(),
        details: { target: summary.target },
      });
    } catch {
      return res.status(503).json({ error: 'Security summary audit is unavailable; no report was returned.' });
    }

    return res.json(summary);
  };
}
