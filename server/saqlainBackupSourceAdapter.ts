import { constants } from 'node:fs';
import { lstat, open, readdir, realpath } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { validateRelativeBackupPath, type BackupFileInput, type BackupManifest } from './saqlainBackupManifest.ts';

export interface BackupSourceLimits {
  maxFiles?: number;
  maxFileBytes?: number;
  maxTotalBytes?: number;
}

export interface BackupSourceReadResult {
  source: BackupManifest['source'];
  root: string;
  files: readonly BackupFileInput[];
  totalBytes: number;
}

/**
 * Read-only adapter for an explicitly configured local source directory.
 * It rejects symlinks and special files, constrains all paths to the configured
 * root, and enforces file/count/total-byte limits. Configure only directories
 * the service account is authorized to back up.
 */
export async function readApprovedBackupSource(input: {
  source: BackupManifest['source'];
  approvedRoots: Partial<Record<BackupManifest['source'], string>>;
  limits?: BackupSourceLimits;
}): Promise<BackupSourceReadResult> {
  const configuredRoot = input.approvedRoots[input.source];
  if (!configuredRoot?.trim()) throw new Error('No approved root configured for source: ' + input.source);

  const maxFiles = input.limits?.maxFiles ?? 10_000;
  const maxFileBytes = input.limits?.maxFileBytes ?? 25 * 1024 * 1024;
  const maxTotalBytes = input.limits?.maxTotalBytes ?? 1024 * 1024 * 1024;
  if (![maxFiles, maxFileBytes, maxTotalBytes].every(Number.isSafeInteger) ||
      maxFiles < 1 || maxFileBytes < 1 || maxTotalBytes < 1) {
    throw new Error('Backup source limits must be positive safe integers.');
  }

  const configuredPath = resolve(configuredRoot);
  const configuredInfo = await lstat(configuredPath);
  if (!configuredInfo.isDirectory() || configuredInfo.isSymbolicLink()) {
    throw new Error('Approved backup root must be a real directory, not a symlink.');
  }
  const root = await realpath(configuredPath);
  const rootInfo = await lstat(root);
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()) {
    throw new Error('Resolved approved backup root must be a real directory.');
  }

  const files: BackupFileInput[] = [];
  let totalBytes = 0;

  function assertInsideRoot(candidate: string): void {
    const rel = relative(root, candidate);
    if (rel === '..' || rel.startsWith('..' + sep) || isAbsolute(rel)) {
      throw new Error('Resolved source path escaped the approved root.');
    }
  }

  async function walk(directory: string, prefix: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (entry.name === '.' || entry.name === '..') continue;
      const absolutePath = resolve(directory, entry.name);
      assertInsideRoot(absolutePath);
      const info = await lstat(absolutePath);
      if (info.isSymbolicLink()) {
        throw new Error('Symlink encountered in approved backup source: ' + (prefix ? prefix + '/' : '') + entry.name);
      }
      const relativePath = validateRelativeBackupPath(prefix ? prefix + '/' + entry.name : entry.name);
      if (info.isDirectory()) {
        await walk(absolutePath, relativePath);
        continue;
      }
      if (!info.isFile()) throw new Error('Special files are not allowed in backups: ' + relativePath);
      if (info.size > maxFileBytes) throw new Error('File exceeds configured size limit: ' + relativePath);
      if (files.length >= maxFiles) throw new Error('Backup source exceeds configured file-count limit.');
      if (totalBytes + info.size > maxTotalBytes) throw new Error('Backup source exceeds configured total-byte limit.');

      const handle = await open(absolutePath, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
      try {
        const bytes = new Uint8Array(await handle.readFile());
        if (bytes.byteLength !== info.size) {
          throw new Error('Source changed while being read; refusing inconsistent snapshot: ' + relativePath);
        }
        totalBytes += bytes.byteLength;
        files.push({ relativePath, bytes });
      } finally {
        await handle.close();
      }
    }
  }

  await walk(root, '');
  if (files.length === 0) throw new Error('Approved backup source contains no regular files.');
  return Object.freeze({ source: input.source, root, files: Object.freeze(files), totalBytes });
}
