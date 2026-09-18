/**
 * Construction Materials Master Guide
 * Comprehensive Directory: Cement, Steel, Electricals, Plumbing, Tiles, Glass & Glazing, and Paints
 * National and Regional Brands, Products, Variants and Engineering Standards.
 */

export interface MaterialGuideBrand {
  id: string;
  category: 'National' | 'Regional';
  brandName: string;
  keyVariantsAndDescription: string;
  recommendedUse?: string;
  isCodeRef?: string;
  spotPrice: number;
  unit: string;
  minPrice: number;
  maxPrice: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  trendReason?: string;
  marketHub?: string;
}

export interface MaterialGuideSection {
  id: string;
  sectionNumber: number;
  title: string;
  shortTitle: string;
  category: string;
  applicableNormIds: string[];
  description: string;
  isCodeStandards: string[];
  brands: MaterialGuideBrand[];
}

export const CONSTRUCTION_MATERIALS_MASTER_GUIDE: MaterialGuideSection[] = [
  {
    id: 'guide-cement',
    sectionNumber: 1,
    title: '1. Cement Brands & Products',
    shortTitle: 'Cement',
    category: 'Cement & Concrete',
    applicableNormIds: ['norm-cement', 'norm-rmc'],
    description: 'Structural binders and composite cements conforming to IS 269 (OPC), IS 1489 (PPC), and IS 456.',
    isCodeStandards: ['IS 269:2015 (OPC 53)', 'IS 1489 Part 1 (PPC Fly Ash)', 'IS 456:2000 (Plain & RCC)'],
    brands: [
      {
        id: 'cem-ultratech',
        category: 'National',
        brandName: 'UltraTech Cement',
        keyVariantsAndDescription: "OPC & PPC variants; India's market leader for structural integrity.",
        recommendedUse: 'High-strength structural RCC, heavy columns, transfer slabs and mass concreting.',
        isCodeRef: 'IS 269 / IS 1489',
        spotPrice: 395,
        unit: '50 kg bag',
        minPrice: 375,
        maxPrice: 420,
        changePercent: 1.8,
        trend: 'up',
        trendReason: 'Clinker production freight revisions and peak pre-monsoon casting activity',
        marketHub: 'Pan-India Distribution',
      },
      {
        id: 'cem-ambuja',
        category: 'National',
        brandName: 'Ambuja Cements',
        keyVariantsAndDescription: 'PPC & Cool Walls; high durability and moisture resistance.',
        recommendedUse: 'Foundation footings, retaining walls, external plaster, and damp-prone coastal environments.',
        isCodeRef: 'IS 1489 / IS 456',
        spotPrice: 380,
        unit: '50 kg bag',
        minPrice: 360,
        maxPrice: 405,
        changePercent: 0.8,
        trend: 'stable',
        trendReason: 'Consistent dispatch volumes across Western and Northern grinding plants',
        marketHub: 'West & North Hubs',
      },
      {
        id: 'cem-acc-shree',
        category: 'National',
        brandName: 'ACC & Shree Cement',
        keyVariantsAndDescription: 'Suraksha, Bangur Power; legacy strength & cost efficiency.',
        recommendedUse: 'Residential RCC frames, masonry mortars, floor screeds, and general construction.',
        isCodeRef: 'IS 269 / IS 1489',
        spotPrice: 365,
        unit: '50 kg bag',
        minPrice: 345,
        maxPrice: 390,
        changePercent: 0.0,
        trend: 'stable',
        trendReason: 'Competitive institutional batch discounts in urban metro clusters',
        marketHub: 'Central & Eastern Corridor',
      },
      {
        id: 'cem-bharathi-ramco',
        category: 'Regional',
        brandName: 'Bharathi & Ramco',
        keyVariantsAndDescription: 'Ultra Fast OPC 53, Super Grade; popular across South India.',
        recommendedUse: 'Rapid de-shuttering schedules, high early strength precast elements, and South Indian regional projects.',
        isCodeRef: 'IS 269 (OPC 53)',
        spotPrice: 345,
        unit: '50 kg bag',
        minPrice: 330,
        maxPrice: 370,
        changePercent: -1.4,
        trend: 'down',
        trendReason: 'Regional capacity expansion in Kadapa and Ariyalur limestone belts',
        marketHub: 'South India Regional Network',
      },
    ],
  },
  {
    id: 'guide-steel',
    sectionNumber: 2,
    title: '2. Steel (TMT Bars) Brands & Products',
    shortTitle: 'Steel (TMT)',
    category: 'Steel & Reinforcement',
    applicableNormIds: ['norm-steel'],
    description: 'Thermo-mechanically treated high-yield reinforcement bars conforming to IS 1786 and SP 34.',
    isCodeStandards: ['IS 1786:2008 (Fe 500D / Fe 550D)', 'SP 34 (Handbook on Concrete Reinforcement)'],
    brands: [
      {
        id: 'steel-tata-tiscon',
        category: 'National',
        brandName: 'Tata Tiscon',
        keyVariantsAndDescription: 'Tiscon 550D, Super; premier benchmark for ductility and safety.',
        recommendedUse: 'Critical structural frames, seismic resistance (Zone III/IV/V), and heavy infrastructure.',
        isCodeRef: 'IS 1786 Fe 550D',
        spotPrice: 76500,
        unit: 'MT (Metric Tonne)',
        minPrice: 74000,
        maxPrice: 79000,
        changePercent: 1.2,
        trend: 'up',
        trendReason: 'Raw iron ore pellet premiums and primary integrated mill brand pricing power',
        marketHub: 'National Benchmark (Ex-Stockyard)',
      },
      {
        id: 'steel-jsw-neosteel',
        category: 'National',
        brandName: 'JSW Neosteel',
        keyVariantsAndDescription: 'Fe 500D, Fe 550D; virgin iron ore, ideal for high-rises & seismic zones.',
        recommendedUse: 'Multi-story residential towers, commercial cores, and deep basement retention structures.',
        isCodeRef: 'IS 1786 Fe 500D/550D',
        spotPrice: 74500,
        unit: 'MT (Metric Tonne)',
        minPrice: 72000,
        maxPrice: 77000,
        changePercent: -0.8,
        trend: 'down',
        trendReason: 'Improved coking coal import parity easing primary blast furnace cost structures',
        marketHub: 'Vijayanagar & Dolvi Works',
      },
      {
        id: 'steel-sail-jindal',
        category: 'National',
        brandName: 'SAIL & Jindal Panther',
        keyVariantsAndDescription: 'SAIL SEQR, Fe 550D; public reliability & high tensile strength.',
        recommendedUse: 'Institutional campuses, heavy civil works, transfer girders, and export grade execution.',
        isCodeRef: 'IS 1786 Fe 550D',
        spotPrice: 73800,
        unit: 'MT (Metric Tonne)',
        minPrice: 71500,
        maxPrice: 76500,
        changePercent: -0.5,
        trend: 'stable',
        trendReason: 'Steady public sector and high-speed transit infrastructure bulk dispatches',
        marketHub: 'Central & Eastern Depots',
      },
      {
        id: 'steel-sunvik-kamdhenu',
        category: 'Regional',
        brandName: 'Sunvik & Kamdhenu',
        keyVariantsAndDescription: 'Sunvik Gold, Kamdhenu Next; strong local grid and flexibility.',
        recommendedUse: 'Cost-effective residential villas, boundary structures, secondary load paths, and regional retail grids.',
        isCodeRef: 'IS 1786 Fe 500D',
        spotPrice: 68500,
        unit: 'MT (Metric Tonne)',
        minPrice: 66000,
        maxPrice: 71000,
        changePercent: -1.5,
        trend: 'down',
        trendReason: 'Secondary induction furnace scrap steel inventory availability in regional hubs',
        marketHub: 'South & West Regional Yards',
      },
    ],
  },
  {
    id: 'guide-electricals',
    sectionNumber: 3,
    title: '3. Electrical Wires, Cables & Accessories',
    shortTitle: 'Electricals',
    category: 'Plumbing & MEP',
    applicableNormIds: ['norm-electrical-wiring'],
    description: 'Fire-retardant copper conductors, low-smoke conduits, and modular switchgear conforming to IS 694 and IS 732.',
    isCodeStandards: ['IS 694:2010 (PVC Insulated Cables)', 'IS 732 (Electrical Wiring Installations)', 'NBC 2016 Part 8'],
    brands: [
      {
        id: 'elec-polycab-havells',
        category: 'National',
        brandName: 'Polycab & Havells',
        keyVariantsAndDescription: 'Flame-retardant copper wires, low-smoke halogen-free cables.',
        recommendedUse: 'Main risers, apartment distribution boards, HVAC sub-mains, and fire-safe commercial corridors.',
        isCodeRef: 'IS 694 FRLS-H',
        spotPrice: 2950,
        unit: '90m coil (2.5 sq.mm)',
        minPrice: 2750,
        maxPrice: 3200,
        changePercent: 3.1,
        trend: 'up',
        trendReason: 'LME international refined copper cathode rally hitting multi-month highs',
        marketHub: 'National Electrical Distributors',
      },
      {
        id: 'elec-finolex-rrkabel',
        category: 'National',
        brandName: 'Finolex & RR Kabel',
        keyVariantsAndDescription: 'Triple-layered copper wiring and zero-halogen safety standards.',
        recommendedUse: 'Concealed conduit circuits, luxury residences, and green building certified developments.',
        isCodeRef: 'IS 694 / RoHS',
        spotPrice: 2850,
        unit: '90m coil (2.5 sq.mm)',
        minPrice: 2650,
        maxPrice: 3100,
        changePercent: 2.4,
        trend: 'up',
        trendReason: 'High demand for RoHS-compliant halogen-free electrical spec in urban apartments',
        marketHub: 'Pan-India MEP Wholesalers',
      },
      {
        id: 'elec-goldmedal-plaza',
        category: 'Regional',
        brandName: 'Goldmedal & Plaza',
        keyVariantsAndDescription: 'ISI-certified switchgear, modular plates, and local electrical wires.',
        recommendedUse: 'Modular electrical switchplates, distribution accessories, and localized retail installations.',
        isCodeRef: 'IS 3854 / IS 694',
        spotPrice: 2350,
        unit: '90m coil (2.5 sq.mm)',
        minPrice: 2150,
        maxPrice: 2550,
        changePercent: 0.0,
        trend: 'stable',
        trendReason: 'Competitive regional retail discounts and steady housing wiring demand',
        marketHub: 'Tier-2 & Regional Markets',
      },
    ],
  },
  {
    id: 'guide-plumbing',
    sectionNumber: 4,
    title: '4. Plumbing, CPVC, PVC & SWR Pipes',
    shortTitle: 'Plumbing & Pipes',
    category: 'Plumbing & MEP',
    applicableNormIds: ['norm-plumbing-pipes'],
    description: 'Concealed hot/cold potable water supply lines, drainage soil-waste-rainwater systems conforming to IS 15778 and IS 13592.',
    isCodeStandards: ['IS 15778 (CPVC for Potable Hot/Cold Water)', 'IS 13592 (UPVC Pipes for Soil & Waste)', 'ASTM D2846'],
    brands: [
      {
        id: 'plumb-astral-ashirvad',
        category: 'National',
        brandName: 'Astral & Ashirvad',
        keyVariantsAndDescription: 'Pioneering CPVC plumbing systems for hot and cold water lines.',
        recommendedUse: 'Pressurized water risers, solar hot water distribution, and concealed luxury bathroom plumbing.',
        isCodeRef: 'IS 15778 SDR 11 / SDR 13.5',
        spotPrice: 495,
        unit: '3m length (1" SDR 11)',
        minPrice: 460,
        maxPrice: 540,
        changePercent: 1.5,
        trend: 'up',
        trendReason: 'Imported chlorinated polyvinyl chloride polymer resin price adjustments',
        marketHub: 'Authorized Plumbing Hubs',
      },
      {
        id: 'plumb-supreme-prince',
        category: 'National',
        brandName: 'Supreme & Prince',
        keyVariantsAndDescription: 'Complete spectrum of PVC, CPVC, and SWR drainage piping systems.',
        recommendedUse: 'Rainwater harvesting stacks, underground sewage networks, and bathroom sunken drainage loops.',
        isCodeRef: 'IS 13592 Type A & B',
        spotPrice: 465,
        unit: '3m length (1" SDR 11)',
        minPrice: 430,
        maxPrice: 510,
        changePercent: 0.9,
        trend: 'stable',
        trendReason: 'High automated molding capacity and integrated pan-India depot logistics',
        marketHub: 'National Plumbing Network',
      },
      {
        id: 'plumb-sudhakar-ajay',
        category: 'Regional',
        brandName: 'Sudhakar & Ajay Pipes',
        keyVariantsAndDescription: 'Durable heat-resistant CPVC and lead-free UPVC solutions.',
        recommendedUse: 'Regional residential networks, irrigation lines, borewell casings, and value engineering projects.',
        isCodeRef: 'IS 4985 / IS 15778',
        spotPrice: 395,
        unit: '3m length (1" SDR 11)',
        minPrice: 370,
        maxPrice: 430,
        changePercent: -1.2,
        trend: 'down',
        trendReason: 'Local extrusion plants offering volume contractor rebates',
        marketHub: 'South & Central Regional Networks',
      },
    ],
  },
  {
    id: 'guide-tiles',
    sectionNumber: 5,
    title: '5. Tiles (Flooring & Wall Finishes)',
    shortTitle: 'Tiles & Finishes',
    category: 'Finishes & Surfaces',
    applicableNormIds: ['norm-vitrified-tiles', 'norm-tile-grout-adhesive'],
    description: 'Full-body vitrified floor tiles, ceramic wall dados, and anti-skid bathroom surfaces conforming to IS 15622.',
    isCodeStandards: ['IS 15622:2017 (Ceramic & Vitrified Tiles Group B1a)', 'IS 13630 (Methods of Testing Tiles)'],
    brands: [
      {
        id: 'tile-kajaria-somany',
        category: 'National',
        brandName: 'Kajaria & Somany',
        keyVariantsAndDescription: 'Massive design variety in ceramic and scratch-resistant vitrified tiles.',
        recommendedUse: 'Living room double-charged flooring, master suites, commercial lobbies, and high-traffic corridors.',
        isCodeRef: 'IS 15622 Group B1a',
        spotPrice: 88,
        unit: 'sq.ft (1200x600mm)',
        minPrice: 75,
        maxPrice: 110,
        changePercent: 1.1,
        trend: 'up',
        trendReason: 'Morbi tile manufacturing gas fuel tariffs and increased ceramic glaze raw costs',
        marketHub: 'Pan-India Experience Centers',
      },
      {
        id: 'tile-johnson-orientbell',
        category: 'National',
        brandName: 'H&R Johnson & Orientbell',
        keyVariantsAndDescription: 'Germ-free, anti-slip tiles with advanced visualization tools.',
        recommendedUse: 'Anti-skid toilet floors, healthcare facilities, kitchen dados, and balcony exterior decks.',
        isCodeRef: 'IS 15622 Anti-Bacterial',
        spotPrice: 82,
        unit: 'sq.ft (1200x600mm)',
        minPrice: 70,
        maxPrice: 98,
        changePercent: 0.0,
        trend: 'stable',
        trendReason: 'Balanced showroom inventory and steady residential developer uptake',
        marketHub: 'Metro & Tier-1 Dealerships',
      },
      {
        id: 'tile-naveen-aparna',
        category: 'Regional',
        brandName: 'Naveen Tile (Aparna)',
        keyVariantsAndDescription: 'Advanced manufacturing and robust floor/wall tiles across South India.',
        recommendedUse: 'South India residential projects, developer villas, utility areas, and commercial campuses.',
        isCodeRef: 'IS 15622 Vitrified',
        spotPrice: 68,
        unit: 'sq.ft (1200x600mm)',
        minPrice: 58,
        maxPrice: 82,
        changePercent: -2.1,
        trend: 'down',
        trendReason: 'Direct Andhra Pradesh & Telangana factory gate supply pricing',
        marketHub: 'South India Regional Network',
      },
    ],
  },
  {
    id: 'guide-glass',
    sectionNumber: 6,
    title: '6. Glass & Glazing Brands',
    shortTitle: 'Glass & Glazing',
    category: 'Fenestration & Glass',
    applicableNormIds: ['norm-windows-dgu'],
    description: 'Energy-efficient Low-E architectural glass, solar control double glazed units (DGU), and safety glazing conforming to IS 2553 and NBC 2016.',
    isCodeStandards: ['IS 2553:2019 (Safety Glass for Architectural Use)', 'NBC 2016 Part 8 / ECBC Compliance'],
    brands: [
      {
        id: 'glass-saintgobain-ais',
        category: 'National',
        brandName: 'Saint-Gobain & AIS',
        keyVariantsAndDescription: 'High-performance architectural glass, energy-efficient glazing, and float glass.',
        recommendedUse: 'Curtain walls, Low-E double glazing units (DGU), acoustic facade windows, and sky-lights.',
        isCodeRef: 'IS 2553 / EN 1279',
        spotPrice: 5850,
        unit: 'sq.m (DGU Low-E 6+12A+6)',
        minPrice: 5300,
        maxPrice: 6600,
        changePercent: 0.8,
        trend: 'stable',
        trendReason: 'High demand in LEED/IGBC green certified buildings balanced by modern float lines',
        marketHub: 'Authorized Glass Fabricators',
      },
      {
        id: 'glass-guardian-goldplus',
        category: 'National',
        brandName: 'Guardian & Gold Plus',
        keyVariantsAndDescription: 'Toughened safety glass, laminated coatings, and homegrown float glass.',
        recommendedUse: 'Frameless glass balustrades, shower enclosures, storefronts, and laminated safety partitions.',
        isCodeRef: 'IS 2553 Part 1',
        spotPrice: 5400,
        unit: 'sq.m (DGU Low-E 6+12A+6)',
        minPrice: 4900,
        maxPrice: 6000,
        changePercent: 0.0,
        trend: 'stable',
        trendReason: 'Stable silica sand and soda ash baseline production rates in domestic float plants',
        marketHub: 'North & Western Glass Processors',
      },
      {
        id: 'glass-sejal-fuso',
        category: 'Regional',
        brandName: 'Sejal & FUSO Glass',
        keyVariantsAndDescription: 'Custom architectural processors for insulated and curved glazing units.',
        recommendedUse: 'Bespoke curved glass corners, custom ceramic fritted facades, and regional specialized glazing.',
        isCodeRef: 'IS 2553 Toughened',
        spotPrice: 4850,
        unit: 'sq.m (DGU Low-E 6+12A+6)',
        minPrice: 4400,
        maxPrice: 5350,
        changePercent: -1.0,
        trend: 'down',
        trendReason: 'Regional processing yards offering competitive lead times and delivery bundling',
        marketHub: 'West & South Regional Processors',
      },
    ],
  },
  {
    id: 'guide-paints',
    sectionNumber: 7,
    title: '7. Paint Brands (Interior, Exterior & Waterproofing)',
    shortTitle: 'Paints & Coatings',
    category: 'Finishes & Surfaces',
    applicableNormIds: ['norm-interior-paint', 'norm-exterior-paint', 'norm-enamel-paint', 'norm-dampproof-coating', 'norm-wall-putty', 'norm-wall-primer'],
    description: 'Architectural interior acrylic emulsions, weather-defense exterior coatings, synthetic enamels, and elastomeric waterproofing conforming to IS 15489 and IS 2932.',
    isCodeStandards: ['IS 15489 (Plastic Emulsion Paint)', 'IS 2932 (Synthetic Enamel)', 'IS 15801 (Elastomeric Waterproofing)'],
    brands: [
      {
        id: 'paint-asian-berger',
        category: 'National',
        brandName: 'Asian Paints & Berger',
        keyVariantsAndDescription: 'Market leaders in interior emulsions, weather-proof coatings, and textures.',
        recommendedUse: 'Luxury interior living walls, anti-dirt exterior facade protection, and premium decorative finishes.',
        isCodeRef: 'IS 15489 / Green Pro',
        spotPrice: 385,
        unit: 'liter (Interior/Exterior Luxury)',
        minPrice: 350,
        maxPrice: 430,
        changePercent: 1.2,
        trend: 'up',
        trendReason: 'Raw acrylic polymer emulsions and titanium dioxide pigment benchmark firming',
        marketHub: 'Pan-India Paint Dealerships',
      },
      {
        id: 'paint-nerolac-dulux',
        category: 'National',
        brandName: 'Kansai Nerolac & Dulux',
        keyVariantsAndDescription: 'Architectural wall paints, protective metal coatings, and ultra-low VOC options.',
        recommendedUse: 'Eco-conscious green homes, anti-bacterial healthcare interiors, and heavy protective metal coatings.',
        isCodeRef: 'IS 15489 / Low-VOC',
        spotPrice: 365,
        unit: 'liter (Interior/Exterior Luxury)',
        minPrice: 330,
        maxPrice: 405,
        changePercent: 0.0,
        trend: 'stable',
        trendReason: 'Aggressive contractor rebate schemes stabilizing retail purchase pricing',
        marketHub: 'Authorized Color Depots',
      },
      {
        id: 'paint-indigo-birla-shalimar',
        category: 'Regional',
        brandName: 'Indigo, Birla Opus & Shalimar',
        keyVariantsAndDescription: 'Differentiated floor coats, modern decorative emulsions, and heritage coatings.',
        recommendedUse: 'Tile/floor coats, value-engineered residential repainting, and specialized regional heritage restorations.',
        isCodeRef: 'IS 15489 / IS 2932',
        spotPrice: 310,
        unit: 'liter (Interior/Exterior Luxury)',
        minPrice: 280,
        maxPrice: 350,
        changePercent: -1.8,
        trend: 'down',
        trendReason: 'New market entrant promotional discounts and wide retail distribution offers',
        marketHub: 'Regional Wholesalers & Dealers',
      },
    ],
  },
];

