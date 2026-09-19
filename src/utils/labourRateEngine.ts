import { BOQItem } from '../types';

export interface LabourTradeBenchmark {
  id: string;
  trade: string;
  description: string;
  unit: string;
  rateMin: number;
  rateMax: number;
  rateAvg: number;
  rateDisplay: string;
  costPer1000Min: number;
  costPer1000Max: number;
  costPer1000Avg: number;
  targetCategory: string;
  keywords: string[];
  notes: string;
  iconName: string;
  defaultLaborShare: number; // labor component 0.0 - 1.0
}

/**
 * 11 Verified Civil Engineering Labour Work Benchmarks
 * Exactly matching the Civil Engineer "Detailed Labour Cost Breakdown (Per 1000 Sq. Ft.)" schedule
 */
export const LABOUR_SCHEDULE_BENCHMARKS: LabourTradeBenchmark[] = [
  {
    id: 'masonry',
    trade: 'Masonry Work',
    description: 'Mason + Helper per sq.ft',
    unit: 'per sq.ft',
    rateMin: 80,
    rateMax: 120,
    rateAvg: 100,
    rateDisplay: '₹80 – ₹120',
    costPer1000Min: 80000,
    costPer1000Max: 120000,
    costPer1000Avg: 100000,
    targetCategory: 'Masonry',
    keywords: ['masonry', 'brick', 'block', 'aac', 'mortar', 'brickwork', 'blockwork'],
    notes: 'Mason + Helper team for external 200mm and internal 100mm/150mm wall masonry.',
    iconName: 'Building',
    defaultLaborShare: 0.35,
  },
  {
    id: 'rcc_framework',
    trade: 'RCC (Shuttering, Steel, Pouring)',
    description: 'Lump sum per sq.ft',
    unit: 'per sq.ft',
    rateMin: 120,
    rateMax: 180,
    rateAvg: 150,
    rateDisplay: '₹120 – ₹180',
    costPer1000Min: 120000,
    costPer1000Max: 180000,
    costPer1000Avg: 150000,
    targetCategory: 'Concrete Works',
    keywords: ['rcc', 'shuttering', 'formwork', 'concrete', 'pouring', 'staging', 'centering'],
    notes: 'Centering, plywood/steel shuttering fabrication, de-shuttering, and concrete pouring for footings, columns, beams, slabs.',
    iconName: 'Layers',
    defaultLaborShare: 0.28,
  },
  {
    id: 'bar_bending',
    trade: 'Bar Bending Work',
    description: 'Per ton of steel',
    unit: 'per ton',
    rateMin: 8000,
    rateMax: 12000,
    rateAvg: 10000,
    rateDisplay: '₹8,000 – ₹12,000',
    costPer1000Min: 16000,
    costPer1000Max: 30000,
    costPer1000Avg: 23000,
    targetCategory: 'Concrete Works',
    keywords: ['steel', 'rebar', 'tmt', 'bar bending', 'fe550d', 'reinforcement', 'jindal'],
    notes: 'Bar bending specialist labor: cutting, bending, crank formation, placing and tying with binding wire per IS 2502.',
    iconName: 'Wrench',
    defaultLaborShare: 0.16,
  },
  {
    id: 'plastering',
    trade: 'Plastering Work',
    description: 'Per sq.ft',
    unit: 'per sq.ft',
    rateMin: 25,
    rateMax: 40,
    rateAvg: 32.5,
    rateDisplay: '₹25 – ₹40',
    costPer1000Min: 40000,
    costPer1000Max: 60000,
    costPer1000Avg: 50000,
    targetCategory: 'Finishes',
    keywords: ['plaster', 'plastering', 'render', 'sponge finish', 'cement mortar'],
    notes: '15mm internal wall plastering with smooth sponge finish and external sand-faced cement plaster with curing.',
    iconName: 'Paintbrush',
    defaultLaborShare: 0.55,
  },
  {
    id: 'flooring',
    trade: 'Flooring Work',
    description: 'Tile laying per sq.ft',
    unit: 'per sq.ft',
    rateMin: 25,
    rateMax: 40,
    rateAvg: 32.5,
    rateDisplay: '₹25 – ₹40',
    costPer1000Min: 25000,
    costPer1000Max: 40000,
    costPer1000Avg: 32500,
    targetCategory: 'Finishes',
    keywords: ['tile', 'flooring', 'vitrified', 'granite', 'marble', 'grout', 'skirting'],
    notes: 'Bedding mortar screed preparation, tile laying, precision level alignment, cutting, and epoxy / cement grouting.',
    iconName: 'Grid',
    defaultLaborShare: 0.28,
  },
  {
    id: 'electrical',
    trade: 'Electrical Work',
    description: 'Wiring + install (Lump sum)',
    unit: 'per sq.ft',
    rateMin: 20,
    rateMax: 35,
    rateAvg: 27.5,
    rateDisplay: '₹20 – ₹35 / sq.ft',
    costPer1000Min: 20000,
    costPer1000Max: 35000,
    costPer1000Avg: 27500,
    targetCategory: 'MEP & Electrical',
    keywords: ['electrical', 'wiring', 'conduit', 'switch', 'db', 'distribution', 'frls', 'circuit'],
    notes: 'Concealed PVC conduit chasing, point wiring, earthing grid, DB distribution board fixing, and modular switchboard termination.',
    iconName: 'Zap',
    defaultLaborShare: 0.38,
  },
  {
    id: 'plumbing',
    trade: 'Plumbing Work',
    description: 'Piping + install (Lump sum)',
    unit: 'per sq.ft',
    rateMin: 20,
    rateMax: 35,
    rateAvg: 27.5,
    rateDisplay: '₹20 – ₹35 / sq.ft',
    costPer1000Min: 20000,
    costPer1000Max: 35000,
    costPer1000Avg: 27500,
    targetCategory: 'MEP & Electrical',
    keywords: ['plumbing', 'piping', 'cpvc', 'pvc', 'drainage', 'sanitary', 'sewage', 'waterproofing', 'fixtures'],
    notes: 'CPVC cold & hot water piping installation, PVC sewage drain lines, rainwater harvesting lines, and CP sanitary fittings.',
    iconName: 'Droplet',
    defaultLaborShare: 0.38,
  },
  {
    id: 'painting',
    trade: 'Painting Work',
    description: 'Primer + Putty + Paint',
    unit: 'per sq.ft',
    rateMin: 15,
    rateMax: 25,
    rateAvg: 20,
    rateDisplay: '₹15 – ₹25',
    costPer1000Min: 25000,
    costPer1000Max: 40000,
    costPer1000Avg: 32500,
    targetCategory: 'Finishes',
    keywords: ['paint', 'painting', 'putty', 'primer', 'emulsion', 'coat', 'acrylic', 'royale'],
    notes: 'Surface preparation, 2 coats acrylic wall putty sanding, 1 coat anti-fungal primer sealer, and 2 coats premium emulsion paint.',
    iconName: 'Palette',
    defaultLaborShare: 0.48,
  },
  {
    id: 'fabrication',
    trade: 'Fabrication (Grills, etc.)',
    description: 'Lump sum',
    unit: 'per sq.ft',
    rateMin: 15,
    rateMax: 30,
    rateAvg: 22.5,
    rateDisplay: '₹15 – ₹30 / sq.ft',
    costPer1000Min: 15000,
    costPer1000Max: 30000,
    costPer1000Avg: 22500,
    targetCategory: 'Doors & Windows',
    keywords: ['fabrication', 'grill', 'railing', 'ms', 'gate', 'welding', 'canopy', 'structural steel'],
    notes: 'Mild steel window safety grills, staircase balcony railings, entrance gate welding, and anti-corrosive primer coating.',
    iconName: 'Shield',
    defaultLaborShare: 0.22,
  },
  {
    id: 'carpentry',
    trade: 'Carpentry (Doors, etc.)',
    description: 'Per door/window fitting',
    unit: 'per fitting',
    rateMin: 1000,
    rateMax: 2000,
    rateAvg: 1500,
    rateDisplay: '₹1,000 – ₹2,000 / fitting',
    costPer1000Min: 20000,
    costPer1000Max: 30000,
    costPer1000Avg: 25000,
    targetCategory: 'Doors & Windows',
    keywords: ['carpentry', 'door', 'window', 'frame', 'fitting', 'hinge', 'hardware', 'lock', 'teakwood', 'flush'],
    notes: 'Door frame plumb fixing, door shutter planing, mortise lock chiseling, brass hinges & tower bolt fitting.',
    iconName: 'Hammer',
    defaultLaborShare: 0.18,
  },
  {
    id: 'site_supervision',
    trade: 'Site Supervision (Optional)',
    description: 'Contract/Monthly salary',
    unit: 'per month',
    rateMin: 15000,
    rateMax: 25000,
    rateAvg: 20000,
    rateDisplay: '₹15,000 – ₹25,000 / mo',
    costPer1000Min: 30000,
    costPer1000Max: 50000,
    costPer1000Avg: 40000,
    targetCategory: 'Preliminaries',
    keywords: ['supervision', 'engineer', 'supervisor', 'inspection', 'quality control', 'management', 'preliminaries'],
    notes: 'Full-time site civil engineer supervision, daily work scheduling, bar bending verification, and structural concrete cube testing.',
    iconName: 'HardHat',
    defaultLaborShare: 0.95,
  },
];

