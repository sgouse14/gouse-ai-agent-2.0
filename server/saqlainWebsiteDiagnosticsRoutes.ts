import { randomUUID } from 'node:crypto';
import type { Request, RequestHandler, Response } from 'express';
import { appendSaqlainAuditEvent, getSaqlainAuditBackendMode } from './saqlainAuditBackend.ts';
import type { AuditEventInput } from './saqlainAuditLog.ts';
import {
  diagnoseWebsite,
  parseWebsiteDiagnosticTarget,
  WebsiteTargetRejectedError,
  type WebsiteDiagnosticReport,
} from './saqlainWebsiteDiagnostics.ts';

export interface SaqlainWebsiteDiagnosticsRouteOptions {
  getAllowedHostsJson?: () => string | undefined;
  getAuditFilePath?: () => string | undefined;
  getAuditMode?: () => 'file' | 'firestore';
  writeAuditEvent?: (filePath: string | undefined, event: AuditEventInput) => Promise<unknown>;
  diagnose?: (url: unknown) => Promise<WebsiteDiagnosticReport>;
  now?: () => Date;
}

type AuditOutcome = AuditEventInput['outcome'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseAllowedHosts(raw: string | undefined): Map<string, Set<string>> | null {
  if (!raw?.trim()) return null;
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return null; }
  if (!isRecord(parsed)) return null;
  const projects = new Map<string, Set<string>>();
  for (const [projectId, hosts] of Object.entries(parsed)) {
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(projectId) || !Array.isArray(hosts) || hosts.length > 1000) return null;
    const normalizedHosts = new Set<string>();
    for (const host of hosts) {
      if (typeof host !== 'string') return null;
      const normalized = host.trim().toLowerCase().replace(/\.$/, '');
      if (!normalized || normalized.length > 253 || normalized.includes('*') ||
          !/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(normalized)) {
        return null;
      }
      normalizedHosts.add(normalized);
    }
    projects.set(projectId, normalizedHosts);
  }
  return projects;
}

function safeError(error: unknown): string {
  if (error instanceof WebsiteTargetRejectedError) return error.message;
  return 'Website diagnostic could not be completed.';
}

