import { BOQItem, Project, BuildingFloor } from '../types';
import {
  MarketRegion,
  MarketQualityTier,
  MarketPricingBasis,
  MARKET_REGIONS,
  matchBOQItemToMarket,
  MARKET_BENCHMARK_CATALOG,
} from './marketPriceEngine';
import { DEFAULT_BUILDING_FLOORS, ensureItemFloorBreakdown } from './floorTakeoffEngine';
import {
  CONSTRUCTION_MATERIALS_MASTER_GUIDE,
  MaterialGuideBrand,
  MaterialGuideSection,
  getBrandSpotRate,
} from '../data/constructionMaterialsGuide';

export { DEFAULT_BUILDING_FLOORS, CONSTRUCTION_MATERIALS_MASTER_GUIDE };

export type MaterialFloorDistributionType =
  | 'foundation_only'
  | 'structural_frame'
  | 'masonry_walls'
  | 'floor_finishes'
  | 'granite_counter'
  | 'wall_finishes'
  | 'exterior_finishes'
  | 'metal_wood_enamel'
  | 'waterproofing_plinth_wet_terrace'
  | 'terrace_roof_waterproofing'
  | 'mep_services'
  | 'doors_carpentry'
  | 'ceiling_gypsum';

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
  floorDistributionType?: MaterialFloorDistributionType;
  applicableFloors?: string[];
  floorNotes?: string;
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
    brands: [
      'UltraTech Cement (OPC & PPC)',
      'Ambuja Cements (PPC & Cool Walls)',
      'ACC & Shree Cement (Suraksha, Bangur)',
      'Bharathi & Ramco (Ultra Fast OPC 53)',
    ],
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
    brands: [
      'Tata Tiscon (Tiscon 550D, Super)',
      'JSW Neosteel (Fe 500D, Fe 550D)',
      'SAIL & Jindal Panther (SAIL SEQR, Fe 550D)',
      'Sunvik & Kamdhenu (Sunvik Gold, Next)',
    ],
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
    brands: [
      'Kajaria & Somany (Vitrified & Ceramic)',
      'H&R Johnson & Orientbell (Germ-Free Anti-Slip)',
      'Naveen Tile - Aparna (South India Robust)',
    ],
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
    brands: [
      'Asian Paints & Berger (Emulsions & Textures)',
      'Kansai Nerolac & Dulux (Low-VOC Architectural)',
      'Indigo, Birla Opus & Shalimar (Decorative & Heritage)',
    ],
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
    brands: [
      'Asian Paints & Berger (Weather-Proof & Textures)',
      'Kansai Nerolac & Dulux (Protective Metal & Wall)',
      'Indigo, Birla Opus & Shalimar (Heritage Facade)',
    ],
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
    brands: [
      'Astral & Ashirvad (CPVC Hot/Cold)',
      'Supreme & Prince (PVC, CPVC & SWR Drainage)',
      'Sudhakar & Ajay Pipes (Lead-Free UPVC)',
    ],
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
    brands: [
      'Polycab & Havells (FRLS Copper)',
      'Finolex & RR Kabel (Triple-Layered Zero-Halogen)',
      'Goldmedal & Plaza (ISI Switchgear & Modular)',
    ],
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
    brands: [
      'Saint-Gobain & AIS (High-Performance Glass & DGU)',
      'Guardian & Gold Plus (Toughened Safety Glass)',
      'Sejal & FUSO Glass (Curved & Insulated Glazing)',
    ],
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
  {
    id: 'norm-wall-putty',
    name: 'White Cement-Based Polymer Wall Care Putty (Double Coat Skim)',
    trade: 'Architectural Finishes',
    category: 'Finishes & Surfaces',
    unit: '40kg bags',
    normPerSqFt: 0.003, // 3 bags (120kg) per 1,000 sq.ft built-up area (~0.12 kg/sq.ft)
    normDescription: '0.003 bags (40kg) per sq.ft (~0.12 kg/sq.ft) for two uniform leveling skim coats on interior & exterior plastered surfaces',
    standardWastagePercent: 5.0,
    baseRate: 920,
    economyMultiplier: 0.88,
    standardMultiplier: 1.0,
    premiumMultiplier: 1.15,
    luxuryMultiplier: 1.30,
    brands: ['Birla White Wall Care', 'JK WallMaxx', 'Asian Paints TruCare', 'UltraTech Seal & Dry'],
    isCodeRef: 'IS 15489 / CPWD DSR 13.80',
    stage: 'Finishes',
    boqCategoryMatch: 'Finishes',
    boqItemKeywords: ['putty', 'wall putty', 'skim coat', 'white cement putty', 'birla white', 'wall care'],
  },
  {
    id: 'norm-wall-primer',
    name: 'Deep-Penetrating Water-Thinnable Acrylic Wall Primer',
    trade: 'Architectural Finishes',
    category: 'Finishes & Surfaces',
    unit: 'liters',
    normPerSqFt: 0.032,
    normDescription: '0.032 liters / sq.ft (1 coat alkali-resistant base primer over cured plaster & sanded putty)',
    standardWastagePercent: 5.0,
    baseRate: 165,
    economyMultiplier: 0.85,
    standardMultiplier: 1.0,
    premiumMultiplier: 1.25,
    luxuryMultiplier: 1.50,
    brands: ['Asian Paints Decoprime', 'Berger BP White Primer', 'Dulux Aqua Primer', 'Nerolac Primer'],
    isCodeRef: 'IS 109 / CPWD DSR 13.79',
    stage: 'Finishes',
    boqCategoryMatch: 'Finishes',
    boqItemKeywords: ['primer', 'wall primer', 'acrylic primer', 'decoprime', 'base coat'],
  },
  {
    id: 'norm-enamel-paint',
    name: 'Synthetic High-Gloss Enamel Paint (MS Grills, Railings & Wood Joinery)',
    trade: 'Architectural Finishes',
    category: 'Finishes & Surfaces',
    unit: 'liters',
    normPerSqFt: 0.0085,
    normDescription: '0.0085 liters / sq.ft for MS safety window grills, balcony balustrades, staircase railings & door frames (2 coats over zinc-chromate red oxide primer)',
    standardWastagePercent: 6.0,
    baseRate: 340,
    economyMultiplier: 0.85,
    standardMultiplier: 1.0,
    premiumMultiplier: 1.28,
    luxuryMultiplier: 1.65,
    brands: [
      'Asian Paints & Berger (Apcolite & Luxol)',
      'Kansai Nerolac & Dulux (Protective Metal Coatings)',
      'Indigo, Birla Opus & Shalimar (Synthetic Enamel)',
    ],
    isCodeRef: 'IS 2932 / CPWD DSR 13.61',
    stage: 'Finishes',
    boqCategoryMatch: 'Finishes',
    boqItemKeywords: ['enamel', 'synthetic enamel', 'grill paint', 'metal paint', 'wood paint', 'gloss enamel', 'apcolite'],
  },
  {
    id: 'norm-dampproof-coating',
    name: 'Elastomeric Liquid Waterproofing & Anti-Damp Membrane Coating',
    trade: 'Waterproofing & Protection',
    category: 'Waterproofing',
    unit: 'liters',
    normPerSqFt: 0.016,
    normDescription: '0.016 liters / sq.ft for parapet copings, exterior chajjas, terrace floor-wall coves & toilet sunken vertical dado coats',
    standardWastagePercent: 4.0,
    baseRate: 430,
    economyMultiplier: 0.85,
    standardMultiplier: 1.0,
    premiumMultiplier: 1.25,
    luxuryMultiplier: 1.55,
    brands: ['Asian Paints SmartCare Damp Proof', 'Dr. Fixit Newcoat ERS', 'Fosroc Brushbond', 'SikaTop Seal'],
    isCodeRef: 'ASTM C836 / IS 15801',
    stage: 'Finishes',
    boqCategoryMatch: 'Waterproofing',
    boqItemKeywords: ['damp proof', 'dampproof', 'waterproof paint', 'liquid membrane', 'smartcare', 'dr fixit', 'newcoat'],
  },
  {
    id: 'norm-granite-counter',
    name: 'Pre-Polished Jet Black Granite Slabs (18-20mm Kitchen Counter & Window Sills)',
    trade: 'Stone & Masonry Finishes',
    category: 'Finishes & Surfaces',
    unit: 'sq.ft',
    normPerSqFt: 0.085,
    normDescription: '0.085 sq.ft per sq.ft built-up area for kitchen counters, utility platforms, bathroom vanity counters & full-window perimeter sill splayed bands',
    standardWastagePercent: 7.0,
    baseRate: 185,
    economyMultiplier: 0.82,
    standardMultiplier: 1.0,
    premiumMultiplier: 1.45,
    luxuryMultiplier: 2.25,
    brands: ['South Indian Gangsaw Jet Black', 'Chamrajnagar Black', 'Telephone Black'],
    isCodeRef: 'IS 3316 / IS 1130',
    stage: 'Finishes',
    boqCategoryMatch: 'Finishes',
    boqItemKeywords: ['granite', 'black granite', 'kitchen counter', 'window sill', 'granite slab'],
  },
  {
    id: 'norm-false-ceiling',
    name: 'Gypsum Board Suspended False Ceiling System (12.5mm + GI Framework)',
    trade: 'Interior Architectural Finishes',
    category: 'Finishes & Surfaces',
    unit: 'sq.ft',
    normPerSqFt: 0.65,
    normDescription: '0.65 sq.ft false ceiling per sq.ft built-up area (covers living, dining, master suites and recessed cove lighting troughs)',
    standardWastagePercent: 6.0,
    baseRate: 115,
    economyMultiplier: 0.82,
    standardMultiplier: 1.0,
    premiumMultiplier: 1.40,
    luxuryMultiplier: 2.10,
    brands: ['Saint-Gobain Gyproc', 'USG Boral Sheetrock', 'Armstrong World Industries'],
    isCodeRef: 'IS 2095 / CPWD DSR 12.45',
    stage: 'Finishes',
    boqCategoryMatch: 'Finishes',
    boqItemKeywords: ['false ceiling', 'gypsum', 'gyproc', 'ceiling', 'pop ceiling'],
  },
  {
    id: 'norm-tile-grout-adhesive',
    name: 'Polymer-Modified Tile Adhesive & Epoxy Waterproof Grout',
    trade: 'Architectural Finishes',
    category: 'Finishes & Surfaces',
    unit: 'kg',
    normPerSqFt: 0.28,
    normDescription: '0.28 kg per sq.ft built-up area (covers high-strength bed polymer adhesive & 3mm stain-resistant epoxy tile joint filling)',
    standardWastagePercent: 5.0,
    baseRate: 45,
    economyMultiplier: 0.85,
    standardMultiplier: 1.0,
    premiumMultiplier: 1.30,
    luxuryMultiplier: 1.70,
    brands: ['Roff New Construction Tile Adhesive', 'Laticrete 252/SpectraLOCK', 'MYK Laticrete', 'Fosroc Nitotile'],
    isCodeRef: 'IS 15477:2019 Type 2',
    stage: 'Finishes',
    boqCategoryMatch: 'Finishes',
    boqItemKeywords: ['tile adhesive', 'tile grout', 'epoxy grout', 'roff', 'laticrete'],
  },
];

