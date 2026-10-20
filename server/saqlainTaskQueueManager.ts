/** Gouse Cyber Security AI Task Queue Manager: parallel tasks, locks, recovery, and verified handoff. */
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
export const FILE_RECOVERY_CYCLE_MINUTES = 30;
export const DEFAULT_RECOVERY_AGENT_COUNT = 5;

export function formatManagerTaskId(sequence: number): string {
  if (!Number.isInteger(sequence) || sequence < 1) throw new Error('sequence must be a positive integer');
  return String(MANAGER_ID_START + (sequence - 1) * MANAGER_ID_STEP).padStart(5, '0');
}

export function createQueueTask(sequence: number, backupTaskId: string, now = new Date()): QueueTask {
  if (!backupTaskId) throw new Error('backupTaskId is required');
  return { managerTaskId: formatManagerTaskId(sequence), backupTaskId, agentId: null, status: 'PENDING', createdAt: now.toISOString(), lockedAt: null, completedAt: null, workCycleMinutes: AGENT_WORK_CYCLE_MINUTES };
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

export function markTaskTimeout(task: QueueTask): QueueTask {
  if (task.status !== 'LOCKED') throw new Error('Only locked tasks can enter timeout review.');
  return { ...task, status: 'TIMEOUT_REVIEW' };
}

export function verifyQueueReport(task: QueueTask, report: Pick<QueueReport, 'managerTaskId' | 'backupTaskId' | 'agentId'>): boolean {
  return task.status === 'COMPLETED' && task.managerTaskId === report.managerTaskId && task.backupTaskId === report.backupTaskId && task.agentId === report.agentId;
}

export function createRecoveryShards(filePaths: string[], agentIds: string[]): RecoveryShard[] {
  if (agentIds.length === 0) throw new Error('At least one approved recovery agent is required.');
  return filePaths.map((sourcePath, index) => ({ shardId: `recovery-${index + 1}`, agentId: agentIds[index % agentIds.length], sourcePath, protectedOriginal: true, canDeleteOriginal: false, canRepairCopy: true }));
}

export function scaleRecoveryAgents(currentCount: number, backlog: number, maxAdditional = 0): number {
  if (currentCount < 1 || backlog < 0 || maxAdditional < 0) throw new Error('Invalid scaling parameters.');
  if (backlog === 0) return currentCount;
  return currentCount + Math.min(maxAdditional, Math.ceil(backlog / currentCount));
}

/** One immutable report reference is passed to Gouse Cyber Security AI, then Gouse AI. */
export function routeVerifiedReport(report: QueueReport) {
  return Object.freeze({ report, queueManager: 'verified', gouseCyberSecurityAi: 'security-review', gouseAi: 'final-review-after-security', duplicateReportCreated: false });
}

export interface QueueTaskCounts {
  pendingTasks: number;
  lockedTasks: number;
  completedTasks: number;
  failedTasks: number;
  timeoutReviewTasks: number;
  totalTasks: number;
}

export interface QueueTaskRegistry {
  add(task: QueueTask): void;
  update(task: QueueTask): void;
  list(): QueueTask[];
  getCounts(): QueueTaskCounts;
}

/**
 * In-process task registry for live queue accounting.
 * It is intentionally not presented as durable storage; use a transactional
 * database adapter before running multiple service instances or requiring restart recovery.
 */
export function createQueueTaskRegistry(): QueueTaskRegistry {
  const tasks = new Map<string, QueueTask>();
  const allowedTransitions: Record<QueueTaskStatus, readonly QueueTaskStatus[]> = {
    PENDING: ['LOCKED', 'FAILED'],
    LOCKED: ['COMPLETED', 'FAILED', 'TIMEOUT_REVIEW'],
    COMPLETED: [],
    FAILED: [],
    TIMEOUT_REVIEW: ['PENDING', 'FAILED'],
  };
  const copy = (task: QueueTask): QueueTask => ({ ...task });
  return {
    add(task) {
      if (tasks.has(task.managerTaskId)) throw new Error('Queue task managerTaskId already exists.');
      tasks.set(task.managerTaskId, copy(task));
    },
    update(task) {
      const current = tasks.get(task.managerTaskId);
      if (!current) throw new Error('Queue task does not exist.');
      if (current.backupTaskId !== task.backupTaskId || current.createdAt !== task.createdAt) {
        throw new Error('Queue task identity fields cannot change.');
      }
      const safeTimeoutRequeue =
        current.status === 'TIMEOUT_REVIEW' &&
        task.status === 'PENDING' &&
        current.agentId !== null &&
        task.agentId === null &&
        task.lockedAt === null &&
        task.completedAt === null;
      if (
        current.agentId !== task.agentId &&
        !(current.status === 'PENDING' && task.status === 'LOCKED') &&
        !safeTimeoutRequeue
      ) {
        throw new Error('Queue task agent assignment cannot change.');
      }
      if (current.status !== task.status && !allowedTransitions[current.status].includes(task.status)) {
        throw new Error('Queue task invalid status transition.');
      }
      tasks.set(task.managerTaskId, copy(task));
    },
    list() { return [...tasks.values()].map(copy); },
    getCounts() {
      const values = [...tasks.values()];
      return {
        pendingTasks: values.filter((task) => task.status === 'PENDING').length,
        lockedTasks: values.filter((task) => task.status === 'LOCKED').length,
        completedTasks: values.filter((task) => task.status === 'COMPLETED').length,
        failedTasks: values.filter((task) => task.status === 'FAILED').length,
        timeoutReviewTasks: values.filter((task) => task.status === 'TIMEOUT_REVIEW').length,
        totalTasks: values.length,
      };
    },
  };
}

/** Shared process-local queue registry consumed by the monitoring service. */
export const saqlainTaskQueue = createQueueTaskRegistry();
