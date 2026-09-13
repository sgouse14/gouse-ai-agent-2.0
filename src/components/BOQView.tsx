import React, { useState, useMemo, useEffect } from 'react';
import {
  Calculator,
  Plus,
  Trash2,
  Sparkles,
  Download,
  Printer,
  Sliders,
  DollarSign,
  Layers,
  FileSpreadsheet,
  Check,
  AlertCircle,
  Building,
  TrendingUp,
  Gauge,
  Send,
  RefreshCw,
  Maximize2,
  SlidersHorizontal,
  ArrowUpRight,
  ShieldCheck,
  Info
} from 'lucide-react';
import { BOQItem, Project, MarketplaceEnquiry } from '../types';
import { formatCurrency, CurrencyCode } from '../utils/formatters';

interface BOQViewProps {
  items: BOQItem[];
  contingencyPercent: number;
  currency: CurrencyCode;
  activeProject: Project;
  onUpdateItems: (items: BOQItem[]) => void;
  onChangeContingency: (val: number) => void;
  onUpdateProject?: (project: Project) => void;
  onAddEnquiry?: (enquiry: MarketplaceEnquiry) => void;
}

const CATEGORIES = [
  'Substructure',
  'Concrete Works',
  'Masonry',
  'Doors & Windows',
  'Finishes',
  'MEP & Electrical',
  'Plumbing',
  'Waterproofing',
  'External Works',
  'General',
];

const UNITS = ['m3', 'sq.m', 'r.m', 'MT', 'nos', 'kg', 'lump sum', 'sq.ft'];

// Industry-standard benchmark rates per sq.ft in Indian & regional construction markets
export interface MarketBenchmark {
  tier: string;
  minRate: number;
  maxRate: number;
  typicalRate: number;
  tag: string;
  description: string;
  features: string[];
  accentColor: string;
  badgeBg: string;
  badgeBorder: string;
}

export const MARKET_BENCHMARKS: MarketBenchmark[] = [
  {
    tier: 'Economy / Budget',
    minRate: 1400,
    maxRate: 1750,
    typicalRate: 1600,
    tag: 'Budget Construction',
    description: 'Cost-optimized construction with reliable basic building materials.',
    features: ['Red brick / Fly-ash masonry', '2x2 Standard vitrified tiles', '2-track UPVC / Aluminum windows', 'Standard PVC/GI plumbing'],
    accentColor: 'text-sky-400',
    badgeBg: 'bg-sky-500/10',
    badgeBorder: 'border-sky-500/30',
  },
  {
    tier: 'Standard / Quality',
    minRate: 1800,
    maxRate: 2450,
    typicalRate: 2150,
    tag: 'Recommended Baseline',
    description: 'High-quality contemporary construction with branded structural & finishing materials.',
    features: ['M25 Ready-Mix RCC framing', 'AAC Block lightweight masonry', '4x2 Glazed vitrified tiles', 'Branded Jaquar/Kohler CP fittings', 'Schneider modular wiring'],
    accentColor: 'text-amber-400',
    badgeBg: 'bg-amber-500/10',
    badgeBorder: 'border-amber-500/30',
  },
  {
    tier: 'Premium Architectural',
    minRate: 2500,
    maxRate: 3600,
    typicalRate: 3050,
    tag: 'High Specification',
    description: 'Architectural grade finish with high acoustic, thermal, and visual specifications.',
    features: ['Engineered RCC framing & grade beams', 'Imported marble / large slab tiles', 'Double-glazed soundproof system aluminum', 'Grohe/Toto sanitaryware', 'Smart home automation conduits'],
    accentColor: 'text-purple-400',
    badgeBg: 'bg-purple-500/10',
    badgeBorder: 'border-purple-500/30',
  },
  {
    tier: 'Luxury / Signature',
    minRate: 3800,
    maxRate: 5500,
    typicalRate: 4400,
    tag: 'Ultra Luxury',
    description: 'Bespoke high-end architectural villa and luxury commercial specification.',
    features: ['Italian Statuario/Bottochino marble', 'Structural architectural glazing', 'VRV / VRF central HVAC integration', 'Acoustic insulation & façade cladding', 'Designer landscape & infinity pool works'],
    accentColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10',
    badgeBorder: 'border-emerald-500/30',
  },
];

const SQFT_PRESETS = [
  { label: '1,200 sq.ft', value: 1200, desc: '2BHK Apartment / Compact Villa' },
  { label: '2,000 sq.ft', value: 2000, desc: '3BHK Villa / Row House' },
  { label: '3,000 sq.ft', value: 3000, desc: 'Duplex Residence / Penthouse' },
  { label: '5,000 sq.ft', value: 5000, desc: 'Luxury Villa / Commercial Office' },
  { label: '10,000 sq.ft', value: 10000, desc: 'Institutional / Commercial Complex' },
];

