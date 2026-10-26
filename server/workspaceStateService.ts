import { createHash, randomUUID } from 'node:crypto';
import { encodeFirestoreValue, SaqlainFirestoreRestClient, type FirestoreWrite } from './saqlainFirestoreRest.ts';

export const WORKSPACE_STATE_DOMAINS = ['projects', 'boqItems', 'professionals', 'enquiries', 'preferences'] as const;
export type WorkspaceStateDomain = typeof WORKSPACE_STATE_DOMAINS[number];
export const MAX_WORKSPACE_STATE_BYTES = 700_000;
const COLLECTION = 'gouseWorkspaceState';

export interface WorkspaceStateDocument {
  ownerUid: string;
  domain: WorkspaceStateDomain;
  data: unknown;
  version: string;
  updatedAt: string;
  _updateTime?: string;
}

export interface WorkspaceStateClient {
  getDocument(collection: string, documentId: string): Promise<Record<string, unknown> | null>;
  documentName(collection: string, documentId: string): string;
  commit(writes: readonly FirestoreWrite[]): Promise<void>;
}

export class WorkspaceStateError extends Error {
  constructor(public readonly code: 'not_found' | 'conflict' | 'invalid' | 'unavailable', message: string) {
    super(message);
    this.name = 'WorkspaceStateError';
  }
}

function stateDocumentId(uid: string, domain: WorkspaceStateDomain): string {
  return createHash('sha256').update(uid).digest('hex').slice(0, 40) + '_' + domain;
}

export function isWorkspaceStateDomain(value: unknown): value is WorkspaceStateDomain {
  return typeof value === 'string' && (WORKSPACE_STATE_DOMAINS as readonly string[]).includes(value);
}

export class WorkspaceStateService {
  constructor(
    private readonly clientFactory: () => WorkspaceStateClient = () => new SaqlainFirestoreRestClient(),
    private readonly now: () => Date = () => new Date(),
    private readonly makeVersion: () => string = () => randomUUID(),
  ) {}

  async read(uid: string, domain: WorkspaceStateDomain): Promise<{ data: unknown; version: string } | null> {
    if (!uid) throw new WorkspaceStateError('invalid', 'Verified user identity is required.');
    try {
      const client = this.clientFactory();
      const record = await client.getDocument(COLLECTION, stateDocumentId(uid, domain));
      if (!record) return null;
      if (record.ownerUid !== uid || record.domain !== domain ||
          typeof record.version !== 'string' || !Object.prototype.hasOwnProperty.call(record, 'data')) {
        throw new WorkspaceStateError('unavailable', 'Workspace state failed integrity validation.');
      }
      return { data: record.data, version: record.version };
    } catch (error) {
      if (error instanceof WorkspaceStateError) throw error;
      throw new WorkspaceStateError('unavailable', 'Workspace storage is unavailable.');
    }
  }

  async write(
    uid: string,
    domain: WorkspaceStateDomain,
    data: unknown,
    expectedVersion: string | null,
  ): Promise<{ version: string }> {
    if (!uid) throw new WorkspaceStateError('invalid', 'Verified user identity is required.');
    if (expectedVersion !== null && (typeof expectedVersion !== 'string' || expectedVersion.length > 128)) {
      throw new WorkspaceStateError('invalid', 'A valid expectedVersion is required.');
    }
    let serialized: string;
    try { serialized = JSON.stringify(data); }
    catch { throw new WorkspaceStateError('invalid', 'Workspace data must be valid JSON.'); }
    if (serialized === undefined || Buffer.byteLength(serialized, 'utf8') > MAX_WORKSPACE_STATE_BYTES) {
      throw new WorkspaceStateError('invalid', 'Workspace data exceeds the per-domain size limit.');
    }
    try {
      const client = this.clientFactory();
      const id = stateDocumentId(uid, domain);
      const existing = await client.getDocument(COLLECTION, id);
      if (!existing && expectedVersion !== null) {
        throw new WorkspaceStateError('conflict', 'Workspace state was removed or has not been initialized.');
      }
      if (existing && (existing.ownerUid !== uid || existing.domain !== domain)) {
        throw new WorkspaceStateError('unavailable', 'Workspace state failed ownership validation.');
      }
      if (existing && (typeof existing.version !== 'string' || existing.version !== expectedVersion)) {
        throw new WorkspaceStateError('conflict', 'Workspace state changed in another session. Reload before saving.');
      }
      if (!existing && expectedVersion !== null) {
        throw new WorkspaceStateError('conflict', 'Workspace state changed in another session. Reload before saving.');
      }

      const version = this.makeVersion();
      const record = {
        ownerUid: uid,
        domain,
        data,
        version,
        updatedAt: this.now().toISOString(),
      };
      const write: FirestoreWrite = {
        update: {
          name: client.documentName(COLLECTION, id),
          fields: Object.fromEntries(Object.entries(record).map(([key, value]) => [key, encodeFirestoreValue(value)])),
        },
        currentDocument: existing
          ? { updateTime: String(existing._updateTime ?? '') }
          : { exists: false },
      };
      if (existing && !existing._updateTime) {
        throw new WorkspaceStateError('unavailable', 'Workspace state is missing concurrency metadata.');
      }
      await client.commit([write]);
      return { version };
    } catch (error) {
      if (error instanceof WorkspaceStateError) throw error;
      if (error instanceof Error && /HTTP (400|409|412)/.test(error.message)) {
        throw new WorkspaceStateError('conflict', 'Workspace state changed in another session. Reload before saving.');
      }
      throw new WorkspaceStateError('unavailable', 'Workspace storage is unavailable.');
    }
  }
}
