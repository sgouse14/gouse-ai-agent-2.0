/**
 * Ordered 11-agent verification chain.
 *
 * This module orchestrates recorded reviews; it does not run AI analysis,
 * authenticate callers, grant access, or persist state. Production callers must
 * authenticate each reviewer and atomically persist chain state + audit events.
 */
export type VerificationVerdict = 'APPROVED' | 'REVIEW_REQUIRED' | 'REJECTED';
export type VerificationChainStatus = 'IN_PROGRESS' | 'HOLD' | 'REJECTED' | 'VERIFIED';

export const VERIFICATION_CHAIN_ROLES = Object.freeze([
  { order: 1, agentId: 'saq-threat-detection', name: 'Threat Detection', purpose: 'Check threat indicators and anomalous behavior.' },
  { order: 2, agentId: 'saq-malware-guard', name: 'Malware Guard', purpose: 'Check untrusted files and payload findings.' },
  { order: 3, agentId: 'saq-network-guard', name: 'Network Guard', purpose: 'Check network and API boundary evidence.' },
  { order: 4, agentId: 'saq-code-guardian', name: 'Code Guardian', purpose: 'Check code and artifact integrity findings.' },
  { order: 5, agentId: 'saq-agent-guard', name: 'Agent Guard', purpose: 'Check agent identity and task ownership.' },
  { order: 6, agentId: 'saq-api-guardian', name: 'API Guardian', purpose: 'Check API authorization and request-policy findings.' },
  { order: 7, agentId: 'saq-identity-guard', name: 'Identity Guard', purpose: 'Check credential, session, and identity findings.' },
  { order: 8, agentId: 'saq-data-guardian', name: 'Data Guardian', purpose: 'Check data integrity and protected-data handling.' },
  { order: 9, agentId: 'saq-audit-agent', name: 'Audit Agent', purpose: 'Check evidence completeness and audit-trail consistency.' },
  { order: 10, agentId: 'saq-recovery-agent', name: 'Recovery Agent', purpose: 'Check recovery readiness without changing protected originals.' },
  { order: 11, agentId: 'saq-external-intelligence', name: 'External Intelligence & Communication', purpose: 'Review sanitized external intelligence and communication provenance; cannot grant internal access.' },
] as const);

export type VerificationRoleId = typeof VERIFICATION_CHAIN_ROLES[number]['agentId'];

export interface VerificationReview {
  order: number;
  agentId: VerificationRoleId;
  reviewerId: string;
  verdict: VerificationVerdict;
  evidenceRefs: readonly string[];
  notes: string;
  reviewedAt: string;
}

export interface VerificationAuditEvent {
  event: 'CHAIN_CREATED' | 'REVIEW_RECORDED' | 'CHAIN_HELD' | 'CHAIN_RESUMED' | 'CHAIN_REJECTED' | 'CHAIN_VERIFIED';
  chainId: string;
  at: string;
  order?: number;
  agentId?: VerificationRoleId;
  verdict?: VerificationVerdict;
  reason?: string;
}

export interface VerificationChain {
  chainId: string;
  reportRef: string;
  status: VerificationChainStatus;
  currentOrder: number;
  createdAt: string;
  reviews: readonly VerificationReview[];
  auditEvents: readonly VerificationAuditEvent[];
  /** Verification is not an authorization grant. */
  grantsAccess: false;
}

export interface CreateVerificationChainInput {
  chainId: string;
  reportRef: string;
  now?: Date;
}

export interface SubmitVerificationReviewInput {
  order: number;
  reviewerId: string;
  verdict: VerificationVerdict;
  evidenceRefs: string[];
  notes?: string;
  now?: Date;
  /** Required for step 11 when the review contains external intelligence. */
  externalEvidenceSanitized?: boolean;
}

function requireNonBlank(value: string, field: string): void {
  if (!value.trim()) throw new Error(`${field} is required.`);
}

export function createVerificationChain(input: CreateVerificationChainInput): VerificationChain {
  requireNonBlank(input.chainId, 'chainId');
  requireNonBlank(input.reportRef, 'reportRef');
  const now = (input.now ?? new Date()).toISOString();
  return {
    chainId: input.chainId,
    reportRef: input.reportRef,
    status: 'IN_PROGRESS',
    currentOrder: 1,
    createdAt: now,
    reviews: [],
    auditEvents: [{ event: 'CHAIN_CREATED', chainId: input.chainId, at: now, reason: 'Started ordered 11-agent verification.' }],
    grantsAccess: false,
  };
}

