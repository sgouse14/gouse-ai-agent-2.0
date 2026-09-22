import { BOQItem, BuildingFloor } from '../types';
import { CivilWisdomFormulaItem, CivilWisdomCalculationParams } from '../data/civilWisdomFormulas';
import { DEFAULT_BUILDING_FLOORS } from './floorTakeoffEngine';

export interface BOQMatchResult {
  matchedItem: BOQItem | null;
  boqQuantity: number | null;
  matrixQuantity: number;
  matrixUnit: string;
  boqUnit: string | null;
  varianceQty: number | null; // matrixQty - boqQty
  variancePercent: number | null;
  status: 'matched' | 'variance' | 'missing';
  statusLabel: string;
}

export interface FloorFormulaBreakdownItem {
  floorId: string;
  floorName: string;
  floorCode: string;
  floorAreaSqFt: number;
  percentage: number;
  quantity: number;
  unit: string;
  cost: number;
}

/**
 * Normalizes keyword search in text
 */
function containsKeyword(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

/**
 * Matches a Civil Wisdom formula item with the most relevant BOQItem in the project's schedule
 */
export function matchFormulaToBOQItem(
  formula: CivilWisdomFormulaItem,
  calculatedQty: number,
  boqItems: BOQItem[]
): BOQMatchResult {
  let matchedItem: BOQItem | null = null;

  switch (formula.id) {
    case 'cw-cement':
      matchedItem =
        boqItems.find((i) => containsKeyword(i.name, ['cement', 'opc', 'ppc'])) ||
        boqItems.find((i) => containsKeyword(i.name, ['concrete mix', 'rcc design mix'])) ||
        null;
      break;

    case 'cw-steel':
      matchedItem =
        boqItems.find((i) => containsKeyword(i.name, ['steel', 'tmt', 'rebar', 'fe550', 'fe500'])) ||
        null;
      break;

    case 'cw-bricks':
      matchedItem =
        boqItems.find((i) => containsKeyword(i.name, ['brick', 'aac block', 'solid block', 'masonry'])) ||
        null;
      break;

    case 'cw-sand':
      matchedItem =
        boqItems.find((i) => containsKeyword(i.name, ['sand', 'm-sand', 'p-sand', 'fine aggregate'])) ||
        boqItems.find((i) => containsKeyword(i.name, ['plastering', 'plaster'])) ||
        null;
      break;

    case 'cw-aggregate':
      matchedItem =
        boqItems.find((i) => containsKeyword(i.name, ['aggregate', 'coarse aggregate', 'granite metal', 'crushed stone'])) ||
        boqItems.find((i) => containsKeyword(i.name, ['pcc', 'plain cement concrete'])) ||
        null;
      break;

    case 'cw-concrete':
      matchedItem =
        boqItems.find((i) => containsKeyword(i.name, ['rcc', 'design mix', 'ready mix', 'concrete'])) ||
        null;
      break;

    case 'cw-water':
      matchedItem =
        boqItems.find((i) => containsKeyword(i.name, ['water', 'curing', 'tank'])) ||
        null;
      break;

    case 'cw-paint':
      matchedItem =
        boqItems.find((i) => containsKeyword(i.name, ['paint', 'emulsion', 'primer', 'distemper', 'putty'])) ||
        null;
      break;

    case 'cw-tiles':
      matchedItem =
        boqItems.find((i) => containsKeyword(i.name, ['tile', 'vitrified', 'flooring', 'ceramic', 'granite flooring'])) ||
        null;
      break;

    case 'cw-excavation':
      matchedItem =
        boqItems.find((i) => containsKeyword(i.name, ['excavation', 'earthwork', 'trench'])) ||
        null;
      break;

    case 'cw-pcc':
      matchedItem =
        boqItems.find((i) => containsKeyword(i.name, ['pcc', 'plain cement concrete', 'bed concrete'])) ||
        null;
      break;

    case 'cw-labour':
      matchedItem =
        boqItems.find((i) => containsKeyword(i.name, ['labour', 'turnkey labour', 'civil contract'])) ||
        null;
      break;

    case 'cw-electrical':
      matchedItem =
        boqItems.find((i) => containsKeyword(i.name, ['electrical', 'wiring', 'conduit', 'frls', 'db board'])) ||
        null;
      break;

    case 'cw-plumbing':
      matchedItem =
        boqItems.find((i) => containsKeyword(i.name, ['plumbing', 'cpvc', 'drainage', 'sanitary', 'pipe'])) ||
        null;
      break;

    // --- Extra Reference Guide Formulas (M20 Roof Slab & Steel) ---
    case 'cw-slab-wet-vol':
      matchedItem =
        boqItems.find((i) => containsKeyword(i.name, ['slab concrete', 'roof slab', 'm20 concrete', 'rcc slab', 'ready mix'])) ||
        boqItems.find((i) => containsKeyword(i.name, ['rcc', 'concrete'])) ||
        null;
      break;

    case 'cw-slab-dry-vol':
      // Dry volume calculation factor (1.54x)
      matchedItem = null;
      break;

    case 'cw-slab-cement':
      matchedItem =
        boqItems.find((i) => containsKeyword(i.name, ['cement', 'opc', 'ppc'])) ||
        null;
      break;

    case 'cw-slab-sand':
      matchedItem =
        boqItems.find((i) => containsKeyword(i.name, ['sand', 'm-sand', 'fine aggregate'])) ||
        null;
      break;

    case 'cw-slab-coarse-agg':
      matchedItem =
        boqItems.find((i) => containsKeyword(i.name, ['aggregate', 'coarse aggregate', 'stone', 'jelly', 'granite metal'])) ||
        null;
      break;

    case 'cw-slab-steel':
      matchedItem =
        boqItems.find((i) => containsKeyword(i.name, ['steel', 'slab steel', 'rebar', 'tmt', 'fe500', 'fe550'])) ||
        null;
      break;

    default:
      matchedItem = null;
  }

  // Handle Regulatory rules (GBA Building Regulations)
  if (formula.isRegulatory) {
    return {
      matchedItem: null,
      boqQuantity: null,
      matrixQuantity: calculatedQty,
      matrixUnit: formula.unit,
      boqUnit: null,
      varianceQty: null,
      variancePercent: null,
      status: 'matched',
      statusLabel: 'GBA Regulatory Standard',
    };
  }

  if (!matchedItem) {
    return {
      matchedItem: null,
      boqQuantity: null,
      matrixQuantity: calculatedQty,
      matrixUnit: formula.unit,
      boqUnit: null,
      varianceQty: null,
      variancePercent: null,
      status: 'missing',
      statusLabel: 'Not in BOQ',
    };
  }

  // Unit conversion for sensible comparisons
  let normalizedBOQQty = matchedItem.quantity;
  const bUnit = matchedItem.unit.toLowerCase().trim();

  // If formula is Steel in Kg and BOQ is in MT:
  if (formula.id === 'cw-steel' && (bUnit === 'mt' || bUnit === 'ton' || bUnit === 'tonne')) {
    normalizedBOQQty = matchedItem.quantity * 1000; // convert BOQ MT to kg for direct variance check
  }

  // If formula is Sand in CFT and BOQ is in m3:
  if ((formula.id === 'cw-sand' || formula.id === 'cw-aggregate' || formula.id === 'cw-excavation' || formula.id === 'cw-pcc') && bUnit === 'm3') {
    normalizedBOQQty = matchedItem.quantity * 35.3147; // m3 to CFT
  }

  // If formula is Tiles in nos and BOQ is in sq.m:
  if (formula.id === 'cw-tiles' && (bUnit === 'sq.m' || bUnit === 'sqm' || bUnit === 'm2')) {
    // 1 sq.m = ~10.764 sq.ft; at 4 sq.ft/tile ~ 2.69 tiles per sq.m
    normalizedBOQQty = matchedItem.quantity * 2.69;
  }

  const delta = calculatedQty - normalizedBOQQty;
  const pct = normalizedBOQQty > 0 ? (delta / normalizedBOQQty) * 100 : 0;
  const absPct = Math.abs(pct);

  let status: 'matched' | 'variance' | 'missing' = 'matched';
  let statusLabel = 'Matched (in sync)';

  if (absPct > 2.5) {
    status = 'variance';
    statusLabel = delta > 0 ? `+${absPct.toFixed(1)}% vs BOQ` : `${pct.toFixed(1)}% vs BOQ`;
  }

  return {
    matchedItem,
    boqQuantity: matchedItem.quantity,
    matrixQuantity: calculatedQty,
    matrixUnit: formula.unit,
    boqUnit: matchedItem.unit,
    varianceQty: Number(delta.toFixed(1)),
    variancePercent: Number(pct.toFixed(1)),
    status,
    statusLabel,
  };
}

/**
 * Calculates floor-wise distribution of material quantities across building floor levels
 */
export function calculateFloorWiseFormulaBreakdown(
  formula: CivilWisdomFormulaItem,
  params: CivilWisdomCalculationParams,
  floors: BuildingFloor[] = DEFAULT_BUILDING_FLOORS
): FloorFormulaBreakdownItem[] {
  const activeFloors = floors && floors.length > 0 ? floors : DEFAULT_BUILDING_FLOORS;
  const totalArea = activeFloors.reduce((sum, f) => sum + f.areaSqFt, 0) || params.areaSqFt;
  const totalQty = formula.calculateQuantity(params);
  const totalCost = formula.calculateCost(params);

  return activeFloors.map((floor) => {
    let floorShare = floor.areaSqFt / totalArea;

    // Specialized structural allocations
    if (formula.id === 'cw-excavation' || formula.id === 'cw-pcc') {
      // 90% in substructure, 10% on ground floor / plinth
      if (floor.id === 'substructure' || floor.levelIndex === -1) {
        floorShare = 0.90;
      } else if (floor.id === 'ground_floor' || floor.levelIndex === 0) {
        floorShare = 0.10;
      } else {
        floorShare = 0;
      }
    } else if (formula.id === 'cw-paint' || formula.id === 'cw-tiles') {
      // Not in substructure foundation; distributed across superstructure
      if (floor.id === 'substructure' || floor.levelIndex === -1) {
        floorShare = 0;
      } else {
        const superstructureArea = activeFloors
          .filter((f) => f.id !== 'substructure' && f.levelIndex >= 0)
          .reduce((sum, f) => sum + f.areaSqFt, 0);
        floorShare = superstructureArea > 0 ? floor.areaSqFt / superstructureArea : floorShare;
      }
    }

    const floorQty = Math.round(totalQty * floorShare * 10) / 10;
    const floorCost = Math.round(totalCost * floorShare);

    return {
      floorId: floor.id,
      floorName: floor.name,
      floorCode: floor.shortCode,
      floorAreaSqFt: floor.areaSqFt,
      percentage: Math.round(floorShare * 100),
      quantity: floorQty,
      unit: formula.unit,
      cost: floorCost,
    };
  });
}

/**
 * Creates floorBreakdown dictionary matching BOQItem schema
 */
function createFloorBreakdownDict(
  formula: CivilWisdomFormulaItem,
  params: CivilWisdomCalculationParams,
  floors: BuildingFloor[],
  targetQuantity: number
): Record<string, number> {
  const breakdown = calculateFloorWiseFormulaBreakdown(formula, params, floors);
  const dict: Record<string, number> = {};
  let distributed = 0;

  breakdown.forEach((b, idx) => {
    if (idx === breakdown.length - 1) {
      dict[b.floorId] = Number((targetQuantity - distributed).toFixed(2));
    } else {
      const q = Number((targetQuantity * (b.percentage / 100)).toFixed(2));
      dict[b.floorId] = q;
      distributed += q;
    }
  });

  return dict;
}

/**
 * 1-Click: Sync a single matrix formula item's estimated quantity to the BOQ schedule
 */
export function syncMatrixItemToBOQ(
  formula: CivilWisdomFormulaItem,
  calculatedQty: number,
  boqItems: BOQItem[],
  areaSqFt: number,
  floors: BuildingFloor[] = DEFAULT_BUILDING_FLOORS
): { updatedItems: BOQItem[]; affectedItem: BOQItem; action: 'updated' | 'created' } {
  const matchResult = matchFormulaToBOQItem(formula, calculatedQty, boqItems);
  const activeFloors = floors && floors.length > 0 ? floors : DEFAULT_BUILDING_FLOORS;

  if (matchResult.matchedItem) {
    const existing = matchResult.matchedItem;
    let targetQty = calculatedQty;

    // Unit conversion if BOQ item is in MT while formula is in kg
    if (formula.id === 'cw-steel' && (existing.unit.toLowerCase() === 'mt' || existing.unit.toLowerCase() === 'tonne')) {
      targetQty = Number((calculatedQty / 1000).toFixed(2));
    }

    // Unit conversion if BOQ is in m3 while formula is in CFT
    if ((formula.id === 'cw-sand' || formula.id === 'cw-aggregate' || formula.id === 'cw-excavation' || formula.id === 'cw-pcc') && existing.unit.toLowerCase() === 'm3') {
      targetQty = Number((calculatedQty / 35.3147).toFixed(1));
    }

    // Unit conversion if BOQ is in sq.m while formula is in nos/sq.ft
    if (formula.id === 'cw-tiles' && (existing.unit.toLowerCase() === 'sq.m' || existing.unit.toLowerCase() === 'sqm')) {
      targetQty = Number(((areaSqFt * 1.10) / 10.764).toFixed(1));
    }

    const updatedItem: BOQItem = {
      ...existing,
      quantity: targetQty,
      amount: Math.round(targetQty * existing.rate),
      notes: `${existing.notes ? existing.notes + ' • ' : ''}[Synced from Standard Material Matrix: ${formula.quickFormula} (${areaSqFt.toLocaleString()} sq.ft)]`,
      floorBreakdown: createFloorBreakdownDict(formula, { areaSqFt }, activeFloors, targetQty),
    };

    const updatedItems = boqItems.map((i) => (i.id === existing.id ? updatedItem : i));
    return { updatedItems, affectedItem: updatedItem, action: 'updated' };
  } else {
    // Create new BOQ item for this material
    const newItemId = `boq-${formula.id}-${Date.now().toString().slice(-4)}`;
    const targetQty = calculatedQty;
    const rate = formula.defaultRate;
    const amount = Math.round(targetQty * rate);

    const newItem: BOQItem = {
      id: newItemId,
      name: `${formula.item} (${formula.whatItIs}) - Quick Standard Spec`,
      category: formula.category,
      unit: formula.unit,
      quantity: targetQty,
      rate: rate,
      amount: amount,
      notes: `Generated via Standard Material Matrix (${formula.quickFormula}) for ${areaSqFt.toLocaleString()} sq.ft built-up area.`,
      stage: formula.category === 'Substructure' ? 'Substructure' : formula.category === 'Finishes & Architectural' ? 'Finishes' : 'Superstructure',
      status: 'estimated',
      materialComponent: formula.category === 'Services & Trades' ? 0.35 : 0.80,
      laborComponent: formula.category === 'Services & Trades' ? 0.65 : 0.20,
      equipmentComponent: 0.0,
      floorBreakdown: createFloorBreakdownDict(formula, { areaSqFt }, activeFloors, targetQty),
    };

    return {
      updatedItems: [...boqItems, newItem],
      affectedItem: newItem,
      action: 'created',
    };
  }
}

/**
 * 1-Click: Synchronizes all 14 Civil Wisdom Matrix items to the project's BOQ Schedule
 */
export function syncAllMatrixQuantitiesToBOQ(
  formulas: CivilWisdomFormulaItem[],
  params: CivilWisdomCalculationParams,
  boqItems: BOQItem[],
  floors: BuildingFloor[] = DEFAULT_BUILDING_FLOORS
): {
  updatedItems: BOQItem[];
  updatedCount: number;
  createdCount: number;
  message: string;
} {
  let currentItems = [...boqItems];
  let updatedCount = 0;
  let createdCount = 0;

  for (const formula of formulas) {
    // Skip regulatory rules and intermediate conversion ratio factors from commercial BOQ line items
    if (formula.isRegulatory || formula.id === 'cw-slab-dry-vol') {
      continue;
    }

    const calculatedQty = formula.calculateQuantity(params);
    const { updatedItems: nextItems, action } = syncMatrixItemToBOQ(
      formula,
      calculatedQty,
      currentItems,
      params.areaSqFt,
      floors
    );
    currentItems = nextItems;
    if (action === 'updated') updatedCount++;
    if (action === 'created') createdCount++;
  }

  return {
    updatedItems: currentItems,
    updatedCount,
    createdCount,
    message: `✓ Synchronized ${updatedCount} existing BOQ quantities and created ${createdCount} new material items for ${params.areaSqFt.toLocaleString()} sq.ft across ${floors.length} building floors!`,
  };
}
