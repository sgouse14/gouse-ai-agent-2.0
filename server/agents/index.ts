export * from './types';
export * from './registry';
export * from './orchestrator';

import { AgentOrchestrator } from './orchestrator';
import type { AgentTask } from './types';

export const agentOrchestrator = new AgentOrchestrator();

agentOrchestrator.registerExecutor('customer-care', async (task: AgentTask) => {
  return { accepted: true, action: task.action, note: 'Customer Care executor registered; connect business service in Stage 10H.' };
});

agentOrchestrator.registerExecutor('project', async (task: AgentTask) => {
  return { accepted: true, action: task.action, note: 'Project executor registered; connect project service in the next stage.' };
});

agentOrchestrator.registerExecutor('boq', async (task: AgentTask) => {
  return { accepted: true, action: task.action, note: 'BOQ executor registered; connect BOQ service in the next stage.' };
});

agentOrchestrator.registerExecutor('procurement', async (task: AgentTask) => {
  return { accepted: true, action: task.action, note: 'Procurement executor registered; connect procurement service in the next stage.' };
});

agentOrchestrator.registerExecutor('finance', async (task: AgentTask) => {
  return { accepted: true, action: task.action, note: 'Finance executor registered; connect finance service in the next stage.' };
});

agentOrchestrator.registerExecutor('documents', async (task: AgentTask) => {
  return { accepted: true, action: task.action, note: 'Documents executor registered; connect document service in the next stage.' };
});
