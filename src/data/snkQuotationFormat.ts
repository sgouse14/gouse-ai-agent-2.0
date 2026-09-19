import { BOQItem, BuildingFloor, Project } from '../types';

export interface SNKMaterialPrice {
  id: string;
  name: string;
  category: string;
  specification: string;
  unit: string;
  basicPrice: number;
  priceRange?: string;
  brand: string;
  scopeNotes: string;
}

export interface SNKPaymentMilestone {
  stageNumber: string;
  milestone: string;
  percentage: number;
  amount: number;
  workIncluded: string;
}

export interface SNKProjectSpecification {
  contractor: {
    name: string;
    designation: string;
    address: string;
    phones: string[];
    projectManager: string;
    proprietor: string;
  };
  client: {
    name: string;
    projectType: string;
    location: string;
    description: string;
    quotationDate: string;
  };
  areaConcept: {
    siteAreaSqFt: number;
    totalBuiltUpAreaSqFt: number;
    ratePer100SqFt: number;
    ratePerSqFt: number;
    totalQuotationAmount: number;
    measurementBasis: string;
    costExcludesGST: boolean;
    levels: {
      id: string;
      code: string;
      name: string;
      areaSqFt: number;
      percentage: number;
      clearHeightFt: number;
      description: string;
    }[];
  };
}

export const SNK_PROJECT_SPEC: SNKProjectSpecification = {
  contractor: {
    name: 'SNK Associates',
    designation: 'Engineers & Architectural Designs',
    address: '#17/3, Ashokapuram Main Road, Industrial Sub-urb, Yeshwantapura, Bengaluru - 85859',
    phones: ['94480 01541', '63605 85859'],
    projectManager: 'Mr. Giddappa',
    proprietor: 'Mr. Giddappa',
  },
  client: {
    name: 'Mr. Santhosh Hiremath',
    projectType: 'Residential Building (Turnkey Planning & Construction)',
    location: 'Banashankari, Bengaluru',
    description: 'Turnkey Construction of G+2 Residential Building with Roof Mumty',
    quotationDate: '09-11-2025',
  },
  areaConcept: {
    siteAreaSqFt: 1200.0,
    totalBuiltUpAreaSqFt: 3599.0,
    ratePer100SqFt: 210000,
    ratePerSqFt: 2100,
    totalQuotationAmount: 7557900,
    measurementBasis: 'Slab to Slab Area (Roof Area)',
    costExcludesGST: true,
    levels: [
      {
        id: 'ground_floor',
        code: 'GF',
        name: 'Ground Floor (Level 0)',
        areaSqFt: 1200.0,
        percentage: 33.34,
        clearHeightFt: 10.0,
        description: 'Living, Kitchen, Dining, Pooja room, 1 Bedroom, Bath, and Portico parking',
      },
      {
        id: 'first_floor',
        code: 'FF',
        name: 'First Floor (Level 1)',
        areaSqFt: 1200.0,
        percentage: 33.34,
        clearHeightFt: 10.0,
        description: '2 Bedrooms with attached Bathrooms, Family Lounge, Balcony, and external stairs',
      },
      {
        id: 'second_floor',
        code: 'SF',
        name: 'Second Floor (Level 2)',
        areaSqFt: 1199.0,
        percentage: 33.32,
        clearHeightFt: 10.0,
        description: 'Master Suite, Guest Bedroom, Balcony deck, and terrace access',
      },
    ],
  },
};

export const SNK_BUILDING_FLOORS: BuildingFloor[] = [
  {
    id: 'substructure',
    name: 'Substructure & Foundation',
    shortCode: 'SUB',
    levelIndex: -1,
    elevation: '-2.50m',
    areaSqFt: 1200,
    heightMeters: 2.5,
    description: 'Earth work, footing, pedestal with pillar casting, stone masonry, RCC plinth beams & PCC for flooring',
  },
  {
    id: 'ground_floor',
    name: 'Ground Floor (GF)',
    shortCode: 'GF',
    levelIndex: 0,
    elevation: '±0.00m',
    areaSqFt: 1200,
    heightMeters: 3.05, // 10'ft clear
    description: '10ft clear height, 6" CCB external & 4" CCB partition walls, 5" M20 RCC roof slab, Teak main door, granite flooring',
  },
  {
    id: 'first_floor',
    name: 'First Floor (FF)',
    shortCode: 'FF',
    levelIndex: 1,
    elevation: '+3.05m',
    areaSqFt: 1200,
    heightMeters: 3.05,
    description: '10ft clear height, 5" M20 RCC slab, bedrooms, flush doors, WPC toilet doors, balcony with 16G MS railing',
  },
  {
    id: 'second_floor',
    name: 'Second Floor (SF)',
    shortCode: 'SF',
    levelIndex: 2,
    elevation: '+6.10m',
    areaSqFt: 1199,
    heightMeters: 3.05,
    description: '10ft clear height, 5" M20 RCC roof slab, bedroom suites, bathroom digital tiles up to roof, balconies',
  },
  {
    id: 'terrace',
    name: 'Terrace & Overhead Tank Room',
    shortCode: 'RF',
    levelIndex: 3,
    elevation: '+9.15m',
    areaSqFt: 1200,
    heightMeters: 1.07, // 3'6" parapet
    description: 'Stair room/mumty, 1000L PVC water tank on MS platform with 10ft ladder, 3" cement mortar waterproofing & 3\'6" parapet',
  },
];

