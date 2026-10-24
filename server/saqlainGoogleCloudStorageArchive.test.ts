import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createVerifiedLocalSnapshot } from './saqlainBackupStorage.ts';
import { SaqlainGoogleCloudStorageArchive } from './saqlainGoogleCloudStorageArchive.ts';

const BUCKET = 'saqlain-backup-test-01';

interface FakeGcsState {
  versioningEnabled: boolean;
  objects: Map<string, Buffer>;
  writes: string[];
  uploadFailureStatus?: number;
}
function response(status: number, body: BodyInit | null = null, headers: Record<string, string> = {}) {
  return new Response(body, { status, headers });
}
function fakeFetch(state: FakeGcsState): typeof fetch {
  const handler = async (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url);
    const method = (init.method ?? 'GET').toUpperCase();
    if (url.hostname === 'storage.googleapis.com' && url.pathname === '/storage/v1/b/' + BUCKET && method === 'GET') {
      return response(200, JSON.stringify({ name: BUCKET, versioning: { enabled: state.versioningEnabled } }), { 'Content-Type': 'application/json' });
    }
    if (url.hostname === 'storage.googleapis.com' && url.pathname.startsWith('/upload/storage/v1/b/') && method === 'POST') {
      if (state.uploadFailureStatus) return response(state.uploadFailureStatus, 'synthetic secret response; never leak this');
      const name = url.searchParams.get('name');
      assert.ok(name);
      if (state.objects.has(name!)) return response(412, 'precondition failed');
      const bytes = Buffer.from(await new Response(init.body as BodyInit).arrayBuffer());
      state.objects.set(name!, bytes);
      state.writes.push(name!);
      return response(200, JSON.stringify({ name, generation: '1' }), { 'Content-Type': 'application/json' });
    }
    if (url.hostname === 'storage.googleapis.com' && url.pathname.startsWith('/storage/v1/b/' + BUCKET + '/o/') && method === 'GET') {
      const encodedName = url.pathname.slice(url.pathname.indexOf('/o/') + 3);
      const name = decodeURIComponent(encodedName);
      const bytes = state.objects.get(name);
      if (!bytes) return response(404, 'not found');
      if (url.searchParams.get('alt') !== 'media') return response(400, 'media expected');
      return response(200, Buffer.from(bytes), { 'Content-Length': String(bytes.length), 'Content-Type': 'application/octet-stream' });
    }
    return response(500, 'unhandled synthetic GCS request');
  };
  return handler as typeof fetch;
}
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'saqlain-gcs-archive-'));
  const snapshot = await createVerifiedLocalSnapshot({
    storageRoot: join(root, 'local-backup'),
    snapshotId: 'snapshot-gcs-01',
    source: 'gouse-ai',
    files: [
      { relativePath: 'project.txt', bytes: new TextEncoder().encode('project source bytes') },
      { relativePath: 'config/settings.json', bytes: new TextEncoder().encode('{"mode":"staging"}') },
    ],
    now: new Date('2026-10-24T10:00:00.000Z'),
  });
  return { root, snapshot };
}
function makeArchive(state: FakeGcsState) {
  return new SaqlainGoogleCloudStorageArchive({
    bucket: BUCKET,
    prefix: 'saqlain-backups',
    fetchImpl: fakeFetch(state),
    accessTokenProvider: async () => 'synthetic-access-token-for-tests',
    now: () => new Date('2026-10-24T10:05:00.000Z'),
  });
}

