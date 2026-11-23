import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Calculator,
  Plus,
  Trash2,
  Sparkles,
  Download,
  Sliders,
  FileSpreadsheet,
  Check,
  Building,
  TrendingUp,
  TrendingDown,
  Send,
  RefreshCw,
  AlertTriangle,
  PieChart as PieChartIcon,
  Zap,
  MapPin,
  FileDown,
  HardHat,
  Search,
  CheckCircle2,
  X,
  Bot,
  Layers,
  ExternalLink,
  Radio,
} from 'lucide-react';
import { BOQItem, Project, MarketplaceEnquiry, BuildingFloor, LiveMaterialPrice } from '../types';
import { formatCurrency, CurrencyCode } from '../utils/formatters';
import { BOQAreaAgentCalculator } from './BOQAreaAgentCalculator';
import { BOQDistributionAnalytics } from './BOQDistributionAnalytics';
import { MarketPriceAutoUpdateModal } from './MarketPriceAutoUpdateModal';
import { BOQRealTimePriceMonitor } from './BOQRealTimePriceMonitor';
import { BimBoqMaterialNewsWire } from './BimBoqMaterialNewsWire';
import { AreaTakeoffAutoUpdateModal } from './AreaTakeoffAutoUpdateModal';
import { LabourCostBreakdownModal } from './LabourCostBreakdownModal';
import {
  LABOUR_SCHEDULE_BENCHMARKS,
  LabourRateMode,
  LabourTradeBenchmark,
  calculateLabourScheduleForArea,
  applyLabourScheduleToBOQ,
  getMissingTradesFromBOQ,
  createBOQItemFromLabourTrade,
  matchItemToLabourTrade,
} from '../utils/labourRateEngine';
import {
  MARKET_REGIONS,
  MarketRegion,
  MarketPricingBasis,
  MarketQualityTier,
  matchBOQItemToMarket,
  autoUpdateBOQItemsWithMarketRates,
} from '../utils/marketPriceEngine';
import { BuildingFloorManagerModal } from './BuildingFloorManagerModal';
import { FloorDistributionModal } from './FloorDistributionModal';
import { FloorWisePrintReportModal } from './FloorWisePrintReportModal';
import {
  DEFAULT_BUILDING_FLOORS,
  calculateFloorWiseTotals,
  ensureItemFloorBreakdown,
  scaleFloorAreasToTotal,
} from '../utils/floorTakeoffEngine';
import { autoUpdateBOQItemsWithAreaAndMarketPrice } from '../utils/materialTakeoffEngine';
import { exportBOQToExcel, exportBOQToExcelCSV } from '../utils/excelExport';
import { SNK_BUILDING_FLOORS, getSNKStandardBOQItems } from '../data/snkQuotationFormat';

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

