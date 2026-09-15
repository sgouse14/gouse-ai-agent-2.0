import { BOQItem, Project } from '../types';
import {
  MarketRegion,
  MarketQualityTier,
  MarketPricingBasis,
  MARKET_REGIONS,
  matchBOQItemToMarket,
  MARKET_BENCHMARK_CATALOG,
} from './marketPriceEngine';

/**
 * Standard Construction Material Takeoff Norm (Per Sq.Ft of Built-Up Area)
 * Based on IS 456:2000, IS 1200, CPWD Delhi Schedule of Rates (DSR),
 * and Indian Green Building Council (IGBC) residential/commercial construction standards.
 */
export interface MaterialTakeoffNorm {
  id: string;
  name: string;
  trade: string;
  category:
    | 'Cement & Concrete'
    | 'Steel & Reinforcement'
    | 'Sand & Aggregates'
    | 'Blocks & Masonry'
    | 'Finishes & Surfaces'
    | 'Fenestration & Glass'
    | 'Plumbing & MEP'
    | 'Waterproofing'
    | 'Doors & Carpentry';
  unit: string;
  normPerSqFt: number; // Consumption factor per square foot of built-up area
  normDescription: string; // Engineering rationale (e.g., "0.42 bags / sq.ft for RCC framed structure")
  standardWastagePercent: number; // Industry cut & handling wastage factor
  baseRate: number; // Base rate in INR (CPWD / National baseline)
  economyMultiplier: number;
  standardMultiplier: number;
  premiumMultiplier: number;
  luxuryMultiplier: number;
  brands: string[];
  isCodeRef: string;
  stage: 'Substructure' | 'Superstructure' | 'Finishes' | 'Services';
  boqCategoryMatch: string;
  boqItemKeywords: string[];
}

