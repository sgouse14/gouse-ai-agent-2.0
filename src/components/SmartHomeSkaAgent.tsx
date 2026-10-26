import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Zap,
  Home,
  Lock,
  Unlock,
  Key,
  Sun,
  Moon,
  Wind,
  Droplets,
  Thermometer,
  Power,
  ShieldCheck,
  ShieldAlert,
  Eye,
  Video,
  Sliders,
  Volume2,
  VolumeX,
  Wifi,
  BatteryCharging,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Phone,
  MessageSquare,
  Clock,
  Activity,
  Tv,
  Radio,
  Send,
  UserCheck,
  Camera,
  ChevronRight,
  Maximize2,
  Check,
  Copy,
  Layers,
  Flame,
  Gauge,
  Compass,
} from 'lucide-react';
import { Project } from '../types';

export interface SmartHomeSkaAgentProps {
  activeProject?: Project;
  onOpenConsultation?: () => void;
  isCompactMode?: boolean;
}

interface SmartDevice {
  id: string;
  name: string;
  room: string;
  category: 'lighting' | 'climate' | 'security' | 'energy' | 'water' | 'shading';
  isOn: boolean;
  value?: number; // e.g., brightness %, temperature °C, level %
  secondaryValue?: string; // e.g. color temp '2700K', mode 'Cool', status 'Locked'
  powerConsumptionWatts: number;
}

interface SkaAuditLog {
  id: string;
  time: string;
  category: string;
  message: string;
  status: 'normal' | 'optimized' | 'alert';
}

