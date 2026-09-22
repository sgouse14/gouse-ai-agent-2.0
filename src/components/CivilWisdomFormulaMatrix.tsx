import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Calculator,
  Layers,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Copy,
  Info,
  Lightbulb,
  Building,
  RotateCcw,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Database,
  Check,
  AlertTriangle,
  Plus,
  GitCompare,
  Percent,
  BookOpen,
  Scale,
  ShieldCheck,
  ShieldAlert,
  Ruler,
} from 'lucide-react';
import {
  CIVIL_WISDOM_FORMULAS,
  CivilWisdomFormulaItem,
  CivilWisdomCalculationParams,
  getCivilWisdomMaterialOverrides,
  calculateRoofSlabEstimation,
  GBA_BUILDING_REGULATIONS,
} from '../data/civilWisdomFormulas';
import { Project, BOQItem, BuildingFloor } from '../types';
import { formatCurrency, CurrencyCode } from '../utils/formatters';
import { DEFAULT_BUILDING_FLOORS } from '../utils/floorTakeoffEngine';
import {
  matchFormulaToBOQItem,
  syncMatrixItemToBOQ,
  syncAllMatrixQuantitiesToBOQ,
  calculateFloorWiseFormulaBreakdown,
  BOQMatchResult,
} from '../utils/materialMatrixBOQConnector';

interface CivilWisdomFormulaMatrixProps {
  initialAreaSqFt?: number;
  currency?: CurrencyCode;
  project?: Project;
  buildingFloors?: BuildingFloor[];
  boqItems?: BOQItem[];
  onUpdateBOQItems?: (items: BOQItem[]) => void;
  onUpdateProject?: (project: Project) => void;
  onApplyToTakeoff?: (overrides: Record<string, { normPerSqFt: number; standardWastagePercent?: number }>, areaSqFt: number) => void;
  onNavigateToBOQ?: () => void;
  onNavigateToAreaTakeoff?: () => void;
  className?: string;
}

