import React, { useState } from 'react';
import {
  FolderPlus,
  Sparkles,
  Users,
  History,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Printer,
  Copy,
  Plus,
  Trash2,
  Zap,
  Scale,
  Building2,
  Building,
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
  Home,
  Bed,
  Upload,
  Image as ImageIcon,
  Star,
  BadgeCheck,
  X,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { Project, TeamMember, AuditEvent } from '../types';
import { formatDate, CurrencyCode } from '../utils/formatters';
import { PgHousePropertyListingSection } from './PgHousePropertyListingSection';
import { SocialMediaStudio } from './SocialMediaStudio';

export const PRESET_PORTRAITS = [
  {
    label: 'Executive Lead',
    role: 'Principal Architect',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'Senior Architect',
    role: 'Lead Architect',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'Structural Lead',
    role: 'Structural Engineer',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'Design Specialist',
    role: 'Interior & Facade',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'Commercial Director',
    role: 'Quantity Surveyor',
    url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'Client Liaison',
    role: 'Project Stakeholder',
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'Civil Site Engineer',
    role: 'Site Operations',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'MEP Consultant',
    role: 'HVAC & Electrical',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80',
  },
];

export const getDefaultAvatar = (name: string, role?: string): string => {
  const lowerName = name.toLowerCase();
  if (role === 'owner' || lowerName.includes('gouse') || lowerName.includes('lead') || lowerName.includes('principal')) {
    return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80';
  }
  if (lowerName.includes('priya') || role === 'architect') {
    return 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80';
  }
  if (lowerName.includes('rajesh') || role === 'structural_engineer') {
    return 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80';
  }
  if (role === 'client' || lowerName.includes('sameer') || lowerName.includes('client')) {
    return 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80';
  }
  if (role === 'mep_engineer') {
    return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';
  }
  return 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80';
};

interface ProjectsViewProps {
  projects: Project[];
  activeProject: Project;
  onSelectProject: (id: string) => void;
  onUpdateProject: (updated: Project) => void;
  onCreateProject: (newProj: Partial<Project>) => void;
  onOpenWorkflowEngine?: () => void;
  currency?: CurrencyCode;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onUpdateProject,
  onCreateProject,
  onOpenWorkflowEngine,
  currency = 'INR',
}) => {
  const [activeTab, setActiveTab] = useState<'social' | 'pg_listing' | 'rent_house_listing' | 'team'>('team');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectType, setNewProjectType] = useState('Residential Architecture');
  const [newLocation, setNewLocation] = useState('');
  const [newArea, setNewArea] = useState<number>(3500);
  const [newDescription, setNewDescription] = useState('');

  // Safe accessors for active project properties
  const members = activeProject?.members || [];
  const auditLogs = activeProject?.auditLogs || [];

  // Team member state
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<TeamMember['role']>('architect');
  const [newMemberDepartment, setNewMemberDepartment] = useState('Senior Architectural Design');
  const [newMemberPhone, setNewMemberPhone] = useState('+91 98450 12345');
  const [newMemberAvatar, setNewMemberAvatar] = useState(PRESET_PORTRAITS[1].url);
  const [editingPhotoMember, setEditingPhotoMember] = useState<TeamMember | null>(null);
  const [photoModalUrl, setPhotoModalUrl] = useState('');
  const [employeeFilterRole, setEmployeeFilterRole] = useState<string>('all');

  const handleUpdateEmployeeAvatar = (memberId: string, newAvatarUrl: string) => {
    if (!newAvatarUrl) return;
    const currentMembers = activeProject?.members || [];
    const updatedMembers = currentMembers.map((m) =>
      m.id === memberId ? { ...m, avatarUrl: newAvatarUrl } : m
    );
    const updatedProject: Project = {
      ...activeProject,
      members: updatedMembers,
    };
    onUpdateProject(updatedProject);
    setEditingPhotoMember(null);
    setPhotoModalUrl('');
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isModal = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (isModal) {
        setPhotoModalUrl(dataUrl);
      } else {
        setNewMemberAvatar(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

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
      avatarUrl: newMemberAvatar.trim() || getDefaultAvatar(newMemberName, newMemberRole),
      department: newMemberDepartment.trim() || 'Design & Project Execution',
      phone: newMemberPhone.trim() || '+91 98450 12890',
    };

    const updatedProject: Project = {
      ...activeProject,
      members: [...currentMembers, newMember],
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          projectId: activeProject.id,
          actor: 'Gouse AI',
          action: 'Employee Added',
          details: `Added ${newMember.name} as ${newMember.role.replace('_', ' ')} to company team`,
          timestamp: new Date().toISOString(),
        },
        ...currentLogs,
      ],
    };

    onUpdateProject(updatedProject);
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberAvatar(PRESET_PORTRAITS[1].url);
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
          actor: 'Gouse AI',
          action: 'Employee Removed',
          details: `Removed ${memberName} (${memberRole.replace('_', ' ')}) from company team`,
          timestamp: new Date().toISOString(),
        },
        ...currentLogs,
      ],
    };

    onUpdateProject(updatedProject);
  };

  return (
    <div id="projects-workspace-view" className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">

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

      {/* Sub-tabs & Action Bar */}
      <div className="border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
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
            <span>Company Employee ({members.length})</span>
            <span className="rounded bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 text-[10px] px-2 py-0.2 font-mono font-bold">
              PHOTO IDS
            </span>
          </button>

          <button
            id="tab-btn-social"
            onClick={() => setActiveTab('social')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition ${
              activeTab === 'social'
                ? 'border-sky-400 text-sky-400 bg-sky-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-pink-400" />
            <span>Social Media &amp; Showcase Hub</span>
            <span className="rounded bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-sky-500/20 text-sky-200 border border-sky-500/30 text-[10px] px-2 py-0.2 font-mono font-bold">
              PHOTOS &amp; VIDEOS
            </span>
          </button>

          <button
            id="tab-btn-pg-listing"
            onClick={() => setActiveTab('pg_listing')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition ${
              activeTab === 'pg_listing'
                ? 'border-amber-400 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building className="w-3.5 h-3.5 text-amber-400" />
            <span>PG &amp; Co-Living</span>
            <span className="rounded bg-gradient-to-r from-rose-500/20 to-amber-500/20 text-rose-300 border border-rose-500/30 text-[10px] px-2 py-0.2 font-mono font-bold">
              BEDS • MESS
            </span>
          </button>

          <button
            id="tab-btn-rent-house"
            onClick={() => setActiveTab('rent_house_listing')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition ${
              activeTab === 'rent_house_listing'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Home className="w-3.5 h-3.5 text-emerald-400" />
            <span>Rent House &amp; Flats</span>
            <span className="rounded bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-2 py-0.2 font-mono font-bold">
              1-4 BHK • VASTU
            </span>
          </button>
        </div>

        {/* Compact Right Actions */}
        <div className="flex items-center gap-2 pb-1.5 sm:pb-0">
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
            <span className="text-[11px] text-slate-400 font-mono">Switch:</span>
            <select
              id="select-active-project-dropdown"
              value={activeProject.id}
              onChange={(e) => onSelectProject(e.target.value)}
              className="bg-transparent border-0 text-amber-300 text-xs font-semibold focus:outline-none cursor-pointer max-w-[160px] truncate"
            >
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id} className="bg-slate-900 text-white">
                  {proj.name}
                </option>
              ))}
            </select>
          </div>

          <button
            id="btn-open-create-project"
            onClick={() => setIsCreatingProject(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>

          {onOpenWorkflowEngine && (
            <button
              id="btn-projects-launch-workflow"
              type="button"
              onClick={onOpenWorkflowEngine}
              className="whitespace-nowrap flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition shrink-0"
            >
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span>4-Step Engine</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab: Company Employee */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Company Employees &amp; Personnel Gallery ({members.length})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Visual portrait photo IDs, professional architectural disciplines, and executive leadership.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                id="btn-toggle-add-member"
                type="button"
                onClick={() => setIsAddingMember(!isAddingMember)}
                className="inline-flex items-center gap-2 text-xs px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold transition shadow-lg shadow-amber-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>{isAddingMember ? 'Close Form' : 'Add Employee (Photo ID)'}</span>
              </button>
            </div>
          </div>

          {/* Quick Role Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-[11px] font-mono text-slate-400 uppercase mr-1">Filter:</span>
            {[
              { id: 'all', label: 'All Personnel' },
              { id: 'owner', label: 'Company Lead' },
              { id: 'architect', label: 'Architects' },
              { id: 'structural_engineer', label: 'Structural Engineers' },
              { id: 'mep_engineer', label: 'MEP Engineers' },
              { id: 'quantity_surveyor', label: 'Quantity Surveyors' },
              { id: 'client', label: 'Clients / Stakeholders' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setEmployeeFilterRole(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  employeeFilterRole === tab.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Add Employee Inline Form with Image Selection */}
          {isAddingMember && (
            <form
              id="form-add-team-member"
              onSubmit={handleAddTeamMember}
              className="p-6 rounded-2xl bg-slate-900 border border-amber-500/40 space-y-5 shadow-2xl max-w-3xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="text-xs font-bold text-amber-400 flex items-center gap-2 uppercase font-mono tracking-wider">
                  <Camera className="w-4 h-4" />
                  Add New Company Employee • Photo Profile ID
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingMember(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Photo Selector Block */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <label className="block text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                  Employee Profile Photo (Image Type)
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Live Photo Preview */}
                  <div className="relative w-24 h-28 rounded-xl overflow-hidden border-2 border-amber-500/50 shadow-md shrink-0 bg-slate-900">
                    <img
                      src={newMemberAvatar}
                      alt="Preview"
                      className="w-full h-full object-cover object-top"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[9px] text-center font-mono py-0.5 text-amber-300">
                      PREVIEW
                    </div>
                  </div>

                  <div className="flex-1 space-y-2.5 w-full">
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Photo File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageFileUpload(e, false)}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[11px] text-slate-400">or select from portrait presets below:</span>
                    </div>

                    {/* Presets Gallery */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
                      {PRESET_PORTRAITS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setNewMemberAvatar(preset.url)}
                          title={`${preset.label} (${preset.role})`}
                          className={`relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border-2 transition ${
                            newMemberAvatar === preset.url
                              ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105'
                              : 'border-slate-700 opacity-70 hover:opacity-100 hover:border-slate-500'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.label}
                            className="w-full h-full object-cover object-top"
                          />
                        </button>
                      ))}
                    </div>

                    {/* URL Input */}
                    <div>
                      <input
                        type="url"
                        placeholder="Or paste custom image portrait URL..."
                        value={newMemberAvatar}
                        onChange={(e) => setNewMemberAvatar(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-300 font-mono focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Text Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] text-slate-300 font-medium mb-1">Employee Full Name *</label>
                  <input
                    id="input-new-member-name"
                    type="text"
                    required
                    placeholder="e.g. Ar. Tariq Mansoor"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 font-medium mb-1">Work Email Address *</label>
                  <input
                    id="input-new-member-email"
                    type="email"
                    required
                    placeholder="e.g. tariq@gouseai.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[11px] text-slate-300 font-medium mb-1">Role / Designation *</label>
                  <select
                    id="select-new-member-role"
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as TeamMember['role'])}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  >
                    <option value="owner">Company Lead / Principal (Gouse AI)</option>
                    <option value="architect">Project Architect</option>
                    <option value="structural_engineer">Structural Engineer</option>
                    <option value="mep_engineer">MEP Engineer</option>
                    <option value="quantity_surveyor">Quantity Surveyor / Estimator</option>
                    <option value="client">Client Representative</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 font-medium mb-1">Department / Discipline</label>
                  <input
                    type="text"
                    placeholder="e.g. Sustainable Residential Architecture"
                    value={newMemberDepartment}
                    onChange={(e) => setNewMemberDepartment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 font-medium mb-1">Official Contact Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98450 12890"
                    value={newMemberPhone}
                    onChange={(e) => setNewMemberPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingMember(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-new-member"
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md shadow-amber-500/20"
                >
                  Save Employee Photo ID
                </button>
              </div>
            </form>
          )}

          {/* Company Employees Cards Grid (Image Type) */}
          {members.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
              <ImageIcon className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-white mb-1">No Company Employees Registered</h4>
              <p className="text-xs text-slate-400 mb-4">Create your first employee photo profile card with official designation.</p>
              <button
                type="button"
                onClick={() => setIsAddingMember(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add First Employee (Photo ID)</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {members
                .filter((member) => {
                  if (employeeFilterRole === 'all') return true;
                  return member.role === employeeFilterRole;
                })
                .map((member, idx) => {
                  const isLead =
                    member.role === 'owner' ||
                    member.name.toLowerCase().includes('gouse') ||
                    member.name.toLowerCase().includes('principal');
                  const displayName = isLead ? 'Gouse AI' : member.name;
                  const avatar = member.avatarUrl || getDefaultAvatar(member.name, member.role);
                  const department =
                    member.department ||
                    (isLead
                      ? 'Executive Leadership & Principal Architecture'
                      : member.role === 'architect'
                      ? 'Architectural Design & Space Planning'
                      : member.role === 'structural_engineer'
                      ? 'Structural Dynamics & Foundation Engineering'
                      : member.role === 'quantity_surveyor'
                      ? 'BOQ Estimation, Cost Audits & Procurement'
                      : 'Design & Project Execution');
                  const phone = member.phone || '+91 80739 47241';
                  const empBadgeCode = `EMP-${(isLead ? 'GA' : member.name.substring(0, 2)).toUpperCase()}${String(
                    idx + 1
                  ).padStart(3, '0')}`;

                  return (
                    <div
                      key={member.id}
                      id={`team-member-${member.id}`}
                      className={`group relative rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col justify-between ${
                        isLead
                          ? 'bg-gradient-to-b from-amber-500/10 via-slate-900 to-slate-900 border-amber-500/50 shadow-xl shadow-amber-500/10 ring-1 ring-amber-500/30'
                          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:shadow-xl hover:shadow-black/40'
                      }`}
                    >
                      {/* Image Type Photo Header */}
                      <div className="relative h-60 w-full overflow-hidden bg-slate-950">
                        <img
                          src={avatar}
                          alt={displayName}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        />
                        {/* Gradient overlay for text contrast */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-black/30" />

                        {/* Top-left badge: Lead or Role */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          {isLead ? (
                            <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1 uppercase tracking-wider font-mono">
                              <Star className="w-3 h-3 fill-slate-950 text-slate-950" />
                              COMPANY LEAD
                            </span>
                          ) : (
                            <span className="bg-slate-950/80 backdrop-blur-md border border-slate-700 text-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase">
                              {member.role.replace('_', ' ')}
                            </span>
                          )}
                        </div>

                        {/* Top-right badge: Active Status */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                          <span className="bg-emerald-950/80 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            ACTIVE
                          </span>
                        </div>

                        {/* Quick Camera Change-Photo Button on Image */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPhotoMember(member);
                            setPhotoModalUrl(avatar);
                          }}
                          className="absolute bottom-3 right-3 p-2 rounded-xl bg-slate-950/80 hover:bg-amber-500 text-slate-200 hover:text-slate-950 backdrop-blur-md border border-white/20 transition shadow-lg flex items-center gap-1 text-[11px] font-medium opacity-90 group-hover:opacity-100"
                          title="Change employee profile picture"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline text-[10px] font-bold">Change Image</span>
                        </button>

                        {/* ID Badge Pill bottom-left on Image */}
                        <div className="absolute bottom-3 left-3">
                          <span className="bg-slate-950/80 backdrop-blur-md border border-white/10 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded-md">
                            {empBadgeCode}
                          </span>
                        </div>
                      </div>

                      {/* Card Body & Details */}
                      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <h4 className="text-base font-bold text-white flex items-center gap-1.5 tracking-tight">
                                {displayName}
                                {isLead && <BadgeCheck className="w-4 h-4 text-amber-400 shrink-0" />}
                              </h4>
                              <p className="text-xs font-semibold text-amber-400 mt-0.5">
                                {isLead ? 'Lead / Principal Architect' : member.role.replace('_', ' ').toUpperCase()}
                              </p>
                            </div>
                            {!isLead && (
                              <button
                                id={`btn-remove-member-${member.id}`}
                                type="button"
                                onClick={() => handleRemoveTeamMember(member.id, member.name, member.role)}
                                className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition shrink-0"
                                title={`Remove ${member.name} from company employees`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-2 line-clamp-1">
                            <Briefcase className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate">{department}</span>
                          </p>
                        </div>

                        {/* Contact Information & Action Bar */}
                        <div className="pt-3 border-t border-slate-800/80 space-y-2">
                          <div className="flex flex-col gap-1 text-[11px] font-mono">
                            <a
                              href={`mailto:${member.email}`}
                              className="text-slate-400 hover:text-amber-300 flex items-center gap-1.5 truncate transition"
                              title={member.email}
                            >
                              <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="truncate">{member.email}</span>
                            </a>
                            <a
                              href={`tel:${phone}`}
                              className="text-slate-400 hover:text-amber-300 flex items-center gap-1.5 truncate transition"
                            >
                              <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                              <span>{phone}</span>
                            </a>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px]">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPhotoMember(member);
                                setPhotoModalUrl(avatar);
                              }}
                              className="text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1 hover:underline"
                            >
                              <Camera className="w-3 h-3" />
                              <span>Update Photo</span>
                            </button>
                            <span className="text-slate-500 font-mono">
                              Verified ID
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Change Photo Modal */}
          {editingPhotoMember && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        Update Photo: {editingPhotoMember.name}
                      </h4>
                      <p className="text-[11px] text-slate-400">Set professional portrait image for ID card</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingPhotoMember(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Photo Preview in Modal */}
                <div className="flex justify-center">
                  <div className="relative w-32 h-36 rounded-2xl overflow-hidden border-2 border-amber-500 shadow-xl bg-slate-950">
                    <img
                      src={photoModalUrl}
                      alt="Selected Preview"
                      className="w-full h-full object-cover object-top"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[10px] text-center font-mono py-0.5 text-amber-300">
                      PREVIEW
                    </div>
                  </div>
                </div>

                {/* Actions: Upload or Select Preset */}
                <div className="space-y-3">
                  <label className="cursor-pointer flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md">
                    <Upload className="w-4 h-4" />
                    <span>Upload Image from Device</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageFileUpload(e, true)}
                      className="hidden"
                    />
                  </label>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-mono text-slate-400 uppercase">
                      Or Choose from Preset Portraits:
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {PRESET_PORTRAITS.map((p, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setPhotoModalUrl(p.url)}
                          className={`relative h-14 rounded-lg overflow-hidden border-2 transition ${
                            photoModalUrl === p.url
                              ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105'
                              : 'border-slate-800 opacity-70 hover:opacity-100 hover:border-slate-600'
                          }`}
                        >
                          <img
                            src={p.url}
                            alt={p.label}
                            className="w-full h-full object-cover object-top"
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-mono text-slate-400 uppercase">
                      Or Paste Image URL:
                    </label>
                    <input
                      type="url"
                      value={photoModalUrl}
                      onChange={(e) => setPhotoModalUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingPhotoMember(null)}
                    className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateEmployeeAvatar(editingPhotoMember.id, photoModalUrl)}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md shadow-amber-500/20"
                  >
                    Save Photo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Social Media & Showcase Hub (Photo & Video Upload, Channels & Ads) */}
      {activeTab === 'social' && (
        <SocialMediaStudio
          activeProject={activeProject}
          onOpenWorkflowEngine={onOpenWorkflowEngine}
        />
      )}

      {/* Tab: PG & Co-Living Section */}
      {activeTab === 'pg_listing' && (
        <div className="space-y-4">
          <PgHousePropertyListingSection
            project={activeProject}
            onUpdateProject={onUpdateProject}
            currency={currency || activeProject.currency || 'INR'}
            mode="pg"
          />
        </div>
      )}

      {/* Tab: Rent House & Flats Section */}
      {activeTab === 'rent_house_listing' && (
        <div className="space-y-4">
          <PgHousePropertyListingSection
            project={activeProject}
            onUpdateProject={onUpdateProject}
            currency={currency || activeProject.currency || 'INR'}
            mode="rent_house"
          />
        </div>
      )}
    </div>
  );
};
