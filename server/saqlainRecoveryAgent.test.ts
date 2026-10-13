import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createVerifiedLocalSnapshot } from './saqlainBackupStorage.ts';
import { runRecoveryRehearsal } from './saqlainRecoveryAgent.ts';
import { readVerifiedAuditLog } from './saqlainAuditLog.ts';

async function setup() {
  const root = await mkdtemp(join(tmpdir(), 'saqlain-recovery-agent-'));
  const sourceRoot = join(root, 'backups');
  const stagingRoot = join(root, 'recovery-staging');
  const auditPath = join(root, 'audit', 'events.jsonl');
  const original = new TextEncoder().encode('protected original stays unchanged');
  const snapshot = await createVerifiedLocalSnapshot({
    storageRoot: sourceRoot,
    snapshotId: 'approved-snapshot',
    source: 'gouse-ai',
    files: [{ relativePath: 'project/data.txt', bytes: original }],
    now: new Date('2026-01-01T00:00:00.000Z'),
  });
  return { root, sourceRoot, stagingRoot, auditPath, original, snapshot };
}

test('verified snapshot is rehearsed into isolated staging and never promotes to originals', async () => {
  const ctx = await setup();
  try {
    const before = await readFile(join(ctx.snapshot.directory, 'project/data.txt'));
    const result = await runRecoveryRehearsal({
      sourceSnapshotDirectory: ctx.snapshot.directory,
      stagingRoot: ctx.stagingRoot,
      auditFilePath: ctx.auditPath,
      recoveryAgentId: 'saq-recovery-agent',
      now: new Date('2026-01-02T00:00:00.000Z'),
    });
    assert.equal(result.decision, 'VERIFIED');
    assert.equal(result.verifiedFiles, 1);
    assert.equal(result.originalsModified, false);
    assert.equal(result.promotionAllowed, false);
    assert.ok(result.stagingSnapshot);
    assert.deepEqual(new Uint8Array(await readFile(join(result.stagingSnapshot!.directory, 'project/data.txt'))), ctx.original);
    assert.deepEqual(await readFile(join(ctx.snapshot.directory, 'project/data.txt')), before);
    const audit = await readVerifiedAuditLog(ctx.auditPath);
    assert.equal(audit.length, 1);
    assert.equal(audit[0].eventType, 'SAQLAIN_RECOVERY_REHEARSAL');
  } finally { await rm(ctx.root, { recursive: true, force: true }); }
});

test('tampered snapshot is held and is not staged', async () => {
  const ctx = await setup();
  try {
    await writeFile(join(ctx.snapshot.directory, 'project/data.txt'), 'tampered bytes');
    const result = await runRecoveryRehearsal({
      sourceSnapshotDirectory: ctx.snapshot.directory,
      stagingRoot: ctx.stagingRoot,
      auditFilePath: ctx.auditPath,
      recoveryAgentId: 'saq-recovery-agent',
    });
    assert.equal(result.decision, 'HOLD');
    assert.equal(result.stagingSnapshot, null);
    assert.equal(result.originalsModified, false);
    assert.equal(result.promotionAllowed, false);
  } finally { await rm(ctx.root, { recursive: true, force: true }); }
});

test('overlapping source and staging roots are held', async () => {
  const ctx = await setup();
  try {
    const result = await runRecoveryRehearsal({
      sourceSnapshotDirectory: ctx.snapshot.directory,
      stagingRoot: ctx.snapshot.directory,
      auditFilePath: ctx.auditPath,
      recoveryAgentId: 'saq-recovery-agent',
    });
    assert.equal(result.decision, 'HOLD');
    assert.equal(result.stagingSnapshot, null);
  } finally { await rm(ctx.root, { recursive: true, force: true }); }
});

test('missing audit path cannot report successful recovery', async () => {
  const ctx = await setup();
  try {
    await assert.rejects(runRecoveryRehearsal({
      sourceSnapshotDirectory: ctx.snapshot.directory,
      stagingRoot: ctx.stagingRoot,
      auditFilePath: '',
      recoveryAgentId: 'saq-recovery-agent',
    }), /auditFilePath is required/);
  } finally { await rm(ctx.root, { recursive: true, force: true }); }
});
