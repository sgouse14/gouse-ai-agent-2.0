# EMP Attack Protector

## Purpose

The EMP Attack Protector is a defensive readiness and incident-triage module. It has three layers:

1. **Resilience/readiness:** tracks documented shielding/EMC assessment, surge protection, and verified offline backups.
2. **Impact assessment:** classifies operator/monitoring-reported symptoms such as unusual power loss, unexpected restarts, communications loss, electrical damage, or multiple systems becoming unavailable. These are indicators to investigate, not proof of an EMP.
3. **Recovery readiness:** tracks whether the recovery runbook has been exercised, compatible spare hardware is available, and an independent communications option has been tested.

## Security integration

- Assessment requests require a server-side `authorizeActor` callback. The callback must authenticate the actor and check membership for the requested project using trusted server state; do not trust roles or authorization booleans from a request body.
- The request is also checked by the existing Saqlain security policy as the protected, read-only `run_emp_protection_assessment` action. Missing authentication or project scope is blocked.
- Results and denials are written to the existing hash-chained audit log. If the durable audit write fails, the readiness result is withheld and the report returns `HOLD`.
- The module is advisory/read-only: it does not switch equipment, disable systems, mutate protected files, run hardware controls, or automatically declare that an EMP occurred.
- This module does not implement physical EMP sensors or validate shielding quality itself. Readiness signals must come from qualified assessments or trusted monitoring/operations processes.

## Integration contract

Create the protector only in a trusted server-side service with an audit path and a real authorization callback, then call `assess({ actorId, projectId, signals })` from an already-authenticated internal workflow. No public EMP endpoint is added by this module. Before exposing a route, the route must independently enforce authentication, project authorization, request validation, rate limits, and operational auditing.

## Validation

The regression suite covers fully ready and degraded inputs, reported-symptom triage, project authorization denial, auth callback failure, audit-log failure, malformed signals, and the Saqlain scoped-read policy. CI status must be checked after changes; unit tests do not replace staging or physical resilience testing.

## Remaining work before production

- Wire the module into the intended internal monitoring/orchestration runtime with trusted telemetry sources.
- Define ownership and freshness/expiry requirements for readiness signals.
- Evaluate physical shielding, surge protection, power continuity, backup isolation, spare equipment, and alternate communications with qualified site operators.
- Run end-to-end staging, failure-injection, and supervised recovery drills; configure alert routing and production audit retention.
- Review potential false positives and incident escalation procedures. Do not attribute symptoms to EMP without independent evidence.
