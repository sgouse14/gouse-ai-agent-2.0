import React, { useState, useEffect, useMemo } from 'react';
import {
  Megaphone,
  Target,
  MapPin,
  Users,
  Sparkles,
  Play,
  Pause,
  Plus,
  Check,
  Copy,
  Trash2,
  Phone,
  MessageSquare,
  Download,
  ExternalLink,
  SlidersHorizontal,
  TrendingUp,
  Eye,
  MousePointerClick,
  UserCheck,
  Search,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Project } from '../types';
import { PROJECT_MEDIA, AVATARS } from '../utils/mediaAssets';

export type CampaignObjective = 'lead_form' | 'whatsapp' | 'site_visit' | 'reach';
export type AdChannel = 'meta_ig_fb' | 'ig_reels' | 'whatsapp' | 'google_local' | 'linkedin';
export type CampaignStatus = 'active' | 'paused' | 'ended';
export type LeadStatus = 'new' | 'contacted' | 'visit_booked' | 'quoted' | 'closed';

export interface AdPostReference {
  id: string;
  title: string;
  posterRole: string;
  posterName: string;
  posterHandle: string;
  posterAvatar: string;
  posterPhone: string;
  priceLabel: string;
  location: string;
  areaSpec: string;
  url: string;
  caption: string;
}

export interface AdCampaign {
  id: string;
  projectId: string;
  sourcePostId: string;
  name: string;
  objective: CampaignObjective;
  channels: AdChannel[];
  status: CampaignStatus;
  city: string;
  radiusKm: number;
  audiencePersona: string;
  dailyBudgetInr: number;
  durationDays: number;
  spentInr: number;
  impressions: number;
  clicks: number;
  leadsCount: number;
  headline: string;
  primaryText: string;
  description: string;
  ctaLabel: string;
  mediaUrl: string;
  posterName: string;
  posterHandle: string;
  posterAvatar: string;
  createdAt: string;
}

export interface AdLead {
  id: string;
  campaignId?: string;
  campaignName: string;
  sourceChannel: string;
  leadName: string;
  phone: string;
  requirement: string;
  city: string;
  budgetHint: string;
  status: LeadStatus;
  createdAt: string;
}

interface AdVariant {
  label: string;
  angle: string;
  primaryText: string;
  headline: string;
  description: string;
  ctaLabel: string;
}

interface SocialAdManagerProps {
  activeProject: Project;
  posts: AdPostReference[];
  preselectedPost?: AdPostReference | null;
  leads: AdLead[];
  onAddLead: (lead: AdLead) => void;
  onUpdateLeadStatus: (leadId: string, status: LeadStatus) => void;
  onDeleteLead: (leadId: string) => void;
}

const ADS_STORAGE_KEY = 'realstate_media_ads_v1';

const OBJECTIVE_LABELS: Record<CampaignObjective, { label: string; desc: string; avgCpl: number; ctr: number }> = {
  lead_form: {
    label: 'Instant Lead Form',
    desc: 'Capture verified phone & plot specs on IG/FB',
    avgCpl: 260,
    ctr: 2.35,
  },
  whatsapp: {
    label: 'WhatsApp Inquiries',
    desc: 'Direct click-to-chat inquiry threads',
    avgCpl: 210,
    ctr: 2.65,
  },
  site_visit: {
    label: 'Site Visit Bookings',
    desc: 'Weekend open house & studio walkthroughs',
    avgCpl: 340,
    ctr: 1.95,
  },
  reach: {
    label: 'Portfolio & Brand Reach',
    desc: 'High-frequency local architectural awareness',
    avgCpl: 150,
    ctr: 1.45,
  },
};

const CHANNEL_OPTIONS: { id: AdChannel; label: string; short: string }[] = [
  { id: 'meta_ig_fb', label: 'Instagram + Facebook Feed', short: 'IG + FB Feed' },
  { id: 'ig_reels', label: 'Instagram Reels (9:16)', short: 'IG Reels' },
  { id: 'whatsapp', label: 'WhatsApp Click-to-Chat', short: 'WhatsApp' },
  { id: 'google_local', label: 'Google Local Search', short: 'Google Search' },
  { id: 'linkedin', label: 'LinkedIn AEC Network', short: 'LinkedIn' },
];

const AUDIENCE_PERSONAS = [
  'Luxury Villa & Home Buyers',
  '30x40 / 40x60 Plot Owners',
  'Interior & Modular Kitchen Remodelers',
  'Architects & Turnkey Builders (B2B)',
  'PG & Co-Living Investors',
];

const CTA_OPTIONS = [
  'Book Site Visit',
  'Get BOQ & Quote',
  'Get Floor Plan & Price',
  'Request Interior Quote',
  'Request Rate Card',
  'Chat on WhatsApp',
];

