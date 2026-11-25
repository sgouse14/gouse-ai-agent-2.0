import { ProfessionalProfile, ProfessionalType } from '../types';

interface HubConfig {
  label: string;
  regionGroup: 'bangalore' | 'karnataka' | 'tamil_nadu' | 'telangana' | 'andhra' | 'kerala';
  street: string;
  pinPrefix: string;
  stdCode: string;
  coverage: string;
}

const DIRECTORY_HUBS: HubConfig[] = [
  // 33 Bangalore Wards & Industrial Corridors (33 * 50 = 1,650 contacts)
  { label: 'Whitefield, Bangalore', regionGroup: 'bangalore', street: 'ITPL Main Rd, Whitefield', pinPrefix: '560066', stdCode: '80', coverage: 'East Bangalore & Outer Ring Rd' },
  { label: 'Indiranagar, Bangalore', regionGroup: 'bangalore', street: '100 Feet Rd, HAL 2nd Stage, Indiranagar', pinPrefix: '560038', stdCode: '80', coverage: 'Central & East Bangalore' },
  { label: 'Koramangala, Bangalore', regionGroup: 'bangalore', street: '80 Feet Rd, 4th Block, Koramangala', pinPrefix: '560034', stdCode: '80', coverage: 'South-East Bangalore' },
  { label: 'HSR Layout, Bangalore', regionGroup: 'bangalore', street: '27th Main Rd, Sector 1, HSR Layout', pinPrefix: '560102', stdCode: '80', coverage: 'HSR, Bellandur & Sarjapur Corridor' },
  { label: 'Jayanagar, Bangalore', regionGroup: 'bangalore', street: '11th Main Rd, 4th Block, Jayanagar', pinPrefix: '560041', stdCode: '80', coverage: 'South Bangalore Metro' },
  { label: 'JP Nagar, Bangalore', regionGroup: 'bangalore', street: '24th Main Rd, Phase 5, JP Nagar', pinPrefix: '560078', stdCode: '80', coverage: 'South Bangalore & Bannerghatta Belt' },
  { label: 'Sadashivanagar, Bangalore', regionGroup: 'bangalore', street: 'Sankey Tank Rd, Sadashivanagar', pinPrefix: '560080', stdCode: '80', coverage: 'North-Central Bangalore' },
  { label: 'Malleshwaram, Bangalore', regionGroup: 'bangalore', street: 'Sampige Rd, 8th Cross, Malleshwaram', pinPrefix: '560003', stdCode: '80', coverage: 'West & Central Bangalore' },
  { label: 'Hebbal, Bangalore', regionGroup: 'bangalore', street: 'Bellary Rd, Kempapura, Hebbal', pinPrefix: '560024', stdCode: '80', coverage: 'North Bangalore & Airport Corridor' },
  { label: 'Yelahanka, Bangalore', regionGroup: 'bangalore', street: 'Doddaballapur Main Rd, Yelahanka New Town', pinPrefix: '560064', stdCode: '80', coverage: 'North Bangalore & Yelahanka Zone' },
  { label: 'Devanahalli, Bangalore', regionGroup: 'bangalore', street: 'NH-44 Airport Approach Rd, Devanahalli', pinPrefix: '562110', stdCode: '80', coverage: 'North Bangalore & KIA Growth Belt' },
  { label: 'Electronic City, Bangalore', regionGroup: 'bangalore', street: 'Hosur Main Rd, Phase 1, Electronic City', pinPrefix: '560100', stdCode: '80', coverage: 'South Bangalore & Hosur Tech Corridor' },
  { label: 'Sarjapur Road, Bangalore', regionGroup: 'bangalore', street: 'Kasavanahalli Main Rd, Sarjapur Road', pinPrefix: '560035', stdCode: '80', coverage: 'Sarjapur, Bellandur & Varthur' },
  { label: 'Marathahalli, Bangalore', regionGroup: 'bangalore', street: 'Outer Ring Rd, Munnekollal, Marathahalli', pinPrefix: '560037', stdCode: '80', coverage: 'ORR Tech Corridor & Whitefield' },
  { label: 'Bellandur, Bangalore', regionGroup: 'bangalore', street: 'Sarjapur Outer Ring Rd, Bellandur', pinPrefix: '560103', stdCode: '80', coverage: 'ORR South & East Bangalore' },
  { label: 'Bannerghatta Road, Bangalore', regionGroup: 'bangalore', street: 'Hulimavu Main Rd, Bannerghatta Road', pinPrefix: '560076', stdCode: '80', coverage: 'South Bangalore & Jigani' },
  { label: 'Rajajinagar, Bangalore', regionGroup: 'bangalore', street: 'Dr Rajkumar Rd, Industrial Town, Rajajinagar', pinPrefix: '560010', stdCode: '80', coverage: 'West Bangalore Hardware & Trade Hub' },
  { label: 'Peenya Industrial Area, Bangalore', regionGroup: 'bangalore', street: 'Tumkur Rd, 2nd Stage, Peenya Industrial Area', pinPrefix: '560058', stdCode: '80', coverage: 'Bangalore Heavy Steel & Industrial Supply' },
  { label: 'Yeshwanthpur, Bangalore', regionGroup: 'bangalore', street: 'Industrial Suburb, Tumkur Rd, Yeshwanthpur', pinPrefix: '560022', stdCode: '80', coverage: 'North-West Bangalore Logistics' },
  { label: 'Bommasandra, Bangalore', regionGroup: 'bangalore', street: 'KIADB Industrial Area, Hosur Rd, Bommasandra', pinPrefix: '560099', stdCode: '80', coverage: 'South Industrial Estate & Jigani' },
  { label: 'KR Puram, Bangalore', regionGroup: 'bangalore', street: 'Old Madras Rd, Battarahalli, KR Puram', pinPrefix: '560036', stdCode: '80', coverage: 'East Bangalore & Hoskote Link' },
  { label: 'Kengeri, Bangalore', regionGroup: 'bangalore', street: 'Mysore Rd, Satellite Town, Kengeri', pinPrefix: '560060', stdCode: '80', coverage: 'South-West Bangalore & Bidadi' },
  { label: 'Banashankari, Bangalore', regionGroup: 'bangalore', street: '100 Feet Ring Rd, Stage 2, Banashankari', pinPrefix: '560070', stdCode: '80', coverage: 'South & West Bangalore' },
  { label: 'Frazer Town, Bangalore', regionGroup: 'bangalore', street: 'Mosque Rd, Pulakeshi Nagar, Frazer Town', pinPrefix: '560005', stdCode: '80', coverage: 'Central & North-East Bangalore' },
  { label: 'Hennur, Bangalore', regionGroup: 'bangalore', street: 'Hennur Bagalur Main Rd, Kothanur, Hennur', pinPrefix: '560043', stdCode: '80', coverage: 'North-East Bangalore & Thanisandra' },
  { label: 'Jakkur, Bangalore', regionGroup: 'bangalore', street: 'Jakkur Aerodrome Rd, Amruthahalli', pinPrefix: '560064', stdCode: '80', coverage: 'North Bangalore Villa & Tech Belt' },
  { label: 'Nelamangala, Bangalore', regionGroup: 'bangalore', street: 'NH-48 Logistics Park, Nelamangala', pinPrefix: '562123', stdCode: '80', coverage: 'North-West Bulk Material Corridor' },
  { label: 'Jigani, Bangalore', regionGroup: 'bangalore', street: 'KIADB Granite & Stone Belt, Jigani', pinPrefix: '560105', stdCode: '80', coverage: 'South Bangalore Stone & Joinery Hub' },
  { label: 'Hoskote, Bangalore', regionGroup: 'bangalore', street: 'NH-75 Industrial Corridor, Hoskote', pinPrefix: '562114', stdCode: '80', coverage: 'East Bangalore Warehousing & RMC' },
  { label: 'Kanakapura Road, Bangalore', regionGroup: 'bangalore', street: 'Thalaghattapura Main Rd, Kanakapura Road', pinPrefix: '560062', stdCode: '80', coverage: 'South Bangalore & Aggregate Quarries' },
  { label: 'Doddaballapur, Bangalore', regionGroup: 'bangalore', street: 'KIADB Industrial Area, Doddaballapur', pinPrefix: '561203', stdCode: '80', coverage: 'North Bangalore Manufacturing Belt' },
  { label: 'Attibele, Bangalore', regionGroup: 'bangalore', street: 'NH-44 Industrial Zone, Attibele', pinPrefix: '562107', stdCode: '80', coverage: 'Bangalore-Hosur Border Logistics' },
  { label: 'Richmond Town, Bangalore', regionGroup: 'bangalore', street: 'Residency Rd, Shanthala Nagar, Richmond Town', pinPrefix: '560025', stdCode: '80', coverage: 'Central Business District Bangalore' },

  // 27 South India Regional Hubs (27 * 50 = 1,350 contacts)
  { label: 'Mysore, Karnataka', regionGroup: 'karnataka', street: 'Kalidasa Rd, VV Mohalla, Mysore', pinPrefix: '570002', stdCode: '821', coverage: 'Mysore, Mandya & Kodagu' },
  { label: 'Mangalore, Karnataka', regionGroup: 'karnataka', street: 'MG Rd, Kodialbail, Mangalore', pinPrefix: '575003', stdCode: '824', coverage: 'Coastal Karnataka & Dakshina Kannada' },
  { label: 'Hubli-Dharwad, Karnataka', regionGroup: 'karnataka', street: 'Gokul Rd, Industrial Estate, Hubballi', pinPrefix: '580030', stdCode: '836', coverage: 'North Karnataka Metro Hub' },
  { label: 'Belagavi, Karnataka', regionGroup: 'karnataka', street: 'Khanapur Rd, Tilakwadi, Belagavi', pinPrefix: '590006', stdCode: '831', coverage: 'Belagavi & Goa-Karnataka Corridor' },
  { label: 'Shivamogga, Karnataka', regionGroup: 'karnataka', street: 'BH Rd, Vinoba Nagar, Shivamogga', pinPrefix: '577204', stdCode: '8182', coverage: 'Malnad & Central Karnataka' },
  { label: 'Tumakuru, Karnataka', regionGroup: 'karnataka', street: 'BH Rd, Sira Gate, Tumakuru', pinPrefix: '572106', stdCode: '816', coverage: 'Tumakuru Smart City & NH-48' },
  { label: 'Udupi, Karnataka', regionGroup: 'karnataka', street: 'Manipal Main Rd, Kadiyali, Udupi', pinPrefix: '576102', stdCode: '820', coverage: 'Udupi, Manipal & Coastal Belt' },
  { label: 'Ballari, Karnataka', regionGroup: 'karnataka', street: 'Toranagallu Steel Corridor, Ballari', pinPrefix: '583101', stdCode: '8392', coverage: 'Bellary Steel Mills & South Supply' },

  { label: 'Chennai, Tamil Nadu', regionGroup: 'tamil_nadu', street: 'Anna Salai, Guindy & Teynampet, Chennai', pinPrefix: '600032', stdCode: '44', coverage: 'Chennai Metro & Sriperumbudur' },
  { label: 'Coimbatore, Tamil Nadu', regionGroup: 'tamil_nadu', street: 'Avinashi Rd, Peelamedu, Coimbatore', pinPrefix: '641004', stdCode: '422', coverage: 'Coimbatore, Pollachi & Western TN' },
  { label: 'Madurai, Tamil Nadu', regionGroup: 'tamil_nadu', street: 'Bypass Rd, KK Nagar, Madurai', pinPrefix: '625020', stdCode: '452', coverage: 'Southern Tamil Nadu' },
  { label: 'Salem, Tamil Nadu', regionGroup: 'tamil_nadu', street: 'Omalur Main Rd, Fairlands, Salem', pinPrefix: '636016', stdCode: '427', coverage: 'Salem Steel & Central TN' },
  { label: 'Tiruchirappalli, Tamil Nadu', regionGroup: 'tamil_nadu', street: 'Thillai Nagar Main Rd, Tiruchirappalli', pinPrefix: '620018', stdCode: '431', coverage: 'Trichy & Cauvery Delta' },
  { label: 'Hosur, Tamil Nadu', regionGroup: 'tamil_nadu', street: 'SIPCOT Phase 2, Bagalur Rd, Hosur', pinPrefix: '635109', stdCode: '4344', coverage: 'Hosur & Bangalore South Border' },
  { label: 'Erode, Tamil Nadu', regionGroup: 'tamil_nadu', street: 'Perundurai Rd, Thindal, Erode', pinPrefix: '638012', stdCode: '424', coverage: 'Erode, Tiruppur & Kongu Belt' },

  { label: 'Hyderabad, Telangana', regionGroup: 'telangana', street: 'Road No. 36, Jubilee Hills & Madhapur, Hyderabad', pinPrefix: '500081', stdCode: '40', coverage: 'Hyderabad Metro & Outer Ring Rd' },
  { label: 'Secunderabad, Telangana', regionGroup: 'telangana', street: 'MG Rd, Ranigunj Steel Market, Secunderabad', pinPrefix: '500003', stdCode: '40', coverage: 'Twin Cities & North Telangana' },
  { label: 'Warangal, Telangana', regionGroup: 'telangana', street: 'Hunter Rd, Hanamkonda, Warangal', pinPrefix: '506001', stdCode: '870', coverage: 'Central & Eastern Telangana' },

  { label: 'Visakhapatnam, Andhra Pradesh', regionGroup: 'andhra', street: 'VIP Rd, Siripuram & Autonagar, Visakhapatnam', pinPrefix: '530003', stdCode: '891', coverage: 'Coastal Andhra & Vizag Port Belt' },
  { label: 'Vijayawada, Andhra Pradesh', regionGroup: 'andhra', street: 'MG Rd, Benz Circle & Autonagar, Vijayawada', pinPrefix: '520010', stdCode: '866', coverage: 'Vijayawada-Amaravati Capital Region' },
  { label: 'Tirupati, Andhra Pradesh', regionGroup: 'andhra', street: 'Renigunta Rd, Air Bypass, Tirupati', pinPrefix: '517501', stdCode: '877', coverage: 'Rayalaseema & Chittoor Corridor' },
  { label: 'Guntur, Andhra Pradesh', regionGroup: 'andhra', street: 'Lakshmipuram Main Rd, Guntur', pinPrefix: '522007', stdCode: '863', coverage: 'Guntur, Ongole & Cement Clusters' },

  { label: 'Kochi, Kerala', regionGroup: 'kerala', street: 'MG Rd, Edappally & Kakkanad, Kochi', pinPrefix: '682024', stdCode: '484', coverage: 'Ernakulam, Kochi & Central Kerala' },
  { label: 'Thiruvananthapuram, Kerala', regionGroup: 'kerala', street: 'Technopark Rd, Kowdiar, Thiruvananthapuram', pinPrefix: '695003', stdCode: '471', coverage: 'South Kerala & Capital Region' },
  { label: 'Kozhikode, Kerala', regionGroup: 'kerala', street: 'Mavoor Rd, Thondayad Bypass, Kozhikode', pinPrefix: '673016', stdCode: '495', coverage: 'Malabar & North Kerala' },
  { label: 'Thrissur, Kerala', regionGroup: 'kerala', street: 'Swaraj Round, Punkunnam, Thrissur', pinPrefix: '680002', stdCode: '487', coverage: 'Thrissur & Timber/Tile Hubs' },
  { label: 'Puducherry, Puducherry', regionGroup: 'tamil_nadu', street: 'Mission St, White Town, Puducherry', pinPrefix: '605001', stdCode: '413', coverage: 'Puducherry, Cuddalore & East Coast' },
];

