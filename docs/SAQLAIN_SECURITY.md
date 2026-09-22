# Saqlain AI Agent

Saqlain AI Agent is the cybersecurity and security-operations layer for Gouse AI.

## Current scope

- Security findings dashboard
- Application security scan endpoint/service design
- Identity and project-authorization checks
- AI-action authorization review
- API abuse/rate-limit review
- File upload trust-boundary review
- Client-side persistence risk review

## Security principle

Saqlain should detect, explain, recommend, and audit. It should not silently perform destructive security or project mutations. High-impact actions should require explicit authorization and should be recorded in an audit trail.

## Workspace

The first dashboard is available at the `#saqlain` application route. The scan UI uses the server scanner when available and retains local findings if the scanner cannot be reached.

## Next hardening stages

1. Authentication and project-level authorization
2. Server-side project persistence
3. AI action gateway with schema validation and approvals
4. Rate limiting and provider quota protection
5. Secure file quarantine/scanning
6. Dependency and secret scanning in CI
7. Immutable security/audit event storage
