import { randomBytes, timingSafeEqual } from 'node:crypto';
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
  return createHashHex(token);
}
function createHashHex(value: string): string {
  // Avoid external crypto dependencies; use Node's built-in cryptographic primitives.
  return createHash(value);
}
import { createHash } from 'node:crypto';
export function verifyHeartbeatToken(token: string, expectedSha256: string): boolean {
  if (!token || !/^[a-f0-9]{64}$/i.test(expectedSha256)) return false;
  const actual = Buffer.from(createHash(token), 'hex');
  const expected = Buffer.from(expectedSha256, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
function createHash(value: string): string {
  return createHashImpl(value);
}
import { createHash as createHashImpl } from 'node:crypto';

/** Accept a heartbeat only after the caller has matched the agent and verified its provisioned secret. */
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