export const NORM_FLOOR_METADATA: Record<
  string,
  {
    floorDistributionType: MaterialFloorDistributionType;
    applicableFloors: string[];
    floorNotes: string;
  }
> = {
  'norm-earthwork': {
    floorDistributionType: 'foundation_only',
    applicableFloors: ['Substructure'],
    floorNotes: '100% foundation trenching, pile cap excavation, and soil removal beneath plinth level.',
  },
  'norm-cement': {
    floorDistributionType: 'structural_frame',
    applicableFloors: ['Substructure', 'Ground Floor', 'First Floor', 'Second Floor', 'Terrace & Roof'],
    floorNotes: 'Concentrated in foundation footings (25%), ground floor columns/slab (32%), first floor (22%), second floor (16%), and terrace parapets (5%).',
  },
  'norm-steel': {
    floorDistributionType: 'structural_frame',
    applicableFloors: ['Substructure', 'Ground Floor', 'First Floor', 'Second Floor', 'Terrace & Roof'],
    floorNotes: 'Heavy rebar cages for foundation rafts, ground floor loadbearing columns, and cantilever balcony beams.',
  },
  'norm-rmc': {
    floorDistributionType: 'structural_frame',
    applicableFloors: ['Substructure', 'Ground Floor', 'First Floor', 'Second Floor', 'Terrace & Roof'],
    floorNotes: 'Pumped M25/M30 ready-mix concrete for foundation grade beams, column bents, and monolithic floor slabs.',
  },
  'norm-sand': {
    floorDistributionType: 'structural_frame',
    applicableFloors: ['Substructure', 'Ground Floor', 'First Floor', 'Second Floor', 'Terrace & Roof'],
    floorNotes: 'Zone II M-Sand for concrete structural batching and masonry mortar across all structural levels.',
  },
  'norm-aggregates': {
    floorDistributionType: 'structural_frame',
    applicableFloors: ['Substructure', 'Ground Floor', 'First Floor', 'Second Floor', 'Terrace & Roof'],
    floorNotes: '20mm & 10mm crushed blue granite aggregates for RCC columns, plinth beams, and upper floor slabs.',
  },
  'norm-aac-blocks': {
    floorDistributionType: 'masonry_walls',
    applicableFloors: ['Ground Floor', 'First Floor', 'Second Floor', 'Terrace & Roof'],
    floorNotes: 'High thermal lightweight blocks minimizing seismic dead loads on ground, first, and second floor framed slabs.',
  },
  'norm-clay-bricks': {
    floorDistributionType: 'masonry_walls',
    applicableFloors: ['Ground Floor', 'First Floor', 'Second Floor', 'Terrace & Roof'],
    floorNotes: 'High compressive traditional bricks for external perimeter, ground floor facade panels, and rooftop parapet walls.',
  },
  'norm-vitrified-tiles': {
    floorDistributionType: 'floor_finishes',
    applicableFloors: ['Ground Floor', 'First Floor', 'Second Floor'],
    floorNotes: 'Double-charged 1200x600mm vitrified tiles for ground foyer/dining, first floor living suites, and second floor bedrooms.',
  },
  'norm-interior-paint': {
    floorDistributionType: 'wall_finishes',
    applicableFloors: ['Ground Floor', 'First Floor', 'Second Floor'],
    floorNotes: 'Interior luxury acrylic emulsion applied across ground floor living, first floor bedrooms, and upper family lounge.',
  },
  'norm-exterior-paint': {
    floorDistributionType: 'exterior_finishes',
    applicableFloors: ['Ground Floor', 'First Floor', 'Second Floor', 'Terrace & Roof'],
    floorNotes: 'Elastomeric weather-shield coating protecting building elevations, balcony soffits, and rooftop parapets.',
  },
  'norm-wall-putty': {
    floorDistributionType: 'wall_finishes',
    applicableFloors: ['Ground Floor', 'First Floor', 'Second Floor', 'Terrace & Roof'],
    floorNotes: 'White cement polymer skim coat leveling interior walls across ground floor, first floor, second floor, and terrace stairhead.',
  },
  'norm-wall-primer': {
    floorDistributionType: 'wall_finishes',
    applicableFloors: ['Ground Floor', 'First Floor', 'Second Floor', 'Terrace & Roof'],
    floorNotes: 'Water-based alkali-resistant acrylic primer sealing plastered masonry across all habitable levels before painting.',
  },
  'norm-enamel-paint': {
    floorDistributionType: 'metal_wood_enamel',
    applicableFloors: ['Ground Floor', 'First Floor', 'Second Floor', 'Terrace & Roof'],
    floorNotes: 'High-gloss synthetic enamel for ground entrance gate, first-floor balcony balustrades, and terrace parapet railings.',
  },
  'norm-dampproof-coating': {
    floorDistributionType: 'waterproofing_plinth_wet_terrace',
    applicableFloors: ['Substructure', 'Ground Floor', 'First Floor', 'Second Floor', 'Terrace & Roof'],
    floorNotes: 'Flexible elastomeric liquid membrane for subterranean plinth beam damp-proofing, sunken toilet dados, and roof slab junctions.',
  },
  'norm-waterproofing': {
    floorDistributionType: 'terrace_roof_waterproofing',
    applicableFloors: ['Substructure', 'Terrace & Roof'],
    floorNotes: 'Dual-layer torch-on APP bitumen membrane for basement subterranean tanking (30%) and exposed flat roof terrace deck (70%).',
  },
  'norm-granite-counter': {
    floorDistributionType: 'granite_counter',
    applicableFloors: ['Ground Floor', 'First Floor'],
    floorNotes: 'Pre-polished 20mm Jet Black granite slabs for ground floor main kitchen counter & utility, and first-floor pantry counter.',
  },
  'norm-false-ceiling': {
    floorDistributionType: 'ceiling_gypsum',
    applicableFloors: ['Ground Floor', 'First Floor', 'Second Floor'],
    floorNotes: 'Designer gypsum false ceiling with concealed LED cove lighting for ground living/dining (50%), first-floor master suite (35%), and upper lounge (15%).',
  },
  'norm-plumbing-pipes': {
    floorDistributionType: 'mep_services',
    applicableFloors: ['Substructure', 'Ground Floor', 'First Floor', 'Second Floor', 'Terrace & Roof'],
    floorNotes: 'CPVC hot/cold pressure water piping connecting basement sump pumps, ground kitchen/utility, upper floor bathrooms, and terrace overhead tank manifold.',
  },
  'norm-electrical-wiring': {
    floorDistributionType: 'mep_services',
    applicableFloors: ['Substructure', 'Ground Floor', 'First Floor', 'Second Floor', 'Terrace & Roof'],
    floorNotes: 'FRLS multi-strand copper wiring distributed from ground main distribution board to all level branch circuits and terrace equipment.',
  },
  'norm-windows-dgu': {
    floorDistributionType: 'doors_carpentry',
    applicableFloors: ['Ground Floor', 'First Floor', 'Second Floor'],
    floorNotes: 'Acoustic thermally-broken aluminum sliding windows with Low-E DGU glass for ground and upper-floor daylight openings.',
  },
  'norm-doors-hardware': {
    floorDistributionType: 'doors_carpentry',
    applicableFloors: ['Ground Floor', 'First Floor', 'Second Floor'],
    floorNotes: 'Teakwood entrance doors, laminated flush internal bedroom doors, and SS mortise locksets across living levels.',
  },
  'norm-tile-grout-adhesive': {
    floorDistributionType: 'floor_finishes',
    applicableFloors: ['Ground Floor', 'First Floor', 'Second Floor'],
    floorNotes: 'Polymer tile bed adhesive and epoxy waterproof grout for vitrified flooring, bathroom dado, and kitchen backsplashes.',
  },
};

