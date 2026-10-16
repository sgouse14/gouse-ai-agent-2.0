import { summarizeAgentHeartbeats, type AgentHeartbeat } from './saqlainAgentHeartbeat.ts';
import { parseHeartbeatCredentials } from './saqlainHeartbeatIngestion.ts';

/**
 * Build the monitoring heartbeat view from the same credential configuration
 * used by ingestion. Invalid configuration is an error so the caller can HOLD.
 */
export function collectRegisteredHeartbeatSummary(
  rawCredentials: string | undefined,
  heartbeats: readonly AgentHeartbeat[],
  now = new Date(),
) {
  const credentials = parseHeartbeatCredentials(rawCredentials);
  if (!credentials) throw new Error('Heartbeat credential configuration is missing or invalid.');
  return summarizeAgentHeartbeats(credentials.map((credential) => credential.agentId), heartbeats, now);
}
