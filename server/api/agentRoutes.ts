import { Router } from 'express';
import { requireAuth, requirePermission } from '../auth/context';
import { agentOrchestrator, listAgents } from '../agents';
import type { AgentId } from '../agents';

const router = Router();
router.use(requireAuth);

router.get('/agents', requirePermission('agents.read'), (_req, res) => {
  res.json({ items: listAgents() });
});

router.post('/agents/delegate', requirePermission('agents.delegate'), async (req, res) => {
  const fromAgent = String(req.body?.fromAgent || '') as AgentId;
  const toAgent = String(req.body?.toAgent || '') as AgentId;
  const action = String(req.body?.action || '');
  const payload = (req.body?.payload || {}) as Record<string, unknown>;
  const language = typeof req.body?.language === 'string' ? req.body.language : undefined;

  if (!fromAgent || !toAgent || !action) {
    return res.status(422).json({ error: 'fromAgent, toAgent and action are required' });
  }

  try {
    const result = await agentOrchestrator.delegate(fromAgent, toAgent, action, payload, language);
    if (result.status === 'rejected') return res.status(403).json(result);
    return res.json(result);
  } catch {
    return res.status(400).json({ error: 'Invalid agent request' });
  }
});

export default router;