/**
 * Helper to get guide section by norm ID
 */
export function getGuideSectionForNorm(normId: string): MaterialGuideSection | undefined {
  return CONSTRUCTION_MATERIALS_MASTER_GUIDE.find((sec) => sec.applicableNormIds.includes(normId));
}

/**
 * Helper to lookup brand info across all sections
 */
export function findBrandInGuide(brandName: string): MaterialGuideBrand | undefined {
  const normName = brandName.toLowerCase();
  for (const sec of CONSTRUCTION_MATERIALS_MASTER_GUIDE) {
    for (const b of sec.brands) {
      if (
        b.brandName.toLowerCase().includes(normName) ||
        normName.includes(b.brandName.toLowerCase()) ||
        b.keyVariantsAndDescription.toLowerCase().includes(normName)
      ) {
        return b;
      }
    }
  }
  return undefined;
}

/**
 * Flattened map of all brands and their live spot prices for instant lookup
 */
export const MASTER_BRAND_SPOT_PRICES: Record<
  string,
  {
    spotPrice: number;
    unit: string;
    minPrice: number;
    maxPrice: number;
    changePercent: number;
    trend: 'up' | 'down' | 'stable';
    category: 'National' | 'Regional';
    sectionTitle: string;
    normIds: string[];
  }
> = {};

