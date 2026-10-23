import { Router, type Request, type Response } from 'express';
import { appendSaqlainAuditEvent, getSaqlainAuditBackendMode } from './saqlainAuditBackend.ts';
import { acceptAuthenticatedHeartbeat, createInMemoryHeartbeatStore, parseHeartbeatCredentials } from './saqlainHeartbeatIngestion.ts';
import { SaqlainFirestoreHeartbeatStore } from './saqlainFirestoreHeartbeatStore.ts';

const localStore = createInMemoryHeartbeatStore();
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
  if (recentRequests.size > 10_000) {
    for (const [savedKey, saved] of recentRequests) {
      if (now < saved.windowStartedAt || now - saved.windowStartedAt >= WINDOW_MS) recentRequests.delete(savedKey);
    }
  }
  return true;
}

function configuredAuditPath(): string | undefined {
  return process.env.SAQLAIN_AUDIT_FILE?.trim() || undefined;
}

export const saqlainHeartbeatRouter = Router();
saqlainHeartbeatRouter.post('/', async (req: Request, res: Response) => {
  const agentId = typeof req.body?.agentId === 'string' ? req.body.agentId : '';
  const token = req.header('x-saqlain-agent-token') ?? '';
  const now = Date.now();
  // This per-process throttle is a local safeguard, not a distributed rate limiter.
  const clientKey = req.socket.remoteAddress || 'unknown-client';
  if (!allowRequest(clientKey, now)) {
    res.status(429).json({ accepted: false, error: 'Rate limit exceeded.' });
    return;
  }

  const credentials = parseHeartbeatCredentials(process.env.SAQLAIN_HEARTBEAT_CREDENTIALS_JSON);
  let auditPath: string | undefined;
  let backend: 'file' | 'firestore';
  try {
    backend = getSaqlainAuditBackendMode();
    auditPath = configuredAuditPath();
    if (!credentials || (backend === 'file' && !auditPath)) throw new Error('Heartbeat configuration missing.');
  } catch {
    res.status(503).json({ accepted: false, error: 'Heartbeat service is not configured.' });
    return;
  }

  const pendingStore = createInMemoryHeartbeatStore();
  const result = acceptAuthenticatedHeartbeat({ agentId, token, credentials: credentials!, store: pendingStore });
  try {
    await appendSaqlainAuditEvent(auditPath, {
      eventType: 'SAQLAIN_AGENT_HEARTBEAT',
      actorId: result.accepted ? agentId : 'unknown-agent',
      outcome: result.accepted ? 'INFO' : 'DENY',
      resource: 'saqlain-heartbeat',
      occurredAt: new Date().toISOString(),
      details: { accepted: result.accepted },
    });
  } catch {
    res.status(503).json({ accepted: false, error: 'Heartbeat audit unavailable.' });
    return;
  }

  if (!result.accepted) {
    res.status(401).json({ accepted: false });
    return;
  }

  try {
    if (backend === 'firestore') {
      await new SaqlainFirestoreHeartbeatStore().record({ agentId, lastSeenAt: result.receivedAt! });
    } else {
      localStore.record({ agentId, lastSeenAt: result.receivedAt! });
    }
  } catch {
    // Acknowledge only after the shared/local heartbeat state is durable.
    res.status(503).json({ accepted: false, error: 'Heartbeat storage unavailable.' });
    return;
  }
  res.status(202).json({ accepted: true, receivedAt: result.receivedAt });
});

/** Internal read-only snapshot for a trusted collector; never expose directly as an HTTP route. */
export async function getSaqlainHeartbeatSnapshot() {
  if (getSaqlainAuditBackendMode() === 'firestore') return new SaqlainFirestoreHeartbeatStore().list();
  return localStore.list();
}
