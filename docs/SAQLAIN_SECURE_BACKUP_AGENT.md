# Saqlain Secure Backup Agent

## Scope

`server/saqlainSecureBackupAgent.ts` implements the source-copying Secure Backup Agent and is integrated into `server/saqlainApprovedContinuousBackup.ts`. Each source-copying backup role must use an explicitly configured agent-to-source mapping. The agent reads an approved source, writes a new versioned local snapshot, verifies the persisted manifest and file checksums, and writes a durable hash-chained audit event before it can return `VERIFIED`.

## Safety properties

- Only approved source roots are read; missing source mappings fail closed.
- Symlinks and special files are rejected by the approved-source adapter; file-count and byte limits are configurable.
- Source, backup destination, and audit-log paths must be disjoint. Invalid path relationships are rejected before any write, preventing a misconfigured audit path from writing into protected source data.
- Snapshot IDs are unique/versioned and existing snapshots are never silently reused.
- Persisted manifest metadata and every copied file are checked after writing.
- Success requires a durable audit append. If audit writing fails, the operation cannot return `VERIFIED`.
- Source originals are read-only inputs. Failure handling does not delete partial snapshots or overwrite source files.
- The 30-minute runtime blocks verification/recovery handoff unless all source backup agents and their audit events succeed.

## Runtime integration

The four-role backup team includes three source-copying agents and a separate backup-verification role, plus one Recovery Agent. The Secure Backup Agent handles each source-copying role; the verifier re-reads persisted manifests and file bytes, and Recovery Agent stages verified copies separately. The runtime is started with `npm run backup:service` only after all environment values in `docs/SAQLAIN_BACKUP_DEPLOYMENT.md` are reviewed and configured.

Required server environment values include:

- `SAQLAIN_BACKUP_STORAGE_ROOT`
- `SAQLAIN_RECOVERY_STAGING_ROOT`
- `SAQLAIN_BACKUP_AUDIT_FILE`
- `SAQLAIN_SOURCE_GOUSE_ROOT`
- `SAQLAIN_SOURCE_SAQLAIN_ROOT`
- `SAQLAIN_SOURCE_PROTECTED_ROOT`

Use dedicated directories, a least-privilege service account, restrictive OS permissions, and a separate disk/volume for backup storage where possible. Never point storage or recovery staging into an approved source root.

## Tests

Run `npm test`. `server/saqlainSecureBackupAgent.test.ts` checks verified snapshots and durable audit, preservation of original bytes, rejection of audit paths inside sources, overlapping source/destination paths, and audit-lock failure. Failed or incomplete snapshots are retained for investigation rather than automatically deleted.

## Important production limits

Local snapshots and a hash-chained local audit log do not protect against loss of the entire host or a privileged attacker controlling its storage. Before production reliance, configure off-host/offline replication, independent backup credentials, monitoring and missed-cycle alerts, process supervision, durable job state, retention controls, and a tested restore drill. The agent does not authorize automatic promotion into production; any live restore requires an independently reviewed and approved procedure.
