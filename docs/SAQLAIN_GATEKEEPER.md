# Saqlain Gatekeeper — Deployment and API Guide

## Purpose and boundary

Saqlain Gatekeeper is the external-agent access boundary for Gouse AI Agent 2.0. It checks the current 128-bit binary Agent ID, owner approval and active status, binds a bearer credential to the stable agent key and platform, applies scope policy, and writes the decision to a hash-chained audit log before returning it.

Gatekeeper decisions are `PASS`, `HOLD`, or `BLOCK`. A PASS is only for the exact requested approved scope; it does not grant general internal access. Protected scopes (security layer, protected files/originals, backups/recovery control, identity and authorization credentials) are blocked. Unknown scopes and sensitive operations are held for review. Gatekeeper never deletes or overwrites protected originals, changes its own privileges, performs external takeover, or retaliates against external systems.

## API

Base path: `/api/security/gatekeeper`

### `POST /evaluate`

Requires `Authorization: Bearer <agent-credential>`. JSON body:

```json
{
  "requestId": "req-unique-001",
  "agentId": "<current-128-bit-binary-agent-id>",
  "platformId": "approved-partner-platform",
  "requestedScope": ["public-api"],
  "sensitiveOperation": false
}
```

The bearer token is supplied only in the Authorization header. The server attaches it internally for verification and does not return or log it.

- HTTP 200: `PASS`
- HTTP 403: `BLOCK`
- HTTP 423: `HOLD`
- HTTP 400: invalid payload
- HTTP 401: missing/invalid bearer format
- HTTP 503: registry/configuration/audit failure; no access is granted

### `POST /communication`

Requires the same identity and credential fields and the `approved-agent-communication` scope. It is a deliberately narrow acceptance endpoint: it does not proxy arbitrary URLs, execute client-supplied commands, or expose internal APIs. It returns `202` only after a PASS and durable audit append. HOLD/BLOCK are not accepted.

## Required server-side configuration

Set these only in the server environment or secret/configuration manager; never in frontend variables or committed source files.

- `SAQLAIN_AGENT_IDENTITY_REGISTRY_PATH`: absolute path to a JSON file containing `{"agents":[...],"issuedIds":[...]}`. Each agent has `agentKey`, `currentBinaryId` (128 binary characters), `status` (`ACTIVE`, `SUSPENDED`, or `RETIRED`), `ownerApproved`, `issuedAt`, `lastRotatedAt`, and `completedTaskCount`. Every current ID must appear in the permanent issued-ID ledger. Keep the file on a protected durable volume with strict owner-only permissions (for example, 0600); the containing directory should be owner-only (0700). The loader rejects symlinks and malformed records.
- `SAQLAIN_GATEKEEPER_CREDENTIALS_JSON`: JSON map from stable `agentKey` to platform ID to bearer credential, for example `{"partner-agent-01":{"approved-partner-platform":"<high-entropy-secret>"}}`. Each secret must be at least 24 characters. Use unique randomly generated credentials, secret-manager storage and a rotation/revocation process. Never commit real credentials.
- `SAQLAIN_GATEKEEPER_AUDIT_PATH`: absolute path to the durable hash-chained JSONL audit log. The service writes the decision before returning it. If writing fails, the request is not granted.

Use HTTPS and network-level restrictions. Keep identity-registry updates owner-controlled and atomic. Do not let Gatekeeper or external agents self-register or self-approve. A current binary ID is an identifier, not a substitute for the independent bearer credential.

## Policy details

- Current active, owner-approved registered ID required.
- Credential must match both stable agent key and platform ID.
- Protected scope: BLOCK.
- Unknown scope or sensitive operation: HOLD for security review.
- Approved public/API/agent-communication scope may PASS only after credential verification.
- Registry, credential configuration, or audit failures fail closed.
- Audit events include decision, actor ID, platform, scope names, request ID and reason, but never the bearer credential.

## Tests

Run `npm test`. Gatekeeper service tests cover approved access, protected-scope denial, wrong platform, stale IDs, suspension, HOLD behavior, input validation, missing configuration and tampered audit history.

## Production limitations

The identity registry and credential map are currently file/environment based, not a transactional identity provider. A production deployment must add atomic identity rotation and revocation workflows, secret-manager integration, request rate limits, replay/idempotency controls, off-host/WORM audit replication, alerts, and multi-instance coordination. The `/communication` route demonstrates a narrow gated boundary; other sensitive application routes must be explicitly wrapped with Gatekeeper middleware before they can be considered protected. Do not claim the entire Gouse AI API is secured merely because these routes are mounted.
