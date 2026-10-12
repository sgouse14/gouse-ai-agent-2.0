import type { AgentIdentityState } from "./saqlainAgentIdentity";
import { verifyCurrentBinaryAgentId } from "./saqlainTaskIdentityIntegration";

export type GatekeeperDecision = "PASS" | "HOLD" | "BLOCK";

export type ExternalAccessRequest = {
  /** Current binary Agent ID presented by the requesting agent. */
  agentId: string;
  requestId: string;
  platformId: string;
  apiCredential: string;
  requestedScope: string[];
  sensitiveOperation?: boolean;
};

export type GatekeeperResult = {
  decision: GatekeeperDecision;
  requestId: string;
  reason: string;
  auditEvent: {
    actor: string;
    platformId: string;
    decision: GatekeeperDecision;
    timestamp: string;
  };
};

const PROTECTED_SCOPES = new Set([
  "security-layer", "protected-files", "original-files", "backup-control",
  "recovery-control", "agent-identity", "authorization-credentials",
]);
const ALLOWED_EXTERNAL_SCOPE = new Set([
  "public-api", "approved-api", "approved-agent-communication",
]);

/**
 * Compatibility/basic policy evaluator. This checks credential presence only,
 * not validity. Production request handlers should use
 * evaluateRegisteredAgentAccess with a trusted registry and verifier.
 */
export function evaluateExternalAccess(request: ExternalAccessRequest, now = new Date()): GatekeeperResult {
  const timestamp = now.toISOString();
  if (!request.requestId || !request.agentId || !request.platformId) {
    return result(request, "BLOCK", "Missing external identity/request identifiers.", timestamp);
  }
  if (!request.apiCredential) {
    return result(request, "BLOCK", "Missing API authorization credential.", timestamp);
  }
  if (request.requestedScope.some((scope) => PROTECTED_SCOPES.has(scope))) {
    return result(request, "BLOCK", "External access to protected Gouse AI resources is not permitted.", timestamp);
  }
  if (request.requestedScope.some((scope) => !ALLOWED_EXTERNAL_SCOPE.has(scope))) {
    return result(request, "HOLD", "Requested scope requires security verification.", timestamp);
  }
  if (request.sensitiveOperation) {
    return result(request, "HOLD", "Sensitive external operation requires Gouse Cyber Security AI verification.", timestamp);
  }
  return result(request, "PASS", "External request is within the approved access boundary.", timestamp);
}

/**
 * Registry-backed Gatekeeper entry point. The verifier must validate the
 * credential cryptographically or via a trusted credential service and bind it
 * to the stable agent key and platform ID. Never trust a client-supplied boolean.
 */
export function evaluateRegisteredAgentAccess(input: {
  request: ExternalAccessRequest;
  identityState: AgentIdentityState;
  verifyCredential: (args: { credential: string; agentKey: string; platformId: string; now: Date }) => boolean;
}, now = new Date()): GatekeeperResult {
  const { request, identityState, verifyCredential } = input;
  const timestamp = now.toISOString();

  if (!request.requestId || !request.agentId || !request.platformId) {
    return result(request, "BLOCK", "Missing external identity/request identifiers.", timestamp);
  }
  if (!request.apiCredential) {
    return result(request, "BLOCK", "Missing API authorization credential.", timestamp);
  }

  const registeredAgent = verifyCurrentBinaryAgentId(identityState, request.agentId);
  if (!registeredAgent) {
    return result(request, "BLOCK", "Unknown, inactive, unapproved, or retired binary Agent ID.", timestamp);
  }

  let credentialValid = false;
  try {
    credentialValid = verifyCredential({
      credential: request.apiCredential,
      agentKey: registeredAgent.agentKey,
      platformId: request.platformId,
      now,
    });
  } catch {
    credentialValid = false;
  }
  if (!credentialValid) {
    return result(request, "BLOCK", "Credential validation failed for this agent/platform binding.", timestamp);
  }

  return evaluateExternalAccess(request, now);
}

function result(request: ExternalAccessRequest, decision: GatekeeperDecision, reason: string, timestamp: string): GatekeeperResult {
  return {
    decision,
    requestId: request.requestId,
    reason,
    auditEvent: {
      actor: request.agentId || "unknown",
      platformId: request.platformId || "unknown",
      decision,
      timestamp,
    },
  };
}

export const SAQLAIN_GATEKEEPER_RULES = Object.freeze({
  blocksUnauthorizedExternalAgents: true,
  blocksUnauthorizedExternalApis: true,
  protectsSecurityLayer: true,
  protectsOriginalFiles: true,
  requiresRegisteredCurrentBinaryId: true,
  requiresCredentialValidation: true,
  requiresSecurityReviewForSensitiveOperations: true,
  allowsExternalTakeover: false,
  allowsExternalAttack: false,
  allowsProtectedDeletion: false,
  allowsProtectedOverwrite: false,
});
