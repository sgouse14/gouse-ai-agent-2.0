import { Router, type Request, type Response } from 'express';
import {
  createFirebaseIdentityTokenAuthenticator,
  createFirebaseRestTokenActivityChecker,
} from './gousiyaFirebaseApprovalVerifier.ts';
import {
  GousiyaFirestoreWorkflowStore,
} from './gousiyaFirestoreWorkflowStore.ts';

export interface GousiyaWorkflowIdentity { uid: string }
export type GousiyaWorkflowAuthenticator = (token: string) => Promise<GousiyaWorkflowIdentity>;
export interface GousiyaWorkflowStoreApi {
  create(input: { workflowId: string; incidentId: string; actorId: string; reason: string }): Promise<unknown>;
  get(workflowId: string): Promise<unknown | null>;
  listEvents(workflowId: string): Promise<Record<string, unknown>[]>;
}
export interface GousiyaWorkflowRouterOptions {
  authenticateToken?: GousiyaWorkflowAuthenticator;
  getStore?: () => GousiyaWorkflowStoreApi;
  getOwnerUids?: () => ReadonlySet<string>;
}
const MAX_TOKEN_LENGTH = 16_384;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
let productionAuthenticator: GousiyaWorkflowAuthenticator | undefined;

function configuredAuthenticator(): GousiyaWorkflowAuthenticator {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const apiKey = process.env.FIREBASE_WEB_API_KEY?.trim();
  if (!projectId || !apiKey) throw new Error('Gousiya workflow identity verification is not configured.');
  return createFirebaseIdentityTokenAuthenticator({
    projectId,
    verifyFirebaseTokenIsActive: createFirebaseRestTokenActivityChecker({ apiKey }),
  });
}
async function authenticateConfigured(token: string): Promise<GousiyaWorkflowIdentity> {
  productionAuthenticator ??= configuredAuthenticator();
  return productionAuthenticator(token);
}
function configuredOwners(): ReadonlySet<string> {
  let parsed: unknown;
  try { parsed = JSON.parse(process.env.GOUSIYA_WORKFLOW_OWNER_UIDS_JSON ?? ''); }
  catch { throw new Error('Gousiya workflow owner allowlist is not configured.'); }
  if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > 100 ||
      !parsed.every(value => typeof value === 'string' && value.trim().length > 0 && value.length <= 128)) {
    throw new Error('Gousiya workflow owner allowlist is invalid.');
  }
  return new Set(parsed.map(value => value.trim()));
}
function configuredStore(): GousiyaWorkflowStoreApi {
  if (process.env.GOUSIYA_WORKFLOW_API_ENABLED?.trim().toLowerCase() !== 'true') {
    throw new Error('Gousiya workflow API is disabled until explicitly enabled.');
  }
  return new GousiyaFirestoreWorkflowStore();
}
function bearerToken(header: string | undefined): string | null {
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token.length >= 20 && token.length <= MAX_TOKEN_LENGTH && !/\s/.test(token) ? token : null;
}
function bodyObject(body: unknown): Record<string, unknown> | null {
  return body && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : null;
}
function sendStoreError(res: Response, error: unknown): void {
  const message = error instanceof Error ? error.message : '';
  if (/not found/i.test(message)) { res.status(404).json({ error: 'Workflow not found.' }); return; }
  if (/HTTP (401|403|429|500|502|503|504)|network|timed out|not configured|temporarily unavailable/i.test(message)) {
    res.status(503).json({ error: 'Gousiya workflow storage is temporarily unavailable.' }); return;
  }
  if (/already exists|HTTP 409|version conflict/i.test(message)) {
    res.status(409).json({ error: 'Workflow already exists or changed; reload and retry.' }); return;
  }
  res.status(400).json({ error: 'Gousiya workflow request could not be completed.' });
}

/**
 * Authenticated owner-only workflow inspection and intake API.
 * Protected recovery transitions are intentionally not exposed here until a
 * server-side evidence resolver can bind approval/grant/verification signals
 * to trusted persisted results. Request-body booleans are never trusted.
 */
