import React from 'react';
import { Menu, Coins, ArrowUpRight } from 'lucide-react';
import { Project } from '../types';
import { CurrencyCode } from '../utils/formatters';
import { TabType } from './Navigation';
import { useTheme } from '../context/ThemeContext';
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
  boq: 'BOQ & Cost Schedule',
  materials: 'Materials & Rate Standards',
  specialist: 'Specialist AI Workbench',
  marketplace: 'Vendor Marketplace',
  broker: 'Property & Brokerage',
  pg_coliving: 'PG & Co-Living Portfolio',
  rent_house: 'Residential Rentals',
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

  return (
    <>
      <header
        id="app-header"
        className="h-14 border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-20 px-4 lg:px-8 flex items-center justify-between gap-4 shrink-0"
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
                <span className="text-slate-600 hidden sm:inline" aria-hidden="true">
                  /
                </span>
                <span className="text-slate-400 truncate max-w-[180px] md:max-w-[300px] hidden sm:inline">
                  {activeProject.name}
                </span>
              </>
            )}
          </nav>
        </div>

        {/* Zone 2 & 3: Currency Switcher + Single Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs">
            <Coins className="w-3.5 h-3.5 text-slate-400 shrink-0" />
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

          {onPrimaryAction && (
            <button
              id="btn-header-open-workflow-engine"
              type="button"
              onClick={onPrimaryAction}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-950 transition-colors whitespace-nowrap shrink-0"
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
