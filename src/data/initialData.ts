import { Project, BOQItem, ProfessionalProfile, MarketplaceEnquiry, MaterialComparisonItem, LiveMaterialPrice } from '../types';

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-alvi-01',
    name: "ALVI's Palm Crest - Luxury Residence & Interiors",
    projectType: 'Architecture, Interior Design & Construction',
    location: 'Whitefield / Outer Ring Road, Bangalore',
    description: "Flagship turnkey project by ALVI's Architecture, Interior Designers & Construction. A 5,800 sq.ft contemporary residence featuring cantilevered concrete canopies, bespoke teakwood & brass interior millwork, smart home automation, open-plan Italian marble living spaces, and an earthquake-resistant RCC frame.",
    status: 'construction',
    builtUpAreaSqFt: 5800,
    files: [
      {
        id: 'file-alvi-01',
        name: 'ALVI_Architectural_Working_Drawings_L1_L2.pdf',
        size: '6.2 MB',
        type: 'application/pdf',
        uploadDate: '2026-03-12',
        extractedText: "ALVI'S ARCHITECTURE & CONSTRUCTION: Detailed architectural and structural working drawings. G+2 framed RCC structure with M30 grade concrete, Fe550D TMT bars. Column grid: 5.5m x 6.5m. Double height living zone with acoustic wood baffles and sunken court."
      },
      {
        id: 'file-alvi-02',
        name: 'ALVI_Luxury_Interior_Joinery_Schedule.dwg',
        size: '4.8 MB',
        type: 'drawing/dwg',
        uploadDate: '2026-03-12',
        extractedText: "ALVI'S INTERIOR DESIGN SPECIFICATIONS: European veneer paneling with concealed shadow gap joints, fluted charcoal wall claddings, Hafele soft-close hardware, quartz countertops, and layered indirect ambient LED cove illumination."
      },
      {
        id: 'file-alvi-03',
        name: 'ALVI_Turnkey_Construction_BOQ_Summary.xlsx',
        size: '1.1 MB',
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        uploadDate: '2026-03-12',
        extractedText: "ALVI'S CONSTRUCTION TAKEOFF: Substructure, RCC superstructure, blockwork, MEP rough-ins, waterproof membrane, imported flooring, and turnkey interior fit-out schedule."
      }
    ],
    analyses: [
      {
        id: 'analysis-alvi-01',
        title: "ALVI's Integrated Design & Construction Audit",
        timestamp: '2026-03-12T16:00:00Z',
        focus: 'Turnkey Architectural & Interior Synergy',
        analysis: `## 1. Executive Brief - ALVI's Palm Crest
Executed by **ALVI's Architecture, Interior Designers & Construction**, this project represents a unified design-to-build approach where architectural massing directly informs interior lighting and millwork detailing.

## 2. Three Pillars of Execution
- **Architecture**: Deep recessed window fenestrations with cantilevered sunshades minimize solar heat gain while creating dramatic shadow lines on the exterior facade.
- **Interior Design**: Seamless spatial flow connecting the double-height grand foyer to the central pool deck, featuring Italian Statuario marble, acoustic wood ceilings, and custom-crafted brass accents.
- **Construction**: Precision-cast M30 concrete frame with post-cured thermal sealants, 150mm lightweight block masonry, and multi-tier waterproofing with a 10-year turnkey warranty.`
      }
    ],
    members: [
      { id: 'mem-alvi-1', name: 'Ar. S. Gouse (Principal)', email: 'sgouse14@gmail.com', role: 'owner' },
      { id: 'mem-alvi-2', name: "ALVI's Construction Team", email: 'sgouse14@gmail.com', role: 'quantity_surveyor' }
    ],
    auditLogs: [
      { id: 'log-alvi-01', projectId: 'proj-alvi-01', actor: 'Ar. S. Gouse', action: 'Project Created', details: "Initialized ALVI's Palm Crest turnkey architectural & interior project", timestamp: '2026-03-12T09:00:00Z' }
    ],
    createdAt: '2026-03-12T09:00:00Z'
  },
  {
    id: 'proj-001',
    name: 'Villa Serenity - Tropical Courtyard Residence',
    projectType: 'Residential Architecture',
    location: 'Sarjapur, Bangalore, Karnataka',
    description: 'A 4,800 sq.ft biophilic tropical contemporary residence organized around a sunken central courtyard, featuring passive solar shading, exposed board-marked concrete, compressed earth blocks, and rainwater harvesting cistern.',
    status: 'design_development',
    builtUpAreaSqFt: 4800,
    files: [
      {
        id: 'file-01',
        name: 'Villa_Floorplan_Schematic_L1.pdf',
        size: '2.4 MB',
        type: 'application/pdf',
        uploadDate: '2026-03-10',
        extractedText: 'LEVEL 1 GROUND PLAN: Foyer (3.2m x 2.8m), Double-height Living (6.5m x 5.2m), Sunken Courtyard with Frangipani tree, Open Dining (4.8m x 4.2m), Wet/Dry Modular Kitchen, Master Suite 1 with private court, Staff quarters. Structural grid: 6.0m x 6.0m column centers.'
      },
      {
        id: 'file-02',
        name: 'Structural_Framing_Concept.dwg',
        size: '5.8 MB',
        type: 'drawing/dwg',
        uploadDate: '2026-03-11',
        extractedText: 'STRUCTURAL GENERAL NOTES: M30 grade concrete for column footings and transfer beams. Fe550D TMT rebars. Cantilever canopy over car porch (3.5m projection) requires post-tensioned reinforced band beam.'
      },
      {
        id: 'file-03',
        name: 'Sustainable_Material_Schedule.txt',
        size: '420 KB',
        type: 'text/plain',
        uploadDate: '2026-03-12',
        extractedText: 'SPECIFICATIONS: 200mm exterior walls using fly-ash stabilized earth blocks (CSEB). Teakwood louvered screens for West facade. Double glazed Low-E sliding patio doors (U-value 1.7 W/m2K).'
      }
    ],
    analyses: [
      {
        id: 'analysis-01',
        title: 'Architectural Intelligence Audit: Villa Serenity',
        timestamp: '2026-03-12T14:30:00Z',
        focus: 'Passive Solar & Cross-Ventilation Review',
        analysis: `## 1. Executive Summary & Project Brief
The Villa Serenity project presents a well-articulated biophilic response to the Bangalore deccan plateau microclimate (elevation 920m). The central courtyard acts as an evaporative and thermodynamic thermal siphon.

## 2. Spatial Programming & Design Rationale
- **Courtyard Chimney Effect**: Warm air rises through the central double-height void and is exhausted via high-level operable clerestory louvers, drawing cool air from shaded garden perimeters.
- **Buffer Spaces**: Utility, store, and powder rooms are positioned along the West periphery, effectively insulating primary living zones from harsh afternoon solar thermal gain.

## 3. Structural, Materials & BOQ Overview
- **Board-Marked Concrete**: Accentuate honest shuttering lines; ensure silicone hydrophobic sealant application within 14 days of curing.
- **Cantilever Porch**: 3.5m cantilever beam requires strict deflection control (span/350 limit under full live load).
- **BOQ Sensitivity**: Fenestration and double glazing contribute ~22% of finishes budget. Recommend locking aluminum profiles early.

## 4. Building Code & Regulatory Checks
- **BBMP Building Bylaws**: Front setback minimum 3.0m verified; side setbacks 2.0m compliant with natural ground level grading.
- **Rainwater Harvesting**: Mandatory 60,000-liter subterranean dual-chamber filtration tank required under local bylaws.`
      }
    ],
    members: [
      { id: 'mem-1', name: 'Ar. Gouse (Principal)', email: 'principal@gouseai.com', role: 'owner' },
      { id: 'mem-2', name: 'Priya Sundaram', email: 'priya@studioformvoid.com', role: 'architect' },
      { id: 'mem-3', name: 'Er. Rajesh K.', email: 'rajesh@apexstructures.in', role: 'structural_engineer' },
      { id: 'mem-4', name: 'Sameer Sen (Client)', email: 'client.sen@outlook.com', role: 'client' }
    ],
    auditLogs: [
      { id: 'log-01', projectId: 'proj-001', actor: 'Ar. Gouse', action: 'Project Initialized', details: 'Created Villa Serenity architectural project profile', timestamp: '2026-03-10T09:15:00Z' },
      { id: 'log-02', projectId: 'proj-001', actor: 'Ar. Gouse', action: 'Drawing Attached', details: 'Uploaded Villa_Floorplan_Schematic_L1.pdf', timestamp: '2026-03-10T10:45:00Z' },
      { id: 'log-03', projectId: 'proj-001', actor: 'Priya Sundaram', action: 'Intelligence Run', details: 'Executed Passive Solar & Cross-Ventilation Review audit', timestamp: '2026-03-12T14:30:00Z' }
    ],
    createdAt: '2026-03-10T09:15:00Z'
  },
  {
    id: 'proj-002',
    name: 'Nexus Commercial Hub & Innovation Labs',
    projectType: 'Commercial High-Rise',
    location: 'BKC, Mumbai, Maharashtra',
    description: 'A 14-story LEED Platinum office tower featuring a high-performance double-skin curtain wall, central core shear walls, collaborative sky gardens every 4 floors, and intelligent automated building management systems (BMS).',
    status: 'planning',
    builtUpAreaSqFt: 185000,
    files: [
      {
        id: 'file-04',
        name: 'BKC_Development_DCR_Bylaws.pdf',
        size: '4.1 MB',
        type: 'application/pdf',
        uploadDate: '2026-03-05',
        extractedText: 'Plot Area: 45,000 sq.ft. Permissible FSI: 4.0 with premium purchase. Mandatory 6.0m fire tender road on all four sides with 45-tonne pavement bearing.'
      }
    ],
    analyses: [],
    members: [
      { id: 'mem-1', name: 'Ar. Gouse (Principal)', email: 'principal@gouseai.com', role: 'owner' },
      { id: 'mem-5', name: 'Vikramaditya Buildcon', email: 'contracts@vikramaditya.co.in', role: 'quantity_surveyor' }
    ],
    auditLogs: [
      { id: 'log-04', projectId: 'proj-002', actor: 'Ar. Gouse', action: 'Project Initialized', details: 'Created Nexus Commercial Hub project space', timestamp: '2026-03-05T11:00:00Z' }
    ],
    createdAt: '2026-03-05T11:00:00Z'
  },
  {
    id: 'proj-003',
    name: 'The Heritage Haveli Courtyard Gallery',
    projectType: 'Adaptive Reuse & Conservation',
    location: 'Old City, Jaipur, Rajasthan',
    description: 'Restoration and adaptive reuse of a 19th-century lime-and-stone haveli into an artisanal design gallery and boutique café, retaining authentic Araish lime plaster and hand-carved red sandstone jharokhas.',
    status: 'documentation',
    builtUpAreaSqFt: 6200,
    files: [],
    analyses: [],
    members: [
      { id: 'mem-1', name: 'Ar. Gouse (Principal)', email: 'principal@gouseai.com', role: 'owner' }
    ],
    auditLogs: [
      { id: 'log-05', projectId: 'proj-003', actor: 'Ar. Gouse', action: 'Project Initialized', details: 'Created Haveli Conservation project', timestamp: '2026-02-28T16:20:00Z' }
    ],
    createdAt: '2026-02-28T16:20:00Z'
  }
];

