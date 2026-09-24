import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  Compass,
  ExternalLink,
  Image as ImageIcon,
  CheckCircle,
  Wifi,
  Shield,
  Zap,
  Phone,
  MessageSquare,
  Calendar,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Bed,
  Home,
  Users,
  Clock,
  Car,
  Utensils,
  Droplets,
  Sun,
  Dumbbell,
  Key,
  Plus,
  Filter,
  Check,
  Building,
  Info,
  Layers,
  ArrowRight,
  Upload,
  Trash2,
  ImagePlus,
  PlusCircle,
  Sparkles,
} from 'lucide-react';
import { Project, PgHouseRoomUnit, PgRoomType, PgGalleryImage } from '../types';
import { formatCurrency, CurrencyCode } from '../utils/formatters';

// Import local high-resolution property images
import pgExteriorImg from '../assets/images/pg_house_exterior_1790170202558.jpg';
import pgBedroomImg from '../assets/images/pg_bedroom_suite_1790170216460.jpg';
import pgDiningImg from '../assets/images/pg_dining_lounge_1790170229065.jpg';
import pgBathroomImg from '../assets/images/pg_modern_bathroom_1790170240349.jpg';
import pgTerraceImg from '../assets/images/bangalore_pg_terrace_1790170513465.jpg';
import houseExteriorImg from '../assets/images/bangalore_house_exterior_1790170528532.jpg';
import apartmentTowerImg from '../assets/images/mantri_premero_tower_1790170972037.jpg';
import floorVillaImg from '../assets/images/bangalore_builder_proj2_1790170907606.jpg';

export interface PgHousePropertyListingSectionProps {
  project: Project;
  onUpdateProject?: (updated: Project) => void;
  currency?: CurrencyCode;
  mode?: 'pg' | 'rent_house' | 'all';
}

// Preset image library for fast selection
const PRESET_IMAGES = [
  { label: 'Modern Facade Elevation', url: pgExteriorImg, category: 'Exterior' as const },
  { label: 'Executive Bedroom Suite', url: pgBedroomImg, category: 'Bedroom' as const },
  { label: 'Dining Hall & Community Lounge', url: pgDiningImg, category: 'Dining & Lounge' as const },
  { label: 'Designer Attached Washroom', url: pgBathroomImg, category: 'Washroom' as const },
  { label: 'Skyline Rooftop Terrace', url: pgTerraceImg, category: 'Terrace' as const },
  { label: 'Independent Residential Villa', url: houseExteriorImg, category: 'Exterior' as const },
  { label: 'Luxury Apartment Tower', url: apartmentTowerImg, category: 'Exterior' as const },
  { label: 'Independent Floor Residence', url: floorVillaImg, category: 'Exterior' as const },
];

export interface CompletePropertyListing {
  id: string;
  name: string;
  propertyType: 'PG / Co-Living Facility' | 'Independent House / Rental Floors' | 'Hybrid PG & House' | 'Luxury Villa & Apartments';
  genderCategory: 'Coliving (Unisex)' | 'Gents PG' | 'Ladies PG' | 'Family & Working Professionals';
  locationAddress: string;
  zone: string;
  contactPerson: string;
  contactPhone: string;
  depositMonths: number;
  noticePeriodDays: number;
  gateClosingTime: string;
  foodIncluded: boolean;
  foodType: string;
  bbmpApprovalKhata: string;
  totalFloors: string;
  rooms: PgHouseRoomUnit[];
  gallery: PgGalleryImage[];
  // House / Apartment specific properties:
  bhkConfig?: string;
  carpetAreaSqFt?: number;
  monthlyRentTotal?: number;
  maintenanceMonthly?: number;
  furnishingType?: 'Fully Furnished' | 'Semi-Furnished' | 'Unfurnished';
  parkingDetails?: string;
  facingVastu?: string;
  waterSupply?: string;
  powerBackupStatus?: string;
  petPolicy?: string;
  tenantPreference?: string;
  leasePeriodMonths?: number;
}

