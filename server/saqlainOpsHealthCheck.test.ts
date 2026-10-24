import test from 'node:test';
import assert from 'node:assert/strict';
import { appendDurableAuditEvent, type AuditRecord } from './saqlainAuditLog.ts';
import {
  checkSaqlainOpsHealth,
  evaluateSaqlainOpsHealth,
  SAQLAIN_OPS_HEALTH_DEFAULT_MAX_AGE_MINUTES,
} from './saqlainOpsHealthCheck.ts';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const now = '2026-10-24T12:00:00.000Z';

function event(overrides: Partial<AuditRecord> = {}): AuditRecord {
  return {
    schemaVersion: 1,
    sequence: 1,
    eventId: 'event-1',
    occurredAt: '2026-10-24T11:50:00.000Z',
    eventType: 'SAQLAIN_MONITORING_CYCLE',
    actorId: 'saqlain-monitoring-agent',
    outcome: 'INFO',
    resource: 'gouse-ai-agent-2.0',
    taskId: 'saqlain-monitor-1',
    details: { status: 'HEALTHY' },
    previousHash: '0'.repeat(64),
    recordHash: 'a'.repeat(64),
    ...overrides,
  };
}

const fixedNow = () => new Date(now);

test('fresh healthy monitoring audit event is considered healthy', () => {
  const result = evaluateSaqlainOpsHealth([event()], { now: fixedNow });
  assert.equal(result.healthy, true);
  assert.equal(result.status, 'HEALTHY');
  assert.equal(result.code, 'OK');
  assert.equal(result.monitoringAgeMinutes, 10);
  assert.equal(result.latestMonitoringEventAt, '2026-10-24T11:50:00.000Z');
  assert.equal(SAQLAIN_OPS_HEALTH_DEFAULT_MAX_AGE_MINUTES, 45);
});

test('latest monitoring event is selected even when later audit entries are not monitoring cycles', () => {
  const previous = event({ sequence: 1, occurredAt: '2026-10-24T11:40:00.000Z' });
  const laterAudit = event({
    sequence: 2,
    eventType: 'SAQLAIN_BACKUP_AGENT_CYCLE',
    occurredAt: '2026-10-24T11:59:00.000Z',
    actorId: 'saq-backup-gouse',
  });
  const result = evaluateSaqlainOpsHealth([previous, laterAudit], { now: fixedNow });
  assert.equal(result.healthy, true);
  assert.equal(result.latestMonitoringEventAt, '2026-10-24T11:40:00.000Z');
});

test('stale monitoring event fails and identifies freshness as the cause', () => {
  const result = evaluateSaqlainOpsHealth([
    event({ occurredAt: '2026-10-24T11:14:00.000Z' }),
  ], { now: fixedNow, maxAgeMinutes: 45 });
  assert.equal(result.healthy, false);
  assert.equal(result.status, 'FAILED');
  assert.equal(result.code, 'STALE_MONITORING_EVENT');
});

test('non-healthy monitoring events are passed through and never reported healthy', () => {
  for (const status of ['WARNING', 'HOLD', 'FAILED'] as const) {
    const result = evaluateSaqlainOpsHealth([
      event({ outcome: 'HOLD', details: { status } }),
    ], { now: fixedNow });
    assert.equal(result.healthy, false);
    assert.equal(result.status, status);
    assert.equal(result.code, 'MONITORING_NOT_HEALTHY');
  }
});

test('missing, future, malformed, and mismatched monitoring records fail closed', () => {
  assert.equal(evaluateSaqlainOpsHealth([], { now: fixedNow }).code, 'NO_MONITORING_CYCLE');
  assert.equal(evaluateSaqlainOpsHealth([event({ occurredAt: 'not-a-date' })], { now: fixedNow }).code, 'INVALID_MONITORING_TIMESTAMP');
  assert.equal(evaluateSaqlainOpsHealth([event({ occurredAt: '2026-10-24T12:02:00.000Z' })], { now: fixedNow }).code, 'FUTURE_MONITORING_EVENT');
  assert.equal(evaluateSaqlainOpsHealth([event({ outcome: 'HOLD' })], { now: fixedNow }).code, 'MONITORING_AUDIT_MISMATCH');
  assert.equal(evaluateSaqlainOpsHealth([event()], { now: fixedNow, maxAgeMinutes: 0 }).code, 'INVALID_MAX_AGE_CONFIGURATION');
});

test('audit file checker verifies the hash chain before returning healthy', async () => {
  const root = await mkdtemp(join(tmpdir(), 'saqlain-ops-health-'));
  const auditPath = join(root, 'audit', 'events.jsonl');
  try {
    await appendDurableAuditEvent(auditPath, {
      eventType: 'SAQLAIN_MONITORING_CYCLE',
      actorId: 'saqlain-monitoring-agent',
      outcome: 'INFO',
      resource: 'gouse-ai-agent-2.0',
      taskId: 'saqlain-monitor-1',
      occurredAt: '2026-10-24T11:50:00.000Z',
      details: { status: 'HEALTHY' },
    });
    const good = await checkSaqlainOpsHealth(auditPath, { now: fixedNow });
    assert.equal(good.healthy, true);
    const original = await readFile(auditPath, 'utf8');
    await writeFile(auditPath, original.replace('"status":"HEALTHY"', '"status":"FAILED"'));
    const tampered = await checkSaqlainOpsHealth(auditPath, { now: fixedNow });
    assert.equal(tampered.healthy, false);
    assert.equal(tampered.status, 'HOLD');
    assert.equal(tampered.code, 'AUDIT_LOG_INVALID_OR_UNAVAILABLE');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('missing audit path fails closed without exposing infrastructure details', async () => {
  const result = await checkSaqlainOpsHealth(' ', { now: fixedNow });
  assert.equal(result.healthy, false);
  assert.equal(result.code, 'AUDIT_PATH_NOT_CONFIGURED');
  assert.equal(result.status, 'HOLD');
});
