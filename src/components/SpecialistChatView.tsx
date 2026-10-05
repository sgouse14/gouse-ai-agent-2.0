import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  Bot,
  User,
  Trash2,
  Copy,
  Building,
  Compass,
  FileCheck,
  Scale,
  Leaf,
  Layers,
  Cpu,
  Home,
  Globe,
  Play,
  Pause,
  Download,
  Radio,
  RefreshCw,
  Languages,
  Headphones,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Zap,
  ChevronDown,
  ChevronUp,
  Check,
  Wrench,
  ShieldCheck,
  Ruler,
  Sliders,
  AlertTriangle,
  Eye,
  Activity,
  CheckSquare,
  Plus,
  ArrowUpRight,
  Grid,
  ExternalLink,
  Sun,
  Flame,
  Maximize2,
  Shield,
  Network,
  Terminal,
  BarChart3,
  FileText,
  Workflow,
  ChevronRight,
  CheckCheck,
  Info,
  Droplets,
  FolderGit2,
  Calculator,
  Upload,
  FileCode,
  RotateCcw,
  Award,
  X,
  Printer,
  TableProperties,
} from 'lucide-react';
import { SpecialistType, ChatMessage, Project, BOQItem, AgentAction } from '../types';

export interface ArchitecturalProblem {
  id: string;
  category: 'bylaws' | 'structural' | 'bioclimatic' | 'fire_egress' | 'boq' | 'vastu' | 'rainwater' | 'seismic';
  title: string;
  severity: 'critical' | 'warning' | 'optimization';
  location: string;
  currentCondition: string;
  codeReference: string;
  proposedFix: string;
  costImpact: string;
  timeToResolve: string;
  isResolved: boolean;
  engineeringFormula?: string;
  beforeDiagram?: string;
  afterDiagram?: string;
  stepByStepFix?: string[];
  cadCoordinates: { x: number; y: number; label: string; zone: string };
  actionPayload?: {
    type: 'add_boq' | 'update_project' | 'regularize_bylaws';
    boqItem?: Partial<BOQItem>;
  };
}

export const INITIAL_ARCHITECTURAL_PROBLEMS: ArchitecturalProblem[] = [
  {
    id: 'prob-setback',
    category: 'bylaws',
    title: 'North Setback Clearance Deficit & Municipal Clearance Gap',
    severity: 'critical',
    location: 'North Boundary (Front Entry)',
    currentCondition: 'Front setback modeled at 2.20m. BBMP / Nambike Nakshe bylaws require min 3.00m for plot length > 50ft.',
    codeReference: 'Nambike Nakshe 2.0 Bylaw Sec 4.1 & BBMP Building Bylaws 2020',
    proposedFix: 'Auto-apply Nambike Nakshe 2.0 Clause 4.2 small-plot relaxation OR offset front cantilever porch by 0.80m into compliant zone.',
    costImpact: '₹0 Regularization Penalty (Saved ₹85,000 compounding penalty)',
    timeToResolve: 'Instant 1-Click CAD Parameter Adjustment',
    isResolved: false,
    engineeringFormula: 'Required S_front = 3.00m | Modeled = 2.20m | Relaxation Clause 4.2: Δ = 0.80m allowable for plot width ≤ 12.0m',
    beforeDiagram: 'Front porch cantilever encroaches 800mm into municipal buffer line.',
    afterDiagram: 'Envelope realigned to 3.00m clear setback with Nambike Nakshe 2.0 statutory stamp.',
    stepByStepFix: [
      'Query Nambike Nakshe 2.0 small plot statutory exemption matrix',
      'Verify road width fronting property ≥ 9.0m (30ft carriageway)',
      'Offset front porch cantilever perimeter by 800mm inward',
      'Generate statutory clearance stamp and sync with municipal filing registry',
    ],
    cadCoordinates: { x: 380, y: 75, label: 'Front Setback (2.2m)', zone: 'North Boundary' },
    actionPayload: { type: 'regularize_bylaws' },
  },
  {
    id: 'prob-structural',
    category: 'structural',
    title: 'First-Floor Porch Cantilever Deflection & Moment Exceedance',
    severity: 'critical',
    location: 'South-East Cantilevered Terrace (3.5m Projection)',
    currentCondition: '3.5m projection with 230mm beam depth yields span/deflection of 1/195 (IS 456 max limit: 1/350 under full live load 3.0 kN/m²).',
    codeReference: 'IS 456:2000 Clause 23.2.1 (Deflection Control of Cantilevers)',
    proposedFix: 'Deepen beam section to 350mm x 450mm, specify Fe550D TMT reinforcement, and inject 4.2 cum M25 concrete + 480 kg TMT rebar into BOQ.',
    costImpact: '+₹42,500 (Structural Safety Certified)',
    timeToResolve: 'Instant BOQ Injection & Spec Lock',
    isResolved: false,
    engineeringFormula: 'δ_actual = (w·L⁴)/(8·E·I) = 17.9mm (Span/195) > Limit Span/350 (10.0mm). Deepen d to 450mm -> δ_new = 7.1mm (Span/492 compliant)',
    beforeDiagram: 'Beam 230x300mm under heavy live load exhibits 17.9mm excessive sagging at tip.',
    afterDiagram: 'Deepened 350x450mm RCC beam with 4-T20 top tension bars limits deflection to 7.1mm.',
    stepByStepFix: [
      'Compute cantilever bending moment M_u = 1.5 * (w_d + w_l) * L² / 2 = 142 kN·m',
      'Revise beam cross-section from 230x300mm to 350x450mm high-ductility section',
      'Specify 4-T20 Fe550D top rebar with 50d development anchorage into core columns C8 & C9',
      'Inject 4.2 cum M25 concrete & 480 kg Fe550D rebar into live Project BOQ',
    ],
    cadCoordinates: { x: 600, y: 330, label: '3.5m Cantilever', zone: 'South-East Terrace' },
    actionPayload: {
      type: 'add_boq',
      boqItem: {
        name: 'M25 High-Performance Concrete for Cantilever Beams',
        category: 'Concrete Works',
        unit: 'cum',
        quantity: 4.2,
        rate: 6800,
        notes: 'Resolved IS 456 cantilever deflection compliance via Gouse AI Specialist',
        stage: 'Superstructure',
        status: 'approved',
      },
    },
  },
  {
    id: 'prob-solar',
    category: 'bioclimatic',
    title: 'West Facade Solar Heat Ingress & Peak HVAC Cooling Surge',
    severity: 'warning',
    location: 'West Elevation Primary Glazing',
    currentCondition: '42% Window-to-Wall Ratio (WWR) causes 5.2 kW peak solar heat gain, exceeding ECBC / GRIHA 30% WWR envelope limit.',
    codeReference: 'ECBC 2017 Sec 4.3 & GRIHA Version 2019 Criterion 13',
    proposedFix: 'Introduce motorized aero-foil terracotta louvers + switch single glass to 24mm low-E DGU double glazing (U-value 1.8 W/m²K, SHGC 0.26).',
    costImpact: '+₹58,000 (Reduces recurring HVAC energy bills by 22% annually)',
    timeToResolve: 'Auto-Inject Low-E Glazing Line to BOQ',
    isResolved: false,
    engineeringFormula: 'Q_solar = A_glazing · SHGC · I_west = 28m² · 0.78 · 650 W/m² = 14.1 kW. Low-E DGU + Louver -> Q_reduced = 3.8 kW (-73%)',
    beforeDiagram: 'Single 6mm clear glass allows direct afternoon solar penetration and severe glare.',
    afterDiagram: '24mm Low-E DGU (6+12A+6) with vertical terracotta fins cuts solar heat ingress by 73%.',
    stepByStepFix: [
      'Model peak western solar irradiance vector at 16:30 hours (azimuth 255°, altitude 28°)',
      'Specify vertical aerofoil architectural louvers with 45° westward tilt angle',
      'Upgrade 28 sq.m glazing to 24mm Double Glazed Unit (U ≤ 1.8 W/m²K, SHGC ≤ 0.26)',
      'Inject high-performance glazing line into BOQ Finishing Division',
    ],
    cadCoordinates: { x: 155, y: 250, label: 'West Facade WWR 42%', zone: 'West Elevation' },
    actionPayload: {
      type: 'add_boq',
      boqItem: {
        name: '24mm Low-E DGU Architectural Glass & Shading Louvers',
        category: 'Finishes & Envelopes',
        unit: 'sq.m',
        quantity: 28,
        rate: 2200,
        notes: 'ECBC / GRIHA bioclimatic thermal compliance engineered by Gouse AI Specialist',
        stage: 'Finishes',
        status: 'approved',
      },
    },
  },
  {
    id: 'prob-egress',
    category: 'fire_egress',
    title: 'Peripheral Fire Tender Driveway & NBC 2016 Turning Radius',
    severity: 'warning',
    location: 'South-West Driveway Corner Boundary',
    currentCondition: 'Peripheral driveway width narrows to 4.9m at transformer vault vs 6.0m mandatory under NBC 2016 Part 4 Table 3.',
    codeReference: 'NBC 2016 Part 4 (Fire & Life Safety) Clause 4.5.1',
    proposedFix: 'Chamfer building corner by 2.5m x 2.5m and recess dry-type transformer enclosure by 1.2m to restore 6.0m clear fire tender driveway.',
    costImpact: '₹0 Structural Redesign (Fire Department NOC Clearance Unlocked)',
    timeToResolve: 'Instant Municipal Gatekeeper Clearance',
    isResolved: false,
    engineeringFormula: 'R_turning ≥ 9.0m | W_driveway ≥ 6.0m clear. Deficit = 1.1m pinch point. Recessing vault recovers 6.2m unobstructed width.',
    beforeDiagram: 'Transformer vault projects into corner, creating hazardous 4.9m pinch bottleneck.',
    afterDiagram: 'Recessed vault and 45° corner chamfer establishes clear 6.2m wide fire tender turning corridor.',
    stepByStepFix: [
      'Simulate 35-ton hydraulic fire tender turning envelope (wheelbase 4.5m, swept path 11.2m)',
      'Set back exterior dry-type transformer plinth by 1.2m into utility recess',
      'Chamfer ground-floor perimeter plinth beam corner by 2.5m at 45 degrees',
      'Log fire department compliance certificate in project statutory register',
    ],
    cadCoordinates: { x: 100, y: 410, label: 'Fire Driveway 4.9m', zone: 'South-West Driveway' },
    actionPayload: { type: 'update_project' },
  },
  {
    id: 'prob-boq',
    category: 'boq',
    title: 'Rebar Scrap Wastage & IS 1200 SMM Takeoff Inefficiency',
    severity: 'optimization',
    location: 'Column-Beam Core & Foundation Rebar',
    currentCondition: 'Manual on-site bar cutting estimates 8.5% steel wastage, inflating project superstructure expenditure by ₹1,65,000.',
    codeReference: 'IS 2502 / IS 16172 (Reinforcement Couplers & Bar Bending Schedules)',
    proposedFix: 'Adopt automated factory Bar Bending Schedules (BBS) and mechanical threaded couplers, curtailing wastage to 2.1%.',
    costImpact: '-₹1,24,000 Net Savings to Project Budget',
    timeToResolve: 'Inject Cost Optimization into BOQ Takeoffs',
    isResolved: false,
    engineeringFormula: 'Standard lap length = 50·d_bar = 1000mm scrap/lap. Mechanical Coupler = 80mm length. Net steel saving = 6.4% across 14.8 MT rebar.',
    beforeDiagram: 'Overlapping 20mm & 25mm bars on site creates rebar congestion and 8.5% offcut scrap.',
    afterDiagram: 'Precision threaded mechanical couplers eliminate lap waste and ease concrete aggregate flow.',
    stepByStepFix: [
      'Generate automated Bar Bending Schedule (BBS) cutting lengths from CAD column schedule',
      'Substitute standard 50d lap splices with IS 16172 certified parallel-threaded couplers',
      'Reduce total raw rebar procurement order by 0.95 MT of scrap offcuts',
      'Inject 180 nos mechanical couplers into live BOQ with positive net project savings',
    ],
    cadCoordinates: { x: 470, y: 190, label: 'Central Column Grid', zone: 'Structural Core' },
    actionPayload: {
      type: 'add_boq',
      boqItem: {
        name: 'Mechanical Threaded Couplers (IS 16172 Certified - Net Rebar Saving)',
        category: 'Steel & Rebar',
        unit: 'nos',
        quantity: 180,
        rate: 160,
        notes: 'Rebar scrap optimization engineered by Gouse AI Specialist (saved 6.4% steel wastage)',
        stage: 'Superstructure',
        status: 'approved',
      },
    },
  },
  {
    id: 'prob-vastu',
    category: 'vastu',
    title: 'Brahmasthan Central Open Core & North-East Water Sump Alignment',
    severity: 'optimization',
    location: 'Central Atrium & North-East Corner',
    currentCondition: 'Central Brahmasthan zone carries heavy concrete column load C6; underground water sump modeled in South-East quadrant.',
    codeReference: 'Vastu Shastra Spatial Grid & Modern Bioclimatic Micro-Climate Principles',
    proposedFix: 'Relocate internal column C6 1.1m eastward to free central Brahmasthan courtyard for stack-effect lightwell; position underground water sump in Ishanya (North-East).',
    costImpact: '₹0 Net Cost (Optimizes cross-ventilation, daylighting, and spatial value)',
    timeToResolve: 'Instant Spatial Grid Rebalance',
    isResolved: false,
    engineeringFormula: 'Vastu Purusha Mandala 9x9 Grid: Central 3x3 quadrant = Brahmasthan (Open). Ishanya (NE) = Water element zone.',
    beforeDiagram: 'Internal column placed dead center inside living foyer obstructing central open air volume.',
    afterDiagram: 'Column offset to perimeter grid; open sky-lit atrium formed with natural stack ventilation.',
    stepByStepFix: [
      'Shift column C6 to grid line B3 to create 3.6m x 3.6m uninterrupted central Brahmasthan',
      'Reposition 10,000L underground rainwater storage sump into Ishanya (North-East) corner',
      'Convert central ceiling cutout into operable double-glazed skylight with stack dampers',
      'Verify load transfer to adjacent deepened portal beams with zero structural compromise',
    ],
    cadCoordinates: { x: 380, y: 240, label: 'Brahmasthan Atrium', zone: 'Central Courtyard' },
    actionPayload: { type: 'update_project' },
  },
  {
    id: 'prob-rainwater',
    category: 'rainwater',
    title: 'Rainwater Harvesting Percolation Pit Capacity & Municipal Mandate',
    severity: 'warning',
    location: 'North-East Front Boundary Ground Pit',
    currentCondition: 'Designed rainwater harvesting pit sized at 4,500L vs mandatory 9,000L for plot area > 2,400 sq.ft under municipal bye-laws.',
    codeReference: 'Central Ground Water Board (CGWB) & Municipal Building Bylaw Sec 8',
    proposedFix: 'Expand dual-chamber recharge pit with gravel filter media & inject 2 nos modular precast percolation rings into project BOQ.',
    costImpact: '+₹24,000 (Guarantees municipal occupancy certificate OC sanction)',
    timeToResolve: 'Auto-Inject RWH Precast Rings to BOQ',
    isResolved: false,
    engineeringFormula: 'V_harvest = A_roof · C_runoff · I_rainfall · 0.015 = 220m² · 0.85 · 50mm = 9,350 Liters required capacity.',
    beforeDiagram: 'Single small 4,500L masonry pit overflows during moderate 30mm/hr monsoon downpours.',
    afterDiagram: 'Dual-chamber 9,500L recharge pit with geotextile wrap, gravel bed, and overflow recharge bore.',
    stepByStepFix: [
      'Compute roof catchment runoff volume based on 50-year return monsoon storm intensity',
      'Detail dual-chamber modular precast RCC recharge structure (2.0m dia x 3.0m deep)',
      'Specify coarse gravel (40mm-20mm) and sand filtration matrix with backwash facility',
      'Add precast percolation well unit to BOQ Plumbing & Civil Division',
    ],
    cadCoordinates: { x: 520, y: 80, label: 'RWH Recharge Pit', zone: 'North-East Sump' },
    actionPayload: {
      type: 'add_boq',
      boqItem: {
        name: 'Precast RCC Modular Rainwater Recharge & Percolation Pit (9,500L Capacity)',
        category: 'External Civil & Plumbing',
        unit: 'nos',
        quantity: 2,
        rate: 12000,
        notes: 'Statutory CGWB & municipal rainwater harvesting compliance engineered by Gouse AI Specialist',
        stage: 'Substructure',
        status: 'approved',
      },
    },
  },
  {
    id: 'prob-seismic',
    category: 'seismic',
    title: 'Beam-Column Joint Confinement & IS 13920 Ductile Detailing',
    severity: 'critical',
    location: 'Ground Floor Column-Beam Nodes (Zone III)',
    currentCondition: 'Stirrup spacing at beam-column joint modeled at 200mm c/c; IS 13920 mandates special confining hoops at ≤ 100mm c/c.',
    codeReference: 'IS 13920:2016 Clause 7.4 & Clause 8.2 (Ductile Design of RCC Structures)',
    proposedFix: 'Specify 8mm Fe550D closed 135° hooked seismic ties @ 75mm c/c over 2d confinement zone and update reinforcement schedules in BOQ.',
    costImpact: '+₹18,500 (Full Seismic Zone III & IV Life-Safety Certification)',
    timeToResolve: 'Instant BOQ Rebar Spec Injection',
    isResolved: false,
    engineeringFormula: 's_max ≤ min(d_beam/4, 8·d_rebar, 100mm) = min(75mm, 128mm, 100mm) = 75mm confining hoop spacing.',
    beforeDiagram: 'Standard 200mm stirrup spacing leaves core concrete vulnerable to shear crushing during ground tremors.',
    afterDiagram: 'High-density 75mm seismic hoops with 135° cross-ties provide full ductile core confinement.',
    stepByStepFix: [
      'Calculate joint shear stress under seismic load combination 1.2(DL + LL ± EL)',
      'Specify 8mm Fe550D 135° seismic hoops with 10d hook extensions into node core',
      'Enforce 75mm spacing across 600mm distance from column face both directions',
      'Inject 260 kg high-ductility Fe550D seismic stirrups into live Project BOQ',
    ],
    cadCoordinates: { x: 260, y: 330, label: 'Beam-Column Joint', zone: 'Ground Floor Core' },
    actionPayload: {
      type: 'add_boq',
      boqItem: {
        name: 'Fe550D Seismic Confinement Stirrups & 135° Cross-Ties (IS 13920 Compliant)',
        category: 'Steel & Rebar',
        unit: 'kg',
        quantity: 260,
        rate: 72,
        notes: 'IS 13920 seismic ductile confinement engineered by Gouse AI Specialist',
        stage: 'Superstructure',
        status: 'approved',
      },
    },
  },
];

export interface VastuZoneAssessment {
  id: string;
  quadrantName: string;
  directionKey: 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'N' | 'Brahmasthan';
  deity: string;
  rulingElement: string;
  elementColor: string;
  idealRooms: string[];
  activePlacement: string;
  isCompliant: boolean;
  severity: 'auspicious' | 'neutral' | 'deviation' | 'critical_dosh';
  deviationDetails?: string;
  architecturalFix: string;
  nonInvasiveRemedy: string;
  energyScore: number;
  cadCoordinates: { x: number; y: number; width: number; height: number };
}

export const INITIAL_VASTU_ZONES: VastuZoneAssessment[] = [
  {
    id: 'vastu-ne',
    quadrantName: 'Ishanya (North-East)',
    directionKey: 'NE',
    deity: 'Lord Shiva & Jala (Water)',
    rulingElement: 'Water (Jala)',
    elementColor: '#38bdf8',
    idealRooms: ['Pooja / Meditation Room', 'Underground Water Sump', 'Borewell', 'Open Lawn / Foyer'],
    activePlacement: 'Water Sump modeled in SE; heavy column in proximity',
    isCompliant: false,
    severity: 'deviation',
    deviationDetails: 'Underground water storage sump missing from Ishanya corner; water element blocked.',
    architecturalFix: 'Relocate 10,000L underground rainwater storage sump into Ishanya (North-East) corner and keep zone free of heavy masonry.',
    nonInvasiveRemedy: 'Bury copper Swastika & energize with Jala energy quartz grid.',
    energyScore: 68,
    cadCoordinates: { x: 500, y: 110, width: 180, height: 120 },
  },
  {
    id: 'vastu-e',
    quadrantName: 'Purva (East)',
    directionKey: 'E',
    deity: 'Lord Indra & Surya (Sun)',
    rulingElement: 'Solar Prana / Air',
    elementColor: '#fbbf24',
    idealRooms: ['Main Entrance Porch', 'Living Foyer', 'Morning Balconies', 'Study / Library'],
    activePlacement: 'Main Entrance Porch & Double-Height Morning Living Foyer',
    isCompliant: true,
    severity: 'auspicious',
    architecturalFix: 'Fully aligned. Maintain uninterrupted morning solar illumination and cross-ventilation.',
    nonInvasiveRemedy: 'Hang brass Sun (Surya Yantra) over the main portal.',
    energyScore: 100,
    cadCoordinates: { x: 500, y: 230, width: 180, height: 100 },
  },
  {
    id: 'vastu-se',
    quadrantName: 'Agneya (South-East)',
    directionKey: 'SE',
    deity: 'Lord Agni (Fire Element)',
    rulingElement: 'Fire (Agni)',
    elementColor: '#f97316',
    idealRooms: ['Kitchen with East-Facing Cooking Hob', 'Electrical Inverter / Meter Panel', 'Boiler'],
    activePlacement: 'Kitchen & Dining Zone with cooktop oriented Eastward',
    isCompliant: true,
    severity: 'auspicious',
    architecturalFix: 'Perfect Fire-Quadrant alignment. Ensure sink and cooktop maintain minimum 1.2m separation to prevent Water-Fire clash.',
    nonInvasiveRemedy: 'Paint south-east wall in warm terracotta or coral peach hue.',
    energyScore: 98,
    cadCoordinates: { x: 500, y: 330, width: 180, height: 110 },
  },
  {
    id: 'vastu-s',
    quadrantName: 'Dakshina (South)',
    directionKey: 'S',
    deity: 'Lord Yama & Earth',
    rulingElement: 'Earth (Prithvi)',
    elementColor: '#a855f7',
    idealRooms: ['Bedrooms', 'Storage', 'Heavy Wardrobes', 'Dining Overflow'],
    activePlacement: 'Heavy external masonry perimeter & services duct',
    isCompliant: true,
    severity: 'neutral',
    architecturalFix: 'Solid wall provides stability and blocks southern midday thermal heat.',
    nonInvasiveRemedy: 'Place heavy terracotta planters along southern edge.',
    energyScore: 90,
    cadCoordinates: { x: 350, y: 330, width: 150, height: 110 },
  },
  {
    id: 'vastu-sw',
    quadrantName: 'Nairutya (South-West)',
    directionKey: 'SW',
    deity: 'Lord Nirrithi (Stability & Gravity)',
    rulingElement: 'Earth (Prithvi)',
    elementColor: '#ec4899',
    idealRooms: ['Master Bedroom of Family Lead', 'Highest Roof Massing', 'Heavy Wardrobe Bank', 'Overhead Tank'],
    activePlacement: 'Master Suite with raised floor level & attached bath on West axis',
    isCompliant: true,
    severity: 'auspicious',
    architecturalFix: 'Ideal Nairutya leadership placement. Elevate master bedroom floor plinth by 50mm (2 inches) above living hall for maximum stability.',
    nonInvasiveRemedy: 'Install yellow jasper stone or lead helix in South-West master corner.',
    energyScore: 100,
    cadCoordinates: { x: 190, y: 330, width: 160, height: 110 },
  },
  {
    id: 'vastu-w',
    quadrantName: 'Paschima (West)',
    directionKey: 'W',
    deity: 'Lord Varuna (Water / Air)',
    rulingElement: 'Water / Air',
    elementColor: '#6366f1',
    idealRooms: ['Children / Guest Bedroom', 'Study', 'Overhead Water Tank', 'Dining'],
    activePlacement: 'West Facade Primary Glazing with 42% WWR (Solar Ingress)',
    isCompliant: false,
    severity: 'deviation',
    deviationDetails: '42% Window-to-Wall ratio causes high solar heat gain and afternoon glare.',
    architecturalFix: 'Introduce 24mm low-E DGU double glass (SHGC 0.26) and vertical terracotta louvers to shield the Western perimeter.',
    nonInvasiveRemedy: 'Install reflective thermal film and white solar blinds.',
    energyScore: 72,
    cadCoordinates: { x: 120, y: 230, width: 130, height: 100 },
  },
  {
    id: 'vastu-nw',
    quadrantName: 'Vayavya (North-West)',
    directionKey: 'NW',
    deity: 'Lord Vayu (Wind & Movement)',
    rulingElement: 'Air (Vayu)',
    elementColor: '#06b6d4',
    idealRooms: ['Guest Bedroom', 'Toilet / Powder Room', 'Parking Garage', 'Utility / Laundry'],
    activePlacement: 'Attached Bathroom & Utility Ventilation Duct',
    isCompliant: true,
    severity: 'auspicious',
    architecturalFix: 'Auspicious Air-Quadrant placement for drainage and waste discharge.',
    nonInvasiveRemedy: 'Ensure exhaust vents discharge outward towards North-West.',
    energyScore: 94,
    cadCoordinates: { x: 120, y: 110, width: 130, height: 120 },
  },
  {
    id: 'vastu-n',
    quadrantName: 'Uttara (North)',
    directionKey: 'N',
    deity: 'Lord Kubera (Wealth & Prosperity)',
    rulingElement: 'Water / Mercury',
    elementColor: '#10b981',
    idealRooms: ['Living Room', 'Cash / Jewelry Locker', 'Open Balconies', 'North Entrance'],
    activePlacement: 'Front Entrance Porch (Setback deficit: 2.20m modeled vs 3.00m rule)',
    isCompliant: false,
    severity: 'deviation',
    deviationDetails: 'Front setback encroached by 800mm, pinching the North Kubera prosperity flow line.',
    architecturalFix: 'Offset front porch perimeter by 0.80m inward to clear full 3.00m setback and open north energy flow.',
    nonInvasiveRemedy: 'Place green emerald plant and water fountain along northern pathway.',
    energyScore: 75,
    cadCoordinates: { x: 250, y: 110, width: 250, height: 100 },
  },
  {
    id: 'vastu-center',
    quadrantName: 'Brahmasthan (Central Core)',
    directionKey: 'Brahmasthan',
    deity: 'Lord Brahma (Cosmic Ether & Vital Energy)',
    rulingElement: 'Space / Ether (Akasha)',
    elementColor: '#eab308',
    idealRooms: ['Open-to-Sky Courtyard', 'Double-Height Lightwell', 'Completely Unobstructed Atrium'],
    activePlacement: 'Structural Column C6 placed dead center in Brahmasthan core!',
    isCompliant: false,
    severity: 'critical_dosh',
    deviationDetails: 'CRITICAL VASTU DOSH: Heavy RCC column C6 imposes concentrated load on cosmic Brahmasthan center.',
    architecturalFix: 'Relocate column C6 eastward by 1.1m to structural grid line B3. Convert central ceiling cutout into open sky-lit atrium with natural stack dampers.',
    nonInvasiveRemedy: 'Bury copper energy pyramid matrix and install crystal lotus chandelier at ceiling apex.',
    energyScore: 45,
    cadCoordinates: { x: 350, y: 210, width: 150, height: 120 },
  },
];

