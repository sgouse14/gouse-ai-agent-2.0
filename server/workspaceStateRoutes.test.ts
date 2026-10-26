import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'node:net';
import type { Request, Response, NextFunction } from 'express';
import { createWorkspaceStateRouter } from './workspaceStateRoutes.ts';
import { WorkspaceStateError, type WorkspaceStateService, type WorkspaceStateDomain } from './workspaceStateService.ts';

class MemoryWorkspaceService {
  private readonly records = new Map<string, { data: unknown; version: string }>();
  failReads = false;
  failWrites = false;
  private sequence = 0;

  async read(uid: string, domain: WorkspaceStateDomain) {
    if (this.failReads) throw new WorkspaceStateError('unavailable', 'simulated storage failure');
    return this.records.get(uid + ':' + domain) ?? null;
  }

  async write(uid: string, domain: WorkspaceStateDomain, data: unknown, expectedVersion: string | null) {
    if (this.failWrites) throw new WorkspaceStateError('unavailable', 'simulated storage failure');
    const key = uid + ':' + domain;
    const existing = this.records.get(key);
    if ((existing?.version ?? null) !== expectedVersion) {
      throw new WorkspaceStateError('conflict', 'stale version');
    }
    const version = 'v' + (++this.sequence);
    this.records.set(key, { data, version });
    return { version };
  }
}

async function withServer(
  run: (baseUrl: string, service: MemoryWorkspaceService) => Promise<void>,
): Promise<void> {
  const service = new MemoryWorkspaceService();
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use((req, _res, next) => {
    if (req.header('authorization') === 'Bearer test-token') {
      req.saqlainIdentity = { uid: 'user-a' } as NonNullable<typeof req.saqlainIdentity>;
    }
    next();
  });
  app.use('/api/workspace-state', createWorkspaceStateRouter(service as unknown as WorkspaceStateService));
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof SyntaxError) { res.status(400).json({ error: 'Invalid JSON request body' }); return; }
    res.status(500).json({ error: 'test server error' });
  });
  const server = app.listen(0);
  try {
    await new Promise<void>((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });
    const address = server.address() as AddressInfo;
    await run('http://127.0.0.1:' + address.port, service);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
}

test('workspace HTTP routes enforce identity, validate requests, and protect versioned writes', async () => {
  await withServer(async baseUrl => {
    const anonymous = await fetch(baseUrl + '/api/workspace-state/projects');
    assert.equal(anonymous.status, 401);

    const missing = await fetch(baseUrl + '/api/workspace-state/projects', {
      headers: { Authorization: 'Bearer test-token' },
    });
    assert.equal(missing.status, 404);

    const invalidDomain = await fetch(baseUrl + '/api/workspace-state/not-a-domain', {
      headers: { Authorization: 'Bearer test-token' },
    });
    assert.equal(invalidDomain.status, 400);

    const missingFields = await fetch(baseUrl + '/api/workspace-state/projects', {
      method: 'PUT',
      headers: { Authorization: 'Bearer test-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [] }),
    });
    assert.equal(missingFields.status, 400);

    const created = await fetch(baseUrl + '/api/workspace-state/projects', {
      method: 'PUT',
      headers: { Authorization: 'Bearer test-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [{ id: 'p1' }], expectedVersion: null }),
    });
    assert.equal(created.status, 200);
    const createdBody = await created.json() as { version: string };
    assert.equal(typeof createdBody.version, 'string');
    assert.equal(created.headers.get('cache-control'), 'no-store');

    const read = await fetch(baseUrl + '/api/workspace-state/projects', {
      headers: { Authorization: 'Bearer test-token' },
    });
    assert.equal(read.status, 200);
    assert.deepEqual(await read.json(), { data: [{ id: 'p1' }], version: createdBody.version });

    const stale = await fetch(baseUrl + '/api/workspace-state/projects', {
      method: 'PUT',
      headers: { Authorization: 'Bearer test-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [{ id: 'stale' }], expectedVersion: null }),
    });
    assert.equal(stale.status, 409);
  });
});

test('workspace HTTP routes return sanitized storage errors', async () => {
  await withServer(async (baseUrl, service) => {
    service.failReads = true;
    const response = await fetch(baseUrl + '/api/workspace-state/projects', {
      headers: { Authorization: 'Bearer test-token' },
    });
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: 'Workspace storage is unavailable.' });
  });
});

test('workspace HTTP routes reject malformed JSON with a client error', async () => {
  await withServer(async baseUrl => {
    const response = await fetch(baseUrl + '/api/workspace-state/projects', {
      method: 'PUT',
      headers: { Authorization: 'Bearer test-token', 'Content-Type': 'application/json' },
      body: '{"data":',
    });
    assert.equal(response.status, 400);
  });
});
