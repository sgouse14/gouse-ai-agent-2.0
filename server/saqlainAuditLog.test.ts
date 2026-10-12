import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { appendDurableAuditEvent, readVerifiedAuditLog } from './saqlainAuditLog.ts';

test('audit log appends ordered hash-chained records and verifies them', async () => {
  const root = await mkdtemp(join(tmpdir(), 'saqlain-audit-'));
  const path = join(root, 'audit', 'security.jsonl');
  try {
    const first = await appendDurableAuditEvent(path, {
      eventType: 'BACKUP_SNAPSHOT_VERIFIED', actorId: 'saq-backup-verify', outcome: 'INFO',
      resource: 'snapshot-1', occurredAt: '2026-01-01T00:00:00.000Z',
    });
    const second = await appendDurableAuditEvent(path, {
      eventType: 'TASK_HANDOFF', actorId: 'queue-manager', outcome: 'HOLD',
      taskId: '01010', occurredAt: '2026-01-01T00:01:00.000Z',
    });
    assert.equal(first.sequence, 1);
    assert.equal(second.sequence, 2);
    assert.equal(second.previousHash, first.recordHash);
    const records = await readVerifiedAuditLog(path);
    assert.equal(records.length, 2);
    assert.equal(records[1].outcome, 'HOLD');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('audit log refuses to append to a tampered history', async () => {
  const root = await mkdtemp(join(tmpdir(), 'saqlain-audit-'));
  const path = join(root, 'security.jsonl');
  try {
    await appendDurableAuditEvent(path, { eventType: 'START', actorId: 'test', outcome: 'INFO' });
    const content = await readFile(path, 'utf8');
    await writeFile(path, content.replace('"outcome":"INFO"', '"outcome":"ALLOW"'));
    await assert.rejects(() => appendDurableAuditEvent(path, {
      eventType: 'NEXT', actorId: 'test', outcome: 'INFO',
    }), /integrity verification failed/);
    await assert.rejects(() => readVerifiedAuditLog(path), /integrity verification failed/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('audit input validation fails closed', async () => {
  const root = await mkdtemp(join(tmpdir(), 'saqlain-audit-'));
  try {
    await assert.rejects(() => appendDurableAuditEvent(join(root, 'audit.jsonl'), {
      eventType: '', actorId: 'test', outcome: 'INFO',
    }), /eventType is required/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