interface TrackSpec {
  type: ProfessionalType;
  prefixTitle: string;
  firmSuffixes: string[];
  services: string;
  bioTemplate: string;
  leadDaysBase: number;
}

const SPECIALTY_TRACKS: TrackSpec[] = [
  // Architects & Interior Studios (8 tracks)
  {
    type: 'architect',
    prefixTitle: 'Ar.',
    firmSuffixes: ['Architects', 'Design Studio', 'Spatial Atelier', 'Urbanists'],
    services: 'Residential Villas, Concept Masterplanning, BBMP / Local Sanction Drawings, GFC Working Sets',
    bioTemplate: 'COA-registered architectural consultancy delivering climate-responsive residences, villas, and statutory approvals across South India.',
    leadDaysBase: 7,
  },
  {
    type: 'architect',
    prefixTitle: 'Ar.',
    firmSuffixes: ['Interior Architecture', 'Living Atelier', 'Space Craft', 'Interiors'],
    services: 'Interior Architecture, Turnkey Space Planning, Custom Millwork Drawings, Architectural Lighting Layouts',
    bioTemplate: 'Bespoke interior architecture and spatial design studio specializing in luxury apartments, modular kitchens, and cohesive material palettes.',
    leadDaysBase: 5,
  },
  {
    type: 'architect',
    prefixTitle: 'Ar.',
    firmSuffixes: ['BIM & Facade Consultants', 'Parametric Labs', 'TechArch', 'Design Co'],
    services: 'BIM LOD 400 Coordination, High-Rise Commercial Planning, Facade Engineering, Clash Detection',
    bioTemplate: 'Multi-disciplinary BIM and commercial architecture firm executing IT parks, mixed-use developments, and healthcare campuses.',
    leadDaysBase: 10,
  },
  {
    type: 'architect',
    prefixTitle: 'Ar.',
    firmSuffixes: ['EcoHabitat Studio', 'Biophilic Design', 'Earth & Timber', 'GreenLine'],
    services: 'Sustainable & Passive Solar Design, Courtyard Homes, Rainwater Harvesting, Terracotta & Mud-Block Architecture',
    bioTemplate: 'IGBC-accredited sustainable studio focused on net-zero villas, natural cross-ventilation, and tropical South Indian courtyard planning.',
    leadDaysBase: 8,
  },
  {
    type: 'architect',
    prefixTitle: 'Er.',
    firmSuffixes: ['Structural Consultants', 'Civil Engg Works', 'Seismic Design', 'StructLab'],
    services: 'RCC Structural Design (IS 456 / IS 13920), ETABS & SAFE Analysis, Post-Tensioned Slabs, Soil Bearing Audit',
    bioTemplate: 'Structural engineering consultancy providing steel-optimized RCC framing schedules, cantilever detailing, and site rebar inspections.',
    leadDaysBase: 4,
  },
  {
    type: 'architect',
    prefixTitle: 'Ar.',
    firmSuffixes: ['Landscape & Courtyard', 'FloraForm', 'Outdoor Living', 'ScapeStudio'],
    services: 'Landscape Architecture, Terrace Gardens, Water Courts, External Hardscape & Irrigation Design',
    bioTemplate: 'Landscape design practice crafting tropical native plantations, pergola decks, and rainwater-fed courtyard ecosystems.',
    leadDaysBase: 6,
  },

  // Builders & Contractors (9 tracks)
  {
    type: 'builder',
    prefixTitle: 'Er.',
    firmSuffixes: ['Buildcon Pvt Ltd', 'Turnkey Homes', 'Constructions', 'Infra Projects'],
    services: 'Turnkey Villa Construction, Labour + Material Packages, Excavation to Handover, Milestone QA Billing',
    bioTemplate: 'Turnkey residential builder executing custom villas, duplexes, and rental co-living blocks with transparent BOQ rate contracts.',
    leadDaysBase: 7,
  },
  {
    type: 'builder',
    prefixTitle: 'Er.',
    firmSuffixes: ['Civil & RCC Contractors', 'FrameWorks', 'Concrete Craft', 'Structures'],
    services: 'RCC Framing & Shuttering, Bar Bending & Rebar Placement, Ready-Mix Pour Management, AAC Block Masonry',
    bioTemplate: 'Experienced civil superstructure contracting crew equipped with aluminum formwork, laser levels, and dedicated bar-bending teams.',
    leadDaysBase: 5,
  },
  {
    type: 'builder',
    prefixTitle: 'Sri',
    firmSuffixes: ['Interior Fit-Out & Joinery', 'ModuCraft Execution', 'WoodWorks Studio', 'Fitout Co'],
    services: 'Turnkey Interior Fit-Out, Factory CNC Modular Kitchens, Wardrobes, Gypsum Ceilings, Veneer Panelling',
    bioTemplate: 'Turnkey interior execution partner operating mechanized edge-banding workshops and skilled carpentry & false ceiling teams.',
    leadDaysBase: 6,
  },
  {
    type: 'builder',
    prefixTitle: 'Er.',
    firmSuffixes: ['MEP & HVAC Contractors', 'VoltFlow Systems', 'ElectroMech', 'Utility Infra'],
    services: 'Concealed Electrical Wiring, HT/LT Panels, VRV/VRF HVAC Ducting, Concealed Plumbing & Fire Fighting',
    bioTemplate: 'Licensed Class-1 electrical, plumbing, and HVAC contracting company delivering residential and commercial MEP installations.',
    leadDaysBase: 3,
  },
  {
    type: 'builder',
    prefixTitle: 'Er.',
    firmSuffixes: ['Waterproofing & Rehab', 'SealTech Civil', 'HydroShield', 'DampStop Works'],
    services: 'Terrace & Sunken Slab Waterproofing, PU Injection Grouting, Structural Retrofitting, Epoxy Flooring',
    bioTemplate: 'Specialized civil waterproofing and structural repair contractor offering 10-year leakage warranties and core-cut grouting.',
    leadDaysBase: 2,
  },
  {
    type: 'builder',
    prefixTitle: 'Er.',
    firmSuffixes: ['EPC & Commercial Infra', 'Skyline Builders', 'Metro Erectors', 'Engg Corp'],
    services: 'Commercial & Institutional EPC, Pre-Engineered Buildings (PEB), Industrial Warehouses, Basement Retaining Walls',
    bioTemplate: 'Grade-A commercial general contractor handling deep basement shoring, PEB steel sheds, and institutional campuses.',
    leadDaysBase: 14,
  },
  {
    type: 'builder',
    prefixTitle: 'Sri',
    firmSuffixes: ['Stone, Tile & Painting Crew', 'FinishLine Works', 'Artisan Surfaces', 'Coatings Co'],
    services: 'Italian Marble Laying & Mirror Polish, Large-Format Tiling, Texture Plastering, Interior & Exterior Painting',
    bioTemplate: 'Precision finishing contractor specializing in epoxy tile grouting, diamond stone polishing, and mechanized airless spray painting.',
    leadDaysBase: 3,
  },

  // Material Suppliers & Distributors (11 tracks)
  {
    type: 'material_supplier',
    prefixTitle: 'Sri',
    firmSuffixes: ['Steel & TMT Stockyard', 'Ferro Alloys Yard', 'Rebar Logistics', 'Iron & Steel'],
    services: 'Fe550D TMT Rebars (Tata, JSW, Jindal Panther, SAIL), Cut & Bend Services, Binding Wire, Structural MS Sections',
    bioTemplate: 'Authorized regional stockist supplying ISI-certified TMT bars with batch Mill Test Certificates and same-day site crane offloading.',
    leadDaysBase: 1,
  },
  {
    type: 'material_supplier',
    prefixTitle: 'Sri',
    firmSuffixes: ['Cement & RMC Hub', 'Concrete Solutions', 'BatchMix Depot', 'BuildMart'],
    services: 'OPC 53 / PPC Cement (UltraTech, ACC, Dalmia, JSW, Bharati), Ready-Mix Concrete M20-M40, Concrete Pumping',
    bioTemplate: 'Direct factory depot for bulk bagged cement and automated GPS-tracked RMC transit mixers across South India.',
    leadDaysBase: 1,
  },
  {
    type: 'material_supplier',
    prefixTitle: 'Sri',
    firmSuffixes: ['AAC Blocks & Aggregates', 'Quarry & Sand Depot', 'EcoBlock Yard', 'MasonSupply'],
    services: 'AAC Blocks (600x200x150/200mm), Block Joint Adhesive, VSI Washed M-Sand & P-Sand, 20mm/12mm Jelly Aggregates',
    bioTemplate: 'Bulk supplier of IS-compliant VSI washed M-Sand, plastering sand, solid concrete blocks, and lightweight AAC blocks.',
    leadDaysBase: 1,
  },
  {
    type: 'material_supplier',
    prefixTitle: 'Sri',
    firmSuffixes: ['Plywood, Veneer & Hardware', 'Timber Boards Hub', 'Laminate Gallery', 'WoodMart'],
    services: 'IS:710 BWR Marine Plywood, HDHMR Boards, Teak & Walnut Veneers, Merino/Greenlam Laminates, Hettich & Blum Hardware',
    bioTemplate: 'Wholesale architectural boards and interior hardware showroom stocked for carpenters, interior designers, and turnkey fitouts.',
    leadDaysBase: 2,
  },
  {
    type: 'material_supplier',
    prefixTitle: 'Sri',
    firmSuffixes: ['Marble, Granite & Quartz Yard', 'StoneCraft Gallery', 'Stones & Slabs', 'Tile Studio'],
    services: 'Italian Statuario & Botticino Marble, Engineered Quartz, Sadarahalli & Black Galaxy Granite, Vitrified Slabs',
    bioTemplate: 'Direct quarry and import yard offering gangsaw slabs, CNC countertop profiling, and project-rate vitrified tile bundles.',
    leadDaysBase: 2,
  },
  {
    type: 'material_supplier',
    prefixTitle: 'Sri',
    firmSuffixes: ['Paints, Putty & Waterproofing', 'ColorHub Depot', 'Coatings & Primers', 'TintStudio'],
    services: 'Asian Paints, Berger, Birla Opus, Dulux, Birla White Wall Putty, Dr. Fixit & Fosroc Waterproofing Chemicals',
    bioTemplate: 'Authorized paint dealership with automated tinting machines, exterior elastomeric coatings, and wholesale contractor pricing.',
    leadDaysBase: 1,
  },
  {
    type: 'material_supplier',
    prefixTitle: 'Er.',
    firmSuffixes: ['Electrical, Cables & Lighting', 'Lumen & Power Hub', 'ElectroSupply', 'LightCraft'],
    services: 'Polycab & Finolex FRLS Wires, Schneider/ABB Switchgear, Recessed COB Downlights, Magnetic Track & Smart Home Dimmers',
    bioTemplate: 'Authorized MEP electrical and architectural lighting distributor supplying residential towers, villas, and retail fitouts.',
    leadDaysBase: 2,
  },
  {
    type: 'material_supplier',
    prefixTitle: 'Sri',
    firmSuffixes: ['Plumbing & Sanitaryware', 'Bath & Pipe Mart', 'AquaGallery', 'HydroFittings'],
    services: 'Astral & Ashirvad CPVC/UPVC Pipes, Kohler, Jaquar & Grohe Bath Fittings, Concealed Cisterns, Pressure Pumps',
    bioTemplate: 'Complete plumbing stack and designer bathware distributor with ready project inventory and hydro-test valve kits.',
    leadDaysBase: 2,
  },
  {
    type: 'material_supplier',
    prefixTitle: 'Er.',
    firmSuffixes: ['Fenestration, UPVC & Glass', 'GlazeTech Systems', 'WindowCraft', 'AluFacade'],
    services: 'UPVC & Thermal-Break Aluminum Windows, Saint-Gobain Toughened & DGU Glass, Shower Cubicles, Glass Railings',
    bioTemplate: 'Custom window and architectural glass fabricator delivering acoustic double-glazed sliding systems with hardware warranties.',
    leadDaysBase: 5,
  },
  {
    type: 'material_supplier',
    prefixTitle: 'Er.',
    firmSuffixes: ['Solar, EV & Smart Automation', 'SunGrid Energy', 'GreenPower Tech', 'AeroHome'],
    services: 'On-Grid Rooftop Solar PV, Heat Pumps, EV Fast Chargers, Video Door Phones, Biometric Locks & Curtain Motors',
    bioTemplate: 'Clean energy and home automation supplier integrating solar net-metering, heat pump water heating, and smart access control.',
    leadDaysBase: 4,
  },
];

