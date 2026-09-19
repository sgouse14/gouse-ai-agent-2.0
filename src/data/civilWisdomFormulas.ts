/**
 * Construction Quick Estimation Formulas & Standard Material Matrix
 * Source: Civil Wisdom - Fast • Simple • Practical
 * 
 * Provides empirical preliminary planning formulas for residential & commercial construction:
 * 1.  CEMENT:      AREA × 0.4 BAGS (Binder used in mortar & concrete)
 * 2.  STEEL:       AREA × 4 KG (Reinforcement for RCC works)
 * 3.  BRICKS:      AREA × 8 (For masonry walls & partitions)
 * 4.  SAND:        AREA × 1.8 CFT (Fine aggregate for mortar & plaster)
 * 5.  AGGREGATE:   AREA × 1.5 CFT (Coarse aggregate for concrete)
 * 6.  CONCRETE:    BAGS ÷ 8 (Ready mix concrete quantity in m³)
 * 7.  WATER:       BAGS × 25 L (Water required for concrete)
 * 8.  PAINT:       WALL AREA ÷ 140 (Wall painting quantity in Litres)
 * 9.  TILES:       AREA ÷ TILE AREA (+10%) (Tile quantity with extra)
 * 10. EXCAVATION:  L × B × D (Earthwork volume in CFT / m³)
 * 11. PCC:         L × B × T (Plain cement concrete volume)
 * 12. LABOUR:      AREA × RATE (Labour cost estimation)
 * 13. ELECTRICAL:  AREA × RATE (Electrical work estimation)
 * 14. PLUMBING:    AREA × RATE (Plumbing work estimation)
 */

export interface CivilWisdomFormulaItem {
  id: string;
  item: string;
  whatItIs: string;
  quickFormula: string;
  formulaRule: string;
  unit: string;
  category: 'Civil & Structural' | 'Finishes & Architectural' | 'Substructure' | 'Services & Trades';
  iconType:
    | 'cement'
    | 'steel'
    | 'bricks'
    | 'sand'
    | 'aggregate'
    | 'concrete'
    | 'water'
    | 'paint'
    | 'tiles'
    | 'excavation'
    | 'pcc'
    | 'labour'
    | 'electrical'
    | 'plumbing';
  defaultRate: number; // In INR
  rateUnit: string;
  applicableNormId?: string; // Links to MATERIAL_TAKEOFF_NORMS
  normPerSqFtEquivalent?: number;
  calculateQuantity: (params: CivilWisdomCalculationParams) => number;
  calculateCost: (params: CivilWisdomCalculationParams, rate?: number) => number;
  notes: string;
}

export interface CivilWisdomCalculationParams {
  areaSqFt: number; // Built-up Area in Sq.Ft
  wallAreaSqFt?: number; // Total wall surface area (defaults to areaSqFt * 3.0)
  excavationLengthFt?: number; // L in feet
  excavationBreadthFt?: number; // B in feet
  excavationDepthFt?: number; // D in feet
  pccLengthFt?: number; // L in feet
  pccBreadthFt?: number; // B in feet
  pccThicknessFt?: number; // T in feet (e.g. 4" = 0.333 ft)
  tileLengthFt?: number; // e.g. 2 ft
  tileBreadthFt?: number; // e.g. 2 ft (4 sq.ft tile)
  labourRatePerSqFt?: number;
  electricalRatePerSqFt?: number;
  plumbingRatePerSqFt?: number;
}

