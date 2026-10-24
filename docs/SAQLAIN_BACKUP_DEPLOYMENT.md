# Saqlain Backup & Recovery Deployment Runbook

## Status

The in-process runtime and approved-source backup/recovery rehearsal are implemented in code. This runbook is a deployment checklist, not evidence that a production service is already running.

## Required environment configuration

Set these values in the service manager's protected environment file. Use absolute paths and a dedicated least-privilege service account.

- `SAQLAIN_BACKUP_STORAGE_ROOT`: destination for immutable-by-policy local snapshots.
- `SAQLAIN_RECOVERY_STAGING_ROOT`: separate destination used only for recovery rehearsals.
- `SAQLAIN_BACKUP_AUDIT_FILE`: path for the hash-chained backup/monitoring audit log.
- `SAQLAIN_TASK_QUEUE_FILE`: path to the durable JSON task queue; keep it on persistent storage.
- `SAQLAIN_TASK_QUEUE_AUDIT_PATH`: path for task-queue operator decisions; use a dedicated audit file or a deliberately shared audit path.
- `SAQLAIN_TASK_QUEUE_OPERATOR_TOKENS_JSON`: JSON object mapping operator IDs to unique, high-entropy bearer tokens (minimum 24 characters). Store only in the service manager's protected secret environment, never in source control.
- `SAQLAIN_SOURCE_GOUSE_ROOT`: approved Gouse AI source directory.
- `SAQLAIN_SOURCE_SAQLAIN_ROOT`: approved Saqlain AI source directory.
- `SAQLAIN_SOURCE_PROTECTED_ROOT`: approved protected-files source directory.

Do not point backup or recovery staging at any source directory. Do not use a source directory that contains either destination. Use real directories, not symlink aliases. The runtime must not be started until each path has been reviewed and approved by the operator.

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

The entrypoint is available as `server/saqlainBackupService.ts`, with the `backup:service` package script. It is not yet production-validated and does not provide durable cycle state, off-host replication, or independent host-down notifications. The monitoring snapshot includes durable queue counts, failed tasks and timeout-review holds, authenticated heartbeat counts, and explicit backup-cycle freshness. A completed backup/recovery cycle older than 45 minutes or a cycle running longer than 45 minutes is reported as `FAILED`; no completed cycle with no active cycle is `HOLD`. The 45-minute limits are initial policy defaults and must be tuned from measured staging cycle duration before production use. These in-process alerts do not page anyone by themselves; configure a separately managed alerting/monitoring service that watches the supervised process and durable logs. Treat those as launch blockers for production-critical data.

## Operational freshness and alert policy

- Backup/recovery cycles are scheduled every 30 minutes. The Saqlain monitoring agent now checks the age of the last completed cycle and the runtime of an active cycle so old successful counts cannot silently mask missed or stuck work.
- Default thresholds are 45 minutes for a stale completed cycle and 45 minutes for an active cycle that has not finished. Tune these after observing staging duration distributions; if a legitimate cycle can exceed the active threshold, raise the limit deliberately and document why.
- Monitoring status and alert text are durably audited. This process-local scheduler cannot alert if the host, container, disk, or audit volume is unavailable. Use an independent provider/platform monitor for missed heartbeats, process exit, host loss, and human paging.
- Keep the external alert receiver and its credentials outside this repository and outside the backup process' writeable source paths. Test notification failure, duplicate alerts, escalation ownership, and recovery after alert-service outage.

## Incident and recovery rules

- Preserve original source files; do not delete or overwrite them.
- If source reads, snapshot creation, integrity verification, or audit writes fail, hold the cycle and alert an operator.
- Restore only into a separate staging location until an authorized human approves a recovery plan.
- Keep failed and partial snapshots for investigation; do not automatically purge evidence.
- Test recovery after dependency upgrades, storage changes, and any backup-format changes.

## Secure Backup Agent

Source-copying backup roles run through `server/saqlainSecureBackupAgent.ts`. It validates approved agent/source mapping, rejects overlapping source, backup and audit paths before writes, creates a versioned snapshot, re-verifies the persisted manifest and every file, and requires a durable audit append before reporting `VERIFIED`. An audit failure leaves any created snapshot intact for investigation and prevents a successful handoff. See `docs/SAQLAIN_SECURE_BACKUP_AGENT.md` for the agent contract and test coverage.
