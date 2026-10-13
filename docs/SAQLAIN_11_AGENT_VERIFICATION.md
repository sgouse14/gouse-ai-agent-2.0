# Saqlain 11-Agent Verification Team — Integration Guide

## Scope

The verification team is mounted in Gouse AI's Express server at `/api/security/verification`. It records an ordered review chain for one report reference. It is a security workflow, not an autonomous security scanner: a reviewer must supply evidence references and a verdict.

## Review order

1. Threat Detection — threat indicators and anomalous behavior
2. Malware Guard — untrusted files and payload findings
3. Network Guard — network and API boundary evidence
4. Code Guardian — code and artifact integrity
5. Agent Guard — agent identity and task ownership
6. API Guardian — API authorization and request-policy findings
7. Identity Guard — credentials, sessions, and identity
8. Data Guardian — data integrity and protected-data handling
9. Audit Agent — evidence completeness and audit consistency
10. Recovery Agent — recovery readiness without changing protected originals
11. External Intelligence & Communication — sanitized external evidence and provenance

Each review must match the current order and the assigned agent ID. A review must include at least one non-empty evidence reference. Step 11 requires `externalEvidenceSanitized: true`.

## Security behavior

- `APPROVED` advances exactly one step.
- `REVIEW_REQUIRED` changes the chain to `HOLD`; no further review is accepted until an administrator resumes it.
- `REJECTED` is terminal.
- `VERIFIED` means all 11 reviews were recorded as approved. It **never grants access or permission**.
- No endpoint edits, deletes, restores, or overwrites protected source files or backups.
- The state is written to the hash-chained audit log before the updated chain is returned.
- Audit integrity errors, missing audit-path configuration, and missing credentials fail closed.
- Review notes, report references, and evidence references are stored in the audit log. Do not put passwords, access tokens, private keys, personal data, or other secrets in them.

## Required configuration

Configure these on the server runtime, not in browser code:

- `SAQLAIN_VERIFICATION_AUDIT_PATH`: absolute path to a dedicated writable JSONL audit file on durable storage. Restrict the directory to the service account (for example, directory mode 0700 and file mode 0600).
- `SAQLAIN_VERIFICATION_ADMIN_TOKEN`: a long, high-entropy administrator bearer token.
- `SAQLAIN_VERIFICATION_AGENT_TOKENS_JSON`: JSON object mapping each exact agent ID below to a separate high-entropy bearer token:
  - `saq-threat-detection`
  - `saq-malware-guard`
  - `saq-network-guard`
  - `saq-code-guardian`
  - `saq-agent-guard`
  - `saq-api-guardian`
  - `saq-identity-guard`
  - `saq-data-guardian`
  - `saq-audit-agent`
  - `saq-recovery-agent`
  - `saq-external-intelligence`

Generate tokens with a cryptographically secure secret manager or random generator. Do not commit tokens, store them in frontend environment variables, or reuse one token across agents. Rotate them through your secret-management procedure. Use HTTPS and a restricted network boundary in deployment.

## API

Base path: `/api/security/verification`

- `POST /chains` — administrator token; JSON body `{"chainId":"chain-001","reportRef":"report-001"}`
- `GET /chains` — administrator token; list chains
- `GET /chains/:chainId` — administrator token; fetch one chain
- `POST /chains/:chainId/reviews` — assigned agent token; JSON body includes `order`, `reviewerId`, `verdict`, `evidenceRefs`, optional `notes`; step 11 also requires `externalEvidenceSanitized: true`
- `POST /chains/:chainId/resume` — administrator token; resumes a held chain at the same review step and records the transition

Send credentials as `Authorization: Bearer <token>`. Responses never include configured credentials.

## Running tests

Run `npm test`. The service tests cover audit-backed restart reconstruction, all 11 approvals, identity/order enforcement, HOLD/resume, duplicate IDs, step-11 sanitization, credential checks, and audit tamper detection.

## Deployment limits — read before production

This integration is a single-process starter. Use one writer instance for this audit file: the file lock serializes individual audit appends, but does not provide a multi-process transaction for read/modify/write state. For multi-instance deployment, move chain state and transitions to a transactional database with per-chain locking and a durable audit outbox. The hash-chained local log is tamper-evident, not immutable against privileged OS access; replicate it to protected off-host/WORM storage and alert on failures. Add rate limits, token lifecycle management, reviewer identity provisioning, backup/restore drills, and operational monitoring before production use. Authentication here is bearer-token mapping; it does not replace a complete identity provider or network-level controls.