export const INITIAL_BOQ_ITEMS: BOQItem[] = [
  {
    id: 'boq-1',
    name: 'Earthwork excavation in foundation trenches (hard gravel / soil)',
    category: 'Substructure',
    unit: 'm3',
    quantity: 165,
    rate: 320,
    amount: 52800,
    notes: 'Includes dressing sides, ramming bottoms and lift up to 2.5m'
  },
  {
    id: 'boq-2',
    name: 'PCC (1:4:8) with 40mm graded granite metal in foundation bed',
    category: 'Substructure',
    unit: 'm3',
    quantity: 28,
    rate: 4950,
    amount: 138600,
    notes: 'Well-compacted 100mm layer under all footings and grade beams'
  },
  {
    id: 'boq-3',
    name: 'RCC M25 design mix for columns, plinth beams & footings',
    category: 'Concrete Works',
    unit: 'm3',
    quantity: 64,
    rate: 8800,
    amount: 563200,
    notes: 'Excludes steel reinforcement; includes centering, formwork & staging'
  },
  {
    id: 'boq-4',
    name: 'Thermo-mechanically treated (TMT) Fe550D steel reinforcement',
    category: 'Concrete Works',
    unit: 'MT',
    quantity: 5.4,
    rate: 74500,
    amount: 402300,
    notes: 'Includes cutting, bending, cranked bars, binding wire & spacer blocks'
  },
  {
    id: 'boq-5',
    name: 'Autoclaved Aerated Concrete (AAC) blocks (200mm thick external walls)',
    category: 'Masonry',
    unit: 'm3',
    quantity: 82,
    rate: 5400,
    amount: 442800,
    notes: 'Bonded with high-strength polymer thin-bed adhesive mortar'
  },
  {
    id: 'boq-6',
    name: 'Internal cement plastering 1:4 mix (15mm thick smooth sponge finish)',
    category: 'Finishes',
    unit: 'sq.m',
    quantity: 480,
    rate: 280,
    amount: 134400,
    notes: 'Cured for 14 days, plumb and true to line'
  },
  {
    id: 'boq-7',
    name: 'Full-body honed vitrified tiles (1200mm x 600mm) with epoxy grout',
    category: 'Finishes',
    unit: 'sq.m',
    quantity: 240,
    rate: 1450,
    amount: 348000,
    notes: 'Anti-slip R10 rating for living, dining, and corridor circulation'
  },
  {
    id: 'boq-8',
    name: 'Thermally-broken aluminum sliding window system with Low-E DGU glass',
    category: 'Doors & Windows',
    unit: 'sq.m',
    quantity: 42,
    rate: 5800,
    amount: 243600,
    notes: '6mm Low-E + 12mm Argon air cavity + 6mm clear toughened glass'
  },
  {
    id: 'boq-9',
    name: 'Concealed electrical point wiring & distribution boards (FRLS grade)',
    category: 'MEP & Electrical',
    unit: 'nos',
    quantity: 110,
    rate: 1100,
    amount: 121000,
    notes: 'Heavy duty PVC conduits, modular switches, earthing grid'
  },
  {
    id: 'boq-10',
    name: 'Dual-layer APP modified elastomeric bitumen membrane waterproofing',
    category: 'Waterproofing',
    unit: 'sq.m',
    quantity: 160,
    rate: 720,
    amount: 115200,
    notes: 'Podium and terrace waterproofing with 10-year manufacturer warranty'
  }
];

