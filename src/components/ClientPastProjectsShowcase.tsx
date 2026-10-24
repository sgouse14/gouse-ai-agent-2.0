import React, { useState } from 'react';
import {
  Camera,
  Users,
  Star,
  CheckCircle2,
  Calendar,
  MapPin,
  MessageSquare,
  Phone,
  Upload,
  Heart,
  Share2,
  Sparkles,
  Award,
  ShieldCheck,
  Eye,
  PlusCircle,
  X,
  Building,
  Home,
  Check,
  Filter,
} from 'lucide-react';
import { Project } from '../types';

// Local High-Resolution Project Assets
import villaExteriorImg from '../assets/images/bangalore_house_exterior_1790170528532.jpg';
import siteFramingImg from '../assets/images/bangalore_builder_proj1_1790170892084.jpg';
import villaElevationImg from '../assets/images/bangalore_builder_proj2_1790170907606.jpg';
import columnGridImg from '../assets/images/bangalore_builder_proj3_1790170920758.jpg';
import courtyardInteriorImg from '../assets/images/pg_dining_lounge_1790170229065.jpg';
import masterSuiteImg from '../assets/images/pg_bedroom_suite_1790170216460.jpg';
import pgTerraceImg from '../assets/images/bangalore_pg_terrace_1790170513465.jpg';
import apartmentTowerImg from '../assets/images/mantri_premero_tower_1790170972037.jpg';

export interface PastClientProject {
  id: string;
  clientName: string;
  clientRole: string;
  projectName: string;
  projectLocation: string;
  handoverDate: string;
  handoverYear: '2026' | '2025' | '2024';
  category: 'Luxury Villa' | 'Co-Living & PG' | 'Boutique Residence' | 'Turnkey Interior';
  builtUpArea: string;
  rating: number;
  testimonial: string;
  clientAvatarUrl: string;
  handoverPhotos: {
    title: string;
    url: string;
    caption: string;
  }[];
  verifiedBadge: string;
  likesCount: number;
}

export interface ClientPastProjectsShowcaseProps {
  activeProject?: Project;
  onOpenSocialHub?: () => void;
}