export function createGousiyaWorkflowRouter(options: GousiyaWorkflowRouterOptions = {}) {
  const router = Router();
  const authenticate = options.authenticateToken ?? authenticateConfigured;
  const getStore = options.getStore ?? configuredStore;
  const getOwners = options.getOwnerUids ?? configuredOwners;

  async function authorize(req: Request, res: Response) {
    const token = bearerToken(req.header('authorization'));
    if (!token) { res.status(401).json({ error: 'A valid Firebase bearer token is required.' }); return null; }
    let identity: GousiyaWorkflowIdentity;
    try { identity = await authenticate(token); }
    catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (/not configured|network|timed out|service is unavailable|lookup failed/i.test(message)) {
        res.status(503).json({ error: 'Gousiya workflow identity verification is temporarily unavailable.' });
      } else res.status(401).json({ error: 'Firebase identity could not be verified.' });
      return null;
    }
    if (!identity || typeof identity.uid !== 'string' || !identity.uid.trim() || identity.uid.length > 128) {
      res.status(401).json({ error: 'Firebase identity could not be verified.' }); return null;
    }
    let owners: ReadonlySet<string>;
    let store: GousiyaWorkflowStoreApi;
    try { owners = getOwners(); store = getStore(); }
    catch { res.status(503).json({ error: 'Gousiya workflow API is not configured.' }); return null; }
    if (!owners.has(identity.uid)) { res.status(403).json({ error: 'Gousiya workflow owner approval is required.' }); return null; }
    return { uid: identity.uid, store };
  }

  router.post('/', async (req, res) => {
    const auth = await authorize(req, res);
    if (!auth) return;
    const body = bodyObject(req.body);
    const workflowId = body?.workflowId;
    const incidentId = body?.incidentId;
    const reason = body?.reason;
    if (typeof workflowId !== 'string' || !SAFE_ID.test(workflowId) ||
        typeof incidentId !== 'string' || !SAFE_ID.test(incidentId) ||
        typeof reason !== 'string' || !reason.trim() || reason.length > 2000) {
      res.status(400).json({ error: 'Safe workflowId, incidentId, and non-empty reason are required.' }); return;
    }
    try {
      const workflow = await auth.store.create({
        workflowId, incidentId, actorId: auth.uid, reason: reason.trim(),
      });
      res.setHeader('Cache-Control', 'no-store');
      res.status(201).json(workflow);
    } catch (error) { sendStoreError(res, error); }
  });

  router.get('/:workflowId', async (req, res) => {
    const auth = await authorize(req, res);
    if (!auth) return;
    if (!SAFE_ID.test(req.params.workflowId)) { res.status(400).json({ error: 'Safe workflowId is required.' }); return; }
    try {
      const workflow = await auth.store.get(req.params.workflowId);
      // The first iteration restricts workflow access to configured owners globally.
      // Per-incident membership checks must be added before broadening this allowlist.
      if (!workflow) { res.status(404).json({ error: 'Workflow not found.' }); return; }
      res.setHeader('Cache-Control', 'no-store');
      res.json(workflow);
    } catch (error) { sendStoreError(res, error); }
  });

  router.get('/:workflowId/events', async (req, res) => {
    const auth = await authorize(req, res);
    if (!auth) return;
    if (!SAFE_ID.test(req.params.workflowId)) { res.status(400).json({ error: 'Safe workflowId is required.' }); return; }
    try {
      const workflow = await auth.store.get(req.params.workflowId);
      if (!workflow) { res.status(404).json({ error: 'Workflow not found.' }); return; }
      const events = await auth.store.listEvents(req.params.workflowId);
      res.setHeader('Cache-Control', 'no-store');
      res.json({ workflowId: req.params.workflowId, events });
    } catch (error) { sendStoreError(res, error); }
  });

  return router;
}
