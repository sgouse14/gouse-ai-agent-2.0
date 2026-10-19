import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, open, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createQueueTask, lockQueueTask, completeQueueTask } from './saqlainTaskQueueManager.ts';
import { createDurableQueueTaskRegistry } from './saqlainDurableQueueStore.ts';

test('durable queue survives registry recreation and preserves status counts', async () => {
  const root = await mkdtemp(join(tmpdir(), 'saqlain-durable-queue-'));
  const path = join(root, 'state', 'queue.json');
  try {
    const queue = createDurableQueueTaskRegistry(path);
    const pending = createQueueTask(1, 'backup-1');
    queue.add(pending);
    const locked = lockQueueTask(pending, 'agent-a');
    queue.update(locked);
    const completed = completeQueueTask(locked, 'agent-a');
    queue.update(completed);

    const restarted = createDurableQueueTaskRegistry(path);
    assert.deepEqual(restarted.list(), [completed]);
    assert.equal(restarted.getCounts().completedTasks, 1);
    assert.equal(restarted.getCounts().lockedTasks, 0);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('durable queue rejects corrupt data and never silently overwrites it', async () => {
  const root = await mkdtemp(join(tmpdir(), 'saqlain-durable-queue-corrupt-'));
  const path = join(root, 'queue.json');
  try {
    await writeFile(path, '{bad json', 'utf8');
    const queue = createDurableQueueTaskRegistry(path);
    assert.throws(() => queue.getCounts(), /corrupt/);
    assert.equal(await readFile(path, 'utf8'), '{bad json');
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('durable queue fails closed on an existing lock file', async () => {
  const root = await mkdtemp(join(tmpdir(), 'saqlain-durable-queue-lock-'));
  const path = join(root, 'queue.json');
  try {
    const lock = await open(path + '.lock', 'wx');
    await lock.close();
    const queue = createDurableQueueTaskRegistry(path);
    assert.throws(() => queue.add(createQueueTask(1, 'backup-1')), /locked/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('durable queue rejects invalid transitions and does not persist them', async () => {
  const root = await mkdtemp(join(tmpdir(), 'saqlain-durable-queue-transition-'));
  const path = join(root, 'queue.json');
  try {
    const queue = createDurableQueueTaskRegistry(path);
    const pending = createQueueTask(1, 'backup-1');
    queue.add(pending);
    assert.throws(() => queue.update({ ...pending, status: 'COMPLETED' }), /invalid status transition/);
    assert.equal(queue.list()[0].status, 'PENDING');
  } finally { await rm(root, { recursive: true, force: true }); }
});
