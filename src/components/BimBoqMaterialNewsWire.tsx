import React, { useState } from 'react';
import {
  Newspaper,
  TrendingDown,
  TrendingUp,
  Minus,
  Sparkles,
  Volume2,
  VolumeX,
  Phone,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Truck,
  Building2,
  Layers,
  ArrowRight,
  Info,
  Clock,
  Radio,
} from 'lucide-react';
import { CurrencyCode, formatCurrency } from '../utils/formatters';

export interface MaterialNewsItem {
  id: string;
  title: string;
  category: 'steel' | 'cement_rmc' | 'sand_masonry' | 'mep_finishes';
  categoryLabel: string;
  timestamp: string;
  date: string;
  sentiment: 'favorable' | 'caution' | 'neutral';
  impactSummary: string;
  fullReport: string;
  currentMandiRate: string;
  yesterdayMandiRate: string;
  changeBadge: string;
  changeTrend: 'down' | 'up' | 'stable';
  boqRecommendation: string;
  sourceHub: string;
}

export const DAILY_MATERIAL_NEWS_DATA: MaterialNewsItem[] = [
  {
    id: 'news-steel-01',
    title: 'Secondary Scrap Cools: Peenya & Bellary Mills Drop Fe550D TMT by ₹900/MT',
    category: 'steel',
    categoryLabel: 'Structural Steel',
    timestamp: '08:30 AM Today',
    date: 'March 2026',
    sentiment: 'favorable',
    impactSummary: 'Spot prices for primary Fe550D rebar dipped -1.38% to ₹64,200/MT. Structural slab steel costs reduce by approx ₹14 per sq.ft of built-up area.',
    fullReport: 'Domestic iron ore clinker inventory at Vijayanagar and Bellary primary blast furnaces has reached a 6-week high. Secondary rolling yards in Peenya and Whitefield have passed on a ₹900/MT price cut for bundle orders >10 MT. Tata Tiscon Superlinks and JSW Neosteel are honoring spot distributor discounts through the end of the week.',
    currentMandiRate: '₹64,200 / MT',
    yesterdayMandiRate: '₹65,100 / MT',
    changeBadge: '-₹900/MT (-1.38%)',
    changeTrend: 'down',
    boqRecommendation: 'STRONG BUY: Lock complete foundation footing & first-floor slab rebar schedules today.',
    sourceHub: 'Peenya Rolling Mills & stockyards, Bengaluru',
  },
  {
    id: 'news-cement-02',
    title: 'Cement Cartel Alerts: South India Manufacturers Flag ₹15-20/Bag Hike Next Week',
    category: 'cement_rmc',
    categoryLabel: 'Cement & RMC',
    timestamp: '09:00 AM Today',
    date: 'March 2026',
    sentiment: 'caution',
    impactSummary: '53 Grade OPC steady at ₹395/bag and PPC at ₹365/bag today, but scheduled price hike will increase column and beam costs by ₹4-6/sq.ft if not booked early.',
    fullReport: 'Regional cement manufacturers in Kalaburagi, Sedam, and Andhra Pradesh clinker belts have cited coal freight adjustments and limestone quarry royalties. UltraTech, Bharati, and ACC dealers recommend immediate delivery dispatch orders for projects currently pouring grade beams or casting RCC slabs.',
    currentMandiRate: '₹395 / 50kg Bag (OPC 53G)',
    yesterdayMandiRate: '₹390 / 50kg Bag',
    changeBadge: '+₹5/Bag (+1.28%)',
    changeTrend: 'up',
    boqRecommendation: 'ACCUMULATE: Book immediate 200-bag lot at ₹395 ahead of scheduled weekend price revision.',
    sourceHub: 'Sedam Rail Freight Terminal to Bangalore Depots',
  },
  {
    id: 'news-sand-03',
    title: 'M-Sand Supply Surge: Washed Granite Concrete Sand Drops 2.5% to ₹1,150/Ton',
    category: 'sand_masonry',
    categoryLabel: 'M-Sand & Aggregates',
    timestamp: '08:15 AM Today',
    date: 'March 2026',
    sentiment: 'favorable',
    impactSummary: 'Abundant VSI crusher output lowers ready-mix concrete sub-base and structural plastering mortar expenses.',
    fullReport: 'Karnataka Mines and Geology clearance of additional quarry shifts in the Kanakapura, Bidadi, and Chikkaballapur clusters has relieved manufactured sand bottlenecks. Lab-tested silt content conforms to IS 383 Zone II (<3.5% silt). Triple-washed Plastering Sand (P-Sand) remains competitive at ₹1,320/ton.',
    currentMandiRate: '₹1,150 / Ton',
    yesterdayMandiRate: '₹1,180 / Ton',
    changeBadge: '-₹30/Ton (-2.54%)',
    changeTrend: 'down',
    boqRecommendation: 'SECURE SUPPLY: Accept direct tipper loads for upcoming ground floor brickwork and plastering.',
    sourceHub: 'Bidadi & Kanakapura VSI Sand Depots',
  },
  {
    id: 'news-rmc-04',
    title: 'RMC Slump Consistency: Transit Pumping Charges Normalized Across Tech Corridor',
    category: 'cement_rmc',
    categoryLabel: 'Cement & RMC',
    timestamp: '09:45 AM Today',
    date: 'March 2026',
    sentiment: 'neutral',
    impactSummary: 'M25 grade ready-mix concrete steady at ₹4,850/Cu.M; transit mixer lead times shortened to 4 hours in Indiranagar & Whitefield.',
    fullReport: 'Computerized batching plants from UltraTech RMC and Prism Concrete report stable fly-ash and chemical admixture inventories. High early-strength M30 column mix is quoted at ₹5,200/Cu.M with guaranteed 28-day characteristic cube strength compliance.',
    currentMandiRate: '₹4,850 / Cu.M (M25)',
    yesterdayMandiRate: '₹4,850 / Cu.M',
    changeBadge: 'Stable (±0.0%)',
    changeTrend: 'stable',
    boqRecommendation: 'SCHEDULE POUR: Schedule Saturday early-morning slab pour to avoid BBMP daytime transit curbs.',
    sourceHub: 'Transit Batching Terminals (Bellandur & Devanahalli)',
  },
  {
    id: 'news-aac-05',
    title: 'AAC Lightweight Blocks: Malur Manufacturing Belt Offers Volume Rebates at ₹72/pc',
    category: 'sand_masonry',
    categoryLabel: 'Masonry & Blocks',
    timestamp: '10:15 AM Today',
    date: 'March 2026',
    sentiment: 'favorable',
    impactSummary: '600x200x150mm blocks down to ₹72/piece. 60% structural dead load reduction vs red clay bricks, saving rebar weight.',
    fullReport: 'Industrial autoclave facilities along the Bangalore-Chennai industrial corridor (Malur, Hoskote) have expanded daily block curing output. Siporex and Magicrete blocks deliver dry density of 550-650 kg/m³, conforming to IS 2185 Part 3 with thermal conductivity under 0.16 W/m-K.',
    currentMandiRate: '₹72 / Block (600x200x150)',
    yesterdayMandiRate: '₹74 / Block',
    changeBadge: '-₹2/Block (-2.70%)',
    changeTrend: 'down',
    boqRecommendation: 'STRONG BUY: Replace heavy red bricks with AAC on upper floor partition walls to reduce slab moments.',
    sourceHub: 'Malur Industrial AAC Block Yards, Karnataka',
  },
  {
    id: 'news-mep-06',
    title: 'MEP Copper Index: MCX Copper Futures Ease; Polycab FRLS Wires Quoted at ₹2,650/Coil',
    category: 'mep_finishes',
    categoryLabel: 'MEP & Finishes',
    timestamp: '10:45 AM Today',
    date: 'March 2026',
    sentiment: 'favorable',
    impactSummary: 'Domestic refined copper cathode rates softened 1.1%; concealed electrical conduit pulls cost 3-4% less today.',
    fullReport: 'Multi Commodity Exchange (MCX) copper futures reflected lower import landed duties. SP Road wholesale electrical market reports ample stock of Polycab Optima and Finolex Flamegard 2.5 sq.mm flame-retardant low-smoke wires with IS 694 hallmark.',
    currentMandiRate: '₹2,650 / 90m Coil (2.5mm)',
    yesterdayMandiRate: '₹2,680 / 90m Coil',
    changeBadge: '-₹30/Coil (-1.12%)',
    changeTrend: 'down',
    boqRecommendation: 'PROCURE: Bundle 1st-stage concealed conduit wiring with Astral CPVC plumbing pipes today.',
    sourceHub: 'SP Road & Chickpet Wholesale Electrical Hub, Bengaluru',
  },
];

