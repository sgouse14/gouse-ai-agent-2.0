import React, { useState, useRef, useMemo } from 'react';
import {
  Cpu,
  Sparkles,
  Building2,
  Calculator,
  TrendingUp,
  ShieldCheck,
  Sun,
  HardHat,
  Landmark,
  Camera,
  Upload,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Download,
  CheckCircle2,
  ArrowRight,
  Layers,
  RefreshCw,
  Send,
  Play,
  Check,
  FileText,
  X,
  ExternalLink,
  MessageSquare,
  Sliders,
} from 'lucide-react';
import { Project, BOQItem } from '../types';
import { formatCurrency, CurrencyCode } from '../utils/formatters';

export type SuperAgentRole =
  | 'auto_orchestrate'
  | 'architect'
  | 'boq_qs'
  | 'procurement'
  | 'compliance'
  | 'mep_solar'
  | 'site_billing'
  | 'real_estate'
  | 'media_showcase';

export interface SuperAgentReport {
  agentId: Exclude<SuperAgentRole, 'auto_orchestrate'>;
  agentName: string;
  role: string;
  status: 'completed' | 'action_required';
  keyFinding: string;
  metricLabel: string;
  metricValue: string;
  recommendations: string[];
}

export interface SuperAgentExecutableAction {
  id: string;
  type:
    | 'add_boq_item'
    | 'sync_boq_live_rates'
    | 'update_contingency'
    | 'update_project_specs'
    | 'resolve_compliance_issues'
    | 'navigate_workspace';
  title: string;
  description: string;
  impactSummary: string;
  payload: any;
  applied?: boolean;
}

export interface SuperAgentMissionResult {
  missionId: string;
  timestamp: string;
  mode: SuperAgentRole;
  modelUsed: string;
  missionTitle: string;
  executiveSummary: string;
  metrics: {
    confidenceScore: number;
    complianceScore: number;
    currentBoqTotal: number;
    projectedOptimizedTotal: number;
    estimatedSavings: number;
    costPerSqFt: number;
    recommendedContingencyPct: number;
  };
  agentReports: SuperAgentReport[];
  executableActions: SuperAgentExecutableAction[];
  roadmap: Array<{
    step: number;
    phase: string;
    ownerAgent: string;
    deliverable: string;
    timeline: string;
  }>;
  liveMarketSnapshot: Array<{
    name: string;
    unit: string;
    currentPrice: number;
    trend: 'up' | 'down' | 'stable';
    changePercent: number;
  }>;
  citations: Array<{ title: string; uri?: string }>;
}

interface SuperAgentCommandCenterProps {
  activeProject: Project;
  boqItems: BOQItem[];
  currency?: string;
  onUpdateBOQItems?: (items: BOQItem[]) => void;
  onUpdateProject?: (project: Project) => void;
  onNavigateToBOQ?: () => void;
  onOpenWorkflowEngine?: () => void;
  onSendToSpecialistChat?: (prompt: string) => void;
  onNotify?: (message: string, type?: 'success' | 'info') => void;
}

interface AgentMeta {
  id: SuperAgentRole;
  name: string;
  shortRole: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}

const AGENT_ROSTER: AgentMeta[] = [
  {
    id: 'auto_orchestrate',
    name: 'Super Orchestrator',
    shortRole: 'All 8 Agents Combined',
    icon: Sparkles,
    accent: 'text-amber-400',
  },
  {
    id: 'architect',
    name: 'Chief Architect',
    shortRole: 'Massing, Daylight & Vastu',
    icon: Building2,
    accent: 'text-sky-400',
  },
  {
    id: 'boq_qs',
    name: 'BOQ & Cost QS',
    shortRole: 'IS 1200 Takeoffs & Audit',
    icon: Calculator,
    accent: 'text-emerald-400',
  },
  {
    id: 'procurement',
    name: 'Live Market Buyer',
    shortRole: 'Mandi Spot Rates & Hedges',
    icon: TrendingUp,
    accent: 'text-amber-300',
  },
  {
    id: 'compliance',
    name: 'Structural & NBC',
    shortRole: 'IS 456 & Setback Gates',
    icon: ShieldCheck,
    accent: 'text-cyan-400',
  },
  {
    id: 'mep_solar',
    name: 'MEP, Solar & RWH',
    shortRole: 'PV Sizing & ECBC Thermal',
    icon: Sun,
    accent: 'text-yellow-400',
  },
  {
    id: 'site_billing',
    name: 'Site & RA Billing',
    shortRole: 'QA Gates & Cashflow',
    icon: HardHat,
    accent: 'text-orange-400',
  },
  {
    id: 'real_estate',
    name: 'Real Estate & ROI',
    shortRole: 'Valuation & 0% Brokerage',
    icon: Landmark,
    accent: 'text-indigo-400',
  },
  {
    id: 'media_showcase',
    name: 'Media Showcase',
    shortRole: 'Client Brief & 4K Angles',
    icon: Camera,
    accent: 'text-rose-400',
  },
];

