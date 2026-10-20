import React, { useState } from 'react';
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
} from 'lucide-react';
import { Project } from '../types';
import { CurrencyCode, formatCurrency } from '../utils/formatters';
import { PgHousePropertyListingSection } from './PgHousePropertyListingSection';
import { useAuth } from '../context/AuthContext';
import { BrokerAuthModal } from './BrokerAuthModal';

interface GouseAiAgentBrokerViewProps {
  project?: Project;
  onUpdateProject?: (updated: Project) => void;
  currency?: CurrencyCode;
  initialSubTab?: 'all' | 'pg' | 'rent_house' | 'matchmaker' | 'agreement' | 'analytics';
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
    'all' | 'pg' | 'rent_house' | 'matchmaker' | 'agreement' | 'analytics'
  >(initialSubTab);

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
    type: string;
    location: string;
    price: number;
    matchScore: number;
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
  const [agAgreementGenerated, setAgAgreementGenerated] = useState(false);

  // AI Broker Matchmaker run handler
  const handleRunAiMatchmaker = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAiMatching(true);

    setTimeout(() => {
      setIsAiMatching(false);

      const mockMatches = [
        {
          id: 'match-1',
          name: 'UrbanNest Executive PG & Co-Living House',
          type: 'Single Private Executive Suite (Attached Bath + Balcony)',
          location: 'Sector 2, HSR Layout (Walk to 27th Main Hub)',
          price: 18500,
          matchScore: 98,
          highlights: [
            '3 Times Hygienic Meals Included + Sunday Special',
            '300 Mbps Fiber WiFi & 24/7 Power Backup',
            'Biometric Access Control & Daily Housekeeping',
            'Zero Brokerage Direct Owner Booking',
          ],
          contactPhone: '+91 8073947241',
        },
        {
          id: 'match-2',
          name: 'GreenGlen 3BHK Independent Rental Floor',
          type: '3BHK Luxury Builder Floor (1,550 sq.ft)',
          location: 'Green Glen Layout, Bellandur (Near RMZ Ecospace)',
          price: 36000,
          matchScore: 92,
          highlights: [
            '100% Vastu Compliant East Facing Entrance',
            'Covered Car Parking + 2 Bike Bays',
            '24/7 Borewell & Cauvery Water Supply',
            'A-Khata BBMP Approved Structure',
          ],
          contactPhone: '+91 8073947241',
        },
        {
          id: 'match-3',
          name: 'TechHub Executive Gents PG & Co-Living',
          type: 'Double Sharing Studio Suite with AC',
          location: 'Bellandur ORR (Near EcoWorld / RMZ Ecospace)',
          price: 11500,
          matchScore: 89,
          highlights: [
            'Walking distance to Outer Ring Road tech hubs',
            'Unlimited buffet meals & modular kitchen access',
            'Rooftop recreation lounge & workout gym',
          ],
          contactPhone: '+91 8073947241',
        },
      ];

      setAiMatchResults(mockMatches);
    }, 700);
  };

  return (
    <div className={isOutsidePlatform ? 'min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 pb-16' : ''}>
      {/* 0. OUTSIDE PLATFORM TOP ACCESS & NAVIGATION BAR */}
      {isOutsidePlatform && (
        <div
          id="banner-agent-broker-governance"
          className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-indigo-950/90 border-b border-amber-500/40 px-4 py-2.5 text-xs text-slate-300 shadow-md sticky top-0 z-50 backdrop-blur-md"
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 text-left">
              <span className="p-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <Key className="w-3.5 h-3.5" />
              </span>
              <span>
                <strong className="text-white">Outside Platform Portal:</strong> Gouse AI Agent Broker • Verified PGs, Co-Living &amp; House Rentals.{' '}
                <span className="hidden md:inline text-slate-400">
                  Direct owner listings, 0% brokerage, automated lease drafting.
                </span>
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
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-bold"
                    style={{
                      backgroundColor:
                        user.role === 'tenant'
                          ? 'rgba(245, 158, 11, 0.15)'
                          : user.role === 'property_owner'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : user.role === 'broker_agent'
                          ? 'rgba(14, 165, 233, 0.15)'
                          : 'rgba(168, 85, 247, 0.15)',
                      borderColor:
                        user.role === 'tenant'
                          ? 'rgba(245, 158, 11, 0.35)'
                          : user.role === 'property_owner'
                          ? 'rgba(16, 185, 129, 0.35)'
                          : user.role === 'broker_agent'
                          ? 'rgba(14, 165, 233, 0.35)'
                          : 'rgba(168, 85, 247, 0.35)',
                      color:
                        user.role === 'tenant'
                          ? '#fde68a'
                          : user.role === 'property_owner'
                          ? '#a7f3d0'
                          : user.role === 'broker_agent'
                          ? '#bae6fd'
                          : '#e9d5ff',
                    }}
                  >
                    <span>
                      {user.role === 'tenant' && '🏠 Tenant: '}
                      {user.role === 'property_owner' && '🏢 Landlord: '}
                      {user.role === 'broker_agent' && '🛡️ Broker: '}
                      {user.role !== 'tenant' &&
                        user.role !== 'property_owner' &&
                        user.role !== 'broker_agent' &&
                        '👤 '}
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
        {/* ========================================================================= */}
        {/* 1. GOUSE AI AGENT BROKER: MASTER BRANDING & HERO BANNER                    */}
        {/* ========================================================================= */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/80 border border-amber-500/30 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            {/* Top Tagline Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs font-mono tracking-wider flex items-center gap-1.5 shadow-md">
                <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                GOUSE AI AGENT BROKER
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                ZERO BROKERAGE DIRECT
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[11px] font-mono font-semibold">
                BBMP A-KHATA &amp; IS 456 VERIFIED
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[11px] font-mono font-semibold">
                BANGALORE TECH CORRIDOR
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Gouse AI Agent Broker:{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">
                PG, Co-Living &amp; Rental House
              </span>{' '}
              Command Center
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
              Autonomous real estate brokerage and inventory management platform. Discover and lease verified executive PG rooms, co-living suites, independent rental houses, and builder floors with zero hidden markups, instant tenant matchmaking, and automated digital lease agreements.
            </p>

            {/* Key Value Points */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-left">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wide">Listed Assets</div>
                <div className="text-base font-bold text-white mt-0.5">8+ Properties</div>
                <div className="text-[10px] text-amber-400">PGs &amp; Independent Houses</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-left">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wide">Live Inventory</div>
                <div className="text-base font-bold text-emerald-400 mt-0.5">48 Beds &amp; Units</div>
                <div className="text-[10px] text-slate-400">82% Verified Occupancy</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-left">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wide">Tenant Fee</div>
                <div className="text-base font-bold text-amber-300 mt-0.5">₹0 Brokerage</div>
                <div className="text-[10px] text-emerald-400">Direct Owner Leasing</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-left">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wide">Turnkey Yield</div>
                <div className="text-base font-bold text-sky-400 mt-0.5">11.8% - 14.2%</div>
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
      <div className="bg-slate-900 border border-slate-800 p-2 rounded-2xl flex items-center gap-2 overflow-x-auto scrollbar-none shadow-md">
        <button
          type="button"
          onClick={() => setActiveBrokerTab('all')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
            activeBrokerTab === 'all'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 ring-2 ring-amber-400'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>All Properties Hub</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveBrokerTab('pg')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
            activeBrokerTab === 'pg'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 ring-2 ring-amber-400'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>🏢 PG &amp; Co-Living Hostels</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveBrokerTab('rent_house')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
            activeBrokerTab === 'rent_house'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25 ring-2 ring-emerald-400'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>🏡 Rent House &amp; Independent Flats</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveBrokerTab('matchmaker')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
            activeBrokerTab === 'matchmaker'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 ring-2 ring-indigo-400'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>🤖 AI Broker Matchmaker</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
            SMART
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveBrokerTab('agreement')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
            activeBrokerTab === 'agreement'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25 ring-2 ring-teal-400'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 text-teal-400" />
          <span>📑 Digital Rental Agreement Desk</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveBrokerTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
            activeBrokerTab === 'analytics'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25 ring-2 ring-purple-400'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-purple-400" />
          <span>📊 Yield &amp; ROI Analytics</span>
        </button>
      </div>

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
      {/* 4. SUB-VIEW: AI BROKER MATCHMAKER                                         */}
      {/* ========================================================================= */}
      {activeBrokerTab === 'matchmaker' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {/* Matchmaker Input Form */}
          <div className="lg:col-span-1 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-left shadow-xl">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>AI Tenant &amp; Accommodation Matchmaker</span>
            </div>
            <p className="text-xs text-slate-400">
              Set tenant preferences, budget bracket, and target tech park corridor. The Gouse AI Broker agent filters verified inventory and ranks the best options.
            </p>

            <form onSubmit={handleRunAiMatchmaker} className="space-y-4 pt-2">
              {/* Tenant Occupancy Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tenant Profile</label>
                <select
                  value={matchTenantType}
                  onChange={(e) => setMatchTenantType(e.target.value as any)}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-400"
                >
                  <option value="individual">Single Working Professional (IT / Fintech / Doctor)</option>
                  <option value="couple">Working Couple (Independent Floor / Studio)</option>
                  <option value="family">Family (2BHK / 3BHK Independent House)</option>
                  <option value="students">College / Interns (Budget Sharing PG)</option>
                </select>
              </div>

              {/* Property Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Property Type Preference</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMatchPropertyCategory('any')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border ${
                      matchPropertyCategory === 'any'
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Any
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatchPropertyCategory('pg')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border ${
                      matchPropertyCategory === 'pg'
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    PG &amp; Co-Living
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatchPropertyCategory('house')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border ${
                      matchPropertyCategory === 'house'
                        ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Rent House
                  </button>
                </div>
              </div>

              {/* Monthly Budget Slider */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>Monthly Budget:</span>
                  <span className="text-amber-400 font-mono font-bold">
                    {formatCurrency(matchBudget, currency)} / month
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
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                  <span>₹8k (Budget PG)</span>
                  <span>₹25k (Suite / 1BHK)</span>
                  <span>₹60k (3BHK Villa)</span>
                </div>
              </div>

              {/* Location Corridor */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Bangalore Zone</label>
                <select
                  value={matchZone}
                  onChange={(e) => setMatchZone(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-400"
                >
                  <option value="hsr">HSR Layout (Sectors 1 to 7 • Startups &amp; Cafes)</option>
                  <option value="bellandur">Bellandur &amp; Outer Ring Road (RMZ Ecospace, EcoWorld)</option>
                  <option value="whitefield">Whitefield (ITPB, Kadugodi, Prestige Shantiniketan)</option>
                  <option value="koramangala">Koramangala (Sony World, 4th &amp; 5th Blocks)</option>
                  <option value="indiranagar">Indiranagar (100 Feet Rd &amp; Defence Colony)</option>
                  <option value="electronic_city">Electronic City Phase 1 &amp; 2 (Infosys, Wipro)</option>
                </select>
              </div>

              {/* Furnishing Preference */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Furnishing</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMatchFurnishing('fully')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border ${
                      matchFurnishing === 'fully'
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Fully Furnished
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatchFurnishing('semi')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border ${
                      matchFurnishing === 'semi'
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Semi-Furnished
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatchFurnishing('any')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border ${
                      matchFurnishing === 'any'
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    No Preference
                  </button>
                </div>
              </div>

              {/* Food Inclusion Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
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

              {/* Submit Search */}
              <button
                type="submit"
                disabled={isAiMatching}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isAiMatching ? 'AI Broker Searching...' : 'Run AI Broker Matchmaker'}</span>
              </button>
            </form>
          </div>

          {/* Results Display */}
          <div className="lg:col-span-2 space-y-4 text-left">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <span>Matched Properties &amp; Units</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono">
                    Zero Brokerage Verified
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ranked by AI compatibility index, commute distance, and pricing efficiency.
                </p>
              </div>

              <div className="text-right text-xs font-mono text-slate-400">
                Corridor: <span className="text-amber-400 font-bold uppercase">{matchZone}</span>
              </div>
            </div>

            {/* List of Matched Cards */}
            <div className="space-y-3">
              {(aiMatchResults || [
                {
                  id: 'default-1',
                  name: 'UrbanNest Executive PG & Co-Living House',
                  type: 'Single Private Executive Suite (Attached Bath + Balcony)',
                  location: 'Sector 2, HSR Layout, Bangalore',
                  price: 18500,
                  matchScore: 98,
                  highlights: [
                    '3 Times Hygienic Meals Included + Sunday Special',
                    '300 Mbps Fiber WiFi & 24/7 Power Backup',
                    'Biometric Access Control & Daily Housekeeping',
                    'Zero Brokerage Direct Owner Booking',
                  ],
                  contactPhone: '+91 8073947241',
                },
                {
                  id: 'default-2',
                  name: 'GreenGlen 3BHK Independent Rental Floor',
                  type: '3BHK Luxury Builder Floor (1,550 sq.ft)',
                  location: 'Green Glen Layout, Bellandur, Bangalore',
                  price: 36000,
                  matchScore: 92,
                  highlights: [
                    '100% Vastu Compliant East Facing Entrance',
                    'Covered Car Parking + 2 Bike Bays',
                    '24/7 Borewell & Cauvery Water Supply',
                    'A-Khata BBMP Approved Structure',
                  ],
                  contactPhone: '+91 8073947241',
                },
              ]).map((match) => (
                <div
                  key={match.id}
                  className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 transition shadow-lg space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-base">{match.name}</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {match.matchScore}% Match
                        </span>
                      </div>
                      <div className="text-xs text-amber-400 font-medium mt-0.5">{match.type}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>{match.location}</span>
                      </div>
                    </div>

                    <div className="sm:text-right">
                      <div className="text-lg font-bold font-mono text-white">
                        {formatCurrency(match.price, currency)}
                        <span className="text-xs text-slate-400 font-normal"> / mo</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400">Direct Brokerage: ₹0</span>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2 border-t border-slate-800/80">
                    {match.highlights.map((h, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-2">
                    <a
                      href={`https://wa.me/918073947241?text=Hello%20Ar.%20Gouse,%20I%20matched%20with%20${encodeURIComponent(match.name)}%20via%20Gouse%20AI%20Agent%20Broker%20and%20want%20to%20schedule%20a%20site%20visit.`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Book Site Visit on WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveBrokerTab(match.type.includes('PG') ? 'pg' : 'rent_house');
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition"
                    >
                      <span>View Full Property Listing</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SUB-VIEW: DIGITAL RENTAL AGREEMENT & BROKERAGE DESK                     */}
      {/* ========================================================================= */}
      {activeBrokerTab === 'agreement' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {/* Agreement Configurator Form */}
          <div className="lg:col-span-1 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-left shadow-xl">
            <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
              <FileText className="w-4 h-4" />
              <span>Standard 11-Month Rental Agreement Generator</span>
            </div>
            <p className="text-xs text-slate-400">
              Generates legal tenancy contract terms compliant with Karnataka Rent Control guidelines, e-stamp validation parameters, and security deposit escrow rules.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Landlord / Owner Name</label>
                <input
                  type="text"
                  value={agOwnerName}
                  onChange={(e) => setAgOwnerName(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tenant Name</label>
                <input
                  type="text"
                  value={agTenantName}
                  onChange={(e) => setAgTenantName(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Property Address</label>
                <textarea
                  rows={2}
                  value={agPropertyAddress}
                  onChange={(e) => setAgPropertyAddress(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-teal-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Monthly Rent (₹)</label>
                  <input
                    type="number"
                    value={agMonthlyRent}
                    onChange={(e) => setAgMonthlyRent(Number(e.target.value))}
                    className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Security Deposit (₹)</label>
                  <input
                    type="number"
                    value={agDeposit}
                    onChange={(e) => setAgDeposit(Number(e.target.value))}
                    className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tenure</label>
                  <select
                    value={agTenureMonths}
                    onChange={(e) => setAgTenureMonths(Number(e.target.value))}
                    className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-700"
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
                    className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-700"
                  >
                    <option value={30}>30 Days</option>
                    <option value={60}>60 Days</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAgAgreementGenerated(true)}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
              >
                <FileText className="w-4 h-4" />
                <span>Generate Verified Agreement Preview</span>
              </button>
            </div>
          </div>

          {/* Agreement Preview Draft */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-left shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase tracking-wider font-bold">
                  E-Stamp Ready Draft • Gouse AI Broker Desk
                </span>
                <h3 className="font-bold text-white text-base mt-1">
                  Residential Tenancy Agreement Preview
                </h3>
              </div>

              <span className="text-xs font-mono text-emerald-400">
                Brokerage: Direct Owner (0% Fee)
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-3 leading-relaxed max-h-[500px] overflow-y-auto scrollbar-thin">
              <div className="text-center font-bold text-amber-400 pb-2 border-b border-slate-800">
                MEMORANDUM OF RESIDENTIAL RENTAL AGREEMENT
              </div>

              <p>
                This agreement is entered into on this <strong>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong> at Bangalore, Karnataka, between:
              </p>

              <p>
                <strong>LESSOR / OWNER:</strong> {agOwnerName}, represented by <em>Gouse AI Architecture &amp; Real Estate Brokerage Studio</em>, Bangalore.
              </p>

              <p>
                <strong>LESSEE / TENANT:</strong> {agTenantName}, residing at the premises mentioned below.
              </p>

              <p>
                <strong>SCHEDULE OF THE PROPERTY:</strong> {agPropertyAddress}. Total building structure with verified BBMP approvals and standard fixtures.
              </p>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <div>1. <strong>MONTHLY RENT:</strong> ₹{agMonthlyRent.toLocaleString('en-IN')} payable on or before the 5th of each English calendar month.</div>
                <div>2. <strong>INTEREST-FREE SECURITY DEPOSIT:</strong> ₹{agDeposit.toLocaleString('en-IN')} paid via digital transfer to be refunded at termination.</div>
                <div>3. <strong>TENURE &amp; DURATION:</strong> This agreement is valid for a period of {agTenureMonths} months.</div>
                <div>4. <strong>NOTICE PERIOD:</strong> Either party can terminate this agreement by providing {agNoticeDays} days written notice.</div>
                <div>5. <strong>BROKERAGE WAIVER:</strong> Executed under Gouse AI Agent Broker Zero-Brokerage direct owner guarantee.</div>
              </div>

              <p className="text-[11px] text-slate-400">
                IN WITNESS WHEREOF the parties have set their hands on this document in the presence of witnesses.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <span className="text-xs text-slate-400">
                Digital document verification hash: <code className="text-amber-400 font-mono">GOUSE-AGR-{Date.now().toString().slice(-6)}</code>
              </span>

              <a
                href={`https://wa.me/918073947241?text=Hello%20Ar.%20Gouse,%20I%20have%20drafted%20a%20rental%20agreement%20for%20${encodeURIComponent(agTenantName)}%20at%20${encodeURIComponent(agPropertyAddress)}%20via%20Gouse%20AI%20Agent%20Broker.`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition"
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
        <div className="space-y-6 animate-in fade-in duration-200 text-left">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>ESTIMATED ANNUAL RENTAL YIELD</span>
                <span className="text-emerald-400 font-bold">13.8% p.a.</span>
              </div>
              <div className="text-2xl font-bold font-mono text-white">₹48,50,000</div>
              <p className="text-[11px] text-slate-400">
                Across managed PG beds and residential floor inventory with 85%+ occupancy benchmark.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>OCCUPANCY VELOCITY</span>
                <span className="text-amber-400 font-bold">14 Days</span>
              </div>
              <div className="text-2xl font-bold font-mono text-white">88.4%</div>
              <p className="text-[11px] text-slate-400">
                Average turnaround time to fill a vacant bed or independent 2BHK/3BHK unit in tech parks.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>TENANT RETENTION</span>
                <span className="text-sky-400 font-bold">14.2 Months</span>
              </div>
              <div className="text-2xl font-bold font-mono text-white">92.1%</div>
              <p className="text-[11px] text-slate-400">
                High satisfaction driven by sound-proofing, hygienic catering, and fast maintenance resolution.
              </p>
            </div>
          </div>

          {/* Comparison Matrix: Co-living vs Traditional Unfurnished House */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">
                  Broker Yield Comparison: Co-Living PG vs. Traditional Flat Rental
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Simulated on a 3,000 sq.ft building plot (G+3 Floors) in HSR Layout / Bellandur corridor.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-mono font-bold border border-purple-500/40">
                +180% Yield Premium
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Financial Metric</th>
                    <th className="py-3 px-4 text-emerald-400">Gouse AI Co-Living &amp; Executive PG</th>
                    <th className="py-3 px-4 text-slate-400">Traditional Unfurnished 3BHK Flat</th>
                    <th className="py-3 px-4 text-amber-400">Strategic Advantage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-white">Monthly Gross Revenue</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">₹2,45,000 / month</td>
                    <td className="py-3 px-4 font-mono text-slate-300">₹75,000 / month</td>
                    <td className="py-3 px-4 text-slate-300">+226% Gross Cash Flow via Bed Density</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-white">Net Annual Rental Yield</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">12.5% - 14.8% p.a.</td>
                    <td className="py-3 px-4 font-mono text-slate-300">3.6% - 4.2% p.a.</td>
                    <td className="py-3 px-4 text-slate-300">3x Capital Payback Acceleration</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-white">Tenant Vacancy Risk</td>
                    <td className="py-3 px-4 text-emerald-400 font-semibold">Low (Fractional multi-tenant loss)</td>
                    <td className="py-3 px-4 text-rose-400 font-semibold">High (100% loss during vacancy)</td>
                    <td className="py-3 px-4 text-slate-300">Continuous cash flow continuity</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-white">Broker Commission Model</td>
                    <td className="py-3 px-4 font-mono text-amber-300">Zero Brokerage to Direct Tenants</td>
                    <td className="py-3 px-4 font-mono text-slate-400">1 Month Traditional Broker Fee</td>
                    <td className="py-3 px-4 text-emerald-400">Zero friction tenant onboarding</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED SEPARATE GOUSE AI AGENT BROKER AUTHENTICATION MODAL */}
      <BrokerAuthModal
        isOpen={isBrokerAuthModalOpen}
        onClose={() => setIsBrokerAuthModalOpen(false)}
        defaultRole={brokerAuthDefaultRole}
      />
    </div>
  </div>
  );
};