interface BimBoqMaterialNewsWireProps {
  onLockMaterialRate?: (newsItem: MaterialNewsItem) => void;
  onNavigateSection?: (sectionId: string) => void;
}

export const BimBoqMaterialNewsWire: React.FC<BimBoqMaterialNewsWireProps> = ({
  onLockMaterialRate,
  onNavigateSection,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isSpeakingNews, setIsSpeakingNews] = useState(false);
  const [expandedNewsId, setExpandedNewsId] = useState<string | null>('news-steel-01');
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);

  const filteredNews = DAILY_MATERIAL_NEWS_DATA.filter((item) => {
    return selectedCategory === 'all' || item.category === selectedCategory;
  });

  const handleSpeakDailyNews = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (isSpeakingNews) {
        window.speechSynthesis.cancel();
        setIsSpeakingNews(false);
        return;
      }
      window.speechSynthesis.cancel();
      const topNews = DAILY_MATERIAL_NEWS_DATA.slice(0, 3)
        .map((n, i) => `News ${i + 1}: ${n.title}. Rate: ${n.currentMandiRate}, changing ${n.changeBadge}. Recommendation: ${n.boqRecommendation}`)
        .join('. ');
      const text = `BIM and BOQ Agent Daily Material Market News Briefing. Principal Architect Ar. S. Gouse CoA CA/2012/55190. ${topNews}. Contact Ar. Gouse directly on WhatsApp at plus 91 80739 47241 for verified wholesale dispatch.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeakingNews(false);
      utterance.onerror = () => setIsSpeakingNews(false);
      setIsSpeakingNews(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleLockRate = (item: MaterialNewsItem) => {
    onLockMaterialRate?.(item);
    setLockedNotice(`Locked Today's Spot Rate for "${item.categoryLabel}" into active BIM & BOQ schedule at ${item.currentMandiRate}.`);
    setTimeout(() => setLockedNotice(null), 4500);
  };

  const getWhatsAppNewsInquiryLink = (item: MaterialNewsItem) => {
    const text = encodeURIComponent(
      `Hello Ar. S. Gouse (Lead Architect - BIM & BOQ Agent),\n\nRegarding today's Daily Material News bulletin:\n"${item.title}"\n• Spot Mandi Rate: ${item.currentMandiRate} (${item.changeBadge})\n• Hub: ${item.sourceHub}\n\nPlease share verified supplier procurement invoice terms under CoA: CA/2012/55190.`
    );
    return `https://wa.me/918073947241?text=${text}`;
  };

  return (
    <div className="rounded-3xl bg-slate-950/95 border-2 border-amber-500/40 p-5 sm:p-6 shadow-2xl shadow-amber-950/40 space-y-5 relative overflow-hidden">
      {/* Background Neural Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* 1. Header Bar: BIM & BOQ Agent Material News Wire */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-mono font-bold flex items-center gap-1.5 uppercase">
              <Newspaper className="w-3.5 h-3.5 text-amber-400" />
              BIM &amp; BOQ AGENT: DAILY MATERIAL NEWS
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              LIVE MANDI WIRE
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Updated Daily • Bangalore &amp; South India Spot Depots
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Daily Construction Material News &amp; Spot Rate Bulletin</span>
          </h3>
          <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
            Direct market intelligence on structural TMT steel, 53G cement, ready-mix concrete, M-Sand, and masonry blocks.
            Integrated into the BIM &amp; BOQ Agent to immunize project estimates against sudden supply-chain fluctuations.
          </p>
        </div>

        {/* Action Buttons: Audio News & Lead Architect Hotline */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={handleSpeakDailyNews}
            className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition border ${
              isSpeakingNews
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-400/30 animate-pulse'
                : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-amber-500/30'
            }`}
            title="Read Daily Material News Briefing using AI speech synthesis"
          >
            {isSpeakingNews ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{isSpeakingNews ? 'Stop Audio News' : 'Listen Today’s News'}</span>
          </button>

          <a
            href="https://wa.me/918073947241?text=Hello%20Ar.%20S.%20Gouse,%20I%20am%20reviewing%20the%20Daily%20Material%20News%20inside%20the%20BIM%20%26%20BOQ%20Agent.%20Please%20guide%20bulk%20procurement%20rates."
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Hotline: +91 80739 47241</span>
          </a>
        </div>
      </div>

      {/* Notification Toast */}
      {lockedNotice && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500 text-xs font-mono text-emerald-200 flex items-center gap-2 animate-in fade-in">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="flex-1 font-semibold">{lockedNotice}</span>
          <button onClick={() => setLockedNotice(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* 2. Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono border-b border-slate-800/80">
        <span className="text-slate-400 text-[11px] shrink-0">Filter Wire:</span>
        {[
          { id: 'all', label: 'All Breaking News (6)' },
          { id: 'steel', label: 'Structural Steel Rebar' },
          { id: 'cement_rmc', label: 'Cement & RMC' },
          { id: 'sand_masonry', label: 'M-Sand & AAC Blocks' },
          { id: 'mep_finishes', label: 'MEP (Copper / Pipes)' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedCategory(tab.id)}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition text-[11px] font-bold ${
              selectedCategory === tab.id
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. News Feed Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNews.map((news) => {
          const isExpanded = expandedNewsId === news.id;

          return (
            <div
              key={news.id}
              className={`p-4 rounded-2xl bg-slate-900/90 border transition flex flex-col justify-between space-y-3 relative overflow-hidden ${
                news.sentiment === 'favorable'
                  ? 'border-emerald-500/30 hover:border-emerald-400/60'
                  : news.sentiment === 'caution'
                  ? 'border-amber-500/40 hover:border-amber-400/70'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Accent Bar */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 ${
                  news.changeTrend === 'down'
                    ? 'bg-emerald-400'
                    : news.changeTrend === 'up'
                    ? 'bg-amber-400'
                    : 'bg-cyan-400'
                }`}
              />

              <div className="space-y-2.5">
                {/* Meta Header */}
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-slate-950 text-amber-300 border border-slate-800 uppercase font-bold">
                    {news.categoryLabel}
                  </span>
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {news.timestamp}
                  </span>
                </div>

                {/* News Title */}
                <h4 className="text-xs sm:text-sm font-bold text-white leading-snug hover:text-amber-300 transition">
                  {news.title}
                </h4>

                {/* Rate Shift Badge Box */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-[11px] font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block">TODAY'S RATE</span>
                    <span className="font-bold text-amber-400">{news.currentMandiRate}</span>
                  </div>

                  <div
                    className={`px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 text-[10px] ${
                      news.changeTrend === 'down'
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                        : news.changeTrend === 'up'
                        ? 'bg-amber-950/60 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {news.changeTrend === 'down' ? (
                      <TrendingDown className="w-3 h-3" />
                    ) : news.changeTrend === 'up' ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <Minus className="w-3 h-3" />
                    )}
                    <span>{news.changeBadge}</span>
                  </div>
                </div>

                {/* Impact Summary */}
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {news.impactSummary}
                </p>

                {/* Expanded Full Report */}
                {isExpanded && (
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2 text-xs font-sans text-slate-300 animate-in fade-in">
                    <div className="text-[10px] font-mono text-cyan-400 uppercase font-bold flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Detailed Supply Wire:
                    </div>
                    <p className="leading-relaxed text-[11px] text-slate-300">
                      {news.fullReport}
                    </p>
                    <div className="pt-1 text-[10px] font-mono text-slate-400 border-t border-slate-800">
                      Depot / Yard: {news.sourceHub}
                    </div>
                  </div>
                )}

                {/* BIM & BOQ Recommendation Directive */}
                <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-[11px] font-mono text-amber-200 leading-tight">
                  <span className="text-amber-400 font-bold block mb-0.5">BIM &amp; BOQ DIRECTIVE:</span>
                  {news.boqRecommendation}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setExpandedNewsId(isExpanded ? null : news.id)}
                  className="text-slate-400 hover:text-white transition flex items-center gap-1 text-[11px]"
                >
                  <span>{isExpanded ? 'Less info' : 'Full wire'}</span>
                  {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleLockRate(news)}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] transition"
                    title="Lock this rate into your current project BOQ schedule"
                  >
                    Lock Rate
                  </button>

                  <a
                    href={getWhatsAppNewsInquiryLink(news)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-slate-800 hover:border-emerald-500/50 transition"
                    title="WhatsApp Ar. S. Gouse regarding this material bulletin"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
