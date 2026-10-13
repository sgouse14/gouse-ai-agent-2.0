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
