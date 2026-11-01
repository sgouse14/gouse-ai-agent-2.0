import { randomBytes } from "node:crypto";

export type AgentIdentityStatus = "ACTIVE" | "RETIRED" | "SUSPENDED";

export interface AgentIdentityRecord {
  /** Stable internal key; never changes when the binary ID rotates. */
  agentKey: string;
  currentBinaryId: string;
  status: AgentIdentityStatus;
  ownerApproved: boolean;
  issuedAt: string;
  lastRotatedAt: string | null;
  completedTaskCount: number;
}

export interface AgentIdentityAuditEvent {
  event: "REGISTERED" | "ID_ROTATED" | "SUSPENDED" | "REACTIVATED" | "RETIRED";
  agentKey: string;
  previousBinaryId: string | null;
  currentBinaryId: string | null;
  taskId: string | null;
  timestamp: string;
  reason: string;
}

/**
 * State must be loaded from and atomically committed to durable storage by the
 * caller. The retiredIds set is the permanent no-reuse ledger. Do not use a
 * process-local set as the production source of truth.
 */
export interface AgentIdentityState {
  agents: Map<string, AgentIdentityRecord>;
  /** Contains every current and retired ID ever issued. Never delete entries. */
  issuedIds: Set<string>;
  auditEvents: AgentIdentityAuditEvent[];
}

export const BINARY_AGENT_ID_BITS = 128;

function generateUniqueBinaryId(issuedIds: Set<string>): string {
  // CSPRNG output, rendered as a fixed-width binary string.
  for (let attempt = 0; attempt < 32; attempt += 1) {
    const hex = randomBytes(BINARY_AGENT_ID_BITS / 8).toString("hex");
    const candidate = hex
      .split("")
      .map((digit) => Number.parseInt(digit, 16).toString(2).padStart(4, "0"))
      .join("");

    if (!issuedIds.has(candidate)) return candidate;
  }

  throw new Error("Could not allocate an unused binary Agent ID; stop and alert security.");
}

/** Only an owner-approved agent may be registered by this service. */
export function registerAgent(
  state: AgentIdentityState,
  input: { agentKey: string; ownerApproved: boolean },
  now = new Date()
): AgentIdentityRecord {
  if (!isSafeAgentKey(input.agentKey)) throw new Error("agentKey must be a safe 1-128 character identifier.");
  if (!input.ownerApproved) throw new Error("Owner approval is required to register an agent.");
  if (state.agents.has(input.agentKey)) throw new Error("agentKey is already registered.");

  const binaryId = generateUniqueBinaryId(state.issuedIds);
  const timestamp = now.toISOString();
  const record: AgentIdentityRecord = {
    agentKey: input.agentKey,
    currentBinaryId: binaryId,
    status: "ACTIVE",
    ownerApproved: true,
    issuedAt: timestamp,
    lastRotatedAt: null,
    completedTaskCount: 0,
  };

  state.issuedIds.add(binaryId);
  state.agents.set(input.agentKey, record);
  state.auditEvents.push({
    event: "REGISTERED",
    agentKey: input.agentKey,
    previousBinaryId: null,
    currentBinaryId: binaryId,
    taskId: null,
    timestamp,
    reason: "Owner-approved agent registered.",
  });

  return { ...record };
}

/**
 * Rotate only after the Queue Manager has verified completion and confirmed
 * that the task was owned by the agent's currently active binary ID.
 * The caller must atomically persist the updated record, issuedIds, and audit.
 */
export function rotateAgentIdAfterVerifiedTask(
  state: AgentIdentityState,
  input: {
    agentKey: string;
    presentedBinaryId: string;
    taskId: string;
    taskCompletionVerified: boolean;
  },
  now = new Date()
): AgentIdentityRecord {
  if (!isSafeLifecycleText(input.taskId, 256)) throw new Error("taskId is required and must be at most 256 characters.");
  if (!input.taskCompletionVerified) {
    throw new Error("Agent ID rotation requires verified task completion.");
  }

  const current = state.agents.get(input.agentKey);
  if (!current || current.status !== "ACTIVE" || !current.ownerApproved) {
    throw new Error("Agent is not registered, active, and owner-approved.");
  }
  if (current.currentBinaryId !== input.presentedBinaryId) {
    throw new Error("Presented binary ID does not match the current Agent ID.");
  }

  const previousBinaryId = current.currentBinaryId;
  // Retired IDs remain in issuedIds forever; candidate generation checks all IDs.
  state.issuedIds.add(previousBinaryId);
  const nextBinaryId = generateUniqueBinaryId(state.issuedIds);
  const timestamp = now.toISOString();

  const updated: AgentIdentityRecord = {
    ...current,
    currentBinaryId: nextBinaryId,
    lastRotatedAt: timestamp,
    completedTaskCount: current.completedTaskCount + 1,
  };

  state.issuedIds.add(nextBinaryId);
  state.agents.set(input.agentKey, updated);
  state.auditEvents.push({
    event: "ID_ROTATED",
    agentKey: input.agentKey,
    previousBinaryId,
    currentBinaryId: nextBinaryId,
    taskId: input.taskId,
    timestamp,
    reason: "Queue Manager verified task completion; previous ID retired.",
  });

  return { ...updated };
}

