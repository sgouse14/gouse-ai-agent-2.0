import React, { useState } from 'react';
import { BOQItem, BuildingFloor, FloorWiseTotal } from '../types';
import { formatCurrency, CurrencyCode } from '../utils/formatters';
import {
  Trash2,
  Sliders,
  AlertTriangle,
  Info,
  Maximize2,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Layers,
  ArrowRight,
  FileSpreadsheet,
  Download,
  Building2,
  Coins,
  Receipt,
  FileText,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldAlert,
  Percent,
} from 'lucide-react';
import { ItemAuditStatus } from './BOQView';
import { exportBOQToExcel, exportBOQToExcelCSV } from '../utils/excelExport';
import {
  SNK_PROJECT_SPEC,
  SNK_BUILDING_FLOORS,
  SNK_BASIC_MATERIAL_PRICES,
  SNK_PAYMENT_MILESTONES,
} from '../data/snkQuotationFormat';

interface FloorWiseBOQMatrixProps {
  items: BOQItem[];
  floors: BuildingFloor[];
  floorTotals: FloorWiseTotal[];
  currency: CurrencyCode;
  contingencyPercent: number;
  auditResults?: Record<string, ItemAuditStatus>;
  isAuditActive?: boolean;
  onUpdateFloorQty: (itemId: string, floorId: string, newQty: number) => void;
  onUpdateRate: (itemId: string, newRate: number) => void;
  onDeleteItem: (itemId: string) => void;
  onOpenItemDistribution: (item: BOQItem) => void;
  onApplySNKFormat?: () => void;
}

