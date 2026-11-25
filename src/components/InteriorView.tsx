import React, { useState, useMemo } from 'react';
import {
  Sofa,
  Calculator,
  Layers,
  CheckCircle2,
  Plus,
  Trash2,
  Download,
  ArrowRight,
  Store,
  Sliders,
  Lightbulb,
  DoorOpen,
  PaintBucket,
  Sparkles,
  X,
  Edit3,
  Check,
  PieChart,
} from 'lucide-react';
import { Project, BOQItem } from '../types';
import { formatCurrency, CurrencyCode } from '../utils/formatters';
import { ensureItemFloorBreakdown } from '../utils/floorTakeoffEngine';

interface InteriorViewProps {
  activeProject: Project;
  currency: CurrencyCode;
  boqItems: BOQItem[];
  onUpdateBOQItems: (items: BOQItem[]) => void;
  onUpdateProject?: (updated: Project) => void;
  onNavigateToBOQ?: () => void;
  onNavigateToMarketplace?: (category?: string, query?: string) => void;
}

type InteriorTier = 'essential' | 'signature' | 'luxury';
type InteriorSubTab = 'rooms' | 'millwork' | 'specs' | 'tender';

interface InteriorRoomItem {
  id: string;
  name: string;
  zoneType: 'Living & Dining' | 'Kitchen' | 'Bedroom' | 'Bathroom' | 'Foyer & Utility' | 'Home Office';
  areaSqFt: number;
  flooringRateSqFt: number;
  ceilingRateSqFt: number;
  wallFinishRateSqFt: number;
  millworkSqFt: number;
  millworkRateSqFt: number;
  electricalLumpSum: number;
  includeFlooring: boolean;
  includeCeiling: boolean;
  includeWallFinish: boolean;
  includeMillwork: boolean;
  includeElectrical: boolean;
  finishSpec: string;
}

interface MillworkLineItem {
  id: string;
  name: string;
  room: string;
  category: 'Modular Kitchen' | 'Wardrobe' | 'False Ceiling' | 'TV & Storage' | 'Wall Panelling';
  widthFt: number;
  heightFt: number;
  unit: 'sq.ft' | 'r.ft' | 'nos';
  quantity: number;
  rate: number;
  coreMaterial: string;
  hardwareSpec: string;
}

interface InteriorSpecItem {
  id: string;
  name: string;
  trade: 'Flooring & Stone' | 'Lighting & Automation' | 'Sanitary & CP' | 'Loose FF&E' | 'Wall Treatments';
  brandSpec: string;
  unit: string;
  quantity: number;
  rate: number;
  marketKeyword: string;
}

const TIER_CONFIG: Record<
  InteriorTier,
  { label: string; multiplier: number; benchmarkPerSqFt: number; summary: string }
> = {
  essential: {
    label: 'Essential',
    multiplier: 0.85,
    benchmarkPerSqFt: 1450,
    summary: 'Durable laminates, vitrified tiles, gypsum flat ceilings, standard LED fixtures',
  },
  signature: {
    label: 'Signature',
    multiplier: 1.0,
    benchmarkPerSqFt: 2150,
    summary: 'HDHMR / acrylic joinery, Italian-format porcelain, cove lighting, quartz counters',
  },
  luxury: {
    label: 'Luxury',
    multiplier: 1.42,
    benchmarkPerSqFt: 3250,
    summary: 'Natural veneer & fluted glass, Italian marble, Blum hardware, smart dimming & bespoke FF&E',
  },
};

const DESIGN_THEMES = [
  'Modern Warm Minimalist',
  'Contemporary Timber & Stone',
  'Classic Moulded Luxury',
  'Biophilic Japandi',
  'Urban Concrete & Brass',
];

function createDefaultRooms(builtUpAreaSqFt: number): InteriorRoomItem[] {
  const scale = Math.max(0.65, Math.min(2.4, (builtUpAreaSqFt || 3200) / 3200));
  return [
    {
      id: 'room-living',
      name: 'Living & Dining Hall',
      zoneType: 'Living & Dining',
      areaSqFt: Math.round(520 * scale),
      flooringRateSqFt: 290,
      ceilingRateSqFt: 135,
      wallFinishRateSqFt: 95,
      millworkSqFt: Math.round(95 * scale),
      millworkRateSqFt: 1650,
      electricalLumpSum: Math.round(92000 * scale),
      includeFlooring: true,
      includeCeiling: true,
      includeWallFinish: true,
      includeMillwork: true,
      includeElectrical: true,
      finishSpec: 'Large-format porcelain slabs, recessed cove ceiling, floating TV & crockery console',
    },
    {
      id: 'room-kitchen',
      name: 'Modular Kitchen & Utility',
      zoneType: 'Kitchen',
      areaSqFt: Math.round(210 * scale),
      flooringRateSqFt: 240,
      ceilingRateSqFt: 145,
      wallFinishRateSqFt: 160,
      millworkSqFt: Math.round(165 * scale),
      millworkRateSqFt: 2250,
      electricalLumpSum: Math.round(68000 * scale),
      includeFlooring: true,
      includeCeiling: true,
      includeWallFinish: true,
      includeMillwork: true,
      includeElectrical: true,
      finishSpec: 'BWP marine ply carcass, anti-scratch acrylic shutters, quartz top, soft-close channels',
    },
    {
      id: 'room-master',
      name: 'Master Suite & Walk-In',
      zoneType: 'Bedroom',
      areaSqFt: Math.round(310 * scale),
      flooringRateSqFt: 265,
      ceilingRateSqFt: 130,
      wallFinishRateSqFt: 110,
      millworkSqFt: Math.round(130 * scale),
      millworkRateSqFt: 1950,
      electricalLumpSum: Math.round(58000 * scale),
      includeFlooring: true,
      includeCeiling: true,
      includeWallFinish: true,
      includeMillwork: true,
      includeElectrical: true,
      finishSpec: 'Engineered wood flooring, upholstered headboard wall, full-height sliding wardrobe',
    },
    {
      id: 'room-guest',
      name: 'Guest & Family Bedrooms (x2)',
      zoneType: 'Bedroom',
      areaSqFt: Math.round(420 * scale),
      flooringRateSqFt: 210,
      ceilingRateSqFt: 120,
      wallFinishRateSqFt: 85,
      millworkSqFt: Math.round(160 * scale),
      millworkRateSqFt: 1750,
      electricalLumpSum: Math.round(64000 * scale),
      includeFlooring: true,
      includeCeiling: true,
      includeWallFinish: true,
      includeMillwork: true,
      includeElectrical: true,
      finishSpec: 'Matte vitrified flooring, hinged matte laminate wardrobes, integrated study desks',
    },
    {
      id: 'room-bath',
      name: 'Bathrooms & Vanities (x3)',
      zoneType: 'Bathroom',
      areaSqFt: Math.round(195 * scale),
      flooringRateSqFt: 310,
      ceilingRateSqFt: 155,
      wallFinishRateSqFt: 220,
      millworkSqFt: Math.round(45 * scale),
      millworkRateSqFt: 1900,
      electricalLumpSum: Math.round(52000 * scale),
      includeFlooring: true,
      includeCeiling: true,
      includeWallFinish: true,
      includeMillwork: true,
      includeElectrical: true,
      finishSpec: 'Anti-skid stone tiles, moisture-resistant ceiling, floating WPC vanities & toughened glass',
    },
    {
      id: 'room-foyer',
      name: 'Foyer, Passage & Study Nook',
      zoneType: 'Foyer & Utility',
      areaSqFt: Math.round(180 * scale),
      flooringRateSqFt: 250,
      ceilingRateSqFt: 130,
      wallFinishRateSqFt: 125,
      millworkSqFt: Math.round(55 * scale),
      millworkRateSqFt: 1680,
      electricalLumpSum: Math.round(36000 * scale),
      includeFlooring: true,
      includeCeiling: true,
      includeWallFinish: true,
      includeMillwork: true,
      includeElectrical: true,
      finishSpec: 'Fluted timber entry cladding, concealed shoe cabinet, warm 3000K linear wash',
    },
  ];
}

