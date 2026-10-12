import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createQueueTask, lockQueueTask } from './saqlainTaskQueueManager.ts';
import { executeVerifiedBackupTask } from './saqlainBackupTaskIntegration.ts';

const bytes = (value: string) => new TextEncoder().encode(value);

test('backup queue task completes and produces reviewer-ready report only after verification', async () => {
  const root = await mkdtemp(join(tmpdir(), 'saqlain-queue-backup-'));
  try {
    const now = new Date('2026-02-01T00:00:00.000Z');
    const task = lockQueueTask(createQueueTask(1, '0001', now), 'agent-binary-1', now);
    const result = await executeVerifiedBackupTask({
      task,
      agentId: 'agent-binary-1',
      storageRoot: root,
      source: 'protected-files',
      files: [{ relativePath: 'safe/file.txt', bytes: bytes('verified bytes') }],
      snapshotId: 'verified-snapshot',
      now,
    });
    assert.equal(result.status, 'VERIFIED');
    if (result.status !== 'VERIFIED') return;
    assert.equal(result.task.status, 'COMPLETED');
    assert.equal(result.handoffReady, true);
    assert.equal(result.report.securityStatus, 'PENDING');
    assert.equal(result.report.payload.status, 'VERIFIED');
    assert.equal(await readFile(join(result.snapshot.directory, 'safe/file.txt'), 'utf8'), 'verified bytes');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('backup task is held and cannot hand off when snapshot creation fails', async () => {
  const root = await mkdtemp(join(tmpdir(), 'saqlain-queue-backup-'));
  try {
    const task = lockQueueTask(createQueueTask(1, '0001'), 'agent-binary-1');
    const result = await executeVerifiedBackupTask({
      task,
      agentId: 'agent-binary-1',
      storageRoot: root,
      source: 'protected-files',
      files: [{ relativePath: '../escape.txt', bytes: bytes('unsafe') }],
    });
    assert.equal(result.status, 'HOLD');
    assert.equal(result.handoffReady, false);
    assert.equal(result.task.status, 'FAILED');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('backup execution refuses a task not locked to the agent', async () => {
  const root = await mkdtemp(join(tmpdir(), 'saqlain-queue-backup-'));
  try {
    const task = createQueueTask(1, '0001');
    await assert.rejects(() => executeVerifiedBackupTask({
      task,
      agentId: 'agent-binary-1',
      storageRoot: root,
      source: 'gouse-ai',
      files: [{ relativePath: 'file.txt', bytes: bytes('data') }],
    }));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
