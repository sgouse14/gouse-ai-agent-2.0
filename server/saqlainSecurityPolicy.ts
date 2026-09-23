/** Saqlain defensive policy. */
export type SaqlainActionDecision = 'allow' | 'review' | 'block';

const NEVER_ALLOWED = new Set([
  'delete_project','delete_document','delete_file','overwrite_source',
  'delete_saqlain','delete_gouse_ai','disable_saqlain','disable_gouse_ai',
  'attack_saqlain','attack_gouse_ai','change_peer_permissions',
  'destroy_peer_backup','destroy_peer_data','external_takeover','external_retaliation',
]);

const PROTECTED_EXPORTS = new Set([
  'export_source','download_source','bulk_copy_source','copy_protected_code',
  'upload_source_external','send_source_external','exfiltrate_project_data',
]);

export const SAQLAIN_MAX_DEFENSIVE_AUTHORITY = Object.freeze({
  allowThreatDetection: true,
  allowThreatBlocking: true,
  allowSessionTermination: true,
  allowExternalSessionIsolation: true,
  allowFileQuarantine: true,
  allowCredentialRevocation: true,
  allowApiRateLimiting: true,
  allowEmergencyContainment: true,
  allowSecurityAgentCreation: true,
  allowSecuritySelfImprovement: true,
  allowRecoveryRequests: true,
  allowDelete: false,
  allowOverwrite: false,
  allowDestructiveMutation: false,
  allowSelfPrivilegeEscalation: false,
  allowExternalRetaliation: false,
  allowPeerAttack: false,
  allowPeerDeletion: false,
  allowPeerOverwrite: false,
  allowPeerDisable: false,
  allowPeerPermissionChange: false,
  allowPeerDataDestruction: false,
});

export function evaluateSaqlainAction(actionType: unknown): { decision: SaqlainActionDecision; reason: string } {
  const action = typeof actionType === 'string' ? actionType : '';
  if (!action) return { decision: 'block', reason: 'Missing action type.' };
  if (NEVER_ALLOWED.has(action)) return { decision: 'block', reason: 'Action is permanently forbidden by Saqlain safety policy.' };
  if (PROTECTED_EXPORTS.has(action)) return { decision: 'block', reason: 'Protected source/data export is blocked at the Gouse AI boundary.' };
  return { decision: 'allow', reason: 'Action passed the Saqlain policy layer; application authorization still applies.' };
}

export function buildPeerCompromiseResponse(peer: 'gouse-ai' | 'saqlain') {
  return { peer, action: 'contain-preserve-log-verify-recover', mayDeletePeer: false, mayAttackPeer: false, mayDisablePeer: false, mayDestroyPeerData: false } as const;
}