export const INITIAL_PROFESSIONALS: ProfessionalProfile[] = [
  {
    id: 'prof-alvi-001',
    professionalType: 'architect',
    name: 'Ar. S. Gouse (Principal Architect & Turnkey Director)',
    company: "ALVI's Architecture, Interior Designers & Construction",
    bio: "Headquartered in Yeshwanthpur, Bangalore, ALVI's Architecture, Interior Designers & Construction is a premier design-and-build practice. We seamlessly integrate master architectural planning, luxury interior styling, and turnkey civil construction under one accountable contract. With 16+ years of mastery and 140+ delivered projects across Bangalore and South India, our Yeshwanthpur studio provides clients with live material galleries, sample joinery mockups, and end-to-end turnkey execution.",
    services: '1. Architectural Planning & 3D Elevations, 2. Luxury Residential & Commercial Interior Design, 3. Turnkey Civil Construction & RCC Framing, 4. Bespoke Teakwood Joinery & Modular Kitchens, 5. CSI Detailing, BOQ & Quantity Takeoffs, 6. BBMP / BDA Municipal Plan Sanctions',
    location: 'Yeshwanthpur, Bangalore, Karnataka',
    address: "ALVI's Architecture & Interior Experience Center, Near Yeshwanthpur Metro Station & Railway Station, Tumkur Main Road, Yeshwanthpur, Bengaluru, Karnataka 560022",
    landmark: 'Near Yeshwanthpur Metro Station & Govardhan Theatre, Tumkur Road',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Yeshwanthpur+Metro+Station+Tumkur+Road+Bengaluru+560022',
    mapEmbedUrl: 'https://maps.google.com/maps?q=Yeshwanthpur%20Metro%20Station%20Tumkur%20Road%20Bengaluru%20Karnataka%20560022&t=&z=15&ie=UTF8&iwloc=&output=embed',
    verified: true,
    rating: 5.0,
    completedProjects: 142,
    experienceYears: 16,
    email: 'sgouse14@gmail.com',
    phone: '+91 98450 78601',
    whatsapp: '+91 98450 78601',
    website: 'https://alvis-architecture.com'
  },
  {
    id: 'prof-01',
    professionalType: 'architect',
    name: 'Ar. Priya Sundaram',
    company: 'Studio Form & Void Architects',
    bio: 'Award-winning sustainable architect with 14 years specializing in passive solar residences, institutional campuses, and timber-hybrid structures. Registered with Council of Architecture (COA) and LEED AP.',
    services: 'Architectural Design, Master Planning, Sustainable Bioclimatic Modeling, Interior Architecture, Statutory Approvals',
    location: 'Bangalore & Chennai',
    address: '42, 100ft Road, Indiranagar, Bangalore, Karnataka 560038',
    verified: true,
    rating: 4.9,
    completedProjects: 48,
    experienceYears: 14,
    email: 'priya@studioformvoid.com',
    phone: '+91 98450 12345',
    whatsapp: '+91 98450 12345',
    website: 'https://studioformvoid.com'
  },
  {
    id: 'prof-02',
    professionalType: 'builder',
    name: 'Vikramaditya Buildcon Private Limited',
    company: 'Vikramaditya Infrastructure & EPC',
    bio: 'Class-A civil engineering & general contracting firm operating across Western India. Specialists in high-precision RCC framed towers, institutional complexes, and zero-defect luxury residential execution.',
    services: 'General Contracting, Turnkey Civil Works, Post-Tensioned Slabs, Structural Fabrication, Quantity Surveying & Scheduling',
    location: 'Mumbai & Pune',
    address: 'Tower B, 7th Floor, Godrej Coliseum, Sion East, Mumbai, Maharashtra 400022',
    verified: true,
    rating: 4.8,
    completedProjects: 112,
    experienceYears: 22,
    email: 'projects@vikramaditya.co.in',
    phone: '+91 22 4567 8900',
    whatsapp: '+91 98201 54321',
    website: 'https://vikramaditya.co.in'
  },
  {
    id: 'prof-03',
    professionalType: 'material_supplier',
    name: 'TerraCraft Eco-Materials Co.',
    company: 'TerraCraft Sustainable Solutions',
    bio: 'Leading green building material manufacturer. Certified autoclaved aerated concrete (AAC) blocks, compressed earth blocks, breathable lime plasters, and recycled glass terrazzo pavers with full EPD environmental declarations.',
    services: 'AAC Blocks Supply, Lime Plaster Formulation, Compressed Earth Blocks, Terracotta Rainscreen Louvers, Carbon-Negative Mortar',
    location: 'Hyderabad, Bangalore & Coimbatore',
    address: 'Plot 14-B, IDA Nacharam Industrial Area, Hyderabad, Telangana 500076',
    verified: true,
    rating: 4.9,
    completedProjects: 230,
    experienceYears: 11,
    email: 'sales@terracraftmaterials.com',
    phone: '+91 40 6789 0123',
    whatsapp: '+91 99890 12345',
    website: 'https://terracraftmaterials.com'
  },
  {
    id: 'prof-04',
    professionalType: 'architect',
    name: 'Ar. Kabir Merchant',
    company: 'Merchant Urbanists & Architecture',
    bio: 'Specialist in commercial mixed-use, high-density residential developments, and parametric facade design. Expert in high-FSI urban regulations and BIM Level 2 LOD 400 delivery.',
    services: 'High-Rise Architecture, BIM Coordination, Façade Engineering, Urban Planning, Commercial Masterplans',
    location: 'Delhi NCR & Chandigarh',
    address: 'Sector 44, Golf Course Road, Gurugram, Haryana 122003',
    verified: true,
    rating: 4.7,
    completedProjects: 36,
    experienceYears: 16,
    email: 'kabir@merchanturbanists.in',
    phone: '+91 11 2345 6789',
    whatsapp: '+91 98110 98765',
    website: 'https://merchanturbanists.in'
  },
  {
    id: 'prof-05',
    professionalType: 'material_supplier',
    name: 'Apex Fenestration & Glazing Systems',
    company: 'Apex Facades Ltd',
    bio: 'Premium architectural glazing systems manufacturer. Thermally broken German aluminum profiles, structural glazing, acoustic laminated glass, and motorized architectural skylights.',
    services: 'Curtain Walls, Low-E Double Glazed Windows, Frameless Glass Railings, Motorized Pergolas, Acoustic Partitions',
    location: 'Mumbai & Bangalore',
    address: 'Andheri-Kurla Road, Sakinaka, Andheri East, Mumbai 400072',
    verified: true,
    rating: 4.6,
    completedProjects: 85,
    experienceYears: 9,
    email: 'contact@apexfenestration.com',
    phone: '+91 98200 45678',
    whatsapp: '+91 98200 45678',
    website: 'https://apexfenestration.com'
  },
  {
    id: 'prof-06',
    professionalType: 'builder',
    name: 'Shankar Civil & Infrastructure Infra',
    company: 'Shankar Builders & Developers',
    bio: 'Premier residential and commercial turnkey builder in South India. Known for prompt delivery, automated batching plant quality control, and certified green building construction standards.',
    services: 'Turnkey Villa Construction, Commercial RCC Structures, Soil Excavation & Piling, Factory Sheds, Pre-cast Concrete',
    location: 'Bangalore & Mysore',
    address: '88, Outer Ring Road, Bellandur, Bangalore, Karnataka 560103',
    verified: true,
    rating: 4.8,
    completedProjects: 74,
    experienceYears: 18,
    email: 'build@shankarinfra.in',
    phone: '+91 98455 67890',
    whatsapp: '+91 98455 67890',
    website: 'https://shankarinfra.in'
  },
  {
    id: 'prof-07',
    professionalType: 'material_supplier',
    name: 'South City TMT & Steel Distributors',
    company: 'South City Steel Trading Corp',
    bio: 'Authorized master stockist for primary steel mills: Tata Tiscon Fe550D, JSW Neosteel, and SAIL. Direct warehouse logistics with mill test certificates (MTC) and computerized cut-and-bend services.',
    services: 'TMT Rebar Supply (8mm-32mm), Structural MS Channels & Beams, Binding Wire, Cut & Bend Reinforcement, Delivery to Site',
    location: 'Bangalore & Chennai',
    address: 'Steel Market Complex, Kalasipalyam, Bangalore, Karnataka 560002',
    verified: true,
    rating: 4.9,
    completedProjects: 410,
    experienceYears: 26,
    email: 'dispatch@southcitysteel.com',
    phone: '+91 80 2670 4455',
    whatsapp: '+91 94480 33221',
    website: 'https://southcitysteel.com'
  }
];

