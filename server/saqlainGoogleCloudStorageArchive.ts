import { lstat, readFile } from 'node:fs/promises';
import { basename, dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { sha256Hex, validateRelativeBackupPath, verifyBackupCopy, verifyBackupManifest, type BackupManifest, type BackupManifestEntry } from './saqlainBackupManifest.ts';
import type { BackupStorageResult } from './saqlainBackupStorage.ts';

const DEFAULT_MAX_FILES = 10_000;
const DEFAULT_MAX_FILE_BYTES = 25 * 1024 * 1024;
const DEFAULT_MAX_TOTAL_BYTES = 1024 * 1024 * 1024;
const MAX_MANIFEST_BYTES = 8 * 1024 * 1024;
const MAX_COMPLETION_MARKER_BYTES = 32 * 1024;

export interface SaqlainGoogleCloudStorageArchiveReceipt {
  provider: 'google-cloud-storage';
  status: 'VERIFIED';
  bucket: string;
  prefix: string;
  snapshotId: string;
  objectCount: number;
  totalBytes: number;
  manifestSha256: string;
  completionObjectName: string;
  verifiedAt: string;
}

export interface SaqlainGoogleCloudStorageArchiveOptions {
  bucket: string;
  /** Relative object prefix. Defaults to saqlain-backups. */
  prefix?: string;
  fetchImpl?: typeof fetch;
  /** Tests may inject a token provider; production uses Cloud Run attached service identity. */
  accessTokenProvider?: () => Promise<string>;
  now?: () => Date;
  maxFiles?: number;
  maxFileBytes?: number;
  maxTotalBytes?: number;
}

interface LocalArchiveEntry {
  entry: BackupManifestEntry;
  path: string;
}

interface LocalSnapshotInfo {
  root: string;
  manifest: BackupManifest;
  manifestBytes: Buffer;
  entries: LocalArchiveEntry[];
  totalBytes: number;
}

function assertSafeBucket(bucket: string): string {
  const normalized = typeof bucket === 'string' ? bucket.trim() : '';
  // Deliberately accept a strict subset of valid GCS names: lowercase names with
  // letters, digits and hyphens only. This avoids ambiguous URL/path forms.
  if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(normalized)) {
    throw new Error('A valid Google Cloud Storage bucket name is required.');
  }
  return normalized;
}

function assertSafePrefix(raw: string | undefined): string {
  const prefix = (raw ?? 'saqlain-backups').trim();
  if (!prefix || prefix.length > 200 || prefix.startsWith('/') || prefix.endsWith('/')) {
    throw new Error('GCS archive prefix must be a relative object prefix.');
  }
  const normalized = validateRelativeBackupPath(prefix);
  if (normalized.split('/').some(segment => segment.length > 100)) {
    throw new Error('GCS archive prefix contains an overlong path segment.');
  }
  return normalized;
}

function isWithin(parent: string, candidate: string): boolean {
  const rel = relative(parent, candidate);
  return rel === '' || (rel !== '..' && !rel.startsWith('..' + sep) && !isAbsolute(rel));
}

function safeObjectName(prefix: string, snapshotId: string, suffix: string): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/.test(snapshotId) || snapshotId === '.' || snapshotId === '..') {
    throw new Error('Snapshot identifier is invalid for off-site archival.');
  }
  const safeSuffix = validateRelativeBackupPath(suffix);
  return prefix + '/' + snapshotId + '/' + safeSuffix;
}

async function defaultAccessTokenProvider(fetchImpl: typeof fetch): Promise<string> {
  let response: Response;
  try {
    response = await fetchImpl(
      'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
      { headers: { 'Metadata-Flavor': 'Google' } },
    );
  } catch {
    throw new Error('Cloud Run service identity token could not be obtained.');
  }
  if (!response.ok) throw new Error('Cloud Run service identity token request failed with HTTP ' + response.status + '.');
  const body = await response.json() as { access_token?: unknown };
  if (typeof body.access_token !== 'string' || !body.access_token.trim()) {
    throw new Error('Cloud Run service identity response did not contain an access token.');
  }
  return body.access_token;
}

/**
 * Optional, append-only GCS archive for an already verified local snapshot.
 *
 * Safety contract:
 * - requires bucket object versioning to be enabled before any writes;
 * - uses ifGenerationMatch=0 for every object (never overwrites an existing generation);
 * - reads back and hashes every object before writing the completion marker;
 * - creates ARCHIVE_COMPLETE.json last, and never deletes remote evidence.
 * The attached Cloud Run service account should have only bucket metadata read,
 * object create, and object read permissions. No credential key file is used.
 */
