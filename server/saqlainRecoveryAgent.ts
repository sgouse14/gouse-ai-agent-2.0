import { lstat, mkdir, readFile } from 'node:fs/promises';
import { canonicalizePathForSafety } from './saqlainPathSafety.ts';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { appendDurableAuditEvent } from './saqlainAuditLog.ts';
import { verifyBackupCopy, verifyBackupManifest, type BackupManifest } from './saqlainBackupManifest.ts';
import { createVerifiedLocalSnapshot, type BackupStorageResult } from './saqlainBackupStorage.ts';

export type RecoveryDecision = 'VERIFIED' | 'HOLD' | 'FAILED';

export interface RecoveryRehearsalResult {
  decision: RecoveryDecision;
  sourceSnapshotId: string;
  stagingSnapshot: BackupStorageResult | null;
  verifiedFiles: number;
  originalsModified: false;
  promotionAllowed: false;
  reason: string;
}

function assertDisjoint(source: string, staging: string): void {
  const s = resolve(source), d = resolve(staging);
  const within = (parent: string, child: string) => {
    const rel = relative(parent, child);
    return rel === '' || (rel !== '..' && !rel.startsWith('..' + sep) && !isAbsolute(rel));
  };
  if (within(s, d) || within(d, s)) throw new Error('Recovery staging and source snapshot must be separate, non-overlapping paths.');
}

async function assertRealDirectory(path: string): Promise<void> {
  const info = await lstat(path);
  if (!info.isDirectory() || info.isSymbolicLink()) throw new Error('Recovery path must be a real directory, not a symlink.');
}

/**
 * Defensive recovery agent. It verifies a backup snapshot and rehearses recovery
 * into a new, separate staging snapshot only. It never writes to the source,
 * deletes evidence, or promotes staged files over originals.
 */
export async function runRecoveryRehearsal(input: {
  sourceSnapshotDirectory: string;
  stagingRoot: string;
  auditFilePath: string;
  recoveryAgentId: string;
  stagingSnapshotId?: string;
  now?: Date;
}): Promise<RecoveryRehearsalResult> {
  const sourceDir = resolve(input.sourceSnapshotDirectory);
  const stagingRoot = resolve(input.stagingRoot);
  const now = input.now ?? new Date();
  if (!input.recoveryAgentId.trim()) throw new Error('recoveryAgentId is required.');
  if (!input.auditFilePath.trim()) throw new Error('auditFilePath is required.');
  let sourceSnapshotId = 'unknown';
  let verifiedFiles = 0;
  let stagingSnapshot: BackupStorageResult | null = null;
  let decision: RecoveryDecision = 'HOLD';
  let reason = 'Recovery not completed.';
  try {
    const canonicalSourceDir = await canonicalizePathForSafety(sourceDir);
    const canonicalStagingRoot = await canonicalizePathForSafety(stagingRoot);
    assertDisjoint(canonicalSourceDir, canonicalStagingRoot);
    // Keep checking the caller-provided final path component with lstat so a
    // symlink at the source root is rejected rather than silently followed.
    await assertRealDirectory(sourceDir);
    await mkdir(stagingRoot, { recursive: true, mode: 0o700 });
    await assertRealDirectory(stagingRoot);
    const manifestPath = resolve(sourceDir, 'backup-manifest.json');
    const manifestInfo = await lstat(manifestPath);
    if (!manifestInfo.isFile() || manifestInfo.isSymbolicLink()) throw new Error('Backup manifest must be a regular file.');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as BackupManifest;
    sourceSnapshotId = manifest.snapshotId;
    if (!verifyBackupManifest(manifest)) throw new Error('Backup manifest integrity verification failed.');
    const files: { relativePath: string; bytes: Uint8Array }[] = [];
    for (const entry of manifest.entries) {
      const parts = entry.relativePath.split('/');
      let cursor = sourceDir;
      for (const part of parts) {
        cursor = resolve(cursor, part);
        const info = await lstat(cursor);
        if (info.isSymbolicLink()) throw new Error('Symlink found in backup snapshot: ' + entry.relativePath);
      }
      const fileInfo = await lstat(cursor);
      if (!fileInfo.isFile()) throw new Error('Snapshot entry is not a regular file: ' + entry.relativePath);
      const bytes = new Uint8Array(await readFile(cursor));
      if (!verifyBackupCopy(entry, bytes).verified) throw new Error('Snapshot checksum mismatch: ' + entry.relativePath);
      files.push({ relativePath: entry.relativePath, bytes });
      verifiedFiles += 1;
    }
    stagingSnapshot = await createVerifiedLocalSnapshot({
      storageRoot: stagingRoot,
      source: manifest.source,
      files,
      snapshotId: input.stagingSnapshotId ?? ('recovery-' + manifest.snapshotId + '-' + now.getTime()),
      now,
    });
    decision = 'VERIFIED';
    reason = 'Snapshot verified and recovery rehearsal copied to separate staging. Operator approval is required for any production restore.';
  } catch (error) {
    decision = 'HOLD';
    reason = error instanceof Error ? error.message : 'Unknown recovery verification error.';
  }

  // Fail closed: if the audit cannot be written, do not report a successful recovery.
  await appendDurableAuditEvent(input.auditFilePath, {
    eventType: 'SAQLAIN_RECOVERY_REHEARSAL',
    actorId: input.recoveryAgentId,
    outcome: decision === 'VERIFIED' ? 'ALLOW' : 'HOLD',
    resource: sourceSnapshotId,
    occurredAt: now.toISOString(),
    details: {
      decision,
      verifiedFiles,
      originalsModified: false,
      promotionAllowed: false,
      reason: reason.slice(0, 1000),
      stagingSnapshotId: stagingSnapshot?.snapshotId ?? null,
    },
  });
  return {
    decision,
    sourceSnapshotId,
    stagingSnapshot,
    verifiedFiles,
    originalsModified: false,
    promotionAllowed: false,
    reason,
  };
}