export function submitVerificationReview(
  chain: VerificationChain,
  input: SubmitVerificationReviewInput,
): VerificationChain {
  if (chain.status !== 'IN_PROGRESS') throw new Error('Only an in-progress chain can accept a review.');
  if (input.order !== chain.currentOrder) throw new Error('Review order does not match the current verification step.');

  const role = VERIFICATION_CHAIN_ROLES[chain.currentOrder - 1];
  if (!role || input.order !== role.order) throw new Error('Invalid verification step.');
  if (input.reviewerId !== role.agentId) throw new Error('Reviewer identity does not match the assigned verification agent.');
  if (!['APPROVED', 'REVIEW_REQUIRED', 'REJECTED'].includes(input.verdict)) throw new Error('Invalid verification verdict.');
  if (!Array.isArray(input.evidenceRefs) || input.evidenceRefs.length === 0 || input.evidenceRefs.some(ref => typeof ref !== 'string' || !ref.trim())) {
    throw new Error('At least one non-empty evidence reference is required.');
  }
  if (role.order === 11 && input.externalEvidenceSanitized !== true) {
    throw new Error('Step 11 requires external evidence to be explicitly sanitized; the external agent cannot grant internal access.');
  }

  const now = (input.now ?? new Date()).toISOString();
  const review: VerificationReview = Object.freeze({
    order: role.order,
    agentId: role.agentId,
    reviewerId: input.reviewerId,
    verdict: input.verdict,
    evidenceRefs: Object.freeze([...input.evidenceRefs]),
    notes: input.notes ?? '',
    reviewedAt: now,
  });
  const event: VerificationAuditEvent = {
    event: 'REVIEW_RECORDED',
    chainId: chain.chainId,
    at: now,
    order: role.order,
    agentId: role.agentId,
    verdict: input.verdict,
  };

  if (input.verdict === 'REJECTED') {
    return {
      ...chain,
      status: 'REJECTED',
      reviews: [...chain.reviews, review],
      auditEvents: [...chain.auditEvents, event, { event: 'CHAIN_REJECTED', chainId: chain.chainId, at: now, order: role.order, agentId: role.agentId }],
      grantsAccess: false,
    };
  }
  if (input.verdict === 'REVIEW_REQUIRED') {
    return {
      ...chain,
      status: 'HOLD',
      reviews: [...chain.reviews, review],
      auditEvents: [...chain.auditEvents, event, { event: 'CHAIN_HELD', chainId: chain.chainId, at: now, order: role.order, agentId: role.agentId }],
      grantsAccess: false,
    };
  }

  const reviews = [...chain.reviews, review];
  if (role.order === VERIFICATION_CHAIN_ROLES.length) {
    return {
      ...chain,
      status: 'VERIFIED',
      currentOrder: VERIFICATION_CHAIN_ROLES.length + 1,
      reviews,
      auditEvents: [...chain.auditEvents, event, { event: 'CHAIN_VERIFIED', chainId: chain.chainId, at: now, order: role.order, agentId: role.agentId, reason: 'All 11 reviews approved; this is verification only, not authorization.' }],
      grantsAccess: false,
    };
  }

  return {
    ...chain,
    currentOrder: role.order + 1,
    reviews,
    auditEvents: [...chain.auditEvents, event],
    grantsAccess: false,
  };
}

export function getCurrentVerificationRole(chain: VerificationChain) {
  if (chain.status !== 'IN_PROGRESS') return null;
  return VERIFICATION_CHAIN_ROLES[chain.currentOrder - 1] ?? null;
}

/**
 * Resume a held chain at the same reviewer step after an authorized coordinator
 * schedules re-verification. The caller must enforce the 30-minute schedule
 * and authenticate the coordinator; this pure function does not schedule work.
 */
export function resumeHeldVerificationChain(chain: VerificationChain, now = new Date()): VerificationChain {
  if (chain.status !== 'HOLD') throw new Error('Only a held chain can be resumed.');
  const at = now.toISOString();
  return {
    ...chain,
    status: 'IN_PROGRESS',
    auditEvents: [...chain.auditEvents, {
      event: 'CHAIN_RESUMED',
      chainId: chain.chainId,
      at,
      order: chain.currentOrder,
      agentId: VERIFICATION_CHAIN_ROLES[chain.currentOrder - 1]?.agentId,
      reason: 'Held step reopened for re-verification; scheduling is handled by the caller.',
    }],
    grantsAccess: false,
  };
}
