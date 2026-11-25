import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Sparkles,
  CheckSquare,
  Leaf,
  Coins,
  Copy,
  Check,
  Building,
  Camera,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Search,
  MapPin,
  ExternalLink,
  Phone,
  ShieldCheck,
  Bell,
  BellRing,
  CheckCircle2,
  X,
  Zap,
  BookOpen,
  FileText,
  Upload,
  Download,
  Table2,
  LayoutGrid,
  PlusCircle,
} from 'lucide-react';
import {
  MATERIAL_CATALOG,
  BUILDING_TYPOLOGY_CHECKLISTS,
  INITIAL_LIVE_MATERIAL_PRICES,
} from '../data/initialData';
import {
  Project,
  LiveMaterialPrice,
  GroundingSource,
  MaterialPriceAlertSubscription,
  MaterialPriceAlertItem,
  BOQItem,
} from '../types';
import { formatCurrency, CurrencyCode } from '../utils/formatters';
import { MaterialPriceAlertsPanel } from './MaterialPriceAlertsPanel';
import { MaterialAreaTakeoffView } from './MaterialAreaTakeoffView';
import { ConstructionMaterialsMasterGuideModal } from './ConstructionMaterialsMasterGuideModal';
import {
  MaterialPdfSpecUpdaterModal,
  ExtractedMaterialStandard,
} from './MaterialPdfSpecUpdaterModal';
import { getMasterGuideLivePrices } from '../data/constructionMaterialsGuide';
import { CivilWisdomFormulaMatrix } from './CivilWisdomFormulaMatrix';

interface MaterialsViewProps {
  activeProject: Project;
  currency: CurrencyCode;
  onNavigateToMarketplace?: (category?: string, query?: string) => void;
  boqItems?: BOQItem[];
  onUpdateBOQItems?: (items: BOQItem[]) => void;
  onUpdateProject?: (project: Project) => void;
  onNavigateToBOQ?: () => void;
  onOpenWorkflowEngine?: () => void;
}

