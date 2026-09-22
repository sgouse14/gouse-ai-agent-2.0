import React, { useState } from 'react';
import {
  FolderPlus,
  FileText,
  Sparkles,
  Upload,
  Users,
  History,
  MapPin,
  Maximize2,
  CheckCircle2,
  ChevronRight,
  Printer,
  Copy,
  Plus,
  Trash2,
  Zap,
  Scale,
  Building2,
  Calculator,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  Share2,
  Heart,
  MessageSquare,
  Send,
  Globe,
  Smartphone,
  ExternalLink,
  ThumbsUp,
  Eye,
  Play,
  Video,
  Camera,
  Film,
  Megaphone,
  Target,
  TrendingUp,
  DollarSign,
  Briefcase,
  Award,
  BarChart3,
  Sliders,
  Rocket,
  Radio,
  UserCheck,
  Phone,
} from 'lucide-react';
import { Project, ProjectFile, AnalysisReport, TeamMember, AuditEvent } from '../types';
import { formatDate } from '../utils/formatters';

interface ProjectsViewProps {
  projects: Project[];
  activeProject: Project;
  onSelectProject: (id: string) => void;
  onUpdateProject: (updated: Project) => void;
  onCreateProject: (newProj: Partial<Project>) => void;
  onOpenWorkflowEngine?: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onUpdateProject,
  onCreateProject,
  onOpenWorkflowEngine,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'intelligence' | 'team' | 'social'>('intelligence');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectType, setNewProjectType] = useState('Residential Architecture');
  const [newLocation, setNewLocation] = useState('');
  const [newArea, setNewArea] = useState<number>(3500);
  const [newDescription, setNewDescription] = useState('');

  // Social & Media Showcase state (Instagram, Facebook, YouTube, WhatsApp, LinkedIn)
  const [socialPlatform, setSocialPlatform] = useState<'all' | 'instagram' | 'facebook' | 'youtube' | 'whatsapp' | 'linkedin'>('all');
  const [socialMode, setSocialMode] = useState<'ads' | 'organic'>('ads'); // 'ads' for Company Promotion via Social Ads, 'organic' for Media Showcase
  const [isPublicShowcase, setIsPublicShowcase] = useState<boolean>(true);
  const [copiedSocialShare, setCopiedSocialShare] = useState<boolean>(false);
  const [copiedInstagramKit, setCopiedInstagramKit] = useState<boolean>(false);
  const [copiedFacebookKit, setCopiedFacebookKit] = useState<boolean>(false);
  const [copiedYouTubeKit, setCopiedYouTubeKit] = useState<boolean>(false);
  const [isPlayingWalkthrough, setIsPlayingWalkthrough] = useState<boolean>(false);
  const [instagramFormat, setInstagramFormat] = useState<'reel' | 'post' | 'carousel'>('reel');
  const [newSocialComment, setNewSocialComment] = useState<string>('');
  const [newCommentAuthor, setNewCommentAuthor] = useState<string>('Ar. S. Gouse');
  const [newCommentTag, setNewCommentTag] = useState<string>('Architectural Update');

  // Company Social Ads & Promotion Studio state
  const [companyName, setCompanyName] = useState<string>('Gouse Architectural Design & Turnkey Construction Pvt Ltd');
  const [companyTagline, setCompanyTagline] = useState<string>('NBC 2016 Compliant Luxury Villas, High-End Residences & Zero-Escalation Turnkey Construction');
  const [companyWebsite, setCompanyWebsite] = useState<string>('https://gouse-architecture.studio');
  const [companyPhone, setCompanyPhone] = useState<string>('+91 8073947241');
  const [adCampaignGoal, setAdCampaignGoal] = useState<'leads' | 'turnkey' | 'brand' | 'developers'>('leads');
  const [adPlatformFocus, setAdPlatformFocus] = useState<'all' | 'instagram' | 'facebook' | 'youtube' | 'linkedin'>('all');
  const [adBudgetTier, setAdBudgetTier] = useState<number>(500); // INR per ad (User set: budget per ads 500)
  const [adTargetLocation, setAdTargetLocation] = useState<string>('Bengaluru, Hyderabad, Mumbai & Global NRIs');
  const [clientPrivacyShield, setClientPrivacyShield] = useState<boolean>(true); // Protects confidential client names (e.g. Krishnappa 01)
  const [customShowcaseTitle, setCustomShowcaseTitle] = useState<string>('Signature Luxury Villa & Residence');
  const [isCampaignLive, setIsCampaignLive] = useState<boolean>(false);
  const [copiedAdCopy, setCopiedAdCopy] = useState<boolean>(false);
  const [copiedAdPackage, setCopiedAdPackage] = useState<boolean>(false);
  const [previewAdDevice, setPreviewAdDevice] = useState<'instagram' | 'facebook' | 'youtube'>('instagram');
  const [simulatedLeads, setSimulatedLeads] = useState<Array<{
    id: string;
    name: string;
    phone: string;
    projectType: string;
    budget: string;
    channel: string;
    time: string;
  }>>([
    {
      id: 'lead-1',
      name: 'Rajiv Chawla',
      phone: '+91 98451 44210',
      projectType: '4,800 sq.ft Biophilic Villa (Whitefield)',
      budget: '₹2.8 Cr',
      channel: 'Instagram Reel Ad',
      time: '14 mins ago',
    },
    {
      id: 'lead-2',
      name: 'Dr. Anita Deshmukh',
      phone: '+91 97402 81920',
      projectType: 'Turnkey Handover G+3 Residence (Indiranagar)',
      budget: '₹3.5 Cr',
      channel: 'Facebook Lead Ad',
      time: '1 hour ago',
    },
    {
      id: 'lead-3',
      name: 'Sanjay Reddy (NRI - Dubai)',
      phone: '+971 50 812 9043',
      projectType: 'Commercial Boutique High-Rise / Studio Office',
      budget: '₹6.2 Cr',
      channel: 'YouTube 3D Tour Ad',
      time: '3 hours ago',
    },
  ]);
  const [socialComments, setSocialComments] = useState<Array<{
    id: string;
    author: string;
    role: string;
    avatarText: string;
    timestamp: string;
    content: string;
    likes: number;
    hasLiked?: boolean;
    tag?: string;
  }>>([
    {
      id: 'soc-1',
      author: 'Ar. S. Gouse',
      role: 'Principal Architect',
      avatarText: 'SG',
      timestamp: '2 hours ago',
      content: 'Elevation option B featuring wire-cut exposed brickwork and fluted granite fins has been published to the client review portal. ADS setbacks verified at 2.5ft front and 2.0ft sides.',
      likes: 6,
      hasLiked: false,
      tag: 'Architectural Update',
    },
    {
      id: 'soc-2',
      author: 'Vikramaditya Hegde',
      role: 'Project Owner / Client',
      avatarText: 'VH',
      timestamp: 'Yesterday',
      content: 'Reviewed the courtyard skylight and the BOQ material allocation. The proposed teak louvers and Kota stone flooring match our vision perfectly! Ready for structural sign-off.',
      likes: 9,
      hasLiked: true,
      tag: 'Client Approval',
    },
    {
      id: 'soc-3',
      author: 'Er. Ramesh Babu',
      role: 'Structural Lead',
      avatarText: 'RB',
      timestamp: '2 days ago',
      content: 'Soil load-bearing capacity test completed: 180 kN/m². Column grid coordinates aligned with the 40x60 plot boundary envelope.',
      likes: 4,
      hasLiked: false,
      tag: 'Site Verification',
    },
  ]);

  const handleAddSocialComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSocialComment.trim()) return;
    const newEntry = {
      id: `soc-${Date.now()}`,
      author: newCommentAuthor,
      role: newCommentAuthor.includes('Gouse') ? 'Principal Architect' : newCommentAuthor.includes('Client') ? 'Client Partner' : 'Project Collaborator',
      avatarText: newCommentAuthor.slice(0, 2).toUpperCase(),
      timestamp: 'Just now',
      content: newSocialComment.trim(),
      likes: 1,
      hasLiked: true,
      tag: newCommentTag,
    };
    setSocialComments([newEntry, ...socialComments]);
    setNewSocialComment('');
  };

  const handleToggleLikeComment = (commentId: string) => {
    setSocialComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const hasLiked = !c.hasLiked;
          return {
            ...c,
            hasLiked,
            likes: hasLiked ? c.likes + 1 : Math.max(0, c.likes - 1),
          };
        }
        return c;
      })
    );
  };

  // Safe accessors for active project properties
  const members = activeProject?.members || [];
  const auditLogs = activeProject?.auditLogs || [];
  const files = activeProject?.files || [];
  const analyses = activeProject?.analyses || [];

  // Intelligence audit state
  const [auditFocus, setAuditFocus] = useState('Comprehensive Architectural & Technical Audit');
  const [isRunningIntelligence, setIsRunningIntelligence] = useState(false);

  // File upload state
  const [isUploading, setIsUploading] = useState(false);
  const [attachedFileName, setAttachedFileName] = useState('');
  const [attachedFileContent, setAttachedFileContent] = useState('');

  // Team member state
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<TeamMember['role']>('architect');

  // Audit log state
  const [isAddingAuditLog, setIsAddingAuditLog] = useState(false);
  const [newAuditAction, setNewAuditAction] = useState('');
  const [newAuditActor, setNewAuditActor] = useState('Ar. Gouse');
  const [newAuditDetails, setNewAuditDetails] = useState('');
  const [confirmClearAudit, setConfirmClearAudit] = useState(false);

  // Copy notification
  const [copiedReportId, setCopiedReportId] = useState<string | null>(null);

  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    onCreateProject({
      name: newProjectName.trim(),
      projectType: newProjectType,
      location: newLocation.trim() || 'Global',
      builtUpAreaSqFt: Number(newArea) || 2500,
      description: newDescription.trim() || 'Custom architectural project brief.',
      status: 'planning',
    });

    setNewProjectName('');
    setNewLocation('');
    setNewDescription('');
    setIsCreatingProject(false);
  };

  const getArchitecturalAuditFallback = (name: string, typology: string, desc: string, focus: string): string => {
    return `## 1. Executive Summary & Project Brief
Preliminary architectural audit and technical advisory for **${name || 'Project'}**, categorized under **${typology || 'Architecture'}**.
- **Scope Intent**: ${desc || 'Design development, structural coordination, and statutory compliance.'}
- **Audit Focus**: ${focus}

## 2. Spatial Programming & Design Rationale
- **Circulation Zoning**: Establish clear hierarchical separation between public arrival galleries, core living/work zones, and private service back-of-house corridors.
- **Bioclimatic Orientation**: Optimize massing along the East-West axis with deep solar overhangs, recessed fenestrations, and horizontal louvers on vulnerable South/West facades.
- **Daylight & Acoustic Comfort**: Maximize daylight autonomy (sDA > 75%) while providing acoustic dampening (NRC > 0.70) between active zones and quiet private quarters.

## 3. Structural, Materials & BOQ Overview
- **Substructure & Superstructure**: M25/M30 grade reinforced cement concrete (RCC) framed structure with Fe550D TMT reinforcement rebars.
- **Thermal Envelope & Partitions**: 150mm/200mm Autoclaved Aerated Concrete (AAC) blocks for exterior envelope to minimize thermal bridging; 100mm solid brick/block internal partitions.
- **Waterproofing & Durability**: Dual-coat elastomeric crystalline waterproofing membrane for subterranean basements, podiums, and terrace gardens with a 10-year warranty.
- **Contingency Reserve**: Maintain a baseline 7.5% to 10% design contingency reserve in early stage BOQ line-item budgeting.

## 4. Building Code, NBC & Statutory Considerations
- **Setback & Ground Coverage**: Conforms with municipal development control rules for fire tender turnaround (min 6.0m clear paved pathway).
- **Life-Safety & Egress**: Clear corridor widths conform to NBC 2016 Part 4. Max travel distance to protected fire stairwell ≤ 30m in unsprinklered or ≤ 45m in sprinklered layouts.
- **Universal Accessibility**: Accessible ramps at 1:12 gradient with continuous handrails, tactile directional flooring indicators, and wheelchair accessible turning radii.

## 5. Coordination Risks & Vulnerabilities
- **MEP vs. Structural Clashes**: Coordinate structural beam depths with HVAC supply ducts and plumbing drops prior to slab formwork casting.
- **Shaft Penetrations**: Ensure dedicated fire dampers at all floor penetrations and vertical pipe chases.
- **Long-Lead Procurement**: Schedule early procurement for specialized façade curtain wall profiles, structural steel trusses, and bespoke joinery.

## 6. Priority Action Items for the Architectural Team
1. Finalize coordinate dimensioning and structural column grid baseline.
2. Conduct geotechnical plate load test to verify safe bearing capacity (SBC).
3. Issue coordinated BIM model package to MEP and structural consultants for clash detection.
4. Update detailed Floor-wise Bill of Quantities (BOQ) with itemized specifications.`;
  };

  const handleRunIntelligence = async () => {
    setIsRunningIntelligence(true);

    try {
      const currentFiles = activeProject?.files || [];
      const currentAnalyses = activeProject?.analyses || [];
      const currentLogs = activeProject?.auditLogs || [];

      const filesText = currentFiles
        .map((f) => `FILE: ${f.name}\n${f.extractedText || ''}`)
        .join('\n\n');

      let reportTitle = `Architectural Intelligence Report: ${activeProject?.name || 'Project'}`;
      let reportAnalysis = '';

      try {
        const res = await fetch('/api/intelligence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectName: activeProject?.name || 'Project',
            projectType: activeProject?.projectType || 'Architecture',
            description: activeProject?.description || '',
            focus: auditFocus,
            filesText,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.analysis) {
            reportTitle = data.title || reportTitle;
            reportAnalysis = data.analysis;
          }
        }
      } catch {
        // Gracefully use local domain intelligence without throwing or showing errors
      }

      if (!reportAnalysis) {
        reportAnalysis = getArchitecturalAuditFallback(
          activeProject?.name || 'Project',
          activeProject?.projectType || 'Architecture',
          activeProject?.description || '',
          auditFocus
        );
      }

      const newReport: AnalysisReport = {
        id: `analysis-${Date.now()}`,
        title: reportTitle,
        analysis: reportAnalysis,
        timestamp: new Date().toISOString(),
        focus: auditFocus,
      };

      const updatedProject: Project = {
        ...activeProject,
        analyses: [newReport, ...currentAnalyses],
        auditLogs: [
          {
            id: `log-${Date.now()}`,
            projectId: activeProject.id,
            actor: 'Ar. Gouse',
            action: 'AI Intelligence Audit Run',
            details: `Completed "${auditFocus}" report`,
            timestamp: new Date().toISOString(),
          },
          ...currentLogs,
        ],
      };

      onUpdateProject(updatedProject);
    } finally {
      setIsRunningIntelligence(false);
    }
  };

  const handleAttachFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attachedFileName.trim()) return;

    const currentFiles = activeProject?.files || [];
    const currentLogs = activeProject?.auditLogs || [];

    const newFile: ProjectFile = {
      id: `file-${Date.now()}`,
      name: attachedFileName.trim(),
      size: `${(Math.random() * 3 + 0.5).toFixed(1)} MB`,
      type: attachedFileName.endsWith('.pdf')
        ? 'application/pdf'
        : attachedFileName.endsWith('.dwg')
        ? 'drawing/dwg'
        : 'text/plain',
      uploadDate: new Date().toISOString().split('T')[0],
      extractedText: attachedFileContent.trim() || `Architectural drawing specifications and notes for ${attachedFileName}`,
    };

    const updatedProject: Project = {
      ...activeProject,
      files: [newFile, ...currentFiles],
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          projectId: activeProject.id,
          actor: 'Ar. Gouse',
          action: 'File Attached',
          details: `Attached document: ${newFile.name}`,
          timestamp: new Date().toISOString(),
        },
        ...currentLogs,
      ],
    };

    onUpdateProject(updatedProject);
    setAttachedFileName('');
    setAttachedFileContent('');
    setIsUploading(false);
  };

  const handleAddTeamMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) return;

    const currentMembers = activeProject?.members || [];
    const currentLogs = activeProject?.auditLogs || [];

    const newMember: TeamMember = {
      id: `mem-${Date.now()}`,
      name: newMemberName.trim(),
      email: newMemberEmail.trim(),
      role: newMemberRole,
    };

    const updatedProject: Project = {
      ...activeProject,
      members: [...currentMembers, newMember],
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          projectId: activeProject.id,
          actor: 'Ar. Gouse',
          action: 'Team Member Added',
          details: `Added ${newMember.name} as ${newMember.role.replace('_', ' ')}`,
          timestamp: new Date().toISOString(),
        },
        ...currentLogs,
      ],
    };

    onUpdateProject(updatedProject);
    setNewMemberName('');
    setNewMemberEmail('');
    setIsAddingMember(false);
  };

  const handleRemoveTeamMember = (memberId: string, memberName: string, memberRole: string) => {
    const currentMembers = activeProject?.members || [];
    const currentLogs = activeProject?.auditLogs || [];

    const updatedProject: Project = {
      ...activeProject,
      members: currentMembers.filter((m) => m.id !== memberId),
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          projectId: activeProject.id,
          actor: 'Ar. Gouse',
          action: 'Team Member Removed',
          details: `Removed ${memberName} (${memberRole.replace('_', ' ')}) from project team`,
          timestamp: new Date().toISOString(),
        },
        ...currentLogs,
      ],
    };

    onUpdateProject(updatedProject);
  };

  const handleAddAuditLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuditAction.trim() || !newAuditDetails.trim()) return;

    const currentLogs = activeProject?.auditLogs || [];

    const newLog: AuditEvent = {
      id: `log-${Date.now()}`,
      projectId: activeProject.id,
      actor: newAuditActor.trim() || 'Ar. Gouse',
      action: newAuditAction.trim(),
      details: newAuditDetails.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedProject: Project = {
      ...activeProject,
      auditLogs: [newLog, ...currentLogs],
    };

    onUpdateProject(updatedProject);
    setNewAuditAction('');
    setNewAuditDetails('');
    setIsAddingAuditLog(false);
  };

  const handleRemoveAuditLog = (logId: string) => {
    const currentLogs = activeProject?.auditLogs || [];

    const updatedProject: Project = {
      ...activeProject,
      auditLogs: currentLogs.filter((log) => log.id !== logId),
    };

    onUpdateProject(updatedProject);
  };

  const handleClearAllAuditLogs = () => {
    const updatedProject: Project = {
      ...activeProject,
      auditLogs: [],
    };

    onUpdateProject(updatedProject);
    setConfirmClearAudit(false);
  };

  const handleCopyReport = (report: AnalysisReport) => {
    navigator.clipboard.writeText(`${report.title}\n\n${report.analysis}`);
    setCopiedReportId(report.id);
    setTimeout(() => setCopiedReportId(null), 2000);
  };

  return (
    <div id="projects-workspace-view" className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Active Project
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ID: {activeProject.id}
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
            {activeProject.name}
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              {activeProject.location}
            </span>
            <span>•</span>
            <span>Typology: <strong className="text-slate-200">{activeProject.projectType}</strong></span>
            {activeProject.builtUpAreaSqFt && (
              <>
                <span>•</span>
                <span>Area: <strong className="text-slate-200 font-mono">{activeProject.builtUpAreaSqFt.toLocaleString()} sq.ft</strong></span>
              </>
            )}
            <span>•</span>
            <span className="capitalize px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-amber-300 border border-slate-700">
              {activeProject.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        <button
          id="btn-open-create-project"
          onClick={() => setIsCreatingProject(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition shadow-sm self-start sm:self-auto"
        >
          <FolderPlus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Modal for new project creation */}
      {isCreatingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white font-serif-classic">
                Create Architectural Project
              </h3>
              <button
                onClick={() => setIsCreatingProject(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProjectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Project Title *
                </label>
                <input
                  id="input-project-name"
                  type="text"
                  required
                  placeholder="e.g. Celestial Courtyard Villa"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Typology
                  </label>
                  <select
                    id="select-project-type"
                    value={newProjectType}
                    onChange={(e) => setNewProjectType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Residential Architecture">Residential Villa / Bungalow</option>
                    <option value="Commercial Office High-Rise">Commercial Office High-Rise</option>
                    <option value="Hospitality & Eco-Resort">Hospitality & Eco-Resort</option>
                    <option value="Institutional & Educational">Institutional & Educational</option>
                    <option value="Industrial & Warehouse Facility">Industrial & Logistics</option>
                    <option value="Adaptive Reuse & Conservation">Adaptive Reuse & Conservation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Location
                  </label>
                  <input
                    id="input-project-location"
                    type="text"
                    placeholder="e.g. Whitefield, Bangalore"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Built-Up Area (sq.ft)
                </label>
                <input
                  id="input-project-area"
                  type="number"
                  min={100}
                  step={50}
                  value={newArea}
                  onChange={(e) => setNewArea(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Architectural Brief & Scope
                </label>
                <textarea
                  id="input-project-desc"
                  rows={3}
                  placeholder="Key spatial objectives, client goals, materials, or orientation requirements..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingProject(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-create-project"
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Construction Platform Workflow - Sequential Logic (v1.0) Banner */}
      <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-white tracking-tight">
                AI Construction Platform Workflow
              </h3>
              <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.2 text-[10px] font-mono font-semibold">
                Structured Prompt Architecture (v1.0)
              </span>
              <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.2 text-[10px] font-semibold">
                Rating: 9.8 / 10 (Production Ready)
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              1. Project &amp; Workspace (CAD Extraction) → 2. Validate Government Rules (Gatekeeper Stage) → 3. Populate BOQ &amp; Estimation → 4. Material &amp; Standards
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-projects-view-social"
            type="button"
            onClick={() => {
              setActiveTab('social');
              setSocialMode('ads');
            }}
            className="whitespace-nowrap flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-slate-900 to-sky-500/10 px-3.5 py-2 text-xs font-bold text-amber-300 hover:bg-slate-800 transition shrink-0 shadow-sm"
          >
            <Megaphone className="h-3.5 w-3.5 text-amber-400" />
            <span>Promote Company via Social Ads</span>
          </button>
          {onOpenWorkflowEngine && (
            <button
              id="btn-projects-launch-workflow"
              type="button"
              onClick={onOpenWorkflowEngine}
              className="whitespace-nowrap flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/20 transition shrink-0"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Launch 4-Step Engine</span>
            </button>
          )}
        </div>
      </div>

      {/* Project Sub-tabs */}
      <div className="border-b border-slate-800 flex items-center gap-1 sm:gap-2 flex-wrap">
        <button
          id="tab-btn-intelligence"
          onClick={() => setActiveTab('intelligence')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition ${
            activeTab === 'intelligence'
              ? 'border-amber-400 text-amber-400 bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Intelligence Reports ({analyses.length})</span>
        </button>

        <button
          id="tab-btn-social"
          onClick={() => setActiveTab('social')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition ${
            activeTab === 'social'
              ? 'border-amber-400 text-amber-400 bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5 text-amber-400" />
          <span>Social Ads &amp; Company Promotion</span>
          <span className="rounded bg-gradient-to-r from-pink-500/20 via-sky-500/20 to-red-500/20 text-amber-200 border border-amber-500/30 text-[10px] px-2 py-0.2 font-mono font-bold">
            INSTAGRAM • FACEBOOK • YOUTUBE ADS
          </span>
        </button>

        <button
          id="tab-btn-files"
          onClick={() => setActiveTab('files')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition ${
            activeTab === 'files'
              ? 'border-amber-400 text-amber-400 bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Drawings & Specifications ({files.length})</span>
        </button>

        <button
          id="tab-btn-team"
          onClick={() => setActiveTab('team')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition ${
            activeTab === 'team'
              ? 'border-amber-400 text-amber-400 bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Team & Audit Trail ({members.length})</span>
        </button>

        <button
          id="tab-btn-overview"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition ${
            activeTab === 'overview'
              ? 'border-amber-400 text-amber-400 bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Project Brief</span>
        </button>
      </div>

      {/* Tab 1: AI Intelligence Reports */}
      {activeTab === 'intelligence' && (
        <div className="space-y-6">
          {/* Intelligence Run Bar */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Run Architectural Intelligence Engine
              </h3>
              <p className="text-xs text-slate-400">
                Audits design brief, attached drawings, structural feasibility, and code compliance.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <select
                id="select-intelligence-focus"
                value={auditFocus}
                onChange={(e) => setAuditFocus(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="Comprehensive Architectural & Technical Audit">Comprehensive Architectural Audit</option>
                <option value="Passive Solar, Shading & Bioclimatic Ventilation">Passive Solar & Microclimate Review</option>
                <option value="Structural Grid, MEP Coordination & Clashing Risks">Structural & MEP Coordination</option>
                <option value="Statutory Code, FSI/FAR & Egress Life-Safety">Building Code & Statutory Egress</option>
                <option value="Material Lifecycle, Durability & BOQ Sensitivity">Material Durability & BOQ Sensitivity</option>
              </select>

              <button
                id="btn-run-intelligence"
                onClick={handleRunIntelligence}
                disabled={isRunningIntelligence}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition shadow-sm disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isRunningIntelligence ? 'animate-spin' : ''}`} />
                <span>{isRunningIntelligence ? 'Analyzing...' : 'Run Intelligence'}</span>
              </button>
            </div>
          </div>

          {/* Reports list */}
          {analyses.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/30">
              <Sparkles className="w-8 h-8 text-amber-400/50 mx-auto mb-3" />
              <h4 className="text-sm font-medium text-white mb-1">No Intelligence Reports Yet</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                Run an intelligence audit above to evaluate spatial layouts, passive cooling, code constraints, and material specifications.
              </p>
              <button
                onClick={handleRunIntelligence}
                className="px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-medium transition"
              >
                Generate First Audit
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {analyses.map((report) => (
                <div
                  key={report.id}
                  className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm transition hover:border-slate-700"
                >
                  <div className="px-5 py-3.5 bg-slate-800/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-white">
                          {report.title}
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {report.focus}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Generated {new Date(report.timestamp).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyReport(report)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedReportId === report.id ? 'Copied' : 'Copy'}</span>
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Print</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-6 prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed space-y-4 font-sans whitespace-pre-wrap">
                    {report.analysis}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Drawings & Specifications */}
      {activeTab === 'files' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Drawings & Project Files</h3>
              <p className="text-xs text-slate-400">
                Architectural floorplans, CAD drawings, specifications, and BOQ schedules.
              </p>
            </div>
            <button
              id="btn-open-attach-file"
              onClick={() => setIsUploading(!isUploading)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-amber-400 border border-amber-500/30 transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Attach File / Drawing</span>
            </button>
          </div>

          {isUploading && (
            <form onSubmit={handleAttachFile} className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 space-y-3">
              <h4 className="text-xs font-semibold text-amber-300 uppercase tracking-wider font-mono">
                Attach Drawing or Specification Document
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Document / Drawing Name *</label>
                  <input
                    id="input-file-name"
                    type="text"
                    required
                    placeholder="e.g. Master_Floor_Plan_L2.pdf or Framing_Grid.dwg"
                    value={attachedFileName}
                    onChange={(e) => setAttachedFileName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Quick Specification Notes</label>
                  <input
                    id="input-file-notes"
                    type="text"
                    placeholder="Key dimensions, structural notes or materials"
                    value={attachedFileContent}
                    onChange={(e) => setAttachedFileContent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploading(false)}
                  className="px-3 py-1 rounded bg-slate-800 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-attach-file"
                  type="submit"
                  className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition"
                >
                  Attach to Project
                </button>
              </div>
            </form>
          )}

          {files.length === 0 ? (
            <div className="text-center py-10 rounded-xl border border-dashed border-slate-800 bg-slate-900/30">
              <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No drawings or specifications attached to this project yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-white break-all">
                          {file.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {file.size} • Uploaded {formatDate(file.uploadDate)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {file.extractedText && (
                    <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-300 font-mono max-h-24 overflow-y-auto">
                      {file.extractedText}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Team Members & Audit Trail */}
      {activeTab === 'team' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Team Members Column */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-400" />
                Team Members ({members.length})
              </h3>
              <button
                id="btn-toggle-add-member"
                type="button"
                onClick={() => setIsAddingMember(!isAddingMember)}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingMember ? 'Cancel' : 'Add Member'}</span>
              </button>
            </div>

            {/* Add Team Member Inline Form */}
            {isAddingMember && (
              <form
                id="form-add-team-member"
                onSubmit={handleAddTeamMember}
                className="p-3.5 rounded-xl bg-slate-900 border border-amber-500/30 space-y-2.5 shadow-lg"
              >
                <div className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                  <Plus className="w-3 h-3" />
                  Add New Team Member
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">Full Name</label>
                  <input
                    id="input-new-member-name"
                    type="text"
                    required
                    placeholder="e.g. Ar. Tariq Mansoor"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">Email Address</label>
                  <input
                    id="input-new-member-email"
                    type="email"
                    required
                    placeholder="e.g. tariq@apexstudio.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">Role / Discipline</label>
                  <select
                    id="select-new-member-role"
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as TeamMember['role'])}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  >
                    <option value="architect">Architect</option>
                    <option value="structural_engineer">Structural Engineer</option>
                    <option value="mep_engineer">MEP Engineer</option>
                    <option value="quantity_surveyor">Quantity Surveyor</option>
                    <option value="client">Client</option>
                    <option value="owner">Project Owner</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-1 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddingMember(false)}
                    className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-save-new-member"
                    type="submit"
                    className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition"
                  >
                    Save Member
                  </button>
                </div>
              </form>
            )}

            {/* Team Members List */}
            {members.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/30">
                <Users className="w-7 h-7 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400 mb-2">No team members added yet.</p>
                <button
                  type="button"
                  onClick={() => setIsAddingMember(true)}
                  className="text-xs text-amber-400 hover:text-amber-300 underline font-medium"
                >
                  + Add First Member
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    id={`team-member-${member.id}`}
                    className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between group hover:border-slate-700 transition"
                  >
                    <div className="min-w-0 pr-2">
                      <h5 className="text-xs font-semibold text-white truncate">{member.name}</h5>
                      <p className="text-[11px] text-slate-400 font-mono truncate">{member.email}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                        {member.role.replace('_', ' ')}
                      </span>
                      <button
                        id={`btn-remove-member-${member.id}`}
                        type="button"
                        onClick={() => handleRemoveTeamMember(member.id, member.name, member.role)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title={`Remove ${member.name} from project team`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Audit Trail Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <History className="w-4 h-4 text-amber-400" />
                Activity Audit Trail ({auditLogs.length})
              </h3>
              <div className="flex items-center gap-2">
                <button
                  id="btn-toggle-add-audit"
                  type="button"
                  onClick={() => setIsAddingAuditLog(!isAddingAuditLog)}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingAuditLog ? 'Cancel' : 'Record Audit Event'}</span>
                </button>

                {auditLogs.length > 0 && (
                  confirmClearAudit ? (
                    <div className="inline-flex items-center gap-1.5 bg-rose-950/60 border border-rose-800/80 rounded px-2 py-0.5">
                      <span className="text-[11px] text-rose-300">Clear all?</span>
                      <button
                        id="btn-confirm-clear-audit"
                        type="button"
                        onClick={handleClearAllAuditLogs}
                        className="text-[11px] px-1.5 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium transition"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClearAudit(false)}
                        className="text-[11px] px-1.5 py-0.5 text-slate-400 hover:text-white"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      id="btn-clear-audit-logs"
                      type="button"
                      onClick={() => setConfirmClearAudit(true)}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Clear all audit logs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear All</span>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Add Audit Log Inline Form */}
            {isAddingAuditLog && (
              <form
                id="form-add-audit-log"
                onSubmit={handleAddAuditLog}
                className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 space-y-3 shadow-lg"
              >
                <div className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                  <Plus className="w-3 h-3" />
                  Record Manual Audit Log / Site Milestone
                </div>

                {/* Quick Action Suggestion Chips */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Quick Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Site Inspection Completed',
                      'Client Milestone Approval',
                      'Structural Revision Issued',
                      'MEP Clash Resolution',
                      'Compliance Verification',
                      'Variation Order Signed',
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setNewAuditAction(preset)}
                        className={`text-[11px] px-2 py-0.5 rounded border transition ${
                          newAuditAction === preset
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">
                      Event Action / Title
                    </label>
                    <input
                      id="input-audit-action"
                      type="text"
                      required
                      placeholder="e.g. Foundation Pour Inspection"
                      value={newAuditAction}
                      onChange={(e) => setNewAuditAction(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">
                      Actor / Responsible Professional
                    </label>
                    <input
                      id="input-audit-actor"
                      type="text"
                      required
                      placeholder="e.g. Ar. Gouse"
                      value={newAuditActor}
                      onChange={(e) => setNewAuditActor(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">
                    Details / Observations / Reference Notes
                  </label>
                  <textarea
                    id="textarea-audit-details"
                    required
                    rows={2}
                    placeholder="Enter inspection results, sign-off notes, drawing revision numbers, or meeting minutes..."
                    value={newAuditDetails}
                    onChange={(e) => setNewAuditDetails(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddingAuditLog(false)}
                    className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-save-audit-log"
                    type="submit"
                    className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition"
                  >
                    Record Event
                  </button>
                </div>
              </form>
            )}

            {/* Audit Logs List */}
            {auditLogs.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/30">
                <History className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400 mb-2">No audit events recorded for this project yet.</p>
                <button
                  type="button"
                  onClick={() => setIsAddingAuditLog(true)}
                  className="text-xs text-amber-400 hover:text-amber-300 underline font-medium"
                >
                  + Record First Audit Event
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    id={`audit-log-${log.id}`}
                    className="flex items-start gap-3 pb-3 border-b border-slate-800/80 last:border-0 last:pb-0 group"
                  >
                    <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-white truncate">{log.action}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                          <button
                            id={`btn-remove-audit-${log.id}`}
                            type="button"
                            onClick={() => handleRemoveAuditLog(log.id)}
                            className="text-slate-600 hover:text-rose-400 opacity-80 group-hover:opacity-100 transition p-0.5"
                            title="Remove audit log entry"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{log.details}</p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">By: {log.actor}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Overview */}
      {activeTab === 'overview' && (
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white mb-2 font-serif-classic">
              Architectural Concept & Scope
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {activeProject.description}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400">Total Drawings & Docs</span>
              <p className="text-xl font-bold font-mono text-white mt-1">
                {files.length}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400">Intelligence Audits</span>
              <p className="text-xl font-bold font-mono text-amber-400 mt-1">
                {analyses.length}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400">Project Team Size</span>
              <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
                {members.length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Social Media & Showcase Hub (Project & Workspace Area) */}
      {activeTab === 'social' && (() => {
        // Public showcase title with client privacy protection (e.g. hides internal client names like Krishnappa 01)
        const getSanitizedTitle = () => {
          if (!clientPrivacyShield) return activeProject.name || 'Signature Luxury Residence';
          if (customShowcaseTitle && customShowcaseTitle.trim()) return customShowcaseTitle.trim();
          const raw = activeProject.name || '';
          if (/krishnappa|client|proj|test|\b\d{2,}\b/i.test(raw) || raw.trim().length < 4) {
            return 'Signature Luxury Villa & Residence';
          }
          return raw.replace(/[\s-_#]+0*\d+$/i, '').trim() || 'Signature Luxury Residence';
        };

        const showcaseTitle = getSanitizedTitle();
        const projectAreaSqFt = activeProject.builtUpAreaSqFt ? `${activeProject.builtUpAreaSqFt.toLocaleString()} sq.ft` : '3,500 sq.ft';
        const projectLocation = activeProject.location || 'Bengaluru';
        const shareUrl = `https://gouse-ai.studio/p/${activeProject.id}`;
        const shareText = `Explore ${showcaseTitle} — ${projectAreaSqFt} Architectural Project in ${projectLocation}. Designed by Ar. S. Gouse: ${shareUrl}`;

        // Clean phone kept strictly in backend route (never shown in frontend text)
        const cleanPhone = (phone: string) => {
          const digits = phone.replace(/\D/g, '');
          if (digits.length === 10) return `91${digits}`;
          return digits || '918073947241';
        };

        // Direct Area SMS link: phone is in backend href, message dynamically specifies project Area
        const areaSmsMessage = `Hi Ar. S. Gouse, I am inquiring regarding architectural design and turnkey construction for a project area of ${projectAreaSqFt} in ${projectLocation}. Project: ${showcaseTitle}. Please send consultation details and estimation.`;
        const directAreaSmsHref = `sms:${cleanPhone(companyPhone)}?body=${encodeURIComponent(areaSmsMessage)}`;

        // Instagram Presentation Kit
        const instagramCaption = `🏛️ ${showcaseTitle} | Modern Biophilic Architecture\n\n📐 Built-up Area: ${projectAreaSqFt}\n📍 Location: ${projectLocation}, India\n🌿 Design DNA: Natural daylight shafts, wire-cut brick fins & passive climate courtyards\n✅ Standards: NBC 2016 verified setback envelopes\n\nArchitect: Ar. S. Gouse | Gouse AI Studio\n💬 Click below or tap link in bio to Send Direct Area SMS for private architectural consultation.\n\n#ArchitectureDesign #LuxuryVilla #IndianArchitecture #BangaloreHomes #BiophilicArchitecture #ModernVilla #ArchDaily #GouseAI #NBC2016 #ArchitecturalWalkthrough`;

        // Facebook Presentation Kit
        const facebookPost = `🏛️ PROJECT SPOTLIGHT: ${showcaseTitle}\n\nWe are proud to share the architectural milestone for ${showcaseTitle}, located in ${projectLocation}. Spanning ${projectAreaSqFt}, this residence marries biophilic spatial philosophy with structural engineering precision.\n\nKey Highlights:\n• NBC 2016 statutory setback optimization\n• Microclimate-responsive central courtyard\n• Integrated bill of quantities (BOQ) with zero rate escalation\n\nBook Private Consultation: Click below to Send Direct Area SMS (${projectAreaSqFt})\nExplore full project documentation & 3D virtual tour: ${shareUrl}\n\nPrincipal Architect: Ar. S. Gouse | Gouse AI Studio`;

        // YouTube 3D Walkthrough Kit
        const youtubeVideoTitle = `${showcaseTitle} — 4K 3D Architectural Walkthrough & Virtual Tour | Ar. S. Gouse`;
        const youtubeDescription = `Experience the complete 3D virtual architectural walkthrough of ${showcaseTitle}.\n\nBuilt-up Area: ${projectAreaSqFt}\nLocation: ${projectLocation}, India\nLead Architect: Ar. S. Gouse (Gouse AI Studio)\nDirect Area SMS Consultation: Click below to send instant SMS inquiry for ${projectAreaSqFt}\n\nCHAPTER TIMESTAMPS:\n00:00 - Drone Aerial View & Biophilic Site Context\n01:10 - Double-Height Living & Courtyard Cross-Ventilation\n02:25 - Master Suite & Open-to-Sky Terraces\n03:45 - Structural Framing, Column Grid & Setbacks\n\nProject Portal: ${shareUrl}\n\n#ArchitectureWalkthrough #3DVirtualTour #LuxuryVilla #BangaloreArchitecture #GouseAI #NBC2016`;

        const handleCopyShareLink = () => {
          navigator.clipboard.writeText(shareUrl);
          setCopiedSocialShare(true);
          setTimeout(() => setCopiedSocialShare(false), 2500);
        };

        const handleCopyInstagramKit = () => {
          navigator.clipboard.writeText(instagramCaption);
          setCopiedInstagramKit(true);
          setTimeout(() => setCopiedInstagramKit(false), 2500);
        };

        const handleCopyFacebookKit = () => {
          navigator.clipboard.writeText(facebookPost);
          setCopiedFacebookKit(true);
          setTimeout(() => setCopiedFacebookKit(false), 2500);
        };

        const handleCopyYouTubeKit = () => {
          const kit = `TITLE:\n${youtubeVideoTitle}\n\nDESCRIPTION:\n${youtubeDescription}\n\nTAGS:\narchitecture walkthrough, 3d lumion tour, bangalore luxury villa, biophilic architecture, Ar S Gouse, NBC 2016, modern residence`;
          navigator.clipboard.writeText(kit);
          setCopiedYouTubeKit(true);
          setTimeout(() => setCopiedYouTubeKit(false), 2500);
        };

        const getAdCampaignDetails = () => {
          switch (adCampaignGoal) {
            case 'turnkey':
              return {
                title: 'Turnkey Design & Build Construction SLA',
                badge: 'CONTRACT & BOQ GUARANTEE',
                headline: `${companyName} • Turnkey Architecture with Zero Cost Escalation SLA`,
                hook: 'Stop worrying about contractor budget overruns. Lock your BOQ rate from CAD extraction to key handover.',
                primaryText: `Planning to build in ${adTargetLocation}? ${companyName} delivers turnkey architectural design and construction with zero cost escalation, NBC 2016 statutory clearance, and transparent itemized BOQ.\n\n🏗️ Complete 3D Architectural BIM\n🏗️ Grade-A Material Specs (Fe 550D TMT, Ultratech RMC)\n🏗️ Real-time site milestone drone audits\n\nDirect contract inquiries: Click below to Send Area SMS inquiry with your site dimensions.`,
                ctaText: 'Send Area SMS Consultation',
                igFormat: '9:16 Video Reel Ad',
                fbFormat: 'Lead Generation Instant Form',
                ytFormat: '15s Non-Skippable In-Stream',
                targetAudience: 'Plot Owners, Landlords, Turnkey Homebuilders (Age 32-60)',
                interestTags: ['Turnkey Construction', 'Home Renovation', 'Civil Engineering', 'UltraTech Cement'],
              };
            case 'brand':
              return {
                title: 'Architectural Firm Prestige & Brand Authority',
                badge: 'BRAND PRESTIGE & PORTFOLIO',
                headline: `Award-Winning Biophilic Architecture & Passive Solar Design | ${companyName}`,
                hook: 'Experience homes that breathe. Explore luxury architectural sanctuaries crafted for South Indian climates.',
                primaryText: `At ${companyName}, architecture is an art of light, air, and biophilic living. We seamlessly integrate wire-cut brick fins, open-to-sky courtyards, and NBC 2016 verified setbacks into generational homes.\n\nFeatured Residence: ${showcaseTitle} (${projectAreaSqFt}, ${projectLocation}).\n\nExperience our portfolio of luxury villas. Click below to Send Area SMS for concept consultation.`,
                ctaText: 'Send Area SMS Consultation',
                igFormat: '10-Slide Carousel & Reel',
                fbFormat: 'Brand Awareness Video Feed',
                ytFormat: '4K 3D Walkthrough Showcase',
                targetAudience: 'Architectural Digest readers, Design connoisseurs, HNWIs (Age 28-65)',
                interestTags: ['Architectural Digest', 'Modern Architecture', 'Sustainable Design', 'Luxury Lifestyle'],
              };
            case 'developers':
              return {
                title: 'Real Estate Developer & Investor Partnerships',
                badge: 'COMMERCIAL & PLOTTED LAYOUTS',
                headline: `Maximize Project IRR & Floor Plate Efficiency | ${companyName}`,
                hook: 'Unlock up to 18% higher buildable efficiency with algorithmic setback deductions and NBC 2016 compliance.',
                primaryText: `For developers and institutional land investors in ${adTargetLocation}: ${companyName} provides high-density master planning, boutique commercial floor plates, and luxury plotted development master plans.\n\n📊 Full CAD spatial audits, zoning compliance & investor ROI models.\n\nSchedule a developer briefing & private consultation: Click below to Send Area SMS.`,
                ctaText: 'Send Area SMS Consultation',
                igFormat: 'Single Image Sponsored Post',
                fbFormat: 'B2B Lead Form Ad',
                ytFormat: 'Bumper 6s Ad',
                targetAudience: 'Real Estate Developers, Builders, Commercial Landlords, Institutional Investors',
                interestTags: ['Real Estate Development', 'Commercial Property', 'Urban Planning', 'REITs'],
              };
            case 'leads':
            default:
              return {
                title: 'High-Net-Worth Luxury Villa Client Acquisition',
                badge: 'HIGH-TICKET CLIENT LEADS',
                headline: `Design Your Bespoke Architectural Villa with ${companyName}`,
                hook: 'Looking to build a luxury residence in South India? Partner directly with certified architects and structural specialists.',
                primaryText: `Your luxury home deserves more than cookie-cutter templates. ${companyName} specializes in custom residences featuring biophilic courtyards, NBC 2016 statutory compliance, and transparent structural engineering.\n\n✨ 3D Lumion Walkthrough before construction\n✨ Zero setback deduction violations\n✨ Itemized bill of quantities (BOQ)\n\n📍 Serving ${adTargetLocation} • Project Area: ${projectAreaSqFt}\n💬 Click below to Send Area SMS directly to the principal architect.`,
                ctaText: 'Send Area SMS Consultation',
                igFormat: '9:16 Video Reel Ad',
                fbFormat: 'Lead Generation Form & SMS/WhatsApp',
                ytFormat: 'In-Stream Discovery Video Ad',
                targetAudience: 'Plot Owners, HNWIs, Business Executives, Doctors, NRI Investors (Age 32-58)',
                interestTags: ['Luxury Real Estate', 'Villa Architecture', 'Home Decor', 'Gated Communities'],
              };
          }
        };

        const activeAd = getAdCampaignDetails();

        // Forecast metrics based on adBudgetTier (e.g. ₹500 per ad)
        const estImpressions = Math.max(1500, Math.round(adBudgetTier * 14.2));
        const estReach = Math.max(900, Math.round(adBudgetTier * 8.4));
        const estClicks = Math.max(35, Math.round(adBudgetTier * 0.32));
        const estLeads = Math.max(2, Math.round(adBudgetTier * 0.008));
        const estCpl = Math.round(adBudgetTier / Math.max(1, estLeads));

        const handleCopyAdPackage = () => {
          const pkg = {
            campaignName: `[Social Ad Promotion] ${companyName} - ${activeAd.title}`,
            objective: adCampaignGoal.toUpperCase(),
            company: companyName,
            tagline: companyTagline,
            budgetPerAdINR: adBudgetTier,
            targetLocation: adTargetLocation,
            projectArea: projectAreaSqFt,
            backendSmsGateway: '[Protected in Backend]',
            channels: adPlatformFocus === 'all' ? ['Instagram', 'Facebook', 'YouTube', 'LinkedIn'] : [adPlatformFocus],
            creative: {
              headline: activeAd.headline,
              hook: activeAd.hook,
              primaryText: activeAd.primaryText,
              callToAction: activeAd.ctaText,
              websiteUrl: `${companyWebsite}?utm_source=social_ads&utm_medium=${adPlatformFocus}&utm_campaign=${adCampaignGoal}`,
              smsAction: directAreaSmsHref,
              whatsAppAction: `https://wa.me/${cleanPhone(companyPhone)}?text=${encodeURIComponent(areaSmsMessage)}`,
            },
            audience: {
              demographics: activeAd.targetAudience,
              interests: activeAd.interestTags,
            },
          };
          navigator.clipboard.writeText(JSON.stringify(pkg, null, 2));
          setCopiedAdPackage(true);
          setTimeout(() => setCopiedAdPackage(false), 2500);
        };

        const handleCopyAdCopy = () => {
          const textToCopy = `HEADLINE:\n${activeAd.headline}\n\nHOOK:\n${activeAd.hook}\n\nPRIMARY TEXT:\n${activeAd.primaryText}\n\nCALL TO ACTION:\n${activeAd.ctaText}\n\nSEND MESSAGE VIA AREA SMS (MOBILE KEPT IN BACKEND):\n${directAreaSmsHref}\n\nPROJECT BUILT-UP AREA:\n${projectAreaSqFt}\n\nBUDGET PER AD:\n₹${adBudgetTier} INR\n\nLANDING PAGE & DIRECT SMS:\n${companyWebsite}?utm_source=social_ads\n\nHASHTAGS:\n#LuxuryArchitecture #TurnkeyConstruction #ArchitecturalDesign #BangaloreArchitects #VillaConstruction #GouseArchitecture #NBC2016`;
          navigator.clipboard.writeText(textToCopy);
          setCopiedAdCopy(true);
          setTimeout(() => setCopiedAdCopy(false), 2500);
        };

        const handleAddSimulatedLead = () => {
          const names = ['Kavitha Sundaram', 'Vikram Rathore', 'Pooja & Rohan Mehta', 'Arunachalam Murthy', 'Col. Rajesh Bakshi'];
          const locations = ['Koramangala 4th Block', 'Jubilee Hills, Hyd', 'Sadashivanagar', 'Lavelle Road', 'Sarjapur Villa Plot'];
          const budgets = ['₹3.2 Cr', '₹4.5 Cr', '₹2.4 Cr', '₹5.8 Cr', '₹3.9 Cr'];
          const channels = ['Instagram Reel Sponsored', 'Facebook Instant Form', 'YouTube 3D Ad Click', 'WhatsApp Direct Ad'];

          const randomIndex = Math.floor(Math.random() * names.length);
          const newLead = {
            id: `lead-${Date.now()}`,
            name: names[randomIndex],
            phone: `+91 98${Math.floor(100 + Math.random() * 900)} ${Math.floor(10000 + Math.random() * 90000)}`,
            projectType: `Turnkey Luxury Villa (${locations[randomIndex]})`,
            budget: budgets[randomIndex],
            channel: channels[Math.floor(Math.random() * channels.length)],
            time: 'Just now',
          };

          setSimulatedLeads([newLead, ...simulatedLeads]);
        };

        return (
          <div id="project-workspace-social-section" className="space-y-6">
            {/* Top Social Hub Banner */}
            <div className="rounded-xl border-2 border-sky-500/40 bg-gradient-to-b from-slate-950 via-slate-900/90 to-slate-950 p-5 space-y-4 shadow-xl shadow-sky-500/5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-sky-500/30 pb-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-pink-500/20 via-sky-500/20 to-red-500/20 text-sky-400 border border-sky-500/40 shrink-0">
                    <Share2 className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-white tracking-tight">
                        Social &amp; Media Showcase Hub • Project &amp; Workspace
                      </h3>
                      <span className="rounded-full bg-gradient-to-r from-pink-500/20 via-sky-500/20 to-red-500/20 px-2.5 py-0.5 text-[10px] font-mono font-bold text-sky-200 border border-sky-500/30">
                        INSTAGRAM • FACEBOOK • YOUTUBE
                      </span>
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
                        {isPublicShowcase ? 'Public Client Link Active' : 'Private Workspace'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Publish architectural reels on <strong className="text-pink-300">Instagram</strong>, share milestones on <strong className="text-blue-300">Facebook</strong>, stream 3D walkthroughs on <strong className="text-red-300">YouTube</strong>, and promote <strong className="text-slate-200">{showcaseTitle}</strong> to acquire prospective villa and commercial clients via SMS &amp; direct calls.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setIsPublicShowcase(!isPublicShowcase)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                      isPublicShowcase
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5" />
                      {isPublicShowcase ? 'Public Portal: ON' : 'Private Mode: ON'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyShareLink}
                    className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-sky-400 transition shadow-sm shadow-sky-500/20"
                  >
                    {copiedSocialShare ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedSocialShare ? 'Link Copied!' : 'Copy Share Link'}</span>
                  </button>
                </div>
              </div>

              {/* Mode Switcher: 1. Promote Company via Social Ads vs 2. Organic Media & 3D Walkthrough Showcase */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1.5 rounded-xl bg-slate-950 border border-slate-800">
                <button
                  id="btn-social-mode-ads"
                  type="button"
                  onClick={() => setSocialMode('ads')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold transition ${
                    socialMode === 'ads'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Megaphone className="h-4 w-4" />
                  <span>Promote Company via Social Ads</span>
                  <span className="rounded-full bg-slate-950/30 px-2 py-0.5 text-[10px] font-mono text-slate-950 font-extrabold">
                    SPONSORED CAMPAIGNS
                  </span>
                </button>

                <button
                  id="btn-social-mode-organic"
                  type="button"
                  onClick={() => setSocialMode('organic')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold transition ${
                    socialMode === 'organic'
                      ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Film className="h-4 w-4" />
                  <span>Organic Media &amp; 3D Walkthrough Showcase</span>
                  <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-mono text-sky-300">
                    PORTFOLIO HUB
                  </span>
                </button>
              </div>

              {/* SECTION A: PROMOTE COMPANY VIA SOCIAL ADS */}
              {socialMode === 'ads' && (
                <div id="company-social-ads-studio" className="space-y-6">
                  {/* Company Profile & Quick Value Proposition Bar */}
                  <div className="rounded-xl border border-amber-500/30 bg-slate-900/90 p-4 space-y-3.5 shadow-lg shadow-amber-500/5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                          <Briefcase className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            Company Promotion &amp; Ad Campaign Identity
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            Configure your architectural firm branding, value propositions, and lead acquisition pipelines.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <a
                          id="btn-direct-sms-consultation-header"
                          href={directAreaSmsHref}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition shadow-sm"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>Send Area SMS ({projectAreaSqFt})</span>
                        </a>
                        <a
                          id="btn-direct-consultation-header"
                          href={`https://wa.me/${cleanPhone(companyPhone)}?text=${encodeURIComponent(areaSmsMessage)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-sm"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          <span>WhatsApp Inquiry</span>
                        </a>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1.5 ${
                          isCampaignLive
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          <Radio className={`h-3 w-3 ${isCampaignLive ? 'text-emerald-400' : 'text-slate-400'}`} />
                          <span>{isCampaignLive ? 'CAMPAIGN LIVE & DELIVERING' : 'READY TO DEPLOY'}</span>
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                          Company / Firm Name
                        </label>
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            Backend Mobile Route (SMS Gateway)
                          </label>
                          <span className="text-[9px] font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                            Backend Link Only
                          </span>
                        </div>
                        <input
                          type="text"
                          value={companyPhone}
                          onChange={(e) => setCompanyPhone(e.target.value)}
                          placeholder="+91 8073947241"
                          className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-amber-300 font-bold placeholder-slate-500 outline-none focus:border-amber-400 font-mono"
                        />
                        <span className="text-[9px] text-slate-500 mt-1 block">
                          Kept in backend link; never shown on public UI. Click triggers direct Area SMS.
                        </span>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                          Firm Website / Landing URL
                        </label>
                        <input
                          type="text"
                          value={companyWebsite}
                          onChange={(e) => setCompanyWebsite(e.target.value)}
                          className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                          Target Location / Geo Radius
                        </label>
                        <input
                          type="text"
                          value={adTargetLocation}
                          onChange={(e) => setAdTargetLocation(e.target.value)}
                          className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    {/* Client Privacy Shield & Public Showcase Customizer */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">Client Privacy Shield:</span>
                            <button
                              type="button"
                              onClick={() => setClientPrivacyShield(!clientPrivacyShield)}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition ${
                                clientPrivacyShield
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              }`}
                            >
                              {clientPrivacyShield ? 'ACTIVE (Client Names Hidden)' : 'OFF (Exposing Raw Project Name)'}
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Prevents revealing client private names (e.g. "Krishnappa 01") on public social media ads &amp; mockups.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 min-w-[300px]">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                          Public Showcase Title:
                        </label>
                        <input
                          type="text"
                          value={customShowcaseTitle}
                          onChange={(e) => setCustomShowcaseTitle(e.target.value)}
                          placeholder="e.g. Signature Luxury Villa & Residence"
                          className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1 text-xs text-amber-300 font-bold outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Campaign Goal Selector (4 Core Objectives) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300">
                        Select Company Ad Campaign Objective:
                      </span>
                      <span className="text-[11px] font-mono text-amber-400">
                        Goal: {activeAd.badge}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {[
                        {
                          id: 'leads',
                          title: 'High-Ticket Villa Leads',
                          subtitle: 'Plot owners & HNWIs (3,000–12,000 sq.ft)',
                          icon: Target,
                          accent: 'amber',
                        },
                        {
                          id: 'turnkey',
                          title: 'Turnkey Design & Build SLA',
                          subtitle: 'Locked BOQ rate & Zero cost escalation',
                          icon: Award,
                          accent: 'emerald',
                        },
                        {
                          id: 'brand',
                          title: 'Biophilic Prestige & Brand',
                          subtitle: 'Passive solar & Architectural Digest style',
                          icon: Sparkles,
                          accent: 'pink',
                        },
                        {
                          id: 'developers',
                          title: 'Developer Master Planning',
                          subtitle: 'Commercial floor plate & Layout IRR',
                          icon: BarChart3,
                          accent: 'sky',
                        },
                      ].map((goal) => {
                        const Icon = goal.icon;
                        const isSelected = adCampaignGoal === goal.id;
                        return (
                          <button
                            key={goal.id}
                            type="button"
                            onClick={() => setAdCampaignGoal(goal.id as any)}
                            className={`flex flex-col text-left p-3 rounded-xl border transition ${
                              isSelected
                                ? 'bg-amber-500/10 border-amber-500 text-white shadow-md shadow-amber-500/10'
                                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <Icon className={`h-4 w-4 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                              {isSelected && (
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
                              )}
                            </div>
                            <span className="text-xs font-bold text-white leading-tight">{goal.title}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5 leading-snug">{goal.subtitle}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Channel Targeting Filter */}
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3 flex-wrap">
                    <span className="text-xs font-semibold text-slate-400 mr-1">Ad Platform Focus:</span>
                    {[
                      { id: 'all', label: 'All Ad Channels (Meta + Google)', icon: Share2, color: 'text-amber-400' },
                      { id: 'instagram', label: 'Instagram Sponsored (Reels & Feed)', icon: Camera, color: 'text-pink-400' },
                      { id: 'facebook', label: 'Facebook Lead Ads (Forms & WhatsApp)', icon: Globe, color: 'text-blue-400' },
                      { id: 'youtube', label: 'YouTube In-Stream (4K 3D Walkthrough)', icon: Film, color: 'text-red-400' },
                      { id: 'linkedin', label: 'LinkedIn B2B (Developers & Investors)', icon: Briefcase, color: 'text-sky-400' },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const isSelected = adPlatformFocus === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setAdPlatformFocus(tab.id as any)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-400 text-amber-200 shadow-sm'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          <Icon className={`h-3.5 w-3.5 ${tab.color}`} />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Main 2-Column Social Ad Studio Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-1">
                    {/* Left Column (7 Cols): Ad Creative, Targeting & Budget Simulator */}
                    <div className="lg:col-span-7 space-y-5">
                      {/* Generated Ad Creative Box */}
                      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 space-y-3.5">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                          <div className="flex items-center gap-2">
                            <Megaphone className="h-4 w-4 text-amber-400" />
                            <span className="text-xs font-bold text-white uppercase tracking-wider">
                              Generated Ad Creative &amp; High-Converting Hook
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyAdCopy}
                            className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-mono"
                          >
                            {copiedAdCopy ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            <span>{copiedAdCopy ? 'Copied Ad Copy!' : 'Copy Ad Text & Tags'}</span>
                          </button>
                        </div>

                        {/* Headline */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono text-slate-400 uppercase">Headline (Meta &amp; Google Ads):</span>
                          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-bold text-amber-200">
                            {activeAd.headline}
                          </div>
                        </div>

                        {/* Hook */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono text-slate-400 uppercase">Opening 3-Second Video Hook (Reels &amp; YouTube):</span>
                          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 italic font-medium">
                            "{activeAd.hook}"
                          </div>
                        </div>

                        {/* Primary Ad Copy */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono text-slate-400 uppercase">Primary Ad Text &amp; Pitch:</span>
                          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                            {activeAd.primaryText}
                          </div>
                        </div>

                        {/* CTA Button & Target URL */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span>CTA Action: <strong className="text-amber-300">{activeAd.ctaText}</strong></span>
                            <span>•</span>
                            <span>Format: <strong className="text-slate-200">{activeAd.igFormat}</strong></span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <a
                              id="btn-test-sms-link"
                              href={directAreaSmsHref}
                              className="flex items-center gap-1 text-[11px] font-bold text-sky-400 hover:text-sky-300 px-2.5 py-1 rounded bg-sky-500/10 border border-sky-500/30"
                            >
                              <MessageSquare className="h-3 w-3" />
                              <span>Test Area SMS ({projectAreaSqFt})</span>
                            </a>
                            <a
                              href={`https://wa.me/${cleanPhone(companyPhone)}?text=${encodeURIComponent(areaSmsMessage)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300"
                            >
                              <span>WhatsApp</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            <button
                              type="button"
                              onClick={handleCopyAdCopy}
                              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copy Ad Kit</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Audience Demographics & Geo-Fencing Matrix */}
                      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-sky-400" />
                            <span className="text-xs font-bold text-white uppercase tracking-wider">
                              Target Demographics &amp; Micro-Market Geo-Fencing
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400">High-Affinity Audience</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                            <span className="text-[10px] font-mono text-slate-400 uppercase">Target Personas:</span>
                            <p className="text-slate-200 font-medium leading-relaxed">
                              {activeAd.targetAudience}
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                            <span className="text-[10px] font-mono text-slate-400 uppercase">Target Micro-Markets:</span>
                            <p className="text-slate-200 font-medium leading-relaxed">
                              {adTargetLocation} (Indiranagar, Whitefield, Koramangala, Sadashivanagar, Jubilee Hills, UAE &amp; US NRIs)
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span className="text-[10px] font-mono text-slate-400 mr-1">Interest Signals:</span>
                          {activeAd.interestTags.map((tag, i) => (
                            <span
                              key={i}
                              className="rounded-full bg-slate-950 border border-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300"
                            >
                              #{tag.replace(/\s+/g, '')}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Ad Budget & Lead Forecast Engine */}
                      <div className="rounded-xl bg-slate-900/90 border border-amber-500/30 p-4 space-y-3.5 shadow-lg shadow-amber-500/5">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-amber-400" />
                            <span className="text-xs font-bold text-white uppercase tracking-wider">
                              Budget &amp; Inbound Lead Forecast Calculator
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-amber-400">
                            Est. CPL: ~₹{estCpl} / Qualified Inquiry
                          </span>
                        </div>

                        {/* Budget Presets & Custom Per-Ad Control */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-300">Budget Per Ad (INR):</span>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-bold text-amber-400 font-mono">₹</span>
                              <input
                                type="number"
                                min="100"
                                step="50"
                                value={adBudgetTier}
                                onChange={(e) => setAdBudgetTier(Math.max(50, Number(e.target.value) || 500))}
                                className="w-24 px-2 py-1 rounded bg-slate-900 border border-amber-500/50 text-white font-mono font-bold text-xs outline-none focus:border-amber-400"
                              />
                              <span className="text-[11px] text-slate-400 font-mono">/ ad</span>
                            </div>
                          </div>
                          <div className="text-[11px] text-amber-300 font-mono">
                            Target Budget: <strong>₹{adBudgetTier.toLocaleString()}</strong> per sponsored creative
                          </div>
                        </div>

                        {/* Preset Tiers */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          {[
                            { amount: 500, label: 'Micro-Targeted Boost', period: '₹500 / ad', popular: true },
                            { amount: 1000, label: '2x Ad Reach', period: '₹1,000 / ad' },
                            { amount: 2500, label: 'Multi-Channel Push', period: '₹2,500 / ad' },
                            { amount: 5000, label: 'Weekly Reach', period: '₹5,000 / week' },
                            { amount: 15000, label: 'Scale Campaign', period: '₹15,000 / week' },
                          ].map((tier) => (
                            <button
                              key={tier.amount}
                              type="button"
                              onClick={() => setAdBudgetTier(tier.amount)}
                              className={`p-2.5 rounded-lg border text-left transition relative ${
                                adBudgetTier === tier.amount
                                  ? 'bg-amber-500/20 border-amber-400 text-white shadow-sm ring-1 ring-amber-400/40'
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {tier.popular && (
                                <span className="absolute -top-1.5 right-1.5 bg-amber-400 text-slate-950 text-[8px] font-bold px-1.5 py-0.2 rounded-full uppercase">
                                  Default ₹500
                                </span>
                              )}
                              <span className="text-xs font-bold font-mono text-white block">{tier.period}</span>
                              <span className="text-[10px] text-slate-400 line-clamp-1">{tier.label}</span>
                            </button>
                          ))}
                        </div>

                        {/* Forecast Result Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                            <span className="text-[10px] font-mono text-slate-400 uppercase">Est. Impressions</span>
                            <p className="text-sm font-bold font-mono text-white mt-0.5">
                              {estImpressions.toLocaleString()}
                            </p>
                            <span className="text-[9px] text-slate-500">Across Meta &amp; Google</span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                            <span className="text-[10px] font-mono text-slate-400 uppercase">Est. Reach</span>
                            <p className="text-sm font-bold font-mono text-sky-400 mt-0.5">
                              {estReach.toLocaleString()}
                            </p>
                            <span className="text-[9px] text-slate-500">Unique HNW Individuals</span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                            <span className="text-[10px] font-mono text-slate-400 uppercase">High-Intent Clicks</span>
                            <p className="text-sm font-bold font-mono text-amber-400 mt-0.5">
                              {estClicks.toLocaleString()}
                            </p>
                            <span className="text-[9px] text-slate-500">To Portfolio &amp; SMS/Call</span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                            <span className="text-[10px] font-mono text-slate-400 uppercase">Projected Leads</span>
                            <p className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                              {estLeads} - {Math.round(estLeads * 1.4)} Leads
                            </p>
                            <span className="text-[9px] text-slate-500">Verified Client Inquiries</span>
                          </div>
                        </div>
                      </div>

                      {/* Campaign Control & Deployment Actions */}
                      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setIsCampaignLive(!isCampaignLive)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition shadow-lg ${
                              isCampaignLive
                                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                                : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-slate-950 shadow-emerald-500/20'
                            }`}
                          >
                            <Rocket className="h-4 w-4" />
                            <span>{isCampaignLive ? 'Pause Social Ad Delivery' : 'Launch Social Ad Campaign'}</span>
                          </button>

                          <div className="text-[11px] text-slate-400">
                            {isCampaignLive ? (
                              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                                Active delivery across Instagram, Facebook &amp; YouTube
                              </span>
                            ) : (
                              <span>Click to activate live delivery or export package below.</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={handleCopyAdPackage}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition border border-slate-700"
                            title="Export structured campaign JSON for Meta Ads Manager / Google Ads"
                          >
                            {copiedAdPackage ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Sliders className="h-3.5 w-3.5 text-sky-400" />}
                            <span>{copiedAdPackage ? 'Package Copied!' : 'Export Ads JSON'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleAddSimulatedLead}
                            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold text-xs transition border border-amber-500/30"
                            title="Simulate incoming client lead from social ads"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>+ Simulate Inbound Lead</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right Column (5 Cols): Live Ad Mockup & Ingested Leads Feed */}
                    <div className="lg:col-span-5 space-y-5">
                      {/* Device / Preview Switcher */}
                      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 space-y-3.5">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-sky-400" />
                            <span className="text-xs font-bold text-white uppercase tracking-wider">
                              Live Sponsored Ad Preview
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {[
                              { id: 'instagram', label: 'Instagram', icon: Camera, color: 'text-pink-400' },
                              { id: 'facebook', label: 'Facebook', icon: Globe, color: 'text-blue-400' },
                              { id: 'youtube', label: 'YouTube', icon: Film, color: 'text-red-400' },
                            ].map((dev) => (
                              <button
                                key={dev.id}
                                type="button"
                                onClick={() => setPreviewAdDevice(dev.id as any)}
                                className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition flex items-center gap-1 ${
                                  previewAdDevice === dev.id
                                    ? 'bg-slate-800 text-white border border-slate-700'
                                    : 'text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                <dev.icon className={`h-3 w-3 ${dev.color}`} />
                                <span>{dev.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* INSTAGRAM SPONSORED REEL MOCKUP */}
                        {previewAdDevice === 'instagram' && (
                          <div className="rounded-xl bg-slate-950 border border-pink-500/30 overflow-hidden shadow-xl">
                            {/* Instagram Header */}
                            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-900 bg-slate-950">
                              <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 p-[1.5px]">
                                  <div className="h-full w-full rounded-full bg-slate-950 flex items-center justify-center text-[10px] font-bold text-white">
                                    SG
                                  </div>
                                </div>
                                <div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs font-bold text-white leading-none">gouse_architecture</span>
                                    <CheckCircle2 className="h-3 w-3 text-sky-400 fill-current" />
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-mono">Sponsored</span>
                                </div>
                              </div>
                              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                            </div>

                            {/* Ad Media Canvas Simulation */}
                            <div className="relative aspect-[4/5] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 flex flex-col justify-between p-4 overflow-hidden group">
                              <div className="absolute inset-0 opacity-20 pointer-events-none">
                                <div className="w-full h-full bg-[radial-gradient(#f43f5e_1px,transparent_1px)] [background-size:16px_16px]" />
                              </div>

                              <div className="flex items-center justify-between relative z-10">
                                <span className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-mono text-white font-bold border border-white/10">
                                  {activeAd.badge}
                                </span>
                                <span className="bg-pink-600/80 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-wider">
                                  Sponsored Reel
                                </span>
                              </div>

                              <div className="relative z-10 text-center space-y-1.5 my-auto">
                                <div className="h-12 w-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 mx-auto shadow-lg shadow-amber-500/20">
                                  <Building2 className="h-6 w-6" />
                                </div>
                                <h5 className="text-sm font-extrabold text-white px-4 leading-tight drop-shadow-md">
                                  {showcaseTitle}
                                </h5>
                                <p className="text-[11px] text-slate-300 px-6 line-clamp-2">
                                  "{activeAd.hook}"
                                </p>
                                <span className="inline-block text-[10px] text-amber-300 font-mono font-semibold bg-slate-950/80 px-2 py-0.5 rounded border border-amber-400/30">
                                  📍 {adTargetLocation.split(',')[0]} • {activeProject.builtUpAreaSqFt?.toLocaleString() || '3,500'} SQ.FT
                                </span>
                              </div>

                              {/* Interactive CTA Bar on Reel */}
                              <div className="relative z-10 pt-2 border-t border-white/10 flex items-center justify-between">
                                <div className="text-left">
                                  <span className="text-[10px] text-white font-bold block">{companyName.slice(0, 24)}...</span>
                                  <span className="text-[9px] text-sky-300 font-mono">Area: {projectAreaSqFt}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <a
                                    href={directAreaSmsHref}
                                    className="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-md"
                                  >
                                    <MessageSquare className="h-3 w-3" />
                                    <span>Send Area SMS</span>
                                  </a>
                                  <a
                                    href={`https://wa.me/${cleanPhone(companyPhone)}?text=${encodeURIComponent(areaSmsMessage)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-[11px] flex items-center gap-1 shadow-md hover:opacity-90"
                                  >
                                    <span>WhatsApp</span>
                                    <ChevronRight className="h-3 w-3" />
                                  </a>
                                </div>
                              </div>
                            </div>

                            {/* Caption Footer */}
                            <div className="p-3 text-xs space-y-1 bg-slate-950">
                              <p className="text-slate-300 line-clamp-2">
                                <strong className="text-white font-semibold">gouse_architecture</strong> {activeAd.primaryText}
                              </p>
                              <p className="text-[10px] text-slate-500 font-mono">
                                4,812 views • 342 saves • Sponsored by {companyName}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* FACEBOOK LEAD AD MOCKUP */}
                        {previewAdDevice === 'facebook' && (
                          <div className="rounded-xl bg-slate-950 border border-blue-500/30 overflow-hidden shadow-xl text-xs">
                            <div className="p-3.5 space-y-2.5">
                              {/* Page Header */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                                    f
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1">
                                      <span className="font-bold text-white leading-none">{companyName.slice(0, 32)}</span>
                                      <CheckCircle2 className="h-3 w-3 text-blue-400 fill-current" />
                                    </div>
                                    <span className="text-[10px] text-slate-400">Sponsored • Paid Partnership</span>
                                  </div>
                                </div>
                                <span className="text-[10px] text-slate-400">•••</span>
                              </div>

                              {/* Primary Text */}
                              <p className="text-slate-300 leading-relaxed line-clamp-3">
                                {activeAd.primaryText}
                              </p>
                            </div>

                            {/* Media Banner */}
                            <div className="h-44 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4 border-y border-slate-800 relative">
                              <Building2 className="h-8 w-8 text-blue-400 mb-1" />
                              <span className="text-xs font-bold text-white">{showcaseTitle}</span>
                              <span className="text-[10px] text-slate-400">{activeAd.title}</span>
                              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 mt-1">
                                ZERO COST ESCALATION GUARANTEED • {projectAreaSqFt}
                              </span>
                            </div>

                            {/* Facebook CTA Bar */}
                            <div className="p-3 bg-slate-900/90 flex items-center justify-between">
                              <div>
                                <span className="text-[9px] font-mono text-slate-400 uppercase">{companyWebsite}</span>
                                <h6 className="text-xs font-bold text-white leading-tight">{activeAd.headline.slice(0, 35)}...</h6>
                                <span className="text-[9px] text-sky-300 font-mono">Built-up Area: {projectAreaSqFt}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <a
                                  href={directAreaSmsHref}
                                  className="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1 shrink-0"
                                >
                                  <MessageSquare className="h-3.5 w-3.5" />
                                  <span>Send Area SMS</span>
                                </a>
                                <a
                                  href={`https://wa.me/${cleanPhone(companyPhone)}?text=${encodeURIComponent(areaSmsMessage)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shrink-0"
                                >
                                  <Phone className="h-3.5 w-3.5" />
                                  <span>WhatsApp</span>
                                </a>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* YOUTUBE IN-STREAM AD MOCKUP */}
                        {previewAdDevice === 'youtube' && (
                          <div className="rounded-xl bg-slate-950 border border-red-500/30 overflow-hidden shadow-xl text-xs">
                            <div className="relative aspect-video bg-black flex flex-col justify-between p-3">
                              {/* Top Bar with Ad Badge */}
                              <div className="flex items-center justify-between z-10">
                                <span className="bg-amber-400 text-black px-1.5 py-0.5 rounded font-extrabold text-[10px] font-mono">
                                  Ad • 0:05
                                </span>
                                <span className="bg-black/70 px-2 py-0.5 rounded text-[10px] text-slate-300">
                                  Skip in 5s
                                </span>
                              </div>

                              <div className="text-center space-y-1 z-10">
                                <Film className="h-8 w-8 text-red-500 mx-auto" />
                                <h6 className="text-sm font-bold text-white drop-shadow">
                                  {showcaseTitle} 4K 3D Walkthrough
                                </h6>
                                <p className="text-[11px] text-slate-300">
                                  "{activeAd.hook}"
                                </p>
                              </div>

                              {/* YouTube In-Video Action Bar */}
                              <div className="flex items-center justify-between bg-black/80 backdrop-blur-md p-2 rounded-lg border border-white/10 z-10">
                                <div className="flex items-center gap-2">
                                  <div className="h-6 w-6 rounded bg-red-600 flex items-center justify-center text-white font-bold text-[10px]">
                                    SG
                                  </div>
                                  <div>
                                    <span className="text-xs font-bold text-white block">{companyName.slice(0, 24)}...</span>
                                    <span className="text-[9px] text-sky-300 font-mono">Area: {projectAreaSqFt}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <a
                                    href={directAreaSmsHref}
                                    className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] flex items-center gap-1"
                                  >
                                    <MessageSquare className="h-3 w-3" />
                                    <span>Send Area SMS</span>
                                  </a>
                                  <a
                                    href={`https://wa.me/${cleanPhone(companyPhone)}?text=${encodeURIComponent(areaSmsMessage)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1"
                                  >
                                    <Phone className="h-3 w-3" />
                                    <span>WhatsApp</span>
                                  </a>
                                  <a
                                    href={companyWebsite}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] flex items-center gap-1"
                                  >
                                    <span>Studio</span>
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                              </div>
                            </div>
                            <div className="p-3 text-slate-400 text-[11px] bg-slate-950 flex items-center justify-between">
                              <span>Format: In-Stream Video Tour</span>
                              <span className="text-red-400 font-mono">1080p 60fps BIM Simulation</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Live Inbound Leads Feed & Lead Capture Tracker */}
                      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
                        {(() => {
                          const visibleLeads = simulatedLeads.filter((lead) => {
                            if (!clientPrivacyShield) return true;
                            // Exclude confidential clients like Krishnappa 01 as requested
                            const text = `${lead.name} ${lead.projectType}`.toLowerCase();
                            return !text.includes('krishnappa');
                          });

                          return (
                            <>
                              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                                <div className="flex items-center gap-2">
                                  <UserCheck className="h-4 w-4 text-emerald-400" />
                                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                                    Inbound Ad Inquiries ({visibleLeads.length})
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  Live Webhook Active
                                </span>
                              </div>

                              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                                {visibleLeads.map((lead) => (
                                  <div
                                    key={lead.id}
                                    className="p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition space-y-1.5 text-xs"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-[10px] font-bold text-amber-300">
                                          {lead.name.split(' ').map((n) => n[0]).join('')}
                                        </div>
                                        <span className="font-bold text-white">{lead.name}</span>
                                      </div>
                                      <span className="text-[10px] font-mono text-slate-500">{lead.time}</span>
                                    </div>

                                    <p className="text-slate-300 text-[11px] leading-snug">
                                      {lead.projectType}
                                    </p>

                                    <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[10px]">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-emerald-400">{lead.budget}</span>
                                        <span>•</span>
                                        <span className="text-slate-400 font-mono">{lead.channel}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {/* Direct SMS communication per user request: "second whatsapp only there message should through sms" */}
                                        <a
                                          href={`sms:${lead.phone.replace(/[^\d+]/g, '')}?body=${encodeURIComponent(`Hi ${lead.name}, thank you for inquiring about ${lead.projectType} with ${companyName}. We have prepared your initial concept estimation for project area ${projectAreaSqFt}.`)}`}
                                          className="text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 font-mono px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/30"
                                        >
                                          <MessageSquare className="h-2.5 w-2.5" />
                                          <span>Send Area SMS</span>
                                        </a>
                                        <a
                                          href={`https://wa.me/${lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${lead.name}, thank you for inquiring about ${lead.projectType} with ${companyName}. We have prepared your initial concept estimation.`)}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 font-mono"
                                        >
                                          <span>WhatsApp</span>
                                          <ExternalLink className="h-2.5 w-2.5" />
                                        </a>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION B: ORGANIC MEDIA SHOWCASE (INSTAGRAM, FACEBOOK, YOUTUBE & STAKEHOLDER WALL) */}
              {socialMode === 'organic' && (
                <div id="organic-media-showcase-wrapper" className="space-y-6">
              {/* Direct Multi-Channel One-Click Share Bar with Instagram, Facebook, YouTube */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Smartphone className="h-4 w-4 text-sky-400 shrink-0" />
                  <span className="font-medium">Direct One-Click Channels:</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Instagram Action */}
                  <button
                    type="button"
                    onClick={() => {
                      setSocialPlatform('instagram');
                      handleCopyInstagramKit();
                      window.open('https://www.instagram.com/', '_blank');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/40 text-pink-300 hover:from-pink-500 hover:to-purple-600 hover:text-white rounded-md transition font-semibold text-[11px]"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>Instagram</span>
                  </button>

                  {/* Facebook Action */}
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setSocialPlatform('facebook')}
                    className="flex items-center gap-1.5 px-3 py-1 bg-blue-600/20 border border-blue-500/40 text-blue-300 hover:bg-blue-600 hover:text-white rounded-md transition font-semibold text-[11px]"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    <span>Facebook</span>
                  </a>

                  {/* YouTube Action */}
                  <button
                    type="button"
                    onClick={() => {
                      setSocialPlatform('youtube');
                      setIsPlayingWalkthrough(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 bg-red-600/20 border border-red-500/40 text-red-300 hover:bg-red-600 hover:text-white rounded-md transition font-semibold text-[11px]"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>YouTube 3D Tour</span>
                  </button>

                  {/* Direct SMS Action - Mobile in Backend, Direct Area SMS on click */}
                  <a
                    id="btn-direct-sms-share"
                    href={directAreaSmsHref}
                    className="flex items-center gap-1.5 px-3 py-1 bg-sky-600/20 border border-sky-500/40 text-sky-300 hover:bg-sky-600 hover:text-white rounded-md transition font-semibold text-[11px]"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Send Area SMS</span>
                  </a>

                  {/* WhatsApp Action */}
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600 hover:text-white rounded-md transition font-semibold text-[11px]"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  {/* LinkedIn Action */}
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1 bg-sky-600/20 border border-sky-500/40 text-sky-300 hover:bg-sky-600 hover:text-white rounded-md transition font-semibold text-[11px]"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    <span>LinkedIn</span>
                  </a>

                  {/* Email Client */}
                  <a
                    href={`mailto:?subject=${encodeURIComponent(`Architectural Project Review: ${showcaseTitle}`)}&body=${encodeURIComponent(shareText)}`}
                    className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500 hover:text-slate-950 rounded-md transition font-semibold text-[11px]"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Email Brief</span>
                  </a>
                </div>
              </div>

              {/* Platform Selector Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3 flex-wrap">
                <span className="text-xs font-semibold text-slate-400 mr-1">Platform Focus:</span>
                {[
                  { id: 'all', label: 'All Channels', icon: Share2, color: 'text-sky-300' },
                  { id: 'instagram', label: 'Instagram Studio (Reels & Feed)', icon: Camera, color: 'text-pink-400' },
                  { id: 'facebook', label: 'Facebook Studio (Page & Story)', icon: Globe, color: 'text-blue-400' },
                  { id: 'youtube', label: 'YouTube 3D Walkthrough Player', icon: Film, color: 'text-red-400' },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isSelected = socialPlatform === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSocialPlatform(tab.id as any)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                        isSelected
                          ? 'bg-slate-800 border-sky-400/80 text-white shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${tab.color}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Platform Modules Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                {/* Left Column: Interactive Platform Studio (Instagram / Facebook / YouTube) (7 Cols) */}
                <div className="lg:col-span-7 space-y-4">
                  {/* INSTAGRAM MODULE */}
                  {(socialPlatform === 'all' || socialPlatform === 'instagram') && (
                    <div className="rounded-xl bg-slate-900/90 border border-pink-500/30 p-4 space-y-4 shadow-lg shadow-pink-500/5">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-md bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 flex items-center justify-center text-white">
                            <Camera className="h-3.5 w-3.5" />
                          </div>
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            Instagram Showcase &amp; Reels Creator
                          </h4>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-mono">
                          {(['reel', 'post', 'carousel'] as const).map((fmt) => (
                            <button
                              key={fmt}
                              type="button"
                              onClick={() => setInstagramFormat(fmt)}
                              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold transition ${
                                instagramFormat === fmt
                                  ? 'bg-pink-500 text-white'
                                  : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {fmt}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Instagram Caption Box */}
                      <div className="rounded-lg bg-slate-950 border border-slate-800 p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono font-bold text-pink-400">
                            Instagram Caption &amp; Hashtag Kit:
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyInstagramKit}
                            className="flex items-center gap-1 text-[11px] text-pink-300 hover:text-pink-200 font-mono"
                          >
                            {copiedInstagramKit ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            <span>{copiedInstagramKit ? 'Copied to Clipboard!' : 'Copy Instagram Kit'}</span>
                          </button>
                        </div>

                        <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans bg-slate-900/60 p-3 rounded border border-slate-800/80">
                          {instagramCaption}
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span>Format: <strong className="text-slate-200">{instagramFormat === 'reel' ? '9:16 Reel Video' : instagramFormat === 'post' ? '1:1 Square Post' : '10-Slide Carousel'}</strong></span>
                            <span>•</span>
                            <span>Aspect Ratio: <strong className="text-slate-200">{instagramFormat === 'reel' ? '9:16' : '1:1'}</strong></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href="https://www.instagram.com/"
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-[11px] font-semibold text-pink-400 hover:text-pink-300"
                            >
                              <span>Open Instagram</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            <button
                              type="button"
                              onClick={handleCopyInstagramKit}
                              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 transition"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              <span>{copiedInstagramKit ? 'Copied!' : 'Copy Caption & Tags'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FACEBOOK MODULE */}
                  {(socialPlatform === 'all' || socialPlatform === 'facebook') && (
                    <div className="rounded-xl bg-slate-900/90 border border-blue-500/30 p-4 space-y-4 shadow-lg shadow-blue-500/5">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                            f
                          </div>
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            Facebook Page &amp; Community Story
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono text-blue-400">Client Group &amp; Page Post</span>
                      </div>

                      {/* Facebook Post Box */}
                      <div className="rounded-lg bg-slate-950 border border-slate-800 p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono font-bold text-blue-400">
                            Facebook Milestone Post Kit:
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyFacebookKit}
                            className="flex items-center gap-1 text-[11px] text-blue-300 hover:text-blue-200 font-mono"
                          >
                            {copiedFacebookKit ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            <span>{copiedFacebookKit ? 'Copied Post Kit!' : 'Copy Facebook Post'}</span>
                          </button>
                        </div>

                        <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans bg-slate-900/60 p-3 rounded border border-slate-800/80">
                          {facebookPost}
                        </div>

                        <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                          <span className="text-[11px] text-slate-400">
                            Includes live project link, setback compliance summary &amp; architect attribution.
                          </span>
                          <div className="flex items-center gap-2">
                            <a
                              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-bold text-white transition"
                            >
                              <Globe className="h-3.5 w-3.5" />
                              <span>Share on Facebook</span>
                            </a>
                            <button
                              type="button"
                              onClick={handleCopyFacebookKit}
                              className="flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition"
                            >
                              <Copy className="h-3 w-3" />
                              <span>Copy Text</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* YOUTUBE MODULE */}
                  {(socialPlatform === 'all' || socialPlatform === 'youtube') && (
                    <div className="rounded-xl bg-slate-900/90 border border-red-500/30 p-4 space-y-4 shadow-lg shadow-red-500/5">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-md bg-red-600 flex items-center justify-center text-white font-bold text-xs">
                            <Play className="h-3 w-3 fill-current" />
                          </div>
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            YouTube 3D Architectural Walkthrough Player &amp; Kit
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                          4K UHD • 60 FPS
                        </span>
                      </div>

                      {/* Simulated 3D Video Walkthrough Player */}
                      <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden relative group">
                        <div className="relative h-48 bg-gradient-to-br from-slate-950 via-slate-900 to-red-950/30 flex flex-col items-center justify-center p-4">
                          {/* Animated Play button */}
                          <button
                            type="button"
                            onClick={() => setIsPlayingWalkthrough(!isPlayingWalkthrough)}
                            className={`h-14 w-14 rounded-full flex items-center justify-center transition shadow-xl ${
                              isPlayingWalkthrough
                                ? 'bg-red-600 text-white scale-95'
                                : 'bg-red-600/90 text-white hover:scale-105 hover:bg-red-500'
                            }`}
                          >
                            <Play className={`h-7 w-7 fill-current ${isPlayingWalkthrough ? 'animate-pulse' : ''} ml-0.5`} />
                          </button>

                          <div className="mt-3 text-center">
                            <span className="text-xs font-bold text-white">
                              {isPlayingWalkthrough ? 'Streaming 3D Lumion Architectural Walkthrough...' : 'Click to Preview 3D Virtual Tour'}
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {activeProject.name} • Biophilic Courtyard &amp; Daylight Analysis
                            </div>
                          </div>

                          {/* Top Badges */}
                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[9px] font-bold font-mono">
                              YOUTUBE
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-950/80 text-red-300 text-[9px] font-mono border border-red-500/30">
                              4K HDR
                            </span>
                          </div>

                          <div className="absolute top-2.5 right-2.5 rounded bg-slate-950/80 px-2 py-0.5 text-[10px] font-mono text-slate-300 border border-slate-800">
                            {isPlayingWalkthrough ? '02:14 / 04:30' : '04:30 Duration'}
                          </div>

                          {/* Bottom Video Progress Scrub Bar */}
                          <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-gradient-to-t from-slate-950 to-transparent flex flex-col gap-1">
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`bg-red-600 h-full rounded-full transition-all duration-500 ${
                                  isPlayingWalkthrough ? 'w-1/2' : 'w-1/4'
                                }`}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Video Walkthrough Chapters */}
                        <div className="p-3 bg-slate-900/90 border-t border-slate-800 text-xs">
                          <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
                            <span>Interactive Video Chapters:</span>
                            <span className="font-mono text-[10px] text-red-400">Auto-Generated Timestamps</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                            <div className="p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                              <strong className="text-red-400">00:00</strong> Drone Aerial &amp; Site Setbacks
                            </div>
                            <div className="p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                              <strong className="text-red-400">01:10</strong> Double-Height Living &amp; Court
                            </div>
                            <div className="p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                              <strong className="text-red-400">02:25</strong> Master Suite &amp; Terraces
                            </div>
                            <div className="p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                              <strong className="text-red-400">03:45</strong> Structural Column Grid
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* YouTube Description & SEO Kit */}
                      <div className="rounded-lg bg-slate-950 border border-slate-800 p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono font-bold text-red-400">
                            YouTube Video Title, Description &amp; SEO Tags:
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyYouTubeKit}
                            className="flex items-center gap-1 text-[11px] text-red-300 hover:text-red-200 font-mono"
                          >
                            {copiedYouTubeKit ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            <span>{copiedYouTubeKit ? 'Copied YouTube Kit!' : 'Copy YouTube Kit'}</span>
                          </button>
                        </div>

                        <div className="text-xs font-bold text-white bg-slate-900/60 p-2.5 rounded border border-slate-800">
                          {youtubeVideoTitle}
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] text-slate-400">
                            Includes timestamp chapters, CAD specs, and architectural attribution.
                          </span>
                          <div className="flex items-center gap-2">
                            <a
                              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(showcaseTitle + ' architectural walkthrough')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-[11px] font-semibold text-red-400 hover:text-red-300"
                            >
                              <span>Search on YouTube</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            <button
                              type="button"
                              onClick={handleCopyYouTubeKit}
                              className="flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-500 px-3 py-1.5 text-xs font-bold text-white transition"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copy Video Kit</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Live Social Showcase Card & Discussion Feed (5 Cols) */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Social Showcase Mock Preview Card */}
                  <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-sky-400" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Live Social Portal Preview
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400">Multi-Channel Feed Card</span>
                    </div>

                    {/* Mock Instagram/Facebook Live Card */}
                    <div className="rounded-lg border border-slate-700 bg-slate-950 overflow-hidden shadow-md">
                      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-amber-500 to-sky-500 flex items-center justify-center text-[10px] font-bold text-slate-950">
                            GA
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">Gouse AI Architecture</div>
                            <div className="text-[10px] text-slate-400">{activeProject.location || 'Bengaluru, India'} • Public Portfolio</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">Verified</span>
                      </div>

                      {/* Mock Visual Blueprint Box */}
                      <div className="relative h-44 bg-gradient-to-br from-slate-900 via-sky-950/40 to-slate-900 flex flex-col items-center justify-center p-4 text-center border-b border-slate-800">
                        <Building2 className="h-10 w-10 text-amber-400/80 mb-1" />
                        <div className="text-sm font-bold text-white font-serif-classic">
                          {showcaseTitle}
                        </div>
                        <div className="text-xs text-sky-300 font-mono mt-0.5">
                          {activeProject.builtUpAreaSqFt?.toLocaleString() || '3,500'} SQ.FT • NBC 2016 COMPLIANT
                        </div>
                        <div className="absolute bottom-2 right-2 rounded bg-slate-950/80 px-2 py-0.5 text-[9px] font-mono text-slate-300 border border-slate-700">
                          Setbacks Verified
                        </div>
                      </div>

                      <div className="p-3 space-y-2 text-xs">
                        <p className="text-slate-300 leading-snug line-clamp-2">
                          <strong className="text-white">gouse_ai:</strong> {activeProject.description || 'Turnkey biophilic architectural design with NBC 2016 compliance, solar courtyards, and integrated BOQ estimation.'}
                        </p>
                        {/* Likes counter removed as requested by user; replaced with client privacy indicator and direct SMS consultation */}
                        <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-800/60">
                          <span className="flex items-center gap-1.5 text-emerald-400 font-mono font-semibold">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                            Client Privacy Protected
                          </span>
                          <a
                            id="btn-showcase-sms-consult"
                            href={directAreaSmsHref}
                            className="flex items-center gap-1 text-sky-400 hover:text-sky-300 font-mono font-bold px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/30 text-[10px]"
                          >
                            <MessageSquare className="h-2.5 w-2.5" />
                            <span>Area SMS Consult</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Project Social Collaboration & Feedback Wall */}
                  <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
                    {(() => {
                      const visibleComments = socialComments.filter((comment) => {
                        if (!clientPrivacyShield) return true;
                        const fullText = `${comment.author} ${comment.content} ${comment.role}`.toLowerCase();
                        return !fullText.includes('krishnappa');
                      });

                      return (
                        <>
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-emerald-400" />
                              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                                Stakeholder Social Wall ({visibleComments.length})
                              </h4>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">Team &amp; Client Feed</span>
                          </div>

                          {/* Post Comment Input Form */}
                          <form onSubmit={handleAddSocialComment} className="space-y-2">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <select
                                value={newCommentAuthor}
                                onChange={(e) => setNewCommentAuthor(e.target.value)}
                                className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white outline-none focus:border-sky-500"
                              >
                                <option value="Ar. S. Gouse">Ar. S. Gouse (Lead)</option>
                                <option value="Client Representative">Client Partner</option>
                                <option value="Er. Ramesh Babu">Structural Lead</option>
                                <option value="Site Project Manager">Site PM</option>
                              </select>
                              <select
                                value={newCommentTag}
                                onChange={(e) => setNewCommentTag(e.target.value)}
                                className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white outline-none focus:border-sky-500"
                              >
                                <option value="Architectural Update">Architectural Update</option>
                                <option value="Client Approval">Client Approval</option>
                                <option value="Site Verification">Site Verification</option>
                                <option value="Material Selection">Material Selection</option>
                              </select>
                            </div>

                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Post design note or client feedback..."
                                value={newSocialComment}
                                onChange={(e) => setNewSocialComment(e.target.value)}
                                className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
                              />
                              <button
                                type="submit"
                                className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition shrink-0"
                              >
                                <Send className="h-3 w-3" />
                                <span>Post</span>
                              </button>
                            </div>
                          </form>

                          {/* Comment Feed Items */}
                          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                            {visibleComments.map((comment) => (
                              <div
                                key={comment.id}
                                className="rounded-lg bg-slate-950 border border-slate-800/80 p-2.5 space-y-1.5 text-xs"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-sky-300">
                                      {comment.avatarText}
                                    </div>
                                    <div>
                                      <span className="font-semibold text-white text-xs">{comment.author}</span>
                                      <span className="text-[10px] text-slate-400 ml-1.5 font-mono">{comment.role}</span>
                                    </div>
                                  </div>
                                  <span className="text-[10px] text-slate-500 font-mono">{comment.timestamp}</span>
                                </div>

                                <p className="text-xs text-slate-300 leading-relaxed pl-8">
                                  {comment.content}
                                </p>

                                <div className="flex items-center justify-between pl-8 pt-1 text-[10px]">
                                  <span className="rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 px-1.5 py-0.2 font-mono">
                                    {comment.tag}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleLikeComment(comment.id)}
                                    className={`flex items-center gap-1 font-mono transition ${
                                      comment.hasLiked ? 'text-rose-400 font-bold' : 'text-slate-400 hover:text-rose-400'
                                    }`}
                                  >
                                    <Heart className={`h-3 w-3 ${comment.hasLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                                    <span>{comment.likes}</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};