test('GCS archive requires bucket versioning, uploads create-only objects, verifies readback, and writes completion marker last', async () => {
  const ctx = await fixture();
  const state: FakeGcsState = { versioningEnabled: true, objects: new Map(), writes: [] };
  try {
    const receipt = await makeArchive(state).archiveSnapshot(ctx.snapshot);
    assert.equal(receipt.status, 'VERIFIED');
    assert.equal(receipt.bucket, BUCKET);
    assert.equal(receipt.snapshotId, 'snapshot-gcs-01');
    assert.equal(receipt.objectCount, 4);
    assert.equal(state.writes.length, 4);
    assert.equal(state.writes.at(-1), receipt.completionObjectName);
    assert.ok(state.objects.has('saqlain-backups/snapshot-gcs-01/files/project.txt'));
    assert.ok(state.objects.has('saqlain-backups/snapshot-gcs-01/files/config/settings.json'));
    const marker = JSON.parse(state.objects.get(receipt.completionObjectName)!.toString('utf8'));
    assert.equal(marker.originalsModified, false);
    assert.equal(marker.manifestSha256, receipt.manifestSha256);
  } finally { await rm(ctx.root, { recursive: true, force: true }); }
});

test('GCS archive retries are idempotent and do not overwrite existing identical objects', async () => {
  const ctx = await fixture();
  const state: FakeGcsState = { versioningEnabled: true, objects: new Map(), writes: [] };
  try {
    const archive = makeArchive(state);
    const first = await archive.archiveSnapshot(ctx.snapshot);
    const writeCount = state.writes.length;
    const second = await archive.archiveSnapshot(ctx.snapshot);
    assert.equal(second.completionObjectName, first.completionObjectName);
    assert.equal(second.manifestSha256, first.manifestSha256);
    assert.equal(state.writes.length, writeCount);
  } finally { await rm(ctx.root, { recursive: true, force: true }); }
});

test('GCS archive fails closed when bucket object versioning is disabled', async () => {
  const ctx = await fixture();
  const state: FakeGcsState = { versioningEnabled: false, objects: new Map(), writes: [] };
  try {
    await assert.rejects(() => makeArchive(state).archiveSnapshot(ctx.snapshot), /object versioning must be enabled/i);
    assert.equal(state.objects.size, 0);
    assert.equal(state.writes.length, 0);
  } finally { await rm(ctx.root, { recursive: true, force: true }); }
});

test('GCS archive refuses to overwrite a conflicting pre-existing object', async () => {
  const ctx = await fixture();
  const conflictName = 'saqlain-backups/snapshot-gcs-01/files/project.txt';
  const conflictingBytes = Buffer.from('different and protected existing data');
  const state: FakeGcsState = { versioningEnabled: true, objects: new Map([[conflictName, conflictingBytes]]), writes: [] };
  try {
    await assert.rejects(() => makeArchive(state).archiveSnapshot(ctx.snapshot), /differs from the expected bytes; refusing overwrite/i);
    assert.deepEqual(state.objects.get(conflictName), conflictingBytes);
    assert.equal(state.writes.includes(conflictName), false);
    // Earlier successfully created objects remain for investigation; partial archives are not deleted.
    assert.ok(state.writes.length >= 1);
  } finally { await rm(ctx.root, { recursive: true, force: true }); }
});

test('GCS retry detects a tampered object even when its completion marker exists', async () => {
  const ctx = await fixture();
  const state: FakeGcsState = { versioningEnabled: true, objects: new Map(), writes: [] };
  try {
    const archive = makeArchive(state);
    const receipt = await archive.archiveSnapshot(ctx.snapshot);
    state.objects.set('saqlain-backups/snapshot-gcs-01/files/project.txt', Buffer.from('tampered data'));
    await assert.rejects(() => archive.archiveSnapshot(ctx.snapshot), /incomplete or differs from the approved snapshot/i);
    assert.equal(state.writes.length, 4);
    assert.ok(state.objects.has(receipt.completionObjectName));
  } finally { await rm(ctx.root, { recursive: true, force: true }); }
});

test('GCS service errors do not expose response body details', async () => {
  const ctx = await fixture();
  const state: FakeGcsState = { versioningEnabled: true, objects: new Map(), writes: [], uploadFailureStatus: 500 };
  try {
    await assert.rejects(
      () => makeArchive(state).archiveSnapshot(ctx.snapshot),
      error => {
        assert.match(String(error), /HTTP 500/);
        assert.equal(String(error).includes('synthetic secret response'), false);
        return true;
      },
    );
  } finally { await rm(ctx.root, { recursive: true, force: true }); }
});
