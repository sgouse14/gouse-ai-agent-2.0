/** Saqlain operations team: four backup agents, one recovery agent, and one communication agent. */
export type BackupTaskStatus = 'UNASSIGNED' | 'LOCKED' | 'COMPLETED' | 'FAILED';
export type ReportHandoffStatus = 'QUEUED' | 'SAQLAIN_REVIEW' | 'GOUSE_REVIEW' | 'ACCEPTED' | 'REJECTED';
export type SaqlainBackupAgentRole = 'BACKUP' | 'RECOVERY' | 'COMMUNICATION';

export interface SaqlainBackupAgent {
  id: string;
  name: string;
  role: SaqlainBackupAgentRole;
  mission: string;
  intervalMinutes: 30;
  canDeleteSourceFiles: false;
  canOverwriteSourceFiles: false;
}

export interface BackupTaskLock {
  taskId: string;
  agentId: string | null;
  status: BackupTaskStatus;
  lockedAt: string | null;
  leaseUntil: string | null;
  attempt: number;
}

export interface BackupReport {
  taskId: string;
  agentId: string;
  status: 'COMPLETED' | 'FAILED';
  createdAt: string;
  filesCopied: number;
  source: 'gouse-ai' | 'saqlain-ai' | 'protected-files';
  checksum?: string;
  notes?: string;
}

export const SAQLAIN_BACKUP_TEAM: readonly SaqlainBackupAgent[] = Object.freeze([
  { id: 'saq-backup-gouse', name: 'Gouse AI Backup Agent', role: 'BACKUP', mission: 'Create versioned Gouse AI snapshots.', intervalMinutes: 30, canDeleteSourceFiles: false, canOverwriteSourceFiles: false },
  { id: 'saq-backup-saqlain', name: 'Saqlain AI Backup Agent', role: 'BACKUP', mission: 'Create versioned Saqlain AI snapshots.', intervalMinutes: 30, canDeleteSourceFiles: false, canOverwriteSourceFiles: false },
  { id: 'saq-backup-files', name: 'Protected Files Backup Agent', role: 'BACKUP', mission: 'Copy protected project files to authorized backup storage.', intervalMinutes: 30, canDeleteSourceFiles: false, canOverwriteSourceFiles: false },
  { id: 'saq-backup-verify', name: 'Backup Verification Agent', role: 'BACKUP', mission: 'Verify backup integrity and readability.', intervalMinutes: 30, canDeleteSourceFiles: false, canOverwriteSourceFiles: false },
  { id: 'saq-recovery-primary', name: 'Saqlain Recovery Agent', role: 'RECOVERY', mission: 'Coordinate safe recovery from verified snapshots without modifying protected originals.', intervalMinutes: 30, canDeleteSourceFiles: false, canOverwriteSourceFiles: false },
  { id: 'saq-communication-agent', name: 'Saqlain Communication Agent', role: 'COMMUNICATION', mission: 'Prepare sanitized internal cycle-status reports for the queue manager, Saqlain security review, and Gouse AI final review; do not send external messages.', intervalMinutes: 30, canDeleteSourceFiles: false, canOverwriteSourceFiles: false },
]);

export const SAQLAIN_BACKUP_INTERVAL_MINUTES = 30;
export const SAQLAIN_MANAGER_ID_START = 1010;
export const SAQLAIN_MANAGER_ID_STEP = 2;
export const SAQLAIN_TASK_ID_START = 1;
export const SAQLAIN_TASK_ID_STEP = 2;
export const SAQLAIN_BACKUP_POLICY = Object.freeze({
  originalsRemainUntouched: true,
  deleteOriginals: false,
  overwriteOriginals: false,
  overwriteVerifiedBackups: false,
  externalAccess: false,
  exclusiveTaskLock: true,
  reportFlow: ['queue-manager', 'saqlain-ai', 'gouse-ai'] as const,
  duplicateReportForHandoff: false,
});

export function formatBackupManagerTaskId(sequence: number): string {
  if (!Number.isInteger(sequence) || sequence < 1) throw new Error('sequence must be a positive integer');
  return (SAQLAIN_MANAGER_ID_START + (sequence - 1) * SAQLAIN_MANAGER_ID_STEP).toString().padStart(5, '0');
}

export function formatBackupTaskId(sequence: number): string {
  if (!Number.isInteger(sequence) || sequence < 1) throw new Error('sequence must be a positive integer');
  return (SAQLAIN_TASK_ID_START + (sequence - 1) * SAQLAIN_TASK_ID_STEP).toString().padStart(4, '0');
}

export function createBackupTask(sequence: number): BackupTaskLock {
  return { taskId: formatBackupTaskId(sequence), agentId: null, status: 'UNASSIGNED', lockedAt: null, leaseUntil: null, attempt: 0 };
}

export function claimBackupTask(task: BackupTaskLock, agentId: string, now = new Date(), leaseMinutes = 10): BackupTaskLock {
  if (!agentId) throw new Error('agentId is required');
  if (!Number.isFinite(leaseMinutes) || leaseMinutes <= 0) throw new Error('leaseMinutes must be positive');
  const expired = task.status === 'LOCKED' && task.leaseUntil !== null && new Date(task.leaseUntil).getTime() <= now.getTime();
  if (task.status === 'COMPLETED') throw new Error('Completed task IDs cannot be reused.');
  if (task.status === 'LOCKED' && !expired) throw new Error('Task is already locked by another agent.');
  return { ...task, agentId, status: 'LOCKED', lockedAt: now.toISOString(), leaseUntil: new Date(now.getTime() + leaseMinutes * 60000).toISOString(), attempt: task.attempt + 1 };
}

export function completeBackupTask(task: BackupTaskLock, agentId: string): BackupTaskLock {
  if (task.status !== 'LOCKED' || task.agentId !== agentId) throw new Error('Only the current lock owner can complete this task.');
  return { ...task, status: 'COMPLETED', leaseUntil: null };
}

export function releaseExpiredBackupTask(task: BackupTaskLock, now = new Date()): BackupTaskLock {
  if (task.status !== 'LOCKED' || !task.leaseUntil || new Date(task.leaseUntil).getTime() > now.getTime()) return task;
  return { ...task, agentId: null, status: 'UNASSIGNED', lockedAt: null, leaseUntil: null };
}

export function validateBackupReport(report: BackupReport, currentTask: BackupTaskLock): boolean {
  return report.taskId === currentTask.taskId && currentTask.status === 'COMPLETED' && currentTask.agentId === report.agentId && report.filesCopied >= 0;
}

export function buildReportRouting(report: BackupReport) {
  return { report, next: { queueManager: 'received-and-validated', saqlain: 'security-review', gouseAi: 'final-review-after-saqlain' }, sameReportReference: true, duplicateReportForHandoff: false } as const;
}