const INITIAL_CAMPAIGNS: AdCampaign[] = [
  {
    id: 'camp-villa-launch',
    projectId: 'proj-1',
    sourcePostId: 'eco-re-whitefield-villa',
    name: 'Whitefield 4 BHK Courtyard Villa — Open House',
    objective: 'site_visit',
    channels: ['meta_ig_fb', 'whatsapp'],
    status: 'active',
    city: 'Whitefield, Bengaluru',
    radiusKm: 18,
    audiencePersona: 'Luxury Villa & Home Buyers',
    dailyBudgetInr: 2500,
    durationDays: 14,
    spentInr: 14200,
    impressions: 46800,
    clicks: 1084,
    leadsCount: 41,
    headline: 'Whitefield 4 BHK Villa · ₹2.85 Cr',
    primaryText:
      'Private weekend walkthroughs open at our newly handed-over 4 BHK courtyard villa in Whitefield (3,450 sq.ft, A-Khata & OC ready). Direct representation with complete BOQ & floor plans.',
    description: '40x60 East Facing · Direct Inspection',
    ctaLabel: 'Book Site Visit',
    mediaUrl: PROJECT_MEDIA.duskVillaCampaign,
    posterName: 'Gouse Real Estate Advisory',
    posterHandle: 'gouse_estates_blr',
    posterAvatar: AVATARS.principal,
    createdAt: '2026-11-18',
  },
  {
    id: 'camp-interior-fitout',
    projectId: 'proj-1',
    sourcePostId: 'eco-int-living-oak',
    name: 'Turnkey Interior & Modular Quartz Kitchens',
    objective: 'lead_form',
    channels: ['meta_ig_fb', 'ig_reels'],
    status: 'active',
    city: 'Indiranagar & Koramangala, Bengaluru',
    radiusKm: 15,
    audiencePersona: 'Interior & Modular Kitchen Remodelers',
    dailyBudgetInr: 1800,
    durationDays: 21,
    spentInr: 9600,
    impressions: 34200,
    clicks: 842,
    leadsCount: 36,
    headline: 'Bespoke Villa Interiors · ₹1,650/sq.ft',
    primaryText:
      'BWP marine ply cabinetry, fluted oak paneling, Italian statuario quartz islands, and 2700K magnetic track lighting delivered turnkey in 45 days. Get your room-wise BOQ quote.',
    description: '3D Renders + Line-Item Material Schedule',
    ctaLabel: 'Request Interior Quote',
    mediaUrl: PROJECT_MEDIA.luxuryInteriorLiving,
    posterName: 'Studio Vastu & Interior Atelier',
    posterHandle: 'studio_vastu_interiors',
    posterAvatar: AVATARS.seniorArchitect,
    createdAt: '2026-11-20',
  },
  {
    id: 'camp-turnkey-plot',
    projectId: 'proj-1',
    sourcePostId: 'eco-builder-sarjapur',
    name: '30x40 & 40x60 Turnkey Home Construction',
    objective: 'whatsapp',
    channels: ['whatsapp', 'google_local'],
    status: 'paused',
    city: 'Sarjapur & HSR Layout, Bengaluru',
    radiusKm: 20,
    audiencePersona: '30x40 / 40x60 Plot Owners',
    dailyBudgetInr: 1500,
    durationDays: 30,
    spentInr: 6800,
    impressions: 21900,
    clicks: 520,
    leadsCount: 28,
    headline: 'Turnkey Home Build · ₹2,150/sq.ft',
    primaryText:
      'Planning construction on a 30x40 or 40x60 plot in Bengaluru? Get IS 456 M25 structural framing, Jindal Fe-550D steel, and a stage-linked BOQ schedule within 24 hours.',
    description: 'Zero Cost Overrun · Live Site Audits',
    ctaLabel: 'Get BOQ & Quote',
    mediaUrl: PROJECT_MEDIA.builderProj1,
    posterName: 'Apex Turnkey Builders & Civil',
    posterHandle: 'apex_builders_blr',
    posterAvatar: AVATARS.structuralEngineer,
    createdAt: '2026-11-15',
  },
];

export const INITIAL_AD_LEADS: AdLead[] = [
  {
    id: 'lead-101',
    campaignId: 'camp-villa-launch',
    campaignName: 'Whitefield 4 BHK Courtyard Villa — Open House',
    sourceChannel: 'Instagram Feed Sponsored',
    leadName: 'Ananya Deshmukh',
    phone: '+91 98451 22410',
    requirement: 'Looking for 4 BHK corner villa inspection this Saturday 11 AM',
    city: 'Whitefield, Bengaluru',
    budgetHint: '₹2.75 Cr – ₹3.10 Cr',
    status: 'visit_booked',
    createdAt: '2h ago',
  },
  {
    id: 'lead-102',
    campaignId: 'camp-interior-fitout',
    campaignName: 'Turnkey Interior & Modular Quartz Kitchens',
    sourceChannel: 'Facebook Lead Form',
    leadName: 'Vikramaditya Rao',
    phone: '+91 99002 88134',
    requirement: '3 BHK penthouse (2,450 sq.ft) full modular kitchen, wardrobes & ceiling',
    city: 'Indiranagar, Bengaluru',
    budgetHint: '₹24L – ₹32L Interiors',
    status: 'new',
    createdAt: '45m ago',
  },
  {
    id: 'lead-103',
    campaignId: 'camp-turnkey-plot',
    campaignName: '30x40 & 40x60 Turnkey Home Construction',
    sourceChannel: 'WhatsApp Click-to-Chat',
    leadName: 'Suresh Gowda',
    phone: '+91 97412 63009',
    requirement: '40x60 East-facing plot in Sarjapur, G+2 residential turnkey BOQ',
    city: 'Sarjapur Road, Bengaluru',
    budgetHint: '₹1.75 Cr',
    status: 'quoted',
    createdAt: '1d ago',
  },
];

const formatInr = (val: number) => `₹${Math.round(val).toLocaleString('en-IN')}`;

