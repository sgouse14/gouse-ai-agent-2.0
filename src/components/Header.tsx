import React, { useState, useRef, useEffect } from 'react';
import {
  Compass,
  ShieldCheck,
  Wifi,
  WifiOff,
  FolderKanban,
  Coins,
  Palette,
  Zap,
  Mic,
  Sparkles,
  Camera,
  LogIn,
  LogOut,
  User,
  UserPlus,
  ChevronDown,
  Check,
  Building,
  Award,
} from 'lucide-react';
import { Project, UserRole } from '../types';
import { CurrencyCode } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { UserSettingsModal } from './UserSettingsModal';
import { ProfileEditorModal } from './ProfileEditorModal';

interface HeaderProps {
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (id: string) => void;
  currency: CurrencyCode;
  onChangeCurrency: (c: CurrencyCode) => void;
  isOnline: boolean;
  onOpenWorkflowEngine?: () => void;
  onToggleVoiceListener?: () => void;
  isVoiceListening?: boolean;
  onOpenSiteCamera?: () => void;
  onViewClientPage?: () => void;
  onOpenPlatformDemo?: () => void;
  onViewClientView?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  projects,
  activeProject,
  onSelectProject,
  currency,
  onChangeCurrency,
  isOnline,
  onOpenWorkflowEngine,
  onToggleVoiceListener,
  isVoiceListening,
  onOpenSiteCamera,
  onViewClientPage,
  onOpenPlatformDemo,
  onViewClientView,
}) => {
  const { currentTheme, isSettingsOpen, setIsSettingsOpen } = useTheme();
  const {
    user,
    isAuthenticated,
    users,
    logout,
    switchUser,
    openLoginModal,
    openSignUpModal,
    setIsProfileEditorOpen,
  } = useAuth();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header
        id="app-header"
        className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-40 transition-colors shadow-md px-4 lg:px-8 py-3"
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
                GOUSE AI AGENT
              </span>
              <span
                className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-semibold transition-colors"
                style={{
                  backgroundColor: `rgba(${currentTheme.rgb}, 0.15)`,
                  borderColor: `rgba(${currentTheme.rgb}, 0.35)`,
                  color: currentTheme.colors['300'],
                }}
              >
                AI Agent Studio
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Architecture &amp; Construction Intelligence
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

          {/* Gouse AI Agent Engine Button */}
          {onOpenWorkflowEngine && (
            <button
              id="btn-header-open-workflow-engine"
              type="button"
              onClick={onOpenWorkflowEngine}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 via-emerald-500/15 to-slate-950 hover:from-amber-500/30 hover:via-emerald-500/25 text-xs font-bold text-amber-300 border border-amber-500/40 shadow-sm transition"
              title="Open Gouse AI Agent (Automated CAD Analysis & BOQ Engine - Rating 9.8/10)"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Gouse AI Agent</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                9.8/10
              </span>
            </button>
          )}

          {/* Site Visit Camera Button */}
          {onOpenSiteCamera && (
            <button
              id="btn-header-site-camera"
              type="button"
              onClick={onOpenSiteCamera}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-slate-950 hover:from-amber-500/30 hover:via-yellow-500/25 text-xs font-bold text-amber-300 border border-amber-500/40 shadow-sm transition"
              title="Open Site Visit Camera & Snap Photos for AI Visual Progress Audit"
            >
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Site Visit Camera</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                AI AUDIT
              </span>
            </button>
          )}

          {/* Global Voice Command Microphone Button */}
          {onToggleVoiceListener && (
            <button
              id="btn-header-voice-command"
              type="button"
              onClick={onToggleVoiceListener}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${
                isVoiceListening
                  ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-purple-500/30 border border-purple-400 animate-pulse'
                  : 'bg-slate-950/80 hover:bg-slate-800 border border-indigo-500/30 hover:border-indigo-400 text-indigo-300 hover:text-white shadow-xs'
              }`}
              title={isVoiceListening ? 'Gemini Live Listening... Click to stop (Alt+V)' : 'Activate Gemini Live Voice Assistant (Alt+V)'}
            >
              <Sparkles className={`w-3.5 h-3.5 ${isVoiceListening ? 'animate-spin text-white' : 'text-indigo-400'}`} />
              <span className="hidden md:inline font-mono">
                {isVoiceListening ? 'Gemini Live' : 'Gemini Voice'}
              </span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                  isVoiceListening
                    ? 'bg-black/40 text-white'
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                }`}
              >
                Alt+V
              </span>
            </button>
          )}

          {/* Client Portal View Button */}
          {onViewClientPage && (
            <button
              id="btn-view-client-portal"
              type="button"
              onClick={onViewClientPage}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition"
              title="View the public Client Page / Portal landing view"
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Client Page</span>
            </button>
          )}

          {/* Platform Demo Presentation Button */}
          {onOpenPlatformDemo && (
            <button
              id="btn-open-platform-demo"
              type="button"
              onClick={onOpenPlatformDemo}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition"
              title="Open the interactive Platform Demo & Client Presentation"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Platform Demo</span>
            </button>
          )}

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

          {/* User Authentication Pill / Menu */}
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                id="btn-user-profile-menu"
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 transition group shadow-sm"
                title={`Signed in as ${user.name} (${user.role}) - Click for Account & Persona Switcher`}
              >
                <div className="relative">
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover border border-slate-700 group-hover:border-amber-400/60 transition"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-slate-950" />
                </div>
                <div className="text-left hidden sm:block">
                  <div className="font-semibold text-white leading-tight text-[11px] truncate max-w-[110px]">
                    {user.name}
                  </div>
                  <div className="text-[9px] text-amber-400 font-mono capitalize leading-none">
                    {user.role === 'owner' ? 'Principal' : user.role === 'structural_engineer' ? 'Structural' : user.role === 'quantity_surveyor' ? 'QS Lead' : user.role}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-200 transition ml-0.5" />
              </button>

              {/* User Profile Dropdown Menu */}
              {isUserMenuOpen && (
                <div
                  id="dropdown-user-profile"
                  className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl z-50 p-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  {/* Active User Card */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <div className="flex items-start gap-2.5">
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-white text-xs truncate flex items-center gap-1.5">
                          <span>{user.name}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Active
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                        <div className="text-[10px] text-amber-400 font-mono mt-0.5 capitalize">
                          {user.role === 'owner' ? 'Principal Architect & Studio Director' : user.role}
                        </div>
                      </div>
                    </div>

                    {(user.company || user.licenseNumber) && (
                      <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 space-y-0.5 font-mono">
                        {user.company && (
                          <div className="flex items-center gap-1 truncate text-slate-300">
                            <Building className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate">{user.company}</span>
                          </div>
                        )}
                        {user.licenseNumber && (
                          <div className="flex items-center gap-1 truncate text-amber-300/90">
                            <Award className="w-3 h-3 text-amber-400/80 shrink-0" />
                            <span className="truncate">{user.licenseNumber}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Switch Team Persona */}
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1.5 px-1 flex items-center justify-between">
                      <span>Switch Team Persona</span>
                      <span className="text-[9px] text-slate-500">Fast testing</span>
                    </div>

                    <div className="space-y-1 max-h-40 overflow-y-auto scrollbar-thin">
                      {users.map((u) => {
                        const isCurrent = u.id === user.id;
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              switchUser(u.id);
                              setIsUserMenuOpen(false);
                            }}
                            className={`w-full text-left p-1.5 rounded-lg text-xs flex items-center gap-2 transition ${
                              isCurrent
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                            }`}
                          >
                            <img
                              src={u.avatarUrl}
                              alt={u.name}
                              className="w-6 h-6 rounded-md object-cover border border-slate-700 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium truncate text-[11px]">{u.name}</div>
                              <div className="text-[9px] text-slate-500 capitalize leading-none">
                                {u.role === 'owner' ? 'Principal' : u.role}
                              </div>
                            </div>
                            {isCurrent && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dropdown Action Buttons */}
                  <div className="pt-2 border-t border-slate-800 space-y-1 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileEditorOpen(true);
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition flex items-center gap-2"
                    >
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Edit Profile Credentials</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        openLoginModal();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition flex items-center gap-2"
                    >
                      <LogIn className="w-3.5 h-3.5 text-slate-400" />
                      <span>Sign In with Another Account</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        openSignUpModal();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition flex items-center gap-2"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-slate-400" />
                      <span>Create New Account</span>
                    </button>

                    {onViewClientPage && (
                      <button
                        type="button"
                        onClick={() => {
                          onViewClientPage();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-amber-300 hover:text-amber-200 transition flex items-center gap-2"
                      >
                        <Compass className="w-3.5 h-3.5 text-amber-400" />
                        <span>View Client Portal Page</span>
                      </button>
                    )}

                    {onOpenPlatformDemo && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenPlatformDemo();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-emerald-300 hover:text-emerald-200 transition flex items-center gap-2"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>View Platform Demo Presentation</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 transition flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                id="btn-header-login"
                type="button"
                onClick={openLoginModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-white transition shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-400" />
                <span>Sign In</span>
              </button>

              <button
                id="btn-header-signup"
                type="button"
                onClick={openSignUpModal}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </button>
            </div>
          )}

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

    <ProfileEditorModal />
  </>
);
};
