# Saqlain Backup & Recovery Deployment Runbook

## Status

The in-process runtime and approved-source backup/recovery rehearsal are implemented in code. This runbook is a deployment checklist, not evidence that a production service is already running.

## Required environment configuration

Set these values in the service manager's protected environment file. Use absolute paths and a dedicated least-privilege service account.

- `SAQLAIN_BACKUP_STORAGE_ROOT`: destination for immutable-by-policy local snapshots.
- `SAQLAIN_RECOVERY_STAGING_ROOT`: separate destination used only for recovery rehearsals.
- `SAQLAIN_BACKUP_AUDIT_FILE`: path for the hash-chained audit log.
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

After installing dependencies, configuring all six environment variables above, and passing the tests, start the service with `npm run backup:service`. The entrypoint validates that the required values exist, starts an immediate cycle, and schedules subsequent cycles every 30 minutes. Stop it with SIGINT or SIGTERM. Do not start multiple instances against the same local storage and audit paths.

## Continuous operation

Run the service under a process supervisor (for example, systemd or an equivalent managed service). Configure restart-on-failure, bounded restart backoff, restricted filesystem access, log rotation, and alerting for service exit or missed cycles. The runtime's in-process 30-minute timer is not sufficient by itself to guarantee 24/7 operation across process or host restarts.

The entrypoint is now available as `server/saqlainBackupService.ts`, with the `backup:service` package script. It is not yet production-validated and does not provide durable cycle state, a built-in heartbeat monitor, off-host replication, or operator notifications. Treat those as launch blockers for production critical data.

## Incident and recovery rules

- Preserve original source files; do not delete or overwrite them.
- If source reads, snapshot creation, integrity verification, or audit writes fail, hold the cycle and alert an operator.
- Restore only into a separate staging location until an authorized human approves a recovery plan.
- Keep failed and partial snapshots for investigation; do not automatically purge evidence.
- Test recovery after dependency upgrades, storage changes, and any backup-format changes.