const INITIAL_MILLWORK: MillworkLineItem[] = [
  {
    id: 'mw-kitchen',
    name: 'L-Shape Modular Kitchen (Base + Wall + Tall Pantry)',
    room: 'Modular Kitchen',
    category: 'Modular Kitchen',
    widthFt: 22,
    heightFt: 7.5,
    unit: 'sq.ft',
    quantity: 165,
    rate: 2250,
    coreMaterial: '18mm BWP Marine Ply + Acrylic',
    hardwareSpec: 'Hettich InnoTech Soft-Close',
  },
  {
    id: 'mw-master-wardrobe',
    name: 'Master Bedroom Sliding Wardrobe with Loft',
    room: 'Master Suite',
    category: 'Wardrobe',
    widthFt: 11,
    heightFt: 9.5,
    unit: 'sq.ft',
    quantity: 105,
    rate: 1980,
    coreMaterial: '18mm HDHMR + Fluted Glass / Veneer',
    hardwareSpec: 'Hafele Top-Hung Soft Slider',
  },
  {
    id: 'mw-guest-wardrobes',
    name: 'Guest & Kids Hinged Wardrobes (2 Units)',
    room: 'Bedrooms',
    category: 'Wardrobe',
    widthFt: 15,
    heightFt: 9,
    unit: 'sq.ft',
    quantity: 135,
    rate: 1680,
    coreMaterial: '18mm Commercial BWR + Matte Laminate',
    hardwareSpec: 'Ebco / Hettich Sensys Hinges',
  },
  {
    id: 'mw-tv-crockery',
    name: 'Floating Living TV Console & Crockery Unit',
    room: 'Living & Dining',
    category: 'TV & Storage',
    widthFt: 14,
    heightFt: 6.5,
    unit: 'sq.ft',
    quantity: 91,
    rate: 1720,
    coreMaterial: 'BWR Ply + Oak Veneer & PU Polish',
    hardwareSpec: 'Push-to-Open Channels',
  },
  {
    id: 'mw-ceiling-main',
    name: 'Saint-Gobain Gypsum False Ceiling & Cove Profile',
    room: 'All Living & Bedrooms',
    category: 'False Ceiling',
    widthFt: 0,
    heightFt: 0,
    unit: 'sq.ft',
    quantity: 1480,
    rate: 132,
    coreMaterial: '12.5mm Gypboard + GI 0.55mm Framing',
    hardwareSpec: 'Recessed Magnetic Track & LED Cove',
  },
  {
    id: 'mw-panelling',
    name: 'Foyer & Master Headboard Fluted WPC / Charcoal Louvers',
    room: 'Foyer & Master',
    category: 'Wall Panelling',
    widthFt: 16,
    heightFt: 9,
    unit: 'sq.ft',
    quantity: 144,
    rate: 620,
    coreMaterial: 'High-Density Charcoal & Timber Louvers',
    hardwareSpec: 'Concealed Aluminium Sub-frame',
  },
];