export const SNK_BASIC_MATERIAL_PRICES: SNKMaterialPrice[] = [
  {
    id: 'snk-mat-01',
    name: 'JSW NEO Fe555 TMT Reinforcement Steel',
    category: 'Structural Steel',
    specification: 'High ductility Fe555 grade TMT bars for RCC roof, beams, columns and footings',
    unit: 'Kg',
    basicPrice: 60.0,
    priceRange: '₹60 – ₹62 / Kg',
    brand: 'JSW NEO Fe555',
    scopeNotes: 'Basic rate Rs. 60/- per kg included. Variation will be informed & adjusted.',
  },
  {
    id: 'snk-mat-02',
    name: 'Ultratech OPC Cement (Roof Concrete)',
    category: 'Cement',
    specification: 'Ordinary Portland Cement (OPC 53 Grade) for RCC roof slab casting & structural frame',
    unit: 'Bag (50kg)',
    basicPrice: 385.0,
    priceRange: '₹380 – ₹400 / Bag',
    brand: 'Ultratech OPC',
    scopeNotes: 'Specifically used for all roof concrete and column casting.',
  },
  {
    id: 'snk-mat-03',
    name: 'Ultratech PPC Cement (Masonry & Plaster)',
    category: 'Cement',
    specification: 'Portland Pozzolana Cement (PPC) for all masonry, internal/external plastering & flooring bed',
    unit: 'Bag (50kg)',
    basicPrice: 360.0,
    priceRange: '₹350 – ₹380 / Bag',
    brand: 'Ultratech PPC',
    scopeNotes: 'All masonry blockwork, plastering coats with chicken mesh & tiling bed.',
  },
  {
    id: 'snk-mat-04',
    name: '6" Cement Concrete Blocks (CCB) - Main Walls',
    category: 'Masonry Blocks',
    specification: '6" thick CCB heavy-duty cement concrete blocks for all main external peripheral walls & parapet',
    unit: 'No.',
    basicPrice: 38.0,
    brand: 'CCB Heavy Duty',
    scopeNotes: 'Basic rate Rs. 38/piece for all external load & shear partition walls.',
  },
  {
    id: 'snk-mat-05',
    name: '4" Cement Concrete Blocks (CCB) - Partition Walls',
    category: 'Masonry Blocks',
    specification: '4" thick CCB cement concrete blocks for internal room and toilet partition walls',
    unit: 'No.',
    basicPrice: 33.0,
    brand: 'CCB Partition',
    scopeNotes: 'Basic rate Rs. 33/piece for internal layout partitions.',
  },
  {
    id: 'snk-mat-06',
    name: 'Double Washed M-Sand (Masonry & RCC)',
    category: 'Sand',
    specification: 'Double washed manufactured sand for structural RCC concrete casting and block masonry',
    unit: 'MT',
    basicPrice: 1000.0,
    brand: 'Double Washed M-Sand',
    scopeNotes: 'Rs. 1,000/- per MT for structural & masonry works.',
  },
  {
    id: 'snk-mat-07',
    name: 'Double Washed M-Sand (Plastering Work)',
    category: 'Sand',
    specification: 'Fine graded washed plastering sand for smooth internal & sponge external wall finishes',
    unit: 'MT',
    basicPrice: 1300.0,
    brand: 'Plastering M-Sand',
    scopeNotes: 'Rs. 1,300/- per MT for 1:6 cement mortar plastering.',
  },
  {
    id: 'snk-mat-08',
    name: '20mm / 12mm Graded Granite Aggregate',
    category: 'Aggregates',
    specification: 'Clean crushed blue granite metal (20mm & 12mm) for M20 concrete roof slabs and columns',
    unit: 'MT',
    basicPrice: 750.0,
    brand: 'Crushed Granite 20mm/12mm',
    scopeNotes: 'Basic rate Rs. 750/- per MT.',
  },
  {
    id: 'snk-mat-09',
    name: 'Burma Border Teak Wood (Main & Pooja Doors)',
    category: 'Wood & Joinery',
    specification: 'Burma border seasoned teakwood for 5"x4" Main Door (7\'x3.5\') and 5"x3" Pooja Door (7\'x3\') with 1.25" shutters',
    unit: 'Cft',
    basicPrice: 4500.0,
    brand: 'Burma Border Teak',
    scopeNotes: 'Basic rate Rs. 4,500/- per cft. 1.25" thick shutters with PU polish included.',
  },
  {
    id: 'snk-mat-10',
    name: 'Honne Wood (Window Shutters)',
    category: 'Wood & Joinery',
    specification: 'Seasoned Honne wood for 3"x1.5" window shutters with 12mm bright hexagonal rods',
    unit: 'Cft',
    basicPrice: 2500.0,
    brand: 'Seasoned Honne',
    scopeNotes: 'Basic rate Rs. 2,500/- per cft.',
  },
  {
    id: 'snk-mat-11',
    name: 'Sal Wood (Door Frames)',
    category: 'Wood & Joinery',
    specification: '5"x3" Saal wood section for bedroom door frames and window outer frames',
    unit: 'Cft',
    basicPrice: 1500.0,
    brand: 'Malaysian / Indian Sal',
    scopeNotes: 'Basic rate Rs. 1,500/- per cft with enamel paint.',
  },
  {
    id: 'snk-mat-12',
    name: 'Granite Flooring (Living, Dining, Kitchen, Pooja, Steps)',
    category: 'Flooring',
    specification: 'High gloss polished 20mm granite slabs with border inlays for all main floors and internal stairs',
    unit: 'Sq.Ft',
    basicPrice: 100.0,
    brand: 'Polished Granite (incl. GST)',
    scopeNotes: 'Basic rate Rs. 100/- per sq.ft including GST. Owner pays difference if higher rate selected.',
  },
  {
    id: 'snk-mat-13',
    name: '40mm Heavy Kitchen Platform Granite',
    category: 'Countertops',
    specification: '40mm double-chamfered edge polished granite for kitchen cooking platform',
    unit: 'Sq.Ft',
    basicPrice: 150.0,
    brand: 'Black / Galaxy Granite 40mm',
    scopeNotes: 'Basic rate Rs. 150/- per sq.ft for kitchen cooking platform.',
  },
  {
    id: 'snk-mat-14',
    name: 'Digital / Glazed Wall Tiles (Bath, Pooja, Kitchen)',
    category: 'Wall Tiles',
    specification: '1\'x2\' digital glazed ceramic wall tiles up to roof ceiling height in toilets/pooja and 2\'6" in kitchen',
    unit: 'Sq.Ft',
    basicPrice: 40.0,
    brand: 'Digital Glazed 1\'x2\'',
    scopeNotes: 'Basic rate Rs. 40/- per sq.ft up to full ceiling height in all bathrooms.',
  },
  {
    id: 'snk-mat-15',
    name: 'Vitrified / Anti-Skid Floor Tiles (Bathroom & Balcony)',
    category: 'Flooring',
    specification: '1\'x1\' anti-skid vitrified / terracotta matte tiles for bathroom floors and exterior balconies',
    unit: 'Sq.Ft',
    basicPrice: 40.0,
    brand: 'Vitrified Anti-Skid 1\'x1\'',
    scopeNotes: 'Basic rate Rs. 40/- per sq.ft.',
  },
  {
    id: 'snk-mat-16',
    name: 'Pre-Laminated Flush Doors (Bedrooms)',
    category: 'Doors & Shutters',
    specification: '30mm pre-laminated water-resistant solid core flush door shutters (7\'x3\')',
    unit: 'Sq.Ft',
    basicPrice: 135.0,
    brand: 'Pre-Laminated Flush',
    scopeNotes: 'Basic rate Rs. 135/- per sq.ft with Europa cylindrical lock (Rs. 750).',
  },
  {
    id: 'snk-mat-17',
    name: 'WPC Waterproof Doors (Bathrooms)',
    category: 'Doors & Shutters',
    specification: 'Wood & Plastic Composite (WPC) door frame and waterproof panels (7\'x2.5\')',
    unit: 'Sq.Ft',
    basicPrice: 175.0,
    brand: 'WPC Composite Panels',
    scopeNotes: 'Basic rate Rs. 175/- per sq.ft with Europa toilet lock (Rs. 600).',
  },
  {
    id: 'snk-mat-18',
    name: 'Plumbing Sanitary Fixtures Package (Per Bathroom)',
    category: 'Plumbing & Sanitary',
    specification: 'Floor mounted commode, external flush tank, health faucet, wall mixer, shower, wash basin, pillar cock, angle cocks',
    unit: 'Set / Toilet',
    basicPrice: 20000.0,
    brand: 'Parryware / Cera / Essco',
    scopeNotes: 'Rs. 20,000/- per toilet allowance. Company warranty provided.',
  },
  {
    id: 'snk-mat-19',
    name: 'Water Storage & Overhead PVC Tank',
    category: 'Plumbing & Tanks',
    specification: '1,000 Ltrs 3/4-layered PVC overhead tank with MS platform (6" ht) & moveable 10ft MS ladder',
    unit: 'Litre',
    basicPrice: 5.5,
    brand: '3/4 Layered PVC 1,000L',
    scopeNotes: 'Rs. 5.50/- per liter. Sump tank 6,000 Ltrs with 8" CCB wall included (extra @ Rs. 15/L).',
  },
  {
    id: 'snk-mat-20',
    name: 'Asian Paints Premium Emulsion & Apex Ultima',
    category: 'Painting',
    specification: 'Internal: Primer + 3 coats putty + 2 coats Asian Paints Premium Emulsion. External: Primer + 2 coats Apex/Ultima',
    unit: 'Sq.Ft',
    basicPrice: 32.0,
    brand: 'Asian Paints Premium',
    scopeNotes: 'Enamel paint for grills, gates and windows included.',
  },
];

