import { createHash, randomUUID } from 'node:crypto';
import {
  SaqlainFirestoreRestClient,
  encodeFirestoreValue,
  type FirestoreWrite,
} from './saqlainFirestoreRest.ts';
import {
  createGousiyaRecoveryWorkflow,
  transitionGousiyaRecoveryWorkflow,
  type GousiyaRecoveryWorkflow,
  type GousiyaWorkflowTransition,
} from './gousiyaRecoveryOrchestration.ts';

export interface GousiyaFirestoreWorkflowStoreOptions {
  client?: SaqlainFirestoreRestClient;
  workflowCollection?: string;
  eventCollection?: string;
  approvalCollection?: string;
  now?: () => Date;
}

function safeCollection(value: string, label: string): string {
  if (!/^[A-Za-z][A-Za-z0-9_-]{0,62}$/.test(value)) throw new Error(label + ' collection name is invalid.');
  return value;
}
function fields(value: object): Record<string, ReturnType<typeof encodeFirestoreValue>> {
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, encodeFirestoreValue(item)]));
}
function validWorkflow(value: unknown): value is GousiyaRecoveryWorkflow {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.workflowId === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(v.workflowId) &&
    typeof v.incidentId === 'string' && typeof v.stage === 'string' &&
    Number.isSafeInteger(v.version) && Number(v.version) >= 1 &&
    typeof v.createdAt === 'string' && Number.isFinite(Date.parse(v.createdAt)) &&
    typeof v.updatedAt === 'string' && Number.isFinite(Date.parse(v.updatedAt)) &&
    Array.isArray(v.events) && v.events.length > 0;
}
function conflict(error: unknown): boolean {
  return error instanceof Error && /HTTP (409|412)/.test(error.message);
}
function stripMetadata(value: Record<string, unknown>): Record<string, unknown> {
  const { _name: _name, _updateTime: _updateTime, ...record } = value;
  return record;
}
function requiredApprovalIds(input: GousiyaWorkflowTransition): string[] {
  if (input.to !== 'GRANT_ISSUED') return [];
  const ids = [input.ownerApprovalId, input.reviewerApprovalId];
  if (ids.some(id => typeof id !== 'string' || !id.trim() || id.length > 256)) {
    throw new Error('Verified owner and reviewer approval references are required.');
  }
  if (ids[0] === ids[1]) throw new Error('Owner and independent reviewer approvals must be distinct.');
  return ids as string[];
}
function approvalDocId(approvalId: string): string {
  return 'approval-' + createHash('sha256').update(approvalId).digest('hex');
}

/**
 * Durable Gousiya workflow store. Workflow snapshots, append-only transition
 * events, and one-time approval-consumption records commit atomically. The
 * caller must supply evidence/approval IDs obtained from trusted verifiers;
 * this store never treats arbitrary request booleans as verification.
 */
export class GousiyaFirestoreWorkflowStore {
  private readonly client: SaqlainFirestoreRestClient;
  private readonly workflows: string;
  private readonly events: string;
  private readonly approvals: string;
  private readonly now: () => Date;

  constructor(options: GousiyaFirestoreWorkflowStoreOptions = {}) {
    this.client = options.client ?? new SaqlainFirestoreRestClient();
    this.workflows = safeCollection(options.workflowCollection ?? (process.env.GOUSIYA_WORKFLOW_COLLECTION?.trim() || 'gousiyaRecoveryWorkflows'), 'Workflow');
    this.events = safeCollection(options.eventCollection ?? (process.env.GOUSIYA_WORKFLOW_EVENT_COLLECTION?.trim() || 'gousiyaRecoveryEvents'), 'Workflow event');
    this.approvals = safeCollection(options.approvalCollection ?? (process.env.GOUSIYA_APPROVAL_CONSUMPTION_COLLECTION?.trim() || 'gousiyaApprovalConsumption'), 'Approval');
    if (new Set([this.workflows, this.events, this.approvals]).size !== 3) {
      throw new Error('Workflow, event, and approval collections must be distinct.');
    }
    this.now = options.now ?? (() => new Date());
  }

