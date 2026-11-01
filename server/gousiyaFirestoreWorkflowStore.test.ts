import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GousiyaFirestoreWorkflowStore,
} from './gousiyaFirestoreWorkflowStore.ts';
import {
  SaqlainFirestoreRestClient,
  decodeFirestoreFields,
  type FirestoreWrite,
} from './saqlainFirestoreRest.ts';

class MemoryClient extends SaqlainFirestoreRestClient {
  private docs = new Map<string, { fields: Record<string, unknown>; updateTime: string }>();
  private sequence = 0;

  constructor() {
    super({ projectId: 'gousiya-test-project', accessTokenProvider: async () => 'test-token' });
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
    // Validate all preconditions before changing anything to model atomic Firestore commits.
    for (const write of writes) {
      if (!write.update) continue;
      const current = this.docs.get(write.update.name);
      if (write.currentDocument?.exists === false && current) {
        throw new Error('Firestore request failed with HTTP 409.');
      }
      if (write.currentDocument?.exists === true && !current) {
        throw new Error('Firestore request failed with HTTP 409.');
      }
      if (write.currentDocument?.updateTime && current?.updateTime !== write.currentDocument.updateTime) {
        throw new Error('Firestore request failed with HTTP 409.');
      }
    }
    for (const write of writes) {
      if (!write.update) continue;
      this.docs.set(write.update.name, {
        fields: decodeFirestoreFields(write.update.fields),
        updateTime: String(++this.sequence),
      });
    }
  }
}

function makeStore(client = new MemoryClient()) {
  let tick = 0;
  return new GousiyaFirestoreWorkflowStore({
    client,
    now: () => new Date(Date.UTC(2026, 9, 26, 0, 0, tick++)),
  });
}

async function toGrant(store: GousiyaFirestoreWorkflowStore, workflowId: string) {
  await store.create({
    workflowId, incidentId: 'incident-' + workflowId,
    actorId: 'operator-a', reason: 'start controlled recovery',
  });
  await store.transition(workflowId, {
    expectedVersion: 1, to: 'SNAPSHOT_VALIDATED', actorId: 'operator-a',
    reason: 'snapshot verified', evidenceId: 'snapshot-hash-' + workflowId,
  });
  await store.transition(workflowId, {
    expectedVersion: 2, to: 'APPROVAL_PENDING', actorId: 'operator-a',
    reason: 'request independent approvals',
  });
}

test('Firestore workflow store persists workflow and append-only events across store instances', async () => {
  const client = new MemoryClient();
  const store = makeStore(client);
  const created = await store.create({
    workflowId: 'workflow-restart', incidentId: 'incident-restart',
    actorId: 'operator-a', reason: 'start workflow',
  });
  const reloadedStore = makeStore(client);
  const loaded = await reloadedStore.get(created.workflowId);
  assert.equal(loaded?.stage, 'INTAKE');
  assert.equal(loaded?.version, 1);

  const next = await reloadedStore.transition(created.workflowId, {
    expectedVersion: 1, to: 'SNAPSHOT_VALIDATED', actorId: 'operator-a',
    reason: 'snapshot evidence verified', evidenceId: 'snapshot-durable-001',
  });
  assert.equal(next.stage, 'SNAPSHOT_VALIDATED');
  assert.equal(next.version, 2);
  const events = await store.listEvents(created.workflowId);
  assert.deepEqual(events.map(event => event.workflowVersion), [1, 2]);
  assert.equal((await client.listDocuments('gousiyaRecoveryWorkflows')).length, 1);
});

test('workflow creation fails closed on duplicate workflow IDs without overwriting state', async () => {
  const store = makeStore();
  await store.create({
    workflowId: 'workflow-unique', incidentId: 'incident-a',
    actorId: 'operator-a', reason: 'first create',
  });
  await assert.rejects(store.create({
    workflowId: 'workflow-unique', incidentId: 'incident-b',
    actorId: 'operator-b', reason: 'duplicate create',
  }), /HTTP 409/);
  assert.equal((await store.get('workflow-unique'))?.incidentId, 'incident-a');
});

test('workflow transition atomically consumes distinct approvals exactly once', async () => {
  const client = new MemoryClient();
  const store = makeStore(client);
  await toGrant(store, 'workflow-approval-a');
  const grant = await store.transition('workflow-approval-a', {
    expectedVersion: 3, to: 'GRANT_ISSUED', actorId: 'operator-a',
    reason: 'approvals verified', evidenceId: 'grant-ref-a',
    ownerApprovalId: 'verified-owner-approval-001',
    reviewerApprovalId: 'verified-reviewer-approval-001',
  });
  assert.equal(grant.stage, 'GRANT_ISSUED');
  assert.equal((await client.listDocuments('gousiyaApprovalConsumption')).length, 2);
  await toGrant(store, 'workflow-approval-b');
  await assert.rejects(store.transition('workflow-approval-b', {
    expectedVersion: 3, to: 'GRANT_ISSUED', actorId: 'operator-a',
    reason: 'replay previous approvals', evidenceId: 'grant-ref-b',
    ownerApprovalId: 'verified-owner-approval-001',
    reviewerApprovalId: 'verified-reviewer-approval-001',
  }), /already consumed or workflow changed/);
  assert.equal((await store.get('workflow-approval-b'))?.stage, 'APPROVAL_PENDING');
  assert.equal((await client.listDocuments('gousiyaRecoveryEvents')).length, 7);
});

test('workflow transitions reject stale concurrent writes and preserve the winning version', async () => {
  const client = new MemoryClient();
  const store = makeStore(client);
  await store.create({
    workflowId: 'workflow-race', incidentId: 'incident-race',
    actorId: 'operator-a', reason: 'start race test',
  });
  const outcomes = await Promise.allSettled([
    store.transition('workflow-race', {
      expectedVersion: 1, to: 'HOLD', actorId: 'operator-a', reason: 'hold for review',
    }),
    store.transition('workflow-race', {
      expectedVersion: 1, to: 'SNAPSHOT_VALIDATED', actorId: 'operator-a',
      reason: 'validate snapshot', evidenceId: 'snapshot-race',
    }),
  ]);
  assert.equal(outcomes.filter(outcome => outcome.status === 'fulfilled').length, 1);
  assert.equal(outcomes.filter(outcome => outcome.status === 'rejected').length, 1);
  assert.equal((await store.get('workflow-race'))?.version, 2);
  assert.equal((await store.listEvents('workflow-race')).length, 2);
});

test('workflow store validates IDs and requires evidence for verified closure', async () => {
  const store = makeStore();
  await assert.rejects(store.get('../unsafe'), /format is invalid/);
  const created = await store.create({
    workflowId: 'workflow-closure', incidentId: 'incident-closure',
    actorId: 'operator-a', reason: 'start closure test',
  });
  await assert.rejects(store.transition(created.workflowId, {
    expectedVersion: 1, to: 'CLOSED', actorId: 'operator-a', reason: 'skip verification',
  }), /Invalid workflow transition/);
  assert.equal((await store.get(created.workflowId))?.stage, 'INTAKE');
});
