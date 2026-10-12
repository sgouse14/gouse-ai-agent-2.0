import assert from "node:assert/strict";
import test from "node:test";
import { registerAgent, suspendAgent, type AgentIdentityState } from "./saqlainAgentIdentity.ts";
import { evaluateRegisteredAgentAccess, type ExternalAccessRequest } from "./saqlainGatekeeper.ts";

function setup() {
  const identityState: AgentIdentityState = { agents: new Map(), issuedIds: new Set(), auditEvents: [] };
  const agent = registerAgent(identityState, { agentKey: "external-agent-a", ownerApproved: true });
  const request: ExternalAccessRequest = {
    requestId: "req-001",
    agentId: agent.currentBinaryId,
    platformId: "partner-platform",
    apiCredential: "test-credential",
    requestedScope: ["public-api"],
  };
  const verifyCredential = ({ credential, agentKey, platformId }: { credential: string; agentKey: string; platformId: string; now: Date }) =>
    credential === "test-credential" && agentKey === "external-agent-a" && platformId === "partner-platform";
  return { identityState, agent, request, verifyCredential };
}

test("registered agent with matching credential can pass approved public scope", () => {
  const x = setup();
  const result = evaluateRegisteredAgentAccess(x, new Date("2026-01-01T00:00:00Z"));
  assert.equal(result.decision, "PASS");
  assert.equal(result.auditEvent.actor, x.agent.currentBinaryId);
});

test("unknown or retired binary ID is blocked", () => {
  const x = setup();
  const result = evaluateRegisteredAgentAccess({
    ...x,
    request: { ...x.request, agentId: "0".repeat(128) },
  });
  assert.equal(result.decision, "BLOCK");
});

test("invalid credential is blocked", () => {
  const x = setup();
  const result = evaluateRegisteredAgentAccess({
    ...x,
    request: { ...x.request, apiCredential: "wrong" },
  });
  assert.equal(result.decision, "BLOCK");
});

test("protected resource scope is blocked even for a registered agent", () => {
  const x = setup();
  const result = evaluateRegisteredAgentAccess({
    ...x,
    request: { ...x.request, requestedScope: ["protected-files"] },
  });
  assert.equal(result.decision, "BLOCK");
});

test("unknown scope is held for review", () => {
  const x = setup();
  const result = evaluateRegisteredAgentAccess({
    ...x,
    request: { ...x.request, requestedScope: ["admin-console"] },
  });
  assert.equal(result.decision, "HOLD");
});

test("sensitive operation is held for security review", () => {
  const x = setup();
  const result = evaluateRegisteredAgentAccess({
    ...x,
    request: { ...x.request, sensitiveOperation: true },
  });
  assert.equal(result.decision, "HOLD");
});

test("suspended agent is blocked", () => {
  const x = setup();
  suspendAgent(x.identityState, x.agent.agentKey, "security review");
  const result = evaluateRegisteredAgentAccess(x);
  assert.equal(result.decision, "BLOCK");
});

test("credential verifier exception fails closed", () => {
  const x = setup();
  const result = evaluateRegisteredAgentAccess({
    ...x,
    verifyCredential: () => { throw new Error("credential service unavailable"); },
  });
  assert.equal(result.decision, "BLOCK");
});
