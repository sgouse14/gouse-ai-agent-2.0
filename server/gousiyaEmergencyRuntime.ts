import {
  createGousiyaEmergencyState,
  type GousiyaEmergencyState,
} from './gousiyaEmergencyRecovery.ts';
import {
  createFirebaseGousiyaApprovalVerifier,
  createFirebaseAdminTokenActivityChecker,
  type FirebaseAdminAuthLike,
} from './gousiyaFirebaseApprovalVerifier.ts';

function requiredEnv(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key]?.trim();
  if (!value) throw new Error('Required emergency-recovery configuration is missing: ' + key);
  return value;
}

export interface ConfiguredGousiyaEmergencyRuntimeOptions {
  env?: NodeJS.ProcessEnv;
  /** A real Firebase Admin Auth instance. Its verifyIdToken method is called with checkRevoked=true. */
  firebaseAdminAuth: FirebaseAdminAuthLike;
}

/**
 * Builds internal emergency-recovery state from explicit server configuration.
 * This deliberately does not mount or start an HTTP endpoint. There is no
 * default for the account-status checker: callers must wire the authoritative
 * server-side Firebase revocation check before this runtime can be constructed.
 * A shared transactional database is still required for multi-host deployments.
 */
export function createConfiguredGousiyaEmergencyState(
  options: ConfiguredGousiyaEmergencyRuntimeOptions,
): GousiyaEmergencyState {
  if (!options?.firebaseAdminAuth || typeof options.firebaseAdminAuth.verifyIdToken !== 'function') {
    throw new Error('A Firebase Admin Auth instance is required for account-status and token-revocation checks.');
  }
  const env = options.env ?? process.env;
  const projectId = requiredEnv(env, 'FIREBASE_PROJECT_ID');
  const auditFilePath = requiredEnv(env, 'GOUSIYA_AUDIT_FILE_PATH');
  const grantStoreFilePath = requiredEnv(env, 'GOUSIYA_GRANT_STORE_FILE_PATH');
  return createGousiyaEmergencyState({
    auditFilePath,
    grantStoreFilePath,
    verifyApprovalToken: createFirebaseGousiyaApprovalVerifier({
      projectId,
      verifyFirebaseTokenIsActive: createFirebaseAdminTokenActivityChecker(options.firebaseAdminAuth),
    }),
  });
}
