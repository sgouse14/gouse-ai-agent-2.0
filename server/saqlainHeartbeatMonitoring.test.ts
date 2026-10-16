import test from 'node:test';
import assert from 'node:assert/strict';
import { collectRegisteredHeartbeatSummary } from './saqlainHeartbeatMonitoring.ts';

const digest = 'a'.repeat(64);
const configured = JSON.stringify([
  { agentId: 'backup-a', tokenSha256: digest },
  { agentId: 'recovery-a', tokenSha256: digest },
]);

test('monitoring counts only recent heartbeats from configured agents', () => {
  const result = collectRegisteredHeartbeatSummary(configured, [
    { agentId: 'backup-a', lastSeenAt: '2026-10-16T14:00:00.000Z' },
    { agentId: 'recovery-a', lastSeenAt: '2026-10-16T10:00:00.000Z' },
    { agentId: 'unregistered-agent', lastSeenAt: '2026-10-16T14:00:00.000Z' },
  ], new Date('2026-10-16T14:30:00.000Z'));
  assert.deepEqual(result, {
    activeAgentIds: ['backup-a'],
    staleAgentIds: ['recovery-a'],
    activeAgents: 1,
  });
});

test('monitoring fails closed for missing, malformed, empty, duplicate, or invalid credential configuration', () => {
  for (const raw of [
    undefined,
    '',
    '{broken',
    '[]',
    JSON.stringify([{ agentId: 'backup-a', tokenSha256: digest }, { agentId: 'backup-a', tokenSha256: digest }]),
    JSON.stringify([{ agentId: 'backup-a', tokenSha256: 'not-a-digest' }]),
  ]) {
    assert.throws(() => collectRegisteredHeartbeatSummary(raw, []), /configuration is missing or invalid/);
  }
});

test('monitoring does not count future-dated heartbeats as active', () => {
  const result = collectRegisteredHeartbeatSummary(configured, [
    { agentId: 'backup-a', lastSeenAt: '2026-10-16T14:31:00.000Z' },
  ], new Date('2026-10-16T14:30:00.000Z'));
  assert.equal(result.activeAgents, 0);
  assert.deepEqual(result.staleAgentIds, ['backup-a', 'recovery-a']);
});
