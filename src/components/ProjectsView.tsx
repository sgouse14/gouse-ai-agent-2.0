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
} from 'lucide-react';
import { Project, TeamMember, AuditEvent } from '../types';
import { formatDate, CurrencyCode } from '../utils/formatters';
import { PgHousePropertyListingSection } from './PgHousePropertyListingSection';
import { SocialMediaStudio } from './SocialMediaStudio';

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
  const [activeTab, setActiveTab] = useState<'social' | 'pg_listing' | 'rent_house_listing' | 'team'>('social');
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
      {/* Top action header with project switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs uppercase tracking-wider font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Active Project
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ID: {activeProject.id}
            </span>

            {/* Project Switcher Selector */}
            <div className="flex items-center gap-1.5 ml-0 sm:ml-2">
              <span className="text-xs text-slate-400">Switch:</span>
              <select
                id="select-active-project-dropdown"
                value={activeProject.id}
                onChange={(e) => onSelectProject(e.target.value)}
                className="bg-slate-950 border border-slate-700 hover:border-amber-500/60 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-semibold focus:border-amber-500 focus:outline-none transition cursor-pointer max-w-[220px] sm:max-w-[320px] truncate"
              >
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id} className="bg-slate-900 text-white">
                    {proj.name}
                  </option>
                ))}
              </select>
            </div>
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
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition shadow-sm self-start md:self-center shrink-0"
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
            onClick={() => setActiveTab('social')}
            className={`whitespace-nowrap flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition shrink-0 shadow-sm ${
              activeTab === 'social'
                ? 'bg-sky-500 text-slate-950 border-sky-400'
                : 'border-sky-500/40 bg-gradient-to-r from-pink-500/10 via-slate-900 to-sky-500/10 text-sky-300 hover:bg-slate-800'
            }`}
          >
            <Camera className="h-3.5 w-3.5 text-pink-400" />
            <span>Social &amp; Media Hub (Photos/Videos)</span>
          </button>

          <button
            id="btn-projects-view-pg"
            type="button"
            onClick={() => setActiveTab('pg_listing')}
            className={`whitespace-nowrap flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition shrink-0 shadow-sm ${
              activeTab === 'pg_listing'
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'border-amber-500/40 bg-gradient-to-r from-rose-500/10 via-slate-900 to-amber-500/10 text-amber-300 hover:bg-slate-800'
            }`}
          >
            <Building className="h-3.5 w-3.5 text-amber-400" />
            <span>PG &amp; Co-Living (Beds &amp; Mess)</span>
          </button>

          <button
            id="btn-projects-view-rent-house"
            type="button"
            onClick={() => setActiveTab('rent_house_listing')}
            className={`whitespace-nowrap flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition shrink-0 shadow-sm ${
              activeTab === 'rent_house_listing'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                : 'border-emerald-500/40 bg-gradient-to-r from-teal-500/10 via-slate-900 to-emerald-500/10 text-emerald-300 hover:bg-slate-800'
            }`}
          >
            <Home className="h-3.5 w-3.5 text-emerald-400" />
            <span>Rent House &amp; Flats</span>
          </button>

          {onOpenWorkflowEngine && (
            <button
              id="btn-projects-launch-workflow"
              type="button"
              onClick={onOpenWorkflowEngine}
              className="whitespace-nowrap flex items-center gap-2 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/20 transition shrink-0"
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
            UPLOAD PHOTOS &amp; VIDEOS
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
        </button>
      </div>

      {/* Tab: Company Employee */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                Company Employees ({members.length})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Organizational personnel, engineering disciplines, and project leadership.
              </p>
            </div>
            <button
              id="btn-toggle-add-member"
              type="button"
              onClick={() => setIsAddingMember(!isAddingMember)}
              className="inline-flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition self-start sm:self-auto shadow-sm shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>{isAddingMember ? 'Cancel' : 'Add Employee'}</span>
            </button>
          </div>

          {/* Add Employee Inline Form */}
          {isAddingMember && (
            <form
              id="form-add-team-member"
              onSubmit={handleAddTeamMember}
              className="p-5 rounded-2xl bg-slate-900 border border-amber-500/30 space-y-4 shadow-xl max-w-2xl"
            >
              <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 uppercase font-mono tracking-wider">
                <Plus className="w-3.5 h-3.5" />
                Add New Company Employee
              </div>
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
                    placeholder="e.g. tariq@apexstudio.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
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
              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingMember(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-new-member"
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                >
                  Save Employee
                </button>
              </div>
            </form>
          )}

          {/* Company Employees Cards Grid */}
          {members.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
              <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400 mb-3">No company employees added yet.</p>
              <button
                type="button"
                onClick={() => setIsAddingMember(true)}
                className="text-xs text-amber-400 hover:text-amber-300 underline font-medium"
              >
                + Add First Employee
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member) => {
                const isLead = member.role === 'owner' || 
                  member.name.toLowerCase().includes('gouse') || 
                  member.name.toLowerCase().includes('principal');
                const displayName = isLead ? 'Gouse AI' : member.name;
                return (
                  <div
                    key={member.id}
                    id={`team-member-${member.id}`}
                    className={`p-4 rounded-xl border transition flex flex-col justify-between space-y-3 ${
                      isLead
                        ? 'bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border-amber-500/40 shadow-lg shadow-amber-500/5'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isLead 
                              ? 'bg-amber-500 text-slate-950 font-mono'
                              : 'bg-slate-800 text-amber-400 border border-slate-700'
                          }`}>
                            {isLead ? 'GA' : member.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h5 className="text-xs font-bold text-white truncate">{displayName}</h5>
                              {isLead && (
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  COMPANY LEAD
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono truncate">{member.email}</p>
                          </div>
                        </div>
                        {!isLead && (
                          <button
                            id={`btn-remove-member-${member.id}`}
                            type="button"
                            onClick={() => handleRemoveTeamMember(member.id, member.name, member.role)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition shrink-0"
                            title={`Remove ${member.name} from company employees`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                      <span className="uppercase font-mono text-[10px] px-2 py-0.5 rounded bg-slate-950 text-amber-300 border border-slate-800">
                        {isLead ? 'Lead / Principal' : member.role.replace('_', ' ')}
                      </span>
                      <span className="text-slate-500 text-[10px] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                        Active
                      </span>
                    </div>
                  </div>
                );
              })}
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