// Enrich MATERIAL_TAKEOFF_NORMS with floor metadata
MATERIAL_TAKEOFF_NORMS.forEach((norm) => {
  const meta = NORM_FLOOR_METADATA[norm.id];
  if (meta) {
    norm.floorDistributionType = meta.floorDistributionType;
    norm.applicableFloors = meta.applicableFloors;
    norm.floorNotes = meta.floorNotes;
  }
});

/**
 * Proportionally scales building floors to match a project's target built-up area
 */
export function getScaledBuildingFloors(
  targetAreaSqFt: number,
  baseFloors: BuildingFloor[] = DEFAULT_BUILDING_FLOORS
): BuildingFloor[] {
  const validArea = Math.max(10, Math.round(targetAreaSqFt || 3000));
  const currentTotal = baseFloors.reduce((sum, f) => sum + (f.areaSqFt || 0), 0);
  if (currentTotal <= 0) return baseFloors;

  const scale = validArea / currentTotal;
  let runningArea = 0;

  return baseFloors.map((f, idx) => {
    if (idx === baseFloors.length - 1) {
      const lastArea = Math.max(50, Math.round(validArea - runningArea));
      return { ...f, areaSqFt: lastArea };
    }
    const scaledArea = Math.max(50, Math.round(f.areaSqFt * scale));
    runningArea += scaledArea;
    return { ...f, areaSqFt: scaledArea };
  });
}

