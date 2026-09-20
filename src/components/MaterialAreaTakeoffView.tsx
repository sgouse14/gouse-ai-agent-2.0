import React, { useState, useMemo, useEffect } from 'react';
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
  ArrowRight,
  RefreshCw,
  Boxes,
  ShieldCheck,
  Filter,
  Layers,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Table,
  LayoutGrid,
  CheckCircle2,
  Calendar,
  Compass,
  Edit3,
  SlidersHorizontal,
  RotateCcw,
  Settings,
  Plus,
  Minus,
  BookOpen,
  Coins,
  FileSpreadsheet,
  FileDown,
} from 'lucide-react';
import { Project, BOQItem, BuildingFloor, FloorWiseTotal } from '../types';
import { formatCurrency, CurrencyCode } from '../utils/formatters';
import { exportMaterialTakeoffToExcel } from '../utils/excelExport';
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
  DEFAULT_BUILDING_FLOORS,
  MaterialTakeoffFloorTotal,
  MaterialNormOverride,
  updateFloorArea,
} from '../utils/materialTakeoffEngine';
import { BuildingFloorManagerModal } from './BuildingFloorManagerModal';
import { ConstructionMaterialsMasterGuideModal } from './ConstructionMaterialsMasterGuideModal';
import { FloorWisePrintReportModal } from './FloorWisePrintReportModal';
import { calculateFloorWiseTotals } from '../utils/floorTakeoffEngine';
import {
  MaterialGuideBrand,
  MaterialGuideSection,
  getBrandSpotRate,
} from '../data/constructionMaterialsGuide';
import { CivilWisdomFormulaMatrix } from './CivilWisdomFormulaMatrix';
import { getCivilWisdomMaterialOverrides } from '../data/civilWisdomFormulas';

