import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assessEmpResilience,
  EMP_TELEMETRY_ALLOWED_FUTURE_SKEW_MS,
  EMP_TELEMETRY_MAX_AGE_MS,
  type EmpSignalSnapshot,
} from './saqlainEmpAttackProtector.ts';

const observedAt = '2026-10-24T10:00:00.000Z';
const snapshot: EmpSignalSnapshot = {
  sourceId: 'facility-power-monitor-1',
  observedAt,
  sourceHealth: 'HEALTHY',
  explicitEmpAlarm: false,
  powerQualityAlarmCount: 0,
  unexpectedRestartCount: 0,
  networkInterfaceFlapCount: 0,
  clockDriftMs: 10,
  telemetryGapCount: 0,
};

function options(now: string, allowedSourceIds = ['facility-power-monitor-1']) {
  return {
    allowedSourceIds,
    now: () => new Date(now),
  };
}

test('fresh telemetry from an explicitly allowlisted source can produce a normal readiness result', () => {
  const result = assessEmpResilience(snapshot, options('2026-10-24T10:01:00.000Z'));
  assert.equal(result.status, 'NORMAL');
  assert.equal(result.score, 0);
  assert.equal(result.telemetry.freshness, 'FRESH');
  assert.equal(result.telemetry.sourceId, 'facility-power-monitor-1');
  assert.equal(result.telemetry.ageMs, 60_000);
  assert.equal(result.automaticPhysicalActionsTaken, false);
});

test('stale telemetry is held and its reported readings are not scored', () => {
  const result = assessEmpResilience(snapshot, options('2026-10-24T10:10:00.000Z'));
  assert.equal(EMP_TELEMETRY_MAX_AGE_MS, 5 * 60_000);
  assert.equal(result.status, 'HOLD');
  assert.equal(result.score, 0);
  assert.equal(result.telemetry.freshness, 'STALE');
  assert.match(result.reasons[0], /stale/i);
});

test('telemetry timestamp too far in the future is held', () => {
  const futureSnapshot = { ...snapshot, observedAt: '2026-10-24T10:03:00.000Z', explicitEmpAlarm: true };
  const result = assessEmpResilience(futureSnapshot, options('2026-10-24T10:00:00.000Z'));
  assert.equal(EMP_TELEMETRY_ALLOWED_FUTURE_SKEW_MS, 60_000);
  assert.equal(result.status, 'HOLD');
  assert.equal(result.score, 0);
  assert.equal(result.telemetry.freshness, 'FUTURE');
  assert.equal(result.automaticPhysicalActionsTaken, false);
});

test('telemetry from a source outside the owner allowlist is held even if its values look healthy', () => {
  const result = assessEmpResilience(snapshot, options('2026-10-24T10:01:00.000Z', ['different-approved-source']));
  assert.equal(result.status, 'HOLD');
  assert.equal(result.score, 0);
  assert.equal(result.telemetry.freshness, 'UNTRUSTED_SOURCE');
  assert.match(result.reasons[0], /allowlist/i);
});

test('fresh approved alarm telemetry recommends defensive review without physical action', () => {
  const result = assessEmpResilience({ ...snapshot, explicitEmpAlarm: true }, options('2026-10-24T10:01:00.000Z'));
  assert.equal(result.status, 'HOLD');
  assert.equal(result.score, 5);
  assert.equal(result.telemetry.freshness, 'FRESH');
  assert.equal(result.automaticPhysicalActionsTaken, false);
  assert.ok(result.recommendedOperatorActions.some(action => /Do not automatically switch power/i.test(action)));
});

test('malformed timestamps, empty allowlists, and invalid freshness thresholds are rejected', () => {
  assert.throws(
    () => assessEmpResilience({ ...snapshot, observedAt: '2026-10-24T10:00:00' }, options('2026-10-24T10:01:00.000Z')),
    /ISO 8601 timestamp with an explicit timezone/i,
  );
  assert.throws(
    () => assessEmpResilience(snapshot, options('2026-10-24T10:01:00.000Z', [])),
    /non-empty allowlist/i,
  );
  assert.throws(
    () => assessEmpResilience(snapshot, { ...options('2026-10-24T10:01:00.000Z'), maxTelemetryAgeMs: 0 }),
    /maxTelemetryAgeMs/i,
  );
});
