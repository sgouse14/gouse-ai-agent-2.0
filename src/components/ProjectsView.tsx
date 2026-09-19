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
  AlertCircle
} from 'lucide-react';
import { Project, ProjectFile, AnalysisReport, TeamMember, AuditEvent } from '../types';
import { formatDate } from '../utils/formatters';

interface ProjectsViewProps {
  projects: Project[];
  activeProject: Project;
  onSelectProject: (id: string) => void;
  onUpdateProject: (updated: Project) => void;
  onCreateProject: (newProj: Partial<Project>) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onUpdateProject,
  onCreateProject,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'intelligence' | 'team'>('intelligence');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectType, setNewProjectType] = useState('Residential Architecture');
  const [newLocation, setNewLocation] = useState('');
  const [newArea, setNewArea] = useState<number>(3500);
  const [newDescription, setNewDescription] = useState('');

  // Intelligence audit state
  const [auditFocus, setAuditFocus] = useState('Comprehensive Architectural & Technical Audit');
  const [isRunningIntelligence, setIsRunningIntelligence] = useState(false);
  const [intelligenceError, setIntelligenceError] = useState<string | null>(null);

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

  const handleRunIntelligence = async () => {
    setIsRunningIntelligence(true);
    setIntelligenceError(null);

    try {
      const filesText = activeProject.files
        .map((f) => `FILE: ${f.name}\n${f.extractedText || ''}`)
        .join('\n\n');

      const res = await fetch('/api/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: activeProject.name,
          projectType: activeProject.projectType,
          description: activeProject.description,
          focus: auditFocus,
          filesText,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to run intelligence audit');
      }

      const data = await res.json();

      const newReport: AnalysisReport = {
        id: `analysis-${Date.now()}`,
        title: data.title || `Intelligence Audit: ${auditFocus}`,
        analysis: data.analysis,
        timestamp: new Date().toISOString(),
        focus: auditFocus,
      };

      const updatedProject: Project = {
        ...activeProject,
        analyses: [newReport, ...activeProject.analyses],
        auditLogs: [
          {
            id: `log-${Date.now()}`,
            projectId: activeProject.id,
            actor: 'Ar. Gouse',
            action: 'AI Intelligence Audit Run',
            details: `Completed "${auditFocus}" report`,
            timestamp: new Date().toISOString(),
          },
          ...activeProject.auditLogs,
        ],
      };

      onUpdateProject(updatedProject);
    } catch (err: any) {
      setIntelligenceError(err.message || 'Error running intelligence audit');
    } finally {
      setIsRunningIntelligence(false);
    }
  };

  const handleAttachFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attachedFileName.trim()) return;

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
      files: [newFile, ...activeProject.files],
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          projectId: activeProject.id,
          actor: 'Ar. Gouse',
          action: 'File Attached',
          details: `Attached document: ${newFile.name}`,
          timestamp: new Date().toISOString(),
        },
        ...activeProject.auditLogs,
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

    const newMember: TeamMember = {
      id: `mem-${Date.now()}`,
      name: newMemberName.trim(),
      email: newMemberEmail.trim(),
      role: newMemberRole,
    };

    const updatedProject: Project = {
      ...activeProject,
      members: [...activeProject.members, newMember],
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          projectId: activeProject.id,
          actor: 'Ar. Gouse',
          action: 'Team Member Added',
          details: `Added ${newMember.name} as ${newMember.role.replace('_', ' ')}`,
          timestamp: new Date().toISOString(),
        },
        ...activeProject.auditLogs,
      ],
    };

    onUpdateProject(updatedProject);
    setNewMemberName('');
    setNewMemberEmail('');
    setIsAddingMember(false);
  };

  const handleRemoveTeamMember = (memberId: string, memberName: string, memberRole: string) => {
    const updatedProject: Project = {
      ...activeProject,
      members: activeProject.members.filter((m) => m.id !== memberId),
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          projectId: activeProject.id,
          actor: 'Ar. Gouse',
          action: 'Team Member Removed',
          details: `Removed ${memberName} (${memberRole.replace('_', ' ')}) from project team`,
          timestamp: new Date().toISOString(),
        },
        ...activeProject.auditLogs,
      ],
    };

    onUpdateProject(updatedProject);
  };

  const handleAddAuditLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuditAction.trim() || !newAuditDetails.trim()) return;

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
      auditLogs: [newLog, ...activeProject.auditLogs],
    };

    onUpdateProject(updatedProject);
    setNewAuditAction('');
    setNewAuditDetails('');
    setIsAddingAuditLog(false);
  };

  const handleRemoveAuditLog = (logId: string) => {
    const updatedProject: Project = {
      ...activeProject,
      auditLogs: activeProject.auditLogs.filter((log) => log.id !== logId),
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

      {/* Project Sub-tabs */}
      <div className="border-b border-slate-800 flex items-center gap-1 sm:gap-2">
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
          <span>AI Intelligence Reports ({activeProject.analyses.length})</span>
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
          <span>Drawings & Specifications ({activeProject.files.length})</span>
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
          <span>Team & Audit Trail ({activeProject.members.length})</span>
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

          {intelligenceError && (
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{intelligenceError}</span>
            </div>
          )}

          {/* Reports list */}
          {activeProject.analyses.length === 0 ? (
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
              {activeProject.analyses.map((report) => (
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

          {activeProject.files.length === 0 ? (
            <div className="text-center py-10 rounded-xl border border-dashed border-slate-800 bg-slate-900/30">
              <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No drawings or specifications attached to this project yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeProject.files.map((file) => (
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
                Team Members ({activeProject.members.length})
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
            {activeProject.members.length === 0 ? (
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
                {activeProject.members.map((member) => (
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
                Activity Audit Trail ({activeProject.auditLogs.length})
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

                {activeProject.auditLogs.length > 0 && (
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
            {activeProject.auditLogs.length === 0 ? (
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
                {activeProject.auditLogs.map((log) => (
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
                {activeProject.files.length}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400">Intelligence Audits</span>
              <p className="text-xl font-bold font-mono text-amber-400 mt-1">
                {activeProject.analyses.length}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400">Project Team Size</span>
              <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
                {activeProject.members.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
