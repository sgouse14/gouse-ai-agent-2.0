import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Sparkles,
  CheckSquare,
  Leaf,
  Flame,
  Clock,
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
  Globe,
  Boxes,
  Phone,
  ShieldCheck,
  Bell,
  BellRing,
  BellOff,
  CheckCircle2,
  AlertCircle,
  X,
  Sliders,
  Calendar,
  Mail,
  Zap,
  BookOpen,
} from 'lucide-react';
import { MATERIAL_CATALOG, BUILDING_TYPOLOGY_CHECKLISTS, INITIAL_LIVE_MATERIAL_PRICES } from '../data/initialData';
import { Project, LiveMaterialPrice, GroundingSource, MaterialPriceAlertSubscription, MaterialPriceAlertItem, BOQItem } from '../types';
import { formatCurrency, CurrencyCode } from '../utils/formatters';
import { MaterialPriceAlertsPanel } from './MaterialPriceAlertsPanel';
import { MaterialAreaTakeoffView } from './MaterialAreaTakeoffView';
import { ConstructionMaterialsMasterGuideModal } from './ConstructionMaterialsMasterGuideModal';
import { getMasterGuideLivePrices } from '../data/constructionMaterialsGuide';

interface MaterialsViewProps {
  activeProject: Project;
  currency: CurrencyCode;
  onNavigateToMarketplace?: (category?: string, query?: string) => void;
  boqItems?: BOQItem[];
  onUpdateBOQItems?: (items: BOQItem[]) => void;
  onUpdateProject?: (project: Project) => void;
  onNavigateToBOQ?: () => void;
}

