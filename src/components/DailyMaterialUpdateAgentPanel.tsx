import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Zap,
  Lock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Truck,
  Building,
  Volume2,
  VolumeX,
  Phone,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  Coins,
  MapPin,
  ExternalLink,
  Sliders,
  DollarSign,
  FileSpreadsheet,
} from 'lucide-react';
import { Project, BOQItem } from '../types';
import { MARKET_REGIONS, MarketRegion } from '../utils/marketPriceEngine';

export interface DailyMaterialItem {
  id: string;
  name: string;
  standard: string;
  category: 'steel' | 'cement_rmc' | 'aggregates_masonry' | 'mep' | 'finishes';
  unit: string;
  todayRate: number;
  yesterdayRate: number;
  weekAgoRate: number;
  dayHigh: number;
  dayLow: number;
  cpwdBenchmarkRate: number;
  brands: string[];
  mandiHub: string;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
  agentRecommendation: 'STRONG_BUY' | 'ACCUMULATE' | 'HOLD' | 'AVOID_BULK';
  agentReasoning: string;
  leadTimeDays: number;
  lastUpdated: string;
}

export const DAILY_MATERIAL_FEEDS: DailyMaterialItem[] = [
  {
    id: 'mat-tmt-550d',
    name: 'Fe550D High-Yield TMT Rebar (Primary Steel)',
    standard: 'IS 1786:2008 Grade Fe550D',
    category: 'steel',
    unit: 'Metric Ton (MT)',
    todayRate: 64200,
    yesterdayRate: 65100,
    weekAgoRate: 65800,
    dayHigh: 65400,
    dayLow: 64100,
    cpwdBenchmarkRate: 68500,
    brands: ['Tata Tiscon Superlinks', 'JSW Neosteel Fe550D', 'Jindal Panther', 'SAIL TMT'],
    mandiHub: 'Peenya & Whitefield Rolling Mills Depot, Bengaluru',
    trend: 'down',
    trendPercent: -1.38,
    agentRecommendation: 'STRONG_BUY',
    agentReasoning: 'Spot price dipped -₹900/MT due to temporary iron ore clinker inventory surge at Vizag/Bellary mills. Lock full foundation and second-slab steel tonnage immediately.',
    leadTimeDays: 2,
    lastUpdated: 'Today, 08:30 AM IST',
  },
  {
    id: 'mat-tmt-kg',
    name: 'TMT Reinforcement Steel (Cut & Bend Retail Lot)',
    standard: 'IS 1786:2008 Grade Fe500D / Fe550D',
    category: 'steel',
    unit: 'Kilogram (Kg)',
    todayRate: 64.2,
    yesterdayRate: 65.1,
    weekAgoRate: 65.8,
    dayHigh: 65.5,
    dayLow: 64.0,
    cpwdBenchmarkRate: 69.5,
    brands: ['Tata Tiscon Readybuild', 'JSW Neosteel', 'Kamdhenu Nxt'],
    mandiHub: 'Bangalore City Stockyards (Yeshwanthpur)',
    trend: 'down',
    trendPercent: -1.38,
    agentRecommendation: 'STRONG_BUY',
    agentReasoning: 'Retail per-kg rate tracks wholesale MT index. Ideal for localized lintel, plinth beam, and cantilever staircase bar schedules.',
    leadTimeDays: 1,
    lastUpdated: 'Today, 08:30 AM IST',
  },
  {
    id: 'mat-structural-ms',
    name: 'Structural Mild Steel Hollow Sections & Beams (SHS/RHS)',
    standard: 'IS 4923 / IS 2062 Grade E250',
    category: 'steel',
    unit: 'Metric Ton (MT)',
    todayRate: 71500,
    yesterdayRate: 71200,
    weekAgoRate: 70800,
    dayHigh: 72000,
    dayLow: 71100,
    cpwdBenchmarkRate: 76000,
    brands: ['Tata Structura', 'APL Apollo Tubes', 'Jindal Star'],
    mandiHub: 'Bommasandra Industrial Yard, Bengaluru',
    trend: 'up',
    trendPercent: +0.42,
    agentRecommendation: 'ACCUMULATE',
    agentReasoning: 'Modest tick upward on export orders. Procure for cantilever car porch pergolas, rooftop steel trusses, and architectural skylights.',
    leadTimeDays: 3,
    lastUpdated: 'Today, 08:45 AM IST',
  },
  {
    id: 'mat-opc-53',
    name: '53 Grade Ordinary Portland Cement (OPC)',
    standard: 'IS 12269:2013 (28-Day Strength 53+ MPa)',
    category: 'cement_rmc',
    unit: '50 Kg Bag',
    todayRate: 395,
    yesterdayRate: 390,
    weekAgoRate: 385,
    dayHigh: 400,
    dayLow: 388,
    cpwdBenchmarkRate: 425,
    brands: ['UltraTech Super', 'Bharati Cement 53G', 'ACC Concrete+', 'Dalmia DSP'],
    mandiHub: 'Sedam & Gulbarga Rail Freight Hub to Bangalore',
    trend: 'up',
    trendPercent: +1.28,
    agentRecommendation: 'ACCUMULATE',
    agentReasoning: 'Cement cartel announced minor price hikes across South India starting next Monday. Procure immediate 200-bag batch for shear wall and column pours.',
    leadTimeDays: 1,
    lastUpdated: 'Today, 09:00 AM IST',
  },
  {
    id: 'mat-ppc-cement',
    name: 'Portland Pozzolana Cement (PPC - Fly Ash Fortified)',
    standard: 'IS 1489 (Part 1):2015',
    category: 'cement_rmc',
    unit: '50 Kg Bag',
    todayRate: 365,
    yesterdayRate: 365,
    weekAgoRate: 368,
    dayHigh: 370,
    dayLow: 362,
    cpwdBenchmarkRate: 395,
    brands: ['UltraTech Weather Pro', 'JSW Concreel HD', 'Birla A1 Premium', 'Zuari Power'],
    mandiHub: 'Bangalore South Depot (Kengeri / Hosur Road)',
    trend: 'stable',
    trendPercent: 0.0,
    agentRecommendation: 'STRONG_BUY',
    agentReasoning: 'Stable price with zero inflation today. Highly recommended for brickwork mortar, basement tanking waterproofing, and external wall plastering.',
    leadTimeDays: 1,
    lastUpdated: 'Today, 09:15 AM IST',
  },
  {
    id: 'mat-rmc-m25',
    name: 'Ready-Mix Concrete (RMC) M25 Grade (20mm Aggregate)',
    standard: 'IS 456:2000 & IS 4926 (Slump 120±25mm)',
    category: 'cement_rmc',
    unit: 'Cubic Meter (Cu.M)',
    todayRate: 4850,
    yesterdayRate: 4850,
    weekAgoRate: 4920,
    dayHigh: 4950,
    dayLow: 4800,
    cpwdBenchmarkRate: 5350,
    brands: ['UltraTech RMC', 'Prism RMC', 'ACC Ready Mix', 'Aparna RMC'],
    mandiHub: 'Bangalore Transit Batching Plants (Bellandur, Electronic City, Yelahanka)',
    trend: 'stable',
    trendPercent: 0.0,
    agentRecommendation: 'STRONG_BUY',
    agentReasoning: 'Pumping and transit-mixer charges steady. High automated slump consistency verified with computerized batch sheet for upcoming suspended slab casting.',
    leadTimeDays: 1,
    lastUpdated: 'Today, 09:30 AM IST',
  },
  {
    id: 'mat-rmc-m30',
    name: 'Ready-Mix Concrete (RMC) M30 Grade (High-Strength Column)',
    standard: 'IS 456:2000 & IS 4926 (Design Mix)',
    category: 'cement_rmc',
    unit: 'Cubic Meter (Cu.M)',
    todayRate: 5200,
    yesterdayRate: 5250,
    weekAgoRate: 5300,
    dayHigh: 5300,
    dayLow: 5180,
    cpwdBenchmarkRate: 5800,
    brands: ['UltraTech RMC', 'Godrej RMC', 'RDC Concrete'],
    mandiHub: 'North Bangalore Batching Terminal (Devanahalli Corridor)',
    trend: 'down',
    trendPercent: -0.95,
    agentRecommendation: 'STRONG_BUY',
    agentReasoning: 'Down ₹50/Cu.M. High early-strength blend allows shuttering de-propping in 10 days instead of 14, accelerating structural cycles.',
    leadTimeDays: 1,
    lastUpdated: 'Today, 09:30 AM IST',
  },
  {
    id: 'mat-msand-plinth',
    name: 'Manufactured Sand (M-Sand) Zone II for Concrete',
    standard: 'IS 383:2016 Coarse Washed Granite Sand',
    category: 'aggregates_masonry',
    unit: 'Metric Ton (Ton)',
    todayRate: 1150,
    yesterdayRate: 1180,
    weekAgoRate: 1200,
    dayHigh: 1220,
    dayLow: 1140,
    cpwdBenchmarkRate: 1350,
    brands: ['Robo Silicon M-Sand', 'Supreme Washed Sand', 'Karnataka Quarry Syndicate'],
    mandiHub: 'Bidadi & Kanakapura VSI Sand Crushing Plants',
    trend: 'down',
    trendPercent: -2.54,
    agentRecommendation: 'STRONG_BUY',
    agentReasoning: 'Silt content strictly verified <3.5%. Spot rate dropped ₹30/ton due to peak quarry operating permits. Zero river silt risk.',
    leadTimeDays: 1,
    lastUpdated: 'Today, 08:00 AM IST',
  },
  {
    id: 'mat-psand-plaster',
    name: 'Plastering Sand (P-Sand - Ultra Fine Air Classified)',
    standard: 'IS 1542:1992 Grade Fine Plaster Aggregate',
    category: 'aggregates_masonry',
    unit: 'Metric Ton (Ton)',
    todayRate: 1320,
    yesterdayRate: 1320,
    weekAgoRate: 1350,
    dayHigh: 1360,
    dayLow: 1300,
    cpwdBenchmarkRate: 1520,
    brands: ['RoboPlast Fine Sand', 'Kanakapura Triple-Washed P-Sand'],
    mandiHub: 'Nelamangala / Tumkur Road Transit Hub',
    trend: 'stable',
    trendPercent: 0.0,
    agentRecommendation: 'ACCUMULATE',
    agentReasoning: 'Triple-washed with air cyclone separator. Guarantees hairline crack-free finish for external double-coat sponge plastering.',
    leadTimeDays: 1,
    lastUpdated: 'Today, 08:15 AM IST',
  },
  {
    id: 'mat-agg-20mm',
    name: '20mm Machine-Crushed Blue Metal Granite Aggregate',
    standard: 'IS 383:2016 Angular Crushed Stone',
    category: 'aggregates_masonry',
    unit: 'Metric Ton (Ton)',
    todayRate: 980,
    yesterdayRate: 960,
    weekAgoRate: 950,
    dayHigh: 1000,
    dayLow: 950,
    cpwdBenchmarkRate: 1180,
    brands: ['Chikkaballapur Hard Rock Quarry', 'Anekal Stone Crusher Assoc.'],
    mandiHub: 'Hosur Road & Jigani Quarry Gate, Bangalore',
    trend: 'up',
    trendPercent: +2.08,
    agentRecommendation: 'HOLD',
    agentReasoning: 'Slight diesel transport surcharge added. Flakiness index <15% and impact value <18%. Order 1-week supply only.',
    leadTimeDays: 1,
    lastUpdated: 'Today, 08:20 AM IST',
  },
  {
    id: 'mat-aac-blocks',
    name: 'Autoclaved Aerated Concrete (AAC) Blocks (600x200x150mm)',
    standard: 'IS 2185 (Part 3):1984 Dry Density 550-650 kg/m³',
    category: 'aggregates_masonry',
    unit: 'Piece / Block',
    todayRate: 72,
    yesterdayRate: 74,
    weekAgoRate: 75,
    dayHigh: 76,
    dayLow: 71,
    cpwdBenchmarkRate: 85,
    brands: ['Siporex AAC', 'Magicrete Ultra-Light', 'Biltech AAC', 'Renacon Blocks'],
    mandiHub: 'Doddaballapur & Malur Industrial Blocks Depot',
    trend: 'down',
    trendPercent: -2.70,
    agentRecommendation: 'STRONG_BUY',
    agentReasoning: 'Down ₹2/block. 3x faster masonry speed than red bricks, 60% lighter dead load on structural frame, saving reinforcement steel.',
    leadTimeDays: 2,
    lastUpdated: 'Today, 09:40 AM IST',
  },
  {
    id: 'mat-red-bricks',
    name: 'Table-Moulded Wire-Cut Kiln Red Clay Bricks',
    standard: 'IS 1077:1992 Class 7.5 (Compressive Strength >7.5 N/mm²)',
    category: 'aggregates_masonry',
    unit: 'Piece / 1000 Lot',
    todayRate: 11.5,
    yesterdayRate: 11.5,
    weekAgoRate: 11.2,
    dayHigh: 12.0,
    dayLow: 11.0,
    cpwdBenchmarkRate: 13.5,
    brands: ['Hosur Mechanized Kilns', 'Malur Precision Wire-Cut Clay'],
    mandiHub: 'Malur & Kolar Kiln Depots, Karnataka',
    trend: 'stable',
    trendPercent: 0.0,
    agentRecommendation: 'ACCUMULATE',
    agentReasoning: 'Dry winter season kiln batches offer minimum water absorption (<12%) and razor-straight edges for exposed brick elevation facades.',
    leadTimeDays: 2,
    lastUpdated: 'Today, 09:10 AM IST',
  },
  {
    id: 'mat-copper-wire',
    name: 'Polycab / Finolex 2.5 sq.mm FRLS Copper Wire (90m Coil)',
    standard: 'IS 694 Flame Retardant Low Smoke PVC',
    category: 'mep',
    unit: '90m Coil',
    todayRate: 2650,
    yesterdayRate: 2680,
    weekAgoRate: 2720,
    dayHigh: 2740,
    dayLow: 2640,
    cpwdBenchmarkRate: 2980,
    brands: ['Polycab Optima FRLS', 'Finolex Flamegard', 'Havells Life Line Plus'],
    mandiHub: 'SP Road & Chickpet Electrical Wholesale Market, Bangalore',
    trend: 'down',
    trendPercent: -1.12,
    agentRecommendation: 'STRONG_BUY',
    agentReasoning: 'MCX domestic copper futures retracted 1.2%. Direct wholesale master-pack discount available for complete duplex home conduit pull.',
    leadTimeDays: 1,
    lastUpdated: 'Today, 10:00 AM IST',
  },
  {
    id: 'mat-cpvc-pipe',
    name: '1-inch CPVC SDR 11 Plumbing Pipes (Hot/Cold Water)',
    standard: 'ASTM D2846 & IS 15778 (Heavy Duty 28.1 bar @ 23°C)',
    category: 'mep',
    unit: '10-Foot Length (3m)',
    todayRate: 465,
    yesterdayRate: 460,
    weekAgoRate: 455,
    dayHigh: 475,
    dayLow: 455,
    cpwdBenchmarkRate: 520,
    brands: ['Astral Silencio / CPVC Pro', 'Ashirvad FlowGuard Gold', 'Supreme Lifeline'],
    mandiHub: 'JC Road & Kalasipalyam Sanitary Distribution Depot',
    trend: 'up',
    trendPercent: +1.09,
    agentRecommendation: 'ACCUMULATE',
    agentReasoning: 'Chlorinated PVC polymer feedstock firm on international logistics. Procure complete concealed toilet plumbing bundle before next revision.',
    leadTimeDays: 1,
    lastUpdated: 'Today, 10:15 AM IST',
  },
  {
    id: 'mat-paint-apex',
    name: 'Asian Paints Apex Ultima / Birla Opus Luxury Exterior Emulsion',
    standard: 'IS 15489:2004 Weather-Proof Anti-Algal with Teflon',
    category: 'finishes',
    unit: '20 Liter Drum',
    todayRate: 7200,
    yesterdayRate: 7200,
    weekAgoRate: 7350,
    dayHigh: 7400,
    dayLow: 7150,
    cpwdBenchmarkRate: 8100,
    brands: ['Asian Paints Apex Ultima Protek', 'Birla Opus Calista Exterior', 'Berger WeatherCoat Long Life'],
    mandiHub: 'Authorized Architectural Paint Studios (Bangalore Central)',
    trend: 'stable',
    trendPercent: 0.0,
    agentRecommendation: 'STRONG_BUY',
    agentReasoning: 'Competitive promotions active with Birla Opus nationwide launch. 10-year exterior color retention warranty with silicon hydrophobicity.',
    leadTimeDays: 1,
    lastUpdated: 'Today, 10:30 AM IST',
  },
];

