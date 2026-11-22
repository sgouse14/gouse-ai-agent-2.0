import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { TabType } from './components/Navigation';
import { ProjectsView } from './components/ProjectsView';
import { BOQView } from './components/BOQView';
import { MarketplaceView } from './components/MarketplaceView';
import { MaterialsView } from './components/MaterialsView';
import { SpecialistChatView } from './components/SpecialistChatView';
import { SequentialWorkflowEngineModal } from './components/SequentialWorkflowEngineModal';
import { GouseAiAgentBrokerView } from './components/GouseAiAgentBrokerView';
import { SocialMediaStudio } from './components/SocialMediaStudio';
import { GlobalVoiceCommandListener } from './components/GlobalVoiceCommandListener';
import { SiteVisitCameraModal } from './components/SiteVisitCameraModal';
import { AuthModal } from './components/AuthModal';
import { ClientPortal } from './components/ClientPortal';
import { ClientView } from './components/ClientView';
import { PlatformDemo } from './components/PlatformDemo';
import { SocialMediaHubPage } from './components/SocialMediaHubPage';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { AVATARS } from './utils/mediaAssets';
import {
  INITIAL_PROJECTS,
  INITIAL_BOQ_ITEMS,
  INITIAL_PROFESSIONALS,
  INITIAL_ENQUIRIES,
} from './data/initialData';
import {
  Project,
  BOQItem,
  ProfessionalProfile,
  MarketplaceEnquiry,
  EnquiryStatus,
  SiteAuditResult,
} from './types';
import { CurrencyCode } from './utils/formatters';
import { ensureItemFloorBreakdown, DEFAULT_BUILDING_FLOORS } from './utils/floorTakeoffEngine';

