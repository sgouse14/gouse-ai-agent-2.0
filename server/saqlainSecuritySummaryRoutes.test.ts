import test from 'node:test';
import assert from 'node:assert/strict';
import type { NextFunction, Request, Response } from 'express';
import {
  createSaqlainSecuritySummaryHandler,
  type SaqlainSecuritySummaryHandlerOptions,
} from './saqlainSecuritySummaryRoutes.ts';

function requestWith(authorization?: string, body: unknown = {}): Request {
  return {
    body,
    header(name: string) {
      return name.toLowerCase() === 'authorization' ? authorization : undefined;
    },
  } as unknown as Request;
}

function responseWith(onJson: () => void = () => {}) {
  const state: { status: number; body: unknown } = { status: 200, body: undefined };
  const response = {
    status(code: number) {
      state.status = code;
      return response;
    },
    json(body: unknown) {
      state.body = body;
      onJson();
      return response;
    },
  } as unknown as Response;
  return { response, state };
}

async function invoke(
  options: SaqlainSecuritySummaryHandlerOptions,
  authorization?: string,
  body: unknown = {},
  onJson?: () => void,
) {
  const handler = createSaqlainSecuritySummaryHandler(options);
  const { response, state } = responseWith(onJson);
  await handler(requestWith(authorization, body), response, (() => undefined) as NextFunction);
  return state;
}

const validToken = 'x'.repeat(40);
const fixedNow = () => new Date('2026-10-21T08:00:00.000Z');

test('security summary rejects missing or malformed bearer credentials', async () => {
  let authenticateCalls = 0;
  const options = {
    authenticateToken: async () => {
      authenticateCalls += 1;
      return { uid: 'operator-1' };
    },
    getAuditFilePath: () => '/tmp/saqlain-audit.jsonl',
    writeAuditEvent: async () => undefined,
  };

  const missing = await invoke(options);
  assert.equal(missing.status, 401);
  const malformed = await invoke(options, 'Basic abc');
  assert.equal(malformed.status, 401);
  const shortToken = await invoke(options, 'Bearer short');
  assert.equal(shortToken.status, 401);
  const whitespaceToken = await invoke(options, 'Bearer ' + validToken.slice(0, 12) + ' ' + validToken.slice(12));
  assert.equal(whitespaceToken.status, 401);
  assert.equal(authenticateCalls, 0);
});

test('security summary fails closed when Firebase identity configuration is missing', async () => {
  const oldProject = process.env.FIREBASE_PROJECT_ID;
  const oldApiKey = process.env.FIREBASE_WEB_API_KEY;
  delete process.env.FIREBASE_PROJECT_ID;
  delete process.env.FIREBASE_WEB_API_KEY;
  try {
    const result = await invoke({
      getAuditFilePath: () => '/tmp/saqlain-audit.jsonl',
      writeAuditEvent: async () => undefined,
    }, 'Bearer ' + validToken);
    assert.equal(result.status, 503);
  } finally {
    if (oldProject === undefined) delete process.env.FIREBASE_PROJECT_ID;
    else process.env.FIREBASE_PROJECT_ID = oldProject;
    if (oldApiKey === undefined) delete process.env.FIREBASE_WEB_API_KEY;
    else process.env.FIREBASE_WEB_API_KEY = oldApiKey;
  }
});

test('security summary denies invalid identity tokens without returning a report', async () => {
  const result = await invoke({
    authenticateToken: async () => { throw new Error('Firebase identity token is invalid.'); },
    getAuditFilePath: () => '/tmp/saqlain-audit.jsonl',
    writeAuditEvent: async () => undefined,
  }, 'Bearer ' + validToken);
  assert.equal(result.status, 401);
  assert.equal((result.body as { error: string }).error, 'A valid active Firebase identity is required.');
});

test('security summary requires audit storage before returning a report', async () => {
  const result = await invoke({
    authenticateToken: async () => ({ uid: 'operator-1' }),
    getAuditFilePath: () => undefined,
    writeAuditEvent: async () => undefined,
  }, 'Bearer ' + validToken);
  assert.equal(result.status, 503);
  assert.match((result.body as { error: string }).error, /audit storage is not configured/);
});

test('security summary durably audits the verified identity before returning the report', async () => {
  const calls: string[] = [];
  let auditInput: Record<string, unknown> | undefined;
  const result = await invoke({
    authenticateToken: async () => ({ uid: 'verified-firebase-uid' }),
    getAuditFilePath: () => '/tmp/saqlain-audit.jsonl',
    writeAuditEvent: async (path, event) => {
      calls.push('audit');
      assert.equal(path, '/tmp/saqlain-audit.jsonl');
      auditInput = event as unknown as Record<string, unknown>;
    },
    now: fixedNow,
  }, 'Bearer ' + validToken, { target: 'Workspace baseline' }, () => calls.push('response'));

  assert.equal(result.status, 200);
  assert.equal(calls.join(','), 'audit,response');
  assert.equal((result.body as { target: string }).target, 'Workspace baseline');
  assert.equal(auditInput?.eventType, 'SAQLAIN_SECURITY_SUMMARY_VIEWED');
  assert.equal(auditInput?.actorId, 'verified-firebase-uid');
  assert.equal(auditInput?.outcome, 'INFO');
  assert.equal(auditInput?.occurredAt, '2026-10-21T08:00:00.000Z');
});

test('security summary returns HOLD-like service-unavailable response if durable audit fails', async () => {
  const result = await invoke({
    authenticateToken: async () => ({ uid: 'verified-firebase-uid' }),
    getAuditFilePath: () => '/tmp/saqlain-audit.jsonl',
    writeAuditEvent: async () => { throw new Error('audit disk unavailable'); },
  }, 'Bearer ' + validToken);
  assert.equal(result.status, 503);
  assert.match((result.body as { error: string }).error, /no report was returned/);
});
