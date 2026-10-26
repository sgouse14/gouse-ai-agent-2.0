/**
 * Gousiya recovery orchestration state machine.
 *
 * This module coordinates and validates workflow transitions only. It never
 * performs filesystem repair or production promotion. Callers must atomically
 * persist the returned versioned record and durable audit event before
 * acknowledging a transition; do not use process memory as the source of truth.
 */
export type GousiyaWorkflowStage =
  | 'INTAKE'
  | 'SNAPSHOT_VALIDATED'
  | 'APPROVAL_PENDING'
  | 'GRANT_ISSUED'
  | 'RECOVERY_STAGED'
  | 'VERIFICATION_PENDING'
  | 'VERIFIED'
  | 'HOLD'
  | 'CLOSED';

export interface GousiyaWorkflowEvent {
  from: GousiyaWorkflowStage | null;
  to: GousiyaWorkflowStage;
  actorId: string;
  reason: string;
  evidenceId: string | null;
  at: string;
}

export interface GousiyaRecoveryWorkflow {
  workflowId: string;
  incidentId: string;
  stage: GousiyaWorkflowStage;
  version: number;
  createdAt: string;
  updatedAt: string;
  holdReturnStage: GousiyaWorkflowStage | null;
  events: readonly GousiyaWorkflowEvent[];
}

export interface GousiyaWorkflowTransition {
  expectedVersion: number;
  to: GousiyaWorkflowStage;
  actorId: string;
  reason: string;
  evidenceId?: string;
  /** IDs must come from verified approval claims, not user-supplied labels. */
  ownerApprovalId?: string;
  reviewerApprovalId?: string;
  /** Set only from the trusted recovery executor's persisted result. */
  grantConsumed?: boolean;
  /** Set only from the trusted staged-recovery verification result. */
  verificationPassed?: boolean;
}

const TERMINAL = new Set<GousiyaWorkflowStage>(['CLOSED']);
const ALLOWED: Readonly<Record<GousiyaWorkflowStage, readonly GousiyaWorkflowStage[]>> = {
  INTAKE: ['SNAPSHOT_VALIDATED', 'HOLD'],
  SNAPSHOT_VALIDATED: ['APPROVAL_PENDING', 'HOLD'],
  APPROVAL_PENDING: ['GRANT_ISSUED', 'HOLD'],
  GRANT_ISSUED: ['RECOVERY_STAGED', 'HOLD'],
  RECOVERY_STAGED: ['VERIFICATION_PENDING', 'HOLD'],
  VERIFICATION_PENDING: ['VERIFIED', 'HOLD'],
  VERIFIED: ['CLOSED', 'HOLD'],
  HOLD: ['INTAKE', 'SNAPSHOT_VALIDATED', 'APPROVAL_PENDING', 'GRANT_ISSUED', 'RECOVERY_STAGED', 'VERIFICATION_PENDING', 'VERIFIED', 'CLOSED'],
  CLOSED: [],
};

function requiredText(value: unknown, label: string, max = 256): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) {
    throw new Error(label + ' is required and must be at most ' + max + ' characters.');
  }
  return value.trim();
}

function validStage(value: unknown): value is GousiyaWorkflowStage {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(ALLOWED, value);
}

export function createGousiyaRecoveryWorkflow(input: {
  workflowId: string;
  incidentId: string;
  actorId: string;
  reason: string;
  now?: Date;
}): GousiyaRecoveryWorkflow {
  const workflowId = requiredText(input.workflowId, 'workflowId', 128);
  const incidentId = requiredText(input.incidentId, 'incidentId', 128);
  const actorId = requiredText(input.actorId, 'actorId', 128);
  const reason = requiredText(input.reason, 'reason', 2000);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(workflowId) ||
      !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(incidentId)) {
    throw new Error('Workflow and incident IDs must be safe identifiers.');
  }
  const now = (input.now ?? new Date()).toISOString();
  return Object.freeze({
    workflowId, incidentId, stage: 'INTAKE', version: 1,
    createdAt: now, updatedAt: now, holdReturnStage: null,
    events: Object.freeze([{ from: null, to: 'INTAKE' as const, actorId, reason, evidenceId: null, at: now }]),
  });
}

export function transitionGousiyaRecoveryWorkflow(
  workflow: GousiyaRecoveryWorkflow,
  input: GousiyaWorkflowTransition,
  now = new Date(),
): GousiyaRecoveryWorkflow {
  if (!workflow || !Array.isArray(workflow.events) || !validStage(workflow.stage)) {
    throw new Error('A valid persisted workflow record is required.');
  }
  if (!Number.isSafeInteger(input.expectedVersion) || input.expectedVersion !== workflow.version) {
    throw new Error('Workflow version conflict; reload before transitioning.');
  }
  if (!validStage(input.to)) throw new Error('Unknown workflow stage.');
  if (TERMINAL.has(workflow.stage)) throw new Error('Closed workflows are immutable.');
  if (!ALLOWED[workflow.stage].includes(input.to)) {
    throw new Error('Invalid workflow transition from ' + workflow.stage + ' to ' + input.to + '.');
  }

  const actorId = requiredText(input.actorId, 'actorId', 128);
  const reason = requiredText(input.reason, 'reason', 2000);
  const evidenceId = input.evidenceId === undefined ? null : requiredText(input.evidenceId, 'evidenceId', 256);
  let holdReturnStage = workflow.holdReturnStage;

  if (input.to === 'SNAPSHOT_VALIDATED' && !evidenceId) {
    throw new Error('Snapshot validation requires a durable evidence reference.');
  }
  if (input.to === 'GRANT_ISSUED') {
    const owner = requiredText(input.ownerApprovalId, 'ownerApprovalId', 256);
    const reviewer = requiredText(input.reviewerApprovalId, 'reviewerApprovalId', 256);
    if (owner === reviewer) throw new Error('Owner and independent reviewer approvals must be distinct.');
    if (!evidenceId) throw new Error('Grant issuance requires a persisted grant reference.');
  }
  if (input.to === 'RECOVERY_STAGED' && input.grantConsumed !== true) {
    throw new Error('Staging requires a trusted record that the one-time grant was consumed.');
  }
  if (input.to === 'VERIFIED' && (input.verificationPassed !== true || !evidenceId)) {
    throw new Error('Verification requires a passing trusted result and evidence reference.');
  }
  if (input.to === 'HOLD') holdReturnStage = workflow.stage;
  if (workflow.stage === 'HOLD' && input.to !== 'CLOSED' && input.to !== 'HOLD') {
    if (input.to !== workflow.holdReturnStage) {
      throw new Error('A held workflow may resume only at its recorded stage.');
    }
    if (!evidenceId) throw new Error('Resuming a held workflow requires resolution evidence.');
    holdReturnStage = null;
  }
  if (input.to === 'CLOSED' && workflow.stage !== 'VERIFIED' && !(workflow.stage === 'HOLD' && workflow.holdReturnStage === 'VERIFIED')) {
    throw new Error('Only a verified recovery workflow can be closed.');
  }

  const at = now.toISOString();
  const event: GousiyaWorkflowEvent = Object.freeze({
    from: workflow.stage, to: input.to, actorId, reason, evidenceId, at,
  });
  return Object.freeze({
    ...workflow,
    stage: input.to,
    version: workflow.version + 1,
    updatedAt: at,
    holdReturnStage,
    events: Object.freeze([...workflow.events, event]),
  });
}