export type LabourRateMode = 'min' | 'avg' | 'max';

/**
 * Calculates scaled labour cost summary for a given built-up area
 */
export function calculateLabourScheduleForArea(areaSqFt: number, mode: LabourRateMode = 'avg') {
  const scaleFactor = Math.max(0.1, areaSqFt / 1000);

  const trades = LABOUR_SCHEDULE_BENCHMARKS.map((benchmark) => {
    let rate = benchmark.rateAvg;
    let costPer1000 = benchmark.costPer1000Avg;

    if (mode === 'min') {
      rate = benchmark.rateMin;
      costPer1000 = benchmark.costPer1000Min;
    } else if (mode === 'max') {
      rate = benchmark.rateMax;
      costPer1000 = benchmark.costPer1000Max;
    }

    const scaledCost = Math.round(costPer1000 * scaleFactor);

    return {
      benchmark,
      appliedRate: rate,
      costPer1000,
      scaledCost,
    };
  });

  const totalMin = Math.round(
    LABOUR_SCHEDULE_BENCHMARKS.reduce((sum, b) => sum + b.costPer1000Min, 0) * scaleFactor
  );
  const totalMax = Math.round(
    LABOUR_SCHEDULE_BENCHMARKS.reduce((sum, b) => sum + b.costPer1000Max, 0) * scaleFactor
  );
  const totalAvg = Math.round(
    LABOUR_SCHEDULE_BENCHMARKS.reduce((sum, b) => sum + b.costPer1000Avg, 0) * scaleFactor
  );

  const totalSelected = trades.reduce((sum, t) => sum + t.scaledCost, 0);

  return {
    trades,
    scaleFactor,
    areaSqFt,
    totalMin,
    totalMax,
    totalAvg,
    totalSelected,
    ratePerSqFtMin: Math.round(totalMin / areaSqFt),
    ratePerSqFtMax: Math.round(totalMax / areaSqFt),
    ratePerSqFtAvg: Math.round(totalAvg / areaSqFt),
  };
}

