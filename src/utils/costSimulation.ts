import { BOQItem } from '../types';
import {
  HISTORICAL_MATERIAL_INDICES,
  LATEST_INDEX_POINT,
  COMMODITY_INDEX_METAS,
  SIMULATION_SCENARIOS,
  SimulationScenario,
  SimulatedFuturePoint,
} from '../data/historicalIndices';

export interface SimulationParams {
  items: BOQItem[];
  contingencyPercent: number;
  horizonMonths: number; // 6, 12, 18, 24, 36
  scenario: SimulationScenario;
  customInflationOverridePct: number; // -5 to +15%
  startDate?: Date;
}

export interface SimulationSummary {
  currentTotal: number;
  projectedTotal: number;
  totalEscalationAmount: number;
  totalEscalationPercent: number;
  contingencyAmount: number;
  contingencyBreached: boolean;
  breachMonth?: number;
  maxMonthlyIncreasePercent: number;
  maxMonthlyIncreaseMonth: string;
  categoryEscalations: {
    category: string;
    currentCost: number;
    projectedCost: number;
    escalationAmount: number;
    escalationPercent: number;
    color: string;
  }[];
  points: SimulatedFuturePoint[];
}

/**
 * Classifies a BOQ item to a commodity index mapping
 */
export function classifyItemIndex(item: BOQItem): 'steel' | 'cement' | 'aggregates' | 'masonry' | 'finishes' | 'other' {
  const name = (item.name || '').toLowerCase();
  const cat = (item.category || '').toLowerCase();

  if (name.includes('steel') || name.includes('rebar') || name.includes('tmt') || name.includes('reinforcement')) {
    return 'steel';
  }
  if (name.includes('sand') || name.includes('aggregate') || name.includes('gravel') || name.includes('ballast')) {
    return 'aggregates';
  }
  if (name.includes('concrete') || name.includes('rcc') || name.includes('pcc') || name.includes('cement') || cat === 'concrete works') {
    return 'cement';
  }
  if (cat === 'masonry' || name.includes('brick') || name.includes('block') || name.includes('aac')) {
    return 'masonry';
  }
  if (
    cat === 'finishes' ||
    cat === 'doors & windows' ||
    cat === 'plumbing' ||
    cat === 'mep & electrical' ||
    name.includes('tile') ||
    name.includes('paint') ||
    name.includes('plaster') ||
    name.includes('glass') ||
    name.includes('door') ||
    name.includes('window')
  ) {
    return 'finishes';
  }
  return 'other';
}

/**
 * Runs the dynamic multi-factor construction material price simulation
 */
