import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeAgentHeartbeats } from './saqlainAgentHeartbeat.ts';

test('only recent heartbeats from registered agents count as active', () => {
  const result = summarizeAgentHeartbeats(
    ['backup-a', 'backup-b', 'recovery-a'],
    [
      { agentId: 'backup-a', lastSeenAt: '2026-10-13T11:59:00.000Z' },
      { agentId: 'backup-b', lastSeenAt: '2026-10-13T09:00:00.000Z' },
      { agentId: 'unregistered', lastSeenAt: '2026-10-13T11:59:00.000Z' },
      { agentId: 'recovery-a', lastSeenAt: 'not-a-date' },
    ],
    new Date('2026-10-13T12:00:00.000Z'),
    2 * 60 * 60 * 1000,
  );
  assert.deepEqual(result, {
    activeAgentIds: ['backup-a'],
    staleAgentIds: ['backup-b', 'recovery-a'],
    activeAgents: 1,
  });
});

test('latest heartbeat wins and future timestamps do not count as active', () => {
  const result = summarizeAgentHeartbeats(
    ['worker-a', 'worker-b'],
    [
      { agentId: 'worker-a', lastSeenAt: '2026-10-13T09:00:00.000Z' },
      { agentId: 'worker-a', lastSeenAt: '2026-10-13T11:59:00.000Z' },
      { agentId: 'worker-b', lastSeenAt: '2026-10-13T12:01:00.000Z' },
    ],
    new Date('2026-10-13T12:00:00.000Z'),
  );
  assert.deepEqual(result.activeAgentIds, ['worker-a']);
  assert.deepEqual(result.staleAgentIds, ['worker-b']);
});

test('invalid registration configuration is rejected', () => {
  assert.throws(() => summarizeAgentHeartbeats(['worker-a', 'worker-a'], [], new Date(), 1000), /unique/);
  assert.throws(() => summarizeAgentHeartbeats(['worker-a'], [], new Date(), 0), /staleAfterMs/);
});
