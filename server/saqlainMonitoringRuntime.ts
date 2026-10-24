import { randomUUID } from 'node:crypto';
import { appendDurableAuditEvent } from './saqlainAuditLog.ts';
import { buildSaqlainMonitoringAlert, evaluateMonitoringSnapshot, type MonitoringSnapshot, type MonitoringStatus } from './saqlainMonitoringAgent.ts';

export const SAQLAIN_MONITORING_INTERVAL_MINUTES = 30;
export const SAQLAIN_MONITORING_INTERVAL_MS = SAQLAIN_MONITORING_INTERVAL_MINUTES * 60_000;

export interface MonitoringCycleReport {
  cycleId: string;
  startedAt: string;
  finishedAt: string;
  status: MonitoringStatus;
  snapshot: MonitoringSnapshot | null;
  alert: string | null;
  error?: string;
}
export interface MonitoringAlertNotification {
  cycleId: string;
  /** Stable key for adapters that deduplicate delivery retries. */
  idempotencyKey: string;
  status: MonitoringStatus;
  alert: string;
  occurredAt: string;
}

export interface SaqlainMonitoringRuntimeOptions {
  /** Read-only collector. It must not mutate protected files or release security holds. */
  collectSnapshot: () => Promise<Omit<MonitoringSnapshot, 'status' | 'cycleId' | 'checkedAt'>>;
  auditFilePath: string;
  /** Optional configured alert adapter. A resolved promise means the adapter accepted the alert. */
  notifyAlert?: (notification: MonitoringAlertNotification) => Promise<void>;
  now?: () => Date;
  setIntervalFn?: (callback: () => void, milliseconds: number) => ReturnType<typeof setInterval>;
  clearIntervalFn?: (handle: ReturnType<typeof setInterval>) => void;
}
export interface SaqlainMonitoringRuntime {
  start(options?: { runImmediately?: boolean }): void;
  stop(): void;
  runCycle(): Promise<MonitoringCycleReport>;
  getState(): Readonly<{ running: boolean; cycleInProgress: boolean; lastReport: MonitoringCycleReport | null }>;
}
function validateCounts(input: Omit<MonitoringSnapshot, 'status' | 'cycleId' | 'checkedAt'>): void {
  for (const key of ['activeAgents','lockedTasks','completedTasks','failedTasks','securityHolds','backupChecks','recoveryChecks'] as const) {
    const value = input[key];
    if (!Number.isSafeInteger(value) || value < 0) throw new Error('Invalid monitoring count: ' + key);
  }
  if (input.backupCycleInProgress !== undefined && typeof input.backupCycleInProgress !== 'boolean') {
    throw new Error('Invalid monitoring signal: backupCycleInProgress');
  }
  for (const key of ['backupCycleAgeMinutes', 'backupCycleInProgressMinutes'] as const) {
    const value = input[key];
    if (value !== undefined && value !== null && (typeof value !== 'number' || !Number.isFinite(value) || value < 0)) {
      throw new Error('Invalid monitoring freshness value: ' + key);
    }
  }
  if (input.backupCycleStatus !== undefined && input.backupCycleStatus !== null &&
      !['VERIFIED', 'PARTIAL', 'HOLD'].includes(input.backupCycleStatus)) {
    throw new Error('Invalid monitoring signal: backupCycleStatus');
  }
  if (input.empProtectionStatus !== undefined &&
      !['NORMAL', 'WATCH', 'HOLD'].includes(input.empProtectionStatus)) {
    throw new Error('Invalid monitoring signal: empProtectionStatus');
  }
  if (input.empTelemetryFreshness !== undefined &&
      !['FRESH', 'STALE', 'FUTURE', 'UNTRUSTED_SOURCE'].includes(input.empTelemetryFreshness)) {
    throw new Error('Invalid monitoring signal: empTelemetryFreshness');
  }
  if ((input.empProtectionStatus === undefined) !== (input.empTelemetryFreshness === undefined)) {
    throw new Error('EMP protection status and telemetry freshness must be provided together.');
  }
  if (input.empTelemetryFreshness !== undefined && input.empTelemetryFreshness !== 'FRESH' &&
      input.empProtectionStatus !== 'HOLD') {
    throw new Error('Non-fresh EMP telemetry must be held.');
  }
  if (input.empTelemetrySourceId !== undefined &&
      (typeof input.empTelemetrySourceId !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(input.empTelemetrySourceId))) {
    throw new Error('Invalid monitoring signal: empTelemetrySourceId');
  }
  if (input.empTelemetryAgeMinutes !== undefined &&
      (typeof input.empTelemetryAgeMinutes !== 'number' || !Number.isFinite(input.empTelemetryAgeMinutes))) {
    throw new Error('Invalid monitoring freshness value: empTelemetryAgeMinutes');
  }
  if (input.empProtectionScore !== undefined &&
      (!Number.isSafeInteger(input.empProtectionScore) || input.empProtectionScore < 0 || input.empProtectionScore > 100)) {
    throw new Error('Invalid monitoring signal: empProtectionScore');
  }
  if (input.empProtectionReasons !== undefined &&
      (!Array.isArray(input.empProtectionReasons) || input.empProtectionReasons.length > 20 ||
       input.empProtectionReasons.some(reason => typeof reason !== 'string' || reason.length > 1000))) {
    throw new Error('Invalid monitoring signal: empProtectionReasons');
  }
}

