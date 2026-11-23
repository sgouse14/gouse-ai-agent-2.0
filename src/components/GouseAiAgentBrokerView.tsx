import React, { useState, useMemo } from 'react';
import {
  Building,
  Home,
  Sparkles,
  Key,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Phone,
  MessageSquare,
  Calculator,
  FileText,
  Users,
  Search,
  Filter,
  ArrowRight,
  DollarSign,
  Award,
  Calendar,
  Layers,
  Check,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Percent,
  LogIn,
  LogOut,
  Lock,
  PlusCircle,
  Copy,
  Printer,
  Download,
  RotateCcw,
  Clock,
  Bell,
} from 'lucide-react';
import { Project } from '../types';
import { CurrencyCode, formatCurrency } from '../utils/formatters';
import { PgHousePropertyListingSection } from './PgHousePropertyListingSection';
import { useAuth } from '../context/AuthContext';
import { BrokerAuthModal } from './BrokerAuthModal';
import { BuyHouseLandSection } from './BuyHouseLandSection';

interface GouseAiAgentBrokerViewProps {
  project?: Project;
  onUpdateProject?: (updated: Project) => void;
  currency?: CurrencyCode;
  initialSubTab?: 'all' | 'pg' | 'rent_house' | 'buy_house' | 'land_plot' | 'sell_property' | 'matchmaker' | 'agreement' | 'analytics';
  isOutsidePlatform?: boolean;
  onOpenPlatformDemo?: () => void;
}

