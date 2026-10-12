import { createApprovedContinuousBackupRuntime } from './saqlainApprovedContinuousBackup.ts';

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

runtime.start({ runImmediately: true });
process.on('SIGINT', () => {
  runtime.stop();
  process.exitCode = 0;
});
process.on('SIGTERM', () => {
  runtime.stop();
  process.exitCode = 0;
});
process.on('uncaughtException', (error) => {
  console.error('Saqlain backup service uncaught exception:', error);
  runtime.stop();
  process.exitCode = 1;
});
process.on('unhandledRejection', (reason) => {
  console.error('Saqlain backup service unhandled rejection:', reason);
  runtime.stop();
  process.exitCode = 1;
});