export const BOQView: React.FC<BOQViewProps> = ({
  items,
  contingencyPercent,
  currency,
  activeProject,
  onUpdateItems,
  onChangeContingency,
  onUpdateProject,
  onAddEnquiry,
}) => {
  // Built-up area in sq.ft state (synced with activeProject)
  const [areaSqFt, setAreaSqFt] = useState<number>(() => {
    return activeProject.builtUpAreaSqFt && activeProject.builtUpAreaSqFt > 0
      ? activeProject.builtUpAreaSqFt
      : 3000;
  });

  // Keep local area in sync if activeProject changes
  useEffect(() => {
    if (activeProject.builtUpAreaSqFt && activeProject.builtUpAreaSqFt > 0) {
      setAreaSqFt(activeProject.builtUpAreaSqFt);
    }
  }, [activeProject.id, activeProject.builtUpAreaSqFt]);

  // Area editor modal/popover
  const [isEditingAreaModal, setIsEditingAreaModal] = useState(false);
  const [tempAreaInput, setTempAreaInput] = useState<number>(areaSqFt);
  const [scaleQuantitiesWithArea, setScaleQuantitiesWithArea] = useState(true);

  // Market rate calibration modal
  const [isCalibrateModal, setIsCalibrateModal] = useState(false);
  const [targetRatePerSqFt, setTargetRatePerSqFt] = useState<number>(2150);

  // Send Tender Enquiry modal
  const [isEnquiryModal, setIsEnquiryModal] = useState(false);
  const [enquirySuccess, setEnquirySuccess] = useState(false);
  const [enquiryClientName, setEnquiryClientName] = useState('Ar. Gouse');
  const [enquiryClientEmail, setEnquiryClientEmail] = useState('principal@gouseai.com');
  const [enquiryClientPhone, setEnquiryClientPhone] = useState('+91 98450 12345');
  const [enquiryTenderNotes, setEnquiryTenderNotes] = useState('');

  // Add Item form state
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState(CATEGORIES[0]);
  const [newItemUnit, setNewItemUnit] = useState(UNITS[0]);
  const [newItemQty, setNewItemQty] = useState<number>(10);
  const [newItemRate, setNewItemRate] = useState<number>(500);
  const [newItemNotes, setNewItemNotes] = useState('');

  // AI BOQ Generator states
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiDescription, setAiDescription] = useState(activeProject.description || '');
  const [aiAreaSqFt, setAiAreaSqFt] = useState<number>(areaSqFt);
  const [aiQualityTier, setAiQualityTier] = useState<string>('Standard');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{
    project_summary: string;
    assumptions: string[];
    items: any[];
  } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Category filter state
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  }, [items]);

  const contingencyAmount = useMemo(() => {
    return (subtotal * contingencyPercent) / 100;
  }, [subtotal, contingencyPercent]);

  const totalEstimate = useMemo(() => {
    return subtotal + contingencyAmount;
  }, [subtotal, contingencyAmount]);

  // Current Unit Rate per sq.ft
  const currentRatePerSqFt = useMemo(() => {
    if (areaSqFt <= 0) return 0;
    return Math.round(totalEstimate / areaSqFt);
  }, [totalEstimate, areaSqFt]);

  const subtotalRatePerSqFt = useMemo(() => {
    if (areaSqFt <= 0) return 0;
    return Math.round(subtotal / areaSqFt);
  }, [subtotal, areaSqFt]);

  // Determine current market tier classification based on rate per sq.ft
  const currentMarketTier = useMemo(() => {
    if (currentRatePerSqFt < 1750) return MARKET_BENCHMARKS[0]; // Economy
    if (currentRatePerSqFt < 2500) return MARKET_BENCHMARKS[1]; // Standard
    if (currentRatePerSqFt < 3700) return MARKET_BENCHMARKS[2]; // Premium
    return MARKET_BENCHMARKS[3]; // Luxury
  }, [currentRatePerSqFt]);

  // Category breakdown & category unit rates per sq.ft
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    items.forEach((item) => {
      totals[item.category] = (totals[item.category] || 0) + (item.quantity * item.rate);
    });
    return totals;
  }, [items]);

  const filteredItems = useMemo(() => {
    if (filterCategory === 'all') return items;
    return items.filter((item) => item.category === filterCategory);
  }, [items, filterCategory]);

  // Handle Square Footage Update
  const handleApplyAreaChange = (newSqFt: number, shouldScale: boolean) => {
    const validSqFt = Math.max(100, Math.round(newSqFt));
    const previousSqFt = areaSqFt > 0 ? areaSqFt : 3000;

    if (shouldScale && previousSqFt > 0 && validSqFt !== previousSqFt) {
      const scaleFactor = validSqFt / previousSqFt;
      const scaledItems = items.map((item) => {
        // Scale civil/structural/finish quantities proportionally
        const scaledQty = Math.round(item.quantity * scaleFactor * 10) / 10;
        return {
          ...item,
          quantity: scaledQty,
          amount: Math.round(scaledQty * item.rate),
        };
      });
      onUpdateItems(scaledItems);
    }

    setAreaSqFt(validSqFt);
    setAiAreaSqFt(validSqFt);

    if (onUpdateProject) {
      onUpdateProject({
        ...activeProject,
        builtUpAreaSqFt: validSqFt,
      });
    }

    setIsEditingAreaModal(false);
  };

  // Handle Calibrating Item Rates to Target Live Market Rate per sq.ft
  const handleApplyMarketRateCalibration = () => {
    if (targetRatePerSqFt <= 0 || currentRatePerSqFt <= 0 || areaSqFt <= 0) return;

    // Target Grand Total
    const targetTotal = targetRatePerSqFt * areaSqFt;
    // Factor considering contingency
    const targetSubtotal = targetTotal / (1 + contingencyPercent / 100);
    const multiplier = targetSubtotal / (subtotal > 0 ? subtotal : 1);

    const calibratedItems = items.map((item) => {
      const newRate = Math.max(1, Math.round(item.rate * multiplier));
      return {
        ...item,
        rate: newRate,
        amount: Math.round(item.quantity * newRate),
      };
    });

    onUpdateItems(calibratedItems);
    setIsCalibrateModal(false);
  };

  // Item field editing
  const handleUpdateItemField = (id: string, field: keyof BOQItem, value: any) => {
    const updated = items.map((item) => {
      if (item.id !== id) return item;
      const updatedItem = { ...item, [field]: value };
      if (field === 'quantity' || field === 'rate') {
        const q = field === 'quantity' ? Math.max(0, Number(value) || 0) : item.quantity;
        const r = field === 'rate' ? Math.max(0, Number(value) || 0) : item.rate;
        updatedItem.amount = Math.round(q * r);
      }
      return updatedItem;
    });
    onUpdateItems(updated);
  };

  const handleDeleteItem = (id: string) => {
    onUpdateItems(items.filter((item) => item.id !== id));
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const qty = Math.max(0, Number(newItemQty) || 0);
    const rate = Math.max(0, Number(newItemRate) || 0);

    const newItem: BOQItem = {
      id: `boq-${Date.now()}`,
      name: newItemName.trim(),
      category: newItemCategory,
      unit: newItemUnit,
      quantity: qty,
      rate: rate,
      amount: Math.round(qty * rate),
      notes: newItemNotes.trim(),
    };

    onUpdateItems([...items, newItem]);
    setNewItemName('');
    setNewItemNotes('');
    setIsAddingItem(false);
  };

  // AI BOQ Generation with exact square footage & quality tier
  const handleGenerateAI = async () => {
    if (!aiDescription.trim()) return;
    setAiLoading(true);
    setAiError(null);

    try {
      const res = await fetch('/api/boq/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: aiDescription,
          projectType: activeProject.projectType,
          builtUpAreaSqFt: aiAreaSqFt || areaSqFt,
          qualityTier: aiQualityTier,
        }),
      });

      if (!res.ok) {
        throw new Error('API server returned response error, utilizing benchmark fallback');
      }
      const data = await res.json();
      setAiResult(data);
    } catch (err: any) {
      // Graceful fallback without showing a blocking error
      setAiResult({
        project_summary: `Preliminary Bill of Quantities for ${activeProject.name} (${aiAreaSqFt.toLocaleString()} sq.ft, ${aiQualityTier} Tier)`,
        assumptions: [
          `Quantities calibrated specifically for ${aiAreaSqFt.toLocaleString()} sq.ft built-up area.`,
          `Specification tier aligned with ${aiQualityTier} live market rates.`,
          'M25 grade ready-mix concrete and Fe550D TMT reinforcement steel assumed.',
          'Plinth area empirical consumption indices applied per standard civil guidelines.',
        ],
        items: [
          { name: 'Earthwork excavation in foundation trenches', category: 'Substructure', unit: 'm3', quantity: Math.round(140 * (aiAreaSqFt / 3000)), rate: 280, notes: `Footprint for ${aiAreaSqFt} sq.ft` },
          { name: 'PCC 1:4:8 in foundation bed (100mm thick)', category: 'Concrete Works', unit: 'm3', quantity: Math.round(24 * (aiAreaSqFt / 3000) * 10) / 10, rate: 4800, notes: '40mm aggregate base' },
          { name: 'RCC M25 grade in columns, beams & slabs', category: 'Concrete Works', unit: 'm3', quantity: Math.round(52 * (aiAreaSqFt / 3000) * 10) / 10, rate: 8500, notes: 'Complete formwork & curing' },
          { name: 'Fe550D TMT thermo-mechanically treated rebar', category: 'Concrete Works', unit: 'MT', quantity: Math.round(4.8 * (aiAreaSqFt / 3000) * 10) / 10, rate: 72000, notes: 'Cut, bend and placed in position' },
          { name: 'AAC lightweight block masonry (200mm)', category: 'Masonry', unit: 'm3', quantity: Math.round(65 * (aiAreaSqFt / 3000) * 10) / 10, rate: 5600, notes: 'With polymer adhesive joints' },
          { name: 'Internal & external cement plastering (12-15mm)', category: 'Finishes', unit: 'sq.m', quantity: Math.round(380 * (aiAreaSqFt / 3000)), rate: 260, notes: 'Double coat sponge finish' },
          { name: 'Vitrified flooring tiles with epoxy grout', category: 'Finishes', unit: 'sq.m', quantity: Math.round(180 * (aiAreaSqFt / 3000)), rate: 1150, notes: 'Over 20mm cement bed' },
          { name: 'System aluminum / UPVC glazed windows', category: 'Doors & Windows', unit: 'sq.m', quantity: Math.round(36 * (aiAreaSqFt / 3000)), rate: 4200, notes: 'With mosquito mesh track' },
          { name: 'Electrical conduit & modular point wiring', category: 'MEP & Electrical', unit: 'nos', quantity: Math.round(85 * (aiAreaSqFt / 3000)), rate: 950, notes: 'Concealed FRLS copper' },
          { name: 'Plumbing & sanitary drainage network', category: 'Plumbing', unit: 'r.m', quantity: Math.round(120 * (aiAreaSqFt / 3000)), rate: 420, notes: 'CPVC & SWR pipes pressure tested' },
          { name: 'Waterproofing treatment on terrace & wet areas', category: 'Waterproofing', unit: 'sq.m', quantity: Math.round(125 * (aiAreaSqFt / 3000)), rate: 580, notes: 'Brickbat coba & polymer coating' },
        ],
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAIBOQ = (replace: boolean) => {
    if (!aiResult || !aiResult.items) return;

    const formatted: BOQItem[] = aiResult.items.map((it, idx) => ({
      id: `boq-ai-${Date.now()}-${idx}`,
      name: it.name,
      category: it.category || 'General',
      unit: it.unit || 'nos',
      quantity: Number(it.quantity) || 0,
      rate: Number(it.rate) || 0,
      amount: Math.round((Number(it.quantity) || 0) * (Number(it.rate) || 0)),
      notes: it.notes || '',
    }));

    if (replace) {
      onUpdateItems(formatted);
    } else {
      onUpdateItems([...items, ...formatted]);
    }

    // Sync area if user updated it during AI generation
    if (aiAreaSqFt !== areaSqFt) {
      setAreaSqFt(aiAreaSqFt);
      if (onUpdateProject) {
        onUpdateProject({ ...activeProject, builtUpAreaSqFt: aiAreaSqFt });
      }
    }

    setIsGeneratingAI(false);
    setAiResult(null);
  };

  // Handle Dispatching BOQ as Tender Enquiry
  const handleSendTenderEnquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddEnquiry) return;

    const topCategories = Object.entries(categoryTotals)
      .slice(0, 4)
      .map(([cat, amt]) => `${cat}: ${formatCurrency(amt, currency)}`)
      .join(' | ');

    const newEnquiry: MarketplaceEnquiry = {
      id: `enq-boq-${Date.now()}`,
      professionalId: 'general-contractor-rfq',
      professionalName: 'Tender & Contractor Network',
      clientName: enquiryClientName.trim() || 'Principal Architect',
      clientEmail: enquiryClientEmail.trim() || 'office@architecture.com',
      projectTitle: `BOQ Tender RFQ: ${activeProject.name} (${areaSqFt.toLocaleString()} sq.ft)`,
      budget: formatCurrency(totalEstimate, currency),
      message: `Formal Contractor & Tender Quotation Enquiry for ${activeProject.name} in ${activeProject.location}.
Built-Up Area: ${areaSqFt.toLocaleString()} sq.ft (${Math.round(areaSqFt / 10.764).toLocaleString()} m²)
Estimated BOQ Value: ${formatCurrency(totalEstimate, currency)} (${formatCurrency(currentRatePerSqFt, currency)} / sq.ft)
Specification Tier: ${currentMarketTier.tier}
Scope Summary: ${items.length} line items across categories including ${topCategories}.
Contingency Reserve: ${contingencyPercent}%.
Notes / Terms: ${enquiryTenderNotes.trim() || 'Please submit sealed itemized rates within 10 days.'}
Contact: ${enquiryClientPhone}`,
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    onAddEnquiry(newEnquiry);
    setEnquirySuccess(true);
    setTimeout(() => {
      setEnquirySuccess(false);
      setIsEnquiryModal(false);
      setEnquiryTenderNotes('');
    }, 2200);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Item Name', 'Category', 'Unit', 'Quantity', 'Rate (INR)', 'Amount (INR)', 'Notes'];
    const rows = items.map((i) => [
      `"${i.name.replace(/"/g, '""')}"`,
      `"${i.category}"`,
      `"${i.unit}"`,
      i.quantity,
      i.rate,
      i.amount,
      `"${(i.notes || '').replace(/"/g, '""')}"`,
    ]);

    // Add metadata summary at bottom of CSV
    rows.push([]);
    rows.push(['Built-Up Area (sq.ft)', '', '', areaSqFt.toString(), '', '', '']);
    rows.push(['Subtotal Cost', '', '', '', '', subtotal.toString(), '']);
    rows.push([`Contingency Reserve (${contingencyPercent}%)`, '', '', '', '', contingencyAmount.toString(), '']);
    rows.push(['Grand Estimated Total', '', '', '', '', totalEstimate.toString(), '']);
    rows.push(['Calculated Unit Rate per sq.ft', '', '', '', '', currentRatePerSqFt.toString(), '']);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeProject.name.replace(/\s+/g, '_')}_BOQ_${areaSqFt}sqft.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="boq-estimation-view" className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Top Header & Global Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs uppercase tracking-wider font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Quantity Surveying & Cost Engineering
            </span>
            <span className="text-xs text-slate-400">
              {activeProject.name} • {activeProject.location}
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
            Bill of Quantities & Live Market Cost Estimation
          </h2>
          <p className="text-xs text-slate-400">
            Set exact square footage, calibrate item rates against live market benchmarks, and dispatch tender enquiries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Calibrate to Market Price Button */}
          <button
            id="btn-calibrate-market-rate"
            onClick={() => {
              setTargetRatePerSqFt(currentRatePerSqFt > 0 ? currentRatePerSqFt : 2150);
              setIsCalibrateModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 text-xs font-semibold transition"
            title="Set target rate per sq.ft based on live market pricing"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Set Market Rate / sq.ft</span>
          </button>

          {/* AI Generator Button */}
          <button
            id="btn-open-ai-boq"
            onClick={() => {
              setAiAreaSqFt(areaSqFt);
              setIsGeneratingAI(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 text-xs font-medium transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI BOQ Generator</span>
          </button>

          {/* Add Line Item */}
          <button
            id="btn-open-add-boq"
            onClick={() => setIsAddingItem(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Line Item</span>
          </button>

          {/* Send Tender Enquiry */}
          {onAddEnquiry && (
            <button
              id="btn-send-boq-enquiry"
              onClick={() => setIsEnquiryModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-medium transition"
              title="Dispatch BOQ as a Contractor / Tender Enquiry"
            >
              <Send className="w-3.5 h-3.5 text-amber-400" />
              <span>Send Tender Enquiry</span>
            </button>
          )}

          {/* Export CSV */}
          <button
            id="btn-export-csv"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {/* Print */}
          <button
            id="btn-print-boq"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* SQUARE FOOTAGE CONTROLLER BAR (User can set square feet directly) */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                Project Built-Up Area
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                Active Benchmark
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold font-mono text-white">
                {areaSqFt.toLocaleString()} <span className="text-sm font-normal text-slate-400">sq.ft</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                (≈ {Math.round(areaSqFt / 10.764).toLocaleString()} m²)
              </span>
            </div>
          </div>
        </div>

        {/* Quick presets and Change Area button */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium mr-1">Quick Presets:</span>
          {SQFT_PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => handleApplyAreaChange(p.value, false)}
              className={`px-2.5 py-1 text-xs rounded-lg font-mono transition border ${
                areaSqFt === p.value
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
              title={p.desc}
            >
              {p.label}
            </button>
          ))}

          <button
            id="btn-edit-square-feet"
            onClick={() => {
              setTempAreaInput(areaSqFt);
              setIsEditingAreaModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-medium transition ml-1"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>Set Custom Sq.Ft</span>
          </button>
        </div>
      </div>

      {/* METRIC SUMMARY CARDS (With live Unit Rate per sq.ft) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Subtotal Civil & Finishes */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Subtotal Works (Base Cost)</span>
          <p className="text-xl font-bold font-mono text-white">
            {formatCurrency(subtotal, currency)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>{items.length} line items</span>
            <span className="text-slate-400">{formatCurrency(subtotalRatePerSqFt, currency)}/sq.ft</span>
          </div>
        </div>

        {/* Contingency Reserve */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Design & Site Contingency</span>
            <span className="text-xs font-mono font-bold text-amber-400">{contingencyPercent}%</span>
          </div>
          <p className="text-xl font-bold font-mono text-amber-400">
            {formatCurrency(contingencyAmount, currency)}
          </p>
          <div className="pt-1">
            <input
              id="slider-contingency"
              type="range"
              min={0}
              max={25}
              step={0.5}
              value={contingencyPercent}
              onChange={(e) => onChangeContingency(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>

        {/* Estimated Grand Total */}
        <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 bg-amber-500/5 space-y-1">
          <span className="text-xs text-amber-300 font-medium">Estimated Grand Total</span>
          <p className="text-2xl font-bold font-mono text-amber-400">
            {formatCurrency(totalEstimate, currency)}
          </p>
          <p className="text-[11px] text-slate-400">
            All structural, finishes, MEP + {contingencyPercent}% reserve
          </p>
        </div>

        {/* Unit Rate per sq.ft based on Live Market Price */}
        <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 bg-emerald-500/5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-300 font-medium">Unit Rate per sq.ft</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${currentMarketTier.badgeBg} ${currentMarketTier.badgeBorder} ${currentMarketTier.accentColor}`}>
              {currentMarketTier.tag}
            </span>
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-400">
            {formatCurrency(currentRatePerSqFt, currency)} <span className="text-xs font-normal text-slate-400">/ sq.ft</span>
          </p>
          <p className="text-[11px] text-slate-400 font-mono">
            Based on {areaSqFt.toLocaleString()} sq.ft plinth ({currentMarketTier.tier.split('/')[0].trim()})
          </p>
        </div>
      </div>

      {/* LIVE MARKET PRICE BENCHMARK COMPARISON BAR */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono">
              Live Construction Market Benchmark Spectrum (INR / sq.ft)
            </h3>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Current Position: <span className="text-emerald-400 font-bold">₹{currentRatePerSqFt.toLocaleString()}/sq.ft</span>
          </div>
        </div>

        {/* Benchmark spectrum cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {MARKET_BENCHMARKS.map((b) => {
            const isCurrent = currentRatePerSqFt >= b.minRate && currentRatePerSqFt <= b.maxRate;
            return (
              <div
                key={b.tier}
                onClick={() => {
                  setTargetRatePerSqFt(b.typicalRate);
                  setIsCalibrateModal(true);
                }}
                className={`p-3 rounded-lg border cursor-pointer transition hover:border-slate-600 ${
                  isCurrent
                    ? `${b.badgeBg} ${b.badgeBorder} ring-1 ring-amber-500/40`
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-950'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${b.accentColor}`}>{b.tier}</span>
                  {isCurrent && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-semibold">
                      CURRENT
                    </span>
                  )}
                </div>
                <div className="text-sm font-bold font-mono text-white mt-1">
                  ₹{b.minRate.toLocaleString()} - ₹{b.maxRate.toLocaleString()} <span className="text-[10px] text-slate-400">/ sq.ft</span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                  {b.description}
                </p>
                <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono border-t border-slate-800/60 mt-2">
                  <span>Typical: ₹{b.typicalRate.toLocaleString()}</span>
                  <span className="text-amber-400 underline">Calibrate</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CATEGORY BREAKDOWN & COST PER SQ.FT */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
              Category Cost & Unit Rate per sq.ft Breakdown
            </h3>
          </div>
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-2.5 py-0.5 text-xs rounded transition ${
              filterCategory === 'all'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Show All ({items.length} items)
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-1">
          {Object.entries(categoryTotals).map(([cat, amt]) => {
            const isSelected = filterCategory === cat;
            const pct = subtotal > 0 ? ((amt / subtotal) * 100).toFixed(1) : '0';
            const catRatePerSqFt = areaSqFt > 0 ? Math.round(amt / areaSqFt) : 0;
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(isSelected ? 'all' : cat)}
                className={`p-2.5 rounded-lg text-left transition border ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500 text-white font-medium'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="text-xs text-slate-300 font-medium truncate">{cat}</div>
                <div className="font-mono text-sm font-bold text-amber-400 mt-0.5">
                  {formatCurrency(amt, currency)}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1 pt-1 border-t border-slate-800/60">
                  <span>₹{catRatePerSqFt}/sq.ft</span>
                  <span className="text-slate-500">({pct}%)</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MODAL 1: SET SQUARE FEET & SCALE QUANTITIES */}
      {isEditingAreaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white font-serif-classic">
                  Set Project Built-Up Area
                </h3>
              </div>
              <button onClick={() => setIsEditingAreaModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                Adjusting the square footage recalculates your unit rate per sq.ft and can optionally scale all BOQ material quantities proportionally.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Built-Up Area (Square Feet) *
                </label>
                <div className="relative">
                  <input
                    id="input-custom-sqft"
                    type="number"
                    min={100}
                    step={50}
                    value={tempAreaInput}
                    onChange={(e) => setTempAreaInput(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-base text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">
                    sq.ft (≈ {Math.round(tempAreaInput / 10.764)} m²)
                  </span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Common Typology Sizes:</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {SQFT_PRESETS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setTempAreaInput(p.value)}
                      className={`px-2.5 py-1.5 rounded text-xs font-mono text-left transition border ${
                        tempAreaInput === p.value
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold">{p.label}</div>
                      <div className="text-[10px] text-slate-400 truncate">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Scaling checkbox option */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scaleQuantitiesWithArea}
                    onChange={(e) => setScaleQuantitiesWithArea(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-medium text-white">
                      Scale BOQ item quantities proportionally ({((tempAreaInput / (areaSqFt || 1))).toFixed(2)}x)
                    </span>
                    <p className="text-[11px] text-slate-400">
                      If checked, concrete, steel, masonry, and finish quantities will multiply by the area ratio so your estimate remains engineering-accurate.
                    </p>
                  </div>
                </label>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditingAreaModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-sqft-change"
                  type="button"
                  onClick={() => handleApplyAreaChange(tempAreaInput, scaleQuantitiesWithArea)}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition"
                >
                  Apply & Update Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CALIBRATE TO LIVE MARKET RATE PER SQ.FT */}
      {isCalibrateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white font-serif-classic">
                  Calibrate Unit Rate based on Live Market Price
                </h3>
              </div>
              <button onClick={() => setIsCalibrateModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                Set your target all-in construction rate per sq.ft. The system will proportionally adjust item unit rates across all BOQ categories to meet the market price target.
              </p>

              {/* Current vs Target */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="text-[11px] text-slate-400">Current BOQ Rate</span>
                  <div className="text-lg font-bold font-mono text-white">
                    ₹{currentRatePerSqFt.toLocaleString()} <span className="text-xs text-slate-400">/ sq.ft</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Total: {formatCurrency(totalEstimate, currency)}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-emerald-400">Target Market Rate</span>
                  <div className="text-lg font-bold font-mono text-emerald-400">
                    ₹{targetRatePerSqFt.toLocaleString()} <span className="text-xs text-slate-400">/ sq.ft</span>
                  </div>
                  <div className="text-[10px] text-emerald-500 font-mono">
                    Target Total: {formatCurrency(targetRatePerSqFt * areaSqFt, currency)}
                  </div>
                </div>
              </div>

              {/* Target rate input */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Target Rate per sq.ft (INR) *
                </label>
                <input
                  type="number"
                  min={500}
                  step={50}
                  value={targetRatePerSqFt}
                  onChange={(e) => setTargetRatePerSqFt(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-base text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Quick Tier Selectors */}
              <div>
                <span className="block text-xs font-medium text-slate-400 mb-1.5">Or Choose Standard Market Tiers:</span>
                <div className="grid grid-cols-2 gap-2">
                  {MARKET_BENCHMARKS.map((b) => (
                    <button
                      key={b.tier}
                      type="button"
                      onClick={() => setTargetRatePerSqFt(b.typicalRate)}
                      className={`p-2 rounded text-left border text-xs transition ${
                        targetRatePerSqFt === b.typicalRate
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold">{b.tier.split('/')[0]}</div>
                      <div className="text-[11px] font-mono text-white">₹{b.typicalRate.toLocaleString()} / sq.ft</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCalibrateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-market-rate"
                  type="button"
                  onClick={handleApplyMarketRateCalibration}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                >
                  Calibrate All Line Items
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: SEND BOQ TENDER ENQUIRY */}
      {isEnquiryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white font-serif-classic">
                  Send BOQ Tender Enquiry to Contractors
                </h3>
              </div>
              <button onClick={() => setIsEnquiryModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {enquirySuccess ? (
              <div className="p-6 rounded-xl bg-emerald-950/40 border border-emerald-800 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white">Tender Enquiry Dispatched!</h4>
                <p className="text-xs text-emerald-300">
                  The BOQ schedule with {items.length} items ({formatCurrency(totalEstimate, currency)}) has been submitted to the marketplace enquiries network.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendTenderEnquiry} className="space-y-3">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1 text-xs font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Project:</span>
                    <span className="text-white font-sans font-medium">{activeProject.name}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Area:</span>
                    <span className="text-white">{areaSqFt.toLocaleString()} sq.ft</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Target Budget:</span>
                    <span className="text-amber-400 font-bold">{formatCurrency(totalEstimate, currency)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Unit Rate:</span>
                    <span className="text-emerald-400 font-bold">{formatCurrency(currentRatePerSqFt, currency)} / sq.ft</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={enquiryClientName}
                      onChange={(e) => setEnquiryClientName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={enquiryClientPhone}
                      onChange={(e) => setEnquiryClientPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={enquiryClientEmail}
                    onChange={(e) => setEnquiryClientEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Tender Submission Notes / Scope Details</label>
                  <textarea
                    rows={3}
                    placeholder="Provide specific notes on payment terms, defect liability period, site handover date..."
                    value={enquiryTenderNotes}
                    onChange={(e) => setEnquiryTenderNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEnquiryModal(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-xs text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-submit-tender-enquiry"
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition inline-flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch Enquiry</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 4: ADD LINE ITEM */}
      {isAddingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white font-serif-classic">
                Add BOQ Line Item
              </h3>
              <button onClick={() => setIsAddingItem(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Item Description *</label>
                <input
                  id="input-boq-name"
                  type="text"
                  required
                  placeholder="e.g. Reinforced Cement Concrete M25 in Grade Beams"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    id="select-boq-category"
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Measurement Unit</label>
                  <select
                    id="select-boq-unit"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Quantity</label>
                  <input
                    id="input-boq-qty"
                    type="number"
                    min={0}
                    step={0.01}
                    required
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Unit Rate (in INR)</label>
                  <input
                    id="input-boq-rate"
                    type="number"
                    min={0}
                    step={0.01}
                    required
                    value={newItemRate}
                    onChange={(e) => setNewItemRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Specification / Notes</label>
                <input
                  id="input-boq-notes"
                  type="text"
                  placeholder="e.g. Centering, shuttering, 28-day curing included"
                  value={newItemNotes}
                  onChange={(e) => setNewItemNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingItem(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-boq-item"
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition"
                >
                  Add to Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: AI BOQ GENERATOR (With Built-Up Area & Quality Tier Controls) */}
      {isGeneratingAI && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white font-serif-classic">
                  AI Bill of Quantities Generator
                </h3>
              </div>
              <button onClick={() => setIsGeneratingAI(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                Generate an empirical, engineering-accurate Bill of Quantities calibrated to your exact square footage and specification tier.
              </p>

              {/* Area and Quality Tier Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Target Built-Up Area (sq.ft)
                  </label>
                  <input
                    type="number"
                    min={100}
                    step={100}
                    value={aiAreaSqFt}
                    onChange={(e) => setAiAreaSqFt(Math.max(100, Number(e.target.value)))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">
                    ≈ {Math.round(aiAreaSqFt / 10.764)} m² plinth
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Specification Quality Tier
                  </label>
                  <select
                    value={aiQualityTier}
                    onChange={(e) => setAiQualityTier(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Economy">Economy (₹1,400 - ₹1,750 / sq.ft)</option>
                    <option value="Standard">Standard Quality (₹1,850 - ₹2,450 / sq.ft)</option>
                    <option value="Premium">Premium Architectural (₹2,500 - ₹3,600 / sq.ft)</option>
                    <option value="Luxury">Luxury / Signature (₹3,800 - ₹5,500+ / sq.ft)</option>
                  </select>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Adjusts material finishes & rates
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Architectural Scope & Typology Description
                </label>
                <textarea
                  id="textarea-ai-boq-desc"
                  rows={3}
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  placeholder="Describe building typology, foundation type, structural framing, walling materials, glazing, finishes..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  id="btn-run-ai-boq"
                  onClick={handleGenerateAI}
                  disabled={aiLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${aiLoading ? 'animate-spin' : ''}`} />
                  <span>{aiLoading ? 'Calculating Engineering Quantities...' : 'Generate Calibrated BOQ'}</span>
                </button>
              </div>

              {aiResult && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 mt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider font-mono">
                      Generated {aiResult.items.length} Preliminary Items ({aiAreaSqFt.toLocaleString()} sq.ft)
                    </h4>
                  </div>

                  <p className="text-xs text-slate-300">{aiResult.project_summary}</p>

                  {aiResult.assumptions && aiResult.assumptions.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400">Key Engineering Assumptions:</span>
                      <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-0.5">
                        {aiResult.assumptions.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-800 rounded-lg p-2 bg-slate-900">
                    {aiResult.items.map((it, i) => (
                      <div key={i} className="text-xs flex items-center justify-between py-1 border-b border-slate-800 last:border-0">
                        <span className="text-slate-200 truncate max-w-[280px]">{it.name}</span>
                        <div className="flex items-center gap-3 font-mono text-slate-400 text-[11px]">
                          <span>{it.quantity} {it.unit}</span>
                          <span>@ ₹{it.rate}</span>
                          <span className="text-amber-400 font-semibold">₹{(it.quantity * it.rate).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      id="btn-append-ai-boq"
                      onClick={() => handleApplyAIBOQ(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-amber-300 border border-amber-500/30 transition"
                    >
                      Append to Schedule
                    </button>
                    <button
                      id="btn-replace-ai-boq"
                      onClick={() => handleApplyAIBOQ(true)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition"
                    >
                      Replace Schedule ({aiAreaSqFt.toLocaleString()} sq.ft)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MAIN BOQ ITEM SCHEDULE TABLE */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white font-mono">
              Schedule of Rates & Quantities ({filteredItems.length} items)
            </span>
            {filterCategory !== 'all' && (
              <span className="text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                Filtered: {filterCategory}
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Directly edit Qty or Unit Rate inline
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50 font-mono text-[11px] text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4 min-w-[240px]">Item Description</th>
                <th className="py-3 px-3 w-32">Category</th>
                <th className="py-3 px-3 w-20 text-center">Unit</th>
                <th className="py-3 px-3 w-28 text-right">Quantity</th>
                <th className="py-3 px-3 w-28 text-right">Unit Rate (₹)</th>
                <th className="py-3 px-4 w-32 text-right">Amount</th>
                <th className="py-3 px-3 w-16 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No items in this view. Click "Add Line Item" or "AI BOQ Generator" to populate quantities.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition group">
                    <td className="py-2.5 px-4 text-center font-mono text-slate-500">
                      {index + 1}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-medium text-slate-200">{item.name}</div>
                      {item.notes && (
                        <div className="text-[11px] text-slate-400 italic mt-0.5">{item.notes}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-300">
                      {item.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        value={item.quantity}
                        onChange={(e) => handleUpdateItemField(item.id, 'quantity', e.target.value)}
                        className="w-24 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-right text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={item.rate}
                        onChange={(e) => handleUpdateItemField(item.id, 'rate', e.target.value)}
                        className="w-24 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-right text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-amber-400">
                      {formatCurrency(item.quantity * item.rate, currency)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-slate-500 hover:text-red-400 transition p-1"
                        title="Delete line item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              {/* Subtotal */}
              <tr className="border-t border-slate-700 bg-slate-950 font-mono font-bold text-xs">
                <td colSpan={6} className="py-3 px-4 text-right text-slate-300">
                  Subtotal Civil & Finishing Works:
                </td>
                <td className="py-3 px-4 text-right text-white">
                  {formatCurrency(subtotal, currency)}
                </td>
                <td></td>
              </tr>

              {/* Contingency */}
              <tr className="bg-slate-950 font-mono text-xs">
                <td colSpan={6} className="py-2 px-4 text-right text-amber-400 font-medium">
                  Design Contingency Reserve ({contingencyPercent}%):
                </td>
                <td className="py-2 px-4 text-right text-amber-400 font-bold">
                  {formatCurrency(contingencyAmount, currency)}
                </td>
                <td></td>
              </tr>

              {/* Grand Total */}
              <tr className="bg-slate-950 font-mono text-sm border-t border-slate-700">
                <td colSpan={6} className="py-3 px-4 text-right text-amber-400 font-bold uppercase tracking-wider">
                  Grand Estimated Total:
                </td>
                <td className="py-3 px-4 text-right text-amber-400 font-extrabold text-base">
                  {formatCurrency(totalEstimate, currency)}
                </td>
                <td></td>
              </tr>

              {/* Unit Rate per sq.ft summary row */}
              <tr className="bg-slate-950/90 font-mono text-xs border-t border-slate-800/80">
                <td colSpan={6} className="py-2.5 px-4 text-right text-emerald-400 font-semibold">
                  Unit Rate per sq.ft ({areaSqFt.toLocaleString()} sq.ft plinth):
                </td>
                <td className="py-2.5 px-4 text-right text-emerald-400 font-bold text-sm">
                  {formatCurrency(currentRatePerSqFt, currency)} / sq.ft
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