const SOUTH_INDIAN_FIRST_NAMES = [
  'Karthik', 'Arjun', 'Raghavendra', 'Siddharth', 'Ananya', 'Divya', 'Pranav', 'Nandini',
  'Vikram', 'Deepak', 'Shruthi', 'Naveen', 'Sandeep', 'Meenakshi', 'Rajesh', 'Kavya',
  'Harish', 'Suresh', 'Lakshmi', 'Mahesh', 'Varun', 'Sneha', 'Rohith', 'Pavithra',
  'Ashwin', 'Nikhil', 'Swathi', 'Vinay', 'Prashanth', 'Keerthana', 'Manoj', 'Bhavana',
  'Gautam', 'Chetan', 'Aishwarya', 'Kiran', 'Ganesh', 'Nagaraj', 'Ramesh', 'Sudha',
  'Balaji', 'Venkatesh', 'Dinesh', 'Shankar', 'Abhishek', 'Tanvi', 'Madhav', 'Srinivas',
];

const SOUTH_INDIAN_LAST_NAMES = [
  'Rao', 'Reddy', 'Gowda', 'Nair', 'Menon', 'Iyer', 'Iyengar', 'Murthy',
  'Krishnan', 'Subramanian', 'Natarajan', 'Deshmukh', 'Kulkarni', 'Hegde', 'Shetty', 'Kamath',
  'Pai', 'Bhat', 'Shastry', 'Naidu', 'Raju', 'Prasad', 'Sundaram', 'Arumugam',
  'Balakrishnan', 'Pillai', 'Kurian', 'Varghese', 'Prakash', 'Mohan', 'Narayanan', 'Venkataraman',
  'Patil', 'Joshi', 'Srinivasan', 'Ranganathan', 'Keshav', 'Ramachandran', 'Achar', 'Rajagopal',
];

