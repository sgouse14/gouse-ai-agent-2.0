import test from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import {
  createSaqlainWebsiteDiagnosticsHandler,
  type SaqlainWebsiteDiagnosticsRouteOptions,
} from './saqlainWebsiteDiagnosticsRoutes.ts';
import type { WebsiteDiagnosticReport } from './saqlainWebsiteDiagnostics.ts';
import type { AuditEventInput } from './saqlainAuditLog.ts';

const report: WebsiteDiagnosticReport = {
  status: 'ISSUES_FOUND',
  checkedAt: '2026-10-24T06:00:00.000Z',
  origin: 'https://example.com',
  requestedPath: '/',
  resourcesChecked: 2,
  resourceLimit: 20,
  scope: 'submitted page and same-origin links/assets only',
  findings: [{
    code: 'BROKEN_INTERNAL_RESOURCE',
    severity: 'high',
    title: 'Internal link or resource is missing',
    location: '/missing',
    evidence: 'HEAD returned HTTP 404.',
    recommendation: 'Restore the resource or correct its link.',
  }],
  notes: ['Read-only scan.'],
};

function requestWith(body: unknown, uid = 'firebase-user-1', projectId = 'project-1'): Request {
  return {
    body,
    saqlainIdentity: uid ? { uid } : undefined,
    saqlainProjectId: projectId || undefined,
  } as unknown as Request;
}

function responseWith() {
  const state: { status: number; body: unknown } = { status: 200, body: undefined };
  let res: Response;
  res = {
    status(code: number) { state.status = code; return res; },
    json(body: unknown) { state.body = body; return res; },
  } as unknown as Response;
  return { res, state };
}

async function invoke(
  options: SaqlainWebsiteDiagnosticsRouteOptions,
  body: unknown = { url: 'https://example.com/' },
  uid = 'firebase-user-1',
  projectId = 'project-1',
) {
  const handler = createSaqlainWebsiteDiagnosticsHandler(options);
  const { res, state } = responseWith();
  await handler(requestWith(body, uid, projectId), res, () => undefined);
  return state;
}

function baseOptions(overrides: Partial<SaqlainWebsiteDiagnosticsRouteOptions> = {}) {
  const audit: AuditEventInput[] = [];
  let diagnoseCalls = 0;
  const options: SaqlainWebsiteDiagnosticsRouteOptions = {
    getAllowedHostsJson: () => JSON.stringify({ 'project-1': ['example.com', 'www.example.com'] }),
    getAuditFilePath: () => '/tmp/saqlain-audit.jsonl',
    getAuditMode: () => 'file',
    writeAuditEvent: async (_path, event) => { audit.push(event); },
    diagnose: async () => { diagnoseCalls += 1; return report; },
    now: () => new Date('2026-10-24T06:00:00.000Z'),
    ...overrides,
  };
  return { options, audit, getDiagnoseCalls: () => diagnoseCalls };
}

test('website diagnostics requires authenticated project identity', async () => {
  const context = baseOptions();
  const missingIdentity = await invoke(context.options, { url: 'https://example.com/' }, '');
  assert.equal(missingIdentity.status, 401);
  const missingProject = await invoke(context.options, { url: 'https://example.com/' }, 'firebase-user-1', '');
  assert.equal(missingProject.status, 401);
  assert.equal(context.getDiagnoseCalls(), 0);
});

test('website diagnostics scans only an allowlisted host and audits request and result', async () => {
  const context = baseOptions();
  const result = await invoke(context.options);
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, report);
  assert.equal(context.getDiagnoseCalls(), 1);
  assert.deepEqual(context.audit.map(event => event.eventType), [
    'SAQLAIN_WEBSITE_DIAGNOSTICS_REQUESTED',
    'SAQLAIN_WEBSITE_DIAGNOSTICS_COMPLETED',
  ]);
  assert.equal(context.audit[0].outcome, 'ALLOW');
  assert.equal(context.audit[0].actorId, 'firebase-user-1');
  assert.equal(context.audit[0].details?.targetHost, 'example.com');
  assert.equal(context.audit[1].details?.findingsCount, 1);
});

test('website diagnostics denies a host that is not allowlisted for the project', async () => {
  const context = baseOptions();
  const result = await invoke(context.options, { url: 'https://other.example/' });
  assert.equal(result.status, 403);
  assert.equal(context.getDiagnoseCalls(), 0);
  assert.equal(context.audit.length, 1);
  assert.equal(context.audit[0].outcome, 'DENY');
  assert.equal(context.audit[0].details?.reason, 'HOST_NOT_ALLOWLISTED_FOR_PROJECT');
});

test('website diagnostics fails closed when allowlist is missing or malformed', async () => {
  for (const config of [undefined, 'not-json', JSON.stringify({ 'project-1': ['*.example.com'] })]) {
    const context = baseOptions({ getAllowedHostsJson: () => config });
    const result = await invoke(context.options);
    assert.equal(result.status, 503);
    assert.equal(context.getDiagnoseCalls(), 0);
    assert.equal(context.audit[0].outcome, 'HOLD');
  }
});

test('unsafe URL query parameters are rejected and audited before scanning', async () => {
  const context = baseOptions();
  const result = await invoke(context.options, { url: 'https://example.com/?token=secret' });
  assert.equal(result.status, 400);
  assert.equal(context.getDiagnoseCalls(), 0);
  assert.equal(context.audit[0].outcome, 'DENY');
  assert.equal(JSON.stringify(context.audit).includes('secret'), false);
});

test('website diagnostic does not return a report when audit persistence fails', async () => {
  const context = baseOptions({ writeAuditEvent: async () => { throw new Error('disk/Firestore unavailable'); } });
  const result = await invoke(context.options);
  assert.equal(result.status, 503);
  assert.equal(context.getDiagnoseCalls(), 0);
});

test('website diagnostic failure is held and audited without leaking target response details', async () => {
  const context = baseOptions({ diagnose: async () => { throw new Error('secret server response detail'); } });
  const result = await invoke(context.options);
  assert.equal(result.status, 502);
  assert.deepEqual(result.body, { error: 'Website diagnostic could not be completed.' });
  assert.equal(context.audit.at(-1)?.outcome, 'HOLD');
  assert.equal(JSON.stringify(result.body).includes('secret server response detail'), false);
});

test('Firestore audit backend may be used without a local audit-file path', async () => {
  const context = baseOptions({
    getAuditMode: () => 'firestore',
    getAuditFilePath: () => undefined,
  });
  const result = await invoke(context.options);
  assert.equal(result.status, 200);
});
