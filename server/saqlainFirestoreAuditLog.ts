import { createHash, randomUUID } from 'node:crypto';
import type { AuditEventInput, AuditRecord } from './saqlainAuditLog.ts';
import { SaqlainFirestoreRestClient, encodeFirestoreValue, type FirestoreWrite } from './saqlainFirestoreRest.ts';

const GENESIS_HASH = '0'.repeat(64);
type FirestoreRecord = Record<string, unknown>;

export interface SaqlainFirestoreAuditOptions {
  client?: SaqlainFirestoreRestClient;
  collection?: string;
  headDocumentId?: string;
  maxConflictRetries?: number;
  now?: () => Date;
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
    return '{' + entries.map(([key, item]) => JSON.stringify(key) + ':' + canonicalJson(item)).join(',') + '}';
  }
  const encoded = JSON.stringify(value);
  if (encoded === undefined) throw new Error('Unsupported value in canonical audit JSON.');
  return encoded;
}

function hashRecord(record: Omit<AuditRecord, 'recordHash'>): string {
  return createHash('sha256').update(canonicalJson(record)).digest('hex');
}

function fields(value: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, encodeFirestoreValue(item)]));
}

function auditRecordFromDocument(document: FirestoreRecord): AuditRecord {
  const { _name: _ignoredName, _updateTime: _ignoredUpdateTime, recordHash, ...payload } = document;
  const record = payload as unknown as AuditRecord;
  if (record.schemaVersion !== 1 || !Number.isInteger(record.sequence) || record.sequence < 1 ||
      typeof record.eventId !== 'string' || typeof record.occurredAt !== 'string' ||
      typeof record.eventType !== 'string' || typeof record.actorId !== 'string' ||
      !['ALLOW', 'DENY', 'HOLD', 'INFO'].includes(record.outcome) ||
      typeof record.previousHash !== 'string' || !/^[a-f0-9]{64}$/.test(record.previousHash) ||
      typeof recordHash !== 'string' || !/^[a-f0-9]{64}$/.test(recordHash) ||
      hashRecord(payload as unknown as Omit<AuditRecord, 'recordHash'>) !== recordHash) {
    throw new Error('Firestore audit event failed schema or integrity validation.');
  }
  return record;
}

/**
 * Append-only audit writer using a Firestore compare-and-swap chain head.
 * Each event and the updated head are committed atomically. This protects
 * concurrent writers; it does not make the project administrator-proof.
 */
export class SaqlainFirestoreAuditLog {
  private readonly client: SaqlainFirestoreRestClient;
  private readonly collection: string;
  private readonly headDocumentId: string;
  private readonly maxRetries: number;
  private readonly now: () => Date;

  constructor(options: SaqlainFirestoreAuditOptions = {}) {
    this.client = options.client ?? new SaqlainFirestoreRestClient();
    this.collection = options.collection ?? process.env.SAQLAIN_FIRESTORE_AUDIT_COLLECTION?.trim() ?? 'saqlainAuditEvents';
    this.headDocumentId = options.headDocumentId ?? 'chain-head';
    this.maxRetries = options.maxConflictRetries ?? 5;
    this.now = options.now ?? (() => new Date());
    if (!/^[A-Za-z][A-Za-z0-9_-]{0,62}$/.test(this.collection)) throw new Error('Firestore audit collection name is invalid.');
    if (!/^[A-Za-z][A-Za-z0-9_-]{0,62}$/.test(this.headDocumentId)) throw new Error('Firestore audit head document ID is invalid.');
    if (!Number.isInteger(this.maxRetries) || this.maxRetries < 1 || this.maxRetries > 20) throw new Error('Firestore audit retry count must be between 1 and 20.');
  }

  async append(input: AuditEventInput): Promise<AuditRecord> {
    if (!input.eventType?.trim()) throw new Error('eventType is required.');
    if (!input.actorId?.trim()) throw new Error('actorId is required.');
    if (!['ALLOW', 'DENY', 'HOLD', 'INFO'].includes(input.outcome)) throw new Error('Invalid audit outcome.');

    for (let attempt = 0; attempt < this.maxRetries; attempt += 1) {
      const head = await this.client.getDocument(this.collection, this.headDocumentId);
      const sequence = head ? Number(head.sequence) : 0;
      const previousHash = head ? head.recordHash : GENESIS_HASH;
      if (!Number.isSafeInteger(sequence) || sequence < 0 || typeof previousHash !== 'string' ||
          !/^[a-f0-9]{64}$/.test(previousHash)) {
        throw new Error('Firestore audit chain head is invalid; refusing to append.');
      }

      const payload: Omit<AuditRecord, 'recordHash'> = {
        schemaVersion: 1,
        sequence: sequence + 1,
        eventId: randomUUID(),
        occurredAt: input.occurredAt ?? this.now().toISOString(),
        eventType: input.eventType,
        actorId: input.actorId,
        outcome: input.outcome,
        ...(input.resource ? { resource: input.resource } : {}),
        ...(input.taskId ? { taskId: input.taskId } : {}),
        ...(input.details ? { details: input.details } : {}),
        previousHash,
      };
      const record: AuditRecord = { ...payload, recordHash: hashRecord(payload) };
      const eventId = String(record.sequence).padStart(12, '0') + '-' + record.eventId;
      const eventName = this.client.documentName(this.collection, eventId);
      const headName = this.client.documentName(this.collection, this.headDocumentId);
      const writes: FirestoreWrite[] = [
        { update: { name: eventName, fields: fields(record as unknown as Record<string, unknown>) }, currentDocument: { exists: false } },
        {
          update: { name: headName, fields: fields({ sequence: record.sequence, recordHash: record.recordHash }) },
          currentDocument: head?._updateTime
            ? { updateTime: String(head._updateTime) }
            : { exists: false },
        },
      ];
      try {
        await this.client.commit(writes);
        return record;
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        if (attempt + 1 >= this.maxRetries || !/HTTP (400|409|412)\b/.test(message)) throw error;
      }
    }
    throw new Error('Firestore audit append retries exhausted.');
  }

  async readVerified(): Promise<readonly AuditRecord[]> {
    const documents = await this.client.listDocuments(this.collection);
    const records = documents
      .filter(document => !String(document._name ?? '').endsWith('/' + this.headDocumentId) &&\n        (typeof document.sequence === 'number' || typeof document.sequence === 'string'))
      .map(auditRecordFromDocument)
      .sort((a, b) => a.sequence - b.sequence);
    let previousHash = GENESIS_HASH;
    for (let index = 0; index < records.length; index += 1) {
      const record = records[index];
      if (record.sequence !== index + 1 || record.previousHash !== previousHash) {
        throw new Error('Firestore audit chain sequence or linkage verification failed at sequence ' + (index + 1) + '.');
      }
      previousHash = record.recordHash;
    }
    const head = await this.client.getDocument(this.collection, this.headDocumentId);
    if (records.length === 0 && head) throw new Error('Firestore audit head exists without audit events.');
    if (records.length > 0 && (!head || Number(head.sequence) !== records.length || head.recordHash !== previousHash)) {
      throw new Error('Firestore audit chain head does not match the verified event history.');
    }
    return Object.freeze(records);
  }
}
