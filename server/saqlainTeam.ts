import type { SaqlainThreatAction } from './saqlainSecurity';

export type SaqlainTeamRole = 'core-security' | 'external-intelligence';

export interface SaqlainTeamAgent {
  id: string;
  name: string;
  role: SaqlainTeamRole;
  mission: string;
  allowedActions: SaqlainThreatAction[];
  canDeleteProtectedFiles: false;
  canOverwriteProtectedFiles: false;
  canEnterProtectedWorkspaceFromExternalParty: false;
}

export const SAQLAIN_SECURITY_TEAM: readonly SaqlainTeamAgent[] = Object.freeze([
  { id:'saq-threat-detection', name:'Threat Detection', role:'core-security', mission:'Detect suspicious requests, anomalies and attack patterns.', allowedActions:['monitor','block','isolate','contain'], canDeleteProtectedFiles:false, canOverwriteProtectedFiles:false, canEnterProtectedWorkspaceFromExternalParty:false },
  { id:'saq-malware-guard', name:'Malware Guard', role:'core-security', mission:'Inspect and quarantine untrusted or suspicious files and payloads.', allowedActions:['monitor','quarantine','isolate','contain'], canDeleteProtectedFiles:false, canOverwriteProtectedFiles:false, canEnterProtectedWorkspaceFromExternalParty:false },
  { id:'saq-network-guard', name:'Network Guard', role:'core-security', mission:'Protect network and API boundaries from unauthorized or abusive traffic.', allowedActions:['monitor','block','isolate','contain'], canDeleteProtectedFiles:false, canOverwriteProtectedFiles:false, canEnterProtectedWorkspaceFromExternalParty:false },
  { id:'saq-code-guardian', name:'Code Guardian', role:'core-security', mission:'Protect source code and development artifacts from unauthorized changes or export.', allowedActions:['monitor','block','quarantine','isolate'], canDeleteProtectedFiles:false, canOverwriteProtectedFiles:false, canEnterProtectedWorkspaceFromExternalParty:false },
  { id:'saq-agent-guard', name:'Agent Guard', role:'core-security', mission:'Authenticate and authorize AI agents at the Gouse AI boundary.', allowedActions:['monitor','block','isolate'], canDeleteProtectedFiles:false, canOverwriteProtectedFiles:false, canEnterProtectedWorkspaceFromExternalParty:false },
  { id:'saq-api-guardian', name:'API Guardian', role:'core-security', mission:'Protect API endpoints with authorization, throttling and abuse controls.', allowedActions:['monitor','block','isolate','contain'], canDeleteProtectedFiles:false, canOverwriteProtectedFiles:false, canEnterProtectedWorkspaceFromExternalParty:false },
  { id:'saq-identity-guard', name:'Identity Guard', role:'core-security', mission:'Protect sessions, credentials, tokens and access boundaries.', allowedActions:['monitor','block','isolate','recover'], canDeleteProtectedFiles:false, canOverwriteProtectedFiles:false, canEnterProtectedWorkspaceFromExternalParty:false },
  { id:'saq-data-guardian', name:'Data Guardian', role:'core-security', mission:'Protect databases, project data and controlled data egress.', allowedActions:['monitor','block','isolate','recover'], canDeleteProtectedFiles:false, canOverwriteProtectedFiles:false, canEnterProtectedWorkspaceFromExternalParty:false },
  { id:'saq-audit-agent', name:'Audit Agent', role:'core-security', mission:'Record, correlate and preserve security events for investigation.', allowedActions:['monitor'], canDeleteProtectedFiles:false, canOverwriteProtectedFiles:false, canEnterProtectedWorkspaceFromExternalParty:false },
  { id:'saq-recovery-agent', name:'Recovery Agent', role:'core-security', mission:'Coordinate non-destructive recovery, restoration and validation.', allowedActions:['monitor','isolate','recover'], canDeleteProtectedFiles:false, canOverwriteProtectedFiles:false, canEnterProtectedWorkspaceFromExternalParty:false },
  { id:'saq-external-intelligence', name:'External Intelligence & Communication', role:'external-intelligence', mission:'Communicate with outside agents, collect messages and recent threat intelligence, sanitize it, and pass it to Saqlain for a decision. It never grants external agents direct access to Gouse AI.', allowedActions:['monitor','block','isolate'], canDeleteProtectedFiles:false, canOverwriteProtectedFiles:false, canEnterProtectedWorkspaceFromExternalParty:false },
]);

export const SAQLAIN_TEAM_SIZE = SAQLAIN_SECURITY_TEAM.length;

export function buildExternalAgentMessageEnvelope(input: { sourceAgent: string; message: string; receivedAt?: string }) {
  return {
    channel: 'external-intelligence',
    sourceAgent: input.sourceAgent,
    message: input.message,
    receivedAt: input.receivedAt ?? new Date().toISOString(),
    directGouseAiAccess: false as const,
    requiresSaqlainDecision: true as const,
  };
}
