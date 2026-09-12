import React from 'react';
import { Compass, ShieldCheck, Wifi, WifiOff, FolderKanban, Coins } from 'lucide-react';
import { Project } from '../types';
import { CurrencyCode } from '../utils/formatters';

interface HeaderProps {
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (id: string) => void;
  currency: CurrencyCode;
  onChangeCurrency: (c: CurrencyCode) => void;
  isOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  projects,
  activeProject,
  onSelectProject,
  currency,
  onChangeCurrency,
  isOnline,
}) => {
  return (
    <header id="app-header" className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40 px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
            <Compass className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-serif-classic">
                GOUSE AI
              </h1>
              <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                v3.8 ArchAgent
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Architecture • Construction • Materials & Intelligence
            </p>
          </div>
        </div>

        {/* Project Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Active project quick-switch */}
          <div className="flex items-center gap-1.5 bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
            <FolderKanban className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400 hidden sm:inline">Project:</span>
            <select
              id="header-project-selector"
              value={activeProject?.id || ''}
              onChange={(e) => onSelectProject(e.target.value)}
              className="bg-transparent border-0 text-white font-medium focus:ring-0 focus:outline-none cursor-pointer pr-1 max-w-[150px] sm:max-w-[200px] truncate"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Currency Switcher */}
          <div className="flex items-center gap-1 bg-slate-950/70 border border-slate-800 rounded-lg px-2 py-1.5 text-xs">
            <Coins className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="header-currency-selector"
              value={currency}
              onChange={(e) => onChangeCurrency(e.target.value as CurrencyCode)}
              className="bg-transparent text-slate-300 font-mono text-xs focus:ring-0 focus:outline-none cursor-pointer"
            >
              <option value="INR" className="bg-slate-900 text-white">₹ INR</option>
              <option value="USD" className="bg-slate-900 text-white">$ USD</option>
              <option value="EUR" className="bg-slate-900 text-white">€ EUR</option>
              <option value="GBP" className="bg-slate-900 text-white">£ GBP</option>
              <option value="AED" className="bg-slate-900 text-white">AED</option>
            </select>
          </div>

          {/* License Status */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-700/40 text-emerald-400 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>License: Pro (183d)</span>
          </div>

          {/* Network Status */}
          <div
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono border ${
              isOnline
                ? 'bg-slate-950/70 border-slate-800 text-emerald-400'
                : 'bg-red-950/40 border-red-800 text-red-400'
            }`}
            title={isOnline ? 'Connected to Gouse AI Services' : 'Offline Mode'}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
