import React, { useState, useMemo } from 'react';
import {
  Zap,
  Sliders,
  MapPin,
  Building,
  Check,
  RotateCcw,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Info,
  X,
  Layers,
  Scale,
  Sparkles,
  Maximize2
} from 'lucide-react';
import { BOQItem, Project } from '../types';
import { formatCurrency, CurrencyCode } from '../utils/formatters';
import {
  MARKET_REGIONS,
  MarketRegion,
  MarketQualityTier,
  MarketPricingBasis,
} from '../utils/marketPriceEngine';
import {
  autoUpdateBOQItemsWithAreaAndMarketPrice,
  calculateMaterialTakeoffFromArea,
} from '../utils/materialTakeoffEngine';

interface AreaTakeoffAutoUpdateModalProps {
  items: BOQItem[];
  currentAreaSqFt: number;
  currency: CurrencyCode;
  isOpen: boolean;
  onClose: () => void;
  onApplyUpdate: (updatedItems: BOQItem[], newAreaSqFt: number, reportSummary: string) => void;
  initialRegion?: MarketRegion;
  initialTier?: MarketQualityTier;
  initialPricingBasis?: MarketPricingBasis;
}

export const AreaTakeoffAutoUpdateModal: React.FC<AreaTakeoffAutoUpdateModalProps> = ({
  items,
  currentAreaSqFt,
  currency,
  isOpen,
  onClose,
  onApplyUpdate,
  initialRegion = 'bangalore',
  initialTier = 'Standard',
  initialPricingBasis = 'spot_market',
}) => {
  const [targetAreaSqFt, setTargetAreaSqFt] = useState<number>(() =>
    currentAreaSqFt && currentAreaSqFt > 0 ? currentAreaSqFt : 3000
  );
  const [selectedRegion, setSelectedRegion] = useState<MarketRegion>(initialRegion);
  const [selectedTier, setSelectedTier] = useState<MarketQualityTier>(initialTier);
  const [selectedBasis, setSelectedBasis] = useState<MarketPricingBasis>(initialPricingBasis);
  const [updateQuantities, setUpdateQuantities] = useState<boolean>(true);
  const [updateRates, setUpdateRates] = useState<boolean>(true);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(() => items.map((i) => i.id));
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Keep targetArea in sync if currentArea changes when modal opens
  React.useEffect(() => {
    if (isOpen && currentAreaSqFt > 0) {
      setTargetAreaSqFt(currentAreaSqFt);
      setSelectedItemIds(items.map((i) => i.id));
    }
  }, [isOpen, currentAreaSqFt, items]);

  // Compute preview of the area & market price update
  const previewResult = useMemo(() => {
    return autoUpdateBOQItemsWithAreaAndMarketPrice(
      items,
      targetAreaSqFt,
      currentAreaSqFt || 3000,
      {
        regionId: selectedRegion,
        tier: selectedTier,
        pricingBasis: selectedBasis,
        updateQuantitiesWithArea: updateQuantities,
        updateRatesWithMarketPrice: updateRates,
        selectedItemIds,
      }
    );
  }, [
    items,
    targetAreaSqFt,
    currentAreaSqFt,
    selectedRegion,
    selectedTier,
    selectedBasis,
    updateQuantities,
    updateRates,
    selectedItemIds,
  ]);

  // Compute key raw material takeoff metrics for this area
  const takeoffMetrics = useMemo(() => {
    return calculateMaterialTakeoffFromArea(
      targetAreaSqFt,
      selectedRegion,
      selectedTier,
      selectedBasis
    );
  }, [targetAreaSqFt, selectedRegion, selectedTier, selectedBasis]);

  if (!isOpen) return null;

  const { report } = previewResult;

  const handleToggleSelectAll = () => {
    if (selectedItemIds.length === items.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(items.map((i) => i.id));
    }
  };

  const handleToggleItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleApply = () => {
    const summary = `Applied Automatic Area & Market Update for ${targetAreaSqFt.toLocaleString()} sq.ft (${report.region.shortName} - ${selectedTier}). Updated ${report.quantitiesUpdatedCount} quantities and ${report.ratesUpdatedCount} market rates. Subtotal: ${formatCurrency(report.previousSubtotal, currency)} → ${formatCurrency(report.updatedSubtotal, currency)} (${report.variancePercent > 0 ? '+' : ''}${report.variancePercent}%).`;
    onApplyUpdate(previewResult.updatedItems, targetAreaSqFt, summary);
    onClose();
  };

  const quickAreaPresets = useMemo(() => {
    const basePresets = [
      { id: 'duplex', label: '1,200 sq.ft', value: 1200, tag: 'Duplex' },
      { id: 'villa', label: '2,400 sq.ft', value: 2400, tag: 'Villa' },
      { id: 'bungalow', label: '5,000 sq.ft', value: 5000, tag: 'Bungalow' },
      { id: 'commercial', label: '10,000 sq.ft', value: 10000, tag: 'Commercial' },
    ];
    if (currentAreaSqFt && currentAreaSqFt > 0 && !basePresets.some((p) => p.value === currentAreaSqFt)) {
      return [
        basePresets[0],
        basePresets[1],
        {
          id: 'current-active',
          label: `${currentAreaSqFt.toLocaleString()} sq.ft`,
          value: currentAreaSqFt,
          tag: 'Current',
        },
        ...basePresets.slice(2),
      ];
    }
    return basePresets;
  }, [currentAreaSqFt]);

  const filteredItemDetails = report.itemDetails.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      id="modal-area-market-auto-update"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  Automatic Material Quantities & Market Price Sync
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Engineering Takeoff
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Scales line item quantities automatically with project built-up area and recalibrates rates using verified live market benchmarks.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Section 1: Area & Calibration Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Built-up Area Control */}
            <div className="lg:col-span-7 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-amber-300 font-mono flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Project Built-up Area (Sq.Ft)</span>
                </label>
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <span className="text-slate-400">Previous:</span>
                  <span className="text-slate-300 font-bold">{currentAreaSqFt.toLocaleString()} sq.ft</span>
                </div>
              </div>

              {/* Area Numeric Input & Presets */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    id="input-target-area-sqft"
                    type="number"
                    min={100}
                    max={100000}
                    step={50}
                    value={targetAreaSqFt}
                    onChange={(e) => setTargetAreaSqFt(Math.max(100, Number(e.target.value) || 0))}
                    className="w-full bg-slate-900 border border-amber-500/40 rounded-xl px-4 py-2.5 text-white font-mono text-lg font-bold focus:outline-none focus:border-amber-400 pr-16"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                    sq.ft
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-400">
                  ≈ {Math.round(targetAreaSqFt * 0.092903)} m²
                </div>
              </div>

              {/* Range Slider */}
              <input
                id="slider-target-area"
                type="range"
                min={500}
                max={15000}
                step={100}
                value={targetAreaSqFt}
                onChange={(e) => setTargetAreaSqFt(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />

              {/* Quick Area Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {quickAreaPresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setTargetAreaSqFt(preset.value)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition border ${
                      targetAreaSqFt === preset.value
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span>{preset.label}</span>
                    <span className="ml-1 opacity-70 text-[10px]">({preset.tag})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Market Region & Quality Tier Selectors */}
            <div className="lg:col-span-5 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-300 font-mono flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>Pricing Region & Quality Specification</span>
              </label>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Region */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 font-mono">Market Hub</label>
                  <select
                    id="select-area-modal-region"
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value as MarketRegion)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono focus:border-amber-500 focus:outline-none"
                  >
                    {MARKET_REGIONS.map((r) => (
                      <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                        {r.shortName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tier */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 font-mono">Specification Tier</label>
                  <select
                    id="select-area-modal-tier"
                    value={selectedTier}
                    onChange={(e) => setSelectedTier(e.target.value as MarketQualityTier)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Economy">Economy</option>
                    <option value="Standard">Standard</option>
                    <option value="Premium">Premium</option>
                    <option value="Luxury">Luxury</option>
                  </select>
                </div>
              </div>

              {/* Pricing Basis */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-mono">Pricing Channel</label>
                <select
                  id="select-area-modal-basis"
                  value={selectedBasis}
                  onChange={(e) => setSelectedBasis(e.target.value as MarketPricingBasis)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono focus:border-amber-500 focus:outline-none text-xs"
                >
                  <option value="spot_market">Spot Commodity Market (Direct Mill/Batching)</option>
                  <option value="cpwd_dsr">CPWD Delhi Schedule of Rates (Official)</option>
                  <option value="procurement_bulk">Procurement Bulk (5% Volume Rebate)</option>
                  <option value="retail_cash">Retail Local Counter (+8% Handling)</option>
                </select>
              </div>

              {/* Mode Toggles */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={updateQuantities}
                    onChange={(e) => setUpdateQuantities(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500"
                  />
                  <span>Scale Quantities (Area)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={updateRates}
                    onChange={(e) => setUpdateRates(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500"
                  />
                  <span>Sync Market Rates</span>
                </label>
              </div>
            </div>
          </div>

          {/* Section 2: Real-time Derived Material Takeoff Highlights */}
          <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-slate-950 to-slate-950 rounded-xl border border-amber-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" />
                <span>Derived Core Material Quantities for {targetAreaSqFt.toLocaleString()} sq.ft</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Total Material Procurement: <strong className="text-white">{formatCurrency(takeoffMetrics.totalMaterialCost, currency)}</strong> (₹{takeoffMetrics.materialCostPerSqFt}/sq.ft)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center font-mono">
              <div className="p-2 bg-slate-900/90 rounded-lg border border-slate-800">
                <span className="block text-[10px] text-slate-400">Cement</span>
                <span className="text-xs font-bold text-amber-300">
                  {takeoffMetrics.keyMaterialVolumes.cementBags.toLocaleString()} bags
                </span>
                <span className="block text-[9px] text-slate-500">0.42 bags/sq.ft</span>
              </div>
              <div className="p-2 bg-slate-900/90 rounded-lg border border-slate-800">
                <span className="block text-[10px] text-slate-400">TMT Steel</span>
                <span className="text-xs font-bold text-amber-300">
                  {takeoffMetrics.keyMaterialVolumes.steelMetricTonnes} MT
                </span>
                <span className="block text-[9px] text-slate-500">3.8 kg/sq.ft</span>
              </div>
              <div className="p-2 bg-slate-900/90 rounded-lg border border-slate-800">
                <span className="block text-[10px] text-slate-400">Concrete RMC</span>
                <span className="text-xs font-bold text-amber-300">
                  {takeoffMetrics.keyMaterialVolumes.concreteM3} m³
                </span>
                <span className="block text-[9px] text-slate-500">0.035 m³/sq.ft</span>
              </div>
              <div className="p-2 bg-slate-900/90 rounded-lg border border-slate-800">
                <span className="block text-[10px] text-slate-400">M-Sand</span>
                <span className="text-xs font-bold text-amber-300">
                  {takeoffMetrics.keyMaterialVolumes.sandTonnes} tonnes
                </span>
                <span className="block text-[9px] text-slate-500">0.082 t/sq.ft</span>
              </div>
              <div className="p-2 bg-slate-900/90 rounded-lg border border-slate-800">
                <span className="block text-[10px] text-slate-400">AAC Blocks</span>
                <span className="text-xs font-bold text-amber-300">
                  {takeoffMetrics.keyMaterialVolumes.blocksM3} m³
                </span>
                <span className="block text-[9px] text-slate-500">0.028 m³/sq.ft</span>
              </div>
              <div className="p-2 bg-slate-900/90 rounded-lg border border-slate-800">
                <span className="block text-[10px] text-slate-400">Vitrified Tiles</span>
                <span className="text-xs font-bold text-amber-300">
                  {takeoffMetrics.keyMaterialVolumes.tilesSqFt.toLocaleString()} sq.ft
                </span>
                <span className="block text-[9px] text-slate-500">1.22 sq.ft/sq.ft</span>
              </div>
              <div className="p-2 bg-slate-900/90 rounded-lg border border-slate-800">
                <span className="block text-[10px] text-slate-400">Paint Coats</span>
                <span className="text-xs font-bold text-amber-300">
                  {takeoffMetrics.keyMaterialVolumes.paintLiters} L
                </span>
                <span className="block text-[9px] text-slate-500">Int + Ext</span>
              </div>
            </div>
          </div>

          {/* Section 3: Summary Comparison KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="block text-[11px] text-slate-400">Previous Subtotal</span>
              <span className="text-sm font-bold text-slate-200">
                {formatCurrency(report.previousSubtotal, currency)}
              </span>
              <span className="block text-[10px] text-slate-500 mt-0.5">
                ₹{report.previousCostPerSqFt}/sq.ft
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/40 bg-amber-500/5">
              <span className="block text-[11px] text-amber-300 font-bold">Updated Subtotal</span>
              <span className="text-sm font-bold text-amber-300">
                {formatCurrency(report.updatedSubtotal, currency)}
              </span>
              <span className="block text-[10px] text-amber-400/80 mt-0.5">
                ₹{report.updatedCostPerSqFt}/sq.ft ({targetAreaSqFt.toLocaleString()} sq.ft)
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="block text-[11px] text-slate-400">Net Variance</span>
              <span
                className={`text-sm font-bold flex items-center gap-1 ${
                  report.varianceAmount >= 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {report.varianceAmount >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                <span>
                  {report.varianceAmount >= 0 ? '+' : ''}
                  {formatCurrency(report.varianceAmount, currency)}
                </span>
              </span>
              <span className="block text-[10px] text-slate-500 mt-0.5">
                {report.variancePercent >= 0 ? '+' : ''}
                {report.variancePercent}% shift
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="block text-[11px] text-slate-400">Line Items Synchronized</span>
              <span className="text-sm font-bold text-white">
                {report.quantitiesUpdatedCount} Qty / {report.ratesUpdatedCount} Rates
              </span>
              <span className="block text-[10px] text-slate-500 mt-0.5">
                Across {items.length} BOQ items
              </span>
            </div>
          </div>

          {/* Section 4: Detailed Line Items Preview Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                  Itemized Schedule Preview ({filteredItemDetails.length} items)
                </span>
                <button
                  onClick={handleToggleSelectAll}
                  className="text-xs font-mono text-amber-400 hover:text-amber-300 underline"
                >
                  {selectedItemIds.length === items.length ? 'Deselect All' : 'Select All Items'}
                </button>
              </div>
              <input
                type="text"
                placeholder="Filter line items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono w-48"
              />
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 sticky top-0 z-10">
                  <tr>
                    <th className="p-2.5 text-center w-8">
                      <input
                        type="checkbox"
                        checked={selectedItemIds.length === items.length}
                        onChange={handleToggleSelectAll}
                        className="rounded text-amber-500"
                      />
                    </th>
                    <th className="p-2.5">Line Item</th>
                    <th className="p-2.5 text-right">Quantity (Previous → New)</th>
                    <th className="p-2.5 text-right">Unit Rate (Prev → Mkt)</th>
                    <th className="p-2.5 text-right">Line Amount</th>
                    <th className="p-2.5 text-center">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredItemDetails.map((detail) => {
                    const isSelected = selectedItemIds.includes(detail.id);
                    const deltaAmt = detail.newAmount - detail.previousAmount;
                    return (
                      <tr
                        key={detail.id}
                        className={`hover:bg-slate-900/60 transition ${
                          !isSelected ? 'opacity-40 bg-slate-950' : ''
                        }`}
                      >
                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleItem(detail.id)}
                            className="rounded text-amber-500"
                          />
                        </td>
                        <td className="p-2.5">
                          <div className="font-medium text-white max-w-xs truncate" title={detail.name}>
                            {detail.name}
                          </div>
                          <div className="text-[10px] text-amber-400/80">
                            {detail.qtyFormula}
                          </div>
                        </td>
                        <td className="p-2.5 text-right font-bold">
                          <span className="text-slate-400 line-through mr-1 text-[11px]">
                            {detail.previousQty}
                          </span>
                          <span className="text-amber-300">
                            {detail.newQty}
                          </span>
                        </td>
                        <td className="p-2.5 text-right">
                          <span className="text-slate-400 line-through mr-1 text-[11px]">
                            {formatCurrency(detail.previousRate, currency)}
                          </span>
                          <span className="text-white font-bold">
                            {formatCurrency(detail.newRate, currency)}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-bold text-white">
                          {formatCurrency(detail.newAmount, currency)}
                        </td>
                        <td className="p-2.5 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              deltaAmt > 0
                                ? 'bg-amber-500/20 text-amber-300'
                                : deltaAmt < 0
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {deltaAmt > 0 ? `+${formatCurrency(deltaAmt, currency)}` : formatCurrency(deltaAmt, currency)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="text-xs font-mono text-slate-400">
            Target Area: <strong className="text-amber-300">{targetAreaSqFt.toLocaleString()} sq.ft</strong> • Hub: <strong className="text-slate-200">{report.region.shortName}</strong> ({selectedTier})
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              id="btn-confirm-area-market-auto-update"
              onClick={handleApply}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg transition"
            >
              <Zap className="w-4 h-4" />
              <span>Apply Auto-Update ({selectedItemIds.length} Items)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
