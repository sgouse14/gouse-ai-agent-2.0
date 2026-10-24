# Saqlain Backup & Recovery Deployment Runbook

## Status

The in-process runtime and approved-source backup/recovery rehearsal are implemented in code. This runbook is a deployment checklist, not evidence that a production service is already running.

## Required environment configuration

Set these values in the service manager's protected environment file. Use absolute paths and a dedicated least-privilege service account.

- `SAQLAIN_BACKUP_STORAGE_ROOT`: destination for local snapshots (ephemeral on Cloud Run; never the only durable copy).
- `SAQLAIN_BACKUP_GCS_BUCKET`: owner-provisioned GCS archive bucket. Mandatory on Cloud Run and whenever off-site archival is required.
- `SAQLAIN_BACKUP_GCS_PREFIX`: relative object prefix; defaults to `saqlain-backups`.
- `SAQLAIN_BACKUP_OFFSITE_REQUIRED`: `true` or `false`; Cloud Run implicitly requires off-site archival regardless of this flag.
- `SAQLAIN_RECOVERY_STAGING_ROOT`: separate destination used only for recovery rehearsals.
- `SAQLAIN_BACKUP_AUDIT_FILE`: path for the hash-chained backup/monitoring audit log.
- `SAQLAIN_TASK_QUEUE_FILE`: path to the durable JSON task queue; keep it on persistent storage.
- `SAQLAIN_TASK_QUEUE_AUDIT_PATH`: path for task-queue operator decisions; use a dedicated audit file or a deliberately shared audit path.
- `SAQLAIN_TASK_QUEUE_OPERATOR_TOKENS_JSON`: JSON object mapping operator IDs to unique, high-entropy bearer tokens (minimum 24 characters). Store only in the service manager's protected secret environment, never in source control.
- `SAQLAIN_SOURCE_GOUSE_ROOT`: approved Gouse AI source directory.
- `SAQLAIN_SOURCE_SAQLAIN_ROOT`: approved Saqlain AI source directory.
- `SAQLAIN_SOURCE_PROTECTED_ROOT`: approved protected-files source directory.

Do not point backup or recovery staging at any source directory. Do not use a source directory that contains either destination. Use real directories, not symlink aliases. The runtime must not be started until each path has been reviewed and approved by the operator.

## Google Cloud Storage off-site archive

The secure backup agent has an optional GCS archive adapter for Cloud Run and other environments that require a durable off-host copy. When `K_SERVICE` or `K_REVISION` is present, startup fails closed if `SAQLAIN_BACKUP_GCS_BUCKET` is not configured. In other environments, setting `SAQLAIN_BACKUP_OFFSITE_REQUIRED=true` has the same requirement. If a bucket is configured, each source snapshot is held unless the archive operation succeeds.

Before enabling this:
1. Use an owner-managed bucket in the intended backup region/project, separate from the application runtime's writable local paths.
2. Enable bucket object versioning and verify it remains enabled. The archive adapter checks `versioning.enabled` before writes.
3. Grant the attached Cloud Run service account only the required bucket metadata read and object create/read permissions (for example custom role permissions equivalent to `storage.buckets.get`, `storage.objects.create`, and `storage.objects.get`). Do not grant object deletion to the backup runtime.
4. Configure `SAQLAIN_BACKUP_GCS_BUCKET` and optionally `SAQLAIN_BACKUP_GCS_PREFIX` in the protected service environment. Do not use `GOOGLE_APPLICATION_CREDENTIALS` key files for Cloud Run; the adapter obtains a short-lived access token from the attached service identity.
5. The adapter uploads data files and the manifest with `ifGenerationMatch=0`, reads every object back, verifies exact bytes against the local manifest, and creates `ARCHIVE_COMPLETE.json` last. Existing objects are accepted only when their content is byte-identical; conflicting objects are never overwritten. Partial archives are retained for investigation, with no automatic remote deletion.
6. Test a first archive, an idempotent retry, disabled-versioning denial, mismatched existing object, and remote readback corruption in staging. Independently perform a restore rehearsal from the GCS archive before relying on it for disaster recovery.

Bucket versioning retains prior object generations but does not by itself make the bucket undeletable or immutable against privileged administrators. Configure approved retention/lifecycle controls independently, and keep delete permission away from the runtime service identity. The repository's current adapter archives and verifies snapshots; a production restore workflow from GCS and live Cloud Run IAM/bucket validation remain separate tasks.

## Pre-deployment validation

1. Review the source directories and exclude secrets or data that should not be copied.
2. Create backup and recovery directories on separate paths; set restrictive ownership and permissions.
3. Configure a separate off-host or offline copy destination before relying on this host for disaster recovery.
4. Install the supported Node.js version and project dependencies.
5. Run `npm test` and require a clean result before enabling scheduling.
6. Review the latest cycle report and audit log; verify that recovery remains blocked when any backup or audit write fails.
7. Perform a restore rehearsal into a clean staging directory and compare checksums before approving production use.

## Start command

After installing dependencies, configuring all required environment variables above, and passing the tests, start the service with `npm run backup:service`. The entrypoint validates required backup and queue paths, recovers interrupted locked tasks into `TIMEOUT_REVIEW`, starts an immediate cycle, and schedules subsequent cycles every 30 minutes. The API also requires `SAQLAIN_TASK_QUEUE_OPERATOR_TOKENS_JSON` for operator review actions; without valid credentials and queue/audit paths, those endpoints fail closed. Stop it with SIGINT or SIGTERM. Do not start multiple instances against the same local storage and audit paths.

## Continuous operation

