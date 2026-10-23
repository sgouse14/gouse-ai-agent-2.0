# Saqlain Production Readiness Review

Status: **Not production-ready yet**. This review records concrete launch blockers discovered while reviewing the Saqlain feature branch. The successful CI run validates tests, type-checking, frontend/server build, and Docker image construction; it does not prove the deployed security boundaries are complete.

## P0 — Application-wide API security

### 1. Firebase authentication, project membership and abuse controls

**Implemented in the feature branch; deployment configuration and staging validation remain required.**

- Express production APIs and the Vite development API share a fail-closed Firebase ID-token guard. Token verification checks Google's signing certificate, Firebase issuer/audience, expiry, sign-in age, disabled account state, and the Firebase revocation boundary.
- The React workspace has a Firebase Google sign-in gate. API calls send an ID token in Authorization: Bearer.
- Project-scoped chat, intelligence, BOQ, rendering, image analysis, live quote, and PDF/spec parsing endpoints require X-Project-ID and an explicit UID/project pair in the server-managed SAQLAIN_PROJECT_MEMBERSHIPS_JSON registry. Client-supplied project IDs do not grant access.
- Provider-backed requests have in-process per-user limits, all API routes including separately authenticated Saqlain routes have an IP limit, and the workspace has a per-user request/hour ceiling. JSON payloads are limited to 5 MB. Unknown API paths return JSON 404 responses.
- The /api/security/* routes retain their specialized credentials. The security-summary endpoint independently verifies Firebase identity and durable audit-before-response.
- Forwarded IP headers are not trusted unless TRUST_PROXY_HOPS is explicitly set to a reviewed value.

Required deployment steps:
- Configure VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN and VITE_FIREBASE_PROJECT_ID for the client, plus FIREBASE_PROJECT_ID and FIREBASE_WEB_API_KEY on the server. They must identify the same Firebase project. Restrict the web API key to Identity Toolkit API.
- Enable Google sign-in and configure Firebase Authentication authorized domains.
- Provision and review SAQLAIN_PROJECT_MEMBERSHIPS_JSON using actual Firebase UIDs and project IDs. No project-specific API will be usable until this server-side registry is configured.
- Add a distributed gateway/WAF or shared-store limiter before multi-replica deployment; in-process limits reset at restart and are not shared across replicas.
- Validate sign-in, account disablement/revocation, rate-limiting, and cross-project denial in staging.

Important remaining architecture boundary: project and BOQ data are still browser-localStorage records rather than an authoritative server-owned multi-tenant database. Membership checks guard project-scoped API/provider access but do not create secure multi-user project collaboration or protect the local records themselves. A server-side project store and membership lifecycle are still required for that capability.

## P1 — Before enabling operational security workflows

### 3. Emergency grants and approval identity

**Partially implemented on the Saqlain feature branch; not production-ready.** Grant issuance requires separate owner/reviewer tokens. A Firebase ID-token verifier checks Google signing signatures, issuer, audience, expiry, recent authentication and matching incident/recovery path scope. The trusted issuer now mints a separate HMAC-signed scoped approval token after Firebase identity validation and a role lookup in the owner-only registry; Firebase ID tokens/client custom claims are not themselves approval attestations. Approval IDs are reserved durably to prevent reuse. Grant state uses a locked, atomic single-host JSON store; consumption and revocation persist before audit-dependent or filesystem work. Tests cover token validation, approval independence, reuse and replay after a simulated restart.

Remaining work:
- Firebase ID-token signatures/claims are checked first, then Identity Toolkit `accounts:lookup` validates UID, rejects disabled accounts, and compares `auth_time` against `validSince`. Configure `FIREBASE_PROJECT_ID` and `FIREBASE_WEB_API_KEY` (restrict the API key to Identity Toolkit) with durable audit/grant paths. The separate HMAC-signed approval token is produced only after the authenticated UID matches the protected role registry.
- Establish reviewed registry provisioning/deprovisioning, signing-key rotation, and secure recovery procedures. Protect both the registry file (`0600`) and its parent directory (`0700`). No public role-administration endpoint exists.
- Run account-disablement and revocation tests against a configured test Firebase project.
- Replace the single-host file adapter with a transactional shared database and atomic conditional consume before multi-process or multi-host use.
- Add parallel-process race tests, restart tests for issued/revoked/expired records, store corruption and crash-recovery tests.
- Keep the grant module internal; it is not mounted as an HTTP route.

### 4. Persist verification and audit records reliably

The verification router requires configured credentials and a durable audit path, but production operation still depends on correctly configured storage and credential rotation.

Required work:
- Verify durable storage is shared by all replicas and protects against tampering.
- Replicate security audit events to a separate, access-controlled destination.
- Document key rotation, recovery, retention, and operational alerting.
- Test unavailable/corrupt storage and ensure every privileged route fails closed.

## P2 — Before broad rollout

### 5. Validate upload and AI-input trust boundaries

The PDF/spec parser and image-analysis endpoints accept client-provided payload metadata and content. Treat all uploaded files and AI-generated content as untrusted.

Required work:
- Enforce MIME/content signatures, byte/page limits, filename normalization, malware scanning or quarantine, and safe temporary storage.
- Avoid logging raw file contents, credentials, or private project data.
- Add adversarial-input tests and verify that AI output cannot bypass application authorization.

### 6. Complete deployment verification

CI currently validates the locked dependency installation, 114 security tests, TypeScript checking, frontend/server build, and Docker image build. Deployment still needs environment-specific verification.

Required work:
- Configure secrets through the deployment secret manager and rotate any credentials that may have been exposed.
- Configure `VITE_ALLOWED_HOSTS` for any custom Vite development/preview host.
- Confirm HTTPS, trusted proxy configuration, health probes, resource limits, and graceful shutdown in the target platform.
- Run a staging smoke test and dependency/security scan before production rollout.

## Current verified state

- Latest full CI run [39387764332](https://github.com/sgouse14/gouse-ai-agent-2.0/actions/runs/39387764332): 150 tests passed; TypeScript check, frontend/server production build, and Docker image build passed for commit `bd91280aa5972e2ba2f8804cf420694e73311e00`.
- This validates the repository tests and build pipeline only; it is not a penetration test or a security certification.
- Real Firebase-project disabled-account/revocation behavior and a production staging rehearsal still need environment-specific validation.
- Pull request: remains a draft and is not merged to `main`.

Do not interpret a passing build or unit-test suite as a penetration test or a production-security certification.
