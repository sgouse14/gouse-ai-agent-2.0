# Agent lifecycle, Gousiya orchestration, and Communication Agent

**Status:** implementation draft in [PR #10](https://github.com/sgouse14/gouse-ai-agent-2.0/pull/10). Not merged and not production-ready.

## Priority 1 — controlled agent lifecycle

- Added `SaqlainFirestoreAgentRegistry`, a shared Firestore-backed registry with one document per agent, a permanent issued-ID ledger, and append-only audit documents.
- Registration, suspend/reactivate/retire, and task-verified ID rotation use Firestore create/update preconditions and atomic commits so concurrent instances cannot silently overwrite each other.
- Added an owner-only API at `/api/security/agent-registry`. Firebase ID tokens are verified server-side, including current account/revocation status; owner permissions come only from `SAQLAIN_AGENT_REGISTRY_OWNER_UIDS_JSON`, never request-body flags. The API is disabled unless `SAQLAIN_AGENT_REGISTRY_ENABLED=true`.
- Required deployment configuration: `FIREBASE_PROJECT_ID`, `FIREBASE_WEB_API_KEY`, `SAQLAIN_AGENT_REGISTRY_OWNER_UIDS_JSON` (JSON array of trusted Firebase UIDs), `SAQLAIN_AGENT_REGISTRY_ENABLED=true`, and Cloud Run's attached service identity with the minimum Firestore permissions for the configured collections.
- Optional collection settings: `SAQLAIN_AGENT_REGISTRY_COLLECTION`, `SAQLAIN_AGENT_ISSUED_IDS_COLLECTION`, and `SAQLAIN_AGENT_AUDIT_COLLECTION`. All three collection names must be distinct.
- Agent IDs are generated as 128-bit CSPRNG-backed binary strings; retired IDs remain in the no-reuse ledger.
- Registration requires owner approval in the lifecycle domain model.
- Suspension requires a reason and only applies to an active agent.
- Reactivation requires an explicit trusted owner-approval signal and reason; the caller must derive approval from a server-side authorization source.
- Retirement is terminal and clears the approval flag. A retired agent cannot be reactivated.
- `isAgentEligibleForWork` checks active status, owner approval, and exact current binary ID.
- The original `AgentIdentityState` helpers remain process-local domain functions; the new API uses the Firestore registry instead. The ID-rotation method is deliberately not exposed over HTTP and must only be called by a trusted queue/verifier integration after it has independently verified task completion.

## Priority 1 — Gousiya orchestration

- Added a versioned state machine for incident intake, snapshot validation, dual approval, grant issuance, staged recovery, verification, hold, and closure.
- Added `GousiyaFirestoreWorkflowStore` for shared durable workflow state, append-only transition events, and one-time approval-consumption records.
- Workflow snapshots and event records are committed atomically with Firestore create/update preconditions; stale concurrent writes are rejected rather than overwritten.
- Approval references are hashed into a dedicated ledger and consumed in the same atomic commit as grant issuance, preventing reuse across workflows.
- Uses optimistic version checks to reject stale transitions and validates snapshot evidence, distinct owner/reviewer approval IDs, consumed-grant signals, and passing verification evidence.
- Hold/resume is restricted to the stage recorded when the hold was entered.
- The store does not repair files, consume recovery grants itself, or promote staged data into production. A trusted caller must bind evidence and approval references to persisted verifier results.
- Existing Gousiya emergency grant code still requires its configured signing secret, approver registry, grant store, and durable audit paths.

## Priority 1 — Communication Agent

- The internal cycle reporter accepts only the fixed `saq-communication-agent` actor identity.
- Requires 1–500 results, safe agent IDs, bounded non-empty roles, and unique agent IDs.
- Report output stays sanitized and internal-only. This change does not enable arbitrary external messages; the separate external communication adapter still requires approved recipients, authorization, policy approval, and audit-before-delivery.

## Validation gates

- Registry and API tests cover atomic ledger/audit writes, state transitions, ID rotation/replay rejection, owner scoping, and fail-closed authentication.
- Gousiya workflow-store tests cover restart reload, duplicate workflow creation, atomic approval consumption/replay rejection, stale concurrent transitions, and evidence-gated transitions.
- Dedicated GitHub Actions workflow: `.github/workflows/agent-lifecycle-ci.yml`.
- Must pass full automated tests, client/server TypeScript checks, production build, and Docker build.
- Before enabling lifecycle management, set the required deployment environment and Firestore IAM permissions in a staging environment; confirm owner UID allowlist and rollback plan.
- Added an authenticated workflow intake/read API at `/api/security/gousiya/workflows`, with Firebase ID-token and account-status verification, a server-configured owner UID allowlist, creator-scoped reads, and no-store responses.
- The public API intentionally exposes creation and read/event inspection only. It does not expose transitions that could accept client-supplied approval, grant-consumption, or verification flags.
- Still required before operational recovery: a narrowly scoped trusted transition adapter that derives evidence and approval claims from persisted verifier results, plus staging IAM/configuration review. This API does not execute recovery.
