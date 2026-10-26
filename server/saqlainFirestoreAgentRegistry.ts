import { createHash, randomBytes, randomUUID } from 'node:crypto';
import {
  SaqlainFirestoreRestClient,
  encodeFirestoreValue,
  type FirestoreWrite,
} from './saqlainFirestoreRest.ts';

export type DurableAgentStatus = 'ACTIVE' | 'SUSPENDED' | 'RETIRED';
export interface DurableAgentRecord {
  agentKey: string;
  currentBinaryId: string;
  status: DurableAgentStatus;
  ownerUid: string;
  ownerApproved: boolean;
  createdAt: string;
  updatedAt: string;
  suspendedReason: string | null;
  completedTaskCount: number;
}
export interface DurableAgentAuditEvent {
  eventId: string;
  eventType: 'REGISTERED' | 'SUSPENDED' | 'REACTIVATED' | 'RETIRED' | 'ID_ROTATED';
  actorUid: string;
  agentKey: string;
  previousStatus: DurableAgentStatus | null;
  currentStatus: DurableAgentStatus;
  reason: string;
  occurredAt: string;
  previousBinaryIdHash?: string;
  currentBinaryIdHash?: string;
}
export interface FirestoreAgentRegistryOptions {
  client?: SaqlainFirestoreRestClient;
  collection?: string;
  issuedIdsCollection?: string;
  auditCollection?: string;
  retries?: number;
  now?: () => Date;
}

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const SAFE_BINARY_ID = /^[01]{128}$/;
const STATUSES = new Set<DurableAgentStatus>(['ACTIVE', 'SUSPENDED', 'RETIRED']);

function safeText(value: unknown, label: string, max = 2000): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) {
    throw new Error(label + ' is required and must be at most ' + max + ' characters.');
  }
  return value.trim();
}
function validateRecord(value: unknown): value is DurableAgentRecord {
  if (!value || typeof value !== 'object') return false;
  const r = value as Record<string, unknown>;
  return typeof r.agentKey === 'string' && SAFE_ID.test(r.agentKey) &&
    typeof r.currentBinaryId === 'string' && SAFE_BINARY_ID.test(r.currentBinaryId) &&
    typeof r.status === 'string' && STATUSES.has(r.status as DurableAgentStatus) &&
    typeof r.ownerUid === 'string' && r.ownerUid.length > 0 &&
    typeof r.ownerApproved === 'boolean' &&
    typeof r.createdAt === 'string' && Number.isFinite(Date.parse(r.createdAt)) &&
    typeof r.updatedAt === 'string' && Number.isFinite(Date.parse(r.updatedAt)) &&
    (typeof r.suspendedReason === 'string' || r.suspendedReason === null) &&
    Number.isSafeInteger(r.completedTaskCount) && Number(r.completedTaskCount) >= 0 &&
    (r.status !== 'RETIRED' || r.ownerApproved === false);
}
function encodeFields(record: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, encodeFirestoreValue(value)]));
}
function conflict(error: unknown): boolean {
  return error instanceof Error && /HTTP (409|412)/.test(error.message);
}
function safeCollection(value: string, label: string): string {
  if (!/^[A-Za-z][A-Za-z0-9_-]{0,62}$/.test(value)) throw new Error(label + ' collection name is invalid.');
  return value;
}
function generateBinaryId(): string {
  return [...randomBytes(16)].map(byte => byte.toString(2).padStart(8, '0')).join('');
}

/**
 * Shared Firestore-backed agent registry. Registry mutations, permanent ID
 * ledger entries, and append-only audit event documents commit atomically.
 * Firestore preconditions reject concurrent create/update races across instances.
 */
export class SaqlainFirestoreAgentRegistry {
  private readonly client: SaqlainFirestoreRestClient;
  private readonly collection: string;
  private readonly issuedIdsCollection: string;
  private readonly auditCollection: string;
  private readonly retries: number;
  private readonly now: () => Date;

