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
