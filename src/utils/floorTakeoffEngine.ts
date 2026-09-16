import { BOQItem, BuildingFloor, FloorWiseTotal } from '../types';

export const DEFAULT_BUILDING_FLOORS: BuildingFloor[] = [
  {
    id: 'substructure',
    name: 'Substructure & Foundation',
    shortCode: 'SUB',
    levelIndex: -1,
    elevation: '-2.50m',
    areaSqFt: 1400,
    heightMeters: 2.5,
    description: 'Foundation footings, grade beams, earthwork excavation, PCC bed & subterranean waterproofing',
  },
  {
    id: 'ground_floor',
    name: 'Ground Floor (Level 0)',
    shortCode: 'GF',
    levelIndex: 0,
    elevation: '±0.00m',
    areaSqFt: 1800,
    heightMeters: 3.3,
    description: 'Grand foyer, double-height living room, dining, open kitchen, guest suite & vehicle portico',
  },
  {
    id: 'first_floor',
    name: 'First Floor (Level 1)',
    shortCode: '1F',
    levelIndex: 1,
    elevation: '+3.30m',
    areaSqFt: 1500,
    heightMeters: 3.3,
    description: 'Bedrooms 1 & 2 with attached bathrooms, family lounge, study alcove & cantilevered balconies',
  },
  {
    id: 'second_floor',
    name: 'Second Floor (Level 2)',
    shortCode: '2F',
    levelIndex: 2,
    elevation: '+6.60m',
    areaSqFt: 1100,
    heightMeters: 3.3,
    description: 'Master penthouse suite, walk-in dressing, private terrace deck & multimedia lounge',
  },
  {
    id: 'terrace',
    name: 'Terrace & Roof Level',
    shortCode: 'RF',
    levelIndex: 3,
    elevation: '+9.90m',
    areaSqFt: 1000,
    heightMeters: 1.2,
    description: 'Open roof garden, lift machine room / mumty, overhead water tank & parapet masonry',
  },
];

/**
 * Computes realistic Quantity Surveying floor-wise distribution fractions
 * based on item category, stage, and construction engineering principles.
 */
