import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Coins,
  ArrowUpRight,
  User,
  LogIn,
  LogOut,
  Edit3,
  Crown,
  ShieldCheck,
  ChevronDown,
  Mail,
  Phone,
  Building2,
} from 'lucide-react';
import { Project } from '../types';
import { CurrencyCode } from '../utils/formatters';
import { TabType } from './Navigation';
import { useTheme } from '../context/ThemeContext';
import { useAuth, isFreeProfile } from '../context/AuthContext';
import { UserSettingsModal } from './UserSettingsModal';
import { ProfileEditorModal } from './ProfileEditorModal';

interface HeaderProps {
  activeTab: TabType;
  activeProject: Project | null;
  currency: CurrencyCode;
  onChangeCurrency: (c: CurrencyCode) => void;
  onOpenMobileMenu: () => void;
  onPrimaryAction?: () => void;
  primaryActionLabel?: string;
}

const TAB_LABELS: Record<TabType, string> = {
  projects: 'Projects & Operations',
  boq: 'BOQ & Estimation (Pro)',
  interior: 'Interior & Fit-Out Costing',
  materials: 'Materials & Rate Standards',
  specialist: 'Gouse AI Super Agent',
  marketplace: 'Vendor Marketplace',
  broker: 'Zero-Broker Property · Launching 2028',
  pg_coliving: 'PG & Co-Living · Launching 2028',
  rent_house: 'Direct Rentals · Launching 2028',
  social: 'Realstate Media',
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  activeProject,
  currency,
  onChangeCurrency,
  onOpenMobileMenu,
  onPrimaryAction,
  primaryActionLabel = 'CAD Engine',
}) => {
  const { currentTheme, isSettingsOpen, setIsSettingsOpen } = useTheme();
  const {
    user,
    hasBoqAccess,
    getTrialStatus,
    openLoginModal,
    openSubscriptionModal,
    setIsProfileEditorOpen,
    logout,
  } = useAuth();

  const [isProfilePopoverOpen, setIsProfilePopoverOpen] = useState(false);
  const profilePopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profilePopoverRef.current && !profilePopoverRef.current.contains(e.target as Node)) {
        setIsProfilePopoverOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsProfilePopoverOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const userIsFree = isFreeProfile(user);
  const userHasBoq = hasBoqAccess(user);
  const trialStatus = getTrialStatus(user);

  return (
    <>
      <header
        id="app-header"
        className="h-14 border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-20 px-4 lg:px-8 flex items-center justify-between gap-3 shrink-0 print:hidden"
      >
        {/* Zone 1: Mobile Menu + Breadcrumb Trail */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white transition-colors shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
            <span className="font-semibold text-white whitespace-nowrap shrink-0 lg:hidden">
              Gouse AI
            </span>
            <span className="text-slate-600 lg:hidden" aria-hidden="true">
              /
            </span>
            <span className="font-medium text-slate-300 whitespace-nowrap shrink-0">
              {TAB_LABELS[activeTab] || 'Workspace'}
            </span>
            {activeProject && (
              <>
                <span className="text-slate-600 hidden md:inline" aria-hidden="true">
                  /
                </span>
                <span className="text-slate-400 truncate max-w-[160px] lg:max-w-[260px] hidden md:inline">
                  {activeProject.name}
                </span>
              </>
            )}
          </nav>
        </div>

        {/* Zone 2 & 3: Currency Switcher + Visible Active Profile + Single Primary Action */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs">
            <Coins className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
            <select
              id="header-currency-selector"
              value={currency}
              onChange={(e) => onChangeCurrency(e.target.value as CurrencyCode)}
              className="bg-transparent text-slate-200 font-mono text-xs focus:ring-0 focus:outline-none cursor-pointer"
              aria-label="Select display currency"
            >
              <option value="INR" className="bg-slate-900 text-white">INR (₹)</option>
              <option value="USD" className="bg-slate-900 text-white">USD ($)</option>
              <option value="EUR" className="bg-slate-900 text-white">EUR (€)</option>
              <option value="GBP" className="bg-slate-900 text-white">GBP (£)</option>
              <option value="AED" className="bg-slate-900 text-white">AED</option>
            </select>
          </div>

          {/* Always-visible Active Profile Button & Location Indicator */}
          <div className="relative" ref={profilePopoverRef}>
            {user ? (
              <button
                id="btn-header-profile"
                type="button"
                onClick={() => setIsProfilePopoverOpen((prev) => !prev)}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs transition-colors"
                title="View or manage your active profile"
              >
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 rounded-md object-cover border border-slate-700 shrink-0"
                />
                <div className="hidden sm:flex flex-col items-start leading-tight max-w-[140px]">
                  <span className="text-[11px] font-semibold text-white truncate max-w-full">
                    {user.name}
                  </span>
                  <span
                    className={`text-[10px] font-mono ${
                      userIsFree ? 'text-emerald-400' : userHasBoq ? 'text-amber-400' : 'text-sky-400'
                    }`}
                  >
                    {trialStatus.statusLabel}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>
            ) : (
              <button
                id="btn-header-profile"
                type="button"
                onClick={openLoginModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap"
                title="Sign in or view workspace profiles"
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="hidden sm:inline">Sign In · Profiles</span>
                <span className="sm:hidden">Profile</span>
              </button>
            )}

            {/* Header Profile Popover Card */}
            {user && isProfilePopoverOpen && (
              <div
                id="popover-header-profile"
                className="absolute right-0 top-full mt-2 w-72 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-50 p-3.5 space-y-3 text-left"
              >
                <div className="flex items-start gap-2.5 pb-2.5 border-b border-slate-800">
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-lg object-cover border border-slate-700 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate">{user.name}</div>
                    <div className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] font-mono">
                      {userIsFree ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Gouse AI · Lifetime Free (Full Access)</span>
                        </span>
                      ) : userHasBoq ? (
                        <span className="text-amber-400 font-semibold flex items-center gap-1">
                          <Crown className="w-3 h-3" />
                          <span>BOQ &amp; Pro License Active</span>
                        </span>
                      ) : (
                        <span className="text-sky-400 font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>{trialStatus.statusLabel} · BOQ Paid</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px] text-slate-300">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{user.company || 'Gouse AI Studio'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate font-mono">{user.phone || '+91 80739 47241'}</span>
                  </div>
                  {user.licenseNumber && (
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate font-mono text-slate-400">{user.licenseNumber}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-1 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfilePopoverOpen(false);
                      setIsProfileEditorOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Edit Profile Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfilePopoverOpen(false);
                      openLoginModal();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Switch Account &amp; Access</span>
                  </button>

                  {!userHasBoq && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfilePopoverOpen(false);
                        openSubscriptionModal();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors"
                    >
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>Unlock BOQ &amp; Estimate (₹1,500/yr)</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfilePopoverOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-400 hover:bg-rose-950/40 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {onPrimaryAction && (
            <button
              id="btn-header-open-workflow-engine"
              type="button"
              onClick={onPrimaryAction}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-950 transition-colors whitespace-nowrap shrink-0"
              style={{
                backgroundColor: currentTheme.colors['500'],
              }}
            >
              <span>{primaryActionLabel}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
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
