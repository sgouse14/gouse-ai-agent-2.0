import { randomUUID } from 'node:crypto';
import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, basename, join } from 'node:path';
import type { QueueTask, QueueTaskCounts, QueueTaskRegistry, QueueTaskStatus } from './saqlainTaskQueueManager.ts';

interface QueueFile {
  schemaVersion: 1;
  tasks: QueueTask[];
}

const STATUSES = new Set<QueueTaskStatus>(['PENDING', 'LOCKED', 'COMPLETED', 'FAILED', 'TIMEOUT_REVIEW']);

function validateTask(value: unknown): value is QueueTask {
  if (!value || typeof value !== 'object') return false;
  const task = value as Record<string, unknown>;
  return typeof task.managerTaskId === 'string' && /^\d{5,}$/.test(task.managerTaskId) &&
    typeof task.backupTaskId === 'string' && task.backupTaskId.length > 0 &&
    (typeof task.agentId === 'string' || task.agentId === null) &&
    typeof task.status === 'string' && STATUSES.has(task.status as QueueTaskStatus) &&
    typeof task.createdAt === 'string' && Number.isFinite(Date.parse(task.createdAt)) &&
    (typeof task.lockedAt === 'string' || task.lockedAt === null) &&
    (typeof task.completedAt === 'string' || task.completedAt === null) &&
    task.workCycleMinutes === 20;
}

function readQueue(path: string): QueueFile {
  if (!existsSync(path)) return { schemaVersion: 1, tasks: [] };
  let parsed: unknown;
  try { parsed = JSON.parse(readFileSync(path, 'utf8')); }
  catch { throw new Error('Durable queue file is unreadable or corrupt; refusing to overwrite it.'); }
  if (!parsed || typeof parsed !== 'object') throw new Error('Durable queue file has an invalid shape.');
  const record = parsed as Record<string, unknown>;
  if (record.schemaVersion !== 1 || !Array.isArray(record.tasks) || !record.tasks.every(validateTask)) {
    throw new Error('Durable queue file failed schema validation; refusing to overwrite it.');
  }
  const ids = record.tasks.map((task) => (task as QueueTask).managerTaskId);
  if (new Set(ids).size !== ids.length) throw new Error('Durable queue file contains duplicate task IDs.');
  return { schemaVersion: 1, tasks: (record.tasks as QueueTask[]).map((task) => ({ ...task })) };
}

/**
 * Synchronous JSON-file queue registry for single-process deployments.
 * Each mutation obtains an exclusive lock, re-reads current state, validates
 * transitions, fsyncs a temporary file, then atomically renames it into place.
 * This is not a distributed database; lock contention fails closed.
 */
export function createDurableQueueTaskRegistry(filePath: string): QueueTaskRegistry {
  if (!filePath.trim()) throw new Error('Durable queue file path is required.');
  const lockPath = filePath + '.lock';

  function withLock<T>(operation: (queue: QueueFile) => { queue: QueueFile; result: T; changed: boolean }): T {
    mkdirSync(dirname(filePath), { recursive: true, mode: 0o700 });
    let lockFd: number;
    try { lockFd = openSync(lockPath, 'wx', 0o600); }
    catch { throw new Error('Durable queue is locked or lock creation failed; operation refused.'); }
    try {
      writeFileSync(lockFd, JSON.stringify({ pid: process.pid, createdAt: new Date().toISOString() }));
      fsyncSync(lockFd);
      const current = readQueue(filePath);
      const outcome = operation(current);
      if (outcome.changed) {
        const tempPath = join(dirname(filePath), '.' + basename(filePath) + '.' + randomUUID() + '.tmp');
        let tempFd: number | undefined;
        try {
          tempFd = openSync(tempPath, 'wx', 0o600);
          writeFileSync(tempFd, JSON.stringify(outcome.queue, null, 2) + '\n', 'utf8');
          fsyncSync(tempFd);
          closeSync(tempFd);
          tempFd = undefined;
          renameSync(tempPath, filePath);
          const dirFd = openSync(dirname(filePath), 'r');
          try { fsyncSync(dirFd); } finally { closeSync(dirFd); }
        } catch (error) {
          if (tempFd !== undefined) closeSync(tempFd);
          try { rmSync(tempPath, { force: true }); } catch {}
          throw error;
        }
      }
      return outcome.result;
    } finally {
      closeSync(lockFd);
      // Only remove the lock this process successfully created.
      rmSync(lockPath, { force: true });
    }
  }

  const copy = (task: QueueTask): QueueTask => ({ ...task });
  const transitions: Record<QueueTaskStatus, readonly QueueTaskStatus[]> = {
    PENDING: ['LOCKED', 'FAILED'],
    LOCKED: ['COMPLETED', 'FAILED', 'TIMEOUT_REVIEW'],
    COMPLETED: [],
    FAILED: [],
    TIMEOUT_REVIEW: ['PENDING', 'FAILED'],
  };
  return {
    add(task) {
      if (!validateTask(task)) throw new Error('Invalid queue task.');
      withLock((queue) => {
        if (queue.tasks.some((item) => item.managerTaskId === task.managerTaskId)) throw new Error('Queue task managerTaskId already exists.');
        return { queue: { ...queue, tasks: [...queue.tasks, copy(task)] }, result: undefined, changed: true };
      });
    },
    update(task) {
      if (!validateTask(task)) throw new Error('Invalid queue task.');
      withLock((queue) => {
        const index = queue.tasks.findIndex((item) => item.managerTaskId === task.managerTaskId);
        if (index < 0) throw new Error('Queue task does not exist.');
        const current = queue.tasks[index];
        if (current.backupTaskId !== task.backupTaskId || current.createdAt !== task.createdAt ||
            current.workCycleMinutes !== task.workCycleMinutes) throw new Error('Queue task identity fields cannot change.');
        if (current.agentId !== task.agentId && !(current.status === 'PENDING' && task.status === 'LOCKED')) {
          throw new Error('Queue task agent assignment cannot change.');
        }
        if (current.status !== task.status && !transitions[current.status].includes(task.status)) {
          throw new Error('Queue task invalid status transition.');
        }
        const tasks = queue.tasks.map((item, i) => i === index ? copy(task) : item);
        return { queue: { ...queue, tasks }, result: undefined, changed: true };
      });
    },
    list() { return readQueue(filePath).tasks.map(copy); },
    getCounts(): QueueTaskCounts {
      const tasks = readQueue(filePath).tasks;
      return {
        pendingTasks: tasks.filter((task) => task.status === 'PENDING').length,
        lockedTasks: tasks.filter((task) => task.status === 'LOCKED').length,
        completedTasks: tasks.filter((task) => task.status === 'COMPLETED').length,
        failedTasks: tasks.filter((task) => task.status === 'FAILED').length,
        timeoutReviewTasks: tasks.filter((task) => task.status === 'TIMEOUT_REVIEW').length,
        totalTasks: tasks.length,
      };
    },
  };
}
