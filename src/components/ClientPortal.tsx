import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  Shield,
  Lock,
  LogIn,
  Key,
  UserPlus,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Layers,
  FileSpreadsheet,
  Camera,
  Coins,
  Award,
  Users,
  ChevronRight,
  Send,
  Eye,
  Mail,
  Phone,
  MapPin,
  Clock,
  Briefcase,
  Star,
  Quote,
  Check,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Video,
  Sliders,
  AlertTriangle,
  ArrowLeft,
  Download,
  ExternalLink,
  HelpCircle,
  User,
  LogOut,
  TrendingUp,
  FileText,
  DollarSign,
  Maximize,
  Cpu,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { CurrencyCode, formatCurrency } from '../utils/formatters';
import { SmartHomeSkaAgent } from './SmartHomeSkaAgent';
import { AgentFloatingHUD } from './AgentFloatingHUD';
import { AgentDecisionTicker } from './AgentDecisionTicker';

interface ClientPortalProps {
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
  onOpenAgentBroker?: () => void;
  onOpenPlatformDemo?: () => void;
  isPreviewMode?: boolean;
}

export const ClientPortal: React.FC<ClientPortalProps> = ({
  isClientRestricted = false,
  onEnquirySubmitted,
  onReturnToWorkspace,
  onOpenClientDashboard,
  onOpenAgentBroker,
  onOpenPlatformDemo,
  isPreviewMode = false,
}) => {
  const { user, openLoginModal, openSignUpModal, login, logout, loginAsDemo } = useAuth();
  const { currentTheme } = useTheme();

  // Demo Presentation Mode: 'video' | 'interactive'
  const [demoMode, setDemoMode] = useState<'video' | 'interactive'>('video');
  const [activeInteractiveTab, setActiveInteractiveTab] = useState<'clash' | 'boq' | 'site_cam' | 'marketplace' | 'yield' | 'smart_home_ska'>('clash');

  // Video Demo Player State
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [videoProgress, setVideoProgress] = useState<number>(24); // 0 to 100
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isVideoFullscreen, setIsVideoFullscreen] = useState<boolean>(false);

  // Interactive Demo State
  const [demoCurrency, setDemoCurrency] = useState<CurrencyCode>('INR');
  const [selectedDemoFloor, setSelectedDemoFloor] = useState<'all' | 'foundation' | 'ground' | 'level1' | 'terrace'>('all');
  const [isAuditingDrawings, setIsAuditingDrawings] = useState<boolean>(false);
  const [auditClashResolved, setAuditClashResolved] = useState<boolean>(false);
  const [selectedCameraAngle, setSelectedCameraAngle] = useState<'entrance' | 'crane' | 'slab'>('slab');
  const [simulatedAreaSqFt, setSimulatedAreaSqFt] = useState<number>(4500);
  const [simulatedConfig, setSimulatedConfig] = useState<'luxury_villa' | 'coliving_studios' | 'commercial_office'>('luxury_villa');

  // Inline Sign In state
  const [inlineEmail, setInlineEmail] = useState('');
  const [inlinePassword, setInlinePassword] = useState('');
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [isInlineSubmitting, setIsInlineSubmitting] = useState(false);

  // Consultation Enquiry form state
  const [clientName, setClientName] = useState(user?.name || '');
  const [clientEmail, setClientEmail] = useState(user?.email || '');
  const [clientPhone, setClientPhone] = useState(user?.phone || '');
  const [clientCompany, setClientCompany] = useState(user?.company || '');
  const [projectType, setProjectType] = useState('Residential Villa / Luxury Bungalow');
  const [budgetBracket, setBudgetBracket] = useState('₹2.5 Cr - ₹5.0 Cr');
  const [projectLocation, setProjectLocation] = useState('Bangalore (Whitefield / Indiranagar / North BLR)');
  const [projectNotes, setProjectNotes] = useState('');
  const [enquirySuccessId, setEnquirySuccessId] = useState<string | null>(null);
  const [isSubmittingEnquiry, setIsSubmittingEnquiry] = useState(false);

  // Active showcase project
  const [activeShowcaseIndex, setActiveShowcaseIndex] = useState(0);

  // Video Chapters metadata
  const videoChapters = [
    {
      id: 'ch-clash',
      number: '01',
      title: 'AI Blueprint & Clash Detection',
      tag: 'BIM / CAD AUDIT',
      duration: '01:15',
      timeRange: [0, 20],
      headline: 'Automated Clash Detection in 2D & 3D Drawings',
      narration:
        'Gouse AI instantly ingests structural and architectural blueprints, checking column alignment and MEP conduit clashes against IS 456 & NBC 2016 regulations before a single bag of cement is ordered.',
      mockScreen: {
        type: 'cad_audit',
        badge: 'IS 456 Structural Audit: ACTIVE',
        detectedClashes: [
          { item: 'Beam B-104 & 100mm Plumbing Duct', severity: 'Critical', autoFix: 'Shift duct 150mm south of neutral axis' },
          { item: 'Staircase Headroom Clearance', severity: 'Compliant', autoFix: '2.15m clear (Meets NBC 2016 min 2.05m)' },
        ],
      },
    },
    {
      id: 'ch-boq',
      number: '02',
      title: 'Dynamic Floor-by-Floor BOQ',
      tag: 'COST INTELLIGENCE',
      duration: '01:30',
      timeRange: [20, 42],
      headline: 'Real-time Itemized Quantities & Rate Locking',
      narration:
        'Our dynamic BOQ engine decomposes your building floor by floor. Steel, cement, sand, masonry, and high-end Italian finishes are locked to regional supply indices, eradicating opaque contractor billing.',
      mockScreen: {
        type: 'boq_live',
        badge: 'CPWD Schedule of Rates 2026: Synchronized',
        items: [
          { name: 'Fe550D TMT Reinforcement Steel', qty: '18.4 Metric Tonnes', rate: '₹62,500/MT', total: '₹11,50,000' },
          { name: 'Ready-Mix M30 Grade Concrete', qty: '142 Cu.Meters', rate: '₹4,850/Cu.M', total: '₹6,88,700' },
          { name: 'Imported Statuario Italian Marble', qty: '2,800 Sq.Ft', rate: '₹480/Sq.Ft', total: '₹13,44,000' },
        ],
      },
    },
    {
      id: 'ch-cam',
      number: '03',
      title: '360° AI Site Camera & Escrow',
      tag: 'SITE VERIFICATION',
      duration: '01:25',
      timeRange: [42, 65],
      headline: 'Geotagged Computer Vision Milestone Audits',
      narration:
        'Clients never need to worry about unauthorized subcontractor draws. AI site cameras automatically verify slab cures, rebar spacing, and brickwork completion before milestone payments are approved.',
      mockScreen: {
        type: 'camera_feed',
        badge: 'Live Site Cam Feed • Palm Crest Villa (Bangalore)',
        timestamp: 'Today, 11:42 AM IST',
        snagCount: '0 Critical Snags',
        status: 'Milestone 3 (First Floor RCC Pour) 100% Verified',
      },
    },
    {
      id: 'ch-market',
      number: '04',
      title: 'Verified Specialist Marketplace',
      tag: 'DIRECT TENDERS',
      duration: '01:10',
      timeRange: [65, 84],
      headline: 'Direct Access to Certified Architects & Engineers',
      narration:
        'Engage Council of Architecture (CoA) registered architects, LEED accredited green consultants, and certified structural engineers with transparent peer ratings and competitive bidding.',
      mockScreen: {
        type: 'marketplace_bids',
        badge: 'Pre-Vetted Professional Network',
        specialists: [
          { name: 'Ar. Priya Sharma', role: 'Principal Architect & LEED AP', rating: 4.98, projects: 42 },
          { name: 'Er. Rajesh Kumar', role: 'Structural Engineer (M.Tech IIT)', rating: 4.95, projects: 68 },
        ],
      },
    },
    {
      id: 'ch-yield',
      number: '05',
      title: 'Asset Yield & Rental ROI',
      tag: 'CAPITAL RETURNS',
      duration: '01:05',
      timeRange: [67, 83],
      headline: 'Maximizing Real Estate Rental Yield per Sq.Ft',
      narration:
        'For property developers and luxury investors, our co-living and rental optimization tool models room layouts, dual-key partitions, and amenities to maximize projected annual yields by up to 14.8%.',
      mockScreen: {
        type: 'yield_matrix',
        badge: 'ROI Simulation Engine',
        traditionalYield: '3.8% p.a.',
        optimizedYield: '11.4% - 13.9% p.a.',
        capitalPayback: '6.8 Years (Turnkey)',
      },
    },
    {
      id: 'ch-ska',
      number: '06',
      title: 'Smart Home SKA Agent',
      tag: 'AUTONOMIC IOT & ENERGY',
      duration: '01:20',
      timeRange: [83, 100],
      headline: 'Supervisory Kontrol & Automation (SKA) IoT Orchestration',
      narration:
        'The SKA Autonomic Agent supervises 48 smart home nodes. From DALI-2 warm dimming and Daikin VRV climate to rooftop solar net-metering and cryptographic Matter smart deadbolts, your turnkey home runs seamlessly.',
      mockScreen: {
        type: 'ska_iot',
        badge: 'SKA-7 Autonomic Core: Synchronized',
        nodesOnline: 48,
        solarGen: '+7.4 kW Solar PV',
        gridStatus: 'BESCOM Net Export (+4.58 kW)',
        securityState: 'Matter Cryptographic Locked',
      },
    },
  ];

  // Video simulation loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && demoMode === 'video') {
      interval = setInterval(() => {
        setVideoProgress((prev) => {
          const next = prev + 0.5 * playbackSpeed;
          if (next >= 100) {
            return 0;
          }
          return next;
        });
      }, 150);
    }
    return () => clearInterval(interval);
  }, [isPlaying, demoMode, playbackSpeed]);

  // Sync active chapter with video progress
  useEffect(() => {
    const chapterIdx = videoChapters.findIndex(
      (c) => videoProgress >= c.timeRange[0] && videoProgress < c.timeRange[1]
    );
    if (chapterIdx !== -1 && chapterIdx !== activeChapterIndex) {
      setActiveChapterIndex(chapterIdx);
    }
  }, [videoProgress, videoChapters, activeChapterIndex]);

  const currentChapter = videoChapters[activeChapterIndex] || videoChapters[0];

  const handleSeekChapter = (index: number) => {
    setActiveChapterIndex(index);
    setVideoProgress(videoChapters[index].timeRange[0] + 1);
  };

  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineError(null);
    setIsInlineSubmitting(true);
    try {
      const res = await login(inlineEmail, inlinePassword);
      if (!res.success) {
        setInlineError(res.error || 'Authentication failed. Please verify credentials.');
      }
    } catch {
      setInlineError('An unexpected error occurred. Please try again.');
    } finally {
      setIsInlineSubmitting(false);
    }
  };

  const handleConsultationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientEmail.trim()) {
      return;
    }
    setIsSubmittingEnquiry(true);

    setTimeout(() => {
      const refId = `GAI-ENQ-${Math.floor(1000 + Math.random() * 9000)}`;
      setEnquirySuccessId(refId);
      setIsSubmittingEnquiry(false);

      if (onEnquirySubmitted) {
        onEnquirySubmitted({
          clientName,
          clientEmail,
          clientPhone,
          projectType,
          location: projectLocation,
          budget: budgetBracket,
          notes: projectNotes,
        });
      }
    }, 600);
  };

  const handleDownloadDemoBrief = () => {
    const content = `# Gouse AI Architectural & Construction Intelligence Platform
Executive Platform Demo & System Capabilities Brief
Prepared for: Client & Property Developer Briefing
Platform: Outside Main Platform Portal Access Mode

## 1. System Overview & Architecture
Gouse AI is a unified building intelligence platform that combines:
- AI-Powered Blueprint & BIM Clash Detection (IS 456, IS 1893, NBC 2016)
- Dynamic Floor-by-Floor BOQ with Live CPWD Schedule of Rates
- 360° AI Site Camera Milestone Inspections & Escrow Verification
- Verified Professional Marketplace (Council of Architecture Registered)
- Asset Yield & Co-Living Optimization Simulator

## 2. Measurable Client ROI
- 15-22% Direct Procurement Savings via indexed material purchasing
- Zero Unexpected Change Orders: Clashes caught digitally in seconds
- 48-Hour Conceptual Turnaround for initial architectural schematics
- 10-Year Turnkey Warranty on waterproofing, structural integrity, and finishes

## 3. Client Access Control & Security Governance
- The Client Portal is isolated outside the internal studio workspace to ensure complete confidentiality of working architectural drafts.
- Clients receive milestone approval access, live camera verification feeds, and real-time financial tracking.

For inquiries or project bookings, contact Principal Architect Ar. S. Gouse at sgouse14@gmail.com.`;

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Gouse_AI_Client_Platform_Demo_Brief.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Sample client showcase portfolio
  const showcaseProjects = [
    {
      id: 'showcase-1',
      title: 'Palm Crest Luxury Residence & Estate',
      category: 'Turnkey Luxury Villa & Architecture',
      location: 'Whitefield / Outer Ring Road, Bangalore',
      area: '5,800 sq.ft (G+2 Luxury Villa)',
      budget: '₹3,85,00,000',
      status: 'Under Execution (82% Completed)',
      statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      highlights: [
        'Open-plan Italian Statuario marble double-height atrium',
        'Fe550D TMT earthquake-resistant RCC frame with M30 concrete',
        'Full solar pergolas, rainwater harvesting (35,000 L reservoir)',
        'Comprehensive CPWD Schedule of Rates itemized BOQ',
      ],
      clientLead: 'Sameer Khan (Prestige Urban Ventures)',
      architectLead: 'Ar. S. Gouse (Principal)',
    },
    {
      id: 'showcase-2',
      title: 'Prestige Skyward Penthouse & Skydeck',
      category: 'Bespoke Interior Architecture & BIM',
      location: '100 Feet Road, Indiranagar, Bangalore',
      area: '3,400 sq.ft (Panoramic Penthouse)',
      budget: '₹2,40,00,000',
      status: 'Concept & Structural Approved',
      statusColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
      highlights: [
        'Acoustic fluted walnut paneling and indirect warm cove LEDs',
        'Motorized low-E German double-glazed curtain wall systems',
        'Custom brass and quartz kitchen island with smart automation',
        '10-year turnkey waterproofing warranty for private terrace pool',
      ],
      clientLead: 'Dr. Z. Alvi & Family',
      architectLead: 'Ar. Priya Sharma (Studio Vellum)',
    },
    {
      id: 'showcase-3',
      title: 'Brigade Signature Tech Studio & Co-Living',
      category: 'Commercial Co-Living & High-Yield Asset',
      location: 'Electronic City Phase 1, Bangalore',
      area: '12,500 sq.ft (G+4 High Density)',
      budget: '₹6,75,00,000',
      status: 'Tender & Procurement Phase',
      statusColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
      highlights: [
        'Modular private studio apartments with dual-key layouts',
        'Projected 12.8% annual net rental yield with smart IoT submetering',
        'Central HVAC heat-pump recovery and greywater recycling',
        'Fire clearance NOC and NBC 2016 verified stair cores',
      ],
      clientLead: 'Nexus Capital Assets',
      architectLead: 'Er. Rajesh Kumar & Ar. Gouse',
    },
  ];

  // How It Works Steps
  const howItWorksSteps = [
    {
      step: '01',
      title: 'Intelligent Project Intake & BIM Ingestion',
      desc: 'Upload 2D CAD drawings, architectural sketches, or brief parameters. The engine parses boundary limits, setbacks, and FSI automatically.',
      icon: <Layers className="w-5 h-5 text-amber-400" />,
      benefit: '48-hour turnarounds on initial design configurations.',
    },
    {
      step: '02',
      title: 'Automated AI Clash & Code Compliance Audit',
      desc: 'Our proprietary rule engine audits drawings against IS 456, IS 1893 seismic zoning, and NBC 2016 safety requirements, highlighting conflicts in seconds.',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
      benefit: 'Eliminates structural re-work and costly on-site demolition.',
    },
    {
      step: '03',
      title: 'Dynamic Floor-by-Floor BOQ & Price Locking',
      desc: 'Concrete, steel, masonry, electrical, and finishing materials are itemized by floor with live CPWD regional supply indices and transparent labor rates.',
      icon: <FileSpreadsheet className="w-5 h-5 text-cyan-400" />,
      benefit: 'Zero unexpected cost overruns or opaque contractor markups.',
    },
    {
      step: '04',
      title: 'Geotagged Site Camera & Milestone Verification',
      desc: 'Physical construction progress is inspected via 360° AI site cameras. Payments are released from milestone escrow only after visual engineering sign-off.',
      icon: <Camera className="w-5 h-5 text-indigo-400" />,
      benefit: 'Total client peace of mind with verifiable physical proof.',
    },
    {
      step: '05',
      title: 'Turnkey Handover & As-Built Digital Twin',
      desc: 'Receive complete as-built documentation, structural certificates, MEP warranties, and maintenance schedules in a permanent client archive.',
      icon: <Award className="w-5 h-5 text-rose-400" />,
      benefit: 'Long-term asset value enhancement and smooth tenant operations.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* 1. TOP ACCESS CONTROL & GOVERNANCE BANNER */}
      <div
        id="banner-client-portal-governance"
        className="bg-gradient-to-r from-slate-900 via-amber-950/70 to-slate-900 border-b border-amber-500/40 px-4 py-2.5 text-xs text-slate-300 shadow-md sticky top-0 z-50 backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 text-left">
            <span className="p-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <Lock className="w-3.5 h-3.5" />
            </span>
            <span>
              <strong className="text-white">Outside Platform Login Area:</strong> Client Portal, Dashboard &amp; Gouse AI Agent Broker are accessible outside the main studio.{' '}
              <span className="hidden md:inline text-slate-400">
                Internal architectural drafting studio &amp; CAD workspace is restricted to certified staff.
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenClientDashboard && (
              <button
                type="button"
                id="btn-banner-client-dashboard"
                onClick={onOpenClientDashboard}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 font-bold text-xs transition shadow-sm"
                title="Open Dashboard outside the platform"
              >
                <Users className="w-3.5 h-3.5 text-sky-400" />
                <span>Dashboard</span>
              </button>
            )}

            {isPreviewMode && onReturnToWorkspace && (
              <button
                type="button"
                onClick={onReturnToWorkspace}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Internal Studio</span>
              </button>
            )}

            {user?.role === 'client' && (
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-[11px]">
                  Logged in: {user.name} (Client)
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-white text-xs font-semibold transition"
                >
                  <LogOut className="w-3 h-3 text-rose-400" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}

            {!user && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={openLoginModal}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm"
                >
                  <LogIn className="w-3 h-3" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={openSignUpModal}
                  className="hidden sm:flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                >
                  <UserPlus className="w-3 h-3 text-amber-400" />
                  <span>Register</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Real-Time Autonomous Agent Execution & Decisions Ticker */}
      <AgentDecisionTicker />

      {/* 2. MAIN HEADER NAVIGATION BAR */}
      <header className="bg-slate-950/90 border-b border-slate-800 backdrop-blur-md sticky top-10 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-300/40">
              <Compass className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-white text-base sm:text-lg">
                  GOUSE <span className="text-amber-400">AI</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold tracking-wider bg-slate-800 border border-slate-700 text-amber-300">
                  CLIENT PORTAL
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-tight hidden sm:block">
                Architectural Intelligence • Turnkey Construction Oversight
              </p>
            </div>
          </div>

          {/* Quick Anchor Navigation */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-400">
            {onOpenClientDashboard && (
              <button
                type="button"
                id="nav-link-client-dashboard"
                onClick={onOpenClientDashboard}
                className="hover:text-sky-300 transition flex items-center gap-1.5 text-sky-400 font-bold"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>
            )}
            <a href="#platform-demo" className="hover:text-amber-400 transition flex items-center gap-1.5 text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Platform Demo</span>
            </a>
            <a href="#how-it-works" className="hover:text-white transition">How It Works</a>
            <a href="#key-features" className="hover:text-white transition">Key Features</a>
            <a href="#client-showcase" className="hover:text-white transition">Portfolio Showcase</a>
            <a href="#client-consultation" className="hover:text-white transition">Request Consultation</a>
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {onOpenClientDashboard && (
              <button
                type="button"
                onClick={onOpenClientDashboard}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 font-bold text-xs transition"
              >
                <Users className="w-3.5 h-3.5 text-sky-400" />
                <span>Dashboard</span>
              </button>
            )}
            <a
              href="#platform-demo"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold text-xs transition"
            >
              <Video className="w-3.5 h-3.5 text-amber-400" />
              <span>Watch Demo</span>
            </a>

            {!user ? (
              <button
                type="button"
                onClick={openLoginModal}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md shadow-amber-500/20"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadDemoBrief}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition"
                  title="Download Platform Brief"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Deck Brief</span>
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-white font-bold text-xs transition"
                  title="Sign out of client session"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 3. LOGGED-IN CLIENT PERSONAL DASHBOARD SNIPPET (Shown if user.role === 'client') */}
      {user?.role === 'client' && (
        <section className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-amber-500/30 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-lg font-mono">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-white">{user.name}</h2>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        Client Investor
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{user.company || 'Prestige Urban Ventures Pvt Ltd'} • {user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onOpenAgentBroker && (
                    <button
                      type="button"
                      onClick={onOpenAgentBroker}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition"
                    >
                      <Key className="w-3 h-3 text-amber-400" />
                      <span>Gouse AI Agent Broker</span>
                    </button>
                  )}
                  <a
                    href="#platform-demo"
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm"
                  >
                    <Play className="w-3 h-3 fill-slate-950" />
                    <span>View Platform Demo</span>
                  </a>
                  <a
                    href="#client-consultation"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                  >
                    <Send className="w-3 h-3 text-amber-400" />
                    <span>Message Architect</span>
                  </a>
                </div>
              </div>

              {/* Active Client Project Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-[11px] text-slate-400 uppercase font-mono tracking-wider">Active Estate Project</div>
                  <div className="text-sm font-bold text-white mt-0.5">Palm Crest Luxury Villa (G+2)</div>
                  <div className="text-[11px] text-slate-400 mt-1">Location: Whitefield, Bangalore</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="flex justify-between items-center text-[11px] text-slate-400">
                    <span className="uppercase font-mono tracking-wider">Execution Progress</span>
                    <span className="font-mono font-bold text-emerald-400">82% Verified</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-500 to-emerald-400 h-2 rounded-full" style={{ width: '82%' }} />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1.5">Next Milestone: Second Floor RCC Slab Pour</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] text-slate-400 uppercase font-mono tracking-wider">Access Scope Notice</div>
                    <div className="text-slate-300 text-[11px] mt-0.5">
                      Client Portal Mode active. You have full access to view demos, milestone reports, and project estimates.
                    </div>
                  </div>
                  <div className="text-[10px] text-amber-400/90 font-mono mt-1">
                    Main internal studio locked to certified architects.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. HERO SECTION */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden border-b border-slate-800/80">
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs text-slate-300 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-amber-400 font-semibold">CLIENT PORTAL ACCESS GATEWAY</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">IS 456 Seismic &amp; NBC 2016 Compliant</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.12]">
              Architectural Intelligence &amp; Construction Oversight,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">
                Tailored for Clients.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-light">
              Explore how the Gouse AI platform operates without needing access to the raw internal engineering workspace. Review our full video and interactive walkthrough, test key features, inspect project milestones, and discover how we eliminate cost overruns.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 flex-wrap">
              {onOpenAgentBroker && (
                <button
                  type="button"
                  id="btn-hero-agent-broker"
                  onClick={onOpenAgentBroker}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-to-r from-amber-500/25 to-indigo-500/25 hover:from-amber-500/35 hover:to-indigo-500/35 text-amber-300 border border-amber-500/50 font-bold text-sm transition shadow-lg shadow-amber-500/10"
                >
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>Gouse AI Agent Broker (PG &amp; Rent House)</span>
                </button>
              )}

              <a
                href="#platform-demo"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-amber-500/20 group"
              >
                <Video className="w-4 h-4 text-slate-950" />
                <span>Launch Platform Demo</span>
                <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition" />
              </a>

              <a
                href="#how-it-works"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-700/80 font-semibold text-sm transition hover:border-amber-500/50"
              >
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Explore How It Works</span>
              </a>

              <a
                href="#client-consultation"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-800 text-sm font-medium transition"
              >
                <Send className="w-3.5 h-3.5 text-amber-400" />
                <span>Request Consultation</span>
              </a>
            </div>

            {/* Quick Metrics Bar */}
            <div className="pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center max-w-3xl mx-auto">
              <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80">
                <div className="text-xl sm:text-2xl font-bold font-mono text-white">100%</div>
                <div className="text-[11px] text-slate-400 mt-0.5">BOQ Rate Transparency</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80">
                <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400">48 hrs</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Concept Turnaround</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80">
                <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">0%</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Surprise Change-Orders</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80">
                <div className="text-xl sm:text-2xl font-bold font-mono text-white">10-Yr</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Turnkey Warranty</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CORE FEATURE: INTERACTIVE OR VIDEO PLATFORM DEMO */}
      <section id="platform-demo" className="py-16 md:py-24 border-b border-slate-800/80 bg-slate-900/40 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Section Header with Demo Mode Switcher */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-mono text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>COMPLETE SYSTEM OVERVIEW DEMO</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
                How the Platform Works &amp; Key Features
              </h2>
              <p className="text-sm text-slate-400">
                Experience how Gouse AI connects architectural blueprints, automated clash auditing, dynamic multi-floor BOQ estimation, live site camera audits, and certified contractor tenders.
              </p>
            </div>

            {/* Mode Switcher Toggle */}
            <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner">
              <button
                type="button"
                onClick={() => setDemoMode('video')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  demoMode === 'video'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Simulated Video Demo</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoMode('interactive')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  demoMode === 'interactive'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Hands-On Interactive Demo</span>
              </button>
            </div>
          </div>

          {/* ========================================================== */}
          {/* OPTION A: SIMULATED VIDEO PLATFORM DEMO                    */}
          {/* ========================================================== */}
          {demoMode === 'video' && (
            <div className="rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl space-y-0">
              {/* Video Player Top Bar */}
              <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="font-mono text-slate-400 text-xs ml-2">Gouse AI 2026 Executive Walkthrough</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[10px]">
                    1080p 60FPS High-Definition Simulation
                  </span>
                  <button
                    type="button"
                    onClick={handleDownloadDemoBrief}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-amber-400 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Presentation Brief</span>
                  </button>
                </div>
              </div>

              {/* Video Canvas Simulation Viewport */}
              <div className="relative min-h-[380px] sm:min-h-[460px] bg-slate-950 p-6 flex flex-col justify-between overflow-hidden">
                {/* Background Blueprint Grid Grid */}
                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#38bdf8_1px,transparent_1px),linear-gradient(to_bottom,#38bdf8_1px,transparent_1px)] bg-[size:32px_32px]" />

                {/* Top overlay: Active Chapter Header */}
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono text-[11px] font-bold">
                        CHAPTER {currentChapter.number} • {currentChapter.tag}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{currentChapter.duration}</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {currentChapter.headline}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">
                      Step {activeChapterIndex + 1} of {videoChapters.length}
                    </span>
                  </div>
                </div>

                {/* Central Display: High-Fidelity Animated Simulation Screen */}
                <div className="relative z-10 py-6 my-auto">
                  {currentChapter.id === 'ch-clash' && (
                    <div className="p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/40 shadow-xl max-w-3xl mx-auto space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <div className="flex items-center gap-2 text-xs font-mono text-cyan-300">
                          <Layers className="w-4 h-4 text-cyan-400 animate-pulse" />
                          <span>AI CAD &amp; Structural BIM Auditor</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          IS 456 / IS 1893 Zone III Passed
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                          <div className="text-[11px] font-mono text-amber-400 font-semibold flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            <span>Potential Clash Detected</span>
                          </div>
                          <div className="text-xs text-slate-200 font-bold">Beam B-104 &amp; 100mm Plumbing Shaft</div>
                          <div className="text-[11px] text-slate-400">
                            Automated AI Fix: Shift pipe centerline 150mm south of neutral axis to avoid structural tensile zone.
                          </div>
                          <span className="inline-block text-[10px] font-mono text-emerald-400">
                            Auto-Resolved in 3.2s
                          </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                          <div className="text-[11px] font-mono text-emerald-400 font-semibold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Statutory Fire &amp; Setback Verification</span>
                          </div>
                          <div className="text-xs text-slate-200 font-bold">Front Setback: 3.55m (Req: 3.00m)</div>
                          <div className="text-[11px] text-slate-400">
                            Clearances comply with BBMP Master Plan 2031 &amp; National Building Code 2016 Part 4.
                          </div>
                          <span className="inline-block text-[10px] font-mono text-slate-400">
                            Zero Demolition Risk
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentChapter.id === 'ch-boq' && (
                    <div className="p-5 rounded-2xl bg-slate-900/90 border border-amber-500/40 shadow-xl max-w-3xl mx-auto space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <div className="flex items-center gap-2 text-xs font-mono text-amber-300">
                          <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                          <span>Multi-Floor Dynamic BOQ Engine (Bangalore Zonal Rates)</span>
                        </div>
                        <span className="text-xs font-mono text-emerald-400 font-bold">Total: ₹3,85,00,000</span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-800 text-[11px] text-slate-400 font-mono">
                              <th className="pb-2">Material / Trade Item</th>
                              <th className="pb-2">Specification</th>
                              <th className="pb-2">Rate Lock</th>
                              <th className="pb-2 text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 text-slate-300 font-mono text-[11px]">
                            <tr>
                              <td className="py-2 text-white font-medium">Fe550D TMT Rebar</td>
                              <td className="py-2 text-slate-400">18.4 MT (Earthquake Grade)</td>
                              <td className="py-2 text-amber-400">₹62,500 / MT</td>
                              <td className="py-2 text-right text-white">₹11,50,000</td>
                            </tr>
                            <tr>
                              <td className="py-2 text-white font-medium">M30 Ready-Mix Concrete</td>
                              <td className="py-2 text-slate-400">142 Cu.M (Slab &amp; Beams)</td>
                              <td className="py-2 text-amber-400">₹4,850 / Cu.M</td>
                              <td className="py-2 text-right text-white">₹6,88,700</td>
                            </tr>
                            <tr>
                              <td className="py-2 text-white font-medium">Italian Statuario Marble</td>
                              <td className="py-2 text-slate-400">2,800 Sq.Ft (Lobby &amp; Atrium)</td>
                              <td className="py-2 text-amber-400">₹480 / Sq.Ft</td>
                              <td className="py-2 text-right text-white">₹13,44,000</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {currentChapter.id === 'ch-cam' && (
                    <div className="p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/40 shadow-xl max-w-3xl mx-auto space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <div className="flex items-center gap-2 text-xs font-mono text-emerald-300">
                          <Camera className="w-4 h-4 text-emerald-400 animate-pulse" />
                          <span>AI Site Inspection Camera Feed (Camera 02: Second Floor RCC Pour)</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Live Timestamp: Today 11:42 AM
                        </span>
                      </div>

                      <div className="relative h-44 rounded-xl overflow-hidden border border-slate-800">
                        <img
                          src="https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?auto=format&fit=crop&w=1000&q=80"
                          alt="Live Site Feed"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/40" />
                        <div className="absolute top-2 left-3 text-[10px] font-mono text-emerald-400 flex items-center gap-1.5 bg-black/60 px-2 py-0.5 rounded">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          <span>FEED ACTIVE: 4K 60FPS HDR</span>
                        </div>
                        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-xs text-white">
                          <span className="font-semibold">Milestone 03: Rebar Binding &amp; Shuttering Inspection</span>
                          <span className="font-mono text-emerald-400 font-bold bg-slate-900/80 px-2 py-0.5 rounded border border-emerald-500/40">
                            Approved by Structural Auditor
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentChapter.id === 'ch-market' && (
                    <div className="p-5 rounded-2xl bg-slate-900/90 border border-indigo-500/40 shadow-xl max-w-3xl mx-auto space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <div className="flex items-center gap-2 text-xs font-mono text-indigo-300">
                          <Users className="w-4 h-4 text-indigo-400" />
                          <span>Direct Specialist Tender &amp; Verified Talent Directory</span>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">Council of Architecture Verified</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                          <img
                            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80"
                            alt="Ar. Priya Sharma"
                            className="w-10 h-10 rounded-xl object-cover"
                          />
                          <div>
                            <div className="text-xs font-bold text-white">Ar. Priya Sharma</div>
                            <div className="text-[10px] text-amber-400 font-mono">CoA Reg: CA/2016/78210 • LEED AP</div>
                            <div className="text-[10px] text-slate-400">42 Projects • 4.98 ★ Client Rating</div>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                          <img
                            src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80"
                            alt="Er. Rajesh Kumar"
                            className="w-10 h-10 rounded-xl object-cover"
                          />
                          <div>
                            <div className="text-xs font-bold text-white">Er. Rajesh Kumar</div>
                            <div className="text-[10px] text-cyan-400 font-mono">Structural Specialist (IIT M.Tech)</div>
                            <div className="text-[10px] text-slate-400">68 High-Rise Audits • 4.95 ★ Rating</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentChapter.id === 'ch-yield' && (
                    <div className="p-5 rounded-2xl bg-slate-900/90 border border-rose-500/40 shadow-xl max-w-3xl mx-auto space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <div className="flex items-center gap-2 text-xs font-mono text-rose-300">
                          <TrendingUp className="w-4 h-4 text-rose-400" />
                          <span>Real Estate Asset Yield &amp; Co-Living Optimization</span>
                        </div>
                        <span className="text-xs font-mono text-emerald-400 font-bold">+11.4% Net Annual Yield</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                          <div className="text-[11px] text-slate-400">Traditional Rental Yield</div>
                          <div className="text-base font-bold font-mono text-slate-400 mt-1">3.2% - 4.1%</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">Single Tenant Leases</div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/40">
                          <div className="text-[11px] text-emerald-400 font-semibold">Gouse AI Optimized Yield</div>
                          <div className="text-base font-bold font-mono text-emerald-400 mt-1">11.4% - 14.8%</div>
                          <div className="text-[10px] text-emerald-300/80 mt-0.5">Dual-Key &amp; Co-Living</div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                          <div className="text-[11px] text-slate-400">Capital Amortization</div>
                          <div className="text-base font-bold font-mono text-white mt-1">6.8 Years</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">Turnkey ROI Period</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentChapter.id === 'ch-ska' && (
                    <div className="p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/40 shadow-xl max-w-3xl mx-auto space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <div className="flex items-center gap-2 text-xs font-mono text-cyan-300">
                          <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
                          <span>Smart Home SKA Autonomic Core (Matter &amp; KNX Telemetry)</span>
                        </div>
                        <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                          48 Nodes Synchronized • 0ms Latency
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                          <div className="text-[10px] font-mono text-amber-400">Rooftop Solar PV</div>
                          <div className="text-base font-bold font-mono text-white mt-1">+7.4 kW</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">Mono-PERC Array</div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                          <div className="text-[10px] font-mono text-sky-400">Active Load</div>
                          <div className="text-base font-bold font-mono text-white mt-1">2.82 kW</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">Daikin VRV Inverter</div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/40">
                          <div className="text-[10px] font-mono text-emerald-400 font-semibold">Net BESCOM Export</div>
                          <div className="text-base font-bold font-mono text-emerald-400 mt-1">+4.58 kW</div>
                          <div className="text-[10px] text-emerald-300/80 mt-0.5">Green Energy Credits</div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/40">
                          <div className="text-[10px] font-mono text-cyan-300">SKA Smart Lock</div>
                          <div className="text-base font-bold font-mono text-white mt-1">Armed</div>
                          <div className="text-[10px] text-cyan-400 mt-0.5">Matter Cryptographic</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Subtitles & Presenter Narration Box */}
                <div className="relative z-10 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
                  <div className="p-1 rounded bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-white">System Voiceover Narration: </span>
                    <span className="text-slate-300 font-light">{currentChapter.narration}</span>
                  </div>
                </div>

                {/* Video Player Scrubber & Controls */}
                <div className="relative z-10 pt-4 space-y-3">
                  {/* Scrubber Bar */}
                  <div className="space-y-1">
                    <div
                      className="w-full bg-slate-800 h-2 rounded-full cursor-pointer relative overflow-hidden group"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        const pct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
                        setVideoProgress(pct);
                      }}
                    >
                      <div
                        className="bg-gradient-to-r from-amber-500 to-amber-300 h-2 rounded-full transition-all duration-150"
                        style={{ width: `${videoProgress}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>0{Math.floor((videoProgress / 100) * 6)}:{(Math.floor((videoProgress / 100) * 360) % 60).toString().padStart(2, '0')}</span>
                      <span>06:00 (Full System Overview)</span>
                    </div>
                  </div>

                  {/* Playback Controls & Chapter Pills */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-sm"
                        title={isPlaying ? 'Pause Demo' : 'Play Demo'}
                      >
                        {isPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setVideoProgress(0)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="Restart from beginning"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      </button>

                      {/* Speed selector */}
                      <button
                        type="button"
                        onClick={() => setPlaybackSpeed((prev) => (prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1))}
                        className="px-2 py-1 rounded-lg bg-slate-800 text-[10px] font-mono text-amber-400 hover:bg-slate-700 transition"
                      >
                        {playbackSpeed}x
                      </button>
                    </div>

                    {/* Chapter Jump Buttons */}
                    <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                      {videoChapters.map((ch, idx) => (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => handleSeekChapter(idx)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition shrink-0 ${
                            activeChapterIndex === idx
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          {ch.number}. {ch.title.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* OPTION B: HANDS-ON INTERACTIVE DEMO MODE                   */}
          {/* ========================================================== */}
          {demoMode === 'interactive' && (
            <div className="rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6">
              {/* Interactive Module Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveInteractiveTab('clash')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                    activeInteractiveTab === 'clash'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>1. AI Blueprint Clash Engine</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveInteractiveTab('boq')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                    activeInteractiveTab === 'boq'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>2. Dynamic BOQ Calculator</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveInteractiveTab('site_cam')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                    activeInteractiveTab === 'site_cam'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>3. 360° AI Site Camera</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveInteractiveTab('marketplace')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                    activeInteractiveTab === 'marketplace'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>4. Certified Marketplace</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveInteractiveTab('yield')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                    activeInteractiveTab === 'yield'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>5. Asset Yield Simulator</span>
                </button>

                <button
                  type="button"
                  id="tab-interactive-smart-home-ska"
                  onClick={() => setActiveInteractiveTab('smart_home_ska')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                    activeInteractiveTab === 'smart_home_ska'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-md shadow-cyan-500/25 ring-2 ring-cyan-400'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>6. Smart Home SKA Agent</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                    activeInteractiveTab === 'smart_home_ska' ? 'bg-black/30 text-cyan-200' : 'bg-cyan-500/20 text-cyan-300'
                  }`}>
                    SKA IoT
                  </span>
                </button>
              </div>

              {/* Tab 1: AI Clash Engine */}
              {activeInteractiveTab === 'clash' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-lg font-bold text-white">Interactive Architectural Clash &amp; Structural Audit</h4>
                      <p className="text-xs text-slate-400">
                        Simulate how Gouse AI detects geometry collisions before casting concrete.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsAuditingDrawings(true);
                        setTimeout(() => {
                          setIsAuditingDrawings(false);
                          setAuditClashResolved(true);
                        }, 1200);
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isAuditingDrawings ? 'Analyzing Blueprint...' : 'Run Simulated Clash Audit'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-amber-400">Detected Collision #01</span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Critical Conflict
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-white">
                        Structural Beam B-104 clashes with 100mm Sanitary Core
                      </div>
                      <p className="text-xs text-slate-400">
                        Sanitary piping passes through high-shear sector of the primary support girder, violating IS 456 Clause 26.5.
                      </p>
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-400 flex items-center justify-between">
                        <span>Status: {auditClashResolved ? 'Auto-Shifted 150mm South (Resolved)' : 'Pending Resolution'}</span>
                        {auditClashResolved && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-emerald-400">Compliance Check #02</span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          NBC 2016 Verified
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-white">
                        Fire Escape Staircase &amp; Natural Ventilation
                      </div>
                      <p className="text-xs text-slate-400">
                        1,500mm clear flight width and 2,150mm landing headroom pass all statutory safety mandates.
                      </p>
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                        No revisions needed. Structural sign-off confirmed.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Dynamic BOQ Calculator */}
              {activeInteractiveTab === 'boq' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-lg font-bold text-white">Floor-by-Floor Dynamic Cost &amp; BOQ Model</h4>
                      <p className="text-xs text-slate-400">
                        Test live currency switching and itemized rate locks across floors.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-mono">Currency:</span>
                      {(['INR', 'USD', 'EUR', 'AED'] as CurrencyCode[]).map((cur) => (
                        <button
                          key={cur}
                          type="button"
                          onClick={() => setDemoCurrency(cur)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition ${
                            demoCurrency === cur
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          {cur}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Floor filter buttons */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
                    {[
                      { id: 'all', label: 'All Floors (G+2)' },
                      { id: 'foundation', label: 'Foundation & Footing' },
                      { id: 'ground', label: 'Ground Floor RCC' },
                      { id: 'level1', label: 'First Floor & Terraces' },
                    ].map((fl) => (
                      <button
                        key={fl.id}
                        type="button"
                        onClick={() => setSelectedDemoFloor(fl.id as any)}
                        className={`px-3 py-1.5 rounded-lg transition shrink-0 ${
                          selectedDemoFloor === fl.id
                            ? 'bg-slate-800 text-amber-400 border border-amber-500/40'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {fl.label}
                      </button>
                    ))}
                  </div>

                  {/* BOQ Items Simulation Table */}
                  <div className="overflow-x-auto rounded-2xl bg-slate-900 border border-slate-800 p-4">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                          <th className="pb-2">Material / Scope</th>
                          <th className="pb-2">Quantity</th>
                          <th className="pb-2">Unit Rate</th>
                          <th className="pb-2 text-right">Computed Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300 text-[11px]">
                        <tr>
                          <td className="py-2.5 text-white font-medium">Primary RCC Column M30 Concrete</td>
                          <td className="py-2.5 text-slate-400">142 Cu.M</td>
                          <td className="py-2.5 text-amber-400">{formatCurrency(4850, demoCurrency)} / Cu.M</td>
                          <td className="py-2.5 text-right text-white font-bold">{formatCurrency(688700, demoCurrency)}</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 text-white font-medium">Fe550D TMT Reinforcement Steel</td>
                          <td className="py-2.5 text-slate-400">18.4 MT</td>
                          <td className="py-2.5 text-amber-400">{formatCurrency(62500, demoCurrency)} / MT</td>
                          <td className="py-2.5 text-right text-white font-bold">{formatCurrency(1150000, demoCurrency)}</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 text-white font-medium">Wire-cut Clay Brickwork 230mm</td>
                          <td className="py-2.5 text-slate-400">4,200 Sq.Ft</td>
                          <td className="py-2.5 text-amber-400">{formatCurrency(145, demoCurrency)} / Sq.Ft</td>
                          <td className="py-2.5 text-right text-white font-bold">{formatCurrency(609000, demoCurrency)}</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 text-white font-medium">Italian Statuario Flooring &amp; Dado</td>
                          <td className="py-2.5 text-slate-400">2,800 Sq.Ft</td>
                          <td className="py-2.5 text-amber-400">{formatCurrency(480, demoCurrency)} / Sq.Ft</td>
                          <td className="py-2.5 text-right text-white font-bold">{formatCurrency(1344000, demoCurrency)}</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
                      <span className="text-slate-400">Estimated Project Total ({demoCurrency}):</span>
                      <span className="text-base font-bold font-mono text-emerald-400">{formatCurrency(38500000, demoCurrency)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Site Inspection Camera */}
              {activeInteractiveTab === 'site_cam' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-lg font-bold text-white">Live Site Camera &amp; Milestone Escrow Audit</h4>
                      <p className="text-xs text-slate-400">
                        Switch between site angles and test automated physical progress verification.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {(['entrance', 'crane', 'slab'] as const).map((angle) => (
                        <button
                          key={angle}
                          type="button"
                          onClick={() => setSelectedCameraAngle(angle)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono capitalize transition ${
                            selectedCameraAngle === angle
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          {angle === 'entrance' ? 'Gate Cam' : angle === 'crane' ? 'Crane 360°' : 'Slab Pour Cam'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden border border-slate-800">
                    <img
                      src={
                        selectedCameraAngle === 'entrance'
                          ? 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?auto=format&fit=crop&w=1200&q=80'
                          : selectedCameraAngle === 'crane'
                          ? 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80'
                          : 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80'
                      }
                      alt="Site Inspection Angle"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/50" />
                    <div className="absolute top-3 left-3 bg-black/70 px-3 py-1 rounded-full text-xs font-mono text-emerald-400 flex items-center gap-2 border border-emerald-500/40">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>CAM {selectedCameraAngle.toUpperCase()} • 4K STREAM ACTIVE</span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <div className="text-white font-bold">Milestone 03: Reinforcement Mesh &amp; Conduit Embedment</div>
                        <div className="text-slate-400 text-[11px]">Geotag: 12.9716° N, 77.5946° E • Whitefield, Bangalore</div>
                      </div>
                      <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-[11px] font-bold">
                        Milestone Escrow Approved
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Certified Marketplace */}
              {activeInteractiveTab === 'marketplace' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-bold text-white">Council of Architecture (CoA) Verified Marketplace</h4>
                    <p className="text-xs text-slate-400">
                      Zero unvetted middlemen. Review certified architectural and structural specialists.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                      <img
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80"
                        alt="Ar. S. Gouse"
                        className="w-14 h-14 rounded-2xl object-cover border border-amber-500/40"
                      />
                      <div>
                        <div className="text-sm font-bold text-white">Ar. S. Gouse</div>
                        <div className="text-xs text-amber-400 font-mono">Principal Architect &amp; Studio Lead</div>
                        <div className="text-[11px] text-slate-400 mt-1">CoA Reg: CA/2012/55190 • 14+ Yrs Exp</div>
                      </div>
                      <div className="pt-2 border-t border-slate-800 flex justify-between text-xs font-mono">
                        <span className="text-slate-400">Specialty:</span>
                        <span className="text-white">Luxury Villas &amp; BIM</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                      <img
                        src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80"
                        alt="Ar. Priya Sharma"
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-700"
                      />
                      <div>
                        <div className="text-sm font-bold text-white">Ar. Priya Sharma</div>
                        <div className="text-xs text-amber-400 font-mono">Senior Architect &amp; LEED AP</div>
                        <div className="text-[11px] text-slate-400 mt-1">CoA Reg: CA/2016/78210 • 8+ Yrs Exp</div>
                      </div>
                      <div className="pt-2 border-t border-slate-800 flex justify-between text-xs font-mono">
                        <span className="text-slate-400">Specialty:</span>
                        <span className="text-white">Green &amp; Net-Zero Design</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                      <img
                        src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80"
                        alt="Er. Rajesh Kumar"
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-700"
                      />
                      <div>
                        <div className="text-sm font-bold text-white">Er. Rajesh Kumar</div>
                        <div className="text-xs text-cyan-400 font-mono">Structural Engineer (M.Tech IIT)</div>
                        <div className="text-[11px] text-slate-400 mt-1">IS 456 &amp; High-Rise Consultant</div>
                      </div>
                      <div className="pt-2 border-t border-slate-800 flex justify-between text-xs font-mono">
                        <span className="text-slate-400">Specialty:</span>
                        <span className="text-white">Earthquake RCC Framing</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: Asset Yield Simulator */}
              {activeInteractiveTab === 'yield' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-bold text-white">Real Estate Yield &amp; Rental ROI Calculator</h4>
                    <p className="text-xs text-slate-400">
                      Model custom built-up square footage and tenant formats to project gross rental income.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    <div className="lg:col-span-6 space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold text-slate-300">
                          <span>Plot / Built-Up Area:</span>
                          <span className="text-amber-400 font-mono">{simulatedAreaSqFt.toLocaleString()} Sq.Ft</span>
                        </div>
                        <input
                          type="range"
                          min={2000}
                          max={15000}
                          step={250}
                          value={simulatedAreaSqFt}
                          onChange={(e) => setSimulatedAreaSqFt(Number(e.target.value))}
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Asset Configuration:</label>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          {[
                            { id: 'luxury_villa', label: 'Luxury Villa' },
                            { id: 'coliving_studios', label: 'Co-Living Studios' },
                            { id: 'commercial_office', label: 'Boutique Office' },
                          ].map((cfg) => (
                            <button
                              key={cfg.id}
                              type="button"
                              onClick={() => setSimulatedConfig(cfg.id as any)}
                              className={`p-2 rounded-xl text-center font-medium transition ${
                                simulatedConfig === cfg.id
                                  ? 'bg-amber-500 text-slate-950 font-bold'
                                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                              }`}
                            >
                              {cfg.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-6 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                      <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">Projected Financial Yield</div>
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                          <div className="text-[11px] text-slate-400">Est. Monthly Rental</div>
                          <div className="text-base font-bold font-mono text-white mt-1">
                            {simulatedConfig === 'coliving_studios'
                              ? `₹${Math.round((simulatedAreaSqFt * 75) / 1000)}k / mo`
                              : simulatedConfig === 'commercial_office'
                              ? `₹${Math.round((simulatedAreaSqFt * 90) / 1000)}k / mo`
                              : `₹${Math.round((simulatedAreaSqFt * 48) / 1000)}k / mo`}
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/40">
                          <div className="text-[11px] text-emerald-400 font-semibold">Net Annual Yield</div>
                          <div className="text-base font-bold font-mono text-emerald-400 mt-1">
                            {simulatedConfig === 'coliving_studios'
                              ? '13.4% p.a.'
                              : simulatedConfig === 'commercial_office'
                              ? '11.8% p.a.'
                              : '7.9% p.a.'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 6: Smart Home SKA Agent */}
              {activeInteractiveTab === 'smart_home_ska' && (
                <div className="space-y-6">
                  <SmartHomeSkaAgent
                    onOpenConsultation={() => {
                      const el = document.getElementById('consultation-form');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 6. HOW THE SYSTEM WORKS (5-STAGE DIGITAL JOURNEY) */}
      <section id="how-it-works" className="py-16 md:py-24 border-b border-slate-800/80 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="text-xs font-mono text-amber-400 uppercase tracking-widest font-semibold">
              THE 5-STAGE DIGITAL JOURNEY
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
              How the Gouse AI System Operates
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              From the moment client briefs arrive to the day keys are handed over, our end-to-end digital pipeline guarantees structural integrity and financial transparency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {howItWorksSteps.map((s, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition duration-300 space-y-3 relative group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xl font-bold text-amber-400">{s.step}</span>
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 group-hover:scale-110 transition">
                      {s.icon}
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-white tracking-tight leading-snug">{s.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-light">{s.desc}</p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 text-[11px] text-amber-300/90 font-mono">
                  {s.benefit}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. VALUE PROPOSITION MATRIX (Traditional Construction vs Gouse AI) */}
      <section id="key-features" className="py-16 md:py-24 border-b border-slate-800/80 bg-slate-900/30 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="text-xs font-mono text-amber-400 uppercase tracking-widest font-semibold">
              MEASURABLE ADVANTAGES
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
              Traditional Construction vs. Gouse AI
            </h2>
            <p className="text-sm text-slate-400">
              Why leading developers and private homeowners choose our AI-driven architecture and construction operating system.
            </p>
          </div>

          <div className="rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
            <div className="grid grid-cols-12 bg-slate-900 p-4 border-b border-slate-800 text-xs font-bold font-mono">
              <div className="col-span-4 text-slate-400 uppercase">Key Critical Metric</div>
              <div className="col-span-4 text-rose-400 uppercase">Traditional Construction</div>
              <div className="col-span-4 text-emerald-400 uppercase">Gouse AI Platform</div>
            </div>

            <div className="divide-y divide-slate-800 text-xs">
              <div className="grid grid-cols-12 p-4 items-center">
                <div className="col-span-4 font-bold text-white">Cost Overruns &amp; Budget Slips</div>
                <div className="col-span-4 text-slate-400">15% - 30% unexpected surprise bills during execution</div>
                <div className="col-span-4 text-emerald-400 font-bold">0% surprise slips; live dynamic BOQ rate locking</div>
              </div>

              <div className="grid grid-cols-12 p-4 items-center">
                <div className="col-span-4 font-bold text-white">Drawing &amp; MEP Clashes</div>
                <div className="col-span-4 text-slate-400">Found on-site during concrete pour (₹10L+ demolition)</div>
                <div className="col-span-4 text-emerald-400 font-bold">Caught digitally in seconds via AI clash auditor</div>
              </div>

              <div className="grid grid-cols-12 p-4 items-center">
                <div className="col-span-4 font-bold text-white">Milestone Verification</div>
                <div className="col-span-4 text-slate-400">Subjective contractor claims and phone photos</div>
                <div className="col-span-4 text-emerald-400 font-bold">360° AI site cameras &amp; geotagged engineering escrow</div>
              </div>

              <div className="grid grid-cols-12 p-4 items-center">
                <div className="col-span-4 font-bold text-white">Turnkey Warranty &amp; Longevity</div>
                <div className="col-span-4 text-slate-400">Subcontractors vanish after 6 months</div>
                <div className="col-span-4 text-emerald-400 font-bold">10-Year institutional structural &amp; waterproofing bond</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FEATURED CLIENT PORTFOLIO SHOWCASE */}
      <section id="client-showcase" className="py-16 md:py-24 border-b border-slate-800/80 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="text-xs font-mono text-amber-400 uppercase tracking-widest font-semibold">
                FEATURED ARCHITECTURAL PORTFOLIO
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
                Active Client Projects Under Management
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
                Explore real estate developments and private residences executed with Gouse AI.
              </p>
            </div>

            {/* Showcase Selector Tabs */}
            <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800 shrink-0 overflow-x-auto">
              {showcaseProjects.map((p, idx) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActiveShowcaseIndex(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                    activeShowcaseIndex === idx
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {p.title.split(' ')[0]} {p.title.split(' ')[1]}
                </button>
              ))}
            </div>
          </div>

          {/* Active Showcase Card */}
          {(() => {
            const activeProject = showcaseProjects[activeShowcaseIndex];
            return (
              <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-12">
                <div className="lg:col-span-7 relative min-h-[280px] lg:min-h-[440px] overflow-hidden">
                  <img
                    src={activeProject.image}
                    alt={activeProject.title}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-slate-900" />
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-mono font-semibold border ${activeProject.statusColor}`}>
                      {activeProject.status}
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs font-mono text-amber-400 uppercase tracking-widest">
                        {activeProject.category}
                      </div>
                      <h3 className="text-2xl font-bold text-white mt-1">{activeProject.title}</h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>{activeProject.location}</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="text-[11px] text-slate-400">Built-Up Area</div>
                        <div className="text-sm font-bold font-mono text-white mt-0.5">{activeProject.area}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="text-[11px] text-slate-400">Total Project Value</div>
                        <div className="text-sm font-bold font-mono text-amber-400 mt-0.5">{activeProject.budget}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-slate-300">Specifications:</div>
                      <ul className="space-y-1.5 text-xs text-slate-400">
                        {activeProject.highlights.map((h, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono">Lead: {activeProject.architectLead}</span>
                    <a
                      href="#client-consultation"
                      className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                    >
                      <span>Inquire About Similar Project</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* 9. CLIENT INQUIRY & CONSULTATION BOOKING FORM */}
      <section id="client-consultation" className="py-16 md:py-24 border-b border-slate-800/80 scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <div className="text-xs font-mono text-amber-400 uppercase tracking-widest font-semibold">
              START A CONVERSATION
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
              Request a Confidential Architectural Consultation
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              Share your project vision. Ar. S. Gouse and our structural engineering leads will review your site specifications and prepare an initial concept framework.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
            {enquirySuccessId ? (
              <div className="text-center py-10 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 stroke-[2.5]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white">Consultation Request Received!</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Thank you, <strong className="text-white">{clientName}</strong>. Our Principal Architectural Team has received your brief for <span className="text-amber-400">{projectType}</span>.
                  </p>
                </div>
                <div className="inline-block px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300">
                  Reference Code: <span className="font-bold text-white">{enquirySuccessId}</span>
                </div>
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEnquirySuccessId(null);
                      setClientName('');
                      setClientEmail('');
                      setProjectNotes('');
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConsultationSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="e.g. Sameer Khan"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 focus:outline-none text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="e.g. sameer@prestige.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 focus:outline-none text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Phone Number</label>
                    <input
                      type="tel"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="+91 98450 12345"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 focus:outline-none text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Project Typology</label>
                    <select
                      value={projectType}
                      onChange={(e) => setProjectType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 focus:outline-none text-xs text-white"
                    >
                      <option>Residential Villa / Luxury Bungalow</option>
                      <option>High-Yield Co-Living / PG House</option>
                      <option>Commercial Studio / Office Fitout</option>
                      <option>Turnkey Structural Retrofit &amp; Facade</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Target Budget Bracket</label>
                    <select
                      value={budgetBracket}
                      onChange={(e) => setBudgetBracket(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 focus:outline-none text-xs text-white"
                    >
                      <option>₹1.0 Cr - ₹2.5 Cr</option>
                      <option>₹2.5 Cr - ₹5.0 Cr</option>
                      <option>₹5.0 Cr - ₹10.0 Cr</option>
                      <option>₹10.0 Cr+ (Estate / Commercial)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Project Notes &amp; Special Requirements</label>
                  <textarea
                    rows={3}
                    value={projectNotes}
                    onChange={(e) => setProjectNotes(e.target.value)}
                    placeholder="Describe plot dimensions, location (e.g. Whitefield, Indiranagar), aesthetic preferences, or schedule goals..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 focus:outline-none text-xs text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingEnquiry}
                  className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmittingEnquiry ? 'Submitting Confidential Inquiry...' : 'Submit Consultation Request'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 10. FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
                <Compass className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <span className="font-bold text-white text-sm">GOUSE AI ARCHITECTURE STUDIO</span>
                <p className="text-[11px] text-slate-500">Dedicated Client Portal • Outside Main Platform</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
              <span>Ar. S. Gouse (Principal)</span>
              <span>•</span>
              <span>sgouse14@gmail.com</span>
              <span>•</span>
              <span>Council of Architecture CA/2012/55190</span>
            </div>
          </div>

          <div className="border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
            <div>
              © 2026 Gouse AI Architecture &amp; Construction Intelligence Workspace. All Rights Reserved.
            </div>
            <div>
              Access Control: Client Portal Isolation Active (Protected by Multi-Role Authentication).
            </div>
          </div>
        </div>
      </footer>

      {/* Autonomous AI Agent Persistent Floating HUD */}
      <AgentFloatingHUD
        architectPhone="+91 80739 47241"
      />
    </div>
  );
};
