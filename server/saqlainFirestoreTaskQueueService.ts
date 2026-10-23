import type { QueueTask, QueueTaskCounts, QueueTaskStatus } from './saqlainTaskQueueManager.ts';
import { createQueueTask, lockQueueTask, completeQueueTask, markTaskTimeout } from './saqlainTaskQueueManager.ts';
import { SaqlainFirestoreRestClient, encodeFirestoreValue, type FirestoreWrite } from './saqlainFirestoreRest.ts';
import { appendSaqlainAuditEvent } from './saqlainAuditBackend.ts';

const COUNTER_ID = 'queue-sequence';
const STATUSES = new Set<QueueTaskStatus>(['PENDING', 'LOCKED', 'COMPLETED', 'FAILED', 'TIMEOUT_REVIEW']);
type Doc = Record<string, unknown>;

function validTask(value: unknown): value is QueueTask {
  if (!value || typeof value !== 'object') return false;
  const t = value as Record<string, unknown>;
  return typeof t.managerTaskId === 'string' && /^\d{5,}$/.test(t.managerTaskId) &&
    typeof t.backupTaskId === 'string' && !!t.backupTaskId &&
    (typeof t.agentId === 'string' || t.agentId === null) && typeof t.status === 'string' &&
    STATUSES.has(t.status as QueueTaskStatus) && typeof t.createdAt === 'string' &&
    Number.isFinite(Date.parse(t.createdAt)) && (typeof t.lockedAt === 'string' || t.lockedAt === null) &&
    (typeof t.completedAt === 'string' || t.completedAt === null) && t.workCycleMinutes === 20;
}
function enc(record: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, encodeFirestoreValue(value)]));
}
function taskFrom(doc: Doc): QueueTask {
  const task = { ...doc } as unknown as QueueTask;
  if (!validTask(task)) throw new Error('Firestore task failed schema validation.');
  return task;
}
function validateTransition(current: QueueTask, next: QueueTask): void {
  if (!validTask(next)) throw new Error('Invalid queue task.');
  if (current.managerTaskId !== next.managerTaskId || current.backupTaskId !== next.backupTaskId ||
      current.createdAt !== next.createdAt || current.workCycleMinutes !== next.workCycleMinutes) {
    throw new Error('Queue task identity fields cannot change.');
  }
  const allowed: Record<QueueTaskStatus, readonly QueueTaskStatus[]> = {
    PENDING: ['LOCKED', 'FAILED'],
    LOCKED: ['COMPLETED', 'FAILED', 'TIMEOUT_REVIEW'],
    COMPLETED: [],
    FAILED: [],
    TIMEOUT_REVIEW: ['PENDING', 'FAILED'],
  };
  const safeRequeue = current.status === 'TIMEOUT_REVIEW' && next.status === 'PENDING' &&
    current.agentId !== null && next.agentId === null && next.lockedAt === null && next.completedAt === null;
  if (current.agentId !== next.agentId && !(current.status === 'PENDING' && next.status === 'LOCKED') && !safeRequeue) {
    throw new Error('Queue task agent assignment cannot change.');
  }
  if (current.status !== next.status && !allowed[current.status].includes(next.status)) {
    throw new Error('Queue task invalid status transition.');
  }
}

/**
 * Async Firestore queue operations. All task state writes use update-time/create
 * preconditions; task ID allocation updates the counter and creates the task in
 * one atomic commit. The interface is intentionally async (not a fake sync registry).
 */
export class SaqlainFirestoreTaskQueueService {
  private readonly client: SaqlainFirestoreRestClient;
  private readonly collection: string;
  private readonly auditPath?: string;
  private readonly retries: number;
  private readonly auditWriter: (filePath: string | undefined, event: import('./saqlainAuditLog.ts').AuditEventInput) => Promise<unknown>;

  constructor(options: { client?: SaqlainFirestoreRestClient; collection?: string; auditFilePath?: string; retries?: number; auditWriter?: (filePath: string | undefined, event: import('./saqlainAuditLog.ts').AuditEventInput) => Promise<unknown> } = {}) {
    this.client = options.client ?? new SaqlainFirestoreRestClient();
    this.collection = options.collection ?? process.env.SAQLAIN_FIRESTORE_QUEUE_COLLECTION?.trim() ?? 'saqlainTasks';
    this.auditPath = options.auditFilePath;
    this.retries = options.retries ?? 5;
    this.auditWriter = options.auditWriter ?? appendSaqlainAuditEvent;
    if (!/^[A-Za-z][A-Za-z0-9_-]{0,62}$/.test(this.collection)) throw new Error('Firestore task collection name is invalid.');
    if (!Number.isInteger(this.retries) || this.retries < 1 || this.retries > 20) throw new Error('Firestore retry count is invalid.');
  }

  private async audit(eventType: string, actorId: string, outcome: 'ALLOW'|'DENY'|'HOLD', task?: QueueTask, details: Record<string, unknown> = {}) {
    await this.auditWriter(this.auditPath, {
      eventType, actorId, outcome, resource: 'saqlain-task-queue',
      ...(task ? { taskId: task.managerTaskId } : {}),
      details: task ? { status: task.status, backupTaskId: task.backupTaskId, ...details } : details,
    });
  }

  async list(): Promise<QueueTask[]> {
    const docs = await this.client.listDocuments(this.collection);
    return docs.filter(doc => typeof doc.managerTaskId === 'string')
      .map(taskFrom).sort((a,b) => Number(a.managerTaskId) - Number(b.managerTaskId));
  }

