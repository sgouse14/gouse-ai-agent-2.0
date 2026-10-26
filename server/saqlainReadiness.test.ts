import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkSaqlainReadiness } from './saqlainReadiness.ts';

test('readiness fails closed for invalid backend configuration', async () => {
  assert.deepEqual(await checkSaqlainReadiness({
    env: { SAQLAIN_AUDIT_BACKEND: 'memory' },
  }), { ready: false, dependency: 'configuration' });
});

test('file readiness requires configured audit storage and writable parent', async () => {
  assert.deepEqual(await checkSaqlainReadiness({
    env: { SAQLAIN_AUDIT_BACKEND: 'file' },
  }), { ready: false, dependency: 'audit_storage_configuration' });

  const root = await mkdtemp(join(tmpdir(), 'saqlain-ready-'));
  try {
    assert.deepEqual(await checkSaqlainReadiness({
      env: { SAQLAIN_AUDIT_BACKEND: 'file', SAQLAIN_AUDIT_FILE: join(root, 'audit.jsonl') },
    }), { ready: true });

    const notDirectory = join(root, 'ordinary-file');
    await writeFile(notDirectory, 'not a directory');
    assert.deepEqual(await checkSaqlainReadiness({
      env: { SAQLAIN_AUDIT_BACKEND: 'file', SAQLAIN_AUDIT_FILE: join(notDirectory, 'audit.jsonl') },
    }), { ready: false, dependency: 'durable_storage' });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('file readiness rejects a corrupted audit chain', async () => {
  const root = await mkdtemp(join(tmpdir(), 'saqlain-audit-corrupt-'));
  const auditPath = join(root, 'audit.jsonl');
  try {
    await writeFile(auditPath, '{"schemaVersion":1,"sequence":2,"recordHash":"broken"}\n');
    assert.deepEqual(await checkSaqlainReadiness({
      env: { SAQLAIN_AUDIT_BACKEND: 'file', SAQLAIN_AUDIT_FILE: auditPath },
    }), { ready: false, dependency: 'durable_storage' });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('Firestore readiness fails closed without project config or when a probe fails', async () => {
  assert.deepEqual(await checkSaqlainReadiness({
    env: { SAQLAIN_AUDIT_BACKEND: 'firestore' },
  }), { ready: false, dependency: 'durable_storage' });

  assert.deepEqual(await checkSaqlainReadiness({
    env: { SAQLAIN_AUDIT_BACKEND: 'firestore', GOOGLE_CLOUD_PROJECT: 'saqlain-staging-123' },
    firestoreProbe: async () => { throw new Error('simulated outage'); },
  }), { ready: false, dependency: 'durable_storage' });

  assert.deepEqual(await checkSaqlainReadiness({
    env: { SAQLAIN_AUDIT_BACKEND: 'firestore', GOOGLE_CLOUD_PROJECT: 'saqlain-staging-123' },
    firestoreProbe: async () => undefined,
  }), { ready: true });
});
