import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createVerifiedLocalSnapshot } from './saqlainBackupStorage.ts';

const bytes = (value: string) => new TextEncoder().encode(value);

test('local snapshot writes unique version and verifies stored copies', async () => {
  const root = await mkdtemp(join(tmpdir(), 'saqlain-backup-'));
  try {
    const result = await createVerifiedLocalSnapshot({
      storageRoot: root,
      snapshotId: 'snapshot-one',
      source: 'protected-files',
      files: [
        { relativePath: 'docs/a.txt', bytes: bytes('alpha') },
        { relativePath: 'docs/b.txt', bytes: bytes('beta') },
      ],
      now: new Date('2026-01-01T00:00:00.000Z'),
    });
    assert.equal(result.status, 'VERIFIED');
    assert.equal(result.verifiedFiles, 2);
    assert.equal(await readFile(join(result.directory, 'docs/a.txt'), 'utf8'), 'alpha');
    assert.equal(JSON.parse(await readFile(result.manifestPath, 'utf8')).originalsModified, false);
    await assert.rejects(() => createVerifiedLocalSnapshot({
      storageRoot: root, snapshotId: 'snapshot-one', source: 'protected-files',
      files: [{ relativePath: 'docs/a.txt', bytes: bytes('replacement') }],
    }));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('snapshot rejects unsafe paths without touching source paths', async () => {
  const root = await mkdtemp(join(tmpdir(), 'saqlain-backup-'));
  try {
    await assert.rejects(() => createVerifiedLocalSnapshot({
      storageRoot: root,
      snapshotId: 'snapshot-traversal',
      source: 'gouse-ai',
      files: [{ relativePath: '../outside.txt', bytes: bytes('do not write') }],
    }));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
