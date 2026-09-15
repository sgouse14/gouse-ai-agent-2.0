import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  LineChart as LineChartIcon,
  Calendar,
  Layers,
  AlertTriangle,
  ShieldCheck,
  Download,
  Info,
  Sliders,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  History,
  Coins,
  RefreshCw,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { BOQItem } from '../types';
import { formatCurrency, CurrencyCode } from '../utils/formatters';
import {
  HISTORICAL_MATERIAL_INDICES,
  COMMODITY_INDEX_METAS,
  SIMULATION_SCENARIOS,
  SimulationScenario,
  SimulatedFuturePoint,
} from '../data/historicalIndices';
import { simulateFutureBOQCosts, SimulationParams } from '../utils/costSimulation';

interface FutureCostSimulatorProps {
  items: BOQItem[];
  currency: CurrencyCode;
  contingencyPercent: number;
  areaSqFt: number;
  onApplyForecastedRates?: (escalationMultiplier: number) => void;
  onClose?: () => void;
}

type ChartViewMode = 'total-envelope' | 'categories' | 'indices-continuity';

export const FutureCostSimulator: React.FC<FutureCostSimulatorProps> = ({
  items,
  currency,
  contingencyPercent,
  areaSqFt,
  onApplyForecastedRates,
  onClose,
}) => {
  // Horizon in months: 6, 12, 18, 24, 36
  const [horizonMonths, setHorizonMonths] = useState<number>(12);
  const [scenario, setScenario] = useState<SimulationScenario>('baseline');
  const [customInflation, setCustomInflation] = useState<number>(0); // -5% to +15%
  const [chartViewMode, setChartViewMode] = useState<ChartViewMode>('total-envelope');
  const [showScheduleTable, setShowScheduleTable] = useState<boolean>(false);
  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);

  // Compute simulation
  const simulation = useMemo(() => {
    return simulateFutureBOQCosts({
      items,
      contingencyPercent,
      horizonMonths,
      scenario,
      customInflationOverridePct: customInflation,
    });
  }, [items, contingencyPercent, horizonMonths, scenario, customInflation]);

  const activeScenarioConfig = SIMULATION_SCENARIOS.find((s) => s.id === scenario) || SIMULATION_SCENARIOS[0];

  // Prepare data for "Indices Continuity" chart (past 18 months + future points)
  const indicesContinuityData = useMemo(() => {
    const historicalSlice = HISTORICAL_MATERIAL_INDICES.slice(-18).map((pt, idx) => ({
      name: pt.displayMonth,
      monthOffset: idx - 18,
      isHistorical: true,
      steelIndex: pt.steelIndex,
      cementIndex: pt.cementIndex,
      aggregatesIndex: pt.aggregatesIndex,
      masonryIndex: pt.masonryIndex,
      finishesIndex: pt.finishesIndex,
      laborIndex: pt.laborIndex,
      compositeIndex: pt.compositeIndex,
    }));

    const futureSlice = simulation.points.map((pt) => ({
      name: pt.displayMonth,
      monthOffset: pt.monthOffset,
      isHistorical: false,
      steelIndex: pt.steelIndex,
      cementIndex: pt.cementIndex,
      aggregatesIndex: pt.aggregatesIndex,
      masonryIndex: pt.masonryIndex,
      finishesIndex: pt.finishesIndex,
      laborIndex: pt.laborIndex,
      compositeIndex: pt.compositeIndex,
    }));

    return [...historicalSlice, ...futureSlice.slice(1)]; // Skip M+0 duplicate
  }, [simulation.points]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Month Index',
      'Month Name',
      'Composite Price Index',
      'Concrete & Cement (INR)',
      'Steel Rebar (INR)',
      'Masonry (INR)',
      'Finishes (INR)',
      'Labor Component (INR)',
      'Total Projected Cost (INR)',
      'Base Cost (INR)',
      'Escalation Variance (INR)',
      'Escalation Variance (%)',
      'Contingency Ceiling (INR)',
      'Contingency Breached',
    ];

    const rows = simulation.points.map((p) => [
      p.monthOffset,
      `"${p.displayMonth}"`,
      p.compositeIndex,
      p.concreteCost,
      p.steelCost,
      p.masonryCost,
      p.finishesCost,
      p.laborCost,
      p.totalCostActiveScenario,
      p.budgetFreezeLine,
      p.varianceAmount,
      `${p.variancePercent}%`,
      p.contingencyCeiling,
      p.isBreachingContingency ? 'YES' : 'NO',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `boq_future_cost_simulation_${horizonMonths}months_${scenario}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Apply forecasted multiplier back to BOQ items
  const handleApplyForecast = () => {
    if (simulation.currentTotal <= 0) return;
    const multiplier = simulation.projectedTotal / simulation.currentTotal;
    if (onApplyForecastedRates) {
      onApplyForecastedRates(multiplier);
      setAppliedNotification(`Successfully calibrated BOQ item rates to Month +${horizonMonths} projected cost level (${multiplier > 1 ? '+' : ''}${((multiplier - 1) * 100).toFixed(1)}%)!`);
      setTimeout(() => setAppliedNotification(null), 5000);
    }
  };

  // Custom Recharts Tooltip for Total Cost Envelope
  const CustomTotalTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data: SimulatedFuturePoint = payload[0]?.payload;
      if (!data) return null;

      return (
        <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-lg shadow-xl text-xs space-y-2 max-w-xs backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 font-semibold text-slate-200">
            <span>{label}</span>
            <span className="font-mono text-amber-400">Idx: {data.compositeIndex}</span>
          </div>

          <div className="space-y-1 font-mono text-[11px]">
            <div className="flex justify-between items-center text-amber-300">
              <span className="text-slate-300">Projected ({activeScenarioConfig.name.split(' ')[0]}):</span>
              <span className="font-bold">{formatCurrency(data.totalCostActiveScenario, currency)}</span>
            </div>

            <div className="flex justify-between items-center text-slate-400">
              <span>Today's Base Cost:</span>
              <span>{formatCurrency(data.budgetFreezeLine, currency)}</span>
            </div>

            <div className="flex justify-between items-center text-rose-300">
              <span>High Shock (+1.5σ):</span>
              <span>{formatCurrency(data.totalCostShock, currency)}</span>
            </div>

            <div className="flex justify-between items-center text-emerald-300">
              <span>Cooling Cycle (-1.0σ):</span>
              <span>{formatCurrency(data.totalCostCooling, currency)}</span>
            </div>

            <div className="flex justify-between items-center pt-1 border-t border-slate-800">
              <span className="text-slate-300 font-sans">Net Escalation:</span>
              <span className={`font-bold ${data.varianceAmount >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {data.varianceAmount >= 0 ? '+' : ''}
                {formatCurrency(data.varianceAmount, currency)} ({data.variancePercent > 0 ? '+' : ''}{data.variancePercent}%)
              </span>
            </div>

            <div className="flex justify-between items-center text-[10px]">
              <span className="text-slate-400">Contingency Limit:</span>
              <span className={data.isBreachingContingency ? 'text-red-400 font-bold' : 'text-slate-400'}>
                {formatCurrency(data.contingencyCeiling, currency)}
              </span>
            </div>
          </div>

          {data.isBreachingContingency && (
            <div className="mt-1 p-1.5 rounded bg-red-950/60 border border-red-500/40 text-[10px] text-red-300 font-sans flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
              <span>Breaches {contingencyPercent}% design reserve</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Category Breakdown
  const CustomCategoryTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data: SimulatedFuturePoint = payload[0]?.payload;
      if (!data) return null;

      return (
        <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-lg shadow-xl text-xs space-y-1.5 max-w-xs backdrop-blur-sm font-mono">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1 text-slate-200 font-sans font-semibold">
            <span>{label}</span>
            <span className="text-amber-400 text-[11px]">{formatCurrency(data.totalCostActiveScenario, currency)}</span>
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between items-center text-cyan-400">
              <span>Steel & Rebar:</span>
              <span>{formatCurrency(data.steelCost, currency)}</span>
            </div>
            <div className="flex justify-between items-center text-amber-400">
              <span>Concrete & Cement:</span>
              <span>{formatCurrency(data.concreteCost, currency)}</span>
            </div>
            <div className="flex justify-between items-center text-orange-400">
              <span>Walling & Masonry:</span>
              <span>{formatCurrency(data.masonryCost, currency)}</span>
            </div>
            <div className="flex justify-between items-center text-violet-400">
              <span>Finishes & Glazing:</span>
              <span>{formatCurrency(data.finishesCost, currency)}</span>
            </div>
            <div className="flex justify-between items-center text-pink-400 border-t border-slate-800 pt-1">
              <span>Labor Component:</span>
              <span>{formatCurrency(data.laborCost, currency)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="future-cost-simulator" className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-500/30 shadow-2xl space-y-5">
      {/* Top Banner & Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-serif-classic">
                  Future Cost Variation & Material Price Index Simulator
                </h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                  36-Mo Historical WPI Model
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Predicts future project budget fluctuations over time based on historical commodity indices (Steel Rebar, Cement, Sand, Masonry & Construction Labor).
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onApplyForecastedRates && (
            <button
              id="btn-apply-forecast-rates"
              onClick={handleApplyForecast}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition"
              title="Apply forecasted inflation multiplier back to all BOQ item unit rates"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Apply M+{horizonMonths} Rates to BOQ</span>
            </button>
          )}

          <button
            id="btn-export-sim-csv"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Forecast CSV</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition text-xs"
              title="Close Simulator"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {appliedNotification && (
        <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500 text-emerald-200 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{appliedNotification}</span>
          </div>
          <button onClick={() => setAppliedNotification(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Today's Current Base Cost */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Current Baseline (Month 0)</span>
            <span className="text-[10px] text-slate-500 font-mono">Present Day</span>
          </div>
          <p className="text-xl font-bold font-mono text-white">
            {formatCurrency(simulation.currentTotal, currency)}
          </p>
          <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between pt-0.5">
            <span>{items.length} items</span>
            <span>{areaSqFt > 0 ? `₹${Math.round(simulation.currentTotal / areaSqFt)}/sq.ft` : ''}</span>
          </div>
        </div>

        {/* Card 2: Projected Cost at Selected Horizon */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/30 bg-amber-500/5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-300 font-medium">Projected Cost (M+{horizonMonths})</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-semibold">
              {activeScenarioConfig.name.split(' ')[0]}
            </span>
          </div>
          <p className="text-xl font-bold font-mono text-amber-400">
            {formatCurrency(simulation.projectedTotal, currency)}
          </p>
          <div className="text-[11px] font-mono flex items-center justify-between pt-0.5">
            <span className={simulation.totalEscalationAmount >= 0 ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'}>
              {simulation.totalEscalationAmount >= 0 ? '+' : ''}
              {formatCurrency(simulation.totalEscalationAmount, currency)}
            </span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
              simulation.totalEscalationPercent > 5
                ? 'bg-rose-500/20 text-rose-300'
                : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              {simulation.totalEscalationPercent >= 0 ? '+' : ''}{simulation.totalEscalationPercent}%
            </span>
          </div>
        </div>

        {/* Card 3: Contingency Status */}
        <div className={`p-3.5 rounded-xl bg-slate-950 border space-y-1 ${
          simulation.contingencyBreached
            ? 'border-red-500/40 bg-red-950/15'
            : 'border-emerald-500/30 bg-emerald-950/15'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300 font-medium">Contingency Reserve</span>
            <span className="text-[10px] text-slate-400 font-mono">{contingencyPercent}% budget</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className={`text-xl font-bold font-mono ${simulation.contingencyBreached ? 'text-red-400' : 'text-emerald-400'}`}>
              {formatCurrency(simulation.contingencyAmount, currency)}
            </p>
          </div>
          <div className="text-[11px] font-sans flex items-center gap-1.5 pt-0.5">
            {simulation.contingencyBreached ? (
              <span className="text-red-400 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Breached at M+{simulation.breachMonth}
              </span>
            ) : (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Adequate across {horizonMonths}M
              </span>
            )}
          </div>
        </div>

        {/* Card 4: Peak Volatility Month & Driver */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Steepest Escalation Surge</span>
            <Clock className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <p className="text-xl font-bold font-mono text-cyan-400">
            +{simulation.maxMonthlyIncreasePercent}% <span className="text-xs font-normal text-slate-400">/ mo</span>
          </p>
          <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between pt-0.5">
            <span>Peak: {simulation.maxMonthlyIncreaseMonth}</span>
            <span className="text-amber-400 text-[10px]">Steel/Cement</span>
          </div>
        </div>
      </div>

      {/* Interactive Simulation Controls Bar */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Horizon Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Forecast Horizon:</span>
              </label>
              <span className="text-xs font-mono font-bold text-amber-400">{horizonMonths} Months</span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {[6, 12, 18, 24, 36].map((m) => (
                <button
                  key={m}
                  onClick={() => setHorizonMonths(m)}
                  className={`py-1.5 rounded text-xs font-mono font-semibold transition border ${
                    horizonMonths === m
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {m}M
                </button>
              ))}
            </div>
          </div>

          {/* Scenario Selection */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Macroeconomic & Market Scenario:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {SIMULATION_SCENARIOS.map((s) => {
                const isSelected = scenario === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setScenario(s.id)}
                    className={`p-2 rounded-lg text-left transition border ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-white ring-1 ring-amber-500/40'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className={`text-xs font-bold truncate ${isSelected ? 'text-amber-300' : 'text-slate-300'}`}>
                      {s.name.split(' ')[0]}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate font-mono">{s.tagline.split('(')[1]?.replace(')', '') || s.tagline}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Inflation Sensitivity Nudge Slider & Active Scenario Info */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
          <div className="text-slate-400 max-w-xl">
            <span className="font-semibold text-slate-300">{activeScenarioConfig.name}: </span>
            <span>{activeScenarioConfig.description}</span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-slate-400 font-mono text-[11px]">Inflation Nudge:</span>
            <input
              type="range"
              min={-5}
              max={15}
              step={0.5}
              value={customInflation}
              onChange={(e) => setCustomInflation(Number(e.target.value))}
              className="w-28 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <span className="font-mono text-amber-400 font-bold w-12 text-right">
              {customInflation > 0 ? `+${customInflation}%` : `${customInflation}%`}
            </span>
            {customInflation !== 0 && (
              <button
                onClick={() => setCustomInflation(0)}
                className="text-[10px] text-slate-500 hover:text-amber-300 underline"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chart View Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800 w-fit">
          <button
            onClick={() => setChartViewMode('total-envelope')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition flex items-center gap-1.5 ${
              chartViewMode === 'total-envelope'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LineChartIcon className="w-3.5 h-3.5" />
            <span>Total Cost & Confidence Bands</span>
          </button>

          <button
            onClick={() => setChartViewMode('categories')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition flex items-center gap-1.5 ${
              chartViewMode === 'categories'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Material Categories</span>
          </button>

          <button
            onClick={() => setChartViewMode('indices-continuity')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition flex items-center gap-1.5 ${
              chartViewMode === 'indices-continuity'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historical WPI Grounding</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 font-mono flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span>Forecast Curve</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-slate-400"></span>
            <span>Base Freeze Line</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-red-400 border-dashed"></span>
            <span>Contingency Ceiling</span>
          </div>
        </div>
      </div>

      {/* RECHARTS LINE CHART CANVAS */}
      <div className="h-80 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartViewMode === 'total-envelope' ? (
            <LineChart data={simulation.points} margin={{ top: 15, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis
                dataKey="displayMonth"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickFormatter={(v) => {
                  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
                  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
                  return `₹${(v / 1000).toFixed(0)}k`;
                }}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTotalTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value) => <span className="text-xs text-slate-300 font-medium mr-2">{value}</span>}
              />

              {/* Reference line for baseline budget freeze */}
              <ReferenceLine
                y={simulation.currentTotal}
                stroke="#94a3b8"
                strokeDasharray="4 4"
                label={{
                  value: 'Current Base',
                  fill: '#94a3b8',
                  fontSize: 10,
                  position: 'insideBottomLeft',
                }}
              />

              {/* Reference line for contingency limit */}
              <ReferenceLine
                y={simulation.contingencyAmount + simulation.currentTotal}
                stroke="#f43f5e"
                strokeDasharray="3 3"
                label={{
                  value: `${contingencyPercent}% Contingency Ceiling`,
                  fill: '#f43f5e',
                  fontSize: 10,
                  position: 'insideTopLeft',
                }}
              />

              {/* Lines */}
              <Line
                name="Projected Total Cost"
                type="monotone"
                dataKey="totalCostActiveScenario"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ fill: '#f59e0b', r: 4 }}
                activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
              />

              <Line
                name="High Shock (+1.5σ)"
                type="monotone"
                dataKey="totalCostShock"
                stroke="#f43f5e"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                dot={false}
              />

              <Line
                name="Cooling Cycle (-1.0σ)"
                type="monotone"
                dataKey="totalCostCooling"
                stroke="#10b981"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                dot={false}
              />
            </LineChart>
          ) : chartViewMode === 'categories' ? (
            <LineChart data={simulation.points} margin={{ top: 15, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis
                dataKey="displayMonth"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickFormatter={(v) => {
                  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
                  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
                  return `₹${(v / 1000).toFixed(0)}k`;
                }}
              />
              <Tooltip content={<CustomCategoryTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value) => <span className="text-xs text-slate-300 font-medium mr-2">{value}</span>}
              />

              <Line
                name="Steel & Rebar"
                type="monotone"
                dataKey="steelCost"
                stroke="#06b6d4"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                name="Concrete & Cement"
                type="monotone"
                dataKey="concreteCost"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                name="Walling & Masonry"
                type="monotone"
                dataKey="masonryCost"
                stroke="#f97316"
                strokeWidth={2}
                dot={false}
              />
              <Line
                name="Finishes & Glazing"
                type="monotone"
                dataKey="finishesCost"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
              />
              <Line
                name="Labor Component"
                type="monotone"
                dataKey="laborCost"
                stroke="#ec4899"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            </LineChart>
          ) : (
            <LineChart data={indicesContinuityData} margin={{ top: 15, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                interval={Math.floor(indicesContinuityData.length / 8)}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                domain={[100, 'auto']}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const pt = payload[0]?.payload;
                    return (
                      <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs space-y-1 font-mono">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1 font-sans font-bold text-white">
                          <span>{label}</span>
                          <span className={pt.isHistorical ? 'text-emerald-400 text-[10px]' : 'text-amber-400 text-[10px]'}>
                            {pt.isHistorical ? '● Historical Actual' : '▲ Simulated Prediction'}
                          </span>
                        </div>
                        <div className="text-amber-400">Composite WPI: {pt.compositeIndex}</div>
                        <div className="text-cyan-400">Steel Index: {pt.steelIndex}</div>
                        <div className="text-emerald-400">Cement Index: {pt.cementIndex}</div>
                        <div className="text-pink-400">Labor Index: {pt.laborIndex}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend verticalAlign="top" height={36} />

              <ReferenceLine
                x="Month 0 (Now)"
                stroke="#f59e0b"
                strokeDasharray="3 3"
                label={{ value: 'PRESENT DAY (Forecast boundary)', fill: '#f59e0b', fontSize: 10, position: 'top' }}
              />

              <Line
                name="Composite Construction Index"
                type="monotone"
                dataKey="compositeIndex"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={false}
              />
              <Line
                name="Steel Index"
                type="monotone"
                dataKey="steelIndex"
                stroke="#06b6d4"
                strokeWidth={1.5}
                dot={false}
              />
              <Line
                name="Cement Index"
                type="monotone"
                dataKey="cementIndex"
                stroke="#10b981"
                strokeWidth={1.5}
                dot={false}
              />
              <Line
                name="Labor Index"
                type="monotone"
                dataKey="laborIndex"
                stroke="#ec4899"
                strokeWidth={1.5}
                strokeDasharray="2 2"
                dot={false}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Category Escalation Cards Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
        {simulation.categoryEscalations.map((cat) => (
          <div
            key={cat.category}
            className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1"
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }}></span>
              <span className="text-xs text-slate-300 font-medium truncate">{cat.category}</span>
            </div>
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-sm font-bold text-white">
                {formatCurrency(cat.projectedCost, currency)}
              </span>
              <span className={`text-[10px] font-bold ${cat.escalationPercent > 6 ? 'text-rose-400' : 'text-amber-400'}`}>
                {cat.escalationPercent > 0 ? '+' : ''}{cat.escalationPercent}%
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Delta: +{formatCurrency(cat.escalationAmount, currency)}
            </div>
          </div>
        ))}
      </div>

      {/* Quantity Surveying Strategy & Hedging Recommendations */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono">
              Quantity Surveyor Hedging & Procurement Strategy
            </h4>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Optimized for {horizonMonths}-Month Construction Lifecycle
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <div className="font-semibold text-cyan-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Bulk Steel Rate Locking</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              TMT Steel Rebar is projected to climb by ~{simulation.categoryEscalations.find((c) => c.category.includes('Steel'))?.escalationPercent || 5.2}% over the next {horizonMonths} months. Issue purchase orders in Month 1-2 with 90-day price locks to protect against cyclical scrap surges.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <div className="font-semibold text-amber-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Cement Seasonal Window</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Cement & ready-mix concrete experience demand softenings during mid-year monsoon periods. Heavy foundation and RCC slab pours scheduled during these windows yield 2-3% savings on procurement costs.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <div className={`font-semibold flex items-center gap-1.5 ${simulation.contingencyBreached ? 'text-red-400' : 'text-emerald-400'}`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Contingency Adequacy</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              {simulation.contingencyBreached
                ? `Current ${contingencyPercent}% contingency will be exhausted by Month +${simulation.breachMonth}. Recommend increasing contingency to ${Math.ceil(simulation.totalEscalationPercent + 2)}% in the tender contract terms.`
                : `Current ${contingencyPercent}% contingency reserve provides a healthy buffer against projected material escalation across the ${horizonMonths}-month timeline.`}
            </p>
          </div>
        </div>
      </div>

      {/* Toggleable Schedule Table */}
      <div className="border-t border-slate-800 pt-3">
        <button
          onClick={() => setShowScheduleTable(!showScheduleTable)}
          className="w-full py-2 px-3 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-between font-mono transition"
        >
          <span>
            {showScheduleTable ? 'Hide' : 'View'} Detailed Month-by-Month Forecast Table ({simulation.points.length} Monthly Snapshots)
          </span>
          {showScheduleTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showScheduleTable && (
          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 max-h-72 overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 font-mono text-[11px] text-slate-400">
                <tr>
                  <th className="py-2.5 px-3">Timeline</th>
                  <th className="py-2.5 px-3 text-right">Composite WPI</th>
                  <th className="py-2.5 px-3 text-right">Concrete/Cement</th>
                  <th className="py-2.5 px-3 text-right">Steel Rebar</th>
                  <th className="py-2.5 px-3 text-right">Finishes</th>
                  <th className="py-2.5 px-3 text-right">Labor Comp.</th>
                  <th className="py-2.5 px-4 text-right text-amber-400">Projected Total</th>
                  <th className="py-2.5 px-3 text-right">Escalation Δ</th>
                  <th className="py-2.5 px-3 text-center">Contingency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {simulation.points.map((p) => (
                  <tr
                    key={p.monthOffset}
                    className={`hover:bg-slate-900/50 transition ${
                      p.isBreachingContingency ? 'bg-red-950/20' : ''
                    }`}
                  >
                    <td className="py-2 px-3 font-semibold text-white">
                      {p.displayMonth}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-300">
                      {p.compositeIndex}
                    </td>
                    <td className="py-2 px-3 text-right text-amber-400/90">
                      {formatCurrency(p.concreteCost, currency)}
                    </td>
                    <td className="py-2 px-3 text-right text-cyan-400/90">
                      {formatCurrency(p.steelCost, currency)}
                    </td>
                    <td className="py-2 px-3 text-right text-violet-400/90">
                      {formatCurrency(p.finishesCost, currency)}
                    </td>
                    <td className="py-2 px-3 text-right text-pink-400/90">
                      {formatCurrency(p.laborCost, currency)}
                    </td>
                    <td className="py-2 px-4 text-right font-bold text-amber-400">
                      {formatCurrency(p.totalCostActiveScenario, currency)}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span className={p.varianceAmount >= 0 ? 'text-rose-400' : 'text-emerald-400'}>
                        {p.varianceAmount >= 0 ? '+' : ''}{p.variancePercent}%
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      {p.isBreachingContingency ? (
                        <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold">
                          BREACH
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px]">
                          OK
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
