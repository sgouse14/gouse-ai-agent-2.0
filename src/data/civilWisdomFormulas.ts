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
  category:
    | 'Civil & Structural'
    | 'Finishes & Architectural'
    | 'Substructure'
    | 'Services & Trades'
    | 'Concrete & Steel Estimation'
    | 'GBA & Building Regulations';
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
    | 'plumbing'
    | 'slab'
    | 'ratio'
    | 'building'
    | 'voids'
    | 'rule';
  defaultRate: number; // In INR
  rateUnit: string;
  applicableNormId?: string; // Links to MATERIAL_TAKEOFF_NORMS
  normPerSqFtEquivalent?: number;
  isRegulatory?: boolean; // When true, represents a building bye-law / compliance threshold rather than a material purchase
  referenceGuideSection?: '1. CONCRETE & STEEL ESTIMATION' | '2. GBA & BUILDING REGULATIONS';
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
  // Extra parameters from Construction & Building Regulations Reference Guide
  slabThicknessM?: number; // Default 0.125 m (approx 5 inches standard residential roof slab)
  buildingHeightM?: number; // Building total height in metres (High-Rise threshold check)
  clearFloorHeightM?: number; // Clear floor-to-floor height in metres (3.5m - 4.5m range)
  plotAreaSqFt?: number; // Plot Area in Sq.Ft for OC exemption check
  buildingFloorsLabel?: string; // e.g. "G+2" or "Stilt+3"
  basementSetbackM?: number; // Basement setback in metres (Min 2.0m)
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
  // =========================================================================
  // SECTION 1: CONCRETE & STEEL ESTIMATION (M20 RESIDENTIAL ROOF SLAB GUIDE)
  // Source: Construction & Building Regulations Reference Guide
  // =========================================================================
  {
    id: 'cw-slab-wet-vol',
    item: 'WET CONCRETE (M20 SLAB)',
    whatItIs: 'Wet Volume of Concrete (Length × Width × Thickness)',
    quickFormula: 'L × W × T → 11.61 m³ / 1,000 SQ.FT',
    formulaRule: 'Area (sq.ft) × 0.0929 m²/sq.ft × 0.125m thickness',
    unit: 'm³',
    category: 'Concrete & Steel Estimation',
    iconType: 'slab',
    defaultRate: 4600,
    rateUnit: 'per m³',
    applicableNormId: 'norm-rmc',
    referenceGuideSection: '1. CONCRETE & STEEL ESTIMATION',
    calculateQuantity: (p) => {
      const thickness = p.slabThicknessM ?? 0.125; // 0.125m (~5 inches) standard
      const areaM2 = p.areaSqFt * 0.092903;
      return Number((areaM2 * thickness).toFixed(2)); // 1,000 sq ft = 11.61 m³
    },
    calculateCost: (p, rate = 4600) => {
      const thickness = p.slabThicknessM ?? 0.125;
      const areaM2 = p.areaSqFt * 0.092903;
      const wetVol = areaM2 * thickness;
      return Math.round(wetVol * rate);
    },
    notes: 'For a 1,000 sq ft (≈ 92.9 m²) slab with 0.125 m thickness, the wet volume is exactly 11.61 m³. Formula: Length × Width × Thickness.',
  },
  {
    id: 'cw-slab-dry-vol',
    item: 'DRY MIX VOLUME (M20 SLAB)',
    whatItIs: 'Dry volume conversion (accounts for voids in aggregates)',
    quickFormula: 'WET VOL × 1.54 → 17.88 m³ / 1,000 SQ.FT',
    formulaRule: 'Wet Volume (m³) × 1.54 dry factor',
    unit: 'm³ dry mix',
    category: 'Concrete & Steel Estimation',
    iconType: 'concrete',
    defaultRate: 0,
    rateUnit: 'dry mix',
    referenceGuideSection: '1. CONCRETE & STEEL ESTIMATION',
    calculateQuantity: (p) => {
      const thickness = p.slabThicknessM ?? 0.125;
      const wetVol = (p.areaSqFt * 0.092903) * thickness;
      return Number((wetVol * 1.54).toFixed(2)); // 11.61 * 1.54 = 17.88 m³
    },
    calculateCost: () => 0,
    notes: 'Dry factor of 1.54 accounts for volume voids in dry coarse and fine aggregates. 11.61 m³ × 1.54 = 17.88 m³ of dry mix.',
  },
  {
    id: 'cw-slab-cement',
    item: 'M20 SLAB CEMENT',
    whatItIs: 'Cement in M20 Mix (Ratio 1:1.5:3 = 5.5 total parts)',
    quickFormula: '(1 / 5.5) × DRY VOL → 94 BAGS / 1,000 SQ.FT',
    formulaRule: '(1 / 5.5) × Dry Vol m³ = 3.25 m³ → 94 bags (50kg each)',
    unit: 'Bags (50kg)',
    category: 'Concrete & Steel Estimation',
    iconType: 'cement',
    defaultRate: 385,
    rateUnit: 'per bag',
    applicableNormId: 'norm-cement',
    referenceGuideSection: '1. CONCRETE & STEEL ESTIMATION',
    calculateQuantity: (p) => {
      const thickness = p.slabThicknessM ?? 0.125;
      const wetVol = (p.areaSqFt * 0.092903) * thickness;
      const dryVol = wetVol * 1.54;
      const cementM3 = (1 / 5.5) * dryVol;
      // 1 m³ cement = ~1440 kg. Bags = cementM3 * 1440 / 50 -> 3.25 * 28.8 = 93.6 ≈ 94 bags
      return Math.round((cementM3 * 1440) / 50);
    },
    calculateCost: (p, rate = 385) => {
      const thickness = p.slabThicknessM ?? 0.125;
      const wetVol = (p.areaSqFt * 0.092903) * thickness;
      const dryVol = wetVol * 1.54;
      const cementM3 = (1 / 5.5) * dryVol;
      const bags = Math.round((cementM3 * 1440) / 50);
      return Math.round(bags * rate);
    },
    notes: 'Cement: (1 / 5.5) × 17.88 m³ = 3.25 m³ → 94 bags (50 kg each) for 1,000 sq ft roof slab.',
  },
  {
    id: 'cw-slab-sand',
    item: 'M20 SLAB SAND (FINE AGGREGATE)',
    whatItIs: 'Sand in M20 Mix (Ratio 1:1.5:3 = 5.5 total parts)',
    quickFormula: '(1.5 / 5.5) × DRY VOL → 172 CFT / 1,000 SQ.FT',
    formulaRule: '(1.5 / 5.5) × Dry Vol m³ = 4.87 m³ (≈ 172 CFT)',
    unit: 'CFT',
    category: 'Concrete & Steel Estimation',
    iconType: 'sand',
    defaultRate: 55,
    rateUnit: 'per CFT',
    applicableNormId: 'norm-sand',
    referenceGuideSection: '1. CONCRETE & STEEL ESTIMATION',
    calculateQuantity: (p) => {
      const thickness = p.slabThicknessM ?? 0.125;
      const wetVol = (p.areaSqFt * 0.092903) * thickness;
      const dryVol = wetVol * 1.54;
      const sandM3 = (1.5 / 5.5) * dryVol; // 4.87 m³
      return Math.round(sandM3 * 35.3147); // 4.876 * 35.3147 ≈ 172 CFT
    },
    calculateCost: (p, rate = 55) => {
      const thickness = p.slabThicknessM ?? 0.125;
      const wetVol = (p.areaSqFt * 0.092903) * thickness;
      const dryVol = wetVol * 1.54;
      const sandM3 = (1.5 / 5.5) * dryVol;
      const cft = Math.round(sandM3 * 35.3147);
      return Math.round(cft * rate);
    },
    notes: 'Sand (Fine Aggregate): (1.5 / 5.5) × 17.88 m³ = 4.87 m³ (≈ 172 cft) for 1,000 sq ft roof slab.',
  },
  {
    id: 'cw-slab-coarse-agg',
    item: 'M20 SLAB COARSE AGGREGATE',
    whatItIs: 'Stone / Jelly in M20 Mix (Ratio 1:1.5:3 = 5.5 parts)',
    quickFormula: '(3 / 5.5) × DRY VOL → 344 CFT / 1,000 SQ.FT',
    formulaRule: '(3 / 5.5) × Dry Vol m³ = 9.75 m³ (≈ 344 CFT)',
    unit: 'CFT',
    category: 'Concrete & Steel Estimation',
    iconType: 'aggregate',
    defaultRate: 45,
    rateUnit: 'per CFT',
    applicableNormId: 'norm-aggregates',
    referenceGuideSection: '1. CONCRETE & STEEL ESTIMATION',
    calculateQuantity: (p) => {
      const thickness = p.slabThicknessM ?? 0.125;
      const wetVol = (p.areaSqFt * 0.092903) * thickness;
      const dryVol = wetVol * 1.54;
      const coarseM3 = (3 / 5.5) * dryVol; // 9.75 m³
      return Math.round(coarseM3 * 35.3147); // 9.75 * 35.3147 ≈ 344 CFT
    },
    calculateCost: (p, rate = 45) => {
      const thickness = p.slabThicknessM ?? 0.125;
      const wetVol = (p.areaSqFt * 0.092903) * thickness;
      const dryVol = wetVol * 1.54;
      const coarseM3 = (3 / 5.5) * dryVol;
      const cft = Math.round(coarseM3 * 35.3147);
      return Math.round(cft * rate);
    },
    notes: 'Coarse Aggregate (Stone/Jelly): (3 / 5.5) × 17.88 m³ = 9.75 m³ (≈ 344 cft) for 1,000 sq ft roof slab.',
  },
  {
    id: 'cw-slab-steel',
    item: 'SLAB STEEL REINFORCEMENT',
    whatItIs: 'Standard slabs require ~1% steel by total concrete volume',
    quickFormula: '1% CONCRETE VOL → 0.9–1.05 T / 1,000 SQ.FT',
    formulaRule: 'Wet Volume × 1% × 7,850 kg/m³ (incl. lapping & 5% wastage)',
    unit: 'Tonnes (MT)',
    category: 'Concrete & Steel Estimation',
    iconType: 'steel',
    defaultRate: 65000,
    rateUnit: 'per MT',
    applicableNormId: 'norm-steel',
    referenceGuideSection: '1. CONCRETE & STEEL ESTIMATION',
    calculateQuantity: (p) => {
      const thickness = p.slabThicknessM ?? 0.125;
      const wetVol = (p.areaSqFt * 0.092903) * thickness;
      // 1% concrete volume: wetVol * 0.01 m³ steel
      // Density of steel = 7850 kg/m³
      // Base steel weight = wetVol * 0.01 * 7850 kg = wetVol * 78.5 kg
      // Including lapping & 5% wastage factor (approx +10% to 15%):
      // For 11.61 m³ -> 11.61 * 78.5 = 911.4 kg (0.91 MT base); with 10% lapping/wastage = 1.00 MT (range 0.90 to 1.05 MT)
      const tonnes = (wetVol * 78.5 * 1.10) / 1000;
      return Number(tonnes.toFixed(2));
    },
    calculateCost: (p, rate = 65000) => {
      const thickness = p.slabThicknessM ?? 0.125;
      const wetVol = (p.areaSqFt * 0.092903) * thickness;
      const tonnes = (wetVol * 78.5 * 1.10) / 1000;
      return Math.round(tonnes * rate);
    },
    notes: 'Standard slabs require about 1% steel by total concrete volume. For 11.61 m³ of concrete, this equals roughly 0.9 to 1.05 tonnes of steel bars, including lapping and 5% wastage.',
  },

  // =========================================================================
  // SECTION 2: GBA & BUILDING REGULATIONS REFERENCE GUIDE
  // Source: Construction & Building Regulations Reference Guide
  // =========================================================================
  {
    id: 'cw-gba-high-rise',
    item: 'HIGH-RISE DEFINITION (GBA)',
    whatItIs: 'Minimum building height threshold classification',
    quickFormula: 'HEIGHT ≥ 21 METRES (REVISED FROM 15M)',
    formulaRule: 'Minimum height threshold revised from 15m to 21m',
    unit: 'Threshold (21m)',
    category: 'GBA & Building Regulations',
    iconType: 'building',
    defaultRate: 0,
    rateUnit: 'bye-law rule',
    isRegulatory: true,
    referenceGuideSection: '2. GBA & BUILDING REGULATIONS',
    calculateQuantity: (p) => p.buildingHeightM ?? 21,
    calculateCost: () => 0,
    notes: 'The minimum height threshold to classify a structure as a high-rise building has been revised from 15 metres to 21 metres.',
  },
  {
    id: 'cw-gba-voids-setbacks',
    item: 'VOIDS & BASEMENT SETBACKS',
    whatItIs: 'Permissible void area & basement clearance rule',
    quickFormula: 'VOIDS ≤ 10% GBA | BASEMENT SETBACK ≥ 2.0M',
    formulaRule: 'Total permissible void area ≤ 10% of GBA; Basement setback ≥ 2.0m',
    unit: 'Max Sq.Ft Cap',
    category: 'GBA & Building Regulations',
    iconType: 'voids',
    defaultRate: 0,
    rateUnit: 'bye-law rule',
    isRegulatory: true,
    referenceGuideSection: '2. GBA & BUILDING REGULATIONS',
    calculateQuantity: (p) => Math.round(p.areaSqFt * 0.10), // Max permissible void area
    calculateCost: () => 0,
    notes: 'Total permissible void area is capped at 10% of the gross built-up area, and basements require a mandatory minimum setback of 2.0 metres.',
  },
  {
    id: 'cw-gba-floor-height',
    item: 'FLOOR-TO-FLOOR HEIGHT',
    whatItIs: 'Permissible clear floor-to-floor height range',
    quickFormula: 'MIN 3.5M TO MAX 4.5M PER FLOOR',
    formulaRule: 'Permissible clear floor-to-floor height between 3.5m and 4.5m',
    unit: 'Clear Height (m)',
    category: 'GBA & Building Regulations',
    iconType: 'rule',
    defaultRate: 0,
    rateUnit: 'bye-law rule',
    isRegulatory: true,
    referenceGuideSection: '2. GBA & BUILDING REGULATIONS',
    calculateQuantity: (p) => p.clearFloorHeightM ?? 3.5,
    calculateCost: () => 0,
    notes: 'Permissible clear floor-to-floor height ranges from a minimum of 3.5 metres to a maximum of 4.5 metres per floor.',
  },
  {
    id: 'cw-gba-oc-exemption',
    item: 'OC EXEMPTIONS (SMALL PLOTS)',
    whatItIs: 'Occupancy certificate exemption criteria',
    quickFormula: 'PLOT ≤ 1,200 SQ.FT & (G+2 OR STILT+3)',
    formulaRule: 'Small residential plots up to 1,200 sq ft (G+2 or Stilt+3) exempt from OC',
    unit: 'Exemption Rule',
    category: 'GBA & Building Regulations',
    iconType: 'rule',
    defaultRate: 0,
    rateUnit: 'bye-law rule',
    isRegulatory: true,
    referenceGuideSection: '2. GBA & BUILDING REGULATIONS',
    calculateQuantity: (p) => p.plotAreaSqFt ?? 1200,
    calculateCost: () => 0,
    notes: 'Small residential plots (up to 1,200 sq ft with up to Ground + 2 or Stilt + 3 floors) maintain occupancy certificate exemptions if built strictly per approved plans.',
  },
];

