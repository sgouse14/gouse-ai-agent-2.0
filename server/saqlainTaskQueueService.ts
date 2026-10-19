import {
  type QueueTask,
  type QueueTaskRegistry,
  createQueueTask,
  lockQueueTask,
  completeQueueTask,
  markTaskTimeout,
  saqlainTaskQueue,
} from './saqlainTaskQueueManager.ts';

/**
 * Application service that makes queue mutations visible to monitoring.
 * The default registry is process-local; inject a durable transactional adapter
 * when the queue moves to a database.
 */
export function createSaqlainTaskQueueService(registry: QueueTaskRegistry = saqlainTaskQueue) {
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

  function markTimeoutReview(managerTaskId: string): QueueTask {
    const task = registry.list().find((candidate) => candidate.managerTaskId === managerTaskId);
    if (!task) throw new Error('Queue task does not exist.');
    const timedOut = markTaskTimeout(task);
    registry.update(timedOut);
    return timedOut;
  }

  return Object.freeze({ enqueue, lockNextPending, complete, markTimeoutReview, getCounts: () => registry.getCounts(), list: () => registry.list() });
}
