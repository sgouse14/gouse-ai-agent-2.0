import React from 'react';
import {
  Compass,
  ShieldCheck,
  Wifi,
  WifiOff,
  FolderKanban,
  Coins,
  Palette,
} from 'lucide-react';
import { Project } from '../types';
import { CurrencyCode } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';
import { UserSettingsModal } from './UserSettingsModal';

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
  const { currentTheme, isSettingsOpen, setIsSettingsOpen } = useTheme();

  return (
    <>
      <header
        id="app-header"
        className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-40 px-4 lg:px-8 py-3 transition-colors"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center shadow-sm shrink-0 transition-colors"
            style={{
              backgroundColor: `rgba(${currentTheme.rgb}, 0.12)`,
              borderColor: `rgba(${currentTheme.rgb}, 0.35)`,
              borderWidth: '1px',
              color: currentTheme.colors['400'],
            }}
          >
            <Compass className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg sm:text-xl font-bold tracking-tight text-white font-serif-classic">
                GOUSE AI
              </span>
              <span
                className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-semibold transition-colors"
                style={{
                  backgroundColor: `rgba(${currentTheme.rgb}, 0.15)`,
                  borderColor: `rgba(${currentTheme.rgb}, 0.35)`,
                  color: currentTheme.colors['300'],
                }}
              >
                v3.8 ArchAgent
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Architecture &amp; Construction Intelligence Workspace
            </p>
          </div>
        </div>

        {/* Project Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Active project quick-switch */}
          <div className="flex items-center gap-1.5 bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
            <FolderKanban
              className="w-4 h-4 shrink-0 transition-colors"
              style={{ color: currentTheme.colors['400'] }}
            />
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

          {/* User Settings & Accent Color Menu Button */}
          <button
            id="btn-open-user-settings"
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition group"
            title="Open Workspace Settings & Architectural Accent Theme"
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm transition-transform group-hover:scale-110"
              style={{
                backgroundColor: currentTheme.colors['500'],
                boxShadow: `0 0 6px rgba(${currentTheme.rgb}, 0.5)`,
              }}
            />
            <Palette className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200" />
            <span className="hidden sm:inline font-medium">{currentTheme.name}</span>
          </button>

          {/* License Status */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-700/40 text-emerald-400 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>License: Pro</span>
          </div>

          {/* Network Status */}
          <div
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono border ${
              isOnline
                ? 'bg-slate-950/70 border-slate-800 text-emerald-400'
                : 'bg-red-950/40 border-red-800 text-red-400'
            }`}
            title={isOnline ? 'Connected to AI Architecture Services' : 'Offline Mode'}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </div>
    </header>

    <UserSettingsModal
      isOpen={isSettingsOpen}
      onClose={() => setIsSettingsOpen(false)}
    />
  </>
);
};
