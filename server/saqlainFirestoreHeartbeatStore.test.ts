import test from 'node:test';
import assert from 'node:assert/strict';
import { SaqlainFirestoreHeartbeatStore } from './saqlainFirestoreHeartbeatStore.ts';
import { SaqlainFirestoreRestClient, decodeFirestoreFields, type FirestoreWrite } from './saqlainFirestoreRest.ts';

class MemoryClient extends SaqlainFirestoreRestClient {
  private docs = new Map<string, Record<string, unknown>>();
  constructor() { super({ projectId: 'saqlain-staging-123', accessTokenProvider: async () => 'token' }); }
  override async commit(writes: readonly FirestoreWrite[]): Promise<void> {
    for (const write of writes) if (write.update) this.docs.set(write.update.name, decodeFirestoreFields(write.update.fields));
  }
  override async listDocuments(collection: string): Promise<Record<string, unknown>[]> {
    const prefix = this.documentName(collection, '');
    return [...this.docs.entries()].filter(([name]) => name.startsWith(prefix))
      .map(([name, fields]) => ({ ...fields, _name: name }));
  }
}

test('Firestore heartbeat store keeps the latest heartbeat per agent', async () => {
  const store = new SaqlainFirestoreHeartbeatStore({ client: new MemoryClient() });
  await store.record({ agentId: 'agent-a', lastSeenAt: '2026-10-23T01:00:00.000Z' });
  await store.record({ agentId: 'agent-a', lastSeenAt: '2026-10-23T01:01:00.000Z' });
  await store.record({ agentId: 'agent-b', lastSeenAt: '2026-10-23T01:02:00.000Z' });
  const beats = await store.list();
  assert.equal(beats.length, 2);
  assert.equal(beats.find(beat => beat.agentId === 'agent-a')?.lastSeenAt, '2026-10-23T01:01:00.000Z');
});

test('Firestore heartbeat store rejects malformed heartbeat records', async () => {
  const store = new SaqlainFirestoreHeartbeatStore({ client: new MemoryClient() });
  await assert.rejects(() => store.record({ agentId: '', lastSeenAt: 'invalid' }), /Invalid heartbeat record/);
});
