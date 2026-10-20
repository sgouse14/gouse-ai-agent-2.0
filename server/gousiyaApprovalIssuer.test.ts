import test from 'node:test';
import assert from 'node:assert/strict';
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  createGousiyaApprovalIssuer,
  createGousiyaApprovalTokenVerifier,
  GOUSIYA_APPROVAL_MAX_TTL_MS,
  type GousiyaApproverRegistryEntry,
} from './gousiyaApprovalIssuer.ts';
import { readVerifiedAuditLog } from './saqlainAuditLog.ts';
import type { GousiyaApprovalScope } from './gousiyaEmergencyRecovery.ts';

const BASE_NOW = new Date('2026-10-20T12:00:00.000Z');
const PROJECT_ID = 'gousiya-issuer-test-project';
const SIGNING_SECRET = 'test-secret-material-at-least-32-bytes-long';
const SCOPE: Omit<GousiyaApprovalScope, 'requestedAt'> = {
  incidentId: 'incident-issuer-test',
  recoveryAgentId: 'saq-recovery-agent',
  sourceSnapshotDirectory: '/tmp/gousiya-test/source',
  stagingRoot: '/tmp/gousiya-test/staging',
};

async function setup(users: GousiyaApproverRegistryEntry[] = [
  { uid: 'owner-user', active: true, roles: ['system-owner'] },
  { uid: 'reviewer-user', active: true, roles: ['independent-reviewer'] },
]) {
  const root = await mkdtemp(join(tmpdir(), 'gousiya-approval-issuer-'));
  const registryFilePath = join(root, 'approvers.json');
  const auditFilePath = join(root, 'audit', 'events.jsonl');
  await writeFile(registryFilePath, JSON.stringify({ schemaVersion: 1, users }), { mode: 0o600 });
  await chmod(registryFilePath, 0o600);
  const authenticateFirebaseIdentity = async (token: string) => {
    if (token === 'owner-firebase-token') return { uid: 'owner-user', authTime: Math.floor(BASE_NOW.getTime() / 1000) - 10, tokenIssuedAt: Math.floor(BASE_NOW.getTime() / 1000) - 10, tokenExpiresAt: Math.floor(BASE_NOW.getTime() / 1000) + 3600 };
    if (token === 'reviewer-firebase-token') return { uid: 'reviewer-user', authTime: Math.floor(BASE_NOW.getTime() / 1000) - 10, tokenIssuedAt: Math.floor(BASE_NOW.getTime() / 1000) - 10, tokenExpiresAt: Math.floor(BASE_NOW.getTime() / 1000) + 3600 };
    if (token === 'inactive-firebase-token') return { uid: 'inactive-user', authTime: Math.floor(BASE_NOW.getTime() / 1000) - 10, tokenIssuedAt: Math.floor(BASE_NOW.getTime() / 1000) - 10, tokenExpiresAt: Math.floor(BASE_NOW.getTime() / 1000) + 3600 };
    throw new Error('Firebase identity rejected');
  };
  const issuer = createGousiyaApprovalIssuer({
    projectId: PROJECT_ID, registryFilePath, auditFilePath, signingSecret,
    authenticateFirebaseIdentity, now: () => new Date(BASE_NOW),
  });
  const verifier = createGousiyaApprovalTokenVerifier({
    projectId: PROJECT_ID, signingSecret, now: () => new Date(BASE_NOW),
  });
  return { root, registryFilePath, auditFilePath, issuer, verifier };
}

function approvalRequest(firebaseIdToken: string, role: 'system-owner' | 'independent-reviewer' = 'system-owner') {
  return {
    firebaseIdToken, role, decision: 'APPROVE' as const,
    ...SCOPE, reason: 'Controlled emergency recovery rehearsal',
  };
}

test('issues a scoped server-signed approval only for an active registry role', async () => {
  const ctx = await setup();
  try {
    const issued = await ctx.issuer.issueApproval(approvalRequest('owner-firebase-token'));
    const verified = await ctx.verifier(issued.token, { ...SCOPE, requestedAt: BASE_NOW.toISOString() });
    assert.equal(verified.subject, 'owner-user');
    assert.equal(verified.role, 'system-owner');
    assert.equal(verified.decision, 'APPROVE');
    assert.equal(verified.approvalId, issued.approvalId);
    assert.equal(verified.incidentId, SCOPE.incidentId);
    const events = await readVerifiedAuditLog(ctx.auditFilePath);
    assert.ok(events.some(event => event.eventType === 'GOUSIYA_APPROVAL_ISSUED' && event.actorId === 'owner-user'));
    assert.equal((await readFile(ctx.auditFilePath, 'utf8')).includes(issued.token), false);
  } finally {
    await rm(ctx.root, { recursive: true, force: true });
  }
});