export const MATERIAL_TAKEOFF_NORMS: MaterialTakeoffNorm[] = [
  {
    id: 'norm-cement',
    name: 'OPC 53 / PPC Portland Cement',
    trade: 'Civil & Structural',
    category: 'Cement & Concrete',
    unit: 'bags (50kg)',
    normPerSqFt: 0.42, // ~0.42 bags per sq.ft built-up area
    normDescription: '0.42 bags/sq.ft for RCC frame (footings, columns, beams, slabs, masonry & plastering)',
    standardWastagePercent: 3.5,
    baseRate: 385,
    economyMultiplier: 0.92,
    standardMultiplier: 1.0,
    premiumMultiplier: 1.12,
    luxuryMultiplier: 1.25,
    brands: ['UltraTech Super', 'ACC Concrete Plus', 'Dalmia DSP', 'Birla A1'],
    isCodeRef: 'IS 269 / IS 1489 / IS 456',
    stage: 'Superstructure',
    boqCategoryMatch: 'Concrete Works',
    boqItemKeywords: ['cement', 'concrete', 'rcc', 'pcc'],
  },
  {
    id: 'norm-steel',
    name: 'Thermo-Mechanically Treated (TMT) Fe550D Steel Rebar',
    trade: 'Civil & Structural',
    category: 'Steel & Reinforcement',
    unit: 'MT (Metric Tonne)',
    normPerSqFt: 0.0038, // 3.8 kg per sq.ft = 0.0038 MT
    normDescription: '3.80 kg / sq.ft (0.0038 MT) structural reinforcement with 4.5% cutting & lap wastage',
    standardWastagePercent: 4.5,
    baseRate: 74500,
    economyMultiplier: 0.94,
    standardMultiplier: 1.0,
    premiumMultiplier: 1.08,
    luxuryMultiplier: 1.18,
    brands: ['Tata Tiscon Fe550D', 'JSW Neosteel', 'Jindal Panther', 'SAIL TMT'],
    isCodeRef: 'IS 1786:2008 / SP 34',
    stage: 'Superstructure',
    boqCategoryMatch: 'Concrete Works',
    boqItemKeywords: ['tmt', 'steel', 'reinforcement', 'rebar', 'fe550d'],
  },
  {
    id: 'norm-rmc',
    name: 'Ready-Mix Concrete (RMC) M25 / M30 Grade',
    trade: 'Civil & Structural',
    category: 'Cement & Concrete',
    unit: 'm3',
    normPerSqFt: 0.035, // 0.035 m3 per sq.ft
    normDescription: '0.035 m3 per sq.ft for composite foundation footings, plinth beams, columns & slabs',
    standardWastagePercent: 2.0,
    baseRate: 4450,
    economyMultiplier: 0.92,
    standardMultiplier: 1.0,
    premiumMultiplier: 1.15,
    luxuryMultiplier: 1.32,
    brands: ['Prism RMC', 'UltraTech RMC', 'RDC Concrete', 'Godrej RMC'],
    isCodeRef: 'IS 456:2000 / IS 4926',
    stage: 'Superstructure',
    boqCategoryMatch: 'Concrete Works',
    boqItemKeywords: ['rmc', 'ready-mix', 'ready mix', 'm25', 'm30'],
  },
  {
    id: 'norm-sand',
    name: 'VSI Washed Manufactured Sand (M-Sand Zone II)',
    trade: 'Civil & Structural',
    category: 'Sand & Aggregates',
    unit: 'tonne',
    normPerSqFt: 0.082, // ~1.65 cft / sq.ft = 0.082 tonnes
    normDescription: '0.082 tonnes / sq.ft for concrete batching, block bonding mortar & plaster coats',
    standardWastagePercent: 5.0,
    baseRate: 1150,
    economyMultiplier: 0.90,
    standardMultiplier: 1.0,
    premiumMultiplier: 1.10,
    luxuryMultiplier: 1.20,
    brands: ['RoboSilicon VSI', 'Pozzocrete', 'Quarry Direct Washed'],
    isCodeRef: 'IS 383:2016',
    stage: 'Superstructure',
    boqCategoryMatch: 'Concrete Works',
    boqItemKeywords: ['sand', 'm-sand', 'fine aggregate', 'mortar'],
  },
  {
    id: 'norm-aggregates',
    name: 'Crushed Granite Coarse Aggregates (20mm & 10mm Graded)',
    trade: 'Civil & Structural',
    category: 'Sand & Aggregates',
    unit: 'tonne',
    normPerSqFt: 0.068, // ~1.35 cft / sq.ft = 0.068 tonnes
    normDescription: '0.068 tonnes / sq.ft angular crushed metal for high-strength RCC mix compaction',
    standardWastagePercent: 4.0,
    baseRate: 1280,
    economyMultiplier: 0.92,
    standardMultiplier: 1.0,
    premiumMultiplier: 1.12,
    luxuryMultiplier: 1.22,
    brands: ['Certified Blue Metal Quarries', 'UltraTech Aggregate'],
    isCodeRef: 'IS 383:2016 Table 2',
    stage: 'Superstructure',
    boqCategoryMatch: 'Concrete Works',
    boqItemKeywords: ['aggregate', 'coarse aggregate', 'gravel', 'granite metal', '20mm'],
  },
  {
    id: 'norm-aac-blocks',
    name: 'Autoclaved Aerated Concrete (AAC) Blocks (600x200x150mm)',
    trade: 'Masonry & Enclosure',
    category: 'Blocks & Masonry',
    unit: 'm3',
    normPerSqFt: 0.028, // ~0.028 m3 per sq.ft = ~2.4 blocks / sq.ft
    normDescription: '0.028 m3 / sq.ft (approx 2.4 blocks per sq.ft) with polymer thin-bed adhesive jointing',
    standardWastagePercent: 5.0,
    baseRate: 5400,
    economyMultiplier: 0.90,
    standardMultiplier: 1.0,
    premiumMultiplier: 1.14,
    luxuryMultiplier: 1.28,
    brands: ['Siporex', 'Magicrete', 'Biltech', 'Renaissance Green'],
    isCodeRef: 'IS 2185 Part 3',
    stage: 'Superstructure',
    boqCategoryMatch: 'Masonry',
    boqItemKeywords: ['aac', 'block', 'blocks', 'blockwork', 'aerated'],
  },
  {
    id: 'norm-clay-bricks',
    name: 'First-Class Wire-Cut Table-Moulded Red Clay Bricks',
    trade: 'Masonry & Enclosure',
    category: 'Blocks & Masonry',
    unit: '1,000 nos',
    normPerSqFt: 0.018, // 18 bricks per sq.ft built-up area
    normDescription: '18 bricks / sq.ft for parapets, boundary substructure, and feature exposed brick panels',
    standardWastagePercent: 6.0,
    baseRate: 8800,
    economyMultiplier: 0.92,
    standardMultiplier: 1.0,
    premiumMultiplier: 1.15,
    luxuryMultiplier: 1.30,
    brands: ['Malabar Clay Works', 'Varshini Bricks', 'Heritage Kiln Direct'],
    isCodeRef: 'IS 1077 / IS 2212',
    stage: 'Superstructure',
    boqCategoryMatch: 'Masonry',
    boqItemKeywords: ['brick', 'clay brick', 'red brick', 'brickwork'],
  },
  {
    id: 'norm-vitrified-tiles',
    name: 'Full-Body Vitrified Flooring Tiles (1200x600mm Double Charged)',
    trade: 'Architectural Finishes',
    category: 'Finishes & Surfaces',
    unit: 'sq.ft',
    normPerSqFt: 1.22, // 1.22 sq.ft tile per 1 sq.ft built-up area (rooms + circulation + 100mm skirting + 8% cuts)
    normDescription: '1.22 sq.ft tiles per sq.ft built-up area (carpet area + skirting + 8% cut pattern wastage)',
    standardWastagePercent: 8.0,
    baseRate: 85,
    economyMultiplier: 0.85,
    standardMultiplier: 1.0,
    premiumMultiplier: 1.45,
    luxuryMultiplier: 2.10,
    brands: ['Kajaria Eternity', 'Somany SlipShield', 'Simpolo Glazed', 'Nitco'],
    isCodeRef: 'IS 15622:2017 Group B1a',
    stage: 'Finishes',
    boqCategoryMatch: 'Finishes',
    boqItemKeywords: ['tile', 'vitrified', 'flooring', 'floor tile', 'skirting'],
  },
  {
    id: 'norm-interior-paint',
    name: 'Interior Luxury Acrylic Emulsion Paint (Double Coat + Putty + Primer)',
    trade: 'Architectural Finishes',
    category: 'Finishes & Surfaces',
    unit: 'liters',
    normPerSqFt: 0.045, // 0.045 liters per sq.ft built-up area
    normDescription: '0.045 liters / sq.ft (covers walls and ceilings with 2 coats acrylic putty, primer & 2 finish coats)',
    standardWastagePercent: 5.0,
    baseRate: 380,
    economyMultiplier: 0.80,
    standardMultiplier: 1.0,
    premiumMultiplier: 1.35,
    luxuryMultiplier: 1.85,
    brands: ['Asian Paints Royale', 'Berger Silk Glamor', 'Dulux Velvet Touch'],
    isCodeRef: 'IS 15489',
    stage: 'Finishes',
    boqCategoryMatch: 'Finishes',
    boqItemKeywords: ['paint', 'emulsion', 'interior paint', 'royale', 'putty'],
  },
  {
    id: 'norm-exterior-paint',
    name: 'Exterior Silicone-Acrylic Weather-Defense Elastomeric Coating',
    trade: 'Architectural Finishes',
    category: 'Finishes & Surfaces',
    unit: 'liters',
    normPerSqFt: 0.022, // 0.022 liters per sq.ft built-up area
    normDescription: '0.022 liters / sq.ft facade envelope with anti-fungal dirt-pickup resistance warranty',
    standardWastagePercent: 5.0,
    baseRate: 360,
    economyMultiplier: 0.82,
    standardMultiplier: 1.0,
    premiumMultiplier: 1.30,
    luxuryMultiplier: 1.70,
    brands: ['Asian Paints Apex Ultima', 'Berger WeatherCoat Anti-Dust', 'Dulux Weathershield'],
    isCodeRef: 'IS 15489 Exterior',
    stage: 'Finishes',
    boqCategoryMatch: 'Finishes',
    boqItemKeywords: ['exterior paint', 'weathercoat', 'apex ultima', 'facade paint'],
  },
  {
    id: 'norm-plumbing-pipes',
    name: 'CPVC Hot/Cold Internal Water Supply Pipes (SDR 11 1")',
    trade: 'MEP & Plumbing',
    category: 'Plumbing & MEP',
    unit: '3m lengths',
    normPerSqFt: 0.028, // ~0.028 lengths (0.084m) per sq.ft built-up area
    normDescription: '0.028 lengths (3m) per sq.ft for toilet risers, kitchen branches, loop headers & concealed lines',
    standardWastagePercent: 5.0,
    baseRate: 485,
    economyMultiplier: 0.88,
    standardMultiplier: 1.0,
    premiumMultiplier: 1.25,
    luxuryMultiplier: 1.55,
    brands: ['Astral CPVC Pro', 'Ashirvad FlowGuard', 'Supreme LifeGuard', 'Prince'],
    isCodeRef: 'IS 15778 / ASTM D2846',
    stage: 'Services',
    boqCategoryMatch: 'MEP & Electrical',
    boqItemKeywords: ['plumbing', 'cpvc', 'pipes', 'water supply', 'drainage', 'sanitary'],
  },
  {
    id: 'norm-electrical-wiring',
    name: 'FRLS Copper Electric Building Wires (1.5, 2.5 & 4.0 sq.mm)',
    trade: 'MEP & Electrical',
    category: 'Plumbing & MEP',
    unit: '90m coils',
    normPerSqFt: 0.032, // 0.032 coils (approx 2.88m wire per sq.ft)
    normDescription: '0.032 coils (90m) per sq.ft built-up area (power circuits, lighting loops, HVAC conduits & earthing)',
    standardWastagePercent: 4.0,
    baseRate: 2850,
    economyMultiplier: 0.88,
    standardMultiplier: 1.0,
    premiumMultiplier: 1.22,
    luxuryMultiplier: 1.50,
    brands: ['Polycab Green Wire', 'Finolex Flamegard', 'Havells LifeLine', 'KEI'],
    isCodeRef: 'IS 694 / IS 732',
    stage: 'Services',
    boqCategoryMatch: 'MEP & Electrical',
    boqItemKeywords: ['electrical', 'wiring', 'point wiring', 'conduit', 'copper wire'],
  },
  {
    id: 'norm-waterproofing',
    name: 'Dual-Layer APP Modified Bitumen Waterproofing Membrane',
    trade: 'Waterproofing',
    category: 'Waterproofing',
    unit: 'sq.m',
    normPerSqFt: 0.045, // 0.045 sq.m per sq.ft built-up area (terrace, balconies, sunken toilets, basement raft)
    normDescription: '0.045 sq.m per sq.ft built-up area for roof slab, sunken toilet depressions, balconies & podium',
    standardWastagePercent: 6.0,
    baseRate: 760,
    economyMultiplier: 0.85,
    standardMultiplier: 1.0,
    premiumMultiplier: 1.30,
    luxuryMultiplier: 1.65,
    brands: ['Dr. Fixit Torchshield', 'Fosroc Proofex', 'STP ShaliPlus', 'SikaTop'],
    isCodeRef: 'IS 1346 / ASTM D6222',
    stage: 'Substructure',
    boqCategoryMatch: 'Waterproofing',
    boqItemKeywords: ['waterproofing', 'membrane', 'app membrane', 'bitumen', 'terrace waterproofing'],
  },
  {
    id: 'norm-windows-dgu',
    name: 'Thermally-Broken Aluminum Sliding Fenestration with Low-E DGU Glass',
    trade: 'Fenestration & Enclosure',
    category: 'Fenestration & Glass',
    unit: 'sq.m',
    normPerSqFt: 0.014, // 0.014 sq.m window per sq.ft built-up area (glazed daylight openings)
    normDescription: '0.014 sq.m per sq.ft built-up area conforming to NBC 2016 10-12% habitable floor daylighting rule',
    standardWastagePercent: 2.0,
    baseRate: 5950,
    economyMultiplier: 0.82,
    standardMultiplier: 1.0,
    premiumMultiplier: 1.35,
    luxuryMultiplier: 1.85,
    brands: ['Saint-Gobain Planitherm', 'Asahi India (AIS)', 'Jindal Fenestration', 'Reynaers'],
    isCodeRef: 'NBC 2016 Part 8 / IS 1081',
    stage: 'Finishes',
    boqCategoryMatch: 'Doors & Windows',
    boqItemKeywords: ['window', 'aluminum window', 'upvc', 'sliding window', 'dgu', 'glass window'],
  },
  {
    id: 'norm-doors-hardware',
    name: 'Solid Core Timber Flush / Teakwood Panel Doors with SS Mortise Hardware',
    trade: 'Carpentry & Joinery',
    category: 'Doors & Carpentry',
    unit: 'door sets',
    normPerSqFt: 0.0038, // 1 door per ~263 sq.ft built-up area (e.g. 11 doors for 3,000 sq.ft)
    normDescription: '0.0038 door sets / sq.ft (approx 1 finished door with frame and hardware per 260 sq.ft)',
    standardWastagePercent: 0,
    baseRate: 18500,
    economyMultiplier: 0.75,
    standardMultiplier: 1.0,
    premiumMultiplier: 1.45,
    luxuryMultiplier: 2.20,
    brands: ['Greenply Club', 'CenturyPly Architect', 'Dorset Hardware', 'Hafele'],
    isCodeRef: 'IS 2202 Part 1 / IS 3564',
    stage: 'Finishes',
    boqCategoryMatch: 'Doors & Windows',
    boqItemKeywords: ['door', 'flush door', 'teakwood', 'timber door', 'wooden door'],
  },
  {
    id: 'norm-earthwork',
    name: 'Mechanical & Manual Foundation Trench Earthwork Excavation',
    trade: 'Earthworks & Foundation',
    category: 'Cement & Concrete',
    unit: 'm3',
    normPerSqFt: 0.055, // 0.055 m3 per sq.ft built-up area
    normDescription: '0.055 m3 excavation per sq.ft built-up area including lift, dressing and soil disposal',
    standardWastagePercent: 0,
    baseRate: 310,
    economyMultiplier: 0.85,
    standardMultiplier: 1.0,
    premiumMultiplier: 1.25,
    luxuryMultiplier: 1.55,
    brands: ['JCB Excavator Equipment', 'Tata Hitachi Tracked Backhoe'],
    isCodeRef: 'IS 1200 Part 1',
    stage: 'Substructure',
    boqCategoryMatch: 'Substructure',
    boqItemKeywords: ['earthwork', 'excavation', 'foundation trench', 'soil'],
  },
];