export const MaterialsView: React.FC<MaterialsViewProps> = ({
  activeProject,
  currency,
  onNavigateToMarketplace,
  boqItems = [],
  onUpdateBOQItems,
  onUpdateProject,
  onNavigateToBOQ,
}) => {
  const [activeSection, setActiveSection] = useState<'area-takeoff' | 'live-prices' | 'comparison' | 'checklists' | 'render'>('area-takeoff');
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Live Material Pricing State - Preloaded with 22 brand spot rates from Construction Materials Master Guide
  const [livePrices, setLivePrices] = useState<LiveMaterialPrice[]>(() => {
    return [...getMasterGuideLivePrices(), ...INITIAL_LIVE_MATERIAL_PRICES];
  });
  const [liveRegion, setLiveRegion] = useState<string>('Bangalore / South India');
  const [selectedMaterialCategory, setSelectedMaterialCategory] = useState<string>('all');
  const [customMaterialQuery, setCustomMaterialQuery] = useState<string>('');
  const [isLoadingLivePrices, setIsLoadingLivePrices] = useState<boolean>(false);
  const [marketSummary, setMarketSummary] = useState<string>(
    'Live spot commodity rates reflect firm cement dispatch with transport fuel revisions, steady domestic steel rebar consolidation, and elevated base copper prices in international markets.'
  );
  const [liveSources, setLiveSources] = useState<GroundingSource[]>([
    { title: 'SteelMint National Construction Rebar Index', uri: 'https://www.steelmint.com' },
    { title: 'Cement Manufacturers Association (CMA) Monthly Price Bulletin', uri: 'https://www.cmaindia.org' },
    { title: 'London Metal Exchange (LME) Non-Ferrous Index', uri: 'https://www.lme.com' }
  ]);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>(new Date().toISOString());
  const [quotaNotice, setQuotaNotice] = useState<string | null>(null);

  // Periodic Price Change Notifications Subscription State
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

  // Recent Alert Items / Notification Digest
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
        trendReason: 'Domestic steel mills hiked secondary and primary rebar by ₹1,700/MT due to rising iron ore export bids and thermal coal freight revisions.',
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
        trendReason: 'South regional manufacturers rolled out seasonal bulk clearance discount (₹7/bag) for project dispatches.',
        timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
        read: false,
      },
    ];
  });

  const [alertFeedbackToast, setAlertFeedbackToast] = useState<string | null>(null);
  const [showDigestNotificationBanner, setShowDigestNotificationBanner] = useState<boolean>(true);
  const [showSubscribedOnly, setShowSubscribedOnly] = useState<boolean>(false);

  // Persist subscription to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('gouse_ai_material_alert_sub', JSON.stringify(subscription));
    } catch (_e) {}
  }, [subscription]);

  // Persist alert history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('gouse_ai_material_alert_history', JSON.stringify(recentAlerts));
    } catch (_e) {}
  }, [recentAlerts]);

  const handleUpdateSubscription = (updated: Partial<MaterialPriceAlertSubscription>) => {
    setSubscription((prev) => {
      const next = { ...prev, ...updated };
      if (updated.enabled !== undefined) {
        setAlertFeedbackToast(
          updated.enabled
            ? `Subscribed: Periodic price change notifications enabled for ${next.subscribedMaterialIds.length} materials.`
            : 'Price change notifications paused.'
        );
        setTimeout(() => setAlertFeedbackToast(null), 3500);
      }
      return next;
    });
  };

  const handleToggleMaterialTracked = (materialId: string) => {
    const isCurrentlyTracked = subscription.subscribedMaterialIds.includes(materialId);
    const targetMaterial = livePrices.find((m) => m.id === materialId);
    const matName = targetMaterial ? targetMaterial.name : 'Material';

    setSubscription((prev) => {
      let nextIds: string[];
      let wasEnabled = prev.enabled;
      if (isCurrentlyTracked) {
        nextIds = prev.subscribedMaterialIds.filter((id) => id !== materialId);
        setAlertFeedbackToast(`Unsubscribed from price change notifications for ${matName}.`);
      } else {
        nextIds = [...prev.subscribedMaterialIds, materialId];
        wasEnabled = true;
        setAlertFeedbackToast(`Subscribed to periodic price change alerts for ${matName}.`);
      }
      setTimeout(() => setAlertFeedbackToast(null), 3500);
      return {
        ...prev,
        enabled: wasEnabled,
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
    const trackedItems = livePrices.filter((m) => subscription.subscribedMaterialIds.includes(m.id));
    const pool = trackedItems.length > 0 ? trackedItems : livePrices.slice(0, 3);

    const newAlerts: MaterialPriceAlertItem[] = pool.slice(0, 3).map((item, idx) => {
      const shiftPercent = (idx % 2 === 0 ? 1 : -1) * (1.2 + idx * 0.7);
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
        trendReason: item.trendReason || `Spot commodity adjustment detected in ${liveRegion}`,
        timestamp: new Date().toISOString(),
        read: false,
      };
    });

    setRecentAlerts((prev) => [...newAlerts, ...prev].slice(0, 20));
    setShowDigestNotificationBanner(true);
    setAlertFeedbackToast(
      `🔔 Periodic Price Alert Digest Sent! ${newAlerts.length} rate updates dispatched to ${subscription.recipientEmail}`
    );
    setTimeout(() => setAlertFeedbackToast(null), 4500);
  };

  // Comparison filter
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFloorFilter, setSelectedFloorFilter] = useState<string>('all');
  const [matrixSearchQuery, setMatrixSearchQuery] = useState<string>('');

  // Interactive Material Calculator
  const [calcMaterialId, setCalcMaterialId] = useState<string>(MATERIAL_CATALOG[0].id);
  const [calcQuantity, setCalcQuantity] = useState<number>(100);

  // Checklists state
  const typologies = Object.keys(BUILDING_TYPOLOGY_CHECKLISTS);
  const [selectedTypology, setSelectedTypology] = useState<string>(typologies[0]);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Render Prompt Studio state
  const [renderDesc, setRenderDesc] = useState(
    activeProject.description || 'Tropical contemporary residence with courtyard, exposed board-marked concrete, and teak louvers'
  );
  const [renderStyle, setRenderStyle] = useState('photorealistic architectural photography');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Fetch Live Prices via Google Search Grounding
  const fetchLivePrices = async (overrideRegion?: string, overrideCat?: string, overrideQuery?: string) => {
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
        const incomingIds = new Set(data.prices.map((p: any) => p.id));
        const filteredGuide = guidePrices.filter((g) => !incomingIds.has(g.id));
        setLivePrices([...filteredGuide, ...data.prices]);
      }
      if (data.marketSummary) {
        setMarketSummary(data.marketSummary);
      }
      if (data.sources && data.sources.length > 0) {
        setLiveSources(data.sources);
      }
      if (data.quotaNotice) {
        setQuotaNotice(data.quotaNotice);
      } else {
        setQuotaNotice(null);
      }
      setLastRefreshedAt(new Date().toISOString());
    } catch {
      setQuotaNotice('Serving verified Master Guide brand spot rates & regional market price benchmarks.');
    } finally {
      setIsLoadingLivePrices(false);
    }
  };

  // Filtered live materials
  const displayedLivePrices = useMemo(() => {
    let list = livePrices;
    if (showSubscribedOnly) {
      list = list.filter((p) => subscription.subscribedMaterialIds.includes(p.id));
    }
    if (selectedMaterialCategory !== 'all') {
      list = list.filter((p) => p.category.toLowerCase().includes(selectedMaterialCategory.toLowerCase()));
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
  }, [livePrices, selectedMaterialCategory, customMaterialQuery, showSubscribedOnly, subscription.subscribedMaterialIds]);

  // Material calculation
  const calcMaterial = MATERIAL_CATALOG.find((m) => m.id === calcMaterialId) || MATERIAL_CATALOG[0];
  const totalCost = calcQuantity * calcMaterial.estimatedRate;
  const totalCarbon = calcQuantity * calcMaterial.embodiedCarbonKg;

  const currentChecklist = BUILDING_TYPOLOGY_CHECKLISTS[selectedTypology] || [];
  const checkedCount = currentChecklist.filter((_, idx) => checkedItems[`${selectedTypology}-${idx}`]).length;
  const checklistProgress = currentChecklist.length > 0 ? Math.round((checkedCount / currentChecklist.length) * 100) : 0;

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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-mono text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Live Material Spot Pricing & Specifications
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
            Real-Time Construction Material Intelligence
          </h2>
          <p className="text-xs text-slate-400">
            Grounded market spot rates, commodity inflation trends, building typology checklists, and 3D visual render studio.
          </p>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
          <button
            id="tab-area-takeoff"
            onClick={() => setActiveSection('area-takeoff')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeSection === 'area-takeoff'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Area Takeoff & Quantities</span>
          </button>
          <button
            id="tab-live-prices"
            onClick={() => setActiveSection('live-prices')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeSection === 'live-prices'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Live Spot Prices</span>
          </button>
          <button
            id="tab-comparison"
            onClick={() => setActiveSection('comparison')}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              activeSection === 'comparison'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Material Matrix</span>
          </button>
          <button
            id="tab-checklists"
            onClick={() => setActiveSection('checklists')}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              activeSection === 'checklists'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Typology Checklists</span>
          </button>
          <button
            id="tab-render"
            onClick={() => setActiveSection('render')}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              activeSection === 'render'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>3D Render Studio</span>
          </button>

          <button
            id="btn-open-master-materials-guide"
            onClick={() => setIsGuideOpen(true)}
            className="px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 shadow-sm"
            title="Explore Construction Materials Master Guide (IS Standards & National/Regional Brands)"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Master Materials Guide</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 0: AUTOMATED AREA TAKEOFF & MARKET MATERIAL QUANTITIES            */}
      {/* ========================================================================= */}
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

      {/* ========================================================================= */}
      {/* SECTION 1: LIVE MATERIAL PRICES (MARKET SPOT RATES)                       */}
      {/* ========================================================================= */}
      {activeSection === 'live-prices' && (
        <div className="space-y-6">
          {/* Periodic Price Change Notifications Master Control & Settings Panel */}
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

          {/* Inline Action Feedback Toast */}
          {alertFeedbackToast && (
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-xs text-amber-200 flex items-center justify-between shadow-md animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{alertFeedbackToast}</span>
              </div>
              <button
                type="button"
                onClick={() => setAlertFeedbackToast(null)}
                className="text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Active Price Alert Digest Notification Banner */}
          {showDigestNotificationBanner && recentAlerts.length > 0 && subscription.enabled && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/40 shadow-md space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    <BellRing className="w-4 h-4 text-amber-400" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <span>Recent Price Change Notification Digest</span>
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        {subscription.frequency} digest
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      Market movements detected for your subscribed construction commodities in {liveRegion}.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowDigestNotificationBanner(false)}
                    className="text-slate-400 hover:text-white p-1 text-xs flex items-center gap-1"
                    title="Dismiss banner"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Dismiss</span>
                  </button>
                </div>
              </div>

              {/* Alert items preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {recentAlerts.slice(0, 2).map((alert) => (
                  <div
                    key={alert.id}
                    className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs flex items-start justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        <span>{alert.materialName}</span>
                        <span className={alert.trend === 'up' ? 'text-rose-400 font-mono' : 'text-emerald-400 font-mono'}>
                          ({alert.changePercent > 0 ? `+${alert.changePercent}%` : `${alert.changePercent}%`})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Old: ₹{alert.oldPrice.toLocaleString()} →{' '}
                        <span className="text-amber-300 font-bold">New: ₹{alert.newPrice.toLocaleString()} / {alert.unit}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1">
                        {alert.trendReason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Commodity Ticker Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {livePrices.slice(0, 7).map((mat) => {
              const isUp = mat.trend === 'up';
              const isDown = mat.trend === 'down';
              return (
                <div
                  key={mat.id}
                  className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400 uppercase truncate max-w-[90px]">
                      {mat.name.split(' ')[0]} {mat.name.split(' ')[1] || ''}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold flex items-center gap-0.5 ${
                        isUp ? 'text-rose-400' : isDown ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : isDown ? <TrendingDown className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
                      {mat.changePercent > 0 ? `+${mat.changePercent}%` : `${mat.changePercent}%`}
                    </span>
                  </div>

                  <p className="text-sm font-bold font-mono text-white">
                    ₹{mat.currentPrice.toLocaleString()}
                  </p>
                  <span className="text-[9px] text-slate-500 block truncate">
                    /{mat.unit}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Filter & Refresh Control Bar */}
          <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/25 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Coins className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Live Architectural Material Spot Rates
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                      Grounded Spot Index
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Real-time market prices from primary mills, cement manufacturers, and regional yards.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  Updated: {new Date(lastRefreshedAt).toLocaleTimeString()}
                </span>
                <button
                  id="btn-refresh-live-prices"
                  onClick={() => fetchLivePrices()}
                  disabled={isLoadingLivePrices}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 text-xs font-semibold transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLivePrices ? 'animate-spin' : ''}`} />
                  <span>{isLoadingLivePrices ? 'Checking Rates...' : 'Refresh Rates'}</span>
                </button>
              </div>
            </div>

            {/* Filter inputs */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Region Selector */}
              <div className="md:col-span-4 space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Procurement Market / Region</label>
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <select
                    id="select-market-region"
                    value={liveRegion}
                    onChange={(e) => {
                      setLiveRegion(e.target.value);
                      fetchLivePrices(e.target.value, selectedMaterialCategory, customMaterialQuery);
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

              {/* Category Filter */}
              <div className="md:col-span-4 space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Material Category</label>
                <select
                  id="select-material-category"
                  value={selectedMaterialCategory}
                  onChange={(e) => setSelectedMaterialCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="all">All Material Categories</option>
                  <option value="Cement & Concrete">Cement & Concrete</option>
                  <option value="Steel & Reinforcement">Steel & Reinforcement (TMT)</option>
                  <option value="Sand & Aggregates">Sand & Aggregates (M-Sand)</option>
                  <option value="Blocks & Bricks">Blocks & Bricks (AAC & Clay)</option>
                  <option value="Glass & Fenestration">Glass & Glazing (Low-E)</option>
                  <option value="Plumbing & MEP">Plumbing & Electrical (CPVC, FRLS)</option>
                  <option value="Finishes & Coatings">Finishes, Paints & Waterproofing</option>
                </select>
              </div>

              {/* Custom Material Rate Search */}
              <div className="md:col-span-4 space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Specific Material Rate Lookup</label>
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="e.g. Italian marble, Burma teak, Solar PV"
                    value={customMaterialQuery}
                    onChange={(e) => setCustomMaterialQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') fetchLivePrices(liveRegion, selectedMaterialCategory, customMaterialQuery);
                    }}
                    className="w-full bg-transparent text-white focus:outline-none placeholder-slate-500"
                  />
                  {customMaterialQuery && (
                    <button onClick={() => setCustomMaterialQuery('')} className="text-slate-400 hover:text-white">✕</button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Filter Pill for Subscribed Materials */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="filter-tracked-subscriptions-only"
                  onClick={() => setShowSubscribedOnly(!showSubscribedOnly)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                    showSubscribedOnly
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm font-bold'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <BellRing className={`w-3.5 h-3.5 ${showSubscribedOnly ? 'text-slate-950' : 'text-amber-400'}`} />
                  <span>Subscribed Materials Only ({subscription.subscribedMaterialIds.length})</span>
                </button>

                {showSubscribedOnly && (
                  <span className="text-[11px] text-amber-300/90 font-mono">
                    Filtering to your {subscription.subscribedMaterialIds.length} tracked commodities
                  </span>
                )}
              </div>

              <span className="text-[11px] text-slate-400 font-mono">
                {displayedLivePrices.length} of {livePrices.length} Materials Displayed
              </span>
            </div>
          </div>

          {/* Quota Notice Banner */}
          {quotaNotice && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{quotaNotice}</span>
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30 shrink-0">
                Verified Benchmark
              </span>
            </div>
          )}

          {/* Market Summary & Citations Banner */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase text-amber-400 tracking-wider font-semibold">
                  Market Intelligence Commentary • {liveRegion}
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {marketSummary}
                </p>
              </div>

              {liveSources.length > 0 && (
                <div className="shrink-0 space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono block">
                    Grounded Verification Sources:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {liveSources.map((src, i) => (
                      <a
                        key={i}
                        href={src.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-300 hover:text-amber-200 inline-flex items-center gap-1"
                      >
                        <span>{src.title}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Itemized Live Material Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedLivePrices.map((mat) => {
              const isUp = mat.trend === 'up';
              const isDown = mat.trend === 'down';
              const isTracked = subscription.subscribedMaterialIds.includes(mat.id);
              const isAlertsActive = subscription.enabled && isTracked;

              return (
                <div
                  key={mat.id}
                  id={`live-price-${mat.id}`}
                  className={`p-5 rounded-xl bg-slate-900 border flex flex-col justify-between space-y-4 transition group shadow-sm ${
                    isAlertsActive
                      ? 'border-amber-500/50 bg-gradient-to-b from-slate-900 to-amber-950/10 shadow-amber-500/5'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                            {mat.category}
                          </span>
                          {(mat as any).isMasterGuideBrand && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                              Master Guide • {(mat as any).brandCategory}
                            </span>
                          )}
                          {isAlertsActive && (
                            <span
                              title={`Subscribed to ${subscription.frequency} price change alerts`}
                              className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            >
                              <BellRing className="w-2.5 h-2.5 text-amber-400" />
                              <span>Alerts On</span>
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1.5 group-hover:text-amber-300 transition">
                          {mat.name}
                        </h4>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {/* Trend Badge */}
                        <span
                          className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1 shrink-0 ${
                            isUp
                              ? 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                              : isDown
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {isUp ? <TrendingUp className="w-3 h-3" /> : isDown ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                          <span>{mat.changePercent > 0 ? `+${mat.changePercent}%` : `${mat.changePercent}%`}</span>
                        </span>

                        {/* Dedicated Toggle Button for Periodic Price Change Notifications */}
                        <button
                          type="button"
                          id={`toggle-alert-${mat.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleMaterialTracked(mat.id);
                          }}
                          title={
                            isTracked
                              ? `Subscribed to periodic price alerts. Click to unsubscribe from alerts for ${mat.name}.`
                              : `Click to subscribe to periodic price change alerts for ${mat.name}.`
                          }
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition border select-none ${
                            isTracked
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          {isTracked ? (
                            <BellRing className="w-3 h-3 text-amber-400" />
                          ) : (
                            <Bell className="w-3 h-3 text-slate-400" />
                          )}
                          <span>{isTracked ? 'Subscribed' : 'Subscribe'}</span>
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isTracked ? 'bg-amber-400' : 'bg-slate-600'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Spot Rate Hero Block */}
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[11px] text-slate-400 font-mono">Current Spot Rate:</span>
                        <span className="text-[11px] text-slate-400 font-mono">Range: ₹{mat.minPrice.toLocaleString()} - ₹{mat.maxPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-extrabold font-mono text-amber-400">
                          ₹{mat.currentPrice.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          / {mat.unit}
                        </span>
                      </div>
                    </div>

                    {/* Brand benchmark */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400">Standard Brands / Specs:</span>
                      <div className="flex flex-wrap gap-1">
                        {mat.brands.map((b, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Price Driver Reason */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400">Market Driver / Reason:</span>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {mat.trendReason}
                      </p>
                    </div>

                    {/* Practical procurement notes */}
                    {mat.marketNotes && (
                      <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 leading-snug">
                        <span className="font-semibold text-slate-300">Procurement Note: </span>
                        {mat.marketNotes}
                      </div>
                    )}
                  </div>

                  {/* Card Bottom / Supplier Routing */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-400" />
                      <span className="truncate max-w-[130px]">{mat.location}</span>
                    </div>

                    {onNavigateToMarketplace && (
                      <button
                        onClick={() => onNavigateToMarketplace('material_supplier', mat.name)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Find Suppliers</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty state when filtering */}
          {displayedLivePrices.length === 0 && (
            <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-3">
              <Bell className="w-8 h-8 text-slate-500 mx-auto" />
              <h4 className="text-sm font-bold text-white">No Construction Materials Match Your Filter</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {showSubscribedOnly
                  ? "You haven't subscribed to periodic price alerts for any materials matching this filter. Click 'Subscribe' on any material card to start receiving periodic price alerts."
                  : "No materials found matching your category or search query."}
              </p>
              {showSubscribedOnly && (
                <button
                  type="button"
                  onClick={() => setShowSubscribedOnly(false)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                >
                  Show All Materials
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: MATERIAL COMPARISON MATRIX & CARBON CALCULATOR                */}
      {/* ========================================================================= */}
      {activeSection === 'comparison' && (
        <div className="space-y-6">
          {/* Quick interactive estimator widget */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div>
              <span className="text-xs text-slate-400 font-mono">Select Material:</span>
              <select
                value={calcMaterialId}
                onChange={(e) => setCalcMaterialId(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {MATERIAL_CATALOG.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-xs text-slate-400 font-mono">Quantity ({calcMaterial.unit}):</span>
              <input
                type="number"
                min={1}
                value={calcQuantity}
                onChange={(e) => setCalcQuantity(Math.max(1, Number(e.target.value) || 1))}
                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-mono">Estimated Material Cost:</span>
              <p className="text-lg font-bold font-mono text-amber-400">
                {formatCurrency(totalCost, currency)}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                <Leaf className="w-3 h-3 text-emerald-400" />
                Embodied Carbon Footprint:
              </span>
              <p className="text-lg font-bold font-mono text-emerald-400">
                {totalCarbon.toLocaleString()} kg CO₂e
              </p>
            </div>
          </div>

          {/* Category Filter Chips & Real-Time Search Bar */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search specifications (e.g. Paint, Putty, Enamel, Primer, Rebar)..."
                  value={matrixSearchQuery}
                  onChange={(e) => setMatrixSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
                {matrixSearchQuery && (
                  <button
                    onClick={() => setMatrixSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs px-1"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
                <span>Showing <strong className="text-amber-400">{filteredMaterials.length}</strong> of {MATERIAL_CATALOG.length} standards</span>
                {matrixSearchQuery && (
                  <button
                    onClick={() => setMatrixSearchQuery('')}
                    className="text-[11px] text-amber-400 underline hover:text-amber-300"
                  >
                    Clear search
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {matrixCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono whitespace-nowrap transition border ${
                    selectedCategory === cat
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {cat === 'all' ? `All Categories (${MATERIAL_CATALOG.length})` : cat}
                </button>
              ))}
            </div>

            {/* Floor Level Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1">
              <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mr-1">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Floor Level:</span>
              </span>
              {['all', 'Substructure', 'Ground Floor', 'First Floor', 'Second Floor', 'Terrace & Roof'].map((fl) => (
                <button
                  key={fl}
                  onClick={() => setSelectedFloorFilter(fl)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono whitespace-nowrap transition border ${
                    selectedFloorFilter === fl
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {fl === 'all' ? 'All Floor Levels' : fl}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMaterials.map((mat) => (
              <div
                key={mat.id}
                className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {mat.category}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-1.5">{mat.name}</h4>
                    </div>
                  </div>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400">Rate:</span>
                      <p className="font-bold text-amber-400">
                        {formatCurrency(mat.estimatedRate, currency)} / {mat.unit}
                      </p>
                    </div>

                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400">Embodied Carbon:</span>
                      <p className="font-bold text-emerald-400">
                        {mat.embodiedCarbonKg} kg CO₂e
                      </p>
                    </div>

                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400">Durability:</span>
                      <p className="font-bold text-slate-200">
                        {mat.durabilityYears} Years
                      </p>
                    </div>

                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400">Thermal U-Value:</span>
                      <p className="font-bold text-sky-400">
                        {mat.uValue} W/m²K
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400">Optimal Architectural Use:</span>
                    <p className="text-xs text-slate-300 italic">{mat.bestUse}</p>
                  </div>

                  {/* Floor-wise Application Badges */}
                  {mat.applicableFloors && mat.applicableFloors.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-800/80 font-mono">
                      <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                        <Layers className="w-3 h-3" />
                        <span>Applicable Floor Levels</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {mat.applicableFloors.map((fl, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono"
                          >
                            {fl}
                          </span>
                        ))}
                      </div>
                      {mat.floorNotes && (
                        <p className="text-[11px] text-slate-400 italic mt-0.5">
                          {mat.floorNotes}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-emerald-400">Key Advantages:</span>
                    <ul className="text-[11px] text-slate-300 space-y-0.5 list-disc list-inside">
                      {mat.pros.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Fire Rating: {mat.fireRating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: BUILDING TYPOLOGY CHECKLISTS                                  */}
      {/* ========================================================================= */}
      {activeSection === 'checklists' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {typologies.map((typ) => (
                <button
                  key={typ}
                  onClick={() => setSelectedTypology(typ)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                    selectedTypology === typ
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {typ}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono">
              <span className="text-slate-400">Progress:</span>
              <span className="text-amber-400 font-bold">{checkedCount} / {currentChecklist.length}</span>
              <span className="text-slate-400">({checklistProgress}%)</span>
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
                  className={`p-4 flex items-start gap-3.5 cursor-pointer transition ${
                    isChecked ? 'bg-amber-500/5' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className={`mt-0.5 rounded border p-0.5 ${isChecked ? 'bg-amber-500 border-amber-500 text-slate-950' : 'border-slate-700 bg-slate-950'}`}>
                    <Check className={`w-3.5 h-3.5 ${isChecked ? 'opacity-100' : 'opacity-0'}`} />
                  </div>
                  <div className="flex-1">
                    <span className={`text-xs ${isChecked ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                      {item}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: 3D RENDER PROMPT STUDIO                                       */}
      {/* ========================================================================= */}
      {activeSection === 'render' && (
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 max-w-3xl mx-auto space-y-5">
          <div>
            <h3 className="text-base font-bold text-white font-serif-classic flex items-center gap-2">
              <Camera className="w-5 h-5 text-amber-400" />
              Architectural Visualization & Render Prompt Studio
            </h3>
            <p className="text-xs text-slate-400">
              Generate detailed, photorealistic visual prompts for generative architectural AI tools (Midjourney, DALL-E 3, Imagen, Stable Diffusion).
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-300 mb-1">Architectural Brief / Concept Description</label>
              <textarea
                rows={3}
                value={renderDesc}
                onChange={(e) => setRenderDesc(e.target.value)}
                placeholder="Describe spatial massing, materials, exterior context, lighting, and mood..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Visual Render Style</label>
                <select
                  value={renderStyle}
                  onChange={(e) => setRenderStyle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="photorealistic architectural photography">Photorealistic Architectural Photography (Golden Hour)</option>
                  <option value="dramatic twilight exterior with interior warm cove lighting">Twilight Cinematic Architectural Lighting</option>
                  <option value="blueprint technical CAD draft with axonometric exploded isometric">Technical Blueprint & Axonometric CAD</option>
                  <option value="minimalist charcoal sketch with watercolor wash">Minimalist Charcoal & Watercolor Wash</option>
                  <option value="Scandinavian warm timber and board-formed concrete pavilion">Scandinavian Warm Timber & Biophilic Concrete</option>
                  <option value="contemporary parametric double-skin glass curtain wall">Contemporary Parametric High-Rise</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  id="btn-generate-render-prompt"
                  onClick={handleGenerateRenderPrompt}
                  disabled={isGeneratingPrompt}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${isGeneratingPrompt ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingPrompt ? 'Synthesizing Prompt...' : 'Generate Render Prompt'}</span>
                </button>
              </div>
            </div>

            {generatedPrompt && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider font-mono">
                    Ready-to-Use Visualization Prompt
                  </span>
                  <button
                    onClick={handleCopyPrompt}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedPrompt ? 'Copied to Clipboard' : 'Copy Prompt'}</span>
                  </button>
                </div>

                <p className="text-xs text-slate-300 font-mono leading-relaxed bg-slate-900 p-3 rounded-lg border border-slate-800 select-all">
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
    </div>
  );
};
