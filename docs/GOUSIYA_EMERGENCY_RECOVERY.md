# Gousiya Emergency Recovery System

## Purpose and safety boundary

Gousiya is a defensive break-glass coordinator for rehearsing recovery from a verified backup into a separate staging directory. It does **not** restore over live files, delete protected originals, disable security controls, escalate privileges, attack external systems, bypass audit, or promote staged content into production.

Implementation:
- `server/gousiyaEmergencyRecovery.ts` — grant lifecycle, durable state and staging-only execution.
- `server/gousiyaFirebaseApprovalVerifier.ts` — Firebase ID-token signature/claim verification for scoped approvals.
- `server/gousiyaEmergencyRuntime.ts` — fail-closed configuration factory. It is not mounted as an HTTP route.

## Operational procedure

### 1. Declare and scope the incident

- Assign a unique incident ID and record the incident commander/operator.
- Record the failure and business impact, the affected service/project, recovery objective, and why normal recovery is insufficient.
- Identify the exact backup snapshot ID and its trusted source. Do not use a client-uploaded or otherwise untrusted directory as a recovery source.
- Choose a new, separate staging directory. Do not point staging at the source snapshot, a live application directory, or an audit directory.
- Confirm the Recovery Agent ID is an approved agent identity. Do not create or elevate identities as part of emergency recovery.

### 2. Obtain and verify two-person approval

Both approvals are required: the system owner and an independent reviewer. They must be two distinct authenticated people with the appropriate roles. The module now requires separate approval tokens and a trusted, server-injected `verifyApprovalToken` function. That verifier must validate the token issuer, signature, audience, expiry, and authoritative approval claims; it must not derive identity or role from request-body fields. The module independently checks the returned decision, role, distinct subject IDs, incident, recovery agent, source path, staging path, and approval validity window.

The returned `VerifiedGousiyaApproval` claims are only as trustworthy as the configured verifier. Do not configure a fake or permissive verifier in production. Approval records and approver identities are written to the hash-chained audit log. Never accept approval booleans directly from an untrusted client.

The current verifier cryptographically checks Firebase ID-token signatures against Google's published signing certificates and validates Firebase issuer, audience, expiry, issue time, recent authentication, and the scoped `gousiyaApproval` claim. That claim must be minted only by a trusted server-side approval service; ordinary client input must never be translated into these claims. Approval IDs are then reserved in the durable grant store to prevent a signed approval from issuing a second grant.

**Known blocker:** this verifier does not call Firebase Admin Auth to check disabled accounts or revoked ID tokens. Before production use, add an authoritative account/revocation check (for example, Firebase Admin `verifyIdToken(token, true)` with correctly provisioned server credentials) or an equivalent trusted identity-status service. Until then, treat this feature as a staging/test implementation only.

### 3. Preflight checks

Before issuing a grant, the incident commander and reviewer must confirm:

- The backup snapshot and manifest come from the trusted backup process.
- The source and staging paths are separate and non-overlapping; neither path resolves through an unexpected symlink.
- The audit destination is durable, writable, protected, and separate from source and staging.
- The Recovery Agent is available and its manifest, checksum, path traversal, and symlink validation remain enabled.
- The storage location has sufficient space and least-privilege permissions.
- No operator is asking to suppress a security hold, skip integrity verification, change Gatekeeper policy, or promote staged files directly to live service.

If any check cannot be established, stop and escalate to the incident commander. Do not lower the controls to make the rehearsal proceed.

### 4. Issue and execute a one-time grant

The API remains an internal server-side module, not an HTTP endpoint. The runtime factory requires these server environment variables: `FIREBASE_PROJECT_ID`, `GOUSIYA_AUDIT_FILE_PATH`, and `GOUSIYA_GRANT_STORE_FILE_PATH`. The grant registry is now stored in a durable JSON file with restrictive file permissions, an exclusive sibling lock, schema validation, fsync, and atomic rename. Mutations reload the store while holding the lock; a malformed store or lock conflict fails closed. This is a **single-host file-store adapter**, not a substitute for a transactional database on multi-host/network deployments. When used in a controlled test/rehearsal environment:

1. Issue a grant only after the two approval decisions and path preflight have been recorded.
2. Provide a unique incident ID, approved Recovery Agent ID, source snapshot directory, staging root, and concise reason.
3. Deliver the returned random bearer token through an approved secret channel. It is returned once; never put it in tickets, console output, chat, URLs, or logs.
4. Execute the grant with the matching grant ID, token, and incident ID. Tokens expire after two minutes by default (maximum five minutes) and are single-use.
5. If the token expires, is revoked, mismatches, is consumed, or execution fails, do not reuse it. Investigate and, if still approved, issue a fresh grant.

