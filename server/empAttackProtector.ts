import { randomUUID } from 'node:crypto';
import { appendDurableAuditEvent } from './saqlainAuditLog.ts';
import { evaluateSaqlainAction } from './saqlainSecurity.ts';

export type EmpProtectionStatus = 'READY' | 'DEGRADED' | 'ALERT' | 'HOLD';
export type EmpObservation =
  | 'unexpected_power_loss'
  | 'unexpected_restart'
  | 'communications_loss'
  | 'unusual_electrical_damage'
  | 'multiple_systems_unavailable';

export interface EmpProtectionSignals {
  /** A qualified assessment of shielding/EMC protections has been recorded. */
  shieldingAssessed: boolean | null;
  /** Surge protection is in place and maintained for in-scope equipment. */
  surgeProtection: boolean | null;
  /** At least one verified offline or isolated backup is available. */
  offlineBackups: boolean | null;
  /** The recovery runbook has been rehearsed within the organisation's policy window. */
  recoveryRunbookTested: boolean | null;
  /** Compatible spare equipment or replacement components are available. */
  spareHardwareAvailable: boolean | null;
  /** An independent communications method has been documented and tested. */
  alternateCommunicationAvailable: boolean | null;
  /**
   * Reported symptoms from an operator or trusted server-side monitoring adapter.
   * This field is not proof of an EMP and must never be accepted directly from an
   * untrusted client as sensor truth.
   */
  reportedObservations: readonly EmpObservation[];
}

export interface EmpProtectionLayer {
  status: 'READY' | 'DEGRADED' | 'CLEAR' | 'INVESTIGATE';
  findingCodes: readonly string[];
}

export interface EmpProtectionReport {
  assessmentId: string;
  assessedAt: string;
  status: EmpProtectionStatus;
  audited: boolean;
  readiness: EmpProtectionLayer;
  impactAssessment: EmpProtectionLayer;
  recovery: EmpProtectionLayer;
  recommendations: readonly string[];
  reason?: string;
}

export interface EmpProtectionRequest {
  actorId: string;
  projectId: string;
  signals: EmpProtectionSignals;
}

export interface EmpAttackProtectorOptions {
  /** Absolute path to the existing durable Saqlain hash-chained audit log. */
  auditFilePath: string;
  /**
   * Server-side authorization callback. It must derive the actor and project
   * membership from trusted authentication/authorization state, never request
   * body flags or client-supplied roles.
   */
  authorizeActor: (input: { actorId: string; projectId: string }) => Promise<boolean>;
  now?: () => Date;
  /** Injection point for failure tests; production should use the durable audit writer. */
  appendAudit?: typeof appendDurableAuditEvent;
}

const ALLOWED_OBSERVATIONS = new Set<EmpObservation>([
  'unexpected_power_loss',
  'unexpected_restart',
  'communications_loss',
  'unusual_electrical_damage',
  'multiple_systems_unavailable',
]);

const OBSERVATION_ADVICE: Readonly<Record<EmpObservation, string>> = Object.freeze({
  unexpected_power_loss: 'Verify power quality and affected equipment; compare against independent utility and facility telemetry.',
  unexpected_restart: 'Preserve system logs and compare restart times across independently powered systems.',
  communications_loss: 'Check independent communication paths and ordinary network/power faults before attributing cause.',
  unusual_electrical_damage: 'Have qualified personnel inspect affected equipment; do not energize potentially damaged systems.',
  multiple_systems_unavailable: 'Coordinate a controlled incident assessment and prioritise safety, continuity, and evidence preservation.',
});

