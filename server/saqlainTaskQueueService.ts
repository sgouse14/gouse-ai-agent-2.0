import {
  type QueueTask,
  type QueueTaskRegistry,
  createQueueTask,
  lockQueueTask,
  completeQueueTask,
  markTaskTimeout,
  saqlainTaskQueue,
} from './saqlainTaskQueueManager.ts';
import { appendDurableAuditEvent } from './saqlainAuditLog.ts';

function requiredAuditPath(explicit?: string): string {
  const path = explicit?.trim() || process.env.SAQLAIN_TASK_QUEUE_AUDIT_PATH?.trim();
  if (!path) throw new Error('SAQLAIN_TASK_QUEUE_AUDIT_PATH is not configured.');
  return path;
}

export function createSaqlainTaskQueueService(
  registry: QueueTaskRegistry = saqlainTaskQueue,
  options: { auditFilePath?: string; actorId?: string } = {},
) {
  async function auditDecision(eventType: string, task: QueueTask, actorId: string, outcome: 'ALLOW' | 'DENY' | 'HOLD', details: Record<string, unknown> = {}, auditPath?: string): Promise<void> {
    await appendDurableAuditEvent(requiredAuditPath(auditPath ?? options.auditFilePath), {
      eventType,
      actorId,
      outcome,
      resource: 'saqlain-task-queue',
      taskId: task.managerTaskId,
      details: { status: task.status, backupTaskId: task.backupTaskId, ...details },
    });
  }

  function enqueue(backupTaskId: string, now = new Date()): QueueTask {
    const existing = registry.list();
    const maxSequence = existing.reduce((max, task) => {
      const numericId = Number(task.managerTaskId);
      if (!Number.isSafeInteger(numericId) || numericId < 1010 || (numericId - 1010) % 2 !== 0) return max;
      return Math.max(max, (numericId - 1010) / 2 + 1);
    }, 0);
    const task = createQueueTask(maxSequence + 1, backupTaskId, now);
    registry.add(task);
    return task;
  }

  function lockNextPending(agentId: string, now = new Date()): QueueTask | null {
    const task = registry.list().find((candidate) => candidate.status === 'PENDING');
    if (!task) return null;
    const locked = lockQueueTask(task, agentId, now);
    registry.update(locked);
    return locked;
  }

  function complete(managerTaskId: string, agentId: string, now = new Date()): QueueTask {
    const task = registry.list().find((candidate) => candidate.managerTaskId === managerTaskId);
    if (!task) throw new Error('Queue task does not exist.');
    const completed = completeQueueTask(task, agentId, now);
    registry.update(completed);
    return completed;
  }

  function recoverInterruptedTasks(): QueueTask[] {
    const recovered: QueueTask[] = [];
    for (const task of registry.list()) {
      if (task.status !== 'LOCKED') continue;
      const review = markTaskTimeout(task);
      registry.update(review);
      recovered.push(review);
    }
    return recovered;
  }

  function markTimeoutReview(managerTaskId: string): QueueTask {
    const task = registry.list().find((candidate) => candidate.managerTaskId === managerTaskId);
    if (!task) throw new Error('Queue task does not exist.');
    const timedOut = markTaskTimeout(task);
    registry.update(timedOut);
    return timedOut;
  }

  async function resolveTimeoutReview(
    managerTaskId: string,
    decision: 'REQUEUE' | 'FAIL',
    input: { operatorId: string; reason: string; retrySafe: boolean; auditVerified: boolean },
    now = new Date(),
  ): Promise<QueueTask> {
    const task = registry.list().find((candidate) => candidate.managerTaskId === managerTaskId);
    if (!task) throw new Error('Queue task does not exist.');
    if (task.status !== 'TIMEOUT_REVIEW') throw new Error('Only timeout-review tasks can be resolved.');
    if (!input.operatorId?.trim() || !input.reason?.trim()) throw new Error('Operator identity and reason are required.');
    if (decision === 'REQUEUE' && (!input.retrySafe || !input.auditVerified)) {
      await auditDecision('QUEUE_TIMEOUT_REQUEUE_DENIED', task, input.operatorId, 'DENY', { reason: input.reason, retrySafe: input.retrySafe, auditVerified: input.auditVerified }, options.auditFilePath);
      throw new Error('Requeue requires explicit retry-safety and audit verification.');
    }
    const next: QueueTask = decision === 'REQUEUE'
      ? { ...task, agentId: null, status: 'PENDING', lockedAt: null, completedAt: null }
      : { ...task, status: 'FAILED', completedAt: now.toISOString() };
    // Audit first; if audit persistence fails, the task state remains unchanged.
    await auditDecision('QUEUE_TIMEOUT_REVIEW_RESOLVED', task, input.operatorId, decision === 'REQUEUE' ? 'ALLOW' : 'HOLD', {
      reason: input.reason, decision, retrySafe: input.retrySafe, auditVerified: input.auditVerified,
    }, options.auditFilePath);
    registry.update(next);
    return next;
  }

  return Object.freeze({
    enqueue, lockNextPending, complete, markTimeoutReview, recoverInterruptedTasks,
    resolveTimeoutReview, getCounts: () => registry.getCounts(), list: () => registry.list(),
  });
}