/**
 * Calculated Material Takeoff Item with dynamic quantity derived from area and live market price
 */
export interface CalculatedMaterialTakeoffItem {
  norm: MaterialTakeoffNorm;
  areaSqFt: number;
  rawQuantity: number;
  quantityWithWastage: number;
  roundedQuantity: number;
  unit: string;
  marketRate: number; // Adjusted for region & tier
  totalCost: number;
  costPerSqFt: number;
  percentOfTotalMaterialBudget: number;
  matchedBenchmarkKey?: string;
  region: (typeof MARKET_REGIONS)[number];
  tier: MarketQualityTier;
}

/**
 * Material Takeoff Summary Report for the entire project built-up area
 */
export interface MaterialTakeoffReport {
  areaSqFt: number;
  region: (typeof MARKET_REGIONS)[number];
  tier: MarketQualityTier;
  pricingBasis: MarketPricingBasis;
  items: CalculatedMaterialTakeoffItem[];
  totalMaterialCost: number;
  materialCostPerSqFt: number;
  categoryBreakdown: Record<string, { cost: number; percent: number; itemsCount: number }>;
  stageBreakdown: Record<string, { cost: number; percent: number }>;
  keyMaterialVolumes: {
    cementBags: number;
    steelMetricTonnes: number;
    sandTonnes: number;
    concreteM3: number;
    blocksM3: number;
    tilesSqFt: number;
    paintLiters: number;
  };
}

