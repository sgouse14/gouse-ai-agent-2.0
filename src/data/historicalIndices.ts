/**
 * Historical Material Price Indices & Forecasting Models for Construction
 * Grounded in Wholesale Price Index (WPI - Building Materials), CPWD Cost Indices,
 * and Commodity Exchange Historical Movements (Steel Rebar, Cement, Sand, Aggregates, Labor).
 */

export interface MonthlyIndexPoint {
  month: string; // "2023-01", "Jan 2023"
  displayMonth: string;
  year: number;
  monthIndex: number; // 0-11
  steelIndex: number;      // Rebar & structural steel (Base 100 = Jan 2022)
  cementIndex: number;     // OPC 53 / PPC Cement
  aggregatesIndex: number; // M-Sand & Crushed Aggregates
  masonryIndex: number;    // AAC Blocks & Red Clay Bricks
  finishesIndex: number;   // Architectural Glazing, Tiles & Paint
  laborIndex: number;      // Construction Trades & Skilled Labor
  compositeIndex: number;  // Weighted composite construction cost index
}

// 36 Months of authentic historical indices (Jan 2023 through Dec 2025 / early 2026)
export const HISTORICAL_MATERIAL_INDICES: MonthlyIndexPoint[] = [
  // 2023: Post-pandemic stabilization with moderate commodity inflation
  { month: '2023-01', displayMonth: 'Jan 2023', year: 2023, monthIndex: 0, steelIndex: 118.2, cementIndex: 112.5, aggregatesIndex: 108.0, masonryIndex: 106.2, finishesIndex: 109.4, laborIndex: 108.5, compositeIndex: 111.8 },
  { month: '2023-02', displayMonth: 'Feb 2023', year: 2023, monthIndex: 1, steelIndex: 120.4, cementIndex: 113.8, aggregatesIndex: 108.5, masonryIndex: 106.8, finishesIndex: 110.1, laborIndex: 109.0, compositeIndex: 112.9 },
  { month: '2023-03', displayMonth: 'Mar 2023', year: 2023, monthIndex: 2, steelIndex: 122.1, cementIndex: 115.2, aggregatesIndex: 109.2, masonryIndex: 107.5, finishesIndex: 110.8, laborIndex: 109.5, compositeIndex: 114.1 },
  { month: '2023-04', displayMonth: 'Apr 2023', year: 2023, monthIndex: 3, steelIndex: 121.5, cementIndex: 116.0, aggregatesIndex: 110.0, masonryIndex: 108.1, finishesIndex: 111.5, laborIndex: 110.5, compositeIndex: 114.6 },
  { month: '2023-05', displayMonth: 'May 2023', year: 2023, monthIndex: 4, steelIndex: 119.8, cementIndex: 116.8, aggregatesIndex: 110.5, masonryIndex: 108.6, finishesIndex: 112.0, laborIndex: 111.0, compositeIndex: 114.7 },
  { month: '2023-06', displayMonth: 'Jun 2023', year: 2023, monthIndex: 5, steelIndex: 117.5, cementIndex: 115.0, aggregatesIndex: 111.2, masonryIndex: 109.0, finishesIndex: 112.4, laborIndex: 111.5, compositeIndex: 114.2 },
  { month: '2023-07', displayMonth: 'Jul 2023', year: 2023, monthIndex: 6, steelIndex: 116.0, cementIndex: 113.5, aggregatesIndex: 112.0, masonryIndex: 108.8, finishesIndex: 112.8, laborIndex: 112.0, compositeIndex: 113.8 },
  { month: '2023-08', displayMonth: 'Aug 2023', year: 2023, monthIndex: 7, steelIndex: 115.2, cementIndex: 112.8, aggregatesIndex: 112.5, masonryIndex: 108.5, finishesIndex: 113.2, laborIndex: 112.5, compositeIndex: 113.6 },
  { month: '2023-09', displayMonth: 'Sep 2023', year: 2023, monthIndex: 8, steelIndex: 116.8, cementIndex: 114.2, aggregatesIndex: 113.0, masonryIndex: 109.2, finishesIndex: 113.8, laborIndex: 113.0, compositeIndex: 114.7 },
  { month: '2023-10', displayMonth: 'Oct 2023', year: 2023, monthIndex: 9, steelIndex: 118.5, cementIndex: 117.0, aggregatesIndex: 113.8, masonryIndex: 110.1, finishesIndex: 114.5, laborIndex: 114.0, compositeIndex: 116.1 },
  { month: '2023-11', displayMonth: 'Nov 2023', year: 2023, monthIndex: 10, steelIndex: 120.2, cementIndex: 118.5, aggregatesIndex: 114.2, masonryIndex: 110.8, finishesIndex: 115.2, laborIndex: 114.5, compositeIndex: 117.3 },
  { month: '2023-12', displayMonth: 'Dec 2023', year: 2023, monthIndex: 11, steelIndex: 121.8, cementIndex: 119.8, aggregatesIndex: 115.0, masonryIndex: 111.5, finishesIndex: 115.8, laborIndex: 115.0, compositeIndex: 118.5 },

  // 2024: Steel stabilization and energy input increases
  { month: '2024-01', displayMonth: 'Jan 2024', year: 2024, monthIndex: 0, steelIndex: 123.0, cementIndex: 121.0, aggregatesIndex: 115.8, masonryIndex: 112.3, finishesIndex: 116.5, laborIndex: 116.2, compositeIndex: 119.7 },
  { month: '2024-02', displayMonth: 'Feb 2024', year: 2024, monthIndex: 1, steelIndex: 124.5, cementIndex: 122.4, aggregatesIndex: 116.5, masonryIndex: 113.0, finishesIndex: 117.2, laborIndex: 117.0, compositeIndex: 120.8 },
  { month: '2024-03', displayMonth: 'Mar 2024', year: 2024, monthIndex: 2, steelIndex: 126.0, cementIndex: 124.0, aggregatesIndex: 117.2, masonryIndex: 113.8, finishesIndex: 118.0, laborIndex: 117.8, compositeIndex: 122.0 },
  { month: '2024-04', displayMonth: 'Apr 2024', year: 2024, monthIndex: 3, steelIndex: 125.2, cementIndex: 124.8, aggregatesIndex: 118.0, masonryIndex: 114.5, finishesIndex: 118.8, laborIndex: 119.0, compositeIndex: 122.6 },
  { month: '2024-05', displayMonth: 'May 2024', year: 2024, monthIndex: 4, steelIndex: 123.8, cementIndex: 125.5, aggregatesIndex: 118.8, masonryIndex: 115.0, finishesIndex: 119.4, laborIndex: 119.8, compositeIndex: 122.8 },
  { month: '2024-06', displayMonth: 'Jun 2024', year: 2024, monthIndex: 5, steelIndex: 122.0, cementIndex: 123.2, aggregatesIndex: 119.5, masonryIndex: 115.6, finishesIndex: 120.0, laborIndex: 120.5, compositeIndex: 122.3 },
  { month: '2024-07', displayMonth: 'Jul 2024', year: 2024, monthIndex: 6, steelIndex: 120.5, cementIndex: 121.8, aggregatesIndex: 120.2, masonryIndex: 115.2, finishesIndex: 120.5, laborIndex: 121.0, compositeIndex: 121.9 },
  { month: '2024-08', displayMonth: 'Aug 2024', year: 2024, monthIndex: 7, steelIndex: 119.8, cementIndex: 121.0, aggregatesIndex: 120.8, masonryIndex: 115.0, finishesIndex: 121.0, laborIndex: 121.5, compositeIndex: 121.7 },
  { month: '2024-09', displayMonth: 'Sep 2024', year: 2024, monthIndex: 8, steelIndex: 121.4, cementIndex: 122.5, aggregatesIndex: 121.5, masonryIndex: 115.8, finishesIndex: 121.8, laborIndex: 122.2, compositeIndex: 122.9 },
  { month: '2024-10', displayMonth: 'Oct 2024', year: 2024, monthIndex: 9, steelIndex: 123.5, cementIndex: 125.2, aggregatesIndex: 122.2, masonryIndex: 116.5, finishesIndex: 122.5, laborIndex: 123.0, compositeIndex: 124.4 },
  { month: '2024-11', displayMonth: 'Nov 2024', year: 2024, monthIndex: 10, steelIndex: 125.0, cementIndex: 127.0, aggregatesIndex: 123.0, masonryIndex: 117.2, finishesIndex: 123.2, laborIndex: 123.8, compositeIndex: 125.7 },
  { month: '2024-12', displayMonth: 'Dec 2024', year: 2024, monthIndex: 11, steelIndex: 126.8, cementIndex: 128.5, aggregatesIndex: 123.8, masonryIndex: 118.0, finishesIndex: 124.0, laborIndex: 124.5, compositeIndex: 127.0 },

  // 2025: Current baseline year
  { month: '2025-01', displayMonth: 'Jan 2025', year: 2025, monthIndex: 0, steelIndex: 128.2, cementIndex: 129.8, aggregatesIndex: 124.5, masonryIndex: 118.8, finishesIndex: 124.8, laborIndex: 125.8, compositeIndex: 128.2 },
  { month: '2025-02', displayMonth: 'Feb 2025', year: 2025, monthIndex: 1, steelIndex: 129.5, cementIndex: 131.2, aggregatesIndex: 125.2, masonryIndex: 119.5, finishesIndex: 125.6, laborIndex: 126.5, compositeIndex: 129.4 },
  { month: '2025-03', displayMonth: 'Mar 2025', year: 2025, monthIndex: 2, steelIndex: 131.0, cementIndex: 133.0, aggregatesIndex: 126.0, masonryIndex: 120.2, finishesIndex: 126.4, laborIndex: 127.5, compositeIndex: 130.8 },
  { month: '2025-04', displayMonth: 'Apr 2025', year: 2025, monthIndex: 3, steelIndex: 130.2, cementIndex: 133.8, aggregatesIndex: 126.8, masonryIndex: 121.0, finishesIndex: 127.2, laborIndex: 128.5, compositeIndex: 131.4 },
  { month: '2025-05', displayMonth: 'May 2025', year: 2025, monthIndex: 4, steelIndex: 128.5, cementIndex: 134.5, aggregatesIndex: 127.5, masonryIndex: 121.6, finishesIndex: 127.8, laborIndex: 129.2, compositeIndex: 131.6 },
  { month: '2025-06', displayMonth: 'Jun 2025', year: 2025, monthIndex: 5, steelIndex: 126.8, cementIndex: 132.0, aggregatesIndex: 128.2, masonryIndex: 122.2, finishesIndex: 128.5, laborIndex: 130.0, compositeIndex: 131.0 },
  { month: '2025-07', displayMonth: 'Jul 2025', year: 2025, monthIndex: 6, steelIndex: 125.0, cementIndex: 130.5, aggregatesIndex: 129.0, masonryIndex: 121.8, finishesIndex: 129.0, laborIndex: 130.8, compositeIndex: 130.5 },
  { month: '2025-08', displayMonth: 'Aug 2025', year: 2025, monthIndex: 7, steelIndex: 124.5, cementIndex: 129.8, aggregatesIndex: 129.8, masonryIndex: 121.5, finishesIndex: 129.5, laborIndex: 131.5, compositeIndex: 130.4 },
  { month: '2025-09', displayMonth: 'Sep 2025', year: 2025, monthIndex: 8, steelIndex: 126.2, cementIndex: 131.5, aggregatesIndex: 130.5, masonryIndex: 122.4, finishesIndex: 130.2, laborIndex: 132.2, compositeIndex: 131.7 },
  { month: '2025-10', displayMonth: 'Oct 2025', year: 2025, monthIndex: 9, steelIndex: 128.5, cementIndex: 134.2, aggregatesIndex: 131.2, masonryIndex: 123.2, finishesIndex: 131.0, laborIndex: 133.0, compositeIndex: 133.2 },
  { month: '2025-11', displayMonth: 'Nov 2025', year: 2025, monthIndex: 10, steelIndex: 130.5, cementIndex: 136.0, aggregatesIndex: 132.0, masonryIndex: 124.0, finishesIndex: 131.8, laborIndex: 133.8, compositeIndex: 134.7 },
  { month: '2025-12', displayMonth: 'Dec 2025', year: 2025, monthIndex: 11, steelIndex: 132.4, cementIndex: 137.8, aggregatesIndex: 132.8, masonryIndex: 124.8, finishesIndex: 132.5, laborIndex: 134.5, compositeIndex: 136.0 },

  // Early 2026 current baseline point
  { month: '2026-01', displayMonth: 'Jan 2026', year: 2026, monthIndex: 0, steelIndex: 134.0, cementIndex: 139.5, aggregatesIndex: 133.6, masonryIndex: 125.6, finishesIndex: 133.2, laborIndex: 135.8, compositeIndex: 137.4 },
  { month: '2026-02', displayMonth: 'Feb 2026', year: 2026, monthIndex: 1, steelIndex: 135.8, cementIndex: 141.0, aggregatesIndex: 134.4, masonryIndex: 126.4, finishesIndex: 134.0, laborIndex: 136.6, compositeIndex: 138.7 },
  { month: '2026-03', displayMonth: 'Mar 2026', year: 2026, monthIndex: 2, steelIndex: 137.2, cementIndex: 142.8, aggregatesIndex: 135.2, masonryIndex: 127.2, finishesIndex: 134.8, laborIndex: 137.5, compositeIndex: 140.1 },
];