Run the service under a process supervisor (for example, systemd or an equivalent managed service). Configure restart-on-failure, bounded restart backoff, restricted filesystem access, log rotation, and alerting for service exit or missed cycles. The runtime's in-process 30-minute timer is not sufficient by itself to guarantee 24/7 operation across process or host restarts.

The entrypoint is available as `server/saqlainBackupService.ts`, with the `backup:service` package script. Off-site GCS archival is supported and required by startup when running on Cloud Run, but it has not been tested against a live bucket/IAM configuration. The adapter verifies object versioning, uses create-only preconditions, reads back objects, and writes a completion marker last. A GCS restore adapter, live bucket/permission validation, and a supervised restore drill remain open. The monitoring snapshot includes durable queue counts, failed tasks and timeout-review holds, authenticated heartbeat counts, and explicit backup-cycle freshness. A completed backup/recovery cycle older than 45 minutes or a cycle running longer than 45 minutes is reported as `FAILED`; no completed cycle with no active cycle is `HOLD`. The 45-minute limits are initial policy defaults and must be tuned from measured staging cycle duration before production use. These in-process alerts do not page anyone by themselves; configure a separately managed alerting/monitoring service that watches the supervised process and durable logs. Treat those as launch blockers for production-critical data.

## Operational freshness and alert policy

- Backup/recovery cycles are scheduled every 30 minutes. The Saqlain monitoring agent now checks the age of the last completed cycle and the runtime of an active cycle so old successful counts cannot silently mask missed or stuck work.
- Default thresholds are 45 minutes for a stale completed cycle and 45 minutes for an active cycle that has not finished. Tune these after observing staging duration distributions; if a legitimate cycle can exceed the active threshold, raise the limit deliberately and document why.
- Monitoring status and alert text are durably audited. The backup-service entrypoint emits non-healthy alerts to stderr, captured by systemd/journald, through a notification adapter that receives a cycle-scoped idempotency key; adapter failures force HOLD and are audited without logging adapter exception details. This local journal sink is not an external paging integration. The process-local scheduler cannot alert if the host, container, disk, or audit volume is unavailable. Use an independent provider/platform monitor for missed heartbeats, process exit, host loss, and human paging.
- Keep the external alert receiver and its credentials outside this repository and outside the backup process' writeable source paths. Test notification failure, duplicate alerts, escalation ownership, and recovery after alert-service outage.

## Example systemd supervisor (Linux)

A hardened unit template is provided at `deploy/systemd/saqlain-backup.service.example`. It uses a dedicated `saqlain` service account, restarts on process failure, runs from a read-only application tree, makes approved source roots read-only, and grants write access only to the configured backup, recovery, queue, and audit directories. Review and adapt every path before installing it.

1. Install the application and dependencies under `/opt/gouse-ai-agent-2.0` using a deployment-owned account. Verify the service user can read the application and approved source trees but cannot edit them.
2. Create a dedicated `saqlain` system user/group, then create the writable directories with owner `saqlain:saqlain` and restrictive permissions. The example paths are `/var/lib/saqlain/backup`, `/var/lib/saqlain/recovery`, `/var/lib/saqlain/queue`, and `/var/log/saqlain`.
3. Create `/etc/saqlain/backup.env` with the required variables listed above, using exact approved source roots such as `/srv/gouse-ai/source-gouse`, `/srv/gouse-ai/source-saqlain`, and `/srv/gouse-ai/protected-source`. Ensure storage and recovery roots do not overlap sources. Keep the environment file owned by root with mode `0600`; never commit populated values or tokens.
4. Confirm the installed Node.js binary is `/usr/bin/node`, or change `ExecStart` to its verified absolute path. Confirm the chosen paths match the `ReadOnlyPaths` and `ReadWritePaths` in the unit; do not widen writable paths to entire source or application directories.
5. Copy the reviewed unit to `/etc/systemd/system/saqlain-backup.service`, then run `systemctl daemon-reload`, `systemctl enable --now saqlain-backup.service`, and inspect `systemctl status saqlain-backup.service` plus `journalctl -u saqlain-backup.service`. Verify it restarts after a controlled failure and stops cleanly on SIGTERM.
6. Before relying on it, run a supervised staging backup/recovery rehearsal, confirm the audit chain and freshness alerts, and restore from a separate versioned/off-host copy. Use an independent monitoring service for host-down and paging alerts; systemd restart policy does not notify a human by itself.

This is a deployment example only. The repository cannot validate your Linux paths, ownership, systemd version, service-account permissions, or external monitoring integration, and the unit has not been installed or exercised on a host. Do not point it at a production source tree until the owner has reviewed the read/write boundaries.

## Incident and recovery rules

- Preserve original source files; do not delete or overwrite them.
- If source reads, snapshot creation, integrity verification, or audit writes fail, hold the cycle and alert an operator.
- Restore only into a separate staging location until an authorized human approves a recovery plan.
- Keep failed and partial snapshots for investigation; do not automatically purge evidence.
- Test recovery after dependency upgrades, storage changes, and any backup-format changes.

## Secure Backup Agent

Source-copying backup roles run through `server/saqlainSecureBackupAgent.ts`. It validates approved agent/source mapping, rejects overlapping source, backup and audit paths before writes, creates a versioned snapshot, re-verifies the persisted manifest and every file, and requires a durable audit append before reporting `VERIFIED`. An audit failure leaves any created snapshot intact for investigation and prevents a successful handoff. See `docs/SAQLAIN_SECURE_BACKUP_AGENT.md` for the agent contract and test coverage.
