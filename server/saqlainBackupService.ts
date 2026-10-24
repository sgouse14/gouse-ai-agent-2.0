import { createApprovedContinuousBackupRuntime } from './saqlainApprovedContinuousBackup.ts';
import { createSaqlainMonitoringRuntime } from './saqlainMonitoringRuntime.ts';
import { collectRegisteredHeartbeatSummary } from './saqlainHeartbeatMonitoring.ts';
import { getSaqlainHeartbeatSnapshot } from './saqlainHeartbeatRoutes.ts';
import { createSaqlainTaskQueueService } from './saqlainTaskQueueService.ts';
import { createDurableQueueTaskRegistry } from './saqlainDurableQueueStore.ts';
import { getSaqlainAuditBackendMode } from './saqlainAuditBackend.ts';
import { SaqlainFirestoreTaskQueueService } from './saqlainFirestoreTaskQueueService.ts';
import { SaqlainGoogleCloudStorageArchive } from './saqlainGoogleCloudStorageArchive.ts';

const required = (key: string): string => {
  const value = process.env[key]?.trim();
  if (!value) throw new Error('Missing required backup configuration: ' + key);
  return value;
};

const cloudRunRuntime = Boolean(process.env.K_SERVICE?.trim() || process.env.K_REVISION?.trim() || process.env.CLOUD_RUN_JOB?.trim() || process.env.CLOUD_RUN_EXECUTION?.trim());
const offsiteRequiredValue = process.env.SAQLAIN_BACKUP_OFFSITE_REQUIRED?.trim().toLowerCase();
if (offsiteRequiredValue && offsiteRequiredValue !== 'true' && offsiteRequiredValue !== 'false') {
  throw new Error('SAQLAIN_BACKUP_OFFSITE_REQUIRED must be true or false.');
}
const offsiteArchiveRequired = cloudRunRuntime || offsiteRequiredValue === 'true';
const gcsBucket = process.env.SAQLAIN_BACKUP_GCS_BUCKET?.trim();
if (offsiteArchiveRequired && !gcsBucket) {
  throw new Error('SAQLAIN_BACKUP_GCS_BUCKET is required when off-site archival is required or running on Cloud Run.');
}
const gcsArchive = gcsBucket
  ? new SaqlainGoogleCloudStorageArchive({
      bucket: gcsBucket,
      prefix: process.env.SAQLAIN_BACKUP_GCS_PREFIX?.trim() || 'saqlain-backups',
    })
  : undefined;

const auditBackendMode = getSaqlainAuditBackendMode();
const taskQueueService = auditBackendMode === 'firestore'
  ? new SaqlainFirestoreTaskQueueService()
  : createSaqlainTaskQueueService(createDurableQueueTaskRegistry(required('SAQLAIN_TASK_QUEUE_FILE')));
// A task locked before a restart has an ambiguous outcome. Hold it for review;
// never automatically mark it completed or re-run potentially non-idempotent work.
// Await works for both the async Firestore adapter and the synchronous local adapter.
const recoveredTasks = await taskQueueService.recoverInterruptedTasks();
if (recoveredTasks.length > 0) {
  console.warn('Saqlain queue recovery moved interrupted tasks to TIMEOUT_REVIEW:', recoveredTasks.map((task) => task.managerTaskId));
}

const runtime = createApprovedContinuousBackupRuntime({
  storageRoot: required('SAQLAIN_BACKUP_STORAGE_ROOT'),
  recoveryStagingRoot: required('SAQLAIN_RECOVERY_STAGING_ROOT'),
  auditFilePath: required('SAQLAIN_BACKUP_AUDIT_FILE'),
  approvedRoots: {
    'gouse-ai': required('SAQLAIN_SOURCE_GOUSE_ROOT'),
    'saqlain-ai': required('SAQLAIN_SOURCE_SAQLAIN_ROOT'),
    'protected-files': required('SAQLAIN_SOURCE_PROTECTED_ROOT'),
  },
  sourceByAgentId: {
    'saq-backup-gouse': 'gouse-ai',
    'saq-backup-saqlain': 'saqlain-ai',
    'saq-backup-files': 'protected-files',
  },
  remoteArchive: gcsArchive ? (snapshot) => gcsArchive.archiveSnapshot(snapshot) : undefined,
});

