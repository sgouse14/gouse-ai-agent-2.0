import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, open, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createVerifiedLocalSnapshot } from './saqlainBackupStorage.ts';
import { readVerifiedAuditLog } from './saqlainAuditLog.ts';
import {
  createGousiyaEmergencyState, issueGousiyaEmergencyGrant, executeGousiyaEmergencyRecovery,
  revokeGousiyaEmergencyGrant, GOUSIYA_DEFAULT_GRANT_TTL_MS, GOUSIYA_MAX_GRANT_TTL_MS,
} from './gousiyaEmergencyRecovery.ts';

async function setup() {
  const root = await mkdtemp(join(tmpdir(), 'gousiya-emergency-'));
  const backupRoot = join(root, 'backups');
  const stagingRoot = join(root, 'staging');
  const auditFilePath = join(root, 'audit', 'events.jsonl');
  const grantStoreFilePath = join(root, 'grant-store', 'grants.json');
  const bytes = new TextEncoder().encode('protected source content');
  const snapshot = await createVerifiedLocalSnapshot({
    storageRoot: backupRoot, snapshotId: 'approved-source', source: 'gouse-ai',
    files: [{ relativePath: 'project/source.txt', bytes }], now: new Date('2026-10-13T00:00:00Z'),
  });
  const state = createTestState(auditFilePath, grantStoreFilePath);
  return { root, backupRoot, stagingRoot, auditFilePath, grantStoreFilePath, bytes, snapshot, state };
}
const approvals = { ownerApprovalToken: 'owner-token', independentReviewerApprovalToken: 'reviewer-token' };

function createTestState(auditFilePath: string, grantStoreFilePath: string) {
  return createGousiyaEmergencyState({
    auditFilePath,
    grantStoreFilePath,
    verifyApprovalToken: async (token, scope) => {
      if (token !== 'owner-token' && token !== 'reviewer-token') throw new Error('Invalid test approval token');
      return {
        subject: token === 'owner-token' ? 'owner-user-1' : 'reviewer-user-2',
        role: token === 'owner-token' ? 'system-owner' : 'independent-reviewer',
        decision: 'APPROVE',
        incidentId: scope.incidentId,
        recoveryAgentId: scope.recoveryAgentId,
        sourceSnapshotDirectory: scope.sourceSnapshotDirectory,
        stagingRoot: scope.stagingRoot,
        issuedAt: scope.requestedAt,
        expiresAt: new Date(Date.parse(scope.requestedAt) + GOUSIYA_MAX_GRANT_TTL_MS).toISOString(),
      };
    },
  });
}

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
    assert.deepEqual(new Uint8Array(await readFile(sourceFile)), new Uint8Array(before));
    assert.deepEqual(new Uint8Array(await readFile(join(result.stagingSnapshot!.directory, 'project/source.txt'))), ctx.bytes);
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
      reason: 'Emergency', ownerApprovalToken: 'owner-token', independentReviewerApprovalToken: 'invalid-token',
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
    const state = createTestState(join(ctx.snapshot.directory, 'events.jsonl'), join(ctx.root, 'separate-grants.json'));
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


test('fails closed when the grant-consumption audit write fails before filesystem recovery', async () => {
  const ctx = await setup();
  try {
    const issued = await issueGousiyaEmergencyGrant({
      state: ctx.state, incidentId: 'incident-consumption-audit-failure', recoveryAgentId: 'saq-recovery-agent',
      sourceSnapshotDirectory: ctx.snapshot.directory, stagingRoot: ctx.stagingRoot,
      reason: 'Consumption audit failure must prevent recovery', ...approvals,
    });

    const auditTextBefore = await readFile(ctx.auditFilePath, 'utf8');
    assert.equal(auditTextBefore.includes(issued.token), false, 'raw grant token must never appear in the audit log');

    // Simulate unavailable audit append by holding the audit writer lock.
    const lock = await open(ctx.auditFilePath + '.lock', 'wx');
    await lock.close();
    await assert.rejects(executeGousiyaEmergencyRecovery({
      state: ctx.state,
      grantId: issued.grant.grantId,
      token: issued.token,
      incidentId: 'incident-consumption-audit-failure',
    }), /locked or has a stale lock/i);

    // Consumption is reserved before audit I/O; fail closed and never start filesystem work.
    assert.equal(ctx.state.grants.get(issued.grant.grantId)?.status, 'CONSUMED');
    const { stat } = await import('node:fs/promises');
    await assert.rejects(stat(ctx.stagingRoot), { code: 'ENOENT' });

    await rm(ctx.auditFilePath + '.lock', { force: true });
    await assert.rejects(executeGousiyaEmergencyRecovery({
      state: ctx.state,
      grantId: issued.grant.grantId,
      token: issued.token,
      incidentId: 'incident-consumption-audit-failure',
    }), /invalid, mismatched, or already used/i);
  } finally {
    await rm(ctx.root, { recursive: true, force: true });
  }
});


