import { timingSafeEqual } from 'node:crypto';
import { lstat, readFile } from 'node:fs/promises';
import { appendDurableAuditEvent } from './saqlainAuditLog.ts';
import {
  evaluateRegisteredAgentAccess,
  type ExternalAccessRequest,
  type GatekeeperResult,
} from './saqlainGatekeeper.ts';
import type { AgentIdentityRecord, AgentIdentityState } from './saqlainAgentIdentity.ts';

function equalSecret(candidate: string, expected: string): boolean {
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function requiredPath(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

export async function loadGatekeeperIdentityState(): Promise<AgentIdentityState> {
  const file = requiredPath('SAQLAIN_AGENT_IDENTITY_REGISTRY_PATH');
  const stat = await lstat(file);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('Identity registry must be a regular, non-symlink file.');
  const parsed = JSON.parse(await readFile(file, 'utf8')) as {
    agents?: AgentIdentityRecord[];
    issuedIds?: string[];
  };
  if (!Array.isArray(parsed.agents) || !Array.isArray(parsed.issuedIds)) {
    throw new Error('Identity registry schema is invalid.');
  }
  const agents = new Map<string, AgentIdentityRecord>();
  const issuedIds = new Set<string>();
  for (const id of parsed.issuedIds) {
    if (typeof id !== 'string' || !/^[01]{128}$/.test(id)) throw new Error('Identity registry contains an invalid issued ID.');
    issuedIds.add(id);
  }
  for (const agent of parsed.agents) {
    if (!agent || typeof agent.agentKey !== 'string' || !agent.agentKey ||
        typeof agent.currentBinaryId !== 'string' || !/^[01]{128}$/.test(agent.currentBinaryId) ||
        !['ACTIVE', 'RETIRED', 'SUSPENDED'].includes(agent.status) ||
        typeof agent.ownerApproved !== 'boolean' || !issuedIds.has(agent.currentBinaryId) ||
        agents.has(agent.agentKey)) {
      throw new Error('Identity registry contains an invalid agent record.');
    }
    agents.set(agent.agentKey, { ...agent });
  }
  return { agents, issuedIds, auditEvents: [] };
}

/** Verifies a platform-bound bearer credential from server-only configuration. */
export function verifyConfiguredAgentCredential(input: {
  credential: string;
  agentKey: string;
  platformId: string;
  now: Date;
}): boolean {
  let credentials: Record<string, Record<string, string>>;
  try {
    credentials = JSON.parse(process.env.SAQLAIN_GATEKEEPER_CREDENTIALS_JSON ?? '') as Record<string, Record<string, string>>;
  } catch {
    return false;
  }
  const expected = credentials?.[input.agentKey]?.[input.platformId];
  return typeof expected === 'string' && expected.length >= 24 && equalSecret(input.credential, expected);
}

export async function evaluateAndAuditGatekeeperRequest(
  request: ExternalAccessRequest,
  now = new Date(),
): Promise<GatekeeperResult> {
  const identityState = await loadGatekeeperIdentityState();
  const result = evaluateRegisteredAgentAccess({
    request,
    identityState,
    verifyCredential: verifyConfiguredAgentCredential,
  }, now);

  // Never persist the presented credential. If durable audit fails, do not pass access.
  await appendDurableAuditEvent(requiredPath('SAQLAIN_GATEKEEPER_AUDIT_PATH'), {
    eventType: 'SAQLAIN_GATEKEEPER_ACCESS_DECISION',
    actorId: result.auditEvent.actor || 'unknown',
    outcome: result.decision === 'PASS' ? 'ALLOW' : result.decision === 'BLOCK' ? 'DENY' : 'HOLD',
    resource: request.requestedScope.join(',').slice(0, 500) || 'unspecified',
    taskId: request.requestId.slice(0, 200),
    occurredAt: result.auditEvent.timestamp,
    details: {
      decision: result.decision,
      reason: result.reason,
      platformId: request.platformId.slice(0, 200),
      sensitiveOperation: Boolean(request.sensitiveOperation),
      // Scope names only; apiCredential is deliberately excluded.
    },
  });
  return result;
}

export function validateGatekeeperRequest(value: unknown): ExternalAccessRequest | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (typeof v.requestId !== 'string' || !v.requestId.trim() || v.requestId.length > 200 ||
      typeof v.agentId !== 'string' || !/^[01]{128}$/.test(v.agentId) ||
      typeof v.platformId !== 'string' || !v.platformId.trim() || v.platformId.length > 200 ||
      typeof v.apiCredential !== 'string' || v.apiCredential.length < 24 || v.apiCredential.length > 4096 ||
      !Array.isArray(v.requestedScope) || v.requestedScope.length === 0 || v.requestedScope.length > 20 ||
      !v.requestedScope.every(scope => typeof scope === 'string' && /^[a-z0-9][a-z0-9-]{0,63}$/.test(scope)) ||
      (v.sensitiveOperation !== undefined && typeof v.sensitiveOperation !== 'boolean')) return null;
  return {
    requestId: v.requestId,
    agentId: v.agentId,
    platformId: v.platformId,
    apiCredential: v.apiCredential,
    requestedScope: [...new Set(v.requestedScope as string[])],
    sensitiveOperation: v.sensitiveOperation as boolean | undefined,
  };
}
