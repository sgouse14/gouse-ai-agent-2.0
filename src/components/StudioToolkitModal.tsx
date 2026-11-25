import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Wand2,
  Cpu,
  Languages,
  FileSpreadsheet,
  Copy,
  Check,
  Sparkles,
  Download,
  Printer,
  PlusCircle,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Loader2,
  BookmarkCheck,
  Building2,
  Compass,
  ClipboardList,
  Calculator,
  Volume2,
} from 'lucide-react';
import { Project, BOQItem } from '../types';
import { TabType } from './Navigation';
import { CurrencyCode, formatCurrency } from '../utils/formatters';
import { SmartHomeSkaAgent } from './SmartHomeSkaAgent';
import { getBimBoqSubscription } from './BimBoqSubscriptionModal';
import { ensureItemFloorBreakdown } from '../utils/floorTakeoffEngine';
import { SiteFeasibilityPanel } from './studio/SiteFeasibilityPanel';
import { FieldOperationsPanel } from './studio/FieldOperationsPanel';
import { EngineeringCalcsPanel } from './studio/EngineeringCalcsPanel';

export type StudioToolkitTab =
  | 'feasibility'
  | 'field_ops'
  | 'calculators'
  | 'render'
  | 'translator'
  | 'smart_building'
  | 'dossier';

export interface StudioToolkitModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: StudioToolkitTab;
  activeProject: Project;
  boqItems: BOQItem[];
  contingencyPercent: number;
  currency: CurrencyCode;
  onUpdateProject: (updated: Project) => void;
  onUpdateBOQItems: (items: BOQItem[]) => void;
  onNavigateTab: (tab: TabType) => void;
  onOpenBimLicense: () => void;
}

const RENDER_PRESETS = [
  {
    id: 'ext-twilight',
    label: 'Exterior Twilight Villa',
    style: 'Blue Hour Architectural Twilight',
    description:
      'Contemporary tropical brutalist residence with cantilevered upper volume, warm recessed soffit illumination, board-formed concrete walls, vertical Burma teak louvers, reflecting plunge pool, and lush courtyard planting.',
  },
  {
    id: 'courtyard-day',
    label: 'Courtyard Daylight',
    style: 'Soft Overcast Daylight',
    description:
      'Double-height central atrium courtyard with natural cross-ventilation, Italian travertine stone flooring, sculptural helical stair, terracotta breeze-block screen casting geometric shadows, and indoor ficus tree.',
  },
  {
    id: 'living-interior',
    label: 'Modern Living Interior',
    style: '2700K Warm Interior Glow',
    description:
      'Minimalist luxury living room with floor-to-ceiling low-E glazing, honed limestone feature wall, fluted walnut cabinetry, cove architectural lighting, and bespoke travertine coffee table.',
  },
  {
    id: 'pg-facade',
    label: 'PG & Co-Living Facade',
    style: 'Golden Hour Photorealistic',
    description:
      'Urban G+4 co-living architectural elevation with rhythmic recessed balconies, perforated powder-coated aluminum privacy screens, exposed wire-cut brick podium, and landscaped ground entrance plaza.',
  },
  {
    id: 'bim-axon',
    label: 'BIM Axonometric Cut',
    style: 'Architectural Diagram & Clay Render',
    description:
      'Clean architectural cutaway isometric showing structural RCC columns, post-tensioned slabs, double-height living core, rooftop solar pergola, and rainwater harvesting sump.',
  },
];

const MATERIAL_BOARD_SPECS = [
  {
    id: 'mat-travertine',
    name: 'Honed Italian Travertine Flooring',
    swatch: '#d6cbb8',
    category: 'Finishes',
    unit: 'sq.ft',
    rate: 420,
    specNote: '20mm thick anti-slip honed slab finish for living & foyer',
  },
  {
    id: 'mat-teak',
    name: 'Vertical Burma Teak Facade Louvers',
    swatch: '#8b5a2b',
    category: 'Finishes',
    unit: 'sq.ft',
    rate: 680,
    specNote: 'Seasoned exterior-grade timber fins on anodized subframe',
  },
  {
    id: 'mat-terracotta',
    name: 'Architectural Terracotta Jaali Screen',
    swatch: '#b85d43',
    category: 'Civil & Masonry',
    unit: 'sq.ft',
    rate: 265,
    specNote: 'Perforated natural clay sun-breaker screen for West elevation',
  },
  {
    id: 'mat-lowe',
    name: '24mm Low-E DGU Acoustic Glazing',
    swatch: '#4b6b7a',
    category: 'Finishes',
    unit: 'sq.ft',
    rate: 790,
    specNote: '6+12A+6 toughened DGU (U-value 1.8 W/m²K, SHGC 0.26)',
  },
];