// Initial Sample Listings (Dedicated PG & Rent House)
const INITIAL_LISTINGS: CompletePropertyListing[] = [
  // ==========================================
  // PG & CO-LIVING LISTINGS
  // ==========================================
  {
    id: 'listing-pg-1',
    name: 'UrbanNest Executive PG & Co-Living House',
    propertyType: 'PG / Co-Living Facility',
    genderCategory: 'Coliving (Unisex)',
    locationAddress: 'Sector 2, 27th Main Rd, HSR Layout, Bangalore 560102',
    zone: 'South Bangalore / ORR Corridor',
    contactPerson: 'Ar. S. Gouse / Estate Manager',
    contactPhone: '+91 8073947241',
    depositMonths: 2,
    noticePeriodDays: 30,
    gateClosingTime: '11:00 PM (Biometric post-hours access)',
    foodIncluded: true,
    foodType: 'North & South Indian (3 Times Daily) + Sunday Biryani Special',
    bbmpApprovalKhata: 'BBMP A-Khata Verified',
    totalFloors: 'G+3 Floors',
    gallery: [
      {
        id: 'img-pg1-1',
        title: 'Modern Architecture Elevation',
        category: 'Exterior',
        imageUrl: pgExteriorImg,
        caption: 'G+3 contemporary facade with dedicated parking and biometric access control',
      },
      {
        id: 'img-pg1-2',
        title: 'Executive Master Suite',
        category: 'Bedroom',
        imageUrl: pgBedroomImg,
        caption: 'Fully furnished room with orthopaedic mattress, ergonomic work desk & wardrobe',
      },
      {
        id: 'img-pg1-3',
        title: 'Rooftop Dining & Community Lounge',
        category: 'Dining & Lounge',
        imageUrl: pgDiningImg,
        caption: 'Spacious dining hall with 3-times hygienic meal service & modular kitchen access',
      },
      {
        id: 'img-pg1-4',
        title: 'Attached Designer Washroom',
        category: 'Washroom',
        imageUrl: pgBathroomImg,
        caption: 'Equipped with 24/7 hot water geyser, premium sanitary fittings & daily hygiene maintenance',
      },
      {
        id: 'img-pg1-5',
        title: 'Skyline Terrace Garden',
        category: 'Terrace',
        imageUrl: pgTerraceImg,
        caption: 'Open-air recreation deck with artificial turf, seating benches & workout station',
      },
    ],
    rooms: [
      {
        id: 'r-pg1-101',
        roomNumber: 'Suite 101',
        floorName: 'Ground Floor',
        roomType: 'Single Private Room',
        totalBeds: 1,
        occupiedBeds: 1,
        rentPerBedMonthly: 18500,
        securityDeposit: 37000,
        furnishing: 'Fully Furnished',
        hasAttachedBath: true,
        hasBalcony: false,
        hasAirConditioning: true,
        notes: 'Premium single suite with 43" Smart TV and executive ergonomic chair',
        imageUrl: pgBedroomImg,
      },
      {
        id: 'r-pg1-102',
        roomNumber: 'Room 102',
        floorName: 'Ground Floor',
        roomType: 'Double Sharing',
        totalBeds: 2,
        occupiedBeds: 2,
        rentPerBedMonthly: 12500,
        securityDeposit: 25000,
        furnishing: 'Fully Furnished',
        hasAttachedBath: true,
        hasBalcony: true,
        hasAirConditioning: false,
        notes: 'East facing double room with individual wooden wardrobes and reading lamps',
        imageUrl: pgBedroomImg,
      },
      {
        id: 'r-pg1-201',
        roomNumber: 'Suite 201',
        floorName: '1st Floor',
        roomType: 'Single Private Room',
        totalBeds: 1,
        occupiedBeds: 0,
        rentPerBedMonthly: 19500,
        securityDeposit: 39000,
        furnishing: 'Fully Furnished',
        hasAttachedBath: true,
        hasBalcony: true,
        hasAirConditioning: true,
        notes: 'Available immediately! Private balcony with scenic tree canopy view',
        imageUrl: pgBedroomImg,
      },
      {
        id: 'r-pg1-202',
        roomNumber: 'Room 202',
        floorName: '1st Floor',
        roomType: 'Double Sharing',
        totalBeds: 2,
        occupiedBeds: 1,
        rentPerBedMonthly: 13000,
        securityDeposit: 26000,
        furnishing: 'Fully Furnished',
        hasAttachedBath: true,
        hasBalcony: false,
        hasAirConditioning: true,
        notes: '1 Bed available. Shared with senior fintech software engineer',
        imageUrl: pgBedroomImg,
      },
      {
        id: 'r-pg1-203',
        roomNumber: 'Room 203',
        floorName: '1st Floor',
        roomType: 'Triple Sharing',
        totalBeds: 3,
        occupiedBeds: 2,
        rentPerBedMonthly: 9500,
        securityDeposit: 19000,
        furnishing: 'Fully Furnished',
        hasAttachedBath: true,
        hasBalcony: true,
        hasAirConditioning: false,
        notes: 'Budget friendly with spacious 220 sq.ft layout and separate study desks',
        imageUrl: pgBedroomImg,
      },
    ],
  },
  {
    id: 'listing-pg-2',
    name: 'PalmGrove Luxury Ladies PG & Suites',
    propertyType: 'PG / Co-Living Facility',
    genderCategory: 'Ladies PG',
    locationAddress: '100ft Road, Near 12th Main, Indiranagar, Bangalore 560038',
    zone: 'East Bangalore / Indiranagar Metro Corridor',
    contactPerson: 'Ar. S. Gouse / Resident Warden',
    contactPhone: '+91 8073947241',
    depositMonths: 2,
    noticePeriodDays: 30,
    gateClosingTime: '10:30 PM (24/7 Female Guard & CCTV)',
    foodIncluded: true,
    foodType: 'Pure Veg & Non-Veg 3 Times Daily + Evening Tea & Snacks',
    bbmpApprovalKhata: 'BBMP A-Khata Verified',
    totalFloors: 'G+4 Floors (Lift Installed)',
    gallery: [
      {
        id: 'img-pg2-1',
        title: 'Indiranagar Prime Elevation',
        category: 'Exterior',
        imageUrl: floorVillaImg,
        caption: 'Secure residential enclave within 400m of Indiranagar Metro Station',
      },
      {
        id: 'img-pg2-2',
        title: 'Executive Air-Conditioned Suite',
        category: 'Bedroom',
        imageUrl: pgBedroomImg,
        caption: 'Full-length mirrors, dresser, high-speed WiFi & wooden wardrobes',
      },
      {
        id: 'img-pg2-3',
        title: 'Hygienic Dining Mess',
        category: 'Dining & Lounge',
        imageUrl: pgDiningImg,
        caption: 'Equipped with RO cold/hot dispenser, microwave, and separate dining tables',
      },
      {
        id: 'img-pg2-4',
        title: 'Designer Attached Bath',
        category: 'Washroom',
        imageUrl: pgBathroomImg,
        caption: 'Instant geysers, exhaust ventilation, and daily housekeeping sanitization',
      },
    ],
    rooms: [
      {
        id: 'r-pg2-101',
        roomNumber: 'Single Deluxe 101',
        floorName: '1st Floor',
        roomType: 'Single Private Room',
        totalBeds: 1,
        occupiedBeds: 0,
        rentPerBedMonthly: 19000,
        securityDeposit: 38000,
        furnishing: 'Fully Furnished',
        hasAttachedBath: true,
        hasBalcony: true,
        hasAirConditioning: true,
        notes: 'Exclusive corner single suite with road-facing private balcony',
        imageUrl: pgBedroomImg,
      },
      {
        id: 'r-pg2-102',
        roomNumber: 'Double Room 102',
        floorName: '1st Floor',
        roomType: 'Double Sharing',
        totalBeds: 2,
        occupiedBeds: 1,
        rentPerBedMonthly: 13500,
        securityDeposit: 27000,
        furnishing: 'Fully Furnished',
        hasAttachedBath: true,
        hasBalcony: false,
        hasAirConditioning: true,
        notes: '1 Bed available. Quiet floor suitable for IT professionals and doctors',
        imageUrl: pgBedroomImg,
      },
      {
        id: 'r-pg2-201',
        roomNumber: 'Triple Room 201',
        floorName: '2nd Floor',
        roomType: 'Triple Sharing',
        totalBeds: 3,
        occupiedBeds: 2,
        rentPerBedMonthly: 10500,
        securityDeposit: 21000,
        furnishing: 'Fully Furnished',
        hasAttachedBath: true,
        hasBalcony: true,
        hasAirConditioning: false,
        notes: 'Spacious 240 sq.ft room with 3 individual wooden wardrobes and study desks',
        imageUrl: pgBedroomImg,
      },
    ],
  },
  {
    id: 'listing-pg-3',
    name: 'TechHub Executive Gents PG & Co-Living',
    propertyType: 'PG / Co-Living Facility',
    genderCategory: 'Gents PG',
    locationAddress: 'Near RMZ Ecospace, Outer Ring Road, Bellandur, Bangalore 560103',
    zone: 'Outer Ring Road / Bellandur Tech Park',
    contactPerson: 'Ar. S. Gouse / Facility Lead',
    contactPhone: '+91 8073947241',
    depositMonths: 1,
    noticePeriodDays: 30,
    gateClosingTime: '24/7 Access (RFID Keycard entry)',
    foodIncluded: true,
    foodType: '3 Times Unlimited Buffet (North & South Indian)',
    bbmpApprovalKhata: 'BBMP Approved',
    totalFloors: 'G+3 Floors',
    gallery: [
      {
        id: 'img-pg3-1',
        title: 'Bellandur Campus Elevation',
        category: 'Exterior',
        imageUrl: pgExteriorImg,
        caption: '5-minute walking distance to RMZ Ecospace and Bellandur tech hubs',
      },
      {
        id: 'img-pg3-2',
        title: 'Standard Double Sharing Room',
        category: 'Bedroom',
        imageUrl: pgBedroomImg,
        caption: 'Equipped with 300 Mbps fiber WiFi, reading lights & power backup',
      },
      {
        id: 'img-pg3-3',
        title: 'Rooftop Lounge & Gym Area',
        category: 'Terrace',
        imageUrl: pgTerraceImg,
        caption: 'Recreation zone with table tennis, workout equipment & lounge seating',
      },
    ],
    rooms: [
      {
        id: 'r-pg3-101',
        roomNumber: 'Studio Single 101',
        floorName: 'Ground Floor',
        roomType: 'Single Private Room',
        totalBeds: 1,
        occupiedBeds: 0,
        rentPerBedMonthly: 17500,
        securityDeposit: 17500,
        furnishing: 'Fully Furnished',
        hasAttachedBath: true,
        hasBalcony: false,
        hasAirConditioning: true,
        notes: 'Single room for software engineers working night shifts with 24/7 power backup',
        imageUrl: pgBedroomImg,
      },
      {
        id: 'r-pg3-102',
        roomNumber: 'Double Sharing 102',
        floorName: '1st Floor',
        roomType: 'Double Sharing',
        totalBeds: 2,
        occupiedBeds: 1,
        rentPerBedMonthly: 11500,
        securityDeposit: 11500,
        furnishing: 'Fully Furnished',
        hasAttachedBath: true,
        hasBalcony: true,
        hasAirConditioning: false,
        notes: '1 Bed available immediately with attached balcony',
        imageUrl: pgBedroomImg,
      },
      {
        id: 'r-pg3-201',
        roomNumber: 'Triple Sharing 201',
        floorName: '2nd Floor',
        roomType: 'Triple Sharing',
        totalBeds: 3,
        occupiedBeds: 3,
        rentPerBedMonthly: 8500,
        securityDeposit: 8500,
        furnishing: 'Fully Furnished',
        hasAttachedBath: true,
        hasBalcony: false,
        hasAirConditioning: false,
        notes: 'Fully occupied. Next vacancy starting next month',
        imageUrl: pgBedroomImg,
      },
    ],
  },

  // ==========================================
  // RENT HOUSE, FLOORS & APARTMENTS LISTINGS
  // ==========================================
  {
    id: 'listing-house-1',
    name: 'GreenGlen 3BHK Independent Rental Floor',
    propertyType: 'Independent House / Rental Floors',
    genderCategory: 'Family & Working Professionals',
    locationAddress: 'Green Glen Layout, Bellandur, Bangalore 560103',
    zone: 'Outer Ring Road / Bellandur Tech Corridor',
    contactPerson: 'Ar. S. Gouse / Property Manager',
    contactPhone: '+91 8073947241',
    depositMonths: 3,
    noticePeriodDays: 30,
    gateClosingTime: 'Independent Gate (24/7 Private Access)',
    foodIncluded: false,
    foodType: 'Self-Cooking (Modular Italian Kitchen with Chimney & Piped Gas)',
    bbmpApprovalKhata: 'BBMP A-Khata Verified',
    totalFloors: '1st Floor of G+3 Independent Building',
    bhkConfig: '3 BHK',
    carpetAreaSqFt: 1650,
    monthlyRentTotal: 46000,
    maintenanceMonthly: 3000,
    furnishingType: 'Semi-Furnished',
    parkingDetails: '1 Dedicated Covered Car Parking + 2 Bike Bays',
    facingVastu: 'East Facing (100% Vastu Compliant)',
    waterSupply: 'Cauvery Water + 24/7 Borewell Connection',
    powerBackupStatus: '100% Inverter & DG Power Backup',
    petPolicy: 'Pet Friendly (Small Dogs & Cats Allowed)',
    tenantPreference: 'Family or Working Professionals',
    leasePeriodMonths: 11,
    gallery: [
      {
        id: 'img-h1-1',
        title: 'Independent Building Facade',
        category: 'Exterior',
        imageUrl: houseExteriorImg,
        caption: 'Independent G+3 floor design with wide 40ft road frontage and tree canopy',
      },
      {
        id: 'img-h1-2',
        title: 'Master Bedroom with Balcony',
        category: 'Bedroom',
        imageUrl: pgBedroomImg,
        caption: 'Full-length wooden floor-to-ceiling wardrobes and attached bathroom',
      },
      {
        id: 'img-h1-3',
        title: 'Living Hall & Modular Kitchen',
        category: 'Dining & Lounge',
        imageUrl: pgDiningImg,
        caption: 'Italian modular kitchen with granite slab, chimney, and utility balcony area',
      },
      {
        id: 'img-h1-4',
        title: 'Designer Western Washroom',
        category: 'Washroom',
        imageUrl: pgBathroomImg,
        caption: 'Jaguar fittings, glass partition cubicle, and 25L branded water heater',
      },
      {
        id: 'img-h1-5',
        title: 'Private Rooftop Terrace Access',
        category: 'Terrace',
        imageUrl: pgTerraceImg,
        caption: 'Open terrace for evening sit-outs, drying clothes, and fresh air',
      },
    ],
    rooms: [
      {
        id: 'r-h1-master',
        roomNumber: 'Master Bedroom Suite',
        floorName: '1st Floor',
        roomType: 'Single Private Room',
        totalBeds: 1,
        occupiedBeds: 0,
        rentPerBedMonthly: 46000,
        securityDeposit: 138000,
        furnishing: 'Semi-Furnished',
        hasAttachedBath: true,
        hasBalcony: true,
        hasAirConditioning: true,
        notes: '220 sq.ft Master suite with French window, private balcony, and teak wardrobes',
        imageUrl: pgBedroomImg,
      },
      {
        id: 'r-h1-bed2',
        roomNumber: 'Bedroom 2 (Guest Suite)',
        floorName: '1st Floor',
        roomType: 'Single Private Room',
        totalBeds: 1,
        occupiedBeds: 0,
        rentPerBedMonthly: 0,
        securityDeposit: 0,
        furnishing: 'Semi-Furnished',
        hasAttachedBath: true,
        hasBalcony: false,
        hasAirConditioning: false,
        notes: 'Spacious 180 sq.ft bedroom with attached bathroom and ample cross-ventilation',
        imageUrl: pgBedroomImg,
      },
      {
        id: 'r-h1-bed3',
        roomNumber: 'Bedroom 3 (Study / Kids Room)',
        floorName: '1st Floor',
        roomType: 'Single Private Room',
        totalBeds: 1,
        occupiedBeds: 0,
        rentPerBedMonthly: 0,
        securityDeposit: 0,
        furnishing: 'Semi-Furnished',
        hasAttachedBath: false,
        hasBalcony: true,
        hasAirConditioning: false,
        notes: 'Ideal for work-from-home setup with high-speed internet port and balcony',
        imageUrl: pgBedroomImg,
      },
      {
        id: 'r-h1-living',
        roomNumber: 'Living & Dining Hall + Kitchen',
        floorName: '1st Floor',
        roomType: '1BHK Suite / Floor',
        totalBeds: 1,
        occupiedBeds: 0,
        rentPerBedMonthly: 0,
        securityDeposit: 0,
        furnishing: 'Semi-Furnished',
        hasAttachedBath: false,
        hasBalcony: true,
        hasAirConditioning: false,
        notes: 'Large 420 sq.ft living lounge with false ceiling, LED mood lights, and dining space',
        imageUrl: pgDiningImg,
      },
    ],
  },
  {
    id: 'listing-house-2',
    name: 'Sobha Silicon 2BHK Luxury Rental Apartment',
    propertyType: 'Luxury Villa & Apartments',
    genderCategory: 'Family & Working Professionals',
    locationAddress: 'Phase 1, Near Infosys Gate 4, Electronic City, Bangalore 560100',
    zone: 'South Bangalore / Electronic City Hub',
    contactPerson: 'Ar. S. Gouse / Owner Representative',
    contactPhone: '+91 8073947241',
    depositMonths: 3,
    noticePeriodDays: 30,
    gateClosingTime: '24/7 Gated Security & MyGate App',
    foodIncluded: false,
    foodType: 'Modular Kitchen with Piped Natural Gas (GAIL) & Hob',
    bbmpApprovalKhata: 'BBMP A-Khata & Occupancy Certificate (OC)',
    totalFloors: '4th Floor of 12 Floors (High Rise)',
    bhkConfig: '2 BHK',
    carpetAreaSqFt: 1220,
    monthlyRentTotal: 32000,
    maintenanceMonthly: 2500,
    furnishingType: 'Fully Furnished',
    parkingDetails: '1 Reserved Basement Car Parking + EV Charger Slot',
    facingVastu: 'North Facing Entrance (Vastu Verified)',
    waterSupply: '24/7 Cauvery Water + On-site Water Treatment Plant',
    powerBackupStatus: 'Full 24/7 DG Backup (including AC & Geysers)',
    petPolicy: 'Allowed as per Apartment Association Rules',
    tenantPreference: 'Working Tech Couples, Bachelors or Small Family',
    leasePeriodMonths: 11,
    gallery: [
      {
        id: 'img-h2-1',
        title: 'Sobha Silicon Tower Elevation',
        category: 'Exterior',
        imageUrl: apartmentTowerImg,
        caption: 'Premium gated community with Olympic swimming pool, clubhouse, tennis court & gym',
      },
      {
        id: 'img-h2-2',
        title: 'Furnished Master Suite',
        category: 'Bedroom',
        imageUrl: pgBedroomImg,
        caption: 'King bed with storage, side tables, 1.5-ton split AC, and engineered wooden flooring',
      },
      {
        id: 'img-h2-3',
        title: 'Drawing & Dining Hall',
        category: 'Dining & Lounge',
        imageUrl: pgDiningImg,
        caption: '6-seater dining table, L-shape fabric sofa, and 50" 4K Smart TV',
      },
      {
        id: 'img-h2-4',
        title: 'Modern Bathroom',
        category: 'Washroom',
        imageUrl: pgBathroomImg,
        caption: 'Grohe fittings with glass shower partition and vanity storage mirror',
      },
    ],
    rooms: [
      {
        id: 'r-h2-master',
        roomNumber: 'Master Bedroom with Ensuite',
        floorName: '4th Floor',
        roomType: 'Single Private Room',
        totalBeds: 1,
        occupiedBeds: 0,
        rentPerBedMonthly: 32000,
        securityDeposit: 96000,
        furnishing: 'Fully Furnished',
        hasAttachedBath: true,
        hasBalcony: false,
        hasAirConditioning: true,
        notes: 'Equipped with 1.5T Daikin Inverter AC, King bed, mattress, and 3-door wardrobe',
        imageUrl: pgBedroomImg,
      },
      {
        id: 'r-h2-bed2',
        roomNumber: 'Second Bedroom',
        floorName: '4th Floor',
        roomType: 'Single Private Room',
        totalBeds: 1,
        occupiedBeds: 0,
        rentPerBedMonthly: 0,
        securityDeposit: 0,
        furnishing: 'Fully Furnished',
        hasAttachedBath: true,
        hasBalcony: true,
        hasAirConditioning: true,
        notes: 'Attached balcony with panoramic view of Electronic City flyover',
        imageUrl: pgBedroomImg,
      },
    ],
  },
  {
    id: 'listing-house-3',
    name: 'Indiranagar 4BHK Independent Duplex Villa',
    propertyType: 'Independent House / Rental Floors',
    genderCategory: 'Family & Working Professionals',
    locationAddress: 'Defence Colony, 6th Main, Indiranagar, Bangalore 560038',
    zone: 'Central-East Bangalore',
    contactPerson: 'Ar. S. Gouse / Principal Architect',
    contactPhone: '+91 8073947241',
    depositMonths: 3,
    noticePeriodDays: 60,
    gateClosingTime: 'Private Gated Compound (24/7 Security)',
    foodIncluded: false,
    foodType: 'Luxury Island Modular Kitchen with Chimney, Oven & Pantry',
    bbmpApprovalKhata: 'BBMP A-Khata Verified',
    totalFloors: 'G+1 Duplex Villa with Private Terrace Garden',
    bhkConfig: '4 BHK Duplex',
    carpetAreaSqFt: 2850,
    monthlyRentTotal: 85000,
    maintenanceMonthly: 0,
    furnishingType: 'Semi-Furnished',
    parkingDetails: '2 Covered Car Garage + 3 Two-Wheeler Slots',
    facingVastu: 'North-East Facing (Prime Vastu)',
    waterSupply: 'Direct Cauvery Water Connection + 6000L Underground Sump',
    powerBackupStatus: '5 kVA Solar Hybrid Inverter with Battery Bank',
    petPolicy: 'Pet Friendly with Private Front Lawn',
    tenantPreference: 'Corporate Executives, Expats & Families',
    leasePeriodMonths: 11,
    gallery: [
      {
        id: 'img-h3-1',
        title: 'Indiranagar Villa Elevation',
        category: 'Exterior',
        imageUrl: floorVillaImg,
        caption: 'Bespoke contemporary duplex villa with teak accents and private perimeter landscaping',
      },
      {
        id: 'img-h3-2',
        title: 'Master Bedroom Suite',
        category: 'Bedroom',
        imageUrl: pgBedroomImg,
        caption: 'Walk-in closet, dressing room, wooden flooring, and private veranda',
      },
      {
        id: 'img-h3-3',
        title: 'Island Kitchen & Double Height Living',
        category: 'Dining & Lounge',
        imageUrl: pgDiningImg,
        caption: 'Spacious double-height atrium living room with skylight and marble flooring',
      },
      {
        id: 'img-h3-4',
        title: 'Private Skyline Terrace',
        category: 'Terrace',
        imageUrl: pgTerraceImg,
        caption: 'Private terrace garden with pergolas, grass turf, and city skyline view',
      },
    ],
    rooms: [
      {
        id: 'r-h3-master',
        roomNumber: 'Grand Master Suite',
        floorName: '1st Floor',
        roomType: 'Single Private Room',
        totalBeds: 1,
        occupiedBeds: 0,
        rentPerBedMonthly: 85000,
        securityDeposit: 255000,
        furnishing: 'Semi-Furnished',
        hasAttachedBath: true,
        hasBalcony: true,
        hasAirConditioning: true,
        notes: 'Grand 320 sq.ft suite with walk-in wardrobe and jacuzzi bath tub',
        imageUrl: pgBedroomImg,
      },
      {
        id: 'r-h3-bed2',
        roomNumber: 'Bedroom 2 & 3 Suites',
        floorName: '1st Floor',
        roomType: 'Single Private Room',
        totalBeds: 1,
        occupiedBeds: 0,
        rentPerBedMonthly: 0,
        securityDeposit: 0,
        furnishing: 'Semi-Furnished',
        hasAttachedBath: true,
        hasBalcony: true,
        hasAirConditioning: true,
        notes: 'Two identical luxury bedrooms with individual attached washrooms',
        imageUrl: pgBedroomImg,
      },
      {
        id: 'r-h3-bed4',
        roomNumber: 'Ground Floor Guest Suite',
        floorName: 'Ground Floor',
        roomType: 'Single Private Room',
        totalBeds: 1,
        occupiedBeds: 0,
        rentPerBedMonthly: 0,
        securityDeposit: 0,
        furnishing: 'Semi-Furnished',
        hasAttachedBath: true,
        hasBalcony: false,
        hasAirConditioning: false,
        notes: 'Elderly-friendly ground floor suite with zero-threshold walk-in bathroom',
        imageUrl: pgBedroomImg,
      },
    ],
  },
];

