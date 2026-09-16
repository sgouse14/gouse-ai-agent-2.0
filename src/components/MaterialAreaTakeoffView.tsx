import React, { useState, useMemo } from 'react';
import {
  Zap,
  Sliders,
  MapPin,
  Maximize2,
  Building,
  Check,
  TrendingUp,
  TrendingDown,
  Info,
  Scale,
  Sparkles,
  Download,
  ArrowRight,
  RefreshCw,
  Boxes,
  ShieldCheck,
  Filter,
  Layers,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { Project, BOQItem } from '../types';
import { formatCurrency, CurrencyCode } from '../utils/formatters';
import {
  MARKET_REGIONS,
  MarketRegion,
  MarketQualityTier,
  MarketPricingBasis,
} from '../utils/marketPriceEngine';
import {
  calculateMaterialTakeoffFromArea,
  autoUpdateBOQItemsWithAreaAndMarketPrice,
  CalculatedMaterialTakeoffItem,
} from '../utils/materialTakeoffEngine';

interface MaterialAreaTakeoffViewProps {
  activeProject: Project;
  currency: CurrencyCode;
  boqItems?: BOQItem[];
  onUpdateBOQItems?: (items: BOQItem[]) => void;
  onUpdateProject?: (project: Project) => void;
  onNavigateToBOQ?: () => void;
}

export const MaterialAreaTakeoffView: React.FC<MaterialAreaTakeoffViewProps> = ({
  activeProject,
  currency,
  boqItems = [],
  onUpdateBOQItems,
  onUpdateProject,
  onNavigateToBOQ,
}) => {
  // Built-up area state (synced with activeProject)
  const [areaSqFt, setAreaSqFt] = useState<number>(() => {
    return activeProject.builtUpAreaSqFt && activeProject.builtUpAreaSqFt > 0
      ? activeProject.builtUpAreaSqFt
      : 3000;
  });

  const [selectedRegion, setSelectedRegion] = useState<MarketRegion>('bangalore');
  const [selectedTier, setSelectedTier] = useState<MarketQualityTier>('Standard');
  const [selectedBasis, setSelectedBasis] = useState<MarketPricingBasis>('spot_market');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Keep local area in sync if project changes
  React.useEffect(() => {
    if (activeProject.builtUpAreaSqFt && activeProject.builtUpAreaSqFt > 0) {
      setAreaSqFt(activeProject.builtUpAreaSqFt);
    }
  }, [activeProject.id, activeProject.builtUpAreaSqFt]);

  // Compute live material takeoff report
  const takeoffReport = useMemo(() => {
    return calculateMaterialTakeoffFromArea(
      areaSqFt,
      selectedRegion,
      selectedTier,
      selectedBasis
    );
  }, [areaSqFt, selectedRegion, selectedTier, selectedBasis]);

  // Handle area change from slider or input
  const handleAreaChange = (newArea: number) => {
    const valid = Math.max(100, Math.round(newArea));
    setAreaSqFt(valid);
    if (onUpdateProject) {
      onUpdateProject({
        ...activeProject,
        builtUpAreaSqFt: valid,
      });
    }
  };

  // 1-Click Sync all area quantities & market rates to BOQ Schedule
  const handleSyncAllToBOQ = () => {
    if (!onUpdateBOQItems) return;

    const { updatedItems, report } = autoUpdateBOQItemsWithAreaAndMarketPrice(
      boqItems,
      areaSqFt,
      activeProject.builtUpAreaSqFt || 3000,
      {
        regionId: selectedRegion,
        tier: selectedTier,
        pricingBasis: selectedBasis,
        updateQuantitiesWithArea: true,
        updateRatesWithMarketPrice: true,
      }
    );

    onUpdateBOQItems(updatedItems);
    if (onUpdateProject) {
      onUpdateProject({
        ...activeProject,
        builtUpAreaSqFt: areaSqFt,
      });
    }

    setSyncFeedback(
      `✓ Successfully updated ${report.quantitiesUpdatedCount} BOQ quantities for ${areaSqFt.toLocaleString()} sq.ft and calibrated ${report.ratesUpdatedCount} items to ${report.region.shortName} live market rates!`
    );
    setTimeout(() => setSyncFeedback(null), 5000);
  };

  // Export takeoff report to CSV
  const handleExportCSV = () => {
    const headers = [
      'Material Name',
      'Category',
      'IS Code / Standard',
      'Engineering Norm per sq.ft',
      'Built-up Area (sq.ft)',
      'Calculated Quantity',
      'Unit',
      'Live Market Rate (INR)',
      'Total Material Cost (INR)',
      'Cost per sq.ft (INR)',
      'Budget Share (%)',
      'Recommended Brands',
    ];

    const rows = takeoffReport.items.map((item) => [
      `"${item.norm.name}"`,
      `"${item.norm.category}"`,
      `"${item.norm.isCodeRef}"`,
      `"${item.norm.normDescription}"`,
      areaSqFt,
      item.roundedQuantity,
      `"${item.unit}"`,
      item.marketRate,
      item.totalCost,
      item.costPerSqFt,
      `${item.percentOfTotalMaterialBudget}%`,
      `"${item.norm.brands.join(', ')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Material_Takeoff_${areaSqFt}sqft_${takeoffReport.region.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const categories = [
    'all',
    'Cement & Concrete',
    'Steel & Reinforcement',
    'Sand & Aggregates',
    'Blocks & Masonry',
    'Finishes & Surfaces',
    'Fenestration & Glass',
    'Plumbing & MEP',
    'Waterproofing',
    'Doors & Carpentry',
  ];

  const filteredItems =
    filterCategory === 'all'
      ? takeoffReport.items
      : takeoffReport.items.filter((i) => i.norm.category === filterCategory);

  const quickAreaPresets = useMemo(() => {
    const standard = [
      { id: 'preset-1200', label: '1,200 sq.ft', value: 1200, tag: 'Duplex' },
      { id: 'preset-2400', label: '2,400 sq.ft', value: 2400, tag: 'Villa' },
      { id: 'preset-3600', label: '3,600 sq.ft', value: 3600, tag: 'Triplex' },
      { id: 'preset-5000', label: '5,000 sq.ft', value: 5000, tag: 'Bungalow' },
      { id: 'preset-10000', label: '10,000 sq.ft', value: 10000, tag: 'Commercial' },
    ];

    const exists = standard.some((p) => p.value === areaSqFt);
    if (!exists && areaSqFt > 0) {
      return [
        { id: `preset-active-${areaSqFt}`, label: `${areaSqFt.toLocaleString()} sq.ft`, value: areaSqFt, tag: 'Active' },
        ...standard,
      ];
    }
    return standard;
  }, [areaSqFt]);

  return (
    <div id="material-area-takeoff-container" className="space-y-6">
      {/* Toast Feedback */}
      {syncFeedback && (
        <div className="p-3.5 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/40 rounded-xl flex items-center justify-between gap-3 text-xs font-mono text-amber-300 shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
          {onNavigateToBOQ && (
            <button
              onClick={onNavigateToBOQ}
              className="inline-flex items-center gap-1 text-xs text-white bg-amber-500/30 hover:bg-amber-500/40 px-2.5 py-1 rounded font-bold transition"
            >
              <span>View in BOQ Schedule</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Control Banner: Area, Region & Tier */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                Automated Area Takeoff Engine
              </span>
              <span className="text-xs font-mono text-slate-400">
                IS 456 / CPWD Norms Grounded
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
              <span>Automatic Material Quantities & Market Cost</span>
              <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                Live Sync
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Specify your project built-up area to automatically calculate all raw material quantities, procurement volumes, and prevailing market prices.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="btn-sync-takeoff-to-boq"
              onClick={handleSyncAllToBOQ}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm"
              title="Automatically update all line items in the project's BOQ Schedule with these area quantities and market prices"
            >
              <Zap className="w-4 h-4" />
              <span>Sync Takeoff to Project BOQ</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700 transition"
              title="Export complete material schedule to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Input Parameters: Area Slider, Region & Tier */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-1">
          {/* Area Slider & Input */}
          <div className="lg:col-span-7 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Project Built-up Area</span>
              </label>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span>Metric Equivalent:</span>
                <span className="text-white font-bold">{Math.round(areaSqFt * 0.092903).toLocaleString()} m²</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  id="input-takeoff-area-sqft"
                  type="number"
                  min={100}
                  max={50000}
                  step={50}
                  value={areaSqFt}
                  onChange={(e) => handleAreaChange(Number(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-amber-500/50 rounded-xl px-4 py-2.5 text-white font-mono text-xl font-bold focus:outline-none focus:border-amber-400 pr-16"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                  sq.ft
                </span>
              </div>

              {/* Area Presets */}
              <div className="flex gap-1">
                {quickAreaPresets.slice(0, 3).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleAreaChange(p.value)}
                    className={`px-2 py-2 rounded-lg text-[11px] font-mono border transition ${
                      areaSqFt === p.value
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Slider */}
            <input
              id="slider-takeoff-area"
              type="range"
              min={500}
              max={15000}
              step={100}
              value={areaSqFt}
              onChange={(e) => handleAreaChange(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>

          {/* Region & Tier Selectors */}
          <div className="lg:col-span-5 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <label className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>Pricing Hub & Specification Quality</span>
            </label>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Region Hub</label>
                <select
                  id="select-takeoff-region"
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value as MarketRegion)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-amber-300 focus:outline-none focus:border-amber-400"
                >
                  {MARKET_REGIONS.map((r) => (
                    <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                      {r.shortName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Quality Tier</label>
                <select
                  id="select-takeoff-tier"
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value as MarketQualityTier)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="Economy">Economy</option>
                  <option value="Standard">Standard</option>
                  <option value="Premium">Premium</option>
                  <option value="Luxury">Luxury</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1 font-mono">Procurement Channel</label>
              <select
                id="select-takeoff-basis"
                value={selectedBasis}
                onChange={(e) => setSelectedBasis(e.target.value as MarketPricingBasis)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
              >
                <option value="spot_market">Spot Commodity Market (Direct Mill/Batching)</option>
                <option value="cpwd_dsr">CPWD Delhi Schedule of Rates (Official)</option>
                <option value="procurement_bulk">Procurement Bulk (5% Volume Rebate)</option>
                <option value="retail_cash">Retail Local Counter (+8% Handling)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* High-Level Material Volume Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 font-mono">
        <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-3.5 bg-gradient-to-b from-amber-500/10 to-transparent">
          <span className="block text-[11px] text-amber-300 uppercase tracking-wider font-bold">
            Total Material Cost
          </span>
          <span className="text-lg font-bold text-white">
            {formatCurrency(takeoffReport.totalMaterialCost, currency)}
          </span>
          <span className="block text-[10px] text-slate-400 mt-0.5">
            ₹{takeoffReport.materialCostPerSqFt} / sq.ft
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="block text-[11px] text-slate-400 uppercase tracking-wider">
            OPC Cement
          </span>
          <span className="text-lg font-bold text-amber-300">
            {takeoffReport.keyMaterialVolumes.cementBags.toLocaleString()} bags
          </span>
          <span className="block text-[10px] text-slate-500 mt-0.5">
            0.42 bags / sq.ft
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="block text-[11px] text-slate-400 uppercase tracking-wider">
            TMT Steel Rebar
          </span>
          <span className="text-lg font-bold text-amber-300">
            {takeoffReport.keyMaterialVolumes.steelMetricTonnes} MT
          </span>
          <span className="block text-[10px] text-slate-500 mt-0.5">
            3.80 kg / sq.ft
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="block text-[11px] text-slate-400 uppercase tracking-wider">
            Concrete Volume
          </span>
          <span className="text-lg font-bold text-amber-300">
            {takeoffReport.keyMaterialVolumes.concreteM3} m³
          </span>
          <span className="block text-[10px] text-slate-500 mt-0.5">
            0.035 m³ / sq.ft
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="block text-[11px] text-slate-400 uppercase tracking-wider">
            Vitrified Tiles
          </span>
          <span className="text-lg font-bold text-amber-300">
            {takeoffReport.keyMaterialVolumes.tilesSqFt.toLocaleString()} sq.ft
          </span>
          <span className="block text-[10px] text-slate-500 mt-0.5">
            1.22 sq.ft / sq.ft
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="block text-[11px] text-slate-400 uppercase tracking-wider">
            Wall Care Putty
          </span>
          <span className="text-lg font-bold text-amber-300">
            {(takeoffReport.keyMaterialVolumes.puttyBags || Math.round(takeoffReport.areaSqFt * 0.003 * 1.05)).toLocaleString()} bags
          </span>
          <span className="block text-[10px] text-slate-500 mt-0.5">
            40kg / 2 coats
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="block text-[11px] text-slate-400 uppercase tracking-wider">
            Coatings & Paints
          </span>
          <span className="text-lg font-bold text-amber-300">
            {takeoffReport.keyMaterialVolumes.paintLiters.toLocaleString()} L
          </span>
          <span className="block text-[10px] text-slate-500 mt-0.5">
            Emulsion + Primer + Enamel
          </span>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-xs text-slate-400 font-mono mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3 text-amber-400" />
          <span>Category:</span>
        </span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1 rounded-lg text-xs font-mono whitespace-nowrap transition border ${
              filterCategory === cat
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            {cat === 'all' ? `All Materials (${takeoffReport.items.length})` : cat}
          </button>
        ))}
      </div>

      {/* Main Material Takeoff Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">
              Schedule of Material Quantities & Market Prices ({filteredItems.length} items)
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
              {takeoffReport.region.shortName} • {selectedTier}
            </span>
          </div>

          <span className="text-[11px] text-slate-400">
            All quantities are automatically scaled with built-up area ({areaSqFt.toLocaleString()} sq.ft)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
              <tr>
                <th className="p-3">Material & Specification</th>
                <th className="p-3">Category / IS Code</th>
                <th className="p-3">Engineering Norm</th>
                <th className="p-3 text-right">Calculated Quantity</th>
                <th className="p-3 text-right">Live Market Rate</th>
                <th className="p-3 text-right">Total Material Cost</th>
                <th className="p-3 text-right">Share</th>
                <th className="p-3">Leading Brands</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredItems.map((item) => (
                <tr key={item.norm.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3">
                    <div className="font-bold text-white">{item.norm.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Stage: <span className="text-amber-400">{item.norm.stage}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700/50">
                      {item.norm.category}
                    </span>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {item.norm.isCodeRef}
                    </div>
                  </td>
                  <td className="p-3 max-w-xs">
                    <span className="text-slate-300 text-[11px]">
                      {item.norm.normDescription}
                    </span>
                    {item.norm.standardWastagePercent > 0 && (
                      <span className="block text-[10px] text-amber-400/80">
                        +{item.norm.standardWastagePercent}% cut/handling allowance
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="text-sm font-bold text-amber-300">
                      {item.roundedQuantity.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {item.unit}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="font-bold text-white">
                      {formatCurrency(item.marketRate, currency)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      per {item.unit}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="text-sm font-bold text-white">
                      {formatCurrency(item.totalCost, currency)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      ₹{item.costPerSqFt}/sq.ft
                    </div>
                  </td>
                  <td className="p-3 text-right font-bold text-amber-400">
                    {item.percentOfTotalMaterialBudget}%
                  </td>
                  <td className="p-3">
                    <div className="text-[11px] text-slate-300">
                      {item.norm.brands.slice(0, 2).join(', ')}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {item.norm.brands.slice(2).join(', ')}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
