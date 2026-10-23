import test from 'node:test';
import assert from 'node:assert/strict';
import type { AuditEventInput, AuditRecord } from './saqlainAuditLog.ts';
import { sendCycleStatusToExternalAgent, type ExternalAgentStatusMessage, type ExternalCommunicationOptions } from './saqlainExternalCommunication.ts';

const request = { actorId: 'saq-communication-agent', projectId: 'project-a', recipientAgentId: 'approved-agent', cycleId: 'saqlain-cycle-12345678-1234-4234-8234-123456789abc', counts: { verified: 1, held: 0, failed: 0 } };

function setup(override: Partial<ExternalCommunicationOptions> = {}) {
 const events: string[] = [];
 const delivered: Array<{ id: string; msg: ExternalAgentStatusMessage }> = [];
 const config: ExternalCommunicationOptions = {
  auditFilePath: '/tmp/audit.jsonl',
  approvedRecipientIds: new Set(['approved-agent']),
  authorize: async () => ({ authenticated: true, projectAuthorized: true, approved: true }),
  deliver: async (id, msg) => { delivered.push({ id, msg }); return { receiptId: 'receipt-a' }; },
  appendAudit: async (_path: string, event: AuditEventInput): Promise<AuditRecord> => {
   events.push(event.eventType);
   return {
    schemaVersion: 1, sequence: events.length, eventId: 'test-event-' + events.length,
    occurredAt: event.occurredAt ?? '2026-10-23T00:00:00.000Z',
    eventType: event.eventType, actorId: event.actorId, outcome: event.outcome,
    ...(event.resource ? { resource: event.resource } : {}),
    ...(event.taskId ? { taskId: event.taskId } : {}),
    ...(event.details ? { details: event.details } : {}),
    previousHash: '0'.repeat(64), recordHash: '1'.repeat(64),
   };
  },
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

test('only the Communication Agent may use outbound delivery', async () => {
 const x = setup();
 assert.equal((await sendCycleStatusToExternalAgent({ ...request, actorId: 'saq-backup-gouse' }, x.config)).status, 'HOLD');
 assert.equal(x.delivered.length, 0);
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