export const SmartHomeSkaAgent: React.FC<SmartHomeSkaAgentProps> = ({
  activeProject,
  onOpenConsultation,
  isCompactMode = false,
}) => {
  // Active Sub-category Tab
  const [activeCategory, setActiveCategory] = useState<
    'all' | 'lighting' | 'climate' | 'security' | 'energy' | 'water' | 'shading'
  >('all');

  // AI Agent Assistant Prompt & Interactive Dialogue
  const [aiInputPrompt, setAiInputPrompt] = useState('');
  const [isProcessingPrompt, setIsProcessingPrompt] = useState(false);
  const [agentResponseHistory, setAgentResponseHistory] = useState<
    { sender: 'user' | 'agent'; text: string; time: string; actionExecuted?: string }[]
  >([
    {
      sender: 'agent',
      text: 'SKA-7 Autonomic Home Engine initialized. 48 Matter & KNX smart nodes synchronized with zero latency. How can I configure your luxury residence today?',
      time: '10:00 AM',
    },
  ]);

  // Master Automation Scenes State
  const [activeScene, setActiveScene] = useState<'none' | 'welcome' | 'night' | 'cinema' | 'vacation' | 'vastu_dawn'>('none');
  const [sceneExecutionToast, setSceneExecutionToast] = useState<string | null>(null);

  // Security Master Arm State
  const [securityArmedState, setSecurityArmedState] = useState<'disarmed' | 'home_armed' | 'night_perimeter' | 'vacation_armed'>('home_armed');

  // Interactive Devices State
  const [devices, setDevices] = useState<SmartDevice[]>([
    // Lighting
    { id: 'dev-light-living', name: 'Double-Height Living Chandelier & Coves', room: 'Living Area', category: 'lighting', isOn: true, value: 75, secondaryValue: '2700K Warm Dimming', powerConsumptionWatts: 140 },
    { id: 'dev-light-courtyard', name: 'Biophilic Courtyard Teak Up-Lights', room: 'Central Courtyard', category: 'lighting', isOn: true, value: 90, secondaryValue: '3000K Architectural Glow', powerConsumptionWatts: 85 },
    { id: 'dev-light-master', name: 'Master Bedroom Indirect Perimeter LED', room: 'Master Suite', category: 'lighting', isOn: false, value: 40, secondaryValue: '2400K Sunset Relaxation', powerConsumptionWatts: 60 },
    { id: 'dev-light-terrace', name: 'Sky Lounge Pergola Fairy & Sconces', room: 'Terrace Deck', category: 'lighting', isOn: true, value: 60, secondaryValue: '2200K Candle Ember', powerConsumptionWatts: 50 },
    { id: 'dev-light-kitchen', name: 'Chef Island Task & Under-Cabinet Lighting', room: 'Kitchen & Dining', category: 'lighting', isOn: true, value: 100, secondaryValue: '4000K High CRI Natural', powerConsumptionWatts: 110 },

    // Climate & Air Quality
    { id: 'dev-ac-living', name: 'Daikin VRV Inverter AC 3.0 TR', room: 'Living Room', category: 'climate', isOn: true, value: 23, secondaryValue: 'Quiet Eco Inverter', powerConsumptionWatts: 1250 },
    { id: 'dev-ac-master', name: 'Daikin VRV Silent Suite Unit 1.5 TR', room: 'Master Suite', category: 'climate', isOn: false, value: 22, secondaryValue: 'Sleep Comfort Mode', powerConsumptionWatts: 720 },
    { id: 'dev-iaq-filter', name: 'Whole-Home HEPA H13 Air Purifier', room: 'Central Duct', category: 'climate', isOn: true, value: 85, secondaryValue: 'AQI 24 • PM2.5: 8 µg/m³', powerConsumptionWatts: 65 },

    // Security & Smart Key (SKA)
    { id: 'dev-lock-main', name: 'Yale Smart Biometric Deadbolt (Matter)', room: 'Main Entrance Foyer', category: 'security', isOn: true, secondaryValue: 'Cryptographic SKA Locked', powerConsumptionWatts: 12 },
    { id: 'dev-lock-service', name: 'Smart Keypad & RFID Entry', room: 'Service Utility', category: 'security', isOn: true, secondaryValue: 'Locked • Staff PIN Active', powerConsumptionWatts: 8 },
    { id: 'dev-camera-gate', name: '4K AI Thermal Perimeter Camera', room: 'North Gate', category: 'security', isOn: true, secondaryValue: 'Facial Recognition: Active', powerConsumptionWatts: 18 },

    // Energy & Solar
    { id: 'dev-energy-solar', name: '10 kW Mono-PERC Rooftop Solar Inverter', room: 'Rooftop', category: 'energy', isOn: true, value: 74, secondaryValue: 'Generating 7.4 kW Solar PV', powerConsumptionWatts: -7400 },
    { id: 'dev-energy-battery', name: '15 kWh LFP Home Battery Storage', room: 'Basement Utility', category: 'energy', isOn: true, value: 92, secondaryValue: '92% Charged • Grid Islanding Ready', powerConsumptionWatts: 0 },
    { id: 'dev-energy-ev', name: '7.4 kW Level 2 Smart EV Wallbox', room: 'Car Porch', category: 'energy', isOn: false, value: 0, secondaryValue: 'Scheduled 01:00 AM Off-Peak', powerConsumptionWatts: 0 },

    // Water & Pump Automation
    { id: 'dev-water-sump', name: 'Submersible Water Sump Pump (1.5 HP)', room: 'Underground Sump', category: 'water', isOn: false, value: 86, secondaryValue: 'Sump: 86% • Auto Cut-Off Idle', powerConsumptionWatts: 0 },
    { id: 'dev-water-tank', name: 'Overhead Terrace Tank Float Sensor', room: 'Terrace Overhead', category: 'water', isOn: true, value: 94, secondaryValue: 'Tank: 94% Capacity (Full)', powerConsumptionWatts: 5 },
    { id: 'dev-water-ro', name: 'Multi-Stage RO & Alkaline Remineralizer', room: 'Kitchen Utility', category: 'water', isOn: true, value: 68, secondaryValue: 'TDS: 68 ppm • Pure Mineral', powerConsumptionWatts: 45 },

    // Shading & Louvers
    { id: 'dev-shade-living', name: 'Somfy Motorized Sheer & Blackout Drapes', room: 'Living Balcony', category: 'shading', isOn: true, value: 65, secondaryValue: '65% Open • Glare Shielded', powerConsumptionWatts: 35 },
    { id: 'dev-shade-louver', name: 'Automated Solar-Tracking Facade Louvers', room: 'East Elevation', category: 'shading', isOn: true, value: 45, secondaryValue: '45° Vastu Solar Angle', powerConsumptionWatts: 25 },
  ]);

  // Digital SKA Temporary Key Generator State
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [guestKeyName, setGuestKeyName] = useState('Housekeeping & Maintenance');
  const [guestKeyHours, setGuestKeyHours] = useState('4');
  const [generatedSkaKey, setGeneratedSkaKey] = useState<{ pin: string; qrCode: string; expiresAt: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Live Energy Telemetry
  const solarGenKw = 7.4;
  const homeLoadKw = (devices.reduce((acc, d) => (d.isOn && d.powerConsumptionWatts > 0 ? acc + d.powerConsumptionWatts : acc), 0) / 1000) + 1.8;
  const netGridExportKw = Math.max(0, solarGenKw - homeLoadKw);
  const batterySocPercent = 92;

  // Toggle Device State Handler
  const handleToggleDevice = (id: string) => {
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const nextState = !d.isOn;
          return {
            ...d,
            isOn: nextState,
            secondaryValue:
              d.category === 'security'
                ? nextState ? 'Cryptographic SKA Locked' : 'Temporarily Unlocked'
                : d.secondaryValue,
          };
        }
        return d;
      })
    );
  };

  // Adjust Device Slider (Brightness, Temp, Shading %)
  const handleUpdateDeviceValue = (id: string, newVal: number) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, value: newVal, isOn: newVal > 0 } : d))
    );
  };

  // Master Scene Activation Handler
  const handleTriggerScene = (scene: 'welcome' | 'night' | 'cinema' | 'vacation' | 'vastu_dawn') => {
    setActiveScene(scene);
    let message = '';

    if (scene === 'welcome') {
      message = 'Welcome Home scene activated: Foyer unlocked, warm 2700K ambient coves on, AC set to 23°C, living drapes opened.';
      setDevices((prev) =>
        prev.map((d) => {
          if (d.id === 'dev-light-living') return { ...d, isOn: true, value: 80 };
          if (d.id === 'dev-ac-living') return { ...d, isOn: true, value: 23 };
          if (d.id === 'dev-shade-living') return { ...d, isOn: true, value: 100 };
          if (d.id === 'dev-lock-main') return { ...d, secondaryValue: 'Welcome Key Unlocked' };
          return d;
        })
      );
    } else if (scene === 'night') {
      message = 'Good Night armed: Perimeter deadbolts secured, interior lights dimmed to 10% sleep pathway, Daikin AC set to 24°C eco quiet.';
      setDevices((prev) =>
        prev.map((d) => {
          if (d.category === 'lighting') return { ...d, isOn: d.id === 'dev-light-master', value: 10 };
          if (d.id === 'dev-ac-master') return { ...d, isOn: true, value: 24 };
          if (d.category === 'security') return { ...d, isOn: true, secondaryValue: 'Night Armed' };
          if (d.category === 'shading') return { ...d, value: 0 };
          return d;
        })
      );
      setSecurityArmedState('night_perimeter');
    } else if (scene === 'cinema') {
      message = 'Cinema Mode active: Living blinds 100% blacked out, lights dimmed to 12% 2200K amber coves, AC chilled to 21°C.';
      setDevices((prev) =>
        prev.map((d) => {
          if (d.id === 'dev-light-living') return { ...d, isOn: true, value: 12, secondaryValue: '2200K Cinema Mood' };
          if (d.id === 'dev-shade-living') return { ...d, value: 0, secondaryValue: '100% Blackout' };
          if (d.id === 'dev-ac-living') return { ...d, isOn: true, value: 21 };
          return d;
        })
      );
    } else if (scene === 'vacation') {
      message = 'Vacation Eco Mode: All high-draw circuits isolated, presence-simulation lighting schedule armed, water mains locked.';
      setDevices((prev) =>
        prev.map((d) => {
          if (d.category === 'climate') return { ...d, isOn: false };
          if (d.category === 'lighting') return { ...d, isOn: false };
          return d;
        })
      );
      setSecurityArmedState('vacation_armed');
    } else if (scene === 'vastu_dawn') {
      message = 'Vastu Dawn Alignment: East facade louvers rotated to 52° to channel morning solar prana; courtyard skylights opened for passive ventilation.';
      setDevices((prev) =>
        prev.map((d) => {
          if (d.id === 'dev-shade-louver') return { ...d, value: 52, secondaryValue: '52° East Pranic Solar Angle' };
          if (d.id === 'dev-light-courtyard') return { ...d, isOn: true, value: 40 };
          return d;
        })
      );
    }

    setSceneExecutionToast(message);
    setTimeout(() => setSceneExecutionToast(null), 5000);

    // Append to Agent Chat
    setAgentResponseHistory((prev) => [
      ...prev,
      {
        sender: 'agent',
        text: message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionExecuted: scene,
      },
    ]);
  };

  // AI Prompt Processor
  const handleSendPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInputPrompt.trim()) return;

    const query = aiInputPrompt.trim();
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setAgentResponseHistory((prev) => [...prev, { sender: 'user', text: query, time: timeNow }]);
    setAiInputPrompt('');
    setIsProcessingPrompt(true);

    setTimeout(() => {
      let agentReply = '';
      const lower = query.toLowerCase();

      if (lower.includes('cinema') || lower.includes('movie')) {
        handleTriggerScene('cinema');
        agentReply = 'SKA-7 executed Cinema Protocol: Blackout curtains deployed, DALI lighting dimmed to 12% warm amber, AC set to 21°C.';
      } else if (lower.includes('night') || lower.includes('sleep') || lower.includes('bed')) {
        handleTriggerScene('night');
        agentReply = 'SKA-7 activated Night Security & Sleep Ambiance: All deadbolts locked with cryptographic hash, bedroom AC set to 24°C eco-silent.';
      } else if (lower.includes('solar') || lower.includes('battery') || lower.includes('power') || lower.includes('energy')) {
        agentReply = `SKA Energy Intelligence: Generating ${solarGenKw} kW Solar PV. Current home load is ${homeLoadKw.toFixed(1)} kW. Exporting +${netGridExportKw.toFixed(1)} kW clean power to BESCOM grid. Battery storage is at ${batterySocPercent}%.`;
      } else if (lower.includes('water') || lower.includes('sump') || lower.includes('pump')) {
        agentReply = 'Water Management Telemetry: Sump at 86%, Overhead Tank at 94%. Automatic float sensor cut-off engaged. RO output TDS is 68 ppm.';
      } else if (lower.includes('key') || lower.includes('lock') || lower.includes('door') || lower.includes('guest')) {
        setIsKeyModalOpen(true);
        agentReply = 'Opening SKA Smart Key Generator. Cryptographic one-time authorization tokens ready for household staff or visiting guests.';
      } else if (lower.includes('ac') || lower.includes('cool') || lower.includes('temperature') || lower.includes('air')) {
        setDevices((prev) =>
          prev.map((d) => (d.category === 'climate' ? { ...d, isOn: true, value: 23 } : d))
        );
        agentReply = 'Daikin VRV Inverter synchronized: Temperature normalized to 23°C in Living & Suite zones. Indoor Air Quality AQI is 24 (Optimal).';
      } else {
        agentReply = `SKA Agent confirmed: Processed command "${query}". All Matter & KNX architectural nodes checked and operating within NBC 2016 green building efficiency guidelines.`;
      }

      setAgentResponseHistory((prev) => [
        ...prev,
        { sender: 'agent', text: agentReply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ]);
      setIsProcessingPrompt(false);
    }, 800);
  };

  // Generate SKA Temporary Key
  const handleGenerateKey = () => {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + parseInt(guestKeyHours, 10) * 3600000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    setGeneratedSkaKey({
      pin,
      qrCode: `SKA-KEY-MATTER-${pin}-${Date.now().toString().slice(-4)}`,
      expiresAt: `Today at ${expiry} (${guestKeyHours} Hours validity)`,
    });
  };

  const filteredDevices =
    activeCategory === 'all'
      ? devices
      : devices.filter((d) => d.category === activeCategory);

  return (
    <div className="rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl space-y-6">
      {/* 1. AGENT IDENTITY HERO HEADER */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-600 to-blue-700 flex items-center justify-center text-white shadow-xl shadow-cyan-500/20">
              <Cpu className="w-7 h-7 animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center" title="Edge IoT Node Online">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>SMART HOME SKA AGENT</span>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold tracking-widest uppercase">
                  v3.8 AUTONOMIC CORE
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Supervisory Kontrol &amp; Automation (SKA) architecture designed by <strong>Ar. S. Gouse</strong> (+91 8073947241). Real-time Matter, KNX, DALI-2, Daikin VRV, and Solar Grid Energy orchestration.
            </p>
          </div>
        </div>

        {/* Live System Status Badges */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-mono text-slate-300 flex items-center gap-2">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span>48 NODES ONLINE</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-300 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>SKA SECURITY: {securityArmedState.toUpperCase().replace('_', ' ')}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsKeyModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition"
          >
            <Key className="w-3.5 h-3.5" />
            <span>SKA Guest Key</span>
          </button>

          {onOpenConsultation && (
            <button
              type="button"
              onClick={onOpenConsultation}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition shadow-md shadow-cyan-600/20"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Architect Call</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. REAL-TIME ENERGY & SOLAR BAROMETRICS STRIP */}
      <div className="px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          {/* Solar Gen */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-400">
              <Sun className="w-3.5 h-3.5" />
              <span>SOLAR PV GENERATION</span>
            </div>
            <div className="text-lg font-black text-white font-mono">
              +{solarGenKw} <span className="text-xs font-normal text-slate-400">kW</span>
            </div>
            <div className="text-[10px] text-slate-400">Rooftop 10 kW Mono-PERC Array</div>
          </div>

          {/* Current Home Load */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-sky-400">
              <Zap className="w-3.5 h-3.5" />
              <span>ACTIVE HOME LOAD</span>
            </div>
            <div className="text-lg font-black text-white font-mono">
              {homeLoadKw.toFixed(2)} <span className="text-xs font-normal text-slate-400">kW</span>
            </div>
            <div className="text-[10px] text-slate-400">Daikin VRV + DALI Lighting + Water</div>
          </div>

          {/* Grid Export / Solar Net Metering */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
              <Activity className="w-3.5 h-3.5" />
              <span>BESCOM NET METERING</span>
            </div>
            <div className="text-lg font-black text-emerald-400 font-mono">
              +{netGridExportKw.toFixed(2)} <span className="text-xs font-normal text-slate-400">kW Export</span>
            </div>
            <div className="text-[10px] text-slate-400">Earning Green Energy Credits</div>
          </div>

          {/* Battery Storage SoC */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-400">
              <BatteryCharging className="w-3.5 h-3.5" />
              <span>LFP BATTERY STORAGE</span>
            </div>
            <div className="text-lg font-black text-cyan-300 font-mono">
              {batterySocPercent}% <span className="text-xs font-normal text-slate-400">(13.8 kWh)</span>
            </div>
            <div className="text-[10px] text-slate-400">100% Uninterrupted Islanding Ready</div>
          </div>
        </div>
      </div>

      {/* 3. 1-TOUCH MASTER AUTOMATION SCENES */}
      <div className="px-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            1-Touch Master SKA Scenes
          </span>
          <span className="text-[11px] text-slate-500 font-mono">Multi-device state synchronization</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Scene 1: Welcome Home */}
          <button
            type="button"
            onClick={() => handleTriggerScene('welcome')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              activeScene === 'welcome'
                ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-400 text-white shadow-lg shadow-amber-500/10'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                <Home className="w-4 h-4" />
              </div>
              {activeScene === 'welcome' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
            </div>
            <div className="text-xs font-bold text-white">Welcome Home</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Foyer, 2700K Coves &amp; 23°C AC</div>
          </button>

          {/* Scene 2: Good Night Armed */}
          <button
            type="button"
            onClick={() => handleTriggerScene('night')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              activeScene === 'night'
                ? 'bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 border-indigo-400 text-white shadow-lg shadow-indigo-500/10'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                <Moon className="w-4 h-4" />
              </div>
              {activeScene === 'night' && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
            </div>
            <div className="text-xs font-bold text-white">Good Night Armed</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Perimeter locked, 10% sleep coves</div>
          </button>

          {/* Scene 3: Cinema Mode */}
          <button
            type="button"
            onClick={() => handleTriggerScene('cinema')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              activeScene === 'cinema'
                ? 'bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-400 text-white shadow-lg shadow-purple-500/10'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
                <Tv className="w-4 h-4" />
              </div>
              {activeScene === 'cinema' && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
            </div>
            <div className="text-xs font-bold text-white">Cinema Blackout</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Somfy motorized blinds &amp; 21°C chill</div>
          </button>

          {/* Scene 4: Vacation Security */}
          <button
            type="button"
            onClick={() => handleTriggerScene('vacation')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              activeScene === 'vacation'
                ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-emerald-400 text-white shadow-lg shadow-emerald-500/10'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              {activeScene === 'vacation' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            </div>
            <div className="text-xs font-bold text-white">Vacation Eco Guard</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Presence simulation &amp; leak protection</div>
          </button>

          {/* Scene 5: Vastu Dawn Alignment */}
          <button
            type="button"
            onClick={() => handleTriggerScene('vastu_dawn')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              activeScene === 'vastu_dawn'
                ? 'bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border-cyan-400 text-white shadow-lg shadow-cyan-500/10'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                <Compass className="w-4 h-4" />
              </div>
              {activeScene === 'vastu_dawn' && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
            </div>
            <div className="text-xs font-bold text-white">Vastu Dawn Solar</div>
            <div className="text-[10px] text-slate-400 mt-0.5">East facade louvers &amp; prana airflow</div>
          </button>
        </div>

        {sceneExecutionToast && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{sceneExecutionToast}</span>
          </div>
        )}
      </div>

      {/* 4. NATURAL LANGUAGE SKA AGENT CONVERSATIONAL INTERACTION */}
      <div className="px-6">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-300 uppercase">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>SKA Agent Natural Language Terminal</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Type or prompt any command</span>
          </div>

          {/* Chat Stream Window */}
          <div className="max-h-40 overflow-y-auto space-y-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            {agentResponseHistory.map((item, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${item.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-2.5 rounded-xl max-w-xl text-xs leading-relaxed ${
                    item.sender === 'user'
                      ? 'bg-sky-600 text-white rounded-br-none'
                      : 'bg-slate-900 text-slate-200 border border-cyan-500/30 rounded-bl-none'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono opacity-80">
                    <span>{item.sender === 'user' ? 'Client' : 'SKA Autonomic Agent'}</span>
                    <span>•</span>
                    <span>{item.time}</span>
                  </div>
                  <p>{item.text}</p>
                </div>
              </div>
            ))}
            {isProcessingPrompt && (
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 p-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>SKA Agent resolving IoT node states...</span>
              </div>
            )}
          </div>

          {/* Quick Prompt Recommendation Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
            <span className="text-slate-400 text-[10px] font-mono shrink-0">Sample prompts:</span>
            {[
              'Activate Cinema Mode in living room',
              'Check solar generation & battery SoC',
              'Grant temporary SKA digital key for cleaning',
              'Verify water sump level & pump status',
              'Set AC to 23°C in master suite',
            ].map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setAiInputPrompt(p);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] whitespace-nowrap transition"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Prompt Input Form */}
          <form onSubmit={handleSendPrompt} className="flex gap-2">
            <input
              type="text"
              value={aiInputPrompt}
              onChange={(e) => setAiInputPrompt(e.target.value)}
              placeholder="E.g., Turn off all terrace lights, set master AC to 23°C, and arm perimeter security..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
            />
            <button
              type="submit"
              disabled={isProcessingPrompt || !aiInputPrompt.trim()}
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Instruct</span>
            </button>
          </form>
        </div>
      </div>

      {/* 5. INTERACTIVE SMART HOME DEVICES CONTROLLER GRID */}
      <div className="px-6 space-y-4">
        {/* Category Filter Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: 'all', label: 'All 48 Nodes', icon: Layers },
              { id: 'lighting', label: 'DALI Lighting', icon: Sun },
              { id: 'climate', label: 'VRV Climate & IAQ', icon: Wind },
              { id: 'security', label: 'SKA Locks & CCTV', icon: Lock },
              { id: 'energy', label: 'Solar & Battery', icon: Zap },
              { id: 'water', label: 'Water Automation', icon: Droplets },
              { id: 'shading', label: 'Motorized Louvers', icon: Sliders },
            ].map((cat) => {
              const Icon = cat.icon;
              const isSelected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            Showing {filteredDevices.length} monitored hardware endpoints
          </div>
        </div>

        {/* Device Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDevices.map((device) => {
            return (
              <div
                key={device.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                  device.isOn
                    ? 'bg-slate-900/90 border-slate-700 shadow-md'
                    : 'bg-slate-950/70 border-slate-800/80 opacity-70'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-cyan-400">
                      {device.room}
                    </span>
                    <h4 className="text-xs font-bold text-white line-clamp-1">{device.name}</h4>
                    <div className="text-[11px] text-slate-300 font-mono">
                      {device.secondaryValue}
                    </div>
                  </div>

                  {/* On/Off Toggle Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleDevice(device.id)}
                    className={`w-10 h-6 rounded-full transition-colors relative flex items-center px-1 shrink-0 ${
                      device.isOn ? 'bg-cyan-500' : 'bg-slate-800'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        device.isOn ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Slider for Brightness / Climate Temp / Shading Level */}
                {device.value !== undefined && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>
                        {device.category === 'climate'
                          ? 'Setpoint Temp:'
                          : device.category === 'shading'
                          ? 'Open Aperture:'
                          : device.category === 'water'
                          ? 'Capacity Level:'
                          : 'Dimming Intensity:'}
                      </span>
                      <span className="text-white font-bold">
                        {device.value}
                        {device.category === 'climate' ? '°C' : '%'}
                      </span>
                    </div>

                    <input
                      type="range"
                      min={device.category === 'climate' ? 18 : 0}
                      max={device.category === 'climate' ? 30 : 100}
                      value={device.value}
                      disabled={!device.isOn}
                      onChange={(e) => handleUpdateDeviceValue(device.id, parseInt(e.target.value, 10))}
                      className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>
                )}

                {/* Footnote telemetry */}
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                  <span>Power: {device.isOn ? `${Math.abs(device.powerConsumptionWatts)}W` : '0W Idle'}</span>
                  <span className={device.isOn ? 'text-emerald-400' : 'text-slate-500'}>
                    {device.isOn ? 'Active' : 'Standby'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. BOTTOM ARCHITECTURAL INTEGRATION FOOTER */}
      <div className="p-6 bg-slate-900/60 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">
              Turnkey Smart Automation by Ar. S. Gouse
            </h4>
            <p className="text-[11px] text-slate-400">
              Concealed conduit maps, Schneider KNX panels, Legrand Arteor smart modules, and Lutron lighting integrated before civil plastering.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="tel:+918073947241"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span>+91 8073947241</span>
          </a>
          <a
            href="https://wa.me/918073947241?text=Hi%20Ar.%20S.%20Gouse,%20I%20would%20like%20to%20consult%20regarding%20the%20Smart%20Home%20SKA%20Agent%20and%20turnkey%20home%20automation%20for%20my%20residence."
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp Architect</span>
          </a>
        </div>
      </div>

      {/* MODAL: SKA TEMPORARY DIGITAL KEY GENERATOR */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-cyan-500/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white">
                <Key className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold">SKA Cryptographic Smart Key Generator</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsKeyModalOpen(false);
                  setGeneratedSkaKey(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Generate a time-bound, one-time encrypted PIN or QR credential for housekeeper, guest, or delivery agent.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Guest / Staff Label</label>
                <input
                  type="text"
                  value={guestKeyName}
                  onChange={(e) => setGuestKeyName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Validity Window</label>
                <select
                  value={guestKeyHours}
                  onChange={(e) => setGuestKeyHours(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
                >
                  <option value="1">1 Hour (Delivery Courier)</option>
                  <option value="4">4 Hours (Daily Housekeeping)</option>
                  <option value="12">12 Hours (Maintenance Contractor)</option>
                  <option value="24">24 Hours (Visiting Relatives)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleGenerateKey}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-cyan-600/20"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Issue Encrypted SKA Digital Key</span>
              </button>
            </div>

            {generatedSkaKey && (
              <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-2 text-center">
                <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
                  Encrypted Digital Key Generated
                </div>
                <div className="text-2xl font-black text-white font-mono tracking-widest bg-slate-900 py-2 rounded-lg border border-slate-800">
                  {generatedSkaKey.pin}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Expires: {generatedSkaKey.expiresAt}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`SKA SMART KEY: ${generatedSkaKey.pin} | Valid for ${guestKeyName} until ${generatedSkaKey.expiresAt}. Dial on foyer keypad.`);
                    setCopiedKey(true);
                    setTimeout(() => setCopiedKey(false), 3000);
                  }}
                  className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? 'Key Copied to Clipboard!' : 'Copy Key & SMS to Guest'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