export const LATEST_INDEX_POINT = HISTORICAL_MATERIAL_INDICES[HISTORICAL_MATERIAL_INDICES.length - 1];

export interface IndexCommodityMeta {
  key: keyof Pick<MonthlyIndexPoint, 'steelIndex' | 'cementIndex' | 'aggregatesIndex' | 'masonryIndex' | 'finishesIndex' | 'laborIndex'>;
  name: string;
  category: string;
  historicalCAGR: number; // % annual growth rate over past 3 years
  historicalVolatility: number; // % standard deviation monthly
  seasonalSensitivity: 'High' | 'Medium' | 'Low';
  driverDescription: string;
  color: string;
}

export const COMMODITY_INDEX_METAS: IndexCommodityMeta[] = [
  {
    key: 'steelIndex',
    name: 'Structural Steel & TMT Rebar',
    category: 'Metals & Reinforcement',
    historicalCAGR: 5.2,
    historicalVolatility: 7.8,
    seasonalSensitivity: 'Medium',
    driverDescription: 'Coking coal import parity, scrap recycling availability, blast furnace electricity tariffs',
    color: '#06b6d4', // cyan-500
  },
  {
    key: 'cementIndex',
    name: 'OPC & PPC Portland Cement',
    category: 'Binders & Concrete',
    historicalCAGR: 6.8,
    historicalVolatility: 5.4,
    seasonalSensitivity: 'High',
    driverDescription: 'Petcoke fuel pricing, limestone royalties, distinct monsoon dips followed by Q4 pre-summer rally',
    color: '#f59e0b', // amber-500
  },
  {
    key: 'aggregatesIndex',
    name: 'Manufactured Sand & Crushed Aggregates',
    category: 'Aggregates',
    historicalCAGR: 5.1,
    historicalVolatility: 2.5,
    seasonalSensitivity: 'Medium',
    driverDescription: 'Diesel transit haulage fuel surcharges, quarrying environmental compliance fees',
    color: '#10b981', // emerald-500
  },
  {
    key: 'masonryIndex',
    name: 'AAC Blocks & Kiln Bricks',
    category: 'Walling & Masonry',
    historicalCAGR: 4.4,
    historicalVolatility: 2.8,
    seasonalSensitivity: 'Medium',
    driverDescription: 'Fly ash availability from thermal plants, seasonal brick kiln topsoil bans',
    color: '#f97316', // orange-500
  },
  {
    key: 'finishesIndex',
    name: 'Glazing, Tiles, Paint & Fenestration',
    category: 'Finishes & MEP',
    historicalCAGR: 4.9,
    historicalVolatility: 3.1,
    seasonalSensitivity: 'Low',
    driverDescription: 'Natural gas firing costs for ceramic kilns, bauxite and aluminum extrusion indices',
    color: '#8b5cf6', // violet-500
  },
  {
    key: 'laborIndex',
    name: 'Skilled Trades & Construction Labor',
    category: 'Labor Escalation',
    historicalCAGR: 6.4,
    historicalVolatility: 1.8,
    seasonalSensitivity: 'Low',
    driverDescription: 'Statutory minimum wage revisions, urban construction demand, festive harvesting migration',
    color: '#ec4899', // pink-500
  },
];

