import { BOQItem } from '../types';

export interface DistributionPillar {
  id: 'materials' | 'labor' | 'equipment' | 'overheads' | 'contingency';
  name: string;
  amount: number;
  percentOfTotal: number;
  percentOfSubtotal: number;
  costPerSqFt: number;
  color: string;
  iconName: string;
  description: string;
  examples: string[];
}

export interface CategoryDistribution {
  category: string;
  totalAmount: number;
  materialAmount: number;
  materialPercent: number;
  laborAmount: number;
  laborPercent: number;
  equipmentAmount: number;
  equipmentPercent: number;
  overheadAmount: number;
  overheadPercent: number;
  itemCount: number;
}

export interface ItemDistributionBreakdown {
  itemId: string;
  itemName: string;
  category: string;
  totalAmount: number;
  materialAmount: number;
  materialFrac: number;
  laborAmount: number;
  laborFrac: number;
  equipmentAmount: number;
  equipmentFrac: number;
  overheadAmount: number;
  overheadFrac: number;
}

export interface BOQDistributionSummary {
  subtotal: number;
  contingencyPercent: number;
  contingencyAmount: number;
  grandTotal: number;
  areaSqFt: number;

  // 3-Pillar High-Level Summary (as requested: Materials, Labor, Overheads)
  materialsTotal: number;
  materialsPercent: number;
  laborTotal: number;
  laborPercent: number;
  overheadsTotal: number; // Includes site overheads, equipment & contingency
  overheadsPercent: number;

  // Detailed 5-Pillar Breakdown
  pillars: DistributionPillar[];

  // Category-wise Breakdown
  categories: CategoryDistribution[];

  // Item-level Details
  itemBreakdowns: ItemDistributionBreakdown[];
}

/**
 * Standard empirical construction cost component fractions based on CPWD / RICS / IS 1200 norms.
 */
export function getItemComponentFractions(item: BOQItem): {
  materialFrac: number;
  laborFrac: number;
  equipmentFrac: number;
  overheadFrac: number;
} {
  // If item already has custom components defined
  if (
    typeof item.materialComponent === 'number' ||
    typeof item.laborComponent === 'number'
  ) {
    const mat = item.materialComponent ?? 0.65;
    const lab = item.laborComponent ?? 0.25;
    const eq = item.equipmentComponent ?? 0.05;
    const ovh = item.overheadComponent ?? 0.05;
    const sum = mat + lab + eq + ovh;
    if (sum > 0) {
      return {
        materialFrac: mat / sum,
        laborFrac: lab / sum,
        equipmentFrac: eq / sum,
        overheadFrac: ovh / sum,
      };
    }
  }

  // Derive by Category & Name keywords
  const name = item.name.toLowerCase();
  const cat = (item.category || '').toLowerCase();

  if (name.includes('excavation') || cat.includes('substructure') || name.includes('earthwork')) {
    return { materialFrac: 0.08, laborFrac: 0.62, equipmentFrac: 0.20, overheadFrac: 0.10 };
  }
  if (name.includes('steel') || name.includes('rebar') || name.includes('tmt')) {
    return { materialFrac: 0.80, laborFrac: 0.12, equipmentFrac: 0.02, overheadFrac: 0.06 };
  }
  if (cat.includes('concrete') || name.includes('rcc') || name.includes('pcc') || name.includes('ready-mix')) {
    return { materialFrac: 0.64, laborFrac: 0.20, equipmentFrac: 0.06, overheadFrac: 0.10 };
  }
  if (cat.includes('masonry') || name.includes('block') || name.includes('brick')) {
    return { materialFrac: 0.64, laborFrac: 0.24, equipmentFrac: 0.02, overheadFrac: 0.10 };
  }
  if (name.includes('plaster')) {
    return { materialFrac: 0.42, laborFrac: 0.46, equipmentFrac: 0.02, overheadFrac: 0.10 };
  }
  if (name.includes('tile') || name.includes('marble') || name.includes('flooring') || name.includes('granite')) {
    return { materialFrac: 0.68, laborFrac: 0.22, equipmentFrac: 0.02, overheadFrac: 0.08 };
  }
  if (cat.includes('doors') || cat.includes('windows') || name.includes('window') || name.includes('door') || name.includes('glazing')) {
    return { materialFrac: 0.72, laborFrac: 0.18, equipmentFrac: 0.02, overheadFrac: 0.08 };
  }
  if (cat.includes('mep') || cat.includes('electrical') || cat.includes('plumbing') || name.includes('wiring') || name.includes('pipe')) {
    return { materialFrac: 0.62, laborFrac: 0.26, equipmentFrac: 0.04, overheadFrac: 0.08 };
  }
  if (cat.includes('waterproofing') || name.includes('membrane') || name.includes('waterproof')) {
    return { materialFrac: 0.64, laborFrac: 0.24, equipmentFrac: 0.04, overheadFrac: 0.08 };
  }

  // General default: 60% Material, 25% Labor, 5% Equipment, 10% Overhead
  return { materialFrac: 0.60, laborFrac: 0.25, equipmentFrac: 0.05, overheadFrac: 0.10 };
}

