/**
 * In-process heartbeat registry for Saqlain monitoring.
 * A heartbeat proves only that a registered worker reported recently; it is not authentication.
 * Callers must authenticate the worker before recording a heartbeat.
 */
export interface AgentHeartbeat {
  agentId: string;
  lastSeenAt: string;
}
export interface HeartbeatSummary {
  activeAgentIds: string[];
  staleAgentIds: string[];
  activeAgents: number;
}
export function summarizeAgentHeartbeats(
  registeredAgentIds: readonly string[],
  heartbeats: readonly AgentHeartbeat[],
  now = new Date(),
  staleAfterMs = 2 * 60 * 60 * 1000,
): HeartbeatSummary {
  if (!Number.isFinite(now.getTime()) || !Number.isSafeInteger(staleAfterMs) || staleAfterMs <= 0) {
    throw new Error('Valid time and positive staleAfterMs are required.');
  }
  const registered = new Set(registeredAgentIds);
  if (registered.size !== registeredAgentIds.length || registeredAgentIds.some((id) => !id.trim())) {
    throw new Error('Registered agent IDs must be non-empty and unique.');
  }
  const latest = new Map<string, number>();
  for (const beat of heartbeats) {
    if (!registered.has(beat.agentId)) continue;
    const timestamp = Date.parse(beat.lastSeenAt);
    if (!Number.isFinite(timestamp)) continue;
    latest.set(beat.agentId, Math.max(latest.get(beat.agentId) ?? -Infinity, timestamp));
  }
  const activeAgentIds: string[] = [];
  const staleAgentIds: string[] = [];
  for (const id of registeredAgentIds) {
    const lastSeen = latest.get(id);
    if (lastSeen !== undefined && lastSeen <= now.getTime() && now.getTime() - lastSeen <= staleAfterMs) activeAgentIds.push(id);
    else staleAgentIds.push(id);
  }
  return { activeAgentIds, staleAgentIds, activeAgents: activeAgentIds.length };
}
