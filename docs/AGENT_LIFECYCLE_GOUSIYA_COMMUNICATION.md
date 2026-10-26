# Agent lifecycle, Gousiya orchestration, and Communication Agent

**Status:** implementation draft in [PR #10](https://github.com/sgouse14/gouse-ai-agent-2.0/pull/10). Not merged and not production-ready.

## Priority 1 — controlled agent lifecycle

- Agent IDs are generated as 128-bit CSPRNG-backed binary strings; retired IDs remain in the no-reuse ledger.
- Registration requires owner approval in the lifecycle domain model.
- Suspension requires a reason and only applies to an active agent.
- Reactivation requires an explicit trusted owner-approval signal and reason; the caller must derive approval from a server-side authorization source.
- Retirement is terminal and clears the approval flag. A retired agent cannot be reactivated.
- `isAgentEligibleForWork` checks active status, owner approval, and exact current binary ID.
- Lifecycle operations currently mutate the supplied `AgentIdentityState` object. The caller must atomically persist the registry, ID ledger, and audit event. This PR does **not** yet add a durable registry adapter or authenticated HTTP management API, so the new functions alone are not a production lifecycle service.

## Priority 1 — Gousiya orchestration

- Added a versioned state machine for incident intake, snapshot validation, dual approval, grant issuance, staged recovery, verification, hold, and closure.
- Uses optimistic version checks to reject stale transitions.
- Requires snapshot evidence, distinct owner/reviewer approval IDs, a trusted consumed-grant signal, and a passing verification reference.
- Hold/resume is restricted to the stage recorded when the hold was entered.
- The state machine does not repair files, consume grants itself, or promote staged data into production. A trusted caller must bind each supplied signal to persisted results and atomically save the new workflow record and audit event.
- Existing Gousiya emergency grant code still requires its configured signing secret, approver registry, grant store, and durable audit paths.

## Priority 1 — Communication Agent

- The internal cycle reporter accepts only the fixed `saq-communication-agent` actor identity.
- Requires 1–500 results, safe agent IDs, bounded non-empty roles, and unique agent IDs.
- Report output stays sanitized and internal-only. This change does not enable arbitrary external messages; the separate external communication adapter still requires approved recipients, authorization, policy approval, and audit-before-delivery.

## Validation gates

- Dedicated GitHub Actions workflow: `.github/workflows/agent-lifecycle-ci.yml`.
- Must pass full automated tests, client/server TypeScript checks, production build, and Docker build.
- Before enabling lifecycle management, implement and test durable atomic storage, authenticated owner/reviewer APIs, cross-instance race handling, and startup recovery of registry state.
- Before using Gousiya orchestration operationally, add an integration adapter that persists workflow transitions with audit atomically and derives evidence flags from trusted services rather than request payloads.
