# Saqlain Cyber Agent — Firestore migration plan

Status: **Firestore REST client, audit-chain prototype, selected Saqlain audit call sites, Firestore heartbeat store, operator queue, enqueue idempotency, and queue recovery/monitoring backend selection are implemented. Not live-tested against a Google Cloud project; end-to-end queue-driven backup execution remains incomplete.** This is a Saqlain-only migration. Do not infer production readiness from unit tests.

## Implemented in this phase

- `server/saqlainAuditBackend.ts`: explicit Saqlain-only backend selector; file mode remains the local default and Firestore mode routes Saqlain audit append/read through the shared collection. Gousiya recovery still uses its existing file functions. The security-summary route and verification service are wired to this facade.
- `server/saqlainFirestoreRest.ts`: minimal Firestore REST API client, value codec, document reads/listing, atomic commit calls, and Cloud Run metadata-server access-token retrieval. Tests can inject a fetch implementation and token provider.
- `server/saqlainFirestoreAuditLog.ts`: append-only event documents with a compare-and-swap chain-head document. Event plus head update are written in one Firestore commit; competing writers retry bounded precondition conflicts. Read verification checks record hashes, sequence/link continuity, and chain-head consistency.
- `server/saqlainFirestoreRest.test.ts` and `server/saqlainFirestoreAuditLog.test.ts`: codec, identity-provider behavior, append chain, and retry test coverage.
- `server/saqlainFirestoreTaskQueueService.ts`: Firestore queue requires a stable idempotency key scoped to the actor and backup-task payload. The task document, sequence counter, and idempotency marker are created in one atomic commit; same-key/same-request retries return the original task, and mismatched reuse is rejected.
- Firestore queue state transitions now fail closed when a task read lacks update-time metadata, rather than attempting an unconditional write.
- `server/saqlainBackupService.ts`: selects the Firestore queue when `SAQLAIN_AUDIT_BACKEND=firestore` and awaits queue recovery/count operations. The file-backed queue remains the local/file-mode default.
- Regression tests cover absent update-time metadata, idempotent retry, mismatched payload/operator reuse, and concurrent same-key enqueue attempts using an in-memory client.
- `.env.example`: documents the optional staging project ID, audit/heartbeat/queue collection names, and backend selection. No credentials are included.

## Firestore layout

Use the dedicated staging project's default Firestore database initially, unless the cloud owner has approved a named database. The default collection is `saqlainAuditEvents`.

- `saqlainAuditEvents/{12-digit-sequence}-{random-event-id}`: one immutable audit record per event, including schema version, sequence, timestamp, actor, outcome, previous hash, and record hash.
- `saqlainAuditEvents/chain-head`: current sequence and record hash, updated atomically with the event document.

The chain head is a concurrency-control document, not an independent source of truth. Readers must verify the entire event sequence and compare the final record to the head. Firestore administrators can still alter or delete data; use restrictive IAM, Cloud Audit Logs, retention controls, and an independent export/replication path for stronger tamper evidence.

## Required Cloud Run identity and configuration

1. Create/choose a dedicated non-production Google Cloud project and enable the Firestore API.
2. Create the Firestore database with the approved region and retention/data-location policy. Firestore location cannot be casually changed after creation.
3. Attach a dedicated runtime service account to the Cloud Run service. Grant only the required Firestore data access (for example, `roles/datastore.user`) in the staging project; do not use a downloaded service-account key.
4. Set `GOOGLE_CLOUD_PROJECT` to the staging project ID. Optionally set `SAQLAIN_FIRESTORE_AUDIT_COLLECTION` if the approved collection name differs.
5. Keep all credentials and operator tokens out of frontend `VITE_*` variables. No live secret values belong in GitHub, logs, or this guide.
6. Test from the deployed Cloud Run revision. Unit tests with injected credentials are not a substitute for verifying metadata-server access, IAM, API enablement, quotas, region, or live failure behavior.

