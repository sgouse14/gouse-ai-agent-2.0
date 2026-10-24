import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import * as http from 'node:http';
import * as https from 'node:https';
import type { LookupFunction } from 'node:dns';

export type WebsiteDiagnosticMethod = 'GET' | 'HEAD';
export type WebsiteDiagnosticSeverity = 'high' | 'medium' | 'low' | 'info';

export interface WebsiteDiagnosticFinding {
  code: string;
  severity: WebsiteDiagnosticSeverity;
  title: string;
  location: string;
  evidence: string;
  recommendation: string;
}

export interface WebsiteDiagnosticReport {
  status: 'PASS' | 'ISSUES_FOUND' | 'INCOMPLETE';
  checkedAt: string;
  origin: string;
  requestedPath: string;
  resourcesChecked: number;
  resourceLimit: number;
  scope: 'submitted page and same-origin links/assets only';
  findings: WebsiteDiagnosticFinding[];
  notes: string[];
}

export interface WebsiteDiagnosticResponse {
  statusCode: number;
  contentType: string;
  location: string | null;
  body: string;
  bodyTooLarge: boolean;
}

export interface WebsiteDiagnosticsDependencies {
  /** Injection point for deterministic tests. Production uses pinned public IPv4 DNS. */
  resolvePublicIPv4?: (hostname: string) => Promise<string>;
  /** Injection point for deterministic tests. Production uses a bounded Node HTTP(S) request. */
  request?: (url: URL, method: WebsiteDiagnosticMethod, publicIPv4: string) => Promise<WebsiteDiagnosticResponse>;
  now?: () => Date;
}

const MAX_URL_LENGTH = 2048;
const MAX_HTML_BYTES = 256 * 1024;
const MAX_RESOURCE_CHECKS = 20;
const MAX_REDIRECTS = 3;
const REQUEST_TIMEOUT_MS = 4_000;
const MAX_CONCURRENT_CHECKS = 4;
const USER_AGENT = 'Saqlain-WebsiteDiagnostics/1.0';

export class WebsiteTargetRejectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WebsiteTargetRejectedError';
  }
}

function ipv4ToNumber(address: string): number | null {
  if (isIP(address) !== 4) return null;
  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some(part => !Number.isInteger(part) || part < 0 || part > 255)) return null;
  return (((parts[0] * 256 + parts[1]) * 256 + parts[2]) * 256 + parts[3]) >>> 0;
}

const NON_PUBLIC_IPV4_RANGES: ReadonlyArray<readonly [string, number]> = [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24],
  ['192.0.2.0', 24], ['192.88.99.0', 24], ['192.168.0.0', 16],
  ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24],
  ['224.0.0.0', 4], ['240.0.0.0', 4],
].map(([network, prefix]) => [network as string, prefix as number] as const);

export function isPublicIPv4(address: string): boolean {
  const value = ipv4ToNumber(address);
  if (value === null) return false;
  for (const [network, prefix] of NON_PUBLIC_IPV4_RANGES) {
    const networkValue = ipv4ToNumber(network);
    if (networkValue === null) return false;
    const size = 2 ** (32 - prefix);
    if (Math.floor(value / size) === Math.floor(networkValue / size)) return false;
  }
  return true;
}

function assertSafeHostname(hostname: string): void {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  if (!host || isIP(host) !== 0 || !host.includes('.') ||
      host === 'localhost' || host.endsWith('.localhost') ||
      host.endsWith('.local') || host.endsWith('.internal') ||
      host.endsWith('.lan') || host.endsWith('.home.arpa') ||
      host.endsWith('.test') || host.endsWith('.invalid') ||
      host.endsWith('.example') || host.endsWith('.onion')) {
    throw new WebsiteTargetRejectedError('Website target must be a public DNS hostname, not a local, reserved, or literal-IP address.');
  }
}

export function parseWebsiteDiagnosticTarget(raw: unknown): URL {
  if (typeof raw !== 'string' || !raw.trim() || raw.length > MAX_URL_LENGTH) {
    throw new WebsiteTargetRejectedError('A website URL of at most 2048 characters is required.');
  }
  let url: URL;
  try { url = new URL(raw.trim()); }
  catch { throw new WebsiteTargetRejectedError('Website URL is invalid.'); }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new WebsiteTargetRejectedError('Only HTTP and HTTPS website URLs are supported.');
  }
  if (url.username || url.password) {
    throw new WebsiteTargetRejectedError('Website URLs must not contain embedded credentials.');
  }
  if (url.search || url.hash) {
    throw new WebsiteTargetRejectedError('Remove query parameters and fragments before scanning; they may contain sensitive data or trigger stateful URLs.');
  }
  if (url.port) {
    throw new WebsiteTargetRejectedError('Only the standard HTTP/HTTPS ports are allowed.');
  }
  assertSafeHostname(url.hostname);
  url.hash = '';
  return url;
}

