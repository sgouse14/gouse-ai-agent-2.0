import { randomUUID } from 'node:crypto';
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
  runAgentCycle: (agent: SaqlainBackupAgent, cycleId: string, context?: { priorResults: readonly AgentCycleResult[] }) => Promise<AgentCycleOutcome>;
  /** When set, an audit-write failure downgrades that agent result to HOLD. */
  auditFilePath?: string;
  now?: () => Date;
  setIntervalFn?: (callback: () => void, milliseconds: number) => ReturnType<typeof setInterval>;
  clearIntervalFn?: (handle: ReturnType<typeof setInterval>) => void;
  /** Optional cleanup for per-cycle in-memory state, called after every completed cycle. */
  onCycleComplete?: (cycleId: string) => void;
}

export interface SaqlainBackupRuntime {
  start(options?: { runImmediately?: boolean }): void;
  stop(): void;
  runCycle(): Promise<BackupRecoveryCycleReport>;
  getState(): Readonly<{ running: boolean; cycleInProgress: boolean; lastReport: BackupRecoveryCycleReport | null }>;
}

/**
 * In-process 24/7 orchestration for four backup agents, one recovery agent, and one communication agent.
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
  // Serialize audit appends so all cycle agents share the single-writer audit log.
  //
  // The communication agent runs last so it can summarize completed outcomes.
  //
  // Serialize audit appends: all five agents may finish together, while the
  // durable JSONL audit log intentionally permits only one writer at a time.
  let auditQueue: Promise<unknown> = Promise.resolve();
  function appendAudit(input: Parameters<typeof appendDurableAuditEvent>[1]) {
    const next = auditQueue.then(() => appendDurableAuditEvent(options.auditFilePath!, input));
    auditQueue = next.then(() => undefined, () => undefined);
    return next;
  }

  async function runAgent(agent: SaqlainBackupAgent, cycleId: string, priorResults: readonly AgentCycleResult[] = []): Promise<AgentCycleResult> {
    const startedAt = now().toISOString();
    let outcome: AgentCycleOutcome;
    try {
      outcome = await options.runAgentCycle(agent, cycleId, { priorResults: Object.freeze([...priorResults]) });
    } catch (error) {
      outcome = { status: 'FAILED', summary: error instanceof Error ? error.message : 'Unknown agent cycle failure.' };
    }

    if (options.auditFilePath) {
      try {
        await appendAudit({
          eventType: agent.role === 'COMMUNICATION' ? 'SAQLAIN_AGENT_COMMUNICATION' : 'BACKUP_RECOVERY_AGENT_CYCLE',
          actorId: agent.id,
          outcome: outcome.status === 'VERIFIED' ? 'INFO' : 'HOLD',
          resource: agent.role === 'BACKUP' ? 'backup-cycle' : agent.role === 'RECOVERY' ? 'recovery-cycle' : 'communication-cycle',
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
    const startedAt = now().toISOString();
    // A cryptographically random suffix prevents accidental ID reuse across
    // process restarts even when clocks or in-memory counters repeat.
    const cycleId = 'saqlain-cycle-' + randomUUID();
    // Stage the cycle so integrity verification cannot race the snapshot writers,
    // and recovery never starts before the verification agent has reported.
    const sourceBackupAgents = SAQLAIN_BACKUP_TEAM.filter((agent) =>
      agent.role === 'BACKUP' && agent.id !== 'saq-backup-verify'
    );
    const verifier = SAQLAIN_BACKUP_TEAM.find((agent) => agent.id === 'saq-backup-verify');
    const recovery = SAQLAIN_BACKUP_TEAM.find((agent) => agent.role === 'RECOVERY');
    const results: AgentCycleResult[] = [
      ...await Promise.all(sourceBackupAgents.map((agent) => runAgent(agent, cycleId))),
    ];
    let verificationResult: AgentCycleResult | undefined;
    if (verifier) {
      verificationResult = await runAgent(verifier, cycleId, results);
      results.push(verificationResult);
    }
    const sourceResults = results.filter((result) => result.role === 'BACKUP' && result.agentId !== 'saq-backup-verify');
    const allSourceAgentsVerified = sourceResults.length === sourceBackupAgents.length &&
      sourceResults.every((result) => result.status === 'VERIFIED');
    if (recovery) {
      if (verificationResult?.status === 'VERIFIED' && allSourceAgentsVerified) {
        results.push(await runAgent(recovery, cycleId, results));
      } else {
        const heldAt = now().toISOString();
        results.push({
          agentId: recovery.id,
          role: recovery.role,
          status: 'HOLD',
          summary: 'Recovery blocked because backup verification or a source-agent audit/result did not pass.',
          startedAt: heldAt,
          finishedAt: now().toISOString(),
        });
      }
    }
    const communication = SAQLAIN_BACKUP_TEAM.find((agent) => agent.role === 'COMMUNICATION');
    if (communication) {
      // Communication is last and receives the completed backup, verification,
      // and recovery outcomes. It cannot change any earlier result.
      results.push(await runAgent(communication, cycleId, results));
    }
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
    try { options.onCycleComplete?.(cycleId); } catch { /* cleanup must not invalidate the completed report */ }
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