/** Pure assessment: this is an EMP-readiness advisor, not a physical EMP detector. */
export function assessEmpProtection(signals: EmpProtectionSignals): Omit<EmpProtectionReport, 'assessmentId' | 'assessedAt' | 'audited'> {
  validateSignals(signals);
  const readinessFindings: string[] = [];
  if (signals.shieldingAssessed !== true) readinessFindings.push(signals.shieldingAssessed === false ? 'SHIELDING_NOT_CONFIRMED' : 'SHIELDING_ASSESSMENT_UNKNOWN');
  if (signals.surgeProtection !== true) readinessFindings.push(signals.surgeProtection === false ? 'SURGE_PROTECTION_MISSING' : 'SURGE_PROTECTION_UNKNOWN');
  if (signals.offlineBackups !== true) readinessFindings.push(signals.offlineBackups === false ? 'OFFLINE_BACKUP_MISSING' : 'OFFLINE_BACKUP_UNKNOWN');

  const recoveryFindings: string[] = [];
  if (signals.recoveryRunbookTested !== true) recoveryFindings.push(signals.recoveryRunbookTested === false ? 'RECOVERY_RUNBOOK_NOT_TESTED' : 'RECOVERY_RUNBOOK_STATUS_UNKNOWN');
  if (signals.spareHardwareAvailable !== true) recoveryFindings.push(signals.spareHardwareAvailable === false ? 'SPARE_HARDWARE_UNAVAILABLE' : 'SPARE_HARDWARE_STATUS_UNKNOWN');
  if (signals.alternateCommunicationAvailable !== true) recoveryFindings.push(signals.alternateCommunicationAvailable === false ? 'ALTERNATE_COMMUNICATION_UNAVAILABLE' : 'ALTERNATE_COMMUNICATION_STATUS_UNKNOWN');

  const uniqueObservations = [...new Set(signals.reportedObservations)];
  const impactFindings = uniqueObservations.map((observation) => 'REPORTED_' + observation.toUpperCase());
  const impactNeedsReview = uniqueObservations.length > 0;
  const readinessStatus = readinessFindings.length === 0 ? 'READY' : 'DEGRADED';
  const recoveryStatus = recoveryFindings.length === 0 ? 'READY' : 'DEGRADED';
  const impactStatus = impactNeedsReview ? 'INVESTIGATE' : 'CLEAR';
  const status: EmpProtectionStatus = impactNeedsReview
    ? 'ALERT'
    : readinessStatus === 'READY' && recoveryStatus === 'READY'
      ? 'READY'
      : 'DEGRADED';

  const recommendations = [
    ...(readinessFindings.length ? ['Complete and document shielding/EMC review, surge protection, and verified offline backups.'] : []),
    ...uniqueObservations.map((observation) => OBSERVATION_ADVICE[observation]),
    ...(recoveryFindings.length ? ['Validate the recovery runbook, compatible spare equipment, and independent communications through a supervised drill.'] : []),
    'Treat reported symptoms as indicators requiring investigation, not as confirmation that an EMP occurred.',
  ];
  return Object.freeze({
    status,
    readiness: Object.freeze({ status: readinessStatus, findingCodes: Object.freeze(readinessFindings) }),
    impactAssessment: Object.freeze({ status: impactStatus, findingCodes: Object.freeze(impactFindings) }),
    recovery: Object.freeze({ status: recoveryStatus, findingCodes: Object.freeze(recoveryFindings) }),
    recommendations: Object.freeze(recommendations),
  });
}

function validateSignals(signals: EmpProtectionSignals): void {
  if (!signals || typeof signals !== 'object') throw new Error('EMP protection signals are required.');
  for (const key of [
    'shieldingAssessed',
    'surgeProtection',
    'offlineBackups',
    'recoveryRunbookTested',
    'spareHardwareAvailable',
    'alternateCommunicationAvailable',
  ] as const) {
    const value = signals[key];
    if (value !== true && value !== false && value !== null) {
      throw new Error('Invalid EMP protection signal: ' + key);
    }
  }
  if (!Array.isArray(signals.reportedObservations) || signals.reportedObservations.length > 20) {
    throw new Error('reportedObservations must be an array with at most 20 items.');
  }
  for (const observation of signals.reportedObservations) {
    if (!ALLOWED_OBSERVATIONS.has(observation)) throw new Error('Unknown EMP observation code.');
  }
}

