import {
  completeQueueTask,
  verifyQueueReport,
  type QueueReport,
  type QueueTask,
} from "./saqlainTaskQueueManager";
import {
  rotateAgentIdAfterVerifiedTask,
  type AgentIdentityState,
  type AgentIdentityRecord,
} from "./saqlainAgentIdentity";

export interface VerifiedTaskRotationResult {
  completedTask: QueueTask;
  updatedAgent: AgentIdentityRecord;
  reportVerified: true;
  oldBinaryId: string;
  newBinaryId: string;
}

/**
 * Coordinates queue completion with binary Agent ID rotation.
 *
 * The queue's agentId must be the stable agentKey from the identity registry,
 * not the rotating binary ID. The caller must run this inside a durable,
 * atomic transaction covering the queue task, identity state, issued-ID ledger,
 * and audit log. This helper itself is not a database transaction.
 */
export function completeVerifiedTaskAndRotateId(
  state: AgentIdentityState,
  input: {
    task: QueueTask;
    agentKey: string;
    presentedBinaryId: string;
    report: QueueReport;
    now?: Date;
  }
): VerifiedTaskRotationResult {
  const now = input.now ?? new Date();
  const agent = state.agents.get(input.agentKey);

  if (!agent || agent.status !== "ACTIVE" || !agent.ownerApproved) {
    throw new Error("Agent is not active and owner-approved.");
  }
  if (agent.currentBinaryId !== input.presentedBinaryId) {
    throw new Error("Stale or invalid binary Agent ID; task completion rejected.");
  }
  if (input.task.agentId !== input.agentKey) {
    throw new Error("Task is not assigned to this stable agent identity.");
  }
  if (
    input.report.agentId !== input.agentKey ||
    input.report.managerTaskId !== input.task.managerTaskId ||
    input.report.backupTaskId !== input.task.backupTaskId
  ) {
    throw new Error("Task report identity or IDs do not match the assigned task.");
  }

  const completedTask = completeQueueTask(input.task, input.agentKey, now);
  if (!verifyQueueReport(completedTask, input.report)) {
    throw new Error("Queue Manager report verification failed; Agent ID not rotated.");
  }

  const updatedAgent = rotateAgentIdAfterVerifiedTask(state, {
    agentKey: input.agentKey,
    presentedBinaryId: input.presentedBinaryId,
    taskId: input.task.managerTaskId,
    taskCompletionVerified: true,
  }, now);

  return {
    completedTask,
    updatedAgent,
    reportVerified: true,
    oldBinaryId: input.presentedBinaryId,
    newBinaryId: updatedAgent.currentBinaryId,
  };
}
