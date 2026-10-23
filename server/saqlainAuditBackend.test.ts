import test from 'node:test';
import assert from 'node:assert/strict';
import { appendSaqlainAuditEvent, getSaqlainAuditBackendMode, readSaqlainAuditLog } from './saqlainAuditBackend.ts';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

test('Saqlain audit facade defaults to file mode and round-trips the local test backend', async () => {
  const previous = process.env.SAQLAIN_AUDIT_BACKEND;
  delete process.env.SAQLAIN_AUDIT_BACKEND;
  const root = await mkdtemp(join(tmpdir(), 'saqlain-audit-facade-'));
  try {
    assert.equal(getSaqlainAuditBackendMode(), 'file');
    await appendSaqlainAuditEvent(join(root, 'audit.jsonl'), {
      eventType: 'FACADE_TEST', actorId: 'test-operator', outcome: 'INFO',
    });
    assert.equal((await readSaqlainAuditLog(join(root, 'audit.jsonl'))).length, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
    if (previous === undefined) delete process.env.SAQLAIN_AUDIT_BACKEND;
    else process.env.SAQLAIN_AUDIT_BACKEND = previous;
  }
});

test('Saqlain audit facade rejects invalid backend configuration and missing file paths', async () => {
  const previous = process.env.SAQLAIN_AUDIT_BACKEND;
  try {
    process.env.SAQLAIN_AUDIT_BACKEND = 'unknown';
    assert.throws(() => getSaqlainAuditBackendMode(), /must be either/);
    process.env.SAQLAIN_AUDIT_BACKEND = 'file';
    await assert.rejects(() => appendSaqlainAuditEvent(undefined, {
      eventType: 'FACADE_TEST', actorId: 'test-operator', outcome: 'INFO',
    }), /file audit path is not configured/);
  } finally {
    if (previous === undefined) delete process.env.SAQLAIN_AUDIT_BACKEND;
    else process.env.SAQLAIN_AUDIT_BACKEND = previous;
  }
});
