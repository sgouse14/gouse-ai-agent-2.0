import React, { useState, useEffect } from 'react';
import {
  Key,
  ShieldCheck,
  Sparkles,
  Building,
  Home,
  CheckCircle2,
  AlertTriangle,
  Star,
  MessageSquare,
  Send,
  LogIn,
  LogOut,
  Camera,
  Zap,
  Calculator,
  Layers,
  Compass,
  MapPin,
  Clock,
  ArrowRight,
  Lock,
  User,
  Users,
  Check,
  FileText,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  RotateCcw,
  Sliders,
  DollarSign,
  Maximize2,
  Briefcase,
  ExternalLink,
  Building2,
  HardHat,
  Boxes,
  Bot,
  Share2,
  ChevronDown,
  CheckSquare,
  Globe,
  FolderPlus,
  Phone,
} from 'lucide-react';
import {
  Project,
  BOQItem,
  SiteAuditResult,
  ProfessionalProfile,
  MarketplaceEnquiry,
  EnquiryStatus,
} from '../types';
import { CurrencyCode, formatCurrency } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { GouseAiAgentBrokerView } from './GouseAiAgentBrokerView';
import { SequentialWorkflowEngineModal } from './SequentialWorkflowEngineModal';
import { SiteVisitCameraModal } from './SiteVisitCameraModal';
import { BrokerAuthModal } from './BrokerAuthModal';
import { AuthModal } from './AuthModal';
import { ProjectsView } from './ProjectsView';
import { BOQView } from './BOQView';
import { MaterialsView } from './MaterialsView';
import { MarketplaceView } from './MarketplaceView';
import { SpecialistChatView } from './SpecialistChatView';
import { SocialMediaStudio } from './SocialMediaStudio';
import {
  INITIAL_BOQ_ITEMS,
  INITIAL_PROFESSIONALS,
  INITIAL_ENQUIRIES,
} from '../data/initialData';

export interface UnifiedMasterPageViewProps {
  activeProject: Project;
  projects?: Project[];
  activeProjectId?: string;
  onSelectProject?: (id: string) => void;
  currency?: CurrencyCode;
  onChangeCurrency?: (curr: CurrencyCode) => void;
  onUpdateProject?: (project: Project) => void;
  onCreateProject?: (project: Partial<Project>) => void;
  onOpenClientDashboard?: () => void;
  boqItems?: BOQItem[];
  onUpdateBOQItems?: (items: BOQItem[]) => void;
  contingencyPercent?: number;
  onChangeContingency?: (val: number) => void;
  professionals?: ProfessionalProfile[];
  enquiries?: MarketplaceEnquiry[];
  onAddEnquiry?: (enquiry: MarketplaceEnquiry) => void;
  onUpdateEnquiryStatus?: (id: string, status: EnquiryStatus) => void;
  onUpdateEnquiry?: (updated: MarketplaceEnquiry) => void;
  onSaveProfile?: (profile: ProfessionalProfile) => void;
  onDeleteProfile?: (profileId: string) => void;
  onToggleMyPractice?: (profileId: string, isMyPractice: boolean) => void;
  onOpenWorkflowEngine?: () => void;
  onOpenSiteCamera?: () => void;
}

interface ClientFeedbackItem {
  id: string;
  clientName: string;
  clientRole: string;
  projectName: string;
  projectLocation: string;
  rating: number; // 1-5
  category: 'Architectural BIM' | 'Turnkey BOQ' | 'AI Site Cam Audit' | 'Rental Brokerage';
  date: string;
  comment: string;
  verifiedBadge: string;
  avatarUrl: string;
}

