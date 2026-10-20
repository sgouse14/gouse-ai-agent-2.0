import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createEmpAttackProtector, assessEmpProtection, type EmpProtectionSignals } from './empAttackProtector.ts';
import { readVerifiedAuditLog } from './saqlainAuditLog.ts';

const readySignals: EmpProtectionSignals = {
  shieldingAssessed: true,
  surgeProtection: true,
  offlineBackups: true,
  recoveryRunbookTested: true,
  spareHardwareAvailable: true,
  alternateCommunicationAvailable: true,
  reportedObservations: [],
};

async function withAudit(fn: (auditFilePath: string) => Promise<void>) {
  const root = await mkdtemp(join(tmpdir(), 'emp-protector-'));
  try { await fn(join(root, 'audit.jsonl')); }
  finally { await rm(root, { recursive: true, force: true }); }
}

test('EMP protector returns READY for complete readiness signals and durably audits the report', async () => {
  await withAudit(async (auditFilePath) => {
    const protector = createEmpAttackProtector({
      auditFilePath,
      authorizeActor: async ({ actorId, projectId }) => actorId === 'owner-1' && projectId === 'project-1',
      now: () => new Date('2026-01-01T00:00:00.000Z'),
    });
    const report = await protector.assess({ actorId: 'owner-1', projectId: 'project-1', signals: readySignals });
    assert.equal(report.status, 'READY');
    assert.equal(report.audited, true);
    assert.equal(report.readiness.status, 'READY');
    assert.equal(report.impactAssessment.status, 'CLEAR');
    assert.equal(report.recovery.status, 'READY');
    assert.equal((await readVerifiedAuditLog(auditFilePath)).length, 1);
  });
});

test('unknown readiness signals produce a degraded assessment rather than a false all-clear', () => {
  const report = assessEmpProtection({
    shieldingAssessed: null,
    surgeProtection: null,
    offlineBackups: false,
    recoveryRunbookTested: null,
    spareHardwareAvailable: false,
    alternateCommunicationAvailable: null,
    reportedObservations: [],
  });
  assert.equal(report.status, 'DEGRADED');
  assert.ok(report.readiness.findingCodes.includes('SHIELDING_ASSESSMENT_UNKNOWN'));
  assert.ok(report.readiness.findingCodes.includes('OFFLINE_BACKUP_MISSING'));
  assert.ok(report.recovery.findingCodes.includes('SPARE_HARDWARE_UNAVAILABLE'));
});

test('reported symptoms trigger investigation without claiming an EMP was detected', () => {
  const report = assessEmpProtection({
    ...readySignals,
    reportedObservations: ['unexpected_power_loss', 'communications_loss', 'unexpected_power_loss'],
  });
  assert.equal(report.status, 'ALERT');
  assert.equal(report.impactAssessment.status, 'INVESTIGATE');
  assert.deepEqual(report.impactAssessment.findingCodes, ['REPORTED_UNEXPECTED_POWER_LOSS', 'REPORTED_COMMUNICATIONS_LOSS']);
  assert.ok(report.recommendations.some((item) => item.includes('not as confirmation')));
});

test('unauthorized project assessment is denied and the denial is audited', async () => {
  await withAudit(async (auditFilePath) => {
    const protector = createEmpAttackProtector({ auditFilePath, authorizeActor: async () => false });
    const report = await protector.assess({ actorId: 'untrusted', projectId: 'project-1', signals: readySignals });
    assert.equal(report.status, 'HOLD');
    assert.equal(report.audited, true);
    const records = await readVerifiedAuditLog(auditFilePath);
    assert.equal(records[0].outcome, 'DENY');
    assert.equal(records[0].eventType, 'EMP_PROTECTION_ASSESSMENT');
  });
});

test('authorization callback exception fails closed and never returns a readiness result', async () => {
  await withAudit(async (auditFilePath) => {
    const protector = createEmpAttackProtector({
      auditFilePath,
      authorizeActor: async () => { throw new Error('authorization unavailable'); },
    });
    const report = await protector.assess({ actorId: 'owner-1', projectId: 'project-1', signals: readySignals });
    assert.equal(report.status, 'HOLD');
    assert.equal(report.audited, true);
    assert.match(report.reason ?? '', /not authorized/i);
  });
});

test('audit failure withholds an otherwise healthy assessment', async () => {
  const protector = createEmpAttackProtector({
    auditFilePath: '/unused/audit.jsonl',
    authorizeActor: async () => true,
    appendAudit: async () => { throw new Error('audit unavailable'); },
  });
  const report = await protector.assess({ actorId: 'owner-1', projectId: 'project-1', signals: readySignals });
  assert.equal(report.status, 'HOLD');
  assert.equal(report.audited, false);
  assert.match(report.reason ?? '', /audit persistence failed/i);
});

test('unknown observations and malformed signal state are rejected', () => {
  assert.throws(() => assessEmpProtection({
    ...readySignals,
    reportedObservations: ['confirmed_emp' as never],
  }), /Unknown EMP observation code/);
  assert.throws(() => assessEmpProtection({
    ...readySignals,
    shieldingAssessed: 'yes' as never,
  }), /Invalid EMP protection signal/);
});

test('all EMP assessments pass the protected scoped-read policy', async () => {
  await withAudit(async (auditFilePath) => {
    const protector = createEmpAttackProtector({
      auditFilePath,
      authorizeActor: async ({ projectId }) => projectId === 'project-1',
    });
    const missingScope = await protector.assess({ actorId: 'owner-1', projectId: '', signals: readySignals });
    assert.equal(missingScope.status, 'HOLD');
    assert.equal(missingScope.audited, false);
  });
});
