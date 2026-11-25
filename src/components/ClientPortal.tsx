import React, { useState } from 'react';
import {
  Compass,
  ArrowRight,
  CheckCircle2,
  Building2,
  FileSpreadsheet,
  Camera,
  ShieldCheck,
  MapPin,
  Mail,
  Phone,
  Send,
  LogIn,
  LogOut,
  ArrowLeft,
  Sliders,
  ClipboardCheck,
  FolderOpen,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Project } from '../types';
import { CurrencyCode, formatCurrency } from '../utils/formatters';
import { PROJECT_MEDIA } from '../utils/mediaAssets';

interface ClientPortalProps {
  projects?: Project[];
  currency?: CurrencyCode;
  isClientRestricted?: boolean;
  onEnquirySubmitted?: (enquiryData: {
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    projectType: string;
    location: string;
    budget: string;
    notes: string;
  }) => void;
  onReturnToWorkspace?: () => void;
  onOpenClientDashboard?: () => void;
  isPreviewMode?: boolean;
}

interface PortfolioShowcaseItem {
  id: string;
  title: string;
  typology: string;
  location: string;
  areaSqFt: number;
  budgetInr: number;
  stage: string;
  image: string;
  summary: string;
}

const PORTFOLIO_SHOWCASE: PortfolioShowcaseItem[] = [
  {
    id: 'showcase-villa',
    title: 'Palm Crest Contemporary Residence',
    typology: 'Residential Villa & Interior Fit-Out',
    location: 'Whitefield, Bangalore',
    areaSqFt: 5800,
    budgetInr: 38500000,
    stage: 'Superstructure & Joinery',
    image: PROJECT_MEDIA.bangaloreHouseExterior,
    summary:
      'G+2 cantilevered RCC residence featuring Italian Statuario marble, acoustic walnut joinery, and solar-integrated smart automation.',
  },
  {
    id: 'showcase-coliving',
    title: 'UrbanNest Executive Co-Living',
    typology: 'PG / Co-Living & Rental Asset',
    location: 'HSR Layout Sector 2, Bangalore',
    areaSqFt: 5200,
    budgetInr: 26500000,
    stage: 'Turnkey Commissioning',
    image: PROJECT_MEDIA.pgExterior,
    summary:
      'High-yield 18-suite co-living property engineered around GBA bylaws, biometric access, and commercial MEP distribution.',
  },
  {
    id: 'showcase-commercial',
    title: 'Vellum Atrium Commercial Villa',
    typology: 'Boutique Commercial & Studio',
    location: 'Indiranagar, Bangalore',
    areaSqFt: 7400,
    budgetInr: 49200000,
    stage: 'Completed Handover',
    image: PROJECT_MEDIA.builderProj1,
    summary:
      'Double-height daylight atrium office designed for zero-clashing MEP shafts, passive solar louvers, and locked CPWD rate procurement.',
  },
];