export function getStandardFloorDistribution(
  item: BOQItem,
  floors: BuildingFloor[]
): Record<string, number> {
  const name = (item.name || '').toLowerCase();
  const cat = (item.category || '').toLowerCase();
  const stage = (item.stage || '').toLowerCase();

  const floorIds = floors.map((f) => f.id);
  const result: Record<string, number> = {};
  floorIds.forEach((id) => {
    result[id] = 0;
  });

  // 1. Pure Substructure items (Earthwork, Excavation, PCC, Footing trenches)
  if (
    cat.includes('substructure') ||
    stage.includes('substructure') ||
    name.includes('excavation') ||
    name.includes('foundation') ||
    name.includes('pcc (1:4:8)') ||
    name.includes('earthwork') ||
    name.includes('trench')
  ) {
    if (result['substructure'] !== undefined) {
      result['substructure'] = 1.0;
    } else {
      result[floorIds[0]] = 1.0;
    }
    return result;
  }

  // 2. Concrete Works (RCC columns, beams, slabs)
  if (cat.includes('concrete') || name.includes('rcc') || name.includes('tmt') || name.includes('rebar')) {
    const weights: Record<string, number> = {
      substructure: 0.25,
      ground_floor: 0.32,
      first_floor: 0.22,
      second_floor: 0.16,
      terrace: 0.05,
    };
    let sum = 0;
    floorIds.forEach((id) => {
      sum += weights[id] || 0.1;
    });
    floorIds.forEach((id) => {
      result[id] = (weights[id] || 0.1) / sum;
    });
    return result;
  }

  // 3. Masonry & Blockwork (External and internal walls)
  if (cat.includes('masonry') || name.includes('block') || name.includes('brick')) {
    const weights: Record<string, number> = {
      substructure: 0.0,
      ground_floor: 0.38,
      first_floor: 0.34,
      second_floor: 0.22,
      terrace: 0.06,
    };
    let sum = 0;
    floorIds.forEach((id) => {
      sum += weights[id] || 0;
    });
    floorIds.forEach((id) => {
      result[id] = sum > 0 ? (weights[id] || 0) / sum : 1 / floorIds.length;
    });
    return result;
  }

  // 4. Finishes, Plastering, Painting
  if (name.includes('plaster') || name.includes('paint') || name.includes('putty')) {
    const weights: Record<string, number> = {
      substructure: 0.0,
      ground_floor: 0.40,
      first_floor: 0.35,
      second_floor: 0.22,
      terrace: 0.03,
    };
    let sum = 0;
    floorIds.forEach((id) => {
      sum += weights[id] || 0;
    });
    floorIds.forEach((id) => {
      result[id] = sum > 0 ? (weights[id] || 0) / sum : 1 / floorIds.length;
    });
    return result;
  }

  // 5. Flooring & Tiling (Living, bedrooms, balconies)
  if (name.includes('tile') || name.includes('flooring') || name.includes('marble') || name.includes('granite')) {
    const weights: Record<string, number> = {
      substructure: 0.0,
      ground_floor: 0.40,
      first_floor: 0.35,
      second_floor: 0.25,
      terrace: 0.0,
    };
    let sum = 0;
    floorIds.forEach((id) => {
      sum += weights[id] || 0;
    });
    floorIds.forEach((id) => {
      result[id] = sum > 0 ? (weights[id] || 0) / sum : 1 / floorIds.length;
    });
    return result;
  }

  // 6. Doors & Windows / Joinery / Fenestration
  if (cat.includes('doors') || cat.includes('windows') || name.includes('door') || name.includes('window') || name.includes('glazing')) {
    const weights: Record<string, number> = {
      substructure: 0.0,
      ground_floor: 0.40,
      first_floor: 0.35,
      second_floor: 0.25,
      terrace: 0.0,
    };
    let sum = 0;
    floorIds.forEach((id) => {
      sum += weights[id] || 0;
    });
    floorIds.forEach((id) => {
      result[id] = sum > 0 ? (weights[id] || 0) / sum : 1 / floorIds.length;
    });
    return result;
  }

  // 7. MEP & Electrical Point Wiring
  if (cat.includes('electrical') || cat.includes('mep') || name.includes('wiring') || name.includes('conduit') || name.includes('switch')) {
    const weights: Record<string, number> = {
      substructure: 0.05,
      ground_floor: 0.40,
      first_floor: 0.35,
      second_floor: 0.16,
      terrace: 0.04,
    };
    let sum = 0;
    floorIds.forEach((id) => {
      sum += weights[id] || 0;
    });
    floorIds.forEach((id) => {
      result[id] = sum > 0 ? (weights[id] || 0) / sum : 1 / floorIds.length;
    });
    return result;
  }

  // 8. Waterproofing (Terrace, subterranean plinth, wet areas)
  if (cat.includes('waterproofing') || name.includes('waterproof') || name.includes('membrane')) {
    const weights: Record<string, number> = {
      substructure: 0.28,
      ground_floor: 0.12,
      first_floor: 0.15,
      second_floor: 0.15,
      terrace: 0.30,
    };
    let sum = 0;
    floorIds.forEach((id) => {
      sum += weights[id] || 0;
    });
    floorIds.forEach((id) => {
      result[id] = sum > 0 ? (weights[id] || 0) / sum : 1 / floorIds.length;
    });
    return result;
  }

  // 9. Steel canopy / specific structural portico
  if (name.includes('canopy') || name.includes('portico') || name.includes('porch')) {
    if (result['ground_floor'] !== undefined) {
      result['ground_floor'] = 1.0;
    } else {
      result[floorIds[0]] = 1.0;
    }
    return result;
  }

  // Default: Proportional to Floor Area
  const totalArea = floors.reduce((acc, f) => acc + (f.areaSqFt || 1000), 0);
  floors.forEach((f) => {
    result[f.id] = (f.areaSqFt || 1000) / (totalArea || 1);
  });
  return result;
}

/**
 * Ensures a BOQ item has a valid, normalized floorBreakdown.
 * If floorBreakdown already has values, respects them and ensures total quantity matches.
 * If missing, generates a realistic Quantity Surveying floor-wise breakdown.
 */
