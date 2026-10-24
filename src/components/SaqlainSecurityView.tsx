import { apiFetch } from '../apiClient';
import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bug,
  CheckCircle2,
  FileWarning,
  KeyRound,
  LockKeyhole,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { WebsiteDiagnosticsPanel } from './WebsiteDiagnosticsPanel';
import type {
  SaqlainFinding,
  SaqlainFindingCategory,
  SaqlainFindingStatus,
  SaqlainSecuritySummary,
  SaqlainSeverity,
} from '../types/saqlain';

interface Props {
  activeProjectName?: string;
}

interface SecurityDomain {
  title: string;
  description: string;
}

const severityRank: Record<SaqlainSeverity, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};

const categories: SaqlainFindingCategory[] = [
  'authentication',
  'authorization',
  'secrets',
  'api',
  'dependencies',
  'files',
  'ai-actions',
  'privacy',
  'configuration',
  'data-protection',
];

const statuses: SaqlainFindingStatus[] = ['open', 'acknowledged', 'resolved', 'accepted'];

const securityDomains: SecurityDomain[] = [
  { title: 'Identity & Access', description: 'Authentication and project membership' },
  { title: 'Secrets', description: 'API keys and environment configuration' },
  { title: 'AI Actions', description: 'Authorization before AI-driven mutations' },
  { title: 'Files', description: 'Uploads, parsing and content handling' },
  { title: 'APIs', description: 'Rate limits and request validation' },
  { title: 'Dependencies', description: 'Package vulnerability hygiene' },
];