/**
 * Identifies which labour trade matches an existing BOQ item
 */
export function matchItemToLabourTrade(item: BOQItem): LabourTradeBenchmark | null {
  const name = item.name.toLowerCase();
  const cat = item.category.toLowerCase();

  // 1. Direct door check
  if (name.includes('door') || (cat.includes('doors') && !name.includes('window'))) {
    return LABOUR_SCHEDULE_BENCHMARKS.find((b) => b.id === 'carpentry') || null;
  }

  // 2. Bar bending / steel rebar
  if (name.includes('tmt') || name.includes('rebar') || name.includes('reinforcement') || name.includes('jindal')) {
    return LABOUR_SCHEDULE_BENCHMARKS.find((b) => b.id === 'bar_bending') || null;
  }

  // 3. Painting
  if (name.includes('paint') || name.includes('emulsion') || name.includes('putty') || name.includes('primer')) {
    return LABOUR_SCHEDULE_BENCHMARKS.find((b) => b.id === 'painting') || null;
  }

  // 4. Plastering
  if (name.includes('plaster') || name.includes('sponge finish')) {
    return LABOUR_SCHEDULE_BENCHMARKS.find((b) => b.id === 'plastering') || null;
  }

  // 5. Flooring / tiles
  if (name.includes('tile') || name.includes('flooring') || name.includes('vitrified') || name.includes('granite')) {
    return LABOUR_SCHEDULE_BENCHMARKS.find((b) => b.id === 'flooring') || null;
  }

  // 6. Masonry / AAC blocks / bricks
  if (name.includes('aac') || name.includes('brick') || name.includes('blockwork') || cat.includes('masonry')) {
    return LABOUR_SCHEDULE_BENCHMARKS.find((b) => b.id === 'masonry') || null;
  }

  // 7. Concrete / RCC framing
  if (name.includes('rcc') || name.includes('design mix') || name.includes('pcc') || cat.includes('concrete')) {
    return LABOUR_SCHEDULE_BENCHMARKS.find((b) => b.id === 'rcc_framework') || null;
  }

  // 8. Electrical
  if (name.includes('electric') || name.includes('wiring') || name.includes('conduit') || cat.includes('electrical')) {
    return LABOUR_SCHEDULE_BENCHMARKS.find((b) => b.id === 'electrical') || null;
  }

  // 9. Fabrication / Grills / Canopy
  if (name.includes('canopy') || name.includes('grill') || name.includes('railing') || name.includes('fabricat')) {
    return LABOUR_SCHEDULE_BENCHMARKS.find((b) => b.id === 'fabrication') || null;
  }

  // Keyword scan
  for (const b of LABOUR_SCHEDULE_BENCHMARKS) {
    if (b.keywords.some((kw) => name.includes(kw) || cat.includes(kw))) {
      return b;
    }
  }

  return null;
}