export function ensureItemFloorBreakdown(
  item: BOQItem,
  floors: BuildingFloor[] = DEFAULT_BUILDING_FLOORS
): BOQItem {
  const currentBreakdown = item.floorBreakdown || {};
  const hasExistingEntries = Object.keys(currentBreakdown).length > 0;

  if (hasExistingEntries) {
    const normalized: Record<string, number> = {};
    floors.forEach((f) => {
      normalized[f.id] = Number(currentBreakdown[f.id]) || 0;
    });

    // Sum up floor quantities
    const totalQty = Object.values(normalized).reduce((acc, q) => acc + q, 0);

    // If totalQty matches item.quantity or item.quantity was 0, use totalQty
    const finalQty = totalQty > 0 ? totalQty : item.quantity;
    const finalAmount = Math.round(finalQty * item.rate * 100) / 100;

    return {
      ...item,
      quantity: finalQty,
      amount: finalAmount,
      floorBreakdown: normalized,
    };
  }

  // Generate initial floor breakdown
  const fractions = getStandardFloorDistribution(item, floors);
  const normalized: Record<string, number> = {};
  const isIntegerUnit = ['nos', 'set', 'sets', 'lot', 'each'].includes((item.unit || '').toLowerCase().trim());

  let distributedSum = 0;
  floors.forEach((f, idx) => {
    const frac = fractions[f.id] || 0;
    let val = item.quantity * frac;
    if (isIntegerUnit) {
      val = Math.round(val);
    } else {
      val = Math.round(val * 10) / 10;
    }
    normalized[f.id] = val;
    distributedSum += val;
  });

  // Adjust any rounding delta onto the primary floor with highest allocation
  const diff = (isIntegerUnit ? Math.round(item.quantity) : Math.round(item.quantity * 10) / 10) - distributedSum;
  if (Math.abs(diff) > 0.001) {
    // Find floor with highest weight
    let bestFloorId = floors[0]?.id || 'ground_floor';
    let maxVal = -1;
    floors.forEach((f) => {
      if ((normalized[f.id] || 0) > maxVal) {
        maxVal = normalized[f.id] || 0;
        bestFloorId = f.id;
      }
    });
    normalized[bestFloorId] = Math.max(0, Math.round(((normalized[bestFloorId] || 0) + diff) * 10) / 10);
  }

  const finalQty = Object.values(normalized).reduce((acc, q) => acc + q, 0);
  const finalAmount = Math.round(finalQty * item.rate * 100) / 100;

  return {
    ...item,
    quantity: finalQty,
    amount: finalAmount,
    floorBreakdown: normalized,
  };
}

/**
 * Updates a single floor's quantity on a line item, auto-recalculating total quantity and total amount.
 */
export function updateItemFloorQuantity(
  item: BOQItem,
  floorId: string,
  newQuantity: number,
  floors: BuildingFloor[] = DEFAULT_BUILDING_FLOORS
): BOQItem {
  const currentBreakdown = { ...(item.floorBreakdown || {}) };
  floors.forEach((f) => {
    if (currentBreakdown[f.id] === undefined) {
      currentBreakdown[f.id] = 0;
    }
  });

  const validQty = Math.max(0, Number(newQuantity) || 0);
  const isIntegerUnit = ['nos', 'set', 'sets', 'lot', 'each'].includes((item.unit || '').toLowerCase().trim());
  currentBreakdown[floorId] = isIntegerUnit ? Math.round(validQty) : Math.round(validQty * 100) / 100;

  // Re-sum total quantity across all floors
  const totalQty = Object.values(currentBreakdown).reduce((acc, q) => acc + q, 0);
  const finalQty = Math.round(totalQty * 100) / 100;
  const finalAmount = Math.round(finalQty * item.rate * 100) / 100;

  return {
    ...item,
    quantity: finalQty,
    amount: finalAmount,
    floorBreakdown: currentBreakdown,
  };
}

/**
 * Distributes a specific total quantity across all floors proportionally based on each floor's slab area.
 */
export function distributeItemQuantityByFloorArea(
  item: BOQItem,
  totalQty: number,
  floors: BuildingFloor[] = DEFAULT_BUILDING_FLOORS
): BOQItem {
  const totalArea = floors.reduce((acc, f) => acc + (f.areaSqFt || 1000), 0);
  const isIntegerUnit = ['nos', 'set', 'sets', 'lot', 'each'].includes((item.unit || '').toLowerCase().trim());

  const newBreakdown: Record<string, number> = {};
  let distributedSum = 0;

  floors.forEach((f) => {
    const areaFrac = (f.areaSqFt || 1000) / (totalArea || 1);
    let val = totalQty * areaFrac;
    val = isIntegerUnit ? Math.round(val) : Math.round(val * 10) / 10;
    newBreakdown[f.id] = val;
    distributedSum += val;
  });

  // Adjust rounding delta to the largest floor
  const diff = totalQty - distributedSum;
  if (Math.abs(diff) > 0.001) {
    let maxArea = -1;
    let maxFloorId = floors[0]?.id || 'ground_floor';
    floors.forEach((f) => {
      if (f.areaSqFt > maxArea) {
        maxArea = f.areaSqFt;
        maxFloorId = f.id;
      }
    });
    newBreakdown[maxFloorId] = Math.max(0, Math.round(((newBreakdown[maxFloorId] || 0) + diff) * 10) / 10);
  }

  const finalQty = Object.values(newBreakdown).reduce((acc, q) => acc + q, 0);
  const finalAmount = Math.round(finalQty * item.rate * 100) / 100;

  return {
    ...item,
    quantity: finalQty,
    amount: finalAmount,
    floorBreakdown: newBreakdown,
  };
}

