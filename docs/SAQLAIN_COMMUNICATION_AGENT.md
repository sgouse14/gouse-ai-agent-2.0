# Saqlain Communication Agent

## Purpose

The Communication Agent is a dedicated sixth role in the Saqlain operations cycle, separate from the four backup agents and the Recovery Agent. It prepares a compact internal status report after the cycle's backup, verification, and recovery results are available.

## Responsibilities

- Count completed/verified, held, and failed outcomes across earlier agents.
- Mark the cycle report `ALL_CHECKS_VERIFIED` only when no prior agent is held or failed; otherwise mark it `ATTENTION_REQUIRED`.
- Use a fixed internal review route: Task Queue Manager → Saqlain security review → Gouse AI final review.
- Avoid copying raw exception messages, file paths, credentials, or other agent-provided free text into its summary.
- Prepare an internal report and optionally send a fixed status envelope to operator-allowlisted remote agent IDs through a configured server-side transport. External dispatch is off by default.

## Security and audit integration

- The agent uses the existing Saqlain policy action `run_agent_communication`, which requires authenticated service context and project scope.
- The cycle runtime invokes it only after prior backup, verification, and recovery outcomes are complete.
- The runtime writes a `SAQLAIN_AGENT_COMMUNICATION` event to the existing hash-chained audit log when audit persistence is configured. An audit write failure changes the communication result to `HOLD`.
- The role has no source-file deletion or overwrite capability.
- The current approved runtime uses a trusted in-process service identity and the fixed application project scope. Do not expose the module through a public endpoint without adding route-level authentication, server-side project authorization, request validation, rate limits, and operational audit controls.

## Explicit limitations

The Communication Agent may communicate outward with explicitly approved remote agents, but it cannot register, import, invite, provision, or grant platform access to them. It has no inbound remote-command handler. Dispatch requires an operator-managed recipient allowlist, server-side actor/project authorization, explicit approval, a fixed structured payload, pre-send audit persistence, and a transport adapter that maps stable IDs to configured endpoints. It never accepts an arbitrary destination URL or forwards source files/secrets. Delivery integration must be staged and tested with real endpoints, credentials, timeouts, receipts, rate limits, and operational monitoring.

## Validation

Regression tests cover internal report routing, aggregate status counts, missing authentication/project scope, malformed cycle/result input, and exclusion of raw agent error text. Full CI (tests, TypeScript, production build, Docker build) must pass on the Communication-Agent commit before this addition is considered validated.