/**
 * Applies the Labour Rate Schedule to all BOQ items
 */
export function applyLabourScheduleToBOQ(
  items: BOQItem[],
  areaSqFt: number,
  mode: LabourRateMode = 'avg'
): {
  updatedItems: BOQItem[];
  modifiedCount: number;
  unpricedFixedCount: number;
  previousSubtotal: number;
  newSubtotal: number;
} {
  const previousSubtotal = items.reduce((sum, it) => sum + it.quantity * it.rate, 0);
  let modifiedCount = 0;
  let unpricedFixedCount = 0;

  const updatedItems = items.map((item) => {
    let updated = { ...item };
    const matchedTrade = matchItemToLabourTrade(item);

    // 1. Fix missing / zero rates
    if (item.rate <= 0) {
      unpricedFixedCount++;
      modifiedCount++;

      if (matchedTrade?.id === 'carpentry') {
        // Door supply + fitting (₹18,500 supply + ₹1,500 fitting from schedule)
        const fittingRate = mode === 'min' ? 1000 : mode === 'max' ? 2000 : 1500;
        updated.rate = 18500 + fittingRate;
        updated.notes = `${item.notes ? item.notes + ' | ' : ''}Calibrated with civil labour carpentry fitting (₹${fittingRate.toLocaleString()}/door per schedule)`;
        updated.laborComponent = Math.round((fittingRate / updated.rate) * 100) / 100;
        updated.materialComponent = Math.round((1 - updated.laborComponent) * 100) / 100;
      } else {
        // Fallback realistic item rate
        updated.rate = 2500;
        updated.notes = `${item.notes ? item.notes + ' | ' : ''}Rate estimated per civil construction schedule`;
      }
    }

    // 2. Align laborComponent and unit rates where appropriate
    if (matchedTrade) {
      let isRateAdjusted = false;

      // Ensure appropriate laborComponent is set
      if (!updated.laborComponent || Math.abs(updated.laborComponent - matchedTrade.defaultLaborShare) > 0.1) {
        updated.laborComponent = matchedTrade.defaultLaborShare;
        updated.materialComponent = Math.round((1 - updated.laborComponent - (updated.equipmentComponent || 0)) * 100) / 100;
        isRateAdjusted = true;
      }

      // Unit conversion check for Plastering and Flooring if entered in sq.m
      // 1 sq.m = 10.764 sq.ft
      if (item.unit === 'sq.m' && (matchedTrade.id === 'plastering' || matchedTrade.id === 'flooring')) {
        const sqftRate = mode === 'min' ? matchedTrade.rateMin : mode === 'max' ? matchedTrade.rateMax : matchedTrade.rateAvg;
        // If the item rate is far off from standard composite rate:
        if (matchedTrade.id === 'plastering' && (item.rate < 200 || item.rate > 450)) {
          updated.rate = Math.round(sqftRate * 10.764);
          isRateAdjusted = true;
        }
      }

      // Painting conversion
      if (item.unit === 'sq.m' && matchedTrade.id === 'painting' && (item.rate < 100 || item.rate > 350)) {
        const sqftRate = mode === 'min' ? matchedTrade.rateMin : mode === 'max' ? matchedTrade.rateMax : matchedTrade.rateAvg;
        updated.rate = Math.round(sqftRate * 10.764);
        isRateAdjusted = true;
      }

      // Fix mismatched units (e.g. canopy entered as m3 instead of MT)
      if (item.id === 'boq-12' && item.unit === 'm3') {
        updated.unit = 'MT';
        updated.rate = 74000;
        updated.notes = 'Fabricated I-sections & canopy framing (Unit corrected to MT; includes cutting, welding & erection per schedule)';
        isRateAdjusted = true;
      }

      if (isRateAdjusted) {
        modifiedCount++;
      }
    }

    updated.amount = Math.round(updated.quantity * updated.rate);
    return updated;
  });

  const newSubtotal = updatedItems.reduce((sum, it) => sum + it.quantity * it.rate, 0);

  return {
    updatedItems,
    modifiedCount,
    unpricedFixedCount,
    previousSubtotal,
    newSubtotal,
  };
}

