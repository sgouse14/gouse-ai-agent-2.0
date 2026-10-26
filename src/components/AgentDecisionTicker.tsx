import React, { useState, useEffect } from 'react';
import {
  Activity,
  ShieldCheck,
  Zap,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export interface AgentDecisionItem {
  id: string;
  timestamp: string;
  agentType: 'BIM' | 'BROKER' | 'SKA_IOT' | 'CYBER_SEC' | 'BOQ';
  decision: string;
  status: 'EXECUTED' | 'MITIGATED' | 'AUTONOMOUS';
  metric: string;
}

const DEFAULT_DECISIONS: AgentDecisionItem[] = [
  {
    id: 'dec-1',
    timestamp: '00:02s ago',
    agentType: 'BIM',
    decision: 'IS 456 Structural Audit: Locked Fe550D TMT rebar @ ₹4,850/Cu.M; neutralized column shear clash at Grid C-4.',
    status: 'EXECUTED',
    metric: 'Demolition Risk: 0%',
  },
  {
    id: 'dec-2',
    timestamp: '00:14s ago',
    agentType: 'CYBER_SEC',
    decision: 'Saqlain Cyber Security Sentinel: Zero-Trust SHA-256 hash verified for uploaded architectural CAD & BOQ sheets.',
    status: 'MITIGATED',
    metric: 'Integrity: 100% Tamper-Proof',
  },
  {
    id: 'dec-3',
    timestamp: '00:27s ago',
    agentType: 'SKA_IOT',
    decision: 'Autonomic Energy Balance: Inverter shifted 7.4 kW solar load; exporting +4.58 kW net clean energy to BESCOM grid.',
    status: 'AUTONOMOUS',
    metric: 'Grid Offset: +4.58 kW',
  },
  {
    id: 'dec-4',
    timestamp: '00:41s ago',
    agentType: 'BROKER',
    decision: '0% Brokerage Engine: Filtered out 3 predatory sublease contracts; auto-drafted Karnataka e-lease with BBMP A-Khata.',
    status: 'EXECUTED',
    metric: 'Brokerage Fee: ₹0',
  },
  {
    id: 'dec-5',
    timestamp: '00:58s ago',
    agentType: 'BOQ',
    decision: 'Floor Takeoff Rate Guard: Concrete slab rate benchmarked against CPWD index; contingency calibrated to 10%.',
    status: 'AUTONOMOUS',
    metric: 'Variance: ±0.0%',
  },
];

export const AgentDecisionTicker: React.FC<{
  onSelectAction?: (target: string) => void;
}> = ({ onSelectAction }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % DEFAULT_DECISIONS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const active = DEFAULT_DECISIONS[currentIndex];

  const getBadgeColor = (type: AgentDecisionItem['agentType']) => {
    switch (type) {
      case 'BIM':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'CYBER_SEC':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'SKA_IOT':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'BROKER':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      case 'BOQ':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      default:
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    }
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="w-full bg-slate-950/90 border-y border-cyan-900/40 px-3 sm:px-6 py-2 backdrop-blur-md relative overflow-hidden"
    >
      {/* Background Pulse Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-950/20 via-transparent to-cyan-950/20 pointer-events-none" />

      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs relative z-10">
        {/* Left Ticker Label */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span className="font-mono font-bold tracking-widest text-[11px] text-cyan-400 flex items-center gap-1.5 uppercase">
            <Cpu className="w-3.5 h-3.5" />
            <span>Autonomous Decisions</span>
          </span>
          <span className="hidden md:inline-block px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-700">
            LIVE STREAM
          </span>
        </div>

        {/* Center Live Decision Text */}
        <div className="flex-1 min-w-0 flex items-center gap-2.5 overflow-hidden">
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border shrink-0 ${getBadgeColor(active.agentType)}`}>
            [{active.agentType}]
          </span>
          <p className="text-slate-200 font-mono text-[11px] sm:text-xs truncate">
            {active.decision}
          </p>
          <span className="hidden lg:inline-block text-[10px] font-mono text-cyan-300/80 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/40 shrink-0">
            {active.metric}
          </span>
        </div>

        {/* Right Pager & Direct Action */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1">
            {DEFAULT_DECISIONS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  currentIndex === i ? 'w-4 bg-cyan-400' : 'w-1.5 bg-slate-700 hover:bg-slate-500'
                }`}
                title={`Decision ${i + 1}`}
              />
            ))}
          </div>

          <span className="text-[10px] font-mono text-slate-400 shrink-0">
            {active.timestamp}
          </span>
        </div>
      </div>
    </div>
  );
};
