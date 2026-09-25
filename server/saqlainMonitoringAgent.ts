/**
 * Saqlain AI — monitoring and maintenance agent.
 * Monitors platform health without destructive or security-bypass privileges.
 */

export type MonitoringStatus = 'HEALTHY' | 'WARNING' | 'HOLD' | 'FAILED';

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
  else if (input.completedTasks === 0 && input.activeAgents > 0) status = 'WARNING';
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
  ].join(' | ');
}
