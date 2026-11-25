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
  X,
  AlertTriangle,
  Loader2,
  Trash2,
  Plus,
  Edit3,
  Zap,
  RefreshCw,
  Download,
  Table2,
  LayoutGrid,
  MessageCircle,
  GitCompare,
  Layers,
  ArrowUpDown,
  ArrowRight,
  CheckSquare,
  Square,
} from 'lucide-react';
import {
  ProfessionalProfile,
  ProfessionalType,
  MarketplaceEnquiry,
  EnquiryStatus,
  GroundingSource,
  Project,
  BOQItem,
  CurrencyCode,
} from '../types';
import { formatCurrency } from '../utils/formatters';
import {
  detectSouthIndiaRegion,
  SOUTH_INDIA_REGION_LABELS,
} from '../data/southIndiaDirectory';

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
  activeProject?: Project;
  currency?: CurrencyCode;
  boqItems?: BOQItem[];
  onUpdateBOQItems?: (items: BOQItem[]) => void;
  onNavigateToBOQ?: () => void;
}

type SortOption = 'rating' | 'experience' | 'projects' | 'leadTime';

function getSafeHostname(url?: string): string {
  if (!url) return 'Website';
  try {
    const normalized = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    return new URL(normalized).hostname;
  } catch {
    return url;
  }
}

function getSafeUrl(url?: string): string {
  if (!url) return '#';
  return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
}

function extractCityLabel(location: string): string {
  if (!location) return 'Other';
  const primary = location.split(',')[0].trim();
  return primary || location.trim();
}

function parseQuotedAmountToINR(quoted?: string, fallbackBudget?: string): number {
  const source = quoted || fallbackBudget || '';
  if (!source) return 0;
  const match = source.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*(cr|crore|lakh|lac|k)?/i);
  if (!match) return 0;
  const numeric = parseFloat(match[1].replace(/,/g, ''));
  if (!Number.isFinite(numeric)) return 0;
  const unit = (match[2] || '').toLowerCase();
  if (unit === 'cr' || unit === 'crore') return Math.round(numeric * 10000000);
  if (unit === 'lakh' || unit === 'lac') return Math.round(numeric * 100000);
  if (unit === 'k') return Math.round(numeric * 1000);
  return Math.round(numeric);
}