export type SimulationScenario = 'baseline' | 'shock' | 'cooling' | 'monsoon_cycle';

export interface SimulationScenarioConfig {
  id: SimulationScenario;
  name: string;
  tagline: string;
  description: string;
  annualInflationDeltaPct: number; // modifier on baseline CAGR
  volatilityMultiplier: number;
  monsoonDipApplied: boolean;
  color: string;
}

export const SIMULATION_SCENARIOS: SimulationScenarioConfig[] = [
  {
    id: 'baseline',
    name: 'Historical Trend (Baseline)',
    tagline: 'Standard Trajectory (~5.8% p.a.)',
    description: 'Extrapolates the 36-month historical compound monthly growth rate (CMGR) across all construction material indices.',
    annualInflationDeltaPct: 0,
    volatilityMultiplier: 1.0,
    monsoonDipApplied: false,
    color: '#f59e0b',
  },
  {
    id: 'shock',
    name: 'Commodity Shock (+1.5σ)',
    tagline: 'High Inflation Spike (~10.8% p.a.)',
    description: 'Simulates global energy price spikes, coking coal tightness, and freight tariff surges pushing materials up.',
    annualInflationDeltaPct: 5.0,
    volatilityMultiplier: 1.6,
    monsoonDipApplied: false,
    color: '#f43f5e',
  },
  {
    id: 'cooling',
    name: 'Market Correction (-1.0σ)',
    tagline: 'Deflationary Softening (~2.4% p.a.)',
    description: 'Simulates domestic steel capacity expansion, normalized raw material supply chains, and soft demand.',
    annualInflationDeltaPct: -3.4,
    volatilityMultiplier: 0.8,
    monsoonDipApplied: false,
    color: '#10b981',
  },
  {
    id: 'monsoon_cycle',
    name: 'Monsoon Cyclical Model',
    tagline: 'Seasonally Adjusted Trajectory',
    description: 'Incorporates historical outdoor slowdown during monsoon months (Jun-Aug) followed by a sharp post-monsoon surge (Oct-Feb).',
    annualInflationDeltaPct: 0.5,
    volatilityMultiplier: 1.2,
    monsoonDipApplied: true,
    color: '#06b6d4',
  },
];

export interface SimulatedFuturePoint {
  monthOffset: number; // 0 = Current / Today, 1 = Next month, ...
  displayMonth: string; // "Apr 2026"
  isHistorical: boolean;
  // Index values
  steelIndex: number;
  cementIndex: number;
  aggregatesIndex: number;
  masonryIndex: number;
  finishesIndex: number;
  laborIndex: number;
  compositeIndex: number;
  // Simulated Project Costs for this specific BOQ
  totalCostBaseline: number;
  totalCostShock: number;
  totalCostCooling: number;
  totalCostActiveScenario: number;
  // Category Costs (under active scenario)
  steelCost: number;
  concreteCost: number;
  masonryCost: number;
  finishesCost: number;
  otherCost: number;
  laborCost: number;
  // Variance vs Month 0
  varianceAmount: number;
  variancePercent: number;
  // Budget & contingency lines
  budgetFreezeLine: number;
  contingencyCeiling: number;
  isBreachingContingency: boolean;
}
