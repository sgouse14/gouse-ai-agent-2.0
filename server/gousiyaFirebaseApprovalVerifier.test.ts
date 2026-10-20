import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign as signRs256 } from 'node:crypto';
import {
  createFirebaseGousiyaApprovalVerifier,
  createFirebaseIdentityTokenAuthenticator,
  createFirebaseRestTokenActivityChecker,
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


test('Firebase REST checker accepts an active account with matching UID and validSince', async () => {
  const checker = createFirebaseRestTokenActivityChecker({
    apiKey: 'restricted-test-api-key',
    fetchAccountInfo: async () => ({
      users: [{ localId: 'owner-user-123', disabled: false, validSince: String(NOW_SECONDS - 20) }],
    }),
  });
  await checker(makeToken());
});

test('Firebase REST checker rejects disabled accounts', async () => {
  const checker = createFirebaseRestTokenActivityChecker({
    apiKey: 'restricted-test-api-key',
    fetchAccountInfo: async () => ({
      users: [{ localId: 'owner-user-123', disabled: true, validSince: String(NOW_SECONDS - 20) }],
    }),
  });
  await assert.rejects(checker(makeToken()), /disabled, missing, or not verifiable/i);
});

test('Firebase REST checker rejects tokens issued before the revocation boundary', async () => {
  const checker = createFirebaseRestTokenActivityChecker({
    apiKey: 'restricted-test-api-key',
    fetchAccountInfo: async () => ({
      users: [{ localId: 'owner-user-123', disabled: false, validSince: String(NOW_SECONDS) }],
    }),
  });
  await assert.rejects(checker(makeToken()), /revoked or account-status data is invalid/i);
});

test('Firebase REST checker rejects a different UID and malformed account responses', async () => {
  const mismatch = createFirebaseRestTokenActivityChecker({
    apiKey: 'restricted-test-api-key',
    fetchAccountInfo: async () => ({
      users: [{ localId: 'other-user', disabled: false, validSince: String(NOW_SECONDS - 20) }],
    }),
  });
  await assert.rejects(mismatch(makeToken()), /disabled, missing, or not verifiable/i);

  const malformed = createFirebaseRestTokenActivityChecker({
    apiKey: 'restricted-test-api-key',
    fetchAccountInfo: async () => ({ users: [] }),
  });
  await assert.rejects(malformed(makeToken()), /response is invalid/i);
});

test('Firebase REST checker fails closed when Identity Toolkit lookup fails', async () => {
  const checker = createFirebaseRestTokenActivityChecker({
    apiKey: 'restricted-test-api-key',
    fetchAccountInfo: async () => { throw new Error('simulated lookup outage'); },
  });
  await assert.rejects(checker(makeToken()), /simulated lookup outage/i);
});

test('Firebase REST checker requires an API key', () => {
  assert.throws(() => createFirebaseRestTokenActivityChecker({ apiKey: '' }), /Web API key is required/i);
});


test('authenticates a Firebase identity independently of approval-role claims', async () => {
  let statusChecked = 0;
  const authenticate = createFirebaseIdentityTokenAuthenticator({
    projectId: 'test-firebase-project',
    now: () => new Date(TEST_NOW),
    fetchCertificates: async () => ({
      certificates: { 'test-key-1': publicKeyPem },
      cacheMaxAgeSeconds: 3600,
    }),
    verifyFirebaseTokenIsActive: async () => { statusChecked += 1; },
  });
  const identity = await authenticate(makeToken());
  assert.equal(identity.uid, 'owner-user-123');
  assert.equal(identity.authTime, NOW_SECONDS - 10);
  assert.equal(statusChecked, 1);
});

test('rejects invalid Firebase identity signatures and failed account-status checks', async () => {
  const signatureVerifier = createFirebaseIdentityTokenAuthenticator({
    projectId: 'test-firebase-project',
    now: () => new Date(TEST_NOW),
    fetchCertificates: async () => ({
      certificates: { 'test-key-1': publicKeyPem },
      cacheMaxAgeSeconds: 3600,
    }),
    verifyFirebaseTokenIsActive: async () => undefined,
  });
  const valid = makeToken();
  const parts = valid.split('.');
  await assert.rejects(
    signatureVerifier(parts[0] + '.' + parts[1] + '.' + Buffer.from('forged').toString('base64url'),),
    /signature verification failed/i,
  );

  const revokedVerifier = createFirebaseIdentityTokenAuthenticator({
    projectId: 'test-firebase-project',
    now: () => new Date(TEST_NOW),
    fetchCertificates: async () => ({
      certificates: { 'test-key-1': publicKeyPem },
      cacheMaxAgeSeconds: 3600,
    }),
    verifyFirebaseTokenIsActive: async () => { throw new Error('account disabled'); },
  });
  await assert.rejects(revokedVerifier(valid), /account disabled/i);
});
