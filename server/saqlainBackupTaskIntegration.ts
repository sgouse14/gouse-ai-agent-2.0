import { createVerifiedLocalSnapshot } from './saqlainBackupStorage.ts';
import {
  type QueueReport,
  type QueueTask,
  completeQueueTask,
  verifyQueueReport,
} from './saqlainTaskQueueManager.ts';
import type { BackupFileInput, BackupManifest } from './saqlainBackupManifest.ts';

export type BackupTaskExecutionResult =
  | {
      status: 'VERIFIED';
      task: QueueTask;
      report: QueueReport;
      snapshot: Awaited<ReturnType<typeof createVerifiedLocalSnapshot>>;
      handoffReady: true;
    }
  | {
      status: 'HOLD';
      task: QueueTask;
      reason: string;
      handoffReady: false;
    };

/**
 * Connects the queue completion boundary to actual local snapshot verification.
 * A task can be completed and handed to reviewers only after every stored file
 * and the persisted manifest have passed integrity checks.
 *
 * The caller must supply a queue task already locked to agentId and bytes read
 * by an authorized source adapter. This function does not authenticate the
 * caller, provide durable DB transactions, or schedule recurring backups.
 */
export async function executeVerifiedBackupTask(input: {
  task: QueueTask;
  agentId: string;
  storageRoot: string;
  source: BackupManifest['source'];
  files: readonly BackupFileInput[];
  now?: Date;
  snapshotId?: string;
}): Promise<BackupTaskExecutionResult> {
  const { task, agentId } = input;
  if (task.status !== 'LOCKED' || task.agentId !== agentId) {
    throw new Error('Backup execution requires a task locked to the supplied agent ID.');
  }
  if (!input.files.length) throw new Error('Backup execution requires at least one file.');

  try {
    const snapshot = await createVerifiedLocalSnapshot({
      storageRoot: input.storageRoot,
      source: input.source,
      files: input.files,
      snapshotId: input.snapshotId,
      now: input.now,
    });
    if (snapshot.status !== 'VERIFIED' || snapshot.verifiedFiles !== input.files.length) {
      return {
        status: 'HOLD',
        task: { ...task, status: 'FAILED' },
        reason: 'Snapshot file count or verification status did not match the requested backup.',
        handoffReady: false,
      };
    }

    const completedTask = completeQueueTask(task, agentId, input.now);
    const report: QueueReport = Object.freeze({
      managerTaskId: completedTask.managerTaskId,
      backupTaskId: completedTask.backupTaskId,
      agentId,
      createdAt: (input.now ?? new Date()).toISOString(),
      payload: Object.freeze({
        snapshotId: snapshot.snapshotId,
        manifestPath: snapshot.manifestPath,
        manifestSha256: snapshot.manifest.manifestSha256,
        verifiedFiles: snapshot.verifiedFiles,
        status: snapshot.status,
      }),
      securityStatus: 'PENDING',
    });
    if (!verifyQueueReport(completedTask, report)) {
      return {
        status: 'HOLD',
        task: { ...task, status: 'FAILED' },
        reason: 'Queue report did not match the completed task; reviewer handoff is blocked.',
        handoffReady: false,
      };
    }
    return { status: 'VERIFIED', task: completedTask, report, snapshot, handoffReady: true };
  } catch (error) {
    return {
      status: 'HOLD',
      task: { ...task, status: 'FAILED' },
      reason: error instanceof Error ? error.message : 'Unknown backup failure.',
      handoffReady: false,
    };
  }
}
