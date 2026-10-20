import { randomUUID } from 'node:crypto';
import { appendDurableAuditEvent } from './saqlainAuditLog.ts';
import { evaluateSaqlainAction } from './saqlainSecurity.ts';

export interface ExternalAgentStatusMessage {
  messageId: string;
  type: 'SAQLAIN_CYCLE_STATUS';
  senderAgentId: 'saq-communication-agent';
  recipientAgentId: string;
  cycleId: string;
  status: 'ALL_CHECKS_VERIFIED' | 'ATTENTION_REQUIRED';
  counts: Readonly<{ verified: number; held: number; failed: number }>;
  sentAt: string;
}
export interface ExternalAgentAuthorization {
  authenticated: boolean;
  projectAuthorized: boolean;
  approved: boolean;
}
export interface ExternalCommunicationOptions {
  auditFilePath: string;
  /** Exact remote agent IDs approved by an operator; not user-supplied endpoints. */
  approvedRecipientIds: ReadonlySet<string>;
  authorize: (input: { actorId: string; projectId: string; recipientAgentId: string }) => Promise<ExternalAgentAuthorization>;
  /** Transport adapter maps IDs to configured destinations; do not accept arbitrary URLs. */
  deliver: (recipientAgentId: string, message: ExternalAgentStatusMessage) => Promise<{ receiptId?: string } | void>;
  now?: () => Date;
  appendAudit?: typeof appendDurableAuditEvent;
}
export interface ExternalCommunicationRequest {
  actorId: string;
  projectId: string;
  recipientAgentId: string;
  cycleId: string;
  counts: { verified: number; held: number; failed: number };
}
export type ExternalCommunicationResult =
  | { status: 'SENT'; messageId: string; receiptId?: string }
  | { status: 'HOLD'; reason: string; messageId?: string };

/**
 * Send a fixed cycle-status message to one pre-approved external agent.
 * This function cannot register, import, invite, or grant platform access to
 * remote agents. It has no inbound-message handler and accepts no destination
 * URL or arbitrary message body.
 */
