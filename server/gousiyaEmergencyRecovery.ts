import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { appendDurableAuditEvent } from './saqlainAuditLog.ts';
import { runRecoveryRehearsal, type RecoveryRehearsalResult } from './saqlainRecoveryAgent.ts';

export const GOUSIYA_MAX_GRANT_TTL_MS = 5 * 60_000;
export const GOUSIYA_DEFAULT_GRANT_TTL_MS = 2 * 60_000;
export type GousiyaEmergencyStatus = 'ISSUED' | 'CONSUMED' | 'REVOKED' | 'EXPIRED';

export interface GousiyaEmergencyGrant {
  grantId: string;
  incidentId: string;
  recoveryAgentId: string;
  sourceSnapshotDirectory: string;
  stagingRoot: string;
  issuedAt: string;
  expiresAt: string;
  status: GousiyaEmergencyStatus;
}
interface StoredGrant extends GousiyaEmergencyGrant {
  tokenDigest: string;
}
export interface GousiyaEmergencyState {
  grants: Map<string, StoredGrant>;
  auditFilePath: string;
}
export function createGousiyaEmergencyState(auditFilePath: string): GousiyaEmergencyState {
  if (!auditFilePath.trim()) throw new Error('A durable audit path is required.');
  return { grants: new Map(), auditFilePath };
}
function digest(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}
function equalDigest(a: string, b: string): boolean {
  const left = Buffer.from(a, 'hex'), right = Buffer.from(b, 'hex');
  return left.length === right.length && timingSafeEqual(left, right);
}
function required(value: string, field: string): string {
  if (!value?.trim()) throw new Error(field + ' is required.');
  return value.trim();
}
async function audit(state: GousiyaEmergencyState, input: {
  eventType: string; actorId: string; outcome: 'ALLOW' | 'DENY' | 'HOLD' | 'INFO';
  resource: string; occurredAt: string; details: Record<string, unknown>;
}): Promise<void> {
  await appendDurableAuditEvent(state.auditFilePath, input);
}

/**
 * Gousiya is a defensive, offline break-glass coordinator. It can issue a
 * short-lived, single-use authorization for a recovery rehearsal into staging.
 * It never authorizes production promotion, external access, destructive actions,
 * audit bypass, privilege escalation, or modification of protected originals.
 *
 * State is intentionally injectable for tests but currently in-memory; production
 * must replace it with a transactional durable store before multi-process use.
 */
export async function issueGousiyaEmergencyGrant(input: {
  state: GousiyaEmergencyState;
  incidentId: string;
  recoveryAgentId: string;
  sourceSnapshotDirectory: string;
  stagingRoot: string;
  reason: string;
  ownerApproved: boolean;
  independentReviewerApproved: boolean;
  ttlMs?: number;
  now?: Date;
}): Promise<{ grant: GousiyaEmergencyGrant; token: string }> {
  const incidentId = required(input.incidentId, 'incidentId');
  const recoveryAgentId = required(input.recoveryAgentId, 'recoveryAgentId');
  const sourceSnapshotDirectory = required(input.sourceSnapshotDirectory, 'sourceSnapshotDirectory');
  const stagingRoot = required(input.stagingRoot, 'stagingRoot');
  const reason = required(input.reason, 'reason');
  const now = input.now ?? new Date();
  const ttlMs = input.ttlMs ?? GOUSIYA_DEFAULT_GRANT_TTL_MS;
  if (!input.ownerApproved || !input.independentReviewerApproved) {
    await audit(input.state, {
      eventType: 'GOUSIYA_EMERGENCY_GRANT_DENIED',
      actorId: 'gousiya-emergency-coordinator',
      outcome: 'DENY',
      resource: incidentId,
      occurredAt: now.toISOString(),
      details: { ownerApproved: input.ownerApproved, independentReviewerApproved: input.independentReviewerApproved, productionPromotionAllowed: false },
    });
    throw new Error('Emergency grant requires owner approval and independent reviewer approval.');
  }
  if (!Number.isSafeInteger(ttlMs) || ttlMs < 1 || ttlMs > GOUSIYA_MAX_GRANT_TTL_MS) {
    throw new Error('Emergency grant TTL must be between 1 ms and 5 minutes.');
  }
  // Do not permit overlapping source/staging paths. Recovery agent repeats this
  // check before filesystem work; this early check also prevents issuing a grant.
  const { resolve, relative, sep, isAbsolute } = await import('node:path');
  const within = (parent: string, child: string) => {
    const rel = relative(resolve(parent), resolve(child));
    return rel === '' || (rel !== '..' && !rel.startsWith('..' + sep) && !isAbsolute(rel));
  };
  if (within(sourceSnapshotDirectory, stagingRoot) || within(stagingRoot, sourceSnapshotDirectory)) {
    throw new Error('Emergency recovery source and staging paths must be disjoint.');
  }
  const grantId = randomUUID();
  const token = randomBytes(32).toString('hex');
  const grant: StoredGrant = {
    grantId, incidentId, recoveryAgentId, sourceSnapshotDirectory, stagingRoot,
    issuedAt: now.toISOString(), expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
    status: 'ISSUED', tokenDigest: digest(token),
  };
  await audit(input.state, {
    eventType: 'GOUSIYA_EMERGENCY_GRANT_ISSUED',
    actorId: 'gousiya-emergency-coordinator',
    outcome: 'ALLOW',
    resource: incidentId,
    occurredAt: now.toISOString(),
    details: {
      grantId, recoveryAgentId, reason: reason.slice(0, 1000), expiresAt: grant.expiresAt,
      tokenLogged: false, singleUse: true, productionPromotionAllowed: false,
      protectedOriginalsModifiable: false, auditBypassAllowed: false,
    },
  });
  input.state.grants.set(grantId, grant);
  const { tokenDigest: _secret, ...publicGrant } = grant;
  return { grant: Object.freeze({ ...publicGrant }), token };
}