/**
 * Calculates floor-wise percentage distribution weights for a material takeoff norm
 * Dynamically factors in each floor level's actual slab area (f.areaSqFt) and engineering affinity coefficient
 */
export function getMaterialNormFloorFractions(
  norm: MaterialTakeoffNorm,
  floors: BuildingFloor[]
): Record<string, number> {
  const result: Record<string, number> = {};
  if (!floors || floors.length === 0) return result;

  const weights: Record<string, number> = {};

  floors.forEach((f) => {
    const isSub =
      f.levelIndex < 0 ||
      f.id.includes('sub') ||
      f.name.toLowerCase().includes('foundation') ||
      f.name.toLowerCase().includes('substructure');
    const isGround =
      f.levelIndex === 0 || f.id.includes('ground') || f.name.toLowerCase().includes('ground');
    const isTerrace =
      f.levelIndex >= 3 ||
      f.id.includes('terrace') ||
      f.id.includes('roof') ||
      f.name.toLowerCase().includes('terrace') ||
      f.name.toLowerCase().includes('roof');
    const isFirst =
      f.levelIndex === 1 || f.id.includes('first') || f.name.toLowerCase().includes('first');
    const isSecond =
      f.levelIndex === 2 || f.id.includes('second') || f.name.toLowerCase().includes('second');

    const distType = norm.floorDistributionType || 'structural_frame';
    const floorArea = Math.max(0, f.areaSqFt || 0);

    // Architectural distribution coefficient per floor category
    let coeff = 0.1;
    switch (distType) {
      case 'foundation_only':
        coeff = isSub ? 1.0 : 0.0;
        break;
      case 'structural_frame':
        // Substructure (footings/pedestals/plinth) ~1.15x, Ground ~1.10x, Upper ~1.00x, Terrace ~0.65x
        if (isSub) coeff = 1.15;
        else if (isGround) coeff = 1.10;
        else if (isFirst) coeff = 1.0;
        else if (isSecond) coeff = 0.95;
        else if (isTerrace) coeff = 0.65;
        else coeff = 1.0;
        break;
      case 'masonry_walls':
        // Masonry walls exist on occupied levels; 0 in substructure; low on terrace (parapet only)
        if (isSub) coeff = 0.0;
        else if (isGround) coeff = 1.05;
        else if (isFirst) coeff = 1.0;
        else if (isSecond) coeff = 0.95;
        else if (isTerrace) coeff = 0.18; // Parapet wall ~1.0m height
        else coeff = 1.0;
        break;
      case 'floor_finishes':
        // Flooring tiles, granite, skirting: zero in substructure, full on GF/FF/SF
        if (isSub) coeff = 0.0;
        else if (isGround) coeff = 1.05;
        else if (isFirst) coeff = 1.0;
        else if (isSecond) coeff = 0.95;
        else if (isTerrace) coeff = 0.05;
        else coeff = 1.0;
        break;
      case 'granite_counter':
        // Kitchen / utility counters
        if (isSub) coeff = 0.0;
        else if (isGround) coeff = 1.0;
        else if (isFirst) coeff = 0.45;
        else if (isSecond) coeff = 0.1;
        else if (isTerrace) coeff = 0.0;
        else coeff = 0.2;
        break;
      case 'wall_finishes':
        // Plaster, putty, primer, interior emulsion
        if (isSub) coeff = 0.0;
        else if (isGround) coeff = 1.05;
        else if (isFirst) coeff = 1.0;
        else if (isSecond) coeff = 0.95;
        else if (isTerrace) coeff = 0.15;
        else coeff = 1.0;
        break;
      case 'exterior_finishes':
        // Exterior weather-coat paint / cladding
        if (isSub) coeff = 0.0;
        else if (isGround) coeff = 0.9;
        else if (isFirst) coeff = 1.0;
        else if (isSecond) coeff = 1.0;
        else if (isTerrace) coeff = 0.8;
        else coeff = 1.0;
        break;
      case 'metal_wood_enamel':
        // Railings, grills, doors
        if (isSub) coeff = 0.0;
        else if (isGround) coeff = 1.0;
        else if (isFirst) coeff = 1.0;
        else if (isSecond) coeff = 0.85;
        else if (isTerrace) coeff = 0.4;
        else coeff = 0.8;
        break;
      case 'waterproofing_plinth_wet_terrace':
        // Plinth, wet toilets, balconies, terrace
        if (isSub) coeff = 0.8;
        else if (isGround) coeff = 0.5;
        else if (isFirst) coeff = 0.5;
        else if (isSecond) coeff = 0.5;
        else if (isTerrace) coeff = 1.2;
        else coeff = 0.5;
        break;
      case 'terrace_roof_waterproofing':
        // Integral elastomeric membrane: terrace & roof dominant
        if (isSub) coeff = 0.25;
        else if (isTerrace) coeff = 1.0;
        else coeff = 0.0;
        break;
      case 'mep_services':
        // Electrical conduits, wiring, plumbing
        if (isSub) coeff = 0.15;
        else if (isGround) coeff = 1.1;
        else if (isFirst) coeff = 1.0;
        else if (isSecond) coeff = 0.9;
        else if (isTerrace) coeff = 0.2;
        else coeff = 1.0;
        break;
      case 'doors_carpentry':
        if (isSub) coeff = 0.0;
        else if (isGround) coeff = 1.1;
        else if (isFirst) coeff = 1.0;
        else if (isSecond) coeff = 0.9;
        else if (isTerrace) coeff = 0.1;
        else coeff = 0.8;
        break;
      case 'ceiling_gypsum':
        if (isSub) coeff = 0.0;
        else if (isGround) coeff = 1.1;
        else if (isFirst) coeff = 1.0;
        else if (isSecond) coeff = 0.8;
        else if (isTerrace) coeff = 0.0;
        else coeff = 0.8;
        break;
      default:
        coeff = 1.0;
    }

    // Weight is the product of floor slab area and the engineering affinity coefficient
    weights[f.id] = floorArea * coeff;
  });

  const sumWeights = Object.values(weights).reduce((a, b) => a + b, 0);
  floors.forEach((f) => {
    result[f.id] = sumWeights > 0 ? (weights[f.id] || 0) / sumWeights : 1 / floors.length;
  });

  return result;
}

