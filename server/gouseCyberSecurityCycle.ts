/**
 * Gouse Cyber Security AI — unified 30-minute backup/recovery cycle.
 * Four backup agents and one recovery agent are assigned per cycle.
 * Originals are always protected; any identity mismatch or suspicious entry
 * places the cycle on HOLD for human/security review.
 */
export const CYCLE_MINUTES = 30;
export const BACKUP_AGENT_COUNT = 4;
export const RECOVERY_AGENT_COUNT = 1;
export const CYCLE_AGENT_COUNT = BACKUP_AGENT_COUNT + RECOVERY_AGENT_COUNT;

export type CycleRole = 'BACKUP' | 'RECOVERY';
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
  backupAgentIds: string[];
  recoveryAgentId: string;
  duplicateDetected: boolean;
  suspiciousEntryDetected: boolean;
  requiredCopyVerified: boolean;
  originalProtected: true;
  status: CycleStatus;
  identityCheckPassed: boolean;
}

export function createCycleAssignments(taskId: string, agentIds: string[]): CycleAgentAssignment[] {
  if (!taskId.trim()) throw new Error('taskId is required.');
  if (agentIds.length !== CYCLE_AGENT_COUNT || agentIds.some((id) => !id.trim())) {
    throw new Error('Exactly five non-empty approved agent IDs are required: four backups and one recovery agent.');
  }
  if (new Set(agentIds).size !== agentIds.length) throw new Error('Each cycle assignment must use a distinct agent ID.');
  return [
    ...agentIds.slice(0, BACKUP_AGENT_COUNT).map((agentId) => ({
      taskId, agentId, role: 'BACKUP' as const, identityStatus: 'VALID' as const,
    })),
    { taskId, agentId: agentIds[BACKUP_AGENT_COUNT], role: 'RECOVERY', identityStatus: 'VALID' },
  ];
}

/** Re-check identity before every sensitive operation, not only at assignment time. */
export function verifyAgentIdentity(expectedAgentId: string, presentedAgentId: string): IdentityStatus {
  if (!expectedAgentId || !presentedAgentId || presentedAgentId !== expectedAgentId) return 'INVALID';
  return 'VALID';
}

/** A previously valid identity can still become a security event if it changes later. */
export function holdOnIdentityInconsistency(previous: IdentityStatus, current: IdentityStatus): boolean {
  return previous === 'VALID' && current !== 'VALID';
}

/** Invalid identity blocks the sensitive action and holds the cycle for review. */
export function authorizeSensitiveOperation(
  expectedAgentId: string,
  presentedAgentId: string,
  previousIdentity: IdentityStatus = 'VALID',
): { allowed: boolean; identityStatus: IdentityStatus; action: 'ALLOW' | 'HOLD' } {
  const identityStatus = verifyAgentIdentity(expectedAgentId, presentedAgentId);
  const inconsistent = holdOnIdentityInconsistency(previousIdentity, identityStatus);
  const allowed = identityStatus === 'VALID' && !inconsistent;
  return { allowed, identityStatus: inconsistent ? 'INCONSISTENT' : identityStatus, action: allowed ? 'ALLOW' : 'HOLD' };
}

export function buildCycleReport(input: {
  taskId: string;
  backupAgentIds: string[];
  recoveryAgentId: string;
  duplicateDetected: boolean;
  suspiciousEntryDetected: boolean;
  requiredCopyVerified: boolean;
  identityCheckPassed: boolean;
}): SecurityCycleReport {
  if (input.backupAgentIds.length !== BACKUP_AGENT_COUNT || new Set([...input.backupAgentIds, input.recoveryAgentId]).size !== CYCLE_AGENT_COUNT) {
    throw new Error('A report must identify four distinct backup agents and one distinct recovery agent.');
  }
  const clean = input.identityCheckPassed && !input.duplicateDetected &&
    !input.suspiciousEntryDetected && input.requiredCopyVerified;
  return { ...input, originalProtected: true, status: clean ? 'VERIFIED' : 'HOLD' };
}
