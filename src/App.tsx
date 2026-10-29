import React, { useState, useEffect, useRef } from 'react';
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
import { readWorkspaceDomain, writeWorkspaceDomain, WorkspaceApiError, type WorkspaceDomain } from './workspaceStateClient';
import { onAuthStateChanged } from 'firebase/auth';
import { firebaseAuth } from './firebase';

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

  // Shared workspace sync preserves the browser copy as a recoverable local backup.
  // Existing local data is imported only when the matching server domain is absent.
  const [workspaceStatus, setWorkspaceStatus] = useState<'syncing' | 'shared' | 'local-only' | 'conflict'>('syncing');
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [workspaceSyncAttempt, setWorkspaceSyncAttempt] = useState(0);
  const workspaceVersions = useRef<Partial<Record<WorkspaceDomain, string | null>>>({});
  const workspaceLastSynced = useRef<Partial<Record<WorkspaceDomain, string>>>({});
  const workspaceWriteQueue = useRef<Promise<void>>(Promise.resolve());
  const workspaceWritesBlocked = useRef(false);
  // Firebase restores persisted sessions asynchronously. Subscribe so workspace
  // sync follows sign-in/sign-out even when no other App state changes.
  const [signedInUid, setSignedInUid] = useState<string | null>(() => firebaseAuth.currentUser?.uid ?? null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => onAuthStateChanged(firebaseAuth, (user) => {
    setSignedInUid(user?.uid ?? null);
    setAuthReady(true);
  }), []);

  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;
    const readLocal = <T,>(key: string, fallback: T): T => {
      try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value) as T;
      } catch {
        return fallback;
      }
    };
    const currentUid = signedInUid;
    let previousOwnerUid: string | null = null;
    try { previousOwnerUid = localStorage.getItem('gouse_ai_workspace_owner_uid'); } catch { /* storage may be disabled */ }
    const storedLocalSnapshot: Record<WorkspaceDomain, unknown> = {
      projects: readLocal('gouse_ai_projects', projects),
      boqItems: readLocal('gouse_ai_boq_items', boqItems),
      professionals: readLocal('gouse_ai_professionals', professionals),
      enquiries: readLocal('gouse_ai_enquiries', enquiries),
      preferences: {
        activeProjectId: readLocal('gouse_ai_active_project_id', activeProjectId),
        currency: readLocal('gouse_ai_currency', currency),
      },
    };
    const ownerMismatch = Boolean(previousOwnerUid && currentUid !== previousOwnerUid);
    const localSnapshot: Record<WorkspaceDomain, unknown> = ownerMismatch ? {
      projects: INITIAL_PROJECTS,
      boqItems: INITIAL_BOQ_ITEMS.map((item) => ensureItemFloorBreakdown(item, DEFAULT_BUILDING_FLOORS)),
      professionals: INITIAL_PROFESSIONALS,
      enquiries: INITIAL_ENQUIRIES,
      preferences: { activeProjectId: INITIAL_PROJECTS[0]?.id ?? '', currency },
    } : {
      // Migrate the app's normalized in-memory state; the untouched raw browser
      // values remain in the backup snapshot above for recovery.
      projects,
      boqItems,
      professionals,
      enquiries,
      preferences: { activeProjectId, currency },
    };

    // Keep the pre-sync data in a UID-specific recovery snapshot. If a different
    // Firebase user signs into this browser, never import the previous user's
    // browser data into the new user's cloud workspace.
    if (ownerMismatch && previousOwnerUid) {
      try {
        localStorage.setItem('gouse_ai_local_backup_' + previousOwnerUid, JSON.stringify({
          savedAt: new Date().toISOString(),
          domains: storedLocalSnapshot,
        }));
      } catch {
        // Continue to isolate users even if storage quota prevents a backup write.
      }
      setProjects(INITIAL_PROJECTS);
      setBoqItems(INITIAL_BOQ_ITEMS.map((item) => ensureItemFloorBreakdown(item, DEFAULT_BUILDING_FLOORS)));
      setProfessionals(INITIAL_PROFESSIONALS);
      setEnquiries(INITIAL_ENQUIRIES);
      setActiveProjectId(INITIAL_PROJECTS[0]?.id ?? '');
    } else {
      try {
        localStorage.setItem('gouse_ai_local_backup_before_shared_sync', JSON.stringify({
          savedAt: new Date().toISOString(),
          ownerUid: currentUid ?? null,
          domains: storedLocalSnapshot,
        }));
      } catch {
        // Never delete original domain keys if the recovery snapshot cannot be written.
      }
    }
    try {
      if (currentUid) localStorage.setItem('gouse_ai_workspace_owner_uid', currentUid);
    } catch {
      // Cloud-side ownership is still enforced by the verified Firebase UID.
    }
    let sharedProjectIds = new Set(
      (Array.isArray(localSnapshot.projects) ? localSnapshot.projects as Project[] : []).map((project) => project.id),
    );

    const applyShared = (domain: WorkspaceDomain, data: unknown, version: string) => {
      if (domain === 'projects' && Array.isArray(data)) {
        sharedProjectIds = new Set((data as Project[]).map((project) => project.id));
        setProjects(data as Project[]);
      } else if (domain === 'boqItems' && Array.isArray(data)) {
        setBoqItems(data as BOQItem[]);
      } else if (domain === 'professionals' && Array.isArray(data)) {
        setProfessionals(data as ProfessionalProfile[]);
      } else if (domain === 'enquiries' && Array.isArray(data)) {
        setEnquiries(data as MarketplaceEnquiry[]);
      } else if (domain === 'preferences' && data && typeof data === 'object') {
        const preferences = data as { activeProjectId?: unknown; currency?: unknown };
        if (typeof preferences.activeProjectId === 'string' && sharedProjectIds.has(preferences.activeProjectId)) {
          setActiveProjectId(preferences.activeProjectId);
        } else if (sharedProjectIds.size > 0) {
          setActiveProjectId([...sharedProjectIds][0]);
        }
        if (typeof preferences.currency === 'string' && ['INR', 'USD', 'EUR', 'GBP', 'AED'].includes(preferences.currency)) {
          setCurrency(preferences.currency as CurrencyCode);
        }
      } else {
        throw new WorkspaceApiError('unavailable', 'Shared workspace data has an unexpected shape.');
      }
      workspaceVersions.current[domain] = version;
      workspaceLastSynced.current[domain] = JSON.stringify(data);
    };

    const synchronize = async () => {
      try {
        const domains: WorkspaceDomain[] = ['projects', 'boqItems', 'professionals', 'enquiries', 'preferences'];
        for (const domain of domains) {
          let remote = await readWorkspaceDomain<unknown>(domain);
          if (cancelled) return;
          if (!remote) {
            try {
              const created = await writeWorkspaceDomain(domain, localSnapshot[domain], null);
              remote = { data: localSnapshot[domain], version: created.version };
            } catch (error) {
              if (!(error instanceof WorkspaceApiError) || error.code !== 'conflict') throw error;
              remote = await readWorkspaceDomain<unknown>(domain);
              if (!remote) throw error;
            }
          }
          if (!Array.isArray(remote.data) && domain !== 'preferences') {
            throw new WorkspaceApiError('unavailable', 'Shared workspace data has an unexpected shape.');
          }
          applyShared(domain, remote.data, remote.version);
        }
        if (cancelled) return;
        workspaceWritesBlocked.current = false;
        setWorkspaceStatus('shared');
      } catch (error) {
        if (cancelled) return;
        workspaceWritesBlocked.current = true;
        setWorkspaceStatus(error instanceof WorkspaceApiError && error.code === 'conflict' ? 'conflict' : 'local-only');
      } finally {
        if (!cancelled) setWorkspaceReady(true);
      }
    };

    setWorkspaceReady(false);
    setWorkspaceStatus('syncing');
    void synchronize();
    return () => {
      cancelled = true;
      // Prevent queued writes from one signed-in identity running after a user switch/unmount.
      workspaceWritesBlocked.current = true;
    };
  }, [workspaceSyncAttempt, signedInUid, authReady]);

  const queueWorkspaceWrite = (domain: WorkspaceDomain, data: unknown) => {
    if (!workspaceReady || workspaceStatus !== 'shared' || workspaceWritesBlocked.current) return;
    const serialized = JSON.stringify(data);
    if (workspaceLastSynced.current[domain] === serialized) return;
    workspaceWriteQueue.current = workspaceWriteQueue.current.then(async () => {
      if (workspaceWritesBlocked.current) return;
      try {
        const expectedVersion = workspaceVersions.current[domain];
        const result = await writeWorkspaceDomain(domain, data, expectedVersion ?? null);
        workspaceVersions.current[domain] = result.version;
        workspaceLastSynced.current[domain] = serialized;
      } catch (error) {
        workspaceWritesBlocked.current = true;
        setWorkspaceStatus(error instanceof WorkspaceApiError && error.code === 'conflict' ? 'conflict' : 'local-only');
      }
    });
  };

  useEffect(() => {
    try { localStorage.setItem('gouse_ai_currency', JSON.stringify(currency)); } catch { /* local backup is best-effort */ }
    queueWorkspaceWrite('projects', projects);
  }, [projects, workspaceReady, workspaceStatus]);

  useEffect(() => {
    queueWorkspaceWrite('boqItems', boqItems);
  }, [boqItems, workspaceReady, workspaceStatus]);

  useEffect(() => {
    queueWorkspaceWrite('professionals', professionals);
  }, [professionals, workspaceReady, workspaceStatus]);

  useEffect(() => {
    queueWorkspaceWrite('enquiries', enquiries);
  }, [enquiries, workspaceReady, workspaceStatus]);

  useEffect(() => {
    queueWorkspaceWrite('preferences', { activeProjectId, currency });
  }, [activeProjectId, currency, workspaceReady, workspaceStatus]);

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

  const exportLocalWorkspaceBackup = () => {
    try {
      const readRaw = (key: string) => {
        const value = localStorage.getItem(key);
        if (value === null) return null;
        try { return JSON.parse(value) as unknown; } catch { return value; }
      };
      const uid = firebaseAuth.currentUser?.uid ?? null;
      const backup = {
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        ownerUid: uid,
        currentLocalData: {
          projects: readRaw('gouse_ai_projects'),
          activeProjectId: readRaw('gouse_ai_active_project_id'),
          boqItems: readRaw('gouse_ai_boq_items'),
          professionals: readRaw('gouse_ai_professionals'),
          enquiries: readRaw('gouse_ai_enquiries'),
          currency: readRaw('gouse_ai_currency'),
        },
        preSyncRecoverySnapshot: readRaw('gouse_ai_local_backup_before_shared_sync'),
        uidSpecificRecoverySnapshot: uid ? readRaw('gouse_ai_local_backup_' + uid) : null,
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'gouse-ai-workspace-backup-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    } catch {
      setWorkspaceStatus('local-only');
    }
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

      {/* Shared-state status is explicit; local edits remain in browser storage if sync fails. */}
      <div className={`relative z-10 px-4 py-2 text-xs border-b ${workspaceStatus === 'shared' ? 'border-emerald-900 bg-emerald-950/50 text-emerald-200' : workspaceStatus === 'syncing' ? 'border-slate-700 bg-slate-900 text-slate-300' : 'border-amber-800 bg-amber-950/60 text-amber-100'}`}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>
            {workspaceStatus === 'shared' && 'Shared workspace connected. Browser storage is retained as a local recovery copy.'}
            {workspaceStatus === 'syncing' && 'Connecting to shared workspace and preserving local data…'}
            {workspaceStatus === 'local-only' && 'Shared workspace unavailable. Changes are saved locally and are not confirmed as shared.'}
            {workspaceStatus === 'conflict' && 'Another session changed shared data. Local changes are preserved; reload shared data before continuing edits.'}
          </span>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded border border-current px-2 py-1 hover:bg-white/10" onClick={exportLocalWorkspaceBackup}>Export local backup</button>
            {(workspaceStatus === 'local-only' || workspaceStatus === 'conflict') && (
              <button type="button" className="rounded border border-current px-2 py-1 hover:bg-white/10" onClick={() => {
                workspaceWritesBlocked.current = false;
                setWorkspaceSyncAttempt((attempt) => attempt + 1);
              }}>Retry / reload shared data</button>
            )}
          </div>
        </div>
      </div>

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
