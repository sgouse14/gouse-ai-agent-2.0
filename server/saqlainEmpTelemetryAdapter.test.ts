import test from 'node:test';
import assert from 'node:assert/strict';
import { chmod, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createSaqlainEmpTelemetryFileReader } from './saqlainEmpTelemetryAdapter.ts';

const NOW = '2026-10-24T12:00:00.000Z';
const healthySnapshot = {
  sourceId: 'facility-power-monitor-1',
  observedAt: '2026-10-24T11:58:00.000Z',
  sourceHealth: 'HEALTHY',
  explicitEmpAlarm: false,
  powerQualityAlarmCount: 0,
  unexpectedRestartCount: 0,
  networkInterfaceFlapCount: 0,
  clockDriftMs: 10,
  telemetryGapCount: 0,
};
const fixedNow = () => new Date(NOW);

async function setup() {
  const root = await mkdtemp(join(tmpdir(), 'saqlain-emp-telemetry-'));
  const filePath = join(root, 'telemetry.json');
  return { root, filePath };
}

async function writeSnapshot(filePath: string, value: unknown = healthySnapshot) {
  await writeFile(filePath, JSON.stringify(value), { mode: 0o600 });
  await chmod(filePath, 0o600);
}

test('protected telemetry file from an allowlisted source is assessed with freshness metadata', async () => {
  const ctx = await setup();
  try {
    await writeSnapshot(ctx.filePath);
    const reader = createSaqlainEmpTelemetryFileReader({
      filePath: ctx.filePath,
      allowedSourceIds: ['facility-power-monitor-1'],
      now: fixedNow,
    });
    const result = await reader.read();
    assert.equal(result.status, 'NORMAL');
    assert.equal(result.telemetry.freshness, 'FRESH');
    assert.equal(result.automaticPhysicalActionsTaken, false);
    assert.match(result.limitation, /cannot confirm EMP/i);
  } finally {
    await rm(ctx.root, { recursive: true, force: true });
  }
});

test('stale, future, and unapproved telemetry are held instead of scored', async () => {
  const ctx = await setup();
  try {
    await writeSnapshot(ctx.filePath, { ...healthySnapshot, observedAt: '2026-10-24T11:50:00.000Z', explicitEmpAlarm: true });
    let reader = createSaqlainEmpTelemetryFileReader({
      filePath: ctx.filePath, allowedSourceIds: ['facility-power-monitor-1'], now: fixedNow,
    });
    let result = await reader.read();
    assert.equal(result.status, 'HOLD');
    assert.equal(result.score, 0);
    assert.equal(result.telemetry.freshness, 'STALE');

    await writeSnapshot(ctx.filePath, { ...healthySnapshot, observedAt: '2026-10-24T12:02:00.000Z' });
    result = await reader.read();
    assert.equal(result.status, 'HOLD');
    assert.equal(result.telemetry.freshness, 'FUTURE');

    await writeSnapshot(ctx.filePath, { ...healthySnapshot, sourceId: 'unapproved-facility-source' });
    reader = createSaqlainEmpTelemetryFileReader({
      filePath: ctx.filePath, allowedSourceIds: ['facility-power-monitor-1'], now: fixedNow,
    });
    result = await reader.read();
    assert.equal(result.status, 'HOLD');
    assert.equal(result.telemetry.freshness, 'UNTRUSTED_SOURCE');
    assert.equal(result.score, 0);
  } finally {
    await rm(ctx.root, { recursive: true, force: true });
  }
});

test('telemetry file rejects symlink paths, writable permissions, and oversized or empty files', async () => {
  const ctx = await setup();
  try {
    await writeSnapshot(ctx.filePath);
    const aliasPath = join(ctx.root, 'alias.json');
    await symlink(ctx.filePath, aliasPath);
    assert.throws(() => createSaqlainEmpTelemetryFileReader({
      filePath: aliasPath, allowedSourceIds: ['facility-power-monitor-1'], now: fixedNow,
    }), /absolute path/i);
    const symlinkReader = createSaqlainEmpTelemetryFileReader({
      filePath: aliasPath, allowedSourceIds: ['facility-power-monitor-1'], now: fixedNow,
    });
    await assert.rejects(() => symlinkReader.read(), /symbolic-link/i);

    await chmod(ctx.filePath, 0o620);
    const writableReader = createSaqlainEmpTelemetryFileReader({
      filePath: ctx.filePath, allowedSourceIds: ['facility-power-monitor-1'], now: fixedNow,
    });
    await assert.rejects(() => writableReader.read(), /must not be group-writable/i);

    await chmod(ctx.filePath, 0o600);
    await writeFile(ctx.filePath, '');
    const emptyReader = createSaqlainEmpTelemetryFileReader({
      filePath: ctx.filePath, allowedSourceIds: ['facility-power-monitor-1'], now: fixedNow,
    });
    await assert.rejects(() => emptyReader.read(), /empty or exceeds/i);

    await writeFile(ctx.filePath, 'x'.repeat(100));
    const smallLimitReader = createSaqlainEmpTelemetryFileReader({
      filePath: ctx.filePath, allowedSourceIds: ['facility-power-monitor-1'], now: fixedNow, maxBytes: 10,
    });
    await assert.rejects(() => smallLimitReader.read(), /empty or exceeds/i);
  } finally {
    await rm(ctx.root, { recursive: true, force: true });
  }
});

test('telemetry configuration and JSON schema fail closed', async () => {
  assert.throws(() => createSaqlainEmpTelemetryFileReader({
    filePath: 'relative/telemetry.json', allowedSourceIds: ['facility-power-monitor-1'],
  }), /absolute path/i);
  assert.throws(() => createSaqlainEmpTelemetryFileReader({
    filePath: '/tmp/telemetry.json', allowedSourceIds: [],
  }), /non-empty EMP telemetry source allowlist/i);

  const ctx = await setup();
  try {
    await writeSnapshot(ctx.filePath, { ...healthySnapshot, extra: 'unexpected' });
    const reader = createSaqlainEmpTelemetryFileReader({
      filePath: ctx.filePath, allowedSourceIds: ['facility-power-monitor-1'], now: fixedNow,
    });
    await assert.rejects(() => reader.read(), /missing or unexpected fields/i);
    await writeFile(ctx.filePath, '{invalid');
    await assert.rejects(() => reader.read(), /not valid JSON/i);
  } finally {
    await rm(ctx.root, { recursive: true, force: true });
  }
});
