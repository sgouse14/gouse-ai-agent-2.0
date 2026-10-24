import test from 'node:test';
import assert from 'node:assert/strict';
import { createApplicationApiAuthorizer, checkApplicationIpRateLimit } from './applicationSecurity.ts';
import type { FirebaseVerifiedIdentity } from './gousiyaFirebaseApprovalVerifier.ts';

const nowMs = Date.parse('2026-10-23T10:00:00.000Z');
const identity: FirebaseVerifiedIdentity = {
  uid: 'firebase-user-1',
  authTime: Math.floor(nowMs / 1000) - 60,
  tokenIssuedAt: Math.floor(nowMs / 1000) - 60,
  tokenExpiresAt: Math.floor(nowMs / 1000) + 3600,
};
const token = 'valid-test-token-with-more-than-twenty-characters';
function authorizer(memberships?: string) {
  return createApplicationApiAuthorizer({
    now: () => nowMs,
    getProjectMembershipsJson: () => memberships,
    authenticateToken: async value => {
      assert.equal(value, token);
      return identity;
    },
  });
}
const base = {
  method: 'POST',
  path: '/api/chat',
  authorization: 'Bearer ' + token,
  projectIdHeader: 'proj-01',
  ipAddress: 'application-guard-test-ip',
};

test('public health and separately secured Saqlain routes use their own auth boundary', async () => {
  const auth = authorizer();
  assert.equal((await auth({ method: 'GET', path: '/api/health' })).allowed, true);
  assert.equal((await auth({ method: 'GET', path: '/api/security/heartbeats' })).allowed, true);
});
test('private API routes reject missing or malformed bearer tokens', async () => {
  const auth = authorizer();
  assert.equal((await auth({ method: 'POST', path: '/api/chat' })).status, 401);
  assert.equal((await auth({ ...base, authorization: 'Basic abc' })).status, 401);
});
test('project-scoped API requires a project identifier', async () => {
  assert.equal((await authorizer('{"firebase-user-1":["proj-01"]}')({ ...base, projectIdHeader: undefined })).status, 400);
});
test('project-scoped API denies a project not granted to the verified UID', async () => {
  assert.equal((await authorizer('{"firebase-user-1":["proj-02"]}')(base)).status, 403);
});
test('project-scoped API permits only a server-provisioned UID/project pair', async () => {
  const result = await authorizer('{"firebase-user-1":["proj-01"]}')(base);
  assert.equal(result.allowed, true);
  assert.equal(result.identity?.uid, 'firebase-user-1');
  assert.equal(result.projectId, 'proj-01');
});
test('project authorization fails closed for missing or malformed registry configuration', async () => {
  assert.equal((await authorizer()(base)).status, 503);
  assert.equal((await authorizer('not-json')(base)).status, 503);
});
test('conflicting project identifiers are rejected', async () => {
  assert.equal((await authorizer('{"firebase-user-1":["proj-01","proj-02"]}')({ ...base, body: { projectId: 'proj-02' } })).status, 400);
});
test('provider-backed APIs enforce a lower per-user request limit', async () => {
  const auth = authorizer();
  let result;
  for (let i = 0; i < 21; i++) {
    result = await auth({ method: 'POST', path: '/api/search/professionals', authorization: 'Bearer ' + token, ipAddress: 'provider-limit-client-' + i });
  }
  assert.equal(result?.status, 429);
});
test('IP rate limit applies to protected APIs but permits health probes', () => {
  assert.equal(checkApplicationIpRateLimit('/api/health', 'GET', 'health-probe', nowMs).allowed, true);
  const ip = 'ip-rate-test-unique';
  for (let i = 0; i < 120; i++) assert.equal(checkApplicationIpRateLimit('/api/security/gatekeeper', 'POST', ip, nowMs).allowed, true);
  assert.equal(checkApplicationIpRateLimit('/api/security/gatekeeper', 'POST', ip, nowMs).allowed, false);
});


test('website diagnostics is project-scoped and denies unprovisioned project membership', async () => {
  const noProject = await authorizer('{"firebase-user-1":["proj-01"]}')({
    ...base,
    path: '/api/website/diagnostics',
    projectIdHeader: undefined,
  });
  assert.equal(noProject.status, 400);

  const wrongProject = await authorizer('{"firebase-user-1":["proj-02"]}')({
    ...base,
    path: '/api/website/diagnostics',
  });
  assert.equal(wrongProject.status, 403);

  const approved = await authorizer('{"firebase-user-1":["proj-01"]}')({
    ...base,
    path: '/api/website/diagnostics',
  });
  assert.equal(approved.allowed, true);
  assert.equal(approved.projectId, 'proj-01');
});
