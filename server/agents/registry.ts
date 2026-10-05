import type { AgentDefinition, AgentId } from './types';

const defs: AgentDefinition[] = [
  {
    id: 'gouse',
    name: 'Gouse AI',
    description: 'Primary coordinator and customer-facing AI.',
    status: 'active',
    capabilities: ['coordinate', 'respond', 'delegate'],
    allowedDelegates: ['customer-care', 'project', 'boq', 'procurement', 'finance', 'documents'],
  },
  {
    id: 'customer-care',
    name: 'Customer Care Agent',
    description: 'Customer lookup, enquiries, support workflows and approved customer context.',
    status: 'active',
    capabilities: ['customer.lookup', 'enquiry.create', 'enquiry.read'],
    allowedDelegates: [],
  },
  {
    id: 'project',
    name: 'Project Agent',
    description: 'Project planning, task and status intelligence.',
    status: 'active',
    capabilities: ['project.status', 'project.tasks'],
    allowedDelegates: [],
  },
  {
    id: 'boq',
    name: 'BOQ Agent',
    description: 'Quantity, BOQ and rate-analysis intelligence.',
    status: 'active',
    capabilities: ['boq.read', 'boq.analyze'],
    allowedDelegates: [],
  },
  {
    id: 'procurement',
    name: 'Procurement Agent',
    description: 'Material and purchasing workflow intelligence.',
    status: 'active',
    capabilities: ['procurement.read', 'procurement.status'],
    allowedDelegates: [],
  },
  {
    id: 'finance',
    name: 'Finance Agent',
    description: 'Approved financial information and reporting support.',
    status: 'active',
    capabilities: ['finance.read', 'finance.report'],
    allowedDelegates: [],
  },
  {
    id: 'documents',
    name: 'Documents Agent',
    description: 'Approved document and drawing lookup.',
    status: 'active',
    capabilities: ['documents.read', 'drawings.read'],
    allowedDelegates: [],
  },
];

const registry = new Map<AgentId, AgentDefinition>(defs.map((d) => [d.id, d]));

export function getAgent(agentId: AgentId): AgentDefinition {
  const agent = registry.get(agentId);
  if (!agent) throw new Error(`Unknown agent: ${agentId}`);
  return agent;
}

export function listAgents(): AgentDefinition[] {
  return [...registry.values()];
}

export function canDelegate(fromAgent: AgentId, toAgent: AgentId): boolean {
  return getAgent(fromAgent).allowedDelegates.includes(toAgent);
}
