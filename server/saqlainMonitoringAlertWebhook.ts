import { isIP } from 'node:net';
import type { MonitoringAlertNotification } from './saqlainMonitoringRuntime.ts';

const DEFAULT_TIMEOUT_MS = 5_000;
const MIN_TIMEOUT_MS = 250;
const MAX_TIMEOUT_MS = 15_000;
const MAX_ALERT_LENGTH = 4_000;
const MAX_TOKEN_LENGTH = 4_096;
const HOST_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export interface SaqlainMonitoringAlertWebhookOptions {
  url: string;
  bearerToken: string;
  allowedHostnames: readonly string[];
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

function normalizeHostname(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Alert hostname allowlist must contain only exact hostnames.');
  const hostname = value.trim().toLowerCase();
  if (!hostname || hostname.length > 253 || hostname.includes('*') || hostname.endsWith('.') || isIP(hostname)) {
    throw new Error('Alert hostname allowlist must contain exact DNS hostnames, not wildcards or IP addresses.');
  }
  const labels = hostname.split('.');
  if (labels.length < 2 || labels.some(label => label.length > 63 || !HOST_LABEL.test(label))) {
    throw new Error('Alert hostname allowlist contains an invalid DNS hostname.');
  }
  return hostname;
}

function validateUrl(rawUrl: string, allowedHostnames: readonly string[]): URL {
  if (typeof rawUrl !== 'string' || !rawUrl.trim() || rawUrl.length > 2048) {
    throw new Error('Monitoring alert webhook URL is required and must be at most 2048 characters.');
  }
  let url: URL;
  try { url = new URL(rawUrl); }
  catch { throw new Error('Monitoring alert webhook URL must be an absolute HTTPS URL.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
      (url.port && url.port !== '443')) {
    throw new Error('Monitoring alert webhook URL must use HTTPS without credentials, query, fragment, or a custom port.');
  }
  const hostname = normalizeHostname(url.hostname);
  if (!allowedHostnames.includes(hostname)) {
    throw new Error('Monitoring alert webhook hostname is not in the exact configured allowlist.');
  }
  return url;
}

function validateNotification(notification: MonitoringAlertNotification): void {
  if (!notification || typeof notification !== 'object') throw new Error('A monitoring alert notification is required.');
  if (typeof notification.cycleId !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(notification.cycleId)) {
    throw new Error('Monitoring alert cycle ID is invalid.');
  }
  if (notification.idempotencyKey !== notification.cycleId) {
    throw new Error('Monitoring alert idempotency key must match its cycle ID.');
  }
  if (!['WARNING', 'HOLD', 'FAILED', 'HEALTHY'].includes(notification.status)) {
    throw new Error('Monitoring alert status is invalid.');
  }
  if (typeof notification.alert !== 'string' || !notification.alert.trim() || notification.alert.length > MAX_ALERT_LENGTH) {
    throw new Error('Monitoring alert message must be non-empty and within its size limit.');
  }
  if (typeof notification.occurredAt !== 'string' || notification.occurredAt.length > 40 ||
      !Number.isFinite(Date.parse(notification.occurredAt))) {
    throw new Error('Monitoring alert timestamp is invalid.');
  }
}

/**
 * Off-host alert delivery adapter for an operator-configured webhook.
 * It sends a bounded, fixed-schema alert only; it does not send snapshots,
 * source paths, credentials, or raw collector exceptions. The receiver should
 * deduplicate the Idempotency-Key header. No automatic retry is performed.
 */
export function createSaqlainMonitoringAlertWebhook(options: SaqlainMonitoringAlertWebhookOptions) {
  if (!options || !Array.isArray(options.allowedHostnames) ||
      options.allowedHostnames.length < 1 || options.allowedHostnames.length > 100) {
    throw new Error('An exact non-empty monitoring alert hostname allowlist is required.');
  }
  const allowedHostnames = Object.freeze([...new Set(options.allowedHostnames.map(normalizeHostname))]);
  const url = validateUrl(options.url, allowedHostnames);
  if (typeof options.bearerToken !== 'string' ||
      options.bearerToken.length < 16 || options.bearerToken.length > MAX_TOKEN_LENGTH ||
      !/^[\x21-\x7e]+$/.test(options.bearerToken)) {
    throw new Error('Monitoring alert bearer token must be 16–4096 visible non-space ASCII characters.');
  }
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < MIN_TIMEOUT_MS || timeoutMs > MAX_TIMEOUT_MS) {
    throw new Error('Monitoring alert timeout must be an integer between 250 and 15000 milliseconds.');
  }
  const fetchImpl = options.fetchImpl ?? fetch;

  async function notifyAlert(notification: MonitoringAlertNotification): Promise<void> {
    validateNotification(notification);
    const body = JSON.stringify({
      schemaVersion: 1,
      cycleId: notification.cycleId,
      idempotencyKey: notification.idempotencyKey,
      status: notification.status,
      alert: notification.alert,
      occurredAt: notification.occurredAt,
    });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;
    try {
      response = await fetchImpl(url.toString(), {
        method: 'POST',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'Authorization': 'Bearer ' + options.bearerToken,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Idempotency-Key': notification.idempotencyKey,
        },
        body,
      });
    } catch {
      throw new Error(controller.signal.aborted
        ? 'Monitoring alert webhook request timed out.'
        : 'Monitoring alert webhook request failed due to a network error.');
    } finally {
      clearTimeout(timeout);
    }
    if (response.status < 200 || response.status >= 300) {
      const status = response.status;
      await response.body?.cancel().catch(() => undefined);
      throw new Error('Monitoring alert webhook returned HTTP ' + status + '; delivery is unconfirmed.');
    }
    await response.body?.cancel().catch(() => undefined);
  }

  return Object.freeze({ notifyAlert, hostname: url.hostname, timeoutMs });
}

export function createSaqlainMonitoringAlertWebhookFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): ReturnType<typeof createSaqlainMonitoringAlertWebhook> | undefined {
  const rawUrl = env.SAQLAIN_MONITORING_ALERT_WEBHOOK_URL?.trim() ?? '';
  const rawToken = env.SAQLAIN_MONITORING_ALERT_WEBHOOK_TOKEN?.trim() ?? '';
  const rawAllowlist = env.SAQLAIN_MONITORING_ALERT_WEBHOOK_ALLOWED_HOSTS_JSON?.trim() ?? '';
  const rawTimeout = env.SAQLAIN_MONITORING_ALERT_WEBHOOK_TIMEOUT_MS?.trim() ?? '';
  // An optional timeout value alone does not enable delivery; this lets the
  // documented default timeout coexist with blank URL/token/allowlist settings.
  if (!rawUrl && !rawToken && !rawAllowlist) return undefined;
  if (!rawUrl || !rawToken || !rawAllowlist) {
    throw new Error('Monitoring alert webhook URL, token, and hostname allowlist must be configured together.');
  }
  let allowedHostnames: unknown;
  try { allowedHostnames = JSON.parse(rawAllowlist) as unknown; }
  catch { throw new Error('SAQLAIN_MONITORING_ALERT_WEBHOOK_ALLOWED_HOSTS_JSON must be a JSON array of exact hostnames.'); }
  if (!Array.isArray(allowedHostnames) || allowedHostnames.some(hostname => typeof hostname !== 'string')) {
    throw new Error('SAQLAIN_MONITORING_ALERT_WEBHOOK_ALLOWED_HOSTS_JSON must be a JSON array of exact hostnames.');
  }
  const timeoutMs = rawTimeout ? Number(rawTimeout) : undefined;
  return createSaqlainMonitoringAlertWebhook({
    url: rawUrl,
    bearerToken: rawToken,
    allowedHostnames,
    ...(timeoutMs === undefined ? {} : { timeoutMs }),
  });
}
