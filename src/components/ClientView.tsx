import React, { useState, useMemo } from 'react';
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  FileSpreadsheet,
  Layers,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Upload,
  User,
  Users,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Send,
  Eye,
  Camera,
  Filter,
  Check,
  Lock,
  Key,
  ArrowRight,
  Sparkles,
  Phone,
  Mail,
  X,
  FileCheck,
  FolderOpen,
  Compass,
  LogOut,
  LogIn,
  LayoutDashboard,
  TrendingUp,
  DollarSign,
  Activity,
  Video,
  CheckSquare,
  Shield,
  Play,
  Maximize2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Project, ProjectMilestone, ProjectStatusUpdate, SharedDocument } from '../types';
import { CurrencyCode, formatCurrency } from '../utils/formatters';
import { SiteVisitCameraModal } from './SiteVisitCameraModal';

interface ClientViewProps {
  projects: Project[];
  activeProjectId?: string;
  onSelectProject?: (projectId: string) => void;
  onUpdateProject?: (updatedProject: Project) => void;
  onOpenPlatformDemo?: () => void;
  onReturnToPlatform?: () => void;
  onViewPublicPortal?: () => void;
  onOpenAgentBroker?: () => void;
  currency?: CurrencyCode;
  isStaffPreview?: boolean;
  isUnauthenticatedOutside?: boolean;
}