/**
 * Updates a specific floor's slab area in a building floors array
 */
export function updateFloorArea(
  floors: BuildingFloor[],
  floorId: string,
  newAreaSqFt: number
): BuildingFloor[] {
  const valid = Math.max(0, Math.round(newAreaSqFt));
  return floors.map((f) => (f.id === floorId ? { ...f, areaSqFt: valid } : f));
}

/**
 * Distributes a target built-up area across floors according to standard architectural presets
 */
export function applyFloorAreaDistributionPreset(
  floors: BuildingFloor[],
  targetTotalArea: number,
  presetType: 'equal' | 'g_plus_1' | 'g_plus_2' | 'stilt_plus_floors'
): BuildingFloor[] {
  const count = floors.length;
  if (count === 0) return floors;
  const validArea = Math.max(100, Math.round(targetTotalArea));

  if (presetType === 'equal') {
    const perFloor = Math.round(validArea / count);
    let running = 0;
    return floors.map((f, idx) => {
      if (idx === count - 1) {
        return { ...f, areaSqFt: Math.max(50, validArea - running) };
      }
      running += perFloor;
      return { ...f, areaSqFt: perFloor };
    });
  }

  if (presetType === 'g_plus_1') {
    // Typical duplex/villa: Substructure: 20%, Ground: 45%, First: 30%, Terrace: 5%
    const weights = [0.20, 0.45, 0.30, 0.05];
    let running = 0;
    return floors.map((f, idx) => {
      const w = idx < weights.length ? weights[idx] : 1 / count;
      const area = Math.max(50, Math.round(validArea * w));
      if (idx === count - 1) {
        return { ...f, areaSqFt: Math.max(50, validArea - running) };
      }
      running += area;
      return { ...f, areaSqFt: area };
    });
  }

  if (presetType === 'g_plus_2') {
    // Multi-level residence: Sub: 18%, GF: 34%, FF: 26%, SF: 18%, Terrace: 4%
    const weights = [0.18, 0.34, 0.26, 0.18, 0.04];
    let running = 0;
    return floors.map((f, idx) => {
      const w = idx < weights.length ? weights[idx] : 1 / count;
      const area = Math.max(50, Math.round(validArea * w));
      if (idx === count - 1) {
        return { ...f, areaSqFt: Math.max(50, validArea - running) };
      }
      running += area;
      return { ...f, areaSqFt: area };
    });
  }

  if (presetType === 'stilt_plus_floors') {
    // Stilt parking + typical upper apartments: Sub/Stilt: 30%, Upper floors equal, Terrace: 5%
    const weights = [0.15, 0.30, 0.25, 0.25, 0.05];
    let running = 0;
    return floors.map((f, idx) => {
      const w = idx < weights.length ? weights[idx] : 1 / count;
      const area = Math.max(50, Math.round(validArea * w));
      if (idx === count - 1) {
        return { ...f, areaSqFt: Math.max(50, validArea - running) };
      }
      running += area;
      return { ...f, areaSqFt: area };
    });
  }

  return floors;
}