/**
 * Checks which civil trades from the 11-trade schedule are completely missing in the current BOQ
 */
export function getMissingTradesFromBOQ(items: BOQItem[]): LabourTradeBenchmark[] {
  const coveredTradeIds = new Set<string>();

  items.forEach((item) => {
    const trade = matchItemToLabourTrade(item);
    if (trade) {
      coveredTradeIds.add(trade.id);
    }
  });

  return LABOUR_SCHEDULE_BENCHMARKS.filter((b) => !coveredTradeIds.has(b.id));
}

/**
 * Generates a new comprehensive BOQ line item for a missing trade
 */
export function createBOQItemFromLabourTrade(
  trade: LabourTradeBenchmark,
  areaSqFt: number,
  mode: LabourRateMode = 'avg'
): BOQItem {
  const scale = areaSqFt / 1000;
  const cost =
    mode === 'min' ? trade.costPer1000Min * scale : mode === 'max' ? trade.costPer1000Max * scale : trade.costPer1000Avg * scale;

  if (trade.id === 'fabrication') {
    return {
      id: `boq-labour-${Date.now()}-${trade.id}`,
      name: 'Architectural MS Safety Window Grills & Balcony Railings Fabrication',
      category: 'Doors & Windows',
      unit: 'kg',
      quantity: Math.round(areaSqFt * 0.28),
      rate: Math.round(cost / Math.max(1, Math.round(areaSqFt * 0.28))),
      amount: Math.round(cost),
      notes: `Mild steel fabrication work calibrated per civil labour schedule (${trade.rateDisplay}/sq.ft benchmark)`,
      stage: 'Finishes',
      status: 'approved',
      materialComponent: 0.78,
      laborComponent: 0.22,
      equipmentComponent: 0.0,
      floorBreakdown: {
        substructure: 0,
        ground_floor: Math.round(areaSqFt * 0.12),
        first_floor: Math.round(areaSqFt * 0.1),
        second_floor: Math.round(areaSqFt * 0.06),
        terrace: 0,
      },
    };
  }

  if (trade.id === 'plumbing') {
    return {
      id: `boq-labour-${Date.now()}-${trade.id}`,
      name: 'Internal & External Sanitary Drainage & CPVC Water Supply Piping System',
      category: 'MEP & Electrical',
      unit: 'sq.ft',
      quantity: areaSqFt,
      rate: mode === 'min' ? trade.rateMin : mode === 'max' ? trade.rateMax : trade.rateAvg,
      amount: Math.round(cost),
      notes: `Complete plumbing piping + install calibrated per civil labour schedule (${trade.rateDisplay} benchmark)`,
      stage: 'Services',
      status: 'approved',
      materialComponent: 0.62,
      laborComponent: 0.38,
      equipmentComponent: 0.0,
      floorBreakdown: {
        substructure: Math.round(areaSqFt * 0.1),
        ground_floor: Math.round(areaSqFt * 0.4),
        first_floor: Math.round(areaSqFt * 0.3),
        second_floor: Math.round(areaSqFt * 0.2),
        terrace: 0,
      },
    };
  }

  if (trade.id === 'site_supervision') {
    const months = Math.max(3, Math.round((areaSqFt / 1000) * 2));
    const monthlyRate = mode === 'min' ? trade.rateMin : mode === 'max' ? trade.rateMax : trade.rateAvg;
    return {
      id: `boq-labour-${Date.now()}-${trade.id}`,
      name: 'Dedicated Civil Site Engineer Quality Supervision & Technical Control',
      category: 'Substructure',
      unit: 'months',
      quantity: months,
      rate: monthlyRate,
      amount: Math.round(months * monthlyRate),
      notes: `Full-time civil site supervision for ${months} months construction cycle per schedule (${trade.rateDisplay})`,
      stage: 'Substructure',
      status: 'approved',
      materialComponent: 0.05,
      laborComponent: 0.95,
      equipmentComponent: 0.0,
      floorBreakdown: {
        substructure: Math.round(months * 0.3),
        ground_floor: Math.round(months * 0.3),
        first_floor: Math.round(months * 0.2),
        second_floor: Math.round(months * 0.2),
        terrace: 0,
      },
    };
  }

  // Generic fallback
  return {
    id: `boq-labour-${Date.now()}-${trade.id}`,
    name: `${trade.trade} Package (${trade.description})`,
    category: trade.targetCategory,
    unit: 'sq.ft',
    quantity: areaSqFt,
    rate: mode === 'min' ? trade.rateMin : mode === 'max' ? trade.rateMax : trade.rateAvg,
    amount: Math.round(cost),
    notes: `${trade.notes} (Calibrated with civil labour schedule)`,
    stage: 'Superstructure',
    status: 'approved',
    materialComponent: 1 - trade.defaultLaborShare,
    laborComponent: trade.defaultLaborShare,
    equipmentComponent: 0.0,
  };
}
