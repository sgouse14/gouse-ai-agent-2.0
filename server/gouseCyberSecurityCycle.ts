/**
 * Gouse Cyber Security AI — unified 30-minute backup/recovery cycle.
 * Three controlled roles operate in each cycle:
 * 1) Backup agent
 * 2) Recovery agent
 * 3) Duplicate/verification agent
 *
 * Identity is re-checked for every sensitive operation. A wrong or inconsistent
 * identity is treated as a security event and the task is held for review.
 */

export const CYCLE_MINUTES = 30;
export const CYCLE_AGENT_COUNT = 3;

export type CycleRole = 'BACKUP' | 'RECOVERY' | 'DUPLICATE_VERIFIER';
export type CycleStatus = 'PENDING' | 'RUNNING' | 'HOLD' | 'VERIFIED' | 'FAILED';
export type IdentityStatus = 'VALID' | 'INVALID' | 'INCONSISTENT';

export interface CycleAgentAssignment {
  agentId: string;
  role: CycleRole;
  identityStatus: IdentityStatus;
  taskId: string;
}

export interface SecurityCycleReport {
  taskId: string;
  backupAgentId: string;
  recoveryAgentId: string;
  verifierAgentId: string;
  duplicateDetected: boolean;
  suspiciousEntryDetected: boolean;
  requiredCopyVerified: boolean;
  originalProtected: true;
  status: CycleStatus;
  identityCheckPassed: boolean;
}

export function createCycleAssignments(taskId: string, agentIds: string[]): CycleAgentAssignment[] {
  if (!taskId) throw new Error('taskId is required.');
  if (agentIds.length < CYCLE_AGENT_COUNT) {
    throw new Error('Three approved agents are required: backup, recovery, and duplicate verifier.');
  }
  return [
    { taskId, agentId: agentIds[0], role: 'BACKUP', identityStatus: 'VALID' },
    { taskId, agentId: agentIds[1], role: 'RECOVERY', identityStatus: 'VALID' },
    { taskId, agentId: agentIds[2], role: 'DUPLICATE_VERIFIER', identityStatus: 'VALID' },
  ];
}

/** Re-check identity before every sensitive operation, not only at assignment time. */
export function verifyAgentIdentity(
  expectedAgentId: string,
  presentedAgentId: string,
): IdentityStatus {
  if (!presentedAgentId || presentedAgentId !== expectedAgentId) return 'INVALID';
  return 'VALID';
}

/** A previously valid identity can still become a security event if it changes later. */
export function holdOnIdentityInconsistency(
  previous: IdentityStatus,
  current: IdentityStatus,
): boolean {
  return previous === 'VALID' && current !== 'VALID';
}

export function buildCycleReport(input: {
  taskId: string;
  backupAgentId: string;
  recoveryAgentId: string;
  verifierAgentId: string;
  duplicateDetected: boolean;
  suspiciousEntryDetected: boolean;
  requiredCopyVerified: boolean;
  identityCheckPassed: boolean;
}): SecurityCycleReport {
  const clean =
    input.identityCheckPassed &&
    !input.duplicateDetected &&
    !input.suspiciousEntryDetected &&
    input.requiredCopyVerified;
  return {
    ...input,
    originalProtected: true,
    status: clean ? 'VERIFIED' : 'HOLD',
  };
}
