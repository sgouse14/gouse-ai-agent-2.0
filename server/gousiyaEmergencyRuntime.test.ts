import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { createConfiguredGousiyaEmergencyState } from './gousiyaEmergencyRuntime.ts';

test('constructs internal recovery state from explicit server environment configuration', () => {
  const state = createConfiguredGousiyaEmergencyState({
    FIREBASE_PROJECT_ID: 'trusted-project-123',
    GOUSIYA_AUDIT_FILE_PATH: '/var/lib/gouse/audit/events.jsonl',
    GOUSIYA_GRANT_STORE_FILE_PATH: '/var/lib/gouse/gousiya/grants.json',
  });
  assert.equal(state.auditFilePath, resolve('/var/lib/gouse/audit/events.jsonl'));
  assert.equal(state.grantStoreFilePath, resolve('/var/lib/gouse/gousiya/grants.json'));
  assert.equal(typeof state.verifyApprovalToken, 'function');
  assert.equal(state.grants.size, 0);
});

test('fails closed when any required server configuration is missing', () => {
  assert.throws(() => createConfiguredGousiyaEmergencyState({
    GOUSIYA_AUDIT_FILE_PATH: '/tmp/audit/events.jsonl',
    GOUSIYA_GRANT_STORE_FILE_PATH: '/tmp/grants.json',
  }), /FIREBASE_PROJECT_ID/);
  assert.throws(() => createConfiguredGousiyaEmergencyState({
    FIREBASE_PROJECT_ID: 'trusted-project-123',
    GOUSIYA_GRANT_STORE_FILE_PATH: '/tmp/grants.json',
  }), /GOUSIYA_AUDIT_FILE_PATH/);
  assert.throws(() => createConfiguredGousiyaEmergencyState({
    FIREBASE_PROJECT_ID: 'trusted-project-123',
    GOUSIYA_AUDIT_FILE_PATH: '/tmp/audit/events.jsonl',
  }), /GOUSIYA_GRANT_STORE_FILE_PATH/);
});
