import type { AuditEventInput, AuditRecord } from './saqlainAuditLog.ts';
import { appendDurableAuditEvent, readVerifiedAuditLog } from './saqlainAuditLog.ts';
import { SaqlainFirestoreAuditLog } from './saqlainFirestoreAuditLog.ts';

export type SaqlainAuditBackendMode = 'file' | 'firestore';

export function getSaqlainAuditBackendMode(): SaqlainAuditBackendMode {
  const configured = process.env.SAQLAIN_AUDIT_BACKEND?.trim().toLowerCase() || 'file';
  if (configured !== 'file' && configured !== 'firestore') {
    throw new Error('SAQLAIN_AUDIT_BACKEND must be either "file" or "firestore".');
  }
  return configured;
}

/**
 * Saqlain-only audit facade. Gousiya recovery continues to call the file audit
 * functions directly. Firestore mode ignores file paths and uses the shared
 * collection configured by SAQLAIN_FIRESTORE_AUDIT_COLLECTION.
 */
export async function appendSaqlainAuditEvent(
  filePath: string | undefined,
  event: AuditEventInput,
): Promise<AuditRecord> {
  const mode = getSaqlainAuditBackendMode();
  if (mode === 'firestore') return new SaqlainFirestoreAuditLog().append(event);
  if (!filePath?.trim()) throw new Error('Saqlain file audit path is not configured.');
  return appendDurableAuditEvent(filePath, event);
}

export async function readSaqlainAuditLog(filePath: string | undefined): Promise<readonly AuditRecord[]> {
  const mode = getSaqlainAuditBackendMode();
  if (mode === 'firestore') return new SaqlainFirestoreAuditLog().readVerified();
  if (!filePath?.trim()) throw new Error('Saqlain file audit path is not configured.');
  return readVerifiedAuditLog(filePath);
}
