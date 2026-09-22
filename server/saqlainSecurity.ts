import type { Request } from 'express';

export type SaqlainActionDecision = 'allow' | 'review' | 'block';

const HIGH_IMPACT_ACTIONS = new Set([
  'delete_project','delete_document','delete_file','overwrite_source',
  'publish_external','rotate_secret','change_permissions','disable_security',
]);
const MUTATING_ACTIONS = new Set([
  'add_boq_item','update_boq_item','update_contingency','update_area','run_audit',
  ...HIGH_IMPACT_ACTIONS,
]);

export function evaluateSaqlainAction(input: {
  actionType?: unknown;
  projectId?: unknown;
  actorAuthenticated?: boolean;
  approvalGranted?: boolean;
}): { decision: SaqlainActionDecision; reason: string } {
  const actionType = typeof input.actionType === 'string' ? input.actionType : '';
  if (!actionType) return { decision: 'block', reason: 'Missing action type.' };

  // Saqlain has no delete capability. Delete/destructive requests are always blocked.
  if (HIGH_IMPACT_ACTIONS.has(actionType)) {
    return { decision: 'block', reason: 'Saqlain policy permanently forbids destructive or delete actions.' };
  }
  if (!MUTATING_ACTIONS.has(actionType)) {
    return { decision: 'allow', reason: 'Read-only or non-mutating action.' };
  }
  if (!input.actorAuthenticated) {
    return { decision: 'block', reason: 'Authenticated actor is required for state mutation.' };
  }
  if (!input.projectId || typeof input.projectId !== 'string') {
    return { decision: 'block', reason: 'Project scope is required for state mutation.' };
  }
  if (!input.approvalGranted) {
    return { decision: 'review', reason: 'Explicit human approval is required before mutating project state.' };
  }
  return { decision: 'allow', reason: 'Saqlain policy checks passed; continue with application authorization and audit logging.' };
}

export function buildSaqlainSecuritySummary(req: Request) {
  const now = new Date().toISOString();
  const target = req.body?.target || 'Gouse AI workspace';
  const findings = [
    { id:'saq-local-storage', title:'Authoritative project state is browser-persisted', description:'Client-side persistence should not be treated as an authoritative or protected system of record.', category:'privacy', severity:'medium', status:'open', recommendation:'Move authoritative records to authenticated server-side storage with project-level authorization and audit logging.', evidence:'gouse_ai_projects / gouse_ai_boq_items', createdAt:now, updatedAt:now },
    { id:'saq-ai-mutation-gateway', title:'AI-driven state mutations need a server-side authorization gateway', description:'AI-generated actions that modify project or BOQ data should be schema-validated, authorized, logged and optionally approved.', category:'ai-actions', severity:'high', status:'open', recommendation:'Validate action type, actor permissions, project membership and approval requirements before mutation.', createdAt:now, updatedAt:now },
    { id:'saq-auth-boundary', title:'Authentication and project authorization boundary needs enforcement', description:'Project-scoped APIs should not rely on client-supplied identity or project IDs as the security boundary.', category:'authentication', severity:'high', status:'open', recommendation:'Add session/token authentication and enforce project membership on every project-scoped endpoint.', createdAt:now, updatedAt:now },
    { id:'saq-rate-limit', title:'AI endpoints need rate limiting and abuse controls', description:'AI and search endpoints can create variable provider cost and require throttling in production.', category:'api', severity:'medium', status:'open', recommendation:'Apply per-user/IP limits, payload ceilings, timeouts and provider quota monitoring.', createdAt:now, updatedAt:now },
    { id:'saq-file-upload', title:'File processing needs an explicit trust boundary', description:'Uploaded drawings and PDFs are untrusted input and require validation before parsing or forwarding to AI services.', category:'files', severity:'medium', status:'open', recommendation:'Validate MIME type and size, quarantine uploads, sanitize filenames and scan content before processing.', createdAt:now, updatedAt:now },
  ];
  const riskScore = Math.min(100, findings.reduce((sum,f)=>sum+(f.severity==='high'?22:f.severity==='medium'?12:4),0));
  return { agent:'Saqlain AI Agent', target, scannedAt:now, riskScore, findings, checks:[
    { name:'Authentication boundary', status:'warn', detail:'Server-side identity and project membership enforcement should be added.' },
    { name:'AI action gateway', status:'warn', detail:'Mutating AI actions should pass through an authorization gateway.' },
    { name:'Request abuse controls', status:'warn', detail:'Rate limits and provider quota protection should be enabled for production.' },
    { name:'File trust boundary', status:'warn', detail:'Uploaded documents require validation and isolation before parsing.' },
    { name:'Health endpoint', status:'pass', detail:'Application health endpoint is available.' },
  ] };
}