/**
 * Individual floor breakdown for a single material item
 */
export interface MaterialFloorBreakdownItem {
  floorId: string;
  floorName: string;
  shortCode: string;
  levelIndex: number;
  fraction: number;
  rawQuantity: number;
  roundedQuantity: number;
  cost: number;
  costPerSqFt: number;
}

/**
 * Floor-wise aggregated cost, area and volumes for the entire building level
 */
export interface MaterialTakeoffFloorTotal {
  floorId: string;
  floorName: string;
  shortCode: string;
  levelIndex: number;
  elevation: string;
  areaSqFt: number;
  subtotal: number;
  costPerSqFt: number;
  percentOfTotal: number;
  itemCount: number;
  keyVolumes: {
    cementBags: number;
    steelMetricTonnes: number;
    sandTonnes: number;
    concreteM3: number;
    blocksM3: number;
    tilesSqFt: number;
    paintLiters: number;
    puttyBags: number;
    enamelLiters: number;
    waterproofingLiters: number;
  };
}

/**
 * Custom override for material standard parameters
 */
export interface MaterialNormOverride {
  normPerSqFt?: number;
  standardWastagePercent?: number;
  baseRate?: number;
  selectedBrand?: string;
  selectedBrandCategory?: 'National' | 'Regional';
  spotPrice?: number;
}

/**
 * Calculated Material Takeoff Item with dynamic quantity derived from area, live market price, and floor-wise distribution
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
  floorBreakdown: Record<string, MaterialFloorBreakdownItem>;
  isCustomized?: boolean;
  effectiveNormPerSqFt: number;
  effectiveWastagePercent: number;
  effectiveBaseRate: number;
  selectedBrand?: string;
  selectedBrandCategory?: 'National' | 'Regional';
  selectedBrandSpotPrice?: number;
  selectedBrandSpotUnit?: string;
  selectedBrandSpotTrend?: 'up' | 'down' | 'stable';
  selectedBrandSpotChangePercent?: number;
}

/**
 * Material Takeoff Summary Report with building-wide roll-up and level-by-level floor-wise schedule
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
  floors: BuildingFloor[];
  floorTotals: MaterialTakeoffFloorTotal[];
  keyMaterialVolumes: {
    cementBags: number;
    steelMetricTonnes: number;
    sandTonnes: number;
    concreteM3: number;
    blocksM3: number;
    tilesSqFt: number;
    paintLiters: number;
    puttyBags?: number;
    enamelLiters?: number;
    waterproofingLiters?: number;
  };
}

/**
 * Calculates ALL material quantities based on built-up area, prevailing live market prices, and floor-wise distribution
 */