export const INITIAL_LIVE_MATERIAL_PRICES: LiveMaterialPrice[] = [
  {
    id: 'lmp-01',
    name: 'OPC 53 Grade Portland Cement',
    category: 'Cement & Concrete',
    brands: ['UltraTech Super', 'ACC Concrete Plus', 'Dalmia DSP', 'Birla A1'],
    unit: '50 kg bag',
    currentPrice: 385,
    minPrice: 365,
    maxPrice: 410,
    changePercent: 1.8,
    trend: 'up',
    trendReason: 'Increased clinker production freight tariffs and seasonal pre-monsoon construction surge',
    location: 'Bangalore / South Region',
    updatedAt: new Date().toISOString(),
    marketNotes: 'Bulk delivered rates (500+ bags) qualify for ₹15-20 per bag volume discount with direct factory unloading.'
  },
  {
    id: 'lmp-02',
    name: 'Fe550D Primary TMT Steel Rebar',
    category: 'Steel & Reinforcement',
    brands: ['Tata Tiscon Fe550D', 'JSW Neosteel', 'Jindal Panther', 'SAIL TMT'],
    unit: 'MT (Metric Tonne)',
    currentPrice: 74500,
    minPrice: 72000,
    maxPrice: 77000,
    changePercent: -0.8,
    trend: 'down',
    trendReason: 'Global coking coal price correction and steady domestic blast furnace output easing supply constraints',
    location: 'National Benchmark (ex-mill)',
    updatedAt: new Date().toISOString(),
    marketNotes: 'Inclusive of GST @ 18%. Mandatory ISI certification and batch Mill Test Certificate (MTC) provided.'
  },
  {
    id: 'lmp-03',
    name: 'Manufactured Sand (M-Sand, Zone II)',
    category: 'Sand & Aggregates',
    brands: ['RoboSilicon', 'Pozzocrete', 'Quarry Direct VSI Washed'],
    unit: 'tonne',
    currentPrice: 1150,
    minPrice: 950,
    maxPrice: 1300,
    changePercent: 0,
    trend: 'stable',
    trendReason: 'Consistent stone quarrying crushing operations and local municipal environmental clearances',
    location: 'Bangalore & Chennai Hubs',
    updatedAt: new Date().toISOString(),
    marketNotes: 'VSI-crushed cubic particles with silt content strictly below 3% conforming to IS 383 standards.'
  },
  {
    id: 'lmp-04',
    name: 'Ready-Mix Concrete (RMC) M25 Grade',
    category: 'Cement & Concrete',
    brands: ['Prism RMC', 'RDC Concrete', 'UltraTech RMC', 'Godrej Construction'],
    unit: 'm3',
    currentPrice: 4450,
    minPrice: 4100,
    maxPrice: 4800,
    changePercent: 1.2,
    trend: 'up',
    trendReason: 'Diesel transit-mixer haulage fuel adjustments and regional aggregate lead-time costs',
    location: 'Tier-1 Metros (upto 25km lead)',
    updatedAt: new Date().toISOString(),
    marketNotes: 'Slump guaranteed at 100-120mm at point of discharge with computerized batching printout.'
  },
  {
    id: 'lmp-05',
    name: 'Autoclaved Aerated Concrete (AAC) Blocks',
    category: 'Blocks & Bricks',
    brands: ['Siporex', 'Magicrete', 'Biltech', 'Renaissance Green'],
    unit: 'm3',
    currentPrice: 5400,
    minPrice: 4900,
    maxPrice: 5800,
    changePercent: -1.5,
    trend: 'down',
    trendReason: 'New automated manufacturing capacities operational in Andhra Pradesh and Maharashtra',
    location: 'Regional Distribution',
    updatedAt: new Date().toISOString(),
    marketNotes: 'Standard sizes 600x200x150mm & 600x200x200mm. Requires 75% less joint mortar than wire-cut clay bricks.'
  },
  {
    id: 'lmp-06',
    name: 'Wire-Cut Red Clay Table-Moulded Bricks',
    category: 'Blocks & Bricks',
    brands: ['Malabar Clay Works', 'Varshini Bricks', 'Heritage Kiln Direct'],
    unit: '1,000 nos',
    currentPrice: 8800,
    minPrice: 8200,
    maxPrice: 9600,
    changePercent: 2.4,
    trend: 'up',
    trendReason: 'Strict environmental emission norms on traditional brick kilns restricting topsoil extraction',
    location: 'Karnataka / Tamil Nadu',
    updatedAt: new Date().toISOString(),
    marketNotes: 'Compressive strength > 7.5 N/mm2 with water absorption under 15%.'
  },
  {
    id: 'lmp-07',
    name: 'Double Glazed Unit (Low-E 6mm + 12A + 6mm)',
    category: 'Glass & Fenestration',
    brands: ['Saint-Gobain Planitherm', 'Asahi India (AIS)', 'Guardian Glass SunGuard'],
    unit: 'sq.m',
    currentPrice: 5600,
    minPrice: 5100,
    maxPrice: 6300,
    changePercent: 0.5,
    trend: 'stable',
    trendReason: 'High demand in green architectural projects counterbalanced by competitive domestic float glass plants',
    location: 'Pan-India Fabricators',
    updatedAt: new Date().toISOString(),
    marketNotes: 'U-Value 1.6 W/m²K, SHGC 0.28, Argon gas filled with warm-edge butyl perimeter spacer.'
  },
  {
    id: 'lmp-08',
    name: 'CPVC Internal Plumbing Pipes (1" SDR 11)',
    category: 'Plumbing & MEP',
    brands: ['Astral Pipes', 'Ashirvad CPVC', 'Supreme LifeGuard', 'Prince FlowGuard'],
    unit: '3 meter length',
    currentPrice: 485,
    minPrice: 450,
    maxPrice: 530,
    changePercent: 1.1,
    trend: 'up',
    trendReason: 'Raw polymer resin (polyvinyl chloride) import price movement and currency fluctuations',
    location: 'Authorized Plumbing Distributors',
    updatedAt: new Date().toISOString(),
    marketNotes: 'Hot & cold water rated up to 93°C at 100 PSI. Solvent weld jointing.'
  },
  {
    id: 'lmp-09',
    name: 'FRLS Copper Electric Building Wire (2.5 sq.mm)',
    category: 'Plumbing & MEP',
    brands: ['Polycab Green Wire', 'Finolex Flamegard', 'Havells LifeLine', 'KEI'],
    unit: '90 meter coil',
    currentPrice: 2850,
    minPrice: 2650,
    maxPrice: 3100,
    changePercent: 3.1,
    trend: 'up',
    trendReason: 'LME (London Metal Exchange) international copper spot price rally reaching $9,400/MT',
    location: 'Electrical Wholesale Markets',
    updatedAt: new Date().toISOString(),
    marketNotes: 'Oxygen-free electrolytic grade copper conductor with Flame Retardant Low Smoke (FRLS) insulation.'
  },
  {
    id: 'lmp-10',
    name: 'Exterior Premium Acrylic Emulsion Paint',
    category: 'Finishes & Coatings',
    brands: ['Asian Paints Apex Ultima', 'Berger WeatherCoat Anti-Dust', 'Dulux Weathershield'],
    unit: '20 Liter drum',
    currentPrice: 7250,
    minPrice: 6800,
    maxPrice: 7900,
    changePercent: 0,
    trend: 'stable',
    trendReason: 'Stable titanium dioxide and crude petrochemical solvent baseline pricing',
    location: 'Paint Dealerships & Depots',
    updatedAt: new Date().toISOString(),
    marketNotes: 'Anti-algal, dirt-pickup resistance with 10-year exterior color retention warranty.'
  }
];

