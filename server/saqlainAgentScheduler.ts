/** Saqlain Agent Scheduler: controlled 20-minute work cycles. */

export type ScheduledTaskStatus = 'PENDING' | 'LOCKED' | 'COMPLETED' | 'TIMEOUT_REVIEW';

export interface ScheduledTask {
  taskId: string;
  agentId: string | null;
  status: ScheduledTaskStatus;
  cycleMinutes: 20;
  lockedAt: string | null;
  completedAt: string | null;
}

export const AGENT_CYCLE_MINUTES = 20;

/** Assigns a pending task to exactly one agent. */
export function assignTask(task: ScheduledTask, agentId: string, now = new Date()): ScheduledTask {
  if (!agentId) throw new Error('agentId is required');
  if (task.status !== 'PENDING') throw new Error('Task is not available for assignment.');
  return { ...task, agentId, status: 'LOCKED', lockedAt: now.toISOString() };
}

/** Only the agent holding the task lock can complete it. */
export function completeTask(task: ScheduledTask, agentId: string, now = new Date()): ScheduledTask {
  if (task.status !== 'LOCKED' || task.agentId !== agentId) {
    throw new Error('Task ownership verification failed.');
  }
  return { ...task, status: 'COMPLETED', completedAt: now.toISOString() };
}

/** Timeout never causes an automatic reassignment; review is required first. */
export function timeoutTask(task: ScheduledTask): ScheduledTask {
  if (task.status !== 'LOCKED') throw new Error('Only locked tasks can timeout.');
  return { ...task, status: 'TIMEOUT_REVIEW' };
}

/** Returns true when the 20-minute work window has elapsed. */
export function isCycleExpired(task: ScheduledTask, now = new Date()): boolean {
  if (!task.lockedAt || task.status !== 'LOCKED') return false;
  return now.getTime() - new Date(task.lockedAt).getTime() >= AGENT_CYCLE_MINUTES * 60_000;
}