  constructor(options: FirestoreAgentRegistryOptions = {}) {
    this.client = options.client ?? new SaqlainFirestoreRestClient();
    this.collection = safeCollection(options.collection ?? (process.env.SAQLAIN_AGENT_REGISTRY_COLLECTION?.trim() || 'saqlainAgents'), 'Agent registry');
    this.issuedIdsCollection = safeCollection(options.issuedIdsCollection ?? (process.env.SAQLAIN_AGENT_ISSUED_IDS_COLLECTION?.trim() || 'saqlainAgentIssuedIds'), 'Agent ID ledger');
    this.auditCollection = safeCollection(options.auditCollection ?? (process.env.SAQLAIN_AGENT_AUDIT_COLLECTION?.trim() || 'saqlainAgentAudit'), 'Agent audit');
    this.retries = options.retries ?? 5;
    this.now = options.now ?? (() => new Date());
    if (!Number.isInteger(this.retries) || this.retries < 1 || this.retries > 20) throw new Error('Agent registry retry count is invalid.');
    if (new Set([this.collection, this.issuedIdsCollection, this.auditCollection]).size !== 3) {
      throw new Error('Agent registry, ID ledger, and audit collections must be distinct.');
    }
  }

  async list(): Promise<DurableAgentRecord[]> {
    const docs = await this.client.listDocuments(this.collection);
    return docs.filter(doc => typeof doc.agentKey === 'string').map(doc => {
      const { _name: _name, _updateTime: _updateTime, ...record } = doc;
      if (!validateRecord(record)) throw new Error('Stored agent record failed schema validation.');
      return record;
    }).sort((a, b) => a.agentKey.localeCompare(b.agentKey));
  }

  async get(agentKey: string): Promise<DurableAgentRecord | null> {
    const key = safeText(agentKey, 'agentKey', 128);
    if (!SAFE_ID.test(key)) throw new Error('agentKey format is invalid.');
    const doc = await this.client.getDocument(this.collection, key);
    if (!doc) return null;
    const { _name: _name, _updateTime: _updateTime, ...record } = doc;
    if (!validateRecord(record)) throw new Error('Stored agent record failed schema validation.');
    return record;
  }

  async register(input: { agentKey: string; actorUid: string; reason: string }): Promise<DurableAgentRecord> {
    const agentKey = safeText(input.agentKey, 'agentKey', 128);
    const actorUid = safeText(input.actorUid, 'actorUid', 256);
    const reason = safeText(input.reason, 'reason');
    if (!SAFE_ID.test(agentKey)) throw new Error('agentKey format is invalid.');

    for (let attempt = 0; attempt < this.retries; attempt += 1) {
      const existing = await this.client.getDocument(this.collection, agentKey);
      if (existing) throw new Error('Agent key is already registered.');
      const currentBinaryId = generateBinaryId();
      const idLedgerId = 'issued-' + createHash('sha256').update(currentBinaryId).digest('hex');
      if (await this.client.getDocument(this.issuedIdsCollection, idLedgerId)) continue;
      const timestamp = this.now().toISOString();
      const record: DurableAgentRecord = {
        agentKey, currentBinaryId, status: 'ACTIVE', ownerUid: actorUid,
        ownerApproved: true, createdAt: timestamp, updatedAt: timestamp,
        suspendedReason: null, completedTaskCount: 0,
      };
      const event = this.makeEvent('REGISTERED', actorUid, agentKey, null, 'ACTIVE', reason, timestamp);
      try {
        await this.client.commit([
          { update: { name: this.client.documentName(this.collection, agentKey), fields: encodeFields(record) }, currentDocument: { exists: false } },
          { update: { name: this.client.documentName(this.issuedIdsCollection, idLedgerId), fields: encodeFields({ binaryIdHash: idLedgerId.slice(7), agentKey, issuedAt: timestamp, status: 'CURRENT' }) }, currentDocument: { exists: false } },
          { update: { name: this.client.documentName(this.auditCollection, event.eventId), fields: encodeFields(event) }, currentDocument: { exists: false } },
        ]);
        return record;
      } catch (error) {
        if (conflict(error)) {
          const afterConflict = await this.client.getDocument(this.collection, agentKey);
          if (afterConflict) throw new Error('Agent key is already registered.');
          continue;
        }
        throw error;
      }
    }
    throw new Error('Agent registration could not commit after repeated conflicts.');
  }

