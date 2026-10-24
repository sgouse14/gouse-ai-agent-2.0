/**
 * Saqlain EMP resilience policy helper.
 * This correlates trusted telemetry. It is not an EMP detector or physical shield.
 * It never switches power, disables equipment, deletes evidence, or runs recovery.
 */
export type EmpTelemetrySourceHealth = 'HEALTHY' | 'DEGRADED' | 'UNKNOWN';
export type EmpProtectionStatus = 'NORMAL' | 'WATCH' | 'HOLD';

export interface EmpSignalSnapshot {
  /** Stable identifier of a telemetry source provisioned by the deployment owner. */
  sourceId: string;
  /** Source observation timestamp (ISO 8601 with an explicit timezone), not assessment time. */
  observedAt: string;
  sourceHealth: EmpTelemetrySourceHealth;
  explicitEmpAlarm: boolean;
  powerQualityAlarmCount: number;
  unexpectedRestartCount: number;
  networkInterfaceFlapCount: number;
  clockDriftMs: number;
  telemetryGapCount: number;
}
export type EmpTelemetryFreshness = 'FRESH' | 'STALE' | 'FUTURE' | 'UNTRUSTED_SOURCE';

export interface EmpResilienceAssessmentOptions {
  /** Exact telemetry source IDs provisioned by the deployment owner. Empty allowlists are invalid. */
  allowedSourceIds: readonly string[];
  now?: () => Date;
  maxTelemetryAgeMs?: number;
  allowedFutureSkewMs?: number;
}

export interface EmpProtectionAssessment {
  status: EmpProtectionStatus;
  telemetry: Readonly<{ sourceId: string; observedAt: string; ageMs: number; freshness: EmpTelemetryFreshness }>;
  score: number;
  reasons: readonly string[];
  recommendedOperatorActions: readonly string[];
  automaticPhysicalActionsTaken: false;
  limitation: string;
}
const MAX_COUNT = 1_000_000;
const MAX_CLOCK_DRIFT_MS = 365 * 24 * 60 * 60 * 1_000;
export const EMP_TELEMETRY_MAX_AGE_MS = 5 * 60_000;
export const EMP_TELEMETRY_ALLOWED_FUTURE_SKEW_MS = 60_000;
const MAX_ALLOWED_TELEMETRY_SOURCES = 1000;
const LIMITATION = 'Software telemetry correlation cannot confirm EMP exposure or certify physical EMP immunity.';

function validateSnapshot(input: EmpSignalSnapshot): void {
  if (!input || typeof input !== 'object') throw new Error('An EMP telemetry snapshot is required.');
  if (typeof input.sourceId !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(input.sourceId)) {
    throw new Error('sourceId must be a valid telemetry source identifier.');
  }
  if (typeof input.observedAt !== 'string' || input.observedAt.length > 40 ||
      !/^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{1,3})?(?:Z|[+-]\\d{2}:\\d{2})$/.test(input.observedAt) ||
      !Number.isFinite(Date.parse(input.observedAt))) {
    throw new Error('observedAt must be an ISO 8601 timestamp with an explicit timezone.');
  }
  if (!['HEALTHY', 'DEGRADED', 'UNKNOWN'].includes(input.sourceHealth)) {
    throw new Error('Invalid EMP telemetry source health.');
  }
  if (typeof input.explicitEmpAlarm !== 'boolean') throw new Error('explicitEmpAlarm must be a boolean.');
  for (const key of ['powerQualityAlarmCount', 'unexpectedRestartCount', 'networkInterfaceFlapCount', 'telemetryGapCount'] as const) {
    const value = input[key];
    if (!Number.isSafeInteger(value) || value < 0 || value > MAX_COUNT) {
      throw new Error('Invalid EMP telemetry counter: ' + key);
    }
  }
  if (typeof input.clockDriftMs !== 'number' || !Number.isFinite(input.clockDriftMs) ||
      input.clockDriftMs < 0 || input.clockDriftMs > MAX_CLOCK_DRIFT_MS) {
    throw new Error('Invalid EMP telemetry clock drift.');
  }
}

