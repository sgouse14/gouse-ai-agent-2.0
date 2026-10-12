import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BACKUP_AGENT_COUNT,
  RECOVERY_AGENT_COUNT,
  CYCLE_AGENT_COUNT,
  createCycleAssignments,
  buildCycleReport,
  authorizeSensitiveOperation,
} from './gouseCyberSecurityCycle.ts';
import { SAQLAIN_BACKUP_TEAM, formatBackupManagerTaskId, formatBackupTaskId, createBackupTask, claimBackupTask, completeBackupTask } from './saqlainBackupTeam.ts';

test('cycle has four backup agents and one recovery agent', () => {
  assert.equal(BACKUP_AGENT_COUNT, 4);
  assert.equal(RECOVERY_AGENT_COUNT, 1);
  assert.equal(CYCLE_AGENT_COUNT, 5);
  const assignments = createCycleAssignments('task-1', ['b1', 'b2', 'b3', 'b4', 'r1']);
  assert.equal(assignments.filter((a) => a.role === 'BACKUP').length, 4);
  assert.equal(assignments.filter((a) => a.role === 'RECOVERY').length, 1);
});

test('cycle rejects duplicate identities and wrong agent counts', () => {
  assert.throws(() => createCycleAssignments('task-1', ['a', 'b', 'c']));
  assert.throws(() => createCycleAssignments('task-1', ['a', 'b', 'c', 'd', 'd']));
});

test('unclean cycle report is held and originals remain protected', () => {
  const report = buildCycleReport({
    taskId: 'task-1', backupAgentIds: ['b1', 'b2', 'b3', 'b4'], recoveryAgentId: 'r1',
    duplicateDetected: false, suspiciousEntryDetected: true, requiredCopyVerified: true, identityCheckPassed: true,
  });
  assert.equal(report.status, 'HOLD');
  assert.equal(report.originalProtected, true);
});

test('identity mismatch holds sensitive operation', () => {
  assert.deepEqual(authorizeSensitiveOperation('agent-a', 'agent-b'), {
    allowed: false, identityStatus: 'INCONSISTENT', action: 'HOLD',
  });
});

test('backup team is exactly four backups plus one recovery agent', () => {
  assert.equal(SAQLAIN_BACKUP_TEAM.length, 5);
  assert.equal(SAQLAIN_BACKUP_TEAM.filter((a) => a.role === 'BACKUP').length, 4);
  assert.equal(SAQLAIN_BACKUP_TEAM.filter((a) => a.role === 'RECOVERY').length, 1);
  assert.ok(SAQLAIN_BACKUP_TEAM.every((a) => a.canDeleteSourceFiles === false && a.canOverwriteSourceFiles === false));
});

test('manager and task IDs retain separate even-step sequences', () => {
  assert.equal(formatBackupManagerTaskId(1), '01010');
  assert.equal(formatBackupManagerTaskId(2), '01012');
  assert.equal(formatBackupTaskId(1), '0001');
  assert.equal(formatBackupTaskId(2), '0003');
});

test('only lock owner can complete a backup task', () => {
  const locked = claimBackupTask(createBackupTask(1), 'backup-1', new Date('2026-01-01T00:00:00Z'));
  assert.throws(() => completeBackupTask(locked, 'backup-2'));
  assert.equal(completeBackupTask(locked, 'backup-1').status, 'COMPLETED');
});
