import React, { useState, useEffect } from 'react';
import {
  Compass,
  Shield,
  Lock,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  FileText,
  Building2,
  Layers,
  Calculator,
  Camera,
  Store,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Download,
  Mail,
  Phone,
  User,
  LogOut,
  X,
  Send,
  HelpCircle,
  Home,
  Clock,
  Eye,
  Award,
  Coins
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { CurrencyCode, formatCurrency } from '../utils/formatters';

interface PlatformDemoProps {
  isClientRestricted?: boolean;
  onCloseDemo?: () => void;
  onOpenConsultation?: () => void;
}

export const PlatformDemo: React.FC<PlatformDemoProps> = ({
  isClientRestricted = false,
  onCloseDemo,
  onOpenConsultation,
}) => {
  const { user, logout } = useAuth();
  const { currentTheme } = useTheme();

  // Presentation State
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [consultationSuccess, setConsultationSuccess] = useState(false);

  // Demo Interactive Widgets State
  const [demoCurrency, setDemoCurrency] = useState<CurrencyCode>('INR');
  const [selectedDemoFloor, setSelectedDemoFloor] = useState<'all' | 'foundation' | 'ground' | 'level1' | 'terrace'>('all');
  const [simulatedAreaSqFt, setSimulatedAreaSqFt] = useState(4500);
  const [simulatedYieldPercent, setSimulatedYieldPercent] = useState(11.4);

  // Consultation form in demo
  const [consultName, setConsultName] = useState(user?.name || '');
  const [consultEmail, setConsultEmail] = useState(user?.email || '');
  const [consultPhone, setConsultPhone] = useState(user?.phone || '');
  const [consultTypology, setConsultTypology] = useState('Luxury Residential Villa');
  const [consultBudget, setConsultBudget] = useState('₹2.5 Cr - ₹4.0 Cr');
  const [consultNotes, setConsultNotes] = useState('');

  const slides = [
    {
      id: 'slide-overview',
      number: '01',
      badge: 'EXECUTIVE OVERVIEW',
      title: 'Unified Architecture & Construction Operating System',
      subtitle: 'Eliminating the 3 Black Holes of Traditional Building Management',
      content: 'overview',
    },
    {
      id: 'slide-workflow',
      number: '02',
      badge: 'HOW IT WORKS',
      title: 'The 5-Stage Digital Journey: Blueprint to Handover',
      subtitle: 'A single, transparent digital thread connecting all stakeholders',
      content: 'workflow',
    },
    {
      id: 'slide-arch-intel',
      number: '03',
      badge: 'CORE MODULE 1',
      title: 'Architectural Intelligence & Automated Drawing Audits',
      subtitle: 'Proactive clash detection and statutory compliance in seconds',
      content: 'arch_intel',
    },
    {
      id: 'slide-boq',
      number: '04',
      badge: 'CORE MODULE 2',
      title: 'Dynamic Floor-by-Floor BOQ & Financial Control',
      subtitle: 'Live CPWD Schedule of Rates and regional material price indexing',
      content: 'boq',
    },
    {
      id: 'slide-field-audit',
      number: '05',
      badge: 'CORE MODULE 3',
      title: 'Geotagged Site Inspection & Milestone Payment Escrow',
      subtitle: 'Verifiable physical progress before payment disbursement',
      content: 'field_audit',
    },
    {
      id: 'slide-marketplace',
      number: '06',
      badge: 'CORE MODULE 4',
      title: 'Verified Specialist Marketplace & Direct Tenders',
      subtitle: 'Engage Council of Architecture (CoA) certified talent with zero middlemen',
      content: 'marketplace',
    },
    {
      id: 'slide-coliving',
      number: '07',
      badge: 'CORE MODULE 5',
      title: 'Asset Yield Optimization: Co-Living, PG & Rentals',
      subtitle: 'Maximizing rental return per square foot while maintaining safety codes',
      content: 'coliving',
    },
    {
      id: 'slide-roi',
      number: '08',
      badge: 'VALUE PROPOSITION',
      title: 'Measurable Client ROI & Strategic Advantages',
      subtitle: 'Comparing traditional construction risks against the Gouse AI standard',
      content: 'roi',
    },
    {
      id: 'slide-case-study',
      number: '09',
      badge: 'CASE STUDY',
      title: 'Palm Crest Luxury Residence: 5,800 Sq.Ft Delivered',
      subtitle: 'A real-world project executed from initial concept to turnkey fit-out',
      content: 'case_study',
    },
  ];

  // Auto-advance slides when playing
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
      }, 7000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, slides.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showConsultationModal) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        setCurrentSlideIndex((prev) => (prev < slides.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : slides.length - 1));
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length, showConsultationModal, isFullscreen]);

  const handleNextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleDownloadDeckOutline = () => {
    const outlineText = `# Gouse AI Platform Demo & Executive Presentation
Document: Architecture & Construction Intelligence Platform Overview
Target Audience: Client & Real Estate Developer Executive Briefing
Presenter: Platform Demonstration Mode

## Executive Summary
Gouse AI is a unified architectural intelligence, structural auditing, and turnkey construction platform designed to eliminate cost overruns, drawing clashes, and opaque contractor billing.

## Core Features
1. Architectural Intelligence & Automated Document Auditing (IS 456 / IS 1893 compliance)
2. Dynamic Floor-by-Floor BOQ & Real-time Material Pricing
3. Geotagged Site Inspection Camera & Milestone Disbursement Escrow
4. Verified Professional Marketplace (CoA, LEED AP, MRICS)
5. Asset Yield Optimization for Co-Living, PG & Rental Portfolios

## Value Proposition
- 15-22% Direct procurement and waste elimination savings
- Zero budget overruns via live BOQ rate locks
- 60% Faster approval and revision cycles
- 10-Year Turnkey Structural & Waterproofing Warranty

For confidential consultations or full workspace onboarding, contact Ar. S. Gouse at sgouse14@gmail.com.`;

    const blob = new Blob([outlineText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Gouse_AI_Platform_Demo_Presentation.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleConsultationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setConsultationSuccess(true);
    setTimeout(() => {
      setConsultationSuccess(false);
      setShowConsultationModal(false);
      setConsultNotes('');
    }, 2400);
  };

  const currentSlide = slides[currentSlideIndex];

  return (
    <div
      className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 ${
        isFullscreen ? 'fixed inset-0 z-50 overflow-y-auto' : ''
      }`}
    >
      {/* 1. RESTRICTION / ACCESS CONTROL STATUS BANNER */}
      {isClientRestricted && (
        <div
          id="banner-client-restricted"
          className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-b border-amber-500/40 px-4 py-2.5 text-xs text-slate-300 shadow-md sticky top-0 z-40"
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 text-left">
              <span className="p-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <Shield className="w-3.5 h-3.5" />
              </span>
              <div>
                <span className="font-semibold text-white">Client Access Level Active:</span>{' '}
                <span className="text-slate-300">
                  Main platform workspace is reserved for internal architects &amp; licensed engineers. You have full authorized access to the{' '}
                  <strong className="text-amber-400">Interactive Platform Demo</strong>.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowConsultationModal(true)}
                className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm flex items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3" />
                <span>Contact Lead Architect</span>
              </button>

              <button
                type="button"
                onClick={logout}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition border border-slate-700 flex items-center gap-1"
                title="Sign out of client account"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Internal user banner (when an architect or engineer previews the demo) */}
      {!isClientRestricted && onCloseDemo && (
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 text-xs text-slate-300 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>
              <strong>Presenter Mode:</strong> You are viewing the Platform Demo Presentation as{' '}
              <span className="text-amber-400 font-mono">{user?.name || 'Architect'}</span>.
            </span>
          </div>
          <button
            type="button"
            onClick={onCloseDemo}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
          >
            <span>Exit Demo &amp; Return to Workspace</span>
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 2. DEMO PRESENTATION HEADER */}
      <header className="bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
              style={{
                backgroundColor: `rgba(${currentTheme.rgb}, 0.15)`,
                border: `1px solid rgba(${currentTheme.rgb}, 0.4)`,
                color: currentTheme.colors['400'],
              }}
            >
              <Compass className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif tracking-widest text-base font-bold text-white uppercase">
                  Gouse AI
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  PLATFORM DEMO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Interactive Architecture &amp; Construction Feature Presentation
              </p>
            </div>
          </div>

          {/* Quick Slide Navigation Pills */}
          <div className="hidden xl:flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentSlideIndex(idx)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition ${
                  currentSlideIndex === idx
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={s.title}
              >
                {s.number}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadDeckOutline}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition"
              title="Download presentation brief as markdown"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Deck Brief</span>
            </button>

            <button
              type="button"
              onClick={() => setShowConsultationModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Request Consultation</span>
            </button>

            {user && (
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800">
                <img
                  src={
                    user.avatarUrl ||
                    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&q=80'
                  }
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover border border-amber-400/60"
                />
                <div className="text-left leading-tight hidden lg:block">
                  <div className="text-xs font-semibold text-white truncate max-w-[120px]">{user.name}</div>
                  <div className="text-[10px] text-amber-400/90 font-mono capitalize">{user.role}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 3. MAIN SLIDE VIEWPORT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col justify-between">
        {/* Slide Header & Category */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                {currentSlide.badge}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                SLIDE {currentSlide.number} / {slides.length < 10 ? `0${slides.length}` : slides.length}
              </span>
            </div>

            {/* Currency selector for interactive sections */}
            {(currentSlide.content === 'boq' || currentSlide.content === 'overview' || currentSlide.content === 'roi') && (
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
                <span className="text-[11px] text-slate-400 pl-1.5 pr-1 font-mono">Currency:</span>
                {(['INR', 'USD', 'EUR', 'AED'] as CurrencyCode[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setDemoCurrency(c)}
                    className={`px-2 py-0.5 rounded-lg font-mono text-xs font-semibold transition ${
                      demoCurrency === c
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">
            {currentSlide.title}
          </h1>
          <p className="text-sm sm:text-base text-slate-400">{currentSlide.subtitle}</p>
        </div>

        {/* Dynamic Slide Body */}
        <div className="flex-1 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-sm min-h-[460px] flex flex-col justify-center">
          {/* Subtle architectural background watermark */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:20px_20px]" />

          {/* SLIDE 1: OVERVIEW */}
          {currentSlide.content === 'overview' && (
            <div className="space-y-6 relative z-10 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/40 flex items-center justify-center text-rose-400">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white">The Cost Void</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Uncontrolled contractor variation orders, uncoordinated takeoffs, and arbitrary material price escalations lead to 15%–35% budget creep.
                  </p>
                  <div className="pt-2 text-[11px] font-mono text-rose-300 font-semibold">
                    Traditional: High Financial Risk
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white">The Compliance Gap</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Siloed drawing files between architects and civil engineers lead to on-site MEP clashes, delayed municipal sanctions, and structural rework.
                  </p>
                  <div className="pt-2 text-[11px] font-mono text-amber-300 font-semibold">
                    Traditional: 3–6 Wk Revision Lag
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-sky-950/20 border border-sky-500/30 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/40 flex items-center justify-center text-sky-400">
                    <Camera className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white">The Verification Blindspot</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Property owners and investors release stage payments based on informal WhatsApp photos without verifiable structural inspections.
                  </p>
                  <div className="pt-2 text-[11px] font-mono text-sky-300 font-semibold">
                    Traditional: Unverified Cash Releases
                  </div>
                </div>
              </div>

              {/* The Gouse AI Solution Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-slate-900 to-amber-950/30 border border-emerald-500/40 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center md:text-left">
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-mono font-bold text-emerald-300 uppercase">
                      The Gouse AI Operating System
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white">
                    Guaranteed design-to-build accuracy with live BOQ synchronicity and verified milestone escrow.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleNextSlide}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shrink-0 shadow-md"
                >
                  <span>Explore 5-Step Workflow</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* SLIDE 2: WORKFLOW */}
          {currentSlide.content === 'workflow' && (
            <div className="space-y-6 relative z-10 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {[
                  {
                    step: '01',
                    title: 'Client Intake',
                    desc: 'Digital project brief, site dimensions, and preliminary budget allocation.',
                    icon: <FileText className="w-4 h-4 text-amber-400" />,
                  },
                  {
                    step: '02',
                    title: 'AI Plan Audit',
                    desc: 'Instant structural clash detection against IS 456 & NBC building codes.',
                    icon: <Building2 className="w-4 h-4 text-sky-400" />,
                  },
                  {
                    step: '03',
                    title: 'Floor-by-Floor BOQ',
                    desc: 'Automated quantity takeoffs mapped to live regional material prices.',
                    icon: <Calculator className="w-4 h-4 text-emerald-400" />,
                  },
                  {
                    step: '04',
                    title: 'Site Inspection',
                    desc: 'Geotagged site camera audits verifying actual progress before disbursement.',
                    icon: <Camera className="w-4 h-4 text-purple-400" />,
                  },
                  {
                    step: '05',
                    title: 'Turnkey Handover',
                    desc: 'Verified CoA architects and EPC builders with 10-year warranty.',
                    icon: <Award className="w-4 h-4 text-rose-400" />,
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 transition space-y-2.5 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-amber-400">{item.step}</span>
                      <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                        {item.icon}
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>

              {/* Client Value Callout */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                <div className="text-xs text-slate-300">
                  <span className="font-semibold text-amber-400">Total Client Transparency:</span> Every document, milestone sign-off, and rate revision is logged with immutable cryptographic timestamps.
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-emerald-400 font-bold">100% Audit Trail</span>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 3: ARCHITECTURAL INTELLIGENCE */}
          {currentSlide.content === 'arch_intel' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 animate-in fade-in duration-300 items-center">
              <div className="lg:col-span-6 space-y-4">
                <h3 className="text-xl font-bold text-white">Algorithmic Structural &amp; Drawing Verification</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  The platform parses AutoCAD (DWG), BIM, and structural working drawing PDFs. It cross-checks column grids, shear wall continuity, and MEP conduit pathways against national and local building codes.
                </p>

                <div className="space-y-2.5 pt-2">
                  {[
                    'IS 456 Plain and Reinforced Concrete structural compliance',
                    'IS 1893 Earthquake-resistant ductile frame engineering verification',
                    'Daylight factor, natural cross-ventilation & solar heat gain optimization',
                    'Automated floor plate efficiency & circulation core calculation',
                  ].map((check, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{check}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual Simulated Audit Terminal */}
              <div className="lg:col-span-6 p-5 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-3 shadow-inner">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>AI_DRAWING_AUDIT_ENGINE v3.8</span>
                  </span>
                  <span className="text-emerald-400 font-bold">COMPLIANCE 98.4%</span>
                </div>
                <div className="space-y-1.5 text-[11px] text-slate-300">
                  <div className="text-slate-500">// Ingested: Architectural_Working_Drawings_L1_L2.pdf</div>
                  <div className="text-emerald-400">✓ Column Grid: 5.5m x 6.5m aligned across Basement &amp; Ground Floor</div>
                  <div className="text-emerald-400">✓ Concrete Grade: M30 Design Mix specified for cantilevered pergolas</div>
                  <div className="text-emerald-400">✓ Rebar Grade: Fe550D TMT with 40mm clear cover verified</div>
                  <div className="text-amber-400">⚡ Advisory: Rainwater harvesting collection basin capacity exceeds NBC min by 22%</div>
                  <div className="text-sky-400">ℹ Fire Egress: 1.5m clear corridor satisfies commercial &amp; villa egress</div>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between text-[10px] text-slate-400">
                  <span>Engine: Gouse AI Structural Kernel</span>
                  <span className="text-amber-400 font-bold">Sanction Ready</span>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 4: BOQ & FINANCIAL CONTROL */}
          {currentSlide.content === 'boq' && (
            <div className="space-y-5 relative z-10 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-white">Floor-by-Floor Transparent Cost Engine</h3>
                  <p className="text-xs text-slate-400">
                    Switch between building levels to preview itemized structural steel, cement, masonry, and turnkey joinery.
                  </p>
                </div>

                {/* Floor filter */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
                  {[
                    { id: 'all', label: 'Whole Villa' },
                    { id: 'foundation', label: 'Substructure' },
                    { id: 'ground', label: 'Ground Floor' },
                    { id: 'level1', label: 'Level 1' },
                    { id: 'terrace', label: 'Terrace & Pool' },
                  ].map((fl) => (
                    <button
                      key={fl.id}
                      type="button"
                      onClick={() => setSelectedDemoFloor(fl.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                        selectedDemoFloor === fl.id
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {fl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sample BOQ items table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Work Package &amp; Material</th>
                      <th className="p-3">Quantity &amp; Unit</th>
                      <th className="p-3">Gouse Rate ({demoCurrency})</th>
                      <th className="p-3">Market Avg ({demoCurrency})</th>
                      <th className="p-3 text-right">Client Savings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    <tr>
                      <td className="p-3 font-semibold text-white">
                        Fe550D High-Ductility TMT Rebar (Tata Tiscon / Jindal)
                      </td>
                      <td className="p-3 font-mono">42.5 Metric Tonnes</td>
                      <td className="p-3 font-mono font-bold text-emerald-400">
                        {formatCurrency(68500 * (demoCurrency === 'INR' ? 1 : 0.012), demoCurrency)} / MT
                      </td>
                      <td className="p-3 font-mono text-slate-400">
                        {formatCurrency(76000 * (demoCurrency === 'INR' ? 1 : 0.012), demoCurrency)} / MT
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-400 text-right">
                        Save 9.8% (₹3.18L)
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white">
                        M30 Grade Ready-Mix Concrete (UltraTech RMC)
                      </td>
                      <td className="p-3 font-mono">285 m³</td>
                      <td className="p-3 font-mono font-bold text-emerald-400">
                        {formatCurrency(4650 * (demoCurrency === 'INR' ? 1 : 0.012), demoCurrency)} / m³
                      </td>
                      <td className="p-3 font-mono text-slate-400">
                        {formatCurrency(5200 * (demoCurrency === 'INR' ? 1 : 0.012), demoCurrency)} / m³
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-400 text-right">
                        Save 10.5% (₹1.56L)
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white">
                        Grade 1 Autoclaved Aerated Concrete (AAC) 200mm Blocks
                      </td>
                      <td className="p-3 font-mono">140 m³</td>
                      <td className="p-3 font-mono font-bold text-emerald-400">
                        {formatCurrency(3400 * (demoCurrency === 'INR' ? 1 : 0.012), demoCurrency)} / m³
                      </td>
                      <td className="p-3 font-mono text-slate-400">
                        {formatCurrency(3950 * (demoCurrency === 'INR' ? 1 : 0.012), demoCurrency)} / m³
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-400 text-right">
                        Save 13.9% (₹77k)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
                <div>
                  Rates anchored to <strong>CPWD Schedule of Rates 2024–2026</strong> + Wholesale Mill Allocation.
                </div>
                <div className="font-mono text-amber-400 font-bold">
                  Zero contractor markup hidden in material line items
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 5: FIELD INSPECTION & MILESTONES */}
          {currentSlide.content === 'field_audit' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 animate-in fade-in duration-300 items-center">
              <div className="lg:col-span-6 space-y-4">
                <h3 className="text-xl font-bold text-white">Verifiable Physical Progress Escrow</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Never disburse capital without mathematical and photo evidence. Field inspectors and resident engineers capture geotagged, high-definition camera audits directly from the site.
                </p>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">Current Milestone: Plinth &amp; First Slab Casting</span>
                    <span className="font-mono font-bold text-emerald-400">82% Verified</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 w-[82%]" />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Tranche: ₹48,00,000</span>
                    <span className="text-emerald-400 font-medium">18 Photo Audits Submitted</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Escrow gate prevents premature payment release until lead engineer signs off.</span>
                </div>
              </div>

              {/* Photo Simulation Box */}
              <div className="lg:col-span-6 relative rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-slate-950">
                <img
                  src="https://images.unsplash.com/photo-1541888946425-d0fbb1861564?auto=format&fit=crop&w=800&q=80"
                  alt="Construction Site Audit"
                  className="w-full h-56 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-mono text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>GPS: 12.9698° N, 77.7499° E (Whitefield BLR)</span>
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">Rebar Spacing &amp; Shuttering Verification</div>
                    <div className="text-[10px] text-slate-300">Audited by Er. Rajesh Kumar (Structural Consultant)</div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                    PASSED
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 6: MARKETPLACE */}
          {currentSlide.content === 'marketplace' && (
            <div className="space-y-5 relative z-10 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-white">Direct Tender Bidding with Certified Professionals</h3>
                  <p className="text-xs text-slate-400">
                    Eliminate broker fees. Direct procurement and quotation comparisons with Council of Architecture architects and Grade-A contractors.
                  </p>
                </div>
                <div className="text-xs font-mono text-amber-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                  CoA &amp; LEED AP Verified
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    name: 'Ar. Priya Sundaram',
                    firm: 'Studio Form & Void Architects',
                    role: 'Principal Architect (CoA CA/2018)',
                    rating: '4.95 / 5',
                    activeTenders: 'Hilltop Villa & Co-Living',
                    badge: 'Architect',
                  },
                  {
                    name: 'Vikramaditya Infrastructure',
                    firm: 'Vikramaditya EPC & Turnkey',
                    role: 'Civil EPC Contractor (Class 1 PWD)',
                    rating: '4.92 / 5',
                    activeTenders: '6-Story Commercial Shell',
                    badge: 'Builder',
                  },
                  {
                    name: 'TerraCraft Eco-Materials',
                    firm: 'TerraCraft Sustainable Hub',
                    role: 'Direct Factory Allocation (AAC & RMC)',
                    rating: '4.98 / 5',
                    activeTenders: 'Sarjapur Residential Bulk',
                    badge: 'Supplier',
                  },
                ].map((prof, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        {prof.badge}
                      </span>
                      <span className="text-xs font-mono text-emerald-400 font-bold">{prof.rating}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{prof.name}</h4>
                      <p className="text-xs text-slate-400">{prof.firm}</p>
                      <p className="text-[11px] text-slate-500 mt-1">{prof.role}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Recent RFQ Scope:</span>
                      <span className="text-slate-200 font-medium">{prof.activeTenders}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SLIDE 7: CO-LIVING & PG OPTIMIZATION */}
          {currentSlide.content === 'coliving' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 animate-in fade-in duration-300 items-center">
              <div className="lg:col-span-6 space-y-4">
                <h3 className="text-xl font-bold text-white">High-Yield Commercial &amp; Rental Layout Planning</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Maximize capitalization rates. Our spatial layout engine calculates maximum permissible unit density, shared amenity ratios, and acoustic privacy standards for PG and co-living conversions.
                </p>

                {/* Interactive Slider */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-semibold">Simulate Plot / Floorplate Area:</span>
                    <span className="font-mono font-bold text-amber-400">{simulatedAreaSqFt.toLocaleString()} sq.ft</span>
                  </div>
                  <input
                    type="range"
                    min="2000"
                    max="15000"
                    step="500"
                    value={simulatedAreaSqFt}
                    onChange={(e) => setSimulatedAreaSqFt(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs border-t border-slate-800">
                    <div className="p-2 rounded-lg bg-slate-900">
                      <div className="text-[10px] text-slate-400">Optimized Rooms</div>
                      <div className="font-mono font-bold text-white mt-0.5">
                        {Math.floor(simulatedAreaSqFt / 185)} Units
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900">
                      <div className="text-[10px] text-slate-400">Total Bed Capacity</div>
                      <div className="font-mono font-bold text-white mt-0.5">
                        {Math.floor(simulatedAreaSqFt / 95)} Beds
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900">
                      <div className="text-[10px] text-slate-400">Projected Yield</div>
                      <div className="font-mono font-bold text-emerald-400 mt-0.5">
                        {simulatedYieldPercent}% p.a.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Strategic Revenue Multiplier</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Standard residential leasing in urban IT hubs yields <strong>3.2% - 4.5%</strong>. Fully managed co-living configurations planned via Gouse AI typically generate <strong>10.5% - 13.8%</strong> net operational yield through spatial micro-zoning.
                </p>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
                  Includes fire egress clearances, common kitchen provisioning, and sub-metered energy management.
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 8: ROI & VALUE MATRIX */}
          {currentSlide.content === 'roi' && (
            <div className="space-y-5 relative z-10 animate-in fade-in duration-300">
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">Performance Metric</th>
                      <th className="p-3.5 text-rose-400">Traditional Approach</th>
                      <th className="p-3.5 text-emerald-400">Gouse AI Platform</th>
                      <th className="p-3.5 text-right">Measurable Impact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    <tr>
                      <td className="p-3.5 font-semibold text-white">Budget Overrun Risk</td>
                      <td className="p-3.5 text-slate-400">+15% to +35% unexpected variations</td>
                      <td className="p-3.5 text-emerald-300 font-semibold">Strict ±2.5% rate-locked BOQ</td>
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-400">Zero Cost Creep</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-semibold text-white">Drawing Revision Lag</td>
                      <td className="p-3.5 text-slate-400">3 to 6 weeks per architectural cycle</td>
                      <td className="p-3.5 text-emerald-300 font-semibold">Instant AI compliance check in 48 hrs</td>
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-400">60% Faster Groundbreak</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-semibold text-white">Material Sourcing Markups</td>
                      <td className="p-3.5 text-slate-400">12% to 20% contractor retail markups</td>
                      <td className="p-3.5 text-emerald-300 font-semibold">Direct mill rates for steel and RMC</td>
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-400">Save 15–22% CapEx</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-semibold text-white">Milestone Verification</td>
                      <td className="p-3.5 text-slate-400">Subjective verbal updates / photos</td>
                      <td className="p-3.5 text-emerald-300 font-semibold">Geotagged site camera escrow sign-off</td>
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-400">Zero Unverified Payouts</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-emerald-500/10 border border-amber-500/30 flex items-center justify-between">
                <div className="text-xs text-slate-300">
                  Average client savings on a ₹3.5 Crore turnkey luxury residence: <strong className="text-emerald-400 font-mono text-sm">₹42,00,000+</strong>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConsultationModal(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                >
                  Estimate Your Project
                </button>
              </div>
            </div>
          )}

          {/* SLIDE 9: CASE STUDY */}
          {currentSlide.content === 'case_study' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 animate-in fade-in duration-300 items-center">
              <div className="lg:col-span-5 space-y-3">
                <div className="text-xs font-mono text-amber-400 font-semibold uppercase">Flagship Turnkey Portfolio</div>
                <h3 className="text-2xl font-bold text-white">Palm Crest Residence</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  A 5,800 sq.ft contemporary residence featuring cantilevered canopies, bespoke Italian marble, and automated smart-home infrastructure in Bangalore.
                </p>

                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Project Value</div>
                    <div className="text-xs font-bold font-mono text-amber-400">₹3.85 Crore</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Client Timeline</div>
                    <div className="text-xs font-bold font-mono text-emerald-400">On Schedule (82%)</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 italic">
                  &ldquo;Gouse AI gave us 100% transparency. We reviewed 2D drawings, verified steel rebar tonnage against the BOQ, and released milestone funds with complete peace of mind.&rdquo;
                  <div className="mt-1 text-slate-200 not-italic font-semibold text-[11px]">
                    — Sameer Khan (Client Stakeholder, Prestige Urban Ventures)
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative min-h-[280px]">
                <img
                  src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80"
                  alt="Palm Crest Villa"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Structural Sanction &amp; Execution Verified
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowConsultationModal(true)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-lg"
                  >
                    Request Project Consultation
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. PRESENTATION CONTROLS BAR */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl backdrop-blur-md">
          {/* Left: Previous / Next & Play buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevSlide}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
              title="Previous Slide (Arrow Left)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsPlaying((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                isPlaying
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
              title="Toggle Auto-Play Slides (Spacebar)"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause Demo' : 'Auto Play'}</span>
            </button>

            <button
              type="button"
              onClick={handleNextSlide}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
              title="Next Slide (Arrow Right)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="text-xs font-mono text-slate-400 pl-2">
              Slide {currentSlide.number} of {slides.length < 10 ? `0${slides.length}` : slides.length}
            </span>
          </div>

          {/* Middle: Progress dots */}
          <div className="flex items-center gap-1.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlideIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  currentSlideIndex === idx
                    ? 'w-6 bg-amber-500'
                    : 'w-2 bg-slate-700 hover:bg-slate-600'
                }`}
                title={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Right: Fullscreen & Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFullscreen((prev) => !prev)}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Presentation'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setShowConsultationModal(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Contact Architect</span>
            </button>
          </div>
        </div>
      </main>

      {/* 5. CONSULTATION MODAL FOR CLIENTS */}
      {showConsultationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-5 relative">
            <button
              type="button"
              onClick={() => setShowConsultationModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1 text-left">
              <div className="text-xs font-mono text-amber-400 font-semibold uppercase">
                DIRECT CLIENT ADVISORY
              </div>
              <h3 className="text-xl font-bold text-white">Request Architectural Consultation</h3>
              <p className="text-xs text-slate-400">
                Connect directly with Ar. S. Gouse and our structural quantity surveyors for your property.
              </p>
            </div>

            {consultationSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Consultation Request Dispatched</h4>
                <p className="text-xs text-emerald-300">
                  Thank you, <strong>{consultName}</strong>. Our lead architectural team will review your project scope and schedule a private briefing within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleConsultationSubmit} className="space-y-3.5 text-left text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={consultName}
                    onChange={(e) => setConsultName(e.target.value)}
                    placeholder="e.g. Sameer Khan"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={consultEmail}
                      onChange={(e) => setConsultEmail(e.target.value)}
                      placeholder="e.g. sameer.khan@prestigeheights.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={consultPhone}
                      onChange={(e) => setConsultPhone(e.target.value)}
                      placeholder="+91 99001 88234"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Project Typology</label>
                    <select
                      value={consultTypology}
                      onChange={(e) => setConsultTypology(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                    >
                      <option>Luxury Residential Villa</option>
                      <option>Commercial Grade-A Office</option>
                      <option>Co-Living &amp; High-Yield PG</option>
                      <option>Bespoke Penthouse Interior</option>
                      <option>Turnkey Mixed-Use Development</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Target Budget</label>
                    <select
                      value={consultBudget}
                      onChange={(e) => setConsultBudget(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                    >
                      <option>₹1.5 Cr - ₹2.5 Cr</option>
                      <option>₹2.5 Cr - ₹4.0 Cr</option>
                      <option>₹4.0 Cr - ₹8.0 Cr</option>
                      <option>₹8.0 Cr+ (Enterprise Scale)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Project Vision / Specific Queries</label>
                  <textarea
                    rows={3}
                    value={consultNotes}
                    onChange={(e) => setConsultNotes(e.target.value)}
                    placeholder="Mention location, plot dimensions, or key architectural priorities..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowConsultationModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md transition flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Consultation Request</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