export function App() {
  const { user } = useAuth();
  const { gridIntensity } = useTheme();

  // Optional overlay / sub-portal views
  const [clientActiveView, setClientActiveView] = useState<'dashboard' | 'portal' | 'workspace'>('dashboard');
  const [isShowingClientPortal, setIsShowingClientPortal] = useState<boolean>(false);
  const [isShowingPlatformDemo, setIsShowingPlatformDemo] = useState<boolean>(false);
  const [isShowingSocialHub, setIsShowingSocialHub] = useState<boolean>(false);

  // Sidebar & Navigation state
  const [activeTab, setActiveTab] = useState<TabType>('projects');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isSiteCameraOpen, setIsSiteCameraOpen] = useState<boolean>(false);

  // Currency
  const [currency, setCurrency] = useState<CurrencyCode>('INR');

  // Projects State
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem('gouse_ai_projects');
      if (saved) {
        const parsed: Project[] = JSON.parse(saved);
        const cleaned = parsed.filter((p) => p.id !== 'proj-alvi-01');
        if (cleaned.length > 0) {
          const existingIds = new Set(cleaned.map((p) => p.id));
          const missingInitial = INITIAL_PROJECTS.filter((p) => !existingIds.has(p.id));
          const combined = [...cleaned, ...missingInitial];
          return combined.map((p) => {
            const rawMembers =
              Array.isArray(p.members) && p.members.length > 0
                ? p.members
                : [
                    {
                      id: `mem-${p.id}-1`,
                      name: 'Gouse AI',
                      email: 'sgouse14@gmail.com',
                      role: 'owner' as const,
                      avatarUrl: AVATARS.principal,
                      department: 'Executive Leadership & Principal Architecture',
                      phone: '+91 80739 47241',
                    },
                    {
                      id: `mem-${p.id}-2`,
                      name: 'Engineering & QS Team',
                      email: 'sgouse14@gmail.com',
                      role: 'quantity_surveyor' as const,
                      avatarUrl: AVATARS.qsDirector,
                      department: 'Structural Engineering & Cost Auditing',
                      phone: '+91 80412 89001',
                    },
                  ];

            const updatedMembers = rawMembers.map((m) => {
              const isLead =
                m.role === 'owner' ||
                m.name.toLowerCase().includes('gouse') ||
                m.name.toLowerCase().includes('principal');
              const hasRemoteUnsplash = m.avatarUrl?.includes('unsplash.com');
              const fallbackAvatar = isLead
                ? AVATARS.principal
                : m.name.toLowerCase().includes('priya') || m.role === 'architect'
                ? AVATARS.seniorArchitect
                : m.role === 'structural_engineer' || m.name.toLowerCase().includes('rajesh')
                ? AVATARS.structuralEngineer
                : m.role === 'client' || m.name.toLowerCase().includes('sameer')
                ? AVATARS.principal
                : AVATARS.qsDirector;

              const avatar = !m.avatarUrl || hasRemoteUnsplash ? fallbackAvatar : m.avatarUrl;

              if (isLead) {
                return {
                  ...m,
                  name: 'Gouse AI',
                  role: 'owner' as const,
                  avatarUrl: avatar,
                  department: m.department || 'Executive Leadership & Principal Architecture',
                  phone: m.phone || '+91 80739 47241',
                };
              }
              return {
                ...m,
                avatarUrl: avatar,
                department: m.department || 'Design & Project Execution',
                phone: m.phone || '+91 98450 12890',
              };
            });

            return {
              ...p,
              members: updatedMembers,
              auditLogs:
                Array.isArray(p.auditLogs) && p.auditLogs.length > 0
                  ? p.auditLogs
                  : [
                      {
                        id: `log-${p.id}-1`,
                        projectId: p.id,
                        actor: 'Gouse AI',
                        action: 'Project Initialized',
                        details: `Workspace initialized for ${p.name}`,
                        timestamp: p.createdAt || new Date().toISOString(),
                      },
                    ],
              files: Array.isArray(p.files) ? p.files : [],
              analyses: Array.isArray(p.analyses) ? p.analyses : [],
            };
          });
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

  const activeProject: Project =
    projects.find((p) => p.id === activeProjectId) || projects[0] || INITIAL_PROJECTS[0];

  // BOQ Items State
  const [boqItems, setBoqItems] = useState<BOQItem[]>(() => {
    try {
      const saved = localStorage.getItem('gouse_ai_boq_items');
      const baseItems: BOQItem[] = saved ? JSON.parse(saved) : INITIAL_BOQ_ITEMS;
      const existingIds = new Set(baseItems.map((i) => i.id));
      const missingInitial = INITIAL_BOQ_ITEMS.filter((i) => !existingIds.has(i.id));
      const combined = [...baseItems, ...missingInitial];
      const initialMap = new Map(INITIAL_BOQ_ITEMS.map((i) => [i.id, i]));

      const sanitized = combined.map((item) => {
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
        const cleaned = parsed.filter(
          (p) => p.id !== 'prof-alvi-001' && !p.company?.toLowerCase().includes("alvi's architecture")
        );
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
          (e) =>
            e.id !== 'enq-alvi-01' &&
            e.professionalId !== 'prof-alvi-001' &&
            !e.professionalName?.toLowerCase().includes('alvi')
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
    const nowId = Date.now();
    const created: Project = {
      id: `proj-${nowId}`,
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
          id: `mem-${nowId}`,
          name: user?.name || 'Gouse AI',
          email: user?.email || 'sgouse14@gmail.com',
          role: user?.role || 'owner',
          avatarUrl: user?.avatarUrl || AVATARS.principal,
          department: user?.department || 'Executive Leadership & Principal Architecture',
          phone: user?.phone || '+91 80739 47241',
        },
      ],
      auditLogs: [
        {
          id: `log-${nowId}`,
          projectId: `proj-${nowId}`,
          actor: user?.name || 'Gouse AI',
          action: 'Project Created',
          details: `Initial project setup for ${newProj.name || 'New Project'}`,
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
  const [isGlobalVoiceListening, setIsGlobalVoiceListening] = useState(false);

  const handleNavigateToMarketplace = (category?: string, query?: string) => {
    setMarketplaceCategory(category);
    setMarketplaceQuery(query);
    setActiveTab('marketplace');
  };

  const handleSaveSiteAudit = (audit: SiteAuditResult) => {
    if (!activeProject) return;
    const currentAudits = activeProject.siteAudits || [];
    const updatedAudits = [audit, ...currentAudits];
    const auditLogEntry = {
      id: `log-audit-${Date.now()}`,
      projectId: activeProject.id,
      actor: 'Gouse AI Site Camera',
      action: `Site Visit Visual Audit: ${audit.stageName}`,
      details: `Progress: ${audit.completionPercentage}% · Score: ${audit.qualityScore}/10 (${audit.complianceGrade}) · Milestone: ${
        audit.boqMilestoneRecommendations?.recommendedMilestone || 'Inspection Complete'
      }`,
      timestamp: new Date().toISOString(),
    };
    const updatedLogs = [auditLogEntry, ...(activeProject.auditLogs || [])];
    handleUpdateProject({
      ...activeProject,
      siteAudits: updatedAudits,
      auditLogs: updatedLogs,
    });
  };

  const handleClientPageEnquiry = (enquiryData: {
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    projectType: string;
    location: string;
    budget: string;
    notes: string;
  }) => {
    const newEnquiry: MarketplaceEnquiry = {
      id: `enq-${Date.now()}`,
      professionalId: 'prof-01',
      professionalName: 'Gouse AI Architecture & Turnkey Studio',
      clientName: enquiryData.clientName,
      clientEmail: enquiryData.clientEmail,
      clientPhone: enquiryData.clientPhone,
      projectTitle: `${enquiryData.projectType} (${enquiryData.location || 'Bangalore'})`,
      message: enquiryData.notes
        ? `Location: ${enquiryData.location}. Requirements: ${enquiryData.notes}`
        : `Client requested consultation for ${enquiryData.projectType} in ${enquiryData.location}`,
      budget: enquiryData.budget,
      status: 'pending' as EnquiryStatus,
      createdAt: new Date().toISOString(),
    };
    setEnquiries((prev) => [newEnquiry, ...prev]);
  };

  // Dedicated Full-Page Social & Media Hub
  if (isShowingSocialHub) {
    return (
      <SocialMediaHubPage
        activeProject={activeProject}
        projects={projects}
        onSelectProject={setActiveProjectId}
        onClose={() => setIsShowingSocialHub(false)}
        onOpenWorkflowEngine={() => setIsWorkflowEngineOpen(true)}
      />
    );
  }

  // Dedicated Platform Overview Presentation
  if (isShowingPlatformDemo) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
        <PlatformDemo
          isClientRestricted={user?.role === 'client'}
          onCloseDemo={() => setIsShowingPlatformDemo(false)}
        />
        <AuthModal />
      </div>
    );
  }

  // Dedicated Client Portal view (when toggled from sidebar or signed in as client)
  if (isShowingClientPortal || (user?.role === 'client' && clientActiveView !== 'workspace')) {
    if (clientActiveView === 'portal' || isShowingClientPortal) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
          <ClientPortal
            isClientRestricted={user?.role === 'client'}
            onOpenClientDashboard={() => {
              setIsShowingClientPortal(false);
              setClientActiveView('dashboard');
            }}
            onOpenPlatformDemo={() => setIsShowingPlatformDemo(true)}
            onEnquirySubmitted={handleClientPageEnquiry}
          />
          <AuthModal />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
        <ClientView
          projects={projects}
          activeProjectId={activeProjectId}
          onSelectProject={setActiveProjectId}
          onUpdateProject={handleUpdateProject}
          onOpenPlatformDemo={() => setIsShowingPlatformDemo(true)}
          onViewPublicPortal={() => setClientActiveView('portal')}
          currency={currency}
          isStaffPreview={false}
        />
        <AuthModal />
      </div>
    );
  }

  // Contextual Header Action
  const getHeaderAction = () => {
    switch (activeTab) {
      case 'boq':
        return { label: 'CAD Workflow', action: () => setIsWorkflowEngineOpen(true) };
      case 'specialist':
        return { label: 'Open BOQ', action: () => setActiveTab('boq') };
      case 'projects':
        return { label: 'Site Audit', action: () => setIsSiteCameraOpen(true) };
      default:
        return { label: 'CAD Engine', action: () => setIsWorkflowEngineOpen(true) };
    }
  };
  const headerAction = getHeaderAction();

  // Main Enterprise Sidebar Workspace (accessible to both guests and signed-in professionals)
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Subtle architectural drafting grid backdrop */}
      {gridIntensity !== 'off' && (
        <div
          className="fixed inset-0 pointer-events-none blueprint-grid z-0 transition-opacity duration-200"
          style={{
            opacity: gridIntensity === 'prominent' ? 1 : gridIntensity === 'moderate' ? 0.7 : 0.4,
          }}
          aria-hidden="true"
        />
      )}

      {/* Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        projects={projects}
        activeProject={activeProject}
        onSelectProject={setActiveProjectId}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenWorkflowEngine={() => setIsWorkflowEngineOpen(true)}
        onOpenSiteCamera={() => setIsSiteCameraOpen(true)}
        onToggleVoiceListener={() => setIsGlobalVoiceListening((prev) => !prev)}
        isVoiceListening={isGlobalVoiceListening}
        onOpenPlatformDemo={() => setIsShowingPlatformDemo(true)}
        onOpenClientPortal={() => {
          setIsShowingClientPortal(true);
          setClientActiveView('portal');
        }}
      />

      {/* Right Main Column: Contextual Top Bar + Viewport + Clean Footer */}
      <div className="flex-1 min-w-0 flex flex-col relative z-10">
        <Header
          activeTab={activeTab}
          activeProject={activeProject}
          currency={currency}
          onChangeCurrency={setCurrency}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onPrimaryAction={headerAction.action}
          primaryActionLabel={headerAction.label}
        />

        <main className="flex-1 pb-12">
          {activeTab === 'projects' && (
            <ProjectsView
              projects={projects}
              activeProject={activeProject}
              onSelectProject={setActiveProjectId}
              onUpdateProject={handleUpdateProject}
              onCreateProject={handleCreateProject}
              onOpenWorkflowEngine={() => setIsWorkflowEngineOpen(true)}
              onOpenSiteCamera={() => setIsSiteCameraOpen(true)}
              currency={currency}
            />
          )}

          {activeTab === 'social' && (
            <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
              <SocialMediaStudio
                activeProject={activeProject}
                onOpenWorkflowEngine={() => setIsWorkflowEngineOpen(true)}
              />
            </div>
          )}

          {(activeTab === 'broker' || activeTab === 'pg_coliving' || activeTab === 'rent_house') && (
            <GouseAiAgentBrokerView
              project={activeProject}
              onUpdateProject={handleUpdateProject}
              currency={currency}
              initialSubTab={
                activeTab === 'rent_house' ? 'rent_house' : activeTab === 'pg_coliving' ? 'pg' : 'all'
              }
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

        <footer className="border-t border-slate-800/80 bg-slate-950/90 px-4 lg:px-8 py-4 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>Gouse AI · Architecture &amp; Construction Cost Intelligence</span>
            <span>Bangalore, India · Ar. S. Gouse · Gemini 4 Hydrogen &amp; 3.8 Flash</span>
          </div>
        </footer>
      </div>

      {/* Site Visit Camera Modal */}
      <SiteVisitCameraModal
        isOpen={isSiteCameraOpen}
        onClose={() => setIsSiteCameraOpen(false)}
        activeProject={activeProject}
        onSaveAuditToProject={handleSaveSiteAudit}
      />

      {/* Sequential Workflow Engine Modal */}
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

      {/* Global Voice Command Listener */}
      <GlobalVoiceCommandListener
        activeTab={activeTab}
        onNavigateTab={setActiveTab}
        projects={projects}
        activeProject={activeProject}
        onSelectProject={setActiveProjectId}
        onUpdateProject={handleUpdateProject}
        onCreateProject={handleCreateProject}
        currency={currency}
        onChangeCurrency={setCurrency}
        contingencyPercent={contingencyPercent}
        onChangeContingency={setContingencyPercent}
        onOpenWorkflowEngine={() => setIsWorkflowEngineOpen(true)}
        onOpenSettings={() => {
          const btn = document.getElementById('btn-open-user-settings');
          btn?.click();
        }}
        boqItems={boqItems}
        onUpdateBOQItems={setBoqItems}
        isExternalListening={isGlobalVoiceListening}
        onToggleExternalListening={() => setIsGlobalVoiceListening((prev) => !prev)}
      />

      {/* Authentication Modal */}
      <AuthModal />
    </div>
  );
}

export default App;