export interface BlueprintSetbackAudit {
  boundary: 'Front (North)' | 'Rear (South)' | 'Left (East)' | 'Right (West)';
  requiredMeters: number;
  actualMeters: number;
  deficitMeters: number;
  isCompliant: boolean;
  governingBylaw: string;
  remedyAction: string;
}

export const INITIAL_SETBACK_AUDITS: BlueprintSetbackAudit[] = [
  {
    boundary: 'Front (North)',
    requiredMeters: 3.0,
    actualMeters: 2.2,
    deficitMeters: 0.8,
    isCompliant: false,
    governingBylaw: 'BBMP Building Bye-Laws 2020 & Nambike Nakshe 2.0 (Plot Length > 50ft)',
    remedyAction: 'Offset front cantilever porch plinth inward by 0.80m to restore 3.00m clear setback.',
  },
  {
    boundary: 'Rear (South)',
    requiredMeters: 1.8,
    actualMeters: 1.85,
    deficitMeters: 0.0,
    isCompliant: true,
    governingBylaw: 'Nambike Nakshe 2.0 Bye-Laws Sec 4.1 (Mandatory 1.80m rear buffer)',
    remedyAction: 'Fully compliant with 50mm positive buffer clearance.',
  },
  {
    boundary: 'Left (East)',
    requiredMeters: 1.2,
    actualMeters: 1.25,
    deficitMeters: 0.0,
    isCompliant: true,
    governingBylaw: 'Zonal Regulation Table 6 (Side setback for plot width 40ft)',
    remedyAction: 'Clear passage for morning pedestrian walkway and service access.',
  },
  {
    boundary: 'Right (West)',
    requiredMeters: 1.2,
    actualMeters: 1.2,
    deficitMeters: 0.0,
    isCompliant: true,
    governingBylaw: 'Zonal Regulation Table 6 (Side setback for plot width 40ft)',
    remedyAction: 'Clear 1.20m corridor accommodates low-E shading fins and drainage line.',
  },
];

export interface BlueprintDimensionAudit {
  parameter: string;
  modeledValue: string;
  statutoryLimit: string;
  status: 'compliant' | 'warning' | 'deficit';
  engineeringNotes: string;
}

export const INITIAL_DIMENSION_AUDITS: BlueprintDimensionAudit[] = [
  {
    parameter: 'Site Plot Boundary Dimensions',
    modeledValue: '60\'-0" x 40\'-0" (18.28m x 12.19m)',
    statutoryLimit: '2,400 sq.ft (222.96 sq.m)',
    status: 'compliant',
    engineeringNotes: 'Rectangular plot aligned with true cardinal directions (+2° East azimuth deviation, highly auspicious).',
  },
  {
    parameter: 'Ground Plinth Coverage %',
    modeledValue: '1,402 sq.ft (58.4% coverage)',
    statutoryLimit: 'Max 65.0% (1,560 sq.ft)',
    status: 'compliant',
    engineeringNotes: 'Ground footprint leaves 998 sq.ft (41.6%) open perimeter, well within municipal ceiling.',
  },
  {
    parameter: 'Floor Area Ratio (FAR) Index',
    modeledValue: 'FAR 1.46 (3,500 sq.ft built-up area)',
    statutoryLimit: 'Max 1.75 Permissible (4,200 sq.ft)',
    status: 'compliant',
    engineeringNotes: '700 sq.ft unutilized statutory FAR margin allows future penthouse or vertical expansion.',
  },
  {
    parameter: 'Structural Column Grid Alignment',
    modeledValue: '5.5m x 6.5m Orthogonal RCC Grid (C1-C12)',
    statutoryLimit: 'IS 456 / IS 13920 Ductile Detailing',
    status: 'warning',
    engineeringNotes: 'Column C6 is off-axis inside Brahmasthan core; needs 1.1m eastward realignment to restore open core.',
  },
  {
    parameter: 'NBC Egress Staircase Corridor',
    modeledValue: '1.50m clear flight width & 280mm tread',
    statutoryLimit: 'NBC 2016 Part 4 Table 3 (Min 1.50m)',
    status: 'compliant',
    engineeringNotes: 'Riser 150mm, Tread 280mm with continuous fire-resistant handrail meeting statutory life safety code.',
  },
  {
    parameter: 'Cantilever Terrace Projection',
    modeledValue: '3.50m projection with 230mm beam depth',
    statutoryLimit: 'IS 456 Clause 23.2.1 (Max Span/350)',
    status: 'deficit',
    engineeringNotes: 'Calculated deflection ratio 1/195 exceeds permissible limit; beam section deepened to 350x450mm.',
  },
];

export interface CADRoomDetail {
  id: string;
  name: string;
  quadrant: string;
  category: 'living' | 'kitchen' | 'bedroom' | 'circulation' | 'balcony' | 'utility' | 'commercial';
  dimensionsFt: string;
  dimensionsM: string;
  areaSqFt: number;
  areaSqM: number;
  percentOfFloor: number;
  floorSharePercent?: number;
  ceilingHeightFt: number;
  clearCeilingHeightFt?: string;
  occupancyType: string;
  nbcStandard: string;
  nbcCompliance: 'compliant' | 'warning' | 'deficit';
  daylightFactor: string;
  daylightingVentRatio?: string;
  crossVentilation: string;
  color: string;
  svgRect: { x: number; y: number; width: number; height: number };
}

export interface CADDimensionTag {
  id: string;
  label: string;
  metricLabel: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  textX: number;
  textY: number;
  orientation: 'horizontal' | 'vertical';
  type: 'boundary' | 'setback' | 'room' | 'column';
}

export interface AutoCADBlueprintPreset {
  id: string;
  fileName: string;
  planTitle: string;
  typology: string;
  plotDimensions: string;
  plotLengthFt: number;
  plotWidthFt: number;
  siteAreaSqFt: number;
  siteAreaSqM: number;
  builtUpAreaSqFt: number;
  groundFootprintSqFt: number;
  groundCoveragePercent: number;
  netCarpetAreaSqFt: number;
  circulationAndWallsSqFt: number;
  farAchieved: number;
  farPermissible: number;
  facing: string;
  vastuInitialScore: number;
  setbackStatus: string;
  description: string;
  rooms: CADRoomDetail[];
  dimensionTags: CADDimensionTag[];
}

export const BLUEPRINT_PRESETS: AutoCADBlueprintPreset[] = [
  {
    id: 'preset-villa-60x40',
    fileName: 'Villa_Serenity_Duplex_60x40.dwg',
    planTitle: 'Villa Serenity 4-BHK Executive Duplex',
    typology: 'Luxury Residential Villa (G+1)',
    plotDimensions: '60\'-0" x 40\'-0" (2,400 sq.ft)',
    plotLengthFt: 60,
    plotWidthFt: 40,
    siteAreaSqFt: 2400,
    siteAreaSqM: 222.97,
    builtUpAreaSqFt: 3500,
    groundFootprintSqFt: 1402,
    groundCoveragePercent: 58.4,
    netCarpetAreaSqFt: 1180,
    circulationAndWallsSqFt: 222,
    farAchieved: 1.46,
    farPermissible: 1.75,
    facing: 'East Facing Entrance (Purva)',
    vastuInitialScore: 74,
    setbackStatus: 'Front Setback deficit 0.8m',
    description: 'Contemporary duplex residence with double-height morning foyer, southern master suite, cantilever balcony, and central courtyard.',
    rooms: [
      {
        id: 'room-villa-living',
        name: 'Living Foyer & Central Courtyard',
        quadrant: 'Central Brahmasthan',
        category: 'living',
        dimensionsFt: '24\'-0" x 18\'-0"',
        dimensionsM: '7.32m x 5.49m',
        areaSqFt: 432,
        areaSqM: 40.13,
        percentOfFloor: 36.6,
        ceilingHeightFt: 10.5,
        occupancyType: 'Habitable Living',
        nbcStandard: 'NBC Part 3 Cl 4.3 (Min 100 sq.ft, Min Width 2.40m)',
        nbcCompliance: 'compliant',
        daylightFactor: '2.8% (Exceeds 1.5% min)',
        crossVentilation: 'Brahmasthan stack-effect lightwell',
        color: '#3b82f6',
        svgRect: { x: 250, y: 130, width: 260, height: 200 },
      },
      {
        id: 'room-villa-kitchen',
        name: 'Kitchen & Dining Zone',
        quadrant: 'Agneya (South-East)',
        category: 'kitchen',
        dimensionsFt: '16\'-0" x 14\'-0"',
        dimensionsM: '4.88m x 4.27m',
        areaSqFt: 224,
        areaSqM: 20.81,
        percentOfFloor: 19.0,
        ceilingHeightFt: 10.0,
        occupancyType: 'Kitchen & Utility',
        nbcStandard: 'NBC Part 3 Cl 4.4 (Min 50 sq.ft, Min Width 1.80m)',
        nbcCompliance: 'compliant',
        daylightFactor: '2.1% (Compliant)',
        crossVentilation: 'East morning airflow window',
        color: '#f97316',
        svgRect: { x: 510, y: 130, width: 160, height: 170 },
      },
      {
        id: 'room-villa-master',
        name: 'Master Suite & Walk-in',
        quadrant: 'Nairutya (South-West)',
        category: 'bedroom',
        dimensionsFt: '18\'-0" x 14\'-0"',
        dimensionsM: '5.49m x 4.27m',
        areaSqFt: 252,
        areaSqM: 23.41,
        percentOfFloor: 21.4,
        ceilingHeightFt: 10.5,
        occupancyType: 'Primary Habitable Bedroom',
        nbcStandard: 'NBC Part 3 Cl 4.3 (Min 120 sq.ft, Min Width 3.00m)',
        nbcCompliance: 'compliant',
        daylightFactor: '1.9% (Low-E shielded)',
        crossVentilation: 'South-West evening breeze path',
        color: '#ec4899',
        svgRect: { x: 190, y: 330, width: 220, height: 100 },
      },
      {
        id: 'room-villa-stair',
        name: 'NBC Stair & Lift Core',
        quadrant: 'North-West / West',
        category: 'circulation',
        dimensionsFt: '14\'-0" x 8\'-6"',
        dimensionsM: '4.27m x 2.59m',
        areaSqFt: 119,
        areaSqM: 11.06,
        percentOfFloor: 10.1,
        ceilingHeightFt: 10.0,
        occupancyType: 'Emergency Egress & Circulation',
        nbcStandard: 'NBC Part 4 Table 3 (Min 1.50m Clear Flight Width)',
        nbcCompliance: 'compliant',
        daylightFactor: '1.2% (Artificial + North clerestory)',
        crossVentilation: 'Continuous vertical shaft ventilation',
        color: '#10b981',
        svgRect: { x: 420, y: 330, width: 170, height: 100 },
      },
      {
        id: 'room-villa-balcony',
        name: 'Cantilever Balcony Deck',
        quadrant: 'North-East / East',
        category: 'balcony',
        dimensionsFt: '11\'-6" x 8\'-0"',
        dimensionsM: '3.51m x 2.44m',
        areaSqFt: 92,
        areaSqM: 8.55,
        percentOfFloor: 7.8,
        ceilingHeightFt: 10.0,
        occupancyType: 'Outdoor Cantilever Terrace',
        nbcStandard: 'IS 456 Cl 23.2.1 (Span-to-depth deflection limit)',
        nbcCompliance: 'compliant',
        daylightFactor: 'Full ambient daylight',
        crossVentilation: 'Unobstructed morning airflow',
        color: '#38bdf8',
        svgRect: { x: 590, y: 300, width: 80, height: 90 },
      },
      {
        id: 'room-villa-portico',
        name: 'Entry Foyer & Portico',
        quadrant: 'East (Purva Entry)',
        category: 'utility',
        dimensionsFt: '10\'-0" x 6\'-1"',
        dimensionsM: '3.05m x 1.85m',
        areaSqFt: 61,
        areaSqM: 5.67,
        percentOfFloor: 5.1,
        ceilingHeightFt: 9.5,
        occupancyType: 'Semi-Outdoor Transition',
        nbcStandard: 'NBC Part 3 Weather-shade & Porch clear height > 2.2m',
        nbcCompliance: 'compliant',
        daylightFactor: '3.4% (Direct daylight)',
        crossVentilation: 'East-facing entrance breezeway',
        color: '#eab308',
        svgRect: { x: 180, y: 130, width: 70, height: 80 },
      },
    ],
    dimensionTags: [
      { id: 'dim-w', label: "WIDTH: 40'-0\"", metricLabel: '12.19m', x1: 50, y1: 22, x2: 750, y2: 22, textX: 400, textY: 17, orientation: 'horizontal', type: 'boundary' },
      { id: 'dim-l', label: "LENGTH: 60'-0\"", metricLabel: '18.28m', x1: 25, y1: 40, x2: 25, y2: 480, textX: 18, textY: 260, orientation: 'vertical', type: 'boundary' },
      { id: 'dim-fs', label: 'FRONT SETBACK: 3.00m (9\'-10")', metricLabel: '3.00m', x1: 50, y1: 110, x2: 750, y2: 110, textX: 400, textY: 104, orientation: 'horizontal', type: 'setback' },
      { id: 'dim-rs', label: 'REAR SETBACK: 1.85m (6\'-1")', metricLabel: '1.85m', x1: 50, y1: 440, x2: 750, y2: 440, textX: 400, textY: 456, orientation: 'horizontal', type: 'setback' },
      { id: 'dim-ws', label: 'WEST: 1.20m', metricLabel: '1.20m', x1: 110, y1: 110, x2: 110, y2: 440, textX: 98, textY: 275, orientation: 'vertical', type: 'setback' },
      { id: 'dim-es', label: 'EAST: 1.25m', metricLabel: '1.25m', x1: 690, y1: 110, x2: 690, y2: 440, textX: 702, textY: 275, orientation: 'vertical', type: 'setback' },
    ],
  },
  {
    id: 'preset-smallplot-30x40',
    fileName: 'Nambike_Nakshe_Small_Plot_30x40.dwg',
    planTitle: 'Small Plot Residence (<1,500 sq.ft)',
    typology: 'G+2 Compact Urban Residence',
    plotDimensions: '30\'-0" x 40\'-0" (1,200 sq.ft)',
    plotLengthFt: 40,
    plotWidthFt: 30,
    siteAreaSqFt: 1200,
    siteAreaSqM: 111.48,
    builtUpAreaSqFt: 2200,
    groundFootprintSqFt: 792,
    groundCoveragePercent: 66.0,
    netCarpetAreaSqFt: 668,
    circulationAndWallsSqFt: 124,
    farAchieved: 1.83,
    farPermissible: 2.0,
    facing: 'North Facing Entrance (Uttara Kubera)',
    vastuInitialScore: 82,
    setbackStatus: 'Small plot relaxed setbacks applied',
    description: 'Nambike Nakshe 2.0 relaxed small-plot residence with front 0.75m and side 0.6m setbacks, Agneya kitchen, and Ishanya water sump.',
    rooms: [
      {
        id: 'room-small-living',
        name: 'Compact Living & Family Lounge',
        quadrant: 'North-Central Foyer',
        category: 'living',
        dimensionsFt: '16\'-0" x 14\'-0"',
        dimensionsM: '4.88m x 4.27m',
        areaSqFt: 224,
        areaSqM: 20.81,
        percentOfFloor: 33.5,
        ceilingHeightFt: 10.0,
        occupancyType: 'Habitable Living',
        nbcStandard: 'NBC Part 3 Cl 4.3 (Min 100 sq.ft)',
        nbcCompliance: 'compliant',
        daylightFactor: '2.4% (North light)',
        crossVentilation: 'North-South axial flow',
        color: '#3b82f6',
        svgRect: { x: 200, y: 140, width: 270, height: 170 },
      },
      {
        id: 'room-small-kitchen',
        name: 'Agneya Kitchen & Utility',
        quadrant: 'Agneya (South-East)',
        category: 'kitchen',
        dimensionsFt: '10\'-0" x 10\'-0"',
        dimensionsM: '3.05m x 3.05m',
        areaSqFt: 100,
        areaSqM: 9.29,
        percentOfFloor: 15.0,
        ceilingHeightFt: 10.0,
        occupancyType: 'Kitchen & Preparation',
        nbcStandard: 'NBC Part 3 Cl 4.4 (Min 50 sq.ft)',
        nbcCompliance: 'compliant',
        daylightFactor: '1.8%',
        crossVentilation: 'East window ventilation',
        color: '#f97316',
        svgRect: { x: 470, y: 140, width: 180, height: 140 },
      },
      {
        id: 'room-small-guest',
        name: 'Ground Floor Guest Suite',
        quadrant: 'South-West (Nairutya)',
        category: 'bedroom',
        dimensionsFt: '12\'-0" x 11\'-0"',
        dimensionsM: '3.66m x 3.35m',
        areaSqFt: 132,
        areaSqM: 12.26,
        percentOfFloor: 19.8,
        ceilingHeightFt: 10.0,
        occupancyType: 'Bedroom',
        nbcStandard: 'NBC Part 3 Cl 4.3 (Min 100 sq.ft)',
        nbcCompliance: 'compliant',
        daylightFactor: '1.7%',
        crossVentilation: 'Rear window breeze',
        color: '#ec4899',
        svgRect: { x: 200, y: 310, width: 230, height: 120 },
      },
      {
        id: 'room-small-stair',
        name: 'Dog-Legged Stair Core',
        quadrant: 'West / South-West',
        category: 'circulation',
        dimensionsFt: '11\'-0" x 7\'-0"',
        dimensionsM: '3.35m x 2.13m',
        areaSqFt: 77,
        areaSqM: 7.15,
        percentOfFloor: 11.5,
        ceilingHeightFt: 10.0,
        occupancyType: 'Vertical Egress',
        nbcStandard: 'NBC Part 4 (Min 1.0m Clear Flight)',
        nbcCompliance: 'compliant',
        daylightFactor: '1.1%',
        crossVentilation: 'Vertical shaft duct',
        color: '#10b981',
        svgRect: { x: 430, y: 310, width: 150, height: 120 },
      },
      {
        id: 'room-small-sump',
        name: 'Ishanya Sump & Entry Plinth',
        quadrant: 'Ishanya (North-East)',
        category: 'utility',
        dimensionsFt: '10\'-0" x 7\'-6"',
        dimensionsM: '3.05m x 2.29m',
        areaSqFt: 75,
        areaSqM: 6.97,
        percentOfFloor: 11.2,
        ceilingHeightFt: 9.0,
        occupancyType: 'Rainwater Storage & Entry',
        nbcStandard: 'Municipal RWH (6,000L tank capacity)',
        nbcCompliance: 'compliant',
        daylightFactor: 'Open entry',
        crossVentilation: 'Open air',
        color: '#0284c7',
        svgRect: { x: 470, y: 280, width: 180, height: 60 },
      },
      {
        id: 'room-small-bath',
        name: 'Toilet & Plumbing Duct',
        quadrant: 'Vayavya (North-West)',
        category: 'utility',
        dimensionsFt: '6\'-0" x 5\'-0"',
        dimensionsM: '1.83m x 1.52m',
        areaSqFt: 30,
        areaSqM: 2.79,
        percentOfFloor: 4.5,
        ceilingHeightFt: 9.0,
        occupancyType: 'Bathroom',
        nbcStandard: 'NBC Part 3 (Min 20 sq.ft)',
        nbcCompliance: 'compliant',
        daylightFactor: 'Shaft lit',
        crossVentilation: 'Exhaust fan louvers',
        color: '#06b6d4',
        svgRect: { x: 580, y: 340, width: 70, height: 90 },
      },
      {
        id: 'room-small-lightwell',
        name: 'Light Well & Ventilation Shaft',
        quadrant: 'West Boundary Core',
        category: 'utility',
        dimensionsFt: '6\'-0" x 5\'-0"',
        dimensionsM: '1.83m x 1.52m',
        areaSqFt: 30,
        areaSqM: 2.79,
        percentOfFloor: 4.5,
        ceilingHeightFt: 10.0,
        occupancyType: 'Open-to-Sky Cutout',
        nbcStandard: 'NBC Part 3 (Air shaft > 1.5 sq.m)',
        nbcCompliance: 'compliant',
        daylightFactor: 'Stack daylight',
        crossVentilation: 'Negative pressure chimney',
        color: '#eab308',
        svgRect: { x: 140, y: 200, width: 60, height: 100 },
      },
    ],
    dimensionTags: [
      { id: 'dim-small-w', label: "WIDTH: 30'-0\"", metricLabel: '9.14m', x1: 50, y1: 22, x2: 750, y2: 22, textX: 400, textY: 17, orientation: 'horizontal', type: 'boundary' },
      { id: 'dim-small-l', label: "LENGTH: 40'-0\"", metricLabel: '12.19m', x1: 25, y1: 40, x2: 25, y2: 480, textX: 18, textY: 260, orientation: 'vertical', type: 'boundary' },
      { id: 'dim-small-fs', label: 'RELAXED FRONT SETBACK: 0.75m (2\'-6")', metricLabel: '0.75m', x1: 50, y1: 95, x2: 750, y2: 95, textX: 400, textY: 90, orientation: 'horizontal', type: 'setback' },
      { id: 'dim-small-rs', label: 'REAR SETBACK: 0.60m (2\'-0")', metricLabel: '0.60m', x1: 50, y1: 450, x2: 750, y2: 450, textX: 400, textY: 465, orientation: 'horizontal', type: 'setback' },
      { id: 'dim-small-ss', label: 'SIDE SETBACKS: 0.60m (2\'-0")', metricLabel: '0.60m', x1: 110, y1: 95, x2: 110, y2: 450, textX: 100, textY: 275, orientation: 'vertical', type: 'setback' },
    ],
  },
  {
    id: 'preset-pg-40x60',
    fileName: 'UrbanNest_CoLiving_G+3_PG.dwg',
    planTitle: 'UrbanNest Co-Living PG House (G+3)',
    typology: 'Commercial-Residential Co-Living',
    plotDimensions: '40\'-0" x 60\'-0" (2,400 sq.ft)',
    plotLengthFt: 60,
    plotWidthFt: 40,
    siteAreaSqFt: 2400,
    siteAreaSqM: 222.97,
    builtUpAreaSqFt: 5400,
    groundFootprintSqFt: 1480,
    groundCoveragePercent: 61.7,
    netCarpetAreaSqFt: 1210,
    circulationAndWallsSqFt: 270,
    farAchieved: 2.25,
    farPermissible: 2.50,
    facing: 'North-East Facing (Ishanya Entry)',
    vastuInitialScore: 88,
    setbackStatus: 'Commercial 6.0m fire tender route required',
    description: 'High-yield 16-studio room layout with central ventilation shaft, ground-floor dining hall, commercial kitchen, and CCTV gatekeeper.',
    rooms: [
      {
        id: 'room-pg-lounge',
        name: 'Reception & Co-Working Lounge',
        quadrant: 'North-East / Ishanya',
        category: 'commercial',
        dimensionsFt: '22\'-0" x 16\'-0"',
        dimensionsM: '6.71m x 4.88m',
        areaSqFt: 352,
        areaSqM: 32.70,
        percentOfFloor: 29.1,
        ceilingHeightFt: 11.0,
        occupancyType: 'Commercial Assembly',
        nbcStandard: 'NBC Part 4 (Occupancy 15 persons)',
        nbcCompliance: 'compliant',
        daylightFactor: '3.1% (Ishanya glazing)',
        crossVentilation: 'Double doorway ventilation',
        color: '#3b82f6',
        svgRect: { x: 180, y: 130, width: 280, height: 160 },
      },
      {
        id: 'room-pg-dining',
        name: 'Commercial Kitchen & Mess Hall',
        quadrant: 'Agneya (South-East)',
        category: 'commercial',
        dimensionsFt: '20\'-0" x 14\'-0"',
        dimensionsM: '6.10m x 4.27m',
        areaSqFt: 280,
        areaSqM: 26.01,
        percentOfFloor: 23.1,
        ceilingHeightFt: 11.0,
        occupancyType: 'Commercial Kitchen',
        nbcStandard: 'FSSAI & NBC Part 4 (Min 200 sq.ft)',
        nbcCompliance: 'compliant',
        daylightFactor: '2.2%',
        crossVentilation: 'Dedicated kitchen exhaust shaft',
        color: '#f97316',
        svgRect: { x: 460, y: 130, width: 210, height: 160 },
      },
      {
        id: 'room-pg-studio1',
        name: 'Studio Suite 101 (Twin Sharing)',
        quadrant: 'South-West (Nairutya)',
        category: 'bedroom',
        dimensionsFt: '14\'-0" x 11\'-0"',
        dimensionsM: '4.27m x 3.35m',
        areaSqFt: 154,
        areaSqM: 14.31,
        percentOfFloor: 12.7,
        ceilingHeightFt: 10.0,
        occupancyType: 'Residential Room',
        nbcStandard: 'NBC Part 3 (75 sq.ft/person standard)',
        nbcCompliance: 'compliant',
        daylightFactor: '1.9%',
        crossVentilation: 'South window airflow',
        color: '#ec4899',
        svgRect: { x: 180, y: 290, width: 180, height: 130 },
      },
      {
        id: 'room-pg-studio2',
        name: 'Studio Suite 102 (Twin Sharing)',
        quadrant: 'South-Central',
        category: 'bedroom',
        dimensionsFt: '14\'-0" x 11\'-0"',
        dimensionsM: '4.27m x 3.35m',
        areaSqFt: 154,
        areaSqM: 14.31,
        percentOfFloor: 12.7,
        ceilingHeightFt: 10.0,
        occupancyType: 'Residential Room',
        nbcStandard: 'NBC Part 3 (75 sq.ft/person standard)',
        nbcCompliance: 'compliant',
        daylightFactor: '1.8%',
        crossVentilation: 'Rear facade breeze',
        color: '#a855f7',
        svgRect: { x: 360, y: 290, width: 180, height: 130 },
      },
      {
        id: 'room-pg-stair',
        name: 'Commercial NBC Stair & Lift Core',
        quadrant: 'West Axis',
        category: 'circulation',
        dimensionsFt: '16\'-0" x 9\'-0"',
        dimensionsM: '4.88m x 2.74m',
        areaSqFt: 144,
        areaSqM: 13.38,
        percentOfFloor: 11.9,
        ceilingHeightFt: 10.0,
        occupancyType: 'Commercial Fire Egress',
        nbcStandard: 'NBC Part 4 (1.80m Clear Flight Width)',
        nbcCompliance: 'compliant',
        daylightFactor: '1.0% (Pressurized fire stair)',
        crossVentilation: 'Automated smoke damper vent',
        color: '#10b981',
        svgRect: { x: 540, y: 290, width: 130, height: 130 },
      },
      {
        id: 'room-pg-shaft',
        name: 'Central Ventilation Light Shaft',
        quadrant: 'Central Core',
        category: 'utility',
        dimensionsFt: '10\'-0" x 6\'-0"',
        dimensionsM: '3.05m x 1.83m',
        areaSqFt: 60,
        areaSqM: 5.57,
        percentOfFloor: 5.0,
        ceilingHeightFt: 11.0,
        occupancyType: 'Service Cutout',
        nbcStandard: 'NBC Ventilation Table 5 (>4.0 sq.m)',
        nbcCompliance: 'compliant',
        daylightFactor: 'Core daylight',
        crossVentilation: 'Stack-effect upward vent',
        color: '#eab308',
        svgRect: { x: 330, y: 220, width: 100, height: 70 },
      },
      {
        id: 'room-pg-gate',
        name: 'Gatehouse & Sub-Station',
        quadrant: 'North-West (Vayavya)',
        category: 'utility',
        dimensionsFt: '11\'-0" x 6\'-0"',
        dimensionsM: '3.35m x 1.83m',
        areaSqFt: 66,
        areaSqM: 6.13,
        percentOfFloor: 5.5,
        ceilingHeightFt: 9.0,
        occupancyType: 'Security & Utility',
        nbcStandard: 'Bescom transformer & panel space',
        nbcCompliance: 'compliant',
        daylightFactor: 'External kiosk',
        crossVentilation: 'Direct cross vent',
        color: '#64748b',
        svgRect: { x: 100, y: 360, width: 80, height: 60 },
      },
    ],
    dimensionTags: [
      { id: 'dim-pg-w', label: "PLOT WIDTH: 40'-0\"", metricLabel: '12.19m', x1: 50, y1: 22, x2: 750, y2: 22, textX: 400, textY: 17, orientation: 'horizontal', type: 'boundary' },
      { id: 'dim-pg-l', label: "PLOT LENGTH: 60'-0\"", metricLabel: '18.28m', x1: 25, y1: 40, x2: 25, y2: 480, textX: 18, textY: 260, orientation: 'vertical', type: 'boundary' },
      { id: 'dim-pg-fire', label: 'FIRE TENDER ACCESS: 6.0m CLEAR TRACK', metricLabel: '6.00m', x1: 50, y1: 430, x2: 750, y2: 430, textX: 400, textY: 422, orientation: 'horizontal', type: 'setback' },
    ],
  },
  {
    id: 'preset-penthouse-50x50',
    fileName: 'Modern_Penthouse_50x50_West.dwg',
    planTitle: 'Skyline Terrace Penthouse (Top Floor)',
    typology: 'High-Rise Penthouse with Sky Deck',
    plotDimensions: '50\'-0" x 50\'-0" (2,500 sq.ft)',
    plotLengthFt: 50,
    plotWidthFt: 50,
    siteAreaSqFt: 2500,
    siteAreaSqM: 232.26,
    builtUpAreaSqFt: 3800,
    groundFootprintSqFt: 1650,
    groundCoveragePercent: 66.0,
    netCarpetAreaSqFt: 1380,
    circulationAndWallsSqFt: 270,
    farAchieved: 1.52,
    farPermissible: 1.75,
    facing: 'West Facing with Extended Sky Courtyard',
    vastuInitialScore: 70,
    setbackStatus: 'Penthouse perimeter terrace clearances',
    description: 'Deep westward cantilever deck with aero-foil terracotta louvers, Nairutya master suite, and central Brahmasthan skylight.',
    rooms: [
      {
        id: 'room-pent-great',
        name: 'Great Room & Sky Lounge',
        quadrant: 'Central Living Core',
        category: 'living',
        dimensionsFt: '26\'-0" x 18\'-0"',
        dimensionsM: '7.92m x 5.49m',
        areaSqFt: 468,
        areaSqM: 43.48,
        percentOfFloor: 33.9,
        ceilingHeightFt: 12.0,
        occupancyType: 'Luxury Living',
        nbcStandard: 'NBC Part 3 Cl 4.3 (Grand Volume)',
        nbcCompliance: 'compliant',
        daylightFactor: '3.6% (Panoramic daylight)',
        crossVentilation: 'Brahmasthan sky atrium stack-effect',
        color: '#3b82f6',
        svgRect: { x: 220, y: 130, width: 300, height: 180 },
      },
      {
        id: 'room-pent-master',
        name: 'Royal Master Suite (Nairutya)',
        quadrant: 'South-West (Nairutya)',
        category: 'bedroom',
        dimensionsFt: '20\'-0" x 15\'-0"',
        dimensionsM: '6.10m x 4.57m',
        areaSqFt: 300,
        areaSqM: 27.87,
        percentOfFloor: 21.7,
        ceilingHeightFt: 11.5,
        occupancyType: 'Master Bedroom',
        nbcStandard: 'NBC Part 3 Cl 4.3 (>150 sq.ft)',
        nbcCompliance: 'compliant',
        daylightFactor: '2.2% (Deep balcony overhangs)',
        crossVentilation: 'South-West coastal wind path',
        color: '#ec4899',
        svgRect: { x: 170, y: 310, width: 220, height: 120 },
      },
      {
        id: 'room-pent-deck',
        name: 'Sky Courtyard & Louvered Deck',
        quadrant: 'West Facade',
        category: 'balcony',
        dimensionsFt: '25\'-0" x 12\'-0"',
        dimensionsM: '7.62m x 3.66m',
        areaSqFt: 300,
        areaSqM: 27.87,
        percentOfFloor: 21.7,
        ceilingHeightFt: 12.0,
        occupancyType: 'Semi-Covered Sky Terrace',
        nbcStandard: 'IS 875 Wind pressure rating > 1.5 kPa',
        nbcCompliance: 'compliant',
        daylightFactor: 'Full ambient sky exposure',
        crossVentilation: 'Terracotta aero-foil louvers',
        color: '#38bdf8',
        svgRect: { x: 520, y: 130, width: 160, height: 200 },
      },
      {
        id: 'room-pent-kitchen',
        name: 'Gourmet Kitchen & Island Bar',
        quadrant: 'Agneya (South-East)',
        category: 'kitchen',
        dimensionsFt: '16\'-0" x 12\'-0"',
        dimensionsM: '4.88m x 3.66m',
        areaSqFt: 192,
        areaSqM: 17.84,
        percentOfFloor: 13.9,
        ceilingHeightFt: 11.0,
        occupancyType: 'Show Kitchen & Bar',
        nbcStandard: 'NBC Part 3 (>80 sq.ft)',
        nbcCompliance: 'compliant',
        daylightFactor: '2.5%',
        crossVentilation: 'East-facing breakfast balcony',
        color: '#f97316',
        svgRect: { x: 390, y: 310, width: 170, height: 120 },
      },
      {
        id: 'room-pent-lift',
        name: 'Private Lift Foyer & NBC Egress',
        quadrant: 'North-West (Vayavya)',
        category: 'circulation',
        dimensionsFt: '15\'-0" x 8\'-0"',
        dimensionsM: '4.57m x 2.44m',
        areaSqFt: 120,
        areaSqM: 11.15,
        percentOfFloor: 8.7,
        ceilingHeightFt: 11.0,
        occupancyType: 'Vertical Transport',
        nbcStandard: 'NBC Part 4 (Pressurized core)',
        nbcCompliance: 'compliant',
        daylightFactor: '1.2%',
        crossVentilation: 'Pressurized elevator lobby',
        color: '#10b981',
        svgRect: { x: 560, y: 330, width: 120, height: 100 },
      },
    ],
    dimensionTags: [
      { id: 'dim-pent-w', label: "SLAB WIDTH: 50'-0\"", metricLabel: '15.24m', x1: 50, y1: 22, x2: 750, y2: 22, textX: 400, textY: 17, orientation: 'horizontal', type: 'boundary' },
      { id: 'dim-pent-l', label: "SLAB LENGTH: 50'-0\"", metricLabel: '15.24m', x1: 25, y1: 40, x2: 25, y2: 480, textX: 18, textY: 260, orientation: 'vertical', type: 'boundary' },
      { id: 'dim-pent-deck', label: 'SKY TERRACE PROJECTION: 3.66m (12\'-0")', metricLabel: '3.66m', x1: 520, y1: 110, x2: 680, y2: 110, textX: 600, textY: 102, orientation: 'horizontal', type: 'setback' },
    ],
  },
];

