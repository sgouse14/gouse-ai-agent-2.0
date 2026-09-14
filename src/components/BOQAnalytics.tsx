import React, { useState, useMemo } from 'react';
import {
  PieChart as PieIcon,
  TrendingDown,
  Layers,
  Sparkles,
  Search,
  Sliders,
  DollarSign,
  Activity,
  HardHat,
  Truck,
  Building,
  Check,
  ChevronDown,
  ChevronUp,
  Percent,
  CheckCircle2,
  ArrowRight,
  Flame,
  Scale
} from 'lucide-react';
import { BOQItem, Project } from '../types';
import { formatCurrency, CurrencyCode } from '../utils/formatters';

interface BOQAnalyticsProps {
  items: BOQItem[];
  areaSqFt: number;
  currency: CurrencyCode;
  contingencyPercent: number;
  totalEstimate: number;
  subtotal: number;
  onApplyCategoryTarget?: (category: string, targetPercent: number) => void;
}

export const BOQAnalytics: React.FC<BOQAnalyticsProps> = ({
  items,
  areaSqFt,
  currency,
  contingencyPercent,
  totalEstimate,
  subtotal,
}) => {
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'cost-drivers' | 'material-labor' | 'benchmarks' | 'stages'>('cost-drivers');

  // 1. Pareto Analysis (Top Cost Drivers)
  const topCostDrivers = useMemo(() => {
    const sorted = [...items].sort((a, b) => (b.quantity * b.rate) - (a.quantity * a.rate));
    let cumulative = 0;
    return sorted.map((item) => {
      const cost = item.quantity * item.rate;
      cumulative += cost;
      const pctOfSubtotal = subtotal > 0 ? (cost / subtotal) * 100 : 0;
      const cumPct = subtotal > 0 ? (cumulative / subtotal) * 100 : 0;
      const costPerSqFt = areaSqFt > 0 ? Math.round(cost / areaSqFt) : 0;
      return {
        ...item,
        cost,
        pctOfSubtotal,
        cumPct,
        costPerSqFt,
        isParetoKey: cumPct <= 80 || pctOfSubtotal >= 8, // Part of the vital ~80%
      };
    });
  }, [items, subtotal, areaSqFt]);

  // 2. Material vs. Labor vs. Equipment breakdown estimate
  const costComponents = useMemo(() => {
    let materialTotal = 0;
    let laborTotal = 0;
    let equipTotal = 0;

    items.forEach((it) => {
      const amt = it.quantity * it.rate;
      const matFrac = it.materialComponent ?? 0.65;
      const labFrac = it.laborComponent ?? 0.30;
      const eqFrac = it.equipmentComponent ?? 0.05;

      materialTotal += amt * matFrac;
      laborTotal += amt * labFrac;
      equipTotal += amt * eqFrac;
    });

    const tot = materialTotal + laborTotal + equipTotal || 1;
    return {
      material: Math.round(materialTotal),
      materialPct: Math.round((materialTotal / tot) * 100),
      labor: Math.round(laborTotal),
      laborPct: Math.round((laborTotal / tot) * 100),
      equipment: Math.round(equipTotal),
      equipmentPct: Math.round((equipTotal / tot) * 100),
    };
  }, [items]);

  // 3. Stage breakdown
  const stageBreakdown = useMemo(() => {
    const stages: Record<string, { total: number; count: number }> = {
      Substructure: { total: 0, count: 0 },
      Superstructure: { total: 0, count: 0 },
      Finishes: { total: 0, count: 0 },
      Services: { total: 0, count: 0 },
    };

    items.forEach((it) => {
      let stg = it.stage;
      if (!stg) {
        if (it.category === 'Substructure') stg = 'Substructure';
        else if (it.category === 'Concrete Works' || it.category === 'Masonry') stg = 'Superstructure';
        else if (it.category === 'Finishes' || it.category === 'Doors & Windows' || it.category === 'Waterproofing') stg = 'Finishes';
        else stg = 'Services';
      }
      if (!stages[stg]) stages[stg] = { total: 0, count: 0 };
      stages[stg].total += it.quantity * it.rate;
      stages[stg].count += 1;
    });

    return stages;
  }, [items]);

  // High-cost items (Vital Few / Pareto 80/20)
  const vitalItems = topCostDrivers.filter((i) => i.isParetoKey);

  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-5 shadow-sm">
      {/* Header & Sub-navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>BOQ Cost Intelligence & Value Engineering Hub</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                Pareto 80/20 Calibrated
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Audit the vital ~20% of materials driving 80% of costs, inspect material vs. labor splits, and detect potential savings.
            </p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveAnalysisTab('cost-drivers')}
            className={`px-3 py-1 rounded-md transition font-medium ${
              activeAnalysisTab === 'cost-drivers'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Cost Drivers (80/20)
          </button>
          <button
            type="button"
            onClick={() => setActiveAnalysisTab('material-labor')}
            className={`px-3 py-1 rounded-md transition font-medium ${
              activeAnalysisTab === 'material-labor'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Material vs. Labor
          </button>
          <button
            type="button"
            onClick={() => setActiveAnalysisTab('stages')}
            className={`px-3 py-1 rounded-md transition font-medium ${
              activeAnalysisTab === 'stages'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Construction Milestones
          </button>
        </div>
      </div>

      {/* TAB 1: PARETO 80/20 COST DRIVERS */}
      {activeAnalysisTab === 'cost-drivers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-lg bg-slate-950 border border-amber-500/30 bg-amber-500/5 space-y-1">
              <span className="text-[11px] font-mono uppercase text-amber-400 font-semibold">Vital Pareto Commodities</span>
              <div className="text-xl font-bold font-mono text-white">
                {vitalItems.length} <span className="text-xs font-normal text-slate-400">of {items.length} items</span>
              </div>
              <p className="text-[11px] text-slate-300">
                These top {vitalItems.length} line items consume <span className="text-amber-300 font-bold font-mono">
                  {vitalItems.reduce((acc, c) => acc + c.pctOfSubtotal, 0).toFixed(1)}%
                </span> of your entire procurement budget. Locking contractor quotes on these delivers the highest savings leverage.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold">Single Largest Expense</span>
              <div className="text-base font-bold text-white truncate">
                {topCostDrivers[0]?.name || 'N/A'}
              </div>
              <div className="text-xs font-mono text-amber-400">
                {formatCurrency(topCostDrivers[0]?.cost || 0, currency)} ({topCostDrivers[0]?.pctOfSubtotal.toFixed(1)}% of subtotal)
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Unit impact: ₹{topCostDrivers[0]?.costPerSqFt}/sq.ft plinth
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950 border border-emerald-500/30 bg-emerald-500/5 space-y-1">
              <span className="text-[11px] font-mono uppercase text-emerald-400 font-semibold">Value Engineering Advisory</span>
              <div className="text-sm font-bold text-emerald-300">
                Target 5-8% Direct Savings
              </div>
              <p className="text-[11px] text-slate-300">
                Direct factory procurement of TMT rebar, bulk ready-mix batching, and UPVC bulk packaging can reduce total tender cost by ~{formatCurrency(subtotal * 0.065, currency)}.
              </p>
            </div>
          </div>

          {/* Detailed Pareto Driver List */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center justify-between">
              <span>Top Cost Impact Items (Ordered by Total Expenditure)</span>
              <span className="text-[11px] text-slate-400">Target for bulk volume discounts</span>
            </div>

            <div className="space-y-2">
              {topCostDrivers.slice(0, 5).map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-mono text-xs font-bold">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>{item.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {item.category}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {item.quantity} {item.unit} @ ₹{item.rate.toLocaleString()} / {item.unit}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold font-mono text-amber-400">
                        {formatCurrency(item.cost, currency)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {item.pctOfSubtotal.toFixed(1)}% of base • ₹{item.costPerSqFt}/sq.ft
                      </div>
                    </div>
                  </div>

                  {/* Cumulative Progress Bar */}
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden flex">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, item.pctOfSubtotal * 2.5)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MATERIAL VS LABOR VS EQUIPMENT */}
      {activeAnalysisTab === 'material-labor' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Materials */}
            <div className="p-4 rounded-xl bg-slate-950 border border-sky-500/30 bg-sky-500/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" />
                  <span>Materials & Goods</span>
                </span>
                <span className="text-xs font-mono font-bold text-white">{costComponents.materialPct}%</span>
              </div>
              <div className="text-xl font-bold font-mono text-white">
                {formatCurrency(costComponents.material, currency)}
              </div>
              <p className="text-[11px] text-slate-300">
                Cement, TMT steel rebar, coarse aggregates, blocks, tiles, CP fittings & aluminum profiles.
              </p>
              <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800">
                ≈ ₹{Math.round(costComponents.material / (areaSqFt || 1)).toLocaleString()} / sq.ft
              </div>
            </div>

            {/* Labor */}
            <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 bg-amber-500/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <HardHat className="w-3.5 h-3.5" />
                  <span>Labor & Craftsmen</span>
                </span>
                <span className="text-xs font-mono font-bold text-white">{costComponents.laborPct}%</span>
              </div>
              <div className="text-xl font-bold font-mono text-white">
                {formatCurrency(costComponents.labor, currency)}
              </div>
              <p className="text-[11px] text-slate-300">
                Masons, bar benders, shuttering carpenters, licensed electricians, plumbers & painters.
              </p>
              <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800">
                ≈ ₹{Math.round(costComponents.labor / (areaSqFt || 1)).toLocaleString()} / sq.ft
              </div>
            </div>

            {/* Equipment */}
            <div className="p-4 rounded-xl bg-slate-950 border border-purple-500/30 bg-purple-500/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" />
                  <span>Equipment & Logistics</span>
                </span>
                <span className="text-xs font-mono font-bold text-white">{costComponents.equipmentPct}%</span>
              </div>
              <div className="text-xl font-bold font-mono text-white">
                {formatCurrency(costComponents.equipment, currency)}
              </div>
              <p className="text-[11px] text-slate-300">
                Excavators (JCB), concrete mixer trucks, vibrators, steel scaffolding & hoist transport.
              </p>
              <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800">
                ≈ ₹{Math.round(costComponents.equipment / (areaSqFt || 1)).toLocaleString()} / sq.ft
              </div>
            </div>
          </div>

          {/* Visual Distribution Bar */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Cost Component Allocation</span>
              <span>Total: {formatCurrency(subtotal, currency)}</span>
            </div>
            <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-900">
              <div
                style={{ width: `${costComponents.materialPct}%` }}
                className="bg-sky-500 h-full transition-all duration-300"
                title={`Materials: ${costComponents.materialPct}%`}
              />
              <div
                style={{ width: `${costComponents.laborPct}%` }}
                className="bg-amber-500 h-full transition-all duration-300"
                title={`Labor: ${costComponents.laborPct}%`}
              />
              <div
                style={{ width: `${costComponents.equipmentPct}%` }}
                className="bg-purple-500 h-full transition-all duration-300"
                title={`Equipment: ${costComponents.equipmentPct}%`}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                <span>Materials ({costComponents.materialPct}%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Labor ({costComponents.laborPct}%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span>Machinery ({costComponents.equipmentPct}%)</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONSTRUCTION MILESTONES & CASHFLOW STAGING */}
      {activeAnalysisTab === 'stages' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(stageBreakdown).map(([stg, val]) => {
              const pct = subtotal > 0 ? Math.round((val.total / subtotal) * 100) : 0;
              const perSqFt = areaSqFt > 0 ? Math.round(val.total / areaSqFt) : 0;
              return (
                <div key={stg} className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{stg}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                      {pct}%
                    </span>
                  </div>
                  <div className="text-lg font-bold font-mono text-amber-400">
                    {formatCurrency(val.total, currency)}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
                    <span>{val.count} items</span>
                    <span>₹{perSqFt}/sq.ft</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              Architectural milestone payments typically follow a <span className="text-white font-semibold">15% Plinth / Substructure, 35% RCC Superstructure, 30% Finishes & Fenestrations, 20% Services & Handover</span> drawdown schedule.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
