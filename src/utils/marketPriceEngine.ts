/**
 * Market Price Engine for Construction Schedules of Rates & Quantities (BOQ)
 * Grounded in:
 * - CPWD Delhi Schedule of Rates (DSR 2024-2026)
 * - State PWD Schedules (Karnataka, Telangana, Maharashtra, Tamil Nadu)
 * - Wholesale Price Index (WPI - Building Materials, Office of Economic Adviser)
 * - Spot Mandi & Primary Mill Indices (Tata, JSW, UltraTech, ACC, Saint-Gobain)
 */

import { BOQItem } from '../types';

export type MarketRegion = 'national' | 'bangalore' | 'hyderabad' | 'mumbai' | 'delhi' | 'chennai';
export type MarketPricingBasis = 'spot_market' | 'cpwd_dsr' | 'procurement_bulk' | 'retail_cash';
export type MarketQualityTier = 'Economy' | 'Standard' | 'Premium' | 'Luxury';

export interface MarketRegionMeta {
  id: MarketRegion;
  name: string;
  shortName: string;
  state: string;
  laborMultiplier: number;
  materialMultiplier: number;
  transportMultiplier: number;
  description: string;
}

export const MARKET_REGIONS: MarketRegionMeta[] = [
  {
    id: 'national',
    name: 'National Benchmark (CPWD DSR Average)',
    shortName: 'National (CPWD)',
    state: 'India Baseline',
    laborMultiplier: 1.0,
    materialMultiplier: 1.0,
    transportMultiplier: 1.0,
    description: 'Central Public Works Department baseline composite rates across Tier-1 and Tier-2 urban centres.',
  },
  {
    id: 'bangalore',
    name: 'Bengaluru / Karnataka Hub',
    shortName: 'Bengaluru (Live)',
    state: 'Karnataka',
    laborMultiplier: 1.08,
    materialMultiplier: 1.04,
    transportMultiplier: 1.03,
    description: 'Higher M-Sand processing demand, skilled carpenter/bar-bender tariffs, active tech-park corridor logistics.',
  },
  {
    id: 'hyderabad',
    name: 'Hyderabad / Telangana Hub',
    shortName: 'Hyderabad',
    state: 'Telangana',
    laborMultiplier: 0.96,
    materialMultiplier: 0.98,
    transportMultiplier: 0.95,
    description: 'Competitive cement and aggregate proximity from Telangana clusters; aggressive commercial infrastructure pace.',
  },
  {
    id: 'mumbai',
    name: 'Mumbai Metropolitan Region (MMR)',
    shortName: 'Mumbai (MMR)',
    state: 'Maharashtra',
    laborMultiplier: 1.15,
    materialMultiplier: 1.10,
    transportMultiplier: 1.18,
    description: 'Restricted heavy truck haulage hours, higher octroi/local transit costs, and premium skilled labor rates.',
  },
  {
    id: 'delhi',
    name: 'Delhi-NCR / Northern Plains',
    shortName: 'Delhi-NCR',
    state: 'Delhi / NCR',
    laborMultiplier: 1.02,
    materialMultiplier: 1.02,
    transportMultiplier: 1.04,
    description: 'Seasonal winter air quality construction curbs (GRAP IV) and high stone aggregate transit lead distances.',
  },
  {
    id: 'chennai',
    name: 'Chennai / Tamil Nadu Coastal',
    shortName: 'Chennai',
    state: 'Tamil Nadu',
    laborMultiplier: 1.03,
    materialMultiplier: 1.01,
    transportMultiplier: 1.02,
    description: 'Coastal salt-fog resistant reinforcement specs, river sand regulation, and local quarry cluster rates.',
  },
];

export interface MarketBenchmarkItem {
  key: string;
  name: string;
  category: string;
  unit: string;
  // Base rates in INR for National Standard baseline
  economyRate: number;
  standardRate: number;
  premiumRate: number;
  luxuryRate: number;
  source: string;
  description: string;
  // Component breakdown
  materialComponent: number;
  laborComponent: number;
  equipmentComponent: number;
  overheadComponent: number;
  // Standard consumption thumb rule per sq.ft of built-up area (optional)
  qtyPerSqFt?: number;
  keywords: string[];
}