export async function sendCycleStatusToExternalAgent(
  request: ExternalCommunicationRequest,
  options: ExternalCommunicationOptions,
): Promise<ExternalCommunicationResult> {
  const now = options.now ?? (() => new Date());
  const audit = options.appendAudit ?? appendDurableAuditEvent;
  const hold = (reason: string, messageId?: string): ExternalCommunicationResult =>
    ({ status: 'HOLD', reason, ...(messageId ? { messageId } : {}) });

  if (!request || typeof request !== 'object' ||
      request.actorId !== 'saq-communication-agent' || !isSafeId(request.projectId) ||
      !isSafeId(request.recipientAgentId) || !isCycleId(request.cycleId) ||
      !validCount(request.counts?.verified) || !validCount(request.counts?.held) ||
      !validCount(request.counts?.failed) || !options.auditFilePath?.trim() ||
      !(options.approvedRecipientIds instanceof Set) ||
      typeof options.authorize !== 'function' || typeof options.deliver !== 'function') {
    return hold('External communication held: request or trusted adapter configuration is invalid.');
  }
  if (!options.approvedRecipientIds.has(request.recipientAgentId)) {
    return hold('External communication held: recipient is not on the operator-approved allowlist.');
  }

  let authorization: ExternalAgentAuthorization;
  try {
    authorization = await options.authorize({
      actorId: request.actorId, projectId: request.projectId,
      recipientAgentId: request.recipientAgentId,
    });
  } catch {
    return hold('External communication held: trusted authorization check failed.');
  }
  if (!authorization?.authenticated || !authorization.projectAuthorized) {
    await auditDenial(audit, options.auditFilePath, request, now);
    return hold('External communication held: actor or project authorization failed.');
  }
  const decision = evaluateSaqlainAction({
    actionType: 'send_agent_communication',
    actorAuthenticated: authorization.authenticated,
    projectId: request.projectId,
    approvalGranted: authorization.approved,
  });
  if (decision.decision !== 'allow') {
    await auditDenial(audit, options.auditFilePath, request, now, decision.reason);
    return hold('External communication held by Saqlain policy.');
  }

  const messageId = randomUUID();
  const status = request.counts.held + request.counts.failed > 0
    ? 'ATTENTION_REQUIRED' as const
    : 'ALL_CHECKS_VERIFIED' as const;
  const message: ExternalAgentStatusMessage = Object.freeze({
    messageId, type: 'SAQLAIN_CYCLE_STATUS', senderAgentId: 'saq-communication-agent',
    recipientAgentId: request.recipientAgentId, cycleId: request.cycleId, status,
    counts: Object.freeze({ ...request.counts }), sentAt: now().toISOString(),
  });

  // Fail closed: no network delivery until the intent is durably audited.
  try {
    await audit(options.auditFilePath, {
      eventType: 'SAQLAIN_EXTERNAL_AGENT_MESSAGE_INTENT', actorId: request.actorId,
      outcome: 'ALLOW', resource: 'external-agent:' + request.recipientAgentId,
      taskId: request.cycleId, occurredAt: now().toISOString(),
      details: { messageId, messageType: message.type, counts: message.counts, deliveryAttempted: false },
    });
  } catch {
    return hold('External communication held: pre-send audit failed; no message was sent.', messageId);
  }

  let receiptId: string | undefined;
  try {
    const receipt = await options.deliver(request.recipientAgentId, message);
    receiptId = typeof receipt?.receiptId === 'string' ? receipt.receiptId.slice(0, 200) : undefined;
  } catch {
    try {
      await audit(options.auditFilePath, {
        eventType: 'SAQLAIN_EXTERNAL_AGENT_MESSAGE_RESULT', actorId: request.actorId,
        outcome: 'HOLD', resource: 'external-agent:' + request.recipientAgentId,
        taskId: request.cycleId, occurredAt: now().toISOString(),
        details: { messageId, delivery: 'failed_or_unknown', deliveryAttempted: true },
      });
    } catch { /* Preserve HOLD; operators must reconcile before retrying. */ }
    return hold('External delivery failed or has an unknown outcome; reconcile before retrying.', messageId);
  }

  try {
    await audit(options.auditFilePath, {
      eventType: 'SAQLAIN_EXTERNAL_AGENT_MESSAGE_RESULT', actorId: request.actorId,
      outcome: 'INFO', resource: 'external-agent:' + request.recipientAgentId,
      taskId: request.cycleId, occurredAt: now().toISOString(),
      details: { messageId, receiptId, delivery: 'accepted_by_transport', deliveryAttempted: true },
    });
  } catch {
    return hold('Transport accepted the message but result audit failed; reconcile before retrying.', messageId);
  }
  return { status: 'SENT', messageId, ...(receiptId ? { receiptId } : {}) };
}

async function auditDenial(
  audit: typeof appendDurableAuditEvent,
  auditFilePath: string,
  request: ExternalCommunicationRequest,
  now: () => Date,
  reason = 'actor_or_project_authorization_failed',
): Promise<void> {
  try {
    await audit(auditFilePath, {
      eventType: 'SAQLAIN_EXTERNAL_AGENT_MESSAGE_DENIED', actorId: request.actorId,
      outcome: 'DENY', resource: 'external-agent:' + request.recipientAgentId,
      taskId: request.cycleId, occurredAt: now().toISOString(),
      details: { reason, deliveryAttempted: false },
    });
  } catch { /* No message is sent on denial; denial audit errors never grant access. */ }
}
function isSafeId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(value);
}
function isCycleId(value: unknown): value is string {
  return typeof value === 'string' && /^saqlain-cycle-[0-9a-f-]{36}$/i.test(value);
}
function validCount(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0;
}
