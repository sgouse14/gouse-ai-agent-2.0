import test from 'node:test';
import assert from 'node:assert/strict';
import { WorkspaceStateError, WorkspaceStateService, MAX_WORKSPACE_STATE_BYTES } from './workspaceStateService.ts';
import type { FirestoreWrite } from './saqlainFirestoreRest.ts';

class FakeClient {
  docs = new Map<string, Record<string, unknown>>();
  commits: FirestoreWrite[][] = [];
  sequence = 0;
  documentName(_collection: string, id: string) { return 'fake/' + id; }
  async getDocument(_collection: string, id: string) { return this.docs.get(id) ?? null; }
  async commit(writes: readonly FirestoreWrite[]) {
    this.commits.push([...writes]);
    for (const write of writes) {
      const id = write.update?.name.split('/').pop() ?? '';
      const old = this.docs.get(id);
      if (write.currentDocument?.exists === false && old) throw new Error('Firestore request failed with HTTP 409.');
      if (write.currentDocument?.updateTime && old?._updateTime !== write.currentDocument.updateTime) throw new Error('Firestore request failed with HTTP 409.');
      const fields = write.update?.fields ?? {};
      const decode = (v: any): any => 'stringValue' in v ? v.stringValue : 'integerValue' in v ? Number(v.integerValue) : 'booleanValue' in v ? v.booleanValue : 'nullValue' in v ? null : 'arrayValue' in v ? v.arrayValue.values.map(decode) : 'mapValue' in v ? Object.fromEntries(Object.entries(v.mapValue.fields).map(([k,x])=>[k,decode(x)])) : v.doubleValue;
      const next = Object.fromEntries(Object.entries(fields).map(([k,v])=>[k,decode(v)]));
      this.sequence++;
      this.docs.set(id, {...next, _updateTime: 'u' + this.sequence});
    }
  }
}

test('creates and reads state scoped to a verified user and domain', async () => {
  const client = new FakeClient();
  const service = new WorkspaceStateService(() => client, () => new Date('2026-10-26T00:00:00.000Z'), () => 'v1');
  const saved = await service.write('uid-a', 'projects', [{ id: 'p1', name: 'House' }], null);
  assert.equal(saved.version, 'v1');
  assert.deepEqual(await service.read('uid-a', 'projects'), { data: [{ id: 'p1', name: 'House' }], version: 'v1' });
  assert.equal(await service.read('uid-b', 'projects'), null);
});

test('uses compare-and-swap and rejects stale concurrent writes', async () => {
  const client = new FakeClient();
  let v = 0;
  const service = new WorkspaceStateService(() => client, () => new Date(), () => 'v' + (++v));
  const first = await service.write('uid-a', 'boqItems', [{ id: 'a' }], null);
  const second = await service.write('uid-a', 'boqItems', [{ id: 'b' }], first.version);
  assert.equal(second.version, 'v2');
  await assert.rejects(
    service.write('uid-a', 'boqItems', [{ id: 'stale' }], first.version),
    (error: unknown) => error instanceof WorkspaceStateError && error.code === 'conflict',
  );
  assert.deepEqual((await service.read('uid-a', 'boqItems'))?.data, [{ id: 'b' }]);
});

test('refuses oversized domain data before storage write', async () => {
  const client = new FakeClient();
  const service = new WorkspaceStateService(() => client);
  await assert.rejects(
    service.write('uid-a', 'projects', 'x'.repeat(MAX_WORKSPACE_STATE_BYTES + 1), null),
    (error: unknown) => error instanceof WorkspaceStateError && error.code === 'invalid',
  );
  assert.equal(client.commits.length, 0);
});

test('does not accept a mismatched owner or missing concurrency metadata', async () => {
  const client = new FakeClient();
  const service = new WorkspaceStateService(() => client);
  await service.write('uid-a', 'enquiries', [], null);
  const id = [...client.docs.keys()][0];
  client.docs.set(id, { ...client.docs.get(id), ownerUid: 'uid-b' });
  await assert.rejects(service.write('uid-a', 'enquiries', [], 'whatever'),
    (error: unknown) => error instanceof WorkspaceStateError && error.code === 'unavailable');
});