export function suspendAgent(
  state: AgentIdentityState,
  agentKey: string,
  reason: string,
  now = new Date()
): AgentIdentityRecord {
  const current = state.agents.get(agentKey);
  if (!current) throw new Error("Unknown agent.");
  if (current.status !== "ACTIVE") throw new Error("Only active agents can be suspended.");
  if (!isSafeLifecycleText(reason, 2000)) throw new Error("A suspension reason of at most 2000 characters is required.");

  const updated = { ...current, status: "SUSPENDED" as const };
  state.agents.set(agentKey, updated);
  state.auditEvents.push({
    event: "SUSPENDED",
    agentKey,
    previousBinaryId: current.currentBinaryId,
    currentBinaryId: current.currentBinaryId,
    taskId: null,
    timestamp: now.toISOString(),
    reason,
  });
  return { ...updated };
}

export const SAQLAIN_AGENT_ID_POLICY = Object.freeze({
  binaryIdBits: BINARY_AGENT_ID_BITS,
  rotateAfterVerifiedTaskCompletion: true,
  retiredIdsMayBeReused: false,
  ownerApprovalRequiredForRegistration: true,
  separateCredentialRequiredForAccess: true,
  stableAgentKeyRetainedForAudit: true,
  durableAtomicPersistenceRequired: true,
  gatekeeperMaySelfApprove: false,
});


/**
 * Reactivation is a privileged lifecycle operation. The caller must derive
 * ownerApproved from a trusted server-side authorization/approval record,
 * never from an untrusted request body.
 */
export function reactivateAgent(
  state: AgentIdentityState,
  input: { agentKey: string; ownerApproved: boolean; reason: string },
  now = new Date()
): AgentIdentityRecord {
  const current = state.agents.get(input.agentKey);
  if (!current) throw new Error("Unknown agent.");
  if (current.status !== "SUSPENDED") throw new Error("Only suspended agents can be reactivated.");
  if (!input.ownerApproved) throw new Error("Owner approval is required to reactivate an agent.");
  if (!isSafeLifecycleText(input.reason, 2000)) throw new Error("A reactivation reason of at most 2000 characters is required.");

  const updated: AgentIdentityRecord = { ...current, status: "ACTIVE", ownerApproved: true };
  state.agents.set(input.agentKey, updated);
  state.auditEvents.push({
    event: "REACTIVATED",
    agentKey: input.agentKey,
    previousBinaryId: current.currentBinaryId,
    currentBinaryId: current.currentBinaryId,
    taskId: null,
    timestamp: now.toISOString(),
    reason: input.reason.trim(),
  });
  return { ...updated };
}

/** Retirement is terminal: IDs stay in the no-reuse ledger and cannot be reactivated. */
export function retireAgent(
  state: AgentIdentityState,
  input: { agentKey: string; reason: string },
  now = new Date()
): AgentIdentityRecord {
  const current = state.agents.get(input.agentKey);
  if (!current) throw new Error("Unknown agent.");
  if (current.status === "RETIRED") throw new Error("Agent is already retired.");
  if (!isSafeLifecycleText(input.reason, 2000)) throw new Error("A retirement reason of at most 2000 characters is required.");

  const updated: AgentIdentityRecord = { ...current, status: "RETIRED", ownerApproved: false };
  state.agents.set(input.agentKey, updated);
  state.issuedIds.add(current.currentBinaryId);
  state.auditEvents.push({
    event: "RETIRED",
    agentKey: input.agentKey,
    previousBinaryId: current.currentBinaryId,
    currentBinaryId: current.currentBinaryId,
    taskId: null,
    timestamp: now.toISOString(),
    reason: input.reason.trim(),
  });
  return { ...updated };
}

/** Queue/dispatch guard: only the current binary ID of an active approved agent is eligible. */
export function isAgentEligibleForWork(
  state: AgentIdentityState,
  input: { agentKey: string; presentedBinaryId: string }
): boolean {
  const agent = state.agents.get(input.agentKey);
  return Boolean(
    agent &&
    agent.status === "ACTIVE" &&
    agent.ownerApproved &&
    agent.currentBinaryId === input.presentedBinaryId &&
    /^[01]{128}$/.test(input.presentedBinaryId)
  );
}

function isSafeAgentKey(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value);
}

function isSafeLifecycleText(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}
