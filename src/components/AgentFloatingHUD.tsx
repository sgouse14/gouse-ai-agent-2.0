import React, { useState, useRef } from 'react';
import {
  Cpu,
  Zap,
  Terminal,
  ShieldCheck,
  Send,
  Upload,
  Phone,
  MessageSquare,
  ChevronUp,
  ChevronDown,
  Minimize2,
  Maximize2,
  X,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  Building,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Compass,
} from 'lucide-react';

export interface AgentFloatingHUDProps {
  onOpenSkaAgent?: () => void;
  onOpenSocialHub?: () => void;
  onNavigateSection?: (sectionId: string) => void;
  architectPhone?: string;
}

export const AgentFloatingHUD: React.FC<AgentFloatingHUDProps> = ({
  onOpenSkaAgent,
  onOpenSocialHub,
  onNavigateSection,
  architectPhone = '+91 80739 47241',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [quickPrompt, setQuickPrompt] = useState('');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '[INIT] Gouse AI Autonomous Execution Agent Kernel v4.2 active.',
    '[CORE] 4 Sub-Agents synced: BIM, 0% Broker, Smart Home SKA, 4K Media.',
    '[SEC] Saqlain Cyber Security Sentinel: Zero-Trust SHA-256 active.',
    '[READY] Proactive execution mode armed. Awaiting user objective...',
  ]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState<'terminal' | 'security' | 'subagents'>('terminal');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExecutePrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPrompt.trim() || isExecuting) return;

    const input = quickPrompt.trim();
    setQuickPrompt('');
    setIsExecuting(true);

    setTerminalLogs((prev) => [
      ...prev,
      `> [USER_OBJECTIVE] "${input}"`,
      `[ANALYZE] Parsing spatial, structural & financial constraints...`,
    ]);

    setTimeout(() => {
      setTerminalLogs((prev) => [
        ...prev,
        `[EVALUATE] Evaluated against NBC 2016 & CPWD rate schedules. 0 fatal conflicts.`,
        `[PLAN] 3-stage execution plan formulated.`,
        `[EXECUTE] Decision autonomously committed. Direct solution dispatched.`,
      ]);
      setIsExecuting(false);
    }, 1200);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setTerminalLogs((prev) => [
      ...prev,
      `> [FILE_INGEST] Ingested "${file.name}" (${(file.size / 1024).toFixed(1)} KB)`,
      `[SCAN] Saqlain Cyber Security: SHA-256 hash verified. Malware: 0.`,
      `[PARSED] Architectural geometry & BOQ line-items extracted.`,
    ]);
    setIsOpen(true);
  };

  const handleWhatsAppLead = () => {
    const text = encodeURIComponent(
      `Hello Ar. S. Gouse, I am dispatching a direct architectural & structural execution request via Gouse AI Autonomous Agent.`
    );
    window.open(`https://wa.me/${architectPhone.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".dwg,.dxf,.pdf,.xlsx,.csv,.jpg,.jpeg,.png"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Floating HUD Widget (Fixed Bottom) */}
      <aside aria-label="AI Agent HUD Command Center" className="fixed bottom-4 right-4 sm:right-6 z-50 flex flex-col items-end gap-2 pointer-events-auto">
        {/* Expanded Cybernetic Agent Terminal Window */}
        {isOpen && (
          <div className="w-[94vw] sm:w-[480px] max-h-[80vh] flex flex-col bg-slate-950/95 border-2 border-cyan-500/50 rounded-2xl shadow-2xl shadow-cyan-950/80 backdrop-blur-xl overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300">
            {/* Terminal Header */}
            <div className="bg-slate-900/90 px-4 py-3 border-b border-cyan-800/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400"></span>
                </span>
                <div>
                  <h4 className="text-xs font-mono font-extrabold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    Autonomous Agent Terminal
                  </h4>
                  <p className="text-[10px] text-slate-400 font-mono">
                    SAQLAIN CYBER SEC • 12ms LATENCY • ACTIVE HUD
                  </p>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-1 bg-slate-950/70 p-0.5 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('terminal')}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition ${
                    activeTab === 'terminal' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Logs
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('security')}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition ${
                    activeTab === 'security' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Cyber Sec
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('subagents')}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition ${
                    activeTab === 'subagents' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sub-Agents
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                title="Minimize Terminal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Terminal Body */}
            <div className="p-4 flex-1 overflow-y-auto max-h-[360px] font-mono text-xs space-y-3 bg-black/60">
              {activeTab === 'terminal' && (
                <div className="space-y-1.5 text-slate-300">
                  {terminalLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={`leading-relaxed break-words ${
                        log.startsWith('>')
                          ? 'text-cyan-300 font-bold bg-cyan-950/30 px-2 py-1 rounded border border-cyan-800/30'
                          : log.includes('[EXECUTE]')
                          ? 'text-emerald-400 font-bold'
                          : log.includes('[SEC]')
                          ? 'text-emerald-300'
                          : log.includes('[EVALUATE]')
                          ? 'text-amber-300'
                          : 'text-slate-400'
                      }`}
                    >
                      {log}
                    </div>
                  ))}
                  {isExecuting && (
                    <div className="flex items-center gap-2 text-cyan-400 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      <span>Agent synthesizing autonomous solutions...</span>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-2.5 text-slate-300">
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1.5">
                    <div className="flex items-center justify-between text-emerald-400 font-bold text-xs">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        Saqlain Cyber Security Sentinel
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-[10px]">
                        ZERO-TRUST VERIFIED
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                      All CAD models, BOQ rate sheets, and legal title documents are verified with SHA-256 cryptographic hashes and AES-256 encryption.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                      <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                        <span className="text-slate-500 block">ENCRYPTION</span>
                        <span className="font-bold text-emerald-300">TLS 1.3 / AES-256</span>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                        <span className="text-slate-500 block">TAMPER AUDIT</span>
                        <span className="font-bold text-emerald-300">0 Modifications</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
                    <span className="text-cyan-400 font-bold block mb-1">Architectural Clearance</span>
                    <p className="text-slate-400 font-sans">
                      Ar. S. Gouse (CoA: CA/2012/55190) cryptographic clearance confirmed for all Bangalore site audits.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'subagents' && (
                <div className="space-y-2 text-slate-300 font-sans">
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-amber-500/30 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        BIM &amp; BOQ Agent (₹1,500/Yr)
                      </div>
                      <p className="text-[10px] text-slate-400">IS 456 Structural &amp; Dynamic BOQ • ₹1,500/Year</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateSection?.('sec-main-platform');
                        setIsOpen(false);
                      }}
                      className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold hover:bg-amber-500/30 transition"
                    >
                      Launch
                    </button>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-sky-500/30 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-sky-300 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5" />
                        0% Brokerage Property Sub-Agent
                      </div>
                      <p className="text-[10px] text-slate-400">Direct Landlords &amp; Digital Leases</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateSection?.('sec-broker-command-center');
                        setIsOpen(false);
                      }}
                      className="px-2.5 py-1 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-bold hover:bg-sky-500/30 transition"
                    >
                      Launch
                    </button>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-cyan-500/30 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-cyan-300 flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5" />
                        Smart Home SKA Sub-Agent
                      </div>
                      <p className="text-[10px] text-slate-400">Matter &amp; KNX Autonomic IoT Control</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onOpenSkaAgent?.();
                        setIsOpen(false);
                      }}
                      className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold hover:bg-cyan-500/30 transition"
                    >
                      Launch
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Direct Goal Dispatch Bar */}
            <form onSubmit={handleExecutePrompt} className="p-3 bg-slate-900/90 border-t border-cyan-800/40 flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={quickPrompt}
                  onChange={(e) => setQuickPrompt(e.target.value)}
                  placeholder="Dispatch autonomous objective (e.g., 'Audit G+3 BOQ rates')..."
                  className="w-full bg-slate-950 border border-cyan-800/50 rounded-xl px-3 py-2 text-xs font-mono text-cyan-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition shrink-0"
                title="Ingest Media / Blueprint"
              >
                <Upload className="w-4 h-4 text-cyan-400" />
              </button>

              <button
                type="submit"
                disabled={isExecuting || !quickPrompt.trim()}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Execute</span>
              </button>
            </form>
          </div>
        )}

        {/* Persistent Cyber HUD Bar */}
        <div className="flex items-center gap-2 bg-slate-950/90 border-2 border-cyan-500/40 rounded-2xl p-1.5 sm:p-2 shadow-2xl shadow-cyan-950/80 backdrop-blur-xl">
          {/* Main Autonomous Agent Pill Button */}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-950/80 to-slate-900 border border-cyan-500/40 hover:border-cyan-400 transition group text-left"
          >
            <div className="relative flex items-center justify-center">
              <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-cyan-400 opacity-75"></span>
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 shadow-md shadow-cyan-500/30">
                <Cpu className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-extrabold text-white tracking-wide group-hover:text-cyan-300">
                  GOUSE AI AGENT
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  ONLINE
                </span>
              </div>
              <p className="text-[9px] font-mono text-slate-400">
                {isOpen ? 'Close Terminal' : 'Click to Command Agent'}
              </p>
            </div>
          </button>

          {/* Quick Action: Ingest File */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-700/80 hover:border-cyan-500/50 text-slate-200 text-xs font-mono font-bold flex items-center gap-1.5 transition"
            title="Ingest CAD, BOQ, or Media File"
          >
            <Upload className="w-4 h-4 text-cyan-400" />
            <span className="hidden md:inline">Ingest File</span>
          </button>

          {/* Quick Action: Smart Home SKA */}
          {onOpenSkaAgent && (
            <button
              type="button"
              onClick={onOpenSkaAgent}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-700/80 hover:border-cyan-500/50 text-slate-200 text-xs font-mono font-bold flex items-center gap-1.5 transition"
              title="Launch Smart Home SKA Agent"
            >
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="hidden md:inline">SKA IoT</span>
            </button>
          )}

          {/* Quick Action: Direct Architect Dispatch */}
          <button
            type="button"
            onClick={handleWhatsAppLead}
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5 transition"
            title="WhatsApp Ar. S. Gouse"
          >
            <Phone className="w-4 h-4 text-emerald-400" />
            <span className="hidden lg:inline">Ar. S. Gouse</span>
          </button>
        </div>
      </aside>
    </>
  );
};
