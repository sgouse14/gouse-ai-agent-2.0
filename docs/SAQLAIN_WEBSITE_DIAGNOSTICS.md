# Saqlain Cyber Agent — Website Error Diagnostics

Status: **Initial read-only diagnostics implementation on the feature branch; not deployed or tested against a live authorized website yet.** This module suggests fixes. It does not repair or mutate remote sites.

## Endpoint

POST /api/website/diagnostics

Required headers:
- Authorization: Bearer <Firebase ID token>
- X-Project-ID: <approved project id>
- Content-Type: application/json

Request body:

~~~json
{
  "url": "https://www.example.com/"
}
~~~

The project ID must be provisioned in SAQLAIN_PROJECT_MEMBERSHIPS_JSON for the authenticated Firebase UID. The requested hostname must also appear as an exact entry in SAQLAIN_WEBSITE_ALLOWED_HOSTS_JSON for that project. Wildcards, arbitrary hostnames, non-standard ports, literal IP URLs, URL credentials, query strings, and fragments are rejected.

Example configuration shape (use real owner-approved values only):

~~~json
{
  "approved-project-id": ["example.com", "www.example.com"]
}
~~~

Set that JSON as the server-side environment variable SAQLAIN_WEBSITE_ALLOWED_HOSTS_JSON. Never use a frontend VITE_* variable for this policy. Configure durable audit storage through SAQLAIN_AUDIT_BACKEND and SAQLAIN_AUDIT_FILE (or Firestore plus the appropriate service identity/IAM). If required audit storage is unavailable, the endpoint fails closed and does not return a report.

## What it checks

- HTTP status errors on the submitted page and discovered same-origin links/resources.
- Server errors (5xx), missing links/resources (404/410), restricted resources (401/403), rate limiting, and unsupported HEAD checks.
- Missing or empty HTML title elements.
- HTTPS pages that reference HTTP URLs.
- Redirects that leave the allowlisted origin, which are reported but not followed.
- Response-size limits and network failures/timeouts.

The submitted page is fetched with GET to inspect basic HTML. Discovered same-origin links and assets are checked with HEAD. The crawler does not follow cross-origin links, does not request query-bearing discovered links, and only supports standard HTTP/HTTPS ports. It resolves target hostnames to public IPv4 addresses and pins requests to the validated address. Non-public/reserved IPv4 addresses and non-IPv4 DNS answers are rejected. Redirects are limited and each target is validated again.

Bounded defaults: at most 20 discovered resources, 4 concurrent requests, a 4-second request timeout, 256 KiB of HTML body content, a 2,048-character URL, and 3 same-origin redirects.

## Output and repair workflow

The endpoint returns a report with a diagnostic status, timestamp, number of resources checked, findings with severity/evidence/recommendation, and a structured repair proposal for each finding. Each proposal contains change category, implementation steps, verification checks, a rollback guide, and an explicit approvalRequired=true / automaticApply=false boundary. It does not execute website JavaScript, inspect the browser console, sign in to authenticated pages, submit forms, exploit vulnerabilities, deploy code, change DNS/configuration, or modify remote content.

A later repair workflow should separately:
1. Generate a proposed patch/change plan.
2. Show the target, diff, reason, impact, and rollback plan to the authorized owner.
3. Obtain explicit approval tied to that exact change.
4. Apply only through an owner-configured deployment/change adapter.
5. Verify the result and log the outcome.

Do not attach automatic live repair to this diagnostic endpoint. An approved project hostname alone is not authorization to change every resource or deploy code.

## Operational limitations

- No live target has been scanned as part of this code change.
- The feature branch's unit tests exercise parsing, policy, and mocked network responses only; they do not replace staging validation.
- Browser-runtime JavaScript errors, dynamic client-side behavior, authenticated pages, backend application logs, and business-logic correctness are outside this first version.
- Exact hostname allowlisting must be configured by the service owner. If allowlist or audit settings are missing, diagnostics remains unavailable by design.
- Confirm that intended targets do not depend on GET endpoints with side effects before enabling scans. The scanner itself sends no mutation requests, but site operators are responsible for ensuring their GET routes follow safe HTTP semantics.

## Staging checklist

- [ ] Configure approved Firebase UID/project membership.
- [ ] Configure exact project-to-host allowlist.
- [ ] Verify Firebase auth, project denial, host denial, and audit-failure behavior.
- [ ] Scan an owner-controlled staging site and inspect all requests in server/network logs.
- [ ] Test private-IP DNS answers, redirect-to-private-address attempts, cross-origin redirects, timeout, and oversized responses.
- [ ] Verify the audit chain records both request authorization and completion/failure.
- [ ] Obtain owner/security approval before enabling scans against live websites.
