import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, open, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { readVerifiedAuditLog } from './saqlainAuditLog.ts';
import { SAQLAIN_MONITORING_INTERVAL_MS, createSaqlainMonitoringRuntime } from './saqlainMonitoringRuntime.ts';
import { buildSaqlainMonitoringAlert, evaluateMonitoringSnapshot, SAQLAIN_BACKUP_MAX_CYCLE_RUNTIME_MINUTES, SAQLAIN_BACKUP_STALE_AFTER_MINUTES } from './saqlainMonitoringAgent.ts';

const healthy = {
  activeAgents: 5, lockedTasks: 1, completedTasks: 3, failedTasks: 0,
  securityHolds: 0, backupChecks: 3, recoveryChecks: 1,
};
async function setup() {
  const root = await mkdtemp(join(tmpdir(), 'saqlain-monitoring-'));
  return { root, auditFilePath: join(root, 'audit', 'events.jsonl') };
}

test('monitoring runtime collects a read-only snapshot and writes a verified audit record', async () => {
  const ctx = await setup();
  try {
    let calls = 0;
    const runtime = createSaqlainMonitoringRuntime({
      auditFilePath: ctx.auditFilePath,
      collectSnapshot: async () => { calls++; return healthy; },
      now: () => new Date('2026-10-13T00:00:00.000Z'),
    });
    const report = await runtime.runCycle();
    assert.equal(calls, 1);
    assert.equal(report.status, 'HEALTHY');
    assert.equal(report.snapshot?.status, 'HEALTHY');
    assert.equal(report.alert, null);
    const events = await readVerifiedAuditLog(ctx.auditFilePath);
    assert.equal(events.length, 1);
    assert.equal(events[0].eventType, 'SAQLAIN_MONITORING_CYCLE');
    assert.equal(events[0].details?.protectedOriginalsModified, false);
    assert.equal(events[0].details?.securityHoldsReleased, false);
  } finally { await rm(ctx.root, { recursive: true, force: true }); }
});

test('failed tasks and security holds raise alerts but do not mutate or release holds', async () => {
  const ctx = await setup();
  try {
    const runtime = createSaqlainMonitoringRuntime({
      auditFilePath: ctx.auditFilePath,
      collectSnapshot: async () => ({ ...healthy, failedTasks: 1, securityHolds: 2 }),
    });
    const report = await runtime.runCycle();
    assert.equal(report.status, 'FAILED');
    assert.match(report.alert ?? '', /FAILED/);
    assert.equal(report.snapshot?.securityHolds, 2);
    assert.equal((await readVerifiedAuditLog(ctx.auditFilePath))[0].details?.securityHoldsReleased, false);
  } finally { await rm(ctx.root, { recursive: true, force: true }); }
});

test('collector failure and invalid counters fail closed to HOLD', async () => {
  const ctx = await setup();
  try {
    let runtime = createSaqlainMonitoringRuntime({
      auditFilePath: ctx.auditFilePath,
      collectSnapshot: async () => { throw new Error('collector offline'); },
    });
    let report = await runtime.runCycle();
    assert.equal(report.status, 'HOLD');
    assert.match(report.error ?? '', /collector offline/);
    runtime = createSaqlainMonitoringRuntime({
      auditFilePath: join(ctx.root, 'audit-2', 'events.jsonl'),
      collectSnapshot: async () => ({ ...healthy, activeAgents: -1 }),
    });
    report = await runtime.runCycle();
    assert.equal(report.status, 'HOLD');
    assert.match(report.error ?? '', /Invalid monitoring count/);
  } finally { await rm(ctx.root, { recursive: true, force: true }); }
});

test('audit failure holds monitoring report and concurrent calls share one cycle', async () => {
  const ctx = await setup();
  try {
    await mkdir(join(ctx.root, 'audit'), { recursive: true });
    const lock = await open(ctx.auditFilePath + '.lock', 'wx');
    await lock.close();
    let calls = 0;
    const runtime = createSaqlainMonitoringRuntime({
      auditFilePath: ctx.auditFilePath,
      collectSnapshot: async () => { calls++; await new Promise(resolve => setTimeout(resolve, 10)); return healthy; },
    });
    const a = runtime.runCycle();
    const b = runtime.runCycle();
    assert.equal(a, b);
    const report = await a;
    assert.equal(calls, 1);
    assert.equal(report.status, 'HOLD');
    assert.match(report.error ?? '', /audit failed/i);
  } finally { await rm(ctx.root, { recursive: true, force: true }); }
});

