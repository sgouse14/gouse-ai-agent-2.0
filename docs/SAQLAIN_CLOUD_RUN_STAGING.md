# Saqlain Cyber Agent — Google Cloud Run staging readiness

Status: **deployment checklist prepared; no Google Cloud project, Cloud Run service, Secret Manager binding, or live Firebase test was accessed by this repository change.** This guide is for the `feature/saqlain-cyber-agent` workstream only. Do not treat a successful CI build as evidence that staging is configured.

## 1. Staging safety boundary

- Use a dedicated non-production Google Cloud project and a dedicated staging Firebase project. Confirm server `FIREBASE_PROJECT_ID` and client `VITE_FIREBASE_PROJECT_ID` refer to that same staging Firebase project.
- Do not put production credentials, user records, real approver registries, or production audit data in staging.
- Use a dedicated Cloud Run service account with only the permissions it needs. Do not deploy with a default broad-privilege service account.
- Keep secrets in Google Secret Manager and bind specific secret versions to the Cloud Run service at runtime. Never pass secret values as build arguments, bake them into the image, add them to `VITE_*` variables, or print them in CI.
- Restrict who can deploy, change service configuration, impersonate the runtime service account, and access secret versions. Enable Cloud Audit Logs and review staging changes.
- Do not enable external agent traffic or operator endpoints until their credential registries and durable audit dependencies are configured and tested.

## 2. Required Cloud Run configuration review

Before deployment, record the project ID, region, service name, runtime service account, image digest, Firebase staging project ID, and the reviewer who approved the configuration. Never record secret values.

Recommended starting controls for staging:

- Ingress: internal-and-load-balancing if the staging test path supports it; otherwise document why public ingress is needed and protect it with an HTTPS load balancer and Cloud Armor.
- Authentication: this application uses Firebase and dedicated Saqlain route credentials at the application layer. Cloud Run IAM authentication is an additional boundary, but enabling it directly can block browser clients that cannot present Google IAM identity tokens. Choose the ingress/auth pattern deliberately; do not silently make the service public to work around an IAM error.
- Runtime identity: dedicated least-privilege service account; no service-account key file.
- Secrets: Secret Manager references to explicitly approved versions; grant the runtime identity access only to the exact required secrets.
- Scaling: set an explicit maximum instance count and review concurrency against upstream quotas and the application's in-process rate limits. Per-process rate counters do not create a distributed quota.
- Networking: do not set `TRUST_PROXY_HOPS` unless the exact proxy chain is known and direct access paths are blocked. Cloud Run's request proxying means the socket peer address may not represent the original client.
- Request limits: the application parser currently allows JSON up to 5 MB and URL-encoded bodies up to 1 MB. Add and test edge request-size limits as well.
- Health: configure the Cloud Run startup/liveness probe against `/healthz`. It only confirms the process is responding; it is not a readiness check for Firebase, audit storage, queue storage, or agent credentials.

## 3. Configuration and secret inventory

Resolve every required value from reviewed staging configuration before allowing a security workflow to accept requests.

| Configuration | Cloud Run handling | Staging validation |
| --- | --- | --- |
| `FIREBASE_PROJECT_ID` | Non-secret environment variable | Exactly matches staging Firebase project and client config |
| `FIREBASE_WEB_API_KEY` | Secret Manager if operational policy classifies it as sensitive; restrict API key to Identity Toolkit | Disabled/revoked account lookup works; failures deny access |
| `VITE_FIREBASE_*` | Build-time client configuration only; these values are bundled into frontend assets | No server secret is exposed through any `VITE_*` variable |
| `SAQLAIN_PROJECT_MEMBERSHIPS_JSON` | Protected runtime configuration or secret, reviewed by two people | Explicit UID/project pairs only; no wildcard grants |
| `SAQLAIN_GATEKEEPER_CREDENTIALS_JSON` | Secret Manager | Valid credential works; missing/invalid credential is denied |
| `SAQLAIN_TASK_QUEUE_OPERATOR_TOKENS_JSON` | Secret Manager | Valid operator works; missing/invalid operator is denied |
| `SAQLAIN_HEARTBEAT_CREDENTIALS_JSON` | Secret Manager | Registered agent works; invalid agent is denied |
| `SAQLAIN_AUDIT_FILE` | Must point to supported durable storage before enabling audited endpoints | Write, restart, concurrency, and tamper-evidence tests pass |
| `SAQLAIN_TASK_QUEUE_FILE`, `SAQLAIN_TASK_QUEUE_AUDIT_PATH` | Must point to supported durable transactional storage before enabling queue operations | Concurrent writes, restart, and recovery tests pass |
| Verification service state and audit dependencies | Inspect the service implementation and provision its configured backing storage | State survives instance replacement and is consistent across instances |
| `GOUSIYA_APPROVAL_SIGNING_SECRET`, approver registry, grant/audit paths | Only if those internal recovery features are explicitly in staging scope; use separate staging secrets/registries | Two-person review, permission, key and recovery tests pass |

Use the complete current `.env.example` as the source inventory, but do not assume every setting is needed for the Saqlain staging service. Do not add unused secrets “just in case.”

## 4. Blocking storage issue: Cloud Run filesystem is not durable application storage

The current code uses in-memory heartbeat state and per-process rate-limit state. Task queue and audit components use file paths. A writable container filesystem is not a durable, shared database: instances can restart, scale out, or be replaced, and separate instances do not share ordinary local files.

**Do not sign off on production readiness while audit continuity, queue consistency, or heartbeat visibility depends on ordinary container-local files or memory.**

Before using these workflows beyond isolated staging smoke tests, choose and implement a supported backing service with documented consistency and access controls:

