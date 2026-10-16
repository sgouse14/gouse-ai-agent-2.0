import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createQueueTask,
  createQueueTaskRegistry,
  lockQueueTask,
  completeQueueTask,
} from './saqlainTaskQueueManager.ts';

test('queue registry reports real task status counts and returns immutable snapshots', () => {
  const queue = createQueueTaskRegistry();
  const pending = createQueueTask(1, 'backup-1', new Date('2026-10-16T10:00:00.000Z'));
  const locked = lockQueueTask(createQueueTask(2, 'backup-2'), 'backup-agent-a');
  queue.add(pending);
  queue.add(locked);

  assert.deepEqual(queue.getCounts(), {
    pendingTasks: 1,
    lockedTasks: 1,
    completedTasks: 0,
    failedTasks: 0,
    timeoutReviewTasks: 0,
    totalTasks: 2,
  });
  const snapshot = queue.list();
  assert.equal(snapshot.length, 2);
  assert.throws(() => queue.add(pending), /already exists/);
  assert.throws(() => queue.update({ ...locked, agentId: 'tampered' }), /cannot change/);
});

test('queue registry updates status counts only after a valid task transition', () => {
  const queue = createQueueTaskRegistry();
  const locked = lockQueueTask(createQueueTask(1, 'backup-1'), 'backup-agent-a');
  queue.add(locked);
  const completed = completeQueueTask(locked, 'backup-agent-a');
  queue.update(completed);
  assert.deepEqual(queue.getCounts(), {
    pendingTasks: 0,
    lockedTasks: 0,
    completedTasks: 1,
    failedTasks: 0,
    timeoutReviewTasks: 0,
    totalTasks: 1,
  });
  assert.throws(() => queue.update({ ...completed, status: 'LOCKED' }), /invalid status transition/);
});