/** Read-only health monitor. It raises auditable alerts; it cannot mutate agents, tasks, identities, files or holds. */
export function createSaqlainMonitoringRuntime(options: SaqlainMonitoringRuntimeOptions): SaqlainMonitoringRuntime {
  if (!options.auditFilePath.trim()) throw new Error('A durable audit file path is required.');
  const now = options.now ?? (() => new Date());
  const schedule = options.setIntervalFn ?? setInterval;
  const unschedule = options.clearIntervalFn ?? clearInterval;
  let timer: ReturnType<typeof setInterval> | null = null;
  let inFlight: Promise<MonitoringCycleReport> | null = null;
  let lastReport: MonitoringCycleReport | null = null;
  let auditQueue: Promise<unknown> = Promise.resolve();

  function audit(event: Parameters<typeof appendDurableAuditEvent>[1]) {
    const next = auditQueue.then(() => appendDurableAuditEvent(options.auditFilePath, event));
    auditQueue = next.then(() => undefined, () => undefined);
    return next;
  }
  async function executeCycle(): Promise<MonitoringCycleReport> {
    const startedAt = now().toISOString();
    const cycleId = 'saqlain-monitor-' + randomUUID();
    let snapshot: MonitoringSnapshot | null = null;
    let status: MonitoringStatus = 'HOLD';
    let errorMessage: string | undefined;
    try {
      const counts = await options.collectSnapshot();
      validateCounts(counts);
      snapshot = evaluateMonitoringSnapshot({ ...counts, cycleId, checkedAt: now().toISOString() });
      status = snapshot.status;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Unknown monitoring collector failure.';
      status = 'HOLD';
    }
    const alert = snapshot ? buildSaqlainMonitoringAlert(snapshot) : 'Saqlain monitoring alert: HOLD | cycle=' + cycleId + ' | collection failed';
    try {
      await audit({
        eventType: 'SAQLAIN_MONITORING_CYCLE',
        actorId: 'saqlain-monitoring-agent',
        outcome: status === 'HEALTHY' ? 'INFO' : 'HOLD',
        resource: 'gouse-ai-agent-2.0',
        taskId: cycleId,
        occurredAt: now().toISOString(),
        details: {
          status,
          alert,
          error: errorMessage,
          snapshot: snapshot ? {
            activeAgents: snapshot.activeAgents,
            lockedTasks: snapshot.lockedTasks,
            completedTasks: snapshot.completedTasks,
            failedTasks: snapshot.failedTasks,
            securityHolds: snapshot.securityHolds,
            backupChecks: snapshot.backupChecks,
            recoveryChecks: snapshot.recoveryChecks,
            backupCycleAgeMinutes: snapshot.backupCycleAgeMinutes ?? null,
            backupCycleInProgress: snapshot.backupCycleInProgress ?? false,
            backupCycleInProgressMinutes: snapshot.backupCycleInProgressMinutes ?? null,
            backupCycleStatus: snapshot.backupCycleStatus ?? null,
            empProtection: snapshot.empProtectionStatus ? {
              status: snapshot.empProtectionStatus,
              telemetryFreshness: snapshot.empTelemetryFreshness ?? null,
              sourceId: snapshot.empTelemetrySourceId ?? null,
              telemetryAgeMinutes: snapshot.empTelemetryAgeMinutes ?? null,
              score: snapshot.empProtectionScore ?? null,
              reasons: snapshot.empProtectionReasons ?? [],
              automaticPhysicalActionsTaken: false,
            } : null,
          } : null,
          destructiveActionsTaken: false,
          securityHoldsReleased: false,
          protectedOriginalsModified: false,
        },
      });
    } catch (error) {
      status = 'HOLD';
      errorMessage = 'Durable monitoring audit failed: ' + (error instanceof Error ? error.message : 'unknown audit error');
    }
    let finalAlert = status === 'HOLD' && snapshot?.status === 'HEALTHY'
      ? 'Saqlain monitoring alert: HOLD | cycle=' + cycleId + ' | audit or monitoring integrity failure'
      : alert;
    if (finalAlert && options.notifyAlert) {
      const occurredAt = now().toISOString();
      const notification = {
        cycleId,
        idempotencyKey: cycleId,
        status,
        alert: finalAlert,
        occurredAt,
      };
      try {
        await options.notifyAlert(notification);
        try {
          await audit({
            eventType: 'SAQLAIN_MONITORING_ALERT_ADAPTER_ACCEPTED',
            actorId: 'saqlain-monitoring-agent',
            outcome: 'INFO',
            resource: 'saqlain-monitoring-alert',
            taskId: cycleId,
            occurredAt: now().toISOString(),
            details: { status, idempotencyKey: cycleId, adapterAccepted: true },
          });
        } catch {
          status = status === 'FAILED' ? 'FAILED' : 'HOLD';
          const note = 'Alert adapter accepted the notification but durable delivery audit failed.';
          errorMessage = errorMessage ? errorMessage + '; ' + note : note;
          finalAlert = finalAlert + ' | notificationAudit=FAILED';
        }
      } catch {
        const originalStatus = status;
        status = status === 'FAILED' ? 'FAILED' : 'HOLD';
        const note = 'Configured alert adapter failed; delivery is unconfirmed.';
        errorMessage = errorMessage ? errorMessage + '; ' + note : note;
        finalAlert = finalAlert + ' | notification=FAILED';
        try {
          await audit({
            eventType: 'SAQLAIN_MONITORING_ALERT_ADAPTER_FAILED',
            actorId: 'saqlain-monitoring-agent',
            outcome: 'HOLD',
            resource: 'saqlain-monitoring-alert',
            taskId: cycleId,
            occurredAt: now().toISOString(),
            details: { originalStatus, idempotencyKey: cycleId, adapterAccepted: false, failureCode: 'ALERT_ADAPTER_ERROR' },
          });
        } catch {
          errorMessage += ' Alert-delivery failure audit also failed.';
          finalAlert += ' | notificationAudit=FAILED';
        }
      }
    }
    const report: MonitoringCycleReport = Object.freeze({
      cycleId, startedAt, finishedAt: now().toISOString(), status, snapshot, alert: finalAlert,
      ...(errorMessage ? { error: errorMessage } : {}),
    });
    lastReport = report;
    return report;
  }
  function runCycle(): Promise<MonitoringCycleReport> {
    if (inFlight) return inFlight;
    inFlight = executeCycle().finally(() => { inFlight = null; });
    return inFlight;
  }
  function start(startOptions: { runImmediately?: boolean } = {}): void {
    if (timer !== null) return;
    timer = schedule(() => { void runCycle().catch(() => undefined); }, SAQLAIN_MONITORING_INTERVAL_MS);
    if (startOptions.runImmediately !== false) void runCycle().catch(() => undefined);
  }
  function stop(): void {
    if (timer !== null) { unschedule(timer); timer = null; }
  }
  return {
    start, stop, runCycle,
    getState: () => Object.freeze({ running: timer !== null, cycleInProgress: inFlight !== null, lastReport }),
  };
}