/** Thresholds are heuristic triage defaults and must be calibrated for each deployment. */
export function assessEmpResilience(
  input: EmpSignalSnapshot,
  options: EmpResilienceAssessmentOptions,
): EmpProtectionAssessment {
  validateSnapshot(input);
  if (!options || !Array.isArray(options.allowedSourceIds) ||
      options.allowedSourceIds.length < 1 || options.allowedSourceIds.length > MAX_ALLOWED_TELEMETRY_SOURCES ||
      options.allowedSourceIds.some(sourceId => typeof sourceId !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(sourceId))) {
    throw new Error('An exact, non-empty allowlist of valid EMP telemetry source IDs is required.');
  }
  const maxTelemetryAgeMs = options.maxTelemetryAgeMs ?? EMP_TELEMETRY_MAX_AGE_MS;
  const allowedFutureSkewMs = options.allowedFutureSkewMs ?? EMP_TELEMETRY_ALLOWED_FUTURE_SKEW_MS;
  if (!Number.isSafeInteger(maxTelemetryAgeMs) || maxTelemetryAgeMs < 1 || maxTelemetryAgeMs > 24 * 60 * 60 * 1000) {
    throw new Error('maxTelemetryAgeMs must be an integer between 1 ms and 24 hours.');
  }
  if (!Number.isSafeInteger(allowedFutureSkewMs) || allowedFutureSkewMs < 0 || allowedFutureSkewMs > 10 * 60 * 1000) {
    throw new Error('allowedFutureSkewMs must be an integer from 0 to 10 minutes.');
  }
  const nowMs = (options.now ?? (() => new Date()))().getTime();
  if (!Number.isFinite(nowMs)) throw new Error('Assessment clock returned an invalid date.');
  const observationMs = Date.parse(input.observedAt);
  const ageMs = nowMs - observationMs;
  let freshness: EmpTelemetryFreshness = 'FRESH';
  if (!options.allowedSourceIds.includes(input.sourceId)) freshness = 'UNTRUSTED_SOURCE';
  else if (ageMs > maxTelemetryAgeMs) freshness = 'STALE';
  else if (ageMs < -allowedFutureSkewMs) freshness = 'FUTURE';

  const telemetry = Object.freeze({ sourceId: input.sourceId, observedAt: input.observedAt, ageMs, freshness });
  if (freshness !== 'FRESH') {
    const reason = freshness === 'UNTRUSTED_SOURCE'
      ? 'Telemetry source is not in the deployment owner’s allowlist.'
      : freshness === 'STALE'
        ? 'Telemetry is stale; a fresh observation is required.'
        : 'Telemetry timestamp is too far in the future; verify source clock synchronization.';
    return Object.freeze({
      status: 'HOLD',
      score: 0,
      telemetry,
      reasons: Object.freeze([reason]),
      recommendedOperatorActions: Object.freeze([
        'Hold this assessment until an allowlisted telemetry source provides a fresh, correctly timestamped observation.',
        'Preserve the received observation and source metadata for review.',
        'Do not automatically switch power, power-cycle equipment, initiate recovery, or target external systems.',
      ]),
      automaticPhysicalActionsTaken: false as const,
      limitation: LIMITATION,
    });
  }

  let score = 0;
  const reasons: string[] = [];
  if (input.explicitEmpAlarm) { score += 5; reasons.push('A trusted sensor reported an explicit EMP-related alarm.'); }
  if (input.powerQualityAlarmCount >= 2) { score += 2; reasons.push('Multiple power-quality alarms were reported.'); }
  if (input.unexpectedRestartCount >= 3) { score += 2; reasons.push('A cluster of unexpected device restarts was reported.'); }
  if (input.networkInterfaceFlapCount >= 3) { score += 1; reasons.push('Repeated network-interface flapping was reported.'); }
  if (input.clockDriftMs >= 2_500) { score += 1; reasons.push('Clock drift exceeded the configured triage threshold.'); }
  if (input.telemetryGapCount >= 3) { score += 1; reasons.push('Multiple telemetry gaps were reported.'); }
  if (input.sourceHealth !== 'HEALTHY') reasons.push('Telemetry source health is not confirmed healthy.');

  const status: EmpProtectionStatus =
    input.sourceHealth !== 'HEALTHY' || input.explicitEmpAlarm || score >= 4 ? 'HOLD' : score > 0 ? 'WATCH' : 'NORMAL';
  const recommendedOperatorActions = status === 'HOLD'
    ? [
        'Pause nonessential activity using the approved site operating procedure.',
        'Preserve available telemetry and audit records; do not erase or overwrite evidence.',
        'Require an authorized operator to invoke site-specific electrical and electromagnetic-interference continuity procedures.',
        'Do not automatically switch power, power-cycle equipment, or initiate destructive recovery.',
      ]
    : status === 'WATCH'
      ? [
          'Raise an operator-visible alert and preserve telemetry for correlation.',
          'Validate power, network, time, and sensor inputs against independent sources.',
          'Do not treat software telemetry alone as proof of EMP exposure.',
        ]
      : ['Continue normal monitoring.', 'This result does not certify EMP immunity or physical protection.'];
  return Object.freeze({
    status, score, telemetry, reasons: Object.freeze(reasons),
    recommendedOperatorActions: Object.freeze(recommendedOperatorActions),
    automaticPhysicalActionsTaken: false as const,
    limitation: LIMITATION,
  });
}
