import { createApprovedContinuousBackupRuntime } from './saqlainApprovedContinuousBackup.ts';
import { SAQLAIN_BACKUP_TEAM } from './saqlainBackupTeam.ts';
import { createSaqlainMonitoringRuntime } from './saqlainMonitoringRuntime.ts';
import { summarizeAgentHeartbeats } from './saqlainAgentHeartbeat.ts';
import { getSaqlainHeartbeatSnapshot } from './saqlainHeartbeatRoutes.ts';
import { parseHeartbeatCredentials } from './saqlainHeartbeatIngestion.ts';

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
    const credentialConfig = process.env.SAQLAIN_HEARTBEAT_CREDENTIALS_JSON;
    let registeredHeartbeatAgentIds: string[] = [];
    if (credentialConfig) {
      try {
        const parsed: unknown = JSON.parse(credentialConfig);
        if (Array.isArray(parsed)) registeredHeartbeatAgentIds = parsed
          .filter((item) => !!item && typeof item.agentId === 'string' && typeof item.tokenSha256 === 'string' && /^[a-f0-9]{64}$/i.test(item.tokenSha256))
          .map((item) => (item as { agentId: string }).agentId);
      } catch { /* Invalid configuration fails closed as zero registered heartbeat agents. */ }
    }
    const heartbeatSummary = summarizeAgentHeartbeats(registeredHeartbeatAgentIds, getSaqlainHeartbeatSnapshot());
    return {
      // Counts only authenticated, recent heartbeats from configured heartbeat credentials.
      activeAgents: heartbeatSummary.activeAgents,
      lockedTasks: 0, // Queue manager is not yet connected to this service.
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
  process.exitCode = 1;
});
