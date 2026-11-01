import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import type { Server } from 'node:http';
import {
  createSaqlainAgentRegistryRouter,
  type AgentRegistryApi,
} from './saqlainAgentRegistryRoutes.ts';
import type { DurableAgentRecord } from './saqlainFirestoreAgentRegistry.ts';

class MemoryRegistry implements AgentRegistryApi {
  records = new Map<string, DurableAgentRecord>();
  async list() { return [...this.records.values()].map(record => ({ ...record })); }
  async get(agentKey: string) {
    const record = this.records.get(agentKey);
    return record ? { ...record } : null;
  }
  async register(input: { agentKey: string; actorUid: string; reason: string }) {
    if (this.records.has(input.agentKey)) throw new Error('Agent key is already registered.');
    const now = new Date().toISOString();
    const record: DurableAgentRecord = {
      agentKey: input.agentKey,
      currentBinaryId: '1'.repeat(128),
      status: 'ACTIVE',
      ownerUid: input.actorUid,
      ownerApproved: true,
      createdAt: now,
      updatedAt: now,
      suspendedReason: null,
      completedTaskCount: 0,
    };
    this.records.set(record.agentKey, record);
    return { ...record };
  }
  async suspend(input: { agentKey: string; actorUid: string; reason: string }) {
    return this.change(input.agentKey, 'SUSPENDED', input.reason);
  }
  async reactivate(input: { agentKey: string; actorUid: string; reason: string }) {
    return this.change(input.agentKey, 'ACTIVE', input.reason);
  }
  async retire(input: { agentKey: string; actorUid: string; reason: string }) {
    return this.change(input.agentKey, 'RETIRED', input.reason);
  }
  private change(agentKey: string, status: DurableAgentRecord['status'], reason: string) {
    const current = this.records.get(agentKey);
    if (!current) throw new Error('Agent not found.');
    const updated = { ...current, status, ownerApproved: status !== 'RETIRED',
      suspendedReason: status === 'SUSPENDED' ? reason : null, updatedAt: new Date().toISOString() };
    this.records.set(agentKey, updated);
    return { ...updated };
  }
}

async function withServer(run: (baseUrl: string, registry: MemoryRegistry) => Promise<void>) {
  const registry = new MemoryRegistry();
  const app = express();
  app.use(express.json());
  app.use('/agents', createSaqlainAgentRegistryRouter({
    authenticateToken: async token => {
      if (token === 'owner-token-12345678901234567890') return { uid: 'owner-1' };
      if (token === 'other-owner-token-123456789012345') return { uid: 'owner-2' };
      if (token === 'non-owner-token-123456789012345678') return { uid: 'user-1' };
      throw new Error('invalid token');
    },
    getRegistry: () => registry,
    getOwnerUids: () => new Set(['owner-1', 'owner-2']),
  }));
  const server: Server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.listening ? resolve() : server.once('listening', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Test server did not bind a TCP port.');
  try { await run('http://127.0.0.1:' + address.port, registry); }
  finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
}

test('agent lifecycle API fails closed without a valid Firebase bearer token', async () => {
  await withServer(async baseUrl => {
    const response = await fetch(baseUrl + '/agents', { headers: { authorization: 'Bearer short' } });
    assert.equal(response.status, 401);
  });
});

test('agent lifecycle API requires server-configured owner authorization', async () => {
  await withServer(async baseUrl => {
    const response = await fetch(baseUrl + '/agents', {
      headers: { authorization: 'Bearer non-owner-token-123456789012345678' },
    });
    assert.equal(response.status, 403);
  });
});

test('agent creation derives owner from verified identity and ignores request-supplied identity flags', async () => {
  await withServer(async (baseUrl, registry) => {
    const response = await fetch(baseUrl + '/agents', {
      method: 'POST',
      headers: { authorization: 'Bearer owner-token-12345678901234567890', 'content-type': 'application/json' },
      body: JSON.stringify({ agentKey: 'agent-created', reason: 'owner approved creation', actorUid: 'owner-2', ownerApproved: false }),
    });
    assert.equal(response.status, 201);
    const result = await response.json() as DurableAgentRecord;
    assert.equal(result.ownerUid, 'owner-1');
    assert.equal(result.ownerApproved, true);
    assert.equal(registry.records.get('agent-created')?.ownerUid, 'owner-1');
  });
});

test('agent lifecycle API enforces per-agent ownership and records controlled transitions', async () => {
  await withServer(async (baseUrl) => {
    const create = await fetch(baseUrl + '/agents', {
      method: 'POST',
      headers: { authorization: 'Bearer owner-token-12345678901234567890', 'content-type': 'application/json' },
      body: JSON.stringify({ agentKey: 'agent-owned', reason: 'approved' }),
    });
    assert.equal(create.status, 201);
    const foreign = await fetch(baseUrl + '/agents/agent-owned/suspend', {
      method: 'POST',
      headers: { authorization: 'Bearer other-owner-token-123456789012345', 'content-type': 'application/json' },
      body: JSON.stringify({ reason: 'not my agent' }),
    });
    assert.equal(foreign.status, 404);
    const suspend = await fetch(baseUrl + '/agents/agent-owned/suspend', {
      method: 'POST',
      headers: { authorization: 'Bearer owner-token-12345678901234567890', 'content-type': 'application/json' },
      body: JSON.stringify({ reason: 'investigate incident' }),
    });
    assert.equal(suspend.status, 200);
    assert.equal((await suspend.json() as DurableAgentRecord).status, 'SUSPENDED');
    const reactivate = await fetch(baseUrl + '/agents/agent-owned/reactivate', {
      method: 'POST',
      headers: { authorization: 'Bearer owner-token-12345678901234567890', 'content-type': 'application/json' },
      body: JSON.stringify({ reason: 'incident resolved' }),
    });
    assert.equal(reactivate.status, 200);
    assert.equal((await reactivate.json() as DurableAgentRecord).status, 'ACTIVE');
  });
});

test('agent lifecycle API validates payloads and does not expose cross-owner records', async () => {
  await withServer(async (baseUrl) => {
    const bad = await fetch(baseUrl + '/agents', {
      method: 'POST',
      headers: { authorization: 'Bearer owner-token-12345678901234567890', 'content-type': 'application/json' },
      body: JSON.stringify({ agentKey: '../unsafe', reason: 'bad key' }),
    });
    assert.equal(bad.status, 400);
    const response = await fetch(baseUrl + '/agents', {
      headers: { authorization: 'Bearer other-owner-token-123456789012345' },
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), []);
  });
});
