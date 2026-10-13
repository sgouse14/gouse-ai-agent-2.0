import test from 'node:test';
import assert from 'node:assert/strict';
import {
  acceptAuthenticatedHeartbeat,
  createInMemoryHeartbeatStore,
  sha256HeartbeatToken,
} from './saqlainHeartbeatIngestion.ts';

test('only correctly authenticated registered agent can record a heartbeat', () => {
  const store = createInMemoryHeartbeatStore();
  const credentials = [{ agentId: 'backup-a', tokenSha256: sha256HeartbeatToken('secret-a') }];
  const now = new Date('2026-10-13T12:00:00.000Z');
  assert.deepEqual(acceptAuthenticatedHeartbeat({ agentId: 'backup-a', token: 'wrong', credentials, store, now }), { accepted: false });
  assert.deepEqual(acceptAuthenticatedHeartbeat({ agentId: 'unknown', token: 'secret-a', credentials, store, now }), { accepted: false });
  assert.deepEqual(store.list(), []);
  assert.deepEqual(
    acceptAuthenticatedHeartbeat({ agentId: 'backup-a', token: 'secret-a', credentials, store, now }),
    { accepted: true, receivedAt: '2026-10-13T12:00:00.000Z' },
  );
  assert.deepEqual(store.list(), [{ agentId: 'backup-a', lastSeenAt: '2026-10-13T12:00:00.000Z' }]);
});

test('invalid credential digest and invalid clock fail closed', () => {
  const store = createInMemoryHeartbeatStore();
  assert.deepEqual(acceptAuthenticatedHeartbeat({
    agentId: 'a', token: 'x', credentials: [{ agentId: 'a', tokenSha256: 'bad' }], store,
  }), { accepted: false });
  assert.deepEqual(acceptAuthenticatedHeartbeat({
    agentId: 'a', token: 'x', credentials: [{ agentId: 'a', tokenSha256: sha256HeartbeatToken('x') }], store, now: new Date('invalid'),
  }), { accepted: false });
  assert.deepEqual(store.list(), []);
});
