import React, { useState, useMemo } from 'react';
import {
  HardHat,
  X,
  CheckCircle2,
  AlertCircle,
  Building,
  Layers,
  Wrench,
  Paintbrush,
  Grid,
  Zap,
  Droplet,
  Palette,
  Shield,
  Hammer,
  ArrowRight,
  Download,
  Sparkles,
  Sliders,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  Check,
  Plus
} from 'lucide-react';
import { BOQItem } from '../types';
import { formatCurrency, CurrencyCode } from '../utils/formatters';
import {
  LABOUR_SCHEDULE_BENCHMARKS,
  LabourTradeBenchmark,
  LabourRateMode,
  calculateLabourScheduleForArea,
  applyLabourScheduleToBOQ,
  getMissingTradesFromBOQ,
  createBOQItemFromLabourTrade,
  matchItemToLabourTrade
} from '../utils/labourRateEngine';

interface LabourCostBreakdownModalProps {
  items: BOQItem[];
  currency: CurrencyCode;
  areaSqFt: number;
  isOpen: boolean;
  onClose: () => void;
  onApplyRates: (updatedItems: BOQItem[]) => void;
}

export const LabourCostBreakdownModal: React.FC<LabourCostBreakdownModalProps> = ({
  items,
  currency,
  areaSqFt,
  isOpen,
  onClose,
  onApplyRates,
}) => {
  const [selectedMode, setSelectedMode] = useState<LabourRateMode>('avg');
  const [viewScope, setViewScope] = useState<'base1000' | 'projectArea'>('projectArea');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Scaled calculations
  const scheduleData = useMemo(() => {
    return calculateLabourScheduleForArea(areaSqFt, selectedMode);
  }, [areaSqFt, selectedMode]);

  const base1000Data = useMemo(() => {
    return calculateLabourScheduleForArea(1000, selectedMode);
  }, [selectedMode]);

  // Matching BOQ items map
  const itemTradeMap = useMemo(() => {
    const map = new Map<string, BOQItem[]>();
    LABOUR_SCHEDULE_BENCHMARKS.forEach((b) => map.set(b.id, []));

    items.forEach((item) => {
      const trade = matchItemToLabourTrade(item);
      if (trade && map.has(trade.id)) {
        map.get(trade.id)!.push(item);
      }
    });
    return map;
  }, [items]);

  // Missing trades in current BOQ
  const missingTrades = useMemo(() => {
    return getMissingTradesFromBOQ(items);
  }, [items]);

  // Unpriced items count
  const unpricedCount = useMemo(() => {
    return items.filter((it) => it.rate <= 0).length;
  }, [items]);

  // Filtered benchmarks
  const filteredBenchmarks = useMemo(() => {
    if (!searchQuery.trim()) return LABOUR_SCHEDULE_BENCHMARKS;
    const q = searchQuery.toLowerCase();
    return LABOUR_SCHEDULE_BENCHMARKS.filter(
      (b) =>
        b.trade.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.targetCategory.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  if (!isOpen) return null;

  const currentDisplayData = viewScope === 'projectArea' ? scheduleData : base1000Data;
  const currentArea = viewScope === 'projectArea' ? areaSqFt : 1000;

  // Handle 1-Click Update All BOQ Rates
  const handleUpdateAllRates = () => {
    const result = applyLabourScheduleToBOQ(items, areaSqFt, selectedMode);
    onApplyRates(result.updatedItems);
    setNotification(
      `Successfully calibrated ${result.modifiedCount} BOQ items with civil engineering labour rates! ${
        result.unpricedFixedCount > 0 ? `Fixed ${result.unpricedFixedCount} unpriced items.` : ''
      }`
    );
    setTimeout(() => setNotification(null), 5000);
  };

  // Handle Append Missing Trades
  const handleAddMissingTrades = () => {
    if (missingTrades.length === 0) return;
    const newItems = missingTrades.map((trade) =>
      createBOQItemFromLabourTrade(trade, areaSqFt, selectedMode)
    );
    onApplyRates([...items, ...newItems]);
    setNotification(`Appended ${newItems.length} missing trade scopes to BOQ!`);
    setTimeout(() => setNotification(null), 5000);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Sl No',
      'Labor Work',
      'Unit / Description',
      'Rate Min (₹)',
      'Rate Max (₹)',
      'Rate Avg (₹)',
      'Estimated Cost (Per 1000 Sq.Ft)',
      `Estimated Cost (${areaSqFt} Sq.Ft Project Scope)`,
      'Target Category',
      'BOQ Coverage'
    ];

    const rows = LABOUR_SCHEDULE_BENCHMARKS.map((b, i) => {
      const scaledCost = Math.round(b.costPer1000Avg * (areaSqFt / 1000));
      const coverageCount = (itemTradeMap.get(b.id) || []).length;
      return [
        i + 1,
        `"${b.trade}"`,
        `"${b.description}"`,
        b.rateMin,
        b.rateMax,
        b.rateAvg,
        `"₹${b.costPer1000Min.toLocaleString()} - ₹${b.costPer1000Max.toLocaleString()}"`,
        `"₹${scaledCost.toLocaleString()}"`,
        `"${b.targetCategory}"`,
        `"${coverageCount > 0 ? `${coverageCount} items linked` : 'Missing'}"`
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Civil_Labour_Cost_Breakdown_${areaSqFt}sqft.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper icon renderer
  const renderTradeIcon = (iconName: string) => {
    const props = { className: 'w-4 h-4' };
    switch (iconName) {
      case 'Building':
        return <Building {...props} className="w-4 h-4 text-amber-400" />;
      case 'Layers':
        return <Layers {...props} className="w-4 h-4 text-sky-400" />;
      case 'Wrench':
        return <Wrench {...props} className="w-4 h-4 text-emerald-400" />;
      case 'Paintbrush':
        return <Paintbrush {...props} className="w-4 h-4 text-pink-400" />;
      case 'Grid':
        return <Grid {...props} className="w-4 h-4 text-purple-400" />;
      case 'Zap':
        return <Zap {...props} className="w-4 h-4 text-yellow-400" />;
      case 'Droplet':
        return <Droplet {...props} className="w-4 h-4 text-cyan-400" />;
      case 'Palette':
        return <Palette {...props} className="w-4 h-4 text-rose-400" />;
      case 'Shield':
        return <Shield {...props} className="w-4 h-4 text-indigo-400" />;
      case 'Hammer':
        return <Hammer {...props} className="w-4 h-4 text-amber-300" />;
      case 'HardHat':
        return <HardHat {...props} className="w-4 h-4 text-orange-400" />;
      default:
        return <Building {...props} className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Detailed Labour Cost Breakdown
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  Per 1,000 Sq.Ft Schedule
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Verified Civil Standard
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Transparent labour estimates, rate analysis, and 1-click BOQ calibration per industry schedule
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notification Toast inside Modal */}
        {notification && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between shadow-lg animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{notification}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-emerald-400 hover:text-white text-xs underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Controls Bar */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/50 flex flex-wrap items-center justify-between gap-3">
          {/* Scope Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewScope('projectArea')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                viewScope === 'projectArea'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Project Area ({areaSqFt.toLocaleString()} sq.ft)</span>
            </button>
            <button
              onClick={() => setViewScope('base1000')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                viewScope === 'base1000'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Base 1,000 sq.ft Benchmark</span>
            </button>
          </div>

          {/* Rate Pricing Tier / Mode */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-amber-400" /> Rate Mode:
            </span>
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
              <button
                onClick={() => setSelectedMode('min')}
                className={`px-2.5 py-1 rounded transition ${
                  selectedMode === 'min'
                    ? 'bg-sky-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Minimum / Budget Construction Rates"
              >
                Min (Budget)
              </button>
              <button
                onClick={() => setSelectedMode('avg')}
                className={`px-2.5 py-1 rounded transition ${
                  selectedMode === 'avg'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Average / Recommended Market Rates"
              >
                Avg (Recommended)
              </button>
              <button
                onClick={() => setSelectedMode('max')}
                className={`px-2.5 py-1 rounded transition ${
                  selectedMode === 'max'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Maximum / Premium Finishing Rates"
              >
                Max (Premium)
              </button>
            </div>
          </div>

          {/* Actions: Export CSV & Add Missing */}
          <div className="flex items-center gap-2">
            {missingTrades.length > 0 && (
              <button
                onClick={handleAddMissingTrades}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium transition flex items-center gap-1.5"
                title={`Append ${missingTrades.length} missing trade packages to BOQ`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Missing Trades ({missingTrades.length})</span>
              </button>
            )}

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition flex items-center gap-1.5 border border-slate-700"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 border-b border-slate-800">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              Estimated Labour Total ({currentArea.toLocaleString()} sq.ft)
            </span>
            <div className="text-xl font-bold text-amber-400 mt-1">
              {formatCurrency(currentDisplayData.totalSelected, currency)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Range: {formatCurrency(currentDisplayData.totalMin, currency)} – {formatCurrency(currentDisplayData.totalMax, currency)}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              Labour Rate per Sq.Ft
            </span>
            <div className="text-xl font-bold text-white mt-1">
              {currency}{currentDisplayData.ratePerSqFtAvg} <span className="text-xs text-slate-400 font-normal">/ sq.ft</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Range: {currency}{currentDisplayData.ratePerSqFtMin} – {currency}{currentDisplayData.ratePerSqFtMax}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              Standard Trades
            </span>
            <div className="text-xl font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
              <span>11 / 11</span>
              <span className="text-xs text-emerald-400/80 font-normal">Active</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Civil engineer schedule
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              BOQ Alignment Status
            </span>
            <div className="text-xl font-bold text-sky-400 mt-1 flex items-center gap-1.5">
              <span>{items.length - unpricedCount} / {items.length}</span>
              {unpricedCount > 0 ? (
                <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30">
                  {unpricedCount} unpriced
                </span>
              ) : (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  100% Priced
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {unpricedCount > 0 ? 'Click Update to auto-price' : 'All items priced'}
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-[11px] font-mono text-slate-400">
                  <th className="py-3 px-4 font-semibold">Labor Work</th>
                  <th className="py-3 px-4 font-semibold">Unit / Description</th>
                  <th className="py-3 px-4 font-semibold">Standard Rate (₹)</th>
                  <th className="py-3 px-4 font-semibold">
                    Cost (Per 1000 Sq.Ft)
                  </th>
                  <th className="py-3 px-4 font-semibold text-amber-300">
                    Cost ({areaSqFt.toLocaleString()} Sq.Ft Project)
                  </th>
                  <th className="py-3 px-4 font-semibold text-center">BOQ Coverage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredBenchmarks.map((trade) => {
                  const scale = areaSqFt / 1000;
                  const scaledCost = Math.round(
                    (selectedMode === 'min'
                      ? trade.costPer1000Min
                      : selectedMode === 'max'
                      ? trade.costPer1000Max
                      : trade.costPer1000Avg) * scale
                  );
                  const linkedItems = itemTradeMap.get(trade.id) || [];
                  const isCovered = linkedItems.length > 0;

                  return (
                    <tr
                      key={trade.id}
                      className="hover:bg-slate-900/60 transition group"
                    >
                      {/* Trade Name */}
                      <td className="py-3 px-4 font-medium text-white">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                            {renderTradeIcon(trade.iconName)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                              {trade.trade}
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Category: {trade.targetCategory}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Description & Unit */}
                      <td className="py-3 px-4 text-slate-300">
                        <div className="font-medium">{trade.description}</div>
                        <div className="text-[10px] text-slate-500 line-clamp-1">{trade.notes}</div>
                      </td>

                      {/* Standard Rate */}
                      <td className="py-3 px-4 font-mono font-semibold text-amber-400">
                        {trade.rateDisplay}
                      </td>

                      {/* Cost for 1,000 sq.ft */}
                      <td className="py-3 px-4 font-mono text-slate-300">
                        ₹{trade.costPer1000Min.toLocaleString()} – ₹{trade.costPer1000Max.toLocaleString()}
                        <div className="text-[10px] text-slate-500 font-sans">
                          Avg: ₹{trade.costPer1000Avg.toLocaleString()}
                        </div>
                      </td>

                      {/* Cost for Project */}
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400 bg-emerald-950/10">
                        ₹{scaledCost.toLocaleString()}
                        <div className="text-[10px] text-slate-400 font-sans font-normal">
                          {selectedMode} rate
                        </div>
                      </td>

                      {/* Coverage in BOQ */}
                      <td className="py-3 px-4 text-center">
                        {isCovered ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono">
                            <Check className="w-3 h-3" />
                            <span>{linkedItems.length} item{linkedItems.length > 1 ? 's' : ''} in BOQ</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono">
                            <AlertCircle className="w-3 h-3" />
                            <span>Not in BOQ</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Clicking <strong className="text-white">Update All BOQ Rates</strong> calibrates your active BOQ items, fills missing rates, and aligns labor splits with this schedule.
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 transition"
            >
              Close
            </button>

            <button
              onClick={handleUpdateAllRates}
              className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-500 shadow-md transition flex items-center gap-2 active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>⚡ 1-Click Update All BOQ Rates With Labour Schedule</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
