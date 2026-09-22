/**
 * India compliance monitoring policy for Gouse AI / Saqlain AI.
 * This module tracks compliance work; it does not provide legal advice.
 * Human/legal review is required before changing production behavior for a new law.
 */

export interface ComplianceNotice {
  id: string;
  jurisdiction: 'IN';
  title: string;
  source: string;
  detectedAt: string;
  requiresHumanLegalReview: true;
  automaticProductionChange: false;
}

export const SAQLAIN_INDIA_COMPLIANCE_RULES = Object.freeze({
  jurisdiction: 'IN',
  monitorApplicableLawsAndRegulations: true,
  monitorGovernmentGuidance: true,
  protectPersonalData: true,
  maintainSecurityAuditRecords: true,
  requireAccessControls: true,
  requireHumanLegalReviewForRegulatoryChanges: true,
  allowUnreviewedAutomaticProductionPolicyChange: false,
});

export function createComplianceNotice(input: {
  id: string;
  title: string;
  source: string;
  detectedAt?: string;
}): ComplianceNotice {
  return {
    id: input.id,
    jurisdiction: 'IN',
    title: input.title,
    source: input.source,
    detectedAt: input.detectedAt ?? new Date().toISOString(),
    requiresHumanLegalReview: true,
    automaticProductionChange: false,
  };
}
