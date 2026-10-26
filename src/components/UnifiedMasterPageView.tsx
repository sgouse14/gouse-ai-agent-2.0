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
  Film,
  Play,
  Image as ImageIcon,
  Cpu,
} from 'lucide-react';
import {
  Project,
  BOQItem,
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
import { SocialMediaHubPage } from './SocialMediaHubPage';
import { SmartHomeSkaAgent } from './SmartHomeSkaAgent';
import { AutonomousAgentExecutionCenter } from './AutonomousAgentExecutionCenter';
import { AgentDecisionTicker } from './AgentDecisionTicker';
import { AgentFloatingHUD } from './AgentFloatingHUD';

// Import local image assets for media previews
import villaExteriorImg from '../assets/images/bangalore_house_exterior_1790170528532.jpg';
import siteFramingImg from '../assets/images/bangalore_builder_proj1_1790170892084.jpg';
import villaElevationImg from '../assets/images/bangalore_builder_proj2_1790170907606.jpg';
import courtyardInteriorImg from '../assets/images/pg_dining_lounge_1790170229065.jpg';
import masterSuiteImg from '../assets/images/pg_bedroom_suite_1790170216460.jpg';

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
  onOpenSocialHub?: () => void;
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
  onOpenSocialHub,
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

  // Separate Full Page State for Social & Media Hub (PHOTOS & VIDEOS)
  const [isInternalSeparateSocialPage, setIsInternalSeparateSocialPage] = useState(false);

  const handleOpenSocialHub = () => {
    if (onOpenSocialHub) {
      onOpenSocialHub();
    } else {
      setIsInternalSeparateSocialPage(true);
    }
  };

  // Main Platform sub-tab state ('projects' | 'boq' | 'materials' | 'marketplace' | 'specialist')
  const [activeMainTab, setActiveMainTab] = useState<
    'projects' | 'boq' | 'materials' | 'marketplace' | 'specialist'
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
  const [isSkaModalOpen, setIsSkaModalOpen] = useState(false);

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
  const [newFeedbackRating, setNewFeedbackRating] = useState<number>(5);
  const [newFeedbackCategory, setNewFeedbackCategory] = useState<
    'Architectural BIM' | 'Turnkey BOQ' | 'AI Site Cam Audit' | 'Rental Brokerage'
  >('Architectural BIM');
  const [newFeedbackComment, setNewFeedbackComment] = useState('');
  const [feedbackSubmitSuccess, setFeedbackSubmitSuccess] = useState(false);

  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsSubmittingLogin(true);

    try {
      const trimmed = loginEmail.trim().toLowerCase();
      if (!trimmed) {
        setLoginError('Please enter your client email address');
        setIsSubmittingLogin(false);
        return;
      }
      const res = await login(trimmed, loginPassword);
      if (!res.success) {
        loginAsDemo('user-sameer-05');
      }
    } catch {
      setLoginError('Client sign in failed. You may use 1-click client demo access.');
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleAddFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedbackName.trim() || !newFeedbackComment.trim()) return;

    const newItem: ClientFeedbackItem = {
      id: `fb-${Date.now()}`,
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

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // If user opened separate full-screen page for Social & Media Hub internally:
  if (isInternalSeparateSocialPage) {
    return (
      <SocialMediaHubPage
        activeProject={activeProject}
        projects={projects}
        onSelectProject={onSelectProject}
        onClose={() => setIsInternalSeparateSocialPage(false)}
        onOpenWorkflowEngine={onOpenWorkflowEngine}
      />
    );
  }

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
                  GOUSE <span className="text-cyan-400">AI</span> AUTONOMOUS AGENT
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  AUTONOMOUS EXECUTION
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-tight hidden sm:block">
                Proactive Objective Management • Autonomous Architectural &amp; Real Estate Execution
              </p>
            </div>
          </div>

          {/* Direct In-Page Anchor Navigation */}
          <nav className="flex items-center gap-2 sm:gap-3 text-xs font-semibold overflow-x-auto py-1 scrollbar-none">
            <button
              type="button"
              onClick={() => scrollToSection('sec-main-platform')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 border border-cyan-500/30 transition whitespace-nowrap"
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Architectural Execution</span>
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('sec-broker-command-center')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/40 font-bold transition whitespace-nowrap shadow-sm shadow-sky-500/20"
            >
              <Building className="w-3.5 h-3.5 text-sky-400" />
              <span>Broker Execution Center {isBrokerUser ? '(Active)' : '(Login)'}</span>
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('sec-social-media-hub')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30 transition whitespace-nowrap"
            >
              <Film className="w-3.5 h-3.5 text-rose-400" />
              <span>Social &amp; Media Hub</span>
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

            <button
              type="button"
              id="nav-btn-smart-home-ska-agent"
              onClick={() => setIsSkaModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 transition whitespace-nowrap shadow-sm"
              title="Open Smart Home SKA (Supervisory Kontrol & Automation) Agent"
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Smart Home SKA Agent</span>
            </button>
          </nav>

          {/* User Auth Action Pill */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenSocialHub}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs transition shadow-sm"
              title="Launch Social & Media Hub on Separate Dedicated Page"
            >
              <Film className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Separate Hub Page</span>
              <ExternalLink className="w-3 h-3" />
            </button>

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
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 0.5. REAL-TIME AUTONOMOUS DECISION STREAM TICKER                          */}
      {/* ========================================================================= */}
      <AgentDecisionTicker onSelectAction={(sec) => scrollToSection(sec)} />

      {/* ========================================================================= */}
      {/* AUTONOMOUS AI AGENT EXECUTION CENTER (NOT GENERIC PLATFORM)               */}
      {/* ========================================================================= */}
      <AutonomousAgentExecutionCenter
        activeProject={activeProject}
        onNavigateSection={scrollToSection}
        onOpenSocialHub={handleOpenSocialHub}
        onOpenBrokerCenter={() => scrollToSection('sec-broker-command-center')}
        onOpenSmartHomeSka={() => setIsSkaModalOpen(true)}
        onOpenClientPortal={onOpenClientDashboard}
      />

      {/* ========================================================================= */}
      {/* 1. MAIN STUDIO PLATFORM: ARCHITECTURAL, BIM, BOQ & ENGINEERING WORKSPACE   */}
      {/* ========================================================================= */}
      <section id="sec-main-platform" className="py-12 border-b border-slate-800 bg-slate-950 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Main Platform Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  AUTONOMOUS OBJECTIVE 1: ARCHITECTURAL &amp; ENGINEERING EXECUTION
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-mono">
                  ACTIVE AGENT WORKSPACE
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                Architectural Execution: Projects, Dynamic BOQ, Materials &amp; Autonomous Co-Pilot
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
                Autonomous architectural execution engine. Inspect 3D BIM models, simulate floor-by-floor takeoff items, review verified building material specifications, consult the verified AEC marketplace, or execute direct structural audits with Ar. S. Gouse.
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

              <button
                type="button"
                onClick={handleOpenSocialHub}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 font-bold text-xs transition"
              >
                <Film className="w-3.5 h-3.5 text-rose-400" />
                <span>Social Media Hub</span>
              </button>

              <button
                type="button"
                onClick={() => setIsBrokerAuthOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 font-bold text-xs transition"
              >
                <Building className="w-3.5 h-3.5 text-sky-400" />
                <span>Broker Login</span>
              </button>
            </div>
          </div>

          {!isStudioStaff ? (
            /* STUDIO PLATFORM LOGIN GATEWAY */
            <div className="rounded-3xl bg-slate-900/90 border border-amber-500/30 p-6 sm:p-10 shadow-2xl space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      MAIN STUDIO PLATFORM • STAFF AUTHENTICATION REQUIRED
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-mono">
                      ARCHITECTS &amp; ENGINEERS
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Main Platform: Sign In with Studio Credentials
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
                    Access the complete architectural CAD/BIM studio suite, dynamic takeoff calculations, professional directory, and specialist co-pilot. Sign in using your studio email or use 1-click instant demo access below.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => loginAsDemo('user-gouse-01')}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 transition"
                  >
                    <Sparkles className="w-4 h-4 fill-slate-950" />
                    <span>1-Click Demo Login (Gouse AI)</span>
                  </button>
                </div>
              </div>

              {/* Login Form */}
              <div className="max-w-xl mx-auto space-y-5">
                {studioLoginError && (
                  <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
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
                      placeholder="e.g. sgouse14@gmail.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={studioLoginPassword}
                      onChange={(e) => setStudioLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-1.5 text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={studioRememberMe}
                        onChange={(e) => setStudioRememberMe(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0"
                      />
                      <span>Remember this studio workstation</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => loginAsDemo('user-priya-02')}
                      className="text-amber-400 hover:underline"
                    >
                      Sign In as Senior Architect (Priya)
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingStudioLogin}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
                  >
                    <LogIn className="w-4 h-4 fill-slate-950" />
                    <span>{isSubmittingStudioLogin ? 'Authenticating Studio...' : 'Sign In to Studio Workspace'}</span>
                  </button>
                </form>

                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Need client access instead?</span>
                  <button
                    type="button"
                    onClick={() => scrollToSection('sec-client-login')}
                    className="text-purple-400 hover:text-purple-300 font-semibold"
                  >
                    Go to Client Login ↓
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* STUDIO STAFF AUTHENTICATED: RENDER FULL SUITE */
            <>
              {/* Studio Navigation Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveMainTab('projects')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    activeMainTab === 'projects'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Projects &amp; 3D BIM</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMainTab('boq')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    activeMainTab === 'boq'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <Calculator className="w-4 h-4" />
                  <span>Dynamic BOQ &amp; Cost Engine</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMainTab('materials')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    activeMainTab === 'materials'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Materials &amp; Schedule</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMainTab('marketplace')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    activeMainTab === 'marketplace'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <HardHat className="w-4 h-4" />
                  <span>Marketplace &amp; Directory</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMainTab('specialist')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    activeMainTab === 'specialist'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <Bot className="w-4 h-4" />
                  <span>Specialist Co-Pilot</span>
                </button>
              </div>

              {/* Tab Content Panes */}
              <div className="rounded-3xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-2xl">
                {activeMainTab === 'projects' && (
                  <ProjectsView
                    projects={projects}
                    activeProject={activeProject}
                    onSelectProject={handleSelectProject}
                    onUpdateProject={onUpdateProject || (() => {})}
                    onCreateProject={onCreateProject || (() => {})}
                    currency={activeCurrency}
                    onOpenWorkflowEngine={() => {
                      if (onOpenWorkflowEngine) onOpenWorkflowEngine();
                      else setIsWorkflowEngineOpen(true);
                    }}
                    onOpenSiteCamera={() => {
                      if (onOpenSiteCamera) onOpenSiteCamera();
                      else setIsSiteCameraOpen(true);
                    }}
                  />
                )}

                {activeMainTab === 'boq' && (
                  <div className="max-w-7xl mx-auto px-2 sm:px-6 py-6 space-y-6">
                    <BOQView
                      items={currentBoqItems}
                      onUpdateItems={handleUpdateBoqItems}
                      contingencyPercent={currentContingency}
                      onChangeContingency={handleChangeContingency}
                      currency={activeCurrency}
                      activeProject={activeProject}
                      onUpdateProject={onUpdateProject}
                      onAddEnquiry={handleAddEnquiry}
                      onOpenWorkflowEngine={() => {
                        if (onOpenWorkflowEngine) onOpenWorkflowEngine();
                        else setIsWorkflowEngineOpen(true);
                      }}
                    />
                  </div>
                )}

                {activeMainTab === 'materials' && (
                  <div className="max-w-7xl mx-auto px-2 sm:px-6 py-6 space-y-6">
                    <MaterialsView
                      activeProject={activeProject}
                      currency={activeCurrency}
                      boqItems={currentBoqItems}
                      onUpdateBOQItems={handleUpdateBoqItems}
                      onUpdateProject={onUpdateProject}
                      onNavigateToBOQ={() => setActiveMainTab('boq')}
                      onNavigateToMarketplace={(category, query) => {
                        setMarketplaceCategory(category);
                        setMarketplaceQuery(query);
                        setActiveMainTab('marketplace');
                      }}
                      onOpenWorkflowEngine={() => {
                        if (onOpenWorkflowEngine) onOpenWorkflowEngine();
                        else setIsWorkflowEngineOpen(true);
                      }}
                    />
                  </div>
                )}

                {activeMainTab === 'marketplace' && (
                  <div className="max-w-7xl mx-auto px-2 sm:px-6 py-6 space-y-6">
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
                      initialSearchQuery={marketplaceQuery}
                      projectCity={activeProject.location}
                    />
                  </div>
                )}

                {activeMainTab === 'specialist' && (
                  <div className="max-w-7xl mx-auto px-2 sm:px-6 py-6 space-y-6">
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
                      <div className="text-[10px] text-slate-400 truncate">RERA Reg: PRM/KA/RERA/1251</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => loginAsDemo('user-vikram-08')}
                    className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 hover:border-emerald-400 transition text-left group flex items-start gap-3"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80"
                      alt="Vikramaditya Reddy"
                      className="w-10 h-10 rounded-lg object-cover border border-emerald-500/40 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white group-hover:text-emerald-300 flex items-center gap-1">
                        <span>Vikramaditya Reddy</span>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 inline" />
                      </div>
                      <div className="text-[11px] text-emerald-400 font-mono">Property Owner / Landlord</div>
                      <div className="text-[10px] text-slate-400 truncate">18 Units in Indiranagar &amp; HSR</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => loginAsDemo('user-aarav-07')}
                    className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-purple-500/40 hover:border-purple-400 transition text-left group flex items-start gap-3"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=120&q=80"
                      alt="Aarav Mehta"
                      className="w-10 h-10 rounded-lg object-cover border border-purple-500/40 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white group-hover:text-purple-300 flex items-center gap-1">
                        <span>Aarav Mehta</span>
                        <CheckCircle2 className="w-3 h-3 text-purple-400 inline" />
                      </div>
                      <div className="text-[11px] text-purple-400 font-mono">Tenant / PG Resident</div>
                      <div className="text-[10px] text-slate-400 truncate">Looking for PG bed in Indiranagar</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Persona Switcher Tabs */}
              <div className="space-y-4">
                <div className="flex border-b border-slate-800 gap-2">
                  <button
                    type="button"
                    onClick={() => setBrokerRoleTab('tenant')}
                    className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
                      brokerRoleTab === 'tenant'
                        ? 'border-sky-400 text-sky-300'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>Tenant Sign In</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBrokerRoleTab('property_owner')}
                    className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
                      brokerRoleTab === 'property_owner'
                        ? 'border-emerald-400 text-emerald-300'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Home className="w-4 h-4" />
                    <span>Landlord / Owner Sign In</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBrokerRoleTab('broker_agent')}
                    className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
                      brokerRoleTab === 'broker_agent'
                        ? 'border-purple-400 text-purple-300'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    <span>Certified Broker Sign In</span>
                  </button>
                </div>

                {/* Broker Form */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  <div className="space-y-4 p-6 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <span className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-sky-400" />
                        Credentials &amp; OTP Access
                      </span>
                      <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setBrokerAuthMethod('password')}
                          className={`px-2 py-0.5 rounded font-semibold transition ${
                            brokerAuthMethod === 'password'
                              ? 'bg-sky-500 text-slate-950 font-bold'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Password
                        </button>
                        <button
                          type="button"
                          onClick={() => setBrokerAuthMethod('otp')}
                          className={`px-2 py-0.5 rounded font-semibold transition ${
                            brokerAuthMethod === 'otp'
                              ? 'bg-sky-500 text-slate-950 font-bold'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Phone OTP
                        </button>
                      </div>
                    </div>

                    {brokerLoginError && (
                      <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{brokerLoginError}</span>
                      </div>
                    )}

                    {brokerAuthMethod === 'password' ? (
                      <form onSubmit={handleBrokerLogin} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            {brokerRoleTab === 'tenant' && 'Tenant Email Address'}
                            {brokerRoleTab === 'property_owner' && 'Landlord / Owner Email'}
                            {brokerRoleTab === 'broker_agent' && 'Certified Broker Email'}
                          </label>
                          <input
                            type="email"
                            required
                            value={brokerLoginEmail}
                            onChange={(e) => setBrokerLoginEmail(e.target.value)}
                            placeholder={
                              brokerRoleTab === 'tenant'
                                ? 'aarav.mehta@techcorridor.in'
                                : brokerRoleTab === 'property_owner'
                                ? 'vikram.reddy@realestate.in'
                                : 'sneha.kulkarni@rerabroker.in'
                            }
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
                            <span>Keep me signed in</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => setIsBrokerAuthOpen(true)}
                            className="text-sky-400 hover:underline"
                          >
                            New user? Register now
                          </button>
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmittingBrokerLogin}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 transition disabled:opacity-50"
                        >
                          <LogIn className="w-4 h-4" />
                          <span>
                            {isSubmittingBrokerLogin
                              ? 'Signing In...'
                              : `Sign In as ${
                                  brokerRoleTab === 'tenant'
                                    ? 'Tenant'
                                    : brokerRoleTab === 'property_owner'
                                    ? 'Property Owner'
                                    : 'Certified Broker'
                                }`}
                          </span>
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={brokerOtpSent ? handleVerifyBrokerOtp : handleSendBrokerOtp} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Registered Mobile Number (+91)
                          </label>
                          <div className="flex gap-2">
                            <div className="px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-slate-300">
                              +91
                            </div>
                            <input
                              type="tel"
                              required
                              value={brokerPhone}
                              onChange={(e) => setBrokerPhone(e.target.value)}
                              placeholder="98450 12345"
                              disabled={brokerOtpSent}
                              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 transition disabled:opacity-60"
                            />
                          </div>
                        </div>

                        {brokerOtpSent && (
                          <div className="space-y-2">
                            <label className="block text-xs font-semibold text-slate-300">
                              Enter 6-Digit OTP Code
                            </label>
                            <input
                              type="text"
                              required
                              maxLength={6}
                              value={brokerOtp}
                              onChange={(e) => setBrokerOtp(e.target.value)}
                              placeholder="123456"
                              className="w-full bg-slate-900 border border-sky-500 rounded-xl px-3.5 py-2.5 text-center tracking-widest text-lg font-mono text-white focus:outline-none transition"
                            />
                            <p className="text-[11px] text-emerald-400 font-mono">
                              ✓ OTP sent to +91 {brokerPhone} (Enter any 6 digits for demo)
                            </p>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={isSubmittingBrokerLogin}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 transition disabled:opacity-50"
                        >
                          <Zap className="w-4 h-4 fill-slate-950" />
                          <span>{brokerOtpSent ? 'Verify OTP & Enter Command Center' : 'Send One-Time Password'}</span>
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Highlights of Command Center */}
                  <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                    <h4 className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-sky-400" />
                      What You Unlock Inside Broker Command Center
                    </h4>

                    <ul className="space-y-3 text-xs text-slate-300">
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>0% Brokerage PG &amp; Co-Living:</strong> Direct verified beds with high-speed WiFi, biometric locks, 3-tier meals, and power backup.
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>AI Tenant Matchmaker:</strong> Instant matching based on commute distances to Manyata, Bagmane, EGL &amp; Electronic City.
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>Digital Stamp Duty &amp; E-Lease:</strong> Automated 11-month Karnataka digital rental agreements ready for e-signature.
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>Real Estate ROI &amp; Yield Engine:</strong> Analyze cap rates, rental yield % per sq.ft, and occupancy forecasts.
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* BROKER USER AUTHENTICATED: RENDER FULL AGENT VIEW */
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-sky-950/40 border border-sky-500/30 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center justify-center font-mono font-bold text-lg">
                    {user?.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{user?.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 capitalize">
                        {user?.role.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono">
                      Logged in to Broker Command Center • 0% Brokerage Direct Mode
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsBrokerAuthOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold transition"
                  >
                    Switch Persona
                  </button>
                  <button
                    type="button"
                    onClick={logout}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold transition flex items-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
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
      {/* 3. SOCIAL & MEDIA HUB: PHOTOS & VIDEOS (SEPARATE PAGE SHOWCASE)            */}
      {/* ========================================================================= */}
      <section id="sec-social-media-hub" className="py-14 border-b border-slate-800 bg-slate-900/40 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-mono font-bold flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-rose-400" />
                  PILLAR 3: SOCIAL &amp; MEDIA HUB
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-rose-300 border border-slate-700 text-[11px] font-mono">
                  PHOTOS &amp; VIDEOS STUDIO
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono">
                  4K LUMION &amp; DRONE REELS
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] font-mono">
                  360° SPATIAL TOUR &amp; WIPE
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[11px] font-mono">
                  AI REEL PRODUCER
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                Social &amp; Media Hub: Photos, 4K Videos, 360° Tours &amp; Campaigns
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
                Centralized architectural media vault for high-resolution DSLR photography, 4K Lumion walkthrough videos, construction site drone reels, 360° spatial room navigator, interactive before/after construction wipe slider, and multi-channel marketing campaigns.
              </p>
            </div>

            <button
              type="button"
              id="btn-open-separate-social-page"
              onClick={handleOpenSocialHub}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-500/25 transition shrink-0 group"
            >
              <Film className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Open Social &amp; Media Hub (Separate Page)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 4 Preview Cards showcasing Photos & Videos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: 3D Walkthrough Video */}
            <div className="group rounded-2xl bg-slate-950 border border-slate-800 hover:border-rose-500/50 overflow-hidden transition-all duration-300 flex flex-col">
              <div className="relative aspect-video overflow-hidden bg-slate-900">
                <img
                  src={courtyardInteriorImg}
                  alt="3D Lumion Walkthrough"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />
                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-rose-600/90 text-white font-mono text-[10px] font-bold flex items-center gap-1">
                  <Film className="w-3 h-3" />
                  <span>4K VIDEO • 02:14</span>
                </span>
                <button
                  type="button"
                  onClick={handleOpenSocialHub}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="w-12 h-12 rounded-full bg-rose-500/90 hover:bg-rose-400 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 ml-0.5 fill-white" />
                  </div>
                </button>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-rose-300 transition line-clamp-1">
                    3D Lumion Architectural Walkthrough
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                    Biophilic double-height courtyard featuring NBC 2016 solar passive daylighting.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
                  <span className="text-rose-400 font-bold">YouTube / Shorts</span>
                  <span>2,840 views</span>
                </div>
              </div>
            </div>

            {/* Card 2: Signature Elevation Photo */}
            <div className="group rounded-2xl bg-slate-950 border border-slate-800 hover:border-rose-500/50 overflow-hidden transition-all duration-300 flex flex-col">
              <div className="relative aspect-video overflow-hidden bg-slate-900">
                <img
                  src={villaExteriorImg}
                  alt="Signature Villa Elevation"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />
                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-sky-600/90 text-white font-mono text-[10px] font-bold flex items-center gap-1">
                  <Camera className="w-3 h-3" />
                  <span>4K PHOTO • UHD</span>
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-sky-300 transition line-clamp-1">
                    Signature Front Elevation &amp; Cantilevers
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                    Twilight elevation render showcasing wire-cut exposed brickwork and slate cladding.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
                  <span className="text-sky-400 font-bold">Instagram Post</span>
                  <span>4,520 views</span>
                </div>
              </div>
            </div>

            {/* Card 3: Drone Survey Video */}
            <div className="group rounded-2xl bg-slate-950 border border-slate-800 hover:border-rose-500/50 overflow-hidden transition-all duration-300 flex flex-col">
              <div className="relative aspect-video overflow-hidden bg-slate-900">
                <img
                  src={siteFramingImg}
                  alt="Drone Survey Reel"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />
                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-purple-600/90 text-white font-mono text-[10px] font-bold flex items-center gap-1">
                  <Film className="w-3 h-3" />
                  <span>DRONE REEL • 00:45</span>
                </span>
                <button
                  type="button"
                  onClick={handleOpenSocialHub}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="w-12 h-12 rounded-full bg-purple-500/90 hover:bg-purple-400 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 ml-0.5 fill-white" />
                  </div>
                </button>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition line-clamp-1">
                    Drone Aerial Survey &amp; Setback Verification
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                    High-altitude 4K drone cinematography documenting structural grid symmetry.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
                  <span className="text-purple-400 font-bold">Instagram Reel</span>
                  <span>6,120 views</span>
                </div>
              </div>
            </div>

            {/* Card 4: Master Suite Interior Photo */}
            <div className="group rounded-2xl bg-slate-950 border border-slate-800 hover:border-rose-500/50 overflow-hidden transition-all duration-300 flex flex-col">
              <div className="relative aspect-video overflow-hidden bg-slate-900">
                <img
                  src={masterSuiteImg}
                  alt="Master Suite Interior"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />
                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-amber-600/90 text-white font-mono text-[10px] font-bold flex items-center gap-1">
                  <Camera className="w-3 h-3" />
                  <span>4K PHOTO • INTERIOR</span>
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition line-clamp-1">
                    Master Bedroom Suite &amp; Teak Louvers
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                    Interior styling with ambient LED coves and Italian marble floor takeoffs.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
                  <span className="text-amber-400 font-bold">Pinterest / IG</span>
                  <span>3,120 views</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Banner with Direct Separate Page Action */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-950/50 via-slate-900 to-purple-950/40 border border-rose-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">
                  Want the full-screen separate page with all photos, videos &amp; AI ad copywriter?
                </h4>
                <p className="text-[11px] text-slate-400">
                  Includes full HD video player, photo tagging, cross-channel publishing, and marketing analytics.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenSocialHub}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-rose-600/20 transition whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Launch Separate Page Now</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. CLIENT FEEDBACK, RATINGS & VERIFIED REVIEWS                             */}
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
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
                Real feedback from private villa owners, commercial developers, and institutional clients across Bangalore.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('feedback-form-box');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition shrink-0"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Write Client Review</span>
            </button>
          </div>

          {/* Feedback Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {feedbackList.map((item) => (
              <div
                key={item.id}
                className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-all duration-300 space-y-4 shadow-xl flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.avatarUrl}
                        alt={item.clientName}
                        className="w-11 h-11 rounded-2xl object-cover border border-emerald-500/30"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                          <span>{item.clientName}</span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />
                        </h4>
                        <p className="text-[11px] text-slate-400 font-medium">{item.clientRole}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                      {[...Array(item.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80">
                    "{item.comment}"
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-bold">{item.projectName}</span>
                    <span>•</span>
                    <span>{item.projectLocation}</span>
                  </div>
                  <span className="text-emerald-400 font-bold">{item.category}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Review Submission Form */}
          <div id="feedback-form-box" className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-emerald-500/30 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 flex-wrap gap-2">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Submit Client Feedback &amp; Project Review</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Your verified testimonial will appear live on the Gouse AI Agent public showcase.
                </p>
              </div>

              {feedbackSubmitSuccess && (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold flex items-center gap-1.5 animate-pulse">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Review Published Live!
                </span>
              )}
            </div>

            <form onSubmit={handleAddFeedback} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Your Full Name &amp; Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newFeedbackName}
                    onChange={(e) => setNewFeedbackName(e.target.value)}
                    placeholder="e.g. Sameer Khan, Managing Director"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Project Name &amp; Location
                  </label>
                  <input
                    type="text"
                    required
                    value={newFeedbackProject}
                    onChange={(e) => setNewFeedbackProject(e.target.value)}
                    placeholder="e.g. Prestige Heights, Indiranagar"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Service / Solution Category
                  </label>
                  <select
                    value={newFeedbackCategory}
                    onChange={(e) => setNewFeedbackCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 transition"
                  >
                    <option value="Architectural BIM">Architectural BIM &amp; 3D Coordination</option>
                    <option value="Turnkey BOQ">Turnkey BOQ &amp; CPWD Cost Audit</option>
                    <option value="AI Site Cam Audit">AI Geotagged Site Camera Audit</option>
                    <option value="Rental Brokerage">0% Brokerage PG &amp; Rental Management</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Rating (1 to 5 Stars)
                  </label>
                  <div className="flex items-center gap-2 pt-1">
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
                      {newFeedbackRating}.0 / 5.0
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Detailed Review &amp; Experience
                </label>
                <textarea
                  rows={3}
                  required
                  value={newFeedbackComment}
                  onChange={(e) => setNewFeedbackComment(e.target.value)}
                  placeholder="Share details on drawing precision, cost compliance, timeline adherence, or rental brokerage efficiency..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] font-mono text-slate-500">
                  ⚡ Authenticated via Gouse AI Client Escrow &amp; Review Protocol
                </span>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/20 transition"
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
      {/* 5. CLIENT LOGIN & STAKEHOLDER ACCESS PORTAL                                */}
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

      {/* SMART HOME SKA AGENT MODAL */}
      {isSkaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-5xl rounded-3xl bg-slate-950 border border-cyan-500/40 p-4 sm:p-6 shadow-2xl my-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center">
                  <Cpu className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <span>Smart Home SKA Agent Control Center</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      CLIENT PREVIEW
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Matter • KNX • DALI-2 • Solar Grid &amp; Daikin VRV IoT Supervisory Agent
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSkaModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition border border-slate-700"
              >
                ✕ Close
              </button>
            </div>

            <SmartHomeSkaAgent
              activeProject={activeProject}
              onOpenConsultation={() => {
                setIsSkaModalOpen(false);
                scrollToSection('sec-client-login');
              }}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PERSISTENT AUTONOMOUS AI AGENT FLOATING HUD                               */}
      {/* ========================================================================= */}
      <AgentFloatingHUD
        onOpenSkaAgent={() => setIsSkaModalOpen(true)}
        onOpenSocialHub={handleOpenSocialHub}
        onNavigateSection={(sec) => scrollToSection(sec)}
        architectPhone="+91 80739 47241"
      />
    </div>
  );
};