/**
 * Helper to compute roof slab estimation according to Reference Guide
 * Standard Residential Roof Slab: M20 Grade Concrete (1 : 1.5 : 3 Mix Ratio)
 */
export function calculateRoofSlabEstimation(areaSqFt: number, slabThicknessM: number = 0.125) {
  const slabAreaM2 = Number((areaSqFt * 0.092903).toFixed(2));
  const wetVolumeM3 = Number((slabAreaM2 * slabThicknessM).toFixed(2));
  const dryVolumeM3 = Number((wetVolumeM3 * 1.54).toFixed(2));
  
  // 1:1.5:3 = 5.5 parts
  const cementM3 = Number(((1 / 5.5) * dryVolumeM3).toFixed(2));
  const cementBags = Math.round((cementM3 * 1440) / 50);
  
  const sandM3 = Number(((1.5 / 5.5) * dryVolumeM3).toFixed(2));
  const sandCFT = Math.round(sandM3 * 35.3147);
  
  const coarseAggM3 = Number(((3 / 5.5) * dryVolumeM3).toFixed(2));
  const coarseAggCFT = Math.round(coarseAggM3 * 35.3147);
  
  // 1% of concrete volume (wet) + 5% to 10% wastage/lapping
  const baseSteelKg = wetVolumeM3 * 0.01 * 7850;
  const steelTonnesMin = Number(((baseSteelKg * 1.0) / 1000).toFixed(2)); // ~0.90 T per 11.61 m³
  const steelTonnesMax = Number(((baseSteelKg * 1.15) / 1000).toFixed(2)); // ~1.05 T per 11.61 m³
  const steelTonnesAvg = Number(((baseSteelKg * 1.10) / 1000).toFixed(2)); // ~1.00 T per 11.61 m³

  return {
    areaSqFt,
    slabAreaM2,
    slabThicknessM,
    wetVolumeM3,
    dryVolumeM3,
    cementM3,
    cementBags,
    sandM3,
    sandCFT,
    coarseAggM3,
    coarseAggCFT,
    steelTonnesMin,
    steelTonnesMax,
    steelTonnesAvg,
  };
}