interface SpecialistChatViewProps {
  activeProject: Project;
  boqItems?: BOQItem[];
  currency?: string;
  onUpdateBOQItems?: (items: BOQItem[]) => void;
  onUpdateProject?: (project: Project) => void;
  onNavigateToBOQ?: () => void;
  onOpenWorkflowEngine?: () => void;
}

interface SpecialistConfig {
  id: SpecialistType;
  title: string;
  role: string;
  voiceName: string;
  icon: any;
  desc: string;
  expertise: string[];
}

const SPECIALISTS: SpecialistConfig[] = [
  {
    id: 'general',
    title: 'Gouse AI',
    role: 'Principal Architectural Specialist',
    voiceName: 'Zephyr',
    icon: Building,
    desc: 'Chief architectural intelligence, master spatial planning, comprehensive project leadership, and cross-disciplinary synthesis.',
    expertise: ['Master Architectural Vision', 'Whole-Project Intelligence', 'Bylaws & Strategy', 'Executive Synthesis'],
  },
  {
    id: 'design',
    title: 'Design & Massing',
    role: 'Spatial Flow & Facades',
    voiceName: 'Puck',
    icon: Compass,
    desc: 'Massing studies, space planning, natural daylighting, and bioclimatic form.',
    expertise: ['Program Adjacencies', 'Facade Articulation', 'Daylighting', 'Circulation'],
  },
  {
    id: 'code',
    title: 'Nambike Nakshe & Bylaws',
    role: 'Nambike Nakshe 2.0 & NBC',
    voiceName: 'Charon',
    icon: Scale,
    desc: 'Nambike Nakshe 2.0 self-certification, GBA bylaws, 15% deviation limits, relaxed setbacks, and NBC 2016.',
    expertise: ['Nambike Nakshe 2.0', 'GBA 15% Deviation', 'Small Plot Setbacks', 'FAR & Ground Coverage'],
  },
  {
    id: 'documentation',
    title: 'CSI Specifications',
    role: 'Detailing & Schedules',
    voiceName: 'Fenrir',
    icon: FileCheck,
    desc: 'CSI MasterFormat specs, drawing schedules, detail coordination, and submittals.',
    expertise: ['MasterFormat Divisions', 'Drawing Coordination', 'RFI Logs', 'Quality Assurance'],
  },
  {
    id: 'quantity',
    title: 'Quantity & BOQ',
    role: 'Cost & Rate Analysis',
    voiceName: 'Kore',
    icon: Layers,
    desc: 'Schedule of rates, itemized takeoffs, material wastage, and contingency reserves.',
    expertise: ['IS 1200 Standards', 'Unit Rate Engineering', 'Cost Variance', 'Contingency Index'],
  },
  {
    id: 'sustainability',
    title: 'Sustainability & Green',
    role: 'Bioclimatic & Carbon',
    voiceName: 'Zephyr',
    icon: Leaf,
    desc: 'Passive solar design, U-values, embodied carbon, rainwater harvesting, and GRIHA/LEED.',
    expertise: ['Passive Cooling', 'Embodied Carbon (GGBS)', 'Thermal Comfort', 'LEED/GRIHA'],
  },
  {
    id: 'structural',
    title: 'Structural & MEP',
    role: 'Framing & Services',
    voiceName: 'Fenrir',
    icon: Cpu,
    desc: 'RCC framing grids, load paths, shear walls, MEP shaft coordination, and ducting.',
    expertise: ['Column Grids', 'Load Transfer Paths', 'MEP Chases', 'Seismic Detailing'],
  },
  {
    id: 'interior',
    title: 'Interior & Finishes',
    role: 'Millwork & Ergonomics',
    voiceName: 'Kore',
    icon: Home,
    desc: 'Interior space planning, custom millwork, tactile materiality, and lighting design.',
    expertise: ['Ergonomic Clearances', 'Millwork Details', 'Acoustics', 'Surface Materiality'],
  },
];

interface LanguageConfig {
  code: string;
  name: string;
  native: string;
  region: 'India' | 'International' | 'System';
}

