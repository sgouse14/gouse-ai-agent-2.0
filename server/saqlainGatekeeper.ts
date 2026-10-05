export type GatekeeperDecision = "PASS" | "HOLD" | "BLOCK";

export type ExternalAccessRequest = {
  requestId: string;
  agentId: string;
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
  "security-layer",
  "protected-files",
  "original-files",
  "backup-control",
  "recovery-control",
  "agent-identity",
  "authorization-credentials",
]);

const ALLOWED_EXTERNAL_SCOPE = new Set([
  "public-api",
  "approved-api",
  "approved-agent-communication",
]);

export function evaluateExternalAccess(
  request: ExternalAccessRequest,
  now = new Date()
): GatekeeperResult {
  const timestamp = now.toISOString();

  if (!request.requestId || !request.agentId || !request.platformId) {
    return result(request, "BLOCK", "Missing external identity/request identifiers.", timestamp);
  }

  if (!request.apiCredential) {
    return result(request, "BLOCK", "Missing API authorization credential.", timestamp);
  }

  if (request.requestedScope.some((scope) => PROTECTED_SCOPES.has(scope))) {
    return result(
      request,
      "BLOCK",
      "External access to protected Gouse AI resources is not permitted.",
      timestamp
    );
  }

  if (request.requestedScope.some((scope) => !ALLOWED_EXTERNAL_SCOPE.has(scope))) {
    return result(request, "HOLD", "Requested scope requires security verification.", timestamp);
  }

  if (request.sensitiveOperation) {
    return result(
      request,
      "HOLD",
      "Sensitive external operation requires Gouse Cyber Security AI verification.",
      timestamp
    );
  }

  return result(request, "PASS", "External request is within the approved access boundary.", timestamp);
}

function result(
  request: ExternalAccessRequest,
  decision: GatekeeperDecision,
  reason: string,
  timestamp: string
): GatekeeperResult {
  return {
    decision,
    requestId: request.requestId,
    reason,
    auditEvent: {
      actor: request.agentId,
      platformId: request.platformId,
      decision,
      timestamp,
    },
  };
}

/**
 * Saqlain Gatekeeper is a defensive boundary.
 * It may reject/hold external requests but must never attack, take over,
 * delete, overwrite, or disable an external platform.
 */
export const SAQLAIN_GATEKEEPER_RULES = Object.freeze({
  blocksUnauthorizedExternalAgents: true,
  blocksUnauthorizedExternalApis: true,
  protectsSecurityLayer: true,
  protectsOriginalFiles: true,
  requiresSecurityReviewForSensitiveOperations: true,
  allowsExternalTakeover: false,
  allowsExternalAttack: false,
  allowsProtectedDeletion: false,
  allowsProtectedOverwrite: false,
});
