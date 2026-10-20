import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign as signRs256 } from 'node:crypto';
import {
  createFirebaseGousiyaApprovalVerifier,
  createFirebaseAdminTokenActivityChecker,
} from './gousiyaFirebaseApprovalVerifier.ts';
import type { GousiyaApprovalScope } from './gousiyaEmergencyRecovery.ts';

const TEST_NOW = new Date('2026-10-20T12:00:00.000Z');
const NOW_SECONDS = Math.floor(TEST_NOW.getTime() / 1000);
const scope: GousiyaApprovalScope = {
  incidentId: 'incident-test-01',
  recoveryAgentId: 'saq-recovery-agent',
  sourceSnapshotDirectory: '/test/source-snapshot',
  stagingRoot: '/test/staging',
  requestedAt: TEST_NOW.toISOString(),
};
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();

function makeToken(overrides: {
  header?: Record<string, unknown>;
  claims?: Record<string, unknown>;
} = {}): string {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: 'test-key-1',
    ...overrides.header,
  };
  const approval = {
    approvalId: 'approval-unique-01',
    role: 'system-owner',
    decision: 'APPROVE',
    incidentId: scope.incidentId,
    recoveryAgentId: scope.recoveryAgentId,
    sourceSnapshotDirectory: scope.sourceSnapshotDirectory,
    stagingRoot: scope.stagingRoot,
    issuedAt: new Date(TEST_NOW.getTime() - 10_000).toISOString(),
    expiresAt: new Date(TEST_NOW.getTime() + 120_000).toISOString(),
  };
  const claims = {
    aud: 'test-firebase-project',
    iss: 'https://securetoken.google.com/test-firebase-project',
    sub: 'owner-user-123',
    iat: NOW_SECONDS - 10,
    exp: NOW_SECONDS + 3600,
    auth_time: NOW_SECONDS - 10,
    gousiyaApproval: approval,
    ...overrides.claims,
  };
  const unsigned = [
    Buffer.from(JSON.stringify(header)).toString('base64url'),
    Buffer.from(JSON.stringify(claims)).toString('base64url'),
  ].join('.');
  return unsigned + '.' + signRs256('RSA-SHA256', Buffer.from(unsigned), privateKey).toString('base64url');
}

function makeVerifier() {
  let fetchCount = 0;
  const verifier = createFirebaseGousiyaApprovalVerifier({
    projectId: 'test-firebase-project',
    verifyFirebaseTokenIsActive: async () => undefined,
    now: () => new Date(TEST_NOW),
    fetchCertificates: async () => {
      fetchCount += 1;
      return {
        certificates: { 'test-key-1': publicKeyPem },
        cacheMaxAgeSeconds: 3600,
      };
    },
  });
  return { verifier, fetchCount: () => fetchCount };
}

test('verifies Firebase signature and returns an approval scoped to the incident', async () => {
  const { verifier } = makeVerifier();
  const result = await verifier(makeToken(), scope);
  assert.equal(result.subject, 'owner-user-123');
  assert.equal(result.role, 'system-owner');
  assert.equal(result.decision, 'APPROVE');
  assert.equal(result.approvalId, 'approval-unique-01');
  assert.equal(result.incidentId, scope.incidentId);
  assert.equal(result.sourceSnapshotDirectory, scope.sourceSnapshotDirectory);
});

test('rejects an invalid signature', async () => {
  const { verifier } = makeVerifier();
  const token = makeToken();
  const parts = token.split('.');
  const tamperedClaims = Buffer.from(JSON.stringify({
    aud: 'another-project',
    iss: 'https://securetoken.google.com/test-firebase-project',
    sub: 'owner-user-123',
    iat: NOW_SECONDS - 10,
    exp: NOW_SECONDS + 3600,
    auth_time: NOW_SECONDS - 10,
    gousiyaApproval: {},
  })).toString('base64url');
  await assert.rejects(verifier(parts[0] + '.' + tamperedClaims + '.' + parts[2], scope), /signature verification failed/i);
});

test('rejects a wrong Firebase audience or issuer', async () => {
  const { verifier } = makeVerifier();
  await assert.rejects(verifier(makeToken({ claims: { aud: 'other-project' } }), scope), /claims are invalid/i);
  await assert.rejects(verifier(makeToken({ claims: { iss: 'https://attacker.invalid' } }), scope), /claims are invalid/i);
});

