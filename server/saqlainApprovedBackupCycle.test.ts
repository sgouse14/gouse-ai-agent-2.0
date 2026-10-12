import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { SAQLAIN_BACKUP_TEAM } from './saqlainBackupTeam.ts';
import { runApprovedBackupAgentSnapshot } from './saqlainApprovedBackupCycle.ts';

test('approved backup agent creates a verified snapshot from its mapped source', async () => {
  const base = await mkdtemp(join(tmpdir(), 'saqlain-approved-cycle-'));
  const sourceRoot = join(base, 'source');
  const storageRoot = join(base, 'backup-store');
  try {
    await mkdir(sourceRoot);
    await writeFile(join(sourceRoot, 'project.txt'), 'project data');
    const agent = SAQLAIN_BACKUP_TEAM.find((candidate) => candidate.id === 'saq-backup-gouse')!;
    const result = await runApprovedBackupAgentSnapshot(agent, 'saqlain-cycle-00000001', {
      storageRoot,
      approvedRoots: { 'gouse-ai': sourceRoot },
      sourceByAgentId: { 'saq-backup-gouse': 'gouse-ai' },
      now: () => new Date('2026-10-12T00:00:00.000Z'),
    });
    assert.equal(result.status, 'VERIFIED');
    assert.equal(result.verifiedFiles, 1);
    assert.equal(await readFile(join(result.directory, 'project.txt'), 'utf8'), 'project data');
    assert.equal(await readFile(join(sourceRoot, 'project.txt'), 'utf8'), 'project data');
  } finally {
    await rm(base, { recursive: true, force: true });
  }
});

test('approved backup agent fails closed without a source mapping', async () => {
  const base = await mkdtemp(join(tmpdir(), 'saqlain-approved-cycle-'));
  try {
    const agent = SAQLAIN_BACKUP_TEAM.find((candidate) => candidate.id === 'saq-backup-gouse')!;
    await assert.rejects(() => runApprovedBackupAgentSnapshot(agent, 'cycle-1', {
      storageRoot: join(base, 'backups'),
      approvedRoots: {},
      sourceByAgentId: {},
    }), /no explicitly approved source mapping/i);
  } finally {
    await rm(base, { recursive: true, force: true });
  }
});

test('backup agent cannot write snapshots inside its source root', async () => {
  const base = await mkdtemp(join(tmpdir(), 'saqlain-approved-cycle-'));
  try {
    const sourceRoot = join(base, 'source');
    await mkdir(sourceRoot);
    await writeFile(join(sourceRoot, 'project.txt'), 'project data');
    const agent = SAQLAIN_BACKUP_TEAM.find((candidate) => candidate.id === 'saq-backup-gouse')!;
    await assert.rejects(() => runApprovedBackupAgentSnapshot(agent, 'cycle-1', {
      storageRoot: join(sourceRoot, 'backups'),
      approvedRoots: { 'gouse-ai': sourceRoot },
      sourceByAgentId: { 'saq-backup-gouse': 'gouse-ai' },
    }), /must not be inside the approved source root/i);
  } finally {
    await rm(base, { recursive: true, force: true });
  }
});