CONSTRUCTION_MATERIALS_MASTER_GUIDE.forEach((section) => {
  section.brands.forEach((b) => {
    MASTER_BRAND_SPOT_PRICES[b.brandName] = {
      spotPrice: b.spotPrice,
      unit: b.unit,
      minPrice: b.minPrice,
      maxPrice: b.maxPrice,
      changePercent: b.changePercent,
      trend: b.trend,
      category: b.category,
      sectionTitle: section.title,
      normIds: section.applicableNormIds,
    };
  });
});

/**
 * Find spot price for a brand string (supports substring matching)
 */
export function getBrandSpotRate(brandName?: string): { spotPrice: number; unit: string; trend: 'up' | 'down' | 'stable'; changePercent: number; category: 'National' | 'Regional' } | undefined {
  if (!brandName) return undefined;
  const target = brandName.toLowerCase();
  
  for (const [key, val] of Object.entries(MASTER_BRAND_SPOT_PRICES)) {
    if (key.toLowerCase() === target || target.includes(key.toLowerCase()) || key.toLowerCase().includes(target)) {
      return val;
    }
  }

  // Check variants & description
  const found = findBrandInGuide(brandName);
  if (found) {
    return {
      spotPrice: found.spotPrice,
      unit: found.unit,
      trend: found.trend,
      changePercent: found.changePercent,
      category: found.category,
    };
  }

  return undefined;
}

