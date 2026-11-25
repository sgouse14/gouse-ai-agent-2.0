import React, { useState, useMemo } from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  FileSpreadsheet,
  Layers,
  MapPin,
  MessageSquare,
  Upload,
  Users,
  ChevronRight,
  Send,
  Eye,
  Camera,
  Check,
  Lock,
  ArrowRight,
  Phone,
  Mail,
  X,
  FileCheck,
  FolderOpen,
  Compass,
  LogOut,
  LogIn,
  LayoutDashboard,
  DollarSign,
  Activity,
  CheckSquare,
  Maximize2,
  Cpu,
  ClipboardList,
  Sliders,
  Plus,
  AlertCircle,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Calculator,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  Project,
  BOQItem,
  SharedDocument,
  FieldOperationItem,
  ClientFinishSelection,
  ProjectStatusUpdate,
  LiveMaterialPrice,
} from '../types';
import { CurrencyCode, formatCurrency } from '../utils/formatters';
import { SiteVisitCameraModal } from './SiteVisitCameraModal';
import { SmartHomeSkaAgent } from './SmartHomeSkaAgent';
import { AVATARS, PROJECT_MEDIA } from '../utils/mediaAssets';
import { INITIAL_LIVE_MATERIAL_PRICES } from '../data/initialData';
import { getMasterGuideLivePrices } from '../data/constructionMaterialsGuide';

interface ClientViewProps {
  projects: Project[];
  activeProjectId?: string;
  onSelectProject?: (projectId: string) => void;
  onUpdateProject?: (updatedProject: Project) => void;
  boqItems?: BOQItem[];
  contingencyPercent?: number;
  onUpdateBOQItems?: (items: BOQItem[]) => void;
  onReturnToPlatform?: () => void;
  onViewPublicPortal?: () => void;
  onOpenStudioTab?: (tab: 'boq' | 'materials' | 'projects') => void;
  currency?: CurrencyCode;
  isStaffPreview?: boolean;
  isUnauthenticatedOutside?: boolean;
}

type ClientTabId =
  | 'dashboard'
  | 'milestones'
  | 'change_orders'
  | 'selections'
  | 'updates'
  | 'documents'
  | 'team'
  | 'smart_home_ska';

interface SelectionCatalogCategory {
  categoryId: string;
  categoryName: string;
  allowanceAmount: number;
  options: Array<{
    tier: 'standard' | 'premium' | 'luxury';
    specTitle: string;
    selectedAmount: number;
    leadTime: string;
    notes: string;
  }>;
}

const SELECTION_CATALOG: SelectionCatalogCategory[] = [
  {
    categoryId: 'flooring-stone',
    categoryName: 'Flooring & Natural Stone',
    allowanceAmount: 1400000,
    options: [
      {
        tier: 'standard',
        specTitle: 'Kajaria Eternity Glazed Vitrified Slab (1200×2400mm)',
        selectedAmount: 1400000,
        leadTime: '7 Days',
        notes: 'Within turnkey allowance · Matte limestone finish across living & bedrooms.',
      },
      {
        tier: 'premium',
        specTitle: 'Crema Marfil & Indian Makrana Cut-to-Size Marble',
        selectedAmount: 1780000,
        leadTime: '18 Days',
        notes: 'Hand-selected lot with diamond-honed epoxy grouting.',
      },
      {
        tier: 'luxury',
        specTitle: 'Book-Matched Italian Statuario Marble & Burma Teak',
        selectedAmount: 2250000,
        leadTime: '28 Days',
        notes: 'Imported slab book-matching with acoustic sub-floor underlay.',
      },
    ],
  },
  {
    categoryId: 'sanitary-cp',
    categoryName: 'Sanitaryware & CP Fittings',
    allowanceAmount: 650000,
    options: [
      {
        tier: 'standard',
        specTitle: 'Kohler ModernLife Rimless & Brushed Chrome Mixers',
        selectedAmount: 650000,
        leadTime: '5 Days',
        notes: 'Within allowance · Dual-flush concealed cisterns across all suites.',
      },
      {
        tier: 'premium',
        specTitle: 'Grohe Essence Concealed Thermostatic & Duravit Wall-Hung',
        selectedAmount: 840000,
        leadTime: '14 Days',
        notes: 'Includes rain-shower ceiling diverters in master suites.',
      },
      {
        tier: 'luxury',
        specTitle: 'Gessi Brushed Brass Architectural Series & Smart Bidets',
        selectedAmount: 1180000,
        leadTime: '25 Days',
        notes: 'PVD warm brass finish with heated seat & integrated deodorizer.',
      },
    ],
  },
  {
    categoryId: 'facade-glazing',
    categoryName: 'Facade & Acoustic Glazing',
    allowanceAmount: 950000,
    options: [
      {
        tier: 'standard',
        specTitle: 'Schueco-Grade Powder-Coated Aluminium Double Glazing',
        selectedAmount: 950000,
        leadTime: '15 Days',
        notes: 'Within allowance · 24mm DGU clear toughened glass.',
      },
      {
        tier: 'premium',
        specTitle: 'Slim-Frame Thermal-Break Aluminium with Saint-Gobain Low-E',
        selectedAmount: 1240000,
        leadTime: '21 Days',
        notes: 'Reduces solar heat gain by 42% on West-facing elevations.',
      },
      {
        tier: 'luxury',
        specTitle: 'Motorized Minimal-Sightline Lift & Slide Acoustic Curtain',
        selectedAmount: 1620000,
        leadTime: '35 Days',
        notes: '42 dB acoustic attenuation with concealed floor track drainage.',
      },
    ],
  },
  {
    categoryId: 'lighting-controls',
    categoryName: 'Architectural Lighting & Controls',
    allowanceAmount: 520000,
    options: [
      {
        tier: 'standard',
        specTitle: 'Philips Architectural Recessed COB & Modular Plates',
        selectedAmount: 520000,
        leadTime: '7 Days',
        notes: 'Within allowance · 3000K warm anti-glare optics.',
      },
      {
        tier: 'premium',
        specTitle: 'DALI-2 Tunable Magnetic Track & Dimmer Scenes',
        selectedAmount: 710000,
        leadTime: '14 Days',
        notes: '2700K–4000K circadian dimming with wall keypad scenes.',
      },
      {
        tier: 'luxury',
        specTitle: 'Full KNX / Matter Scene Orchestration & Fluted Brass Sconces',
        selectedAmount: 960000,
        leadTime: '24 Days',
        notes: 'Synced directly to SKA IoT automation bus and presence sensors.',
      },
    ],
  },
  {
    categoryId: 'kitchen-millwork',
    categoryName: 'Modular Kitchen & Bespoke Joinery',
    allowanceAmount: 1280000,
    options: [
      {
        tier: 'standard',
        specTitle: 'BWP Marine Ply Carcass with Matte PU & Quartz Counter',
        selectedAmount: 1280000,
        leadTime: '20 Days',
        notes: 'Within allowance · Hettich soft-close hardware.',
      },
      {
        tier: 'premium',
        specTitle: 'Fluted Smoked Walnut Veneer & Kalinga Stone Waterfall Island',
        selectedAmount: 1590000,
        leadTime: '26 Days',
        notes: 'Concealed pocket-door pantry & Blum Legrabox drawers.',
      },
      {
        tier: 'luxury',
        specTitle: 'German Anti-Fingerprint Lacquer & Book-Matched Dekton Slab',
        selectedAmount: 2050000,
        leadTime: '36 Days',
        notes: 'Integrated Bora induction extraction & concealed wine conditioning.',
      },
    ],
  },
];

