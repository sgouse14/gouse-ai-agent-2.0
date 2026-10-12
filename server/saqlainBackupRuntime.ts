import { appendDurableAuditEvent } from './saqlainAuditLog.ts';
import { SAQLAIN_BACKUP_TEAM, SAQLAIN_BACKUP_INTERVAL_MINUTES, type SaqlainBackupAgent } from './saqlainBackupTeam.ts';

export const SAQLAIN_RUNTIME_INTERVAL_MS = SAQLAIN_BACKUP_INTERVAL_MINUTES * 60_000;

export type AgentCycleOutcome =
  | { status: 'VERIFIED'; summary?: string }
  | { status: 'HOLD'; summary: string }
  | { status: 'FAILED'; summary: string };

export interface AgentCycleResult {
  agentId: string;
  role: SaqlainBackupAgent['role'];
  status: AgentCycleOutcome['status'];
  summary: string;
  startedAt: string;
  finishedAt: string;
}

export interface BackupRecoveryCycleReport {
  cycleId: string;
  startedAt: string;
  finishedAt: string;
  status: 'VERIFIED' | 'PARTIAL' | 'HOLD';
  results: readonly AgentCycleResult[];
}

export interface SaqlainBackupRuntimeOptions {
  /** Implementations must use approved sources and must never write to originals. */
  runAgentCycle: (agent: SaqlainBackupAgent, cycleId: string) => Promise<AgentCycleOutcome>;
  /** When set, an audit-write failure downgrades that agent result to HOLD. */
  auditFilePath?: string;
  now?: () => Date;
  setIntervalFn?: (callback: () => void, milliseconds: number) => ReturnType<typeof setInterval>;
  clearIntervalFn?: (handle: ReturnType<typeof setInterval>) => void;
}

export interface SaqlainBackupRuntime {
  start(options?: { runImmediately?: boolean }): void;
  stop(): void;
  runCycle(): Promise<BackupRecoveryCycleReport>;
  getState(): Readonly<{ running: boolean; cycleInProgress: boolean; lastReport: BackupRecoveryCycleReport | null }>;
}

/**
 * In-process 24/7 orchestration for four backup agents plus one recovery agent.
 * Runs every 30 minutes while the host process is alive, avoids overlapping
 * cycles, isolates agent errors, and optionally writes a durable hash-chain audit.
 *
 * This is not a daemon or durable job queue: production must run it under a
 * process supervisor, persist queue/cycle state, configure off-host backups,
 * and alert on missed heartbeats. It never deletes or overwrites source files.
 */
export function createSaqlainBackupRuntime(options: SaqlainBackupRuntimeOptions): SaqlainBackupRuntime {
  const now = options.now ?? (() => new Date());
  const schedule = options.setIntervalFn ?? setInterval;
  const unschedule = options.clearIntervalFn ?? clearInterval;
  let timer: ReturnType<typeof setInterval> | null = null;
  let inFlight: Promise<BackupRecoveryCycleReport> | null = null;
  let lastReport: BackupRecoveryCycleReport | null = null;
  let cycleSequence = 0;
  // Serialize audit appends: all five agents may finish together, while the
  // durable JSONL audit log intentionally permits only one writer at a time.
  let auditQueue: Promise<unknown> = Promise.resolve();
  function appendAudit(input: Parameters<typeof appendDurableAuditEvent>[1]) {
    const next = auditQueue.then(() => appendDurableAuditEvent(options.auditFilePath!, input));
    auditQueue = next.then(() => undefined, () => undefined);
    return next;
  }

  async function runAgent(agent: SaqlainBackupAgent, cycleId: string): Promise<AgentCycleResult> {
    const startedAt = now().toISOString();
    let outcome: AgentCycleOutcome;
    try {
      outcome = await options.runAgentCycle(agent, cycleId);
    } catch (error) {
      outcome = { status: 'FAILED', summary: error instanceof Error ? error.message : 'Unknown agent cycle failure.' };
    }

    if (options.auditFilePath) {
      try {
        await appendAudit({
          eventType: 'BACKUP_RECOVERY_AGENT_CYCLE',
          actorId: agent.id,
          outcome: outcome.status === 'VERIFIED' ? 'INFO' : 'HOLD',
          resource: agent.role === 'BACKUP' ? 'backup-cycle' : 'recovery-cycle',
          taskId: cycleId,
          occurredAt: now().toISOString(),
          details: { status: outcome.status, summary: outcome.summary ?? 'Verified' },
        });
      } catch (error) {
        outcome = {
          status: 'HOLD',
          summary: 'Audit write failed; handoff is held: ' + (error instanceof Error ? error.message : 'unknown audit failure'),
        };
      }
    }

    return {
      agentId: agent.id,
      role: agent.role,
      status: outcome.status,
      summary: outcome.summary ?? 'Snapshot and integrity checks verified.',
      startedAt,
      finishedAt: now().toISOString(),
    };
  }

  async function executeCycle(): Promise<BackupRecoveryCycleReport> {
    cycleSequence += 1;
    const cycleId = 'saqlain-cycle-' + String(cycleSequence).padStart(8, '0');
    const startedAt = now().toISOString();
    const results = await Promise.all(SAQLAIN_BACKUP_TEAM.map((agent) => runAgent(agent, cycleId)));
    const verified = results.filter((result) => result.status === 'VERIFIED').length;
    const heldOrFailed = results.some((result) => result.status !== 'VERIFIED');
    const report: BackupRecoveryCycleReport = Object.freeze({
      cycleId,
      startedAt,
      finishedAt: now().toISOString(),
      status: heldOrFailed ? (verified > 0 ? 'PARTIAL' : 'HOLD') : 'VERIFIED',
      results: Object.freeze(results),
    });
    lastReport = report;
    return report;
  }

  function runCycle(): Promise<BackupRecoveryCycleReport> {
    if (inFlight) return inFlight;
    inFlight = executeCycle().finally(() => { inFlight = null; });
    return inFlight;
  }

  function start(startOptions: { runImmediately?: boolean } = {}): void {
    if (timer !== null) return;
    timer = schedule(() => { void runCycle().catch(() => undefined); }, SAQLAIN_RUNTIME_INTERVAL_MS);
    if (startOptions.runImmediately !== false) void runCycle().catch(() => undefined);
  }

  function stop(): void {
    if (timer !== null) {
      unschedule(timer);
      timer = null;
    }
  }

  return {
    start,
    stop,
    runCycle,
    getState: () => Object.freeze({ running: timer !== null, cycleInProgress: inFlight !== null, lastReport }),
  };
}