test('scheduler runs every 30 minutes and can be stopped', () => {
  let callback: (() => void) | undefined;
  let interval = 0;
  let cleared = false;
  const handle = 1 as unknown as ReturnType<typeof setInterval>;
  const runtime = createSaqlainMonitoringRuntime({
    auditFilePath: '/tmp/saqlain-monitor-test-audit.jsonl',
    collectSnapshot: async () => healthy,
    setIntervalFn: (fn, ms) => { callback = fn; interval = ms; return handle; },
    clearIntervalFn: (received) => { assert.equal(received, handle); cleared = true; },
  });
  runtime.start({ runImmediately: false });
  assert.equal(interval, 30 * 60 * 1000);
  assert.equal(interval, SAQLAIN_MONITORING_INTERVAL_MS);
  assert.ok(callback);
  runtime.stop();
  assert.equal(cleared, true);
  assert.equal(runtime.getState().running, false);
});

test('monitoring requires a configured durable audit path', () => {
  assert.throws(() => createSaqlainMonitoringRuntime({
    auditFilePath: '  ',
    collectSnapshot: async () => healthy,
  }), /audit file path is required/i);
});


test('audit failure returns HOLD with an explicit alert even when snapshot was healthy', async () => {
  const ctx = await setup();
  try {
    await mkdir(join(ctx.root, 'audit'), { recursive: true });
    const lock = await open(ctx.auditFilePath + '.lock', 'wx');
    await lock.close();
    const runtime = createSaqlainMonitoringRuntime({
      auditFilePath: ctx.auditFilePath,
      collectSnapshot: async () => healthy,
    });
    const report = await runtime.runCycle();
    assert.equal(report.status, 'HOLD');
    assert.match(report.alert ?? '', /HOLD.*audit or monitoring integrity failure/i);
  } finally { await rm(ctx.root, { recursive: true, force: true }); }
});



test('zero active agents produces WARNING rather than a false healthy state', async () => {
  const ctx = await setup();
  try {
    const runtime = createSaqlainMonitoringRuntime({
      auditFilePath: ctx.auditFilePath,
      collectSnapshot: async () => ({ ...healthy, activeAgents: 0, lockedTasks: 0 }),
    });
    const report = await runtime.runCycle();
    assert.equal(report.status, 'WARNING');
    assert.match(report.alert ?? '', /WARNING/);
  } finally { await rm(ctx.root, { recursive: true, force: true }); }
});



test('monitoring fails when a completed backup/recovery cycle becomes stale', () => {
  const snapshot = evaluateMonitoringSnapshot({
    cycleId: 'monitor-stale-backup',
    checkedAt: '2026-10-24T10:00:00.000Z',
    ...healthy,
    backupCycleAgeMinutes: SAQLAIN_BACKUP_STALE_AFTER_MINUTES + 1,
    backupCycleInProgress: false,
    backupCycleInProgressMinutes: null,
    backupCycleStatus: 'VERIFIED',
  });
  assert.equal(snapshot.status, 'FAILED');
  assert.match(buildSaqlainMonitoringAlert(snapshot) ?? '', /backupCycleAgeMinutes=46/);
});

