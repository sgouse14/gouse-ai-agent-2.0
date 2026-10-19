import { createApprovedContinuousBackupRuntime } from './saqlainApprovedContinuousBackup.ts';
import { createSaqlainMonitoringRuntime } from './saqlainMonitoringRuntime.ts';
import { collectRegisteredHeartbeatSummary } from './saqlainHeartbeatMonitoring.ts';
import { getSaqlainHeartbeatSnapshot } from './saqlainHeartbeatRoutes.ts';
import { createSaqlainTaskQueueService } from './saqlainTaskQueueService.ts';
import { saqlainTaskQueue } from './saqlainTaskQueueManager.ts';

const taskQueueService = createSaqlainTaskQueueService(saqlainTaskQueue);

const required = (key: string): string => {
  const value = process.env[key]?.trim();
  if (!value) throw new Error('Missing required backup configuration: ' + key);
  return value;
};

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
      getSaqlainHeartbeatSnapshot(),
    );
    return {
      // Counts only authenticated, recent heartbeats from configured heartbeat credentials.
      activeAgents: heartbeatSummary.activeAgents,
      // Live counts from the shared process-local queue; restart durability is not yet implemented.
      lockedTasks: taskQueueService.getCounts().lockedTasks,
      completedTasks: results.filter((item) => item.status === 'VERIFIED').length,
      failedTasks: results.filter((item) => item.status === 'FAILED').length,
      securityHolds: results.filter((item) => item.status === 'HOLD').length,
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
