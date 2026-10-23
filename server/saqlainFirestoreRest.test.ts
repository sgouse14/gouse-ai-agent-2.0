import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SaqlainFirestoreRestClient,
  decodeFirestoreFields,
  encodeFirestoreValue,
} from './saqlainFirestoreRest.ts';

test('Firestore JSON value codec round-trips nested audit-shaped data', () => {
  const input = {
    eventType: 'SAQLAIN_TEST',
    actorId: 'test-operator',
    outcome: 'HOLD',
    sequence: 3,
    details: { accepted: false, labels: ['staging', 'security'], nested: { count: 2.5, nothing: null } },
  };
  const fields = Object.fromEntries(Object.entries(input).map(([key, value]) => [key, encodeFirestoreValue(value)]));
  assert.deepEqual(decodeFirestoreFields(fields), input);
});

test('Firestore value codec rejects non-finite and undefined values', () => {
  assert.throws(() => encodeFirestoreValue(Number.NaN), /finite numbers/);
  assert.throws(() => encodeFirestoreValue({ invalid: undefined }), /Undefined Firestore field/);
});

test('Firestore client requires a project ID and does not request service-account keys', async () => {
  assert.throws(() => new SaqlainFirestoreRestClient({ projectId: '' }), /GOOGLE_CLOUD_PROJECT or FIREBASE_PROJECT_ID is required for Firestore/);
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const client = new SaqlainFirestoreRestClient({
    projectId: 'saqlain-staging-123',
    accessTokenProvider: async () => 'test-access-token',
    fetchImpl: async (input, init) => {
      calls.push({ url: String(input), init });
      return new Response(JSON.stringify({ documents: [] }), { status: 200 });
    },
  });
  assert.deepEqual(await client.listDocuments('saqlainAuditEvents'), []);
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /firestore\.googleapis\.com/);
  assert.equal(new Headers(calls[0].init?.headers).get('Authorization'), 'Bearer test-access-token');
  assert.equal(calls[0].url.includes('private_key'), false);
});

test('Firestore client uses Cloud Run metadata identity when no token provider is injected', async () => {
  const calls: string[] = [];
  const client = new SaqlainFirestoreRestClient({
    projectId: 'saqlain-staging-123',
    fetchImpl: async (input, init) => {
      calls.push(String(input));
      if (String(input).includes('metadata.google.internal')) {
        assert.equal(new Headers(init?.headers).get('Metadata-Flavor'), 'Google');
        return new Response(JSON.stringify({ access_token: 'metadata-token' }), { status: 200 });
      }
      return new Response(JSON.stringify({ documents: [] }), { status: 200 });
    },
  });
  await client.listDocuments('saqlainAuditEvents');
  assert.equal(calls.length, 2);
  assert.ok(calls[0].includes('metadata.google.internal'));
});