export function createSaqlainWebsiteDiagnosticsHandler(
  options: SaqlainWebsiteDiagnosticsRouteOptions = {},
): RequestHandler {
  const getAllowedHostsJson = options.getAllowedHostsJson ?? (() => process.env.SAQLAIN_WEBSITE_ALLOWED_HOSTS_JSON);
  const getAuditFilePath = options.getAuditFilePath ?? (() => process.env.SAQLAIN_AUDIT_FILE?.trim() || undefined);
  const getAuditMode = options.getAuditMode ?? getSaqlainAuditBackendMode;
  const writeAuditEvent = options.writeAuditEvent ?? appendSaqlainAuditEvent;
  const diagnose = options.diagnose ?? diagnoseWebsite;
  const now = options.now ?? (() => new Date());

  async function audit(event: AuditEventInput): Promise<void> {
    const mode = getAuditMode();
    const filePath = getAuditFilePath();
    if (mode === 'file' && !filePath?.trim()) throw new Error('Saqlain audit storage is not configured.');
    await writeAuditEvent(filePath, event);
  }

  async function recordRequest(
    actorId: string,
    projectId: string,
    outcome: AuditOutcome,
    eventType: string,
    details: Record<string, unknown>,
    taskId: string,
  ): Promise<boolean> {
    try {
      await audit({
        eventType,
        actorId,
        outcome,
        resource: 'saqlain-website-diagnostics',
        taskId,
        occurredAt: now().toISOString(),
        details: { projectId, ...details },
      });
      return true;
    } catch {
      return false;
    }
  }

  return async (req: Request, res: Response): Promise<void> => {
    const actorId = typeof req.saqlainIdentity?.uid === 'string' ? req.saqlainIdentity.uid : '';
    const projectId = typeof req.saqlainProjectId === 'string' ? req.saqlainProjectId : '';
    const taskId = 'website-diagnostic-' + randomUUID();
    if (!actorId || !projectId) {
      res.status(401).json({ error: 'Authenticated identity and authorized project scope are required.' });
      return;
    }
    if (!isRecord(req.body) || typeof req.body.url !== 'string') {
      const audited = await recordRequest(actorId, projectId, 'DENY', 'SAQLAIN_WEBSITE_DIAGNOSTICS_REJECTED', {
        reason: 'INVALID_REQUEST_BODY',
      }, taskId);
      res.status(audited ? 400 : 503).json({ error: audited ? 'A website URL is required.' : 'Website diagnostic audit is unavailable; no scan was run.' });
      return;
    }

    let target: URL;
    try {
      target = parseWebsiteDiagnosticTarget(req.body.url);
    } catch (error) {
      const audited = await recordRequest(actorId, projectId, 'DENY', 'SAQLAIN_WEBSITE_DIAGNOSTICS_REJECTED', {
        reason: 'INVALID_OR_UNSAFE_URL',
      }, taskId);
      res.status(audited ? 400 : 503).json({
        error: audited ? safeError(error) : 'Website diagnostic audit is unavailable; no scan was run.',
      });
      return;
    }

    let allowlist: Map<string, Set<string>> | null;
    try { allowlist = parseAllowedHosts(getAllowedHostsJson()); }
    catch { allowlist = null; }
    if (!allowlist) {
      const audited = await recordRequest(actorId, projectId, 'HOLD', 'SAQLAIN_WEBSITE_DIAGNOSTICS_HELD', {
        targetHost: target.hostname,
        targetPath: target.pathname.slice(0, 180),
        reason: 'ALLOWLIST_NOT_CONFIGURED_OR_INVALID',
      }, taskId);
      res.status(503).json({ error: audited ? 'Website diagnostics is not configured for an authorized target.' : 'Website diagnostic audit is unavailable; no scan was run.' });
      return;
    }

    if (!allowlist.get(projectId)?.has(target.hostname.toLowerCase().replace(/\.$/, ''))) {
      const audited = await recordRequest(actorId, projectId, 'DENY', 'SAQLAIN_WEBSITE_DIAGNOSTICS_REJECTED', {
        targetHost: target.hostname,
        targetPath: target.pathname.slice(0, 180),
        reason: 'HOST_NOT_ALLOWLISTED_FOR_PROJECT',
      }, taskId);
      res.status(audited ? 403 : 503).json({ error: audited ? 'This website host is not allowlisted for the authorized project.' : 'Website diagnostic audit is unavailable; no scan was run.' });
      return;
    }

    const requestAudited = await recordRequest(actorId, projectId, 'ALLOW', 'SAQLAIN_WEBSITE_DIAGNOSTICS_REQUESTED', {
      targetHost: target.hostname,
      targetPath: target.pathname.slice(0, 180),
      readOnly: true,
    }, taskId);
    if (!requestAudited) {
      res.status(503).json({ error: 'Website diagnostic audit is unavailable; no scan was run.' });
      return;
    }

    let report: WebsiteDiagnosticReport;
    try {
      report = await diagnose(target.toString());
    } catch (error) {
      const audited = await recordRequest(actorId, projectId, 'HOLD', 'SAQLAIN_WEBSITE_DIAGNOSTICS_FAILED', {
        targetHost: target.hostname,
        targetPath: target.pathname.slice(0, 180),
        reason: error instanceof WebsiteTargetRejectedError ? 'TARGET_REJECTED_DURING_FETCH' : 'DIAGNOSTIC_FAILED',
      }, taskId);
      res.status(audited ? (error instanceof WebsiteTargetRejectedError ? 400 : 502) : 503).json({
        error: audited ? safeError(error) : 'Website diagnostic audit is unavailable; no result was returned.',
      });
      return;
    }

    const completedAudit = await recordRequest(actorId, projectId, 'INFO', 'SAQLAIN_WEBSITE_DIAGNOSTICS_COMPLETED', {
      targetHost: target.hostname,
      targetPath: target.pathname.slice(0, 180),
      diagnosticStatus: report.status,
      resourcesChecked: report.resourcesChecked,
      findingsCount: report.findings.length,
      readOnly: true,
    }, taskId);
    if (!completedAudit) {
      res.status(503).json({ error: 'Website diagnostic audit is unavailable; no report was returned.' });
      return;
    }
    res.status(200).json(report);
  };
}

export const saqlainWebsiteDiagnosticsHandler = createSaqlainWebsiteDiagnosticsHandler();
