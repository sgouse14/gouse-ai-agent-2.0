import { createHash } from 'node:crypto';

export interface BackupFileInput {
  relativePath: string;
  bytes: Uint8Array;
}
export interface BackupManifestEntry {
  relativePath: string;
  byteLength: number;
  sha256: string;
}
export interface BackupManifest {
  schemaVersion: 1;
  snapshotId: string;
  source: 'gouse-ai' | 'saqlain-ai' | 'protected-files';
  createdAt: string;
  entries: readonly BackupManifestEntry[];
  manifestSha256: string;
  originalsModified: false;
}
export interface BackupCopyVerification {
  relativePath: string;
  expectedSha256: string;
  actualSha256: string;
  expectedByteLength: number;
  actualByteLength: number;
  verified: boolean;
}
const SHA256_HEX = /^[a-f0-9]{64}$/;

export function validateRelativeBackupPath(value: string): string {
  if (typeof value !== 'string' || value.trim() === '') throw new Error('relativePath is required.');
  const normalized = value.replace(/\\/g, '/');
  if (normalized.startsWith('/') || /^[a-zA-Z]:\//.test(normalized) || normalized.includes('\0')) {
    throw new Error('Absolute paths and null bytes are not permitted.');
  }
  if (normalized.split('/').some((part) => part === '' || part === '.' || part === '..')) {
    throw new Error('Backup path contains an unsafe path segment.');
  }
  return normalized;
}
export function sha256Hex(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}
function canonicalPayload(input: {
  schemaVersion: 1;
  snapshotId: string;
  source: BackupManifest['source'];
  createdAt: string;
  entries: readonly BackupManifestEntry[];
}): string {
  return JSON.stringify({
    schemaVersion: input.schemaVersion,
    snapshotId: input.snapshotId,
    source: input.source,
    createdAt: input.createdAt,
    entries: [...input.entries].sort((a, b) => a.relativePath.localeCompare(b.relativePath)),
    originalsModified: false,
  });
}

/** Creates integrity metadata only; a separate storage adapter must perform the actual copy. */
export function createBackupManifest(input: {
  snapshotId: string;
  source: BackupManifest['source'];
  files: readonly BackupFileInput[];
  now?: Date;
}): BackupManifest {
  if (!input.snapshotId.trim()) throw new Error('snapshotId is required.');
  if (!['gouse-ai', 'saqlain-ai', 'protected-files'].includes(input.source)) throw new Error('Unsupported backup source.');
  if (!Array.isArray(input.files) || input.files.length === 0) throw new Error('At least one file is required.');
  const seen = new Set<string>();
  const entries = input.files.map(({ relativePath, bytes }) => {
    const safePath = validateRelativeBackupPath(relativePath);
    if (seen.has(safePath)) throw new Error('Duplicate path in snapshot.');
    seen.add(safePath);
    if (!(bytes instanceof Uint8Array)) throw new Error('File content must be bytes.');
    return Object.freeze({ relativePath: safePath, byteLength: bytes.byteLength, sha256: sha256Hex(bytes) });
  }).sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  const createdAt = (input.now ?? new Date()).toISOString();
  const payload = { schemaVersion: 1 as const, snapshotId: input.snapshotId, source: input.source, createdAt, entries };
  const manifestSha256 = sha256Hex(new TextEncoder().encode(canonicalPayload(payload)));
  return Object.freeze({ ...payload, entries: Object.freeze(entries), manifestSha256, originalsModified: false as const });
}

export function verifyBackupCopy(entry: BackupManifestEntry, copiedBytes: Uint8Array): BackupCopyVerification {
  if (!SHA256_HEX.test(entry.sha256)) throw new Error('Manifest SHA-256 is invalid.');
  if (!(copiedBytes instanceof Uint8Array)) throw new Error('Copied content must be bytes.');
  const actualSha256 = sha256Hex(copiedBytes);
  return {
    relativePath: validateRelativeBackupPath(entry.relativePath),
    expectedSha256: entry.sha256,
    actualSha256,
    expectedByteLength: entry.byteLength,
    actualByteLength: copiedBytes.byteLength,
    verified: entry.byteLength === copiedBytes.byteLength && entry.sha256 === actualSha256,
  };
}

export function verifyBackupManifest(manifest: BackupManifest): boolean {
  if (manifest.schemaVersion !== 1 || manifest.originalsModified !== false || !manifest.snapshotId.trim()) return false;
  if (!Array.isArray(manifest.entries) || manifest.entries.length === 0) return false;
  const seen = new Set<string>();
  for (const entry of manifest.entries) {
    try {
      const path = validateRelativeBackupPath(entry.relativePath);
      if (seen.has(path) || !Number.isSafeInteger(entry.byteLength) || entry.byteLength < 0 || !SHA256_HEX.test(entry.sha256)) return false;
      seen.add(path);
    } catch { return false; }
  }
  const payload = {
    schemaVersion: manifest.schemaVersion, snapshotId: manifest.snapshotId,
    source: manifest.source, createdAt: manifest.createdAt, entries: manifest.entries,
  };
  return SHA256_HEX.test(manifest.manifestSha256) &&
    sha256Hex(new TextEncoder().encode(canonicalPayload(payload))) === manifest.manifestSha256;
}