export const UnifiedMasterPageView: React.FC<UnifiedMasterPageViewProps> = ({
  activeProject,
  projects = [activeProject],
  activeProjectId = activeProject?.id,
  onSelectProject,
  currency = 'INR',
  onChangeCurrency,
  onUpdateProject,
  onCreateProject,
  onOpenClientDashboard,
  boqItems,
  onUpdateBOQItems,
  contingencyPercent = 10,
  onChangeContingency,
  professionals,
  enquiries,
  onAddEnquiry,
  onUpdateEnquiryStatus,
  onUpdateEnquiry,
  onSaveProfile,
  onDeleteProfile,
  onToggleMyPractice,
  onOpenWorkflowEngine,
  onOpenSiteCamera,
}) => {
  const { user, login, loginAsDemo, logout } = useAuth();

  // Main Platform sub-tab state ('projects' | 'boq' | 'materials' | 'marketplace' | 'specialist' | 'social')
  const [activeMainTab, setActiveMainTab] = useState<
    'projects' | 'boq' | 'materials' | 'marketplace' | 'specialist' | 'social'
  >('projects');

  // Internal Fallback State for Main Platform if not provided by parent
  const [internalBoqItems, setInternalBoqItems] = useState<BOQItem[]>(() => boqItems || INITIAL_BOQ_ITEMS);
  const [internalContingency, setInternalContingency] = useState<number>(contingencyPercent);
  const [internalProfessionals, setInternalProfessionals] = useState<ProfessionalProfile[]>(
    () => professionals || INITIAL_PROFESSIONALS
  );
  const [internalEnquiries, setInternalEnquiries] = useState<MarketplaceEnquiry[]>(
    () => enquiries || INITIAL_ENQUIRIES
  );
  const [internalCurrency, setInternalCurrency] = useState<CurrencyCode>(currency);

  // Synchronize when parent props change
  useEffect(() => {
    if (boqItems) setInternalBoqItems(boqItems);
  }, [boqItems]);

  useEffect(() => {
    if (professionals) setInternalProfessionals(professionals);
  }, [professionals]);

  useEffect(() => {
    if (enquiries) setInternalEnquiries(enquiries);
  }, [enquiries]);

  useEffect(() => {
    setInternalCurrency(currency);
  }, [currency]);

  // Marketplace sub-navigation helper
  const [marketplaceCategory, setMarketplaceCategory] = useState<string | undefined>();
  const [marketplaceQuery, setMarketplaceQuery] = useState<string | undefined>();

  // Modals state
  const [isWorkflowEngineOpen, setIsWorkflowEngineOpen] = useState(false);
  const [isSiteCameraOpen, setIsSiteCameraOpen] = useState(false);
  const [isBrokerAuthOpen, setIsBrokerAuthOpen] = useState(false);
  const [isGeneralAuthOpen, setIsGeneralAuthOpen] = useState(false);

  // Active items and handlers
  const currentBoqItems = boqItems || internalBoqItems;
  const currentContingency = contingencyPercent !== undefined ? contingencyPercent : internalContingency;
  const currentProfessionals = professionals || internalProfessionals;
  const currentEnquiries = enquiries || internalEnquiries;
  const activeCurrency = internalCurrency;

  const handleUpdateBoqItems = (newItems: BOQItem[]) => {
    setInternalBoqItems(newItems);
    onUpdateBOQItems?.(newItems);
  };

  const handleChangeContingency = (val: number) => {
    setInternalContingency(val);
    onChangeContingency?.(val);
  };

  const handleCurrencyChange = (curr: CurrencyCode) => {
    setInternalCurrency(curr);
    onChangeCurrency?.(curr);
  };

  const handleAddEnquiry = (enq: MarketplaceEnquiry) => {
    setInternalEnquiries((prev) => [enq, ...prev]);
    onAddEnquiry?.(enq);
  };

  const handleUpdateEnquiryStatus = (id: string, status: EnquiryStatus) => {
    setInternalEnquiries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status } : e))
    );
    onUpdateEnquiryStatus?.(id, status);
  };

  const handleUpdateEnquiry = (updated: MarketplaceEnquiry) => {
    setInternalEnquiries((prev) =>
      prev.map((e) => (e.id === updated.id ? updated : e))
    );
    onUpdateEnquiry?.(updated);
  };

  const handleSaveProfile = (prof: ProfessionalProfile) => {
    setInternalProfessionals((prev) => {
      const idx = prev.findIndex((p) => p.id === prof.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = prof;
        return copy;
      }
      return [prof, ...prev];
    });
    onSaveProfile?.(prof);
  };

  const handleDeleteProfile = (id: string) => {
    setInternalProfessionals((prev) => prev.filter((p) => p.id !== id));
    onDeleteProfile?.(id);
  };

  const handleToggleMyPractice = (id: string, isMyPractice: boolean) => {
    setInternalProfessionals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isMyPractice } : p))
    );
    onToggleMyPractice?.(id, isMyPractice);
  };

  const handleSelectProject = (id: string) => {
    onSelectProject?.(id);
  };

  // Studio Staff Authorization State
  const isStudioStaff = Boolean(
    user &&
      (user.role === 'owner' ||
        user.role === 'architect' ||
        user.role === 'structural_engineer' ||
        user.role === 'mep_engineer' ||
        user.role === 'quantity_surveyor' ||
        user.role === 'contractor')
  );

  // Studio Platform Login Form State
  const [studioLoginEmail, setStudioLoginEmail] = useState('');
  const [studioLoginPassword, setStudioLoginPassword] = useState('');
  const [studioLoginError, setStudioLoginError] = useState<string | null>(null);
  const [isSubmittingStudioLogin, setIsSubmittingStudioLogin] = useState(false);
  const [studioRememberMe, setStudioRememberMe] = useState(true);

  const handleStudioLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudioLoginError(null);
    setIsSubmittingStudioLogin(true);

    try {
      const trimmed = studioLoginEmail.trim().toLowerCase();
      if (!trimmed) {
        setStudioLoginError('Please enter your studio staff email address');
        setIsSubmittingStudioLogin(false);
        return;
      }
      const res = await login(trimmed, studioLoginPassword);
      if (!res.success) {
        // Fallback demo login for studio staff
        loginAsDemo('user-gouse-01');
      }
    } catch {
      setStudioLoginError('Studio authentication failed. You may use 1-click staff access.');
    } finally {
      setIsSubmittingStudioLogin(false);
    }
  };

  // Broker Platform Authorization & Login Form State
  const isBrokerUser = Boolean(
    user &&
      (user.role === 'broker_agent' ||
        user.role === 'property_owner' ||
        user.role === 'tenant' ||
        user.role === 'owner')
  );

  const [brokerRoleTab, setBrokerRoleTab] = useState<'tenant' | 'property_owner' | 'broker_agent'>('tenant');
  const [brokerAuthMethod, setBrokerAuthMethod] = useState<'password' | 'otp'>('password');
  const [brokerLoginEmail, setBrokerLoginEmail] = useState('');
  const [brokerLoginPassword, setBrokerLoginPassword] = useState('');
  const [brokerPhone, setBrokerPhone] = useState('');
  const [brokerOtp, setBrokerOtp] = useState('');
  const [brokerOtpSent, setBrokerOtpSent] = useState(false);
  const [brokerLoginError, setBrokerLoginError] = useState<string | null>(null);
  const [isSubmittingBrokerLogin, setIsSubmittingBrokerLogin] = useState(false);
  const [brokerRememberMe, setBrokerRememberMe] = useState(true);

  // Central Login Hub Section Tab ('broker' | 'client' | 'studio')
  const [centralLoginTab, setCentralLoginTab] = useState<'broker' | 'client' | 'studio'>('broker');

  const handleBrokerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBrokerLoginError(null);
    setIsSubmittingBrokerLogin(true);

    try {
      const trimmed = brokerLoginEmail.trim().toLowerCase();
      if (!trimmed) {
        setBrokerLoginError('Please enter your broker, landlord, or tenant email address');
        setIsSubmittingBrokerLogin(false);
        return;
      }
      const res = await login(trimmed, brokerLoginPassword);
      if (!res.success) {
        // Fallback demo login based on active persona tab
        if (brokerRoleTab === 'tenant') loginAsDemo('user-aarav-07');
        else if (brokerRoleTab === 'property_owner') loginAsDemo('user-vikram-08');
        else loginAsDemo('user-sneha-09');
      }
    } catch {
      setBrokerLoginError('Authentication failed. You may use 1-click broker demo access.');
    } finally {
      setIsSubmittingBrokerLogin(false);
    }
  };

  const handleSendBrokerOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brokerPhone.trim() || brokerPhone.trim().length < 10) {
      setBrokerLoginError('Please enter a valid 10-digit mobile number');
      return;
    }
    setBrokerOtpSent(true);
    setBrokerLoginError(null);
  };

  const handleVerifyBrokerOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingBrokerLogin(true);
    // Instant verify and demo sign-in
    if (brokerRoleTab === 'tenant') {
      loginAsDemo('user-aarav-07');
    } else if (brokerRoleTab === 'property_owner') {
      loginAsDemo('user-vikram-08');
    } else {
      loginAsDemo('user-sneha-09');
    }
    setIsSubmittingBrokerLogin(false);
  };

  // Client Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Client Feedback List State
  const [feedbackList, setFeedbackList] = useState<ClientFeedbackItem[]>([
    {
      id: 'fb-1',
      clientName: 'Sameer Khan',
      clientRole: 'Managing Director • Prestige Urban Ventures',
      projectName: 'Prestige Heights Commercial & Co-Living',
      projectLocation: 'Indiranagar 100ft Road, Bangalore',
      rating: 5,
      category: 'Turnkey BOQ',
      date: 'Yesterday, 4:15 PM',
      comment:
        'The dynamic floor-by-floor BOQ engine locked concrete and reinforcement steel rates against CPWD indices before slab pouring started. Zero contractor variance and absolute cost transparency.',
      verifiedBadge: 'Verified Project Client • ₹8.4 Cr Turnover',
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
    },
    {
      id: 'fb-2',
      clientName: 'Meera Nambiar',
      clientRole: 'Private Villa Owner',
      projectName: 'Palm Crest Luxury Residence',
      projectLocation: 'Sarjapur / Whitefield, Bangalore',
      rating: 5,
      category: 'AI Site Cam Audit',
      date: 'Oct 17, 2026',
      comment:
        'As an NRI client residing in Singapore, the 360° geotagged AI site camera gave me daily verified rebar scans. Automated escrow releases only happened when curing was mathematically confirmed.',
      verifiedBadge: 'Verified Homeowner • CoA Certified Arch',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    },
    {
      id: 'fb-3',
      clientName: 'Vikramaditya Reddy',
      clientRole: 'Real Estate Developer & Landlord',
      projectName: 'Indiranagar Tech Living PG & HSR House',
      projectLocation: 'Indiranagar & HSR Layout, Bangalore',
      rating: 5,
      category: 'Rental Brokerage',
      date: 'Oct 15, 2026',
      comment:
        'Gouse AI Agent Broker listed our 32-bed co-living facility and 3BHK flat with zero brokerage markups. Direct tenant screening and automated digital lease agreements filled 100% capacity in 11 days.',
      verifiedBadge: 'Verified Landlord • 18 Units Managed',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    },
    {
      id: 'fb-4',
      clientName: 'Dr. Anand Sen',
      clientRole: 'Senior Surgeon & Investor',
      projectName: 'Green Terraces Boutique Studios',
      projectLocation: 'Koramangala 4th Block, Bangalore',
      rating: 5,
      category: 'Architectural BIM',
      date: 'Oct 12, 2026',
      comment:
        'Ar. S. Gouse’s automated BIM clash detection caught a critical 100mm MEP duct collision with a structural cantilever beam before construction began, saving an estimated ₹3.2 Lakhs in rework.',
      verifiedBadge: 'Verified Client • IS 456 Structural Audit',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    },
  ]);

  // New Feedback Form State
  const [newFeedbackName, setNewFeedbackName] = useState('');
  const [newFeedbackProject, setNewFeedbackProject] = useState('');
  const [newFeedbackRating, setNewFeedbackRating] = useState(5);
  const [newFeedbackCategory, setNewFeedbackCategory] = useState<
    'Architectural BIM' | 'Turnkey BOQ' | 'AI Site Cam Audit' | 'Rental Brokerage'
  >('Architectural BIM');
  const [newFeedbackComment, setNewFeedbackComment] = useState('');
  const [feedbackSubmitSuccess, setFeedbackSubmitSuccess] = useState(false);

  // Smooth scroll handler
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsSubmittingLogin(true);

    try {
      const trimmed = loginEmail.trim().toLowerCase();
      if (!trimmed) {
        setLoginError('Please enter your client email');
        setIsSubmittingLogin(false);
        return;
      }

      const res = await login(trimmed, loginPassword);
      if (!res.success) {
        // Quick fallback for demo
        loginAsDemo('user-sameer-05');
      }
    } catch {
      setLoginError('Authentication failed. Use the 1-click client demo button below.');
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedbackName.trim() || !newFeedbackComment.trim()) {
      return;
    }

    const newItem: ClientFeedbackItem = {
      id: `fb-user-${Date.now()}`,
      clientName: newFeedbackName.trim(),
      clientRole: 'Verified Client / Stakeholder',
      projectName: newFeedbackProject.trim() || 'Turnkey Architectural Project',
      projectLocation: 'Bangalore Tech Corridor',
      rating: newFeedbackRating,
      category: newFeedbackCategory,
      date: 'Just now',
      comment: newFeedbackComment.trim(),
      verifiedBadge: 'Direct Client Feedback Verified',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    };

    setFeedbackList([newItem, ...feedbackList]);
    setNewFeedbackName('');
    setNewFeedbackProject('');
    setNewFeedbackComment('');
    setFeedbackSubmitSuccess(true);
    setTimeout(() => setFeedbackSubmitSuccess(false), 5000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* ========================================================================= */}
      {/* 0. STICKY TOP INTEGRATED APP HEADER & QUICK-NAVIGATION                     */}
      {/* ========================================================================= */}
      <header className="bg-slate-950/95 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 flex-wrap">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 shrink-0">
              <Compass className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-white text-base sm:text-lg">
                  GOUSE <span className="text-amber-400">AI</span> AGENT
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  ALL-IN-ONE PLATFORM
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-tight hidden sm:block">
                AI Engineering • Broker Command Center • Client Portal &amp; Feedback
              </p>
            </div>
          </div>

          {/* Direct In-Page Anchor Navigation */}
          <nav className="flex items-center gap-2 sm:gap-3 text-xs font-semibold overflow-x-auto py-1 scrollbar-none">
            <button
              type="button"
              onClick={() => scrollToSection('sec-main-platform')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold hover:from-amber-400 hover:to-amber-500 transition whitespace-nowrap shadow-md shadow-amber-500/20"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{isStudioStaff ? 'Main Studio Platform (Active)' : 'Main Studio Platform (Login)'}</span>
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('sec-broker-command-center')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/15 text-sky-300 hover:bg-sky-500/25 border border-sky-500/30 transition whitespace-nowrap"
            >
              <Building className="w-3.5 h-3.5 text-sky-400" />
              <span>Broker Command Center {isBrokerUser ? '(Active)' : '(Login)'}</span>
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('sec-client-feedback')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 transition whitespace-nowrap"
            >
              <Star className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
              <span>Client Feedback</span>
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('sec-client-login')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/15 text-purple-300 hover:bg-purple-500/25 border border-purple-500/30 transition whitespace-nowrap"
            >
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              <span>Client Login</span>
            </button>
          </nav>

          {/* User Auth Action Pill */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  <span>{user.name}</span>
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => scrollToSection('sec-client-login')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Client &amp; Broker Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* HERO BANNER: 4 PILLARS UNIFIED MASTER PLATFORM                             */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-b from-slate-900/80 via-slate-950 to-slate-950 border-b border-slate-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  ALL-IN-ONE MASTER COMMAND CENTER
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono">
                  Principal Architect: Ar. S. Gouse
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono">
                  IS 456 • NBC 2016 • CPWD 2026
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Gouse Architecture: Main Studio, Broker &amp; Client Hub
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Single unified master command center: Main Architecture &amp; Engineering Studio (BIM, Dynamic BOQ, Materials Specifier &amp; Specialist AI Co-Pilot with secure Staff Login), Real Estate PG &amp; Rental House Broker Command Center, Verified Client Project Feedback, and Dedicated Client Portal Login.
              </p>
            </div>

            {/* Quick 4-Pillar Jump Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:w-auto shrink-0 text-left">
              <button
                type="button"
                onClick={() => scrollToSection('sec-main-platform')}
                className="p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition text-left group"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 mb-1.5">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="text-[11px] font-bold text-white group-hover:text-amber-300">
                  1. Main Platform {isStudioStaff ? '✓' : '(Login)'}
                </div>
                <div className="text-[10px] text-slate-400">BIM &amp; BOQ Studio</div>
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('sec-broker-command-center')}
                className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition text-left group"
              >
                <div className="w-7 h-7 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400 mb-1.5">
                  <Building className="w-4 h-4" />
                </div>
                <div className="text-[11px] font-bold text-white group-hover:text-sky-300">
                  2. Broker Command {isBrokerUser ? '✓' : '(Login)'}
                </div>
                <div className="text-[10px] text-slate-400">PGs &amp; Rental Houses</div>
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('sec-client-feedback')}
                className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition text-left group"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-1.5">
                  <Star className="w-4 h-4 fill-emerald-400" />
                </div>
                <div className="text-[11px] font-bold text-white group-hover:text-emerald-300">3. Feedback</div>
                <div className="text-[10px] text-slate-400">4.98★ 5 Reviews</div>
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('sec-client-login')}
                className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition text-left group"
              >
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 mb-1.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="text-[11px] font-bold text-white group-hover:text-purple-300">4. Client Login</div>
                <div className="text-[10px] text-slate-400">Instant Demo Access</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. MAIN STUDIO PLATFORM: ARCHITECTURAL, BIM, BOQ & ENGINEERING WORKSPACE   */}
      {/* ========================================================================= */}
      <section id="sec-main-platform" className="py-12 border-b border-slate-800 bg-slate-950 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Main Platform Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  PILLAR 1: MAIN ARCHITECTURAL &amp; ENGINEERING PLATFORM
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-mono">
                  LIVE STUDIO WORKSPACE
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                Main Platform: Projects, Dynamic BOQ, Materials &amp; AI Co-Pilot
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
                Full-featured architectural studio suite. Inspect 3D BIM models, simulate floor-by-floor takeoff items, review verified building material specifications, consult the verified AEC marketplace, chat with the specialist co-pilot, or launch social campaigns.
              </p>
            </div>

            {/* Quick Modals Triggers */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  if (onOpenWorkflowEngine) onOpenWorkflowEngine();
                  else setIsWorkflowEngineOpen(true);
                }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition"
              >
                <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                <span>Workflow Engine</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onOpenSiteCamera) onOpenSiteCamera();
                  else setIsSiteCameraOpen(true);
                }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-xs transition"
              >
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>Site Camera</span>
              </button>
            </div>
          </div>

          {/* STUDIO PLATFORM CONTENT: LOGIN GATEWAY WHEN NOT STAFF, WORKSPACE WHEN AUTHENTICATED */}
          {!isStudioStaff ? (
            <div className="rounded-3xl bg-slate-900/90 border border-amber-500/30 p-6 sm:p-10 shadow-2xl space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      MAIN STUDIO PLATFORM • STAFF AUTHENTICATION REQUIRED
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-mono">
                      ARCHITECTS &amp; ENGINEERS ONLY
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Main Studio Platform: Architecture, BIM &amp; BOQ Suite
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
                    Internal workspace containing live CAD blueprints, CPWD itemized BOQ costing, brand material specifications, and structural specialist co-pilot. Please authenticate with your studio staff credentials or use instant 1-click staff demo access below.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => scrollToSection('sec-client-login')}
                    className="px-3.5 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Go to Client Login</span>
                  </button>
                </div>
              </div>

              {/* 1-Click Fast Studio Staff Demo Logins */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/30 border border-amber-500/40 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5 uppercase">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Instant 1-Click Studio Staff Sign-In
                  </span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono font-bold">
                    SELECT ROLE TO UNLOCK STUDIO WORKSPACE
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => loginAsDemo('user-gouse-01')}
                    className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/40 hover:border-amber-400 transition text-left group flex items-start gap-3"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
                      alt="Gouse AI"
                      className="w-10 h-10 rounded-lg object-cover border border-amber-500/40 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white group-hover:text-amber-300 flex items-center gap-1">
                        <span>Gouse AI</span>
                        <CheckCircle2 className="w-3 h-3 text-amber-400 inline" />
                      </div>
                      <div className="text-[11px] text-amber-400 font-mono">Principal Architect &amp; Lead</div>
                      <div className="text-[10px] text-slate-400 truncate">Executive Studio Full Access</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => loginAsDemo('user-priya-02')}
                    className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 transition text-left group flex items-start gap-3"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80"
                      alt="Ar. Priya Sharma"
                      className="w-10 h-10 rounded-lg object-cover border border-slate-700 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white group-hover:text-amber-300">Ar. Priya Sharma</div>
                      <div className="text-[11px] text-sky-400 font-mono">Lead Architect (BIM &amp; LEED)</div>
                      <div className="text-[10px] text-slate-400 truncate">Design &amp; 3D Modeling</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => loginAsDemo('user-rajesh-03')}
                    className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 transition text-left group flex items-start gap-3"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80"
                      alt="Er. Rajesh Kumar"
                      className="w-10 h-10 rounded-lg object-cover border border-slate-700 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white group-hover:text-amber-300">Er. Rajesh Kumar</div>
                      <div className="text-[11px] text-emerald-400 font-mono">Lead Structural Engineer</div>
                      <div className="text-[10px] text-slate-400 truncate">IS 456 &amp; Seismic Auditing</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Studio Credentials Form & What You Unlock */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="space-y-4 p-6 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      Studio Credentials Sign In
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">INTERNAL WORKSPACE</span>
                  </div>

                  {studioLoginError && (
                    <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{studioLoginError}</span>
                    </div>
                  )}

                  <form onSubmit={handleStudioLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Studio Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={studioLoginEmail}
                        onChange={(e) => setStudioLoginEmail(e.target.value)}
                        placeholder="e.g. sgouse14@gmail.com or priya.sharma@gouseai.com"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Studio Password
                      </label>
                      <input
                        type="password"
                        value={studioLoginPassword}
                        onChange={(e) => setStudioLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <label className="flex items-center gap-1.5 text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={studioRememberMe}
                          onChange={(e) => setStudioRememberMe(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0"
                        />
                        <span>Keep studio session active</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => scrollToSection('sec-client-login')}
                        className="text-purple-400 hover:underline"
                      >
                        Client Sign In Instead?
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingStudioLogin}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>{isSubmittingStudioLogin ? 'Authenticating Studio...' : 'Sign In to Studio Platform'}</span>
                    </button>
                  </form>
                </div>

                {/* Feature Highlights Grid */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Studio Platform Engines Included:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>1. Projects &amp; 3D BIM</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Interactive 3D structural visualizer, drawings index, and milestone approvals.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Calculator className="w-3.5 h-3.5 text-amber-400" />
                        <span>2. Dynamic BOQ Engine</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Floor-by-floor takeoff calculations locked to CPWD 2026 indices with Excel exports.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Boxes className="w-3.5 h-3.5 text-sky-400" />
                        <span>3. Materials Specifier</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Real-time price feeds for Tata Tiscon, UltraTech, Asian Paints, and brand comparators.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <HardHat className="w-3.5 h-3.5 text-emerald-400" />
                        <span>4. AEC Marketplace</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Verified contractors, structural engineers, MEP consultants, and RFQ direct dispatch.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Bot className="w-3.5 h-3.5 text-purple-400" />
                        <span>5. Specialist AI Co-Pilot</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        IS 456 / NBC 2016 automated code checks, beam deflection fixes, and structural analysis.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Share2 className="w-3.5 h-3.5 text-rose-400" />
                        <span>6. Social Media Studio</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        High-converting real estate Instagram/LinkedIn posts, video scripts, and render ads.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Studio Staff Authenticated Status Banner */}
              <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-emerald-300">
                    STUDIO ACCESS ACTIVE • Authenticated as {user?.name} ({user?.role?.toUpperCase()})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                    {user?.company || 'Gouse Architecture Studio'}
                  </span>
                  <button
                    type="button"
                    onClick={logout}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold transition"
                  >
                    Lock Studio
                  </button>
                </div>
              </div>

              {/* Project & Currency Control Bar */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400">Active Project:</span>
                    <select
                      value={activeProject?.id}
                      onChange={(e) => handleSelectProject(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-amber-400 transition"
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.location})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400">Currency:</span>
                    <select
                      value={activeCurrency}
                      onChange={(e) => handleCurrencyChange(e.target.value as CurrencyCode)}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-400 transition"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="AED">AED (د.إ)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                </div>

                {/* Quick Project Metadata Badges */}
                <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono text-slate-300">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    <span>{activeProject.location}</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1.5">
                    <Layers className="w-3 h-3 text-sky-400" />
                    <span>{activeProject.projectType || 'Turnkey Architectural'}</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1.5">
                    <Calculator className="w-3 h-3 text-emerald-400" />
                    <span>{activeProject.builtUpAreaSqFt?.toLocaleString() || '3,800'} sq.ft</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
                    Live BOQ: {formatCurrency(
                      currentBoqItems.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 84000000,
                      activeCurrency
                    )}
                  </span>
                </div>
              </div>

              {/* Main Platform Studio Module Navigation Tabs */}
              <div className="p-1.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => setActiveMainTab('projects')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    activeMainTab === 'projects'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>1. Projects &amp; 3D BIM Viewer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMainTab('boq')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    activeMainTab === 'boq'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>2. Floor-by-Floor Dynamic BOQ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMainTab('materials')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    activeMainTab === 'materials'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Boxes className="w-3.5 h-3.5" />
                  <span>3. Verified Materials &amp; Specs</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMainTab('marketplace')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    activeMainTab === 'marketplace'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <HardHat className="w-3.5 h-3.5" />
                  <span>4. Professional Marketplace</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMainTab('specialist')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    activeMainTab === 'specialist'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>5. Specialist AI Co-Pilot</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMainTab('social')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    activeMainTab === 'social'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>6. Social Media Studio</span>
                </button>
              </div>

              {/* Embedded Active Studio Module Container */}
              <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-2 sm:p-4 shadow-2xl overflow-hidden min-h-[500px]">
                {activeMainTab === 'projects' && (
                  <ProjectsView
                    projects={projects}
                    activeProject={activeProject}
                    onSelectProject={handleSelectProject}
                    onUpdateProject={onUpdateProject || (() => {})}
                    onCreateProject={onCreateProject || (() => {})}
                    onOpenWorkflowEngine={() => {
                      if (onOpenWorkflowEngine) onOpenWorkflowEngine();
                      else setIsWorkflowEngineOpen(true);
                    }}
                    onOpenSiteCamera={() => {
                      if (onOpenSiteCamera) onOpenSiteCamera();
                      else setIsSiteCameraOpen(true);
                    }}
                    currency={activeCurrency}
                  />
                )}

                {activeMainTab === 'boq' && (
                  <BOQView
                    items={currentBoqItems}
                    contingencyPercent={currentContingency}
                    currency={activeCurrency}
                    activeProject={activeProject}
                    onUpdateItems={handleUpdateBoqItems}
                    onChangeContingency={handleChangeContingency}
                    onUpdateProject={onUpdateProject}
                    onAddEnquiry={handleAddEnquiry}
                    onOpenWorkflowEngine={() => {
                      if (onOpenWorkflowEngine) onOpenWorkflowEngine();
                      else setIsWorkflowEngineOpen(true);
                    }}
                  />
                )}

                {activeMainTab === 'materials' && (
                  <MaterialsView
                    activeProject={activeProject}
                    currency={activeCurrency}
                    onNavigateToMarketplace={(cat, query) => {
                      setMarketplaceCategory(cat);
                      setMarketplaceQuery(query);
                      setActiveMainTab('marketplace');
                    }}
                    boqItems={currentBoqItems}
                    onUpdateBOQItems={handleUpdateBoqItems}
                    onUpdateProject={onUpdateProject}
                    onNavigateToBOQ={() => setActiveMainTab('boq')}
                    onOpenWorkflowEngine={() => {
                      if (onOpenWorkflowEngine) onOpenWorkflowEngine();
                      else setIsWorkflowEngineOpen(true);
                    }}
                  />
                )}

                {activeMainTab === 'marketplace' && (
                  <MarketplaceView
                    professionals={currentProfessionals}
                    enquiries={currentEnquiries}
                    onAddEnquiry={handleAddEnquiry}
                    onUpdateEnquiryStatus={handleUpdateEnquiryStatus}
                    onUpdateEnquiry={handleUpdateEnquiry}
                    onSaveProfile={handleSaveProfile}
                    onDeleteProfile={handleDeleteProfile}
                    onToggleMyPractice={handleToggleMyPractice}
                    initialCategory={marketplaceCategory}
                    initialQuery={marketplaceQuery}
                    projectCity={activeProject.location}
                  />
                )}

                {activeMainTab === 'specialist' && (
                  <SpecialistChatView
                    activeProject={activeProject}
                    boqItems={currentBoqItems}
                    currency={activeCurrency}
                    onUpdateBOQItems={handleUpdateBoqItems}
                    onUpdateProject={onUpdateProject}
                    onNavigateToBOQ={() => setActiveMainTab('boq')}
                    onOpenWorkflowEngine={() => {
                      if (onOpenWorkflowEngine) onOpenWorkflowEngine();
                      else setIsWorkflowEngineOpen(true);
                    }}
                  />
                )}

                {activeMainTab === 'social' && (
                  <div className="max-w-7xl mx-auto px-2 sm:px-6 py-6 space-y-6">
                    <SocialMediaStudio
                      activeProject={activeProject}
                      onOpenWorkflowEngine={() => {
                        if (onOpenWorkflowEngine) onOpenWorkflowEngine();
                        else setIsWorkflowEngineOpen(true);
                      }}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. GOUSE AI AGENT BROKER: PG, CO-LIVING & RENTAL HOUSE COMMAND CENTER       */}
      {/* ========================================================================= */}
      <section id="sec-broker-command-center" className="py-12 border-b border-slate-800 bg-slate-950/60 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 text-xs font-mono font-bold flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-sky-400" />
                  PILLAR 2: GOUSE AI AGENT BROKER COMMAND CENTER
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono">
                  0% BROKERAGE DIRECT
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                Gouse AI Agent Broker: PG, Co-Living &amp; Rental House Command Center
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
                Direct verified listings for co-living PG beds, rental flats &amp; independent villas, AI tenant-landlord matchmaker, automated digital lease agreements, and real estate yield ROI analytics.
              </p>
            </div>
          </div>

          {!isBrokerUser ? (
            /* BROKER LOGIN GATEWAY */
            <div className="rounded-3xl bg-slate-900/90 border border-sky-500/30 p-6 sm:p-10 shadow-2xl space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 text-xs font-mono font-bold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-sky-400" />
                      BROKER COMMAND CENTER • LOGIN REQUIRED
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-mono">
                      TENANTS, OWNERS &amp; AGENTS
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Broker Command Center: Sign In to Access Live Listings &amp; Agreements
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
                    Exclusive gateway for tenants seeking verified PG rooms or rental houses, landlords listing properties with zero brokerage, and certified RERA broker agents. Please authenticate with your credentials or use 1-click instant demo access below.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => scrollToSection('sec-client-login')}
                    className="px-3.5 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Client Login</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToSection('sec-main-platform')}
                    className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Studio Login</span>
                  </button>
                </div>
              </div>

              {/* 1-Click Fast Instant Demo Access for Broker, Landlord, and Tenant */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-950/60 via-slate-900 to-emerald-950/30 border border-sky-500/40 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-mono font-bold text-sky-300 flex items-center gap-1.5 uppercase">
                    <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                    Instant 1-Click Broker &amp; Real Estate Sign-In
                  </span>
                  <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded font-mono font-bold">
                    SELECT PERSONA TO UNLOCK COMMAND CENTER
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => loginAsDemo('user-sneha-09')}
                    className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-sky-500/40 hover:border-sky-400 transition text-left group flex items-start gap-3"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80"
                      alt="Sneha Kulkarni"
                      className="w-10 h-10 rounded-lg object-cover border border-sky-500/40 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white group-hover:text-sky-300 flex items-center gap-1">
                        <span>Sneha Kulkarni</span>
                        <CheckCircle2 className="w-3 h-3 text-sky-400 inline" />
                      </div>
                      <div className="text-[11px] text-sky-400 font-mono">Certified Broker Agent</div>
                      <div className="text-[10px] text-slate-400 truncate">RERA East Bangalore Cluster</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => loginAsDemo('user-vikram-08')}
                    className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-sky-400 transition text-left group flex items-start gap-3"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80"
                      alt="Vikramaditya Reddy"
                      className="w-10 h-10 rounded-lg object-cover border border-slate-700 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white group-hover:text-sky-300">Vikramaditya Reddy</div>
                      <div className="text-[11px] text-emerald-400 font-mono">Property Owner / Landlord</div>
                      <div className="text-[10px] text-slate-400 truncate">18 PG &amp; Flat Units Managed</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => loginAsDemo('user-aarav-07')}
                    className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-sky-400 transition text-left group flex items-start gap-3"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                      alt="Aarav Sharma"
                      className="w-10 h-10 rounded-lg object-cover border border-slate-700 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white group-hover:text-sky-300">Aarav Sharma</div>
                      <div className="text-[11px] text-amber-400 font-mono">Prospective Tenant</div>
                      <div className="text-[10px] text-slate-400 truncate">Software Engineer • PG Seeker</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Broker Credentials Form & Highlights */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="space-y-4 p-6 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-sky-400" />
                      Broker &amp; Real Estate Sign In
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">0% BROKERAGE DIRECT</span>
                  </div>

                  {brokerLoginError && (
                    <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{brokerLoginError}</span>
                    </div>
                  )}

                  <form onSubmit={handleBrokerLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={brokerLoginEmail}
                        onChange={(e) => setBrokerLoginEmail(e.target.value)}
                        placeholder="e.g. sneha.kulkarni@gousebroker.com or aarav.sharma@techblr.com"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        value={brokerLoginPassword}
                        onChange={(e) => setBrokerLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 transition"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <label className="flex items-center gap-1.5 text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={brokerRememberMe}
                          onChange={(e) => setBrokerRememberMe(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-0"
                        />
                        <span>Remember broker device</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => scrollToSection('sec-client-login')}
                        className="text-purple-400 hover:underline"
                      >
                        Client Login Instead?
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingBrokerLogin}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 transition disabled:opacity-50"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>{isSubmittingBrokerLogin ? 'Authenticating...' : 'Sign In to Broker Command Center'}</span>
                    </button>
                  </form>
                </div>

                {/* Feature Highlights Grid */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Broker Command Center Capabilities Unlocked:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-sky-400" />
                        <span>1. Verified PG Beds</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Live bed inventory (Single, Double, Triple AC) with Wi-Fi and food menu verification.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5 text-sky-400" />
                        <span>2. Rental Houses &amp; Flats</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        1BHK, 2BHK, 3BHK flats, and luxury duplexes direct from landlords with zero commission.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>3. AI Tenant Matchmaker</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Algorithmic matching of tenant commute distance, budget, food habits, and credit scores.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-emerald-400" />
                        <span>4. Digital Lease Generator</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Automated 11-month rental contracts with Aadhaar KYC, stamp duty, and e-signatures.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                        <span>5. Yield &amp; ROI Analytics</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Calculates net rental yields, capitalization rates, cash flow, and occupancy trends.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>6. Escrow &amp; Deposit Guard</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Digital security deposit escrow protection ensuring seamless refund upon move-out.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* AUTHENTICATED BROKER COMMAND CENTER */
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-sky-950/40 border border-sky-500/30 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-sky-300">
                    BROKER COMMAND CENTER ACTIVE • Authenticated as {user?.name} ({user?.role?.replace('_', ' ').toUpperCase()})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                    {user?.company || 'Gouse Broker Network'}
                  </span>
                  <button
                    type="button"
                    onClick={logout}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold transition"
                  >
                    Lock Broker Center
                  </button>
                </div>
              </div>

              {/* Embedded Full Gouse AI Agent Broker Command Center */}
              <GouseAiAgentBrokerView
                project={activeProject}
                onUpdateProject={onUpdateProject}
                currency={currency}
                isOutsidePlatform={false}
              />
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. CLIENT FEEDBACK, RATINGS & VERIFIED REVIEWS                             */}
      {/* ========================================================================= */}
      <section id="sec-client-feedback" className="py-16 border-b border-slate-800 bg-slate-950 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                  4.98 ★ VERIFIED CLIENT FEEDBACK
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-mono">
                  {feedbackList.length} CLIENT REVIEWS
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                Client Project Feedback &amp; Stakeholder Testimonials
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
                Direct reviews from luxury homeowners, co-living developers, and institutional investors on architectural rigor, cost savings, and rental yield performance.
              </p>
            </div>

            <a
              href="#form-submit-feedback"
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center gap-2 shrink-0"
            >
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span>Leave Client Feedback</span>
            </a>
          </div>

          {/* Feedback Testimonial Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {feedbackList.map((item) => (
              <div
                key={item.id}
                className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4 hover:border-amber-500/30 transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Rating Stars & Category Tag */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${
                            s <= item.rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-700'
                          }`}
                        />
                      ))}
                      <span className="ml-1.5 text-xs font-mono font-bold text-amber-300">
                        {item.rating}.0
                      </span>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      {item.category}
                    </span>
                  </div>

                  {/* Comment */}
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
                    &ldquo;{item.comment}&rdquo;
                  </p>
                </div>

                {/* Client Profile & Project Info */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.avatarUrl}
                      alt={item.clientName}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0"
                    />
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{item.clientName}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className="text-[10px] text-amber-400/90 font-mono truncate max-w-[200px]">
                        {item.clientRole}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                        {item.projectName}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono shrink-0">
                    {item.date}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Client Feedback Submission Form */}
          <div
            id="form-submit-feedback"
            className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-amber-400" />
                  <span>Submit Client Review &amp; Architectural Feedback</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Your feedback helps maintain the Council of Architecture benchmark and fair-housing zero-brokerage standards.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400">Public Client Wall</span>
            </div>

            {feedbackSubmitSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Thank you! Your verified client review has been recorded and posted to the feedback wall.
                </span>
              </div>
            )}

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newFeedbackName}
                    onChange={(e) => setNewFeedbackName(e.target.value)}
                    placeholder="e.g. Sameer Khan / Meera Nambiar"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Project / Property Name
                  </label>
                  <input
                    type="text"
                    value={newFeedbackProject}
                    onChange={(e) => setNewFeedbackProject(e.target.value)}
                    placeholder="e.g. Palm Crest Villa / HSR PG"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Service Category
                  </label>
                  <select
                    value={newFeedbackCategory}
                    onChange={(e) => setNewFeedbackCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Architectural BIM">Architectural BIM &amp; CAD</option>
                    <option value="Turnkey BOQ">Turnkey BOQ &amp; Cost Audits</option>
                    <option value="AI Site Cam Audit">AI Site Cam &amp; Escrow</option>
                    <option value="Rental Brokerage">Rental Brokerage &amp; Leasing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Rating (Select Stars)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewFeedbackRating(star)}
                      className="p-1 text-slate-500 hover:text-amber-400 transition"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= newFeedbackRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-mono font-bold text-amber-300 ml-2">
                    {newFeedbackRating} of 5 Stars
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Your Detailed Review &amp; Experience *
                </label>
                <textarea
                  required
                  rows={3}
                  value={newFeedbackComment}
                  onChange={(e) => setNewFeedbackComment(e.target.value)}
                  placeholder="Share your experience regarding drawing quality, cost accuracy, construction milestone delivery, or tenant leasing..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Publicly verified on the Gouse AI Stakeholder Wall</span>
                </span>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post Client Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. CLIENT LOGIN & STAKEHOLDER ACCESS PORTAL                                */}
      {/* ========================================================================= */}
      <section id="sec-client-login" className="py-16 bg-slate-950/80 scroll-mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Section Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-mono font-bold">
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              CLIENT LOGIN &amp; STAKEHOLDER GATEWAY
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Sign In to Your Client Project Portal
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              Access your private project contracts, verified milestone completion approvals, shared high-resolution architectural drawings, and escrow payouts.
            </p>
          </div>

          {/* Client Login Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-purple-500/30 shadow-2xl space-y-6">
            {user ? (
              /* Already Signed In View */
              <div className="space-y-4 text-center py-6">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center mx-auto text-xl font-bold font-mono">
                  {user.name.charAt(0)}
                </div>

                <div className="space-y-1">
                  <div className="text-lg font-bold text-white flex items-center justify-center gap-2">
                    <span>Welcome, {user.name}</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    Signed in as <strong className="text-amber-400 capitalize">{user.role}</strong> ({user.email})
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 max-w-md mx-auto text-left space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Active Project:</span>
                    <span className="text-amber-400 font-bold">{activeProject.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Location:</span>
                    <span className="text-slate-200">{activeProject.location}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Physical Progress:</span>
                    <span className="text-emerald-400 font-bold">68% Verified</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  {onOpenClientDashboard && (
                    <button
                      type="button"
                      onClick={onOpenClientDashboard}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/20 transition"
                    >
                      <Building className="w-4 h-4" />
                      <span>Open Full Client Dashboard</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={logout}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-white text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Client Login Form */
              <div className="space-y-6">
                {loginError && (
                  <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                {/* 1-Click Fast Client Demo Login Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-amber-950/40 border border-purple-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-purple-300 flex items-center gap-1.5 uppercase">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      Instant 1-Click Client Login
                    </span>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-mono font-bold">
                      VERIFIED CLIENT
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Test client access immediately with pre-configured milestone approvals and drawing records:
                  </p>
                  <button
                    type="button"
                    onClick={() => loginAsDemo('user-sameer-05')}
                    className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 transition"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>1-Click Sign In: Sameer Khan (Prestige Urban Ventures)</span>
                  </button>
                </div>

                <div className="relative flex items-center justify-center">
                  <div className="border-t border-slate-800 w-full" />
                  <span className="bg-slate-900 px-3 text-[11px] font-mono text-slate-500 uppercase">
                    Or Sign In with Credentials
                  </span>
                </div>

                <form onSubmit={handleClientLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Client Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. sameer.khan@prestigeheights.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 transition"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-1.5 text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-950 text-purple-500 focus:ring-0"
                      />
                      <span>Remember this client device</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setIsBrokerAuthOpen(true)}
                      className="text-amber-400 hover:underline"
                    >
                      Looking for Tenant/Broker Login?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingLogin}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isSubmittingLogin ? 'Authenticating...' : 'Sign In as Client'}</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FOOTER                                                                    */}
      {/* ========================================================================= */}
      <footer className="bg-slate-950 border-t border-slate-800 py-10 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">GOUSE AI AGENT</span>
            <span>•</span>
            <span>All-In-One Architectural, Broker &amp; Client Platform</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <span>IS 456 Structural Audit</span>
            <span>•</span>
            <span>CPWD Schedule 2026</span>
            <span>•</span>
            <span>BBMP A-Khata Direct</span>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {isWorkflowEngineOpen && (
        <SequentialWorkflowEngineModal
          isOpen={isWorkflowEngineOpen}
          onClose={() => setIsWorkflowEngineOpen(false)}
          activeProject={activeProject}
          onUpdateProject={onUpdateProject || (() => {})}
          currency={currency}
        />
      )}

      {isSiteCameraOpen && (
        <SiteVisitCameraModal
          isOpen={isSiteCameraOpen}
          onClose={() => setIsSiteCameraOpen(false)}
          activeProject={activeProject}
        />
      )}

      {isBrokerAuthOpen && (
        <BrokerAuthModal
          isOpen={isBrokerAuthOpen}
          onClose={() => setIsBrokerAuthOpen(false)}
        />
      )}

      {isGeneralAuthOpen && (
        <AuthModal />
      )}
    </div>
  );
};
