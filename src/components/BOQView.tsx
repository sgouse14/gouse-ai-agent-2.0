import React, { useState, useMemo, useEffect } from 'react';
import {
  Calculator,
  Plus,
  Trash2,
  Sparkles,
  Download,
  Printer,
  Sliders,
  DollarSign,
  Layers,
  FileSpreadsheet,
  Check,
  AlertCircle,
  Building,
  TrendingUp,
  Gauge,
  Send,
  RefreshCw,
  Maximize2,
  SlidersHorizontal,
  ArrowUpRight,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Wrench,
  Info,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Zap,
  MapPin,
  Building2,
  TableProperties
} from 'lucide-react';
import { BOQItem, Project, MarketplaceEnquiry, BuildingFloor, FloorWiseTotal } from '../types';
import { formatCurrency, CurrencyCode } from '../utils/formatters';
import { FutureCostSimulator } from './FutureCostSimulator';
import { BOQDistributionAnalytics } from './BOQDistributionAnalytics';
import { getItemComponentFractions } from '../utils/boqDistribution';
import { MarketPriceAutoUpdateModal } from './MarketPriceAutoUpdateModal';
import { AreaTakeoffAutoUpdateModal } from './AreaTakeoffAutoUpdateModal';
import {
  MARKET_REGIONS,
  MarketRegion,
  MarketPricingBasis,
  MarketQualityTier,
  matchBOQItemToMarket,
  autoUpdateBOQItemsWithMarketRates,
  MarketUpdateReport
} from '../utils/marketPriceEngine';
import { FloorWiseSummaryCards } from './FloorWiseSummaryCards';
import { FloorWiseBOQMatrix } from './FloorWiseBOQMatrix';
import { LevelDetailedBOQTable } from './LevelDetailedBOQTable';
import { BuildingFloorManagerModal } from './BuildingFloorManagerModal';
import { FloorDistributionModal } from './FloorDistributionModal';
import { FloorWisePrintReportModal } from './FloorWisePrintReportModal';
import {
  DEFAULT_BUILDING_FLOORS,
  calculateFloorWiseTotals,
  updateItemFloorQuantity,
  copyFloorQuantitiesAcrossItems,
  generateFloorWiseCSV,
  ensureItemFloorBreakdown,
  distributeItemQuantityByFloorArea
} from '../utils/floorTakeoffEngine';
import { exportBOQToExcel, exportBOQToExcelCSV } from '../utils/excelExport';

export interface ItemAuditIssue {
  type: 'rate' | 'unit' | 'quantity';
  field: 'rate' | 'unit' | 'quantity';
  message: string;
  suggestedFix?: string;
}

export interface ItemAuditStatus {
  itemId: string;
  hasIssues: boolean;
  missingRate: boolean;
  mismatchedUnit: boolean;
  zeroQuantity: boolean;
  issues: ItemAuditIssue[];
  suggestedUnit?: string;
}

/**
 * Runs engineering & quantity surveying logic checks on a BOQ line item:
 * 1. Checks for missing or zero unit rates.
 * 2. Checks for missing or zero quantities.
 * 3. Checks for mismatched units based on construction industry standards
 *    (e.g., steel in m3 instead of MT, concrete casting in nos instead of m3,
 *     finishes/flooring in m3 instead of sq.m, linear skirting in m3, etc.).
 */
export const checkBOQItemAudit = (item: BOQItem): ItemAuditStatus => {
  const issues: ItemAuditIssue[] = [];
  const rateNum = Number(item.rate);
  const qtyNum = Number(item.quantity);

  // 1. Missing or zero unit rate
  const missingRate = item.rate === null || item.rate === undefined || isNaN(rateNum) || rateNum <= 0;
  if (missingRate) {
    issues.push({
      type: 'rate',
      field: 'rate',
      message: rateNum === 0 ? 'Missing unit rate: Rate is ₹0 (pricing required)' : 'Missing unit rate: Unspecified rate',
      suggestedFix: 'Enter a valid unit rate',
    });
  }

  // 2. Zero or negative quantity
  const zeroQuantity = item.quantity === null || item.quantity === undefined || isNaN(qtyNum) || qtyNum <= 0;
  if (zeroQuantity) {
    issues.push({
      type: 'quantity',
      field: 'quantity',
      message: 'Invalid quantity: Quantity must be greater than 0',
      suggestedFix: 'Enter a positive quantity',
    });
  }

  // 3. Mismatched unit check
  let mismatchedUnit = false;
  let suggestedUnit: string | undefined = undefined;

  const rawUnit = (item.unit || '').trim();
  const unit = rawUnit.toLowerCase();
  const name = (item.name || '').toLowerCase();
  const cat = (item.category || '').toLowerCase();

  if (!rawUnit) {
    mismatchedUnit = true;
    issues.push({
      type: 'unit',
      field: 'unit',
      message: 'Missing unit: Unit of measurement is blank',
      suggestedFix: 'Select an appropriate unit',
    });
  } else {
    // Check steel reinforcement / rebar / structural steel
    const isSteel = name.includes('steel') || name.includes('rebar') || name.includes('tmt') || name.includes('reinforcement');
    if (isSteel) {
      if (!['mt', 'kg', 'tonne', 'ton', 't'].includes(unit)) {
        mismatchedUnit = true;
        suggestedUnit = 'MT';
        issues.push({
          type: 'unit',
          field: 'unit',
          message: `Mismatched Unit: Reinforcement/structural steel measured in '${rawUnit}', expected MT or kg`,
          suggestedFix: 'Switch unit to MT',
        });
      }
    }
    // Check concrete casting / RCC / PCC (excluding steel and paver/tiles)
    else if (
      (name.includes('concrete') || name.includes('rcc') || name.includes('pcc') || name.includes('casting') || cat === 'concrete works') &&
      !name.includes('block') &&
      !name.includes('paver')
    ) {
      if (['nos', 'lump sum', 'r.m', 'kg', 'mt'].includes(unit)) {
        mismatchedUnit = true;
        suggestedUnit = 'm3';
        issues.push({
          type: 'unit',
          field: 'unit',
          message: `Mismatched Unit: Concrete casting measured in '${rawUnit}', expected volumetric m³`,
          suggestedFix: 'Switch unit to m3',
        });
      }
    }
    // Check bulk earthwork / excavation
    else if (name.includes('excavation') || name.includes('earthwork') || (cat === 'substructure' && name.includes('trench'))) {
      if (['nos', 'mt', 'kg', 'lump sum', 'r.m'].includes(unit)) {
        mismatchedUnit = true;
        suggestedUnit = 'm3';
        issues.push({
          type: 'unit',
          field: 'unit',
          message: `Mismatched Unit: Earthwork excavation measured in '${rawUnit}', expected volumetric m³`,
          suggestedFix: 'Switch unit to m3',
        });
      }
    }
    // Check finishes: plaster, paint, tile, marble, granite, flooring
    else if (
      cat === 'finishes' ||
      name.includes('plaster') ||
      name.includes('paint') ||
      name.includes('tiling') ||
      name.includes('flooring') ||
      name.includes('tile') ||
      name.includes('granite') ||
      name.includes('marble')
    ) {
      const isLinear = name.includes('skirting') || name.includes('border') || name.includes('cornice') || name.includes('coving');
      if (isLinear) {
        if (!['r.m', 'm', 'rmt'].includes(unit)) {
          mismatchedUnit = true;
          suggestedUnit = 'r.m';
          issues.push({
            type: 'unit',
            field: 'unit',
            message: `Mismatched Unit: Skirting/cornice linear finish measured in '${rawUnit}', expected r.m`,
            suggestedFix: 'Switch unit to r.m',
          });
        }
      } else {
        if (['m3', 'mt', 'kg', 'nos'].includes(unit)) {
          mismatchedUnit = true;
          suggestedUnit = 'sq.m';
          issues.push({
            type: 'unit',
            field: 'unit',
            message: `Mismatched Unit: Surface finishes measured in '${rawUnit}', expected area (sq.m or sq.ft)`,
            suggestedFix: 'Switch unit to sq.m',
          });
        }
      }
    }
    // Check masonry: brickwork, blockwork, AAC
    else if (cat === 'masonry' || name.includes('brick') || name.includes('block') || name.includes('masonry')) {
      if (['mt', 'kg', 'r.m'].includes(unit)) {
        mismatchedUnit = true;
        suggestedUnit = 'm3';
        issues.push({
          type: 'unit',
          field: 'unit',
          message: `Mismatched Unit: Masonry measured in '${rawUnit}', expected m³, sq.m, or nos`,
          suggestedFix: 'Switch unit to m3',
        });
      }
    }
    // Check doors & windows
    else if (cat === 'doors & windows' || name.includes('door') || name.includes('window') || name.includes('ventilator')) {
      if (['m3', 'mt', 'kg', 'r.m'].includes(unit)) {
        mismatchedUnit = true;
        suggestedUnit = 'nos';
        issues.push({
          type: 'unit',
          field: 'unit',
          message: `Mismatched Unit: Doors/windows measured in '${rawUnit}', expected nos or sq.m`,
          suggestedFix: 'Switch unit to nos',
        });
      }
    }
    // Check plumbing pipes / conduits / wiring
    else if (
      (cat === 'plumbing' || cat === 'mep & electrical') &&
      (name.includes('pipe') || name.includes('conduit') || name.includes('drainage') || name.includes('wiring'))
    ) {
      if (['m3', 'mt', 'sq.m', 'sq.ft'].includes(unit)) {
        mismatchedUnit = true;
        suggestedUnit = 'r.m';
        issues.push({
          type: 'unit',
          field: 'unit',
          message: `Mismatched Unit: Piping/conduits measured in '${rawUnit}', expected running meters (r.m)`,
          suggestedFix: 'Switch unit to r.m',
        });
      }
    }
  }

  return {
    itemId: item.id,
    hasIssues: issues.length > 0,
    missingRate,
    mismatchedUnit,
    zeroQuantity,
    issues,
    suggestedUnit,
  };
};

interface BOQViewProps {
  items: BOQItem[];
  contingencyPercent: number;
  currency: CurrencyCode;
  activeProject: Project;
  onUpdateItems: (items: BOQItem[]) => void;
  onChangeContingency: (val: number) => void;
  onUpdateProject?: (project: Project) => void;
  onAddEnquiry?: (enquiry: MarketplaceEnquiry) => void;
}

const CATEGORIES = [
  'Substructure',
  'Concrete Works',
  'Masonry',
  'Doors & Windows',
  'Finishes',
  'MEP & Electrical',
  'Plumbing',
  'Waterproofing',
  'External Works',
  'General',
];

const UNITS = ['m3', 'sq.m', 'r.m', 'MT', 'nos', 'kg', 'lump sum', 'sq.ft'];

// Industry-standard benchmark rates per sq.ft in Indian & regional construction markets
export interface MarketBenchmark {
  tier: string;
  minRate: number;
  maxRate: number;
  typicalRate: number;
  tag: string;
  description: string;
  features: string[];
  accentColor: string;
  badgeBg: string;
  badgeBorder: string;
}

