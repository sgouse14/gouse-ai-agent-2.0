/** Saqlain Task Queue Manager: parallel tasks, locks, recovery, and verified handoff. */
export type QueueTaskStatus = 'PENDING' | 'LOCKED' | 'COMPLETED' | 'FAILED' | 'TIMEOUT_REVIEW';
export type SecurityReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVIEW_REQUIRED';

export interface QueueTask {
  managerTaskId: string;
  backupTaskId: string;
  agentId: string | null;
  status: QueueTaskStatus;
  createdAt: string;
  lockedAt: string | null;
  completedAt: string | null;
  workCycleMinutes: 20;
}

export interface QueueReport {
  managerTaskId: string;
  backupTaskId: string;
  agentId: string;
  createdAt: string;
  payload: Readonly<Record<string, unknown>>;
  securityStatus: SecurityReviewStatus;
}

export interface RecoveryShard {
  shardId: string;
  agentId: string;
  sourcePath: string;
  protectedOriginal: true;
  canDeleteOriginal: false;
  canRepairCopy: true;
}

export const MANAGER_ID_START = 1010;
export const MANAGER_ID_STEP = 2;
export const AGENT_WORK_CYCLE_MINUTES = 20;
export const FILE_RECOVERY_CYCLE_MINUTES = 45;
export const DEFAULT_RECOVERY_AGENT_COUNT = 5;

export function formatManagerTaskId(sequence: number): string {
  if (!Number.isInteger(sequence) || sequence < 1) throw new Error('sequence must be a positive integer');
  return String(MANAGER_ID_START + (sequence - 1) * MANAGER_ID_STEP).padStart(5, '0');
}

export function createQueueTask(sequence: number, backupTaskId: string, now = new Date()): QueueTask {
  if (!backupTaskId) throw new Error('backupTaskId is required');
  return { managerTaskId: formatManagerTaskId(sequence), backupTaskId, agentId: null, status: 'PENDING', createdAt: now.toISOString(), lockedAt: null, completedAt: null, workCycleMinutes: AGENT_WORK_CYCLE_MINUTES };
}

/** Different tasks may be locked by different agents concurrently. */
export function lockQueueTask(task: QueueTask, agentId: string, now = new Date()): QueueTask {
  if (!agentId) throw new Error('agentId is required');
  if (task.status !== 'PENDING') throw new Error('Only pending tasks can be locked.');
  return { ...task, agentId, status: 'LOCKED', lockedAt: now.toISOString() };
}

export function completeQueueTask(task: QueueTask, agentId: string, now = new Date()): QueueTask {
  if (task.status !== 'LOCKED' || task.agentId !== agentId) throw new Error('Only the current task owner can complete this task.');
  return { ...task, status: 'COMPLETED', completedAt: now.toISOString() };
}

/** Never reassign automatically at 20 minutes; mark for review first to avoid concurrent writes. */
export function markTaskTimeout(task: QueueTask): QueueTask {
  if (task.status !== 'LOCKED') throw new Error('Only locked tasks can enter timeout review.');
  return { ...task, status: 'TIMEOUT_REVIEW' };
}

export function verifyQueueReport(task: QueueTask, report: Pick<QueueReport, 'managerTaskId' | 'backupTaskId' | 'agentId'>): boolean {
  return task.status === 'COMPLETED' && task.managerTaskId === report.managerTaskId && task.backupTaskId === report.backupTaskId && task.agentId === report.agentId;
}

/** Original files are protected; recovery agents repair/version copies only. */
export function createRecoveryShards(filePaths: string[], agentIds: string[]): RecoveryShard[] {
  if (agentIds.length === 0) throw new Error('At least one approved recovery agent is required.');
  return filePaths.map((sourcePath, index) => ({
    shardId: `recovery-${index + 1}`,
    agentId: agentIds[index % agentIds.length],
    sourcePath,
    protectedOriginal: true,
    canDeleteOriginal: false,
    canRepairCopy: true,
  }));
}

/** Workload scaling is controlled: only approved agents may be added. */
export function scaleRecoveryAgents(currentCount: number, backlog: number, maxAdditional = 0): number {
  if (currentCount < 1 || backlog < 0 || maxAdditional < 0) throw new Error('Invalid scaling parameters.');
  if (backlog === 0) return currentCount;
  return currentCount + Math.min(maxAdditional, Math.ceil(backlog / currentCount));
}

/** Pass one immutable report reference; no duplicate handoff copy is created. */
export function routeVerifiedReport(report: QueueReport) {
  return Object.freeze({ report, queueManager: 'verified', saqlain: 'security-review', gouseAi: 'final-review-after-saqlain', duplicateReportCreated: false });
}
