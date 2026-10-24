import test from 'node:test';
import assert from 'node:assert/strict';
import {
  diagnoseWebsite,
  isPublicIPv4,
  parseWebsiteDiagnosticTarget,
  WebsiteTargetRejectedError,
  type WebsiteDiagnosticResponse,
} from './saqlainWebsiteDiagnostics.ts';

const publicAddress = async () => '93.184.216.34';
function response(statusCode: number, contentType = 'text/html; charset=utf-8', body = '', location: string | null = null): WebsiteDiagnosticResponse {
  return { statusCode, contentType, body, location, bodyTooLarge: false };
}

test('website diagnostic URL parser accepts a public HTTP(S) URL only', () => {
  assert.equal(parseWebsiteDiagnosticTarget('https://www.example.com/').hostname, 'www.example.com');
  assert.throws(() => parseWebsiteDiagnosticTarget('file:///etc/passwd'), WebsiteTargetRejectedError);
  assert.throws(() => parseWebsiteDiagnosticTarget('http://localhost/'), WebsiteTargetRejectedError);
  assert.throws(() => parseWebsiteDiagnosticTarget('http://127.0.0.1/'), WebsiteTargetRejectedError);
  assert.throws(() => parseWebsiteDiagnosticTarget('http://169.254.169.254/latest/meta-data'), WebsiteTargetRejectedError);
  assert.throws(() => parseWebsiteDiagnosticTarget('https://user:pass@example.com/'), WebsiteTargetRejectedError);
  assert.throws(() => parseWebsiteDiagnosticTarget('https://example.com:8443/'), WebsiteTargetRejectedError);
  assert.throws(() => parseWebsiteDiagnosticTarget('https://example.com/?token=secret'), WebsiteTargetRejectedError);
  assert.throws(() => parseWebsiteDiagnosticTarget('https://example.com/#fragment'), WebsiteTargetRejectedError);
});

test('public IPv4 filter rejects private, link-local, loopback and reserved ranges', () => {
  for (const address of [
    '0.0.0.0', '10.1.2.3', '100.64.0.1', '127.0.0.1', '169.254.169.254',
    '172.16.0.1', '192.168.1.1', '198.18.0.1', '192.0.2.1', '224.0.0.1',
    '240.0.0.1', '::1', 'not-an-ip',
  ]) assert.equal(isPublicIPv4(address), false, address);
  assert.equal(isPublicIPv4('8.8.8.8'), true);
});

test('scanner detects missing internal resources and a missing title without contacting external links', async () => {
  const calls: Array<{ url: string; method: string; address: string }> = [];
  const report = await diagnoseWebsite('https://example.com/', {
    resolvePublicIPv4: publicAddress,
    now: () => new Date('2026-10-24T06:00:00.000Z'),
    request: async (url, method, address) => {
      calls.push({ url: url.toString(), method, address });
      if (url.pathname === '/' && method === 'GET') {
        return response(200, 'text/html', '<html><body><a href="/missing">missing</a><img src="/logo.png"><a href="https://other.example/secret">external</a><a href="/track?token=x">query</a></body></html>');
      }
      if (url.pathname === '/missing') return response(404, '', '');
      return response(200, 'image/png', '');
    },
  });
  assert.equal(report.status, 'ISSUES_FOUND');
  const titleFinding = report.findings.find(finding => finding.code === 'MISSING_PAGE_TITLE');
  assert.ok(titleFinding);
  assert.equal(titleFinding.repairPlan?.actionType, 'content');
  assert.equal(titleFinding.repairPlan?.approvalRequired, true);
  assert.equal(titleFinding.repairPlan?.automaticApply, false);
  const brokenLink = report.findings.find(finding => finding.code === 'BROKEN_INTERNAL_RESOURCE' && finding.location === '/missing');
  assert.ok(brokenLink);
  assert.equal(brokenLink.repairPlan?.actionType, 'routing');
  assert.ok(brokenLink.repairPlan?.rollbackGuidance);
  assert.equal(report.resourcesChecked, 3);
  assert.equal(calls.length, 3);
  assert.ok(calls.every(call => call.address === '93.184.216.34'));
  assert.equal(calls.some(call => call.url.includes('other.example') || call.url.includes('/track?')), false);
  assert.equal(calls[0].method, 'GET');
  assert.ok(calls.slice(1).every(call => call.method === 'HEAD'));
});

test('scanner never follows a redirect to another origin', async () => {
  const calls: string[] = [];
  const report = await diagnoseWebsite('https://example.com/', {
    resolvePublicIPv4: publicAddress,
    request: async (url, method) => {
      calls.push(url.toString());
      if (method === 'GET') return response(302, '', '', 'http://169.254.169.254/latest/meta-data');
      return response(200, '', '');
    },
  });
  assert.equal(calls.length, 1);
  assert.equal(report.status, 'INCOMPLETE');
  assert.ok(report.findings.some(finding => finding.code === 'CROSS_ORIGIN_REDIRECT_NOT_FOLLOWED'));
});

test('scanner records HTTP server error and does not attempt linked resource checks', async () => {
  const report = await diagnoseWebsite('https://example.com/failing', {
    resolvePublicIPv4: publicAddress,
    request: async () => response(500, 'text/html', '<title>Temporary error</title>'),
  });
  assert.equal(report.status, 'ISSUES_FOUND');
  assert.ok(report.findings.some(finding => finding.code === 'SITE_SERVER_ERROR' && finding.severity === 'high'));
  assert.equal(report.resourcesChecked, 1);
});

test('scanner reports bounded HTML responses as incomplete', async () => {
  const report = await diagnoseWebsite('https://example.com/', {
    resolvePublicIPv4: publicAddress,
    request: async () => ({ statusCode: 200, contentType: 'text/html', location: null, body: '', bodyTooLarge: true }),
  });
  assert.equal(report.status, 'INCOMPLETE');
  assert.ok(report.findings.some(finding => finding.code === 'HTML_BODY_LIMIT'));
});

test('scanner rejects DNS answers that are not public IPv4 addresses', async () => {
  await assert.rejects(
    () => diagnoseWebsite('https://example.com/', {
      resolvePublicIPv4: async () => '10.0.0.1',
      request: async () => { throw new Error('must not be called'); },
    }),
    WebsiteTargetRejectedError,
  );
});


test('a page with a low-severity actionable finding is not reported as a clean pass', async () => {
  const report = await diagnoseWebsite('https://example.com/', {
    resolvePublicIPv4: publicAddress,
    request: async () => response(200, 'text/html', '<html><body>No title</body></html>'),
  });
  assert.equal(report.status, 'ISSUES_FOUND');
  const finding = report.findings.find(item => item.code === 'MISSING_PAGE_TITLE');
  assert.equal(finding?.repairPlan?.approvalRequired, true);
  assert.equal(finding?.repairPlan?.automaticApply, false);
});