export const MaterialsView: React.FC<MaterialsViewProps> = ({
  activeProject,
  currency,
  onNavigateToMarketplace,
  boqItems = [],
  onUpdateBOQItems,
  onUpdateProject,
  onNavigateToBOQ,
  onOpenWorkflowEngine,
}) => {
  const [activeSection, setActiveSection] = useState<
    'live-prices' | 'area-takeoff' | 'comparison' | 'checklists' | 'render'
  >('live-prices');
  const [matrixSubView, setMatrixSubView] = useState<'quick-formulas' | 'specifications'>(
    'quick-formulas'
  );
  const [rateViewMode, setRateViewMode] = useState<'table' | 'cards'>('table');
  const [showAlertsDrawer, setShowAlertsDrawer] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isPdfUpdaterOpen, setIsPdfUpdaterOpen] = useState(false);
  const [pdfSuccessBanner, setPdfSuccessBanner] = useState<string | null>(null);

  const handleApplyPdfStandards = (
    standards: ExtractedMaterialStandard,
    createdLivePrices?: LiveMaterialPrice[]
  ) => {
    if (createdLivePrices && createdLivePrices.length > 0) {
      setLivePrices((prev) => [...createdLivePrices, ...prev]);
    }
    setPdfSuccessBanner(
      `Standards updated with ${standards.brandName} (${standards.productVariants?.length || 0} product variants & IS codes imported).`
    );
    setTimeout(() => setPdfSuccessBanner(null), 6000);
  };

  const handleApplyCivilWisdomToTakeoff = (
    overrides: Record<string, { normPerSqFt: number; standardWastagePercent?: number }>,
    areaSqFt: number
  ) => {
    try {
      const existing = localStorage.getItem(`material_norms_${activeProject.id}`);
      const parsed = existing ? JSON.parse(existing) : {};
      const updated = { ...parsed, ...overrides };
      localStorage.setItem(`material_norms_${activeProject.id}`, JSON.stringify(updated));
    } catch (_e) {}

    if (onUpdateProject && areaSqFt !== activeProject.builtUpAreaSqFt) {
      onUpdateProject({
        ...activeProject,
        builtUpAreaSqFt: areaSqFt,
      });
    }
  };

  // Master Guide + Benchmark Material Rates
  const [livePrices, setLivePrices] = useState<LiveMaterialPrice[]>(() => {
    return [...getMasterGuideLivePrices(), ...INITIAL_LIVE_MATERIAL_PRICES];
  });
  const [liveRegion, setLiveRegion] = useState<string>('Bangalore / South India');
  const [selectedMaterialCategory, setSelectedMaterialCategory] = useState<string>('all');
  const [customMaterialQuery, setCustomMaterialQuery] = useState<string>('');
  const [marketTrendFilter, setMarketTrendFilter] = useState<'all' | 'up' | 'down'>('all');
  const [showSubscribedOnly, setShowSubscribedOnly] = useState<boolean>(false);
  const [isLoadingLivePrices, setIsLoadingLivePrices] = useState<boolean>(false);
  const [marketSummary, setMarketSummary] = useState<string>(
    'Regional procurement rates reflect firm cement dispatch with seasonal freight adjustments, steady primary TMT rebar supply, and elevated copper cable benchmarks.'
  );
  const [liveSources, setLiveSources] = useState<GroundingSource[]>([
    { title: 'SteelMint National Construction Rebar Index', uri: 'https://www.steelmint.com' },
    {
      title: 'Cement Manufacturers Association (CMA) Bulletin',
      uri: 'https://www.cmaindia.org',
    },
    { title: 'London Metal Exchange (LME) Non-Ferrous Index', uri: 'https://www.lme.com' },
  ]);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>(new Date().toISOString());
  const [quotaNotice, setQuotaNotice] = useState<string | null>(null);

  // Price Change Alert Subscriptions
  const [subscription, setSubscription] = useState<MaterialPriceAlertSubscription>(() => {
    try {
      const saved = localStorage.getItem('gouse_ai_material_alert_sub');
      if (saved) return JSON.parse(saved);
    } catch (_e) {}
    return {
      enabled: true,
      frequency: 'daily',
      channelEmail: true,
      channelInApp: true,
      recipientEmail: 'sgouse14@gmail.com',
      volatilityThresholdPercent: 1.5,
      subscribedMaterialIds: ['lmp-01', 'lmp-02', 'lmp-03', 'lmp-04'],
    };
  });

  const [recentAlerts, setRecentAlerts] = useState<MaterialPriceAlertItem[]>(() => {
    try {
      const saved = localStorage.getItem('gouse_ai_material_alert_history');
      if (saved) return JSON.parse(saved);
    } catch (_e) {}
    return [
      {
        id: 'alert-01',
        materialId: 'lmp-02',
        materialName: 'Fe550D Primary TMT Steel Rebar',
        category: 'Steel & Reinforcement',
        oldPrice: 72800,
        newPrice: 74500,
        unit: 'MT (Metric Tonne)',
        changePercent: 2.3,
        trend: 'up',
        trendReason:
          'Primary rebar rates adjusted upward following regional freight and billet revisions.',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        read: false,
      },
      {
        id: 'alert-02',
        materialId: 'lmp-01',
        materialName: 'OPC 53 Grade Portland Cement',
        category: 'Cement & Concrete',
        oldPrice: 392,
        newPrice: 385,
        unit: '50 kg bag',
        changePercent: -1.8,
        trend: 'down',
        trendReason: 'South regional dispatch discount active for bulk project orders.',
        timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
        read: false,
      },
    ];
  });

  const [alertFeedbackToast, setAlertFeedbackToast] = useState<string | null>(null);
  const [showDigestBanner, setShowDigestBanner] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem('gouse_ai_material_alert_sub', JSON.stringify(subscription));
    } catch (_e) {}
  }, [subscription]);

  useEffect(() => {
    try {
      localStorage.setItem('gouse_ai_material_alert_history', JSON.stringify(recentAlerts));
    } catch (_e) {}
  }, [recentAlerts]);

  const showToast = (msg: string) => {
    setAlertFeedbackToast(msg);
    setTimeout(() => setAlertFeedbackToast(null), 4000);
  };

  const handleUpdateSubscription = (updated: Partial<MaterialPriceAlertSubscription>) => {
    setSubscription((prev) => {
      const next = { ...prev, ...updated };
      if (updated.enabled !== undefined) {
        showToast(
          updated.enabled
            ? `Price change alerts enabled for ${next.subscribedMaterialIds.length} materials.`
            : 'Price change notifications paused.'
        );
      }
      return next;
    });
  };

  const handleToggleMaterialTracked = (materialId: string) => {
    const isTracked = subscription.subscribedMaterialIds.includes(materialId);
    const mat = livePrices.find((m) => m.id === materialId);
    const matName = mat ? mat.name : 'Material';

    setSubscription((prev) => {
      const nextIds = isTracked
        ? prev.subscribedMaterialIds.filter((id) => id !== materialId)
        : [...prev.subscribedMaterialIds, materialId];
      showToast(
        isTracked
          ? `Removed ${matName} from price watchlist.`
          : `Added ${matName} to price watchlist.`
      );
      return {
        ...prev,
        enabled: isTracked ? prev.enabled : true,
        subscribedMaterialIds: nextIds,
      };
    });
  };

  const handleDismissAlert = (alertId: string) => {
    setRecentAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  const handleClearAllAlerts = () => {
    setRecentAlerts([]);
  };

  const handleTriggerTestAlert = () => {
    const trackedItems = livePrices.filter((m) =>
      subscription.subscribedMaterialIds.includes(m.id)
    );
    const pool = trackedItems.length > 0 ? trackedItems : livePrices.slice(0, 3);

    const newAlerts: MaterialPriceAlertItem[] = pool.slice(0, 3).map((item, idx) => {
      const shiftPercent = (idx % 2 === 0 ? 1 : -1) * (1.2 + idx * 0.6);
      const oldPrice = Math.round(item.currentPrice / (1 + shiftPercent / 100));
      return {
        id: `alert-${Date.now()}-${idx}`,
        materialId: item.id,
        materialName: item.name,
        category: item.category,
        oldPrice,
        newPrice: item.currentPrice,
        unit: item.unit,
        changePercent: Number(shiftPercent.toFixed(1)),
        trend: shiftPercent > 0 ? 'up' : 'down',
        trendReason: item.trendReason || `Regional rate revision logged in ${liveRegion}`,
        timestamp: new Date().toISOString(),
        read: false,
      };
    });

    setRecentAlerts((prev) => [...newAlerts, ...prev].slice(0, 20));
    setShowDigestBanner(true);
    showToast(`Rate digest sent to ${subscription.recipientEmail} (${newAlerts.length} updates).`);
  };

  // Rate summary metrics
  const rateMetrics = useMemo(() => {
    let risingCount = 0;
    let softeningCount = 0;
    let totalRise = 0;

    livePrices.forEach((m) => {
      if (m.trend === 'up' || m.changePercent > 0) {
        risingCount++;
        totalRise += Math.abs(m.changePercent);
      } else {
        softeningCount++;
      }
    });

    const avgRise = risingCount > 0 ? (totalRise / risingCount).toFixed(1) : '0.0';
    return {
      totalCount: livePrices.length,
      risingCount,
      softeningCount,
      avgRise,
    };
  }, [livePrices]);

  // BOQ Rate Sync Helper
  const findMatchingBoqIndex = (mat: LiveMaterialPrice) => {
    const byId = boqItems.findIndex((b) => b.id === `boq-mat-${mat.id}`);
    if (byId >= 0) return byId;
    const prefix = mat.name.toLowerCase().split('(')[0].trim();
    const keywords = prefix.split(/\s+/).slice(0, 2).join(' ');
    return boqItems.findIndex(
      (b) =>
        b.name.toLowerCase().includes(prefix) ||
        (keywords.length > 4 && b.name.toLowerCase().includes(keywords))
    );
  };

  const handleSyncMaterialToBoq = (mat: LiveMaterialPrice) => {
    if (!onUpdateBOQItems) return;
    const idx = findMatchingBoqIndex(mat);
    const updatedBoq = [...boqItems];

    if (idx >= 0) {
      const existing = updatedBoq[idx];
      updatedBoq[idx] = {
        ...existing,
        rate: mat.currentPrice,
        amount: Math.round((existing.quantity || 1) * mat.currentPrice),
        notes: `${existing.notes ? existing.notes + ' · ' : ''}Rate updated from Materials & Rates (${liveRegion}).`,
      };
      onUpdateBOQItems(updatedBoq);
      showToast(`Updated "${existing.name}" in BOQ to ${formatCurrency(mat.currentPrice, currency)} / ${mat.unit}.`);
    } else {
      const catLower = mat.category.toLowerCase();
      const nameLower = mat.name.toLowerCase();
      const stageGuess: BOQItem['stage'] =
        catLower.includes('plumb') ||
        catLower.includes('electr') ||
        nameLower.includes('lighting') ||
        nameLower.includes('downlight') ||
        nameLower.includes('sanitary') ||
        nameLower.includes('cistern')
          ? 'Services'
          : catLower.includes('finish') ||
            catLower.includes('paint') ||
            catLower.includes('tile') ||
            catLower.includes('interior') ||
            catLower.includes('millwork')
          ? 'Finishes'
          : 'Superstructure';

      const newLine: BOQItem = {
        id: `boq-mat-${mat.id}`,
        name: `${mat.name} (${mat.brands[0] || 'Approved Brand'})`,
        category: mat.category,
        unit: mat.unit,
        quantity: 1,
        rate: mat.currentPrice,
        amount: mat.currentPrice,
        notes: `Added from Materials & Rates directory (${liveRegion}).`,
        stage: stageGuess,
        status: 'estimated',
      };
      onUpdateBOQItems([...updatedBoq, newLine]);
      showToast(`Added "${mat.name}" to Project BOQ at ${formatCurrency(mat.currentPrice, currency)} / ${mat.unit}.`);
    }
  };

  // Export Rate Sheet to CSV
  const handleExportCsv = () => {
    const headers = [
      'Material Name',
      'Category',
      'Approved Brands',
      'Unit',
      'Min Rate (INR)',
      'Spot Rate (INR)',
      'Max Rate (INR)',
      '30d Trend %',
      'Market Hub',
      'Notes',
    ];

    const escapeCsv = (val: string | number) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = displayedLivePrices.map((m) => [
      escapeCsv(m.name),
      escapeCsv(m.category),
      escapeCsv(m.brands.join(' / ')),
      escapeCsv(m.unit),
      escapeCsv(m.minPrice),
      escapeCsv(m.currentPrice),
      escapeCsv(m.maxPrice),
      escapeCsv(`${m.changePercent > 0 ? '+' : ''}${m.changePercent}%`),
      escapeCsv(m.location || liveRegion),
      escapeCsv(m.marketNotes || m.trendReason || ''),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeProject.name.replace(/\s+/g, '_')}_Material_Rates.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Exported ${displayedLivePrices.length} material rates to CSV.`);
  };

  // Fetch Live Prices via Grounded API
  const fetchLivePrices = async (
    overrideRegion?: string,
    overrideCat?: string,
    overrideQuery?: string
  ) => {
    setIsLoadingLivePrices(true);
    const reg = overrideRegion !== undefined ? overrideRegion : liveRegion;
    const cat = overrideCat !== undefined ? overrideCat : selectedMaterialCategory;
    const query = overrideQuery !== undefined ? overrideQuery : customMaterialQuery;

    try {
      const res = await fetch('/api/materials/live-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: reg,
          category: cat,
          customQuery: query,
        }),
      });

      if (!res.ok) throw new Error('Failed to fetch live prices');

      const data = await res.json();
      if (data.prices && data.prices.length > 0) {
        const guidePrices = getMasterGuideLivePrices();
        const incomingIds = new Set(data.prices.map((p: LiveMaterialPrice) => p.id));
        const filteredGuide = guidePrices.filter((g) => !incomingIds.has(g.id));
        setLivePrices([...filteredGuide, ...data.prices]);
      }
      if (data.marketSummary) setMarketSummary(data.marketSummary);
      if (data.sources && data.sources.length > 0) setLiveSources(data.sources);
      setQuotaNotice(data.quotaNotice || null);
      setLastRefreshedAt(new Date().toISOString());
    } catch {
      setQuotaNotice('Showing verified Master Guide & regional benchmark material rates.');
    } finally {
      setIsLoadingLivePrices(false);
    }
  };

  const displayedLivePrices = useMemo(() => {
    let list = livePrices;
    if (showSubscribedOnly) {
      list = list.filter((p) => subscription.subscribedMaterialIds.includes(p.id));
    }
    if (marketTrendFilter === 'up') {
      list = list.filter((p) => p.trend === 'up' || p.changePercent > 0);
    } else if (marketTrendFilter === 'down') {
      list = list.filter((p) => p.trend === 'down' || p.changePercent < 0);
    }
    if (selectedMaterialCategory !== 'all') {
      list = list.filter((p) =>
        p.category.toLowerCase().includes(selectedMaterialCategory.toLowerCase())
      );
    }
    if (customMaterialQuery.trim()) {
      const q = customMaterialQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.brands.some((b) => b.toLowerCase().includes(q))
      );
    }
    return list;
  }, [
    livePrices,
    selectedMaterialCategory,
    customMaterialQuery,
    showSubscribedOnly,
    marketTrendFilter,
    subscription.subscribedMaterialIds,
  ]);

  // Matrix & Calculator state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFloorFilter, setSelectedFloorFilter] = useState<string>('all');
  const [matrixSearchQuery, setMatrixSearchQuery] = useState<string>('');
  const [calcMaterialId, setCalcMaterialId] = useState<string>(MATERIAL_CATALOG[0].id);
  const [calcQuantity, setCalcQuantity] = useState<number>(100);

  // Checklists state
  const typologies = Object.keys(BUILDING_TYPOLOGY_CHECKLISTS);
  const [selectedTypology, setSelectedTypology] = useState<string>(typologies[0]);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Render Prompt Studio state
  const [renderDesc, setRenderDesc] = useState(
    activeProject.description ||
      'Tropical contemporary residence with courtyard, exposed board-marked concrete, and teak louvers'
  );
  const [renderStyle, setRenderStyle] = useState('photorealistic architectural photography');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const calcMaterial =
    MATERIAL_CATALOG.find((m) => m.id === calcMaterialId) || MATERIAL_CATALOG[0];
  const totalCost = calcQuantity * calcMaterial.estimatedRate;
  const totalCarbon = calcQuantity * calcMaterial.embodiedCarbonKg;

  const currentChecklist = BUILDING_TYPOLOGY_CHECKLISTS[selectedTypology] || [];
  const checkedCount = currentChecklist.filter(
    (_, idx) => checkedItems[`${selectedTypology}-${idx}`]
  ).length;
  const checklistProgress =
    currentChecklist.length > 0 ? Math.round((checkedCount / currentChecklist.length) * 100) : 0;

  const toggleCheck = (idx: number) => {
    const key = `${selectedTypology}-${idx}`;
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGenerateRenderPrompt = async () => {
    if (!renderDesc.trim()) return;
    setIsGeneratingPrompt(true);

    try {
      const res = await fetch('/api/architecture/render-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: renderDesc,
          style: renderStyle,
        }),
      });
      const data = await res.json();
      setGeneratedPrompt(data.prompt);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleCopyPrompt = () => {
    if (!generatedPrompt) return;
    navigator.clipboard.writeText(generatedPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const matrixCategories = useMemo(() => {
    const cats = Array.from(new Set(MATERIAL_CATALOG.map((m) => m.category)));
    return ['all', ...cats];
  }, []);

  const filteredMaterials = useMemo(() => {
    return MATERIAL_CATALOG.filter((m) => {
      const matchesCat = selectedCategory === 'all' || m.category === selectedCategory;
      const matchesFloor =
        selectedFloorFilter === 'all' ||
        (m.applicableFloors && m.applicableFloors.includes(selectedFloorFilter));
      const q = matrixSearchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.bestUse.toLowerCase().includes(q) ||
        (m.floorNotes && m.floorNotes.toLowerCase().includes(q)) ||
        (m.applicableFloors && m.applicableFloors.some((f) => f.toLowerCase().includes(q))) ||
        m.pros.some((p) => p.toLowerCase().includes(q));
      return matchesCat && matchesFloor && matchesSearch;
    });
  }, [selectedCategory, selectedFloorFilter, matrixSearchQuery]);

  return (
    <div id="materials-standards-view" className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Clean Executive Header + Tab Bar */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 px-5 pt-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Materials &amp; Rates
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Approved regional material rates, quantity takeoffs, IS code benchmarks, and BOQ syncing for{' '}
              <span className="text-slate-200 font-medium">{activeProject.name}</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              id="btn-open-master-materials-guide"
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Master Guide</span>
            </button>

            <button
              id="btn-open-pdf-spec-updater"
              type="button"
              onClick={() => setIsPdfUpdaterOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
              title="Import datasheet PDF to update material rates and IS standards"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Import PDF Specs</span>
            </button>

            {onOpenWorkflowEngine && (
              <button
                id="btn-materials-open-workflow-engine"
                type="button"
                onClick={onOpenWorkflowEngine}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Workflow Engine</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Single-Line Section Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto border-t border-slate-800 pt-1">
          {[
            { id: 'live-prices' as const, htmlId: 'tab-live-prices', label: 'Spot Rates & Directory', icon: Coins },
            { id: 'area-takeoff' as const, htmlId: 'tab-area-takeoff', label: 'Area Takeoff & Quantities', icon: Zap },
            { id: 'comparison' as const, htmlId: 'tab-comparison', label: 'Formulas & Specifications', icon: Layers },
            { id: 'checklists' as const, htmlId: 'tab-checklists', label: 'Typology Checklists', icon: CheckSquare },
            { id: 'render' as const, htmlId: 'tab-render', label: 'Render Prompts', icon: Camera },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                id={tab.htmlId}
                type="button"
                onClick={() => setActiveSection(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback & PDF Success Toasts */}
      {pdfSuccessBanner && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{pdfSuccessBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setPdfSuccessBanner(null)}
            className="text-emerald-300 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {alertFeedbackToast && (
        <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-xs text-amber-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{alertFeedbackToast}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {onNavigateToBOQ && (
              <button
                type="button"
                onClick={onNavigateToBOQ}
                className="text-amber-300 hover:underline font-semibold"
              >
                Open BOQ
              </button>
            )}
            <button
              type="button"
              onClick={() => setAlertFeedbackToast(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 1: SPOT RATES & DIRECTORY                                         */}
      {/* ===================================================================== */}
      {activeSection === 'live-prices' && (
        <div className="space-y-5">
          {/* Executive Rate KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400">Cataloged Materials</div>
              <div className="text-xl font-bold text-white tabular-nums">
                {rateMetrics.totalCount}
              </div>
              <div className="text-xs text-slate-400 truncate">{liveRegion}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400">Rising This Month</div>
              <div className="text-xl font-bold text-emerald-400 tabular-nums">
                {rateMetrics.risingCount}
              </div>
              <div className="text-xs text-slate-400 tabular-nums">
                Avg +{rateMetrics.avgRise}% movement
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400">Softening or Stable</div>
              <div className="text-xl font-bold text-white tabular-nums">
                {rateMetrics.softeningCount}
              </div>
              <div className="text-xs text-slate-400">Favorable for bulk procurement</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-xs text-slate-400">Rate Watchlist</div>
                <div className="text-xl font-bold text-amber-400 tabular-nums">
                  {subscription.subscribedMaterialIds.length} tracked
                </div>
                <div className="text-xs text-slate-400 tabular-nums">
                  {recentAlerts.length} recent alerts
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAlertsDrawer(!showAlertsDrawer)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
              >
                {showAlertsDrawer ? 'Hide Alerts' : 'Manage Alerts'}
              </button>
            </div>
          </div>

          {/* Optional Digest Preview Strip */}
          {showDigestBanner && recentAlerts.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-900 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <BellRing className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-slate-200">
                  Latest rate digest: <strong>{recentAlerts[0].materialName}</strong> moved{' '}
                  <span
                    className={
                      recentAlerts[0].trend === 'up' ? 'text-emerald-400' : 'text-rose-400'
                    }
                  >
                    {recentAlerts[0].changePercent > 0 ? '+' : ''}
                    {recentAlerts[0].changePercent}%
                  </span>{' '}
                  ({formatCurrency(recentAlerts[0].newPrice, currency)} / {recentAlerts[0].unit}).
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAlertsDrawer(true)}
                  className="text-amber-300 hover:underline font-medium"
                >
                  View all ({recentAlerts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setShowDigestBanner(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Collapsible Price Alerts Settings Drawer */}
          {showAlertsDrawer && (
            <MaterialPriceAlertsPanel
              subscription={subscription}
              onUpdateSubscription={handleUpdateSubscription}
              materials={livePrices}
              onToggleMaterialTracked={handleToggleMaterialTracked}
              recentAlerts={recentAlerts}
              onDismissAlert={handleDismissAlert}
              onClearAllAlerts={handleClearAllAlerts}
              onTriggerTestAlert={handleTriggerTestAlert}
            />
          )}

          {/* Unified Filter & Action Toolbar */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Region */}
              <div className="md:col-span-4 space-y-1">
                <label className="block text-xs font-medium text-slate-300">
                  Procurement Market / Region
                </label>
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <select
                    id="select-market-region"
                    value={liveRegion}
                    onChange={(e) => {
                      setLiveRegion(e.target.value);
                      fetchLivePrices(
                        e.target.value,
                        selectedMaterialCategory,
                        customMaterialQuery
                      );
                    }}
                    className="w-full bg-transparent text-white focus:outline-none"
                  >
                    <option value="Bangalore / South India">Bangalore / South India</option>
                    <option value="Mumbai / MMR Region">Mumbai / MMR Region</option>
                    <option value="Delhi NCR / North Region">Delhi NCR / North Region</option>
                    <option value="Hyderabad / Telangana Hub">Hyderabad / Telangana Hub</option>
                    <option value="Chennai / Tamil Nadu">Chennai / Tamil Nadu</option>
                    <option value="Pune / Western Corridor">Pune / Western Corridor</option>
                    <option value="Kolkata / East Hub">Kolkata / East Hub</option>
                  </select>
                </div>
              </div>

              {/* Category */}
              <div className="md:col-span-4 space-y-1">
                <label className="block text-xs font-medium text-slate-300">
                  Material Category
                </label>
                <select
                  id="select-material-category"
                  value={selectedMaterialCategory}
                  onChange={(e) => setSelectedMaterialCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="all">All Material Categories</option>
                  <option value="Interior">All Interior &amp; Fit-Out Items</option>
                  <option value="Interior & Millwork">Interior &amp; Millwork (Plywood, HDHMR, Ceiling)</option>
                  <option value="Interior Finishes & Lighting">Interior Finishes, Quartz, Lighting &amp; Bath</option>
                  <option value="Cement & Concrete">Cement &amp; Concrete</option>
                  <option value="Steel & Reinforcement">Steel &amp; Reinforcement (TMT)</option>
                  <option value="Sand & Aggregates">Sand &amp; Aggregates (M-Sand)</option>
                  <option value="Blocks & Bricks">Blocks &amp; Bricks (AAC &amp; Clay)</option>
                  <option value="Glass & Fenestration">Glass &amp; Glazing (Low-E)</option>
                  <option value="Plumbing & MEP">Plumbing &amp; Electrical (CPVC, FRLS)</option>
                  <option value="Finishes & Coatings">Finishes, Paints &amp; Waterproofing</option>
                </select>
              </div>

              {/* Search */}
              <div className="md:col-span-4 space-y-1">
                <label className="block text-xs font-medium text-slate-300">
                  Search Material or Brand
                </label>
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="e.g. UltraTech, Fe550D, AAC, Birla..."
                    value={customMaterialQuery}
                    onChange={(e) => setCustomMaterialQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        fetchLivePrices(
                          liveRegion,
                          selectedMaterialCategory,
                          customMaterialQuery
                        );
                      }
                    }}
                    className="w-full bg-transparent text-white focus:outline-none placeholder-slate-500"
                  />
                  {customMaterialQuery && (
                    <button
                      type="button"
                      onClick={() => setCustomMaterialQuery('')}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Filter & View Switch Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-950 border border-slate-800">
                  {(
                    [
                      { id: 'all', label: `All (${livePrices.length})` },
                      { id: 'up', label: `Rising (${rateMetrics.risingCount})` },
                      { id: 'down', label: `Softening (${rateMetrics.softeningCount})` },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setMarketTrendFilter(f.id)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        marketTrendFilter === f.id
                          ? 'bg-amber-500 text-slate-950 font-semibold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedMaterialCategory(
                      selectedMaterialCategory === 'Interior' ? 'all' : 'Interior'
                    )
                  }
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border whitespace-nowrap shrink-0 ${
                    selectedMaterialCategory.toLowerCase().includes('interior')
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-semibold'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Interior Rates</span>
                </button>

                <button
                  type="button"
                  id="filter-tracked-subscriptions-only"
                  onClick={() => setShowSubscribedOnly(!showSubscribedOnly)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border whitespace-nowrap shrink-0 ${
                    showSubscribedOnly
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-semibold'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <BellRing className="w-3.5 h-3.5" />
                  <span>Watchlist ({subscription.subscribedMaterialIds.length})</span>
                </button>

                {(customMaterialQuery ||
                  selectedMaterialCategory !== 'all' ||
                  showSubscribedOnly ||
                  marketTrendFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMaterialCategory('all');
                      setCustomMaterialQuery('');
                      setShowSubscribedOnly(false);
                      setMarketTrendFilter('all');
                    }}
                    className="text-xs text-slate-400 hover:text-white underline"
                  >
                    Reset filters
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <span className="text-xs text-slate-400 tabular-nums">
                  {displayedLivePrices.length} items · Updated{' '}
                  {new Date(lastRefreshedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>

                <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-950 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setRateViewMode('table')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      rateViewMode === 'table'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Table2 className="w-3.5 h-3.5" />
                    <span>Table</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRateViewMode('cards')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      rateViewMode === 'cards'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Cards</span>
                  </button>
                </div>

                <button
                  id="btn-refresh-live-prices"
                  type="button"
                  onClick={() => fetchLivePrices()}
                  disabled={isLoadingLivePrices}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-medium transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isLoadingLivePrices ? 'animate-spin' : ''}`}
                  />
                  <span>{isLoadingLivePrices ? 'Updating...' : 'Refresh Rates'}</span>
                </button>
              </div>
            </div>
          </div>

          {quotaNotice && (
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{quotaNotice}</span>
            </div>
          )}

          {/* TABLE VIEW (Default — Clean, Fast Rate Scanning) */}
          {displayedLivePrices.length > 0 && rateViewMode === 'table' && (
            <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                      <th className="py-3 pl-4 pr-3 font-medium whitespace-nowrap">
                        Material &amp; Category
                      </th>
                      <th className="py-3 px-3 font-medium whitespace-nowrap">Approved Brands</th>
                      <th className="py-3 px-3 font-medium whitespace-nowrap">Unit</th>
                      <th className="py-3 px-3 font-medium text-right whitespace-nowrap">
                        Market Range
                      </th>
                      <th className="py-3 px-3 font-medium text-right whitespace-nowrap">
                        Spot Rate ({currency})
                      </th>
                      <th className="py-3 px-3 font-medium text-right whitespace-nowrap">
                        30d Trend
                      </th>
                      <th className="py-3 pl-3 pr-4 font-medium text-right whitespace-nowrap">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {displayedLivePrices.map((mat) => {
                      const isUp = mat.trend === 'up' || mat.changePercent > 0;
                      const isDown = mat.trend === 'down' || mat.changePercent < 0;
                      const isTracked = subscription.subscribedMaterialIds.includes(mat.id);
                      const inBoq = findMatchingBoqIndex(mat) >= 0;

                      return (
                        <tr
                          key={mat.id}
                          id={`live-price-${mat.id}`}
                          className="hover:bg-slate-800/35 transition-colors"
                        >
                          <td className="py-3 pl-4 pr-3 min-w-[220px]">
                            <div className="font-semibold text-white">{mat.name}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {mat.category}
                              {mat.location ? ` · ${mat.location}` : ''}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-300 max-w-[220px]">
                            <div className="truncate" title={mat.brands.join(', ')}>
                              {mat.brands.slice(0, 3).join(', ')}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                            {mat.unit}
                          </td>
                          <td className="py-3 px-3 text-right text-slate-400 tabular-nums whitespace-nowrap">
                            {formatCurrency(mat.minPrice, currency)} –{' '}
                            {formatCurrency(mat.maxPrice, currency)}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-white tabular-nums whitespace-nowrap">
                            {formatCurrency(mat.currentPrice, currency)}
                          </td>
                          <td className="py-3 px-3 text-right tabular-nums whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 font-semibold ${
                                isUp
                                  ? 'text-emerald-400'
                                  : isDown
                                  ? 'text-rose-400'
                                  : 'text-slate-400'
                              }`}
                            >
                              {isUp ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : isDown ? (
                                <TrendingDown className="w-3 h-3" />
                              ) : (
                                <Minus className="w-3 h-3" />
                              )}
                              <span>
                                {mat.changePercent > 0
                                  ? `+${mat.changePercent}%`
                                  : `${mat.changePercent}%`}
                              </span>
                            </span>
                          </td>
                          <td className="py-3 pl-3 pr-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              {onUpdateBOQItems && (
                                <button
                                  type="button"
                                  onClick={() => handleSyncMaterialToBoq(mat)}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                                    inBoq
                                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold'
                                  }`}
                                >
                                  <PlusCircle className="w-3 h-3" />
                                  <span>{inBoq ? 'Update BOQ' : 'Sync to BOQ'}</span>
                                </button>
                              )}

                              <button
                                type="button"
                                id={`toggle-alert-${mat.id}`}
                                onClick={() => handleToggleMaterialTracked(mat.id)}
                                title={
                                  isTracked ? 'Remove from watchlist' : 'Add to price watchlist'
                                }
                                className={`p-1.5 rounded-lg border transition-colors ${
                                  isTracked
                                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                {isTracked ? (
                                  <BellRing className="w-3.5 h-3.5" />
                                ) : (
                                  <Bell className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {onNavigateToMarketplace && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onNavigateToMarketplace('material_supplier', mat.name)
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                                >
                                  <Phone className="w-3 h-3 text-amber-400" />
                                  <span>Suppliers</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CARD GRID VIEW (Optional Detailed View) */}
          {displayedLivePrices.length > 0 && rateViewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedLivePrices.map((mat) => {
                const isUp = mat.trend === 'up' || mat.changePercent > 0;
                const isDown = mat.trend === 'down' || mat.changePercent < 0;
                const isTracked = subscription.subscribedMaterialIds.includes(mat.id);
                const inBoq = findMatchingBoqIndex(mat) >= 0;

                return (
                  <div
                    key={mat.id}
                    id={`live-price-${mat.id}`}
                    className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs text-slate-400">{mat.category}</div>
                          <h4 className="text-sm font-bold text-white mt-0.5">{mat.name}</h4>
                        </div>
                        <button
                          type="button"
                          id={`toggle-alert-${mat.id}`}
                          onClick={() => handleToggleMaterialTracked(mat.id)}
                          title={isTracked ? 'Remove from watchlist' : 'Add to watchlist'}
                          className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
                            isTracked
                              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {isTracked ? (
                            <BellRing className="w-3.5 h-3.5" />
                          ) : (
                            <Bell className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-baseline justify-between gap-2 pt-1 border-t border-slate-800/80">
                        <div>
                          <div className="text-2xl font-bold text-white tabular-nums">
                            {formatCurrency(mat.currentPrice, currency)}
                          </div>
                          <div className="text-xs text-slate-400 tabular-nums">
                            per {mat.unit} · Range {formatCurrency(mat.minPrice, currency)}–
                            {formatCurrency(mat.maxPrice, currency)}
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold tabular-nums ${
                            isUp
                              ? 'text-emerald-400'
                              : isDown
                              ? 'text-rose-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {isUp ? (
                            <TrendingUp className="w-3.5 h-3.5" />
                          ) : isDown ? (
                            <TrendingDown className="w-3.5 h-3.5" />
                          ) : (
                            <Minus className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {mat.changePercent > 0 ? `+${mat.changePercent}%` : `${mat.changePercent}%`}
                          </span>
                        </span>
                      </div>

                      <div className="text-xs text-slate-300">
                        <span className="text-slate-400">Approved Brands: </span>
                        {mat.brands.join(', ')}
                      </div>

                      {(mat.marketNotes || mat.trendReason) && (
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                          {mat.marketNotes || mat.trendReason}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      {onUpdateBOQItems && (
                        <button
                          type="button"
                          onClick={() => handleSyncMaterialToBoq(mat)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                            inBoq
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold'
                          }`}
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>{inBoq ? 'Update BOQ' : 'Sync to BOQ'}</span>
                        </button>
                      )}
                      {onNavigateToMarketplace && (
                        <button
                          type="button"
                          onClick={() =>
                            onNavigateToMarketplace('material_supplier', mat.name)
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                        >
                          <Phone className="w-3.5 h-3.5 text-amber-400" />
                          <span>Suppliers</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {displayedLivePrices.length === 0 && (
            <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-3">
              <Search className="w-8 h-8 text-slate-500 mx-auto" />
              <h4 className="text-sm font-bold text-white">No Materials Match Your Filters</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Clear the search or watchlist filter to view all cataloged construction materials.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedMaterialCategory('all');
                  setCustomMaterialQuery('');
                  setShowSubscribedOnly(false);
                  setMarketTrendFilter('all');
                }}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors"
              >
                Show All Materials
              </button>
            </div>
          )}

          {/* Compact Market Commentary & Sources Footer */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs">
            <div className="space-y-1 max-w-2xl">
              <div className="font-semibold text-amber-400">
                Regional Market Summary · {liveRegion}
              </div>
              <p className="text-slate-300 leading-relaxed">{marketSummary}</p>
            </div>
            {liveSources.length > 0 && (
              <div className="flex flex-wrap gap-2 shrink-0">
                {liveSources.map((src, i) => (
                  <a
                    key={i}
                    href={src.uri}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-amber-300 transition-colors"
                  >
                    <span>{src.title}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: AREA TAKEOFF & QUANTITIES                                      */}
      {/* ===================================================================== */}
      {activeSection === 'area-takeoff' && (
        <MaterialAreaTakeoffView
          activeProject={activeProject}
          currency={currency}
          boqItems={boqItems}
          onUpdateBOQItems={onUpdateBOQItems}
          onUpdateProject={onUpdateProject}
          onNavigateToBOQ={onNavigateToBOQ}
        />
      )}

      {/* ===================================================================== */}
      {/* TAB 3: FORMULAS & SPECIFICATIONS                                      */}
      {/* ===================================================================== */}
      {activeSection === 'comparison' && (
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Standard Material Matrix &amp; Quick Estimation Formulas
              </h3>
              <p className="text-xs text-slate-400">
                Empirical estimation ratios (cement, steel, masonry, aggregates) and embodied carbon benchmarks.
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-950 border border-slate-800 text-xs shrink-0">
              <button
                type="button"
                id="btn-subtab-quick-formulas"
                onClick={() => setMatrixSubView('quick-formulas')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap shrink-0 ${
                  matrixSubView === 'quick-formulas'
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Quick Formulas</span>
              </button>
              <button
                type="button"
                id="btn-subtab-specifications"
                onClick={() => setMatrixSubView('specifications')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap shrink-0 ${
                  matrixSubView === 'specifications'
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Specs &amp; Carbon</span>
              </button>
            </div>
          </div>

          {matrixSubView === 'quick-formulas' && (
            <div className="space-y-4">
              <CivilWisdomFormulaMatrix
                initialAreaSqFt={activeProject.builtUpAreaSqFt || 3599}
                currency={currency}
                project={activeProject}
                boqItems={boqItems}
                onUpdateBOQItems={onUpdateBOQItems}
                onUpdateProject={onUpdateProject}
                onApplyToTakeoff={handleApplyCivilWisdomToTakeoff}
                onNavigateToBOQ={onNavigateToBOQ}
                onNavigateToAreaTakeoff={() => setActiveSection('area-takeoff')}
              />

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 text-slate-300">
                  <Building className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Need floor-by-floor quantities (Substructure, Ground, First, Second, Terrace)?
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSection('area-takeoff')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Open Floor Area Takeoff</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {matrixSubView === 'specifications' && (
            <div className="space-y-5">
              {/* Quick Cost & Carbon Calculator */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Material</label>
                  <select
                    value={calcMaterialId}
                    onChange={(e) => setCalcMaterialId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    {MATERIAL_CATALOG.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Quantity ({calcMaterial.unit})
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={calcQuantity}
                    onChange={(e) => setCalcQuantity(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white tabular-nums focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Estimated Material Cost</div>
                  <div className="text-lg font-bold text-amber-400 tabular-nums">
                    {formatCurrency(totalCost, currency)}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Leaf className="w-3 h-3 text-emerald-400" />
                    <span>Embodied Carbon</span>
                  </div>
                  <div className="text-lg font-bold text-emerald-400 tabular-nums">
                    {totalCarbon.toLocaleString()} kg CO2e
                  </div>
                </div>
              </div>

              {/* Filter & Search */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search specifications (Paint, Putty, Rebar, Block...)"
                      value={matrixSearchQuery}
                      onChange={(e) => setMatrixSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                    {matrixSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setMatrixSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 tabular-nums">
                    Showing <strong className="text-white">{filteredMaterials.length}</strong> of{' '}
                    {MATERIAL_CATALOG.length} specifications
                  </div>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {matrixCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors border ${
                        selectedCategory === cat
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-semibold'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {cat === 'all' ? `All (${MATERIAL_CATALOG.length})` : cat}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {[
                    'all',
                    'Substructure',
                    'Ground Floor',
                    'First Floor',
                    'Second Floor',
                    'Terrace & Roof',
                  ].map((fl) => (
                    <button
                      key={fl}
                      type="button"
                      onClick={() => setSelectedFloorFilter(fl)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors border ${
                        selectedFloorFilter === fl
                          ? 'bg-slate-800 text-amber-300 border-amber-500/40'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {fl === 'all' ? 'All Floors' : fl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Specifications Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMaterials.map((mat) => (
                  <div
                    key={mat.id}
                    className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-slate-400">{mat.category}</div>
                        <h4 className="text-sm font-bold text-white mt-0.5">{mat.name}</h4>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/80">
                        <div>
                          <div className="text-slate-400">Benchmark Rate</div>
                          <div className="font-semibold text-amber-400 tabular-nums">
                            {formatCurrency(mat.estimatedRate, currency)} / {mat.unit}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400">Embodied Carbon</div>
                          <div className="font-semibold text-emerald-400 tabular-nums">
                            {mat.embodiedCarbonKg} kg CO2e
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400">Durability</div>
                          <div className="font-semibold text-slate-200 tabular-nums">
                            {mat.durabilityYears} Years
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400">Thermal U-Value</div>
                          <div className="font-semibold text-sky-400 tabular-nums">
                            {mat.uValue} W/m2K
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">{mat.bestUse}</p>

                      {mat.applicableFloors && mat.applicableFloors.length > 0 && (
                        <div className="text-[11px] text-slate-400">
                          <span className="text-slate-300 font-medium">Floors: </span>
                          {mat.applicableFloors.join(', ')}
                        </div>
                      )}

                      <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                        {mat.pros.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-2.5 border-t border-slate-800 text-xs text-slate-400">
                      Fire Rating: {mat.fireRating}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: BUILDING TYPOLOGY CHECKLISTS                                   */}
      {/* ===================================================================== */}
      {activeSection === 'checklists' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {typologies.map((typ) => (
                <button
                  key={typ}
                  type="button"
                  onClick={() => setSelectedTypology(typ)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border whitespace-nowrap shrink-0 ${
                    selectedTypology === typ
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-semibold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {typ}
                </button>
              ))}
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs tabular-nums">
              <span className="text-slate-400">Completed: </span>
              <span className="text-amber-400 font-semibold">
                {checkedCount} / {currentChecklist.length}
              </span>
              <span className="text-slate-400"> ({checklistProgress}%)</span>
            </div>
          </div>

          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="bg-amber-400 h-full transition-all duration-300"
              style={{ width: `${checklistProgress}%` }}
            />
          </div>

          <div className="rounded-xl bg-slate-900 border border-slate-800 divide-y divide-slate-800/80">
            {currentChecklist.map((item, idx) => {
              const isChecked = !!checkedItems[`${selectedTypology}-${idx}`];
              return (
                <div
                  key={idx}
                  onClick={() => toggleCheck(idx)}
                  className={`p-4 flex items-start gap-3.5 cursor-pointer transition-colors ${
                    isChecked ? 'bg-amber-500/5' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div
                    className={`mt-0.5 rounded border p-0.5 ${
                      isChecked
                        ? 'bg-amber-500 border-amber-500 text-slate-950'
                        : 'border-slate-700 bg-slate-950'
                    }`}
                  >
                    <Check className={`w-3.5 h-3.5 ${isChecked ? 'opacity-100' : 'opacity-0'}`} />
                  </div>
                  <span
                    className={`text-xs leading-relaxed ${
                      isChecked ? 'text-slate-400 line-through' : 'text-slate-200'
                    }`}
                  >
                    {item}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: 3D RENDER PROMPT STUDIO                                        */}
      {/* ===================================================================== */}
      {activeSection === 'render' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 max-w-3xl mx-auto space-y-5">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-amber-400" />
              <span>Architectural Visualization &amp; Render Prompt Studio</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Build detailed material and lighting prompts for architectural visualization tools.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                Architectural Brief / Material Palette
              </label>
              <textarea
                rows={3}
                value={renderDesc}
                onChange={(e) => setRenderDesc(e.target.value)}
                placeholder="Describe spatial massing, materials, exterior context, lighting, and mood..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Visual Render Style</label>
                <select
                  value={renderStyle}
                  onChange={(e) => setRenderStyle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="photorealistic architectural photography">
                    Photorealistic Architectural Photography (Golden Hour)
                  </option>
                  <option value="dramatic twilight exterior with interior warm cove lighting">
                    Twilight Cinematic Architectural Lighting
                  </option>
                  <option value="blueprint technical CAD draft with axonometric exploded isometric">
                    Technical Blueprint &amp; Axonometric CAD
                  </option>
                  <option value="minimalist charcoal sketch with watercolor wash">
                    Minimalist Charcoal &amp; Watercolor Wash
                  </option>
                  <option value="Scandinavian warm timber and board-formed concrete pavilion">
                    Scandinavian Warm Timber &amp; Biophilic Concrete
                  </option>
                  <option value="contemporary parametric double-skin glass curtain wall">
                    Contemporary Parametric High-Rise
                  </option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  id="btn-generate-render-prompt"
                  type="button"
                  onClick={handleGenerateRenderPrompt}
                  disabled={isGeneratingPrompt}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${isGeneratingPrompt ? 'animate-spin' : ''}`} />
                  <span>
                    {isGeneratingPrompt ? 'Synthesizing Prompt...' : 'Generate Render Prompt'}
                  </span>
                </button>
              </div>
            </div>

            {generatedPrompt && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                    Visualization Prompt
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedPrompt ? 'Copied' : 'Copy Prompt'}</span>
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900 p-3 rounded-lg border border-slate-800 select-all">
                  {generatedPrompt}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Construction Materials Master Guide Modal */}
      <ConstructionMaterialsMasterGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* PDF / Technical Datasheet Material Standards Updater Modal */}
      <MaterialPdfSpecUpdaterModal
        isOpen={isPdfUpdaterOpen}
        onClose={() => setIsPdfUpdaterOpen(false)}
        onApplyStandards={handleApplyPdfStandards}
      />
    </div>
  );
};
export default MaterialsView;
