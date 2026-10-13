import assert from 'node:assert/strict';
import test from 'node:test';
import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  evaluateAndAuditGatekeeperRequest,
  loadGatekeeperIdentityState,
  validateGatekeeperRequest,
} from './saqlainGatekeeperService.ts';
import { readVerifiedAuditLog } from './saqlainAuditLog.ts';

const id = '10101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010';
const credential = 'test-agent-credential-which-is-long-enough-12345';

async function withConfig(run: (ctx: { registryPath: string; auditPath: string }) => Promise<void>) {
  const root = await mkdtemp(join(tmpdir(), 'saqlain-gatekeeper-'));
  const registryPath = join(root, 'identity-registry.json');
  const auditPath = join(root, 'audit', 'gatekeeper.jsonl');
  const envNames = ['SAQLAIN_AGENT_IDENTITY_REGISTRY_PATH', 'SAQLAIN_GATEKEEPER_CREDENTIALS_JSON', 'SAQLAIN_GATEKEEPER_AUDIT_PATH'];
  const old = new Map(envNames.map(name => [name, process.env[name]]));
  const record = {
    agentKey: 'partner-agent-01', currentBinaryId: id, status: 'ACTIVE',
    ownerApproved: true, issuedAt: '2026-01-01T00:00:00.000Z',
    lastRotatedAt: null, completedTaskCount: 0,
  };
  await writeFile(registryPath, JSON.stringify({ agents: [record], issuedIds: [id] }), { mode: 0o600 });
  await chmod(registryPath, 0o600);
  process.env.SAQLAIN_AGENT_IDENTITY_REGISTRY_PATH = registryPath;
  process.env.SAQLAIN_GATEKEEPER_CREDENTIALS_JSON = JSON.stringify({ 'partner-agent-01': { 'partner-platform': credential } });
  process.env.SAQLAIN_GATEKEEPER_AUDIT_PATH = auditPath;
  try { await run({ registryPath, auditPath }); }
  finally {
    for (const [name, value] of old) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
    await rm(root, { recursive: true, force: true });
  }
}

function request(overrides: Record<string, unknown> = {}) {
  return {
    requestId: 'gatekeeper-test-001', agentId: id, platformId: 'partner-platform',
    apiCredential: credential, requestedScope: ['public-api'], ...overrides,
  };
}

test('valid registered current agent passes approved scope and decision is durably audited', async () => {
  await withConfig(async ({ auditPath }) => {
    const result = await evaluateAndAuditGatekeeperRequest(request());
    assert.equal(result.decision, 'PASS');
    const records = await readVerifiedAuditLog(auditPath);
    assert.equal(records.length, 1);
    assert.equal(records[0].outcome, 'ALLOW');
    assert.equal(JSON.stringify(records).includes(credential), false);
  });
});

test('protected scopes are blocked and audit outcome is DENY', async () => {
  await withConfig(async ({ auditPath }) => {
    const result = await evaluateAndAuditGatekeeperRequest(request({ requestedScope: ['protected-files'] }));
    assert.equal(result.decision, 'BLOCK');
    const records = await readVerifiedAuditLog(auditPath);
    assert.equal(records[0].outcome, 'DENY');
  });
});

test('wrong platform, stale ID, and suspended agent fail closed', async () => {
  await withConfig(async () => {
    assert.equal((await evaluateAndAuditGatekeeperRequest(request({ platformId: 'other-platform' }))).decision, 'BLOCK');
    assert.equal((await evaluateAndAuditGatekeeperRequest(request({ agentId: '0'.repeat(128) }))).decision, 'BLOCK');
    const state = await loadGatekeeperIdentityState();
    state.agents.get('partner-agent-01')!.status = 'SUSPENDED';
    await assert.rejects(async () => {
      const { writeFile: write } = await import('node:fs/promises');
      await writeFile(process.env.SAQLAIN_AGENT_IDENTITY_REGISTRY_PATH!, JSON.stringify({
        agents: [{ ...state.agents.get('partner-agent-01')! }], issuedIds: [...state.issuedIds],
      }), { mode: 0o600 });
      assert.equal((await evaluateAndAuditGatekeeperRequest(request())).decision, 'BLOCK');
    });
  });
});

test('sensitive or unrecognized scopes require review, not access', async () => {
  await withConfig(async () => {
    assert.equal((await evaluateAndAuditGatekeeperRequest(request({ requestedScope: ['admin-console'] }))).decision, 'HOLD');
    assert.equal((await evaluateAndAuditGatekeeperRequest(request({ sensitiveOperation: true }))).decision, 'HOLD');
  });
});

test('malformed request, malformed registry, and missing audit path fail closed', async () => {
  await withConfig(async ({ registryPath }) => {
    assert.equal(validateGatekeeperRequest({ ...request(), requestedScope: ['../secret'] }), null);
    await writeFile(registryPath, '{not-json', 'utf8');
    await assert.rejects(loadGatekeeperIdentityState());
    await writeFile(registryPath, JSON.stringify({ agents: [], issuedIds: [] }), 'utf8');
    delete process.env.SAQLAIN_GATEKEEPER_AUDIT_PATH;
    await assert.rejects(evaluateAndAuditGatekeeperRequest(request()), /not configured/);
  });
});

test('tampered audit history prevents a later request from receiving a decision', async () => {
  await withConfig(async ({ auditPath }) => {
    await evaluateAndAuditGatekeeperRequest(request());
    const content = await readFile(auditPath, 'utf8');
    await writeFile(auditPath, content.replace('public-api', 'private-api'), 'utf8');
    await assert.rejects(evaluateAndAuditGatekeeperRequest(request()), /integrity verification failed/);
  });
});