export const INITIAL_ENQUIRIES: MarketplaceEnquiry[] = [
  {
    id: 'enq-alvi-01',
    professionalId: 'prof-alvi-001',
    professionalName: "ALVI's Architecture, Interior Designers & Construction",
    clientName: 'Dr. Srinivas Murthy',
    clientEmail: 'srinivas.murthy@healthcorp.in',
    projectTitle: 'Turnkey Luxury Villa & Bespoke Interiors (Yeshwanthpur / Sadashivanagar)',
    message: 'Seeking end-to-end architectural planning, municipal BBMP sanctions, luxury Italian marble interiors, and turnkey civil construction for a 6,200 sq.ft residential plot near Yeshwanthpur / Sadashivanagar corridor. Met with team at Yeshwanthpur experience center.',
    budget: '₹ 2.8 - 3.4 Cr',
    status: 'in_progress',
    createdAt: '2026-03-12T14:15:00Z'
  },
  {
    id: 'enq-01',
    professionalId: 'prof-01',
    professionalName: 'Ar. Priya Sundaram',
    clientName: 'Rahul Verma',
    clientEmail: 'rahul.verma@fintech.io',
    projectTitle: 'Sustainable Weekend Villa in Coorg',
    message: 'We are seeking comprehensive architectural services for a 3,500 sq.ft hilltop estate in Coorg. Looking for rammed earth, local stone, and off-grid solar integration.',
    budget: '₹ 1.8 - 2.2 Cr',
    status: 'quoted',
    createdAt: '2026-03-11T11:20:00Z'
  },
  {
    id: 'enq-02',
    professionalId: 'prof-02',
    professionalName: 'Vikramaditya Buildcon',
    clientName: 'Meera Chawla',
    clientEmail: 'meera.chawla@realty.com',
    projectTitle: 'RCC Contractor for 6-Story Commercial Building',
    message: 'Seeking turnkey RCC contractor for BKC commercial plot. Foundation excavation complete, ready to issue civil work tender.',
    budget: '₹ 4.5 Cr',
    status: 'in_progress',
    createdAt: '2026-03-09T16:00:00Z'
  },
  {
    id: 'enq-03',
    professionalId: 'prof-03',
    professionalName: 'TerraCraft Eco-Materials Co.',
    clientName: 'Ar. Gouse',
    clientEmail: 'principal@gouseai.com',
    projectTitle: 'AAC Block Bulk Supply for Sarjapur Residence',
    message: 'Need 82 m3 of 200mm Grade 1 AAC blocks delivered to Sarjapur site by end of March. Please provide bulk rate and dry mortar quote.',
    budget: '₹ 4.8 Lakhs',
    status: 'open',
    createdAt: '2026-03-12T09:40:00Z'
  }
];

