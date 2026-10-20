import {
  createGousiyaEmergencyState,
  type GousiyaEmergencyState,
} from './gousiyaEmergencyRecovery.ts';
import {
  createFirebaseGousiyaApprovalVerifier,
  createFirebaseRestTokenActivityChecker,
} from './gousiyaFirebaseApprovalVerifier.ts';

function requiredEnv(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key]?.trim();
  if (!value) throw new Error('Required emergency-recovery configuration is missing: ' + key);
  return value;
}

/**
 * Builds internal emergency-recovery state using a real Firebase account lookup
 * for disabled-account and token-revocation checks. It does not mount an HTTP
 * endpoint. The API key must be restricted to the Identity Toolkit API, and the
 * approval custom claim must still be minted only by a trusted server service.
 * A shared transactional database is required for multi-host deployments.
 */
export function createConfiguredGousiyaEmergencyState(
  env: NodeJS.ProcessEnv = process.env,
): GousiyaEmergencyState {
  const projectId = requiredEnv(env, 'FIREBASE_PROJECT_ID');
  const firebaseApiKey = requiredEnv(env, 'FIREBASE_WEB_API_KEY');
  const auditFilePath = requiredEnv(env, 'GOUSIYA_AUDIT_FILE_PATH');
  const grantStoreFilePath = requiredEnv(env, 'GOUSIYA_GRANT_STORE_FILE_PATH');
  return createGousiyaEmergencyState({
    auditFilePath,
    grantStoreFilePath,
    verifyApprovalToken: createFirebaseGousiyaApprovalVerifier({
      projectId,
      verifyFirebaseTokenIsActive: createFirebaseRestTokenActivityChecker({ apiKey: firebaseApiKey }),
    }),
  });
}
