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
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 text-xs font-semibold transition group shadow-sm"
              title="Return to Main Portal"
            >
              <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Portal</span>
            </button>

            <div className="h-5 w-px bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-md shadow-rose-500/25">
                <Film className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-white text-base tracking-tight">
                    SOCIAL &amp; MEDIA HUB
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    PHOTOS &amp; VIDEOS
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono tracking-tight hidden md:block">
                  Centralized 4K Renders • Drone Reels • Lumion Walkthroughs • AI Copywriting
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Project Selector */}
            {projects.length > 1 && onSelectProject && (
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1">
                <Building className="w-3.5 h-3.5 text-rose-400" />
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Workflow Engine</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition"
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
