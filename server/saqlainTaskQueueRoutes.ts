import { timingSafeEqual } from 'node:crypto';
import { Router, type Request, type Response } from 'express';
import { createDurableQueueTaskRegistry } from './saqlainDurableQueueStore.ts';
import { createSaqlainTaskQueueService } from './saqlainTaskQueueService.ts';

function equalSecret(candidate: string, expected: string): boolean {
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function resolveOperator(authorization: string | undefined): string | null {
  if (!authorization?.startsWith('Bearer ')) return null;
  const token = authorization.slice(7).trim();
  if (token.length < 24 || token.length > 4096) return null;
  let configured: Record<string, string>;
  try {
    configured = JSON.parse(process.env.SAQLAIN_TASK_QUEUE_OPERATOR_TOKENS_JSON ?? '') as Record<string, string>;
  } catch { return null; }
  for (const [operatorId, expected] of Object.entries(configured ?? {})) {
    if (operatorId.trim() && typeof expected === 'string' && expected.length >= 24 && equalSecret(token, expected)) return operatorId;
  }
  return null;
}

function getService() {
  const queuePath = process.env.SAQLAIN_TASK_QUEUE_FILE?.trim();
  const auditPath = process.env.SAQLAIN_TASK_QUEUE_AUDIT_PATH?.trim();
  if (!queuePath || !auditPath) throw new Error('Task queue storage/audit configuration is missing.');
  return createSaqlainTaskQueueService(createDurableQueueTaskRegistry(queuePath), { auditFilePath: auditPath });
}

export const saqlainTaskQueueRouter = Router();

function requireOperator(req: Request, res: Response): string | null {
  const operatorId = resolveOperator(req.header('authorization'));
  if (!operatorId) {
    res.status(401).json({ error: 'Authenticated task-queue operator credential required.' });
    return null;
  }
  return operatorId;
}

/** Read-only queue review listing. Requires a configured operator bearer token. */
saqlainTaskQueueRouter.get('/review', (req, res) => {
  if (!requireOperator(req, res)) return;
  try {
    const tasks = getService().list().filter((task) => task.status === 'TIMEOUT_REVIEW');
    return res.json({ tasks });
  } catch {
    return res.status(503).json({ error: 'Task queue review is unavailable; no state was changed.' });
  }
});

/** Operator decision endpoint; retries require explicit safety confirmation. */
saqlainTaskQueueRouter.post('/:taskId/resolve', async (req: Request, res: Response) => {
  const operatorId = requireOperator(req, res);
  if (!operatorId) return;
  const { decision, reason, retrySafe } = req.body ?? {};
  if (!['REQUEUE', 'FAIL'].includes(decision) || typeof reason !== 'string' || !reason.trim() || reason.length > 2000 ||
      (retrySafe !== undefined && typeof retrySafe !== 'boolean')) {
    return res.status(400).json({ error: 'Invalid review resolution payload.' });
  }
  try {
    const task = await getService().resolveTimeoutReview(req.params.taskId, decision, {
      operatorId, reason, retrySafe: retrySafe === true,
    });
    return res.json({ task });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Task review resolution failed.';
    const status = /does not exist/i.test(message) ? 404 :
      /Only timeout-review|retry-safety|Operator identity/i.test(message) ? 409 :
      /not configured/i.test(message) ? 503 : 503;
    return res.status(status).json({ error: message });
  }
});