const INITIAL_SPECS: InteriorSpecItem[] = [
  {
    id: 'spec-tiles',
    name: 'Italian-Format Matte Porcelain Flooring (1200x1200mm)',
    trade: 'Flooring & Stone',
    brandSpec: 'Kajaria Eternity / Simpolo',
    unit: 'sq.ft',
    quantity: 1650,
    rate: 245,
    marketKeyword: 'tiles',
  },
  {
    id: 'spec-quartz',
    name: 'Engineered Quartz Countertop & Backsplash (20mm)',
    trade: 'Flooring & Stone',
    brandSpec: 'Caesarstone / KalingaStone',
    unit: 'sq.ft',
    quantity: 85,
    rate: 580,
    marketKeyword: 'granite',
  },
  {
    id: 'spec-lighting',
    name: 'Architectural COB Downlights, Linear Profiles & Smart Dimmers',
    trade: 'Lighting & Automation',
    brandSpec: 'Philips / Wipro / Schneider',
    unit: 'nos',
    quantity: 84,
    rate: 1650,
    marketKeyword: 'electrical',
  },
  {
    id: 'spec-paint',
    name: 'Low-VOC Luxury Emulsion & Limewash Accent Walls (2+2 Coats)',
    trade: 'Wall Treatments',
    brandSpec: 'Asian Paints Royale Aspira',
    unit: 'sq.ft',
    quantity: 4800,
    rate: 44,
    marketKeyword: 'paint',
  },
  {
    id: 'spec-sanitary',
    name: 'Concealed Cisterns, Wall-Hung WCs, Diverters & Rain Showers',
    trade: 'Sanitary & CP',
    brandSpec: 'Kohler / Jaquar Artize',
    unit: 'sets',
    quantity: 3,
    rate: 48500,
    marketKeyword: 'plumbing',
  },
  {
    id: 'spec-ffe',
    name: 'Loose Furniture Package (Sectional Sofa, Dining 6-Seater, Beds, Drapery)',
    trade: 'Loose FF&E',
    brandSpec: 'Custom Studio Upholstery & Solid Teak',
    unit: 'package',
    quantity: 1,
    rate: 540000,
    marketKeyword: 'furniture',
  },
];

