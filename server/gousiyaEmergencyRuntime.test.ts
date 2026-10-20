import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import {
  createConfiguredGousiyaApprovalIssuer,
  createConfiguredGousiyaEmergencyState,
} from './gousiyaEmergencyRuntime.ts';

const testEnv = {
  FIREBASE_PROJECT_ID: 'trusted-project-123',
  FIREBASE_WEB_API_KEY: 'restricted-test-web-key',
  GOUSIYA_APPROVAL_SIGNING_SECRET: '0123456789abcdef0123456789abcdef',
  GOUSIYA_APPROVER_REGISTRY_PATH: '/var/lib/gouse/gousiya/approvers.json',
  GOUSIYA_AUDIT_FILE_PATH: '/var/lib/gouse/audit/events.jsonl',
  GOUSIYA_GRANT_STORE_FILE_PATH: '/var/lib/gouse/gousiya/grants.json',
};

test('constructs recovery state using server-signed approval attestations', () => {
  const state = createConfiguredGousiyaEmergencyState(testEnv);
  assert.equal(state.auditFilePath, resolve(testEnv.GOUSIYA_AUDIT_FILE_PATH));
  assert.equal(state.grantStoreFilePath, resolve(testEnv.GOUSIYA_GRANT_STORE_FILE_PATH));
  assert.equal(typeof state.verifyApprovalToken, 'function');
  assert.equal(state.grants.size, 0);
});

test('constructs an internal approval issuer without mounting a public route', () => {
  const issuer = createConfiguredGousiyaApprovalIssuer(testEnv);
  assert.equal(typeof issuer.issueApproval, 'function');
});

test('fails closed when emergency state configuration is incomplete', () => {
  assert.throws(() => createConfiguredGousiyaEmergencyState({ ...testEnv, FIREBASE_PROJECT_ID: '' }), /FIREBASE_PROJECT_ID/);
  assert.throws(() => createConfiguredGousiyaEmergencyState({ ...testEnv, GOUSIYA_APPROVAL_SIGNING_SECRET: '' }), /GOUSIYA_APPROVAL_SIGNING_SECRET/);
  assert.throws(() => createConfiguredGousiyaEmergencyState({ ...testEnv, GOUSIYA_AUDIT_FILE_PATH: '' }), /GOUSIYA_AUDIT_FILE_PATH/);
  assert.throws(() => createConfiguredGousiyaEmergencyState({ ...testEnv, GOUSIYA_GRANT_STORE_FILE_PATH: '' }), /GOUSIYA_GRANT_STORE_FILE_PATH/);
});

test('fails closed when approval issuer configuration is incomplete', () => {
  assert.throws(() => createConfiguredGousiyaApprovalIssuer({ ...testEnv, FIREBASE_WEB_API_KEY: '' }), /FIREBASE_WEB_API_KEY/);
  assert.throws(() => createConfiguredGousiyaApprovalIssuer({ ...testEnv, GOUSIYA_APPROVER_REGISTRY_PATH: '' }), /GOUSIYA_APPROVER_REGISTRY_PATH/);
});
