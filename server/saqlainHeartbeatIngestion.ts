import { createHash, timingSafeEqual } from 'node:crypto';
import type { AgentHeartbeat } from './saqlainAgentHeartbeat.ts';

export interface HeartbeatCredential {
  agentId: string;
  /** SHA-256 hex digest of a per-agent secret provisioned out-of-band. */
  tokenSha256: string;
}
export interface HeartbeatStore {
  record(heartbeat: AgentHeartbeat): void;
  list(): AgentHeartbeat[];
}
export function createInMemoryHeartbeatStore(): HeartbeatStore {
  const latest = new Map<string, AgentHeartbeat>();
  return {
    record(heartbeat) { latest.set(heartbeat.agentId, { ...heartbeat }); },
    list() { return [...latest.values()].map((beat) => ({ ...beat })); },
  };
}
export function sha256HeartbeatToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}
export function verifyHeartbeatToken(token: string, expectedSha256: string): boolean {
  if (!token || !/^[a-f0-9]{64}$/i.test(expectedSha256)) return false;
  const actual = Buffer.from(sha256HeartbeatToken(token), 'hex');
  const expected = Buffer.from(expectedSha256, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Accept a heartbeat only after matching the registered agent and verifying its provisioned secret. */
export function acceptAuthenticatedHeartbeat(
  input: { agentId: string; token: string; credentials: readonly HeartbeatCredential[]; store: HeartbeatStore; now?: Date },
): { accepted: boolean; receivedAt?: string } {
  const credential = input.credentials.find((entry) => entry.agentId === input.agentId);
  if (!credential || !verifyHeartbeatToken(input.token, credential.tokenSha256)) return { accepted: false };
  const now = input.now ?? new Date();
  if (!Number.isFinite(now.getTime())) return { accepted: false };
  const receivedAt = now.toISOString();
  input.store.record({ agentId: input.agentId, lastSeenAt: receivedAt });
  return { accepted: true, receivedAt };
}

/**
 * Parse the shared heartbeat credential configuration.
 * Null means malformed, empty, or ambiguous configuration and must fail closed.
 */
export function parseHeartbeatCredentials(raw: string | undefined): HeartbeatCredential[] | null {
  if (!raw?.trim()) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    const credentials: HeartbeatCredential[] = [];
    const seen = new Set<string>();
    for (const item of parsed) {
      if (!item || typeof item !== 'object') return null;
      const candidate = item as Record<string, unknown>;
      if (typeof candidate.agentId !== 'string' || !candidate.agentId.trim() ||
          typeof candidate.tokenSha256 !== 'string' || !/^[a-f0-9]{64}$/i.test(candidate.tokenSha256)) return null;
      if (seen.has(candidate.agentId)) return null;
      seen.add(candidate.agentId);
      credentials.push({ agentId: candidate.agentId, tokenSha256: candidate.tokenSha256 });
    }
    return credentials;
  } catch {
    return null;
  }
}
