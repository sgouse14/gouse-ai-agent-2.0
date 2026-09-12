import React, { useState, useMemo } from 'react';
import {
  Store,
  Search,
  Filter,
  ShieldCheck,
  Star,
  Send,
  MessageSquare,
  UserCheck,
  Building,
  HardHat,
  Boxes,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  Plus
} from 'lucide-react';
import { ProfessionalProfile, MarketplaceEnquiry, ProfessionalType, EnquiryStatus } from '../types';

interface MarketplaceViewProps {
  professionals: ProfessionalProfile[];
  enquiries: MarketplaceEnquiry[];
  onAddEnquiry: (enquiry: MarketplaceEnquiry) => void;
  onUpdateEnquiryStatus: (enquiryId: string, status: EnquiryStatus) => void;
  onSaveProfile: (profile: ProfessionalProfile) => void;
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  professionals,
  enquiries,
  onAddEnquiry,
  onUpdateEnquiryStatus,
  onSaveProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'browse' | 'enquiries' | 'profile'>('browse');

  // Search & Filter
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
  const [enquiryClientName, setEnquiryClientName] = useState('Ar. Gouse');
  const [enquiryClientEmail, setEnquiryClientEmail] = useState('principal@gouseai.com');
  const [enquirySentSuccess, setEnquirySentSuccess] = useState(false);

  // User Profile Form State
  const [profileType, setProfileType] = useState<ProfessionalType>('architect');
  const [profileName, setProfileName] = useState('Ar. Gouse');
  const [profileCompany, setProfileCompany] = useState('Gouse Architectural Intelligence');
  const [profileLocation, setProfileLocation] = useState('Bangalore & Global');
  const [profileServices, setProfileServices] = useState('Architectural Design, BOQ Estimation, BIM Coordination, Sustainable Bioclimatic Architecture');
  const [profileBio, setProfileBio] = useState('Leading architectural consultant specializing in AI-driven structural and bioclimatic design.');
  const [profileSavedMsg, setProfileSavedMsg] = useState(false);

  // Filtered professionals
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
          p.location.toLowerCase().includes(q)
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
      message: enquiryMessage.trim(),
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

  const handleSaveProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProfile: ProfessionalProfile = {
      id: `prof-${Date.now()}`,
      professionalType: profileType,
      name: profileName,
      company: profileCompany,
      location: profileLocation,
      services: profileServices,
      bio: profileBio,
      verified: true,
      rating: 5.0,
      completedProjects: 24,
      experienceYears: 12,
      email: 'principal@gouseai.com',
    };

