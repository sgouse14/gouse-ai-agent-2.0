/**
 * All-India Construction Materials Master Directory
 * Updated Edition — Bharathi Cement Added as a Separate Entry
 * National Giants, Primary Integrated Producers, Regional & State Leaders
 * Comprehensive Directory: Cement, Steel, Electricals, Plumbing, Tiles, Glass & Glazing, and Paints
 * Certified product variants, ductility grades, and IS engineering specification standards.
 */

export interface MaterialGuideBrand {
  id: string;
  category: 'National' | 'Regional';
  subCategory: string; // e.g. "National Market Leaders", "Regional & Zonal Leaders", "National Primary Giants", "Pan-India Franchise & Regional Players", "Waterproofing & Construction Chemicals", etc.
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

export const MASTER_DIRECTORY_METADATA = {
  title: 'All-India Construction Materials Master Directory',
  subtitle: 'Updated Edition — Bharathi Cement Added as a Separate Entry',
  headerNote: 'National Giants, Primary Integrated Producers, Regional & State Leaders',
  specialUpdate: 'Bharathi Cement is now listed separately under Regional & Zonal Leaders in the Cement section.',
  disclaimer:
    'Note: Brand positioning, market presence, product availability, and technical grades can vary by region, distributor network, project requirements, and specification.',
};

export const CONSTRUCTION_MATERIALS_MASTER_GUIDE: MaterialGuideSection[] = [
  // =========================================================================
  // 1. CEMENT
  // =========================================================================
  {
    id: 'guide-cement',
    sectionNumber: 1,
    title: '1. Cement',
    shortTitle: 'Cement',
    category: 'Cement & Concrete',
    applicableNormIds: ['norm-cement', 'norm-rmc'],
    description:
      'Structural binders conforming to IS 269 (OPC 53/43), IS 1489 Part 1 & 2 (PPC), IS 455 (PSC), and IS 456.',
    isCodeStandards: [
      'IS 269:2015 (OPC 53/43)',
      'IS 1489 Part 1 & 2 (PPC)',
      'IS 456:2000 (Plain & RCC)',
      'IS 455 (PSC Slag Cement)',
      'IS 8042 (White Cement)',
    ],
    brands: [
      // National Market Leaders
      {
        id: 'cem-ultratech',
        category: 'National',
        subCategory: 'National Market Leaders',
        brandName: 'UltraTech Cement',
        keyVariantsAndDescription:
          "India’s largest cement producer (OPC, PPC, Super, Weather Plus).",
        recommendedUse:
          'High-strength structural RCC, heavy columns, transfer slabs and mass concreting.',
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
        id: 'cem-ambuja-acc',
        category: 'National',
        subCategory: 'National Market Leaders',
        brandName: 'Ambuja Cements & ACC Cement',
        keyVariantsAndDescription:
          'Part of the Adani Group (Ambuja Kawach, ACC Gold, ACC Suraksha).',
        recommendedUse:
          'Foundation footings, retaining walls, external plaster, and damp-prone coastal environments.',
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
        id: 'cem-shree',
        category: 'National',
        subCategory: 'National Market Leaders',
        brandName: 'Shree Cement',
        keyVariantsAndDescription:
          'Major national player (Bangur Power, Roofon, Rockstrong).',
        recommendedUse:
          'Residential RCC frames, masonry mortars, floor screeds, and general construction.',
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
        id: 'cem-dalmia',
        category: 'National',
        subCategory: 'National Market Leaders',
        brandName: 'Dalmia Cement',
        keyVariantsAndDescription:
          'Strong footprint across East, South, and North-East India (Dalmia DSP).',
        recommendedUse:
          'High early-strength concrete, foundation piling, and coastal slag cement applications.',
        isCodeRef: 'IS 455 / IS 1489',
        spotPrice: 375,
        unit: '50 kg bag',
        minPrice: 355,
        maxPrice: 400,
        changePercent: 0.5,
        trend: 'stable',
        trendReason: 'Steady institutional demand across East and Southern corridors',
        marketHub: 'East & South Regional Network',
      },
      {
        id: 'cem-jk-super',
        category: 'National',
        subCategory: 'National Market Leaders',
        brandName: 'JK Cement / JK Super',
        keyVariantsAndDescription:
          'National leader in grey structural cement and white cement.',
        recommendedUse:
          'Structural grey concrete, architectural precast, and white cement-based skim coats.',
        isCodeRef: 'IS 269 (OPC 53/43) / IS 8042',
        spotPrice: 385,
        unit: '50 kg bag',
        minPrice: 365,
        maxPrice: 410,
        changePercent: 1.3,
        trend: 'up',
        trendReason: 'High demand for specialized high-early strength grades in commercial towers',
        marketHub: 'North & West Regional Hubs',
      },
      {
        id: 'cem-birla-a1-opc',
        category: 'National',
        subCategory: 'National Market Leaders',
        brandName: 'Birla A1 Premium Cement / UltraTech OPC 53',
        keyVariantsAndDescription:
          'High-strength structural Ordinary Portland Cement (OPC 53 Grade & 43 Grade) by Aditya Birla Group (Birla A1 StrongCrete, UltraTech Super, MP Birla Perfect Plus). High 28-day compressive strength (>58 MPa), optimum fineness (320 m²/kg), low alkali content.',
        recommendedUse:
          'High-strength RCC foundations, columns, shear walls, prestressed transfer slabs, and bridge infrastructure.',
        isCodeRef: 'IS 269:2015 (OPC 53/43) / IS 12269',
        spotPrice: 385,
        unit: '50 kg bag',
        minPrice: 365,
        maxPrice: 415,
        changePercent: 1.5,
        trend: 'up',
        trendReason: 'Strong infrastructure dispatch quotas and fast-track commercial framing demand',
        marketHub: 'Pan-India Distribution Network',
      },

      // Regional & Zonal Leaders
      {
        id: 'cem-nuvoco',
        category: 'Regional',
        subCategory: 'Regional & Zonal Leaders',
        brandName: 'Nuvoco Vistas',
        keyVariantsAndDescription:
          'Concreto, Duraguard; major market share across East and Central India.',
        recommendedUse:
          'Engineered concrete casting, high-durability slabs, and industrial floors.',
        isCodeRef: 'IS 269 / IS 1489',
        spotPrice: 360,
        unit: '50 kg bag',
        minPrice: 340,
        maxPrice: 385,
        changePercent: 0.2,
        trend: 'stable',
        trendReason: 'Strong retail network dominance across Eastern industrial clusters',
        marketHub: 'East & Central India',
      },
      {
        id: 'cem-birla-corp',
        category: 'Regional',
        subCategory: 'Regional & Zonal Leaders',
        brandName: 'Birla Corporation (MP Birla Cement)',
        keyVariantsAndDescription:
          'Dominant across Central, North, and Eastern states.',
        recommendedUse:
          'General civil construction, structural frameworks, and rural housing schemes.',
        isCodeRef: 'IS 1489 / IS 455',
        spotPrice: 355,
        unit: '50 kg bag',
        minPrice: 335,
        maxPrice: 380,
        changePercent: -0.3,
        trend: 'stable',
        trendReason: 'Competitive wholesale tier pricing in Central & Northern states',
        marketHub: 'Central & Northern States',
      },
      {
        id: 'cem-ramco',
        category: 'Regional',
        subCategory: 'Regional & Zonal Leaders',
        brandName: 'The Ramco Cements',
        keyVariantsAndDescription: 'Leading brand across South India.',
        recommendedUse:
          'Supergrade plastering, high-early strength precast, and residential columns.',
        isCodeRef: 'IS 269 (OPC 53) / IS 1489',
        spotPrice: 365,
        unit: '50 kg bag',
        minPrice: 345,
        maxPrice: 395,
        changePercent: 1.0,
        trend: 'up',
        trendReason: 'Tamil Nadu and Kerala coastal construction surge post-monsoon',
        marketHub: 'South India (TN, Kerala, Karnataka)',
      },
      {
        id: 'cem-bharathi',
        category: 'Regional',
        subCategory: 'Regional & Zonal Leaders',
        brandName: 'Bharathi Cement',
        keyVariantsAndDescription:
          'Leading South Indian brand; included separately as requested.',
        recommendedUse:
          'Rapid de-shuttering schedules, commercial RCC, and South India infrastructure.',
        isCodeRef: 'IS 269 (OPC 53) / IS 1489 (PPC)',
        spotPrice: 350,
        unit: '50 kg bag',
        minPrice: 335,
        maxPrice: 375,
        changePercent: -1.4,
        trend: 'down',
        trendReason: 'Direct plant dispatch from Kadapa limestone belt with volume rebate incentives',
        marketHub: 'South India (AP, Telangana, Karnataka, TN)',
      },
      {
        id: 'cem-india-cements',
        category: 'Regional',
        subCategory: 'Regional & Zonal Leaders',
        brandName: 'India Cements',
        keyVariantsAndDescription:
          'Sankar, Coromandel; legacy producer in South India.',
        recommendedUse:
          'Traditional masonry, foundation concrete, and coastal mass infrastructure.',
        isCodeRef: 'IS 269 / IS 1489',
        spotPrice: 345,
        unit: '50 kg bag',
        minPrice: 330,
        maxPrice: 370,
        changePercent: -0.5,
        trend: 'stable',
        trendReason: 'Longstanding dealer relationships and reliable bulk supply in South India',
        marketHub: 'South India Regional Network',
      },
      {
        id: 'cem-star-amrit',
        category: 'Regional',
        subCategory: 'Regional & Zonal Leaders',
        brandName: 'Star Cement & Amrit Cement',
        keyVariantsAndDescription:
          'Dominant brands in North-East and Eastern India.',
        recommendedUse:
          'High-rainfall terrains, seismic zones, and heavy riverine retaining structures.',
        isCodeRef: 'IS 1489 (PPC)',
        spotPrice: 370,
        unit: '50 kg bag',
        minPrice: 350,
        maxPrice: 395,
        changePercent: 0.4,
        trend: 'stable',
        trendReason: 'Logistics subsidy stability and regional infrastructure allocation',
        marketHub: 'North-East & Eastern Corridor',
      },
      {
        id: 'cem-wonder',
        category: 'Regional',
        subCategory: 'Regional & Zonal Leaders',
        brandName: 'Wonder Cement',
        keyVariantsAndDescription:
          'Strong market footprint across West and North India.',
        recommendedUse:
          'Precise batch consistency, precast components, and residential structural casting.',
        isCodeRef: 'IS 269 (OPC 53) / IS 1489',
        spotPrice: 360,
        unit: '50 kg bag',
        minPrice: 340,
        maxPrice: 385,
        changePercent: 0.6,
        trend: 'stable',
        trendReason: 'State-of-the-art robotic German plant grinding consistency',
        marketHub: 'West & North India (Rajasthan, Gujarat, MP, Delhi-NCR)',
      },
    ],
  },

  // =========================================================================
  // 2. STEEL (TMT REBARS & STRUCTURAL)
  // =========================================================================
  {
    id: 'guide-steel',
    sectionNumber: 2,
    title: '2. Steel (TMT Rebars & Structural)',
    shortTitle: 'Steel (TMT & Structural)',
    category: 'Steel & Reinforcement',
    applicableNormIds: ['norm-steel'],
    description:
      'Primary integrated producers, public sector giants, pan-India franchise mills, and regional leaders conforming to IS 1786 and IS 2062.',
    isCodeStandards: [
      'IS 1786:2008 (Fe 500D / Fe 550D / Fe 550D-CRS)',
      'IS 2062:2011 (Hot Rolled Structural Steel)',
      'IS 4923 / IS 1161 (Hollow Steel Sections)',
      'SP 34 (Handbook on Concrete Reinforcement Detailing)',
    ],
    brands: [
      // National Primary Giants
      {
        id: 'steel-tata-tiscon',
        category: 'National',
        subCategory: 'National Primary Giants',
        brandName: 'Tata Steel (Tata Tiscon 550D)',
        keyVariantsAndDescription:
          'Premium benchmark for ductility, seismic resistance, and quality.',
        recommendedUse:
          'Critical structural frames, seismic resistance (Zone III/IV/V), and heavy infrastructure.',
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
        subCategory: 'National Primary Giants',
        brandName: 'JSW Steel (JSW Neosteel)',
        keyVariantsAndDescription:
          'India’s largest private steelmaker, produced from virgin iron ore.',
        recommendedUse:
          'Multi-story residential towers, commercial cores, and deep basement retention structures.',
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
        id: 'steel-sail',
        category: 'National',
        subCategory: 'National Primary Giants',
        brandName: 'SAIL',
        keyVariantsAndDescription:
          'Steel Authority of India Ltd.; public sector giant supplying rails, structural steel, and TMT.',
        recommendedUse:
          'Institutional campuses, bridges, heavy civil works, transfer girders, and export grade execution.',
        isCodeRef: 'IS 1786 Fe 550D / IS 2062',
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
        id: 'steel-jindal-panther',
        category: 'National',
        subCategory: 'National Primary Giants',
        brandName: 'Jindal Steel & Power (Jindal Panther)',
        keyVariantsAndDescription:
          'Known for pioneer long-steel products and parallel flange beams.',
        recommendedUse:
          'Heavy industrial pre-engineered buildings, composite columns, and high-rise transfer slabs.',
        isCodeRef: 'IS 1786 Fe 550D / IS 808',
        spotPrice: 74200,
        unit: 'MT (Metric Tonne)',
        minPrice: 72000,
        maxPrice: 76800,
        changePercent: 0.0,
        trend: 'stable',
        trendReason: 'Balanced supply in medium and heavy structural profiles',
        marketHub: 'Raigarh & Angul Plants',
      },
      {
        id: 'steel-amns',
        category: 'National',
        subCategory: 'National Primary Giants',
        brandName: 'AM/NS India',
        keyVariantsAndDescription:
          'ArcelorMittal Nippon Steel; major national supplier of flat, structural, and coated steel.',
        recommendedUse:
          'Advanced engineered steel structures, offshore plates, and coastal infrastructure.',
        isCodeRef: 'IS 1786 / IS 2062',
        spotPrice: 73500,
        unit: 'MT (Metric Tonne)',
        minPrice: 71000,
        maxPrice: 76000,
        changePercent: -0.6,
        trend: 'down',
        trendReason: 'Hazira plant capacity enhancements driving high dispatch volumes',
        marketHub: 'West & National Yards',
      },
      {
        id: 'steel-rinl-vizag',
        category: 'National',
        subCategory: 'National Primary Giants',
        brandName: 'RINL (Vizag Steel)',
        keyVariantsAndDescription:
          'Public sector primary producer with coastal unit supply across India.',
        recommendedUse:
          'Marine structures, industrial foundations, port infrastructure, and primary RCC frames.',
        isCodeRef: 'IS 1786 Fe 500D / Fe 550D',
        spotPrice: 72800,
        unit: 'MT (Metric Tonne)',
        minPrice: 70500,
        maxPrice: 75500,
        changePercent: 0.3,
        trend: 'stable',
        trendReason: 'Direct seaport logistics providing advantageous coastal freight rates',
        marketHub: 'Visakhapatnam & Coastal Network',
      },

      // Pan-India Franchise & Regional Players
      {
        id: 'steel-kamdhenu',
        category: 'Regional',
        subCategory: 'Pan-India Franchise & Regional Players',
        brandName: 'Kamdhenu Steel',
        keyVariantsAndDescription:
          'Kamdhenu PAS 10,000, NXT; widespread franchise model across North, West, and Central India.',
        recommendedUse:
          'Cost-effective residential villas, boundary structures, and regional retail grids.',
        isCodeRef: 'IS 1786 Fe 500D / Fe 550D',
        spotPrice: 68500,
        unit: 'MT (Metric Tonne)',
        minPrice: 66000,
        maxPrice: 71000,
        changePercent: -1.5,
        trend: 'down',
        trendReason: 'Secondary induction furnace billet availability softening regional mill costs',
        marketHub: 'North, West & Central Franchise Network',
      },
      {
        id: 'steel-a-one-gold',
        category: 'Regional',
        subCategory: 'Pan-India Franchise & Regional Players',
        brandName: 'A-One Gold Steel',
        keyVariantsAndDescription:
          'Major integrated producer across Karnataka, AP, Telangana, and South India.',
        recommendedUse:
          'South India regional RCC frames, commercial basements, and residential developments.',
        isCodeRef: 'IS 1786 Fe 550D',
        spotPrice: 67800,
        unit: 'MT (Metric Tonne)',
        minPrice: 65500,
        maxPrice: 70200,
        changePercent: -1.2,
        trend: 'down',
        trendReason: 'Bellary industrial hub competitive direct-to-site pricing',
        marketHub: 'South India (Karnataka, AP, Telangana)',
      },
      {
        id: 'steel-srmb-shyam',
        category: 'Regional',
        subCategory: 'Pan-India Franchise & Regional Players',
        brandName: 'SRMB Steel & Shyam Steel (SEL)',
        keyVariantsAndDescription:
          'Market leaders across West Bengal, Bihar, Odisha, and Eastern India.',
        recommendedUse:
          'Winged rib bond resistance, Eastern India seismic corridors, and bridge piers.',
        isCodeRef: 'IS 1786 Fe 500D / Fe 550D',
        spotPrice: 69200,
        unit: 'MT (Metric Tonne)',
        minPrice: 67000,
        maxPrice: 71500,
        changePercent: 0.4,
        trend: 'stable',
        trendReason: 'Robust distribution footprint across Eastern infrastructure projects',
        marketHub: 'East India (WB, Bihar, Odisha, Assam)',
      },
      {
        id: 'steel-super-smelters',
        category: 'Regional',
        subCategory: 'Pan-India Franchise & Regional Players',
        brandName: 'Super Smelters',
        keyVariantsAndDescription:
          'Super Shakti; major long-steel producer in Eastern India.',
        recommendedUse:
          'Heavy structural sections, wire rods, and regional industrial workshops.',
        isCodeRef: 'IS 1786 / IS 2062',
        spotPrice: 67200,
        unit: 'MT (Metric Tonne)',
        minPrice: 65000,
        maxPrice: 69800,
        changePercent: -1.0,
        trend: 'down',
        trendReason: 'High local billet conversion volumes in Durgapur rolling mills',
        marketHub: 'Eastern India Rolling Hubs',
      },
      {
        id: 'steel-rathi',
        category: 'Regional',
        subCategory: 'Pan-India Franchise & Regional Players',
        brandName: 'Rathi Steel',
        keyVariantsAndDescription:
          'Rathi Eurotherm; dominant regional brand across Delhi-NCR, UP, and Rajasthan.',
        recommendedUse:
          'North India urban housing, retail plazas, and commercial basements.',
        isCodeRef: 'IS 1786 Fe 500D',
        spotPrice: 68000,
        unit: 'MT (Metric Tonne)',
        minPrice: 65800,
        maxPrice: 70500,
        changePercent: 0.0,
        trend: 'stable',
        trendReason: 'Stable Delhi-NCR building construction consumption',
        marketHub: 'Delhi-NCR, UP & Rajasthan',
      },
      {
        id: 'steel-agni-pulkit',
        category: 'Regional',
        subCategory: 'Pan-India Franchise & Regional Players',
        brandName: 'Agni Steels & Pulkit Steel',
        keyVariantsAndDescription:
          'Leading regional choices in Tamil Nadu and Puducherry.',
        recommendedUse:
          'Coastal Tamil Nadu residential and commercial structures with corrosion resistance.',
        isCodeRef: 'IS 1786 Fe 550D (CRS)',
        spotPrice: 67500,
        unit: 'MT (Metric Tonne)',
        minPrice: 65200,
        maxPrice: 70000,
        changePercent: -0.8,
        trend: 'down',
        trendReason: 'Direct plant logistics across Erode and Puducherry yards',
        marketHub: 'Tamil Nadu & Puducherry',
      },
      {
        id: 'steel-apl-apollo',
        category: 'Regional',
        subCategory: 'Pan-India Franchise & Regional Players',
        brandName: 'APL Apollo',
        keyVariantsAndDescription:
          'National leader for structural steel pipes and hollow sections.',
        recommendedUse:
          'Pre-engineered building trusses, tubular roof columns, facade frames, and architectural pergolas.',
        isCodeRef: 'IS 4923 / IS 1161',
        spotPrice: 75500,
        unit: 'MT (Metric Tonne)',
        minPrice: 73000,
        maxPrice: 78500,
        changePercent: 1.6,
        trend: 'up',
        trendReason: 'Surging architectural preference for hollow tubular sections in modern airports and PEBs',
        marketHub: 'Pan-India Hollow Section Depots',
      },
    ],
  },

  // =========================================================================
  // 3. ELECTRICAL WIRES, CABLES & SWITCHGEAR
  // =========================================================================
  {
    id: 'guide-electricals',
    sectionNumber: 3,
    title: '3. Electrical Wires, Cables & Switchgear',
    shortTitle: 'Electricals & Switchgear',
    category: 'Plumbing & MEP',
    applicableNormIds: ['norm-electrical-wiring', 'norm-electrical-conduits'],
    description:
      'Fire-retardant copper conductors, zero-halogen safety cables, modular switchgear, and automation systems conforming to IS 694, IS 732, and NBC 2016 Part 8.',
    isCodeStandards: [
      'IS 694:2010 (PVC/FRLH Copper Cables)',
      'IS 732 (Wiring Installations)',
      'IS 3854 (Modular Switches)',
      'IS/IEC 60898 (MCBs/RCCBs)',
      'NBC 2016 Part 8',
    ],
    brands: [
      // National Market Leaders
      {
        id: 'elec-polycab',
        category: 'National',
        subCategory: 'National Market Leaders',
        brandName: 'Polycab India',
        keyVariantsAndDescription:
          'India’s largest manufacturer of wires, power cables, and FRLH wiring.',
        recommendedUse:
          'Main risers, apartment distribution boards, HVAC sub-mains, and fire-safe commercial corridors.',
        isCodeRef: 'IS 694 FRLH',
        spotPrice: 2950,
        unit: '90m coil (2.5 sq.mm)',
        minPrice: 2750,
        maxPrice: 3200,
        changePercent: 3.1,
        trend: 'up',
        trendReason: 'LME international refined copper cathode rally hitting multi-month highs',
        marketHub: 'Pan-India Electrical Distributors',
      },
      {
        id: 'elec-havells',
        category: 'National',
        subCategory: 'National Market Leaders',
        brandName: 'Havells India',
        keyVariantsAndDescription:
          'Premium national manufacturer of flame-retardant cables, switchgear, and lighting.',
        recommendedUse:
          'Luxury residences, commercial offices, heavy switchgear, and LED architecture.',
        isCodeRef: 'IS 694 / IS 12640',
        spotPrice: 3050,
        unit: '90m coil (2.5 sq.mm)',
        minPrice: 2850,
        maxPrice: 3300,
        changePercent: 2.8,
        trend: 'up',
        trendReason: 'Strong brand pull in high-end residential and hospitality developments',
        marketHub: 'National Retail & Project Depots',
      },
      {
        id: 'elec-finolex',
        category: 'National',
        subCategory: 'National Market Leaders',
        brandName: 'Finolex Cables',
        keyVariantsAndDescription:
          'Pioneer in multi-strand copper home wires and communications cables.',
        recommendedUse:
          'Concealed internal domestic conduits, LAN networking, and telecom drops.',
        isCodeRef: 'IS 694 Class 5',
        spotPrice: 2850,
        unit: '90m coil (2.5 sq.mm)',
        minPrice: 2650,
        maxPrice: 3100,
        changePercent: 2.4,
        trend: 'up',
        trendReason: 'High electrician contractor loyalty and pure electrolytic copper grade guarantee',
        marketHub: 'National Electrical Wholesalers',
      },
      {
        id: 'elec-rr-kabel',
        category: 'National',
        subCategory: 'National Market Leaders',
        brandName: 'RR Kabel',
        keyVariantsAndDescription:
          'Pioneer in UNILAY and zero-halogen fire safety wires.',
        recommendedUse:
          'Green certified buildings, high-density residential towers, and low-smoke zones.',
        isCodeRef: 'IS 694 / RoHS',
        spotPrice: 2980,
        unit: '90m coil (2.5 sq.mm)',
        minPrice: 2780,
        maxPrice: 3250,
        changePercent: 2.6,
        trend: 'up',
        trendReason: 'High demand for European RoHS and REACH environmental compliance in metro towers',
        marketHub: 'Pan-India MEP Wholesalers',
      },
      {
        id: 'elec-kei',
        category: 'National',
        subCategory: 'National Market Leaders',
        brandName: 'KEI Industries',
        keyVariantsAndDescription:
          'Major producer of high-voltage industrial cables and domestic wires.',
        recommendedUse:
          'Heavy HT/LT sub-station cabling, industrial feeders, and solar grid tie-ins.',
        isCodeRef: 'IS 7098 / IS 1554',
        spotPrice: 2900,
        unit: '90m coil (2.5 sq.mm)',
        minPrice: 2700,
        maxPrice: 3150,
        changePercent: 1.9,
        trend: 'up',
        trendReason: 'Massive infrastructure, solar power plant, and metro rail order backlogs',
        marketHub: 'National Industrial Cable Depots',
      },
      {
        id: 'elec-anchor-legrand-schneider',
        category: 'National',
        subCategory: 'National Market Leaders',
        brandName: 'Anchor by Panasonic, Legrand & Schneider Electric',
        keyVariantsAndDescription:
          'Market leaders for modular switches, home automation, and MCBs.',
        recommendedUse:
          'Modular switches, miniature circuit breakers, smart home automation, and distribution panels.',
        isCodeRef: 'IS 3854 / IS/IEC 60898',
        spotPrice: 3400,
        unit: 'Complete modular set',
        minPrice: 3100,
        maxPrice: 3800,
        changePercent: 0.5,
        trend: 'stable',
        trendReason: 'Steady adoption of IoT smart relays and coordinated aesthetic faceplates',
        marketHub: 'Architectural Lighting & Switch Studios',
      },

      // Regional & Trade Favorites
      {
        id: 'elec-gm-goldmedal',
        category: 'Regional',
        subCategory: 'Regional & Trade Favorites',
        brandName: 'GM Modular & Goldmedal',
        keyVariantsAndDescription:
          'Massive distribution networks for modern modular plates and LED systems.',
        recommendedUse:
          'Contemporary residential designer switch plates, acoustic doorbells, and ambient LEDs.',
        isCodeRef: 'IS 3854 / IS 10322',
        spotPrice: 2450,
        unit: '90m coil / set',
        minPrice: 2250,
        maxPrice: 2700,
        changePercent: 0.0,
        trend: 'stable',
        trendReason: 'Fast inventory turnover driven by extensive dealer incentive networks',
        marketHub: 'Tier-1 & Tier-2 Retail Network',
      },
      {
        id: 'elec-plaza-vguard',
        category: 'Regional',
        subCategory: 'Regional & Trade Favorites',
        brandName: 'Plaza Wires & V-Guard',
        keyVariantsAndDescription:
          'Popular across North, Central, and Southern domestic wiring markets.',
        recommendedUse:
          'Value-engineered domestic circuits, sub-meter loops, and water pump cabling.',
        isCodeRef: 'IS 694',
        spotPrice: 2350,
        unit: '90m coil (2.5 sq.mm)',
        minPrice: 2150,
        maxPrice: 2550,
        changePercent: -0.4,
        trend: 'stable',
        trendReason: 'Competitive regional retail discounts and steady housing wiring demand',
        marketHub: 'North, Central & Southern Trade Depots',
      },
    ],
  },

  // =========================================================================
  // 4. PLUMBING, CPVC & PVC PIPES
  // =========================================================================
  {
    id: 'guide-plumbing',
    sectionNumber: 4,
    title: '4. Plumbing, CPVC & PVC Pipes',
    shortTitle: 'Plumbing & Pipes',
    category: 'Plumbing & MEP',
    applicableNormIds: ['norm-plumbing-pipes'],
    description:
      'Potable hot/cold CPVC networks, high-grade UPVC water lines, SWR drainage systems, and agricultural piping conforming to IS 15778, IS 13592, and ASTM D2846.',
    isCodeStandards: [
      'IS 15778:2007 (CPVC for Potable Hot/Cold Water)',
      'IS 13592:2013 (UPVC Soil, Waste & Rainwater)',
      'IS 4985 (PVC for Potable Water Supplies)',
      'ASTM D2846 / SDR 11 & 13.5',
    ],
    brands: [
      // National Market Leaders
      {
        id: 'plumb-astral',
        category: 'National',
        subCategory: 'National Market Leaders',
        brandName: 'Astral Pipes',
        keyVariantsAndDescription:
          'Pioneer in CPVC plumbing systems in India (ProFlo, ThermoFlex).',
        recommendedUse:
          'Pressurized water risers, solar hot water distribution, and concealed luxury bathroom plumbing.',
        isCodeRef: 'IS 15778 SDR 11 / SDR 13.5',
        spotPrice: 495,
        unit: '3m length (1" SDR 11)',
        minPrice: 460,
        maxPrice: 540,
        changePercent: 1.5,
        trend: 'up',
        trendReason: 'Imported chlorinated polyvinyl chloride polymer resin price adjustments',
        marketHub: 'National Authorized Plumbing Network',
      },
      {
        id: 'plumb-ashirvad',
        category: 'National',
        subCategory: 'National Market Leaders',
        brandName: 'Ashirvad Pipes (Aliaxis)',
        keyVariantsAndDescription:
          'Major manufacturer of high-grade CPVC and UPVC plumbing systems.',
        recommendedUse:
          'Acoustic low-noise drainage stacks, high-rise hot water plumbing, and solvent-welded joints.',
        isCodeRef: 'IS 15778 / IS 4985',
        spotPrice: 490,
        unit: '3m length (1" SDR 11)',
        minPrice: 455,
        maxPrice: 535,
        changePercent: 1.4,
        trend: 'up',
        trendReason: 'Strong specification endorsement by leading MEP plumbing consultants',
        marketHub: 'National Plumbing & Project Depots',
      },
      {
        id: 'plumb-supreme',
        category: 'National',
        subCategory: 'National Market Leaders',
        brandName: 'Supreme Industries',
        keyVariantsAndDescription:
          'India’s largest plastics processor offering complete PVC, CPVC, and SWR drainage systems.',
        recommendedUse:
          'Complete residential plumbing, multi-story SWR ring-fit drainage, and underground sewage.',
        isCodeRef: 'IS 13592 Type A & B / IS 15778',
        spotPrice: 465,
        unit: '3m length (1" SDR 11)',
        minPrice: 430,
        maxPrice: 510,
        changePercent: 0.9,
        trend: 'stable',
        trendReason: 'High automated molding capacity and integrated pan-India depot logistics',
        marketHub: 'Pan-India Distribution',
      },
      {
        id: 'plumb-finolex-ind',
        category: 'National',
        subCategory: 'National Market Leaders',
        brandName: 'Finolex Industries',
        keyVariantsAndDescription:
          'Legacy manufacturer of agricultural, CPVC, and UPVC plumbing pipes.',
        recommendedUse:
          'Agricultural borewells, township water supply lines, and domestic internal plumbing.',
        isCodeRef: 'IS 4985 / IS 15778',
        spotPrice: 450,
        unit: '3m length (1" SDR 11)',
        minPrice: 420,
        maxPrice: 490,
        changePercent: 0.4,
        trend: 'stable',
        trendReason: 'Integrated backward PVC resin manufacturing providing cost stability',
        marketHub: 'Pan-India Agri & Plumbing Network',
      },
      {
        id: 'plumb-prince',
        category: 'National',
        subCategory: 'National Market Leaders',
        brandName: 'Prince Pipes & Fittings',
        keyVariantsAndDescription:
          'Nationwide player offering CPVC (FlowGuard Plus) and underground drainage.',
        recommendedUse:
          'FlowGuard Plus hot/cold plumbing, foamfit underground drainage, and rainwater harvesting.',
        isCodeRef: 'IS 15778 / IS 13592',
        spotPrice: 460,
        unit: '3m length (1" SDR 11)',
        minPrice: 425,
        maxPrice: 505,
        changePercent: 0.6,
        trend: 'stable',
        trendReason: 'Lubrizol FlowGuard Plus compound technology partnership guarantees',
        marketHub: 'National Distribution Network',
      },
      {
        id: 'plumb-apollo-pipes',
        category: 'National',
        subCategory: 'National Market Leaders',
        brandName: 'Apollo Pipes',
        keyVariantsAndDescription:
          'Rapidly growing national brand in plumbing and agricultural pipes.',
        recommendedUse:
          'Value-added domestic piping, column pipes, and urban sewage connections.',
        isCodeRef: 'IS 15778 / IS 4985',
        spotPrice: 435,
        unit: '3m length (1" SDR 11)',
        minPrice: 405,
        maxPrice: 475,
        changePercent: 1.0,
        trend: 'up',
        trendReason: 'Rapid expansion of dealership network across Northern and Western regions',
        marketHub: 'National Retail Network',
      },

      // Regional Leaders
      {
        id: 'plumb-sudhakar',
        category: 'Regional',
        subCategory: 'Regional Leaders',
        brandName: 'Sudhakar Group',
        keyVariantsAndDescription:
          'Market leader across Telangana, Andhra Pradesh, and South India.',
        recommendedUse:
          'Regional residential developments, municipal distribution, and agricultural borehole lines.',
        isCodeRef: 'IS 4985 / IS 15778',
        spotPrice: 395,
        unit: '3m length (1" SDR 11)',
        minPrice: 370,
        maxPrice: 430,
        changePercent: -1.2,
        trend: 'down',
        trendReason: 'Direct Suryapet plant regional supply pricing and prompt delivery',
        marketHub: 'Telangana, Andhra Pradesh & South India',
      },
      {
        id: 'plumb-star-pipes',
        category: 'Regional',
        subCategory: 'Regional Leaders',
        brandName: 'Star Pipes & Fittings',
        keyVariantsAndDescription:
          'Strong presence across Kerala and Tamil Nadu.',
        recommendedUse:
          'High-humidity coastal plumbing, domestic rainwater conveyance, and local residential schemes.',
        isCodeRef: 'IS 4985 / IS 13592',
        spotPrice: 405,
        unit: '3m length (1" SDR 11)',
        minPrice: 375,
        maxPrice: 440,
        changePercent: -0.3,
        trend: 'stable',
        trendReason: 'Preferred regional brand among Kerala plumbing contractors',
        marketHub: 'Kerala & Tamil Nadu',
      },
      {
        id: 'plumb-skipper-prayag',
        category: 'Regional',
        subCategory: 'Regional Leaders',
        brandName: 'Skipper Pipes & Prayag',
        keyVariantsAndDescription:
          'Widespread availability across North and East India.',
        recommendedUse:
          'CP bathroom fixtures, domestic UPVC plumbing, and North/East infrastructure.',
        isCodeRef: 'IS 4985 / IS 15778',
        spotPrice: 390,
        unit: '3m length (1" SDR 11)',
        minPrice: 365,
        maxPrice: 425,
        changePercent: -0.8,
        trend: 'down',
        trendReason: 'Competitive institutional contractor package discounting',
        marketHub: 'North & East India',
      },
    ],
  },

  // =========================================================================
  // 5. TILES (FLOORING, WALL & SLABS)
  // =========================================================================
  {
    id: 'guide-tiles',
    sectionNumber: 5,
    title: '5. Tiles (Flooring, Wall & Slabs)',
    shortTitle: 'Tiles (Flooring, Wall & Slabs)',
    category: 'Finishes & Surfaces',
    applicableNormIds: ['norm-vitrified-tiles', 'norm-tile-grout-adhesive'],
    description:
      'GVT, PVT, glazed vitrified tiles, digital wall finishes, porcelain slabs, and anti-skid surfaces conforming to IS 15622 and ISO 13006.',
    isCodeStandards: [
      'IS 15622:2017 (Ceramic & Vitrified Tiles Group B1a)',
      'IS 13630 (Methods of Testing Ceramic Tiles)',
      'ISO 13006 / EN 14411 (Water Absorption < 0.08%)',
    ],
    brands: [
      // National Giants
      {
        id: 'tile-kajaria',
        category: 'National',
        subCategory: 'National Giants',
        brandName: 'Kajaria Ceramics',
        keyVariantsAndDescription:
          'India’s largest tile manufacturer (GVT, PVT, Wall & Floor Tiles).',
        recommendedUse:
          'Living room double-charged flooring, master suites, commercial lobbies, and heavy traffic.',
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
        id: 'tile-somany',
        category: 'National',
        subCategory: 'National Giants',
        brandName: 'Somany Ceramics',
        keyVariantsAndDescription:
          'Major market leader (Duragres, Max Slabs).',
        recommendedUse:
          'High-gloss polished vitrified slabs, scratch-resistant commercial floors, and kitchen counters.',
        isCodeRef: 'IS 15622:2017',
        spotPrice: 86,
        unit: 'sq.ft (1200x600mm)',
        minPrice: 74,
        maxPrice: 108,
        changePercent: 0.9,
        trend: 'up',
        trendReason: 'Patented VC shield high-abrasion resistance technology demand',
        marketHub: 'National Retail Network',
      },
      {
        id: 'tile-johnson',
        category: 'National',
        subCategory: 'National Giants',
        brandName: 'H&R Johnson (India)',
        keyVariantsAndDescription:
          'Pioneer in germ-free, anti-skid, and vitrified tiles.',
        recommendedUse:
          'Anti-skid toilet floors, healthcare facilities, swimming pools, and industrial pavements.',
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
        id: 'tile-orientbell',
        category: 'National',
        subCategory: 'National Giants',
        brandName: 'Orientbell Tiles',
        keyVariantsAndDescription:
          'Innovative brand with digital visualization tools (Cool Tiles).',
        recommendedUse:
          'Solar reflective terrace tiles (SRI > 100), digital ceramic wall dados, and patio decks.',
        isCodeRef: 'IS 15622 / ECBC Cool Roof',
        spotPrice: 78,
        unit: 'sq.ft (600x600mm)',
        minPrice: 68,
        maxPrice: 95,
        changePercent: 0.4,
        trend: 'stable',
        trendReason: 'QuickTurn AR visualizer tool driving strong retail counter conversion',
        marketHub: 'National Retail Studios',
      },
      {
        id: 'tile-agl-nitco',
        category: 'National',
        subCategory: 'National Giants',
        brandName: 'Asian Granito India (AGL) & Nitco Tiles',
        keyVariantsAndDescription:
          'Known for large-format porcelain slabs and luxury marble tiles.',
        recommendedUse:
          'Luxury seamless book-matched wall cladding, large porcelain slabs, and premium villas.',
        isCodeRef: 'IS 15622 Group B1a',
        spotPrice: 95,
        unit: 'sq.ft (1200x1800mm)',
        minPrice: 82,
        maxPrice: 125,
        changePercent: 1.5,
        trend: 'up',
        trendReason: 'Surging luxury villa demand for Italian-format continuous porcelain slabs',
        marketHub: 'Luxury Architectural Studios',
      },

      // Regional & Export-Driven Brands
      {
        id: 'tile-simpolo-varmora',
        category: 'Regional',
        subCategory: 'Regional & Export-Driven Brands',
        brandName: 'Simpolo Ceramics & Varmora Granito',
        keyVariantsAndDescription:
          'Top-tier players from Gujarat with nationwide retail chains.',
        recommendedUse:
          'Export-quality rectified vitrified tiles, designer wash basins, and architectural porcelain.',
        isCodeRef: 'IS 15622 / ISO 13006',
        spotPrice: 76,
        unit: 'sq.ft (1200x600mm)',
        minPrice: 65,
        maxPrice: 92,
        changePercent: 0.2,
        trend: 'stable',
        trendReason: 'Direct Morbi manufacturing scale with European continuous pressing technology',
        marketHub: 'Gujarat & Pan-India Franchises',
      },
      {
        id: 'tile-naveen-aparna',
        category: 'Regional',
        subCategory: 'Regional & Export-Driven Brands',
        brandName: 'Naveen Tiles (Aparna Group)',
        keyVariantsAndDescription:
          'Dominant regional tile brand across South India.',
        recommendedUse:
          'South India residential projects, developer villas, utility areas, and commercial campuses.',
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
      {
        id: 'tile-cera-bajaj',
        category: 'Regional',
        subCategory: 'Regional & Export-Driven Brands',
        brandName: 'Cera Sanitaryware & Bajaj Tiles',
        keyVariantsAndDescription:
          'Strong nationwide presence in budget and mid-segment floor/wall finishes.',
        recommendedUse:
          'Budget-friendly housing developments, rental apartments, and fast-track bathroom revamps.',
        isCodeRef: 'IS 15622 Ceramic',
        spotPrice: 58,
        unit: 'sq.ft (600x600mm)',
        minPrice: 50,
        maxPrice: 72,
        changePercent: -1.1,
        trend: 'down',
        trendReason: 'Cost-optimized retail builder bundles with sanitaryware suites',
        marketHub: 'National Mid-Segment Network',
      },
    ],
  },

  // =========================================================================
  // 6. PAINT, PROTECTIVE COATINGS & WATERPROOFING
  // =========================================================================
  {
    id: 'guide-paints',
    sectionNumber: 6,
    title: '6. Paint, Protective Coatings & Waterproofing',
    shortTitle: 'Paints & Waterproofing',
    category: 'Finishes & Surfaces',
    applicableNormIds: [
      'norm-interior-paint',
      'norm-exterior-paint',
      'norm-enamel-paint',
      'norm-dampproof-coating',
      'norm-wall-putty',
      'norm-wall-primer',
    ],
    description:
      'Interior luxury emulsions, exterior weather-guard coatings, elastomeric waterproofing, and heavy commercial construction chemicals conforming to IS 15489, IS 2645, and IS 9103.',
    isCodeStandards: [
      'IS 15489:2004 (Plastic Emulsion Paint)',
      'IS 2932:2013 (Enamel Paint)',
      'IS 2645 (Integral Cement Waterproofing)',
      'IS 15801 (Elastomeric Waterproofing Membrane)',
      'IS 9103 (Concrete Admixtures)',
    ],
    brands: [
      // National Decorative Leaders
      {
        id: 'paint-asian',
        category: 'National',
        subCategory: 'National Decorative Leaders',
        brandName: 'Asian Paints',
        keyVariantsAndDescription:
          'India’s largest paint maker (Apex Ultima, Royale, SmartCare).',
        recommendedUse:
          'Luxury interior living walls, anti-dirt exterior facade protection, and premium decorative finishes.',
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
        id: 'paint-berger',
        category: 'National',
        subCategory: 'National Decorative Leaders',
        brandName: 'Berger Paints',
        keyVariantsAndDescription:
          'Major national competitor (Silk, WeatherCoat, Express Painting).',
        recommendedUse:
          'Extreme weather-guard exterior protection, breathing emulsions, and automated painting services.',
        isCodeRef: 'IS 15489 / IS 2932',
        spotPrice: 375,
        unit: 'liter (Interior/Exterior Luxury)',
        minPrice: 340,
        maxPrice: 420,
        changePercent: 1.0,
        trend: 'up',
        trendReason: 'Strong consumer uptake for WeatherCoat anti-fungal exterior warranty packages',
        marketHub: 'National Retail Network',
      },
      {
        id: 'paint-nerolac',
        category: 'National',
        subCategory: 'National Decorative Leaders',
        brandName: 'Kansai Nerolac',
        keyVariantsAndDescription:
          'Leader in low-VOC, architectural, and industrial coatings.',
        recommendedUse:
          'Eco-conscious green homes, anti-bacterial healthcare interiors, and heavy protective metal coatings.',
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
        id: 'paint-jsw-dulux',
        category: 'National',
        subCategory: 'National Decorative Leaders',
        brandName: 'JSW Paints & Dulux (AkzoNobel)',
        keyVariantsAndDescription:
          'Fast-growing national paint options.',
        recommendedUse:
          'Any-color-one-price interior styling, velvety washable walls, and high-opacity architectural primers.',
        isCodeRef: 'IS 15489 / IS 101',
        spotPrice: 360,
        unit: 'liter (Interior/Exterior Luxury)',
        minPrice: 325,
        maxPrice: 400,
        changePercent: 0.5,
        trend: 'stable',
        trendReason: 'Disruptive uniform tinting pricing model attracting residential remodelers',
        marketHub: 'National Color Studios',
      },
      {
        id: 'paint-birla-opus',
        category: 'National',
        subCategory: 'National Decorative Leaders',
        brandName: 'Birla Opus Paints (Aditya Birla Group / Grasim)',
        keyVariantsAndDescription:
          'Flagship decorative & protective coating brand by Grasim Industries (Aditya Birla Group). Complete spectrum: Calista (Ultra-Luxury Emulsion), One (Luxury Interior & Exterior), Style (Premium Emulsion), Prime (Economy Emulsion), AllDry (Elastomeric Waterproofing), and Birla White Wall Care Putty.',
        recommendedUse:
          'Architectural luxury living rooms, high-durability exterior weather facades, 10-year damp-barrier waterproofing, and seamless surface skimming.',
        isCodeRef: 'IS 15489:2004 / IS 5410 / GreenPro Certified',
        spotPrice: 345,
        unit: 'liter (Luxury Emulsion)',
        minPrice: 310,
        maxPrice: 395,
        changePercent: -1.2,
        trend: 'down',
        trendReason: 'Disruptive launch pricing, dealer tinting incentives, and massive automated plant capacity (1,332 MLPA)',
        marketHub: 'Pan-India Birla Opus Dealerships & Color World Depots',
      },

      // Waterproofing & Construction Chemicals
      {
        id: 'chem-dr-fixit',
        category: 'National',
        subCategory: 'Waterproofing & Construction Chemicals',
        brandName: 'Dr. Fixit (Pidilite)',
        keyVariantsAndDescription:
          'Undisputed market leader for residential waterproofing (Raincoat, LW+).',
        recommendedUse:
          'Integral concrete waterproofing (LW+), roof terrace coatings (Raincoat), and damp-proof bathroom sealing.',
        isCodeRef: 'IS 2645 / IS 15801',
        spotPrice: 185,
        unit: 'liter / kg',
        minPrice: 165,
        maxPrice: 215,
        changePercent: 1.8,
        trend: 'up',
        trendReason: 'Pre-monsoon preventive waterproofing season demand across urban centers',
        marketHub: 'Pan-India Hardware & Paint Counters',
      },
      {
        id: 'chem-sika-fosroc',
        category: 'National',
        subCategory: 'Waterproofing & Construction Chemicals',
        brandName: 'Sika India & Fosroc',
        keyVariantsAndDescription:
          'Global/national benchmarks for heavy commercial structural waterproofing and concrete admixtures.',
        recommendedUse:
          'Basement retention waterproofing, injection grouting, expansion joint sealants, and high-range superplasticizers.',
        isCodeRef: 'IS 9103 / ASTM C494',
        spotPrice: 260,
        unit: 'kg / liter',
        minPrice: 230,
        maxPrice: 310,
        changePercent: 0.7,
        trend: 'stable',
        trendReason: 'Institutional benchmark specifications in commercial basements and bridges',
        marketHub: 'Specialized Civil Chemical Distributors',
      },

      // Regional Players
      {
        id: 'paint-indigo',
        category: 'Regional',
        subCategory: 'Regional Players',
        brandName: 'Indigo Paints',
        keyVariantsAndDescription:
          'Distinctive regional player known for floor coat emulsions and specialty paints.',
        recommendedUse:
          'Tile coats, driveway finishes, exterior metallic highlights, and decorative stucco.',
        isCodeRef: 'IS 15489',
        spotPrice: 325,
        unit: 'liter (Interior/Exterior)',
        minPrice: 295,
        maxPrice: 365,
        changePercent: -0.4,
        trend: 'stable',
        trendReason: 'Strong niche dominance in floor emulsions and tile coatings in Kerala and West India',
        marketHub: 'South & Western Retail Channels',
      },
      {
        id: 'paint-nippon',
        category: 'Regional',
        subCategory: 'Regional Players',
        brandName: 'Nippon Paint',
        keyVariantsAndDescription: 'Strong market share in South India.',
        recommendedUse:
          'Odorless interior paints, heat-reflective coatings, and South India high-humidity protection.',
        isCodeRef: 'IS 15489 / Green Label',
        spotPrice: 340,
        unit: 'liter (Interior/Exterior)',
        minPrice: 310,
        maxPrice: 380,
        changePercent: 0.8,
        trend: 'up',
        trendReason: 'Japanese eco-formulation technology driving premium South India adoption',
        marketHub: 'South India (TN, Karnataka, Kerala, AP)',
      },
      {
        id: 'paint-shalimar',
        category: 'Regional',
        subCategory: 'Regional Players',
        brandName: 'Shalimar Paints',
        keyVariantsAndDescription: 'India’s oldest heritage paint manufacturer.',
        recommendedUse:
          'Heritage building restoration, heavy industrial coatings, and economical residential repainting.',
        isCodeRef: 'IS 2932 / IS 133',
        spotPrice: 295,
        unit: 'liter (Interior/Exterior)',
        minPrice: 270,
        maxPrice: 335,
        changePercent: -1.5,
        trend: 'down',
        trendReason: 'Economical volume pricing for commercial repaint contracts',
        marketHub: 'Heritage & Regional Industrial Depots',
      },
    ],
  },

  // =========================================================================
  // 7. GLASS & GLAZING BRANDS (FENESTRATION STANDARDS)
  // =========================================================================
  {
    id: 'guide-glass',
    sectionNumber: 7,
    title: '7. Glass & Glazing Brands',
    shortTitle: 'Glass & Glazing',
    category: 'Fenestration & Glass',
    applicableNormIds: ['norm-windows-dgu'],
    description:
      'Energy-efficient Low-E architectural glass, solar control double glazed units (DGU), and safety glazing conforming to IS 2553 and NBC 2016.',
    isCodeStandards: [
      'IS 2553:2019 (Safety Glass for Architectural Use)',
      'NBC 2016 Part 8 / ECBC Compliance',
    ],
    brands: [
      {
        id: 'glass-saintgobain-ais',
        category: 'National',
        subCategory: 'National Market Leaders',
        brandName: 'Saint-Gobain & AIS',
        keyVariantsAndDescription:
          'High-performance architectural glass, energy-efficient glazing, and float glass.',
        recommendedUse:
          'Curtain walls, Low-E double glazing units (DGU), acoustic facade windows, and sky-lights.',
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
        subCategory: 'National Giants',
        brandName: 'Guardian & Gold Plus',
        keyVariantsAndDescription:
          'Toughened safety glass, laminated coatings, and homegrown float glass.',
        recommendedUse:
          'Frameless glass balustrades, shower enclosures, storefronts, and laminated safety partitions.',
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
        subCategory: 'Regional & Export-Driven Brands',
        brandName: 'Sejal & FUSO Glass',
        keyVariantsAndDescription:
          'Custom architectural processors for insulated and curved glazing units.',
        recommendedUse:
          'Bespoke curved glass corners, custom ceramic fritted facades, and regional specialized glazing.',
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
    subCategory?: string;
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
      subCategory: b.subCategory,
      sectionTitle: section.title,
      normIds: section.applicableNormIds,
    };
  });
});

/**
 * Find spot price for a brand string (supports substring matching)
 */
export function getBrandSpotRate(
  brandName?: string
):
  | {
      spotPrice: number;
      unit: string;
      trend: 'up' | 'down' | 'stable';
      changePercent: number;
      category: 'National' | 'Regional';
      subCategory?: string;
    }
  | undefined {
  if (!brandName) return undefined;
  const target = brandName.toLowerCase();

  for (const [key, val] of Object.entries(MASTER_BRAND_SPOT_PRICES)) {
    if (
      key.toLowerCase() === target ||
      target.includes(key.toLowerCase()) ||
      key.toLowerCase().includes(target)
    ) {
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
      subCategory: found.subCategory,
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
    section.brands.forEach((brand) => {
      result.push({
        id: `guide-lmp-${brand.id}`,
        name: `${section.shortTitle}: ${brand.brandName} (${brand.subCategory || brand.category})`,
        category: section.category,
        brands: [brand.brandName],
        unit: brand.unit,
        currentPrice: brand.spotPrice,
        minPrice: brand.minPrice,
        maxPrice: brand.maxPrice,
        changePercent: brand.changePercent,
        trend: brand.trend,
        trendReason:
          brand.trendReason || `${brand.subCategory || brand.category} manufacturer benchmark pricing`,
        location: brand.marketHub || 'National / Regional Distribution',
        updatedAt: new Date().toISOString(),
        marketNotes: `${brand.keyVariantsAndDescription} | Standards: ${
          brand.isCodeRef || section.isCodeStandards.join(', ')
        }. ${brand.recommendedUse ? 'Recommended for ' + brand.recommendedUse : ''}`,
        isMasterGuideBrand: true,
        brandCategory: brand.category,
        subCategory: brand.subCategory,
        sectionId: section.id,
      });
    });
  });
  return result;
}