const QUICK_MISSIONS: Array<{
  id: string;
  title: string;
  subtitle: string;
  mode: SuperAgentRole;
  objective: string;
}> = [
  {
    id: 'm-full-audit',
    title: 'Full BOQ & Market Cost Optimization',
    subtitle: 'Audits all line items against live rates, adds missing divisions, calibrates reserve.',
    mode: 'auto_orchestrate',
    objective:
      'Audit my active project BOQ end-to-end against live regional wholesale rates, flag any missing IS 1200 construction trades, compute direct savings, and generate 1-click workspace updates.',
  },
  {
    id: 'm-complete-estimate',
    title: 'Design & Estimate Complete Build',
    subtitle: 'Generates structural steel, cement, waterproofing, and solar packages from built-up area.',
    mode: 'auto_orchestrate',
    objective:
      'Design an optimized spatial, structural, and complete material estimation package calibrated to the active project built-up area and location.',
  },
  {
    id: 'm-live-hedge',
    title: 'Live Mandi Rate Sync & Procurement',
    subtitle: 'Pulls live regional Steel, Cement, Sand & RMC rates to lock favorable quotes.',
    mode: 'procurement',
    objective:
      'Compare our current BOQ material rates against live wholesale spot market prices in our city, pinpoint overpriced lines, and issue immediate rate-sync and bulk lock actions.',
  },
  {
    id: 'm-code-safety',
    title: 'IS 456 / NBC 2016 Compliance Check',
    subtitle: 'Checks seismic ductile stirrups, stairwell egress, setbacks, and waterproofing gates.',
    mode: 'compliance',
    objective:
      'Audit structural safety per IS 456 & IS 13920, NBC 2016 fire egress corridors, municipal setbacks, and identify mandatory compliance additions for the BOQ.',
  },
  {
    id: 'm-solar-mep',
    title: 'Solar PV, Rainwater & MEP Sizing',
    subtitle: 'Calculates rooftop kW capacity, annual energy payback, and plumbing shafts.',
    mode: 'mep_solar',
    objective:
      'Size rooftop on-grid solar PV capacity, rainwater harvesting recharge capacity, EV charging conduits, and MEP shaft coordination with annual ROI savings.',
  },
  {
    id: 'm-billing-pitch',
    title: 'RA Billing Stages & Client Brief',
    subtitle: 'Generates 5-stage contractor billing gates, valuation ROI, and media showcase brief.',
    mode: 'site_billing',
    objective:
      'Establish 5 stage-wise contractor RA billing gates tied to cube/steel quality tests, plus completed valuation ROI and client showcase talking points.',
  },
];

const AGENT_LANGUAGES = [
  { code: 'en-IN', label: 'English (India)' },
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'kn-IN', label: 'Kannada' },
  { code: 'te-IN', label: 'Telugu' },
  { code: 'ta-IN', label: 'Tamil' },
  { code: 'mr-IN', label: 'Marathi' },
  { code: 'auto', label: 'Auto-Detect' },
];