export class SaqlainGoogleCloudStorageArchive {
  private readonly bucket: string;
  private readonly prefix: string;
  private readonly fetchImpl: typeof fetch;
  private readonly accessTokenProvider: () => Promise<string>;
  private readonly now: () => Date;
  private readonly maxFiles: number;
  private readonly maxFileBytes: number;
  private readonly maxTotalBytes: number;
  private cachedToken: string | null = null;
  private tokenExpiresAt = 0;
  private tokenRequest: Promise<string> | null = null;

  constructor(options: SaqlainGoogleCloudStorageArchiveOptions) {
    this.bucket = assertSafeBucket(options.bucket);
    this.prefix = assertSafePrefix(options.prefix);
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.accessTokenProvider = options.accessTokenProvider ?? (() => defaultAccessTokenProvider(this.fetchImpl));
    this.now = options.now ?? (() => new Date());
    this.maxFiles = options.maxFiles ?? DEFAULT_MAX_FILES;
    this.maxFileBytes = options.maxFileBytes ?? DEFAULT_MAX_FILE_BYTES;
    this.maxTotalBytes = options.maxTotalBytes ?? DEFAULT_MAX_TOTAL_BYTES;
    if (![this.maxFiles, this.maxFileBytes, this.maxTotalBytes].every(Number.isSafeInteger) ||
        this.maxFiles < 1 || this.maxFiles > 100_000 ||
        this.maxFileBytes < 1 || this.maxTotalBytes < 1 || this.maxTotalBytes > 5 * 1024 * 1024 * 1024) {
      throw new Error('GCS archive size limits must be positive safe integers within supported bounds.');
    }
  }

  private async accessToken(): Promise<string> {
    const nowMs = this.now().getTime();
    if (this.cachedToken && nowMs < this.tokenExpiresAt) return this.cachedToken;
    if (!this.tokenRequest) {
      this.tokenRequest = this.accessTokenProvider().finally(() => { this.tokenRequest = null; });
    }
    const token = await this.tokenRequest;
    if (typeof token !== 'string' || token.trim().length < 10 || token.length > 16_384) {
      throw new Error('GCS archive access token provider returned an invalid token.');
    }
    this.cachedToken = token;
    // Cloud Run metadata tokens are typically valid for about one hour. Refresh
    // early to avoid stale tokens in long-running backup processes.
    this.tokenExpiresAt = nowMs + 50 * 60_000;
    return token;
  }

  private async request(url: string, init: RequestInit = {}): Promise<Response> {
    let response: Response;
    try {
      const headers = new Headers(init.headers);
      headers.set('Authorization', 'Bearer ' + await this.accessToken());
      headers.set('Accept', 'application/json, application/octet-stream');
      response = await this.fetchImpl(url, { ...init, headers });
    } catch {
      throw new Error('Google Cloud Storage request failed due to a network or identity error.');
    }
    return response;
  }

  private async assertBucketVersioningEnabled(): Promise<void> {
    const url = 'https://storage.googleapis.com/storage/v1/b/' + encodeURIComponent(this.bucket) +
      '?fields=name,versioning';
    const response = await this.request(url);
    if (!response.ok) {
      throw new Error('Could not verify GCS bucket versioning (HTTP ' + response.status + ').');
    }
    let body: { name?: unknown; versioning?: { enabled?: unknown } };
    try { body = await response.json() as typeof body; }
    catch { throw new Error('GCS bucket metadata response is invalid.'); }
    if (body.name !== this.bucket || body.versioning?.enabled !== true) {
      throw new Error('GCS bucket object versioning must be enabled before archival.');
    }
  }

  private objectUrl(name: string): string {
    return 'https://storage.googleapis.com/storage/v1/b/' + encodeURIComponent(this.bucket) +
      '/o/' + encodeURIComponent(name) + '?alt=media';
  }

