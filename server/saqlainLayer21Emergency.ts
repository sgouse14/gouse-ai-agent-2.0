/**
 * Layer 21 — Gouse AI emergency recovery agent.
 * Isolated from the normal agent team and intended for authorized emergency
 * recovery/testing only. It is not an offensive or external attack agent.
 */

export type Layer21Status = 'READY' | 'AUTHORIZED' | 'WORKING' | 'EXPIRED' | 'LOCKED';

export interface Layer21Authorization {
  tokenId: string;
  issuedAt: string;
  expiresAt: string;
  used: boolean;
  status: Layer21Status;
}

export const LAYER_21_RULES = Object.freeze({
  name: 'Layer 21 Emergency Agent',
  controlledBy: 'gouse-ai',
  networkRequired: false,
  uniqueAgentId: false,
  authorizationIsSingleUse: true,
  authorizationLifetimeMinutes: 1,
  mayDeleteProtectedFiles: false,
  mayOverwriteProtectedFiles: false,
  mayRepairRecoveryCopies: true,
  mayTrainInSandbox: true,
  mayModifyProductionCodeWithoutReview: false,
  mayAttackExternalSystems: false,
});

export function authorizeLayer21(input: {
  tokenId: string;
  issuedAt: string;
  now?: Date;
  lifetimeMinutes?: number;
}): Layer21Authorization {
  if (!input.tokenId) throw new Error('A one-time Layer 21 authorization token is required.');
  const now = input.now ?? new Date();
  const lifetime = input.lifetimeMinutes ?? LAYER_21_RULES.authorizationLifetimeMinutes;
  if (lifetime <= 0) throw new Error('Token lifetime must be positive.');
  const issued = new Date(input.issuedAt);
  if (Number.isNaN(issued.getTime())) throw new Error('Invalid issuedAt timestamp.');
  return {
    tokenId: input.tokenId,
    issuedAt: issued.toISOString(),
    expiresAt: new Date(issued.getTime() + lifetime * 60_000).toISOString(),
    used: false,
    status: 'AUTHORIZED',
  };
}

export function consumeLayer21Authorization(
  authorization: Layer21Authorization,
  now = new Date(),
): Layer21Authorization {
  if (authorization.used) throw new Error('Layer 21 token has already been used.');
  if (new Date(authorization.expiresAt).getTime() <= now.getTime()) {
    return { ...authorization, status: 'EXPIRED' };
  }
  return { ...authorization, used: true, status: 'WORKING' };
}

export function expireLayer21(
  authorization: Layer21Authorization,
  now = new Date(),
): Layer21Authorization {
  if (new Date(authorization.expiresAt).getTime() <= now.getTime()) {
    return { ...authorization, status: 'EXPIRED' };
  }
  return authorization;
}
