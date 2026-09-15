import React, { useState, useMemo } from 'react';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Building,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  MapPin,
  Sliders,
  ShieldCheck,
  Info,
  Check,
  Layers,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { BOQItem } from '../types';
import { formatCurrency, CurrencyCode } from '../utils/formatters';
import {
  MARKET_REGIONS,
  MarketRegion,
  MarketPricingBasis,
  MarketQualityTier,
  matchBOQItemToMarket,
  autoUpdateBOQItemsWithMarketRates,
  ItemMarketMatchResult
} from '../utils/marketPriceEngine';

interface MarketPriceAutoUpdateModalProps {
  items: BOQItem[];
  currency: CurrencyCode;
  areaSqFt: number;
  isOpen: boolean;
  onClose: () => void;
  onApplyRates: (updatedItems: BOQItem[]) => void;
  initialRegion?: MarketRegion;
}

export const MarketPriceAutoUpdateModal: React.FC<MarketPriceAutoUpdateModalProps> = ({
  items,
  currency,
  areaSqFt,
  isOpen,
  onClose,
  onApplyRates,
  initialRegion = 'bangalore',
}) => {
  const [selectedRegion, setSelectedRegion] = useState<MarketRegion>(initialRegion);
  const [selectedTier, setSelectedTier] = useState<MarketQualityTier>('Standard');
  const [selectedBasis, setSelectedBasis] = useState<MarketPricingBasis>('spot_market');
  const [onlyUnderpriced, setOnlyUnderpriced] = useState<boolean>(false);
  const [fixUnits, setFixUnits] = useState<boolean>(true);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(() => items.map((it) => it.id));
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Compute live matches for current modal parameters
  const matches: ItemMarketMatchResult[] = useMemo(() => {
    return items.map((item) => matchBOQItemToMarket(item, selectedRegion, selectedTier, selectedBasis));
  }, [items, selectedRegion, selectedTier, selectedBasis]);

  // Filtered by search
  const filteredMatches = useMemo(() => {
    if (!searchQuery.trim()) return matches;
    const q = searchQuery.toLowerCase();
    return matches.filter(
      (m) =>
        m.item.name.toLowerCase().includes(q) ||
        m.item.category.toLowerCase().includes(q) ||
        m.matchedBenchmark.name.toLowerCase().includes(q)
    );
  }, [matches, searchQuery]);

  // Metrics
  const currentTotal = useMemo(() => {
    return items.reduce((sum, it) => sum + (it.quantity * it.rate), 0);
  }, [items]);

  const marketSimulatedTotal = useMemo(() => {
    return matches.reduce((sum, m) => {
      const isSelected = selectedItemIds.includes(m.item.id);
      if (isSelected) {
        return sum + m.marketAmount;
      }
      return sum + m.currentAmount;
    }, 0);
  }, [matches, selectedItemIds]);

  const varianceAmount = marketSimulatedTotal - currentTotal;
  const variancePct = currentTotal > 0 ? ((varianceAmount / currentTotal) * 100).toFixed(1) : '0';

  const unratedCount = useMemo(() => {
    return items.filter((it) => it.rate <= 0).length;
  }, [items]);

  const divergentCount = useMemo(() => {
    return matches.filter((m) => Math.abs(m.percentDelta) > 2.0).length;
  }, [matches]);

  // Toggle selection
  const handleToggleItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItemIds.length === items.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(items.map((it) => it.id));
    }
  };

  // Perform the update
  const handleApplyUpdate = () => {
    setIsUpdating(true);
    setTimeout(() => {
      const { updatedItems } = autoUpdateBOQItemsWithMarketRates(items, {
        regionId: selectedRegion,
        tier: selectedTier,
        pricingBasis: selectedBasis,
        onlyFlaggedOrZero: onlyUnderpriced,
        selectedItemIds,
        fixUnitMismatches: fixUnits,
      });

      onApplyRates(updatedItems);
      setIsUpdating(false);
      setUpdateSuccess(true);
      setTimeout(() => {
        setUpdateSuccess(false);
        onClose();
      }, 1200);
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div
        className="bg-slate-900 border border-slate-700/80 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Auto-Update BOQ Rates to Live Market Prices
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  CPWD / State PWD 2026
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically calibrate all line items in the Schedule of Rates & Quantities to prevailing construction market rates.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTROLS BAR: REGION, TIER, PRICING BASIS */}
        <div className="p-4 bg-slate-950/70 border-b border-slate-800/80 space-y-3 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Region Selector */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-400" />
                <span>Market Region Hub</span>
              </label>
              <select
                id="market-region-selector"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value as MarketRegion)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-sans"
              >
                {MARKET_REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quality Tier */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1 flex items-center gap-1">
                <Layers className="w-3 h-3 text-amber-400" />
                <span>Specification Quality Tier</span>
              </label>
              <select
                id="market-tier-selector"
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value as MarketQualityTier)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-sans"
              >
                <option value="Economy">Economy (Budget developer specs)</option>
                <option value="Standard">Standard (Quality residential / mid-range)</option>
                <option value="Premium">Premium (Architectural grade / branded specs)</option>
                <option value="Luxury">Luxury (Imported finishes / high-end villa)</option>
              </select>
            </div>

            {/* Pricing Basis */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1 flex items-center gap-1">
                <Sliders className="w-3 h-3 text-amber-400" />
                <span>Pricing Basis</span>
              </label>
              <select
                id="market-basis-selector"
                value={selectedBasis}
                onChange={(e) => setSelectedBasis(e.target.value as MarketPricingBasis)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-sans"
              >
                <option value="spot_market">Spot Market (Current 2026 live commodity rates)</option>
                <option value="cpwd_dsr">CPWD DSR Official (Government baseline rates)</option>
                <option value="procurement_bulk">Wholesale Procurement (Contractor volume discount -5%)</option>
                <option value="retail_cash">Retail / Spot Purchase (+8% dealer counter margin)</option>
              </select>
            </div>
          </div>

          {/* Quick Options & Metrics Summary */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/60">
            <div className="flex items-center gap-4 flex-wrap text-xs text-slate-300">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fixUnits}
                  onChange={(e) => setFixUnits(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-0 w-3.5 h-3.5 bg-slate-900"
                />
                <span>Auto-correct unit mismatches (e.g. steel in m3 → MT)</span>
              </label>

              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyUnderpriced}
                  onChange={(e) => setOnlyUnderpriced(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-0 w-3.5 h-3.5 bg-slate-900"
                />
                <span>Only update missing (₹0) and underpriced items</span>
              </label>
            </div>

            {/* Quick stats badge */}
            <div className="flex items-center gap-2 text-xs font-mono">
              {unratedCount > 0 && (
                <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                  {unratedCount} unpriced (₹0) items
                </span>
              )}
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {selectedItemIds.length} of {items.length} items selected
              </span>
            </div>
          </div>
        </div>

        {/* COMPARISON METRICS SUMMARY STRIP */}
        <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shrink-0">
          <div>
            <span className="text-[10px] text-slate-400 block font-mono">Current BOQ Total</span>
            <span className="text-sm font-bold font-mono text-slate-300">
              {formatCurrency(currentTotal, currency)}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block font-mono">Market Calibrated Total</span>
            <span className="text-sm font-bold font-mono text-amber-400">
              {formatCurrency(marketSimulatedTotal, currency)}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block font-mono">Net Budget Variance</span>
            <span
              className={`text-sm font-bold font-mono flex items-center gap-1 ${
                varianceAmount > 0 ? 'text-amber-400' : varianceAmount < 0 ? 'text-emerald-400' : 'text-slate-300'
              }`}
            >
              {varianceAmount > 0 ? '+' : ''}
              {formatCurrency(varianceAmount, currency)}
              <span className="text-[10px] opacity-80">({variancePct}%)</span>
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block font-mono">Rate per sq.ft Impact</span>
            <span className="text-sm font-bold font-mono text-white">
              ₹{Math.round(marketSimulatedTotal / (areaSqFt || 1)).toLocaleString()} / sq.ft
              <span className="text-[10px] text-slate-400 ml-1">
                ({areaSqFt.toLocaleString()} sq.ft)
              </span>
            </span>
          </div>
        </div>

        {/* ITEMS COMPARISON TABLE (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAll}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-mono transition"
              >
                {selectedItemIds.length === items.length ? 'Deselect All' : 'Select All Items'}
              </button>
              <span className="text-[11px] text-slate-400 font-mono">
                Showing {filteredMatches.length} items with real-market benchmarking
              </span>
            </div>
            <input
              type="text"
              placeholder="Search items by keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 w-48 sm:w-64"
            />
          </div>

          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-950 z-10 font-mono text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedItemIds.length === items.length}
                    onChange={handleSelectAll}
                    className="rounded border-slate-700 text-amber-500 focus:ring-0 w-3.5 h-3.5 bg-slate-900"
                  />
                </th>
                <th className="py-2.5 px-3 min-w-[220px]">Item & Benchmark Match</th>
                <th className="py-2.5 px-2 w-20 text-center">Unit</th>
                <th className="py-2.5 px-2 w-20 text-right">Qty</th>
                <th className="py-2.5 px-3 w-28 text-right">Current Rate</th>
                <th className="py-2.5 px-3 w-28 text-right">Market Rate</th>
                <th className="py-2.5 px-3 w-24 text-right">Delta</th>
                <th className="py-2.5 px-3 w-32 text-right">Market Amount</th>
                <th className="py-2.5 px-2 w-24 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredMatches.map((match) => {
                const isSelected = selectedItemIds.includes(match.item.id);
                const isMissing = match.currentRate <= 0;
                const isUnderpriced = match.rateDelta > 0;
                const isOverpriced = match.rateDelta < 0;

                return (
                  <tr
                    key={match.item.id}
                    className={`hover:bg-slate-800/30 transition ${
                      isSelected ? 'bg-slate-900/40' : 'opacity-60'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleItem(match.item.id)}
                        className="rounded border-slate-700 text-amber-500 focus:ring-0 w-3.5 h-3.5 bg-slate-900"
                      />
                    </td>

                    {/* Item Description */}
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-200">{match.item.name}</div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-mono">
                        <span className="text-amber-400/90">{match.item.category}</span>
                        <span>•</span>
                        <span className="text-slate-400 truncate max-w-[280px]" title={match.sourceCitation}>
                          Ref: {match.matchedBenchmark.name}
                        </span>
                      </div>
                      {match.unitMismatch && match.suggestedUnit && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Unit auto-conversion: {match.item.unit} → {match.suggestedUnit}
                        </span>
                      )}
                    </td>

                    {/* Unit */}
                    <td className="py-2.5 px-2 text-center font-mono text-slate-400">
                      {match.unitMismatch && fixUnits && match.suggestedUnit ? (
                        <span className="text-amber-300 font-bold underline" title="Will auto-correct to standard unit">
                          {match.suggestedUnit}
                        </span>
                      ) : (
                        match.item.unit
                      )}
                    </td>

                    {/* Quantity */}
                    <td className="py-2.5 px-2 text-right font-mono text-slate-300">
                      {match.item.quantity.toLocaleString()}
                    </td>

                    {/* Current Rate */}
                    <td className="py-2.5 px-3 text-right font-mono">
                      {isMissing ? (
                        <span className="text-red-400 font-bold bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/30">
                          ₹0 (Missing)
                        </span>
                      ) : (
                        <span className="text-slate-300">₹{match.currentRate.toLocaleString()}</span>
                      )}
                    </td>

                    {/* Market Rate */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">
                      ₹{match.marketRate.toLocaleString()}
                    </td>

                    {/* Delta */}
                    <td className="py-2.5 px-3 text-right font-mono">
                      {isMissing ? (
                        <span className="text-emerald-400 font-bold">New</span>
                      ) : (
                        <span
                          className={`font-semibold ${
                            isUnderpriced
                              ? 'text-amber-400'
                              : isOverpriced
                              ? 'text-emerald-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {match.percentDelta > 0 ? `+${match.percentDelta}%` : `${match.percentDelta}%`}
                        </span>
                      )}
                    </td>

                    {/* Market Amount */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-200">
                      {formatCurrency(match.marketAmount, currency)}
                    </td>

                    {/* Status badge */}
                    <td className="py-2.5 px-2 text-center font-mono text-[10px]">
                      {isMissing ? (
                        <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                          Unpriced
                        </span>
                      ) : match.status === 'exact' ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          ✓ Market
                        </span>
                      ) : isUnderpriced ? (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Below Mkt
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          Above Mkt
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* MODAL FOOTER WITH INSTANT ACTION */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              Rates cross-referenced against {MARKET_REGIONS.find((r) => r.id === selectedRegion)?.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>

            <button
              id="btn-confirm-auto-update-market-rates"
              onClick={handleApplyUpdate}
              disabled={isUpdating || selectedItemIds.length === 0}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition shadow-md ${
                updateSuccess
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Calibrating to Market Rates...</span>
                </>
              ) : updateSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Rates Successfully Updated!</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>
                    Auto-Update {selectedItemIds.length} Item{selectedItemIds.length > 1 ? 's' : ''} to Market Price
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
