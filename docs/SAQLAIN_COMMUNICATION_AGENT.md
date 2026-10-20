# Saqlain Communication Agent

## Purpose

The Communication Agent is a dedicated sixth role in the Saqlain operations cycle, separate from the four backup agents and the Recovery Agent. It prepares a compact internal status report after the cycle's backup, verification, and recovery results are available.

## Responsibilities

- Count completed/verified, held, and failed outcomes across earlier agents.
- Mark the cycle report `ALL_CHECKS_VERIFIED` only when no prior agent is held or failed; otherwise mark it `ATTENTION_REQUIRED`.
- Use a fixed internal review route: Task Queue Manager → Saqlain security review → Gouse AI final review.
- Avoid copying raw exception messages, file paths, credentials, or other agent-provided free text into its summary.
- Return an internal report only; it does not send email, SMS, webhooks, or other external messages.

## Security and audit integration

- The agent uses the existing Saqlain policy action `run_agent_communication`, which requires authenticated service context and project scope.
- The cycle runtime invokes it only after prior backup, verification, and recovery outcomes are complete.
- The runtime writes a `SAQLAIN_AGENT_COMMUNICATION` event to the existing hash-chained audit log when audit persistence is configured. An audit write failure changes the communication result to `HOLD`.
- The role has no source-file deletion or overwrite capability.
- The current approved runtime uses a trusted in-process service identity and the fixed application project scope. Do not expose the module through a public endpoint without adding route-level authentication, server-side project authorization, request validation, rate limits, and operational audit controls.

## Explicit limitations

The Communication Agent does not deliver external notifications, establish new recipient identities, or make authorization decisions for other agents. Its routing is a report workflow label, not proof that the listed reviewers received or acknowledged a message. Production delivery integrations require separate approval, secret management, delivery receipts, rate limiting, and end-to-end tests.

## Validation

Regression tests cover internal report routing, aggregate status counts, missing authentication/project scope, malformed cycle/result input, and exclusion of raw agent error text. Full CI (tests, TypeScript, production build, Docker build) must pass on the Communication-Agent commit before this addition is considered validated.