test('rejects source/staging overlap hidden behind a symlinked parent', async () => {
  const ctx = await setup();
  const alias = join(ctx.root, 'source-alias');
  try {
    await symlink(ctx.snapshot.directory, alias, 'dir');
    await assert.rejects(issueGousiyaEmergencyGrant({
      state: ctx.state,
      incidentId: 'incident-symlink-overlap',
      recoveryAgentId: 'saq-recovery-agent',
      sourceSnapshotDirectory: ctx.snapshot.directory,
      // Lexically this looks like a separate path, but it resolves into source.
      stagingRoot: join(alias, 'staging'),
      reason: 'Symlink path isolation test',
      ...approvals,
    }), /source and staging paths must be disjoint/i);
    assert.equal(ctx.state.grants.size, 0);
    assert.deepEqual(
      new Uint8Array(await readFile(join(ctx.snapshot.directory, 'project/source.txt'))),
      ctx.bytes,
    );
  } finally {
    await rm(ctx.root, { recursive: true, force: true });
  }
});


test('durable grants survive state recreation and reject replay after restart', async () => {
  const ctx = await setup();
  try {
    const issued = await issueGousiyaEmergencyGrant({
      state: ctx.state, incidentId: 'incident-restart', recoveryAgentId: 'saq-recovery-agent',
      sourceSnapshotDirectory: ctx.snapshot.directory, stagingRoot: ctx.stagingRoot,
      reason: 'Restart persistence test', ...approvals,
    });
    const restartedState = createTestState(ctx.auditFilePath, ctx.grantStoreFilePath);
    // Recreating the state simulates a server restart; the grant is reloaded from disk.
    await assert.rejects(executeGousiyaEmergencyRecovery({
      state: restartedState, grantId: issued.grant.grantId, token: issued.token,
      incidentId: 'incident-restart',
    }), /already used/i);
    assert.equal(restartedState.grants.get(issued.grant.grantId)?.status, 'CONSUMED');
  } finally {
    await rm(ctx.root, { recursive: true, force: true });
  }
});

test('requires two distinct approval identities, not merely two tokens', async () => {
  const ctx = await setup();
  try {
    const sameIdentityState = createGousiyaEmergencyState({
      auditFilePath: ctx.auditFilePath,
      grantStoreFilePath: ctx.grantStoreFilePath,
      verifyApprovalToken: async (_token, scope) => ({
        subject: 'same-person',
        role: _token === 'owner-token' ? 'system-owner' : 'independent-reviewer',
        decision: 'APPROVE',
        incidentId: scope.incidentId,
        recoveryAgentId: scope.recoveryAgentId,
        sourceSnapshotDirectory: scope.sourceSnapshotDirectory,
        stagingRoot: scope.stagingRoot,
        issuedAt: scope.requestedAt,
        expiresAt: new Date(Date.parse(scope.requestedAt) + GOUSIYA_MAX_GRANT_TTL_MS).toISOString(),
      }),
    });
    await assert.rejects(issueGousiyaEmergencyGrant({
      state: sameIdentityState, incidentId: 'incident-same-identity', recoveryAgentId: 'saq-recovery-agent',
      sourceSnapshotDirectory: ctx.snapshot.directory, stagingRoot: ctx.stagingRoot,
      reason: 'Independence test', ...approvals,
    }), /distinct owner and independent-reviewer identities/i);
    assert.equal(sameIdentityState.grants.size, 0);
  } finally {
    await rm(ctx.root, { recursive: true, force: true });
  }
});
