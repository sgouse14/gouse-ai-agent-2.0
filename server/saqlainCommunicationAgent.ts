import { evaluateSaqlainAction } from './saqlainSecurity.ts';

export type CommunicationCycleStatus = 'VERIFIED' | 'HOLD' | 'FAILED';

export interface CommunicationPriorResult {
  agentId: string;
  role: string;
  status: CommunicationCycleStatus;
  summary?: string;
}

export interface SaqlainCommunicationInput {
  /** Fixed internal service identity; never populate this from a request body. */
  actorId: string;
  /** Must come from trusted server/service authentication, not client input. */
  actorAuthenticated: boolean;
  /** Server-selected project/application scope. */
  projectId: string;
  cycleId: string;
  priorResults: readonly CommunicationPriorResult[];
}

export interface SaqlainCommunicationOutcome {
  status: 'VERIFIED' | 'HOLD';
  summary: string;
  report?: {
    cycleId: string;
    overall: 'ALL_CHECKS_VERIFIED' | 'ATTENTION_REQUIRED';
    counts: Readonly<{ verified: number; held: number; failed: number }>;
    route: readonly ['queue-manager', 'saqlain-security-review', 'gouse-ai-final-review'];
    delivery: 'INTERNAL_REPORT_ONLY';
  };
}

/**
 * Prepares a minimal internal cycle-status report.
 *
 * This agent deliberately does not send email, webhooks, SMS, or other external
 * messages. The trusted runtime audits the returned summary before the cycle is
 * considered complete. Any future delivery adapter must have its own scoped
 * authorization, secrets, rate limits, and delivery audit.
 */
export function prepareSaqlainCommunication(input: SaqlainCommunicationInput): SaqlainCommunicationOutcome {
  if (!input || typeof input !== 'object') return { status: 'HOLD', summary: 'Communication held: invalid input.' };
  if (typeof input.actorId !== 'string' || !input.actorId.trim() || input.actorId.length > 128) {
    return { status: 'HOLD', summary: 'Communication held: invalid internal actor identity.' };
  }
  if (typeof input.projectId !== 'string' || !input.projectId.trim() || input.projectId.length > 200) {
    return { status: 'HOLD', summary: 'Communication held: project scope is required.' };
  }
  if (typeof input.cycleId !== 'string' || !/^saqlain-cycle-[0-9a-f-]{36}$/i.test(input.cycleId)) {
    return { status: 'HOLD', summary: 'Communication held: invalid cycle identifier.' };
  }
  if (!Array.isArray(input.priorResults)) {
    return { status: 'HOLD', summary: 'Communication held: cycle results are unavailable.' };
  }

  const policy = evaluateSaqlainAction({
    actionType: 'run_agent_communication',
    actorAuthenticated: input.actorAuthenticated,
    projectId: input.projectId,
  });
  if (policy.decision !== 'allow') {
    return { status: 'HOLD', summary: 'Communication held by Saqlain policy: ' + policy.reason };
  }

  let verified = 0;
  let held = 0;
  let failed = 0;
  for (const result of input.priorResults) {
    if (!result || typeof result.agentId !== 'string' || !result.agentId.trim() ||
      !['VERIFIED', 'HOLD', 'FAILED'].includes(result.status)) {
      return { status: 'HOLD', summary: 'Communication held: malformed agent result.' };
    }
    if (result.status === 'VERIFIED') verified += 1;
    else if (result.status === 'HOLD') held += 1;
    else failed += 1;
  }

  const overall = held + failed > 0 ? 'ATTENTION_REQUIRED' : 'ALL_CHECKS_VERIFIED';
  const report = Object.freeze({
    cycleId: input.cycleId,
    overall,
    counts: Object.freeze({ verified, held, failed }),
    route: Object.freeze(['queue-manager', 'saqlain-security-review', 'gouse-ai-final-review']) as unknown as readonly ['queue-manager', 'saqlain-security-review', 'gouse-ai-final-review'],
    delivery: 'INTERNAL_REPORT_ONLY' as const,
  });
  // Do not include raw agent summaries, paths, credentials, or exception messages.
  const summary = 'Internal cycle-status report prepared; cycle=' + input.cycleId +
    '; overall=' + overall + '; verified=' + verified + '; held=' + held +
    '; failed=' + failed + '; route=queue-manager>saqlain-security-review>gouse-ai-final-review' +
    '; delivery=INTERNAL_REPORT_ONLY (no external message sent).';
  return { status: 'VERIFIED', summary, report };
}
