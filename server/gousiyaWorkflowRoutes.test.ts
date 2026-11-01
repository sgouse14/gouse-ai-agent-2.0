import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import type { Server } from 'node:http';
import { createGousiyaWorkflowRouter, type GousiyaWorkflowStoreApi } from './gousiyaWorkflowRoutes.ts';

class MemoryWorkflowStore implements GousiyaWorkflowStoreApi {
  records = new Map<string, { workflowId: string; incidentId: string; actorId: string; reason: string; stage: string }>();
  events = new Map<string, Record<string, unknown>[]>();
  async create(input: { workflowId: string; incidentId: string; actorId: string; reason: string }) {
    if (this.records.has(input.workflowId)) throw new Error('Workflow already exists.');
    const record = { ...input, stage: 'INTAKE' };
    this.records.set(input.workflowId, record);
    this.events.set(input.workflowId, [{ from: null, to: 'INTAKE', actorId: input.actorId, reason: input.reason }]);
    return record;
  }
  async get(workflowId: string) { return this.records.get(workflowId) ?? null; }
  async listEvents(workflowId: string) {
    if (!this.records.has(workflowId)) throw new Error('Workflow not found.');
    return this.events.get(workflowId) ?? [];
  }
}

async function withServer(run: (baseUrl: string, store: MemoryWorkflowStore) => Promise<void>) {
  const store = new MemoryWorkflowStore();
  const app = express();
  app.use(express.json());
  app.use('/api/security/gousiya/workflows', createGousiyaWorkflowRouter({
    authenticateToken: async token => {
      if (token === 'workflow-owner-token-123456789012345') return { uid: 'owner-1' };
      if (token === 'workflow-other-token-123456789012') return { uid: 'owner-2' };
      if (token === 'workflow-user-token-1234567890123') return { uid: 'user-1' };
      throw new Error('invalid token');
    },
    getOwnerUids: () => new Set(['owner-1', 'owner-2']),
    getStore: () => store,
  }));
  const server: Server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.listening ? resolve() : server.once('listening', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Test server did not bind a TCP port.');
  try { await run('http://127.0.0.1:' + address.port, store); }
  finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
}
const owner = 'Bearer workflow-owner-token-123456789012345';
const nonOwner = 'Bearer workflow-user-token-1234567890123';

test('Gousiya workflow API requires verified identity and owner allowlist', async () => {
  await withServer(async base => {
    assert.equal((await fetch(base + '/api/security/gousiya/workflows')).status, 404);
    assert.equal((await fetch(base + '/api/security/gousiya/workflows/w1', {
      headers: { authorization: 'Bearer too-short' },
    })).status, 401);
    assert.equal((await fetch(base + '/api/security/gousiya/workflows/w1', {
      headers: { authorization: nonOwner },
    })).status, 403);
  });
});

test('Gousiya workflow API derives actor from verified identity and validates intake', async () => {
  await withServer(async (base, store) => {
    const invalid = await fetch(base + '/api/security/gousiya/workflows', {
      method: 'POST', headers: { authorization: owner, 'content-type': 'application/json' },
      body: JSON.stringify({ workflowId: '../unsafe', incidentId: 'incident-a', reason: 'start', actorId: 'owner-2' }),
    });
    assert.equal(invalid.status, 400);
    const created = await fetch(base + '/api/security/gousiya/workflows', {
      method: 'POST', headers: { authorization: owner, 'content-type': 'application/json' },
      body: JSON.stringify({ workflowId: 'workflow-api-1', incidentId: 'incident-api-1', reason: 'controlled intake', actorId: 'owner-2' }),
    });
    assert.equal(created.status, 201);
    const record = await created.json() as { actorId: string; stage: string };
    assert.equal(record.actorId, 'owner-1');
    assert.equal(record.stage, 'INTAKE');
    assert.equal(store.records.get('workflow-api-1')?.actorId, 'owner-1');
  });
});

test('Gousiya workflow API reads current state and append-only events without exposing transition endpoint', async () => {
  await withServer(async (base) => {
    await fetch(base + '/api/security/gousiya/workflows', {
      method: 'POST', headers: { authorization: owner, 'content-type': 'application/json' },
      body: JSON.stringify({ workflowId: 'workflow-read', incidentId: 'incident-read', reason: 'create for read test' }),
    });
    const get = await fetch(base + '/api/security/gousiya/workflows/workflow-read', {
      headers: { authorization: owner },
    });
    assert.equal(get.status, 200);
    assert.equal((await get.json() as { stage: string }).stage, 'INTAKE');
    const foreignRead = await fetch(base + '/api/security/gousiya/workflows/workflow-read', {
      headers: { authorization: 'Bearer workflow-other-token-123456789012' },
    });
    assert.equal(foreignRead.status, 404);
    const events = await fetch(base + '/api/security/gousiya/workflows/workflow-read/events', {
      headers: { authorization: owner },
    });
    assert.equal(events.status, 200);
    assert.equal(((await events.json()) as { events: unknown[] }).events.length, 1);
    const unsafeTransition = await fetch(base + '/api/security/gousiya/workflows/workflow-read/transition', {
      method: 'POST', headers: { authorization: owner, 'content-type': 'application/json' },
      body: JSON.stringify({ to: 'VERIFIED', verificationPassed: true, evidenceId: 'made-up' }),
    });
    assert.equal(unsafeTransition.status, 404);
  });
});