export const CIVIL_WISDOM_FORMULAS: CivilWisdomFormulaItem[] = [
  {
    id: 'cw-cement',
    item: 'CEMENT',
    whatItIs: 'Binder used in mortar & concrete',
    quickFormula: 'AREA × 0.4 BAGS',
    formulaRule: 'Area (sq.ft) × 0.4',
    unit: 'Bags (50kg)',
    category: 'Civil & Structural',
    iconType: 'cement',
    defaultRate: 385,
    rateUnit: 'per bag',
    applicableNormId: 'norm-cement',
    normPerSqFtEquivalent: 0.40,
    calculateQuantity: (p) => Math.round(p.areaSqFt * 0.4),
    calculateCost: (p, rate = 385) => Math.round(p.areaSqFt * 0.4 * rate),
    notes: 'Covers RCC elements (footings, columns, beams, slabs), masonry bonding mortar, and internal/external plastering.',
  },
  {
    id: 'cw-steel',
    item: 'STEEL',
    whatItIs: 'Reinforcement for RCC works',
    quickFormula: 'AREA × 4 KG',
    formulaRule: 'Area (sq.ft) × 4.0 kg (or Area × 0.004 MT)',
    unit: 'Kg',
    category: 'Civil & Structural',
    iconType: 'steel',
    defaultRate: 65,
    rateUnit: 'per kg',
    applicableNormId: 'norm-steel',
    normPerSqFtEquivalent: 0.004, // 4 kg/sq.ft = 0.004 MT
    calculateQuantity: (p) => Math.round(p.areaSqFt * 4.0),
    calculateCost: (p, rate = 65) => Math.round(p.areaSqFt * 4.0 * rate),
    notes: 'Structural TMT Fe550D rebar across foundation footings, plinth tie beams, columns, roof beams, and floor slabs.',
  },
  {
    id: 'cw-bricks',
    item: 'BRICKS',
    whatItIs: 'For masonry walls & partitions',
    quickFormula: 'AREA × 8',
    formulaRule: 'Area (sq.ft) × 8 pieces',
    unit: 'Pieces',
    category: 'Civil & Structural',
    iconType: 'bricks',
    defaultRate: 38,
    rateUnit: 'per piece',
    applicableNormId: 'norm-clay-bricks',
    normPerSqFtEquivalent: 0.008, // 8 bricks / sq.ft (or CCB blocks equivalent)
    calculateQuantity: (p) => Math.round(p.areaSqFt * 8),
    calculateCost: (p, rate = 38) => Math.round(p.areaSqFt * 8 * rate),
    notes: 'Standard modular bricks or 6"/4" solid/cellular concrete blocks for external boundary, main load walls, and interior partitions.',
  },
  {
    id: 'cw-sand',
    item: 'SAND',
    whatItIs: 'Fine aggregate for mortar & plaster',
    quickFormula: 'AREA × 1.8 CFT',
    formulaRule: 'Area (sq.ft) × 1.8 CFT',
    unit: 'CFT',
    category: 'Civil & Structural',
    iconType: 'sand',
    defaultRate: 55,
    rateUnit: 'per CFT',
    applicableNormId: 'norm-sand',
    normPerSqFtEquivalent: 0.090, // 1.8 CFT = ~0.090 Tonne
    calculateQuantity: (p) => Math.round(p.areaSqFt * 1.8),
    calculateCost: (p, rate = 55) => Math.round(p.areaSqFt * 1.8 * rate),
    notes: 'Double washed manufactured sand (M-Sand) and plastering sand (P-Sand) for concrete mix and 1:4 / 1:6 mortar.',
  },
  {
    id: 'cw-aggregate',
    item: 'AGGREGATE',
    whatItIs: 'Coarse aggregate for concrete',
    quickFormula: 'AREA × 1.5 CFT',
    formulaRule: 'Area (sq.ft) × 1.5 CFT',
    unit: 'CFT',
    category: 'Civil & Structural',
    iconType: 'aggregate',
    defaultRate: 45,
    rateUnit: 'per CFT',
    applicableNormId: 'norm-aggregates',
    normPerSqFtEquivalent: 0.075, // 1.5 CFT = ~0.075 Tonne
    calculateQuantity: (p) => Math.round(p.areaSqFt * 1.5),
    calculateCost: (p, rate = 45) => Math.round(p.areaSqFt * 1.5 * rate),
    notes: 'Angular crushed blue metal granite (20mm & 10mm graded coarse aggregate) for structural concrete compaction.',
  },
  {
    id: 'cw-concrete',
    item: 'CONCRETE',
    whatItIs: 'Ready mix concrete quantity',
    quickFormula: 'BAGS ÷ 8',
    formulaRule: 'Total Cement Bags ÷ 8',
    unit: 'm³',
    category: 'Civil & Structural',
    iconType: 'concrete',
    defaultRate: 4600,
    rateUnit: 'per m³',
    applicableNormId: 'norm-rmc',
    normPerSqFtEquivalent: 0.050, // (0.4 / 8) = 0.050 m3 / sq.ft
    calculateQuantity: (p) => {
      const cementBags = p.areaSqFt * 0.4;
      return Number((cementBags / 8).toFixed(1));
    },
    calculateCost: (p, rate = 4600) => {
      const cementBags = p.areaSqFt * 0.4;
      return Math.round((cementBags / 8) * rate);
    },
    notes: 'Empirical ready mix concrete batching volume derived from total cement bag consumption (approx 8 bags per 1 m³ of M20/M25 design mix).',
  },
  {
    id: 'cw-water',
    item: 'WATER',
    whatItIs: 'Water required for concrete',
    quickFormula: 'BAGS × 25 L',
    formulaRule: 'Total Cement Bags × 25 Litres',
    unit: 'Litres',
    category: 'Civil & Structural',
    iconType: 'water',
    defaultRate: 0.15,
    rateUnit: 'per Litre',
    calculateQuantity: (p) => {
      const cementBags = p.areaSqFt * 0.4;
      return Math.round(cementBags * 25);
    },
    calculateCost: (p, rate = 0.15) => {
      const cementBags = p.areaSqFt * 0.4;
      return Math.round(cementBags * 25 * rate);
    },
    notes: 'Water-cement ratio (approx 0.45 – 0.50) equals 22.5 to 25 Litres of potable curing and batching water per 50kg bag.',
  },
  {
    id: 'cw-paint',
    item: 'PAINT',
    whatItIs: 'Wall painting quantity',
    quickFormula: 'WALL AREA ÷ 140',
    formulaRule: 'Wall Area (sq.ft) ÷ 140',
    unit: 'Litres',
    category: 'Finishes & Architectural',
    iconType: 'paint',
    defaultRate: 360,
    rateUnit: 'per Litre',
    applicableNormId: 'norm-interior-paint',
    calculateQuantity: (p) => {
      const wallArea = p.wallAreaSqFt ?? p.areaSqFt * 3.0; // Rule of thumb: wall surface ~ 3x built-up area
      return Math.round(wallArea / 140);
    },
    calculateCost: (p, rate = 360) => {
      const wallArea = p.wallAreaSqFt ?? p.areaSqFt * 3.0;
      return Math.round((wallArea / 140) * rate);
    },
    notes: 'Covers 2 coats of emulsion paint over primed and putty-prepared masonry walls (1 Litre covers ~140 sq.ft for double coat).',
  },
  {
    id: 'cw-tiles',
    item: 'TILES',
    whatItIs: 'Tile quantity (with extra)',
    quickFormula: 'AREA ÷ TILE AREA (+10%)',
    formulaRule: '(Area ÷ Tile Area) × 1.10',
    unit: 'Tiles (nos)',
    category: 'Finishes & Architectural',
    iconType: 'tiles',
    defaultRate: 85,
    rateUnit: 'per sq.ft',
    applicableNormId: 'norm-vitrified-tiles',
    calculateQuantity: (p) => {
      const tL = p.tileLengthFt ?? 2.0;
      const tB = p.tileBreadthFt ?? 2.0;
      const tileArea = Math.max(0.5, tL * tB);
      const rawCount = p.areaSqFt / tileArea;
      return Math.round(rawCount * 1.10); // +10% cut & breakage allowance
    },
    calculateCost: (p, rate = 85) => {
      // Area in sq.ft with 10% wastage * rate
      return Math.round(p.areaSqFt * 1.10 * rate);
    },
    notes: 'Floor vitrified tile calculation with 10% allowance for perimeter edge cutting, door reveals, and corner mitering.',
  },
  {
    id: 'cw-excavation',
    item: 'EXCAVATION',
    whatItIs: 'Earthwork volume',
    quickFormula: 'L × B × D',
    formulaRule: 'Length (ft) × Breadth (ft) × Depth (ft)',
    unit: 'CFT',
    category: 'Substructure',
    iconType: 'excavation',
    defaultRate: 14,
    rateUnit: 'per CFT',
    calculateQuantity: (p) => {
      const l = p.excavationLengthFt ?? Math.round(Math.sqrt(p.areaSqFt) * 1.1);
      const b = p.excavationBreadthFt ?? Math.round(Math.sqrt(p.areaSqFt) * 0.9);
      const d = p.excavationDepthFt ?? 5.0; // 5ft depth standard
      return Math.round(l * b * d);
    },
    calculateCost: (p, rate = 14) => {
      const l = p.excavationLengthFt ?? Math.round(Math.sqrt(p.areaSqFt) * 1.1);
      const b = p.excavationBreadthFt ?? Math.round(Math.sqrt(p.areaSqFt) * 0.9);
      const d = p.excavationDepthFt ?? 5.0;
      return Math.round(l * b * d * rate);
    },
    notes: 'Foundation pit, column trench, and basement earthwork excavation measured in cubic volume (L × B × D).',
  },
  {
    id: 'cw-pcc',
    item: 'PCC',
    whatItIs: 'Plain cement concrete',
    quickFormula: 'L × B × T',
    formulaRule: 'Length (ft) × Breadth (ft) × Thickness (ft)',
    unit: 'CFT',
    category: 'Substructure',
    iconType: 'pcc',
    defaultRate: 165,
    rateUnit: 'per CFT',
    calculateQuantity: (p) => {
      const l = p.pccLengthFt ?? Math.round(Math.sqrt(p.areaSqFt) * 1.1);
      const b = p.pccBreadthFt ?? Math.round(Math.sqrt(p.areaSqFt) * 0.9);
      const t = p.pccThicknessFt ?? 0.333; // 4 inches = 0.333 ft
      return Math.round(l * b * t);
    },
    calculateCost: (p, rate = 165) => {
      const l = p.pccLengthFt ?? Math.round(Math.sqrt(p.areaSqFt) * 1.1);
      const b = p.pccBreadthFt ?? Math.round(Math.sqrt(p.areaSqFt) * 0.9);
      const t = p.pccThicknessFt ?? 0.333;
      return Math.round(l * b * t * rate);
    },
    notes: 'Plain Cement Concrete (1:4:8 or 1:3:6) levelling bed below footings, plinth beams, and ground floor soling.',
  },
  {
    id: 'cw-labour',
    item: 'LABOUR',
    whatItIs: 'Labour cost estimation',
    quickFormula: 'AREA × RATE',
    formulaRule: 'Area (sq.ft) × Labour Rate (₹/sq.ft)',
    unit: 'Sq.Ft Contract',
    category: 'Services & Trades',
    iconType: 'labour',
    defaultRate: 320,
    rateUnit: 'per sq.ft',
    calculateQuantity: (p) => p.areaSqFt,
    calculateCost: (p, rate = 320) => {
      const actualRate = p.labourRatePerSqFt ?? rate;
      return Math.round(p.areaSqFt * actualRate);
    },
    notes: 'Comprehensive turn-key labour contract covering shuttering, bar bending, RCC casting, block masonry, and plastering.',
  },
  {
    id: 'cw-electrical',
    item: 'ELECTRICAL',
    whatItIs: 'Electrical work estimation',
    quickFormula: 'AREA × RATE',
    formulaRule: 'Area (sq.ft) × Electrical Rate (₹/sq.ft)',
    unit: 'Sq.Ft Contract',
    category: 'Services & Trades',
    iconType: 'electrical',
    defaultRate: 85,
    rateUnit: 'per sq.ft',
    calculateQuantity: (p) => p.areaSqFt,
    calculateCost: (p, rate = 85) => {
      const actualRate = p.electricalRatePerSqFt ?? rate;
      return Math.round(p.areaSqFt * actualRate);
    },
    notes: 'Concealed PVC conduit pipes, copper wiring (Finolex/Polycab), MCBs, distribution box, modular plates, and earthing.',
  },
  {
    id: 'cw-plumbing',
    item: 'PLUMBING',
    whatItIs: 'Plumbing work estimation',
    quickFormula: 'AREA × RATE',
    formulaRule: 'Area (sq.ft) × Plumbing Rate (₹/sq.ft)',
    unit: 'Sq.Ft Contract',
    category: 'Services & Trades',
    iconType: 'plumbing',
    defaultRate: 75,
    rateUnit: 'per sq.ft',
    calculateQuantity: (p) => p.areaSqFt,
    calculateCost: (p, rate = 75) => {
      const actualRate = p.plumbingRatePerSqFt ?? rate;
      return Math.round(p.areaSqFt * actualRate);
    },
    notes: 'Internal CPVC water supply lines, SWR drainage/sewage pipes, rainwater harvesting, overhead tank piping, and CP fittings fixing.',
  },
];

/**
 * Returns Civil Wisdom material standard overrides for materialTakeoffEngine
 */
export function getCivilWisdomMaterialOverrides(): Record<string, { normPerSqFt: number; standardWastagePercent?: number }> {
  return {
    'norm-cement': { normPerSqFt: 0.40, standardWastagePercent: 3.0 },
    'norm-steel': { normPerSqFt: 0.0040, standardWastagePercent: 4.0 }, // 4.0 kg = 0.004 MT
    'norm-clay-bricks': { normPerSqFt: 0.008, standardWastagePercent: 5.0 }, // 8 bricks / sq.ft = 0.008 thousand nos
    'norm-sand': { normPerSqFt: 0.090, standardWastagePercent: 4.5 }, // 1.8 CFT = ~0.090 tonnes
    'norm-aggregates': { normPerSqFt: 0.075, standardWastagePercent: 4.0 }, // 1.5 CFT = ~0.075 tonnes
    'norm-rmc': { normPerSqFt: 0.050, standardWastagePercent: 2.0 }, // 0.4 bags / 8 = 0.05 m3
  };
}