/**
 * Calculates ALL material quantities based on built-up area and prevailing live market prices
 */
export function calculateMaterialTakeoffFromArea(
  areaSqFt: number,
  regionId: MarketRegion = 'bangalore',
  tier: MarketQualityTier = 'Standard',
  pricingBasis: MarketPricingBasis = 'spot_market'
): MaterialTakeoffReport {
  const validArea = Math.max(10, Math.round(areaSqFt || 3000));
  const region = MARKET_REGIONS.find((r) => r.id === regionId) || MARKET_REGIONS[0];

  // Pricing basis multiplier (Procurement bulk -5%, Retail cash +8%, Spot baseline 1.0)
  const basisFactor =
    pricingBasis === 'procurement_bulk' ? 0.95 : pricingBasis === 'retail_cash' ? 1.08 : 1.0;

  // Step 1: Compute individual material quantities and live market rates
  let totalCost = 0;
  const items: CalculatedMaterialTakeoffItem[] = MATERIAL_TAKEOFF_NORMS.map((norm) => {
    // Quantity calculation: Area * Norm * (1 + Wastage%)
    const rawQuantity = validArea * norm.normPerSqFt;
    const quantityWithWastage = rawQuantity * (1 + norm.standardWastagePercent / 100);

    // Smart rounding per unit
    let roundedQuantity = Math.round(quantityWithWastage);
    if (norm.unit === 'MT (Metric Tonne)' || norm.unit === 'm3') {
      roundedQuantity = Math.round(quantityWithWastage * 100) / 100;
    } else if (norm.unit === 'tonne' || norm.unit === 'sq.m' || norm.unit === '90m coils') {
      roundedQuantity = Math.round(quantityWithWastage * 10) / 10;
    } else if (norm.unit === 'door sets') {
      roundedQuantity = Math.max(1, Math.round(quantityWithWastage));
    }

    // Live Market Rate calculation:
    // BaseRate * Regional Factor * Tier Factor * Pricing Basis Factor
    let tierMultiplier = norm.standardMultiplier;
    if (tier === 'Economy') tierMultiplier = norm.economyMultiplier;
    else if (tier === 'Premium') tierMultiplier = norm.premiumMultiplier;
    else if (tier === 'Luxury') tierMultiplier = norm.luxuryMultiplier;

    const regionalFactor = (region.materialMultiplier + region.transportMultiplier) / 2;
    const marketRate = Math.round(norm.baseRate * regionalFactor * tierMultiplier * basisFactor);
    const itemTotalCost = Math.round(roundedQuantity * marketRate);
    totalCost += itemTotalCost;

    return {
      norm,
      areaSqFt: validArea,
      rawQuantity,
      quantityWithWastage,
      roundedQuantity,
      unit: norm.unit,
      marketRate,
      totalCost: itemTotalCost,
      costPerSqFt: Math.round((itemTotalCost / validArea) * 10) / 10,
      percentOfTotalMaterialBudget: 0, // Populated after totalCost known
      region,
      tier,
    };
  });

  // Step 2: Compute percentage weights and breakdowns
  const categoryBreakdown: Record<string, { cost: number; percent: number; itemsCount: number }> = {};
  const stageBreakdown: Record<string, { cost: number; percent: number }> = {};

  items.forEach((item) => {
    item.percentOfTotalMaterialBudget =
      totalCost > 0 ? Math.round(((item.totalCost / totalCost) * 100) * 10) / 10 : 0;

    // Category
    const cat = item.norm.category;
    if (!categoryBreakdown[cat]) {
      categoryBreakdown[cat] = { cost: 0, percent: 0, itemsCount: 0 };
    }
    categoryBreakdown[cat].cost += item.totalCost;
    categoryBreakdown[cat].itemsCount += 1;

    // Stage
    const stg = item.norm.stage;
    if (!stageBreakdown[stg]) {
      stageBreakdown[stg] = { cost: 0, percent: 0 };
    }
    stageBreakdown[stg].cost += item.totalCost;
  });

  // Calculate percentages
  Object.keys(categoryBreakdown).forEach((cat) => {
    categoryBreakdown[cat].percent =
      totalCost > 0 ? Math.round(((categoryBreakdown[cat].cost / totalCost) * 100) * 10) / 10 : 0;
  });

  Object.keys(stageBreakdown).forEach((stg) => {
    stageBreakdown[stg].percent =
      totalCost > 0 ? Math.round(((stageBreakdown[stg].cost / totalCost) * 100) * 10) / 10 : 0;
  });

  // Key material volumes for quick executive scannability
  const cementItem = items.find((i) => i.norm.id === 'norm-cement');
  const steelItem = items.find((i) => i.norm.id === 'norm-steel');
  const sandItem = items.find((i) => i.norm.id === 'norm-sand');
  const rmcItem = items.find((i) => i.norm.id === 'norm-rmc');
  const blocksItem = items.find((i) => i.norm.id === 'norm-aac-blocks');
  const tilesItem = items.find((i) => i.norm.id === 'norm-vitrified-tiles');
  const intPaintItem = items.find((i) => i.norm.id === 'norm-interior-paint');
  const extPaintItem = items.find((i) => i.norm.id === 'norm-exterior-paint');

  const keyMaterialVolumes = {
    cementBags: cementItem ? cementItem.roundedQuantity : Math.round(validArea * 0.42),
    steelMetricTonnes: steelItem ? steelItem.roundedQuantity : Math.round(validArea * 0.0038 * 100) / 100,
    sandTonnes: sandItem ? sandItem.roundedQuantity : Math.round(validArea * 0.082),
    concreteM3: rmcItem ? rmcItem.roundedQuantity : Math.round(validArea * 0.035 * 10) / 10,
    blocksM3: blocksItem ? blocksItem.roundedQuantity : Math.round(validArea * 0.028 * 10) / 10,
    tilesSqFt: tilesItem ? tilesItem.roundedQuantity : Math.round(validArea * 1.22),
    paintLiters: Math.round(
      (intPaintItem?.roundedQuantity || validArea * 0.045) + (extPaintItem?.roundedQuantity || validArea * 0.022)
    ),
  };

  return {
    areaSqFt: validArea,
    region,
    tier,
    pricingBasis,
    items,
    totalMaterialCost: totalCost,
    materialCostPerSqFt: Math.round(totalCost / validArea),
    categoryBreakdown,
    stageBreakdown,
    keyMaterialVolumes,
  };
}

