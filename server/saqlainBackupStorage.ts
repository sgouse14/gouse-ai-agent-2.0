import { mkdir, open, readFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createBackupManifest, verifyBackupCopy, verifyBackupManifest, validateRelativeBackupPath, type BackupFileInput, type BackupManifest } from './saqlainBackupManifest.ts';

export interface BackupStorageResult {
  snapshotId: string;
  directory: string;
  manifestPath: string;
  manifest: BackupManifest;
  verifiedFiles: number;
  status: 'VERIFIED';
}

function assertWithinRoot(root: string, candidate: string): void {
  const rel = relative(root, candidate);
  if (rel === '' || rel === '..' || rel.startsWith('..' + sep) || isAbsolute(rel)) {
    throw new Error('Resolved backup path is outside the snapshot directory.');
  }
}

async function writeNewFile(path: string, bytes: Uint8Array): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const handle = await open(path, 'wx', 0o600);
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
}

/**
 * Writes an append-only, uniquely named snapshot under a trusted local storage root.
 * It never writes to source paths. A production deployment must set restrictive
 * OS permissions and use a dedicated backup volume with its own access controls.
 */
export async function createVerifiedLocalSnapshot(input: {
  storageRoot: string;
  source: BackupManifest['source'];
  files: readonly BackupFileInput[];
  snapshotId?: string;
  now?: Date;
}): Promise<BackupStorageResult> {
  if (!input.storageRoot.trim()) throw new Error('storageRoot is required.');
  const snapshotId = input.snapshotId ?? randomUUID();
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/.test(snapshotId) || snapshotId === '.' || snapshotId === '..') {
    throw new Error('snapshotId contains unsupported characters.');
  }
  const root = resolve(input.storageRoot);
  await mkdir(root, { recursive: true, mode: 0o700 });
  const snapshotDirectory = resolve(root, snapshotId);
  assertWithinRoot(root, snapshotDirectory);
  // mkdir without recursive means an existing snapshot cannot be silently reused.
  await mkdir(snapshotDirectory, { recursive: false, mode: 0o700 });

  try {
    const manifest = createBackupManifest({ snapshotId, source: input.source, files: input.files, now: input.now });
    for (const file of input.files) {
      const safePath = validateRelativeBackupPath(file.relativePath);
      const target = resolve(snapshotDirectory, safePath);
      assertWithinRoot(snapshotDirectory, target);
      await writeNewFile(target, file.bytes);
    }

    let verifiedFiles = 0;
    for (const entry of manifest.entries) {
      const copyPath = resolve(snapshotDirectory, entry.relativePath);
      assertWithinRoot(snapshotDirectory, copyPath);
      const copiedBytes = new Uint8Array(await readFile(copyPath));
      const verification = verifyBackupCopy(entry, copiedBytes);
      if (!verification.verified) throw new Error('Snapshot copy verification failed: ' + entry.relativePath);
      verifiedFiles += 1;
    }
    if (!verifyBackupManifest(manifest)) throw new Error('Backup manifest failed integrity verification.');

    const manifestPath = resolve(snapshotDirectory, 'backup-manifest.json');
    assertWithinRoot(snapshotDirectory, manifestPath);
    await writeNewFile(manifestPath, new TextEncoder().encode(JSON.stringify(manifest, null, 2) + '\n'));
    const persisted = JSON.parse(await readFile(manifestPath, 'utf8')) as BackupManifest;
    if (!verifyBackupManifest(persisted)) throw new Error('Persisted manifest failed integrity verification.');

    return { snapshotId, directory: snapshotDirectory, manifestPath, manifest: persisted, verifiedFiles, status: 'VERIFIED' };
  } catch (error) {
    // Keep the partial snapshot for investigation; never clean up by deleting data automatically.
    throw new Error('Backup snapshot held for review at ' + snapshotDirectory + ': ' + (error instanceof Error ? error.message : 'unknown error'));
  }
}
