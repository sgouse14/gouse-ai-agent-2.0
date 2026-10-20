import test from 'node:test';
import assert from 'node:assert/strict';
import type { Request } from 'express';
import {
  buildSaqlainSecuritySummary,
  evaluateSaqlainAction,
  evaluateSaqlainExternalActivity,
} from './saqlainSecurity.ts';

function requestWith(body: unknown): Request {
  return { body } as Request;
}

test('security summary returns a bounded baseline posture report', () => {
  const summary = buildSaqlainSecuritySummary(
    requestWith({ target: '  Residential Project  ' }),
  );

  assert.equal(summary.target, 'Residential Project');
  assert.equal(summary.agent, 'Saqlain AI Agent');
  assert.ok(summary.findings.length >= 6);
  assert.equal(summary.riskScore, 100);
  assert.ok(summary.checks.length > 0);
});

test('security summary ignores invalid target values and truncates oversized labels', () => {
  const invalid = buildSaqlainSecuritySummary(requestWith({ target: 42 }));
  assert.equal(invalid.target, 'Gouse AI workspace');

  const longTarget = 'x'.repeat(400);
  const bounded = buildSaqlainSecuritySummary(requestWith({ target: longTarget }));
  assert.equal(bounded.target.length, 200);
});

test('destructive and protected-export actions are blocked by policy', () => {
  const deletion = evaluateSaqlainAction({
    actionType: 'delete_file',
    actorAuthenticated: true,
    approvalGranted: true,
    projectId: 'project-1',
  });
  assert.equal(deletion.decision, 'block');

  const exportAttempt = evaluateSaqlainAction({
    actionType: 'export_source',
    actorAuthenticated: true,
    approvalGranted: true,
    projectId: 'project-1',
  });
  assert.equal(exportAttempt.decision, 'block');
});

test('state mutations require an authenticated actor, project scope, and approval', () => {
  assert.equal(evaluateSaqlainAction({ actionType: 'update_area' }).decision, 'block');

  assert.equal(
    evaluateSaqlainAction({
      actionType: 'update_area',
      actorAuthenticated: true,
      projectId: 'project-1',
    }).decision,
    'review',
  );

  assert.equal(
    evaluateSaqlainAction({
      actionType: 'update_area',
      actorAuthenticated: true,
      projectId: 'project-1',
      approvalGranted: true,
    }).decision,
    'allow',
  );
});

test('unauthenticated external activity is isolated rather than permitted', () => {
  const result = evaluateSaqlainExternalActivity({
    authenticated: false,
    sourceAccessAuthorized: false,
  });
  assert.equal(result.decision, 'block');
  assert.equal(result.threatAction, 'isolate');
});

test('communication agent requires authenticated project scope', () => {
  assert.equal(
    evaluateSaqlainAction({ actionType: 'run_agent_communication', actorAuthenticated: false, projectId: 'gouse-ai-agent-2.0' }).decision,
    'block',
  );
  assert.equal(
    evaluateSaqlainAction({ actionType: 'run_agent_communication', actorAuthenticated: true }).decision,
    'block',
  );
  assert.equal(
    evaluateSaqlainAction({ actionType: 'run_agent_communication', actorAuthenticated: true, projectId: 'gouse-ai-agent-2.0' }).decision,
    'allow',
  );
});

test('EMP readiness assessment requires authenticated project scope', () => {
  assert.equal(
    evaluateSaqlainAction({ actionType: 'run_emp_protection_assessment', actorAuthenticated: false, projectId: 'project-1' }).decision,
    'block',
  );
  assert.equal(
    evaluateSaqlainAction({ actionType: 'run_emp_protection_assessment', actorAuthenticated: true }).decision,
    'block',
  );
  assert.equal(
    evaluateSaqlainAction({ actionType: 'run_emp_protection_assessment', actorAuthenticated: true, projectId: 'project-1' }).decision,
    'allow',
  );
});
