import { Router, type Request, type Response } from 'express';
import { isWorkspaceStateDomain, WorkspaceStateError, WorkspaceStateService } from './workspaceStateService.ts';

export function createWorkspaceStateRouter(service = new WorkspaceStateService()) {
  const router = Router();

  router.get('/:domain', async (req: Request, res: Response) => {
    const uid = req.saqlainIdentity?.uid;
    if (!uid) { res.status(401).json({ error: 'Verified sign-in is required.' }); return; }
    if (!isWorkspaceStateDomain(req.params.domain)) { res.status(400).json({ error: 'Unsupported workspace domain.' }); return; }
    try {
      const result = await service.read(uid, req.params.domain);
      if (!result) { res.status(404).json({ error: 'workspace_state_not_found' }); return; }
      res.setHeader('Cache-Control', 'no-store');
      res.json(result);
    } catch (error) {
      const status = error instanceof WorkspaceStateError && error.code === 'invalid' ? 400 : 503;
      res.status(status).json({ error: status === 400 ? 'Invalid workspace request.' : 'Workspace storage is unavailable.' });
    }
  });

  // POST is used for versioned writes because this repository's Express Router
  // type surface only exposes GET/POST. The operation remains idempotent for a
  // given expectedVersion: stale writes are rejected with 409.
  router.post('/:domain', async (req: Request, res: Response) => {
    const uid = req.saqlainIdentity?.uid;
    if (!uid) { res.status(401).json({ error: 'Verified sign-in is required.' }); return; }
    if (!isWorkspaceStateDomain(req.params.domain)) { res.status(400).json({ error: 'Unsupported workspace domain.' }); return; }
    if (!req.body || typeof req.body !== 'object' || !Object.prototype.hasOwnProperty.call(req.body, 'data') ||
        !Object.prototype.hasOwnProperty.call(req.body, 'expectedVersion')) {
      res.status(400).json({ error: 'data and expectedVersion are required.' }); return;
    }
    const expectedVersion = req.body.expectedVersion;
    if (expectedVersion !== null && typeof expectedVersion !== 'string') {
      res.status(400).json({ error: 'expectedVersion must be a version string or null.' }); return;
    }
    try {
      const result = await service.write(uid, req.params.domain, req.body.data, expectedVersion);
      res.status(200).setHeader('Cache-Control', 'no-store').json(result);
    } catch (error) {
      if (error instanceof WorkspaceStateError) {
        if (error.code === 'conflict') { res.status(409).json({ error: 'Workspace state changed; reload before saving.' }); return; }
        if (error.code === 'invalid') { res.status(400).json({ error: error.message }); return; }
      }
      res.status(503).json({ error: 'Workspace storage is unavailable.' });
    }
  });

  return router;
}

export const workspaceStateRouter = createWorkspaceStateRouter();
