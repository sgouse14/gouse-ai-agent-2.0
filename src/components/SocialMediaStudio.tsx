import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Project, SocialMediaItem } from '../types';
import { SocialVirtualTourAndCampaigns } from './SocialVirtualTourAndCampaigns';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Send,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  Grid3X3,
  LayoutList,
  Film,
  Compass,
  FileText,
  Megaphone,
  Check,
  CheckCircle2,
  Copy,
  Phone,
  Mail,
  X,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  Image as ImageIcon,
  Play,
  ThumbsUp,
  Building2,
  Trash2,
  SlidersHorizontal,
  HardHat,
  Package,
  PenTool,
  Home,
  UserCheck,
  Sofa,
  Sparkles,
} from 'lucide-react';
import {
  SocialAdManager,
  AdLead,
  LeadStatus,
  INITIAL_AD_LEADS,
} from './SocialAdManager';

// Local bundled high-resolution architectural, construction, real estate & material assets
import villaExteriorImg from '../assets/images/bangalore_house_exterior_1790170528532.jpg';
import apartmentTowerImg from '../assets/images/mantri_premero_tower_1790170972037.jpg';
import pgHouseExteriorImg from '../assets/images/pg_house_exterior_1790170202558.jpg';
import pgBedroomSuiteImg from '../assets/images/pg_bedroom_suite_1790170216460.jpg';
import courtyardDiningImg from '../assets/images/pg_dining_lounge_1790170229065.jpg';
import modernBathImg from '../assets/images/pg_modern_bathroom_1790170240349.jpg';
import pgTerraceImg from '../assets/images/bangalore_pg_terrace_1790170513465.jpg';
import villaElevationImg from '../assets/images/bangalore_builder_proj2_1790170907606.jpg';
import siteFramingImg from '../assets/images/bangalore_builder_proj1_1790170892084.jpg';
import columnGridImg from '../assets/images/bangalore_builder_proj3_1790170920758.jpg';
import rccFramingImg from '../assets/images/site_rcc_framing_1795248636506.jpg';
import luxuryInteriorLivingImg from '../assets/images/luxury_interior_living_1795604953541.jpg';
import modularQuartzKitchenImg from '../assets/images/modular_quartz_kitchen_1795604953880.jpg';
import duskVillaCampaignImg from '../assets/images/dusk_villa_campaign_1795604954947.jpg';

import realEstateAvatarImg from '../assets/images/avatar_principal_architect_1795248637118.jpg';
import architectAvatarImg from '../assets/images/avatar_senior_architect_1795248636683.jpg';
import builderAvatarImg from '../assets/images/avatar_structural_engineer_1795248637200.jpg';
import supplierAvatarImg from '../assets/images/avatar_qs_director_1795248637002.jpg';

export type PosterRole =
  | 'real_estate'
  | 'architect'
  | 'interior_designer'
  | 'builder'
  | 'material_supplier'
  | 'client';

export type RoleFilter = 'all' | PosterRole;

export type RealEstateCategory =
  | 'all'
  | 'for_sale'
  | 'for_rent'
  | 'pg_coliving'
  | 'land_plots'
  | 'architectural_design'
  | 'interior_fitout'
  | 'turnkey_build'
  | 'materials_supply'
  | 'client_post';

export interface PostComment {
  id: string;
  author: string;
  text: string;
  timeAgo: string;
}

export interface RealEstateSocialPost extends SocialMediaItem {
  posterRole: PosterRole;
  posterName: string;
  posterHandle: string;
  posterAvatar: string;
  posterPhone: string;
  propertyCategory: Exclude<RealEstateCategory, 'all'>;
  listingStatus: string;
  priceLabel: string;
  location: string;
  areaSpec: string;
  bhkOrType: string;
  facing: string;
  possessionStatus: string;
  postedAgo: string;
  liked: boolean;
  saved: boolean;
  sharesCount: number;
  isReel?: boolean;
  galleryUrls?: string[];
  comments: PostComment[];
  hashtags: string[];
}

export interface PropertyStoryHighlight {
  id: string;
  role: PosterRole;
  label: string;
  posterHandle: string;
  location: string;
  priceTag: string;
  headline: string;
  subline: string;
  imageUrl: string;
  category: Exclude<RealEstateCategory, 'all'>;
  postedAgo: string;
}

const STORAGE_KEY = 'realstate_media_social_v4';
const LEADS_STORAGE_KEY = 'realstate_media_leads_v1';

export const ROLE_DIRECTORY: Record<
  PosterRole,
  {
    label: string;
    shortLabel: string;
    defaultName: string;
    defaultHandle: string;
    avatar: string;
    accentText: string;
    defaultCategory: Exclude<RealEstateCategory, 'all'>;
    defaultStatus: string;
    placeholderRate: string;
  }
> = {
  real_estate: {
    label: 'Real Estate',
    shortLabel: 'Real Estate',
    defaultName: 'Gouse Real Estate Advisory',
    defaultHandle: 'gouse_estates_blr',
    avatar: realEstateAvatarImg,
    accentText: 'text-amber-300',
    defaultCategory: 'for_sale',
    defaultStatus: 'For Sale',
    placeholderRate: '₹2.85 Cr',
  },
  architect: {
    label: 'Architect',
    shortLabel: 'Architect',
    defaultName: 'Ar. S. Gouse Design Studio',
    defaultHandle: 'gouse_architects_studio',
    avatar: architectAvatarImg,
    accentText: 'text-sky-400',
    defaultCategory: 'architectural_design',
    defaultStatus: 'Architectural Portfolio',
    placeholderRate: '₹120 / sq.ft Design',
  },
  interior_designer: {
    label: 'Interior Designer',
    shortLabel: 'Interiors',
    defaultName: 'Studio Vastu & Interior Atelier',
    defaultHandle: 'studio_vastu_interiors',
    avatar: architectAvatarImg,
    accentText: 'text-fuchsia-300',
    defaultCategory: 'interior_fitout',
    defaultStatus: 'Turnkey Interiors',
    placeholderRate: '₹1,650 / sq.ft Fit-Out',
  },
  builder: {
    label: 'Builder',
    shortLabel: 'Builder',
    defaultName: 'Apex Turnkey Builders & Civil',
    defaultHandle: 'apex_builders_blr',
    avatar: builderAvatarImg,
    accentText: 'text-emerald-400',
    defaultCategory: 'turnkey_build',
    defaultStatus: 'Turnkey Execution',
    placeholderRate: '₹2,150 / sq.ft Turnkey',
  },
  material_supplier: {
    label: 'Material Supplier',
    shortLabel: 'Material Supplier',
    defaultName: 'Deccan BuildMart & Stones',
    defaultHandle: 'deccan_materials_hub',
    avatar: supplierAvatarImg,
    accentText: 'text-rose-400',
    defaultCategory: 'materials_supply',
    defaultStatus: 'Material Supply',
    placeholderRate: '₹185 / sq.ft Supply',
  },
  client: {
    label: 'Client',
    shortLabel: 'Client',
    defaultName: 'Rajesh & Priya (Homeowners)',
    defaultHandle: 'rajesh_home_journey',
    avatar: realEstateAvatarImg,
    accentText: 'text-violet-400',
    defaultCategory: 'client_post',
    defaultStatus: 'Client Post',
    placeholderRate: 'Budget ₹1.40 Cr',
  },
};

export const STORY_HIGHLIGHTS: PropertyStoryHighlight[] = [
  {
    id: 'story-re-dusk',
    role: 'real_estate',
    label: 'Dusk Villas',
    posterHandle: 'gouse_estates_blr',
    location: 'Sadashivanagar · Bengaluru',
    priceTag: '₹4.25 Cr',
    headline: 'Cantilevered Concrete & Teak Courtyard Residence',
    subline: 'Real Estate · 4,850 sq.ft · Pool Courtyard · Private Viewing Open',
    imageUrl: duskVillaCampaignImg,
    category: 'for_sale',
    postedAgo: '1h ago',
  },
  {
    id: 'story-int-oak',
    role: 'interior_designer',
    label: 'Luxury Interiors',
    posterHandle: 'studio_vastu_interiors',
    location: 'Indiranagar · Bengaluru',
    priceTag: '₹1,650 / sq.ft',
    headline: 'Fluted White Oak Living & Statuario Quartz Kitchen',
    subline: 'Interior Designer · BWP Marine Ply · 2700K Magnetic Track Lighting',
    imageUrl: luxuryInteriorLivingImg,
    category: 'interior_fitout',
    postedAgo: '2h ago',
  },
  {
    id: 'story-re-villas',
    role: 'real_estate',
    label: 'Whitefield',
    posterHandle: 'gouse_estates_blr',
    location: 'Whitefield · Bengaluru',
    priceTag: '₹2.85 Cr',
    headline: '4 BHK Corner Courtyard Villa — Ready for Inspection',
    subline: 'Real Estate · 3,450 sq.ft · East Facing · OC & A-Khata Ready',
    imageUrl: villaExteriorImg,
    category: 'for_sale',
    postedAgo: '2h ago',
  },
  {
    id: 'story-arch-facade',
    role: 'architect',
    label: '3D Elevations',
    posterHandle: 'gouse_architects_studio',
    location: 'Sadashivanagar · Studio',
    priceTag: 'BIM + GFC',
    headline: 'Tropical Cantilever Facade & Natural Light Courtyard',
    subline: 'Architect · Conceptual 3D to GFC Structural & Interior Package',
    imageUrl: villaElevationImg,
    category: 'architectural_design',
    postedAgo: '3h ago',
  },
  {
    id: 'story-builder-rcc',
    role: 'builder',
    label: 'Turnkey Sites',
    posterHandle: 'apex_builders_blr',
    location: 'Sarjapur Main Road',
    priceTag: '₹2,150 / sq.ft',
    headline: 'G+3 RCC Slab Pour & Column Grid Inspection Completed',
    subline: 'Builder · M25 Grade Concrete · Turnkey Villa Construction',
    imageUrl: siteFramingImg,
    category: 'turnkey_build',
    postedAgo: '5h ago',
  },
  {
    id: 'story-supplier-stone',
    role: 'material_supplier',
    label: 'Stone & Bath',
    posterHandle: 'deccan_materials_hub',
    location: 'Jigani Granite & Tile Hub',
    priceTag: '₹240 / sq.ft',
    headline: 'Bookmatched Italian Quartzite & Matte Black Sanitary Line',
    subline: 'Material Supplier · Bulk Site Dispatch Across Bengaluru',
    imageUrl: modernBathImg,
    category: 'materials_supply',
    postedAgo: '6h ago',
  },
  {
    id: 'story-re-pg',
    role: 'real_estate',
    label: 'Executive PG',
    posterHandle: 'gouse_estates_blr',
    location: 'HSR Layout Sector 2',
    priceTag: '₹12,500 / mo',
    headline: 'Fully Furnished Co-Living Suites Near Tech Parks',
    subline: 'Real Estate · Single & Twin Occupancy · Zero Brokerage',
    imageUrl: pgBedroomSuiteImg,
    category: 'pg_coliving',
    postedAgo: '8h ago',
  },
  {
    id: 'story-supplier-steel',
    role: 'material_supplier',
    label: 'Fe-550D Steel',
    posterHandle: 'deccan_materials_hub',
    location: 'Peenya Industrial Supply',
    priceTag: '₹68 / kg',
    headline: 'Primary Fe-550D TMT Bars & Ready-Mix M25 Concrete Delivery',
    subline: 'Material Supplier · Lab Certified Mill Test Reports Included',
    imageUrl: rccFramingImg,
    category: 'materials_supply',
    postedAgo: '12h ago',
  },
  {
    id: 'story-client-home',
    role: 'client',
    label: 'Client Stories',
    posterHandle: 'rajesh_home_journey',
    location: 'Whitefield · 30x40 Plot',
    priceTag: 'Client Handover',
    headline: 'Our Dream G+2 Duplex Completed on Time & Budget',
    subline: 'Client Post · Designed & Built via Realstate Media Network',
    imageUrl: pgTerraceImg,
    category: 'client_post',
    postedAgo: '10h ago',
  },
];

