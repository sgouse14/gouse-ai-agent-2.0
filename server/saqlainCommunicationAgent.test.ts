import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareSaqlainCommunication } from './saqlainCommunicationAgent.ts';

const base = {
  actorId: 'saq-communication-agent',
  actorAuthenticated: true,
  projectId: 'gouse-ai-agent-2.0',
  cycleId: 'saqlain-cycle-12345678-1234-4234-8234-123456789abc',
  priorResults: [
    { agentId: 'saq-backup-gouse', role: 'BACKUP', status: 'VERIFIED' as const },
    { agentId: 'saq-backup-files', role: 'BACKUP', status: 'HOLD' as const },
  ],
};

test('communication agent prepares a sanitized internal status report with fixed routing', () => {
  const result = prepareSaqlainCommunication(base);
  assert.equal(result.status, 'VERIFIED');
  assert.equal(result.report?.overall, 'ATTENTION_REQUIRED');
  assert.deepEqual(result.report?.counts, { verified: 1, held: 1, failed: 0 });
  assert.deepEqual(result.report?.route, ['queue-manager', 'saqlain-security-review', 'gouse-ai-final-review']);
  assert.equal(result.report?.delivery, 'INTERNAL_REPORT_ONLY');
  assert.match(result.summary, /no external message sent/);
});

test('communication is blocked when trusted actor authentication or project scope is missing', () => {
  const unauthenticated = prepareSaqlainCommunication({ ...base, actorAuthenticated: false });
  assert.equal(unauthenticated.status, 'HOLD');
  assert.match(unauthenticated.summary, /held by Saqlain policy/);

  const unscoped = prepareSaqlainCommunication({ ...base, projectId: '' });
  assert.equal(unscoped.status, 'HOLD');
});

test('communication rejects malformed cycle identifiers and malformed agent results', () => {
  assert.equal(prepareSaqlainCommunication({ ...base, cycleId: 'bad' }).status, 'HOLD');
  assert.equal(prepareSaqlainCommunication({
    ...base,
    priorResults: [{ agentId: '', role: 'BACKUP', status: 'VERIFIED' }],
  }).status, 'HOLD');
});

test('communication summary never copies raw agent exception messages into the report', () => {
  const result = prepareSaqlainCommunication({
    ...base,
    priorResults: [{ agentId: 'agent-a', role: 'BACKUP', status: 'FAILED', summary: 'secret=/tmp/private-key.pem' }],
  });
  assert.equal(result.status, 'VERIFIED');
  assert.doesNotMatch(result.summary, /private-key|\/tmp/);
  assert.equal(result.report?.overall, 'ATTENTION_REQUIRED');
});


test('communication requires the fixed internal actor and at least one bounded result', () => {
  assert.equal(prepareSaqlainCommunication({ ...base, actorId: 'user-controlled-actor' }).status, 'HOLD');
  assert.equal(prepareSaqlainCommunication({ ...base, priorResults: [] }).status, 'HOLD');
  assert.equal(prepareSaqlainCommunication({ ...base, priorResults: Array.from({ length: 501 }, (_, i) => ({
    agentId: 'agent-' + i, role: 'BACKUP', status: 'VERIFIED' as const,
  })) }).status, 'HOLD');
});

test('communication holds duplicate agent results rather than inflating the report', () => {
  const duplicate = { agentId: 'agent-duplicate', role: 'BACKUP', status: 'VERIFIED' as const };
  const result = prepareSaqlainCommunication({ ...base, priorResults: [duplicate, duplicate] });
  assert.equal(result.status, 'HOLD');
  assert.match(result.summary, /duplicate/);
});
