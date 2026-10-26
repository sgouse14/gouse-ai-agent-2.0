# Shared Durable State and Reliability

**Status:** incremental reliability work; not a production-readiness approval  
**Tracking issue:** [#3 — Implement shared durable state and reliability](https://github.com/sgouse14/gouse-ai-agent-2.0/issues/3)

## What the uploaded project already has

- The application is a TypeScript/React client with an Express server.
- The client uses Firebase Authentication. Protected API requests carry Firebase ID tokens, and the server verifies identity and checks the configured project-membership registry for project-scoped API routes.
- Saqlain has a Firestore REST adapter using the runtime's attached cloud service identity, plus Firestore-backed audit, heartbeat, and task-queue components.
- Firestore queue writes use document preconditions, bounded contention retries, and an idempotency record for enqueue operations.
- File-based audit logs are hash-chained and validated on read; a Firestore audit chain has a compare-and-swap head.

These facilities form a useful base, but they do not yet mean all application data is shared or durable.

## Incremental changes in this branch

- `GET /healthz` remains a lightweight liveness response and does not claim dependencies are healthy.
- `GET /readyz` is a separate readiness probe. It checks the configured Saqlain audit backend, verifies an existing file audit chain, checks basic file storage access in file mode, and probes Firestore connectivity and the Firestore audit chain in Firestore mode.
- Readiness returns only a generic state and dependency category; it does not expose cloud errors, project secrets, or credentials.
- Tests cover invalid backend configuration, missing audit configuration, inaccessible file paths, corrupted audit history, missing Firestore project configuration, and an injected Firestore probe failure.

Configure `SAQLAIN_AUDIT_BACKEND=file` with `SAQLAIN_AUDIT_FILE` for a local file-backed environment, or `SAQLAIN_AUDIT_BACKEND=firestore` with `GOOGLE_CLOUD_PROJECT` or `FIREBASE_PROJECT_ID` and least-privilege runtime IAM for Firestore. Keep cloud credentials out of frontend `VITE_*` variables and do not commit secret values.

## Known gaps that remain open

1. The main workspace state in `src/App.tsx`—projects, active project, BOQ items, professionals, and enquiries—is still stored in browser `localStorage`. Data is not yet synchronized through a shared server-side workspace API.
2. Other components also write project-specific preferences and material data directly to `localStorage`; the full set of data domains needs to be inventoried before migration.
3. The migration must preserve existing browser data, provide export/import and an idempotent cutover, and enforce server-side user/project ownership. Firebase sign-in alone does not provide workspace membership.
4. A record-size and concurrency strategy is required; one large document per user is not an acceptable assumption for unbounded BOQ/project files. Updates should use per-record documents and version/precondition checks or another tested transaction pattern.
5. The periodic backup/recovery runtime still needs complete queue-driven enqueue/lock/execute/complete integration. Existing work covers queue backend selection for interrupted-task recovery and monitoring counts; do not imply all backup execution is routed through the shared Firestore queue.
6. Some rate limiting remains process-local and does not provide a shared quota across multiple instances.
7. A successful readiness probe checks the configured Saqlain audit path, not every AI provider, every API, or the still-local browser workspace. Live Cloud Run/Firestore IAM and multi-instance failure tests must be run in staging before production use.

## Next delivery order

1. Add a user-scoped workspace repository/API using the existing verified Firebase identity boundary and a provisioned shared data store.
2. Add strict schema validation, document-level concurrency/version checks, user/project ownership tests, and storage-outage tests.
3. Add a protected export/import migration for existing localStorage data. Keep the local copy intact until the imported data is verified and a rollback has been rehearsed.
4. Move data domains incrementally instead of attempting a silent one-step switch; remove browser-only writes only after each domain has been validated.
5. Finish end-to-end backup queue integration, shared rate limiting where required, staging IAM checks, backup/restore rehearsal, and CI.

## Validation record

The focused readiness tests have been run with Node's built-in test runner. Full dependency installation, the complete test suite, TypeScript checks, production build, Docker build, and live cloud integration have not been verified as part of this change. A passing unit test is not a substitute for CI or staging validation.