/**
 * Convert all brands from the Master Guide into LiveMaterialPrice items
 */
export function getMasterGuideLivePrices(): any[] {
  const result: any[] = [];
  CONSTRUCTION_MATERIALS_MASTER_GUIDE.forEach((section) => {
    section.brands.forEach((brand, idx) => {
      result.push({
        id: `guide-lmp-${brand.id}`,
        name: `${section.shortTitle}: ${brand.brandName} (${brand.category})`,
        category: section.category,
        brands: [brand.brandName],
        unit: brand.unit,
        currentPrice: brand.spotPrice,
        minPrice: brand.minPrice,
        maxPrice: brand.maxPrice,
        changePercent: brand.changePercent,
        trend: brand.trend,
        trendReason: brand.trendReason || `${brand.category} manufacturer benchmark pricing`,
        location: brand.marketHub || 'National / Regional Distribution',
        updatedAt: new Date().toISOString(),
        marketNotes: `${brand.keyVariantsAndDescription} | Standards: ${brand.isCodeRef || section.isCodeStandards.join(', ')}. ${brand.recommendedUse ? 'Recommended for ' + brand.recommendedUse : ''}`,
        isMasterGuideBrand: true,
        brandCategory: brand.category,
        sectionId: section.id,
      });
    });
  });
  return result;
}
