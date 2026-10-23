# Application-wide API security deployment

## What is enforced in code

The Express production server and Vite development API use the shared guard in \`server/applicationSecurity.ts\`.

- All ordinary \`/api/*\` routes require a Firebase ID token in \`Authorization: Bearer\`, except \`/api/health\` and the \`/api/security/*\` namespace. Saqlain's security routes keep their dedicated server-side authorization; the security summary checks Firebase identity and durable audit itself.
- Firebase ID tokens are checked against Google's signing certificates and the configured project's issuer/audience. Verification checks expiry, sign-in time, disabled account state, and the revocation boundary.
- Token-verification results are cached for at most 30 seconds. In that short window an account-state change can take up to 30 seconds to take effect; test revocation behavior in the target deployment.
- Project-scoped chat, intelligence, BOQ, render, image-analysis, live quote, and PDF/spec parsing require \`X-Project-ID\` and a match in \`SAQLAIN_PROJECT_MEMBERSHIPS_JSON\`. A client-supplied project ID is only a lookup key, never authorization.
- Provider-backed routes have a 20/minute per-user ceiling; ordinary authenticated API calls have a 120/minute and 600/hour per-user ceiling. Every non-health API endpoint also receives a 120/minute in-process IP ceiling.
- JSON request bodies are limited to 5 MB. Unknown API routes return JSON 404 rather than falling through to the SPA.
- The browser uses a Google sign-in gate and sends a Firebase ID token on API calls.

## Deployment configuration required

Client-side environment variables:

- \`VITE_FIREBASE_API_KEY\`
- \`VITE_FIREBASE_AUTH_DOMAIN\`
- \`VITE_FIREBASE_PROJECT_ID\`
- \`VITE_FIREBASE_APP_ID\` (recommended)
- \`VITE_FIREBASE_MESSAGING_SENDER_ID\` (recommended)

Server environment variables:

- \`FIREBASE_PROJECT_ID\`
- \`FIREBASE_WEB_API_KEY\` (restrict this key to the Identity Toolkit API)
- \`SAQLAIN_PROJECT_MEMBERSHIPS_JSON\`

Client and server project IDs must match.

\`SAQLAIN_PROJECT_MEMBERSHIPS_JSON\` is a server-managed JSON object keyed by Firebase UID. Each value is the array of project IDs that identity is allowed to use. Example shape (replace with actual verified Firebase UIDs and existing project IDs):

\`\`\`json
{
  "firebase-uid-123": ["proj-01", "proj-02"],
  "firebase-uid-456": ["proj-02"]
}
\`\`\`

Do not commit real secrets or place privileged membership data in client-readable configuration. Provision membership entries through an operator-reviewed deployment configuration change. Project-scoped APIs intentionally return a fail-closed error until the registry is configured.

## Project data boundary

The current project and BOQ workspace stores data in browser \`localStorage\`; there is no authoritative server-side multi-tenant project database. This guard prevents unauthorized identities from using project-scoped AI/provider APIs by requiring a server-managed membership pair. It does not make browser-local records a protected shared system of record. Dynamic multi-user collaboration needs server-side project persistence, a membership lifecycle, and authorization checks around every record read/write.

## Reverse proxies and rate limits

Express does not trust forwarded headers by default. If deployed behind a load balancer, set \`TRUST_PROXY_HOPS\` only to the exact, verified number of trusted proxy hops, after ensuring users cannot reach the app directly and spoof that chain.

The built-in rate counters are in-memory per process; they reset on restart and are not shared between replicas. Use a gateway/WAF or shared rate-limit store for production-scale deployment. These limits are protective defaults, not a substitute for provider quotas and cost controls.

## Release validation still required

- Enable Google sign-in and add the production domain to Firebase Authentication authorized domains.
- Provision actual UID/project membership entries.
- Run staging tests for successful login, no-token denial, invalid-token denial, disabled/revoked user behavior, project membership denial, and rate-limit responses.
- Verify reverse-proxy IP behavior and configure distributed rate limits.
- Run an independent penetration test and formal security review. Passing CI is not security certification.
