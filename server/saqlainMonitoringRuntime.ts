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
export interface SaqlainMonitoringRuntimeOptions {
  /** Read-only collector. It must not mutate protected files or release security holds. */
  collectSnapshot: () => Promise<Omit<MonitoringSnapshot, 'status' | 'cycleId' | 'checkedAt'>>;
  auditFilePath: string;
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
    const finalAlert = status === 'HOLD' && snapshot?.status === 'HEALTHY'
      ? 'Saqlain monitoring alert: HOLD | cycle=' + cycleId + ' | audit or monitoring integrity failure'
      : alert;
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
