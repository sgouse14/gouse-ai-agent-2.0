import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createGousiyaRecoveryWorkflow,
  transitionGousiyaRecoveryWorkflow,
  type GousiyaRecoveryWorkflow,
} from './gousiyaRecoveryOrchestration.ts';

function makeWorkflow(): GousiyaRecoveryWorkflow {
  return createGousiyaRecoveryWorkflow({
    workflowId: 'gousiya-workflow-001',
    incidentId: 'incident-001',
    actorId: 'operator-a',
    reason: 'begin controlled recovery',
    now: new Date('2026-01-01T00:00:00.000Z'),
  });
}

function move(workflow: GousiyaRecoveryWorkflow, to: Parameters<typeof transitionGousiyaRecoveryWorkflow>[1]['to'], extra: Record<string, unknown> = {}) {
  return transitionGousiyaRecoveryWorkflow(workflow, {
    expectedVersion: workflow.version,
    to,
    actorId: 'operator-a',
    reason: 'approved workflow step',
    ...extra,
  } as Parameters<typeof transitionGousiyaRecoveryWorkflow>[1], new Date('2026-01-01T00:01:00.000Z'));
}

test('Gousiya orchestration requires evidence and distinct independent approvals', () => {
  const initial = makeWorkflow();
  assert.throws(() => move(initial, 'SNAPSHOT_VALIDATED'), /evidence/);
  const snapshot = move(initial, 'SNAPSHOT_VALIDATED', { evidenceId: 'snapshot-hash-001' });
  const approval = move(snapshot, 'APPROVAL_PENDING');
  assert.throws(() => move(approval, 'GRANT_ISSUED', {
    evidenceId: 'grant-001', ownerApprovalId: 'approval-a', reviewerApprovalId: 'approval-a',
  }), /distinct/);
  const grant = move(approval, 'GRANT_ISSUED', {
    evidenceId: 'grant-001', ownerApprovalId: 'approval-a', reviewerApprovalId: 'approval-b',
  });
  assert.equal(grant.stage, 'GRANT_ISSUED');
});

test('Gousiya orchestration requires consumed grant and verified staged recovery', () => {
  let workflow = makeWorkflow();
  workflow = move(workflow, 'SNAPSHOT_VALIDATED', { evidenceId: 'snapshot-001' });
  workflow = move(workflow, 'APPROVAL_PENDING');
  workflow = move(workflow, 'GRANT_ISSUED', {
    evidenceId: 'grant-001', ownerApprovalId: 'owner-approval', reviewerApprovalId: 'reviewer-approval',
  });
  assert.throws(() => move(workflow, 'RECOVERY_STAGED', { grantConsumed: false }), /consumed/);
  workflow = move(workflow, 'RECOVERY_STAGED', { grantConsumed: true });
  workflow = move(workflow, 'VERIFICATION_PENDING');
  assert.throws(() => move(workflow, 'VERIFIED', { verificationPassed: false, evidenceId: 'verify-001' }), /passing/);
  workflow = move(workflow, 'VERIFIED', { verificationPassed: true, evidenceId: 'verify-001' });
  workflow = move(workflow, 'CLOSED');
  assert.equal(workflow.stage, 'CLOSED');
  assert.throws(() => move(workflow, 'HOLD'), /immutable/);
});

test('Gousiya orchestration rejects stale versions and limits hold recovery to recorded stage', () => {
  const initial = makeWorkflow();
  const held = move(initial, 'HOLD');
  assert.throws(() => transitionGousiyaRecoveryWorkflow(held, {
    expectedVersion: initial.version, to: 'INTAKE', actorId: 'operator-a', reason: 'stale version',
  }), /version conflict/);
  assert.throws(() => move(held, 'VERIFIED'), /recorded stage/);
  const resumed = move(held, 'INTAKE', { evidenceId: 'incident-retriaged' });
  assert.equal(resumed.stage, 'INTAKE');
  assert.equal(resumed.holdReturnStage, null);
});