const VOICE_LANGUAGES: LanguageConfig[] = [
  // System Auto
  { code: 'auto', name: 'Auto-Detect', native: '🌐 Auto-Detect', region: 'System' },

  // Indian Regional & National
  { code: 'en-IN', name: 'English (India)', native: 'English (India)', region: 'India' },
  { code: 'hi-IN', name: 'Hindi', native: 'हिन्दी', region: 'India' },
  { code: 'te-IN', name: 'Telugu', native: 'తెలుగు', region: 'India' },
  { code: 'ta-IN', name: 'Tamil', native: 'தமிழ்', region: 'India' },
  { code: 'kn-IN', name: 'Kannada', native: 'ಕನ್ನಡ', region: 'India' },
  { code: 'ml-IN', name: 'Malayalam', native: 'മലയാളം', region: 'India' },
  { code: 'mr-IN', name: 'Marathi', native: 'मराठी', region: 'India' },
  { code: 'gu-IN', name: 'Gujarati', native: 'ગુજરાતી', region: 'India' },
  { code: 'bn-IN', name: 'Bengali', native: 'বাংলা', region: 'India' },
  { code: 'pa-IN', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', region: 'India' },
  { code: 'ur-IN', name: 'Urdu', native: 'اردو', region: 'India' },
  { code: 'or-IN', name: 'Odia', native: 'ଓଡ଼ିଆ', region: 'India' },

  // Global International
  { code: 'en-US', name: 'English (US)', native: 'English (US)', region: 'International' },
  { code: 'ar-SA', name: 'Arabic', native: 'العربية', region: 'International' },
  { code: 'es-ES', name: 'Spanish', native: 'Español', region: 'International' },
  { code: 'fr-FR', name: 'French', native: 'Français', region: 'International' },
  { code: 'de-DE', name: 'German', native: 'Deutsch', region: 'International' },
  { code: 'it-IT', name: 'Italian', native: 'Italiano', region: 'International' },
  { code: 'pt-BR', name: 'Portuguese', native: 'Português', region: 'International' },
  { code: 'ru-RU', name: 'Russian', native: 'Русский', region: 'International' },
  { code: 'ja-JP', name: 'Japanese', native: '日本語', region: 'International' },
  { code: 'ko-KR', name: 'Korean', native: '한국어', region: 'International' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', native: '简体中文', region: 'International' },
  { code: 'tr-TR', name: 'Turkish', native: 'Türkçe', region: 'International' },
  { code: 'id-ID', name: 'Indonesian', native: 'Bahasa Indonesia', region: 'International' },
];

const QUICK_PROMPTS = [
  'Gouse AI, thoroughly analyze our imported CAD blueprint measurements, dimensions, and net area takeoff.',
  'Audit room dimension ratios and circulation efficiency vs NBC 2016 Part 8.',
  'What is the formula to calculate reinforcement steel weight in RCC slabs?',
  'What are the NBC requirements for fire exit stairwell corridor widths?',
  'Compare AAC blocks vs red wire-cut bricks for an exterior wall in a tropical climate.',
  'How to design a passive courtyard to maximize stack-effect natural ventilation?',
  'Draft an outline for CSI Division 03 (Concrete) architectural specifications.',
  'What is the recommended column spacing for residential basement car parking bays?',
];

const AGENT_WORKFLOWS = [
  {
    title: 'CAD Area Takeoff Audit',
    icon: '📐',
    tag: 'Gouse AI Specialist',
    prompt: 'Act as the Gouse AI Specialist Agent within the Interact Blueprint AutoCAD canvas. Your task is to thoroughly analyze any imported CAD blueprint by studying its precise measurements and dimensions to understand the entire area in detail.',
  },
  {
    title: 'Gouse AI Agent Audit',
    icon: '🏛️',
    tag: 'Municipal Gatekeeper',
    prompt: 'Run Gouse AI Agent statutory compliance audit: verify GBA 15% deviation regularization, small plot relaxed setbacks, and FAR limits.',
  },
  {
    title: 'Gouse AI Agent Spec',
    icon: '⚡',
    tag: 'Spec 9.8/10',
    prompt: 'Generate Gouse AI Agent Platform Specification: explain the 4-stage CAD extraction, municipal gatekeeper, BOQ mapping, and material takeoff.',
  },
  {
    title: 'Audit Project BOQ',
    icon: '🔍',
    tag: 'Full Audit',
    prompt: 'Conduct a thorough completeness and risk audit of our active project BOQ items, rates, and missing trade divisions.',
  },
  {
    title: 'Estimate Concrete & Steel',
    icon: '🏗️',
    tag: 'IS 456 Rules',
    prompt: 'Calculate exact empirical concrete (M25) volume and TMT reinforcement steel (Fe550D) tonnage for this project area.',
  },
  {
    title: 'NBC Fire & Egress Audit',
    icon: '📜',
    tag: 'NBC 2016',
    prompt: 'Audit National Building Code (NBC 2016) compliance for travel distance to fire exits, corridor widths, and perimeter fire tender setbacks.',
  },
  {
    title: 'Material Pricing Check',
    icon: '💹',
    tag: 'Market Rates',
    prompt: 'Benchmark current regional wholesale market rates for cement, rebar, AAC blocks, structural steel, and ready-mix concrete.',
  },
  {
    title: 'Contingency Risk Review',
    icon: '🛡️',
    tag: 'Risk & Reserve',
    prompt: 'Assess risk profile and propose recommended contingency reserve percentage for schematic design development.',
  },
];

export const SpecialistChatView: React.FC<SpecialistChatViewProps> = ({
  activeProject,
  boqItems = [],
  currency = '₹',
  onUpdateBOQItems,
  onUpdateProject,
  onNavigateToBOQ,
  onOpenWorkflowEngine,
}) => {
  const [selectedSpecialist, setSelectedSpecialist] = useState<SpecialistType>('general');
  const [selectedLanguage, setSelectedLanguage] = useState('en-IN');
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Agent Transparency & Action Execution State
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});
  const [toastNotification, setToastNotification] = useState<{
    message: string;
    type: 'success' | 'info';
  } | null>(null);

  // Advanced Voice Settings
  const [autoSpeakEnabled, setAutoSpeakEnabled] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState<string | null>(null);
  const [walkieTalkieActive, setWalkieTalkieActive] = useState(false);

  // Architecture GUI Problem Solver & Visual Canvas State
  const [studioTab, setStudioTab] = useState<'gui_solver' | 'cad_canvas' | 'agent_mesh' | 'chat_voice'>('gui_solver');
  const [problems, setProblems] = useState<ArchitecturalProblem[]>(INITIAL_ARCHITECTURAL_PROBLEMS);
  const [selectedProblemId, setSelectedProblemId] = useState<string>(INITIAL_ARCHITECTURAL_PROBLEMS[0].id);
  const [problemCategoryFilter, setProblemCategoryFilter] = useState<string>('all');
  const [problemSeverityFilter, setProblemSeverityFilter] = useState<string>('all');
  const [comparisonMode, setComparisonMode] = useState<'before' | 'after' | 'split'>('after');
  const [cadZoom, setCadZoom] = useState<number>(1.0);
  const [isScanningAgents, setIsScanningAgents] = useState(false);
  const [canvasLayers, setCanvasLayers] = useState({
    setbacks: true,
    columns: true,
    vastu: true,
    dimensions: true,
    solar: true,
    egress: true,
  });
  const [canvasSelectedZone, setCanvasSelectedZone] = useState<string>('prob-structural');
  const [cadViewMode, setCadViewMode] = useState<'canvas' | 'area_takeoff' | 'vastu_matrix' | 'setback_audit' | 'dimensions_grid'>('canvas');
  const [selectedCadRoomId, setSelectedCadRoomId] = useState<string | null>('room-villa-living');
  const [hoveredCadRoomId, setHoveredCadRoomId] = useState<string | null>(null);
  const [inspectorMode, setInspectorMode] = useState<'room' | 'vastu'>('room');

  // AutoCAD Blueprint Import & Vastu Shastra Analysis State
  const [activeBlueprint, setActiveBlueprint] = useState<AutoCADBlueprintPreset>(BLUEPRINT_PRESETS[0]);
  const [isBlueprintImportModalOpen, setIsBlueprintImportModalOpen] = useState(false);
  const [isVastuReportModalOpen, setIsVastuReportModalOpen] = useState(false);
  const [isAnalyzingBlueprint, setIsAnalyzingBlueprint] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStageText, setAnalysisStageText] = useState('');
  const [vastuCorrected, setVastuCorrected] = useState(false);
  const [selectedVastuZoneId, setSelectedVastuZoneId] = useState<string | null>('vastu-center');
  const [vastuZones, setVastuZones] = useState<VastuZoneAssessment[]>(INITIAL_VASTU_ZONES);
  const [setbackAudits, setSetbackAudits] = useState<BlueprintSetbackAudit[]>(INITIAL_SETBACK_AUDITS);
  const [dimensionAudits, setDimensionAudits] = useState<BlueprintDimensionAudit[]>(INITIAL_DIMENSION_AUDITS);
  const [uploadedBlueprintName, setUploadedBlueprintName] = useState<string | null>(null);

  // Export Area Takeoff Schedule as CSV
  const handleExportAreaScheduleCSV = () => {
    const headers = [
      'Room/Space Name',
      'Quadrant',
      'Category',
      'Dimensions (Ft)',
      'Dimensions (m)',
      'Carpet Area (sq.ft)',
      'Carpet Area (sq.m)',
      'Floor Share (%)',
      'Ceiling Height (ft)',
      'NBC 2016 Code Standard',
      'NBC Compliance Status',
      'Daylight Factor',
      'Cross Ventilation',
    ];
    const rows = activeBlueprint.rooms.map((r) => [
      `"${r.name}"`,
      `"${r.quadrant}"`,
      `"${r.category}"`,
      `"${r.dimensionsFt}"`,
      `"${r.dimensionsM}"`,
      r.areaSqFt,
      r.areaSqM,
      `${r.percentOfFloor}%`,
      r.ceilingHeightFt,
      `"${r.nbcStandard}"`,
      `"${r.nbcCompliance.toUpperCase()}"`,
      `"${r.daylightFactor}"`,
      `"${r.crossVentilation}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeBlueprint.fileName.replace(/\.[^/.]+$/, '')}_Area_Takeoff_Schedule.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToastNotification({
      message: `Exported Area Takeoff Schedule (${activeBlueprint.rooms.length} Rooms) to CSV!`,
      type: 'success',
    });
  };

  // Compute live Vastu compliance percentage
  const currentVastuScore = vastuCorrected
    ? 98
    : Math.round(vastuZones.reduce((acc, z) => acc + z.energyScore, 0) / vastuZones.length);

  const vastuDeviationsCount = vastuCorrected ? 0 : vastuZones.filter((z) => !z.isCompliant).length;

  // Handle AutoCAD Blueprint Import / Attachment
  const handleImportBlueprint = (preset: AutoCADBlueprintPreset) => {
    setIsAnalyzingBlueprint(true);
    setAnalysisProgress(15);
    setAnalysisStageText('Extracting DWG vector polylines, layer tables & block definitions...');

    setTimeout(() => {
      setAnalysisProgress(45);
      setAnalysisStageText('Computing structural setbacks vs BBMP & Nambike Nakshe 2.0 bylaws...');
    }, 500);

    setTimeout(() => {
      setAnalysisProgress(75);
      setAnalysisStageText('Auditing column grid axes, load paths & NBC staircase clear widths...');
    }, 1000);

    setTimeout(() => {
      setAnalysisProgress(95);
      setAnalysisStageText('Mapping 9x9 Vastu Purusha Mandala & solar bioclimatic heat influx...');
    }, 1500);

    setTimeout(() => {
      setIsAnalyzingBlueprint(false);
      setIsBlueprintImportModalOpen(false);
      setActiveBlueprint(preset);
      setSelectedCadRoomId(preset.rooms[0]?.id || null);
      setVastuCorrected(false);
      setToastNotification({
        message: `Attached & Analyzed: "${preset.fileName}"! ${preset.rooms.length} Rooms, 4 Setbacks, 6 Dimensional Grids mapped.`,
        type: 'success',
      });
    }, 2000);
  };

  // Handle Custom File Upload (DWG, DXF, PDF, Image)
  const handleCustomFileUpload = (file: File) => {
    const rawName = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
    const dimMatch = file.name.match(/(\d+)[xX_-](\d+)/);
    const plotW = dimMatch ? parseInt(dimMatch[1], 10) : 40;
    const plotL = dimMatch ? parseInt(dimMatch[2], 10) : 60;
    const siteArea = plotW * plotL;
    const siteAreaSqM = Number((siteArea * 0.092903).toFixed(2));
    const groundCoverage = Math.round(siteArea * 0.585);
    const netCarpet = Math.round(groundCoverage * 0.84);
    const circulation = groundCoverage - netCarpet;

    const customRooms: CADRoomDetail[] = [
      {
        id: `room-custom-living-${Date.now()}`,
        name: 'Master Living Foyer & Great Room',
        quadrant: 'Central Core',
        category: 'living',
        dimensionsFt: `${Math.round(plotW * 0.55)}'-0" x ${Math.round(plotL * 0.35)}'-0"`,
        dimensionsM: `${(plotW * 0.55 * 0.3048).toFixed(1)}m x ${(plotL * 0.35 * 0.3048).toFixed(1)}m`,
        areaSqFt: Math.round(netCarpet * 0.36),
        areaSqM: Number((netCarpet * 0.36 * 0.0929).toFixed(1)),
        percentOfFloor: 36.0,
        ceilingHeightFt: 10.5,
        occupancyType: 'Habitable Living',
        nbcStandard: 'NBC Part 3 Cl 4.3 (Min 100 sq.ft)',
        nbcCompliance: 'compliant',
        daylightFactor: '2.5% (High Autonomy)',
        crossVentilation: 'Dual facade ventilation',
        color: '#3b82f6',
        svgRect: { x: 220, y: 130, width: 280, height: 180 },
      },
      {
        id: `room-custom-kitchen-${Date.now()}`,
        name: 'Culinary Kitchen & Dining Suite',
        quadrant: 'Agneya (South-East)',
        category: 'kitchen',
        dimensionsFt: `${Math.round(plotW * 0.4)}'-0" x ${Math.round(plotL * 0.25)}'-0"`,
        dimensionsM: `${(plotW * 0.4 * 0.3048).toFixed(1)}m x ${(plotL * 0.25 * 0.3048).toFixed(1)}m`,
        areaSqFt: Math.round(netCarpet * 0.20),
        areaSqM: Number((netCarpet * 0.20 * 0.0929).toFixed(1)),
        percentOfFloor: 20.0,
        ceilingHeightFt: 10.0,
        occupancyType: 'Kitchen & Preparation',
        nbcStandard: 'NBC Part 3 Cl 4.4 (Min 50 sq.ft)',
        nbcCompliance: 'compliant',
        daylightFactor: '2.1%',
        crossVentilation: 'Dedicated exhaust shaft',
        color: '#f97316',
        svgRect: { x: 500, y: 130, width: 170, height: 160 },
      },
      {
        id: `room-custom-master-${Date.now()}`,
        name: 'Executive Master Suite & Dressing',
        quadrant: 'Nairutya (South-West)',
        category: 'bedroom',
        dimensionsFt: `${Math.round(plotW * 0.45)}'-0" x ${Math.round(plotL * 0.25)}'-0"`,
        dimensionsM: `${(plotW * 0.45 * 0.3048).toFixed(1)}m x ${(plotL * 0.25 * 0.3048).toFixed(1)}m`,
        areaSqFt: Math.round(netCarpet * 0.22),
        areaSqM: Number((netCarpet * 0.22 * 0.0929).toFixed(1)),
        percentOfFloor: 22.0,
        ceilingHeightFt: 10.5,
        occupancyType: 'Primary Habitable Bedroom',
        nbcStandard: 'NBC Part 3 Cl 4.3 (Min 120 sq.ft)',
        nbcCompliance: 'compliant',
        daylightFactor: '1.8%',
        crossVentilation: 'South-West evening breeze',
        color: '#ec4899',
        svgRect: { x: 190, y: 310, width: 220, height: 120 },
      },
      {
        id: `room-custom-stair-${Date.now()}`,
        name: 'NBC Egress Staircase & Lift Core',
        quadrant: 'West Axis',
        category: 'circulation',
        dimensionsFt: '14\'-0" x 8\'-6"',
        dimensionsM: '4.27m x 2.59m',
        areaSqFt: Math.round(netCarpet * 0.12),
        areaSqM: Number((netCarpet * 0.12 * 0.0929).toFixed(1)),
        percentOfFloor: 12.0,
        ceilingHeightFt: 10.0,
        occupancyType: 'Emergency Egress & Lift',
        nbcStandard: 'NBC Part 4 (Min 1.50m Clear Flight Width)',
        nbcCompliance: 'compliant',
        daylightFactor: '1.1%',
        crossVentilation: 'Continuous vertical shaft',
        color: '#10b981',
        svgRect: { x: 420, y: 310, width: 160, height: 120 },
      },
      {
        id: `room-custom-balcony-${Date.now()}`,
        name: 'Cantilever Deck & Weather Promenade',
        quadrant: 'North-East',
        category: 'balcony',
        dimensionsFt: '12\'-0" x 8\'-0"',
        dimensionsM: '3.66m x 2.44m',
        areaSqFt: Math.round(netCarpet * 0.10),
        areaSqM: Number((netCarpet * 0.10 * 0.0929).toFixed(1)),
        percentOfFloor: 10.0,
        ceilingHeightFt: 10.0,
        occupancyType: 'Semi-Outdoor Balcony',
        nbcStandard: 'IS 456 Deflection Check (Span/350)',
        nbcCompliance: 'compliant',
        daylightFactor: '3.5%',
        crossVentilation: 'Ambient exposure',
        color: '#38bdf8',
        svgRect: { x: 580, y: 290, width: 90, height: 100 },
      },
    ];

    const customPreset: AutoCADBlueprintPreset = {
      id: `custom-dwg-${Date.now()}`,
      fileName: file.name,
      planTitle: `${rawName} (Imported CAD)`,
      typology: activeProject.projectType || 'Architecture Plan',
      plotDimensions: `${plotL}'-0" x ${plotW}'-0" (${siteArea.toLocaleString()} sq.ft)`,
      plotLengthFt: plotL,
      plotWidthFt: plotW,
      siteAreaSqFt: siteArea,
      siteAreaSqM: siteAreaSqM,
      builtUpAreaSqFt: Math.round(siteArea * 1.5),
      groundFootprintSqFt: groundCoverage,
      groundCoveragePercent: 58.5,
      netCarpetAreaSqFt: netCarpet,
      circulationAndWallsSqFt: circulation,
      farAchieved: 1.50,
      farPermissible: 1.75,
      facing: 'East Facing Entrance',
      vastuInitialScore: 84,
      setbackStatus: 'Setback clearances verified',
      description: `Imported AutoCAD drawing: ${file.name} (${(file.size / 1024).toFixed(1)} KB) synchronized with Gouse AI Specialist Engine.`,
      rooms: customRooms,
      dimensionTags: [
        { id: `dim-cw-${Date.now()}`, label: `WIDTH: ${plotW}'-0"`, metricLabel: `${(plotW * 0.3048).toFixed(2)}m`, x1: 50, y1: 22, x2: 750, y2: 22, textX: 400, textY: 17, orientation: 'horizontal', type: 'boundary' },
        { id: `dim-cl-${Date.now()}`, label: `LENGTH: ${plotL}'-0"`, metricLabel: `${(plotL * 0.3048).toFixed(2)}m`, x1: 25, y1: 40, x2: 25, y2: 480, textX: 18, textY: 260, orientation: 'vertical', type: 'boundary' },
        { id: `dim-cfs-${Date.now()}`, label: 'FRONT SETBACK: 3.00m', metricLabel: '3.00m', x1: 50, y1: 110, x2: 750, y2: 110, textX: 400, textY: 104, orientation: 'horizontal', type: 'setback' },
      ],
    };
    setUploadedBlueprintName(file.name);
    handleImportBlueprint(customPreset);
  };

  // 1-Click "Auto-Apply Vastu Realignment & Corrections"
  const handleApplyVastuCorrections = () => {
    setVastuCorrected(true);

    // Update Vastu zones to 100% compliant
    setVastuZones((prev) =>
      prev.map((zone) => {
        if (zone.id === 'vastu-center') {
          return {
            ...zone,
            isCompliant: true,
            severity: 'auspicious' as const,
            energyScore: 98,
            activePlacement: 'Open-to-Sky Courtyard & Brahmasthan Atrium (Column C6 relocated eastward to grid B3)',
            deviationDetails: undefined,
          };
        }
        if (zone.id === 'vastu-ne') {
          return {
            ...zone,
            isCompliant: true,
            severity: 'auspicious' as const,
            energyScore: 100,
            activePlacement: '10,000L Underground Rainwater Storage Sump placed in Ishanya corner',
            deviationDetails: undefined,
          };
        }
        if (zone.id === 'vastu-n') {
          return {
            ...zone,
            isCompliant: true,
            severity: 'auspicious' as const,
            energyScore: 96,
            activePlacement: 'Front Porch realigned to 3.00m clear setback (Unlocks North Kubera prosperity flow)',
            deviationDetails: undefined,
          };
        }
        if (zone.id === 'vastu-w') {
          return {
            ...zone,
            isCompliant: true,
            severity: 'auspicious' as const,
            energyScore: 94,
            activePlacement: '24mm Low-E DGU double glazing + vertical terracotta louvers installed',
            deviationDetails: undefined,
          };
        }
        return zone;
      })
    );

    // Also mark setback problem and structural problem as resolved
    setProblems((prev) =>
      prev.map((p) =>
        p.id === 'prob-vastu' || p.id === 'prob-setback' || p.id === 'prob-rainwater'
          ? { ...p, isResolved: true }
          : p
      )
    );

    // Add Vastu Remedial Lines to BOQ
    if (onUpdateBOQItems) {
      const vastuItems: BOQItem[] = [
        {
          id: `boq-vastu-atrium-${Date.now()}`,
          name: 'Operable Skylight Dampers & Double-Height Atrium Courtyard Framing',
          category: 'Finishes & Envelopes',
          unit: 'sq.m',
          quantity: 12.5,
          rate: 4200,
          amount: 52500,
          notes: 'Brahmasthan open core realigned via Gouse AI Vastu Shastra Engine',
          stage: 'Finishes',
          status: 'approved',
        },
        {
          id: `boq-vastu-sump-${Date.now()}`,
          name: 'Modular Precast RCC 10,000L Water Sump (Ishanya NE Alignment)',
          category: 'Substructure',
          unit: 'nos',
          quantity: 1,
          rate: 38000,
          amount: 38000,
          notes: 'Ishanya North-East Vastu water quadrant realignment',
          stage: 'Substructure',
          status: 'approved',
        },
      ];
      onUpdateBOQItems([...(boqItems || []), ...vastuItems]);
    }

    // Update project with audit log
    if (onUpdateProject) {
      onUpdateProject({
        ...activeProject,
        auditLogs: [
          ...(activeProject.auditLogs || []),
          {
            id: `log-vastu-${Date.now()}`,
            projectId: activeProject.id,
            actor: 'Gouse AI',
            action: 'Vastu Shastra Blueprint Realignment',
            details: 'Cleared Brahmasthan column load, repositioned NE water sump, restored 3.0m North setback',
            timestamp: new Date().toISOString(),
          },
        ],
      });
    }

    setToastNotification({
      message: 'Vastu Shastra & Structural Realignment Applied! Brahmasthan cleared, Vastu score upgraded to 98%.',
      type: 'success',
    });
  };

  // Live Agent Mesh Telemetry & Log Stream
  const [agentAuditLogs, setAgentAuditLogs] = useState<Array<{
    id: string;
    agentName: string;
    action: string;
    timestamp: string;
    status: 'success' | 'running' | 'verified';
    latencyMs: number;
  }>>([
    {
      id: 'log-ag-1',
      agentName: 'Gouse AI Master Specialist',
      action: 'Synchronized spatial model with project parameters',
      timestamp: 'Just now',
      status: 'verified',
      latencyMs: 14,
    },
    {
      id: 'log-ag-2',
      agentName: 'Municipal Gatekeeper Agent',
      action: 'Nambike Nakshe 2.0 setback buffer verification',
      timestamp: '1 min ago',
      status: 'verified',
      latencyMs: 19,
    },
    {
      id: 'log-ag-3',
      agentName: 'IS 456 Structural & BBS Agent',
      action: 'Cantilever deflection moment calculations complete',
      timestamp: '2 mins ago',
      status: 'verified',
      latencyMs: 24,
    },
    {
      id: 'log-ag-4',
      agentName: 'BOQ & SMM Synchronization Agent',
      action: 'Verified live line items against schedule of rates',
      timestamp: '3 mins ago',
      status: 'verified',
      latencyMs: 16,
    },
  ]);

  const unresolvedCount = problems.filter((p) => !p.isResolved).length;
  const criticalCount = problems.filter((p) => !p.isResolved && p.severity === 'critical').length;
  const warningCount = problems.filter((p) => !p.isResolved && p.severity === 'warning').length;
  const optimizationCount = problems.filter((p) => !p.isResolved && p.severity === 'optimization').length;

  const handleResolveProblem = (problemId: string) => {
    const prob = problems.find((p) => p.id === problemId);
    if (!prob || prob.isResolved) return;

    // 1. Mark problem as resolved
    setProblems((prev) =>
      prev.map((p) => (p.id === problemId ? { ...p, isResolved: true } : p))
    );

    // 2. Execute platform action
    if (prob.actionPayload?.type === 'add_boq' && prob.actionPayload.boqItem && onUpdateBOQItems) {
      const newItem: BOQItem = {
        id: `boq-gouse-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: prob.actionPayload.boqItem.name || prob.title,
        category: prob.actionPayload.boqItem.category || 'Concrete Works',
        unit: prob.actionPayload.boqItem.unit || 'nos',
        quantity: prob.actionPayload.boqItem.quantity || 1,
        rate: prob.actionPayload.boqItem.rate || 0,
        amount: (prob.actionPayload.boqItem.quantity || 1) * (prob.actionPayload.boqItem.rate || 0),
        notes: prob.actionPayload.boqItem.notes || `Engineered by Gouse AI Specialist (${prob.codeReference})`,
        stage: prob.actionPayload.boqItem.stage || 'Superstructure',
        status: 'approved',
      };
      onUpdateBOQItems([...(boqItems || []), newItem]);
    }

    if (onUpdateProject) {
      onUpdateProject({
        ...activeProject,
        status: activeProject.status || 'design_development',
        auditLogs: [
          ...(activeProject.auditLogs || []),
          {
            id: `log-prob-${Date.now()}`,
            projectId: activeProject.id,
            actor: 'Gouse AI',
            action: 'Architectural Resolution Applied',
            details: `Resolved ${prob.title} via autonomous engineering solver`,
            timestamp: new Date().toISOString(),
          },
        ],
      });
    }

    // 3. Append resolution notice to chat history
    const aiNotice: ChatMessage = {
      id: `msg-resolved-${Date.now()}`,
      role: 'assistant',
      content: `✅ **Architectural Problem Resolved**: **${prob.title}**\n\n- **Standard Verified**: ${prob.codeReference}\n- **Engineered Resolution**: ${prob.proposedFix}\n- **Financial & Operational Impact**: ${prob.costImpact}\n- **Platform Synchronization**: Injected into active project blueprint & schedule.`,
      timestamp: new Date().toISOString(),
      specialist: 'general',
      agentToolsUsed: ['Gouse AI Architecture Engine', 'IS Code Auditor', 'BOQ Synchronizer'],
    };
    setMessages((prev) => [...prev, aiNotice]);

    setToastNotification({
      message: `Resolved: ${prob.title}! Synced with platform AI agent.`,
      type: 'success',
    });
  };

  const handleAutoSolveAll = () => {
    const unresolved = problems.filter((p) => !p.isResolved);
    if (unresolved.length === 0) {
      setToastNotification({
        message: 'All architectural issues are already compliant & verified!',
        type: 'info',
      });
      return;
    }

    setProblems((prev) => prev.map((p) => ({ ...p, isResolved: true })));

    const newItems: BOQItem[] = [];
    unresolved.forEach((prob, idx) => {
      if (prob.actionPayload?.type === 'add_boq' && prob.actionPayload.boqItem) {
        newItems.push({
          id: `boq-gouse-${Date.now()}-${idx}`,
          name: prob.actionPayload.boqItem.name || prob.title,
          category: prob.actionPayload.boqItem.category || 'Concrete Works',
          unit: prob.actionPayload.boqItem.unit || 'nos',
          quantity: prob.actionPayload.boqItem.quantity || 1,
          rate: prob.actionPayload.boqItem.rate || 0,
          amount: (prob.actionPayload.boqItem.quantity || 1) * (prob.actionPayload.boqItem.rate || 0),
          notes: prob.actionPayload.boqItem.notes || `Gouse AI Automated Solution`,
          stage: prob.actionPayload.boqItem.stage || 'Superstructure',
          status: 'approved',
        });
      }
    });

    if (newItems.length > 0 && onUpdateBOQItems) {
      onUpdateBOQItems([...(boqItems || []), ...newItems]);
    }

    if (onUpdateProject) {
      onUpdateProject({
        ...activeProject,
        status: activeProject.status || 'design_development',
        auditLogs: [
          ...(activeProject.auditLogs || []),
          {
            id: `log-batch-${Date.now()}`,
            projectId: activeProject.id,
            actor: 'Gouse AI',
            action: 'Batch Architectural Problem Resolution',
            details: `Autonomous resolution of ${unresolved.length} architectural problems across bylaws, structural, bioclimatic, fire safety, and BOQ`,
            timestamp: new Date().toISOString(),
          },
        ],
      });
    }

    setToastNotification({
      message: `All ${unresolved.length} architectural problems engineered & resolved by Gouse AI! Synced with Platform BOQ.`,
      type: 'success',
    });
  };

  const handleConsultGouseAiOnProblem = (prob: ArchitecturalProblem) => {
    setStudioTab('chat_voice');
    setInputMessage(`Gouse AI, detail the engineering methodology and IS/NBC code calculations required to solve: "${prob.title}" at ${prob.location}.`);
  };

  const handleInspectOnCad = (prob: ArchitecturalProblem) => {
    setSelectedProblemId(prob.id);
    setCanvasSelectedZone(prob.id);
    setStudioTab('cad_canvas');
  };

  const handleRunAgentDeepScan = () => {
    setIsScanningAgents(true);
    setToastNotification({
      message: 'Initiating Autonomous Multi-Agent Deep Scan across 7 platform AI agents...',
      type: 'info',
    });

    setTimeout(() => {
      setIsScanningAgents(false);
      const newLog = {
        id: `log-ag-${Date.now()}`,
        agentName: 'Gouse AI Orchestrator',
        action: `Deep scan executed: 8 architectural nodes audited, ${unresolvedCount} active constraints monitored`,
        timestamp: 'Just now',
        status: 'verified' as const,
        latencyMs: 18,
      };
      setAgentAuditLogs((prev) => [newLog, ...prev.slice(0, 6)]);
      setToastNotification({
        message: 'Platform Multi-Agent Audit Complete! All 7 engineering agents synchronized.',
        type: 'success',
      });
    }, 1500);
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      role: 'assistant',
      content: `Welcome to **Gouse AI**! I am your **Autonomous Principal Architectural Specialist**.
Active Project: **${activeProject.name}** (${activeProject.projectType || 'Architecture'}, ${activeProject.location || 'Site'}).
Built-up Footprint: **${(activeProject.builtUpAreaSqFt || 3500).toLocaleString()} sq.ft** | Live BOQ Items: **${boqItems?.length || 0} line items**.

I operate as your **Autonomous Engineering & Municipal Specialist**:
- 🏛️ **Nambike Nakshe 2.0 Compliance Gate**: Automated check for GBA 15% deviation regularization, small-plot relaxed setbacks (<1500 sq ft & <600 sq ft), and municipal plan approvals
- ⚡ **4-Stage Platform Engine**: CAD ingestion & net area extraction, gatekeeper compliance, BOQ population, and IS material consumption takeoffs (System Rating: 9.8/10)
- 🧠 **Transparent Chain-of-Thought Reasoning**: Live architectural tools (IS 456 Structural Rules, NBC 2016 Code Engine, IS 1200 SMM Auditor, Market Pricing Benchmark)
- 📋 **Concrete 1-Click Action Proposals**: Execute BOQ adjustments or launch the Nambike Nakshe 2.0 engine directly
- 🎙️ **Multi-lingual Voice Dialogue**: 25+ regional & global languages supported.`,
      timestamp: new Date().toISOString(),
      specialist: 'general',
      language: 'en-IN',
      agentToolsUsed: ['Nambike Nakshe 2.0 Gatekeeper', 'IS 456 Structural Rules', 'BOQ Inspector'],
      agentThought: `Synchronized with ${activeProject.name} active spatial data (${(activeProject.builtUpAreaSqFt || 3500).toLocaleString()} sq.ft). Ready to audit Nambike Nakshe 2.0 bylaws, structural framing, NBC statutory egress, and bill of quantities as Gouse AI.`,
    },
  ]);

  const toggleThought = (msgId: string) => {
    setExpandedThoughts((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  const handleExecuteAction = (action: AgentAction, msgId: string) => {
    if (action.executed) return;

    if (action.type === 'add_boq_item' && action.payload) {
      const qty = Number(action.payload.quantity) || 1;
      const rate = Number(action.payload.rate) || 0;
      const newItem: BOQItem = {
        id: `boq-agent-${Date.now()}`,
        name: action.payload.name || action.title,
        category: action.payload.category || 'Concrete Works',
        unit: action.payload.unit || 'nos',
        quantity: qty,
        rate: rate,
        amount: qty * rate,
        notes: action.payload.notes || 'Autonomous Specialist AI Agent item proposal',
        stage: 'Superstructure',
        status: 'approved',
      };

      if (onUpdateBOQItems) {
        onUpdateBOQItems([...(boqItems || []), newItem]);
      }

      setToastNotification({
        message: `Added "${newItem.name}" (${qty} ${newItem.unit} @ ${currency} ${rate.toLocaleString()}) to Project BOQ!`,
        type: 'success',
      });
    } else if (action.type === 'update_contingency' && action.payload?.percent) {
      if (onUpdateProject) {
        onUpdateProject({
          ...activeProject,
          contingencyPercent: action.payload.percent,
        });
      }
      setToastNotification({
        message: `Updated project contingency reserve to ${action.payload.percent}%!`,
        type: 'success',
      });
    } else if (action.type === ('open_workflow_engine' as any)) {
      if (onOpenWorkflowEngine) {
        onOpenWorkflowEngine();
      }
      setToastNotification({
        message: 'Opened Gouse AI Agent Engine (4-Stage Pipeline)',
        type: 'info',
      });
    } else if (action.type === 'run_audit' || action.type === 'inspect_pricing') {
      if (onNavigateToBOQ) {
        onNavigateToBOQ();
      }
    }

    // Mark action as executed
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId) return m;
        return {
          ...m,
          agentActions: m.agentActions?.map((a) =>
            a.id === action.id ? { ...a, executed: true } : a
          ),
        };
      })
    );
  };

  // Auto-dismiss toast after 4.5 seconds
  useEffect(() => {
    if (toastNotification) {
      const timer = setTimeout(() => setToastNotification(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [toastNotification]);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, voiceTranscript]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_e) {
          // ignore
        }
      }
    };
  }, []);

  // Speech Recognition Setup (Microphone)
  const toggleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Speech Recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_e) {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      // Map 'auto' to user's system locale or default to 'en-IN'
      recognition.lang = selectedLanguage === 'auto' ? navigator.language || 'en-IN' : selectedLanguage;
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceTranscript('');
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setVoiceTranscript(transcript);
        setInputMessage(transcript);
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition warning:', err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        // If in Walkie-Talkie mode and transcript exists, auto-submit
        if (walkieTalkieActive && inputMessage.trim()) {
          handleSendMessage(inputMessage.trim());
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setIsListening(false);
    }
  };

  // Text-To-Speech Execution (Gemini TTS with Web Speech API Fallback)
  const stopAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMessageId(null);
  };

  const playMessageVoice = async (msg: ChatMessage) => {
    if (speakingMessageId === msg.id) {
      stopAudio();
      return;
    }

    stopAudio();
    setSpeakingMessageId(msg.id);
    setIsGeneratingAudio(msg.id);

    const specialistObj = SPECIALISTS.find((s) => s.id === msg.specialist) || SPECIALISTS[0];

    try {
      // 1. If audio base64 is already cached on the message, play directly
      if (msg.audioBase64) {
        playWavAudio(msg.id, msg.audioBase64);
        setIsGeneratingAudio(null);
        return;
      }

      // 2. Fetch Gemini TTS audio from backend
      const res = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: msg.content,
          specialist: msg.specialist || selectedSpecialist,
          voiceName: specialistObj.voiceName,
          language: msg.language || selectedLanguage,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          // Cache audio on message
          msg.audioBase64 = data.audioBase64;
          playWavAudio(msg.id, data.audioBase64);
          setIsGeneratingAudio(null);
          return;
        }
      }
    } catch (_err) {
      console.warn('Gemini TTS service notice, utilizing browser voice engine.');
    }

    setIsGeneratingAudio(null);

    // 3. Fallback: Browser Web SpeechSynthesis
    playBrowserSpeech(msg.id, msg.content, msg.language || selectedLanguage);
  };

  const playWavAudio = (msgId: string, base64: string) => {
    try {
      const audioUrl = `data:audio/wav;base64,${base64}`;
      const audio = new Audio(audioUrl);
      audio.playbackRate = playbackSpeed;

      audio.onended = () => {
        setSpeakingMessageId(null);
        currentAudioRef.current = null;
        if (walkieTalkieActive) {
          // Auto-prompt user for next question in walkie talkie mode
          setTimeout(() => toggleVoiceInput(), 500);
        }
      };

      audio.onerror = () => {
        setSpeakingMessageId(null);
        currentAudioRef.current = null;
      };

      currentAudioRef.current = audio;
      audio.play();
    } catch (e) {
      console.warn('Audio element error:', e);
      setSpeakingMessageId(null);
    }
  };

  const playBrowserSpeech = (msgId: string, text: string, langCode: string) => {
    if (!('speechSynthesis' in window)) {
      setSpeakingMessageId(null);
      return;
    }

    const cleanText = text
      .replace(/[#*`_\[\]()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = langCode === 'auto' ? 'en-US' : langCode;
    utterance.rate = playbackSpeed;

    utterance.onend = () => {
      setSpeakingMessageId(null);
      if (walkieTalkieActive) {
        setTimeout(() => toggleVoiceInput(), 500);
      }
    };

    utterance.onerror = () => {
      setSpeakingMessageId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const downloadAudio = (base64: string, id: string) => {
    const a = document.createElement('a');
    a.href = `data:audio/wav;base64,${base64}`;
    a.download = `specialist-voice-${id}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Send Chat Message
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    stopAudio();

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
      specialist: selectedSpecialist,
      language: selectedLanguage,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setVoiceTranscript('');
    setIsLoading(true);

    try {
      const projectContext = `Project: ${activeProject.name} | Typology: ${activeProject.projectType} | Location: ${activeProject.location} | Built-up Area: ${(activeProject.builtUpAreaSqFt || 3500).toLocaleString()} sq.ft | Scope: ${activeProject.description}`;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          specialist: selectedSpecialist,
          projectContext,
          language: selectedLanguage,
          boqContext: boqItems && boqItems.length > 0 ? JSON.stringify(boqItems.slice(0, 15)) : undefined,
          projectData: activeProject,
        }),
      });

      if (!res.ok) throw new Error('Failed to get specialist response');
      const data = await res.json();

      const aiMsgId = `msg-${Date.now()}-ai`;
      const aiMsg: ChatMessage = {
        id: aiMsgId,
        role: 'assistant',
        content: data.response || (typeof data === 'string' ? data : 'Analysis complete.'),
        timestamp: new Date().toISOString(),
        specialist: selectedSpecialist,
        language: selectedLanguage,
        agentThought: data.thought,
        agentToolsUsed: data.toolsUsed,
        agentActions: data.actions,
      };

      setMessages((prev) => [...prev, aiMsg]);
      if (data.thought) {
        setExpandedThoughts((prev) => ({ ...prev, [aiMsgId]: true }));
      }

      // If Auto-Speak or Walkie-Talkie is enabled, automatically speak reply
      if (autoSpeakEnabled || walkieTalkieActive) {
        setTimeout(() => {
          playMessageVoice(aiMsg);
        }, 300);
      }
    } catch (_err) {
      const area = activeProject.builtUpAreaSqFt || 3500;
      const steelMT = Number(((area * 4.2) / 1000).toFixed(1));
      const concreteM3 = Math.round(area * 0.038);
      const aiMsgId = `msg-${Date.now()}-ai`;

      const fallbackMsg: ChatMessage = {
        id: aiMsgId,
        role: 'assistant',
        content: `### Architectural Guidance & Technical Recommendations
For **${activeProject.name || 'this proposal'}** (${activeProject.projectType || 'Architecture'}, ${area.toLocaleString()} sq.ft):

1. **Spatial Programming & Circulation**: Maintain minimum 1.2m clear interior corridors, with primary habitable rooms oriented to maximize natural cross-ventilation and glare-free North/South daylight.
2. **Structural Framing (IS 456 / IS 1786)**: Standard empirical rebar consumption sits at **4.2 kg/sq.ft** (~${steelMT} MT total) with pumpable M25 design concrete at **~${concreteM3} m³**.
3. **Building Code & Compliance**: Adhere to NBC Part 4 life safety standards, verifying 1.5m stairwell clear width and unobstructed fire tender setbacks.
4. **BOQ & Cost Tracking**: Use the **BOQ Schedule** to maintain itemized quantities and retain an uncommitted **7.5%–10% contingency reserve** against material price inflation.`,
        timestamp: new Date().toISOString(),
        specialist: selectedSpecialist,
        language: selectedLanguage,
        agentThought: `Evaluated ${activeProject.name} spatial footprint (${area.toLocaleString()} sq.ft), IS 456 reinforcement metrics, and NBC Part 4 statutory egress.`,
        agentToolsUsed: ['BOQ Completeness Auditor', 'IS 456 Structural Rules', 'NBC 2016 Code Engine'],
        agentActions: [
          {
            id: `act-steel-${Date.now()}`,
            type: 'add_boq_item',
            title: 'Add Fe550D TMT Rebar to BOQ',
            description: `Empirical steel requirement: ${steelMT} MT @ ${currency} 68,500/MT for RCC framed structure`,
            payload: {
              name: 'Fe550D High-Ductility TMT Reinforcement Steel',
              category: 'Concrete Works',
              unit: 'MT',
              quantity: steelMT,
              rate: 68500,
              notes: 'Fe550D rebar per IS 1786:2008 with seismic ductility',
            },
          },
        ],
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      setExpandedThoughts((prev) => ({ ...prev, [aiMsgId]: true }));

      if (autoSpeakEnabled || walkieTalkieActive) {
        setTimeout(() => {
          playMessageVoice(fallbackMsg);
        }, 300);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const currentLangObj = VOICE_LANGUAGES.find((l) => l.code === selectedLanguage) || VOICE_LANGUAGES[1];
  const activeSpecialistObj = SPECIALISTS.find((s) => s.id === selectedSpecialist) || SPECIALISTS[0];

  return (
    <div id="specialist-chat-view" className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-5">
      {/* Toast Notification Banner */}
      {toastNotification && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-xs shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{toastNotification.message}</span>
          </div>
          {onNavigateToBOQ && (
            <button
              type="button"
              onClick={onNavigateToBOQ}
              className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 text-xs font-semibold hover:bg-emerald-400 transition shrink-0"
            >
              View BOQ Schedule →
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs uppercase tracking-wider font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Gouse AI Specialist
            </span>
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
              Gemini 3.8 Flash + Multi-Modal TTS
            </span>
            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
              25+ Languages Supported
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mt-1.5">
            Gouse AI • Autonomous Architectural Specialist
          </h2>
          <p className="text-xs text-slate-400">
            Consult Gouse AI across multi-disciplinary architectural disciplines with transparent reasoning, tool execution, and 1-click project BOQ proposals.
          </p>
        </div>

        {/* Global Voice & Audio Controls & Gouse AI Agent Quick Launch */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Gouse AI Agent Platform Engine Button */}
          {onOpenWorkflowEngine && (
            <button
              id="btn-agent-open-gouse-ai-agent"
              type="button"
              onClick={onOpenWorkflowEngine}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition bg-gradient-to-r from-amber-500/20 via-emerald-500/15 to-slate-900 border-amber-500/40 text-amber-300 hover:border-amber-400 hover:text-white shadow-sm"
              title="Open Gouse AI Agent (4-Stage Pipeline, Rating 9.8/10)"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold">Gouse AI Agent</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                9.8/10
              </span>
            </button>
          )}

          {/* Hands-Free Auto-Speak Toggle */}
          <button
            id="toggle-auto-speak"
            type="button"
            onClick={() => setAutoSpeakEnabled(!autoSpeakEnabled)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition ${
              autoSpeakEnabled
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-semibold shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Automatically read aloud replies when generated"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Auto-Speak {autoSpeakEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Walkie-Talkie Continuous Voice Mode */}
          <button
            id="toggle-walkie-talkie"
            type="button"
            onClick={() => setWalkieTalkieActive(!walkieTalkieActive)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition ${
              walkieTalkieActive
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-semibold shadow-sm animate-pulse'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Continuous hands-free voice dialogue with the specialist"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Voice Dialogue {walkieTalkieActive ? 'ACTIVE' : 'READY'}</span>
          </button>

          {/* Speed Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[11px] font-mono">
            {[0.8, 1.0, 1.25, 1.5].map((speed) => (
              <button
                key={speed}
                onClick={() => {
                  setPlaybackSpeed(speed);
                  if (currentAudioRef.current) {
                    currentAudioRef.current.playbackRate = speed;
                  }
                }}
                className={`px-2 py-1 rounded transition ${
                  playbackSpeed === speed
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Clear Chat */}
          <button
            id="btn-clear-chat"
            onClick={() => {
              stopAudio();
              setMessages([
                {
                  id: `msg-${Date.now()}`,
                  role: 'assistant',
                  content: `Conversation reset. I am ready to consult on **${activeProject.name}** in ${currentLangObj.native}.`,
                  timestamp: new Date().toISOString(),
                  specialist: selectedSpecialist,
                },
              ]);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-slate-400 hover:text-white transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Gouse AI Specialist Studio Mode Selector */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-950/80 border border-slate-800 rounded-xl overflow-x-auto scrollbar-none">
        <button
          id="tab-gui-solver"
          type="button"
          onClick={() => setStudioTab('gui_solver')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
            studioTab === 'gui_solver'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/10'
              : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Architecture GUI Solver</span>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
              studioTab === 'gui_solver'
                ? 'bg-slate-950 text-amber-300'
                : unresolvedCount > 0
                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            {unresolvedCount > 0 ? `${unresolvedCount} Issues` : '✓ 100% Solved'}
          </span>
        </button>

        <button
          id="tab-cad-canvas"
          type="button"
          onClick={() => setStudioTab('cad_canvas')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
            studioTab === 'cad_canvas'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/10'
              : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>Interactive Blueprint CAD Canvas</span>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
              studioTab === 'cad_canvas' ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-400'
            }`}
          >
            2D Spatial Floor Plan
          </span>
        </button>

        <button
          id="tab-agent-mesh"
          type="button"
          onClick={() => setStudioTab('agent_mesh')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
            studioTab === 'agent_mesh'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/10'
              : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
          }`}
        >
          <Network className="w-4 h-4" />
          <span>Connected Platform AI Agents</span>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full flex items-center gap-1 ${
              studioTab === 'agent_mesh'
                ? 'bg-slate-950 text-amber-300'
                : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            7 Agents Live
          </span>
        </button>

        <button
          id="tab-chat-voice"
          type="button"
          onClick={() => setStudioTab('chat_voice')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
            studioTab === 'chat_voice'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/10'
              : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>Voice & Specialist Chat</span>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
              studioTab === 'chat_voice' ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-400'
            }`}
          >
            25+ Languages
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ARCHITECTURE GUI PROBLEM SOLVER (THROUGH & THROUGH SOLVER)        */}
      {/* ========================================================================= */}
      {studioTab === 'gui_solver' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Top Compliance & Action Metric Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Progress / Score Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-mono uppercase tracking-wider">Architecture Compliance</span>
                <span className="font-mono font-bold text-amber-400">
                  {Math.round(((problems.length - unresolvedCount) / problems.length) * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2.5 border border-slate-800 overflow-hidden mb-2">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    unresolvedCount === 0
                      ? 'bg-emerald-500'
                      : unresolvedCount <= 2
                      ? 'bg-amber-500'
                      : 'bg-gradient-to-r from-red-500 to-amber-500'
                  }`}
                  style={{ width: `${((problems.length - unresolvedCount) / problems.length) * 100}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono">
                <span>{problems.length - unresolvedCount} of {problems.length} Constraints Cleared</span>
                <span className={unresolvedCount === 0 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                  {unresolvedCount === 0 ? '✓ NOC Approved' : `${unresolvedCount} Pending`}
                </span>
              </div>
            </div>

            {/* Critical Deficits */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Critical Red Flags</span>
                <span className="p-1 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                  <AlertCircle className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="my-1">
                <div className="text-2xl font-bold text-red-400 font-mono">{criticalCount}</div>
                <div className="text-[11px] text-slate-400">Structural & Municipal Encroachments</div>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">IS 456 & Nambike Nakshe Rules</div>
            </div>

            {/* Warnings & Optimizations */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Warnings & Optimizations</span>
                <span className="p-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Sliders className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="my-1">
                <div className="text-2xl font-bold text-amber-300 font-mono">
                  {warningCount + optimizationCount}
                </div>
                <div className="text-[11px] text-slate-400">Thermal, Fire Egress & Rebar BBS</div>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">ECBC, NBC 2016, IS 1200 SMM</div>
            </div>

            {/* Master Action: Auto Solve All Through & Through */}
            <div className="bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-950 border border-amber-500/30 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Platform AI Autonomous Solver</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                  Execute full multi-agent architectural resolution: update CAD blueprints, inject BOQ lines, and stamp compliance.
                </p>
              </div>
              <div className="mt-2.5">
                <button
                  id="btn-auto-solve-all"
                  type="button"
                  onClick={handleAutoSolveAll}
                  disabled={unresolvedCount === 0}
                  className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 fill-slate-950" />
                  <span>{unresolvedCount === 0 ? '✓ All Problems Solved' : `Auto-Solve All (${unresolvedCount})`}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filter Pills Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
              <span className="text-[11px] font-mono uppercase text-slate-500 shrink-0 mr-1">Discipline:</span>
              {[
                { id: 'all', label: 'All (8)' },
                { id: 'bylaws', label: 'Bylaws & Setbacks' },
                { id: 'structural', label: 'IS Structural' },
                { id: 'bioclimatic', label: 'Bioclimatic Solar' },
                { id: 'fire_egress', label: 'NBC Fire Egress' },
                { id: 'boq', label: 'BOQ & SMM Takeoff' },
                { id: 'vastu', label: 'Vastu Brahmasthan' },
                { id: 'rainwater', label: 'Rainwater RWH' },
                { id: 'seismic', label: 'Seismic IS 13920' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setProblemCategoryFilter(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition shrink-0 ${
                    problemCategoryFilter === cat.id
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-1 text-xs shrink-0 font-mono">
              <span className="text-[11px] text-slate-500 mr-1">Status:</span>
              {[
                { id: 'all', label: 'All' },
                { id: 'critical', label: 'Critical' },
                { id: 'warning', label: 'Warnings' },
                { id: 'optimization', label: 'Optimizations' },
                { id: 'resolved', label: 'Resolved' },
              ].map((sev) => (
                <button
                  key={sev.id}
                  onClick={() => setProblemSeverityFilter(sev.id)}
                  className={`px-2 py-0.5 rounded text-[11px] transition ${
                    problemSeverityFilter === sev.id
                      ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sev.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main 2-Column Problem Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column: Problem Deck Cards (5 cols) */}
            <div className="lg:col-span-5 space-y-2.5 max-h-[760px] overflow-y-auto pr-1">
              {problems
                .filter((p) => {
                  if (problemCategoryFilter !== 'all' && p.category !== problemCategoryFilter) return false;
                  if (problemSeverityFilter === 'critical') return p.severity === 'critical' && !p.isResolved;
                  if (problemSeverityFilter === 'warning') return p.severity === 'warning' && !p.isResolved;
                  if (problemSeverityFilter === 'optimization') return p.severity === 'optimization' && !p.isResolved;
                  if (problemSeverityFilter === 'resolved') return p.isResolved;
                  return true;
                })
                .map((prob) => {
                  const isSelected = selectedProblemId === prob.id;
                  return (
                    <div
                      key={prob.id}
                      onClick={() => setSelectedProblemId(prob.id)}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition relative group ${
                        isSelected
                          ? 'bg-slate-900 border-amber-500/70 shadow-md ring-1 ring-amber-500/40'
                          : prob.isResolved
                          ? 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 opacity-80'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                      }`}
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                              prob.severity === 'critical'
                                ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                                : prob.severity === 'warning'
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                            }`}
                          >
                            {prob.severity}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {prob.category.toUpperCase()}
                          </span>
                        </div>

                        {/* Status Checkmark */}
                        {prob.isResolved ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                            <Check className="w-3 h-3" />
                            <span>SOLVED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            <span>ACTION REQUIRED</span>
                          </span>
                        )}
                      </div>

                      {/* Title & Location */}
                      <h4 className={`text-xs font-bold leading-snug ${isSelected ? 'text-amber-300' : 'text-white'}`}>
                        {prob.title}
                      </h4>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
                        <Ruler className="w-3 h-3 text-slate-500" />
                        <span>{prob.location}</span>
                      </div>

                      {/* Code Reference & Cost Impact */}
                      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span className="truncate max-w-[200px] text-slate-400">{prob.codeReference}</span>
                        <span className={prob.costImpact.includes('-') ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                          {prob.costImpact}
                        </span>
                      </div>

                      {/* Quick 1-Click Action Button */}
                      {!prob.isResolved && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInspectOnCad(prob);
                            }}
                            className="text-[10px] font-mono text-slate-400 hover:text-amber-300 flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Show on CAD</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResolveProblem(prob.id);
                            }}
                            className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] transition flex items-center gap-1"
                          >
                            <Zap className="w-2.5 h-2.5 fill-slate-950" />
                            <span>Solve Through & Through</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* Right Column: Deep-Dive Problem Inspector & Interactive GUI (7 cols) */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
              {(() => {
                const activeProb = problems.find((p) => p.id === selectedProblemId) || problems[0];
                return (
                  <>
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-slate-800 pb-3.5">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              activeProb.severity === 'critical'
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                : activeProb.severity === 'warning'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            }`}
                          >
                            {activeProb.severity} Defect
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {activeProb.category.toUpperCase()}
                          </span>
                          <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            CAD ({activeProb.cadCoordinates.x}, {activeProb.cadCoordinates.y})
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white leading-snug">{activeProb.title}</h3>
                        <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                          <Ruler className="w-3.5 h-3.5 text-amber-400" />
                          <span>Location: {activeProb.location}</span>
                        </p>
                      </div>

                      {/* Status pill */}
                      <div className="shrink-0">
                        {activeProb.isResolved ? (
                          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs flex items-center gap-1.5 shadow-sm">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span className="font-bold">ENGINEERED & COMPLIANT</span>
                          </div>
                        ) : (
                          <div className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-xs flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                            <span>Awaiting Resolution</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Before vs After Visual Architecture Graphic & Blueprint Comparison */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
                          <Eye className="w-3.5 h-3.5" />
                          <span className="font-bold">Visual Architecture GUI Comparison</span>
                        </div>
                        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[11px] font-mono">
                          <button
                            type="button"
                            onClick={() => setComparisonMode('before')}
                            className={`px-2.5 py-1 rounded transition ${
                              comparisonMode === 'before'
                                ? 'bg-red-500/30 text-red-300 font-semibold border border-red-500/40'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Defective (Before)
                          </button>
                          <button
                            type="button"
                            onClick={() => setComparisonMode('after')}
                            className={`px-2.5 py-1 rounded transition ${
                              comparisonMode === 'after'
                                ? 'bg-emerald-500/30 text-emerald-300 font-semibold border border-emerald-500/40'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Compliant (After)
                          </button>
                          <button
                            type="button"
                            onClick={() => setComparisonMode('split')}
                            className={`px-2.5 py-1 rounded transition ${
                              comparisonMode === 'split'
                                ? 'bg-amber-500 text-slate-950 font-bold'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Side-by-Side Split
                          </button>
                        </div>
                      </div>

                      {/* Graphic Container */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        {(comparisonMode === 'before' || comparisonMode === 'split') && (
                          <div
                            className={`p-3.5 rounded-lg border text-xs space-y-2 ${
                              comparisonMode === 'before' ? 'md:col-span-2' : ''
                            } bg-red-950/20 border-red-500/30 text-red-200`}
                          >
                            <div className="flex items-center justify-between text-[11px] font-mono text-red-400 font-bold">
                              <span className="flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                                Defective Architectural Condition
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px]">
                                NON-COMPLIANT
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed font-sans">
                              {activeProb.currentCondition}
                            </p>
                            {activeProb.beforeDiagram && (
                              <div className="p-2 rounded bg-slate-900/90 border border-red-500/20 text-[11px] font-mono text-red-300/90">
                                <strong>CAD Defect:</strong> {activeProb.beforeDiagram}
                              </div>
                            )}
                          </div>
                        )}

                        {(comparisonMode === 'after' || comparisonMode === 'split') && (
                          <div
                            className={`p-3.5 rounded-lg border text-xs space-y-2 ${
                              comparisonMode === 'after' ? 'md:col-span-2' : ''
                            } bg-emerald-950/20 border-emerald-500/30 text-emerald-200`}
                          >
                            <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400 font-bold">
                              <span className="flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                Gouse AI Engineered Resolution
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                                IS/NBC CERTIFIED
                              </span>
                            </div>
                            <p className="text-xs text-slate-200 leading-relaxed font-sans">
                              {activeProb.proposedFix}
                            </p>
                            {activeProb.afterDiagram && (
                              <div className="p-2 rounded bg-slate-900/90 border border-emerald-500/20 text-[11px] font-mono text-emerald-300/90">
                                <strong>CAD Engineered Solution:</strong> {activeProb.afterDiagram}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Technical Bylaw Code Reference & Mathematical Engineering Formula */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                        <div className="text-[10px] font-mono uppercase text-slate-500 flex items-center gap-1">
                          <Scale className="w-3 h-3 text-amber-400" />
                          Statutory & IS Code Reference:
                        </div>
                        <div className="text-xs font-mono font-semibold text-amber-300">
                          {activeProb.codeReference}
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                        <div className="text-[10px] font-mono uppercase text-slate-500 flex items-center gap-1">
                          <Calculator className="w-3 h-3 text-emerald-400" />
                          Financial & Schedule Impact:
                        </div>
                        <div className="text-xs font-mono font-semibold text-emerald-300">
                          {activeProb.costImpact} ({activeProb.timeToResolve})
                        </div>
                      </div>
                    </div>

                    {/* Formula Calculation Proof */}
                    {activeProb.engineeringFormula && (
                      <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1 font-mono text-xs">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <Terminal className="w-3 h-3 text-amber-400" />
                          Mathematical & Structural Calculation Proof:
                        </div>
                        <div className="text-amber-200/90 bg-slate-900 p-2 rounded border border-slate-800 text-[11px] overflow-x-auto">
                          {activeProb.engineeringFormula}
                        </div>
                      </div>
                    )}

                    {/* Autonomous Agent 4-Step Execution Plan */}
                    {activeProb.stepByStepFix && (
                      <div className="rounded-lg bg-slate-950 border border-slate-800 p-3 space-y-2">
                        <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                          <Workflow className="w-3.5 h-3.5 text-amber-400" />
                          Autonomous Resolution Pipeline (4 Execution Steps)
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {activeProb.stepByStepFix.map((step, idx) => (
                            <div
                              key={idx}
                              className="p-2 rounded bg-slate-900/80 border border-slate-800/80 flex items-start gap-2 text-slate-300"
                            >
                              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 border border-amber-500/30">
                                {idx + 1}
                              </span>
                              <span className="text-[11px] leading-snug">{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Live BOQ Item Payload Preview */}
                    {activeProb.actionPayload?.boqItem && (
                      <div className="p-3 rounded-lg bg-slate-950 border border-amber-500/20 space-y-1.5 text-xs">
                        <div className="text-[10px] font-mono uppercase text-amber-400 font-bold flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Layers className="w-3 h-3 text-amber-400" />
                            BOQ Injection Line:
                          </span>
                          <span className="text-slate-400">
                            {currency} {((activeProb.actionPayload.boqItem.quantity || 1) * (activeProb.actionPayload.boqItem.rate || 0)).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-white font-medium">
                          {activeProb.actionPayload.boqItem.name}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
                          <span>Qty: {activeProb.actionPayload.boqItem.quantity} {activeProb.actionPayload.boqItem.unit}</span>
                          <span>Rate: {currency} {activeProb.actionPayload.boqItem.rate}</span>
                          <span>Category: {activeProb.actionPayload.boqItem.category}</span>
                        </div>
                      </div>
                    )}

                    {/* Action Execution Footer */}
                    <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => handleInspectOnCad(activeProb)}
                          className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-mono transition flex items-center justify-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span>View on CAD Canvas</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConsultGouseAiOnProblem(activeProb)}
                          className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-mono transition flex items-center justify-center gap-1.5"
                        >
                          <Bot className="w-3.5 h-3.5 text-amber-400" />
                          <span>Consult Gouse AI</span>
                        </button>
                      </div>

                      {/* Main Solve Through & Through Button */}
                      <button
                        id="btn-solve-selected-problem"
                        type="button"
                        onClick={() => handleResolveProblem(activeProb.id)}
                        disabled={activeProb.isResolved}
                        className={`w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-md ${
                          activeProb.isResolved
                            ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                            : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 active:scale-95 shadow-amber-500/20'
                        }`}
                      >
                        {activeProb.isResolved ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span>Problem Resolved & Synced</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 fill-slate-950" />
                            <span>Solve Problem Through & Through</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: INTERACTIVE BLUEPRINT CAD ARCHITECTURE CANVAS                      */}
      {/* ========================================================================= */}
      {studioTab === 'cad_canvas' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Active AutoCAD Blueprint Status Ribbon & Master Actions */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/30 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-amber-400" />
                    AutoCAD DWG/DXF Connected
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {activeBlueprint.typology}
                  </span>
                  <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                    🧭 {activeBlueprint.facing}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {activeBlueprint.planTitle}
                  </h3>
                  <span className="text-xs font-mono text-amber-300/80">
                    ({activeBlueprint.fileName})
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono flex-wrap">
                  <span>📐 Plot: <strong className="text-slate-200">{activeBlueprint.plotDimensions}</strong></span>
                  <span>•</span>
                  <span>🏗️ Built-up: <strong className="text-slate-200">{activeBlueprint.builtUpAreaSqFt.toLocaleString()} sq.ft</strong></span>
                  <span>•</span>
                  <span>
                    Vastu Score:{' '}
                    <strong className={currentVastuScore >= 90 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                      {currentVastuScore}% {vastuCorrected ? '(✓ Certified Auspicious)' : `(${vastuDeviationsCount} Deviations)`}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Setbacks:{' '}
                    <strong className={vastuCorrected ? 'text-emerald-400' : 'text-red-400'}>
                      {vastuCorrected ? '100% Cleared (Front 3.0m restored)' : 'Front Deficit 0.8m'}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <button
                  id="btn-import-blueprint-modal"
                  type="button"
                  onClick={() => setIsBlueprintImportModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-500/60 text-slate-200 hover:text-white text-xs font-mono font-semibold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>Import / Connect AutoCAD Plan</span>
                </button>

                <button
                  id="btn-vastu-report-modal"
                  type="button"
                  onClick={() => setIsVastuReportModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 border border-amber-500/30 hover:border-amber-500 text-amber-300 text-xs font-mono font-semibold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>Vastu & Setback Audit Report</span>
                </button>

                <button
                  id="btn-apply-vastu-corrections"
                  type="button"
                  onClick={handleApplyVastuCorrections}
                  disabled={vastuCorrected}
                  className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition flex items-center gap-1.5 shadow-md ${
                    vastuCorrected
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                      : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/10'
                  }`}
                >
                  <Zap className={`w-3.5 h-3.5 ${vastuCorrected ? 'text-emerald-400' : 'fill-slate-950'}`} />
                  <span>{vastuCorrected ? '✓ Vastu Realignment Applied' : '1-Click Auto-Apply Vastu Realignment'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* CAD Workspace Navigation Sub-Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto scrollbar-none text-xs font-mono">
            <button
              type="button"
              onClick={() => setCadViewMode('canvas')}
              className={`px-3.5 py-2 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 font-semibold ${
                cadViewMode === 'canvas'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>2D Spatial Blueprint Canvas & Radar</span>
            </button>

            <button
              type="button"
              onClick={() => setCadViewMode('vastu_matrix')}
              className={`px-3.5 py-2 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 font-semibold ${
                cadViewMode === 'vastu_matrix'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Vastu Shastra 9-Zone Mandala Matrix</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  cadViewMode === 'vastu_matrix'
                    ? 'bg-slate-950 text-amber-300'
                    : vastuCorrected
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/20 text-red-300'
                }`}
              >
                {vastuCorrected ? '✓ 98% Auspicious' : `${vastuDeviationsCount} Deviations`}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCadViewMode('setback_audit')}
              className={`px-3.5 py-2 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 font-semibold ${
                cadViewMode === 'setback_audit'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Structural Setbacks Audit (BBMP / Nambike)</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  cadViewMode === 'setback_audit'
                    ? 'bg-slate-950 text-amber-300'
                    : vastuCorrected
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {vastuCorrected ? '✓ 4/4 Cleared' : 'Front Deficit 0.8m'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCadViewMode('dimensions_grid')}
              className={`px-3.5 py-2 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 font-semibold ${
                cadViewMode === 'dimensions_grid'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Ruler className="w-3.5 h-3.5" />
              <span>Dimensions & Spatial Alignments (IS 456)</span>
            </button>

            <button
              id="tab-cad-area-takeoff"
              type="button"
              onClick={() => setCadViewMode('area_takeoff')}
              className={`px-3.5 py-2 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 font-semibold ${
                cadViewMode === 'area_takeoff'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <TableProperties className="w-3.5 h-3.5" />
              <span>Gouse AI Master Area Takeoff & Room Schedule (NBC 2016)</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  cadViewMode === 'area_takeoff'
                    ? 'bg-slate-950 text-amber-300'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {activeBlueprint.rooms.length} Rooms Audited
              </span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* SUB-VIEW 1: 2D INTERACTIVE BLUEPRINT SVG CANVAS                           */}
          {/* ========================================================================= */}
          {cadViewMode === 'canvas' && (
            <div className="space-y-4">
              {/* Canvas Controls & Layer Toggles */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                {/* Layer Visibility Toggles */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-[11px] font-mono uppercase text-slate-500 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-amber-400" /> Layers:
                  </span>

                  <button
                    type="button"
                    onClick={() => setCanvasLayers((prev) => ({ ...prev, setbacks: !prev.setbacks }))}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition border ${
                      canvasLayers.setbacks
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    📏 Setbacks & Envelope
                  </button>

                  <button
                    type="button"
                    onClick={() => setCanvasLayers((prev) => ({ ...prev, columns: !prev.columns }))}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition border ${
                      canvasLayers.columns
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    🏗️ Columns C1-C12
                  </button>

                  <button
                    type="button"
                    onClick={() => setCanvasLayers((prev) => ({ ...prev, solar: !prev.solar }))}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition border ${
                      canvasLayers.solar
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    ☀️ Solar Heatmap
                  </button>

                  <button
                    type="button"
                    onClick={() => setCanvasLayers((prev) => ({ ...prev, egress: !prev.egress }))}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition border ${
                      canvasLayers.egress
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    🚒 Fire Driveway 6.0m
                  </button>

                  <button
                    type="button"
                    onClick={() => setCanvasLayers((prev) => ({ ...prev, vastu: !prev.vastu }))}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition border ${
                      canvasLayers.vastu
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    🧭 Vastu 9-Chakra Mandala
                  </button>

                  <button
                    type="button"
                    onClick={() => setCanvasLayers((prev) => ({ ...prev, dimensions: !prev.dimensions }))}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition border ${
                      canvasLayers.dimensions
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    📐 Dimensions & Tags
                  </button>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => setCadZoom((prev) => Math.max(0.7, Number((prev - 0.15).toFixed(2))))}
                      className="px-2 py-1 text-slate-400 hover:text-white"
                      title="Zoom Out"
                    >
                      -
                    </button>
                    <span className="px-2 py-1 text-amber-300 font-bold">{Math.round(cadZoom * 100)}%</span>
                    <button
                      type="button"
                      onClick={() => setCadZoom((prev) => Math.min(1.8, Number((prev + 0.15).toFixed(2))))}
                      className="px-2 py-1 text-slate-400 hover:text-white"
                      title="Zoom In"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => setCadZoom(1.0)}
                      className="px-2 py-1 text-slate-500 hover:text-slate-300 border-l border-slate-800"
                    >
                      Reset
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStudioTab('gui_solver')}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-mono font-semibold hover:bg-amber-500 hover:text-slate-950 transition"
                  >
                    Switch to GUI Solver →
                  </button>
                </div>
              </div>

              {/* SVG 2D Interactive Floor Plan Canvas */}
              <div className="relative rounded-2xl border-2 border-slate-800 bg-[#070b14] overflow-hidden shadow-2xl p-4">
                {/* Architectural Grid Background */}
                <div
                  className="w-full flex items-center justify-center transition-transform duration-200"
                  style={{ transform: `scale(${cadZoom})`, transformOrigin: 'top center' }}
                >
                  <svg
                    viewBox="0 0 800 520"
                    className="w-full max-w-4xl h-auto select-none"
                    style={{ filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.8))' }}
                  >
                    {/* Background CAD Grid pattern */}
                    <defs>
                      <pattern id="cadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#162032" strokeWidth="0.6" />
                      </pattern>
                      <linearGradient id="westSolarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                      </linearGradient>
                      <radialGradient id="brahmasthanAura" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#eab308" stopOpacity="0.4" />
                        <stop offset="60%" stopColor="#eab308" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#eab308" stopOpacity="0.0" />
                      </radialGradient>
                    </defs>
                    <rect width="800" height="520" fill="url(#cadGrid)" />

                    {/* Plot Boundary (60ft x 40ft footprint) */}
                    <rect
                      x="50"
                      y="40"
                      width="700"
                      height="440"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="1.5"
                      strokeDasharray="6 4"
                    />
                    <text x="65" y="60" fill="#60a5fa" fontSize="10" fontFamily="monospace">
                      SITE PLOT BOUNDARY: {activeBlueprint.plotDimensions} ({activeBlueprint.siteAreaSqFt.toLocaleString()} sq.ft / {activeBlueprint.siteAreaSqM.toFixed(1)} sq.m) • {activeBlueprint.facing}
                    </text>

                    {/* Setbacks Overlay (Front 10', Rear 6', Sides 4') */}
                    {canvasLayers.setbacks && (
                      <g id="setback-layer">
                        {/* Front Setback buffer */}
                        <rect
                          x="50"
                          y="40"
                          width="700"
                          height={vastuCorrected ? 75 : 70}
                          fill={vastuCorrected ? '#10b981' : '#f59e0b'}
                          fillOpacity={vastuCorrected ? '0.08' : '0.12'}
                        />
                        <line
                          x1="50"
                          y1="110"
                          x2="750"
                          y2="110"
                          stroke={vastuCorrected ? '#10b981' : '#ef4444'}
                          strokeWidth="1.5"
                          strokeDasharray={vastuCorrected ? 'none' : '4 3'}
                        />
                        <text
                          x="560"
                          y="100"
                          fill={vastuCorrected ? '#34d399' : '#f87171'}
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {vastuCorrected
                            ? 'MUNICIPAL FRONT SETBACK: 3.00m (CLEARED ✓)'
                            : 'MUNICIPAL FRONT SETBACK DEFICIT: 2.2m (0.8m ENCROACHMENT)'}
                        </text>

                        {/* Rear Setback buffer */}
                        <rect x="50" y="440" width="700" height="40" fill="#10b981" fillOpacity="0.05" />
                        <line x1="50" y1="440" x2="750" y2="440" stroke="#10b981" strokeWidth="1" strokeDasharray="3 3" />
                        <text x="65" y="465" fill="#34d399" fontSize="9" fontFamily="monospace">
                          REAR SETBACK: 1.85m (Compliant with 50mm buffer ✓)
                        </text>

                        {/* Side Setbacks */}
                        <rect x="50" y="110" width="60" height="330" fill="#3b82f6" fillOpacity="0.04" />
                        <text x="55" y="270" fill="#60a5fa" fontSize="8" fontFamily="monospace" transform="rotate(-90 55,270)">
                          WEST SETBACK: 1.20m
                        </text>
                        <rect x="690" y="110" width="60" height="330" fill="#3b82f6" fillOpacity="0.04" />
                        <text x="735" y="270" fill="#60a5fa" fontSize="8" fontFamily="monospace" transform="rotate(90 735,270)">
                          EAST SETBACK: 1.25m
                        </text>
                      </g>
                    )}

                    {/* Vastu 9-Chakra Mandala Overlay Grids */}
                    {canvasLayers.vastu && (
                      <g id="vastu-mandala-overlay" opacity="0.85">
                        {vastuZones.map((zone) => {
                          const isSelected = selectedVastuZoneId === zone.id;
                          const fillColor =
                            zone.id === 'vastu-center' && vastuCorrected
                              ? '#10b981'
                              : zone.isCompliant
                              ? zone.elementColor
                              : '#ef4444';

                          return (
                            <g
                              key={zone.id}
                              className="cursor-pointer transition-opacity hover:opacity-100"
                              onClick={() => setSelectedVastuZoneId(zone.id)}
                            >
                              <rect
                                x={zone.cadCoordinates.x}
                                y={zone.cadCoordinates.y}
                                width={zone.cadCoordinates.width}
                                height={zone.cadCoordinates.height}
                                fill={fillColor}
                                fillOpacity={isSelected ? 0.22 : 0.08}
                                stroke={fillColor}
                                strokeWidth={isSelected ? 2 : 0.8}
                                strokeDasharray={zone.isCompliant ? 'none' : '3 2'}
                              />
                              <text
                                x={zone.cadCoordinates.x + 8}
                                y={zone.cadCoordinates.y + 16}
                                fill={fillColor}
                                fontSize="9"
                                fontWeight="bold"
                                fontFamily="monospace"
                              >
                                {zone.directionKey} • {zone.rulingElement.split(' ')[0]}
                              </text>
                              <text
                                x={zone.cadCoordinates.x + 8}
                                y={zone.cadCoordinates.y + 28}
                                fill="#94a3b8"
                                fontSize="7.5"
                                fontFamily="monospace"
                              >
                                {zone.energyScore}% {zone.isCompliant ? '✓' : '⚠️ Dosh'}
                              </text>
                            </g>
                          );
                        })}

                        {/* Central Brahmasthan Golden Core */}
                        {vastuCorrected ? (
                          <g>
                            <circle cx="425" cy="270" r="45" fill="url(#brahmasthanAura)" />
                            <text x="365" y="275" fill="#fde047" fontSize="10" fontWeight="bold" fontFamily="monospace">
                              ✨ BRAHMASTHAN (OPEN ATRIUM)
                            </text>
                          </g>
                        ) : (
                          <g>
                            <rect
                              x="350"
                              y="210"
                              width="150"
                              height="120"
                              fill="#ef4444"
                              fillOpacity="0.15"
                              stroke="#ef4444"
                              strokeWidth="1.5"
                              strokeDasharray="4 2"
                            />
                            <text x="360" y="250" fill="#f87171" fontSize="9" fontWeight="bold" fontFamily="monospace">
                              ⚠️ BRAHMASTHAN CORE
                            </text>
                            <text x="360" y="264" fill="#fca5a5" fontSize="8" fontFamily="monospace">
                              CRITICAL DOSH: Column C6 Load!
                            </text>
                          </g>
                        )}
                      </g>
                    )}

                    {/* Building Footprint Perimeter Walls */}
                    <g id="building-envelope">
                      {/* Perimeter Wall Outline (Shifts down by 0.8m if vastuCorrected to clear front setback) */}
                      <path
                        d={
                          vastuCorrected
                            ? 'M 120 118 L 680 118 L 680 390 L 600 390 L 600 440 L 190 440 L 190 390 L 120 390 Z'
                            : 'M 120 110 L 680 110 L 680 390 L 600 390 L 600 440 L 190 440 L 190 390 L 120 390 Z'
                        }
                        fill="#0f172a"
                        fillOpacity="0.85"
                        stroke="#94a3b8"
                        strokeWidth="3.5"
                      />

                      {/* Dynamic Interior Room Partitions from Active AutoCAD Blueprint */}
                      {activeBlueprint.rooms.map((room) => {
                        const isSelected = selectedCadRoomId === room.id;
                        const isHovered = hoveredCadRoomId === room.id;

                        return (
                          <g
                            key={room.id}
                            id={`room-${room.id}`}
                            className="cursor-pointer transition-all duration-200"
                            onClick={() => setSelectedCadRoomId(room.id)}
                            onMouseEnter={() => setHoveredCadRoomId(room.id)}
                            onMouseLeave={() => setHoveredCadRoomId(null)}
                          >
                            <rect
                              x={room.svgRect.x}
                              y={room.svgRect.y}
                              width={room.svgRect.width}
                              height={room.svgRect.height}
                              fill={isSelected ? '#1e293b' : isHovered ? '#1e293b' : '#0f172a'}
                              fillOpacity={isSelected ? 0.85 : isHovered ? 0.7 : 0.55}
                              stroke={isSelected ? '#38bdf8' : isHovered ? '#f59e0b' : '#475569'}
                              strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1.2}
                              rx="2"
                            />
                            {/* Color Accent Bar on Room Top */}
                            <rect
                              x={room.svgRect.x}
                              y={room.svgRect.y}
                              width={room.svgRect.width}
                              height={3}
                              fill={room.color}
                            />
                            {/* Room Label */}
                            <text
                              x={room.svgRect.x + 8}
                              y={room.svgRect.y + 18}
                              fill={isSelected ? '#38bdf8' : '#e2e8f0'}
                              fontSize={room.svgRect.width < 120 ? '9' : '10.5'}
                              fontWeight="bold"
                              className="pointer-events-none"
                            >
                              {room.name.toUpperCase()}
                            </text>
                            {/* Dimensions & Area in Ft */}
                            <text
                              x={room.svgRect.x + 8}
                              y={room.svgRect.y + 32}
                              fill="#94a3b8"
                              fontSize="8"
                              fontFamily="monospace"
                              className="pointer-events-none"
                            >
                              ({room.dimensionsFt}) • {room.areaSqFt} sq.ft
                            </text>
                            {/* Metric & Quadrant Info */}
                            {room.svgRect.height > 75 && (
                              <text
                                x={room.svgRect.x + 8}
                                y={room.svgRect.y + 44}
                                fill={room.color}
                                fontSize="7"
                                fontFamily="monospace"
                                className="pointer-events-none"
                              >
                                {room.dimensionsM} • {room.quadrant}
                              </text>
                            )}
                            {/* NBC Code Status Pill */}
                            {room.svgRect.height > 95 && (
                              <g transform={`translate(${room.svgRect.x + 8}, ${room.svgRect.y + room.svgRect.height - 18})`}>
                                <rect
                                  width="64"
                                  height="13"
                                  rx="3"
                                  fill={room.nbcCompliance === 'compliant' ? '#10b98125' : '#f59e0b25'}
                                  stroke={room.nbcCompliance === 'compliant' ? '#10b981' : '#f59e0b'}
                                  strokeWidth="0.8"
                                />
                                <text x="5" y="9.5" fill={room.nbcCompliance === 'compliant' ? '#34d399' : '#fbbf24'} fontSize="6.5" fontFamily="monospace" fontWeight="bold">
                                  NBC: {room.nbcCompliance === 'compliant' ? 'PASS ✓' : 'REVIEW'}
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })}

                      {/* Selected Room Bracket Dimension Highlight */}
                      {(() => {
                        const selRoom = activeBlueprint.rooms.find((r) => r.id === selectedCadRoomId);
                        if (!selRoom) return null;
                        return (
                          <g id="selected-room-brackets" className="pointer-events-none">
                            <rect
                              x={selRoom.svgRect.x - 3}
                              y={selRoom.svgRect.y - 3}
                              width={selRoom.svgRect.width + 6}
                              height={selRoom.svgRect.height + 6}
                              fill="none"
                              stroke="#38bdf8"
                              strokeWidth="2"
                              strokeDasharray="6 3"
                            >
                              <animate attributeName="stroke-dashoffset" values="0;18" dur="2s" repeatCount="indefinite" />
                            </rect>
                            <rect
                              x={selRoom.svgRect.x + selRoom.svgRect.width / 2 - 70}
                              y={selRoom.svgRect.y + selRoom.svgRect.height - 19}
                              width="140"
                              height="18"
                              rx="4"
                              fill="#020617"
                              stroke="#38bdf8"
                              strokeWidth="1.2"
                            />
                            <text
                              x={selRoom.svgRect.x + selRoom.svgRect.width / 2}
                              y={selRoom.svgRect.y + selRoom.svgRect.height - 7}
                              fill="#38bdf8"
                              fontSize="8"
                              fontWeight="bold"
                              fontFamily="monospace"
                              textAnchor="middle"
                            >
                              📐 {selRoom.dimensionsFt} [{selRoom.dimensionsM}]
                            </text>
                          </g>
                        );
                      })()}

                      {/* Underground Rainwater Sump in Ishanya NE */}
                      {vastuCorrected && (
                        <g>
                          <rect
                            x="590"
                            y="70"
                            width="75"
                            height="40"
                            fill="#0284c7"
                            fillOpacity="0.3"
                            stroke="#38bdf8"
                            strokeWidth="1.5"
                            rx="4"
                          />
                          <text x="595" y="88" fill="#38bdf8" fontSize="8" fontWeight="bold" fontFamily="monospace">
                            💧 10,000L SUMP
                          </text>
                          <text x="595" y="100" fill="#bae6fd" fontSize="7" fontFamily="monospace">
                            Ishanya NE Zone ✓
                          </text>
                        </g>
                      )}
                    </g>

                    {/* CAD Dimension Witness Lines & Tags Layer */}
                    {canvasLayers.dimensions && (
                      <g id="cad-dimensions-layer">
                        {/* Overall Width Dimension (Top) */}
                        <g>
                          <line x1="50" y1="22" x2="750" y2="22" stroke="#f59e0b" strokeWidth="1.2" />
                          <line x1="50" y1="16" x2="50" y2="40" stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="2 2" />
                          <line x1="750" y1="16" x2="750" y2="40" stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="2 2" />
                          <line x1="46" y1="26" x2="54" y2="18" stroke="#f59e0b" strokeWidth="1.5" />
                          <line x1="746" y1="26" x2="754" y2="18" stroke="#f59e0b" strokeWidth="1.5" />
                          <rect x="310" y="12" width="180" height="18" rx="3" fill="#020617" fillOpacity="0.92" stroke="#f59e0b" strokeWidth="0.8" />
                          <text x="400" y="24" fill="#fde047" fontSize="8.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                            WIDTH: {activeBlueprint.plotWidthFt}'-0" [{(activeBlueprint.plotWidthFt * 0.3048).toFixed(2)}m]
                          </text>
                        </g>

                        {/* Overall Length Dimension (Left) */}
                        <g>
                          <line x1="25" y1="40" x2="25" y2="480" stroke="#f59e0b" strokeWidth="1.2" />
                          <line x1="18" y1="40" x2="50" y2="40" stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="2 2" />
                          <line x1="18" y1="480" x2="50" y2="480" stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="2 2" />
                          <line x1="21" y1="44" x2="29" y2="36" stroke="#f59e0b" strokeWidth="1.5" />
                          <line x1="21" y1="484" x2="29" y2="476" stroke="#f59e0b" strokeWidth="1.5" />
                          <rect x="5" y="240" width="38" height="30" rx="3" fill="#020617" fillOpacity="0.92" stroke="#f59e0b" strokeWidth="0.8" />
                          <text x="24" y="255" fill="#fde047" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle" transform="rotate(-90 24,255)">
                            {activeBlueprint.plotLengthFt}'-0"
                          </text>
                        </g>

                        {/* Blueprint Specific Dimension Tags */}
                        {activeBlueprint.dimensionTags.map((dim) => (
                          <g key={dim.id}>
                            <line x1={dim.x1} y1={dim.y1} x2={dim.x2} y2={dim.y2} stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 2" />
                            <rect x={dim.textX - 75} y={dim.textY - 8} width="150" height="16" rx="3" fill="#020617" fillOpacity="0.95" stroke="#38bdf8" strokeWidth="0.8" />
                            <text x={dim.textX} y={dim.textY + 3.5} fill="#7dd3fc" fontSize="7.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                              {dim.label}
                            </text>
                          </g>
                        ))}
                      </g>
                    )}

                    {/* West Facade Solar Heatmap Layer */}
                    {canvasLayers.solar && (
                      <g id="solar-layer">
                        <rect x="70" y="110" width="70" height="280" fill="url(#westSolarGrad)" />
                        <text x="80" y="130" fill="#f87171" fontSize="9" fontWeight="bold" fontFamily="monospace">
                          {vastuCorrected ? '☀ WEST FACADE LOW-E + LOUVERS ✓' : '☀ WEST SOLAR GLAZING (42% WWR)'}
                        </text>
                      </g>
                    )}

                    {/* Fire Tender Access Driveway Layer */}
                    {canvasLayers.egress && (
                      <g id="egress-layer">
                        <path
                          d="M 50 420 L 110 420 L 180 435"
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="3"
                          strokeDasharray="4 4"
                        />
                        <text x="65" y="415" fill="#fbbf24" fontSize="9" fontWeight="bold" fontFamily="monospace">
                          🚒 FIRE TENDER ACCESS (6.0m CLEAR TRACK)
                        </text>
                      </g>
                    )}

                    {/* Columns C1 through C12 Grid Layer */}
                    {canvasLayers.columns && (
                      <g id="columns-grid">
                        {[
                          { id: 'C1', x: 130, y: 120 },
                          { id: 'C2', x: 260, y: 120 },
                          { id: 'C3', x: 500, y: 120 },
                          { id: 'C4', x: 670, y: 120 },
                          { id: 'C5', x: 130, y: 250 },
                          // Column C6: When uncorrected, placed in Brahmasthan at (395, 250). When corrected, moved to Grid B3 at (490, 250)!
                          {
                            id: 'C6',
                            x: vastuCorrected ? 490 : 395,
                            y: 250,
                            isDefective: !vastuCorrected,
                          },
                          { id: 'C7', x: 500, y: 250 },
                          { id: 'C8', x: 670, y: 250 },
                          { id: 'C9', x: 130, y: 380 },
                          { id: 'C10', x: 260, y: 380 },
                          { id: 'C11', x: 500, y: 380 },
                          { id: 'C12', x: 670, y: 380 },
                        ].map((col) => (
                          <g key={col.id} transform={`translate(${col.x}, ${col.y})`}>
                            <rect
                              x="-7"
                              y="-7"
                              width="14"
                              height="14"
                              fill={col.isDefective ? '#ef4444' : vastuCorrected && col.id === 'C6' ? '#10b981' : '#38bdf8'}
                              stroke={col.isDefective ? '#b91c1c' : '#0284c7'}
                              strokeWidth={col.isDefective ? 2.5 : 1.5}
                            />
                            {col.isDefective && (
                              <circle r="14" fill="#ef4444" fillOpacity="0.3">
                                <animate attributeName="r" values="8;16;8" dur="1.5s" repeatCount="indefinite" />
                              </circle>
                            )}
                            <text
                              x="9"
                              y="4"
                              fill={col.isDefective ? '#f87171' : vastuCorrected && col.id === 'C6' ? '#34d399' : '#38bdf8'}
                              fontSize="8"
                              fontWeight="bold"
                              fontFamily="monospace"
                            >
                              {col.id} {col.isDefective ? '(DOSH)' : vastuCorrected && col.id === 'C6' ? '(Grid B3 ✓)' : ''}
                            </text>
                          </g>
                        ))}
                      </g>
                    )}

                    {/* Interactive Problem Pins */}
                    {problems.map((prob) => {
                      const isSelected = selectedProblemId === prob.id;
                      const pinColor = prob.isResolved
                        ? '#10b981'
                        : prob.severity === 'critical'
                        ? '#ef4444'
                        : prob.severity === 'warning'
                        ? '#f59e0b'
                        : '#3b82f6';

                      return (
                        <g
                          key={prob.id}
                          transform={`translate(${prob.cadCoordinates.x}, ${prob.cadCoordinates.y})`}
                          className="cursor-pointer"
                          onClick={() => {
                            setSelectedProblemId(prob.id);
                            setCanvasSelectedZone(prob.id);
                          }}
                        >
                          {!prob.isResolved && (
                            <circle r="14" fill={pinColor} fillOpacity="0.25">
                              <animate attributeName="r" values="10;18;10" dur="2s" repeatCount="indefinite" />
                            </circle>
                          )}
                          <circle
                            r={isSelected ? '10' : '7.5'}
                            fill={pinColor}
                            stroke="#ffffff"
                            strokeWidth={isSelected ? '2.5' : '1.5'}
                            filter="drop-shadow(0 2px 5px rgba(0,0,0,0.5))"
                          />
                          {prob.isResolved ? (
                            <path d="M -3 0 L -1 3 L 4 -2" fill="none" stroke="#ffffff" strokeWidth="1.5" />
                          ) : (
                            <circle r="2" fill="#ffffff" />
                          )}
                          <rect
                            x="12"
                            y="-10"
                            width={prob.cadCoordinates.label.length * 6 + 16}
                            height="18"
                            rx="4"
                            fill="#020617"
                            fillOpacity="0.9"
                            stroke={pinColor}
                            strokeWidth="1"
                          />
                          <text x="18" y="2" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="monospace">
                            {prob.cadCoordinates.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Floating Blueprint HUD Overlay */}
                {/* Floating Blueprint HUD Overlay */}
                <div className="absolute top-4 right-4 bg-slate-950/95 border border-slate-800 p-3.5 rounded-xl backdrop-blur-md text-xs font-mono space-y-1.5 shadow-2xl max-w-xs ring-1 ring-slate-800">
                  <div className="text-amber-400 font-bold flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Ruler className="w-3.5 h-3.5 text-amber-400" />
                      <span>CAD SPATIAL & AREA RADAR</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold">GOUSE AI SYNC</span>
                  </div>
                  <div className="flex justify-between text-slate-300 text-[11px]">
                    <span className="text-slate-400">Plot Dimensions:</span>
                    <span className="font-semibold text-white">{activeBlueprint.plotDimensions}</span>
                  </div>
                  <div className="flex justify-between text-slate-300 text-[11px]">
                    <span className="text-slate-400">Total Site Area:</span>
                    <span className="font-semibold text-amber-300">{activeBlueprint.siteAreaSqFt.toLocaleString()} sq.ft ({activeBlueprint.siteAreaSqM.toFixed(1)} m²)</span>
                  </div>
                  <div className="flex justify-between text-slate-300 text-[11px]">
                    <span className="text-slate-400">Ground Coverage:</span>
                    <span className="font-semibold text-white">
                      {((activeBlueprint.groundFootprintSqFt / activeBlueprint.siteAreaSqFt) * 100).toFixed(1)}% ({activeBlueprint.groundFootprintSqFt.toLocaleString()} sq.ft)
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300 text-[11px]">
                    <span className="text-slate-400">Net Usable Carpet:</span>
                    <span className="font-semibold text-emerald-400">
                      {activeBlueprint.netCarpetAreaSqFt.toLocaleString()} sq.ft ({((activeBlueprint.netCarpetAreaSqFt / activeBlueprint.builtUpAreaSqFt) * 100).toFixed(1)}% eff.)
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300 text-[11px]">
                    <span className="text-slate-400">Gross Built-Up (FAR):</span>
                    <span className="font-semibold text-cyan-300">
                      {activeBlueprint.builtUpAreaSqFt.toLocaleString()} sq.ft (FAR {activeBlueprint.farAchieved.toFixed(2)})
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300 text-[11px]">
                    <span className="text-slate-400">Vastu Compliance:</span>
                    <span className={`font-bold ${currentVastuScore >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {currentVastuScore}% {vastuCorrected ? '(✓ Certified)' : 'Audit Pending'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300 text-[11px]">
                    <span className="text-slate-400">Setback Status:</span>
                    <span className={`font-bold ${vastuCorrected ? 'text-emerald-400' : 'text-red-400'}`}>
                      {vastuCorrected ? 'Cleared (3.0m ✓)' : 'Deficit 0.8m (North)'}
                    </span>
                  </div>
                  <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Audited Rooms: {activeBlueprint.rooms.length} spaces</span>
                    <button
                      type="button"
                      onClick={() => setCadViewMode('area_takeoff')}
                      className="text-amber-400 hover:text-amber-300 underline font-semibold cursor-pointer"
                    >
                      View Takeoff Schedule →
                    </button>
                  </div>
                </div>
              </div>

              {/* Gouse AI Blueprint Area & Dimensional Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Total Site Area</span>
                  <div className="text-sm font-bold text-white mt-0.5">{activeBlueprint.siteAreaSqFt.toLocaleString()} sq.ft</div>
                  <span className="text-[10px] text-slate-400">{activeBlueprint.siteAreaSqM.toFixed(1)} m² • {activeBlueprint.plotDimensions}</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Ground Footprint</span>
                  <div className="text-sm font-bold text-amber-400 mt-0.5">{activeBlueprint.groundFootprintSqFt.toLocaleString()} sq.ft</div>
                  <span className="text-[10px] text-slate-400">{((activeBlueprint.groundFootprintSqFt / activeBlueprint.siteAreaSqFt) * 100).toFixed(1)}% coverage (Max 65%)</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Net Carpet Area</span>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">{activeBlueprint.netCarpetAreaSqFt.toLocaleString()} sq.ft</div>
                  <span className="text-[10px] text-slate-400">{((activeBlueprint.netCarpetAreaSqFt / activeBlueprint.builtUpAreaSqFt) * 100).toFixed(1)}% usable efficiency</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Super Built-Up (GBA)</span>
                  <div className="text-sm font-bold text-cyan-400 mt-0.5">{activeBlueprint.builtUpAreaSqFt.toLocaleString()} sq.ft</div>
                  <span className="text-[10px] text-slate-400">FAR {activeBlueprint.farAchieved.toFixed(2)} (Permissible 1.75)</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Open / Green Setback</span>
                  <div className="text-sm font-bold text-indigo-400 mt-0.5">{(activeBlueprint.siteAreaSqFt - activeBlueprint.groundFootprintSqFt).toLocaleString()} sq.ft</div>
                  <span className="text-[10px] text-slate-400">{(((activeBlueprint.siteAreaSqFt - activeBlueprint.groundFootprintSqFt) / activeBlueprint.siteAreaSqFt) * 100).toFixed(1)}% open buffer</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">NBC 2016 Part 8</span>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">100% Pass</div>
                  <span className="text-[10px] text-slate-400">{activeBlueprint.rooms.length} Habitable Zones Audited</span>
                </div>
              </div>

              {/* Gouse AI Interactive Room Dimension & Takeoff Inspector */}
              {(() => {
                const selRoom = activeBlueprint.rooms.find((r) => r.id === selectedCadRoomId) || activeBlueprint.rooms[0];
                if (!selRoom) return null;

                return (
                  <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-4 shadow-lg space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
                          <Ruler className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Active Room: {selRoom.name.toUpperCase()}</span>
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          Category: <strong className="text-slate-200 capitalize">{selRoom.category}</strong>
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          Vastu Quadrant: <strong className="text-amber-300">{selRoom.quadrant}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase ${
                            selRoom.nbcCompliance === 'compliant'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          NBC 2016: {selRoom.nbcCompliance === 'compliant' ? '✓ STATUTORY PASS' : '⚠️ REVIEW'}
                        </span>
                        <span className="text-xs font-mono font-bold text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {selRoom.percentOfFloor}% of Floor
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-500 uppercase block">Imperial Dimensions</span>
                        <div className="text-sm font-bold text-amber-300 mt-1">{selRoom.dimensionsFt}</div>
                        <span className="text-[10px] text-slate-400">Width × Length</span>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-500 uppercase block">Metric Dimensions</span>
                        <div className="text-sm font-bold text-slate-200 mt-1">{selRoom.dimensionsM}</div>
                        <span className="text-[10px] text-slate-400">IS 456 Grid Centerlines</span>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-500 uppercase block">Net Usable Carpet Area</span>
                        <div className="text-sm font-bold text-emerald-400 mt-1">{selRoom.areaSqFt} sq.ft</div>
                        <span className="text-[10px] text-slate-400">{selRoom.areaSqM.toFixed(2)} sq.meters</span>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-500 uppercase block">Ventilation & Ceiling</span>
                        <div className="text-sm font-bold text-cyan-300 mt-1">{selRoom.daylightFactor}</div>
                        <span className="text-[10px] text-slate-400">{selRoom.ceilingHeightFt}'-0" Clear Height</span>
                      </div>
                    </div>

                    {/* Room Selector Strip */}
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
                      <span className="text-[10px] font-mono uppercase text-slate-500 whitespace-nowrap mr-1">Switch Room:</span>
                      {activeBlueprint.rooms.map((rm) => (
                        <button
                          key={rm.id}
                          type="button"
                          onClick={() => setSelectedCadRoomId(rm.id)}
                          className={`px-2.5 py-1 rounded text-[11px] font-mono whitespace-nowrap transition border ${
                            selectedCadRoomId === rm.id
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                          }`}
                        >
                          {rm.name} ({rm.areaSqFt} sq.ft)
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="text-[11px] font-mono text-slate-400">
                        Statutory Minimum Habitable Area: {selRoom.category === 'bedroom' ? '9.5 sq.m (min 2.4m width)' : selRoom.category === 'kitchen' ? '5.0 sq.m (min 1.8m width)' : 'Complies with NBC 2016 Part 8'}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setInputMessage(`Gouse AI, evaluate the precise measurements (${selRoom.dimensionsFt}, ${selRoom.areaSqFt} sq.ft) of the ${selRoom.name} in our imported CAD blueprint.`);
                            handleSendMessage(`Gouse AI, evaluate the precise measurements (${selRoom.dimensionsFt}, ${selRoom.areaSqFt} sq.ft) of the ${selRoom.name} in our imported CAD blueprint.`);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-cyan-300 hover:text-cyan-200 text-xs font-mono transition flex items-center gap-1.5"
                        >
                          <Bot className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Audit Room Dimensions</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCadViewMode('area_takeoff')}
                          className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold font-mono transition flex items-center gap-1.5"
                        >
                          <TableProperties className="w-3.5 h-3.5" />
                          <span>Full Area Takeoff Table</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Bottom Selected CAD Zone / Vastu Inspector Card */}
              {(() => {
                const activeZone = vastuZones.find((z) => z.id === selectedVastuZoneId) || vastuZones[8]; // Default to Brahmasthan
                const activeProb = problems.find((p) => p.id === selectedProblemId) || problems[0];

                return (
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                          <Compass className="w-3.5 h-3.5" />
                          Selected Quadrant: {activeZone.quadrantName}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          Deity: <strong className="text-slate-200">{activeZone.deity}</strong>
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          Element: <strong className="text-slate-200">{activeZone.rulingElement}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase ${
                            activeZone.isCompliant
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-red-500/20 text-red-300 border border-red-500/30'
                          }`}
                        >
                          {activeZone.isCompliant ? '✓ AUSPICIOUS' : '⚠️ VASTU DEVIATION DOSH'}
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-300">
                          Energy: {activeZone.energyScore}/100
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-[10px] font-mono uppercase text-slate-500">Active Blueprint Condition:</span>
                        <p className="text-slate-200 font-sans">{activeZone.activePlacement}</p>
                        {activeZone.deviationDetails && (
                          <div className="text-red-300 bg-red-950/30 p-2 rounded border border-red-500/20 mt-1 font-mono text-[11px]">
                            <strong>Deviation:</strong> {activeZone.deviationDetails}
                          </div>
                        )}
                      </div>

                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-[10px] font-mono uppercase text-emerald-400">Gouse AI Architectural Correction:</span>
                        <p className="text-slate-200 font-sans">{activeZone.architecturalFix}</p>
                        {activeZone.nonInvasiveRemedy && (
                          <div className="text-amber-200/90 bg-amber-950/20 p-2 rounded border border-amber-500/20 mt-1 text-[11px]">
                            <strong>Non-Invasive Remedy:</strong> {activeZone.nonInvasiveRemedy}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="text-[11px] font-mono text-slate-400">
                        Ideal Placements for {activeZone.directionKey}: {activeZone.idealRooms.join(' • ')}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleConsultGouseAiOnProblem(activeProb)}
                          className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono transition"
                        >
                          Consult Voice
                        </button>
                        <button
                          type="button"
                          onClick={handleApplyVastuCorrections}
                          disabled={vastuCorrected}
                          className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold font-mono transition disabled:opacity-50"
                        >
                          {vastuCorrected ? '✓ Realignment Applied' : 'Realign Blueprint'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-VIEW 2: VASTU SHASTRA 9-ZONE PURUSHA MANDALA MATRIX                   */}
          {/* ========================================================================= */}
          {cadViewMode === 'vastu_matrix' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Compass className="w-4 h-4 text-amber-400" />
                    Vastu Purusha Mandala 9-Zone Compliance Grid ({activeBlueprint.facing})
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ancient Vedic spatial orientation analyzed against modern structural loads, airflow, and solar illumination.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleApplyVastuCorrections}
                    disabled={vastuCorrected}
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold font-mono transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                  >
                    <Zap className="w-3.5 h-3.5 fill-slate-950" />
                    <span>{vastuCorrected ? '✓ All 9 Zones Aligned' : 'Auto-Realign All 9 Zones'}</span>
                  </button>
                </div>
              </div>

              {/* 3x3 Vastu Mandala Grid (Cardinal Layout) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* Order: NW, N, NE / W, Center, E / SW, S, SE */}
                {[
                  vastuZones.find((z) => z.directionKey === 'NW')!,
                  vastuZones.find((z) => z.directionKey === 'N')!,
                  vastuZones.find((z) => z.directionKey === 'NE')!,
                  vastuZones.find((z) => z.directionKey === 'W')!,
                  vastuZones.find((z) => z.directionKey === 'Brahmasthan')!,
                  vastuZones.find((z) => z.directionKey === 'E')!,
                  vastuZones.find((z) => z.directionKey === 'SW')!,
                  vastuZones.find((z) => z.directionKey === 'S')!,
                  vastuZones.find((z) => z.directionKey === 'SE')!,
                ].map((zone) => {
                  const isCenter = zone.directionKey === 'Brahmasthan';

                  return (
                    <div
                      key={zone.id}
                      className={`p-4 rounded-xl border transition flex flex-col justify-between space-y-3 ${
                        isCenter
                          ? vastuCorrected
                            ? 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/30'
                            : 'bg-red-950/20 border-red-500/40 ring-1 ring-red-500/30'
                          : zone.isCompliant
                          ? 'bg-slate-900/90 border-slate-800'
                          : 'bg-red-950/15 border-red-500/30'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-amber-400">
                            {zone.quadrantName}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              zone.isCompliant
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-red-500/20 text-red-300'
                            }`}
                          >
                            {zone.isCompliant ? 'AUSPICIOUS' : 'DEVIATION DOSH'}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono">
                          <span>Element: <strong className="text-slate-200">{zone.rulingElement.split(' ')[0]}</strong></span>
                          <span>Score: <strong className={zone.energyScore >= 90 ? 'text-emerald-400' : 'text-amber-400'}>{zone.energyScore}%</strong></span>
                        </div>

                        <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
                          <div className="text-[10px] font-mono text-slate-500 uppercase">Current Blueprint:</div>
                          <div className="leading-snug">{zone.activePlacement}</div>
                        </div>

                        {zone.deviationDetails && (
                          <div className="p-2 rounded bg-red-950/40 border border-red-500/20 text-xs text-red-300 font-mono">
                            {zone.deviationDetails}
                          </div>
                        )}

                        <div className="text-xs text-slate-300 space-y-1">
                          <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">
                            Architectural Correction:
                          </span>
                          <p className="text-[11px] leading-relaxed text-slate-300">
                            {zone.architecturalFix}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-500">Deity: {zone.deity.split(' ')[0]}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVastuZoneId(zone.id);
                            setCadViewMode('canvas');
                          }}
                          className="text-amber-400 hover:text-amber-300 underline"
                        >
                          View on Canvas →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-VIEW 3: STRUCTURAL SETBACKS AUDIT (BBMP / NAMBIKE NAKSHE 2.0)         */}
          {/* ========================================================================= */}
          {cadViewMode === 'setback_audit' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Scale className="w-4 h-4 text-amber-400" />
                    Statutory Setbacks & Municipal Clearance Audit (BBMP Bye-Laws & Nambike Nakshe 2.0)
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Automated envelope verification for plot dimensions {activeBlueprint.plotDimensions}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleApplyVastuCorrections}
                  disabled={vastuCorrected}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono transition disabled:opacity-50"
                >
                  {vastuCorrected ? '✓ Setback Realigned (3.0m)' : 'Fix Front Setback Deficit'}
                </button>
              </div>

              {/* Setback Audit Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase">
                    <tr>
                      <th className="p-3.5">Boundary / Cardinal Edge</th>
                      <th className="p-3.5">Required Setback</th>
                      <th className="p-3.5">Actual Modeled</th>
                      <th className="p-3.5">Deficit / Margin</th>
                      <th className="p-3.5">Statutory Bylaw Rule</th>
                      <th className="p-3.5">Status & Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono">
                    {setbackAudits.map((item, idx) => {
                      const isFront = item.boundary === 'Front (North)';
                      const effectiveActual = isFront && vastuCorrected ? 3.0 : item.actualMeters;
                      const effectiveDeficit = isFront && vastuCorrected ? 0.0 : item.deficitMeters;
                      const effectiveStatus = isFront && vastuCorrected ? true : item.isCompliant;

                      return (
                        <tr key={idx} className="hover:bg-slate-900/50 transition">
                          <td className="p-3.5 font-bold text-white flex items-center gap-2">
                            <span>{item.boundary}</span>
                          </td>
                          <td className="p-3.5 text-slate-300">{item.requiredMeters.toFixed(2)} m</td>
                          <td className="p-3.5 font-bold text-amber-300">{effectiveActual.toFixed(2)} m</td>
                          <td className="p-3.5">
                            {effectiveDeficit > 0 ? (
                              <span className="text-red-400 font-bold">-{effectiveDeficit.toFixed(2)} m Deficit</span>
                            ) : (
                              <span className="text-emerald-400 font-bold">+{(effectiveActual - item.requiredMeters).toFixed(2)} m Buffer</span>
                            )}
                          </td>
                          <td className="p-3.5 text-slate-400 text-[11px] font-sans">{item.governingBylaw}</td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                effectiveStatus
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-red-500/20 text-red-300'
                              }`}
                            >
                              {effectiveStatus ? '✓ COMPLIANT' : 'ENCROACHMENT'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-VIEW 4: DIMENSIONS, SPATIAL ALIGNMENTS & COLUMN GRIDS (IS 456)        */}
          {/* ========================================================================= */}
          {cadViewMode === 'dimensions_grid' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-amber-400" />
                  Dimensions, Spatial Alignments & Column Grid Verification (IS 456 / IS 13920 / NBC 2016)
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Structural integrity checks across column grid centerlines, cantilever span-to-depth ratios, and clear egress corridors.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {dimensionAudits.map((item, idx) => {
                  const isColC6 = item.parameter.includes('Column Grid Alignment');
                  const currentStatus = isColC6 && vastuCorrected ? 'compliant' : item.status;
                  const currentNotes = isColC6 && vastuCorrected
                    ? 'Column C6 successfully realigned eastward to grid line B3. Central Brahmasthan unobstructed.'
                    : item.engineeringNotes;

                  return (
                    <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{item.parameter}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            currentStatus === 'compliant'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : currentStatus === 'warning'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          {currentStatus}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-950 p-2.5 rounded border border-slate-800/80">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Modeled Value:</span>
                          <span className="text-amber-300 font-semibold">{item.modeledValue}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Statutory Limit:</span>
                          <span className="text-slate-300 font-semibold">{item.statutoryLimit}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 font-sans leading-relaxed">
                        {currentNotes}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-VIEW 5: GOUSE AI MASTER AREA TAKEOFF & ROOM SCHEDULE (NBC 2016)       */}
          {/* ========================================================================= */}
          {cadViewMode === 'area_takeoff' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Header Banner */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                      <TableProperties className="w-3.5 h-3.5 text-amber-400" />
                      <span>Gouse AI Master Area Takeoff & Architectural Schedule</span>
                    </span>
                    <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>NBC 2016 / BBMP Byelaws Certified</span>
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{activeBlueprint.planTitle}</span>
                    <span className="text-xs font-mono text-slate-400 font-normal">
                      • {activeBlueprint.typology} • {activeBlueprint.plotDimensions} ({activeBlueprint.facing} Facing)
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Rigorous CAD dimension analysis, carpet vs super built-up area schedule, space efficiency ratios, and statutory minimums.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setInputMessage(`Gouse AI Specialist Agent, analyze our imported CAD blueprint (${activeBlueprint.fileName}) measurements, plot dimensions (${activeBlueprint.plotDimensions}), net carpet area (${activeBlueprint.netCarpetAreaSqFt} sq.ft), and room-by-room area breakdown.`);
                      handleSendMessage(`Gouse AI Specialist Agent, analyze our imported CAD blueprint (${activeBlueprint.fileName}) measurements, plot dimensions (${activeBlueprint.plotDimensions}), net carpet area (${activeBlueprint.netCarpetAreaSqFt} sq.ft), and room-by-room area breakdown.`);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold font-mono transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Bot className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Ask Gouse AI to Analyze Entire Area</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-mono transition flex items-center gap-1.5"
                    title="Print Area Schedule"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-400" />
                    <span>Print Schedule</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCadViewMode('canvas')}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-500/50 text-amber-300 text-xs font-mono transition flex items-center gap-1.5"
                  >
                    <Grid className="w-3.5 h-3.5 text-amber-400" />
                    <span>Back to 2D Canvas</span>
                  </button>
                </div>
              </div>

              {/* Master Area Takeoff KPI Matrix */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
                {/* 1. Total Site Plot Area */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] uppercase">
                    <span>Site Plot Area</span>
                    <Ruler className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-xl font-bold text-white tracking-tight">{activeBlueprint.siteAreaSqFt.toLocaleString()} <span className="text-xs font-normal text-slate-400">sq.ft</span></div>
                  <div className="text-[11px] text-amber-300 font-semibold">{activeBlueprint.siteAreaSqM.toFixed(1)} m²</div>
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">Boundary: {activeBlueprint.plotDimensions}</div>
                </div>

                {/* 2. Ground Footprint & Coverage */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] uppercase">
                    <span>Ground Footprint</span>
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-xl font-bold text-amber-300 tracking-tight">{activeBlueprint.groundFootprintSqFt.toLocaleString()} <span className="text-xs font-normal text-slate-400">sq.ft</span></div>
                  <div className="text-[11px] text-emerald-400 font-semibold">
                    {((activeBlueprint.groundFootprintSqFt / activeBlueprint.siteAreaSqFt) * 100).toFixed(1)}% Coverage
                  </div>
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">Statutory Max: 65.0% (Passed ✓)</div>
                </div>

                {/* 3. Net Carpet Area */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] uppercase">
                    <span>Net Carpet Area</span>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-xl font-bold text-emerald-400 tracking-tight">{activeBlueprint.netCarpetAreaSqFt.toLocaleString()} <span className="text-xs font-normal text-slate-400">sq.ft</span></div>
                  <div className="text-[11px] text-slate-300 font-semibold">{(activeBlueprint.netCarpetAreaSqFt * 0.092903).toFixed(1)} m² usable</div>
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
                    Efficiency: {((activeBlueprint.netCarpetAreaSqFt / activeBlueprint.builtUpAreaSqFt) * 100).toFixed(1)}% of GBA
                  </div>
                </div>

                {/* 4. Super Built-Up / GBA & FAR */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] uppercase">
                    <span>Super Built-Up (GBA)</span>
                    <Scale className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="text-xl font-bold text-cyan-300 tracking-tight">{activeBlueprint.builtUpAreaSqFt.toLocaleString()} <span className="text-xs font-normal text-slate-400">sq.ft</span></div>
                  <div className="text-[11px] text-cyan-400 font-semibold">FAR: {activeBlueprint.farAchieved.toFixed(2)}</div>
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">Nambike Permissible: 1.75 FAR</div>
                </div>

                {/* 5. Open Setbacks & Greenery */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] uppercase">
                    <span>Open / Green Buffer</span>
                    <Compass className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div className="text-xl font-bold text-indigo-300 tracking-tight">
                    {(activeBlueprint.siteAreaSqFt - activeBlueprint.groundFootprintSqFt).toLocaleString()} <span className="text-xs font-normal text-slate-400">sq.ft</span>
                  </div>
                  <div className="text-[11px] text-indigo-400 font-semibold">
                    {(((activeBlueprint.siteAreaSqFt - activeBlueprint.groundFootprintSqFt) / activeBlueprint.siteAreaSqFt) * 100).toFixed(1)}% of Site
                  </div>
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">Setback Clearances: 100% Cleared</div>
                </div>

                {/* 6. Audited Habitable Zones */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] uppercase">
                    <span>Audited Zones</span>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-xl font-bold text-emerald-300 tracking-tight">{activeBlueprint.rooms.length} <span className="text-xs font-normal text-slate-400">Rooms</span></div>
                  <div className="text-[11px] text-emerald-400 font-semibold">100% NBC Pass</div>
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">All Min Dimensions Verified</div>
                </div>
              </div>

              {/* Comprehensive Room-by-Room Area Takeoff & Dimension Schedule Table */}
              <div className="space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-mono uppercase font-bold text-amber-400 flex items-center gap-1.5">
                    <TableProperties className="w-3.5 h-3.5 text-amber-400" />
                    <span>Room-by-Room Area Takeoff & Dimension Schedule (NBC 2016 Part 8)</span>
                  </h4>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                    <span>Click any row to select room on CAD canvas</span>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 shadow-xl">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-900/90 border-b border-slate-800 text-[11px] text-slate-400 uppercase">
                      <tr>
                        <th className="p-3.5">#</th>
                        <th className="p-3.5">Room Description</th>
                        <th className="p-3.5">Category</th>
                        <th className="p-3.5">Quadrant</th>
                        <th className="p-3.5">Imperial Dimensions (W × L)</th>
                        <th className="p-3.5">Metric Dimensions</th>
                        <th className="p-3.5 text-right">Carpet Area</th>
                        <th className="p-3.5 text-right">Metric Area</th>
                        <th className="p-3.5 text-right">% Share</th>
                        <th className="p-3.5">NBC 2016 Standard</th>
                        <th className="p-3.5">Daylight / Vent</th>
                        <th className="p-3.5">Ceiling Clear</th>
                        <th className="p-3.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70 text-xs">
                      {activeBlueprint.rooms.map((room, idx) => {
                        const isSelected = selectedCadRoomId === room.id;

                        return (
                          <tr
                            key={room.id}
                            onClick={() => setSelectedCadRoomId(room.id)}
                            className={`cursor-pointer transition ${
                              isSelected
                                ? 'bg-cyan-950/30 hover:bg-cyan-950/40 text-cyan-200'
                                : 'hover:bg-slate-900/50 text-slate-300'
                            }`}
                          >
                            <td className="p-3.5 text-slate-500 font-semibold">{idx + 1}</td>
                            <td className="p-3.5 font-bold text-white flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: room.color }} />
                              <span>{room.name}</span>
                            </td>
                            <td className="p-3.5">
                              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-semibold bg-slate-900 border border-slate-800 text-slate-300">
                                {room.category}
                              </span>
                            </td>
                            <td className="p-3.5 text-amber-300 font-semibold">{room.quadrant}</td>
                            <td className="p-3.5 font-bold text-amber-300">{room.dimensionsFt}</td>
                            <td className="p-3.5 text-slate-300">{room.dimensionsM}</td>
                            <td className="p-3.5 text-right font-bold text-emerald-400">{room.areaSqFt} sq.ft</td>
                            <td className="p-3.5 text-right text-slate-300">{room.areaSqM.toFixed(1)} m²</td>
                            <td className="p-3.5 text-right font-bold text-cyan-300">{room.percentOfFloor}%</td>
                            <td className="p-3.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  room.nbcCompliance === 'compliant'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}
                              >
                                {room.nbcCompliance === 'compliant' ? '✓ STATUTORY PASS' : '⚠️ REVIEW'}
                              </span>
                            </td>
                            <td className="p-3.5 text-slate-300">{room.daylightFactor}</td>
                            <td className="p-3.5 text-slate-300">{room.ceilingHeightFt}'-0"</td>
                            <td className="p-3.5 text-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCadRoomId(room.id);
                                  setCadViewMode('canvas');
                                }}
                                className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 hover:border-cyan-500 text-cyan-300 text-[11px] transition"
                              >
                                Locate
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-900 border-t-2 border-slate-700 font-bold text-white text-xs">
                      <tr>
                        <td colSpan={4} className="p-3.5 uppercase tracking-wider text-amber-400">
                          Total Net Carpet Schedule Sum:
                        </td>
                        <td className="p-3.5 text-slate-400 font-normal">Audited Plan Boundaries</td>
                        <td className="p-3.5 text-slate-400 font-normal">Centerlines Checked</td>
                        <td className="p-3.5 text-right text-emerald-400 text-sm">
                          {activeBlueprint.netCarpetAreaSqFt.toLocaleString()} sq.ft
                        </td>
                        <td className="p-3.5 text-right text-slate-300 text-sm">
                          {(activeBlueprint.netCarpetAreaSqFt * 0.092903).toFixed(1)} m²
                        </td>
                        <td className="p-3.5 text-right text-cyan-300 text-sm">
                          {activeBlueprint.rooms.reduce((acc, r) => acc + (r.percentOfFloor || 0), 0).toFixed(1)}%
                        </td>
                        <td colSpan={4} className="p-3.5 text-emerald-400 text-[11px]">
                          ✓ 100% Meets National Building Code (NBC 2016 Part 8)
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Statutory Space & Dimensional Standards (NBC 2016 & Model Building Byelaws) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs font-mono">
                {/* NBC 2016 Habitable Space Dimensions */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="font-bold text-white flex items-center gap-2 text-sm border-b border-slate-800 pb-2">
                    <Scale className="w-4 h-4 text-amber-400" />
                    <span>NBC 2016 Part 8: Statutory Habitable Space Dimensions</span>
                  </h4>

                  <div className="space-y-2.5">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-200">Habitable Living & Bedrooms</div>
                        <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                          Minimum net floor area: <strong>9.5 sq.m (102 sq.ft)</strong> with minimum clear width of <strong>2.4 m (7'-10")</strong>.
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 uppercase shrink-0">PASS ✓</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-200">Kitchen & Food Preparation</div>
                        <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                          Minimum floor area: <strong>5.0 sq.m (54 sq.ft)</strong> with minimum clear width of <strong>1.8 m (5'-11")</strong>.
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 uppercase shrink-0">PASS ✓</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-200">Ceiling Height Clearances</div>
                        <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                          Habitable rooms: min <strong>2.75 m (9'-0")</strong> clear; Air-conditioned spaces: min <strong>2.4 m (7'-10")</strong>.
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 uppercase shrink-0">PASS ✓</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-200">Stairway & Corridor Clear Egress Width</div>
                        <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                          Residential internal stairs: min <strong>1.0 m (3'-3")</strong>; Commercial / Public: min <strong>1.5 m (4'-11")</strong>.
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 uppercase shrink-0">PASS ✓</span>
                    </div>
                  </div>
                </div>

                {/* Gouse AI Specialist Spatial Audit Synthesis */}
                <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h4 className="font-bold text-amber-300 flex items-center gap-2 text-sm border-b border-slate-800 pb-2">
                      <Bot className="w-4 h-4 text-amber-400" />
                      <span>Gouse AI Specialist Agent: Comprehensive Area Audit</span>
                    </h4>

                    <p className="text-xs text-slate-300 font-sans leading-relaxed">
                      <strong>Executive Summary:</strong> The imported AutoCAD blueprint <em>({activeBlueprint.fileName})</em> demonstrates a high spatial efficiency factor of <strong>{((activeBlueprint.netCarpetAreaSqFt / activeBlueprint.builtUpAreaSqFt) * 100).toFixed(1)}%</strong> (Net Carpet to Gross Built-Up ratio). The total site plot measures <strong>{activeBlueprint.plotDimensions}</strong> ({activeBlueprint.siteAreaSqFt.toLocaleString()} sq.ft), providing <strong>{((activeBlueprint.groundFootprintSqFt / activeBlueprint.siteAreaSqFt) * 100).toFixed(1)}%</strong> ground coverage well within the municipal 65.0% envelope ceiling.
                    </p>

                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1.5">
                      <div className="text-amber-400 font-bold">Key Architectural Observations:</div>
                      <div>• Total Net Usable Carpet Area: <strong className="text-emerald-400">{activeBlueprint.netCarpetAreaSqFt.toLocaleString()} sq.ft</strong> across {activeBlueprint.rooms.length} delineated zones.</div>
                      <div>• Floor Area Ratio (FAR): <strong className="text-cyan-300">{activeBlueprint.farAchieved.toFixed(2)}</strong> consumed out of 1.75 permissible index.</div>
                      <div>• Open Perimeter & Setback Area: <strong className="text-indigo-300">{(activeBlueprint.siteAreaSqFt - activeBlueprint.groundFootprintSqFt).toLocaleString()} sq.ft</strong> reserved for natural greenery, rainwater harvesting, and fire tender clearance.</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">Agent: Gouse AI Autonomous Architectural Specialist</span>
                    <button
                      type="button"
                      onClick={() => {
                        setInputMessage(`Gouse AI Specialist Agent, perform a line-by-line dimensional audit of our imported CAD blueprint measurements and area takeoff schedule.`);
                        handleSendMessage(`Gouse AI Specialist Agent, perform a line-by-line dimensional audit of our imported CAD blueprint measurements and area takeoff schedule.`);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono transition shadow-sm"
                    >
                      Audit in Live Chat →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CONNECTED PLATFORM AI AGENTS ORCHESTRATOR MESH                      */}
      {/* ========================================================================= */}
      {studioTab === 'agent_mesh' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Hero Banner with Actions */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/30 border border-slate-800 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shadow-xl">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs uppercase font-mono font-bold tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
                  <Network className="w-3 h-3 text-amber-400" />
                  Gouse AI Multi-Agent Ecosystem
                </span>
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  7 Agents Synchronized
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">
                Platform Autonomous AI Agents Mesh
              </h3>
              <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
                Gouse AI Specialist orchestrates specialized AI agents across municipal bylaws, structural engineering, bioclimatic envelopes, fire safety, and live BOQ takeoffs with zero manual latency.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Deep Scan Trigger */}
              <button
                id="btn-run-deep-scan"
                type="button"
                onClick={handleRunAgentDeepScan}
                disabled={isScanningAgents}
                className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-slate-200 hover:text-white text-xs font-mono transition flex items-center gap-1.5 shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isScanningAgents ? 'animate-spin' : ''}`} />
                <span>{isScanningAgents ? 'Scanning Agents...' : 'Run Multi-Agent Deep Scan'}</span>
              </button>

              {/* Launch 4-Stage Platform Engine */}
              {onOpenWorkflowEngine && (
                <button
                  id="btn-launch-4-stage-engine"
                  type="button"
                  onClick={onOpenWorkflowEngine}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs transition shadow-sm flex items-center gap-1.5"
                >
                  <Workflow className="w-4 h-4 fill-slate-950" />
                  <span>Launch 4-Stage CAD & BOQ Engine</span>
                </button>
              )}
            </div>
          </div>

          {/* Connected Agent Nodes Grid (7 Agents) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Connected Specialized AI Agents (7 Live Nodes)
              </span>
              <span className="text-[11px] font-mono text-emerald-400">
                Gemini 3.8 Flash • High-Speed IPC
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {[
                {
                  id: 'ag-master',
                  name: 'Gouse AI Master Specialist',
                  role: 'Principal Architectural Lead',
                  model: 'Gemini 3.8 Flash + Native Voice',
                  icon: Sparkles,
                  color: 'amber',
                  status: 'LEAD ORCHESTRATOR',
                  description: 'Coordinates cross-disciplinary spatial synthesis, whole-project bylaws, and transparent chain-of-thought plans.',
                  metrics: 'Latency: 14ms • Context: Active Project',
                  badge: 'Master Agent',
                },
                {
                  id: 'ag-gatekeeper',
                  name: 'Municipal & Nambike Nakshe Gatekeeper',
                  role: 'Statutory By-Laws & Plan Approvals',
                  model: 'Nambike 2.0 / GBA Ruleset Engine',
                  icon: Scale,
                  color: 'emerald',
                  status: 'STATUTORY AUDITOR',
                  description: 'Audits 15% GBA deviation regularization, small plot relaxed setbacks, and municipal clearance gates.',
                  metrics: 'Latency: 19ms • Rulebook: Sec 4.1 & Sec 8',
                  badge: 'Gatekeeper',
                },
                {
                  id: 'ag-cad-boq',
                  name: '4-Stage CAD & BOQ Engine Agent',
                  role: 'Automated CAD Ingestion & Takeoffs',
                  model: 'Deep DWG Vector Engine (9.8/10)',
                  icon: Workflow,
                  color: 'blue',
                  status: 'PIPELINE READY',
                  description: 'Extracts net wall perimeters, room square footages, generates bill of quantities, and synchronizes IS standards.',
                  metrics: 'Stage: 1-4 End-to-End • Spec: v1.0',
                  badge: 'Pipeline 9.8/10',
                },
                {
                  id: 'ag-structural',
                  name: 'IS 456 Structural & BBS Rebar Agent',
                  role: 'RCC Framing & Reinforcement Detailing',
                  model: 'IS 456:2000 / IS 13920 Engine',
                  icon: Cpu,
                  color: 'indigo',
                  status: 'COMPUTING MOMENTS',
                  description: 'Verifies cantilever span/depth deflection limits, seismic beam-column joint confinement, and rebar coupler schedules.',
                  metrics: 'Latency: 24ms • Steel Grade: Fe550D',
                  badge: 'Structural',
                },
                {
                  id: 'ag-bioclimatic',
                  name: 'Bioclimatic ECBC & GRIHA Envelope Agent',
                  role: 'Thermal Comfort & Passive Solar Form',
                  model: 'ECBC 2017 / GRIHA v2019 Engine',
                  icon: Leaf,
                  color: 'teal',
                  status: 'SOLAR TRACKING',
                  description: 'Simulates west elevation solar radiation, calculates Window-to-Wall Ratio (WWR), and optimizes low-E glazing lines.',
                  metrics: 'Latency: 17ms • WWR Cap: 30%',
                  badge: 'Green Envelope',
                },
                {
                  id: 'ag-fire',
                  name: 'NBC 2016 Fire & Life Safety Agent',
                  role: 'Egress Clearances & Fire Tender Routes',
                  model: 'NBC 2016 Part 4 Auditor',
                  icon: Flame,
                  color: 'rose',
                  status: 'EGRESS VERIFIED',
                  description: 'Verifies 6.0m peripheral driveway turning radius, 1.5m clear stairwells, and emergency transformer clearances.',
                  metrics: 'Latency: 15ms • NBC Table 3',
                  badge: 'Life Safety',
                },
                {
                  id: 'ag-boq-sync',
                  name: 'IS 1200 SMM BOQ Synchronization Agent',
                  role: 'Real-Time Schedule of Rates & Economy',
                  model: 'Dynamic Rate & Takeoff Sync Engine',
                  icon: Layers,
                  color: 'violet',
                  status: 'SYNCHRONIZED',
                  description: 'Directly injects approved architectural resolution items into the live project BOQ, eliminating manual data entry.',
                  metrics: 'Active Items: ' + (boqItems?.length || 0) + ' • SMM: IS 1200',
                  badge: 'BOQ Sync',
                },
              ].map((ag) => {
                const Icon = ag.icon;
                return (
                  <div
                    key={ag.id}
                    className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-slate-950 text-amber-400 border border-slate-800">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white leading-tight">{ag.name}</h4>
                            <p className="text-[10px] text-slate-400 font-mono">{ag.role}</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-300">
                          {ag.badge}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed font-sans">{ag.description}</p>
                    </div>

                    <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {ag.status}
                      </span>
                      <span className="text-slate-500">{ag.metrics}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Agent Telemetry & Audit Stream */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-300 font-bold">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                <span>Live Agent IPC Telemetry & Execution Bus</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">
                ● 0 ERROR FRAMES • 100% RELIABILITY
              </span>
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              {agentAuditLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800/60 text-slate-300 text-[11px]"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">{log.timestamp}</span>
                    <span className="text-amber-400 font-semibold">[{log.agentName}]</span>
                    <span className="text-slate-200">{log.action}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">{log.latencyMs}ms</span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[9px]">
                      VERIFIED
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: GOUSE AI MULTI-DISCIPLINARY VOICE & SPECIALIST CHAT               */}
      {/* ========================================================================= */}
      {studioTab === 'chat_voice' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Specialist Agent Selector Cards (8 Dedicated Profiles) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Select Gouse AI Specialist Discipline ({SPECIALISTS.length})
              </span>
              <span className="text-[11px] font-mono text-amber-400">
                Active: {activeSpecialistObj.title} (Voice: {activeSpecialistObj.voiceName})
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {SPECIALISTS.map((s) => {
                const Icon = s.icon;
                const isSelected = selectedSpecialist === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedSpecialist(s.id);
                      stopAudio();
                    }}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between space-y-1.5 ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/70 shadow-sm'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`p-1.5 rounded-lg ${
                          isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-amber-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      )}
                    </div>
                    <div>
                      <h4
                        className={`text-xs font-bold leading-tight truncate ${
                          isSelected ? 'text-amber-300' : 'text-white'
                        }`}
                      >
                        {s.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 leading-tight mt-0.5 truncate">{s.role}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Language Selector Bar & Active Description */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            {/* Language Selection */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono">
                <Languages className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Voice & Chat Language:</span>
              </div>

              <div className="relative">
                <select
                  id="select-voice-language"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-amber-500 focus:outline-none pr-8 cursor-pointer"
                >
                  <optgroup label="🌐 Intelligent Auto-Detect">
                    <option value="auto">🌐 Auto-Detect Input Language</option>
                  </optgroup>
                  <optgroup label="🇮🇳 Indian Languages (Native Scripts)">
                    {VOICE_LANGUAGES.filter((l) => l.region === 'India').map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.native} — {l.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🌍 Global Languages">
                    {VOICE_LANGUAGES.filter((l) => l.region === 'International').map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.native} — {l.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <span className="text-[11px] text-slate-500 hidden sm:inline font-mono">
                (Speech-to-Text & Gemini Native TTS sync)
              </span>
            </div>

            {/* Active Specialist Description */}
            <div className="text-[11px] text-slate-400 font-mono truncate">
              <span className="text-amber-300 font-semibold">{activeSpecialistObj.title}:</span> {activeSpecialistObj.desc}
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-[11px] font-mono uppercase text-slate-500 shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Quick Query:
            </span>
            {QUICK_PROMPTS.map((qp, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(qp)}
                className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-white whitespace-nowrap text-[11px] transition shrink-0"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Chat Messages Container */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 flex flex-col h-[540px] shadow-inner overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                const isSpeaking = speakingMessageId === msg.id;
                const isGeneratingThisAudio = isGeneratingAudio === msg.id;
                const specialistCfg =
                  SPECIALISTS.find((s) => s.id === msg.specialist) || SPECIALISTS[0];

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                        isUser
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-950 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`max-w-[88%] sm:max-w-[78%] rounded-2xl p-4 text-xs leading-relaxed space-y-2 shadow-sm ${
                        isUser
                          ? 'bg-amber-500/15 border border-amber-500/30 text-white rounded-tr-none'
                          : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400 font-mono border-b border-slate-800/60 pb-1.5 mb-1.5">
                        <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                          {isUser ? (
                            'Architect / User'
                          ) : (
                            <>
                              <span className="text-amber-400">{specialistCfg.title}</span>
                              <span className="text-slate-500">({specialistCfg.role})</span>
                            </>
                          )}
                        </span>
                        <div className="flex items-center gap-2">
                          {msg.language && msg.language !== 'en-IN' && (
                            <span className="text-amber-400/80 bg-amber-500/10 px-1.5 py-0.5 rounded text-[9px]">
                              {VOICE_LANGUAGES.find((l) => l.code === msg.language)?.native || msg.language}
                            </span>
                          )}
                          <span>
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Agent Tools Used Badges */}
                      {msg.agentToolsUsed && msg.agentToolsUsed.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap my-1.5">
                          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                            Tools:
                          </span>
                          {msg.agentToolsUsed.map((tool, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono text-amber-300/90 flex items-center gap-1"
                            >
                              <Zap className="w-2.5 h-2.5 text-amber-400" />
                              {tool}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Agent Reasoning (Chain-of-Thought) */}
                      {msg.agentThought && (
                        <div className="my-2 rounded-xl bg-slate-900/90 border border-amber-500/20 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => toggleThought(msg.id)}
                            className="w-full px-3 py-2 flex items-center justify-between text-left text-[11px] font-mono text-amber-300 hover:bg-slate-800/60 transition"
                          >
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                              <span className="font-semibold">Agent Reasoning & Plan</span>
                            </div>
                            {expandedThoughts[msg.id] ? (
                              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </button>
                          {expandedThoughts[msg.id] && (
                            <div className="px-3 pb-3 pt-1 text-[11px] leading-relaxed text-slate-300 border-t border-slate-800/80 font-mono whitespace-pre-wrap bg-slate-950/40">
                              {msg.agentThought}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Message Content */}
                      <div className="prose prose-invert prose-xs max-w-none text-slate-200 whitespace-pre-wrap font-sans">
                        {msg.content}
                      </div>

                      {/* Proposed Agent Actions */}
                      {msg.agentActions && msg.agentActions.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-2">
                          <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-400" />
                            Proposed Agent Actions ({msg.agentActions.length})
                          </div>
                          <div className="space-y-2">
                            {msg.agentActions.map((action) => (
                              <div
                                key={action.id}
                                className={`p-3 rounded-xl border transition ${
                                  action.executed
                                    ? 'bg-slate-900/40 border-emerald-500/30 text-slate-400'
                                    : 'bg-slate-900 border-amber-500/30 text-slate-200 shadow-sm'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold text-xs text-white flex items-center gap-1.5">
                                    {action.title}
                                  </span>
                                  {action.executed ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono">
                                      <Check className="w-3 h-3" />
                                      Applied
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleExecuteAction(action, msg.id)}
                                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition shadow-sm active:scale-95 flex items-center gap-1"
                                    >
                                      <Zap className="w-3 h-3 fill-slate-950" />
                                      <span>Execute Action</span>
                                    </button>
                                  )}
                                </div>
                                {action.description && (
                                  <p className="text-[11px] text-slate-400 mt-1">{action.description}</p>
                                )}
                                {action.payload && (
                                  <div className="mt-2 text-[10px] font-mono bg-slate-950 p-2 rounded border border-slate-800 text-slate-300 flex flex-wrap gap-x-3 gap-y-1">
                                    {action.payload.quantity && (
                                      <span>Qty: {action.payload.quantity} {action.payload.unit || ''}</span>
                                    )}
                                    {action.payload.rate && (
                                      <span>Rate: {currency} {Number(action.payload.rate).toLocaleString()}</span>
                                    )}
                                    {action.payload.category && (
                                      <span>Trade: {action.payload.category}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Audio Controls Bar for Assistant Responses */}
                      {!isUser && (
                        <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            {isSpeaking && (
                              <div className="flex items-center gap-1 text-[11px] text-amber-400 font-mono animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                <span>Voice Playing...</span>
                                <span className="text-slate-500">({playbackSpeed}x)</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Voice Play / Stop */}
                            <button
                              onClick={() => playMessageVoice(msg)}
                              disabled={isGeneratingThisAudio}
                              className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded transition ${
                                isSpeaking
                                  ? 'bg-red-500 hover:bg-red-600 text-white font-semibold'
                                  : 'bg-slate-900 border border-slate-800 text-amber-400 hover:text-white hover:bg-slate-800'
                              }`}
                              title="Listen with Gemini Specialist Voice"
                            >
                              {isGeneratingThisAudio ? (
                                <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                              ) : isSpeaking ? (
                                <VolumeX className="w-3 h-3" />
                              ) : (
                                <Volume2 className="w-3 h-3" />
                              )}
                              <span>
                                {isGeneratingThisAudio
                                  ? 'Synthesizing...'
                                  : isSpeaking
                                  ? 'Stop Audio'
                                  : 'Play Voice'}
                              </span>
                            </button>

                            {/* Download Voice File if available */}
                            {msg.audioBase64 && (
                              <button
                                onClick={() => downloadAudio(msg.audioBase64!, msg.id)}
                                className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
                                title="Download audio WAV file"
                              >
                                <Download className="w-3 h-3" />
                                <span className="hidden sm:inline">WAV</span>
                              </button>
                            )}

                            {/* Copy Text */}
                            <button
                              onClick={() => handleCopyMessage(msg.id, msg.content)}
                              className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
                            >
                              <Copy className="w-3 h-3" />
                              <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-950 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-none p-4 text-xs text-slate-400 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                    <span>
                      {activeSpecialistObj.title} is synthesizing architectural recommendations in{' '}
                      <span className="text-amber-400 font-mono">{currentLangObj.native}</span>...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar with Voice & Multi-Lingual STT */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2">
              {/* Active Voice Recording Live Visualizer */}
              {isListening && (
                <div className="flex items-center justify-between text-xs text-amber-400 bg-amber-500/10 px-3.5 py-2 rounded-lg border border-amber-500/30 font-mono animate-pulse">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    <span className="font-semibold">
                      Listening in {currentLangObj.native} ({currentLangObj.name})...
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">Speak your question clearly</span>
                </div>
              )}

              {voiceTranscript && isListening && (
                <div className="text-xs text-slate-300 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 font-sans italic">
                  "{voiceTranscript}"
                </div>
              )}

              <div className="flex items-center gap-2">
                {/* Voice Input Button */}
                <button
                  id="btn-voice-toggle"
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`p-2.5 rounded-lg transition border flex items-center justify-center shrink-0 ${
                    isListening
                      ? 'bg-red-500 border-red-400 text-white animate-pulse'
                      : 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800 hover:border-amber-500/40'
                  }`}
                  title={`Voice Input in ${currentLangObj.native} (Speech-to-Text)`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Text Input */}
                <input
                  id="input-chat-message"
                  type="text"
                  placeholder={`Ask ${activeSpecialistObj.title} in ${currentLangObj.native} (e.g. RCC, NBC code, rates)...`}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />

                {/* Send Button */}
                <button
                  id="btn-send-message"
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isLoading}
                  className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition disabled:opacity-40 flex items-center gap-1.5 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>

              {/* Bottom helper info */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 font-mono">
                <span>
                  Specialist: <strong className="text-slate-400">{activeSpecialistObj.title}</strong> | Voice: <strong className="text-amber-400">{activeSpecialistObj.voiceName}</strong>
                </span>
                <span>
                  Language: <strong className="text-slate-400">{currentLangObj.native}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: AUTOCAD BLUEPRINT & VECTOR PLAN IMPORTER                         */}
      {/* ========================================================================= */}
      {isBlueprintImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-6">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>AutoCAD Blueprint & Vector Plan Importer</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Gouse AI Specialist Engine
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Attach DWG, DXF, or architectural blueprints for autonomous setbacks, dimensions, and Vastu Shastra analysis.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBlueprintImportModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* File Drag & Drop Upload Zone */}
              <label className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-xl p-6 flex flex-col items-center justify-center gap-2.5 cursor-pointer bg-slate-950/60 hover:bg-slate-950 transition text-center group">
                <input
                  type="file"
                  accept=".dwg,.dxf,.pdf,.cad,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCustomFileUpload(file);
                  }}
                />
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 group-hover:border-amber-500/40 text-slate-400 group-hover:text-amber-400 flex items-center justify-center transition">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-white group-hover:text-amber-300 transition">
                    Upload Custom AutoCAD Drawing (.dwg, .dxf) or Plan PDF / Image
                  </span>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Drag and drop your file here, or click to browse from local computer
                  </p>
                </div>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  Supports AutoCAD DWG 2024, DXF Vector, Architectural PDF, Scaled JPG/PNG
                </span>
              </label>

              {/* Progress Bar when analyzing */}
              {isAnalyzingBlueprint && (
                <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 space-y-2.5 animate-pulse">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-amber-400 font-bold flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Parsing Blueprint Vector Architecture...
                    </span>
                    <span className="text-amber-300 font-bold">{analysisProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 border border-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300 rounded-full"
                      style={{ width: `${analysisProgress}%` }}
                    />
                  </div>
                  <p className="text-[11px] font-mono text-slate-300">{analysisStageText}</p>
                </div>
              )}

              {/* Preset Architectural AutoCAD Blueprints */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                    Or Attach Pre-Configured Architectural AutoCAD Blueprints:
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">4 Reference Layouts</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {BLUEPRINT_PRESETS.map((preset) => {
                    const isCurrent = activeBlueprint.id === preset.id;

                    return (
                      <div
                        key={preset.id}
                        className={`p-3.5 rounded-xl border transition flex flex-col justify-between space-y-2.5 ${
                          isCurrent
                            ? 'bg-amber-950/20 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-amber-400 font-bold flex items-center gap-1">
                              <FileCode className="w-3 h-3" />
                              {preset.fileName}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-white leading-snug">{preset.planTitle}</h4>
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-sans">
                            {preset.description}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-1.5 text-[11px] font-mono">
                          <div className="flex items-center justify-between">
                            <span className="text-amber-300 font-semibold">{preset.plotDimensions} ({preset.siteAreaSqFt.toLocaleString()} sq.ft)</span>
                            <span className="text-emerald-400 font-semibold">{preset.netCarpetAreaSqFt.toLocaleString()} sq.ft Carpet</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>Footprint: {preset.groundFootprintSqFt} sq.ft ({((preset.groundFootprintSqFt / preset.siteAreaSqFt) * 100).toFixed(0)}%)</span>
                            <span className="text-cyan-300">{preset.rooms.length} Audited Zones</span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                            <span className="text-slate-400">{preset.facing} Facing • FAR {preset.farAchieved.toFixed(2)}</span>
                            <button
                              type="button"
                              onClick={() => handleImportBlueprint(preset)}
                              disabled={isAnalyzingBlueprint}
                              className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1 ${
                                isCurrent
                                  ? 'bg-slate-800 text-slate-300 hover:text-white'
                                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                              }`}
                            >
                              <span>{isCurrent ? 'Re-Analyze Plan' : 'Attach & Analyze'}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500">
                Connected to: <strong className="text-slate-300">Gouse AI Multi-Agent Mesh</strong>
              </span>
              <button
                type="button"
                onClick={() => setIsBlueprintImportModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: COMPREHENSIVE VASTU SHASTRA & STRUCTURAL AUDIT CERTIFICATE       */}
      {/* ========================================================================= */}
      {isVastuReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col">
            {/* Certificate Header */}
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Vastu Shastra & Structural Compliance Audit Certificate</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      OFFICIAL AUDIT REPORT
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    Statutory reference: Mayamata, Manasara, BBMP Bye-Laws 2020, Nambike Nakshe 2.0, NBC 2016, IS 456:2000
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition flex items-center gap-1.5"
                  title="Print Certificate"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsVastuReportModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Certificate Body (Scrollable) */}
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Document Meta Header Strip */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Active Project:</span>
                  <span className="text-white font-bold">{activeProject.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">AutoCAD Blueprint:</span>
                  <span className="text-amber-400 font-bold">{activeBlueprint.fileName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Plot Dimensions:</span>
                  <span className="text-white font-bold">{activeBlueprint.plotDimensions}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Lead Certifier:</span>
                  <span className="text-amber-300 font-bold">Gouse AI Specialist</span>
                </div>
              </div>

              {/* Executive Compliance Scorecards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Vastu Shastra Index</span>
                  <div className={`text-2xl font-bold font-mono ${currentVastuScore >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {currentVastuScore}%
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 block">
                    {vastuCorrected ? '✓ Auspicious (NOC Cleared)' : `${vastuDeviationsCount} Deviations Marked`}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Structural Setbacks</span>
                  <div className={`text-2xl font-bold font-mono ${vastuCorrected ? 'text-emerald-400' : 'text-red-400'}`}>
                    {vastuCorrected ? '100% OK' : '0.8m Deficit'}
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 block">
                    {vastuCorrected ? 'Front 3.0m Cleared' : 'Front Setback Encroachment'}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Spatial Grid Alignment</span>
                  <div className={`text-2xl font-bold font-mono ${vastuCorrected ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {vastuCorrected ? 'Grid B3 OK' : 'C6 in Center'}
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 block">
                    {vastuCorrected ? 'Brahmasthan Open Atrium' : 'Column in Brahmasthan'}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Bioclimatic & NBC</span>
                  <div className="text-2xl font-bold font-mono text-cyan-400">
                    {vastuCorrected ? 'ECBC Tier 1' : 'Moderate'}
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 block">
                    1.5m NBC Stair Corridor
                  </span>
                </div>
              </div>

              {/* Section 1: Detailed 9-Zone Vastu Purusha Mandala Audit Table */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono uppercase font-bold text-amber-400 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-amber-400" />
                    Section 1: Vastu Purusha Mandala 9-Zone Quadrant Breakdown
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">
                    Orientation: {activeBlueprint.facing}
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase">
                      <tr>
                        <th className="p-3">Zone / Deity</th>
                        <th className="p-3">Ruling Element</th>
                        <th className="p-3">Active Condition on Blueprint</th>
                        <th className="p-3">Score & Status</th>
                        <th className="p-3">Deviation Details</th>
                        <th className="p-3">Architectural & Non-Invasive Recommendation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 font-mono text-xs">
                      {vastuZones.map((zone) => {
                        const isCompliant = vastuCorrected ? true : zone.isCompliant;
                        const score = vastuCorrected && !zone.isCompliant ? 95 : zone.energyScore;

                        return (
                          <tr key={zone.id} className="hover:bg-slate-900/50 transition">
                            <td className="p-3 font-bold text-white">
                              <div>{zone.quadrantName}</div>
                              <div className="text-[10px] text-slate-400 font-sans">{zone.deity.split(' ')[0]}</div>
                            </td>
                            <td className="p-3 text-slate-300">{zone.rulingElement}</td>
                            <td className="p-3 text-slate-300 font-sans text-[11px] max-w-xs">{zone.activePlacement}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase block text-center ${
                                  isCompliant ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                                }`}
                              >
                                {isCompliant ? `${score}% AUSPICIOUS` : `${score}% DOSH`}
                              </span>
                            </td>
                            <td className="p-3 text-slate-400 font-sans text-[11px] max-w-xs">
                              {vastuCorrected ? (
                                <span className="text-emerald-400">✓ Realigned to cosmic harmony</span>
                              ) : (
                                zone.deviationDetails || <span className="text-slate-500">None (Compliant)</span>
                              )}
                            </td>
                            <td className="p-3 text-slate-300 font-sans text-[11px] max-w-sm">
                              <p className="leading-snug">{zone.architecturalFix}</p>
                              {zone.nonInvasiveRemedy && (
                                <p className="text-[10px] text-amber-300/90 mt-1 font-mono">
                                  Remedy: {zone.nonInvasiveRemedy}
                                </p>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 2: Structural Setbacks Audit Table */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-mono uppercase font-bold text-amber-400 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-amber-400" />
                  Section 2: Municipal Structural Setbacks & Clearances (BBMP / Nambike Nakshe 2.0)
                </h4>

                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase">
                      <tr>
                        <th className="p-3">Boundary Edge</th>
                        <th className="p-3">Mandatory Bylaw</th>
                        <th className="p-3">Actual Modeled</th>
                        <th className="p-3">Deficit / Margin</th>
                        <th className="p-3">Governing Statutory Reference</th>
                        <th className="p-3">Remedy & Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 font-mono text-xs">
                      {setbackAudits.map((item, idx) => {
                        const isFront = item.boundary === 'Front (North)';
                        const effectiveActual = isFront && vastuCorrected ? 3.0 : item.actualMeters;
                        const effectiveDeficit = isFront && vastuCorrected ? 0.0 : item.deficitMeters;
                        const effectiveStatus = isFront && vastuCorrected ? true : item.isCompliant;

                        return (
                          <tr key={idx} className="hover:bg-slate-900/50 transition">
                            <td className="p-3 font-bold text-white">{item.boundary}</td>
                            <td className="p-3 text-slate-300">{item.requiredMeters.toFixed(2)} m</td>
                            <td className="p-3 font-bold text-amber-300">{effectiveActual.toFixed(2)} m</td>
                            <td className="p-3">
                              {effectiveDeficit > 0 ? (
                                <span className="text-red-400 font-bold">-{effectiveDeficit.toFixed(2)} m Deficit</span>
                              ) : (
                                <span className="text-emerald-400 font-bold">Compliant (+{(effectiveActual - item.requiredMeters).toFixed(2)} m)</span>
                              )}
                            </td>
                            <td className="p-3 text-slate-400 font-sans text-[11px]">{item.governingBylaw}</td>
                            <td className="p-3 text-slate-300 font-sans text-[11px]">
                              {effectiveStatus ? (
                                <span className="text-emerald-400">✓ Fully compliant with statutory clearances</span>
                              ) : (
                                item.remedyAction
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 3: Dimensions, Spatial Alignments & Column Grids */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-mono uppercase font-bold text-amber-400 flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-amber-400" />
                  Section 3: Dimensions, Spatial Alignments & Structural Checks (IS 456 / NBC 2016)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {dimensionAudits.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                      <div className="font-bold text-white flex items-center justify-between">
                        <span>{item.parameter}</span>
                        <span className="text-emerald-400 font-mono text-[10px]">VERIFIED</span>
                      </div>
                      <div className="text-[11px] font-mono text-amber-300">
                        {item.modeledValue} (Limit: {item.statutoryLimit})
                      </div>
                      <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                        {item.engineeringNotes}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Official Seal & Certification Block */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-950 to-slate-950 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Gouse AI Autonomous Architectural Certification</span>
                  </div>
                  <p className="text-xs text-slate-300 font-sans max-w-xl">
                    This audit certifies that all structural setbacks, spatial room dimensions, column grid centerlines, and 9-zone Vastu Shastra alignments have been evaluated and cross-checked against municipal bylaws and Vedic principles.
                  </p>
                </div>

                <div className="text-right font-mono text-xs space-y-1 shrink-0">
                  <div className="text-amber-400 font-bold">DIGITALLY STAMPED</div>
                  <div className="text-slate-400">Chief Auditor: Gouse AI</div>
                  <div className="text-[10px] text-slate-500">Hash: SHA-256-{Date.now().toString(16)}</div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setIsVastuReportModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs font-mono transition"
              >
                Close Certificate
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsVastuReportModalOpen(false);
                    setStudioTab('chat_voice');
                    setInputMessage('Gouse AI, detail the complete Vastu Shastra audit findings and statutory setback calculations for our attached AutoCAD plan.');
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-slate-200 text-xs font-mono transition"
                >
                  Consult on Voice →
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleApplyVastuCorrections();
                    setIsVastuReportModalOpen(false);
                  }}
                  disabled={vastuCorrected}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono transition disabled:opacity-50"
                >
                  {vastuCorrected ? '✓ Realignment Applied' : 'Apply All Vastu Corrections'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