  async getCounts(): Promise<QueueTaskCounts> {
    const tasks = await this.list();
    return {
      pendingTasks: tasks.filter(t=>t.status==='PENDING').length,
      lockedTasks: tasks.filter(t=>t.status==='LOCKED').length,
      completedTasks: tasks.filter(t=>t.status==='COMPLETED').length,
      failedTasks: tasks.filter(t=>t.status==='FAILED').length,
      timeoutReviewTasks: tasks.filter(t=>t.status==='TIMEOUT_REVIEW').length,
      totalTasks: tasks.length,
    };
  }

  async enqueue(backupTaskId: string, actorId = 'saqlain-queue', now = new Date()): Promise<QueueTask> {
    if (!backupTaskId?.trim()) throw new Error('backupTaskId is required.');
    for (let attempt=0; attempt<this.retries; attempt++) {
      const counter = await this.client.getDocument(this.collection, COUNTER_ID);
      const previous = counter ? Number(counter.sequence) : 0;
      if (!Number.isSafeInteger(previous) || previous < 0) throw new Error('Firestore queue sequence counter is invalid.');
      const task = createQueueTask(previous + 1, backupTaskId, now);
      await this.audit('QUEUE_TASK_ENQUEUE_INTENT', actorId, 'ALLOW', task);
      const writes: FirestoreWrite[] = [
        { update: { name: this.client.documentName(this.collection, task.managerTaskId), fields: enc(task as unknown as Record<string, unknown>) }, currentDocument: { exists: false } },
        { update: { name: this.client.documentName(this.collection, COUNTER_ID), fields: enc({ sequence: previous + 1 }) },
          currentDocument: counter?._updateTime ? { updateTime: String(counter._updateTime) } : { exists: false } },
      ];
      try { await this.client.commit(writes); return task; }
      catch (error) {
        if (!(error instanceof Error) || !/HTTP (400|409|412)\b/.test(error.message) || attempt+1>=this.retries) throw error;
      }
    }
    throw new Error('Firestore queue enqueue retries exhausted.');
  }

  private async updateTask(id: string, transform: (task: QueueTask) => QueueTask, eventType: string, actorId: string): Promise<QueueTask> {
    for (let attempt=0; attempt<this.retries; attempt++) {
      const doc = await this.client.getDocument(this.collection, id);
      if (!doc) throw new Error('Queue task does not exist.');
      const current = taskFrom(doc);
      const next = transform(current);
      validateTransition(current, next);
      await this.audit(eventType, actorId, 'ALLOW', current, { nextStatus: next.status });
      const write: FirestoreWrite = {
        update: { name: this.client.documentName(this.collection, id), fields: enc(next as unknown as Record<string, unknown>) },
        currentDocument: doc._updateTime ? { updateTime: String(doc._updateTime) } : undefined,
      };
      try { await this.client.commit([write]); return next; }
      catch (error) {
        if (!(error instanceof Error) || !/HTTP (400|409|412)\b/.test(error.message) || attempt+1>=this.retries) throw error;
      }
    }
    throw new Error('Firestore queue update retries exhausted.');
  }

  async lockNextPending(agentId: string, actorId = 'saqlain-queue', now = new Date()): Promise<QueueTask | null> {
    if (!agentId?.trim()) throw new Error('agentId is required.');
    for (const candidate of await this.list()) {
      if (candidate.status !== 'PENDING') continue;
      try { return await this.updateTask(candidate.managerTaskId, task => lockQueueTask(task, agentId, now), 'QUEUE_TASK_LOCK', actorId); }
      catch (error) {
        if (error instanceof Error && /HTTP (400|409|412)\b/.test(error.message)) continue;
        if (error instanceof Error && /Only pending tasks/.test(error.message)) continue;
        throw error;
      }
    }
    return null;
  }

  async complete(id: string, agentId: string, actorId = 'saqlain-queue', now = new Date()): Promise<QueueTask> {
    return this.updateTask(id, task => completeQueueTask(task, agentId, now), 'QUEUE_TASK_COMPLETE', actorId);
  }

  async markTimeoutReview(id: string, actorId = 'saqlain-queue'): Promise<QueueTask> {
    return this.updateTask(id, markTaskTimeout, 'QUEUE_TASK_TIMEOUT_REVIEW', actorId);
  }

  async recoverInterruptedTasks(actorId = 'saqlain-queue'): Promise<QueueTask[]> {
    const recovered: QueueTask[] = [];
    for (const task of await this.list()) if (task.status === 'LOCKED') recovered.push(await this.markTimeoutReview(task.managerTaskId, actorId));
    return recovered;
  }

  async resolveTimeoutReview(id: string, decision: 'REQUEUE'|'FAIL', input: { operatorId: string; reason: string; retrySafe: boolean }, now = new Date()): Promise<QueueTask> {
    const task = (await this.list()).find(t=>t.managerTaskId===id);
    if (!task) throw new Error('Queue task does not exist.');
    if (task.status !== 'TIMEOUT_REVIEW') throw new Error('Only timeout-review tasks can be resolved.');
    if (!input.operatorId?.trim() || !input.reason?.trim()) throw new Error('Operator identity and reason are required.');
    if (decision==='REQUEUE' && !input.retrySafe) {
      await this.audit('QUEUE_TIMEOUT_REQUEUE_DENIED', input.operatorId, 'DENY', task, { reason: input.reason, retrySafe: false });
      throw new Error('Requeue requires explicit confirmation that retrying is safe and idempotent.');
    }
    return this.updateTask(id, current => {
      if (current.status!=='TIMEOUT_REVIEW') throw new Error('Only timeout-review tasks can be resolved.');
      return decision==='REQUEUE'
        ? { ...current, agentId:null, status:'PENDING', lockedAt:null, completedAt:null }
        : { ...current, status:'FAILED', completedAt:now.toISOString() };
    }, 'QUEUE_TIMEOUT_REVIEW_RESOLVED', input.operatorId);
  }
}