/** Consumes the grant before any filesystem work, so retries cannot replay it. */
export async function executeGousiyaEmergencyRecovery(input: {
  state: GousiyaEmergencyState;
  grantId: string;
  token: string;
  incidentId: string;
  now?: Date;
}): Promise<RecoveryRehearsalResult> {
  const now = input.now ?? new Date();
  const grant = input.state.grants.get(input.grantId);
  const suppliedDigest = digest(input.token ?? '');
  if (!grant || !equalDigest(grant.tokenDigest, suppliedDigest) ||
      grant.incidentId !== input.incidentId || grant.status !== 'ISSUED') {
    await audit(input.state, {
      eventType: 'GOUSIYA_EMERGENCY_RECOVERY_DENIED',
      actorId: 'gousiya-emergency-coordinator',
      outcome: 'DENY',
      resource: input.incidentId || 'unknown-incident',
      occurredAt: now.toISOString(),
      details: { grantId: input.grantId, reason: 'invalid, mismatched, or already-used grant', productionPromotionAllowed: false },
    });
    throw new Error('Emergency grant is invalid, mismatched, or already used.');
  }
  if (now.getTime() >= Date.parse(grant.expiresAt)) {
    grant.status = 'EXPIRED';
    await audit(input.state, {
      eventType: 'GOUSIYA_EMERGENCY_GRANT_EXPIRED',
      actorId: 'gousiya-emergency-coordinator',
      outcome: 'DENY',
      resource: grant.incidentId,
      occurredAt: now.toISOString(),
      details: { grantId: grant.grantId, productionPromotionAllowed: false },
    });
    throw new Error('Emergency grant has expired.');
  }
  // Consume and persist the event before invoking recovery. If audit fails, no
  // recovery is attempted and the grant remains unavailable to avoid replay.
  grant.status = 'CONSUMED';
  await audit(input.state, {
    eventType: 'GOUSIYA_EMERGENCY_GRANT_CONSUMED',
    actorId: 'gousiya-emergency-coordinator',
    outcome: 'ALLOW',
    resource: grant.incidentId,
    occurredAt: now.toISOString(),
    details: { grantId: grant.grantId, singleUse: true, productionPromotionAllowed: false },
  });
  const result = await runRecoveryRehearsal({
    sourceSnapshotDirectory: grant.sourceSnapshotDirectory,
    stagingRoot: grant.stagingRoot,
    auditFilePath: input.state.auditFilePath,
    recoveryAgentId: grant.recoveryAgentId,
    stagingSnapshotId: 'gousiya-' + grant.grantId,
    now,
  });
  await audit(input.state, {
    eventType: 'GOUSIYA_EMERGENCY_RECOVERY_FINISHED',
    actorId: 'gousiya-emergency-coordinator',
    outcome: result.decision === 'VERIFIED' ? 'INFO' : 'HOLD',
    resource: grant.incidentId,
    occurredAt: now.toISOString(),
    details: {
      grantId: grant.grantId, decision: result.decision, verifiedFiles: result.verifiedFiles,
      originalsModified: false, promotionAllowed: false,
    },
  });
  return result;
}

export async function revokeGousiyaEmergencyGrant(input: {
  state: GousiyaEmergencyState; grantId: string; actorId: string; now?: Date;
}): Promise<void> {
  const grant = input.state.grants.get(input.grantId);
  if (!grant || grant.status !== 'ISSUED') throw new Error('Only an unused issued grant can be revoked.');
  const now = input.now ?? new Date();
  await audit(input.state, {
    eventType: 'GOUSIYA_EMERGENCY_GRANT_REVOKED',
    actorId: required(input.actorId, 'actorId'),
    outcome: 'DENY',
    resource: grant.incidentId,
    occurredAt: now.toISOString(),
    details: { grantId: grant.grantId, productionPromotionAllowed: false },
  });
  grant.status = 'REVOKED';
}