    onSaveProfile(newProfile);
    setProfileSavedMsg(true);
    setTimeout(() => setProfileSavedMsg(false), 2500);
  };

  return (
    <div id="marketplace-view" className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Industry Network
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
            Professional Architecture & Construction Marketplace
          </h2>
          <p className="text-xs text-slate-400">
            Connect directly with verified Architects, General Contractors, and Green Material Suppliers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
              activeTab === 'browse'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Browse Directory
          </button>
          <button
            onClick={() => setActiveTab('enquiries')}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
              activeTab === 'enquiries'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Enquiries ({enquiries.length})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
              activeTab === 'profile'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            My Profile
          </button>
        </div>
      </div>

      {/* Tab 1: Browse Professionals */}
      {activeTab === 'browse' && (
        <div className="space-y-6">
          {/* Search & Filter Bar */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, company, services (e.g. AAC blocks, post-tensioned RCC, facade)..."
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
            {displayedProfessionals.map((prof) => {
              const typeLabel =
                prof.professionalType === 'architect'
                  ? 'Architect'
                  : prof.professionalType === 'builder'
                  ? 'General Contractor'
                  : 'Material Supplier';

              const Icon =
                prof.professionalType === 'architect'
                  ? Building
                  : prof.professionalType === 'builder'
                  ? HardHat
                  : Boxes;

              return (
                <div
                  key={prof.id}
                  className="rounded-xl bg-slate-900 border border-slate-800 p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-lg bg-slate-950 text-amber-400 border border-slate-800">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition">
                              {prof.name}
                            </h3>
                            {prof.verified && (
                              <span title="Verified Professional">
                                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 font-medium">{prof.company}</p>
                        </div>
                      </div>

                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                        {typeLabel}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                      {prof.bio}
                    </p>

                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-slate-400">Services & Capabilities:</span>
                      <div className="flex flex-wrap gap-1">
                        {prof.services.split(',').map((s, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300"
                          >
                            {s.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-slate-400 space-y-0.5">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-400" />
                        <span>{prof.location}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="flex items-center gap-0.5 text-amber-400">
                          <Star className="w-3 h-3 fill-amber-400" /> {prof.rating}
                        </span>
                        <span>•</span>
                        <span>{prof.completedProjects} Projects</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedProfessional(prof)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 text-xs font-medium transition shrink-0"
                    >
                      <Send className="w-3 h-3" />
                      <span>Send Enquiry</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Enquiries Dashboard */}
      {activeTab === 'enquiries' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Client & Project Enquiries</h3>
            <span className="text-xs text-slate-400 font-mono">
              Total Enquiries: {enquiries.length}
            </span>
          </div>

          {enquiries.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-dashed border-slate-800 bg-slate-900/30">
              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No enquiries recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {enquiries.map((enq) => (
                <div
                  key={enq.id}
                  className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3 hover:border-slate-700 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{enq.projectTitle}</h4>
                        {enq.budget && (
                          <span className="text-[11px] font-mono font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                            Budget: {enq.budget}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        To: <strong className="text-slate-300">{enq.professionalName || 'Professional'}</strong> • From: {enq.clientName} ({enq.clientEmail})
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-mono">Status:</span>
                      <select
                        value={enq.status}
                        onChange={(e) => onUpdateEnquiryStatus(enq.id, e.target.value as EnquiryStatus)}
                        className={`text-xs font-mono px-2.5 py-1 rounded border focus:outline-none cursor-pointer ${
                          enq.status === 'accepted' || enq.status === 'completed'
                            ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                            : enq.status === 'quoted' || enq.status === 'in_progress'
                            ? 'bg-amber-950/60 border-amber-700 text-amber-300'
                            : 'bg-slate-950 border-slate-700 text-slate-300'
                        }`}
                      >
                        <option value="open">Open / Submitted</option>
                        <option value="in_progress">In Progress</option>
                        <option value="quoted">Quote Sent</option>
                        <option value="accepted">Accepted</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 leading-relaxed font-sans">
                    {enq.message}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                    <span>Enquiry ID: {enq.id}</span>
                    <span>Received {new Date(enq.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: My Professional Profile */}
      {activeTab === 'profile' && (
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 max-w-2xl mx-auto space-y-5">
          <div>
            <h3 className="text-base font-bold text-white font-serif-classic">
              Professional Practice Profile
            </h3>
            <p className="text-xs text-slate-400">
              List your architectural practice, contracting firm, or building material company in the marketplace.
            </p>
          </div>

          {profileSavedMsg && (
            <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-700 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Professional profile successfully updated and published!</span>
            </div>
          )}

          <form onSubmit={handleSaveProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Discipline Type *</label>
                <select
                  value={profileType}
                  onChange={(e) => setProfileType(e.target.value as ProfessionalType)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="architect">Architectural Practice</option>
                  <option value="builder">General Contractor / Builder</option>
                  <option value="material_supplier">Material Supplier / Manufacturer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Contact Name *</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Firm / Company Name</label>
                <input
                  type="text"
                  value={profileCompany}
                  onChange={(e) => setProfileCompany(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Operational Location</label>
                <input
                  type="text"
                  value={profileLocation}
                  onChange={(e) => setProfileLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">Services & Specialized Capabilities</label>
              <input
                type="text"
                placeholder="Comma separated: Architectural Design, BOQ Estimation, Façade Engineering"
                value={profileServices}
                onChange={(e) => setProfileServices(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">Practice Bio / Credentials</label>
              <textarea
                rows={3}
                value={profileBio}
                onChange={(e) => setProfileBio(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition"
              >
                Save & Update Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Send Enquiry Modal */}
      {selectedProfessional && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white font-serif-classic">
                  Send Client Enquiry
                </h3>
                <p className="text-xs text-slate-400">
                  To: <strong className="text-amber-400">{selectedProfessional.name}</strong> ({selectedProfessional.company})
                </p>
              </div>
              <button onClick={() => setSelectedProfessional(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {enquirySentSuccess ? (
              <div className="p-4 rounded-lg bg-emerald-950/60 border border-emerald-700 text-emerald-300 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-semibold">Enquiry Sent Successfully!</h4>
                <p className="text-xs text-slate-300">The professional has been notified.</p>
              </div>
            ) : (
              <form onSubmit={handleSendEnquirySubmit} className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Project Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarjapur Biophilic Villa Civil Contracting"
                    value={enquiryProjectTitle}
                    onChange={(e) => setEnquiryProjectTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Estimated Budget</label>
                    <input
                      type="text"
                      placeholder="e.g. ₹ 75 Lakhs or Open"
                      value={enquiryBudget}
                      onChange={(e) => setEnquiryBudget(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Your Contact Email</label>
                    <input
                      type="email"
                      required
                      value={enquiryClientEmail}
                      onChange={(e) => setEnquiryClientEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">Project Brief / Enquiry Message *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe scope, required deliverables, site location, timeline, and drawing availability..."
                    value={enquiryMessage}
                    onChange={(e) => setEnquiryMessage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedProfessional(null)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-xs text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition"
                  >
                    Send Direct Enquiry
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
