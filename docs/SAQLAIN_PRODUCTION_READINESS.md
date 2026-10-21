# Saqlain Production Readiness Review

Status: **Not production-ready yet**. This review records concrete launch blockers discovered while reviewing the Saqlain feature branch. The successful CI run validates tests, type-checking, frontend/server build, and Docker image construction; it does not prove the deployed security boundaries are complete.

## P0 — Before exposing to untrusted users

### 1. Add identity and project authorization to the application API

The Express API exposes chat, project intelligence, BOQ generation, architecture rendering/analysis, professional search, material pricing, company generation, enquiry quoting, and PDF/spec parsing routes without a shared authentication middleware in `server.ts`.

Partial mitigation now in the feature branch: the workspace-level `POST /api/security/saqlain/summary` endpoint requires a recently authenticated active Firebase identity and a successful durable audit write before returning its posture summary. This does **not** add authentication to the other application routes and does not establish project-membership authorization; the app-wide route review remains open.

Required work:
- Choose and configure a session or bearer-token identity provider.
- Apply authentication to private application routes, not only the Saqlain management routers.
- Enforce project membership and tenant boundaries server-side; never trust a client-supplied project ID as authorization.
- Keep any intentionally public endpoints explicitly allowlisted and rate-limited.
- Add tests proving unauthenticated requests are rejected and one project's identity cannot access another project's data.

### 2. Add abuse controls to provider-backed endpoints

The application invokes AI and search providers without a shared per-user/IP rate limiter, concurrency ceiling, request timeout policy, or quota guard in the current server route layer.

Required work:
- Use a production-ready limiter with a trustworthy proxy/IP configuration.
- Apply per-account and per-IP quotas, bounded concurrency, and provider timeouts.
- Bound route-specific text and file payloads; the global JSON limit is currently 20 MB.
- Return 429/413/504-style safe responses and add tests for limit behavior.

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
