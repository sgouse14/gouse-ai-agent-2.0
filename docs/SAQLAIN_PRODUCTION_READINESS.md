# Saqlain Production Readiness Review

Status: **Not production-ready yet**. This review records concrete launch blockers discovered while reviewing the Saqlain feature branch. The successful CI run validates tests, type-checking, frontend/server build, and Docker image construction; it does not prove the deployed security boundaries are complete.

## P0 — Before exposing to untrusted users

### 1. Add identity and project authorization to the application API

The Express API exposes chat, project intelligence, BOQ generation, architecture rendering/analysis, professional search, material pricing, company generation, enquiry quoting, and PDF/spec parsing routes without a shared authentication middleware in `server.ts`.

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

### 3. Persist emergency grants and approval identity durably

The emergency-recovery grant state is explicitly in-memory. The grant-issuance function accepts owner/reviewer approval booleans; it does not itself establish who approved them. The grant module is not mounted as an HTTP route in `server.ts`, so keep it as an internal/testable workflow until an authenticated approval API and transactional store exist.

Required work:
- Bind owner and independent-reviewer approvals to authenticated identities and durable, immutable approval records.
- Use transactional, concurrency-safe single-use grant consumption.
- Persist grant/revocation state across process restarts and multiple replicas.
- Test concurrent replay, restart recovery, revocation races, and audit-store failure.

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

- Security unit tests: 114 passing in the validated run.
- TypeScript type-check: passing.
- Frontend/server production build: passing.
- Docker image build: passing in CI.
- Pull request: remains a draft and is not merged to `main`.

Do not interpret a passing build or unit-test suite as a penetration test or a production-security certification.