function createInitialFindings(): SaqlainFinding[] {
  const timestamp = new Date().toISOString();

  return [
    {
      id: 'saq-state',
      title: 'Authoritative project state is browser-persisted',
      description:
        'Client-side persistence should not be treated as an authoritative or protected system of record for project or BOQ data.',
      category: 'privacy',
      severity: 'medium',
      status: 'open',
      recommendation:
        'Move authoritative records to authenticated server-side storage with project-level authorization and audit logging.',
      evidence: 'gouse_ai_projects / gouse_ai_boq_items',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'saq-ai',
      title: 'AI-driven mutations need an authorization gateway',
      description:
        'AI-generated actions that change project or BOQ data should be validated and authorized before execution.',
      category: 'ai-actions',
      severity: 'high',
      status: 'open',
      recommendation:
        'Validate action schema, actor permissions, project membership and approval requirements before mutation.',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];
}

function isFinding(value: unknown): value is SaqlainFinding {
  if (typeof value !== 'object' || value === null) return false;
  const finding = value as Partial<SaqlainFinding>;

  return (
    typeof finding.id === 'string' &&
    typeof finding.title === 'string' &&
    typeof finding.description === 'string' &&
    typeof finding.recommendation === 'string' &&
    typeof finding.createdAt === 'string' &&
    typeof finding.updatedAt === 'string' &&
    categories.includes(finding.category as SaqlainFindingCategory) &&
    Object.hasOwn(severityRank, finding.severity as string) &&
    statuses.includes(finding.status as SaqlainFindingStatus)
  );
}

function isSecuritySummary(value: unknown): value is SaqlainSecuritySummary {
  if (typeof value !== 'object' || value === null) return false;
  const summary = value as Partial<SaqlainSecuritySummary>;

  return (
    summary.agent === 'Saqlain AI Agent' &&
    typeof summary.target === 'string' &&
    typeof summary.scannedAt === 'string' &&
    typeof summary.riskScore === 'number' &&
    Array.isArray(summary.findings) &&
    summary.findings.every(isFinding) &&
    Array.isArray(summary.checks) &&
    summary.checks.every(
      (check) =>
        typeof check?.name === 'string' &&
        typeof check?.detail === 'string' &&
        ['pass', 'warn', 'fail'].includes(check?.status),
    )
  );
}

export const SaqlainSecurityView: React.FC<Props> = ({ activeProjectName }) => {
  const [findings, setFindings] = useState<SaqlainFinding[]>(createInitialFindings);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<SaqlainSecuritySummary | null>(null);

  const orderedFindings = useMemo(
    () => [...findings].sort((a, b) => severityRank[b.severity] - severityRank[a.severity]),
    [findings],
  );

  const openFindings = findings.filter((finding) => finding.status !== 'resolved');
  const riskScore = Math.min(
    100,
    openFindings.reduce((total, finding) => total + severityRank[finding.severity] * 8, 0),
  );
  const target = activeProjectName?.trim() || 'Gouse AI workspace';

  async function refreshSummary(): Promise<void> {
    setRefreshing(true);

    try {
      const response = await apiFetch('/api/security/saqlain/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      });

      if (!response.ok) {
        throw new Error('The security summary endpoint returned an error.');
      }

      const payload: unknown = await response.json();
      if (!isSecuritySummary(payload)) {
        throw new Error('The security summary response was not valid.');
      }

      setFindings(payload.findings);
      setSummary(payload);
    } catch {
      setSummary({
        agent: 'Saqlain AI Agent',
        target,
        scannedAt: new Date().toISOString(),
        riskScore,
        findings,
        checks: [
          {
            name: 'Security summary API',
            status: 'warn',
            detail: 'The server summary is unavailable; the current local baseline findings are retained.',
          },
        ],
      });
    } finally {
      setRefreshing(false);
    }
  }

  function resolveFinding(findingId: string): void {
    const updatedAt = new Date().toISOString();
    setFindings((current) =>
      current.map((finding) =>
        finding.id === findingId ? { ...finding, status: 'resolved', updatedAt } : finding,
      ),
    );
  }

  return (
    <section className="mx-auto max-w-7xl space-y-5 px-4 py-6 lg:px-8">
      <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/90 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/10">
                <ShieldCheck className="h-6 w-6 text-cyan-300" />
              </div>
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-cyan-300">
                  Cybersecurity &amp; Security Operations
                </div>
                <h2 className="text-2xl font-semibold text-white">Saqlain AI Agent</h2>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-400">
              Security controls for identity, secrets, APIs, files, dependencies, AI actions and project access.
              Scope: <span className="text-slate-200">{target}</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={refreshSummary}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50"
          >
            <RefreshCw className={'h-4 w-4' + (refreshing ? ' animate-spin' : '')} />
            {refreshing ? 'Refreshing…' : 'Refresh Security Summary'}
          </button>
        </div>
      </div>

      <WebsiteDiagnosticsPanel />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Risk Score" value={riskScore + '/100'} icon={ShieldAlert} />
        <Metric
          label="Critical"
          value={String(openFindings.filter((finding) => finding.severity === 'critical').length)}
          icon={AlertTriangle}
        />
        <Metric
          label="High"
          value={String(openFindings.filter((finding) => finding.severity === 'high').length)}
          icon={Bug}
        />
        <Metric label="Open Findings" value={String(openFindings.length)} icon={FileWarning} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80">
          <div className="border-b border-slate-800 px-5 py-4">
            <h3 className="font-semibold text-white">Security Findings</h3>
            <p className="mt-1 text-xs text-slate-500">Prioritized by severity and status.</p>
            <p className="mt-2 text-[11px] text-slate-500">
              Resolutions are local to this browser session and are not yet persisted.
            </p>
          </div>
          <div className="divide-y divide-slate-800">
            {orderedFindings.map((finding) => (
              <article key={finding.id} className="p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={finding.severity} />
                      <span className="font-mono text-[10px] uppercase text-slate-500">
                        {finding.category}
                      </span>
                    </div>
                    <h4 className="mt-2 text-sm font-semibold text-white">{finding.title}</h4>
                    <p className="mt-1.5 text-xs leading-5 text-slate-400">{finding.description}</p>
                    <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-xs">
                      <div className="font-medium text-cyan-300">Recommendation</div>
                      <div className="mt-1 text-slate-400">{finding.recommendation}</div>
                    </div>
                    {finding.evidence && (
                      <div className="mt-2 font-mono text-[11px] text-slate-600">
                        Evidence: {finding.evidence}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={finding.status === 'resolved'}
                    onClick={() => resolveFinding(finding.id)}
                    className="inline-flex h-fit items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 disabled:opacity-40"
                  >
                    {finding.status === 'resolved' ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Resolved
                      </>
                    ) : (
                      'Mark resolved'
                    )}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <h3 className="flex items-center gap-2 font-semibold text-white">
              <LockKeyhole className="h-4 w-4 text-cyan-300" />
              Security Domains
            </h3>
            <div className="mt-4 space-y-3">
              {securityDomains.map((domain) => (
                <div key={domain.title} className="flex items-start gap-2.5">
                  <KeyRound className="h-4 w-4 text-slate-500" />
                  <div>
                    <div className="text-xs text-slate-200">{domain.title}</div>
                    <div className="text-[11px] text-slate-500">{domain.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <h3 className="font-semibold text-white">Latest Summary</h3>
            <div className="mt-3 text-xs text-slate-400">
              {summary?.scannedAt
                ? new Date(summary.scannedAt).toLocaleString()
                : 'No server summary has been requested yet.'}
            </div>
            {summary && (
              <p className="mt-2 text-xs text-slate-500">
                {summary.checks.filter((check) => check.status !== 'pass').length} check(s) need attention.
              </p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
};

interface MetricProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}

function Metric({ label, value, icon: Icon }: MetricProps): React.ReactElement {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[11px] uppercase tracking-wider text-slate-500">{label}</div>
        <Icon className="h-4 w-4 text-cyan-300" />
      </div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: SaqlainSeverity }): React.ReactElement {
  return (
    <span className="rounded border border-cyan-400/20 bg-cyan-500/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-cyan-300">
      {severity}
    </span>
  );
}