export const FloorWiseBOQMatrix: React.FC<FloorWiseBOQMatrixProps> = ({
  items,
  floors,
  floorTotals,
  currency,
  contingencyPercent,
  auditResults = {},
  isAuditActive = false,
  onUpdateFloorQty,
  onUpdateRate,
  onDeleteItem,
  onOpenItemDistribution,
  onApplySNKFormat,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isSNKDrawerOpen, setIsSNKDrawerOpen] = useState(false);
  const [snkActiveTab, setSnkActiveTab] = useState<'prices' | 'area' | 'milestones' | 'specs'>('prices');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [rateSyncFeedback, setRateSyncFeedback] = useState<string | null>(null);

  const categories = Array.from(new Set(items.map((i) => i.category || 'General')));

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate building totals
  const buildingSubtotal = floorTotals.reduce((sum, f) => sum + f.subtotal, 0);
  const contingencyAmount = Math.round(buildingSubtotal * (contingencyPercent / 100));
  const grandTotal = buildingSubtotal + contingencyAmount;
  const totalAreaSqFt = floors.reduce((sum, f) => sum + f.areaSqFt, 0);
  const overallRatePerSqFt = totalAreaSqFt > 0 ? Math.round(grandTotal / totalAreaSqFt) : 0;

  // Check if active project matches SNK Area Concept (3,599 sq.ft)
  const isSNKAreaConceptActive = Math.abs(totalAreaSqFt - 3599) < 20;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleApplySingleMaterialPrice = (nameKeyword: string, newRate: number, label: string) => {
    let matchCount = 0;
    items.forEach((item) => {
      const lower = item.name.toLowerCase();
      if (lower.includes(nameKeyword.toLowerCase())) {
        onUpdateRate(item.id, newRate);
        matchCount++;
      }
    });
    setRateSyncFeedback(`Updated ${matchCount} item(s) to ${label} rate: ₹${newRate}`);
    setTimeout(() => setRateSyncFeedback(null), 3500);
  };

  return (
    <div id="floor-wise-boq-matrix-panel" className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* 1. SNK Associates Quotation Specification & Area Concept Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-amber-950/20 to-slate-950 border-b border-amber-500/30 p-3 sm:p-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Receipt className="w-3 h-3 text-amber-400" />
                SNK Turnkey Residential Standard
              </span>
              <span className="text-xs text-slate-300 font-medium">
                {SNK_PROJECT_SPEC.contractor.name} • Banashankari, Bengaluru
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                Site: 1,200 Sft • Built-Up: 3,599 Sft
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                ₹2,100 / Sft (₹75.58 Lakhs)
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              <strong>Quantities Required by Individual Building Level:</strong> Ground Floor (1,200 Sft), First Floor (1,200 Sft), Second Floor (1,199 Sft) with JSW NEO Fe555 Steel (₹60/kg), Ultratech OPC/PPC Cement, 6"/4" CCB Blocks, Double Washed M-Sand, Burma Teak & Granite.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-end lg:self-center">
            {onApplySNKFormat && (
              <button
                type="button"
                id="btn-apply-snk-quotation-format"
                onClick={onApplySNKFormat}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
                title="Format active project, building levels, and BOQ items with the SNK Turnkey 3,599 sq.ft specification"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                <span>1-Click Format (3,599 Sft • ₹2,100/sft)</span>
              </button>
            )}

            <button
              type="button"
              id="btn-toggle-snk-reference-drawer"
              onClick={() => setIsSNKDrawerOpen(!isSNKDrawerOpen)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                isSNKDrawerOpen
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>Material Price & Area Concept</span>
              {isSNKDrawerOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {rateSyncFeedback && (
          <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{rateSyncFeedback}</span>
          </div>
        )}
      </div>

      {/* 2. Expandable Material Price, Area Concept & Specification Drawer */}
      {isSNKDrawerOpen && (
        <div className="border-b border-slate-800 bg-slate-950/90 p-4 transition duration-200">
          {/* Drawer Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4 flex-wrap">
            <button
              type="button"
              onClick={() => setSnkActiveTab('prices')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                snkActiveTab === 'prices'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Basic Material Prices (Page 6)</span>
            </button>

            <button
              type="button"
              onClick={() => setSnkActiveTab('area')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                snkActiveTab === 'area'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Building Level Area Concept (GF, FF, SF)</span>
            </button>

            <button
              type="button"
              onClick={() => setSnkActiveTab('milestones')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                snkActiveTab === 'milestones'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Percent className="w-3.5 h-3.5" />
              <span>Mode of Payment (11 Stages • ₹75.58L)</span>
            </button>

            <button
              type="button"
              onClick={() => setSnkActiveTab('specs')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                snkActiveTab === 'specs'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>General Specs & Exclusions Copy</span>
            </button>
          </div>

          {/* TAB 1: BASIC MATERIAL PRICES (Page 6) */}
          {snkActiveTab === 'prices' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="text-xs text-slate-300">
                  <strong>Current Market Prices & Basic Materials Schedule:</strong> Exact price benchmarks as outlined in SNK Associates quotation Page 6. Basic prices are inclusive of GST.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const priceList = SNK_BASIC_MATERIAL_PRICES.map(
                      (p) => `${p.name} (${p.brand}): ₹${p.basicPrice} / ${p.unit} [${p.scopeNotes}]`
                    ).join('\n');
                    copyToClipboard(priceList, 'all_prices');
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700"
                >
                  {copiedKey === 'all_prices' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'all_prices' ? 'Copied Schedule!' : 'Copy Price Schedule'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                {SNK_BASIC_MATERIAL_PRICES.map((mat) => (
                  <div
                    key={mat.id}
                    className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1.5">
                        <span className="font-semibold text-slate-100 text-xs leading-snug">
                          {mat.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                          ₹{mat.basicPrice}/{mat.unit}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                        {mat.specification}
                      </div>
                      <div className="text-[10px] text-amber-400/80 font-mono mt-0.5">
                        Brand: {mat.brand} {mat.priceRange && `(${mat.priceRange})`}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-800/80 text-[10px]">
                      <span className="text-slate-400 truncate max-w-[170px]" title={mat.scopeNotes}>
                        {mat.scopeNotes}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleApplySingleMaterialPrice(mat.category.split(' ')[0], mat.basicPrice, mat.name)}
                        className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 text-[10px] font-mono font-bold transition shrink-0"
                        title={`Apply ₹${mat.basicPrice}/${mat.unit} to matching schedule items`}
                      >
                        Apply Rate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: BUILDING LEVEL AREA CONCEPT (GF, FF, SF) */}
          {snkActiveTab === 'area' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Site Footprint</div>
                  <div className="text-lg font-bold font-mono text-slate-100 mt-0.5">1,200.00 Sft</div>
                  <div className="text-[11px] text-slate-400">Banashankari, Bengaluru (30x40 Plot)</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-amber-400">Total Built-Up Area</div>
                  <div className="text-lg font-bold font-mono text-amber-300 mt-0.5">3,599.00 Sft</div>
                  <div className="text-[11px] text-slate-400">GF + FF + SF (Slab to Slab Roof Area)</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-emerald-400">Contract Rate</div>
                  <div className="text-lg font-bold font-mono text-emerald-300 mt-0.5">₹2,100 / Sft</div>
                  <div className="text-[11px] text-slate-400">₹2,10,000 per 100 Sft (Turnkey)</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-sky-400">Total Quotation Value</div>
                  <div className="text-lg font-bold font-mono text-sky-300 mt-0.5">₹75,57,900</div>
                  <div className="text-[11px] text-slate-400">Seventy Five Lakhs Fifty Eight Thousand</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-300">
                  Building Levels & Roof Area Distribution (10' FT Clear Height):
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {SNK_PROJECT_SPEC.areaConcept.levels.map((lvl) => {
                    const levelBudget = Math.round(lvl.areaSqFt * 2100);
                    return (
                      <div key={lvl.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-xs">
                            {lvl.code}
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            {lvl.percentage}% Area
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-100">{lvl.name}</div>
                        <div className="flex items-baseline justify-between text-xs font-mono">
                          <span className="text-slate-300 font-semibold">{lvl.areaSqFt.toLocaleString()} Sft</span>
                          <span className="text-emerald-400 font-bold">₹{levelBudget.toLocaleString()}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug">
                          {lvl.description}
                        </p>
                        <div className="text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800">
                          Clear Height: {lvl.clearHeightFt}ft • 5" M20 Roof Slab • 6"/4" CCB
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MODE OF PAYMENT (11 Stages) */}
          {snkActiveTab === 'milestones' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="text-xs text-slate-300">
                  <strong>Mode of Payment Milestones:</strong> 11 stage payments linked directly to physical construction milestones. Total = 100% (₹75,57,900).
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const text = SNK_PAYMENT_MILESTONES.map(
                      (m) => `Stage ${m.stageNumber}: ${m.milestone} (${m.percentage}%) = ₹${m.amount.toLocaleString()} [${m.workIncluded}]`
                    ).join('\n');
                    copyToClipboard(text, 'all_milestones');
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700"
                >
                  {copiedKey === 'all_milestones' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'all_milestones' ? 'Copied Milestones!' : 'Copy Milestones'}</span>
                </button>
              </div>

              <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
                {SNK_PAYMENT_MILESTONES.map((stg) => (
                  <div
                    key={stg.stageNumber}
                    className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] font-bold">
                          Stage {stg.stageNumber}
                        </span>
                        <span className="font-semibold text-slate-100">{stg.milestone}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{stg.workIncluded}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-amber-300 text-xs">
                        ₹{stg.amount.toLocaleString()}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 font-semibold">
                        {stg.percentage}% of Total
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: GENERAL SPECIFICATIONS & EXCLUSIONS COPY */}
          {snkActiveTab === 'specs' && (
            <div className="space-y-3 text-xs text-slate-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                  <div className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">
                    Included Contractor Specifications
                  </div>
                  <ul className="space-y-1 text-slate-300 list-disc list-inside text-[11px]">
                    <li><strong>RCC Frame:</strong> Ultratech OPC for roof concrete, Fe555 JSW NEO steel (Basic ₹60/kg), M20 mix, Double washed M-Sand.</li>
                    <li><strong>Superstructure:</strong> 6" CCB main walls (₹38/no), 4" CCB partition walls (₹33/no), 3'6" parapet wall.</li>
                    <li><strong>Roof Slab:</strong> 5" thick M20 slab, 10'ft clear floor-to-roof height.</li>
                    <li><strong>Joinery:</strong> Burma Teak main/pooja door (₹4,500/cft) with PU polish, Sal frames (₹1,500/cft), Pre-laminated flush doors (₹135/sft), WPC bath doors (₹175/sft).</li>
                    <li><strong>Plumbing:</strong> Ashirvad CPVC, Supreme PVC, ₹20,000 allowance per toilet, 1,000L PVC tank, 6,000L CCB sump.</li>
                    <li><strong>Flooring:</strong> Granite @ ₹100/sft for living/dining/kitchen/pooja/steps, Vitrified 1'x1' tiles @ ₹40/sft.</li>
                    <li><strong>Painting:</strong> Asian Paints 3 coats putty + 2 coats premium emulsion (internal), Apex/Ultima (external).</li>
                    <li><strong>Waterproofing:</strong> 3" cement mortar for terrace with Fosroc/Roff chemicals.</li>
                  </ul>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                  <div className="font-bold text-rose-400 uppercase tracking-wider text-[11px]">
                    Extra Work Exclusions (Client Side / Extra)
                  </div>
                  <ul className="space-y-1 text-slate-300 list-disc list-inside text-[11px]">
                    <li>Compound wall (PCC bed ₹200/cft, stone masonry ₹250/cft, 4" CCB ₹90/sft, plaster ₹50/sft, paint ₹18/sft).</li>
                    <li>Foundation beyond 5ft depth (Earthwork ₹12/cft, Pillar concrete ₹300/cft, actual rock excavation).</li>
                    <li>Client sanctions: Permanent/temporary electricity, water & sanitary sanctions, road cutting charges.</li>
                    <li>Interior woodwork: Wardrobes, TV cabinet, showcase, kitchen modular cabinets, POP false ceilings.</li>
                    <li>Front drainage slabs, Rainwater harvesting system, Elevation claddings (HPL/Fundermax/SS).</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Search & Category Filter Toolbar */}
      <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              id="input-search-floor-matrix"
              placeholder="Search schedule item by name or spec..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
            <Filter className="w-3 h-3 text-slate-400" />
            <select
              id="select-category-floor-matrix"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs"
            >
              <option value="all" className="bg-slate-900">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c} className="bg-slate-900">
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-slate-300 font-semibold">{filteredItems.length}</span>
            <span>of {items.length} items</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              id="btn-matrix-export-excel"
              onClick={() =>
                exportBOQToExcel({
                  items,
                  floors,
                  projectName: 'FloorWise_Building_BOQ',
                  currency,
                  contingencyPercent,
                  builtUpAreaSqFt: totalAreaSqFt,
                })
              }
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600/90 hover:bg-emerald-500 text-white font-medium text-xs transition shadow-sm"
              title="Export complete schedule into Microsoft Excel (.xlsx) workbook"
            >
              <FileSpreadsheet className="w-3 h-3 text-emerald-100" />
              <span>Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              id="btn-matrix-export-csv"
              onClick={() =>
                exportBOQToExcelCSV({
                  items,
                  floors,
                  projectName: 'FloorWise_Building_BOQ',
                  currency,
                  contingencyPercent,
                  builtUpAreaSqFt: totalAreaSqFt,
                })
              }
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition border border-slate-700"
              title="Export schedule into Excel-compatible CSV format"
            >
              <Download className="w-3 h-3 text-emerald-400" />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Main Floor-Wise Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            {/* Super-Header for Levels */}
            <tr className="border-b border-slate-800 bg-slate-950 font-mono text-[11px] text-slate-400">
              <th colSpan={4} className="py-2.5 px-3 text-left border-r border-slate-800/80">
                <span className="text-slate-300 font-semibold uppercase tracking-wider">
                  Schedule of Rates (SOR) Specifications
                </span>
              </th>
              <th
                colSpan={floors.length}
                className="py-2.5 px-3 text-center border-r border-slate-800/80 bg-amber-500/10 text-amber-300 font-bold uppercase tracking-wider"
              >
                Quantities Required by Individual Building Level
              </th>
              <th colSpan={3} className="py-2.5 px-3 text-right bg-slate-950">
                <span className="text-slate-300 font-semibold uppercase tracking-wider">
                  Total Schedule of Quantities
                </span>
              </th>
            </tr>

            {/* Sub-Header Column Labels */}
            <tr className="border-b border-slate-800 bg-slate-900/90 font-mono text-[11px] text-slate-300 sticky top-0 z-10 shadow-sm">
              <th className="py-3 px-3 w-10 text-center font-bold">#</th>
              <th className="py-3 px-3 min-w-[260px] font-bold">Item Description & Work Stage</th>
              <th className="py-3 px-2 w-20 text-center font-bold">Unit</th>
              <th className="py-3 px-2 w-24 text-right font-bold border-r border-slate-800/80">Unit Rate</th>

              {/* Individual Floor Columns with Area Concept Metrics */}
              {floors.map((floor) => {
                const targetLevelAmount = Math.round(floor.areaSqFt * 2100);
                return (
                  <th
                    key={floor.id}
                    className="py-2.5 px-2 min-w-[110px] max-w-[135px] text-right bg-slate-900/60 border-r border-slate-800/60 font-mono"
                  >
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1">
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                          {floor.shortCode}
                        </span>
                        {isSNKAreaConceptActive && (
                          <span className="text-[9px] text-emerald-400 font-mono">
                            ₹{(targetLevelAmount / 100000).toFixed(1)}L
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-200 font-medium truncate max-w-[110px] mt-0.5" title={floor.name}>
                        {floor.name.replace(/\(.*\)/, '').trim()}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {floor.elevation} ({floor.areaSqFt} sq.ft)
                      </span>
                    </div>
                  </th>
                );
              })}

              {/* Summary Columns */}
              <th className="py-3 px-3 w-28 text-right font-bold text-amber-300">Total Qty</th>
              <th className="py-3 px-3 w-32 text-right font-bold text-slate-100">Total Amount</th>
              <th className="py-3 px-2 w-16 text-center font-bold">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60 font-sans">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7 + floors.length} className="py-12 text-center text-slate-400 text-xs">
                  No matching schedule items found.
                </td>
              </tr>
            ) : (
              filteredItems.map((item, index) => {
                const audit = isAuditActive ? auditResults[item.id] : null;
                const hasAuditError = isAuditActive && !!audit?.hasIssues;
                const breakdown = item.floorBreakdown || {};

                return (
                  <tr
                    key={item.id}
                    className={`transition hover:bg-slate-800/40 group ${
                      hasAuditError ? 'bg-red-950/20 border-l-2 border-l-red-500' : ''
                    }`}
                  >
                    {/* Index */}
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                      {index + 1}
                    </td>

                    {/* Item Description with Contractor Specification Badges */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-start gap-1.5 flex-wrap">
                        <span className="text-slate-100 font-medium leading-snug">
                          {item.name}
                        </span>
                        {item.stage && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {item.stage}
                          </span>
                        )}
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {item.category}
                        </span>
                        {hasAuditError && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/40">
                            AUDIT
                          </span>
                        )}
                      </div>
                      {item.notes && (
                        <div className="text-[11px] text-slate-400 italic mt-0.5 line-clamp-2" title={item.notes}>
                          {item.notes}
                        </div>
                      )}
                    </td>

                    {/* Unit */}
                    <td className="py-2.5 px-2 text-center font-mono text-slate-300 font-semibold">
                      {item.unit}
                    </td>

                    {/* Unit Rate */}
                    <td className="py-2.5 px-2 text-right border-r border-slate-800/80">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-slate-400 font-mono text-[10px]">₹</span>
                        <input
                          type="number"
                          id={`input-rate-${item.id}`}
                          value={item.rate}
                          onChange={(e) => onUpdateRate(item.id, Number(e.target.value) || 0)}
                          className="w-20 bg-slate-950/70 border border-slate-700/80 rounded px-1.5 py-1 text-right font-mono text-xs text-amber-300 font-semibold focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </td>

                    {/* Floor Columns with Inline Editable Quantity Inputs */}
                    {floors.map((floor) => {
                      const floorQty = breakdown[floor.id] !== undefined ? breakdown[floor.id] : 0;
                      const floorCost = Math.round(floorQty * item.rate);
                      const isZero = floorQty === 0;

                      return (
                        <td
                          key={floor.id}
                          className={`py-2 px-2 text-right border-r border-slate-800/60 ${
                            isZero ? 'bg-slate-950/30' : 'bg-slate-900/40'
                          }`}
                        >
                          <div className="flex flex-col items-end">
                            <input
                              type="number"
                              id={`input-floor-qty-${item.id}-${floor.id}`}
                              value={floorQty === 0 ? '' : floorQty}
                              placeholder="0"
                              onChange={(e) =>
                                onUpdateFloorQty(item.id, floor.id, Math.max(0, Number(e.target.value) || 0))
                              }
                              className={`w-18 bg-slate-950/80 border rounded px-1.5 py-0.5 text-right font-mono text-xs focus:outline-none transition ${
                                isZero
                                  ? 'border-slate-800 text-slate-500 placeholder-slate-700 focus:border-amber-500/60'
                                  : 'border-slate-700 text-slate-100 font-semibold focus:border-amber-500'
                              }`}
                            />
                            {!isZero && (
                              <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                                ₹{floorCost.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}

                    {/* Total Quantity */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-300">
                      {item.quantity.toLocaleString()} {item.unit}
                    </td>

                    {/* Total Item Amount */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-100">
                      {formatCurrency(item.amount, currency)}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          id={`btn-distribute-item-${item.id}`}
                          onClick={() => onOpenItemDistribution(item)}
                          className="p-1 rounded hover:bg-slate-700/70 text-slate-400 hover:text-amber-400 transition"
                          title="Open floor distribution calculator for this item"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          id={`btn-delete-item-${item.id}`}
                          onClick={() => onDeleteItem(item.id)}
                          className="p-1 rounded hover:bg-red-950/60 text-slate-400 hover:text-red-400 transition"
                          title="Delete line item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Detailed Summary Footer Rows */}
          <tfoot className="border-t-2 border-slate-700 font-mono text-xs">
            {/* 1. Floor Subtotals */}
            <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-200">
              <td colSpan={4} className="py-3 px-3 font-bold text-left border-r border-slate-800">
                <span className="text-amber-400 uppercase tracking-wider text-[11px]">
                  Floor Level Subtotal
                </span>
              </td>
              {floors.map((floor) => {
                const ft = floorTotals.find((t) => t.floorId === floor.id);
                const sub = ft?.subtotal || 0;
                return (
                  <td
                    key={floor.id}
                    className="py-3 px-2 text-right border-r border-slate-800/80 font-bold text-slate-100 bg-slate-900/40"
                  >
                    <div className="text-xs">₹{sub.toLocaleString()}</div>
                    <div className="text-[10px] text-amber-400 font-normal">
                      {ft?.percentageOfBuilding}%
                    </div>
                  </td>
                );
              })}
              <td className="py-3 px-3 text-right font-bold text-slate-400 bg-amber-500/5">
                Consolidated
              </td>
              <td className="py-3 px-3 text-right font-bold text-amber-400 text-sm">
                {formatCurrency(buildingSubtotal, currency)}
              </td>
              <td></td>
            </tr>

            {/* 2. Floor Slab Area & % */}
            <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-300">
              <td colSpan={4} className="py-2.5 px-3 text-left border-r border-slate-800 text-[11px]">
                Built-Up Slab Area (sq.ft)
              </td>
              {floors.map((floor) => (
                <td
                  key={floor.id}
                  className="py-2.5 px-2 text-right border-r border-slate-800/80 font-mono text-slate-300"
                >
                  <div>{floor.areaSqFt.toLocaleString()} sq.ft</div>
                  <div className="text-[10px] text-slate-400">
                    {totalAreaSqFt > 0 ? `${Math.round((floor.areaSqFt / totalAreaSqFt) * 100)}%` : '0%'}
                  </div>
                </td>
              ))}
              <td className="py-2.5 px-3 text-right font-mono text-slate-400 bg-amber-500/5">
                Total Area
              </td>
              <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-200">
                {totalAreaSqFt.toLocaleString()} sq.ft
              </td>
              <td></td>
            </tr>

            {/* 3. Cost Per Sq.Ft by Floor */}
            <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-300">
              <td colSpan={4} className="py-2.5 px-3 text-left border-r border-slate-800 text-[11px]">
                Level Unit Rate per Sq.Ft
              </td>
              {floors.map((floor) => {
                const ft = floorTotals.find((t) => t.floorId === floor.id);
                return (
                  <td
                    key={floor.id}
                    className="py-2.5 px-2 text-right border-r border-slate-800/80 font-mono font-semibold text-emerald-400"
                  >
                    ₹{ft?.ratePerSqFt || 0}/sq.ft
                  </td>
                );
              })}
              <td className="py-2.5 px-3 text-right font-mono text-slate-400 bg-amber-500/5">
                Avg Rate
              </td>
              <td className="py-2.5 px-3 text-right font-bold font-mono text-emerald-400">
                ₹{overallRatePerSqFt}/sq.ft
              </td>
              <td></td>
            </tr>

            {/* 4. Contingency Allowance */}
            <tr className="bg-slate-900/40 border-b border-slate-800 text-slate-300">
              <td colSpan={4} className="py-2 px-3 text-left border-r border-slate-800 text-[11px]">
                Contingency & Price Escalation ({contingencyPercent}%)
              </td>
              {floors.map((floor) => {
                const ft = floorTotals.find((t) => t.floorId === floor.id);
                const floorContingency = Math.round((ft?.subtotal || 0) * (contingencyPercent / 100));
                return (
                  <td key={floor.id} className="py-2 px-2 text-right border-r border-slate-800/80 text-slate-400 text-[11px]">
                    +₹{floorContingency.toLocaleString()}
                  </td>
                );
              })}
              <td className="py-2 px-3 text-right text-slate-400 bg-amber-500/5">-</td>
              <td className="py-2 px-3 text-right font-mono text-amber-300">
                {formatCurrency(contingencyAmount, currency)}
              </td>
              <td></td>
            </tr>

            {/* 5. Grand Total */}
            <tr className="bg-amber-500/10 text-slate-100 font-bold text-sm">
              <td colSpan={4} className="py-3.5 px-3 text-left border-r border-slate-800 uppercase tracking-wider text-amber-400">
                Grand Total with Contingency
              </td>
              {floors.map((floor) => {
                const ft = floorTotals.find((t) => t.floorId === floor.id);
                const floorGrand = Math.round((ft?.subtotal || 0) * (1 + contingencyPercent / 100));
                return (
                  <td key={floor.id} className="py-3.5 px-2 text-right border-r border-slate-800/80 text-amber-300 font-mono">
                    ₹{floorGrand.toLocaleString()}
                  </td>
                );
              })}
              <td className="py-3.5 px-3 text-right text-slate-300 bg-amber-500/10 font-mono text-xs">
                All Levels
              </td>
              <td className="py-3.5 px-3 text-right text-amber-400 text-base font-extrabold">
                {formatCurrency(grandTotal, currency)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