export const SNK_PAYMENT_MILESTONES: SNKPaymentMilestone[] = [
  {
    stageNumber: '1',
    milestone: 'Advance with Agreement to Start Work',
    percentage: 20.0,
    amount: 1511580,
    workIncluded: 'Earthwork, footing, pedestal with pillar casting, stone masonry for foundation, RCC plinth beams & PCC for flooring',
  },
  {
    stageNumber: '2',
    milestone: 'Ground Floor Wall & GF RCC Roof Cast',
    percentage: 12.0,
    amount: 906948,
    workIncluded: 'GF 6"/4" CCB walls, electrical conduit & switch boxes, plumbing rough-in & 5" M20 roof slab cast',
  },
  {
    stageNumber: '3',
    milestone: 'First Floor Wall & 1F RCC Roof Cast',
    percentage: 12.0,
    amount: 906948,
    workIncluded: 'FF block masonry, lintels with chajjas, balcony framing & 1F RCC roof slab cast',
  },
  {
    stageNumber: '4',
    milestone: 'Second Floor Wall & 2F RCC Roof Cast',
    percentage: 12.0,
    amount: 906948,
    workIncluded: 'SF walls, lintels, lofts, conduits & 2F RCC roof slab cast',
  },
  {
    stageNumber: '5',
    milestone: 'Third Floor / Terrace Tank Room & Stair Room',
    percentage: 6.0,
    amount: 453474,
    workIncluded: 'Staircase head room (mumty), overhead tank room & parapet wall masonry up to 3\'6"',
  },
  {
    stageNumber: '6',
    milestone: 'Wood Procurement & Seasoning Advance',
    percentage: 6.0,
    amount: 453474,
    workIncluded: 'Burma border Teak wood, Sal wood frames & Honne wood purchase early for seasoning before framing',
  },
  {
    stageNumber: '7',
    milestone: 'Plastering Work (Internal & External)',
    percentage: 10.0,
    amount: 755790,
    workIncluded: 'CM 1:6 mortar internal smooth plastering, external sponge finish & chicken mesh at RCC/CCB joints',
  },
  {
    stageNumber: '8',
    milestone: 'Granite & Tile Purchase & Laying',
    percentage: 10.0,
    amount: 755790,
    workIncluded: 'Living/dining/pooja/stairs granite (Rs.100/sft), 1\'x2\' bathroom wall tiles up to roof, 40mm kitchen counter',
  },
  {
    stageNumber: '9',
    milestone: 'Railing, Grill & Painting Work',
    percentage: 5.0,
    amount: 377895,
    workIncluded: '16G MS staircase & balcony railings, window grills, Asian Paints 3 coats putty + 2 coats emulsion',
  },
  {
    stageNumber: '10',
    milestone: 'Wiring, Plumbing Fittings & Door Shutters',
    percentage: 5.0,
    amount: 377895,
    workIncluded: 'Finolex FR copper wiring, MCB boards per floor, Rs.20,000/toilet fittings, Europa locks & WPC doors',
  },
  {
    stageNumber: '11',
    milestone: 'Final Finishing Before Handover to Owner',
    percentage: 2.0,
    amount: 151158,
    workIncluded: 'Pressure leakage test (4-5 hrs), thorough deep cleaning, fixture commissioning & formal handover',
  },
];

