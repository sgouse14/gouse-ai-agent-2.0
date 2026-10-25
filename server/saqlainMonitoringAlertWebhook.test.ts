import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSaqlainMonitoringAlertWebhook,
  createSaqlainMonitoringAlertWebhookFromEnv,
  type SaqlainMonitoringAlertWebhookOptions,
} from './saqlainMonitoringAlertWebhook.ts';
import type { MonitoringAlertNotification } from './saqlainMonitoringRuntime.ts';

const notification: MonitoringAlertNotification = {
  cycleId: 'saqlain-monitor-cycle-001',
  idempotencyKey: 'saqlain-monitor-cycle-001',
  status: 'FAILED',
  alert: 'Saqlain monitoring alert: FAILED | failed=1',
  occurredAt: '2026-10-25T06:00:00.000Z',
};

function options(overrides: Partial<SaqlainMonitoringAlertWebhookOptions> = {}) {
  const received: Array<{ input: string; init?: RequestInit }> = [];
  const opts: SaqlainMonitoringAlertWebhookOptions = {
    url: 'https://alerts.example.com/v1/saqlain',
    bearerToken: 'test-bearer-token-which-is-long-enough',
    allowedHostnames: ['alerts.example.com'],
    fetchImpl: async (input, init) => {
      received.push({ input: String(input), init });
      return new Response(null, { status: 202 });
    },
    ...overrides,
  };
  return { opts, received };
}

test('webhook sends only a bounded fixed-schema alert with bearer auth and idempotency key', async () => {
  const ctx = options();
  const adapter = createSaqlainMonitoringAlertWebhook(ctx.opts);
  await adapter.notifyAlert(notification);
  assert.equal(ctx.received.length, 1);
  const request = ctx.received[0];
  assert.equal(request.input, 'https://alerts.example.com/v1/saqlain');
  assert.equal(request.init?.method, 'POST');
  assert.equal(request.init?.redirect, 'manual');
  const headers = new Headers(request.init?.headers);
  assert.equal(headers.get('authorization'), 'Bearer test-bearer-token-which-is-long-enough');
  assert.equal(headers.get('idempotency-key'), notification.cycleId);
  assert.equal(headers.get('content-type'), 'application/json');
  const body = JSON.parse(String(request.init?.body)) as Record<string, unknown>;
  assert.deepEqual(Object.keys(body).sort(), ['alert', 'cycleId', 'idempotencyKey', 'occurredAt', 'schemaVersion', 'status'].sort());
  assert.equal(body.cycleId, notification.cycleId);
  assert.equal(body.status, 'FAILED');
  assert.equal(JSON.stringify(body).includes('sourceRoot'), false);
});

test('webhook rejects URLs that are not exact allowlisted HTTPS hosts', () => {
  const invalid = [
    { url: 'http://alerts.example.com/v1/saqlain', allowedHostnames: ['alerts.example.com'] },
    { url: 'https://alerts.example.com:8443/v1/saqlain', allowedHostnames: ['alerts.example.com'] },
    { url: 'https://user:pass@alerts.example.com/v1/saqlain', allowedHostnames: ['alerts.example.com'] },
    { url: 'https://alerts.example.com/v1/saqlain?key=value', allowedHostnames: ['alerts.example.com'] },
    { url: 'https://alerts.example.com/v1/saqlain#fragment', allowedHostnames: ['alerts.example.com'] },
    { url: 'https://not-allowed.example.net/v1/saqlain', allowedHostnames: ['alerts.example.com'] },
    { url: 'https://127.0.0.1/v1/saqlain', allowedHostnames: ['127.0.0.1'] },
    { url: 'https://alerts.example.com./v1/saqlain', allowedHostnames: ['alerts.example.com'] },
  ];
  for (const item of invalid) {
    assert.throws(() => createSaqlainMonitoringAlertWebhook({
      url: item.url,
      bearerToken: 'test-bearer-token-which-is-long-enough',
      allowedHostnames: item.allowedHostnames,
    }));
  }
  assert.throws(() => createSaqlainMonitoringAlertWebhook({
    url: 'https://alerts.example.com/v1',
    bearerToken: 'test-bearer-token-which-is-long-enough',
    allowedHostnames: ['*.example.com'],
  }), /exact DNS hostnames/i);
});

