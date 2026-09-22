export type SaqlainSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type SaqlainFindingStatus = 'open' | 'acknowledged' | 'resolved' | 'accepted';
export type SaqlainFindingCategory = 'authentication' | 'authorization' | 'secrets' | 'api' | 'dependencies' | 'files' | 'ai-actions' | 'privacy' | 'configuration';

export interface SaqlainFinding {
  id: string;
  title: string;
  description: string;
  category: SaqlainFindingCategory;
  severity: SaqlainSeverity;
  status: SaqlainFindingStatus;
  recommendation: string;
  evidence?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaqlainSecuritySummary {
  agent: 'Saqlain AI Agent';
  target: string;
  scannedAt: string;
  riskScore: number;
  findings: SaqlainFinding[];
  checks: { name: string; status: 'pass' | 'warn' | 'fail'; detail: string }[];
}
