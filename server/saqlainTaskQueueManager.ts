/** Saqlain Task Queue Manager: one agent per task, verified report handoff. */
export type QueueTaskStatus = 'PENDING' | 'LOCKED' | 'COMPLETED' | 'FAILED';
export type SecurityReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVIEW_REQUIRED';

export interface QueueTask {
  managerTaskId: string;
  backupTaskId: string;
  agentId: string | null;
  status: QueueTaskStatus;
  createdAt: string;
  lockedAt: string | null;
  completedAt: string | null;
}

export interface QueueReport {
  managerTaskId: string;
  backupTaskId: string;
  agentId: string;
  createdAt: string;
  payload: Readonly<Record<string, unknown>>;
  securityStatus: SecurityReviewStatus;
}

export const MANAGER_ID_START = 1010;
export const MANAGER_ID_STEP = 2;

export function formatManagerTaskId(sequence: number): string {
  if (!Number.isInteger(sequence) || sequence < 1) throw new Error('sequence must be a positive integer');
  return String(MANAGER_ID_START + (sequence - 1) * MANAGER_ID_STEP).padStart(5, '0');
}

export function createQueueTask(sequence: number, backupTaskId: string, now = new Date()): QueueTask {
  if (!backupTaskId) throw new Error('backupTaskId is required');
  return { managerTaskId: formatManagerTaskId(sequence), backupTaskId, agentId: null, status: 'PENDING', createdAt: now.toISOString(), lockedAt: null, completedAt: null };
}

export function lockQueueTask(task: QueueTask, agentId: string, now = new Date()): QueueTask {
  if (!agentId) throw new Error('agentId is required');
  if (task.status !== 'PENDING') throw new Error('Only pending tasks can be locked.');
  return { ...task, agentId, status: 'LOCKED', lockedAt: now.toISOString() };
}

export function completeQueueTask(task: QueueTask, agentId: string, now = new Date()): QueueTask {
  if (task.status !== 'LOCKED' || task.agentId !== agentId) throw new Error('Only the current task owner can complete this task.');
  return { ...task, status: 'COMPLETED', completedAt: now.toISOString() };
}

export function verifyQueueReport(task: QueueTask, report: Pick<QueueReport, 'managerTaskId' | 'backupTaskId' | 'agentId'>): boolean {
  return task.status === 'COMPLETED' && task.managerTaskId === report.managerTaskId && task.backupTaskId === report.backupTaskId && task.agentId === report.agentId;
}

/** Pass one immutable report reference; no duplicate handoff copy is created. */
export function routeVerifiedReport(report: QueueReport) {
  return Object.freeze({ report, queueManager: 'verified', saqlain: 'security-review', gouseAi: 'final-review-after-saqlain', duplicateReportCreated: false });
}
