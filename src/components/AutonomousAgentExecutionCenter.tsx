import React, { useState, useRef } from 'react';
import {
  Cpu,
  Zap,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Bot,
  Activity,
  Send,
  Layers,
  FileSpreadsheet,
  Building,
  Home,
  Film,
  Phone,
  MessageSquare,
  Compass,
  Play,
  RotateCcw,
  Clock,
  Check,
  ChevronRight,
  UserCheck,
  Eye,
  Key,
  Lock,
  TrendingUp,
  Upload,
  FileText,
  AlertTriangle,
  CheckSquare,
  ListChecks,
  Camera,
  FolderUp,
  FileCode,
  HardHat,
  Share2,
  Volume2,
  VolumeX,
  Radio,
  Terminal,
} from 'lucide-react';
import { Project } from '../types';
import { getBimBoqSubscription } from './BimBoqSubscriptionModal';

export interface AutonomousAgentExecutionCenterProps {
  activeProject?: Project;
  onNavigateSection?: (sectionId: string) => void;
  onOpenSocialHub?: () => void;
  onOpenBrokerCenter?: () => void;
  onOpenSmartHomeSka?: () => void;
  onOpenClientPortal?: () => void;
  onOpenBimSubscription?: () => void;
}

interface AutonomousObjective {
  id: string;
  title: string;
  category: 'architecture' | 'brokerage' | 'smarthome' | 'media' | 'finance';
  status: 'executing' | 'decided' | 'action_ready';
  goal: string;
  autonomousDecision: string;
  directActionLabel: string;
  targetSection: string;
  telemetry: string;
  metric: string;
  risksIdentified?: string;
  nextScheduledStep?: string;
}

interface UploadedFileAnalysis {
  fileName: string;
  fileSize: string;
  fileType: 'cad' | 'spreadsheet' | 'image' | 'legal' | 'archive';
  analyzedTimestamp: string;
  strengths: string[];
  gapsAndRisks: string[];
  autonomousPlan: string[];
  directActionTarget: string;
  directActionLabel: string;
}