/**
 * Copies all quantities from source floor to target floor across all items.
 */
export function copyFloorQuantitiesAcrossItems(
  items: BOQItem[],
  sourceFloorId: string,
  targetFloorId: string,
  floors: BuildingFloor[] = DEFAULT_BUILDING_FLOORS
): BOQItem[] {
  return items.map((item) => {
    const ensured = ensureItemFloorBreakdown(item, floors);
    const breakdown = { ...(ensured.floorBreakdown || {}) };
    const sourceQty = breakdown[sourceFloorId] || 0;
    breakdown[targetFloorId] = sourceQty;

    const totalQty = Object.values(breakdown).reduce((acc, q) => acc + q, 0);
    const finalQty = Math.round(totalQty * 100) / 100;
    const finalAmount = Math.round(finalQty * item.rate * 100) / 100;

    return {
      ...ensured,
      quantity: finalQty,
      amount: finalAmount,
      floorBreakdown: breakdown,
    };
  });
}

/**
 * Calculates floor-wise summary statistics (subtotals, unit rates per sq.ft, item counts, etc.).
 */
export function calculateFloorWiseTotals(
  items: BOQItem[],
  floors: BuildingFloor[] = DEFAULT_BUILDING_FLOORS,
  contingencyPercent: number = 10
): {
  floorTotals: FloorWiseTotal[];
  buildingSubtotal: number;
  contingencyAmount: number;
  grandTotal: number;
  totalAreaSqFt: number;
  overallRatePerSqFt: number;
} {
  const ensuredItems = items.map((it) => ensureItemFloorBreakdown(it, floors));

  let buildingSubtotal = 0;
  const floorDataMap: Record<
    string,
    { subtotal: number; itemCount: number; totalQuantity: number }
  > = {};

  floors.forEach((f) => {
    floorDataMap[f.id] = { subtotal: 0, itemCount: 0, totalQuantity: 0 };
  });

  ensuredItems.forEach((item) => {
    buildingSubtotal += item.quantity * item.rate;
    floors.forEach((f) => {
      const q = (item.floorBreakdown && item.floorBreakdown[f.id]) || 0;
      if (q > 0) {
        floorDataMap[f.id].itemCount += 1;
        floorDataMap[f.id].totalQuantity += q;
        floorDataMap[f.id].subtotal += q * item.rate;
      }
    });
  });

  const totalAreaSqFt = floors.reduce((acc, f) => acc + f.areaSqFt, 0);
  const contingencyAmount = Math.round(buildingSubtotal * (contingencyPercent / 100));
  const grandTotal = buildingSubtotal + contingencyAmount;
  const overallRatePerSqFt = totalAreaSqFt > 0 ? Math.round(grandTotal / totalAreaSqFt) : 0;

  const floorTotals: FloorWiseTotal[] = floors.map((f) => {
    const data = floorDataMap[f.id] || { subtotal: 0, itemCount: 0, totalQuantity: 0 };
    const pct = buildingSubtotal > 0 ? (data.subtotal / buildingSubtotal) * 100 : 0;
    const ratePerSqFt = f.areaSqFt > 0 ? Math.round(data.subtotal / f.areaSqFt) : 0;

    return {
      floorId: f.id,
      floorName: f.name,
      shortCode: f.shortCode,
      levelIndex: f.levelIndex,
      elevation: f.elevation,
      areaSqFt: f.areaSqFt,
      itemCount: data.itemCount,
      subtotal: Math.round(data.subtotal * 100) / 100,
      ratePerSqFt,
      percentageOfBuilding: Math.round(pct * 10) / 10,
    };
  });

  return {
    floorTotals,
    buildingSubtotal: Math.round(buildingSubtotal * 100) / 100,
    contingencyAmount,
    grandTotal,
    totalAreaSqFt,
    overallRatePerSqFt,
  };
}

