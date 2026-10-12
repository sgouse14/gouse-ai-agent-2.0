import test from 'node:test';
import assert from 'node:assert/strict';
import { createBackupManifest, verifyBackupCopy, verifyBackupManifest, validateRelativeBackupPath } from './saqlainBackupManifest.ts';

const bytes = (text: string) => new TextEncoder().encode(text);

test('manifest records stable SHA-256 digests and validates', () => {
  const manifest = createBackupManifest({
    snapshotId: 'snapshot-001',
    source: 'protected-files',
    files: [{ relativePath: 'docs/spec.txt', bytes: bytes('protected source') }],
    now: new Date('2026-01-01T00:00:00.000Z'),
  });
  assert.equal(manifest.originalsModified, false);
  assert.equal(verifyBackupManifest(manifest), true);
  assert.equal(verifyBackupCopy(manifest.entries[0], bytes('protected source')).verified, true);
  assert.equal(verifyBackupCopy(manifest.entries[0], bytes('tampered source')).verified, false);
});

test('manifest rejects traversal and absolute paths', () => {
  assert.throws(() => validateRelativeBackupPath('../secret.txt'));
  assert.throws(() => validateRelativeBackupPath('/etc/passwd'));
  assert.throws(() => validateRelativeBackupPath('folder/../secret.txt'));
});

test('manifest rejects duplicate paths and detects tampered metadata', () => {
  assert.throws(() => createBackupManifest({
    snapshotId: 'snapshot-002', source: 'gouse-ai',
    files: [
      { relativePath: 'a.txt', bytes: bytes('one') },
      { relativePath: 'a.txt', bytes: bytes('two') },
    ],
  }));
  const manifest = createBackupManifest({
    snapshotId: 'snapshot-003', source: 'saqlain-ai',
    files: [{ relativePath: 'a.txt', bytes: bytes('original') }],
  });
  const tampered = { ...manifest, entries: [{ ...manifest.entries[0], sha256: '0'.repeat(64) }] };
  assert.equal(verifyBackupManifest(tampered), false);
});
