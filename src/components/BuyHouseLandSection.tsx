import React, { useState } from 'react';
import {
  Building,
  Home,
  MapPin,
  Compass,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Phone,
  MessageSquare,
  Calculator,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Layers,
  Check,
  X,
  Upload,
  Image as ImageIcon,
  DollarSign,
  TrendingUp,
  Percent,
  Award,
  Clock,
  Eye,
  FileText,
  BadgeCheck,
  Tag,
  Share2,
  HelpCircle,
  PlusCircle,
  Landmark,
  Map,
  Users,
} from 'lucide-react';
import { CurrencyCode, formatCurrency } from '../utils/formatters';

// Local High-Resolution Project Assets
import villaExteriorImg from '../assets/images/bangalore_house_exterior_1790170528532.jpg';
import siteFramingImg from '../assets/images/bangalore_builder_proj1_1790170892084.jpg';
import villaElevationImg from '../assets/images/bangalore_builder_proj2_1790170907606.jpg';
import columnGridImg from '../assets/images/bangalore_builder_proj3_1790170920758.jpg';
import courtyardInteriorImg from '../assets/images/pg_dining_lounge_1790170229065.jpg';
import masterSuiteImg from '../assets/images/pg_bedroom_suite_1790170216460.jpg';
import apartmentTowerImg from '../assets/images/mantri_premero_tower_1790170972037.jpg';
import pgTerraceImg from '../assets/images/bangalore_pg_terrace_1790170513465.jpg';

const floorVillaImg = villaElevationImg;

export interface BuyHouseItem {
  id: string;
  title: string;
  category: 'Luxury Villa' | 'Penthouse' | 'Independent House' | 'Builder Floor' | 'Gated Apartment';
  bhk: string;
  carpetAreaSqFt: number;
  superBuiltUpSqFt: number;
  price: number;
  pricePerSqFt: number;
  location: string;
  zone: string;
  facingVastu: string;
  possessionStatus: 'Ready to Move' | 'Under Construction (Handover 2026)' | 'Brand New Handover';
  reraId: string;
  khata: 'BBMP A-Khata' | 'BDA Allotment' | 'E-Khata Verified';
  featuredImage: string;
  galleryImages: string[];
  keyHighlights: string[];
  amenities: string[];
  ownerOrBuilder: string;
  contactPhone: string;
  coordinates?: string;
}

export interface LandPlotItem {
  id: string;
  title: string;
  plotType: 'Residential Villa Plot' | 'BDA Approved Allotment' | 'Commercial Land Parcel' | 'Farmland / Farmhouse Plot';
  dimension: string; // e.g. "30 x 40" or "40 x 60"
  plotAreaSqFt: number;
  price: number;
  pricePerSqFt: number;
  location: string;
  zone: string;
  facingVastu: string;
  approvalAuthority: 'BDA Approved' | 'BIAAPA / DTCP' | 'BMRDA' | 'Converted Commercial';
  roadWidthFt: number;
  boundaryWall: boolean;
  waterBescomConnected: boolean;
  clearTitleYears: number; // e.g. 30 years EC
  featuredImage: string;
  keyHighlights: string[];
  idealFor: string;
  ownerOrBroker: string;
  contactPhone: string;
}

export interface BuyHouseLandSectionProps {
  mode: 'buy_house' | 'land_plot' | 'sell_property';
  currency?: CurrencyCode;
}