const FIRM_BRAND_ROOTS = [
  'Deccan', 'Kaveri', 'Nandi', 'Sahyadri', 'Vijayanagar', 'Malabar', 'Coromandel', 'Tungabhadra',
  'Banyan', 'Monsoon', 'Laterite', 'Granite', 'Teakwood', 'Courtyard', 'Solstice', 'Meridian',
  'Zenith', 'Vertex', 'Axis', 'Plinth', 'Arches', 'Lintel', 'Cantilever', 'Keystone',
  'Chola', 'Hoysala', 'Chalukya', 'Nilgiri', 'Cauvery', 'Southern', 'Metro', 'Horizon',
  'Vastu', 'Prakriti', 'Aakar', 'Sthapati', 'Nirmana', 'Shilpa', 'Kala', 'Tecton',
  'Apex', 'Prime', 'Vanguard', 'Crest', 'Summit', 'Atlas', 'Kinetix', 'Core',
];

function generateSouthIndia3000Contacts(): ProfessionalProfile[] {
  const results: ProfessionalProfile[] = [];
  const totalCount = 3000;
  const hubsLen = DIRECTORY_HUBS.length; // 60 hubs * 50 contacts each = 3,000

  for (let i = 0; i < totalCount; i++) {
    const hub = DIRECTORY_HUBS[i % hubsLen];
    const round = Math.floor(i / hubsLen); // 0..49 within each hub
    const track = SPECIALTY_TRACKS[(i * 7 + round * 3) % SPECIALTY_TRACKS.length];

    const firstName = SOUTH_INDIAN_FIRST_NAMES[(i * 11 + round) % SOUTH_INDIAN_FIRST_NAMES.length];
    const lastName = SOUTH_INDIAN_LAST_NAMES[(i * 13 + round * 5) % SOUTH_INDIAN_LAST_NAMES.length];
    const brandRoot = FIRM_BRAND_ROOTS[(i + round * 7) % FIRM_BRAND_ROOTS.length];
    const suffix = track.firmSuffixes[(i + round) % track.firmSuffixes.length];

    const cityToken = hub.label.split(',')[0].trim();
    const companyName =
      round % 3 === 0
        ? `${brandRoot} ${suffix}`
        : round % 3 === 1
        ? `${cityToken} ${brandRoot} ${suffix}`
        : `${lastName} & ${brandRoot} ${suffix}`;

    const contactName = `${track.prefixTitle} ${firstName} ${lastName}`;

    // Deterministic unique mobile + landline
    const mobileBlockA = 90000 + ((i * 73 + 11421) % 9900);
    const mobileBlockB = 10000 + ((i * 137 + 42109) % 89999);
    const phoneDisplay =
      i % 2 === 0
        ? `+91 ${mobileBlockA} ${mobileBlockB}`
        : `+91 ${hub.stdCode} ${2200 + (i % 7799)} ${1000 + ((i * 31) % 8999)}`;
    const whatsappDisplay = `+91 ${mobileBlockA} ${mobileBlockB}`;

    const slug = `${brandRoot}-${cityToken}-${i + 1}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 26);

    const doorNo = (i * 17 + 12) % 480 + 1;
    const address = `No. ${doorNo}, ${hub.street}, ${hub.pinPrefix}`;

    const ratingRaw = 4.3 + ((i * 7 + round) % 8) * 0.1;
    const rating = Number(Math.min(5.0, ratingRaw).toFixed(1));
    const experienceYears = 4 + ((i * 3 + round * 2) % 28);
    const completedProjects =
      track.type === 'material_supplier'
        ? 45 + ((i * 19) % 580)
        : 12 + ((i * 11) % 190);

    const idNum = String(i + 1).padStart(4, '0');

    results.push({
      id: `si-dir-${idNum}`,
      professionalType: track.type,
      name: contactName,
      company: companyName,
      bio: `${track.bioTemplate} Operating from ${cityToken} serving ${hub.coverage}.`,
      services: track.services,
      location: hub.label,
      address,
      verified: i % 9 !== 0,
      rating,
      completedProjects,
      experienceYears,
      email: `desk@${slug}.in`,
      phone: phoneDisplay,
      whatsapp: whatsappDisplay,
      website: `https://${slug}.in`,
      liveStatus: i % 3 === 0 ? 'online' : i % 3 === 1 ? 'available' : 'in_consultation',
      leadTimeDays: track.leadDaysBase + (i % 4),
      deliveryCoverage: hub.coverage,
    });
  }

  return results;
}

