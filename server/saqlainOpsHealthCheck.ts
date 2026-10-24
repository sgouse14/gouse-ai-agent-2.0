import { readVerifiedAuditLog, type AuditRecord } from './saqlainAuditLog.ts';

export type SaqlainOpsMonitoringStatus = 'HEALTHY' | 'WARNING' | 'HOLD' | 'FAILED';

export interface SaqlainOpsHealthCheckResult {
  healthy: boolean;
  status: SaqlainOpsMonitoringStatus;
  checkedAt: string;
  latestMonitoringEventAt: string | null;
  monitoringAgeMinutes: number | null;
  code: string;
  message: string;
}

export interface SaqlainOpsHealthCheckOptions {
  now?: () => Date;
  maxAgeMinutes?: number;
}

export const SAQLAIN_OPS_HEALTH_DEFAULT_MAX_AGE_MINUTES = 45;
const MAX_ALLOWED_AGE_MINUTES = 24 * 60;
const ALLOWED_FUTURE_SKEW_MS = 60_000;

function isMonitoringStatus(value: unknown): value is SaqlainOpsMonitoringStatus {
  return value === 'HEALTHY' || value === 'WARNING' || value === 'HOLD' || value === 'FAILED';
}

function result(
  healthy: boolean,
  status: SaqlainOpsMonitoringStatus,
  checkedAt: string,
  eventAt: string | null,
  ageMinutes: number | null,
  code: string,
  message: string,
): SaqlainOpsHealthCheckResult {
  return Object.freeze({
    healthy,
    status,
    checkedAt,
    latestMonitoringEventAt: eventAt,
    monitoringAgeMinutes: ageMinutes,
    code,
    message,
  });
}

/**
 * Independent, read-only freshness check for external schedulers and uptime tools.
 * The audit records passed here must come from readVerifiedAuditLog so an
 * unverified or tampered chain can never be treated as healthy.
 */
export function evaluateSaqlainOpsHealth(
  records: readonly AuditRecord[],
  options: SaqlainOpsHealthCheckOptions = {},
): SaqlainOpsHealthCheckResult {
  const now = (options.now ?? (() => new Date()))();
  const nowMs = now.getTime();
  const checkedAt = Number.isFinite(nowMs) ? now.toISOString() : new Date(0).toISOString();
  if (!Number.isFinite(nowMs)) {
    return result(false, 'HOLD', checkedAt, null, null, 'INVALID_CHECK_CLOCK', 'Health-check clock is invalid.');
  }

  const maxAgeMinutes = options.maxAgeMinutes ?? SAQLAIN_OPS_HEALTH_DEFAULT_MAX_AGE_MINUTES;
  if (!Number.isSafeInteger(maxAgeMinutes) || maxAgeMinutes < 1 || maxAgeMinutes > MAX_ALLOWED_AGE_MINUTES) {
    return result(false, 'HOLD', checkedAt, null, null, 'INVALID_MAX_AGE_CONFIGURATION', 'Health-check freshness limit must be an integer from 1 to 1440 minutes.');
  }

  // readVerifiedAuditLog returns the hash-chain in append/sequence order. Use
  // the last monitoring event, not the last arbitrary audit entry.
  const latest = [...records].reverse().find(record => record.eventType === 'SAQLAIN_MONITORING_CYCLE');
  if (!latest) {
    return result(false, 'HOLD', checkedAt, null, null, 'NO_MONITORING_CYCLE', 'No verified Saqlain monitoring cycle was found in the audit log.');
  }

  const eventMs = Date.parse(latest.occurredAt);
  if (!Number.isFinite(eventMs) || typeof latest.occurredAt !== 'string') {
    return result(false, 'HOLD', checkedAt, null, null, 'INVALID_MONITORING_TIMESTAMP', 'The latest monitoring event has an invalid timestamp.');
  }
  const ageMs = nowMs - eventMs;
  const eventAt = new Date(eventMs).toISOString();
  const ageMinutes = Math.round(Math.max(0, ageMs) / 60_000 * 100) / 100;

  if (ageMs < -ALLOWED_FUTURE_SKEW_MS) {
    return result(false, 'HOLD', checkedAt, eventAt, ageMinutes, 'FUTURE_MONITORING_EVENT', 'The latest monitoring event is too far in the future; check host clock synchronization.');
  }
  if (ageMs > maxAgeMinutes * 60_000) {
    return result(false, 'FAILED', checkedAt, eventAt, ageMinutes, 'STALE_MONITORING_EVENT', 'No recent monitoring cycle was recorded within the configured freshness window.');
  }

  const status = latest.details?.status;
  if (!isMonitoringStatus(status)) {
    return result(false, 'HOLD', checkedAt, eventAt, ageMinutes, 'INVALID_MONITORING_STATUS', 'The latest monitoring event does not contain a recognized monitoring status.');
  }
  const expectedOutcome = status === 'HEALTHY' ? 'INFO' : 'HOLD';
  if (latest.outcome !== expectedOutcome) {
    return result(false, 'HOLD', checkedAt, eventAt, ageMinutes, 'MONITORING_AUDIT_MISMATCH', 'The latest monitoring status and its audit outcome do not agree.');
  }
  if (status !== 'HEALTHY') {
    return result(false, status, checkedAt, eventAt, ageMinutes, 'MONITORING_NOT_HEALTHY', 'The latest Saqlain monitoring cycle reported ' + status + '. Review its alert and resolve the underlying cause.');
  }
  return result(true, 'HEALTHY', checkedAt, eventAt, ageMinutes, 'OK', 'A recent, verified, healthy Saqlain monitoring cycle is present.');
}

/** Reads and verifies the hash-chained audit before evaluating freshness. */
export async function checkSaqlainOpsHealth(
  auditFilePath: string,
  options: SaqlainOpsHealthCheckOptions = {},
): Promise<SaqlainOpsHealthCheckResult> {
  const checkedNow = options.now ?? (() => new Date());
  let checkedAt: string;
  try {
    checkedAt = checkedNow().toISOString();
  } catch {
    checkedAt = new Date(0).toISOString();
  }
  if (typeof auditFilePath !== 'string' || !auditFilePath.trim()) {
    return result(false, 'HOLD', checkedAt, null, null, 'AUDIT_PATH_NOT_CONFIGURED', 'SAQLAIN_BACKUP_AUDIT_FILE is not configured.');
  }
  try {
    const records = await readVerifiedAuditLog(auditFilePath);
    return evaluateSaqlainOpsHealth(records, { ...options, now: checkedNow });
  } catch {
    return result(false, 'HOLD', checkedAt, null, null, 'AUDIT_LOG_INVALID_OR_UNAVAILABLE', 'The Saqlain audit log could not be read or its hash chain failed verification.');
  }
}