export function simulateFutureBOQCosts(params: SimulationParams): SimulationSummary {
  const { items, contingencyPercent, horizonMonths, scenario, customInflationOverridePct } = params;

  const scenarioConfig = SIMULATION_SCENARIOS.find((s) => s.id === scenario) || SIMULATION_SCENARIOS[0];

  // Base costs at Month 0
  const currentTotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const contingencyAmount = (currentTotal * contingencyPercent) / 100;
  const contingencyCeiling = currentTotal + contingencyAmount;

  const baseDate = params.startDate ? new Date(params.startDate) : new Date(2026, 2, 1); // March 2026

  const points: SimulatedFuturePoint[] = [];

  // CAGRs per commodity
  const steelCAGR = 0.052;
  const cementCAGR = 0.068;
  const aggregatesCAGR = 0.051;
  const masonryCAGR = 0.044;
  const finishesCAGR = 0.049;
  const laborCAGR = 0.064;

  const extraInflation = (scenarioConfig.annualInflationDeltaPct + customInflationOverridePct) / 100;

  // Month-by-month projection
  for (let m = 0; m <= horizonMonths; m++) {
    const futureDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + m, 1);
    const monthName = futureDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const monthIndex = futureDate.getMonth(); // 0 to 11

    // Compound time in years
    const t = m / 12;

    // Seasonality adjustment (monsoon slowdown in Jun-Aug, post-monsoon surge in Oct-Feb)
    let seasonalMultCement = 1.0;
    let seasonalMultSteel = 1.0;
    if (scenarioConfig.monsoonDipApplied || scenario === 'monsoon_cycle') {
      if (monthIndex >= 5 && monthIndex <= 7) {
        // Jun, Jul, Aug (monsoon)
        seasonalMultCement = 0.975;
        seasonalMultSteel = 0.985;
      } else if (monthIndex >= 9 || monthIndex <= 1) {
        // Oct - Feb (peak construction surge)
        seasonalMultCement = 1.032;
        seasonalMultSteel = 1.025;
      }
    }

    // Volatility wave for realism
    const cycleWave = Math.sin((m / 12) * Math.PI * 2) * (0.012 * scenarioConfig.volatilityMultiplier);

    // Multipliers for active scenario
    const steelMult = Math.pow(1 + steelCAGR + extraInflation, t) * seasonalMultSteel * (1 + cycleWave);
    const cementMult = Math.pow(1 + cementCAGR + extraInflation, t) * seasonalMultCement * (1 + cycleWave * 0.7);
    const aggregatesMult = Math.pow(1 + aggregatesCAGR + extraInflation, t);
    const masonryMult = Math.pow(1 + masonryCAGR + extraInflation, t);
    const finishesMult = Math.pow(1 + finishesCAGR + extraInflation, t);
    const laborMult = Math.pow(1 + laborCAGR + extraInflation * 0.7, t);

    // Baseline multipliers (for comparative envelope)
    const steelMultBase = Math.pow(1 + steelCAGR, t);
    const cementMultBase = Math.pow(1 + cementCAGR, t);
    const aggregatesMultBase = Math.pow(1 + aggregatesCAGR, t);
    const masonryMultBase = Math.pow(1 + masonryCAGR, t);
    const finishesMultBase = Math.pow(1 + finishesCAGR, t);
    const laborMultBase = Math.pow(1 + laborCAGR, t);

    // Shock multipliers (+1.5 sigma / +5% inflation)
    const shockInflation = extraInflation + 0.05;
    const steelMultShock = Math.pow(1 + steelCAGR + shockInflation, t) * 1.025;
    const cementMultShock = Math.pow(1 + cementCAGR + shockInflation, t) * 1.02;
    const aggregatesMultShock = Math.pow(1 + aggregatesCAGR + shockInflation, t);
    const masonryMultShock = Math.pow(1 + masonryCAGR + shockInflation, t);
    const finishesMultShock = Math.pow(1 + finishesCAGR + shockInflation, t);
    const laborMultShock = Math.pow(1 + laborCAGR + shockInflation * 0.7, t);

    // Cooling multipliers (-1.0 sigma / -3.4% inflation)
    const coolingInflation = Math.max(-0.04, extraInflation - 0.034);
    const steelMultCooling = Math.pow(1 + steelCAGR + coolingInflation, t) * 0.985;
    const cementMultCooling = Math.pow(1 + cementCAGR + coolingInflation, t) * 0.985;
    const aggregatesMultCooling = Math.pow(1 + aggregatesCAGR + coolingInflation, t);
    const masonryMultCooling = Math.pow(1 + masonryCAGR + coolingInflation, t);
    const finishesMultCooling = Math.pow(1 + finishesCAGR + coolingInflation, t);
    const laborMultCooling = Math.pow(1 + laborCAGR + coolingInflation * 0.7, t);

    // Accumulate costs for this future point
    let totalCostActive = 0;
    let totalCostBase = 0;
    let totalCostShock = 0;
    let totalCostCooling = 0;

    let steelCost = 0;
    let concreteCost = 0;
    let masonryCost = 0;
    let finishesCost = 0;
    let otherCost = 0;
    let laborCost = 0;

    items.forEach((item) => {
      const baseItemCost = item.quantity * item.rate;
      const labPct = item.laborComponent !== undefined ? item.laborComponent : 0.28;
      const matPct = Math.max(0, 1 - labPct);

      const commodity = classifyItemIndex(item);

      let itemMatMult = 1.0;
      let itemMatMultBase = 1.0;
      let itemMatMultShock = 1.0;
      let itemMatMultCooling = 1.0;

      if (commodity === 'steel') {
        itemMatMult = steelMult;
        itemMatMultBase = steelMultBase;
        itemMatMultShock = steelMultShock;
        itemMatMultCooling = steelMultCooling;
      } else if (commodity === 'cement') {
        itemMatMult = cementMult;
        itemMatMultBase = cementMultBase;
        itemMatMultShock = cementMultShock;
        itemMatMultCooling = cementMultCooling;
      } else if (commodity === 'aggregates') {
        itemMatMult = aggregatesMult;
        itemMatMultBase = aggregatesMultBase;
        itemMatMultShock = aggregatesMultShock;
        itemMatMultCooling = aggregatesMultCooling;
      } else if (commodity === 'masonry') {
        itemMatMult = masonryMult;
        itemMatMultBase = masonryMultBase;
        itemMatMultShock = masonryMultShock;
        itemMatMultCooling = masonryMultCooling;
      } else if (commodity === 'finishes') {
        itemMatMult = finishesMult;
        itemMatMultBase = finishesMultBase;
        itemMatMultShock = finishesMultShock;
        itemMatMultCooling = finishesMultCooling;
      } else {
        itemMatMult = (cementMult + finishesMult) / 2;
        itemMatMultBase = (cementMultBase + finishesMultBase) / 2;
        itemMatMultShock = (cementMultShock + finishesMultShock) / 2;
        itemMatMultCooling = (cementMultCooling + finishesMultCooling) / 2;
      }

      // Cost under active scenario
      const projectedItemMat = baseItemCost * matPct * itemMatMult;
      const projectedItemLab = baseItemCost * labPct * laborMult;
      const projectedItemTotal = projectedItemMat + projectedItemLab;
      totalCostActive += projectedItemTotal;

      // Category breakdown accumulation
      if (commodity === 'steel') {
        steelCost += projectedItemTotal;
      } else if (commodity === 'cement' || commodity === 'aggregates') {
        concreteCost += projectedItemTotal;
      } else if (commodity === 'masonry') {
        masonryCost += projectedItemTotal;
      } else if (commodity === 'finishes') {
        finishesCost += projectedItemTotal;
      } else {
        otherCost += projectedItemTotal;
      }
      laborCost += projectedItemLab;

      // Comparative envelopes
      totalCostBase += baseItemCost * matPct * itemMatMultBase + baseItemCost * labPct * laborMultBase;
      totalCostShock += baseItemCost * matPct * itemMatMultShock + baseItemCost * labPct * laborMultShock;
      totalCostCooling += baseItemCost * matPct * itemMatMultCooling + baseItemCost * labPct * laborMultCooling;
    });

    const varianceAmount = totalCostActive - currentTotal;
    const variancePercent = currentTotal > 0 ? (varianceAmount / currentTotal) * 100 : 0;
    const isBreachingContingency = totalCostActive > contingencyCeiling;

    // Projected index equivalents
    const projectedSteelIdx = Number((LATEST_INDEX_POINT.steelIndex * steelMult).toFixed(1));
    const projectedCementIdx = Number((LATEST_INDEX_POINT.cementIndex * cementMult).toFixed(1));
    const projectedAggIdx = Number((LATEST_INDEX_POINT.aggregatesIndex * aggregatesMult).toFixed(1));
    const projectedMasonryIdx = Number((LATEST_INDEX_POINT.masonryIndex * masonryMult).toFixed(1));
    const projectedFinishesIdx = Number((LATEST_INDEX_POINT.finishesIndex * finishesMult).toFixed(1));
    const projectedLaborIdx = Number((LATEST_INDEX_POINT.laborIndex * laborMult).toFixed(1));
    const projectedCompositeIdx = Number((LATEST_INDEX_POINT.compositeIndex * ((steelMult * 0.22) + (cementMult * 0.18) + (aggregatesMult * 0.12) + (masonryMult * 0.10) + (finishesMult * 0.15) + (laborMult * 0.23))).toFixed(1));

    points.push({
      monthOffset: m,
      displayMonth: m === 0 ? 'Month 0 (Now)' : `M+${m} (${monthName})`,
      isHistorical: false,
      steelIndex: projectedSteelIdx,
      cementIndex: projectedCementIdx,
      aggregatesIndex: projectedAggIdx,
      masonryIndex: projectedMasonryIdx,
      finishesIndex: projectedFinishesIdx,
      laborIndex: projectedLaborIdx,
      compositeIndex: projectedCompositeIdx,
      totalCostBaseline: Math.round(totalCostBase),
      totalCostShock: Math.round(totalCostShock),
      totalCostCooling: Math.round(totalCostCooling),
      totalCostActiveScenario: Math.round(totalCostActive),
      steelCost: Math.round(steelCost),
      concreteCost: Math.round(concreteCost),
      masonryCost: Math.round(masonryCost),
      finishesCost: Math.round(finishesCost),
      otherCost: Math.round(otherCost),
      laborCost: Math.round(laborCost),
      varianceAmount: Math.round(varianceAmount),
      variancePercent: Number(variancePercent.toFixed(2)),
      budgetFreezeLine: Math.round(currentTotal),
      contingencyCeiling: Math.round(contingencyCeiling),
      isBreachingContingency,
    });
  }

  const finalPoint = points[points.length - 1];
  const totalEscalationAmount = finalPoint.totalCostActiveScenario - currentTotal;
  const totalEscalationPercent = currentTotal > 0 ? (totalEscalationAmount / currentTotal) * 100 : 0;

  // Breach month detection
  const firstBreach = points.find((p) => p.isBreachingContingency);
  const contingencyBreached = !!firstBreach;
  const breachMonth = firstBreach ? firstBreach.monthOffset : undefined;

  // Find month with maximum monthly rate jump
  let maxMonthlyIncreasePercent = 0;
  let maxMonthlyIncreaseMonth = points[1]?.displayMonth || 'Month 1';
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1].totalCostActiveScenario;
    const curr = points[i].totalCostActiveScenario;
    const diff = curr - prev;
    const jumpPct = prev > 0 ? (diff / prev) * 100 : 0;
    if (jumpPct > maxMonthlyIncreasePercent) {
      maxMonthlyIncreasePercent = jumpPct;
      maxMonthlyIncreaseMonth = points[i].displayMonth;
    }
  }

  // Category escalations at final horizon
  const catNames = [
    { key: 'steel', name: 'Structural Steel & TMT', color: '#06b6d4', costKey: 'steelCost' as const },
    { key: 'concrete', name: 'Concrete & Cement Works', color: '#f59e0b', costKey: 'concreteCost' as const },
    { key: 'masonry', name: 'Walling & Masonry', color: '#f97316', costKey: 'masonryCost' as const },
    { key: 'finishes', name: 'Finishes & Fenestration', color: '#8b5cf6', costKey: 'finishesCost' as const },
    { key: 'labor', name: 'Labor & Trades Component', color: '#ec4899', costKey: 'laborCost' as const },
  ];

  const categoryEscalations = catNames.map((c) => {
    const curr = points[0][c.costKey];
    const proj = finalPoint[c.costKey];
    const diff = proj - curr;
    const pct = curr > 0 ? (diff / curr) * 100 : 0;
    return {
      category: c.name,
      currentCost: curr,
      projectedCost: proj,
      escalationAmount: diff,
      escalationPercent: Number(pct.toFixed(1)),
      color: c.color,
    };
  });

  return {
    currentTotal,
    projectedTotal: finalPoint.totalCostActiveScenario,
    totalEscalationAmount,
    totalEscalationPercent: Number(totalEscalationPercent.toFixed(2)),
    contingencyAmount,
    contingencyBreached,
    breachMonth,
    maxMonthlyIncreasePercent: Number(maxMonthlyIncreasePercent.toFixed(2)),
    maxMonthlyIncreaseMonth,
    categoryEscalations,
    points,
  };
}
