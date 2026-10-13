import { Router, type Request, type Response } from 'express';
import {
  evaluateAndAuditGatekeeperRequest,
  validateGatekeeperRequest,
} from './saqlainGatekeeperService.ts';

export const saqlainGatekeeperRouter = Router();

function bearer(req: Request): string | null {
  const value = req.header('authorization');
  if (!value?.startsWith('Bearer ')) return null;
  const token = value.slice(7).trim();
  return token.length >= 24 && token.length <= 4096 ? token : null;
}

async function evaluate(req: Request, res: Response) {
  const credential = bearer(req);
  if (!credential) return res.status(401).json({ error: 'A valid bearer credential is required.' });
  const request = validateGatekeeperRequest({ ...req.body, apiCredential: credential });
  if (!request) return res.status(400).json({ error: 'Invalid Gatekeeper request payload.' });
  try {
    const result = await evaluateAndAuditGatekeeperRequest(request);
    const status = result.decision === 'PASS' ? 200 : result.decision === 'HOLD' ? 423 : 403;
    return res.status(status).json({
      decision: result.decision,
      requestId: result.requestId,
      reason: result.reason,
      // Never echo the supplied credential.
    });
  } catch {
    // Missing registry, invalid configuration, or audit failure must never fail open.
    return res.status(503).json({ decision: 'HOLD', error: 'Gatekeeper unavailable; access was not granted.' });
  }
}

/** Policy-decision endpoint; it never grants internal or protected-resource access. */
saqlainGatekeeperRouter.post('/evaluate', evaluate);

/**
 * Narrow external communication boundary. This handler is the only operation
 * performed after a PASS; it does not proxy arbitrary URLs or expose internal APIs.
 */
saqlainGatekeeperRouter.post('/communication', async (req, res) => {
  const requestedScope = req.body?.requestedScope;
  if (!Array.isArray(requestedScope) || !requestedScope.includes('approved-agent-communication')) {
    return res.status(403).json({ error: 'approved-agent-communication scope is required.' });
  }
  const result = await evaluate(req, res);
  if (res.headersSent) return result;
  return res.status(500).json({ error: 'Communication request was not accepted.' });
});
