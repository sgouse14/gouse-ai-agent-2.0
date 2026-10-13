import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, open, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createVerifiedLocalSnapshot } from './saqlainBackupStorage.ts';
import { readVerifiedAuditLog } from './saqlainAuditLog.ts';
import {
  createGousiyaEmergencyState, issueGousiyaEmergencyGrant, executeGousiyaEmergencyRecovery,
  revokeGousiyaEmergencyGrant, GOUSIYA_DEFAULT_GRANT_TTL_MS,
} from './gousiyaEmergencyRecovery.ts';

async function setup() {
  const root = await mkdtemp(join(tmpdir(), 'gousiya-emergency-'));
  const backupRoot = join(root, 'backups');
  const stagingRoot = join(root, 'staging');
  const auditFilePath = join(root, 'audit', 'events.jsonl');
  const bytes = new TextEncoder().encode('protected source content');
  const snapshot = await createVerifiedLocalSnapshot({
    storageRoot: backupRoot, snapshotId: 'approved-source', source: 'gouse-ai',
    files: [{ relativePath: 'project/source.txt', bytes }], now: new Date('2026-10-13T00:00:00Z'),
  });
  const state = createGousiyaEmergencyState(auditFilePath);
  return { root, backupRoot, stagingRoot, auditFilePath, bytes, snapshot, state };
}
const approvals = { ownerApproved: true, independentReviewerApproved: true };

test('issues a short-lived single-use grant and rehearses only into separate staging', async () => {
  const ctx = await setup();
  try {
    const sourceFile = join(ctx.snapshot.directory, 'project/source.txt');
    const before = await readFile(sourceFile);
    const issued = await issueGousiyaEmergencyGrant({
      state: ctx.state, incidentId: 'incident-01', recoveryAgentId: 'saq-recovery-agent',
      sourceSnapshotDirectory: ctx.snapshot.directory, stagingRoot: ctx.stagingRoot,
      reason: 'Disaster recovery rehearsal', ...approvals, now: new Date('2026-10-13T00:00:00Z'),
    });
    assert.equal(issued.grant.status, 'ISSUED');
    assert.equal(issued.grant.expiresAt, new Date(Date.parse(issued.grant.issuedAt) + GOUSIYA_DEFAULT_GRANT_TTL_MS).toISOString());
    const result = await executeGousiyaEmergencyRecovery({
      state: ctx.state, grantId: issued.grant.grantId, token: issued.token, incidentId: 'incident-01',
      now: new Date('2026-10-13T00:01:00Z'),
    });
    assert.equal(result.decision, 'VERIFIED');
    assert.equal(result.originalsModified, false);
    assert.equal(result.promotionAllowed, false);
    assert.deepEqual(new Uint8Array(await readFile(sourceFile)), before);
    assert.deepEqual(await readFile(join(result.stagingSnapshot!.directory, 'project/source.txt')), ctx.bytes);
    await assert.rejects(executeGousiyaEmergencyRecovery({
      state: ctx.state, grantId: issued.grant.grantId, token: issued.token, incidentId: 'incident-01',
      now: new Date('2026-10-13T00:01:01Z'),
    }), /invalid, mismatched, or already used/i);
    const events = await readVerifiedAuditLog(ctx.auditFilePath);
    assert.ok(events.some(e => e.eventType === 'GOUSIYA_EMERGENCY_GRANT_ISSUED'));
    assert.ok(events.some(e => e.eventType === 'GOUSIYA_EMERGENCY_GRANT_CONSUMED'));
    assert.ok(events.some(e => e.eventType === 'GOUSIYA_EMERGENCY_RECOVERY_FINISHED'));
  } finally { await rm(ctx.root, { recursive: true, force: true }); }
});

test('requires owner and independent reviewer approval before grant issuance', async () => {
  const ctx = await setup();
  try {
    await assert.rejects(issueGousiyaEmergencyGrant({
      state: ctx.state, incidentId: 'incident-02', recoveryAgentId: 'saq-recovery-agent',
      sourceSnapshotDirectory: ctx.snapshot.directory, stagingRoot: ctx.stagingRoot,
      reason: 'Emergency', ownerApproved: true, independentReviewerApproved: false,
    }), /owner approval and independent reviewer approval/i);
    assert.equal(ctx.state.grants.size, 0);
    const events = await readVerifiedAuditLog(ctx.auditFilePath);
    assert.equal(events[0].outcome, 'DENY');
  } finally { await rm(ctx.root, { recursive: true, force: true }); }
});

test('rejects overlapping source and staging paths before issuing a grant', async () => {
  const ctx = await setup();
  try {
    await assert.rejects(issueGousiyaEmergencyGrant({
      state: ctx.state, incidentId: 'incident-03', recoveryAgentId: 'saq-recovery-agent',
      sourceSnapshotDirectory: ctx.snapshot.directory, stagingRoot: ctx.snapshot.directory,
      reason: 'Emergency', ...approvals,
    }), /must be disjoint/i);
    assert.equal(ctx.state.grants.size, 0);
  } finally { await rm(ctx.root, { recursive: true, force: true }); }
});

