/**
 * Saqlain EMP resilience policy helper.
 * This correlates trusted telemetry. It is not an EMP detector or physical shield.
 * It never switches power, disables equipment, deletes evidence, or runs recovery.
 */
export type EmpTelemetrySourceHealth = 'HEALTHY' | 'DEGRADED' | 'UNKNOWN';
export type EmpProtectionStatus = 'NORMAL' | 'WATCH' | 'HOLD';

export interface EmpSignalSnapshot {
  sourceHealth: EmpTelemetrySourceHealth;
  explicitEmpAlarm: boolean;
  powerQualityAlarmCount: number;
  unexpectedRestartCount: number;
  networkInterfaceFlapCount: number;
  clockDriftMs: number;
  telemetryGapCount: number;
}
export interface EmpProtectionAssessment {
  status: EmpProtectionStatus;
  score: number;
  reasons: readonly string[];
  recommendedOperatorActions: readonly string[];
  automaticPhysicalActionsTaken: false;
  limitation: string;
}
const MAX_COUNT = 1_000_000;
const MAX_CLOCK_DRIFT_MS = 365 * 24 * 60 * 60 * 1_000;
const LIMITATION = 'Software telemetry correlation cannot confirm EMP exposure or certify physical EMP immunity.';

function validateSnapshot(input: EmpSignalSnapshot): void {
  if (!input || typeof input !== 'object') throw new Error('An EMP telemetry snapshot is required.');
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
export function assessEmpResilience(input: EmpSignalSnapshot): EmpProtectionAssessment {
  validateSnapshot(input);
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
    status, score, reasons: Object.freeze(reasons),
    recommendedOperatorActions: Object.freeze(recommendedOperatorActions),
    automaticPhysicalActionsTaken: false as const,
    limitation: LIMITATION,
  });
}