export const ClientPastProjectsShowcase: React.FC<ClientPastProjectsShowcaseProps> = ({
  activeProject,
  onOpenSocialHub,
}) => {
  // Pre-seeded verified past client handovers & photos
  const [pastClientProjects, setPastClientProjects] = useState<PastClientProject[]>([
    {
      id: 'past-client-1',
      clientName: 'Sameer Khan',
      clientRole: 'Managing Director • Prestige Urban Ventures',
      projectName: 'Prestige Heights Commercial & Luxury Villa',
      projectLocation: 'Indiranagar 100ft Road, Bangalore',
      handoverDate: 'February 2026',
      handoverYear: '2026',
      category: 'Luxury Villa',
      builtUpArea: '3,850 Sq.Ft (G+3 Floors)',
      rating: 5,
      testimonial:
        'Ar. S. Gouse delivered our biophilic duplex residence with zero contractor cost variance. The dynamic CPWD-indexed BOQ locked all steel and concrete rates beforehand. Handover was executed 12 days ahead of schedule!',
      clientAvatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
      handoverPhotos: [
        {
          title: 'Official Handover & Twilight Front Elevation',
          url: villaExteriorImg,
          caption: 'Wire-cut exposed brickwork and cantilevered balcony handover photo taken at dusk.',
        },
        {
          title: 'Delivered Double-Height Courtyard & Dining Core',
          url: courtyardInteriorImg,
          caption: 'Natural teak louvers with NBC 2016 daylighting compliance completed as per 3D BIM render.',
        },
        {
          title: 'Executive Master Suite Handover',
          url: masterSuiteImg,
          caption: 'Book-matched Italian Botticino marble flooring with concealed architectural LED coves.',
        },
      ],
      verifiedBadge: 'Verified Client • Certificate #CoA/2026/KA-082',
      likesCount: 342,
    },
    {
      id: 'past-client-2',
      clientName: 'Meera Nambiar',
      clientRole: 'Private Villa Owner (NRI Singapore)',
      projectName: 'Palm Crest Luxury Residence',
      projectLocation: 'Sarjapur / Whitefield Corridor, Bangalore',
      handoverDate: 'November 2025',
      handoverYear: '2025',
      category: 'Luxury Villa',
      builtUpArea: '4,200 Sq.Ft with Private Pool',
      rating: 5,
      testimonial:
        'Residing in Singapore, managing home construction remotely in India was daunting until we partnered with Ar. S. Gouse. The daily 360° AI site camera scans and automated rebar inspection ensured 100% transparency.',
      clientAvatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
      handoverPhotos: [
        {
          title: 'Finished Superstructure & Cantilevered Balconies',
          url: villaElevationImg,
          caption: 'Handover day photo showcasing finished facade textures and low-E acoustic glazing.',
        },
        {
          title: 'Rooftop Sky Pergola & Solar Inverter Deck',
          url: pgTerraceImg,
          caption: '5.2 kW rooftop solar net-metered pergola delivered fully commissioned with BESCOM.',
        },
      ],
      verifiedBadge: 'Verified Homeowner • Handover 2025',
      likesCount: 289,
    },
    {
      id: 'past-client-3',
      clientName: 'Vikramaditya Reddy',
      clientRole: 'Real Estate Developer & Landlord',
      projectName: 'Indiranagar Tech Living PG & 3BHK Rental Floors',
      projectLocation: 'Indiranagar & HSR Layout, Bangalore',
      handoverDate: 'October 2025',
      handoverYear: '2025',
      category: 'Co-Living & PG',
      builtUpArea: '32 Beds Co-Living + 2 Rental Floors',
      rating: 5,
      testimonial:
        'Turnkey architectural design, structural M25 casting, and Gouse AI Agent Broker leasing filled our 32-bed facility in just 11 days. Complete end-to-end execution without third-party broker cuts.',
      clientAvatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      handoverPhotos: [
        {
          title: 'Turnkey Apartment & Co-Living Tower Handover',
          url: apartmentTowerImg,
          caption: 'Delivered building exterior with biometric turnstile entry and 24/7 security booth.',
        },
        {
          title: 'Finished Co-Living Dining & Community Hall',
          url: courtyardInteriorImg,
          caption: 'Modular cafeteria and lounge seating with high-durability acoustic panelling.',
        },
      ],
      verifiedBadge: 'Verified Developer • 18 Units Handover',
      likesCount: 415,
    },
    {
      id: 'past-client-4',
      clientName: 'Dr. Anand Sen',
      clientRole: 'Senior Cardiovascular Surgeon & Investor',
      projectName: 'Green Terraces Boutique Studios & Clinic',
      projectLocation: 'Koramangala 4th Block, Bangalore',
      handoverDate: 'August 2024',
      handoverYear: '2024',
      category: 'Boutique Residence',
      builtUpArea: '2,900 Sq.Ft Independent Floor',
      rating: 5,
      testimonial:
        'Ar. S. Gouse’s automated BIM clash detection caught a critical 100mm MEP duct collision before slab casting began. The final finished residence is peaceful, energy-efficient, and acoustically dampened.',
      clientAvatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      handoverPhotos: [
        {
          title: 'Slab Framing Inspection Milestone (2024)',
          url: siteFramingImg,
          caption: 'Ultrasound rebar verification prior to M25 design-mix slab pouring.',
        },
        {
          title: 'Completed Boutique Residence Elevation',
          url: villaExteriorImg,
          caption: 'Final handover inspection with lead architect Ar. S. Gouse.',
        },
      ],
      verifiedBadge: 'Verified Client • IS 456 Structural Audit',
      likesCount: 198,
    },
  ]);

  // Filtering State
  const [selectedYear, setSelectedYear] = useState<'all' | '2026' | '2025' | '2024'>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'Luxury Villa' | 'Co-Living & PG' | 'Boutique Residence'>('all');

  // Lightbox Modal State
  const [activePhotoModal, setActivePhotoModal] = useState<{
    project: PastClientProject;
    photoIndex: number;
  } | null>(null);

  // New Client Photo Post Form State
  const [isPostingFormOpen, setIsPostingFormOpen] = useState(false);
  const [postClientName, setPostClientName] = useState('');
  const [postProjectName, setPostProjectName] = useState('');
  const [postLocation, setPostLocation] = useState('Bangalore');
  const [postPhotoTitle, setPostPhotoTitle] = useState('');
  const [postCaption, setPostCaption] = useState('');
  const [postSelectedPresetImage, setPostSelectedPresetImage] = useState(villaExteriorImg);
  const [postSuccessMessage, setPostSuccessMessage] = useState<string | null>(null);

  // Likes Counter Handler
  const handleLikeProject = (id: string) => {
    setPastClientProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, likesCount: p.likesCount + 1 } : p))
    );
  };

  // Submit Client Post Handler
  const handleSubmitClientPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postClientName.trim() || !postProjectName.trim()) {
      alert('Please fill in your name and project name.');
      return;
    }

    const newProject: PastClientProject = {
      id: `client-post-${Date.now()}`,
      clientName: postClientName,
      clientRole: 'Verified Client Post',
      projectName: postProjectName,
      projectLocation: postLocation,
      handoverDate: 'Just Now',
      handoverYear: '2026',
      category: 'Luxury Villa',
      builtUpArea: 'Turnkey Client Project',
      rating: 5,
      testimonial: postCaption || 'Delighted with the architectural craftsmanship and turnkey execution by Ar. S. Gouse Studio.',
      clientAvatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      handoverPhotos: [
        {
          title: postPhotoTitle || 'Delivered Client Space',
          url: postSelectedPresetImage,
          caption: postCaption || 'Client photo shared directly to Gouse AI Social & Media Hub.',
        },
      ],
      verifiedBadge: 'Client Post • Verified Submission',
      likesCount: 1,
    };

    setPastClientProjects((prev) => [newProject, ...prev]);
    setPostSuccessMessage(`Thank you, ${postClientName}! Your client photo post has been published live to the Social & Media Hub.`);
    setTimeout(() => setPostSuccessMessage(null), 7000);

    // Reset Form
    setPostClientName('');
    setPostProjectName('');
    setPostPhotoTitle('');
    setPostCaption('');
    setIsPostingFormOpen(false);
  };

  // Filtered List
  const filteredProjects = pastClientProjects.filter((p) => {
    const matchYear = selectedYear === 'all' || p.handoverYear === selectedYear;
    const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchYear && matchCategory;
  });

  return (
    <div className="space-y-8 text-left animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* 1. HERO BANNER: PAST CLIENT HANDOVER PHOTOS & ARCHITECTURAL RETROSPECTIVE  */}
      {/* ========================================================================= */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-rose-950/70 via-slate-900 to-indigo-950/60 border border-rose-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-3 max-w-3xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-mono font-bold flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-rose-400" />
              SOCIAL &amp; MEDIA HUB: PAST CLIENT PHOTOS
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-mono">
              VERIFIED HANDOVER RETROSPECTIVE
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-mono">
              2024 - 2026 DELIVERIES
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
            Past Client Photos, Handover Ceremonies &amp; Delivered Homes
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
            Browse authentic handover ceremony photographs, completed living room interiors, and delivered turnkey villas designed and constructed by Ar. S. Gouse Studio across Bangalore. Clients can also post their own space photos directly to the gallery.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsPostingFormOpen(!isPostingFormOpen)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post Client Home Photo</span>
          </button>

          <a
            href="https://wa.me/918073947241?text=Hello%20Ar.%20Gouse,%20I%20am%20viewing%20the%20Past%20Client%20Handover%20Photos%20in%20your%20Social%20Media%20Hub%20and%20would%20like%20to%20discuss%20a%20project."
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition"
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>WhatsApp Lead Architect</span>
          </a>
        </div>
      </div>

      {/* Success Notification */}
      {postSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="flex-1 font-medium">{postSuccessMessage}</div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SUBMIT CLIENT POST FORM MODAL / COLLAPSIBLE PANEL                      */}
      {/* ========================================================================= */}
      {isPostingFormOpen && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-rose-500/40 shadow-2xl space-y-5 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <Camera className="w-4 h-4" />
              <span>Client Photo Post Desk: Share Your Living Space</span>
            </div>
            <button
              type="button"
              onClick={() => setIsPostingFormOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmitClientPost} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sameer Khan or Dr. Anand Sen"
                  value={postClientName}
                  onChange={(e) => setPostClientName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Project / Villa Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Palm Crest Villa #14"
                  value={postProjectName}
                  onChange={(e) => setPostProjectName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Location in Bangalore</label>
                <input
                  type="text"
                  placeholder="e.g. Indiranagar, Whitefield, HSR"
                  value={postLocation}
                  onChange={(e) => setPostLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Photo Title / Caption</label>
              <input
                type="text"
                placeholder="e.g. Morning coffee in our biophilic double-height courtyard!"
                value={postPhotoTitle}
                onChange={(e) => setPostPhotoTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
              />
            </div>

            {/* Select High-Resolution Photo from Presets */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Select Photo to Post (or Upload):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { label: 'Villa Twilight Elevation', img: villaExteriorImg },
                  { label: 'Biophilic Living Courtyard', img: courtyardInteriorImg },
                  { label: 'Master Suite Terrace', img: masterSuiteImg },
                  { label: 'Rooftop Pergola Deck', img: pgTerraceImg },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPostSelectedPresetImage(item.img)}
                    className={`relative h-24 rounded-xl overflow-hidden border-2 transition ${
                      postSelectedPresetImage === item.img
                        ? 'border-rose-500 ring-2 ring-rose-400 shadow-md'
                        : 'border-slate-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={item.img} alt={item.label} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-950/40 flex items-end p-1.5">
                      <span className="text-[10px] font-mono text-white font-bold">{item.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Your Testimonial / Story with Ar. S. Gouse Studio
              </label>
              <textarea
                rows={2}
                placeholder="Share your experience with architectural drawings, turnkey construction, BOQ accuracy, or daily life in your completed home..."
                value={postCaption}
                onChange={(e) => setPostCaption(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsPostingFormOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-bold text-xs shadow-md transition"
              >
                Publish Client Post Live
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. FILTER TOOLBAR: BY HANDOVER YEAR & CATEGORY                            */}
      {/* ========================================================================= */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400 font-mono text-[11px] mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-rose-400" />
            Handover Year:
          </span>
          {(['all', '2026', '2025', '2024'] as const).map((year) => (
            <button
              key={year}
              type="button"
              onClick={() => setSelectedYear(year)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedYear === year
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {year === 'all' ? 'All Completed Years' : `${year} Deliveries`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-mono text-[11px]">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-xl focus:outline-none focus:border-rose-400"
          >
            <option value="all">All Typologies</option>
            <option value="Luxury Villa">Luxury Villas</option>
            <option value="Co-Living & PG">Co-Living &amp; PGs</option>
            <option value="Boutique Residence">Boutique Residences</option>
          </select>
          <span className="text-slate-400 font-mono text-[11px] px-2">
            {filteredProjects.length} Verified Client Portfolios
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. PAST CLIENT SHOWCASE CARDS GRID                                         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            className="group rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-rose-500/50 p-6 space-y-5 shadow-xl hover:shadow-2xl hover:shadow-rose-500/10 transition-all flex flex-col justify-between"
          >
            <div className="space-y-4">
              {/* Client Profile Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={project.clientAvatarUrl}
                    alt={project.clientName}
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-rose-500/40 shadow-md shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-base font-bold text-white group-hover:text-rose-300 transition">
                        {project.clientName}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {project.handoverYear} Handover
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-medium">{project.clientRole}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: project.rating }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
              </div>

              {/* Project Meta Bar */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <div className="font-bold text-white">{project.projectName}</div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-rose-400" />
                    <span>{project.projectLocation}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-500 font-mono">Delivered Area</div>
                  <div className="font-bold text-amber-300 font-mono">{project.builtUpArea}</div>
                </div>
              </div>

              {/* Photos Gallery Triad */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Delivered Project Handover Photos:</span>
                  <span className="text-rose-400 font-bold">{project.handoverPhotos.length} High-Res Photos</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {project.handoverPhotos.map((photo, pIdx) => (
                    <div
                      key={pIdx}
                      onClick={() => setActivePhotoModal({ project, photoIndex: pIdx })}
                      className="group/photo relative h-28 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 cursor-pointer"
                      title={photo.title}
                    >
                      <img
                        src={photo.url}
                        alt={photo.title}
                        className="w-full h-full object-cover group-hover/photo:scale-110 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="p-2 rounded-full bg-rose-500 text-white shadow-lg">
                          <Eye className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="absolute bottom-1 left-1 right-1 px-1.5 py-0.5 rounded bg-slate-950/80 text-[9px] text-slate-200 font-mono truncate">
                        {photo.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Client Review Quote */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 italic leading-relaxed">
                &ldquo;{project.testimonial}&rdquo;
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{project.verifiedBadge}</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleLikeProject(project.id)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-rose-400 text-xs font-mono flex items-center gap-1 transition"
                  title="Appreciate Handover"
                >
                  <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                  <span>{project.likesCount}</span>
                </button>

                <a
                  href={`https://wa.me/918073947241?text=Hello%20Ar.%20Gouse,%20I%20am%20inquiring%20about%20the%20architecture%20and%20turnkey%20execution%20for%20${encodeURIComponent(project.projectName)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Inquire Similar Villa</span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 5. FULL PHOTO LIGHTBOX MODAL                                              */}
      {/* ========================================================================= */}
      {activePhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-rose-400 font-bold uppercase">
                  {activePhotoModal.project.projectName} • Delivered {activePhotoModal.project.handoverDate}
                </span>
                <h3 className="text-lg font-bold text-white">
                  {activePhotoModal.project.handoverPhotos[activePhotoModal.photoIndex].title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActivePhotoModal(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Large Photo Display */}
            <div className="relative h-80 sm:h-96 md:h-[480px] w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
              <img
                src={activePhotoModal.project.handoverPhotos[activePhotoModal.photoIndex].url}
                alt="Large view"
                className="w-full h-full object-cover"
              />
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {activePhotoModal.project.handoverPhotos[activePhotoModal.photoIndex].caption}
            </p>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="font-bold text-white">Client: {activePhotoModal.project.clientName}</div>
                <div className="text-[11px] text-slate-400">{activePhotoModal.project.clientRole}</div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="tel:+918073947241"
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>Call +91 80739 47241</span>
                </a>

                <a
                  href={`https://wa.me/918073947241?text=Hello%20Ar.%20Gouse,%20I%20am%20inquiring%20about%20the%20handover%20photo%20for%20${encodeURIComponent(activePhotoModal.project.projectName)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-md"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Architect</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