/**
 * Generates an engineering-grade CSV of the Schedule of Rates & Quantities
 * with floor-by-floor breakdown columns.
 */
export function generateFloorWiseCSV(
  items: BOQItem[],
  floors: BuildingFloor[] = DEFAULT_BUILDING_FLOORS,
  projectName: string = 'Building Project',
  contingencyPercent: number = 10
): string {
  const ensuredItems = items.map((it) => ensureItemFloorBreakdown(it, floors));
  const { floorTotals, buildingSubtotal, contingencyAmount, grandTotal, totalAreaSqFt, overallRatePerSqFt } =
    calculateFloorWiseTotals(ensuredItems, floors, contingencyPercent);

  // Headers
  const baseHeaders = ['#', 'Item Description', 'Category', 'Unit', 'Unit Rate (INR)'];
  const floorHeaders: string[] = [];
  floors.forEach((f) => {
    floorHeaders.push(`${f.shortCode} Qty (${f.name})`);
    floorHeaders.push(`${f.shortCode} Amount (INR)`);
  });
  const summaryHeaders = ['Total Quantity', 'Total Amount (INR)', 'Notes'];

  const allHeaders = [...baseHeaders, ...floorHeaders, ...summaryHeaders];
  const rows: string[] = [allHeaders.join(',')];

  // Data rows
  ensuredItems.forEach((it, idx) => {
    const rowVals: string[] = [
      String(idx + 1),
      `"${(it.name || '').replace(/"/g, '""')}"`,
      `"${it.category || 'General'}"`,
      `"${it.unit}"`,
      String(it.rate),
    ];

    floors.forEach((f) => {
      const q = (it.floorBreakdown && it.floorBreakdown[f.id]) || 0;
      const amt = Math.round(q * it.rate * 100) / 100;
      rowVals.push(String(q));
      rowVals.push(String(amt));
    });

    rowVals.push(String(it.quantity));
    rowVals.push(String(Math.round(it.quantity * it.rate * 100) / 100));
    rowVals.push(`"${(it.notes || '').replace(/"/g, '""')}"`);

    rows.push(rowVals.join(','));
  });

  // Empty separator
  rows.push('');

  // Floor Subtotals row
  const subtotalRow: string[] = ['', '"FLOOR SUBTOTAL"', '', '', ''];
  floors.forEach((f) => {
    const ft = floorTotals.find((t) => t.floorId === f.id);
    subtotalRow.push('-');
    subtotalRow.push(String(ft?.subtotal || 0));
  });
  subtotalRow.push('-');
  subtotalRow.push(String(buildingSubtotal));
  subtotalRow.push('');
  rows.push(subtotalRow.join(','));

  // Floor Area row
  const areaRow: string[] = ['', '"FLOOR BUILT-UP AREA (SQ.FT)"', '', '', ''];
  floors.forEach((f) => {
    areaRow.push('-');
    areaRow.push(`${f.areaSqFt} sq.ft`);
  });
  areaRow.push('-');
  areaRow.push(`${totalAreaSqFt} sq.ft`);
  areaRow.push('');
  rows.push(areaRow.join(','));

  // Floor Rate per Sq.Ft row
  const ratePerSqFtRow: string[] = ['', '"FLOOR RATE PER SQ.FT (INR/SQ.FT)"', '', '', ''];
  floors.forEach((f) => {
    const ft = floorTotals.find((t) => t.floorId === f.id);
    ratePerSqFtRow.push('-');
    ratePerSqFtRow.push(`INR ${ft?.ratePerSqFt || 0}/sq.ft`);
  });
  ratePerSqFtRow.push('-');
  ratePerSqFtRow.push(`INR ${overallRatePerSqFt}/sq.ft`);
  ratePerSqFtRow.push('');
  rows.push(ratePerSqFtRow.join(','));

  // Contingency & Grand Total
  rows.push('');
  rows.push(`"", "Contingency Allowance (${contingencyPercent}%)", "", "", "", ${contingencyAmount}`);
  rows.push(`"", "GRAND TOTAL WITH CONTINGENCY", "", "", "", ${grandTotal}`);

  // Prefix UTF-8 BOM (\uFEFF) and use CRLF so Microsoft Excel opens cleanly
  return '\uFEFF' + rows.join('\r\n');
}
