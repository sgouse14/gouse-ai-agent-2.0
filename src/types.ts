export type SpecialistType =
  | 'general'
  | 'design'
  | 'code'
  | 'documentation'
  | 'quantity'
  | 'sustainability'
  | 'structural'
  | 'interior';

export type ProfessionalType = 'architect' | 'builder' | 'material_supplier';

export type EnquiryStatus = 'open' | 'in_progress' | 'quoted' | 'accepted' | 'rejected' | 'completed';

export interface ProjectFile {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadDate: string;
  extractedText?: string;
}

export interface AnalysisReport {
  id: string;
  title: string;
  analysis: string;
  timestamp: string;
  focus: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'architect' | 'structural_engineer' | 'mep_engineer' | 'quantity_surveyor' | 'client';
}

export interface AuditEvent {
  id: string;
  projectId: string;
  actor: string;
  action: string;
  details: string;
  timestamp: string;
}

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED';

export interface Project {
  id: string;
  name: string;
  projectType: string;
  location: string;
  description: string;
  status: 'planning' | 'design_development' | 'documentation' | 'tender' | 'construction' | 'completed';
  builtUpAreaSqFt?: number;
  contingencyPercent?: number;
  floors?: BuildingFloor[];
  currency?: CurrencyCode;
  pgPropertyDetails?: PgPropertyDetails;
  files: ProjectFile[];
  analyses: AnalysisReport[];
  members: TeamMember[];
  auditLogs: AuditEvent[];
  createdAt: string;
  updatedAt?: string;
}

export interface BuildingFloor {
  id: string;
  name: string;
  shortCode: string;
  levelIndex: number;
  elevation: string;
  areaSqFt: number;
  heightMeters?: number;
  description?: string;
}

export interface FloorWiseTotal {
  floorId: string;
  floorName: string;
  shortCode: string;
  levelIndex: number;
  elevation: string;
  areaSqFt: number;
  itemCount: number;
  subtotal: number;
  ratePerSqFt: number;
  percentageOfBuilding: number;
}

export interface BOQItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
  notes: string;
  materialComponent?: number;
  laborComponent?: number;
  equipmentComponent?: number;
  overheadComponent?: number;
  stage?: 'Substructure' | 'Superstructure' | 'Finishes' | 'Services' | 'Handover';
  status?: 'estimated' | 'tendered' | 'approved' | 'in-progress';
  floorBreakdown?: Record<string, number>;
}

export interface BOQSummary {
  lineItemsCount: number;
  subtotal: number;
  contingencyPercent: number;
  contingencyAmount: number;
  estimatedTotal: number;
  categoryTotals: Record<string, number>;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ProfessionalProfile {
  id: string;
  professionalType: ProfessionalType;
  name: string;
  company: string;
  bio: string;
  services: string;
  location: string;
  address?: string;
  landmark?: string;
  googleMapsUrl?: string;
  mapEmbedUrl?: string;
  verified: boolean;
  rating: number;
  completedProjects: number;
  experienceYears: number;
  email: string;
  phone: string;
  whatsapp?: string;
  website?: string;
  sourceUrl?: string;
  sourceTitle?: string;
  isLiveSearch?: boolean;
  isMyPractice?: boolean;
  liveStatus?: 'online' | 'available' | 'in_consultation';
  leadTimeDays?: number;
  deliveryCoverage?: string;
}

export interface LiveMaterialPrice {
  id: string;
  name: string;
  category: string;
  brands: string[];
  unit: string;
  currentPrice: number;
  minPrice: number;
  maxPrice: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  trendReason: string;
  location: string;
  updatedAt: string;
  marketNotes?: string;
  sources?: GroundingSource[];
}

export type AlertFrequency = 'daily' | 'weekly' | 'volatility';

export interface MaterialPriceAlertSubscription {
  enabled: boolean;
  frequency: AlertFrequency;
  channelEmail: boolean;
  channelInApp: boolean;
  recipientEmail: string;
  volatilityThresholdPercent: number;
  subscribedMaterialIds: string[];
  lastNotificationSentAt?: string;
}

export interface MaterialPriceAlertItem {
  id: string;
  materialId: string;
  materialName: string;
  category: string;
  oldPrice: number;
  newPrice: number;
  unit: string;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  trendReason: string;
  timestamp: string;
  read: boolean;
}

export interface MarketplaceEnquiry {
  id: string;
  professionalId: string;
  professionalName?: string;
  professionalType?: ProfessionalType;
  company?: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  projectTitle: string;
  message: string;
  budget?: string;
  status: EnquiryStatus;
  createdAt: string;
  responseMessage?: string;
  quotedAmount?: string;
  estimatedDelivery?: string;
  respondedAt?: string;
  isLiveQuote?: boolean;
}

export interface MaterialComparisonItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  estimatedRate: number;
  durabilityYears: number;
  embodiedCarbonKg: number;
  uValue: number;
  fireRating: string;
  pros: string[];
  cons: string[];
  bestUse: string;
  applicableFloors?: string[];
  floorNotes?: string;
}