function boundedLabel(value: string, fieldName: string): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 128) {
    throw new Error(fieldName + ' must be a non-empty string up to 128 characters.');
  }
  return value.trim();
}

/**
 * EMP protector with three layers:
 * 1) resilience/readiness, 2) impact-symptom triage, 3) recovery readiness.
 * It never switches equipment, modifies files, disables systems, or claims
 * to physically detect an electromagnetic pulse. Authorization and durable
 * audit failures fail closed.
 */
export function createEmpAttackProtector(options: EmpAttackProtectorOptions) {
  if (!options.auditFilePath?.trim()) throw new Error('A durable audit file path is required.');
  const appendAudit = options.appendAudit ?? appendDurableAuditEvent;
  const now = options.now ?? (() => new Date());

  async function assess(request: EmpProtectionRequest): Promise<EmpProtectionReport> {
    const assessmentId = 'emp-protection-' + randomUUID();
    const assessedAt = now().toISOString();
    const actorId = boundedLabel(request?.actorId, 'actorId');
    const projectId = boundedLabel(request?.projectId, 'projectId');

    let authorized = false;
    try {
      authorized = await options.authorizeActor({ actorId, projectId });
    } catch {
      authorized = false;
    }

    const scopedPolicy = evaluateSaqlainAction({
      actionType: 'run_emp_protection_assessment',
      actorAuthenticated: authorized,
      projectId,
    });

    if (!authorized || scopedPolicy.decision !== 'allow') {
      try {
        await appendAudit(options.auditFilePath, {
          eventType: 'EMP_PROTECTION_ASSESSMENT',
          actorId,
          outcome: 'DENY',
          resource: 'project:' + projectId,
          taskId: assessmentId,
          occurredAt: assessedAt,
          details: { decision: 'DENY', reasonCode: !authorized ? 'ACTOR_NOT_AUTHORIZED' : 'SAQLAIN_POLICY_DENIED', policyReason: scopedPolicy.reason },
        });
      } catch {
        return holdReport(assessmentId, assessedAt, 'Authorization denied; audit persistence failed.');
      }
      return holdReport(assessmentId, assessedAt, !authorized ? 'Actor is not authorized for this project.' : scopedPolicy.reason, true);
    }

    const assessment = assessEmpProtection(request.signals);
    try {
      await appendAudit(options.auditFilePath, {
        eventType: 'EMP_PROTECTION_ASSESSMENT',
        actorId,
        outcome: assessment.status === 'READY' ? 'INFO' : 'HOLD',
        resource: 'project:' + projectId,
        taskId: assessmentId,
        occurredAt: assessedAt,
        details: {
          decision: assessment.status,
          readiness: assessment.readiness.status,
          impactAssessment: assessment.impactAssessment.status,
          recovery: assessment.recovery.status,
          findingCodes: [
            ...assessment.readiness.findingCodes,
            ...assessment.impactAssessment.findingCodes,
            ...assessment.recovery.findingCodes,
          ],
          reportedObservations: [...new Set(request.signals.reportedObservations)],
          mutatesSystems: false,
          confirmedEmpEvent: false,
        },
      });
    } catch {
      return holdReport(assessmentId, assessedAt, 'Durable audit persistence failed; assessment result withheld.');
    }
    return Object.freeze({ assessmentId, assessedAt, audited: true, ...assessment });
  }

  return Object.freeze({ assess });
}

function holdReport(assessmentId: string, assessedAt: string, reason: string, audited = false): EmpProtectionReport {
  const holdLayer: EmpProtectionLayer = Object.freeze({ status: 'DEGRADED', findingCodes: Object.freeze(['ASSESSMENT_HELD']) });
  return Object.freeze({
    assessmentId,
    assessedAt,
    status: 'HOLD',
    audited,
    readiness: holdLayer,
    impactAssessment: Object.freeze({ status: 'INVESTIGATE', findingCodes: Object.freeze(['ASSESSMENT_HELD']) }),
    recovery: holdLayer,
    recommendations: Object.freeze(['Resolve authorization and audit availability before relying on this assessment.']),
    reason,
  });
}