  /**
   * Internal-only credential rotation hook. The verified-completion flag must
   * originate from the trusted queue/verifier service, never an HTTP request.
   * The previous ID is permanently retired in the ledger in the same atomic
   * Firestore commit as the new ID, agent record, and audit event.
   */
  async rotateAfterVerifiedTask(input: {
    agentKey: string;
    actorUid: string;
    taskId: string;
    presentedBinaryId: string;
    taskCompletionVerified: boolean;
  }): Promise<DurableAgentRecord> {
    const agentKey = safeText(input.agentKey, 'agentKey', 128);
    const actorUid = safeText(input.actorUid, 'actorUid', 256);
    const taskId = safeText(input.taskId, 'taskId', 256);
    if (!SAFE_ID.test(agentKey)) throw new Error('agentKey format is invalid.');
    if (input.taskCompletionVerified !== true) throw new Error('Agent ID rotation requires verified task completion.');
    if (typeof input.presentedBinaryId !== 'string' || !SAFE_BINARY_ID.test(input.presentedBinaryId)) {
      throw new Error('Presented binary Agent ID is invalid.');
    }

    for (let attempt = 0; attempt < this.retries; attempt += 1) {
      const currentDoc = await this.client.getDocument(this.collection, agentKey);
      if (!currentDoc) throw new Error('Agent not found.');
      const { _name: _name, _updateTime: updateTime, ...currentValue } = currentDoc;
      if (!validateRecord(currentValue) || typeof updateTime !== 'string' || !updateTime) {
        throw new Error('Stored agent record or concurrency token is invalid.');
      }
      const current = currentValue as unknown as DurableAgentRecord;
      if (current.status !== 'ACTIVE' || !current.ownerApproved) {
        throw new Error('Agent is not active and owner-approved.');
      }
      if (current.currentBinaryId !== input.presentedBinaryId) {
        throw new Error('Presented binary Agent ID does not match the current ID.');
      }

      const previousLedgerId = 'issued-' + createHash('sha256').update(current.currentBinaryId).digest('hex');
      const previousLedger = await this.client.getDocument(this.issuedIdsCollection, previousLedgerId);
      if (!previousLedger || typeof previousLedger._updateTime !== 'string') {
        throw new Error('Agent ID ledger is missing; rotation is blocked.');
      }
      const nextBinaryId = generateBinaryId();
      const nextLedgerId = 'issued-' + createHash('sha256').update(nextBinaryId).digest('hex');
      if (await this.client.getDocument(this.issuedIdsCollection, nextLedgerId)) continue;

      const timestamp = this.now().toISOString();
      const updated: DurableAgentRecord = {
        ...current, currentBinaryId: nextBinaryId, updatedAt: timestamp,
        completedTaskCount: current.completedTaskCount + 1,
      };
      const event = this.makeEvent(
        'ID_ROTATED', actorUid, agentKey, current.status, current.status,
        'Verified task completion; previous ID permanently retired.', timestamp,
      );
      event.previousBinaryIdHash = createHash('sha256').update(current.currentBinaryId).digest('hex');
      event.currentBinaryIdHash = createHash('sha256').update(nextBinaryId).digest('hex');
      try {
        await this.client.commit([
          { update: { name: this.client.documentName(this.collection, agentKey), fields: encodeFields(updated) }, currentDocument: { updateTime } },
          { update: { name: this.client.documentName(this.issuedIdsCollection, previousLedgerId), fields: encodeFields({
            binaryIdHash: previousLedgerId.slice(7), agentKey, issuedAt: current.createdAt,
            retiredAt: timestamp, status: 'RETIRED',
          }) }, currentDocument: { updateTime: String(previousLedger._updateTime) } },
          { update: { name: this.client.documentName(this.issuedIdsCollection, nextLedgerId), fields: encodeFields({
            binaryIdHash: nextLedgerId.slice(7), agentKey, issuedAt: timestamp, status: 'CURRENT',
          }) }, currentDocument: { exists: false } },
          { update: { name: this.client.documentName(this.auditCollection, event.eventId), fields: encodeFields(event) }, currentDocument: { exists: false } },
        ]);
        return updated;
      } catch (error) {
        if (conflict(error)) continue;
        throw error;
      }
    }
    throw new Error('Agent ID rotation could not commit after repeated conflicts.');
  }