export const ClientPortal: React.FC<ClientPortalProps> = ({
  projects = [],
  currency = 'INR',
  isClientRestricted = false,
  onEnquirySubmitted,
  onReturnToWorkspace,
  onOpenClientDashboard,
}) => {
  const { user, openLoginModal, login, logout, quickSignIn } = useAuth();
  const { currentTheme } = useTheme();

  const [inlineEmail, setInlineEmail] = useState('');
  const [inlinePassword, setInlinePassword] = useState('');
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const [activeShowcaseIdx, setActiveShowcaseIdx] = useState(0);

  // Consultation Brief Form State
  const [clientName, setClientName] = useState(user?.name || '');
  const [clientEmail, setClientEmail] = useState(user?.email || '');
  const [clientPhone, setClientPhone] = useState(user?.phone || '');
  const [projectType, setProjectType] = useState('Residential Villa / Custom Home');
  const [location, setLocation] = useState('Whitefield / North Bangalore');
  const [budget, setBudget] = useState('₹2.5 Cr - ₹5.0 Cr');
  const [notes, setNotes] = useState('');
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [isSubmittingBrief, setIsSubmittingBrief] = useState(false);

  const featuredProject = projects[0];
  const activeShowcase = PORTFOLIO_SHOWCASE[activeShowcaseIdx] || PORTFOLIO_SHOWCASE[0];

  const handleInlineSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineError(null);
    setIsSigningIn(true);
    try {
      const res = await login(inlineEmail, inlinePassword);
      if (!res.success) {
        setInlineError(res.error || 'Unable to verify credentials. Please check your registered email.');
      } else if (onOpenClientDashboard) {
        onOpenClientDashboard();
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSubmitBrief = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientEmail.trim()) return;
    setIsSubmittingBrief(true);
    setTimeout(() => {
      if (onEnquirySubmitted) {
        onEnquirySubmitted({
          clientName: clientName.trim(),
          clientEmail: clientEmail.trim(),
          clientPhone: clientPhone.trim() || '+91 99001 88234',
          projectType,
          location,
          budget,
          notes: notes.trim(),
        });
      }
      setSubmittedRef(`BRIEF-${String(Date.now()).slice(-5)}`);
      setIsSubmittingBrief(false);
      setNotes('');
    }, 350);
  };

  const primaryActionLabel = onOpenClientDashboard
    ? 'Open Client Workspace'
    : 'Client Sign In';

  const handlePrimaryAction = () => {
    if (onOpenClientDashboard) {
      onOpenClientDashboard();
    } else {
      openLoginModal();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* 3-Zone Top Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2.5"
          >
            <Compass className="w-5 h-5 shrink-0" style={{ color: currentTheme.colors['400'] }} />
            <span>Gouse AI</span>
          </button>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
            <a href="#client-access" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Client Access
            </a>
            <a href="#deliverables" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Deliverables
            </a>
            <a href="#portfolio" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Portfolio
            </a>
            <a href="#consultation" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Consultation
            </a>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            {!isClientRestricted && onReturnToWorkspace && (
              <button
                type="button"
                onClick={onReturnToWorkspace}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Studio Workspace</span>
              </button>
            )}
            <button
              id="btn-portal-open-workspace"
              type="button"
              onClick={handlePrimaryAction}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <span>{primaryActionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Split */}
        <section id="client-access" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Column: Welcome & Account Entry */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span>Architecture &amp; Turnkey Delivery</span>
                  <span aria-hidden="true">·</span>
                  <span>Council of Architecture CA/2012/55190</span>
                  <span aria-hidden="true">·</span>
                  <span>Bangalore</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white max-w-2xl leading-[1.15]">
                  Transparent project control from sanction to handover.
                </h1>

                <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                  Review live itemized BOQ budgets, approve finish selections and change orders, inspect geotagged site progress logs, and access certified drawings in one client workspace.
                </p>
              </div>

              {/* Client Access Card */}
              <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                {user ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-xs text-slate-400">Signed in account</div>
                      <div className="text-base font-semibold text-white">{user.name}</div>
                      <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
                        <span>{user.email}</span>
                        <span aria-hidden="true">·</span>
                        <span>{user.company || 'Client Stakeholder'}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                      {onOpenClientDashboard && (
                        <button
                          type="button"
                          onClick={onOpenClientDashboard}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
                        >
                          <span>Enter Client Workspace</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {!isClientRestricted && onReturnToWorkspace && (
                        <button
                          type="button"
                          onClick={onReturnToWorkspace}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                        >
                          <span>Back to Studio</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={logout}
                        className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h2 className="text-sm font-semibold text-white">Client Account Sign-In</h2>
                        <p className="text-xs text-slate-400">
                          Sign in with your project email or open the assigned client workspace directly.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          quickSignIn('user-sameer-05');
                          if (onOpenClientDashboard) onOpenClientDashboard();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-amber-300 transition-colors whitespace-nowrap shrink-0"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Sign in as Sameer Khan</span>
                      </button>
                    </div>

                    {inlineError && (
                      <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-500/40 text-xs text-rose-200">
                        {inlineError}
                      </div>
                    )}

                    <form onSubmit={handleInlineSignIn} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      <input
                        type="email"
                        required
                        value={inlineEmail}
                        onChange={(e) => setInlineEmail(e.target.value)}
                        placeholder="Client work email (e.g. sameer.khan@prestigeheights.com)"
                        className="sm:col-span-5 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                      <input
                        type="password"
                        value={inlinePassword}
                        onChange={(e) => setInlinePassword(e.target.value)}
                        placeholder="Password"
                        className="sm:col-span-4 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                      <button
                        type="submit"
                        disabled={isSigningIn}
                        className="sm:col-span-3 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap shrink-0 disabled:opacity-60"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>{isSigningIn ? 'Signing in...' : 'Sign In'}</span>
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Live Project Snapshot */}
            <div className="lg:col-span-5 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col">
              <div className="relative h-64 lg:h-full min-h-[280px] bg-slate-950">
                <img
                  src={PROJECT_MEDIA.bangaloreHouseExterior}
                  alt={featuredProject?.name || 'Palm Crest Contemporary Residence'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 space-y-2">
                  <div className="text-xs text-slate-300 flex flex-wrap items-center gap-2">
                    <span>Active Turnkey Project</span>
                    <span aria-hidden="true">·</span>
                    <span>{featuredProject?.location || 'Whitefield, Bangalore'}</span>
                  </div>
                  <h2 className="text-lg font-bold text-white leading-snug">
                    {featuredProject?.name || 'Palm Crest - Contemporary Residence & Interior Fit-out'}
                  </h2>
                  <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-800/80 text-xs">
                    <div>
                      <div className="text-slate-400">Built-up area</div>
                      <div className="font-semibold text-white tabular-nums">
                        {(featuredProject?.builtUpAreaSqFt || 5800).toLocaleString()} sq.ft
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">Milestones</div>
                      <div className="font-semibold text-white tabular-nums">
                        {(featuredProject?.milestones || []).filter((m) => m.status === 'completed').length} /{' '}
                        {(featuredProject?.milestones || []).length || 6} Done
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">Stage</div>
                      <div className="font-semibold text-amber-300 capitalize">
                        {(featuredProject?.status || 'construction').replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Full-Width Client Portal Capabilities Strip */}
        <section id="deliverables" className="border-y border-slate-800/80 bg-slate-900/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
            <div className="max-w-2xl space-y-1.5">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Everything clients need, linked to studio engineering
              </h2>
              <p className="text-sm text-slate-400">
                Built around transparent construction billing, traceable specification choices, and verified site progress.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                <div className="w-9 h-9 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-400">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-white">01. Live BOQ &amp; Milestone Ledger</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Track stage-wise escrow releases directly alongside live BOQ quantities, contingency, and category spend.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                <div className="w-9 h-9 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400">
                  <ClipboardCheck className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-white">02. Digital Change Orders &amp; RFIs</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Review cost and schedule impact on every site variation and authorize or request revisions with full audit trails.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                <div className="w-9 h-9 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400">
                  <Sliders className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-white">03. Finish Selections &amp; Allowances</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Compare marble, sanitaryware, glazing, and lighting tiers against your contract allowance before procurement.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                <div className="w-9 h-9 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-400">
                  <FolderOpen className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-white">04. Site Logs &amp; Drawings Vault</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Access geotagged inspection photographs, IS 456 structural certificates, working CAD drawings, and handover kits.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Portfolio Showcase */}
        <section id="portfolio" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white tracking-tight">Recent Studio Commissions</h2>
              <p className="text-sm text-slate-400">
                Active and completed residential, co-living, and commercial builds managed on the platform.
              </p>
            </div>

            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-900 border border-slate-800 overflow-x-auto">
              {PORTFOLIO_SHOWCASE.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveShowcaseIdx(idx)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    activeShowcaseIdx === idx
                      ? 'bg-amber-500 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {item.title.split(' ')[0]} {item.title.split(' ')[1]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden items-stretch">
            <div className="lg:col-span-7 relative min-h-[260px] bg-slate-950">
              <img
                src={activeShowcase.image}
                alt={activeShowcase.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="lg:col-span-5 p-6 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
                  <span>{activeShowcase.typology}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeShowcase.location}</span>
                </div>
                <h3 className="text-xl font-bold text-white">{activeShowcase.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{activeShowcase.summary}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-xs">
                <div>
                  <div className="text-slate-400">Built-up area</div>
                  <div className="text-sm font-semibold text-white tabular-nums mt-0.5">
                    {activeShowcase.areaSqFt.toLocaleString()} sq.ft
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Contract budget</div>
                  <div className="text-sm font-semibold text-white tabular-nums mt-0.5">
                    {formatCurrency(activeShowcase.budgetInr, currency)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Current stage</div>
                  <div className="text-sm font-semibold text-amber-300 mt-0.5">{activeShowcase.stage}</div>
                </div>
                <div>
                  <div className="text-slate-400">Code compliance</div>
                  <div className="text-sm font-semibold text-emerald-400 mt-0.5">IS 456 &amp; NBC 2016</div>
                </div>
              </div>

              {onOpenClientDashboard && (
                <button
                  type="button"
                  onClick={onOpenClientDashboard}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                >
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  <span>Inspect Live Client Workspace</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Consultation & Project Brief Intake */}
        <section id="consultation" className="border-t border-slate-800 bg-slate-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 space-y-4">
                <h2 className="text-2xl font-bold text-white tracking-tight">Start a Project Brief</h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Share your plot dimensions, location, and target budget. Your brief routes directly to Principal Architect Ar. S. Gouse and our quantity surveying desk for an initial feasibility &amp; cost range review.
                </p>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Council of Architecture Registered Practice (CA/2012/55190)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Indiranagar &amp; Whitefield Studio, Bangalore</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="tabular-nums">+91 80739 47241</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>sgouse14@gmail.com</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                {submittedRef && (
                  <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      Project brief <strong className="font-mono">{submittedRef}</strong> logged with the studio desk. We will share your feasibility review within 24 hours.
                    </span>
                  </div>
                )}

                <form onSubmit={handleSubmitBrief} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="e.g. Sameer Khan"
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Phone</label>
                      <input
                        type="tel"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        placeholder="+91 98450 00000"
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Project Typology</label>
                      <select
                        value={projectType}
                        onChange={(e) => setProjectType(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                      >
                        <option>Residential Villa / Custom Home</option>
                        <option>PG / Co-Living Asset</option>
                        <option>Luxury Interior Fit-Out</option>
                        <option>Commercial / Mixed-Use</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Target Budget</label>
                      <select
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                      >
                        <option>₹80L - ₹1.5 Cr</option>
                        <option>₹1.5 Cr - ₹2.5 Cr</option>
                        <option>₹2.5 Cr - ₹5.0 Cr</option>
                        <option>₹5.0 Cr+</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Site Location &amp; Plot Size</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. 40x60 ft West-Facing Plot, Whitefield, Bangalore"
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Scope &amp; Requirements</label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Share number of floors, preferred timeline, basement/parking needs, or turnkey interior scope..."
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingBrief}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap shrink-0 disabled:opacity-60"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmittingBrief ? 'Submitting Brief...' : 'Submit Consultation Brief'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800/80 bg-slate-950 px-4 sm:px-6 lg:px-8 py-5 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Gouse AI Architecture &amp; Turnkey Studio</span>
          <span>Bangalore, India · CoA CA/2012/55190</span>
        </div>
      </footer>
    </div>
  );
};

export default ClientPortal;
