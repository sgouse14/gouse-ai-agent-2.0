# Saqlain AI Monitoring Agent

## Purpose

Saqlain AI's monitoring runtime provides read-only health monitoring for the Gouse AI Agent 2.0 backup/recovery service. It collects a snapshot, classifies the result, emits an alert for non-healthy states, and records every cycle in the hash-chained audit log. It runs every 30 minutes while the Node.js process is alive, with an immediate first cycle.

## Integration

- Core policy: `server/saqlainMonitoringAgent.ts`
- Heartbeat freshness helper: `server/saqlainAgentHeartbeat.ts`
- Authenticated ingestion primitive: `server/saqlainHeartbeatIngestion.ts` (validates a registered agent ID against a SHA-256 digest of its provisioned secret using timing-safe comparison)
- Ingestion tests: `server/saqlainHeartbeatIngestion.test.ts`
- Heartbeat tests: `server/saqlainAgentHeartbeat.test.ts`
- Scheduled/audited runtime: `server/saqlainMonitoringRuntime.ts`
- Service integration: `server/saqlainBackupService.ts`
- Tests: `server/saqlainMonitoringRuntime.test.ts`

The backup service starts the monitor and backup/recovery runtime together and stops both on SIGINT and SIGTERM, so graceful shutdown does not leave the monitoring timer running. Monitoring requires the configured `SAQLAIN_BACKUP_AUDIT_FILE` path. An audit failure downgrades the monitoring report to `HOLD`; a collector error or invalid counters also fails closed to `HOLD`.

## Alert policy

- `HEALTHY`: no known failures or holds.
- `WARNING`: no active agents are reported, or no task has completed. A zero-agent snapshot is not treated as healthy.
- `HOLD`: security holds exist, locked tasks exceed active-agent count, or monitoring cannot safely complete.
- `FAILED`: one or more failed tasks are reported.

The current service collector still summarizes the latest in-process backup/recovery cycle and does not yet ingest authenticated heartbeats or connect the queue manager. `summarizeAgentHeartbeats` and `acceptAuthenticatedHeartbeat` provide tested primitives for freshness and credential-checked ingestion. They are not yet wired to an HTTP endpoint or durable store; the current in-memory store is lost on process restart. Do not expose the primitive publicly until per-agent secrets are securely provisioned and the route has rate limiting, TLS, and audit integration. Those values are explicitly estimates/known limitations, not evidence of remote-worker liveness or queue health.

## Security boundaries

The monitoring runtime is observational. It has no callback for deleting or overwriting protected files, changing agent IDs, releasing security holds, changing permissions, or bypassing Gatekeeper/review. It logs `protectedOriginalsModified: false`, `securityHoldsReleased: false`, and `destructiveActionsTaken: false` in each audit event. Alerts inform operators; they do not automatically execute remediation or unlock tasks.

## Run and test

Run the existing configured backup service using `npm run backup:service` after following `docs/SAQLAIN_BACKUP_DEPLOYMENT.md` and configuring all required environment variables. Monitoring starts with the service. Run `npm test` to execute the monitoring runtime tests covering healthy status, failure/hold alerts, collector errors, invalid counters, audit failure, cycle de-duplication, and 30-minute scheduling.

## Production limitations

This is an in-process monitor, not an independent watchdog. It cannot alert if the host or process is completely down, and it does not yet have external metrics, heartbeat probes, queue/database telemetry, notification delivery, or off-host audit replication. Production deployment needs a process supervisor and an independent external heartbeat/alerting service. Do not treat the configured team count as proof that all five agents are online.


## Heartbeat HTTP endpoint

The Express app mounts `POST /api/security/heartbeats`. Send JSON `{"agentId":"<registered-agent-id>"}` and the per-agent secret in the `x-saqlain-agent-token` header. Configure `SAQLAIN_HEARTBEAT_CREDENTIALS_JSON` as a JSON array of `{"agentId":"...","tokenSha256":"<64-char SHA-256 hex digest>"}` records and set `SAQLAIN_AUDIT_FILE` to the durable audit-log path. Provision secrets out of band; never store raw tokens in this JSON.

The endpoint applies a per-agent in-process limit of 60 requests/minute, uses timing-safe digest comparison, and writes a durable audit event before accepting a heartbeat into the in-memory store. It returns 503 if configuration or audit persistence is unavailable and 401 for invalid credentials. Because rate-limit counters and heartbeats are process-local, this is a single-process baseline—not distributed rate limiting or durable heartbeat storage. Put the endpoint behind HTTPS and a trusted proxy, use strong unique secrets, and do not expose the in-process snapshot getter as an HTTP endpoint. Monitoring collector integration and persistent storage remain follow-up work.