export const INITIAL_REAL_ESTATE_POSTS: RealEstateSocialPost[] = [
  {
    id: 'eco-re-dusk-cantilever',
    type: 'photo',
    posterRole: 'real_estate',
    posterName: 'Gouse Real Estate Advisory',
    posterHandle: 'gouse_estates_blr',
    posterAvatar: realEstateAvatarImg,
    posterPhone: '+91 80739 47241',
    title: 'Sadashivanagar Cantilevered Dusk Residence & Pool Deck',
    caption:
      'Flagship architectural residence now open for private evening inspections. Post-tensioned 2.2m cantilevered glass pavilion, Burma teak soffits, infinity plunge courtyard, and full A-Khata OC documentation.',
    url: duskVillaCampaignImg,
    thumbnailUrl: duskVillaCampaignImg,
    galleryUrls: [duskVillaCampaignImg, luxuryInteriorLivingImg, modularQuartzKitchenImg],
    aspectRatio: '16:9',
    platform: 'all',
    category: 'handover',
    propertyCategory: 'for_sale',
    listingStatus: 'For Sale',
    priceLabel: '₹4.25 Cr',
    location: 'Sadashivanagar, Bengaluru',
    areaSpec: '4,850 sq.ft',
    bhkOrType: '5 BHK Pool Villa',
    facing: 'North-East Corner',
    possessionStatus: 'Ready to Move',
    postedAgo: '1 hr ago',
    uploadedAt: '2026-11-25',
    architectAttribution: 'Gouse Real Estate Advisory',
    tags: ['LuxuryVilla', 'CantileverArchitecture', 'BengaluruEstates'],
    hashtags: ['#SadashivanagarVilla', '#CantileverArchitecture', '#BengaluruLuxury', '#ReadyToMove'],
    likesCount: 512,
    viewsCount: 7420,
    liked: true,
    saved: true,
    sharesCount: 74,
    isFeatured: true,
    comments: [
      {
        id: 'c-001',
        author: 'aditya_nair_blr',
        text: 'Evening lighting on the cantilevered overhang looks sharp. Can we book a Sunday walkthrough?',
        timeAgo: '32m',
      },
    ],
  },
  {
    id: 'eco-int-living-oak',
    type: 'photo',
    posterRole: 'interior_designer',
    posterName: 'Studio Vastu & Interior Atelier',
    posterHandle: 'studio_vastu_interiors',
    posterAvatar: architectAvatarImg,
    posterPhone: '+91 80739 47241',
    title: 'Fluted White Oak Living & Travertine Courtyard Fit-Out',
    caption:
      'Completed turnkey residential interior in Indiranagar. Acoustic fluted oak wall cladding, honed Italian travertine center table, recessed 2700K magnetic track lighting, and BWP marine ply millwork delivered in 45 days with line-item BOQ lock.',
    url: luxuryInteriorLivingImg,
    thumbnailUrl: luxuryInteriorLivingImg,
    galleryUrls: [luxuryInteriorLivingImg, modularQuartzKitchenImg],
    aspectRatio: '4:5',
    platform: 'instagram',
    category: 'interior_design',
    propertyCategory: 'interior_fitout',
    listingStatus: 'Interior Showcase',
    priceLabel: '₹1,650 / sq.ft Fit-Out',
    location: 'Indiranagar, Bengaluru',
    areaSpec: '2,650 sq.ft Interior',
    bhkOrType: 'Turnkey Villa Interiors',
    facing: 'Courtyard Daylight',
    possessionStatus: 'Delivered in 45 Days',
    postedAgo: '2 hrs ago',
    uploadedAt: '2026-11-25',
    architectAttribution: 'Studio Vastu & Interior Atelier',
    tags: ['InteriorDesignBengaluru', 'FlutedOak', 'TurnkeyInteriors'],
    hashtags: ['#BengaluruInteriors', '#FlutedOak', '#TravertineLiving', '#TurnkeyFitOut'],
    likesCount: 386,
    viewsCount: 5180,
    liked: false,
    saved: true,
    sharesCount: 58,
    isFeatured: true,
    comments: [
      {
        id: 'c-002',
        author: 'sneha_kapoor_home',
        text: 'Are the magnetic track lights CRI 95? Looking for a full 3 BHK interior package in HSR.',
        timeAgo: '1h',
      },
    ],
  },
  {
    id: 'eco-int-modular-kitchen',
    type: 'photo',
    posterRole: 'interior_designer',
    posterName: 'Studio Vastu & Interior Atelier',
    posterHandle: 'studio_vastu_interiors',
    posterAvatar: architectAvatarImg,
    posterPhone: '+91 80739 47241',
    title: 'Statuario Quartz Waterfall Island & Walnut Kitchen',
    caption:
      'Custom modular kitchen & utility fit-out featuring 20mm bookmatched Statuario quartz island, Century BWP marine ply carcass, European walnut fluted shutter veneer, soft-close Hettich tandem hardware, and under-cabinet warm LED profiles.',
    url: modularQuartzKitchenImg,
    thumbnailUrl: modularQuartzKitchenImg,
    aspectRatio: '1:1',
    platform: 'all',
    category: 'interior_design',
    propertyCategory: 'interior_fitout',
    listingStatus: 'Modular Kitchen Lot',
    priceLabel: '₹8.40 L Complete Lot',
    location: 'Koramangala 4th Block, Bengaluru',
    areaSpec: '340 sq.ft Kitchen + Island',
    bhkOrType: 'BWP Marine + Quartz Island',
    facing: 'Hettich Soft-Close Kit',
    possessionStatus: '30-Day Fabrication',
    postedAgo: '3 hrs ago',
    uploadedAt: '2026-11-24',
    architectAttribution: 'Studio Vastu & Interior Atelier',
    tags: ['ModularKitchen', 'QuartzIsland', 'WalnutVeneer'],
    hashtags: ['#ModularKitchen', '#StatuarioQuartz', '#InteriorMillwork', '#BengaluruHomes'],
    likesCount: 319,
    viewsCount: 4310,
    liked: false,
    saved: false,
    sharesCount: 49,
    isReel: true,
    duration: '00:36',
    comments: [],
  },
  {
    id: 'eco-re-whitefield-villa',
    type: 'photo',
    posterRole: 'real_estate',
    posterName: 'Gouse Real Estate Advisory',
    posterHandle: 'gouse_estates_blr',
    posterAvatar: realEstateAvatarImg,
    posterPhone: '+91 80739 47241',
    title: 'Whitefield 4 BHK Contemporary Courtyard Villa',
    caption:
      'Open house this weekend at our newly handed-over 4 BHK contemporary villa in Whitefield. Double-height living atrium, Italian stone flooring, ventilated central courtyard, and private sky terrace built on a 40x60 East-facing plot.',
    url: villaExteriorImg,
    thumbnailUrl: villaExteriorImg,
    aspectRatio: '4:5',
    platform: 'all',
    category: 'handover',
    propertyCategory: 'for_sale',
    listingStatus: 'For Sale',
    priceLabel: '₹2.85 Cr',
    location: 'Whitefield, Bengaluru',
    areaSpec: '3,450 sq.ft',
    bhkOrType: '4 BHK Villa',
    facing: 'East Facing',
    possessionStatus: 'Ready to Move',
    postedAgo: '2 hrs ago',
    uploadedAt: '2026-11-21',
    architectAttribution: 'Gouse Real Estate Advisory',
    tags: ['WhitefieldVilla', 'BengaluruRealEstate', 'ReadyToMove'],
    hashtags: ['#WhitefieldVilla', '#BengaluruRealEstate', '#ReadyToMove', '#GouseEstates'],
    likesCount: 342,
    viewsCount: 4820,
    liked: false,
    saved: true,
    sharesCount: 47,
    isFeatured: true,
    comments: [
      {
        id: 'c-101',
        author: 'rohan_mehta.blr',
        text: 'What is the plot dimension and OC status for this corner unit?',
        timeAgo: '1h',
      },
      {
        id: 'c-102',
        author: 'gouse_estates_blr',
        text: '40x60 ft (2,400 sq.ft land) with A-Khata and Occupancy Certificate ready. Private tours open 10 AM – 6 PM.',
        timeAgo: '45m',
      },
    ],
  },
  {
    id: 'eco-arch-sadashivanagar',
    type: 'photo',
    posterRole: 'architect',
    posterName: 'Ar. S. Gouse Design Studio',
    posterHandle: 'gouse_architects_studio',
    posterAvatar: architectAvatarImg,
    posterPhone: '+91 80739 47241',
    title: 'Cantilevered Warm Timber & Glass Villa Elevation',
    caption:
      'Completed architectural concept-to-GFC package for a 50x80 corner residence. Deep sun-shading overhangs reduce west solar gain by 38% while framing private terrace gardens across G+2 floors.',
    url: villaElevationImg,
    thumbnailUrl: villaElevationImg,
    aspectRatio: '4:5',
    platform: 'instagram',
    category: 'site_elevation',
    propertyCategory: 'architectural_design',
    listingStatus: 'Architecture Project',
    priceLabel: '₹120 / sq.ft Design',
    location: 'Sadashivanagar, Bengaluru',
    areaSpec: '5,200 sq.ft Built-Up',
    bhkOrType: 'Concept + BIM + GFC',
    facing: 'North-East Corner',
    possessionStatus: 'Design Delivered',
    postedAgo: '3 hrs ago',
    uploadedAt: '2026-11-21',
    architectAttribution: 'Ar. S. Gouse Design Studio',
    tags: ['ArchitectureIndia', 'ContemporaryVilla', 'BIMDesign'],
    hashtags: ['#BengaluruArchitects', '#FacadeDesign', '#BIMWorkflow', '#GouseDesign'],
    likesCount: 418,
    viewsCount: 5940,
    liked: true,
    saved: true,
    sharesCount: 61,
    isReel: true,
    duration: '00:48',
    comments: [
      {
        id: 'c-151',
        author: 'kiran_patel_homes',
        text: 'Do you take up full architectural + interior + structural GFC drawings for 30x40 sites too?',
        timeAgo: '2h',
      },
    ],
  },
  {
    id: 'eco-builder-sarjapur',
    type: 'photo',
    posterRole: 'builder',
    posterName: 'Apex Turnkey Builders & Civil',
    posterHandle: 'apex_builders_blr',
    posterAvatar: builderAvatarImg,
    posterPhone: '+91 80739 47241',
    title: 'Sarjapur Road — Turnkey G+3 Duplex Structural Handover',
    caption:
      'Milestone update from our Sarjapur turnkey project: M25 RMC roof slab cured, double-height portico columns plumbed to ±3mm laser tolerance, and AAC block masonry underway on level 2.',
    url: siteFramingImg,
    thumbnailUrl: siteFramingImg,
    aspectRatio: '16:9',
    platform: 'facebook',
    category: 'slab_casting',
    propertyCategory: 'turnkey_build',
    listingStatus: 'Builder Site Log',
    priceLabel: '₹2,150 / sq.ft Turnkey',
    location: 'Sarjapur Main Rd, Bengaluru',
    areaSpec: '4,100 sq.ft Construction',
    bhkOrType: 'G+3 Turnkey Contract',
    facing: 'West Facing',
    possessionStatus: 'Handover Q2 2027',
    postedAgo: '5 hrs ago',
    uploadedAt: '2026-11-21',
    architectAttribution: 'Apex Turnkey Builders',
    tags: ['TurnkeyBuilder', 'RCCFraming', 'SarjapurConstruction'],
    hashtags: ['#TurnkeyBuilders', '#CivilEngineering', '#SarjapurRoad', '#QualityConstruction'],
    likesCount: 274,
    viewsCount: 3680,
    liked: false,
    saved: false,
    sharesCount: 29,
    comments: [
      {
        id: 'c-201',
        author: 'naveen_civil',
        text: 'Clean shuttering alignment and column stirrup spacing.',
        timeAgo: '3h',
      },
    ],
  },
  {
    id: 'eco-sup-marble-bath',
    type: 'photo',
    posterRole: 'material_supplier',
    posterName: 'Deccan BuildMart & Stones',
    posterHandle: 'deccan_materials_hub',
    posterAvatar: supplierAvatarImg,
    posterPhone: '+91 80739 47241',
    title: 'Italian Travertine Slabs & Matte Gunmetal Bath Line',
    caption:
      'Fresh container stock ready for builders and interior architects: 18mm honed travertine large-format slabs paired with concealed brushed gunmetal faucets and frameless 10mm toughened shower enclosures.',
    url: modernBathImg,
    thumbnailUrl: modernBathImg,
    aspectRatio: '1:1',
    platform: 'all',
    category: 'interior_design',
    propertyCategory: 'materials_supply',
    listingStatus: 'Bulk & Retail Supply',
    priceLabel: '₹240 / sq.ft Slab',
    location: 'Jigani Granite Hub, Bengaluru',
    areaSpec: '12,000 sq.ft In Stock',
    bhkOrType: 'Marble · Tiles · Sanitary',
    facing: '24-Hr Site Dispatch',
    possessionStatus: 'Ready Stock',
    postedAgo: '6 hrs ago',
    uploadedAt: '2026-11-21',
    architectAttribution: 'Deccan BuildMart & Stones',
    tags: ['BuildingMaterials', 'ItalianMarble', 'Sanitaryware'],
    hashtags: ['#BuildingMaterials', '#JiganiMarble', '#InteriorSuppliers', '#ArchitectTrade'],
    likesCount: 309,
    viewsCount: 4120,
    liked: false,
    saved: false,
    sharesCount: 52,
    comments: [],
  },
  {
    id: 'eco-re-indiranagar-tower',
    type: 'photo',
    posterRole: 'real_estate',
    posterName: 'Gouse Real Estate Advisory',
    posterHandle: 'gouse_estates_blr',
    posterAvatar: realEstateAvatarImg,
    posterPhone: '+91 80739 47241',
    title: 'Indiranagar 100ft Rd — 3 BHK Sky Residence',
    caption:
      'Elevated living overlooking green tree canopies near Indiranagar 100ft Road. Expansive 2,180 sq.ft floorplate with wrap-around sit-out deck, cross-ventilated bedrooms, and 2 covered EV-ready car parks.',
    url: apartmentTowerImg,
    thumbnailUrl: apartmentTowerImg,
    aspectRatio: '4:5',
    platform: 'facebook',
    category: '3d_walkthrough',
    propertyCategory: 'for_sale',
    listingStatus: 'For Sale',
    priceLabel: '₹2.10 Cr',
    location: 'Indiranagar, Bengaluru',
    areaSpec: '2,180 sq.ft',
    bhkOrType: '3 BHK + Study',
    facing: 'North Facing',
    possessionStatus: 'Ready to Move',
    postedAgo: '9 hrs ago',
    uploadedAt: '2026-11-20',
    architectAttribution: 'Gouse Real Estate Advisory',
    tags: ['IndiranagarFlats', '3BHKBengaluru', 'SkyResidence'],
    hashtags: ['#Indiranagar', '#3BHKApartment', '#BengaluruLuxury', '#UrbanHomes'],
    likesCount: 419,
    viewsCount: 6250,
    liked: true,
    saved: false,
    sharesCount: 64,
    isFeatured: true,
    comments: [],
  },
  {
    id: 'eco-arch-courtyard-dining',
    type: 'photo',
    posterRole: 'architect',
    posterName: 'Ar. S. Gouse Design Studio',
    posterHandle: 'gouse_architects_studio',
    posterAvatar: architectAvatarImg,
    posterPhone: '+91 80739 47241',
    title: 'Biophilic Teakwood Courtyard & Interior Fit-Out',
    caption:
      'Interior architecture showcase: custom fluted teak paneling, skylight dining bay, and acoustic lime-plaster walls crafted for a low-energy family home in Bellandur.',
    url: courtyardDiningImg,
    thumbnailUrl: courtyardDiningImg,
    aspectRatio: '16:9',
    platform: 'all',
    category: 'interior_design',
    propertyCategory: 'architectural_design',
    listingStatus: 'Interior Architecture',
    priceLabel: '₹1,650 / sq.ft Interiors',
    location: 'Bellandur, Bengaluru',
    areaSpec: '1,680 sq.ft Interior',
    bhkOrType: 'Turnkey Interior Fitout',
    facing: 'Skylight Atrium',
    possessionStatus: 'Completed Handover',
    postedAgo: '1 day ago',
    uploadedAt: '2026-11-20',
    architectAttribution: 'Ar. S. Gouse Design Studio',
    tags: ['InteriorArchitecture', 'BiophilicHome', 'BengaluruDesign'],
    hashtags: ['#InteriorArchitect', '#CourtyardHome', '#BengaluruInteriors', '#CustomMillwork'],
    likesCount: 256,
    viewsCount: 3420,
    liked: false,
    saved: false,
    sharesCount: 34,
    comments: [],
  },
  {
    id: 'eco-sup-steel-rmc',
    type: 'photo',
    posterRole: 'material_supplier',
    posterName: 'Deccan BuildMart & Stones',
    posterHandle: 'deccan_materials_hub',
    posterAvatar: supplierAvatarImg,
    posterPhone: '+91 80739 47241',
    title: 'Fe-550D Primary TMT Rebar & M25 RMC Dispatch',
    caption:
      'Supplying 28 metric tons of primary Fe-550D TMT bars (8mm–25mm) and automated M25 Ready-Mix Concrete batches for G+4 commercial & PG projects across East Bengaluru. Factory test certificates with every trailer.',
    url: rccFramingImg,
    thumbnailUrl: rccFramingImg,
    aspectRatio: '16:9',
    platform: 'facebook',
    category: 'slab_casting',
    propertyCategory: 'materials_supply',
    listingStatus: 'Structural Supply',
    priceLabel: '₹68 / kg Steel · ₹4,950 / m³ RMC',
    location: 'Peenya & Whitefield Depot',
    areaSpec: 'MOQ 2 Tons / 6 m³',
    bhkOrType: 'TMT Steel + RMC Supply',
    facing: 'Same-Day Transit Mixer',
    possessionStatus: 'Direct Mill Rate',
    postedAgo: '1 day ago',
    uploadedAt: '2026-11-19',
    architectAttribution: 'Deccan BuildMart & Stones',
    tags: ['TMTSteel', 'RMCConcrete', 'BuildersSupply'],
    hashtags: ['#TMTSteel', '#ReadyMixConcrete', '#MaterialSupplier', '#BengaluruBuilders'],
    likesCount: 192,
    viewsCount: 2740,
    liked: false,
    saved: false,
    sharesCount: 41,
    comments: [],
  },
  {
    id: 'eco-builder-column-grid',
    type: 'photo',
    posterRole: 'builder',
    posterName: 'Apex Turnkey Builders & Civil',
    posterHandle: 'apex_builders_blr',
    posterAvatar: builderAvatarImg,
    posterPhone: '+91 80739 47241',
    title: 'Electronic City 22-Unit Co-Living & Commercial Frame',
    caption:
      'Structural RCC column grid and perimeter retaining wall completed 11 days ahead of baseline schedule. Open for builder partnerships and investor turnkey contracts on 40x60 / 60x80 plots.',
    url: columnGridImg,
    thumbnailUrl: columnGridImg,
    aspectRatio: '1:1',
    platform: 'instagram',
    category: 'slab_casting',
    propertyCategory: 'turnkey_build',
    listingStatus: 'Commercial Builder',
    priceLabel: '₹1,980 / sq.ft Grey Structure',
    location: 'Electronic City Phase 1',
    areaSpec: '6,800 sq.ft Structure',
    bhkOrType: 'G+4 Commercial / PG Build',
    facing: 'Corner Plot Execution',
    possessionStatus: 'On-Time Milestone',
    postedAgo: '2 days ago',
    uploadedAt: '2026-11-18',
    architectAttribution: 'Apex Turnkey Builders',
    tags: ['CommercialBuilder', 'RCCStructure', 'ElectronicCity'],
    hashtags: ['#StructuralBuild', '#PGConstruction', '#TurnkeyContractor', '#BengaluruCivil'],
    likesCount: 184,
    viewsCount: 2390,
    liked: false,
    saved: false,
    sharesCount: 23,
    isReel: true,
    duration: '00:52',
    comments: [],
  },
  {
    id: 'eco-re-hsr-pg',
    type: 'photo',
    posterRole: 'real_estate',
    posterName: 'Gouse Real Estate Advisory',
    posterHandle: 'gouse_estates_blr',
    posterAvatar: realEstateAvatarImg,
    posterPhone: '+91 80739 47241',
    title: 'HSR Sector 2 Executive Co-Living & PG Suites',
    caption:
      'Move-in ready executive suites designed for tech professionals in HSR Layout Sector 2. Orthopedic queen beds, dedicated ergonomic work desk, dual fiber Wi-Fi, biometric access, and rooftop terrace lounge.',
    url: pgBedroomSuiteImg,
    thumbnailUrl: pgBedroomSuiteImg,
    aspectRatio: '1:1',
    platform: 'instagram',
    category: 'interior_design',
    propertyCategory: 'pg_coliving',
    listingStatus: 'PG & Co-Living',
    priceLabel: '₹12,500 / mo',
    location: 'HSR Layout Sector 2, Bengaluru',
    areaSpec: '280 sq.ft Suite',
    bhkOrType: 'Executive Single / Twin',
    facing: 'North-East Ventilation',
    possessionStatus: 'Immediate Move-In',
    postedAgo: '3 days ago',
    uploadedAt: '2026-11-17',
    architectAttribution: 'Gouse Real Estate Advisory',
    tags: ['HSRLayoutPG', 'CoLivingBengaluru', 'ZeroBrokerage'],
    hashtags: ['#HSRLayoutPG', '#CoLivingBangalore', '#ZeroBrokerage', '#FurnishedSuites'],
    likesCount: 218,
    viewsCount: 3190,
    liked: false,
    saved: false,
    sharesCount: 31,
    isReel: true,
    duration: '00:42',
    comments: [],
  },
  {
    id: 'eco-client-handover',
    type: 'photo',
    posterRole: 'client',
    posterName: 'Rajesh & Priya (Homeowners)',
    posterHandle: 'rajesh_home_journey',
    posterAvatar: realEstateAvatarImg,
    posterPhone: '+91 80739 47241',
    title: 'Client Handover Story: Our 30x40 G+2 Terrace Duplex',
    caption:
      'Thrilled to share our newly handed-over family home! Connected with our Architect, Turnkey Builder, and Italian Stone Supplier right here on Realstate Media. Zero cost overruns and crystal-clear BOQ tracking.',
    url: pgTerraceImg,
    thumbnailUrl: pgTerraceImg,
    aspectRatio: '4:5',
    platform: 'all',
    category: 'client_post' as any,
    propertyCategory: 'client_post',
    listingStatus: 'Client Handover Review',
    priceLabel: '₹1.38 Cr Total Build',
    location: 'Brookefield, Bengaluru',
    areaSpec: '2,850 sq.ft Duplex',
    bhkOrType: 'Homeowner Showcase',
    facing: 'East Facing',
    possessionStatus: 'Moved In',
    postedAgo: '4 hrs ago',
    uploadedAt: '2026-11-21',
    architectAttribution: 'Client Verified Story',
    tags: ['ClientReview', 'DreamHomeBengaluru', 'TurnkeySuccess'],
    hashtags: ['#ClientShowcase', '#HomeownerReview', '#DreamHome', '#RealstateMedia'],
    likesCount: 294,
    viewsCount: 3820,
    liked: true,
    saved: false,
    sharesCount: 38,
    comments: [
      {
        id: 'c-901',
        author: 'gouse_architects_studio',
        text: 'Thank you Rajesh & Priya! Wishing your family wonderful memories in your new terrace lounge.',
        timeAgo: '2h',
      },
    ],
  },
  {
    id: 'eco-client-plot-req',
    type: 'photo',
    posterRole: 'client',
    posterName: 'Karthik Reddy (Plot Owner)',
    posterHandle: 'karthik_devanahalli',
    posterAvatar: supplierAvatarImg,
    posterPhone: '+91 80739 47241',
    title: 'Client Requirement: Seeking Architect & Builder for 40x60 Plot',
    caption:
      'Looking for quotes from verified Architects and Turnkey Builders for a modern 3-floor residential + rental floor building in Devanahalli. Structural drawings & BOQ estimate needed within 2 weeks.',
    url: villaElevationImg,
    thumbnailUrl: villaElevationImg,
    aspectRatio: '16:9',
    platform: 'facebook',
    category: 'client_post' as any,
    propertyCategory: 'client_post',
    listingStatus: 'Client Requirement',
    priceLabel: 'Budget ₹1.85 Cr',
    location: 'Devanahalli, North Bengaluru',
    areaSpec: '2,400 sq.ft Plot',
    bhkOrType: 'Client Build Request',
    facing: 'North Facing Plot',
    possessionStatus: 'Ready to Start',
    postedAgo: '1 day ago',
    uploadedAt: '2026-11-20',
    architectAttribution: 'Client Requirement Post',
    tags: ['ClientRequirement', 'ArchitectNeeded', 'BuilderQuotes'],
    hashtags: ['#ClientRequirement', '#LookingForArchitect', '#Devanahalli', '#RealstateMedia'],
    likesCount: 127,
    viewsCount: 1890,
    liked: false,
    saved: false,
    sharesCount: 14,
    comments: [],
  },
];