test('monitoring holds incomplete backup cycles and detects stuck cycle execution', () => {
  const partial = evaluateMonitoringSnapshot({
    cycleId: 'monitor-partial-backup',
    checkedAt: '2026-10-24T10:00:00.000Z',
    ...healthy,
    backupCycleAgeMinutes: 5,
    backupCycleInProgress: false,
    backupCycleStatus: 'PARTIAL',
  });
  assert.equal(partial.status, 'HOLD');
  assert.match(buildSaqlainMonitoringAlert(partial) ?? '', /backupCycleStatus=PARTIAL/);

  const activeButRecent = evaluateMonitoringSnapshot({
    cycleId: 'monitor-running-backup',
    checkedAt: '2026-10-24T10:00:00.000Z',
    ...healthy,
    backupCycleAgeMinutes: 100,
    backupCycleInProgress: true,
    backupCycleInProgressMinutes: 3,
    backupCycleStatus: 'VERIFIED',
  });
  assert.equal(activeButRecent.status, 'HEALTHY');

  const stuck = evaluateMonitoringSnapshot({
    cycleId: 'monitor-stuck-backup',
    checkedAt: '2026-10-24T10:00:00.000Z',
    ...healthy,
    backupCycleAgeMinutes: 100,
    backupCycleInProgress: true,
    backupCycleInProgressMinutes: SAQLAIN_BACKUP_MAX_CYCLE_RUNTIME_MINUTES + 1,
    backupCycleStatus: 'VERIFIED',
  });
  assert.equal(stuck.status, 'FAILED');
  assert.match(buildSaqlainMonitoringAlert(stuck) ?? '', /backupCycleInProgressMinutes=46/);
});

test('monitoring holds when no completed backup cycle exists and no cycle is active', () => {
  const snapshot = evaluateMonitoringSnapshot({
    cycleId: 'monitor-no-backup',
    checkedAt: '2026-10-24T10:00:00.000Z',
    ...healthy,
    backupCycleAgeMinutes: null,
    backupCycleInProgress: false,
    backupCycleInProgressMinutes: null,
    backupCycleStatus: null,
  });
  assert.equal(snapshot.status, 'HOLD');
});


test('non-healthy monitoring cycles send a deduplicatable alert and audit adapter acceptance', async () => {
  const ctx = await setup();
  try {
    const received: Array<{ cycleId: string; idempotencyKey: string; status: string; alert: string }> = [];
    const runtime = createSaqlainMonitoringRuntime({
      auditFilePath: ctx.auditFilePath,
      collectSnapshot: async () => ({ ...healthy, failedTasks: 1 }),
      notifyAlert: async notice => { received.push(notice); },
    });
    const report = await runtime.runCycle();
    assert.equal(report.status, 'FAILED');
    assert.equal(received.length, 1);
    assert.equal(received[0].cycleId, report.cycleId);
    assert.equal(received[0].idempotencyKey, report.cycleId);
    assert.match(received[0].alert, /FAILED/);
    const events = await readVerifiedAuditLog(ctx.auditFilePath);
    assert.ok(events.some(event => event.eventType === 'SAQLAIN_MONITORING_ALERT_ADAPTER_ACCEPTED'));
  } finally { await rm(ctx.root, { recursive: true, force: true }); }
});

test('alert adapter failure forces HOLD and records an audited delivery failure', async () => {
  const ctx = await setup();
  try {
    const runtime = createSaqlainMonitoringRuntime({
      auditFilePath: ctx.auditFilePath,
      collectSnapshot: async () => ({ ...healthy, securityHolds: 1 }),
      notifyAlert: async () => { throw new Error('secret webhook endpoint or credential'); },
    });
    const report = await runtime.runCycle();
    assert.equal(report.status, 'HOLD');
    assert.match(report.alert ?? '', /notification=FAILED/);
    assert.match(report.error ?? '', /delivery is unconfirmed/i);
    assert.equal(JSON.stringify(report).includes('secret webhook endpoint'), false);
    const events = await readVerifiedAuditLog(ctx.auditFilePath);
    const failed = events.find(event => event.eventType === 'SAQLAIN_MONITORING_ALERT_ADAPTER_FAILED');
    assert.ok(failed);
    assert.equal(failed?.outcome, 'HOLD');
    assert.equal(JSON.stringify(failed?.details).includes('secret webhook endpoint'), false);
  } finally { await rm(ctx.root, { recursive: true, force: true }); }
});

test('healthy monitoring cycle does not notify the alert adapter', async () => {
  const ctx = await setup();
  try {
    let calls = 0;
    const runtime = createSaqlainMonitoringRuntime({
      auditFilePath: ctx.auditFilePath,
      collectSnapshot: async () => healthy,
      notifyAlert: async () => { calls++; },
    });
    const report = await runtime.runCycle();
    assert.equal(report.status, 'HEALTHY');
    assert.equal(report.alert, null);
    assert.equal(calls, 0);
  } finally { await rm(ctx.root, { recursive: true, force: true }); }
});