/**
 * Result of syncing BOQ items with both Area-based Quantities and Live Market Prices
 */
export interface BOQAreaMarketUpdateResult {
  updatedItems: BOQItem[];
  report: {
    previousAreaSqFt: number;
    newAreaSqFt: number;
    region: (typeof MARKET_REGIONS)[number];
    tier: MarketQualityTier;
    pricingBasis: MarketPricingBasis;
    itemsCount: number;
    quantitiesUpdatedCount: number;
    ratesUpdatedCount: number;
    previousSubtotal: number;
    updatedSubtotal: number;
    previousCostPerSqFt: number;
    updatedCostPerSqFt: number;
    varianceAmount: number;
    variancePercent: number;
    itemDetails: Array<{
      id: string;
      name: string;
      previousQty: number;
      newQty: number;
      previousRate: number;
      newRate: number;
      previousAmount: number;
      newAmount: number;
      qtyFormula: string;
      rateSource: string;
    }>;
  };
}

/**
 * AUTOMATIC DATA UPDATE:
 * Simultaneously recalibrates all BOQ line items:
 * 1. Quantities recomputed with Area based on construction engineering consumption rules
 * 2. Rates recomputed with prevailing Market Prices based on regional hub and quality tier
 */
export function autoUpdateBOQItemsWithAreaAndMarketPrice(
  currentItems: BOQItem[],
  newAreaSqFt: number,
  previousAreaSqFt: number = 3000,
  options: {
    regionId?: MarketRegion;
    tier?: MarketQualityTier;
    pricingBasis?: MarketPricingBasis;
    updateQuantitiesWithArea?: boolean;
    updateRatesWithMarketPrice?: boolean;
    selectedItemIds?: string[];
  } = {}
): BOQAreaMarketUpdateResult {
  const {
    regionId = 'bangalore',
    tier = 'Standard',
    pricingBasis = 'spot_market',
    updateQuantitiesWithArea = true,
    updateRatesWithMarketPrice = true,
    selectedItemIds,
  } = options;

  const validNewArea = Math.max(10, Math.round(newAreaSqFt));
  const validPrevArea = Math.max(10, Math.round(previousAreaSqFt || 3000));
  const areaScaleFactor = validNewArea / validPrevArea;

  const region = MARKET_REGIONS.find((r) => r.id === regionId) || MARKET_REGIONS[0];

  let prevSubtotal = 0;
  let newSubtotal = 0;
  let qtyUpdatedCount = 0;
  let rateUpdatedCount = 0;

  const itemDetails: BOQAreaMarketUpdateResult['report']['itemDetails'] = [];

  const updatedItems = currentItems.map((item) => {
    const isSelected = !selectedItemIds || selectedItemIds.includes(item.id);
    const oldAmt = item.quantity * item.rate;
    prevSubtotal += oldAmt;

    if (!isSelected) {
      newSubtotal += oldAmt;
      return item;
    }

    // Match item to market benchmark
    const marketMatch = matchBOQItemToMarket(item, regionId, tier, pricingBasis);
    const benchmark = marketMatch.matchedBenchmark;

    // --- 1. QUANTITY COMPUTATION BASED ON AREA ---
    let newQty = item.quantity;
    let qtyFormula = 'Preserved';

    if (updateQuantitiesWithArea) {
      if (benchmark && benchmark.qtyPerSqFt && benchmark.qtyPerSqFt > 0) {
        // Direct engineering norm formula based on square footage!
        const computedRaw = validNewArea * benchmark.qtyPerSqFt;
        if (benchmark.unit === 'MT' || benchmark.unit === 'm3') {
          newQty = Math.round(computedRaw * 100) / 100;
        } else if (benchmark.unit === 'nos' || benchmark.unit === 'point') {
          newQty = Math.max(1, Math.round(computedRaw));
        } else {
          newQty = Math.round(computedRaw * 10) / 10;
        }
        qtyFormula = `${validNewArea.toLocaleString()} sq.ft × ${benchmark.qtyPerSqFt} ${benchmark.unit}/sq.ft`;
      } else {
        // Proportional scale factor for custom or unique items
        newQty = Math.round(item.quantity * areaScaleFactor * 10) / 10;
        qtyFormula = `Scaled by area factor ${(areaScaleFactor).toFixed(2)}x`;
      }
      qtyUpdatedCount++;
    }

    // --- 2. RATE COMPUTATION BASED ON MARKET PRICE ---
    let newRate = item.rate;
    let rateSource = 'Existing';

    if (updateRatesWithMarketPrice) {
      newRate = marketMatch.marketRate;
      rateSource = `${region.shortName} (${tier}) Live Market`;
      rateUpdatedCount++;
    }

    // --- 3. AMOUNT COMPUTATION ---
    const newAmt = Math.round(newQty * newRate);
    newSubtotal += newAmt;

    itemDetails.push({
      id: item.id,
      name: item.name,
      previousQty: item.quantity,
      newQty,
      previousRate: item.rate,
      newRate,
      previousAmount: oldAmt,
      newAmount: newAmt,
      qtyFormula,
      rateSource,
    });

    return {
      ...item,
      quantity: newQty,
      rate: newRate,
      amount: newAmt,
      materialComponent: benchmark.materialComponent,
      laborComponent: benchmark.laborComponent,
      equipmentComponent: benchmark.equipmentComponent,
      overheadComponent: benchmark.overheadComponent,
    };
  });

  const prevCostPerSqFt = Math.round(prevSubtotal / validPrevArea);
  const newCostPerSqFt = Math.round(newSubtotal / validNewArea);
  const varianceAmt = newSubtotal - prevSubtotal;
  const variancePct = prevSubtotal > 0 ? Math.round(((varianceAmt / prevSubtotal) * 100) * 10) / 10 : 0;

  return {
    updatedItems,
    report: {
      previousAreaSqFt: validPrevArea,
      newAreaSqFt: validNewArea,
      region,
      tier,
      pricingBasis,
      itemsCount: currentItems.length,
      quantitiesUpdatedCount: qtyUpdatedCount,
      ratesUpdatedCount: rateUpdatedCount,
      previousSubtotal: prevSubtotal,
      updatedSubtotal: newSubtotal,
      previousCostPerSqFt: prevCostPerSqFt,
      updatedCostPerSqFt: newCostPerSqFt,
      varianceAmount: varianceAmt,
      variancePercent: variancePct,
      itemDetails,
    },
  };
}
