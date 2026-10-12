import assert from "node:assert/strict";
import test from "node:test";
import {
  registerAgent,
  rotateAgentIdAfterVerifiedTask,
  suspendAgent,
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