  private async readObject(name: string, maxBytes: number): Promise<Buffer | null> {
    const response = await this.request(this.objectUrl(name));
    if (response.status === 404) {
      await response.body?.cancel().catch(() => undefined);
      return null;
    }
    if (!response.ok) {
      const status = response.status;
      await response.body?.cancel().catch(() => undefined);
      throw new Error('GCS object read failed with HTTP ' + status + '.');
    }
    const declaredLength = Number(response.headers.get('content-length'));
    if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
      throw new Error('GCS archive object exceeds the configured readback limit.');
    }
    let bytes: Buffer;
    try { bytes = Buffer.from(await response.arrayBuffer()); }
    catch { throw new Error('GCS archive object response could not be read.'); }
    if (bytes.byteLength > maxBytes) throw new Error('GCS archive object exceeds the configured readback limit.');
    return bytes;
  }

  private async uploadIfAbsentAndVerify(name: string, bytes: Uint8Array, maxBytes: number): Promise<void> {
    const uploadUrl = 'https://storage.googleapis.com/upload/storage/v1/b/' +
      encodeURIComponent(this.bucket) + '/o?' + new URLSearchParams({
        uploadType: 'media',
        name,
        ifGenerationMatch: '0',
      }).toString();
    const response = await this.request(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: Buffer.from(bytes) as unknown as BodyInit,
    });
    if (!response.ok && response.status !== 412) {
      // Never include response bodies: cloud errors can contain object metadata or other sensitive details.
      const status = response.status;
      await response.body?.cancel().catch(() => undefined);
      throw new Error('GCS create-only object upload failed with HTTP ' + status + '.');
    }
    await response.body?.cancel().catch(() => undefined);
    const persisted = await this.readObject(name, maxBytes);
    if (!persisted) throw new Error('GCS object was not available after create/readback.');
    if (!persisted.equals(Buffer.from(bytes))) {
      throw new Error('Existing or uploaded GCS archive object differs from the expected bytes; refusing overwrite.');
    }
  }

  private async loadAndVerifyLocalSnapshot(snapshot: BackupStorageResult): Promise<LocalSnapshotInfo> {
    const root = resolve(snapshot.directory);
    const rootInfo = await lstat(root);
    if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()) {
      throw new Error('GCS source snapshot directory must be a real directory.');
    }
    const manifestPath = resolve(snapshot.manifestPath);
    if (dirname(manifestPath) !== root || basename(manifestPath) !== 'backup-manifest.json') {
      throw new Error('GCS source manifest must be the generated manifest at the snapshot root.');
    }
    const manifestInfo = await lstat(manifestPath);
    if (!manifestInfo.isFile() || manifestInfo.isSymbolicLink()) {
      throw new Error('GCS source manifest must be a regular file.');
    }
    if (manifestInfo.size > MAX_MANIFEST_BYTES) throw new Error('GCS source manifest exceeds the inspection limit.');
    const manifestBytes = Buffer.from(await readFile(manifestPath));
    let manifest: BackupManifest;
    try { manifest = JSON.parse(manifestBytes.toString('utf8')) as BackupManifest; }
    catch { throw new Error('GCS source manifest is not valid JSON.'); }
    if (!verifyBackupManifest(manifest) || manifest.snapshotId !== snapshot.snapshotId ||
        snapshot.manifest.snapshotId !== snapshot.snapshotId) {
      throw new Error('GCS source manifest failed integrity verification.');
    }
    if (manifest.entries.length < 1 || manifest.entries.length > this.maxFiles) {
      throw new Error('GCS source snapshot exceeds the configured file-count limit.');
    }

    const entries: LocalArchiveEntry[] = [];
    let totalBytes = 0;
    for (const entry of manifest.entries) {
      const relativePath = validateRelativeBackupPath(entry.relativePath);
      let cursor = root;
      const parts = relativePath.split('/');
      for (let index = 0; index < parts.length; index++) {
        cursor = resolve(cursor, parts[index]);
        if (!isWithin(root, cursor) || cursor === root) throw new Error('GCS source snapshot path escaped the snapshot root.');
        const info = await lstat(cursor);
        if (info.isSymbolicLink()) throw new Error('GCS source snapshot contains a symlink.');
        if (index < parts.length - 1 && !info.isDirectory()) throw new Error('GCS source snapshot path contains a non-directory parent.');
        if (index === parts.length - 1 && !info.isFile()) throw new Error('GCS source snapshot entry is not a regular file.');
      }
      const bytes = Buffer.from(await readFile(cursor));
      if (bytes.byteLength > this.maxFileBytes) throw new Error('GCS source snapshot file exceeds the configured size limit.');
      if (!verifyBackupCopy(entry, bytes).verified) throw new Error('GCS source snapshot file failed checksum verification.');
      totalBytes += bytes.byteLength;
      if (totalBytes > this.maxTotalBytes) throw new Error('GCS source snapshot exceeds the configured total-byte limit.');
      entries.push({ entry, path: cursor });
    }
    return { root, manifest, manifestBytes, entries, totalBytes };
  }

  private markerBytes(snapshotId: string, manifestBytes: Buffer, manifest: BackupManifest, totalBytes: number): Buffer {
    const marker = {
      schemaVersion: 1,
      provider: 'google-cloud-storage',
      bucket: this.bucket,
      prefix: this.prefix,
      snapshotId,
      manifestObjectName: safeObjectName(this.prefix, snapshotId, 'backup-manifest.json'),
      manifestSha256: sha256Hex(manifestBytes),
      manifestContentSha256: manifest.manifestSha256,
      fileCount: manifest.entries.length,
      totalBytes,
      originalsModified: false,
    };
    return Buffer.from(JSON.stringify(marker, null, 2) + '\n', 'utf8');
  }

  async archiveSnapshot(snapshot: BackupStorageResult): Promise<SaqlainGoogleCloudStorageArchiveReceipt> {
    await this.assertBucketVersioningEnabled();
    const local = await this.loadAndVerifyLocalSnapshot(snapshot);
    const rootName = this.prefix + '/' + snapshot.snapshotId;
    const completionObjectName = rootName + '/ARCHIVE_COMPLETE.json';
    const manifestObjectName = rootName + '/backup-manifest.json';
    const markerBytes = this.markerBytes(snapshot.snapshotId, local.manifestBytes, local.manifest, local.totalBytes);
    const fileObjects = local.entries.map(localEntry => ({
      localEntry,
      entry: localEntry.entry,
      name: safeObjectName(this.prefix, snapshot.snapshotId, 'files/' + localEntry.entry.relativePath),
    }));
    const expectedObjectCount = fileObjects.length + 2; // manifest and completion marker
    const markerExisting = await this.readObject(completionObjectName, MAX_COMPLETION_MARKER_BYTES);

    if (markerExisting) {
      if (!markerExisting.equals(markerBytes)) {
        throw new Error('Existing GCS completion marker does not match the expected snapshot; refusing overwrite.');
      }
      // A completion marker is a commit record. Never repair or extend an archive
      // after it exists; verify all committed objects and fail closed on any gap.
      for (const { localEntry, entry, name } of fileObjects) {
        const expected = Buffer.from(await readFile(localEntry.path));
        const stored = await this.readObject(name, this.maxFileBytes);
        if (!stored || !stored.equals(expected) || !verifyBackupCopy(entry, stored).verified) {
          throw new Error('Completed GCS archive is incomplete or differs from the approved snapshot.');
        }
      }
      const storedManifest = await this.readObject(manifestObjectName, MAX_MANIFEST_BYTES);
      if (!storedManifest || !storedManifest.equals(local.manifestBytes)) {
        throw new Error('Completed GCS archive manifest is missing or differs from the approved snapshot.');
      }
    } else {
      // Upload each object with a generation-match precondition, then read it
      // back. Existing bytes are accepted only when they match this exact snapshot.
      for (const { localEntry, entry, name } of fileObjects) {
        const bytes = Buffer.from(await readFile(localEntry.path));
        if (!verifyBackupCopy(entry, bytes).verified) throw new Error('Local source snapshot changed during archival.');
        await this.uploadIfAbsentAndVerify(name, bytes, this.maxFileBytes);
      }
      await this.uploadIfAbsentAndVerify(manifestObjectName, local.manifestBytes, MAX_MANIFEST_BYTES);
      // Completion marker is always the final write; retries are safe under
      // ifGenerationMatch=0 and may accept only byte-identical objects.
      await this.uploadIfAbsentAndVerify(completionObjectName, markerBytes, MAX_COMPLETION_MARKER_BYTES);
    }

    return Object.freeze({
      provider: 'google-cloud-storage' as const,
      status: 'VERIFIED' as const,
      bucket: this.bucket,
      prefix: this.prefix,
      snapshotId: snapshot.snapshotId,
      objectCount: expectedObjectCount,
      totalBytes: local.totalBytes,
      manifestSha256: sha256Hex(local.manifestBytes),
      completionObjectName,
      verifiedAt: this.now().toISOString(),
    });
  }
}
