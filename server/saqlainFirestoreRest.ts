import type { AuditEventInput } from './saqlainAuditLog.ts';

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: 'NULL_VALUE' }
  | { arrayValue: { values: FirestoreValue[] } }
  | { mapValue: { fields: Record<string, FirestoreValue> } };

export interface FirestoreDocument {
  name: string;
  fields?: Record<string, FirestoreValue>;
  createTime?: string;
  updateTime?: string;
}

export interface FirestoreWrite {
  update?: { name: string; fields: Record<string, FirestoreValue> };
  currentDocument?: { exists?: boolean; updateTime?: string };
  delete?: string;
}

export interface SaqlainFirestoreOptions {
  projectId?: string;
  databaseId?: string;
  fetchImpl?: typeof fetch;
  accessTokenProvider?: () => Promise<string>;
}

/** Encode only JSON data types; undefined, functions, and cyclic values are rejected. */
export function encodeFirestoreValue(value: unknown): FirestoreValue {
  if (value === null) return { nullValue: 'NULL_VALUE' };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Firestore values must contain finite numbers.');
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeFirestoreValue) } };
  if (typeof value === 'object' && value !== null) {
    const fields: Record<string, FirestoreValue> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (item === undefined) throw new Error('Undefined Firestore field: ' + key);
      fields[key] = encodeFirestoreValue(item);
    }
    return { mapValue: { fields } };
  }
  throw new Error('Unsupported Firestore value type.');
}

export function decodeFirestoreValue(value: FirestoreValue): unknown {
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) return (value.arrayValue.values ?? []).map(decodeFirestoreValue);
  if ('mapValue' in value) return Object.fromEntries(
    Object.entries(value.mapValue.fields ?? {}).map(([key, item]) => [key, decodeFirestoreValue(item)]),
  );
  throw new Error('Unknown Firestore value encoding.');
}

export function decodeFirestoreFields(fields: Record<string, FirestoreValue> = {}): Record<string, unknown> {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeFirestoreValue(value)]));
}

async function cloudRunAccessToken(fetchImpl: typeof fetch): Promise<string> {
  const response = await fetchImpl(
    'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
    { headers: { 'Metadata-Flavor': 'Google' } },
  );
  if (!response.ok) throw new Error('Cloud Run service-account token request failed.');
  const body = await response.json() as { access_token?: unknown };
  if (typeof body.access_token !== 'string' || !body.access_token) {
    throw new Error('Cloud Run metadata response did not contain an access token.');
  }
  return body.access_token;
}

/**
 * Minimal Firestore REST client for Saqlain server-side state.
 * Uses Cloud Run's attached service identity by default; no service-account keys.
 * Callers must use Firestore transactions/preconditions for concurrent state changes.
 */
export class SaqlainFirestoreRestClient {
  private readonly projectId: string;
  private readonly databaseId: string;
  private readonly fetchImpl: typeof fetch;
  private readonly tokenProvider: () => Promise<string>;

  constructor(options: SaqlainFirestoreOptions = {}) {
    this.projectId = options.projectId?.trim() || process.env.GOOGLE_CLOUD_PROJECT?.trim() ||
      process.env.FIREBASE_PROJECT_ID?.trim() || '';
    this.databaseId = options.databaseId?.trim() || '(default)';
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.tokenProvider = options.accessTokenProvider ?? (() => cloudRunAccessToken(this.fetchImpl));
    if (!this.projectId) throw new Error('GOOGLE_CLOUD_PROJECT or FIREBASE_PROJECT_ID is required for Firestore.');
    if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(this.projectId)) {
      throw new Error('Firestore project ID format is invalid.');
    }
    if (!/^[A-Za-z0-9_-]{1,63}$/.test(this.databaseId) && this.databaseId !== '(default)') {
      throw new Error('Firestore database ID format is invalid.');
    }
  }

  documentName(collection: string, documentId: string): string {\n    return this.documentsUrl('/' + encodeURIComponent(collection) + '/' + encodeURIComponent(documentId));\n  }\n\n  private documentsUrl(path = ''): string {
    return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(this.projectId)}/databases/${encodeURIComponent(this.databaseId)}/documents${path}`;
  }

  private async request(url: string, init: RequestInit = {}): Promise<Response> {
    const token = await this.tokenProvider();
    const headers = new Headers(init.headers);
    headers.set('Authorization', 'Bearer ' + token);
    if (init.body !== undefined) headers.set('Content-Type', 'application/json');
    const response = await this.fetchImpl(url, { ...init, headers });
    if (!response.ok) {
      // Do not include response bodies: cloud error bodies may include sensitive configuration.
      throw new Error('Firestore request failed with HTTP ' + response.status + '.');
    }
    return response;
  }

  async getDocument(collection: string, documentId: string): Promise<Record<string, unknown> | null> {
    const url = this.documentsUrl('/' + encodeURIComponent(collection) + '/' + encodeURIComponent(documentId));
    const response = await this.fetchImpl(url, { headers: { Authorization: 'Bearer ' + await this.tokenProvider() } });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('Firestore document read failed with HTTP ' + response.status + '.');
    const document = await response.json() as FirestoreDocument;
    return { ...decodeFirestoreFields(document.fields), _name: document.name, _updateTime: document.updateTime };
  }

  async listDocuments(collection: string, pageSize = 500): Promise<Record<string, unknown>[]> {
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 1000) throw new Error('Firestore page size must be between 1 and 1000.');
    const result: Record<string, unknown>[] = [];
    let pageToken = '';
    do {
      const params = new URLSearchParams({ pageSize: String(pageSize) });
      if (pageToken) params.set('pageToken', pageToken);
      const response = await this.request(this.documentsUrl('/' + encodeURIComponent(collection) + '?' + params));
      const body = await response.json() as { documents?: FirestoreDocument[]; nextPageToken?: string };
      for (const document of body.documents ?? []) {
        result.push({ ...decodeFirestoreFields(document.fields), _name: document.name, _updateTime: document.updateTime });
      }
      pageToken = body.nextPageToken ?? '';
    } while (pageToken);
    return result;
  }

  async commit(writes: readonly FirestoreWrite[]): Promise<void> {
    if (writes.length === 0 || writes.length > 500) throw new Error('Firestore commit must contain between 1 and 500 writes.');
    await this.request(this.documentsUrl(':commit'), {
      method: 'POST',
      body: JSON.stringify({ writes }),
    });
  }
}
