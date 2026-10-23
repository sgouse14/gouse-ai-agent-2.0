import { createApprovedContinuousBackupRuntime } from './saqlainApprovedContinuousBackup.ts';
import { createSaqlainMonitoringRuntime } from './saqlainMonitoringRuntime.ts';
import { collectRegisteredHeartbeatSummary } from './saqlainHeartbeatMonitoring.ts';
import { getSaqlainHeartbeatSnapshot } from './saqlainHeartbeatRoutes.ts';
import { createSaqlainTaskQueueService } from './saqlainTaskQueueService.ts';
import { createDurableQueueTaskRegistry } from './saqlainDurableQueueStore.ts';

const required = (key: string): string => {
  const value = process.env[key]?.trim();
  if (!value) throw new Error('Missing required backup configuration: ' + key);
  return value;
};

const durableTaskQueue = createDurableQueueTaskRegistry(required('SAQLAIN_TASK_QUEUE_FILE'));
const taskQueueService = createSaqlainTaskQueueService(durableTaskQueue);
// A task locked before a restart has an ambiguous outcome. Hold it for review;
// never automatically mark it completed or re-run potentially non-idempotent work.
const recoveredTasks = taskQueueService.recoverInterruptedTasks();
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
});

const monitoringRuntime = createSaqlainMonitoringRuntime({
  auditFilePath: required('SAQLAIN_BACKUP_AUDIT_FILE'),
  collectSnapshot: async () => {
    const report = runtime.getState().lastReport;
    if (!report) throw new Error('No completed backup/recovery cycle is available yet.');
    const results = report.results;
    const heartbeatSummary = collectRegisteredHeartbeatSummary(
      process.env.SAQLAIN_HEARTBEAT_CREDENTIALS_JSON,
      await getSaqlainHeartbeatSnapshot(),
    );
    const queueCounts = taskQueueService.getCounts();
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
    };
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