test('rejects audit path inside the protected source snapshot', async () => {
  const ctx = await setup();
  try {
    const state = createGousiyaEmergencyState(join(ctx.snapshot.directory, 'events.jsonl'));
    await assert.rejects(issueGousiyaEmergencyGrant({
      state, incidentId: 'incident-audit-path', recoveryAgentId: 'saq-recovery-agent',
      sourceSnapshotDirectory: ctx.snapshot.directory, stagingRoot: ctx.stagingRoot,
      reason: 'Audit isolation test', ...approvals,
    }), /source and audit paths must be disjoint/i);
    assert.equal(state.grants.size, 0);
    assert.deepEqual(new Uint8Array(await readFile(join(ctx.snapshot.directory, 'project/source.txt'))), ctx.bytes);
  } finally { await rm(ctx.root, { recursive: true, force: true }); }
});

test('expired grant cannot execute and can be revoked only before use', async () => {
  const ctx = await setup();
  try {
    const issued = await issueGousiyaEmergencyGrant({
      state: ctx.state, incidentId: 'incident-04', recoveryAgentId: 'saq-recovery-agent',
      sourceSnapshotDirectory: ctx.snapshot.directory, stagingRoot: ctx.stagingRoot,
      reason: 'Emergency', ...approvals, ttlMs: 30_000, now: new Date('2026-10-13T00:00:00Z'),
    });
    await assert.rejects(executeGousiyaEmergencyRecovery({
      state: ctx.state, grantId: issued.grant.grantId, token: issued.token, incidentId: 'incident-04',
      now: new Date('2026-10-13T00:00:31Z'),
    }), /expired/i);
    assert.equal(ctx.state.grants.get(issued.grant.grantId)?.status, 'EXPIRED');
    const second = await issueGousiyaEmergencyGrant({
      state: ctx.state, incidentId: 'incident-05', recoveryAgentId: 'saq-recovery-agent',
      sourceSnapshotDirectory: ctx.snapshot.directory, stagingRoot: join(ctx.root, 'staging-2'),
      reason: 'Emergency', ...approvals,
    });
    await revokeGousiyaEmergencyGrant({ state: ctx.state, grantId: second.grant.grantId, actorId: 'operator-1' });
    assert.equal(ctx.state.grants.get(second.grant.grantId)?.status, 'REVOKED');
  } finally { await rm(ctx.root, { recursive: true, force: true }); }
});


test('revocation is reserved before audit I/O and remains revoked if audit persistence fails', async () => {
  const ctx = await setup();
  try {
    const issued = await issueGousiyaEmergencyGrant({
      state: ctx.state, incidentId: 'incident-revoke-audit', recoveryAgentId: 'saq-recovery-agent',
      sourceSnapshotDirectory: ctx.snapshot.directory, stagingRoot: ctx.stagingRoot,
      reason: 'Audit failure race test', ...approvals,
    });
    await mkdir(join(ctx.root, 'audit'), { recursive: true });
    const lock = await open(ctx.auditFilePath + '.lock', 'wx');
    await lock.close();
    await assert.rejects(revokeGousiyaEmergencyGrant({
      state: ctx.state, grantId: issued.grant.grantId, actorId: 'operator-2',
    }), /locked or has a stale lock/i);
    assert.equal(ctx.state.grants.get(issued.grant.grantId)?.status, 'REVOKED');
    // Clear the deliberately injected lock so the replay-denial audit can persist.
    await rm(ctx.auditFilePath + '.lock', { force: true });
    await assert.rejects(executeGousiyaEmergencyRecovery({
      state: ctx.state, grantId: issued.grant.grantId, token: issued.token, incidentId: 'incident-revoke-audit',
    }), /invalid, mismatched, or already used/i);
  } finally { await rm(ctx.root, { recursive: true, force: true }); }
});

test('tampered source snapshot is held and never promoted', async () => {
  const ctx = await setup();
  try {
    const issued = await issueGousiyaEmergencyGrant({
      state: ctx.state, incidentId: 'incident-06', recoveryAgentId: 'saq-recovery-agent',
      sourceSnapshotDirectory: ctx.snapshot.directory, stagingRoot: ctx.stagingRoot,
      reason: 'Tamper test', ...approvals,
    });
    await writeFile(join(ctx.snapshot.directory, 'project/source.txt'), 'tampered');
    const result = await executeGousiyaEmergencyRecovery({
      state: ctx.state, grantId: issued.grant.grantId, token: issued.token, incidentId: 'incident-06',
    });
    assert.equal(result.decision, 'HOLD');
    assert.equal(result.originalsModified, false);
    assert.equal(result.promotionAllowed, false);
    assert.equal(ctx.state.grants.get(issued.grant.grantId)?.status, 'CONSUMED');
  } finally { await rm(ctx.root, { recursive: true, force: true }); }
});