export function calculateMaterialTakeoffFromArea(
  areaSqFt: number,
  regionId: MarketRegion = 'bangalore',
  tier: MarketQualityTier = 'Standard',
  pricingBasis: MarketPricingBasis = 'spot_market',
  customFloors?: BuildingFloor[],
  normOverrides?: Record<string, MaterialNormOverride>
): MaterialTakeoffReport {
  let floors: BuildingFloor[];
  let validArea: number;

  if (customFloors && customFloors.length > 0) {
    floors = customFloors;
    const floorsSum = floors.reduce((sum, f) => sum + (Number(f.areaSqFt) || 0), 0);
    validArea = floorsSum > 0 ? floorsSum : Math.max(10, Math.round(areaSqFt || 3000));
  } else {
    validArea = Math.max(10, Math.round(areaSqFt || 3000));
    floors = getScaledBuildingFloors(validArea, DEFAULT_BUILDING_FLOORS);
  }

  const region = MARKET_REGIONS.find((r) => r.id === regionId) || MARKET_REGIONS[0];

  // Pricing basis multiplier (Procurement bulk -5%, Retail cash +8%, Spot baseline 1.0)
  const basisFactor =
    pricingBasis === 'procurement_bulk' ? 0.95 : pricingBasis === 'retail_cash' ? 1.08 : 1.0;

  // Step 1: Compute individual material quantities and live market rates
  let totalCost = 0;
  const items: CalculatedMaterialTakeoffItem[] = MATERIAL_TAKEOFF_NORMS.map((norm) => {
    const override = normOverrides?.[norm.id];
    const isCustomized =
      !!override &&
      (override.normPerSqFt !== undefined ||
        override.standardWastagePercent !== undefined ||
        override.baseRate !== undefined);

    const selectedBrand = override?.selectedBrand || norm.brands?.[0];
    const spotInfo = getBrandSpotRate(selectedBrand);

    const effectiveNormPerSqFt =
      override?.normPerSqFt !== undefined && override.normPerSqFt >= 0
        ? override.normPerSqFt
        : norm.normPerSqFt;
    const effectiveWastagePercent =
      override?.standardWastagePercent !== undefined && override.standardWastagePercent >= 0
        ? override.standardWastagePercent
        : norm.standardWastagePercent;
    
    // If override explicitly provides a baseRate, use it; else if spotPrice is provided, use it; else fallback to norm baseRate
    const effectiveBaseRate =
      override?.baseRate !== undefined && override.baseRate > 0
        ? override.baseRate
        : override?.spotPrice !== undefined && override.spotPrice > 0
        ? override.spotPrice
        : norm.baseRate;

    // Quantity calculation: Area * Norm * (1 + Wastage%)
    const rawQuantity = validArea * effectiveNormPerSqFt;
    const quantityWithWastage = rawQuantity * (1 + effectiveWastagePercent / 100);

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
    const marketRate = Math.round(effectiveBaseRate * regionalFactor * tierMultiplier * basisFactor);
    const itemTotalCost = Math.round(roundedQuantity * marketRate);
    totalCost += itemTotalCost;

    // Floor-wise distribution calculation
    const normFractions = getMaterialNormFloorFractions(norm, floors);
    const floorBreakdown: Record<string, MaterialFloorBreakdownItem> = {};

    floors.forEach((f) => {
      const fraction = normFractions[f.id] ?? 0;
      const fRawQty = rawQuantity * fraction;
      const fQtyWithWastage = quantityWithWastage * fraction;
      let fRoundedQty = Math.round(fQtyWithWastage);
      if (norm.unit === 'MT (Metric Tonne)' || norm.unit === 'm3') {
        fRoundedQty = Math.round(fQtyWithWastage * 100) / 100;
      } else if (norm.unit === 'tonne' || norm.unit === 'sq.m' || norm.unit === '90m coils') {
        fRoundedQty = Math.round(fQtyWithWastage * 10) / 10;
      } else if (norm.unit === 'door sets') {
        fRoundedQty = Math.round(fQtyWithWastage);
      }
      const fCost = Math.round(fRoundedQty * marketRate);
      const fCostPerSqFt = f.areaSqFt > 0 ? Math.round((fCost / f.areaSqFt) * 10) / 10 : 0;

      floorBreakdown[f.id] = {
        floorId: f.id,
        floorName: f.name,
        shortCode: f.shortCode,
        levelIndex: f.levelIndex,
        fraction,
        rawQuantity: fRawQty,
        roundedQuantity: fRoundedQty,
        cost: fCost,
        costPerSqFt: fCostPerSqFt,
      };
    });

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
      floorBreakdown,
      isCustomized,
      effectiveNormPerSqFt,
      effectiveWastagePercent,
      effectiveBaseRate,
      selectedBrand,
      selectedBrandCategory: override?.selectedBrandCategory || spotInfo?.category || 'National',
      selectedBrandSpotPrice: spotInfo?.spotPrice,
      selectedBrandSpotUnit: spotInfo?.unit,
      selectedBrandSpotTrend: spotInfo?.trend,
      selectedBrandSpotChangePercent: spotInfo?.changePercent,
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

  // Step 3: Compute aggregated floor totals
  const floorTotals: MaterialTakeoffFloorTotal[] = floors.map((f) => {
    let subtotal = 0;
    let itemCount = 0;

    let cementBags = 0;
    let steelMetricTonnes = 0;
    let sandTonnes = 0;
    let concreteM3 = 0;
    let blocksM3 = 0;
    let tilesSqFt = 0;
    let paintLiters = 0;
    let puttyBags = 0;
    let enamelLiters = 0;
    let waterproofingLiters = 0;

    items.forEach((it) => {
      const bd = it.floorBreakdown[f.id];
      if (bd) {
        subtotal += bd.cost;
        if (bd.roundedQuantity > 0) itemCount++;

        if (it.norm.id === 'norm-cement') cementBags += bd.roundedQuantity;
        else if (it.norm.id === 'norm-steel') steelMetricTonnes += bd.roundedQuantity;
        else if (it.norm.id === 'norm-sand') sandTonnes += bd.roundedQuantity;
        else if (it.norm.id === 'norm-rmc') concreteM3 += bd.roundedQuantity;
        else if (it.norm.id === 'norm-aac-blocks' || it.norm.id === 'norm-clay-bricks')
          blocksM3 += bd.roundedQuantity;
        else if (it.norm.id === 'norm-vitrified-tiles') tilesSqFt += bd.roundedQuantity;
        else if (
          it.norm.id === 'norm-interior-paint' ||
          it.norm.id === 'norm-exterior-paint' ||
          it.norm.id === 'norm-wall-primer'
        )
          paintLiters += bd.roundedQuantity;
        else if (it.norm.id === 'norm-wall-putty') puttyBags += bd.roundedQuantity;
        else if (it.norm.id === 'norm-enamel-paint') enamelLiters += bd.roundedQuantity;
        else if (it.norm.id === 'norm-waterproofing' || it.norm.id === 'norm-dampproof-coating')
          waterproofingLiters += bd.roundedQuantity;
      }
    });

    const costPerSqFt = f.areaSqFt > 0 ? Math.round(subtotal / f.areaSqFt) : 0;
    const percentOfTotal =
      totalCost > 0 ? Math.round(((subtotal / totalCost) * 100) * 10) / 10 : 0;

    return {
      floorId: f.id,
      floorName: f.name,
      shortCode: f.shortCode,
      levelIndex: f.levelIndex,
      elevation: f.elevation || `Level ${f.levelIndex}`,
      areaSqFt: f.areaSqFt,
      subtotal,
      costPerSqFt,
      percentOfTotal,
      itemCount,
      keyVolumes: {
        cementBags,
        steelMetricTonnes: Math.round(steelMetricTonnes * 100) / 100,
        sandTonnes: Math.round(sandTonnes * 10) / 10,
        concreteM3: Math.round(concreteM3 * 10) / 10,
        blocksM3: Math.round(blocksM3 * 10) / 10,
        tilesSqFt: Math.round(tilesSqFt),
        paintLiters: Math.round(paintLiters),
        puttyBags: Math.round(puttyBags),
        enamelLiters: Math.round(enamelLiters),
        waterproofingLiters: Math.round(waterproofingLiters),
      },
    };
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
  const puttyItem = items.find((i) => i.norm.id === 'norm-wall-putty');
  const primerItem = items.find((i) => i.norm.id === 'norm-wall-primer');
  const enamelItem = items.find((i) => i.norm.id === 'norm-enamel-paint');

  const keyMaterialVolumes = {
    cementBags: cementItem ? cementItem.roundedQuantity : Math.round(validArea * 0.42),
    steelMetricTonnes: steelItem ? steelItem.roundedQuantity : Math.round(validArea * 0.0038 * 100) / 100,
    sandTonnes: sandItem ? sandItem.roundedQuantity : Math.round(validArea * 0.082),
    concreteM3: rmcItem ? rmcItem.roundedQuantity : Math.round(validArea * 0.035 * 10) / 10,
    blocksM3: blocksItem ? blocksItem.roundedQuantity : Math.round(validArea * 0.028 * 10) / 10,
    tilesSqFt: tilesItem ? tilesItem.roundedQuantity : Math.round(validArea * 1.22),
    paintLiters: Math.round(
      (intPaintItem?.roundedQuantity || validArea * 0.045) +
        (extPaintItem?.roundedQuantity || validArea * 0.022) +
        (primerItem?.roundedQuantity || 0) +
        (enamelItem?.roundedQuantity || 0)
    ),
    puttyBags: puttyItem ? puttyItem.roundedQuantity : Math.round(validArea * 0.003 * 1.05),
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
    floors,
    floorTotals,
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
    floors?: BuildingFloor[];
  } = {}
): BOQAreaMarketUpdateResult {
  const {
    regionId = 'bangalore',
    tier = 'Standard',
    pricingBasis = 'spot_market',
    updateQuantitiesWithArea = true,
    updateRatesWithMarketPrice = true,
    selectedItemIds,
    floors,
  } = options;

  const validNewArea = Math.max(10, Math.round(newAreaSqFt));
  const validPrevArea = Math.max(10, Math.round(previousAreaSqFt || 3000));
  const areaScaleFactor = validNewArea / validPrevArea;

  const region = MARKET_REGIONS.find((r) => r.id === regionId) || MARKET_REGIONS[0];
  const finalFloors = floors && floors.length > 0 ? floors : DEFAULT_BUILDING_FLOORS;

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

    const updatedBaseItem: BOQItem = {
      ...item,
      quantity: newQty,
      rate: newRate,
      amount: newAmt,
      materialComponent: benchmark?.materialComponent ?? item.materialComponent,
      laborComponent: benchmark?.laborComponent ?? item.laborComponent,
      equipmentComponent: benchmark?.equipmentComponent ?? item.equipmentComponent,
      overheadComponent: benchmark?.overheadComponent ?? item.overheadComponent,
    };

    return ensureItemFloorBreakdown(updatedBaseItem, finalFloors);
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