export const MATERIAL_CATALOG: MaterialComparisonItem[] = [
  {
    id: 'mat-01',
    name: 'Autoclaved Aerated Concrete (AAC) Blocks',
    category: 'Walling & Masonry',
    unit: 'm3',
    estimatedRate: 5400,
    durabilityYears: 60,
    embodiedCarbonKg: 110,
    uValue: 0.24,
    fireRating: '4 Hours (Class A1)',
    pros: ['Superior thermal insulation', '1/3 weight of red clay bricks', 'Faster masonry installation', 'Non-combustible'],
    cons: ['Requires skilled thin-bed mortar', 'Susceptible to brittle chipping during transport'],
    bestUse: 'External perimeter and internal partition walls in multi-story residential & commercial buildings'
  },
  {
    id: 'mat-02',
    name: 'Traditional Wire-Cut Red Clay Bricks',
    category: 'Walling & Masonry',
    unit: 'm3',
    estimatedRate: 7200,
    durabilityYears: 100,
    embodiedCarbonKg: 280,
    uValue: 0.81,
    fireRating: '4 Hours (Class A1)',
    pros: ['High compressive strength', 'Excellent acoustic mass', 'Timeless exposed brick aesthetics', 'High moisture buffer capacity'],
    cons: ['Heavy dead load on foundation', 'High carbon footprint from coal kiln firing', 'Inconsistent dimensional tolerances'],
    bestUse: 'Exposed brickwork facades, heritage restorations, boundary walls, and loadbearing masonry'
  },
  {
    id: 'mat-03',
    name: 'Compressed Stabilized Earth Blocks (CSEB)',
    category: 'Walling & Masonry',
    unit: 'm3',
    estimatedRate: 4800,
    durabilityYears: 75,
    embodiedCarbonKg: 45,
    uValue: 0.42,
    fireRating: '3 Hours',
    pros: ['Extremely low carbon footprint', 'Produced from on-site excavated soil', 'Excellent thermal comfort in dry/tropical climates'],
    cons: ['Requires protection from prolonged driving rain', 'Higher wall thickness needed'],
    bestUse: 'Eco-resorts, passive solar residential architecture, and rural institutional projects'
  },
  {
    id: 'mat-04',
    name: 'Double Glazed Unit (Low-E Toughened, Argon Gas)',
    category: 'Fenestrations & Glazing',
    unit: 'sq.m',
    estimatedRate: 5800,
    durabilityYears: 30,
    embodiedCarbonKg: 160,
    uValue: 1.65,
    fireRating: '30 Minutes',
    pros: ['Cuts AC cooling load by up to 28%', 'Blocks 85% of UV radiation', 'Substantial acoustic reduction (-36 dB)'],
    cons: ['Higher upfront procurement cost', 'Heavy pane weight requires structural aluminum sections'],
    bestUse: 'West and South facing architectural fenestrations, curtain wall facades, and luxury residences'
  },
  {
    id: 'mat-05',
    name: 'Single Clear Float Glass (6mm Toughened)',
    category: 'Fenestrations & Glazing',
    unit: 'sq.m',
    estimatedRate: 1850,
    durabilityYears: 40,
    embodiedCarbonKg: 75,
    uValue: 5.7,
    fireRating: 'Non-rated',
    pros: ['Low initial cost', 'Maximum visible light transmission (VLT ~88%)', 'Lightweight framing required'],
    cons: ['Severe greenhouse solar heat gain', 'Poor thermal resistance causes interior overheating', 'Condensation prone'],
    bestUse: 'Internal glazed office partitions and sheltered North-facing clerestories'
  },
  {
    id: 'mat-06',
    name: 'Micro-Cement Architectural Screed (Seamless 3mm)',
    category: 'Floor & Wall Finishes',
    unit: 'sq.m',
    estimatedRate: 1950,
    durabilityYears: 25,
    embodiedCarbonKg: 55,
    uValue: 0.85,
    fireRating: 'Class A2',
    pros: ['Completely seamless minimalist look', 'Applied directly over existing substrates', '100% waterproof when sealed', 'Custom earthy pigmentation'],
    cons: ['Demands immaculate substrate prep', 'Can develop hairline movement cracks if structure shifts'],
    bestUse: 'Modern minimalist villas, contemporary art galleries, commercial showrooms, and wet bathrooms'
  }
];

