import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { readVerifiedAuditLog } from './saqlainAuditLog.ts';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { readVerifiedAuditLog } from './saqlainAuditLog.ts';
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

test('timeout review requeue requires safety checks and leaves an audit trail', async () => {
  const root = await mkdtemp(join(tmpdir(), 'saqlain-queue-review-'));
  const auditFilePath = join(root, 'audit.jsonl');
  try {
    const queue = createSaqlainTaskQueueService(createQueueTaskRegistry(), { auditFilePath, actorId: 'test-operator' });
    const task = queue.enqueue('backup-uncertain');
    queue.lockNextPending('agent-a');
    queue.markTimeoutReview(task.managerTaskId);
    await assert.rejects(
      queue.resolveTimeoutReview(task.managerTaskId, 'REQUEUE', {
        operatorId: 'operator-1', reason: 'Not verified', retrySafe: false, auditVerified: false,
      }),
      /retry-safety and audit verification/,
    );
    assert.equal(queue.getCounts().timeoutReviewTasks, 1);
    const resolved = await queue.resolveTimeoutReview(task.managerTaskId, 'REQUEUE', {
      operatorId: 'operator-1', reason: 'Verified operation is idempotent', retrySafe: true, auditVerified: true,
    });
    assert.equal(resolved.status, 'PENDING');
    assert.equal(queue.getCounts().pendingTasks, 1);
    const records = await readVerifiedAuditLog(auditFilePath);
    assert.equal(records.length, 2);
    assert.equal(records[0].outcome, 'DENY');
    assert.equal(records[1].outcome, 'ALLOW');
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('timeout review can be closed as failed with an auditable operator reason', async () => {
  const root = await mkdtemp(join(tmpdir(), 'saqlain-queue-review-fail-'));
  const auditFilePath = join(root, 'audit.jsonl');
  try {
    const queue = createSaqlainTaskQueueService(createQueueTaskRegistry(), { auditFilePath });
    const task = queue.enqueue('backup-uncertain');
    queue.lockNextPending('agent-a');
    queue.markTimeoutReview(task.managerTaskId);
    const resolved = await queue.resolveTimeoutReview(task.managerTaskId, 'FAIL', {
      operatorId: 'operator-2', reason: 'Unable to verify side effects', retrySafe: false, auditVerified: true,
    });
    assert.equal(resolved.status, 'FAILED');
    const records = await readVerifiedAuditLog(auditFilePath);
    assert.equal(records.length, 1);
    assert.equal(records[0].outcome, 'HOLD');
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('timeout-review requeue requires explicit safe-retry confirmation and records an audit event', async () => {
  const root = await mkdtemp(join(tmpdir(), 'saqlain-queue-review-'));
  const auditFilePath = join(root, 'audit.jsonl');
  try {
    const queue = createSaqlainTaskQueueService(createQueueTaskRegistry());
    const task = queue.enqueue('backup-review');
    queue.lockNextPending('agent-a');
    queue.markTimeoutReview(task.managerTaskId);

    await assert.rejects(() => queue.resolveTimeoutReview({
      managerTaskId: task.managerTaskId,
      decision: 'REQUEUE',
      actorId: 'operator-1',
      auditFilePath,
      reason: 'Investigated partial run',
    }), /explicit confirmation/);
    assert.equal(queue.getCounts().timeoutReviewTasks, 1);

    const resolved = await queue.resolveTimeoutReview({
      managerTaskId: task.managerTaskId,
      decision: 'REQUEUE',
      actorId: 'operator-1',
      auditFilePath,
      reason: 'Verified operation is idempotent and partial output was isolated',
      idempotentRetryConfirmed: true,
      now: new Date('2026-10-19T12:00:00.000Z'),
    });
    assert.equal(resolved.status, 'PENDING');
    assert.equal(resolved.agentId, null);
    assert.equal(queue.getCounts().pendingTasks, 1);
    const audit = await readVerifiedAuditLog(auditFilePath);
    assert.equal(audit.length, 1);
    assert.equal(audit[0].eventType, 'QUEUE_TIMEOUT_REVIEW_RESOLUTION');
    assert.equal(audit[0].actorId, 'operator-1');
    assert.equal(audit[0].taskId, task.managerTaskId);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('timeout-review can be explicitly failed and cannot resolve unrelated states', async () => {
  const root = await mkdtemp(join(tmpdir(), 'saqlain-queue-fail-review-'));
  const auditFilePath = join(root, 'audit.jsonl');
  try {
    const queue = createSaqlainTaskQueueService(createQueueTaskRegistry());
    const task = queue.enqueue('backup-review-fail');
    await assert.rejects(() => queue.resolveTimeoutReview({
      managerTaskId: task.managerTaskId,
      decision: 'FAIL',
      actorId: 'operator-1',
      auditFilePath,
      reason: 'not in review',
    }), /Only timeout-review tasks/);
    queue.lockNextPending('agent-a');
    queue.markTimeoutReview(task.managerTaskId);
    const failed = await queue.resolveTimeoutReview({
      managerTaskId: task.managerTaskId,
      decision: 'FAIL',
      actorId: 'operator-1',
      auditFilePath,
      reason: 'Evidence shows task cannot safely be retried',
    });
    assert.equal(failed.status, 'FAILED');
    assert.equal(queue.getCounts().failedTasks, 1);
    assert.equal((await readVerifiedAuditLog(auditFilePath)).length, 1);
  } finally { await rm(root, { recursive: true, force: true }); }
});