// Exported for backward compatibility with any external imports
export const INITIAL_SOCIAL_MEDIA_ITEMS: SocialMediaItem[] = INITIAL_REAL_ESTATE_POSTS;

type PlatformMode = 'instagram' | 'facebook' | 'dual' | 'virtual_tour' | 'brochure' | 'campaigns';
type IgSubView = 'feed' | 'grid' | 'reels';

interface SocialMediaStudioProps {
  activeProject: Project;
  onOpenWorkflowEngine?: () => void;
}

const formatCompact = (n: number): string => {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
};

export const SocialMediaStudio: React.FC<SocialMediaStudioProps> = ({
  activeProject,
}) => {
  const [posts, setPosts] = useState<RealEstateSocialPost[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((p: RealEstateSocialPost) => p.id));
          const missingDefaults = INITIAL_REAL_ESTATE_POSTS.filter((p) => !existingIds.has(p.id));
          return [...missingDefaults, ...parsed];
        }
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_REAL_ESTATE_POSTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    } catch {
      // ignore storage quota errors
    }
  }, [posts]);

  const [leads, setLeads] = useState<AdLead[]>(() => {
    try {
      const raw = localStorage.getItem(LEADS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_AD_LEADS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leads));
    } catch {
      // ignore
    }
  }, [leads]);

  // Active account role (who the user is posting as) + feed filters
  const [activePosterRole, setActivePosterRole] = useState<PosterRole>('real_estate');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<RealEstateCategory>('all');
  const [platformMode, setPlatformMode] = useState<PlatformMode>('instagram');
  const [igSubView, setIgSubView] = useState<IgSubView>('feed');
  const [onlySaved, setOnlySaved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Boost-as-Ad & In-App Lead Inquiry Modal State
  const [boostPostTarget, setBoostPostTarget] = useState<RealEstateSocialPost | null>(null);
  const [inquiryPost, setInquiryPost] = useState<RealEstateSocialPost | null>(null);
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryNote, setInquiryNote] = useState('');
  const [inquirySentBanner, setInquirySentBanner] = useState(false);

  // Carousel slide tracking per post
  const [slideIndices, setSlideIndices] = useState<Record<string, number>>({});

  // Dual preview selector
  const [dualPostId, setDualPostId] = useState<string>(INITIAL_REAL_ESTATE_POSTS[0].id);

  // Story Viewer modal
  const [activeStoryIdx, setActiveStoryIdx] = useState<number | null>(null);

  // Full Post Detail / Comments Modal
  const [detailPostId, setDetailPostId] = useState<string | null>(null);

  // Upload / Post Project Modal
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  // Inline comment drafts & toggles
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Facebook quick inline composer state
  const [fbDraftText, setFbDraftText] = useState('');
  const [fbDraftTitle, setFbDraftTitle] = useState('');
  const [fbDraftPrice, setFbDraftPrice] = useState(ROLE_DIRECTORY.real_estate.placeholderRate);
  const [fbDraftLocation, setFbDraftLocation] = useState(
    activeProject.location || 'Whitefield, Bengaluru'
  );
  const [fbDraftCategory, setFbDraftCategory] = useState<Exclude<RealEstateCategory, 'all'>>(
    'for_sale'
  );
  const [fbDraftImageUrl, setFbDraftImageUrl] = useState<string>(duskVillaCampaignImg);
  const [fbShowAttachBar, setFbShowAttachBar] = useState(false);
  const [isDraftingFbAi, setIsDraftingFbAi] = useState(false);

  // Modal New Project Post state
  const [modalRole, setModalRole] = useState<PosterRole>('real_estate');
  const [newCompanyName, setNewCompanyName] = useState(ROLE_DIRECTORY.real_estate.defaultName);
  const [newTitle, setNewTitle] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newPrice, setNewPrice] = useState(ROLE_DIRECTORY.real_estate.placeholderRate);
  const [newLocation, setNewLocation] = useState('Whitefield, Bengaluru');
  const [newAreaSpec, setNewAreaSpec] = useState('2,400 sq.ft');
  const [newSpecType, setNewSpecType] = useState('4 BHK Villa / Project');
  const [newCategory, setNewCategory] = useState<Exclude<RealEstateCategory, 'all'>>('for_sale');
  const [newMediaType, setNewMediaType] = useState<'photo' | 'video'>('photo');
  const [newMediaUrl, setNewMediaUrl] = useState<string>(duskVillaCampaignImg);
  const [newGalleryUrls, setNewGalleryUrls] = useState<string[]>([duskVillaCampaignImg]);
  const [newHashtags, setNewHashtags] = useState<string[]>([]);
  const [isDraftingModalAi, setIsDraftingModalAi] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fbFileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectActiveRole = (role: PosterRole) => {
    setActivePosterRole(role);
    setModalRole(role);
    const meta = ROLE_DIRECTORY[role];
    setNewCompanyName(meta.defaultName);
    setNewPrice(meta.placeholderRate);
    setNewCategory(meta.defaultCategory);
    setFbDraftCategory(meta.defaultCategory);
    setFbDraftPrice(meta.placeholderRate);
    if (role === 'architect') {
      setNewSpecType('Concept + BIM + GFC');
      setFbDraftImageUrl(villaElevationImg);
      setNewMediaUrl(villaElevationImg);
      setNewGalleryUrls([villaElevationImg]);
    } else if (role === 'interior_designer') {
      setNewSpecType('Turnkey Interior + Modular Millwork');
      setFbDraftImageUrl(luxuryInteriorLivingImg);
      setNewMediaUrl(luxuryInteriorLivingImg);
      setNewGalleryUrls([luxuryInteriorLivingImg, modularQuartzKitchenImg]);
    } else if (role === 'builder') {
      setNewSpecType('Turnkey G+2 / Civil Contract');
      setFbDraftImageUrl(siteFramingImg);
      setNewMediaUrl(siteFramingImg);
      setNewGalleryUrls([siteFramingImg]);
    } else if (role === 'material_supplier') {
      setNewSpecType('Bulk Material Supply');
      setFbDraftImageUrl(modernBathImg);
      setNewMediaUrl(modernBathImg);
      setNewGalleryUrls([modernBathImg]);
    } else if (role === 'client') {
      setNewSpecType('Homeowner Showcase / Plot Requirement');
      setFbDraftImageUrl(pgTerraceImg);
      setNewMediaUrl(pgTerraceImg);
      setNewGalleryUrls([pgTerraceImg]);
    } else {
      setNewSpecType('4 BHK Villa / Plot');
      setFbDraftImageUrl(duskVillaCampaignImg);
      setNewMediaUrl(duskVillaCampaignImg);
      setNewGalleryUrls([duskVillaCampaignImg]);
    }
  };

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return posts.filter((post) => {
      if (onlySaved && !post.saved) return false;
      if (roleFilter !== 'all' && post.posterRole !== roleFilter) return false;
      if (categoryFilter !== 'all' && post.propertyCategory !== categoryFilter) return false;
      if (platformMode === 'instagram' && igSubView === 'reels' && !post.isReel && post.type !== 'video') {
        return false;
      }
      if (!q) return true;
      return (
        post.title.toLowerCase().includes(q) ||
        post.posterName.toLowerCase().includes(q) ||
        post.posterHandle.toLowerCase().includes(q) ||
        post.location.toLowerCase().includes(q) ||
        post.priceLabel.toLowerCase().includes(q) ||
        post.caption.toLowerCase().includes(q) ||
        post.bhkOrType.toLowerCase().includes(q)
      );
    });
  }, [posts, roleFilter, categoryFilter, onlySaved, searchQuery, platformMode, igSubView]);

  const savedPosts = useMemo(() => posts.filter((p) => p.saved), [posts]);

  const roleCounts = useMemo(() => {
    return {
      all: posts.length,
      real_estate: posts.filter((p) => p.posterRole === 'real_estate').length,
      architect: posts.filter((p) => p.posterRole === 'architect').length,
      interior_designer: posts.filter((p) => p.posterRole === 'interior_designer').length,
      builder: posts.filter((p) => p.posterRole === 'builder').length,
      material_supplier: posts.filter((p) => p.posterRole === 'material_supplier').length,
      client: posts.filter((p) => p.posterRole === 'client').length,
    };
  }, [posts]);

  const dualSelectedPost = useMemo(
    () => posts.find((p) => p.id === dualPostId) || filteredPosts[0] || posts[0],
    [posts, dualPostId, filteredPosts]
  );

  const detailPost = useMemo(
    () => (detailPostId ? posts.find((p) => p.id === detailPostId) || null : null),
    [posts, detailPostId]
  );

  // Engagement Handlers
  const toggleLike = (id: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const nextLiked = !p.liked;
        return {
          ...p,
          liked: nextLiked,
          likesCount: Math.max(0, (p.likesCount || 0) + (nextLiked ? 1 : -1)),
        };
      })
    );
  };

  const toggleSave = (id: string) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, saved: !p.saved } : p)));
  };

  const handleShare = (post: RealEstateSocialPost) => {
    const roleLabel = ROLE_DIRECTORY[post.posterRole].label;
    const text = `[${roleLabel}] ${post.title} — ${post.priceLabel} (${post.location}, ${post.areaSpec})\nPosted by ${post.posterName}\n${post.caption}\n${post.hashtags.join(' ')}\nContact: ${post.posterPhone}`;
    navigator.clipboard?.writeText(text).catch(() => {});
    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, sharesCount: p.sharesCount + 1 } : p))
    );
    setCopiedId(post.id);
    setTimeout(() => setCopiedId((cur) => (cur === post.id ? null : cur)), 2000);
  };

  const handleAddComment = (postId: string) => {
    const draft = (commentDrafts[postId] || '').trim();
    if (!draft) return;
    const authorHandle = ROLE_DIRECTORY[activePosterRole].defaultHandle;
    const newComment: PostComment = {
      id: `cmt-${Date.now()}`,
      author: authorHandle,
      text: draft,
      timeAgo: 'Just now',
    };
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p))
    );
    setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
    setExpandedComments((prev) => ({ ...prev, [postId]: true }));
  };

  const handleDeleteCustomPost = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    if (detailPostId === id) setDetailPostId(null);
  };

  const handleQuickFbFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFbDraftImageUrl(reader.result);
        setFbShowAttachBar(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBoostPostAsAd = (post: RealEstateSocialPost) => {
    setBoostPostTarget(post);
    setPlatformMode('campaigns');
  };

  const handleOpenPostInquiry = (post: RealEstateSocialPost) => {
    setInquiryPost(post);
    setInquirySentBanner(false);
    setInquiryNote(`Interested in "${post.title}" (${post.priceLabel}) at ${post.location}`);
  };

  const handleSubmitPostInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryPost || !inquiryName.trim() || !inquiryPhone.trim()) return;
    const newLead: AdLead = {
      id: `lead-post-${Date.now()}`,
      campaignName: inquiryPost.title,
      sourceChannel: `Organic Post (${ROLE_DIRECTORY[inquiryPost.posterRole].shortLabel})`,
      leadName: inquiryName.trim(),
      phone: inquiryPhone.trim(),
      requirement: inquiryNote.trim() || `Requested details for ${inquiryPost.title}`,
      city: inquiryPost.location,
      budgetHint: inquiryPost.priceLabel,
      status: 'new',
      createdAt: 'Just now',
    };
    setLeads((prev) => [newLead, ...prev]);
    setInquirySentBanner(true);
    setTimeout(() => {
      setInquiryPost(null);
      setInquiryName('');
      setInquiryPhone('');
      setInquiryNote('');
      setInquirySentBanner(false);
    }, 1200);
  };

  const handleAiDraftModalPost = async () => {
    setIsDraftingModalAi(true);
    try {
      const resp = await fetch('/api/media/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: modalRole,
          companyName: newCompanyName,
          title: newTitle,
          priceLabel: newPrice,
          location: newLocation,
          areaSpec: newAreaSpec,
          category: newCategory,
          projectContext: activeProject.description || activeProject.name,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.title && !newTitle.trim()) setNewTitle(data.title);
        if (data.caption) setNewCaption(data.caption);
        if (Array.isArray(data.hashtags)) setNewHashtags(data.hashtags);
      }
    } catch {
      // ignore network issue
    } finally {
      setIsDraftingModalAi(false);
    }
  };

  const handleAiDraftFbPost = async () => {
    setIsDraftingFbAi(true);
    setFbShowAttachBar(true);
    try {
      const roleMeta = ROLE_DIRECTORY[activePosterRole];
      const resp = await fetch('/api/media/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: activePosterRole,
          companyName: roleMeta.defaultName,
          title: fbDraftTitle || `${roleMeta.shortLabel} Showcase in ${fbDraftLocation}`,
          priceLabel: fbDraftPrice,
          location: fbDraftLocation,
          areaSpec: activeProject.builtUpAreaSqFt ? `${activeProject.builtUpAreaSqFt} sq.ft` : '2,800 sq.ft',
          category: fbDraftCategory,
          projectContext: activeProject.name,
          platform: 'facebook',
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.title && !fbDraftTitle.trim()) setFbDraftTitle(data.title);
        if (data.caption) setFbDraftText(data.caption);
      }
    } catch {
      // ignore
    } finally {
      setIsDraftingFbAi(false);
    }
  };

  const handleQuickFbPublish = (e: React.FormEvent) => {
    e.preventDefault();
    const body = fbDraftText.trim();
    if (!body) return;

    const roleMeta = ROLE_DIRECTORY[activePosterRole];
    const statusMap: Record<Exclude<RealEstateCategory, 'all'>, string> = {
      for_sale: 'For Sale',
      for_rent: 'For Rent',
      pg_coliving: 'PG & Co-Living',
      land_plots: 'Land & Plots',
      architectural_design: 'Architecture Project',
      interior_fitout: 'Interior Showcase',
      turnkey_build: 'Builder Site Log',
      materials_supply: 'Material Supply',
      client_post: 'Client Post',
    };

    const newPost: RealEstateSocialPost = {
      id: `eco-user-${Date.now()}`,
      projectId: activeProject.id,
      type: 'photo',
      posterRole: activePosterRole,
      posterName: roleMeta.defaultName,
      posterHandle: roleMeta.defaultHandle,
      posterAvatar: roleMeta.avatar,
      posterPhone: '+91 80739 47241',
      title:
        fbDraftTitle.trim() ||
        `${roleMeta.shortLabel} Update · ${fbDraftLocation.split(',')[0] || 'Bengaluru'}`,
      caption: body,
      url: fbDraftImageUrl || duskVillaCampaignImg,
      thumbnailUrl: fbDraftImageUrl || duskVillaCampaignImg,
      aspectRatio: '16:9',
      platform: 'all',
      category: fbDraftCategory === 'interior_fitout' ? 'interior_design' : 'handover',
      propertyCategory: fbDraftCategory,
      listingStatus: statusMap[fbDraftCategory],
      priceLabel: fbDraftPrice.trim() || roleMeta.placeholderRate,
      location: fbDraftLocation.trim() || 'Bengaluru',
      areaSpec: 'Verified Project',
      bhkOrType: roleMeta.label,
      facing: 'Bengaluru Region',
      possessionStatus: 'Active Post',
      postedAgo: 'Just now',
      uploadedAt: new Date().toISOString().slice(0, 10),
      architectAttribution: roleMeta.defaultName,
      tags: ['BengaluruConstruction', roleMeta.shortLabel.replace(/\s+/g, '')],
      hashtags: [
        '#BengaluruProjects',
        `#${roleMeta.shortLabel.replace(/\s+/g, '')}`,
        '#RealstateMedia',
      ],
      likesCount: 1,
      viewsCount: 15,
      liked: true,
      saved: false,
      sharesCount: 0,
      comments: [],
    };

    setPosts((prev) => [newPost, ...prev]);
    setFbDraftText('');
    setFbDraftTitle('');
    setFbShowAttachBar(false);
    setDualPostId(newPost.id);
  };

  const handleModalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    setNewMediaType(isVideo ? 'video' : 'photo');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewMediaUrl(reader.result);
        setNewGalleryUrls([reader.result]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateModalPost = (e: React.FormEvent) => {
    e.preventDefault();
    const roleMeta = ROLE_DIRECTORY[modalRole];
    const companyName = newCompanyName.trim() || roleMeta.defaultName;
    const handle = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 24) || roleMeta.defaultHandle;

    const statusMap: Record<Exclude<RealEstateCategory, 'all'>, string> = {
      for_sale: 'For Sale',
      for_rent: 'For Rent',
      pg_coliving: 'PG & Co-Living',
      land_plots: 'Land & Plots',
      architectural_design: 'Architecture Project',
      interior_fitout: 'Interior Showcase',
      turnkey_build: 'Builder Site Log',
      materials_supply: 'Material Supply',
      client_post: 'Client Post',
    };

    const title = newTitle.trim() || `${roleMeta.shortLabel} Project — ${newLocation}`;
    const caption =
      newCaption.trim() ||
      `Published by ${companyName} (${roleMeta.label}) in ${newLocation}. ${newSpecType} · ${newAreaSpec} · ${newPrice}. Reach out directly for drawings, quotes, or site inspection.`;

    const primaryUrl = newGalleryUrls[0] || newMediaUrl || duskVillaCampaignImg;
    const created: RealEstateSocialPost = {
      id: `eco-modal-${Date.now()}`,
      projectId: activeProject.id,
      type: newMediaType,
      posterRole: modalRole,
      posterName: companyName,
      posterHandle: handle,
      posterAvatar: roleMeta.avatar,
      posterPhone: '+91 80739 47241',
      title,
      caption,
      url: primaryUrl,
      thumbnailUrl: newMediaType === 'photo' ? primaryUrl : duskVillaCampaignImg,
      galleryUrls: newMediaType === 'photo' && newGalleryUrls.length > 1 ? newGalleryUrls : undefined,
      aspectRatio: newMediaType === 'video' ? '9:16' : '4:5',
      platform: 'all',
      category:
        newMediaType === 'video'
          ? '3d_walkthrough'
          : newCategory === 'interior_fitout'
          ? 'interior_design'
          : 'handover',
      propertyCategory: newCategory,
      listingStatus: statusMap[newCategory],
      priceLabel: newPrice.trim() || roleMeta.placeholderRate,
      location: newLocation.trim() || 'Bengaluru',
      areaSpec: newAreaSpec.trim() || '2,400 sq.ft',
      bhkOrType: newSpecType.trim() || roleMeta.label,
      facing: 'Verified Listing',
      possessionStatus: 'Active Now',
      postedAgo: 'Just now',
      uploadedAt: new Date().toISOString().slice(0, 10),
      architectAttribution: companyName,
      tags: [roleMeta.shortLabel.replace(/\s+/g, ''), 'BengaluruProjects'],
      hashtags:
        newHashtags.length > 0
          ? newHashtags
          : [
              `#${roleMeta.shortLabel.replace(/\s+/g, '')}`,
              '#BengaluruRealEstate',
              '#ArchitectureAndBuild',
            ],
      likesCount: 1,
      viewsCount: 18,
      liked: true,
      saved: false,
      sharesCount: 0,
      isReel: newMediaType === 'video',
      duration: newMediaType === 'video' ? '00:45' : undefined,
      comments: [],
    };

    setPosts((prev) => [created, ...prev]);
    setDualPostId(created.id);
    setNewTitle('');
    setNewCaption('');
    setNewHashtags([]);
    setIsComposerOpen(false);
  };

  const whatsappInquiryUrl = (post: RealEstateSocialPost) => {
    const roleLabel = ROLE_DIRECTORY[post.posterRole].label;
    const msg = encodeURIComponent(
      `Hello ${post.posterName} (${roleLabel}), I saw "${post.title}" (${post.priceLabel}, ${post.location}) on Realstate Media and would like project details.`
    );
    return `https://wa.me/918073947241?text=${msg}`;
  };

  const renderMediaFrame = (
    post: RealEstateSocialPost,
    aspectClass: string,
    overlayPrice = true
  ) => {
    const slides = post.galleryUrls && post.galleryUrls.length > 1 ? post.galleryUrls : [post.url];
    const activeSlide = Math.min(slideIndices[post.id] || 0, slides.length - 1);
    const activeUrl = slides[activeSlide] || post.url;

    return (
      <div className={`relative w-full ${aspectClass} bg-slate-900 overflow-hidden select-none`}>
        {post.type === 'video' ? (
          <video
            src={post.url}
            poster={post.thumbnailUrl || duskVillaCampaignImg}
            controls
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={activeUrl}
            alt={post.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        )}

        {slides.length > 1 && post.type !== 'video' && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={(e) => {
                e.stopPropagation();
                setSlideIndices((prev) => ({
                  ...prev,
                  [post.id]: (activeSlide - 1 + slides.length) % slides.length,
                }));
              }}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-950/75 hover:bg-slate-900 text-white flex items-center justify-center border border-white/20 z-10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={(e) => {
                e.stopPropagation();
                setSlideIndices((prev) => ({
                  ...prev,
                  [post.id]: (activeSlide + 1) % slides.length,
                }));
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-950/75 hover:bg-slate-900 text-white flex items-center justify-center border border-white/20 z-10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-slate-950/80 text-[11px] font-medium text-white tabular-nums z-10">
              {activeSlide + 1}/{slides.length}
            </div>
          </>
        )}

        {overlayPrice && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex items-end justify-between px-4 pb-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-200 truncate">
                {ROLE_DIRECTORY[post.posterRole].shortLabel} · {post.bhkOrType} · {post.areaSpec}
              </p>
            </div>
            <span className="text-sm font-bold text-white tabular-nums shrink-0 ml-3">
              {post.priceLabel}
            </span>
          </div>
        )}
      </div>
    );
  };

  // Reusable Instagram Card
  const renderInstagramCard = (post: RealEstateSocialPost, compact = false) => {
    const roleMeta = ROLE_DIRECTORY[post.posterRole];
    const showAllComments = !!expandedComments[post.id];
    const visibleComments = showAllComments ? post.comments : post.comments.slice(-2);

    return (
      <article
        key={`ig-${post.id}`}
        className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden flex flex-col"
      >
        {/* IG Card Header */}
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-rose-500 to-fuchsia-600 shrink-0">
              <img
                src={post.posterAvatar || roleMeta.avatar}
                alt={post.posterName}
                referrerPolicy="no-referrer"
                className="w-full h-full rounded-full object-cover border-2 border-slate-950"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-semibold text-white truncate">
                  {post.posterHandle}
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className={`text-[11px] font-semibold ${roleMeta.accentText} shrink-0`}>
                  · {roleMeta.shortLabel}
                </span>
                <span className="text-xs text-slate-500 shrink-0">· {post.postedAgo}</span>
              </div>
              <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                <span className="truncate">
                  {post.location} · {post.listingStatus}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => handleBoostPostAsAd(post)}
              className="text-xs font-semibold text-amber-300 hover:text-amber-200 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:border-amber-400/60 transition whitespace-nowrap"
              title="Promote this post in Run Ads Studio"
            >
              Run Ad
            </button>
            <button
              type="button"
              onClick={() => handleOpenPostInquiry(post)}
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 px-2.5 py-1 rounded-lg hover:bg-slate-800 transition whitespace-nowrap"
            >
              Inquire
            </button>
            {post.id.startsWith('eco-user-') || post.id.startsWith('eco-modal-') ? (
              <button
                type="button"
                onClick={() => handleDeleteCustomPost(post.id)}
                title="Remove post"
                className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setDetailPostId(post.id)}
                title="Open project details"
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Media Area */}
        <div className="group cursor-pointer" onClick={() => setDetailPostId(post.id)}>
          {renderMediaFrame(post, compact ? 'aspect-square' : 'aspect-[4/5]', true)}
        </div>

        {/* IG Action Bar */}
        <div className="px-4 pt-3 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => toggleLike(post.id)}
              aria-label="Like post"
              className="flex items-center gap-1.5 text-slate-200 hover:text-rose-400 transition"
            >
              <Heart
                className={`w-5 h-5 transition-transform active:scale-125 ${
                  post.liked ? 'fill-rose-500 text-rose-500' : 'text-slate-200'
                }`}
              />
              <span className="text-xs font-semibold tabular-nums">
                {(post.likesCount || 0).toLocaleString()}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setExpandedComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))
              }
              aria-label="Toggle comments"
              className="flex items-center gap-1.5 text-slate-200 hover:text-sky-400 transition"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs font-semibold tabular-nums">{post.comments.length}</span>
            </button>

            <button
              type="button"
              onClick={() => handleShare(post)}
              aria-label="Copy and share project"
              className="flex items-center gap-1.5 text-slate-200 hover:text-emerald-400 transition"
            >
              {copiedId === post.id ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-400">Copied</span>
                </>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => toggleSave(post.id)}
            aria-label="Save project"
            className="text-slate-300 hover:text-amber-400 transition"
          >
            <Bookmark
              className={`w-5 h-5 ${post.saved ? 'fill-amber-400 text-amber-400' : ''}`}
            />
          </button>
        </div>

        {/* Caption & Specs */}
        <div className="px-4 pb-3 space-y-1.5 text-sm">
          <div className="flex items-baseline justify-between gap-2 border-b border-slate-800/80 pb-2">
            <h4 className="font-semibold text-white text-sm leading-snug">{post.title}</h4>
            <span className="text-xs font-semibold text-amber-300 tabular-nums whitespace-nowrap shrink-0">
              {post.priceLabel}
            </span>
          </div>

          <p className="text-slate-300 text-[13px] leading-relaxed">
            <span className="font-semibold text-white mr-1.5">{post.posterHandle}</span>
            {post.caption}
          </p>

          <p className="text-xs text-sky-400/90 leading-relaxed">
            {post.hashtags.join(' ')}
          </p>

          {post.comments.length > 2 && !showAllComments && (
            <button
              type="button"
              onClick={() => setExpandedComments((prev) => ({ ...prev, [post.id]: true }))}
              className="text-xs text-slate-400 hover:text-slate-200 transition pt-0.5"
            >
              View all {post.comments.length} comments
            </button>
          )}

          {visibleComments.length > 0 && (
            <div className="space-y-1 pt-1">
              {visibleComments.map((c) => (
                <div
                  key={c.id}
                  className="text-xs text-slate-300 flex items-baseline justify-between gap-2"
                >
                  <p className="leading-snug">
                    <span className="font-semibold text-white mr-1.5">{c.author}</span>
                    {c.text}
                  </p>
                  <span className="text-[11px] text-slate-500 shrink-0">{c.timeAgo}</span>
                </div>
              ))}
            </div>
          )}

          {/* Add Comment */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddComment(post.id);
            }}
            className="flex items-center gap-2 pt-2 border-t border-slate-800/80 mt-2"
          >
            <input
              type="text"
              value={commentDrafts[post.id] || ''}
              onChange={(e) =>
                setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))
              }
              placeholder="Ask about BOQ rates, drawings, supply MOQ, or visit..."
              className="flex-1 bg-transparent text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none py-1"
            />
            <button
              type="submit"
              disabled={!(commentDrafts[post.id] || '').trim()}
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 disabled:text-slate-600 transition whitespace-nowrap"
            >
              Post
            </button>
          </form>
        </div>
      </article>
    );
  };

  // Reusable Facebook Page Feed Card
  const renderFacebookCard = (post: RealEstateSocialPost) => {
    const roleMeta = ROLE_DIRECTORY[post.posterRole];
    const showComments = !!expandedComments[post.id] || post.comments.length > 0;

    return (
      <article
        key={`fb-${post.id}`}
        className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
      >
        {/* FB Header */}
        <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={post.posterAvatar || roleMeta.avatar}
              alt={post.posterName}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover border border-slate-700 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-semibold text-white">{post.posterName}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1877F2] shrink-0" />
                <span className={`text-xs font-semibold ${roleMeta.accentText}`}>
                  · {roleMeta.label}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
                <span>{post.postedAgo}</span>
                <span>·</span>
                <span className="text-slate-300">{post.location}</span>
                <span>·</span>
                <span className="text-sky-400 font-medium">{post.listingStatus}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => toggleSave(post.id)}
              title={post.saved ? 'Remove from saved' : 'Save project'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition"
            >
              <Bookmark className={`w-4 h-4 ${post.saved ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>
            {(post.id.startsWith('eco-user-') || post.id.startsWith('eco-modal-')) && (
              <button
                type="button"
                onClick={() => handleDeleteCustomPost(post.id)}
                title="Delete post"
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* FB Headline & Spec Line */}
        <div className="px-4 pb-3 space-y-2">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <h4 className="text-base font-semibold text-white">{post.title}</h4>
            <span className="text-base font-bold text-emerald-400 tabular-nums">
              {post.priceLabel}
            </span>
          </div>
          <p className="text-xs text-slate-300 font-medium">
            {post.bhkOrType} · {post.areaSpec} · {post.facing} · {post.possessionStatus}
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">{post.caption}</p>
        </div>

        {/* Full-bleed Media */}
        <div
          className="group cursor-pointer border-y border-slate-800"
          onClick={() => setDetailPostId(post.id)}
        >
          {renderMediaFrame(post, 'aspect-[16/10]', false)}
        </div>

        {/* Marketplace / Vendor CTA Bar inside FB Post */}
        <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-slate-400">
              {roleMeta.label} · {post.location}
            </p>
            <p className="text-xs font-semibold text-white truncate">
              {post.bhkOrType} · {post.priceLabel}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => handleBoostPostAsAd(post)}
              className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 hover:border-amber-400 text-xs font-semibold text-amber-300 transition whitespace-nowrap"
            >
              Run Ad
            </button>
            <a
              href={`tel:${post.posterPhone.replace(/\s+/g, '')}`}
              className="px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 text-xs font-medium text-slate-200 transition whitespace-nowrap"
            >
              Call Desk
            </a>
            <button
              type="button"
              onClick={() => handleOpenPostInquiry(post)}
              className="px-3 py-1.5 rounded-lg bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-semibold transition whitespace-nowrap"
            >
              {post.posterRole === 'material_supplier'
                ? 'Request Quote'
                : post.posterRole === 'architect' || post.posterRole === 'interior_designer'
                ? 'Book Consult'
                : post.posterRole === 'builder'
                ? 'Request BOQ'
                : 'Schedule Visit'}
            </button>
          </div>
        </div>

        {/* FB Engagement Metrics */}
        <div className="px-4 py-2 flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 tabular-nums">
          <div className="flex items-center gap-1.5">
            <ThumbsUp className="w-3.5 h-3.5 text-[#1877F2]" />
            <span>{(post.likesCount || 0).toLocaleString()} reactions</span>
          </div>
          <div className="flex items-center gap-3">
            <span>{post.comments.length} comments</span>
            <span>{post.sharesCount} shares</span>
          </div>
        </div>

        {/* FB Action Row */}
        <div className="grid grid-cols-3 divide-x divide-slate-800/70 border-b border-slate-800/80">
          <button
            type="button"
            onClick={() => toggleLike(post.id)}
            className={`py-2.5 flex items-center justify-center gap-2 text-xs font-semibold transition hover:bg-slate-800/60 ${
              post.liked ? 'text-[#1877F2]' : 'text-slate-300'
            }`}
          >
            <ThumbsUp className={`w-4 h-4 ${post.liked ? 'fill-[#1877F2]' : ''}`} />
            <span>{post.liked ? 'Liked' : 'Like'}</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setExpandedComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))
            }
            className="py-2.5 flex items-center justify-center gap-2 text-xs font-semibold text-slate-300 hover:bg-slate-800/60 transition"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Comment</span>
          </button>

          <button
            type="button"
            onClick={() => handleShare(post)}
            className="py-2.5 flex items-center justify-center gap-2 text-xs font-semibold text-slate-300 hover:bg-slate-800/60 transition"
          >
            {copiedId === post.id ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Link Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>

        {/* FB Comments */}
        {showComments && (
          <div className="px-4 py-3 bg-slate-950/40 space-y-2.5">
            {post.comments.map((c) => (
              <div key={c.id} className="flex items-start gap-2.5">
                <img
                  src={architectAvatarImg}
                  alt={c.author}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full object-cover border border-slate-700 shrink-0 mt-0.5"
                />
                <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-white">{c.author}</span>
                    <span className="text-[11px] text-slate-500">{c.timeAgo}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{c.text}</p>
                </div>
              </div>
            ))}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddComment(post.id);
              }}
              className="flex items-center gap-2 pt-1"
            >
              <img
                src={ROLE_DIRECTORY[activePosterRole].avatar}
                alt="Active User"
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full object-cover border border-slate-700 shrink-0"
              />
              <input
                type="text"
                value={commentDrafts[post.id] || ''}
                onChange={(e) =>
                  setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))
                }
                placeholder={`Comment as ${ROLE_DIRECTORY[activePosterRole].defaultName}...`}
                className="flex-1 bg-slate-900 border border-slate-800 focus:border-[#1877F2] rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!(commentDrafts[post.id] || '').trim()}
                className="px-3 py-1.5 rounded-lg bg-[#1877F2] hover:bg-[#166fe5] disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold transition whitespace-nowrap"
              >
                Reply
              </button>
            </form>
          </div>
        )}
      </article>
    );
  };

  const roleTabs: { id: RoleFilter; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'all', label: `All Ecosystem (${roleCounts.all})`, icon: Building2 },
    { id: 'real_estate', label: `Real Estate (${roleCounts.real_estate})`, icon: Home },
    { id: 'architect', label: `Architects (${roleCounts.architect})`, icon: PenTool },
    { id: 'interior_designer', label: `Interiors (${roleCounts.interior_designer})`, icon: Sofa },
    { id: 'builder', label: `Builders (${roleCounts.builder})`, icon: HardHat },
    {
      id: 'material_supplier',
      label: `Material Suppliers (${roleCounts.material_supplier})`,
      icon: Package,
    },
    { id: 'client', label: `Clients (${roleCounts.client})`, icon: UserCheck },
  ];

  const categoryTabs: { id: RealEstateCategory; label: string }[] = [
    { id: 'all', label: 'All Work' },
    { id: 'for_sale', label: 'For Sale' },
    { id: 'for_rent', label: 'Rent & PG' },
    { id: 'architectural_design', label: 'Architecture & 3D' },
    { id: 'interior_fitout', label: 'Interiors & Modular' },
    { id: 'turnkey_build', label: 'Builder Turnkey' },
    { id: 'materials_supply', label: 'Materials & Stones' },
    { id: 'client_post', label: 'Client Stories & Requests' },
  ];

  const activeAccount = ROLE_DIRECTORY[activePosterRole];

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Studio Header & Role Switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium flex-wrap">
              <span className="text-white font-semibold">Realstate Media</span>
              <span aria-hidden="true">·</span>
              <span className="text-amber-300">Posts &amp; Run Ads Network</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{activeProject.name}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
              Realstate Media — Project Posts &amp; Run Ads Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Real Estate, Architects, Interior Designers, Builders, Suppliers, and Clients publish project posts and launch targeted IG, FB &amp; WhatsApp ad campaigns.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Quick Active Role Switcher */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
              <img
                src={activeAccount.avatar}
                alt={activeAccount.label}
                referrerPolicy="no-referrer"
                className="w-5 h-5 rounded-full object-cover"
              />
              <span className="text-[11px] text-slate-400 whitespace-nowrap">Post as:</span>
              <select
                value={activePosterRole}
                onChange={(e) => handleSelectActiveRole(e.target.value as PosterRole)}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none"
              >
                <option value="real_estate" className="bg-slate-900">
                  Real Estate
                </option>
                <option value="architect" className="bg-slate-900">
                  Architect
                </option>
                <option value="interior_designer" className="bg-slate-900">
                  Interior Designer
                </option>
                <option value="builder" className="bg-slate-900">
                  Builder
                </option>
                <option value="material_supplier" className="bg-slate-900">
                  Material Supplier
                </option>
                <option value="client" className="bg-slate-900">
                  Client
                </option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setOnlySaved((v) => !v)}
              className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap shrink-0 ${
                onlySaved
                  ? 'bg-amber-500/15 border-amber-500/60 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${onlySaved ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>Saved ({savedPosts.length})</span>
            </button>

            <button
              id="btn-social-import-active-project"
              type="button"
              onClick={() => {
                setModalRole('architect');
                setNewCompanyName(ROLE_DIRECTORY.architect.defaultName);
                setNewTitle(`${activeProject.name} — ${activeProject.projectType}`);
                setNewLocation(activeProject.location || 'Bengaluru');
                setNewAreaSpec(
                  activeProject.builtUpAreaSqFt
                    ? `${activeProject.builtUpAreaSqFt.toLocaleString()} sq.ft`
                    : '3,200 sq.ft'
                );
                setNewSpecType(activeProject.projectType || 'Architectural Project');
                setNewCategory('architectural_design');
                setNewCaption(
                  activeProject.description ||
                    `Active studio showcase for ${activeProject.name} in ${activeProject.location}. Stage: ${activeProject.status.replace(/_/g, ' ')}. Reach out for drawings, BOQ consultation, or site visit.`
                );
                setIsComposerOpen(true);
              }}
              className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 hover:border-amber-500/60 text-amber-300 font-semibold text-xs flex items-center gap-1.5 transition whitespace-nowrap shrink-0"
              title="Prefill showcase post from your currently active studio project"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Post Active Project</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setModalRole(activePosterRole);
                setIsComposerOpen(true);
              }}
              className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Post Your Project</span>
            </button>
          </div>
        </div>

        {/* Platform Switcher & Search */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 xl:pb-0">
            {[
              { id: 'instagram', label: 'Instagram Feed', icon: ImageIcon },
              { id: 'facebook', label: 'Facebook Page', icon: Building2 },
              { id: 'dual', label: 'Dual IG + FB View', icon: LayoutList },
              { id: 'virtual_tour', label: '360° Tour', icon: Compass },
              { id: 'brochure', label: 'PDF Lookbook', icon: FileText },
              { id: 'campaigns', label: `Run Ads (${leads.length} Leads)`, icon: Megaphone },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = platformMode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPlatformMode(tab.id as PlatformMode)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap shrink-0 border ${
                    isActive
                      ? tab.id === 'campaigns'
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-800 border-slate-600 text-white'
                      : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {(platformMode === 'instagram' || platformMode === 'facebook' || platformMode === 'dual') && (
            <div className="relative w-full xl:w-80 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search villas, architects, builders, marble, TMT..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-slate-600 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Stakeholder Role Filter Row + Category Sub-Filter */}
        {(platformMode === 'instagram' || platformMode === 'facebook' || platformMode === 'dual') && (
          <div className="space-y-2.5 pt-1">
            {/* Industry Role Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {roleTabs.map((rt) => {
                const Icon = rt.icon;
                const active = roleFilter === rt.id;
                return (
                  <button
                    key={rt.id}
                    type="button"
                    onClick={() => setRoleFilter(rt.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap shrink-0 border ${
                      active
                        ? 'bg-sky-500/15 text-sky-300 border-sky-500/50'
                        : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{rt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Category Filter */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {categoryTabs.map((cat) => {
                  const active = categoryFilter === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        if (cat.id === 'for_rent') {
                          setCategoryFilter(categoryFilter === 'for_rent' ? 'pg_coliving' : 'for_rent');
                        } else {
                          setCategoryFilter(cat.id);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition whitespace-nowrap shrink-0 ${
                        active || (cat.id === 'for_rent' && categoryFilter === 'pg_coliving')
                          ? 'bg-amber-400/15 text-amber-300 border border-amber-400/40'
                          : 'bg-slate-950/50 text-slate-400 border border-slate-800/80 hover:text-slate-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
              <span className="text-xs text-slate-400 tabular-nums whitespace-nowrap">
                Showing {filteredPosts.length} of {posts.length} projects
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* VIEW 1: INSTAGRAM MODEL                                                */}
      {/* ===================================================================== */}
      {platformMode === 'instagram' && (
        <div className="space-y-6">
          {/* Instagram Profile + Stories */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-[3px] bg-gradient-to-tr from-amber-500 via-rose-500 to-fuchsia-600 shrink-0">
                  <img
                    src={activeAccount.avatar}
                    alt={activeAccount.defaultName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full rounded-full object-cover border-4 border-slate-950"
                  />
                </div>
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                      {activeAccount.defaultHandle}
                    </h2>
                    <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                    <span className={`text-xs font-semibold ${activeAccount.accentText}`}>
                      · {activeAccount.label} Account
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-slate-200">
                    {activeAccount.defaultName} · Realstate Media Network (Real Estate, Architects, Builders, Suppliers &amp; Clients)
                  </p>
                  <p className="text-xs text-slate-400">
                    Bengaluru Verified Hub · Direct Project Posting &amp; Inquiry · +91 80739 47241
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 sm:gap-8 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800 tabular-nums shrink-0">
                <div>
                  <p className="text-lg font-bold text-white">{posts.length}</p>
                  <p className="text-xs text-slate-400">Projects</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-white">5 Roles</p>
                  <p className="text-xs text-slate-400">Verified</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{savedPosts.length}</p>
                  <p className="text-xs text-slate-400">Shortlisted</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setModalRole(activePosterRole);
                    setIsComposerOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white transition whitespace-nowrap"
                >
                  + Share Project
                </button>
              </div>
            </div>

            {/* Interactive Stories Strip Across All 4 Roles */}
            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Story Highlights (Real Estate · Architect · Builder · Supplier · Client)
                </span>
                <span className="text-xs text-slate-500">Tap any story circle</span>
              </div>
              <div className="flex items-center gap-4 overflow-x-auto pb-1">
                {STORY_HIGHLIGHTS.map((story, index) => (
                  <button
                    key={story.id}
                    type="button"
                    onClick={() => setActiveStoryIdx(index)}
                    className="flex flex-col items-center gap-1.5 group shrink-0 w-24 focus:outline-none"
                  >
                    <div className="w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600 group-hover:scale-105 transition-transform">
                      <img
                        src={story.imageUrl}
                        alt={story.label}
                        referrerPolicy="no-referrer"
                        className="w-full h-full rounded-full object-cover border-2 border-slate-950"
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-200 group-hover:text-white truncate w-full text-center">
                      {story.label}
                    </span>
                    <span className={`text-[10px] font-medium ${ROLE_DIRECTORY[story.role].accentText} -mt-1`}>
                      {ROLE_DIRECTORY[story.role].shortLabel}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* IG Sub-View Switcher */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                {[
                  { id: 'feed', label: 'IG Feed', icon: LayoutList },
                  { id: 'grid', label: '3-Col Profile Grid', icon: Grid3X3 },
                  { id: 'reels', label: 'Project Reels', icon: Film },
                ].map((sub) => {
                  const Icon = sub.icon;
                  const active = igSubView === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setIgSubView(sub.id as IgSubView)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap ${
                        active
                          ? 'bg-slate-800 text-white border border-slate-600'
                          : 'text-slate-400 hover:text-slate-200 border border-transparent'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{sub.label}</span>
                    </button>
                  );
                })}
              </div>
              <span className="text-xs text-slate-400">
                Click any project card to inspect full specs, BOQ rate &amp; comments
              </span>
            </div>
          </div>

          {/* IG Sub-View Content */}
          {filteredPosts.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center space-y-2">
              <p className="text-sm font-semibold text-white">No projects match this filter</p>
              <p className="text-xs text-slate-400">
                Switch back to All Ecosystem or post a new project using the button above.
              </p>
            </div>
          ) : igSubView === 'feed' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {filteredPosts.map((post) => renderInstagramCard(post, false))}
            </div>
          ) : igSubView === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {filteredPosts.map((post) => {
                const roleMeta = ROLE_DIRECTORY[post.posterRole];
                return (
                  <button
                    key={`grid-${post.id}`}
                    type="button"
                    onClick={() => setDetailPostId(post.id)}
                    className="group relative aspect-square bg-slate-900 border border-slate-800 overflow-hidden rounded-lg text-left focus:outline-none"
                  >
                    <img
                      src={post.thumbnailUrl || post.url}
                      alt={post.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {(post.isReel || post.type === 'video') && (
                      <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg bg-slate-950/75 flex items-center justify-center text-white">
                        <Play className="w-3.5 h-3.5 fill-white" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent flex flex-col justify-end p-3">
                      <span className={`text-[11px] font-semibold ${roleMeta.accentText}`}>
                        {roleMeta.label} · {post.posterHandle}
                      </span>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span className="text-xs font-bold text-white tabular-nums">
                          {post.priceLabel}
                        </span>
                        <div className="flex items-center gap-2.5 text-xs text-slate-200 tabular-nums">
                          <span className="flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5 fill-white" />
                            {post.likesCount || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3.5 h-3.5" />
                            {post.comments.length}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-300 truncate mt-0.5">
                        {post.title}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPosts.map((post) => {
                const roleMeta = ROLE_DIRECTORY[post.posterRole];
                return (
                  <div
                    key={`reel-${post.id}`}
                    className="group relative aspect-[9/16] max-h-[540px] w-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-end"
                  >
                    <img
                      src={post.thumbnailUrl || post.url}
                      alt={post.title}
                      referrerPolicy="no-referrer"
                      onClick={() => setDetailPostId(post.id)}
                      className="absolute inset-0 w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />

                    <div className="relative z-10 p-4 flex items-end justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <p className={`text-xs font-semibold ${roleMeta.accentText} tabular-nums`}>
                          {roleMeta.label} · {post.priceLabel}
                        </p>
                        <h4 className="text-sm font-bold text-white leading-snug line-clamp-2">
                          {post.title}
                        </h4>
                        <p className="text-xs text-slate-300 truncate">
                          {post.posterName} · {post.location}
                        </p>
                      </div>

                      <div className="flex flex-col items-center gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleLike(post.id)}
                          className="flex flex-col items-center gap-0.5 text-white"
                        >
                          <Heart
                            className={`w-6 h-6 ${
                              post.liked ? 'fill-rose-500 text-rose-500' : ''
                            }`}
                          />
                          <span className="text-[11px] font-semibold tabular-nums">
                            {formatCompact(post.likesCount || 0)}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDetailPostId(post.id)}
                          className="flex flex-col items-center gap-0.5 text-white"
                        >
                          <MessageCircle className="w-6 h-6" />
                          <span className="text-[11px] font-semibold tabular-nums">
                            {post.comments.length}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleSave(post.id)}
                          className="flex flex-col items-center gap-0.5 text-white"
                        >
                          <Bookmark
                            className={`w-5 h-5 ${
                              post.saved ? 'fill-amber-400 text-amber-400' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW 2: FACEBOOK INDUSTRY PAGE & MARKETPLACE FEED MODEL                */}
      {/* ===================================================================== */}
      {platformMode === 'facebook' && (
        <div className="space-y-6">
          {/* Facebook Cover & Page Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="relative h-44 sm:h-56 w-full bg-slate-950">
              <img
                src={villaExteriorImg}
                alt="Gouse Construction & Real Estate Community"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="flex items-end gap-3.5">
                  <img
                    src={activeAccount.avatar}
                    alt={activeAccount.defaultName}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-slate-900 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h2 className="text-lg sm:text-xl font-bold text-white">
                        {activeAccount.defaultName}
                      </h2>
                      <CheckCircle2 className="w-4 h-4 text-[#1877F2] shrink-0" />
                      <span className={`text-xs font-semibold ${activeAccount.accentText}`}>
                        · {activeAccount.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Real Estate · Architects · Turnkey Builders · Material Suppliers Hub · Bengaluru
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href="tel:+918073947241"
                    className="px-3.5 py-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-white flex items-center gap-1.5 transition whitespace-nowrap"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>+91 80739 47241</span>
                  </a>
                  <a
                    href="https://wa.me/918073947241?text=Hello%20Gouse%20Hub%2C%20I%20would%20like%20to%20connect%20with%20your%20Real%20Estate%2C%20Architect%2C%20Builder%20or%20Material%20Supplier%20desk."
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-lg bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-semibold transition whitespace-nowrap"
                  >
                    Message Desk
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* 2-Column Facebook Desktop Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
            {/* Left Main FB Feed + Multi-Role Inline Composer */}
            <div className="space-y-5 min-w-0">
              <form
                onSubmit={handleQuickFbPublish}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3"
              >
                {/* Role Pills Row inside Composer */}
                <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-800/80">
                  <span className="text-xs font-semibold text-slate-400">
                    Create Post As:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(['real_estate', 'architect', 'interior_designer', 'builder', 'material_supplier', 'client'] as PosterRole[]).map(
                      (r) => {
                        const selected = activePosterRole === r;
                        return (
                          <button
                            key={`fb-role-${r}`}
                            type="button"
                            onClick={() => handleSelectActiveRole(r)}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                              selected
                                ? 'bg-[#1877F2] text-white'
                                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                          >
                            {ROLE_DIRECTORY[r].shortLabel}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <img
                    src={activeAccount.avatar}
                    alt={activeAccount.defaultName}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
                  />
                  <div className="flex-1 space-y-2">
                    {fbShowAttachBar && (
                      <input
                        type="text"
                        value={fbDraftTitle}
                        onChange={(e) => setFbDraftTitle(e.target.value)}
                        placeholder={`Project headline (e.g. ${
                          activePosterRole === 'architect'
                            ? 'Modern 40x60 Villa 3D Elevation & GFC Plan'
                            : activePosterRole === 'interior_designer'
                            ? 'Fluted Oak Living & Statuario Quartz Kitchen'
                            : activePosterRole === 'builder'
                            ? 'G+2 Turnkey RCC Slab Casting Complete'
                            : activePosterRole === 'material_supplier'
                            ? 'Italian Marble & Fe-550D TMT Ready Stock'
                            : activePosterRole === 'client'
                            ? 'Our Completed 30x40 Home or Looking for Architect & Builder'
                            : 'Whitefield 3 BHK Ready Villa Open House'
                        })`}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-[#1877F2] rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                      />
                    )}
                    <textarea
                      rows={2}
                      value={fbDraftText}
                      onChange={(e) => {
                        setFbDraftText(e.target.value);
                        if (!fbShowAttachBar && e.target.value.length > 0) setFbShowAttachBar(true);
                      }}
                      placeholder={`Post as ${activeAccount.defaultName} (${activeAccount.label}) — share project photos, rates, build requirements, or reviews...`}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-[#1877F2] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none resize-none"
                    />
                  </div>
                </div>

                {fbShowAttachBar && (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1">
                    <select
                      value={fbDraftCategory}
                      onChange={(e) =>
                        setFbDraftCategory(e.target.value as Exclude<RealEstateCategory, 'all'>)
                      }
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    >
                      <option value="for_sale">For Sale (Property)</option>
                      <option value="for_rent">For Rent</option>
                      <option value="pg_coliving">PG &amp; Co-Living</option>
                      <option value="land_plots">Land &amp; Plots</option>
                      <option value="architectural_design">Architecture &amp; 3D</option>
                      <option value="interior_fitout">Interiors &amp; Modular</option>
                      <option value="turnkey_build">Builder Site / Turnkey</option>
                      <option value="materials_supply">Materials Supply</option>
                      <option value="client_post">Client Story / Requirement</option>
                    </select>
                    <input
                      type="text"
                      value={fbDraftPrice}
                      onChange={(e) => setFbDraftPrice(e.target.value)}
                      placeholder="Price / Rate"
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    />
                    <input
                      type="text"
                      value={fbDraftLocation}
                      onChange={(e) => setFbDraftLocation(e.target.value)}
                      placeholder="Location"
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    />
                    <select
                      value={fbDraftImageUrl}
                      onChange={(e) => setFbDraftImageUrl(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    >
                      <option value={duskVillaCampaignImg}>Photo: Dusk Cantilever Villa</option>
                      <option value={luxuryInteriorLivingImg}>Photo: Fluted Oak Living</option>
                      <option value={modularQuartzKitchenImg}>Photo: Quartz Island Kitchen</option>
                      <option value={villaExteriorImg}>Photo: Whitefield Villa</option>
                      <option value={villaElevationImg}>Photo: Architect 3D Facade</option>
                      <option value={siteFramingImg}>Photo: Builder Site RCC</option>
                      <option value={modernBathImg}>Photo: Stone &amp; Bath Supply</option>
                      <option value={rccFramingImg}>Photo: TMT Steel &amp; Slab</option>
                      <option value={apartmentTowerImg}>Photo: 3BHK Tower</option>
                      <option value={pgBedroomSuiteImg}>Photo: Executive PG Suite</option>
                      <option value={courtyardDiningImg}>Photo: Interior Courtyard</option>
                    </select>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setFbShowAttachBar((v) => !v)}
                      className="px-3 py-1.5 rounded-lg hover:bg-slate-800 text-xs font-medium text-slate-300 flex items-center gap-1.5 transition"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
                      <span>Project Specs</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAiDraftFbPost}
                      disabled={isDraftingFbAi}
                      className="px-3 py-1.5 rounded-lg hover:bg-slate-800 text-xs font-medium text-amber-300 flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isDraftingFbAi ? 'Drafting...' : 'AI Draft Copy'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fbFileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg hover:bg-slate-800 text-xs font-medium text-slate-300 flex items-center gap-1.5 transition"
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Upload Photo</span>
                    </button>
                    <input
                      ref={fbFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleQuickFbFile}
                      className="hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!fbDraftText.trim()}
                    className="px-4 py-1.5 rounded-lg bg-[#1877F2] hover:bg-[#166fe5] disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold transition whitespace-nowrap"
                  >
                    Publish as {activeAccount.shortLabel}
                  </button>
                </div>
              </form>

              {filteredPosts.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center">
                  <p className="text-sm font-semibold text-white">No projects match this filter</p>
                </div>
              ) : (
                filteredPosts.map((post) => renderFacebookCard(post))
              )}
            </div>

            {/* Right Sticky Sidebar: Partner Directory + Saved + Contact */}
            <aside className="space-y-5 lg:sticky lg:top-6">
              {/* Industry Contributors Directory */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Verified Ecosystem Posters</h3>
                  <span className="text-xs text-slate-400">Filter feed</span>
                </div>
                <div className="divide-y divide-slate-800">
                  {(['real_estate', 'architect', 'interior_designer', 'builder', 'material_supplier', 'client'] as PosterRole[]).map(
                    (roleKey) => {
                      const info = ROLE_DIRECTORY[roleKey];
                      const count = roleCounts[roleKey];
                      const active = roleFilter === roleKey;
                      return (
                        <button
                          key={`dir-${roleKey}`}
                          type="button"
                          onClick={() => setRoleFilter(active ? 'all' : roleKey)}
                          className={`w-full py-2.5 flex items-center gap-3 text-left rounded-lg px-2 transition ${
                            active ? 'bg-slate-800/80' : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <img
                            src={info.avatar}
                            alt={info.defaultName}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-700"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-white truncate">
                              {info.defaultName}
                            </p>
                            <p className={`text-[11px] font-medium ${info.accentText}`}>
                              {info.label} · {count} posts
                            </p>
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Saved Projects */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Saved Shortlist</h3>
                  <span className="text-xs text-amber-300 tabular-nums">{savedPosts.length} saved</span>
                </div>
                {savedPosts.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    Bookmark properties, architectural elevations, builder sites, or material quotes to pin them here.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {savedPosts.map((sp) => (
                      <button
                        key={`saved-${sp.id}`}
                        type="button"
                        onClick={() => setDetailPostId(sp.id)}
                        className="w-full flex items-center justify-between gap-2 text-left py-1.5 px-2 rounded-lg bg-slate-950/70 hover:bg-slate-800 transition"
                      >
                        <div className="min-w-0">
                          <p className="text-xs text-slate-200 truncate">{sp.title}</p>
                          <p className="text-[10px] text-slate-500">
                            {ROLE_DIRECTORY[sp.posterRole].shortLabel}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-emerald-400 tabular-nums shrink-0">
                          {sp.priceLabel}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Direct Desk */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-white">Direct Project &amp; Supply Desk</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Connect directly with Real Estate advisors, Architects, Turnkey Civil Builders, and Material Suppliers.
                </p>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>+91 80739 47241</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>sgouse14@gmail.com</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW 3: DUAL INSTAGRAM + FACEBOOK SPLIT PREVIEW                        */}
      {/* ===================================================================== */}
      {platformMode === 'dual' && dualSelectedPost && (
        <div className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-semibold text-slate-400 px-2 whitespace-nowrap shrink-0">
              Preview Project:
            </span>
            {filteredPosts.map((item) => {
              const selected = item.id === dualSelectedPost.id;
              return (
                <button
                  key={`dual-pick-${item.id}`}
                  type="button"
                  onClick={() => setDualPostId(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap shrink-0 border ${
                    selected
                      ? 'bg-slate-800 border-amber-400/60 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  [{ROLE_DIRECTORY[item.posterRole].shortLabel}] {item.title.slice(0, 26)} ({item.priceLabel})
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                  Instagram Project Card (4:5 / 1:1)
                </span>
                <button
                  type="button"
                  onClick={() => handleShare(dualSelectedPost)}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedId === dualSelectedPost.id ? 'Caption Copied' : 'Copy IG Caption'}</span>
                </button>
              </div>
              {renderInstagramCard(dualSelectedPost, true)}
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#1877F2]">
                  Facebook Page &amp; Marketplace Card (16:10)
                </span>
                <span className="text-xs text-slate-400">Synced Live Likes &amp; Comments</span>
              </div>
              {renderFacebookCard(dualSelectedPost)}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW 4: SUB-TOOLS (360 VIRTUAL TOUR / LOOKBOOK / ADS)                  */}
      {/* ===================================================================== */}
      {platformMode === 'virtual_tour' && (
        <SocialVirtualTourAndCampaigns activeProject={activeProject} mode="virtual_tour" />
      )}
      {platformMode === 'brochure' && (
        <SocialVirtualTourAndCampaigns activeProject={activeProject} mode="brochure" />
      )}
      {platformMode === 'campaigns' && (
        <SocialAdManager
          activeProject={activeProject}
          posts={posts}
          preselectedPost={boostPostTarget}
          leads={leads}
          onAddLead={(lead) => setLeads((prev) => [lead, ...prev])}
          onUpdateLeadStatus={(leadId: string, status: LeadStatus) =>
            setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status } : l)))
          }
          onDeleteLead={(leadId: string) =>
            setLeads((prev) => prev.filter((l) => l.id !== leadId))
          }
        />
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: INSTAGRAM STORY VIEWER                                        */}
      {/* ===================================================================== */}
      {activeStoryIdx !== null && STORY_HIGHLIGHTS[activeStoryIdx] && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/95 flex items-center justify-center p-4"
          onClick={() => setActiveStoryIdx(null)}
        >
          <div
            className="relative w-full max-w-sm aspect-[9/16] max-h-[88vh] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={STORY_HIGHLIGHTS[activeStoryIdx].imageUrl}
              alt={STORY_HIGHLIGHTS[activeStoryIdx].headline}
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/80 via-transparent to-slate-950/95" />

            <div className="relative z-10 p-4 space-y-3">
              <div className="flex gap-1">
                {STORY_HIGHLIGHTS.map((s, idx) => (
                  <div
                    key={s.id}
                    className={`h-1 flex-1 rounded-full ${
                      idx <= activeStoryIdx ? 'bg-white' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={ROLE_DIRECTORY[STORY_HIGHLIGHTS[activeStoryIdx].role].avatar}
                    alt={STORY_HIGHLIGHTS[activeStoryIdx].posterHandle}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover border border-white/40"
                  />
                  <div>
                    <p className="text-xs font-semibold text-white">
                      {STORY_HIGHLIGHTS[activeStoryIdx].posterHandle}
                    </p>
                    <p className="text-[11px] text-slate-300">
                      {ROLE_DIRECTORY[STORY_HIGHLIGHTS[activeStoryIdx].role].label} ·{' '}
                      {STORY_HIGHLIGHTS[activeStoryIdx].postedAgo}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveStoryIdx(null)}
                  className="p-1.5 rounded-lg bg-slate-950/60 text-white hover:bg-slate-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative z-10 flex items-center justify-between px-2">
              <button
                type="button"
                onClick={() =>
                  setActiveStoryIdx((prev) =>
                    prev === null
                      ? null
                      : (prev - 1 + STORY_HIGHLIGHTS.length) % STORY_HIGHLIGHTS.length
                  )
                }
                className="w-9 h-9 rounded-full bg-slate-950/65 hover:bg-slate-900 text-white flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setActiveStoryIdx((prev) =>
                    prev === null ? null : (prev + 1) % STORY_HIGHLIGHTS.length
                  )
                }
                className="w-9 h-9 rounded-full bg-slate-950/65 hover:bg-slate-900 text-white flex items-center justify-center"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="relative z-10 p-5 space-y-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-semibold text-slate-300">
                  {STORY_HIGHLIGHTS[activeStoryIdx].location}
                </span>
                <span className="text-base font-bold text-amber-300 tabular-nums">
                  {STORY_HIGHLIGHTS[activeStoryIdx].priceTag}
                </span>
              </div>
              <h3 className="text-base font-bold text-white leading-snug">
                {STORY_HIGHLIGHTS[activeStoryIdx].headline}
              </h3>
              <p className="text-xs text-slate-300">
                {STORY_HIGHLIGHTS[activeStoryIdx].subline}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setRoleFilter(STORY_HIGHLIGHTS[activeStoryIdx].role);
                    setActiveStoryIdx(null);
                  }}
                  className="flex-1 py-2 rounded-lg bg-slate-900/90 border border-slate-700 text-xs font-semibold text-white hover:bg-slate-800 transition"
                >
                  View {ROLE_DIRECTORY[STORY_HIGHLIGHTS[activeStoryIdx].role].shortLabel} Posts
                </button>
                <a
                  href={`https://wa.me/918073947241?text=${encodeURIComponent(
                    `Hello, I saw your "${STORY_HIGHLIGHTS[activeStoryIdx].headline}" story (${STORY_HIGHLIGHTS[activeStoryIdx].priceTag}) and want details.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold text-center transition"
                >
                  Inquire Now
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: PROJECT LIGHTBOX & COMMENTS DETAIL VIEW                       */}
      {/* ===================================================================== */}
      {detailPost && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4"
          onClick={() => setDetailPostId(null)}
        >
          <div
            className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-xl overflow-hidden grid grid-cols-1 md:grid-cols-[1.2fr_1fr] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-950 flex items-center justify-center min-h-[280px] max-h-[55vh] md:max-h-[90vh]">
              {detailPost.type === 'video' ? (
                <video
                  src={detailPost.url}
                  poster={detailPost.thumbnailUrl || villaExteriorImg}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              ) : (
                <img
                  src={detailPost.url}
                  alt={detailPost.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            <div className="flex flex-col border-t md:border-t-0 md:border-l border-slate-800 max-h-[90vh]">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={detailPost.posterAvatar}
                    alt={detailPost.posterName}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {detailPost.posterName} · {ROLE_DIRECTORY[detailPost.posterRole].label}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{detailPost.location}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailPostId(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto flex-1 space-y-4">
                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-base font-bold text-white">{detailPost.title}</h3>
                    <span className="text-base font-bold text-amber-300 tabular-nums shrink-0">
                      {detailPost.priceLabel}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-500 block">Scope / Config</span>
                      <span className="text-slate-200 font-medium">{detailPost.bhkOrType}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Scale / Quantity</span>
                      <span className="text-slate-200 font-medium tabular-nums">
                        {detailPost.areaSpec}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Specification</span>
                      <span className="text-slate-200 font-medium">{detailPost.facing}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Status</span>
                      <span className="text-slate-200 font-medium">
                        {detailPost.possessionStatus}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{detailPost.caption}</p>
                <p className="text-xs text-sky-400">{detailPost.hashtags.join(' ')}</p>

                <div className="pt-2 border-t border-slate-800 space-y-2.5">
                  <p className="text-xs font-semibold text-slate-400">
                    Comments ({detailPost.comments.length})
                  </p>
                  {detailPost.comments.length === 0 ? (
                    <p className="text-xs text-slate-500">No comments yet. Ask a question below.</p>
                  ) : (
                    detailPost.comments.map((c) => (
                      <div key={c.id} className="text-xs text-slate-300 flex justify-between gap-2">
                        <p>
                          <span className="font-semibold text-white mr-1.5">{c.author}</span>
                          {c.text}
                        </p>
                        <span className="text-slate-500 shrink-0">{c.timeAgo}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => toggleLike(detailPost.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-white"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          detailPost.liked ? 'fill-rose-500 text-rose-500' : ''
                        }`}
                      />
                      <span className="tabular-nums">{detailPost.likesCount || 0}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShare(detailPost)}
                      className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>{copiedId === detailPost.id ? 'Copied' : 'Share'}</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDetailPostId(null);
                        handleBoostPostAsAd(detailPost);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-semibold transition"
                    >
                      Run Ad
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDetailPostId(null);
                        handleOpenPostInquiry(detailPost);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold transition"
                    >
                      Send Inquiry
                    </button>
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddComment(detailPost.id);
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={commentDrafts[detailPost.id] || ''}
                    onChange={(e) =>
                      setCommentDrafts((prev) => ({
                        ...prev,
                        [detailPost.id]: e.target.value,
                      }))
                    }
                    placeholder="Add comment or inquiry..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold"
                  >
                    Post
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: POST YOUR PROJECT (REAL ESTATE / ARCHITECT / BUILDER / SUPP)  */}
      {/* ===================================================================== */}
      {isComposerOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4"
          onClick={() => setIsComposerOpen(false)}
        >
          <form
            onSubmit={handleCreateModalPost}
            className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  Post Your Project to Instagram &amp; Facebook Feeds
                </h3>
                <p className="text-xs text-slate-400">
                  Choose your role — Real Estate, Architect, Builder, Material Supplier, or Client.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsComposerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Role Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  I am posting as
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(['real_estate', 'architect', 'interior_designer', 'builder', 'material_supplier', 'client'] as PosterRole[]).map(
                    (r) => {
                      const selected = modalRole === r;
                      const info = ROLE_DIRECTORY[r];
                      return (
                        <button
                          key={`modal-role-${r}`}
                          type="button"
                          onClick={() => {
                            setModalRole(r);
                            setNewCompanyName(info.defaultName);
                            setNewPrice(info.placeholderRate);
                            setNewCategory(info.defaultCategory);
                          }}
                          className={`py-2 px-2 rounded-lg border text-xs font-semibold transition text-center ${
                            selected
                              ? 'bg-sky-500/15 border-sky-400 text-white'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {info.label}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Quick Starter Templates */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">Templates:</span>
                {[
                  {
                    label: 'Dusk Villa Launch',
                    role: 'real_estate' as PosterRole,
                    cat: 'for_sale' as Exclude<RealEstateCategory, 'all'>,
                    title: 'Cantilevered Dusk Villa — Private Walkthrough',
                    price: '₹4.25 Cr',
                    area: '4,850 sq.ft',
                    img: duskVillaCampaignImg,
                  },
                  {
                    label: 'Interior & Kitchen',
                    role: 'interior_designer' as PosterRole,
                    cat: 'interior_fitout' as Exclude<RealEstateCategory, 'all'>,
                    title: 'Fluted Oak Living & Statuario Quartz Kitchen',
                    price: '₹1,650 / sq.ft',
                    area: '2,650 sq.ft',
                    img: luxuryInteriorLivingImg,
                  },
                  {
                    label: 'Turnkey Slab Log',
                    role: 'builder' as PosterRole,
                    cat: 'turnkey_build' as Exclude<RealEstateCategory, 'all'>,
                    title: 'G+3 RCC Framing & M25 Concrete Milestone',
                    price: '₹2,150 / sq.ft',
                    area: '4,100 sq.ft',
                    img: siteFramingImg,
                  },
                  {
                    label: 'Material Lot',
                    role: 'material_supplier' as PosterRole,
                    cat: 'materials_supply' as Exclude<RealEstateCategory, 'all'>,
                    title: 'Italian Travertine & Fe-550D Direct Depot Lot',
                    price: '₹240 / sq.ft',
                    area: '10,000 sq.ft Stock',
                    img: modernBathImg,
                  },
                ].map((tpl) => (
                  <button
                    key={tpl.label}
                    type="button"
                    onClick={() => {
                      setModalRole(tpl.role);
                      setNewCompanyName(ROLE_DIRECTORY[tpl.role].defaultName);
                      setNewCategory(tpl.cat);
                      setNewTitle(tpl.title);
                      setNewPrice(tpl.price);
                      setNewAreaSpec(tpl.area);
                      setNewMediaType('photo');
                      setNewMediaUrl(tpl.img);
                      setNewGalleryUrls(
                        tpl.img === luxuryInteriorLivingImg
                          ? [luxuryInteriorLivingImg, modularQuartzKitchenImg]
                          : [tpl.img]
                      );
                    }}
                    className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-[11px] text-slate-300 hover:text-amber-300 whitespace-nowrap shrink-0 transition"
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {modalRole === 'client' ? 'Your Name / Plot Owner' : 'Studio / Company / Supplier Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    placeholder="e.g. Studio Gouse Architects"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Project / Requirement / Product Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder={
                      modalRole === 'material_supplier'
                        ? 'e.g. Italian Travertine & Fe-550D Steel Lot'
                        : modalRole === 'architect'
                        ? 'e.g. 40x60 Contemporary Villa 3D & GFC'
                        : modalRole === 'interior_designer'
                        ? 'e.g. Fluted Oak Living & Modular Kitchen'
                        : modalRole === 'builder'
                        ? 'e.g. Sarjapur G+2 Turnkey Handover'
                        : modalRole === 'client'
                        ? 'e.g. Need Architect & Builder for 30x40 Plot'
                        : 'e.g. Whitefield 4 BHK Corner Villa'
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) =>
                      setNewCategory(e.target.value as Exclude<RealEstateCategory, 'all'>)
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="for_sale">For Sale</option>
                    <option value="for_rent">For Rent</option>
                    <option value="pg_coliving">PG &amp; Co-Living</option>
                    <option value="land_plots">Land &amp; Plots</option>
                    <option value="architectural_design">Architecture &amp; 3D</option>
                    <option value="interior_fitout">Interiors &amp; Modular</option>
                    <option value="turnkey_build">Builder Turnkey</option>
                    <option value="materials_supply">Materials Supply</option>
                    <option value="client_post">Client Story / Request</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Price / Rate
                  </label>
                  <input
                    type="text"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Area / MOQ Spec
                  </label>
                  <input
                    type="text"
                    value={newAreaSpec}
                    onChange={(e) => setNewAreaSpec(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Project Description &amp; Technical Highlights
                  </label>
                  <button
                    type="button"
                    onClick={handleAiDraftModalPost}
                    disabled={isDraftingModalAi}
                    className="text-xs font-semibold text-amber-300 hover:text-amber-200 flex items-center gap-1 disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isDraftingModalAi ? 'Writing Caption...' : 'AI Draft Caption & Tags'}</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  placeholder="Share plot size, design concept, structural grade, material brand, or open house availability..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300">
                    Project Photos (Click multiple to build carousel · {newGalleryUrls.length} selected)
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload from Device</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleModalFileChange}
                    className="hidden"
                  />
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { label: 'Dusk Villa', url: duskVillaCampaignImg },
                    { label: 'Oak Living', url: luxuryInteriorLivingImg },
                    { label: 'Quartz Kitchen', url: modularQuartzKitchenImg },
                    { label: '3D Facade', url: villaElevationImg },
                    { label: 'RCC Site', url: siteFramingImg },
                    { label: 'Stone & Bath', url: modernBathImg },
                  ].map((preset) => {
                    const isPicked = newGalleryUrls.includes(preset.url);
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setNewMediaType('photo');
                          setNewMediaUrl(preset.url);
                          setNewGalleryUrls((prev) => {
                            if (prev.includes(preset.url)) {
                              return prev.length > 1 ? prev.filter((u) => u !== preset.url) : prev;
                            }
                            return [...prev, preset.url];
                          });
                        }}
                        className={`rounded-lg overflow-hidden border text-left transition ${
                          isPicked
                            ? 'border-sky-400 ring-1 ring-sky-400'
                            : 'border-slate-800 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          referrerPolicy="no-referrer"
                          className="w-full h-14 object-cover"
                        />
                        <span className="block px-1.5 py-1 text-[10px] text-slate-300 bg-slate-950 truncate">
                          {preset.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsComposerOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold"
              >
                Publish as {ROLE_DIRECTORY[modalRole].label}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 4: IN-APP POST LEAD INQUIRY MODAL                               */}
      {/* ===================================================================== */}
      {inquiryPost && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4"
          onClick={() => setInquiryPost(null)}
        >
          <form
            onSubmit={handleSubmitPostInquiry}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl"
          >
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-sky-400">
                  Direct Inquiry · {ROLE_DIRECTORY[inquiryPost.posterRole].label}
                </p>
                <h3 className="text-sm font-bold text-white truncate">{inquiryPost.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setInquiryPost(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              {inquirySentBanner ? (
                <div className="py-6 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-sm font-semibold text-white">Inquiry Logged to Lead Inbox</p>
                  <p className="text-xs text-slate-400">
                    Your inquiry is saved under Run Ads · Lead Inbox for {inquiryPost.posterName}.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={inquiryName}
                      onChange={(e) => setInquiryName(e.target.value)}
                      placeholder="e.g. Prakash Verma"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Phone / WhatsApp *</label>
                    <input
                      type="text"
                      required
                      value={inquiryPhone}
                      onChange={(e) => setInquiryPhone(e.target.value)}
                      placeholder="+91 98450 12345"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Requirement / Visit Date</label>
                    <textarea
                      rows={2}
                      value={inquiryNote}
                      onChange={(e) => setInquiryNote(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={whatsappInquiryUrl(inquiryPost)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-lg border border-slate-700 hover:border-emerald-500 text-xs font-semibold text-emerald-300 whitespace-nowrap"
                    >
                      WhatsApp Direct
                    </a>
                    <button
                      type="submit"
                      className="flex-1 py-2 px-4 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold"
                    >
                      Send Inquiry
                    </button>
                  </div>
                </>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