/**
 * Calculates complete distribution across Materials, Labor, Equipment, Overheads, and Contingency.
 */
export function computeBOQDistribution(
  items: BOQItem[],
  contingencyPercent: number = 5,
  areaSqFt: number = 5800
): BOQDistributionSummary {
  let subtotal = 0;
  let materialsTotal = 0;
  let laborTotal = 0;
  let equipmentTotal = 0;
  let siteOverheadsTotal = 0;

  const itemBreakdowns: ItemDistributionBreakdown[] = [];
  const categoryMap: Record<string, {
    total: number;
    mat: number;
    lab: number;
    eq: number;
    ovh: number;
    count: number;
  }> = {};

  items.forEach((item) => {
    const itemTotal = Math.max(0, item.quantity * item.rate);
    subtotal += itemTotal;

    const { materialFrac, laborFrac, equipmentFrac, overheadFrac } = getItemComponentFractions(item);

    const matAmt = Math.round(itemTotal * materialFrac);
    const labAmt = Math.round(itemTotal * laborFrac);
    const eqAmt = Math.round(itemTotal * equipmentFrac);
    const ovhAmt = Math.max(0, itemTotal - (matAmt + labAmt + eqAmt)); // exact balance

    materialsTotal += matAmt;
    laborTotal += labAmt;
    equipmentTotal += eqAmt;
    siteOverheadsTotal += ovhAmt;

    itemBreakdowns.push({
      itemId: item.id,
      itemName: item.name,
      category: item.category || 'General',
      totalAmount: itemTotal,
      materialAmount: matAmt,
      materialFrac,
      laborAmount: labAmt,
      laborFrac,
      equipmentAmount: eqAmt,
      equipmentFrac,
      overheadAmount: ovhAmt,
      overheadFrac,
    });

    const catName = item.category || 'General';
    if (!categoryMap[catName]) {
      categoryMap[catName] = { total: 0, mat: 0, lab: 0, eq: 0, ovh: 0, count: 0 };
    }
    categoryMap[catName].total += itemTotal;
    categoryMap[catName].mat += matAmt;
    categoryMap[catName].lab += labAmt;
    categoryMap[catName].eq += eqAmt;
    categoryMap[catName].ovh += ovhAmt;
    categoryMap[catName].count += 1;
  });

  const contingencyAmount = Math.round((subtotal * contingencyPercent) / 100);
  const grandTotal = subtotal + contingencyAmount;
  const safeGrandTotal = grandTotal > 0 ? grandTotal : 1;
  const safeSubtotal = subtotal > 0 ? subtotal : 1;
  const safeArea = areaSqFt > 0 ? areaSqFt : 1;

  // Overheads Pillar in the 3-pillar breakdown: Site Overheads + Plant/Equipment + Contingency Reserve
  const combinedOverheadsTotal = siteOverheadsTotal + equipmentTotal + contingencyAmount;

  // Category distributions
  const categories: CategoryDistribution[] = Object.entries(categoryMap).map(([category, c]) => {
    const catSafe = c.total > 0 ? c.total : 1;
    return {
      category,
      totalAmount: c.total,
      materialAmount: c.mat,
      materialPercent: Number(((c.mat / catSafe) * 100).toFixed(1)),
      laborAmount: c.lab,
      laborPercent: Number(((c.lab / catSafe) * 100).toFixed(1)),
      equipmentAmount: c.eq,
      equipmentPercent: Number(((c.eq / catSafe) * 100).toFixed(1)),
      overheadAmount: c.ovh,
      overheadPercent: Number(((c.ovh / catSafe) * 100).toFixed(1)),
      itemCount: c.count,
    };
  }).sort((a, b) => b.totalAmount - a.totalAmount);

  // 5-Pillar Detailed Distribution
  const pillars: DistributionPillar[] = [
    {
      id: 'materials',
      name: 'Direct Materials & Goods',
      amount: materialsTotal,
      percentOfTotal: Number(((materialsTotal / safeGrandTotal) * 100).toFixed(1)),
      percentOfSubtotal: Number(((materialsTotal / safeSubtotal) * 100).toFixed(1)),
      costPerSqFt: Math.round(materialsTotal / safeArea),
      color: '#38bdf8', // Sky 400
      iconName: 'Building',
      description: 'Raw commodities & manufactured products delivered to site (Cement, TMT Steel, AAC Blocks, Plaster Sand, Vitrified Tiles, Low-E Glass, Pipes & Cables).',
      examples: ['TMT Fe550D Rebar', 'M25 Ready-Mix Concrete', 'AAC Lightweight Blocks', 'Vitrified Honed Tiles', 'APP Waterproofing Membrane'],
    },
    {
      id: 'labor',
      name: 'Direct Construction Labor',
      amount: laborTotal,
      percentOfTotal: Number(((laborTotal / safeGrandTotal) * 100).toFixed(1)),
      percentOfSubtotal: Number(((laborTotal / safeSubtotal) * 100).toFixed(1)),
      costPerSqFt: Math.round(laborTotal / safeArea),
      color: '#f59e0b', // Amber 500
      iconName: 'HardHat',
      description: 'Skilled tradesmen, bar benders, shuttering carpenters, masons, licensed electricians, plumbers, tile layers, and site helpers.',
      examples: ['Carpentry & Formwork Erection', 'Bar Benders & Cutters', 'Block Masons & Plasterers', 'Tile Setters', 'Electricians & Plumbers'],
    },
    {
      id: 'equipment',
      name: 'Plant, Machinery & Logistics',
      amount: equipmentTotal,
      percentOfTotal: Number(((equipmentTotal / safeGrandTotal) * 100).toFixed(1)),
      percentOfSubtotal: Number(((equipmentTotal / safeSubtotal) * 100).toFixed(1)),
      costPerSqFt: Math.round(equipmentTotal / safeArea),
      color: '#a855f7', // Purple 500
      iconName: 'Truck',
      description: 'Mechanical machinery, hydraulic excavators, transit mixers, concrete line pumps, steel staging scaffolding, needle vibrators, and freight delivery.',
      examples: ['Hydraulic Excavator (JCB/Poclain)', 'Concrete Mixer & Boom Pump', 'Heavy Cuplock Scaffolding', 'Material Hoists & Slings'],
    },
    {
      id: 'overheads',
      name: 'Contractor Overheads & Margin',
      amount: siteOverheadsTotal,
      percentOfTotal: Number(((siteOverheadsTotal / safeGrandTotal) * 100).toFixed(1)),
      percentOfSubtotal: Number(((siteOverheadsTotal / safeSubtotal) * 100).toFixed(1)),
      costPerSqFt: Math.round(siteOverheadsTotal / safeArea),
      color: '#f43f5e', // Rose 500
      iconName: 'Scale',
      description: 'Site establishment, resident engineer supervision, CAR insurances, laboratory cube testing, safety PPE, head office expenses, and contractor profit margin.',
      examples: ['Site Office & Security Setup', 'Quality Assurance & Cube Crushing Tests', 'Safety Equipment & First Aid', 'Contractor Profit & Head Office Admin'],
    },
    {
      id: 'contingency',
      name: 'Client Contingency Reserve',
      amount: contingencyAmount,
      percentOfTotal: Number(((contingencyAmount / safeGrandTotal) * 100).toFixed(1)),
      percentOfSubtotal: Number(((contingencyAmount / safeSubtotal) * 100).toFixed(1)),
      costPerSqFt: Math.round(contingencyAmount / safeArea),
      color: '#10b981', // Emerald 500
      iconName: 'ShieldCheck',
      description: `Discretionary ${contingencyPercent}% budget reserve allocated for architectural scope enhancements, unanticipated subsoil variations, and statutory fee shifts.`,
      examples: [`${contingencyPercent}% Allocated Reserve`, 'Unforeseen Excavation Strata', 'Architectural Client Upgrades', 'Weather Delay Buffer'],
    },
  ];

  return {
    subtotal,
    contingencyPercent,
    contingencyAmount,
    grandTotal,
    areaSqFt,
    materialsTotal,
    materialsPercent: Number(((materialsTotal / safeGrandTotal) * 100).toFixed(1)),
    laborTotal,
    laborPercent: Number(((laborTotal / safeGrandTotal) * 100).toFixed(1)),
    overheadsTotal: combinedOverheadsTotal,
    overheadsPercent: Number(((combinedOverheadsTotal / safeGrandTotal) * 100).toFixed(1)),
    pillars,
    categories,
    itemBreakdowns,
  };
}