// Quick formula rule of thumb badges matching Civil Wisdom standard
const getCivilWisdomFormulaBadge = (normId: string): string | null => {
  switch (normId) {
    case 'norm-cement':
      return 'Area × 0.4 Bags';
    case 'norm-steel':
      return 'Area × 4 KG (0.004 MT)';
    case 'norm-clay-bricks':
      return 'Area × 8 Bricks';
    case 'norm-sand':
      return 'Area × 1.8 CFT (0.09 MT)';
    case 'norm-aggregates':
      return 'Area × 1.5 CFT (0.075 MT)';
    case 'norm-rmc':
      return 'Bags ÷ 8 (m³)';
    case 'norm-interior-paint':
      return 'Wall Area ÷ 140 L';
    case 'norm-vitrified-tiles':
      return 'Area ÷ Tile Area (+10%)';
    case 'norm-plumbing-pipes':
      return 'Area × Plumbing Rate';
    case 'norm-electrical-conduits':
      return 'Area × Electrical Rate';
    default:
      return null;
  }
};

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

  // Floor-Wise Material Standards Navigation & Views
  const [selectedFloorId, setSelectedFloorId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'matrix' | 'cw-formulas'>('table');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [isFloorModalOpen, setIsFloorModalOpen] = useState<boolean>(false);
  const [isFloorReportModalOpen, setIsFloorReportModalOpen] = useState<boolean>(false);

  // Custom material standard overrides (normPerSqFt, standardWastagePercent, baseRate)
  const [normOverrides, setNormOverrides] = useState<Record<string, MaterialNormOverride>>(() => {
    try {
      const saved = localStorage.getItem(`material_norms_${activeProject.id}`);
      if (saved) return JSON.parse(saved);
    } catch (_e) {}
    return {};
  });

  // Apply Civil Wisdom empirical formulas (0.4 bags cement, 4kg steel, 8 bricks, 1.8 CFT sand, 1.5 CFT aggregate)
  const handleApplyCivilWisdomNorms = () => {
    const cwOverrides = getCivilWisdomMaterialOverrides();
    setNormOverrides((prev) => {
      const next = { ...prev, ...cwOverrides };
      try {
        localStorage.setItem(`material_norms_${activeProject.id}`, JSON.stringify(next));
      } catch (_e) {}
      return next;
    });
    setSyncFeedback('Civil Wisdom Quick Formulas applied to all material standards!');
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  // Construction Materials Master Guide modal state
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);
  const [guideTargetNormId, setGuideTargetNormId] = useState<string | undefined>(undefined);
  const [guideTargetMaterialName, setGuideTargetMaterialName] = useState<string | undefined>(undefined);
  const [guideSelectedBrandName, setGuideSelectedBrandName] = useState<string | undefined>(undefined);

  // Persist custom standards
  useEffect(() => {
    try {
      localStorage.setItem(`material_norms_${activeProject.id}`, JSON.stringify(normOverrides));
    } catch (_e) {}
  }, [normOverrides, activeProject.id]);

  // Keep local area in sync if project changes
  useEffect(() => {
    if (activeProject.builtUpAreaSqFt && activeProject.builtUpAreaSqFt > 0) {
      setAreaSqFt(activeProject.builtUpAreaSqFt);
    }
  }, [activeProject.id, activeProject.builtUpAreaSqFt]);

  // Compute live material takeoff report with floor-wise distribution & custom standards
  const takeoffReport = useMemo(() => {
    return calculateMaterialTakeoffFromArea(
      areaSqFt,
      selectedRegion,
      selectedTier,
      selectedBasis,
      activeProject.floors,
      normOverrides
    );
  }, [areaSqFt, selectedRegion, selectedTier, selectedBasis, activeProject.floors, normOverrides]);

  // Available floors from report
  const buildingFloors = takeoffReport.floors;

  // Compute floor-wise totals for official schedule of rates report
  const floorTotals: FloorWiseTotal[] = useMemo(() => {
    return calculateFloorWiseTotals(boqItems, buildingFloors).floorTotals;
  }, [boqItems, buildingFloors]);

  // Selected floor total if filtered to a specific floor
  const activeFloorTotal: MaterialTakeoffFloorTotal | undefined = useMemo(() => {
    if (selectedFloorId === 'all') return undefined;
    return takeoffReport.floorTotals.find((ft) => ft.floorId === selectedFloorId);
  }, [takeoffReport.floorTotals, selectedFloorId]);

  // Handle area change from main slider or input
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

  // Handle single floor area modification directly (floor-wise area editing)
  const handleUpdateFloorArea = (floorId: string, newAreaSqFt: number) => {
    const currentFloors =
      activeProject.floors && activeProject.floors.length > 0
        ? activeProject.floors
        : buildingFloors;

    const updated = updateFloorArea(currentFloors, floorId, newAreaSqFt);
    const newTotalArea = updated.reduce((sum, f) => sum + (Number(f.areaSqFt) || 0), 0);
    setAreaSqFt(newTotalArea);

    if (onUpdateProject) {
      onUpdateProject({
        ...activeProject,
        floors: updated,
        builtUpAreaSqFt: newTotalArea,
      });
    }
  };

  // Handle updating a material standard norm override
  const handleUpdateNormOverride = (normId: string, override: Partial<MaterialNormOverride>) => {
    setNormOverrides((prev) => ({
      ...prev,
      [normId]: {
        ...(prev[normId] || {}),
        ...override,
      },
    }));
  };

  // Reset a specific material standard to IS code baseline
  const handleResetNorm = (normId: string) => {
    setNormOverrides((prev) => {
      const next = { ...prev };
      delete next[normId];
      return next;
    });
  };

  // Reset all customized standards to baseline
  const handleResetAllNorms = () => {
    setNormOverrides({});
  };

  // Handle selecting a brand from Construction Materials Master Guide
  const handleSelectBrandFromGuide = (brand: MaterialGuideBrand, section: MaterialGuideSection) => {
    const targetNormId = guideTargetNormId || section.applicableNormIds[0];
    if (targetNormId) {
      handleUpdateNormOverride(targetNormId, {
        selectedBrand: brand.brandName,
        selectedBrandCategory: brand.category,
        spotPrice: brand.spotPrice,
        baseRate: brand.spotPrice,
      });
      setSyncFeedback(
        `✓ Assigned ${brand.brandName} [${brand.category}] with Live Spot Price ₹${brand.spotPrice.toLocaleString()} / ${brand.unit} to ${guideTargetMaterialName || 'material standards'}!`
      );
      setTimeout(() => setSyncFeedback(null), 4500);
    }
    setIsGuideModalOpen(false);
  };

  // 1-Click Sync all assigned brands' live spot prices to material standards
  const handleSyncAllBrandSpotPrices = () => {
    let syncedCount = 0;
    const nextOverrides = { ...normOverrides };

    takeoffReport.items.forEach((item) => {
      const brand = item.selectedBrand || item.norm.brands?.[0];
      const spot = getBrandSpotRate(brand);
      if (spot) {
        nextOverrides[item.norm.id] = {
          ...(nextOverrides[item.norm.id] || {}),
          selectedBrand: brand,
          selectedBrandCategory: spot.category,
          spotPrice: spot.spotPrice,
          baseRate: spot.spotPrice,
        };
        syncedCount++;
      }
    });

    setNormOverrides(nextOverrides);
    setSyncFeedback(
      `✓ Successfully updated ${syncedCount} material standards with live spot prices for all assigned brands!`
    );
    setTimeout(() => setSyncFeedback(null), 5000);
  };

  // Handle saving floors from modal
  const handleSaveFloors = (newFloors: BuildingFloor[]) => {
    const totalArea = newFloors.reduce((sum, f) => sum + (Number(f.areaSqFt) || 0), 0);
    setAreaSqFt(totalArea);
    if (onUpdateProject) {
      onUpdateProject({
        ...activeProject,
        floors: newFloors,
        builtUpAreaSqFt: totalArea,
      });
    }
    setIsFloorModalOpen(false);
  };

  // 1-Click Sync all area quantities & market rates to BOQ Schedule with floor breakdowns
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
        floors: buildingFloors,
      }
    );

    onUpdateBOQItems(updatedItems);
    if (onUpdateProject) {
      onUpdateProject({
        ...activeProject,
        floors: buildingFloors,
        builtUpAreaSqFt: areaSqFt,
      });
    }

    setSyncFeedback(
      `✓ Successfully updated ${report.quantitiesUpdatedCount} BOQ quantities for ${areaSqFt.toLocaleString()} sq.ft across ${takeoffReport.floors.length} floor levels, calibrated ${report.ratesUpdatedCount} items to ${report.region.shortName} live market rates!`
    );
    setTimeout(() => setSyncFeedback(null), 5000);
  };

  // Export takeoff report to Microsoft Excel (.xlsx) workbook with multi-sheet structure
  const handleExportExcel = () => {
    exportMaterialTakeoffToExcel({
      report: takeoffReport,
      floors: buildingFloors,
      projectName: activeProject.name,
      currency,
    });
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

  const filteredItems = useMemo(() => {
    let list = takeoffReport.items;

    // Filter by Category
    if (filterCategory !== 'all') {
      list = list.filter((i) => i.norm.category === filterCategory);
    }

    // Filter by Floor if specific floor selected
    if (selectedFloorId !== 'all') {
      list = list.filter((i) => {
        const bd = i.floorBreakdown[selectedFloorId];
        return bd && bd.roundedQuantity > 0;
      });
    }

    return list;
  }, [takeoffReport.items, filterCategory, selectedFloorId]);

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
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                Floor-Wise Material Standards Engine
              </span>
              <span className="text-xs font-mono text-slate-400">
                IS 456 / CPWD Norms Grounded
              </span>
              <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {buildingFloors.length} Building Levels Configured
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
              <span>Floor-Wise Material Standards & Takeoff</span>
              <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                Live Calibration
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Material norms are distributed floor-wise based on architectural purpose: Foundation/Substructure, Ground Floor, Upper Levels, and Terrace & Roof.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="btn-materials-master-guide"
              type="button"
              onClick={() => {
                setGuideTargetNormId(undefined);
                setGuideTargetMaterialName(undefined);
                setGuideSelectedBrandName(undefined);
                setIsGuideModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold transition shadow-sm"
              title="Open the full Construction Materials Master Guide with National & Regional Brand specifications and IS code references"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Master Materials Guide</span>
            </button>

            <button
              id="btn-manage-building-floors"
              onClick={() => setIsFloorModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold transition shadow-sm"
              title="Configure project floor levels, heights, and square footage"
            >
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Manage Floors ({buildingFloors.length})</span>
            </button>

            <button
              id="btn-sync-takeoff-to-boq"
              onClick={handleSyncAllToBOQ}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm"
              title="Automatically update all line items in the project's BOQ Schedule with floor-wise quantities and market prices"
            >
              <Zap className="w-4 h-4" />
              <span>Sync Takeoff to Project BOQ</span>
            </button>

            <button
              id="btn-export-takeoff-excel"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-mono border border-emerald-500/40 transition shadow-sm font-semibold"
              title="Export complete floor-wise material takeoff & quantities to Microsoft Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export Excel (.xlsx)</span>
            </button>

            <button
              id="btn-takeoff-floor-report"
              type="button"
              onClick={() => setIsFloorReportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs border border-rose-500/40 transition shadow-sm font-semibold"
              title="Open, print, or convert the Floor-Wise Schedule of Rates to PDF"
            >
              <FileDown className="w-3.5 h-3.5 text-rose-400" />
              <span>Floor Report & PDF</span>
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
                <span>Total Built-up Area</span>
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

      {/* ========================================================================= */}
      {/* FLOOR NAVIGATION BAR (FLOOR SELECTOR TABS & AREA CALIBRATION)             */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Layers className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Floor-Wise Standards & Area Allocation
            </span>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              {buildingFloors.length} levels • {areaSqFt.toLocaleString()} sq.ft
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle: Table | Matrix | Quick Formulas */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition flex items-center gap-1.5 ${
                  viewMode === 'table'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
              <button
                onClick={() => setViewMode('matrix')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition flex items-center gap-1.5 ${
                  viewMode === 'matrix'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Floor Matrix</span>
              </button>
              <button
                id="btn-cw-quick-formula-tab"
                onClick={() => setViewMode('cw-formulas')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition flex items-center gap-1.5 ${
                  viewMode === 'cw-formulas'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="View Civil Wisdom Construction Quick Estimation Formulas Matrix"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Quick Formulas</span>
              </button>
            </div>
          </div>
        </div>

        {/* Floor selector tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedFloorId('all')}
            className={`px-4 py-2 rounded-xl text-xs font-mono whitespace-nowrap transition border flex items-center gap-2 ${
              selectedFloorId === 'all'
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>All Floors (Consolidated)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 font-bold">
              {areaSqFt.toLocaleString()} sq.ft
            </span>
          </button>

          {buildingFloors.map((floor) => {
            const floorStat = takeoffReport.floorTotals.find((ft) => ft.floorId === floor.id);
            const isSelected = selectedFloorId === floor.id;

            return (
              <button
                key={floor.id}
                onClick={() => setSelectedFloorId(floor.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono whitespace-nowrap transition border flex items-center gap-2 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  isSelected ? 'bg-black/25 text-slate-950' : 'bg-slate-800 text-amber-300'
                }`}>
                  {floor.shortCode}
                </span>
                <span>{floor.name}</span>
                <span className={`text-[10px] ${isSelected ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                  {floor.areaSqFt.toLocaleString()} sq.ft
                </span>
                {floorStat && (
                  <span className={`text-[10px] font-bold ${isSelected ? 'text-slate-950' : 'text-amber-400'}`}>
                    ({floorStat.percentOfTotal}%)
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Floor Highlight Banner (if single floor active) */}
      {activeFloorTotal && (
        <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-4 bg-gradient-to-r from-amber-500/10 via-slate-900 to-transparent flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {activeFloorTotal.shortCode} • Level {activeFloorTotal.levelIndex}
              </span>
              <span className="text-xs font-mono text-slate-300">
                Elevation: {activeFloorTotal.elevation}
              </span>
              <span className="text-xs font-mono text-amber-400 font-bold">
                {activeFloorTotal.percentOfTotal}% of Total Material Budget
              </span>
            </div>
            <h4 className="text-lg font-bold text-white">
              {activeFloorTotal.floorName} Standards & Material Allocation
            </h4>
            <p className="text-xs text-slate-400">
              Allocated Floor Area: <strong className="text-white">{activeFloorTotal.areaSqFt.toLocaleString()} sq.ft</strong> ({Math.round((activeFloorTotal.areaSqFt / areaSqFt) * 100)}% of building footprint). All material standards scale automatically to this slab area.
            </p>

            {/* Quick Floor Area Live Slider & Stepper */}
            <div className="flex items-center gap-3 pt-1 font-mono text-xs max-w-lg">
              <span className="text-slate-400 text-[11px] whitespace-nowrap">Edit Floor Area:</span>
              <button
                type="button"
                onClick={() => handleUpdateFloorArea(activeFloorTotal.floorId, Math.max(50, activeFloorTotal.areaSqFt - 100))}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
              >
                -100
              </button>
              <input
                type="range"
                min={100}
                max={5000}
                step={50}
                value={activeFloorTotal.areaSqFt}
                onChange={(e) => handleUpdateFloorArea(activeFloorTotal.floorId, Number(e.target.value))}
                className="w-36 accent-amber-500 cursor-pointer"
              />
              <button
                type="button"
                onClick={() => handleUpdateFloorArea(activeFloorTotal.floorId, activeFloorTotal.areaSqFt + 100)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
              >
                +100
              </button>
              <span className="font-bold text-amber-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {activeFloorTotal.areaSqFt.toLocaleString()} sq.ft
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0 font-mono">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Floor Material Cost</span>
              <span className="text-lg font-bold text-amber-300">
                {formatCurrency(activeFloorTotal.subtotal, currency)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                ₹{activeFloorTotal.costPerSqFt}/sq.ft
              </span>
            </div>

            <button
              onClick={() => setSelectedFloorId('all')}
              className="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
            >
              Reset to All Floors
            </button>
          </div>
        </div>
      )}

      {/* High-Level Material Volume Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 font-mono">
        <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-3.5 bg-gradient-to-b from-amber-500/10 to-transparent">
          <span className="block text-[11px] text-amber-300 uppercase tracking-wider font-bold">
            {activeFloorTotal ? `${activeFloorTotal.shortCode} Cost` : 'Total Material Cost'}
          </span>
          <span className="text-lg font-bold text-white">
            {formatCurrency(activeFloorTotal ? activeFloorTotal.subtotal : takeoffReport.totalMaterialCost, currency)}
          </span>
          <span className="block text-[10px] text-slate-400 mt-0.5">
            ₹{activeFloorTotal ? activeFloorTotal.costPerSqFt : takeoffReport.materialCostPerSqFt} / sq.ft
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="block text-[11px] text-slate-400 uppercase tracking-wider">
            OPC Cement
          </span>
          <span className="text-lg font-bold text-amber-300">
            {activeFloorTotal
              ? activeFloorTotal.keyVolumes.cementBags.toLocaleString()
              : takeoffReport.keyMaterialVolumes.cementBags.toLocaleString()}{' '}
            bags
          </span>
          <span className="block text-[10px] text-slate-500 mt-0.5">
            {activeFloorTotal ? `${activeFloorTotal.shortCode} allocation` : '0.42 bags / sq.ft'}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="block text-[11px] text-slate-400 uppercase tracking-wider">
            TMT Steel Rebar
          </span>
          <span className="text-lg font-bold text-amber-300">
            {activeFloorTotal
              ? activeFloorTotal.keyVolumes.steelMetricTonnes
              : takeoffReport.keyMaterialVolumes.steelMetricTonnes}{' '}
            MT
          </span>
          <span className="block text-[10px] text-slate-500 mt-0.5">
            {activeFloorTotal ? `${activeFloorTotal.shortCode} reinforcement` : '3.80 kg / sq.ft'}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="block text-[11px] text-slate-400 uppercase tracking-wider">
            Concrete Volume
          </span>
          <span className="text-lg font-bold text-amber-300">
            {activeFloorTotal
              ? activeFloorTotal.keyVolumes.concreteM3
              : takeoffReport.keyMaterialVolumes.concreteM3}{' '}
            m³
          </span>
          <span className="block text-[10px] text-slate-500 mt-0.5">
            {activeFloorTotal ? `${activeFloorTotal.shortCode} pour volume` : '0.035 m³ / sq.ft'}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="block text-[11px] text-slate-400 uppercase tracking-wider">
            Vitrified Tiles
          </span>
          <span className="text-lg font-bold text-amber-300">
            {activeFloorTotal
              ? activeFloorTotal.keyVolumes.tilesSqFt.toLocaleString()
              : takeoffReport.keyMaterialVolumes.tilesSqFt.toLocaleString()}{' '}
            sq.ft
          </span>
          <span className="block text-[10px] text-slate-500 mt-0.5">
            {activeFloorTotal ? `${activeFloorTotal.shortCode} floor finishes` : '1.22 sq.ft / sq.ft'}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="block text-[11px] text-slate-400 uppercase tracking-wider">
            Wall Care Putty
          </span>
          <span className="text-lg font-bold text-amber-300">
            {activeFloorTotal
              ? activeFloorTotal.keyVolumes.puttyBags.toLocaleString()
              : (takeoffReport.keyMaterialVolumes.puttyBags || Math.round(takeoffReport.areaSqFt * 0.003 * 1.05)).toLocaleString()}{' '}
            bags
          </span>
          <span className="block text-[10px] text-slate-500 mt-0.5">
            {activeFloorTotal ? `${activeFloorTotal.shortCode} wall prep` : '40kg / 2 coats'}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="block text-[11px] text-slate-400 uppercase tracking-wider">
            Coatings & Paints
          </span>
          <span className="text-lg font-bold text-amber-300">
            {activeFloorTotal
              ? activeFloorTotal.keyVolumes.paintLiters.toLocaleString()
              : takeoffReport.keyMaterialVolumes.paintLiters.toLocaleString()}{' '}
            L
          </span>
          <span className="block text-[10px] text-slate-500 mt-0.5">
            {activeFloorTotal ? `${activeFloorTotal.shortCode} wall & ceiling` : 'Emulsion + Primer + Enamel'}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW MODE 2: FLOOR CROSS-MATRIX (SPREADSHEET MULTI-LEVEL COMPARISON)      */}
      {/* ========================================================================= */}
      {viewMode === 'matrix' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm space-y-0">
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
            <div>
              <span className="font-bold text-white block">
                Floor-Wise Material Standards Cross-Matrix
              </span>
              <span className="text-[11px] text-slate-400">
                Comparing engineering quantities and costs across all {buildingFloors.length} building levels
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">Total Built-up:</span>
              <span className="font-bold text-amber-300">{areaSqFt.toLocaleString()} sq.ft</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="p-3 sticky left-0 bg-slate-950 z-10 min-w-[220px]">
                    Material & Standard Norm
                  </th>
                  <th className="p-3 text-center min-w-[80px]">Unit</th>
                  <th className="p-3 text-right min-w-[100px] bg-slate-900/50">
                    Consolidated Total
                  </th>
                  {buildingFloors.map((floor) => (
                    <th key={floor.id} className="p-3 text-right min-w-[155px]">
                      <div className="font-bold text-slate-200">{floor.shortCode} • {floor.name}</div>
                      <div className="mt-1 flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateFloorArea(floor.id, Math.max(50, (floor.areaSqFt || 0) - 100))}
                          className="p-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                          title="Decrease 100 sq.ft"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <input
                          type="number"
                          min={50}
                          step={50}
                          value={floor.areaSqFt}
                          onChange={(e) => {
                            const val = Math.max(50, Number(e.target.value) || 0);
                            handleUpdateFloorArea(floor.id, val);
                          }}
                          className="w-14 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-[10px] text-right font-bold text-white focus:outline-none focus:border-amber-400"
                        />
                        <span className="text-[10px] text-slate-400">sq.ft</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateFloorArea(floor.id, (floor.areaSqFt || 0) + 100)}
                          className="p-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                          title="Increase 100 sq.ft"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                        {floor.elevation} • {areaSqFt > 0 ? Math.round(((floor.areaSqFt || 0) / areaSqFt) * 100) : 0}%
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {takeoffReport.items.map((item) => (
                  <tr key={item.norm.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 sticky left-0 bg-slate-900 z-10">
                      <div className="font-bold text-white">{item.norm.name}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                          {item.norm.category}
                        </span>
                        <span>{item.norm.isCodeRef}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center text-slate-400">
                      {item.unit}
                    </td>
                    <td className="p-3 text-right bg-slate-900/50">
                      <div className="font-bold text-amber-300">
                        {item.roundedQuantity.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {formatCurrency(item.totalCost, currency)}
                      </div>
                    </td>
                    {buildingFloors.map((floor) => {
                      const breakdown = item.floorBreakdown[floor.id];
                      const qty = breakdown ? breakdown.roundedQuantity : 0;
                      const cost = breakdown ? breakdown.cost : 0;
                      const fractionPct = breakdown ? Math.round(breakdown.fraction * 100) : 0;

                      return (
                        <td key={floor.id} className="p-3 text-right">
                          {qty > 0 ? (
                            <div>
                              <div className="font-bold text-white">
                                {qty.toLocaleString()} <span className="text-[10px] text-slate-400">{item.unit}</span>
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {formatCurrency(cost, currency)}
                                <span className="text-amber-400 ml-1">({fractionPct}%)</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-600 text-[11px]">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-950 font-bold border-t-2 border-slate-800 text-xs">
                <tr>
                  <td className="p-3 sticky left-0 bg-slate-950 z-10 text-amber-300">
                    Floor Subtotal Cost
                  </td>
                  <td className="p-3 text-center text-slate-500">—</td>
                  <td className="p-3 text-right text-amber-300 bg-slate-900/50">
                    {formatCurrency(takeoffReport.totalMaterialCost, currency)}
                    <div className="text-[10px] text-slate-400 font-normal">
                      ₹{takeoffReport.materialCostPerSqFt}/sq.ft
                    </div>
                  </td>
                  {takeoffReport.floorTotals.map((ft) => (
                    <td key={ft.floorId} className="p-3 text-right text-white">
                      <div className="text-amber-300">{formatCurrency(ft.subtotal, currency)}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        ₹{ft.costPerSqFt}/sq.ft ({ft.percentOfTotal}%)
                      </div>
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE 3: DETAILED TABLE (ITEMIZED SCHEDULE)                           */}
      {/* ========================================================================= */}
      {viewMode === 'table' && (
        <div className="space-y-4">
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
                {cat === 'all' ? `All Materials (${filteredItems.length})` : cat}
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
                {selectedFloorId !== 'all' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Filtered to {activeFloorTotal?.floorName}
                  </span>
                )}
                {Object.keys(normOverrides).length > 0 && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {Object.keys(normOverrides).length} Custom Norms
                  </span>
                )}
              </div>

              <span className="text-[11px] text-slate-400">
                {selectedFloorId === 'all'
                  ? `Scaled for full building (${areaSqFt.toLocaleString()} sq.ft)`
                  : `Scaled for ${activeFloorTotal?.floorName} (${activeFloorTotal?.areaSqFt.toLocaleString()} sq.ft)`}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                  <tr>
                    <th className="p-3">Material & Standard</th>
                    <th className="p-3">Category / IS Code</th>
                    <th className="p-3">Engineering Norm & Applicable Floors</th>
                    <th className="p-3 text-right">
                      {selectedFloorId === 'all' ? 'Consolidated Quantity' : `${activeFloorTotal?.shortCode} Quantity`}
                    </th>
                    <th className="p-3 text-right">Market Rate</th>
                    <th className="p-3 text-right">
                      {selectedFloorId === 'all' ? 'Total Cost' : `${activeFloorTotal?.shortCode} Cost`}
                    </th>
                    <th className="p-3 text-right">Budget Share</th>
                    <th className="p-3">Floor Distribution Breakdown</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredItems.map((item) => {
                    const isExpanded = expandedItemId === item.norm.id;
                    const floorData = selectedFloorId !== 'all' ? item.floorBreakdown[selectedFloorId] : null;
                    const displayQty = floorData ? floorData.roundedQuantity : item.roundedQuantity;
                    const displayCost = floorData ? floorData.cost : item.totalCost;
                    const displayCostPerSqFt = floorData ? floorData.costPerSqFt : item.costPerSqFt;
                    const displayShare =
                      selectedFloorId !== 'all' && activeFloorTotal && activeFloorTotal.subtotal > 0
                        ? Math.round(((displayCost / activeFloorTotal.subtotal) * 100) * 10) / 10
                        : item.percentOfTotalMaterialBudget;

                    return (
                      <React.Fragment key={item.norm.id}>
                        <tr className="hover:bg-slate-800/40 transition">
                          <td className="p-3">
                            <div className="font-bold text-white flex items-center gap-1.5 flex-wrap">
                              <span>{item.norm.name}</span>
                              {item.isCustomized && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  Custom
                                </span>
                              )}
                            </div>

                            {/* Active Brand Badge & Master Guide Modal Trigger */}
                            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => {
                                  setGuideTargetNormId(item.norm.id);
                                  setGuideTargetMaterialName(item.norm.name);
                                  setGuideSelectedBrandName(item.selectedBrand || item.norm.brands?.[0]);
                                  setIsGuideModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 hover:border-amber-500/40 transition group"
                                title="Click to view full IS standards & pick brand from Master Guide"
                              >
                                <BookOpen className="w-3 h-3 text-amber-400 group-hover:scale-110 transition shrink-0" />
                                <span className="truncate max-w-[170px]">
                                  {item.selectedBrand || item.norm.brands?.[0] || 'Select Brand'}
                                </span>
                                <span
                                  className={`px-1 py-0.2 rounded text-[8px] font-bold shrink-0 ${
                                    item.selectedBrandCategory === 'Regional'
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : 'bg-blue-500/20 text-blue-300'
                                  }`}
                                >
                                  {item.selectedBrandCategory || 'National'}
                                </span>
                              </button>
                            </div>

                            {/* Live Spot Price Badge for Active Brand */}
                            {item.selectedBrandSpotPrice ? (
                              <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono">
                                <span className="text-amber-300 font-bold">
                                  Spot: ₹{item.selectedBrandSpotPrice.toLocaleString()}
                                </span>
                                <span className="text-slate-400">/{item.selectedBrandSpotUnit || item.unit}</span>
                                {item.selectedBrandSpotTrend && (
                                  <span
                                    className={`px-1 py-0.2 rounded text-[9px] font-bold flex items-center gap-0.5 ${
                                      item.selectedBrandSpotTrend === 'up'
                                        ? 'text-rose-400 bg-rose-500/10'
                                        : item.selectedBrandSpotTrend === 'down'
                                        ? 'text-emerald-400 bg-emerald-500/10'
                                        : 'text-slate-400 bg-slate-800'
                                    }`}
                                  >
                                    {item.selectedBrandSpotTrend === 'up' ? '▲' : item.selectedBrandSpotTrend === 'down' ? '▼' : '●'}
                                    {item.selectedBrandSpotChangePercent !== undefined
                                      ? ` ${item.selectedBrandSpotChangePercent > 0 ? '+' : ''}${item.selectedBrandSpotChangePercent}%`
                                      : ''}
                                  </span>
                                )}
                              </div>
                            ) : null}

                            <div className="text-[10px] text-slate-400 mt-1">
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
                            <span className="text-slate-300 text-[11px] block">
                              {item.norm.normDescription}
                            </span>
                            {getCivilWisdomFormulaBadge(item.norm.id) && (
                              <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                <span className="text-amber-400 font-bold">➔</span>
                                <span>{getCivilWisdomFormulaBadge(item.norm.id)}</span>
                              </div>
                            )}

                            {item.isCustomized && (
                              <div className="mt-1 flex items-center gap-1.5">
                                <span className="text-[10px] text-amber-300 font-mono">
                                  Override: {item.effectiveNormPerSqFt} {item.unit}/sq.ft (+{item.effectiveWastagePercent}% wast.)
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleResetNorm(item.norm.id)}
                                  className="text-slate-400 hover:text-white"
                                  title="Reset standard"
                                >
                                  <RotateCcw className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            )}

                            {/* Applicable Floors Badges */}
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(item.norm.applicableFloors || ['Substructure', 'GF', 'FF', 'SF', 'Terrace']).map((fl, idx) => (
                                <span
                                  key={idx}
                                  className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20"
                                >
                                  {fl}
                                </span>
                              ))}
                            </div>
                            {item.norm.floorNotes && (
                              <span className="text-[10px] text-slate-400 block mt-1 italic">
                                {item.norm.floorNotes}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <div className="text-sm font-bold text-amber-300">
                              {displayQty.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {item.unit}
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            <div>
                              <div className="font-bold text-white">
                                {formatCurrency(item.marketRate, currency)}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                per {item.unit}
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            <div className="text-sm font-bold text-white">
                              {formatCurrency(displayCost, currency)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              ₹{displayCostPerSqFt}/sq.ft
                            </div>
                          </td>
                          <td className="p-3 text-right font-bold text-amber-400">
                            {displayShare}%
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => setExpandedItemId(isExpanded ? null : item.norm.id)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                            >
                              <span>Floors Breakdown</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Floor Breakdown Drawer */}
                        {isExpanded && (
                          <tr className="bg-slate-950/80 border-y border-amber-500/30">
                            <td colSpan={8} className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Layers className="w-3.5 h-3.5" />
                                    <span>Floor-Wise Distribution: {item.norm.name}</span>
                                  </span>
                                  <span className="text-[11px] text-slate-400 font-mono">
                                    Total Consolidated: {item.roundedQuantity.toLocaleString()} {item.unit} • {formatCurrency(item.totalCost, currency)}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                                  {buildingFloors.map((fl) => {
                                    const bd = item.floorBreakdown[fl.id];
                                    const bdQty = bd ? bd.roundedQuantity : 0;
                                    const bdCost = bd ? bd.cost : 0;
                                    const fractionPct = bd ? Math.round(bd.fraction * 100) : 0;

                                    return (
                                      <div
                                        key={fl.id}
                                        className={`p-3 rounded-xl border text-xs font-mono space-y-1.5 ${
                                          bdQty > 0
                                            ? 'bg-slate-900 border-slate-700'
                                            : 'bg-slate-950 border-slate-900 opacity-50'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="font-bold text-amber-300">{fl.shortCode}</span>
                                          <span className="text-[10px] text-slate-400">{fractionPct}% share</span>
                                        </div>
                                        <div className="text-slate-300 font-semibold truncate">{fl.name}</div>
                                        <div className="text-sm font-bold text-white pt-0.5">
                                          {bdQty.toLocaleString()} {item.unit}
                                        </div>
                                        <div className="text-[11px] text-amber-400 font-semibold">
                                          {formatCurrency(bdCost, currency)}
                                        </div>
                                        <div className="text-[10px] text-slate-500">
                                          ₹{bd?.costPerSqFt ?? 0}/sq.ft
                                        </div>

                                        {/* Floor Slab Area Live Calibration inside breakdown */}
                                        <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between gap-1 text-[10px]">
                                          <span className="text-slate-400">Area:</span>
                                          <div className="flex items-center gap-1">
                                            <button
                                              type="button"
                                              onClick={() => handleUpdateFloorArea(fl.id, Math.max(50, fl.areaSqFt - 100))}
                                              className="p-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                                              title="Decrease 100 sq.ft"
                                            >
                                              <Minus className="w-2.5 h-2.5" />
                                            </button>
                                            <span className="font-bold text-white">{fl.areaSqFt} sq.ft</span>
                                            <button
                                              type="button"
                                              onClick={() => handleUpdateFloorArea(fl.id, fl.areaSqFt + 100)}
                                              className="p-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                                              title="Increase 100 sq.ft"
                                            >
                                              <Plus className="w-2.5 h-2.5" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE 4: CIVIL WISDOM QUICK ESTIMATION FORMULAS MATRIX                */}
      {/* ========================================================================= */}
      {viewMode === 'cw-formulas' && (
        <div className="space-y-4">
          <CivilWisdomFormulaMatrix
            initialAreaSqFt={areaSqFt}
            currency={currency}
            project={activeProject}
            buildingFloors={buildingFloors}
            boqItems={boqItems}
            onUpdateBOQItems={onUpdateBOQItems}
            onUpdateProject={onUpdateProject}
            onApplyToTakeoff={(overrides, newAreaSqFt) => {
              setNormOverrides((prev) => {
                const next = { ...prev, ...overrides };
                try {
                  localStorage.setItem(`material_norms_${activeProject.id}`, JSON.stringify(next));
                } catch (_e) {}
                return next;
              });
              if (newAreaSqFt && newAreaSqFt !== areaSqFt) {
                setAreaSqFt(newAreaSqFt);
                if (onUpdateProject) {
                  onUpdateProject({
                    ...activeProject,
                    builtUpAreaSqFt: newAreaSqFt,
                  });
                }
              }
              setSyncFeedback('Civil Wisdom Quick Formulas applied to material standards & floor takeoff!');
              setTimeout(() => setSyncFeedback(null), 4000);
            }}
            onNavigateToBOQ={onNavigateToBOQ}
            onNavigateToAreaTakeoff={() => setViewMode('table')}
          />
        </div>
      )}
      <BuildingFloorManagerModal
        isOpen={isFloorModalOpen}
        onClose={() => setIsFloorModalOpen(false)}
        floors={activeProject.floors && activeProject.floors.length > 0 ? activeProject.floors : buildingFloors}
        onSaveFloors={handleSaveFloors}
      />

      {/* Construction Materials Master Guide Modal */}
      <ConstructionMaterialsMasterGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        targetNormId={guideTargetNormId}
        targetMaterialName={guideTargetMaterialName}
        selectedBrandName={guideSelectedBrandName}
        onSelectBrand={handleSelectBrandFromGuide}
      />

      {/* Floor-Wise Schedule of Rates Print & PDF Report Modal */}
      <FloorWisePrintReportModal
        isOpen={isFloorReportModalOpen}
        onClose={() => setIsFloorReportModalOpen(false)}
        project={activeProject}
        items={boqItems}
        floors={buildingFloors}
        floorTotals={floorTotals}
        currency={currency}
        contingencyPercent={5}
      />
    </div>
  );
};
