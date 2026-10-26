# Shared Durable State and Reliability

**Status:** design and audit in progress  
**Tracking issue:** [#3 — Implement shared durable state and reliability](https://github.com/sgouse14/gouse-ai-agent-2.0/issues/3)

## Why this work is needed

The current application has important workspace and identity state persisted in browser storage. That survives a reload in one browser profile, but it is not a shared source of truth: another device or browser cannot see the same state, clearing site data can lose it, and concurrent sessions can diverge. Browser storage must not be treated as an authentication or authorization boundary.

## Initial audit findings

- The active runtime is a TypeScript/React client with an Express server (package.json, src/, server.ts).
- src/App.tsx reads and writes projects, active project ID, BOQ items, professionals, and enquiries through localStorage.
- src/context/AuthContext.tsx persists the registered user list and current user ID in localStorage. Login currently matches by email and the password parameters are unused; this is demo-mode identity, not server-validated authentication.
- server.ts exposes AI/business endpoints and lightweight liveness endpoints, but there is no visible durable application-data API or database integration in the inspected runtime.
- The root README and Dockerfile describe a separate Python/FastAPI layout that does not match the current package.json scripts and source tree. Runtime/deployment documentation needs to be reconciled before rollout.
- /healthz and /ping are liveness-style checks. They should not be presented as proof that a database or other critical dependency is ready.

These findings mean the first implementation should avoid silently switching storage formats or presenting browser-only data as shared. A migration and compatibility approach is required.

## Proposed target architecture

1. **Shared durable database:** use a managed PostgreSQL-compatible database, configured through DATABASE_URL, as the source of truth for workspace records. Confirm hosting and operational constraints before selecting the final provider. Do not use process memory or a local SQLite file as the shared production store for horizontally scaled instances.
2. **Storage boundary:** introduce a typed server-side repository/service layer so route handlers do not build SQL or persistence logic ad hoc. Keep request validation and persistence errors explicit.
3. **Tenant and user ownership:** every persisted workspace object must be scoped to a verified server-side identity/tenant. Do not trust a client-supplied user ID as authorization.
4. **Authentication prerequisite:** replace demo-only client-side identity with server-validated authentication before exposing shared records. Passwords must never be stored in browser storage; use a maintained identity provider or well-reviewed password/session implementation.
5. **Concurrency and correctness:** use database transactions and unique constraints for invariants. Add optimistic concurrency/version fields where edits can race, and return a clear conflict response instead of silently overwriting newer data.
6. **Migrations and recovery:** version schema migrations, back up existing local data before import, make import idempotent, and document backup/restore and rollback procedures.
7. **Reliability and observability:** provide separate liveness and readiness checks; expose dependency status without leaking credentials or internal connection details. Apply timeouts to external calls, retry only transient/idempotent operations with bounded backoff, and return non-success responses when durable writes fail.
8. **Tests:** include unit tests for repository behavior, integration tests against a disposable database, and API tests for authorization, persistence after restart, concurrent edits, migration/idempotency, and database outage behavior.

## Phased delivery

### Phase 0 — Audit and decisions
- Confirm runtime, deployment target, current data shapes, and all browser-storage consumers.
- Choose the database provider and identity strategy.
- Define the migration/export format and backward-compatibility boundary.

### Phase 1 — Durable state foundation
- Add database configuration and connection lifecycle handling.
- Add schema migrations and typed repositories.
- Add readiness reporting and safe error mapping.
- Add integration-test infrastructure.

### Phase 2 — Data and identity migration
- Introduce authenticated API endpoints and enforce ownership on the server.
- Migrate one data domain at a time, starting with projects, then BOQ items, professionals, and enquiries.
- Preserve local data export/import during transition; do not delete local data after a failed migration.

### Phase 3 — Hardening
- Add concurrency controls, audit metadata, backup/restore runbooks, and failure-injection tests.
- Update README, Docker/deployment instructions, health-check guidance, and operational metrics.
- Remove legacy browser-only writes only after compatibility checks and migration coverage pass.

## Acceptance criteria

- Workspace data is available across authorized devices and instances and survives application restarts.
- Tenant/user authorization is enforced server-side for every read and write.
- Concurrent writes cannot silently erase newer updates.
- Data migration is repeatable, observable, and recoverable from a backup.
- Storage outages produce clear errors and failed writes never appear successful.
- Liveness and readiness are distinct, tested, and accurately documented.
- CI covers persistence, authorization, concurrency, migration, and failure cases.
- Documentation reflects the TypeScript/Express runtime actually shipped.
