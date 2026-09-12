import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { ProjectsView } from './components/ProjectsView';
import { BOQView } from './components/BOQView';
import { MarketplaceView } from './components/MarketplaceView';
import { MaterialsView } from './components/MaterialsView';
import { SpecialistChatView } from './components/SpecialistChatView';
import {
  INITIAL_PROJECTS,
  INITIAL_BOQ_ITEMS,
  INITIAL_PROFESSIONALS,
  INITIAL_ENQUIRIES,
} from './data/initialData';
import { Project, BOQItem, ProfessionalProfile, MarketplaceEnquiry, EnquiryStatus } from './types';
import { CurrencyCode } from './utils/formatters';

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
      return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
    } catch {
      return INITIAL_PROJECTS;
    }
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('gouse_ai_active_project_id');
      return saved && projects.some((p) => p.id === saved) ? saved : projects[0]?.id || 'proj-1';
    } catch {
      return projects[0]?.id || 'proj-1';
    }
  });

  useEffect(() => {
    localStorage.setItem('gouse_ai_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('gouse_ai_active_project_id', activeProjectId);
  }, [activeProjectId]);

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];

  // BOQ Items State
  const [boqItems, setBoqItems] = useState<BOQItem[]>(() => {
    try {
      const saved = localStorage.getItem('gouse_ai_boq_items');
      return saved ? JSON.parse(saved) : INITIAL_BOQ_ITEMS;
    } catch {
      return INITIAL_BOQ_ITEMS;
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
      return saved ? JSON.parse(saved) : INITIAL_PROFESSIONALS;
    } catch {
      return INITIAL_PROFESSIONALS;
    }
  });

  const [enquiries, setEnquiries] = useState<MarketplaceEnquiry[]>(() => {
    try {
      const saved = localStorage.getItem('gouse_ai_enquiries');
      return saved ? JSON.parse(saved) : INITIAL_ENQUIRIES;
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

  const handleSaveProfile = (profile: ProfessionalProfile) => {
    setProfessionals((prev) => {
      const exists = prev.some((p) => p.id === profile.id);
      if (exists) {
        return prev.map((p) => (p.id === profile.id ? profile : p));
      }
      return [profile, ...prev];
    });
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
          />
        )}

        {activeTab === 'marketplace' && (
          <MarketplaceView
            professionals={professionals}
            enquiries={enquiries}
            onAddEnquiry={handleAddEnquiry}
            onUpdateEnquiryStatus={handleUpdateEnquiryStatus}
            onSaveProfile={handleSaveProfile}
          />
        )}

        {activeTab === 'materials' && (
          <MaterialsView
            activeProject={activeProject}
            currency={currency}
          />
        )}

        {activeTab === 'specialist' && (
          <SpecialistChatView
            activeProject={activeProject}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 px-4 py-4 text-center text-xs text-slate-400 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-400">GOUSE AI</span>
            <span>• ArchAgent 2.0 Studio</span>
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