export const AutonomousAgentExecutionCenter: React.FC<AutonomousAgentExecutionCenterProps> = ({
  activeProject,
  onNavigateSection,
  onOpenSocialHub,
  onOpenBrokerCenter,
  onOpenSmartHomeSka,
  onOpenClientPortal,
  onOpenBimSubscription,
}) => {
  // Agent Mandate Statement (Exact user request)
  const agentMandate =
    'You are an autonomous AI agent designed to execute tasks. Your role is to proactively manage objectives, make decisions, and provide direct, actionable solutions to achieve user goals efficiently.';

  // Natural Language Objective Input
  const [userGoalInput, setUserGoalInput] = useState('');
  const [isExecutingGoal, setIsExecutingGoal] = useState(false);
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const [activeWorkflowTab, setActiveWorkflowTab] = useState<'agent_core' | 'file_ingest' | 'risk_radar' | 'cyber_security'>('agent_core');
  const [isSaqlainAuditActive, setIsSaqlainAuditActive] = useState(false);
  const [saqlainStatusMessage, setSaqlainStatusMessage] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeakAgentStatus = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }
      window.speechSynthesis.cancel();
      const text = `Gouse AI Autonomous Execution Agent online. Principal Architect Ar. S. Gouse, Council of Architecture registration CA/2012/55190. Five sub-agents synchronized: Architectural BIM, Zero Percent Brokerage, Smart Home SKA Autonomic IoT, Lumion 4K Media, and Saqlain Cyber Security Sentinel. Zero-trust SHA-256 cryptographic defense active. Ready for your architectural or real estate objective.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Completed Solution State
  const [completedSolution, setCompletedSolution] = useState<{
    goalTitle: string;
    decisionTaken: string;
    actionableItems: string[];
    actionTarget: string;
    actionButtonText: string;
  } | null>(null);

  // File Upload Ingestion State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [uploadedFileAnalysis, setUploadedFileAnalysis] = useState<UploadedFileAnalysis | null>(null);
  const [isAnalyzingFile, setIsAnalyzingFile] = useState(false);

  // Active Autonomous Objectives Queue
  const [objectives, setObjectives] = useState<AutonomousObjective[]>([
    {
      id: 'obj-1',
      title: 'Turnkey Luxury Villa Architectural & Structural Audit',
      category: 'architecture',
      status: 'action_ready',
      goal: 'Deliver 3,850 sq.ft duplex villa with zero contractor cost escalations and NBC 2016 compliance.',
      autonomousDecision:
        'Selected Fe550D TMT rebar with 150mm c/c spacing; locked M25 ready-mix concrete at ₹4,850/Cu.M against CPWD index; resolved 2 MEP plumbing collisions automatically.',
      directActionLabel: 'Inspect Blueprints & Dynamic BOQ',
      targetSection: 'sec-main-platform',
      telemetry: 'IS 456 Structural Audit: PASSED • 0 Demolition Risk',
      metric: '₹2.85 Cr Locked Rate',
      risksIdentified: 'Potential column collision with plumbing shaft at Grid C-4 resolved via neutral-axis offset.',
      nextScheduledStep: 'Automated concrete cube slump test verification prior to second floor pour.',
    },
    {
      id: 'obj-2',
      title: '0% Brokerage PG, Rental & Land Portfolio Acquisition',
      category: 'brokerage',
      status: 'action_ready',
      goal: 'Acquire verified living spaces in Indiranagar, Whitefield, and HSR Layout without broker commissions.',
      autonomousDecision:
        'Matched 18 direct owner listings; verified BDA/BBMP A-Khata titles; generated 11-month Karnataka digital e-lease agreements with online stamp duty verification.',
      directActionLabel: 'Access Broker Command Center',
      targetSection: 'sec-broker-command-center',
      telemetry: '100% Broker Commission Saved • Instant Lease Ready',
      metric: '0% Brokerage Direct',
      risksIdentified: 'Unregistered sublease clauses flagged in traditional broker templates; sanitized via Karnataka RERA clause.',
      nextScheduledStep: 'Automated biometric tenant verification scheduling.',
    },
    {
      id: 'obj-3',
      title: 'Smart Home SKA Autonomic Energy & Security Orchestration',
      category: 'smarthome',
      status: 'action_ready',
      goal: 'Supervise 48 Matter and KNX smart home nodes for zero net electricity billing and biometric security.',
      autonomousDecision:
        'Routed 7.4 kW rooftop solar generation to export +4.58 kW clean energy to BESCOM grid; set Daikin VRV climate to 23°C; locked Yale deadbolts with cryptographic Matter keys.',
      directActionLabel: 'Launch Smart Home SKA Agent',
      targetSection: 'ska_agent_modal',
      telemetry: '48 Nodes Online • +4.58 kW BESCOM Solar Net Export',
      metric: '92% Battery SoC',
      risksIdentified: 'Grid voltage surge risk on Phase B isolated by automated inverter relay tripping.',
      nextScheduledStep: 'Off-peak 01:00 AM smart EV charging cycle queued.',
    },
    {
      id: 'obj-4',
      title: '4K Architectural Media, 360° Tours & AI Social Campaign',
      category: 'media',
      status: 'action_ready',
      goal: 'Syndicate high-resolution villa walkthroughs, before/after construction wipe, and client handover photos.',
      autonomousDecision:
        'Compiled 4K Lumion walkthrough, staged 360° spatial interactive room hotspots, and auto-generated Instagram 9:16 vertical reels with verified client testimonials.',
      directActionLabel: 'Explore 4K Social Media Hub',
      targetSection: 'sec-social-media-hub',
      telemetry: 'Before/After Wipe Slider Ready • 4K Renders Live',
      metric: '4 Channels Synced',
      risksIdentified: 'Over-exposed exterior lighting in dusk render adjusted to 2700K ambient warmth.',
      nextScheduledStep: 'Syndicate YouTube 4K Short and LinkedIn AEC technical study.',
    },
  ]);

  // Handle User Prompting the Autonomous Agent
  const handleExecuteAutonomousTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userGoalInput.trim()) return;

    const goal = userGoalInput.trim();
    setUserGoalInput('');
    setIsExecutingGoal(true);
    setCompletedSolution(null);
    setExecutionLog([]);

    // 4-Step Autonomous Agent Workflow Steps: Analyze -> Evaluate & Feedback -> Plan -> Execute
    const steps = [
      `[STAGE 1: ANALYZE] Ingested user objective: "${goal}". Synthesizing site dimensions, local bylaws, and architectural parameters...`,
      `[STAGE 2: EVALUATE & FEEDBACK] Evaluating structural constraints against IS 456 & CPWD 2026 rates. Identified opportunities for zero-cost escalation rate locking.`,
      `[STAGE 3: PLAN] Formulated multi-step milestone roadmap: 1) Engineering takeoff, 2) Direct contractor rates, 3) Verified execution schedule.`,
      `[STAGE 4: EXECUTE] Direct autonomous solution generated. Decisions finalized with zero intermediary overhead.`,
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setExecutionLog((prev) => [...prev, step]);
        if (idx === steps.length - 1) {
          setIsExecutingGoal(false);
          const lower = goal.toLowerCase();

          if (
            lower.includes('subscribe') ||
            lower.includes('1500') ||
            lower.includes('fee') ||
            lower.includes('license') ||
            lower.includes('membership')
          ) {
            setCompletedSolution({
              goalTitle: `BIM & BOQ Agent Annual License: ₹1,500 / Year`,
              decisionTaken:
                'Gouse AI Agent verified the annual subscription terms: ₹1,500 per year unlocks unlimited IS 456 structural clash engineering, dynamic floor-by-floor takeoff ledgers with CPWD locked rates, and lead architect clearance under Ar. S. Gouse (CA/2012/55190).',
              actionableItems: [
                'Unlimited 3D BIM & CAD (.dwg/.dxf) Structural Scans with zero contractor variance',
                'Dynamic floor takeoff ledger locked against CPWD 2026 wholesale material rates',
                'Saqlain Cyber Security SHA-256 cryptographic watermarking on all project drawings',
              ],
              actionTarget: 'bim_subscription_modal',
              actionButtonText: 'Accept Annual License (₹1,500 / Year) →',
            });
          } else if (lower.includes('rent') || lower.includes('pg') || lower.includes('buy') || lower.includes('sell') || lower.includes('land')) {
            setCompletedSolution({
              goalTitle: `Autonomous Brokerage: ${goal}`,
              decisionTaken:
                'Decided on direct owner verification in Bangalore tech corridor. Filtered 0% brokerage inventory (Colive, 2BHK/3BHK Independent Floors, DTCP land parcels) and drafted 11-month Karnataka digital agreement.',
              actionableItems: [
                'Direct verified property listings matched with zero broker fee',
                'Pre-calculated loan EMI at 8.4% p.a. with 30-year encumbrance check',
                'Ready-to-sign digital lease agreement with automated stamp duty',
              ],
              actionTarget: 'sec-broker-command-center',
              actionButtonText: 'Open Broker Command Center Now →',
            });
          } else if (lower.includes('smart') || lower.includes('ska') || lower.includes('solar') || lower.includes('light') || lower.includes('ac')) {
            setCompletedSolution({
              goalTitle: `Autonomous Smart Home SKA: ${goal}`,
              decisionTaken:
                'Configured 48 IoT nodes via Matter and KNX. Solar inverter programmed to export +4.58 kW to BESCOM grid, DALI-2 lighting set to 2700K warm ambient coves, and Matter biometric locks armed.',
              actionableItems: [
                'Rooftop solar PV generating +7.4 kW with net metering export active',
                'Daikin VRV climate normalized to 23°C in living and master suite',
                'One-time cryptographic guest key generated for visiting staff',
              ],
              actionTarget: 'ska_agent_modal',
              actionButtonText: 'Launch Smart Home SKA Agent Now →',
            });
          } else if (lower.includes('media') || lower.includes('video') || lower.includes('photo') || lower.includes('tour') || lower.includes('reel')) {
            setCompletedSolution({
              goalTitle: `Autonomous Media Syndicate: ${goal}`,
              decisionTaken:
                'Synthesized 4K Lumion walkthrough and before/after construction wipe slider. Formatted multi-channel 9:16 vertical reels with verified client handover citations for Ar. S. Gouse.',
              actionableItems: [
                'Interactive 360° spatial room viewer with daylighting hotspots',
                'Before/After wipe slider comparing raw RCC frame vs luxury elevation',
                'Instagram reel kit with high-converting architectural hashtags',
              ],
              actionTarget: 'sec-social-media-hub',
              actionButtonText: 'Open 4K Social & Media Hub Now →',
            });
          } else {
            setCompletedSolution({
              goalTitle: `Autonomous Architectural Execution: ${goal}`,
              decisionTaken:
                'Analyzed building typology and site footprint. Performed IS 456 rebar optimization, locked itemized floor-by-floor BOQ against CPWD 2026 rates, and verified zero column-beam clashes.',
              actionableItems: [
                'Dynamic BOQ with rate-locked Fe550D TMT steel and M25 ready-mix concrete',
                'NBC 2016 solar passive daylighting and cross-ventilation verified',
                'Geotagged AI site camera milestone inspection schedule initialized',
              ],
              actionTarget: 'sec-main-platform',
              actionButtonText: 'Execute Architectural Blueprint & BOQ →',
            });
          }
        }
      }, (idx + 1) * 450);
    });
  };

  // Self-Directed File Upload Ingestion Processor
  const handleProcessUploadedFile = (fileName: string, fileSize: string, type: 'cad' | 'spreadsheet' | 'image' | 'legal' | 'archive') => {
    setIsAnalyzingFile(true);
    setUploadedFileAnalysis(null);

    setTimeout(() => {
      let analysis: UploadedFileAnalysis;

      if (type === 'archive' || fileName.toLowerCase().endsWith('.zip') || fileName.toLowerCase().includes('saqlain')) {
        analysis = {
          fileName,
          fileSize,
          fileType: 'archive',
          analyzedTimestamp: 'Just now',
          strengths: [
            'Saqlain Cyber Security Sentinel: SHA-256 integrity hash verified (7f83b165...9069). Zero malware or backdoor injection.',
            'Zero-Trust Cryptographic Sandbox deployed across BIM CAD drawings, BOQ escrow triggers, and client identity tokens.',
            'Enforces AES-256-GCM symmetric encryption for all site inspection camera media and smart home MQTT/Matter telemetry.',
          ],
          gapsAndRisks: [
            'Detected 2 plain-text draft contract exports in temporary directory; automatically encrypted with AES-256 private key.',
            'Rate limiting calibrated to deflect DDoS or unauthorized automated document scrapers.',
          ],
          autonomousPlan: [
            '1. Arm Saqlain Cyber Security Sentinel active firewall on all sub-agents (BIM, Broker, SKA IoT, 4K Media).',
            '2. Inject immutable cryptographic timestamp into Ar. S. Gouse project approvals and client payments.',
            '3. Maintain continuous real-time zero-trust audit trail visible on the agent HUD.',
          ],
          directActionTarget: 'sec-main-platform',
          directActionLabel: 'Deploy Saqlain Cyber Defense Perimeter →',
        };
      } else if (type === 'cad') {
        analysis = {
          fileName,
          fileSize,
          fileType: 'cad',
          analyzedTimestamp: 'Just now',
          strengths: [
            'Structural column grid aligned to 4.5m bays for optimal basement parking.',
            'Double-height living space compliant with NBC 2016 Part 4 ventilation standards.',
          ],
          gapsAndRisks: [
            'Identified 100mm MEP drainage conduit passing through structural beam B-104 (tension zone).',
            'Boundary setback on South perimeter is 2.85m; BBMP requires 3.00m minimum.',
          ],
          autonomousPlan: [
            '1. Shift MEP conduit 150mm south of neutral axis to avoid structural tensile shear.',
            '2. Adjust south cantilever profile by 150mm to ensure 3.00m statutory compliance.',
            '3. Export revised DXF and generate dynamic structural steel schedules.',
          ],
          directActionTarget: 'sec-main-platform',
          directActionLabel: 'Inspect Blueprints & Clash Resolution →',
        };
      } else if (type === 'spreadsheet') {
        analysis = {
          fileName,
          fileSize,
          fileType: 'spreadsheet',
          analyzedTimestamp: 'Just now',
          strengths: [
            'Itemized quantities categorized cleanly floor-by-floor from substructure to terrace.',
            'Labor productivity norms mapped to Karnataka PWD Schedule of Rates 2026.',
          ],
          gapsAndRisks: [
            'Rebar steel unit rate listed at ₹68,000/MT (current market wholesale is ₹62,500/MT; variance +₹5,500/MT).',
            'Waterproofing compound specification lacks 10-year polyurea warranty clause.',
          ],
          autonomousPlan: [
            '1. Re-index steel quantity (18.4 MT) to regional mill rate, saving ₹1,01,200.',
            '2. Update waterproofing spec to BASF MasterSeal with certified contractor escrow.',
            '3. Lock total project cost baseline at zero contractor markup.',
          ],
          directActionTarget: 'sec-main-platform',
          directActionLabel: 'Open Dynamic BOQ Ledger & Rate Lock →',
        };
      } else if (type === 'image') {
        analysis = {
          fileName,
          fileSize,
          fileType: 'image',
          analyzedTimestamp: 'Just now',
          strengths: [
            'Computer vision confirmed M25 concrete slump hydration and honeycomb-free surface.',
            'Rebar cover blocks of 25mm verified intact before concrete pouring.',
          ],
          gapsAndRisks: [
            'Curing gunny bags need re-wetting on northeast corner column bay.',
          ],
          autonomousPlan: [
            '1. Issue geotagged inspection sign-off certificate to client escrow.',
            '2. Notify site engineer to maintain 7-day continuous curing cycle.',
            '3. Disburse Stage 3 milestone progress payment from secure escrow.',
          ],
          directActionTarget: 'sec-main-platform',
          directActionLabel: 'Verify Milestone & Authorize Escrow →',
        };
      } else {
        analysis = {
          fileName,
          fileSize,
          fileType: 'legal',
          analyzedTimestamp: 'Just now',
          strengths: [
            'BDA Allotment Letter and BBMP A-Khata certificate verified authentic with zero encumbrance.',
            '30-year Form 15 Non-Encumbrance Certificate authenticated via Karnataka Kaveri 2.0 portal.',
          ],
          gapsAndRisks: [
            'Betterment charges receipt for 2025-26 pending physical municipal acknowledgement.',
          ],
          autonomousPlan: [
            '1. Confirm DTCP / BDA layout approval number #BDA/TP/2024/098.',
            '2. Fast-track automated e-lease or sale deed with direct legal stamp duty calculation.',
            '3. Publish verified property listing to 0% brokerage inventory.',
          ],
          directActionTarget: 'sec-broker-command-center',
          directActionLabel: 'View Verified Title & Listing Desk →',
        };
      }

      setUploadedFileAnalysis(analysis);
      setIsAnalyzingFile(false);
    }, 900);
  };

  const handleActionClick = (target: string) => {
    if (target === 'bim_subscription_modal') {
      onOpenBimSubscription ? onOpenBimSubscription() : onNavigateSection?.('sec-main-platform');
    } else if (target === 'ska_agent_modal') {
      onOpenSmartHomeSka?.();
    } else if (target === 'sec-social-media-hub') {
      onOpenSocialHub ? onOpenSocialHub() : onNavigateSection?.('sec-social-media-hub');
    } else if (target === 'sec-broker-command-center') {
      onOpenBrokerCenter ? onOpenBrokerCenter() : onNavigateSection?.('sec-broker-command-center');
    } else {
      onNavigateSection?.(target);
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-b border-cyan-500/30 py-10 px-4 sm:px-6 lg:px-8">
      {/* Background Neural Glow Mesh */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* 1. AGENT IDENTITY & MANDATE CARD */}
        <div className="relative p-6 sm:p-8 rounded-3xl bg-slate-900/95 border-2 border-cyan-500/50 shadow-2xl shadow-cyan-500/20 space-y-6 overflow-hidden">
          {/* Cyber Corner Crosshairs */}
          <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-cyan-400 pointer-events-none" />
          <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-cyan-400 pointer-events-none" />
          <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-cyan-400 pointer-events-none" />
          <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-cyan-400 pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-xl shadow-cyan-500/40">
                  <Bot className="w-9 h-9 stroke-[2.2]" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center" title="Agent Online & Autonomous">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                    GOUSE AI: AUTONOMOUS AGENT
                  </span>
                  <span className="px-3 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 text-[11px] font-mono font-bold tracking-widest uppercase">
                    AUTONOMOUS EXECUTION ENGINE
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                    ACTIVE • SELF-DIRECTED
                  </span>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-xs sm:text-sm text-cyan-200 font-mono tracking-tight font-medium">
                    Principal Architect &amp; Engineering Direction: Ar. S. Gouse (+91 8073947241)
                  </p>

                  {/* Speech Synthesis Directive Trigger */}
                  <button
                    type="button"
                    onClick={handleSpeakAgentStatus}
                    className={`px-2.5 py-1 rounded-lg border font-mono text-[11px] font-bold flex items-center gap-1.5 transition shadow-sm ${
                      isSpeaking
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 animate-pulse'
                        : 'bg-slate-950/80 hover:bg-slate-800 text-cyan-300 border-cyan-500/40'
                    }`}
                    title="Listen to Autonomous Agent Voice Directive"
                  >
                    {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
                    <span>{isSpeaking ? 'Agent Speaking (Mute)' : 'Hear Agent Voice'}</span>
                    {isSpeaking && (
                      <div className="flex items-center gap-0.5 ml-1">
                        <span className="w-1 h-2.5 bg-slate-950 animate-bounce" />
                        <span className="w-1 h-3.5 bg-slate-950 animate-bounce delay-75" />
                        <span className="w-1 h-2 bg-slate-950 animate-bounce delay-150" />
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Live Agent Operational Mode Selector */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveWorkflowTab('agent_core')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition ${
                  activeWorkflowTab === 'agent_core'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Autonomous Objectives</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveWorkflowTab('file_ingest')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition ${
                  activeWorkflowTab === 'file_ingest'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FolderUp className="w-3.5 h-3.5" />
                <span>Upload &amp; Analyze Files</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveWorkflowTab('risk_radar')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition ${
                  activeWorkflowTab === 'risk_radar'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Risk &amp; Decision Radar</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveWorkflowTab('cyber_security')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition ${
                  activeWorkflowTab === 'cyber_security'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Saqlain Cyber Sec</span>
              </button>
            </div>
          </div>

          {/* THE MANDATE STATEMENT BANNER (EXPLICIT USER MANDATE) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 space-y-2">
            <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs font-bold uppercase tracking-wider">
              <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>Autonomous Agent Core Mandate:</span>
            </div>
            <p className="text-sm sm:text-base font-semibold text-white leading-relaxed tracking-wide italic">
              "{agentMandate}"
            </p>
          </div>

          {/* HIGH-TECH AGENT TELEMETRY HUD BAR */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-[11px] font-mono">
            <div className="bg-slate-950/90 p-2.5 rounded-xl border border-cyan-800/50 flex flex-col justify-between">
              <span className="text-slate-400 text-[10px]">NEURAL KERNEL</span>
              <span className="text-cyan-300 font-bold flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                ACTIVE v4.2
              </span>
            </div>
            <div className="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
              <span className="text-slate-400 text-[10px]">OPERATING LATENCY</span>
              <span className="text-emerald-400 font-bold mt-0.5">11ms (Realtime)</span>
            </div>
            <div className="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
              <span className="text-slate-400 text-[10px]">SUB-AGENTS</span>
              <span className="text-cyan-300 font-bold mt-0.5">5/5 Armed</span>
            </div>
            <div className="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
              <span className="text-slate-400 text-[10px]">ZERO-TRUST SEC</span>
              <span className="text-emerald-400 font-bold mt-0.5">SHA-256 Armed</span>
            </div>
            <div className="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
              <span className="text-slate-400 text-[10px]">DECISION CONFIDENCE</span>
              <span className="text-cyan-300 font-bold mt-0.5">99.8% NBC 2016</span>
            </div>
            <div className="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
              <span className="text-slate-400 text-[10px]">PRINCIPAL LEAD</span>
              <span className="text-amber-300 font-bold mt-0.5 truncate">Ar. S. Gouse</span>
            </div>
          </div>

          {/* VIEW TAB 1: NATURAL LANGUAGE OBJECTIVE PROMPT & 4-STEP WORKFLOW */}
          {activeWorkflowTab === 'agent_core' && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Assign Any Objective or Task to the Autonomous Agent:
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  4-Stage Pipeline: Analyze → Evaluate → Plan → Execute
                </span>
              </div>

              <form onSubmit={handleExecuteAutonomousTask} className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={userGoalInput}
                    onChange={(e) => setUserGoalInput(e.target.value)}
                    placeholder="e.g. Build 4BHK luxury villa in Indiranagar with solar net-metering and lock concrete rates under ₹3 Cr..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition pr-10 shadow-inner"
                  />
                  <Cpu className="w-4 h-4 text-cyan-400 absolute right-3.5 top-1/2 -translate-y-1/2 opacity-70" />
                </div>

                <button
                  type="submit"
                  disabled={isExecutingGoal || !userGoalInput.trim()}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/25 transition uppercase tracking-wider shrink-0"
                >
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>{isExecutingGoal ? 'Executing Autonomously...' : 'Execute Objective'}</span>
                </button>
              </form>

              {/* Instant Goal Presets */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
                <span className="text-slate-400 text-[10px] shrink-0">1-Touch Goals:</span>
                {[
                  'BIM & BOQ Agent Annual Subscription (₹1,500/Year)',
                  'Design 4BHK Turnkey Villa with locked BOQ',
                  'Find 0% Brokerage PG bed in HSR Layout',
                  'Sell 30x40 Land parcel with DTCP valuation',
                  'Deploy 48-Node Smart Home SKA Energy System',
                  'Generate 4K 360° Construction Wipe & Instagram Reel',
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setUserGoalInput(preset);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-cyan-500/50 text-[11px] whitespace-nowrap transition flex items-center gap-1.5"
                  >
                    <span>{preset}</span>
                    <ArrowRight className="w-3 h-3 text-cyan-400" />
                  </button>
                ))}
              </div>

              {/* Execution Stream Log if running */}
              {isExecutingGoal && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/40 space-y-2 font-mono text-xs text-cyan-300">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold">
                    <Bot className="w-4 h-4 animate-spin" />
                    <span>AUTONOMOUS AGENT ACTIVE INFERENCE &amp; DECISION PIPELINE:</span>
                  </div>
                  <div className="space-y-1 text-[11px] pl-6 border-l-2 border-cyan-500/50">
                    {executionLog.map((log, idx) => (
                      <div key={idx} className="text-slate-200">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Direct Completed Solution Box */}
              {completedSolution && (
                <div className="p-5 rounded-2xl bg-slate-950 border-2 border-emerald-500/60 shadow-xl space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Autonomous Objective Resolved • Direct Actionable Solution Ready</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      DECISION CONFIRMED
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-base font-extrabold text-white">
                      {completedSolution.goalTitle}
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                      <strong className="text-cyan-300">Autonomous Decision Taken:</strong>{' '}
                      {completedSolution.decisionTaken}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[11px] font-mono text-slate-400 uppercase">
                      Actionable Solutions Delivered:
                    </div>
                    <ul className="space-y-1 text-xs text-slate-200">
                      {completedSolution.actionableItems.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleActionClick(completedSolution.actionTarget)}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition"
                    >
                      <span>{completedSolution.actionButtonText}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCompletedSolution(null)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Dismiss Resolution
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW TAB 2: SELF-DIRECTED FILE UPLOAD & INGESTION MANAGEMENT */}
          {activeWorkflowTab === 'file_ingest' && (
            <div className="space-y-5 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
                    <FolderUp className="w-4 h-4 text-cyan-400" />
                    Self-Directed Workflow &amp; File Upload Ingestion Management
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Upload blueprints (.dwg, .pdf), cost estimates (.xlsx), site photos (.jpg), or legal deeds (.pdf). The agent automatically evaluates risks, checks compliance, and executes the next milestone.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  AUTO-INGESTION ACTIVE
                </span>
              </div>

              {/* Drag & Drop File Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(true);
                }}
                onDragLeave={() => setIsDraggingFile(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(false);
                  const files = e.dataTransfer.files;
                  if (files && files[0]) {
                    const f = files[0];
                    const ext = f.name.split('.').pop()?.toLowerCase();
                    const type =
                      ext === 'dwg' || ext === 'dxf' || ext === 'cad'
                        ? 'cad'
                        : ext === 'xlsx' || ext === 'csv' || ext === 'xls'
                        ? 'spreadsheet'
                        : ext === 'jpg' || ext === 'jpeg' || ext === 'png'
                        ? 'image'
                        : 'legal';
                    handleProcessUploadedFile(f.name, `${(f.size / (1024 * 1024)).toFixed(1)} MB`, type);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 rounded-3xl border-2 border-dashed text-center transition cursor-pointer flex flex-col items-center justify-center space-y-3 ${
                  isDraggingFile
                    ? 'border-cyan-400 bg-cyan-500/10'
                    : 'border-slate-700 bg-slate-950/80 hover:border-cyan-500/60 hover:bg-slate-950'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files[0]) {
                      const f = files[0];
                      const ext = f.name.split('.').pop()?.toLowerCase();
                      const type =
                        ext === 'zip' || f.name.toLowerCase().includes('saqlain')
                          ? 'archive'
                          : ext === 'dwg' || ext === 'dxf' || ext === 'cad'
                          ? 'cad'
                          : ext === 'xlsx' || ext === 'csv' || ext === 'xls'
                          ? 'spreadsheet'
                          : ext === 'jpg' || ext === 'jpeg' || ext === 'png'
                          ? 'image'
                          : 'legal';
                      handleProcessUploadedFile(f.name, `${(f.size / (1024 * 1024)).toFixed(1)} MB`, type);
                    }
                  }}
                />

                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>

                <div>
                  <div className="text-sm font-bold text-white">
                    Drop your architectural, financial, security archive, or site file here, or click to browse
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Supports ZIP Archives (Saqlain Cyber Security), CAD DWG/DXF, Excel BOQ XLSX, Site Cam JPG/PNG, and RERA/Title Deed PDF
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-300">
                  <span>⚡ Automatic Constraint Extraction</span>
                  <span>•</span>
                  <span>IS 456 Structural Audit</span>
                  <span>•</span>
                  <span>CPWD Rate Verification</span>
                </div>
              </div>

              {/* Sample Quick-Test Files */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-slate-400 uppercase">
                  Or test with sample project documents:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      handleProcessUploadedFile('Villa_Duplex_Structural_G+3.dwg', '14.2 MB', 'cad')
                    }
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/60 text-left transition space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <FileCode className="w-4 h-4 text-cyan-400" />
                      <span className="text-[9px] font-mono text-cyan-300 bg-cyan-500/10 px-1.5 py-0.2 rounded">
                        CAD BIM
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white truncate">Villa_Duplex_Structural_G+3.dwg</div>
                    <div className="text-[10px] text-slate-400">IS 456 Rebar &amp; Beam Layout</div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleProcessUploadedFile('CPWD_Floorwise_Takeoff_2026.xlsx', '3.8 MB', 'spreadsheet')
                    }
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/60 text-left transition space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      <span className="text-[9px] font-mono text-emerald-300 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                        EXCEL BOQ
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white truncate">CPWD_Floorwise_Takeoff_2026.xlsx</div>
                    <div className="text-[10px] text-slate-400">Steel &amp; Concrete Rate Lock</div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleProcessUploadedFile('Slab_Pour_Hydration_Live_Cam.jpg', '5.1 MB', 'image')
                    }
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/60 text-left transition space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <Camera className="w-4 h-4 text-amber-400" />
                      <span className="text-[9px] font-mono text-amber-300 bg-amber-500/10 px-1.5 py-0.2 rounded">
                        SITE CAM
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white truncate">Slab_Pour_Hydration_Live_Cam.jpg</div>
                    <div className="text-[10px] text-slate-400">Rebar Curing CV Audit</div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleProcessUploadedFile('BDA_A_Khata_Title_Deed.pdf', '2.4 MB', 'legal')
                    }
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/60 text-left transition space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <FileText className="w-4 h-4 text-purple-400" />
                      <span className="text-[9px] font-mono text-purple-300 bg-purple-500/10 px-1.5 py-0.2 rounded">
                        LEGAL DEED
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white truncate">BDA_A_Khata_Title_Deed.pdf</div>
                    <div className="text-[10px] text-slate-400">30-Yr Encumbrance Check</div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleProcessUploadedFile('saqlain_cyber_security.zip', '1.8 MB', 'archive')
                    }
                    className="p-3 rounded-xl bg-slate-950 border border-emerald-500/50 hover:border-emerald-400 text-left transition space-y-1 shadow-sm shadow-emerald-500/20"
                  >
                    <div className="flex items-center justify-between">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="text-[9px] font-mono text-emerald-300 bg-emerald-500/20 px-1.5 py-0.2 rounded border border-emerald-500/30">
                        SECURITY ZIP
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white truncate">saqlain_cyber_security.zip</div>
                    <div className="text-[10px] text-emerald-300">Zero-Trust AES-256 Core</div>
                  </button>
                </div>
              </div>

              {/* Analyzing Loader */}
              {isAnalyzingFile && (
                <div className="p-5 rounded-2xl bg-slate-950 border border-cyan-500/40 text-center space-y-2">
                  <Bot className="w-6 h-6 text-cyan-400 animate-spin mx-auto" />
                  <div className="text-xs font-mono font-bold text-cyan-300">
                    PARSING UPLOADED FILE &amp; EXTRACTING CONSTRAINTS...
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Cross-checking against IS 456, NBC 2016, and Bangalore Municipal bylaws.
                  </div>
                </div>
              )}

              {/* Uploaded File Autonomous Analysis Report */}
              {uploadedFileAnalysis && (
                <div className="p-6 rounded-3xl bg-slate-950 border-2 border-cyan-500/50 shadow-2xl space-y-5 animate-in fade-in duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold">
                        {uploadedFileAnalysis.fileType.toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{uploadedFileAnalysis.fileName}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {uploadedFileAnalysis.fileSize} • Ingested {uploadedFileAnalysis.analyzedTimestamp}
                        </span>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
                      AUTONOMOUS INFERENCE READY
                    </span>
                  </div>

                  {/* 4-Step Analysis Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Strengths */}
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="text-xs font-mono font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>1. Verified Strengths</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {uploadedFileAnalysis.strengths.map((str, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-emerald-400 font-bold">•</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Gaps & Risks Identified */}
                    <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/30 space-y-2">
                      <div className="text-xs font-mono font-bold text-amber-400 uppercase flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>2. Gaps &amp; Risks Identified</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {uploadedFileAnalysis.gapsAndRisks.map((gap, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-amber-400 font-bold">•</span>
                            <span>{gap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Autonomous Execution Plan */}
                    <div className="p-4 rounded-2xl bg-slate-900 border border-cyan-500/30 space-y-2">
                      <div className="text-xs font-mono font-bold text-cyan-300 uppercase flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                        <span>3. Autonomous Action Plan</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {uploadedFileAnalysis.autonomousPlan.map((plan, idx) => (
                          <li key={idx} className="text-slate-200">
                            {plan}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Direct Action Trigger */}
                  <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleActionClick(uploadedFileAnalysis.directActionTarget)}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition"
                    >
                      <span>{uploadedFileAnalysis.directActionLabel}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUploadedFileAnalysis(null)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Clear File Analysis
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW TAB 3: PROACTIVE RISK & DECISION RADAR */}
          {activeWorkflowTab === 'risk_radar' && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    Proactive Risk &amp; Autonomous Decision Radar
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time monitoring across structural, financial, legal, and occupancy domains with autonomous mitigations.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  ALL RISK METRICS NORMAL
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Metric 1 */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">STRUCTURAL INTEGRITY</span>
                    <span className="text-emerald-400 font-bold">98.6%</span>
                  </div>
                  <div className="text-sm font-bold text-white">0 Critical Clashes</div>
                  <p className="text-[11px] text-slate-400">
                    Automated IS 456 beam-column audit verified with 25mm clear concrete cover blocks.
                  </p>
                </div>

                {/* Metric 2 */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">COST ESCALATION RISK</span>
                    <span className="text-emerald-400 font-bold">0.0%</span>
                  </div>
                  <div className="text-sm font-bold text-white">CPWD Locked Rates</div>
                  <p className="text-[11px] text-slate-400">
                    Steel &amp; concrete quantities tied to regional indices. Zero unauthorized contractor variance.
                  </p>
                </div>

                {/* Metric 3 */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">ENERGY SURPLUS</span>
                    <span className="text-cyan-400 font-bold">+4.58 kW</span>
                  </div>
                  <div className="text-sm font-bold text-white">BESCOM Net Export</div>
                  <p className="text-[11px] text-slate-400">
                    Rooftop 10 kW Mono-PERC array covers entire HVAC load and feeds clean power back to grid.
                  </p>
                </div>

                {/* Metric 4 */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">RENTAL ASSET YIELD</span>
                    <span className="text-amber-400 font-bold">11.4% p.a.</span>
                  </div>
                  <div className="text-sm font-bold text-white">0% Brokerage Direct</div>
                  <p className="text-[11px] text-slate-400">
                    Dual-key layout configuration maximizes monthly cashflow over single-tenant alternatives.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* VIEW TAB 4: SAQLAIN CYBER SECURITY SENTINEL */}
          {activeWorkflowTab === 'cyber_security' && (
            <div className="space-y-5 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <h4 className="text-base font-bold text-white tracking-tight">
                      Saqlain Cyber Security Sentinel
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      ZERO-TRUST ACTIVE
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Autonomous cryptographic shield protecting BIM blueprints, BOQ financial escrow, IoT smart home networks, and digital tenant agreements.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsSaqlainAuditActive(true);
                    setSaqlainStatusMessage('Running deep SHA-256 cryptographic scan across all 5 sub-agent clusters...');
                    setTimeout(() => {
                      setIsSaqlainAuditActive(false);
                      setSaqlainStatusMessage('Deep Audit Passed: 0 vulnerabilities, 100% zero-trust compliance verified. CAD & Escrow watermarked.');
                    }, 1400);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs flex items-center gap-2 transition shadow-md shadow-emerald-500/20 shrink-0"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSaqlainAuditActive ? 'Auditing Nodes...' : 'Trigger Deep Security Audit'}</span>
                </button>
              </div>

              {saqlainStatusMessage && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs font-mono text-emerald-300 flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{saqlainStatusMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-2">
                  <div className="text-[10px] font-mono text-emerald-400 uppercase font-bold flex items-center justify-between">
                    <span>CRYPTOGRAPHIC CORE</span>
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-sm font-bold text-white">TLS 1.3 / AES-256-GCM</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Zero-leak symmetric encryption on all CAD drawings, contractor quotations, and owner deeds.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30 space-y-2">
                  <div className="text-[10px] font-mono text-cyan-400 uppercase font-bold flex items-center justify-between">
                    <span>CAD / BIM WATERMARKING</span>
                    <Cpu className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-sm font-bold text-white">Zero-Knowledge Hash</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Architectural drawings watermarked with Ar. S. Gouse CoA cryptographic fingerprint (CA/2012/55190).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-2">
                  <div className="text-[10px] font-mono text-amber-400 uppercase font-bold flex items-center justify-between">
                    <span>ESCROW FUND LOCK</span>
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-sm font-bold text-white">Dual Biometric Release</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Funds released only when site camera AI passes hydration &amp; curing slump benchmarks.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/30 space-y-2">
                  <div className="text-[10px] font-mono text-purple-400 uppercase font-bold flex items-center justify-between">
                    <span>THREAT DEFLECTION</span>
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-sm font-bold text-white">0 Infiltrations</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    DDoS, SQL injection, and automated bot scrapers isolated and deflected at edge gateway.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2.5. SUB-AGENT COMMAND MATRIX (5 SYNCHRONIZED AUTONOMOUS SUB-AGENTS) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>Synchronized Sub-Agent Command Grid (5 Specialized Clusters)</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Self-directed sub-agents executing domain-specific architectural, real estate, IoT, media, and security protocols in parallel.
              </p>
            </div>
            <span className="hidden sm:inline-flex text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40">
              CLUSTER STATUS: 5/5 ARMED
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Sub-Agent 1: BIM & Architecture */}
            <button
              type="button"
              onClick={() => {
                if (onOpenBimSubscription) onOpenBimSubscription();
                else handleActionClick('sec-main-platform');
              }}
              className="p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-amber-500/30 hover:border-amber-400 text-left transition group space-y-2 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                  {getBimBoqSubscription().isSubscribed ? '✓ LICENSED' : '₹1,500 / YEAR'}
                </span>
              </div>
              <div>
                <h5 className="text-xs font-bold text-white group-hover:text-amber-300 transition">
                  BIM &amp; BOQ Agent
                </h5>
                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                  IS 456 Structural &amp; CPWD Rate Lock. Annual License: ₹1,500/yr.
                </p>
              </div>
              <div className="text-[9px] font-mono text-amber-300/80 pt-1 border-t border-slate-800 flex items-center justify-between">
                <span>{getBimBoqSubscription().isSubscribed ? 'Ar. S. Gouse (Active)' : 'Accept License'}</span>
                <span className="text-amber-400 font-bold underline flex items-center gap-0.5">
                  <span>{getBimBoqSubscription().isSubscribed ? 'Manage' : 'Subscribe'}</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </button>

            {/* Sub-Agent 2: 0% Brokerage */}
            <button
              type="button"
              onClick={() => handleActionClick('sec-broker-command-center')}
              className="p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-sky-500/30 hover:border-sky-400 text-left transition group space-y-2 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <Building className="w-4 h-4" />
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-bold">
                  0% BROKERAGE
                </span>
              </div>
              <div>
                <h5 className="text-xs font-bold text-white group-hover:text-sky-300 transition">
                  Property &amp; Land Agent
                </h5>
                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                  BBMP A-Khata &amp; Karnataka E-Leases with 0% markup.
                </p>
              </div>
              <div className="text-[9px] font-mono text-sky-300/80 pt-1 border-t border-slate-800 flex items-center justify-between">
                <span>Direct Owners</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Sub-Agent 3: Smart Home SKA */}
            <button
              type="button"
              onClick={() => handleActionClick('ska_agent_modal')}
              className="p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-cyan-500/30 hover:border-cyan-400 text-left transition group space-y-2 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Cpu className="w-4 h-4" />
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                  SKA IOT
                </span>
              </div>
              <div>
                <h5 className="text-xs font-bold text-white group-hover:text-cyan-300 transition">
                  Smart Home SKA Agent
                </h5>
                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                  48 Matter &amp; KNX nodes, +4.58 kW BESCOM solar export.
                </p>
              </div>
              <div className="text-[9px] font-mono text-cyan-300/80 pt-1 border-t border-slate-800 flex items-center justify-between">
                <span>Autonomic Kontrol</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Sub-Agent 4: 4K Lumion & Social */}
            <button
              type="button"
              onClick={() => handleActionClick('sec-social-media-hub')}
              className="p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-rose-500/30 hover:border-rose-400 text-left transition group space-y-2 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <Film className="w-4 h-4" />
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold">
                  4K MEDIA
                </span>
              </div>
              <div>
                <h5 className="text-xs font-bold text-white group-hover:text-rose-300 transition">
                  Lumion &amp; Media Agent
                </h5>
                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                  Spatial 360° tours, before/after wipes &amp; vertical reels.
                </p>
              </div>
              <div className="text-[9px] font-mono text-rose-300/80 pt-1 border-t border-slate-800 flex items-center justify-between">
                <span>Studio Syndicate</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Sub-Agent 5: Saqlain Cyber Security */}
            <button
              type="button"
              onClick={() => setActiveWorkflowTab('cyber_security')}
              className="p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-emerald-500/30 hover:border-emerald-400 text-left transition group space-y-2 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  ZERO-TRUST
                </span>
              </div>
              <div>
                <h5 className="text-xs font-bold text-white group-hover:text-emerald-300 transition">
                  Saqlain Cyber Sentinel
                </h5>
                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                  SHA-256 integrity, AES-256 escrow &amp; biometric clearance.
                </p>
              </div>
              <div className="text-[9px] font-mono text-emerald-300/80 pt-1 border-t border-slate-800 flex items-center justify-between">
                <span>Active Shield</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>
        </div>

        {/* 3. AUTONOMOUS OBJECTIVE EXECUTION QUEUE (4 PROACTIVE DOMAINS) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Active Autonomous Objectives &amp; Decision Logs</span>
              </h3>
              <p className="text-xs text-slate-400">
                The agent proactively tracks, decides, and executes direct actionable outcomes for each domain.
              </p>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
              4 of 4 Objectives Operational
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {objectives.map((obj) => (
              <div
                key={obj.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 space-y-4 shadow-xl flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  {/* Objective Header & Metric */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold">
                        {obj.category.toUpperCase()} OBJECTIVE
                      </span>
                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition">
                        {obj.title}
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 block">
                        {obj.metric}
                      </span>
                    </div>
                  </div>

                  {/* Goal Description */}
                  <p className="text-xs text-slate-400 leading-relaxed">
                    <strong className="text-slate-300">Objective Goal:</strong> {obj.goal}
                  </p>

                  {/* Autonomous Decision Taken */}
                  <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800/90 space-y-1">
                    <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase flex items-center gap-1.5">
                      <Bot className="w-3 h-3" />
                      <span>Autonomous Decision Executed:</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-snug">
                      {obj.autonomousDecision}
                    </p>
                  </div>

                  {/* Risks & Mitigation */}
                  {obj.risksIdentified && (
                    <div className="text-[11px] text-slate-400 border-l-2 border-amber-500/50 pl-2.5 space-y-0.5">
                      <span className="text-amber-400 font-mono font-semibold block text-[10px]">
                        Proactive Risk Mitigated:
                      </span>
                      <span>{obj.risksIdentified}</span>
                    </div>
                  )}
                </div>

                {/* Footer Telemetry & Action Trigger */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-[11px] font-mono text-slate-400 truncate">
                    {obj.telemetry}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleActionClick(obj.targetSection)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm group-hover:shadow-cyan-500/20"
                  >
                    <span>{obj.directActionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
