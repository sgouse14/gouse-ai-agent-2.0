import React, { useState } from 'react';
import {
  Compass,
  Film,
  Camera,
  Play,
  Pause,
  RotateCw,
  Sparkles,
  Volume2,
  VolumeX,
  Share2,
  Copy,
  Check,
  Download,
  Printer,
  Layers,
  MapPin,
  CheckCircle2,
  Phone,
  MessageSquare,
  ExternalLink,
  ChevronRight,
  Maximize2,
  Sliders,
  Eye,
  BadgeCheck,
  Building,
  Home,
  FileText,
  Radio,
  SlidersHorizontal,
  X,
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

export interface SocialVirtualTourAndCampaignsProps {
  activeProject: Project;
  mode: 'virtual_tour' | 'campaigns' | 'brochure';
}

export const SocialVirtualTourAndCampaigns: React.FC<SocialVirtualTourAndCampaignsProps> = ({
  activeProject,
  mode,
}) => {
  // -------------------------------------------------------------
  // VIRTUAL TOUR & BEFORE/AFTER STATE
  // -------------------------------------------------------------
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0 - 100
  const [selectedRoom, setSelectedRoom] = useState<'courtyard' | 'master_suite' | 'sky_terrace' | 'exterior_facade'>('courtyard');
  const [activeHotspot, setActiveHotspot] = useState<{
    id: string;
    title: string;
    description: string;
    spec: string;
  } | null>(null);

  // Soundscape audio simulator
  const [soundscapeMode, setSoundscapeMode] = useState<'off' | 'ambient' | 'architect_notes'>('ambient');

  // Room tour details
  const roomData = {
    courtyard: {
      name: 'Biophilic Double-Height Courtyard',
      image: courtyardInteriorImg,
      orientation: 'East-Facing Daylight Core',
      hotspots: [
        {
          id: 'hs-1',
          x: 28,
          y: 45,
          title: 'Solar Passive Teak Louvers',
          description: 'Acoustic Burma teak louvers optimized to filter 70% harsh afternoon UV while flooding the dining core with glare-free 450 lux illumination.',
          spec: 'NBC 2016 Clause 4.2 Compliant Daylight Factor: 3.2%',
        },
        {
          id: 'hs-2',
          x: 62,
          y: 72,
          title: 'Italian Botticino Marble Takeoff',
          description: 'Seamless 20mm book-matched Italian Botticino marble slabs with epoxy resin sealing and zero hollow sound under-foot.',
          spec: 'Compressive Strength > 110 MPa • Polished Mirror Gloss > 90',
        },
      ],
    },
    master_suite: {
      name: 'Executive Master Suite & Planter Balcony',
      image: masterSuiteImg,
      orientation: 'North-East Vastu Sanctuary',
      hotspots: [
        {
          id: 'hs-3',
          x: 35,
          y: 35,
          title: 'Concealed Architectural Cove Lighting',
          description: 'Warm 2700K indirect LED coves with high CRI 95 rendering natural wood grain and fabric textures without ceiling glare.',
          spec: 'Dali Dimming Protocol • 38 W/m High Efficacy',
        },
        {
          id: 'hs-4',
          x: 75,
          y: 50,
          title: 'Acoustic Double-Glazed Fenestration',
          description: 'Saint-Gobain Planitherm 6mm toughened + 12mm argon cavity + 6mm low-E glass cutting 38 dB street traffic noise.',
          spec: 'U-Value: 1.6 W/m²K • Sound Transmission Class (STC): 39',
        },
      ],
    },
    sky_terrace: {
      name: 'Skyline Rooftop Terrace & Pergola',
      image: pgTerraceImg,
      orientation: '360° Open Horizon View',
      hotspots: [
        {
          id: 'hs-5',
          x: 50,
          y: 40,
          title: 'Solar PV Net-Metered Pergola',
          description: 'Bi-facial monocrystalline solar panels generating 22 kWh daily offset, mounted on powder-coated structural steel pergolas.',
          spec: '5.2 kWp Capacity • Enphase Microinverters',
        },
      ],
    },
    exterior_facade: {
      name: 'Signature Wire-Cut Brick Elevation',
      image: villaExteriorImg,
      orientation: 'Front Road Elevation',
      hotspots: [
        {
          id: 'hs-6',
          x: 45,
          y: 30,
          title: 'Cantilevered Reinforced Balcony Slab',
          description: 'Post-tensioned cantilevered slab projecting 2.2m with zero visible drop beams, engineered by Ar. S. Gouse Studio.',
          spec: 'IS 456 M30 Concrete • Jindal Fe550D TMT Bars',
        },
      ],
    },
  };

  const currentRoom = roomData[selectedRoom];

  // -------------------------------------------------------------
  // MULTI-CHANNEL CAMPAIGN STATE
  // -------------------------------------------------------------
  const [campaignChannel, setCampaignChannel] = useState<'instagram' | 'youtube' | 'linkedin' | 'whatsapp'>('instagram');
  const [copiedCaption, setCopiedCaption] = useState(false);

  const campaignCopy = {
    instagram: {
      title: 'Instagram 9:16 Vertical Reel Campaign',
      caption: `✨ Inside ${activeProject.name || 'Prestige Heights Luxury Villa'}: Architecture where biophilic living meets structural precision.
      
Designed & executed turnkey by Ar. S. Gouse Studio (+91 80739 47241).
📐 Features:
- NBC 2016 Daylit Double-Height Courtyard
- Zero Contractor Variance with Dynamic BOQ
- IS 456 M25 Tested Reinforced Concrete Superstructure
- 100% Vastu Compliant East Facing Entrance

📍 Located in ${activeProject.location || 'Bangalore'}
💬 DM or WhatsApp +91 8073947241 for custom architectural consultations & turnkey BOQ breakdowns!

#BangaloreArchitects #LuxuryVilla #TurnkeyConstruction #ArSGouse #IndianArchitecture #BiophilicHome #BIMDesign #ArchitectureLovers`,
    },
    youtube: {
      title: 'YouTube 4K Lumion Walkthrough Video Description',
      caption: `Architectural Tour: ${activeProject.name || 'Prestige Heights Villa'} | 4K 60FPS Walkthrough
Principal Architect: Ar. S. Gouse (CoA Reg: CA/2012/55190)
Phone / WhatsApp: +91 80739 47241 | Email: sgouse14@gmail.com

⏱️ CHAPTER TIMESTAMPS:
00:00 - Signature Façade Elevation & Cantilevers
00:45 - Biophilic Double-Height Living Room
01:30 - Master Bedroom Suite & Planter Terraces
02:15 - Rooftop Solar Pergola & Sky Lounge
03:00 - Structural Details & IS 456 BOQ Audit

Turnkey Consultation by Gouse AI Agent: Complete architectural drawings, 3D Lumion renders, structural auditing, and daily AI site camera verification.`,
    },
    linkedin: {
      title: 'LinkedIn AEC Thought Leadership & Case Study Post',
      caption: `Case Study: Overcoming High-Density Urban Setbacks with Solar-Passive Architecture in ${activeProject.location || 'Bangalore'}.

As urban plot constraints tighten, traditional residential layouts sacrifice natural daylighting and ventilation. In ${activeProject.name || 'our flagship project'}, we implemented:

1. Central Biophilic Courtyard acting as a micro-climate thermal chimney.
2. Dynamic CPWD-indexed BOQ model locking material procurement before slab casting.
3. Automated BIM Clash Detection catching MEP duct collisions prior to formwork placement.

Result: 0% rework variance and an estimated 14% reduction in HVAC energy loads.

Lead Architect: Ar. S. Gouse
Studio Hotline: +91 80739 47241`,
    },
    whatsapp: {
      title: 'WhatsApp Client Lookbook & Brochure Pitch',
      caption: `Hello! Here is the verified architectural portfolio lookbook for *${activeProject.name || 'Prestige Heights Residence'}*.

🏢 Project: ${activeProject.name || 'Luxury Turnkey Villa'}
📍 Location: ${activeProject.location || 'Bangalore'}
📐 Built-up Area: ${(activeProject as any).area || (activeProject as any).builtUpArea || 3500} Sq.Ft
🏗️ Principal Architect: Ar. S. Gouse (+91 80739 47241)

Key Highlights:
✅ 4K Lumion 3D Walkthrough Available
✅ IS 456 Verified Structural Framing
✅ Dynamic Floor-by-Floor BOQ Pricing Locked
✅ 0% Brokerage Direct Consultation

Click here to view the full interactive lookbook or reply to schedule a private site walk!`,
    },
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(campaignCopy[campaignChannel].caption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2500);
  };

  // -------------------------------------------------------------
  // RENDER: VIRTUAL TOUR & BEFORE/AFTER SLIDER
  // -------------------------------------------------------------
  if (mode === 'virtual_tour') {
    return (
      <div className="space-y-6 text-left animate-in fade-in duration-200">
        {/* Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-rose-950/60 via-slate-900 to-slate-950 border border-rose-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
                <Compass className="w-3 h-3 text-rose-400" />
                360° SPATIAL VIRTUAL TOUR
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-mono">
                BEFORE / AFTER COMPARISON
              </span>
              <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[10px] font-mono">
                ACOUSTIC SOUNDSCAPE LIVE
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Interactive 360° Room Navigator &amp; Construction Wipe Slider
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              Explore photo-real spatial rooms with interactive engineering hotspots or drag the wipe slider to compare raw structural RCC concrete framing directly with the finished luxury elevation.
            </p>
          </div>

          {/* Soundscape Control */}
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 p-2 rounded-2xl shrink-0">
            <span className="text-[11px] font-mono text-slate-400">Audio:</span>
            <button
              type="button"
              onClick={() => setSoundscapeMode(soundscapeMode === 'off' ? 'ambient' : 'off')}
              className={`p-2 rounded-xl text-xs flex items-center gap-1.5 font-bold transition ${
                soundscapeMode !== 'off'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-slate-900 text-slate-500'
              }`}
            >
              {soundscapeMode !== 'off' ? (
                <>
                  <Volume2 className="w-4 h-4 text-rose-400 animate-pulse" />
                  <span>Ambient Audio Active</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span>Muted</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* SECTION A: BEFORE & AFTER SLIDER */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                <span>Interactive Construction Wipe: Raw Framing vs Finished Elevation</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Drag the slider left and right to inspect the transition from M25 column reinforcement to the completed biophilic luxury facade.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-amber-400 font-bold">LEFT: Site Framing</span>
              <span className="text-slate-600">|</span>
              <span className="text-rose-400 font-bold">RIGHT: Finished Elevation</span>
            </div>
          </div>

          {/* Wipe Viewport */}
          <div className="relative h-80 sm:h-96 md:h-[460px] w-full rounded-2xl overflow-hidden select-none bg-slate-950 border border-slate-800">
            {/* Background Image: Finished Elevation (Right) */}
            <img
              src={villaExteriorImg}
              alt="Finished Elevation"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-sm border border-rose-500/40 text-rose-300 px-3 py-1 rounded-xl text-xs font-mono font-bold">
              FINISHED LUXURY ELEVATION
            </div>

            {/* Foreground Clipped Image: Raw Framing (Left) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPosition}%` }}
            >
              <img
                src={siteFramingImg}
                alt="Raw Structural Framing"
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  width: '100%',
                  minWidth: '100%',
                  maxWidth: 'none',
                }}
              />
              <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-sm border border-amber-500/40 text-amber-300 px-3 py-1 rounded-xl text-xs font-mono font-bold">
                IS 456 M25 RCC FRAMING
              </div>
            </div>

            {/* Vertical Divider Line */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 via-white to-rose-400 shadow-[0_0_15px_rgba(255,255,255,0.7)] pointer-events-none"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-white shadow-xl">
                <Sliders className="w-4 h-4 text-amber-400" />
              </div>
            </div>

            {/* Invisible Range Input Overlay */}
            <input
              type="range"
              min={0}
              max={100}
              value={sliderPosition}
              onChange={(e) => setSliderPosition(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Milestone: Slab Casting &amp; Rebar Inspection (Day 48)</span>
            <span>Handover: Move-In Ready Biophilic Residence (Day 180)</span>
          </div>
        </div>

        {/* SECTION B: 360° ROOM EXPLORER WITH HOTSPOTS */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-rose-400" />
                <span>360° Spatial Room Navigator: {currentRoom.name}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Click on the floating glowing hotspot pins to inspect architectural material specifications and compliance standards.
              </p>
            </div>

            {/* Room Selector Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-950 border border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setSelectedRoom('courtyard');
                  setActiveHotspot(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  selectedRoom === 'courtyard'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Courtyard Living
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRoom('master_suite');
                  setActiveHotspot(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  selectedRoom === 'master_suite'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Master Suite
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRoom('sky_terrace');
                  setActiveHotspot(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  selectedRoom === 'sky_terrace'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sky Terrace
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRoom('exterior_facade');
                  setActiveHotspot(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  selectedRoom === 'exterior_facade'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Façade Elevation
              </button>
            </div>
          </div>

          {/* Interactive Room Canvas */}
          <div className="relative h-80 sm:h-96 md:h-[460px] w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
            <img
              src={currentRoom.image}
              alt={currentRoom.name}
              className="w-full h-full object-cover transition-opacity duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/30 pointer-events-none" />

            <div className="absolute top-4 left-4 bg-slate-950/90 backdrop-blur-sm border border-slate-700 text-white px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-rose-400" />
              <span>{currentRoom.orientation}</span>
            </div>

            {/* Clickable Hotspot Pins */}
            {currentRoom.hotspots.map((hs) => (
              <button
                key={hs.id}
                type="button"
                onClick={() => setActiveHotspot(hs)}
                style={{ top: `${hs.y}%`, left: `${hs.x}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 p-2.5 rounded-full bg-rose-500/90 text-white border-2 border-white shadow-lg hover:scale-125 transition-all group z-10"
                title={hs.title}
              >
                <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-slate-950/90 text-[10px] text-white border border-rose-500/40 whitespace-nowrap hidden group-hover:block pointer-events-none">
                  {hs.title}
                </span>
              </button>
            ))}

            {/* Hotspot Specification Card Overlay */}
            {activeHotspot && (
              <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md p-4 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-rose-500/50 shadow-2xl space-y-2 animate-in fade-in z-20">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                    <Sparkles className="w-4 h-4 text-rose-400" />
                    <span>{activeHotspot.title}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveHotspot(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeHotspot.description}
                </p>

                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 font-bold">
                  {activeHotspot.spec}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: MULTI-CHANNEL CAMPAIGNS & AI REEL PRODUCER
  // -------------------------------------------------------------
  if (mode === 'campaigns') {
    const currentCampaign = campaignCopy[campaignChannel];

    return (
      <div className="space-y-6 text-left animate-in fade-in duration-200">
        {/* Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-pink-950/60 via-slate-900 to-slate-950 border border-pink-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
                <Share2 className="w-3 h-3 text-pink-400" />
                MULTI-CHANNEL SOCIAL CAMPAIGN GENERATOR
              </span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[10px] font-mono">
                INSTAGRAM REELS • YOUTUBE SHORTS
              </span>
              <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[10px] font-mono">
                LINKEDIN AEC &amp; WHATSAPP
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              One-Click Social Media Publisher &amp; Lead Generation Kits
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              Automatically format and publish architectural case studies, high-resolution renders, and video walkthroughs with trending hashtags, NBC 2016 engineering citations, and direct WhatsApp lead triggers.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyCaption}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-pink-600/20 transition"
            >
              {copiedCaption ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCaption ? 'Caption Copied!' : 'Copy Formatted Caption'}</span>
            </button>
          </div>
        </div>

        {/* Channel Selector Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
          <button
            type="button"
            onClick={() => setCampaignChannel('instagram')}
            className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
              campaignChannel === 'instagram'
                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white border-pink-400 shadow-md'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Instagram 9:16 Reel</span>
          </button>

          <button
            type="button"
            onClick={() => setCampaignChannel('youtube')}
            className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
              campaignChannel === 'youtube'
                ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white border-red-500 shadow-md'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>YouTube 4K Shorts</span>
          </button>

          <button
            type="button"
            onClick={() => setCampaignChannel('linkedin')}
            className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
              campaignChannel === 'linkedin'
                ? 'bg-gradient-to-r from-sky-600 to-blue-700 text-white border-sky-400 shadow-md'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>LinkedIn AEC Case Study</span>
          </button>

          <button
            type="button"
            onClick={() => setCampaignChannel('whatsapp')}
            className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
              campaignChannel === 'whatsapp'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-400 shadow-md'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp Client Broadcast</span>
          </button>
        </div>

        {/* Live Mockup & Copy Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Creative Media Preview */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wide">
                Campaign Creative Visual
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-400 text-[10px] font-mono border border-slate-800">
                {campaignChannel === 'instagram' ? '1080 x 1920 (9:16)' : '1920 x 1080 (16:9)'}
              </span>
            </div>

            <div className="relative h-80 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
              <img
                src={campaignChannel === 'instagram' ? masterSuiteImg : villaExteriorImg}
                alt="Campaign Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />

              <div className="absolute bottom-4 left-4 right-4">
                <div className="text-base font-bold text-white">{activeProject.name || 'Prestige Heights Residence'}</div>
                <div className="text-xs text-pink-300 font-mono">By Ar. S. Gouse Studio • +91 80739 47241</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Optimized for highest engagement &amp; reach</span>
              <a
                href={campaignChannel === 'whatsapp' ? 'https://wa.me/918073947241' : 'https://instagram.com'}
                target="_blank"
                rel="noreferrer"
                className="text-pink-400 hover:underline font-bold flex items-center gap-1"
              >
                <span>Launch Channel</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Formatted Copy & Hashtags */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">{currentCampaign.title}</h3>
                <button
                  type="button"
                  onClick={handleCopyCaption}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-pink-300 text-xs font-mono font-bold flex items-center gap-1.5 transition"
                >
                  {copiedCaption ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCaption ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono leading-relaxed max-h-72 overflow-y-auto whitespace-pre-wrap select-all">
                {currentCampaign.caption}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
              <span>Author: Ar. S. Gouse</span>
              <span className="text-emerald-400 font-mono">Ready to syndicate</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: DIGITAL PROJECT LOOKBOOK & PDF BROCHURE
  // -------------------------------------------------------------
  return (
    <div className="space-y-6 text-left animate-in fade-in duration-200">
      {/* Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-950 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
              <FileText className="w-3 h-3 text-amber-400" />
              ARCHITECTURAL PROJECT LOOKBOOK &amp; BROCHURE
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
              HIGH-RES PORTFOLIO PRINT READY
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Complete Architectural Lookbook: {activeProject.name || 'Prestige Heights'}
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed font-light">
            Comprehensive project portfolio document containing high-resolution 4K exterior elevations, biophilic courtyard interior styling, structural engineering specifications, and CPWD material schedules.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF Brochure</span>
          </button>
        </div>
      </div>

      {/* Lookbook Magazine Sheet */}
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl space-y-8 max-w-5xl mx-auto text-left">
        {/* Cover Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-b border-slate-800 pb-8">
          <div className="space-y-4">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
              Ar. S. Gouse Architecture &amp; Turnkey Studio
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              {activeProject.name || 'Prestige Heights Luxury Villa'}
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              A contemporary solar-passive biophilic residence situated in {activeProject.location || 'Bangalore'}, featuring double-height teak louvers, post-tensioned cantilevers, and dynamic CPWD-indexed turnkey BOQ execution.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs pt-2">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-500 font-mono">Location</div>
                <div className="font-bold text-white mt-0.5">{activeProject.location || 'Bangalore Tech Corridor'}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-500 font-mono">Total Built-Up Area</div>
                <div className="font-bold text-white mt-0.5">{(activeProject as any).area || (activeProject as any).builtUpArea || 3500} Sq.Ft (G+2 Floors)</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-500 font-mono">Architect License</div>
                <div className="font-bold text-amber-300 mt-0.5">CoA CA/2012/55190</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-500 font-mono">Client Verification</div>
                <div className="font-bold text-emerald-400 mt-0.5">Verified Completion 2026</div>
              </div>
            </div>
          </div>

          <div className="h-80 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl">
            <img src={villaExteriorImg} alt="Cover" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Gallery Triad */}
        <div className="space-y-3">
          <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            Curated Architectural Gallery
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="h-48 rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
              <img src={courtyardInteriorImg} alt="Interior" className="w-full h-full object-cover" />
              <div className="p-2 bg-slate-950/90 text-[11px] text-slate-300 font-mono">Biophilic Courtyard Core</div>
            </div>
            <div className="h-48 rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
              <img src={masterSuiteImg} alt="Suite" className="w-full h-full object-cover" />
              <div className="p-2 bg-slate-950/90 text-[11px] text-slate-300 font-mono">Executive Master Bedroom</div>
            </div>
            <div className="h-48 rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
              <img src={pgTerraceImg} alt="Terrace" className="w-full h-full object-cover" />
              <div className="p-2 bg-slate-950/90 text-[11px] text-slate-300 font-mono">Skyline Rooftop Pergola</div>
            </div>
          </div>
        </div>

        {/* Technical Specification Matrix */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            Material &amp; Structural Specifications Matrix
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 font-mono">Concrete &amp; Structural Framing</span>
              <div className="font-bold text-white">IS 456 M25 Design Mix with Fe550D TMT</div>
              <p className="text-[11px] text-slate-400">Ultrasound rebar testing with ultrasonic non-destructive concrete scanning.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 font-mono">Fenestration &amp; Acoustics</span>
              <div className="font-bold text-white">Saint-Gobain Planitherm Low-E DGU</div>
              <p className="text-[11px] text-slate-400">STC 39 noise dampening with hermetically sealed argon cavity.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 font-mono">Flooring &amp; Wall Finishes</span>
              <div className="font-bold text-white">Italian Botticino Marble &amp; Teak Cladding</div>
              <p className="text-[11px] text-slate-400">Book-matched marble layout with zero contractor variance takeoff.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 font-mono">Renewable Power &amp; Net-Metering</span>
              <div className="font-bold text-white">5.2 kW Rooftop Solar PV Inverter Grid</div>
              <p className="text-[11px] text-slate-400">BESCOM bi-directional net-metering delivering zero electricity cost.</p>
            </div>
          </div>
        </div>

        {/* Architect Contact Footer */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="text-sm font-bold text-white">Ar. S. Gouse Architecture Studio</div>
            <div className="text-xs text-amber-400 font-mono">Principal Architect &amp; Turnkey Builder</div>
            <div className="text-[11px] text-slate-400 font-mono">Bangalore Tech Corridor • +91 80739 47241</div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://wa.me/918073947241"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Direct</span>
            </a>
            <a
              href="tel:+918073947241"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 transition"
            >
              <Phone className="w-4 h-4 text-amber-400" />
              <span>Call Architect</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
