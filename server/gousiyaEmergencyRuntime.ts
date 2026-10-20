import {
  createGousiyaEmergencyState,
  type GousiyaEmergencyState,
} from './gousiyaEmergencyRecovery.ts';
import {
  createFirebaseIdentityTokenAuthenticator,
  createFirebaseRestTokenActivityChecker,
} from './gousiyaFirebaseApprovalVerifier.ts';
import {
  createGousiyaApprovalIssuer,
  createGousiyaApprovalTokenVerifier,
  type IssueGousiyaApprovalInput,
  type IssuedGousiyaApproval,
} from './gousiyaApprovalIssuer.ts';

function requiredEnv(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key]?.trim();
  if (!value) throw new Error('Required emergency-recovery configuration is missing: ' + key);
  return value;
}

interface SharedGousiyaConfig {
  projectId: string;
  signingSecret: string;
  auditFilePath: string;
}
function sharedConfig(env: NodeJS.ProcessEnv): SharedGousiyaConfig {
  return {
    projectId: requiredEnv(env, 'FIREBASE_PROJECT_ID'),
    signingSecret: requiredEnv(env, 'GOUSIYA_APPROVAL_SIGNING_SECRET'),
    auditFilePath: requiredEnv(env, 'GOUSIYA_AUDIT_FILE_PATH'),
  };
}

/** Creates the verifier used by emergency recovery; only server-signed approval attestations are accepted. */
export function createConfiguredGousiyaEmergencyState(
  env: NodeJS.ProcessEnv = process.env,
): GousiyaEmergencyState {
  const config = sharedConfig(env);
  const grantStoreFilePath = requiredEnv(env, 'GOUSIYA_GRANT_STORE_FILE_PATH');
  return createGousiyaEmergencyState({
    auditFilePath: config.auditFilePath,
    grantStoreFilePath,
    verifyApprovalToken: createGousiyaApprovalTokenVerifier({
      projectId: config.projectId,
      signingSecret: config.signingSecret,
    }),
  });
}

/**
 * Creates an internal approval issuer. Identity is verified from a Firebase
 * ID token, but approval roles are read only from a protected server-side
 * registry. No HTTP route is registered by this module.
 */
export function createConfiguredGousiyaApprovalIssuer(
  env: NodeJS.ProcessEnv = process.env,
): { issueApproval(input: IssueGousiyaApprovalInput): Promise<IssuedGousiyaApproval> } {
  const config = sharedConfig(env);
  const firebaseApiKey = requiredEnv(env, 'FIREBASE_WEB_API_KEY');
  const registryFilePath = requiredEnv(env, 'GOUSIYA_APPROVER_REGISTRY_PATH');
  const authenticateFirebaseIdentity = createFirebaseIdentityTokenAuthenticator({
    projectId: config.projectId,
    verifyFirebaseTokenIsActive: createFirebaseRestTokenActivityChecker({ apiKey: firebaseApiKey }),
  });
  return createGousiyaApprovalIssuer({
    projectId: config.projectId,
    signingSecret: config.signingSecret,
    registryFilePath,
    auditFilePath: config.auditFilePath,
    authenticateFirebaseIdentity,
  });
}

export function createConfiguredGousiyaApprovalRuntime(env: NodeJS.ProcessEnv = process.env): {
  emergencyState: GousiyaEmergencyState;
  approvalIssuer: ReturnType<typeof createConfiguredGousiyaApprovalIssuer>;
} {
  return {
    emergencyState: createConfiguredGousiyaEmergencyState(env),
    approvalIssuer: createConfiguredGousiyaApprovalIssuer(env),
  };
}