export interface AgentAction {
  id: string;
  type: 'add_boq_item' | 'update_contingency' | 'update_area' | 'run_audit' | 'inspect_pricing';
  title: string;
  description: string;
  payload?: any;
  executed?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  specialist?: SpecialistType;
  language?: string;
  audioBase64?: string;
  agentThought?: string;
  agentToolsUsed?: string[];
  agentActions?: AgentAction[];
}

export type PgRoomType =
  | 'Single Private Room'
  | 'Double Sharing'
  | 'Triple Sharing'
  | 'Four Sharing'
  | '1BHK Suite / Floor'
  | '2BHK Family Flat'
  | 'Studio Apartment';

export type PgOccupancyStatus = 'Available' | 'Occupied' | 'Under Maintenance';

export interface PgHouseRoomUnit {
  id: string;
  roomNumber: string;
  floorName: string;
  roomType: PgRoomType;
  totalBeds: number;
  occupiedBeds: number;
  rentPerBedMonthly: number;
  securityDeposit: number;
  furnishing: 'Fully Furnished' | 'Semi Furnished' | 'Semi-Furnished' | 'Unfurnished';
  hasAttachedBath: boolean;
  hasBalcony: boolean;
  hasAirConditioning: boolean;
  notes?: string;
  imageUrl?: string;
}

export interface PgGalleryImage {
  id: string;
  title: string;
  category: 'Exterior' | 'Bedroom' | 'Dining & Lounge' | 'Washroom' | 'Terrace';
  imageUrl: string;
  caption: string;
}

export interface PgHouseAmenities {
  wifi: boolean;
  cctv: boolean;
  powerBackup: boolean;
  washingMachine: boolean;
  roWater: boolean;
  housekeeping: boolean;
  parking: boolean;
  solarWater: boolean;
  refrigerator: boolean;
  fingerprintAccess: boolean;
  messMeals: boolean;
  gymOrFitness: boolean;
}

export interface BangaloreLocalDetails {
  locality: string;
  zone: 'South Bangalore' | 'East Bangalore' | 'Central Bangalore' | 'Electronic City Hub' | 'North Bangalore';
  nammaMetroStation?: string;
  waterSupply: string;
  bescomPower: string;
  foodMenuNotes?: string;
  bbmpApprovalKhata?: string;
  nearbyTechParks?: string[];
}

export interface PgPropertyDetails {
  propertyName: string;
  propertyType: 'PG / Co-Living Facility' | 'Independent House / Rental Floors' | 'Hybrid PG & House' | 'Luxury Villa & Apartments';
  genderCategory: 'Coliving (Unisex)' | 'Gents PG' | 'Ladies PG' | 'Family & Working Professionals';
  targetAudience: string;
  foodIncluded: boolean;
  foodType: string;
  noticePeriodDays: number;
  gateClosingTime: string;
  contactPerson: string;
  contactPhone: string;
  depositMonths: number;
  amenities: PgHouseAmenities;
  images?: PgGalleryImage[];
  rooms: PgHouseRoomUnit[];
  bangaloreDetails?: BangaloreLocalDetails;
}

