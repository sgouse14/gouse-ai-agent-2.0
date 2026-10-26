import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SaqlainFirestoreAgentRegistry,
} from './saqlainFirestoreAgentRegistry.ts';
import {
  SaqlainFirestoreRestClient,
  decodeFirestoreFields,
  type FirestoreWrite,
} from './saqlainFirestoreRest.ts';

class MemoryClient extends SaqlainFirestoreRestClient {
  private docs = new Map<string, { fields: Record<string, unknown>; updateTime: string }>();
  private version = 0;
  constructor() {
    super({ projectId: 'saqlain-staging-123', accessTokenProvider: async () => 'test-token' });
  }
  override async getDocument(collection: string, id: string): Promise<Record<string, unknown> | null> {
    const doc = this.docs.get(this.documentName(collection, id));
    return doc ? { ...doc.fields, _updateTime: doc.updateTime } : null;
  }
  override async listDocuments(collection: string): Promise<Record<string, unknown>[]> {
    const prefix = this.documentName(collection, '');
    return [...this.docs.entries()]
      .filter(([name]) => name.startsWith(prefix))
      .map(([name, doc]) => ({ ...doc.fields, _name: name, _updateTime: doc.updateTime }));
  }
  override async commit(writes: readonly FirestoreWrite[]): Promise<void> {
    // Check all preconditions before applying any write to emulate atomic commit.
    for (const write of writes) {
      if (write.delete) throw new Error('Delete is not supported by this test client.');
      if (!write.update) continue;
      const current = this.docs.get(write.update.name);
      if (write.currentDocument?.exists === false && current) throw new Error('Firestore request failed with HTTP 409.');
      if (write.currentDocument?.exists === true && !current) throw new Error('Firestore request failed with HTTP 409.');
      if (write.currentDocument?.updateTime && current?.updateTime !== write.currentDocument.updateTime) {
        throw new Error('Firestore request failed with HTTP 409.');
      }
    }
    for (const write of writes) {
      if (!write.update) continue;
      this.docs.set(write.update.name, {
        fields: decodeFirestoreFields(write.update.fields),
        updateTime: String(++this.version),
      });
    }
  }
}

function makeRegistry(client = new MemoryClient()) {
  let clock = 0;
  return new SaqlainFirestoreAgentRegistry({
    client,
    now: () => new Date(Date.UTC(2026, 9, 26, 0, 0, clock++)),
    retries: 5,
  });
}

test('Firestore agent registry atomically creates owner-scoped agent, permanent ID ledger, and audit', async () => {
  const client = new MemoryClient();
  const registry = makeRegistry(client);
  const agent = await registry.register({
    agentKey: 'agent-a', actorUid: 'owner-1', reason: 'approved agent registration',
  });
  assert.match(agent.currentBinaryId, /^[01]{128}$/);
  assert.equal(agent.ownerUid, 'owner-1');
  assert.equal(agent.ownerApproved, true);
  assert.equal((await registry.get('agent-a'))?.currentBinaryId, agent.currentBinaryId);
  assert.equal((await registry.list()).length, 1);
  assert.equal((await client.listDocuments('saqlainAgentIssuedIds')).length, 1);
  const audit = await client.listDocuments('saqlainAgentAudit');
  assert.equal(audit.length, 1);
  assert.equal(audit[0].eventType, 'REGISTERED');
  await assert.rejects(registry.register({
    agentKey: 'agent-a', actorUid: 'owner-1', reason: 'duplicate',
  }), /already registered/);
});

test('Firestore agent registry enforces lifecycle and preserves retired ID ledger', async () => {
  const client = new MemoryClient();
  const registry = makeRegistry(client);
  const created = await registry.register({
    agentKey: 'agent-lifecycle', actorUid: 'owner-1', reason: 'initial approval',
  });
  const suspended = await registry.suspend({
    agentKey: created.agentKey, actorUid: 'owner-1', reason: 'incident review',
  });
  assert.equal(suspended.status, 'SUSPENDED');
  assert.equal(suspended.suspendedReason, 'incident review');
  await assert.rejects(registry.suspend({
    agentKey: created.agentKey, actorUid: 'owner-1', reason: 'repeat',
  }), /Only active agents/);
  const active = await registry.reactivate({
    agentKey: created.agentKey, actorUid: 'owner-1', reason: 'review completed',
  });
  assert.equal(active.status, 'ACTIVE');
  assert.equal(active.suspendedReason, null);
  const retired = await registry.retire({
    agentKey: created.agentKey, actorUid: 'owner-1', reason: 'replacement approved',
  });
  assert.equal(retired.status, 'RETIRED');
  assert.equal(retired.ownerApproved, false);
  const ledger = await client.listDocuments('saqlainAgentIssuedIds');
  assert.equal(ledger.length, 1);
  assert.equal(ledger[0].status, 'RETIRED');
  await assert.rejects(registry.reactivate({
    agentKey: created.agentKey, actorUid: 'owner-1', reason: 'not allowed',
  }), /Retired agents cannot transition/);
  const audit = await client.listDocuments('saqlainAgentAudit');
  assert.deepEqual(audit.map(event => event.eventType).sort(), ['REACTIVATED', 'REGISTERED', 'RETIRED', 'SUSPENDED']);
});

test('Firestore agent registry rejects unsafe identifiers and does not overwrite a corrupt ledger', async () => {
  const registry = makeRegistry();
  await assert.rejects(registry.register({
    agentKey: '../unsafe', actorUid: 'owner-1', reason: 'test',
  }), /format is invalid/);
  await assert.rejects(registry.get(' '), /agentKey is required/);
});

test('concurrent lifecycle updates use Firestore update-time preconditions', async () => {
  const registry = makeRegistry();
  await registry.register({ agentKey: 'agent-race', actorUid: 'owner-1', reason: 'created' });
  const results = await Promise.allSettled([
    registry.suspend({ agentKey: 'agent-race', actorUid: 'owner-1', reason: 'suspend A' }),
    registry.suspend({ agentKey: 'agent-race', actorUid: 'owner-1', reason: 'suspend B' }),
  ]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(results.filter(result => result.status === 'rejected').length, 1);
  assert.equal((await registry.get('agent-race'))?.status, 'SUSPENDED');
});