## Important current limitation

The audit facade is wired into the security-summary route, verification service, and task-queue decision audit paths. The operator task-queue API selects the Firestore service when `SAQLAIN_AUDIT_BACKEND=firestore`; state updates use Firestore update-time preconditions, and enqueue atomically creates the task, sequence update, and actor-scoped idempotency record.

The backup service now chooses the same configured queue backend for startup interrupted-task recovery and monitoring queue counts; asynchronous Firestore calls are awaited. **The actual periodic backup/recovery agent cycle is still run by the existing in-process runtime and is not yet fully driven by Firestore task enqueue/lock/complete operations.** End-to-end worker/queue integration therefore remains incomplete. Heartbeat storage can be shared through Firestore, but request rate limiting remains per-process. Do not assume all Saqlain audit call sites or worker state have migrated. Setting `GOOGLE_CLOUD_PROJECT` alone does **not** enable Firestore without selecting the backend and provisioning IAM/API access.

Before enabling this adapter for production operations, complete the following work in isolated steps:

1. Verify the `SAQLAIN_AUDIT_BACKEND` switch and audit facade across all remaining Saqlain audit call sites. Keep Gousiya emergency-recovery audit behavior unchanged.
2. Validate verification-service audit replay against Firestore and the local file backend, including restart behavior and fail-closed handling.
3. Finish connecting actual backup/recovery job execution to the async Firestore queue; current worker changes align startup recovery and monitoring counts, but do not yet enqueue/lock/complete each backup job through Firestore. Exercise concurrent writers, lost responses, and retry behavior against Firestore or the emulator. Do not translate the local file lock into an in-memory lock. The in-memory client tests are not live Firestore validation.
4. Heartbeat documents are now shared by agent ID when the Firestore backend is selected. Still implement server-side timestamps/expiry policy, distributed gateway/shared quotas for rate limits across instances, and alerting for stale/missing heartbeats.
5. Add emulator or integration tests for two concurrent writers, lost responses/retries, partial failure, stale chain head, tampering/deletion, IAM denial, API outage, and recovery.
6. Run a staging migration rehearsal: export/verify current audit history, choose a cutover boundary, preserve the original evidence read-only, write and verify test events, restart/scale instances, and rehearse rollback. Never silently merge two independent hash chains.
7. Add independent off-project audit export and backup/restore validation before production promotion.

## Failure and security contract

- Storage or IAM failure must deny/hold audited operations; never grant access as a fallback.
- Do not log access tokens, bearer credentials, full HTTP authorization headers, or raw secrets.
- Retry only bounded, recognized contention/precondition conflicts. Do not retry authorization failures or arbitrary malformed requests indefinitely.
- Use server-side Firestore security rules/IAM and least-privilege service identity; never give client/browser code access to this service collection.
- Do not claim tamper-proof storage: a privileged project administrator can still change Firestore records. Independent audit export and organizational controls are required.
- Keep the file backend as an explicit local-test/development option only after the route integration is complete; production must fail closed if the configured backend is missing or unavailable.

## Rollout gate

- [ ] CI passes on the latest branch commit.
- [ ] Live staging Cloud Run revision can acquire identity tokens and read/write Firestore with the dedicated service account.
- [ ] Firestore audit facade is wired into Saqlain routes only; Gousiya behavior is unchanged.
- [ ] Audit chain survives parallel writes, revision replacement, and service restart.
- [ ] Queue transitions and heartbeat state are shared and transactional/durable in the configured staging environment; unit tests alone do not satisfy this gate.
- [ ] Actual backup/recovery job production, locking, completion, and restart reconciliation use the shared Firestore queue end to end.
- [ ] IAM denial and API outage tests prove fail-closed behavior.
- [ ] Independent audit export, alerting, retention, backup and restore are rehearsed.
- [ ] Authorized staging owner reviews evidence before any production rollout.