// Live Bangalore Tech Park proximity routes
const TECH_PARK_PROXIMITY = [
  {
    name: 'RMZ Ecospace & Outer Ring Road',
    distance: '3.2 km',
    travelTime: '10 mins',
    transport: 'Metro / Cab',
    query: 'RMZ Ecospace Outer Ring Road Bellandur Bangalore',
  },
  {
    name: 'Silk Board / HSR Metro Station (Yellow Line)',
    distance: '1.2 km',
    travelTime: '4 mins',
    transport: 'E-Rickshaw / Walk',
    query: 'Central Silk Board Metro Station Bangalore',
  },
  {
    name: 'Electronic City Phase 1 (Infosys/Wipro)',
    distance: '6.8 km',
    travelTime: '16 mins',
    transport: 'Elevated Tollway',
    query: 'Electronic City Phase 1 Bangalore',
  },
  {
    name: 'Koramangala Sony World Junction',
    distance: '4.1 km',
    travelTime: '12 mins',
    transport: 'Main Road Cab',
    query: 'Sony World Junction Koramangala Bangalore',
  },
  {
    name: 'Manyata Embassy Business Park',
    distance: '18.4 km',
    travelTime: '35 mins',
    transport: 'Flyover Corridor',
    query: 'Manyata Tech Park Nagavara Bangalore',
  },
  {
    name: 'Kempegowda International Airport (BLR)',
    distance: '41 km',
    travelTime: '55 mins',
    transport: 'Airport Vayu Vajra Bus',
    query: 'Kempegowda International Airport Bengaluru',
  },
];

