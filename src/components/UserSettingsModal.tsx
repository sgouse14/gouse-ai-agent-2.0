import React from 'react';
import {
  X,
  Palette,
  Check,
  Grid3X3,
  Sparkles,
  Sliders,
  RotateCcw,
  Building2,
  Compass,
  Cpu,
  Layers,
} from 'lucide-react';
import { useTheme, ACCENT_THEMES, GridIntensity } from '../context/ThemeContext';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    currentTheme,
    setAccentThemeId,
    gridIntensity,
    setGridIntensity,
    resetToDefaults,
  } = useTheme();

  if (!isOpen) return null;

  const gridOptions: { id: GridIntensity; label: string; desc: string; opacity: string }[] = [
    { id: 'subtle', label: 'Subtle Drafting', desc: 'Minimal 3% grid opacity for focused drafting', opacity: '3%' },
    { id: 'moderate', label: 'Classic Vellum', desc: 'Standard 6% grid for drafting legibility', opacity: '6%' },
    { id: 'prominent', label: 'CAD Plotter', desc: 'Crisp 10% high-contrast architectural grid', opacity: '10%' },
    { id: 'off', label: 'Minimal Slate', desc: 'Flat dark canvas with zero grid overlay', opacity: '0%' },
  ];

  return (
    <div
      id="user-settings-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="user-settings-modal-container"
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm shrink-0"
              style={{
                backgroundColor: `rgba(${currentTheme.rgb}, 0.15)`,
                border: `1px solid rgba(${currentTheme.rgb}, 0.4)`,
                color: currentTheme.colors['400'],
              }}
            >
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Workspace Settings &amp; Visual Studio
                </h2>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider font-semibold border"
                  style={{
                    backgroundColor: `rgba(${currentTheme.rgb}, 0.12)`,
                    borderColor: `rgba(${currentTheme.rgb}, 0.3)`,
                    color: currentTheme.colors['300'],
                  }}
                >
                  Architectural Themes
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Customize workspace display accents, drafting grid density, and architectural materiality
              </p>
            </div>
          </div>

          <button
            id="btn-close-settings-modal"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 scrollbar-thin">
          {/* Section 1: Architectural Accent Palette Selection */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                  Architectural Accent Palette
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {ACCENT_THEMES.length} Curated Material Schemes
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ACCENT_THEMES.map((theme) => {
                const isSelected = theme.id === currentTheme.id;
                return (
                  <button
                    key={theme.id}
                    id={`btn-accent-theme-${theme.id}`}
                    type="button"
                    onClick={() => setAccentThemeId(theme.id)}
                    className={`relative text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 group ${
                      isSelected
                        ? 'bg-slate-950/80 shadow-md ring-1'
                        : 'bg-slate-950/40 hover:bg-slate-800/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                    style={{
                      borderColor: isSelected ? `rgba(${theme.rgb}, 0.7)` : undefined,
                      boxShadow: isSelected ? `0 0 15px rgba(${theme.rgb}, 0.15)` : undefined,
                    }}
                  >
                    {/* Swatch color dot with halo */}
                    <div
                      className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center transition-transform group-hover:scale-105 shadow-inner mt-0.5"
                      style={{
                        backgroundColor: theme.colors['500'],
                        boxShadow: `0 0 10px rgba(${theme.rgb}, 0.4)`,
                      }}
                    >
                      {isSelected && <Check className="w-4 h-4 text-slate-950 stroke-[2.5]" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-bold text-white tracking-tight">
                          {theme.name}
                        </span>
                        {isSelected && (
                          <span
                            className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase"
                            style={{
                              backgroundColor: `rgba(${theme.rgb}, 0.2)`,
                              color: theme.colors['300'],
                            }}
                          >
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium truncate">
                        {theme.discipline}
                      </p>
                      <span className="text-[10px] text-slate-500 font-mono block mt-1">
                        Material: {theme.materialRef}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Section 2: Real-time Live Material Preview */}
          <section
            className="p-4 rounded-xl border transition-colors relative overflow-hidden bg-slate-950/70"
            style={{
              borderColor: `rgba(${currentTheme.rgb}, 0.3)`,
            }}
          >
            <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" style={{ color: currentTheme.colors['400'] }} />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                  Live Visual Response: {currentTheme.name}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                RGB ({currentTheme.rgb})
              </span>
            </div>

            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              {currentTheme.description}
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <span
                className="px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 border"
                style={{
                  backgroundColor: `rgba(${currentTheme.rgb}, 0.15)`,
                  borderColor: `rgba(${currentTheme.rgb}, 0.35)`,
                  color: currentTheme.colors['300'],
                }}
              >
                <Building2 className="w-3.5 h-3.5" />
                Active Architectural Accent
              </span>

              <button
                type="button"
                className="px-3 py-1 rounded-md text-xs font-bold text-slate-950 transition shadow-sm flex items-center gap-1"
                style={{
                  backgroundColor: currentTheme.colors['500'],
                }}
              >
                <Compass className="w-3.5 h-3.5" />
                Sample Primary Action
              </button>

              <span
                className="text-xs font-mono font-bold px-2 py-1 rounded bg-slate-900 border border-slate-800"
                style={{
                  color: currentTheme.colors['400'],
                }}
              >
                ₹3,450 / sq.ft
              </span>
            </div>
          </section>

          {/* Section 3: Drafting Grid Canvas Background */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Grid3X3 className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                  Drafting Grid Canvas Density
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                32px Architectural Grid Overlay
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {gridOptions.map((opt) => {
                const isSelected = gridIntensity === opt.id;
                return (
                  <button
                    key={opt.id}
                    id={`btn-grid-intensity-${opt.id}`}
                    type="button"
                    onClick={() => setGridIntensity(opt.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-slate-950 text-white shadow-sm'
                        : 'bg-slate-950/40 hover:bg-slate-800/40 text-slate-400 border-slate-800/80 hover:text-slate-200'
                    }`}
                    style={{
                      borderColor: isSelected ? `rgba(${currentTheme.rgb}, 0.6)` : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold block truncate">{opt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    </div>
                    <span className="text-[10px] text-slate-500 block font-mono">{opt.opacity} Density</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Section 4: Workspace Technical Specifications */}
          <section className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs text-slate-400 font-mono space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-300 font-bold mb-1">
              <Cpu className="w-3.5 h-3.5 text-slate-400" />
              <span>Workspace Specifications &amp; Engine</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
              <div>Engine: <span className="text-slate-200">Gemini 3.8 Flash (Server-side)</span></div>
              <div>License: <span className="text-emerald-400">Ar. Gouse Pro Studio</span></div>
              <div>Sync: <span className="text-slate-200">Client-Side Persistence (LocalStorage)</span></div>
              <div>Grid: <span className="text-slate-200">{gridIntensity.toUpperCase()} Overlay</span></div>
            </div>
          </section>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3 shrink-0">
          <button
            id="btn-reset-settings"
            type="button"
            onClick={resetToDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              id="btn-save-close-settings"
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 transition shadow-md"
              style={{
                backgroundColor: currentTheme.colors['500'],
              }}
            >
              <Check className="w-4 h-4" />
              <span>Apply &amp; Close</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
