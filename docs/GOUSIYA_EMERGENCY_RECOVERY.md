# Gousiya Emergency Recovery System

## Purpose and boundary

Gousiya is a defensive break-glass coordinator for emergency recovery rehearsals. It authorizes the existing Recovery Agent to verify a backup and copy it into a separate staging directory. It does not restore over live files, delete protected originals, disable security checks, escalate privileges, attack external systems, or bypass audit.

Implementation: server/gousiyaEmergencyRecovery.ts

## Authorization flow

1. An operator records an incident ID, reason, Recovery Agent ID, source snapshot, and separate staging root.
2. Both the system owner and an independent reviewer must approve the request. Approval booleans are a caller-supplied boundary in this module; production must bind them to authenticated, separately authorized identities and a durable approval record.
3. Gousiya creates a cryptographically random 256-bit bearer token. Only its SHA-256 digest is stored in the in-memory grant state; the raw token is returned once to the caller and is never written to the audit log.
4. The token is short-lived (two minutes by default; maximum five minutes) and single-use. Gousiya consumes it and durably audits that consumption before starting recovery, so a failed rehearsal requires a fresh authorization.
5. The existing Recovery Agent validates the manifest and file checksums and writes verified bytes to separate staging.
6. The result and outcome are audited. A VERIFIED result means staging passed integrity checks only; it is not permission to promote staged data to production.

Grants can be revoked before use. Expired, mismatched, revoked, consumed, or reused grants cannot execute.

## Safety rules

- Source snapshot and staging roots must not overlap.
- Existing Recovery Agent path, manifest, checksum, and symlink checks still apply.
- Protected originals and source backup evidence are not intentionally modified by this workflow.
- promotionAllowed remains false in the Recovery Agent result.
- A grant is consumed before filesystem work and cannot be replayed.
- Every issue, approval-denial, consumption, revocation, expiry, and recovery outcome is written to the hash-chained audit log. If the audit write before recovery fails, recovery does not start.
- The emergency component cannot change Gatekeeper policy, agent identities, file permissions, or security holds.

## Files and tests

- server/gousiyaEmergencyRecovery.ts — grant lifecycle and Recovery Agent integration.
- server/gousiyaEmergencyRecovery.test.ts — tests approval requirements, staging isolation, token replay, expiry, revocation, tampered backup handling, audit records, and preservation of source bytes.
- docs/GOUSIYA_EMERGENCY_RECOVERY.md — this guide.

Run npm test to execute the security suite.

## Production requirements and limitations

The current grant registry is in-memory. It is not safe for multi-process deployment or process restarts. The coordinator is integrated with the Recovery Agent as a server-side module; no public emergency-recovery HTTP route is exposed, because the current approval flags are not yet bound to authenticated roles. Before exposing an endpoint or relying on this in production, use a transactional durable store with atomic compare-and-swap consumption, authenticated role checks, owner/reviewer separation, secret management, rate limits, and off-host/WORM audit replication. Approval flags must not be accepted directly from an untrusted client. Keep source, staging, and audit storage under separate least-privilege OS ownership where practical. Do not use this module to automatically promote staged files into a live system; live restoration requires a separately reviewed, explicitly authorized procedure and a tested rollback plan.
