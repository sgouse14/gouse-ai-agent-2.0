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

async function getDecision(req: Request, res: Response) {
  const credential = bearer(req);
  if (!credential) {
    res.status(401).json({ error: 'A valid bearer credential is required.' });
    return null;
  }
  const request = validateGatekeeperRequest({ ...req.body, apiCredential: credential });
  if (!request) {
    res.status(400).json({ error: 'Invalid Gatekeeper request payload.' });
    return null;
  }
  try {
    return await evaluateAndAuditGatekeeperRequest(request);
  } catch {
    // Missing registry, invalid configuration, or audit failure must never fail open.
    res.status(503).json({ decision: 'HOLD', error: 'Gatekeeper unavailable; access was not granted.' });
    return null;
  }
}

function decisionStatus(decision: 'PASS' | 'HOLD' | 'BLOCK'): number {
  return decision === 'PASS' ? 200 : decision === 'HOLD' ? 423 : 403;
}

/** Policy-decision endpoint; PASS never grants internal or protected-resource access. */
saqlainGatekeeperRouter.post('/evaluate', async (req, res) => {
  const result = await getDecision(req, res);
  if (!result) return;
  return res.status(decisionStatus(result.decision)).json({
    decision: result.decision,
    requestId: result.requestId,
    reason: result.reason,
  });
});

/**
 * Narrow external communication boundary. It accepts only approved-agent
 * communication scope and does not proxy arbitrary URLs or expose internal APIs.
 */
saqlainGatekeeperRouter.post('/communication', async (req, res) => {
  const scopes = req.body?.requestedScope;
  if (!Array.isArray(scopes) || !scopes.includes('approved-agent-communication')) {
    return res.status(403).json({ error: 'approved-agent-communication scope is required.' });
  }
  const result = await getDecision(req, res);
  if (!result) return;
  if (result.decision !== 'PASS') {
    return res.status(decisionStatus(result.decision)).json({
      accepted: false,
      decision: result.decision,
      requestId: result.requestId,
      reason: result.reason,
    });
  }
  return res.status(202).json({
    accepted: true,
    decision: 'PASS',
    requestId: result.requestId,
    notice: 'Authorized communication envelope accepted; no internal API or protected resource was exposed.',
  });
});
