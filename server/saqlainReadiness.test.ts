import test from 'node:test';
import assert from 'node:assert/strict';

// Pure readiness configuration policy; tests do not call cloud services.
function readinessConfiguration(env: Record<string, string | undefined>) {
  const mode = env.SAQLAIN_AUDIT_BACKEND?.trim().toLowerCase() || 'file';
  if (mode !== 'file' && mode !== 'firestore') return { ready: false, dependency: 'configuration' };
  if (mode === 'firestore') {
    if (!(env.GOOGLE_CLOUD_PROJECT?.trim() || env.FIREBASE_PROJECT_ID?.trim())) return { ready: false, dependency: 'durable_storage' };
    return { ready: true };
  }
  if (!env.SAQLAIN_AUDIT_FILE?.trim()) return { ready: false, dependency: 'audit_storage_configuration' };
  return { ready: true };
}

test('readiness fails closed for invalid backend configuration', () => {
  assert.deepEqual(readinessConfiguration({ SAQLAIN_AUDIT_BACKEND: 'memory' }), { ready: false, dependency: 'configuration' });
});

test('file-backend readiness requires a configured durable audit path', () => {
  assert.deepEqual(readinessConfiguration({ SAQLAIN_AUDIT_BACKEND: 'file' }), { ready: false, dependency: 'audit_storage_configuration' });
  assert.deepEqual(readinessConfiguration({ SAQLAIN_AUDIT_BACKEND: 'file', SAQLAIN_AUDIT_FILE: '/var/lib/saqlain/audit.jsonl' }), { ready: true });
});

test('Firestore readiness requires a project configuration', () => {
  assert.deepEqual(readinessConfiguration({ SAQLAIN_AUDIT_BACKEND: 'firestore' }), { ready: false, dependency: 'durable_storage' });
  assert.deepEqual(readinessConfiguration({ SAQLAIN_AUDIT_BACKEND: 'firestore', GOOGLE_CLOUD_PROJECT: 'saqlain-staging-123' }), { ready: true });
});
