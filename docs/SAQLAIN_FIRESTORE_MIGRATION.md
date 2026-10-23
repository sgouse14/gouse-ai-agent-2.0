# Saqlain Cyber Agent — Firestore migration plan

Status: **initial REST client and transactional audit-chain prototype committed; not yet wired into production route paths and not live-tested against a Google Cloud project.** This is a Saqlain-only migration. Do not infer production readiness from unit tests.

## Implemented in this phase

- `server/saqlainFirestoreRest.ts`: minimal Firestore REST API client, value codec, document reads/listing, atomic commit calls, and Cloud Run metadata-server access-token retrieval. Tests can inject a fetch implementation and token provider.
- `server/saqlainFirestoreAuditLog.ts`: append-only event documents with a compare-and-swap chain-head document. Event plus head update are written in one Firestore commit; competing writers retry bounded precondition conflicts. Read verification checks record hashes, sequence/link continuity, and chain-head consistency.
- `server/saqlainFirestoreRest.test.ts` and `server/saqlainFirestoreAuditLog.test.ts`: codec, identity-provider behavior, append chain, and retry test coverage.
- `.env.example`: documents the optional staging project ID and audit collection name. No credentials are included.

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

The new audit writer is an isolated adapter at this stage. Existing Saqlain routes and services still call the filesystem audit functions, the task queue still uses its file-backed registry, and heartbeats remain in process memory. Setting `GOOGLE_CLOUD_PROJECT` alone does **not** migrate those components to Firestore.

Before enabling this adapter for production operations, complete the following work in isolated steps:

1. Add an explicit `SAQLAIN_AUDIT_BACKEND` switch and a Saqlain-only audit facade that routes Saqlain audit append/read operations to Firestore or the existing local test backend. Keep Gousiya emergency-recovery audit behavior unchanged.
2. Migrate the verification service's state replay to the selected audit backend and ensure the existing local test backend remains deterministic.
3. Implement the queue as transactional Firestore task documents. Allocate IDs safely, enforce allowed transitions in transactions, and use idempotency keys for retried requests. Do not translate the local file lock into an in-memory lock.
4. Implement shared heartbeat documents with server timestamps/expiry and bounded ingestion. Use a distributed gateway/shared quota for rate limits across instances.
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
- [ ] Queue transitions and heartbeat state are shared and transactional/durable.
- [ ] IAM denial and API outage tests prove fail-closed behavior.
- [ ] Independent audit export, alerting, retention, backup and restore are rehearsed.
- [ ] Authorized staging owner reviews evidence before any production rollout.
