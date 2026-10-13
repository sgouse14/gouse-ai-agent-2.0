import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  SaqlainVerificationService,
  isVerificationAdminRequest,
  isVerificationAgentRequest,
} from './saqlainVerificationService.ts';
import { VERIFICATION_CHAIN_ROLES } from './saqlainVerificationChain.ts';

async function withTempAudit(run: (auditPath: string) => Promise<void>) {
  const root = await mkdtemp(join(tmpdir(), 'saqlain-verification-'));
  const oldPath = process.env.SAQLAIN_VERIFICATION_AUDIT_PATH;
  process.env.SAQLAIN_VERIFICATION_AUDIT_PATH = join(root, 'audit', 'verification.jsonl');
  try { await run(process.env.SAQLAIN_VERIFICATION_AUDIT_PATH); }
  finally {
    if (oldPath === undefined) delete process.env.SAQLAIN_VERIFICATION_AUDIT_PATH;
    else process.env.SAQLAIN_VERIFICATION_AUDIT_PATH = oldPath;
    await rm(root, { recursive: true, force: true });
  }
}

test('service durably records a chain and reconstructs it after a new service instance', async () => {
  await withTempAudit(async auditPath => {
    const service = new SaqlainVerificationService();
    const created = await service.create({ chainId: 'integration-001', reportRef: 'report-ref-001' });
    assert.equal(created.status, 'IN_PROGRESS');
    assert.equal(created.grantsAccess, false);

    let chain = created;
    for (const role of VERIFICATION_CHAIN_ROLES) {
      chain = await service.review(chain.chainId, {
        order: role.order,
        reviewerId: role.agentId,
        verdict: 'APPROVED',
        evidenceRefs: [`evidence-${role.order}`],
        externalEvidenceSanitized: role.order === 11 ? true : undefined,
      });
    }
    assert.equal(chain.status, 'VERIFIED');
    assert.equal(chain.reviews.length, 11);
    assert.equal(chain.grantsAccess, false);

    const restored = new SaqlainVerificationService();
    const fromDisk = await restored.get('integration-001');
    assert.equal(fromDisk?.status, 'VERIFIED');
    assert.equal(fromDisk?.reviews.length, 11);
    assert.equal(fromDisk?.grantsAccess, false);
    const log = await readFile(auditPath, 'utf8');
    assert.equal(log.trim().split('\n').length, 12);
  });
});

test('HOLD requires admin resume; rejected chains are terminal; duplicate IDs are rejected', async () => {
  await withTempAudit(async () => {
    const service = new SaqlainVerificationService();
    await service.create({ chainId: 'hold-001', reportRef: 'report-hold' });
    const held = await service.review('hold-001', {
      order: 1, reviewerId: VERIFICATION_CHAIN_ROLES[0].agentId,
      verdict: 'REVIEW_REQUIRED', evidenceRefs: ['anomaly-ref'],
    });
    assert.equal(held.status, 'HOLD');
    await assert.rejects(service.review('hold-001', {
      order: 1, reviewerId: VERIFICATION_CHAIN_ROLES[0].agentId,
      verdict: 'APPROVED', evidenceRefs: ['recheck-ref'],
    }), /in-progress/);
    assert.equal((await service.resume('hold-001')).status, 'IN_PROGRESS');
    await assert.rejects(service.create({ chainId: 'hold-001', reportRef: 'duplicate' }), /already exists/);
  });
});

test('reviewer order and step 11 sanitization are enforced', async () => {
  await withTempAudit(async () => {
    const service = new SaqlainVerificationService();
    await service.create({ chainId: 'order-001', reportRef: 'report-order' });
    await assert.rejects(service.review('order-001', {
      order: 2, reviewerId: VERIFICATION_CHAIN_ROLES[1].agentId,
      verdict: 'APPROVED', evidenceRefs: ['evidence'],
    }), /order/);

    for (let order = 1; order <= 10; order += 1) {
      await service.review('order-001', {
        order, reviewerId: VERIFICATION_CHAIN_ROLES[order - 1].agentId,
        verdict: 'APPROVED', evidenceRefs: [`evidence-${order}`],
      });
    }
    await assert.rejects(service.review('order-001', {
      order: 11, reviewerId: VERIFICATION_CHAIN_ROLES[10].agentId,
      verdict: 'APPROVED', evidenceRefs: ['external-evidence'],
      externalEvidenceSanitized: false,
    }), /sanitized/);
  });
});

test('credentials fail closed and are matched to the requested role', () => {
  const oldAdmin = process.env.SAQLAIN_VERIFICATION_ADMIN_TOKEN;
  const oldAgents = process.env.SAQLAIN_VERIFICATION_AGENT_TOKENS_JSON;
  try {
    delete process.env.SAQLAIN_VERIFICATION_ADMIN_TOKEN;
    delete process.env.SAQLAIN_VERIFICATION_AGENT_TOKENS_JSON;
    assert.equal(isVerificationAdminRequest('Bearer secret'), false);
    assert.equal(isVerificationAgentRequest('Bearer secret', VERIFICATION_CHAIN_ROLES[0].agentId), false);
    process.env.SAQLAIN_VERIFICATION_ADMIN_TOKEN = 'admin-secret';
    process.env.SAQLAIN_VERIFICATION_AGENT_TOKENS_JSON = JSON.stringify({ [VERIFICATION_CHAIN_ROLES[0].agentId]: 'agent-secret' });
    assert.equal(isVerificationAdminRequest('Bearer admin-secret'), true);
    assert.equal(isVerificationAdminRequest('Bearer wrong'), false);
    assert.equal(isVerificationAgentRequest('Bearer agent-secret', VERIFICATION_CHAIN_ROLES[0].agentId), true);
    assert.equal(isVerificationAgentRequest('Bearer agent-secret', VERIFICATION_CHAIN_ROLES[1].agentId), false);
  } finally {
    if (oldAdmin === undefined) delete process.env.SAQLAIN_VERIFICATION_ADMIN_TOKEN;
    else process.env.SAQLAIN_VERIFICATION_ADMIN_TOKEN = oldAdmin;
    if (oldAgents === undefined) delete process.env.SAQLAIN_VERIFICATION_AGENT_TOKENS_JSON;
    else process.env.SAQLAIN_VERIFICATION_AGENT_TOKENS_JSON = oldAgents;
  }
});

test('tampered audit log fails closed rather than accepting altered chain state', async () => {
  await withTempAudit(async auditPath => {
    const service = new SaqlainVerificationService();
    await service.create({ chainId: 'tamper-001', reportRef: 'report-tamper' });
    const text = await readFile(auditPath, 'utf8');
    await mkdir(join(auditPath, '..'), { recursive: true });
    await writeFile(auditPath, text.replace('tamper-001', 'changed-001'), 'utf8');
    const restored = new SaqlainVerificationService();
    await assert.rejects(restored.list(), /integrity verification failed/);
  });
});