function buildBoqPackagePayload(
  stageKey: string,
  items: BOQItem[],
  project?: Project,
  currency: CurrencyCode = 'INR'
): { title: string; message: string; budget: string } {
  const filtered =
    stageKey === 'all'
      ? items
      : items.filter((item) => (item.stage || 'Superstructure') === stageKey);

  const scopedItems = filtered.length > 0 ? filtered : items;
  const totalINR = scopedItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const projName = project?.name || 'Active Project';
  const areaText = project?.builtUpAreaSqFt ? `${project.builtUpAreaSqFt.toLocaleString()} sq.ft` : '';
  const locText = project?.location || '';
  const stageLabel = stageKey === 'all' ? 'Full Project BOQ Package' : `${stageKey} BOQ Package`;

  const topLines = scopedItems
    .slice(0, 6)
    .map(
      (item, idx) =>
        `${idx + 1}. ${item.name} — ${item.quantity.toLocaleString()} ${item.unit}`
    )
    .join('\n');

  const extraCount = scopedItems.length > 6 ? `\n(+ ${scopedItems.length - 6} additional BOQ items)` : '';
  const metaParts = [locText, areaText].filter(Boolean).join(' · ');

  return {
    title: `${projName} — ${stageLabel}`,
    budget: totalINR > 0 ? formatCurrency(totalINR, currency) : '',
    message: `Requesting formal quotation for ${stageLabel}${metaParts ? ` (${metaParts})` : ''}.\n\nKey BOQ Line Items:\n${topLines}${extraCount}\n\nPlease include unit rates, GST breakdown, and mobilization/delivery timeline.`,
  };
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
  activeProject,
  currency = 'INR',
  boqItems = [],
  onUpdateBOQItems,
  onNavigateToBOQ,
}) => {
  const [activeTab, setActiveTab] = useState<'browse' | 'google-search' | 'enquiries' | 'profile'>(
    'browse'
  );
  const [directoryViewMode, setDirectoryViewMode] = useState<'cards' | 'table'>('cards');
  const [enquiriesViewMode, setEnquiriesViewMode] = useState<'cards' | 'compare'>('cards');

  // Search, Region, Location & Sort Directory State
  const [selectedType, setSelectedType] = useState<string>(initialCategory || 'all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('rating');
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery || initialSearchQuery || '');
  const [activeBoqStagePreset, setActiveBoqStagePreset] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(24);

  // Compare & Broadcast Shortlist Selection (up to 4 vendors)
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState<boolean>(false);

  // Live Web Discovery (Google Grounded Search) State
  const [googleQuery, setGoogleQuery] = useState(initialQuery || initialSearchQuery);
  const [googleType, setGoogleType] = useState<string>(initialCategory || 'all');
  const [googleLocation, setGoogleLocation] = useState<string>(projectCity);
  const [isSearchingGoogle, setIsSearchingGoogle] = useState<boolean>(false);
  const [googleResults, setGoogleResults] = useState<ProfessionalProfile[]>([]);
  const [googleSources, setGoogleSources] = useState<GroundingSource[]>([]);
  const [googleSearchExecuted, setGoogleSearchExecuted] = useState<boolean>(false);
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);
  const [quotaNotice, setQuotaNotice] = useState<string | null>(null);

  useEffect(() => {
    if (initialCategory && initialCategory !== 'all') {
      setGoogleType(initialCategory);
      setSelectedType(initialCategory);
    }
    const q = initialQuery || initialSearchQuery;
    if (q) {
      setGoogleQuery(q);
      setSearchQuery(q);
    }
  }, [initialCategory, initialQuery, initialSearchQuery]);

  // Enquiries Filter, Quote & BOQ Sync State
  const [enquiryCategoryFilter, setEnquiryCategoryFilter] = useState<string>('all');
  const [enquiryStatusFilter, setEnquiryStatusFilter] = useState<string>('all');
  const [requestingQuoteId, setRequestingQuoteId] = useState<string | null>(null);
  const [syncedBoqEnquiryIds, setSyncedBoqEnquiryIds] = useState<string[]>([]);

  // Send Single RFQ Modal State
  const [selectedProfessional, setSelectedProfessional] = useState<ProfessionalProfile | null>(null);
  const [enquiryProjectTitle, setEnquiryProjectTitle] = useState('');
  const [enquiryMessage, setEnquiryMessage] = useState('');
  const [enquiryBudget, setEnquiryBudget] = useState('');
  const [enquiryClientName, setEnquiryClientName] = useState('Ar. S. Gouse');
  const [enquiryClientEmail, setEnquiryClientEmail] = useState('sgouse14@gmail.com');
  const [enquiryClientPhone, setEnquiryClientPhone] = useState('+91 8073947241');
  const [enquirySentSuccess, setEnquirySentSuccess] = useState(false);
  const [sendViaWhatsApp, setSendViaWhatsApp] = useState<boolean>(false);
  const [autoRequestQuoteOnSubmit, setAutoRequestQuoteOnSubmit] = useState<boolean>(true);
  const [isSubmittingEnquiry, setIsSubmittingEnquiry] = useState<boolean>(false);

  // Broadcast RFQ Modal State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastBudget, setBroadcastBudget] = useState('');
  const [broadcastAutoQuote, setBroadcastAutoQuote] = useState<boolean>(true);
  const [isSubmittingBroadcast, setIsSubmittingBroadcast] = useState<boolean>(false);
  const [broadcastSuccessCount, setBroadcastSuccessCount] = useState<number | null>(null);

  // Practice Management Form State
  const [profileType, setProfileType] = useState<ProfessionalType>('architect');
  const [profileName, setProfileName] = useState('Ar. S. Gouse');
  const [profileCompany, setProfileCompany] = useState('Gouse AI Architecture & Construction');
  const [profileLocation, setProfileLocation] = useState('Bangalore, Karnataka');
  const [profileAddress, setProfileAddress] = useState(
    'Sector 2, 27th Main Rd, HSR Layout, Bangalore, Karnataka 560102'
  );
  const [profilePhone, setProfilePhone] = useState('+91 8073947241');
  const [profileWhatsapp, setProfileWhatsapp] = useState('+91 8073947241');
  const [profileEmail, setProfileEmail] = useState('sgouse14@gmail.com');
  const [profileWebsite, setProfileWebsite] = useState('https://archstudio.com');
  const [profileServices, setProfileServices] = useState(
    'Architectural Planning, 3D Elevations, Interior Design, Turnkey Civil Contracting, BOQ & Quantity Takeoffs'
  );
  const [profileBio, setProfileBio] = useState(
    'Architectural design and turnkey construction practice delivering residential, commercial, and sustainable projects across South India.'
  );
  const [profileSavedMsg, setProfileSavedMsg] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [profileDeleteConfirmId, setProfileDeleteConfirmId] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{ text: string; showBoqLink?: boolean } | null>(
    null
  );

  const showToast = (text: string, showBoqLink = false) => {
    setFeedbackToast({ text, showBoqLink });
    setTimeout(() => setFeedbackToast(null), 5000);
  };

  // Summary Metrics
  const counts = useMemo(() => {
    const architects = professionals.filter((p) => p.professionalType === 'architect').length;
    const builders = professionals.filter((p) => p.professionalType === 'builder').length;
    const suppliers = professionals.filter((p) => p.professionalType === 'material_supplier').length;
    const quoted = enquiries.filter((e) => e.status === 'quoted' || Boolean(e.quotedAmount)).length;
    const accepted = enquiries.filter((e) => e.status === 'accepted').length;
    return { architects, builders, suppliers, quoted, accepted };
  }, [professionals, enquiries]);

  const myPractices = useMemo(() => {
    return professionals.filter((p) => p.isMyPractice || p.id.startsWith('prof-custom-'));
  }, [professionals]);

  const regionCounts = useMemo(() => {
    const map: Record<string, number> = {
      all: professionals.length,
      bangalore: 0,
      karnataka: 0,
      tamil_nadu: 0,
      telangana: 0,
      andhra: 0,
      kerala: 0,
    };
    professionals.forEach((p) => {
      const reg = detectSouthIndiaRegion(p.location);
      if (map[reg] !== undefined) map[reg] += 1;
    });
    return map;
  }, [professionals]);

  const locationOptions = useMemo(() => {
    const cityCounts = new Map<string, number>();
    professionals.forEach((p) => {
      if (selectedRegion !== 'all' && detectSouthIndiaRegion(p.location) !== selectedRegion) {
        return;
      }
      if (p.location) {
        const city = extractCityLabel(p.location);
        cityCounts.set(city, (cityCounts.get(city) || 0) + 1);
      }
    });
    return Array.from(cityCounts.entries())
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => a.city.localeCompare(b.city));
  }, [professionals, selectedRegion]);

  const boqStageSummaries = useMemo(() => {
    const stages: Array<'Substructure' | 'Superstructure' | 'Finishes' | 'Services'> = [
      'Substructure',
      'Superstructure',
      'Finishes',
      'Services',
    ];
    return stages
      .map((stage) => {
        const items = boqItems.filter((i) => (i.stage || 'Superstructure') === stage);
        const total = items.reduce((s, i) => s + (i.amount || 0), 0);
        return { stage, count: items.length, total };
      })
      .filter((s) => s.count > 0);
  }, [boqItems]);

  const selectedCompareVendors = useMemo(() => {
    return selectedCompareIds
      .map((id) => professionals.find((p) => p.id === id))
      .filter((p): p is ProfessionalProfile => Boolean(p));
  }, [selectedCompareIds, professionals]);

  // Execute Live Web Search
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
      setQuotaNotice(data.quotaNotice || null);
    } catch {
      const filtered = professionals.filter((p) => {
        if (type !== 'all' && p.professionalType !== type) return false;
        if (
          q &&
          !`${p.name} ${p.company} ${p.services} ${p.bio}`.toLowerCase().includes(q.toLowerCase())
        ) {
          return false;
        }
        return true;
      });
      setGoogleResults(filtered.map((p) => ({ ...p, isLiveSearch: true })));
      setQuotaNotice('Showing verified regional vendor directory with direct office contact details.');
    } finally {
      setIsSearchingGoogle(false);
    }
  };

  // Filtered & Sorted Directory Professionals
  const displayedProfessionals = useMemo(() => {
    let list = [...professionals];
    if (selectedType !== 'all') {
      list = list.filter((p) => p.professionalType === selectedType);
    }
    if (selectedRegion !== 'all') {
      list = list.filter((p) => detectSouthIndiaRegion(p.location) === selectedRegion);
    }
    if (selectedLocation !== 'all') {
      list = list.filter(
        (p) => extractCityLabel(p.location).toLowerCase() === selectedLocation.toLowerCase()
      );
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
          (p.address && p.address.toLowerCase().includes(q)) ||
          (p.phone && p.phone.includes(q))
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'experience') return (b.experienceYears || 0) - (a.experienceYears || 0);
      if (sortBy === 'projects') return (b.completedProjects || 0) - (a.completedProjects || 0);
      if (sortBy === 'leadTime') return (a.leadTimeDays || 99) - (b.leadTimeDays || 99);
      return (b.rating || 0) - (a.rating || 0);
    });

    return list;
  }, [professionals, selectedType, selectedRegion, selectedLocation, searchQuery, sortBy]);

  const totalPages = Math.max(1, Math.ceil(displayedProfessionals.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedType, selectedRegion, selectedLocation, searchQuery, sortBy, pageSize]);

  const paginatedProfessionals = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const startIdx = (safePage - 1) * pageSize;
    return displayedProfessionals.slice(startIdx, startIdx + pageSize);
  }, [displayedProfessionals, currentPage, pageSize, totalPages]);

  // Filtered Enquiries
  const displayedEnquiries = useMemo(() => {
    return enquiries.filter((enq) => {
      if (enquiryCategoryFilter !== 'all' && enq.professionalType !== enquiryCategoryFilter) {
        return false;
      }
      if (enquiryStatusFilter !== 'all' && enq.status !== enquiryStatusFilter) {
        return false;
      }
      return true;
    });
  }, [enquiries, enquiryCategoryFilter, enquiryStatusFilter]);

  const toggleVendorCompare = (profId: string) => {
    setSelectedCompareIds((prev) => {
      if (prev.includes(profId)) return prev.filter((id) => id !== profId);
      if (prev.length >= 4) {
        showToast('You can compare or broadcast to up to 4 vendors at once.');
        return prev;
      }
      return [...prev, profId];
    });
  };

  const openSingleRfqModal = (prof: ProfessionalProfile) => {
    setSelectedProfessional(prof);
    setEnquirySentSuccess(false);
    if (activeBoqStagePreset && boqItems.length > 0) {
      const payload = buildBoqPackagePayload(activeBoqStagePreset, boqItems, activeProject, currency);
      setEnquiryProjectTitle(payload.title);
      setEnquiryBudget(payload.budget);
      setEnquiryMessage(payload.message);
    }
  };

  const openBroadcastRfqModal = () => {
    if (selectedCompareVendors.length === 0) return;
    setBroadcastSuccessCount(null);
    if (boqItems.length > 0) {
      const payload = buildBoqPackagePayload(
        activeBoqStagePreset || 'all',
        boqItems,
        activeProject,
        currency
      );
      setBroadcastTitle(payload.title);
      setBroadcastBudget(payload.budget);
      setBroadcastMessage(payload.message);
    } else {
      setBroadcastTitle(
        activeProject
          ? `${activeProject.name} — Competitive Vendor Quotation`
          : 'Competitive Project Tender RFQ'
      );
      setBroadcastBudget('');
      setBroadcastMessage(
        `Requesting commercial proposal for ${
          activeProject?.name || 'our upcoming project'
        } in ${projectCity}. Please provide itemized rates, GST, and estimated mobilization timeline.`
      );
    }
    setIsBroadcastModalOpen(true);
  };

  const handleApplyBoqStageShortcut = (stage: string) => {
    if (activeBoqStagePreset === stage) {
      setActiveBoqStagePreset(null);
      setSelectedType('all');
      setSearchQuery('');
      return;
    }
    setActiveBoqStagePreset(stage);
    setSelectedLocation('all');
    if (stage === 'Substructure') {
      setSelectedType('material_supplier');
      setSearchQuery('');
    } else if (stage === 'Superstructure') {
      setSelectedType('builder');
      setSearchQuery('');
    } else if (stage === 'Finishes') {
      setSelectedType('material_supplier');
      setSearchQuery('');
    } else if (stage === 'Services') {
      setSelectedType('architect');
      setSearchQuery('');
    } else {
      setSelectedType('all');
      setSearchQuery('');
    }
  };

  const handleSaveToDirectory = (prof: ProfessionalProfile) => {
    onSaveProfile({
      ...prof,
      id: `saved-${Date.now()}-${prof.id}`,
    });
    setSavedSuccessId(prof.id);
    showToast(`Saved ${prof.company || prof.name} to your vendor directory.`);
    setTimeout(() => setSavedSuccessId(null), 2500);
  };

  const handleSaveAllLiveToDirectory = () => {
    let count = 0;
    const existingIds = new Set(professionals.map((p) => p.id));
    googleResults.forEach((prof) => {
      if (!existingIds.has(prof.id)) {
        onSaveProfile(prof);
        count++;
      }
    });
    showToast(
      count > 0
        ? `Added ${count} newly discovered partners to your directory.`
        : 'All listed partners are already in your directory.'
    );
  };

  const handleOpenWhatsAppRFQ = (prof: ProfessionalProfile, customScope?: string) => {
    const cleanNum = (prof.whatsapp || prof.phone || '').replace(/[^0-9]/g, '');
    if (!cleanNum) return;
    const text = encodeURIComponent(
      `Hello ${prof.name} (${prof.company}),\n\nI am reaching out regarding ${
        activeProject?.name || 'an architectural/construction project'
      } in ${prof.location || projectCity}.\n\n${
        customScope ? `Scope: ${customScope}\n\n` : ''
      }Please share your quotation and availability.`
    );
    const a = document.createElement('a');
    a.href = `https://wa.me/${cleanNum}?text=${text}`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  };

  // Export CSV (Directory or RFQs depending on active tab)
  const handleExportCsv = () => {
    const escapeCsv = (val: string | number | undefined) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    if (activeTab === 'enquiries') {
      const headers = [
        'RFQ ID',
        'Project Title',
        'Vendor',
        'Discipline',
        'Indicative Budget',
        'Quoted Amount',
        'Delivery',
        'Status',
        'Created Date',
      ];
      const rows = displayedEnquiries.map((e) => [
        escapeCsv(e.id),
        escapeCsv(e.projectTitle),
        escapeCsv(e.company || e.professionalName),
        escapeCsv(e.professionalType),
        escapeCsv(e.budget || ''),
        escapeCsv(e.quotedAmount || ''),
        escapeCsv(e.estimatedDelivery || ''),
        escapeCsv(e.status),
        escapeCsv(new Date(e.createdAt).toLocaleDateString()),
      ]);
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Marketplace_RFQs_Quotations.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(`Exported ${displayedEnquiries.length} RFQs to CSV.`);
      return;
    }

    const listToExport =
      activeTab === 'google-search' && googleResults.length > 0
        ? googleResults
        : displayedProfessionals;
    const headers = [
      'Name',
      'Company',
      'Discipline',
      'Location',
      'Phone',
      'Email',
      'Rating',
      'Experience (Years)',
      'Completed Projects',
      'Services',
    ];
    const rows = listToExport.map((p) => [
      escapeCsv(p.name),
      escapeCsv(p.company),
      escapeCsv(p.professionalType),
      escapeCsv(p.location),
      escapeCsv(p.phone),
      escapeCsv(p.email),
      escapeCsv(p.rating),
      escapeCsv(p.experienceYears),
      escapeCsv(p.completedProjects),
      escapeCsv(p.services),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Vendor_Directory.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Exported ${listToExport.length} vendors to CSV.`);
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

      if (onUpdateEnquiry) onUpdateEnquiry(updated);
      else onUpdateEnquiryStatus(enquiry.id, 'quoted');

      showToast(`Quotation received from ${enquiry.company || enquiry.professionalName}.`);
    } catch {
      const updated: MarketplaceEnquiry = {
        ...enquiry,
        status: 'quoted',
        quotedAmount: enquiry.budget || 'Commercial Rate Benchmark',
        responseMessage: `${enquiry.professionalName} acknowledged your RFQ and provided an indicative proposal.`,
        estimatedDelivery: 'Mobilization within 10-14 working days upon confirmation.',
        respondedAt: new Date().toISOString(),
        isLiveQuote: true,
      };
      if (onUpdateEnquiry) onUpdateEnquiry(updated);
      else onUpdateEnquiryStatus(enquiry.id, 'quoted');
      showToast(`Indicative proposal logged for ${enquiry.projectTitle}.`);
    } finally {
      setRequestingQuoteId(null);
    }
  };

  // Accept Vendor Quote & Sync Directly Into Project BOQ
  const handleAcceptAndSyncQuoteToBOQ = (enq: MarketplaceEnquiry) => {
    const updatedEnquiry: MarketplaceEnquiry = {
      ...enq,
      status: 'accepted',
    };
    if (onUpdateEnquiry) {
      onUpdateEnquiry(updatedEnquiry);
    } else {
      onUpdateEnquiryStatus(enq.id, 'accepted');
    }

    if (onUpdateBOQItems) {
      const parsedAmount = parseQuotedAmountToINR(enq.quotedAmount, enq.budget);
      const lowerTitle = `${enq.projectTitle} ${enq.message}`.toLowerCase();

      let mappedStage: BOQItem['stage'] = 'Superstructure';
      let mappedCategory = 'Civil & Contracting';

      if (enq.professionalType === 'architect') {
        mappedStage = 'Services';
        mappedCategory = 'Consultancy & Design';
      } else if (enq.professionalType === 'material_supplier') {
        if (lowerTitle.includes('cement') || lowerTitle.includes('steel') || lowerTitle.includes('rebar')) {
          mappedStage = 'Superstructure';
          mappedCategory = 'Structural Materials';
        } else {
          mappedStage = 'Finishes';
          mappedCategory = 'Architectural Finishes';
        }
      }

      const itemId = `boq-rfq-${enq.id}`;
      const newBoqItem: BOQItem = {
        id: itemId,
        name: `${enq.projectTitle} (${enq.company || enq.professionalName})`,
        category: mappedCategory,
        unit: 'Lump Sum',
        quantity: 1,
        rate: parsedAmount,
        amount: parsedAmount,
        notes: `Awarded Marketplace Quote${enq.estimatedDelivery ? ` · ${enq.estimatedDelivery}` : ''}`,
        stage: mappedStage,
        status: 'approved',
      };

      const existingIdx = boqItems.findIndex((b) => b.id === itemId);
      const nextBoq =
        existingIdx >= 0
          ? boqItems.map((b, i) => (i === existingIdx ? newBoqItem : b))
          : [newBoqItem, ...boqItems];

      onUpdateBOQItems(nextBoq);
      setSyncedBoqEnquiryIds((prev) => (prev.includes(enq.id) ? prev : [...prev, enq.id]));
      showToast(
        `Accepted quote from ${enq.company || enq.professionalName} and synced to Project BOQ.`,
        Boolean(onNavigateToBOQ)
      );
    } else {
      showToast(`Marked quote from ${enq.company || enq.professionalName} as accepted.`);
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
      } catch {
        // Silent fallback keeps enquiry open cleanly
      }
    }

    onAddEnquiry(newEnquiry);
    setIsSubmittingEnquiry(false);
    setEnquirySentSuccess(true);

    if (sendViaWhatsApp && selectedProfessional) {
      handleOpenWhatsAppRFQ(selectedProfessional, `${enquiryProjectTitle}\n${enquiryMessage}`);
    }

    setTimeout(() => {
      setEnquirySentSuccess(false);
      setSelectedProfessional(null);
      setEnquiryProjectTitle('');
      setEnquiryMessage('');
      setEnquiryBudget('');
    }, 1400);
  };

  // Multi-Vendor Broadcast RFQ Submit
  const handleSendBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCompareVendors.length === 0 || !broadcastTitle.trim() || !broadcastMessage.trim()) {
      return;
    }

    setIsSubmittingBroadcast(true);
    const vendors = [...selectedCompareVendors];

    const createdEnquiries: MarketplaceEnquiry[] = await Promise.all(
      vendors.map(async (vendor, idx) => {
        const newEnqId = `enq-${Date.now()}-${idx}`;
        const baseEnq: MarketplaceEnquiry = {
          id: newEnqId,
          professionalId: vendor.id,
          professionalName: vendor.name,
          company: vendor.company,
          professionalType: vendor.professionalType,
          clientName: enquiryClientName.trim() || 'Client',
          clientEmail: enquiryClientEmail.trim() || 'client@example.com',
          clientPhone: enquiryClientPhone.trim(),
          projectTitle: broadcastTitle.trim(),
          message: `${broadcastMessage.trim()}\n\nContact Phone: ${enquiryClientPhone}`,
          budget: broadcastBudget.trim(),
          status: 'open',
          createdAt: new Date().toISOString(),
        };

        if (broadcastAutoQuote) {
          try {
            const res = await fetch('/api/enquiries/live-quote', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                enquiryId: newEnqId,
                professionalName: vendor.name,
                company: vendor.company,
                professionalType: vendor.professionalType,
                projectTitle: broadcastTitle.trim(),
                message: broadcastMessage.trim(),
                budget: broadcastBudget.trim(),
                clientName: enquiryClientName.trim(),
              }),
            });
            if (res.ok) {
              const quoteData = await res.json();
              baseEnq.status = 'quoted';
              baseEnq.quotedAmount = quoteData.quotedAmount;
              baseEnq.responseMessage = quoteData.responseMessage;
              baseEnq.estimatedDelivery = quoteData.estimatedDelivery;
              baseEnq.respondedAt = quoteData.respondedAt;
              baseEnq.isLiveQuote = true;
            }
          } catch {
            // Keeps base enquiry open cleanly
          }
        }
        return baseEnq;
      })
    );

    createdEnquiries.forEach((enq) => onAddEnquiry(enq));
    setIsSubmittingBroadcast(false);
    setBroadcastSuccessCount(createdEnquiries.length);
    setSelectedCompareIds([]);
    showToast(`Broadcasted RFQ to ${createdEnquiries.length} shortlisted vendors.`);
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
      'Architectural design practice combining precision planning with sustainable construction methodologies.'
    );
    setShowAddForm(true);
    setActiveTab('profile');
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
    const existing = editingProfileId
      ? professionals.find((p) => p.id === editingProfileId)
      : undefined;
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
    showToast(
      `Practice "${newProf.company}" ${editingProfileId ? 'updated' : 'added to My Practice'}.`
    );
    setEditingProfileId(null);
    setShowAddForm(false);
    setTimeout(() => setProfileSavedMsg(false), 3500);
  };

  const handleRemoveFromMyPractice = (profileId: string) => {
    const profToRemove = professionals.find((p) => p.id === profileId);
    const firmName = profToRemove ? profToRemove.company : 'Practice Profile';

    if (profileId.startsWith('prof-custom-') || !profToRemove?.isMyPractice) {
      onDeleteProfile?.(profileId);
    } else if (onToggleMyPractice) {
      onToggleMyPractice(profileId, false);
    } else {
      onDeleteProfile?.(profileId);
    }

    if (editingProfileId === profileId) {
      setEditingProfileId(null);
      setShowAddForm(false);
    }
    setProfileDeleteConfirmId(null);
    showToast(`Removed "${firmName}" from My Practice.`);
  };

  const handleAddToMyPractice = (prof: ProfessionalProfile) => {
    if (onToggleMyPractice) {
      onToggleMyPractice(prof.id, true);
    } else {
      onSaveProfile({ ...prof, isMyPractice: true });
    }
    showToast(`Added "${prof.company || prof.name}" to My Practice.`);
  };

  const getDisciplineLabel = (type: ProfessionalType) =>
    type === 'architect'
      ? 'Architect'
      : type === 'builder'
      ? 'Builder / Contractor'
      : 'Material Supplier';

  const getStatusLabel = (status: EnquiryStatus) => {
    switch (status) {
      case 'open':
        return 'Open';
      case 'in_progress':
        return 'In Review';
      case 'quoted':
        return 'Quoted';
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Declined';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const renderProfessionalCard = (prof: ProfessionalProfile, isLive = false) => {
    const typeLabel = getDisciplineLabel(prof.professionalType);
    const Icon =
      prof.professionalType === 'architect'
        ? Building2
        : prof.professionalType === 'builder'
        ? HardHat
        : Boxes;
    const cleanPhone = (prof.phone || '').replace(/[^0-9+]/g, '');
    const cleanWhatsapp = (prof.whatsapp || cleanPhone).replace(/[^0-9]/g, '');
    const isPracticeMember = Boolean(prof.isMyPractice || prof.id.startsWith('prof-custom-'));
    const isSelectedForCompare = selectedCompareIds.includes(prof.id);

    return (
      <div
        key={prof.id}
        id={`card-${prof.id}`}
        className={`rounded-xl bg-slate-900 border p-5 flex flex-col justify-between space-y-4 transition-colors ${
          isSelectedForCompare
            ? 'border-amber-400/70 bg-slate-900'
            : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-amber-400 shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-white truncate">{prof.name}</h3>
                  {prof.verified && (
                    <ShieldCheck
                      className="w-3.5 h-3.5 text-emerald-400 shrink-0"
                      aria-label="Verified"
                    />
                  )}
                </div>
                <div className="text-xs text-slate-300 font-medium truncate">{prof.company}</div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-400 tabular-nums">
                  <span>{typeLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-0.5 text-amber-400 font-medium">
                    <Star className="w-3 h-3 fill-amber-400" />
                    {prof.rating}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{prof.experienceYears}y exp</span>
                  <span aria-hidden="true">·</span>
                  <span>{prof.completedProjects} proj</span>
                </div>
              </div>
            </div>

            {!isLive && (
              <button
                type="button"
                onClick={() => toggleVendorCompare(prof.id)}
                title={isSelectedForCompare ? 'Remove from comparison' : 'Select for comparison / broadcast RFQ'}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border transition-colors shrink-0 whitespace-nowrap ${
                  isSelectedForCompare
                    ? 'bg-amber-500/15 border-amber-400/60 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                {isSelectedForCompare ? (
                  <CheckSquare className="w-3 h-3 text-amber-400" />
                ) : (
                  <Square className="w-3 h-3" />
                )}
                <span>Select</span>
              </button>
            )}
          </div>

          {/* Location */}
          <div className="space-y-1 text-xs text-slate-400">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{prof.location}</span>
              </div>
              {isPracticeMember && (
                <span className="text-[11px] text-amber-300 font-medium shrink-0">My Practice</span>
              )}
            </div>
            {prof.address && (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(`${prof.company} ${prof.address}`)}`}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-slate-400 hover:text-amber-300 pl-5 truncate flex items-center gap-1 transition-colors"
              >
                <span className="truncate">{prof.address}</span>
                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
              </a>
            )}
          </div>

          {/* Bio & Core Services */}
          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{prof.bio}</p>
          <div className="text-[11px] text-slate-400 line-clamp-1">
            <span className="text-slate-500">Capabilities: </span>
            {prof.services}
          </div>

          {/* Direct Contact Info */}
          <div className="pt-2.5 border-t border-slate-800/80 space-y-1.5 text-xs">
            {prof.phone && (
              <div className="flex items-center justify-between gap-2">
                <a
                  href={`tel:${cleanPhone}`}
                  className="inline-flex items-center gap-1.5 text-slate-200 hover:text-amber-300 tabular-nums transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{prof.phone}</span>
                </a>
                {cleanWhatsapp && (
                  <button
                    type="button"
                    onClick={() => handleOpenWhatsAppRFQ(prof)}
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-medium whitespace-nowrap shrink-0"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>WhatsApp</span>
                  </button>
                )}
              </div>
            )}

            {prof.email && (
              <div className="flex items-center gap-1.5 text-slate-400 truncate">
                <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <a
                  href={`mailto:${prof.email}?subject=Project%20Enquiry`}
                  className="hover:text-amber-300 truncate transition-colors"
                >
                  {prof.email}
                </a>
              </div>
            )}

            {(prof.website || prof.sourceUrl || prof.leadTimeDays) && (
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                {prof.website || prof.sourceUrl ? (
                  <a
                    href={getSafeUrl(prof.website || prof.sourceUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-amber-300 hover:underline truncate max-w-[200px]"
                  >
                    <Globe className="w-3 h-3 shrink-0" />
                    <span className="truncate">
                      {prof.website ? getSafeHostname(prof.website) : 'Verified Link'}
                    </span>
                  </a>
                ) : (
                  <span />
                )}
                {prof.leadTimeDays && (
                  <span className="tabular-nums text-slate-400">~{prof.leadTimeDays}d response</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Card Action Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
          <button
            type="button"
            onClick={() => openSingleRfqModal(prof)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send RFQ</span>
          </button>

          {isPracticeMember ? (
            <button
              type="button"
              onClick={() => setProfileDeleteConfirmId(prof.id)}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-rose-300 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
            >
              Remove
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleAddToMyPractice(prof)}
              title="Bookmark to My Practice"
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
            >
              Shortlist
            </button>
          )}

          {isLive && (
            <button
              type="button"
              onClick={() => handleSaveToDirectory(prof)}
              title="Save vendor to local directory"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition-colors shrink-0"
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
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Executive Header + Navigation Tabs */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 px-5 pt-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Vendor &amp; Consultant Marketplace
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Source verified architects, contractors, and material suppliers, compare bids side-by-side, and sync accepted quotes into your BOQ.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={handleStartNewPractice}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Practice</span>
            </button>
          </div>
        </div>

        {/* Single-Line Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto border-t border-slate-800 pt-1">
          {[
            {
              id: 'browse' as const,
              htmlId: 'tab-directory',
              label: `Vendor Directory (${professionals.length.toLocaleString()})`,
              icon: ShieldCheck,
            },
            {
              id: 'google-search' as const,
              htmlId: 'tab-google-search',
              label: 'Live Web Discovery',
              icon: Search,
            },
            {
              id: 'enquiries' as const,
              htmlId: 'tab-enquiries',
              label: `RFQs & Quotations (${enquiries.length})`,
              icon: MessageSquare,
            },
            {
              id: 'profile' as const,
              htmlId: 'tab-profile',
              label: `My Practice (${myPractices.length})`,
              icon: Building2,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={tab.htmlId}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'google-search' && !googleSearchExecuted) {
                    handleExecuteGoogleSearch();
                  }
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackToast && (
        <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-xs text-amber-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{feedbackToast.text}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {feedbackToast.showBoqLink && onNavigateToBOQ && (
              <button
                type="button"
                onClick={() => {
                  setFeedbackToast(null);
                  onNavigateToBOQ();
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 font-semibold hover:bg-amber-400 transition-colors"
              >
                <span>Open BOQ</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setFeedbackToast(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Executive Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">Verified Directory</div>
          <div className="text-xl font-bold text-white tabular-nums">{professionals.length.toLocaleString()}</div>
          <div className="text-xs text-slate-400 tabular-nums">
            {counts.architects.toLocaleString()} Architects · {counts.builders.toLocaleString()} Builders · {counts.suppliers.toLocaleString()} Suppliers
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">Active RFQs Sent</div>
          <div className="text-xl font-bold text-white tabular-nums">{enquiries.length}</div>
          <div className="text-xs text-slate-400 tabular-nums">
            {counts.accepted} accepted into project scope
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">Quotes Received</div>
          <div className="text-xl font-bold text-emerald-400 tabular-nums">{counts.quoted}</div>
          <div className="text-xs text-slate-400">Ready for BOQ rate comparison</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">My Shortlisted / Practice</div>
          <div className="text-xl font-bold text-amber-400 tabular-nums">{myPractices.length}</div>
          <div className="text-xs text-slate-400">Preferred firms &amp; own listings</div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: VENDOR DIRECTORY                                               */}
      {/* ===================================================================== */}
      {activeTab === 'browse' && (
        <div className="space-y-4">
          {/* Active Project BOQ Sourcing Bar */}
          {activeProject && boqStageSummaries.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-2.5 text-xs">
                <Layers className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <span className="font-semibold text-white">Source for {activeProject.name}</span>
                  <span className="text-slate-400 ml-2">
                    Pick a BOQ stage to filter vendors and auto-fill RFQs with project quantities:
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                {boqStageSummaries.map((s) => {
                  const isActive = activeBoqStagePreset === s.stage;
                  return (
                    <button
                      key={s.stage}
                      type="button"
                      onClick={() => handleApplyBoqStageShortcut(s.stage)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-semibold'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span>{s.stage}</span>
                      <span className={isActive ? 'text-slate-900' : 'text-slate-500'}>
                        ({formatCurrency(s.total, currency)})
                      </span>
                    </button>
                  );
                })}
                {activeBoqStagePreset && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveBoqStagePreset(null);
                      setSelectedType('all');
                      setSearchQuery('');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors whitespace-nowrap shrink-0"
                  >
                    Clear Stage
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Unified Filter, Location, Sort & Search Bar */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs flex-1">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by vendor name, material (steel, cement, paint), city, or phone..."
                  className="w-full bg-transparent text-white placeholder-slate-500 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="all">All Disciplines ({professionals.length.toLocaleString()})</option>
                  <option value="architect">Architects ({counts.architects.toLocaleString()})</option>
                  <option value="builder">Builders &amp; Contractors ({counts.builders.toLocaleString()})</option>
                  <option value="material_supplier">Material Suppliers ({counts.suppliers.toLocaleString()})</option>
                </select>

                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  aria-label="Filter by area or city"
                  className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400 max-w-[220px]"
                >
                  <option value="all">All Wards &amp; Cities ({locationOptions.length})</option>
                  {locationOptions.map(({ city, count }) => (
                    <option key={city} value={city}>
                      {city} ({count})
                    </option>
                  ))}
                </select>

                <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    aria-label="Sort vendors"
                    className="bg-transparent text-white focus:outline-none"
                  >
                    <option value="rating" className="bg-slate-950">
                      Highest Rated
                    </option>
                    <option value="experience" className="bg-slate-950">
                      Most Experience
                    </option>
                    <option value="projects" className="bg-slate-950">
                      Most Projects
                    </option>
                    <option value="leadTime" className="bg-slate-950">
                      Fastest Response
                    </option>
                  </select>
                </div>

                <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-950 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setDirectoryViewMode('cards')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      directoryViewMode === 'cards'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Cards</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirectoryViewMode('table')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      directoryViewMode === 'table'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Table2 className="w-3.5 h-3.5" />
                    <span>Table</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setGoogleQuery(searchQuery);
                    setGoogleType(selectedType);
                    setActiveTab('google-search');
                    handleExecuteGoogleSearch(searchQuery, selectedType, googleLocation);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Search Web</span>
                </button>
              </div>
            </div>

            {/* Regional Hub Selector Row (Bangalore Wards + South India) */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    'all',
                    'bangalore',
                    'karnataka',
                    'tamil_nadu',
                    'telangana',
                    'andhra',
                    'kerala',
                  ] as const
                ).map((regionKey) => {
                  const isActive = selectedRegion === regionKey;
                  const count = regionCounts[regionKey] || 0;
                  return (
                    <button
                      key={regionKey}
                      type="button"
                      onClick={() => {
                        setSelectedRegion(regionKey);
                        setSelectedLocation('all');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                        isActive
                          ? 'bg-slate-800 text-amber-300 border-amber-500/50'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {SOUTH_INDIA_REGION_LABELS[regionKey]} ({count.toLocaleString()})
                    </button>
                  );
                })}
              </div>
              <span className="text-xs text-slate-400 tabular-nums">
                Showing{' '}
                <strong className="text-white">
                  {displayedProfessionals.length === 0
                    ? 0
                    : (Math.min(currentPage, totalPages) - 1) * pageSize + 1}
                  –
                  {Math.min(Math.min(currentPage, totalPages) * pageSize, displayedProfessionals.length)}
                </strong>{' '}
                of <strong className="text-white">{displayedProfessionals.length.toLocaleString()}</strong>{' '}
                ({professionals.length.toLocaleString()} total contacts)
              </span>
            </div>

            {/* Clean Quick Discipline Filter Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { label: 'All Vendors', type: 'all', q: '' },
                  { label: 'Architects', type: 'architect', q: '' },
                  { label: 'Interior Designers', type: 'architect', q: 'interior' },
                  { label: 'Turnkey Builders', type: 'builder', q: '' },
                  { label: 'Interior Fit-Out', type: 'builder', q: 'interior' },
                  { label: 'Plywood & Millwork', type: 'material_supplier', q: 'plywood' },
                  { label: 'Lighting & Smart', type: 'material_supplier', q: 'lighting' },
                  { label: 'Marble & Quartz', type: 'material_supplier', q: 'marble' },
                  { label: 'Steel & Rebar', type: 'material_supplier', q: 'steel' },
                  { label: 'Cement & Concrete', type: 'material_supplier', q: 'cement' },
                  { label: 'Paint & Finishes', type: 'material_supplier', q: 'paint' },
                ].map((chip) => {
                  const isActive =
                    selectedType === chip.type && searchQuery.toLowerCase() === chip.q;
                  return (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => {
                        setSelectedType(chip.type);
                        setSearchQuery(chip.q);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border whitespace-nowrap shrink-0 ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-semibold'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selection Action Bar for Compare & Multi-Vendor Broadcast RFQ */}
          {selectedCompareVendors.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-900 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <GitCompare className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-semibold text-white tabular-nums">
                  {selectedCompareVendors.length} vendor{selectedCompareVendors.length > 1 ? 's' : ''} selected:
                </span>
                <span className="text-slate-300 truncate max-w-md">
                  {selectedCompareVendors.map((v) => v.company || v.name).join(', ')}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCompareModalOpen(true)}
                  disabled={selectedCompareVendors.length < 2}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-medium border border-slate-700 transition-colors whitespace-nowrap shrink-0"
                >
                  <GitCompare className="w-3.5 h-3.5 text-amber-400" />
                  <span>Compare Side-by-Side</span>
                </button>

                <button
                  type="button"
                  onClick={openBroadcastRfqModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold transition-colors whitespace-nowrap shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Broadcast RFQ ({selectedCompareVendors.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCompareIds([])}
                  className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Cards View */}
          {paginatedProfessionals.length > 0 && directoryViewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedProfessionals.map((prof) => renderProfessionalCard(prof, false))}
            </div>
          )}

          {/* Table View */}
          {paginatedProfessionals.length > 0 && directoryViewMode === 'table' && (
            <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                      <th className="py-3 pl-4 pr-2 font-medium whitespace-nowrap w-8">Select</th>
                      <th className="py-3 px-3 font-medium whitespace-nowrap">Vendor &amp; Firm</th>
                      <th className="py-3 px-3 font-medium whitespace-nowrap">Discipline</th>
                      <th className="py-3 px-3 font-medium whitespace-nowrap">Location</th>
                      <th className="py-3 px-3 font-medium text-right whitespace-nowrap">
                        Rating / Exp
                      </th>
                      <th className="py-3 px-3 font-medium whitespace-nowrap">Direct Contact</th>
                      <th className="py-3 pl-3 pr-4 font-medium text-right whitespace-nowrap">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {paginatedProfessionals.map((prof) => {
                      const cleanPhone = (prof.phone || '').replace(/[^0-9+]/g, '');
                      const isChecked = selectedCompareIds.includes(prof.id);
                      return (
                        <tr
                          key={prof.id}
                          className={`hover:bg-slate-800/35 transition-colors ${
                            isChecked ? 'bg-amber-500/5' : ''
                          }`}
                        >
                          <td className="py-3 pl-4 pr-2">
                            <button
                              type="button"
                              onClick={() => toggleVendorCompare(prof.id)}
                              aria-label={`Select ${prof.company || prof.name}`}
                              className="text-slate-400 hover:text-amber-400"
                            >
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-amber-400" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-3 min-w-[210px]">
                            <div className="font-semibold text-white flex items-center gap-1.5">
                              <span>{prof.company || prof.name}</span>
                              {prof.verified && (
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[260px]">
                              {prof.name} · {prof.services}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                            {getDisciplineLabel(prof.professionalType)}
                          </td>
                          <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                            {prof.location}
                          </td>
                          <td className="py-3 px-3 text-right tabular-nums whitespace-nowrap">
                            <span className="text-amber-400 font-semibold">{prof.rating} ★</span>
                            <span className="text-slate-400">
                              {' '}
                              · {prof.experienceYears}y · {prof.completedProjects} proj
                            </span>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="text-slate-200 tabular-nums">{prof.phone}</div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                              {prof.email}
                            </div>
                          </td>
                          <td className="py-3 pl-3 pr-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openSingleRfqModal(prof)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors"
                              >
                                <Send className="w-3 h-3" />
                                <span>Send RFQ</span>
                              </button>
                              {cleanPhone && (
                                <a
                                  href={`tel:${cleanPhone}`}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                                >
                                  Call
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination Bar */}
          {displayedProfessionals.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-400 tabular-nums">
                <span>
                  Page <strong className="text-white">{Math.min(currentPage, totalPages)}</strong> of{' '}
                  <strong className="text-white">{totalPages.toLocaleString()}</strong>
                </span>
                <span aria-hidden="true">·</span>
                <label className="inline-flex items-center gap-1.5">
                  <span>Per page</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white"
                  >
                    <option value={24}>24</option>
                    <option value={48}>48</option>
                    <option value={96}>96</option>
                  </select>
                </label>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(1)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 whitespace-nowrap"
                >
                  First
                </button>
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 whitespace-nowrap"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold disabled:opacity-40 whitespace-nowrap"
                >
                  Next
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 whitespace-nowrap"
                >
                  Last
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {displayedProfessionals.length === 0 && (
            <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-3">
              <Search className="w-8 h-8 text-slate-500 mx-auto" />
              <h3 className="text-sm font-bold text-white">No Vendors Match Your Filter</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Reset your filters or search live on the web to discover new firms in {googleLocation}.
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedType('all');
                    setSelectedRegion('all');
                    setSelectedLocation('all');
                    setActiveBoqStagePreset(null);
                    setSearchQuery('');
                  }}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors"
                >
                  Reset Filters
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGoogleQuery(searchQuery);
                    setGoogleType(selectedType);
                    setActiveTab('google-search');
                    handleExecuteGoogleSearch(searchQuery, selectedType, googleLocation);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors"
                >
                  Search Live on Web
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: LIVE WEB DISCOVERY (Google Grounded Search)                    */}
      {/* ===================================================================== */}
      {activeTab === 'google-search' && (
        <div className="space-y-5">
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                Live Web Discovery for Architects, Contractors &amp; Suppliers
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Search verified regional firms by specialization and city, then save them directly into your directory.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleExecuteGoogleSearch();
              }}
              className="grid grid-cols-1 md:grid-cols-12 gap-3"
            >
              <div className="md:col-span-5">
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Specialization or Material
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={googleQuery}
                    onChange={(e) => setGoogleQuery(e.target.value)}
                    placeholder="e.g. Sustainable architects, TMT rebar suppliers, RMC plants..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="md:col-span-3">
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Target City / Region
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={googleLocation}
                    onChange={(e) => setGoogleLocation(e.target.value)}
                    placeholder="e.g. Bangalore, India"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-medium text-slate-300 block mb-1">Discipline</label>
                <select
                  value={googleType}
                  onChange={(e) => setGoogleType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="all">All Disciplines</option>
                  <option value="architect">Architects</option>
                  <option value="builder">Builders</option>
                  <option value="material_supplier">Material Suppliers</option>
                </select>
              </div>

              <div className="md:col-span-2 flex items-end">
                <button
                  type="submit"
                  disabled={isSearchingGoogle}
                  className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
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

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400 mr-1">Quick queries:</span>
              {[
                {
                  label: 'Paint & Coatings',
                  q: 'Paint and architectural coating distributors',
                  t: 'material_supplier',
                },
                {
                  label: 'TMT Steel Stockists',
                  q: 'Fe550D TMT steel rebar stockists',
                  t: 'material_supplier',
                },
                { label: 'OPC 53 Cement', q: 'OPC 53 Cement bulk suppliers', t: 'material_supplier' },
                {
                  label: 'Residential Architects',
                  q: 'Sustainable residential architects',
                  t: 'architect',
                },
                {
                  label: 'Turnkey Contractors',
                  q: 'Turnkey RCC building contractors',
                  t: 'builder',
                },
                {
                  label: 'Interior Designers',
                  q: 'Residential luxury interior architects and turnkey fit-out studios',
                  t: 'architect',
                },
                {
                  label: 'Plywood & Veneers',
                  q: 'BWP Marine Plywood, HDHMR, Laminates and Hettich hardware distributors',
                  t: 'material_supplier',
                },
                {
                  label: 'Architectural Lighting',
                  q: 'Architectural COB downlights, magnetic tracks and smart dimmers',
                  t: 'material_supplier',
                },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setGoogleQuery(preset.q);
                    setGoogleType(preset.t);
                    handleExecuteGoogleSearch(preset.q, preset.t, googleLocation);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs transition-colors whitespace-nowrap shrink-0"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {quotaNotice && (
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{quotaNotice}</span>
            </div>
          )}

          {googleSources.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span>Verification sources:</span>
              {googleSources.slice(0, 4).map((s, idx) => (
                <a
                  key={idx}
                  href={s.uri}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-amber-300 hover:underline truncate max-w-[220px]"
                >
                  <Globe className="w-3 h-3 shrink-0" />
                  <span className="truncate">{s.title || 'Source'}</span>
                </a>
              ))}
            </div>
          )}

          {googleResults.length > 0 ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-white tabular-nums">
                  Discovered Firms ({googleResults.length})
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleExecuteGoogleSearch()}
                    disabled={isSearchingGoogle}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSearchingGoogle ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAllLiveToDirectory}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    <span>Save All to Directory</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {googleResults.map((prof) => renderProfessionalCard(prof, true))}
              </div>
            </div>
          ) : (
            !isSearchingGoogle && (
              <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-2">
                <Search className="w-8 h-8 text-slate-500 mx-auto" />
                <div className="text-sm font-semibold text-white">No Web Results Loaded</div>
                <p className="text-xs text-slate-400">
                  Enter a query or pick a quick specialty above to retrieve grounded local vendors.
                </p>
              </div>
            )
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: RFQS & QUOTATIONS                                              */}
      {/* ===================================================================== */}
      {activeTab === 'enquiries' && (
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: `All RFQs (${enquiries.length})` },
                {
                  id: 'architect',
                  label: `Architects (${enquiries.filter((e) => e.professionalType === 'architect').length})`,
                },
                {
                  id: 'builder',
                  label: `Builders (${enquiries.filter((e) => e.professionalType === 'builder').length})`,
                },
                {
                  id: 'material_supplier',
                  label: `Suppliers (${enquiries.filter((e) => e.professionalType === 'material_supplier').length})`,
                },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setEnquiryCategoryFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border whitespace-nowrap shrink-0 ${
                    enquiryCategoryFilter === f.id
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-semibold'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-950 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setEnquiriesViewMode('cards')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    enquiriesViewMode === 'cards'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEnquiriesViewMode('compare')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    enquiriesViewMode === 'compare'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Table2 className="w-3.5 h-3.5" />
                  <span>Compare Quotes</span>
                </button>
              </div>

              <select
                value={enquiryStatusFilter}
                onChange={(e) => setEnquiryStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Review</option>
                <option value="quoted">Quoted</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Declined</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {displayedEnquiries.length === 0 ? (
            <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-3">
              <MessageSquare className="w-8 h-8 text-slate-500 mx-auto" />
              <h3 className="text-sm font-bold text-white">No Project RFQs Found</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Browse the Vendor Directory and click Send RFQ on any architect, contractor, or supplier to request quotations.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('browse')}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors"
              >
                Browse Vendor Directory
              </button>
            </div>
          ) : enquiriesViewMode === 'compare' ? (
            /* Bid Leveling & Quote Comparison Table */
            <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                      <th className="py-3 pl-4 pr-3 font-medium whitespace-nowrap">RFQ / Scope</th>
                      <th className="py-3 px-3 font-medium whitespace-nowrap">Vendor</th>
                      <th className="py-3 px-3 font-medium whitespace-nowrap">Indicative Budget</th>
                      <th className="py-3 px-3 font-medium whitespace-nowrap">Quoted Amount</th>
                      <th className="py-3 px-3 font-medium whitespace-nowrap">Delivery / Timeline</th>
                      <th className="py-3 px-3 font-medium whitespace-nowrap">Status</th>
                      <th className="py-3 pl-3 pr-4 font-medium text-right whitespace-nowrap">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {displayedEnquiries.map((enq) => {
                      const hasQuote = Boolean(enq.quotedAmount || enq.responseMessage);
                      const isSynced = syncedBoqEnquiryIds.includes(enq.id);
                      const isRequestingThis = requestingQuoteId === enq.id;

                      return (
                        <tr key={enq.id} className="hover:bg-slate-800/35 transition-colors">
                          <td className="py-3 pl-4 pr-3 min-w-[200px]">
                            <div className="font-semibold text-white">{enq.projectTitle}</div>
                            <div className="text-[11px] text-slate-400 tabular-nums">
                              {new Date(enq.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="text-slate-200 font-medium">
                              {enq.company || enq.professionalName}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {enq.professionalType
                                ? getDisciplineLabel(enq.professionalType)
                                : 'Vendor'}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-300 tabular-nums whitespace-nowrap">
                            {enq.budget || 'Open'}
                          </td>
                          <td className="py-3 px-3 tabular-nums whitespace-nowrap">
                            {enq.quotedAmount ? (
                              <span className="font-bold text-emerald-400">{enq.quotedAmount}</span>
                            ) : (
                              <span className="text-slate-500">Awaiting quote</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-300 max-w-[220px]">
                            <div className="truncate">{enq.estimatedDelivery || '—'}</div>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`text-xs font-medium ${
                                enq.status === 'accepted'
                                  ? 'text-emerald-400'
                                  : enq.status === 'quoted'
                                  ? 'text-amber-300'
                                  : 'text-slate-400'
                              }`}
                            >
                              {getStatusLabel(enq.status)}
                            </span>
                          </td>
                          <td className="py-3 pl-3 pr-4 text-right whitespace-nowrap">
                            {hasQuote ? (
                              <button
                                type="button"
                                onClick={() => handleAcceptAndSyncQuoteToBOQ(enq)}
                                disabled={isSynced}
                                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                  isSynced
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{isSynced ? 'Synced to BOQ' : 'Accept & Sync to BOQ'}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleRequestLiveQuote(enq)}
                                disabled={isRequestingThis}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors disabled:opacity-50"
                              >
                                <Zap className="w-3 h-3" />
                                <span>{isRequestingThis ? 'Generating...' : 'Get Quote'}</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedEnquiries.map((enq) => {
                const targetProf = professionals.find((p) => p.id === enq.professionalId);
                const isRequestingThis = requestingQuoteId === enq.id;
                const hasQuote = Boolean(enq.quotedAmount || enq.responseMessage);
                const isSynced = syncedBoqEnquiryIds.includes(enq.id);

                return (
                  <div
                    key={enq.id}
                    className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-800">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                          <span className="text-amber-300 font-medium">
                            {enq.professionalType
                              ? getDisciplineLabel(enq.professionalType)
                              : 'Vendor'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{enq.company || enq.professionalName}</span>
                          {enq.budget && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-slate-200 tabular-nums">
                                Budget {enq.budget}
                              </span>
                            </>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-white">{enq.projectTitle}</h3>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <select
                          value={enq.status}
                          onChange={(e) =>
                            onUpdateEnquiryStatus(enq.id, e.target.value as EnquiryStatus)
                          }
                          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Review</option>
                          <option value="quoted">Quoted</option>
                          <option value="accepted">Accepted</option>
                          <option value="rejected">Declined</option>
                          <option value="completed">Completed</option>
                        </select>
                        <span className="text-xs text-slate-500 tabular-nums">
                          {new Date(enq.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {enq.message}
                    </p>

                    {hasQuote && (
                      <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-2 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-emerald-400">
                            Vendor Quotation Summary
                          </span>
                          {enq.quotedAmount && (
                            <span className="font-bold text-white tabular-nums">
                              {enq.quotedAmount}
                            </span>
                          )}
                        </div>
                        {enq.estimatedDelivery && (
                          <div className="text-slate-400">
                            Delivery / Mobilization: {enq.estimatedDelivery}
                          </div>
                        )}
                        {enq.responseMessage && (
                          <p className="text-slate-300 leading-relaxed">{enq.responseMessage}</p>
                        )}
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        {hasQuote && (
                          <button
                            type="button"
                            onClick={() => handleAcceptAndSyncQuoteToBOQ(enq)}
                            disabled={isSynced}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap shrink-0 ${
                              isSynced
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>
                              {isSynced ? 'Accepted & Synced to BOQ' : 'Accept Quote & Sync to BOQ'}
                            </span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRequestLiveQuote(enq)}
                          disabled={isRequestingThis}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold transition-colors disabled:opacity-50"
                        >
                          {isRequestingThis ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Generating Quote...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-3.5 h-3.5" />
                              <span>{hasQuote ? 'Refresh Quote' : 'Request Vendor Quote'}</span>
                            </>
                          )}
                        </button>

                        {targetProf && (
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenWhatsAppRFQ(
                                targetProf,
                                `Regarding RFQ: ${enq.projectTitle}\nBudget: ${enq.budget || 'Negotiable'}`
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-medium transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </button>
                        )}

                        {targetProf?.phone && (
                          <a
                            href={`tel:${targetProf.phone.replace(/[^0-9+]/g, '')}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5 text-amber-400" />
                            <span>{targetProf.phone}</span>
                          </a>
                        )}
                      </div>

                      <span className="text-[11px] text-slate-500 tabular-nums">Ref: {enq.id}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: MY PRACTICE & SHORTLISTED PARTNERS                             */}
      {/* ===================================================================== */}
      {activeTab === 'profile' && (
        <div className="space-y-5">
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white">My Practice &amp; Shortlisted Firms</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage your own firm listings and preferred partners in one workspace.
              </p>
            </div>
            {!showAddForm && (
              <button
                type="button"
                onClick={handleStartNewPractice}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Practice Profile</span>
              </button>
            )}
          </div>

          {profileDeleteConfirmId && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <div className="font-semibold text-white">
                  Remove{' '}
                  {professionals.find((p) => p.id === profileDeleteConfirmId)?.company ||
                    'this practice'}{' '}
                  from My Practice?
                </div>
                <div className="text-slate-300 mt-0.5">
                  You can always add or shortlist it again from the Vendor Directory.
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setProfileDeleteConfirmId(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveFromMyPractice(profileDeleteConfirmId)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirm Remove</span>
                </button>
              </div>
            </div>
          )}

          {myPractices.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {myPractices.map((prof) => (
                <div
                  key={prof.id}
                  className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs text-amber-400 font-medium">
                          {getDisciplineLabel(prof.professionalType)}
                        </div>
                        <h3 className="text-sm font-bold text-white">{prof.company}</h3>
                        <div className="text-xs text-slate-400">
                          {prof.name} · {prof.location}
                        </div>
                      </div>
                      {prof.verified && (
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{prof.bio}</p>
                    <div className="text-[11px] text-slate-400">{prof.services}</div>

                    <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-300 space-y-1">
                      <div className="tabular-nums">{prof.phone}</div>
                      <div className="text-slate-400">{prof.email}</div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setProfileDeleteConfirmId(prof.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-rose-300 text-xs font-medium transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openSingleRfqModal(prof)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send RFQ</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartEditPractice(prof)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Edit Listing</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(showAddForm || myPractices.length === 0) && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingProfileId ? 'Edit Practice Profile' : 'Add Practice to Marketplace'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    List your architectural studio, contracting unit, or material supply firm.
                  </p>
                </div>
                {myPractices.length > 0 && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveProfileSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-slate-300 mb-1">Discipline</label>
                    <select
                      value={profileType}
                      onChange={(e) => setProfileType(e.target.value as ProfessionalType)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
                    >
                      <option value="architect">Architectural Studio / Architect</option>
                      <option value="builder">Builder / General Contractor</option>
                      <option value="material_supplier">Material Supplier / Manufacturer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-300 mb-1">
                      Principal / Contact Person *
                    </label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-medium text-slate-300 mb-1">
                      Firm / Business Name *
                    </label>
                    <input
                      type="text"
                      value={profileCompany}
                      onChange={(e) => setProfileCompany(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-300 mb-1">Phone *</label>
                    <input
                      type="text"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-300 mb-1">WhatsApp</label>
                    <input
                      type="text"
                      value={profileWhatsapp}
                      onChange={(e) => setProfileWhatsapp(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-300 mb-1">Email *</label>
                    <input
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-300 mb-1">Website</label>
                    <input
                      type="url"
                      value={profileWebsite}
                      onChange={(e) => setProfileWebsite(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-medium text-slate-300 mb-1">
                      City / Operational Region *
                    </label>
                    <input
                      type="text"
                      value={profileLocation}
                      onChange={(e) => setProfileLocation(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-medium text-slate-300 mb-1">
                      Office / Depot Address
                    </label>
                    <input
                      type="text"
                      value={profileAddress}
                      onChange={(e) => setProfileAddress(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-medium text-slate-300 mb-1">
                      Capabilities (comma-separated) *
                    </label>
                    <input
                      type="text"
                      value={profileServices}
                      onChange={(e) => setProfileServices(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-medium text-slate-300 mb-1">Firm Bio *</label>
                    <textarea
                      rows={3}
                      value={profileBio}
                      onChange={(e) => setProfileBio(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-amber-400 focus:outline-none resize-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  {profileSavedMsg ? (
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Practice saved.
                    </span>
                  ) : (
                    <span className="text-slate-400">Visible immediately in Vendor Directory.</span>
                  )}

                  <div className="flex items-center gap-2">
                    {myPractices.length > 0 && showAddForm && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold"
                    >
                      {editingProfileId ? 'Save Changes' : 'Save Practice'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* SIDE-BY-SIDE VENDOR COMPARISON MODAL                                  */}
      {/* ===================================================================== */}
      {isCompareModalOpen && selectedCompareVendors.length >= 2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-5xl rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-5 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-bold text-white">
                  Side-by-Side Vendor Comparison ({selectedCompareVendors.length} Selected)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Evaluate ratings, project track record, lead times, and capabilities before dispatching your tender RFQ.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCompareModalOpen(false);
                    openBroadcastRfqModal();
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Broadcast RFQ to All</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCompareModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="overflow-auto flex-1">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="py-3 pr-4 font-medium text-slate-400 w-36 align-top">Criteria</th>
                    {selectedCompareVendors.map((v) => (
                      <th key={v.id} className="py-3 px-4 min-w-[200px] align-top">
                        <div className="font-bold text-white text-sm">{v.company || v.name}</div>
                        <div className="text-slate-400 font-normal mt-0.5">{v.name}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  <tr>
                    <td className="py-3 pr-4 text-slate-400 font-medium">Discipline</td>
                    {selectedCompareVendors.map((v) => (
                      <td key={v.id} className="py-3 px-4 text-amber-300 font-medium">
                        {getDisciplineLabel(v.professionalType)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-slate-400 font-medium">Client Rating</td>
                    {selectedCompareVendors.map((v) => (
                      <td key={v.id} className="py-3 px-4 text-white font-semibold tabular-nums">
                        {v.rating} ★ {v.verified ? '· Verified' : ''}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-slate-400 font-medium">Track Record</td>
                    {selectedCompareVendors.map((v) => (
                      <td key={v.id} className="py-3 px-4 text-slate-200 tabular-nums">
                        {v.experienceYears} yrs · {v.completedProjects} completed projects
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-slate-400 font-medium">Response / Lead Time</td>
                    {selectedCompareVendors.map((v) => (
                      <td key={v.id} className="py-3 px-4 text-slate-200 tabular-nums">
                        {v.leadTimeDays ? `~${v.leadTimeDays} days` : 'Standard (7-10 days)'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-slate-400 font-medium">Location &amp; Coverage</td>
                    {selectedCompareVendors.map((v) => (
                      <td key={v.id} className="py-3 px-4 text-slate-300">
                        <div>{v.location}</div>
                        {v.deliveryCoverage && (
                          <div className="text-[11px] text-slate-400 mt-0.5">{v.deliveryCoverage}</div>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-slate-400 font-medium">Core Capabilities</td>
                    {selectedCompareVendors.map((v) => (
                      <td key={v.id} className="py-3 px-4 text-slate-300 leading-relaxed">
                        {v.services}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-slate-400 font-medium">Direct Contact</td>
                    {selectedCompareVendors.map((v) => (
                      <td key={v.id} className="py-3 px-4 text-slate-300 tabular-nums">
                        <div>{v.phone}</div>
                        <div className="text-[11px] text-slate-400">{v.email}</div>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-slate-400 font-medium">Action</td>
                    {selectedCompareVendors.map((v) => (
                      <td key={v.id} className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCompareModalOpen(false);
                            openSingleRfqModal(v);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-medium transition-colors"
                        >
                          <Send className="w-3 h-3" />
                          <span>Send Individual RFQ</span>
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MULTI-VENDOR BROADCAST RFQ MODAL                                      */}
      {/* ===================================================================== */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Broadcast Competitive RFQ ({selectedCompareVendors.length} Vendors)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Send one standardized scope to multiple firms to compare competing rates side-by-side.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBroadcastModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {broadcastSuccessCount !== null ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">
                  RFQ Broadcasted to {broadcastSuccessCount} Vendors
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  All vendor RFQs and initial responses are ready in RFQs &amp; Quotations for side-by-side quote comparison.
                </p>
                <div className="pt-2 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsBroadcastModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
                  >
                    Back to Directory
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsBroadcastModalOpen(false);
                      setActiveTab('enquiries');
                      setEnquiriesViewMode('compare');
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold"
                  >
                    <span>Compare Quotes Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendBroadcastSubmit} className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-[11px] text-slate-400">Recipients:</div>
                  <div className="text-slate-200 font-medium">
                    {selectedCompareVendors.map((v) => v.company || v.name).join(' · ')}
                  </div>
                </div>

                {boqItems.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-slate-400 block">Auto-fill from Project BOQ Package:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {['all', ...boqStageSummaries.map((s) => s.stage)].map((stageKey) => (
                        <button
                          key={stageKey}
                          type="button"
                          onClick={() => {
                            const payload = buildBoqPackagePayload(
                              stageKey,
                              boqItems,
                              activeProject,
                              currency
                            );
                            setBroadcastTitle(payload.title);
                            setBroadcastBudget(payload.budget);
                            setBroadcastMessage(payload.message);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-amber-300 border border-slate-800 transition-colors"
                        >
                          {stageKey === 'all' ? 'Full Project BOQ' : `${stageKey} BOQ`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tender / RFQ Title *</label>
                  <input
                    type="text"
                    required
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Indicative Budget</label>
                  <input
                    type="text"
                    value={broadcastBudget}
                    onChange={(e) => setBroadcastBudget(e.target.value)}
                    placeholder="e.g. ₹ 18,50,000"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Standardized Scope &amp; Quantities *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300 pt-1">
                  <input
                    type="checkbox"
                    checked={broadcastAutoQuote}
                    onChange={(e) => setBroadcastAutoQuote(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-amber-500"
                  />
                  <span>Request immediate indicative quotes from all selected vendors</span>
                </label>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsBroadcastModalOpen(false)}
                    disabled={isSubmittingBroadcast}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingBroadcast}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold disabled:opacity-50"
                  >
                    {isSubmittingBroadcast ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Dispatching...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send to {selectedCompareVendors.length} Vendors</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SEND SINGLE RFQ MODAL                                                 */}
      {/* ===================================================================== */}
      {selectedProfessional && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Send Project RFQ to {selectedProfessional.name}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedProfessional.company}
                  {selectedProfessional.phone ? ` · ${selectedProfessional.phone}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProfessional(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {enquirySentSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">RFQ Sent Successfully</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Your request has been logged in RFQs &amp; Quotations.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendEnquirySubmit} className="space-y-3 text-xs">
                {/* Project BOQ Quick Fill */}
                {boqItems.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-slate-400 block">
                      Load Scope from {activeProject?.name || 'Project BOQ'}:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {['all', ...boqStageSummaries.map((s) => s.stage)].map((stageKey) => (
                        <button
                          key={stageKey}
                          type="button"
                          onClick={() => {
                            const payload = buildBoqPackagePayload(
                              stageKey,
                              boqItems,
                              activeProject,
                              currency
                            );
                            setEnquiryProjectTitle(payload.title);
                            setEnquiryBudget(payload.budget);
                            setEnquiryMessage(payload.message);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-amber-300 border border-slate-800 transition-colors"
                        >
                          {stageKey === 'all' ? 'Full BOQ' : `${stageKey} BOQ`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Scope Templates */}
                <div className="space-y-1.5">
                  <span className="text-slate-400 block">Quick Scope Templates:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProfessional.professionalType === 'architect' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEnquiryProjectTitle('Residential Villa Full Architectural Package');
                            setEnquiryMessage(
                              'Requesting complete architectural design, structural drawings, 3D elevations, and municipal sanction support.'
                            );
                            setEnquiryBudget('₹ 1.2 Cr - 1.8 Cr');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors"
                        >
                          Villa Architecture
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEnquiryProjectTitle('Turnkey Interior Design & Execution');
                            setEnquiryMessage(
                              'Requesting interior styling, modular woodwork drawings, ceiling layouts, lighting plan, and material specs.'
                            );
                            setEnquiryBudget('₹ 35 Lakh - 50 Lakh');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors"
                        >
                          Turnkey Interiors
                        </button>
                      </>
                    )}
                    {selectedProfessional.professionalType === 'builder' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEnquiryProjectTitle('Turnkey RCC Civil Construction (G+2)');
                            setEnquiryMessage(
                              'Seeking turnkey civil contracting proposal for G+2 residence covering earthwork, RCC frame, masonry, plastering, waterproofing, and MEP.'
                            );
                            setEnquiryBudget('₹ 1.85 Cr - 2.4 Cr');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors"
                        >
                          Turnkey Civil Contract
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEnquiryProjectTitle('RCC Superstructure Core Package');
                            setEnquiryMessage(
                              'Seeking rate quotation for RCC footings, columns, and slabs including shuttering, bar bending, and concreting.'
                            );
                            setEnquiryBudget('₹ 75 Lakh - 95 Lakh');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors"
                        >
                          RCC Core Package
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEnquiryProjectTitle('Turnkey Interior Fit-Out & Modular Joinery');
                            setEnquiryMessage(
                              'Requesting itemized quote for modular kitchen, wardrobes, gypsum false ceilings, electrical lighting, and painting.'
                            );
                            setEnquiryBudget('₹ 22 Lakh - 35 Lakh');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors"
                        >
                          Interior Fit-Out Package
                        </button>
                      </>
                    )}
                    {selectedProfessional.professionalType === 'material_supplier' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEnquiryProjectTitle('Bulk Fe550D TMT Rebar Order (18 MT)');
                            setEnquiryMessage(
                              'Requesting mill-direct quote for 18 MT Fe550D TMT steel with batch test certificates and site delivery.'
                            );
                            setEnquiryBudget('₹ 11.5 Lakh - 13.5 Lakh');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors"
                        >
                          Bulk TMT Rebar (18 MT)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEnquiryProjectTitle('Bulk OPC 53 Grade Cement (600 Bags)');
                            setEnquiryMessage(
                              'Requesting landed rate for 600 bags OPC 53 Grade cement with staged site dispatch.'
                            );
                            setEnquiryBudget('₹ 2.4 Lakh - 2.8 Lakh');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors"
                        >
                          Bulk Cement (600 Bags)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEnquiryProjectTitle('Interior Plywood, HDHMR, Veneers & Hardware Lot');
                            setEnquiryMessage(
                              'Requesting wholesale project quote for 18mm BWP Marine Ply, HDHMR boards, 1mm laminates, and Hettich soft-close hardware.'
                            );
                            setEnquiryBudget('₹ 4.5 Lakh - 6.8 Lakh');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors"
                        >
                          Plywood &amp; Millwork Lot
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEnquiryProjectTitle('Architectural Lighting, Quartz & Bath Package');
                            setEnquiryMessage(
                              'Requesting supply quote for 3000K COB downlights, magnetic tracks, engineered quartz slabs, and Kohler/Jaquar sanitary sets.'
                            );
                            setEnquiryBudget('₹ 5.2 Lakh - 7.5 Lakh');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors"
                        >
                          Lighting, Quartz &amp; Bath
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Project / RFQ Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Modern Residence Civil Package"
                    value={enquiryProjectTitle}
                    onChange={(e) => setEnquiryProjectTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={enquiryClientName}
                      onChange={(e) => setEnquiryClientName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Your Phone</label>
                    <input
                      type="text"
                      value={enquiryClientPhone}
                      onChange={(e) => setEnquiryClientPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Your Email *</label>
                    <input
                      type="email"
                      required
                      value={enquiryClientEmail}
                      onChange={(e) => setEnquiryClientEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Indicative Budget</label>
                    <input
                      type="text"
                      placeholder="e.g. ₹ 1.2 Cr - 1.8 Cr"
                      value={enquiryBudget}
                      onChange={(e) => setEnquiryBudget(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Scope &amp; Quantities *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe site location, built-up area, or required material quantities..."
                    value={enquiryMessage}
                    onChange={(e) => setEnquiryMessage(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={autoRequestQuoteOnSubmit}
                      onChange={(e) => setAutoRequestQuoteOnSubmit(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-700 text-amber-500"
                    />
                    <span>Request immediate indicative quote on submit</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={sendViaWhatsApp}
                      onChange={(e) => setSendViaWhatsApp(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-700 text-emerald-500"
                    />
                    <span>Also open pre-filled RFQ in WhatsApp</span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedProfessional(null)}
                    disabled={isSubmittingEnquiry}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEnquiry}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold disabled:opacity-50"
                  >
                    {isSubmittingEnquiry ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending RFQ...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send RFQ</span>
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
export default MarketplaceView;