/**
 * Standard BOQ items calibrated directly to the SNK Associates Quotation
 * totaling exactly ₹75,57,900 for 3,599 sq.ft built-up area across
 * Substructure, Ground Floor, First Floor, Second Floor, and Terrace.
 */
export function getSNKStandardBOQItems(): BOQItem[] {
  return [
    // 1. Earthwork & Foundation Substructure
    {
      id: 'snk-boq-01',
      name: 'Earthwork Excavation & Footing Trenching',
      category: 'Substructure Works',
      stage: 'Substructure',
      unit: 'CFT',
      quantity: 5800,
      rate: 12.0,
      amount: 69600,
      notes: 'Earthwork excavation in soil up to 5ft depth as per structural footing layout. (Extra soil/rock extra as per quote).',
      floorBreakdown: {
        substructure: 5800,
        ground_floor: 0,
        first_floor: 0,
        second_floor: 0,
        terrace: 0,
      },
    },
    {
      id: 'snk-boq-02',
      name: 'PCC (1:4:8) Sub-base Bed Concrete',
      category: 'Substructure Works',
      stage: 'Substructure',
      unit: 'CFT',
      quantity: 950,
      rate: 200.0,
      amount: 190000,
      notes: 'Plain cement concrete 1:4:8 under foundation footings, plinth beams, and ground floor flooring bed.',
      floorBreakdown: {
        substructure: 750,
        ground_floor: 200,
        first_floor: 0,
        second_floor: 0,
        terrace: 0,
      },
    },
    {
      id: 'snk-boq-03',
      name: 'Size Stone Masonry (SSM) for Foundation Footings',
      category: 'Substructure Works',
      stage: 'Substructure',
      unit: 'CFT',
      quantity: 1650,
      rate: 250.0,
      amount: 412500,
      notes: 'Granite size stone masonry in CM 1:6 for foundation walls, basement boundary and basement load-bearing bed.',
      floorBreakdown: {
        substructure: 1650,
        ground_floor: 0,
        first_floor: 0,
        second_floor: 0,
        terrace: 0,
      },
    },

    // 2. RCC Structural Works (Ultratech OPC & JSW NEO Fe555 Steel)
    {
      id: 'snk-boq-04',
      name: 'JSW NEO Fe555 TMT Reinforcement Steel',
      category: 'Concrete Works',
      stage: 'Superstructure',
      unit: 'Kg',
      quantity: 14750,
      rate: 61.0, // basic Rs. 60-62
      amount: 899750,
      notes: 'JSW NEO Fe555 high ductility rebar for footings, columns, beams, staircase and 5" roof slabs (~4.1 kg/sq.ft).',
      floorBreakdown: {
        substructure: 3600,
        ground_floor: 4500,
        first_floor: 3800,
        second_floor: 2500,
        terrace: 350,
      },
    },
    {
      id: 'snk-boq-05',
      name: 'Ultratech OPC M20 RCC Structural Concrete',
      category: 'Concrete Works',
      stage: 'Superstructure',
      unit: 'CFT',
      quantity: 3450,
      rate: 300.0,
      amount: 1035000,
      notes: 'M20 grade concrete with Ultratech OPC cement, double washed M-Sand & 20mm aggregate for columns, beams & 5" roof slabs.',
      floorBreakdown: {
        substructure: 800,
        ground_floor: 1050,
        first_floor: 950,
        second_floor: 550,
        terrace: 100,
      },
    },

    // 3. Block Masonry (6" CCB & 4" CCB)
    {
      id: 'snk-boq-06',
      name: '6" Thick CCB Masonry for External Main Walls',
      category: 'Masonry Works',
      stage: 'Superstructure',
      unit: 'Sq.Ft',
      quantity: 8400,
      rate: 90.0,
      amount: 756000,
      notes: 'Heavy duty 6" CCB blocks (Rs.38/no basic) in CM 1:6 with Ultratech PPC cement & M-Sand for all exterior walls & 3\'6" parapet.',
      floorBreakdown: {
        substructure: 0,
        ground_floor: 2800,
        first_floor: 2750,
        second_floor: 2200,
        terrace: 650,
      },
    },
    {
      id: 'snk-boq-07',
      name: '4" Thick CCB Masonry for Partition Walls',
      category: 'Masonry Works',
      stage: 'Superstructure',
      unit: 'Sq.Ft',
      quantity: 3600,
      rate: 75.0,
      amount: 270000,
      notes: '4" CCB partition blocks (Rs.33/no basic) in CM 1:4 with Ultratech PPC cement for internal room and toilet divisions.',
      floorBreakdown: {
        substructure: 0,
        ground_floor: 1300,
        first_floor: 1300,
        second_floor: 1000,
        terrace: 0,
      },
    },

    // 4. Plastering & Chicken Mesh
    {
      id: 'snk-boq-08',
      name: 'Internal & External Plastering with Chicken Mesh',
      category: 'Finishing Works',
      stage: 'Finishes',
      unit: 'Sq.Ft',
      quantity: 15200,
      rate: 50.0,
      amount: 760000,
      notes: 'CM 1:6 plastering with plastering M-Sand (Rs.1,300/MT). Smooth internal finish & external sponge finish. Chicken mesh at all RCC/CCB joints.',
      floorBreakdown: {
        substructure: 0,
        ground_floor: 5200,
        first_floor: 5100,
        second_floor: 4200,
        terrace: 700,
      },
    },

    // 5. Doors, Windows & Joinery (Burma Teak, Sal, Honne, WPC)
    {
      id: 'snk-boq-09',
      name: 'Burma Border Teakwood Main & Pooja Doors',
      category: 'Carpentry & Joinery',
      stage: 'Finishes',
      unit: 'Set',
      quantity: 2,
      rate: 78000.0,
      amount: 156000,
      notes: '5"x4" Teak frame for Main (7\'x3.5\') & 5"x3" for Pooja (7\'x3\') with 1.25" Teak shutters, PU polish, Europa lock (Rs.3000) & antique brass handles.',
      floorBreakdown: {
        substructure: 0,
        ground_floor: 2,
        first_floor: 0,
        second_floor: 0,
        terrace: 0,
      },
    },
    {
      id: 'snk-boq-10',
      name: 'Sal Wood Frames with Pre-Laminated Flush Doors',
      category: 'Carpentry & Joinery',
      stage: 'Finishes',
      unit: 'Set',
      quantity: 7,
      rate: 13500.0,
      amount: 94500,
      notes: '5"x3" Sal wood frames (Rs.1,500/cft) with 30mm pre-laminated flush door shutters (Rs.135/sft) & Europa cylindrical locks (Rs.750).',
      floorBreakdown: {
        substructure: 0,
        ground_floor: 2,
        first_floor: 3,
        second_floor: 2,
        terrace: 0,
      },
    },
    {
      id: 'snk-boq-11',
      name: 'Waterproof WPC Bathroom Doors',
      category: 'Carpentry & Joinery',
      stage: 'Finishes',
      unit: 'Set',
      quantity: 6,
      rate: 9800.0,
      amount: 58800,
      notes: 'WPC frame and wood-plastic composite shutter panels (Rs.175/sft, size 7\'x2.5\') with Europa keyless locks (Rs.600).',
      floorBreakdown: {
        substructure: 0,
        ground_floor: 2,
        first_floor: 2,
        second_floor: 2,
        terrace: 0,
      },
    },
    {
      id: 'snk-boq-12',
      name: 'Sal Wood Windows with Honne Shutters & 12mm Grills',
      category: 'Carpentry & Joinery',
      stage: 'Finishes',
      unit: 'Sq.Ft',
      quantity: 260,
      rate: 850.0,
      amount: 221000,
      notes: '5"x3" Sal frames, 3"x1.5" Honne shutters (Rs.2500/cft), 12mm hexagonal bright rod grills, enamel paint & UPVC bath ventilators.',
      floorBreakdown: {
        substructure: 0,
        ground_floor: 90,
        first_floor: 100,
        second_floor: 70,
        terrace: 0,
      },
    },

    // 6. Flooring & Tiling (Granite Rs.100, Tiles Rs.40, Platform Rs.150)
    {
      id: 'snk-boq-13',
      name: '20mm Granite Flooring (Living, Dining, Kitchen, Pooja, Steps)',
      category: 'Flooring Works',
      stage: 'Finishes',
      unit: 'Sq.Ft',
      quantity: 2450,
      rate: 135.0, // Rs.100 basic + laying/mortar/polishing
      amount: 330750,
      notes: 'Polished granite slabs (basic Rs.100/sft incl. GST) laid over CM mortar bed for living, kitchen, dining, pooja and internal stairs.',
      floorBreakdown: {
        substructure: 0,
        ground_floor: 950,
        first_floor: 900,
        second_floor: 600,
        terrace: 0,
      },
    },
    {
      id: 'snk-boq-14',
      name: '40mm Heavy Granite Kitchen Cooking Platform',
      category: 'Flooring Works',
      stage: 'Finishes',
      unit: 'Sq.Ft',
      quantity: 85,
      rate: 220.0, // Rs.150 basic + chamfering & support
      amount: 18700,
      notes: '40mm granite cooking platform (basic Rs.150/sft) with sink cut-out and double-chamfered polished edges.',
      floorBreakdown: {
        substructure: 0,
        ground_floor: 45,
        first_floor: 40,
        second_floor: 0,
        terrace: 0,
      },
    },
    {
      id: 'snk-boq-15',
      name: 'Digital Glazed Wall Tiles (Bathrooms & Pooja up to Roof)',
      category: 'Tile Works',
      stage: 'Finishes',
      unit: 'Sq.Ft',
      quantity: 2600,
      rate: 72.0, // Rs.40 basic + mortar/fixing/grouting
      amount: 187200,
      notes: '1\'x2\' digital glazed tiles (basic Rs.40/sft) up to roof slab ceiling height in bathrooms and pooja room, and 2\'6" above kitchen slab.',
      floorBreakdown: {
        substructure: 0,
        ground_floor: 900,
        first_floor: 950,
        second_floor: 750,
        terrace: 0,
      },
    },
    {
      id: 'snk-boq-16',
      name: '1\'x1\' Anti-Skid Vitrified Tiles (Toilets & Balconies)',
      category: 'Tile Works',
      stage: 'Finishes',
      unit: 'Sq.Ft',
      quantity: 650,
      rate: 70.0, // Rs.40 basic + mortar/fixing
      amount: 45500,
      notes: '1\'x1\' matte finish anti-skid ceramic/vitrified tiles (basic Rs.40/sft) for toilet flooring and balcony decks.',
      floorBreakdown: {
        substructure: 0,
        ground_floor: 220,
        first_floor: 240,
        second_floor: 190,
        terrace: 0,
      },
    },

    // 7. Railings & Steel Fabrication (MS 16G)
    {
      id: 'snk-boq-17',
      name: 'Mild Steel (MS 16G) Staircase & Balcony Railings',
      category: 'Metal Works',
      stage: 'Finishes',
      unit: 'RFT',
      quantity: 185,
      rate: 650.0,
      amount: 120250,
      notes: '3ft height MS 16G conventional type railings for internal staircase and exterior balconies with anti-corrosive primer and enamel paint.',
      floorBreakdown: {
        substructure: 0,
        ground_floor: 45,
        first_floor: 75,
        second_floor: 65,
        terrace: 0,
      },
    },

    // 8. Electrical Work (Finolex, Anchor Roma, Floor MCBs)
    {
      id: 'snk-boq-18',
      name: 'Finolex FR Copper Wiring & Anchor Modular Switches',
      category: 'Electrical Works',
      stage: 'Services',
      unit: 'Point',
      quantity: 210,
      rate: 1150.0,
      amount: 241500,
      notes: 'Finolex flame retardant copper wire with Anchor/Roma switches. Living: 2 fans, 4 lights, 4 plugs. Bed: 3 lights, 1 fan, 4 plugs + AC. AEH 4 sq.mm circuits.',
      floorBreakdown: {
        substructure: 0,
        ground_floor: 75,
        first_floor: 75,
        second_floor: 55,
        terrace: 5,
      },
    },
    {
      id: 'snk-boq-19',
      name: 'Dedicated Floor-wise MCB Distribution Boards',
      category: 'Electrical Works',
      stage: 'Services',
      unit: 'Set',
      quantity: 3,
      rate: 14500.0,
      amount: 43500,
      notes: 'Separate MCB board provided for each floor with Anchor/Havells isolators and individual lighting/power circuit breakers.',
      floorBreakdown: {
        substructure: 0,
        ground_floor: 1,
        first_floor: 1,
        second_floor: 1,
        terrace: 0,
      },
    },

    // 9. Plumbing & Sanitary (Ashirvad CPVC, Supreme PVC, Rs.20k/toilet)
    {
      id: 'snk-boq-20',
      name: 'CPVC Water Supply & PVC Drainage Lines (Ashirvad/Supreme)',
      category: 'Plumbing Works',
      stage: 'Services',
      unit: 'Lump Sum',
      quantity: 1,
      rate: 165000.0,
      amount: 165000,
      notes: 'Ashirvad/Astral CPVC for hot/cold water supply and Supreme PVC for sanitary drainage and rainwater stacks.',
      floorBreakdown: {
        substructure: 25000,
        ground_floor: 50000,
        first_floor: 50000,
        second_floor: 35000,
        terrace: 5000,
      },
    },
    {
      id: 'snk-boq-21',
      name: 'Sanitary Fixtures & CP Fittings (Rs. 20,000 / Toilet Package)',
      category: 'Plumbing Works',
      stage: 'Services',
      unit: 'Set',
      quantity: 6,
      rate: 20000.0,
      amount: 120000,
      notes: 'Floor mounted commode, external flush tank, health faucet, wall mixer, shower, wash basin, pillar cock, angle cocks (Rs.20,000/toilet allowance with company warranty).',
      floorBreakdown: {
        substructure: 0,
        ground_floor: 2,
        first_floor: 2,
        second_floor: 2,
        terrace: 0,
      },
    },
    {
      id: 'snk-boq-22',
      name: 'Kitchen Sink, Dining Wash Basin & Taps',
      category: 'Plumbing Works',
      stage: 'Services',
      unit: 'Set',
      quantity: 2,
      rate: 9500.0,
      amount: 19000,
      notes: 'Kitchen sink (Rs.4,000), Dining wash basin (Rs.2,000), Sink cock (Rs.1,500) and common washing machine tap points.',
      floorBreakdown: {
        substructure: 0,
        ground_floor: 1,
        first_floor: 1,
        second_floor: 0,
        terrace: 0,
      },
    },
    {
      id: 'snk-boq-23',
      name: '1,000L Overhead PVC Tank with MS Platform & 10ft Ladder',
      category: 'Plumbing Works',
      stage: 'Services',
      unit: 'Set',
      quantity: 1,
      rate: 18500.0,
      amount: 18500,
      notes: '1,000 Ltrs 3/4-layered PVC tank (Rs.5.5/L) with 6" MS platform and 10ft x 2ft moveable MS ladder on terrace.',
      floorBreakdown: {
        substructure: 0,
        ground_floor: 0,
        first_floor: 0,
        second_floor: 0,
        terrace: 1,
      },
    },
    {
      id: 'snk-boq-24',
      name: '6,000 Litres RCC/CCB Underground Sump Tank',
      category: 'Substructure Works',
      stage: 'Substructure',
      unit: 'Capacity (L)',
      quantity: 6000,
      rate: 15.0,
      amount: 90000,
      notes: '6,000 Ltrs capacity sump tank with 8" thick CCB walls, waterproof cement plaster and RCC top slab with manhole cover.',
      floorBreakdown: {
        substructure: 6000,
        ground_floor: 0,
        first_floor: 0,
        second_floor: 0,
        terrace: 0,
      },
    },

    // 10. Painting (Asian Paints Premium Emulsion & Apex)
    {
      id: 'snk-boq-25',
      name: 'Asian Paints Premium Internal Emulsion (Putty + 2 Coats)',
      category: 'Painting Works',
      stage: 'Finishes',
      unit: 'Sq.Ft',
      quantity: 11200,
      rate: 22.0,
      amount: 246400,
      notes: '1 coat primer, 3 coats wall putty, and 2 coats Asian Paints Premium Emulsion for all interior ceilings and walls.',
      floorBreakdown: {
        substructure: 0,
        ground_floor: 4100,
        first_floor: 4000,
        second_floor: 3100,
        terrace: 0,
      },
    },
    {
      id: 'snk-boq-26',
      name: 'Asian Paints Apex & Ultima Exterior Weatherproof Paint',
      category: 'Painting Works',
      stage: 'Finishes',
      unit: 'Sq.Ft',
      quantity: 4800,
      rate: 20.0,
      amount: 96000,
      notes: 'Exterior primer + 2 coats Asian Paints Apex for side walls & Ultima grade paint for front architectural elevation.',
      floorBreakdown: {
        substructure: 0,
        ground_floor: 1600,
        first_floor: 1600,
        second_floor: 1200,
        terrace: 400,
      },
    },

    // 11. Terrace Waterproofing & 3" Mortar Screed
    {
      id: 'snk-boq-27',
      name: '3" Cement Mortar Terrace Waterproofing Screed',
      category: 'Waterproofing Works',
      stage: 'Finishes',
      unit: 'Sq.Ft',
      quantity: 1200,
      rate: 48.0,
      amount: 57600,
      notes: '3" cement mortar with manufactured C sand, 12mm down gravel, 43 grade OPC and Fosroc/Roff chemical waterproofing integrated for terrace.',
      floorBreakdown: {
        substructure: 0,
        ground_floor: 0,
        first_floor: 0,
        second_floor: 0,
        terrace: 1200,
      },
    },
    {
      id: 'snk-boq-28',
      name: 'Toilet & Wet Area Integrated Chemical Waterproofing',
      category: 'Waterproofing Works',
      stage: 'Finishes',
      unit: 'Sq.Ft',
      quantity: 480,
      rate: 45.0,
      amount: 21600,
      notes: 'Fosroc/Roff/Bostik integrated chemical waterproofing coating and 4-5 hours pressure leakage testing before tiling.',
      floorBreakdown: {
        substructure: 0,
        ground_floor: 160,
        first_floor: 180,
        second_floor: 140,
        terrace: 0,
      },
    },
  ];
}
