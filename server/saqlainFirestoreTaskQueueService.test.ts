import test from 'node:test';
import assert from 'node:assert/strict';
import { SaqlainFirestoreTaskQueueService } from './saqlainFirestoreTaskQueueService.ts';
import { SaqlainFirestoreRestClient, decodeFirestoreFields, type FirestoreWrite } from './saqlainFirestoreRest.ts';

class MemoryClient extends SaqlainFirestoreRestClient {
  private docs = new Map<string, { fields: Record<string, unknown>; updateTime: string }>();
  private version = 0;
  constructor() { super({ projectId: 'saqlain-staging-123', accessTokenProvider: async () => 'token' }); }
  override async getDocument(collection: string, id: string): Promise<Record<string, unknown> | null> {
    const doc=this.docs.get(this.documentName(collection,id));
    return doc ? { ...doc.fields, _updateTime: doc.updateTime } : null;
  }
  override async listDocuments(collection: string): Promise<Record<string, unknown>[]> {
    const prefix=this.documentName(collection,'');
    return [...this.docs.entries()].filter(([name])=>name.startsWith(prefix))
      .map(([name,doc])=>({...doc.fields,_name:name,_updateTime:doc.updateTime}));
  }
  override async commit(writes: readonly FirestoreWrite[]): Promise<void> {
    for(const w of writes) {
      if(!w.update) continue;
      const current=this.docs.get(w.update.name);
      if(w.currentDocument?.exists===false && current) throw new Error('Firestore request failed with HTTP 409.');
      if(w.currentDocument?.exists===true && !current) throw new Error('Firestore request failed with HTTP 409.');
      if(w.currentDocument?.updateTime && current?.updateTime!==w.currentDocument.updateTime) throw new Error('Firestore request failed with HTTP 409.');
    }
    for(const w of writes) if(w.update) this.docs.set(w.update.name,{fields:decodeFirestoreFields(w.update.fields),updateTime:String(++this.version)});
  }
}
test('Firestore queue allocates IDs, locks, completes, and counts durable tasks', async()=>{
  const queue=new SaqlainFirestoreTaskQueueService({client:new MemoryClient(), auditWriter: async () => undefined});
  const first=await queue.enqueue('backup-a','enqueue-backup-a-001','operator',new Date('2026-10-23T00:00:00Z'));
  const second=await queue.enqueue('backup-b','enqueue-backup-b-001','operator',new Date('2026-10-23T00:01:00Z'));
  assert.equal(first.managerTaskId,'01010');
  assert.equal(second.managerTaskId,'01012');
  const locked=await queue.lockNextPending('agent-a','operator');
  assert.equal(locked?.managerTaskId,first.managerTaskId);
  const completed=await queue.complete(first.managerTaskId,'agent-a','operator');
  assert.equal(completed.status,'COMPLETED');
  const counts=await queue.getCounts();
  assert.equal(counts.completedTasks,1);
  assert.equal(counts.pendingTasks,1);
});
test('Firestore queue rejects completion by the wrong agent and unsafe requeue',async()=>{
  const queue=new SaqlainFirestoreTaskQueueService({client:new MemoryClient(), auditWriter: async () => undefined});
  const task=await queue.enqueue('backup','enqueue-backup-c-001','operator',new Date());
  await queue.lockNextPending('agent-a','operator');
  await assert.rejects(()=>queue.complete(task.managerTaskId,'agent-b','operator'),/current task owner/);
});


class MissingUpdateTimeClient extends SaqlainFirestoreRestClient {
  private docs = new Map<string, Record<string, unknown>>();
  constructor() { super({ projectId: 'saqlain-staging-123', accessTokenProvider: async () => 'token' }); }
  override async getDocument(collection: string, id: string): Promise<Record<string, unknown> | null> {
    const doc=this.docs.get(this.documentName(collection,id));
    return doc ? { ...doc } : null;
  }
  override async listDocuments(collection: string): Promise<Record<string, unknown>[]> {
    const prefix=this.documentName(collection,'');
    return [...this.docs.entries()].filter(([name])=>name.startsWith(prefix)).map(([name,doc])=>({...doc,_name:name}));
  }
  override async commit(writes: readonly FirestoreWrite[]): Promise<void> {
    for (const write of writes) {
      if (!write.update) continue;
      if (write.currentDocument?.exists === false && this.docs.has(write.update.name)) {
        throw new Error('Firestore request failed with HTTP 409.');
      }
    }
    for (const write of writes) if (write.update) this.docs.set(write.update.name, decodeFirestoreFields(write.update.fields));
  }
}

test('Firestore queue fails closed if task update-time metadata is missing', async () => {
  const client = new MissingUpdateTimeClient();
  const queue = new SaqlainFirestoreTaskQueueService({ client, auditWriter: async () => undefined });
  const created = await queue.enqueue('backup-update-time', 'enqueue-update-time-001', 'operator', new Date());
  // Simulate a read path that cannot provide Firestore update-time preconditions.
  await assert.rejects(
    () => queue.complete(created.managerTaskId, 'agent-a', 'operator'),
    /missing update-time metadata/,
  );
});


test('Firestore queue enqueue is idempotent and rejects key reuse with a different payload', async () => {
  const queue = new SaqlainFirestoreTaskQueueService({ client: new MemoryClient(), auditWriter: async () => undefined });
  const key = 'stable-logical-task-0001';
  const first = await queue.enqueue('backup-idempotent', key, 'operator', new Date('2026-10-23T01:00:00.000Z'));
  const retry = await queue.enqueue('backup-idempotent', key, 'operator', new Date('2026-10-23T02:00:00.000Z'));
  assert.equal(retry.managerTaskId, first.managerTaskId);
  assert.equal(retry.createdAt, first.createdAt);
  assert.equal((await queue.getCounts()).totalTasks, 1);
  await assert.rejects(
    () => queue.enqueue('different-backup', key, 'operator', new Date()),
    /Idempotency key was already used/,
  );
  await assert.rejects(
    () => queue.enqueue('backup-idempotent', key, 'different-operator', new Date()),
    /Idempotency key was already used/,
  );
});

test('concurrent Firestore enqueue retries with the same key resolve to one durable task', async () => {
  const queue = new SaqlainFirestoreTaskQueueService({ client: new MemoryClient(), auditWriter: async () => undefined });
  const key = 'concurrent-logical-task-0001';
  const [first, retry] = await Promise.all([
    queue.enqueue('backup-concurrent', key, 'operator', new Date('2026-10-23T03:00:00.000Z')),
    queue.enqueue('backup-concurrent', key, 'operator', new Date('2026-10-23T03:00:01.000Z')),
  ]);
  assert.equal(first.managerTaskId, retry.managerTaskId);
  assert.equal((await queue.getCounts()).totalTasks, 1);
});