export const CivilWisdomFormulaMatrix: React.FC<CivilWisdomFormulaMatrixProps> = ({
  initialAreaSqFt = 3599,
  currency = 'INR',
  project,
  buildingFloors,
  boqItems = [],
  onUpdateBOQItems,
  onUpdateProject,
  onApplyToTakeoff,
  onNavigateToBOQ,
  onNavigateToAreaTakeoff,
  className = '',
}) => {
  // Use actual building floors from project if available
  const effectiveFloors = useMemo(() => {
    if (buildingFloors && buildingFloors.length > 0) return buildingFloors;
    if (project?.floors && project.floors.length > 0) return project.floors;
    return DEFAULT_BUILDING_FLOORS;
  }, [buildingFloors, project?.floors]);

  // Compute total floor area from floors
  const totalFloorAreaSqFt = useMemo(() => {
    return effectiveFloors.reduce((sum, f) => sum + f.areaSqFt, 0);
  }, [effectiveFloors]);

  // Target area selector: 'project_total' | floorId | 'custom'
  const [selectedAreaSource, setSelectedAreaSource] = useState<string>('project_total');

  // Interactive Calculation Parameters
  const [params, setParams] = useState<CivilWisdomCalculationParams>(() => {
    const baseArea = initialAreaSqFt > 0 ? initialAreaSqFt : project?.builtUpAreaSqFt || totalFloorAreaSqFt || 3599;
    return {
      areaSqFt: baseArea,
      wallAreaSqFt: baseArea * 3.0,
      excavationLengthFt: 40,
      excavationBreadthFt: 30,
      excavationDepthFt: 5,
      pccLengthFt: 40,
      pccBreadthFt: 30,
      pccThicknessFt: 0.333, // 4 inches
      tileLengthFt: 2.0,
      tileBreadthFt: 2.0,
      labourRatePerSqFt: 320,
      electricalRatePerSqFt: 85,
      plumbingRatePerSqFt: 75,
      // Extra parameters from Construction & Building Regulations Reference Guide
      slabThicknessM: 0.125, // 0.125 m (~5 inches) standard residential roof slab
      buildingHeightM: 15, // 15m test height (under 21m revised threshold)
      clearFloorHeightM: 3.5, // 3.5m standard (permissible 3.5m - 4.5m)
      plotAreaSqFt: 1200, // 1,200 sq.ft for OC exemption check
      buildingFloorsLabel: 'G+2',
      basementSetbackM: 2.0, // mandatory min 2.0m
    };
  });

  // Main internal views: 'matrix' | 'reference-guide' | 'floors' | 'reconciliation'
  const [activeTab, setActiveTab] = useState<'matrix' | 'reference-guide' | 'floors' | 'reconciliation'>('matrix');

  const [showParameters, setShowParameters] = useState<boolean>(false);
  const [copiedFormula, setCopiedFormula] = useState<string | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedFormulaForFloors, setSelectedFormulaForFloors] = useState<string>('cw-cement');

  // Dynamic Roof Slab Calculations based on current params
  const roofSlabResult = useMemo(() => {
    return calculateRoofSlabEstimation(params.areaSqFt, params.slabThicknessM ?? 0.125);
  }, [params.areaSqFt, params.slabThicknessM]);

  // Handle Area Source Selection (Area Takeoff Connection)
  const handleAreaSourceChange = (sourceKey: string) => {
    setSelectedAreaSource(sourceKey);
    if (sourceKey === 'project_total') {
      const total = project?.builtUpAreaSqFt || totalFloorAreaSqFt || 3599;
      handleAreaChange(total);
    } else {
      const foundFloor = effectiveFloors.find((f) => f.id === sourceKey);
      if (foundFloor) {
        handleAreaChange(foundFloor.areaSqFt);
      }
    }
  };

  // Handle Area Change
  const handleAreaChange = (val: number) => {
    const valid = Math.max(10, val);
    setParams((prev) => ({
      ...prev,
      areaSqFt: valid,
      wallAreaSqFt: valid * 3.0,
    }));
  };

  // 1-Click: Sync this area back into Project builtUpAreaSqFt
  const handleSyncAreaToProject = () => {
    if (onUpdateProject && project) {
      onUpdateProject({
        ...project,
        builtUpAreaSqFt: params.areaSqFt,
      });
      setSyncFeedback(`✓ Area Takeoff synchronized: Updated project built-up area to ${params.areaSqFt.toLocaleString()} sq.ft!`);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  // Copy quick formula text
  const handleCopyFormula = (formula: string, item: string) => {
    navigator.clipboard.writeText(`${item}: ${formula}`);
    setCopiedFormula(item);
    setTimeout(() => setCopiedFormula(null), 2500);
  };

  // Handle Apply to Project Takeoff Norms
  const handleApplyToTakeoff = () => {
    const overrides = getCivilWisdomMaterialOverrides();
    if (onApplyToTakeoff) {
      onApplyToTakeoff(overrides, params.areaSqFt);
    }
    setSyncFeedback('✓ Civil Wisdom Quick Estimation Norms applied to Material Takeoff standards!');
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  // 1-Click: Sync Single Material Row to BOQ Schedule
  const handleSyncSingleToBOQ = (formula: CivilWisdomFormulaItem) => {
    if (!onUpdateBOQItems) return;
    const qty = formula.calculateQuantity(params);
    const { updatedItems, affectedItem, action } = syncMatrixItemToBOQ(
      formula,
      qty,
      boqItems,
      params.areaSqFt,
      effectiveFloors
    );
    onUpdateBOQItems(updatedItems);
    setSyncFeedback(
      `✓ BOQ Quantities Synced: ${action === 'updated' ? 'Updated' : 'Added'} "${affectedItem.name}" (${affectedItem.quantity.toLocaleString()} ${affectedItem.unit}) in project BOQ schedule!`
    );
    setTimeout(() => setSyncFeedback(null), 4500);
  };

  // 1-Click: Sync All 14 Matrix Quantities to BOQ Schedule
  const handleSyncAllToBOQ = () => {
    if (!onUpdateBOQItems) return;
    const { updatedItems, updatedCount, createdCount, message } = syncAllMatrixQuantitiesToBOQ(
      CIVIL_WISDOM_FORMULAS,
      params,
      boqItems,
      effectiveFloors
    );
    onUpdateBOQItems(updatedItems);
    setSyncFeedback(message);
    setTimeout(() => setSyncFeedback(null), 5000);
  };

  // Pre-calculate BOQ matches for all formulas
  const formulaBOQMatches: Record<string, BOQMatchResult> = useMemo(() => {
    const map: Record<string, BOQMatchResult> = {};
    CIVIL_WISDOM_FORMULAS.forEach((f) => {
      const qty = f.calculateQuantity(params);
      map[f.id] = matchFormulaToBOQItem(f, qty, boqItems);
    });
    return map;
  }, [params, boqItems]);

  // Count matches
  const linkedBOQCount = useMemo(() => {
    return Object.values(formulaBOQMatches).filter((m) => m.matchedItem !== null).length;
  }, [formulaBOQMatches]);

  // Filtered Formulas
  const filteredFormulas = CIVIL_WISDOM_FORMULAS.filter((f) => {
    if (filterCategory === 'all') return true;
    return f.category === filterCategory;
  });

  // Calculate totals
  const totalEstimatedCost = CIVIL_WISDOM_FORMULAS.reduce((sum, item) => {
    return sum + item.calculateCost(params);
  }, 0);

  // Helper to render formula badge color matching the image
  const getFormulaBadgeStyle = (id: string) => {
    switch (id) {
      case 'cw-cement':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50';
      case 'cw-steel':
        return 'bg-blue-950/80 text-blue-300 border-blue-500/50';
      case 'cw-bricks':
        return 'bg-orange-950/80 text-orange-300 border-orange-500/50';
      case 'cw-sand':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/50';
      case 'cw-aggregate':
        return 'bg-purple-950/80 text-purple-300 border-purple-500/50';
      case 'cw-concrete':
        return 'bg-teal-950/80 text-teal-300 border-teal-500/50';
      case 'cw-water':
        return 'bg-sky-950/80 text-sky-300 border-sky-500/50';
      case 'cw-paint':
        return 'bg-rose-950/80 text-rose-300 border-rose-500/50';
      case 'cw-tiles':
        return 'bg-green-950/80 text-green-300 border-green-500/50';
      case 'cw-excavation':
        return 'bg-amber-950/80 text-amber-400 border-amber-500/50';
      case 'cw-pcc':
        return 'bg-slate-900 text-slate-300 border-slate-700';
      case 'cw-labour':
        return 'bg-violet-950/80 text-violet-300 border-violet-500/50';
      case 'cw-electrical':
        return 'bg-yellow-950/80 text-yellow-300 border-yellow-500/50';
      case 'cw-plumbing':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50';
      // Extra items from Reference Guide
      case 'cw-slab-wet-vol':
        return 'bg-teal-950/80 text-teal-300 border-teal-500/50';
      case 'cw-slab-dry-vol':
        return 'bg-slate-900 text-cyan-300 border-cyan-500/50';
      case 'cw-slab-cement':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50';
      case 'cw-slab-sand':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/50';
      case 'cw-slab-coarse-agg':
        return 'bg-purple-950/80 text-purple-300 border-purple-500/50';
      case 'cw-slab-steel':
        return 'bg-blue-950/80 text-blue-300 border-blue-500/50';
      case 'cw-gba-high-rise':
        return 'bg-rose-950/80 text-rose-300 border-rose-500/50';
      case 'cw-gba-voids-setbacks':
        return 'bg-violet-950/80 text-violet-300 border-violet-500/50';
      case 'cw-gba-floor-height':
        return 'bg-sky-950/80 text-sky-300 border-sky-500/50';
      case 'cw-gba-oc-exemption':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50';
      default:
        return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  // Helper to render icon for each item
  const renderItemIcon = (iconType: string) => {
    switch (iconType) {
      case 'cement':
        return <span className="text-base">📦</span>;
      case 'steel':
        return <span className="text-base">🔩</span>;
      case 'bricks':
        return <span className="text-base">🧱</span>;
      case 'sand':
        return <span className="text-base">⏳</span>;
      case 'aggregate':
        return <span className="text-base">🪨</span>;
      case 'concrete':
        return <span className="text-base">🚚</span>;
      case 'water':
        return <span className="text-base">💧</span>;
      case 'paint':
        return <span className="text-base">🖌️</span>;
      case 'tiles':
        return <span className="text-base">▦</span>;
      case 'excavation':
        return <span className="text-base">🚜</span>;
      case 'pcc':
        return <span className="text-base">🧊</span>;
      case 'labour':
        return <span className="text-base">👷</span>;
      case 'electrical':
        return <span className="text-base">⚡</span>;
      case 'plumbing':
        return <span className="text-base">🚰</span>;
      case 'slab':
        return <span className="text-base">🏗️</span>;
      case 'ratio':
        return <span className="text-base">⚖️</span>;
      case 'building':
        return <span className="text-base">🏢</span>;
      case 'voids':
        return <span className="text-base">📐</span>;
      case 'rule':
        return <span className="text-base">📜</span>;
      default:
        return <span className="text-base">📋</span>;
    }
  };

  // Selected formula object for Floor Breakdown tab
  const activeFormulaItem = CIVIL_WISDOM_FORMULAS.find((f) => f.id === selectedFormulaForFloors) || CIVIL_WISDOM_FORMULAS[0];
  const floorBreakdown = useMemo(() => {
    return calculateFloorWiseFormulaBreakdown(activeFormulaItem, params, effectiveFloors);
  }, [activeFormulaItem, params, effectiveFloors]);

  return (
    <div
      id="civil-wisdom-formula-matrix"
      className={`rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden ${className}`}
    >
      {/* Top Banner styled like the Civil Wisdom visual poster */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 p-4 sm:p-5 text-slate-950">
        <div className="max-w-4xl mx-auto text-center space-y-1.5">
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm font-black tracking-widest uppercase opacity-75">⇶</span>
            <h3 className="text-lg sm:text-2xl font-black tracking-wider uppercase font-mono">
              STANDARD MATERIAL MATRIX &amp; QUICK FORMULAS
            </h3>
            <span className="text-sm font-black tracking-widest uppercase opacity-75">⇇</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-slate-950 text-amber-300 text-xs font-black tracking-wider uppercase font-mono shadow-sm">
            <span>FAST • SIMPLE • PRACTICAL</span>
            <span className="text-slate-600">•</span>
            <span>CONNECTED TO AREA TAKEOFF &amp; QUANTITIES</span>
          </div>

          <p className="text-xs text-slate-900 font-medium max-w-2xl mx-auto pt-0.5">
            Empirical consumption standards bidirectionally linked with building floor area takeoff and project BOQ quantities schedule.
          </p>
        </div>
      </div>

      {/* Connection Navigation Tabs: Master Matrix vs Reference Guide vs Floor Area Takeoff vs BOQ Reconciliation */}
      <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto">
          <button
            type="button"
            id="tab-cw-matrix-view"
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'matrix'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Master Matrix ({CIVIL_WISDOM_FORMULAS.length})</span>
          </button>

          <button
            type="button"
            id="tab-cw-reference-guide-view"
            onClick={() => setActiveTab('reference-guide')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'reference-guide'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Reference Guide (M20 &amp; GBA Rules)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400/20 text-amber-300 border border-amber-500/40 font-bold">
              Guide
            </span>
          </button>

          <button
            type="button"
            id="tab-cw-floor-takeoff-view"
            onClick={() => setActiveTab('floors')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'floors'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Floor Area Takeoff ({effectiveFloors.length} Levels)</span>
          </button>

          <button
            type="button"
            id="tab-cw-boq-bridge-view"
            onClick={() => setActiveTab('reconciliation')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'reconciliation'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Quantities (BOQ) Bridge</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950 text-amber-300 border border-slate-700">
              {linkedBOQCount}/{CIVIL_WISDOM_FORMULAS.length}
            </span>
          </button>
        </div>

        {/* Global 1-Click Sync to BOQ Quantities */}
        <div className="flex items-center gap-2">
          {onUpdateBOQItems && (
            <button
              type="button"
              id="btn-sync-all-matrix-to-boq"
              onClick={handleSyncAllToBOQ}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono text-xs transition flex items-center gap-1.5 shadow-sm"
              title="Automatically sync all 14 empirical material quantities into the project's BOQ schedule"
            >
              <Database className="w-3.5 h-3.5 text-slate-950" />
              <span>Sync All Quantities to BOQ</span>
            </button>
          )}

          {onNavigateToBOQ && (
            <button
              type="button"
              onClick={onNavigateToBOQ}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono transition flex items-center gap-1"
            >
              <span>View BOQ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Control Bar: Built-up Area input + Connected Area Source selector */}
      <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Connected Floor Source Selector */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
            <Building className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-mono text-slate-300">Takeoff Scope:</span>
            <select
              value={selectedAreaSource}
              onChange={(e) => handleAreaSourceChange(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
            >
              <option value="project_total">
                Full Project Built-Up ({totalFloorAreaSqFt > 0 ? totalFloorAreaSqFt.toLocaleString() : (project?.builtUpAreaSqFt || 3599).toLocaleString()} sq.ft)
              </option>
              {effectiveFloors.map((floor) => (
                <option key={floor.id} value={floor.id}>
                  {floor.shortCode} • {floor.name} ({floor.areaSqFt.toLocaleString()} sq.ft)
                </option>
              ))}
            </select>
          </div>

          {/* Target Area input */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
            <Calculator className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono text-slate-300">Active Area:</span>
            <input
              id="input-cw-target-area"
              type="number"
              min={100}
              step={50}
              value={params.areaSqFt}
              onChange={(e) => {
                setSelectedAreaSource('custom');
                handleAreaChange(Number(e.target.value) || 100);
              }}
              className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-amber-400 text-right focus:outline-none focus:border-amber-500"
            />
            <span className="text-xs font-mono text-slate-400">Sq.Ft</span>

            {onUpdateProject && (
              <button
                type="button"
                onClick={handleSyncAreaToProject}
                className="px-2 py-0.5 rounded text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition ml-1"
                title="Save this area as project's builtUpAreaSqFt"
              >
                Sync to Project
              </button>
            )}
          </div>

          {/* Quick preset area pills */}
          <div className="hidden sm:flex items-center gap-1 font-mono text-xs">
            <span className="text-slate-500 text-[11px] mr-1">Presets:</span>
            {[1400, 2400, 3000, 3599, 5800].map((sft) => (
              <button
                key={sft}
                type="button"
                onClick={() => {
                  setSelectedAreaSource('custom');
                  handleAreaChange(sft);
                }}
                className={`px-2 py-1 rounded-md text-[11px] transition ${
                  params.areaSqFt === sft
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {sft.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowParameters(!showParameters)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition flex items-center gap-1.5 border ${
              showParameters
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span>Parameters</span>
            {showParameters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {onApplyToTakeoff && (
            <button
              type="button"
              id="btn-apply-cw-to-takeoff"
              onClick={handleApplyToTakeoff}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-300 text-xs font-bold font-mono transition flex items-center gap-1.5 shadow-sm"
              title="Apply Civil Wisdom formula consumption norms to floor takeoff standards"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Apply Norms to Takeoff</span>
            </button>
          )}

          {onNavigateToAreaTakeoff && (
            <button
              type="button"
              onClick={onNavigateToAreaTakeoff}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono transition flex items-center gap-1"
            >
              <span>Full Floor View</span>
              <Building className="w-3.5 h-3.5 text-amber-400" />
            </button>
          )}
        </div>
      </div>

      {/* Feedback Notification Banner */}
      {syncFeedback && (
        <div className="px-4 py-2.5 bg-emerald-500/15 border-b border-emerald-500/30 text-xs font-mono text-emerald-300 flex items-center justify-between animate-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncFeedback(null)}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Expandable Advanced Engineering Parameters Drawer */}
      {showParameters && (
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 space-y-3 font-mono text-xs animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Advanced Engineering Formula Calibration</span>
            </span>
            <button
              type="button"
              onClick={() =>
                setParams({
                  areaSqFt: initialAreaSqFt || 3599,
                  wallAreaSqFt: (initialAreaSqFt || 3599) * 3.0,
                  excavationLengthFt: 40,
                  excavationBreadthFt: 30,
                  excavationDepthFt: 5,
                  pccLengthFt: 40,
                  pccBreadthFt: 30,
                  pccThicknessFt: 0.333,
                  tileLengthFt: 2.0,
                  tileBreadthFt: 2.0,
                  labourRatePerSqFt: 320,
                  electricalRatePerSqFt: 85,
                  plumbingRatePerSqFt: 75,
                })
              }
              className="text-slate-400 hover:text-white text-[11px] flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Defaults</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 block font-semibold">Wall Area for Paint (sq.ft):</span>
              <input
                type="number"
                value={params.wallAreaSqFt}
                onChange={(e) => setParams((p) => ({ ...p, wallAreaSqFt: Number(e.target.value) || 0 }))}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
              />
              <span className="text-[9px] text-slate-500">Formula: Wall Area ÷ 140 L</span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 block font-semibold">Excavation (L × B × D in ft):</span>
              <div className="grid grid-cols-3 gap-1">
                <input
                  type="number"
                  placeholder="L"
                  value={params.excavationLengthFt}
                  onChange={(e) => setParams((p) => ({ ...p, excavationLengthFt: Number(e.target.value) || 0 }))}
                  className="bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-xs text-white text-center"
                />
                <input
                  type="number"
                  placeholder="B"
                  value={params.excavationBreadthFt}
                  onChange={(e) => setParams((p) => ({ ...p, excavationBreadthFt: Number(e.target.value) || 0 }))}
                  className="bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-xs text-white text-center"
                />
                <input
                  type="number"
                  placeholder="D"
                  value={params.excavationDepthFt}
                  onChange={(e) => setParams((p) => ({ ...p, excavationDepthFt: Number(e.target.value) || 0 }))}
                  className="bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-xs text-white text-center"
                />
              </div>
              <span className="text-[9px] text-slate-500">CFT: {((params.excavationLengthFt || 0) * (params.excavationBreadthFt || 0) * (params.excavationDepthFt || 0)).toLocaleString()} CFT</span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 block font-semibold">Single Tile Size (L × B in ft):</span>
              <div className="grid grid-cols-2 gap-1">
                <input
                  type="number"
                  step="0.5"
                  placeholder="Length"
                  value={params.tileLengthFt}
                  onChange={(e) => setParams((p) => ({ ...p, tileLengthFt: Number(e.target.value) || 1 }))}
                  className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white text-center"
                />
                <input
                  type="number"
                  step="0.5"
                  placeholder="Breadth"
                  value={params.tileBreadthFt}
                  onChange={(e) => setParams((p) => ({ ...p, tileBreadthFt: Number(e.target.value) || 1 }))}
                  className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white text-center"
                />
              </div>
              <span className="text-[9px] text-slate-500">
                Area: {((params.tileLengthFt || 2) * (params.tileBreadthFt || 2)).toFixed(1)} sq.ft per tile
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 block font-semibold">Sub-Contract Rates (₹/sq.ft):</span>
              <div className="grid grid-cols-3 gap-1">
                <input
                  type="number"
                  placeholder="Labour"
                  title="Labour rate per sq.ft"
                  value={params.labourRatePerSqFt}
                  onChange={(e) => setParams((p) => ({ ...p, labourRatePerSqFt: Number(e.target.value) || 0 }))}
                  className="bg-slate-950 border border-slate-700 rounded px-1 py-1 text-[11px] text-white text-center"
                />
                <input
                  type="number"
                  placeholder="Elect"
                  title="Electrical rate per sq.ft"
                  value={params.electricalRatePerSqFt}
                  onChange={(e) => setParams((p) => ({ ...p, electricalRatePerSqFt: Number(e.target.value) || 0 }))}
                  className="bg-slate-950 border border-slate-700 rounded px-1 py-1 text-[11px] text-white text-center"
                />
                <input
                  type="number"
                  placeholder="Plumb"
                  title="Plumbing rate per sq.ft"
                  value={params.plumbingRatePerSqFt}
                  onChange={(e) => setParams((p) => ({ ...p, plumbingRatePerSqFt: Number(e.target.value) || 0 }))}
                  className="bg-slate-950 border border-slate-700 rounded px-1 py-1 text-[11px] text-white text-center"
                />
              </div>
              <span className="text-[9px] text-slate-500">Labour: ₹{params.labourRatePerSqFt} • Elect: ₹{params.electricalRatePerSqFt} • Plumb: ₹{params.plumbingRatePerSqFt}</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: MASTER MATRIX TABLE (WITH BOQ QUANTITIES CONNECTION)               */}
      {/* ========================================================================= */}
      {activeTab === 'matrix' && (
        <div>
          {/* Category filter tabs & summary */}
          <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between overflow-x-auto gap-2">
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span className="text-[11px] text-slate-500 mr-1 hidden sm:inline">Category:</span>
              {[
                'all',
                'Civil & Structural',
                'Concrete & Steel Estimation',
                'GBA & Building Regulations',
                'Finishes & Architectural',
                'Substructure',
                'Services & Trades',
              ].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition ${
                    filterCategory === cat
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                      : 'text-slate-400 hover:text-white border border-transparent'
                  }`}
                >
                  {cat === 'all'
                    ? `All Formulas (${CIVIL_WISDOM_FORMULAS.length})`
                    : cat === 'Concrete & Steel Estimation'
                    ? `M20 Slab & Steel (${CIVIL_WISDOM_FORMULAS.filter((f) => f.category === cat).length})`
                    : cat === 'GBA & Building Regulations'
                    ? `GBA Regulations (${CIVIL_WISDOM_FORMULAS.filter((f) => f.category === cat).length})`
                    : cat}
                </button>
              ))}
            </div>

            <div className="text-[11px] font-mono text-slate-400 shrink-0">
              Estimated Material &amp; Trade Budget:{' '}
              <strong className="text-amber-400 text-xs">
                {formatCurrency(totalEstimatedCost, currency)}
              </strong>
            </div>
          </div>

          {/* Master Formulas Table with BOQ Connection Column */}
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3 font-bold w-10 text-center">#</th>
                  <th className="py-3 px-3 font-bold w-32">ITEM</th>
                  <th className="py-3 px-3 font-bold min-w-[170px]">WHAT IT IS</th>
                  <th className="py-3 px-3 font-bold min-w-[190px]">QUICK FORMULA</th>
                  <th className="py-3 px-3 font-bold text-right w-28">EST. QUANTITY</th>
                  <th className="py-3 px-3 font-bold text-right w-28">EST. BUDGET</th>
                  <th className="py-3 px-3 font-bold min-w-[210px]">CONNECTED BOQ QUANTITY</th>
                  <th className="py-3 px-3 font-bold text-center w-24">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs">
                {filteredFormulas.map((formula, idx) => {
                  const qty = formula.calculateQuantity(params);
                  const cost = formula.calculateCost(params);
                  const badgeClass = getFormulaBadgeStyle(formula.id);
                  const boqMatch = formulaBOQMatches[formula.id];

                  return (
                    <tr
                      key={formula.id}
                      className="hover:bg-slate-800/40 transition group"
                    >
                      {/* Row index + icon */}
                      <td className="py-3 px-3 text-center text-slate-500 text-[11px]">
                        <div className="flex items-center justify-center gap-1">
                          <span className="w-3 text-slate-500 text-center font-bold">{idx + 1}</span>
                          <span className="shrink-0">{renderItemIcon(formula.iconType)}</span>
                        </div>
                      </td>

                      {/* ITEM */}
                      <td className="py-3 px-3 font-bold text-white tracking-wide">
                        <span className="text-amber-400">{formula.item}</span>
                      </td>

                      {/* WHAT IT IS */}
                      <td className="py-3 px-3 text-slate-300">
                        <div>
                          <span>{formula.whatItIs}</span>
                          <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                            {formula.notes}
                          </p>
                        </div>
                      </td>

                      {/* QUICK FORMULA with visual arrow pill matching the poster */}
                      <td className="py-3 px-3">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold shadow-sm select-all tracking-wide">
                          <span className="text-amber-400 font-black">➔</span>
                          <span className={badgeClass.split(' ')[1]}>{formula.quickFormula}</span>
                        </div>
                      </td>

                      {/* ESTIMATED QUANTITY calculated from area */}
                      <td className="py-3 px-3 text-right">
                        <span className="font-bold text-white font-mono text-sm">
                          {typeof qty === 'number' ? qty.toLocaleString() : qty}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {formula.unit}
                        </span>
                      </td>

                      {/* ESTIMATED BUDGET */}
                      <td className="py-3 px-3 text-right">
                        {formula.isRegulatory ? (
                          <div>
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-bold border border-slate-700">
                              Standard Norm
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              GBA Regulation
                            </span>
                          </div>
                        ) : formula.id === 'cw-slab-dry-vol' ? (
                          <div>
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-cyan-950/60 text-cyan-300 font-bold border border-cyan-800">
                              1.54× Ratio
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              Dry Factor Norm
                            </span>
                          </div>
                        ) : (
                          <>
                            <span className="font-bold text-amber-400 font-mono text-xs">
                              {formatCurrency(cost, currency)}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              @ ₹{formula.defaultRate} {formula.rateUnit}
                            </span>
                          </>
                        )}
                      </td>

                      {/* CONNECTED BOQ QUANTITY & VARIANCE STATUS */}
                      <td className="py-3 px-3">
                        {formula.isRegulatory ? (
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-violet-950/60 text-violet-300 border border-violet-500/30 font-bold">
                              <ShieldCheck className="w-3 h-3 text-violet-400" />
                              <span>Statutory Compliance Norm</span>
                            </span>
                          </div>
                        ) : formula.id === 'cw-slab-dry-vol' ? (
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 font-bold">
                              <Scale className="w-3 h-3 text-cyan-400" />
                              <span>Mix Volume Conversion Factor</span>
                            </span>
                          </div>
                        ) : boqMatch.matchedItem ? (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-1 text-[11px]">
                              <span className="text-slate-300 font-medium truncate max-w-[130px]" title={boqMatch.matchedItem.name}>
                                {boqMatch.matchedItem.name}
                              </span>
                              <span className="font-bold text-white font-mono shrink-0">
                                {boqMatch.matchedItem.quantity.toLocaleString()} {boqMatch.matchedItem.unit}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {boqMatch.status === 'matched' ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                                  <Check className="w-3 h-3" />
                                  <span>In Sync</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                                  <span>{boqMatch.statusLabel}</span>
                                </span>
                              )}
                              <span className="text-[10px] text-slate-500 font-mono">
                                (Item #{boqMatch.matchedItem.id})
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                            <span className="italic">Not in BOQ</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              Ready to sync
                            </span>
                          </div>
                        )}
                      </td>

                      {/* ACTIONS: Push to BOQ & Copy */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {onUpdateBOQItems && !formula.isRegulatory && formula.id !== 'cw-slab-dry-vol' && (
                            <button
                              type="button"
                              onClick={() => handleSyncSingleToBOQ(formula)}
                              className="p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-slate-950 transition border border-amber-500/30"
                              title={`Sync ${formula.item} quantity (${qty.toLocaleString()} ${formula.unit}) directly to BOQ`}
                            >
                              <Database className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleCopyFormula(formula.quickFormula, formula.item)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                            title={`Copy ${formula.item} Formula`}
                          >
                            {copiedFormula === formula.item ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: REFERENCE GUIDE (CONCRETE & STEEL ESTIMATION + GBA REGULATIONS)     */}
      {/* ========================================================================= */}
      {activeTab === 'reference-guide' && (
        <div className="p-4 sm:p-5 space-y-6 font-mono text-xs">
          {/* Header Banner */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">
                    CONSTRUCTION &amp; BUILDING REGULATIONS REFERENCE GUIDE
                  </h4>
                  <p className="text-slate-400 text-xs">
                    Standard Roof Slab (M20 Grade 1:1.5:3) Concrete &amp; Steel Estimation + GBA Statutory Bye-Laws
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 flex items-center gap-2">
                <span className="text-slate-400">Active Area:</span>
                <span className="font-bold text-amber-400">{params.areaSqFt.toLocaleString()} sq.ft</span>
                <span className="text-slate-400 text-[10px]">({(params.areaSqFt * 0.092903).toFixed(1)} m²)</span>
              </div>

              {onUpdateBOQItems && (
                <button
                  type="button"
                  id="btn-sync-roof-slab-to-boq"
                  onClick={() => {
                    const slabFormulas = CIVIL_WISDOM_FORMULAS.filter((f) => f.category === 'Concrete & Steel Estimation' && !f.isRegulatory && f.id !== 'cw-slab-dry-vol');
                    let currentBOQ = [...boqItems];
                    slabFormulas.forEach((f) => {
                      const qty = f.calculateQuantity(params);
                      const res = syncMatrixItemToBOQ(f, qty, currentBOQ, params.areaSqFt, effectiveFloors);
                      currentBOQ = res.updatedItems;
                    });
                    onUpdateBOQItems(currentBOQ);
                    setSyncFeedback(`Synchronized ${slabFormulas.length} M20 Roof Slab materials to BOQ schedule`);
                    setTimeout(() => setSyncFeedback(null), 4000);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Sync M20 Slab Materials to BOQ</span>
                </button>
              )}
            </div>
          </div>

          {/* SECTION 1: CONCRETE & STEEL ESTIMATION */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[11px]">
                    SECTION 1
                  </span>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    CONCRETE &amp; STEEL ESTIMATION
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Standard Residential Roof Slab: M20 Grade Concrete (1 : 1.5 : 3 Mix Ratio = 5.5 Parts)
                </p>
              </div>

              {/* Slab Thickness Selector */}
              <div className="flex items-center gap-2 text-xs bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-400">Slab Thickness:</span>
                {[0.100, 0.125, 0.150].map((th) => (
                  <button
                    key={th}
                    type="button"
                    onClick={() => setParams((p) => ({ ...p, slabThicknessM: th }))}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                      (params.slabThicknessM ?? 0.125) === th
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {th}m ({th === 0.125 ? '5" Standard' : th === 0.100 ? '4"' : '6"'})
                  </button>
                ))}
              </div>
            </div>

            {/* 4 Calculation Steps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Step 1: Calculate Wet Volume */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center font-bold text-[11px]">
                      1
                    </span>
                    <h4 className="font-bold text-teal-300 uppercase tracking-wide text-xs">
                      Calculate Wet Volume of Concrete
                    </h4>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-teal-950/80 text-teal-300 border border-teal-800 font-mono">
                    L × W × Thickness
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 space-y-2">
                  <div className="text-slate-300 text-xs leading-relaxed">
                    <strong className="text-white">Formula:</strong> <code className="text-amber-300 bg-slate-950 px-1.5 py-0.5 rounded">Length × Width × Thickness</code>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    <strong>Reference Guide Benchmark:</strong> For a 1,000 sq ft (≈ 92.9 m²) slab with a 0.125 m thickness, wet volume is <strong className="text-teal-300">11.61 m³</strong>.
                  </p>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Current Project Wet Volume:</span>
                    <span className="text-base font-bold text-teal-400">
                      {roofSlabResult.wetVolumeM3.toFixed(2)} m³
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Calculated as {params.areaSqFt.toLocaleString()} sq ft ({roofSlabResult.slabAreaM2.toFixed(1)} m²) × {params.slabThicknessM ?? 0.125} m
                  </div>
                </div>
              </div>

              {/* Step 2: Convert to Dry Volume */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center font-bold text-[11px]">
                      2
                    </span>
                    <h4 className="font-bold text-cyan-300 uppercase tracking-wide text-xs">
                      Convert to Dry Volume
                    </h4>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800 font-mono">
                    Wet Vol × 1.54 Factor
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 space-y-2">
                  <div className="text-slate-300 text-xs leading-relaxed">
                    <strong className="text-white">Formula:</strong> <code className="text-amber-300 bg-slate-950 px-1.5 py-0.5 rounded">Wet Volume × 1.54</code>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    <strong>Reference Guide Benchmark:</strong> 11.61 m³ × 1.54 = <strong className="text-cyan-300">17.88 m³</strong> of dry mix.
                  </p>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Current Project Dry Volume:</span>
                    <span className="text-base font-bold text-cyan-400">
                      {roofSlabResult.dryVolumeM3.toFixed(2)} m³
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Dry factor of 1.54 accounts for aggregate voids and shrinkage when water is added.
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Material Breakdown (1:1.5:3 = 5.5 Parts) */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold text-[11px]">
                    3
                  </span>
                  <h4 className="font-bold text-emerald-300 uppercase tracking-wide text-xs">
                    Material Breakdown (Ratio 1 : 1.5 : 3 = 5.5 Total Parts)
                  </h4>
                </div>
                <div className="text-[10px] text-slate-400">
                  Total Dry Mix: <strong className="text-white">{roofSlabResult.dryVolumeM3.toFixed(2)} m³</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Cement */}
                <div className="p-3.5 rounded-lg bg-slate-900 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">📦</span>
                      <strong className="text-white">Cement (1 Part)</strong>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                      (1 / 5.5) × Dry Vol
                    </span>
                  </div>
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Volume:</span>
                      <span className="text-slate-200">{roofSlabResult.cementM3.toFixed(2)} m³</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Bags (50 kg):</span>
                      <span className="text-sm font-bold text-emerald-400">{roofSlabResult.cementBags} Bags</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
                      <span className="text-slate-500">Ref (1,000 sq ft):</span>
                      <span className="text-slate-400">94 bags (3.25 m³)</span>
                    </div>
                  </div>
                </div>

                {/* Sand */}
                <div className="p-3.5 rounded-lg bg-slate-900 border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">⏳</span>
                      <strong className="text-white">Sand (1.5 Parts)</strong>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono">
                      (1.5 / 5.5) × Dry Vol
                    </span>
                  </div>
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Volume:</span>
                      <span className="text-slate-200">{roofSlabResult.sandM3.toFixed(2)} m³</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Cubic Feet:</span>
                      <span className="text-sm font-bold text-amber-400">{roofSlabResult.sandCFT.toLocaleString()} CFT</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
                      <span className="text-slate-500">Ref (1,000 sq ft):</span>
                      <span className="text-slate-400">172 CFT (4.87 m³)</span>
                    </div>
                  </div>
                </div>

                {/* Coarse Aggregate */}
                <div className="p-3.5 rounded-lg bg-slate-900 border border-purple-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">🪨</span>
                      <strong className="text-white">Coarse Agg (3 Parts)</strong>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                      (3 / 5.5) × Dry Vol
                    </span>
                  </div>
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Volume:</span>
                      <span className="text-slate-200">{roofSlabResult.coarseAggM3.toFixed(2)} m³</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Cubic Feet:</span>
                      <span className="text-sm font-bold text-purple-400">{roofSlabResult.coarseAggCFT.toLocaleString()} CFT</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
                      <span className="text-slate-500">Ref (1,000 sq ft):</span>
                      <span className="text-slate-400">344 CFT (9.75 m³)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Steel Reinforcement (Thumb Rule 1%) */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center justify-center font-bold text-[11px]">
                    4
                  </span>
                  <h4 className="font-bold text-blue-300 uppercase tracking-wide text-xs">
                    Steel Reinforcement (Thumb Rule 1% by Concrete Volume)
                  </h4>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800 font-mono">
                  1% of Wet Vol × 7,850 kg/m³
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                <p className="text-slate-300 text-xs leading-relaxed">
                  <strong className="text-white">Rule:</strong> Standard slabs require about <strong className="text-amber-400">1% steel by total concrete volume</strong>.
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  <strong>Reference Guide Benchmark:</strong> For 11.61 m³ of concrete (1,000 sq ft slab), this equals roughly <strong className="text-blue-300">0.9 to 1.05 tonnes</strong> of steel bars, including lapping and 5% wastage.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800 font-mono text-center">
                    <span className="text-[10px] text-slate-400 block">Min Range (0.90 MT/1k sq ft):</span>
                    <strong className="text-sm text-blue-400">{roofSlabResult.steelTonnesMin} MT</strong>
                    <span className="text-[10px] text-slate-500 block">({(roofSlabResult.steelTonnesMin * 1000).toLocaleString()} Kg)</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-950 border border-blue-500/40 font-mono text-center">
                    <span className="text-[10px] text-blue-300 block font-bold">Estimated Average:</span>
                    <strong className="text-base text-white">{roofSlabResult.steelTonnesAvg} MT</strong>
                    <span className="text-[10px] text-blue-400 block">({(roofSlabResult.steelTonnesAvg * 1000).toLocaleString()} Kg)</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800 font-mono text-center">
                    <span className="text-[10px] text-slate-400 block">Max Range (1.05 MT/1k sq ft):</span>
                    <strong className="text-sm text-blue-400">{roofSlabResult.steelTonnesMax} MT</strong>
                    <span className="text-[10px] text-slate-500 block">({(roofSlabResult.steelTonnesMax * 1000).toLocaleString()} Kg)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: GBA & BUILDING REGULATIONS */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="px-2 py-0.5 rounded bg-violet-500 text-slate-950 font-black text-[11px]">
                SECTION 2
              </span>
              <h3 className="text-sm font-bold text-white tracking-wide">
                GBA &amp; BUILDING REGULATIONS SUMMARY
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Rule 1: High-Rise Definition */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🏢</span>
                    <h4 className="font-bold text-rose-300 uppercase tracking-wide text-xs">
                      High-Rise Definition
                    </h4>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800 font-mono">
                    Revised Threshold: 21m
                  </span>
                </div>

                <p className="text-slate-300 text-xs leading-relaxed">
                  The minimum height threshold to classify a structure as a high-rise building has been revised from <strong className="text-amber-300">15 metres to 21 metres</strong>.
                </p>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Test Building Height:</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        max="150"
                        value={params.buildingHeightM ?? 15}
                        onChange={(e) => setParams((p) => ({ ...p, buildingHeightM: Number(e.target.value) || 0 }))}
                        className="w-16 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-center font-bold text-white text-xs"
                      />
                      <span className="text-slate-400">metres</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center gap-2 text-xs">
                    {(params.buildingHeightM ?? 15) >= 21 ? (
                      <div className="p-2 rounded bg-rose-950/60 border border-rose-500/40 text-rose-300 flex items-start gap-2 w-full">
                        <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block text-rose-200 font-bold">CLASSIFIED AS HIGH-RISE STRUCTURE</strong>
                          <span className="text-[11px] text-rose-300">Mandatory NBC high-rise fire evacuation, dual staircases, and specialized structural committee approval apply.</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 flex items-start gap-2 w-full">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block text-emerald-200 font-bold">REGULAR LOW / MID-RISE BUILDING</strong>
                          <span className="text-[11px] text-emerald-300">Height is below 21 metres. Governed under standard municipal bye-laws.</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Rule 2: Voids and Setbacks */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📐</span>
                    <h4 className="font-bold text-violet-300 uppercase tracking-wide text-xs">
                      Voids &amp; Setbacks
                    </h4>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-violet-950/80 text-violet-300 border border-violet-800 font-mono">
                    Max 10% Voids • Min 2m Setback
                  </span>
                </div>

                <p className="text-slate-300 text-xs leading-relaxed">
                  Total permissible void area is capped at <strong className="text-amber-300">10% of the gross built-up area</strong>, and basements require a <strong className="text-violet-300">mandatory minimum setback of 2.0 metres</strong>.
                </p>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Current GBA:</span>
                    <span className="text-white font-bold">{params.areaSqFt.toLocaleString()} sq.ft</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Max Permissible Voids (10% Cap):</span>
                    <span className="text-amber-400 font-bold">{(params.areaSqFt * 0.10).toLocaleString()} sq.ft</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                    <span className="text-slate-400">Basement Setback Requirement:</span>
                    <span className="text-emerald-400 font-bold">≥ 2.00 Metres (6.56 ft)</span>
                  </div>
                </div>
              </div>

              {/* Rule 3: Floor-to-Floor Height */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📏</span>
                    <h4 className="font-bold text-sky-300 uppercase tracking-wide text-xs">
                      Floor-to-Floor Height
                    </h4>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-800 font-mono">
                    3.5m – 4.5m Clear
                  </span>
                </div>

                <p className="text-slate-300 text-xs leading-relaxed">
                  Permissible clear floor-to-floor height ranges from a <strong className="text-sky-300">minimum of 3.5 metres to a maximum of 4.5 metres per floor</strong>.
                </p>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Floor Clear Height:</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.1"
                        min="2.5"
                        max="6.0"
                        value={params.clearFloorHeightM ?? 3.5}
                        onChange={(e) => setParams((p) => ({ ...p, clearFloorHeightM: Number(e.target.value) || 0 }))}
                        className="w-16 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-center font-bold text-white text-xs"
                      />
                      <span className="text-slate-400">metres</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-xs">
                    {(params.clearFloorHeightM ?? 3.5) >= 3.5 && (params.clearFloorHeightM ?? 3.5) <= 4.5 ? (
                      <div className="p-2 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Complies with standard clear height regulation (3.5m - 4.5m range)</span>
                      </div>
                    ) : (
                      <div className="p-2 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span>Outside recommended clear height envelope (requires special municipal derogation)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Rule 4: OC Exemptions */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📜</span>
                    <h4 className="font-bold text-emerald-300 uppercase tracking-wide text-xs">
                      OC Exemptions (Small Residential Plots)
                    </h4>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-mono">
                    ≤ 1,200 sq.ft • G+2 or S+3
                  </span>
                </div>

                <p className="text-slate-300 text-xs leading-relaxed">
                  Small residential plots (up to <strong className="text-amber-300">1,200 sq ft</strong> with up to <strong className="text-emerald-300">Ground + 2</strong> or <strong className="text-emerald-300">Stilt + 3</strong> floors) maintain occupancy certificate exemptions if built strictly per approved plans.
                </p>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Plot Area (sq.ft):</span>
                      <input
                        type="number"
                        value={params.plotAreaSqFt ?? 1200}
                        onChange={(e) => setParams((p) => ({ ...p, plotAreaSqFt: Number(e.target.value) || 0 }))}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-bold text-white text-xs mt-0.5"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Floor Typology:</span>
                      <select
                        value={params.buildingFloorsLabel ?? 'G+2'}
                        onChange={(e) => setParams((p) => ({ ...p, buildingFloorsLabel: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white mt-0.5 font-bold"
                      >
                        <option value="G+2">Ground + 2 Floors</option>
                        <option value="S+3">Stilt + 3 Floors</option>
                        <option value="G+3">Ground + 3 Floors</option>
                        <option value="G+4">Ground + 4 Floors</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-xs">
                    {(params.plotAreaSqFt ?? 1200) <= 1200 && ['G+2', 'S+3'].includes(params.buildingFloorsLabel ?? 'G+2') ? (
                      <div className="p-2 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-[11px]">Eligible for Occupancy Certificate (OC) exemption if strictly built as per approved plan.</span>
                      </div>
                    ) : (
                      <div className="p-2 rounded bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-2">
                        <Info className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-[11px]">Standard full OC inspection &amp; sanction mandatory (Plot &gt; 1,200 sq.ft or exceeds G+2/S+3).</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FLOOR AREA TAKEOFF DISTRIBUTION                                    */}
      {/* ========================================================================= */}
      {activeTab === 'floors' && (
        <div className="p-4 space-y-4 font-mono text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-amber-400" />
                <span>Building Floor-Wise Material Distribution</span>
              </h4>
              <p className="text-slate-400 text-xs mt-0.5">
                Breakdown of empirical material volumes distributed across {effectiveFloors.length} building levels according to individual floor slab areas.
              </p>
            </div>

            {/* Select Material Formula to Inspect */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs">Material:</span>
              <select
                value={selectedFormulaForFloors}
                onChange={(e) => setSelectedFormulaForFloors(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-bold"
              >
                {CIVIL_WISDOM_FORMULAS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.item} — {f.quickFormula}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Material Header Card */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 text-lg">
                {renderItemIcon(activeFormulaItem.iconType)}
              </div>
              <div>
                <span className="font-bold text-white text-sm block">
                  {activeFormulaItem.item}: {activeFormulaItem.whatItIs}
                </span>
                <span className="text-amber-400 font-bold text-xs">
                  {activeFormulaItem.quickFormula} • Total Project Qty: {activeFormulaItem.calculateQuantity(params).toLocaleString()} {activeFormulaItem.unit}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Total Budget:</span>
                <span className="text-amber-300 font-bold text-sm">
                  {formatCurrency(activeFormulaItem.calculateCost(params), currency)}
                </span>
              </div>

              {onUpdateBOQItems && (
                <button
                  type="button"
                  onClick={() => handleSyncSingleToBOQ(activeFormulaItem)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1 shadow-sm"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Sync to BOQ</span>
                </button>
              )}
            </div>
          </div>

          {/* Floor Breakdown Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 px-3 font-bold w-12 text-center">CODE</th>
                  <th className="py-2.5 px-4 font-bold">BUILDING LEVEL</th>
                  <th className="py-2.5 px-4 font-bold text-right">FLOOR AREA</th>
                  <th className="py-2.5 px-4 font-bold text-right">SHARE %</th>
                  <th className="py-2.5 px-4 font-bold text-right">EST. QUANTITY</th>
                  <th className="py-2.5 px-4 font-bold text-right">EST. BUDGET</th>
                  <th className="py-2.5 px-4 font-bold text-right">CONNECTED BOQ QTY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {floorBreakdown.map((row) => {
                  const matchedBOQItem = formulaBOQMatches[activeFormulaItem.id]?.matchedItem;
                  const boqFloorQty = matchedBOQItem?.floorBreakdown?.[row.floorId] ?? null;

                  return (
                    <tr key={row.floorId} className="hover:bg-slate-900/50 transition">
                      <td className="py-2.5 px-3 text-center font-bold text-amber-400">
                        {row.floorCode}
                      </td>
                      <td className="py-2.5 px-4 text-white font-medium">
                        {row.floorName}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-300 font-mono">
                        {row.floorAreaSqFt.toLocaleString()} sq.ft
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-amber-400">
                        {row.percentage}%
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-white font-mono">
                        {row.quantity.toLocaleString()} {row.unit}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-300">
                        {formatCurrency(row.cost, currency)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono">
                        {boqFloorQty !== null ? (
                          <span className="text-emerald-400 font-bold">
                            {boqFloorQty.toLocaleString()} {matchedBOQItem?.unit}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">Not set</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900/90 border-t border-slate-700 font-bold text-xs">
                  <td colSpan={2} className="py-3 px-4 text-white">
                    TOTAL ALL LEVELS
                  </td>
                  <td className="py-3 px-4 text-right text-white font-mono">
                    {effectiveFloors.reduce((sum, f) => sum + f.areaSqFt, 0).toLocaleString()} sq.ft
                  </td>
                  <td className="py-3 px-4 text-right text-amber-400 font-mono">
                    100%
                  </td>
                  <td className="py-3 px-4 text-right text-amber-400 font-mono text-sm">
                    {activeFormulaItem.calculateQuantity(params).toLocaleString()} {activeFormulaItem.unit}
                  </td>
                  <td className="py-3 px-4 text-right text-amber-300 font-mono">
                    {formatCurrency(activeFormulaItem.calculateCost(params), currency)}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400 font-mono">
                    {formulaBOQMatches[activeFormulaItem.id]?.matchedItem ? 'Schedule Linked' : 'Unlinked'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: QUANTITIES (BOQ) RECONCILIATION BRIDGE                             */}
      {/* ========================================================================= */}
      {activeTab === 'reconciliation' && (
        <div className="p-4 space-y-4 font-mono text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-amber-400" />
                <span>Area Takeoff &amp; BOQ Quantities Reconciliation Bridge</span>
              </h4>
              <p className="text-slate-400 text-xs mt-0.5">
                Comparison of empirical formula quantities against current line items in the BOQ Schedule. Push quantities to reconcile variances.
              </p>
            </div>

            {onUpdateBOQItems && (
              <button
                type="button"
                onClick={handleSyncAllToBOQ}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Reconcile &amp; Sync All to BOQ</span>
              </button>
            )}
          </div>

          {/* Reconciliation Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3 font-bold w-10 text-center">#</th>
                  <th className="py-3 px-3 font-bold">MATERIAL / TRADE</th>
                  <th className="py-3 px-3 font-bold">QUICK NORM</th>
                  <th className="py-3 px-3 font-bold text-right">MATRIX QUANTITY</th>
                  <th className="py-3 px-3 font-bold">MATCHED BOQ ITEM</th>
                  <th className="py-3 px-3 font-bold text-right">BOQ QUANTITY</th>
                  <th className="py-3 px-3 font-bold text-center">VARIANCE</th>
                  <th className="py-3 px-3 font-bold text-center">RECONCILE ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {CIVIL_WISDOM_FORMULAS.map((formula, idx) => {
                  const qty = formula.calculateQuantity(params);
                  const boqMatch = formulaBOQMatches[formula.id];

                  return (
                    <tr key={formula.id} className="hover:bg-slate-900/50 transition">
                      <td className="py-2.5 px-3 text-center text-slate-500 font-bold">
                        {idx + 1}
                      </td>

                      <td className="py-2.5 px-3 font-bold text-white">
                        <div className="flex items-center gap-1.5">
                          <span>{renderItemIcon(formula.iconType)}</span>
                          <span className="text-amber-400">{formula.item}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-amber-300">
                          {formula.quickFormula}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-right font-bold text-white font-mono">
                        {qty.toLocaleString()} {formula.unit}
                      </td>

                      <td className="py-2.5 px-3 text-slate-300">
                        {boqMatch.matchedItem ? (
                          <div>
                            <span className="font-medium text-white block truncate max-w-[200px]" title={boqMatch.matchedItem.name}>
                              {boqMatch.matchedItem.name}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              ID: {boqMatch.matchedItem.id} • {boqMatch.matchedItem.category}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">No existing line item</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono">
                        {boqMatch.matchedItem ? (
                          <span className="font-bold text-white">
                            {boqMatch.matchedItem.quantity.toLocaleString()} {boqMatch.matchedItem.unit}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-center font-mono">
                        {boqMatch.matchedItem ? (
                          boqMatch.status === 'matched' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                              <Check className="w-3 h-3" />
                              <span>Synced</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                              <span>{boqMatch.statusLabel}</span>
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                            Unmatched
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        {onUpdateBOQItems && (
                          <button
                            type="button"
                            onClick={() => handleSyncSingleToBOQ(formula)}
                            className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition inline-flex items-center gap-1 shadow-sm"
                            title="Push matrix quantity to BOQ"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>{boqMatch.matchedItem ? 'Sync Qty' : 'Add to BOQ'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bottom Note banner matching the exact lightbulb note from Civil Wisdom */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 text-xs font-mono space-y-2">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-amber-500/30 flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0 mt-0.5">
            <Lightbulb className="w-4 h-4 text-amber-400" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">
                NOTE FROM CIVIL WISDOM &amp; REFERENCE GUIDE
              </h4>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Connected to Area Takeoff &amp; BOQ Quantities
              </span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              These formulas provide rapid, reliable empirical estimates for preliminary planning and budget reconciliation. The matrix includes all 14 baseline consumption norms, the complete M20 Roof Slab concrete &amp; steel conversion breakdown (1:1.5:3 with 1.54 dry factor and 1% steel rule), plus current GBA Building Regulations (21m high-rise threshold, 10% void cap, 2m basement setback, 3.5m–4.5m clear height, and small plot OC exemptions). All material quantities can be synchronized into your BOQ schedule with one click.
            </p>
          </div>
        </div>

        {/* Quick summary strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-slate-400">
          <div className="p-2 rounded bg-slate-900 border border-slate-800">
            <span className="block text-[10px] text-slate-500">Cement Baseline / M20 Slab:</span>
            <strong className="text-white">{(params.areaSqFt * 0.4).toLocaleString()} Bags / {roofSlabResult.cementBags} Bags</strong>
          </div>
          <div className="p-2 rounded bg-slate-900 border border-slate-800">
            <span className="block text-[10px] text-slate-500">Steel Baseline / M20 Slab:</span>
            <strong className="text-white">{((params.areaSqFt * 4.0) / 1000).toFixed(2)} MT / {roofSlabResult.steelTonnesAvg} MT</strong>
          </div>
          <div className="p-2 rounded bg-slate-900 border border-slate-800">
            <span className="block text-[10px] text-slate-500">Sand Baseline / M20 Slab:</span>
            <strong className="text-white">{(params.areaSqFt * 1.8).toLocaleString()} CFT / {roofSlabResult.sandCFT.toLocaleString()} CFT</strong>
          </div>
          <div className="p-2 rounded bg-slate-900 border border-slate-800">
            <span className="block text-[10px] text-slate-500">Coarse Agg / M20 Slab:</span>
            <strong className="text-white">{(params.areaSqFt * 1.5).toLocaleString()} CFT / {roofSlabResult.coarseAggCFT.toLocaleString()} CFT</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