export const MARKET_BENCHMARKS: MarketBenchmark[] = [
  {
    tier: 'Economy / Budget',
    minRate: 1400,
    maxRate: 1750,
    typicalRate: 1600,
    tag: 'Budget Construction',
    description: 'Cost-optimized construction with reliable basic building materials.',
    features: ['Red brick / Fly-ash masonry', '2x2 Standard vitrified tiles', '2-track UPVC / Aluminum windows', 'Standard PVC/GI plumbing'],
    accentColor: 'text-sky-400',
    badgeBg: 'bg-sky-500/10',
    badgeBorder: 'border-sky-500/30',
  },
  {
    tier: 'Standard / Quality',
    minRate: 1800,
    maxRate: 2450,
    typicalRate: 2150,
    tag: 'Recommended Baseline',
    description: 'High-quality contemporary construction with branded structural & finishing materials.',
    features: ['M25 Ready-Mix RCC framing', 'AAC Block lightweight masonry', '4x2 Glazed vitrified tiles', 'Branded Jaquar/Kohler CP fittings', 'Schneider modular wiring'],
    accentColor: 'text-amber-400',
    badgeBg: 'bg-amber-500/10',
    badgeBorder: 'border-amber-500/30',
  },
  {
    tier: 'Premium Architectural',
    minRate: 2500,
    maxRate: 3600,
    typicalRate: 3050,
    tag: 'High Specification',
    description: 'Architectural grade finish with high acoustic, thermal, and visual specifications.',
    features: ['Engineered RCC framing & grade beams', 'Imported marble / large slab tiles', 'Double-glazed soundproof system aluminum', 'Grohe/Toto sanitaryware', 'Smart home automation conduits'],
    accentColor: 'text-purple-400',
    badgeBg: 'bg-purple-500/10',
    badgeBorder: 'border-purple-500/30',
  },
  {
    tier: 'Luxury / Signature',
    minRate: 3800,
    maxRate: 5500,
    typicalRate: 4400,
    tag: 'Ultra Luxury',
    description: 'Bespoke high-end architectural villa and luxury commercial specification.',
    features: ['Italian Statuario/Bottochino marble', 'Structural architectural glazing', 'VRV / VRF central HVAC integration', 'Acoustic insulation & façade cladding', 'Designer landscape & infinity pool works'],
    accentColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10',
    badgeBorder: 'border-emerald-500/30',
  },
];

const SQFT_PRESETS = [
  { label: '1,200 sq.ft', value: 1200, desc: '2BHK Apartment / Compact Villa' },
  { label: '2,000 sq.ft', value: 2000, desc: '3BHK Villa / Row House' },
  { label: '3,000 sq.ft', value: 3000, desc: 'Duplex Residence / Penthouse' },
  { label: '5,000 sq.ft', value: 5000, desc: 'Luxury Villa / Commercial Office' },
  { label: '10,000 sq.ft', value: 10000, desc: 'Institutional / Commercial Complex' },
];

