import React, { useState, useMemo } from 'react';
import {
  PieChart as PieChartIcon,
  Layers,
  Building,
  HardHat,
  Truck,
  Scale,
  ShieldCheck,
  Download,
  Info,
  Sliders,
  Sparkles,
  ArrowRight,
  Filter,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Search,
  Percent,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { BOQItem } from '../types';
import { formatCurrency, CurrencyCode } from '../utils/formatters';
import {
  computeBOQDistribution,
  DistributionPillar,
  CategoryDistribution,
  ItemDistributionBreakdown,
} from '../utils/boqDistribution';

interface BOQDistributionAnalyticsProps {
  items: BOQItem[];
  currency: CurrencyCode;
  contingencyPercent: number;
  areaSqFt: number;
  onClose?: () => void;
}

export const BOQDistributionAnalytics: React.FC<BOQDistributionAnalyticsProps> = ({
  items,
  currency,
  contingencyPercent,
  areaSqFt,
  onClose,
}) => {
  // View mode: '3-pillar' (Materials, Labor, Overheads) or '5-pillar' (Materials, Labor, Equipment, Overheads, Contingency)
  const [viewMode, setViewMode] = useState<'3-pillar' | '5-pillar'>('3-pillar');
  const [activeTab, setActiveTab] = useState<'overview' | 'category-matrix' | 'item-inspector' | 'sensitivity'>('overview');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [itemSearchQuery, setItemSearchQuery] = useState<string>('');

  // What-if sensitivity adjustments (% delta)
  const [materialDeltaPct, setMaterialDeltaPct] = useState<number>(0);
  const [laborDeltaPct, setLaborDeltaPct] = useState<number>(0);
  const [overheadDeltaPct, setOverheadDeltaPct] = useState<number>(0);

  // Compute base distribution
  const baseDistribution = useMemo(() => {
    return computeBOQDistribution(items, contingencyPercent, areaSqFt);
  }, [items, contingencyPercent, areaSqFt]);

  // Compute adjusted distribution if sensitivity sliders are touched
  const distribution = useMemo(() => {
    if (materialDeltaPct === 0 && laborDeltaPct === 0 && overheadDeltaPct === 0) {
      return baseDistribution;
    }

    // Apply sensitivity deltas to items
    const adjustedItems: BOQItem[] = items.map((it) => {
      const baseAmt = it.quantity * it.rate;
      const matFrac = it.materialComponent ?? 0.65;
      const labFrac = it.laborComponent ?? 0.25;
      const eqFrac = it.equipmentComponent ?? 0.05;
      const ovhFrac = it.overheadComponent ?? 0.05;

      const adjustedMat = matFrac * (1 + materialDeltaPct / 100);
      const adjustedLab = labFrac * (1 + laborDeltaPct / 100);
      const adjustedEq = eqFrac;
      const adjustedOvh = ovhFrac * (1 + overheadDeltaPct / 100);

      const newSum = adjustedMat + adjustedLab + adjustedEq + adjustedOvh;
      const scaledAmt = Math.round(baseAmt * newSum);
      const scaledRate = it.quantity > 0 ? Math.round(scaledAmt / it.quantity) : it.rate;

      return {
        ...it,
        rate: scaledRate,
        amount: scaledAmt,
        materialComponent: adjustedMat / newSum,
        laborComponent: adjustedLab / newSum,
        equipmentComponent: adjustedEq / newSum,
        overheadComponent: adjustedOvh / newSum,
      };
    });

    return computeBOQDistribution(adjustedItems, contingencyPercent, areaSqFt);
  }, [items, contingencyPercent, areaSqFt, baseDistribution, materialDeltaPct, laborDeltaPct, overheadDeltaPct]);

  // Data for Recharts Pie Chart
  const chartData = useMemo(() => {
    if (viewMode === '3-pillar') {
      return [
        {
          name: 'Materials & Goods',
          value: distribution.materialsTotal,
          percent: distribution.materialsPercent,
          color: '#38bdf8', // Sky 400
          description: 'Raw commodities, TMT steel, ready-mix concrete, masonry, tiles & fittings',
        },
        {
          name: 'Construction Labor',
          value: distribution.laborTotal,
          percent: distribution.laborPercent,
          color: '#f59e0b', // Amber 500
          description: 'Masons, bar benders, carpenters, electricians, plumbers & craftsmen',
        },
        {
          name: 'Overheads & Reserves',
          value: distribution.overheadsTotal,
          percent: distribution.overheadsPercent,
          color: '#f43f5e', // Rose 500
          description: 'Site establishment, equipment, contractor margin & client contingency',
        },
      ];
    }

    return distribution.pillars.map((p) => ({
      name: p.name,
      value: p.amount,
      percent: p.percentOfTotal,
      color: p.color,
      description: p.description,
    }));
  }, [distribution, viewMode]);

  // Filtered line items for inspector
  const filteredItemBreakdowns = useMemo(() => {
    return distribution.itemBreakdowns.filter((it) => {
      const matchesCat = selectedCategoryFilter === 'all' || it.category === selectedCategoryFilter;
      const matchesSearch =
        !itemSearchQuery ||
        it.itemName.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
        it.category.toLowerCase().includes(itemSearchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [distribution.itemBreakdowns, selectedCategoryFilter, itemSearchQuery]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Line Item Name',
      'Category',
      'Total Amount (INR)',
      'Materials Amount (INR)',
      'Materials %',
      'Labor Amount (INR)',
      'Labor %',
      'Equipment Amount (INR)',
      'Equipment %',
      'Overheads Amount (INR)',
      'Overheads %',
    ];

    const rows = distribution.itemBreakdowns.map((it) => [
      `"${it.itemName.replace(/"/g, '""')}"`,
      `"${it.category}"`,
      it.totalAmount,
      it.materialAmount,
      `${(it.materialFrac * 100).toFixed(1)}%`,
      it.laborAmount,
      `${(it.laborFrac * 100).toFixed(1)}%`,
      it.equipmentAmount,
      `${(it.equipmentFrac * 100).toFixed(1)}%`,
      it.overheadAmount,
      `${(it.overheadFrac * 100).toFixed(1)}%`,
    ]);

    const summarySection = [
      [],
      ['SUMMARY LEVEL BREAKDOWN'],
      ['Pillar', 'Amount (INR)', 'Share of Total %'],
      ['Direct Materials', distribution.materialsTotal, `${distribution.materialsPercent}%`],
      ['Direct Labor', distribution.laborTotal, `${distribution.laborPercent}%`],
      ['Combined Overheads & Equipment', distribution.overheadsTotal, `${distribution.overheadsPercent}%`],
      ['Contingency Reserve', distribution.contingencyAmount, `${contingencyPercent}%`],
      ['Grand Total Budget', distribution.grandTotal, '100.0%'],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(',')), ...summarySection.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `boq_distribution_materials_labor_overheads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom Recharts Tooltip
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs space-y-1 max-w-xs font-mono">
          <div className="font-bold text-white font-sans flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.payload.color }} />
            <span>{data.name}</span>
          </div>
          <div className="text-amber-400 font-bold text-sm">
            {formatCurrency(data.value, currency)}
          </div>
          <div className="text-slate-300 text-[11px]">
            Share of Grand Total: <span className="font-bold text-white">{data.payload.percent}%</span>
          </div>
          {areaSqFt > 0 && (
            <div className="text-slate-400 text-[10px]">
              Unit Rate: ₹{Math.round(data.value / areaSqFt)} / sq.ft
            </div>
          )}
          <p className="text-[10px] text-slate-400 font-sans pt-1 border-t border-slate-800">
            {data.payload.description}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="boq-cost-distribution-panel" className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-sky-500/30 shadow-2xl space-y-5">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-400 shrink-0">
            <PieChartIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white font-serif-classic">
                BOQ Cost Distribution: Materials, Labor & Overheads
              </h3>
              <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                Real Data Analysis
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live quantitative distribution calculated across {items.length} BOQ line items for {areaSqFt.toLocaleString()} sq.ft plinth.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View mode toggle (3-pillar vs 5-pillar) */}
          <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('3-pillar')}
              className={`px-2.5 py-1 rounded transition font-medium ${
                viewMode === '3-pillar'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              3-Pillars (Standard)
            </button>
            <button
              onClick={() => setViewMode('5-pillar')}
              className={`px-2.5 py-1 rounded transition font-medium ${
                viewMode === '5-pillar'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              5-Pillars (Granular)
            </button>
          </div>

          <button
            id="btn-export-distribution-csv"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition text-xs"
              title="Close Distribution View"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* KPI METRIC CARDS (MATERIALS, LABOR, OVERHEADS, CONTINGENCY) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Materials */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-sky-500/30 bg-sky-500/5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5 font-sans">
              <Building className="w-3.5 h-3.5" />
              <span>Direct Materials</span>
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300">
              {distribution.materialsPercent}%
            </span>
          </div>
          <p className="text-xl font-bold font-mono text-white">
            {formatCurrency(distribution.materialsTotal, currency)}
          </p>
          <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between pt-0.5 border-t border-slate-800">
            <span>₹{Math.round(distribution.materialsTotal / (areaSqFt || 1)).toLocaleString()} / sq.ft</span>
            <span className="text-slate-500">Steel, Cement, Tiles</span>
          </div>
        </div>

        {/* Card 2: Labor */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/30 bg-amber-500/5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 font-sans">
              <HardHat className="w-3.5 h-3.5" />
              <span>Construction Labor</span>
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
              {distribution.laborPercent}%
            </span>
          </div>
          <p className="text-xl font-bold font-mono text-white">
            {formatCurrency(distribution.laborTotal, currency)}
          </p>
          <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between pt-0.5 border-t border-slate-800">
            <span>₹{Math.round(distribution.laborTotal / (areaSqFt || 1)).toLocaleString()} / sq.ft</span>
            <span className="text-slate-500">Masons, Carpenters</span>
          </div>
        </div>

        {/* Card 3: Overheads & Equipment */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-rose-500/30 bg-rose-500/5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5 font-sans">
              <Scale className="w-3.5 h-3.5" />
              <span>Overheads & Equipment</span>
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
              {distribution.overheadsPercent}%
            </span>
          </div>
          <p className="text-xl font-bold font-mono text-white">
            {formatCurrency(distribution.overheadsTotal, currency)}
          </p>
          <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between pt-0.5 border-t border-slate-800">
            <span>₹{Math.round(distribution.overheadsTotal / (areaSqFt || 1)).toLocaleString()} / sq.ft</span>
            <span className="text-slate-500">Site Admin, Margin & JCB</span>
          </div>
        </div>

        {/* Card 4: Project Grand Total & Contingency */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 bg-emerald-500/5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 font-sans">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Grand Total (+Contingency)</span>
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
              {contingencyPercent}% Buffer
            </span>
          </div>
          <p className="text-xl font-bold font-mono text-amber-400">
            {formatCurrency(distribution.grandTotal, currency)}
          </p>
          <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between pt-0.5 border-t border-slate-800">
            <span>₹{Math.round(distribution.grandTotal / (areaSqFt || 1)).toLocaleString()} / sq.ft</span>
            <span className="text-emerald-400 font-semibold">{formatCurrency(distribution.contingencyAmount, currency)}</span>
          </div>
        </div>
      </div>

      {/* PROPORTIONAL SEGMENTED DISTRIBUTION BAR */}
      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span className="font-semibold text-slate-300 font-sans">Proportional Budget Allocation (Visual Share of Every Rupee)</span>
          <span>Grand Total: {formatCurrency(distribution.grandTotal, currency)}</span>
        </div>

        <div className="w-full h-3.5 rounded-full overflow-hidden flex bg-slate-900 border border-slate-800">
          {chartData.map((slice) => (
            <div
              key={slice.name}
              style={{
                width: `${slice.percent}%`,
                backgroundColor: slice.color,
              }}
              className="h-full transition-all duration-300 hover:opacity-90 cursor-pointer"
              title={`${slice.name}: ${slice.percent}% (${formatCurrency(slice.value, currency)})`}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] font-mono">
          {chartData.map((slice) => (
            <div key={slice.name} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
              <span className="text-slate-300">{slice.name}:</span>
              <span className="font-bold text-white">{slice.percent}%</span>
              <span className="text-slate-500">({formatCurrency(slice.value, currency)})</span>
            </div>
          ))}
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white bg-slate-950'
          }`}
        >
          <PieChartIcon className="w-3.5 h-3.5" />
          <span>Donut Distribution & 5-Pillar Breakdown</span>
        </button>

        <button
          onClick={() => setActiveTab('category-matrix')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
            activeTab === 'category-matrix'
              ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white bg-slate-950'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Trade Category Distribution Matrix ({distribution.categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('item-inspector')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
            activeTab === 'item-inspector'
              ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white bg-slate-950'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Line-Item Inspector ({distribution.itemBreakdowns.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sensitivity')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
            activeTab === 'sensitivity'
              ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white bg-slate-950'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Sensitivity Sliders</span>
          {(materialDeltaPct !== 0 || laborDeltaPct !== 0 || overheadDeltaPct !== 0) && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* TAB 1: OVERVIEW & DONUT CHART */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Donut Chart Canvas */}
          <div className="lg:col-span-5 h-72 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={105}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Donut Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Grand Total</span>
              <span className="text-sm font-bold font-mono text-white">
                {formatCurrency(distribution.grandTotal, currency)}
              </span>
              <span className="text-[9px] text-amber-400 font-mono">
                {areaSqFt > 0 ? `₹${Math.round(distribution.grandTotal / areaSqFt)}/sq.ft` : ''}
              </span>
            </div>
          </div>

          {/* Detailed 5-Pillar List */}
          <div className="lg:col-span-7 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-1 border-b border-slate-800">
              <span className="uppercase font-semibold tracking-wider font-sans text-slate-300">
                Detailed 5-Pillar Cost Composition
              </span>
              <span>Sorted by Budget Weight</span>
            </div>

            <div className="space-y-2">
              {distribution.pillars.map((pillar) => (
                <div
                  key={pillar.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: pillar.color }} />
                      <span className="text-xs font-bold text-white">{pillar.name}</span>
                    </div>
                    <div className="flex items-baseline gap-2 font-mono">
                      <span className="text-sm font-bold text-white">
                        {formatCurrency(pillar.amount, currency)}
                      </span>
                      <span className="text-xs font-bold text-amber-400">
                        {pillar.percentOfTotal}%
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {pillar.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-900">
                    <span>Rate Impact: ₹{pillar.costPerSqFt} / sq.ft</span>
                    <span>Key: {pillar.examples.slice(0, 3).join(', ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TRADE CATEGORY DISTRIBUTION MATRIX */}
      {activeTab === 'category-matrix' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
            <p className="text-slate-400">
              Shows how Materials, Labor, Equipment, and Overheads divide across every individual construction trade.
            </p>
            <span className="font-mono text-amber-400 text-[11px]">
              {distribution.categories.length} Trade Packages Total
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900 border-b border-slate-800 font-mono text-[11px] text-slate-400">
                <tr>
                  <th className="py-2.5 px-3">Trade Category</th>
                  <th className="py-2.5 px-3 text-right">Total Package</th>
                  <th className="py-2.5 px-3 text-right text-sky-400">Materials (₹ / %)</th>
                  <th className="py-2.5 px-3 text-right text-amber-400">Labor (₹ / %)</th>
                  <th className="py-2.5 px-3 text-right text-purple-400">Equipment (₹ / %)</th>
                  <th className="py-2.5 px-3 text-right text-rose-400">Overheads (₹ / %)</th>
                  <th className="py-2.5 px-3 text-center">Visual Split</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {distribution.categories.map((cat) => (
                  <tr key={cat.category} className="hover:bg-slate-900/50 transition">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-white">{cat.category}</div>
                      <div className="text-[10px] text-slate-500">{cat.itemCount} line item{cat.itemCount > 1 ? 's' : ''}</div>
                    </td>

                    <td className="py-2.5 px-3 text-right font-bold text-amber-300">
                      {formatCurrency(cat.totalAmount, currency)}
                    </td>

                    <td className="py-2.5 px-3 text-right text-sky-300">
                      <div>{formatCurrency(cat.materialAmount, currency)}</div>
                      <div className="text-[10px] text-slate-400">{cat.materialPercent}%</div>
                    </td>

                    <td className="py-2.5 px-3 text-right text-amber-300">
                      <div>{formatCurrency(cat.laborAmount, currency)}</div>
                      <div className="text-[10px] text-slate-400">{cat.laborPercent}%</div>
                    </td>

                    <td className="py-2.5 px-3 text-right text-purple-300">
                      <div>{formatCurrency(cat.equipmentAmount, currency)}</div>
                      <div className="text-[10px] text-slate-400">{cat.equipmentPercent}%</div>
                    </td>

                    <td className="py-2.5 px-3 text-right text-rose-300">
                      <div>{formatCurrency(cat.overheadAmount, currency)}</div>
                      <div className="text-[10px] text-slate-400">{cat.overheadPercent}%</div>
                    </td>

                    <td className="py-2.5 px-3 text-center w-36">
                      <div className="w-28 mx-auto h-2.5 rounded-full overflow-hidden flex bg-slate-900 border border-slate-800">
                        <div style={{ width: `${cat.materialPercent}%` }} className="bg-sky-400 h-full" title={`Materials: ${cat.materialPercent}%`} />
                        <div style={{ width: `${cat.laborPercent}%` }} className="bg-amber-400 h-full" title={`Labor: ${cat.laborPercent}%`} />
                        <div style={{ width: `${cat.equipmentPercent}%` }} className="bg-purple-400 h-full" title={`Equipment: ${cat.equipmentPercent}%`} />
                        <div style={{ width: `${cat.overheadPercent}%` }} className="bg-rose-400 h-full" title={`Overheads: ${cat.overheadPercent}%`} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: LINE-ITEM INSPECTOR */}
      {activeTab === 'item-inspector' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={itemSearchQuery}
                onChange={(e) => setItemSearchQuery(e.target.value)}
                placeholder="Search line items (e.g. steel, concrete, tiles)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              <button
                onClick={() => setSelectedCategoryFilter('all')}
                className={`px-2.5 py-1 rounded text-xs transition whitespace-nowrap ${
                  selectedCategoryFilter === 'all'
                    ? 'bg-sky-500 text-slate-950 font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                All ({distribution.itemBreakdowns.length})
              </button>
              {distribution.categories.map((c) => (
                <button
                  key={c.category}
                  onClick={() => setSelectedCategoryFilter(c.category)}
                  className={`px-2.5 py-1 rounded text-xs transition whitespace-nowrap ${
                    selectedCategoryFilter === c.category
                      ? 'bg-sky-500 text-slate-950 font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {c.category}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 max-h-80 overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 font-mono text-[11px] text-slate-400">
                <tr>
                  <th className="py-2 px-3">Item Specification</th>
                  <th className="py-2 px-3">Category</th>
                  <th className="py-2 px-3 text-right">Total (₹)</th>
                  <th className="py-2 px-3 text-right text-sky-400">Materials</th>
                  <th className="py-2 px-3 text-right text-amber-400">Labor</th>
                  <th className="py-2 px-3 text-right text-purple-400">Equipment</th>
                  <th className="py-2 px-3 text-right text-rose-400">Overheads</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {filteredItemBreakdowns.map((it) => (
                  <tr key={it.itemId} className="hover:bg-slate-900/50 transition">
                    <td className="py-2 px-3 font-sans font-medium text-white max-w-xs truncate">
                      {it.itemName}
                    </td>
                    <td className="py-2 px-3 text-slate-400 whitespace-nowrap">
                      {it.category}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-amber-300 whitespace-nowrap">
                      {formatCurrency(it.totalAmount, currency)}
                    </td>
                    <td className="py-2 px-3 text-right text-sky-300 whitespace-nowrap">
                      {formatCurrency(it.materialAmount, currency)} <span className="text-[10px] text-slate-500">({(it.materialFrac * 100).toFixed(0)}%)</span>
                    </td>
                    <td className="py-2 px-3 text-right text-amber-300 whitespace-nowrap">
                      {formatCurrency(it.laborAmount, currency)} <span className="text-[10px] text-slate-500">({(it.laborFrac * 100).toFixed(0)}%)</span>
                    </td>
                    <td className="py-2 px-3 text-right text-purple-300 whitespace-nowrap">
                      {formatCurrency(it.equipmentAmount, currency)} <span className="text-[10px] text-slate-500">({(it.equipmentFrac * 100).toFixed(0)}%)</span>
                    </td>
                    <td className="py-2 px-3 text-right text-rose-300 whitespace-nowrap">
                      {formatCurrency(it.overheadAmount, currency)} <span className="text-[10px] text-slate-500">({(it.overheadFrac * 100).toFixed(0)}%)</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: WHAT-IF SENSITIVITY SIMULATOR */}
      {activeTab === 'sensitivity' && (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Interactive Cost Sensitivity & Inflation Simulator
              </h4>
              <p className="text-[11px] text-slate-400">
                Shift material procurement prices, craft labor wages, or contractor site overheads to simulate project budget impact in real time.
              </p>
            </div>
            {(materialDeltaPct !== 0 || laborDeltaPct !== 0 || overheadDeltaPct !== 0) && (
              <button
                onClick={() => {
                  setMaterialDeltaPct(0);
                  setLaborDeltaPct(0);
                  setOverheadDeltaPct(0);
                }}
                className="text-xs text-amber-400 hover:text-amber-300 underline font-mono"
              >
                Reset All to Base
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Slider 1: Material Price Shift */}
            <div className="space-y-2 p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-sky-400 font-bold">Material Cost Shift:</span>
                <span className={`font-bold ${materialDeltaPct >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {materialDeltaPct > 0 ? `+${materialDeltaPct}%` : `${materialDeltaPct}%`}
                </span>
              </div>
              <input
                type="range"
                min={-20}
                max={25}
                step={1}
                value={materialDeltaPct}
                onChange={(e) => setMaterialDeltaPct(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>-20% (Bulk Discount)</span>
                <span>0%</span>
                <span>+25% (Commodity Spike)</span>
              </div>
            </div>

            {/* Slider 2: Labor Wage Shift */}
            <div className="space-y-2 p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-amber-400 font-bold">Labor Wage Shift:</span>
                <span className={`font-bold ${laborDeltaPct >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {laborDeltaPct > 0 ? `+${laborDeltaPct}%` : `${laborDeltaPct}%`}
                </span>
              </div>
              <input
                type="range"
                min={-15}
                max={25}
                step={1}
                value={laborDeltaPct}
                onChange={(e) => setLaborDeltaPct(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>-15%</span>
                <span>0%</span>
                <span>+25% (Wage Inflation)</span>
              </div>
            </div>

            {/* Slider 3: Overhead / Contractor Margin Shift */}
            <div className="space-y-2 p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-rose-400 font-bold">Site Overheads & Margin:</span>
                <span className={`font-bold ${overheadDeltaPct >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {overheadDeltaPct > 0 ? `+${overheadDeltaPct}%` : `${overheadDeltaPct}%`}
                </span>
              </div>
              <input
                type="range"
                min={-20}
                max={25}
                step={1}
                value={overheadDeltaPct}
                onChange={(e) => setOverheadDeltaPct(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>-20% (Lean Management)</span>
                <span>0%</span>
                <span>+25% (Complex Site)</span>
              </div>
            </div>
          </div>

          {/* Impact readout */}
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="text-slate-400 font-mono text-[11px]">Sensitivity Impact on Grand Total:</span>
              <div className="flex items-baseline gap-2 font-mono">
                <span className="text-base font-bold text-white">
                  {formatCurrency(distribution.grandTotal, currency)}
                </span>
                <span className="text-slate-400">vs Base {formatCurrency(baseDistribution.grandTotal, currency)}</span>
              </div>
            </div>

            <div className="text-right font-mono">
              <div className={`text-sm font-bold ${distribution.grandTotal >= baseDistribution.grandTotal ? 'text-rose-400' : 'text-emerald-400'}`}>
                {distribution.grandTotal >= baseDistribution.grandTotal ? '+' : ''}
                {formatCurrency(distribution.grandTotal - baseDistribution.grandTotal, currency)}
                {' '}
                ({((distribution.grandTotal - baseDistribution.grandTotal) / (baseDistribution.grandTotal || 1) * 100).toFixed(1)}%)
              </div>
              <span className="text-[10px] text-slate-500">Shift from initial baseline</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
