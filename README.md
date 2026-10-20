# Gouse AI Agent 2.0 — Saqlain Cyber Agent

An architecture and construction intelligence workspace with a defensive cybersecurity layer. The active application uses React, TypeScript, Vite, Express, and Gemini integrations.

## Core application

- Architecture and construction specialist chat
- Project intelligence and bill-of-quantities (BOQ) workflows
- Construction material and professional-search integrations
- Voice processing and translation endpoints
- Construction-site visual review
- Browser workspace with an Express API

## Saqlain AI security layer

The Saqlain feature branch adds security-domain types, defensive agent coordination, a security dashboard, verification/audit workflows, backup integrity checks, and task-queue monitoring.

Security behavior is designed to detect, explain, recommend, and audit—not to silently perform destructive mutations. Protected source programs and backup evidence must remain intact. Recovery rehearsals stage verified copies separately and do not authorize automatic promotion to production.

Key references:
- [Saqlain Security Team](docs/SAQLAIN_SECURITY_TEAM.md)
- [Security policies](docs/SAQLAIN_SECURITY.md)
- [Gatekeeper](docs/SAQLAIN_GATEKEEPER.md)
- [Recovery Agent](docs/SAQLAIN_RECOVERY_AGENT.md)
- [Secure Backup Agent](docs/SAQLAIN_SECURE_BACKUP_AGENT.md)
- [Gousiya Emergency Recovery](docs/GOUSIYA_EMERGENCY_RECOVERY.md)
- [Project progress](docs/PROJECT_PROGRESS.md)

## Requirements

- Node.js 22 or newer supported LTS
- Bun (lockfile-based installation)
- Gemini API key for AI-backed features

## Quick start

```bash
bun install --frozen-lockfile
cp .env.example .env
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

Set `GEMINI_API_KEY` in `.env`. Configure optional provider keys only when you use those integrations. Never commit `.env` or API credentials.

Start development:

```bash
bun run dev
```

Open http://localhost:3000.

## Verification commands

```bash
bun run test
bun run lint
bun run build
```

The security test suite covers task ownership and transitions, audit records, gatekeeper workflows, agent identity and heartbeat, verification chains, backup integrity, and isolated recovery staging.

## Production

```bash
bun run build
bun start
```

The build creates static frontend assets and bundles the Express server to `dist/server.cjs`. The server uses the deployment-provided `PORT` when set and falls back to port 3000 locally.

For Vite development or preview behind a custom hostname, set `VITE_ALLOWED_HOSTS` to a comma-separated list of explicitly trusted hosts. Do not disable host validation globally.

## Docker

```bash
docker build -t gouse-ai-agent .
docker run --rm -p 3000:3000 --env-file .env gouse-ai-agent
```

The multi-stage image builds with development dependencies but installs only production dependencies in the runtime stage. Secrets are supplied at runtime, not baked into the image.

## Health checks

- `GET /healthz`
- `GET /ping`
- `GET /api/health`

Health checks confirm process availability; they do not verify all external providers or security integrations.

## Production readiness

See [Saqlain Production Readiness Review](docs/SAQLAIN_PRODUCTION_READINESS.md) for the prioritized launch blockers, required controls, and current validation scope. The feature branch is not production-ready solely because CI passes.

## Security and professional review

- Keep API keys in environment variables or a deployment secret manager.
- Do not expose emergency recovery routes until authorization flags are derived from authenticated identities and a durable approval record.
- Use durable, transactional storage and off-host audit replication before relying on task queues or grants across processes/restarts.
- Treat AI-generated code interpretations, quantity estimates, material pricing, and site observations as advisory until reviewed by a qualified professional.
- Verify statutory requirements with current official authorities for the project's jurisdiction.
