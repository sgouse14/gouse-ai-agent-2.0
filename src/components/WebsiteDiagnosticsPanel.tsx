import React, { useState } from 'react';
import { apiFetch } from '../apiClient';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileSearch,
  ShieldAlert,
  ShieldCheck,
  Wrench,
} from 'lucide-react';

type DiagnosticSeverity = 'high' | 'medium' | 'low' | 'info';
type DiagnosticStatus = 'PASS' | 'ISSUES_FOUND' | 'INCOMPLETE';

interface WebsiteRepairPlan {
  actionType: 'content' | 'routing' | 'configuration' | 'manual-review';
  steps: string[];
  verification: string[];
  approvalRequired: true;
  automaticApply: false;
  rollbackGuidance: string;
}

interface WebsiteDiagnosticFinding {
  code: string;
  severity: DiagnosticSeverity;
  title: string;
  location: string;
  evidence: string;
  recommendation: string;
  repairPlan?: WebsiteRepairPlan;
}

interface WebsiteDiagnosticReport {
  status: DiagnosticStatus;
  checkedAt: string;
  origin: string;
  requestedPath: string;
  resourcesChecked: number;
  resourceLimit: number;
  scope: string;
  findings: WebsiteDiagnosticFinding[];
  notes: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

function isRepairPlan(value: unknown): value is WebsiteRepairPlan {
  if (!isRecord(value)) return false;
  return (
    ['content', 'routing', 'configuration', 'manual-review'].includes(String(value.actionType)) &&
    isStringArray(value.steps) &&
    isStringArray(value.verification) &&
    value.approvalRequired === true &&
    value.automaticApply === false &&
    typeof value.rollbackGuidance === 'string'
  );
}

function isFinding(value: unknown): value is WebsiteDiagnosticFinding {
  if (!isRecord(value)) return false;
  return (
    typeof value.code === 'string' &&
    ['high', 'medium', 'low', 'info'].includes(String(value.severity)) &&
    typeof value.title === 'string' &&
    typeof value.location === 'string' &&
    typeof value.evidence === 'string' &&
    typeof value.recommendation === 'string' &&
    (value.repairPlan === undefined || isRepairPlan(value.repairPlan))
  );
}

function isReport(value: unknown): value is WebsiteDiagnosticReport {
  if (!isRecord(value)) return false;
  return (
    ['PASS', 'ISSUES_FOUND', 'INCOMPLETE'].includes(String(value.status)) &&
    typeof value.checkedAt === 'string' &&
    typeof value.origin === 'string' &&
    typeof value.requestedPath === 'string' &&
    Number.isSafeInteger(value.resourcesChecked) &&
    Number.isSafeInteger(value.resourceLimit) &&
    typeof value.scope === 'string' &&
    Array.isArray(value.findings) &&
    value.findings.every(isFinding) &&
    isStringArray(value.notes)
  );
}

function activeProjectId(): string {
  try {
    return window.localStorage.getItem('gouse_ai_active_project_id')?.trim() || '';
  } catch {
    return '';
  }
}

const severityClasses: Record<DiagnosticSeverity, string> = {
  high: 'border-rose-500/30 bg-rose-500/10 text-rose-200',
  medium: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  low: 'border-sky-500/30 bg-sky-500/10 text-sky-200',
  info: 'border-slate-600 bg-slate-800 text-slate-300',
};

const statusClasses: Record<DiagnosticStatus, string> = {
  PASS: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  ISSUES_FOUND: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  INCOMPLETE: 'border-sky-500/30 bg-sky-500/10 text-sky-200',
};

export const WebsiteDiagnosticsPanel: React.FC = () => {
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [report, setReport] = useState<WebsiteDiagnosticReport | null>(null);
  const [error, setError] = useState('');

  async function runDiagnostics(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError('');
    setReport(null);

    const projectId = activeProjectId();
    if (!projectId) {
      setError('Select an authorized project in the workspace before running diagnostics.');
      return;
    }
    if (!url.trim()) {
      setError('Enter the full URL of a website you are authorized to assess.');
      return;
    }

    setScanning(true);
    try {
      const response = await apiFetch('/api/website/diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      }, projectId);
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message = isRecord(payload) && typeof payload.error === 'string'
          ? payload.error
          : 'Website diagnostics could not be completed.';
        throw new Error(message);
      }
      if (!isReport(payload)) {
        throw new Error('The diagnostic service returned an invalid report.');
      }
      setReport(payload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Website diagnostics failed. Please retry.');
    } finally {
      setScanning(false);
    }
  }

  return (
    <section className="rounded-2xl border border-cyan-500/20 bg-slate-900/90 p-5 sm:p-6" aria-labelledby="website-diagnostics-title">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-cyan-300">
            <ShieldCheck className="h-4 w-4" /> Authorized website checks
          </div>
          <h2 id="website-diagnostics-title" className="mt-2 text-xl font-semibold text-white">Website Error Diagnostics</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Check an approved website for HTTP errors, broken same-origin links/assets, missing HTML titles, and mixed-content references.
            Findings include repair proposals, verification steps, and rollback guidance.
          </p>
        </div>
        <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-200">
          <ShieldCheck className="h-3.5 w-3.5" /> Read-only
        </span>
      </div>

      <form onSubmit={runDiagnostics} className="mt-5 space-y-3">
        <label htmlFor="saqlain-website-url" className="block text-xs font-medium text-slate-300">Website URL</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="saqlain-website-url"
            type="url"
            inputMode="url"
            autoComplete="url"
            required
            maxLength={2048}
            value={url}
            onChange={event => setUrl(event.target.value)}
            placeholder="https://www.example.com/"
            className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15"
          />
          <button
            type="submit"
            disabled={scanning}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-wait disabled:opacity-50"
          >
            {scanning ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-700 border-t-transparent" /> Checking…</> : <><FileSearch className="h-4 w-4" /> Analyze website</>}
          </button>
        </div>
        <p className="text-xs leading-5 text-slate-500">
          Requires Firebase sign-in, project membership, an exact server-side hostname allowlist, and working audit storage.
          Query strings, fragments, custom ports, and unapproved hosts are rejected. Only scan sites you are authorized to assess.
        </p>
      </form>

      {error && (
        <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {report && (
        <div className="mt-6 space-y-4" aria-live="polite">
          <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={'rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ' + statusClasses[report.status]}>
                  {report.status.replace('_', ' ')}
                </span>
                <span className="font-mono text-xs text-slate-300">{report.resourcesChecked}/{report.resourceLimit} resources checked</span>
              </div>
              <div className="mt-2 break-all text-sm text-white">{report.origin}{report.requestedPath}</div>
              <div className="mt-1 text-[11px] text-slate-500">Checked {new Date(report.checkedAt).toLocaleString()} · {report.findings.length} finding(s)</div>
            </div>
            {report.status === 'PASS' ? <CheckCircle2 className="h-7 w-7 text-emerald-300" /> : <ShieldAlert className="h-7 w-7 text-amber-300" />}
          </div>

          {report.findings.length === 0 ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-100">
              No issues were found within this diagnostic's limited scope. This is not a full penetration test or a guarantee that the website is secure.
            </div>
          ) : (
            <div className="space-y-3">
              {report.findings.map((finding, index) => (
                <article key={finding.code + ':' + finding.location + ':' + index} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={'rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ' + severityClasses[finding.severity]}>{finding.severity}</span>
                        <span className="font-mono text-[10px] text-slate-600">{finding.code}</span>
                      </div>
                      <h3 className="mt-2 font-semibold text-white">{finding.title}</h3>
                      <p className="mt-1 break-all font-mono text-xs text-slate-400">{finding.location}</p>
                    </div>
                  </div>
                  <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                    <div className="text-xs font-medium text-slate-200">Evidence</div>
                    <p className="mt-1 text-sm leading-5 text-slate-400">{finding.evidence}</p>
                    <div className="mt-3 text-xs font-medium text-cyan-200">Recommendation</div>
                    <p className="mt-1 text-sm leading-5 text-slate-300">{finding.recommendation}</p>
                  </div>
                  {finding.repairPlan && (
                    <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-amber-100">
                        <Wrench className="h-4 w-4" /> Proposed repair · {finding.repairPlan.actionType}
                      </div>
                      <p className="mt-1 text-xs text-amber-200/80">
                        Approval required. No website change was applied.
                      </p>
                      <div className="mt-3 grid gap-4 lg:grid-cols-2">
                        <div>
                          <div className="text-xs font-semibold text-slate-200">Suggested steps</div>
                          <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs leading-5 text-slate-400">
                            {finding.repairPlan.steps.map((step, stepIndex) => <li key={stepIndex}>{step}</li>)}
                          </ol>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-200">Verification</div>
                          <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-400">
                            {finding.repairPlan.verification.map((step, stepIndex) => (
                              <li key={stepIndex} className="flex items-start gap-1.5"><ClipboardCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300" />{step}</li>
                            ))}
                          </ul>
                          <div className="mt-3 text-xs font-semibold text-slate-200">Rollback guidance</div>
                          <p className="mt-1 text-xs leading-5 text-slate-400">{finding.repairPlan.rollbackGuidance}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}

          {report.notes.length > 0 && (
            <details className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <summary className="cursor-pointer text-xs font-semibold text-slate-300">Scope and limitations</summary>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-slate-500">
                {report.notes.map((note, index) => <li key={index}>{note}</li>)}
              </ul>
            </details>
          )}
          <div className="text-[11px] leading-5 text-slate-600">
            Diagnostics are read-only. They do not execute JavaScript, sign in to protected pages, submit forms, or modify remote content.
            Cross-origin destinations are not fetched. <ExternalLink className="inline h-3 w-3" /> Live repair requires a separate owner-approved change workflow.
          </div>
        </div>
      )}
    </section>
  );
};