const monitoringRuntime = createSaqlainMonitoringRuntime({
  auditFilePath: required('SAQLAIN_BACKUP_AUDIT_FILE'),
  collectSnapshot: async () => {
    const runtimeState = runtime.getState();
    const report = runtimeState.lastReport;
    const currentTime = Date.now();
    const results = report?.results ?? [];
    const lastCycleTime = report ? Date.parse(report.finishedAt) : Number.NaN;
    const currentCycleStartTime = runtimeState.cycleStartedAt ? Date.parse(runtimeState.cycleStartedAt) : Number.NaN;
    if (runtimeState.cycleInProgress && !Number.isFinite(currentCycleStartTime)) {
      throw new Error('Backup runtime reports an active cycle without a valid start timestamp.');
    }
    if (report && !Number.isFinite(lastCycleTime)) {
      throw new Error('Last backup cycle has an invalid finish timestamp.');
    }
    const heartbeatSummary = collectRegisteredHeartbeatSummary(
      process.env.SAQLAIN_HEARTBEAT_CREDENTIALS_JSON,
      await getSaqlainHeartbeatSnapshot(),
    );
    const queueCounts = await taskQueueService.getCounts();
    return {
      // Counts only authenticated, recent heartbeats from configured heartbeat credentials.
      activeAgents: heartbeatSummary.activeAgents,
      // Counts come from durable queue storage; interrupted locks are held for review on startup.
      lockedTasks: queueCounts.lockedTasks,
      completedTasks: results.filter((item) => item.status === 'VERIFIED').length + queueCounts.completedTasks,
      failedTasks: results.filter((item) => item.status === 'FAILED').length + queueCounts.failedTasks,
      // Ambiguous interrupted tasks are security holds until an operator resolves them.
      securityHolds: results.filter((item) => item.status === 'HOLD').length + queueCounts.timeoutReviewTasks,
      backupChecks: results.filter((item) => item.role === 'BACKUP').length,
      recoveryChecks: results.filter((item) => item.role === 'RECOVERY').length,
      // Freshness metadata prevents old successful counts from masking a missed or stuck cycle.
      backupCycleAgeMinutes: report ? Math.max(0, (currentTime - lastCycleTime) / 60_000) : null,
      backupCycleInProgress: runtimeState.cycleInProgress,
      backupCycleInProgressMinutes: runtimeState.cycleInProgress
        ? Math.max(0, (currentTime - currentCycleStartTime) / 60_000)
        : null,
      backupCycleStatus: report?.status ?? null,
    };
  },
  // The systemd unit captures stderr in the journal. This is a local alert sink,
  // not an external pager; production must add an independently managed adapter.
  notifyAlert: async (notification) => {
    console.error('[Saqlain monitoring alert]', JSON.stringify(notification));
  },
});

runtime.start({ runImmediately: true });
monitoringRuntime.start({ runImmediately: true });
process.on('SIGINT', () => {
  runtime.stop();
  monitoringRuntime.stop();
  process.exitCode = 0;
});
process.on('SIGTERM', () => {
  runtime.stop();
  monitoringRuntime.stop();
  process.exitCode = 0;
});
process.on('uncaughtException', (error) => {
  console.error('Saqlain backup service uncaught exception:', error);
  runtime.stop();
  monitoringRuntime.stop();
  process.exitCode = 1;
});
process.on('unhandledRejection', (reason) => {
  console.error('Saqlain backup service unhandled rejection:', reason);
  runtime.stop();
  monitoringRuntime.stop();
  process.exitCode = 1;
});