const RENDER_STYLES = [
  'Golden Hour Photorealistic',
  'Blue Hour Architectural Twilight',
  'Soft Overcast Daylight',
  '2700K Warm Interior Glow',
  'Architectural Diagram & Clay Render',
];

const SITE_LANGUAGES = [
  { code: 'kn-IN', label: 'Kannada (ಕನ್ನಡ)', short: 'Kannada' },
  { code: 'hi-IN', label: 'Hindi (हिन्दी)', short: 'Hindi' },
  { code: 'te-IN', label: 'Telugu (తెలుగు)', short: 'Telugu' },
  { code: 'ta-IN', label: 'Tamil (தமிழ்)', short: 'Tamil' },
  { code: 'ml-IN', label: 'Malayalam (മലയാളം)', short: 'Malayalam' },
  { code: 'mr-IN', label: 'Marathi (मराठी)', short: 'Marathi' },
  { code: 'ur-IN', label: 'Urdu (اردو)', short: 'Urdu' },
  { code: 'ar-SA', label: 'Arabic (العربية)', short: 'Arabic' },
];

const SITE_MEMO_TEMPLATES = [
  {
    label: 'Slab Pour Pre-Check',
    text: 'Do not commence M25 concrete pouring until the site engineer verifies 25mm/40mm cover blocks, beam bottom props bracing, electrical conduit boxes, and sunken slab sleeve cutouts.',
  },
  {
    label: 'Rebar & Stirrup Spacing',
    text: 'Check Fe-550D column ties spacing at 100mm c/c in confinement zones and verify 50D lap length is staggered away from maximum bending moment zones per IS 456.',
  },
  {
    label: 'Waterproofing & Ponding',
    text: 'Complete two-coat elastomeric crystalline waterproofing on bathroom and terrace mother slabs. Maintain 72-hour water ponding test before laying protection screed.',
  },
  {
    label: 'Site PPE & Safety Notice',
    text: 'All bar benders, masons, and scaffolding crew must wear safety helmets, reflective vests, and full-body harnesses when working above 1.8 meters edge height.',
  },
];

const COA_STAGES = [
  { stage: 'Stage 1 · Concept Design & Massing', pct: 15 },
  { stage: 'Stage 2 · Municipal Sanction & Schematic', pct: 25 },
  { stage: 'Stage 3 · Working Drawings & Tender BOQ', pct: 25 },
  { stage: 'Stage 4 · Periodic Site Supervision', pct: 25 },
  { stage: 'Stage 5 · As-Built & Final Handover', pct: 10 },
];

