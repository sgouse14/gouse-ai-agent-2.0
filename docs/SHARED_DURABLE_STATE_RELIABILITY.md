# Shared Durable State and Reliability

**Status:** first shared-workspace API and client sync implementation added in [draft PR #8](https://github.com/sgouse14/gouse-ai-agent-2.0/pull/8); full CI and cloud/staging validation still required. Not a production-readiness approval.  
**Tracking issue:** [#3 — Implement shared durable state and reliability](https://github.com/sgouse14/gouse-ai-agent-2.0/issues/3)

## Existing foundations

- TypeScript/React client with an Express server.
- Firebase Authentication. Protected API requests carry Firebase ID tokens; the server verifies identity and checks configured project membership for project-scoped APIs.
- Firestore REST adapter using the runtime's attached cloud service identity, plus Firestore-backed audit, heartbeat, and task-queue components.
- Firestore queue writes use document preconditions and idempotency records.
- File and Firestore audit logs have integrity verification.

## Implemented in this branch (PR #8, not merged)

### Readiness
- `GET /healthz` remains lightweight liveness.
- `GET /readyz` checks the configured Saqlain audit backend and returns sanitized `503 not_ready` on failure.
- File mode checks path access and the existing hash-chained audit log. Firestore mode checks project configuration, connectivity, and audit-chain readability.

### Shared workspace API and browser synchronization
- Added `GET /api/workspace-state/:domain` and `PUT /api/workspace-state/:domain`. These routes are mounted behind the existing Firebase token middleware and derive the storage owner from the server-verified Firebase UID; clients cannot choose an owner UID.
- Initial domains are `projects`, `boqItems`, `professionals`, `enquiries`, and `preferences`.
- Firestore documents are separated by UID and domain. Writes use POST with Firestore update-time preconditions and an application version token; stale writes return `409` instead of silently replacing newer data.
- Payloads are capped at 700,000 UTF-8 bytes per domain before persistence. This is an initial bounded-domain design, not a solution for unbounded project/BOQ histories; larger domains should move to record-level documents.
- The React app attempts to load each shared domain on startup. If a domain is absent, it attempts an initial import from the normalized in-memory browser state. The localStorage data remains in place as a local recovery copy.
- Before sync, the app retains a snapshot; a visible **Export local backup** action downloads current local data and available recovery snapshots as JSON.
- Before synchronization, the client saves a local snapshot. A Firebase UID marker prevents local data already associated with one user from being imported into another user's workspace on the same browser. A different UID starts from the default data and retains a UID-specific local backup when browser storage permits.
- The UI reports whether the shared workspace is connected, syncing, local-only, or blocked by a concurrency conflict. If storage is unavailable, local edits remain in the browser and are explicitly not reported as shared.

## Important limits

1. This implementation is user-scoped: it synchronizes the same user's data across their signed-in devices/instances. It does not yet implement collaborative project sharing between different users, even if project member metadata exists in the UI.
2. The browser still retains localStorage copies and some other components keep their own local preferences/material state. This is a dual-write/migration stage, not a completed removal of browser storage.
3. Each domain currently occupies one Firestore document with a 700,000-byte application cap. The app should move to per-record documents with parent ownership checks before large project files/BOQs exceed that bound.
4. The client migration path and service tests are committed, but full TypeScript/build/CI execution and live Cloud Run/Firestore validation have not yet been verified for PR #8. Do not enable a production cutover until CI and staging checks pass.
5. The periodic backup/recovery runtime still needs complete queue-driven enqueue/lock/execute/complete integration. Existing work covers queue backend selection for interrupted-task recovery and monitoring queue counts; it does not mean all backup execution uses the shared Firestore queue.
6. Some rate limiting remains process-local. A successful readiness probe checks the configured Saqlain audit path, not every AI provider or every application dependency.
7. Live Firestore IAM, multi-instance conflict behavior, API outage, migration rollback, backup/restore, and independent host-down alerting need staging validation.

## Next steps

1. Run full tests, server/client TypeScript checks, production build, and Docker build on PR #8; fix every regression.
2. Validate Firestore runtime IAM and multi-instance compare-and-swap behavior in staging, including outage and recovery.
3. Test import from real legacy localStorage data, UID switching in the same browser, conflict handling, export/restore, and large-domain rejection.
4. Split large domains into record-level documents before production-scale use and add collaborative project access only with explicit server-side membership checks.
5. Finish end-to-end backup queue integration, shared rate limiting where required, GCS restore adapter, backup/restore rehearsal, and external host-down paging.

## CI automation

Added `.github/workflows/shared-state-ci.yml` to run the complete test suite, client/server TypeScript checks, production build, and Docker image build on pull requests, pushes to the shared-state branch, and manual dispatch. The first run failed before dependency installation because setup-node was configured to cache a missing npm lockfile. The repository does have a committed `bun.lock`, so CI now uses `oven-sh/setup-bun` and `bun install --frozen-lockfile` to install the locked dependencies. The corrected run is pending. HTTP route integration tests were added to `npm test` and still need CI execution.

## Validation record

Eight focused backend unit tests passed locally: four readiness tests and four workspace-service tests covering user/domain isolation, optimistic concurrency conflicts, oversized data, and owner mismatch. A server TypeScript check was attempted but could not start because this environment lacks `@types/node`; dependency installation/network access is unavailable here. The React integration and route wiring have not passed a full typecheck/build/CI run. Full suite/typecheck/build and live cloud integration are **not yet verified**.
