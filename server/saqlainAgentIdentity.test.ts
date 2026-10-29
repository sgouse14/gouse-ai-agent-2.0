import assert from "node:assert/strict";
import test from "node:test";
import {
  registerAgent,
  rotateAgentIdAfterVerifiedTask,
  suspendAgent,
  reactivateAgent,
  retireAgent,
  isAgentEligibleForWork,
  type AgentIdentityState,
} from "./saqlainAgentIdentity.ts";

function makeState(): AgentIdentityState {
  return {
    agents: new Map(),
    issuedIds: new Set(),
    auditEvents: [],
  };
}

test("registration requires owner approval and assigns a unique binary ID", () => {
  const state = makeState();
  assert.throws(() => registerAgent(state, { agentKey: "agent-a", ownerApproved: false }), /Owner approval/);
  const a = registerAgent(state, { agentKey: "agent-a", ownerApproved: true });
  const b = registerAgent(state, { agentKey: "agent-b", ownerApproved: true });
  assert.match(a.currentBinaryId, /^[01]{128}$/);
  assert.match(b.currentBinaryId, /^[01]{128}$/);
  assert.notEqual(a.currentBinaryId, b.currentBinaryId);
  assert.equal(state.auditEvents.length, 2);
});

test("verified completion rotates ID and retains old ID in the no-reuse ledger", () => {
  const state = makeState();
  const first = registerAgent(state, { agentKey: "agent-a", ownerApproved: true });
  const next = rotateAgentIdAfterVerifiedTask(state, {
    agentKey: "agent-a",
    presentedBinaryId: first.currentBinaryId,
    taskId: "task-001",
    taskCompletionVerified: true,
  });
  assert.notEqual(next.currentBinaryId, first.currentBinaryId);
  assert.equal(state.issuedIds.has(first.currentBinaryId), true);
  assert.equal(state.issuedIds.has(next.currentBinaryId), true);
  assert.equal(next.completedTaskCount, 1);
  assert.equal(state.auditEvents.at(-1)?.event, "ID_ROTATED");
});

test("unverified completion cannot rotate an ID", () => {
  const state = makeState();
  const agent = registerAgent(state, { agentKey: "agent-a", ownerApproved: true });
  assert.throws(() => rotateAgentIdAfterVerifiedTask(state, {
    agentKey: "agent-a",
    presentedBinaryId: agent.currentBinaryId,
    taskId: "task-002",
    taskCompletionVerified: false,
  }), /verified task completion/);
  assert.equal(state.agents.get("agent-a")?.currentBinaryId, agent.currentBinaryId);
});

test("stale ID and empty task ID are rejected", () => {
  const state = makeState();
  const agent = registerAgent(state, { agentKey: "agent-a", ownerApproved: true });
  assert.throws(() => rotateAgentIdAfterVerifiedTask(state, {
    agentKey: "agent-a",
    presentedBinaryId: "0".repeat(128),
    taskId: "task-003",
    taskCompletionVerified: true,
  }), /does not match/);
  assert.throws(() => rotateAgentIdAfterVerifiedTask(state, {
    agentKey: "agent-a",
    presentedBinaryId: agent.currentBinaryId,
    taskId: " ",
    taskCompletionVerified: true,
  }), /taskId is required/);
});

test("suspended agents cannot rotate IDs", () => {
  const state = makeState();
  const agent = registerAgent(state, { agentKey: "agent-a", ownerApproved: true });
  suspendAgent(state, "agent-a", "identity review");
  assert.throws(() => rotateAgentIdAfterVerifiedTask(state, {
    agentKey: "agent-a",
    presentedBinaryId: agent.currentBinaryId,
    taskId: "task-004",
    taskCompletionVerified: true,
  }), /not registered, active, and owner-approved/);
});

test("previous ID is rejected after rotation", () => {
  const state = makeState();
  const agent = registerAgent(state, { agentKey: "agent-a", ownerApproved: true });
  rotateAgentIdAfterVerifiedTask(state, {
    agentKey: "agent-a",
    presentedBinaryId: agent.currentBinaryId,
    taskId: "task-005",
    taskCompletionVerified: true,
  });
  assert.throws(() => rotateAgentIdAfterVerifiedTask(state, {
    agentKey: "agent-a",
    presentedBinaryId: agent.currentBinaryId,
    taskId: "task-006",
    taskCompletionVerified: true,
  }), /does not match/);
});


test("suspended agents are ineligible for dispatch until explicitly reactivated with approval", () => {
  const state = makeState();
  const agent = registerAgent(state, { agentKey: "agent-lifecycle", ownerApproved: true });
  assert.equal(isAgentEligibleForWork(state, { agentKey: agent.agentKey, presentedBinaryId: agent.currentBinaryId }), true);
  suspendAgent(state, agent.agentKey, "incident review");
  assert.equal(isAgentEligibleForWork(state, { agentKey: agent.agentKey, presentedBinaryId: agent.currentBinaryId }), false);
  assert.throws(() => reactivateAgent(state, { agentKey: agent.agentKey, ownerApproved: false, reason: "review complete" }), /Owner approval/);
  const active = reactivateAgent(state, { agentKey: agent.agentKey, ownerApproved: true, reason: "review complete" });
  assert.equal(active.status, "ACTIVE");
  assert.equal(isAgentEligibleForWork(state, { agentKey: agent.agentKey, presentedBinaryId: agent.currentBinaryId }), true);
  assert.deepEqual(state.auditEvents.slice(-2).map(event => event.event), ["SUSPENDED", "REACTIVATED"]);
});

test("retirement is terminal and permanently disables dispatch", () => {
  const state = makeState();
  const agent = registerAgent(state, { agentKey: "agent-retire", ownerApproved: true });
  const retired = retireAgent(state, { agentKey: agent.agentKey, reason: "replaced by approved successor" });
  assert.equal(retired.status, "RETIRED");
  assert.equal(retired.ownerApproved, false);
  assert.equal(state.issuedIds.has(agent.currentBinaryId), true);
  assert.equal(isAgentEligibleForWork(state, { agentKey: agent.agentKey, presentedBinaryId: agent.currentBinaryId }), false);
  assert.throws(() => reactivateAgent(state, { agentKey: agent.agentKey, ownerApproved: true, reason: "try again" }), /Only suspended agents/);
  assert.throws(() => retireAgent(state, { agentKey: agent.agentKey, reason: "duplicate" }), /already retired/);
});

test("lifecycle operations reject repeated invalid transitions and unsafe identifiers", () => {
  const state = makeState();
  assert.throws(() => registerAgent(state, { agentKey: "../unsafe", ownerApproved: true }), /safe/);
  const agent = registerAgent(state, { agentKey: "agent-transition", ownerApproved: true });
  assert.throws(() => suspendAgent(state, agent.agentKey, " "), /reason/);
  suspendAgent(state, agent.agentKey, "incident");
  assert.throws(() => suspendAgent(state, agent.agentKey, "again"), /Only active/);
  assert.throws(() => reactivateAgent(state, { agentKey: agent.agentKey, ownerApproved: true, reason: " " }), /reason/);
});