export const GouseAiAgentBrokerView: React.FC<GouseAiAgentBrokerViewProps> = ({
  project,
  onUpdateProject,
  currency = 'INR',
  initialSubTab = 'all',
  isOutsidePlatform = false,
  onOpenPlatformDemo,
}) => {
  const { user, logout } = useAuth();
  // Separate Gouse AI Agent Broker Login Modal State
  const [isBrokerAuthModalOpen, setIsBrokerAuthModalOpen] = useState(false);
  const [brokerAuthDefaultRole, setBrokerAuthDefaultRole] = useState<'tenant' | 'property_owner' | 'broker_agent'>('tenant');

  // Main Navigation within Gouse AI Agent Broker
  const [activeBrokerTab, setActiveBrokerTab] = useState<
    'all' | 'pg' | 'rent_house' | 'buy_house' | 'land_plot' | 'sell_property' | 'matchmaker' | 'agreement' | 'analytics'
  >(initialSubTab);

  const [waitlistCount] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    try {
      const saved = window.localStorage.getItem('gouse_broker_waitlist_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.length;
      }
    } catch {}
    return 0;
  });

  // AI Broker Matchmaker Form State
  const [matchTenantType, setMatchTenantType] = useState<'individual' | 'couple' | 'family' | 'students'>('individual');
  const [matchPropertyCategory, setMatchPropertyCategory] = useState<'any' | 'pg' | 'house'>('any');
  const [matchBudget, setMatchBudget] = useState<number>(15000);
  const [matchZone, setMatchZone] = useState<string>('hsr');
  const [matchFoodRequired, setMatchFoodRequired] = useState<boolean>(true);
  const [matchFurnishing, setMatchFurnishing] = useState<'any' | 'fully' | 'semi'>('fully');
  const [isAiMatching, setIsAiMatching] = useState<boolean>(false);
  const [aiMatchResults, setAiMatchResults] = useState<Array<{
    id: string;
    name: string;
    category: 'pg' | 'house';
    type: string;
    location: string;
    zone: string;
    price: number;
    foodIncluded: boolean;
    furnishing: 'fully' | 'semi';
    suitableFor: Array<'individual' | 'couple' | 'family' | 'students'>;
    matchScore: number;
    matchReasons: string[];
    highlights: string[];
    contactPhone: string;
  }> | null>(null);

  // Rental Agreement Form State
  const [agOwnerName, setAgOwnerName] = useState('Ar. S. Gouse');
  const [agTenantName, setAgTenantName] = useState('Rahul Verma');
  const [agPropertyAddress, setAgPropertyAddress] = useState('Sector 2, 27th Main Rd, HSR Layout, Bangalore 560102');
  const [agMonthlyRent, setAgMonthlyRent] = useState(18500);
  const [agDeposit, setAgDeposit] = useState(37000);
  const [agTenureMonths, setAgTenureMonths] = useState(11);
  const [agNoticeDays, setAgNoticeDays] = useState(30);
  const [agStartDate, setAgStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [agEscalationPercent, setAgEscalationPercent] = useState(5);
  const [agAgreementGenerated, setAgAgreementGenerated] = useState(false);
  const [agCopied, setAgCopied] = useState(false);

  // Yield & ROI Simulator State
  const [simPlotAreaSqFt, setSimPlotAreaSqFt] = useState(3000);
  const [simTotalCapex, setSimTotalCapex] = useState(21500000);
  const [simPgBeds, setSimPgBeds] = useState(24);
  const [simPgRentPerBed, setSimPgRentPerBed] = useState(11500);
  const [simFlatMonthlyRent, setSimFlatMonthlyRent] = useState(75000);
  const [simOccupancyPct, setSimOccupancyPct] = useState(90);

  const deterministicAgreementId = useMemo(() => {
    const seed = `${agOwnerName}-${agTenantName}-${agMonthlyRent}-${agTenureMonths}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) % 900000;
    }
    return `GOUSE-AGR-${String(100000 + Math.abs(hash))}`;
  }, [agOwnerName, agTenantName, agMonthlyRent, agTenureMonths]);

  const karnatakaStampDutyEstimate = useMemo(() => {
    const avgAnnualRent = agMonthlyRent * 12;
    const baseDuty = Math.max(500, Math.round(avgAnnualRent * 0.005));
    return agTenureMonths <= 11 ? 500 : baseDuty;
  }, [agMonthlyRent, agTenureMonths]);

  const simMetrics = useMemo(() => {
    const pgGrossMonthly = Math.round(simPgBeds * simPgRentPerBed * (simOccupancyPct / 100));
    const pgNetAnnual = Math.round(pgGrossMonthly * 12 * 0.86);
    const pgYieldPct = simTotalCapex > 0 ? (pgNetAnnual / simTotalCapex) * 100 : 0;

    const flatAnnual = Math.round(simFlatMonthlyRent * 12 * 0.92);
    const flatYieldPct = simTotalCapex > 0 ? (flatAnnual / simTotalCapex) * 100 : 0;

    const monthlyUplift = pgGrossMonthly - simFlatMonthlyRent;
    const yieldDelta = pgYieldPct - flatYieldPct;
    const paybackYears = pgNetAnnual > 0 ? simTotalCapex / pgNetAnnual : 0;

    return {
      pgGrossMonthly,
      pgNetAnnual,
      pgYieldPct,
      flatAnnual,
      flatYieldPct,
      monthlyUplift,
      yieldDelta,
      paybackYears,
    };
  }, [simTotalCapex, simPgBeds, simPgRentPerBed, simFlatMonthlyRent, simOccupancyPct]);

  // Verified Inventory Catalog for Real Multi-Criteria AI Matchmaker
  const BROKER_INVENTORY = useMemo(
    () => [
      {
        id: 'match-hsr-pg-1',
        name: 'UrbanNest Executive PG & Co-Living House',
        category: 'pg' as const,
        type: 'Single Private Executive Suite (Attached Bath + Balcony)',
        location: 'Sector 2, 27th Main Rd, HSR Layout, Bangalore',
        zone: 'hsr',
        price: 18500,
        foodIncluded: true,
        furnishing: 'fully' as const,
        suitableFor: ['individual' as const, 'students' as const],
        highlights: [
          '3 Times Hygienic Meals Included + Sunday Special',
          '300 Mbps Fiber WiFi & 24/7 Power Backup',
          'Biometric Access Control & Daily Housekeeping',
          'Zero Brokerage Direct Owner Booking',
        ],
        contactPhone: '+91 8073947241',
      },
      {
        id: 'match-hsr-pg-2',
        name: 'UrbanNest Double Sharing Executive Room',
        category: 'pg' as const,
        type: 'Double Sharing AC Co-Living Suite',
        location: 'Sector 2, HSR Layout, Bangalore',
        zone: 'hsr',
        price: 12500,
        foodIncluded: true,
        furnishing: 'fully' as const,
        suitableFor: ['individual' as const, 'students' as const],
        highlights: [
          'East-facing balcony with ergonomic study desks',
          'Breakfast, lunch & dinner included in rent',
          'Solar hot water + RO drinking water plant',
          'Direct owner onboarding with 0% brokerage',
        ],
        contactPhone: '+91 8073947241',
      },
      {
        id: 'match-bellandur-pg-1',
        name: 'TechHub Executive Gents PG & Co-Living',
        category: 'pg' as const,
        type: 'Double Sharing Studio Suite with AC',
        location: 'Outer Ring Road, Near RMZ Ecospace, Bellandur',
        zone: 'bellandur',
        price: 11500,
        foodIncluded: true,
        furnishing: 'fully' as const,
        suitableFor: ['individual' as const, 'students' as const],
        highlights: [
          '5-minute walk to RMZ Ecospace & EcoWorld',
          'Unlimited 3-times buffet meals + tiffin option',
          'Rooftop fitness zone & table tennis lounge',
          '1-month low security deposit policy',
        ],
        contactPhone: '+91 8073947241',
      },
      {
        id: 'match-indiranagar-pg-1',
        name: 'PalmGrove Luxury Ladies PG & Suites',
        category: 'pg' as const,
        type: 'Single Deluxe Suite (Indiranagar Metro Walk)',
        location: '100ft Road, Near 12th Main, Indiranagar, Bangalore',
        zone: 'indiranagar',
        price: 19000,
        foodIncluded: true,
        furnishing: 'fully' as const,
        suitableFor: ['individual' as const, 'students' as const],
        highlights: [
          '400m from Indiranagar Metro Station',
          '24/7 Female Guard, CCTV & Biometric Entry',
          'Pure Veg & Non-Veg 3-times dining mess',
          'Lift access + corner balcony ventilation',
        ],
        contactPhone: '+91 8073947241',
      },
      {
        id: 'match-bellandur-house-1',
        name: 'GreenGlen 3BHK Independent Rental Floor',
        category: 'house' as const,
        type: '3BHK Luxury Builder Floor (1,550 sq.ft)',
        location: 'Green Glen Layout, Bellandur, Bangalore',
        zone: 'bellandur',
        price: 36000,
        foodIncluded: false,
        furnishing: 'semi' as const,
        suitableFor: ['family' as const, 'couple' as const, 'individual' as const],
        highlights: [
          '100% Vastu Compliant East Facing Entrance',
          'Covered Car Parking + 2 Bike Bays (EV Ready)',
          '24/7 Borewell & Cauvery Water Supply',
          'A-Khata BBMP Approved Independent Structure',
        ],
        contactPhone: '+91 8073947241',
      },
      {
        id: 'match-whitefield-house-1',
        name: 'Shantiniketan Courtyard 2BHK Independent Floor',
        category: 'house' as const,
        type: '2BHK Modern Builder Floor (1,240 sq.ft)',
        location: 'Whitefield Main Rd, Near ITPL Metro, Bangalore',
        zone: 'whitefield',
        price: 28000,
        foodIncluded: false,
        furnishing: 'fully' as const,
        suitableFor: ['couple' as const, 'family' as const, 'individual' as const],
        highlights: [
          'Modular kitchen with Faber chimney & wardrobes',
          'Walkable to Whitefield ITPL & Purple Line Metro',
          'Separate BESCOM tariff meter + DG backup',
          'Zero brokerage direct landlord agreement',
        ],
        contactPhone: '+91 8073947241',
      },
      {
        id: 'match-koramangala-house-1',
        name: 'Koramangala 4th Block 3BHK Villa Residence',
        category: 'house' as const,
        type: '3BHK Independent Corner House (2,100 sq.ft)',
        location: '4th Block, Near Sony World, Koramangala, Bangalore',
        zone: 'koramangala',
        price: 48000,
        foodIncluded: false,
        furnishing: 'semi' as const,
        suitableFor: ['family' as const, 'couple' as const],
        highlights: [
          'Private landscaped courtyard & car porch',
          'Zero curfew independent gated access',
          'Pet friendly residential avenue',
          '11-month Karnataka registered lease included',
        ],
        contactPhone: '+91 8073947241',
      },
      {
        id: 'match-ecity-pg-1',
        name: 'Electronic City Tech Courtyard Co-Living',
        category: 'pg' as const,
        type: 'Triple & Double Sharing Smart Suite',
        location: 'Neeladri Nagar, Electronic City Phase 1, Bangalore',
        zone: 'electronic_city',
        price: 9500,
        foodIncluded: true,
        furnishing: 'fully' as const,
        suitableFor: ['students' as const, 'individual' as const],
        highlights: [
          'Shuttle proximity to Infosys & Wipro campuses',
          'High-speed fiber WiFi + study desks',
          'Hygienic 3-times meals & laundry included',
          'Zero brokerage onboarding',
        ],
        contactPhone: '+91 8073947241',
      },
    ],
    []
  );

  // AI Broker Matchmaker real filtering & ranking handler
  const handleRunAiMatchmaker = (e: React.FormEvent, overrideBudget?: number) => {
    e.preventDefault();
    const activeBudget = overrideBudget ?? matchBudget;
    setIsAiMatching(true);

    setTimeout(() => {
      setIsAiMatching(false);

      const scored = BROKER_INVENTORY.filter((item) => {
        if (matchPropertyCategory !== 'any' && item.category !== matchPropertyCategory) {
          return false;
        }
        return item.price <= activeBudget + 3000;
      })
        .map((item) => {
          let score = 60;
          const matchReasons: string[] = [];

          if (item.price <= activeBudget) {
            score += 15;
            matchReasons.push(`Within ${formatCurrency(activeBudget, currency)} budget`);
          } else {
            score += 5;
            matchReasons.push(`Near budget (+${formatCurrency(item.price - activeBudget, currency)})`);
          }

          if (item.zone === matchZone) {
            score += 14;
            matchReasons.push('Exact corridor match');
          }

          if ((item.suitableFor as readonly ('individual' | 'couple' | 'family' | 'students')[]).includes(matchTenantType)) {
            score += 6;
            matchReasons.push('Suited for tenant profile');
          }

          if (matchFurnishing === 'any' || item.furnishing === matchFurnishing) {
            score += 3;
          }

          if (!matchFoodRequired || item.foodIncluded) {
            score += 2;
            if (matchFoodRequired && item.foodIncluded) {
              matchReasons.push('3-time meals included');
            }
          }

          return {
            ...item,
            matchScore: Math.min(99, score),
            matchReasons: matchReasons.length > 0 ? matchReasons : ['Verified zero-brokerage inventory'],
          };
        })
        .sort((a, b) => b.matchScore - a.matchScore);

      setAiMatchResults(scored);
    }, 350);
  };

  const handleCopyAgreement = () => {
    const agreementText = `MEMORANDUM OF RESIDENTIAL RENTAL AGREEMENT
Reference: ${deterministicAgreementId}
Executed Date: ${agStartDate} | Place: Bengaluru, Karnataka

LESSOR / OWNER: ${agOwnerName} (via Gouse AI Architecture & Real Estate Studio)
LESSEE / TENANT: ${agTenantName}
SCHEDULE PROPERTY: ${agPropertyAddress}

1. MONTHLY RENT: INR ${agMonthlyRent.toLocaleString('en-IN')} payable on or before the 5th of each month.
2. SECURITY DEPOSIT: INR ${agDeposit.toLocaleString('en-IN')} interest-free refundable deposit.
3. TENURE: ${agTenureMonths} months commencing ${agStartDate} (${agEscalationPercent}% annual renewal escalation).
4. NOTICE PERIOD: ${agNoticeDays} days written notice by either party.
5. BROKERAGE WAIVER: 0% Direct Owner Tenancy Agreement. Estimated Karnataka e-Stamp Duty: INR ${karnatakaStampDutyEstimate.toLocaleString('en-IN')}.`;

    navigator.clipboard?.writeText(agreementText);
    setAgCopied(true);
    setTimeout(() => setAgCopied(false), 2500);
  };

  const handleDownloadAgreement = () => {
    const agreementText = `MEMORANDUM OF RESIDENTIAL RENTAL AGREEMENT
Document Reference: ${deterministicAgreementId}
Start Date: ${agStartDate}
Jurisdiction: Bengaluru, Karnataka

LESSOR / OWNER: ${agOwnerName}
LESSEE / TENANT: ${agTenantName}
PROPERTY SCHEDULE: ${agPropertyAddress}

TERMS & CONDITIONS:
1. Monthly Rent: INR ${agMonthlyRent.toLocaleString('en-IN')} payable on or before the 5th of each month.
2. Security Deposit: INR ${agDeposit.toLocaleString('en-IN')} refundable upon handover.
3. Tenure: ${agTenureMonths} Months (Annual Escalation: ${agEscalationPercent}%).
4. Notice Period: ${agNoticeDays} Days.
5. Brokerage Fee: INR 0 (Zero-Brokerage Direct Owner Guarantee).
6. Estimated e-Stamp Duty: INR ${karnatakaStampDutyEstimate.toLocaleString('en-IN')}.
`;
    const blob = new Blob([agreementText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deterministicAgreementId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={isOutsidePlatform ? 'min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 pb-16' : ''}>
      {/* 0. OUTSIDE PLATFORM TOP ACCESS & NAVIGATION BAR */}
      {isOutsidePlatform && (
        <div
          id="banner-agent-broker-governance"
          className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 text-xs text-slate-300 sticky top-0 z-50"
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 text-left">
              <span className="p-1 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Key className="w-3.5 h-3.5" />
              </span>
              <span>
                <strong className="text-white">Gouse AI Brokerage Portal</strong> · Verified PGs, Co-Living &amp; House Rentals · Direct Owner Listings (0% Brokerage)
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {onOpenPlatformDemo && (
                <button
                  type="button"
                  id="btn-broker-open-demo"
                  onClick={onOpenPlatformDemo}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Platform Demo</span>
                </button>
              )}

              {user ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950 border border-slate-700 text-xs font-mono font-semibold text-amber-300">
                    <span>
                      {user.role === 'tenant' && 'Tenant: '}
                      {user.role === 'property_owner' && 'Landlord: '}
                      {user.role === 'broker_agent' && 'Broker: '}
                      {user.name}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsBrokerAuthModalOpen(true)}
                    className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
                    title="Switch broker persona or sign in as another user"
                  >
                    Switch
                  </button>

                  <button
                    type="button"
                    onClick={logout}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold transition"
                    title="Sign out of broker platform"
                  >
                    <LogOut className="w-3 h-3 text-rose-400" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="btn-broker-login"
                    onClick={() => {
                      setBrokerAuthDefaultRole('tenant');
                      setIsBrokerAuthModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm"
                    title="Sign in to Gouse AI Agent Broker as Tenant, Landlord, or Broker"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Broker Sign In</span>
                  </button>

                  <button
                    type="button"
                    id="btn-broker-list-prop"
                    onClick={() => {
                      setBrokerAuthDefaultRole('property_owner');
                      setIsBrokerAuthModalOpen(true);
                    }}
                    className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition"
                    title="List building or PG as Landlord"
                  >
                    <Building className="w-3.5 h-3.5 text-emerald-400" />
                    <span>List Property</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        {waitlistCount > 0 && (
          <div className="flex items-center justify-between gap-2 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
            <span>Direct Owner Brokerage Active · Priority inquiries tracked: {waitlistCount}</span>
          </div>
        )}
        {/* ========================================================================= */}
        {/* 1. GOUSE AI AGENT BROKER: MASTER BRANDING & HERO BANNER                    */}
        {/* ========================================================================= */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 md:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-slate-400">
              <span className="text-amber-400 font-semibold">Gouse AI Brokerage</span>
              <span>·</span>
              <span className="text-emerald-400">Zero Brokerage Direct</span>
              <span>·</span>
              <span>BBMP A-Khata &amp; IS 456 Verified</span>
              <span>·</span>
              <span>Bangalore Tech Corridor</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
              Property &amp; Brokerage Desk:{' '}
              <span className="text-amber-400">
                PG, Rental House, Buy &amp; Sell, Land &amp; Plots
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Autonomous real estate brokerage and inventory management platform. Buy luxury villas, lease executive PG rooms &amp; rental floors, acquire BDA/DTCP approved land parcels, or list your house/land with zero hidden markups, instant AI property valuations, and automated digital agreements.
            </p>

            {/* Key Value Points */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 tabular-nums">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-left">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wide">Listed Assets</div>
                <div className="text-base font-bold text-white mt-0.5">16+ Verified Assets</div>
                <div className="text-[10px] text-amber-400">Houses, PGs &amp; Land Parcels</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-left">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wide">Live Inventory</div>
                <div className="text-base font-bold text-emerald-400 mt-0.5">48 Beds &amp; Units</div>
                <div className="text-[10px] text-slate-400">82% Verified Occupancy</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-left">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wide">Tenant Fee</div>
                <div className="text-base font-bold text-amber-300 mt-0.5">₹0 Brokerage</div>
                <div className="text-[10px] text-emerald-400">Direct Owner Leasing</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-left">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wide">Turnkey Yield</div>
                <div className="text-base font-bold text-white mt-0.5">11.8% – 14.2%</div>
                <div className="text-[10px] text-slate-400">Annual Return p.a.</div>
              </div>
            </div>
          </div>

          {/* Right Broker Contact & Action Card */}
          <div className="lg:w-80 p-5 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-xl space-y-4 shrink-0 text-left">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-bold text-lg font-mono shadow-md">
                G
              </div>
              <div>
                <div className="font-bold text-white text-sm">Ar. S. Gouse</div>
                <div className="text-xs text-amber-400 font-mono">Principal Architect &amp; Estate Broker</div>
                <div className="text-[10px] text-slate-400">CoA CA/2012/55190</div>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300 font-mono border-t border-slate-800 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Phone Hotline:</span>
                <a href="tel:+918073947241" className="text-white hover:text-amber-400 font-bold">
                  +91 80739 47241
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Broker Office:</span>
                <span className="text-slate-200">Bangalore (HSR/ORR)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Inspection:</span>
                <span className="text-emerald-400 font-bold">Daily 9 AM - 8 PM</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <a
                href="https://wa.me/918073947241?text=Hello%20Ar.%20Gouse,%20I%20am%20inquiring%20about%20PG%20and%20Rental%20House%20listings%20via%20Gouse%20AI%20Agent%20Broker."
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp Broker Lead</span>
              </a>

              <a
                href="tel:+918073947241"
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition"
              >
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>Call +91 80739 47241</span>
              </a>

              {!user && (
                <button
                  type="button"
                  id="btn-card-broker-login"
                  onClick={() => {
                    setBrokerAuthDefaultRole('tenant');
                    setIsBrokerAuthModalOpen(true);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Broker Sign In (Tenant / Landlord)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BROKER SUB-NAV SWITCHER                                                */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 p-1.5 rounded-xl flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveBrokerTab('all')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
            activeBrokerTab === 'all'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All Properties Hub</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveBrokerTab('pg')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
            activeBrokerTab === 'pg'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>PG &amp; Co-Living</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveBrokerTab('rent_house')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
            activeBrokerTab === 'rent_house'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>Rent House</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveBrokerTab('buy_house')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
            activeBrokerTab === 'buy_house'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Buy House &amp; Villas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveBrokerTab('land_plot')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
            activeBrokerTab === 'land_plot'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Land &amp; Plots</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveBrokerTab('sell_property')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
            activeBrokerTab === 'sell_property'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Sell House / Land (0% Fee)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveBrokerTab('matchmaker')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
            activeBrokerTab === 'matchmaker'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Matchmaker</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveBrokerTab('agreement')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
            activeBrokerTab === 'agreement'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Agreement Desk</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveBrokerTab('analytics')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
            activeBrokerTab === 'analytics'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Yield Analytics</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2.5 ALL PROPERTIES PORTFOLIO HUB QUICK LAUNCHER                           */}
      {/* ========================================================================= */}
      {activeBrokerTab === 'all' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-left">
          <button
            type="button"
            onClick={() => setActiveBrokerTab('pg')}
            className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition text-left space-y-1.5 group"
          >
            <div className="flex items-center justify-between text-xs font-mono text-amber-400">
              <span>PG &amp; Co-Living</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="text-base font-bold text-white tabular-nums">₹8,500 – ₹19,500/mo</div>
            <div className="text-[11px] text-slate-400">HSR, Indiranagar &amp; Bellandur · Meals &amp; WiFi</div>
          </button>

          <button
            type="button"
            onClick={() => setActiveBrokerTab('rent_house')}
            className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition text-left space-y-1.5 group"
          >
            <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
              <span>Rental Houses &amp; Floors</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="text-base font-bold text-white tabular-nums">₹24,000 – ₹48,000/mo</div>
            <div className="text-[11px] text-slate-400">2BHK &amp; 3BHK Independent Floors · A-Khata</div>
          </button>

          <button
            type="button"
            onClick={() => setActiveBrokerTab('buy_house')}
            className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition text-left space-y-1.5 group"
          >
            <div className="flex items-center justify-between text-xs font-mono text-amber-400">
              <span>Villas &amp; Houses For Sale</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="text-base font-bold text-white tabular-nums">₹1.85 Cr – ₹4.20 Cr</div>
            <div className="text-[11px] text-slate-400">RERA Audited · Turnkey &amp; Ready to Move</div>
          </button>

          <button
            type="button"
            onClick={() => setActiveBrokerTab('land_plot')}
            className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition text-left space-y-1.5 group"
          >
            <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
              <span>BDA &amp; DTCP Land Plots</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="text-base font-bold text-white tabular-nums">₹4,200 – ₹18,500/sq.ft</div>
            <div className="text-[11px] text-slate-400">30+ Yr Clear EC · Immediate Sanction Ready</div>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SUB-VIEW: PROPERTY LISTINGS (ALL / PG / RENT HOUSE)                    */}
      {/* ========================================================================= */}
      {(activeBrokerTab === 'all' || activeBrokerTab === 'pg' || activeBrokerTab === 'rent_house') && (
        <PgHousePropertyListingSection
          project={project}
          onUpdateProject={onUpdateProject}
          currency={currency}
          mode={activeBrokerTab === 'all' ? 'all' : activeBrokerTab}
        />
      )}

      {/* ========================================================================= */}
      {/* 3.1. SUB-VIEW: BUY HOUSE & LUXURY VILLAS                                  */}
      {/* ========================================================================= */}
      {activeBrokerTab === 'buy_house' && (
        <BuyHouseLandSection mode="buy_house" currency={currency} />
      )}

      {/* ========================================================================= */}
      {/* 3.2. SUB-VIEW: LAND & PLOTS                                               */}
      {/* ========================================================================= */}
      {activeBrokerTab === 'land_plot' && (
        <BuyHouseLandSection mode="land_plot" currency={currency} />
      )}

      {/* ========================================================================= */}
      {/* 3.3. SUB-VIEW: SELL HOUSE / LAND / RENT OUT SELF-LISTING DESK              */}
      {/* ========================================================================= */}
      {activeBrokerTab === 'sell_property' && (
        <BuyHouseLandSection mode="sell_property" currency={currency} />
      )}

      {/* ========================================================================= */}
      {/* 4. SUB-VIEW: AI BROKER MATCHMAKER                                         */}
      {/* ========================================================================= */}
      {activeBrokerTab === 'matchmaker' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Matchmaker Input Form */}
          <div className="lg:col-span-1 p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4 text-left">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>AI Tenant &amp; Property Matchmaker</span>
            </div>
            <p className="text-xs text-slate-400">
              Set tenant profile, monthly budget bracket, and corridor. Matches verified inventory with real compatibility scoring.
            </p>

            <form onSubmit={(e) => handleRunAiMatchmaker(e)} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tenant Profile</label>
                <select
                  value={matchTenantType}
                  onChange={(e) => setMatchTenantType(e.target.value as any)}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-amber-400"
                >
                  <option value="individual">Single Working Professional (IT / Fintech / Medical)</option>
                  <option value="couple">Working Couple (Independent Floor / Studio)</option>
                  <option value="family">Family (2BHK / 3BHK Independent House)</option>
                  <option value="students">College / Interns (Budget Sharing PG)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Property Type Preference</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMatchPropertyCategory('any')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition ${
                      matchPropertyCategory === 'any'
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Any
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatchPropertyCategory('pg')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition ${
                      matchPropertyCategory === 'pg'
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    PG &amp; Co-Living
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatchPropertyCategory('house')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition ${
                      matchPropertyCategory === 'house'
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Rent House
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1 tabular-nums">
                  <span>Monthly Budget Cap</span>
                  <span className="text-amber-400 font-mono">
                    {formatCurrency(matchBudget, currency)} / mo
                  </span>
                </div>
                <input
                  type="range"
                  min={8000}
                  max={60000}
                  step={1000}
                  value={matchBudget}
                  onChange={(e) => setMatchBudget(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5 tabular-nums">
                  <span>₹8k PG</span>
                  <span>₹25k Suite/2BHK</span>
                  <span>₹60k 3BHK Villa</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Bangalore Corridor</label>
                <select
                  value={matchZone}
                  onChange={(e) => setMatchZone(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-amber-400"
                >
                  <option value="hsr">HSR Layout (Sectors 1 to 7)</option>
                  <option value="bellandur">Bellandur &amp; Outer Ring Road (RMZ Ecospace)</option>
                  <option value="whitefield">Whitefield (ITPB, Metro Corridor)</option>
                  <option value="koramangala">Koramangala (4th &amp; 5th Blocks)</option>
                  <option value="indiranagar">Indiranagar (100 Feet Rd &amp; Metro)</option>
                  <option value="electronic_city">Electronic City Phase 1 &amp; 2</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Furnishing</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMatchFurnishing('fully')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition ${
                      matchFurnishing === 'fully'
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Fully
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatchFurnishing('semi')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition ${
                      matchFurnishing === 'semi'
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Semi
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatchFurnishing('any')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition ${
                      matchFurnishing === 'any'
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Any
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                <div>
                  <div className="font-semibold text-white">Daily Meals Included?</div>
                  <div className="text-[10px] text-slate-400">Breakfast, lunch and dinner mess</div>
                </div>
                <input
                  type="checkbox"
                  checked={matchFoodRequired}
                  onChange={(e) => setMatchFoodRequired(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 cursor-pointer rounded"
                />
              </div>

              <button
                type="submit"
                disabled={isAiMatching}
                className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isAiMatching ? 'Scoring Inventory...' : 'Find Matched Properties'}</span>
              </button>
            </form>
          </div>

          {/* Results Display */}
          <div className="lg:col-span-2 space-y-4 text-left">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-white text-sm">
                  Matched Properties &amp; Units
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Zero Brokerage Verified · Ranked by budget fit, zone proximity &amp; tenant profile
                </p>
              </div>

              <div className="text-xs font-mono text-slate-400 tabular-nums">
                Corridor: <span className="text-amber-400 font-semibold uppercase">{matchZone.replace('_', ' ')}</span>
                {aiMatchResults !== null && <span className="ml-2 text-slate-300">· {aiMatchResults.length} Matches</span>}
              </div>
            </div>

            {aiMatchResults && aiMatchResults.length === 0 ? (
              <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-3">
                <div className="text-sm font-semibold text-white">
                  No direct matches under {formatCurrency(matchBudget, currency)}/mo for {matchPropertyCategory === 'house' ? 'Rent Houses' : 'your filter'}.
                </div>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Independent houses start around ₹28,000/mo while private PG rooms start at ₹9,500/mo. Adjust your budget or switch to Any property type.
                </p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      const nextBudget = Math.min(60000, matchBudget + 15000);
                      setMatchBudget(nextBudget);
                      setMatchPropertyCategory('any');
                      handleRunAiMatchmaker(e, nextBudget);
                    }}
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition"
                  >
                    Expand Budget +₹15,000 &amp; Show All Types
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {(aiMatchResults || BROKER_INVENTORY.slice(0, 3).map((item, idx) => ({
                  ...item,
                  matchScore: 98 - idx * 4,
                  matchReasons: ['Featured HSR / Bellandur Inventory', 'Zero Brokerage Verified'],
                }))).map((match) => (
                  <div
                    key={match.id}
                    className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h4 className="font-bold text-white text-base">{match.name}</h4>
                          <span className="text-[11px] font-mono font-semibold text-emerald-400 tabular-nums">
                            {match.matchScore}% Fit
                          </span>
                        </div>
                        <div className="text-xs text-amber-400 font-medium mt-0.5">{match.type}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{match.location}</span>
                        </div>
                        {match.matchReasons && (
                          <div className="text-[11px] font-mono text-slate-400 mt-1.5">
                            {match.matchReasons.join(' · ')}
                          </div>
                        )}
                      </div>

                      <div className="sm:text-right tabular-nums shrink-0">
                        <div className="text-lg font-bold font-mono text-white">
                          {formatCurrency(match.price, currency)}
                          <span className="text-xs text-slate-400 font-normal"> / mo</span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400">Direct Brokerage: ₹0</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2 border-t border-slate-800">
                      {match.highlights.map((h, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <a
                        href={`https://wa.me/918073947241?text=Hello%20Ar.%20Gouse,%20I%20matched%20with%20${encodeURIComponent(match.name)}%20via%20Gouse%20AI%20Agent%20Broker%20and%20want%20to%20schedule%20a%20site%20visit.`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Book Site Visit on WhatsApp</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveBrokerTab(match.category === 'pg' ? 'pg' : 'rent_house');
                        }}
                        className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition"
                      >
                        <span>View Full Property Listing</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SUB-VIEW: DIGITAL RENTAL AGREEMENT & BROKERAGE DESK                     */}
      {/* ========================================================================= */}
      {activeBrokerTab === 'agreement' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4 text-left">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
              <FileText className="w-4 h-4" />
              <span>Rental Agreement Generator</span>
            </div>
            <p className="text-xs text-slate-400">
              Generates Karnataka tenancy contract terms, e-stamp duty guidance, and zero-brokerage waiver clauses.
            </p>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Landlord / Owner Name</label>
                <input
                  type="text"
                  value={agOwnerName}
                  onChange={(e) => setAgOwnerName(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tenant Name</label>
                <input
                  type="text"
                  value={agTenantName}
                  onChange={(e) => setAgTenantName(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Property Address</label>
                <textarea
                  rows={2}
                  value={agPropertyAddress}
                  onChange={(e) => setAgPropertyAddress(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Monthly Rent (₹)</label>
                  <input
                    type="number"
                    value={agMonthlyRent}
                    onChange={(e) => setAgMonthlyRent(Number(e.target.value))}
                    className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-lg border border-slate-700 font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Security Deposit (₹)</label>
                  <input
                    type="number"
                    value={agDeposit}
                    onChange={(e) => setAgDeposit(Number(e.target.value))}
                    className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-lg border border-slate-700 font-mono tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Lease Start Date</label>
                  <input
                    type="date"
                    value={agStartDate}
                    onChange={(e) => setAgStartDate(e.target.value)}
                    className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-lg border border-slate-700 font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Annual Escalation (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={15}
                    value={agEscalationPercent}
                    onChange={(e) => setAgEscalationPercent(Number(e.target.value))}
                    className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-lg border border-slate-700 font-mono tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tenure</label>
                  <select
                    value={agTenureMonths}
                    onChange={(e) => setAgTenureMonths(Number(e.target.value))}
                    className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-lg border border-slate-700"
                  >
                    <option value={11}>11 Months (Standard)</option>
                    <option value={24}>24 Months</option>
                    <option value={36}>36 Months</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Notice Period</label>
                  <select
                    value={agNoticeDays}
                    onChange={(e) => setAgNoticeDays(Number(e.target.value))}
                    className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-lg border border-slate-700"
                  >
                    <option value={30}>30 Days</option>
                    <option value={60}>60 Days</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAgAgreementGenerated(true)}
                className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <FileText className="w-4 h-4" />
                <span>{agAgreementGenerated ? 'Updated Agreement Ready' : 'Lock Draft & Stamp Estimate'}</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4 text-left">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400">
                  E-Stamp Ready Draft · Karnataka Rent Compliance
                </div>
                <h3 className="font-bold text-white text-base mt-0.5">
                  Residential Tenancy Agreement Preview
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyAgreement}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  {agCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{agCopied ? 'Copied' : 'Copy Text'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadAgreement}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .txt</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-3 leading-relaxed max-h-[500px] overflow-y-auto scrollbar-thin tabular-nums">
              <div className="text-center font-bold text-amber-400 pb-2 border-b border-slate-800">
                MEMORANDUM OF RESIDENTIAL RENTAL AGREEMENT
              </div>

              <p>
                This agreement is entered into effective <strong>{agStartDate}</strong> at Bangalore, Karnataka, between:
              </p>

              <p>
                <strong>LESSOR / OWNER:</strong> {agOwnerName}, represented by <em>Gouse AI Architecture &amp; Real Estate Brokerage Studio</em>, Bangalore.
              </p>

              <p>
                <strong>LESSEE / TENANT:</strong> {agTenantName}, residing at the premises mentioned below.
              </p>

              <p>
                <strong>SCHEDULE OF THE PROPERTY:</strong> {agPropertyAddress}. Verified BBMP approvals and standard fixtures.
              </p>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                <div>1. <strong>MONTHLY RENT:</strong> ₹{agMonthlyRent.toLocaleString('en-IN')} payable on or before the 5th of each calendar month.</div>
                <div>2. <strong>INTEREST-FREE SECURITY DEPOSIT:</strong> ₹{agDeposit.toLocaleString('en-IN')} refunded at lease termination.</div>
                <div>3. <strong>TENURE &amp; ESCALATION:</strong> Valid for {agTenureMonths} months from {agStartDate} ({agEscalationPercent}% annual renewal escalation).</div>
                <div>4. <strong>NOTICE PERIOD:</strong> Either party may terminate by providing {agNoticeDays} days written notice.</div>
                <div>5. <strong>BROKERAGE WAIVER:</strong> Executed under Gouse AI Zero-Brokerage direct owner guarantee (Est. e-Stamp Duty: ₹{karnatakaStampDutyEstimate.toLocaleString('en-IN')}).</div>
              </div>

              <p className="text-[11px] text-slate-400">
                IN WITNESS WHEREOF the parties have set their hands on this document in the presence of witnesses.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <span className="text-xs text-slate-400 tabular-nums">
                Reference ID: <code className="text-amber-400 font-mono">{deterministicAgreementId}</code> · Est. e-Stamp: <strong className="text-slate-200 font-mono">₹{karnatakaStampDutyEstimate.toLocaleString('en-IN')}</strong>
              </span>

              <a
                href={`https://wa.me/918073947241?text=Hello%20Ar.%20Gouse,%20I%20have%20drafted%20rental%20agreement%20${deterministicAgreementId}%20for%20${encodeURIComponent(agTenantName)}%20at%20${encodeURIComponent(agPropertyAddress)}.`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm &amp; Dispatch to Ar. S. Gouse</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. SUB-VIEW: YIELD & BROKERAGE ROI ANALYTICS                               */}
      {/* ========================================================================= */}
      {activeBrokerTab === 'analytics' && (
        <div className="space-y-6 text-left tabular-nums">
          {/* Interactive ROI Simulator Controls */}
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400">
                  Interactive Financial Model · Bangalore Rental Benchmark
                </div>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Co-Living PG vs. Traditional Flat Yield Simulator
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSimPlotAreaSqFt(3000);
                  setSimTotalCapex(21500000);
                  setSimPgBeds(24);
                  setSimPgRentPerBed(11500);
                  setSimFlatMonthlyRent(75000);
                  setSimOccupancyPct(90);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Benchmark</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Plot / Built-up Area</span>
                  <span className="font-mono text-white font-semibold">{simPlotAreaSqFt.toLocaleString('en-IN')} sq.ft</span>
                </div>
                <input
                  type="range"
                  min={1200}
                  max={6000}
                  step={200}
                  value={simPlotAreaSqFt}
                  onChange={(e) => setSimPlotAreaSqFt(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Total Capex</span>
                  <span className="font-mono text-white font-semibold">{formatCurrency(simTotalCapex, currency)}</span>
                </div>
                <input
                  type="range"
                  min={10000000}
                  max={60000000}
                  step={500000}
                  value={simTotalCapex}
                  onChange={(e) => setSimTotalCapex(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>PG Bed Count</span>
                  <span className="font-mono text-amber-400 font-semibold">{simPgBeds} Beds</span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={60}
                  step={2}
                  value={simPgBeds}
                  onChange={(e) => setSimPgBeds(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Avg Bed Rent</span>
                  <span className="font-mono text-emerald-400 font-semibold">₹{simPgRentPerBed.toLocaleString('en-IN')}/mo</span>
                </div>
                <input
                  type="range"
                  min={7500}
                  max={20000}
                  step={500}
                  value={simPgRentPerBed}
                  onChange={(e) => setSimPgRentPerBed(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Occupancy Rate</span>
                  <span className="font-mono text-emerald-400 font-semibold">{simOccupancyPct}%</span>
                </div>
                <input
                  type="range"
                  min={60}
                  max={100}
                  step={2}
                  value={simOccupancyPct}
                  onChange={(e) => setSimOccupancyPct(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="text-[11px] text-slate-400 font-mono uppercase">PG Monthly Gross Revenue</div>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {formatCurrency(simMetrics.pgGrossMonthly, currency)}
              </div>
              <p className="text-[11px] text-slate-400">
                At {simOccupancyPct}% occupancy across {simPgBeds} beds
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="text-[11px] text-slate-400 font-mono uppercase">Net Annual Rental Yield</div>
              <div className="text-2xl font-bold font-mono text-white">
                {simMetrics.pgYieldPct.toFixed(1)}% p.a.
              </div>
              <p className="text-[11px] text-emerald-400">
                +{simMetrics.yieldDelta.toFixed(1)}% vs flat rental ({simMetrics.flatYieldPct.toFixed(1)}%)
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="text-[11px] text-slate-400 font-mono uppercase">Monthly Cashflow Uplift</div>
              <div className="text-2xl font-bold font-mono text-amber-400">
                +{formatCurrency(Math.max(0, simMetrics.monthlyUplift), currency)}
              </div>
              <p className="text-[11px] text-slate-400">
                Extra monthly income vs ₹{simFlatMonthlyRent.toLocaleString('en-IN')} flat lease
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="text-[11px] text-slate-400 font-mono uppercase">Capital Payback Period</div>
              <div className="text-2xl font-bold font-mono text-white">
                {simMetrics.paybackYears.toFixed(1)} Years
              </div>
              <p className="text-[11px] text-slate-400">
                Net annual cashflow: {formatCurrency(simMetrics.pgNetAnnual, currency)}
              </p>
            </div>
          </div>

          {/* Comparison Matrix */}
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-white text-base">
                  Broker Yield Comparison: Co-Living PG vs. Traditional Flat Rental
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Live comparison for a {simPlotAreaSqFt.toLocaleString('en-IN')} sq.ft building in HSR Layout / Bellandur corridor
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-amber-400">
                {simMetrics.flatYieldPct > 0 ? `${(simMetrics.pgYieldPct / simMetrics.flatYieldPct).toFixed(1)}x Yield Advantage` : 'High Yield'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Financial Metric</th>
                    <th className="py-3 px-4 text-emerald-400">Gouse AI Co-Living &amp; Executive PG</th>
                    <th className="py-3 px-4 text-slate-400">Traditional Unfurnished Flat</th>
                    <th className="py-3 px-4 text-amber-400">Strategic Advantage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-white">Monthly Gross Revenue</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">{formatCurrency(simMetrics.pgGrossMonthly, currency)} / mo</td>
                    <td className="py-3 px-4 font-mono text-slate-300">{formatCurrency(simFlatMonthlyRent, currency)} / mo</td>
                    <td className="py-3 px-4 text-slate-300">+{formatCurrency(Math.max(0, simMetrics.monthlyUplift), currency)}/mo uplift</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-white">Net Annual Rental Yield</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">{simMetrics.pgYieldPct.toFixed(1)}% p.a.</td>
                    <td className="py-3 px-4 font-mono text-slate-300">{simMetrics.flatYieldPct.toFixed(1)}% p.a.</td>
                    <td className="py-3 px-4 text-slate-300">+{simMetrics.yieldDelta.toFixed(1)}% annual yield spread</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-white">Tenant Vacancy Risk</td>
                    <td className="py-3 px-4 text-emerald-400 font-semibold">Low (Fractional bed diversification)</td>
                    <td className="py-3 px-4 text-rose-400 font-semibold">High (100% loss when empty)</td>
                    <td className="py-3 px-4 text-slate-300">Continuous cash flow continuity</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-white">Broker Commission Model</td>
                    <td className="py-3 px-4 font-mono text-amber-300">Zero Brokerage Direct</td>
                    <td className="py-3 px-4 font-mono text-slate-400">1 Month Traditional Broker Fee</td>
                    <td className="py-3 px-4 text-emerald-400">Zero friction tenant onboarding</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      </div>

      {/* DEDICATED SEPARATE GOUSE AI AGENT BROKER AUTHENTICATION MODAL */}
      <BrokerAuthModal
        isOpen={isBrokerAuthModalOpen}
        onClose={() => setIsBrokerAuthModalOpen(false)}
        defaultRole={brokerAuthDefaultRole}
      />
    </div>
  );
};
