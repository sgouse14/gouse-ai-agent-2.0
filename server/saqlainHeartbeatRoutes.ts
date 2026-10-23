import { Router, type Request, type Response } from 'express';
import { appendDurableAuditEvent } from './saqlainAuditLog.ts';
import { acceptAuthenticatedHeartbeat, createInMemoryHeartbeatStore, parseHeartbeatCredentials } from './saqlainHeartbeatIngestion.ts';

const store = createInMemoryHeartbeatStore();
const recentRequests = new Map<string, { windowStartedAt: number; count: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 60;

function allowRequest(key: string, now: number): boolean {
  const current = recentRequests.get(key);
  if (!current || now - current.windowStartedAt >= WINDOW_MS || now < current.windowStartedAt) {
    recentRequests.set(key, { windowStartedAt: now, count: 1 });
  } else {
    if (current.count >= MAX_REQUESTS_PER_WINDOW) return false;
    current.count += 1;
  }

  // Bound memory when many distinct clients reach this endpoint.
  if (recentRequests.size > 10_000) {
    for (const [savedKey, saved] of recentRequests) {
      if (now < saved.windowStartedAt || now - saved.windowStartedAt >= WINDOW_MS) {
        recentRequests.delete(savedKey);
      }
    }
  }
  return true;
}
export const saqlainHeartbeatRouter = Router();
saqlainHeartbeatRouter.post('/', async (req: Request, res: Response) => {
  const agentId = typeof req.body?.agentId === 'string' ? req.body.agentId : '';
  const token = req.header('x-saqlain-agent-token') ?? '';
  const now = Date.now();
  // Never key abuse controls by the untrusted agentId in the payload: an attacker
  // could rotate arbitrary IDs to bypass throttling. Use the socket peer address.
  const clientKey = req.socket.remoteAddress || 'unknown-client';
  if (!allowRequest(clientKey, now)) {
    res.status(429).json({ accepted: false, error: 'Rate limit exceeded.' });
    return;
  }
  const credentials = parseHeartbeatCredentials(process.env.SAQLAIN_HEARTBEAT_CREDENTIALS_JSON);
  const auditFilePath = process.env.SAQLAIN_AUDIT_FILE;
  if (!credentials || !auditFilePath) {
    res.status(503).json({ accepted: false, error: 'Heartbeat service is not configured.' });
    return;
  }
  const pendingStore = createInMemoryHeartbeatStore();
  const result = acceptAuthenticatedHeartbeat({ agentId, token, credentials, store: pendingStore });
  try {
    await appendDurableAuditEvent(auditFilePath, {
      eventType: 'SAQLAIN_AGENT_HEARTBEAT',
      actorId: result.accepted ? agentId : 'unknown-agent',
      outcome: result.accepted ? 'INFO' : 'DENY',
      resource: 'saqlain-heartbeat',
      occurredAt: new Date().toISOString(),
      details: { accepted: result.accepted },
    });
  } catch {
    // Fail closed: do not claim acceptance if the audit event could not be persisted.
    res.status(503).json({ accepted: false, error: 'Heartbeat audit unavailable.' });
    return;
  }
  if (!result.accepted) {
    res.status(401).json({ accepted: false });
    return;
  }
  // Commit heartbeat to the live store only after its audit record is durable.
  store.record({ agentId, lastSeenAt: result.receivedAt! });
  res.status(202).json({ accepted: true, receivedAt: result.receivedAt });
});

/** Internal read-only access for a trusted collector in this process; never expose directly as an HTTP route. */
export function getSaqlainHeartbeatSnapshot() {
  return store.list();
}
