import { readFile } from 'node:fs/promises';
import { relative, resolve, sep } from 'node:path';
import { verifyBackupCopy, verifyBackupManifest, type BackupManifest } from './saqlainBackupManifest.ts';
import { type BackupStorageResult } from './saqlainBackupStorage.ts';
import { runRecoveryRehearsal } from './saqlainRecoveryAgent.ts';
import { SAQLAIN_BACKUP_TEAM, type SaqlainBackupAgent } from './saqlainBackupTeam.ts';
import { type ApprovedBackupAgentConfig } from './saqlainApprovedBackupCycle.ts';
import { runSecureBackupAgent } from './saqlainSecureBackupAgent.ts';
import { createSaqlainBackupRuntime, type AgentCycleOutcome, type SaqlainBackupRuntime, type SaqlainBackupRuntimeOptions } from './saqlainBackupRuntime.ts';

export interface ApprovedContinuousBackupOptions extends Omit<SaqlainBackupRuntimeOptions, 'runAgentCycle'>, ApprovedBackupAgentConfig {
  /** Separate destination for recovery rehearsals. Never point this at an original source. */
  recoveryStagingRoot: string;
}

function isWithin(parent: string, child: string): boolean {
  const rel = relative(parent, child);
  return rel === '' || (rel !== '..' && !rel.startsWith('..' + sep) && !rel.startsWith('/'));
}

function assertDisjointRoots(a: string, b: string, label: string): void {
  const left = resolve(a);
  const right = resolve(b);
  if (isWithin(left, right) || isWithin(right, left)) {
    throw new Error(label + ' must be separate, non-overlapping directories.');
  }
}

async function verifyPersistedSnapshot(snapshot: BackupStorageResult): Promise<boolean> {
  try {
    const manifest = JSON.parse(await readFile(snapshot.manifestPath, 'utf8')) as BackupManifest;
    if (!verifyBackupManifest(manifest) || manifest.snapshotId !== snapshot.snapshotId) return false;
    for (const entry of manifest.entries) {
      const path = resolve(snapshot.directory, entry.relativePath);
      if (!isWithin(snapshot.directory, path) || path === snapshot.directory) return false;
      const bytes = new Uint8Array(await readFile(path));
      if (!verifyBackupCopy(entry, bytes).verified) return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Wires approved local sources into the 30-minute runtime. The recovery role
 * performs a restore rehearsal into a separate staging root; it never restores
 * over originals. Actual production deployment still needs a supervisor,
 * off-host replication, alerts, and operator-approved restore procedures.
 */
export function createApprovedContinuousBackupRuntime(
  options: ApprovedContinuousBackupOptions,
): SaqlainBackupRuntime {
  assertDisjointRoots(options.storageRoot, options.recoveryStagingRoot, 'Backup storage and recovery staging');
  for (const source of Object.values(options.approvedRoots)) {
    if (source) {
      assertDisjointRoots(source, options.storageRoot, 'Source and backup storage');
      assertDisjointRoots(source, options.recoveryStagingRoot, 'Source and recovery staging');
    }
  }

  const snapshotsByCycle = new Map<string, Map<string, BackupStorageResult>>();
  const runAgentCycle = async (agent: SaqlainBackupAgent, cycleId: string): Promise<AgentCycleOutcome> => {
    if (agent.role === 'BACKUP' && agent.id !== 'saq-backup-verify') {
      if (!options.auditFilePath) {
        return { status: 'HOLD', summary: 'Secure backup held: durable audit path is not configured.' };
      }
      const result = await runSecureBackupAgent({
        agent,
        cycleId,
        config: options,
        auditFilePath: options.auditFilePath,
      });
      if (result.decision !== 'VERIFIED' || !result.snapshot) {
        return { status: 'HOLD', summary: 'Secure backup held: ' + result.reason };
      }
      const snapshot = result.snapshot;
      const snapshots = snapshotsByCycle.get(cycleId) ?? new Map<string, BackupStorageResult>();
      snapshots.set(agent.id, snapshot);
      snapshotsByCycle.set(cycleId, snapshots);
      return { status: 'VERIFIED', summary: 'Secure audited snapshot ' + snapshot.snapshotId + ' with ' + result.verifiedFiles + ' verified files.' };
    }

    if (agent.id === 'saq-backup-verify') {
      const snapshots = snapshotsByCycle.get(cycleId);
      const sourceAgents = SAQLAIN_BACKUP_TEAM.filter((candidate) => candidate.role === 'BACKUP' && candidate.id !== 'saq-backup-verify');
      if (!snapshots || snapshots.size !== sourceAgents.length) {
        snapshotsByCycle.delete(cycleId);
        return { status: 'HOLD', summary: 'Expected source snapshots are missing; recovery is blocked.' };
      }
      for (const sourceAgent of sourceAgents) {
        const snapshot = snapshots.get(sourceAgent.id);
        if (!snapshot || !(await verifyPersistedSnapshot(snapshot))) {
          snapshotsByCycle.delete(cycleId);
          return { status: 'HOLD', summary: 'Snapshot integrity check failed for ' + sourceAgent.id + '; recovery is blocked.' };
        }
      }
      return { status: 'VERIFIED', summary: 'All ' + snapshots.size + ' source snapshots and persisted manifests re-verified.' };
    }

    if (agent.role === 'RECOVERY') {
      const snapshots = snapshotsByCycle.get(cycleId);
      const sourceAgents = SAQLAIN_BACKUP_TEAM.filter((candidate) => candidate.role === 'BACKUP' && candidate.id !== 'saq-backup-verify');
      if (!snapshots || snapshots.size !== sourceAgents.length) {
        return { status: 'HOLD', summary: 'Recovery rehearsal blocked: source snapshots are missing.' };
      }
      if (!options.auditFilePath) {
        return { status: 'HOLD', summary: 'Recovery rehearsal blocked: durable audit path is not configured.' };
      }
      let staged = 0;
      for (const sourceAgent of sourceAgents) {
        const snapshot = snapshots.get(sourceAgent.id);
        if (!snapshot) return { status: 'HOLD', summary: 'Recovery rehearsal blocked: snapshot missing for ' + sourceAgent.id + '.' };
        const result = await runRecoveryRehearsal({
          sourceSnapshotDirectory: snapshot.directory,
          stagingRoot: options.recoveryStagingRoot,
          auditFilePath: options.auditFilePath,
          recoveryAgentId: agent.id,
          stagingSnapshotId: (cycleId + '-recovery-' + sourceAgent.id).replace(/[^A-Za-z0-9._-]/g, '-').slice(0, 120),
          now: options.now?.(),
        });
        if (result.decision !== 'VERIFIED' || !result.stagingSnapshot || result.originalsModified || result.promotionAllowed) {
          return { status: 'HOLD', summary: 'Recovery rehearsal held for ' + sourceAgent.id + ': ' + result.reason };
        }
        staged += result.verifiedFiles;
      }
      return { status: 'VERIFIED', summary: 'Recovery Agent verified and staged ' + staged + ' files across ' + sourceAgents.length + ' isolated recovery copies; originals were not modified and no automatic promotion is allowed.' };
    }

    return { status: 'HOLD', summary: 'Unknown agent role; work held for review.' };
  };

  return createSaqlainBackupRuntime({
    runAgentCycle,
    auditFilePath: options.auditFilePath,
    now: options.now,
    setIntervalFn: options.setIntervalFn,
    clearIntervalFn: options.clearIntervalFn,
    onCycleComplete: (cycleId) => { snapshotsByCycle.delete(cycleId); },
  });
}