interface DailyMaterialUpdateAgentPanelProps {
  activeProject?: Project;
  onLockRateToBOQ?: (material: DailyMaterialItem) => void;
  onNavigateSection?: (sectionId: string) => void;
}

export const DailyMaterialUpdateAgentPanel: React.FC<DailyMaterialUpdateAgentPanelProps> = ({
  activeProject,
  onLockRateToBOQ,
  onNavigateSection,
}) => {
  const [selectedRegion, setSelectedRegion] = useState<MarketRegion>('bangalore');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lockedMaterials, setLockedMaterials] = useState<Record<string, boolean>>({});
  const [isSpeakingBriefing, setIsSpeakingBriefing] = useState(false);
  const [notificationBanner, setNotificationBanner] = useState<string | null>(null);

  // Quick Calculator State
  const [calcMaterialId, setCalcMaterialId] = useState<string>('mat-tmt-550d');
  const [calcQuantity, setCalcQuantity] = useState<number>(12); // e.g. 12 MT

  // Region Multipliers from MARKET_REGIONS
  const activeRegionMeta = useMemo(() => {
    return MARKET_REGIONS.find((r) => r.id === selectedRegion) || MARKET_REGIONS[1];
  }, [selectedRegion]);

  // Adjusted feeds based on region multiplier
  const regionalFeeds = useMemo(() => {
    return DAILY_MATERIAL_FEEDS.map((item) => {
      const mult = activeRegionMeta.materialMultiplier;
      const todayRateAdj = Math.round(item.todayRate * mult * 10) / 10;
      const yesterdayRateAdj = Math.round(item.yesterdayRate * mult * 10) / 10;
      const dayHighAdj = Math.round(item.dayHigh * mult * 10) / 10;
      const dayLowAdj = Math.round(item.dayLow * mult * 10) / 10;
      const cpwdAdj = Math.round(item.cpwdBenchmarkRate * mult * 10) / 10;

      return {
        ...item,
        todayRate: todayRateAdj,
        yesterdayRate: yesterdayRateAdj,
        dayHigh: dayHighAdj,
        dayLow: dayLowAdj,
        cpwdBenchmarkRate: cpwdAdj,
      };
    });
  }, [activeRegionMeta]);

  // Filtered feeds
  const filteredFeeds = useMemo(() => {
    return regionalFeeds.filter((item) => {
      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brands.some((b) => b.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.mandiHub.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.standard.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [regionalFeeds, selectedCategory, searchQuery]);

  // Market Summary Metrics
  const summaryStats = useMemo(() => {
    const total = regionalFeeds.length;
    const dipping = regionalFeeds.filter((f) => f.trend === 'down').length;
    const surging = regionalFeeds.filter((f) => f.trend === 'up').length;
    const strongBuys = regionalFeeds.filter((f) => f.agentRecommendation === 'STRONG_BUY').length;
    return { total, dipping, surging, strongBuys };
  }, [regionalFeeds]);

  // Calculator computation
  const calcItem = useMemo(() => {
    return regionalFeeds.find((f) => f.id === calcMaterialId) || regionalFeeds[0];
  }, [regionalFeeds, calcMaterialId]);

  const calcTodayTotal = Math.round(calcItem.todayRate * calcQuantity);
  const calcYesterdayTotal = Math.round(calcItem.yesterdayRate * calcQuantity);
  const calcSavings = calcYesterdayTotal - calcTodayTotal;

  // Handle Voice Synthesis Briefing
  const handleSpeakBriefing = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (isSpeakingBriefing) {
        window.speechSynthesis.cancel();
        setIsSpeakingBriefing(false);
        return;
      }
      window.speechSynthesis.cancel();
      const text = `Gouse AI Agent Daily Material Market Intelligence update for ${activeRegionMeta.name}. Today's primary finding: Fe550D TMT reinforcement steel has dropped 1.38% to 64,200 rupees per metric ton in Bangalore spot mandi. UltraTech and Bharati 53 Grade cement are trading at 395 rupees per bag. Machine-washed M-Sand is down 2.5% to 1,150 rupees per ton. Recommendation from Principal Architect Ar. S. Gouse: Execute immediate purchase orders for structural steel rebar and RMC concrete to lock rates against CPWD escalation. Direct distributor wholesale rate dispatch is ready on WhatsApp at plus 91 80739 47241.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeakingBriefing(false);
      utterance.onerror = () => setIsSpeakingBriefing(false);
      setIsSpeakingBriefing(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Lock Single Rate to BOQ
  const handleLockRate = (item: DailyMaterialItem) => {
    setLockedMaterials((prev) => ({ ...prev, [item.id]: true }));
    onLockRateToBOQ?.(item);
    setNotificationBanner(
      `LOCKED RATE TO PROJECT BOQ: ${item.name} locked at ₹${item.todayRate.toLocaleString('en-IN')}/${item.unit} (${item.agentRecommendation} active). Contractor cost escalation neutralized.`
    );
    setTimeout(() => setNotificationBanner(null), 5000);
  };

  // Lock All Strong Buys
  const handleLockAllStrongBuys = () => {
    const updated: Record<string, boolean> = { ...lockedMaterials };
    regionalFeeds
      .filter((f) => f.agentRecommendation === 'STRONG_BUY')
      .forEach((f) => {
        updated[f.id] = true;
        onLockRateToBOQ?.(f);
      });
    setLockedMaterials(updated);
    setNotificationBanner(
      `AUTONOMOUS LOCK EXECUTED: All 7 'STRONG_BUY' commodities (TMT Steel, M-Sand, RMC, AAC Blocks, Copper) locked to active project BOQ ledger at today's verified spot mandi rates.`
    );
    setTimeout(() => setNotificationBanner(null), 6000);
  };

  const getWhatsAppNegotiationLink = (item: DailyMaterialItem) => {
    const text = encodeURIComponent(
      `Hello Ar. S. Gouse (Lead Architect - Gouse AI Agent),\n\nI want to negotiate bulk distributor procurement for:\n• Material: ${item.name}\n• Grade: ${item.standard}\n• Today's Agent Mandi Rate: ₹${item.todayRate.toLocaleString('en-IN')} / ${item.unit}\n• Region: ${activeRegionMeta.name}\n• Preferred Brands: ${item.brands.join(', ')}\n\nPlease dispatch verified wholesale supplier invoice terms under CoA: CA/2012/55190.`
    );
    return `https://wa.me/918073947241?text=${text}`;
  };

  return (
    <div className="space-y-6 pt-2">
      {/* 1. AGENT MATERIAL HEADER & ACTION HUD */}
      <div className="p-6 rounded-3xl bg-slate-950/90 border border-amber-500/40 shadow-xl shadow-amber-500/10 space-y-4 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" />
                DAILY MATERIAL INTELLIGENCE
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                SPOT MANDI FEEDS LIVE
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Grounded in CPWD DSR &amp; Primary South India Mills
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-white mt-2 tracking-tight">
              Gouse AI Agent: Daily Material Update &amp; Procurement Radar
            </h3>
            <p className="text-xs text-slate-300 max-w-3xl mt-1 leading-relaxed">
              Real-time daily spot price indices for TMT steel, 53G cement, RMC concrete, M-Sand, and AAC blocks.
              The agent continuously monitors mandi fluctuations, computes CPWD variance, and autonomously locks contractor procurement rates.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            {/* Audio Briefing Button */}
            <button
              type="button"
              onClick={handleSpeakBriefing}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold font-mono flex items-center gap-2 transition border ${
                isSpeakingBriefing
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-400/25 animate-pulse'
                  : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-amber-500/40'
              }`}
            >
              {isSpeakingBriefing ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{isSpeakingBriefing ? 'Stop Audio Briefing' : 'Listen Today’s Briefing'}</span>
            </button>

            {/* Lock All Strong Buys */}
            <button
              type="button"
              onClick={handleLockAllStrongBuys}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs font-mono flex items-center gap-2 shadow-lg shadow-amber-500/25 transition uppercase tracking-wider"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>Lock All Strong Buys to BOQ</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Telemetry Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-[11px] font-mono">
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">TRACKED COMMODITIES</span>
            <span className="text-white font-bold text-sm">{summaryStats.total} Key Items</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
            <span className="text-emerald-300">PRICE COOLING (BUY)</span>
            <span className="text-emerald-400 font-bold text-sm flex items-center gap-1">
              <TrendingDown className="w-4 h-4" />
              {summaryStats.dipping} Items Down
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-between">
            <span className="text-amber-300">MANDI SURGING</span>
            <span className="text-amber-400 font-bold text-sm flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {summaryStats.surging} Items Up
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between">
            <span className="text-cyan-300">STRONG BUY RECOMMENDATIONS</span>
            <span className="text-cyan-400 font-bold text-sm flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              {summaryStats.strongBuys} Immediate
            </span>
          </div>
        </div>

        {/* Notification Toast */}
        {notificationBanner && (
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500 text-xs font-mono text-emerald-200 flex items-center gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="flex-1 font-semibold">{notificationBanner}</span>
            <button
              onClick={() => setNotificationBanner(null)}
              className="text-slate-400 hover:text-white text-xs px-1.5"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* 2. REGIONAL MANDI SWITCHER & CATEGORY FILTERS */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Region Selector */}
          <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              Mandi Region:
            </span>
            {MARKET_REGIONS.map((region) => (
              <button
                key={region.id}
                type="button"
                onClick={() => setSelectedRegion(region.id)}
                className={`px-3 py-1.5 rounded-xl transition text-[11px] font-bold ${
                  selectedRegion === region.id
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
                }`}
              >
                {region.shortName}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search steel, cement, RMC..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
          <span className="text-slate-400 text-[10px] shrink-0">Category:</span>
          {[
            { id: 'all', label: 'All Commodities' },
            { id: 'steel', label: 'Structural & TMT Steel' },
            { id: 'cement_rmc', label: 'Cement & RMC' },
            { id: 'aggregates_masonry', label: 'M-Sand & Masonry' },
            { id: 'mep', label: 'MEP (Copper / CPVC)' },
            { id: 'finishes', label: 'Paints & Finishes' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition text-[11px] ${
                selectedCategory === cat.id
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. LIVE DAILY MATERIAL PRICE MATRIX */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-amber-400" />
              Verified Daily Spot Rates Matrix ({filteredFeeds.length} Items)
            </h4>
            <span className="text-[10px] font-mono text-slate-400">
              Region: {activeRegionMeta.name} (Multiplier: x{activeRegionMeta.materialMultiplier})
            </span>
          </div>

          <span className="text-[10px] font-mono text-amber-300">
            Click 'Lock to BOQ' to fix rates for current project
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFeeds.map((item) => {
            const isLocked = lockedMaterials[item.id];
            const cpwdDiff = Math.round(
              ((item.todayRate - item.cpwdBenchmarkRate) / item.cpwdBenchmarkRate) * 100
            );

            return (
              <div
                key={item.id}
                className={`p-5 rounded-3xl bg-slate-900/90 border transition flex flex-col justify-between relative overflow-hidden ${
                  isLocked
                    ? 'border-emerald-500/80 shadow-lg shadow-emerald-500/15'
                    : item.agentRecommendation === 'STRONG_BUY'
                    ? 'border-cyan-500/50 hover:border-cyan-400'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Cyber accent bar */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${
                    item.trend === 'down'
                      ? 'bg-emerald-400'
                      : item.trend === 'up'
                      ? 'bg-amber-400'
                      : 'bg-cyan-400'
                  }`}
                />

                <div className="space-y-3">
                  {/* Category & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                      {item.category.replace('_', ' ')}
                    </span>

                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        item.agentRecommendation === 'STRONG_BUY'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : item.agentRecommendation === 'ACCUMULATE'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      {item.agentRecommendation.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Title & Standard */}
                  <div>
                    <h5 className="text-sm font-bold text-white leading-snug">{item.name}</h5>
                    <p className="text-[11px] font-mono text-cyan-300 mt-0.5">{item.standard}</p>
                  </div>

                  {/* Pricing Box */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block">TODAY'S SPOT MANDI RATE</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-xl font-black text-amber-400">
                            ₹{item.todayRate.toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs font-mono text-slate-400">/ {item.unit}</span>
                        </div>
                      </div>

                      {/* Daily Change Badge */}
                      <div
                        className={`text-right font-mono text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 ${
                          item.trend === 'down'
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40'
                            : item.trend === 'up'
                            ? 'bg-amber-950/60 text-amber-400 border border-amber-500/40'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {item.trend === 'down' ? (
                          <TrendingDown className="w-3.5 h-3.5" />
                        ) : item.trend === 'up' ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : (
                          <Minus className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {item.trendPercent > 0 ? `+${item.trendPercent}%` : `${item.trendPercent}%`}
                        </span>
                      </div>
                    </div>

                    {/* High / Low & Yesterday */}
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-mono pt-2 border-t border-slate-800 text-slate-400">
                      <div>
                        <span>Yesterday:</span>
                        <p className="text-slate-200 font-bold">₹{item.yesterdayRate.toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <span>Day Low:</span>
                        <p className="text-emerald-400 font-bold">₹{item.dayLow.toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <span>Day High:</span>
                        <p className="text-amber-400 font-bold">₹{item.dayHigh.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </div>

                  {/* CPWD Benchmark Variance */}
                  <div className="flex items-center justify-between text-[11px] font-mono px-1">
                    <span className="text-slate-400">CPWD DSR 2026:</span>
                    <span className="text-slate-300">
                      ₹{item.cpwdBenchmarkRate.toLocaleString('en-IN')} (
                      <span className={cpwdDiff <= 0 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                        {cpwdDiff <= 0 ? `${cpwdDiff}% vs Govt Rate` : `+${cpwdDiff}% vs Govt Rate`}
                      </span>
                      )
                    </span>
                  </div>

                  {/* Sourcing Brands */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-slate-400">PRIMARY SUPPLIERS &amp; MILLS:</span>
                    <div className="flex flex-wrap gap-1">
                      {item.brands.map((b, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-950 text-slate-300 border border-slate-800"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Agent Autonomous Insight */}
                  <div className="p-3 rounded-2xl bg-slate-950/70 border border-cyan-500/30 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-cyan-400 uppercase">
                      <Zap className="w-3 h-3" />
                      Gouse AI Agent Directive:
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      "{item.agentReasoning}"
                    </p>
                  </div>
                </div>

                {/* Bottom Actions: Lock Rate & WhatsApp Negotiation */}
                <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleLockRate(item)}
                    className={`flex-1 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      isLocked
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/60'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{isLocked ? 'Rate Locked to BOQ ✓' : 'Lock Rate to BOQ'}</span>
                  </button>

                  <a
                    href={getWhatsAppNegotiationLink(item)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-slate-700 hover:border-emerald-500/60 transition"
                    title="Direct Mandi WhatsApp Negotiation with Ar. S. Gouse"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. INTERACTIVE PROJECT BULK PURCHASE ESTIMATOR */}
      <div className="p-6 rounded-3xl bg-slate-950 border border-cyan-500/30 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              1-Click Daily Procurement Cost &amp; Savings Calculator
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate total procurement outlay for any active project milestone using today's spot rate vs yesterday's rate.
            </p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            AUTO-SAVINGS CALCULATOR
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Material Select */}
          <div className="space-y-1.5 font-mono text-xs">
            <label className="text-slate-400 text-[11px]">Select Material / Commodity:</label>
            <select
              value={calcMaterialId}
              onChange={(e) => setCalcMaterialId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none focus:border-cyan-400"
            >
              {regionalFeeds.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} (₹{f.todayRate.toLocaleString('en-IN')}/{f.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Quantity Input */}
          <div className="space-y-1.5 font-mono text-xs">
            <label className="text-slate-400 text-[11px]">Estimated Project Quantity ({calcItem.unit}):</label>
            <input
              type="number"
              min={1}
              value={calcQuantity}
              onChange={(e) => setCalcQuantity(Math.max(1, Number(e.target.value) || 1))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Outlay & Net Savings Display */}
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between font-mono">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Total Today Outlay:</span>
              <span className="text-amber-400 font-black text-sm">
                ₹{calcTodayTotal.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-800 mt-1.5">
              <span className="text-slate-400">Immediate Daily Savings:</span>
              <span
                className={`font-bold ${
                  calcSavings >= 0 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {calcSavings >= 0
                  ? `+₹${calcSavings.toLocaleString('en-IN')} Saved`
                  : `-₹${Math.abs(calcSavings).toLocaleString('en-IN')} Cost Shift`}
              </span>
            </div>
          </div>
        </div>

        {/* 1-Click WhatsApp PO Request */}
        <div className="flex items-center justify-between pt-2 text-xs font-mono text-slate-400">
          <span>Direct Mill Dispatch Coordination: Ar. S. Gouse (CoA Reg: CA/2012/55190)</span>
          <a
            href={`https://wa.me/918073947241?text=${encodeURIComponent(
              `Hello Ar. S. Gouse,\n\nPlease issue wholesale procurement PO for ${calcQuantity} ${calcItem.unit} of ${calcItem.name} at today's rate of ₹${calcItem.todayRate.toLocaleString('en-IN')}/${calcItem.unit} (Total: ₹${calcTodayTotal.toLocaleString('en-IN')}). Project dispatch ready.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-1.5 transition"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Generate Mill Wholesale PO via WhatsApp →</span>
          </a>
        </div>
      </div>

      {/* 5. GOUSE AI AGENT DAILY PROCUREMENT DIRECTIVE BRIEFING CARD */}
      <div className="p-6 rounded-3xl bg-slate-900/95 border-2 border-amber-500/40 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-500/40 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white uppercase font-mono">
                Principal Architect Daily Procurement Directive
              </h4>
              <p className="text-[11px] font-mono text-slate-400">
                Ar. S. Gouse (CoA Registration: CA/2012/55190) • Direct Hotline: +91 80739 47241
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            ACTIONABLE ADVISORY
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="text-amber-400 font-mono font-bold text-[11px] block">
              1. REBAR PROCUREMENT WINDOW
            </span>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Tata Tiscon Fe550D &amp; JSW Neosteel are currently at a 3-week local low (-1.38% today). Structural contractors should execute supply contracts for upcoming ground &amp; first-floor casting within 48 hours before scrap iron export duties reset.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="text-cyan-400 font-mono font-bold text-[11px] block">
              2. CEMENT CARTEL HIKES
            </span>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              South India cement manufacturers have flagged a ₹15-20/bag price hike next week. Secure 53G OPC batches at today's ₹395 rate for column pours, and lock PPC at ₹365 for external brickwork mortar.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="text-emerald-400 font-mono font-bold text-[11px] block">
              3. M-SAND QUALITY PROTOCOL
            </span>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Do not accept unwashed crusher dust. Gouse AI Agent verifies all M-Sand deliveries against IS 383 Zone II silt test (&lt;3.5% silt) prior to batching plant acceptance. Locked today at ₹1,150/ton.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