export const BUILDING_TYPOLOGY_CHECKLISTS: Record<string, string[]> = {
  'Residential Villa / Bungalow': [
    'Confirm site survey boundaries, contour levels, and cardinal solar orientation',
    'Verify permissible Ground Coverage (GC), Floor Space Index (FSI), and statutory building setbacks',
    'Conduct geotechnical soil bearing capacity (SBC) testing for structural footing design',
    'Coordinate rainwater harvesting tank sizing (minimum 25 liters per sq.m of roof area)',
    'Review staircase riser (max 175mm) and tread (min 250mm) dimensions against NBC safety code',
    'Design sunken wet slab waterproofing details with double-layer elastomeric membrane and slope to drain',
    'Check MEP duct clearances for HVAC copper lines, condensate drains, and solar water heater lines',
    'Verify boundary wall structural stability, rainwater recharge pit, and entrance gate swing clearance'
  ],
  'Commercial Office High-Rise': [
    'Verify compliance with local Development Control Regulations (DCR) and premium FSI regulations',
    'Ensure continuous 6.0m clear paved fire tender driveway with 45-tonne axle load capacity',
    'Calculate maximum egress travel distance (max 30m unsprinklered or 45m sprinklered to fire stair)',
    'Ensure minimum two pressurized 2-hour fire-rated exit stairwells on opposing ends of core floorplate',
    'Verify double-skin curtain wall deflection criteria (L/175 or 20mm max) under wind tunnel pressure',
    'Incorporate dedicated refuge areas every 24 meters of vertical building height with direct fire brigade communication',
    'Plan BMS and smart sub-metering for HVAC chillers, lighting circuits, and emergency diesel generators',
    'Verify universal accessibility (NBC Part 3 / ADA) including 1:12 ramp gradients and tactile guiding pavers'
  ],
  'Industrial & Warehouse Facility': [
    'Confirm floor slab point loading capacity (minimum 50 kN/sq.m with laser-screed floor flatness FM2)',
    'Check heavy vehicle turning radiuses (minimum 15m radius for 40-foot articulated shipping containers)',
    'Verify dock leveler heights (standard 1200mm) and automated sectional overhead door clearances',
    'Ensure statutory NFPA 13 / NBC high-hazard fire sprinkler density with dedicated static water reservoir',
    'Specify standing-seam Galvalume roofing with 10% translucent poly-carbonate daylighting sheets',
    'Coordinate industrial ventilation louvers to achieve minimum 8 to 12 air changes per hour (ACH)'
  ],
  'Adaptive Reuse & Historic Heritage': [
    'Carry out non-destructive testing (NDT) on historic masonry, timber rafters, and lime foundations',
    'Document existing architectural elements, stone carvings, and jharokhas with measured drawings',
    'Formulate breathable lime mortar (slaked fat lime + surkhi/marble dust) compatible with historic masonry',
    'Design reversible structural interventions so modern additions do not compromise historic fabric',
    'Incorporate hidden electrical conduits and fire safety sensors without trenching historic plasterwork',
    'Obtain heritage conservation committee clearance and verify local conservation zoning guidelines'
  ]
};