export const SuperAgentCommandCenter: React.FC<SuperAgentCommandCenterProps> = ({
  activeProject,
  boqItems,
  currency = 'INR',
  onUpdateBOQItems,
  onUpdateProject,
  onNavigateToBOQ,
  onOpenWorkflowEngine,
  onSendToSpecialistChat,
  onNotify,
}) => {
  const [selectedMode, setSelectedMode] = useState<SuperAgentRole>('auto_orchestrate');
  const [objectiveInput, setObjectiveInput] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en-IN');
  const [useLiveMarketData, setUseLiveMarketData] = useState<boolean>(true);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeAgentProgressIdx, setActiveAgentProgressIdx] = useState<number>(-1);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const [attachment, setAttachment] = useState<{
    fileName: string;
    mimeType: string;
    base64Data?: string;
    textContent?: string;
    sizeKb: number;
  } | null>(null);

  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const [missionHistory, setMissionHistory] = useState<SuperAgentMissionResult[]>([]);
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const formatMoney = (amountInInr: number): string => {
    const validCodes: CurrencyCode[] = ['INR', 'USD', 'EUR', 'GBP', 'AED'];
    if (validCodes.includes(currency as CurrencyCode)) {
      return formatCurrency(amountInInr, currency as CurrencyCode);
    }
    return `₹${Math.round(amountInInr).toLocaleString('en-IN')}`;
  };

  const currentBoqTotal = useMemo(
    () =>
      (boqItems || []).reduce(
        (sum, item) => sum + (Number(item.amount) || (Number(item.quantity) || 0) * (Number(item.rate) || 0)),
        0
      ),
    [boqItems]
  );

  const activeMission = useMemo(
    () => missionHistory.find((m) => m.missionId === activeMissionId) || missionHistory[0] || null,
    [missionHistory, activeMissionId]
  );

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeKb = Math.max(1, Math.round(file.size / 1024));
    const isImage = file.type.startsWith('image/');
    const reader = new FileReader();

    reader.onload = () => {
      const resultStr = typeof reader.result === 'string' ? reader.result : '';
      setAttachment({
        fileName: file.name,
        mimeType: file.type || (isImage ? 'image/png' : 'text/plain'),
        base64Data: isImage ? resultStr : undefined,
        textContent: isImage ? undefined : resultStr.slice(0, 12000),
        sizeKb,
      });
    };

    if (isImage) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const handleToggleVoice = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorBanner('Speech dictation is unavailable in this browser. Type your mission directly.');
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = selectedLanguage === 'auto' ? 'en-IN' : selectedLanguage;
    rec.interimResults = false;
    rec.onresult = (evt: any) => {
      const spoken = evt.results?.[0]?.[0]?.transcript || '';
      if (spoken) {
        setObjectiveInput((prev) => (prev ? `${prev} ${spoken}` : spoken));
      }
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
    setIsListening(true);
    rec.start();
  };

  const handleExecuteMission = async (overrideObjective?: string, overrideMode?: SuperAgentRole) => {
    const goal = (overrideObjective ?? objectiveInput).trim();
    if (!goal || isRunning) return;

    const modeToRun = overrideMode ?? selectedMode;
    setSelectedMode(modeToRun);
    if (!overrideObjective) setObjectiveInput('');
    setErrorBanner(null);
    setIsRunning(true);
    setActiveAgentProgressIdx(0);

    const progressTimer = setInterval(() => {
      setActiveAgentProgressIdx((prev) => (prev + 1) % 8);
    }, 550);

    try {
      const res = await fetch('/api/agent/super-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objective: goal,
          mode: modeToRun,
          projectData: {
            id: activeProject.id,
            name: activeProject.name,
            projectType: activeProject.projectType,
            location: activeProject.location,
            builtUpAreaSqFt: activeProject.builtUpAreaSqFt,
            contingencyPercent: activeProject.contingencyPercent,
            status: activeProject.status,
            description: activeProject.description,
            floors: activeProject.floors,
          },
          boqItems: (boqItems || []).map((b) => ({
            id: b.id,
            name: b.name,
            category: b.category,
            unit: b.unit,
            quantity: b.quantity,
            rate: b.rate,
            amount: b.amount,
            stage: b.stage,
            notes: b.notes,
          })),
          language: selectedLanguage,
          useLiveMarketData,
          attachment: attachment
            ? {
                fileName: attachment.fileName,
                mimeType: attachment.mimeType,
                base64Data: attachment.base64Data,
                textContent: attachment.textContent,
              }
            : undefined,
        }),
      });

      if (!res.ok) {
        throw new Error(`Orchestration returned HTTP ${res.status}`);
      }

      const data: SuperAgentMissionResult = await res.json();
      setMissionHistory((prev) => [data, ...prev.slice(0, 4)]);
      setActiveMissionId(data.missionId);
      onNotify?.(`Super Agent completed: ${data.missionTitle}`, 'success');
    } catch (err: any) {
      setErrorBanner(err?.message || 'Unable to execute multi-agent run. Verify server connectivity.');
    } finally {
      clearInterval(progressTimer);
      setActiveAgentProgressIdx(-1);
      setIsRunning(false);
    }
  };

  const applyActionsToWorkspace = (actionsToApply: SuperAgentExecutableAction[]) => {
    if (!activeMission || actionsToApply.length === 0) return;

    let updatedBoq = [...(boqItems || [])];
    let boqChanged = false;
    let updatedProject = { ...activeProject };
    let projectChanged = false;
    let appliedTitles: string[] = [];

    for (const act of actionsToApply) {
      if (act.applied) continue;

      if (act.type === 'add_boq_item' && act.payload) {
        const qty = Number(act.payload.quantity) || 1;
        const rate = Number(act.payload.rate) || 0;
        const itemName = act.payload.name || act.title;
        const alreadyExists = updatedBoq.some(
          (b) => b.name.toLowerCase() === itemName.toLowerCase()
        );

        if (!alreadyExists) {
          updatedBoq.push({
            id: `boq-super-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: itemName,
            category: act.payload.category || 'Concrete Works',
            unit: act.payload.unit || 'nos',
            quantity: qty,
            rate,
            amount: Math.round(qty * rate),
            notes: act.payload.notes || 'Committed by Gouse AI Super Agent',
            stage: act.payload.stage || 'Superstructure',
            status: 'approved',
          });
          boqChanged = true;
        }
        appliedTitles.push(act.title);
      } else if (act.type === 'sync_boq_live_rates' && Array.isArray(act.payload?.updates)) {
        const rateMap = new Map<string, number>();
        for (const u of act.payload.updates) {
          if (u.itemId && Number(u.newRate) > 0) {
            rateMap.set(u.itemId, Number(u.newRate));
          }
        }
        updatedBoq = updatedBoq.map((item) => {
          const liveRate = rateMap.get(item.id);
          if (liveRate !== undefined) {
            boqChanged = true;
            return {
              ...item,
              rate: liveRate,
              amount: Math.round((Number(item.quantity) || 1) * liveRate),
              notes: `${item.notes ? item.notes + ' · ' : ''}Synced to live market rate by Super Agent`,
            };
          }
          return item;
        });
        appliedTitles.push(act.title);
      } else if (act.type === 'update_contingency' && act.payload?.percent !== undefined) {
        updatedProject = {
          ...updatedProject,
          contingencyPercent: Number(act.payload.percent),
        };
        projectChanged = true;
        appliedTitles.push(act.title);
      } else if (act.type === 'update_project_specs' && act.payload) {
        updatedProject = {
          ...updatedProject,
          builtUpAreaSqFt: Number(act.payload.builtUpAreaSqFt) || updatedProject.builtUpAreaSqFt,
          location: act.payload.location || updatedProject.location,
          description: act.payload.description || updatedProject.description,
        };
        projectChanged = true;
        appliedTitles.push(act.title);
      }
    }

    if (boqChanged && onUpdateBOQItems) {
      onUpdateBOQItems(updatedBoq);
    }
    if (projectChanged && onUpdateProject) {
      onUpdateProject({
        ...updatedProject,
        auditLogs: [
          ...(updatedProject.auditLogs || []),
          {
            id: `log-super-${Date.now()}`,
            projectId: updatedProject.id,
            actor: 'Gouse AI Super Agent',
            action: 'Applied Multi-Agent Execution Batch',
            details: appliedTitles.join('; '),
            timestamp: new Date().toISOString(),
          },
        ],
      });
    }

    const appliedIdSet = new Set(actionsToApply.map((a) => a.id));
    setMissionHistory((prev) =>
      prev.map((m) =>
        m.missionId !== activeMission.missionId
          ? m
          : {
              ...m,
              executableActions: m.executableActions.map((a) =>
                appliedIdSet.has(a.id) ? { ...a, applied: true } : a
              ),
            }
      )
    );

    if (appliedTitles.length > 0) {
      onNotify?.(
        `Applied ${appliedTitles.length} Super Agent update${appliedTitles.length > 1 ? 's' : ''} to live workspace.`,
        'success'
      );
    }
  };

  const handleExportBrief = () => {
    if (!activeMission) return;
    const lines = [
      `# ${activeMission.missionTitle}`,
      `Project: ${activeProject.name} · ${activeProject.location || 'India'} · ${(activeProject.builtUpAreaSqFt || 0).toLocaleString()} sq.ft`,
      `Engine: ${activeMission.modelUsed} · Generated: ${new Date(activeMission.timestamp).toLocaleString()}`,
      '',
      `## Executive Summary`,
      activeMission.executiveSummary,
      '',
      `## Financial & Compliance Metrics`,
      `- Current BOQ Total: ${formatMoney(activeMission.metrics.currentBoqTotal)}`,
      `- Projected Optimized Total: ${formatMoney(activeMission.metrics.projectedOptimizedTotal)}`,
      `- Estimated Savings: ${formatMoney(activeMission.metrics.estimatedSavings)}`,
      `- Compliance Score: ${activeMission.metrics.complianceScore}/100`,
      '',
      `## Specialist Agent Reports`,
      ...activeMission.agentReports.map(
        (r) =>
          `### ${r.agentName} (${r.metricLabel}: ${r.metricValue})\n${r.keyFinding}\n${r.recommendations.map((rec) => `- ${rec}`).join('\n')}`
      ),
      '',
      `## Execution Roadmap`,
      ...activeMission.roadmap.map(
        (s) => `${s.step}. **${s.phase}** (${s.timeline}) — ${s.ownerAgent}: ${s.deliverable}`
      ),
    ].join('\n');

    const blob = new Blob([lines], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeProject.name.replace(/[^a-z0-9]+/gi, '_')}_SuperAgent_Brief.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleToggleSpeak = async () => {
    if (!activeMission) return;
    if (isSpeaking) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    const speechText = `${activeMission.missionTitle}. ${activeMission.executiveSummary.replace(/[*#_]/g, '')}`;
    setIsSpeaking(true);

    try {
      const res = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: speechText,
          specialist: 'general',
          language: selectedLanguage,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.audioBase64) {
          const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
          audioRef.current = audio;
          audio.onended = () => setIsSpeaking(false);
          audio.onerror = () => setIsSpeaking(false);
          await audio.play();
          return;
        }
      }
    } catch (_e) {
      // Fallback to SpeechSynthesis
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(speechText);
      utt.lang = selectedLanguage === 'auto' ? 'en-IN' : selectedLanguage;
      utt.onend = () => setIsSpeaking(false);
      utt.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utt);
    } else {
      setIsSpeaking(false);
    }
  };

  const pendingActions = activeMission?.executableActions.filter((a) => !a.applied) || [];

  return (
    <div id="super-agent-command-center" className="space-y-5">
      {/* Command Header & Context Summary */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400">
              <span className="text-amber-400 font-semibold">Super Agent Command</span>
              <span aria-hidden="true">·</span>
              <span>Gemini 4 Hydrogen</span>
              <span aria-hidden="true">·</span>
              <span>8 Coordinated Specialists</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{activeProject.name}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Multi-Agent Autonomous Execution Studio
            </h2>
            <p className="text-xs text-slate-400 max-w-3xl">
              Issue a single architectural, BOQ, procurement, compliance, or ROI objective. Eight specialized agents analyze live project metrics and regional mandi rates, then propose 1-click workspace updates.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800">
            <div className="text-right">
              <div className="text-[11px] text-slate-400">Live Project Area</div>
              <div className="text-sm font-bold text-white tabular-nums">
                {(activeProject.builtUpAreaSqFt || 3500).toLocaleString('en-IN')} sq.ft
              </div>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-right">
              <div className="text-[11px] text-slate-400">
                Active BOQ ({boqItems?.length || 0} items)
              </div>
              <div className="text-sm font-bold text-emerald-400 tabular-nums">
                {formatMoney(currentBoqTotal)}
              </div>
            </div>
            {onOpenWorkflowEngine && (
              <>
                <div className="h-8 w-px bg-slate-800 hidden sm:block" />
                <button
                  type="button"
                  onClick={onOpenWorkflowEngine}
                  className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 hover:border-amber-500/50 text-xs font-medium text-amber-300 transition whitespace-nowrap flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>CAD Gatekeeper</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 8-Agent Roster + Super Orchestrator Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2">
          {AGENT_ROSTER.map((agent, idx) => {
            const Icon = agent.icon;
            const isSelected = selectedMode === agent.id;
            const isActivePulse =
              isRunning &&
              (selectedMode === 'auto_orchestrate'
                ? idx === 0 || idx - 1 === activeAgentProgressIdx
                : isSelected);

            return (
              <button
                key={agent.id}
                type="button"
                onClick={() => setSelectedMode(agent.id)}
                className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/60 text-white'
                    : isActivePulse
                    ? 'bg-slate-950 border-emerald-500/60 text-white'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : agent.accent}`} />
                  {isActivePulse && (
                    <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold leading-tight truncate">{agent.name}</div>
                  <div className="text-[10px] text-slate-400 leading-tight truncate mt-0.5">
                    {agent.shortRole}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Command Input & Multimodal Bar */}
        <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.webp,.txt,.csv,.json,.md,.dxf"
              onChange={handleFileAttach}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-600 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition shrink-0 whitespace-nowrap"
              title="Attach floor plan image, site photo, CSV BOQ, or spec file"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Attach Plan / Spec</span>
            </button>

            <button
              type="button"
              onClick={handleToggleVoice}
              className={`px-3 py-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition shrink-0 whitespace-nowrap ${
                isListening
                  ? 'bg-red-500 border-red-400 text-white'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-600 text-slate-300 hover:text-white'
              }`}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-amber-400" />}
              <span>{isListening ? 'Listening...' : 'Voice'}</span>
            </button>

            <input
              id="input-super-agent-objective"
              type="text"
              value={objectiveInput}
              onChange={(e) => setObjectiveInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleExecuteMission();
              }}
              placeholder={
                selectedMode === 'auto_orchestrate'
                  ? 'Command all 8 agents (e.g. "Audit my BOQ against live market rates and size solar PV")...'
                  : `Command ${AGENT_ROSTER.find((a) => a.id === selectedMode)?.name} for ${activeProject.name}...`
              }
              className="flex-1 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
            />

            <button
              id="btn-launch-super-agent"
              type="button"
              onClick={() => handleExecuteMission()}
              disabled={!objectiveInput.trim() || isRunning}
              className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition shrink-0 whitespace-nowrap"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Orchestrating...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Execute Mission</span>
                </>
              )}
            </button>
          </div>

          {/* Options Row & Attachment Indicator */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={useLiveMarketData}
                  onChange={(e) => setUseLiveMarketData(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0"
                />
                <span>Include live regional market spot rates</span>
              </label>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Language:</span>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  {AGENT_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {attachment && (
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-slate-950 border border-amber-500/40 text-amber-300">
                <FileText className="w-3.5 h-3.5" />
                <span className="truncate max-w-[200px]">
                  {attachment.fileName} ({attachment.sizeKb} KB)
                </span>
                <button
                  type="button"
                  onClick={() => setAttachment(null)}
                  className="text-slate-400 hover:text-white"
                  title="Remove attachment"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Notice */}
      {errorBanner && (
        <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center justify-between gap-2">
          <span>{errorBanner}</span>
          <button type="button" onClick={() => setErrorBanner(null)} className="text-red-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1-Click Super Missions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            One-Click Autonomous Missions
          </h3>
          {missionHistory.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[11px] text-slate-500">Recent Runs:</span>
              {missionHistory.map((m, idx) => (
                <button
                  key={m.missionId}
                  type="button"
                  onClick={() => setActiveMissionId(m.missionId)}
                  className={`px-2 py-1 rounded text-[11px] transition whitespace-nowrap ${
                    activeMission?.missionId === m.missionId
                      ? 'bg-amber-500 text-slate-950 font-semibold'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  Run {missionHistory.length - idx}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {QUICK_MISSIONS.map((m) => (
            <button
              key={m.id}
              type="button"
              disabled={isRunning}
              onClick={() => handleExecuteMission(m.objective, m.mode)}
              className="p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-left transition flex flex-col justify-between gap-2 disabled:opacity-50 group"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-white group-hover:text-amber-300 transition">
                    {m.title}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 shrink-0" />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{m.subtitle}</p>
              </div>
              <div className="text-[10px] text-amber-400/90 font-medium">
                {m.mode === 'auto_orchestrate'
                  ? 'Deploys all 8 agents'
                  : `Lead: ${AGENT_ROSTER.find((a) => a.id === m.mode)?.name}`}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Active Orchestration Results */}
      {activeMission && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Mission Executive Summary & KPIs */}
          <div className="rounded-xl bg-slate-900 border border-amber-500/30 p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400">
                  <span className="text-emerald-400 font-semibold">Mission Completed</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeMission.modelUsed}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">
                    {new Date(activeMission.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">{activeMission.missionTitle}</h3>
              </div>

              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={handleToggleSpeak}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-600 text-xs text-slate-200 flex items-center gap-1.5 transition whitespace-nowrap"
                >
                  {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-amber-400" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
                  <span>{isSpeaking ? 'Stop Audio' : 'Read Brief'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportBrief}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-600 text-xs text-slate-200 flex items-center gap-1.5 transition whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Export Brief</span>
                </button>
                {onNavigateToBOQ && (
                  <button
                    type="button"
                    onClick={onNavigateToBOQ}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-xs text-emerald-300 flex items-center gap-1.5 transition whitespace-nowrap"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Open BOQ Schedule</span>
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950/70 border border-slate-800 rounded-lg p-3.5">
              {activeMission.executiveSummary}
            </p>

            {/* 4 Financial & Engineering KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[11px] text-slate-400">Current Workspace BOQ</div>
                <div className="text-lg font-bold text-white tabular-nums mt-0.5">
                  {formatMoney(activeMission.metrics.currentBoqTotal)}
                </div>
                <div className="text-[11px] text-slate-500 tabular-nums">
                  {formatMoney(activeMission.metrics.costPerSqFt)} / sq.ft avg
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[11px] text-slate-400">Projected Optimized Total</div>
                <div className="text-lg font-bold text-amber-400 tabular-nums mt-0.5">
                  {formatMoney(activeMission.metrics.projectedOptimizedTotal)}
                </div>
                <div className="text-[11px] text-slate-500 tabular-nums">
                  Contingency target: {activeMission.metrics.recommendedContingencyPct}%
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950 border border-emerald-500/30">
                <div className="text-[11px] text-emerald-400">Identified Cost Opportunity</div>
                <div className="text-lg font-bold text-emerald-300 tabular-nums mt-0.5">
                  {formatMoney(activeMission.metrics.estimatedSavings)}
                </div>
                <div className="text-[11px] text-slate-400">Rate lock &amp; value engineering</div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[11px] text-slate-400">Code &amp; Confidence Index</div>
                <div className="text-lg font-bold text-cyan-400 tabular-nums mt-0.5">
                  {activeMission.metrics.complianceScore} / 100
                </div>
                <div className="text-[11px] text-slate-500 tabular-nums">
                  Confidence: {activeMission.metrics.confidenceScore}%
                </div>
              </div>
            </div>
          </div>

          {/* 1-Click Workspace Action Queue */}
          {activeMission.executableActions.length > 0 && (
            <div className="rounded-xl bg-slate-900 border border-emerald-500/30 p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Workspace Execution Queue ({activeMission.executableActions.length})
                  </h4>
                  <p className="text-xs text-slate-400">
                    Commit verified agent updates directly to your active BOQ and project parameters.
                  </p>
                </div>
                <button
                  id="btn-apply-all-super-actions"
                  type="button"
                  disabled={pendingActions.length === 0}
                  onClick={() => applyActionsToWorkspace(pendingActions)}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition shrink-0 whitespace-nowrap"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {pendingActions.length > 0
                      ? `Apply All (${pendingActions.length}) to Workspace`
                      : 'All Updates Applied'}
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {activeMission.executableActions.map((act) => (
                  <div
                    key={act.id}
                    className={`p-3.5 rounded-lg border flex items-start justify-between gap-3 transition ${
                      act.applied
                        ? 'bg-emerald-950/20 border-emerald-500/30 opacity-80'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="text-xs font-semibold text-white">{act.title}</div>
                      <div className="text-[11px] text-slate-400 leading-snug">{act.description}</div>
                      <div className="text-[11px] text-emerald-400 font-medium">{act.impactSummary}</div>
                    </div>
                    <button
                      type="button"
                      disabled={act.applied}
                      onClick={() => applyActionsToWorkspace([act])}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 whitespace-nowrap transition flex items-center gap-1 ${
                        act.applied
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      }`}
                    >
                      {act.applied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Applied</span>
                        </>
                      ) : (
                        <span>Apply</span>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activated Specialist Agents Grid */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Specialist Agent Deliverables ({activeMission.agentReports.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {activeMission.agentReports.map((rep) => {
                const rosterMeta = AGENT_ROSTER.find((r) => r.id === rep.agentId);
                const Icon = rosterMeta?.icon || Cpu;
                return (
                  <div
                    key={rep.agentId}
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 shrink-0">
                            <Icon className={`w-4 h-4 ${rosterMeta?.accent || 'text-amber-400'}`} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">{rep.agentName}</div>
                            <div className="text-[11px] text-slate-400 truncate">{rep.role}</div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-[10px] text-slate-500">{rep.metricLabel}</div>
                          <div className="text-xs font-bold text-amber-300 tabular-nums">
                            {rep.metricValue}
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-200 leading-relaxed">{rep.keyFinding}</p>

                      <ul className="space-y-1 text-[11px] text-slate-400">
                        {rep.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-amber-400 mt-0.5">·</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {onSendToSpecialistChat && (
                      <div className="pt-2 border-t border-slate-800/80 flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            onSendToSpecialistChat(
                              `Elaborate on the ${rep.agentName} finding for ${activeProject.name}: "${rep.keyFinding}"`
                            )
                          }
                          className="text-[11px] text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Deep Dive in Chat</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Split: Execution Roadmap & Live Market Spot Benchmarks */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7 rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Execution Roadmap
              </h4>
              <div className="space-y-2.5">
                {activeMission.roadmap.map((step) => (
                  <div
                    key={step.step}
                    className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                        {step.step}
                      </span>
                      <div>
                        <div className="text-xs font-semibold text-white">{step.phase}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{step.deliverable}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{step.ownerAgent}</div>
                      </div>
                    </div>
                    <span className="text-[11px] text-amber-400 font-medium shrink-0 whitespace-nowrap">
                      {step.timeline}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Live Market Rates Referenced
              </h4>
              {activeMission.liveMarketSnapshot.length > 0 ? (
                <div className="space-y-2">
                  {activeMission.liveMarketSnapshot.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="text-slate-200 font-medium truncate">{item.name}</div>
                        <div className="text-[10px] text-slate-500">per {item.unit}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-white tabular-nums">
                          {formatMoney(item.currentPrice)}
                        </div>
                        <div
                          className={`text-[10px] tabular-nums ${
                            item.trend === 'up'
                              ? 'text-red-400'
                              : item.trend === 'down'
                              ? 'text-emerald-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {item.changePercent > 0 ? '+' : ''}
                          {item.changePercent}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Live market snapshot disabled for this mission run.
                </p>
              )}

              {activeMission.citations.length > 0 && (
                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <div className="text-[11px] text-slate-500 font-medium">Standards &amp; Sources</div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400">
                    {activeMission.citations.map((c, idx) =>
                      c.uri ? (
                        <a
                          key={idx}
                          href={c.uri}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-amber-300 hover:underline"
                        >
                          <span>{c.title}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ) : (
                        <span key={idx}>{c.title}</span>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
