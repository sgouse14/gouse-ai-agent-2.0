import { lstat, readFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { appendDurableAuditEvent } from './saqlainAuditLog.ts';
import { verifyBackupCopy, verifyBackupManifest, type BackupManifest } from './saqlainBackupManifest.ts';
import { runApprovedBackupAgentSnapshot, type ApprovedBackupAgentConfig } from './saqlainApprovedBackupCycle.ts';
import type { BackupStorageResult } from './saqlainBackupStorage.ts';
import type { SaqlainBackupAgent } from './saqlainBackupTeam.ts';

export interface SecureBackupAgentResult {
  decision: 'VERIFIED' | 'HOLD';
  agentId: string;
  source: BackupManifest['source'];
  snapshot: BackupStorageResult | null;
  verifiedFiles: number;
  originalsModified: false;
  reason: string;
}

function isWithin(parent: string, child: string): boolean {
  const rel = relative(resolve(parent), resolve(child));
  return rel === '' || (rel !== '..' && !rel.startsWith('..' + sep) && !isAbsolute(rel));
}
function assertDisjoint(a: string, b: string, label: string): void {
  if (isWithin(a, b) || isWithin(b, a)) {
    throw new Error(label + ' must be separate, non-overlapping paths.');
  }
}

async function verifyStoredSnapshot(snapshot: BackupStorageResult): Promise<number> {
  const rootInfo = await lstat(snapshot.directory);
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()) throw new Error('Snapshot directory must be a real directory.');
  const manifestInfo = await lstat(snapshot.manifestPath);
  if (!manifestInfo.isFile() || manifestInfo.isSymbolicLink()) throw new Error('Snapshot manifest must be a regular file.');
  const manifest = JSON.parse(await readFile(snapshot.manifestPath, 'utf8')) as BackupManifest;
  if (!verifyBackupManifest(manifest) || manifest.snapshotId !== snapshot.snapshotId) {
    throw new Error('Persisted backup manifest failed integrity verification.');
  }
  for (const entry of manifest.entries) {
    let cursor = snapshot.directory;
    for (const part of entry.relativePath.split('/')) {
      cursor = resolve(cursor, part);
      const info = await lstat(cursor);
      if (info.isSymbolicLink()) throw new Error('Symlink found in stored snapshot: ' + entry.relativePath);
    }
    const info = await lstat(cursor);
    if (!info.isFile()) throw new Error('Snapshot entry is not a regular file: ' + entry.relativePath);
    const bytes = new Uint8Array(await readFile(cursor));
    if (!verifyBackupCopy(entry, bytes).verified) throw new Error('Stored snapshot checksum mismatch: ' + entry.relativePath);
  }
  return manifest.entries.length;
}

/**
 * Secure source backup operation. It only reads explicitly approved source roots,
 * writes a new versioned snapshot to a disjoint destination, verifies persisted
 * bytes, and durably audits the result. It never mutates or removes source files.
 */
export async function runSecureBackupAgent(input: {
  agent: SaqlainBackupAgent;
  cycleId: string;
  config: ApprovedBackupAgentConfig;
  auditFilePath: string;
}): Promise<SecureBackupAgentResult> {
  const { agent, cycleId, config, auditFilePath } = input;
  const source = config.sourceByAgentId[agent.id];
  if (agent.role !== 'BACKUP' || agent.id === 'saq-backup-verify') {
    throw new Error('Only source-copying backup agents may run secure backup operations.');
  }
  if (!source) throw new Error('Agent has no explicitly approved source mapping.');
  if (!auditFilePath.trim()) throw new Error('A durable audit path is required.');
  const sourceRoot = config.approvedRoots[source];
  if (!sourceRoot?.trim()) throw new Error('Approved source root is not configured.');
  // Validate every path relationship before any audit or backup write. In
  // particular, an invalid audit path must never cause writes into source data.
  assertDisjoint(sourceRoot, config.storageRoot, 'Source and backup storage');
  assertDisjoint(sourceRoot, auditFilePath, 'Source and audit log');
  assertDisjoint(config.storageRoot, auditFilePath, 'Backup storage and audit log');
  let snapshot: BackupStorageResult | null = null;
  let decision: 'VERIFIED' | 'HOLD' = 'HOLD';
  let verifiedFiles = 0;
  let reason = 'Backup held for review.';
  try {
    snapshot = await runApprovedBackupAgentSnapshot(agent, cycleId, config);
    verifiedFiles = await verifyStoredSnapshot(snapshot);
    decision = 'VERIFIED';
    reason = 'Versioned snapshot and persisted files verified; original source was not modified.';
  } catch (error) {
    reason = error instanceof Error ? error.message : 'Unknown secure backup failure.';
  }
  // Audit is a required part of success: failure propagates and prevents a VERIFIED result.
  await appendDurableAuditEvent(auditFilePath, {
    eventType: 'SAQLAIN_SECURE_BACKUP',
    actorId: agent.id,
    outcome: decision === 'VERIFIED' ? 'ALLOW' : 'HOLD',
    resource: source,
    taskId: cycleId,
    occurredAt: (config.now?.() ?? new Date()).toISOString(),
    details: {
      decision,
      snapshotId: snapshot?.snapshotId ?? null,
      verifiedFiles,
      originalsModified: false,
      reason: reason.slice(0, 1000),
    },
  });
  return { decision, agentId: agent.id, source, snapshot, verifiedFiles, originalsModified: false, reason };
}
