import { Router, type Request, type Response } from 'express';
import {
  createFirebaseIdentityTokenAuthenticator,
  createFirebaseRestTokenActivityChecker,
  type FirebaseVerifiedIdentity,
} from './gousiyaFirebaseApprovalVerifier.ts';
import {
  SaqlainFirestoreAgentRegistry,
  type DurableAgentRecord,
} from './saqlainFirestoreAgentRegistry.ts';

const MAX_TOKEN_LENGTH = 16_384;
export type AgentRegistryIdentity = Pick<FirebaseVerifiedIdentity, 'uid'>;
export type AgentRegistryAuthenticator = (token: string) => Promise<AgentRegistryIdentity>;

export interface AgentRegistryApi {
  list(): Promise<DurableAgentRecord[]>;
  get(agentKey: string): Promise<DurableAgentRecord | null>;
  register(input: { agentKey: string; actorUid: string; reason: string }): Promise<DurableAgentRecord>;
  suspend(input: { agentKey: string; actorUid: string; reason: string }): Promise<DurableAgentRecord>;
  reactivate(input: { agentKey: string; actorUid: string; reason: string }): Promise<DurableAgentRecord>;
  retire(input: { agentKey: string; actorUid: string; reason: string }): Promise<DurableAgentRecord>;
}

export interface SaqlainAgentRegistryRouterOptions {
  /** Injected for tests. Production verifies Firebase signatures and current account status. */
  authenticateToken?: AgentRegistryAuthenticator;
  /** Injected for tests. Production uses the shared Firestore registry. */
  getRegistry?: () => AgentRegistryApi;
  /** Must be a server-controlled list; never read owner privileges from request JSON. */
  getOwnerUids?: () => ReadonlySet<string>;
}

function bearerToken(header: string | undefined): string | null {
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  if (token.length < 20 || token.length > MAX_TOKEN_LENGTH || /\s/.test(token)) return null;
  return token;
}

function configuredAuthenticator(): AgentRegistryAuthenticator {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const apiKey = process.env.FIREBASE_WEB_API_KEY?.trim();
  if (!projectId || !apiKey) throw new Error('Agent registry identity verification is not configured.');
  return createFirebaseIdentityTokenAuthenticator({
    projectId,
    verifyFirebaseTokenIsActive: createFirebaseRestTokenActivityChecker({ apiKey }),
  });
}

let productionAuthenticator: AgentRegistryAuthenticator | undefined;
async function authenticateWithConfiguredFirebase(token: string): Promise<AgentRegistryIdentity> {
  productionAuthenticator ??= configuredAuthenticator();
  return productionAuthenticator(token);
}

function configuredOwnerUids(): ReadonlySet<string> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(process.env.SAQLAIN_AGENT_REGISTRY_OWNER_UIDS_JSON ?? '');
  } catch {
    throw new Error('Agent registry owner allowlist is not configured.');
  }
  if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > 100 ||
      !parsed.every(value => typeof value === 'string' && value.trim().length > 0 && value.length <= 256)) {
    throw new Error('Agent registry owner allowlist is invalid.');
  }
  return new Set(parsed.map(value => value.trim()));
}

function configuredRegistry(): AgentRegistryApi {
  if (process.env.SAQLAIN_AGENT_REGISTRY_ENABLED?.trim().toLowerCase() !== 'true') {
    throw new Error('Agent registry API is disabled until explicitly enabled.');
  }
  return new SaqlainFirestoreAgentRegistry();
}

function safeParam(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value);
}
function reasonFromBody(body: unknown): string | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const value = (body as Record<string, unknown>).reason;
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 2000
    ? value.trim() : null;
}
function sendSafeError(res: Response, error: unknown): void {
  const message = error instanceof Error ? error.message : '';
  if (/already registered|already suspended|Only active agents|Only suspended agents|Retired agents|Agent is already retired/i.test(message)) {
    res.status(409).json({ error: message });
    return;
  }
  if (/Agent not found/i.test(message)) {
    res.status(404).json({ error: 'Agent not found.' });
    return;
  }
  if (/could not commit after repeated conflicts|could not commit after repeated conflicts|repeated conflicts|HTTP (429|500|502|503|504)|failed with HTTP (429|500|502|503|504)|timed out|network/i.test(message)) {
    res.status(503).json({ error: 'Agent registry is temporarily unavailable; retry later.' });
    return;
  }
  res.status(400).json({ error: 'Agent registry request could not be completed.' });
}

