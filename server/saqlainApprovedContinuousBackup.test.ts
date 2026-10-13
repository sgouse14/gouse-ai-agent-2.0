import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { SAQLAIN_BACKUP_TEAM } from './saqlainBackupTeam.ts';
import { createApprovedContinuousBackupRuntime } from './saqlainApprovedContinuousBackup.ts';

test('continuous runtime snapshots approved sources, verifies copies, and rehearses recovery separately', async () => {
  const base = await mkdtemp(join(tmpdir(), 'saqlain-continuous-backup-'));
  const sourceGouse = join(base, 'source-gouse');
  const sourceSaqlain = join(base, 'source-saqlain');
  const sourceProtected = join(base, 'source-protected');
  const backupRoot = join(base, 'backup-store');
  const recoveryRoot = join(base, 'recovery-staging');
  try {
    await Promise.all([mkdir(sourceGouse), mkdir(sourceSaqlain), mkdir(sourceProtected)]);
    await Promise.all([
      writeFile(join(sourceGouse, 'app.txt'), 'gouse source'),
      writeFile(join(sourceSaqlain, 'agent.txt'), 'saqlain source'),
      writeFile(join(sourceProtected, 'policy.txt'), 'protected policy'),
    ]);
    const runtime = createApprovedContinuousBackupRuntime({
      storageRoot: backupRoot,
      recoveryStagingRoot: recoveryRoot,
      auditFilePath: join(base, 'audit', 'events.jsonl'),
      approvedRoots: {
        'gouse-ai': sourceGouse,
        'saqlain-ai': sourceSaqlain,
        'protected-files': sourceProtected,
      },
      sourceByAgentId: {
        'saq-backup-gouse': 'gouse-ai',
        'saq-backup-saqlain': 'saqlain-ai',
        'saq-backup-files': 'protected-files',
      },
      now: () => new Date('2026-10-12T00:00:00.000Z'),
    });
    const report = await runtime.runCycle();
    assert.equal(report.status, 'VERIFIED');
    assert.equal(report.results.length, 5);
    assert.equal(report.results.find((r) => r.agentId === 'saq-backup-verify')?.status, 'VERIFIED');
    assert.equal(report.results.find((r) => r.role === 'RECOVERY')?.status, 'VERIFIED');
    assert.equal(await readFile(join(sourceGouse, 'app.txt'), 'utf8'), 'gouse source');
    assert.equal(await readFile(join(sourceSaqlain, 'agent.txt'), 'utf8'), 'saqlain source');
    assert.equal(await readFile(join(sourceProtected, 'policy.txt'), 'utf8'), 'protected policy');
    assert.equal(await readFile(join(recoveryRoot, report.cycleId + '-recovery-saq-backup-gouse', 'app.txt'), 'utf8'), 'gouse source');
    assert.equal(await readFile(join(recoveryRoot, report.cycleId + '-recovery-saq-backup-saqlain', 'agent.txt'), 'utf8'), 'saqlain source');
    assert.equal(await readFile(join(recoveryRoot, report.cycleId + '-recovery-saq-backup-files', 'policy.txt'), 'utf8'), 'protected policy');
    assert.equal(SAQLAIN_BACKUP_TEAM.length, 5);
  } finally {
    await rm(base, { recursive: true, force: true });
  }
});

test('continuous runtime holds recovery if a source snapshot cannot be produced', async () => {
  const base = await mkdtemp(join(tmpdir(), 'saqlain-continuous-backup-'));
  const sourceGouse = join(base, 'source-gouse');
  const sourceSaqlain = join(base, 'source-saqlain');
  const sourceProtected = join(base, 'source-protected');
  try {
    await Promise.all([mkdir(sourceGouse), mkdir(sourceSaqlain), mkdir(sourceProtected)]);
    await writeFile(join(sourceGouse, 'app.txt'), 'gouse source');
    await writeFile(join(sourceSaqlain, 'agent.txt'), 'saqlain source');
    await writeFile(join(sourceProtected, 'policy.txt'), 'protected policy');
    const runtime = createApprovedContinuousBackupRuntime({
      storageRoot: join(base, 'backup-store'),
      recoveryStagingRoot: join(base, 'recovery-staging'),
      auditFilePath: join(base, 'audit', 'events.jsonl'),
      approvedRoots: { 'gouse-ai': sourceGouse, 'saqlain-ai': sourceSaqlain, 'protected-files': sourceProtected },
      sourceByAgentId: { 'saq-backup-gouse': 'gouse-ai', 'saq-backup-saqlain': 'saqlain-ai' },
    });
    const report = await runtime.runCycle();
    assert.equal(report.status, 'PARTIAL');
    assert.notEqual(report.results.find((r) => r.agentId === 'saq-backup-verify')?.status, 'VERIFIED');
    assert.equal(report.results.find((r) => r.role === 'RECOVERY')?.status, 'HOLD');
  } finally {
    await rm(base, { recursive: true, force: true });
  }
});

test('continuous runtime rejects overlapping source, backup, and recovery directories', async () => {
  const base = await mkdtemp(join(tmpdir(), 'saqlain-continuous-backup-'));
  try {
    const source = join(base, 'source');
    await mkdir(source);
    assert.throws(() => createApprovedContinuousBackupRuntime({
      storageRoot: join(source, 'backup'),
      recoveryStagingRoot: join(base, 'recovery'),
      approvedRoots: { 'gouse-ai': source },
      sourceByAgentId: { 'saq-backup-gouse': 'gouse-ai' },
    }), /separate, non-overlapping directories/);
  } finally {
    await rm(base, { recursive: true, force: true });
  }
});


test('successive cycles use distinct snapshot identifiers even with a fixed clock', async () => {
  const base = await mkdtemp(join(tmpdir(), 'saqlain-cycle-ids-'));
  const roots = {
    'gouse-ai': join(base, 'gouse'),
    'saqlain-ai': join(base, 'saqlain'),
    'protected-files': join(base, 'protected'),
  };
  try {
    await Promise.all(Object.values(roots).map((root) => mkdir(root)));
    await Promise.all([
      writeFile(join(roots['gouse-ai'], 'app.txt'), 'gouse'),
      writeFile(join(roots['saqlain-ai'], 'agent.txt'), 'saqlain'),
      writeFile(join(roots['protected-files'], 'policy.txt'), 'protected'),
    ]);
    const runtime = createApprovedContinuousBackupRuntime({
      storageRoot: join(base, 'backup-store'),
      recoveryStagingRoot: join(base, 'recovery-staging'),
      auditFilePath: join(base, 'audit', 'events.jsonl'),
      approvedRoots: roots,
      sourceByAgentId: {
        'saq-backup-gouse': 'gouse-ai',
        'saq-backup-saqlain': 'saqlain-ai',
        'saq-backup-files': 'protected-files',
      },
      now: () => new Date('2026-10-12T00:00:00.000Z'),
    });
    const first = await runtime.runCycle();
    const second = await runtime.runCycle();
    assert.equal(first.status, 'VERIFIED');
    assert.equal(second.status, 'VERIFIED');
    assert.notEqual(first.cycleId, second.cycleId);
  } finally {
    await rm(base, { recursive: true, force: true });
  }
});
