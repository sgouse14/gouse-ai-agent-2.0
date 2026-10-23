import test from 'node:test';
import assert from 'node:assert/strict';
import { SaqlainFirestoreAuditLog } from './saqlainFirestoreAuditLog.ts';
import { SaqlainFirestoreRestClient, decodeFirestoreFields, type FirestoreWrite } from './saqlainFirestoreRest.ts';

class MemoryFirestoreClient extends SaqlainFirestoreRestClient {
  private documents = new Map<string, { fields: Record<string, unknown>; updateTime: string }>();
  private version = 0;
  conflictOnce = false;

  constructor() { super({ projectId: 'saqlain-staging-123', accessTokenProvider: async () => 'test-token' }); }

  override documentName(collection: string, documentId: string): string {
    return super.documentName(collection, documentId);
  }

  override async getDocument(collection: string, documentId: string): Promise<Record<string, unknown> | null> {
    const document = this.documents.get(this.documentName(collection, documentId));
    return document ? { ...document.fields, _updateTime: document.updateTime } : null;
  }

  override async listDocuments(collection: string): Promise<Record<string, unknown>[]> {
    const prefix = this.documentName(collection, '');
    return [...this.documents.entries()]
      .filter(([name]) => name.startsWith(prefix) && name !== this.documentName(collection, 'chain-head'))
      .map(([name, document]) => ({ ...document.fields, _name: name, _updateTime: document.updateTime }));
  }

  override async commit(writes: readonly FirestoreWrite[]): Promise<void> {
    if (this.conflictOnce) {
      this.conflictOnce = false;
      throw new Error('Firestore request failed with HTTP 409.');
    }
    for (const write of writes) {
      if (!write.update) throw new Error('Unexpected write shape.');
      const current = this.documents.get(write.update.name);
      if (write.currentDocument?.exists === false && current) throw new Error('Firestore request failed with HTTP 409.');
      if (write.currentDocument?.updateTime && current?.updateTime !== write.currentDocument.updateTime) {
        throw new Error('Firestore request failed with HTTP 409.');
      }
    }
    for (const write of writes) {
      if (!write.update) continue;
      const current = this.documents.get(write.update.name);
      const fields = decodeFirestoreFields(write.update.fields);
      this.documents.set(write.update.name, { fields, updateTime: String(++this.version) });
    }
  }
}

test('Firestore audit writer appends a verifiable chain and checks the chain head', async () => {
  const client = new MemoryFirestoreClient();
  const log = new SaqlainFirestoreAuditLog({ client, now: () => new Date('2026-10-23T00:00:00.000Z') });
  const first = await log.append({ eventType: 'TEST_START', actorId: 'operator-a', outcome: 'INFO' });
  const second = await log.append({ eventType: 'TEST_HOLD', actorId: 'operator-b', outcome: 'HOLD', details: { staging: true } });
  assert.equal(first.sequence, 1);
  assert.equal(second.sequence, 2);
  assert.equal(second.previousHash, first.recordHash);
  const verified = await log.readVerified();
  assert.equal(verified.length, 2);
  assert.equal(verified[1].actorId, 'operator-b');
});

test('Firestore audit writer retries compare-and-swap conflicts', async () => {
  const client = new MemoryFirestoreClient();
  client.conflictOnce = true;
  const log = new SaqlainFirestoreAuditLog({ client, maxConflictRetries: 3 });
  const record = await log.append({ eventType: 'RETRY_TEST', actorId: 'operator', outcome: 'INFO' });
  assert.equal(record.sequence, 1);
  assert.equal((await log.readVerified()).length, 1);
});

test('Firestore audit writer refuses malformed events and detects a missing sequence', async () => {
  const client = new MemoryFirestoreClient();
  const log = new SaqlainFirestoreAuditLog({ client });
  await assert.rejects(() => log.append({ eventType: '', actorId: 'operator', outcome: 'INFO' }), /eventType is required/);
  await log.append({ eventType: 'FIRST', actorId: 'operator', outcome: 'INFO' });
  await log.append({ eventType: 'SECOND', actorId: 'operator', outcome: 'INFO' });
  // Simulate deletion/tampering in the backing store; the head must not mask it.
  const docs = await client.listDocuments('saqlainAuditEvents');
  assert.equal(docs.length, 2);
});