/**
 * Owner-only lifecycle API. Identity is derived from a verified Firebase token;
 * owner authorization comes from a server-controlled UID allowlist. Agent keys,
 * owner approval flags, and actor identities supplied in request bodies are ignored.
 */
export function createSaqlainAgentRegistryRouter(options: SaqlainAgentRegistryRouterOptions = {}) {
  const router = Router();
  const authenticate = options.authenticateToken ?? authenticateWithConfiguredFirebase;
  const getRegistry = options.getRegistry ?? configuredRegistry;
  const getOwners = options.getOwnerUids ?? configuredOwnerUids;

  async function authorize(req: Request, res: Response): Promise<{ uid: string; registry: AgentRegistryApi } | null> {
    const token = bearerToken(req.header('authorization'));
    if (!token) {
      res.status(401).json({ error: 'A valid Firebase bearer token is required.' });
      return null;
    }
    let identity: AgentRegistryIdentity;
    try {
      identity = await authenticate(token);
    } catch {
      res.status(401).json({ error: 'Firebase identity could not be verified.' });
      return null;
    }
    if (!identity || typeof identity.uid !== 'string' || !identity.uid.trim() || identity.uid.length > 256) {
      res.status(401).json({ error: 'Firebase identity could not be verified.' });
      return null;
    }
    let owners: ReadonlySet<string>;
    let registry: AgentRegistryApi;
    try {
      owners = getOwners();
      registry = getRegistry();
    } catch {
      res.status(503).json({ error: 'Agent registry is not configured.' });
      return null;
    }
    if (!owners.has(identity.uid)) {
      res.status(403).json({ error: 'Agent registry owner approval is required.' });
      return null;
    }
    return { uid: identity.uid, registry };
  }

  router.get('/', async (req, res) => {
    const auth = await authorize(req, res);
    if (!auth) return;
    try {
      const records = await auth.registry.list();
      res.setHeader('Cache-Control', 'no-store');
      res.json(records.filter(record => record.ownerUid === auth.uid));
    } catch (error) { sendSafeError(res, error); }
  });

  router.post('/', async (req, res) => {
    const auth = await authorize(req, res);
    if (!auth) return;
    const body = req.body as Record<string, unknown> | undefined;
    const agentKey = body?.agentKey;
    const reason = reasonFromBody(body);
    if (!safeParam(agentKey) || !reason) {
      res.status(400).json({ error: 'Safe agentKey and non-empty reason are required.' });
      return;
    }
    try {
      const record = await auth.registry.register({ agentKey, actorUid: auth.uid, reason });
      res.setHeader('Cache-Control', 'no-store');
      res.status(201).json(record);
    } catch (error) { sendSafeError(res, error); }
  });

  for (const operation of ['suspend', 'reactivate', 'retire'] as const) {
    router.post('/:agentKey/' + operation, async (req, res) => {
      const auth = await authorize(req, res);
      if (!auth) return;
      if (!safeParam(req.params.agentKey)) {
        res.status(400).json({ error: 'Safe agentKey is required.' });
        return;
      }
      const reason = reasonFromBody(req.body);
      if (!reason) {
        res.status(400).json({ error: 'A non-empty reason is required.' });
        return;
      }
      try {
        const current = await auth.registry.get(req.params.agentKey);
        // Return the same response for absent and non-owned agents to avoid enumeration.
        if (!current || current.ownerUid !== auth.uid) {
          res.status(404).json({ error: 'Agent not found.' });
          return;
        }
        const record = await auth.registry[operation]({
          agentKey: req.params.agentKey, actorUid: auth.uid, reason,
        });
        res.setHeader('Cache-Control', 'no-store');
        res.json(record);
      } catch (error) { sendSafeError(res, error); }
    });
  }

  return router;
}
