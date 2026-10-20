import test from 'node:test';
import assert from 'node:assert/strict';
import { sendCycleStatusToExternalAgent } from './saqlainExternalCommunication.ts';

const request = { actorId: 'service-agent', projectId: 'project-a', recipientAgentId: 'approved-agent', cycleId: 'saqlain-cycle-12345678-1234-4234-8234-123456789abc', counts: { verified: 1, held: 0, failed: 0 } };

function setup(override = {}) {
 const events = [];
 const delivered = [];
 const config = {
  auditFilePath: '/tmp/audit.jsonl',
  approvedRecipientIds: new Set(['approved-agent']),
  authorize: async () => ({ authenticated: true, projectAuthorized: true, approved: true }),
  deliver: async (id, msg) => { delivered.push({ id, msg }); return { receiptId: 'receipt-a' }; },
  appendAudit: async (_path, event) => { events.push(event.eventType); return {}; },
  ...override,
 };
 return { config, events, delivered };
}

test('sends a fixed status envelope only after intent audit', async () => {
 const x = setup();
 const result = await sendCycleStatusToExternalAgent(request, x.config);
 assert.equal(result.status, 'SENT');
 assert.equal(x.delivered.length, 1);
 assert.equal(x.events[0], 'SAQLAIN_EXTERNAL_AGENT_MESSAGE_INTENT');
 assert.equal(x.events[1], 'SAQLAIN_EXTERNAL_AGENT_MESSAGE_RESULT');
 assert.equal(x.delivered[0].msg.type, 'SAQLAIN_CYCLE_STATUS');
});

test('rejects remote agents that are not operator-allowlisted', async () => {
 const x = setup({ approvedRecipientIds: new Set(['other-agent']) });
 assert.equal((await sendCycleStatusToExternalAgent(request, x.config)).status, 'HOLD');
 assert.equal(x.delivered.length, 0);
});

test('requires trusted authorization and explicit approval', async () => {
 const x = setup({ authorize: async () => ({ authenticated: true, projectAuthorized: true, approved: false }) });
 assert.equal((await sendCycleStatusToExternalAgent(request, x.config)).status, 'HOLD');
 assert.equal(x.delivered.length, 0);
});

test('fails closed if intent audit cannot be persisted', async () => {
 const x = setup({ appendAudit: async () => { throw new Error('unavailable'); } });
 assert.equal((await sendCycleStatusToExternalAgent(request, x.config)).status, 'HOLD');
 assert.equal(x.delivered.length, 0);
});