export const checkBOQItemAudit = (item: BOQItem): ItemAuditStatus => {
  const issues: ItemAuditIssue[] = [];
  const rateNum = Number(item.rate);
  const qtyNum = Number(item.quantity);

  const missingRate =
    item.rate === null || item.rate === undefined || isNaN(rateNum) || rateNum <= 0;
  if (missingRate) {
    issues.push({
      type: 'rate',
      field: 'rate',
      message: rateNum === 0 ? 'Missing unit rate (₹0)' : 'Unspecified unit rate',
      suggestedFix: 'Enter a valid unit rate',
    });
  }

  const zeroQuantity =
    item.quantity === null || item.quantity === undefined || isNaN(qtyNum) || qtyNum <= 0;
  if (zeroQuantity) {
    issues.push({
      type: 'quantity',
      field: 'quantity',
      message: 'Quantity must be greater than 0',
      suggestedFix: 'Enter a positive quantity',
    });
  }

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
      message: 'Unit of measurement is blank',
      suggestedFix: 'Select an appropriate unit',
    });
  } else {
    const isSteel =
      name.includes('steel') ||
      name.includes('rebar') ||
      name.includes('tmt') ||
      name.includes('reinforcement');
    if (isSteel) {
      if (!['mt', 'kg', 'tonne', 'ton', 't'].includes(unit)) {
        mismatchedUnit = true;
        suggestedUnit = 'MT';
        issues.push({
          type: 'unit',
          field: 'unit',
          message: `Steel measured in '${rawUnit}', expected MT or kg`,
          suggestedFix: 'Switch unit to MT',
        });
      }
    } else if (
      (name.includes('concrete') ||
        name.includes('rcc') ||
        name.includes('pcc') ||
        name.includes('casting') ||
        cat === 'concrete works') &&
      !name.includes('block') &&
      !name.includes('paver') &&
      !name.includes('cement')
    ) {
      if (['nos', 'lump sum', 'r.m', 'kg', 'mt'].includes(unit)) {
        mismatchedUnit = true;
        suggestedUnit = 'm3';
        issues.push({
          type: 'unit',
          field: 'unit',
          message: `Concrete measured in '${rawUnit}', expected m3`,
          suggestedFix: 'Switch unit to m3',
        });
      }
    } else if (
      name.includes('excavation') ||
      name.includes('earthwork') ||
      (cat === 'substructure' && name.includes('trench'))
    ) {
      if (['nos', 'mt', 'kg', 'lump sum', 'r.m'].includes(unit)) {
        mismatchedUnit = true;
        suggestedUnit = 'm3';
        issues.push({
          type: 'unit',
          field: 'unit',
          message: `Excavation measured in '${rawUnit}', expected m3`,
          suggestedFix: 'Switch unit to m3',
        });
      }
    } else if (
      cat === 'finishes' ||
      name.includes('plaster') ||
      name.includes('paint') ||
      name.includes('tiling') ||
      name.includes('flooring') ||
      name.includes('tile') ||
      name.includes('granite') ||
      name.includes('marble')
    ) {
      const isLinear =
        name.includes('skirting') ||
        name.includes('border') ||
        name.includes('cornice') ||
        name.includes('coving');
      if (isLinear) {
        if (!['r.m', 'm', 'rmt'].includes(unit)) {
          mismatchedUnit = true;
          suggestedUnit = 'r.m';
          issues.push({
            type: 'unit',
            field: 'unit',
            message: `Linear skirting measured in '${rawUnit}', expected r.m`,
            suggestedFix: 'Switch unit to r.m',
          });
        }
      } else if (['m3', 'mt', 'kg', 'nos'].includes(unit)) {
        mismatchedUnit = true;
        suggestedUnit = 'sq.m';
        issues.push({
          type: 'unit',
          field: 'unit',
          message: `Surface finish measured in '${rawUnit}', expected sq.m or sq.ft`,
          suggestedFix: 'Switch unit to sq.m',
        });
      }
    } else if (
      cat === 'masonry' ||
      name.includes('brick') ||
      name.includes('block') ||
      name.includes('masonry')
    ) {
      if (['mt', 'kg', 'r.m'].includes(unit)) {
        mismatchedUnit = true;
        suggestedUnit = 'm3';
        issues.push({
          type: 'unit',
          field: 'unit',
          message: `Masonry measured in '${rawUnit}', expected m3, sq.m, or nos`,
          suggestedFix: 'Switch unit to m3',
        });
      }
    } else if (
      cat === 'doors & windows' ||
      name.includes('door') ||
      name.includes('window') ||
      name.includes('ventilator')
    ) {
      if (['m3', 'mt', 'kg', 'r.m'].includes(unit)) {
        mismatchedUnit = true;
        suggestedUnit = 'nos';
        issues.push({
          type: 'unit',
          field: 'unit',
          message: `Doors/windows measured in '${rawUnit}', expected nos or sq.m`,
          suggestedFix: 'Switch unit to nos',
        });
      }
    } else if (
      (cat === 'plumbing' || cat === 'mep & electrical') &&
      (name.includes('pipe') ||
        name.includes('conduit') ||
        name.includes('drainage') ||
        name.includes('wiring'))
    ) {
      if (['m3', 'mt', 'sq.m', 'sq.ft'].includes(unit)) {
        mismatchedUnit = true;
        suggestedUnit = 'r.m';
        issues.push({
          type: 'unit',
          field: 'unit',
          message: `Piping/conduits measured in '${rawUnit}', expected r.m`,
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
  onOpenWorkflowEngine?: () => void;
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
    tag: 'Budget',
    description: 'Cost-optimized construction with reliable standard materials.',
    features: ['Red brick / Fly-ash', '2x2 Vitrified tiles', 'Standard UPVC windows', 'PVC/GI plumbing'],
    accentColor: 'text-sky-400',
    badgeBg: 'bg-sky-500/10',
    badgeBorder: 'border-sky-500/30',
  },
  {
    tier: 'Standard / Quality',
    minRate: 1800,
    maxRate: 2450,
    typicalRate: 2150,
    tag: 'Recommended',
    description: 'Balanced contemporary specification with branded structural & finishing materials.',
    features: ['M25 RMC framing', 'AAC blockwork', '4x2 Glazed tiles', 'Jaquar/Kohler & Schneider'],
    accentColor: 'text-amber-400',
    badgeBg: 'bg-amber-500/10',
    badgeBorder: 'border-amber-500/30',
  },
  {
    tier: 'Premium Architectural',
    minRate: 2500,
    maxRate: 3600,
    typicalRate: 3050,
    tag: 'High Spec',
    description: 'Architectural finish with acoustic glazing and large-format flooring.',
    features: ['Engineered RCC', 'Imported marble / slabs', 'Double-glazed aluminum', 'Grohe/Toto sanitary'],
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
    description: 'Bespoke luxury villa specification with stone cladding and HVAC.',
    features: ['Italian Statuario marble', 'Structural glazing', 'VRV/VRF central HVAC', 'Bespoke landscape'],
    accentColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10',
    badgeBorder: 'border-emerald-500/30',
  },
];

const SQFT_PRESETS = [
  { label: '1,200 sq.ft', value: 1200 },
  { label: '2,000 sq.ft', value: 2000 },
  { label: '3,000 sq.ft', value: 3000 },
  { label: '5,000 sq.ft', value: 5000 },
];

type BoqWorkspaceTab = 'schedule' | 'auto_build' | 'market_labour' | 'analytics_tender';

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
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<BoqWorkspaceTab>('schedule');

  // Built-up area state
  const [areaSqFt, setAreaSqFt] = useState<number>(() =>
    activeProject.builtUpAreaSqFt && activeProject.builtUpAreaSqFt > 0
      ? activeProject.builtUpAreaSqFt
      : 3000
  );
  const [areaDraft, setAreaDraft] = useState<number>(areaSqFt);

  useEffect(() => {
    if (activeProject.builtUpAreaSqFt && activeProject.builtUpAreaSqFt > 0) {
      setAreaSqFt(activeProject.builtUpAreaSqFt);
      setAreaDraft(activeProject.builtUpAreaSqFt);
    }
  }, [activeProject.id, activeProject.builtUpAreaSqFt]);

  // Floors state (synchronized seamlessly behind the scenes)
  const [floors, setFloors] = useState<BuildingFloor[]>(() => {
    if (activeProject.floors && activeProject.floors.length > 0) return activeProject.floors;
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
    if (activeProject.floors && activeProject.floors.length > 0) {
      setFloors(activeProject.floors);
    }
  }, [activeProject.id, activeProject.floors]);

  useEffect(() => {
    try {
      localStorage.setItem('gouse_ai_building_floors', JSON.stringify(floors));
    } catch {}
  }, [floors]);

  // Simple filtering & inline editing states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showAuditHighlight, setShowAuditHighlight] = useState(false);
  const [showOffMarketOnly, setShowOffMarketOnly] = useState(false);

  // Quick Add Item row / modal
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState(CATEGORIES[0]);
  const [newItemUnit, setNewItemUnit] = useState(UNITS[0]);
  const [newItemQty, setNewItemQty] = useState<number>(10);
  const [newItemRate, setNewItemRate] = useState<number>(500);
  const [newItemNotes, setNewItemNotes] = useState('');

  // Inline table quick-add row
  const [quickName, setQuickName] = useState('');
  const [quickCategory, setQuickCategory] = useState(CATEGORIES[1]);
  const [quickUnit, setQuickUnit] = useState(UNITS[0]);
  const [quickQty, setQuickQty] = useState<number>(10);
  const [quickRate, setQuickRate] = useState<number>(6500);

  // Market calibration & region settings
  const [activeMarketRegion, setActiveMarketRegion] = useState<MarketRegion>(() => {
    const loc = (activeProject.location || '').toLowerCase();
    if (loc.includes('mumbai')) return 'mumbai';
    if (loc.includes('hyderabad')) return 'hyderabad';
    if (loc.includes('delhi') || loc.includes('ncr')) return 'delhi';
    if (loc.includes('chennai')) return 'chennai';
    if (loc.includes('bangalore') || loc.includes('bengaluru')) return 'bangalore';
    return 'bangalore';
  });
  const [activeMarketTier, setActiveMarketTier] = useState<MarketQualityTier>('Standard');
  const [activeMarketBasis] = useState<MarketPricingBasis>('spot_market');
  const [targetRatePerSqFt, setTargetRatePerSqFt] = useState<number>(2150);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Real-Time Live Market Data State (connected to /api/materials/live-prices & /api/materials/radar-alerts)
  const [livePrices, setLivePrices] = useState<LiveMaterialPrice[]>([]);
  const [liveSources, setLiveSources] = useState<Array<{ title: string; uri: string }>>([]);
  const [liveDataMode, setLiveDataMode] = useState<'live_search' | 'regional_benchmark' | 'syncing'>('syncing');
  const [liveLastSynced, setLiveLastSynced] = useState<Date | null>(null);
  const [isLiveFetching, setIsLiveFetching] = useState<boolean>(false);
  const [autoRefreshLive, setAutoRefreshLive] = useState<boolean>(true);
  const liveFetchRef = useRef<boolean>(false);

  // Modals
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

  const [isMarketModalOpen, setIsMarketModalOpen] = useState(false);
  const [isAreaMarketModalOpen, setIsAreaMarketModalOpen] = useState(false);
  const [isLabourBreakdownModalOpen, setIsLabourBreakdownModalOpen] = useState(false);
  const [isFloorManagerOpen, setIsFloorManagerOpen] = useState(false);
  const [isDistributionModalOpen, setIsDistributionModalOpen] = useState(false);
  const [activeDistributionItem, setActiveDistributionItem] = useState<BOQItem | null>(null);
  const [isFloorPrintModalOpen, setIsFloorPrintModalOpen] = useState(false);

  // Simple Labour & Market Rates states (Tab 3)
  const [labourRateMode, setLabourRateMode] = useState<LabourRateMode>('avg');
  const [customLabourRates, setCustomLabourRates] = useState<Record<string, number>>({});
  const [marketSearchQuery, setMarketSearchQuery] = useState('');
  const [showAdvancedAlertsAndNews, setShowAdvancedAlertsAndNews] = useState(false);

  // Tender Enquiry modal
  const [isEnquiryModal, setIsEnquiryModal] = useState(false);
  const [enquirySuccess, setEnquirySuccess] = useState(false);
  const [enquiryClientName, setEnquiryClientName] = useState('Ar. S. Gouse');
  const [enquiryClientEmail, setEnquiryClientEmail] = useState('sgouse14@gmail.com');
  const [enquiryClientPhone, setEnquiryClientPhone] = useState('+91 8073947241');
  const [enquiryTenderNotes, setEnquiryTenderNotes] = useState('');

  const activeRegionMeta = useMemo(
    () => MARKET_REGIONS.find((r) => r.id === activeMarketRegion) || MARKET_REGIONS[0],
    [activeMarketRegion]
  );

  const fetchLiveMarketFeed = useCallback(
    async (forceRefresh = false) => {
      if (liveFetchRef.current) return;
      liveFetchRef.current = true;
      setIsLiveFetching(true);
      try {
        const locationLabel =
          activeMarketRegion === 'national'
            ? activeProject.location || 'India National Benchmark'
            : activeRegionMeta.name;

        const res = await fetch('/api/materials/live-prices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: locationLabel,
            category: 'all',
            customQuery: 'cement tmt steel rmc concrete sand aac blocks vitrified tiles paint',
            forceRefresh,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.prices) && data.prices.length > 0) {
            setLivePrices(data.prices);
          }
          if (Array.isArray(data.sources)) {
            setLiveSources(data.sources.slice(0, 3));
          }
          setLiveDataMode(data.dataMode === 'live_search' ? 'live_search' : 'regional_benchmark');
          setLiveLastSynced(new Date());
          if (forceRefresh) {
            setStatusNotice(`Refreshed real-time market rates for ${activeRegionMeta.shortName}.`);
          }
        }
      } catch (_err) {
        setLiveDataMode('regional_benchmark');
      } finally {
        liveFetchRef.current = false;
        setIsLiveFetching(false);
      }
    },
    [activeMarketRegion, activeRegionMeta.name, activeRegionMeta.shortName, activeProject.location]
  );

  useEffect(() => {
    fetchLiveMarketFeed(false);
  }, [fetchLiveMarketFeed]);

  useEffect(() => {
    if (!autoRefreshLive) return;
    const timer = setInterval(() => {
      fetchLiveMarketFeed(false);
    }, 60000);
    return () => clearInterval(timer);
  }, [autoRefreshLive, fetchLiveMarketFeed]);

  // Core Calculations
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.rate, 0),
    [items]
  );

  const contingencyAmount = useMemo(
    () => (subtotal * contingencyPercent) / 100,
    [subtotal, contingencyPercent]
  );

  const totalEstimate = useMemo(() => subtotal + contingencyAmount, [subtotal, contingencyAmount]);

  const currentRatePerSqFt = useMemo(() => {
    if (areaSqFt <= 0) return 0;
    return Math.round(totalEstimate / areaSqFt);
  }, [totalEstimate, areaSqFt]);

  const gstAmount = useMemo(() => Math.round(totalEstimate * 0.18), [totalEstimate]);

  const currentMarketTier = useMemo(() => {
    if (currentRatePerSqFt < 1750) return MARKET_BENCHMARKS[0];
    if (currentRatePerSqFt < 2500) return MARKET_BENCHMARKS[1];
    if (currentRatePerSqFt < 3700) return MARKET_BENCHMARKS[2];
    return MARKET_BENCHMARKS[3];
  }, [currentRatePerSqFt]);

  const labourSchedule = useMemo(
    () => calculateLabourScheduleForArea(areaSqFt || 1000, labourRateMode),
    [areaSqFt, labourRateMode]
  );

  const regionalLabourRows = useMemo(() => {
    const mul = activeRegionMeta.laborMultiplier || 1;
    return labourSchedule.trades.map((entry) => {
      const defaultRate = Math.round(entry.appliedRate * mul);
      const activeRate =
        customLabourRates[entry.benchmark.id] !== undefined
          ? customLabourRates[entry.benchmark.id]
          : defaultRate;
      const baseRate = Math.max(1, entry.appliedRate);
      const scaledCost = Math.round(entry.scaledCost * mul * (activeRate / Math.max(1, defaultRate)));
      const linkedCount = items.filter((it) => matchItemToLabourTrade(it)?.id === entry.benchmark.id).length;
      return {
        benchmark: entry.benchmark,
        defaultRate,
        activeRate,
        baseRate,
        scaledCost,
        linkedCount,
      };
    });
  }, [labourSchedule.trades, activeRegionMeta.laborMultiplier, customLabourRates, items]);

  const regionalLabourTotal = useMemo(
    () => regionalLabourRows.reduce((s, r) => s + r.scaledCost, 0),
    [regionalLabourRows]
  );

  const regionalLabourPerSqFt = useMemo(
    () => (areaSqFt > 0 ? Math.round(regionalLabourTotal / areaSqFt) : 0),
    [regionalLabourTotal, areaSqFt]
  );

  const missingLabourTrades = useMemo(() => getMissingTradesFromBOQ(items), [items]);

  const filteredLivePrices = useMemo(() => {
    const q = marketSearchQuery.trim().toLowerCase();
    if (!q) return livePrices;
    return livePrices.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.brands || []).some((b) => b.toLowerCase().includes(q))
    );
  }, [livePrices, marketSearchQuery]);

  const { floorTotals } = useMemo(
    () => calculateFloorWiseTotals(items, floors, contingencyPercent),
    [items, floors, contingencyPercent]
  );

  const itemMarketMatches = useMemo(() => {
    const tierMul =
      activeMarketTier === 'Economy'
        ? 0.88
        : activeMarketTier === 'Premium'
        ? 1.18
        : activeMarketTier === 'Luxury'
        ? 1.38
        : 1.0;

    const map: Record<
      string,
      ReturnType<typeof matchBOQItemToMarket> & {
        liveRate: number;
        liveSourceLabel: string;
        liveTrend: 'up' | 'down' | 'stable';
        liveChangePct: number;
        deltaVsCurrentPct: number;
        isLiveApi: boolean;
      }
    > = {};

    items.forEach((it) => {
      const baseMatch = matchBOQItemToMarket(it, activeMarketRegion, activeMarketTier, activeMarketBasis);
      const normName = (it.name || '').toLowerCase();
      const normUnit = (it.unit || '').toLowerCase();

      let apiMatched: LiveMaterialPrice | undefined;
      let adjustedApiRate = 0;

      if (livePrices.length > 0) {
        if (normName.includes('tmt') || normName.includes('steel') || normName.includes('rebar')) {
          apiMatched = livePrices.find(
            (p) => p.name.toLowerCase().includes('tmt') || p.name.toLowerCase().includes('steel')
          );
          if (apiMatched) {
            adjustedApiRate = apiMatched.currentPrice;
            if (normUnit === 'kg' && adjustedApiRate > 1000) adjustedApiRate = Math.round(adjustedApiRate / 1000);
            else if (normUnit === 'mt' && adjustedApiRate < 1000) adjustedApiRate = Math.round(adjustedApiRate * 1000);
          }
        } else if (normName.includes('rmc') || (normName.includes('concrete') && !normName.includes('block') && !normName.includes('pcc'))) {
          apiMatched = livePrices.find(
            (p) => p.name.toLowerCase().includes('ready-mix') || p.name.toLowerCase().includes('rmc')
          );
          if (apiMatched && normUnit === 'm3') {
            adjustedApiRate = Math.round(apiMatched.currentPrice * tierMul * 1.45); // placed RCC w/ formwork & labor
          }
        } else if (normName.includes('aac') || normName.includes('block')) {
          apiMatched = livePrices.find((p) => p.name.toLowerCase().includes('aac'));
          if (apiMatched && normUnit === 'm3') {
            adjustedApiRate = Math.round(apiMatched.currentPrice * tierMul);
          }
        } else if (normName.includes('cement') && (normUnit.includes('bag') || normUnit === 'nos')) {
          apiMatched = livePrices.find((p) => p.name.toLowerCase().includes('cement'));
          if (apiMatched) {
            adjustedApiRate = Math.round(apiMatched.currentPrice * tierMul);
          }
        } else if (normName.includes('paint') || normName.includes('emulsion')) {
          apiMatched = livePrices.find((p) => p.name.toLowerCase().includes('paint'));
          if (apiMatched && (normUnit.includes('drum') || normUnit === 'nos')) {
            adjustedApiRate = Math.round(apiMatched.currentPrice * tierMul);
          }
        } else if (normName.includes('glaz') || normName.includes('glass') || normName.includes('window')) {
          apiMatched = livePrices.find((p) => p.name.toLowerCase().includes('glaz'));
          if (apiMatched && normUnit === 'sq.m') {
            adjustedApiRate = Math.round(apiMatched.currentPrice * tierMul);
          }
        }
      }

      const liveRate = adjustedApiRate > 0 ? adjustedApiRate : baseMatch.marketRate;
      const curRate = Number(it.rate) || 0;
      const deltaVsCurrentPct =
        curRate > 0 ? Number((((liveRate - curRate) / curRate) * 100).toFixed(1)) : 100;

      map[it.id] = {
        ...baseMatch,
        liveRate,
        liveSourceLabel: apiMatched
          ? liveDataMode === 'live_search'
            ? 'Live Google Index'
            : `Live API (${activeRegionMeta.shortName})`
          : `DSR Spot (${activeRegionMeta.shortName})`,
        liveTrend: apiMatched?.trend || (baseMatch.rateDelta > 0 ? 'up' : baseMatch.rateDelta < 0 ? 'down' : 'stable'),
        liveChangePct: apiMatched?.changePercent ?? 0,
        deltaVsCurrentPct,
        isLiveApi: Boolean(apiMatched),
      };
    });

    return map;
  }, [items, activeMarketRegion, activeMarketTier, activeMarketBasis, livePrices, liveDataMode, activeRegionMeta.shortName]);

  const offMarketCount = useMemo(() => {
    return items.filter((it) => {
      const m = itemMarketMatches[it.id];
      return m && (it.rate <= 0 || Math.abs(m.deltaVsCurrentPct) >= 2);
    }).length;
  }, [items, itemMarketMatches]);

  const auditResults = useMemo(() => {
    const map: Record<string, ItemAuditStatus> = {};
    items.forEach((item) => {
      map[item.id] = checkBOQItemAudit(item);
    });
    return map;
  }, [items]);

  const itemsWithIssuesCount = useMemo(
    () => Object.values(auditResults).filter((s) => s.hasIssues).length,
    [auditResults]
  );

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (filterCategory !== 'all' && item.category !== filterCategory) return false;
      if (showAuditHighlight && !auditResults[item.id]?.hasIssues) return false;
      if (showOffMarketOnly) {
        const m = itemMarketMatches[item.id];
        if (!m || (item.rate > 0 && Math.abs(m.deltaVsCurrentPct) < 2)) return false;
      }
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.unit.toLowerCase().includes(q) ||
        (item.notes || '').toLowerCase().includes(q)
      );
    });
  }, [items, filterCategory, showAuditHighlight, showOffMarketOnly, itemMarketMatches, auditResults, searchQuery]);

  const showToast = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => {
      setStatusNotice((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Handlers
  const handleApplyAreaChange = (newSqFt: number, scaleQuantities = true) => {
    const validSqFt = Math.max(100, Math.round(newSqFt));
    const prevSqFt = areaSqFt > 0 ? areaSqFt : 3000;

    if (scaleQuantities && prevSqFt > 0 && validSqFt !== prevSqFt) {
      const { updatedItems } = autoUpdateBOQItemsWithAreaAndMarketPrice(
        items,
        validSqFt,
        prevSqFt,
        {
          regionId: activeMarketRegion,
          tier: activeMarketTier,
          pricingBasis: activeMarketBasis,
          updateQuantitiesWithArea: true,
          updateRatesWithMarketPrice: false,
          floors,
        }
      );
      onUpdateItems(updatedItems);
      const scaledFloors = scaleFloorAreasToTotal(floors, validSqFt);
      setFloors(scaledFloors);
      if (onUpdateProject) {
        onUpdateProject({
          ...activeProject,
          floors: scaledFloors,
          builtUpAreaSqFt: validSqFt,
        });
      }
      showToast(`Scaled all BOQ quantities to ${validSqFt.toLocaleString()} sq.ft.`);
    } else if (onUpdateProject) {
      onUpdateProject({ ...activeProject, builtUpAreaSqFt: validSqFt });
      showToast(`Updated built-up area to ${validSqFt.toLocaleString()} sq.ft.`);
    }

    setAreaSqFt(validSqFt);
    setAreaDraft(validSqFt);
    setAiAreaSqFt(validSqFt);
  };

  const handleCalibrateToRate = (targetRate: number) => {
    if (targetRate <= 0 || areaSqFt <= 0 || subtotal <= 0) return;
    const targetTotal = targetRate * areaSqFt;
    const targetSubtotal = targetTotal / (1 + contingencyPercent / 100);
    const multiplier = targetSubtotal / subtotal;

    const calibrated = items.map((item) => {
      const nextRate = Math.max(1, Math.round(item.rate * multiplier));
      return {
        ...item,
        rate: nextRate,
        amount: Math.round(item.quantity * nextRate),
      };
    });
    onUpdateItems(calibrated);
    setTargetRatePerSqFt(targetRate);
    showToast(`Calibrated all item rates to ≈ ₹${targetRate.toLocaleString()}/sq.ft.`);
  };

  const handleUpdateItemField = (id: string, field: keyof BOQItem, value: any) => {
    const updated = items.map((item) => {
      if (item.id !== id) return item;
      const next = { ...item, [field]: value };
      if (field === 'quantity' || field === 'rate') {
        const q = field === 'quantity' ? Math.max(0, Number(value) || 0) : item.quantity;
        const r = field === 'rate' ? Math.max(0, Number(value) || 0) : item.rate;
        next.quantity = q;
        next.rate = r;
        next.amount = Math.round(q * r);
      }
      return next;
    });
    onUpdateItems(updated);
  };

  const handleDeleteItem = (id: string) => {
    onUpdateItems(items.filter((it) => it.id !== id));
  };

  const handleQuickAddRow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) return;
    const q = Math.max(0, Number(quickQty) || 0);
    const r = Math.max(0, Number(quickRate) || 0);
    const item = ensureItemFloorBreakdown(
      {
        id: `boq-${Date.now()}`,
        name: quickName.trim(),
        category: quickCategory,
        unit: quickUnit,
        quantity: q,
        rate: r,
        amount: Math.round(q * r),
        notes: '',
      },
      floors
    );
    onUpdateItems([...items, item]);
    setQuickName('');
    showToast(`Added "${item.name}" to schedule.`);
  };

  const handleAddItemModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    const q = Math.max(0, Number(newItemQty) || 0);
    const r = Math.max(0, Number(newItemRate) || 0);
    const item = ensureItemFloorBreakdown(
      {
        id: `boq-${Date.now()}`,
        name: newItemName.trim(),
        category: newItemCategory,
        unit: newItemUnit,
        quantity: q,
        rate: r,
        amount: Math.round(q * r),
        notes: newItemNotes.trim(),
      },
      floors
    );
    onUpdateItems([...items, item]);
    setNewItemName('');
    setNewItemNotes('');
    setIsAddingItem(false);
    showToast(`Added "${item.name}" to schedule.`);
  };

  const handleQuickSyncMarket = () => {
    let syncedCount = 0;
    const updated = items.map((it) => {
      const m = itemMarketMatches[it.id];
      const audit = auditResults[it.id];
      const nextUnit = audit?.mismatchedUnit && audit.suggestedUnit ? audit.suggestedUnit : it.unit;
      if (!m) return it;
      const nextRate = m.liveRate > 0 ? m.liveRate : it.rate;
      if (nextRate !== it.rate || nextUnit !== it.unit) syncedCount++;
      return {
        ...it,
        rate: nextRate,
        unit: nextUnit,
        amount: Math.round(it.quantity * nextRate),
      };
    });
    onUpdateItems(updated);
    showToast(
      `Synced ${syncedCount > 0 ? syncedCount : updated.length} BOQ items to live ${activeRegionMeta.shortName} rates.`
    );
  };

  const handleAutoFixUnits = () => {
    let fixed = 0;
    const updated = items.map((item) => {
      const audit = auditResults[item.id];
      if (audit?.mismatchedUnit && audit.suggestedUnit) {
        fixed++;
        return { ...item, unit: audit.suggestedUnit };
      }
      return item;
    });
    if (fixed > 0) {
      onUpdateItems(updated);
      showToast(`Auto-fixed ${fixed} unit mismatch${fixed > 1 ? 'es' : ''}.`);
    }
  };

  const handleApplySingleMarketRate = (itemId: string) => {
    const match = itemMarketMatches[itemId];
    if (!match) return;
    const rateToApply = match.liveRate > 0 ? match.liveRate : match.marketRate;
    onUpdateItems(
      items.map((it) =>
        it.id === itemId
          ? {
              ...it,
              rate: rateToApply,
              unit: match.unitMismatch && match.suggestedUnit ? match.suggestedUnit : it.unit,
              amount: Math.round(it.quantity * rateToApply),
            }
          : it
      )
    );
    showToast(`Updated rate to ₹${rateToApply.toLocaleString()} (${match.liveSourceLabel}).`);
  };

  // Suggest live market rate while typing in Quick Add row
  const handleQuickNameChange = (val: string) => {
    setQuickName(val);
    if (val.trim().length >= 3) {
      const probe: BOQItem = {
        id: 'probe',
        name: val,
        category: quickCategory,
        unit: quickUnit,
        quantity: quickQty || 1,
        rate: 0,
        amount: 0,
        notes: '',
      };
      const m = matchBOQItemToMarket(probe, activeMarketRegion, activeMarketTier, activeMarketBasis);
      const lower = val.toLowerCase();
      const apiHit = livePrices.find((p) => {
        const pn = p.name.toLowerCase();
        return (
          (lower.includes('cement') && pn.includes('cement')) ||
          ((lower.includes('steel') || lower.includes('tmt')) && pn.includes('tmt')) ||
          (lower.includes('aac') && pn.includes('aac')) ||
          (lower.includes('paint') && pn.includes('paint'))
        );
      });
      if (apiHit && apiHit.currentPrice > 0) {
        setQuickRate(apiHit.currentPrice);
      } else if (m.marketRate > 0) {
        setQuickRate(m.marketRate);
      }
    }
  };

  const handleApplySNKFormat = () => {
    const snkItems = getSNKStandardBOQItems();
    const snkFloors = SNK_BUILDING_FLOORS;
    setFloors(snkFloors);
    setAreaSqFt(3599);
    setAreaDraft(3599);
    onUpdateItems(snkItems);
    if (onUpdateProject) {
      onUpdateProject({ ...activeProject, floors: snkFloors, builtUpAreaSqFt: 3599 });
    }
    setActiveWorkspaceTab('schedule');
    showToast('Loaded Standard Turnkey Residential BOQ (3,599 sq.ft @ ₹2,100/sq.ft).');
  };

  const handleGenerateAI = async () => {
    if (!aiDescription.trim()) return;
    setAiLoading(true);
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
      if (!res.ok) throw new Error('Fallback');
      const data = await res.json();
      setAiResult(data);
    } catch {
      const scale = (aiAreaSqFt || 3000) / 3000;
      setAiResult({
        project_summary: `Simple BOQ Estimate for ${activeProject.name} (${aiAreaSqFt.toLocaleString()} sq.ft · ${aiQualityTier} Tier)`,
        assumptions: [
          `Quantities scaled cleanly for ${aiAreaSqFt.toLocaleString()} sq.ft built-up area.`,
          `Material & finish rates calibrated to ${aiQualityTier} tier.`,
        ],
        items: [
          { name: 'Earthwork Excavation in Foundation', category: 'Substructure', unit: 'm3', quantity: Math.round(140 * scale), rate: 280 },
          { name: 'PCC 1:4:8 Bed Concrete', category: 'Concrete Works', unit: 'm3', quantity: Math.round(24 * scale * 10) / 10, rate: 4800 },
          { name: 'RCC M25 Structural Columns, Beams & Slabs', category: 'Concrete Works', unit: 'm3', quantity: Math.round(52 * scale * 10) / 10, rate: 8500 },
          { name: 'Fe550D TMT Reinforcement Steel', category: 'Concrete Works', unit: 'MT', quantity: Math.round(4.8 * scale * 10) / 10, rate: 72000 },
          { name: 'AAC Block Masonry (200mm)', category: 'Masonry', unit: 'm3', quantity: Math.round(65 * scale * 10) / 10, rate: 5600 },
          { name: 'Internal & External Plastering', category: 'Finishes', unit: 'sq.m', quantity: Math.round(380 * scale), rate: 260 },
          { name: 'Vitrified Tiles Flooring & Skirting', category: 'Finishes', unit: 'sq.m', quantity: Math.round(180 * scale), rate: 1150 },
          { name: 'Doors & UPVC/Aluminum Windows', category: 'Doors & Windows', unit: 'sq.m', quantity: Math.round(36 * scale), rate: 4200 },
          { name: 'Concealed Electrical Conduit & Wiring', category: 'MEP & Electrical', unit: 'nos', quantity: Math.round(85 * scale), rate: 950 },
          { name: 'Plumbing & Sanitary Network', category: 'Plumbing', unit: 'r.m', quantity: Math.round(120 * scale), rate: 420 },
          { name: 'Terrace & Wet Area Waterproofing', category: 'Waterproofing', unit: 'sq.m', quantity: Math.round(125 * scale), rate: 580 },
        ],
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAIBOQ = (replace: boolean) => {
    if (!aiResult?.items) return;
    const formatted: BOQItem[] = aiResult.items.map((it, idx) =>
      ensureItemFloorBreakdown(
        {
          id: `boq-ai-${Date.now()}-${idx}`,
          name: it.name,
          category: it.category || 'General',
          unit: it.unit || 'nos',
          quantity: Number(it.quantity) || 0,
          rate: Number(it.rate) || 0,
          amount: Math.round((Number(it.quantity) || 0) * (Number(it.rate) || 0)),
          notes: it.notes || '',
        },
        floors
      )
    );
    onUpdateItems(replace ? formatted : [...items, ...formatted]);
    if (aiAreaSqFt !== areaSqFt) {
      setAreaSqFt(aiAreaSqFt);
      setAreaDraft(aiAreaSqFt);
      if (onUpdateProject) onUpdateProject({ ...activeProject, builtUpAreaSqFt: aiAreaSqFt });
    }
    setIsGeneratingAI(false);
    setAiResult(null);
    setActiveWorkspaceTab('schedule');
    showToast(`Applied ${formatted.length} AI-generated BOQ items.`);
  };

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

  const handleExportCSV = () => {
    const headers = ['Item Name', 'Category', 'Unit', 'Quantity', 'Rate (Excl. GST)', 'Amount (Excl. GST)', 'Notes'];
    const rows = items.map((i) => [
      `"${i.name.replace(/"/g, '""')}"`,
      `"${i.category}"`,
      `"${i.unit}"`,
      i.quantity,
      i.rate,
      i.amount,
      `"${(i.notes || '').replace(/"/g, '""')}"`,
    ]);
    rows.push([]);
    rows.push(['Built-Up Area (sq.ft)', '', '', areaSqFt.toString(), '', '', '']);
    rows.push(['Subtotal (Excl. GST)', '', '', '', '', subtotal.toString(), '']);
    rows.push([`Contingency (${contingencyPercent}%)`, '', '', '', '', contingencyAmount.toString(), '']);
    rows.push(['Grand Total (Excl. GST)', '', '', '', '', totalEstimate.toString(), '']);
    rows.push(['GST @ 18%', '', '', '', '', gstAmount.toString(), '']);
    rows.push(['Grand Total (Incl. 18% GST)', '', '', '', '', (totalEstimate + gstAmount).toString(), '']);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeProject.name.replace(/\s+/g, '_')}_BOQ_${areaSqFt}sqft.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSendTenderEnquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddEnquiry) return;
    onAddEnquiry({
      id: `enq-boq-${Date.now()}`,
      professionalId: 'general-contractor-rfq',
      professionalName: 'Tender & Contractor Network',
      clientName: enquiryClientName.trim() || 'Principal Architect',
      clientEmail: enquiryClientEmail.trim() || 'sgouse14@gmail.com',
      projectTitle: `BOQ Tender RFQ: ${activeProject.name} (${areaSqFt.toLocaleString()} sq.ft)`,
      budget: formatCurrency(totalEstimate, currency),
      message: `Tender RFQ for ${activeProject.name} (${activeProject.location}). Area: ${areaSqFt.toLocaleString()} sq.ft · Estimate: ${formatCurrency(totalEstimate, currency)} Excl. GST (${formatCurrency(currentRatePerSqFt, currency)}/sq.ft) · ${items.length} items. Notes: ${enquiryTenderNotes || 'Please submit itemized rates.'}`,
      status: 'open',
      createdAt: new Date().toISOString(),
    });
    setEnquirySuccess(true);
    setTimeout(() => {
      setEnquirySuccess(false);
      setIsEnquiryModal(false);
      setEnquiryTenderNotes('');
    }, 1800);
  };

  return (
    <div id="boq-estimation-view" className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-5 text-slate-100">
      {/* CLEAN TOP HEADER */}
      <section className="rounded-xl bg-slate-900 border border-slate-800 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
              <span className="font-semibold text-white">Simple BOQ &amp; Costing</span>
              <span>·</span>
              <span className="truncate">{activeProject.name} ({activeProject.location})</span>
              <span>·</span>
              <span className="text-amber-300">All rates exclude 18% GST</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
              Bill of Quantities
            </h1>
          </div>

          {/* 3 Simple Primary Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              id="btn-open-add-boq"
              type="button"
              onClick={() => setIsAddingItem(true)}
              className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs inline-flex items-center gap-1.5 transition whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>

            <button
              id="btn-open-ai-boq"
              type="button"
              onClick={() => {
                setAiAreaSqFt(areaSqFt);
                setIsGeneratingAI(true);
              }}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Auto-Generate BOQ</span>
            </button>

            <button
              id="btn-export-excel-top"
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition whitespace-nowrap"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>

            <button
              id="btn-print-floor-report-top"
              type="button"
              onClick={() => setIsFloorPrintModalOpen(true)}
              className="px-3 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-xs inline-flex items-center gap-1.5 transition whitespace-nowrap"
            >
              <FileDown className="w-3.5 h-3.5 text-rose-400" />
              <span>PDF / Print</span>
            </button>
          </div>
        </div>

        {/* Clean 4-Tab Switcher */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {[
              { id: 'schedule', label: '1. BOQ Schedule', icon: Calculator },
              { id: 'auto_build', label: '2. Area & Presets', icon: Bot },
              { id: 'market_labour', label: '3. Market Rates & Labour', icon: RefreshCw },
              { id: 'analytics_tender', label: '4. Breakdown & Tender', icon: PieChartIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeWorkspaceTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveWorkspaceTab(tab.id as BoqWorkspaceTab)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap shrink-0 border ${
                    active
                      ? 'bg-slate-800 border-slate-600 text-white'
                      : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-amber-400" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <span className="text-xs text-slate-400 tabular-nums whitespace-nowrap">
            {items.length} items · {areaSqFt.toLocaleString()} sq.ft ·{' '}
            <strong className="text-amber-300">{formatCurrency(totalEstimate, currency)}</strong>
          </span>
        </div>
      </section>

      {/* Single Clean Status Toast */}
      {statusNotice && (
        <div className="px-4 py-2.5 rounded-xl bg-slate-900 border border-emerald-500/40 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-300 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusNotice(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Clean 4-KPI Summary Strip (Visible across all tabs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 tabular-nums">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Subtotal Works (Excl. GST)</span>
          <p className="text-xl font-bold text-white">{formatCurrency(subtotal, currency)}</p>
          <p className="text-xs text-slate-400">{items.length} line items</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Contingency Reserve</span>
            <span className="text-xs font-bold text-amber-400">{contingencyPercent}%</span>
          </div>
          <p className="text-xl font-bold text-amber-400">{formatCurrency(contingencyAmount, currency)}</p>
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

        <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/40 space-y-1">
          <span className="text-xs text-amber-300 font-semibold">Grand Total (Excl. GST)</span>
          <p className="text-xl font-bold text-amber-400">{formatCurrency(totalEstimate, currency)}</p>
          <p className="text-xs text-slate-400">
            + 18% GST = {formatCurrency(totalEstimate + gstAmount, currency)}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Rate per sq.ft</span>
            <span className={`text-xs font-semibold ${currentMarketTier.accentColor}`}>
              {currentMarketTier.tag}
            </span>
          </div>
          <p className="text-xl font-bold text-emerald-400">
            {formatCurrency(currentRatePerSqFt, currency)}
            <span className="text-xs font-normal text-slate-400"> / sq.ft</span>
          </p>
          <p className="text-xs text-slate-400">For {areaSqFt.toLocaleString()} sq.ft</p>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: SIMPLE & EASY BOQ SCHEDULE WITH REAL-TIME DATA                 */}
      {/* ===================================================================== */}
      {activeWorkspaceTab === 'schedule' && (
        <div className="space-y-4">
          {/* Real-Time Market Feed Bar */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap text-xs">
                <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-400">
                  <Radio className="w-3.5 h-3.5" />
                  <span>
                    {liveDataMode === 'live_search' ? 'Live Google Market Data' : 'Live Regional Index'}
                  </span>
                </span>
                <span className="text-slate-600">·</span>
                <div className="inline-flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <select
                    aria-label="Market City Region"
                    value={activeMarketRegion}
                    onChange={(e) => setActiveMarketRegion(e.target.value as MarketRegion)}
                    className="bg-transparent text-xs text-white focus:outline-none"
                  >
                    {MARKET_REGIONS.map((r) => (
                      <option key={r.id} value={r.id} className="bg-slate-900">
                        {r.shortName}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400 tabular-nums">
                  {liveLastSynced
                    ? `Updated ${liveLastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                    : 'Fetching latest spot rates...'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setAutoRefreshLive((v) => !v)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition whitespace-nowrap ${
                    autoRefreshLive
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Auto-Sync 60s: {autoRefreshLive ? 'On' : 'Off'}
                </button>

                <button
                  type="button"
                  onClick={() => fetchLiveMarketFeed(true)}
                  disabled={isLiveFetching}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isLiveFetching ? 'animate-spin' : ''}`} />
                  <span>{isLiveFetching ? 'Refreshing...' : 'Refresh Live'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleQuickSyncMarket}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap transition"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>
                    Sync All to Live{offMarketCount > 0 ? ` (${offMarketCount})` : ''}
                  </span>
                </button>
              </div>
            </div>

            {/* Live Commodity Ticker Strip */}
            {livePrices.length > 0 && (
              <div className="pt-2.5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-x-4 gap-y-1 flex-wrap tabular-nums">
                  {livePrices.slice(0, 5).map((p) => {
                    const up = p.trend === 'up';
                    const down = p.trend === 'down';
                    return (
                      <span key={p.id} className="inline-flex items-center gap-1.5 text-slate-300">
                        <span className="text-slate-400">{p.name.split('(')[0].trim().split(' ').slice(0, 3).join(' ')}:</span>
                        <strong className="text-white">₹{Number(p.currentPrice).toLocaleString()}</strong>
                        <span className="text-slate-500">/{p.unit.split(' ')[0]}</span>
                        <span
                          className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${
                            up ? 'text-rose-400' : down ? 'text-emerald-400' : 'text-slate-400'
                          }`}
                        >
                          {up && <TrendingUp className="w-3 h-3" />}
                          {down && <TrendingDown className="w-3 h-3" />}
                          {p.changePercent > 0 ? `+${p.changePercent}%` : `${p.changePercent}%`}
                        </span>
                      </span>
                    );
                  })}
                </div>

                {liveSources.length > 0 && (
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 shrink-0">
                    {liveSources.slice(0, 2).map((src, i) => (
                      <a
                        key={i}
                        href={src.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:text-amber-300 transition truncate max-w-[170px]"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate">{src.title}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick 1-Row Area + Quality Rate + Search Controls */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-3">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Simple Area Updater */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-amber-400" />
                    Built-Up Area (sq.ft)
                  </span>
                  <div className="flex items-center gap-1">
                    {SQFT_PRESETS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => handleApplyAreaChange(p.value, true)}
                        className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition ${
                          areaSqFt === p.value
                            ? 'bg-amber-500 text-slate-950 font-semibold'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        {p.value / 1000}k
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="input-custom-sqft"
                    type="number"
                    min={100}
                    step={50}
                    value={areaDraft}
                    onChange={(e) => setAreaDraft(Math.max(100, Number(e.target.value)))}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white tabular-nums focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyAreaChange(areaDraft, true)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs whitespace-nowrap transition"
                  >
                    Scale Area
                  </button>
                </div>
              </div>

              {/* Simple Quality Tier Rate Calibrator */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    Target Rate / sq.ft
                  </span>
                  <span className="text-[11px] text-slate-400 tabular-nums">
                    Current: ₹{currentRatePerSqFt.toLocaleString()}/sf
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={targetRatePerSqFt}
                    onChange={(e) => setTargetRatePerSqFt(Number(e.target.value))}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  >
                    {MARKET_BENCHMARKS.map((b) => (
                      <option key={b.tier} value={b.typicalRate}>
                        {b.tier.split('/')[0].trim()} (₹{b.typicalRate.toLocaleString()}/sq.ft)
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleCalibrateToRate(targetRatePerSqFt)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs whitespace-nowrap transition"
                  >
                    Apply Rate
                  </button>
                </div>
              </div>

              {/* Quick Actions: Tier Selector & Standard Preset */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    Spec Tier &amp; Preset
                  </span>
                  <select
                    aria-label="Specification Quality Tier"
                    value={activeMarketTier}
                    onChange={(e) => setActiveMarketTier(e.target.value as MarketQualityTier)}
                    className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-[11px] text-amber-300 focus:outline-none"
                  >
                    <option value="Economy">Economy</option>
                    <option value="Standard">Standard</option>
                    <option value="Premium">Premium</option>
                    <option value="Luxury">Luxury</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFloorManagerOpen(true)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs whitespace-nowrap transition"
                  >
                    Levels ({floors.length})
                  </button>
                  <button
                    type="button"
                    onClick={handleApplySNKFormat}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-semibold text-xs whitespace-nowrap transition"
                  >
                    Standard 3,599 Sft
                  </button>
                </div>
              </div>
            </div>

            {/* Search + Category + Issue Check Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
              <div className="flex items-center gap-2 flex-1 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search item, category, or unit..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-slate-600 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                  />
                </div>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="all">All Categories ({items.length})</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowOffMarketOnly((v) => !v)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition whitespace-nowrap ${
                    showOffMarketOnly
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Off-Market ({offMarketCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAuditHighlight((v) => !v)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition whitespace-nowrap ${
                    showAuditHighlight
                      ? 'bg-rose-500/15 border-rose-500/50 text-rose-300'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Issues ({itemsWithIssuesCount})</span>
                </button>

                {itemsWithIssuesCount > 0 && (
                  <button
                    type="button"
                    onClick={handleAutoFixUnits}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold transition whitespace-nowrap"
                  >
                    Fix Units
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* CLEAN EDITABLE BOQ TABLE WITH LIVE MARKET COLUMN */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-3 w-10 text-center">#</th>
                    <th className="py-3 px-3 min-w-[220px]">Item Description &amp; Notes</th>
                    <th className="py-3 px-3 w-36">Category</th>
                    <th className="py-3 px-3 w-24 text-center">Unit</th>
                    <th className="py-3 px-3 w-24 text-right">Qty</th>
                    <th className="py-3 px-3 w-28 text-right">Your Rate</th>
                    <th className="py-3 px-3 w-36 text-right">Live Market</th>
                    <th className="py-3 px-4 w-32 text-right">Amount</th>
                    <th className="py-3 px-3 w-12 text-center">Del</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-slate-400 text-xs">
                        No BOQ items match this filter. Use the Quick Add row below or click Add Item.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item, idx) => {
                      const audit = auditResults[item.id];
                      const match = itemMarketMatches[item.id];
                      const showUseLive =
                        match && (item.rate <= 0 || Math.abs(match.deltaVsCurrentPct) >= 2);
                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-800/35 transition ${
                            showAuditHighlight && audit?.hasIssues ? 'bg-rose-950/20' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center text-slate-500 tabular-nums">
                            {idx + 1}
                          </td>

                          {/* Inline Editable Name & Notes */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleUpdateItemField(item.id, 'name', e.target.value)}
                              className="w-full bg-transparent text-xs font-medium text-white focus:bg-slate-950 focus:px-2 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-amber-500/60"
                            />
                            <input
                              type="text"
                              value={item.notes || ''}
                              onChange={(e) => handleUpdateItemField(item.id, 'notes', e.target.value)}
                              placeholder="Add specification note..."
                              className="w-full bg-transparent text-[11px] text-slate-400 placeholder:text-slate-600 focus:bg-slate-950 focus:px-2 py-0.5 rounded focus:outline-none mt-0.5"
                            />
                          </td>

                          {/* Editable Category */}
                          <td className="py-2 px-3">
                            <select
                              value={item.category}
                              onChange={(e) =>
                                handleUpdateItemField(item.id, 'category', e.target.value)
                              }
                              className="w-full bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                            >
                              {CATEGORIES.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Editable Unit */}
                          <td className="py-2 px-3 text-center">
                            <select
                              value={item.unit}
                              onChange={(e) => handleUpdateItemField(item.id, 'unit', e.target.value)}
                              className={`w-full bg-slate-950 border rounded-md px-1.5 py-1 text-xs text-center focus:outline-none ${
                                audit?.mismatchedUnit
                                  ? 'border-rose-500 text-rose-300'
                                  : 'border-slate-800 text-slate-200 focus:border-amber-500'
                              }`}
                            >
                              {UNITS.map((u) => (
                                <option key={u} value={u}>
                                  {u}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Editable Quantity */}
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              min={0}
                              step={0.1}
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateItemField(item.id, 'quantity', e.target.value)
                              }
                              className={`w-24 bg-slate-950 border rounded-md px-2 py-1 text-right text-xs tabular-nums focus:outline-none ${
                                audit?.zeroQuantity
                                  ? 'border-rose-500 text-rose-300'
                                  : 'border-slate-800 text-white focus:border-amber-500'
                              }`}
                            />
                          </td>

                          {/* Editable Rate */}
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={item.rate}
                              onChange={(e) =>
                                handleUpdateItemField(item.id, 'rate', e.target.value)
                              }
                              className={`w-24 bg-slate-950 border rounded-md px-2 py-1 text-right text-xs tabular-nums focus:outline-none ${
                                audit?.missingRate
                                  ? 'border-rose-500 text-rose-300'
                                  : 'border-slate-800 text-white focus:border-amber-500'
                              }`}
                            />
                          </td>

                          {/* Real-Time Market Benchmark & 1-Click Sync */}
                          <td className="py-2 px-3 text-right tabular-nums">
                            {match ? (
                              <div className="flex flex-col items-end gap-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-slate-200 font-medium">
                                    ₹{match.liveRate.toLocaleString()}
                                  </span>
                                  {Math.abs(match.deltaVsCurrentPct) >= 2 && item.rate > 0 ? (
                                    <span
                                      className={`text-[11px] ${
                                        match.deltaVsCurrentPct > 0
                                          ? 'text-rose-400'
                                          : 'text-emerald-400'
                                      }`}
                                    >
                                      {match.deltaVsCurrentPct > 0
                                        ? `+${match.deltaVsCurrentPct}%`
                                        : `${match.deltaVsCurrentPct}%`}
                                    </span>
                                  ) : item.rate > 0 ? (
                                    <span className="text-[11px] text-emerald-400">On Market</span>
                                  ) : null}
                                </div>
                                {showUseLive ? (
                                  <button
                                    type="button"
                                    onClick={() => handleApplySingleMarketRate(item.id)}
                                    className="text-[11px] font-semibold text-amber-300 hover:text-amber-200 hover:underline whitespace-nowrap"
                                  >
                                    Use ₹{match.liveRate.toLocaleString()}
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-500 truncate max-w-[130px]">
                                    {match.liveSourceLabel}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>

                          {/* Computed Amount */}
                          <td className="py-2.5 px-4 text-right font-semibold text-amber-300 tabular-nums whitespace-nowrap">
                            {formatCurrency(item.quantity * item.rate, currency)}
                          </td>

                          {/* Delete */}
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              title="Delete item"
                              className="p-1 text-slate-500 hover:text-rose-400 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}

                  {/* Inline Quick Add Row */}
                  <tr className="bg-slate-950/60 border-t border-slate-800">
                    <td className="py-2.5 px-3 text-center text-amber-400 font-bold">+</td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={quickName}
                        onChange={(e) => handleQuickNameChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && quickName.trim()) {
                            handleQuickAddRow(e as unknown as React.FormEvent);
                          }
                        }}
                        placeholder="Quick add item (auto-fills live rate)..."
                        className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-md px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <select
                        value={quickCategory}
                        onChange={(e) => setQuickCategory(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-md px-2 py-1.5 text-xs text-slate-200 focus:outline-none"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-3">
                      <select
                        value={quickUnit}
                        onChange={(e) => setQuickUnit(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-md px-1.5 py-1.5 text-xs text-center text-slate-200 focus:outline-none"
                      >
                        {UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={quickQty}
                        onChange={(e) => setQuickQty(Number(e.target.value))}
                        className="w-24 bg-slate-900 border border-slate-800 rounded-md px-2 py-1.5 text-right text-xs text-white tabular-nums focus:outline-none"
                      />
                    </td>
                    <td className="py-2 px-3 text-right">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={quickRate}
                        onChange={(e) => setQuickRate(Number(e.target.value))}
                        className="w-24 bg-slate-900 border border-slate-800 rounded-md px-2 py-1.5 text-right text-xs text-white tabular-nums focus:outline-none"
                      />
                    </td>
                    <td className="py-2 px-3 text-right text-[11px] text-slate-500">
                      Auto-matched
                    </td>
                    <td className="py-2 px-4 text-right text-xs text-slate-400 tabular-nums">
                      {formatCurrency(quickQty * quickRate, currency)}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={handleQuickAddRow}
                        disabled={!quickName.trim()}
                        className="px-2.5 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-semibold text-xs transition"
                      >
                        Add
                      </button>
                    </td>
                  </tr>
                </tbody>

                {/* Clean Totals Footer */}
                <tfoot className="bg-slate-950 border-t border-slate-700 tabular-nums">
                  <tr className="text-xs">
                    <td colSpan={7} className="py-2.5 px-4 text-right text-slate-300 font-medium">
                      Subtotal Works (Cost Excl. GST):
                    </td>
                    <td className="py-2.5 px-4 text-right text-white font-semibold">
                      {formatCurrency(subtotal, currency)}
                    </td>
                    <td />
                  </tr>
                  <tr className="text-xs border-t border-slate-800/70">
                    <td colSpan={7} className="py-2 px-4 text-right text-amber-300 font-medium">
                      Contingency ({contingencyPercent}%):
                    </td>
                    <td className="py-2 px-4 text-right text-amber-300 font-semibold">
                      {formatCurrency(contingencyAmount, currency)}
                    </td>
                    <td />
                  </tr>
                  <tr className="text-sm border-t border-slate-700">
                    <td colSpan={7} className="py-3 px-4 text-right text-amber-400 font-bold">
                      Grand Total (Cost Excluding GST):
                    </td>
                    <td className="py-3 px-4 text-right text-amber-400 font-bold">
                      {formatCurrency(totalEstimate, currency)}
                    </td>
                    <td />
                  </tr>
                  <tr className="text-xs border-t border-slate-800/70">
                    <td colSpan={7} className="py-2 px-4 text-right text-slate-400">
                      + Statutory GST @ 18% ({formatCurrency(gstAmount, currency)}) = Total Incl. GST:
                    </td>
                    <td className="py-2 px-4 text-right text-emerald-400 font-semibold">
                      {formatCurrency(totalEstimate + gstAmount, currency)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: AREA & AUTO-BUILD                                              */}
      {/* ===================================================================== */}
      {activeWorkspaceTab === 'auto_build' && (
        <div className="space-y-5">
          {/* Quick Quality Tiers + Floor Settings */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white">
                  1-Click Specification Presets &amp; Floor Area
                </h2>
                <p className="text-xs text-slate-400">
                  Pick a construction quality tier to instantly calibrate all line items for {areaSqFt.toLocaleString()} sq.ft.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFloorManagerOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 inline-flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Manage Levels ({floors.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAreaMarketModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold"
                >
                  Area + Market Sync
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {MARKET_BENCHMARKS.map((b) => {
                const active = currentRatePerSqFt >= b.minRate && currentRatePerSqFt <= b.maxRate;
                return (
                  <button
                    key={b.tier}
                    type="button"
                    onClick={() => handleCalibrateToRate(b.typicalRate)}
                    className={`p-3.5 rounded-xl border text-left transition ${
                      active
                        ? `${b.badgeBg} ${b.badgeBorder}`
                        : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${b.accentColor}`}>{b.tier}</span>
                      <span className="text-[11px] text-slate-400">{b.tag}</span>
                    </div>
                    <p className="text-sm font-bold text-white tabular-nums mt-1">
                      ₹{b.typicalRate.toLocaleString()} / sq.ft
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">{b.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dedicated Area Auto-Calc Agent */}
          <BOQAreaAgentCalculator
            currentAreaSqFt={areaSqFt}
            items={items}
            floors={floors}
            currency={currency}
            activeProject={activeProject}
            activeRegion={activeMarketRegion}
            activeTier={activeMarketTier}
            onApplyCalculatedBOQ={(updated, newArea, summary) => {
              handleApplyAreaChange(newArea, false);
              onUpdateItems(updated);
              showToast(summary || `Calculated BOQ for ${newArea.toLocaleString()} sq.ft.`);
              setActiveWorkspaceTab('schedule');
            }}
            onReplaceWithGeneratedBOQ={(generatedItems, newArea) => {
              onUpdateItems(generatedItems);
              const scaledFloors = scaleFloorAreasToTotal(floors, newArea);
              setFloors(scaledFloors);
              if (onUpdateProject) {
                onUpdateProject({
                  ...activeProject,
                  floors: scaledFloors,
                  builtUpAreaSqFt: newArea,
                });
              }
              setAreaSqFt(newArea);
              setAreaDraft(newArea);
              setActiveWorkspaceTab('schedule');
              showToast(`Generated complete BOQ for ${newArea.toLocaleString()} sq.ft.`);
            }}
            onClose={() => setActiveWorkspaceTab('schedule')}
          />
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: SIMPLE & EASY MARKET RATES & LABOUR                            */}
      {/* ===================================================================== */}
      {activeWorkspaceTab === 'market_labour' && (
        <div className="space-y-5">
          {/* Top Simple Controls */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 sm:p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white">
                  Market Rates &amp; Civil Labour
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
                  {activeRegionMeta.shortName} indices (Materials {activeRegionMeta.materialMultiplier}x · Labour{' '}
                  {activeRegionMeta.laborMultiplier}x) for {areaSqFt.toLocaleString()} sq.ft
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <select
                    aria-label="Select City or Region"
                    value={activeMarketRegion}
                    onChange={(e) => {
                      setActiveMarketRegion(e.target.value as MarketRegion);
                      setCustomLabourRates({});
                    }}
                    className="bg-transparent text-white focus:outline-none"
                  >
                    {MARKET_REGIONS.map((r) => (
                      <option key={r.id} value={r.id} className="bg-slate-900">
                        {r.shortName}
                      </option>
                    ))}
                  </select>
                </div>

                <select
                  aria-label="Specification Quality Tier"
                  value={activeMarketTier}
                  onChange={(e) => setActiveMarketTier(e.target.value as MarketQualityTier)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="Economy">Economy Tier</option>
                  <option value="Standard">Standard Tier</option>
                  <option value="Premium">Premium Tier</option>
                  <option value="Luxury">Luxury Tier</option>
                </select>

                <button
                  type="button"
                  onClick={() => fetchLiveMarketFeed(true)}
                  disabled={isLiveFetching}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isLiveFetching ? 'animate-spin' : ''}`} />
                  <span>{isLiveFetching ? 'Refreshing...' : 'Refresh Live'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleQuickSyncMarket}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold whitespace-nowrap"
                >
                  Sync BOQ to Market
                </button>
              </div>
            </div>

            {/* 3 Simple Summary Numbers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800 tabular-nums">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-400">Estimated Civil Labour</span>
                <p className="text-lg font-bold text-amber-400 mt-0.5">
                  {formatCurrency(regionalLabourTotal, currency)}
                </p>
                <p className="text-[11px] text-slate-400">
                  ₹{regionalLabourPerSqFt.toLocaleString()} / sq.ft · {areaSqFt.toLocaleString()} sq.ft
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-400">Live Material Feed</span>
                <p className="text-lg font-bold text-emerald-400 mt-0.5">
                  {livePrices.length} Commodities
                </p>
                <p className="text-[11px] text-slate-400">
                  {liveLastSynced
                    ? `Updated ${liveLastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : 'Loading regional spot feed...'}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-400">BOQ Trade Coverage</span>
                <p className="text-lg font-bold text-white mt-0.5">
                  {LABOUR_SCHEDULE_BENCHMARKS.length - missingLabourTrades.length} / {LABOUR_SCHEDULE_BENCHMARKS.length} Trades
                </p>
                <p className="text-[11px] text-slate-400">
                  {missingLabourTrades.length === 0
                    ? 'All major civil trades included'
                    : `${missingLabourTrades.length} trades can be added in 1 click`}
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 1: EASY CIVIL LABOUR RATES (INLINE EDITABLE) */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <HardHat className="w-4 h-4 text-amber-400" />
                  <span>1. Civil Labour Rates ({activeRegionMeta.shortName})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pick a rate band or edit any trade rate directly to recalculate your project labour cost.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-lg bg-slate-950 border border-slate-800 p-0.5 text-xs">
                  {(
                    [
                      { id: 'min', label: 'Economy' },
                      { id: 'avg', label: 'Standard' },
                      { id: 'max', label: 'Premium' },
                    ] as const
                  ).map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        setLabourRateMode(mode.id);
                        setCustomLabourRates({});
                      }}
                      className={`px-2.5 py-1 rounded-md font-medium transition ${
                        labourRateMode === mode.id
                          ? 'bg-amber-500 text-slate-950 font-semibold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>

                {missingLabourTrades.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newItems = missingLabourTrades.map((t: LabourTradeBenchmark) =>
                        createBOQItemFromLabourTrade(t, areaSqFt, labourRateMode)
                      );
                      onUpdateItems([...items, ...newItems]);
                      showToast(`Added ${newItems.length} missing civil trades to BOQ.`);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold whitespace-nowrap"
                  >
                    + Add {missingLabourTrades.length} Missing Trades
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const res = applyLabourScheduleToBOQ(items, areaSqFt, labourRateMode);
                    const rowMap = new Map(regionalLabourRows.map((r) => [r.benchmark.id, r]));
                    const calibrated = res.updatedItems.map((it) => {
                      const trade = matchItemToLabourTrade(it);
                      if (!trade) return it;
                      const row = rowMap.get(trade.id);
                      if (!row) return it;
                      const factor = row.activeRate / Math.max(1, row.baseRate);
                      if (Math.abs(factor - 1) < 0.01) return it;
                      const laborShare = it.laborComponent ?? trade.defaultLaborShare ?? 0.3;
                      const nextRate = Math.round(it.rate * (1 - laborShare + laborShare * factor));
                      return {
                        ...it,
                        rate: nextRate,
                        amount: Math.round(it.quantity * nextRate),
                      };
                    });
                    onUpdateItems(calibrated);
                    showToast(
                      `Applied ${activeRegionMeta.shortName} ${labourRateMode} labour rates (${res.modifiedCount} items calibrated).`
                    );
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold whitespace-nowrap"
                >
                  Apply Labour to BOQ
                </button>

                <button
                  type="button"
                  onClick={() => setIsLabourBreakdownModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold whitespace-nowrap"
                >
                  Full Details
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 px-4">Work / Trade</th>
                    <th className="py-2.5 px-3">Basis</th>
                    <th className="py-2.5 px-3 text-right w-36">Your Rate (₹)</th>
                    <th className="py-2.5 px-3 text-right">Est. ({areaSqFt.toLocaleString()} sq.ft)</th>
                    <th className="py-2.5 px-4 text-right w-36">BOQ Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 tabular-nums">
                  {regionalLabourRows.map((row) => (
                    <tr key={row.benchmark.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-2.5 px-4">
                        <div className="font-medium text-white">{row.benchmark.trade}</div>
                        <div className="text-[11px] text-slate-500">{row.benchmark.targetCategory}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{row.benchmark.description}</td>
                      <td className="py-2 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <input
                            type="number"
                            min={0}
                            step={5}
                            value={row.activeRate}
                            onChange={(e) =>
                              setCustomLabourRates((prev) => ({
                                ...prev,
                                [row.benchmark.id]: Math.max(0, Number(e.target.value) || 0),
                              }))
                            }
                            className="w-24 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-md px-2 py-1 text-right text-xs text-white focus:outline-none"
                          />
                          {customLabourRates[row.benchmark.id] !== undefined && (
                            <button
                              type="button"
                              onClick={() =>
                                setCustomLabourRates((prev) => {
                                  const next = { ...prev };
                                  delete next[row.benchmark.id];
                                  return next;
                                })
                              }
                              className="text-[11px] text-slate-400 hover:text-amber-300"
                              title="Reset to regional benchmark"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-amber-300">
                        {formatCurrency(row.scaledCost, currency)}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {row.linkedCount > 0 ? (
                          <span className="text-[11px] text-emerald-400 font-medium">
                            {row.linkedCount} in BOQ
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const newItem = createBOQItemFromLabourTrade(
                                row.benchmark,
                                areaSqFt,
                                labourRateMode
                              );
                              onUpdateItems([...items, newItem]);
                              showToast(`Added ${row.benchmark.trade} to BOQ schedule.`);
                            }}
                            className="text-[11px] font-semibold text-amber-300 hover:text-amber-200 hover:underline whitespace-nowrap"
                          >
                            + Add to BOQ
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-950 border-t border-slate-700 tabular-nums">
                  <tr className="text-xs font-bold">
                    <td colSpan={3} className="py-3 px-4 text-right text-slate-200">
                      Total Estimated Civil Labour ({areaSqFt.toLocaleString()} sq.ft · ₹
                      {regionalLabourPerSqFt.toLocaleString()}/sq.ft):
                    </td>
                    <td className="py-3 px-3 text-right text-amber-400">
                      {formatCurrency(regionalLabourTotal, currency)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* SECTION 2: EASY LIVE MATERIAL MARKET RATES */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400" />
                  <span>2. Live Material Market Rates ({activeRegionMeta.shortName})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time supplier &amp; mandi prices. Click Sync or Add to bring any live rate into your BOQ.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={marketSearchQuery}
                    onChange={(e) => setMarketSearchQuery(e.target.value)}
                    placeholder="Filter material..."
                    className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsMarketModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 whitespace-nowrap"
                >
                  Rate Audit
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 px-4">Material &amp; Brands</th>
                    <th className="py-2.5 px-3">Unit</th>
                    <th className="py-2.5 px-3 text-right">Live Price</th>
                    <th className="py-2.5 px-3 text-right">30-Day Change</th>
                    <th className="py-2.5 px-3 text-right">Market Range</th>
                    <th className="py-2.5 px-4 text-right w-36">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 tabular-nums">
                  {filteredLivePrices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        {isLiveFetching ? 'Loading live material prices...' : 'No matching materials found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredLivePrices.map((p) => {
                      const isUp = p.trend === 'up';
                      const isDown = p.trend === 'down';
                      return (
                        <tr key={p.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-2.5 px-4">
                            <div className="font-medium text-white">{p.name}</div>
                            <div className="text-[11px] text-slate-400">
                              {(p.brands || []).slice(0, 3).join(' · ')}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">{p.unit}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-white">
                            ₹{Number(p.currentPrice).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span
                              className={`inline-flex items-center gap-1 font-medium ${
                                isUp ? 'text-rose-400' : isDown ? 'text-emerald-400' : 'text-slate-400'
                              }`}
                            >
                              {isUp && <TrendingUp className="w-3 h-3" />}
                              {isDown && <TrendingDown className="w-3 h-3" />}
                              {p.changePercent > 0 ? `+${p.changePercent}%` : `${p.changePercent}%`}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-400">
                            ₹{Number(p.minPrice).toLocaleString()} – ₹{Number(p.maxPrice).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                const unitNormalized = p.unit.toLowerCase().includes('mt')
                                  ? 'MT'
                                  : p.unit.toLowerCase().includes('m3')
                                  ? 'm3'
                                  : p.unit.toLowerCase().includes('sq.m')
                                  ? 'sq.m'
                                  : 'nos';
                                const newItem = ensureItemFloorBreakdown(
                                  {
                                    id: `boq-live-${Date.now()}`,
                                    name: p.name,
                                    category: p.category.includes('Concrete')
                                      ? 'Concrete Works'
                                      : p.category.includes('Steel')
                                      ? 'Concrete Works'
                                      : p.category.includes('Block')
                                      ? 'Masonry'
                                      : p.category.includes('Plumbing')
                                      ? 'Plumbing'
                                      : p.category.includes('Glass')
                                      ? 'Doors & Windows'
                                      : p.category.includes('Finish')
                                      ? 'Finishes'
                                      : 'General',
                                    unit: unitNormalized,
                                    quantity: unitNormalized === 'MT' ? 4 : 50,
                                    rate: Number(p.currentPrice) || 0,
                                    amount: Math.round(
                                      (unitNormalized === 'MT' ? 4 : 50) * (Number(p.currentPrice) || 0)
                                    ),
                                    notes: `${(p.brands || []).slice(0, 2).join(', ')} · Live ${activeRegionMeta.shortName} rate`,
                                  },
                                  floors
                                );
                                onUpdateItems([...items, newItem]);
                                showToast(`Added "${p.name}" at live rate ₹${Number(p.currentPrice).toLocaleString()}.`);
                              }}
                              className="text-[11px] font-semibold text-amber-300 hover:text-amber-200 hover:underline whitespace-nowrap"
                            >
                              + Add to BOQ
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Optional Collapsible Advanced Alerts & News */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-slate-200">
                  Live Price Fluctuation Alerts &amp; Material News Wire
                </h3>
                <p className="text-[11px] text-slate-400">
                  Optional threshold push notifications and daily mandi updates.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAdvancedAlertsAndNews((v) => !v)}
                className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 whitespace-nowrap"
              >
                {showAdvancedAlertsAndNews ? 'Hide Alerts & News' : 'Show Alerts & News'}
              </button>
            </div>

            {showAdvancedAlertsAndNews && (
              <div className="space-y-4 pt-2 border-t border-slate-800">
                <BOQRealTimePriceMonitor
                  items={items}
                  activeProject={activeProject}
                  currency={currency}
                  onUpdateItemRate={(id, rate) => handleUpdateItemField(id, 'rate', rate)}
                  onUpdateMultipleItemRates={(updates) => {
                    const map = new Map(updates.map((u) => [u.id, u.newRate]));
                    onUpdateItems(
                      items.map((it) =>
                        map.has(it.id)
                          ? { ...it, rate: map.get(it.id)!, amount: Math.round(it.quantity * map.get(it.id)!) }
                          : it
                      )
                    );
                  }}
                />

                <BimBoqMaterialNewsWire
                  onLockMaterialRate={(newsItem) => {
                    showToast(`Locked ${newsItem.categoryLabel} spot rate (${newsItem.currentMandiRate}).`);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: COST BREAKDOWN & TENDER                                        */}
      {/* ===================================================================== */}
      {activeWorkspaceTab === 'analytics_tender' && (
        <div className="space-y-5">
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">
                Exports &amp; Contractor Tender Dispatch
              </h2>
              <p className="text-xs text-slate-400">
                Download spreadsheet schedules, print PDF reports, or send this BOQ for contractor quotes.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportExcel}
                className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Master CSV</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  exportBOQToExcelCSV({
                    items,
                    floors,
                    projectName: activeProject.name,
                    currency,
                    contingencyPercent,
                    builtUpAreaSqFt: areaSqFt,
                  })
                }
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Floor CSV</span>
              </button>
              {onAddEnquiry && (
                <button
                  type="button"
                  onClick={() => setIsEnquiryModal(true)}
                  className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Tender Enquiry</span>
                </button>
              )}
            </div>
          </div>

          <BOQDistributionAnalytics
            items={items}
            currency={currency}
            contingencyPercent={contingencyPercent}
            areaSqFt={areaSqFt}
          />
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODALS                                                                */}
      {/* ===================================================================== */}
      {isAddingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Add BOQ Line Item</h3>
              <button
                type="button"
                onClick={() => setIsAddingItem(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddItemModal} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Item Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RCC M25 Concrete in Beams & Slabs"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Unit</label>
                  <select
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Quantity</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    required
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white tabular-nums focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Unit Rate (₹)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    required
                    value={newItemRate}
                    onChange={(e) => setNewItemRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white tabular-nums focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="Optional specification notes"
                  value={newItemNotes}
                  onChange={(e) => setNewItemNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
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
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isGeneratingAI && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-base font-bold text-white">Auto-Generate Simple BOQ</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsGeneratingAI(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Built-Up Area (sq.ft)
                </label>
                <input
                  type="number"
                  min={100}
                  step={100}
                  value={aiAreaSqFt}
                  onChange={(e) => setAiAreaSqFt(Math.max(100, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white tabular-nums focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Quality Tier
                </label>
                <select
                  value={aiQualityTier}
                  onChange={(e) => setAiQualityTier(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="Economy">Economy (₹1,400–₹1,750/sq.ft)</option>
                  <option value="Standard">Standard (₹1,800–₹2,450/sq.ft)</option>
                  <option value="Premium">Premium (₹2,500–₹3,600/sq.ft)</option>
                  <option value="Luxury">Luxury (₹3,800–₹5,500/sq.ft)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Project Description
              </label>
              <textarea
                rows={3}
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
                placeholder="e.g. G+2 residential home in Whitefield with M25 RCC frame, AAC blocks, vitrified flooring..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={aiLoading}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{aiLoading ? 'Calculating...' : 'Generate Items'}</span>
              </button>
            </div>

            {aiResult && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <p className="text-xs font-semibold text-amber-300">{aiResult.project_summary}</p>
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-800 text-xs">
                  {aiResult.items.map((it, idx) => (
                    <div key={idx} className="py-1.5 flex items-center justify-between gap-2 tabular-nums">
                      <span className="text-slate-200 truncate">{it.name}</span>
                      <span className="text-slate-400 shrink-0">
                        {it.quantity} {it.unit} · ₹{(it.quantity * it.rate).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleApplyAIBOQ(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-amber-300"
                  >
                    Append
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyAIBOQ(true)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-semibold text-xs"
                  >
                    Replace Schedule
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isEnquiryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Send BOQ Tender Enquiry</h3>
              <button
                type="button"
                onClick={() => setIsEnquiryModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {enquirySuccess ? (
              <div className="p-6 text-center space-y-2">
                <Check className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-sm font-bold text-white">Tender Enquiry Sent</p>
              </div>
            ) : (
              <form onSubmit={handleSendTenderEnquiry} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    value={enquiryClientName}
                    onChange={(e) => setEnquiryClientName(e.target.value)}
                    placeholder="Name"
                    className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  />
                  <input
                    type="text"
                    required
                    value={enquiryClientPhone}
                    onChange={(e) => setEnquiryClientPhone(e.target.value)}
                    placeholder="Phone"
                    className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <input
                  type="email"
                  required
                  value={enquiryClientEmail}
                  onChange={(e) => setEnquiryClientEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
                <textarea
                  rows={3}
                  value={enquiryTenderNotes}
                  onChange={(e) => setEnquiryTenderNotes(e.target.value)}
                  placeholder="Notes or timeline requirements..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEnquiryModal(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-xs text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-semibold text-xs"
                  >
                    Send Enquiry
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <MarketPriceAutoUpdateModal
        items={items}
        currency={currency}
        areaSqFt={areaSqFt}
        isOpen={isMarketModalOpen}
        onClose={() => setIsMarketModalOpen(false)}
        initialRegion={activeMarketRegion}
        onApplyRates={(updated) => {
          onUpdateItems(updated);
          showToast(`Updated ${updated.length} BOQ items to market rates.`);
        }}
      />

      <AreaTakeoffAutoUpdateModal
        items={items}
        currentAreaSqFt={areaSqFt}
        currency={currency}
        isOpen={isAreaMarketModalOpen}
        onClose={() => setIsAreaMarketModalOpen(false)}
        initialRegion={activeMarketRegion}
        initialTier={activeMarketTier}
        initialPricingBasis={activeMarketBasis}
        floors={floors}
        onApplyUpdate={(updated, newArea, summary) => {
          handleApplyAreaChange(newArea, false);
          onUpdateItems(updated);
          showToast(summary || `Synced area (${newArea.toLocaleString()} sq.ft) & market rates.`);
        }}
      />

      <BuildingFloorManagerModal
        isOpen={isFloorManagerOpen}
        onClose={() => setIsFloorManagerOpen(false)}
        floors={floors}
        onSaveFloors={(newFloors) => {
          setFloors(newFloors);
          const totalArea = newFloors.reduce((s, f) => s + (Number(f.areaSqFt) || 0), 0);
          if (totalArea > 0) {
            setAreaSqFt(totalArea);
            setAreaDraft(totalArea);
          }
          if (onUpdateProject) {
            onUpdateProject({
              ...activeProject,
              floors: newFloors,
              builtUpAreaSqFt: totalArea > 0 ? totalArea : activeProject.builtUpAreaSqFt,
            });
          }
          setIsFloorManagerOpen(false);
        }}
      />

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

      <LabourCostBreakdownModal
        items={items}
        currency={currency}
        areaSqFt={areaSqFt}
        isOpen={isLabourBreakdownModalOpen}
        onClose={() => setIsLabourBreakdownModalOpen(false)}
        onApplyRates={(updated) => {
          onUpdateItems(updated);
          showToast(`Calibrated ${updated.length} items with civil labour benchmarks.`);
        }}
      />
    </div>
  );
};