export const SocialAdManager: React.FC<SocialAdManagerProps> = ({
  activeProject,
  posts,
  preselectedPost,
  leads,
  onAddLead,
  onUpdateLeadStatus,
  onDeleteLead,
}) => {
  const [subTab, setSubTab] = useState<'create' | 'campaigns' | 'leads'>('create');

  const [campaigns, setCampaigns] = useState<AdCampaign[]>(() => {
    try {
      const raw = localStorage.getItem(ADS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_CAMPAIGNS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(ADS_STORAGE_KEY, JSON.stringify(campaigns));
    } catch {
      // ignore storage quota
    }
  }, [campaigns]);

  // Ad Builder State
  const defaultPost = preselectedPost || posts[0];
  const [selectedPostId, setSelectedPostId] = useState<string>(defaultPost?.id || '');
  const selectedPost = useMemo(
    () => posts.find((p) => p.id === selectedPostId) || preselectedPost || posts[0],
    [posts, selectedPostId, preselectedPost]
  );

  const [campaignName, setCampaignName] = useState<string>(
    defaultPost ? `${defaultPost.title} — Lead Campaign` : `${activeProject.name} Showcase Ad`
  );
  const [objective, setObjective] = useState<CampaignObjective>('lead_form');
  const [channels, setChannels] = useState<AdChannel[]>(['meta_ig_fb', 'whatsapp']);
  const [city, setCity] = useState<string>(defaultPost?.location || activeProject.location || 'Bengaluru');
  const [radiusKm, setRadiusKm] = useState<number>(15);
  const [audiencePersona, setAudiencePersona] = useState<string>(AUDIENCE_PERSONAS[0]);
  const [dailyBudgetInr, setDailyBudgetInr] = useState<number>(2000);
  const [durationDays, setDurationDays] = useState<number>(14);

  const [headline, setHeadline] = useState<string>(
    defaultPost ? `${defaultPost.title.slice(0, 32)} · ${defaultPost.priceLabel}` : `${activeProject.name}`
  );
  const [primaryText, setPrimaryText] = useState<string>(
    defaultPost?.caption ||
      `Explore ${activeProject.name} in ${activeProject.location}. Full architectural specs and transparent BOQ rates available.`
  );
  const [description, setDescription] = useState<string>(
    defaultPost ? `${defaultPost.areaSpec} · ${defaultPost.location}` : 'Direct Architect & Studio Desk'
  );
  const [ctaLabel, setCtaLabel] = useState<string>('Get Floor Plan & Price');
  const [previewFrame, setPreviewFrame] = useState<'ig_feed' | 'ig_reel' | 'fb_lead'>('ig_feed');

  // AI Ad Copy Variants State
  const [aiVariants, setAiVariants] = useState<AdVariant[]>([]);
  const [targetingNotes, setTargetingNotes] = useState<string[]>([
    'Geo-fence 15 km around core residential & tech corridor pin codes',
    'Pair high-intent real estate / interior audiences with home-loan & turnkey build interest',
    'Enable WhatsApp + Instant Form pre-filled phone verification for faster lead response',
  ]);
  const [leadQuestions, setLeadQuestions] = useState<string[]>([
    'Plot dimension / unit size (e.g. 30x40, 40x60, 3 BHK)?',
    'Preferred timeline to begin design or construction?',
    'WhatsApp number for floor plan & BOQ PDF delivery?',
  ]);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [launchNotice, setLaunchNotice] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Test Lead Form Modal inside Preview
  const [isTestFormOpen, setIsTestFormOpen] = useState(false);
  const [testLeadName, setTestLeadName] = useState('');
  const [testLeadPhone, setTestLeadPhone] = useState('');
  const [testLeadRequirement, setTestLeadRequirement] = useState('');
  const [testLeadSubmitted, setTestLeadSubmitted] = useState(false);

  // Leads CRM filter & manual add
  const [leadFilter, setLeadFilter] = useState<'all' | LeadStatus>('all');
  const [leadSearch, setLeadSearch] = useState('');
  const [showAddLeadForm, setShowAddLeadForm] = useState(false);
  const [manualLeadName, setManualLeadName] = useState('');
  const [manualLeadPhone, setManualLeadPhone] = useState('');
  const [manualLeadReq, setManualLeadReq] = useState('');
  const [manualLeadBudget, setManualLeadBudget] = useState('');

  // Sync builder when a post is boosted from feed
  useEffect(() => {
    if (preselectedPost) {
      setSelectedPostId(preselectedPost.id);
      setCampaignName(`${preselectedPost.title} — Sponsored Campaign`);
      setCity(preselectedPost.location || activeProject.location || 'Bengaluru');
      setHeadline(`${preselectedPost.title.slice(0, 32)} · ${preselectedPost.priceLabel}`);
      setPrimaryText(preselectedPost.caption);
      setDescription(`${preselectedPost.areaSpec} · ${preselectedPost.location}`);
      if (preselectedPost.posterRole === 'interior_designer') {
        setAudiencePersona('Interior & Modular Kitchen Remodelers');
        setCtaLabel('Request Interior Quote');
      } else if (preselectedPost.posterRole === 'builder') {
        setAudiencePersona('30x40 / 40x60 Plot Owners');
        setCtaLabel('Get BOQ & Quote');
      } else if (preselectedPost.posterRole === 'material_supplier') {
        setAudiencePersona('Architects & Turnkey Builders (B2B)');
        setCtaLabel('Request Rate Card');
      } else {
        setAudiencePersona('Luxury Villa & Home Buyers');
        setCtaLabel('Book Site Visit');
      }
      setSubTab('create');
    }
  }, [preselectedPost, activeProject.location]);

  const handleSelectSourcePost = (postId: string) => {
    setSelectedPostId(postId);
    const p = posts.find((item) => item.id === postId);
    if (!p) return;
    setCampaignName(`${p.title} — Sponsored Campaign`);
    setCity(p.location || 'Bengaluru');
    setHeadline(`${p.title.slice(0, 32)} · ${p.priceLabel}`);
    setPrimaryText(p.caption);
    setDescription(`${p.areaSpec} · ${p.location}`);
  };

  const toggleChannel = (ch: AdChannel) => {
    setChannels((prev) => {
      if (prev.includes(ch)) {
        return prev.length > 1 ? prev.filter((c) => c !== ch) : prev;
      }
      return [...prev, ch];
    });
  };

  // Dynamic Forecast Math based on budget, duration, channels & objective
  const forecast = useMemo(() => {
    const totalBudget = dailyBudgetInr * durationDays;
    const objMeta = OBJECTIVE_LABELS[objective];
    const channelBoost = channels.includes('ig_reels') ? 1.15 : 1;
    const estCpm = channels.includes('linkedin') ? 380 : 195;
    const estImpressions = Math.round((totalBudget / estCpm) * 1000 * channelBoost);
    const estClicks = Math.max(12, Math.round(estImpressions * (objMeta.ctr / 100)));
    const estLeads = Math.max(3, Math.round(totalBudget / objMeta.avgCpl));
    const estCpl = Math.round(totalBudget / estLeads);
    return { totalBudget, estImpressions, estClicks, estLeads, estCpl };
  }, [dailyBudgetInr, durationDays, objective, channels]);

  const handleGenerateAiAdKit = async () => {
    setIsGeneratingAi(true);
    try {
      const resp = await fetch('/api/media/generate-ad-kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedPost?.title || campaignName,
          role: selectedPost?.posterRole || 'real_estate',
          priceLabel: selectedPost?.priceLabel || '₹2.45 Cr',
          location: city,
          areaSpec: selectedPost?.areaSpec || '3,200 sq.ft',
          objective,
          channel: channels[0] || 'meta_ig_fb',
          audiencePersona,
          dailyBudgetInr,
          radiusKm,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data.variants) && data.variants.length > 0) {
          setAiVariants(data.variants);
          const first = data.variants[0];
          setHeadline(first.headline);
          setPrimaryText(first.primaryText);
          setDescription(first.description);
          setCtaLabel(first.ctaLabel);
        }
        if (Array.isArray(data.targetingNotes) && data.targetingNotes.length > 0) {
          setTargetingNotes(data.targetingNotes);
        }
        if (Array.isArray(data.leadFormQuestions) && data.leadFormQuestions.length > 0) {
          setLeadQuestions(data.leadFormQuestions);
        }
      }
    } catch {
      // ignore network error; local defaults remain usable
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleLaunchCampaign = () => {
    const newCamp: AdCampaign = {
      id: `camp-${Date.now()}`,
      projectId: activeProject.id,
      sourcePostId: selectedPost?.id || '',
      name: campaignName.trim() || `${selectedPost?.title || activeProject.name} Ad`,
      objective,
      channels,
      status: 'active',
      city: city.trim() || 'Bengaluru',
      radiusKm,
      audiencePersona,
      dailyBudgetInr,
      durationDays,
      spentInr: Math.round(dailyBudgetInr * 0.35),
      impressions: Math.round(forecast.estImpressions * 0.04),
      clicks: Math.max(8, Math.round(forecast.estClicks * 0.04)),
      leadsCount: 1,
      headline: headline.trim() || selectedPost?.title || activeProject.name,
      primaryText: primaryText.trim() || selectedPost?.caption || '',
      description: description.trim() || `${city} · Direct Desk`,
      ctaLabel,
      mediaUrl: selectedPost?.url || PROJECT_MEDIA.duskVillaCampaign,
      posterName: selectedPost?.posterName || 'Gouse Real Estate Advisory',
      posterHandle: selectedPost?.posterHandle || 'gouse_estates_blr',
      posterAvatar: selectedPost?.posterAvatar || AVATARS.principal,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setCampaigns((prev) => [newCamp, ...prev]);
    setLaunchNotice(`Campaign "${newCamp.name}" launched and active.`);
    setSubTab('campaigns');
    setTimeout(() => setLaunchNotice(null), 5000);
  };

  const handleToggleCampaignStatus = (id: string, nextStatus: CampaignStatus) => {
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, status: nextStatus } : c)));
  };

  const handleAdjustBudget = (id: string, delta: number) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, dailyBudgetInr: Math.max(500, Math.min(25000, c.dailyBudgetInr + delta)) } : c
      )
    );
  };

  const handleDuplicateCampaign = (camp: AdCampaign) => {
    const copy: AdCampaign = {
      ...camp,
      id: `camp-${Date.now()}`,
      name: `${camp.name} (Copy)`,
      status: 'paused',
      spentInr: 0,
      impressions: 0,
      clicks: 0,
      leadsCount: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setCampaigns((prev) => [copy, ...prev]);
  };

  const handleDeleteCampaign = (id: string) => {
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSimulateLeadForCampaign = (camp: AdCampaign) => {
    const sampleNames = ['Rohan Kulkarni', 'Meera Nair', 'Arjun Shetty', 'Divya Menon', 'Farhan Khan'];
    const pickedName = sampleNames[leads.length % sampleNames.length];
    const lead: AdLead = {
      id: `lead-${Date.now()}`,
      campaignId: camp.id,
      campaignName: camp.name,
      sourceChannel: camp.channels.includes('whatsapp') ? 'WhatsApp Ad' : 'Instagram Lead Form',
      leadName: pickedName,
      phone: `+91 9845${Math.floor(100000 + Math.random() * 899999)}`,
      requirement: `Interested in ${camp.headline} (${camp.city})`,
      city: camp.city,
      budgetHint: selectedPost?.priceLabel || '₹1.80 Cr',
      status: 'new',
      createdAt: 'Just now',
    };
    onAddLead(lead);
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === camp.id
          ? {
              ...c,
              leadsCount: c.leadsCount + 1,
              clicks: c.clicks + 14,
              impressions: c.impressions + 620,
              spentInr: c.spentInr + Math.round(OBJECTIVE_LABELS[c.objective].avgCpl),
            }
          : c
      )
    );
    setSubTab('leads');
  };

  const handleSubmitTestFormLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testLeadName.trim() || !testLeadPhone.trim()) return;
    onAddLead({
      id: `lead-${Date.now()}`,
      campaignName,
      sourceChannel:
        previewFrame === 'ig_reel'
          ? 'IG Reel Sponsored'
          : previewFrame === 'fb_lead'
          ? 'Facebook Lead Ad'
          : 'Instagram Feed Ad',
      leadName: testLeadName.trim(),
      phone: testLeadPhone.trim(),
      requirement: testLeadRequirement.trim() || `Requested details for ${headline}`,
      city,
      budgetHint: selectedPost?.priceLabel || 'Pending Discussion',
      status: 'new',
      createdAt: 'Just now',
    });
    setTestLeadSubmitted(true);
    setTimeout(() => {
      setIsTestFormOpen(false);
      setTestLeadSubmitted(false);
      setTestLeadName('');
      setTestLeadPhone('');
      setTestLeadRequirement('');
    }, 1200);
  };

  const handleAddManualLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualLeadName.trim() || !manualLeadPhone.trim()) return;
    onAddLead({
      id: `lead-${Date.now()}`,
      campaignName: campaignName || 'Direct Ad Inquiry',
      sourceChannel: 'Manual / Phone Desk',
      leadName: manualLeadName.trim(),
      phone: manualLeadPhone.trim(),
      requirement: manualLeadReq.trim() || 'Requested project consultation & costing',
      city,
      budgetHint: manualLeadBudget.trim() || 'TBD',
      status: 'new',
      createdAt: 'Just now',
    });
    setManualLeadName('');
    setManualLeadPhone('');
    setManualLeadReq('');
    setManualLeadBudget('');
    setShowAddLeadForm(false);
  };

  const handleExportLeadsCsv = () => {
    const header = ['Lead Name', 'Phone', 'Source Channel', 'Campaign', 'City', 'Budget', 'Requirement', 'Status', 'Created'];
    const rows = leads.map((l) =>
      [l.leadName, l.phone, l.sourceChannel, l.campaignName, l.city, l.budgetHint, l.requirement, l.status, l.createdAt]
        .map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `realstate-media-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyAdText = () => {
    const bundle = `${headline}\n\n${primaryText}\n\n${description} · CTA: ${ctaLabel}\nTarget: ${city} (+${radiusKm} km) · ${audiencePersona}`;
    navigator.clipboard?.writeText(bundle).catch(() => {});
    setCopiedId('ad-copy');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Aggregate Campaign Totals
  const totals = useMemo(() => {
    const activeCount = campaigns.filter((c) => c.status === 'active').length;
    const totalDailyBudget = campaigns
      .filter((c) => c.status === 'active')
      .reduce((acc, c) => acc + c.dailyBudgetInr, 0);
    const totalSpent = campaigns.reduce((acc, c) => acc + c.spentInr, 0);
    const totalImpressions = campaigns.reduce((acc, c) => acc + c.impressions, 0);
    const totalClicks = campaigns.reduce((acc, c) => acc + c.clicks, 0);
    const totalLeads = campaigns.reduce((acc, c) => acc + c.leadsCount, 0);
    const avgCpl = totalLeads > 0 ? Math.round(totalSpent / totalLeads) : 0;
    const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';
    return { activeCount, totalDailyBudget, totalSpent, totalImpressions, totalClicks, totalLeads, avgCpl, avgCtr };
  }, [campaigns]);

  const filteredLeads = useMemo(() => {
    const q = leadSearch.trim().toLowerCase();
    return leads.filter((l) => {
      if (leadFilter !== 'all' && l.status !== leadFilter) return false;
      if (!q) return true;
      return (
        l.leadName.toLowerCase().includes(q) ||
        l.phone.toLowerCase().includes(q) ||
        l.requirement.toLowerCase().includes(q) ||
        l.campaignName.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q)
      );
    });
  }, [leads, leadFilter, leadSearch]);

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Run Ads Header + Segmented Navigation */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="text-amber-300 font-semibold">Run Ads Manager</span>
            <span aria-hidden="true">·</span>
            <span>Instagram, Facebook, WhatsApp &amp; Google Local</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{totals.activeCount} Active</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Ad Campaign Builder, Live Sponsored Previews &amp; Lead CRM
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl">
            Turn any property showcase, interior reveal, turnkey milestone, or material lot into a targeted paid campaign with real-time budget forecasting and lead tracking.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 p-1 rounded-lg shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSubTab('create')}
            className={`px-3 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap shrink-0 ${
              subTab === 'create' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Create &amp; Preview Ad</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('campaigns')}
            className={`px-3 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap shrink-0 tabular-nums ${
              subTab === 'campaigns' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Campaigns ({campaigns.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('leads')}
            className={`px-3 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap shrink-0 tabular-nums ${
              subTab === 'leads' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Lead Inbox ({leads.length})</span>
          </button>
        </div>
      </div>

      {launchNotice && (
        <div className="bg-emerald-950/50 border border-emerald-500/40 rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{launchNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setLaunchNotice(null)}
            className="text-emerald-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 1: CREATE & PREVIEW AD                                            */}
      {/* ===================================================================== */}
      {subTab === 'create' && (
        <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6 items-start">
          {/* Left: Campaign Setup & AI Copy Studio */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6">
            {/* Step 1: Select Post or Listing */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-white">01. Select Post or Project Creative</h3>
                <span className="text-xs text-slate-400">Syncs photo, pricing &amp; location</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Source Post from Feed</label>
                  <select
                    value={selectedPost?.id || ''}
                    onChange={(e) => handleSelectSourcePost(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    {posts.map((p) => (
                      <option key={p.id} value={p.id} className="bg-slate-900">
                        {p.title} ({p.priceLabel})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Campaign Name</label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Objective & Channels */}
            <div className="pt-5 border-t border-slate-800 space-y-4">
              <h3 className="text-sm font-semibold text-white">02. Campaign Objective &amp; Ad Channels</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(Object.keys(OBJECTIVE_LABELS) as CampaignObjective[]).map((objKey) => {
                  const meta = OBJECTIVE_LABELS[objKey];
                  const active = objective === objKey;
                  return (
                    <button
                      key={objKey}
                      type="button"
                      onClick={() => setObjective(objKey)}
                      className={`p-3 rounded-lg border text-left transition ${
                        active
                          ? 'bg-amber-500/10 border-amber-500/60 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold">{meta.label}</span>
                        <span className="text-[11px] text-amber-300 tabular-nums">~₹{meta.avgCpl}/lead</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{meta.desc}</p>
                    </button>
                  );
                })}
              </div>

              <div>
                <span className="block text-xs text-slate-400 mb-2">Active Placements</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {CHANNEL_OPTIONS.map((ch) => {
                    const active = channels.includes(ch.id);
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => toggleChannel(ch.id)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                          active
                            ? 'bg-sky-500/15 border-sky-400/60 text-sky-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {active && <Check className="w-3.5 h-3.5 text-sky-400" />}
                        <span>{ch.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Step 3: Audience, Location & Budget Forecast */}
            <div className="pt-5 border-t border-slate-800 space-y-4">
              <h3 className="text-sm font-semibold text-white">03. Geo-Targeting, Audience &amp; Daily Budget</h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Target City / Corridor</label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg pl-8 pr-2.5 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1 tabular-nums">
                    Pin Radius: {radiusKm} km
                  </label>
                  <input
                    type="range"
                    min={5}
                    max={50}
                    step={5}
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    className="w-full accent-amber-500 mt-2"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Audience Persona</label>
                  <select
                    value={audiencePersona}
                    onChange={(e) => setAudiencePersona(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none"
                  >
                    {AUDIENCE_PERSONAS.map((p) => (
                      <option key={p} value={p} className="bg-slate-900">
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-400">Daily Budget</span>
                    <span className="font-semibold text-white tabular-nums">{formatInr(dailyBudgetInr)} / day</span>
                  </div>
                  <input
                    type="range"
                    min={500}
                    max={15000}
                    step={250}
                    value={dailyBudgetInr}
                    onChange={(e) => setDailyBudgetInr(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                  <div className="flex items-center gap-1.5 mt-2">
                    {[1000, 2000, 3500, 5000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setDailyBudgetInr(amt)}
                        className={`px-2 py-1 rounded text-[11px] font-medium tabular-nums border transition ${
                          dailyBudgetInr === amt
                            ? 'bg-slate-800 border-amber-500/60 text-amber-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {formatInr(amt)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block text-xs text-slate-400 mb-1.5">Run Duration</span>
                  <div className="grid grid-cols-4 gap-2">
                    {[7, 14, 21, 30].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDurationDays(d)}
                        className={`py-2 rounded-lg border text-xs font-semibold tabular-nums transition ${
                          durationDays === d
                            ? 'bg-amber-500/15 border-amber-500/60 text-amber-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {d} Days
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 tabular-nums">
                    Total Campaign Spend Cap: <strong className="text-white">{formatInr(forecast.totalBudget)}</strong>
                  </p>
                </div>
              </div>

              {/* Estimated Delivery Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800 tabular-nums">
                <div>
                  <span className="text-[11px] text-slate-400 block">Est. Reach</span>
                  <span className="text-sm font-bold text-white">{forecast.estImpressions.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Est. Link Clicks</span>
                  <span className="text-sm font-bold text-sky-300">{forecast.estClicks.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Est. Qualified Leads</span>
                  <span className="text-sm font-bold text-emerald-400">{forecast.estLeads} leads</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Est. Cost / Lead</span>
                  <span className="text-sm font-bold text-amber-300">{formatInr(forecast.estCpl)}</span>
                </div>
              </div>
            </div>

            {/* Step 4: Ad Copy & AI Creative Generator */}
            <div className="pt-5 border-t border-slate-800 space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="text-sm font-semibold text-white">04. Ad Copy, CTA &amp; A/B Variants</h3>
                  <p className="text-xs text-slate-400">
                    Customize directly or draft 3 targeted variations using project &amp; audience data.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateAiAdKit}
                  disabled={isGeneratingAi}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap shrink-0 disabled:opacity-60"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isGeneratingAi ? 'Drafting Ad Kit...' : 'Generate 3 A/B Ad Variants'}</span>
                </button>
              </div>

              {aiVariants.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {aiVariants.map((v, idx) => (
                    <button
                      key={`${v.label}-${idx}`}
                      type="button"
                      onClick={() => {
                        setHeadline(v.headline);
                        setPrimaryText(v.primaryText);
                        setDescription(v.description);
                        setCtaLabel(v.ctaLabel);
                      }}
                      className={`p-3 rounded-lg border text-left transition ${
                        headline === v.headline
                          ? 'bg-amber-500/10 border-amber-500/60'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-semibold text-amber-300 block">{v.label}</span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">{v.angle}</span>
                      <span className="text-xs text-white font-medium block mt-1.5 truncate">{v.headline}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Primary Ad Text</label>
                  <textarea
                    rows={3}
                    value={primaryText}
                    onChange={(e) => setPrimaryText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Ad Headline</label>
                    <input
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Sub-Headline</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Action Button (CTA)</label>
                    <select
                      value={ctaLabel}
                      onChange={(e) => setCtaLabel(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      {CTA_OPTIONS.map((c) => (
                        <option key={c} value={c} className="bg-slate-900">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Targeting & Lead Form Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block mb-1.5">Targeting Checklist</span>
                  <ul className="space-y-1 text-slate-300">
                    {targetingNotes.map((note, idx) => (
                      <li key={idx} className="leading-relaxed">
                        · {note}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block mb-1.5">Instant Lead Form Questions</span>
                  <ul className="space-y-1 text-slate-300">
                    {leadQuestions.map((q, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {idx + 1}. {q}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Live Sponsored Ad Preview + Launch CTA */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 xl:sticky xl:top-6">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-semibold text-white">Live Sponsored Ad Preview</span>
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-lg">
                {[
                  { id: 'ig_feed', label: 'IG Feed' },
                  { id: 'ig_reel', label: 'IG Reel 9:16' },
                  { id: 'fb_lead', label: 'FB Lead Ad' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setPreviewFrame(f.id as 'ig_feed' | 'ig_reel' | 'fb_lead')}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition whitespace-nowrap ${
                      previewFrame === f.id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Sponsored Card */}
            {previewFrame === 'ig_reel' ? (
              <div className="relative mx-auto max-w-[300px] aspect-[9/16] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <img
                  src={selectedPost?.url || PROJECT_MEDIA.duskVillaCampaign}
                  alt={headline}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/50" />

                <div className="relative z-10 p-3.5 flex items-center gap-2.5">
                  <img
                    src={selectedPost?.posterAvatar || AVATARS.principal}
                    alt={selectedPost?.posterHandle || 'studio'}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover border border-white/40"
                  />
                  <div>
                    <p className="text-xs font-semibold text-white">{selectedPost?.posterHandle || 'gouse_estates_blr'}</p>
                    <p className="text-[10px] text-slate-200">Sponsored · {city}</p>
                  </div>
                </div>

                <div className="relative z-10 p-4 space-y-2.5">
                  <p className="text-sm font-bold text-white leading-snug">{headline}</p>
                  <p className="text-xs text-slate-200 line-clamp-3 leading-relaxed">{primaryText}</p>
                  <button
                    type="button"
                    onClick={() => setIsTestFormOpen(true)}
                    className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition"
                  >
                    {ctaLabel}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={selectedPost?.posterAvatar || AVATARS.principal}
                      alt={selectedPost?.posterName || 'Studio'}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white truncate">
                          {previewFrame === 'fb_lead'
                            ? selectedPost?.posterName || 'Gouse Real Estate Advisory'
                            : selectedPost?.posterHandle || 'gouse_estates_blr'}
                        </span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        Sponsored · {city} (+{radiusKm} km)
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">
                    {previewFrame === 'fb_lead' ? 'Facebook Ad' : 'Instagram Ad'}
                  </span>
                </div>

                {previewFrame === 'fb_lead' && (
                  <p className="px-4 pb-3 text-xs text-slate-300 leading-relaxed">{primaryText}</p>
                )}

                <div className={`relative ${previewFrame === 'fb_lead' ? 'aspect-[16/10]' : 'aspect-[4/5] max-h-[340px]'} w-full bg-slate-900 overflow-hidden`}>
                  <img
                    src={selectedPost?.url || PROJECT_MEDIA.duskVillaCampaign}
                    alt={headline}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
                </div>

                <div className="px-4 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-400 truncate">{description}</p>
                    <p className="text-sm font-bold text-white truncate">{headline}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsTestFormOpen(true)}
                    className="px-3.5 py-2 rounded-lg bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-semibold transition whitespace-nowrap shrink-0"
                  >
                    {ctaLabel}
                  </button>
                </div>

                {previewFrame === 'ig_feed' && (
                  <p className="px-4 py-3 text-xs text-slate-300 leading-relaxed border-t border-slate-800">
                    <span className="font-semibold text-white mr-1.5">
                      {selectedPost?.posterHandle || 'gouse_estates_blr'}
                    </span>
                    {primaryText}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleCopyAdText}
                className="px-3.5 py-2.5 rounded-lg border border-slate-700 hover:border-slate-500 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition whitespace-nowrap shrink-0"
              >
                {copiedId === 'ad-copy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'ad-copy' ? 'Copied' : 'Copy Brief'}</span>
              </button>

              <button
                type="button"
                onClick={handleLaunchCampaign}
                className="flex-1 py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 transition whitespace-nowrap"
              >
                <Megaphone className="w-4 h-4" />
                <span>Launch Ad Campaign ({formatInr(dailyBudgetInr)}/day)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsTestFormOpen(true)}
              className="w-full py-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition"
            >
              Test Instant Lead Form Submission
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: ACTIVE CAMPAIGNS                                               */}
      {/* ===================================================================== */}
      {subTab === 'campaigns' && (
        <div className="space-y-5">
          {/* KPI Summary Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 tabular-nums">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 block">Active Daily Budget</span>
              <span className="text-xl font-bold text-white mt-1 block">
                {formatInr(totals.totalDailyBudget)} / day
              </span>
              <span className="text-[11px] text-emerald-400 mt-1 block">
                {totals.activeCount} running · {campaigns.length} total
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 block">Total Ad Spend</span>
              <span className="text-xl font-bold text-white mt-1 block">
                {formatInr(totals.totalSpent)}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {totals.totalImpressions.toLocaleString()} impressions
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 block">Clicks &amp; Avg CTR</span>
              <span className="text-xl font-bold text-sky-300 mt-1 block">
                {totals.totalClicks.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">{totals.avgCtr}% link CTR</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 block">Captured Leads &amp; CPL</span>
              <span className="text-xl font-bold text-emerald-400 mt-1 block">
                {totals.totalLeads} leads
              </span>
              <span className="text-[11px] text-amber-300 mt-1 block">
                Avg {formatInr(totals.avgCpl)} / lead
              </span>
            </div>
          </div>

          {campaigns.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center space-y-3">
              <p className="text-sm font-semibold text-white">No ad campaigns created yet</p>
              <p className="text-xs text-slate-400">
                Select any project or post in the Ad Builder to launch your first campaign.
              </p>
              <button
                type="button"
                onClick={() => setSubTab('create')}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold"
              >
                Create First Ad
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((camp) => {
                const ctr = camp.impressions > 0 ? ((camp.clicks / camp.impressions) * 100).toFixed(2) : '0.00';
                const cpl = camp.leadsCount > 0 ? Math.round(camp.spentInr / camp.leadsCount) : 0;
                const totalCap = camp.dailyBudgetInr * camp.durationDays;
                const spendPct = Math.min(100, Math.round((camp.spentInr / Math.max(1, totalCap)) * 100));

                return (
                  <div
                    key={camp.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                  >
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <img
                        src={camp.mediaUrl}
                        alt={camp.name}
                        referrerPolicy="no-referrer"
                        className="w-20 h-20 rounded-lg object-cover border border-slate-800 shrink-0"
                      />
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs flex-wrap">
                          <span
                            className={`font-semibold ${
                              camp.status === 'active'
                                ? 'text-emerald-400'
                                : camp.status === 'paused'
                                ? 'text-amber-300'
                                : 'text-slate-400'
                            }`}
                          >
                            {camp.status === 'active' ? 'Running' : camp.status === 'paused' ? 'Paused' : 'Ended'}
                          </span>
                          <span className="text-slate-600" aria-hidden="true">·</span>
                          <span className="text-slate-400">{OBJECTIVE_LABELS[camp.objective].label}</span>
                          <span className="text-slate-600" aria-hidden="true">·</span>
                          <span className="text-slate-400">{camp.city} (+{camp.radiusKm} km)</span>
                        </div>
                        <h3 className="text-sm sm:text-base font-semibold text-white truncate">
                          {camp.name}
                        </h3>
                        <p className="text-xs text-slate-400 truncate">
                          {camp.audiencePersona} · CTA: {camp.ctaLabel} ·{' '}
                          {camp.channels
                            .map((ch) => CHANNEL_OPTIONS.find((o) => o.id === ch)?.short || ch)
                            .join(', ')}
                        </p>
                        <div className="w-full max-w-sm pt-1">
                          <div className="flex justify-between text-[11px] text-slate-400 tabular-nums mb-1">
                            <span>Spent {formatInr(camp.spentInr)} of {formatInr(totalCap)}</span>
                            <span>{spendPct}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full"
                              style={{ width: `${spendPct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Metrics + Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6 shrink-0">
                      <div className="grid grid-cols-4 gap-4 text-xs tabular-nums">
                        <div>
                          <span className="text-slate-500 block">Daily</span>
                          <span className="font-semibold text-white">{formatInr(camp.dailyBudgetInr)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Clicks</span>
                          <span className="font-semibold text-sky-300">
                            {camp.clicks.toLocaleString()} ({ctr}%)
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Leads</span>
                          <span className="font-semibold text-emerald-400">{camp.leadsCount}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">CPL</span>
                          <span className="font-semibold text-amber-300">{cpl > 0 ? formatInr(cpl) : '—'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleAdjustBudget(camp.id, -500)}
                          className="px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-300 tabular-nums"
                          title="Decrease daily budget by ₹500"
                        >
                          -₹500
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustBudget(camp.id, 500)}
                          className="px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-300 tabular-nums"
                          title="Increase daily budget by ₹500"
                        >
                          +₹500
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleCampaignStatus(
                              camp.id,
                              camp.status === 'active' ? 'paused' : 'active'
                            )
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border transition whitespace-nowrap ${
                            camp.status === 'active'
                              ? 'bg-slate-800 border-slate-700 text-amber-300 hover:text-white'
                              : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                          }`}
                        >
                          {camp.status === 'active' ? (
                            <>
                              <Pause className="w-3.5 h-3.5" />
                              <span>Pause</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5" />
                              <span>Resume</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSimulateLeadForCampaign(camp)}
                          className="px-2.5 py-1.5 rounded-lg bg-sky-500/15 border border-sky-500/40 text-sky-300 hover:text-white text-xs font-semibold whitespace-nowrap"
                        >
                          + Test Lead
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicateCampaign(camp)}
                          title="Duplicate campaign"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCampaign(camp.id)}
                          title="Delete campaign"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
      {/* TAB 3: LEAD INBOX CRM                                                 */}
      {/* ===================================================================== */}
      {subTab === 'leads' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(
                [
                  { id: 'all', label: `All (${leads.length})` },
                  { id: 'new', label: 'New' },
                  { id: 'contacted', label: 'Contacted' },
                  { id: 'visit_booked', label: 'Visit Booked' },
                  { id: 'quoted', label: 'Quoted' },
                  { id: 'closed', label: 'Closed' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setLeadFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition whitespace-nowrap shrink-0 ${
                    leadFilter === f.id
                      ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  placeholder="Search leads..."
                  className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowAddLeadForm((v) => !v)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white flex items-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Lead</span>
              </button>
              <button
                type="button"
                onClick={handleExportLeadsCsv}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {showAddLeadForm && (
            <form
              onSubmit={handleAddManualLead}
              className="p-4 rounded-lg bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-5 gap-2.5 items-end"
            >
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Lead Name *</label>
                <input
                  type="text"
                  required
                  value={manualLeadName}
                  onChange={(e) => setManualLeadName(e.target.value)}
                  placeholder="Full name"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Phone / WhatsApp *</label>
                <input
                  type="text"
                  required
                  value={manualLeadPhone}
                  onChange={(e) => setManualLeadPhone(e.target.value)}
                  placeholder="+91 98..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Budget Hint</label>
                <input
                  type="text"
                  value={manualLeadBudget}
                  onChange={(e) => setManualLeadBudget(e.target.value)}
                  placeholder="e.g. ₹1.50 Cr"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Requirement</label>
                <input
                  type="text"
                  value={manualLeadReq}
                  onChange={(e) => setManualLeadReq(e.target.value)}
                  placeholder="Plot size, villa, interiors..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <button
                type="submit"
                className="py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold"
              >
                Save Lead
              </button>
            </form>
          )}

          {filteredLeads.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No leads match this filter yet. Launch an ad campaign or capture inquiries from posts.
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <span className="font-semibold text-white">{lead.leadName}</span>
                      <span className="text-slate-600" aria-hidden="true">·</span>
                      <span className="text-sky-300 tabular-nums">{lead.phone}</span>
                      <span className="text-slate-600" aria-hidden="true">·</span>
                      <span className="text-slate-400">{lead.sourceChannel}</span>
                      <span className="text-slate-600" aria-hidden="true">·</span>
                      <span className="text-amber-300 tabular-nums">{lead.budgetHint}</span>
                      <span className="text-slate-600" aria-hidden="true">·</span>
                      <span className="text-slate-500">{lead.createdAt}</span>
                    </div>
                    <p className="text-xs text-slate-300">{lead.requirement}</p>
                    <p className="text-[11px] text-slate-500 truncate">
                      Campaign / Post: {lead.campaignName} · {lead.city}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={lead.status}
                      onChange={(e) => onUpdateLeadStatus(lead.id, e.target.value as LeadStatus)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="visit_booked">Visit Booked</option>
                      <option value="quoted">Quoted / BOQ Sent</option>
                      <option value="closed">Closed</option>
                    </select>
                    <a
                      href={`tel:${lead.phone.replace(/\s+/g, '')}`}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 text-xs text-slate-200 flex items-center gap-1 whitespace-nowrap"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>
                    <a
                      href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `Hello ${lead.leadName}, following up on your inquiry for "${lead.campaignName}".`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 whitespace-nowrap"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => onDeleteLead(lead.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800"
                      title="Delete lead"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Test Instant Lead Form Modal */}
      {isTestFormOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4"
          onClick={() => setIsTestFormOpen(false)}
        >
          <form
            onSubmit={handleSubmitTestFormLead}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl"
          >
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-amber-300 font-semibold">Instant Lead Form Preview</p>
                <h4 className="text-sm font-bold text-white">{headline}</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsTestFormOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              {testLeadSubmitted ? (
                <div className="py-6 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-sm font-semibold text-white">Lead Logged to Inbox</p>
                  <p className="text-xs text-slate-400">Check the Lead Inbox tab to track and respond.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={testLeadName}
                      onChange={(e) => setTestLeadName(e.target.value)}
                      placeholder="e.g. Karthik Sharma"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Phone / WhatsApp *</label>
                    <input
                      type="text"
                      required
                      value={testLeadPhone}
                      onChange={(e) => setTestLeadPhone(e.target.value)}
                      placeholder="+91 98450 12345"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Plot / Interior Requirement</label>
                    <textarea
                      rows={2}
                      value={testLeadRequirement}
                      onChange={(e) => setTestLeadRequirement(e.target.value)}
                      placeholder={leadQuestions[0]}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold"
                  >
                    Submit Test Inquiry
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
