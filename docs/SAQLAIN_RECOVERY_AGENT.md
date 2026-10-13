# Saqlain Recovery Agent

## Purpose

The Recovery Agent performs a defensive recovery rehearsal against a previously created Saqlain backup snapshot. It verifies the persisted manifest and every file's SHA-256 digest, then copies the verified bytes into a newly created, separate staging snapshot. It does not restore over production files, delete source backups, alter permissions on originals, or grant itself additional privileges.

A successful rehearsal returns `VERIFIED`, but that means only that the copy in staging passed integrity verification. It is not authorization to promote the files into a live environment. A human operator must review and approve any actual restore plan.

## Integration

The Recovery Agent is implemented in `server/saqlainRecoveryAgent.ts` and wired into `server/saqlainApprovedContinuousBackup.ts`, the existing 30-minute backup runtime. The recovery phase runs only after the source snapshots and the backup-verification phase succeed. A missing audit path, missing snapshot, invalid manifest, checksum mismatch, unsafe path, or failed staging write holds recovery. Each rehearsal is recorded in the hash-chained audit log.

## Required inputs

- `sourceSnapshotDirectory`: a completed snapshot directory containing `backup-manifest.json`.
- `stagingRoot`: a real directory reserved for recovery rehearsal. It must not overlap the source snapshot, source directories, or backup destination.
- `auditFilePath`: durable writable audit-log path.
- `recoveryAgentId`: stable name/ID for the Recovery Agent.
- Optional `now` value for deterministic tests.

The continuous service reads the staging and audit paths from its protected server-side configuration. Follow `docs/SAQLAIN_BACKUP_DEPLOYMENT.md`; do not point staging at a live source directory. Use restrictive ownership and permissions and do not run multiple runtime instances against the same local paths.

## Safety guarantees in code

- Source snapshot and manifest are read-only inputs.
- Manifest integrity and each file's byte length and SHA-256 digest are checked before staging.
- Symlink entries and non-regular files are rejected.
- Source and staging paths must be disjoint.
- Staging creates a new snapshot and verifies the copied bytes.
- The returned result fixes `originalsModified: false` and `promotionAllowed: false`.
- The result is durably audited before it is returned.
- Audit failure throws rather than reporting a successful recovery; a regression test deliberately holds the audit lock and confirms no successful result is returned while source bytes remain unchanged.
- Invalid backup data is held for investigation; evidence is not automatically deleted.

## Tests

Run `npm test`. The Recovery Agent tests cover successful staging, preservation of source snapshot bytes, tampered backup detection, overlapping path rejection, and missing audit configuration.

## Production limitations

This is a local recovery rehearsal, not a complete disaster-recovery guarantee. Production still needs off-host/offline replicas, independent storage credentials, a transactional job/state store, process supervision, heartbeat and failure alerts, tested restore procedures, and a human-approved promotion mechanism. Local hash-chained logs are tamper-evident but are not immutable against privileged host access. Do not claim 24/7 recovery or host-loss protection until deployment and restore drills have been independently verified.