The coordinator marks a grant consumed before filesystem work and audits consumption before recovery starts. A failed audit write must stop recovery. Do not remove an audit lock or modify an audit record just to get past an error; follow the audit recovery procedure and preserve evidence.

### 5. Review the result

- `VERIFIED` means the staged snapshot passed the configured integrity checks. It is not authorization to replace live data.
- `HOLD` means integrity or policy checks did not pass. Preserve the source and staging evidence, record the reason, and investigate.
- `FAILED` or an unexpected exception requires incident-owner review; never retry with the same grant.
- Verify the audit chain and confirm issue, denial (if any), consumption, and final outcome events are present.
- Confirm source snapshot bytes remain unchanged, staging contains only the expected verified files, and `originalsModified` is `false` and `promotionAllowed` is `false`.
- Record the staged snapshot identifier, verified file count, checks performed, timestamps, operators, approvals, and follow-up actions in the incident record. Do not copy raw bearer tokens into evidence.

### 6. Stop, rollback, and escalation

Stop immediately if the audit chain is malformed or unavailable, source/staging paths overlap, a symlink or checksum discrepancy is detected, approval independence is unclear, the identity/agent registry is unavailable, or any action would write to live data.

Rollback for this workflow means **abandoning or quarantining the staging result under the approved evidence-retention policy**. This module intentionally does not perform live promotion or overwrite restoration. A real production restoration requires a separate change/recovery plan, explicit approval, tested rollback, and independent verification; it must not be improvised through Gousiya.

## Security rules enforced by the current implementation

- A 256-bit random bearer token is created; only its SHA-256 digest is stored in the locked, durable single-host grant store.
- Grants are short-lived and single-use; unused grants can be revoked.
- The recovery agent validates the backup manifest and file checksums and writes into separate staging.
- The source, staging, and audit paths must not overlap.
- The raw token is not written to the audit log.
- Grant consumption is audited before filesystem recovery. If that audit write fails, recovery does not start.
- The Recovery Agent reports `promotionAllowed: false`; Gousiya does not promote staged files into production.
- The audit log is hash-chained. A hash chain helps detect edits but does not, by itself, prevent a privileged host administrator from rewriting the log.

## Files and tests

- `server/gousiyaEmergencyRecovery.ts` — approval enforcement, durable grant lifecycle and Recovery Agent integration.
- `server/gousiyaFirebaseApprovalVerifier.ts` — Firebase ID-token signature, claim and scoped approval verification; see the revocation-check blocker below.
- `server/gousiyaEmergencyRuntime.ts` — fail-closed runtime configuration factory (no HTTP endpoint).
- `server/gousiyaEmergencyRecovery.test.ts` — independent approvals, approval-ID reuse, durable restart/replay, staging isolation, expiry, revocation, audit failures, tampered backup handling, and source preservation.
- `server/gousiyaFirebaseApprovalVerifier.test.ts` — covers token signature, issuer/audience, expiry/recent authentication, scope matching, algorithm/key rejection, and certificate caching.
- `server/gousiyaEmergencyRuntime.test.ts` — covers configured runtime construction and required environment variables.
- `docs/GOUSIYA_EMERGENCY_RECOVERY.md` — this runbook.

Run `npm test` (or the repository's configured package-manager test command) to execute the security test suite.

## Production blockers — do not treat as production-ready

1. **Identity revocation check:** the token verifier checks Firebase token signatures and claims but does not call Firebase Admin Auth to check disabled accounts or revoked ID tokens. Add this server-side check before any production use.
2. **Trusted approval issuance:** approval claims must be issued only by a trusted server-side service after authenticating the person, checking the authoritative owner/reviewer role, enforcing two-person separation, and binding approval to the exact incident and paths. Do not let client input set these custom claims.
3. **Multi-host durability and concurrency:** grant status now survives restarts in a locked, atomic single-host file store. Replace it with a transactional shared database and atomic conditional consumption before deploying multiple hosts/replicas. Add parallel-process race and crash-recovery tests.
4. **Audit durability/replication:** configure protected shared storage, off-host/WORM replication, alerting, retention, and key/incident procedures. Keep audit storage separately permissioned from source and staging.
5. **Endpoint exposure:** no public emergency-recovery HTTP route is exposed. Keep it that way until the above controls, authentication, rate limits, and security tests have been implemented and reviewed.
6. **Operational validation:** run the new approval-verifier/runtime tests along with the complete security test suite, type-check, build, concurrent replay, restart recovery, revocation races, audit-store unavailability/corruption, permissions and staging-isolation checks in a disposable environment.

Until these blockers are closed and the complete CI/staging validation passes, use Gousiya for isolated rehearsals only, not as an operational production break-glass service.
