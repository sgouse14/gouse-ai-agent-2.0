/**
 * Saqlain AI — monitoring and maintenance agent.
 * Monitors platform health without destructive or security-bypass privileges.
 */

export type MonitoringStatus = 'HEALTHY' | 'WARNING' | 'HOLD' | 'FAILED';

// A scheduled cycle normally runs every 30 minutes. A 45-minute grace window
// gives operators some scheduling margin without silently accepting a missed cycle.
export const SAQLAIN_BACKUP_STALE_AFTER_MINUTES = 45;
export const SAQLAIN_BACKUP_MAX_CYCLE_RUNTIME_MINUTES = 45;

export interface MonitoringSnapshot {
  cycleId: string;
  checkedAt: string;
  activeAgents: number;
  lockedTasks: number;
  completedTasks: number;
  failedTasks: number;
  securityHolds: number;
  backupChecks: number;
  recoveryChecks: number;
  /** Age of the last completed backup/recovery cycle; null means no completed cycle yet. */
  backupCycleAgeMinutes?: number | null;
  /** Whether a cycle is currently executing in this process. */
  backupCycleInProgress?: boolean;
  /** Runtime age of the current cycle, when one is executing. */
  backupCycleInProgressMinutes?: number | null;
  /** Result of the most recently completed cycle. */
  backupCycleStatus?: 'VERIFIED' | 'PARTIAL' | 'HOLD' | null;
  status: MonitoringStatus;
}

export const SAQLAIN_MONITORING_RULES = Object.freeze({
  role: 'monitoring-and-maintenance',
  mayDeleteProtectedFiles: false,
  mayOverwriteProtectedFiles: false,
  mayBypassSecurityReview: false,
  mayChangeAgentIdentity: false,
  mayReleaseSecurityHold: false,
});

export function evaluateMonitoringSnapshot(input: Omit<MonitoringSnapshot, 'status'>): MonitoringSnapshot {
  let status: MonitoringStatus = 'HEALTHY';
  if (input.failedTasks > 0) status = 'FAILED';
  else if (input.securityHolds > 0 || input.lockedTasks > input.activeAgents) status = 'HOLD';
  // A zero-agent snapshot is not healthy: it may mean the workers are down or the collector is misconfigured.
  else if (input.activeAgents === 0 || input.completedTasks === 0) status = 'WARNING';

  // Freshness is operational state, not a passive statistic: stale or stuck backup
  // cycles must never be presented as healthy merely because old counts look good.
  const cycleInProgress = input.backupCycleInProgress === true;
  if (status !== 'FAILED') {
    if (cycleInProgress &&
        typeof input.backupCycleInProgressMinutes === 'number' &&
        input.backupCycleInProgressMinutes > SAQLAIN_BACKUP_MAX_CYCLE_RUNTIME_MINUTES) {
      status = 'FAILED';
    } else if (!cycleInProgress && 'backupCycleAgeMinutes' in input && input.backupCycleAgeMinutes === null) {
      status = 'HOLD';
    } else if (!cycleInProgress &&
        typeof input.backupCycleAgeMinutes === 'number' &&
        input.backupCycleAgeMinutes > SAQLAIN_BACKUP_STALE_AFTER_MINUTES) {
      status = 'FAILED';
    } else if (input.backupCycleStatus && input.backupCycleStatus !== 'VERIFIED') {
      status = 'HOLD';
    }
  }
  return { ...input, status };
}

export function buildSaqlainMonitoringAlert(snapshot: MonitoringSnapshot): string | null {
  if (snapshot.status === 'HEALTHY') return null;
  return [
    'Saqlain monitoring alert: ' + snapshot.status,
    'cycle=' + snapshot.cycleId,
    'locked=' + snapshot.lockedTasks,
    'failed=' + snapshot.failedTasks,
    'holds=' + snapshot.securityHolds,
    ...(snapshot.backupCycleStatus ? ['backupCycleStatus=' + snapshot.backupCycleStatus] : []),
    ...(typeof snapshot.backupCycleAgeMinutes === 'number' ? ['backupCycleAgeMinutes=' + Math.floor(snapshot.backupCycleAgeMinutes)] : []),
    ...(snapshot.backupCycleInProgress ? ['backupCycleInProgressMinutes=' + (
      typeof snapshot.backupCycleInProgressMinutes === 'number'
        ? Math.floor(snapshot.backupCycleInProgressMinutes)
        : 'unknown'
    )] : []),
  ].join(' | ');
}