/**
 * GBA and Building Regulations Reference Guidelines
 */
export const GBA_BUILDING_REGULATIONS = {
  highRiseDefinition: {
    title: 'High-Rise Definition',
    rule: 'The minimum height threshold to classify a structure as a high-rise building has been revised from 15 metres to 21 metres.',
    revisedThresholdM: 21,
    previousThresholdM: 15,
  },
  voidsAndSetbacks: {
    title: 'Voids and Setbacks',
    rule: 'Total permissible void area is capped at 10% of the gross built-up area, and basements require a mandatory minimum setback of 2.0 metres.',
    maxVoidPercentage: 10,
    minBasementSetbackM: 2.0,
  },
  floorToFloorHeight: {
    title: 'Floor-to-Floor Height',
    rule: 'Permissible clear floor-to-floor height ranges from a minimum of 3.5 metres to a maximum of 4.5 metres per floor.',
    minHeightM: 3.5,
    maxHeightM: 4.5,
  },
  ocExemptions: {
    title: 'OC Exemptions',
    rule: 'Small residential plots (up to 1,200 sq ft with up to Ground + 2 or Stilt + 3 floors) maintain occupancy certificate exemptions if built strictly per approved plans.',
    maxPlotAreaSqFt: 1200,
    permissibleFloors: 'Ground + 2 or Stilt + 3 floors',
  },
};

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
