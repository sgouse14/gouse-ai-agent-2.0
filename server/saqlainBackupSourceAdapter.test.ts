import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { readApprovedBackupSource } from './saqlainBackupSourceAdapter.ts';

test('reads regular files under an explicitly approved source without modifying them', async () => {
  const root = await mkdtemp(join(tmpdir(), 'saqlain-approved-source-'));
  try {
    await mkdir(join(root, 'nested'));
    await writeFile(join(root, 'nested', 'file.txt'), 'approved content');
    const result = await readApprovedBackupSource({
      source: 'gouse-ai',
      approvedRoots: { 'gouse-ai': root },
    });
    assert.equal(result.source, 'gouse-ai');
    assert.equal(result.files.length, 1);
    assert.equal(result.files[0].relativePath, 'nested/file.txt');
    assert.equal(new TextDecoder().decode(result.files[0].bytes), 'approved content');
    assert.equal(await readFile(join(root, 'nested', 'file.txt'), 'utf8'), 'approved content');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('requires an explicit approved root and rejects symlinks', async () => {
  const root = await mkdtemp(join(tmpdir(), 'saqlain-approved-source-'));
  const outside = await mkdtemp(join(tmpdir(), 'saqlain-outside-source-'));
  try {
    await writeFile(join(outside, 'secret.txt'), 'do not follow');
    await assert.rejects(() => readApprovedBackupSource({
      source: 'gouse-ai',
      approvedRoots: {},
    }), /No approved root/);
    await symlink(join(outside, 'secret.txt'), join(root, 'linked.txt'));
    await assert.rejects(() => readApprovedBackupSource({
      source: 'gouse-ai',
      approvedRoots: { 'gouse-ai': root },
    }), /Symlink/);
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});

test('enforces source file and total-byte limits', async () => {
  const root = await mkdtemp(join(tmpdir(), 'saqlain-approved-source-'));
  try {
    await writeFile(join(root, 'a.txt'), '12345');
    await writeFile(join(root, 'b.txt'), '67890');
    await assert.rejects(() => readApprovedBackupSource({
      source: 'protected-files',
      approvedRoots: { 'protected-files': root },
      limits: { maxFileBytes: 4 },
    }), /file size limit/);
    await assert.rejects(() => readApprovedBackupSource({
      source: 'protected-files',
      approvedRoots: { 'protected-files': root },
      limits: { maxTotalBytes: 8 },
    }), /total-byte limit/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
