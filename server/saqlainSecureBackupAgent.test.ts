import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, open, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { SAQLAIN_BACKUP_TEAM } from './saqlainBackupTeam.ts';
import { runSecureBackupAgent } from './saqlainSecureBackupAgent.ts';
import { readVerifiedAuditLog } from './saqlainAuditLog.ts';

async function setup() {
  const root = await mkdtemp(join(tmpdir(), 'saqlain-secure-backup-'));
  const sourceRoot = join(root, 'approved-source');
  const storageRoot = join(root, 'backup-store');
  const auditFilePath = join(root, 'audit', 'events.jsonl');
  await mkdir(sourceRoot);
  await writeFile(join(sourceRoot, 'project.txt'), 'protected project source');
  const agent = SAQLAIN_BACKUP_TEAM.find((item) => item.id === 'saq-backup-gouse')!;
  const config = {
    storageRoot,
    approvedRoots: { 'gouse-ai': sourceRoot },
    sourceByAgentId: { 'saq-backup-gouse': 'gouse-ai' as const },
    now: () => new Date('2026-10-13T00:00:00.000Z'),
  };
  return { root, sourceRoot, storageRoot, auditFilePath, agent, config };
}

test('secure backup creates and re-verifies a versioned snapshot, auditing success without changing source', async () => {
  const ctx = await setup();
  try {
    const originalBefore = await readFile(join(ctx.sourceRoot, 'project.txt'));
    const result = await runSecureBackupAgent({
      agent: ctx.agent, cycleId: 'test-cycle-01', config: ctx.config, auditFilePath: ctx.auditFilePath,
    });
    assert.equal(result.decision, 'VERIFIED');
    assert.equal(result.originalsModified, false);
    assert.equal(result.verifiedFiles, 1);
    assert.equal(await readFile(join(result.snapshot!.directory, 'project.txt'), 'utf8'), 'protected project source');
    assert.deepEqual(await readFile(join(ctx.sourceRoot, 'project.txt')), originalBefore);
    const events = await readVerifiedAuditLog(ctx.auditFilePath);
    assert.equal(events.length, 1);
    assert.equal(events[0].eventType, 'SAQLAIN_SECURE_BACKUP');
    assert.equal(events[0].outcome, 'ALLOW');
  } finally { await rm(ctx.root, { recursive: true, force: true }); }
});

test('rejects audit paths inside protected source before writing anything there', async () => {
  const ctx = await setup();
  try {
    const sourceFile = join(ctx.sourceRoot, 'project.txt');
    const before = await readFile(sourceFile);
    await assert.rejects(runSecureBackupAgent({
      agent: ctx.agent,
      cycleId: 'test-cycle-02',
      config: ctx.config,
      auditFilePath: join(ctx.sourceRoot, 'audit.jsonl'),
    }), /Source and audit log must be separate/);
    assert.deepEqual(await readFile(sourceFile), before);
    await assert.rejects(readFile(join(ctx.sourceRoot, 'audit.jsonl')));
    await assert.rejects(readFile(join(ctx.storageRoot, 'test-cycle-02-saq-backup-gouse', 'project.txt')));
  } finally { await rm(ctx.root, { recursive: true, force: true }); }
});

test('rejects backup storage that contains or is contained by the source', async () => {
  const ctx = await setup();
  try {
    await assert.rejects(runSecureBackupAgent({
      agent: ctx.agent,
      cycleId: 'test-cycle-03',
      config: { ...ctx.config, storageRoot: join(ctx.sourceRoot, 'backups') },
      auditFilePath: ctx.auditFilePath,
    }), /Source and backup storage must be separate/);
    await assert.rejects(runSecureBackupAgent({
      agent: ctx.agent,
      cycleId: 'test-cycle-04',
      config: { ...ctx.config, storageRoot: ctx.root },
      auditFilePath: ctx.auditFilePath,
    }), /Source and backup storage must be separate/);
  } finally { await rm(ctx.root, { recursive: true, force: true }); }
});

test('audit lock failure prevents VERIFIED result and does not mutate source', async () => {
  const ctx = await setup();
  try {
    await mkdir(join(ctx.root, 'audit'));
    const lock = await open(ctx.auditFilePath + '.lock', 'wx');
    await lock.close();
    const before = await readFile(join(ctx.sourceRoot, 'project.txt'));
    await assert.rejects(runSecureBackupAgent({
      agent: ctx.agent, cycleId: 'test-cycle-05', config: ctx.config, auditFilePath: ctx.auditFilePath,
    }));
    assert.deepEqual(await readFile(join(ctx.sourceRoot, 'project.txt')), before);
    // Snapshot evidence is intentionally retained if audit persistence fails.
    assert.equal(await readFile(join(ctx.storageRoot, 'test-cycle-05-saq-backup-gouse', 'project.txt'), 'utf8'), 'protected project source');
  } finally { await rm(ctx.root, { recursive: true, force: true }); }
});


test('off-site archive failure keeps the backup on HOLD and retains verified local evidence', async () => {
  const ctx = await setup();
  try {
    const sourcePath = join(ctx.sourceRoot, 'project.txt');
    const originalBefore = await readFile(sourcePath);
    const result = await runSecureBackupAgent({
      agent: ctx.agent,
      cycleId: 'test-cycle-archive-failure',
      config: ctx.config,
      auditFilePath: ctx.auditFilePath,
      archiveSnapshot: async () => { throw new Error('GCS archive unavailable'); },
    });
    assert.equal(result.decision, 'HOLD');
    assert.equal(result.remoteArchive, null);
    assert.match(result.reason, /GCS archive unavailable/);
    assert.equal(result.originalsModified, false);
    assert.deepEqual(await readFile(sourcePath), originalBefore);
    assert.equal(await readFile(join(result.snapshot!.directory, 'project.txt'), 'utf8'), 'protected project source');
    const events = await readVerifiedAuditLog(ctx.auditFilePath);
    assert.equal(events[0].outcome, 'HOLD');
    assert.equal(events[0].details?.decision, 'HOLD');
    assert.equal(events[0].details?.remoteArchive, null);
  } finally { await rm(ctx.root, { recursive: true, force: true }); }
});

test('a verified remote archive receipt is included in the durable backup audit', async () => {
  const ctx = await setup();
  try {
    const result = await runSecureBackupAgent({
      agent: ctx.agent,
      cycleId: 'test-cycle-archive-success',
      config: ctx.config,
      auditFilePath: ctx.auditFilePath,
      archiveSnapshot: async snapshot => ({
        provider: 'google-cloud-storage',
        status: 'VERIFIED',
        bucket: 'saqlain-backups-test-01',
        prefix: 'saqlain-backups',
        snapshotId: snapshot.snapshotId,
        objectCount: 3,
        totalBytes: 24,
        manifestSha256: 'a'.repeat(64),
        completionObjectName: 'saqlain-backups/' + snapshot.snapshotId + '/ARCHIVE_COMPLETE.json',
        verifiedAt: '2026-10-24T10:05:00.000Z',
      }),
    });
    assert.equal(result.decision, 'VERIFIED');
    assert.equal(result.remoteArchive?.provider, 'google-cloud-storage');
    const events = await readVerifiedAuditLog(ctx.auditFilePath);
    assert.equal(events[0].outcome, 'ALLOW');
    assert.equal((events[0].details?.remoteArchive as Record<string, unknown>)?.bucket, 'saqlain-backups-test-01');
    assert.equal((events[0].details?.remoteArchive as Record<string, unknown>)?.completionObjectName, result.remoteArchive?.completionObjectName);
  } finally { await rm(ctx.root, { recursive: true, force: true }); }
});
