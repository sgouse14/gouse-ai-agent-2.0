import test from 'node:test';
import assert from 'node:assert/strict';
import { createQueueTaskRegistry } from './saqlainTaskQueueManager.ts';
import { createSaqlainTaskQueueService } from './saqlainTaskQueueService.ts';

test('queue service connects enqueue, lock, completion and monitoring counts', () => {
  const queue = createSaqlainTaskQueueService(createQueueTaskRegistry());
  const first = queue.enqueue('backup-a', new Date('2026-10-16T10:00:00.000Z'));
  const second = queue.enqueue('backup-b', new Date('2026-10-16T10:01:00.000Z'));
  assert.equal(first.managerTaskId, '01010');
  assert.equal(second.managerTaskId, '01012');

  const locked = queue.lockNextPending('backup-agent-a', new Date('2026-10-16T10:02:00.000Z'));
  assert.equal(locked?.managerTaskId, first.managerTaskId);
  assert.equal(queue.getCounts().lockedTasks, 1);
  assert.equal(queue.getCounts().pendingTasks, 1);

  const completed = queue.complete(first.managerTaskId, 'backup-agent-a', new Date('2026-10-16T10:03:00.000Z'));
  assert.equal(completed.status, 'COMPLETED');
  assert.equal(queue.getCounts().completedTasks, 1);
  assert.equal(queue.getCounts().lockedTasks, 0);
});

test('queue service fails closed on unknown task and wrong completion owner', () => {
  const queue = createSaqlainTaskQueueService(createQueueTaskRegistry());
  assert.throws(() => queue.complete('missing', 'agent-a'), /does not exist/);
  const task = queue.enqueue('backup-a');
  queue.lockNextPending('agent-a');
  assert.throws(() => queue.complete(task.managerTaskId, 'agent-b'), /current task owner/);
  assert.equal(queue.getCounts().lockedTasks, 1);
});

test('queue service marks locked tasks for timeout review and does not relabel them completed', () => {
  const queue = createSaqlainTaskQueueService(createQueueTaskRegistry());
  const task = queue.enqueue('backup-a');
  queue.lockNextPending('agent-a');
  const review = queue.markTimeoutReview(task.managerTaskId);
  assert.equal(review.status, 'TIMEOUT_REVIEW');
  assert.equal(queue.getCounts().timeoutReviewTasks, 1);
  assert.equal(queue.getCounts().completedTasks, 0);
});

test('startup recovery moves locked tasks to timeout review without completing them', () => {
  const registry = createQueueTaskRegistry();
  const queue = createSaqlainTaskQueueService(registry);
  const task = queue.enqueue('backup-interrupted');
  queue.lockNextPending('agent-a');
  const recovered = queue.recoverInterruptedTasks();
  assert.equal(recovered.length, 1);
  assert.equal(recovered[0].managerTaskId, task.managerTaskId);
  assert.equal(recovered[0].status, 'TIMEOUT_REVIEW');
  assert.equal(queue.getCounts().lockedTasks, 0);
  assert.equal(queue.getCounts().timeoutReviewTasks, 1);
  assert.equal(queue.getCounts().completedTasks, 0);
});

test('startup recovery leaves pending and terminal tasks unchanged', () => {
  const registry = createQueueTaskRegistry();
  const queue = createSaqlainTaskQueueService(registry);
  queue.enqueue('backup-pending');
  const recovered = queue.recoverInterruptedTasks();
  assert.equal(recovered.length, 0);
  assert.equal(queue.getCounts().pendingTasks, 1);
});
