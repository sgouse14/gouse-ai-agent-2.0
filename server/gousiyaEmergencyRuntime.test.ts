import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { createConfiguredGousiyaEmergencyState } from './gousiyaEmergencyRuntime.ts';

const testEnv = {
  FIREBASE_PROJECT_ID: 'trusted-project-123',
  FIREBASE_WEB_API_KEY: 'restricted-test-web-key',
  GOUSIYA_AUDIT_FILE_PATH: '/var/lib/gouse/audit/events.jsonl',
  GOUSIYA_GRANT_STORE_FILE_PATH: '/var/lib/gouse/gousiya/grants.json',
};

test('constructs internal recovery state from explicit server configuration', () => {
  const state = createConfiguredGousiyaEmergencyState(testEnv);
  assert.equal(state.auditFilePath, resolve(testEnv.GOUSIYA_AUDIT_FILE_PATH));
  assert.equal(state.grantStoreFilePath, resolve(testEnv.GOUSIYA_GRANT_STORE_FILE_PATH));
  assert.equal(typeof state.verifyApprovalToken, 'function');
  assert.equal(state.grants.size, 0);
});

test('fails closed when any required server configuration is missing', () => {
  assert.throws(() => createConfiguredGousiyaEmergencyState({
    ...testEnv,
    FIREBASE_PROJECT_ID: '',
  }), /FIREBASE_PROJECT_ID/);
  assert.throws(() => createConfiguredGousiyaEmergencyState({
    ...testEnv,
    FIREBASE_WEB_API_KEY: '',
  }), /FIREBASE_WEB_API_KEY/);
  assert.throws(() => createConfiguredGousiyaEmergencyState({
    ...testEnv,
    GOUSIYA_AUDIT_FILE_PATH: '',
  }), /GOUSIYA_AUDIT_FILE_PATH/);
  assert.throws(() => createConfiguredGousiyaEmergencyState({
    ...testEnv,
    GOUSIYA_GRANT_STORE_FILE_PATH: '',
  }), /GOUSIYA_GRANT_STORE_FILE_PATH/);
});
