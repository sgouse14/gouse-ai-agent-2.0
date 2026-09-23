import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { ProjectsView } from './components/ProjectsView';
import { BOQView } from './components/BOQView';
import { MarketplaceView } from './components/MarketplaceView';
import { MaterialsView } from './components/MaterialsView';
import { SpecialistChatView } from './components/SpecialistChatView';
import { SequentialWorkflowEngineModal } from './components/SequentialWorkflowEngineModal';
import {
  INITIAL_PROJECTS,
  INITIAL_BOQ_ITEMS,
  INITIAL_PROFESSIONALS,
  INITIAL_ENQUIRIES,
} from './data/initialData';
import { Project, BOQItem, ProfessionalProfile, MarketplaceEnquiry, EnquiryStatus } from './types';
import { CurrencyCode } from './utils/formatters';
import { ensureItemFloorBreakdown, DEFAULT_BUILDING_FLOORS } from './utils/floorTakeoffEngine';

export function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<TabType>('projects');

  // Currency
  const [currency, setCurrency] = useState<CurrencyCode>('INR');

  // Network online status
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Projects State
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem('gouse_ai_projects');
      if (saved) {
        const parsed: Project[] = JSON.parse(saved);
        const cleaned = parsed.filter((p) => p.id !== 'proj-alvi-01');
        if (cleaned.length > 0) {
          return cleaned.map((p) => ({
            ...p,
            members: Array.isArray(p.members) && p.members.length > 0 ? p.members : [
              { id: `mem-${p.id}-1`, name: 'Ar. S. Gouse', email: 'sgouse14@gmail.com', role: 'owner' },
              { id: `mem-${p.id}-2`, name: 'Engineering & QS Team', email: 'sgouse14@gmail.com', role: 'quantity_surveyor' }
            ],
            auditLogs: Array.isArray(p.auditLogs) && p.auditLogs.length > 0 ? p.auditLogs : [
              { id: `log-${p.id}-1`, projectId: p.id, actor: 'Ar. S. Gouse', action: 'Project Initialized', details: `Workspace initialized for ${p.name}`, timestamp: p.createdAt || new Date().toISOString() }
            ],
            files: Array.isArray(p.files) ? p.files : [],
            analyses: Array.isArray(p.analyses) ? p.analyses : [],
          }));
        }
      }
      return INITIAL_PROJECTS;
    } catch {
      return INITIAL_PROJECTS;
    }
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('gouse_ai_active_project_id');
      if (saved && projects.some((p) => p.id === saved)) return saved;
      return projects[0]?.id || 'proj-01';
    } catch {
      return projects[0]?.id || 'proj-01';
    }
  });

  useEffect(() => {
    localStorage.setItem('gouse_ai_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('gouse_ai_active_project_id', activeProjectId);
  }, [activeProjectId]);

  const activeProject: Project = projects.find((p) => p.id === activeProjectId) || projects[0] || INITIAL_PROJECTS[0];

  // BOQ Items State
  const [boqItems, setBoqItems] = useState<BOQItem[]>(() => {
    try {
      const saved = localStorage.getItem('gouse_ai_boq_items');
      const baseItems: BOQItem[] = saved ? JSON.parse(saved) : INITIAL_BOQ_ITEMS;
      // Ensure any newly added initial items (e.g. Paint, Jindal Panther, Grills, Plumbing, Site Engineer) exist
      const existingIds = new Set(baseItems.map((i) => i.id));
      const missingInitial = INITIAL_BOQ_ITEMS.filter((i) => !existingIds.has(i.id));
      const combined = [...baseItems, ...missingInitial];
      const initialMap = new Map(INITIAL_BOQ_ITEMS.map((i) => [i.id, i]));

      const sanitized = combined.map((item) => {
        // If an item has missing or zero rate, update it with verified rate from INITIAL_BOQ_ITEMS
        if ((!item.rate || item.rate <= 0) && initialMap.has(item.id)) {
          const fresh = initialMap.get(item.id)!;
          return {
            ...item,
            rate: fresh.rate,
            amount: Math.round(item.quantity * fresh.rate),
            notes: fresh.notes,
            laborComponent: fresh.laborComponent,
            materialComponent: fresh.materialComponent,
            unit: fresh.unit || item.unit,
          };
        }
        return item;
      });

      return sanitized.map((item) => ensureItemFloorBreakdown(item, DEFAULT_BUILDING_FLOORS));
    } catch {
      return INITIAL_BOQ_ITEMS.map((item) => ensureItemFloorBreakdown(item, DEFAULT_BUILDING_FLOORS));
    }
  });

  const [contingencyPercent, setContingencyPercent] = useState<number>(10);

  useEffect(() => {
    localStorage.setItem('gouse_ai_boq_items', JSON.stringify(boqItems));
  }, [boqItems]);

  // Marketplace State
  const [professionals, setProfessionals] = useState<ProfessionalProfile[]>(() => {
    try {
      const saved = localStorage.getItem('gouse_ai_professionals');
      if (saved) {
        const parsed: ProfessionalProfile[] = JSON.parse(saved);
        // Remove old ALVI hardcoded profile if present
        const cleaned = parsed.filter(
          (p) => p.id !== 'prof-alvi-001' && !p.company?.toLowerCase().includes("alvi's architecture")
        );
        // Ensure new initial material suppliers (e.g. Paint depot & Jindal Panther steel stockist) are included
        const existingIds = new Set(cleaned.map((p) => p.id));
        const missing = INITIAL_PROFESSIONALS.filter((p) => !existingIds.has(p.id));
        if (cleaned.length > 0) return [...cleaned, ...missing];
      }
      return INITIAL_PROFESSIONALS;
    } catch {
      return INITIAL_PROFESSIONALS;
    }
  });

  const [enquiries, setEnquiries] = useState<MarketplaceEnquiry[]>(() => {
    try {
      const saved = localStorage.getItem('gouse_ai_enquiries');
      if (saved) {
        const parsed: MarketplaceEnquiry[] = JSON.parse(saved);
        const cleaned = parsed.filter(
          (e) => e.id !== 'enq-alvi-01' && e.professionalId !== 'prof-alvi-001' && !e.professionalName?.toLowerCase().includes("alvi")
        );
        const existingIds = new Set(cleaned.map((e) => e.id));
        const missing = INITIAL_ENQUIRIES.filter((e) => !existingIds.has(e.id));
        if (cleaned.length > 0) return [...cleaned, ...missing];
      }
      return INITIAL_ENQUIRIES;
    } catch {
      return INITIAL_ENQUIRIES;
    }
  });

  useEffect(() => {
    localStorage.setItem('gouse_ai_professionals', JSON.stringify(professionals));
  }, [professionals]);

  useEffect(() => {
    localStorage.setItem('gouse_ai_enquiries', JSON.stringify(enquiries));
  }, [enquiries]);

  // Project Handlers
  const handleUpdateProject = (updated: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleCreateProject = (newProj: Partial<Project>) => {
    const created: Project = {
      id: `proj-${Date.now()}`,
      name: newProj.name || 'Untitled Architectural Project',
      projectType: newProj.projectType || 'Residential Architecture',
      location: newProj.location || 'Bangalore, India',
      builtUpAreaSqFt: newProj.builtUpAreaSqFt || 3000,
      description: newProj.description || '',
      status: newProj.status || 'planning',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      files: [],
      analyses: [],
      members: [
        {
          id: `mem-${Date.now()}`,
          name: 'Ar. Gouse',
          email: 'principal@gouseai.com',
          role: 'architect',
        },
      ],
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          projectId: `proj-${Date.now()}`,
          actor: 'Ar. Gouse',
          action: 'Project Created',
          details: `Initial project setup for ${newProj.name}`,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    setProjects((prev) => [created, ...prev]);
    setActiveProjectId(created.id);
  };

  // Marketplace Handlers
  const handleAddEnquiry = (enquiry: MarketplaceEnquiry) => {
    setEnquiries((prev) => [enquiry, ...prev]);
  };

  const handleUpdateEnquiryStatus = (enquiryId: string, status: EnquiryStatus) => {
    setEnquiries((prev) =>
      prev.map((e) => (e.id === enquiryId ? { ...e, status } : e))
    );
  };

  const handleUpdateEnquiry = (updated: MarketplaceEnquiry) => {
    setEnquiries((prev) =>
      prev.map((e) => (e.id === updated.id ? updated : e))
    );
  };

  const handleSaveProfile = (profile: ProfessionalProfile) => {
    setProfessionals((prev) => {
      const exists = prev.some((p) => p.id === profile.id);
      if (exists) {
        return prev.map((p) => (p.id === profile.id ? profile : p));
      }
      return [profile, ...prev];
    });
  };

  const handleDeleteProfile = (profileId: string) => {
    setProfessionals((prev) => prev.filter((p) => p.id !== profileId));
  };

  const handleToggleMyPractice = (profileId: string, isMyPractice: boolean) => {
    setProfessionals((prev) =>
      prev.map((p) => (p.id === profileId ? { ...p, isMyPractice } : p))
    );
  };

  const [marketplaceCategory, setMarketplaceCategory] = useState<string | undefined>(undefined);
  const [marketplaceQuery, setMarketplaceQuery] = useState<string | undefined>(undefined);
  const [isWorkflowEngineOpen, setIsWorkflowEngineOpen] = useState(false);

  const handleNavigateToMarketplace = (category?: string, query?: string) => {
    setMarketplaceCategory(category);
    setMarketplaceQuery(query);
    setActiveTab('marketplace');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Drafting Grid Canvas Background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#f59e0b 1px, transparent 1px), linear-gradient(90deg, #f59e0b 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Main Header */}
      <Header
        projects={projects}
        activeProject={activeProject}
        onSelectProject={setActiveProjectId}
        currency={currency}
        onChangeCurrency={setCurrency}
        isOnline={isOnline}
        onOpenWorkflowEngine={() => setIsWorkflowEngineOpen(true)}
      />

      {/* Navigation Bar */}
      <Navigation activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Workspace Content Router */}
      <main className="flex-1 pb-16 relative z-10">
        {activeTab === 'projects' && (
          <ProjectsView
            projects={projects}
            activeProject={activeProject}
            onSelectProject={setActiveProjectId}
            onUpdateProject={handleUpdateProject}
            onCreateProject={handleCreateProject}
            onOpenWorkflowEngine={() => setIsWorkflowEngineOpen(true)}
          />
        )}

        {activeTab === 'boq' && (
          <BOQView
            items={boqItems}
            contingencyPercent={contingencyPercent}
            currency={currency}
            activeProject={activeProject}
            onUpdateItems={setBoqItems}
            onChangeContingency={setContingencyPercent}
            onUpdateProject={handleUpdateProject}
            onAddEnquiry={handleAddEnquiry}
            onOpenWorkflowEngine={() => setIsWorkflowEngineOpen(true)}
          />
        )}

        {activeTab === 'marketplace' && (
          <MarketplaceView
            professionals={professionals}
            enquiries={enquiries}
            onAddEnquiry={handleAddEnquiry}
            onUpdateEnquiryStatus={handleUpdateEnquiryStatus}
            onUpdateEnquiry={handleUpdateEnquiry}
            onSaveProfile={handleSaveProfile}
            onDeleteProfile={handleDeleteProfile}
            onToggleMyPractice={handleToggleMyPractice}
            initialCategory={marketplaceCategory}
            initialQuery={marketplaceQuery}
            projectCity={activeProject.location}
          />
        )}

        {activeTab === 'materials' && (
          <MaterialsView
            activeProject={activeProject}
            currency={currency}
            onNavigateToMarketplace={handleNavigateToMarketplace}
            boqItems={boqItems}
            onUpdateBOQItems={setBoqItems}
            onUpdateProject={handleUpdateProject}
            onNavigateToBOQ={() => setActiveTab('boq')}
            onOpenWorkflowEngine={() => setIsWorkflowEngineOpen(true)}
          />
        )}

        {activeTab === 'specialist' && (
          <SpecialistChatView
            activeProject={activeProject}
            boqItems={boqItems}
            currency={currency}
            onUpdateBOQItems={setBoqItems}
            onUpdateProject={handleUpdateProject}
            onNavigateToBOQ={() => setActiveTab('boq')}
            onOpenWorkflowEngine={() => setIsWorkflowEngineOpen(true)}
          />
        )}
      </main>

      {/* Sequential Workflow Engine Modal (Structured Prompt Architecture v1.0) */}
      <SequentialWorkflowEngineModal
        isOpen={isWorkflowEngineOpen}
        onClose={() => setIsWorkflowEngineOpen(false)}
        activeProject={activeProject}
        onUpdateProject={handleUpdateProject}
        boqItems={boqItems}
        onUpdateBOQItems={setBoqItems}
        onNavigateToTab={(tab) => setActiveTab(tab)}
        currency={currency}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 px-4 py-4 text-center text-xs text-slate-400 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-400">GOUSE AI AGENT</span>
            <span>• AI Agent Studio</span>
          </div>
          <div>
            <span>Powered by Gemini 3.8 Flash • Architecture • BOQ Estimation • Code Intelligence</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
