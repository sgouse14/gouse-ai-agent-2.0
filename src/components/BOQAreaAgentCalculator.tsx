import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Sparkles,
  Bot,
  Building,
  Layers,
  Calculator,
  Check,
  Zap,
  TrendingUp,
  HardHat,
  Volume2,
  VolumeX,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Sliders,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Info,
  Scale,
  MapPin,
  Image as ImageIcon,
  Upload,
  X,
  Eye,
  CheckCircle2,
  Grid,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { BOQItem, BuildingFloor, Project } from '../types';
import { formatCurrency, CurrencyCode } from '../utils/formatters';
import {
  calculateMaterialTakeoffFromArea,
  autoUpdateBOQItemsWithAreaAndMarketPrice,
  MATERIAL_TAKEOFF_NORMS,
} from '../utils/materialTakeoffEngine';
import { scaleFloorAreasToTotal } from '../utils/floorTakeoffEngine';
import {
  calculateLabourScheduleForArea,
  LABOUR_SCHEDULE_BENCHMARKS,
} from '../utils/labourRateEngine';
import {
  MarketRegion,
  MarketQualityTier,
  MARKET_REGIONS,
} from '../utils/marketPriceEngine';
import { getSNKStandardBOQItems } from '../data/snkQuotationFormat';
import {
  ARCHITECTURAL_BLUEPRINT_PRESETS,
  BlueprintPreset,
} from '../utils/sampleArchitecturalBlueprints';

export interface BOQAreaAgentCalculatorProps {
  currentAreaSqFt: number;
  items: BOQItem[];
  floors: BuildingFloor[];
  currency: CurrencyCode;
  activeProject: Project;
  activeRegion: MarketRegion;
  activeTier: MarketQualityTier;
  onApplyCalculatedBOQ: (updatedItems: BOQItem[], newAreaSqFt: number, reportSummary: string) => void;
  onReplaceWithGeneratedBOQ?: (generatedItems: BOQItem[], newAreaSqFt: number, reportSummary: string) => void;
  onClose?: () => void;
}

export type AgentLanguage = 'en' | 'hi' | 'kn';

interface TypologyPreset {
  id: string;
  name: string;
  nameHi: string;
  nameKn: string;
  defaultArea: number;
  typicalFloors: number;
  multiplier: number;
  icon: string;
  description: string;
}

const TYPOLOGY_PRESETS: TypologyPreset[] = [
  {
    id: 'residential_villa',
    name: 'Residential Villa (G+1)',
    nameHi: 'आवासीय विला (G+1)',
    nameKn: 'ವಸತಿ ವಿಲ್ಲಾ (G+1)',
    defaultArea: 2400,
    typicalFloors: 2,
    multiplier: 1.0,
    icon: 'Home',
    description: 'Independent 30x40 or 40x60 duplex villa with RCC frame & AAC block masonry.',
  },
  {
    id: 'apartment_stilt',
    name: 'Apartment (Stilt + 3)',
    nameHi: 'अपार्टमेंट (स्टिल्ट + 3)',
    nameKn: 'ಅಪಾರ್ಟ್ಮೆಂಟ್ (ಸ್ಟಿಲ್ಟ್ + 3)',
    defaultArea: 4800,
    typicalFloors: 4,
    multiplier: 1.05,
    icon: 'Building2',
    description: 'Multi-family residential complex with basement parking & lift core.',
  },
  {
    id: 'commercial_office',
    name: 'Commercial Office Space',
    nameHi: 'वाणिज्यिक कार्यालय',
    nameKn: 'ವಾಣಿಜ್ಯ ಕಚೇರಿ ಸ್ಥಳ',
    defaultArea: 3500,
    typicalFloors: 3,
    multiplier: 1.12,
    icon: 'Building',
    description: 'High ceiling open-span office floor with heavy electrical & HVAC conduits.',
  },
  {
    id: 'compact_home',
    name: 'Compact 2BHK Home (G-Only)',
    nameHi: 'कॉम्पैक्ट 2BHK (केवल भूतल)',
    nameKn: 'ಕಾಂಪ್ಯಾಕ್ಟ್ 2BHK ಮನೆ (ನೆಲಮಹಡಿ)',
    defaultArea: 1200,
    typicalFloors: 1,
    multiplier: 0.95,
    icon: 'Home',
    description: 'Affordable ground floor home on 30x40 site with load-bearing/RCC frame.',
  },
  {
    id: 'luxury_mansion',
    name: 'Luxury Mansion / Duplex (G+2)',
    nameHi: 'लक्जरी हवेली / डुप्लेक्स (G+2)',
    nameKn: 'ಐಷಾರಾಮಿ ಮಹಲು (G+2)',
    defaultArea: 6000,
    typicalFloors: 3,
    multiplier: 1.25,
    icon: 'Sparkles',
    description: 'High-end architectural residence with double-height foyer & premium finishes.',
  },
];

const QUICK_AREA_CHIPS = [
  { sqft: 800, label: '800 sq.ft', tag: '1 BHK' },
  { sqft: 1200, label: '1,200 sq.ft', tag: '30x40 G' },
  { sqft: 1500, label: '1,500 sq.ft', tag: '2 BHK' },
  { sqft: 2000, label: '2,000 sq.ft', tag: '3 BHK' },
  { sqft: 2400, label: '2,400 sq.ft', tag: 'G+1 Villa' },
  { sqft: 3000, label: '3,000 sq.ft', tag: '40x60 G+1' },
  { sqft: 4000, label: '4,000 sq.ft', tag: 'G+2 Villa' },
  { sqft: 5000, label: '5,000 sq.ft', tag: 'Apartment' },
  { sqft: 7500, label: '7,500 sq.ft', tag: 'Commercial' },
  { sqft: 10000, label: '10,000 sq.ft', tag: 'Large Complex' },
];