test('webhook rejects payloads with invalid idempotency, status, timestamps, or excessive size', async () => {
  const ctx = options();
  const adapter = createSaqlainMonitoringAlertWebhook(ctx.opts);
  await assert.rejects(() => adapter.notifyAlert({ ...notification, idempotencyKey: 'other-cycle' }), /idempotency key/i);
  await assert.rejects(() => adapter.notifyAlert({ ...notification, status: 'UNKNOWN' as never }), /status is invalid/i);
  await assert.rejects(() => adapter.notifyAlert({ ...notification, occurredAt: 'not-a-date' }), /timestamp is invalid/i);
  await assert.rejects(() => adapter.notifyAlert({ ...notification, alert: 'x'.repeat(4001) }), /size limit/i);
  assert.equal(ctx.received.length, 0);
});

test('redirect and non-2xx responses are never treated as accepted delivery', async () => {
  let calls = 0;
  const redirect = createSaqlainMonitoringAlertWebhook({
    url: 'https://alerts.example.com/v1',
    bearerToken: 'test-bearer-token-which-is-long-enough',
    allowedHostnames: ['alerts.example.com'],
    fetchImpl: async () => {
      calls++;
      return new Response(null, { status: 302, headers: { Location: 'https://other.example.net/collect' } });
    },
  });
  await assert.rejects(() => redirect.notifyAlert(notification), /HTTP 302/i);
  assert.equal(calls, 1);
});

test('timeout aborts delivery and does not expose remote error details', async () => {
  const adapter = createSaqlainMonitoringAlertWebhook({
    url: 'https://alerts.example.com/v1',
    bearerToken: 'test-bearer-token-which-is-long-enough',
    allowedHostnames: ['alerts.example.com'],
    timeoutMs: 250,
    fetchImpl: async (_input, init) => await new Promise<Response>((_resolve, reject) => {
      const signal = init?.signal as AbortSignal;
      signal.addEventListener('abort', () => reject(new Error('sensitive upstream request URL')), { once: true });
    }),
  });
  await assert.rejects(() => adapter.notifyAlert(notification), /timed out/i);
});

test('environment configuration is opt-in and fails closed when partially configured', () => {
  assert.equal(createSaqlainMonitoringAlertWebhookFromEnv({}), undefined);
  const validEnv = {
    SAQLAIN_MONITORING_ALERT_WEBHOOK_URL: 'https://alerts.example.com/v1',
    SAQLAIN_MONITORING_ALERT_WEBHOOK_TOKEN: 'test-bearer-token-which-is-long-enough',
    SAQLAIN_MONITORING_ALERT_WEBHOOK_ALLOWED_HOSTS_JSON: '["alerts.example.com"]',
    SAQLAIN_MONITORING_ALERT_WEBHOOK_TIMEOUT_MS: '5000',
  };
  const configured = createSaqlainMonitoringAlertWebhookFromEnv(validEnv);
  assert.ok(configured);
  assert.throws(() => createSaqlainMonitoringAlertWebhookFromEnv({
    SAQLAIN_MONITORING_ALERT_WEBHOOK_URL: validEnv.SAQLAIN_MONITORING_ALERT_WEBHOOK_URL,
  }), /must be configured together/i);
  assert.throws(() => createSaqlainMonitoringAlertWebhookFromEnv({
    ...validEnv,
    SAQLAIN_MONITORING_ALERT_WEBHOOK_ALLOWED_HOSTS_JSON: '["*.example.com"]',
  }), /exact DNS hostnames/i);
  assert.throws(() => createSaqlainMonitoringAlertWebhookFromEnv({
    ...validEnv,
    SAQLAIN_MONITORING_ALERT_WEBHOOK_TIMEOUT_MS: '999999',
  }), /timeout/i);
});