export const BuyHouseLandSection: React.FC<BuyHouseLandSectionProps> = ({
  mode,
  currency = 'INR',
}) => {
  // -------------------------------------------------------------
  // INITIAL BUY HOUSES DATA
  // -------------------------------------------------------------
  const [houseListings, setHouseListings] = useState<BuyHouseItem[]>([
    {
      id: 'house-1',
      title: 'The Palm Crest Biophilic 4BHK Luxury Villa',
      category: 'Luxury Villa',
      bhk: '4 BHK Duplex Villa + Maid Suite',
      carpetAreaSqFt: 3450,
      superBuiltUpSqFt: 3850,
      price: 28500000,
      pricePerSqFt: 7402,
      location: 'Whitefield EPIP Zone, Near ITPL Main Rd, Bangalore',
      zone: 'whitefield',
      facingVastu: 'East Facing Main Entrance',
      possessionStatus: 'Ready to Move',
      reraId: 'PRM/KA/RERA/1251/446/PR/190822/002812',
      khata: 'BBMP A-Khata',
      featuredImage: villaExteriorImg,
      galleryImages: [villaExteriorImg, courtyardInteriorImg, masterSuiteImg, pgTerraceImg],
      keyHighlights: [
        'Private heated plunge pool and biophilic courtyard garden',
        'NBC 2016 solar-passive daylit interiors with teak louvers',
        '100% Vastu compliance certified by Ar. S. Gouse Studio',
        '5 kW rooftop solar PV system installed with net-metering',
      ],
      amenities: ['Private Pool', '2 Car Garage', 'Solar Inverter', 'Italian Marble', 'Home Automation', 'Clubhouse Access'],
      ownerOrBuilder: 'Prestige & Gouse Turnkey Estates',
      contactPhone: '+91 80739 47241',
    },
    {
      id: 'house-2',
      title: 'Indiranagar 100ft Skyline 3BHK Penthouse',
      category: 'Penthouse',
      bhk: '3 BHK Duplex Penthouse',
      carpetAreaSqFt: 2350,
      superBuiltUpSqFt: 2650,
      price: 21000000,
      pricePerSqFt: 7924,
      location: 'Near 100 Feet Rd & Defence Colony, Indiranagar, Bangalore',
      zone: 'indiranagar',
      facingVastu: 'North-East Corner',
      possessionStatus: 'Ready to Move',
      reraId: 'PRM/KA/RERA/1251/310/PR/210419/004050',
      khata: 'BBMP A-Khata',
      featuredImage: apartmentTowerImg,
      galleryImages: [apartmentTowerImg, masterSuiteImg, pgTerraceImg],
      keyHighlights: [
        '900 sq.ft wrap-around private rooftop skydeck with city panorama',
        'Direct elevator penthouse access with biometric digital locking',
        'Designer German Poggenpohl kitchen with Miele appliances',
        '2 Covered basement car parking slots with EV charger point',
      ],
      amenities: ['Private Skydeck', 'Biometric Lift', 'EV Charger', '24/7 DG Backup', 'Acoustic Glazing'],
      ownerOrBuilder: 'Private Owner Direct (0% Brokerage)',
      contactPhone: '+91 80739 47241',
    },
    {
      id: 'house-3',
      title: 'Sector 2 HSR Tech Living 3BHK Independent Floor',
      category: 'Builder Floor',
      bhk: '3 BHK Independent Floor (G+1 Floor)',
      carpetAreaSqFt: 1850,
      superBuiltUpSqFt: 2150,
      price: 17500000,
      pricePerSqFt: 8139,
      location: 'Sector 2, 27th Main Rd, HSR Layout, Bangalore',
      zone: 'hsr',
      facingVastu: 'North Facing (Pooja Room North-East)',
      possessionStatus: 'Brand New Handover',
      reraId: 'PRM/KA/RERA/1251/310/PR/230111/005520',
      khata: 'BDA Allotment',
      featuredImage: floorVillaImg,
      galleryImages: [floorVillaImg, courtyardInteriorImg, villaElevationImg],
      keyHighlights: [
        'Zero common wall construction with 4-side open ventilation',
        'Walking distance to 27th Main startup corridor & cafes',
        'Cauvery water connection + dedicated 15,000L underground sump',
        'Constructed by Ar. S. Gouse Studio with IS 456 M25 design-mix RCC',
      ],
      amenities: ['Cauvery Water', 'Dedicated Sump', 'Car Port', 'CCTV 360', 'Granite Flooring'],
      ownerOrBuilder: 'Gouse Architectural Development',
      contactPhone: '+91 80739 47241',
    },
    {
      id: 'house-4',
      title: 'Koramangala 4th Block Contemporary Bungalow',
      category: 'Independent House',
      bhk: '5 BHK Luxury Bungalow + Home Theatre',
      carpetAreaSqFt: 4300,
      superBuiltUpSqFt: 4850,
      price: 45000000,
      pricePerSqFt: 9278,
      location: '4th Block, 80ft Road, Koramangala, Bangalore',
      zone: 'koramangala',
      facingVastu: 'East Facing Corner Plot',
      possessionStatus: 'Ready to Move',
      reraId: 'PRM/KA/RERA/1251/308/PR/200715/003490',
      khata: 'BBMP A-Khata',
      featuredImage: villaElevationImg,
      galleryImages: [villaElevationImg, courtyardInteriorImg, masterSuiteImg, villaExteriorImg],
      keyHighlights: [
        'Private hydraulic glass elevator connecting all 3 floors',
        'Dedicated 8-seater acoustic Dolby Atmos home theatre suite',
        'Landscaped Japanese Zen courtyard garden with water cascade',
        'Clear title deed with 35-year encumbrance search verified',
      ],
      amenities: ['Glass Elevator', 'Home Cinema', 'Zen Garden', '3 Car Parking', 'Servant Quarters'],
      ownerOrBuilder: 'Direct Developer Handover',
      contactPhone: '+91 80739 47241',
    },
  ]);

  // -------------------------------------------------------------
  // INITIAL LAND & PLOTS DATA
  // -------------------------------------------------------------
  const [plotListings, setPlotListings] = useState<LandPlotItem[]>([
    {
      id: 'plot-1',
      title: 'BDA Approved 30x40 Corner Residential Plot',
      plotType: 'BDA Approved Allotment',
      dimension: '30 ft x 40 ft',
      plotAreaSqFt: 1200,
      price: 14500000,
      pricePerSqFt: 12083,
      location: 'Sector 2, Near 27th Main, HSR Layout, Bangalore',
      zone: 'hsr',
      facingVastu: 'North-East Corner (40ft & 30ft Roads)',
      approvalAuthority: 'BDA Approved',
      roadWidthFt: 40,
      boundaryWall: true,
      waterBescomConnected: true,
      clearTitleYears: 32,
      featuredImage: siteFramingImg,
      keyHighlights: [
        'Direct BDA allottee sale with pristine chain of title documents',
        'Sanctioned for G+3 residential building or commercial co-living',
        'Cauvery water, UGD sanitary line, and underground BESCOM live',
        '0% Brokerage direct facilitation through Ar. S. Gouse Studio',
      ],
      idealFor: 'Independent Luxury Residence or 18-Bed PG Building',
      ownerOrBroker: 'Direct BDA Allottee',
      contactPhone: '+91 80739 47241',
    },
    {
      id: 'plot-2',
      title: 'Devanahalli Airport Corridor 40x60 Gated Villa Plot',
      plotType: 'Residential Villa Plot',
      dimension: '40 ft x 60 ft',
      plotAreaSqFt: 2400,
      price: 8800000,
      pricePerSqFt: 3666,
      location: 'BIAL Express Corridor, Devanahalli, North Bangalore',
      zone: 'devanahalli',
      facingVastu: 'East Facing Vastu Plot',
      approvalAuthority: 'BIAAPA / DTCP',
      roadWidthFt: 50,
      boundaryWall: true,
      waterBescomConnected: true,
      clearTitleYears: 30,
      featuredImage: columnGridImg,
      keyHighlights: [
        '15 minutes drive to Kempegowda International Airport Terminal 2',
        'Gated township with 30,000 sq.ft clubhouse, tennis court & pool',
        'High capital appreciation corridor near upcoming KIADB Tech Park',
        'Underground cabling, sewage treatment plant, and paved sidewalks',
      ],
      idealFor: 'Luxury Weekend Villa or High-Growth Land Investment',
      ownerOrBroker: 'Gouse Eco-Villa Layouts',
      contactPhone: '+91 80739 47241',
    },
    {
      id: 'plot-3',
      title: 'Sarjapur Tech Corridor 1.2 Acre Commercial Land Parcel',
      plotType: 'Commercial Land Parcel',
      dimension: '150 ft Frontage x 350 ft Depth',
      plotAreaSqFt: 52272,
      price: 96000000,
      pricePerSqFt: 1836,
      location: 'Sarjapur Main Road, Near Wipro SEZ Campus, Bangalore',
      zone: 'sarjapur',
      facingVastu: 'North Facing Wide Road Frontage',
      approvalAuthority: 'Converted Commercial',
      roadWidthFt: 80,
      boundaryWall: true,
      waterBescomConnected: true,
      clearTitleYears: 35,
      featuredImage: siteFramingImg,
      keyHighlights: [
        '150 feet high-visibility frontage on 80ft wide Sarjapur highway',
        'Non-agricultural converted commercial A-Khata with industrial NOC',
        'Suitable for IT tech campus, multi-specialty hospital, or co-living',
        'Soil bearing capacity and topographical survey verified by CoA engineer',
      ],
      idealFor: 'Tech Park, Educational Campus, or 200+ Unit Co-Living',
      ownerOrBroker: 'Exclusive Mandate with Ar. S. Gouse',
      contactPhone: '+91 80739 47241',
    },
    {
      id: 'plot-4',
      title: 'Whitefield Inner Circle 50x80 Luxury Corner Plot',
      plotType: 'Residential Villa Plot',
      dimension: '50 ft x 80 ft',
      plotAreaSqFt: 4000,
      price: 31000000,
      pricePerSqFt: 7750,
      location: 'ECC Road, Whitefield (Near ITPL & Metro Station), Bangalore',
      zone: 'whitefield',
      facingVastu: 'North-East Corner Plot',
      approvalAuthority: 'BDA Approved',
      roadWidthFt: 40,
      boundaryWall: true,
      waterBescomConnected: true,
      clearTitleYears: 30,
      featuredImage: columnGridImg,
      keyHighlights: [
        'Quiet leafy residential avenue 800m from Whitefield Metro Station',
        'Fully compound-walled with 3-inch active sweet-water borewell',
        'Surrounded by premium high-net-worth architect-designed villas',
        'Immediate construction sanction available with FAR 2.25',
      ],
      idealFor: 'Custom Designed Turnkey 5BHK Luxury Mansion',
      ownerOrBroker: 'Direct Family Landlord',
      contactPhone: '+91 80739 47241',
    },
  ]);

  // Selected Detail Modal State
  const [selectedHouse, setSelectedHouse] = useState<BuyHouseItem | null>(null);
  const [selectedPlot, setSelectedPlot] = useState<LandPlotItem | null>(null);

  // EMI Calculator State inside House Details
  const [emiLoanAmount, setEmiLoanAmount] = useState<number>(20000000);
  const [emiTenureYears, setEmiTenureYears] = useState<number>(20);
  const [emiInterestRate, setEmiInterestRate] = useState<number>(8.5);

  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [priceRangeFilter, setPriceRangeFilter] = useState<'all' | 'budget' | 'mid' | 'luxury'>('all');

  // -------------------------------------------------------------
  // SELL / LIST PROPERTY ENGINE STATE
  // -------------------------------------------------------------
  const [sellGoal, setSellGoal] = useState<'sell_house' | 'sell_land' | 'rent_house' | 'rent_pg'>('sell_house');
  const [sellTitle, setSellTitle] = useState('');
  const [sellLocality, setSellLocality] = useState('HSR Layout, Bangalore');
  const [sellBhkOrType, setSellBhkOrType] = useState('3 BHK Luxury Villa');
  const [sellAreaSqFt, setSellAreaSqFt] = useState<number>(2400);
  const [sellExpectedPrice, setSellExpectedPrice] = useState<number>(18500000);
  const [sellKhata, setSellKhata] = useState<'A-Khata' | 'B-Khata' | 'BDA' | 'DTCP'>('A-Khata');
  const [sellPhone, setSellPhone] = useState('+91 ');
  const [sellOwnerName, setSellOwnerName] = useState('');
  const [sellNotes, setSellNotes] = useState('');
  const [isValuating, setIsValuating] = useState(false);
  const [valuationResult, setValuationResult] = useState<{
    fairMarketValue: number;
    guidanceValue: number;
    pricePerSqFtAvg: number;
    recommendedRange: string;
    estimatedDaysToTransact: number;
    projectedRentalYield?: string;
  } | null>(null);
  const [listingSuccessMessage, setListingSuccessMessage] = useState<string | null>(null);

  // Instant AI Valuation Engine Handler
  const handleRunAiValuation = () => {
    setIsValuating(true);
    setTimeout(() => {
      setIsValuating(false);
      let baseRate = 7200;
      if (sellLocality.toLowerCase().includes('indiranagar')) baseRate = 9800;
      else if (sellLocality.toLowerCase().includes('hsr')) baseRate = 8100;
      else if (sellLocality.toLowerCase().includes('koramangala')) baseRate = 9500;
      else if (sellLocality.toLowerCase().includes('whitefield')) baseRate = 7400;
      else if (sellLocality.toLowerCase().includes('sarjapur')) baseRate = 6200;
      else if (sellLocality.toLowerCase().includes('devanahalli')) baseRate = 4200;

      const fairValue = sellAreaSqFt * baseRate;
      const guidance = Math.round(fairValue * 0.72);
      const low = Math.round(fairValue * 0.94);
      const high = Math.round(fairValue * 1.08);

      setValuationResult({
        fairMarketValue: fairValue,
        guidanceValue: guidance,
        pricePerSqFtAvg: baseRate,
        recommendedRange: `₹${(low / 10000000).toFixed(2)} Cr - ₹${(high / 10000000).toFixed(2)} Cr`,
        estimatedDaysToTransact: sellKhata === 'A-Khata' || sellKhata === 'BDA' ? 24 : 45,
        projectedRentalYield: '4.8% - 5.4% p.a. capital yield',
      });
    }, 700);
  };

  // Submit Self-Listing Handler
  const handlePublishListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellTitle.trim()) {
      alert('Please enter a property title');
      return;
    }

    if (sellGoal === 'sell_house') {
      const newHouse: BuyHouseItem = {
        id: `user-house-${Date.now()}`,
        title: sellTitle,
        category: 'Independent House',
        bhk: sellBhkOrType,
        carpetAreaSqFt: Math.round(sellAreaSqFt * 0.85),
        superBuiltUpSqFt: sellAreaSqFt,
        price: sellExpectedPrice,
        pricePerSqFt: Math.round(sellExpectedPrice / sellAreaSqFt),
        location: sellLocality,
        zone: 'bangalore',
        facingVastu: 'North/East Vastu Certified',
        possessionStatus: 'Ready to Move',
        reraId: 'Verified Direct Owner Mandate',
        khata: sellKhata === 'BDA' ? 'BDA Allotment' : 'BBMP A-Khata',
        featuredImage: villaExteriorImg,
        galleryImages: [villaExteriorImg, courtyardInteriorImg, masterSuiteImg],
        keyHighlights: [
          'Listed directly by verified property owner with 0% brokerage',
          'Document verification audit conducted by Gouse AI Agent',
          `Prime locality in ${sellLocality} with clear title history`,
          sellNotes || 'Immediate physical inspection available upon appointment',
        ],
        amenities: ['24/7 Security', 'Covered Parking', 'Water Connection', 'Power Backup'],
        ownerOrBuilder: sellOwnerName || 'Verified Private Owner',
        contactPhone: sellPhone || '+91 80739 47241',
      };
      setHouseListings((prev) => [newHouse, ...prev]);
    } else if (sellGoal === 'sell_land') {
      const newPlot: LandPlotItem = {
        id: `user-plot-${Date.now()}`,
        title: sellTitle,
        plotType: sellKhata === 'BDA' ? 'BDA Approved Allotment' : 'Residential Villa Plot',
        dimension: `${Math.round(Math.sqrt(sellAreaSqFt * 0.75))} ft x ${Math.round(Math.sqrt(sellAreaSqFt * 1.33))} ft`,
        plotAreaSqFt: sellAreaSqFt,
        price: sellExpectedPrice,
        pricePerSqFt: Math.round(sellExpectedPrice / sellAreaSqFt),
        location: sellLocality,
        zone: 'bangalore',
        facingVastu: 'East / North Vastu',
        approvalAuthority: sellKhata === 'BDA' ? 'BDA Approved' : 'BIAAPA / DTCP',
        roadWidthFt: 40,
        boundaryWall: true,
        waterBescomConnected: true,
        clearTitleYears: 30,
        featuredImage: siteFramingImg,
        keyHighlights: [
          'Direct Owner Land Listing with zero broker fee',
          `Approved plot in high-growth corridor of ${sellLocality}`,
          'Clear chain of sale deeds and mutation register verified',
          sellNotes || 'Survey stones demarcated with ready boundary fencing',
        ],
        idealFor: 'Custom Luxury Home or Boutique Co-Living Investment',
        ownerOrBroker: sellOwnerName || 'Direct Land Owner',
        contactPhone: sellPhone || '+91 80739 47241',
      };
      setPlotListings((prev) => [newPlot, ...prev]);
    }

    setListingSuccessMessage(
      `Property "${sellTitle}" published successfully to Gouse AI Agent Broker portal with 0% brokerage!`
    );
    setTimeout(() => setListingSuccessMessage(null), 8000);

    // Reset Form
    setSellTitle('');
    setSellNotes('');
  };

  // EMI Monthly Payment Calculator
  const calculateEMI = (principal: number, years: number, ratePercent: number) => {
    const monthlyRate = ratePercent / (12 * 100);
    const months = years * 12;
    const emi =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(emi);
  };

  // -------------------------------------------------------------
  // RENDER: BUY HOUSE CATALOG
  // -------------------------------------------------------------
  if (mode === 'buy_house') {
    const filteredHouses = houseListings.filter((h) => {
      const matchSearch =
        h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.bhk.toLowerCase().includes(searchQuery.toLowerCase());
      const matchZone = zoneFilter === 'all' || h.zone === zoneFilter;
      const matchPrice =
        priceRangeFilter === 'all'
          ? true
          : priceRangeFilter === 'budget'
          ? h.price < 20000000
          : priceRangeFilter === 'mid'
          ? h.price >= 20000000 && h.price <= 30000000
          : h.price > 30000000;
      return matchSearch && matchZone && matchPrice;
    });

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-950 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-2 max-w-2xl text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                BUY HOUSES &amp; LUXURY VILLAS
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
                0% BUYER BROKERAGE
              </span>
              <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[10px] font-mono">
                RERA &amp; A-KHATA AUDITED
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Curated Houses, Designer Penthouses &amp; Turnkey Villas for Sale
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              Direct developer and owner homes architecturally vetted by Ar. S. Gouse Studio. Transparent carpet area pricing, structural IS 456 certification, and instant bank loan approval support.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://wa.me/918073947241?text=Hello%20Ar.%20Gouse,%20I%20am%20interested%20in%20buying%20a%20house%20or%20villa%20in%20Bangalore."
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Direct WhatsApp Inquiry</span>
            </a>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by villa name, locality (Whitefield, HSR, Indiranagar) or BHK..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none w-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Zone Filter */}
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-xl focus:outline-none focus:border-amber-400"
            >
              <option value="all">All Localities</option>
              <option value="whitefield">Whitefield</option>
              <option value="hsr">HSR Layout</option>
              <option value="indiranagar">Indiranagar</option>
              <option value="koramangala">Koramangala</option>
            </select>

            {/* Price Filter */}
            <select
              value={priceRangeFilter}
              onChange={(e) => setPriceRangeFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-xl focus:outline-none focus:border-amber-400"
            >
              <option value="all">All Budgets</option>
              <option value="budget">Under ₹2.00 Cr</option>
              <option value="mid">₹2.00 Cr - ₹3.00 Cr</option>
              <option value="luxury">Luxury Above ₹3.00 Cr</option>
            </select>

            <span className="text-slate-400 font-mono text-[11px] px-2">
              Showing {filteredHouses.length} Properties
            </span>
          </div>
        </div>

        {/* Houses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredHouses.map((house) => {
            const emiEst = calculateEMI(house.price * 0.8, 20, 8.5);
            return (
              <div
                key={house.id}
                className="group rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 transition-all flex flex-col text-left"
              >
                {/* Image Header with Badges */}
                <div className="relative h-64 w-full overflow-hidden bg-slate-950">
                  <img
                    src={house.featuredImage}
                    alt={house.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950/90 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/40 backdrop-blur-sm">
                      {house.category}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-950/90 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/40 backdrop-blur-sm">
                      {house.possessionStatus}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-950/90 text-indigo-300 font-mono text-[10px] font-bold border border-indigo-500/40 backdrop-blur-sm flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-indigo-400" />
                      {house.khata}
                    </span>
                  </div>

                  {/* Bottom Image Info */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <div>
                      <div className="text-xl font-black text-white">
                        {formatCurrency(house.price, currency)}
                      </div>
                      <div className="text-[11px] text-amber-300 font-mono">
                        ₹{house.pricePerSqFt.toLocaleString('en-IN')}/sq.ft • Super Built-up: {house.superBuiltUpSqFt} sq.ft
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-300 font-mono">Est. Loan EMI</div>
                      <div className="text-xs font-bold text-emerald-400 font-mono">
                        ₹{emiEst.toLocaleString('en-IN')}/mo
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-amber-300 transition">
                      {house.title}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span className="truncate">{house.location}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800/80 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400 font-mono">BHK Config</div>
                        <div className="font-semibold text-slate-200 mt-0.5">{house.bhk.split(' ')[0]} BHK</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-mono">Carpet Area</div>
                        <div className="font-semibold text-slate-200 mt-0.5">{house.carpetAreaSqFt} sq.ft</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-mono">Vastu Facing</div>
                        <div className="font-semibold text-emerald-300 mt-0.5 truncate">{house.facingVastu.split(' ')[0]}</div>
                      </div>
                    </div>

                    {/* Highlights bullets */}
                    <div className="space-y-1 pt-1">
                      {house.keyHighlights.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{item}</span>
                        </div>
                      ))}
                    </div>

                    {/* Amenities pills */}
                    <div className="flex flex-wrap gap-1 pt-2">
                      {house.amenities.slice(0, 4).map((amenity, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 border border-slate-800 text-[10px] font-mono"
                        >
                          {amenity}
                        </span>
                      ))}
                      {house.amenities.length > 4 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-950 text-slate-500 border border-slate-800 text-[10px] font-mono">
                          +{house.amenities.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedHouse(house);
                        setEmiLoanAmount(house.price * 0.8);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span>Full Specs &amp; EMI</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <a
                        href={`https://wa.me/918073947241?text=Hello%20Ar.%20Gouse,%20I%20am%20interested%20in%20inspecting%20${encodeURIComponent(house.title)}%20priced%20at%20${formatCurrency(house.price, currency)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs transition"
                        title="Chat on WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>

                      <a
                        href="tel:+918073947241"
                        className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Schedule Visit</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal: House Details & Loan Calculator */}
        {selectedHouse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl text-left">
              <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold">
                      {selectedHouse.category}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono">
                      {selectedHouse.khata}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-mono">
                      RERA: {selectedHouse.reraId}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">{selectedHouse.title}</h2>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>{selectedHouse.location}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedHouse(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Photo Gallery Carousel */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {selectedHouse.galleryImages.map((img, idx) => (
                  <div key={idx} className="h-32 rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                    <img src={img} alt="Gallery" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>

              {/* Technical Specifications */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 font-mono">Total Consideration</div>
                  <div className="text-base font-bold text-amber-300 mt-0.5">
                    {formatCurrency(selectedHouse.price, currency)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-mono">Super Built-up Area</div>
                  <div className="text-base font-bold text-white mt-0.5">{selectedHouse.superBuiltUpSqFt} sq.ft</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-mono">Carpet Area (RERA)</div>
                  <div className="text-base font-bold text-white mt-0.5">{selectedHouse.carpetAreaSqFt} sq.ft</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-mono">Rate per Sq.Ft</div>
                  <div className="text-base font-bold text-sky-400 mt-0.5">
                    ₹{selectedHouse.pricePerSqFt.toLocaleString('en-IN')}/sq.ft
                  </div>
                </div>
              </div>

              {/* All Highlights */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wide font-mono">
                  Architectural &amp; Structural Highlights
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {selectedHouse.keyHighlights.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-slate-200">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Home Loan EMI Calculator */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/50 via-slate-950 to-slate-950 border border-indigo-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                    <Calculator className="w-4 h-4" />
                    <span>Home Loan EMI &amp; Affordability Calculator</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">
                    Est. EMI: ₹{calculateEMI(emiLoanAmount, emiTenureYears, emiInterestRate).toLocaleString('en-IN')} / month
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Loan Amount: {formatCurrency(emiLoanAmount, currency)}
                    </label>
                    <input
                      type="range"
                      min={5000000}
                      max={selectedHouse.price}
                      step={500000}
                      value={emiLoanAmount}
                      onChange={(e) => setEmiLoanAmount(Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Tenure: {emiTenureYears} Years
                    </label>
                    <input
                      type="range"
                      min={5}
                      max={30}
                      step={1}
                      value={emiTenureYears}
                      onChange={(e) => setEmiTenureYears(Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Interest Rate: {emiInterestRate}% p.a.
                    </label>
                    <input
                      type="range"
                      min={7.5}
                      max={12}
                      step={0.1}
                      value={emiInterestRate}
                      onChange={(e) => setEmiInterestRate(Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Direct Booking Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
                <div className="text-xs text-slate-400">
                  <span>Contact Broker Desk: </span>
                  <span className="text-white font-bold">{selectedHouse.contactPhone}</span>
                  <span className="text-emerald-400 ml-2 font-mono">(0% Brokerage)</span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <a
                    href={`https://wa.me/918073947241?text=Hello%20Ar.%20Gouse,%20I%20would%20like%20to%20place%20a%20direct%20purchase%20offer%20on%20${encodeURIComponent(selectedHouse.title)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Make Direct Offer</span>
                  </a>

                  <a
                    href="tel:+918073947241"
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Book Private Viewing</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: LAND & PLOTS CATALOG
  // -------------------------------------------------------------
  if (mode === 'land_plot') {
    const filteredPlots = plotListings.filter((p) => {
      const matchSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.dimension.toLowerCase().includes(searchQuery.toLowerCase());
      const matchZone = zoneFilter === 'all' || p.zone === zoneFilter;
      return matchSearch && matchZone;
    });

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-2 max-w-2xl text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
                <Map className="w-3 h-3 text-emerald-400" />
                LAND &amp; PLOTS COMMAND CENTER
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-mono">
                BDA &amp; DTCP SANCTIONED
              </span>
              <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[10px] font-mono">
                30+ YRS CLEAR ENCUMBRANCE
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Verified Residential Plots, Commercial Land &amp; Villa Layouts
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              Demarcated land parcels with physical boundary walls, verified chain of parent title deeds, Cauvery water, and immediate G+3 construction sanctions across Bangalore’s high-yield tech corridors.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://wa.me/918073947241?text=Hello%20Ar.%20Gouse,%20I%20am%20inquiry%20about%20land%20and%20plots%20for%20sale%20in%20Bangalore."
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Inquire on Land Parcel</span>
            </a>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by plot dimension (30x40, 40x60), locality (HSR, Devanahalli, Sarjapur)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none w-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Locality Filter */}
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-xl focus:outline-none focus:border-emerald-400"
            >
              <option value="all">All Growth Zones</option>
              <option value="hsr">HSR Layout (Sector 2)</option>
              <option value="devanahalli">Devanahalli (Airport Corridor)</option>
              <option value="sarjapur">Sarjapur Main Road</option>
              <option value="whitefield">Whitefield Inner Circle</option>
            </select>

            <span className="text-slate-400 font-mono text-[11px] px-2">
              Showing {filteredPlots.length} Land Assets
            </span>
          </div>
        </div>

        {/* Plots Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredPlots.map((plot) => (
            <div
              key={plot.id}
              className="group rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 transition-all flex flex-col text-left"
            >
              {/* Image Header with Badges */}
              <div className="relative h-60 w-full overflow-hidden bg-slate-950">
                <img
                  src={plot.featuredImage}
                  alt={plot.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                {/* Top Badges */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-950/90 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/40 backdrop-blur-sm">
                    {plot.plotType}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-sky-950/90 text-sky-300 font-mono text-[10px] font-bold border border-sky-500/40 backdrop-blur-sm">
                    {plot.approvalAuthority}
                  </span>
                </div>

                <div className="absolute top-3 right-3">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-950/90 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/40 backdrop-blur-sm flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-amber-400" />
                    {plot.clearTitleYears} Yrs Clear EC
                  </span>
                </div>

                {/* Bottom Plot Pricing Info */}
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                  <div>
                    <div className="text-xl font-black text-white">
                      {formatCurrency(plot.price, currency)}
                    </div>
                    <div className="text-[11px] text-emerald-300 font-mono">
                      ₹{plot.pricePerSqFt.toLocaleString('en-IN')}/sq.ft • {plot.plotAreaSqFt.toLocaleString('en-IN')} sq.ft total
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-slate-300 font-mono">Road Width</div>
                    <div className="text-xs font-bold text-sky-400 font-mono">
                      {plot.roadWidthFt} ft Asphalt Road
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-emerald-300 transition">
                    {plot.title}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="truncate">{plot.location}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800/80 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400 font-mono">Dimension</div>
                      <div className="font-semibold text-slate-200 mt-0.5">{plot.dimension}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-mono">Facing</div>
                      <div className="font-semibold text-emerald-300 mt-0.5 truncate">{plot.facingVastu.split(' ')[0]}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-mono">Boundary Wall</div>
                      <div className="font-semibold text-sky-300 mt-0.5">
                        {plot.boundaryWall ? 'Constructed' : 'Demarcated'}
                      </div>
                    </div>
                  </div>

                  {/* Highlights bullets */}
                  <div className="space-y-1 pt-1">
                    {plot.keyHighlights.slice(0, 2).map((item, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
                    <span className="font-mono text-[11px]">Recommended Use:</span>
                    <span className="font-semibold text-amber-300 text-[11px] truncate">{plot.idealFor}</span>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPlot(plot)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Title &amp; Layout Plan</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <a
                      href={`https://wa.me/918073947241?text=Hello%20Ar.%20Gouse,%20I%20am%20interested%20in%20inspecting%20the%20plot%20${encodeURIComponent(plot.title)}%20priced%20at%20${formatCurrency(plot.price, currency)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs transition"
                      title="Chat on WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </a>

                    <a
                      href="tel:+918073947241"
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Plot Survey Visit</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal: Plot Legal & Dimension Details */}
        {selectedPlot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl text-left">
              <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold">
                      {selectedPlot.plotType}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 text-xs font-mono">
                      {selectedPlot.approvalAuthority}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">{selectedPlot.title}</h2>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>{selectedPlot.location}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPlot(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Photo */}
              <div className="h-60 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
                <img src={selectedPlot.featuredImage} alt="Plot" className="w-full h-full object-cover" />
              </div>

              {/* Land Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 font-mono">Total Price</div>
                  <div className="text-base font-bold text-emerald-300 mt-0.5">
                    {formatCurrency(selectedPlot.price, currency)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-mono">Plot Dimension</div>
                  <div className="text-base font-bold text-white mt-0.5">{selectedPlot.dimension}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-mono">Total Area</div>
                  <div className="text-base font-bold text-white mt-0.5">{selectedPlot.plotAreaSqFt} sq.ft</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-mono">Price per Sq.Ft</div>
                  <div className="text-base font-bold text-sky-400 mt-0.5">
                    ₹{selectedPlot.pricePerSqFt.toLocaleString('en-IN')}/sq.ft
                  </div>
                </div>
              </div>

              {/* Legal & Infrastructure Checklist */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wide font-mono">
                  Verified Legal &amp; Infrastructure Due Diligence
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-300">Encumbrance Certificate (EC):</span>
                    <span className="text-emerald-400 font-bold font-mono">Nil Encumbrance ({selectedPlot.clearTitleYears} Years Verified)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-300">Approach Road Width:</span>
                    <span className="text-white font-bold font-mono">{selectedPlot.roadWidthFt} Feet Asphalted Road</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-300">Vastu Alignment:</span>
                    <span className="text-emerald-300 font-bold">{selectedPlot.facingVastu}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-300">Water &amp; Power Utilities:</span>
                    <span className="text-sky-400 font-bold font-mono">
                      {selectedPlot.waterBescomConnected ? 'Cauvery / Borewell & BESCOM Active' : 'Utility Lines Available at Plot Boundary'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Direct Land Acquisition Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
                <div className="text-xs text-slate-400">
                  <span>Mandate Partner: </span>
                  <span className="text-white font-bold">{selectedPlot.ownerOrBroker}</span>
                  <span className="text-emerald-400 ml-2 font-mono">(0% Brokerage)</span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <a
                    href={`https://wa.me/918073947241?text=Hello%20Ar.%20Gouse,%20I%20would%20like%20to%20review%20the%20legal%20documents%20and%20blueprint%20for%20${encodeURIComponent(selectedPlot.title)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>Request Legal Pack</span>
                  </a>

                  <a
                    href="tel:+918073947241"
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Physical Plot Survey</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: SELL HOUSE / LAND / RENT OUT DESK
  // -------------------------------------------------------------
  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-left">
      {/* Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-950 border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
              <PlusCircle className="w-3 h-3 text-purple-400" />
              SELL HOUSE, LAND &amp; LIST FOR RENT
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
              0% BROKERAGE LISTING
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-mono">
              AI MARKET VALUATION
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Direct Owner &amp; Builder Real Estate Listing Desk
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed font-light">
            List your house for sale, sell land/plots, or rent out floors and PG buildings with zero brokerage commission. Leverage Gouse AI Agent’s autonomous valuation engine to price your asset accurately against recent Bangalore registrar transactions.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://wa.me/918073947241?text=Hello%20Ar.%20Gouse,%20I%20want%20to%20list%20my%20property%20for%20sale%20or%20rent%20with%20zero%20brokerage."
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/20 transition"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Consult Listing Agent</span>
          </a>
        </div>
      </div>

      {listingSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="flex-1 font-medium">{listingSuccessMessage}</div>
        </div>
      )}

      {/* Main Form & Valuation Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Listing Form */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
          <form onSubmit={handlePublishListing} className="space-y-5">
            {/* 1. Transaction Goal Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Step 1: Select Listing Category &amp; Goal
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setSellGoal('sell_house')}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                    sellGoal === 'sell_house'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <Home className="w-4 h-4 text-amber-400" />
                  <span>Sell House / Villa</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSellGoal('sell_land')}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                    sellGoal === 'sell_land'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <Map className="w-4 h-4 text-emerald-400" />
                  <span>Sell Land / Plot</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSellGoal('rent_house')}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                    sellGoal === 'rent_house'
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 shadow-md'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <Building className="w-4 h-4 text-sky-400" />
                  <span>Rent Out House</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSellGoal('rent_pg')}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                    sellGoal === 'rent_pg'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-md'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>Rent PG / Co-Living</span>
                </button>
              </div>
            </div>

            {/* 2. Basic Property Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Property Title / Community Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prestige Green Crest 4BHK Villa or HSR Sector 2 Plot"
                  value={sellTitle}
                  onChange={(e) => setSellTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Locality / Zone in Bangalore *
                </label>
                <select
                  value={sellLocality}
                  onChange={(e) => setSellLocality(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-400"
                >
                  <option value="HSR Layout, Bangalore">HSR Layout (Sectors 1 to 7)</option>
                  <option value="Indiranagar 100ft Rd, Bangalore">Indiranagar (100ft / CMH Road)</option>
                  <option value="Koramangala, Bangalore">Koramangala (Blocks 3, 4, 5, 6)</option>
                  <option value="Whitefield ITPL Zone, Bangalore">Whitefield (EPIP / ITPL Zone)</option>
                  <option value="Sarjapur Road, Bangalore">Sarjapur Road (Wipro SEZ Corridor)</option>
                  <option value="Devanahalli BIAL Corridor, Bangalore">Devanahalli (Airport Corridor)</option>
                  <option value="Electronic City Phase 1, Bangalore">Electronic City Phase 1</option>
                </select>
              </div>
            </div>

            {/* 3. Metrics: Built-up Area & Expected Price */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {sellGoal === 'sell_land' ? 'Plot Area (Sq.Ft) *' : 'Super Built-Up Area (Sq.Ft) *'}
                </label>
                <input
                  type="number"
                  min={200}
                  step={50}
                  required
                  value={sellAreaSqFt}
                  onChange={(e) => setSellAreaSqFt(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {sellGoal.startsWith('rent') ? 'Expected Monthly Rent (₹) *' : 'Expected Sale Price (₹) *'}
                </label>
                <input
                  type="number"
                  min={5000}
                  step={50000}
                  required
                  value={sellExpectedPrice}
                  onChange={(e) => setSellExpectedPrice(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-bold focus:outline-none focus:border-purple-400 font-mono"
                />
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  Approx: {formatCurrency(sellExpectedPrice, currency)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Title / Khata Document Type
                </label>
                <select
                  value={sellKhata}
                  onChange={(e) => setSellKhata(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-400"
                >
                  <option value="A-Khata">BBMP A-Khata (Clear Title)</option>
                  <option value="BDA">BDA Allotment Letter</option>
                  <option value="DTCP">BIAAPA / DTCP Approved</option>
                  <option value="B-Khata">BBMP B-Khata / Under Regularization</option>
                </select>
              </div>
            </div>

            {/* 4. Owner Contact & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Owner / Landlord Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={sellOwnerName}
                  onChange={(e) => setSellOwnerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Owner Direct Phone (+91) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98450 12345"
                  value={sellPhone}
                  onChange={(e) => setSellPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Property Amenities &amp; Architectural Features
              </label>
              <textarea
                rows={2}
                placeholder="e.g. East facing, 40ft road, borewell with sweet water, Italian marble, private terrace garden..."
                value={sellNotes}
                onChange={(e) => setSellNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 resize-none"
              />
            </div>

            {/* Submit & Valuation buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleRunAiValuation}
                disabled={isValuating}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-300 font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>{isValuating ? 'Calculating Market Rate...' : 'Calculate AI Valuation'}</span>
              </button>

              <button
                type="submit"
                className="w-full sm:flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Publish 0% Brokerage Listing Live</span>
              </button>
            </div>
          </form>
        </div>

        {/* AI Valuation & Pricing Advisor Card */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl flex flex-col justify-between text-left">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Gouse AI Property Valuation Desk</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-light">
              Our automated valuation model checks recent SRO registrar registrations, guidance values, and local active transactions in {sellLocality.split(',')[0]}.
            </p>

            {valuationResult ? (
              <div className="space-y-3 p-4 rounded-2xl bg-slate-950 border border-purple-500/40 animate-in fade-in">
                <div>
                  <div className="text-[10px] text-slate-400 font-mono">Fair Market Estimate</div>
                  <div className="text-xl font-black text-amber-300 mt-0.5">
                    {formatCurrency(valuationResult.fairMarketValue, currency)}
                  </div>
                  <div className="text-[11px] text-purple-300 font-mono">
                    Avg Rate: ₹{valuationResult.pricePerSqFtAvg.toLocaleString('en-IN')}/sq.ft
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
                  <div>
                    <div className="text-[10px] text-slate-500 font-mono">Govt Guidance</div>
                    <div className="font-semibold text-slate-300 font-mono">
                      {formatCurrency(valuationResult.guidanceValue, currency)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-mono">Avg Days on Market</div>
                    <div className="font-semibold text-emerald-400 font-mono">
                      ~{valuationResult.estimatedDaysToTransact} Days
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-slate-300">
                  <div className="text-[10px] font-mono text-purple-400 uppercase tracking-wide">Suggested Price Range:</div>
                  <div className="font-bold text-white mt-0.5">{valuationResult.recommendedRange}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{valuationResult.projectedRentalYield}</div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
                <Calculator className="w-8 h-8 text-purple-400/50 mx-auto" />
                <div className="text-xs font-semibold text-slate-300">Run AI Valuation</div>
                <p className="text-[11px] text-slate-500">
                  Click &quot;Calculate AI Valuation&quot; on the left to estimate real-time market value and rental yield for {sellAreaSqFt} sq.ft in {sellLocality.split(',')[0]}.
                </p>
              </div>
            )}

            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero commission / 0% brokerage direct buyer contact</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Automated digital agreement generation support</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Instant broadcast to 2,800+ verified active seekers</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <span className="text-slate-400">Questions on listing your property? </span>
            <a href="tel:+918073947241" className="text-amber-400 hover:underline font-bold">
              Call +91 80739 47241
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