export const BOQAreaAgentCalculator: React.FC<BOQAreaAgentCalculatorProps> = ({
  currentAreaSqFt,
  items,
  floors,
  currency,
  activeProject,
  activeRegion,
  activeTier,
  onApplyCalculatedBOQ,
  onReplaceWithGeneratedBOQ,
  onClose,
}) => {
  // Provided target area in sq.ft
  const [targetArea, setTargetArea] = useState<number>(() => {
    return currentAreaSqFt && currentAreaSqFt > 0 ? currentAreaSqFt : 2400;
  });

  // Keep targetArea synced if prop changes externally
  useEffect(() => {
    if (currentAreaSqFt && currentAreaSqFt > 0) {
      setTargetArea(currentAreaSqFt);
    }
  }, [currentAreaSqFt]);

  // Selected Typology
  const [selectedTypology, setSelectedTypology] = useState<string>('residential_villa');

  // Selected Quality Tier
  const [tier, setTier] = useState<MarketQualityTier>(activeTier || 'Standard');

  // Selected Region
  const [region, setRegion] = useState<MarketRegion>(activeRegion || 'bangalore');

  // Multi-lingual Language State: en, hi, kn
  const [lang, setLang] = useState<AgentLanguage>('en');

  // Active sub-tab in calculation breakdown
  const [activeTab, setActiveTab] = useState<'materials' | 'labour' | 'floors' | 'prompt'>('materials');

  // Speech TTS state
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Custom AI prompt & multimodal input states
  const [customPrompt, setCustomPrompt] = useState('');
  const [isPromptLoading, setIsPromptLoading] = useState(false);
  const [agentFeedbackBanner, setAgentFeedbackBanner] = useState<string | null>(null);

  // Multimodal Image Attachment (Floor plan, Elevation, CAD drawing)
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedImageName, setAttachedImageName] = useState<string | null>(null);
  const [attachedImageSize, setAttachedImageSize] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Vision Analysis & Detection Feedback
  const [detectedArea, setDetectedArea] = useState<number | null>(null);
  const [detectedElements, setDetectedElements] = useState<string[]>([]);
  const [aiAnalysisSummary, setAiAnalysisSummary] = useState<string | null>(null);
  const [generatedItems, setGeneratedItems] = useState<BOQItem[] | null>(null);
  const [selectedVisionModel] = useState<'gemini-4-hydrogen'>('gemini-4-hydrogen');

  // Mode: Expanded vs Minimized
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-calculated Takeoff Report via empirical IS 456 materialTakeoffEngine
  const takeoffReport = useMemo(() => {
    const validArea = Math.max(100, Math.round(targetArea || 1000));
    return calculateMaterialTakeoffFromArea(validArea, region, tier, 'spot_market');
  }, [targetArea, region, tier]);

  // Auto-calculated Labour Schedule via IS 456 civil norms
  const labourSchedule = useMemo(() => {
    const validArea = Math.max(100, Math.round(targetArea || 1000));
    return calculateLabourScheduleForArea(validArea, 'avg');
  }, [targetArea]);

  // Key Quick Metrics
  const metrics = useMemo(() => {
    const validArea = Math.max(100, Math.round(targetArea || 1000));

    // Cement (0.42 bags / sq.ft)
    const cementBags = Math.round(validArea * 0.42);
    const cementCost = cementBags * (tier === 'Economy' ? 355 : tier === 'Luxury' ? 440 : 385);

    // Steel Rebar (3.85 kg / sq.ft -> MT)
    const steelKg = Math.round(validArea * 3.85);
    const steelMT = Math.round((steelKg / 1000) * 100) / 100;
    const steelCost = Math.round(steelKg * (tier === 'Economy' ? 62 : tier === 'Luxury' ? 72 : 65));

    // RMC / Concrete M25 (0.038 m³ / sq.ft)
    const concreteM3 = Math.round(validArea * 0.038 * 10) / 10;
    const concreteCost = Math.round(concreteM3 * (tier === 'Economy' ? 4600 : tier === 'Luxury' ? 5800 : 5200));

    // Blocks (1.25 blocks / sq.ft)
    const blocksCount = Math.round(validArea * 1.25);
    const blocksCost = Math.round(blocksCount * 60);

    // Tiles / Flooring (1.15 sq.ft / sq.ft)
    const tilesSqFt = Math.round(validArea * 1.15);
    const tilesCost = Math.round(tilesSqFt * (tier === 'Economy' ? 55 : tier === 'Luxury' ? 180 : 85));

    // River / M-Sand (1.95 cft / sq.ft)
    const sandCft = Math.round(validArea * 1.95);
    const sandCost = Math.round(sandCft * 52);

    // Aggregates 20mm (1.60 cft / sq.ft)
    const aggregateCft = Math.round(validArea * 1.60);
    const aggregateCost = Math.round(aggregateCft * 42);

    // Estimated Base Cost
    const baseEstimatedCost = takeoffReport.totalMaterialCost;
    const estimatedLabourCost = labourSchedule.totalAvg;
    const contingencyReserve = Math.round((baseEstimatedCost + estimatedLabourCost) * 0.08);
    const grandEstimatedCost = baseEstimatedCost + contingencyReserve;
    const costPerSqFt = Math.round(grandEstimatedCost / validArea);

    return {
      validArea,
      cementBags,
      cementCost,
      steelKg,
      steelMT,
      steelCost,
      concreteM3,
      concreteCost,
      blocksCount,
      blocksCost,
      tilesSqFt,
      tilesCost,
      sandCft,
      sandCost,
      aggregateCft,
      aggregateCost,
      baseEstimatedCost,
      estimatedLabourCost,
      contingencyReserve,
      grandEstimatedCost,
      costPerSqFt,
    };
  }, [targetArea, tier, takeoffReport, labourSchedule]);

  // Multilingual Explanations from the Agent
  const agentSpeech = useMemo(() => {
    const area = targetArea.toLocaleString();
    const cost = formatCurrency(metrics.grandEstimatedCost, currency);
    const rate = `₹${metrics.costPerSqFt}/sq.ft`;

    if (lang === 'hi') {
      return {
        title: 'गौस एआई एजेंट: क्षेत्रफल आधारित स्वचालित गणना',
        summary: `नमस्ते! मैंने ${area} वर्ग फुट के लिए सिविल इंजीनियरिंग आईएस 456 मानकों के तहत मात्राओं की स्वचालित गणना की है। कुल अनुमानित लागत ${cost} (${rate}) है। इसमें ${metrics.cementBags.toLocaleString()} बोरी सीमेंट, ${metrics.steelMT} मीट्रिक टन टीएमटी स्टील, और ${metrics.concreteM3} घन मीटर कंक्रीट शामिल है।`,
        materialsBadge: 'आईएस 456 मानक',
        labourBadge: 'सीपीडब्ल्यूडी दरें',
      };
    }

    if (lang === 'kn') {
      return {
        title: 'ಗೌಸ್ ಎಐ ಏಜೆಂಟ್: ವಿಸ್ತೀರ್ಣ ಆಧಾರಿತ ಸ್ವಯಂಚಾಲಿತ ಲೆಕ್ಕಾಚಾರ',
        summary: `ನಮಸ್ಕಾರ! ನಾನು ${area} ಚದರ ಅಡಿಗೆ IS 456 ಸಿವಿಲ್ ಎಂಜಿನಿಯರಿಂಗ್ ಮಾನದಂಡಗಳ ಪ್ರಕಾರ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಪ್ರಮಾಣಗಳನ್ನು ಲೆಕ್ಕಹಾಕಿದ್ದೇನೆ. ಅಂದಾಜು ಒಟ್ಟು ವೆಚ್ಚ ${cost} (${rate}) ಆಗಿದೆ. ಇದರಲ್ಲಿ ${metrics.cementBags.toLocaleString()} ಚೀಲ ಸಿಮೆಂಟ್, ${metrics.steelMT} ಮೆಟ್ರಿಕ್ ಟನ್ ಟಿಎಂಟಿ ಉಕ್ಕು, ಮತ್ತು ${metrics.concreteM3} ಘನ ಮೀಟರ್ ಕಾಂಕ್ರೀಟ್ ಸೇರಿದೆ.`,
        materialsBadge: 'IS 456 ಮಾನದಂಡ',
        labourBadge: 'CPWD ದರಗಳು',
      };
    }

    // English (default)
    return {
      title: 'Gouse AI Agent: Auto-Calculate BOQ by Provided Area',
      summary: `I have auto-calculated construction quantities for ${area} sq.ft under IS 456 & CPWD engineering benchmarks. Estimated project outlay is ${cost} (${rate}), requiring ${metrics.cementBags.toLocaleString()} cement bags, ${metrics.steelMT} MT TMT rebar, and ${metrics.concreteM3} m³ concrete with complete trade labour schedule.`,
      materialsBadge: 'IS 456 Empirical Norms',
      labourBadge: 'CPWD Trade Benchmarks',
    };
  }, [lang, targetArea, metrics, currency]);

  // Speech TTS Handler
  const handleToggleVoice = () => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } else {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(agentSpeech.summary);
        utterance.lang = lang === 'hi' ? 'hi-IN' : lang === 'kn' ? 'kn-IN' : 'en-IN';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        setIsSpeaking(true);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  // 1-Click: Apply Auto-Calculated BOQ to existing schedule
  const handleApplyToSchedule = () => {
    const validArea = Math.max(100, Math.round(targetArea || 1000));
    const prevArea = currentAreaSqFt > 0 ? currentAreaSqFt : 2400;

    const { updatedItems, report } = autoUpdateBOQItemsWithAreaAndMarketPrice(
      items,
      validArea,
      prevArea,
      {
        regionId: region,
        tier: tier,
        pricingBasis: 'spot_market',
        updateQuantitiesWithArea: true,
        updateRatesWithMarketPrice: true,
        floors: floors,
      }
    );

    const summaryText = `Gouse AI Agent auto-calculated ${report.quantitiesUpdatedCount} BOQ items for ${validArea.toLocaleString()} sq.ft at ${formatCurrency(report.updatedSubtotal, currency)} (${formatCurrency(Math.round(report.updatedSubtotal / validArea), currency)}/sq.ft).`;
    setAgentFeedbackBanner(summaryText);
    onApplyCalculatedBOQ(updatedItems, validArea, summaryText);
  };

  // Generate complete fresh engineering BOQ from area
  const handleGenerateFreshBOQ = () => {
    const validArea = Math.max(100, Math.round(targetArea || 1000));
    const baselineItems = getSNKStandardBOQItems();
    const { updatedItems: standardItems } = autoUpdateBOQItemsWithAreaAndMarketPrice(
      baselineItems,
      validArea,
      3000,
      {
        regionId: region,
        tier: tier,
        pricingBasis: 'spot_market',
        updateQuantitiesWithArea: true,
        updateRatesWithMarketPrice: true,
      }
    );

    const summaryText = `Gouse AI Agent generated a complete engineering BOQ (${standardItems.length} line items) calibrated for ${validArea.toLocaleString()} sq.ft (${tier} Tier).`;
    setAgentFeedbackBanner(summaryText);

    if (onReplaceWithGeneratedBOQ) {
      onReplaceWithGeneratedBOQ(standardItems, validArea, summaryText);
    } else {
      onApplyCalculatedBOQ(standardItems, validArea, summaryText);
    }
  };

  // Image Upload handler
  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setAttachedImage(result);
      setAttachedImageName(file.name);
      setAttachedImageSize(`${Math.round(file.size / 1024)} KB`);
      // Reset previous detection state so user can run fresh analysis
      setDetectedArea(null);
      setDetectedElements([]);
      setAiAnalysisSummary(null);
      setGeneratedItems(null);
      // Auto open prompt tab
      setActiveTab('prompt');
    };
    reader.readAsDataURL(file);
  };

  // Preset Blueprint selection handler
  const handleSelectPreset = (preset: BlueprintPreset) => {
    setAttachedImage(preset.getDataUri());
    setAttachedImageName(preset.title);
    setAttachedImageSize('SVG Vector');
    setDetectedArea(preset.defaultArea);
    setDetectedElements(preset.detectedElements);
    setTargetArea(preset.defaultArea);
    setAiAnalysisSummary(`Architectural blueprint loaded: ${preset.title}. Dimensions: ${preset.dimensions}. Detected ${preset.detectedElements.length} key structural zones.`);
    setActiveTab('prompt');
    setCustomPrompt(`Analyze this blueprint (${preset.title}), detect room sizes and column layout, and calculate complete civil BOQ for ${preset.defaultArea.toLocaleString()} sq.ft.`);
  };

  // Clear attached image
  const handleClearImage = () => {
    setAttachedImage(null);
    setAttachedImageName(null);
    setAttachedImageSize(null);
    setDetectedArea(null);
    setDetectedElements([]);
    setAiAnalysisSummary(null);
    setGeneratedItems(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Adopt detected area from drawing into current targetArea
  const handleAdoptDetectedArea = (newArea: number) => {
    setTargetArea(newArea);
    const summary = `Adopted drawing area: ${newArea.toLocaleString()} sq.ft. All IS 456 materials, steel tonnage, and labour schedules auto-recalculated.`;
    setAgentFeedbackBanner(summary);
  };

  // AI Multimodal Prompt (Image + Text) via Gemini API
  const handleCustomPromptSubmit = async () => {
    const promptText =
      customPrompt.trim() ||
      (attachedImageName
        ? `Analyze attached architectural drawing "${attachedImageName}". Detect built-up area and structural grid (columns, walls, rooms) and calculate complete preliminary BOQ quantities for structural concrete, steel, AAC masonry, and finishes.`
        : `Auto-calculate preliminary engineering BOQ for ${targetArea.toLocaleString()} sq.ft under IS 456 civil benchmarks.`);

    setIsPromptLoading(true);

    try {
      const res = await fetch('/api/boq/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: promptText,
          projectType: activeProject.projectType || selectedTypology,
          builtUpAreaSqFt: targetArea,
          qualityTier: tier,
          model: selectedVisionModel,
          image: attachedImage || undefined,
          mimeType: attachedImage?.startsWith('data:image/svg')
            ? 'image/svg+xml'
            : attachedImage?.startsWith('data:image/png')
            ? 'image/png'
            : 'image/jpeg',
        }),
      });

      if (!res.ok) throw new Error('API fallback');
      const data = await res.json();

      if (data.detected_area_sqft && typeof data.detected_area_sqft === 'number' && data.detected_area_sqft > 0) {
        setDetectedArea(data.detected_area_sqft);
      }
      if (data.detected_elements && Array.isArray(data.detected_elements)) {
        setDetectedElements(data.detected_elements);
      }
      if (data.project_summary) {
        setAiAnalysisSummary(data.project_summary);
      }

      if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        const formattedItems: BOQItem[] = data.items.map((it: any, idx: number) => ({
          id: `ai-item-${Date.now()}-${idx}`,
          name: it.name,
          category: it.category || 'Concrete Works',
          unit: it.unit || 'm3',
          quantity: Number(it.quantity) || 10,
          rate: Number(it.rate) || 500,
          notes: it.notes || `AI Agent tailored for ${targetArea} sq.ft`,
        }));

        setGeneratedItems(formattedItems);

        const summaryText = `AI Agent analyzed ${attachedImageName ? `drawing "${attachedImageName}" + ` : ''}prompt and calculated ${formattedItems.length} BOQ items calibrated for ${(data.detected_area_sqft || targetArea).toLocaleString()} sq.ft.`;
        setAgentFeedbackBanner(summaryText);
      } else {
        handleApplyToSchedule();
      }
    } catch (_err) {
      // Fallback: apply deterministic auto-calculation
      handleApplyToSchedule();
    } finally {
      setIsPromptLoading(false);
    }
  };

  // Apply generated items to the project schedule
  const handleApplyGeneratedItems = () => {
    if (!generatedItems || generatedItems.length === 0) return;
    const finalArea = detectedArea || targetArea;
    const summaryText = `Applied ${generatedItems.length} AI-generated items for ${finalArea.toLocaleString()} sq.ft to project schedule.`;
    setAgentFeedbackBanner(summaryText);
    if (onReplaceWithGeneratedBOQ) {
      onReplaceWithGeneratedBOQ(generatedItems, finalArea, summaryText);
    } else {
      onApplyCalculatedBOQ(generatedItems, finalArea, summaryText);
    }
  };

  return (
    <div
      id="boq-area-agent-calculator"
      className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden transition-all duration-300"
    >
      {/* 1. AGENT IDENTITY & HEADER */}
      <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Bot className="w-5 h-5" />
          </div>

          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>{agentSpeech.title}</span>
            </h3>
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mt-0.5">
              <span className="text-amber-400">AI Auto-Calculator</span>
              <span>·</span>
              <span className="text-emerald-400">IS 456 Engine</span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">
              Provide target square footage to auto-calculate civil materials, steel tonnage, concrete, and trade labour.
            </p>
          </div>
        </div>

        {/* Header Actions: Language Switcher, TTS voice, Collapse/Expand */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Multilingual Pills */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-2 py-0.5 rounded font-bold transition ${
                lang === 'en' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('hi')}
              className={`px-2 py-0.5 rounded font-bold transition ${
                lang === 'hi' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              हिंदी
            </button>
            <button
              type="button"
              onClick={() => setLang('kn')}
              className={`px-2 py-0.5 rounded font-bold transition ${
                lang === 'kn' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              ಕನ್ನಡ
            </button>
          </div>

          {/* Voice Speech Listen Button */}
          <button
            type="button"
            onClick={handleToggleVoice}
            className={`p-1.5 rounded-lg border text-xs font-mono transition flex items-center gap-1 ${
              isSpeaking
                ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="Read auto-calculation summary aloud"
          >
            {isSpeaking ? <Volume2 className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            <span className="hidden sm:inline text-[11px] font-semibold">{isSpeaking ? 'Listening...' : 'Listen'}</span>
          </button>

          {/* Minimize / Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white transition"
            title={isCollapsed ? 'Expand Agent Calculator' : 'Collapse Agent Calculator'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white transition"
              title="Close Agent"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 2. AGENT SPEECH BUBBLE & NOTIFICATION BANNER */}
      <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-slate-200 font-sans leading-relaxed">{agentSpeech.summary}</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="text-emerald-400 font-semibold">{agentSpeech.materialsBadge}</span>
          <span className="text-slate-600">•</span>
          <span className="text-amber-400 font-semibold">{agentSpeech.labourBadge}</span>
        </div>
      </div>

      {agentFeedbackBanner && (
        <div className="px-4 py-2 bg-emerald-500/15 border-b border-emerald-500/30 flex items-center justify-between text-xs font-mono text-emerald-300">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{agentFeedbackBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setAgentFeedbackBanner(null)}
            className="text-slate-400 hover:text-white underline text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {!isCollapsed && (
        <div className="p-4 space-y-4">
          {/* 3. PROVIDED AREA CONTROLLER BAR */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 shadow-inner space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider font-mono mb-1">
                  1. Enter Provided Built-Up Area (Sq.Ft)
                </label>
                <p className="text-[11px] text-slate-400">
                  Type any custom area or use slider to instantly recalculate all quantities in real-time.
                </p>
              </div>

              {/* Area Input with Unit Conversion */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="number"
                    min={100}
                    max={50000}
                    step={50}
                    id="input-agent-target-area"
                    value={targetArea || ''}
                    onChange={(e) => setTargetArea(Math.max(0, Number(e.target.value) || 0))}
                    placeholder="e.g. 2400"
                    className="w-36 bg-slate-900 border-2 border-amber-500 rounded-xl px-3 py-2 text-right font-mono text-lg font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                  <span className="absolute left-2.5 top-2.5 text-xs text-amber-400/80 font-mono font-bold">
                    SQ.FT
                  </span>
                </div>

                <div className="text-right font-mono text-xs text-slate-400 bg-slate-900/80 px-2.5 py-2 rounded-xl border border-slate-800">
                  <div className="text-slate-200 font-bold">≈ {Math.round(targetArea / 10.764).toLocaleString()} m²</div>
                  <div className="text-[10px] text-slate-500">Plinth Footprint</div>
                </div>
              </div>
            </div>

            {/* Area Slider Control */}
            <div className="space-y-1 pt-1">
              <input
                type="range"
                min={500}
                max={10000}
                step={50}
                value={Math.min(10000, Math.max(500, targetArea))}
                onChange={(e) => setTargetArea(Number(e.target.value))}
                className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>500 sq.ft (Studio)</span>
                <span>2,400 sq.ft (Villa)</span>
                <span>5,000 sq.ft (Apartment)</span>
                <span>10,000 sq.ft (Commercial)</span>
              </div>
            </div>

            {/* Quick Area Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                Quick Chips:
              </span>
              {QUICK_AREA_CHIPS.map((chip) => {
                const isSelected = targetArea === chip.sqft;
                return (
                  <button
                    key={chip.sqft}
                    type="button"
                    onClick={() => setTargetArea(chip.sqft)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition border flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md shadow-amber-500/20'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <span>{chip.label}</span>
                    <span className={`text-[9px] px-1 rounded ${isSelected ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-400'}`}>
                      {chip.tag}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Multimodal Quick Bridge */}
            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-slate-300">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>Have a floor plan or blueprint? Agent can auto-detect area and calculate BOQ:</span>
              </div>
              <button
                type="button"
                id="btn-shortcut-multimodal-prompt"
                onClick={() => setActiveTab('prompt')}
                className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-500/10 border border-amber-500/40 text-amber-300 hover:text-white hover:border-amber-400 font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{attachedImageName ? `Drawing Active: ${attachedImageName}` : 'Prompt with Image + Text'}</span>
              </button>
            </div>
          </div>

          {/* 4. CONFIGURATION SELECTORS (Typology, Tier, Region) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Typology */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <label className="block text-xs font-medium text-slate-400 mb-1 font-mono">
                Building Typology
              </label>
              <select
                id="select-agent-typology"
                value={selectedTypology}
                onChange={(e) => {
                  setSelectedTypology(e.target.value);
                  const preset = TYPOLOGY_PRESETS.find((p) => p.id === e.target.value);
                  if (preset && (!targetArea || targetArea === 2400)) {
                    setTargetArea(preset.defaultArea);
                  }
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {TYPOLOGY_PRESETS.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900">
                    {lang === 'hi' ? p.nameHi : lang === 'kn' ? p.nameKn : p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quality Tier */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <label className="block text-xs font-medium text-slate-400 mb-1 font-mono">
                Specification Tier
              </label>
              <select
                id="select-agent-tier"
                value={tier}
                onChange={(e) => setTier(e.target.value as MarketQualityTier)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Economy" className="bg-slate-900">Economy (₹1,400 - ₹1,750 / sq.ft)</option>
                <option value="Standard" className="bg-slate-900">Standard (₹1,850 - ₹2,450 / sq.ft)</option>
                <option value="Premium" className="bg-slate-900">Premium (₹2,500 - ₹3,600 / sq.ft)</option>
                <option value="Luxury" className="bg-slate-900">Luxury (₹3,800 - ₹5,500+ / sq.ft)</option>
              </select>
            </div>

            {/* Pricing Hub */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <label className="block text-xs font-medium text-slate-400 mb-1 font-mono flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-400" />
                <span>Geographical Pricing Hub</span>
              </label>
              <select
                id="select-agent-region"
                value={region}
                onChange={(e) => setRegion(e.target.value as MarketRegion)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-500"
              >
                {MARKET_REGIONS.map((r) => (
                  <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 5. AUTO-CALCULATED KEY METRICS CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {/* Grand Total Cost */}
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-slate-900 border border-amber-500/40">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 block">
                Estimated Project Cost
              </span>
              <div className="text-lg font-bold font-mono text-white mt-0.5">
                {formatCurrency(metrics.grandEstimatedCost, currency)}
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                ≈ ₹{metrics.costPerSqFt}/sq.ft
              </span>
            </div>

            {/* Cement Bags */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                Cement Bags
              </span>
              <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
                {metrics.cementBags.toLocaleString()} <span className="text-xs text-slate-400 font-normal">bags</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                0.42 bags/sq.ft (₹{Math.round(metrics.cementCost / 1000)}k)
              </span>
            </div>

            {/* Steel Rebar */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                TMT Steel (Fe550D)
              </span>
              <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
                {metrics.steelMT} <span className="text-xs text-slate-400 font-normal">MT</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                3.85 kg/sq.ft (₹{Math.round(metrics.steelCost / 1000)}k)
              </span>
            </div>

            {/* Concrete M25 */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                RMC Concrete M25
              </span>
              <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
                {metrics.concreteM3} <span className="text-xs text-slate-400 font-normal">m³</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                0.038 m³/sq.ft (₹{Math.round(metrics.concreteCost / 1000)}k)
              </span>
            </div>

            {/* Masonry Blocks */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                Masonry Blocks
              </span>
              <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
                {metrics.blocksCount.toLocaleString()} <span className="text-xs text-slate-400 font-normal">nos</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                1.25 blocks/sq.ft (₹{Math.round(metrics.blocksCost / 1000)}k)
              </span>
            </div>

            {/* Total Labour Estimate */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block flex items-center gap-1">
                <HardHat className="w-3 h-3 text-amber-400" />
                <span>Trade Labour</span>
              </span>
              <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                {formatCurrency(metrics.estimatedLabourCost, currency)}
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                ≈ ₹{labourSchedule.ratePerSqFtAvg}/sq.ft (34%)
              </span>
            </div>
          </div>

          {/* 6. BREAKDOWN TABS & DETAILED TABLES */}
          <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-3 py-2 flex-wrap gap-2">
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setActiveTab('materials')}
                  className={`px-3 py-1 rounded transition ${
                    activeTab === 'materials' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Materials Takeoff ({takeoffReport.items.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('labour')}
                  className={`px-3 py-1 rounded transition ${
                    activeTab === 'labour' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Labour Schedule ({labourSchedule.trades.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('floors')}
                  className={`px-3 py-1 rounded transition ${
                    activeTab === 'floors' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Floor Levels ({floors.length})
                </button>
                <button
                  type="button"
                  id="tab-btn-agent-multimodal"
                  onClick={() => setActiveTab('prompt')}
                  className={`px-3 py-1 rounded transition flex items-center gap-1.5 ${
                    activeTab === 'prompt' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Multimodal Vision & Prompt</span>
                  {attachedImage && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Drawing attached" />
                  )}
                </button>
              </div>

              <div className="text-[11px] font-mono text-slate-400">
                Calibrated for: <strong className="text-white">{metrics.validArea.toLocaleString()} sq.ft</strong>
              </div>
            </div>

            {/* TAB 1: MATERIALS TAKEOFF TABLE */}
            {activeTab === 'materials' && (
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-slate-900/80 font-mono text-[10px] text-slate-400 uppercase sticky top-0">
                    <tr className="border-b border-slate-800">
                      <th className="py-2 px-3">Material Norm Item</th>
                      <th className="py-2 px-3">Consumption Norm</th>
                      <th className="py-2 px-3 text-right">Auto Quantity</th>
                      <th className="py-2 px-3 text-right">Market Rate</th>
                      <th className="py-2 px-3 text-right">Estimated Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                    {takeoffReport.items.slice(0, 10).map((it) => (
                      <tr key={it.norm.id} className="hover:bg-slate-900/50">
                        <td className="py-2 px-3 font-sans font-medium text-slate-200">
                          <div>{it.norm.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{it.norm.category}</div>
                        </td>
                        <td className="py-2 px-3 text-slate-400 text-[11px]">
                          {it.norm.normPerSqFt} {it.norm.unit}/sq.ft
                        </td>
                        <td className="py-2 px-3 text-right text-amber-300 font-bold">
                          {it.quantityWithWastage.toLocaleString()} {it.norm.unit}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-300">
                          ₹{it.marketRate.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right text-white font-bold">
                          {formatCurrency(it.totalCost, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: LABOUR SCHEDULE TABLE */}
            {activeTab === 'labour' && (
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-slate-900/80 font-mono text-[10px] text-slate-400 uppercase sticky top-0">
                    <tr className="border-b border-slate-800">
                      <th className="py-2 px-3">Labour Trade</th>
                      <th className="py-2 px-3">CPWD Norm / Unit</th>
                      <th className="py-2 px-3 text-right">Benchmark Rate</th>
                      <th className="py-2 px-3 text-right">Scaled Cost ({metrics.validArea} sq.ft)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                    {labourSchedule.trades.map((t) => (
                      <tr key={t.benchmark.id} className="hover:bg-slate-900/50">
                        <td className="py-2 px-3 font-sans font-medium text-slate-200">
                          <div className="flex items-center gap-1.5">
                            <HardHat className="w-3.5 h-3.5 text-amber-400" />
                            <span>{t.benchmark.trade}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-slate-400 text-[11px]">
                          {t.benchmark.unit}
                        </td>
                        <td className="py-2 px-3 text-right text-amber-300 font-bold">
                          {t.benchmark.rateDisplay}
                        </td>
                        <td className="py-2 px-3 text-right text-white font-bold">
                          {formatCurrency(t.scaledCost, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 3: FLOOR LEVELS TABLE */}
            {activeTab === 'floors' && (
              <div className="max-h-60 overflow-y-auto p-3 space-y-2">
                <p className="text-xs text-slate-400 font-sans">
                  Area automatically distributed across project levels:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 font-mono text-xs">
                  {floors.map((fl) => {
                    const floorAreaScaled = Math.round(metrics.validArea * (fl.areaSqFt / (currentAreaSqFt || 2400)));
                    return (
                      <div key={fl.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                        <div className="text-amber-400 font-bold text-xs">{fl.name}</div>
                        <div className="text-white text-sm font-bold">{floorAreaScaled.toLocaleString()} sq.ft</div>
                        <div className="text-[10px] text-slate-400">
                          {Math.round((fl.areaSqFt / (currentAreaSqFt || 2400)) * 100)}% of building slab
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: AI MULTIMODAL PROMPT & DRAWING ANALYSIS */}
            {activeTab === 'prompt' && (
              <div className="p-4 space-y-4 font-sans bg-slate-950/70 border-t border-slate-800">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Multimodal BOQ Takeoff Agent (Drawing + Text Prompt)</span>
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Provide both an architectural plan image (floor plan, CAD drawing, or elevation) and specification text. The Gouse AI Agent analyzes drawing geometry, detects the built-up area and structural grid, and auto-calculates full engineering BOQ items.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] font-mono text-cyan-300">
                    Gemini 4 Hydrogen Vision
                  </div>
                </div>

                {/* Preset Blueprint Selectors for 1-Click Testing */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <Grid className="w-3.5 h-3.5 text-amber-400" />
                      <span>1-Click Sample Blueprints (Instant Test):</span>
                    </span>
                    <span className="text-[10px] text-slate-500">Auto-loads vector drawing &amp; structural layout</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {ARCHITECTURAL_BLUEPRINT_PRESETS.map((preset) => {
                      const isSelected = attachedImageName === preset.title;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className={`p-2.5 rounded-lg text-left transition border flex flex-col justify-between gap-1 text-xs ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-md shadow-amber-500/10'
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white font-mono text-xs">
                              {lang === 'hi' ? preset.titleHi : lang === 'kn' ? preset.titleKn : preset.title}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {preset.dimensions} • {preset.defaultArea.toLocaleString()} sq.ft
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Multimodal Input: Image Attachment + Specification Prompt */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                  {/* Left: Image Attachment Dropzone / Preview (5 cols) */}
                  <div className="lg:col-span-5 flex flex-col">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleImageUpload(e.target.files[0]);
                      }}
                    />

                    {!attachedImage ? (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragging(false);
                          if (e.dataTransfer.files?.[0]) handleImageUpload(e.dataTransfer.files[0]);
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex-1 min-h-[140px] rounded-xl border-2 border-dashed p-4 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                          isDragging
                            ? 'border-amber-400 bg-amber-500/10'
                            : 'border-slate-700 hover:border-amber-500/60 bg-slate-900/60 hover:bg-slate-900'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400 mb-2 shadow-inner">
                          <Upload className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-semibold text-slate-200">
                          Drop Architectural Drawing / Floor Plan
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          or click to browse from device (PNG, JPG, WEBP, SVG)
                        </p>
                        <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                          <ImageIcon className="w-3 h-3" />
                          <span>Multimodal Image Input</span>
                        </span>
                      </div>
                    ) : (
                      <div className="flex-1 rounded-xl bg-slate-900/90 border border-amber-500/40 p-3 flex flex-col justify-between gap-3 shadow-md">
                        <div className="flex items-start gap-3">
                          <div className="relative group shrink-0">
                            <img
                              src={attachedImage}
                              alt={attachedImageName || 'Drawing'}
                              className="w-20 h-20 object-cover rounded-lg border border-amber-500/40 bg-slate-950"
                            />
                            <button
                              type="button"
                              onClick={() => setPreviewModalOpen(true)}
                              className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white"
                              title="Enlarge drawing"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Drawing Attached</span>
                              </span>
                              <button
                                type="button"
                                onClick={handleClearImage}
                                className="text-slate-400 hover:text-rose-400 p-0.5 transition"
                                title="Remove image"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-xs font-bold text-white truncate" title={attachedImageName || 'Drawing'}>
                              {attachedImageName || 'Architectural Floor Plan'}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                              <span>{attachedImageSize || 'Vector'}</span>
                              <span>•</span>
                              <button
                                type="button"
                                onClick={() => setPreviewModalOpen(true)}
                                className="text-amber-400 hover:underline flex items-center gap-0.5"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Inspect</span>
                              </button>
                              <span>•</span>
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="text-slate-300 hover:underline"
                              >
                                Change
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 flex items-center justify-between">
                          <span>Multimodal Vision Ready</span>
                          <span>Reconciling with {targetArea.toLocaleString()} sq.ft</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Text Prompt Box (7 cols) */}
                  <div className="lg:col-span-7 flex flex-col justify-between space-y-2">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <label className="text-[11px] font-bold text-slate-300 font-mono flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-amber-400" />
                          <span>Specification &amp; Engineering Text Prompt:</span>
                        </label>
                        <span className="text-[10px] font-mono text-slate-500">
                          Target: {targetArea.toLocaleString()} sq.ft
                        </span>
                      </div>

                      <textarea
                        rows={3}
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="e.g., Analyze this floor plan: detect room sizes, column grid, wall thickness, and calculate complete BOQ items for structural concrete, steel, AAC masonry, and finishes for the detected area..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-sans resize-none"
                      />

                      {/* Quick Prompt Suggestions */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono text-slate-500">Prompts:</span>
                        {[
                          'Auto-detect area & full BOQ',
                          'RCC frame M25 + AAC blocks',
                          'Luxury finishes & Italian marble',
                          'Commercial open-span + MEP conduits',
                        ].map((promptChip) => (
                          <button
                            key={promptChip}
                            type="button"
                            onClick={() => setCustomPrompt(promptChip)}
                            className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition"
                          >
                            + {promptChip}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Action Run Button */}
                    <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                      <div className="text-[10px] font-mono text-slate-400">
                        {attachedImage
                          ? '📸 Multimodal Input: Drawing Image + Text Active'
                          : '💬 Text Prompt Active (Attach drawing for vision takeoff)'}
                      </div>

                      <button
                        type="button"
                        id="btn-agent-multimodal-calc"
                        onClick={handleCustomPromptSubmit}
                        disabled={isPromptLoading}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs transition shadow-md shadow-amber-500/20 flex items-center gap-2 disabled:opacity-50"
                      >
                        <Sparkles className={`w-4 h-4 text-slate-950 ${isPromptLoading ? 'animate-spin' : ''}`} />
                        <span>{isPromptLoading ? 'Agent Analyzing Drawing...' : 'Auto-Calculate from Drawing & Text'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Multimodal Analysis Feedback / Loading State */}
                {isPromptLoading && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-300 font-mono animate-pulse">
                    <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-amber-400" />
                    <div className="space-y-0.5">
                      <div className="font-bold">Multimodal Vision Engine Active...</div>
                      <div className="text-[11px] text-slate-300 font-sans">
                        Inspecting drawing dimensions, detecting column layout, and calculating engineering BOQ under IS 456...
                      </div>
                    </div>
                  </div>
                )}

                {/* Multimodal Results Display: Detected Area & Elements */}
                {(detectedArea || detectedElements.length > 0 || aiAnalysisSummary || generatedItems) && !isPromptLoading && (
                  <div className="p-3.5 rounded-xl bg-slate-900 border-2 border-emerald-500/40 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-white text-xs font-mono">
                          Agent Multimodal Analysis &amp; Detection Results
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                        Calculated
                      </span>
                    </div>

                    {/* Detected Area Callout */}
                    {detectedArea && (
                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between flex-wrap gap-2">
                        <div className="space-y-0.5">
                          <div className="text-[11px] font-mono text-emerald-300 font-semibold flex items-center gap-1.5">
                            <Scale className="w-3.5 h-3.5" />
                            <span>Detected Built-Up Area from Drawing:</span>
                          </div>
                          <div className="text-base font-bold font-mono text-white">
                            {detectedArea.toLocaleString()} sq.ft{' '}
                            <span className="text-xs text-slate-400 font-normal">
                              (≈ {Math.round(detectedArea / 10.764).toLocaleString()} m²)
                            </span>
                          </div>
                        </div>

                        {detectedArea !== targetArea ? (
                          <button
                            type="button"
                            onClick={() => handleAdoptDetectedArea(detectedArea)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-md shadow-emerald-500/20"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Adopt Detected Area ({detectedArea.toLocaleString()} sq.ft)</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>Active Target Area Synced</span>
                          </span>
                        )}
                      </div>
                    )}

                    {/* Detected Structural Elements */}
                    {detectedElements.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-mono text-slate-400">
                          Detected Structural Elements &amp; Architectural Zones:
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {detectedElements.map((el, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 rounded-md text-[11px] font-mono bg-slate-950 text-slate-200 border border-slate-700 flex items-center gap-1"
                            >
                              <Layers className="w-3 h-3 text-amber-400" />
                              <span>{el}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Project Summary Synopsis */}
                    {aiAnalysisSummary && (
                      <div className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800 leading-relaxed font-sans">
                        <strong className="text-amber-400 font-mono text-[11px] block mb-1">
                          Agent Takeoff Synopsis:
                        </strong>
                        {aiAnalysisSummary}
                      </div>
                    )}

                    {/* Generated Items Preview Table */}
                    {generatedItems && generatedItems.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono text-slate-300 font-bold">
                            Generated BOQ Line Items ({generatedItems.length} items):
                          </span>
                          <button
                            type="button"
                            onClick={handleApplyGeneratedItems}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Apply {generatedItems.length} Items to Schedule</span>
                          </button>
                        </div>

                        <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-lg">
                          <table className="w-full text-left text-xs font-sans">
                            <thead className="bg-slate-950 font-mono text-[10px] text-slate-400 uppercase sticky top-0">
                              <tr className="border-b border-slate-800">
                                <th className="py-1.5 px-2.5">Item Name</th>
                                <th className="py-1.5 px-2.5">Category</th>
                                <th className="py-1.5 px-2.5 text-right">Quantity</th>
                                <th className="py-1.5 px-2.5 text-right">Rate</th>
                                <th className="py-1.5 px-2.5 text-right">Total Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                              {generatedItems.map((git, gidx) => (
                                <tr key={git.id || gidx} className="hover:bg-slate-950/40">
                                  <td className="py-1.5 px-2.5 font-sans font-medium text-slate-200">
                                    {git.name}
                                  </td>
                                  <td className="py-1.5 px-2.5 text-slate-400 text-[10px]">
                                    {git.category}
                                  </td>
                                  <td className="py-1.5 px-2.5 text-right text-amber-300 font-bold">
                                    {git.quantity.toLocaleString()} {git.unit}
                                  </td>
                                  <td className="py-1.5 px-2.5 text-right text-slate-300">
                                    ₹{git.rate.toLocaleString()}
                                  </td>
                                  <td className="py-1.5 px-2.5 text-right text-white font-bold">
                                    {formatCurrency(git.quantity * git.rate, currency)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 7. ACTION APPLICATION BUTTONS */}
          <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>
                Calculated for: <strong className="text-white">{metrics.validArea.toLocaleString()} sq.ft</strong> @ <strong className="text-emerald-400">₹{metrics.costPerSqFt}/sq.ft</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Option 1: Scale existing BOQ items */}
              <button
                type="button"
                id="btn-agent-apply-to-boq"
                onClick={handleApplyToSchedule}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md shadow-amber-500/20"
                title="Scale all current BOQ line item quantities to the provided area"
              >
                <Check className="w-4 h-4 text-slate-950" />
                <span>Apply Auto-Calculated Area ({metrics.validArea.toLocaleString()} sq.ft)</span>
              </button>

              {/* Option 2: Generate fresh standard engineering BOQ */}
              <button
                type="button"
                id="btn-agent-generate-fresh-boq"
                onClick={handleGenerateFreshBOQ}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-semibold transition"
                title="Populate complete standard engineering civil schedule calibrated to this area"
              >
                <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                <span>Generate Complete BOQ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. IMAGE ZOOM / INSPECTION MODAL */}
      {previewModalOpen && attachedImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/50 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-amber-400" />
                <h4 className="font-bold text-white text-sm">{attachedImageName || 'Architectural Blueprint'}</h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 flex items-center justify-center bg-slate-950">
              <img
                src={attachedImage}
                alt={attachedImageName || 'Blueprint'}
                className="max-h-[70vh] object-contain rounded-lg border border-slate-800 shadow-md"
              />
            </div>
            <div className="p-3 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Target Built-Up Area: {targetArea.toLocaleString()} sq.ft</span>
              <button
                type="button"
                onClick={() => {
                  setPreviewModalOpen(false);
                  handleCustomPromptSubmit();
                }}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition"
              >
                Run Agent Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