test('rejects expired tokens and stale authentication', async () => {
  const { verifier } = makeVerifier();
  await assert.rejects(verifier(makeToken({ claims: { exp: NOW_SECONDS - 1 } }), scope), /claims are invalid/i);
  await assert.rejects(verifier(makeToken({ claims: { auth_time: NOW_SECONDS - 400 } }), scope), /claims are invalid/i);
});

test('rejects approval tokens for another incident or staging path', async () => {
  const { verifier } = makeVerifier();
  await assert.rejects(
    verifier(makeToken({ claims: { gousiyaApproval: {
      approvalId: 'approval-unique-02',
      role: 'system-owner',
      decision: 'APPROVE',
      incidentId: 'different-incident',
      recoveryAgentId: scope.recoveryAgentId,
      sourceSnapshotDirectory: scope.sourceSnapshotDirectory,
      stagingRoot: scope.stagingRoot,
      issuedAt: new Date(TEST_NOW.getTime() - 10_000).toISOString(),
      expiresAt: new Date(TEST_NOW.getTime() + 120_000).toISOString(),
    } } }), scope),
    /does not match the requested incident scope/i,
  );
});

test('rejects an invalid JWT algorithm and unknown signing key', async () => {
  const { verifier } = makeVerifier();
  await assert.rejects(verifier(makeToken({ header: { alg: 'none' } }), scope), /header is not accepted/i);
  await assert.rejects(verifier(makeToken({ header: { kid: 'unknown-key' } }), scope), /signing key is unknown/i);
});

test('caches Google signing certificates until their cache lifetime expires', async () => {
  const { verifier, fetchCount } = makeVerifier();
  await verifier(makeToken(), scope);
  await verifier(makeToken({ claims: { gousiyaApproval: {
    approvalId: 'approval-unique-02',
    role: 'system-owner',
    decision: 'APPROVE',
    incidentId: scope.incidentId,
    recoveryAgentId: scope.recoveryAgentId,
    sourceSnapshotDirectory: scope.sourceSnapshotDirectory,
    stagingRoot: scope.stagingRoot,
    issuedAt: new Date(TEST_NOW.getTime() - 10_000).toISOString(),
    expiresAt: new Date(TEST_NOW.getTime() + 120_000).toISOString(),
  } } }), scope);
  assert.equal(fetchCount(), 1);
});


test('rejects approval if the server-side account/revocation check fails', async () => {
  const verifier = createFirebaseGousiyaApprovalVerifier({
    projectId: 'test-firebase-project',
    now: () => new Date(TEST_NOW),
    fetchCertificates: async () => ({
      certificates: { 'test-key-1': publicKeyPem },
      cacheMaxAgeSeconds: 3600,
    }),
    verifyFirebaseTokenIsActive: async () => {
      throw new Error('simulated revoked or disabled account');
    },
  });
  await assert.rejects(verifier(makeToken(), scope), /revoked or disabled account/i);
});

test('requires a server-side account/revocation checker when constructing verifier', () => {
  assert.throws(() => createFirebaseGousiyaApprovalVerifier({
    projectId: 'test-firebase-project',
  } as Parameters<typeof createFirebaseGousiyaApprovalVerifier>[0]), /account-status and token-revocation checker is required/i);
});


test('Firebase Admin adapter always enables revocation checks', async () => {
  let observed: boolean | undefined;
  const check = createFirebaseAdminTokenActivityChecker({
    verifyIdToken: async (_token, checkRevoked) => {
      observed = checkRevoked;
      return { uid: 'owner-user-123' };
    },
  });
  await check('sample-id-token');
  assert.equal(observed, true);
});

test('Firebase Admin adapter fails closed when Admin rejects a revoked token', async () => {
  const check = createFirebaseAdminTokenActivityChecker({
    verifyIdToken: async (_token, checkRevoked) => {
      assert.equal(checkRevoked, true);
      throw new Error('auth/id-token-revoked');
    },
  });
  await assert.rejects(check('revoked-id-token'), /auth\/id-token-revoked/i);
});