export const SOUTH_INDIA_3000_CONTACTS: ProfessionalProfile[] = generateSouthIndia3000Contacts();

export const SOUTH_INDIA_REGION_LABELS: Record<string, string> = {
  all: 'All South India',
  bangalore: 'Bangalore Metro',
  karnataka: 'Rest of Karnataka',
  tamil_nadu: 'Tamil Nadu & Puducherry',
  telangana: 'Telangana',
  andhra: 'Andhra Pradesh',
  kerala: 'Kerala',
};

export function detectSouthIndiaRegion(location: string): string {
  const lower = (location || '').toLowerCase();
  if (lower.includes('bangalore') || lower.includes('bengaluru')) return 'bangalore';
  if (
    lower.includes('karnataka') ||
    lower.includes('mysore') ||
    lower.includes('mangalore') ||
    lower.includes('hubli') ||
    lower.includes('belagavi') ||
    lower.includes('shivamogga') ||
    lower.includes('tumakuru') ||
    lower.includes('udupi') ||
    lower.includes('ballari')
  ) {
    return 'karnataka';
  }
  if (
    lower.includes('tamil nadu') ||
    lower.includes('chennai') ||
    lower.includes('coimbatore') ||
    lower.includes('madurai') ||
    lower.includes('salem') ||
    lower.includes('tiruchirappalli') ||
    lower.includes('hosur') ||
    lower.includes('erode') ||
    lower.includes('puducherry')
  ) {
    return 'tamil_nadu';
  }
  if (
    lower.includes('telangana') ||
    lower.includes('hyderabad') ||
    lower.includes('secunderabad') ||
    lower.includes('warangal')
  ) {
    return 'telangana';
  }
  if (
    lower.includes('andhra') ||
    lower.includes('visakhapatnam') ||
    lower.includes('vijayawada') ||
    lower.includes('tirupati') ||
    lower.includes('guntur')
  ) {
    return 'andhra';
  }
  if (
    lower.includes('kerala') ||
    lower.includes('kochi') ||
    lower.includes('thiruvananthapuram') ||
    lower.includes('kozhikode') ||
    lower.includes('thrissur')
  ) {
    return 'kerala';
  }
  return 'other';
}