export const MARKET_BENCHMARK_CATALOG: MarketBenchmarkItem[] = [
  {
    key: 'earthwork_excavation',
    name: 'Earthwork excavation in foundation trenches',
    category: 'Substructure',
    unit: 'm3',
    economyRate: 220,
    standardRate: 310,
    premiumRate: 390,
    luxuryRate: 480,
    source: 'CPWD DSR 2026 Item 2.8.1 + JCB mechanical operator rates',
    description: 'Excavation in ordinary soil/gravel including dressing, ramming bottom, lift up to 2.5m, and dewatering allowances.',
    materialComponent: 0.05,
    laborComponent: 0.65,
    equipmentComponent: 0.22,
    overheadComponent: 0.08,
    qtyPerSqFt: 0.055,
    keywords: ['earthwork', 'excavation', 'trench', 'foundation trench', 'soil', 'gravel', 'pit'],
  },
  {
    key: 'pcc_substructure',
    name: 'PCC (1:4:8) with 40mm graded granite metal',
    category: 'Substructure',
    unit: 'm3',
    economyRate: 4400,
    standardRate: 5150,
    premiumRate: 5800,
    luxuryRate: 6400,
    source: 'CPWD DSR 2026 Item 4.1.8 + Regional crushed aggregate index',
    description: 'Plain cement concrete in foundation bed, 100mm layer, compacted with surface plate vibrators.',
    materialComponent: 0.72,
    laborComponent: 0.18,
    equipmentComponent: 0.04,
    overheadComponent: 0.06,
    qtyPerSqFt: 0.009,
    keywords: ['pcc', 'plain cement concrete', '1:4:8', '1:3:6', 'foundation bed', 'mud mat', 'lean concrete'],
  },
  {
    key: 'rcc_superstructure',
    name: 'RCC M25 / M30 design mix for columns, plinth beams & slabs',
    category: 'Concrete Works',
    unit: 'm3',
    economyRate: 7200,
    standardRate: 8950,
    premiumRate: 10400,
    luxuryRate: 12200,
    source: 'CPWD DSR 2026 Item 5.2.2 + Transit mixer RMC batching rates',
    description: 'Design mix concrete including centering, shuttering formwork, mechanical staging, hoisting and needle vibrator consolidation.',
    materialComponent: 0.66,
    laborComponent: 0.22,
    equipmentComponent: 0.05,
    overheadComponent: 0.07,
    qtyPerSqFt: 0.022,
    keywords: ['rcc', 'reinforced concrete', 'm25', 'm30', 'm20', 'column', 'beam', 'slab', 'footing', 'superstructure concrete'],
  },
  {
    key: 'tmt_steel_reinforcement',
    name: 'Thermo-mechanically treated (TMT) Fe550D steel reinforcement',
    category: 'Concrete Works',
    unit: 'MT',
    economyRate: 68000,
    standardRate: 75200,
    premiumRate: 82000,
    luxuryRate: 89000,
    source: 'Steel Mandi National Benchmark (Tata Tiscon / JSW Neosteel / SAIL)',
    description: 'Primary mill Fe550D TMT bars with ISI certification, cutting, cold bending, hooking, cranked bars, binding wire and cover blocks.',
    materialComponent: 0.86,
    laborComponent: 0.09,
    equipmentComponent: 0.01,
    overheadComponent: 0.04,
    qtyPerSqFt: 0.0018, // ~1.8 kg per sq.ft structural
    keywords: ['tmt', 'steel', 'fe550d', 'fe500d', 'reinforcement', 'rebar', 're-bar', 'bars'],
  },
  {
    key: 'aac_block_masonry',
    name: 'Autoclaved Aerated Concrete (AAC) blocks (200mm / 150mm)',
    category: 'Masonry',
    unit: 'm3',
    economyRate: 4600,
    standardRate: 5350,
    premiumRate: 6100,
    luxuryRate: 6900,
    source: 'Siporex / Magicrete Regional Rate Sheets + Polymer thin-bed mortar',
    description: 'Precision AAC block walling bonded with high-grade polymer adhesive, including lintel tie-bands and groove cuts.',
    materialComponent: 0.70,
    laborComponent: 0.22,
    equipmentComponent: 0.01,
    overheadComponent: 0.07,
    qtyPerSqFt: 0.026,
    keywords: ['aac', 'aerated concrete', 'block', 'blocks', 'blockwork', 'lightweight block'],
  },
  {
    key: 'brick_masonry',
    name: 'Wire-cut red clay brick masonry in 1:6 cement mortar',
    category: 'Masonry',
    unit: 'm3',
    economyRate: 6200,
    standardRate: 7400,
    premiumRate: 8600,
    luxuryRate: 9800,
    source: 'State PWD Masonry Schedule + Table-moulded brick index',
    description: 'First class kiln burned clay brickwork in foundation and plinth with clean struck joints.',
    materialComponent: 0.68,
    laborComponent: 0.24,
    equipmentComponent: 0.01,
    overheadComponent: 0.07,
    qtyPerSqFt: 0.028,
    keywords: ['brick', 'clay brick', 'red brick', 'brickwork', 'masonry wall'],
  },
  {
    key: 'internal_plastering',
    name: 'Internal cement plastering 1:4 mix (15mm thick smooth sponge finish)',
    category: 'Finishes',
    unit: 'sq.m',
    economyRate: 230,
    standardRate: 295,
    premiumRate: 360,
    luxuryRate: 440,
    source: 'CPWD DSR 2026 Item 13.1.2 + Plastering master mason rates',
    description: 'Smooth sponge finished internal wall plastering with chicken mesh at RCC-block joints, 14 days curing.',
    materialComponent: 0.44,
    laborComponent: 0.46,
    equipmentComponent: 0.02,
    overheadComponent: 0.08,
    qtyPerSqFt: 0.16,
    keywords: ['plaster', 'plastering', 'internal plaster', 'sponge finish', 'cement plaster', 'putty'],
  },
  {
    key: 'external_plastering',
    name: 'External sand-faced double coat cement plastering (20mm)',
    category: 'Finishes',
    unit: 'sq.m',
    economyRate: 310,
    standardRate: 385,
    premiumRate: 470,
    luxuryRate: 560,
    source: 'CPWD DSR 2026 Item 13.2.1 + Waterproofing compound admixture',
    description: 'Two-coat external weather plaster with integral waterproofing compound and scaffolding.',
    materialComponent: 0.48,
    laborComponent: 0.42,
    equipmentComponent: 0.03,
    overheadComponent: 0.07,
    qtyPerSqFt: 0.12,
    keywords: ['external plaster', 'sand-face', 'rough cast', 'waterproof plaster', 'facade plaster'],
  },
  {
    key: 'vitrified_tile_flooring',
    name: 'Full-body vitrified tiles (1200mm x 600mm) with epoxy grout',
    category: 'Finishes',
    unit: 'sq.m',
    economyRate: 1050,
    standardRate: 1480,
    premiumRate: 1950,
    luxuryRate: 2600,
    source: 'Kajaria / Somany / Simpolo Architectural Pricing Index',
    description: 'Large format double charged / glazed vitrified tiles with polymeric tile adhesive and epoxy anti-stain grouting.',
    materialComponent: 0.74,
    laborComponent: 0.18,
    equipmentComponent: 0.01,
    overheadComponent: 0.07,
    qtyPerSqFt: 0.08,
    keywords: ['tile', 'vitrified', 'flooring', 'gvt', 'double charged', 'floor tile', 'skirting'],
  },
  {
    key: 'italian_marble_flooring',
    name: 'Italian Statuario / Botticino marble flooring with diamond mirror polish',
    category: 'Finishes',
    unit: 'sq.m',
    economyRate: 3800,
    standardRate: 5400,
    premiumRate: 7600,
    luxuryRate: 11500,
    source: 'Silvassa & Makrana Marble Importers Association',
    description: 'Imported natural stone slabs laid on cement mortar bed with tin oxide / diamond stone mirror polish.',
    materialComponent: 0.82,
    laborComponent: 0.12,
    equipmentComponent: 0.02,
    overheadComponent: 0.04,
    qtyPerSqFt: 0.04,
    keywords: ['marble', 'italian marble', 'granite', 'statuario', 'botticino', 'stone flooring'],
  },
  {
    key: 'aluminum_sliding_windows',
    name: 'Thermally-broken aluminum sliding window system with Low-E DGU glass',
    category: 'Doors & Windows',
    unit: 'sq.m',
    economyRate: 4200,
    standardRate: 5950,
    premiumRate: 7800,
    luxuryRate: 10500,
    source: 'Jindal / Reynaers / Schüco Fenestration Certified Fabricators',
    description: 'Powder coated/anodized aluminum sections, 6mm Low-E toughened + 12mm cavity + 6mm clear glass, EPDM gaskets, multi-point locking.',
    materialComponent: 0.78,
    laborComponent: 0.14,
    equipmentComponent: 0.01,
    overheadComponent: 0.07,
    qtyPerSqFt: 0.014,
    keywords: ['window', 'aluminum window', 'upvc', 'sliding window', 'dgu', 'glass window', 'fenestration', 'casement'],
  },
  {
    key: 'teakwood_flush_doors',
    name: 'Teakwood solid core timber flush doors with brass architectural hardware',
    category: 'Doors & Windows',
    unit: 'nos',
    economyRate: 11500,
    standardRate: 18500,
    premiumRate: 26500,
    luxuryRate: 38000,
    source: 'Greenply / CenturyPly / Dorset / Hafele Hardware Index',
    description: '38mm thick solid flush door shutter with Burma/CP teakwood frame, natural wood veneer, melamine polish, mortise lock and SS/brass hinges.',
    materialComponent: 0.70,
    laborComponent: 0.22,
    equipmentComponent: 0.01,
    overheadComponent: 0.07,
    qtyPerSqFt: 0.004,
    keywords: ['door', 'flush door', 'teakwood', 'timber door', 'wooden door', 'entrance door', 'bedroom door', 'shutter'],
  },
  {
    key: 'structural_steel_framing',
    name: 'Structural steel canopy framing for vehicle entrance portico',
    category: 'Concrete Works',
    unit: 'MT',
    economyRate: 82000,
    standardRate: 94000,
    premiumRate: 108000,
    luxuryRate: 125000,
    source: 'Structural Fabricators Association (Tata Structura hollow sections)',
    description: 'Hot rolled/built-up steel sections, laser-cut gussets, high tensile anchor bolts, zinc-chromate anti-corrosive primer and 2 coats PU enamel.',
    materialComponent: 0.75,
    laborComponent: 0.16,
    equipmentComponent: 0.04,
    overheadComponent: 0.05,
    qtyPerSqFt: 0.0012,
    keywords: ['canopy', 'structural steel', 'framing', 'portico', 'steel truss', 'purlins', 'i-section', 'fabrication'],
  },
  {
    key: 'electrical_conduits_wiring',
    name: 'Concealed electrical point wiring & distribution boards (FRLS grade)',
    category: 'MEP & Electrical',
    unit: 'nos',
    economyRate: 850,
    standardRate: 1180,
    premiumRate: 1550,
    luxuryRate: 2100,
    source: 'Polycab / Havells / Schneider Electric / Legrand Contracting Rates',
    description: 'Fire Retardant Low Smoke (FRLS) multi-strand copper conductors in heavy-duty PVC conduits, modular switches, MCBs and earth continuity.',
    materialComponent: 0.65,
    laborComponent: 0.26,
    equipmentComponent: 0.01,
    overheadComponent: 0.08,
    qtyPerSqFt: 0.038,
    keywords: ['electrical', 'wiring', 'point wiring', 'conduit', 'modular switch', 'db', 'distribution board', 'lighting point'],
  },
  {
    key: 'plumbing_sanitary_fixtures',
    name: 'Internal CPVC water supply & soil waste drainage lines with CP fixtures',
    category: 'MEP & Electrical',
    unit: 'point',
    economyRate: 1800,
    standardRate: 2450,
    premiumRate: 3400,
    luxuryRate: 4800,
    source: 'Astral Pipes / Ashirvad / Jaquar / Kohler MEP Contractors',
    description: 'SDR 11 CPVC hot/cold piping, SWR drainage stacks, bottle traps, angle valves and testing to 10 kg/cm2 pressure.',
    materialComponent: 0.68,
    laborComponent: 0.23,
    equipmentComponent: 0.01,
    overheadComponent: 0.08,
    qtyPerSqFt: 0.02,
    keywords: ['plumbing', 'sanitary', 'drainage', 'cpvc', 'water supply', 'pipes', 'fixtures', 'toilet plumbing'],
  },
  {
    key: 'waterproofing_membrane',
    name: 'Dual-layer APP modified elastomeric bitumen membrane waterproofing',
    category: 'Waterproofing',
    unit: 'sq.m',
    economyRate: 540,
    standardRate: 760,
    premiumRate: 980,
    luxuryRate: 1300,
    source: 'Dr. Fixit / Fosroc / STP Specialized Waterproofing Applicators',
    description: 'Torched 3mm + 3mm APP modified membrane over bitumen primer, reinforced with non-woven polyester mat, 10-year turnkey warranty.',
    materialComponent: 0.72,
    laborComponent: 0.20,
    equipmentComponent: 0.01,
    overheadComponent: 0.07,
    qtyPerSqFt: 0.05,
    keywords: ['waterproofing', 'membrane', 'app membrane', 'bitumen', 'terrace waterproofing', 'podium', 'damp proofing'],
  },
  {
    key: 'interior_emulsion_paint',
    name: 'Premium interior luxury acrylic emulsion painting (2 coats putty + primer)',
    category: 'Finishes',
    unit: 'sq.m',
    economyRate: 125,
    standardRate: 175,
    premiumRate: 240,
    luxuryRate: 340,
    source: 'Asian Paints Royale / Berger Silk / Dulux Velvet Touch Index',
    description: 'Substrate sanding, 2 coats acrylic wall putty, 1 coat sealer primer, and 2 coats luxury washable interior emulsion.',
    materialComponent: 0.52,
    laborComponent: 0.40,
    equipmentComponent: 0.01,
    overheadComponent: 0.07,
    qtyPerSqFt: 0.18,
    keywords: ['paint', 'painting', 'emulsion', 'interior paint', 'acrylic emulsion', 'royale', 'distemper'],
  },
  {
    key: 'exterior_weatherproof_paint',
    name: 'Exterior silicone-acrylic weather-defense elastomeric coating',
    category: 'Finishes',
    unit: 'sq.m',
    economyRate: 160,
    standardRate: 220,
    premiumRate: 295,
    luxuryRate: 390,
    source: 'Asian Paints Apex Ultima / Nerolac Excel Weather Defense',
    description: 'High-durability anti-fungal, dirt-pickup resistant exterior elastomeric paint with exterior primer on double coat plaster.',
    materialComponent: 0.55,
    laborComponent: 0.36,
    equipmentComponent: 0.02,
    overheadComponent: 0.07,
    qtyPerSqFt: 0.12,
    keywords: ['exterior paint', 'weathercoat', 'apex ultima', 'anti-fungal paint', 'exterior coating'],
  },
];

