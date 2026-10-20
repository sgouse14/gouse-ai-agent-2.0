import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdir, mkdtemp, open, readFile, rm, symlink, writeFile } from 'node:fs/promises';
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


test('audit persistence failure rejects the recovery result and does not authorize promotion', async () => {
  const ctx = await setup();
  try {
    await mkdir(join(ctx.root, 'audit'), { recursive: true });
    const lock = await open(ctx.auditPath + '.lock', 'wx');
    await lock.close();
    await assert.rejects(runRecoveryRehearsal({
      sourceSnapshotDirectory: ctx.snapshot.directory,
      stagingRoot: ctx.stagingRoot,
      auditFilePath: ctx.auditPath,
      recoveryAgentId: 'saq-recovery-agent',
    }), /locked or has a stale lock/i);
    // The source snapshot remains readable and unchanged even when audit persistence fails.
    assert.deepEqual(
      new Uint8Array(await readFile(join(ctx.snapshot.directory, 'project/data.txt'))),
      ctx.original,
    );
  } finally { await rm(ctx.root, { recursive: true, force: true }); }
});



test('rejects staging alias that resolves back inside the source snapshot', async () => {
  const ctx = await setup();
  const alias = join(ctx.root, 'snapshot-alias');
  try {
    await symlink(ctx.snapshot.directory, alias, 'dir');
    const result = await runRecoveryRehearsal({
      sourceSnapshotDirectory: ctx.snapshot.directory,
      stagingRoot: join(alias, 'recovered'),
      auditFilePath: ctx.auditPath,
      recoveryAgentId: 'saq-recovery-agent',
    });
    assert.equal(result.decision, 'HOLD');
    assert.equal(result.stagingSnapshot, null);
    assert.equal(result.originalsModified, false);
    assert.equal(result.promotionAllowed, false);
    await assert.rejects(
      readFile(join(ctx.snapshot.directory, 'recovered', 'backup-manifest.json')),
      { code: 'ENOENT' },
    );
    assert.deepEqual(
      new Uint8Array(await readFile(join(ctx.snapshot.directory, 'project/data.txt'))),
      ctx.original,
    );
  } finally {
    await rm(ctx.root, { recursive: true, force: true });
  }
});
