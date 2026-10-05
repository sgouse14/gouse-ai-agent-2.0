import { randomUUID } from 'node:crypto';
import { canDelegate, getAgent } from './registry';
import type { AgentId, AgentTask, AgentTaskResult } from './types';

export type AgentExecutor = (task: AgentTask) => Promise<Record<string, unknown>>;

export class AgentOrchestrator {
  private readonly executors = new Map<AgentId, AgentExecutor>();

  registerExecutor(agentId: AgentId, executor: AgentExecutor): void {
    this.executors.set(agentId, executor);
  }

  async delegate(
    fromAgent: AgentId,
    toAgent: AgentId,
    action: string,
    payload: Record<string, unknown>,
    language?: string,
  ): Promise<AgentTaskResult> {
    const from = getAgent(fromAgent);
    const to = getAgent(toAgent);

    if (from.status !== 'active' || to.status !== 'active') {
      return this.reject(fromAgent, toAgent, 'Agent is not active');
    }

    if (!canDelegate(fromAgent, toAgent)) {
      return this.reject(fromAgent, toAgent, 'Delegation not permitted');
    }

    if (!to.capabilities.includes(action) && !to.capabilities.includes(action.split('.')[0])) {
      return this.reject(fromAgent, toAgent, `Capability not allowed: ${action}`);
    }

    const executor = this.executors.get(toAgent);
    if (!executor) {
      return this.reject(fromAgent, toAgent, 'No executor registered for target agent');
    }

    const task: AgentTask = {
      taskId: randomUUID(),
      fromAgent,
      toAgent,
      action,
      payload,
      language,
      createdAt: new Date().toISOString(),
    };

    try {
      const data = await executor(task);
      return {
        taskId: task.taskId,
        fromAgent,
        toAgent,
        status: 'completed',
        data,
        completedAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        taskId: task.taskId,
        fromAgent,
        toAgent,
        status: 'rejected',
        error: error instanceof Error ? error.message : 'Agent execution failed',
        completedAt: new Date().toISOString(),
      };
    }
  }

  private reject(fromAgent: AgentId, toAgent: AgentId, error: string): AgentTaskResult {
    return {
      taskId: randomUUID(),
      fromAgent,
      toAgent,
      status: 'rejected',
      error,
      completedAt: new Date().toISOString(),
    };
  }
}