export const ClientView: React.FC<ClientViewProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onUpdateProject,
  boqItems = [],
  contingencyPercent = 10,
  onUpdateBOQItems,
  onReturnToPlatform,
  onViewPublicPortal,
  onOpenStudioTab,
  currency = 'INR',
  isStaffPreview = false,
  isUnauthenticatedOutside = false,
}) => {
  const { user, logout, openLoginModal } = useAuth();

  const assignedProjects = useMemo(() => {
    if (user && user.role === 'client') {
      return projects.filter((p) => {
        if (p.clientId && p.clientId === user.id) return true;
        if (p.clientEmail && p.clientEmail.toLowerCase() === user.email.toLowerCase()) return true;
        if (p.assignedClientIds && p.assignedClientIds.includes(user.id)) return true;
        if (
          p.members &&
          p.members.some((m) => m.email.toLowerCase() === user.email.toLowerCase() && m.role === 'client')
        ) {
          return true;
        }
        return false;
      });
    }
    if (!user) {
      const clientAssigned = projects.filter(
        (p) => p.clientId || p.clientEmail || (p.assignedClientIds && p.assignedClientIds.length > 0)
      );
      return clientAssigned.length > 0 ? clientAssigned : projects;
    }
    return projects;
  }, [projects, user]);

  const [selectedProjId, setSelectedProjId] = useState<string>(() => {
    if (activeProjectId && assignedProjects.some((p) => p.id === activeProjectId)) {
      return activeProjectId;
    }
    return assignedProjects[0]?.id || '';
  });

  const activeProject = useMemo(() => {
    return assignedProjects.find((p) => p.id === selectedProjId) || assignedProjects[0] || null;
  }, [assignedProjects, selectedProjId]);

  const [activeTab, setActiveTab] = useState<ClientTabId>('dashboard');
  const [isSiteCameraModalOpen, setIsSiteCameraModalOpen] = useState<boolean>(false);
  const [dashboardCameraAngle, setDashboardCameraAngle] = useState<'slab' | 'crane' | 'entrance'>('slab');
  const [updateCategoryFilter, setUpdateCategoryFilter] = useState<string>('all');
  const [docCategoryFilter, setDocCategoryFilter] = useState<string>('all');
  const [fieldFilter, setFieldFilter] = useState<'all' | 'change_order' | 'rfi' | 'snag'>('all');

  // Client Materials & Rates Sub-Navigation & Filter State
  const [materialsSubTab, setMaterialsSubTab] = useState<'selections' | 'rates' | 'estimator'>(
    'selections'
  );
  const [clientRateCategory, setClientRateCategory] = useState<string>('all');
  const [clientRateQuery, setClientRateQuery] = useState<string>('');
  const [clientRateBoqOnly, setClientRateBoqOnly] = useState<boolean>(false);
  const [calcSelectedRateId, setCalcSelectedRateId] = useState<string>('');
  const [calcQty, setCalcQty] = useState<number>(100);
  const [calcWastage, setCalcWastage] = useState<number>(5);

  // Modals & notifications
  const [previewDoc, setPreviewDoc] = useState<SharedDocument | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false);
  const [clientCommentText, setClientCommentText] = useState<string>('');
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  // Upload Form State
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocCategory, setNewDocCategory] = useState<SharedDocument['category']>('client_uploads');
  const [newDocFile, setNewDocFile] = useState<File | null>(null);
  const [newDocNotes, setNewDocNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Client Request / RFI Form State
  const [reqTitle, setReqTitle] = useState('');
  const [reqType, setReqType] = useState<'change_order' | 'rfi' | 'snag'>('rfi');
  const [reqTrade, setReqTrade] = useState<FieldOperationItem['trade']>('Finishes');
  const [reqNotes, setReqNotes] = useState('');

  // Milestone sign-off banner
  const [signedOffMilestoneId, setSignedOffMilestoneId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackBanner(msg);
    setTimeout(() => setFeedbackBanner(null), 3500);
  };

  const handleSelectProject = (id: string) => {
    setSelectedProjId(id);
    if (onSelectProject) onSelectProject(id);
  };

  // Live BOQ Accounting
  const boqAccounting = useMemo(() => {
    const subtotal = boqItems.reduce((sum, item) => sum + (item.amount || item.quantity * item.rate || 0), 0);
    const contingencyAmt = Math.round(subtotal * (contingencyPercent / 100));
    const authorizedTotal = subtotal + contingencyAmt;

    const stageBuckets: Record<string, { count: number; amount: number }> = {};
    boqItems.forEach((item) => {
      const stageKey = item.stage || item.category || 'General';
      if (!stageBuckets[stageKey]) stageBuckets[stageKey] = { count: 0, amount: 0 };
      stageBuckets[stageKey].count += 1;
      stageBuckets[stageKey].amount += item.amount || item.quantity * item.rate || 0;
    });

    return {
      subtotal,
      contingencyAmt,
      authorizedTotal,
      stageRows: Object.entries(stageBuckets)
        .map(([stage, val]) => ({ stage, ...val }))
        .sort((a, b) => b.amount - a.amount),
    };
  }, [boqItems, contingencyPercent]);

  // Finish Selections merged with defaults
  const activeSelections: ClientFinishSelection[] = useMemo(() => {
    const savedMap = new Map((activeProject?.clientSelections || []).map((s) => [s.categoryId, s]));
    return SELECTION_CATALOG.map((cat) => {
      const existing = savedMap.get(cat.categoryId);
      if (existing) return existing;
      const base = cat.options[0];
      return {
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        tier: base.tier,
        specTitle: base.specTitle,
        allowanceAmount: cat.allowanceAmount,
        selectedAmount: base.selectedAmount,
        approvedByClient: false,
        syncedToBoq: false,
      };
    });
  }, [activeProject?.clientSelections]);

  const selectionSummary = useMemo(() => {
    const totalAllowance = activeSelections.reduce((s, x) => s + x.allowanceAmount, 0);
    const totalSelected = activeSelections.reduce((s, x) => s + x.selectedAmount, 0);
    const netDelta = totalSelected - totalAllowance;
    const approvedCount = activeSelections.filter((x) => x.approvedByClient).length;
    return { totalAllowance, totalSelected, netDelta, approvedCount };
  }, [activeSelections]);

  // Client-Friendly Project Material Rate Directory (linked with live BOQ items)
  const allMaterialRates = useMemo(() => {
    const catalog: LiveMaterialPrice[] = [
      ...getMasterGuideLivePrices(),
      ...INITIAL_LIVE_MATERIAL_PRICES,
    ];
    return catalog.map((mat) => {
      const prefix = mat.name.toLowerCase().split('(')[0].trim();
      const keywords = prefix.split(/\s+/).slice(0, 2).join(' ');
      const matchedBoq = boqItems.find(
        (b) =>
          b.id === `boq-mat-${mat.id}` ||
          b.name.toLowerCase().includes(prefix) ||
          (keywords.length > 4 && b.name.toLowerCase().includes(keywords))
      );
      return {
        ...mat,
        inProjectBoq: !!matchedBoq,
        boqRate: matchedBoq?.rate,
        boqItemName: matchedBoq?.name,
      };
    });
  }, [boqItems]);

  const filteredClientRates = useMemo(() => {
    return allMaterialRates.filter((m) => {
      if (clientRateBoqOnly && !m.inProjectBoq) return false;
      if (
        clientRateCategory !== 'all' &&
        !m.category.toLowerCase().includes(clientRateCategory.toLowerCase())
      ) {
        return false;
      }
      if (clientRateQuery.trim()) {
        const q = clientRateQuery.toLowerCase();
        return (
          m.name.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q) ||
          m.brands.some((b) => b.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [allMaterialRates, clientRateBoqOnly, clientRateCategory, clientRateQuery]);

  const estimatorMaterial = useMemo(() => {
    return (
      allMaterialRates.find((m) => m.id === calcSelectedRateId) || allMaterialRates[0] || null
    );
  }, [allMaterialRates, calcSelectedRateId]);

  const handleExportClientRatesCsv = () => {
    const headers = [
      'Material Name',
      'Category',
      'Approved Brands',
      'Unit',
      'Contract / Spot Rate (INR)',
      'Market Min (INR)',
      'Market Max (INR)',
      '30d Trend',
      'Project Status',
    ];
    const escapeCsv = (val: string | number) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    const rows = filteredClientRates.map((m) => [
      escapeCsv(m.name),
      escapeCsv(m.category),
      escapeCsv(m.brands.join(' / ')),
      escapeCsv(m.unit),
      escapeCsv(m.boqRate ?? m.currentPrice),
      escapeCsv(m.minPrice),
      escapeCsv(m.maxPrice),
      escapeCsv(`${m.changePercent > 0 ? '+' : ''}${m.changePercent}%`),
      escapeCsv(m.inProjectBoq ? 'Locked in BOQ' : 'Market Benchmark'),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(activeProject?.name || 'Project').replace(/\s+/g, '_')}_Material_Rates.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${filteredClientRates.length} approved material rates.`);
  };

  const handleAskAboutMaterial = (mat: LiveMaterialPrice & { boqRate?: number }) => {
    const effectiveRate = mat.boqRate ?? mat.currentPrice;
    setReqType('rfi');
    setReqTrade(
      mat.category.toLowerCase().includes('plumb') || mat.category.toLowerCase().includes('electr')
        ? 'MEP'
        : mat.category.toLowerCase().includes('finish') || mat.category.toLowerCase().includes('paint')
        ? 'Finishes'
        : 'Civil & Masonry'
    );
    setReqTitle(`Material Inquiry: ${mat.name}`);
    setReqNotes(
      `Question regarding ${mat.name} (${mat.brands.slice(0, 2).join(', ')}) — Current rate: ${formatCurrency(
        effectiveRate,
        currency
      )} / ${mat.unit}.`
    );
    setIsRequestModalOpen(true);
  };

  // Field items / Change Orders / RFIs synced with Studio Utilities
  const projectFieldItems = useMemo(() => activeProject?.fieldItems || [], [activeProject?.fieldItems]);
  const pendingClientSignOffCount = useMemo(() => {
    const pendingMilestones = (activeProject?.milestones || []).filter(
      (m) => m.status === 'in_progress' && !m.isClientSignedOff
    ).length;
    const openChanges = projectFieldItems.filter(
      (i) => i.status === 'open' || i.status === 'in_review'
    ).length;
    return pendingMilestones + openChanges;
  }, [activeProject?.milestones, projectFieldItems]);

  // Milestone Approval Handler
  const handleApproveMilestone = (milestoneId: string) => {
    if (!activeProject || !onUpdateProject) return;
    const targetMs = (activeProject.milestones || []).find((m) => m.id === milestoneId);

    const updatedMilestones = (activeProject.milestones || []).map((ms) => {
      if (ms.id === milestoneId) {
        return {
          ...ms,
          isClientSignedOff: true,
          isClientApproved: true,
          clientSignedOffAt: new Date().toISOString(),
          status: 'completed' as const,
          escrowStatus: 'released' as const,
          progressPercent: 100,
        };
      }
      return ms;
    });

    const newLog = {
      id: `log-ms-${Date.now()}`,
      projectId: activeProject.id,
      actor: user?.name || 'Client Stakeholder',
      action: 'Client Milestone Sign-Off',
      details: `Approved ${targetMs?.title || 'Milestone'} via Client Workspace`,
      timestamp: new Date().toISOString(),
    };

    onUpdateProject({
      ...activeProject,
      milestones: updatedMilestones,
      auditLogs: [newLog, ...(activeProject.auditLogs || [])],
      updatedAt: new Date().toISOString(),
    });
    setSignedOffMilestoneId(milestoneId);
    setTimeout(() => setSignedOffMilestoneId(null), 3000);
  };

  // Change Order / RFI Approval & BOQ Sync Handler
  const handleApproveFieldItem = (itemId: string) => {
    if (!activeProject || !onUpdateProject) return;
    const target = projectFieldItems.find((i) => i.id === itemId);
    if (!target) return;

    const shouldSyncBoq = target.costImpact !== 0 && !target.syncedToBoq && !!onUpdateBOQItems;
    if (shouldSyncBoq && onUpdateBOQItems) {
      const boqLine: BOQItem = {
        id: `boq-co-${target.id}`,
        name: `[${target.code}] ${target.title}`,
        category: target.trade,
        unit: 'Lump Sum',
        quantity: 1,
        rate: target.costImpact,
        amount: target.costImpact,
        notes: `Client-approved ${target.type === 'change_order' ? 'Change Order' : 'Scope Variation'} (${target.notes})`,
        stage: 'Finishes',
        status: 'approved',
      };
      onUpdateBOQItems([...boqItems, boqLine]);
    }

    const updatedFieldItems = projectFieldItems.map((i) =>
      i.id === itemId
        ? { ...i, status: 'approved' as const, syncedToBoq: i.syncedToBoq || shouldSyncBoq }
        : i
    );

    const newLog = {
      id: `log-co-${Date.now()}`,
      projectId: activeProject.id,
      actor: user?.name || 'Client Stakeholder',
      action: `Approved ${target.code}`,
      details: `${target.title} (${formatCurrency(target.costImpact, currency)})${shouldSyncBoq ? ' · Synced to BOQ' : ''}`,
      timestamp: new Date().toISOString(),
    };

    onUpdateProject({
      ...activeProject,
      fieldItems: updatedFieldItems,
      auditLogs: [newLog, ...(activeProject.auditLogs || [])],
      updatedAt: new Date().toISOString(),
    });
    showToast(`${target.code} approved${shouldSyncBoq ? ' and synced into live BOQ' : ''}.`);
  };

  const handleRequestClarification = (itemId: string) => {
    if (!activeProject || !onUpdateProject) return;
    const target = projectFieldItems.find((i) => i.id === itemId);
    if (!target) return;

    const updatedFieldItems = projectFieldItems.map((i) =>
      i.id === itemId
        ? {
            ...i,
            status: 'in_review' as const,
            notes: `${i.notes ? i.notes + ' · ' : ''}Client requested clarification on ${new Date().toLocaleDateString('en-IN')}.`,
          }
        : i
    );

    onUpdateProject({
      ...activeProject,
      fieldItems: updatedFieldItems,
      updatedAt: new Date().toISOString(),
    });
    showToast(`${target.code} marked for architectural clarification.`);
  };

  // Client Raise RFI / Change Request Handler
  const handleRaiseClientRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !onUpdateProject || !reqTitle.trim()) return;

    const prefix = reqType === 'change_order' ? 'CO' : reqType === 'snag' ? 'SNG' : 'RFI';
    const nextNum = String(projectFieldItems.length + 1).padStart(2, '0');
    const newItem: FieldOperationItem = {
      id: `field-client-${Date.now()}`,
      code: `${prefix}-${nextNum}`,
      type: reqType,
      title: reqTitle.trim(),
      trade: reqTrade,
      priority: 'medium',
      status: 'open',
      assignee: 'Ar. S. Gouse',
      costImpact: 0,
      scheduleDays: 0,
      dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      notes: reqNotes.trim() || 'Submitted via Client Workspace.',
      createdAt: new Date().toISOString(),
    };

    onUpdateProject({
      ...activeProject,
      fieldItems: [newItem, ...projectFieldItems],
      auditLogs: [
        {
          id: `log-req-${Date.now()}`,
          projectId: activeProject.id,
          actor: user?.name || 'Client Stakeholder',
          action: `Raised ${newItem.code}`,
          details: newItem.title,
          timestamp: new Date().toISOString(),
        },
        ...(activeProject.auditLogs || []),
      ],
      updatedAt: new Date().toISOString(),
    });

    setReqTitle('');
    setReqNotes('');
    setIsRequestModalOpen(false);
    showToast(`${newItem.code} sent to the studio engineering register.`);
  };

  // Finish Selection Update & BOQ Sync
  const handleUpdateSelectionTier = (
    category: SelectionCatalogCategory,
    option: SelectionCatalogCategory['options'][number],
    approveNow = false
  ) => {
    if (!activeProject || !onUpdateProject) return;
    const nextSelections = activeSelections.map((sel) =>
      sel.categoryId === category.categoryId
        ? {
            ...sel,
            tier: option.tier,
            specTitle: option.specTitle,
            selectedAmount: option.selectedAmount,
            approvedByClient: approveNow ? true : sel.approvedByClient,
            approvedAt: approveNow ? new Date().toISOString() : sel.approvedAt,
          }
        : sel
    );

    onUpdateProject({
      ...activeProject,
      clientSelections: nextSelections,
      updatedAt: new Date().toISOString(),
    });

    if (approveNow) {
      showToast(`${category.categoryName} approved (${option.tier.toUpperCase()} tier).`);
    }
  };

  const handleSyncSelectionsToBoq = () => {
    if (!activeProject || !onUpdateProject || !onUpdateBOQItems) return;
    const delta = selectionSummary.netDelta;
    const existingIdx = boqItems.findIndex((b) => b.id === `boq-sel-delta-${activeProject.id}`);

    const updatedBoq = [...boqItems];
    if (delta === 0) {
      if (existingIdx >= 0) updatedBoq.splice(existingIdx, 1);
    } else {
      const selectionLine: BOQItem = {
        id: `boq-sel-delta-${activeProject.id}`,
        name: `Client Finish & Fixture Upgrade Allowance Delta (${activeSelections.filter((s) => s.selectedAmount !== s.allowanceAmount).length} Packages)`,
        category: 'Finishes & Interior Upgrades',
        unit: 'Lump Sum',
        quantity: 1,
        rate: delta,
        amount: delta,
        notes: 'Synced directly from Client Selections & Allowance Desk.',
        stage: 'Finishes',
        status: 'approved',
      };
      if (existingIdx >= 0) updatedBoq[existingIdx] = selectionLine;
      else updatedBoq.push(selectionLine);
    }

    onUpdateBOQItems(updatedBoq);
    onUpdateProject({
      ...activeProject,
      clientSelections: activeSelections.map((s) => ({ ...s, approvedByClient: true, syncedToBoq: true })),
      auditLogs: [
        {
          id: `log-sel-${Date.now()}`,
          projectId: activeProject.id,
          actor: user?.name || 'Client Stakeholder',
          action: 'Synced Finish Selections to BOQ',
          details: `Net upgrade delta ${formatCurrency(delta, currency)} updated in workspace BOQ`,
          timestamp: new Date().toISOString(),
        },
        ...(activeProject.auditLogs || []),
      ],
    });
    showToast('Finish selection allowance delta synced to live project BOQ.');
  };

  // Document Upload Handler
  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !newDocTitle.trim()) return;

    setIsUploading(true);
    setTimeout(() => {
      const newDoc: SharedDocument = {
        id: `doc-client-${Date.now()}`,
        projectId: activeProject.id,
        title: newDocTitle,
        fileName: newDocFile?.name || `${newDocTitle.replace(/\s+/g, '_')}.pdf`,
        fileSize: newDocFile ? `${(newDocFile.size / (1024 * 1024)).toFixed(1)} MB` : '1.8 MB',
        fileType: 'pdf',
        category: newDocCategory,
        uploadedBy: `${user?.name || 'Client'} (Client Workspace)`,
        uploadedAt: new Date().toISOString().split('T')[0],
        version: 'v1.0 Client Upload',
        status: 'in_review',
        isClientUpload: true,
        notes: newDocNotes || 'Uploaded by client for architectural review.',
      };

      if (onUpdateProject) {
        onUpdateProject({
          ...activeProject,
          sharedDocuments: [newDoc, ...(activeProject.sharedDocuments || [])],
          updatedAt: new Date().toISOString(),
        });
      }

      setIsUploading(false);
      setIsUploadModalOpen(false);
      setNewDocTitle('');
      setNewDocFile(null);
      setNewDocNotes('');
      showToast('Document added to shared project vault.');
    }, 350);
  };

  const handleDownloadDocument = (doc: SharedDocument) => {
    const textContent = `# Gouse AI Architectural Workspace - Document Export
Project: ${activeProject?.name || 'Project'}
Document: ${doc.title}
File Name: ${doc.fileName}
Category: ${doc.category}
Version: ${doc.version}
Date: ${doc.uploadedAt}
Uploaded By: ${doc.uploadedBy}
Status: ${doc.status.toUpperCase()}

Notes:
${doc.notes || 'No special notes.'}

Verified by Gouse AI Architecture & Engineering Quality Control.`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = doc.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Persist Client Message / Warranty Note directly to Project Status Feed & Audit Log
  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientCommentText.trim() || !activeProject) return;

    const newStatusUpdate: ProjectStatusUpdate = {
      id: `su-client-${Date.now()}`,
      projectId: activeProject.id,
      title: `Client Note from ${user?.name || 'Client Stakeholder'}`,
      content: clientCommentText.trim(),
      authorName: user?.name || 'Client Stakeholder',
      authorRole: 'Client Stakeholder',
      date: 'Just now',
      category: 'regulatory',
      progressPercentage: overallMilestoneProgress,
      isInspectionVerified: false,
    };

    if (onUpdateProject) {
      onUpdateProject({
        ...activeProject,
        statusUpdates: [newStatusUpdate, ...(activeProject.statusUpdates || [])],
        auditLogs: [
          {
            id: `log-msg-${Date.now()}`,
            projectId: activeProject.id,
            actor: user?.name || 'Client Stakeholder',
            action: 'Client Message Logged',
            details: clientCommentText.trim(),
            timestamp: new Date().toISOString(),
          },
          ...(activeProject.auditLogs || []),
        ],
        updatedAt: new Date().toISOString(),
      });
    }

    setClientCommentText('');
    showToast('Your note has been logged to the project feed for Ar. S. Gouse.');
  };

  const overallMilestoneProgress = useMemo(() => {
    if (!activeProject?.milestones || activeProject.milestones.length === 0) return 75;
    const total = activeProject.milestones.reduce((acc, ms) => acc + (ms.progressPercent || 0), 0);
    return Math.round(total / activeProject.milestones.length);
  }, [activeProject]);

  const financialSummary = useMemo(() => {
    const milestones = activeProject?.milestones || [];
    const totalCommitted =
      milestones.reduce((sum, m) => sum + (m.amount || m.escrowReleaseAmount || 0), 0) ||
      boqAccounting.authorizedTotal ||
      38500000;
    const disbursed = milestones
      .filter((m) => m.status === 'completed')
      .reduce((sum, m) => sum + (m.amount || m.escrowReleaseAmount || 0), 0);
    const inEscrow = milestones
      .filter((m) => m.status === 'in_progress')
      .reduce((sum, m) => sum + (m.amount || m.escrowReleaseAmount || 0), 0);
    const upcoming = Math.max(0, totalCommitted - disbursed - inEscrow);
    const completedCount = milestones.filter((m) => m.status === 'completed').length;

    return {
      totalCommitted,
      disbursed,
      inEscrow,
      upcoming,
      completedCount,
      totalCount: milestones.length || 6,
    };
  }, [activeProject, boqAccounting.authorizedTotal]);

  const cameraAnglePresets = {
    slab: {
      name: 'Deck Cam 01 · Level 2 Slab',
      location: 'South-East Cantilever Slab Zone',
      image: PROJECT_MEDIA.siteRccFraming,
      specs: 'Fe550D Rebar spacing 150mm c/c · M30 Ready-mix Slump 110mm · Hydration 96%',
      statusLabel: 'Structural Rebar Verified',
    },
    crane: {
      name: 'Crane Cam 02 · Aerial Perimeter',
      location: 'Tower Crane Jib Mast',
      image: PROJECT_MEDIA.builderProj1,
      specs: 'Boundary setbacks 3.5m compliant · Heavy vehicle access clear',
      statusLabel: 'Perimeter Clear',
    },
    entrance: {
      name: 'Gate Cam 03 · Material Intake',
      location: 'Main North Gate Access Bay',
      image: PROJECT_MEDIA.builderProj3,
      specs: 'Ready-mix delivery weighbridge verified · Batch tag active',
      statusLabel: 'Delivery Verified',
    },
  };

  const handleDownloadExecutiveBrief = () => {
    if (!activeProject) return;
    const briefContent = `GOUSE AI ARCHITECTURE & CONSTRUCTION STUDIO
CLIENT PROGRESS & COST AUDIT REPORT
Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
Project: ${activeProject.name}
Location: ${activeProject.location}
Built-up Area: ${activeProject.builtUpAreaSqFt?.toLocaleString() || '5,800'} Sq.Ft
Authorized BOQ Total (${currency}): ${formatCurrency(boqAccounting.authorizedTotal || financialSummary.totalCommitted, currency)}
Escrow Disbursed: ${formatCurrency(financialSummary.disbursed, currency)}
Physical Completion: ${overallMilestoneProgress}%
Open Change Orders / RFIs: ${projectFieldItems.filter((i) => i.status !== 'approved' && i.status !== 'resolved').length}`;

    const blob = new Blob([briefContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeProject.name.replace(/\s+/g, '_')}_Client_Brief.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!activeProject || assignedProjects.length === 0) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-6 bg-slate-950 text-slate-100">
        <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">No Assigned Projects Found</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your account ({user?.email || 'Guest'}) currently has no assigned projects linked. Contact Ar. S. Gouse or submit a new project brief.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {onViewPublicPortal && (
              <button
                type="button"
                onClick={onViewPublicPortal}
                className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors"
              >
                Open Client Intake &amp; Brief
              </button>
            )}
            {onReturnToPlatform && (
              <button
                type="button"
                onClick={onReturnToPlatform}
                className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors"
              >
                Return to Studio Workspace
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const filteredUpdates = (activeProject.statusUpdates || []).filter((u) => {
    if (updateCategoryFilter === 'all') return true;
    return u.category === updateCategoryFilter;
  });

  const filteredDocs = (activeProject.sharedDocuments || []).filter((d) => {
    if (docCategoryFilter === 'all') return true;
    return d.category === docCategoryFilter;
  });

  const filteredFieldItems = projectFieldItems.filter((item) => {
    if (fieldFilter === 'all') return true;
    return item.type === fieldFilter;
  });

  const latestSiteAudit = activeProject.siteAudits?.[0];
  const pendingMilestone = activeProject.milestones?.find(
    (m) => m.status === 'in_progress' && !m.isClientSignedOff
  );
  const pendingChangeOrder = projectFieldItems.find(
    (i) => i.type === 'change_order' && (i.status === 'open' || i.status === 'in_review')
  );

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Unauthenticated Guest Notice */}
      {(!user || isUnauthenticatedOutside) && (
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 text-xs flex items-center justify-between flex-wrap gap-2">
          <span className="text-slate-300">
            Viewing client project workspace · Sign in with your project email for private approvals.
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {onViewPublicPortal && (
              <button
                type="button"
                onClick={onViewPublicPortal}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
              >
                Client Intake
              </button>
            )}
            <button
              type="button"
              onClick={openLoginModal}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Sticky Context Header & Tabs */}
      <header className="bg-slate-900/95 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3.5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/35 text-amber-400 flex items-center justify-center font-semibold text-sm shrink-0">
                {user?.name?.charAt(0) || 'C'}
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-bold text-white truncate">
                  {activeProject.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span>{user?.name || 'Client Stakeholder'}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeProject.location}</span>
                  <span aria-hidden="true">·</span>
                  <span className="capitalize">{activeProject.status.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {assignedProjects.length > 1 && (
                <select
                  value={activeProject.id}
                  onChange={(e) => handleSelectProject(e.target.value)}
                  className="bg-slate-950 text-xs text-white px-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-amber-400 font-medium max-w-[220px] truncate"
                >
                  {assignedProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}

              {onViewPublicPortal && (
                <button
                  type="button"
                  onClick={onViewPublicPortal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                >
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  <span>Client Intake</span>
                </button>
              )}

              {isStaffPreview && onReturnToPlatform && (
                <button
                  type="button"
                  onClick={onReturnToPlatform}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Return to Studio</span>
                </button>
              )}

              {!isStaffPreview && user && (
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span>Sign Out</span>
                </button>
              )}

              {!user && (
                <button
                  type="button"
                  onClick={openLoginModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>

          {/* Single-Line Navigation Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto border-t border-slate-800/80 pt-1">
            {[
              { id: 'dashboard' as const, label: 'Overview', icon: LayoutDashboard },
              { id: 'milestones' as const, label: 'Milestones & BOQ', icon: CheckCircle2 },
              {
                id: 'change_orders' as const,
                label: `Change Orders & RFIs${projectFieldItems.length > 0 ? ` (${projectFieldItems.length})` : ''}`,
                icon: ClipboardList,
              },
              { id: 'selections' as const, label: 'Materials & Rates', icon: Sliders },
              { id: 'updates' as const, label: 'Site Logs & Messages', icon: Clock },
              { id: 'documents' as const, label: 'Drawings & Vault', icon: FolderOpen },
              { id: 'team' as const, label: 'Project Team', icon: Users },
              { id: 'smart_home_ska' as const, label: 'Smart Home (SKA)', icon: Cpu },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-client-${tab.id}`}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
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
      </header>

      {/* Main Content */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-6">
        {feedbackBanner && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{feedbackBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackBanner(null)}
              className="text-emerald-300 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Executive KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Authorized BOQ Budget</span>
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-white tabular-nums">
              {formatCurrency(boqAccounting.authorizedTotal || financialSummary.totalCommitted, currency)}
            </div>
            <div className="text-xs text-slate-400 tabular-nums">
              {boqItems.length} BOQ items · {contingencyPercent}% contingency
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Physical &amp; Escrow Progress</span>
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-white tabular-nums">{overallMilestoneProgress}%</span>
              <span className="text-xs text-emerald-400 tabular-nums">
                {financialSummary.completedCount} / {financialSummary.totalCount} stages
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full"
                style={{ width: `${overallMilestoneProgress}%` }}
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Pending Client Sign-Offs</span>
              <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-xl font-bold text-white tabular-nums">{pendingClientSignOffCount}</div>
            <div className="text-xs text-slate-400">
              {pendingMilestone
                ? `Milestone ${pendingMilestone.stageNumber} ready for review`
                : 'Milestones & change orders current'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Materials &amp; Allowances</span>
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div
              className={`text-xl font-bold tabular-nums ${
                selectionSummary.netDelta > 0 ? 'text-amber-300' : 'text-emerald-400'
              }`}
            >
              {selectionSummary.netDelta >= 0 ? '+' : ''}
              {formatCurrency(selectionSummary.netDelta, currency)}
            </div>
            <div className="text-xs text-slate-400 tabular-nums">
              {selectionSummary.approvedCount} / {activeSelections.length} finish specs approved
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: OVERVIEW                                                */}
        {/* ============================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Priority Action & Header Row */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
                  <span>{activeProject.projectType}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{activeProject.builtUpAreaSqFt?.toLocaleString() || '5,800'} sq.ft</span>
                  <span aria-hidden="true">·</span>
                  <span>Lead Architect: Ar. S. Gouse</span>
                </div>
                <h2 className="text-xl font-bold text-white">
                  {pendingMilestone
                    ? `Action Required: Stage ${pendingMilestone.stageNumber} Milestone Approval`
                    : pendingChangeOrder
                    ? `Action Required: Review ${pendingChangeOrder.code} (${pendingChangeOrder.title})`
                    : 'Project Execution On Track'}
                </h2>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  {pendingMilestone
                    ? `${pendingMilestone.title} is ${pendingMilestone.progressPercent}% verified on site. Review deliverables and authorize escrow release.`
                    : pendingChangeOrder
                    ? `${pendingChangeOrder.trade} change order awaits client review (${formatCurrency(pendingChangeOrder.costImpact, currency)}).`
                    : 'All milestone approvals, structural audits, and material selections are synchronized with the studio.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                {pendingMilestone && (
                  <button
                    type="button"
                    onClick={() => handleApproveMilestone(pendingMilestone.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve Stage {pendingMilestone.stageNumber}</span>
                  </button>
                )}
                {pendingChangeOrder && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('change_orders')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    <span>Review {pendingChangeOrder.code}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDownloadExecutiveBrief}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Export Brief</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Raise Request</span>
                </button>
              </div>
            </div>

            {/* Site Inspection View + Field Updates */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-7 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Geotagged Site Inspection Feed</h3>
                    <p className="text-xs text-slate-400">
                      {latestSiteAudit
                        ? `Latest audit: ${latestSiteAudit.stageName} (${latestSiteAudit.qualityScore}/10)`
                        : 'On-site structural & concrete pour monitoring'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                    {(['slab', 'crane', 'entrance'] as const).map((angle) => (
                      <button
                        key={angle}
                        type="button"
                        onClick={() => setDashboardCameraAngle(angle)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                          dashboardCameraAngle === angle
                            ? 'bg-amber-500 text-slate-950 font-semibold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {angle === 'slab' ? 'Deck Cam' : angle === 'crane' ? 'Aerial' : 'Gate Cam'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative aspect-video bg-slate-950 overflow-hidden">
                  <img
                    src={cameraAnglePresets[dashboardCameraAngle].image}
                    alt={cameraAnglePresets[dashboardCameraAngle].name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-slate-950/85 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white font-medium flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        {cameraAnglePresets[dashboardCameraAngle].name}
                      </span>
                      <span className="text-emerald-400 font-medium">
                        {cameraAnglePresets[dashboardCameraAngle].statusLabel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">
                      {cameraAnglePresets[dashboardCameraAngle].specs}
                    </p>
                  </div>
                </div>

                <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-400">
                    {cameraAnglePresets[dashboardCameraAngle].location}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsSiteCameraModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Inspect Site Audit</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 rounded-2xl bg-slate-900 border border-slate-800 p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h3 className="text-sm font-semibold text-white">Recent Field Logs</h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('updates')}
                      className="text-xs text-amber-400 hover:underline font-medium"
                    >
                      View all
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {(activeProject.statusUpdates || []).slice(0, 3).map((update) => (
                      <div
                        key={update.id}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-white truncate">{update.title}</span>
                          <span className="text-slate-500 shrink-0">{update.date}</span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {update.content}
                        </p>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>{update.authorName}</span>
                          <span aria-hidden="true">·</span>
                          <span className="capitalize">{update.category}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSendComment} className="pt-3 border-t border-slate-800 space-y-2">
                  <label className="block text-xs font-medium text-slate-300">
                    Send note to Architect &amp; Site Team
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={clientCommentText}
                      onChange={(e) => setClientCommentText(e.target.value)}
                      placeholder="Ask about schedule, finishes, or site visit..."
                      className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Stage Roadmap Snapshot */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Milestone &amp; Payment Schedule</h3>
                  <p className="text-xs text-slate-400">
                    Disbursed: {formatCurrency(financialSummary.disbursed, currency)} · In Verification:{' '}
                    {formatCurrency(financialSummary.inEscrow, currency)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('milestones')}
                  className="inline-flex items-center gap-1 text-xs text-amber-400 hover:underline font-medium"
                >
                  <span>Open BOQ &amp; Milestones</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                {(activeProject.milestones || []).map((ms, idx) => (
                  <button
                    key={ms.id}
                    type="button"
                    onClick={() => setActiveTab('milestones')}
                    className={`p-3.5 rounded-xl border text-left transition-colors space-y-2 ${
                      ms.status === 'completed'
                        ? 'bg-slate-950 border-emerald-500/30'
                        : ms.status === 'in_progress'
                        ? 'bg-amber-500/10 border-amber-500/40'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 tabular-nums">
                      <span>Stage 0{idx + 1}</span>
                      <span
                        className={
                          ms.status === 'completed'
                            ? 'text-emerald-400 font-medium'
                            : ms.status === 'in_progress'
                            ? 'text-amber-300 font-medium'
                            : 'text-slate-500'
                        }
                      >
                        {ms.status === 'completed' ? 'Approved' : ms.status === 'in_progress' ? 'Active' : 'Queued'}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-white line-clamp-2 min-h-[32px]">
                      {ms.title}
                    </div>
                    <div className="text-xs text-slate-300 tabular-nums">
                      {formatCurrency(ms.amount || ms.escrowReleaseAmount || 0, currency)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Assigned Multi-Project Portfolio Switcher */}
            {assignedProjects.length > 1 && (
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Assigned Properties</h3>
                  <span className="text-xs text-slate-400 tabular-nums">{assignedProjects.length} projects</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {assignedProjects.map((proj) => {
                    const isCurrent = proj.id === activeProject.id;
                    return (
                      <div
                        key={proj.id}
                        className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                          isCurrent ? 'bg-amber-500/10 border-amber-500/40' : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-white truncate">{proj.name}</div>
                          <div className="text-xs text-slate-400 truncate">
                            {proj.location} · {proj.builtUpAreaSqFt?.toLocaleString() || '5,800'} sq.ft
                          </div>
                        </div>
                        {isCurrent ? (
                          <span className="text-xs text-emerald-400 font-medium shrink-0">Active</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSelectProject(proj.id)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white font-medium shrink-0"
                          >
                            Switch
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: MILESTONES & LIVE BOQ BREAKDOWN                         */}
        {/* ============================================================== */}
        {activeTab === 'milestones' && (
          <div className="space-y-6">
            {/* Live BOQ Cost Allocation Table */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-white">Live Project BOQ Budget Breakdown</h2>
                  <p className="text-xs text-slate-400">
                    Synchronized directly with studio quantity surveying &amp; locked material rates.
                  </p>
                </div>
                {isStaffPreview && onOpenStudioTab && (
                  <button
                    type="button"
                    onClick={() => onOpenStudioTab('boq')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-amber-300 font-medium whitespace-nowrap shrink-0"
                  >
                    <span>Edit in Studio BOQ</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {boqAccounting.stageRows.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-2 pr-4 font-medium">Construction Stage / Trade</th>
                        <th className="py-2 px-4 font-medium text-right">Line Items</th>
                        <th className="py-2 px-4 font-medium text-right">Share</th>
                        <th className="py-2 pl-4 font-medium text-right">Allocation ({currency})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {boqAccounting.stageRows.map((row) => {
                        const pct =
                          boqAccounting.subtotal > 0
                            ? Math.round((row.amount / boqAccounting.subtotal) * 100)
                            : 0;
                        return (
                          <tr key={row.stage} className="hover:bg-slate-800/30">
                            <td className="py-2.5 pr-4 font-medium text-white">{row.stage}</td>
                            <td className="py-2.5 px-4 text-right text-slate-300 tabular-nums">{row.count}</td>
                            <td className="py-2.5 px-4 text-right text-slate-400 tabular-nums">{pct}%</td>
                            <td className="py-2.5 pl-4 text-right font-semibold text-white tabular-nums">
                              {formatCurrency(row.amount, currency)}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="border-t border-slate-700 text-slate-300">
                        <td className="py-2.5 pr-4">Contingency Reserve ({contingencyPercent}%)</td>
                        <td className="py-2.5 px-4 text-right">—</td>
                        <td className="py-2.5 px-4 text-right tabular-nums">{contingencyPercent}%</td>
                        <td className="py-2.5 pl-4 text-right font-semibold tabular-nums">
                          {formatCurrency(boqAccounting.contingencyAmt, currency)}
                        </td>
                      </tr>
                      <tr className="border-t border-slate-700 text-amber-300 font-bold">
                        <td className="py-3 pr-4">Total Authorized BOQ Budget</td>
                        <td className="py-3 px-4 text-right tabular-nums">{boqItems.length}</td>
                        <td className="py-3 px-4 text-right">100%</td>
                        <td className="py-3 pl-4 text-right tabular-nums">
                          {formatCurrency(boqAccounting.authorizedTotal, currency)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                  No BOQ line items have been published for this project yet.
                </div>
              )}
            </div>

            {/* Milestone Escrow Schedule */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-white">Stage Milestones &amp; Client Sign-Off</h3>
                  <p className="text-xs text-slate-400">
                    Escrow releases require verified engineering inspection and client authorization.
                  </p>
                </div>
                {signedOffMilestoneId && (
                  <span className="text-xs text-emerald-400 font-medium">
                    Milestone signed off and recorded.
                  </span>
                )}
              </div>

              {(activeProject.milestones || []).map((ms) => {
                const isCompleted = ms.status === 'completed';
                const isInProgress = ms.status === 'in_progress';
                return (
                  <div
                    key={ms.id}
                    className={`p-5 rounded-xl border space-y-3 ${
                      isInProgress
                        ? 'bg-slate-900 border-amber-500/40'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="text-xs text-slate-400 flex items-center gap-2">
                          <span>Stage {ms.stageNumber}</span>
                          <span aria-hidden="true">·</span>
                          <span className="capitalize">{ms.status.replace('_', ' ')}</span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">Target {ms.targetDate}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-0.5">{ms.title}</h4>
                      </div>

                      <div className="sm:text-right">
                        <div className="text-sm font-bold text-white tabular-nums">
                          {formatCurrency(ms.escrowReleaseAmount || ms.amount || 0, currency)}
                        </div>
                        <div className="text-xs text-slate-400 capitalize">
                          {(ms.escrowStatus || 'scheduled').replace('_', ' ')}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{ms.description}</p>

                    {ms.deliverables && ms.deliverables.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
                        {ms.deliverables.map((del, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <CheckCircle2
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isCompleted ? 'text-emerald-400' : 'text-slate-500'
                              }`}
                            />
                            <span className="truncate">{del}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <span className="text-slate-400">
                        {ms.verifiedBy ? `Verified by ${ms.verifiedBy}` : 'Scheduled engineering audit'}
                        {ms.isClientSignedOff ? ' · Signed off by client' : ''}
                      </span>

                      {isInProgress && !ms.isClientSignedOff && (
                        <button
                          type="button"
                          onClick={() => handleApproveMilestone(ms.id)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Approve &amp; Release Milestone</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: CHANGE ORDERS & RFIs (SYNCED WITH STUDIO FIELD OPS)     */}
        {/* ============================================================== */}
        {activeTab === 'change_orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">Change Orders, RFIs &amp; Site Clarifications</h2>
                <p className="text-xs text-slate-400">
                  Live sync with Studio Field Operations. Approved change orders update the project BOQ automatically.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                  {(
                    [
                      { id: 'all', label: 'All' },
                      { id: 'change_order', label: 'Change Orders' },
                      { id: 'rfi', label: 'RFIs' },
                      { id: 'snag', label: 'Snags' },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFieldFilter(f.id)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        fieldFilter === f.id
                          ? 'bg-amber-500 text-slate-950 font-semibold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Raise Request</span>
                </button>
              </div>
            </div>

            {filteredFieldItems.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
                <ClipboardList className="w-8 h-8 text-slate-500 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white">No Change Orders or RFIs Logged Yet</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Any RFIs, scope variations, or site snags logged in Studio Field Operations or submitted by you appear here for digital sign-off.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Submit First Request</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFieldItems.map((item) => {
                  const isApproved = item.status === 'approved' || item.status === 'resolved';
                  return (
                    <div
                      key={item.id}
                      className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
                            <span className="font-mono text-amber-300 font-semibold">{item.code}</span>
                            <span aria-hidden="true">·</span>
                            <span>{item.trade}</span>
                            <span aria-hidden="true">·</span>
                            <span className="capitalize">{item.type.replace('_', ' ')}</span>
                            <span aria-hidden="true">·</span>
                            <span>Due {item.dueDate}</span>
                          </div>
                          <h3 className="text-sm font-bold text-white mt-0.5">{item.title}</h3>
                        </div>

                        <div className="flex items-center gap-4 text-xs sm:text-right shrink-0">
                          <div>
                            <div className="text-slate-400">Cost impact</div>
                            <div className="font-bold text-white tabular-nums">
                              {item.costImpact === 0 ? 'No cost change' : formatCurrency(item.costImpact, currency)}
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-400">Schedule</div>
                            <div className="font-semibold text-slate-200 tabular-nums">
                              {item.scheduleDays > 0 ? `+${item.scheduleDays} days` : 'On schedule'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {item.notes && <p className="text-xs text-slate-300 leading-relaxed">{item.notes}</p>}

                      <div className="pt-2.5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-medium capitalize ${
                              isApproved ? 'text-emerald-400' : 'text-amber-300'
                            }`}
                          >
                            Status: {item.status.replace('_', ' ')}
                          </span>
                          {item.syncedToBoq && (
                            <>
                              <span aria-hidden="true" className="text-slate-600">·</span>
                              <span className="text-emerald-400">Synced to BOQ</span>
                            </>
                          )}
                        </div>

                        {!isApproved && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleRequestClarification(item.id)}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                            >
                              Request Clarification
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApproveFieldItem(item.id)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{item.costImpact !== 0 ? 'Approve & Sync BOQ' : 'Approve'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: CLIENT MATERIALS & RATES AREA                           */}
        {/* ============================================================== */}
        {activeTab === 'selections' && (
          <div className="space-y-6">
            {/* Top Summary & Allowance Sync Card */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-white">Materials, Finish Selections &amp; Rates</h2>
                  <p className="text-xs text-slate-400">
                    Choose finish tiers, review approved brand unit rates, and estimate material costs transparently.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-5 shrink-0">
                  <div className="text-xs">
                    <div className="text-slate-400">Contract Allowance</div>
                    <div className="text-sm font-bold text-white tabular-nums">
                      {formatCurrency(selectionSummary.totalAllowance, currency)}
                    </div>
                  </div>
                  <div className="text-xs">
                    <div className="text-slate-400">Selected Total</div>
                    <div className="text-sm font-bold text-white tabular-nums">
                      {formatCurrency(selectionSummary.totalSelected, currency)}
                    </div>
                  </div>
                  <div className="text-xs">
                    <div className="text-slate-400">Net Variance</div>
                    <div
                      className={`text-sm font-bold tabular-nums ${
                        selectionSummary.netDelta > 0 ? 'text-amber-300' : 'text-emerald-400'
                      }`}
                    >
                      {selectionSummary.netDelta >= 0 ? '+' : ''}
                      {formatCurrency(selectionSummary.netDelta, currency)}
                    </div>
                  </div>
                  {onUpdateBOQItems && (
                    <button
                      type="button"
                      onClick={handleSyncSelectionsToBoq}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm &amp; Sync to BOQ</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Clean 3-Mode Sub-Navigation */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-950 border border-slate-800 overflow-x-auto">
                  {[
                    { id: 'selections' as const, label: 'Finish Selections & Upgrades', icon: Sliders },
                    {
                      id: 'rates' as const,
                      label: `Approved Material Rates (${allMaterialRates.length})`,
                      icon: Layers,
                    },
                    { id: 'estimator' as const, label: 'Quick Cost Estimator', icon: Calculator },
                  ].map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = materialsSubTab === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setMaterialsSubTab(sub.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                          isSubActive
                            ? 'bg-amber-500 text-slate-950 font-semibold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <SubIcon className="w-3.5 h-3.5" />
                        <span>{sub.label}</span>
                      </button>
                    );
                  })}
                </div>

                {materialsSubTab === 'rates' && (
                  <button
                    type="button"
                    onClick={handleExportClientRatesCsv}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Export Rate Sheet (CSV)</span>
                  </button>
                )}
              </div>
            </div>

            {/* SUB-TAB 1: FINISH SELECTIONS & UPGRADES */}
            {materialsSubTab === 'selections' && (
              <div className="space-y-4">
                {SELECTION_CATALOG.map((cat) => {
                  const currentSel = activeSelections.find((s) => s.categoryId === cat.categoryId);
                  const delta = (currentSel?.selectedAmount || cat.allowanceAmount) - cat.allowanceAmount;

                  return (
                    <div
                      key={cat.categoryId}
                      className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold text-white">{cat.categoryName}</h3>
                          <div className="text-xs text-slate-400 tabular-nums">
                            Contract allowance: {formatCurrency(cat.allowanceAmount, currency)}
                            {currentSel?.approvedByClient ? ' · Selected by client' : ''}
                          </div>
                        </div>
                        <div
                          className={`text-xs font-semibold tabular-nums ${
                            delta > 0 ? 'text-amber-300' : 'text-emerald-400'
                          }`}
                        >
                          {delta === 0 ? 'Included in Allowance' : `+${formatCurrency(delta, currency)} upgrade`}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {cat.options.map((opt) => {
                          const isPicked = currentSel?.tier === opt.tier;
                          const optDelta = opt.selectedAmount - cat.allowanceAmount;
                          return (
                            <button
                              key={opt.tier}
                              type="button"
                              onClick={() => handleUpdateSelectionTier(cat, opt, true)}
                              className={`p-4 rounded-xl border text-left transition-colors flex flex-col justify-between gap-3 ${
                                isPicked
                                  ? 'bg-amber-500/10 border-amber-500/50'
                                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="capitalize font-semibold text-amber-300">{opt.tier}</span>
                                  <span className="text-slate-400 tabular-nums">Lead {opt.leadTime}</span>
                                </div>
                                <div className="text-xs font-semibold text-white leading-snug">
                                  {opt.specTitle}
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed">{opt.notes}</p>
                              </div>

                              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                                <span className="font-bold text-white tabular-nums">
                                  {formatCurrency(opt.selectedAmount, currency)}
                                </span>
                                <span className={optDelta > 0 ? 'text-amber-300 tabular-nums' : 'text-emerald-400'}>
                                  {optDelta === 0 ? 'Base' : `+${formatCurrency(optDelta, currency)}`}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* SUB-TAB 2: APPROVED PROJECT MATERIAL RATES */}
            {materialsSubTab === 'rates' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5 flex-1">
                    <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs flex-1 min-w-[200px] max-w-xs">
                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        placeholder="Search cement, steel, paint, brand..."
                        value={clientRateQuery}
                        onChange={(e) => setClientRateQuery(e.target.value)}
                        className="w-full bg-transparent text-white focus:outline-none placeholder-slate-500"
                      />
                    </div>

                    <select
                      value={clientRateCategory}
                      onChange={(e) => setClientRateCategory(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="all">All Categories</option>
                      <option value="Interior">All Interior Items</option>
                      <option value="Interior & Millwork">Interior &amp; Millwork</option>
                      <option value="Interior Finishes & Lighting">Interior Finishes &amp; Lighting</option>
                      <option value="Cement & Concrete">Cement &amp; Concrete</option>
                      <option value="Steel & Reinforcement">Steel &amp; Reinforcement</option>
                      <option value="Sand & Aggregates">Sand &amp; Aggregates</option>
                      <option value="Blocks & Bricks">Blocks &amp; Bricks</option>
                      <option value="Glass & Fenestration">Glass &amp; Glazing</option>
                      <option value="Plumbing & MEP">Plumbing &amp; Electrical</option>
                      <option value="Finishes & Coatings">Finishes &amp; Paints</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => setClientRateBoqOnly(!clientRateBoqOnly)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                        clientRateBoqOnly
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-semibold'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      Locked in BOQ Only
                    </button>
                  </div>

                  <div className="text-xs text-slate-400 tabular-nums shrink-0">
                    Showing <strong className="text-white">{filteredClientRates.length}</strong> of{' '}
                    {allMaterialRates.length} rates
                  </div>
                </div>

                <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                          <th className="py-3 pl-4 pr-3 font-medium whitespace-nowrap">Material</th>
                          <th className="py-3 px-3 font-medium whitespace-nowrap">Approved Brands</th>
                          <th className="py-3 px-3 font-medium whitespace-nowrap">Unit</th>
                          <th className="py-3 px-3 font-medium text-right whitespace-nowrap">
                            Market Range
                          </th>
                          <th className="py-3 px-3 font-medium text-right whitespace-nowrap">
                            Project / Spot Rate ({currency})
                          </th>
                          <th className="py-3 px-3 font-medium text-right whitespace-nowrap">30d Trend</th>
                          <th className="py-3 px-3 font-medium whitespace-nowrap">BOQ Status</th>
                          <th className="py-3 pl-3 pr-4 font-medium text-right whitespace-nowrap">
                            Inquiry
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {filteredClientRates.map((mat) => {
                          const isUp = mat.trend === 'up' || mat.changePercent > 0;
                          const isDown = mat.trend === 'down' || mat.changePercent < 0;
                          const effectiveRate = mat.boqRate ?? mat.currentPrice;

                          return (
                            <tr key={mat.id} className="hover:bg-slate-800/35 transition-colors">
                              <td className="py-3 pl-4 pr-3 min-w-[200px]">
                                <div className="font-semibold text-white">{mat.name}</div>
                                <div className="text-[11px] text-slate-400">{mat.category}</div>
                              </td>
                              <td className="py-3 px-3 text-slate-300 max-w-[200px]">
                                <div className="truncate" title={mat.brands.join(', ')}>
                                  {mat.brands.slice(0, 3).join(', ')}
                                </div>
                              </td>
                              <td className="py-3 px-3 text-slate-300 whitespace-nowrap">{mat.unit}</td>
                              <td className="py-3 px-3 text-right text-slate-400 tabular-nums whitespace-nowrap">
                                {formatCurrency(mat.minPrice, currency)} –{' '}
                                {formatCurrency(mat.maxPrice, currency)}
                              </td>
                              <td className="py-3 px-3 text-right font-bold text-white tabular-nums whitespace-nowrap">
                                {formatCurrency(effectiveRate, currency)}
                              </td>
                              <td className="py-3 px-3 text-right tabular-nums whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center gap-1 font-medium ${
                                    isUp
                                      ? 'text-emerald-400'
                                      : isDown
                                      ? 'text-rose-400'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  {isUp ? (
                                    <TrendingUp className="w-3 h-3" />
                                  ) : isDown ? (
                                    <TrendingDown className="w-3 h-3" />
                                  ) : (
                                    <Minus className="w-3 h-3" />
                                  )}
                                  <span>
                                    {mat.changePercent > 0 ? `+${mat.changePercent}%` : `${mat.changePercent}%`}
                                  </span>
                                </span>
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span
                                  className={`text-xs font-medium ${
                                    mat.inProjectBoq ? 'text-emerald-400' : 'text-slate-400'
                                  }`}
                                >
                                  {mat.inProjectBoq ? 'Locked in BOQ' : 'Market Benchmark'}
                                </span>
                              </td>
                              <td className="py-3 pl-3 pr-4 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleAskAboutMaterial(mat)}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                                >
                                  Ask Architect
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

            {/* SUB-TAB 3: QUICK MATERIAL COST ESTIMATOR */}
            {materialsSubTab === 'estimator' && estimatorMaterial && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">Simple Material Cost Estimator</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Pick any material or brand package and enter your estimated quantity to preview cost before requesting an upgrade.
                    </p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Select Material / Package
                      </label>
                      <select
                        value={estimatorMaterial.id}
                        onChange={(e) => setCalcSelectedRateId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                      >
                        {allMaterialRates.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({formatCurrency(m.boqRate ?? m.currentPrice, currency)} / {m.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-medium mb-1">
                          Quantity ({estimatorMaterial.unit})
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={calcQty}
                          onChange={(e) => setCalcQty(Math.max(1, Number(e.target.value) || 1))}
                          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white tabular-nums focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">
                          Site Wastage Allowance
                        </label>
                        <select
                          value={calcWastage}
                          onChange={(e) => setCalcWastage(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                        >
                          <option value={0}>0% (Exact Net)</option>
                          <option value={3}>3% (Standard Factory Cut)</option>
                          <option value={5}>5% (Standard Site Allowance)</option>
                          <option value={10}>10% (Stone / Tile Pattern Cut)</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 space-y-1">
                      <div>
                        <span className="text-slate-400">Approved Brands: </span>
                        <span className="text-white">{estimatorMaterial.brands.join(', ')}</span>
                      </div>
                      {(estimatorMaterial.marketNotes || estimatorMaterial.trendReason) && (
                        <div className="text-slate-400">
                          {estimatorMaterial.marketNotes || estimatorMaterial.trendReason}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4">
                  {(() => {
                    const unitRate = estimatorMaterial.boqRate ?? estimatorMaterial.currentPrice;
                    const baseTotal = calcQty * unitRate;
                    const wastageCost = Math.round(baseTotal * (calcWastage / 100));
                    const grandTotal = baseTotal + wastageCost;

                    return (
                      <>
                        <div className="space-y-3">
                          <div className="text-xs text-slate-400">Estimated Material Budget</div>
                          <div className="text-2xl font-bold text-amber-400 tabular-nums">
                            {formatCurrency(grandTotal, currency)}
                          </div>
                          <div className="space-y-2 pt-3 border-t border-slate-800 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Unit Rate</span>
                              <span className="text-white font-medium tabular-nums">
                                {formatCurrency(unitRate, currency)} / {estimatorMaterial.unit}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Base Cost ({calcQty} units)</span>
                              <span className="text-white tabular-nums">
                                {formatCurrency(baseTotal, currency)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Wastage Buffer ({calcWastage}%)</span>
                              <span className="text-slate-200 tabular-nums">
                                {formatCurrency(wastageCost, currency)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setReqType('change_order');
                            setReqTrade('Finishes');
                            setReqTitle(
                              `Material Estimate Request: ${estimatorMaterial.name} (${calcQty} ${estimatorMaterial.unit})`
                            );
                            setReqNotes(
                              `Client estimator total: ${formatCurrency(
                                grandTotal,
                                currency
                              )} including ${calcWastage}% allowance at ${formatCurrency(
                                unitRate,
                                currency
                              )} / ${estimatorMaterial.unit}.`
                            );
                            setIsRequestModalOpen(true);
                          }}
                          className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors"
                        >
                          Send Spec Inquiry to Studio
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: SITE LOGS & CLIENT MESSAGES                             */}
        {/* ============================================================== */}
        {activeTab === 'updates' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">Site Logs, Quality Audits &amp; Messages</h2>
                <p className="text-xs text-slate-400">
                  Chronological field journal, structural inspections, and direct client notes.
                </p>
              </div>

              <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900 border border-slate-800 text-xs overflow-x-auto">
                {['all', 'structural', 'finishes', 'mep', 'civil', 'regulatory'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setUpdateCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-md capitalize transition-colors font-medium whitespace-nowrap shrink-0 ${
                      updateCategoryFilter === cat
                        ? 'bg-amber-500 text-slate-950 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Client Note / Warranty Ticket Composer */}
            <form
              onSubmit={handleSendComment}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row gap-2.5"
            >
              <input
                type="text"
                value={clientCommentText}
                onChange={(e) => setClientCommentText(e.target.value)}
                placeholder="Post a note, question, or warranty snag request to the site engineering log..."
                className="flex-1 px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post to Project Feed</span>
              </button>
            </form>

            <div className="space-y-4">
              {filteredUpdates.map((u) => (
                <div
                  key={u.id}
                  className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                    <div>
                      <h3 className="text-sm font-bold text-white">{u.title}</h3>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{u.authorName}</span>
                        <span aria-hidden="true">·</span>
                        <span>{u.authorRole}</span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span className="capitalize">{u.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{u.date}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{u.content}</p>

                  {u.mediaUrls && u.mediaUrls.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {u.mediaUrls.map((url, i) => (
                        <div key={i} className="h-44 rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                          <img
                            src={url}
                            alt={u.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 6: DRAWINGS & DOCUMENT VAULT                               */}
        {/* ============================================================== */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">Drawings, Structural Certificates &amp; Vault</h2>
                <p className="text-xs text-slate-400">
                  Approved working drawings, locked BOQ sheets, permits, and client uploads.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Document</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                { id: 'all', label: 'All Files' },
                { id: 'architectural_drawings', label: 'Architectural Drawings' },
                { id: 'structural_reports', label: 'Structural Reports' },
                { id: 'boq_financials', label: 'BOQ & Financials' },
                { id: 'site_audit', label: 'Site Audits' },
                { id: 'client_uploads', label: 'Client Uploads' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setDocCategoryFilter(c.id)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors font-medium ${
                    docCategoryFilter === c.id
                      ? 'bg-amber-500 text-slate-950 font-semibold'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="rounded-xl bg-slate-900 border border-slate-800 divide-y divide-slate-800">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 text-amber-400">
                      {doc.fileType === 'pdf' ? (
                        <FileText className="w-4 h-4" />
                      ) : doc.fileType === 'xlsx' ? (
                        <FileSpreadsheet className="w-4 h-4" />
                      ) : (
                        <Layers className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <h3 className="text-sm font-semibold text-white truncate">{doc.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 tabular-nums">
                        <span>{doc.fileName}</span>
                        <span aria-hidden="true">·</span>
                        <span>{doc.fileSize}</span>
                        <span aria-hidden="true">·</span>
                        <span>{doc.version}</span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize text-emerald-400">{doc.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadDocument(doc)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 7: PROJECT TEAM                                            */}
        {/* ============================================================== */}
        {activeTab === 'team' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Architectural &amp; Engineering Leadership</h2>
              <p className="text-xs text-slate-400">
                Direct studio contacts for architectural coordination, structural sign-off, and BOQ accounting.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  name: 'Ar. S. Gouse',
                  role: 'Principal Architect',
                  cred: 'Council of Architecture CA/2012/55190',
                  email: 'sgouse14@gmail.com',
                  phone: '+91 80739 47241',
                  avatar: AVATARS.principal,
                  scope: 'Spatial architecture, municipal sanctions, and turnkey interior fit-out.',
                },
                {
                  name: 'Er. Rajesh Kumar',
                  role: 'Structural Consultant',
                  cred: 'M.Tech IIT · IS 456 / IS 1893 Lead',
                  email: 'rajesh.kumar@gouseai.com',
                  phone: '+91 80412 89001',
                  avatar: AVATARS.structuralEngineer,
                  scope: 'RCC frame design, rebar spacing audits, and concrete compressive testing.',
                },
                {
                  name: 'Amit Verma (QS)',
                  role: 'Senior Quantity Surveyor',
                  cred: 'MRICS Certified Cost Engineer',
                  email: 'amit.verma@gouseai.com',
                  phone: '+91 98112 34567',
                  avatar: AVATARS.qsDirector,
                  scope: 'BOQ cost validation, CPWD rate indexing, and milestone escrow accounting.',
                },
              ].map((member) => (
                <div
                  key={member.name}
                  className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-white">{member.name}</h3>
                      <div className="text-xs text-amber-400">{member.role}</div>
                      <div className="text-[11px] text-slate-400">{member.cred}</div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{member.scope}</p>
                  <div className="pt-3 border-t border-slate-800 space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>{member.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span className="tabular-nums">{member.phone}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 8: SMART HOME SKA AGENT                                    */}
        {/* ============================================================== */}
        {activeTab === 'smart_home_ska' && (
          <SmartHomeSkaAgent
            activeProject={activeProject}
            onOpenConsultation={() => setActiveTab('team')}
          />
        )}
      </main>

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-xl w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Document Details</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="text-sm font-bold text-white">{previewDoc.title}</div>
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <div className="text-slate-400">File</div>
                  <div className="text-white truncate">{previewDoc.fileName}</div>
                </div>
                <div>
                  <div className="text-slate-400">Version</div>
                  <div className="text-amber-300">{previewDoc.version}</div>
                </div>
                <div>
                  <div className="text-slate-400">Size</div>
                  <div className="text-white tabular-nums">{previewDoc.fileSize}</div>
                </div>
                <div>
                  <div className="text-slate-400">Uploaded</div>
                  <div className="text-slate-300 tabular-nums">{previewDoc.uploadedAt}</div>
                </div>
              </div>
              {previewDoc.notes && (
                <p className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 leading-relaxed">
                  {previewDoc.notes}
                </p>
              )}
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDownloadDocument(previewDoc);
                  setPreviewDoc(null);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <Upload className="w-4 h-4 text-amber-400" />
                <span>Upload Client Document</span>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUploadSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="e.g. Kitchen Appliance Spec Sheet"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Category</label>
                <select
                  value={newDocCategory}
                  onChange={(e) => setNewDocCategory(e.target.value as SharedDocument['category'])}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="client_uploads">Client Uploads &amp; Preferences</option>
                  <option value="architectural_drawings">Architectural Drawings</option>
                  <option value="structural_reports">Structural Reports</option>
                  <option value="permits_sanctions">Permits &amp; Sanctions</option>
                  <option value="boq_financials">Financials &amp; Receipts</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Select File</label>
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setNewDocFile(e.target.files[0]);
                      if (!newDocTitle) setNewDocTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
                    }
                  }}
                  className="w-full text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-amber-300"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={newDocNotes}
                  onChange={(e) => setNewDocNotes(e.target.value)}
                  placeholder="Context for Ar. S. Gouse..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold"
                >
                  {isUploading ? 'Uploading...' : 'Upload to Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Raise Client Request / RFI Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Raise Client Request / RFI</span>
              </div>
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleRaiseClientRequest} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Summary *</label>
                <input
                  type="text"
                  required
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  placeholder="e.g. Add outdoor BBQ pergola power conduit on terrace"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Request Type</label>
                  <select
                    value={reqType}
                    onChange={(e) => setReqType(e.target.value as 'change_order' | 'rfi' | 'snag')}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="rfi">Question / RFI</option>
                    <option value="change_order">Scope Change Order</option>
                    <option value="snag">Site Snag / Warranty</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Trade</label>
                  <select
                    value={reqTrade}
                    onChange={(e) => setReqTrade(e.target.value as FieldOperationItem['trade'])}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Finishes">Finishes</option>
                    <option value="MEP">MEP</option>
                    <option value="Structural">Structural</option>
                    <option value="Civil & Masonry">Civil &amp; Masonry</option>
                    <option value="Waterproofing">Waterproofing</option>
                    <option value="Bylaws">Bylaws</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Details</label>
                <textarea
                  rows={3}
                  value={reqNotes}
                  onChange={(e) => setReqNotes(e.target.value)}
                  placeholder="Describe the requested change, location, or clarification..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold"
                >
                  Submit to Studio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Site Visit Camera Modal */}
      <SiteVisitCameraModal
        isOpen={isSiteCameraModalOpen}
        onClose={() => setIsSiteCameraModalOpen(false)}
        activeProject={activeProject}
      />
    </div>
  );
};

export default ClientView;
