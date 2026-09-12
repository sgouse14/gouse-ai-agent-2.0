export type SpecialistType = 'general' | 'design' | 'code' | 'documentation' | 'quantity' | 'sustainability';

export type ProfessionalType = 'architect' | 'builder' | 'material_supplier';

export type EnquiryStatus = 'open' | 'in_progress' | 'quoted' | 'accepted' | 'rejected' | 'completed';

export interface ProjectFile {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadDate: string;
  extractedText?: string;
}

export interface AnalysisReport {
  id: string;
  title: string;
  analysis: string;
  timestamp: string;
  focus: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'architect' | 'structural_engineer' | 'mep_engineer' | 'quantity_surveyor' | 'client';
}

export interface AuditEvent {
  id: string;
  projectId: string;
  actor: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface Project {
  id: string;
  name: string;
  projectType: string;
  location: string;
  description: string;
  status: 'planning' | 'design_development' | 'documentation' | 'tender' | 'construction' | 'completed';
  builtUpAreaSqFt?: number;
  files: ProjectFile[];
  analyses: AnalysisReport[];
  members: TeamMember[];
  auditLogs: AuditEvent[];
  createdAt: string;
  updatedAt?: string;
}

export interface BOQItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
  notes: string;
}

export interface BOQSummary {
  lineItemsCount: number;
  subtotal: number;
  contingencyPercent: number;
  contingencyAmount: number;
  estimatedTotal: number;
  categoryTotals: Record<string, number>;
}

export interface ProfessionalProfile {
  id: string;
  professionalType: ProfessionalType;
  name: string;
  company: string;
  bio: string;
  services: string;
  location: string;
  verified: boolean;
  rating: number;
  completedProjects: number;
  experienceYears: number;
  email: string;
  phone?: string;
}

export interface MarketplaceEnquiry {
  id: string;
  professionalId: string;
  professionalName?: string;
  clientName: string;
  clientEmail: string;
  projectTitle: string;
  message: string;
  budget?: string;
  status: EnquiryStatus;
  createdAt: string;
}

export interface MaterialComparisonItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  estimatedRate: number;
  durabilityYears: number;
  embodiedCarbonKg: number;
  uValue: number;
  fireRating: string;
  pros: string[];
  cons: string[];
  bestUse: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  specialist?: SpecialistType;
}
