import assert from "node:assert/strict";
import test from "node:test";
import {
  VERIFICATION_CHAIN_ROLES,
  createVerificationChain,
  getCurrentVerificationRole,
  resumeHeldVerificationChain,
  submitVerificationReview,
} from "./saqlainVerificationChain.ts";

function approveCurrent(chain: ReturnType<typeof createVerificationChain>, now: Date) {
  const role = getCurrentVerificationRole(chain);
  assert.ok(role);
  return submitVerificationReview(chain, {
    order: role.order,
    reviewerId: role.agentId,
    verdict: "APPROVED",
    evidenceRefs: [`report-evidence-${role.order}`],
    externalEvidenceSanitized: role.order === 11 ? true : undefined,
    now,
  });
}

test("chain requires 11 ordered, evidence-backed approvals and never grants access", () => {
  let chain = createVerificationChain({ chainId: "chain-001", reportRef: "report-001", now: new Date("2026-10-12T00:00:00.000Z") });
  assert.equal(VERIFICATION_CHAIN_ROLES.length, 11);
  for (let i = 1; i <= 11; i += 1) {
    assert.equal(getCurrentVerificationRole(chain)?.order, i);
    chain = approveCurrent(chain, new Date(`2026-10-12T00:${String(i).padStart(2, "0")}:00.000Z`));
    assert.equal(chain.grantsAccess, false);
  }
  assert.equal(chain.status, "VERIFIED");
  assert.equal(chain.reviews.length, 11);
  assert.equal(chain.auditEvents.at(-1)?.event, "CHAIN_VERIFIED");
});

test("reviews must be submitted by the assigned agent and include evidence", () => {
  const chain = createVerificationChain({ chainId: "chain-002", reportRef: "report-002" });
  assert.throws(() => submitVerificationReview(chain, {
    order: 1, reviewerId: "wrong-agent", verdict: "APPROVED", evidenceRefs: ["evidence-1"],
  }), /Reviewer identity/);
  assert.throws(() => submitVerificationReview(chain, {
    order: 1, reviewerId: "saq-threat-detection", verdict: "APPROVED", evidenceRefs: [],
  }), /evidence reference/);
});

test("HOLD stops the chain and can only resume through an audited re-review", () => {
  const chain = createVerificationChain({ chainId: "chain-003", reportRef: "report-003" });
  const held = submitVerificationReview(chain, {
    order: 1, reviewerId: "saq-threat-detection", verdict: "REVIEW_REQUIRED", evidenceRefs: ["anomaly-1"],
  });
  assert.equal(held.status, "HOLD");
  assert.equal(held.grantsAccess, false);
  assert.throws(() => submitVerificationReview(held, {
    order: 1, reviewerId: "saq-threat-detection", verdict: "APPROVED", evidenceRefs: ["recheck-1"],
  }), /in-progress/);
  const resumed = resumeHeldVerificationChain(held, new Date("2026-10-12T00:30:00.000Z"));
  assert.equal(resumed.status, "IN_PROGRESS");
  assert.equal(resumed.currentOrder, 1);
  assert.equal(resumed.auditEvents.at(-1)?.event, "CHAIN_RESUMED");
});

test("rejection is terminal and step 11 requires sanitized external evidence", () => {
  const rejected = submitVerificationReview(
    createVerificationChain({ chainId: "chain-004", reportRef: "report-004" }),
    { order: 1, reviewerId: "saq-threat-detection", verdict: "REJECTED", evidenceRefs: ["malicious-1"] },
  );
  assert.equal(rejected.status, "REJECTED");
  assert.throws(() => resumeHeldVerificationChain(rejected), /held chain/);

  let chain = createVerificationChain({ chainId: "chain-005", reportRef: "report-005" });
  for (let i = 1; i <= 10; i += 1) chain = approveCurrent(chain, new Date());
  assert.equal(getCurrentVerificationRole(chain)?.order, 11);
  assert.throws(() => submitVerificationReview(chain, {
    order: 11,
    reviewerId: "saq-external-intelligence",
    verdict: "APPROVED",
    evidenceRefs: ["external-message-1"],
    externalEvidenceSanitized: false,
  }), /sanitized/);
});