  async suspend(input: { agentKey: string; actorUid: string; reason: string }): Promise<DurableAgentRecord> {
    return this.transition({ ...input, target: 'SUSPENDED' });
  }
  async reactivate(input: { agentKey: string; actorUid: string; reason: string }): Promise<DurableAgentRecord> {
    return this.transition({ ...input, target: 'ACTIVE' });
  }
  async retire(input: { agentKey: string; actorUid: string; reason: string }): Promise<DurableAgentRecord> {
    return this.transition({ ...input, target: 'RETIRED' });
  }

  private async transition(input: {
    agentKey: string; actorUid: string; reason: string; target: DurableAgentStatus;
  }): Promise<DurableAgentRecord> {
    const agentKey = safeText(input.agentKey, 'agentKey', 128);
    const actorUid = safeText(input.actorUid, 'actorUid', 256);
    const reason = safeText(input.reason, 'reason');
    if (!SAFE_ID.test(agentKey)) throw new Error('agentKey format is invalid.');

    for (let attempt = 0; attempt < this.retries; attempt += 1) {
      const currentDoc = await this.client.getDocument(this.collection, agentKey);
      if (!currentDoc) throw new Error('Agent not found.');
      const { _name: _name, _updateTime: updateTime, ...currentValue } = currentDoc;
      if (!validateRecord(currentValue) || typeof updateTime !== 'string' || !updateTime) {
        throw new Error('Stored agent record or concurrency token is invalid.');
      }
      const current = currentValue as unknown as DurableAgentRecord;
      if (current.status === 'RETIRED') throw new Error('Retired agents cannot transition.');
      if (input.target === 'SUSPENDED' && current.status !== 'ACTIVE') throw new Error('Only active agents can be suspended.');
      if (input.target === 'ACTIVE' && current.status !== 'SUSPENDED') throw new Error('Only suspended agents can be reactivated.');
      if (input.target === 'RETIRED' && current.status === 'RETIRED') throw new Error('Agent is already retired.');

      const timestamp = this.now().toISOString();
      const updated: DurableAgentRecord = {
        ...current, status: input.target, updatedAt: timestamp,
        ownerApproved: input.target === 'RETIRED' ? false : true,
        suspendedReason: input.target === 'SUSPENDED' ? reason : null,
      };
      const eventType = input.target === 'ACTIVE' ? 'REACTIVATED' : input.target === 'SUSPENDED' ? 'SUSPENDED' : 'RETIRED';
      const event = this.makeEvent(eventType, actorUid, agentKey, current.status, input.target, reason, timestamp);
      const writes: FirestoreWrite[] = [
        { update: { name: this.client.documentName(this.collection, agentKey), fields: encodeFields(updated) }, currentDocument: { updateTime } },
        { update: { name: this.client.documentName(this.auditCollection, event.eventId), fields: encodeFields(event) }, currentDocument: { exists: false } },
      ];
      if (input.target === 'RETIRED') {
        const idLedgerId = 'issued-' + createHash('sha256').update(current.currentBinaryId).digest('hex');
        const existingLedger = await this.client.getDocument(this.issuedIdsCollection, idLedgerId);
        if (!existingLedger) throw new Error('Agent ID ledger is missing; retirement is blocked.');
        writes.push({ update: { name: this.client.documentName(this.issuedIdsCollection, idLedgerId), fields: encodeFields({
          binaryIdHash: idLedgerId.slice(7), agentKey, issuedAt: current.createdAt, retiredAt: timestamp, status: 'RETIRED',
        }) }, currentDocument: { updateTime: String(existingLedger._updateTime ?? '') } });
      }
      try {
        await this.client.commit(writes);
        return updated;
      } catch (error) {
        if (conflict(error)) continue;
        throw error;
      }
    }
    throw new Error('Agent lifecycle transition could not commit after repeated conflicts.');
  }

  private makeEvent(
    eventType: DurableAgentAuditEvent['eventType'], actorUid: string, agentKey: string,
    previousStatus: DurableAgentStatus | null, currentStatus: DurableAgentStatus,
    reason: string, occurredAt: string,
  ): DurableAgentAuditEvent {
    return { eventId: randomUUID(), eventType, actorUid, agentKey, previousStatus, currentStatus, reason, occurredAt };
  }
}
