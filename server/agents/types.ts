export type AgentId =
  | 'gouse'
  | 'customer-care'
  | 'project'
  | 'boq'
  | 'procurement'
  | 'finance'
  | 'documents';

export type AgentStatus = 'active' | 'paused';

export type AgentDefinition = {
  id: AgentId;
  name: string;
  description: string;
  status: AgentStatus;
  capabilities: string[];
  allowedDelegates: AgentId[];
};

export type AgentTask = {
  taskId: string;
  fromAgent: AgentId;
  toAgent: AgentId;
  action: string;
  payload: Record<string, unknown>;
  language?: string;
  createdAt: string;
};

export type AgentTaskResult = {
  taskId: string;
  fromAgent: AgentId;
  toAgent: AgentId;
  status: 'completed' | 'rejected';
  data?: Record<string, unknown>;
  error?: string;
  completedAt: string;
};