export const BOQView: React.FC<BOQViewProps> = ({
  items,
  contingencyPercent,
  currency,
  activeProject,
  onUpdateItems,
  onChangeContingency,
  onUpdateProject,
  onAddEnquiry,
}) => {
  // Built-up area in sq.ft state (synced with activeProject)
  const [areaSqFt, setAreaSqFt] = useState<number>(() => {
    return activeProject.builtUpAreaSqFt && activeProject.builtUpAreaSqFt > 0
      ? activeProject.builtUpAreaSqFt
      : 3000;
  });

  // Keep local area in sync if activeProject changes
  useEffect(() => {
    if (activeProject.builtUpAreaSqFt && activeProject.builtUpAreaSqFt > 0) {
      setAreaSqFt(activeProject.builtUpAreaSqFt);
    }
  }, [activeProject.id, activeProject.builtUpAreaSqFt]);

  // Area editor modal/popover
  const [isEditingAreaModal, setIsEditingAreaModal] = useState(false);
  const [tempAreaInput, setTempAreaInput] = useState<number>(areaSqFt);
  const [scaleQuantitiesWithArea, setScaleQuantitiesWithArea] = useState(true);

  // Market rate calibration modal
  const [isCalibrateModal, setIsCalibrateModal] = useState(false);
  const [targetRatePerSqFt, setTargetRatePerSqFt] = useState<number>(2150);

  // Send Tender Enquiry modal
  const [isEnquiryModal, setIsEnquiryModal] = useState(false);
  const [enquirySuccess, setEnquirySuccess] = useState(false);
  const [enquiryClientName, setEnquiryClientName] = useState('Ar. Gouse');
  const [enquiryClientEmail, setEnquiryClientEmail] = useState('principal@gouseai.com');
  const [enquiryClientPhone, setEnquiryClientPhone] = useState('+91 98450 12345');
  const [enquiryTenderNotes, setEnquiryTenderNotes] = useState('');

  // Add Item form state
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState(CATEGORIES[0]);
  const [newItemUnit, setNewItemUnit] = useState(UNITS[0]);
  const [newItemQty, setNewItemQty] = useState<number>(10);
  const [newItemRate, setNewItemRate] = useState<number>(500);
  const [newItemNotes, setNewItemNotes] = useState('');

  // AI BOQ Generator states
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiDescription, setAiDescription] = useState(activeProject.description || '');
  const [aiAreaSqFt, setAiAreaSqFt] = useState<number>(areaSqFt);
  const [aiQualityTier, setAiQualityTier] = useState<string>('Standard');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{
    project_summary: string;
    assumptions: string[];
    items: any[];
  } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Category filter state
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Quick Audit logic check state
  const [isAuditActive, setIsAuditActive] = useState(false);
  const [auditFilterOnlyIssues, setAuditFilterOnlyIssues] = useState(false);

  // Future Cost Variations Simulator state
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(true);

  // BOQ Cost Distribution (Materials, Labor & Overheads) state
  const [isDistributionOpen, setIsDistributionOpen] = useState(true);

  // Market Price Auto-Update state
  const [isMarketModalOpen, setIsMarketModalOpen] = useState(false);
  const [isAreaMarketModalOpen, setIsAreaMarketModalOpen] = useState(false);
  const [activeMarketRegion, setActiveMarketRegion] = useState<MarketRegion>('bangalore');
  const [activeMarketTier, setActiveMarketTier] = useState<MarketQualityTier>('Standard');
  const [activeMarketBasis, setActiveMarketBasis] = useState<MarketPricingBasis>('spot_market');
  const [marketUpdateBanner, setMarketUpdateBanner] = useState<{ message: string; submessage?: string } | null>(null);

  // Building Floors & Level Breakdown States
  const [floors, setFloors] = useState<BuildingFloor[]>(() => {
    try {
      const saved = localStorage.getItem('gouse_ai_building_floors');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_BUILDING_FLOORS;
  });

  useEffect(() => {
    localStorage.setItem('gouse_ai_building_floors', JSON.stringify(floors));
  }, [floors]);

  // Floor View Mode: 'matrix' (Detailed Floor-Wise Matrix) vs 'level_focus' (single level focus) vs 'standard'
  const [floorViewMode, setFloorViewMode] = useState<'matrix' | 'level_focus' | 'standard'>('matrix');
  const [selectedFloorId, setSelectedFloorId] = useState<string | 'all'>('all');

  // Modals for Floor-Wise capabilities
  const [isFloorManagerOpen, setIsFloorManagerOpen] = useState(false);
  const [isDistributionModalOpen, setIsDistributionModalOpen] = useState(false);
  const [activeDistributionItem, setActiveDistributionItem] = useState<BOQItem | null>(null);
  const [isFloorPrintModalOpen, setIsFloorPrintModalOpen] = useState(false);

  // Floor-Wise Schedule Calculations (Subtotals, rates/sqft, % distribution)
  const {
    floorTotals,
    buildingSubtotal: floorBuildingSubtotal,
    contingencyAmount: floorContingencyAmount,
    grandTotal: floorGrandTotal,
    totalAreaSqFt: floorTotalAreaSqFt,
    overallRatePerSqFt: floorOverallRatePerSqFt,
  } = useMemo(() => {
    return calculateFloorWiseTotals(items, floors, contingencyPercent);
  }, [items, floors, contingencyPercent]);

  // Handler: Update an individual item's quantity on a specific floor
  const handleUpdateItemFloorQty = (itemId: string, floorId: string, newQty: number) => {
    const updated = items.map((it) => {
      if (it.id === itemId) {
        return updateItemFloorQuantity(it, floorId, newQty, floors);
      }
      return it;
    });
    onUpdateItems(updated);
  };

  // Handler: Update rate for an item in the matrix
  const handleUpdateItemRateInMatrix = (itemId: string, newRate: number) => {
    const updated = items.map((it) => {
      if (it.id === itemId) {
        const r = Math.max(0, newRate);
        return {
          ...it,
          rate: r,
          amount: Math.round(it.quantity * r * 100) / 100,
        };
      }
      return it;
    });
    onUpdateItems(updated);
  };

  // Handler: Copy takeoff quantities from one floor into another
  const handleCopyFromFloor = (sourceFloorId: string, targetFloorId: string) => {
    const updated = copyFloorQuantitiesAcrossItems(items, sourceFloorId, targetFloorId, floors);
    onUpdateItems(updated);
  };

  // Handler: Export directly to Microsoft Excel (.xlsx format with multiple sheets)
  const handleExportExcel = () => {
    exportBOQToExcel({
      items,
      floors,
      projectName: activeProject.name,
      currency,
      contingencyPercent,
      builtUpAreaSqFt: areaSqFt,
    });
  };

  // Handler: Export Floor-Wise Schedule of Rates and Quantities in Excel-Ready CSV (with UTF-8 BOM)
  const handleExportFloorWiseCSV = () => {
    exportBOQToExcelCSV({
      items,
      floors,
      projectName: activeProject.name,
      currency,
      contingencyPercent,
      builtUpAreaSqFt: areaSqFt,
    });
  };

  // Handle applied area & market price auto-update
  const handleApplyAreaAndMarketUpdate = (
    updatedItems: BOQItem[],
    newAreaSqFt: number,
    reportSummary: string
  ) => {
    onUpdateItems(updatedItems);
    if (onUpdateProject) {
      onUpdateProject({
        ...activeProject,
        builtUpAreaSqFt: newAreaSqFt,
      });
    }
    setAreaSqFt(newAreaSqFt);
    setMarketUpdateBanner({
      message: `Applied Automatic Area & Market Update for ${newAreaSqFt.toLocaleString()} sq.ft!`,
      submessage: reportSummary,
    });
  };

  // Memoized market matches for all items based on current market settings
  const itemMarketMatches = useMemo(() => {
    const map: Record<string, ReturnType<typeof matchBOQItemToMarket>> = {};
    items.forEach((it) => {
      map[it.id] = matchBOQItemToMarket(it, activeMarketRegion, activeMarketTier, activeMarketBasis);
    });
    return map;
  }, [items, activeMarketRegion, activeMarketTier, activeMarketBasis]);

  // Quick 1-click update all to market prices
  const handleQuickUpdateAllToMarket = () => {
    const { updatedItems, report } = autoUpdateBOQItemsWithMarketRates(items, {
      regionId: activeMarketRegion,
      tier: activeMarketTier,
      pricingBasis: activeMarketBasis,
      onlyFlaggedOrZero: false,
      fixUnitMismatches: true,
    });

    onUpdateItems(updatedItems);
    setMarketUpdateBanner({
      message: `Updated all ${report.updatedItemsCount} line items to live market rates for ${report.region.name}.`,
      submessage: `Previous Subtotal: ${formatCurrency(report.previousSubtotal, currency)} → Updated: ${formatCurrency(report.updatedSubtotal, currency)} (${report.totalVariancePct > 0 ? '+' : ''}${report.totalVariancePct}% variance). Fixed ${report.unratedFixedCount} unpriced items.`,
    });
  };

  // Single item update to market price
  const handleUpdateSingleItemToMarket = (itemId: string) => {
    const match = itemMarketMatches[itemId];
    if (!match) return;

    const updated = items.map((it) => {
      if (it.id !== itemId) return it;
      const newRate = match.marketRate;
      const newUnit = match.unitMismatch && match.suggestedUnit ? match.suggestedUnit : it.unit;
      return {
        ...it,
        rate: newRate,
        unit: newUnit,
        amount: Math.round(it.quantity * newRate),
        materialComponent: match.matchedBenchmark.materialComponent,
        laborComponent: match.matchedBenchmark.laborComponent,
        equipmentComponent: match.matchedBenchmark.equipmentComponent,
        overheadComponent: match.matchedBenchmark.overheadComponent,
      };
    });

    onUpdateItems(updated);
  };

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  }, [items]);

  const contingencyAmount = useMemo(() => {
    return (subtotal * contingencyPercent) / 100;
  }, [subtotal, contingencyPercent]);

  const totalEstimate = useMemo(() => {
    return subtotal + contingencyAmount;
  }, [subtotal, contingencyAmount]);

  // Current Unit Rate per sq.ft
  const currentRatePerSqFt = useMemo(() => {
    if (areaSqFt <= 0) return 0;
    return Math.round(totalEstimate / areaSqFt);
  }, [totalEstimate, areaSqFt]);

  const subtotalRatePerSqFt = useMemo(() => {
    if (areaSqFt <= 0) return 0;
    return Math.round(subtotal / areaSqFt);
  }, [subtotal, areaSqFt]);

  // Determine current market tier classification based on rate per sq.ft
  const currentMarketTier = useMemo(() => {
    if (currentRatePerSqFt < 1750) return MARKET_BENCHMARKS[0]; // Economy
    if (currentRatePerSqFt < 2500) return MARKET_BENCHMARKS[1]; // Standard
    if (currentRatePerSqFt < 3700) return MARKET_BENCHMARKS[2]; // Premium
    return MARKET_BENCHMARKS[3]; // Luxury
  }, [currentRatePerSqFt]);

  // Category breakdown & category unit rates per sq.ft
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    items.forEach((item) => {
      totals[item.category] = (totals[item.category] || 0) + (item.quantity * item.rate);
    });
    return totals;
  }, [items]);

  // Audit results computed across all items
  const auditResults = useMemo(() => {
    const map: Record<string, ItemAuditStatus> = {};
    items.forEach((item) => {
      map[item.id] = checkBOQItemAudit(item);
    });
    return map;
  }, [items]);

  const totalAuditIssues = useMemo(() => {
    return Object.values(auditResults).reduce((acc, status) => acc + status.issues.length, 0);
  }, [auditResults]);

  const itemsWithIssuesCount = useMemo(() => {
    return Object.values(auditResults).filter((status) => status.hasIssues).length;
  }, [auditResults]);

  const missingRatesCount = useMemo(() => {
    return Object.values(auditResults).filter((status) => status.missingRate).length;
  }, [auditResults]);

  const mismatchedUnitsCount = useMemo(() => {
    return Object.values(auditResults).filter((status) => status.mismatchedUnit).length;
  }, [auditResults]);

  const zeroQuantitiesCount = useMemo(() => {
    return Object.values(auditResults).filter((status) => status.zeroQuantity).length;
  }, [auditResults]);

  const filteredItems = useMemo(() => {
    let list = items;
    if (filterCategory !== 'all') {
      list = list.filter((item) => item.category === filterCategory);
    }
    if (isAuditActive && auditFilterOnlyIssues) {
      list = list.filter((item) => auditResults[item.id]?.hasIssues);
    }
    return list;
  }, [items, filterCategory, isAuditActive, auditFilterOnlyIssues, auditResults]);

  // Handle Square Footage Update
  const handleApplyAreaChange = (newSqFt: number, shouldScale: boolean) => {
    const validSqFt = Math.max(100, Math.round(newSqFt));
    const previousSqFt = areaSqFt > 0 ? areaSqFt : 3000;

    if (shouldScale && previousSqFt > 0 && validSqFt !== previousSqFt) {
      const scaleFactor = validSqFt / previousSqFt;
      const scaledItems = items.map((item) => {
        // Scale civil/structural/finish quantities proportionally
        const scaledQty = Math.round(item.quantity * scaleFactor * 10) / 10;
        return {
          ...item,
          quantity: scaledQty,
          amount: Math.round(scaledQty * item.rate),
        };
      });
      onUpdateItems(scaledItems);
    }

    setAreaSqFt(validSqFt);
    setAiAreaSqFt(validSqFt);

    if (onUpdateProject) {
      onUpdateProject({
        ...activeProject,
        builtUpAreaSqFt: validSqFt,
      });
    }

    setIsEditingAreaModal(false);
  };

  // Handle Calibrating Item Rates to Target Live Market Rate per sq.ft
  const handleApplyMarketRateCalibration = () => {
    if (targetRatePerSqFt <= 0 || currentRatePerSqFt <= 0 || areaSqFt <= 0) return;

    // Target Grand Total
    const targetTotal = targetRatePerSqFt * areaSqFt;
    // Factor considering contingency
    const targetSubtotal = targetTotal / (1 + contingencyPercent / 100);
    const multiplier = targetSubtotal / (subtotal > 0 ? subtotal : 1);

    const calibratedItems = items.map((item) => {
      const newRate = Math.max(1, Math.round(item.rate * multiplier));
      return {
        ...item,
        rate: newRate,
        amount: Math.round(item.quantity * newRate),
      };
    });

    onUpdateItems(calibratedItems);
    setIsCalibrateModal(false);
  };

  // Handle Calibrating Item Rates to Forecasted Index Multiplier
  const handleApplyForecastMultiplier = (multiplier: number) => {
    if (multiplier <= 0) return;
    const calibratedItems = items.map((item) => {
      const newRate = Math.max(1, Math.round(item.rate * multiplier));
      return {
        ...item,
        rate: newRate,
        amount: Math.round(item.quantity * newRate),
      };
    });
    onUpdateItems(calibratedItems);
  };

  // Item field editing
  const handleUpdateItemField = (id: string, field: keyof BOQItem, value: any) => {
    const updated = items.map((item) => {
      if (item.id !== id) return item;
      const updatedItem = { ...item, [field]: value };
      if (field === 'quantity' || field === 'rate') {
        const q = field === 'quantity' ? Math.max(0, Number(value) || 0) : item.quantity;
        const r = field === 'rate' ? Math.max(0, Number(value) || 0) : item.rate;
        updatedItem.amount = Math.round(q * r);
      }
      return updatedItem;
    });
    onUpdateItems(updated);
  };

  const handleDeleteItem = (id: string) => {
    onUpdateItems(items.filter((item) => item.id !== id));
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const qty = Math.max(0, Number(newItemQty) || 0);
    const rate = Math.max(0, Number(newItemRate) || 0);

    const newItem: BOQItem = {
      id: `boq-${Date.now()}`,
      name: newItemName.trim(),
      category: newItemCategory,
      unit: newItemUnit,
      quantity: qty,
      rate: rate,
      amount: Math.round(qty * rate),
      notes: newItemNotes.trim(),
    };

    const ensuredNewItem = ensureItemFloorBreakdown(newItem, floors);
    onUpdateItems([...items, ensuredNewItem]);
    setNewItemName('');
    setNewItemNotes('');
    setIsAddingItem(false);
  };

  // Quick Audit: Auto-correct mismatched units based on engineering standards
  const handleAutoFixAuditIssues = () => {
    let fixCount = 0;
    const updated = items.map((item) => {
      const audit = auditResults[item.id];
      if (audit && audit.mismatchedUnit && audit.suggestedUnit) {
        fixCount++;
        return {
          ...item,
          unit: audit.suggestedUnit,
        };
      }
      return item;
    });
    if (fixCount > 0) {
      onUpdateItems(updated);
    }
  };

  // Quick Audit: Inject demo items with missing rate or mismatched unit for immediate user verification
  const handleInjectSampleAuditIssue = () => {
    const demoItems: BOQItem[] = [
      {
        id: `boq-audit-${Date.now()}-1`,
        name: 'Structural Steel Portal Framing & Purlins for Warehouse Bay',
        category: 'Concrete Works',
        unit: 'm3', // Mismatched unit (should be MT or kg)
        quantity: 12.5,
        rate: 72000,
        amount: 900000,
        notes: 'Fabricated I-sections (Mismatched unit: entered as volumetric m³ instead of MT)',
        stage: 'Superstructure',
        status: 'tendered',
      },
      {
        id: `boq-audit-${Date.now()}-2`,
        name: 'Acoustic Double-Glazed Flush Timber Core Partition Doors',
        category: 'Doors & Windows',
        unit: 'nos',
        quantity: 18,
        rate: 0, // Missing unit rate
        amount: 0,
        notes: 'Awaiting supplier price quotation (Missing unit rate)',
        stage: 'Finishes',
        status: 'estimated',
      },
    ];

    onUpdateItems([...demoItems, ...items]);
    setIsAuditActive(true);
    setAuditFilterOnlyIssues(false);
  };

  // AI BOQ Generation with exact square footage & quality tier
  const handleGenerateAI = async () => {
    if (!aiDescription.trim()) return;
    setAiLoading(true);
    setAiError(null);

    try {
      const res = await fetch('/api/boq/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: aiDescription,
          projectType: activeProject.projectType,
          builtUpAreaSqFt: aiAreaSqFt || areaSqFt,
          qualityTier: aiQualityTier,
        }),
      });

      if (!res.ok) {
        throw new Error('API server returned response error, utilizing benchmark fallback');
      }
      const data = await res.json();
      setAiResult(data);
    } catch (err: any) {
      // Graceful fallback without showing a blocking error
      setAiResult({
        project_summary: `Preliminary Bill of Quantities for ${activeProject.name} (${aiAreaSqFt.toLocaleString()} sq.ft, ${aiQualityTier} Tier)`,
        assumptions: [
          `Quantities calibrated specifically for ${aiAreaSqFt.toLocaleString()} sq.ft built-up area.`,
          `Specification tier aligned with ${aiQualityTier} live market rates.`,
          'M25 grade ready-mix concrete and Fe550D TMT reinforcement steel assumed.',
          'Plinth area empirical consumption indices applied per standard civil guidelines.',
        ],
        items: [
          { name: 'Earthwork excavation in foundation trenches', category: 'Substructure', unit: 'm3', quantity: Math.round(140 * (aiAreaSqFt / 3000)), rate: 280, notes: `Footprint for ${aiAreaSqFt} sq.ft` },
          { name: 'PCC 1:4:8 in foundation bed (100mm thick)', category: 'Concrete Works', unit: 'm3', quantity: Math.round(24 * (aiAreaSqFt / 3000) * 10) / 10, rate: 4800, notes: '40mm aggregate base' },
          { name: 'RCC M25 grade in columns, beams & slabs', category: 'Concrete Works', unit: 'm3', quantity: Math.round(52 * (aiAreaSqFt / 3000) * 10) / 10, rate: 8500, notes: 'Complete formwork & curing' },
          { name: 'Fe550D TMT thermo-mechanically treated rebar', category: 'Concrete Works', unit: 'MT', quantity: Math.round(4.8 * (aiAreaSqFt / 3000) * 10) / 10, rate: 72000, notes: 'Cut, bend and placed in position' },
          { name: 'AAC lightweight block masonry (200mm)', category: 'Masonry', unit: 'm3', quantity: Math.round(65 * (aiAreaSqFt / 3000) * 10) / 10, rate: 5600, notes: 'With polymer adhesive joints' },
          { name: 'Internal & external cement plastering (12-15mm)', category: 'Finishes', unit: 'sq.m', quantity: Math.round(380 * (aiAreaSqFt / 3000)), rate: 260, notes: 'Double coat sponge finish' },
          { name: 'Vitrified flooring tiles with epoxy grout', category: 'Finishes', unit: 'sq.m', quantity: Math.round(180 * (aiAreaSqFt / 3000)), rate: 1150, notes: 'Over 20mm cement bed' },
          { name: 'System aluminum / UPVC glazed windows', category: 'Doors & Windows', unit: 'sq.m', quantity: Math.round(36 * (aiAreaSqFt / 3000)), rate: 4200, notes: 'With mosquito mesh track' },
          { name: 'Electrical conduit & modular point wiring', category: 'MEP & Electrical', unit: 'nos', quantity: Math.round(85 * (aiAreaSqFt / 3000)), rate: 950, notes: 'Concealed FRLS copper' },
          { name: 'Plumbing & sanitary drainage network', category: 'Plumbing', unit: 'r.m', quantity: Math.round(120 * (aiAreaSqFt / 3000)), rate: 420, notes: 'CPVC & SWR pipes pressure tested' },
          { name: 'Waterproofing treatment on terrace & wet areas', category: 'Waterproofing', unit: 'sq.m', quantity: Math.round(125 * (aiAreaSqFt / 3000)), rate: 580, notes: 'Brickbat coba & polymer coating' },
        ],
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAIBOQ = (replace: boolean) => {
    if (!aiResult || !aiResult.items) return;

    const formatted: BOQItem[] = aiResult.items.map((it, idx) => ({
      id: `boq-ai-${Date.now()}-${idx}`,
      name: it.name,
      category: it.category || 'General',
      unit: it.unit || 'nos',
      quantity: Number(it.quantity) || 0,
      rate: Number(it.rate) || 0,
      amount: Math.round((Number(it.quantity) || 0) * (Number(it.rate) || 0)),
      notes: it.notes || '',
    }));

    if (replace) {
      onUpdateItems(formatted);
    } else {
      onUpdateItems([...items, ...formatted]);
    }

    // Sync area if user updated it during AI generation
    if (aiAreaSqFt !== areaSqFt) {
      setAreaSqFt(aiAreaSqFt);
      if (onUpdateProject) {
        onUpdateProject({ ...activeProject, builtUpAreaSqFt: aiAreaSqFt });
      }
    }

    setIsGeneratingAI(false);
    setAiResult(null);
  };

  // Handle Dispatching BOQ as Tender Enquiry
  const handleSendTenderEnquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddEnquiry) return;

    const topCategories = Object.entries(categoryTotals)
      .slice(0, 4)
      .map(([cat, amt]) => `${cat}: ${formatCurrency(amt, currency)}`)
      .join(' | ');

    const newEnquiry: MarketplaceEnquiry = {
      id: `enq-boq-${Date.now()}`,
      professionalId: 'general-contractor-rfq',
      professionalName: 'Tender & Contractor Network',
      clientName: enquiryClientName.trim() || 'Principal Architect',
      clientEmail: enquiryClientEmail.trim() || 'office@architecture.com',
      projectTitle: `BOQ Tender RFQ: ${activeProject.name} (${areaSqFt.toLocaleString()} sq.ft)`,
      budget: formatCurrency(totalEstimate, currency),
      message: `Formal Contractor & Tender Quotation Enquiry for ${activeProject.name} in ${activeProject.location}.
Built-Up Area: ${areaSqFt.toLocaleString()} sq.ft (${Math.round(areaSqFt / 10.764).toLocaleString()} m²)
Estimated BOQ Value: ${formatCurrency(totalEstimate, currency)} (${formatCurrency(currentRatePerSqFt, currency)} / sq.ft)
Specification Tier: ${currentMarketTier.tier}
Scope Summary: ${items.length} line items across categories including ${topCategories}.
Contingency Reserve: ${contingencyPercent}%.
Notes / Terms: ${enquiryTenderNotes.trim() || 'Please submit sealed itemized rates within 10 days.'}
Contact: ${enquiryClientPhone}`,
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    onAddEnquiry(newEnquiry);
    setEnquirySuccess(true);
    setTimeout(() => {
      setEnquirySuccess(false);
      setIsEnquiryModal(false);
      setEnquiryTenderNotes('');
    }, 2200);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Item Name', 'Category', 'Unit', 'Quantity', 'Rate (INR)', 'Amount (INR)', 'Notes'];
    const rows = items.map((i) => [
      `"${i.name.replace(/"/g, '""')}"`,
      `"${i.category}"`,
      `"${i.unit}"`,
      i.quantity,
      i.rate,
      i.amount,
      `"${(i.notes || '').replace(/"/g, '""')}"`,
    ]);

    // Add metadata summary at bottom of CSV
    rows.push([]);
    rows.push(['Built-Up Area (sq.ft)', '', '', areaSqFt.toString(), '', '', '']);
    rows.push(['Subtotal Cost', '', '', '', '', subtotal.toString(), '']);
    rows.push([`Contingency Reserve (${contingencyPercent}%)`, '', '', '', '', contingencyAmount.toString(), '']);
    rows.push(['Grand Estimated Total', '', '', '', '', totalEstimate.toString(), '']);
    rows.push(['Calculated Unit Rate per sq.ft', '', '', '', '', currentRatePerSqFt.toString(), '']);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeProject.name.replace(/\s+/g, '_')}_BOQ_${areaSqFt}sqft.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="boq-estimation-view" className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Top Header & Global Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs uppercase tracking-wider font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Quantity Surveying & Cost Engineering
            </span>
            <span className="text-xs text-slate-400">
              {activeProject.name} • {activeProject.location}
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
            Bill of Quantities & Live Market Cost Estimation
          </h2>
          <p className="text-xs text-slate-400">
            Set exact square footage, calibrate item rates against live market benchmarks, and dispatch tender enquiries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Calibrate to Market Price Button */}
          <button
            id="btn-calibrate-market-rate"
            onClick={() => {
              setTargetRatePerSqFt(currentRatePerSqFt > 0 ? currentRatePerSqFt : 2150);
              setIsCalibrateModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 text-xs font-semibold transition"
            title="Set target rate per sq.ft based on live market pricing"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Set Market Rate / sq.ft</span>
          </button>

          {/* Quick Audit Button */}
          <button
            id="btn-quick-audit"
            onClick={() => {
              const nextState = !isAuditActive;
              setIsAuditActive(nextState);
              if (!nextState) {
                setAuditFilterOnlyIssues(false);
              }
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition border ${
              isAuditActive
                ? totalAuditIssues > 0
                  ? 'bg-red-500/20 text-red-200 border-red-500 ring-1 ring-red-500/50 shadow-sm'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500 ring-1 ring-emerald-500/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="Run logic check for missing rates or mismatched units"
          >
            {isAuditActive && totalAuditIssues > 0 ? (
              <ShieldAlert className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            ) : isAuditActive ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>Quick Audit</span>
            {totalAuditIssues > 0 ? (
              <span
                className={`px-1.5 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                  isAuditActive
                    ? 'bg-red-500 text-white'
                    : 'bg-red-500/20 text-red-300 border border-red-500/40'
                }`}
              >
                {totalAuditIssues}
              </span>
            ) : isAuditActive ? (
              <span className="text-[10px] text-emerald-400 font-bold">✓ Pass</span>
            ) : null}
          </button>

          {/* Cost Forecast Simulator Button */}
          <button
            id="btn-toggle-cost-simulator"
            onClick={() => setIsSimulatorOpen(!isSimulatorOpen)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition border ${
              isSimulatorOpen
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm font-bold'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/30'
            }`}
            title="Simulate future cost variations over time using historical material price indices"
          >
            <LineChartIcon className="w-3.5 h-3.5" />
            <span>Cost Forecast Simulator</span>
            <span
              className={`px-1.5 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                isSimulatorOpen ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              WPI
            </span>
          </button>

          {/* BOQ Cost Distribution: Materials, Labor & Overheads Button */}
          <button
            id="btn-toggle-cost-distribution"
            onClick={() => setIsDistributionOpen(!isDistributionOpen)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition border ${
              isDistributionOpen
                ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-sm font-bold'
                : 'bg-slate-800 hover:bg-slate-700 text-sky-300 border-sky-500/30'
            }`}
            title="Display current BOQ distribution by category like materials, labor, and overheads with real data"
          >
            <PieChartIcon className="w-3.5 h-3.5" />
            <span>Cost Distribution</span>
            <span
              className={`px-1.5 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                isDistributionOpen ? 'bg-slate-950 text-sky-400' : 'bg-sky-500/20 text-sky-300'
              }`}
            >
              Mat/Lab/Ovh
            </span>
          </button>

          {/* Automatic Quantities & Market Prices with Area Button */}
          <button
            id="btn-toolbar-area-market-sync"
            onClick={() => setIsAreaMarketModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm"
            title="Automatic data update for all Material Quantities with Area and live Market Prices"
          >
            <Zap className="w-3.5 h-3.5 fill-slate-950" />
            <span>Auto-Update (Area & Market)</span>
            <span className="px-1.5 py-0.5 rounded-full font-mono text-[10px] font-extrabold bg-slate-950 text-amber-300">
              Area+Rates
            </span>
          </button>

          {/* Automatic Market Price Update Button */}
          <button
            id="btn-toolbar-market-price-update"
            onClick={() => setIsMarketModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 text-xs font-semibold transition shadow-sm"
            title="Automatic data update for Schedule of Rates & Quantities based on live market prices"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Market Rates Sync</span>
            <span className="px-1.5 py-0.5 rounded-full font-mono text-[10px] font-bold bg-amber-500/30 text-amber-200">
              Auto
            </span>
          </button>

          {/* AI Generator Button */}
          <button
            id="btn-open-ai-boq"
            onClick={() => {
              setAiAreaSqFt(areaSqFt);
              setIsGeneratingAI(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 text-xs font-medium transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI BOQ Generator</span>
          </button>

          {/* Add Line Item */}
          <button
            id="btn-open-add-boq"
            onClick={() => setIsAddingItem(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Line Item</span>
          </button>

          {/* Send Tender Enquiry */}
          {onAddEnquiry && (
            <button
              id="btn-send-boq-enquiry"
              onClick={() => setIsEnquiryModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-medium transition"
              title="Dispatch BOQ as a Contractor / Tender Enquiry"
            >
              <Send className="w-3.5 h-3.5 text-amber-400" />
              <span>Send Tender Enquiry</span>
            </button>
          )}

          {/* Export to Microsoft Excel (.xlsx) */}
          <button
            id="btn-export-excel-top"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-sm"
            title="Download complete Schedule of Rates & Quantities in Microsoft Excel (.xlsx) format with multi-sheet workbook (Floor-Wise Breakdown, Level Summary, Master BOQ)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            <span>Export Excel (.xlsx)</span>
          </button>

          {/* Export CSV (Excel Compatible with UTF-8 BOM) */}
          <button
            id="btn-export-floor-wise-csv-top"
            onClick={handleExportFloorWiseCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs font-medium transition"
            title="Download Schedule of Rates & Quantities broken down by floor level in Excel-compatible CSV format"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Floor-Wise CSV (Excel)</span>
          </button>

          <button
            id="btn-export-csv"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
            title="Export standard BOQ summary"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Master CSV</span>
          </button>

          {/* Print Floor-Wise Report */}
          <button
            id="btn-print-floor-report-top"
            onClick={() => setIsFloorPrintModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold transition"
            title="View printable / PDF official Floor-Wise Schedule of Rates and Quantities report"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Floor Report</span>
          </button>
        </div>
      </div>

      {/* SQUARE FOOTAGE CONTROLLER BAR (User can set square feet directly) */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                Project Built-Up Area
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                Active Benchmark
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold font-mono text-white">
                {areaSqFt.toLocaleString()} <span className="text-sm font-normal text-slate-400">sq.ft</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                (≈ {Math.round(areaSqFt / 10.764).toLocaleString()} m²)
              </span>
            </div>
          </div>
        </div>

        {/* Quick presets and Change Area button */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium mr-1">Quick Presets:</span>
          {SQFT_PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => handleApplyAreaChange(p.value, false)}
              className={`px-2.5 py-1 text-xs rounded-lg font-mono transition border ${
                areaSqFt === p.value
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
              title={p.desc}
            >
              {p.label}
            </button>
          ))}

          <button
            id="btn-edit-square-feet"
            onClick={() => {
              setTempAreaInput(areaSqFt);
              setIsEditingAreaModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-medium transition ml-1"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>Set Custom Sq.Ft</span>
          </button>
        </div>
      </div>

      {/* METRIC SUMMARY CARDS (With live Unit Rate per sq.ft) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Subtotal Civil & Finishes */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Subtotal Works (Base Cost)</span>
          <p className="text-xl font-bold font-mono text-white">
            {formatCurrency(subtotal, currency)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>{items.length} line items</span>
            <span className="text-slate-400">{formatCurrency(subtotalRatePerSqFt, currency)}/sq.ft</span>
          </div>
        </div>

        {/* Contingency Reserve */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Design & Site Contingency</span>
            <span className="text-xs font-mono font-bold text-amber-400">{contingencyPercent}%</span>
          </div>
          <p className="text-xl font-bold font-mono text-amber-400">
            {formatCurrency(contingencyAmount, currency)}
          </p>
          <div className="pt-1">
            <input
              id="slider-contingency"
              type="range"
              min={0}
              max={25}
              step={0.5}
              value={contingencyPercent}
              onChange={(e) => onChangeContingency(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>

        {/* Estimated Grand Total */}
        <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 bg-amber-500/5 space-y-1">
          <span className="text-xs text-amber-300 font-medium">Estimated Grand Total</span>
          <p className="text-2xl font-bold font-mono text-amber-400">
            {formatCurrency(totalEstimate, currency)}
          </p>
          <p className="text-[11px] text-slate-400">
            All structural, finishes, MEP + {contingencyPercent}% reserve
          </p>
        </div>

        {/* Unit Rate per sq.ft based on Live Market Price */}
        <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 bg-emerald-500/5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-300 font-medium">Unit Rate per sq.ft</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${currentMarketTier.badgeBg} ${currentMarketTier.badgeBorder} ${currentMarketTier.accentColor}`}>
              {currentMarketTier.tag}
            </span>
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-400">
            {formatCurrency(currentRatePerSqFt, currency)} <span className="text-xs font-normal text-slate-400">/ sq.ft</span>
          </p>
          <p className="text-[11px] text-slate-400 font-mono">
            Based on {areaSqFt.toLocaleString()} sq.ft plinth ({currentMarketTier.tier.split('/')[0].trim()})
          </p>
        </div>
      </div>

      {/* LIVE MARKET PRICE BENCHMARK COMPARISON BAR */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono">
              Live Construction Market Benchmark Spectrum (INR / sq.ft)
            </h3>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Current Position: <span className="text-emerald-400 font-bold">₹{currentRatePerSqFt.toLocaleString()}/sq.ft</span>
          </div>
        </div>

        {/* Benchmark spectrum cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {MARKET_BENCHMARKS.map((b) => {
            const isCurrent = currentRatePerSqFt >= b.minRate && currentRatePerSqFt <= b.maxRate;
            return (
              <div
                key={b.tier}
                onClick={() => {
                  setTargetRatePerSqFt(b.typicalRate);
                  setIsCalibrateModal(true);
                }}
                className={`p-3 rounded-lg border cursor-pointer transition hover:border-slate-600 ${
                  isCurrent
                    ? `${b.badgeBg} ${b.badgeBorder} ring-1 ring-amber-500/40`
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-950'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${b.accentColor}`}>{b.tier}</span>
                  {isCurrent && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-semibold">
                      CURRENT
                    </span>
                  )}
                </div>
                <div className="text-sm font-bold font-mono text-white mt-1">
                  ₹{b.minRate.toLocaleString()} - ₹{b.maxRate.toLocaleString()} <span className="text-[10px] text-slate-400">/ sq.ft</span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                  {b.description}
                </p>
                <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono border-t border-slate-800/60 mt-2">
                  <span>Typical: ₹{b.typicalRate.toLocaleString()}</span>
                  <span className="text-amber-400 underline">Calibrate</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CATEGORY BREAKDOWN & COST PER SQ.FT */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
              Category Cost & Unit Rate per sq.ft Breakdown
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsDistributionOpen(true);
                const el = document.getElementById('boq-cost-distribution-panel');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-2.5 py-0.5 text-xs rounded transition bg-sky-500/15 text-sky-300 border border-sky-500/30 hover:bg-sky-500/25 flex items-center gap-1 font-medium"
              title="Jump to Materials, Labor & Overheads Distribution"
            >
              <PieChartIcon className="w-3 h-3 text-sky-400" />
              <span>Distribution Breakdown</span>
            </button>
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-2.5 py-0.5 text-xs rounded transition ${
                filterCategory === 'all'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Show All ({items.length} items)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-1">
          {Object.entries(categoryTotals).map(([cat, amt]) => {
            const isSelected = filterCategory === cat;
            const pct = subtotal > 0 ? ((amt / subtotal) * 100).toFixed(1) : '0';
            const catRatePerSqFt = areaSqFt > 0 ? Math.round(amt / areaSqFt) : 0;
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(isSelected ? 'all' : cat)}
                className={`p-2.5 rounded-lg text-left transition border ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500 text-white font-medium'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="text-xs text-slate-300 font-medium truncate">{cat}</div>
                <div className="font-mono text-sm font-bold text-amber-400 mt-0.5">
                  {formatCurrency(amt, currency)}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1 pt-1 border-t border-slate-800/60">
                  <span>₹{catRatePerSqFt}/sq.ft</span>
                  <span className="text-slate-500">({pct}%)</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MODAL 1: SET SQUARE FEET & SCALE QUANTITIES */}
      {isEditingAreaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white font-serif-classic">
                  Set Project Built-Up Area
                </h3>
              </div>
              <button onClick={() => setIsEditingAreaModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                Adjusting the square footage recalculates your unit rate per sq.ft and can optionally scale all BOQ material quantities proportionally.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Built-Up Area (Square Feet) *
                </label>
                <div className="relative">
                  <input
                    id="input-custom-sqft"
                    type="number"
                    min={100}
                    step={50}
                    value={tempAreaInput}
                    onChange={(e) => setTempAreaInput(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-base text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">
                    sq.ft (≈ {Math.round(tempAreaInput / 10.764)} m²)
                  </span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Common Typology Sizes:</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {SQFT_PRESETS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setTempAreaInput(p.value)}
                      className={`px-2.5 py-1.5 rounded text-xs font-mono text-left transition border ${
                        tempAreaInput === p.value
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold">{p.label}</div>
                      <div className="text-[10px] text-slate-400 truncate">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Scaling checkbox option */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scaleQuantitiesWithArea}
                    onChange={(e) => setScaleQuantitiesWithArea(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-medium text-white">
                      Scale BOQ item quantities proportionally ({((tempAreaInput / (areaSqFt || 1))).toFixed(2)}x)
                    </span>
                    <p className="text-[11px] text-slate-400">
                      If checked, concrete, steel, masonry, and finish quantities will multiply by the area ratio so your estimate remains engineering-accurate.
                    </p>
                  </div>
                </label>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditingAreaModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-sqft-change"
                  type="button"
                  onClick={() => handleApplyAreaChange(tempAreaInput, scaleQuantitiesWithArea)}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition"
                >
                  Apply & Update Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CALIBRATE TO LIVE MARKET RATE PER SQ.FT */}
      {isCalibrateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white font-serif-classic">
                  Calibrate Unit Rate based on Live Market Price
                </h3>
              </div>
              <button onClick={() => setIsCalibrateModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                Set your target all-in construction rate per sq.ft. The system will proportionally adjust item unit rates across all BOQ categories to meet the market price target.
              </p>

              {/* Current vs Target */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="text-[11px] text-slate-400">Current BOQ Rate</span>
                  <div className="text-lg font-bold font-mono text-white">
                    ₹{currentRatePerSqFt.toLocaleString()} <span className="text-xs text-slate-400">/ sq.ft</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Total: {formatCurrency(totalEstimate, currency)}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-emerald-400">Target Market Rate</span>
                  <div className="text-lg font-bold font-mono text-emerald-400">
                    ₹{targetRatePerSqFt.toLocaleString()} <span className="text-xs text-slate-400">/ sq.ft</span>
                  </div>
                  <div className="text-[10px] text-emerald-500 font-mono">
                    Target Total: {formatCurrency(targetRatePerSqFt * areaSqFt, currency)}
                  </div>
                </div>
              </div>

              {/* Target rate input */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Target Rate per sq.ft (INR) *
                </label>
                <input
                  type="number"
                  min={500}
                  step={50}
                  value={targetRatePerSqFt}
                  onChange={(e) => setTargetRatePerSqFt(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-base text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Quick Tier Selectors */}
              <div>
                <span className="block text-xs font-medium text-slate-400 mb-1.5">Or Choose Standard Market Tiers:</span>
                <div className="grid grid-cols-2 gap-2">
                  {MARKET_BENCHMARKS.map((b) => (
                    <button
                      key={b.tier}
                      type="button"
                      onClick={() => setTargetRatePerSqFt(b.typicalRate)}
                      className={`p-2 rounded text-left border text-xs transition ${
                        targetRatePerSqFt === b.typicalRate
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold">{b.tier.split('/')[0]}</div>
                      <div className="text-[11px] font-mono text-white">₹{b.typicalRate.toLocaleString()} / sq.ft</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCalibrateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-market-rate"
                  type="button"
                  onClick={handleApplyMarketRateCalibration}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                >
                  Calibrate All Line Items
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: SEND BOQ TENDER ENQUIRY */}
      {isEnquiryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white font-serif-classic">
                  Send BOQ Tender Enquiry to Contractors
                </h3>
              </div>
              <button onClick={() => setIsEnquiryModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {enquirySuccess ? (
              <div className="p-6 rounded-xl bg-emerald-950/40 border border-emerald-800 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white">Tender Enquiry Dispatched!</h4>
                <p className="text-xs text-emerald-300">
                  The BOQ schedule with {items.length} items ({formatCurrency(totalEstimate, currency)}) has been submitted to the marketplace enquiries network.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendTenderEnquiry} className="space-y-3">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1 text-xs font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Project:</span>
                    <span className="text-white font-sans font-medium">{activeProject.name}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Area:</span>
                    <span className="text-white">{areaSqFt.toLocaleString()} sq.ft</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Target Budget:</span>
                    <span className="text-amber-400 font-bold">{formatCurrency(totalEstimate, currency)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Unit Rate:</span>
                    <span className="text-emerald-400 font-bold">{formatCurrency(currentRatePerSqFt, currency)} / sq.ft</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={enquiryClientName}
                      onChange={(e) => setEnquiryClientName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={enquiryClientPhone}
                      onChange={(e) => setEnquiryClientPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={enquiryClientEmail}
                    onChange={(e) => setEnquiryClientEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Tender Submission Notes / Scope Details</label>
                  <textarea
                    rows={3}
                    placeholder="Provide specific notes on payment terms, defect liability period, site handover date..."
                    value={enquiryTenderNotes}
                    onChange={(e) => setEnquiryTenderNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEnquiryModal(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-xs text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-submit-tender-enquiry"
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition inline-flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch Enquiry</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 4: ADD LINE ITEM */}
      {isAddingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white font-serif-classic">
                Add BOQ Line Item
              </h3>
              <button onClick={() => setIsAddingItem(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Item Description *</label>
                <input
                  id="input-boq-name"
                  type="text"
                  required
                  placeholder="e.g. Reinforced Cement Concrete M25 in Grade Beams"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    id="select-boq-category"
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Measurement Unit</label>
                  <select
                    id="select-boq-unit"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Quantity</label>
                  <input
                    id="input-boq-qty"
                    type="number"
                    min={0}
                    step={0.01}
                    required
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Unit Rate (in INR)</label>
                  <input
                    id="input-boq-rate"
                    type="number"
                    min={0}
                    step={0.01}
                    required
                    value={newItemRate}
                    onChange={(e) => setNewItemRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Specification / Notes</label>
                <input
                  id="input-boq-notes"
                  type="text"
                  placeholder="e.g. Centering, shuttering, 28-day curing included"
                  value={newItemNotes}
                  onChange={(e) => setNewItemNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingItem(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-boq-item"
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition"
                >
                  Add to Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: AI BOQ GENERATOR (With Built-Up Area & Quality Tier Controls) */}
      {isGeneratingAI && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white font-serif-classic">
                  AI Bill of Quantities Generator
                </h3>
              </div>
              <button onClick={() => setIsGeneratingAI(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                Generate an empirical, engineering-accurate Bill of Quantities calibrated to your exact square footage and specification tier.
              </p>

              {/* Area and Quality Tier Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Target Built-Up Area (sq.ft)
                  </label>
                  <input
                    type="number"
                    min={100}
                    step={100}
                    value={aiAreaSqFt}
                    onChange={(e) => setAiAreaSqFt(Math.max(100, Number(e.target.value)))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">
                    ≈ {Math.round(aiAreaSqFt / 10.764)} m² plinth
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Specification Quality Tier
                  </label>
                  <select
                    value={aiQualityTier}
                    onChange={(e) => setAiQualityTier(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Economy">Economy (₹1,400 - ₹1,750 / sq.ft)</option>
                    <option value="Standard">Standard Quality (₹1,850 - ₹2,450 / sq.ft)</option>
                    <option value="Premium">Premium Architectural (₹2,500 - ₹3,600 / sq.ft)</option>
                    <option value="Luxury">Luxury / Signature (₹3,800 - ₹5,500+ / sq.ft)</option>
                  </select>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Adjusts material finishes & rates
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Architectural Scope & Typology Description
                </label>
                <textarea
                  id="textarea-ai-boq-desc"
                  rows={3}
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  placeholder="Describe building typology, foundation type, structural framing, walling materials, glazing, finishes..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  id="btn-run-ai-boq"
                  onClick={handleGenerateAI}
                  disabled={aiLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${aiLoading ? 'animate-spin' : ''}`} />
                  <span>{aiLoading ? 'Calculating Engineering Quantities...' : 'Generate Calibrated BOQ'}</span>
                </button>
              </div>

              {aiResult && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 mt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider font-mono">
                      Generated {aiResult.items.length} Preliminary Items ({aiAreaSqFt.toLocaleString()} sq.ft)
                    </h4>
                  </div>

                  <p className="text-xs text-slate-300">{aiResult.project_summary}</p>

                  {aiResult.assumptions && aiResult.assumptions.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400">Key Engineering Assumptions:</span>
                      <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-0.5">
                        {aiResult.assumptions.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-800 rounded-lg p-2 bg-slate-900">
                    {aiResult.items.map((it, i) => (
                      <div key={i} className="text-xs flex items-center justify-between py-1 border-b border-slate-800 last:border-0">
                        <span className="text-slate-200 truncate max-w-[280px]">{it.name}</span>
                        <div className="flex items-center gap-3 font-mono text-slate-400 text-[11px]">
                          <span>{it.quantity} {it.unit}</span>
                          <span>@ ₹{it.rate}</span>
                          <span className="text-amber-400 font-semibold">₹{(it.quantity * it.rate).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      id="btn-append-ai-boq"
                      onClick={() => handleApplyAIBOQ(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-amber-300 border border-amber-500/30 transition"
                    >
                      Append to Schedule
                    </button>
                    <button
                      id="btn-replace-ai-boq"
                      onClick={() => handleApplyAIBOQ(true)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition"
                    >
                      Replace Schedule ({aiAreaSqFt.toLocaleString()} sq.ft)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QUICK AUDIT BANNER & CONTROL BAR */}
      {isAuditActive && (
        <div
          id="quick-audit-status-panel"
          className={`p-4 rounded-xl border transition-all ${
            totalAuditIssues > 0
              ? 'bg-red-950/25 border-red-500/60 shadow-md shadow-red-950/50'
              : 'bg-emerald-950/25 border-emerald-500/60 shadow-sm'
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div
                className={`p-2.5 rounded-lg shrink-0 mt-0.5 ${
                  totalAuditIssues > 0
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}
              >
                {totalAuditIssues > 0 ? (
                  <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider font-mono px-2 py-0.5 rounded ${
                      totalAuditIssues > 0
                        ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    BOQ Quality & Logic Audit
                  </span>
                  <span className="text-xs text-white font-semibold">
                    {totalAuditIssues > 0
                      ? `${totalAuditIssues} issue${totalAuditIssues > 1 ? 's' : ''} detected across ${itemsWithIssuesCount} line item${itemsWithIssuesCount > 1 ? 's' : ''}`
                      : `Audit Passed — All ${items.length} line items have valid rates and compliant units`}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  {totalAuditIssues > 0
                    ? 'Line items with missing unit rates (₹0) or mismatched engineering units are highlighted in red below. Directly edit the rate or unit to resolve them in real time.'
                    : 'All line items meet architectural specification standards with positive unit pricing, non-zero quantities, and appropriate engineering units of measurement.'}
                </p>

                {/* Issue Breakdown Badges */}
                {totalAuditIssues > 0 && (
                  <div className="flex items-center gap-2 pt-1 flex-wrap text-[11px] font-mono">
                    {missingRatesCount > 0 && (
                      <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 font-semibold">
                        • {missingRatesCount} Missing Rate{missingRatesCount > 1 ? 's' : ''} (₹0)
                      </span>
                    )}
                    {mismatchedUnitsCount > 0 && (
                      <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 font-semibold">
                        • {mismatchedUnitsCount} Mismatched Unit{mismatchedUnitsCount > 1 ? 's' : ''}
                      </span>
                    )}
                    {zeroQuantitiesCount > 0 && (
                      <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 font-semibold">
                        • {zeroQuantitiesCount} Zero / Negative Quantity
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Audit Control Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {totalAuditIssues > 0 && (
                <button
                  id="btn-audit-toggle-filter"
                  onClick={() => setAuditFilterOnlyIssues(!auditFilterOnlyIssues)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition border ${
                    auditFilterOnlyIssues
                      ? 'bg-red-500 text-slate-950 border-red-400 font-bold shadow'
                      : 'bg-slate-900 hover:bg-slate-800 text-red-300 border-red-500/40'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>{auditFilterOnlyIssues ? 'Showing Flagged Only' : `Filter Flagged (${itemsWithIssuesCount})`}</span>
                </button>
              )}

              {mismatchedUnitsCount > 0 && (
                <button
                  id="btn-audit-autofix-units"
                  onClick={handleAutoFixAuditIssues}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition"
                  title="Automatically convert mismatched units to standard engineering units"
                >
                  <Wrench className="w-3.5 h-3.5 text-amber-400" />
                  <span>Auto-Fix Units</span>
                </button>
              )}

              {/* Quick simulation button so user can test audit highlights anytime */}
              <button
                id="btn-audit-simulate-issue"
                onClick={handleInjectSampleAuditIssue}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono transition"
                title="Inject a test draft item with rate=0 and unit mismatch to verify audit highlights"
              >
                <span>+ Test Issue</span>
              </button>

              {/* Dismiss Audit Banner */}
              <button
                id="btn-close-audit"
                onClick={() => {
                  setIsAuditActive(false);
                  setAuditFilterOnlyIssues(false);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOQ COST DISTRIBUTION: MATERIALS, LABOR & OVERHEADS (REAL DATA) */}
      {isDistributionOpen ? (
        <BOQDistributionAnalytics
          items={items}
          currency={currency}
          contingencyPercent={contingencyPercent}
          areaSqFt={areaSqFt}
          onClose={() => setIsDistributionOpen(false)}
        />
      ) : (
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500/40 transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 shrink-0">
              <PieChartIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">BOQ Cost Distribution: Materials, Labor & Overheads</span>
                <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.2 rounded font-mono font-bold">Real Data Breakdown</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Live distribution breakdown across direct materials, craft labor, equipment, and contractor overheads.
              </p>
            </div>
          </div>
          <button
            id="btn-expand-distribution"
            onClick={() => setIsDistributionOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-semibold transition shrink-0 self-start sm:self-auto"
          >
            <PieChartIcon className="w-3.5 h-3.5" />
            <span>Open Cost Distribution</span>
          </button>
        </div>
      )}

      {/* FUTURE COST VARIATION & MATERIAL PRICE INDEX SIMULATOR */}
      {isSimulatorOpen ? (
        <FutureCostSimulator
          items={items}
          currency={currency}
          contingencyPercent={contingencyPercent}
          areaSqFt={areaSqFt}
          onApplyForecastedRates={handleApplyForecastMultiplier}
          onClose={() => setIsSimulatorOpen(false)}
        />
      ) : (
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
              <LineChartIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">Future Cost Variation & Price Index Simulator</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono">36-Mo Historical WPI</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Simulate construction material cost fluctuations over time (Steel Rebar, Cement, Sand, Masonry & Labor) in a predictive line chart.
              </p>
            </div>
          </div>
          <button
            id="btn-expand-simulator"
            onClick={() => setIsSimulatorOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition shrink-0 self-start sm:self-auto"
          >
            <LineChartIcon className="w-3.5 h-3.5" />
            <span>Open Cost Simulator</span>
          </button>
        </div>
      )}

      {/* SECTION: FLOOR-WISE BREAKDOWN & LEVEL NAVIGATION */}
      <div id="section-floor-wise-schedule" className="space-y-4">
        <FloorWiseSummaryCards
          floors={floors}
          floorTotals={floorTotals}
          selectedFloorId={selectedFloorId}
          onSelectFloor={(floorId) => {
            setSelectedFloorId(floorId);
            if (floorId === 'all') {
              setFloorViewMode('matrix');
            } else {
              setFloorViewMode('level_focus');
            }
          }}
          currency={currency}
          onOpenFloorManager={() => setIsFloorManagerOpen(true)}
          onOpenDistributionModal={() => {
            setActiveDistributionItem(null);
            setIsDistributionModalOpen(true);
          }}
        />

        {/* View Mode Switcher & Floor Export Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              id="tab-mode-floor-matrix"
              onClick={() => setFloorViewMode('matrix')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                floorViewMode === 'matrix'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TableProperties className="w-3.5 h-3.5" />
              <span>Floor-Wise Matrix</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                floorViewMode === 'matrix' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-400'
              }`}>
                All Levels
              </span>
            </button>

            <button
              type="button"
              id="tab-mode-single-level"
              onClick={() => {
                setFloorViewMode('level_focus');
                if (selectedFloorId === 'all') {
                  setSelectedFloorId(floors[1]?.id || floors[0]?.id || 'ground_floor');
                }
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                floorViewMode === 'level_focus'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Single Level Focus</span>
              {selectedFloorId !== 'all' && (
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                  floorViewMode === 'level_focus' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-400'
                }`}>
                  {floors.find((f) => f.id === selectedFloorId)?.shortCode || 'Level'}
                </span>
              )}
            </button>

            <button
              type="button"
              id="tab-mode-master-consolidated"
              onClick={() => setFloorViewMode('standard')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                floorViewMode === 'standard'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Master Schedule</span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              id="btn-export-floor-wise-excel"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
              title="Download Schedule of Rates and Quantities broken down by floor level in Microsoft Excel (.xlsx) workbook"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-100" />
              <span>Export Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              id="btn-export-floor-wise-csv"
              onClick={handleExportFloorWiseCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs font-medium transition"
              title="Download Schedule of Rates and Quantities with individual columns for each floor level in Excel-ready CSV format"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV (Excel)</span>
            </button>

            <button
              type="button"
              id="btn-print-floor-report"
              onClick={() => setIsFloorPrintModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-medium transition"
              title="Generate printable / PDF document with complete floor-wise Schedule of Rates & Quantities"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Floor Report & Tender Print</span>
            </button>
          </div>
        </div>

        {/* View Mode 1: Detailed Floor-Wise Matrix Table */}
        {floorViewMode === 'matrix' && (
          <FloorWiseBOQMatrix
            items={items}
            floors={floors}
            floorTotals={floorTotals}
            currency={currency}
            contingencyPercent={contingencyPercent}
            auditResults={auditResults}
            isAuditActive={isAuditActive}
            onUpdateFloorQty={handleUpdateItemFloorQty}
            onUpdateRate={handleUpdateItemRateInMatrix}
            onDeleteItem={handleDeleteItem}
            onOpenItemDistribution={(item) => {
              setActiveDistributionItem(item);
              setIsDistributionModalOpen(true);
            }}
          />
        )}

        {/* View Mode 2: Level-Specific Focus View */}
        {floorViewMode === 'level_focus' && (
          <LevelDetailedBOQTable
            floor={
              floors.find((f) => f.id === selectedFloorId) ||
              floors.find((f) => f.id === 'ground_floor') ||
              floors[0]
            }
            floorTotal={
              floorTotals.find((t) => t.floorId === selectedFloorId) ||
              floorTotals[0]
            }
            items={items}
            allFloors={floors}
            currency={currency}
            contingencyPercent={contingencyPercent}
            onUpdateFloorQty={handleUpdateItemFloorQty}
            onUpdateRate={handleUpdateItemRateInMatrix}
            onCopyFromFloor={handleCopyFromFloor}
            onOpenItemDistribution={(item) => {
              setActiveDistributionItem(item);
              setIsDistributionModalOpen(true);
            }}
          />
        )}
      </div>

      {/* MAIN BOQ ITEM SCHEDULE TABLE (Master Consolidated View) */}
      {floorViewMode === 'standard' && (
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        {/* Banner notification when market prices are updated */}
        {marketUpdateBanner && (
          <div className="p-3 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border-b border-amber-500/30 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
              <div>
                <span className="font-bold text-amber-300 font-mono">{marketUpdateBanner.message}</span>
                {marketUpdateBanner.submessage && (
                  <p className="text-[11px] text-slate-300 mt-0.5 font-mono">{marketUpdateBanner.submessage}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setMarketUpdateBanner(null)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-slate-800 transition font-mono"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Area-Based Takeoff & Market Price Quick Bar */}
        <div className="p-3 bg-gradient-to-r from-amber-500/10 via-slate-950 to-slate-950 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Maximize2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-white font-bold">
                Automatic Takeoff: Built-up Area {areaSqFt.toLocaleString()} sq.ft
              </span>
              <span className="text-slate-400 block text-[11px]">
                Empirical consumption norms (IS 456) scale rebar (3.8 kg/sq.ft), cement (0.42 bags/sq.ft), blocks, tiles and market rates.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-schedule-quick-area-market-sync"
              onClick={() => setIsAreaMarketModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              <span>Update All Quantities with Area & Market</span>
            </button>
          </div>
        </div>

        <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-white font-mono">
              Schedule of Rates & Quantities ({filteredItems.length} items)
            </span>
            {filterCategory !== 'all' && (
              <span className="text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                Filtered: {filterCategory}
              </span>
            )}
            {isAuditActive && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border flex items-center gap-1 ${
                  totalAuditIssues > 0
                    ? 'bg-red-500/20 text-red-300 border-red-500/50'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                }`}
              >
                {totalAuditIssues > 0 ? (
                  <>
                    <AlertTriangle className="w-3 h-3 text-red-400" />
                    <span>Audit Mode: {totalAuditIssues} Issue{totalAuditIssues > 1 ? 's' : ''} Flagged in Red</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Audit Mode: Clean</span>
                  </>
                )}
              </span>
            )}
          </div>

          {/* Schedule Market Price Auto-Update Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Region selector */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1 text-[11px] font-mono text-slate-300">
              <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
              <select
                id="select-schedule-market-region"
                value={activeMarketRegion}
                onChange={(e) => setActiveMarketRegion(e.target.value as MarketRegion)}
                className="bg-transparent text-amber-300 focus:outline-none cursor-pointer text-xs"
                title="Select geographical pricing hub for live market rates"
              >
                {MARKET_REGIONS.map((r) => (
                  <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                    {r.shortName}
                  </option>
                ))}
              </select>
            </div>

            {/* Quality Tier selector */}
            <select
              id="select-schedule-market-tier"
              value={activeMarketTier}
              onChange={(e) => setActiveMarketTier(e.target.value as MarketQualityTier)}
              className="bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none cursor-pointer font-sans"
              title="Select specification quality tier"
            >
              <option value="Economy" className="bg-slate-900">Economy</option>
              <option value="Standard" className="bg-slate-900">Standard</option>
              <option value="Premium" className="bg-slate-900">Premium</option>
              <option value="Luxury" className="bg-slate-900">Luxury</option>
            </select>

            {/* Auto-Update Quantities with Area & Market Price */}
            <button
              id="btn-auto-update-quantities-area-market"
              onClick={() => setIsAreaMarketModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm"
              title="Automatic data update: All Material Quantities with Area & Live Market Prices"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              <span>Update Quantities (Area) & Market</span>
            </button>

            {/* 1-Click Auto-Update Rates to Market Price */}
            <button
              id="btn-auto-update-all-items-market"
              onClick={handleQuickUpdateAllToMarket}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-medium transition"
              title="Automatically update all line items in the Schedule of Rates & Quantities based on live market price"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Rates Only</span>
            </button>

            {/* Open Detailed Comparison & Selective Update Modal */}
            <button
              id="btn-open-market-comparison-modal"
              onClick={() => setIsMarketModalOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition"
              title="Open full side-by-side market comparison and selective calibration"
            >
              <Sliders className="w-3 h-3" />
              <span>Comparison</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50 font-mono text-[11px] text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4 min-w-[240px]">Item Description</th>
                <th className="py-3 px-3 w-32">Category</th>
                <th className="py-3 px-3 w-28 text-center">Unit</th>
                <th className="py-3 px-3 w-28 text-right">Quantity</th>
                <th className="py-3 px-3 w-28 text-right">Unit Rate (₹)</th>
                <th className="py-3 px-4 w-32 text-right">Amount</th>
                <th className="py-3 px-3 w-16 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    {auditFilterOnlyIssues
                      ? 'No flagged items remaining. All items passed the logic audit!'
                      : 'No items in this view. Click "Add Line Item" or "AI BOQ Generator" to populate quantities.'}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, index) => {
                  const audit = isAuditActive ? auditResults[item.id] : null;
                  const hasAuditError = isAuditActive && !!audit?.hasIssues;

                  return (
                    <tr
                      key={item.id}
                      className={`transition group ${
                        hasAuditError
                          ? 'bg-red-950/30 border-l-4 border-l-red-500 hover:bg-red-950/40'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-2.5 px-4 text-center font-mono text-slate-500">
                        {hasAuditError ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400 mx-auto" />
                        ) : (
                          index + 1
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className={`font-medium ${hasAuditError ? 'text-red-100 font-semibold' : 'text-slate-200'}`}>
                            {item.name}
                          </div>
                          {hasAuditError && (
                            <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/25 text-red-300 border border-red-500/50">
                              AUDIT ISSUE
                            </span>
                          )}
                        </div>
                        {item.notes && (
                          <div className="text-[11px] text-slate-400 italic mt-0.5">{item.notes}</div>
                        )}
                        {/* Real-data cost distribution components */}
                        {item.quantity * item.rate > 0 && (
                          <div className="mt-1 flex items-center gap-2 text-[10px] font-mono">
                            {(() => {
                              const fracs = getItemComponentFractions(item);
                              return (
                                <>
                                  <span className="text-sky-400" title="Direct Materials Fraction">
                                    Mat: {(fracs.materialFrac * 100).toFixed(0)}%
                                  </span>
                                  <span className="text-slate-600">•</span>
                                  <span className="text-amber-400" title="Direct Labor Fraction">
                                    Lab: {(fracs.laborFrac * 100).toFixed(0)}%
                                  </span>
                                  <span className="text-slate-600">•</span>
                                  <span className="text-purple-400" title="Equipment Fraction">
                                    Eq: {(fracs.equipmentFrac * 100).toFixed(0)}%
                                  </span>
                                  <span className="text-slate-600">•</span>
                                  <span className="text-rose-400" title="Site Overheads & Margin Fraction">
                                    Ovh: {(fracs.overheadFrac * 100).toFixed(0)}%
                                  </span>
                                </>
                              );
                            })()}
                          </div>
                        )}
                        {/* Audit issue details badge */}
                        {hasAuditError && audit?.issues && audit.issues.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {audit.issues.map((issue, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-red-500/20 text-red-300 border border-red-500/40"
                              >
                                <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                                <span>{issue.message}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        {hasAuditError && audit?.mismatchedUnit ? (
                          <div className="flex flex-col items-center gap-1">
                            <select
                              value={item.unit}
                              onChange={(e) => handleUpdateItemField(item.id, 'unit', e.target.value)}
                              className="px-2 py-1 rounded text-xs font-mono font-bold bg-red-950 border-2 border-red-500 text-red-200 ring-2 ring-red-500/50 focus:outline-none cursor-pointer"
                              title="Mismatched unit: choose corrected unit"
                            >
                              {UNITS.map((u) => (
                                <option key={u} value={u} className="bg-slate-900 text-white font-mono">
                                  {u}
                                </option>
                              ))}
                            </select>
                            <span className="text-[9px] font-mono font-bold text-red-400 uppercase tracking-wider">
                              Mismatched Unit
                            </span>
                            {audit.suggestedUnit && (
                              <button
                                type="button"
                                onClick={() => handleUpdateItemField(item.id, 'unit', audit.suggestedUnit!)}
                                className="text-[9px] text-amber-300 hover:text-amber-200 underline font-mono"
                                title={`Change unit to recommended '${audit.suggestedUnit}'`}
                              >
                                Suggest: {audit.suggestedUnit}
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300">{item.unit}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex flex-col items-end">
                          <input
                            type="number"
                            min={0}
                            step={0.1}
                            value={item.quantity}
                            onChange={(e) => handleUpdateItemField(item.id, 'quantity', e.target.value)}
                            className={`w-24 rounded px-2 py-1 text-right text-xs font-mono focus:outline-none ${
                              hasAuditError && audit?.zeroQuantity
                                ? 'bg-red-950/90 border-2 border-red-500 text-red-200 ring-2 ring-red-500/50 font-bold focus:border-red-400'
                                : 'bg-slate-950 border border-slate-800 text-white focus:border-amber-500'
                            }`}
                          />
                          {hasAuditError && audit?.zeroQuantity && (
                            <span className="text-[9px] text-red-400 font-mono mt-0.5 font-semibold">
                              Qty &gt; 0 req
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex flex-col items-end">
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={item.rate}
                            onChange={(e) => handleUpdateItemField(item.id, 'rate', e.target.value)}
                            className={`w-24 rounded px-2 py-1 text-right text-xs font-mono focus:outline-none ${
                              hasAuditError && audit?.missingRate
                                ? 'bg-red-950/90 border-2 border-red-500 text-red-200 ring-2 ring-red-500/50 font-bold focus:border-red-400'
                                : 'bg-slate-950 border border-slate-800 text-white focus:border-amber-500'
                            }`}
                          />
                          {/* Live Market Price comparison & quick 1-click apply */}
                          {(() => {
                            const match = itemMarketMatches[item.id];
                            if (!match) return null;
                            if (item.rate <= 0) {
                              return (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateSingleItemToMarket(item.id)}
                                  className="mt-1 inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition text-right"
                                  title={`Click to auto-apply prevailing market rate: ₹${match.marketRate.toLocaleString()}`}
                                >
                                  <Zap className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
                                  <span>Auto-Fill: ₹{match.marketRate.toLocaleString()}</span>
                                </button>
                              );
                            }
                            if (match.status === 'exact') {
                              return (
                                <span className="mt-0.5 text-[9px] font-mono text-emerald-400/90 flex items-center gap-0.5">
                                  <Check className="w-2.5 h-2.5 text-emerald-400" />
                                  <span>Mkt: ₹{match.marketRate.toLocaleString()}</span>
                                </span>
                              );
                            }
                            return (
                              <div className="mt-0.5 flex items-center gap-1 text-[9px] font-mono">
                                <span className={match.rateDelta > 0 ? 'text-amber-400' : 'text-sky-400'}>
                                  Mkt: ₹{match.marketRate.toLocaleString()} ({match.percentDelta > 0 ? `+${match.percentDelta}%` : `${match.percentDelta}%`})
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateSingleItemToMarket(item.id)}
                                  className="text-amber-300 hover:text-amber-200 underline font-semibold"
                                  title={`Update this item to market price ₹${match.marketRate.toLocaleString()}`}
                                >
                                  Sync
                                </button>
                              </div>
                            );
                          })()}
                          {hasAuditError && audit?.missingRate && (
                            <span className="text-[9px] text-red-400 font-mono mt-0.5 font-bold">
                              Missing Rate (₹0)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold">
                        {hasAuditError && (audit?.missingRate || audit?.zeroQuantity) ? (
                          <span className="text-red-400 font-bold">
                            ₹0 (Pending)
                          </span>
                        ) : (
                          <span className="text-amber-400">
                            {formatCurrency(item.quantity * item.rate, currency)}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateSingleItemToMarket(item.id)}
                            className="text-slate-500 hover:text-amber-400 transition p-1"
                            title={`Sync to live market rate (₹${itemMarketMatches[item.id]?.marketRate.toLocaleString() || 'Market'})`}
                          >
                            <Zap className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-slate-500 hover:text-red-400 transition p-1"
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
            <tfoot>
              {/* Subtotal */}
              <tr className="border-t border-slate-700 bg-slate-950 font-mono font-bold text-xs">
                <td colSpan={6} className="py-3 px-4 text-right text-slate-300">
                  Subtotal Civil & Finishing Works:
                </td>
                <td className="py-3 px-4 text-right text-white">
                  {formatCurrency(subtotal, currency)}
                </td>
                <td></td>
              </tr>

              {/* Contingency */}
              <tr className="bg-slate-950 font-mono text-xs">
                <td colSpan={6} className="py-2 px-4 text-right text-amber-400 font-medium">
                  Design Contingency Reserve ({contingencyPercent}%):
                </td>
                <td className="py-2 px-4 text-right text-amber-400 font-bold">
                  {formatCurrency(contingencyAmount, currency)}
                </td>
                <td></td>
              </tr>

              {/* Grand Total */}
              <tr className="bg-slate-950 font-mono text-sm border-t border-slate-700">
                <td colSpan={6} className="py-3 px-4 text-right text-amber-400 font-bold uppercase tracking-wider">
                  Grand Estimated Total:
                </td>
                <td className="py-3 px-4 text-right text-amber-400 font-extrabold text-base">
                  {formatCurrency(totalEstimate, currency)}
                </td>
                <td></td>
              </tr>

              {/* Unit Rate per sq.ft summary row */}
              <tr className="bg-slate-950/90 font-mono text-xs border-t border-slate-800/80">
                <td colSpan={6} className="py-2.5 px-4 text-right text-emerald-400 font-semibold">
                  Unit Rate per sq.ft ({areaSqFt.toLocaleString()} sq.ft plinth):
                </td>
                <td className="py-2.5 px-4 text-right text-emerald-400 font-bold text-sm">
                  {formatCurrency(currentRatePerSqFt, currency)} / sq.ft
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      )}

      {/* MODAL 6: AUTOMATIC MARKET PRICE UPDATE & COMPARISON */}
      <MarketPriceAutoUpdateModal
        items={items}
        currency={currency}
        areaSqFt={areaSqFt}
        isOpen={isMarketModalOpen}
        onClose={() => setIsMarketModalOpen(false)}
        initialRegion={activeMarketRegion}
        onApplyRates={(updatedItems) => {
          onUpdateItems(updatedItems);
          setMarketUpdateBanner({
            message: `Updated ${updatedItems.length} items to prevailing market rates (${MARKET_REGIONS.find((r) => r.id === activeMarketRegion)?.shortName || 'Market Hub'}).`,
            submessage: `All rates, amounts, subtotal, and cost distribution components have been automatically recalculated.`,
          });
        }}
      />

      {/* MODAL 7: AUTOMATIC AREA & MARKET PRICE TAKEOFF UPDATE */}
      <AreaTakeoffAutoUpdateModal
        items={items}
        currentAreaSqFt={areaSqFt}
        currency={currency}
        isOpen={isAreaMarketModalOpen}
        onClose={() => setIsAreaMarketModalOpen(false)}
        initialRegion={activeMarketRegion}
        initialTier={activeMarketTier}
        initialPricingBasis={activeMarketBasis}
        onApplyUpdate={handleApplyAreaAndMarketUpdate}
      />

      {/* MODAL 8: CONFIGURE BUILDING LEVELS & FLOOR AREAS */}
      <BuildingFloorManagerModal
        isOpen={isFloorManagerOpen}
        onClose={() => setIsFloorManagerOpen(false)}
        floors={floors}
        onSaveFloors={setFloors}
      />

      {/* MODAL 9: FLOOR-WISE QUANTITY DISTRIBUTION TOOLS */}
      <FloorDistributionModal
        isOpen={isDistributionModalOpen}
        onClose={() => {
          setIsDistributionModalOpen(false);
          setActiveDistributionItem(null);
        }}
        floors={floors}
        activeItem={activeDistributionItem}
        allItems={items}
        onUpdateItem={(upd) => onUpdateItems(items.map((i) => (i.id === upd.id ? upd : i)))}
        onUpdateAllItems={onUpdateItems}
      />

      {/* MODAL 10: PRINT & EXPORT FLOOR-WISE REPORT */}
      <FloorWisePrintReportModal
        isOpen={isFloorPrintModalOpen}
        onClose={() => setIsFloorPrintModalOpen(false)}
        project={activeProject}
        items={items}
        floors={floors}
        floorTotals={floorTotals}
        currency={currency}
        contingencyPercent={contingencyPercent}
      />
    </div>
  );
};
