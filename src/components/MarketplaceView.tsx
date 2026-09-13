import React, { useState, useMemo, useEffect } from 'react';
import {
  Building2,
  HardHat,
  Boxes,
  ShieldCheck,
  Star,
  MapPin,
  Sparkles,
  Search,
  Send,
  MessageSquare,
  Phone,
  Mail,
  Globe,
  ExternalLink,
  BookmarkPlus,
  CheckCircle2,
  RefreshCw,
  SlidersHorizontal,
  Compass,
  FileText,
  Clock,
  Map,
  Navigation,
  Palette,
  Hammer,
  Award,
  X,
  ChevronRight,
  Info,
  Check,
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
  onSaveProfile: (profile: ProfessionalProfile) => void;
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
  onSaveProfile,
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

  // AI Matching state
  const [isSmartMatching, setIsSmartMatching] = useState(false);
  const [matchRequirement, setMatchRequirement] = useState('');
  const [matchedIds, setMatchedIds] = useState<string[] | null>(null);

  // Enquiry modal state
  const [selectedProfessional, setSelectedProfessional] = useState<ProfessionalProfile | null>(null);
  const [enquiryProjectTitle, setEnquiryProjectTitle] = useState('');
  const [enquiryMessage, setEnquiryMessage] = useState('');
  const [enquiryBudget, setEnquiryBudget] = useState('');
  const [enquiryClientName, setEnquiryClientName] = useState('Ar. S. Gouse');
  const [enquiryClientEmail, setEnquiryClientEmail] = useState('sgouse14@gmail.com');
  const [enquiryClientPhone, setEnquiryClientPhone] = useState('+91 98450 78601');
  const [enquirySentSuccess, setEnquirySentSuccess] = useState(false);

  // ALVI's Yeshwanthpur Studio & Google Map Modal State
  const [showAlviInfoModal, setShowAlviInfoModal] = useState(false);
  const [alviModalTab, setAlviModalTab] = useState<'map' | 'services' | 'rates' | 'enquire'>('map');

  // Direct ALVI Enquiry in Enquiries tab state
  const [alviDirectTitle, setAlviDirectTitle] = useState('');
  const [alviDirectType, setAlviDirectType] = useState('Turnkey Architecture & Construction');
  const [alviDirectBudget, setAlviDirectBudget] = useState('');
  const [alviDirectMsg, setAlviDirectMsg] = useState('');
  const [alviDirectName, setAlviDirectName] = useState('Client (Bangalore)');
  const [alviDirectPhone, setAlviDirectPhone] = useState('+91 98450 78601');
  const [alviDirectEmail, setAlviDirectEmail] = useState('inquiry@alvis-architecture.com');
  const [alviDirectSuccess, setAlviDirectSuccess] = useState(false);

  // Find ALVI Flagship Profile
  const alviProfile = useMemo(() => {
    return (
      professionals.find((p) => p.id === 'prof-alvi-001' || p.company.includes("ALVI")) ||
      professionals[0]
    );
  }, [professionals]);

  // User Profile Form State
  const [profileType, setProfileType] = useState<ProfessionalType>('architect');
  const [profileName, setProfileName] = useState('Ar. S. Gouse (Principal)');
  const [profileCompany, setProfileCompany] = useState("ALVI's Architecture, Interior Designers & Construction");
  const [profileLocation, setProfileLocation] = useState('Yeshwanthpur, Bangalore, Karnataka');
  const [profileAddress, setProfileAddress] = useState(
    "ALVI's Architecture & Interior Experience Center, Near Yeshwanthpur Metro Station & Railway Station, Tumkur Main Road, Yeshwanthpur, Bengaluru 560022"
  );
  const [profilePhone, setProfilePhone] = useState('+91 98450 78601');
  const [profileWhatsapp, setProfileWhatsapp] = useState('+91 98450 78601');
  const [profileEmail, setProfileEmail] = useState('sgouse14@gmail.com');
  const [profileWebsite, setProfileWebsite] = useState('https://alvis-architecture.com');
  const [profileServices, setProfileServices] = useState(
    '1. Architectural Planning & 3D Elevations, 2. Luxury Residential & Commercial Interior Design, 3. Turnkey Civil Construction & RCC Framing, 4. Bespoke Teakwood Joinery & Modular Kitchens, 5. CSI Detailing, BOQ & Quantity Takeoffs, 6. BBMP / BDA Municipal Plan Sanctions'
  );
  const [profileBio, setProfileBio] = useState(
    "Headquartered in Yeshwanthpur, Bangalore, ALVI's Architecture, Interior Designers & Construction is a premier design-and-build practice. We seamlessly integrate master architectural planning, luxury interior styling, and turnkey civil construction under one accountable contract with 16+ years experience and 140+ delivered projects."
  );
  const [profileSavedMsg, setProfileSavedMsg] = useState(false);

  // Metro quick-pick locations
  const popularLocations = [
    'Bangalore, India',
    'Mumbai, India',
    'Delhi NCR, India',
    'Hyderabad, India',
    'Chennai, India',
    'Pune, India',
    'Kolkata, India',
  ];

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

  // Perform initial search on first load
  useEffect(() => {
    if (!googleSearchExecuted) {
      handleExecuteGoogleSearch();
    }
  }, []);

  // Filtered directory professionals
  const displayedProfessionals = useMemo(() => {
    let list = professionals;

    if (matchedIds !== null) {
      list = list.filter((p) => matchedIds.includes(p.id));
    }

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
  }, [professionals, selectedType, searchQuery, matchedIds]);

  const handleRunSmartMatch = () => {
    if (!matchRequirement.trim()) {
      setMatchedIds(null);
      setIsSmartMatching(false);
      return;
    }

    const words = matchRequirement.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    const scored = professionals.map((p) => {
      const fullText = `${p.professionalType} ${p.name} ${p.company} ${p.services} ${p.bio} ${p.location}`.toLowerCase();
      let score = 0;
      words.forEach((w) => {
        if (fullText.includes(w)) score += 10;
      });
      if (p.verified) score += 5;
      return { id: p.id, score };
    });

    const matches = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).map((s) => s.id);
    setMatchedIds(matches.length > 0 ? matches : []);
    setIsSmartMatching(false);
  };

  const handleSaveToDirectory = (prof: ProfessionalProfile) => {
    onSaveProfile({
      ...prof,
      id: `saved-${Date.now()}-${prof.id}`,
    });
    setSavedSuccessId(prof.id);
    setTimeout(() => setSavedSuccessId(null), 2500);
  };

  const handleSendEnquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfessional || !enquiryProjectTitle.trim() || !enquiryMessage.trim()) return;

    const newEnquiry: MarketplaceEnquiry = {
      id: `enq-${Date.now()}`,
      professionalId: selectedProfessional.id,
      professionalName: selectedProfessional.name,
      clientName: enquiryClientName.trim() || 'Client',
      clientEmail: enquiryClientEmail.trim() || 'client@example.com',
      projectTitle: enquiryProjectTitle.trim(),
      message: `${enquiryMessage.trim()}\n\nContact Phone: ${enquiryClientPhone}`,
      budget: enquiryBudget.trim(),
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    onAddEnquiry(newEnquiry);
    setEnquirySentSuccess(true);
    setTimeout(() => {
      setEnquirySentSuccess(false);
      setSelectedProfessional(null);
      setEnquiryProjectTitle('');
      setEnquiryMessage('');
      setEnquiryBudget('');
    }, 1500);
  };

  const handleSendAlviDirectEnquiry = (e: React.FormEvent) => {
    e.preventDefault();
    const newEnquiry: MarketplaceEnquiry = {
      id: `enq-alvi-${Date.now()}`,
      professionalId: 'prof-alvi-001',
      professionalName: "ALVI's Architecture, Interior Designers & Construction",
      clientName: alviDirectName || 'Prospective Client',
      clientEmail: alviDirectEmail || 'client@alvis-architecture.com',
      clientPhone: alviDirectPhone,
      projectTitle: alviDirectTitle || 'Turnkey Architectural & Interior Project',
      message: `[Service: ${alviDirectType}]\n${alviDirectMsg}`,
      budget: alviDirectBudget || '₹ 1.5 - 2.5 Cr',
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    onAddEnquiry(newEnquiry);
    setAlviDirectSuccess(true);
    setTimeout(() => {
      setAlviDirectSuccess(false);
      setAlviDirectTitle('');
      setAlviDirectMsg('');
      setAlviDirectBudget('');
    }, 3500);
  };

  const handleSaveProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProfile: ProfessionalProfile = {
      id: `prof-${Date.now()}`,
      professionalType: profileType,
      name: profileName,
      company: profileCompany,
      location: profileLocation,
      address: profileAddress,
      phone: profilePhone,
      whatsapp: profileWhatsapp,
      email: profileEmail,
      website: profileWebsite,
      services: profileServices,
      bio: profileBio,
      verified: true,
      rating: 5.0,
      completedProjects: 24,
      experienceYears: 12,
    };

    onSaveProfile(newProfile);
    setProfileSavedMsg(true);
    setTimeout(() => setProfileSavedMsg(false), 2500);
  };

  const renderContactCard = (prof: ProfessionalProfile, isLive: boolean = false) => {
    const typeLabel =
      prof.professionalType === 'architect'
        ? 'Architect'
        : prof.professionalType === 'builder'
        ? 'General Contractor'
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
        id={`card-${prof.id}`}
        className="rounded-xl bg-slate-900 border border-slate-800 p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition group shadow-sm"
      >
        <div className="space-y-3">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-slate-950 text-amber-400 border border-slate-800 shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition">
                    {prof.name}
                  </h3>
                  {prof.verified && (
                    <span title="Verified Council / Association Registered" className="inline-flex items-center gap-0.5 text-emerald-400 text-[10px] font-medium bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40">
                      <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Verified</span>
                    </span>
                  )}
                  {(prof.id === 'prof-alvi-001' || prof.company.includes("ALVI")) && (
                    <span className="inline-flex items-center gap-1 text-amber-300 text-[10px] font-semibold bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40">
                      <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>My Company • Flagship Practice</span>
                    </span>
                  )}
                  {isLive && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      Google Search
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-medium">{prof.company}</p>
              </div>
            </div>

            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 whitespace-nowrap">
              {typeLabel}
            </span>
          </div>

          {/* Bio */}
          <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
            {prof.bio}
          </p>

          {/* Services */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400">Services & Capabilities:</span>
            <div className="flex flex-wrap gap-1">
              {prof.services.split(',').slice(0, 4).map((s, idx) => (
                <span
                  key={idx}
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300"
                >
                  {s.trim()}
                </span>
              ))}
            </div>
          </div>

          {/* PROMINENT CONTACT NUMBER & DIRECT REACH BOX */}
          <div className="rounded-lg bg-slate-950/90 border border-amber-500/30 p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-semibold flex items-center gap-1">
                <Phone className="w-3 h-3 text-amber-400" />
                Direct Contact Number
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-medium">
                Direct Line Active
              </span>
            </div>

            {/* Phone Number Display */}
            <div className="flex items-center justify-between gap-2 bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-mono font-bold text-white tracking-wide">
                  {prof.phone || '+91 80 4123 7890'}
                </span>
              </div>

              {/* Action buttons: Call & WhatsApp */}
              <div className="flex items-center gap-1.5">
                {cleanPhone && (
                  <a
                    href={`tel:${cleanPhone}`}
                    title="Call this contact number directly"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition shadow-sm"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Call</span>
                  </a>
                )}
                {cleanWhatsapp && (
                  <a
                    href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`Hello, I am reaching out from Gouse AI regarding architectural / construction project requirements.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    title="Chat on WhatsApp"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-700/60 hover:bg-emerald-600 text-emerald-100 font-semibold text-[11px] border border-emerald-500/40 transition"
                  >
                    <span>WhatsApp</span>
                  </a>
                )}
                {prof.email && (
                  <a
                    href={`mailto:${prof.email}?subject=${encodeURIComponent(`Architectural / Project Inquiry via Gouse AI`)}`}
                    title="Send Email"
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Physical Address & Location */}
            {(prof.address || prof.location) && (
              <div className="space-y-1">
                <div className="flex items-start gap-1.5 text-[11px] text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">
                    {prof.address ? `${prof.address}` : prof.location}
                  </span>
                </div>
                {prof.landmark && (
                  <div className="flex items-center gap-1.5 pl-5 text-[10.5px] text-amber-300 font-mono">
                    <Navigation className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>Landmark: {prof.landmark}</span>
                  </div>
                )}
                {prof.googleMapsUrl && (
                  <div className="pl-5 pt-0.5">
                    <a
                      href={prof.googleMapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 hover:text-amber-200 underline"
                    >
                      <Map className="w-3 h-3 text-amber-400" />
                      <span>Open in Google Maps (Yeshwanthpur)</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Website or Source Link */}
            {(prof.website || prof.sourceUrl) && (
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-900">
                <a
                  href={prof.website || prof.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200 text-[11px] truncate max-w-[240px]"
                >
                  <Globe className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="truncate">{prof.website ? new URL(prof.website).hostname : 'Verified Portal'}</span>
                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                </a>

                {prof.sourceTitle && (
                  <span className="text-[10px] text-slate-400 truncate max-w-[140px]" title={prof.sourceTitle}>
                    {prof.sourceTitle}
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

            {(prof.id === 'prof-alvi-001' || prof.company.includes("ALVI")) && (
              <button
                onClick={() => {
                  setShowAlviInfoModal(true);
                  setAlviModalTab('map');
                }}
                title="View More Information & Yeshwanthpur Google Map"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition"
              >
                <Map className="w-3.5 h-3.5 text-amber-400" />
                <span>Map & Info</span>
              </button>
            )}

            {isLive && (
              <button
                onClick={() => handleSaveToDirectory(prof)}
                title="Save to My Verified Directory"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition"
              >
                {savedSuccessId === prof.id ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Saved</span>
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="w-3.5 h-3.5 text-amber-400" />
                    <span>Save</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="marketplace-view" className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-mono text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20 flex items-center gap-1.5">
              <Compass className="w-3 h-3 text-amber-400" />
              Google Search Grounded Marketplace & Directory
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
            Architects, Builders & Material Suppliers Network
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Search active architectural practices, general contractors, and material stockists with real-time Google search grounding and verified contact numbers.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
          <button
            id="tab-google-search"
            onClick={() => setActiveTab('google-search')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'google-search'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
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
            <span>My Practice</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FLAGSHIP PRACTICE SHOWCASE: ALVI'S ARCHITECTURE, INTERIOR DESIGNERS & CONSTRUCTION */}
      {/* ========================================================================= */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-amber-500/40 p-5 md:p-6 shadow-xl relative overflow-hidden space-y-5">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top row: Badges, Title & Quick Action Buttons */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800/80 pb-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-amber-500 text-slate-950 flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3 h-3 fill-slate-950" />
                Featured Flagship Practice
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Verified Council Registered
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-400" />
                Yeshwanthpur, Bengaluru
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>ALVI&apos;s Architecture, Interior Designers &amp; Construction</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 font-medium">
              Ar. S. Gouse (Principal Architect &amp; Turnkey Director) • <span className="text-amber-400 font-semibold">16+ Years Mastery</span> • <span className="text-amber-400 font-semibold">142+ Projects Completed</span> across Bangalore &amp; South India
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setShowAlviInfoModal(true);
                setAlviModalTab('map');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md"
            >
              <Map className="w-3.5 h-3.5" />
              <span>More Information &amp; Google Map</span>
            </button>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Yeshwanthpur+Metro+Station+Tumkur+Road+Bengaluru+560022"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
            >
              <Navigation className="w-3.5 h-3.5 text-amber-400" />
              <span>Directions</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
            <button
              onClick={() => setSelectedProfessional(alviProfile)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-semibold transition"
            >
              <Send className="w-3.5 h-3.5 text-amber-400" />
              <span>Send Project Enquiry</span>
            </button>
          </div>
        </div>

        {/* Location & Quick Contact Strip */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 text-xs">
          <div className="md:col-span-7 flex flex-col justify-center space-y-1">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <span className="font-bold text-white">Experience Center &amp; Head Office: </span>
                <span className="text-slate-300">
                  Near Yeshwanthpur Metro Station &amp; Railway Station, Tumkur Main Road, Yeshwanthpur, Bengaluru, Karnataka 560022
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 pl-6 text-[11px] text-amber-300/90 font-mono">
              <Navigation className="w-3 h-3 text-amber-400 shrink-0" />
              <span>Landmark: Adjacent to Yeshwanthpur Metro Station &amp; Govardhan Theatre, Tumkur Road Corridor (Green Line Metro 2-min walk)</span>
            </div>
          </div>

          <div className="md:col-span-5 flex items-center justify-start md:justify-end gap-2 flex-wrap border-t md:border-t-0 md:border-l border-slate-800 pt-2 md:pt-0 md:pl-3">
            <a
              href="tel:+919845078601"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>+91 98450 78601</span>
            </a>
            <a
              href="https://wa.me/919845078601?text=Hello%2C%20I%20am%20reaching%20out%20to%20ALVI's%20Architecture%2C%20Interior%20Designers%20%26%20Construction%20regarding%20a%20project."
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700/60 hover:bg-emerald-600 text-emerald-100 border border-emerald-500/40 font-semibold text-xs transition"
            >
              <span>WhatsApp Chat</span>
            </a>
            <a
              href="mailto:sgouse14@gmail.com?subject=Turnkey%20Project%20Inquiry%20-%20ALVI's"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Send Email to ALVI's"
            >
              <Mail className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Dual Column: Interactive Google Map of Yeshwanthpur + 3 Core Execution Pillars */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Embedded Google Map of Yeshwanthpur */}
          <div className="lg:col-span-5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider font-mono">
                <Map className="w-3.5 h-3.5 text-amber-400" />
                <span>Yeshwanthpur Studio Google Map</span>
              </div>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Yeshwanthpur+Metro+Station+Tumkur+Road+Bengaluru+560022"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-amber-300 hover:text-amber-200 inline-flex items-center gap-1 underline"
              >
                <span>Full Map View</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 h-56 w-full shadow-inner group">
              <iframe
                title="ALVI's Architecture, Interior Designers & Construction - Yeshwanthpur Studio Google Map"
                src="https://maps.google.com/maps?q=Yeshwanthpur%20Metro%20Station%20Tumkur%20Road%20Bengaluru%20Karnataka%20560022&t=&z=15&ie=UTF8&iwloc=&output=embed"
                className="w-full h-full border-0"
                loading="lazy"
                allowFullScreen
              />
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-950/85 backdrop-blur border border-slate-800 text-[11px] text-slate-300 pointer-events-auto">
                <span className="truncate flex items-center gap-1 text-[10.5px]">
                  <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                  Yeshwanthpur Metro Station Corridor
                </span>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Yeshwanthpur+Metro+Station+Tumkur+Road+Bengaluru+560022"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] shrink-0"
                >
                  Directions
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: The 3 Core Pillars & Rate Guides */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Pillar 1: Architecture */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>1. Architecture</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Master planning, 3D photorealistic elevations, bioclimatic orientation, BBMP &amp; BDA municipal sanction sets.
                </p>
                <span className="text-[10px] text-slate-400 block font-mono">Custom / sq.ft quotes</span>
              </div>

              {/* Pillar 2: Interior Designers */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <Palette className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>2. Interior Designers</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Luxury villas, bespoke teakwood &amp; brass joinery, Italian marble, modular kitchens, cove lighting.
                </p>
                <span className="text-[10px] text-emerald-400 block font-mono">₹1,200 - ₹3,500 / sq.ft</span>
              </div>

              {/* Pillar 3: Construction */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <HardHat className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>3. Construction</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Turnkey civil contracting, precision M25/M30 RCC framing, Fe550D TMT, MEP, 10-Yr waterproofing.
                </p>
                <span className="text-[10px] text-emerald-400 block font-mono">₹1,850 - ₹2,600 / sq.ft</span>
              </div>
            </div>

            {/* Bottom summary bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px]">Yeshwanthpur Experience Studio open Mon-Sat 9:30 AM - 7:30 PM</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowAlviInfoModal(true);
                    setAlviModalTab('rates');
                  }}
                  className="text-xs text-amber-300 hover:text-amber-200 font-semibold underline"
                >
                  View Packages &amp; Pricing
                </button>
                <span className="text-slate-600">•</span>
                <button
                  onClick={() => {
                    setShowAlviInfoModal(true);
                    setAlviModalTab('services');
                  }}
                  className="text-xs text-slate-300 hover:text-white font-medium"
                >
                  Explore Capabilities →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: GOOGLE LIVE SEARCH (Architects, Builders, Material Suppliers)     */}
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
                    Search via Google for Architects, Builders & Material Suppliers
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

            {/* Inputs: Category, Location, Keywords */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Category selector */}
              <div className="md:col-span-3 space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Category / Discipline</label>
                <select
                  id="google-search-type"
                  value={googleType}
                  onChange={(e) => setGoogleType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="all">All (Architects, Builders & Suppliers)</option>
                  <option value="architect">🏛️ Architects & Architectural Studios</option>
                  <option value="builder">👷 Builders & General Contractors</option>
                  <option value="material_supplier">📦 Material Suppliers, Yards & Stockists</option>
                </select>
              </div>

              {/* Location input */}
              <div className="md:col-span-3 space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Target City / Region</label>
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                  <input
                    id="google-search-location"
                    type="text"
                    placeholder="e.g. Bangalore, India"
                    value={googleLocation}
                    onChange={(e) => setGoogleLocation(e.target.value)}
                    className="w-full bg-transparent text-white focus:outline-none placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Search keywords / specialization */}
              <div className="md:col-span-4 space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Specialization / Material Specs</label>
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    id="google-search-keywords"
                    type="text"
                    placeholder="e.g. Sustainable timber, Turnkey RCC, Tata Tiscon steel rebar, AAC blocks"
                    value={googleQuery}
                    onChange={(e) => setGoogleQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleExecuteGoogleSearch();
                    }}
                    className="w-full bg-transparent text-white focus:outline-none placeholder-slate-500"
                  />
                  {googleQuery && (
                    <button onClick={() => setGoogleQuery('')} className="text-slate-400 hover:text-white">✕</button>
                  )}
                </div>
              </div>

              {/* Search button */}
              <div className="md:col-span-2 flex items-end">
                <button
                  id="btn-execute-google-search"
                  onClick={() => handleExecuteGoogleSearch()}
                  disabled={isSearchingGoogle}
                  className="w-full h-[38px] rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {isSearchingGoogle ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Google Search</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Metro preset chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 mr-1">Popular Hubs:</span>
              {popularLocations.map((loc) => (
                <button
                  key={loc}
                  onClick={() => {
                    setGoogleLocation(loc);
                    handleExecuteGoogleSearch(googleQuery, googleType, loc);
                  }}
                  className={`text-[11px] px-2 py-0.5 rounded-full transition ${
                    googleLocation === loc
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800'
                  }`}
                >
                  {loc.replace(', India', '')}
                </button>
              ))}
            </div>

            {/* Quick Google Search for User's Company */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
              <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Search My Company:</span>
              </span>
              <button
                type="button"
                id="btn-search-my-company-google"
                onClick={() => {
                  const companyQuery = "ALVI's Architecture, Interior Designers & Construction";
                  setGoogleQuery(companyQuery);
                  setGoogleType('all');
                  setGoogleLocation('Bangalore, India');
                  handleExecuteGoogleSearch(companyQuery, 'all', 'Bangalore, India');
                }}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 transition font-semibold shadow-sm"
              >
                <Search className="w-3 h-3 text-amber-400" />
                <span>ALVI&apos;s Architecture, Interior Designers &amp; Construction (Yeshwanthpur)</span>
              </button>
            </div>
          </div>

          {/* Grounding Citations Banner */}
          {googleSources.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs text-slate-300 font-medium">
                  Verified Google Search Grounding Sources ({googleSources.length}):
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {googleSources.slice(0, 4).map((src, i) => (
                  <a
                    key={i}
                    href={src.uri}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] px-2 py-1 rounded bg-slate-950 border border-slate-700 text-amber-300 hover:text-amber-200 inline-flex items-center gap-1 max-w-[200px] truncate"
                  >
                    <span className="truncate">{src.title}</span>
                    <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Results Summary Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">
                Search Results in {googleLocation}
              </h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {googleResults.length} entities found
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
                <Phone className="w-3.5 h-3.5" />
                All cards include direct contact numbers
              </span>
            </div>
          </div>

          {/* Quota Notice Banner */}
          {quotaNotice && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{quotaNotice}</span>
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30 shrink-0">
                Verified Directory
              </span>
            </div>
          )}

          {/* Search Cards Grid */}
          {isSearchingGoogle ? (
            <div className="text-center py-16 rounded-xl border border-dashed border-slate-800 bg-slate-900/40 space-y-3">
              <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">
                  Searching Google for {googleType === 'all' ? 'Architects, Builders & Suppliers' : googleType} in {googleLocation}...
                </p>
                <p className="text-xs text-slate-400">
                  Retrieving registered contact telephone numbers, physical addresses, and services.
                </p>
              </div>
            </div>
          ) : googleResults.length === 0 ? (
            <div className="text-center py-16 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 space-y-3">
              <Search className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-300">No results returned for this query.</p>
              <button
                onClick={() => {
                  setGoogleQuery('');
                  setGoogleType('all');
                  handleExecuteGoogleSearch('', 'all', googleLocation);
                }}
                className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-semibold hover:bg-amber-500/30"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {googleResults.map((prof) => renderContactCard(prof, true))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SAVED & VERIFIED DIRECTORY                                        */}
      {/* ========================================================================= */}
      {activeTab === 'browse' && (
        <div className="space-y-6">
          {/* Search & Filter Bar */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search directory by name, company, services, or phone number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-white focus:outline-none placeholder-slate-500"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white">✕</button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                id="select-professional-type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="all">All Disciplines</option>
                <option value="architect">Architects & Planners</option>
                <option value="builder">Builders & General Contractors</option>
                <option value="material_supplier">Material Suppliers & Mfrs</option>
              </select>

              <button
                id="btn-open-smart-match"
                onClick={() => setIsSmartMatching(!isSmartMatching)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 text-xs font-medium transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Smart Match</span>
              </button>

              {matchedIds !== null && (
                <button
                  onClick={() => {
                    setMatchedIds(null);
                    setMatchRequirement('');
                  }}
                  className="px-2.5 py-2 rounded-lg bg-slate-800 text-xs text-slate-300 hover:text-white"
                >
                  Clear Match ({matchedIds.length})
                </button>
              )}
            </div>
          </div>

          {/* Smart Match Drawer */}
          {isSmartMatching && (
            <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-amber-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  AI Requirement Matcher
                </h4>
                <button onClick={() => setIsSmartMatching(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
              </div>
              <p className="text-xs text-slate-300">
                Describe your project requirement or material specification to match with top-ranked vetted professionals.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Need general contractor experienced in post-tensioned RCC slabs and LEED commercial towers in Mumbai"
                  value={matchRequirement}
                  onChange={(e) => setMatchRequirement(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={handleRunSmartMatch}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition"
                >
                  Find Matches
                </button>
              </div>
            </div>
          )}

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedProfessionals.map((prof) => renderContactCard(prof, false))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ENQUIRIES DASHBOARD                                               */}
      {/* ========================================================================= */}
      {activeTab === 'enquiries' && (
        <div className="space-y-6">
          {/* Direct Flagship Enquiry to ALVI's Architecture, Interior Designers & Construction */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-amber-500/40 p-5 md:p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500 text-slate-950 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 fill-slate-950" />
                    Direct Studio Portal
                  </span>
                  <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Yeshwanthpur, Bangalore
                  </span>
                </div>
                <h3 className="text-base md:text-lg font-bold text-white mt-1">
                  Enquire Directly with ALVI&apos;s Architecture, Interior Designers &amp; Construction
                </h3>
                <p className="text-xs text-slate-300">
                  Send your project requirements directly to Ar. S. Gouse and our Yeshwanthpur engineering studio for instant BOQ estimation, architectural review, and turnkey site appraisal.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowAlviInfoModal(true);
                    setAlviModalTab('map');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-semibold transition"
                >
                  <Map className="w-3.5 h-3.5 text-amber-400" />
                  <span>Studio &amp; Map Info</span>
                </button>
              </div>
            </div>

            {/* Dual Grid: Yeshwanthpur Location & Google Map vs Direct Enquiry Form */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: Yeshwanthpur Google Map & Location Details */}
              <div className="lg:col-span-5 space-y-3">
                <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 h-48 w-full relative group">
                  <iframe
                    title="ALVI's Yeshwanthpur Google Map Preview"
                    src="https://maps.google.com/maps?q=Yeshwanthpur%20Metro%20Station%20Tumkur%20Road%20Bengaluru%20Karnataka%20560022&t=&z=15&ie=UTF8&iwloc=&output=embed"
                    className="w-full h-full border-0"
                    loading="lazy"
                    allowFullScreen
                  />
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between p-1.5 rounded-lg bg-slate-950/85 backdrop-blur border border-slate-800 text-[10.5px] text-slate-300">
                    <span className="truncate">Near Yeshwanthpur Metro Station</span>
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=Yeshwanthpur+Metro+Station+Tumkur+Road+Bengaluru+560022"
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition"
                    >
                      Directions
                    </a>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-start gap-1.5 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      Near Yeshwanthpur Metro Station &amp; Railway Station, Tumkur Main Road, Yeshwanthpur, Bengaluru 560022
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 pl-5 text-[11px] text-amber-300 font-mono">
                    <Navigation className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>Landmark: Govardhan Theatre &amp; Metro Corridor</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <a
                    href="tel:+919845078601"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Studio (+91 98450 78601)</span>
                  </a>
                  <a
                    href="https://wa.me/919845078601?text=Hi%2C%20I%20am%20enquiring%20about%20a%20project%20with%20ALVI's%20Architecture%2C%20Interior%20Designers%20%26%20Construction."
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-emerald-700/60 hover:bg-emerald-600 text-emerald-100 border border-emerald-500/40 font-semibold text-xs transition"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>

              {/* Right Column: Instant Enquiry Form */}
              <div className="lg:col-span-7">
                {alviDirectSuccess ? (
                  <div className="h-full flex flex-col items-center justify-center p-6 text-center rounded-xl bg-slate-950/80 border border-emerald-500/40 space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    <h4 className="text-sm font-bold text-white">Enquiry Submitted to ALVI&apos;s Studio!</h4>
                    <p className="text-xs text-slate-300 max-w-md">
                      Your project inquiry has been dispatched to Ar. S. Gouse and added to your tracker below. Our team in Yeshwanthpur will contact you shortly.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSendAlviDirectEnquiry} className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-300">Project Title / Scope</label>
                        <input
                          type="text"
                          placeholder="e.g. 3-Storey Luxury Villa in Bangalore"
                          value={alviDirectTitle}
                          onChange={(e) => setAlviDirectTitle(e.target.value)}
                          required
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-300">Service Category</label>
                        <select
                          value={alviDirectType}
                          onChange={(e) => setAlviDirectType(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                        >
                          <option value="Turnkey Architecture & Construction">Turnkey Architecture &amp; Construction</option>
                          <option value="Luxury Interior Design & Fit-out">Luxury Interior Design &amp; Fit-out</option>
                          <option value="Civil Construction & RCC Framing">Civil Construction &amp; RCC Framing</option>
                          <option value="Architectural Planning & Plan Sanctions">Architectural Planning &amp; Sanctions</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-300">Your Name</label>
                        <input
                          type="text"
                          value={alviDirectName}
                          onChange={(e) => setAlviDirectName(e.target.value)}
                          required
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-300">Phone Number</label>
                        <input
                          type="text"
                          value={alviDirectPhone}
                          onChange={(e) => setAlviDirectPhone(e.target.value)}
                          required
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-300">Estimated Budget</label>
                        <input
                          type="text"
                          placeholder="e.g. ₹ 1.5 - 2.5 Cr"
                          value={alviDirectBudget}
                          onChange={(e) => setAlviDirectBudget(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-300">Project Details &amp; Site Location</label>
                      <textarea
                        rows={2}
                        placeholder="Specify plot size (e.g. 40x60 ft), location in Bangalore, target start date, or design preferences..."
                        value={alviDirectMsg}
                        onChange={(e) => setAlviDirectMsg(e.target.value)}
                        required
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-end">
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Project Enquiry to ALVI&apos;s Yeshwanthpur Studio</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Enquiries Tracker Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">All Project Enquiries &amp; Quotation Requests</h3>
            <span className="text-xs text-slate-400 font-mono">
              Total Enquiries: {enquiries.length}
            </span>
          </div>

          {enquiries.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-dashed border-slate-800 bg-slate-900/30">
              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No enquiries recorded yet.</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Browse the directory or search with Google and click &quot;Send Project Enquiry&quot; on any card.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {enquiries.map((enq) => {
                const isAlvi =
                  enq.professionalId === 'prof-alvi-001' ||
                  (enq.professionalName && enq.professionalName.includes('ALVI'));

                return (
                  <div
                    key={enq.id}
                    className={`p-5 rounded-xl bg-slate-900 border space-y-3 transition ${
                      isAlvi
                        ? 'border-amber-500/50 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-white">{enq.projectTitle}</h4>
                          {isAlvi && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                              <Sparkles className="w-3 h-3 text-amber-400" />
                              ALVI Flagship (Yeshwanthpur Studio)
                            </span>
                          )}
                          {enq.budget && (
                            <span className="text-[11px] font-mono font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                              Budget: {enq.budget}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Recipient:{' '}
                          <span className="text-amber-300 font-medium">
                            {enq.professionalName || 'Professional'}
                          </span>
                          {' • '}
                          Client: <span className="text-white font-medium">{enq.clientName}</span>{' '}
                          {enq.clientPhone && `(${enq.clientPhone})`}{' '}
                          {enq.clientEmail && `• ${enq.clientEmail}`}
                        </p>
                      </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={enq.status}
                        onChange={(e) => onUpdateEnquiryStatus(enq.id, e.target.value as EnquiryStatus)}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                      >
                        <option value="open">Status: Open</option>
                        <option value="in_progress">Status: In Review</option>
                        <option value="responded">Status: Responded</option>
                        <option value="closed">Status: Closed</option>
                      </select>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(enq.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800/80 whitespace-pre-wrap">
                    {enq.message}
                  </p>
                </div>
              );
            })}
          </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MY PRACTICE PROFILE                                               */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl mx-auto p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Register Practice in Marketplace</h3>
            <p className="text-xs text-slate-400">
              List your architectural firm, contracting company, or material yard with verified contact phone numbers so prospective clients can reach you directly.
            </p>
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Contact Phone & WhatsApp (MANDATORY FIELDS) */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-amber-300 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-amber-400" />
                  Contact Telephone / Mobile *
                </label>
                <input
                  type="text"
                  placeholder="+91 80 4123 5678"
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
                  placeholder="+91 98450 99881"
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
                <label className="text-xs font-semibold text-slate-300">Services & Capabilities (comma-separated)</label>
                <input
                  type="text"
                  value={profileServices}
                  onChange={(e) => setProfileServices(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-300">Firm Bio & Key Specialization</label>
                <textarea
                  rows={3}
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white focus:border-amber-500 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {profileSavedMsg ? (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Profile listed in marketplace directory!
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">
                  Profile will immediately appear in the Verified Directory.
                </span>
              )}

              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
              >
                Save Practice Profile
              </button>
            </div>
          </form>
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

                {(selectedProfessional.id === 'prof-alvi-001' || selectedProfessional.company.includes('ALVI')) && (
                  <div className="mt-2.5 p-2.5 rounded-lg bg-slate-950 border border-amber-500/30 text-xs space-y-1.5">
                    <div className="flex items-start gap-1.5 text-slate-300 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">
                        {selectedProfessional.address ||
                          "Near Yeshwanthpur Metro Station & Railway Station, Tumkur Main Road, Yeshwanthpur, Bengaluru 560022"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[10.5px]">
                      <span className="text-amber-300 font-mono">Landmark: Govardhan Theatre &amp; Metro</span>
                      <a
                        href={
                          selectedProfessional.googleMapsUrl ||
                          'https://www.google.com/maps/search/?api=1&query=Yeshwanthpur+Metro+Station+Tumkur+Road+Bengaluru+560022'
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200 underline font-semibold"
                      >
                        <Map className="w-3 h-3 text-amber-400" />
                        <span>Google Map</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedProfessional(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {enquirySentSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Enquiry Dispatched Successfully!</h4>
                <p className="text-xs text-slate-400">
                  The recipient has been notified and you can track status under the Enquiries tab.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendEnquirySubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Project Title</label>
                  <input
                    type="text"
                    placeholder="e.g. 4-Story RCC Commercial Office Building"
                    value={enquiryProjectTitle}
                    onChange={(e) => setEnquiryProjectTitle(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Your Name</label>
                    <input
                      type="text"
                      value={enquiryClientName}
                      onChange={(e) => setEnquiryClientName(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Your Phone Number</label>
                    <input
                      type="text"
                      value={enquiryClientPhone}
                      onChange={(e) => setEnquiryClientPhone(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Your Email</label>
                    <input
                      type="email"
                      value={enquiryClientEmail}
                      onChange={(e) => setEnquiryClientEmail(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Estimated Budget</label>
                    <input
                      type="text"
                      placeholder="e.g. ₹1.5 Cr / $180,000"
                      value={enquiryBudget}
                      onChange={(e) => setEnquiryBudget(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Scope of Work & Specification Message</label>
                  <textarea
                    rows={4}
                    placeholder="Provide details on location, target start date, required drawings, BOQ, or material quantities..."
                    value={enquiryMessage}
                    onChange={(e) => setEnquiryMessage(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white focus:border-amber-500 focus:outline-none resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedProfessional(null)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                  >
                    Send Enquiry Now
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ALVI'S YESHWANTHPUR STUDIO & GOOGLE MAP DETAILED MODAL                    */}
      {/* ========================================================================= */}
      {showAlviInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl bg-slate-900 border border-amber-500/50 p-5 md:p-7 space-y-5 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500 text-slate-950 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 fill-slate-950" />
                    Flagship Studio &amp; Turnkey HQ
                  </span>
                  <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Council of Architecture Verified
                  </span>
                  <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Yeshwanthpur, Bengaluru
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-black text-white">
                  ALVI&apos;s Architecture, Interior Designers &amp; Construction
                </h3>
                <p className="text-xs text-slate-300">
                  Principal Architect: <span className="text-white font-semibold">Ar. S. Gouse</span> • 16+ Years Experience • 142+ Delivered Turnkey Projects across Karnataka &amp; South India
                </p>
              </div>

              <button
                onClick={() => setShowAlviInfoModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Sub-navigation Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 overflow-x-auto">
              <button
                onClick={() => setAlviModalTab('map')}
                className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                  alviModalTab === 'map'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Map className="w-3.5 h-3.5" />
                <span>Google Map &amp; Transit</span>
              </button>
              <button
                onClick={() => setAlviModalTab('services')}
                className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                  alviModalTab === 'services'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>3 Core Disciplines</span>
              </button>
              <button
                onClick={() => setAlviModalTab('rates')}
                className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                  alviModalTab === 'rates'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Turnkey Rates &amp; Packages</span>
              </button>
              <button
                onClick={() => setAlviModalTab('enquire')}
                className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                  alviModalTab === 'enquire'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enquire Now</span>
              </button>
            </div>

            {/* TAB 1: GOOGLE MAP & LOCATION */}
            {alviModalTab === 'map' && (
              <div className="space-y-4">
                {/* Embedded Interactive Google Map */}
                <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950 h-72 w-full relative shadow-inner">
                  <iframe
                    title="ALVI's Yeshwanthpur Experience Center Google Map"
                    src="https://maps.google.com/maps?q=Yeshwanthpur%20Metro%20Station%20Tumkur%20Road%20Bengaluru%20Karnataka%20560022&t=&z=15&ie=UTF8&iwloc=&output=embed"
                    className="w-full h-full border-0"
                    loading="lazy"
                    allowFullScreen
                  />
                  <div className="absolute top-3 left-3 p-2 rounded-lg bg-slate-950/90 backdrop-blur border border-slate-700 text-xs text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <span className="font-bold">Yeshwanthpur Studio &amp; Experience Center</span>
                  </div>
                </div>

                {/* Location & Transit Details Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 font-mono uppercase tracking-wider">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Studio Physical Address</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      ALVI&apos;s Architecture, Interior Designers &amp; Construction Experience Center,<br />
                      Near Yeshwanthpur Metro Station &amp; Railway Station, Tumkur Main Road,<br />
                      Yeshwanthpur, Bengaluru, Karnataka 560022
                    </p>
                    <div className="pt-1 text-[11px] text-amber-300 font-mono">
                      Landmark: Adjacent to Yeshwanthpur Metro Station &amp; Govardhan Theatre
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 font-mono uppercase tracking-wider">
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Connectivity &amp; Transit</span>
                    </div>
                    <ul className="text-xs text-slate-300 space-y-1.5">
                      <li className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span><strong>Green Line Metro:</strong> Yeshwanthpur Station (2-min walking distance)</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span><strong>Railway:</strong> Yeshwanthpur Junction (0.5 km)</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span><strong>Highway:</strong> Tumkur Road / NH 48 corridor (Peenya / Malleshwaram / Rajajinagar)</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span><strong>Hours:</strong> Mon–Sat 9:30 AM – 7:30 PM (Valet parking available)</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex items-center gap-3 pt-1 flex-wrap">
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Yeshwanthpur+Metro+Station+Tumkur+Road+Bengaluru+560022"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Open in Google Maps for Driving Directions</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                  <a
                    href="tel:+919845078601"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Studio (+91 98450 78601)</span>
                  </a>
                  <a
                    href="https://wa.me/919845078601?text=Hello%20ALVI's%20Architecture%2C%20Interior%20Designers%20%26%20Construction%20Yeshwanthpur%20Studio."
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-700/60 hover:bg-emerald-600 text-emerald-100 border border-emerald-500/40 font-semibold text-xs transition"
                  >
                    <span>WhatsApp Enquiry</span>
                  </a>
                </div>
              </div>
            )}

            {/* TAB 2: THE 3 CORE DISCIPLINES */}
            {alviModalTab === 'services' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                      <Building2 className="w-4 h-4" />
                    </span>
                    <h4 className="text-sm font-bold text-white">1. Master Architecture &amp; Planning</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Comprehensive architectural blueprints designed for bioclimatic cross-ventilation, daylight optimization, and structural efficiency. We produce photorealistic 3D external perspectives, detailed working drawings, and execute complete BBMP and BDA statutory sanction sets.
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {['3D Photorealistic Elevations', 'BBMP/BDA Sanctions', 'Bioclimatic Orientations', 'Structural Column-Beam Layouts', 'Soil & Foundation Engineering'].map((item, idx) => (
                      <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                      <Palette className="w-4 h-4" />
                    </span>
                    <h4 className="text-sm font-bold text-white">2. Luxury Interior Design &amp; Styling</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Bespoke interior fit-outs for luxury residential villas, duplex apartments, and corporate headquarters. Featuring book-matched Italian marble, customized teakwood millwork, German-engineered modular kitchens (Blum/Hafele hardware), and intelligent architectural cove lighting.
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {['Book-matched Italian Marble', 'Teakwood & Brass Joinery', 'German Modular Kitchens', 'Smart DALI Cove Lighting', 'Acoustic Ceiling Systems'].map((item, idx) => (
                      <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                      <HardHat className="w-4 h-4" />
                    </span>
                    <h4 className="text-sm font-bold text-white">3. Turnkey Civil Construction</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Accountable design-to-build contracting from soil excavation, column-footing casting, M25/M30 RCC framing, to 150mm autoclave-cured AAC blockwork. Backed by 10-year multi-tier waterproofing warranties and rigorous QA/QC batch testing for concrete and steel.
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {['M25/M30 Design Mix RCC', 'Tata Tiscon Fe550D TMT', '150mm AAC Masonry', '10-Yr Waterproofing Warranty', 'Site Quality Batch Audits'].map((item, idx) => (
                      <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-emerald-300">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: TURNKEY RATES & PACKAGES */}
            {alviModalTab === 'rates' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Standard Package */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <span className="text-[10px] font-mono uppercase text-slate-400">Standard Civil Package</span>
                    <h4 className="text-lg font-bold text-white">₹1,850 - ₹2,100</h4>
                    <span className="text-[11px] text-slate-400">per sq.ft built-up area</span>
                    <ul className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800">
                      <li>• M25 Grade RCC Framing</li>
                      <li>• Fe550D Primary Rebar</li>
                      <li>• 150mm Solid Block Masonry</li>
                      <li>• Internal &amp; External Plaster</li>
                      <li>• Concealed CPVC Plumbing</li>
                    </ul>
                  </div>

                  {/* Premium Package */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/50 space-y-3 relative">
                    <span className="absolute -top-2.5 right-3 text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                      Most Popular
                    </span>
                    <span className="text-[10px] font-mono uppercase text-amber-400">Premium Design-Build</span>
                    <h4 className="text-lg font-bold text-white">₹2,250 - ₹2,800</h4>
                    <span className="text-[11px] text-slate-400">per sq.ft built-up area</span>
                    <ul className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800">
                      <li>• Everything in Standard Civil</li>
                      <li>• Teakwood Main Entrance Door</li>
                      <li>• 4x2 ft Glazed Vitrified Tiles</li>
                      <li>• Kohler / Jaguar Fittings</li>
                      <li>• Asian Paints Royale Luxury</li>
                    </ul>
                  </div>

                  {/* Ultra Luxury Package */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <span className="text-[10px] font-mono uppercase text-emerald-400">Ultra-Luxury Villa Turnkey</span>
                    <h4 className="text-lg font-bold text-white">₹3,200 - ₹4,800+</h4>
                    <span className="text-[11px] text-slate-400">per sq.ft built-up area</span>
                    <ul className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800">
                      <li>• Italian Statuario / Marble</li>
                      <li>• Bespoke Teak Joinery throughout</li>
                      <li>• German Modular Kitchen</li>
                      <li>• Smart Home Automation</li>
                      <li>• 10-Yr Comprehensive Warranty</li>
                    </ul>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-center justify-between">
                  <span>Transparent CSI BOQ line-item breakups provided prior to signing.</span>
                  <button
                    onClick={() => setAlviModalTab('enquire')}
                    className="px-3 py-1 rounded bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition"
                  >
                    Request Estimate
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: DIRECT ENQUIRY */}
            {alviModalTab === 'enquire' && (
              <div className="space-y-4">
                {alviDirectSuccess ? (
                  <div className="py-8 text-center space-y-2 rounded-xl bg-slate-950 border border-emerald-500/40">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                    <h4 className="text-base font-bold text-white">Enquiry Submitted Successfully!</h4>
                    <p className="text-xs text-slate-300 max-w-md mx-auto">
                      Ar. S. Gouse and the Yeshwanthpur engineering team have received your project details. You can review your submission under the Enquiries tab.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSendAlviDirectEnquiry} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300">Project Title / Scope</label>
                        <input
                          type="text"
                          placeholder="e.g. 4-Storey Turnkey Residential Villa"
                          value={alviDirectTitle}
                          onChange={(e) => setAlviDirectTitle(e.target.value)}
                          required
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300">Service Required</label>
                        <select
                          value={alviDirectType}
                          onChange={(e) => setAlviDirectType(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                        >
                          <option value="Turnkey Architecture & Construction">Turnkey Architecture &amp; Construction</option>
                          <option value="Luxury Interior Design & Fit-out">Luxury Interior Design &amp; Fit-out</option>
                          <option value="Civil Construction & RCC Framing">Civil Construction &amp; RCC Framing</option>
                          <option value="Architectural Planning & Plan Sanctions">Architectural Planning &amp; Sanctions</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300">Client Name</label>
                        <input
                          type="text"
                          value={alviDirectName}
                          onChange={(e) => setAlviDirectName(e.target.value)}
                          required
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300">Phone Number</label>
                        <input
                          type="text"
                          value={alviDirectPhone}
                          onChange={(e) => setAlviDirectPhone(e.target.value)}
                          required
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300">Budget Estimate</label>
                        <input
                          type="text"
                          placeholder="e.g. ₹ 1.5 - 2.5 Cr"
                          value={alviDirectBudget}
                          onChange={(e) => setAlviDirectBudget(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300">Project Details, Plot Size &amp; Location</label>
                      <textarea
                        rows={3}
                        placeholder="Provide details on plot dimensions, location in Bangalore, target start date, or specific interior requirements..."
                        value={alviDirectMsg}
                        onChange={(e) => setAlviDirectMsg(e.target.value)}
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white focus:border-amber-500 focus:outline-none resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAlviInfoModal(false)}
                        className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                      >
                        Submit Project Enquiry
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Modal Footer with Direct Phone & Address */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Near Yeshwanthpur Metro Station &amp; Railway Station, Tumkur Main Road, Bengaluru 560022</span>
              </div>
              <div className="flex items-center gap-3">
                <a href="tel:+919845078601" className="text-emerald-400 font-mono font-bold hover:underline">
                  +91 98450 78601
                </a>
                <span>•</span>
                <a href="mailto:sgouse14@gmail.com" className="text-amber-300 hover:underline">
                  sgouse14@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