export const InteriorView: React.FC<InteriorViewProps> = ({
  activeProject,
  currency,
  boqItems,
  onUpdateBOQItems,
  onNavigateToBOQ,
  onNavigateToMarketplace,
}) => {
  const [subTab, setSubTab] = useState<InteriorSubTab>('rooms');
  const [tier, setTier] = useState<InteriorTier>('signature');
  const [designTheme, setDesignTheme] = useState<string>(DESIGN_THEMES[0]);

  const [rooms, setRooms] = useState<InteriorRoomItem[]>(() =>
    createDefaultRooms(activeProject?.builtUpAreaSqFt || 3200)
  );
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [isAddingRoom, setIsAddingRoom] = useState<boolean>(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomZone, setNewRoomZone] = useState<InteriorRoomItem['zoneType']>('Bedroom');
  const [newRoomArea, setNewRoomArea] = useState<number>(220);

  const [millworkItems, setMillworkItems] = useState<MillworkLineItem[]>(INITIAL_MILLWORK);
  const [isAddingMillwork, setIsAddingMillwork] = useState<boolean>(false);
  const [newMwName, setNewMwName] = useState('');
  const [newMwRoom, setNewMwRoom] = useState('Living & Dining');
  const [newMwCat, setNewMwCat] = useState<MillworkLineItem['category']>('TV & Storage');
  const [newMwQty, setNewMwQty] = useState<number>(60);
  const [newMwRate, setNewMwRate] = useState<number>(1750);

  const [specItems, setSpecItems] = useState<InteriorSpecItem[]>(INITIAL_SPECS);
  const [specTradeFilter, setSpecTradeFilter] = useState<string>('all');
  const [syncedIds, setSyncedIds] = useState<string[]>([]);
  const [toastMsg, setToastMsg] = useState<{ text: string; showBoqLink?: boolean } | null>(null);

  const tierMultiplier = TIER_CONFIG[tier].multiplier;

  const showToast = (text: string, showBoqLink = false) => {
    setToastMsg({ text, showBoqLink });
    setTimeout(() => setToastMsg(null), 5000);
  };

  // Calculate single room total adjusted for finish tier
  const computeRoomBreakdown = (room: InteriorRoomItem) => {
    const flooring = room.includeFlooring
      ? Math.round(room.areaSqFt * room.flooringRateSqFt * tierMultiplier)
      : 0;
    const ceiling = room.includeCeiling
      ? Math.round(room.areaSqFt * room.ceilingRateSqFt * tierMultiplier)
      : 0;
    const wallFinish = room.includeWallFinish
      ? Math.round(room.areaSqFt * room.wallFinishRateSqFt * tierMultiplier)
      : 0;
    const millwork = room.includeMillwork
      ? Math.round(room.millworkSqFt * room.millworkRateSqFt * tierMultiplier)
      : 0;
    const electrical = room.includeElectrical
      ? Math.round(room.electricalLumpSum * tierMultiplier)
      : 0;
    const total = flooring + ceiling + wallFinish + millwork + electrical;
    return { flooring, ceiling, wallFinish, millwork, electrical, total };
  };

  // Summary metrics
  const totals = useMemo(() => {
    let totalRoomArea = 0;
    let totalMillworkSqFt = 0;
    let flooringTotal = 0;
    let ceilingTotal = 0;
    let wallTotal = 0;
    let millworkTotal = 0;
    let electricalTotal = 0;
    let roomsGrandTotal = 0;

    rooms.forEach((r) => {
      totalRoomArea += r.areaSqFt;
      if (r.includeMillwork) totalMillworkSqFt += r.millworkSqFt;
      const b = computeRoomBreakdown(r);
      flooringTotal += b.flooring;
      ceilingTotal += b.ceiling;
      wallTotal += b.wallFinish;
      millworkTotal += b.millwork;
      electricalTotal += b.electrical;
      roomsGrandTotal += b.total;
    });

    const millworkCatalogTotal = millworkItems.reduce(
      (s, m) => s + Math.round(m.quantity * m.rate * tierMultiplier),
      0
    );
    const specsTotal = specItems.reduce(
      (s, sp) => s + Math.round(sp.quantity * sp.rate * tierMultiplier),
      0
    );

    const interiorBoqItems = boqItems.filter(
      (b) => b.stage === 'Finishes' || b.id.startsWith('boq-int-')
    );
    const interiorBoqTotal = interiorBoqItems.reduce((s, b) => s + (b.amount || 0), 0);

    return {
      totalRoomArea,
      totalMillworkSqFt,
      flooringTotal,
      ceilingTotal,
      wallTotal,
      millworkTotal,
      electricalTotal,
      roomsGrandTotal,
      ratePerSqFt: totalRoomArea > 0 ? Math.round(roomsGrandTotal / totalRoomArea) : 0,
      millworkCatalogTotal,
      specsTotal,
      interiorBoqCount: interiorBoqItems.length,
      interiorBoqTotal,
    };
  }, [rooms, millworkItems, specItems, tierMultiplier, boqItems]);

  // Trade allocation breakdown for Tender tab
  const tradeBreakdown = useMemo(() => {
    const entries = [
      { trade: 'Custom Millwork & Modular Joinery', amount: totals.millworkTotal },
      { trade: 'Flooring, Marble & Stone Cladding', amount: totals.flooringTotal },
      { trade: 'Electrical, Lighting & Smart Automation', amount: totals.electricalTotal },
      { trade: 'Gypsum False Ceiling & Acoustic Works', amount: totals.ceilingTotal },
      { trade: 'Wall Finishes, Veneers & Luxury Paint', amount: totals.wallTotal },
    ];
    const grand = entries.reduce((s, e) => s + e.amount, 0) || 1;
    return entries.map((e) => ({
      ...e,
      percent: Math.round((e.amount / grand) * 100),
    }));
  }, [totals]);

  const filteredSpecs = useMemo(() => {
    if (specTradeFilter === 'all') return specItems;
    return specItems.filter((s) => s.trade === specTradeFilter);
  }, [specItems, specTradeFilter]);

  // Sync helpers to Project BOQ
  const upsertBoqItems = (newItems: BOQItem[], feedback: string) => {
    const map = new Map<string, BOQItem>();
    boqItems.forEach((b) => map.set(b.id, b));
    newItems.forEach((n) => {
      const withFloors = ensureItemFloorBreakdown(n, activeProject?.floors);
      map.set(withFloors.id, withFloors);
    });
    const merged = Array.from(map.values());
    onUpdateBOQItems(merged);
    showToast(feedback, Boolean(onNavigateToBOQ));
  };

  const handleSyncRoomToBOQ = (room: InteriorRoomItem) => {
    const b = computeRoomBreakdown(room);
    if (b.total <= 0) return;
    const itemId = `boq-int-room-${room.id}`;
    const newItem: BOQItem = {
      id: itemId,
      name: `Interior Fit-Out: ${room.name} (${TIER_CONFIG[tier].label} · ${designTheme})`,
      category: 'Interior Architecture',
      unit: 'sq.ft',
      quantity: room.areaSqFt,
      rate: Math.round(b.total / Math.max(1, room.areaSqFt)),
      amount: b.total,
      notes: `${room.finishSpec} · Flooring, Ceiling, Wall Finishes, Millwork & Lighting`,
      stage: 'Finishes',
      status: 'estimated',
      materialComponent: Math.round(b.total * 0.68),
      laborComponent: Math.round(b.total * 0.24),
      overheadComponent: Math.round(b.total * 0.08),
    };
    upsertBoqItems(
      [newItem],
      `Synced "${room.name}" interior package (${formatCurrency(b.total, currency)}) to Project BOQ.`
    );
    setSyncedIds((prev) => (prev.includes(room.id) ? prev : [...prev, room.id]));
  };

  const handleSyncAllRoomsToBOQ = () => {
    const batch: BOQItem[] = rooms
      .map((room) => {
        const b = computeRoomBreakdown(room);
        return {
          id: `boq-int-room-${room.id}`,
          name: `Interior Fit-Out: ${room.name} (${TIER_CONFIG[tier].label})`,
          category: 'Interior Architecture',
          unit: 'sq.ft',
          quantity: room.areaSqFt,
          rate: Math.round(b.total / Math.max(1, room.areaSqFt)),
          amount: b.total,
          notes: `${designTheme} · ${room.finishSpec}`,
          stage: 'Finishes' as const,
          status: 'estimated' as const,
          materialComponent: Math.round(b.total * 0.68),
          laborComponent: Math.round(b.total * 0.24),
          overheadComponent: Math.round(b.total * 0.08),
        };
      })
      .filter((x) => x.amount > 0);

    upsertBoqItems(
      batch,
      `Synced all ${batch.length} interior room packages (${formatCurrency(
        totals.roomsGrandTotal,
        currency
      )}) to Project BOQ.`
    );
    setSyncedIds((prev) => Array.from(new Set([...prev, ...rooms.map((r) => r.id)])));
  };

  const handleSyncMillworkToBOQ = (mw: MillworkLineItem) => {
    const adjRate = Math.round(mw.rate * tierMultiplier);
    const amount = Math.round(mw.quantity * adjRate);
    const itemId = `boq-int-mw-${mw.id}`;
    const newItem: BOQItem = {
      id: itemId,
      name: `Interior Millwork: ${mw.name}`,
      category: 'Carpentry & Joinery',
      unit: mw.unit,
      quantity: mw.quantity,
      rate: adjRate,
      amount,
      notes: `${mw.room} · ${mw.coreMaterial} · ${mw.hardwareSpec}`,
      stage: 'Finishes',
      status: 'estimated',
      materialComponent: Math.round(amount * 0.65),
      laborComponent: Math.round(amount * 0.3),
      overheadComponent: Math.round(amount * 0.05),
    };
    upsertBoqItems(
      [newItem],
      `Synced "${mw.name}" (${formatCurrency(amount, currency)}) to Project BOQ.`
    );
    setSyncedIds((prev) => (prev.includes(mw.id) ? prev : [...prev, mw.id]));
  };

  const handleSyncSpecToBOQ = (sp: InteriorSpecItem) => {
    const adjRate = Math.round(sp.rate * tierMultiplier);
    const amount = Math.round(sp.quantity * adjRate);
    const itemId = `boq-int-spec-${sp.id}`;
    const stage: BOQItem['stage'] =
      sp.trade === 'Lighting & Automation' || sp.trade === 'Sanitary & CP' ? 'Services' : 'Finishes';

    const newItem: BOQItem = {
      id: itemId,
      name: `Interior Spec: ${sp.name}`,
      category: sp.trade,
      unit: sp.unit,
      quantity: sp.quantity,
      rate: adjRate,
      amount,
      notes: `Brand: ${sp.brandSpec} · Tier: ${TIER_CONFIG[tier].label}`,
      stage,
      status: 'estimated',
    };
    upsertBoqItems(
      [newItem],
      `Synced "${sp.name}" (${formatCurrency(amount, currency)}) to Project BOQ.`
    );
    setSyncedIds((prev) => (prev.includes(sp.id) ? prev : [...prev, sp.id]));
  };

  const handleAddRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim() || newRoomArea <= 0) return;
    const isWetOrKitchen = newRoomZone === 'Kitchen' || newRoomZone === 'Bathroom';
    const created: InteriorRoomItem = {
      id: `room-custom-${Date.now()}`,
      name: newRoomName.trim(),
      zoneType: newRoomZone,
      areaSqFt: Math.round(newRoomArea),
      flooringRateSqFt: isWetOrKitchen ? 275 : 235,
      ceilingRateSqFt: 130,
      wallFinishRateSqFt: isWetOrKitchen ? 185 : 95,
      millworkSqFt: Math.round(newRoomArea * 0.35),
      millworkRateSqFt: newRoomZone === 'Kitchen' ? 2200 : 1750,
      electricalLumpSum: Math.round(newRoomArea * 185),
      includeFlooring: true,
      includeCeiling: true,
      includeWallFinish: true,
      includeMillwork: true,
      includeElectrical: true,
      finishSpec: `${designTheme} finishes, gypsum ceiling, custom joinery & warm LED points`,
    };
    setRooms((prev) => [...prev, created]);
    setNewRoomName('');
    setNewRoomArea(220);
    setIsAddingRoom(false);
    showToast(`Added "${created.name}" to interior schedule.`);
  };

  const handleAddMillworkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMwName.trim() || newMwQty <= 0) return;
    const created: MillworkLineItem = {
      id: `mw-custom-${Date.now()}`,
      name: newMwName.trim(),
      room: newMwRoom.trim() || 'General',
      category: newMwCat,
      widthFt: 10,
      heightFt: 6,
      unit: newMwCat === 'False Ceiling' ? 'sq.ft' : 'sq.ft',
      quantity: Math.round(newMwQty),
      rate: Math.round(newMwRate),
      coreMaterial: '18mm BWR Marine Ply + Laminate',
      hardwareSpec: 'Soft-Close Architectural Hardware',
    };
    setMillworkItems((prev) => [created, ...prev]);
    setNewMwName('');
    setNewMwQty(60);
    setIsAddingMillwork(false);
    showToast(`Added "${created.name}" to millwork schedule.`);
  };

  const handleExportCsv = () => {
    const escapeCsv = (val: string | number) => {
      const s = String(val ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    const headers = [
      'Space / Room',
      'Zone Type',
      'Area (sq.ft)',
      'Flooring Cost',
      'Ceiling Cost',
      'Wall Finish Cost',
      'Millwork Cost',
      'Lighting & Electrical',
      'Room Total',
      'Finish Specification',
    ];

    const rows = rooms.map((r) => {
      const b = computeRoomBreakdown(r);
      return [
        escapeCsv(r.name),
        escapeCsv(r.zoneType),
        r.areaSqFt,
        b.flooring,
        b.ceiling,
        b.wallFinish,
        b.millwork,
        b.electrical,
        b.total,
        escapeCsv(r.finishSpec),
      ];
    });

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(activeProject?.name || 'Project').replace(/\s+/g, '_')}_Interior_Costing.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Exported Interior Architecture & Fit-Out Cost Sheet to CSV.');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Executive Header + Controls + Sub-Navigation */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 px-5 pt-5 space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Interior Architecture &amp; Fit-Out Costing
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              {activeProject?.name} · {activeProject?.location} · Room-by-room fit-out estimation, custom millwork takeoff, and direct BOQ sync.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Finish Tier Selector */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-950 border border-slate-800">
              {(['essential', 'signature', 'luxury'] as InteriorTier[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTier(t)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    tier === t
                      ? 'bg-amber-500 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {TIER_CONFIG[t].label}
                </button>
              ))}
            </div>

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
              onClick={handleSyncAllRoomsToBOQ}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Sync All to BOQ</span>
            </button>
          </div>
        </div>

        {/* Sub-Tab Bar */}
        <div className="flex items-center gap-1 overflow-x-auto border-t border-slate-800 pt-1">
          {[
            { id: 'rooms' as const, label: `Room-by-Room Estimator (${rooms.length})`, icon: Sofa },
            { id: 'millwork' as const, label: `Millwork & Ceilings (${millworkItems.length})`, icon: DoorOpen },
            { id: 'specs' as const, label: `Lighting, Stone & FF&E (${specItems.length})`, icon: Lightbulb },
            { id: 'tender' as const, label: 'Trade Split & Tender Brief', icon: PieChart },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id)}
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
      {toastMsg && (
        <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-xs text-amber-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toastMsg.text}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {toastMsg.showBoqLink && onNavigateToBOQ && (
              <button
                type="button"
                onClick={() => {
                  setToastMsg(null);
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
              onClick={() => setToastMsg(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">
            Interior Fit-Out Budget ({TIER_CONFIG[tier].label})
          </div>
          <div className="text-xl font-bold text-white tabular-nums">
            {formatCurrency(totals.roomsGrandTotal, currency)}
          </div>
          <div className="text-xs text-amber-400 tabular-nums">
            Avg {formatCurrency(totals.ratePerSqFt, currency)} / sq.ft
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">Scheduled Carpet Area</div>
          <div className="text-xl font-bold text-white tabular-nums">
            {totals.totalRoomArea.toLocaleString()} sq.ft
          </div>
          <div className="text-xs text-slate-400 tabular-nums">
            Across {rooms.length} interior zones
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">Custom Millwork &amp; Joinery</div>
          <div className="text-xl font-bold text-white tabular-nums">
            {formatCurrency(totals.millworkTotal, currency)}
          </div>
          <div className="text-xs text-slate-400 tabular-nums">
            {totals.totalMillworkSqFt.toLocaleString()} sq.ft elevation joinery
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">Project BOQ Finishes Sync</div>
          <div className="text-xl font-bold text-emerald-400 tabular-nums">
            {formatCurrency(totals.interiorBoqTotal, currency)}
          </div>
          <div className="text-xs text-slate-400 tabular-nums">
            {totals.interiorBoqCount} items currently in BOQ
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: ROOM-BY-ROOM FIT-OUT ESTIMATOR                                 */}
      {/* ===================================================================== */}
      {subTab === 'rooms' && (
        <div className="space-y-4">
          {/* Style & Tier Info Strip */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-slate-300 font-medium">Concept Direction:</span>
                <select
                  value={designTheme}
                  onChange={(e) => setDesignTheme(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-400"
                >
                  {DESIGN_THEMES.map((theme) => (
                    <option key={theme} value={theme}>
                      {theme}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-slate-400">{TIER_CONFIG[tier].summary}</span>
            </div>

            <button
              type="button"
              onClick={() => setIsAddingRoom((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Add Interior Zone</span>
            </button>
          </div>

          {/* Add Room Inline Form */}
          {isAddingRoom && (
            <form
              onSubmit={handleAddRoomSubmit}
              className="p-4 rounded-xl bg-slate-900 border border-amber-500/40 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-medium mb-1">Zone / Room Name *</label>
                <input
                  type="text"
                  required
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. Home Theater / Study"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Zone Category</label>
                <select
                  value={newRoomZone}
                  onChange={(e) =>
                    setNewRoomZone(e.target.value as InteriorRoomItem['zoneType'])
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="Living & Dining">Living &amp; Dining</option>
                  <option value="Kitchen">Kitchen</option>
                  <option value="Bedroom">Bedroom</option>
                  <option value="Bathroom">Bathroom</option>
                  <option value="Home Office">Home Office</option>
                  <option value="Foyer & Utility">Foyer &amp; Utility</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Carpet Area (sq.ft)</label>
                <input
                  type="number"
                  min={20}
                  value={newRoomArea}
                  onChange={(e) => setNewRoomArea(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white tabular-nums focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold"
                >
                  Add Room
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingRoom(false)}
                  className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Room Schedule Table */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                    <th className="py-3 pl-4 pr-3 font-medium whitespace-nowrap">Space / Room</th>
                    <th className="py-3 px-3 font-medium text-right whitespace-nowrap">Area (sq.ft)</th>
                    <th className="py-3 px-3 font-medium text-right whitespace-nowrap">Flooring &amp; Walls</th>
                    <th className="py-3 px-3 font-medium text-right whitespace-nowrap">False Ceiling</th>
                    <th className="py-3 px-3 font-medium text-right whitespace-nowrap">Millwork / Joinery</th>
                    <th className="py-3 px-3 font-medium text-right whitespace-nowrap">Lighting &amp; Elec</th>
                    <th className="py-3 px-3 font-medium text-right whitespace-nowrap">Room Total</th>
                    <th className="py-3 pl-3 pr-4 font-medium text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {rooms.map((room) => {
                    const b = computeRoomBreakdown(room);
                    const isEditing = editingRoomId === room.id;
                    const isSynced = syncedIds.includes(room.id);

                    return (
                      <React.Fragment key={room.id}>
                        <tr className="hover:bg-slate-800/35 transition-colors">
                          <td className="py-3.5 pl-4 pr-3 min-w-[220px]">
                            <div className="font-semibold text-white">{room.name}</div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[280px]">
                              {room.zoneType} · {room.finishSpec}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-right text-slate-200 tabular-nums whitespace-nowrap">
                            {isEditing ? (
                              <input
                                type="number"
                                min={10}
                                value={room.areaSqFt}
                                onChange={(e) =>
                                  setRooms((prev) =>
                                    prev.map((r) =>
                                      r.id === room.id
                                        ? { ...r, areaSqFt: Math.max(10, Number(e.target.value) || 0) }
                                        : r
                                    )
                                  )
                                }
                                className="w-20 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-right text-white tabular-nums"
                              />
                            ) : (
                              `${room.areaSqFt.toLocaleString()}`
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-right text-slate-300 tabular-nums whitespace-nowrap">
                            {formatCurrency(b.flooring + b.wallFinish, currency)}
                          </td>
                          <td className="py-3.5 px-3 text-right text-slate-300 tabular-nums whitespace-nowrap">
                            {formatCurrency(b.ceiling, currency)}
                          </td>
                          <td className="py-3.5 px-3 text-right text-slate-300 tabular-nums whitespace-nowrap">
                            {formatCurrency(b.millwork, currency)}
                          </td>
                          <td className="py-3.5 px-3 text-right text-slate-300 tabular-nums whitespace-nowrap">
                            {formatCurrency(b.electrical, currency)}
                          </td>
                          <td className="py-3.5 px-3 text-right font-bold text-white tabular-nums whitespace-nowrap">
                            {formatCurrency(b.total, currency)}
                          </td>
                          <td className="py-3.5 pl-3 pr-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingRoomId(isEditing ? null : room.id)}
                                title="Edit room scope & rates"
                                className={`p-1.5 rounded-lg border transition-colors ${
                                  isEditing
                                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                                }`}
                              >
                                {isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSyncRoomToBOQ(room)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                  isSynced
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                                }`}
                              >
                                {isSynced ? 'Synced' : '+ BOQ'}
                              </button>
                              {rooms.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRooms((prev) => prev.filter((r) => r.id !== room.id))
                                  }
                                  title="Remove room"
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {isEditing && (
                          <tr className="bg-slate-950/70">
                            <td colSpan={8} className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                <div className="space-y-2">
                                  <div className="font-semibold text-white">Scope Toggles</div>
                                  <div className="grid grid-cols-2 gap-2">
                                    {[
                                      { key: 'includeFlooring' as const, label: 'Flooring' },
                                      { key: 'includeCeiling' as const, label: 'False Ceiling' },
                                      { key: 'includeWallFinish' as const, label: 'Wall Finishes' },
                                      { key: 'includeMillwork' as const, label: 'Millwork' },
                                      { key: 'includeElectrical' as const, label: 'Lighting/Elec' },
                                    ].map((toggle) => (
                                      <label
                                        key={toggle.key}
                                        className="flex items-center gap-2 text-slate-300 cursor-pointer"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={room[toggle.key]}
                                          onChange={(e) =>
                                            setRooms((prev) =>
                                              prev.map((r) =>
                                                r.id === room.id
                                                  ? { ...r, [toggle.key]: e.target.checked }
                                                  : r
                                              )
                                            )
                                          }
                                          className="rounded bg-slate-900 border-slate-700 text-amber-500"
                                        />
                                        <span>{toggle.label}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="font-semibold text-white">Millwork &amp; Unit Rates (INR)</div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="text-[11px] text-slate-400 block">
                                        Millwork Area (sq.ft)
                                      </label>
                                      <input
                                        type="number"
                                        min={0}
                                        value={room.millworkSqFt}
                                        onChange={(e) =>
                                          setRooms((prev) =>
                                            prev.map((r) =>
                                              r.id === room.id
                                                ? { ...r, millworkSqFt: Number(e.target.value) || 0 }
                                                : r
                                            )
                                          )
                                        }
                                        className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-800 text-white tabular-nums"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[11px] text-slate-400 block">
                                        Millwork Rate / sq.ft
                                      </label>
                                      <input
                                        type="number"
                                        min={0}
                                        value={room.millworkRateSqFt}
                                        onChange={(e) =>
                                          setRooms((prev) =>
                                            prev.map((r) =>
                                              r.id === room.id
                                                ? {
                                                    ...r,
                                                    millworkRateSqFt: Number(e.target.value) || 0,
                                                  }
                                                : r
                                            )
                                          )
                                        }
                                        className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-800 text-white tabular-nums"
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="font-semibold text-white">Room Finish Spec Note</div>
                                  <input
                                    type="text"
                                    value={room.finishSpec}
                                    onChange={(e) =>
                                      setRooms((prev) =>
                                        prev.map((r) =>
                                          r.id === room.id ? { ...r, finishSpec: e.target.value } : r
                                        )
                                      )
                                    }
                                    className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-white"
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: MILLWORK, KITCHEN & CEILINGS                                   */}
      {/* ===================================================================== */}
      {subTab === 'millwork' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white">
                Custom Carpentry, Modular Kitchen &amp; Ceiling Takeoff
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
                Detailed joinery catalog total ({TIER_CONFIG[tier].label} Tier):{' '}
                <strong className="text-amber-400">
                  {formatCurrency(totals.millworkCatalogTotal, currency)}
                </strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingMillwork((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Joinery Item</span>
            </button>
          </div>

          {isAddingMillwork && (
            <form
              onSubmit={handleAddMillworkSubmit}
              className="p-4 rounded-xl bg-slate-900 border border-amber-500/40 grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs"
            >
              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-medium mb-1">Joinery / Ceiling Item *</label>
                <input
                  type="text"
                  required
                  value={newMwName}
                  onChange={(e) => setNewMwName(e.target.value)}
                  placeholder="e.g. Master Vanity + Mirror Cabinet"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Category</label>
                <select
                  value={newMwCat}
                  onChange={(e) => setNewMwCat(e.target.value as MillworkLineItem['category'])}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="Modular Kitchen">Modular Kitchen</option>
                  <option value="Wardrobe">Wardrobe</option>
                  <option value="TV & Storage">TV &amp; Storage</option>
                  <option value="False Ceiling">False Ceiling</option>
                  <option value="Wall Panelling">Wall Panelling</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Area (sq.ft) / Rate</label>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    min={1}
                    value={newMwQty}
                    onChange={(e) => setNewMwQty(Number(e.target.value) || 1)}
                    className="w-1/2 px-2 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white tabular-nums"
                  />
                  <input
                    type="number"
                    min={1}
                    value={newMwRate}
                    onChange={(e) => setNewMwRate(Number(e.target.value) || 0)}
                    className="w-1/2 px-2 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white tabular-nums"
                  />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold"
                >
                  Add Item
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingMillwork(false)}
                  className="py-2 px-3 rounded-lg bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                    <th className="py-3 pl-4 pr-3 font-medium whitespace-nowrap">Joinery / Ceiling Element</th>
                    <th className="py-3 px-3 font-medium whitespace-nowrap">Core &amp; Hardware Spec</th>
                    <th className="py-3 px-3 font-medium text-right whitespace-nowrap">Quantity</th>
                    <th className="py-3 px-3 font-medium text-right whitespace-nowrap">Adjusted Rate</th>
                    <th className="py-3 px-3 font-medium text-right whitespace-nowrap">Line Total</th>
                    <th className="py-3 pl-3 pr-4 font-medium text-right whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {millworkItems.map((mw) => {
                    const adjRate = Math.round(mw.rate * tierMultiplier);
                    const total = Math.round(mw.quantity * adjRate);
                    const isSynced = syncedIds.includes(mw.id);

                    return (
                      <tr key={mw.id} className="hover:bg-slate-800/35 transition-colors">
                        <td className="py-3.5 pl-4 pr-3 min-w-[230px]">
                          <div className="font-semibold text-white">{mw.name}</div>
                          <div className="text-[11px] text-slate-400">
                            {mw.category} · {mw.room}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-slate-300 min-w-[210px]">
                          <div>{mw.coreMaterial}</div>
                          <div className="text-[11px] text-slate-400">{mw.hardwareSpec}</div>
                        </td>
                        <td className="py-3.5 px-3 text-right tabular-nums whitespace-nowrap">
                          <input
                            type="number"
                            min={1}
                            value={mw.quantity}
                            onChange={(e) =>
                              setMillworkItems((prev) =>
                                prev.map((item) =>
                                  item.id === mw.id
                                    ? { ...item, quantity: Math.max(1, Number(e.target.value) || 1) }
                                    : item
                                )
                              )
                            }
                            className="w-20 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-right text-white tabular-nums mr-1.5"
                          />
                          <span className="text-slate-400">{mw.unit}</span>
                        </td>
                        <td className="py-3.5 px-3 text-right text-slate-200 tabular-nums whitespace-nowrap">
                          {formatCurrency(adjRate, currency)}
                        </td>
                        <td className="py-3.5 px-3 text-right font-bold text-white tabular-nums whitespace-nowrap">
                          {formatCurrency(total, currency)}
                        </td>
                        <td className="py-3.5 pl-3 pr-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleSyncMillworkToBOQ(mw)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              isSynced
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                            }`}
                          >
                            {isSynced ? 'Synced to BOQ' : '+ Push to BOQ'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: LIGHTING, STONE & FF&E SCHEDULE                                */}
      {/* ===================================================================== */}
      {subTab === 'specs' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                'all',
                'Flooring & Stone',
                'Lighting & Automation',
                'Wall Treatments',
                'Sanitary & CP',
                'Loose FF&E',
              ].map((trade) => (
                <button
                  key={trade}
                  type="button"
                  onClick={() => setSpecTradeFilter(trade)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                    specTradeFilter === trade
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-semibold'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {trade === 'all' ? 'All Trades' : trade}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-400 tabular-nums shrink-0">
              Schedule Total:{' '}
              <strong className="text-white">{formatCurrency(totals.specsTotal, currency)}</strong>
            </div>
          </div>

          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                    <th className="py-3 pl-4 pr-3 font-medium whitespace-nowrap">Finish / FF&amp;E Spec</th>
                    <th className="py-3 px-3 font-medium whitespace-nowrap">Approved Brand</th>
                    <th className="py-3 px-3 font-medium text-right whitespace-nowrap">Qty</th>
                    <th className="py-3 px-3 font-medium text-right whitespace-nowrap">Unit Rate</th>
                    <th className="py-3 px-3 font-medium text-right whitespace-nowrap">Estimate</th>
                    <th className="py-3 pl-3 pr-4 font-medium text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredSpecs.map((sp) => {
                    const adjRate = Math.round(sp.rate * tierMultiplier);
                    const total = Math.round(sp.quantity * adjRate);
                    const isSynced = syncedIds.includes(sp.id);

                    return (
                      <tr key={sp.id} className="hover:bg-slate-800/35 transition-colors">
                        <td className="py-3.5 pl-4 pr-3 min-w-[230px]">
                          <div className="font-semibold text-white">{sp.name}</div>
                          <div className="text-[11px] text-slate-400">{sp.trade}</div>
                        </td>
                        <td className="py-3.5 px-3 text-slate-300 whitespace-nowrap">
                          {sp.brandSpec}
                        </td>
                        <td className="py-3.5 px-3 text-right tabular-nums whitespace-nowrap">
                          <input
                            type="number"
                            min={1}
                            value={sp.quantity}
                            onChange={(e) =>
                              setSpecItems((prev) =>
                                prev.map((item) =>
                                  item.id === sp.id
                                    ? { ...item, quantity: Math.max(1, Number(e.target.value) || 1) }
                                    : item
                                )
                              )
                            }
                            className="w-20 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-right text-white tabular-nums mr-1.5"
                          />
                          <span className="text-slate-400">{sp.unit}</span>
                        </td>
                        <td className="py-3.5 px-3 text-right text-slate-200 tabular-nums whitespace-nowrap">
                          {formatCurrency(adjRate, currency)}
                        </td>
                        <td className="py-3.5 px-3 text-right font-bold text-white tabular-nums whitespace-nowrap">
                          {formatCurrency(total, currency)}
                        </td>
                        <td className="py-3.5 pl-3 pr-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {onNavigateToMarketplace && (
                              <button
                                type="button"
                                onClick={() =>
                                  onNavigateToMarketplace('material_supplier', sp.marketKeyword)
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
                              >
                                Suppliers
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleSyncSpecToBOQ(sp)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                isSynced
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                              }`}
                            >
                              {isSynced ? 'Synced' : '+ BOQ'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: TRADE ALLOCATION & INTERIOR TENDER BRIEF                       */}
      {/* ===================================================================== */}
      {subTab === 'tender' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white">
                  Interior Cost Allocation by Trade
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Live distribution across all {rooms.length} zones in {TIER_CONFIG[tier].label} tier
                </p>
              </div>
              <span className="text-sm font-bold text-amber-400 tabular-nums">
                {formatCurrency(totals.roomsGrandTotal, currency)}
              </span>
            </div>

            <div className="space-y-4">
              {tradeBreakdown.map((t) => (
                <div key={t.trade} className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-200">{t.trade}</span>
                    <span className="text-slate-300 tabular-nums">
                      <strong className="text-white">{formatCurrency(t.amount, currency)}</strong> ·{' '}
                      {t.percent}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{ width: `${Math.max(4, t.percent)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <h2 className="text-sm sm:text-base font-bold text-white">
                Procure Interior Contractors &amp; Suppliers
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Theme: <strong className="text-white">{designTheme}</strong> · Finish Tier:{' '}
                <strong className="text-amber-400">{TIER_CONFIG[tier].label}</strong>
              </p>
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 text-xs text-slate-300">
                <div>1. Sync all room packages to Project BOQ to lock tender allowances.</div>
                <div>2. Export CSV schedule for interior turnkey contractor bidding.</div>
                <div>3. Source vetted interior architects &amp; finish suppliers in Marketplace.</div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleSyncAllRoomsToBOQ}
                className="w-full py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Sync Full Interior Estimate to Project BOQ</span>
              </button>

              {onNavigateToMarketplace && (
                <button
                  type="button"
                  onClick={() => onNavigateToMarketplace('architect', 'interior')}
                  className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                >
                  <Store className="w-4 h-4 text-amber-400" />
                  <span>Find Interior Designers &amp; Turnkey Vendors</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleExportCsv}
                className="w-full py-2.5 px-4 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 border border-slate-800 transition-colors"
              >
                <Download className="w-4 h-4 text-slate-400" />
                <span>Download Interior Cost Sheet (CSV)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteriorView;