export interface ItemMarketMatchResult {
  item: BOQItem;
  matchedBenchmark: MarketBenchmarkItem;
  currentRate: number;
  marketRate: number;
  rateDelta: number; // marketRate - currentRate
  percentDelta: number; // ((marketRate - currentRate) / (currentRate || 1)) * 100
  currentAmount: number;
  marketAmount: number;
  amountDelta: number;
  status: 'exact' | 'underpriced' | 'overpriced' | 'unrated';
  confidenceScore: number; // 0 - 100
  sourceCitation: string;
  suggestedQty?: number;
  suggestedUnit?: string;
  unitMismatch: boolean;
}

export interface MarketUpdateReport {
  timestamp: string;
  region: MarketRegionMeta;
  pricingBasis: MarketPricingBasis;
  tier: MarketQualityTier;
  totalItemsCount: number;
  updatedItemsCount: number;
  unratedFixedCount: number;
  previousSubtotal: number;
  updatedSubtotal: number;
  totalVarianceAmount: number;
  totalVariancePct: number;
  itemMatches: ItemMarketMatchResult[];
}

/**
 * Normalizes strings for keyword matching
 */
const normalizeText = (text: string): string => {
  return (text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
};

/**
 * Calculates match score between an item and benchmark based on keywords, category, and unit
 */
function computeMatchScore(item: BOQItem, benchmark: MarketBenchmarkItem): number {
  const normName = normalizeText(item.name);
  const normNotes = normalizeText(item.notes || '');
  const combined = `${normName} ${normNotes}`;
  const normCat = normalizeText(item.category);
  const normBenchCat = normalizeText(benchmark.category);

  let score = 0;

  // Category alignment
  if (normCat === normBenchCat || normCat.includes(normBenchCat) || normBenchCat.includes(normCat)) {
    score += 25;
  }

  // Keyword hits
  let hitCount = 0;
  benchmark.keywords.forEach((kw) => {
    if (combined.includes(kw.toLowerCase())) {
      hitCount++;
      score += 15;
    }
  });

  // Unit alignment
  const itemUnit = normalizeText(item.unit);
  const benchUnit = normalizeText(benchmark.unit);
  if (itemUnit === benchUnit) {
    score += 20;
  } else if (
    (itemUnit === 'm3' && benchUnit === 'mt' && combined.includes('steel')) ||
    (itemUnit === 'sq m' && benchUnit === 'sq.m') ||
    (itemUnit === 'cum' && benchUnit === 'm3') ||
    (itemUnit === 'sqm' && benchUnit === 'sq.m')
  ) {
    // Known convertible units
    score += 10;
  }

  return Math.min(100, score);
}

/**
 * Finds best matching market benchmark for any BOQ item
 */
export function matchBOQItemToMarket(
  item: BOQItem,
  regionId: MarketRegion = 'bangalore',
  tier: MarketQualityTier = 'Standard',
  pricingBasis: MarketPricingBasis = 'spot_market'
): ItemMarketMatchResult {
  const region = MARKET_REGIONS.find((r) => r.id === regionId) || MARKET_REGIONS[0];

  let bestMatch: MarketBenchmarkItem = MARKET_BENCHMARK_CATALOG[0];
  let highestScore = -1;

  for (const bench of MARKET_BENCHMARK_CATALOG) {
    const score = computeMatchScore(item, bench);
    if (score > highestScore) {
      highestScore = score;
      bestMatch = bench;
    }
  }

  // Fallback if low score: match strictly by category
  if (highestScore < 20) {
    const categoryMatch = MARKET_BENCHMARK_CATALOG.find((b) =>
      normalizeText(b.category) === normalizeText(item.category)
    );
    if (categoryMatch) {
      bestMatch = categoryMatch;
      highestScore = 30;
    }
  }

  // Determine base rate by tier
  let baseRate = bestMatch.standardRate;
  if (tier === 'Economy') baseRate = bestMatch.economyRate;
  else if (tier === 'Premium') baseRate = bestMatch.premiumRate;
  else if (tier === 'Luxury') baseRate = bestMatch.luxuryRate;

  // Apply regional multipliers
  // Composite = materialComponent * materialMult + laborComponent * laborMult + equipmentComponent * transportMult + overhead
  const compositeRegionalMultiplier =
    bestMatch.materialComponent * region.materialMultiplier +
    bestMatch.laborComponent * region.laborMultiplier +
    (bestMatch.equipmentComponent + bestMatch.overheadComponent) * region.transportMultiplier;

  let computedMarketRate = Math.round(baseRate * compositeRegionalMultiplier);

  // Apply Pricing Basis adjustments
  if (pricingBasis === 'cpwd_dsr') {
    // Official standard government schedule
    computedMarketRate = Math.round(baseRate * 0.94);
  } else if (pricingBasis === 'procurement_bulk') {
    // 5% wholesale / direct mill discount
    computedMarketRate = Math.round(computedMarketRate * 0.95);
  } else if (pricingBasis === 'retail_cash') {
    // 8% retail dealer mark-up
    computedMarketRate = Math.round(computedMarketRate * 1.08);
  }

  // Specific unit mismatch conversion adjustments:
  // e.g., if item is steel entered in m3 instead of MT, convert rate to MT
  let unitMismatch = false;
  let suggestedUnit: string | undefined = undefined;
  const rawUnit = (item.unit || '').trim().toLowerCase();
  const rawName = (item.name || '').toLowerCase();

  if ((rawName.includes('steel') || rawName.includes('tmt')) && (rawUnit === 'm3' || rawUnit === 'cum')) {
    unitMismatch = true;
    suggestedUnit = 'MT';
  } else if ((rawName.includes('door') || rawName.includes('window')) && (rawUnit === 'm3')) {
    unitMismatch = true;
    suggestedUnit = 'nos';
  }

  const currentRate = Number(item.rate) || 0;
  const rateDelta = computedMarketRate - currentRate;
  const percentDelta = currentRate > 0 ? Math.round(((rateDelta / currentRate) * 100) * 10) / 10 : 100;
  const currentAmount = (Number(item.quantity) || 0) * currentRate;
  const marketAmount = (Number(item.quantity) || 0) * computedMarketRate;
  const amountDelta = marketAmount - currentAmount;

  let status: 'exact' | 'underpriced' | 'overpriced' | 'unrated' = 'exact';
  if (currentRate <= 0) {
    status = 'unrated';
  } else if (Math.abs(percentDelta) <= 2.0) {
    status = 'exact';
  } else if (rateDelta > 0) {
    status = 'underpriced'; // BOQ rate is below market price
  } else {
    status = 'overpriced'; // BOQ rate is above market price
  }

  return {
    item,
    matchedBenchmark: bestMatch,
    currentRate,
    marketRate: computedMarketRate,
    rateDelta,
    percentDelta,
    currentAmount,
    marketAmount,
    amountDelta,
    status,
    confidenceScore: highestScore,
    sourceCitation: `${bestMatch.source} (${region.shortName})`,
    suggestedQty: bestMatch.qtyPerSqFt,
    suggestedUnit,
    unitMismatch,
  };
}

export interface AutoUpdateOptions {
  regionId?: MarketRegion;
  tier?: MarketQualityTier;
  pricingBasis?: MarketPricingBasis;
  onlyFlaggedOrZero?: boolean;
  selectedItemIds?: string[];
  fixUnitMismatches?: boolean;
}

/**
 * Automatically updates BOQ line items with verified live market rates
 */
export function autoUpdateBOQItemsWithMarketRates(
  items: BOQItem[],
  options: AutoUpdateOptions = {}
): { updatedItems: BOQItem[]; report: MarketUpdateReport } {
  const {
    regionId = 'bangalore',
    tier = 'Standard',
    pricingBasis = 'spot_market',
    onlyFlaggedOrZero = false,
    selectedItemIds,
    fixUnitMismatches = true,
  } = options;

  const region = MARKET_REGIONS.find((r) => r.id === regionId) || MARKET_REGIONS[0];

  const itemMatches: ItemMarketMatchResult[] = [];
  let updatedCount = 0;
  let unratedFixed = 0;
  let prevSubtotal = 0;
  let newSubtotal = 0;

  const updatedItems = items.map((item) => {
    const match = matchBOQItemToMarket(item, regionId, tier, pricingBasis);
    itemMatches.push(match);

    const oldAmt = item.quantity * item.rate;
    prevSubtotal += oldAmt;

    // Check if this item should be updated
    const isIdSelected = !selectedItemIds || selectedItemIds.includes(item.id);
    const shouldUpdate =
      isIdSelected &&
      (!onlyFlaggedOrZero || match.status === 'unrated' || match.status === 'underpriced');

    if (shouldUpdate) {
      updatedCount++;
      if (item.rate <= 0) unratedFixed++;

      const newRate = match.marketRate;
      const newUnit = fixUnitMismatches && match.unitMismatch && match.suggestedUnit
        ? match.suggestedUnit
        : item.unit;

      const newQty = Number(item.quantity) || 1;
      const newAmt = Math.round(newQty * newRate);
      newSubtotal += newAmt;

      // Also ensure component fractions reflect the updated engineering market item
      return {
        ...item,
        rate: newRate,
        amount: newAmt,
        unit: newUnit,
        materialComponent: match.matchedBenchmark.materialComponent,
        laborComponent: match.matchedBenchmark.laborComponent,
        equipmentComponent: match.matchedBenchmark.equipmentComponent,
        overheadComponent: match.matchedBenchmark.overheadComponent,
      };
    } else {
      newSubtotal += oldAmt;
      return item;
    }
  });

  const totalVarianceAmount = newSubtotal - prevSubtotal;
  const totalVariancePct = prevSubtotal > 0 ? Math.round(((totalVarianceAmount / prevSubtotal) * 100) * 10) / 10 : 0;

  const report: MarketUpdateReport = {
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    region,
    pricingBasis,
    tier,
    totalItemsCount: items.length,
    updatedItemsCount: updatedCount,
    unratedFixedCount: unratedFixed,
    previousSubtotal: prevSubtotal,
    updatedSubtotal: newSubtotal,
    totalVarianceAmount,
    totalVariancePct,
    itemMatches,
  };

  return { updatedItems, report };
}
