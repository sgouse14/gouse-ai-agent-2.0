import React from 'react';
import { Project } from '../types';
import { SocialMediaStudio } from './SocialMediaStudio';
import { ArrowLeft, Film, Compass, Sparkles, Building, Video, Camera } from 'lucide-react';

export interface SocialMediaHubPageProps {
  activeProject: Project;
  projects?: Project[];
  onSelectProject?: (id: string) => void;
  onClose: () => void;
  onOpenWorkflowEngine?: () => void;
}

export const SocialMediaHubPage: React.FC<SocialMediaHubPageProps> = ({
  activeProject,
  projects = [activeProject],
  onSelectProject,
  onClose,
  onOpenWorkflowEngine,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Sticky Top Navigation Header */}
      <header className="bg-slate-950/95 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 text-xs font-semibold transition group whitespace-nowrap shrink-0"
              title="Return to Main Portal"
            >
              <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Portal</span>
            </button>

            <div className="h-5 w-px bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-amber-300">
                <Film className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm sm:text-base tracking-tight">
                    REALSTATE MEDIA
                  </span>
                  <span className="text-xs font-medium text-amber-300 hidden sm:inline">
                    · Instagram &amp; Facebook Studio
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden md:block">
                  Real Estate · Architects · Builders · Material Suppliers · Clients — Post Projects &amp; Reviews
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Project Selector */}
            {projects.length > 1 && onSelectProject && (
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1">
                <Building className="w-3.5 h-3.5 text-amber-300" />
                <select
                  value={activeProject.id}
                  onChange={(e) => onSelectProject(e.target.value)}
                  className="bg-transparent text-xs text-white font-medium focus:outline-none"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {onOpenWorkflowEngine && (
              <button
                type="button"
                onClick={onOpenWorkflowEngine}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-semibold text-xs transition whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Workflow Engine</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-semibold text-xs transition whitespace-nowrap shrink-0"
            >
              Close Hub
            </button>
          </div>
        </div>
      </header>

      {/* Main Studio Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <SocialMediaStudio
          activeProject={activeProject}
          onOpenWorkflowEngine={onOpenWorkflowEngine}
        />
      </main>
    </div>
  );
};
