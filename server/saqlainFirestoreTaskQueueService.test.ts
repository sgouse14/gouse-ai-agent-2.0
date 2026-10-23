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
  const queue=new SaqlainFirestoreTaskQueueService({client:new MemoryClient()});
  const first=await queue.enqueue('backup-a','operator',new Date('2026-10-23T00:00:00Z'));
  const second=await queue.enqueue('backup-b','operator',new Date('2026-10-23T00:01:00Z'));
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
  const queue=new SaqlainFirestoreTaskQueueService({client:new MemoryClient()});
  const task=await queue.enqueue('backup','operator');
  await queue.lockNextPending('agent-a','operator');
  await assert.rejects(()=>queue.complete(task.managerTaskId,'agent-b','operator'),/current task owner/);
});
