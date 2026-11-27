import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { TabType } from './components/Navigation';
import { ProjectsView } from './components/ProjectsView';
import { BOQView } from './components/BOQView';
import { InteriorView } from './components/InteriorView';
import { MarketplaceView } from './components/MarketplaceView';
import { MaterialsView } from './components/MaterialsView';
import { SpecialistChatView } from './components/SpecialistChatView';
import { SequentialWorkflowEngineModal } from './components/SequentialWorkflowEngineModal';
import { GouseAiAgentBrokerView } from './components/GouseAiAgentBrokerView';
import { SocialMediaStudio } from './components/SocialMediaStudio';
import { SiteVisitCameraModal } from './components/SiteVisitCameraModal';
import { AuthModal } from './components/AuthModal';
import { ClientPortal } from './components/ClientPortal';
import { ClientView } from './components/ClientView';
import { SocialMediaHubPage } from './components/SocialMediaHubPage';
import { StudioToolkitModal, StudioToolkitTab } from './components/StudioToolkitModal';
import { BimBoqSubscriptionModal } from './components/BimBoqSubscriptionModal';
import { NaturalVoiceChatDrawer } from './components/NaturalVoiceChatDrawer';
import { AudioWaveform, X, Lock, Crown, ShieldCheck, Calculator } from 'lucide-react';
import { useAuth, isZeroBrokerRole } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { AVATARS } from './utils/mediaAssets';
import {
  INITIAL_PROJECTS,
  INITIAL_BOQ_ITEMS,
  INITIAL_PROFESSIONALS,
  INITIAL_ENQUIRIES,
} from './data/initialData';
import { SOUTH_INDIA_3000_CONTACTS } from './data/southIndiaDirectory';
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
  const {
    user,
    hasBoqAccess,
    getTrialStatus,
    quickSignIn,
    isSubscriptionModalOpen,
    setIsSubscriptionModalOpen,
  } = useAuth();
  const { gridIntensity } = useTheme();

  // Optional overlay / sub-portal views
  const [clientActiveView, setClientActiveView] = useState<'dashboard' | 'portal' | 'workspace'>('dashboard');
  const [isShowingClientPortal, setIsShowingClientPortal] = useState<boolean>(false);
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

  const [contingencyPercent, setContingencyPercent] = useState<number>(() => {
    return activeProject?.contingencyPercent ?? 10;
  });

  // Keep contingencyPercent synchronized whenever activeProject changes or is updated (e.g., via Super Agent)
  useEffect(() => {
    if (typeof activeProject?.contingencyPercent === 'number') {
      setContingencyPercent(activeProject.contingencyPercent);
    } else {
      setContingencyPercent(10);
    }
  }, [activeProject?.id, activeProject?.contingencyPercent]);

  const handleChangeContingency = (nextPercent: number) => {
    setContingencyPercent(nextPercent);
    if (activeProject) {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === activeProject.id
            ? { ...p, contingencyPercent: nextPercent, updatedAt: new Date().toISOString() }
            : p
        )
      );
    }
  };

  useEffect(() => {
    localStorage.setItem('gouse_ai_boq_items', JSON.stringify(boqItems));
  }, [boqItems]);

  // Marketplace State (28 flagship profiles + 3,000 Bangalore & South India contacts)
  const [professionals, setProfessionals] = useState<ProfessionalProfile[]>(() => {
    const baseDirectory = [...INITIAL_PROFESSIONALS, ...SOUTH_INDIA_3000_CONTACTS];
    try {
      const saved = localStorage.getItem('gouse_ai_professionals');
      if (saved) {
        const parsed: ProfessionalProfile[] = JSON.parse(saved);
        const cleaned = parsed.filter(
          (p) => p.id !== 'prof-alvi-001' && !p.company?.toLowerCase().includes("alvi's architecture")
        );
        const overrideMap = new Map(cleaned.map((p) => [p.id, p]));
        const merged = baseDirectory.map((item) => overrideMap.get(item.id) || item);
        const baseIds = new Set(baseDirectory.map((item) => item.id));
        const customExtras = cleaned.filter((p) => !baseIds.has(p.id));
        return [...customExtras, ...merged];
      }
      return baseDirectory;
    } catch {
      return baseDirectory;
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
    try {
      // Persist only custom profiles, flagship edits, and shortlisted regional contacts to avoid localStorage quota limits
      const persistable = professionals.filter(
        (p) => !p.id.startsWith('si-dir-') || Boolean(p.isMyPractice)
      );
      localStorage.setItem('gouse_ai_professionals', JSON.stringify(persistable));
    } catch {
      // ignore storage quota limits
    }
  }, [professionals]);

  useEffect(() => {
    try {
      localStorage.setItem('gouse_ai_enquiries', JSON.stringify(enquiries));
    } catch {
      // ignore storage quota limits
    }
  }, [enquiries]);

  // Project Handlers
  const handleUpdateProject = (updated: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    if (updated.id === activeProjectId && typeof updated.contingencyPercent === 'number') {
      setContingencyPercent(updated.contingencyPercent);
    }
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects((prev) => {
      if (prev.length <= 1) return prev;
      const remaining = prev.filter((p) => p.id !== projectId);
      if (activeProjectId === projectId && remaining[0]) {
        setActiveProjectId(remaining[0].id);
      }
      return remaining;
    });
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
  const [isStudioToolkitOpen, setIsStudioToolkitOpen] = useState(false);
  const [studioToolkitTab, setStudioToolkitTab] = useState<StudioToolkitTab>('feasibility');
  const [isVoiceChatOpen, setIsVoiceChatOpen] = useState(false);
  const [isFloatingVoiceLauncherEnabled, setIsFloatingVoiceLauncherEnabled] = useState<boolean>(() => {
    try {
      const saved = window.localStorage.getItem('gouse_voice_launcher_enabled');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(
        'gouse_voice_launcher_enabled',
        String(isFloatingVoiceLauncherEnabled)
      );
    } catch {
      // ignore storage errors
    }
  }, [isFloatingVoiceLauncherEnabled]);

  const handleOpenStudioToolkit = (tab: StudioToolkitTab = 'feasibility') => {
    setStudioToolkitTab(tab);
    setIsStudioToolkitOpen(true);
  };

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

  const handleSelectUnauthView = (view: 'client_page' | 'client_dashboard' | 'broker') => {
    if (view === 'broker') {
      setIsShowingClientPortal(false);
      setClientActiveView('workspace');
      setActiveTab('broker');
    } else if (view === 'client_dashboard' && user?.role === 'client') {
      setIsShowingClientPortal(true);
      setClientActiveView('dashboard');
    } else {
      setIsShowingClientPortal(true);
      setClientActiveView('portal');
    }
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

  // Dedicated Client Portal / Client Workspace view (ONLY role === 'client' can enter ClientView; others see Separate Client Login Gate)
  if (isShowingClientPortal || user?.role === 'client') {
    const isClientOnlyUser = user?.role === 'client';
    if (!isClientOnlyUser || clientActiveView === 'portal') {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
          <ClientPortal
            projects={projects}
            currency={currency}
            isClientRestricted={isClientOnlyUser}
            onReturnToWorkspace={
              isClientOnlyUser
                ? undefined
                : () => {
                    setIsShowingClientPortal(false);
                    setClientActiveView('workspace');
                  }
            }
            onOpenClientDashboard={() => {
              setIsShowingClientPortal(true);
              setClientActiveView('dashboard');
            }}
            onEnquirySubmitted={handleClientPageEnquiry}
          />
          <AuthModal onSelectUnauthView={handleSelectUnauthView} />
          <BimBoqSubscriptionModal
            isOpen={isSubscriptionModalOpen}
            onClose={() => setIsSubscriptionModalOpen(false)}
            currency={currency}
          />
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
          boqItems={boqItems}
          contingencyPercent={contingencyPercent}
          onUpdateBOQItems={setBoqItems}
          onReturnToPlatform={
            isClientOnlyUser
              ? undefined
              : () => {
                  setIsShowingClientPortal(false);
                  setClientActiveView('workspace');
                }
          }
          onViewPublicPortal={() => {
            setIsShowingClientPortal(true);
            setClientActiveView('portal');
          }}
          onOpenStudioTab={
            isClientOnlyUser
              ? undefined
              : (tab) => {
                  setIsShowingClientPortal(false);
                  setClientActiveView('workspace');
                  setActiveTab(tab);
                }
          }
          currency={currency}
          isStaffPreview={!isClientOnlyUser}
        />
        <AuthModal onSelectUnauthView={handleSelectUnauthView} />
        <BimBoqSubscriptionModal
          isOpen={isSubscriptionModalOpen}
          onClose={() => setIsSubscriptionModalOpen(false)}
          currency={currency}
        />
      </div>
    );
  }

  // Dedicated Zero-Broker Portal isolation (signed-in Zero-Broker users cannot access Studio Workspace or Client Access)
  if (isZeroBrokerRole(user?.role)) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
        <GouseAiAgentBrokerView
          project={activeProject}
          onUpdateProject={handleUpdateProject}
          currency={currency}
          isOutsidePlatform
        />
        <AuthModal onSelectUnauthView={handleSelectUnauthView} />
        <BimBoqSubscriptionModal
          isOpen={isSubscriptionModalOpen}
          onClose={() => setIsSubscriptionModalOpen(false)}
          currency={currency}
        />
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
          className="fixed inset-0 pointer-events-none blueprint-grid z-0 transition-opacity duration-200 print:hidden"
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
        onOpenClientWorkspace={() => {
          setIsShowingClientPortal(true);
          setClientActiveView(user?.role === 'client' ? 'dashboard' : 'portal');
        }}
        onOpenClientPortal={() => {
          setIsShowingClientPortal(true);
          setClientActiveView('portal');
        }}
        onOpenStudioToolkit={handleOpenStudioToolkit}
        onOpenNaturalVoiceChat={() => setIsVoiceChatOpen(true)}
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
              onDeleteProject={handleDeleteProject}
              onOpenWorkflowEngine={() => setIsWorkflowEngineOpen(true)}
              onOpenSiteCamera={() => setIsSiteCameraOpen(true)}
              onOpenStudioToolkit={handleOpenStudioToolkit}
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
              onReturnToWorkspace={() => setActiveTab('projects')}
            />
          )}

          {activeTab === 'boq' &&
            (hasBoqAccess(user) ? (
              <BOQView
                items={boqItems}
                contingencyPercent={contingencyPercent}
                currency={currency}
                activeProject={activeProject}
                onUpdateItems={setBoqItems}
                onChangeContingency={handleChangeContingency}
                onUpdateProject={handleUpdateProject}
                onAddEnquiry={handleAddEnquiry}
                onOpenWorkflowEngine={() => setIsWorkflowEngineOpen(true)}
              />
            ) : (
              <div id="boq-pro-license-gate" className="max-w-3xl mx-auto px-4 lg:px-8 py-12">
                <div className="rounded-2xl bg-slate-900 border border-amber-500/40 p-6 sm:p-8 space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/15 border border-amber-500/35 text-amber-300 text-xs font-mono font-semibold">
                      <Lock className="w-3.5 h-3.5 shrink-0" />
                      <span>BOQ &amp; ESTIMATION · PRO LICENSE REQUIRED</span>
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      {user ? `${user.name} · ${getTrialStatus(user).statusLabel}` : 'Guest Session'}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
                      <Calculator className="w-6 h-6 text-amber-400 shrink-0" />
                      <span>BOQ &amp; Cost Estimation Is Not Included in the 6-Month Free Trial</span>
                    </h2>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Other studio accounts receive a <strong>6-Month Free Trial</strong> across Projects, Interior, Materials &amp; Rates, Marketplace, Realstate Media, and Super Agent.{' '}
                      <strong className="text-white">BOQ &amp; Estimation</strong> requires an active Pro License (₹1,500/yr) — while <strong className="text-emerald-400">Gouse AI (sgouse14@gmail.com)</strong> retains <strong>Lifetime Free</strong> access.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <div className="font-semibold text-emerald-400">Gouse AI (sgouse14@gmail.com)</div>
                      <p className="text-slate-400">
                        Lifetime Free (₹0 forever) across BOQ &amp; Estimation, BIM takeoffs, and all workspace tools.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <div className="font-semibold text-sky-400">Other Studio Roles</div>
                      <p className="text-slate-400">
                        6 Months Free on general workspace modules. Unlock BOQ &amp; Estimation anytime for ₹1,500/yr.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      id="btn-boq-gate-unlock"
                      type="button"
                      onClick={() => setIsSubscriptionModalOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap"
                    >
                      <Crown className="w-4 h-4 shrink-0" />
                      <span>Unlock BOQ &amp; Estimation (₹1,500/yr)</span>
                    </button>

                    <button
                      id="btn-boq-gate-gouse-login"
                      type="button"
                      onClick={() => quickSignIn('user-gouse-01')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors whitespace-nowrap"
                    >
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>Sign in as Gouse AI (Lifetime Free)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('projects')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors whitespace-nowrap"
                    >
                      <span>Back to Projects</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

          {activeTab === 'interior' && (
            <InteriorView
              activeProject={activeProject}
              currency={currency}
              boqItems={boqItems}
              onUpdateBOQItems={setBoqItems}
              onUpdateProject={handleUpdateProject}
              onNavigateToBOQ={() => setActiveTab('boq')}
              onNavigateToMarketplace={handleNavigateToMarketplace}
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
              activeProject={activeProject}
              currency={currency}
              boqItems={boqItems}
              onUpdateBOQItems={setBoqItems}
              onNavigateToBOQ={() => setActiveTab('boq')}
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
              onOpenNaturalVoiceChat={() => setIsVoiceChatOpen(true)}
            />
          )}
        </main>

        <footer className="border-t border-slate-800/80 bg-slate-950/90 px-4 lg:px-8 py-4 text-xs text-slate-500 print:hidden">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>Gouse AI · Architecture &amp; Construction Cost Intelligence</span>
            <span>Bangalore, India · Ar. S. Gouse · Gemini 4 Hydrogen</span>
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

      {/* Studio Toolkit & Utilities Hub Modal */}
      <StudioToolkitModal
        isOpen={isStudioToolkitOpen}
        onClose={() => setIsStudioToolkitOpen(false)}
        initialTab={studioToolkitTab}
        activeProject={activeProject}
        boqItems={boqItems}
        contingencyPercent={contingencyPercent}
        currency={currency}
        onUpdateProject={handleUpdateProject}
        onUpdateBOQItems={setBoqItems}
        onNavigateTab={setActiveTab}
        onOpenBimLicense={() => setIsSubscriptionModalOpen(true)}
      />

      {/* BIM & BOQ Studio License Modal */}
      <BimBoqSubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        currency={currency}
      />

      {/* Natural Two-Way Voice Chat Drawer */}
      <NaturalVoiceChatDrawer
        isOpen={isVoiceChatOpen}
        onClose={() => setIsVoiceChatOpen(false)}
        activeTab={activeTab}
        activeProject={activeProject}
        boqItems={boqItems}
        contingencyPercent={contingencyPercent}
        currency={currency}
        onNavigateTab={setActiveTab}
        onUpdateProject={handleUpdateProject}
        onUpdateBOQItems={setBoqItems}
        onChangeContingency={handleChangeContingency}
        onChangeCurrency={setCurrency}
        isFloatingLauncherEnabled={isFloatingVoiceLauncherEnabled}
        onToggleFloatingLauncher={setIsFloatingVoiceLauncherEnabled}
      />

      {/* Global Quick Voice Chat Launcher (can be removed/hidden or re-pinned anytime) */}
      {isFloatingVoiceLauncherEnabled &&
        !isVoiceChatOpen &&
        !isStudioToolkitOpen &&
        !isWorkflowEngineOpen &&
        !isSiteCameraOpen && (
          <div className="fixed bottom-5 right-5 z-40 inline-flex items-center rounded-xl bg-amber-500 shadow-lg border border-amber-400 overflow-hidden print:hidden">
            <button
              id="btn-global-voice-chat"
              type="button"
              onClick={() => setIsVoiceChatOpen(true)}
              className="inline-flex items-center gap-2 pl-3.5 pr-2.5 py-2.5 text-slate-950 hover:bg-amber-400 font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
              title="Open Natural Two-Way Voice Chat"
            >
              <AudioWaveform className="w-4 h-4 shrink-0" />
              <span>Voice Chat</span>
            </button>
            <button
              id="btn-remove-global-voice-chat"
              type="button"
              onClick={() => setIsFloatingVoiceLauncherEnabled(false)}
              title="Remove floating Voice Chat button (still available in left sidebar)"
              aria-label="Remove floating Voice Chat button"
              className="px-2 py-2.5 text-slate-950/75 hover:text-slate-950 hover:bg-amber-400 border-l border-slate-950/15 transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      {/* Authentication Modal */}
      <AuthModal onSelectUnauthView={handleSelectUnauthView} />
    </div>
  );
}

export default App;
