import React, { useState, useRef, useEffect } from 'react';
import {
  Compass,
  Building2,
  Calculator,
  Layers,
  Sparkles,
  Store,
  Home,
  Image as ImageIcon,
  Workflow,
  Camera,
  Palette,
  FolderKanban,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  LogIn,
  LogOut,
  User,
  UserPlus,
  Check,
  Presentation,
  LayoutDashboard,
  X,
  Wand2,
  Cpu,
  AudioWaveform,
} from 'lucide-react';
import { TabType } from './Navigation';
import { StudioToolkitTab } from './StudioToolkitModal';
import { Project } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  projects: Project[];
  activeProject: Project;
  onSelectProject: (id: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenWorkflowEngine: () => void;
  onOpenSiteCamera: () => void;
  onOpenPlatformDemo: () => void;
  onOpenClientPortal: () => void;
  onOpenStudioToolkit?: (tab?: StudioToolkitTab) => void;
  onOpenNaturalVoiceChat?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  projects,
  activeProject,
  onSelectProject,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  onOpenWorkflowEngine,
  onOpenSiteCamera,
  onOpenPlatformDemo,
  onOpenClientPortal,
  onOpenStudioToolkit,
  onOpenNaturalVoiceChat,
}) => {
  const { currentTheme, setIsSettingsOpen } = useTheme();
  const {
    user,
    users,
    switchUser,
    logout,
    openLoginModal,
    openSignUpModal,
    setIsProfileEditorOpen,
  } = useAuth();

  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const primaryNav: Array<{ id: TabType; label: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }> = [
    { id: 'projects', label: 'Projects', icon: Building2 },
    { id: 'boq', label: 'BOQ & Estimation', icon: Calculator },
    { id: 'materials', label: 'Materials & Rates', icon: Layers },
    { id: 'specialist', label: 'Gouse AI Super Agent', icon: Sparkles },
    { id: 'marketplace', label: 'Marketplace', icon: Store },
  ];

  const portfolioNav: Array<{ id: TabType; label: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }> = [
    { id: 'broker', label: 'Property & Brokerage', icon: Home },
    { id: 'social', label: 'Realstate Media', icon: ImageIcon },
  ];

  const handleSelectNav = (tab: TabType) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const formatRole = (role?: string) => {
    switch (role) {
      case 'owner':
        return 'Principal Architect';
      case 'architect':
        return 'Senior Architect';
      case 'structural_engineer':
        return 'Structural Engineer';
      case 'quantity_surveyor':
        return 'Quantity Surveyor';
      case 'contractor':
        return 'EPC Contractor';
      case 'property_owner':
        return 'Property Owner';
      case 'broker_agent':
        return 'Real Estate Broker';
      case 'client':
        return 'Client Stakeholder';
      default:
        return role || 'Studio Member';
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-200 select-none">
      {/* Brand Row */}
      <div className="h-14 px-4 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
        <button
          type="button"
          onClick={() => handleSelectNav('projects')}
          className="flex items-center gap-2.5 min-w-0 text-left focus:outline-none"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: `rgba(${currentTheme.rgb}, 0.12)`,
              borderColor: `rgba(${currentTheme.rgb}, 0.32)`,
              color: currentTheme.colors['400'],
            }}
          >
            <Compass className="w-4 h-4 stroke-[2.2]" />
          </div>
          {!isCollapsed && (
            <span className="text-base font-bold tracking-tight text-white whitespace-nowrap truncate">
              Gouse AI
            </span>
          )}
        </button>

        {/* Desktop collapse toggle */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close navigation"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Active Project Selector */}
      {!isCollapsed && (
        <div className="px-3 py-3 border-b border-slate-800/80 shrink-0">
          <label
            htmlFor="sidebar-project-selector"
            className="block text-[11px] font-medium text-slate-400 mb-1.5 px-1"
          >
            Active project
          </label>
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2">
            <FolderKanban
              className="w-4 h-4 shrink-0"
              style={{ color: currentTheme.colors['400'] }}
            />
            <select
              id="sidebar-project-selector"
              value={activeProject?.id || ''}
              onChange={(e) => onSelectProject(e.target.value)}
              className="w-full bg-transparent border-0 text-xs font-medium text-slate-100 focus:ring-0 focus:outline-none cursor-pointer truncate"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-100">
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Architecture & Cost Engineering */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-2.5 pb-1 text-[11px] font-medium text-slate-500">
              Architecture &amp; Costing
            </div>
          )}
          {primaryNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                type="button"
                onClick={() => handleSelectNav(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap ${
                  isCollapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${isActive ? '' : 'text-slate-400'}`}
                  style={isActive ? { color: currentTheme.colors['400'] } : undefined}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Real Estate & Showcase */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-2.5 pb-1 text-[11px] font-medium text-slate-500">
              Property &amp; Showcase
            </div>
          )}
          {portfolioNav.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.id === 'broker'
                ? activeTab === 'broker' || activeTab === 'pg_coliving' || activeTab === 'rent_house'
                : activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                type="button"
                onClick={() => handleSelectNav(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap ${
                  isCollapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${isActive ? '' : 'text-slate-400'}`}
                  style={isActive ? { color: currentTheme.colors['400'] } : undefined}
                />
                {!isCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Studio Tools */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-2.5 pb-1 text-[11px] font-medium text-slate-500">
              Studio Utilities
            </div>
          )}
          {onOpenNaturalVoiceChat && (
            <button
              id="btn-sidebar-natural-voice"
              type="button"
              onClick={() => {
                onOpenNaturalVoiceChat();
                onCloseMobile();
              }}
              title={isCollapsed ? 'Natural Voice Chat' : undefined}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors whitespace-nowrap ${
                isCollapsed ? 'justify-center' : ''
              }`}
            >
              <AudioWaveform className="w-4 h-4 shrink-0 text-emerald-400" />
              {!isCollapsed && <span className="truncate">Natural Voice Chat</span>}
            </button>
          )}
          {onOpenStudioToolkit && (
            <>
              <button
                id="btn-sidebar-studio-toolkit"
                type="button"
                onClick={() => {
                  onOpenStudioToolkit('render');
                  onCloseMobile();
                }}
                title={isCollapsed ? 'Studio Toolkit Hub' : undefined}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-colors whitespace-nowrap ${
                  isCollapsed ? 'justify-center' : ''
                }`}
              >
                <Wand2 className="w-4 h-4 shrink-0 text-amber-400" />
                {!isCollapsed && <span className="truncate">Studio Toolkit Hub</span>}
              </button>

              <button
                id="btn-sidebar-smart-building"
                type="button"
                onClick={() => {
                  onOpenStudioToolkit('smart_building');
                  onCloseMobile();
                }}
                title={isCollapsed ? 'Smart Building (SKA IoT)' : undefined}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-colors whitespace-nowrap ${
                  isCollapsed ? 'justify-center' : ''
                }`}
              >
                <Cpu className="w-4 h-4 shrink-0 text-cyan-400" />
                {!isCollapsed && <span className="truncate">Smart Building (SKA IoT)</span>}
              </button>
            </>
          )}

          <button
            id="btn-sidebar-workflow-engine"
            type="button"
            onClick={() => {
              onOpenWorkflowEngine();
              onCloseMobile();
            }}
            title={isCollapsed ? 'CAD Workflow Engine' : undefined}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-colors whitespace-nowrap ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <Workflow className="w-4 h-4 shrink-0 text-slate-400" />
            {!isCollapsed && <span className="truncate">CAD Workflow Engine</span>}
          </button>

          <button
            id="btn-sidebar-site-camera"
            type="button"
            onClick={() => {
              onOpenSiteCamera();
              onCloseMobile();
            }}
            title={isCollapsed ? 'Site Inspection Camera' : undefined}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-colors whitespace-nowrap ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <Camera className="w-4 h-4 shrink-0 text-slate-400" />
            {!isCollapsed && <span className="truncate">Site Camera Audit</span>}
          </button>

          <button
            id="btn-sidebar-client-portal"
            type="button"
            onClick={() => {
              onOpenClientPortal();
              onCloseMobile();
            }}
            title={isCollapsed ? 'Client Portal' : undefined}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-colors whitespace-nowrap ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0 text-slate-400" />
            {!isCollapsed && <span className="truncate">Client Portal</span>}
          </button>

          <button
            id="btn-sidebar-platform-demo"
            type="button"
            onClick={() => {
              onOpenPlatformDemo();
              onCloseMobile();
            }}
            title={isCollapsed ? 'Platform Overview' : undefined}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-colors whitespace-nowrap ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <Presentation className="w-4 h-4 shrink-0 text-slate-400" />
            {!isCollapsed && <span className="truncate">Platform Overview</span>}
          </button>
        </div>
      </div>

      {/* Footer Utilities & Account */}
      <div className="p-3 border-t border-slate-800 space-y-2 shrink-0" ref={accountMenuRef}>
        <button
          id="btn-open-user-settings"
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          title={isCollapsed ? 'Appearance & Theme' : undefined}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors whitespace-nowrap ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <Palette className="w-4 h-4 shrink-0 text-slate-400" />
          {!isCollapsed && <span className="truncate">Appearance · {currentTheme.name}</span>}
        </button>

        {user ? (
          <div className="relative">
            <button
              id="btn-user-profile-menu"
              type="button"
              onClick={() => setIsAccountMenuOpen((prev) => !prev)}
              className={`w-full flex items-center gap-2.5 p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors text-left ${
                isCollapsed ? 'justify-center' : ''
              }`}
            >
              <img
                src={user.avatarUrl}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-lg object-cover border border-slate-700 shrink-0"
              />
              {!isCollapsed && (
                <>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-white truncate">{user.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{formatRole(user.role)}</div>
                  </div>
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </>
              )}
            </button>

            {isAccountMenuOpen && (
              <div
                id="dropdown-user-profile"
                className="absolute bottom-full left-0 mb-2 w-64 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-50 p-2.5 space-y-2"
              >
                <div className="px-2 py-1.5 border-b border-slate-800">
                  <div className="text-xs font-semibold text-white truncate">{user.name}</div>
                  <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                </div>

                <div>
                  <div className="px-2 py-1 text-[11px] font-medium text-slate-500">
                    Switch role profile
                  </div>
                  <div className="space-y-0.5 max-h-36 overflow-y-auto">
                    {users.map((u) => {
                      const isCurrent = u.id === user.id;
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            switchUser(u.id);
                            setIsAccountMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-left transition-colors ${
                            isCurrent
                              ? 'bg-slate-800 text-white'
                              : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                          }`}
                        >
                          <img
                            src={u.avatarUrl}
                            alt={u.name}
                            referrerPolicy="no-referrer"
                            className="w-5 h-5 rounded object-cover shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">{u.name}</div>
                          </div>
                          {isCurrent && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-1.5 border-t border-slate-800 space-y-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileEditorOpen(true);
                      setIsAccountMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Edit Credentials</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      openLoginModal();
                      setIsAccountMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5 text-slate-400" />
                    <span>Switch Account</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setIsAccountMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={`flex gap-2 ${isCollapsed ? 'flex-col' : ''}`}>
            <button
              id="btn-header-login"
              type="button"
              onClick={openLoginModal}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-400" />
              {!isCollapsed && <span>Sign In</span>}
            </button>
            {!isCollapsed && (
              <button
                id="btn-header-signup"
                type="button"
                onClick={openSignUpModal}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition-colors whitespace-nowrap"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 sticky top-0 h-screen transition-all duration-200 z-30 ${
          isCollapsed ? 'w-[72px]' : 'w-[260px]'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative w-[272px] max-w-[85vw] h-full z-10 shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