test('uses the trusted server registry rather than client-selected roles', async () => {
  const ctx = await setup([{ uid: 'owner-user', active: true, roles: ['independent-reviewer'] }]);
  try {
    await assert.rejects(ctx.issuer.issueApproval(approvalRequest('owner-firebase-token', 'system-owner')), /not an active approver/i);
    const events = await readVerifiedAuditLog(ctx.auditFilePath);
    assert.ok(events.some(event => event.eventType === 'GOUSIYA_APPROVAL_ISSUANCE_DENIED'));
  } finally {
    await rm(ctx.root, { recursive: true, force: true });
  }
});

test('rejects inactive and unknown Firebase users', async () => {
  const ctx = await setup();
  try {
    await assert.rejects(ctx.issuer.issueApproval(approvalRequest('inactive-firebase-token')), /not an active approver/i);
    await assert.rejects(ctx.issuer.issueApproval(approvalRequest('unknown-token')), /Firebase identity rejected/i);
  } finally {
    await rm(ctx.root, { recursive: true, force: true });
  }
});

test('rejects tampered approval tokens and mismatched incident or paths', async () => {
  const ctx = await setup();
  try {
    const issued = await ctx.issuer.issueApproval(approvalRequest('owner-firebase-token'));
    const parts = issued.token.split('.');
    const tampered = parts[0] + '.' + Buffer.from(JSON.stringify({ sub: 'attacker' })).toString('base64url') + '.' + parts[2];
    await assert.rejects(ctx.verifier(tampered, { ...SCOPE, requestedAt: BASE_NOW.toISOString() }), /signature verification failed/i);
    await assert.rejects(ctx.verifier(issued.token, { ...SCOPE, incidentId: 'different-incident', requestedAt: BASE_NOW.toISOString() }), /does not match the requested incident scope/i);
    await assert.rejects(ctx.verifier(issued.token, { ...SCOPE, stagingRoot: '/tmp/other-staging', requestedAt: BASE_NOW.toISOString() }), /does not match the requested incident scope/i);
  } finally {
    await rm(ctx.root, { recursive: true, force: true });
  }
});

test('rejects an approval token signed by a different secret or project', async () => {
  const ctx = await setup();
  try {
    const issued = await ctx.issuer.issueApproval(approvalRequest('owner-firebase-token'));
    const wrongSecret = createGousiyaApprovalTokenVerifier({
      projectId: PROJECT_ID, signingSecret: 'different-secret-material-at-least-32-bytes', now: () => new Date(BASE_NOW),
    });
    const wrongProject = createGousiyaApprovalTokenVerifier({
      projectId: 'different-project', signingSecret: SIGNING_SECRET, now: () => new Date(BASE_NOW),
    });
    await assert.rejects(wrongSecret(issued.token, { ...SCOPE, requestedAt: BASE_NOW.toISOString() }), /signature verification failed/i);
    await assert.rejects(wrongProject(issued.token, { ...SCOPE, requestedAt: BASE_NOW.toISOString() }), /invalid issuer, audience, or time claims/i);
  } finally {
    await rm(ctx.root, { recursive: true, force: true });
  }
});

test('expired approvals and excessive approval TTLs are rejected', async () => {
  const ctx = await setup();
  try {
    const issued = await ctx.issuer.issueApproval({ ...approvalRequest('owner-firebase-token'), ttlMs: 1000 });
    const expiredVerifier = createGousiyaApprovalTokenVerifier({
      projectId: PROJECT_ID, signingSecret: SIGNING_SECRET, now: () => new Date(BASE_NOW.getTime() + 2000),
    });
    await assert.rejects(expiredVerifier(issued.token, { ...SCOPE, requestedAt: BASE_NOW.toISOString() }), /expired or has invalid/i);
    await assert.rejects(ctx.issuer.issueApproval({ ...approvalRequest('owner-firebase-token'), ttlMs: GOUSIYA_APPROVAL_MAX_TTL_MS + 1 }), /TTL must be between/i);
  } finally {
    await rm(ctx.root, { recursive: true, force: true });
  }
});

test('rejects a registry with overly broad filesystem permissions', async () => {
  const ctx = await setup();
  try {
    await chmod(ctx.registryFilePath, 0o644);
    await assert.rejects(ctx.issuer.issueApproval(approvalRequest('owner-firebase-token')), /permissions must be owner-only/i);
  } finally {
    await rm(ctx.root, { recursive: true, force: true });
  }
});

test('does not return an approval when durable audit storage is unavailable', async () => {
  const ctx = await setup();
  try {
    await mkdir(join(ctx.root, 'audit'), { recursive: true });
    await writeFile(ctx.auditFilePath, 'tampered audit\n', { mode: 0o600 });
    await assert.rejects(ctx.issuer.issueApproval(approvalRequest('owner-firebase-token')), /Audit log integrity verification failed|Audit log is malformed/i);
  } finally {
    await rm(ctx.root, { recursive: true, force: true });
  }
});
