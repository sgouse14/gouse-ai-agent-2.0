import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { SAQLAIN_BACKUP_TEAM, SAQLAIN_BACKUP_INTERVAL_MINUTES } from './saqlainBackupTeam.ts';
import { createSaqlainBackupRuntime, SAQLAIN_RUNTIME_INTERVAL_MS } from './saqlainBackupRuntime.ts';

test('runtime runs four backup agents, one recovery agent, and one communication agent in a cycle', async () => {
  const calls: string[] = [];
  const runtime = createSaqlainBackupRuntime({
    runAgentCycle: async (agent) => {
      calls.push(agent.id);
      return { status: 'VERIFIED', summary: 'snapshot and integrity verified' };
    },
    now: () => new Date('2026-10-12T00:00:00.000Z'),
  });
  const report = await runtime.runCycle();
  assert.equal(SAQLAIN_BACKUP_TEAM.length, 6);
  assert.equal(SAQLAIN_BACKUP_TEAM.filter((agent) => agent.role === 'BACKUP').length, 4);
  assert.equal(SAQLAIN_BACKUP_TEAM.filter((agent) => agent.role === 'RECOVERY').length, 1);
  assert.equal(SAQLAIN_BACKUP_TEAM.filter((agent) => agent.role === 'COMMUNICATION').length, 1);
  assert.deepEqual(calls.sort(), SAQLAIN_BACKUP_TEAM.map((agent) => agent.id).sort());
  assert.equal(report.status, 'VERIFIED');
  assert.equal(report.results.length, 6);
  assert.equal(report.results.find((result) => result.role === 'COMMUNICATION')?.status, 'VERIFIED');
  assert.equal(runtime.getState().lastReport?.cycleId, report.cycleId);
});

test('runtime schedules a cycle every 30 minutes and supports stop', () => {
  let scheduledCallback: (() => void) | null = null;
  let scheduledMs = 0;
  let cleared = false;
  const handle = 1 as unknown as ReturnType<typeof setInterval>;
  const runtime = createSaqlainBackupRuntime({
    runAgentCycle: async () => ({ status: 'VERIFIED' }),
    setIntervalFn: (callback, milliseconds) => {
      scheduledCallback = callback;
      scheduledMs = milliseconds;
      return handle;
    },
    clearIntervalFn: (received) => {
      assert.equal(received, handle);
      cleared = true;
    },
  });
  runtime.start({ runImmediately: false });
  assert.equal(runtime.getState().running, true);
  assert.equal(scheduledMs, 30 * 60 * 1000);
  assert.equal(SAQLAIN_BACKUP_INTERVAL_MINUTES, 30);
  assert.equal(SAQLAIN_RUNTIME_INTERVAL_MS, 30 * 60 * 1000);
  assert.ok(scheduledCallback);
  runtime.stop();
  assert.equal(cleared, true);
  assert.equal(runtime.getState().running, false);
});

test('runtime prevents overlapping cycles and holds failed agent work', async () => {
  let release: (() => void) | undefined;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const runtime = createSaqlainBackupRuntime({
    runAgentCycle: async (agent) => {
      if (agent.id === SAQLAIN_BACKUP_TEAM[0].id) {
        await gate;
        return { status: 'VERIFIED' };
      }
      if (agent.id === SAQLAIN_BACKUP_TEAM[1].id) throw new Error('source unavailable');
      return { status: 'VERIFIED' };
    },
  });
  const first = runtime.runCycle();
  const second = runtime.runCycle();
  assert.equal(first, second);
  release?.();
  const report = await first;
  assert.equal(report.status, 'PARTIAL');
  assert.equal(report.results.find((result) => result.agentId === SAQLAIN_BACKUP_TEAM[1].id)?.status, 'FAILED');
  assert.equal(report.results.find((result) => result.role === 'RECOVERY')?.status, 'HOLD');
});

test('audit write failure downgrades the agent result to HOLD', async () => {
  const root = await mkdtemp(join(tmpdir(), 'saqlain-runtime-audit-'));
  try {
    const auditPath = join(root, 'events.jsonl');
    // A pre-existing exclusive lock simulates another writer or stale-lock condition.
    const { open } = await import('node:fs/promises');
    const lock = await open(auditPath + '.lock', 'wx');
    await lock.close();
    const runtime = createSaqlainBackupRuntime({
      auditFilePath: auditPath,
      runAgentCycle: async () => ({ status: 'VERIFIED' }),
    });
    const report = await runtime.runCycle();
    assert.equal(report.status, 'HOLD');
    assert.ok(report.results.every((result) => result.status === 'HOLD'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
