import {
  type AgentIdentityState,
  type AgentIdentityRecord,
  rotateAgentIdAfterVerifiedTask,
} from "./saqlainAgentIdentity";
import {
  type QueueReport,
  type QueueTask,
  completeQueueTask,
  verifyQueueReport,
} from "./saqlainTaskQueueManager";

export interface VerifiedTaskCompletion {
  completedTask: QueueTask;
  updatedAgent: AgentIdentityRecord;
  reportVerified: true;
}

/**
 * Queue Manager integration boundary:
 * 1) confirms the locked task belongs to the presented current binary ID;
 * 2) marks the task complete;
 * 3) verifies the report against the completed task;
 * 4) rotates the Agent ID only after both checks succeed.
 *
 * In production, persist the task, identity registry, issued-ID ledger, and
 * audit event in one database transaction. This helper is not itself a
 * durable transaction or a substitute for authorization middleware.
 */
export function completeVerifiedTaskAndRotateId(input: {
  identityState: AgentIdentityState;
  task: QueueTask;
  agentKey: string;
  presentedBinaryId: string;
  report: QueueReport;
  now?: Date;
}): VerifiedTaskCompletion {
  const { identityState, task, agentKey, presentedBinaryId, report } = input;
  const now = input.now ?? new Date();

  const agent = identityState.agents.get(agentKey);
  if (!agent || agent.status !== "ACTIVE" || !agent.ownerApproved) {
    throw new Error("Task completion denied: agent is not active and owner-approved.");
  }
  if (agent.currentBinaryId !== presentedBinaryId) {
    throw new Error("Task completion denied: stale or invalid binary Agent ID.");
  }
  if (task.agentId !== presentedBinaryId) {
    throw new Error("Task completion denied: task lock is not owned by the current binary ID.");
  }

  const completedTask = completeQueueTask(task, presentedBinaryId, now);
  if (!verifyQueueReport(completedTask, report)) {
    throw new Error("Task report verification failed; Agent ID must not rotate.");
  }

  const updatedAgent = rotateAgentIdAfterVerifiedTask(identityState, {
    agentKey,
    presentedBinaryId,
    taskId: completedTask.managerTaskId,
    taskCompletionVerified: true,
  }, now);

  return { completedTask, updatedAgent, reportVerified: true };
}

/** Gatekeeper helper: identify an active agent by its current binary ID only. */
export function verifyCurrentBinaryAgentId(
  identityState: AgentIdentityState,
  presentedBinaryId: string
): AgentIdentityRecord | null {
  if (!presentedBinaryId) return null;
  for (const agent of identityState.agents.values()) {
    if (
      agent.status === "ACTIVE" &&
      agent.ownerApproved &&
      agent.currentBinaryId === presentedBinaryId
    ) {
      return { ...agent };
    }
  }
  return null;
}