  async create(input: {
    workflowId: string;
    incidentId: string;
    actorId: string;
    reason: string;
  }): Promise<GousiyaRecoveryWorkflow> {
    const workflow = createGousiyaRecoveryWorkflow({ ...input, now: this.now() });
    const initialEvent = workflow.events[0];
    const eventId = randomUUID();
    const eventRecord = { eventId, workflowId: workflow.workflowId, workflowVersion: workflow.version, ...initialEvent };
    await this.client.commit([
      { update: { name: this.client.documentName(this.workflows, workflow.workflowId), fields: fields(workflow) }, currentDocument: { exists: false } },
      { update: { name: this.client.documentName(this.events, eventId), fields: fields(eventRecord) }, currentDocument: { exists: false } },
    ]);
    return workflow;
  }

  async get(workflowId: string): Promise<GousiyaRecoveryWorkflow | null> {
    const id = typeof workflowId === 'string' ? workflowId.trim() : '';
    if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(id)) throw new Error('Workflow ID format is invalid.');
    const stored = await this.client.getDocument(this.workflows, id);
    if (!stored) return null;
    const workflow = stripMetadata(stored);
    if (!validWorkflow(workflow)) throw new Error('Stored Gousiya workflow failed schema validation.');
    return workflow as unknown as GousiyaRecoveryWorkflow;
  }

  async transition(workflowId: string, input: GousiyaWorkflowTransition): Promise<GousiyaRecoveryWorkflow> {
    const id = typeof workflowId === 'string' ? workflowId.trim() : '';
    if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(id)) throw new Error('Workflow ID format is invalid.');
    const stored = await this.client.getDocument(this.workflows, id);
    if (!stored) throw new Error('Workflow not found.');
    const { _name: _name, _updateTime: updateTime, ...record } = stored;
    if (!validWorkflow(record) || typeof updateTime !== 'string' || !updateTime) {
      throw new Error('Stored workflow or concurrency token is invalid.');
    }
    const current = record as unknown as GousiyaRecoveryWorkflow;
    // Validate transition before building any writes; stale expectedVersion fails closed.
    const next = transitionGousiyaRecoveryWorkflow(current, input, this.now());
    const nextEvent = next.events[next.events.length - 1];
    const eventId = randomUUID();
    const eventRecord = { eventId, workflowId: id, workflowVersion: next.version, ...nextEvent };
    const writes: FirestoreWrite[] = [
      { update: { name: this.client.documentName(this.workflows, id), fields: fields(next) }, currentDocument: { updateTime } },
      { update: { name: this.client.documentName(this.events, eventId), fields: fields(eventRecord) }, currentDocument: { exists: false } },
    ];
    for (const approvalId of requiredApprovalIds(input)) {
      const docId = approvalDocId(approvalId);
      writes.push({
        update: {
          name: this.client.documentName(this.approvals, docId),
          fields: fields({ approvalHash: docId.slice('approval-'.length), workflowId: id, workflowVersion: next.version, consumedAt: next.updatedAt }),
        },
        currentDocument: { exists: false },
      });
    }
    try {
      await this.client.commit(writes);
    } catch (error) {
      if (conflict(error)) {
        const currentAfterConflict = await this.get(id);
        if (currentAfterConflict && currentAfterConflict.version !== input.expectedVersion) {
          throw new Error('Workflow version conflict; reload before transitioning.');
        }
        if (input.to === 'GRANT_ISSUED') {
          throw new Error('Approval reference was already consumed or workflow changed; refusing duplicate grant.');
        }
      }
      throw error;
    }
    return next;
  }

  async listEvents(workflowId: string): Promise<Record<string, unknown>[]> {
    const workflow = await this.get(workflowId);
    if (!workflow) throw new Error('Workflow not found.');
    const docs = await this.client.listDocuments(this.events);
    return docs
      .filter(doc => doc.workflowId === workflow.workflowId)
      .map(stripMetadata)
      .sort((a, b) => Number(a.workflowVersion) - Number(b.workflowVersion));
  }
}