1. Move mutable queue state to a transactional shared datastore with atomic state transitions, concurrency control, idempotency, and backup/recovery tests.
2. Move security audit events to durable append-only or tamper-evident storage with restricted writer/reader identities, integrity verification, retention, alerting, and an independent export/replication path.
3. Store heartbeat status in a shared datastore with explicit expiry/retention and bounded ingestion. Do not rely on one instance's memory as the authoritative heartbeat view.
4. Move rate limits that must apply across instances to Cloud Armor/API gateway quotas or a shared rate-limit store. Keep application checks as defense in depth.
5. Do not assume Cloud Storage FUSE is a drop-in replacement for a transactional queue or append-only audit log. Validate locking, atomicity, consistency, and failure behavior for any mounted storage before relying on it.

For the initial staging exercise, if these dependencies are not yet implemented, keep queue resolution and audit-dependent production workflows disabled or use an explicitly isolated disposable test. Record this as a blocker, not as a successful durability test.

## 5. Deploy and inspect a staging revision

Run commands from an authorized operator workstation after setting placeholders to the approved staging values. These commands do not create secrets or choose a project automatically.

```bash
gcloud auth login
gcloud config set project YOUR_STAGING_GCP_PROJECT_ID
gcloud run services list --region YOUR_REGION
```

Build and deploy using the repository's reviewed Dockerfile and an immutable image digest. Prefer a controlled CI build/promotion process; do not build from an unreviewed working tree.

```bash
gcloud builds submit --tag YOUR_REGION-docker.pkg.dev/YOUR_STAGING_GCP_PROJECT_ID/YOUR_REPOSITORY/saqlain-agent:STAGING_TAG .
```

Before deploying, verify that Artifact Registry, Cloud Build permissions, runtime service account, Secret Manager versions, ingress, scaling, and any durable backing services have been reviewed. Then deploy the reviewed image with explicit configuration. Do not use a blanket `--set-env-vars` command containing secrets.

After deployment, inspect the revision and its configuration without dumping secret values:

```bash
gcloud run services describe YOUR_SERVICE --region YOUR_REGION
gcloud run revisions list --service YOUR_SERVICE --region YOUR_REGION
gcloud run services logs read YOUR_SERVICE --region YOUR_REGION --limit 100
```

Verify the image digest, active revision, runtime identity, secret references/versions, ingress, maximum instances, request timeout, and probe configuration. Redact user identifiers and sensitive request metadata from any evidence shared outside the authorized operations team.

## 6. Staging test matrix — required evidence

Use dedicated synthetic test identities and credentials. Record timestamp, revision, expected result, actual HTTP status, and a redacted log/audit reference. Never record bearer tokens, cookies, secret values, or raw credential JSON.

| Test | Expected result | Stop condition |
| --- | --- | --- |
| `GET /healthz` | 200 from the deployed revision | Startup/liveness probe fails or revision is unstable |
| Unauthenticated Firebase-protected route | Denied | Request reaches protected operation |
| Invalid, wrong-project, expired Firebase token | Denied; infrastructure failure is fail-closed | Any invalid token is accepted or dependency outage grants access |
| Disabled user and revoked token | Denied after documented identity-cache window; test against staging Firebase | Acceptance persists beyond cache window |
| Project membership allow/deny pairs | Only explicit approved UID/project pair is allowed | Cross-project access succeeds |
| Gatekeeper valid/invalid credentials and policy cases | Only valid credential is evaluated; unavailable policy/audit returns HOLD/503 | Missing policy or audit grants PASS |
| Queue operator auth and timeout resolution | Invalid operator denied; retry requires explicit safety confirmation | Unauthorized mutation or duplicate/non-atomic transition |
| Heartbeat valid/invalid credential and rate limit | Authenticated heartbeat audited before acceptance; abuse returns 429 | Heartbeat accepted without durable audit or untrusted ID bypasses limits |
| Verification admin/agent separation | Each role can perform only its documented operation | Cross-role operation succeeds |
| Oversized/malformed request | 413/400 and no state mutation | Process crash, excessive resource use, or mutation occurs |
| Instance restart/replacement and two concurrent requests | Durable state and audit remain consistent across revisions/instances | Lost audit, duplicate task transition, or inconsistent authoritative state |
| Secret rotation rehearsal | New version takes effect; old credential is rejected according to the rotation plan | Old credential remains usable or logs reveal secret material |
| Backup and restore rehearsal | Restore from known-good reviewed backup and verify integrity/least privilege | Restore cannot be verified or silently changes audit history |

Some tests are blocked until shared durable storage and distributed rate limiting are implemented. Mark them **BLOCKED**, not PASS, if they cannot be executed.

## 7. Promotion gate

Do not promote from staging until all of the following are evidenced:

- [ ] Current branch CI passes, including security tests, type checks, production build and Docker build.
- [ ] Cloud Run revision, image digest, runtime identity, ingress, secret versions and scaling settings reviewed by an authorized operator.
- [ ] Live staging Firebase tests prove disabled/revoked account behavior and fail-closed handling of lookup failures.
- [ ] Project membership and dedicated Saqlain credential registries use reviewed, least-privilege values.
- [ ] Durable, shared audit and queue persistence are implemented and tested across restarts and multiple instances.
- [ ] Distributed rate limiting and edge request limits are configured and tested.
- [ ] Alerting, log access, audit retention, backup, recovery, and incident-owner/on-call process are tested.
- [ ] Staging threat-model review, authorization negative tests, concurrency/failure injection, and external security review are completed.
- [ ] Every blocked item has an owner and explicit disposition; no security-critical item is waived silently.

**Current status:** repository CI has passed on the latest checked run. Cloud Run staging configuration, live Firebase behavior, Secret Manager bindings, shared durable storage, distributed rate limiting, and staging penetration/failure tests have not been verified by this change.