async function resolvePublicIPv4(hostname: string): Promise<string> {
  assertSafeHostname(hostname);
  let records: Awaited<ReturnType<typeof lookup>>;
  try {
    records = await lookup(hostname, { all: true, family: 4, verbatim: true });
  } catch {
    throw new Error('Website DNS lookup failed.');
  }
  if (!records.length || records.some(record => record.family !== 4 || !isPublicIPv4(record.address))) {
    throw new WebsiteTargetRejectedError('Website hostname must resolve exclusively to public IPv4 addresses.');
  }
  return records[0].address;
}

function pinnedLookup(address: string): LookupFunction {
  return ((hostname: string, options: unknown, callback: (...args: unknown[]) => void) => {
    if (typeof options === 'object' && options !== null && (options as { all?: boolean }).all === true) {
      callback(null, [{ address, family: 4 }]);
    } else {
      callback(null, address, 4);
    }
  }) as unknown as LookupFunction;
}

function requestWithPinnedAddress(
  url: URL,
  method: WebsiteDiagnosticMethod,
  publicIPv4: string,
): Promise<WebsiteDiagnosticResponse> {
  return new Promise((resolve, reject) => {
    const transport = url.protocol === 'https:' ? https : http;
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      callback();
    };
    const request = transport.request(url, {
      method,
      agent: false,
      lookup: pinnedLookup(publicIPv4),
      maxHeaderSize: 16 * 1024,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,*/*;q=0.1',
        'Accept-Encoding': 'identity',
        Connection: 'close',
      },
    }, response => {
      const contentType = typeof response.headers['content-type'] === 'string'
        ? response.headers['content-type'].slice(0, 256)
        : '';
      const location = typeof response.headers.location === 'string'
        ? response.headers.location.slice(0, MAX_URL_LENGTH)
        : null;
      const chunks: Buffer[] = [];
      let bytes = 0;
      let bodyTooLarge = false;
      response.on('data', (chunk: Buffer | string) => {
        if (method === 'HEAD' || bodyTooLarge) return;
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        bytes += buffer.length;
        if (bytes > MAX_HTML_BYTES) {
          bodyTooLarge = true;
          chunks.length = 0;
          return;
        }
        chunks.push(buffer);
      });
      response.on('error', error => finish(() => reject(error)));
      response.on('end', () => finish(() => resolve({
        statusCode: response.statusCode ?? 0,
        contentType,
        location,
        body: bodyTooLarge ? '' : Buffer.concat(chunks).toString('utf8'),
        bodyTooLarge,
      })));
      response.resume();
    });
    request.setTimeout(REQUEST_TIMEOUT_MS, () => request.destroy(new Error('Website request timed out.')));
    request.on('error', error => finish(() => reject(error)));
    request.end();
  });
}

interface FetchedResource {
  requestedUrl: URL;
  finalUrl: URL;
  response: WebsiteDiagnosticResponse | null;
  externalRedirect: boolean;
  redirectLimitReached: boolean;
  errorCode: string | null;
}

async function fetchSameOriginResource(
  originalUrl: URL,
  method: WebsiteDiagnosticMethod,
  origin: string,
  resolveAddress: (hostname: string) => Promise<string>,
  request: (url: URL, method: WebsiteDiagnosticMethod, publicIPv4: string) => Promise<WebsiteDiagnosticResponse>,
): Promise<FetchedResource> {
  let current = new URL(originalUrl);
  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
    let address: string;
    try { address = await resolveAddress(current.hostname); }
    catch (error) {
      return {
        requestedUrl: originalUrl, finalUrl: current, response: null, externalRedirect: false,
        redirectLimitReached: false,
        errorCode: error instanceof WebsiteTargetRejectedError ? 'TARGET_REJECTED' : 'NETWORK_ERROR',
      };
    }
    let response: WebsiteDiagnosticResponse;
    try { response = await request(current, method, address); }
    catch {
      return { requestedUrl: originalUrl, finalUrl: current, response: null, externalRedirect: false, redirectLimitReached: false, errorCode: 'NETWORK_ERROR' };
    }
    if (response.statusCode < 300 || response.statusCode >= 400 || !response.location) {
      return { requestedUrl: originalUrl, finalUrl: current, response, externalRedirect: false, redirectLimitReached: false, errorCode: null };
    }
    let next: URL;
    try { next = new URL(response.location, current); }
    catch {
      return { requestedUrl: originalUrl, finalUrl: current, response, externalRedirect: false, redirectLimitReached: false, errorCode: 'INVALID_REDIRECT' };
    }
    if (next.origin !== origin) {
      return { requestedUrl: originalUrl, finalUrl: current, response, externalRedirect: true, redirectLimitReached: false, errorCode: null };
    }
    try {
      if (next.protocol !== current.protocol || next.search || next.hash || next.username || next.password || next.port) {
        return { requestedUrl: originalUrl, finalUrl: current, response, externalRedirect: false, redirectLimitReached: false, errorCode: 'UNSAFE_REDIRECT' };
      }
      assertSafeHostname(next.hostname);
    } catch {
      return { requestedUrl: originalUrl, finalUrl: current, response, externalRedirect: false, redirectLimitReached: false, errorCode: 'UNSAFE_REDIRECT' };
    }
    if (redirects === MAX_REDIRECTS) {
      return { requestedUrl: originalUrl, finalUrl: current, response, externalRedirect: false, redirectLimitReached: true, errorCode: null };
    }
    current = next;
  }
  return { requestedUrl: originalUrl, finalUrl: current, response: null, externalRedirect: false, redirectLimitReached: true, errorCode: null };
}

function normalizePath(url: URL): string {
  return url.pathname.length > 180 ? url.pathname.slice(0, 177) + '...' : (url.pathname || '/');
}

function readHtmlReferences(html: string, pageUrl: URL, findings: WebsiteDiagnosticFinding[]): URL[] {
  const references: URL[] = [];
  const seen = new Set<string>();
  const tagPattern = /<(a|area|img|script|link|source|iframe)\b[^>]*>/gi;
  for (const match of html.matchAll(tagPattern)) {
    const tag = match[0];
    const tagName = match[1].toLowerCase();
    const attribute = tagName === 'a' || tagName === 'area' || tagName === 'link' ? 'href' : 'src';
    const valueMatch = new RegExp(`\\b${attribute}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(tag);
    const raw = valueMatch?.[1] ?? valueMatch?.[2] ?? valueMatch?.[3];
    if (!raw || raw.length > MAX_URL_LENGTH || raw.startsWith('#')) continue;
    let target: URL;
    try { target = new URL(raw, pageUrl); } catch { continue; }
    if (pageUrl.protocol === 'https:' && target.protocol === 'http:') {
      findings.push({
        code: 'MIXED_CONTENT_REFERENCE', severity: 'medium', title: 'HTTPS page references an insecure HTTP resource',
        location: normalizePath(pageUrl), evidence: 'A page loaded over HTTPS references an HTTP URL.',
        recommendation: 'Serve the referenced resource over HTTPS and update the page markup. This check does not fetch the external resource.',
      });
    }
    // Only same-origin HTTP(S) links/resources are checked. No other website is contacted.
    if (target.origin !== pageUrl.origin || (target.protocol !== 'http:' && target.protocol !== 'https:')) continue;
    // Query-based URLs can trigger state-changing handlers on some sites, so they are not requested.
    if (target.search || target.username || target.password || target.port) continue;
    target.hash = '';
    const key = target.toString();
    if (seen.has(key)) continue;
    seen.add(key);
    references.push(target);
  }
  return references;
}

async function mapLimit<T, R>(items: readonly T[], limit: number, work: (item: T) => Promise<R>): Promise<R[]> {
  const result = new Array<R>(items.length);
  let nextIndex = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) return;
      result[index] = await work(items[index]);
    }
  }));
  return result;
}

function findingForStatus(path: string, statusCode: number, method: WebsiteDiagnosticMethod): WebsiteDiagnosticFinding | null {
  if (statusCode >= 500) {
    return {
      code: method === 'GET' ? 'SITE_SERVER_ERROR' : 'RESOURCE_SERVER_ERROR',
      severity: 'high', title: 'Website returned a server error', location: path,
      evidence: method + ' returned HTTP ' + statusCode + '.',
      recommendation: 'Review server/application logs and the relevant route or asset handler, then retest the URL after deploying a fix.',
    };
  }
  if (statusCode === 404 || statusCode === 410) {
    return {
      code: 'BROKEN_INTERNAL_RESOURCE', severity: 'high', title: 'Internal link or resource is missing', location: path,
      evidence: method + ' returned HTTP ' + statusCode + '.',
      recommendation: 'Restore the missing page/resource, correct the link, or add an intentional redirect to a valid destination.',
    };
  }
  if (statusCode === 405 || statusCode === 501) {
    return {
      code: 'HEAD_NOT_SUPPORTED', severity: 'info', title: 'Server does not support HEAD checks for this resource', location: path,
      evidence: 'HEAD returned HTTP ' + statusCode + '; this does not prove the resource is broken.',
      recommendation: 'Verify this resource with the site owner’s browser or existing monitoring. The diagnostic deliberately does not fall back to GET for linked resources.',
    };
  }
  if (statusCode === 401 || statusCode === 403) {
    return {
      code: 'RESOURCE_ACCESS_RESTRICTED', severity: 'low', title: 'Resource access is restricted', location: path,
      evidence: method + ' returned HTTP ' + statusCode + '.',
      recommendation: 'Confirm whether the resource is intentionally protected. If public access is expected, review routing and access-control configuration.',
    };
  }
  if (statusCode === 429) {
    return {
      code: 'RESOURCE_RATE_LIMITED', severity: 'info', title: 'Resource rate-limited the diagnostic request', location: path,
      evidence: method + ' returned HTTP 429.',
      recommendation: 'Treat this result as inconclusive and rerun at a lower frequency after the retry window.',
    };
  }
  if (statusCode >= 400) {
    return {
      code: 'RESOURCE_CLIENT_ERROR', severity: 'medium', title: 'Website resource returned a client error', location: path,
      evidence: method + ' returned HTTP ' + statusCode + '.',
      recommendation: 'Review the resource URL, request routing, and access policy to determine whether this response is expected.',
    };
  }
  return null;
}

/**
 * Read-only, bounded diagnostics for one allowlisted website page.
 * It never writes to the target website. Only the submitted page is GET-fetched;
 * discovered same-origin links/assets are checked with HEAD, and cross-origin
 * URLs or query-bearing links are not contacted.
 */
export async function diagnoseWebsite(
  rawUrl: unknown,
  dependencies: WebsiteDiagnosticsDependencies = {},
): Promise<WebsiteDiagnosticReport> {
  const target = parseWebsiteDiagnosticTarget(rawUrl);
  const resolveAddress = dependencies.resolvePublicIPv4 ?? resolvePublicIPv4;
  const request = dependencies.request ?? requestWithPinnedAddress;
  const now = dependencies.now ?? (() => new Date());
  const findings: WebsiteDiagnosticFinding[] = [];
  const root = await fetchSameOriginResource(target, 'GET', target.origin, resolveAddress, request);
  let resourcesChecked = 1;

  if (root.errorCode) {
    if (root.errorCode === 'TARGET_REJECTED' || root.errorCode === 'UNSAFE_REDIRECT') {
      throw new WebsiteTargetRejectedError('Website target or redirect did not pass public-host and same-origin safety checks.');
    }
    throw new Error('Website could not be reached for diagnostics.');
  }
  if (!root.response) throw new Error('Website returned no diagnostic response.');
  const rootPath = normalizePath(root.finalUrl);
  const rootStatusFinding = findingForStatus(rootPath, root.response.statusCode, 'GET');
  if (rootStatusFinding) findings.push(rootStatusFinding);
  if (root.externalRedirect) findings.push({
    code: 'CROSS_ORIGIN_REDIRECT_NOT_FOLLOWED', severity: 'medium', title: 'Website redirects to a different origin',
    location: normalizePath(root.finalUrl), evidence: 'A redirect leaves the allowlisted origin; the destination was not contacted.',
    recommendation: 'Review the redirect configuration and, if expected, add the canonical destination as a separately approved website before scanning it.',
  });
  if (root.redirectLimitReached) findings.push({
    code: 'REDIRECT_LIMIT', severity: 'low', title: 'Redirect chain exceeded the safe limit', location: rootPath,
    evidence: 'The diagnostic stopped after ' + MAX_REDIRECTS + ' same-origin redirects.',
    recommendation: 'Review redirect loops/chains and reduce them to a direct canonical destination.',
  });
  if (root.response.bodyTooLarge) findings.push({
    code: 'HTML_BODY_LIMIT', severity: 'info', title: 'Page content exceeded the inspection limit', location: rootPath,
    evidence: 'The page response exceeded ' + MAX_HTML_BYTES + ' bytes; its body was not retained for analysis.',
    recommendation: 'Review this page with the site’s own tooling. This bounded diagnostic did not download the full body.',
  });

  const isHtml = /text\/html|application\/xhtml\+xml/i.test(root.response.contentType);
  if (root.response.statusCode >= 200 && root.response.statusCode < 400 && !isHtml) {
    findings.push({
      code: 'NON_HTML_RESPONSE', severity: 'info', title: 'Submitted URL did not return an HTML page', location: rootPath,
      evidence: 'Content-Type was ' + (root.response.contentType || 'not provided') + '.',
      recommendation: 'Submit the canonical HTML page URL if you want link and page-title diagnostics.',
    });
  }

  let references: URL[] = [];
  if (isHtml && !root.response.bodyTooLarge && root.response.statusCode >= 200 && root.response.statusCode < 300) {
    const titleMatch = /<title\b[^>]*>([\s\S]*?)<\/title\s*>/i.exec(root.response.body);
    if (!titleMatch || !titleMatch[1].replace(/<[^>]+>/g, '').trim()) {
      findings.push({
        code: 'MISSING_PAGE_TITLE', severity: 'low', title: 'HTML page is missing a meaningful title',
        location: rootPath, evidence: 'No non-empty HTML title element was found in the inspected markup.',
        recommendation: 'Add a concise, unique <title> element that describes this page.',
      });
    }
    references = readHtmlReferences(root.response.body, root.finalUrl, findings).slice(0, MAX_RESOURCE_CHECKS);
  }

  const linkedResults = await mapLimit(references, MAX_CONCURRENT_CHECKS, async url => {
    const result = await fetchSameOriginResource(url, 'HEAD', target.origin, resolveAddress, request);
    return { url, result };
  });
  resourcesChecked += linkedResults.length;

  for (const { url, result } of linkedResults) {
    const path = normalizePath(url);
    if (result.errorCode) {
      findings.push({
        code: result.errorCode === 'TARGET_REJECTED' || result.errorCode === 'UNSAFE_REDIRECT' ? 'RESOURCE_CHECK_BLOCKED' : 'RESOURCE_CHECK_FAILED',
        severity: 'low', title: 'Internal resource could not be safely checked', location: path,
        evidence: result.errorCode === 'NETWORK_ERROR'
          ? 'The resource request failed or timed out.'
          : 'The resource was not requested because its DNS or redirect target failed the safety checks.',
        recommendation: 'Verify the resource with the website operator’s tooling; no unsafe destination was contacted.',
      });
      continue;
    }
    if (!result.response) continue;
    if (result.externalRedirect) {
      findings.push({
        code: 'RESOURCE_REDIRECTS_OFFSITE', severity: 'low', title: 'Internal resource redirects outside the approved origin',
        location: path, evidence: 'The redirect destination was not contacted.',
        recommendation: 'Review whether this resource should redirect to an explicitly approved canonical host.',
      });
      continue;
    }
    const finding = findingForStatus(path, result.response.statusCode, 'HEAD');
    if (finding) findings.push(finding);
  }

  const uniqueFindings = [...new Map(findings.map(finding => [
    finding.code + '|' + finding.location + '|' + finding.evidence,
    finding,
  ])).values()];
  const hasHighOrMedium = uniqueFindings.some(finding => finding.severity === 'high' || finding.severity === 'medium');
  const isIncomplete = root.response.bodyTooLarge || uniqueFindings.some(finding =>
    finding.code === 'RESOURCE_CHECK_FAILED' || finding.code === 'RESOURCE_CHECK_BLOCKED' ||
    finding.code === 'CROSS_ORIGIN_REDIRECT_NOT_FOLLOWED' || finding.code === 'REDIRECT_LIMIT'
  );
  return {
    status: isIncomplete ? 'INCOMPLETE' : hasHighOrMedium ? 'ISSUES_FOUND' : 'PASS',
    checkedAt: now().toISOString(),
    origin: target.origin,
    requestedPath: normalizePath(target),
    resourcesChecked,
    resourceLimit: MAX_RESOURCE_CHECKS,
    scope: 'submitted page and same-origin links/assets only',
    findings: uniqueFindings,
    notes: [
      'The diagnostic is read-only. It does not sign in, submit forms, execute JavaScript, exploit vulnerabilities, or change website content.',
      'Only the submitted page is fetched with GET; same-origin links/assets are checked with HEAD. Cross-origin and query-bearing URLs are not contacted.',
      'JavaScript console/runtime errors, authenticated-only routes, dynamic content, and server-side application logs require browser or owner-provided telemetry and are not covered by this check.',
      'Findings contain suggested fixes only. No repair is automatically applied.',
    ],
  };
}