export const StudioToolkitModal: React.FC<StudioToolkitModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'feasibility',
  activeProject,
  boqItems,
  contingencyPercent,
  currency,
  onUpdateProject,
  onUpdateBOQItems,
  onNavigateTab,
  onOpenBimLicense,
}) => {
  const [activeTab, setActiveTab] = useState<StudioToolkitTab>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // AI Render & Material Board state
  const [renderDescription, setRenderDescription] = useState(RENDER_PRESETS[0].description);
  const [renderStyle, setRenderStyle] = useState(RENDER_PRESETS[0].style);
  const [generatedRenderPrompt, setGeneratedRenderPrompt] = useState('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [savedPromptToLog, setSavedPromptToLog] = useState(false);
  const [addedFinishId, setAddedFinishId] = useState<string | null>(null);

  // Site Memo Translator state
  const [sourceMemoText, setSourceMemoText] = useState(SITE_MEMO_TEMPLATES[0].text);
  const [targetLang, setTargetLang] = useState('kn-IN');
  const [translatedMemo, setTranslatedMemo] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSpeakingTranslation, setIsSpeakingTranslation] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [copiedTranslation, setCopiedTranslation] = useState(false);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  // Architectural Fee Estimator & Dossier state
  const [feeMode, setFeeMode] = useState<'percent' | 'per_sqft'>('percent');
  const [feePercent, setFeePercent] = useState<number>(6.5);
  const [feePerSqFt, setFeePerSqFt] = useState<number>(125);
  const [includeGst, setIncludeGst] = useState<boolean>(true);
  const [addedFeeToBoq, setAddedFeeToBoq] = useState(false);
  const [copiedDossier, setCopiedDossier] = useState(false);

  useEffect(() => {
    return () => {
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
        ttsAudioRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const boqTotals = useMemo(() => {
    const subtotal = boqItems.reduce((sum, item) => sum + (item.amount || item.quantity * item.rate || 0), 0);
    const contingencyAmount = Math.round((subtotal * contingencyPercent) / 100);
    const grandTotal = subtotal + contingencyAmount;
    const byCategory: Record<string, number> = {};
    boqItems.forEach((item) => {
      const cat = item.category || 'General';
      byCategory[cat] = (byCategory[cat] || 0) + (item.amount || item.quantity * item.rate || 0);
    });
    const topCategories = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    return { subtotal, contingencyAmount, grandTotal, topCategories };
  }, [boqItems, contingencyPercent]);

  const builtUpArea = activeProject.builtUpAreaSqFt || 3200;

  const consultancyFeeCalc = useMemo(() => {
    const baseFee =
      feeMode === 'percent'
        ? Math.round((boqTotals.subtotal * feePercent) / 100)
        : Math.round(builtUpArea * feePerSqFt);
    const gstAmount = includeGst ? Math.round(baseFee * 0.18) : 0;
    const totalFee = baseFee + gstAmount;
    return { baseFee, gstAmount, totalFee };
  }, [feeMode, boqTotals.subtotal, feePercent, builtUpArea, feePerSqFt, includeGst]);

  const subscription = useMemo(() => getBimBoqSubscription(), [isOpen]);

  const buildDossierMarkdown = () => {
    const teamLines =
      activeProject.members?.map(
        (m) => `- **${m.name}** (${m.role.replace(/_/g, ' ')}) — ${m.department || 'Project Team'} · ${m.email}`
      ) || [];
    const catLines = boqTotals.topCategories.map(
      ([cat, amt]) => `- **${cat}**: ${formatCurrency(amt, currency)}`
    );
    const recentLogs = (activeProject.auditLogs || [])
      .slice(0, 6)
      .map((l) => `- [${l.timestamp.slice(0, 10)}] **${l.action}** (${l.actor}): ${l.details}`);

    return [
      `# Studio Project Dossier: ${activeProject.name}`,
      ``,
      `## 1. Project Specification`,
      `- **Typology**: ${activeProject.projectType}`,
      `- **Location**: ${activeProject.location}`,
      `- **Lifecycle Stage**: ${activeProject.status.replace(/_/g, ' ').toUpperCase()}`,
      `- **Built-Up Area**: ${builtUpArea.toLocaleString()} sq.ft`,
      `- **Brief**: ${activeProject.description || 'Architectural design, structural coordination, and turnkey BOQ control.'}`,
      ``,
      `## 2. Cost & BOQ Intelligence (${currency})`,
      `- **Line Items**: ${boqItems.length}`,
      `- **BOQ Subtotal**: ${formatCurrency(boqTotals.subtotal, currency)}`,
      `- **Contingency Reserve (${contingencyPercent}%)**: ${formatCurrency(boqTotals.contingencyAmount, currency)}`,
      `- **Estimated Construction Total**: ${formatCurrency(boqTotals.grandTotal, currency)}`,
      `- **Recommended Architectural Fee (${feeMode === 'percent' ? `${feePercent}%` : `${feePerSqFt}/sq.ft`}${includeGst ? ' + 18% GST' : ''})**: ${formatCurrency(consultancyFeeCalc.totalFee, currency)}`,
      ``,
      `### Major Trade Allocations`,
      ...catLines,
      ``,
      `## 3. Assigned Studio Team`,
      ...(teamLines.length > 0 ? teamLines : ['- Principal Architect: Gouse AI']),
      ``,
      `## 4. Recent Audit & Inspection Trail`,
      ...(recentLogs.length > 0 ? recentLogs : ['- No recent logs recorded.']),
      ``,
      `---`,
      `Generated via Gouse AI Studio Utilities · ${new Date().toISOString().slice(0, 10)}`,
    ].join('\n');
  };

  if (!isOpen) return null;

  const handleLoadProjectIntoRender = () => {
    setRenderDescription(
      `${activeProject.projectType} named "${activeProject.name}" in ${activeProject.location}, approx. ${builtUpArea.toLocaleString()} sq.ft. ${activeProject.description || 'Contemporary architecture with passive daylighting, natural stone plinth, and timber facade accents.'}`
    );
  };

  const handleAppendMaterial = (chip: string) => {
    setRenderDescription((prev) => {
      if (prev.toLowerCase().includes(chip.toLowerCase())) return prev;
      return `${prev.replace(/\.?\s*$/, '')}, featuring ${chip.toLowerCase()}.`;
    });
  };

  const handleAddMaterialBoardSpecToBoq = (spec: (typeof MATERIAL_BOARD_SPECS)[number]) => {
    const qty = Math.max(120, Math.round(builtUpArea * 0.18));
    const itemId = `boq-spec-${spec.id}`;
    const raw: BOQItem = {
      id: itemId,
      name: spec.name,
      category: spec.category,
      unit: spec.unit,
      quantity: qty,
      rate: spec.rate,
      amount: qty * spec.rate,
      notes: `${spec.specNote} · Added from Material Spec Board`,
      stage: 'Finishes',
      status: 'estimated',
    };
    const withFloors = ensureItemFloorBreakdown(raw, activeProject.floors);
    const exists = boqItems.some((b) => b.id === itemId);
    onUpdateBOQItems(exists ? boqItems.map((b) => (b.id === itemId ? withFloors : b)) : [withFloors, ...boqItems]);
    setAddedFinishId(spec.id);
    setTimeout(() => setAddedFinishId(null), 2500);
  };

  const handleGenerateRenderPrompt = async () => {
    if (!renderDescription.trim()) return;
    setIsGeneratingPrompt(true);
    setRenderError(null);
    setSavedPromptToLog(false);
    try {
      const res = await fetch('/api/architecture/render-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: renderDescription,
          style: renderStyle,
        }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setGeneratedRenderPrompt(data.prompt || '');
    } catch {
      setRenderError('Could not connect to AI Render Prompt Studio. Please retry.');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleSavePromptToAuditLog = () => {
    if (!generatedRenderPrompt.trim()) return;
    const nextLog = {
      id: `log-render-${Date.now()}`,
      projectId: activeProject.id,
      actor: 'AI Render Studio',
      action: `Visualization Brief (${renderStyle})`,
      details: generatedRenderPrompt.slice(0, 220) + (generatedRenderPrompt.length > 220 ? '...' : ''),
      timestamp: new Date().toISOString(),
    };
    onUpdateProject({
      ...activeProject,
      auditLogs: [nextLog, ...(activeProject.auditLogs || [])],
      updatedAt: new Date().toISOString(),
    });
    setSavedPromptToLog(true);
  };

  const handleTranslateMemo = async () => {
    if (!sourceMemoText.trim()) return;
    setIsTranslating(true);
    setTranslateError(null);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sourceMemoText,
          targetLanguage: targetLang,
          sourceLanguage: 'auto',
        }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setTranslatedMemo(data.translatedText || '');
    } catch {
      setTranslateError('Translation service unavailable right now. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSpeakTranslatedMemo = async () => {
    if (!translatedMemo.trim()) return;
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeakingTranslation(true);

    try {
      const res = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: translatedMemo,
          voiceName: 'Zephyr',
          language: targetLang,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
          ttsAudioRef.current = audio;
          audio.onended = () => setIsSpeakingTranslation(false);
          audio.onerror = () => setIsSpeakingTranslation(false);
          await audio.play();
          return;
        }
      }
    } catch {
      // fall through to browser speech synthesis
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(translatedMemo);
      u.lang = targetLang;
      u.onend = () => setIsSpeakingTranslation(false);
      u.onerror = () => setIsSpeakingTranslation(false);
      window.speechSynthesis.speak(u);
    } else {
      setIsSpeakingTranslation(false);
    }
  };

  const handleAddFeeToBoq = () => {
    const feeId = 'boq-arch-consultancy-fee';
    const noteText =
      feeMode === 'percent'
        ? `${feePercent}% architectural & structural consultancy (${includeGst ? 'incl. 18% GST' : 'excl. GST'}) on ${activeProject.name}`
        : `${builtUpArea.toLocaleString()} sq.ft @ ${formatCurrency(feePerSqFt, currency)}/sq.ft (${includeGst ? 'incl. 18% GST' : 'excl. GST'})`;

    const rawFeeItem: BOQItem = {
      id: feeId,
      name: 'Architectural, Structural & BIM Consultancy Fee',
      category: 'Professional Fees',
      unit: 'Lump Sum',
      quantity: 1,
      rate: consultancyFeeCalc.totalFee,
      amount: consultancyFeeCalc.totalFee,
      notes: noteText,
      stage: 'Handover',
      status: 'approved',
    };
    const feeItem = ensureItemFloorBreakdown(rawFeeItem, activeProject.floors);

    const exists = boqItems.some((item) => item.id === feeId);
    const updatedItems = exists
      ? boqItems.map((item) => (item.id === feeId ? feeItem : item))
      : [feeItem, ...boqItems];

    onUpdateBOQItems(updatedItems);
    onUpdateProject({
      ...activeProject,
      auditLogs: [
        {
          id: `log-fee-${Date.now()}`,
          projectId: activeProject.id,
          actor: 'Studio Fee Desk',
          action: exists ? 'Updated Consultancy Fee in BOQ' : 'Added Consultancy Fee to BOQ',
          details: `${formatCurrency(consultancyFeeCalc.totalFee, currency)} · ${noteText}`,
          timestamp: new Date().toISOString(),
        },
        ...(activeProject.auditLogs || []),
      ],
      updatedAt: new Date().toISOString(),
    });
    setAddedFeeToBoq(true);
    setTimeout(() => setAddedFeeToBoq(false), 3000);
  };

  const handleDownloadDossier = () => {
    const md = buildDossierMarkdown();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = activeProject.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    a.href = url;
    a.download = `${safeName || 'gouse-ai-project'}-dossier.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const selectedLangObj = SITE_LANGUAGES.find((l) => l.code === targetLang) || SITE_LANGUAGES[0];

  const TABS: Array<{ id: StudioToolkitTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'feasibility', label: 'Site Feasibility & Yield', icon: Compass },
    { id: 'field_ops', label: 'RFIs & Change Orders', icon: ClipboardList },
    { id: 'calculators', label: 'Engineering & Carbon', icon: Calculator },
    { id: 'render', label: 'Render & Finish Board', icon: Wand2 },
    { id: 'translator', label: 'Site Translator', icon: Languages },
    { id: 'smart_building', label: 'Smart Building (SKA)', icon: Cpu },
    { id: 'dossier', label: 'Fee & Dossier', icon: FileSpreadsheet },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl max-h-[92vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Clean Single-Row Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-medium text-slate-200 truncate">{activeProject.name}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{activeProject.location}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums whitespace-nowrap">
                {builtUpArea.toLocaleString()} sq.ft
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
              Studio Utilities Suite
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenBimLicense();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 hover:border-amber-500/60 text-xs font-medium text-slate-200 transition whitespace-nowrap"
            >
              <CreditCard className="w-3.5 h-3.5 text-amber-400" />
              <span>{subscription.isSubscribed ? 'BIM Pro Active' : 'BIM & BOQ License'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Studio Utilities"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tab Bar */}
        <div className="px-5 py-2.5 border-b border-slate-800 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto shrink-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`btn-studio-tab-${tab.id}`}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap shrink-0 border ${
                  active
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-100 hover:border-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Content Viewport */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* TAB 1: SITE FEASIBILITY & PLOT YIELD */}
          {activeTab === 'feasibility' && (
            <SiteFeasibilityPanel
              activeProject={activeProject}
              boqSubtotal={boqTotals.subtotal}
              currency={currency}
              onUpdateProject={onUpdateProject}
              onNavigateTab={(tab) => onNavigateTab(tab)}
              onCloseModal={onClose}
            />
          )}

          {/* TAB 2: FIELD RFIS, CHANGE ORDERS & SNAGS */}
          {activeTab === 'field_ops' && (
            <FieldOperationsPanel
              activeProject={activeProject}
              boqItems={boqItems}
              currency={currency}
              onUpdateProject={onUpdateProject}
              onUpdateBOQItems={onUpdateBOQItems}
            />
          )}

          {/* TAB 3: STRUCTURAL, MEP & CARBON CALCULATORS */}
          {activeTab === 'calculators' && (
            <EngineeringCalcsPanel
              activeProject={activeProject}
              boqItems={boqItems}
              currency={currency}
              onUpdateBOQItems={onUpdateBOQItems}
              onUpdateProject={onUpdateProject}
            />
          )}

          {/* TAB 4: AI RENDER & ARCHITECTURAL FINISH BOARD */}
          {activeTab === 'render' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        Architectural Visualization &amp; Finish Board
                      </h3>
                      <p className="text-xs text-slate-400">
                        Build camera-calibrated render briefs and push exterior/interior finish specs straight to BOQ.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleLoadProjectIntoRender}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 hover:border-amber-500/50 text-xs font-medium text-amber-300 transition whitespace-nowrap shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Load Active Project</span>
                    </button>
                  </div>

                  {/* Preset Scenes */}
                  <div>
                    <span className="block text-[11px] font-medium text-slate-400 mb-1.5">
                      Shot Typology Presets
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {RENDER_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setRenderDescription(preset.description);
                            setRenderStyle(preset.style);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-600 text-xs text-slate-300 hover:text-white transition whitespace-nowrap"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description Input */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Massing, Spatial &amp; Material Brief
                    </label>
                    <textarea
                      rows={4}
                      value={renderDescription}
                      onChange={(e) => setRenderDescription(e.target.value)}
                      placeholder="Describe facade geometry, window proportions, landscape edges, and interior focal points..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 leading-relaxed focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Lighting Style & Submit */}
                  <div className="flex flex-col sm:flex-row sm:items-end gap-3 pt-1">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Lighting &amp; Atmosphere
                      </label>
                      <select
                        value={renderStyle}
                        onChange={(e) => setRenderStyle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        {RENDER_STYLES.map((st) => (
                          <option key={st} value={st} className="bg-slate-900">
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      id="btn-generate-render-prompt"
                      type="button"
                      disabled={isGeneratingPrompt || !renderDescription.trim()}
                      onClick={handleGenerateRenderPrompt}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold text-xs transition whitespace-nowrap shrink-0"
                    >
                      {isGeneratingPrompt ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Synthesizing Brief...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-3.5 h-3.5" />
                          <span>Generate Render Prompt</span>
                        </>
                      )}
                    </button>
                  </div>

                  {renderError && (
                    <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
                      {renderError}
                    </p>
                  )}
                </div>

                {/* Output Panel */}
                <div className="lg:col-span-5 rounded-xl bg-slate-950 border border-slate-800 p-4 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <span className="text-xs font-semibold text-white">
                        Calibrated Visualization Prompt
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        Gemini 4 Hydrogen
                      </span>
                    </div>

                    {generatedRenderPrompt ? (
                      <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                        {generatedRenderPrompt}
                      </div>
                    ) : (
                      <div className="p-6 rounded-lg border border-dashed border-slate-800 text-center space-y-1.5">
                        <Wand2 className="w-6 h-6 text-slate-500 mx-auto" />
                        <p className="text-xs text-slate-400">
                          Select a preset or load your active project brief, then click Generate Render Prompt for V-Ray, Corona, D5, or architectural image briefs.
                        </p>
                      </div>
                    )}
                  </div>

                  {generatedRenderPrompt && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(generatedRenderPrompt).catch(() => {});
                          setCopiedPrompt(true);
                          setTimeout(() => setCopiedPrompt(false), 2000);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs font-medium text-white transition"
                      >
                        {copiedPrompt ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedPrompt ? 'Copied' : 'Copy Prompt'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSavePromptToAuditLog}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-emerald-500/50 text-xs font-medium text-emerald-300 transition"
                      >
                        <BookmarkCheck className="w-3.5 h-3.5" />
                        <span>{savedPromptToLog ? 'Saved to Log' : 'Save to Project Log'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSourceMemoText(generatedRenderPrompt);
                          setActiveTab('translator');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-xs font-medium text-cyan-300 transition"
                      >
                        <Languages className="w-3.5 h-3.5" />
                        <span>Translate Spec</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Architectural Material & Finish Schedule Board */}
              <div className="border-t border-slate-800 pt-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-white">
                    Curated Architectural Material &amp; Finish Schedule
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Click to include in brief or push directly to BOQ
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {MATERIAL_BOARD_SPECS.map((spec) => (
                    <div
                      key={spec.id}
                      className="rounded-xl bg-slate-950 border border-slate-800 p-3 flex flex-col justify-between gap-2.5"
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg border border-slate-700 shrink-0"
                          style={{ backgroundColor: spec.swatch }}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-white truncate">
                            {spec.name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                            {formatCurrency(spec.rate, currency)} / {spec.unit}
                          </div>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">{spec.specNote}</p>
                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => handleAppendMaterial(spec.name)}
                          className="flex-1 py-1.5 px-2 rounded-md bg-slate-900 border border-slate-800 hover:border-slate-600 text-[11px] font-medium text-slate-200 transition whitespace-nowrap"
                        >
                          Use in Render
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddMaterialBoardSpecToBoq(spec)}
                          className="py-1.5 px-2.5 rounded-md bg-slate-900 border border-slate-700 hover:border-amber-500/60 text-[11px] font-medium text-amber-300 transition whitespace-nowrap"
                        >
                          {addedFinishId === spec.id ? 'Added' : '+ BOQ'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SITE MEMO TRANSLATOR + VOICE PLAYBACK */}
          {activeTab === 'translator' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-6 space-y-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Multilingual Site Memo &amp; Spec Translator
                    </h3>
                    <p className="text-xs text-slate-400">
                      Translate structural, rebar, and curing instructions and play voice audio for site crews.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const topItems = boqItems
                        .slice(0, 4)
                        .map((i) => `${i.name} (${i.quantity} ${i.unit})`)
                        .join('; ');
                      setSourceMemoText(
                        `Project ${activeProject.name} (${activeProject.location}) active BOQ checklist: ${topItems}. Confirm site readiness before scheduling material delivery.`
                      );
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 hover:border-slate-500 text-xs font-medium text-slate-200 transition whitespace-nowrap"
                  >
                    Load BOQ Note
                  </button>
                </div>

                <div>
                  <span className="block text-[11px] font-medium text-slate-400 mb-1.5">
                    Site Supervisor Templates
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SITE_MEMO_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.label}
                        type="button"
                        onClick={() => setSourceMemoText(tpl.text)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-600 text-xs text-slate-300 hover:text-white transition whitespace-nowrap"
                      >
                        {tpl.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Site Instruction / Technical Note
                  </label>
                  <textarea
                    rows={5}
                    value={sourceMemoText}
                    onChange={(e) => setSourceMemoText(e.target.value)}
                    placeholder="Enter engineering memo, slab check note, or vendor delivery instruction..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 leading-relaxed focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Target Site Crew Language
                    </label>
                    <select
                      value={targetLang}
                      onChange={(e) => setTargetLang(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      {SITE_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code} className="bg-slate-900">
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    id="btn-translate-site-memo"
                    type="button"
                    disabled={isTranslating || !sourceMemoText.trim()}
                    onClick={handleTranslateMemo}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold text-xs transition whitespace-nowrap shrink-0"
                  >
                    {isTranslating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Translating...</span>
                      </>
                    ) : (
                      <>
                        <Languages className="w-3.5 h-3.5" />
                        <span>Translate Memo</span>
                      </>
                    )}
                  </button>
                </div>

                {translateError && (
                  <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
                    {translateError}
                  </p>
                )}
              </div>

              <div className="lg:col-span-6 rounded-xl bg-slate-950 border border-slate-800 p-4 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <span className="text-xs font-semibold text-white">
                      Translated Output · {selectedLangObj.short}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Technical Civil Terminology
                    </span>
                  </div>

                  {translatedMemo ? (
                    <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-100 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
                      {translatedMemo}
                    </div>
                  ) : (
                    <div className="p-8 rounded-lg border border-dashed border-slate-800 text-center space-y-1.5">
                      <Languages className="w-6 h-6 text-slate-500 mx-auto" />
                      <p className="text-xs text-slate-400">
                        Choose a regional language and click Translate Memo to prepare clear site instructions for foremen and contractors.
                      </p>
                    </div>
                  )}
                </div>

                {translatedMemo && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={handleSpeakTranslatedMemo}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-amber-500/60 text-xs font-medium text-amber-300 transition whitespace-nowrap"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isSpeakingTranslation ? 'Speaking...' : 'Play Audio'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(translatedMemo).catch(() => {});
                        setCopiedTranslation(true);
                        setTimeout(() => setCopiedTranslation(false), 2000);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs font-medium text-white transition whitespace-nowrap"
                    >
                      {copiedTranslation ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedTranslation ? 'Copied' : 'Copy Translation'}</span>
                    </button>

                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `[${activeProject.name}] ${translatedMemo}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition whitespace-nowrap"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Send to Site Supervisor</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: SMART BUILDING SKA IOT */}
          {activeTab === 'smart_building' && (
            <div className="space-y-3">
              <SmartHomeSkaAgent
                activeProject={activeProject}
                onOpenConsultation={() => {
                  onClose();
                  onNavigateTab('specialist');
                }}
              />
            </div>
          )}

          {/* TAB 7: COA FEE DESK & EXECUTIVE DOSSIER */}
          {activeTab === 'dossier' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-7 rounded-xl bg-slate-950 border border-slate-800 p-5 space-y-4">
                <div className="flex items-start justify-between gap-3 flex-wrap border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Architectural &amp; Turnkey Fee Desk
                    </h3>
                    <p className="text-xs text-slate-400">
                      CoA-aligned milestone fee modeling linked live to your project BOQ &amp; area.
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => setFeeMode('percent')}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition whitespace-nowrap ${
                        feeMode === 'percent' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      % of BOQ
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeeMode('per_sqft')}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition whitespace-nowrap ${
                        feeMode === 'per_sqft' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Per Sq.Ft
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">BOQ Subtotal</span>
                    <span className="text-sm font-bold text-white tabular-nums">
                      {formatCurrency(boqTotals.subtotal, currency)}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">Built-Up Area</span>
                    <span className="text-sm font-bold text-white tabular-nums">
                      {builtUpArea.toLocaleString()} sq.ft
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-amber-500/40">
                    <span className="text-[11px] text-amber-300 block">Total Consultancy Fee</span>
                    <span className="text-sm font-bold text-amber-300 tabular-nums">
                      {formatCurrency(consultancyFeeCalc.totalFee, currency)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  {feeMode === 'percent' ? (
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-300 font-medium">Consultancy Fee Rate</span>
                        <span className="font-mono font-bold text-amber-300 tabular-nums">{feePercent}%</span>
                      </div>
                      <input
                        type="range"
                        min={2}
                        max={12}
                        step={0.5}
                        value={feePercent}
                        onChange={(e) => setFeePercent(parseFloat(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Rate per Sq.Ft ({currency})
                      </label>
                      <input
                        type="number"
                        min={10}
                        value={feePerSqFt}
                        onChange={(e) => setFeePerSqFt(Math.max(10, Number(e.target.value) || 0))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white tabular-nums focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  )}

                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none sm:justify-end">
                    <input
                      type="checkbox"
                      checked={includeGst}
                      onChange={(e) => setIncludeGst(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 accent-amber-500"
                    />
                    <span>Include 18% GST ({formatCurrency(consultancyFeeCalc.gstAmount, currency)})</span>
                  </label>
                </div>

                <div className="space-y-1.5 pt-1">
                  <span className="block text-[11px] font-medium text-slate-400">
                    Stage-Wise Fee Schedule
                  </span>
                  <div className="divide-y divide-slate-800/80 rounded-lg border border-slate-800 bg-slate-900/60">
                    {COA_STAGES.map((st) => {
                      const stageAmount = Math.round((consultancyFeeCalc.totalFee * st.pct) / 100);
                      return (
                        <div key={st.stage} className="px-3 py-2 flex items-center justify-between text-xs gap-2">
                          <span className="text-slate-300 truncate">{st.stage}</span>
                          <div className="flex items-center gap-3 shrink-0 tabular-nums">
                            <span className="text-slate-500 font-mono">{st.pct}%</span>
                            <span className="font-semibold text-white">
                              {formatCurrency(stageAmount, currency)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <button
                    id="btn-add-fee-to-boq"
                    type="button"
                    onClick={handleAddFeeToBoq}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition whitespace-nowrap"
                  >
                    {addedFeeToBoq ? <Check className="w-3.5 h-3.5" /> : <PlusCircle className="w-3.5 h-3.5" />}
                    <span>{addedFeeToBoq ? 'Consultancy Fee Synced to BOQ' : 'Add Consultancy Fee to BOQ'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateTab('boq');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs font-medium text-slate-200 transition whitespace-nowrap"
                  >
                    <span>Open BOQ Table</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-4">
                <div className="rounded-xl bg-slate-950 border border-slate-800 p-5 space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-white">
                      Executive Project Dossier
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      One-click handover report with project specs, BOQ totals, team roster, and site audits.
                    </p>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Estimated Construction Total</span>
                      <span className="font-bold text-white tabular-nums">
                        {formatCurrency(boqTotals.grandTotal, currency)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Contingency Reserve</span>
                      <span className="font-mono text-slate-200 tabular-nums">{contingencyPercent}%</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>BOQ Line Items Included</span>
                      <span className="font-mono text-slate-200 tabular-nums">{boqItems.length}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Site Audits &amp; RFIs</span>
                      <span className="font-mono text-slate-200 tabular-nums">
                        {(activeProject.siteAudits?.length || 0)} audits · {(activeProject.fieldItems?.length || 0)} field items
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    <button
                      id="btn-download-dossier"
                      type="button"
                      onClick={handleDownloadDossier}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-amber-500/60 text-xs font-semibold text-white transition whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-400" />
                      <span>Export .MD</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(buildDossierMarkdown()).catch(() => {});
                        setCopiedDossier(true);
                        setTimeout(() => setCopiedDossier(false), 2000);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs font-semibold text-slate-200 transition whitespace-nowrap"
                    >
                      {copiedDossier ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedDossier ? 'Copied' : 'Copy Brief'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined') window.print();
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs font-semibold text-slate-200 transition whitespace-nowrap"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print</span>
                    </button>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-950 border border-slate-800 p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">BIM &amp; BOQ Studio License</h4>
                        <p className="text-[11px] text-slate-400">
                          {subscription.isSubscribed
                            ? `Active Pro Subscription · ID ${subscription.transactionId || 'Verified'}`
                            : 'Unlock unlimited IFC/DWG CAD extraction & BOQ exports'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    id="btn-open-bim-license-from-studio"
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenBimLicense();
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-slate-900 border border-slate-700 hover:border-amber-500/60 text-xs font-semibold text-amber-300 transition flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{subscription.isSubscribed ? 'View Subscription Details' : 'Activate BIM & BOQ Pro'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
