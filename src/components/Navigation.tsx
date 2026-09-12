import React from 'react';
import { Building2, Calculator, Store, Layers, Mic } from 'lucide-react';

export type TabType = 'projects' | 'boq' | 'marketplace' | 'materials' | 'specialist';

interface NavigationProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onSelectTab }) => {
  const tabs = [
    { id: 'projects' as TabType, label: 'Projects & Workspace', icon: Building2, count: null },
    { id: 'boq' as TabType, label: 'BOQ & Estimation', icon: Calculator, count: null },
    { id: 'marketplace' as TabType, label: 'Marketplace & Enquiries', icon: Store, count: null },
    { id: 'materials' as TabType, label: 'Materials & Standards', icon: Layers, count: null },
    { id: 'specialist' as TabType, label: 'Specialist AI & Voice', icon: Mic, badge: 'AI' },
  ];

  return (
    <nav id="app-navigation" className="bg-slate-900 border-b border-slate-800 px-4 lg:px-8">
      <div className="max-w-7xl mx-auto flex space-x-1 overflow-x-auto py-2 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
