import { createHash, randomUUID } from 'node:crypto';
import { mkdir, open, readFile, unlink } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export interface AuditEventInput {
  eventType: string;
  actorId: string;
  outcome: 'ALLOW' | 'DENY' | 'HOLD' | 'INFO';
  resource?: string;
  taskId?: string;
  details?: Readonly<Record<string, unknown>>;
  occurredAt?: string;
}

export interface AuditRecord {
  schemaVersion: 1;
  sequence: number;
  eventId: string;
  occurredAt: string;
  eventType: string;
  actorId: string;
  outcome: AuditEventInput['outcome'];
  resource?: string;
  taskId?: string;
  details?: Readonly<Record<string, unknown>>;
  previousHash: string;
  recordHash: string;
}

const GENESIS_HASH = '0'.repeat(64);

function hashRecord(record: Omit<AuditRecord, 'recordHash'>): string {
  return createHash('sha256').update(JSON.stringify(record)).digest('hex');
}

function validateInput(input: AuditEventInput): void {
  if (!input.eventType?.trim()) throw new Error('eventType is required.');
  if (!input.actorId?.trim()) throw new Error('actorId is required.');
  if (!['ALLOW', 'DENY', 'HOLD', 'INFO'].includes(input.outcome)) throw new Error('Invalid audit outcome.');
}

function parseAndVerifyLog(text: string): AuditRecord[] {
  if (!text.trim()) return [];
  const records: AuditRecord[] = [];
  let previousHash = GENESIS_HASH;
  for (const [index, line] of text.trimEnd().split('\n').entries()) {
    let record: AuditRecord;
    try {
      record = JSON.parse(line) as AuditRecord;
    } catch {
      throw new Error('Audit log is malformed at line ' + (index + 1) + '; refusing to append.');
    }
    const { recordHash, ...payload } = record;
    if (record.schemaVersion !== 1 || record.sequence !== index + 1 ||
      record.previousHash !== previousHash || hashRecord(payload) !== recordHash) {
      throw new Error('Audit log integrity verification failed at line ' + (index + 1) + '; refusing to append.');
    }
    records.push(record);
    previousHash = recordHash;
  }
  return records;
}

/**
 * Appends a hash-chained JSONL audit event. A sibling exclusive lock serializes
 * cooperating writers. A stale lock causes a fail-closed error and requires
 * operator review; this module is not tamper-proof against privileged OS users.
 */
export async function appendDurableAuditEvent(
  auditFilePath: string,
  input: AuditEventInput,
): Promise<AuditRecord> {
  validateInput(input);
  if (!auditFilePath.trim()) throw new Error('auditFilePath is required.');
  const path = resolve(auditFilePath);
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  const lockPath = path + '.lock';
  let lockHandle;
  try {
    lockHandle = await open(lockPath, 'wx', 0o600);
  } catch {
    throw new Error('Audit log is locked or has a stale lock; refusing to append.');
  }

  try {
    let existingText = '';
    try {
      existingText = await readFile(path, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    const records = parseAndVerifyLog(existingText);
    const previousHash = records.at(-1)?.recordHash ?? GENESIS_HASH;
    const payload: Omit<AuditRecord, 'recordHash'> = {
      schemaVersion: 1,
      sequence: records.length + 1,
      eventId: randomUUID(),
      occurredAt: input.occurredAt ?? new Date().toISOString(),
      eventType: input.eventType,
      actorId: input.actorId,
      outcome: input.outcome,
      ...(input.resource ? { resource: input.resource } : {}),
      ...(input.taskId ? { taskId: input.taskId } : {}),
      ...(input.details ? { details: input.details } : {}),
      previousHash,
    };
    const record: AuditRecord = { ...payload, recordHash: hashRecord(payload) };
    const handle = await open(path, 'a', 0o600);
    try {
      await handle.writeFile(JSON.stringify(record) + '\n', 'utf8');
      await handle.sync();
    } finally {
      await handle.close();
    }
    return record;
  } finally {
    await lockHandle.close();
    // Remove only the temporary lock file created by this invocation.
    await unlink(lockPath).catch(() => undefined);
  }
}

export async function readVerifiedAuditLog(auditFilePath: string): Promise<readonly AuditRecord[]> {
  const path = resolve(auditFilePath);
  let text = '';
  try {
    text = await readFile(path, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
  return Object.freeze(parseAndVerifyLog(text));
}
