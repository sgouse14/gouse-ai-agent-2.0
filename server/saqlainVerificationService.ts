import { timingSafeEqual } from 'node:crypto';
import { appendSaqlainAuditEvent, getSaqlainAuditBackendMode, readSaqlainAuditLog } from './saqlainAuditBackend.ts';
import {
  VERIFICATION_CHAIN_ROLES,
  createVerificationChain,
  resumeHeldVerificationChain,
  submitVerificationReview,
  type VerificationChain,
  type SubmitVerificationReviewInput,
} from './saqlainVerificationChain.ts';

type AuditEntry = Awaited<ReturnType<typeof readSaqlainAuditLog>>[number];
type VerificationSnapshot = { operation: string; chain: VerificationChain };

function constantTimeEqual(candidate: string, expected: string): boolean {
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function requireAuditPath(): string {
  if (getSaqlainAuditBackendMode() === 'firestore') return '';
  const path = process.env.SAQLAIN_VERIFICATION_AUDIT_PATH?.trim();
  if (!path) throw new Error('SAQLAIN_VERIFICATION_AUDIT_PATH is not configured; verification is unavailable.');
  return path;
}

function validChain(value: unknown): value is VerificationChain {
  if (!value || typeof value !== 'object') return false;
  const chain = value as Partial<VerificationChain>;
  return typeof chain.chainId === 'string' && typeof chain.reportRef === 'string' &&
    ['IN_PROGRESS', 'HOLD', 'REJECTED', 'VERIFIED'].includes(String(chain.status)) &&
    Number.isInteger(chain.currentOrder) && Array.isArray(chain.reviews) &&
    Array.isArray(chain.auditEvents) && chain.grantsAccess === false;
}

/**
 * Audit-log-backed event-sourced store. Every state transition is appended to
 * the verified hash chain before it becomes visible in memory. This is a
 * single-process starter: run one writer instance until a transactional shared
 * database/lock service is installed. Never put secrets in report refs, evidence
 * refs, or review notes; the audit record stores the chain snapshot.
 */
export class SaqlainVerificationService {
  private chains = new Map<string, VerificationChain>();
  private loaded = false;
  private loadPromise: Promise<void> | null = null;
  private writeTail: Promise<void> = Promise.resolve();

  private async load(): Promise<void> {
    if (this.loaded) return;
    if (!this.loadPromise) {
      this.loadPromise = (async () => {
        const records = await readSaqlainAuditLog(requireAuditPath());
        for (const record of records as readonly AuditEntry[]) {
          if (record.eventType !== 'SAQLAIN_VERIFICATION_CHAIN_STATE') continue;
          const details = record.details as unknown as VerificationSnapshot | undefined;
          if (details && validChain(details.chain)) this.chains.set(details.chain.chainId, details.chain);
        }
        this.loaded = true;
      })();
    }
    await this.loadPromise;
  }

  private async serialized<T>(operation: () => Promise<T>): Promise<T> {
    const previous = this.writeTail;
    let release!: () => void;
    this.writeTail = new Promise<void>(resolve => { release = resolve; });
    await previous;
    try { await this.load(); return await operation(); }
    finally { release(); }
  }

  private async persist(chain: VerificationChain, operation: string, actorId: string): Promise<void> {
    const outcome = chain.status === 'REJECTED' ? 'DENY' : chain.status === 'HOLD' ? 'HOLD' : 'INFO';
    await appendSaqlainAuditEvent(requireAuditPath(), {
      eventType: 'SAQLAIN_VERIFICATION_CHAIN_STATE',
      actorId,
      outcome,
      resource: chain.chainId,
      taskId: chain.reportRef,
      occurredAt: new Date().toISOString(),
      details: { operation, chain },
    });
    this.chains.set(chain.chainId, chain);
  }

  async list(): Promise<VerificationChain[]> {
    await this.load();
    return [...this.chains.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async get(chainId: string): Promise<VerificationChain | null> {
    await this.load();
    return this.chains.get(chainId) ?? null;
  }

  async create(input: { chainId: string; reportRef: string }): Promise<VerificationChain> {
    return this.serialized(async () => {
      if (this.chains.has(input.chainId)) throw new Error('A verification chain with this chainId already exists.');
      const chain = createVerificationChain(input);
      await this.persist(chain, 'CHAIN_CREATED', 'gouse-verification-coordinator');
      return chain;
    });
  }

  async review(chainId: string, input: SubmitVerificationReviewInput): Promise<VerificationChain> {
    return this.serialized(async () => {
      const existing = this.chains.get(chainId);
      if (!existing) throw new Error('Verification chain not found.');
      const next = submitVerificationReview(existing, input);
      await this.persist(next, 'REVIEW_RECORDED', input.reviewerId);
      return next;
    });
  }

  async resume(chainId: string): Promise<VerificationChain> {
    return this.serialized(async () => {
      const existing = this.chains.get(chainId);
      if (!existing) throw new Error('Verification chain not found.');
      const next = resumeHeldVerificationChain(existing);
      await this.persist(next, 'CHAIN_RESUMED', 'gouse-verification-coordinator');
      return next;
    });
  }
}

export function isVerificationAdminRequest(authorization: string | undefined): boolean {
  const expected = process.env.SAQLAIN_VERIFICATION_ADMIN_TOKEN;
  const candidate = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
  return Boolean(expected && candidate && constantTimeEqual(candidate, expected));
}

export function isVerificationAgentRequest(authorization: string | undefined, reviewerId: string): boolean {
  const candidate = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!candidate) return false;
  let tokens: Record<string, string>;
  try {
    tokens = JSON.parse(process.env.SAQLAIN_VERIFICATION_AGENT_TOKENS_JSON ?? '') as Record<string, string>;
  } catch { return false; }
  const expected = tokens?.[reviewerId];
  return typeof expected === 'string' && expected.length > 0 && constantTimeEqual(candidate, expected);
}

export function verificationRoles() {
  return VERIFICATION_CHAIN_ROLES;
}