export const PgHousePropertyListingSection: React.FC<PgHousePropertyListingSectionProps> = ({
  project,
  onUpdateProject,
  currency = 'INR',
  mode = 'all',
}) => {
  // Helper classifiers
  const isPgItem = (item: CompletePropertyListing) =>
    item.propertyType === 'PG / Co-Living Facility' || item.propertyType === 'Hybrid PG & House';

  const isHouseItem = (item: CompletePropertyListing) =>
    item.propertyType === 'Independent House / Rental Floors' || item.propertyType === 'Luxury Villa & Apartments';

  // Category Tab: 'pg' vs 'rent_house'
  const [currentCategoryTab, setCurrentCategoryTab] = useState<'pg' | 'rent_house'>(() => {
    if (mode === 'rent_house') return 'rent_house';
    return 'pg';
  });

  // Listings State
  const [listings, setListings] = useState<CompletePropertyListing[]>(() => {
    if (project.pgPropertyDetails && project.pgPropertyDetails.propertyName) {
      const isProjHouse = project.pgPropertyDetails.propertyType?.includes('House') || project.pgPropertyDetails.propertyType?.includes('Villa');
      return [
        {
          id: 'listing-project-current',
          name: project.pgPropertyDetails.propertyName,
          propertyType: project.pgPropertyDetails.propertyType || (isProjHouse ? 'Independent House / Rental Floors' : 'PG / Co-Living Facility'),
          genderCategory: project.pgPropertyDetails.genderCategory || (isProjHouse ? 'Family & Working Professionals' : 'Coliving (Unisex)'),
          locationAddress: project.location || 'Sector 2, HSR Layout, Bangalore',
          zone: 'South Bangalore / ORR',
          contactPerson: project.pgPropertyDetails.contactPerson || 'Ar. S. Gouse / Estate Manager',
          contactPhone: project.pgPropertyDetails.contactPhone || '+91 8073947241',
          depositMonths: project.pgPropertyDetails.depositMonths || (isProjHouse ? 3 : 2),
          noticePeriodDays: project.pgPropertyDetails.noticePeriodDays || 30,
          gateClosingTime: project.pgPropertyDetails.gateClosingTime || (isProjHouse ? 'Independent Gate (24/7)' : '11:00 PM (Biometric)'),
          foodIncluded: project.pgPropertyDetails.foodIncluded ?? !isProjHouse,
          foodType: project.pgPropertyDetails.foodType || (isProjHouse ? 'Self-Cooking (Modular Kitchen)' : 'North & South Indian (3 Times Daily)'),
          bbmpApprovalKhata: 'BBMP A-Khata Verified',
          totalFloors: 'G+3 Floors',
          gallery: project.pgPropertyDetails.images && project.pgPropertyDetails.images.length > 0
            ? project.pgPropertyDetails.images
            : INITIAL_LISTINGS[0].gallery,
          rooms: project.pgPropertyDetails.rooms && project.pgPropertyDetails.rooms.length > 0
            ? project.pgPropertyDetails.rooms
            : INITIAL_LISTINGS[0].rooms,
        },
        ...INITIAL_LISTINGS,
      ];
    }
    return INITIAL_LISTINGS;
  });

  // React to mode prop changes
  useEffect(() => {
    if (mode === 'rent_house') {
      setCurrentCategoryTab('rent_house');
      const firstHouse = listings.find(isHouseItem);
      if (firstHouse) setActiveListingId(firstHouse.id);
    } else if (mode === 'pg') {
      setCurrentCategoryTab('pg');
      const firstPg = listings.find(isPgItem);
      if (firstPg) setActiveListingId(firstPg.id);
    }
  }, [mode]);

  const pgCount = listings.filter(isPgItem).length;
  const houseCount = listings.filter(isHouseItem).length;

  const visibleListings = listings.filter((item) => {
    if (currentCategoryTab === 'pg') return isPgItem(item);
    if (currentCategoryTab === 'rent_house') return isHouseItem(item);
    return true;
  });

  const [activeListingId, setActiveListingId] = useState<string>(() => {
    const initialMatch = (mode === 'rent_house' ? INITIAL_LISTINGS.find(isHouseItem) : INITIAL_LISTINGS.find(isPgItem)) || INITIAL_LISTINGS[0];
    return initialMatch.id;
  });

  // Active Listing
  const activeListing = visibleListings.find((l) => l.id === activeListingId) || visibleListings[0] || listings[0];

  // Filters & Views
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'single' | 'double' | 'triple' | 'available' | 'ac'>('all');
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');

  // Modals
  const [showAddImageModal, setShowAddImageModal] = useState(false);
  const [showNewListingModal, setShowNewListingModal] = useState(false);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedBookingRoom, setSelectedBookingRoom] = useState<PgHouseRoomUnit | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // New Image Form State
  const [imageUploadMode, setImageUploadMode] = useState<'file' | 'url' | 'preset'>('file');
  const [newImageTitle, setNewImageTitle] = useState('');
  const [newImageCategory, setNewImageCategory] = useState<'Exterior' | 'Bedroom' | 'Dining & Lounge' | 'Washroom' | 'Terrace'>('Bedroom');
  const [newImageCaption, setNewImageCaption] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');

  // New Listing Form State
  const [listingName, setListingName] = useState('');
  const [listingType, setListingType] = useState<CompletePropertyListing['propertyType']>('PG / Co-Living Facility');
  const [listingGender, setListingGender] = useState<CompletePropertyListing['genderCategory']>('Coliving (Unisex)');
  const [listingAddress, setListingAddress] = useState('');
  const [listingZone, setListingZone] = useState('South Bangalore / HSR Layout');
  const [listingFloors, setListingFloors] = useState('G+3 Floors');
  const [listingContactName, setListingContactName] = useState('Ar. S. Gouse / Estate Manager');
  const [listingContactPhone, setListingContactPhone] = useState('+91 8073947241');
  const [listingDepositMonths, setListingDepositMonths] = useState(2);
  const [listingNoticeDays, setListingNoticeDays] = useState(30);
  const [listingFoodIncluded, setListingFoodIncluded] = useState(true);
  const [listingFoodType, setListingFoodType] = useState('North & South Indian (3 Times Daily)');

  // House-specific fields
  const [listingBhk, setListingBhk] = useState('3 BHK');
  const [listingCarpetArea, setListingCarpetArea] = useState(1550);
  const [listingMonthlyRent, setListingMonthlyRent] = useState(36000);
  const [listingMaintenance, setListingMaintenance] = useState(2500);
  const [listingFurnishing, setListingFurnishing] = useState<
    'Fully Furnished' | 'Semi-Furnished' | 'Unfurnished'
  >('Semi-Furnished');
  const [listingParking, setListingParking] = useState('1 Covered Car + 2 Bike Bays');
  const [listingVastu, setListingVastu] = useState('East Facing Main Door (100% Vastu)');
  const [listingTenantPreference, setListingTenantPreference] = useState('Families or Working Tech Professionals');

  // New Room Form State
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newFloorName, setNewFloorName] = useState('1st Floor');
  const [newRoomType, setNewRoomType] = useState<PgRoomType>('Double Sharing');
  const [newRent, setNewRent] = useState(13000);
  const [newDeposit, setNewDeposit] = useState(26000);
  const [newAttachedBath, setNewAttachedBath] = useState(true);
  const [newAC, setNewAC] = useState(false);
  const [newBalcony, setNewBalcony] = useState(true);
  const [newRoomImage, setNewRoomImage] = useState<string>(pgBedroomImg);

  // Booking Form State
  const [bookingName, setBookingName] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');

  // Calculations for current active listing
  const rooms = activeListing.rooms;
  const gallery = activeListing.gallery;
  const totalBeds = rooms.reduce((acc, r) => acc + r.totalBeds, 0);
  const occupiedBeds = rooms.reduce((acc, r) => acc + r.occupiedBeds, 0);
  const availableBeds = totalBeds - occupiedBeds;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  const monthlyGrossYield = rooms.reduce((acc, r) => acc + r.rentPerBedMonthly * r.occupiedBeds, 0);

  // Filtered Rooms
  const filteredRooms = rooms.filter((r) => {
    if (selectedFilter === 'single') return r.roomType === 'Single Private Room';
    if (selectedFilter === 'double') return r.roomType === 'Double Sharing';
    if (selectedFilter === 'triple') return r.roomType === 'Triple Sharing';
    if (selectedFilter === 'available') return r.totalBeds - r.occupiedBeds > 0;
    if (selectedFilter === 'ac') return r.hasAirConditioning;
    return true;
  });

  // Google Maps URLs
  const encodedAddress = encodeURIComponent(activeListing.locationAddress);
  const googleMapEmbedUrl = `https://maps.google.com/maps?q=${encodedAddress}&t=${mapType === 'satellite' ? 'k' : ''}&z=15&ie=UTF8&iwloc=&output=embed`;
  const googleMapsLiveSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  const googleMapsStreetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=12.9121,77.6446`;

  // WhatsApp Link
  const whatsappUrl = `https://wa.me/${activeListing.contactPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    `Hello ${activeListing.contactPerson}, I am interested in viewing rooms at "${activeListing.name}" (${activeListing.locationAddress}). Please share current bed availability and schedule.`
  )}`;

  // Save current active listing to project
  const persistListingToProject = (updatedListing: CompletePropertyListing) => {
    if (onUpdateProject) {
      onUpdateProject({
        ...project,
        pgPropertyDetails: {
          propertyName: updatedListing.name,
          propertyType: updatedListing.propertyType,
          genderCategory: updatedListing.genderCategory,
          targetAudience: 'Software Engineers, Fintech & Healthcare Professionals',
          foodIncluded: updatedListing.foodIncluded,
          foodType: updatedListing.foodType,
          noticePeriodDays: updatedListing.noticePeriodDays,
          gateClosingTime: updatedListing.gateClosingTime,
          contactPerson: updatedListing.contactPerson,
          contactPhone: updatedListing.contactPhone,
          depositMonths: updatedListing.depositMonths,
          amenities: {
            wifi: true,
            cctv: true,
            powerBackup: true,
            washingMachine: true,
            roWater: true,
            housekeeping: true,
            parking: true,
            solarWater: true,
            refrigerator: true,
            fingerprintAccess: true,
            messMeals: true,
            gymOrFitness: true,
          },
          images: updatedListing.gallery,
          rooms: updatedListing.rooms,
        },
      });
    }
  };

  // Handle Create New Property Listing
  const handleCreateNewListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!listingName.trim()) return;

    const newListingId = `listing-${Date.now()}`;
    const isHouseListing = listingType === 'Independent House / Rental Floors' || listingType === 'Luxury Villa & Apartments';
    const initialCover = imagePreviewUrl || (isHouseListing ? houseExteriorImg : pgExteriorImg);

    const newListing: CompletePropertyListing = {
      id: newListingId,
      name: listingName.trim(),
      propertyType: listingType,
      genderCategory: isHouseListing ? 'Family & Working Professionals' : listingGender,
      locationAddress: listingAddress.trim() || `${listingName}, Bangalore, Karnataka`,
      zone: listingZone,
      contactPerson: listingContactName.trim() || 'Ar. S. Gouse / Estate Manager',
      contactPhone: listingContactPhone.trim() || '+91 8073947241',
      depositMonths: isHouseListing ? 3 : Number(listingDepositMonths) || 2,
      noticePeriodDays: Number(listingNoticeDays) || 30,
      gateClosingTime: isHouseListing ? 'Independent Gate (24/7 Access)' : '11:00 PM (Biometric)',
      foodIncluded: isHouseListing ? false : listingFoodIncluded,
      foodType: isHouseListing ? 'Modular Kitchen with Piped Natural Gas' : listingFoodType,
      bbmpApprovalKhata: 'BBMP A-Khata Verified',
      totalFloors: listingFloors,
      bhkConfig: isHouseListing ? listingBhk : undefined,
      carpetAreaSqFt: isHouseListing ? Number(listingCarpetArea) || 1500 : undefined,
      monthlyRentTotal: isHouseListing ? Number(listingMonthlyRent) || 35000 : undefined,
      maintenanceMonthly: isHouseListing ? Number(listingMaintenance) || 2000 : undefined,
      furnishingType: isHouseListing ? listingFurnishing : 'Fully Furnished',
      parkingDetails: isHouseListing ? listingParking : 'Dedicated Bike & Visitor Parking',
      facingVastu: isHouseListing ? listingVastu : 'East Facing Main Entrance',
      tenantPreference: isHouseListing ? listingTenantPreference : 'Working Professionals & Students',
      leasePeriodMonths: isHouseListing ? 11 : 6,
      gallery: [
        {
          id: `img-${Date.now()}-1`,
          title: `${listingName} Facade`,
          category: 'Exterior',
          imageUrl: initialCover,
          caption: `Main elevation of ${listingName} located in ${listingZone}`,
        },
        {
          id: `img-${Date.now()}-2`,
          title: isHouseListing ? 'Master Bedroom Suite' : 'Furnished Bedroom Suite',
          category: 'Bedroom',
          imageUrl: isHouseListing ? apartmentTowerImg : pgBedroomImg,
          caption: isHouseListing
            ? 'Spacious master suite with wardrobe and attached balcony'
            : 'Ready-to-move suite with wardrobe and study desk',
        },
        {
          id: `img-${Date.now()}-3`,
          title: isHouseListing ? 'Drawing & Dining Hall' : 'Dining & Kitchen Lounge',
          category: 'Dining & Lounge',
          imageUrl: pgDiningImg,
          caption: isHouseListing
            ? 'Expansive living hall with false ceiling and natural light'
            : 'Clean community dining space with food mess',
        },
        {
          id: `img-${Date.now()}-4`,
          title: 'Modern Washroom',
          category: 'Washroom',
          imageUrl: pgBathroomImg,
          caption: 'Attached washroom with 24/7 hot water geyser',
        },
      ],
      rooms: isHouseListing
        ? [
            {
              id: `r-${Date.now()}-1`,
              roomNumber: 'Master Bedroom Suite',
              floorName: '1st Floor',
              roomType: 'Single Private Room',
              totalBeds: 1,
              occupiedBeds: 0,
              rentPerBedMonthly: Math.round((Number(listingMonthlyRent) || 35000) * 0.5),
              securityDeposit: Math.round((Number(listingMonthlyRent) || 35000) * 0.5 * 3),
              furnishing: listingFurnishing,
              hasAttachedBath: true,
              hasBalcony: true,
              hasAirConditioning: true,
              notes: 'King size bed space, ensuite bath, attached balcony',
              imageUrl: apartmentTowerImg,
            },
            {
              id: `r-${Date.now()}-2`,
              roomNumber: 'Second Bedroom / Guest Room',
              floorName: '1st Floor',
              roomType: 'Single Private Room',
              totalBeds: 1,
              occupiedBeds: 0,
              rentPerBedMonthly: Math.round((Number(listingMonthlyRent) || 35000) * 0.5),
              securityDeposit: Math.round((Number(listingMonthlyRent) || 35000) * 0.5 * 3),
              furnishing: listingFurnishing,
              hasAttachedBath: true,
              hasBalcony: false,
              hasAirConditioning: false,
              notes: 'Bright room with wardrobes and cross ventilation',
              imageUrl: pgBedroomImg,
            },
          ]
        : [
            {
              id: `r-${Date.now()}-1`,
              roomNumber: 'Suite 101',
              floorName: 'Ground Floor',
              roomType: 'Single Private Room',
              totalBeds: 1,
              occupiedBeds: 0,
              rentPerBedMonthly: 18000,
              securityDeposit: 36000,
              furnishing: 'Fully Furnished',
              hasAttachedBath: true,
              hasBalcony: true,
              hasAirConditioning: true,
              notes: 'Executive single private room ready for immediate occupancy',
              imageUrl: pgBedroomImg,
            },
            {
              id: `r-${Date.now()}-2`,
              roomNumber: 'Room 102',
              floorName: '1st Floor',
              roomType: 'Double Sharing',
              totalBeds: 2,
              occupiedBeds: 1,
              rentPerBedMonthly: 12500,
              securityDeposit: 25000,
              furnishing: 'Fully Furnished',
              hasAttachedBath: true,
              hasBalcony: false,
              hasAirConditioning: true,
              notes: 'Spacious double sharing room with individual study tables',
              imageUrl: pgBedroomImg,
            },
            {
              id: `r-${Date.now()}-3`,
              roomNumber: 'Room 201',
              floorName: '2nd Floor',
              roomType: 'Triple Sharing',
              totalBeds: 3,
              occupiedBeds: 1,
              rentPerBedMonthly: 9000,
              securityDeposit: 18000,
              furnishing: 'Fully Furnished',
              hasAttachedBath: true,
              hasBalcony: true,
              hasAirConditioning: false,
              notes: 'Triple room with attached balcony and panoramic green views',
              imageUrl: pgBedroomImg,
            },
          ],
    };

    const updatedListings = [newListing, ...listings];
    setListings(updatedListings);
    setCurrentCategoryTab(isHouseListing ? 'rent_house' : 'pg');
    setActiveListingId(newListingId);
    persistListingToProject(newListing);

    // Reset Form
    setListingName('');
    setListingAddress('');
    setImagePreviewUrl('');
    setShowNewListingModal(false);
  };

  // Handle Add New Image to Gallery
  const handleAddNewImage = (e: React.FormEvent) => {
    e.preventDefault();
    const finalImageUrl = imagePreviewUrl || newImageUrl;
    if (!finalImageUrl) return;

    const newGalleryItem: PgGalleryImage = {
      id: `img-${Date.now()}`,
      title: newImageTitle.trim() || `${newImageCategory} Photo`,
      category: newImageCategory,
      imageUrl: finalImageUrl,
      caption: newImageCaption.trim() || `${newImageCategory} view of ${activeListing.name}`,
    };

    const updatedGallery = [newGalleryItem, ...activeListing.gallery];
    const updatedListing: CompletePropertyListing = {
      ...activeListing,
      gallery: updatedGallery,
    };

    setListings(listings.map((l) => (l.id === activeListing.id ? updatedListing : l)));
    persistListingToProject(updatedListing);

    // Reset Form
    setNewImageTitle('');
    setNewImageCaption('');
    setNewImageUrl('');
    setImagePreviewUrl('');
    setShowAddImageModal(false);
  };

  // Handle Delete Image
  const handleDeleteImage = (imageId: string) => {
    if (activeListing.gallery.length <= 1) {
      return;
    }
    const updatedGallery = activeListing.gallery.filter((img) => img.id !== imageId);
    const updatedListing = { ...activeListing, gallery: updatedGallery };
    setListings(listings.map((l) => (l.id === activeListing.id ? updatedListing : l)));
    persistListingToProject(updatedListing);
    if (activeImageIndex !== null && activeImageIndex >= updatedGallery.length) {
      setActiveImageIndex(Math.max(0, updatedGallery.length - 1));
    }
  };

  // Handle Add Room
  const handleAddNewRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNumber.trim()) return;

    const bedsCount =
      newRoomType === 'Single Private Room'
        ? 1
        : newRoomType === 'Double Sharing'
        ? 2
        : newRoomType === 'Triple Sharing'
        ? 3
        : 2;

    const newUnit: PgHouseRoomUnit = {
      id: `r-${Date.now()}`,
      roomNumber: newRoomNumber,
      floorName: newFloorName,
      roomType: newRoomType,
      totalBeds: bedsCount,
      occupiedBeds: 0,
      rentPerBedMonthly: Number(newRent),
      securityDeposit: Number(newDeposit),
      furnishing: 'Fully Furnished',
      hasAttachedBath: newAttachedBath,
      hasBalcony: newBalcony,
      hasAirConditioning: newAC,
      notes: 'Newly added inventory suite',
      imageUrl: newRoomImage || pgBedroomImg,
    };

    const updatedRooms = [newUnit, ...activeListing.rooms];
    const updatedListing = { ...activeListing, rooms: updatedRooms };
    setListings(listings.map((l) => (l.id === activeListing.id ? updatedListing : l)));
    persistListingToProject(updatedListing);

    setNewRoomNumber('');
    setShowAddRoomModal(false);
  };

  // Handle Booking Submit
  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setSelectedBookingRoom(null);
      setBookingName('');
      setBookingPhone('');
      setBookingDate('');
      setBookingNotes('');
    }, 2200);
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 0. DEDICATED CATEGORY SWITCHER: SEPARATE PG & RENT HOUSE                  */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            id="cat-switch-pg"
            onClick={() => {
              setCurrentCategoryTab('pg');
              const firstPg = listings.find(isPgItem);
              if (firstPg) {
                setActiveListingId(firstPg.id);
                persistListingToProject(firstPg);
              }
            }}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition ${
              currentCategoryTab === 'pg'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 ring-2 ring-amber-400'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>🏢 PG &amp; Co-Living Hostels</span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-extrabold ${
              currentCategoryTab === 'pg' ? 'bg-slate-950/20 text-slate-950' : 'bg-amber-500/20 text-amber-300'
            }`}>
              {pgCount}
            </span>
          </button>

          <button
            type="button"
            id="cat-switch-house"
            onClick={() => {
              setCurrentCategoryTab('rent_house');
              const firstHouse = listings.find(isHouseItem);
              if (firstHouse) {
                setActiveListingId(firstHouse.id);
                persistListingToProject(firstHouse);
              }
            }}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition ${
              currentCategoryTab === 'rent_house'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25 ring-2 ring-emerald-400'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>🏡 Rent House &amp; Independent Flats</span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-extrabold ${
              currentCategoryTab === 'rent_house' ? 'bg-slate-950/20 text-slate-950' : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              {houseCount}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => {
              setImagePreviewUrl('');
              setListingType(currentCategoryTab === 'pg' ? 'PG / Co-Living Facility' : 'Independent House / Rental Floors');
              setListingFoodIncluded(currentCategoryTab === 'pg');
              setShowNewListingModal(true);
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 hover:opacity-90 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 shrink-0 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add {currentCategoryTab === 'pg' ? 'PG Facility' : 'Rental House'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 0.1 MULTI-LISTING SELECTOR FOR ACTIVE CATEGORY                            */}
      {/* ========================================================================= */}
      <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 shrink-0 pl-1">
            {currentCategoryTab === 'pg' ? (
              <Building className="w-4 h-4 text-amber-400" />
            ) : (
              <Home className="w-4 h-4 text-emerald-400" />
            )}
            <span>Active {currentCategoryTab === 'pg' ? 'PG Facilities' : 'Rental Properties'}:</span>
          </span>

          {visibleListings.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveListingId(item.id);
                persistListingToProject(item);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition flex items-center gap-1.5 ${
                activeListingId === item.id
                  ? currentCategoryTab === 'pg'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <span>{item.name}</span>
              <span className="text-[10px] opacity-75 font-mono">
                {currentCategoryTab === 'pg'
                  ? `(${item.rooms.length} Suites)`
                  : `(${item.bhkConfig || `${item.rooms.length} Rooms`})`}
              </span>
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-400 font-mono hidden md:block shrink-0">
          Viewing: <span className="text-white font-bold">{currentCategoryTab === 'pg' ? 'PG & Co-Living' : 'Rent House'}</span> • Direct Owner / Manager
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. TOP HEADER & DIRECT ACTION BAR                                         */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {currentCategoryTab === 'pg' ? (
                <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-mono px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  🏢 VERIFIED PG &amp; CO-LIVING
                </span>
              ) : (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  🏡 VERIFIED INDEPENDENT HOUSE &amp; FLAT
                </span>
              )}
              <span className="bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[11px] font-mono px-2.5 py-0.5 rounded-full font-semibold">
                {activeListing.bbmpApprovalKhata}
              </span>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-mono px-2.5 py-0.5 rounded-full font-semibold">
                ZERO BROKERAGE
              </span>
              {currentCategoryTab === 'rent_house' && activeListing.bhkConfig && (
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[11px] font-mono px-2.5 py-0.5 rounded-full font-bold">
                  {activeListing.bhkConfig}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              {activeListing.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-300">
              <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                {activeListing.locationAddress}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300 font-semibold">{activeListing.totalFloors}</span>
              <span className="text-slate-500">•</span>
              {currentCategoryTab === 'pg' ? (
                <>
                  <span className="text-emerald-400 font-semibold">{totalBeds} Total Beds</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-sky-400 font-semibold">{activeListing.genderCategory}</span>
                </>
              ) : (
                <>
                  <span className="text-emerald-400 font-semibold">{activeListing.carpetAreaSqFt ? `${activeListing.carpetAreaSqFt} sq.ft Built-up` : `${activeListing.rooms.length} Rooms`}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-sky-400 font-semibold">{activeListing.furnishingType || 'Semi-Furnished'}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-amber-300 font-semibold">{activeListing.tenantPreference || 'Family & Tech Professionals'}</span>
                </>
              )}
            </div>
          </div>

          {/* Quick CTAs */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setImagePreviewUrl('');
                setShowAddImageModal(true);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-600/20 transition"
            >
              <ImagePlus className="w-4 h-4" />
              <span>+ Add Image</span>
            </button>

            <a
              href="#google-live-section"
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-400" />
              <span>Google Live Map</span>
            </a>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Inquiry</span>
            </a>

            <button
              type="button"
              onClick={() => setShowContactModal(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Phone className="w-3.5 h-3.5 text-rose-400" />
              <span>Call Manager</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAddRoomModal(true)}
              className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{currentCategoryTab === 'pg' ? 'Add Room' : 'Add Unit/Floor'}</span>
            </button>
          </div>
        </div>

        {/* Tailored Performance HUD for PG vs Rent House */}
        {currentCategoryTab === 'pg' ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-5 border-t border-slate-800">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[11px] text-slate-400 font-medium block">Total Bed Capacity</span>
              <div className="text-lg font-bold text-white mt-0.5 flex items-center gap-1.5">
                <Bed className="w-4 h-4 text-amber-400" />
                <span>{totalBeds} Beds</span>
                <span className="text-xs text-slate-500 font-normal">({rooms.length} Suites)</span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[11px] text-slate-400 font-medium block">Current Occupancy</span>
              <div className="text-lg font-bold text-emerald-400 mt-0.5 flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>{occupancyRate}%</span>
                <span className="text-xs text-slate-400 font-normal">({occupiedBeds} occupied)</span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[11px] text-slate-400 font-medium block">Vacant Beds Available</span>
              <div className="text-lg font-bold text-sky-400 mt-0.5 flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>{availableBeds} Ready to Move</span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[11px] text-slate-400 font-medium block">Gross Monthly Rental</span>
              <div className="text-lg font-bold text-amber-300 mt-0.5">
                {formatCurrency(monthlyGrossYield, currency)}/mo
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-5 border-t border-slate-800">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[11px] text-slate-400 font-medium block">House Typology &amp; Area</span>
              <div className="text-lg font-bold text-white mt-0.5 flex items-center gap-1.5">
                <Home className="w-4 h-4 text-emerald-400" />
                <span>{activeListing.bhkConfig || '3 BHK Flat'}</span>
                <span className="text-xs text-slate-400 font-normal">({activeListing.carpetAreaSqFt || 1650} sq.ft)</span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[11px] text-slate-400 font-medium block">Monthly House Rent</span>
              <div className="text-lg font-bold text-emerald-400 mt-0.5">
                {formatCurrency(activeListing.monthlyRentTotal || 46000, currency)}/mo
                {activeListing.maintenanceMonthly ? (
                  <span className="text-xs text-slate-400 font-normal block">
                    + {formatCurrency(activeListing.maintenanceMonthly, currency)} Maint.
                  </span>
                ) : null}
              </div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[11px] text-slate-400 font-medium block">Security Deposit</span>
              <div className="text-lg font-bold text-sky-400 mt-0.5 flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>
                  {formatCurrency((activeListing.monthlyRentTotal || 46000) * (activeListing.depositMonths || 3), currency)}
                </span>
                <span className="text-xs text-slate-400 font-normal">({activeListing.depositMonths || 3} Mo.)</span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[11px] text-slate-400 font-medium block">Parking &amp; Orientation</span>
              <div className="text-sm font-bold text-amber-300 mt-1 truncate" title={`${activeListing.facingVastu || 'East Facing'} • ${activeListing.parkingDetails || '1 Car + 2 Bikes'}`}>
                {activeListing.facingVastu || 'East Facing Vastu'}
                <span className="text-xs text-slate-400 block font-normal truncate">
                  {activeListing.parkingDetails || '1 Car + 2 Bikes'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. VISUAL PHOTO SHOWCASE (5-TILE MOSAIC + LIGHTBOX + ADD IMAGE CTA)       */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-rose-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              Property Photo Gallery &amp; Living Spaces
            </h2>
            <span className="text-xs text-slate-400 font-mono">({gallery.length} High-Res Images)</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setImagePreviewUrl('');
                setShowAddImageModal(true);
              }}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
            >
              <ImagePlus className="w-3.5 h-3.5" />
              <span>+ Add Image</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveImageIndex(0)}
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"
            >
              <span>View Full Lightbox</span>
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 5-Photo Mosaic Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 h-[340px] sm:h-[420px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
          {/* Main Hero Image */}
          <div
            onClick={() => setActiveImageIndex(0)}
            className="md:col-span-2 relative group cursor-pointer overflow-hidden bg-slate-950 h-full"
          >
            <img
              src={gallery[0]?.imageUrl}
              alt={gallery[0]?.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />
            <div className="absolute bottom-3.5 left-3.5 right-3.5 text-white">
              <span className="bg-rose-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-1 inline-block">
                {gallery[0]?.category}
              </span>
              <h3 className="text-sm sm:text-base font-bold drop-shadow">
                {gallery[0]?.title}
              </h3>
              <p className="text-xs text-slate-300 drop-shadow line-clamp-1">
                {gallery[0]?.caption}
              </p>
            </div>
          </div>

          {/* 4 Secondary Photo Tiles */}
          <div className="md:col-span-2 grid grid-cols-2 gap-2.5 h-full">
            {gallery.slice(1, 5).map((img, idx) => (
              <div
                key={img.id}
                onClick={() => setActiveImageIndex(idx + 1)}
                className="relative group cursor-pointer overflow-hidden bg-slate-950 h-full rounded-lg"
              >
                <img
                  src={img.imageUrl}
                  alt={img.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition" />
                <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                  <span className="bg-slate-900/80 text-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider mb-0.5 inline-block">
                    {img.category}
                  </span>
                  <div className="text-xs font-semibold drop-shadow line-clamp-1">
                    {img.title}
                  </div>
                </div>

                {/* Overlaid "+N More Photos" on the last thumbnail */}
                {idx === 3 && gallery.length > 5 && (
                  <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white p-2">
                    <ImageIcon className="w-5 h-5 text-rose-400 mb-1" />
                    <span className="text-xs font-bold">+{gallery.length - 4} More</span>
                    <span className="text-[10px] text-slate-300">Open Gallery</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. GOOGLE LIVE INTERACTIVE MAP, STREET VIEW & COMMUTE RADAR               */}
      {/* ========================================================================= */}
      <div id="google-live-section" className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-950/40 to-slate-900 border border-blue-900/40 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Google Live Location, Street View &amp; Commute Radar
                </h3>
                <span className="bg-blue-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded font-mono">
                  LIVE NAVIGATION
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Explore surrounding roads, street level view, and live driving ETA to major Bangalore IT corridors.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setMapType('roadmap')}
                className={`px-3 py-1.5 text-xs rounded-md font-semibold transition ${
                  mapType === 'roadmap'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Roadmap
              </button>
              <button
                type="button"
                onClick={() => setMapType('satellite')}
                className={`px-3 py-1.5 text-xs rounded-md font-semibold transition ${
                  mapType === 'satellite'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Satellite
              </button>
            </div>

            <a
              href={googleMapsLiveSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <span>Open on Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Live Map Display & Commute Hub Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Real Interactive Google Map Embed */}
          <div className="lg:col-span-2 relative rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-slate-950 min-h-[360px]">
            <iframe
              title="Google Live Property Map"
              src={googleMapEmbedUrl}
              width="100%"
              height="100%"
              className="w-full h-[360px] lg:h-[420px] border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />

            {/* Live Street View Overlay Button */}
            <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-2">
              <a
                href={googleMapsStreetViewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-900/90 hover:bg-slate-900 text-white backdrop-blur px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-700 shadow-lg transition"
              >
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span>Google Street View 360°</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>

              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600/90 hover:bg-blue-600 text-white backdrop-blur px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Get Driving Directions</span>
              </a>
            </div>
          </div>

          {/* Commute Radar Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Navigation className="w-4 h-4 text-emerald-400" />
                  Live Commute Radar
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Google ETA</span>
              </div>

              <div className="space-y-2.5">
                {TECH_PARK_PROXIMITY.map((item) => (
                  <div
                    key={item.name}
                    className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-slate-200 line-clamp-1">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>{item.distance}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-medium">{item.travelTime}</span>
                        <span>•</span>
                        <span className="text-slate-500">{item.transport}</span>
                      </div>
                    </div>

                    <a
                      href={`https://www.google.com/maps/dir/?api=1&origin=${encodedAddress}&destination=${encodeURIComponent(
                        item.query
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      title={`Directions to ${item.name}`}
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Real-time traffic is automatically factored when opening live routes.</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. ROOM INVENTORY / HOUSE FLOOR LAYOUT LISTINGS                           */}
      {/* ========================================================================= */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              {currentCategoryTab === 'pg' ? (
                <>
                  <Bed className="w-4 h-4 text-amber-400" />
                  <span>PG Room Inventory &amp; Bed Availability</span>
                  <span className="text-xs font-mono text-slate-400">({rooms.length} Suites Configured)</span>
                </>
              ) : (
                <>
                  <Home className="w-4 h-4 text-emerald-400" />
                  <span>House Floor Plan &amp; Bedroom Suites</span>
                  <span className="text-xs font-mono text-slate-400">({rooms.length} Rooms / Units)</span>
                </>
              )}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {currentCategoryTab === 'pg'
                ? 'Choose your preferred sharing type, inspect room amenities, and book a site visit.'
                : 'Explore full house layout, room dimensions, attached baths, and private balconies.'}
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition ${
                selectedFilter === 'all'
                  ? currentCategoryTab === 'pg'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {currentCategoryTab === 'pg' ? 'All Suites' : 'All Rooms'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('single')}
              className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition ${
                selectedFilter === 'single'
                  ? currentCategoryTab === 'pg'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {currentCategoryTab === 'pg' ? 'Single Private' : 'Master Suite'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('double')}
              className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition ${
                selectedFilter === 'double'
                  ? currentCategoryTab === 'pg'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {currentCategoryTab === 'pg' ? 'Double Sharing' : 'Bedroom 2'}
            </button>
            {currentCategoryTab === 'pg' && (
              <button
                type="button"
                onClick={() => setSelectedFilter('triple')}
                className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition ${
                  selectedFilter === 'triple'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Triple Sharing
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedFilter('available')}
              className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition ${
                selectedFilter === 'available'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Vacant Ready
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('ac')}
              className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition ${
                selectedFilter === 'ac'
                  ? 'bg-sky-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              AC Only
            </button>
          </div>
        </div>

        {/* Room Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRooms.map((room) => {
            const isVacant = room.totalBeds - room.occupiedBeds > 0;
            const availableBedCount = room.totalBeds - room.occupiedBeds;

            return (
              <div
                key={room.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl hover:border-slate-700 transition flex flex-col justify-between"
              >
                {/* Room Card Top Image */}
                <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden group">
                  <img
                    src={room.imageUrl || (currentCategoryTab === 'rent_house' ? floorVillaImg : pgBedroomImg)}
                    alt={room.roomNumber}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                  {/* Floor Tag */}
                  <div className="absolute top-3 left-3 bg-slate-900/90 text-slate-200 text-[10px] font-mono font-bold px-2.5 py-1 rounded-md backdrop-blur border border-slate-700">
                    {room.floorName}
                  </div>

                  {/* Availability Badge */}
                  <div className="absolute top-3 right-3">
                    {isVacant ? (
                      <span className="bg-emerald-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded shadow">
                        {currentCategoryTab === 'pg'
                          ? `${availableBedCount} ${availableBedCount === 1 ? 'Bed Vacant' : 'Beds Vacant'}`
                          : 'Ready to Move'}
                      </span>
                    ) : (
                      <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                        Occupied
                      </span>
                    )}
                  </div>

                  {/* Room No & Typology Header */}
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <div className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                      {room.roomType}
                    </div>
                    <div className="text-lg font-extrabold">{room.roomNumber}</div>
                  </div>
                </div>

                {/* Details Body */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Price & Deposit */}
                    <div className="flex items-baseline justify-between border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-xl font-black text-white">
                          {formatCurrency(room.rentPerBedMonthly, currency)}
                        </span>
                        <span className="text-xs text-slate-400 ml-1">
                          {currentCategoryTab === 'pg' ? '/bed/month' : '/room share'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block">Security Deposit</span>
                        <span className="text-xs font-semibold text-slate-300">
                          {formatCurrency(room.securityDeposit, currency)} ({activeListing.depositMonths} Mos)
                        </span>
                      </div>
                    </div>

                    {/* Features Chips */}
                    <div className="flex flex-wrap gap-1.5 pt-3">
                      <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded font-medium">
                        {room.furnishing}
                      </span>
                      {room.hasAttachedBath && (
                        <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded font-medium">
                          ✓ Attached Bath
                        </span>
                      )}
                      {room.hasAirConditioning && (
                        <span className="bg-sky-500/10 text-sky-300 border border-sky-500/30 text-[10px] px-2 py-0.5 rounded font-medium">
                          ✓ Split AC
                        </span>
                      )}
                      {room.hasBalcony && (
                        <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded font-medium">
                          ✓ Balcony
                        </span>
                      )}
                    </div>

                    {room.notes && (
                      <p className="text-xs text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">
                        {room.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-800 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedBookingRoom(room)}
                      className={`flex-1 font-bold py-2.5 rounded-xl text-xs transition shadow-md ${
                        currentCategoryTab === 'pg'
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                      }`}
                    >
                      {currentCategoryTab === 'pg' ? 'Book Visit / Bed' : 'Schedule House Tour'}
                    </button>

                    <a
                      href={`https://wa.me/${activeListing.contactPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `Hi, I would like to inquire about ${room.roomNumber} (${room.roomType}) at ${activeListing.name}. Rent: ${formatCurrency(
                          room.rentPerBedMonthly,
                          currency
                        )}.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl transition flex items-center justify-center"
                      title="WhatsApp Inquiry for this room"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. FULL AMENITIES & SPECIFICATIONS HUB (PG vs RENT HOUSE)                  */}
      {/* ========================================================================= */}
      {currentCategoryTab === 'pg' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Living Amenities */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Included Amenities &amp; Infrastructure</span>
              </h3>
              <span className="text-xs text-emerald-400 font-semibold">100% Inclusive</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                <Wifi className="w-5 h-5 text-blue-400" />
                <div className="text-xs font-bold text-white">300 Mbps Fiber</div>
                <div className="text-[10px] text-slate-400">Dual-band mesh router on every floor</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                <Zap className="w-5 h-5 text-amber-400" />
                <div className="text-xs font-bold text-white">100% DG Backup</div>
                <div className="text-[10px] text-slate-400">Automatic generator switchover</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                <Shield className="w-5 h-5 text-emerald-400" />
                <div className="text-xs font-bold text-white">24/7 CCTV &amp; Guard</div>
                <div className="text-[10px] text-slate-400">Night surveillance &amp; warden</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                <Key className="w-5 h-5 text-rose-400" />
                <div className="text-xs font-bold text-white">Biometric Lock</div>
                <div className="text-[10px] text-slate-400">Fingerprint access after hours</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                <Droplets className="w-5 h-5 text-sky-400" />
                <div className="text-xs font-bold text-white">RO Water Plant</div>
                <div className="text-[10px] text-slate-400">Tested mineral drinking water</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                <Sun className="w-5 h-5 text-amber-400" />
                <div className="text-xs font-bold text-white">Solar Water Heater</div>
                <div className="text-[10px] text-slate-400">Continuous hot water supply</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                <Car className="w-5 h-5 text-purple-400" />
                <div className="text-xs font-bold text-white">Dedicated Parking</div>
                <div className="text-[10px] text-slate-400">Two-wheelers &amp; visitor cars</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                <Dumbbell className="w-5 h-5 text-red-400" />
                <div className="text-xs font-bold text-white">Rooftop Fitness</div>
                <div className="text-[10px] text-slate-400">Open-air calisthenics &amp; yoga deck</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                <Utensils className="w-5 h-5 text-teal-400" />
                <div className="text-xs font-bold text-white">Daily Housekeeping</div>
                <div className="text-[10px] text-slate-400">Room mop &amp; washroom cleaning</div>
              </div>
            </div>
          </div>

          {/* Daily Food Mess Schedule */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Utensils className="w-4 h-4 text-emerald-400" />
                <span>3 Times Food Mess &amp; Kitchen Menu</span>
              </h3>
              <span className="text-xs text-amber-400 font-semibold">Home-style Hygienic</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 font-bold shrink-0">
                  07:30 - 09:30
                </div>
                <div>
                  <div className="font-bold text-white">Breakfast &amp; Filter Coffee / Tea</div>
                  <div className="text-slate-400 mt-0.5">
                    Masala Dosa, Idli-Vada Sambar, Poha, Aloo Paratha, Upma with coconut chutney.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold shrink-0">
                  12:30 - 14:30
                </div>
                <div>
                  <div className="font-bold text-white">Lunch (Tiffin Box Packing Option)</div>
                  <div className="text-slate-400 mt-0.5">
                    Hot Phulkas / Rotis, Steamed Sona Masoori Rice, Dal Tadka, Seasonal Veg Curry, Curd &amp; Salad.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 font-bold shrink-0">
                  20:00 - 22:30
                </div>
                <div>
                  <div className="font-bold text-white">Dinner &amp; Sunday Special Feast</div>
                  <div className="text-slate-400 mt-0.5">
                    Paneer Butter Masala / Chicken Biryani (Sunday), Veg Pulao, Chapati, Rasam &amp; Sweet Dessert.
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Notice Period: <strong>{activeListing.noticePeriodDays} Days</strong></span>
                <span>Gate Closing: <strong>{activeListing.gateClosingTime}</strong></span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Rent House Key Architectural & Utility Specifications */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Home className="w-4 h-4 text-emerald-400" />
                <span>House Specifications &amp; Architectural Quality</span>
              </h3>
              <span className="text-xs text-emerald-400 font-semibold">Independent Living</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                <div className="flex items-center gap-2 text-white text-xs font-bold">
                  <Utensils className="w-4 h-4 text-amber-400" />
                  <span>Modular Kitchen</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Italian layout, Faber Chimney, Granite counters, and Piped Natural Gas (GAIL).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                <div className="flex items-center gap-2 text-white text-xs font-bold">
                  <Car className="w-4 h-4 text-emerald-400" />
                  <span>Private Parking &amp; EV</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {activeListing.parkingDetails || '1 Covered Car Parking + 2 Bike Bays with EV Charging'}.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                <div className="flex items-center gap-2 text-white text-xs font-bold">
                  <Droplets className="w-4 h-4 text-sky-400" />
                  <span>24/7 Water Supply</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {activeListing.waterSupply || 'Cauvery Water Connection + On-site Borewell & 5,000L Sump'}.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                <div className="flex items-center gap-2 text-white text-xs font-bold">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span>Separate BESCOM Meter</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Direct official government tariff billing. No inflated commercial sub-meter rates.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                <div className="flex items-center gap-2 text-white text-xs font-bold">
                  <Sun className="w-4 h-4 text-amber-300" />
                  <span>Vastu &amp; Natural Light</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {activeListing.facingVastu || 'East Facing Entrance'} with high ceiling and cross ventilation.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                <div className="flex items-center gap-2 text-white text-xs font-bold">
                  <Shield className="w-4 h-4 text-rose-400" />
                  <span>Power Backup</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {activeListing.powerBackupStatus || 'Full DG Power Backup (Fans, Lights, TV & Refrigerator)'}.
                </p>
              </div>
            </div>
          </div>

          {/* Legal Lease & Tenant Terms */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal-400" />
                <span>Lease Agreement &amp; Society Terms</span>
              </h3>
              <span className="text-xs text-amber-400 font-semibold">Transparent Terms</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 font-bold shrink-0">
                  Agreement
                </div>
                <div>
                  <div className="font-bold text-white">
                    {activeListing.leasePeriodMonths || 11}-Month Registered Agreement
                  </div>
                  <div className="text-slate-400 mt-0.5">
                    Standard Karnataka stamp paper agreement, 5% annual increment, 1-month lock-in period.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 font-bold shrink-0">
                  Deposit
                </div>
                <div>
                  <div className="font-bold text-white">
                    {activeListing.depositMonths || 3} Months Refundable Security Deposit
                  </div>
                  <div className="text-slate-400 mt-0.5">
                    Low deposit policy directly with owner. 100% bank-transferred refund upon checkout.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 font-bold shrink-0">
                  Policy
                </div>
                <div>
                  <div className="font-bold text-white">
                    {activeListing.petPolicy || 'Pet Friendly Living'} &amp; No Curfew
                  </div>
                  <div className="text-slate-400 mt-0.5">
                    Preference: {activeListing.tenantPreference || 'Working Professionals & Small Families'}. Independent access 24/7.
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Notice Period: <strong>{activeListing.noticePeriodDays} Days</strong></span>
                <span>Gate Access: <strong>{activeListing.gateClosingTime}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: FULL SCREEN IMAGE LIGHTBOX VIEWER WITH DELETE OPTION             */}
      {/* ========================================================================= */}
      {activeImageIndex !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between text-white pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400">
                Photo {activeImageIndex + 1} of {gallery.length}
              </span>
              <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                {gallery[activeImageIndex]?.category}
              </span>
              <h4 className="text-sm sm:text-base font-bold hidden sm:inline">
                {gallery[activeImageIndex]?.title}
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (gallery[activeImageIndex]) {
                    handleDeleteImage(gallery[activeImageIndex].id);
                  }
                }}
                className="p-2 rounded-full bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition flex items-center gap-1 text-xs px-3"
                title="Delete this image"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span className="hidden sm:inline">Delete Photo</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveImageIndex(null)}
                className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Viewer with Prev/Next */}
          <div className="relative flex-1 flex items-center justify-center my-4">
            <button
              type="button"
              onClick={() =>
                setActiveImageIndex((prev) =>
                  prev !== null ? (prev === 0 ? gallery.length - 1 : prev - 1) : 0
                )
              }
              className="absolute left-2 sm:left-4 z-10 p-3 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white border border-slate-700 shadow-xl transition"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <img
              src={gallery[activeImageIndex]?.imageUrl}
              alt={gallery[activeImageIndex]?.title}
              className="max-h-[68vh] max-w-full object-contain rounded-xl shadow-2xl"
            />

            <button
              type="button"
              onClick={() =>
                setActiveImageIndex((prev) =>
                  prev !== null ? (prev === gallery.length - 1 ? 0 : prev + 1) : 0
                )
              }
              className="absolute right-2 sm:right-4 z-10 p-3 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white border border-slate-700 shadow-xl transition"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Footer Caption & Thumbnails */}
          <div className="space-y-3 max-w-4xl mx-auto w-full">
            <p className="text-center text-xs sm:text-sm text-slate-300">
              {gallery[activeImageIndex]?.caption}
            </p>

            {/* Thumbnail Strip */}
            <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
              {gallery.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-14 h-10 rounded-lg overflow-hidden border-2 shrink-0 transition ${
                    activeImageIndex === idx
                      ? 'border-amber-400 scale-105'
                      : 'border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img.imageUrl} alt={img.title} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD NEW IMAGE (FILE UPLOAD, URL, OR ARCHITECTURE PRESET)         */}
      {/* ========================================================================= */}
      {showAddImageModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ImagePlus className="w-5 h-5 text-rose-400" />
                  <span>Add Photo to Property Gallery</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Upload high-res photos for {activeListing.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddImageModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewImage} className="p-5 space-y-4">
              {/* Method Switcher */}
              <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setImageUploadMode('file')}
                  className={`py-1.5 rounded-lg font-semibold transition ${
                    imageUploadMode === 'file'
                      ? 'bg-rose-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setImageUploadMode('url')}
                  className={`py-1.5 rounded-lg font-semibold transition ${
                    imageUploadMode === 'url'
                      ? 'bg-rose-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Image URL
                </button>
                <button
                  type="button"
                  onClick={() => setImageUploadMode('preset')}
                  className={`py-1.5 rounded-lg font-semibold transition ${
                    imageUploadMode === 'preset'
                      ? 'bg-rose-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Pick Preset
                </button>
              </div>

              {/* Mode 1: File Upload */}
              {imageUploadMode === 'file' && (
                <div>
                  <label className="text-xs text-slate-300 block mb-1.5 font-medium">
                    Choose Image File from Computer / Device
                  </label>
                  <label className="border-2 border-dashed border-slate-700 hover:border-amber-400 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition bg-slate-950 group">
                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-amber-400 transition mb-1" />
                    <span className="text-xs text-slate-200 font-semibold">Click to browse image</span>
                    <span className="text-[10px] text-slate-500">Supports JPG, PNG, WEBP</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setImagePreviewUrl(event.target?.result as string);
                            if (!newImageTitle) {
                              setNewImageTitle(file.name.replace(/\.[^/.]+$/, ''));
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              )}

              {/* Mode 2: Direct URL */}
              {imageUploadMode === 'url' && (
                <div>
                  <label className="text-xs text-slate-300 block mb-1.5 font-medium">
                    Paste Image Link / Web URL
                  </label>
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => {
                      setNewImageUrl(e.target.value);
                      setImagePreviewUrl(e.target.value);
                    }}
                    placeholder="https://images.unsplash.com/... or image web address"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-rose-400"
                  />
                </div>
              )}

              {/* Mode 3: Presets */}
              {imageUploadMode === 'preset' && (
                <div>
                  <label className="text-xs text-slate-300 block mb-1.5 font-medium">
                    Select an Architecture High-Res Preset
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_IMAGES.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setImagePreviewUrl(preset.url);
                          setNewImageCategory(preset.category);
                          if (!newImageTitle) setNewImageTitle(preset.label);
                        }}
                        className={`p-1 rounded-lg border text-left overflow-hidden transition ${
                          imagePreviewUrl === preset.url
                            ? 'border-rose-500 ring-2 ring-rose-500/30'
                            : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="w-full h-12 object-cover rounded"
                        />
                        <div className="text-[10px] font-semibold text-slate-300 line-clamp-1 mt-1">
                          {preset.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Preview Box */}
              {imagePreviewUrl && (
                <div className="relative rounded-xl overflow-hidden border border-slate-700 aspect-[16/9] bg-slate-950">
                  <img
                    src={imagePreviewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-slate-900/90 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                    PREVIEW
                  </div>
                </div>
              )}

              {/* Category & Title */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-medium">Category</label>
                  <select
                    value={newImageCategory}
                    onChange={(e) =>
                      setNewImageCategory(
                        e.target.value as 'Exterior' | 'Bedroom' | 'Dining & Lounge' | 'Washroom' | 'Terrace'
                      )
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-rose-400"
                  >
                    <option value="Bedroom">Bedroom Suite</option>
                    <option value="Exterior">Exterior Facade</option>
                    <option value="Dining & Lounge">Dining & Lounge</option>
                    <option value="Washroom">Washroom</option>
                    <option value="Terrace">Terrace Garden</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-medium">Photo Title</label>
                  <input
                    type="text"
                    value={newImageTitle}
                    onChange={(e) => setNewImageTitle(e.target.value)}
                    placeholder="e.g. Deluxe Room Suite"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-rose-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1 font-medium">Caption / Description</label>
                <input
                  type="text"
                  value={newImageCaption}
                  onChange={(e) => setNewImageCaption(e.target.value)}
                  placeholder="e.g. Spacious airy bedroom with attached private balcony..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-rose-400"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={!imagePreviewUrl && !newImageUrl}
                  className="flex-1 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-lg shadow-rose-600/20"
                >
                  Save &amp; Add to Gallery
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddImageModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CREATE NEW PROPERTY LISTING                                      */}
      {/* ========================================================================= */}
      {showNewListingModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>Create New Property Listing</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Add a new PG, co-living house, or rental property to your portfolio
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewListingModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewListing} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold">
                  Property Name / Title *
                </label>
                <input
                  type="text"
                  required
                  value={listingName}
                  onChange={(e) => setListingName(e.target.value)}
                  placeholder="e.g. PalmGrove Executive Co-Living Suites"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-semibold">
                    Property Typology
                  </label>
                  <select
                    value={listingType}
                    onChange={(e) =>
                      setListingType(e.target.value as CompletePropertyListing['propertyType'])
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="PG / Co-Living Facility">PG / Co-Living Facility</option>
                    <option value="Independent House / Rental Floors">Independent House / Floors</option>
                    <option value="Hybrid PG & House">Hybrid PG &amp; House</option>
                    <option value="Luxury Villa & Apartments">Luxury Villa &amp; Apartments</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-semibold">
                    Gender / Resident Category
                  </label>
                  <select
                    value={listingGender}
                    onChange={(e) =>
                      setListingGender(e.target.value as CompletePropertyListing['genderCategory'])
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="Coliving (Unisex)">Coliving (Unisex)</option>
                    <option value="Gents PG">Gents PG</option>
                    <option value="Ladies PG">Ladies PG</option>
                    <option value="Family & Working Professionals">Family &amp; Working</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold">
                  Full Street Address (for Google Live Map) *
                </label>
                <input
                  type="text"
                  required
                  value={listingAddress}
                  onChange={(e) => setListingAddress(e.target.value)}
                  placeholder="e.g. 19th Main Road, Sector 4, HSR Layout, Bangalore 560102"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-semibold">
                    Bangalore Zone / Region
                  </label>
                  <input
                    type="text"
                    value={listingZone}
                    onChange={(e) => setListingZone(e.target.value)}
                    placeholder="e.g. South Bangalore / ORR"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-semibold">
                    Total Elevation / Floors
                  </label>
                  <input
                    type="text"
                    value={listingFloors}
                    onChange={(e) => setListingFloors(e.target.value)}
                    placeholder="e.g. G+3 Floors"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-semibold">
                    Estate Manager Name
                  </label>
                  <input
                    type="text"
                    value={listingContactName}
                    onChange={(e) => setListingContactName(e.target.value)}
                    placeholder="e.g. S. Gouse"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-semibold">
                    Contact Phone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={listingContactPhone}
                    onChange={(e) => setListingContactPhone(e.target.value)}
                    placeholder="+91 8073947241"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Conditional Fields: Rent House vs PG */}
              {listingType === 'Independent House / Rental Floors' || listingType === 'Luxury Villa & Apartments' ? (
                <div className="space-y-3 p-3 rounded-xl bg-slate-950 border border-emerald-500/20">
                  <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5" />
                    <span>Independent House / Floor Configuration</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">BHK Typology</label>
                      <select
                        value={listingBhk}
                        onChange={(e) => setListingBhk(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-400"
                      >
                        <option value="1 BHK Floor">1 BHK Floor</option>
                        <option value="2 BHK House">2 BHK House</option>
                        <option value="3 BHK Duplex">3 BHK Duplex / House</option>
                        <option value="4 BHK Villa">4 BHK Luxury Villa</option>
                        <option value="Independent Full Building">Independent Full Building</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Carpet Area (sq.ft)</label>
                      <input
                        type="number"
                        value={listingCarpetArea}
                        onChange={(e) => setListingCarpetArea(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Monthly Rent (₹ Total House)</label>
                      <input
                        type="number"
                        value={listingMonthlyRent}
                        onChange={(e) => setListingMonthlyRent(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Society Maintenance (₹)</label>
                      <input
                        type="number"
                        value={listingMaintenance}
                        onChange={(e) => setListingMaintenance(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Furnishing Status</label>
                      <select
                        value={listingFurnishing}
                        onChange={(e) =>
                          setListingFurnishing(
                            e.target.value as 'Fully Furnished' | 'Semi-Furnished' | 'Unfurnished'
                          )
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-400"
                      >
                        <option value="Semi-Furnished">Semi-Furnished (Wardrobes &amp; Kitchen)</option>
                        <option value="Fully Furnished">Fully Furnished (Beds &amp; Appliances)</option>
                        <option value="Unfurnished">Unfurnished</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Parking Allocation</label>
                      <input
                        type="text"
                        value={listingParking}
                        onChange={(e) => setListingParking(e.target.value)}
                        placeholder="1 Car + 2 Bikes"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Vastu / Facing Orientation</label>
                    <input
                      type="text"
                      value={listingVastu}
                      onChange={(e) => setListingVastu(e.target.value)}
                      placeholder="e.g. East Facing Main Entrance (100% Vastu)"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>
              ) : (
                /* Food Mess Options for PG */
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer font-semibold">
                    <input
                      type="checkbox"
                      checked={listingFoodIncluded}
                      onChange={(e) => setListingFoodIncluded(e.target.checked)}
                      className="rounded bg-slate-800 text-amber-500 focus:ring-0"
                    />
                    <span>Include 3-Times Food Mess by Default</span>
                  </label>

                  {listingFoodIncluded && (
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Meal Menu Details
                      </label>
                      <input
                        type="text"
                        value={listingFoodType}
                        onChange={(e) => setListingFoodType(e.target.value)}
                        placeholder="e.g. North & South Indian 3 Times Daily"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-extrabold py-2.5 rounded-xl text-xs transition shadow-lg shadow-amber-500/20"
                >
                  Publish &amp; Open Listing
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewListingModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: SCHEDULE VISIT / BOOK BED MODAL                                  */}
      {/* ========================================================================= */}
      {selectedBookingRoom && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  Schedule Visit / Book Bed
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedBookingRoom.roomNumber} • {selectedBookingRoom.roomType}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBookingRoom(null)}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {bookingSuccess ? (
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Visit Scheduled Successfully!</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Your request has been forwarded to Estate Manager <strong>{activeListing.contactPerson}</strong> at <strong>{activeListing.contactPhone}</strong>.
                  </p>
                </div>
                <a
                  href={`https://wa.me/${activeListing.contactPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Hi ${activeListing.contactPerson}, I just submitted a visit request for ${selectedBookingRoom.roomNumber} at ${activeListing.name}. Looking forward to seeing the property!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/20"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Connect Immediately on WhatsApp (+91 8073947241)</span>
                </a>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="p-5 space-y-3.5">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Monthly Rent</span>
                    <span className="font-bold text-amber-300 text-sm">
                      {formatCurrency(selectedBookingRoom.rentPerBedMonthly, currency)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">Security Deposit</span>
                    <span className="font-semibold text-slate-200">
                      {formatCurrency(selectedBookingRoom.securityDeposit, currency)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={bookingName}
                    onChange={(e) => setBookingName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Phone / WhatsApp Number *</label>
                  <input
                    type="tel"
                    required
                    value={bookingPhone}
                    onChange={(e) => setBookingPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Preferred Move-in / Visit Date</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Special Requirements (Optional)</label>
                  <textarea
                    rows={2}
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    placeholder="e.g. Veg food only, dedicated bike parking, AC preference..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400 resize-none"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition"
                  >
                    Confirm Visit Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedBookingRoom(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: CONTACT ESTATE OWNER / MANAGER                                   */}
      {/* ========================================================================= */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Phone className="w-4 h-4 text-rose-400" />
                <span>Contact Estate Owner</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto mb-2">
                <Building className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">{activeListing.contactPerson}</h4>
              <p className="text-xs text-slate-400">{activeListing.locationAddress}</p>
              <div className="text-base font-mono font-bold text-amber-300 pt-1">
                {activeListing.contactPhone}
              </div>
            </div>

            <div className="space-y-2">
              <a
                href={`tel:${activeListing.contactPhone.replace(/\s+/g, '')}`}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition"
              >
                <Phone className="w-4 h-4" />
                <span>Call Directly Now</span>
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: ADD ROOM INVENTORY (WITH PHOTO SELECTION)                        */}
      {/* ========================================================================= */}
      {showAddRoomModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Add Room Inventory Unit</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddRoomModal(false)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewRoom} className="p-5 space-y-3 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Room No. / Name *</label>
                  <input
                    type="text"
                    required
                    value={newRoomNumber}
                    onChange={(e) => setNewRoomNumber(e.target.value)}
                    placeholder="e.g. Room 204"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Floor Level</label>
                  <select
                    value={newFloorName}
                    onChange={(e) => setNewFloorName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="Ground Floor">Ground Floor</option>
                    <option value="1st Floor">1st Floor</option>
                    <option value="2nd Floor">2nd Floor</option>
                    <option value="3rd Floor">3rd Floor</option>
                    <option value="Rooftop Penthouse">Rooftop Penthouse</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Sharing Typology</label>
                <select
                  value={newRoomType}
                  onChange={(e) => setNewRoomType(e.target.value as PgRoomType)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                >
                  <option value="Single Private Room">Single Private Room (1 Bed)</option>
                  <option value="Double Sharing">Double Sharing (2 Beds)</option>
                  <option value="Triple Sharing">Triple Sharing (3 Beds)</option>
                  <option value="1BHK Suite / Floor">1BHK Suite / Independent Floor</option>
                  <option value="Studio Apartment">Studio Apartment</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Rent / Bed / Mo (₹)</label>
                  <input
                    type="number"
                    min={1000}
                    value={newRent}
                    onChange={(e) => setNewRent(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Security Deposit (₹)</label>
                  <input
                    type="number"
                    min={1000}
                    value={newDeposit}
                    onChange={(e) => setNewDeposit(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Room Image Selection */}
              <div>
                <label className="text-xs text-slate-300 block mb-1">Room Photo</label>
                <div className="flex items-center gap-2">
                  <img
                    src={newRoomImage}
                    alt="Room preview"
                    className="w-14 h-10 object-cover rounded-lg border border-slate-700"
                  />
                  <div className="flex-1 flex gap-1.5">
                    <label className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 hover:border-amber-400 text-center text-xs text-slate-300 cursor-pointer font-medium">
                      <span>Upload File</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setNewRoomImage(event.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => setNewRoomImage(pgBedroomImg)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 hover:text-white"
                    >
                      Default
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newAttachedBath}
                    onChange={(e) => setNewAttachedBath(e.target.checked)}
                    className="rounded bg-slate-800 text-amber-500 focus:ring-0"
                  />
                  <span>Attached Bath</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newAC}
                    onChange={(e) => setNewAC(e.target.checked)}
                    className="rounded bg-slate-800 text-amber-500 focus:ring-0"
                  />
                  <span>AC Unit</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newBalcony}
                    onChange={(e) => setNewBalcony(e.target.checked)}
                    className="rounded bg-slate-800 text-amber-500 focus:ring-0"
                  />
                  <span>Balcony</span>
                </label>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition"
                >
                  Save &amp; Publish Room
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddRoomModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
