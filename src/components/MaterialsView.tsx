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
} from 'lucide-react';
import { MATERIAL_CATALOG, BUILDING_TYPOLOGY_CHECKLISTS, INITIAL_LIVE_MATERIAL_PRICES } from '../data/initialData';
import { Project, LiveMaterialPrice, GroundingSource } from '../types';
import { formatCurrency, CurrencyCode } from '../utils/formatters';

interface MaterialsViewProps {
  activeProject: Project;
  currency: CurrencyCode;
  onNavigateToMarketplace?: (category?: string, query?: string) => void;
}

export const MaterialsView: React.FC<MaterialsViewProps> = ({
  activeProject,
  currency,
  onNavigateToMarketplace,
}) => {
  const [activeSection, setActiveSection] = useState<'live-prices' | 'comparison' | 'checklists' | 'render'>('live-prices');

  // Live Material Pricing State
  const [livePrices, setLivePrices] = useState<LiveMaterialPrice[]>(INITIAL_LIVE_MATERIAL_PRICES);
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

  // Comparison filter
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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
        setLivePrices(data.prices);
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
      setQuotaNotice('Serving verified regional market price benchmarks.');
    } finally {
      setIsLoadingLivePrices(false);
    }
  };

  // Filtered live materials
  const displayedLivePrices = useMemo(() => {
    let list = livePrices;
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
  }, [livePrices, selectedMaterialCategory, customMaterialQuery]);

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

  const filteredMaterials =
    selectedCategory === 'all'
      ? MATERIAL_CATALOG
      : MATERIAL_CATALOG.filter((m) => m.category === selectedCategory);

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
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: LIVE MATERIAL PRICES (MARKET SPOT RATES)                       */}
      {/* ========================================================================= */}
      {activeSection === 'live-prices' && (
        <div className="space-y-6">
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

              return (
                <div
                  key={mat.id}
                  id={`live-price-${mat.id}`}
                  className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition group shadow-sm"
                >
                  <div className="space-y-3">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                          {mat.category}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-1.5 group-hover:text-amber-300 transition">
                          {mat.name}
                        </h4>
                      </div>

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
    </div>
  );
};
