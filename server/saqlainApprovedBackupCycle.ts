import { createVerifiedLocalSnapshot, type BackupStorageResult } from './saqlainBackupStorage.ts';
import { readApprovedBackupSource, type BackupSourceLimits } from './saqlainBackupSourceAdapter.ts';
import type { BackupManifest } from './saqlainBackupManifest.ts';
import type { SaqlainBackupAgent } from './saqlainBackupTeam.ts';

export interface ApprovedBackupAgentConfig {
  storageRoot: string;
  approvedRoots: Partial<Record<BackupManifest['source'], string>>;
  sourceByAgentId: Readonly<Record<string, BackupManifest['source']>>;
  limits?: BackupSourceLimits;
  now?: () => Date;
}

/** Runs one of the source-copying backup agents from an explicit allowlist. */
export async function runApprovedBackupAgentSnapshot(
  agent: SaqlainBackupAgent,
  cycleId: string,
  config: ApprovedBackupAgentConfig,
): Promise<BackupStorageResult> {
  if (agent.role !== 'BACKUP') throw new Error('Only backup-role agents can create source snapshots.');
  const source = config.sourceByAgentId[agent.id];
  if (!source) throw new Error('Agent has no explicitly approved source mapping: ' + agent.id);
  const sourceResult = await readApprovedBackupSource({
    source,
    approvedRoots: config.approvedRoots,
    limits: config.limits,
  });
  const snapshotId = (cycleId + '-' + agent.id).replace(/[^A-Za-z0-9._-]/g, '-').slice(0, 120);
  return createVerifiedLocalSnapshot({
    storageRoot: config.storageRoot,
    snapshotId,
    source,
    files: sourceResult.files,
    now: config.now?.(),
  });
}
