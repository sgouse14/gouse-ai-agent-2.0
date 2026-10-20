import {
  createGousiyaEmergencyState,
  type GousiyaEmergencyState,
} from './gousiyaEmergencyRecovery.ts';
import { createFirebaseGousiyaApprovalVerifier } from './gousiyaFirebaseApprovalVerifier.ts';

function requiredEnv(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key]?.trim();
  if (!value) throw new Error('Required emergency-recovery configuration is missing: ' + key);
  return value;
}

/**
 * Builds the internal emergency-recovery state from explicit server settings.
 * This deliberately does not mount or start an HTTP endpoint. It also does not
 * make the workflow production-ready: the approval claim must be minted by a
 * trusted server-side approval service, account/token revocation must be checked
 * by the hosting identity layer, and a shared transactional store is required
 * for multi-host deployments.
 */
export function createConfiguredGousiyaEmergencyState(
  env: NodeJS.ProcessEnv = process.env,
): GousiyaEmergencyState {
  const projectId = requiredEnv(env, 'FIREBASE_PROJECT_ID');
  const auditFilePath = requiredEnv(env, 'GOUSIYA_AUDIT_FILE_PATH');
  const grantStoreFilePath = requiredEnv(env, 'GOUSIYA_GRANT_STORE_FILE_PATH');
  return createGousiyaEmergencyState({
    auditFilePath,
    grantStoreFilePath,
    verifyApprovalToken: createFirebaseGousiyaApprovalVerifier({ projectId }),
  });
}
