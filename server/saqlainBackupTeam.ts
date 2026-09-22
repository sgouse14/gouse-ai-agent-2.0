/** Saqlain Backup & Recovery Team: five non-destructive backup agents. */
export interface SaqlainBackupAgent {
  id: string;
  name: string;
  mission: string;
  intervalMinutes: 30;
  canDeleteSourceFiles: false;
  canOverwriteSourceFiles: false;
}

export const SAQLAIN_BACKUP_TEAM: readonly SaqlainBackupAgent[] = Object.freeze([
  { id: 'saq-backup-gouse', name: 'Gouse AI Backup Agent', mission: 'Create versioned Gouse AI snapshots.', intervalMinutes: 30, canDeleteSourceFiles: false, canOverwriteSourceFiles: false },
  { id: 'saq-backup-saqlain', name: 'Saqlain AI Backup Agent', mission: 'Create versioned Saqlain AI snapshots.', intervalMinutes: 30, canDeleteSourceFiles: false, canOverwriteSourceFiles: false },
  { id: 'saq-backup-files', name: 'Protected Files Backup Agent', mission: 'Copy protected project files to authorized backup storage.', intervalMinutes: 30, canDeleteSourceFiles: false, canOverwriteSourceFiles: false },
  { id: 'saq-backup-verify', name: 'Backup Verification Agent', mission: 'Verify backup integrity and readability.', intervalMinutes: 30, canDeleteSourceFiles: false, canOverwriteSourceFiles: false },
  { id: 'saq-backup-recovery', name: 'Backup Recovery Agent', mission: 'Coordinate safe recovery from verified snapshots.', intervalMinutes: 30, canDeleteSourceFiles: false, canOverwriteSourceFiles: false },
]);

export const SAQLAIN_BACKUP_INTERVAL_MINUTES = 30;
export const SAQLAIN_BACKUP_POLICY = Object.freeze({
  originalsRemainUntouched: true,
  deleteOriginals: false,
  overwriteOriginals: false,
  overwriteVerifiedBackups: false,
  externalAccess: false,
});