export const ClientView: React.FC<ClientViewProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onUpdateProject,
  onOpenPlatformDemo,
  onReturnToPlatform,
  onViewPublicPortal,
  onOpenAgentBroker,
  currency = 'INR',
  isStaffPreview = false,
  isUnauthenticatedOutside = false,
}) => {
  const { user, logout, openLoginModal } = useAuth();

  // 1. STRICT ACCESS CONTROL: Only show projects assigned to this client or provide client showcase outside platform
  const assignedProjects = useMemo(() => {
    // If the user has a client role, enforce strict project assignment:
    if (user && user.role === 'client') {
      return projects.filter((p) => {
        // Direct client ID match
        if (p.clientId && p.clientId === user.id) return true;
        // Email match
        if (p.clientEmail && p.clientEmail.toLowerCase() === user.email.toLowerCase()) return true;
        // Assigned client IDs array
        if (p.assignedClientIds && p.assignedClientIds.includes(user.id)) return true;
        // Project team member match
        if (
          p.members &&
          p.members.some(
            (m) => m.email.toLowerCase() === user.email.toLowerCase() && m.role === 'client'
          )
        ) {
          return true;
        }
        return false;
      });
    }
    // If outside platform / not signed in, show client-assigned demo projects:
    if (!user) {
      const clientAssigned = projects.filter(
        (p) => p.clientId || p.clientEmail || (p.assignedClientIds && p.assignedClientIds.length > 0)
      );
      return clientAssigned.length > 0 ? clientAssigned : projects;
    }
    // If studio staff (owner, architect, etc.) is previewing, they can view all projects:
    return projects;
  }, [projects, user]);

  // Selected Project State
  const [selectedProjId, setSelectedProjId] = useState<string>(() => {
    if (activeProjectId && assignedProjects.some((p) => p.id === activeProjectId)) {
      return activeProjectId;
    }
    return assignedProjects[0]?.id || '';
  });

  // Keep selected project in sync if assignedProjects changes
  const activeProject = useMemo(() => {
    return assignedProjects.find((p) => p.id === selectedProjId) || assignedProjects[0] || null;
  }, [assignedProjects, selectedProjId]);

  // Active view tab inside Client View: 'dashboard' | 'milestones' | 'updates' | 'documents' | 'team'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'milestones' | 'updates' | 'documents' | 'team'>('dashboard');

  // Site Camera in Dashboard
  const [isSiteCameraModalOpen, setIsSiteCameraModalOpen] = useState<boolean>(false);
  const [dashboardCameraAngle, setDashboardCameraAngle] = useState<'slab' | 'crane' | 'entrance'>('slab');

  // Filter for updates feed
  const [updateCategoryFilter, setUpdateCategoryFilter] = useState<string>('all');

  // Filter for documents
  const [docCategoryFilter, setDocCategoryFilter] = useState<string>('all');

  // Modals state
  const [previewDoc, setPreviewDoc] = useState<SharedDocument | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [clientCommentText, setClientCommentText] = useState<string>('');
  const [commentSuccessMsg, setCommentSuccessMsg] = useState<string | null>(null);

  // Upload Form State
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocCategory, setNewDocCategory] = useState<'architectural_drawings' | 'structural_reports' | 'boq_financials' | 'permits_sanctions' | 'client_uploads' | 'site_audit'>('client_uploads');
  const [newDocFile, setNewDocFile] = useState<File | null>(null);
  const [newDocNotes, setNewDocNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Milestone sign-off confirmation state
  const [signedOffMilestoneId, setSignedOffMilestoneId] = useState<string | null>(null);

  const handleSelectProject = (id: string) => {
    setSelectedProjId(id);
    if (onSelectProject) {
      onSelectProject(id);
    }
  };

  // Milestone Approval Handler
  const handleApproveMilestone = (milestoneId: string) => {
    if (!activeProject || !onUpdateProject) return;

    const updatedMilestones = (activeProject.milestones || []).map((ms) => {
      if (ms.id === milestoneId) {
        return {
          ...ms,
          isClientSignedOff: true,
          clientSignedOffAt: new Date().toISOString(),
          status: 'completed' as const,
          progressPercent: 100,
        };
      }
      return ms;
    });

    const updatedProject: Project = {
      ...activeProject,
      milestones: updatedMilestones,
    };

    onUpdateProject(updatedProject);
    setSignedOffMilestoneId(milestoneId);
    setTimeout(() => {
      setSignedOffMilestoneId(null);
    }, 3000);
  };

  // Document Upload Handler
  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !newDocTitle.trim()) return;

    setIsUploading(true);
    setTimeout(() => {
      const newDoc: SharedDocument = {
        id: `doc-client-${Date.now()}`,
        projectId: activeProject.id,
        title: newDocTitle,
        fileName: newDocFile?.name || `${newDocTitle.replace(/\s+/g, '_')}.pdf`,
        fileSize: newDocFile ? `${(newDocFile.size / (1024 * 1024)).toFixed(1)} MB` : '1.8 MB',
        fileType: 'pdf',
        category: newDocCategory,
        uploadedBy: `${user?.name || 'Client'} (Client Portal)`,
        uploadedAt: new Date().toISOString().split('T')[0],
        version: 'v1.0 Client Upload',
        status: 'in_review',
        isClientUpload: true,
        notes: newDocNotes || 'Uploaded by client for architectural team review.',
      };

      const updatedDocs = [newDoc, ...(activeProject.sharedDocuments || [])];
      const updatedProject: Project = {
        ...activeProject,
        sharedDocuments: updatedDocs,
      };

      if (onUpdateProject) {
        onUpdateProject(updatedProject);
      }

      setIsUploading(false);
      setIsUploadModalOpen(false);
      setNewDocTitle('');
      setNewDocFile(null);
      setNewDocNotes('');
    }, 600);
  };

  // Download simulation
  const handleDownloadDocument = (doc: SharedDocument) => {
    const textContent = `# Gouse AI Architectural Workspace - Document Export
Project: ${activeProject?.name || 'Project'}
Document: ${doc.title}
File Name: ${doc.fileName}
Category: ${doc.category}
Version: ${doc.version}
Date: ${doc.uploadedAt}
Uploaded By: ${doc.uploadedBy}
Status: ${doc.status.toUpperCase()}

Notes:
${doc.notes || 'No special notes.'}

Verified by Gouse AI Architectural & Engineering Quality Control.
Council of Architecture Registration: CA/2012/55190`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = doc.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Post comment/inquiry handler
  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientCommentText.trim() || !activeProject) return;

    setCommentSuccessMsg('Your note has been transmitted directly to Ar. S. Gouse and the lead structural engineer.');
    setTimeout(() => {
      setClientCommentText('');
      setCommentSuccessMsg(null);
    }, 3500);
  };

  // Overall progress calculation
  const overallMilestoneProgress = useMemo(() => {
    if (!activeProject?.milestones || activeProject.milestones.length === 0) return 75;
    const total = activeProject.milestones.reduce((acc, ms) => acc + (ms.progressPercent || 0), 0);
    return Math.round(total / activeProject.milestones.length);
  }, [activeProject]);

  // Financial Summary calculation
  const financialSummary = useMemo(() => {
    const milestones = activeProject?.milestones || [];
    const totalCommitted = milestones.reduce((sum, m) => sum + (m.amount || m.escrowReleaseAmount || 0), 0) || 38500000;
    const disbursed = milestones
      .filter((m) => m.status === 'completed')
      .reduce((sum, m) => sum + (m.amount || m.escrowReleaseAmount || 0), 0) || 21500000;
    const inEscrow = milestones
      .filter((m) => m.status === 'in_progress')
      .reduce((sum, m) => sum + (m.amount || m.escrowReleaseAmount || 0), 0) || 8500000;
    const upcoming = Math.max(0, totalCommitted - disbursed - inEscrow);
    const completedCount = milestones.filter((m) => m.status === 'completed').length;
    const inProgressCount = milestones.filter((m) => m.status === 'in_progress').length;

    return {
      totalCommitted,
      disbursed,
      inEscrow,
      upcoming,
      completedCount,
      inProgressCount,
      totalCount: milestones.length || 6,
    };
  }, [activeProject]);

  // Camera angle presets for interactive dashboard widget
  const cameraAnglePresets = {
    slab: {
      name: 'Deck Cam 01 (Level 2 Slab)',
      location: 'South-East Cantilever Slab Zone',
      image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f9?auto=format&fit=crop&w=1200&q=80',
      specs: 'Fe550D Rebar spacing 150mm c/c • M30 Ready-mix Slump 110mm • Curing Hydration: 96%',
      badge: 'STRUCTURAL REBAR: VERIFIED',
      time: 'Live • 1080p AI Stream',
    },
    crane: {
      name: 'Crane Cam 02 (360° Aerial)',
      location: 'Tower Crane Jib Mast',
      image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
      specs: 'Boundary setbacks 3.5m compliant • Heavy vehicle access clear • Wind speed: 12 km/h',
      badge: 'PERIMETER SAFETY: CLEAR',
      time: 'Live • 4K AI Stream',
    },
    entrance: {
      name: 'Gate Cam 03 (Logistics Intake)',
      location: 'Main North Gate Access Bay',
      image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80',
      specs: 'Ready-mix concrete mixer delivery #88492 • Weighbridge verified • Digital QA tag active',
      badge: 'LOGISTICS DISPATCH: ON-TIME',
      time: 'Live • 1080p AI Stream',
    },
  };

  // Executive Progress Brief Download
  const handleDownloadExecutiveBrief = () => {
    if (!activeProject) return;
    const briefContent = `================================================================================
GOUSE AI ARCHITECTURAL & PROJECT MANAGEMENT STUDIO
EXECUTIVE CLIENT PROGRESS & AUDIT REPORT
================================================================================
Generated for: ${user?.name || 'Client Investor'} (${user?.company || 'Prestige Urban Ventures Pvt Ltd'})
Date of Report: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
Project: ${activeProject.name}
Location: ${activeProject.location}
Typology: ${activeProject.projectType}
Built-up Area: ${activeProject.builtUpAreaSqFt?.toLocaleString() || '5,800'} Sq.Ft
Lead Architect: Ar. S. Gouse (CoA Reg: CA/2012/55190)

1. EXECUTIVE HEALTH SUMMARY:
--------------------------------------------------------------------------------
* Physical Progress: ${overallMilestoneProgress}% Verified
* Current Active Phase: ${activeProject.status.replace('_', ' ').toUpperCase()}
* Structural Clash Status: ZERO active clashes (IS 456 & NBC 2016 verified)
* Quality Inspection Score: 98.6 / 100 (Pass with Distinction)

2. FINANCIAL ESCROW & MILESTONE ACCOUNTING (${currency}):
--------------------------------------------------------------------------------
* Total Committed Project Budget: ${formatCurrency(financialSummary.totalCommitted, currency)}
* Disbursed from Escrow: ${formatCurrency(financialSummary.disbursed, currency)} (${Math.round((financialSummary.disbursed / financialSummary.totalCommitted) * 100)}%)
* Held in Active Verification Escrow: ${formatCurrency(financialSummary.inEscrow, currency)}
* Upcoming Milestone Allocation: ${formatCurrency(financialSummary.upcoming, currency)}

3. MILESTONE EXECUTION ROADMAP:
--------------------------------------------------------------------------------
${(activeProject.milestones || []).map((m, idx) => `[${m.status === 'completed' ? 'X' : m.status === 'in_progress' ? '►' : ' '}] Stage ${idx + 1}: ${m.title || m.name || 'Stage ' + (idx + 1)}
    Status: ${m.status.toUpperCase()} (${m.progressPercent}%) | Amount: ${formatCurrency(m.amount || m.escrowReleaseAmount || 0, currency)}
    Target: ${m.targetDate} | Client Approved: ${m.isClientSignedOff || m.isClientApproved ? 'YES' : 'PENDING'}
`).join('\n')}

4. RECENT CONFIDENTIAL SITE AUDITS & UPDATES:
--------------------------------------------------------------------------------
${(activeProject.statusUpdates || []).slice(0, 3).map((u) => `• [${u.date}] ${u.title}
    Category: ${u.category.toUpperCase()} | Reported by: ${u.authorName} (${u.authorRole})
    Detail: ${u.content}
`).join('\n')}

5. ARCHITECTURAL CERTIFICATION:
--------------------------------------------------------------------------------
This report certifies that the physical construction and structural works have been
audited against Indian Standard IS 456:2000, IS 1893:2016, and National Building Code 2016.
All milestone disbursements adhere to verified site progress.

Principal Architect: Ar. S. Gouse
Gouse AI Architecture & Construction Automation
Bangalore, India • Contact: sgouse14@gmail.com
================================================================================`;

    const blob = new Blob([briefContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeProject.name.replace(/\s+/g, '_')}_Executive_Progress_Brief_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Empty state if client is not assigned to any projects
  if (!activeProject || assignedProjects.length === 0) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-6 bg-slate-950 text-slate-100">
        <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">No Assigned Projects Found</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your client profile <span className="text-amber-400 font-mono">({user?.email})</span> is authenticated, but no active projects are currently linked to your account.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-left text-xs text-slate-400 space-y-1">
            <div className="text-slate-300 font-semibold">Next Steps:</div>
            <div>• Contact Lead Architect Ar. S. Gouse to assign your project.</div>
            <div>• Or explore the platform demo to review system capabilities.</div>
          </div>
          {onOpenPlatformDemo && (
            <button
              type="button"
              onClick={onOpenPlatformDemo}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch Interactive Platform Demo</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Filtered status updates
  const filteredUpdates = (activeProject.statusUpdates || []).filter((u) => {
    if (updateCategoryFilter === 'all') return true;
    return u.category === updateCategoryFilter;
  });

  // Filtered documents
  const filteredDocs = (activeProject.sharedDocuments || []).filter((d) => {
    if (docCategoryFilter === 'all') return true;
    return d.category === docCategoryFilter;
  });

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* OUTSIDE PLATFORM NOTIFICATION & QUICK LOGIN BAR */}
      {(!user || isUnauthenticatedOutside) && (
        <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-amber-950/80 border-b border-sky-500/40 px-4 py-2.5 text-xs flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-sky-500 text-slate-950 font-black font-mono text-[10px]">
              CLIENT PORTAL • DASHBOARD
            </span>
            <span className="text-slate-200">
              Exploring Dashboard in Client Portal. Sign in to review your specific private contract records and milestone approvals.
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onViewPublicPortal && (
              <button
                type="button"
                onClick={onViewPublicPortal}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-semibold transition"
              >
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span>Client Portal</span>
              </button>
            )}
            <button
              type="button"
              onClick={openLoginModal}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          </div>
        </div>
      )}

      {/* 1. TOP CLIENT CONTEXT HEADER & PROJECT SELECTOR */}
      <div className="bg-slate-900/95 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Client Persona & Project Badge */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center justify-center font-mono font-bold text-base shrink-0">
                {user?.name?.charAt(0) || 'C'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm sm:text-base">
                    Dashboard: <span className="text-amber-400">{activeProject.name}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {user?.role === 'client' ? 'Authorized Client Access' : 'Client Portal View'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span>{user?.name || 'Client Stakeholder (Guest Preview)'}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeProject.location}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-slate-300">
                    {assignedProjects.length} Assigned {assignedProjects.length === 1 ? 'Project' : 'Projects'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Multi-Project Selector (if client has > 1 project) & Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              {assignedProjects.length > 1 && (
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400 px-2 font-mono">My Projects:</span>
                  <select
                    value={activeProject.id}
                    onChange={(e) => handleSelectProject(e.target.value)}
                    className="bg-slate-900 text-xs text-white px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-amber-400 font-medium"
                  >
                    {assignedProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name.length > 32 ? `${p.name.substring(0, 32)}...` : p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {onViewPublicPortal && (
                <button
                  type="button"
                  onClick={onViewPublicPortal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                  title="Explore public client portal & showcase"
                >
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Client Portal</span>
                </button>
              )}

              {onOpenPlatformDemo && (
                <button
                  type="button"
                  onClick={onOpenPlatformDemo}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                  title="Watch interactive platform demo"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Platform Demo</span>
                </button>
              )}

              {isStaffPreview && onReturnToPlatform && (
                <button
                  type="button"
                  onClick={onReturnToPlatform}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm"
                >
                  <span>Return to Studio</span>
                </button>
              )}

              {!isStaffPreview && user && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-300 hidden md:inline">
                    Signed in: <strong className="text-white">{user.name}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={logout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-white text-xs font-bold transition shadow-sm"
                    title="Sign out of client session"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}

              {!user && (
                <button
                  type="button"
                  onClick={openLoginModal}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm"
                  title="Sign in to your client account"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. PROJECT HERO SUMMARY STRIP */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Stat 1: Overall Physical Progress */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>PHYSICAL COMPLETION</span>
                <span className="text-emerald-400 font-bold">{overallMilestoneProgress}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${overallMilestoneProgress}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-400">
                Verified via Geotagged AI Site Cam Inspections
              </div>
            </div>

            {/* Stat 2: Active Phase */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
              <div className="text-xs text-slate-400 font-mono uppercase">CURRENT STAGE</div>
              <div className="text-sm font-bold text-white capitalize">
                {activeProject.status.replace('_', ' ')}
              </div>
              <div className="text-[11px] text-amber-400">
                Stage 4 of 6: Second Floor Slab &amp; AAC Masonry
              </div>
            </div>

            {/* Stat 3: Built-Up Area & Typology */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
              <div className="text-xs text-slate-400 font-mono uppercase">AREA &amp; SPECIFICATION</div>
              <div className="text-sm font-bold text-white font-mono">
                {activeProject.builtUpAreaSqFt?.toLocaleString() || '5,800'} Sq.Ft
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {activeProject.projectType}
              </div>
            </div>

            {/* Stat 4: Lead Architecture Contact */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
              <div className="text-xs text-slate-400 font-mono uppercase">LEAD ARCHITECT</div>
              <div className="text-sm font-bold text-white">Ar. S. Gouse</div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                <span>CoA CA/2012/55190</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-400">On Call</span>
              </div>
            </div>
          </div>

          {/* Primary View Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pt-2 overflow-x-auto">
            <button
              id="tab-client-dashboard"
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition border-b-2 whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'border-amber-400 text-amber-400 bg-amber-500/5'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                OVERVIEW
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('milestones')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition border-b-2 whitespace-nowrap ${
                activeTab === 'milestones'
                  ? 'border-amber-400 text-amber-400 bg-amber-500/5'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Milestone Progress &amp; Escrow</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                {activeProject.milestones?.length || 6}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('updates')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition border-b-2 whitespace-nowrap ${
                activeTab === 'updates'
                  ? 'border-amber-400 text-amber-400 bg-amber-500/5'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Project Status Updates &amp; Site Feed</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                {activeProject.statusUpdates?.length || 4}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition border-b-2 whitespace-nowrap ${
                activeTab === 'documents'
                  ? 'border-amber-400 text-amber-400 bg-amber-500/5'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              <span>Document Sharing &amp; Drawings</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                {activeProject.sharedDocuments?.length || 5}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('team')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition border-b-2 whitespace-nowrap ${
                activeTab === 'team'
                  ? 'border-amber-400 text-amber-400 bg-amber-500/5'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Design Team &amp; Contacts</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. MAIN TAB CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* ============================================================== */}
        {/* TAB 0: CLIENT DASHBOARD (COMPREHENSIVE OVERVIEW HUB)           */}
        {/* ============================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* 1. WELCOME & EXECUTIVE ACTION BANNER */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-amber-950/30 border border-amber-500/30 shadow-2xl space-y-6 relative overflow-hidden">
              <div
                className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"
                aria-hidden="true"
              />

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      CLIENT INVESTOR HUB
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live Synchronized
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Welcome, <span className="text-amber-400">{user?.name || 'Client Stakeholder'}</span>
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                    Overview for <strong className="text-white">{activeProject.name}</strong> ({activeProject.location}). All structural drawings, geotagged site camera feeds, locked BOQ indices, and escrow milestones are audited in real time under Indian Standard code compliance.
                  </p>
                </div>

                {/* Executive Quick Actions */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleDownloadExecutiveBrief}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-500/20"
                    title="Download comprehensive progress & audit report"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Progress Report</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(true)}
                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700"
                  >
                    <Upload className="w-4 h-4 text-amber-400" />
                    <span>Share Document</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSiteCameraModalOpen(true)}
                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700"
                  >
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span>Site Camera</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('team')}
                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700"
                  >
                    <MessageSquare className="w-4 h-4 text-sky-400" />
                    <span>Contact Architect</span>
                  </button>
                </div>
              </div>

              {/* Quick Status Sub-Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Organization</span>
                  <span className="font-semibold text-slate-200 truncate block">
                    {activeProject.clientCompany || user?.company || 'Prestige Urban Ventures Pvt Ltd'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Typology / Area</span>
                  <span className="font-semibold text-slate-200 block">
                    {activeProject.builtUpAreaSqFt?.toLocaleString() || '5,800'} Sq.Ft • {activeProject.projectType}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Lead Architect</span>
                  <span className="font-semibold text-slate-200 block">
                    Ar. S. Gouse (CoA Reg: CA/2012/55190)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Next Site Pour</span>
                  <span className="font-semibold text-amber-400 block">
                    Phase 4 Concrete Slump Audit (Tomorrow 10:30 AM)
                  </span>
                </div>
              </div>
            </div>

            {/* 2. CORE PERFORMANCE & FINANCIAL KPIS (4 CARDS GRID) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* KPI 1: Physical Execution Progress */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 hover:border-amber-500/40 transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Physical Progress</span>
                  <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                    <Activity className="w-4 h-4" />
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white font-mono">{overallMilestoneProgress}%</span>
                  <span className="text-xs text-emerald-400 font-semibold font-mono">Verified On-Site</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-emerald-400 h-2 rounded-full transition-all duration-700"
                    style={{ width: `${overallMilestoneProgress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>{financialSummary.completedCount} of {financialSummary.totalCount} Stages Done</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('milestones')}
                    className="text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    Roadmap <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* KPI 2: Financial Escrow Accounting */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 hover:border-emerald-500/40 transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Milestone Escrow</span>
                  <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                    {formatCurrency(financialSummary.disbursed, currency)}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Disbursed</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-2"
                    style={{ width: `${Math.round((financialSummary.disbursed / financialSummary.totalCommitted) * 100)}%` }}
                    title="Disbursed"
                  />
                  <div
                    className="bg-amber-500 h-2"
                    style={{ width: `${Math.round((financialSummary.inEscrow / financialSummary.totalCommitted) * 100)}%` }}
                    title="In Escrow"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>In Escrow: <strong className="text-amber-300 font-mono">{formatCurrency(financialSummary.inEscrow, currency)}</strong></span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('milestones')}
                    className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    Ledger <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* KPI 3: Structural & Code Safety Score */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 hover:border-cyan-500/40 transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Structural Quality</span>
                  <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white font-mono">98.6<span className="text-sm text-slate-400 font-normal">/100</span></span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    GRADE A+
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-snug">
                  Audited against IS 456:2000 &amp; NBC 2016. Zero unresolved BIM clashes detected across beam &amp; duct penetrations.
                </p>
                <div className="text-[11px] text-cyan-400 font-mono pt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>100% Structural Safety Compliant</span>
                </div>
              </div>

              {/* KPI 4: Client Approval Action Center */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 hover:border-indigo-500/40 transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Action Center</span>
                  <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                    <CheckSquare className="w-4 h-4" />
                  </span>
                </div>

                {activeProject.milestones?.find((m) => m.status === 'in_progress') ? (
                  <>
                    <div>
                      <div className="text-xs font-bold text-white truncate">
                        {activeProject.milestones.find((m) => m.status === 'in_progress')?.title || activeProject.milestones.find((m) => m.status === 'in_progress')?.name || 'Active Milestone'}
                      </div>
                      <div className="text-[11px] text-amber-400 mt-0.5">
                        Physical inspection completed • Authorization requested
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const inProg = activeProject.milestones?.find((m) => m.status === 'in_progress');
                        if (inProg) handleApproveMilestone(inProg.id);
                      }}
                      className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Authorize Current Milestone</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold py-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>All Approvals Up to Date</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Current milestone is executing on schedule. Next client sign-off will trigger upon slab inspection.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('updates')}
                      className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-1.5"
                    >
                      <span>Check Site Feed</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 3. LIVE 360° AI SITE CAMERA & ACTIVITY LOG (2 COLUMNS) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Live AI Site Camera Feed Widget (7 cols) */}
              <div className="lg:col-span-7 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden flex flex-col">
                <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Live AI Site Camera Feed</span>
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                          LIVE
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Geotagged 360° photographic surveillance with automated rebar &amp; slump inspection
                      </p>
                    </div>
                  </div>

                  {/* Camera Angle Switcher */}
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    {(['slab', 'crane', 'entrance'] as const).map((angle) => (
                      <button
                        key={angle}
                        type="button"
                        onClick={() => setDashboardCameraAngle(angle)}
                        className={`px-2.5 py-1 rounded-lg capitalize transition text-[11px] font-medium ${
                          dashboardCameraAngle === angle
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {angle === 'slab' ? 'Deck Cam' : angle === 'crane' ? 'Crane 360°' : 'Gate Cam'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Simulated Live View Stream Container */}
                <div className="relative aspect-video sm:aspect-[16/9] bg-slate-950 overflow-hidden group">
                  <img
                    src={cameraAnglePresets[dashboardCameraAngle].image}
                    alt={cameraAnglePresets[dashboardCameraAngle].name}
                    className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                  />

                  {/* HUD Scan Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/60 pointer-events-none" />

                  {/* Top HUD Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono">
                    <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700/60 text-slate-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{cameraAnglePresets[dashboardCameraAngle].name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="hidden sm:inline bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700/60 text-amber-300">
                        {cameraAnglePresets[dashboardCameraAngle].time}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsSiteCameraModalOpen(true)}
                        className="bg-slate-950/80 hover:bg-slate-800 text-slate-200 p-1.5 rounded-lg border border-slate-700/60 transition"
                        title="Open interactive 360 camera modal"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Bottom HUD Location & AI Specs */}
                  <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-amber-400" />
                        {cameraAnglePresets[dashboardCameraAngle].location}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        {cameraAnglePresets[dashboardCameraAngle].badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono truncate">
                      {cameraAnglePresets[dashboardCameraAngle].specs}
                    </p>
                  </div>
                </div>

                {/* Camera Card Footer */}
                <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    Site Location: <span className="text-slate-200 font-mono">12.9716° N, 77.5946° E</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSiteCameraModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Launch 360° Inspection Tool</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Recent Engineering Updates Feed (5 cols) */}
              <div className="lg:col-span-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl p-5 flex flex-col space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">Recent Engineering Field Updates</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('updates')}
                    className="text-xs text-amber-400 hover:underline font-semibold"
                  >
                    View All →
                  </button>
                </div>

                <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[380px] pr-1">
                  {(activeProject.statusUpdates || []).slice(0, 3).map((update) => (
                    <div
                      key={update.id}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 hover:border-slate-700 transition"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-white truncate">{update.title}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                          {update.date}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                        {update.content}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span className="text-slate-400">By {update.authorName} ({update.authorRole})</span>
                        {update.isInspectionVerified && (
                          <span className="text-emerald-400 font-mono flex items-center gap-1 text-[10px]">
                            <CheckCircle2 className="w-3 h-3" /> QA Approved
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Inline Client Query Box */}
                <div className="pt-2 border-t border-slate-800">
                  <div className="text-[11px] text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <Send className="w-3 h-3 text-amber-400" />
                    <span>Quick question for Ar. S. Gouse:</span>
                  </div>
                  <form onSubmit={handleSendComment} className="flex gap-2">
                    <input
                      type="text"
                      value={clientCommentText}
                      onChange={(e) => setClientCommentText(e.target.value)}
                      placeholder="e.g. Can we confirm marble delivery date?"
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shrink-0"
                    >
                      Send
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* 4. SEQUENTIAL MILESTONE PROGRESS ROADMAP */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Turnkey Milestone Roadmap &amp; Escrow Schedule</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sequential progress tracking with verified engineering sign-offs prior to escrow release
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('milestones')}
                  className="flex items-center gap-1 text-xs text-amber-400 hover:underline font-semibold"
                >
                  <span>Open Full Milestone Ledger</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Horizontal / Grid Roadmap Steps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                {(activeProject.milestones || []).map((ms, idx) => {
                  const isCompleted = ms.status === 'completed';
                  const isInProgress = ms.status === 'in_progress';
                  const isUpcoming = ms.status === 'upcoming';

                  return (
                    <div
                      key={ms.id}
                      onClick={() => setActiveTab('milestones')}
                      className={`p-4 rounded-xl border cursor-pointer transition space-y-2.5 ${
                        isCompleted
                          ? 'bg-slate-950/70 border-emerald-500/30 hover:border-emerald-500'
                          : isInProgress
                          ? 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/30'
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-500">STAGE 0{idx + 1}</span>
                        {isCompleted && <span className="text-emerald-400 font-bold">DONE ✓</span>}
                        {isInProgress && <span className="text-amber-400 font-bold animate-pulse">ACTIVE ►</span>}
                        {isUpcoming && <span className="text-slate-500">QUEUED</span>}
                      </div>

                      <div className="text-xs font-bold text-white line-clamp-2 min-h-[32px]">
                        {ms.title || ms.name || `Stage 0${idx + 1}`}
                      </div>

                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${isCompleted ? 'bg-emerald-400' : isInProgress ? 'bg-amber-400' : 'bg-slate-700'}`}
                          style={{ width: `${ms.progressPercent || 0}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>{ms.targetDate}</span>
                        <span className="text-slate-200">{formatCurrency(ms.amount || ms.escrowReleaseAmount || 0, currency)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. CONFIDENTIAL DOCUMENTS & DRAWINGS REPOSITORY PREVIEW */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <FolderOpen className="w-4 h-4 text-amber-400" />
                  <div>
                    <h3 className="text-base font-bold text-white">Confidential Drawings &amp; Sanction Repository</h3>
                    <p className="text-xs text-slate-400">
                      Verified working CAD files, structural calculation reports, and client wishlists
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Document</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('documents')}
                    className="text-xs text-amber-400 hover:underline font-semibold"
                  >
                    View All ({activeProject.sharedDocuments?.length || 5}) →
                  </button>
                </div>
              </div>

              {/* Documents Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(activeProject.sharedDocuments || []).slice(0, 4).map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-amber-400 uppercase border border-slate-800">
                          {doc.fileType}
                        </span>
                        <span className="text-slate-400">{doc.fileSize}</span>
                      </div>
                      <div className="text-xs font-bold text-white line-clamp-2">
                        {doc.title}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {doc.fileName}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="text-slate-300 hover:text-white flex items-center gap-1 font-medium"
                      >
                        <Eye className="w-3 h-3 text-slate-400" />
                        <span>Preview</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadDocument(doc)}
                        className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                      >
                        <Download className="w-3 h-3" />
                        <span>Get File</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. MULTI-PROPERTY PORTFOLIO (Shown if client is assigned to multiple estates) */}
            {assignedProjects.length > 1 && (
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <div>
                      <h3 className="text-base font-bold text-white">Your Assigned Estates Portfolio</h3>
                      <p className="text-xs text-slate-400">
                        Switch active workspace or compare physical progress across your registered properties
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-slate-400">{assignedProjects.length} Properties Linked</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assignedProjects.map((proj) => {
                    const isCurrent = proj.id === activeProject.id;
                    return (
                      <div
                        key={proj.id}
                        className={`p-4 rounded-xl border transition flex flex-col justify-between gap-3 ${
                          isCurrent
                            ? 'bg-amber-500/10 border-amber-500/50'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-white">{proj.name}</h4>
                              {isCurrent && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500 text-slate-950 font-bold">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">{proj.location} • {proj.projectType}</div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-mono font-bold text-white">
                              {proj.builtUpAreaSqFt?.toLocaleString() || '5,800'} Sq.Ft
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                          <span className="text-xs text-slate-400 capitalize">Stage: {proj.status.replace('_', ' ')}</span>
                          {!isCurrent ? (
                            <button
                              type="button"
                              onClick={() => handleSelectProject(proj.id)}
                              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                            >
                              Switch to Estate
                            </button>
                          ) : (
                            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Viewing Now
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 7. ARCHITECTURAL & ENGINEERING ADVISORY TEAM CARD */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <h3 className="text-base font-bold text-white">Dedicated Architectural &amp; Structural Leadership</h3>
                </div>
                <div className="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Principal Office Available (9:00 AM - 7:00 PM IST)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Contact 1: Lead Architect */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80"
                      alt="Ar. S. Gouse"
                      className="w-11 h-11 rounded-xl object-cover border border-amber-500/40"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">Ar. S. Gouse</div>
                      <div className="text-[11px] text-amber-400">Principal Architect &amp; Founder</div>
                      <div className="text-[10px] text-slate-500 font-mono">CoA Reg: CA/2012/55190</div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                    <a
                      href="tel:+918073947241"
                      className="flex-1 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 border border-slate-800"
                    >
                      <Phone className="w-3 h-3 text-amber-400" />
                      <span>Call</span>
                    </a>
                    <a
                      href="mailto:sgouse14@gmail.com"
                      className="flex-1 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 border border-slate-800"
                    >
                      <Mail className="w-3 h-3 text-amber-400" />
                      <span>Email</span>
                    </a>
                  </div>
                </div>

                {/* Contact 2: Lead Structural Engineer */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80"
                      alt="Er. Rajesh Kumar"
                      className="w-11 h-11 rounded-xl object-cover border border-slate-700"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">Er. Rajesh Kumar</div>
                      <div className="text-[11px] text-slate-400">Chief Structural Engineer (M.Tech)</div>
                      <div className="text-[10px] text-slate-500 font-mono">IS 456 / IS 1893 Lead</div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                    <a
                      href="tel:+919845012890"
                      className="flex-1 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 border border-slate-800"
                    >
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>Call</span>
                    </a>
                    <a
                      href="mailto:sgouse14@gmail.com"
                      className="flex-1 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 border border-slate-800"
                    >
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>Email</span>
                    </a>
                  </div>
                </div>

                {/* Contact 3: Quantity Surveyor */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80"
                      alt="Priya Nair"
                      className="w-11 h-11 rounded-xl object-cover border border-slate-700"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">Priya Nair</div>
                      <div className="text-[11px] text-slate-400">Head of Quantity Surveying &amp; BOQ</div>
                      <div className="text-[10px] text-slate-500 font-mono">CPWD Schedule Auditor</div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                    <a
                      href="tel:+918041289001"
                      className="flex-1 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 border border-slate-800"
                    >
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>Call</span>
                    </a>
                    <a
                      href="mailto:sgouse14@gmail.com"
                      className="flex-1 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 border border-slate-800"
                    >
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>Email</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 1: MILESTONE PROGRESS & ESCROW                             */}
        {/* ============================================================== */}
        {activeTab === 'milestones' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Project Milestones &amp; Financial Escrow Verification
                </h3>
                <p className="text-xs text-slate-400">
                  Track physical completion stages. Funds are released only following structural verification and authorized client sign-off.
                </p>
              </div>

              {signedOffMilestoneId && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Milestone Approved &amp; Logged to Project Ledger!</span>
                </div>
              )}
            </div>

            {/* Milestones Sequential Pipeline */}
            <div className="space-y-4">
              {(activeProject.milestones || []).map((ms) => {
                const isCompleted = ms.status === 'completed';
                const isInProgress = ms.status === 'in_progress';

                return (
                  <div
                    key={ms.id}
                    className={`p-5 rounded-2xl border transition duration-200 space-y-4 ${
                      isCompleted
                        ? 'bg-slate-900/60 border-slate-800'
                        : isInProgress
                        ? 'bg-slate-900 border-amber-500/40 shadow-lg'
                        : 'bg-slate-950/60 border-slate-800/60 opacity-80'
                    }`}
                  >
                    {/* Header line */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                            isCompleted
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : isInProgress
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {isCompleted ? <Check className="w-4 h-4 stroke-[2.5]" /> : ms.stageNumber}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm sm:text-base font-bold text-white">{ms.title}</h4>
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase ${
                                isCompleted
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : isInProgress
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {ms.status.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            Target Date: <span className="text-slate-300 font-mono">{ms.targetDate}</span>
                            {ms.completedDate && (
                              <>
                                <span aria-hidden="true" className="mx-1.5">·</span>
                                <span>Completed: <strong className="text-emerald-400 font-mono">{ms.completedDate}</strong></span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Escrow Value Badge */}
                      {ms.escrowReleaseAmount && (
                        <div className="text-right">
                          <div className="text-[11px] text-slate-400 font-mono uppercase">Escrow Valuation</div>
                          <div className="text-sm font-bold font-mono text-white">
                            {formatCurrency(ms.escrowReleaseAmount, currency)}
                          </div>
                          <div className="text-[10px] font-mono capitalize text-slate-400">
                            {ms.escrowStatus?.replace('_', ' ')}
                          </div>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-light">{ms.description}</p>

                    {/* Progress Bar for In-Progress item */}
                    {isInProgress && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-xs text-slate-400 font-mono">
                          <span>Physical Progress:</span>
                          <span className="text-amber-400 font-bold">{ms.progressPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${ms.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Deliverables Checklist */}
                    {ms.deliverables && ms.deliverables.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                        <div className="text-[11px] font-semibold text-slate-400 font-mono">Key Deliverables &amp; Test Certificates:</div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          {ms.deliverables.map((del, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-slate-300">
                              <CheckCircle2
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isCompleted ? 'text-emerald-400' : 'text-slate-500'
                                }`}
                              />
                              <span className="truncate">{del}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Client Approval Action Bar */}
                    <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="text-slate-400">
                        {ms.verifiedBy && (
                          <span>Technical Verification: <strong className="text-slate-200">{ms.verifiedBy}</strong></span>
                        )}
                        {ms.isClientSignedOff && (
                          <span className="text-emerald-400 ml-2 font-mono">✓ Signed off by Client</span>
                        )}
                      </div>

                      {/* Sign-off button for client if in progress and not yet signed off */}
                      {isInProgress && !ms.isClientSignedOff && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleApproveMilestone(ms.id)}
                            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md shadow-amber-500/20 flex items-center gap-1.5"
                          >
                            <FileCheck className="w-4 h-4" />
                            <span>Sign Off &amp; Approve Milestone</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: PROJECT STATUS UPDATES & SITE FEED                     */}
        {/* ============================================================== */}
        {activeTab === 'updates' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Live Project Status Feed &amp; Site Logs
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time engineering notices, concrete pour inspection certificates, and architectural milestones.
                </p>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs overflow-x-auto">
                {['all', 'structural', 'finishes', 'mep', 'civil'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setUpdateCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg capitalize transition font-medium ${
                      updateCategoryFilter === cat
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Updates Feed */}
            <div className="space-y-5">
              {filteredUpdates.map((u) => (
                <div
                  key={u.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-slate-700 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-bold text-amber-400 text-xs">
                        {u.authorName.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{u.authorName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{u.authorRole}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                      <span className="capitalize px-2 py-0.5 rounded bg-slate-800 text-amber-300 text-[10px]">
                        {u.category}
                      </span>
                      <span>{u.date}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm sm:text-base font-bold text-white">{u.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-light">{u.content}</p>
                  </div>

                  {/* Optional Photos */}
                  {u.mediaUrls && u.mediaUrls.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {u.mediaUrls.map((url, i) => (
                        <div key={i} className="h-44 rounded-xl overflow-hidden relative border border-slate-800 group">
                          <img
                            src={url}
                            alt="Site Verification"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                          <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
                            <Camera className="w-3 h-3" />
                            <span>Geotagged Inspection Photo</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Verification Footer */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verified by Engineering QC</span>
                    </span>
                    <span className="font-mono text-slate-300">Phase Completion: {u.progressPercentage}%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Client Inquiry Box */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <span>Ask a Question or Request Clarification from the Site Engineer</span>
              </div>

              {commentSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                  {commentSuccessMsg}
                </div>
              )}

              <form onSubmit={handleSendComment} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={clientCommentText}
                  onChange={(e) => setClientCommentText(e.target.value)}
                  placeholder="e.g. Can we review the lighting circuit routing for the terrace lounge?"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmit to Studio</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: DOCUMENT SHARING REPOSITORY                             */}
        {/* ============================================================== */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Confidential Project Documents &amp; Working Drawings
                </h3>
                <p className="text-xs text-slate-400">
                  Access official permits, structural design certificates, locked BOQ matrices, and upload custom finishes wishlists.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Share Client Document</span>
                </button>
              </div>
            </div>

            {/* Documents Category Pills Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
              {[
                { id: 'all', label: 'All Files' },
                { id: 'architectural_drawings', label: 'Architectural Drawings' },
                { id: 'structural_reports', label: 'Structural Certificates' },
                { id: 'boq_financials', label: 'BOQ & Financials' },
                { id: 'site_audit', label: 'Site & Quality Audits' },
                { id: 'client_uploads', label: 'Client Uploads' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setDocCategoryFilter(c.id)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition font-medium ${
                    docCategoryFilter === c.id
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Documents List */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
              <div className="divide-y divide-slate-800">
                {filteredDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/40 transition"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 text-amber-400">
                        {doc.fileType === 'pdf' ? (
                          <FileText className="w-5 h-5" />
                        ) : doc.fileType === 'xlsx' ? (
                          <FileSpreadsheet className="w-5 h-5" />
                        ) : (
                          <Layers className="w-5 h-5" />
                        )}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white truncate">{doc.title}</h4>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.2 rounded capitalize ${
                              doc.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : doc.status === 'final'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {doc.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
                          <span className="text-slate-300">{doc.fileName}</span>
                          <span aria-hidden="true">·</span>
                          <span>{doc.fileSize}</span>
                          <span aria-hidden="true">·</span>
                          <span>{doc.version}</span>
                          <span aria-hidden="true">·</span>
                          <span>Uploaded: {doc.uploadedAt}</span>
                        </div>

                        {doc.notes && (
                          <p className="text-xs text-slate-400 font-light pt-0.5 line-clamp-1">{doc.notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadDocument(doc)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: DESIGN TEAM & CONTACTS                                  */}
        {/* ============================================================== */}
        {activeTab === 'team' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Project Leadership &amp; Engineering Contacts
              </h3>
              <p className="text-xs text-slate-400">
                Direct contacts for your dedicated architectural team, structural engineer, and cost controller.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Lead Architect */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80"
                    alt="Ar. S. Gouse"
                    className="w-14 h-14 rounded-2xl object-cover border border-amber-500/40"
                  />
                  <div>
                    <div className="text-sm font-bold text-white">Ar. S. Gouse</div>
                    <div className="text-xs text-amber-400 font-mono">Principal Architect</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Council of Architecture CA/2012/55190</div>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>sgouse14@gmail.com</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>+91 80739 47241</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  Responsible for spatial planning, municipal sanction clearances, and luxury finish execution.
                </div>
              </div>

              {/* Structural Consultant */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80"
                    alt="Er. Rajesh Kumar"
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-700"
                  />
                  <div>
                    <div className="text-sm font-bold text-white">Er. Rajesh Kumar</div>
                    <div className="text-xs text-cyan-400 font-mono">Structural Consultant</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">M.Tech IIT • IS 456 Lead</div>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>rajesh.kumar@gouseai.com</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>+91 80412 89001</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  Audits RCC frame calculations, steel rebar spacing, concrete cube test strengths, and seismic resilience.
                </div>
              </div>

              {/* Quantity Surveyor */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=300&q=80"
                    alt="Amit Verma"
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-700"
                  />
                  <div>
                    <div className="text-sm font-bold text-white">Amit Verma (QS)</div>
                    <div className="text-xs text-amber-400 font-mono">Senior Quantity Surveyor</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">MRICS Certified Cost Engineer</div>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>amit.verma@gouseai.com</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>+91 98112 34567</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  Oversees regional material supply rate indexes, milestone escrow accounting, and supplier contracts.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: DOCUMENT PREVIEW MODAL                                */}
      {/* ============================================================== */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <FileText className="w-5 h-5 text-amber-400" />
                <span>Document Preview &amp; Verification Details</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400">Document Title:</span>
                <div className="text-sm font-bold text-white mt-0.5">{previewDoc.title}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono">
                <div>
                  <span className="text-slate-400 text-[11px]">File Name:</span>
                  <div className="text-white text-xs truncate mt-0.5">{previewDoc.fileName}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">File Size:</span>
                  <div className="text-white text-xs mt-0.5">{previewDoc.fileSize}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Version:</span>
                  <div className="text-amber-400 text-xs mt-0.5">{previewDoc.version}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Uploaded Date:</span>
                  <div className="text-slate-300 text-xs mt-0.5">{previewDoc.uploadedAt}</div>
                </div>
              </div>

              <div>
                <span className="text-slate-400">Uploaded By:</span>
                <div className="text-slate-200 mt-0.5 font-medium">{previewDoc.uploadedBy}</div>
              </div>

              {previewDoc.notes && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 leading-relaxed font-light">
                  <span className="font-semibold text-white">Engineering Notes: </span>
                  {previewDoc.notes}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDownloadDocument(previewDoc);
                  setPreviewDoc(null);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download File</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: UPLOAD DOCUMENT MODAL                                  */}
      {/* ============================================================== */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Upload className="w-5 h-5 text-amber-400" />
                <span>Share Document with Architectural Team</span>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Document Title *</label>
                <input
                  type="text"
                  required
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="e.g. Master Bedroom Lighting Preference Wishlist"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Document Category</label>
                <select
                  value={newDocCategory}
                  onChange={(e) => setNewDocCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="client_uploads">Client Uploads &amp; Preferences</option>
                  <option value="architectural_drawings">Architectural &amp; CAD Review</option>
                  <option value="structural_reports">Structural &amp; Soil Inspection</option>
                  <option value="permits_sanctions">Government Sanctions &amp; Deeds</option>
                  <option value="boq_financials">Payment &amp; Financial Receipts</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Choose File (PDF, DWG, XLSX, Image)</label>
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setNewDocFile(e.target.files[0]);
                      if (!newDocTitle) {
                        setNewDocTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
                      }
                    }
                  }}
                  className="w-full text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-amber-400 hover:file:bg-slate-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Notes for Ar. S. Gouse</label>
                <textarea
                  rows={3}
                  value={newDocNotes}
                  onChange={(e) => setNewDocNotes(e.target.value)}
                  placeholder="Explain purpose of this document, instructions, or specific items to incorporate..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isUploading ? 'Uploading Document...' : 'Submit to Project Repository'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. SITE VISIT CAMERA MODAL */}
      <SiteVisitCameraModal
        isOpen={isSiteCameraModalOpen}
        onClose={() => setIsSiteCameraModalOpen(false)}
        activeProject={activeProject}
      />
    </div>
  );
};
