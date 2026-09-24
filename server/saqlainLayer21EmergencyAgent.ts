/**
 * Layer 21 Emergency Agent
 *
 * Emergency recovery/verification layer controlled by Gouse AI.
 * It is deliberately separate from the normal agent-ID sequence.
 * The emergency token rotates every minute; the real secret/token material
 * must be supplied by a secure runtime secret store, never hard-coded here.
 */

export const LAYER_21 = Object.freeze({
  name: 'Layer 21',
  controller: 'gouse-ai',
  purpose: 'emergency-recovery-and-verification',
  normalUniqueId: null,
  tokenRotationMinutes: 1,
  canDeleteFiles: false,
  canRepairCopies: true,
  canWriteAuditReports: true,
});

export interface Layer21Token {
  tokenId: string;
  issuedAt: string;
  expiresAt: string;
}

export interface Layer21Report {
  tokenId: string;
  action: 'VERIFY' | 'RECOVER_COPY' | 'QUARANTINE_REVIEW';
  target: string;
  result: 'PASS' | 'FAIL' | 'REVIEW_REQUIRED';
  createdAt: string;
  managerReference: string;
  saqlainReference: string;
}

/** Generate a short-lived token identifier. Store authentication secrets outside source control. */
export function issueLayer21Token(now = new Date()): Layer21Token {
  const issuedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + 60_000).toISOString();
  const tokenId = `L21-${now.getTime().toString(36)}-${cryptoRandomPart()}`;
  return { tokenId, issuedAt, expiresAt };
}

function cryptoRandomPart(): string {
  // Runtime should provide a cryptographically secure RNG.
  // This fallback is only an opaque identifier and is not an authentication secret.
  return Math.random().toString(36).slice(2, 10);
}

export function isLayer21TokenValid(token: Layer21Token, now = new Date()): boolean {
  return new Date(token.expiresAt).getTime() > now.getTime();
}

/** Layer 21 may repair verified copies, but it can never delete originals. */
export function assertLayer21Action(action: Layer21Report['action'], targetsOriginal: boolean): void {
  if (targetsOriginal && action === 'RECOVER_COPY') {
    throw new Error('Layer 21 cannot modify the protected original; recovery must target a copy.');
  }
}

/** Emergency results are written to the Manager and Saqlain audit trail. */
export function buildLayer21Handoff(report: Layer21Report) {
  return Object.freeze({
    report,
    manager: 'record-and-verify',
    saqlain: 'security-review',
    gouseAi: 'controller',
    duplicateReportCreated: false,
  });
}
