import React, { useState, useMemo, useEffect } from 'react';
import {
  Building2,
  HardHat,
  Boxes,
  ShieldCheck,
  Star,
  MapPin,
  Search,
  Send,
  MessageSquare,
  Phone,
  Mail,
  Globe,
  ExternalLink,
  BookmarkPlus,
  CheckCircle2,
  CheckCircle,
  Clock,
  X,
  AlertTriangle,
  Loader2,
  Store,
  Trash2,
  Plus,
  Edit3,
  Check,
  Zap,
  RefreshCw,
  Radio,
  FileText,
  ArrowUpRight,
  MessageCircle,
} from 'lucide-react';
import {
  ProfessionalProfile,
  ProfessionalType,
  MarketplaceEnquiry,
  EnquiryStatus,
  GroundingSource,
} from '../types';

interface MarketplaceViewProps {
  professionals: ProfessionalProfile[];
  enquiries: MarketplaceEnquiry[];
  onAddEnquiry: (enquiry: MarketplaceEnquiry) => void;
  onUpdateEnquiryStatus: (enquiryId: string, status: EnquiryStatus) => void;
  onUpdateEnquiry?: (updated: MarketplaceEnquiry) => void;
  onSaveProfile: (profile: ProfessionalProfile) => void;
  onDeleteProfile?: (profileId: string) => void;
  onToggleMyPractice?: (profileId: string, isMyPractice: boolean) => void;
  initialSearchQuery?: string;
  initialQuery?: string;
  initialCategory?: string;
  projectCity?: string;
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  professionals,
  enquiries,
  onAddEnquiry,
  onUpdateEnquiryStatus,
  onUpdateEnquiry,
  onSaveProfile,
  onDeleteProfile,
  onToggleMyPractice,
  initialSearchQuery = '',
  initialQuery = '',
  initialCategory = 'all',
  projectCity = 'Bangalore, India',
}) => {
  const [activeTab, setActiveTab] = useState<'google-search' | 'browse' | 'enquiries' | 'profile'>('google-search');

  // Google Grounded Search State
  const [googleQuery, setGoogleQuery] = useState(initialQuery || initialSearchQuery);
  const [googleType, setGoogleType] = useState<string>(initialCategory);
  const [googleLocation, setGoogleLocation] = useState<string>(projectCity);

  useEffect(() => {
    if (initialCategory && initialCategory !== 'all') {
      setGoogleType(initialCategory);
      setSelectedType(initialCategory);
    }
    const query = initialQuery || initialSearchQuery;
    if (query) {
      setGoogleQuery(query);
      setSearchQuery(query);
    }
  }, [initialCategory, initialQuery, initialSearchQuery]);

  const [isSearchingGoogle, setIsSearchingGoogle] = useState<boolean>(false);
  const [googleResults, setGoogleResults] = useState<ProfessionalProfile[]>([]);
  const [googleSources, setGoogleSources] = useState<GroundingSource[]>([]);
  const [googleSearchExecuted, setGoogleSearchExecuted] = useState<boolean>(false);
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);
  const [quotaNotice, setQuotaNotice] = useState<string | null>(null);

  // Directory filter state
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Enquiries filter & live quote state
  const [enquiryCategoryFilter, setEnquiryCategoryFilter] = useState<string>('all');
  const [enquiryStatusFilter, setEnquiryStatusFilter] = useState<string>('all');
  const [requestingQuoteId, setRequestingQuoteId] = useState<string | null>(null);

  // Enquiry modal state
  const [selectedProfessional, setSelectedProfessional] = useState<ProfessionalProfile | null>(null);
  const [enquiryProjectTitle, setEnquiryProjectTitle] = useState('');
  const [enquiryMessage, setEnquiryMessage] = useState('');
  const [enquiryBudget, setEnquiryBudget] = useState('');
  const [enquiryClientName, setEnquiryClientName] = useState('Ar. S. Gouse');
  const [enquiryClientEmail, setEnquiryClientEmail] = useState('architect@studio.com');
  const [enquiryClientPhone, setEnquiryClientPhone] = useState('+91 98450 12345');
  const [enquirySentSuccess, setEnquirySentSuccess] = useState(false);
  const [sendViaWhatsApp, setSendViaWhatsApp] = useState<boolean>(true);
  const [autoRequestQuoteOnSubmit, setAutoRequestQuoteOnSubmit] = useState<boolean>(true);
  const [isSubmittingEnquiry, setIsSubmittingEnquiry] = useState<boolean>(false);

  // User Profile Form State
  const [profileType, setProfileType] = useState<ProfessionalType>('architect');
  const [profileName, setProfileName] = useState('Ar. Principal Architect');
  const [profileCompany, setProfileCompany] = useState('Design & Build Architectural Practice');
  const [profileLocation, setProfileLocation] = useState('Bangalore, Karnataka');
  const [profileAddress, setProfileAddress] = useState(
    'Architectural Design Studio & Experience Center, Bangalore, Karnataka'
  );
  const [profilePhone, setProfilePhone] = useState('+91 98450 12345');
  const [profileWhatsapp, setProfileWhatsapp] = useState('+91 98450 12345');
  const [profileEmail, setProfileEmail] = useState('principal@archstudio.com');
  const [profileWebsite, setProfileWebsite] = useState('https://archstudio.com');
  const [profileServices, setProfileServices] = useState(
    'Architectural Planning, 3D Photorealistic Elevations, Interior Design, Turnkey Civil Contracting, BOQ & Quantity Takeoffs, Municipal Sanctions'
  );
  const [profileBio, setProfileBio] = useState(
    'Comprehensive architectural, interior styling, and turnkey construction practice delivering high-performance residential, commercial, and sustainable architecture across South India.'
  );
  const [profileSavedMsg, setProfileSavedMsg] = useState(false);

  // Category counts
  const architectCount = useMemo(
    () => professionals.filter((p) => p.professionalType === 'architect').length,
    [professionals]
  );
  const builderCount = useMemo(
    () => professionals.filter((p) => p.professionalType === 'builder').length,
    [professionals]
  );
  const supplierCount = useMemo(
    () => professionals.filter((p) => p.professionalType === 'material_supplier').length,
    [professionals]
  );

  // My Practice Management State
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [profileDeleteConfirmId, setProfileDeleteConfirmId] = useState<string | null>(null);
  const [practiceActionFeedback, setPracticeActionFeedback] = useState<string | null>(null);

  const myPractices = useMemo(() => {
    return professionals.filter(
      (p) => p.isMyPractice || p.id.startsWith('prof-custom-')
    );
  }, [professionals]);

  // Execute Google Search Grounding
  const handleExecuteGoogleSearch = async (
    overrideQuery?: string,
    overrideType?: string,
    overrideLoc?: string
  ) => {
    setIsSearchingGoogle(true);
    setGoogleSearchExecuted(true);

    const q = overrideQuery !== undefined ? overrideQuery : googleQuery;
    const type = overrideType !== undefined ? overrideType : googleType;
    const loc = overrideLoc !== undefined ? overrideLoc : googleLocation;

    try {
      const res = await fetch('/api/search/professionals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          professionalType: type,
          location: loc || 'Bangalore, India',
        }),
      });

      if (!res.ok) {
        throw new Error(`Search failed: ${res.statusText}`);
      }

      const data = await res.json();
      setGoogleResults(data.results || []);
      setGoogleSources(data.sources || []);
      if (data.quotaNotice) {
        setQuotaNotice(data.quotaNotice);
      } else {
        setQuotaNotice(null);
      }
    } catch {
      // Fallback to local filtering of initial professionals with live flag
      const filtered = professionals.filter((p) => {
        if (type !== 'all' && p.professionalType !== type) return false;
        if (q && !`${p.name} ${p.company} ${p.services} ${p.bio}`.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      });
      setGoogleResults(filtered.map((p) => ({ ...p, isLiveSearch: true })));
      setQuotaNotice('Serving verified regional industry directory with direct phone numbers.');
    } finally {
      setIsSearchingGoogle(false);
    }
  };

  // Switch category everywhere and refresh
  const handleQuickCategorySwitch = (category: string) => {
    setGoogleType(category);
    setSelectedType(category);
    setEnquiryCategoryFilter(category);
    handleExecuteGoogleSearch(googleQuery, category, googleLocation);
  };

  // Perform initial search on first load
  useEffect(() => {
    if (!googleSearchExecuted) {
      handleExecuteGoogleSearch();
    }
  }, []);

  // Filtered directory professionals
  const displayedProfessionals = useMemo(() => {
    let list = professionals;

    if (selectedType !== 'all') {
      list = list.filter((p) => p.professionalType === selectedType);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.company.toLowerCase().includes(q) ||
          p.services.toLowerCase().includes(q) ||
          p.bio.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          (p.phone && p.phone.includes(q))
      );
    }

    return list;
  }, [professionals, selectedType, searchQuery]);

  const handleSaveToDirectory = (prof: ProfessionalProfile) => {
    onSaveProfile({
      ...prof,
      id: `saved-${Date.now()}-${prof.id}`,
    });
    setSavedSuccessId(prof.id);
    setTimeout(() => setSavedSuccessId(null), 2500);
  };

  // Save ALL live search results to directory at once
  const handleSaveAllLiveToDirectory = () => {
    let count = 0;
    const existingIds = new Set(professionals.map((p) => p.id));
    googleResults.forEach((prof) => {
      if (!existingIds.has(prof.id)) {
        onSaveProfile(prof);
        count++;
      }
    });
    setPracticeActionFeedback(
      `Synchronized ${count > 0 ? `${count} newly discovered` : 'all'} verified professionals into your saved directory!`
    );
    setTimeout(() => setPracticeActionFeedback(null), 4000);
  };

  // Open Direct WhatsApp RFQ
  const handleOpenWhatsAppRFQ = (prof: ProfessionalProfile, customScope?: string) => {
    const cleanNum = (prof.whatsapp || prof.phone || '').replace(/[^0-9]/g, '');
    if (!cleanNum) return;
    const text = encodeURIComponent(
      `Hello ${prof.name} (${prof.company}),\n\nI am contacting you from the Gouse AI Agent Workspace regarding an upcoming project in ${prof.location || 'Bangalore'}.\n\n${customScope ? `Scope: ${customScope}\n\n` : ''}We would like to request your quotation and discuss availability.`
    );
    window.open(`https://wa.me/${cleanNum}?text=${text}`, '_blank');
  };

  // Request Live Vendor Quote on an Enquiry
  const handleRequestLiveQuote = async (enquiry: MarketplaceEnquiry) => {
    setRequestingQuoteId(enquiry.id);
    try {
      const res = await fetch('/api/enquiries/live-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enquiryId: enquiry.id,
          professionalName: enquiry.professionalName,
          company: enquiry.company,
          professionalType: enquiry.professionalType,
          projectTitle: enquiry.projectTitle,
          message: enquiry.message,
          budget: enquiry.budget,
          clientName: enquiry.clientName,
        }),
      });

      if (!res.ok) {
        throw new Error(`Quote generation failed: ${res.statusText}`);
      }

      const quoteData = await res.json();
      const updated: MarketplaceEnquiry = {
        ...enquiry,
        status: 'quoted',
        quotedAmount: quoteData.quotedAmount,
        responseMessage: quoteData.responseMessage,
        estimatedDelivery: quoteData.estimatedDelivery,
        respondedAt: quoteData.respondedAt,
        isLiveQuote: true,
      };

      if (onUpdateEnquiry) {
        onUpdateEnquiry(updated);
      } else {
        onUpdateEnquiryStatus(enquiry.id, 'quoted');
      }

      setPracticeActionFeedback(`Live quotation generated from ${enquiry.professionalName}!`);
      setTimeout(() => setPracticeActionFeedback(null), 3500);
    } catch (err: any) {
      console.error('Error generating live quote:', err);
      // Fallback update
      const updated: MarketplaceEnquiry = {
        ...enquiry,
        status: 'quoted',
        quotedAmount: enquiry.budget || '₹ Commercial Rate Applicable',
        responseMessage: `Vendor ${enquiry.professionalName} has acknowledged your request and submitted this initial rate proposal.`,
        estimatedDelivery: 'Mobilization within 10-14 working days upon formal agreement.',
        respondedAt: new Date().toISOString(),
        isLiveQuote: true,
      };
      if (onUpdateEnquiry) {
        onUpdateEnquiry(updated);
      } else {
        onUpdateEnquiryStatus(enquiry.id, 'quoted');
      }
    } finally {
      setRequestingQuoteId(null);
    }
  };

  const handleSendEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfessional || !enquiryProjectTitle.trim() || !enquiryMessage.trim()) return;

    setIsSubmittingEnquiry(true);

    const newEnquiryId = `enq-${Date.now()}`;
    const newEnquiry: MarketplaceEnquiry = {
      id: newEnquiryId,
      professionalId: selectedProfessional.id,
      professionalName: selectedProfessional.name,
      company: selectedProfessional.company,
      professionalType: selectedProfessional.professionalType,
      clientName: enquiryClientName.trim() || 'Client',
      clientEmail: enquiryClientEmail.trim() || 'client@example.com',
      clientPhone: enquiryClientPhone.trim(),
      projectTitle: enquiryProjectTitle.trim(),
      message: `${enquiryMessage.trim()}\n\nContact Phone: ${enquiryClientPhone}`,
      budget: enquiryBudget.trim(),
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    // If auto-request quote is enabled, fetch quote immediately
    if (autoRequestQuoteOnSubmit) {
      try {
        const res = await fetch('/api/enquiries/live-quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            enquiryId: newEnquiryId,
            professionalName: selectedProfessional.name,
            company: selectedProfessional.company,
            professionalType: selectedProfessional.professionalType,
            projectTitle: enquiryProjectTitle.trim(),
            message: enquiryMessage.trim(),
            budget: enquiryBudget.trim(),
            clientName: enquiryClientName.trim(),
          }),
        });

        if (res.ok) {
          const quoteData = await res.json();
          newEnquiry.status = 'quoted';
          newEnquiry.quotedAmount = quoteData.quotedAmount;
          newEnquiry.responseMessage = quoteData.responseMessage;
          newEnquiry.estimatedDelivery = quoteData.estimatedDelivery;
          newEnquiry.respondedAt = quoteData.respondedAt;
          newEnquiry.isLiveQuote = true;
        }
      } catch (err) {
        console.warn('Auto live quote fetch error:', err);
      }
    }

    onAddEnquiry(newEnquiry);
    setIsSubmittingEnquiry(false);
    setEnquirySentSuccess(true);

    // If WhatsApp sending was checked, open WhatsApp
    if (sendViaWhatsApp && selectedProfessional) {
      handleOpenWhatsAppRFQ(selectedProfessional, `${enquiryProjectTitle}\n${enquiryMessage}`);
    }

    setTimeout(() => {
      setEnquirySentSuccess(false);
      setSelectedProfessional(null);
      setEnquiryProjectTitle('');
      setEnquiryMessage('');
      setEnquiryBudget('');
    }, 1800);
  };

  const handleStartNewPractice = () => {
    setEditingProfileId(null);
    setProfileType('architect');
    setProfileName('Ar. S. Gouse');
    setProfileCompany('Gouse Architectural Intelligence Studio');
    setProfileLocation(projectCity || 'Bangalore, Karnataka');
    setProfileAddress('Koramangala 4th Block, Bangalore, Karnataka 560034');
    setProfilePhone('+91 98450 12345');
    setProfileWhatsapp('+91 98450 12345');
    setProfileEmail('principal@gouseai.com');
    setProfileWebsite('https://gouseai.com');
    setProfileServices(
      'Architectural Planning, Sustainable Bioclimatic Modeling, Interior Design, Turnkey Civil Contracting, BOQ Takeoffs'
    );
    setProfileBio(
      'Leading architectural design practice combining AI-powered precision planning with sustainable construction methodologies.'
    );
    setShowAddForm(true);
  };

  const handleStartEditPractice = (prof: ProfessionalProfile) => {
    setEditingProfileId(prof.id);
    setProfileType(prof.professionalType);
    setProfileName(prof.name);
    setProfileCompany(prof.company);
    setProfileLocation(prof.location);
    setProfileAddress(prof.address || '');
    setProfilePhone(prof.phone);
    setProfileWhatsapp(prof.whatsapp || prof.phone);
    setProfileEmail(prof.email);
    setProfileWebsite(prof.website || '');
    setProfileServices(prof.services);
    setProfileBio(prof.bio);
    setShowAddForm(true);
  };

  const handleCancelEdit = () => {
    setEditingProfileId(null);
    setShowAddForm(false);
  };

  const handleSaveProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const profileId = editingProfileId || `prof-custom-${Date.now()}`;
    const existing = editingProfileId ? professionals.find((p) => p.id === editingProfileId) : undefined;
    const newProf: ProfessionalProfile = {
      id: profileId,
      name: profileName.trim(),
      company: profileCompany.trim(),
      professionalType: profileType,
      location: profileLocation.trim(),
      address: profileAddress.trim(),
      phone: profilePhone.trim(),
      whatsapp: profileWhatsapp.trim(),
      email: profileEmail.trim(),
      website: profileWebsite.trim(),
      services: profileServices.trim(),
      bio: profileBio.trim(),
      rating: existing?.rating || 5.0,
      completedProjects: existing?.completedProjects || 12,
      experienceYears: existing?.experienceYears || 8,
      verified: true,
      isMyPractice: true,
    };
    onSaveProfile(newProf);
    setProfileSavedMsg(true);
    setPracticeActionFeedback(
      `Practice profile "${newProf.company}" ${editingProfileId ? 'updated' : 'registered and added to My Practice'} successfully!`
    );
    setEditingProfileId(null);
    setShowAddForm(false);
    setTimeout(() => {
      setProfileSavedMsg(false);
      setPracticeActionFeedback(null);
    }, 4000);
  };

  const handleRemoveFromMyPractice = (profileId: string) => {
    const profToRemove = professionals.find((p) => p.id === profileId);
    const firmName = profToRemove ? profToRemove.company : 'Practice Profile';

    if (profileId.startsWith('prof-custom-') || !profToRemove?.isMyPractice) {
      onDeleteProfile?.(profileId);
    } else {
      if (onToggleMyPractice) {
        onToggleMyPractice(profileId, false);
      } else {
        onDeleteProfile?.(profileId);
      }
    }

    if (editingProfileId === profileId) {
      setEditingProfileId(null);
      setShowAddForm(false);
    }
    setProfileDeleteConfirmId(null);
    setPracticeActionFeedback(`Removed "${firmName}" from My Practice.`);
    setTimeout(() => setPracticeActionFeedback(null), 4000);
  };

  const handleAddToMyPractice = (prof: ProfessionalProfile) => {
    if (onToggleMyPractice) {
      onToggleMyPractice(prof.id, true);
    } else {
      onSaveProfile({ ...prof, isMyPractice: true });
    }
    setPracticeActionFeedback(`Added "${prof.company || prof.name}" to My Practice!`);
    setTimeout(() => setPracticeActionFeedback(null), 4000);
  };

  const renderProfessionalCard = (prof: ProfessionalProfile, isLive = false) => {
    const typeLabel =
      prof.professionalType === 'architect'
        ? 'Architect'
        : prof.professionalType === 'builder'
        ? 'Builder / Contractor'
        : 'Material Supplier';

    const Icon =
      prof.professionalType === 'architect'
        ? Building2
        : prof.professionalType === 'builder'
        ? HardHat
        : Boxes;

    const categoryBadgeStyles =
      prof.professionalType === 'architect'
        ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800/50'
        : prof.professionalType === 'builder'
        ? 'bg-amber-950/60 text-amber-300 border-amber-800/50'
        : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50';

    const cleanPhone = (prof.phone || '').replace(/[^0-9+]/g, '');
    const cleanWhatsapp = (prof.whatsapp || cleanPhone).replace(/[^0-9]/g, '');
    const isPracticeMember = Boolean(prof.isMyPractice || prof.id.startsWith('prof-custom-'));

    return (
      <div
        key={prof.id}
        id={`card-${prof.id}`}
        className={`rounded-xl bg-slate-900 border p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition group shadow-sm ${
          isPracticeMember ? 'border-amber-500/40 bg-slate-900/90' : 'border-slate-800'
        }`}
      >
        <div className="space-y-3">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-lg text-amber-400 border shrink-0 ${
                  isPracticeMember
                    ? 'bg-amber-500/15 border-amber-500/40'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition">
                    {prof.name}
                  </h3>
                  {isPracticeMember && (
                    <span
                      title="Part of My Practice Workspace"
                      className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    >
                      <Building2 className="w-3 h-3 text-amber-400" />
                      <span>My Practice</span>
                    </span>
                  )}
                  {prof.verified && (
                    <span
                      title="Verified Council / Association Registered"
                      className="inline-flex items-center gap-0.5 text-emerald-400 text-[10px] font-medium bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40"
                    >
                      <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Verified</span>
                    </span>
                  )}
                  {/* Live Status indicator */}
                  <span
                    title="Live Active Partner"
                    className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/50 text-emerald-300 border border-emerald-800/40"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>LIVE</span>
                  </span>
                  {isLive && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      Google Grounded
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-medium">{prof.company}</p>
              </div>
            </div>

            <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border whitespace-nowrap ${categoryBadgeStyles}`}>
              {typeLabel}
            </span>
          </div>

          {/* Location & Address with Google Maps link */}
          <div className="space-y-1 text-xs text-slate-300">
            <div className="flex items-center justify-between gap-1.5 text-slate-400">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{prof.location}</span>
              </div>
              {prof.deliveryCoverage && (
                <span className="text-[10px] font-mono text-slate-500 truncate max-w-[140px]" title={`Delivery coverage: ${prof.deliveryCoverage}`}>
                  📍 {prof.deliveryCoverage}
                </span>
              )}
            </div>
            {prof.address && (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(`${prof.company} ${prof.address}`)}`}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-slate-400 hover:text-amber-300 pl-5 line-clamp-1 flex items-center gap-1 transition"
                title={`Open "${prof.address}" in Google Maps`}
              >
                <span>{prof.address}</span>
                <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-60" />
              </a>
            )}
          </div>

          {/* Bio & Services */}
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{prof.bio}</p>

          <div className="flex flex-wrap gap-1">
            {prof.services
              .split(',')
              .slice(0, 3)
              .map((service, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 rounded-full bg-slate-800/70 border border-slate-700/60 text-[10px] font-mono text-slate-300"
                >
                  {service.trim()}
                </span>
              ))}
          </div>

          {/* Direct Contact Links & WhatsApp RFQ */}
          <div className="pt-2 border-t border-slate-800/60 space-y-1.5">
            {prof.phone && (
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-300 font-mono font-medium">
                  <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <a
                    href={`tel:${cleanPhone}`}
                    className="hover:text-emerald-400 hover:underline transition"
                    title="Call directly"
                  >
                    {prof.phone}
                  </a>
                </div>

                {cleanWhatsapp && (
                  <button
                    type="button"
                    onClick={() => handleOpenWhatsAppRFQ(prof)}
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 transition font-medium"
                    title="Send instant RFQ on WhatsApp"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>WhatsApp RFQ</span>
                    <ArrowUpRight className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            )}

            {prof.email && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate">
                <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <a
                  href={`mailto:${prof.email}?subject=Project%20Enquiry%20from%20Gouse%20AI`}
                  className="hover:text-amber-300 hover:underline transition truncate"
                >
                  {prof.email}
                </a>
              </div>
            )}

            {(prof.website || prof.sourceUrl) && (
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-900">
                <a
                  href={prof.website || prof.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200 text-[11px] truncate max-w-[240px]"
                >
                  <Globe className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="truncate">
                    {prof.website ? new URL(prof.website).hostname : 'Verified Portal'}
                  </span>
                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                </a>

                {prof.leadTimeDays && (
                  <span className="text-[10px] text-amber-300 font-mono">
                    ⚡ ~{prof.leadTimeDays}d response
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer info & Enquiry actions */}
        <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                <Star className="w-3 h-3 fill-amber-400" /> {prof.rating}
              </span>
              <span>•</span>
              <span>{prof.completedProjects} Projects</span>
              <span>•</span>
              <span>{prof.experienceYears}y Exp</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setSelectedProfessional(prof)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition shadow-sm"
            >
              <Send className="w-3 h-3" />
              <span>Send Project Enquiry</span>
            </button>

            {/* Remove from My Practice or Add to My Practice */}
            {isPracticeMember ? (
              <button
                type="button"
                onClick={() => setProfileDeleteConfirmId(prof.id)}
                title="Remove this firm from My Practice"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-200 border border-red-800/40 text-xs transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Remove Practice</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleAddToMyPractice(prof)}
                title="Add this firm to My Practice"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-500/40 text-xs transition"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Add Practice</span>
              </button>
            )}

            {isLive && (
              <button
                onClick={() => handleSaveToDirectory(prof)}
                title="Save this professional to local workspace directory"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-300 border border-slate-700 transition"
              >
                {savedSuccessId === prof.id ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <BookmarkPlus className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Store className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-bold text-white">Architectural Marketplace &amp; Directory</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Discover verified architects, general contractors, and material suppliers or ground live vendors via Google.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 self-start md:self-auto flex-wrap">
          <button
            id="tab-google-search"
            onClick={() => setActiveTab('google-search')}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              activeTab === 'google-search'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-amber-400" />
            <span>Google Live Search</span>
          </button>
          <button
            id="tab-directory"
            onClick={() => setActiveTab('browse')}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              activeTab === 'browse'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Saved Directory ({professionals.length})</span>
          </button>
          <button
            id="tab-enquiries"
            onClick={() => setActiveTab('enquiries')}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              activeTab === 'enquiries'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Enquiries ({enquiries.length})</span>
          </button>
          <button
            id="tab-profile"
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>My Practice ({myPractices.length})</span>
          </button>
        </div>
      </div>

      {/* Global Practice Action Feedback Banner */}
      {practiceActionFeedback && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{practiceActionFeedback}</span>
          </div>
          <button
            onClick={() => setPracticeActionFeedback(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Live Multi-Discipline Radar & Quick Category Selector */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  LIVE MARKETPLACE RADAR
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                  ● REAL-TIME DIRECTORY
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Direct phone lines, Google Maps addresses, verified associations &amp; RFQ enquiry dispatch.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleExecuteGoogleSearch(googleQuery, selectedType, googleLocation)}
              disabled={isSearchingGoogle}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSearchingGoogle ? 'animate-spin' : ''}`} />
              <span>Refresh Live Data</span>
            </button>

            {googleResults.length > 0 && (
              <button
                type="button"
                onClick={handleSaveAllLiveToDirectory}
                title="Synchronize all discovered live partners into your workspace"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-semibold transition"
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-amber-400" />
                <span>Save All Live ({googleResults.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Switcher Cards with Real-Time Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => handleQuickCategorySwitch('all')}
            className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
              selectedType === 'all'
                ? 'bg-amber-500/15 border-amber-500/50 text-white shadow-sm'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs font-bold">ALL DISCIPLINES</div>
                <div className="text-[10px] text-slate-400">Architects, Builders, Materials</div>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-bold border border-slate-700">
              {professionals.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickCategorySwitch('architect')}
            className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
              selectedType === 'architect'
                ? 'bg-cyan-500/15 border-cyan-500/50 text-white shadow-sm'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <div className="text-xs font-bold">ARCHITECTS</div>
                <div className="text-[10px] text-slate-400">Design Studios &amp; Planners</div>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 font-bold border border-cyan-800/40">
              {architectCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickCategorySwitch('builder')}
            className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
              selectedType === 'builder'
                ? 'bg-amber-500/15 border-amber-500/50 text-white shadow-sm'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <HardHat className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs font-bold">BUILDERS</div>
                <div className="text-[10px] text-slate-400">Civil &amp; General Contractors</div>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 font-bold border border-amber-800/40">
              {builderCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickCategorySwitch('material_supplier')}
            className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
              selectedType === 'material_supplier'
                ? 'bg-emerald-500/15 border-emerald-500/50 text-white shadow-sm'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs font-bold">MATERIAL SUPPLIERS</div>
                <div className="text-[10px] text-slate-400">Steel, Cement &amp; Depots</div>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 font-bold border border-emerald-800/40">
              {supplierCount}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: GOOGLE LIVE SEARCH                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'google-search' && (
        <div className="space-y-6">
          {/* Search Query Control Panel */}
          <div className="p-5 rounded-xl bg-slate-900 border border-amber-500/25 space-y-4 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Search className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Search via Google for Architects, Builders &amp; Material Suppliers
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                      Grounded with Contact Numbers
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Retrieves operational firms with verified office phone numbers, street addresses, and project portfolios.
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Live Grounding Engine</span>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleExecuteGoogleSearch();
              }}
              className="grid grid-cols-1 md:grid-cols-12 gap-3"
            >
              <div className="md:col-span-5">
                <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
                  Query or Specialization
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={googleQuery}
                    onChange={(e) => setGoogleQuery(e.target.value)}
                    placeholder="e.g. Sustainable architects, turnkey RCC builders, TMT rebar suppliers..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div className="md:col-span-3">
                <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
                  Target City / Region
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={googleLocation}
                    onChange={(e) => setGoogleLocation(e.target.value)}
                    placeholder="e.g. Bangalore, India"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
                  Discipline
                </label>
                <select
                  value={googleType}
                  onChange={(e) => setGoogleType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500 transition"
                >
                  <option value="all">All Disciplines</option>
                  <option value="architect">Architects &amp; Designers</option>
                  <option value="builder">Builders &amp; General Contractors</option>
                  <option value="material_supplier">Material Suppliers &amp; Depots</option>
                </select>
              </div>

              <div className="md:col-span-2 flex items-end">
                <button
                  type="submit"
                  disabled={isSearchingGoogle}
                  className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10"
                >
                  {isSearchingGoogle ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" />
                      <span>Search Live</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Quick Search Shortcut Tags */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-800/80">
              <span className="text-[10px] uppercase font-mono text-slate-500 mr-1">Quick Search:</span>
              <button
                type="button"
                onClick={() => {
                  setGoogleQuery('Paint and architectural coating distributors');
                  setGoogleType('material_supplier');
                }}
                className="px-2 py-0.5 rounded-full bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700/60 text-[11px] transition"
              >
                🎨 Paint &amp; Coatings
              </button>
              <button
                type="button"
                onClick={() => {
                  setGoogleQuery('Jindal Panther Fe550D TMT steel rebar stockists');
                  setGoogleType('material_supplier');
                }}
                className="px-2 py-0.5 rounded-full bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700/60 text-[11px] transition"
              >
                🏗️ Jindal Panther / Steel
              </button>
              <button
                type="button"
                onClick={() => {
                  setGoogleQuery('OPC 53 Cement bulk suppliers');
                  setGoogleType('material_supplier');
                }}
                className="px-2 py-0.5 rounded-full bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700/60 text-[11px] transition"
              >
                🧱 Cement &amp; Concrete
              </button>
              <button
                type="button"
                onClick={() => {
                  setGoogleQuery('Sustainable residential architects');
                  setGoogleType('architect');
                }}
                className="px-2 py-0.5 rounded-full bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700/60 text-[11px] transition"
              >
                📐 Sustainable Architects
              </button>
              <button
                type="button"
                onClick={() => {
                  setGoogleQuery('Turnkey RCC building contractors');
                  setGoogleType('builder');
                }}
                className="px-2 py-0.5 rounded-full bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700/60 text-[11px] transition"
              >
                👷 Turnkey Contractors
              </button>
            </div>
          </div>

          {/* Quota warning / Info banner */}
          {quotaNotice && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Search Notice</p>
                <p className="text-slate-300 text-[11px] mt-0.5">{quotaNotice}</p>
              </div>
            </div>
          )}

          {/* Grounding Sources */}
          {googleSources.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="font-mono text-[11px]">Sources:</span>
              {googleSources.slice(0, 4).map((s, idx) => (
                <a
                  key={idx}
                  href={s.uri}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] transition truncate max-w-[200px]"
                >
                  <Globe className="w-3 h-3" />
                  <span className="truncate">{s.title || 'Source'}</span>
                </a>
              ))}
            </div>
          )}

          {/* Results Grid */}
          {googleResults.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Live Search Findings ({googleResults.length})</h3>
                <span className="text-xs text-slate-400 font-mono">Grounded via Google Search</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {googleResults.map((prof) => renderProfessionalCard(prof, true))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SAVED DIRECTORY                                                    */}
      {/* ========================================================================= */}
      {activeTab === 'browse' && (
        <div className="space-y-6">
          <div className="space-y-3 p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter saved directory by company, services, or location..."
                  className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="all">All Disciplines</option>
                  <option value="architect">Architects</option>
                  <option value="builder">Builders</option>
                  <option value="material_supplier">Material Suppliers</option>
                </select>
              </div>
            </div>

            {/* Quick Filter Tags */}
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-800/80">
              <span className="text-[10px] uppercase font-mono text-slate-500 mr-1">Filter By:</span>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('all');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  !searchQuery && selectedType === 'all'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                All ({professionals.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('paint');
                  setSelectedType('material_supplier');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                  searchQuery.toLowerCase() === 'paint'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>🎨 Paint &amp; Coatings</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('panther');
                  setSelectedType('material_supplier');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                  searchQuery.toLowerCase() === 'panther'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>🏗️ Jindal Panther Rebar</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('steel');
                  setSelectedType('material_supplier');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                  searchQuery.toLowerCase() === 'steel'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>⚡ All Steel Suppliers</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('cement');
                  setSelectedType('material_supplier');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                  searchQuery.toLowerCase() === 'cement'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>🧱 Cement &amp; Concrete</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('architect');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                  selectedType === 'architect' && !searchQuery
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>📐 Architects</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('builder');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                  selectedType === 'builder' && !searchQuery
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>👷 Builders &amp; Contractors</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedProfessionals.map((prof) => renderProfessionalCard(prof, false))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ENQUIRIES DASHBOARD                                               */}
      {/* ========================================================================= */}
      {activeTab === 'enquiries' && (
        <div className="space-y-6">
          {/* Header & Overview */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <MessageSquare className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-white">
                  Project RFQs, Enquiries &amp; Live Vendor Quotations
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Track dispatched enquiries across Architects, Builders, and Material Suppliers with real-time quote generation.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-amber-300">
                Total: {enquiries.length} Enquiries
              </span>
            </div>
          </div>

          {/* Enquiry Filters: Discipline & Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            {/* Discipline Filter Tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-mono uppercase text-slate-500 mr-1">Filter:</span>
              <button
                type="button"
                onClick={() => setEnquiryCategoryFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  enquiryCategoryFilter === 'all'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Enquiries ({enquiries.length})
              </button>
              <button
                type="button"
                onClick={() => setEnquiryCategoryFilter('architect')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                  enquiryCategoryFilter === 'architect'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="w-3 h-3 text-cyan-400" />
                <span>Architects ({enquiries.filter((e) => e.professionalType === 'architect').length})</span>
              </button>
              <button
                type="button"
                onClick={() => setEnquiryCategoryFilter('builder')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                  enquiryCategoryFilter === 'builder'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <HardHat className="w-3 h-3 text-amber-400" />
                <span>Builders ({enquiries.filter((e) => e.professionalType === 'builder').length})</span>
              </button>
              <button
                type="button"
                onClick={() => setEnquiryCategoryFilter('material_supplier')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                  enquiryCategoryFilter === 'material_supplier'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Boxes className="w-3 h-3 text-emerald-400" />
                <span>Materials ({enquiries.filter((e) => e.professionalType === 'material_supplier').length})</span>
              </button>
            </div>

            {/* Status Filter Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-500 uppercase">Status:</span>
              <select
                value={enquiryStatusFilter}
                onChange={(e) => setEnquiryStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Review</option>
                <option value="quoted">Quoted</option>
                <option value="responded">Responded</option>
                <option value="accepted">Accepted</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Enquiries List */}
          {enquiries.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-dashed border-slate-800 bg-slate-900/30">
              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No enquiries recorded yet.</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Browse the directory or search with Google and click &quot;Send Project Enquiry&quot; on any card.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {enquiries
                .filter((enq) => {
                  if (enquiryCategoryFilter !== 'all' && enq.professionalType !== enquiryCategoryFilter) {
                    return false;
                  }
                  if (enquiryStatusFilter !== 'all' && enq.status !== enquiryStatusFilter) {
                    return false;
                  }
                  return true;
                })
                .map((enq) => {
                  const targetProf = professionals.find((p) => p.id === enq.professionalId);
                  const isRequestingThis = requestingQuoteId === enq.id;
                  const hasQuote = Boolean(enq.quotedAmount || enq.responseMessage);

                  const profTypeBadge =
                    enq.professionalType === 'architect'
                      ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800/40'
                      : enq.professionalType === 'builder'
                      ? 'bg-amber-950/60 text-amber-300 border-amber-800/40'
                      : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40';

                  const typeLabel =
                    enq.professionalType === 'architect'
                      ? 'Architect'
                      : enq.professionalType === 'builder'
                      ? 'Builder'
                      : 'Material Supplier';

                  return (
                    <div
                      key={enq.id}
                      className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 space-y-4 transition shadow-sm"
                    >
                      {/* Top Header of Enquiry */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-slate-800/80 pb-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-white">{enq.projectTitle}</h4>
                            <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${profTypeBadge}`}>
                              {typeLabel}
                            </span>
                            {enq.budget && (
                              <span className="text-[11px] font-mono font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                                Indicative Budget: {enq.budget}
                              </span>
                            )}
                            {hasQuote && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                                <Zap className="w-3 h-3 text-amber-400" />
                                <span>Live Quote Available</span>
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                            <span>
                              Vendor:{' '}
                              <strong className="text-amber-300">
                                {enq.company || enq.professionalName}
                              </strong>{' '}
                              ({enq.professionalName})
                            </span>
                            <span>•</span>
                            <span>
                              Client: <span className="text-slate-200">{enq.clientName}</span>
                            </span>
                            {enq.clientPhone && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-400 font-mono">{enq.clientPhone}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Status Control & Date */}
                        <div className="flex items-center gap-2.5 self-start">
                          <select
                            value={enq.status}
                            onChange={(e) => onUpdateEnquiryStatus(enq.id, e.target.value as EnquiryStatus)}
                            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
                          >
                            <option value="open">Status: Open</option>
                            <option value="in_progress">Status: In Review</option>
                            <option value="quoted">Status: Quoted</option>
                            <option value="responded">Status: Responded</option>
                            <option value="accepted">Status: Accepted</option>
                            <option value="closed">Status: Closed</option>
                          </select>
                          <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">
                            {new Date(enq.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Transmitted Message / RFQ Scope */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono uppercase text-slate-500 block">
                          Transmitted Project Scope &amp; Specifications:
                        </span>
                        <p className="text-xs text-slate-300 bg-slate-950 p-3.5 rounded-lg border border-slate-800 whitespace-pre-wrap leading-relaxed">
                          {enq.message}
                        </p>
                      </div>

                      {/* Verified Live Vendor Quotation Box */}
                      {hasQuote && (
                        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-slate-950 to-emerald-950/20 border border-amber-500/30 space-y-2.5">
                          <div className="flex items-center justify-between border-b border-amber-500/20 pb-2 flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="p-1 rounded bg-amber-500/20 text-amber-400">
                                <Zap className="w-3.5 h-3.5" />
                              </span>
                              <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wide">
                                Verified Live Vendor Quotation
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                                ● Grounded
                              </span>
                            </div>

                            {enq.quotedAmount && (
                              <div className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-800/50">
                                Quoted Amount: {enq.quotedAmount}
                              </div>
                            )}
                          </div>

                          {enq.estimatedDelivery && (
                            <div className="text-xs font-mono text-slate-300 flex items-center gap-2">
                              <span className="text-amber-400">⚡ Mobilization / Delivery:</span>
                              <span>{enq.estimatedDelivery}</span>
                            </div>
                          )}

                          {enq.responseMessage && (
                            <p className="text-xs text-slate-200 leading-relaxed italic bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                              &quot;{enq.responseMessage}&quot;
                            </p>
                          )}

                          {enq.respondedAt && (
                            <div className="text-[10px] font-mono text-slate-500 text-right">
                              Received: {new Date(enq.respondedAt).toLocaleString()}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Bar for Enquiry */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80 flex-wrap">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleRequestLiveQuote(enq)}
                            disabled={isRequestingThis}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition disabled:opacity-50 shadow-sm"
                          >
                            {isRequestingThis ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Generating Live Quote...</span>
                              </>
                            ) : (
                              <>
                                <Zap className="w-3.5 h-3.5" />
                                <span>{hasQuote ? 'Refresh Live Quote' : 'Request Live Vendor Quote'}</span>
                              </>
                            )}
                          </button>

                          {targetProf && (
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenWhatsAppRFQ(
                                  targetProf,
                                  `Regarding Project RFQ: ${enq.projectTitle}\nBudget: ${enq.budget || 'Negotiable'}`
                                )
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-800/50 text-xs font-semibold transition"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp Vendor</span>
                            </button>
                          )}

                          {targetProf?.phone && (
                            <a
                              href={`tel:${targetProf.phone.replace(/[^0-9+]/g, '')}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition"
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Call {targetProf.phone}</span>
                            </a>
                          )}
                        </div>

                        <div className="text-[11px] font-mono text-slate-500">
                          RFQ Ref: {enq.id}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MY PRACTICE PROFILE & MANAGEMENT                                  */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Practice Management Header */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <Building2 className="w-5 h-5" />
                </span>
                <h3 className="text-base font-bold text-white">My Practice Directory &amp; Listings</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Manage your firm listings, contracting units, and marketplace presence. You can add new practices or remove existing ones from your workspace.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-amber-300 border border-slate-700 font-mono text-xs whitespace-nowrap">
                {myPractices.length} Practice{myPractices.length !== 1 ? 's' : ''} Listed
              </span>

              {!showAddForm && (
                <button
                  type="button"
                  onClick={handleStartNewPractice}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Practice Profile</span>
                </button>
              )}
            </div>
          </div>

          {/* Remove Practice Confirmation Banner */}
          {profileDeleteConfirmId && (
            <div className="p-4 rounded-xl bg-red-950/50 border border-red-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in shadow-lg">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-red-900/50 text-red-400 border border-red-700/60 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-red-100">
                    Remove "{professionals.find((p) => p.id === profileDeleteConfirmId)?.company || 'Practice Profile'}" from My Practice?
                  </h4>
                  <p className="text-[11px] text-red-300/80 mt-0.5">
                    This practice will be removed from your practice workspace and directory listings.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => setProfileDeleteConfirmId(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveFromMyPractice(profileDeleteConfirmId)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Yes, Remove from My Practice</span>
                </button>
              </div>
            </div>
          )}

          {/* List of Registered Practices */}
          {myPractices.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Registered Practice Profiles
                </h4>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {myPractices.map((prof) => {
                  const typeLabel =
                    prof.professionalType === 'architect'
                      ? 'Architectural Studio'
                      : prof.professionalType === 'builder'
                      ? 'Builder / Contractor'
                      : 'Material Supplier';

                  const Icon =
                    prof.professionalType === 'architect'
                      ? Building2
                      : prof.professionalType === 'builder'
                      ? HardHat
                      : Boxes;

                  const cleanPhone = (prof.phone || '').replace(/[^0-9+]/g, '');
                  const cleanWhatsapp = (prof.whatsapp || cleanPhone).replace(/[^0-9]/g, '');

                  return (
                    <div
                      key={prof.id}
                      className="rounded-xl bg-slate-900 border border-amber-500/30 p-5 flex flex-col justify-between space-y-4 shadow-sm hover:border-amber-500/50 transition"
                    >
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h3 className="text-sm font-bold text-white">{prof.name}</h3>
                                <span className="inline-flex items-center gap-0.5 text-amber-300 text-[10px] font-medium bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/40">
                                  <Building2 className="w-3 h-3 text-amber-400" />
                                  <span>My Practice</span>
                                </span>
                                {prof.verified && (
                                  <span className="inline-flex items-center gap-0.5 text-emerald-400 text-[10px] font-medium bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40">
                                    <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                                    <span>Verified</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-amber-200/80 font-medium">{prof.company}</p>
                            </div>
                          </div>

                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 whitespace-nowrap">
                            {typeLabel}
                          </span>
                        </div>

                        {/* Location & Address */}
                        <div className="space-y-1 text-xs text-slate-300">
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{prof.location}</span>
                          </div>
                          {prof.address && (
                            <p className="text-[11px] text-slate-400 pl-5 line-clamp-1" title={prof.address}>
                              {prof.address}
                            </p>
                          )}
                        </div>

                        {/* Bio */}
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{prof.bio}</p>

                        {/* Services */}
                        <div className="flex flex-wrap gap-1">
                          {prof.services.split(',').slice(0, 4).map((srv, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950 text-slate-300 border border-slate-800"
                            >
                              {srv.trim()}
                            </span>
                          ))}
                        </div>

                        {/* Direct Contacts */}
                        <div className="pt-2 border-t border-slate-800 space-y-1.5">
                          {prof.phone && (
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5 text-slate-300 truncate">
                                <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <a
                                  href={`tel:${cleanPhone}`}
                                  className="hover:text-amber-300 transition truncate"
                                >
                                  {prof.phone}
                                </a>
                              </div>

                              {cleanWhatsapp && (
                                <a
                                  href={`https://wa.me/${cleanWhatsapp}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40 transition"
                                >
                                  <span>WhatsApp</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          )}

                          {prof.email && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate">
                              <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <a
                                href={`mailto:${prof.email}`}
                                className="hover:text-amber-300 hover:underline transition truncate"
                              >
                                {prof.email}
                              </a>
                            </div>
                          )}

                          {prof.website && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate">
                              <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <a
                                href={prof.website}
                                target="_blank"
                                rel="noreferrer"
                                className="text-amber-300 hover:text-amber-200 truncate inline-flex items-center gap-1"
                              >
                                <span>{prof.website}</span>
                                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer Actions: Remove and Edit */}
                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setProfileDeleteConfirmId(prof.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/50 hover:bg-red-900/70 text-red-400 hover:text-red-200 border border-red-800/50 text-xs font-semibold transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove from My Practice</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStartEditPractice(prof)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-slate-200 hover:text-amber-300 border border-slate-700 hover:border-amber-500/40 text-xs font-medium transition"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Edit Practice</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-3">
              <Building2 className="w-8 h-8 text-amber-400 mx-auto opacity-60" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">No Practice Profile Registered</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  You currently have no practice registered in your workspace. Use the form below to list your firm or contracting company.
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartNewPractice}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>Register Practice Now</span>
              </button>
            </div>
          )}

          {/* Add / Edit Practice Form */}
          {(showAddForm || myPractices.length === 0) && (
            <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-6 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {editingProfileId ? (
                      <>
                        <Edit3 className="w-4 h-4 text-amber-400" />
                        <span>Edit Practice Profile</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 text-amber-400" />
                        <span>Add New Practice to Marketplace</span>
                      </>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {editingProfileId
                      ? 'Update your firm details, registered capabilities, and verified contact numbers.'
                      : 'Register a new architectural practice, contracting team, or supply firm in the directory.'}
                  </p>
                </div>

                {editingProfileId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel Edit</span>
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Discipline</label>
                    <select
                      value={profileType}
                      onChange={(e) => setProfileType(e.target.value as ProfessionalType)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    >
                      <option value="architect">Architectural Studio / Architect</option>
                      <option value="builder">Builder / General Contractor</option>
                      <option value="material_supplier">Material Supplier / Manufacturer</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Principal / Contact Person</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      required
                      placeholder="e.g. Ar. S. Gouse"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-300">Registered Firm / Business Name</label>
                    <input
                      type="text"
                      value={profileCompany}
                      onChange={(e) => setProfileCompany(e.target.value)}
                      required
                      placeholder="e.g. Studio Gouse Architectural Practice"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Contact Phone & WhatsApp */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-amber-300 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-amber-400" />
                      Contact Telephone / Mobile *
                    </label>
                    <input
                      type="text"
                      placeholder="+91 98450 12345"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-amber-500/40 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">WhatsApp Number</label>
                    <input
                      type="text"
                      placeholder="+91 98450 12345"
                      value={profileWhatsapp}
                      onChange={(e) => setProfileWhatsapp(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Official Email</label>
                    <input
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      required
                      placeholder="contact@studio.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Website URL</label>
                    <input
                      type="url"
                      placeholder="https://studio.com"
                      value={profileWebsite}
                      onChange={(e) => setProfileWebsite(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-300">City / Operational Region</label>
                    <input
                      type="text"
                      value={profileLocation}
                      onChange={(e) => setProfileLocation(e.target.value)}
                      required
                      placeholder="e.g. Bangalore, Karnataka"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-300">Physical Office / Shop Address</label>
                    <input
                      type="text"
                      placeholder="e.g. Suite 402, Trade Tower, MG Road, Bengaluru 560001"
                      value={profileAddress}
                      onChange={(e) => setProfileAddress(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-300">Services &amp; Capabilities (comma-separated)</label>
                    <input
                      type="text"
                      value={profileServices}
                      onChange={(e) => setProfileServices(e.target.value)}
                      required
                      placeholder="e.g. Architectural Planning, Interior Design, Turnkey Contracting"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-300">Firm Bio &amp; Key Specialization</label>
                    <textarea
                      rows={3}
                      value={profileBio}
                      onChange={(e) => setProfileBio(e.target.value)}
                      required
                      placeholder="Describe your design philosophy, architectural experience, and project strengths."
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white focus:border-amber-500 focus:outline-none resize-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  {profileSavedMsg ? (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Practice profile saved and listed!
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">
                      Profile will immediately appear in your Practice workspace and Directory.
                    </span>
                  )}

                  <div className="flex items-center gap-2">
                    {myPractices.length > 0 && showAddForm && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm"
                    >
                      {editingProfileId ? 'Save Practice Updates' : 'Add Practice Profile'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEND ENQUIRY MODAL                                                        */}
      {/* ========================================================================= */}
      {selectedProfessional && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-amber-400">
                  Send Formal Project Enquiry
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {selectedProfessional.name}
                </h3>
                <p className="text-xs text-slate-400">{selectedProfessional.company}</p>
                {selectedProfessional.phone && (
                  <p className="text-xs font-mono text-emerald-400 mt-1 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Contact: {selectedProfessional.phone}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedProfessional(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {enquirySentSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="text-sm font-bold text-white">Enquiry Transmitted Successfully</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Your project scope and contact details have been registered. If selected, a live grounded vendor quotation has been generated in your Enquiries log.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendEnquirySubmit} className="space-y-3">
                {/* Scope Presets */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-amber-400 block">
                    ⚡ Quick Scope Presets:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProfessional.professionalType === 'architect' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEnquiryProjectTitle('Bioclimatic 3,200 sq.ft Residential Villa Design');
                            setEnquiryMessage(
                              'Requesting complete architectural package including concept zoning, structural engineering drawings, photorealistic 3D elevations, and municipal approval liaisons.'
                            );
                            setEnquiryBudget('₹ 1.2 Cr - 1.8 Cr');
                          }}
                          className="px-2 py-1 rounded bg-slate-950 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-800 text-[10px] font-mono transition"
                        >
                          📐 Luxury Villa Architectural Package
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEnquiryProjectTitle('Modern Interior Turnkey Design & Styling');
                            setEnquiryMessage(
                              'Requesting turnkey interior architectural styling, modular woodwork drawings, false ceiling layouts, lighting schemes, and material specifications.'
                            );
                            setEnquiryBudget('₹ 35 Lakh - 50 Lakh');
                          }}
                          className="px-2 py-1 rounded bg-slate-950 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-800 text-[10px] font-mono transition"
                        >
                          🛋️ Turnkey Interiors
                        </button>
                      </>
                    )}

                    {selectedProfessional.professionalType === 'builder' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEnquiryProjectTitle('Turnkey RCC Civil Construction (Labor + Materials)');
                            setEnquiryMessage(
                              'Seeking comprehensive turnkey civil contracting for a G+2 building (approx 4,800 sq.ft built-up area). Scope covers earthwork, RCC frame, masonry, plastering, waterproofing, and MEP services.'
                            );
                            setEnquiryBudget('₹ 1.85 Cr - 2.4 Cr');
                          }}
                          className="px-2 py-1 rounded bg-slate-950 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-800 text-[10px] font-mono transition"
                        >
                          👷 Turnkey Civil Contract
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEnquiryProjectTitle('RCC Superstructure & Slab Core Package');
                            setEnquiryMessage(
                              'Seeking contractor quotation for RCC footings, columns, and post-tensioned floor slabs with all shuttering, steel binding, and concrete pumping.'
                            );
                            setEnquiryBudget('₹ 75 Lakh - 95 Lakh');
                          }}
                          className="px-2 py-1 rounded bg-slate-950 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-800 text-[10px] font-mono transition"
                        >
                          🏗️ RCC Core Package
                        </button>
                      </>
                    )}

                    {selectedProfessional.professionalType === 'material_supplier' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEnquiryProjectTitle('Bulk TMT Fe550D Rebar Consignment (18 Metric Tons)');
                            setEnquiryMessage(
                              'Need direct mill-delivered quotation for 18 MT Fe550D primary steel (8mm: 4 MT, 12mm: 6 MT, 16mm: 5 MT, 20mm: 3 MT) with test certificates and site unloading in Bangalore.'
                            );
                            setEnquiryBudget('₹ 11.5 Lakh - 13.5 Lakh');
                          }}
                          className="px-2 py-1 rounded bg-slate-950 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-800 text-[10px] font-mono transition"
                        >
                          🏗️ Bulk TMT Rebar (18 MT)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEnquiryProjectTitle('Bulk UltraTech OPC 53 Grade Cement (600 Bags)');
                            setEnquiryMessage(
                              'Need quotation for 600 bags of OPC 53 Grade cement with batch test certificates and staged delivery schedule to project site.'
                            );
                            setEnquiryBudget('₹ 2.4 Lakh - 2.8 Lakh');
                          }}
                          className="px-2 py-1 rounded bg-slate-950 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-800 text-[10px] font-mono transition"
                        >
                          🧱 Bulk Cement Lot (600 Bags)
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 uppercase">Project Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Modern Minimalist Residence in Bangalore"
                    value={enquiryProjectTitle}
                    onChange={(e) => setEnquiryProjectTitle(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 uppercase">Your Name</label>
                    <input
                      type="text"
                      required
                      value={enquiryClientName}
                      onChange={(e) => setEnquiryClientName(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 uppercase">Your Phone</label>
                    <input
                      type="text"
                      value={enquiryClientPhone}
                      onChange={(e) => setEnquiryClientPhone(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 uppercase">Your Email</label>
                  <input
                    type="email"
                    required
                    value={enquiryClientEmail}
                    onChange={(e) => setEnquiryClientEmail(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 uppercase">Indicative Budget</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹ 1.2 Cr - 1.8 Cr"
                    value={enquiryBudget}
                    onChange={(e) => setEnquiryBudget(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 uppercase">Scope &amp; Requirements</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe your site location, built-up area, structural needs, architectural preferences, or required material quantities..."
                    value={enquiryMessage}
                    onChange={(e) => setEnquiryMessage(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Live Feature Options */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={autoRequestQuoteOnSubmit}
                      onChange={(e) => setAutoRequestQuoteOnSubmit(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0"
                    />
                    <span className="flex items-center gap-1 font-medium text-amber-300">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Auto-generate Live Vendor Quotation upon dispatch</span>
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={sendViaWhatsApp}
                      onChange={(e) => setSendViaWhatsApp(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-0"
                    />
                    <span className="flex items-center gap-1 font-medium text-emerald-400">
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Open WhatsApp with pre-filled RFQ message</span>
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedProfessional(null)}
                    disabled={isSubmittingEnquiry}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEnquiry}
                    className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmittingEnquiry ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Transmitting RFQ &amp; Live Quote...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Project Enquiry</span>
                      </>
                    )}
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
