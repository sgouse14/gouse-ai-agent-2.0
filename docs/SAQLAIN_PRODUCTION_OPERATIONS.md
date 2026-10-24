# Saqlain production operations and validation runbook

Status: **runbook drafted; production environment actions are not complete**. This document distinguishes repository controls from actions that require access to the deployed Firebase project, secret manager, gateway, and staging environment. Never paste Firebase ID tokens, API keys, approver tokens, or signing keys into tickets, chat, GitHub issues, or CI logs.

## 1. Production configuration inventory

Use the deployment platform's secret manager and protected runtime configuration. Do not commit populated values to this repository.

| Setting | Classification | Purpose | Validation |
| --- | --- | --- | --- |
| `FIREBASE_PROJECT_ID` | non-secret, protected config | Server-side Firebase project audience/issuer | Must exactly match `VITE_FIREBASE_PROJECT_ID` |
| `FIREBASE_WEB_API_KEY` | sensitive configuration; restrict at Google Cloud | Identity Toolkit account-status/revocation lookup | Identity Toolkit API only; verify disabled/revoked test account behavior |
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` | client config | Google sign-in | Authorized domain and same project; never put server secrets in VITE variables |
| `SAQLAIN_PROJECT_MEMBERSHIPS_JSON` | sensitive authorization policy | UID-to-project grants for project-scoped AI routes | Reviewed UID and existing project IDs; no wildcards |
| `GOUSIYA_APPROVAL_SIGNING_SECRET` | secret | HMAC signing of short-lived approval attestations | 32 random bytes encoded as 64 hex characters |
| `GOUSIYA_APPROVER_REGISTRY_PATH` | protected file/config | Trusted approver UID/role registry | File mode 0600; parent directory mode 0700 |
| `GOUSIYA_AUDIT_FILE_PATH`, `SAQLAIN_AUDIT_FILE`, `GOUSIYA_GRANT_STORE_FILE_PATH` | protected persistent paths | Durable audit and emergency-grant state | Persistent volume; restrictive ownership; separate audit/grant paths |
| `SAQLAIN_GATEKEEPER_CREDENTIALS_JSON`, `SAQLAIN_TASK_QUEUE_OPERATOR_TOKENS_JSON`, `SAQLAIN_HEARTBEAT_CREDENTIALS_JSON` | secrets | Dedicated Saqlain route credentials | Inject only at runtime; rotate and revoke by owner-approved procedure |
| `TRUST_PROXY_HOPS` | protected config | Express client-IP derivation | Set only after confirming exact proxy chain and blocking direct app access |

**Secret-manager integration status:** the application currently reads these values from environment variables and protected files. A provider-specific secret-manager client, workload identity binding, and automated rotation controller have **not** been verified or implemented in this repository. Configure the hosting platform to inject secret values at runtime; do not claim integrated rotation until the platform binding and a rotation rehearsal are recorded.

## 2. Firebase disabled-account and revoked-token staging test

Run only in a non-production Firebase project with dedicated test accounts. Use the same project configuration and deployment path as production, but no production user data.

1. Confirm the server's `FIREBASE_PROJECT_ID` and client `VITE_FIREBASE_PROJECT_ID` are identical and the API key is restricted to Identity Toolkit.
2. Sign in as an active test user using Google sign-in. Call a project-scoped endpoint with a valid ID token and an explicitly provisioned membership; expect the route's normal response (not 401/403/503).
3. Call the same route with no Authorization header, a malformed token, a token signed for another Firebase project, and an expired token; expect denial (normally 401; unavailable identity infrastructure must return 503).
4. Disable the test user in Firebase Authentication. Reuse the previously issued token and request the route. Expect denial after the documented identity-cache window (up to 30 seconds); allow for deployment propagation and record timestamps.
5. Re-enable the user, sign in again, then revoke the user's refresh tokens from Firebase Admin SDK/console. Reuse the old ID token and repeat. Expect denial when `accounts:lookup` reports `validSince` newer than the token's `auth_time`.
6. If any disabled/revoked token is accepted beyond the documented cache window, stop rollout. Capture redacted timestamps, response codes, project ID, deployed revision and logs; never record the token itself.
7. Repeat after restart and against every replica/revision. Confirm network failure, malformed account lookup response, missing API key and Identity Toolkit outage fail closed.

Unit tests for disabled accounts, mismatched UID, revoked `validSince`, invalid signatures, and lookup failure exist, but they do not prove behavior against the configured live Firebase project.

## 3. Project membership registry lifecycle

Registry shape (example IDs only; **do not deploy these placeholders**):

```json
{
  "firebase-uid-from-firebase-auth": ["existing-project-id"]
}
```

- **Add:** requestor identifies the Firebase UID and exact existing project ID(s). A project owner verifies the user's identity and business need. A second authorized reviewer confirms the project owner and scope. Update the secret/configuration in the deployment platform; do not commit real UIDs or membership data. Deploy to staging, test allowed access for each intended pair and denial for every out-of-scope pair, then promote the reviewed configuration.
- **Remove:** remove the UID/project pair rather than setting an empty wildcard or broadening other entries. Apply promptly for offboarding or suspected compromise, redeploy/reload configuration, and verify that the removed pair receives 403. Revoke Firebase sessions separately when account compromise is suspected.
- **Recover:** restore the last reviewed version from the secret manager's version history. Re-validate JSON, compare a reviewed change record, test least-privilege grants in staging, and only then promote. Never restore an unreviewed registry snapshot.
- **Audit:** record requester, reviewer, UID, project IDs, reason, change version, approver, deployment revision, and verification evidence in the organization's protected change/audit system. Do not record bearer tokens.
- **Fail closed:** unset or malformed registry configuration must not grant access. Avoid wildcard project IDs. Keep registry permissions and access limited to deployment/security administrators.

## 4. Approver UID and role registry lifecycle

The approver registry is an owner-managed protected file; there is no public role-administration endpoint. Current schema:

```json
{
  "schemaVersion": 1,
  "users": [
    { "uid": "verified-firebase-uid", "active": true, "roles": ["system-owner"] },
    { "uid": "different-verified-firebase-uid", "active": true, "roles": ["independent-reviewer"] }
  ]
}
```

These are placeholders, not actual approved identities. Never infer a role from an email address, client-side claim, or display name. Verify the UID in the intended Firebase project and independently confirm the person's organizational role.

- Require two-person review to add a UID or grant either role. Owner and independent reviewer must be different people.
- To remove access, set `active: false` or remove the role; retain the change evidence in protected audit/change records. For suspected compromise, also disable/revoke Firebase credentials and rotate affected server secrets as appropriate.
- Before use, validate schema and restrictive filesystem permissions (parent directory 0700, file 0600). Registry and audit paths must not be symlinks.
- Recovery must restore only a reviewed, known-good registry version and repeat a test proving an inactive UID or wrong role cannot issue an approval.
- There are currently no verified real production approver UIDs in this repository. Do not enable emergency approval workflows until the owner and independent reviewer have been identified and the live project has been checked.

## 5. Approval signing-key rotation and recovery

The approval issuer currently accepts one HMAC key from `GOUSIYA_APPROVAL_SIGNING_SECRET`; automated key versioning/overlap is not implemented. Until versioned keys are implemented and tested, rotation is a coordinated maintenance operation, not zero-downtime rotation.

1. Obtain change approval from the system owner and independent reviewer. Generate a new random key using a trusted host/secret manager (for example `openssl rand -hex 32`); never generate it in a browser or commit it.
2. Pause new emergency approvals and any recovery operation that might be holding a token. Inventory outstanding short-lived approvals/grants without logging token material.
3. Back up the current secret version through the secret manager's encrypted versioning/recovery facility with restricted access. Do not export it to chat, issue comments, build artifacts, or a general-purpose file share.
4. Update the runtime secret, restart/redeploy all relevant instances consistently, and verify a new test approval works while a token signed with the old key is rejected.
5. Confirm old approvals/grants are expired or explicitly invalidated, then disable/destroy the old secret version according to policy. If rollback is needed, use the documented two-person recovery process and immediately re-assess all outstanding grants.
6. Record key version IDs, operator/reviewer, timestamps, affected deployment revisions and test outcomes—not secret values.

**Limitation:** current code does not support a key ring or key ID for HMAC approvals. Do not promise graceful overlap or automatic recovery until that capability has been implemented and race/replay-tested.

## 6. Gateway, WAF, proxy IP, quotas and request ceilings

The application guard has per-process in-memory limits. It is not a distributed quota system. The Express server currently limits JSON bodies to 5 MB and URL-encoded bodies to 1 MB. These are code-level ceilings, not proof of edge/gateway ceilings.

Staging checklist:
- Configure gateway/WAF limits for total requests per source IP, authenticated UID, provider-backed route, and hourly cost/quota. Add concurrency ceilings and provider timeouts at the gateway or service layer.
- Ensure the app is not directly reachable around the gateway. Set `TRUST_PROXY_HOPS` only to the verified hop count. Spoof `X-Forwarded-For` and confirm the gateway strips client-supplied values and writes trusted forwarding metadata.
- Send more than the configured threshold from one source, multiple source IPs using one UID, and many UIDs from one IP. Expect 429 and a correct `Retry-After`; verify the limits apply across multiple replicas and after a restart.
- Send oversized JSON and URL-encoded requests. Expect 413; send malformed JSON and expect 400. Confirm oversized requests do not trigger provider calls.
- Test provider timeout, retry storms, queue saturation and audit-storage outage. Confirm bounded concurrency, no secret leakage and fail-closed behavior for privileged security actions.
- Keep application limits as a secondary defense, not a substitute for shared gateway/WAF enforcement.

## 7. Durable shared state, monitoring and backup operations

The current JSON-file queue and emergency-grant store use local locks and atomic file replacement for a **single-host** deployment. They are not suitable as a shared multi-instance transactional store. Agent identity records also require a durable atomic caller; heartbeat storage is in-memory.

Before scaling beyond one host:
- Integrate a transactional shared database with conditional updates/unique constraints for agent IDs, issued-ID ledger, queue transitions, approval ID reservations and single-use emergency-grant consumption.
- Use compare-and-swap/transactions so two concurrent consumers cannot consume the same grant. Test concurrent replay across separate processes, crash before/after commit, restart, corrupted state, lock loss and reconciliation.
- Persist worker liveness, job state and cycle state. Run backup/monitoring runtimes under a supervisor with restart policy, liveness probes and alerting; record operational owner and escalation path.
- Configure trusted source roots and encrypted off-host/versioned backups. Keep backup destination separate from sources and test restores from offline/isolated copies.
- Replicate hash-chained audit records off-host to access-controlled immutable/WORM storage with independent permissions, retention and alerts.
- The standalone Saqlain EMP resilience helper now requires a source ID on an owner-provisioned exact allowlist and an ISO 8601 observation timestamp. By default, readings older than five minutes or more than 60 seconds in the future are held without scoring. These are initial heuristics and must be calibrated for the actual monitoring sources.
- The EMP helper is not currently connected to a live sensor adapter or exposed as an API endpoint. A trusted server-side adapter must establish source identity/provenance and only then call the helper; a client-provided source ID or timestamp is not itself proof of trust.
- EMP readiness signals must come from trusted monitoring or qualified operator inputs. The protector is not a physical EMP detector. Qualified site operators must assess shielding/EMC, surge protection, power continuity, offline backups, spare hardware and alternate communications; rehearse recovery under supervision. No automatic production promotion is permitted.

## 8. Required release evidence

Do not mark production-ready until a release owner links evidence for all of the following:

- [ ] Firebase disabled-account and revoked-token tests against the actual configured staging project.
- [ ] Reviewed real approver UIDs/roles; successful and denied issuance evidence.
- [ ] Secret-manager runtime binding and signing-key rotation/recovery rehearsal.
- [ ] Successful project access and cross-project denial using reviewed production-like UID/project pairs.
- [ ] Shared gateway/WAF rate-limit and proxy-spoof tests across replicas.
- [ ] Shared transactional state with parallel replay, crash, restart, corruption and reconciliation tests.
- [ ] Supervised backup/monitoring services, off-host restore drill, alert/paging ownership and durable job state.
- [ ] Off-host immutable audit replication, retention and recovery tests.
- [ ] External Communication Agent allowlist, vetted transport, delivery receipts, timeouts/retries and staging failure tests.
- [ ] End-to-end staging test, penetration test, load/stress and failure-injection test (disk full, audit lock, concurrent cycles, provider outage).
- [ ] Incident-response/operator playbooks and formal security sign-off.

Passing unit tests or CI alone is not production approval.
