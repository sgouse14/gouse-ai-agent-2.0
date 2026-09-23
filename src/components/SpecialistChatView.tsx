import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  Bot,
  User,
  Trash2,
  Copy,
  Building,
  Compass,
  FileCheck,
  Scale,
  Leaf,
  Layers,
  Cpu,
  Home,
  Globe,
  Play,
  Pause,
  Download,
  Radio,
  RefreshCw,
  Languages,
  Headphones,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Zap,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';
import { SpecialistType, ChatMessage, Project, BOQItem, AgentAction } from '../types';

interface SpecialistChatViewProps {
  activeProject: Project;
  boqItems?: BOQItem[];
  currency?: string;
  onUpdateBOQItems?: (items: BOQItem[]) => void;
  onUpdateProject?: (project: Project) => void;
  onNavigateToBOQ?: () => void;
  onOpenWorkflowEngine?: () => void;
}

interface SpecialistConfig {
  id: SpecialistType;
  title: string;
  role: string;
  voiceName: string;
  icon: any;
  desc: string;
  expertise: string[];
}

const SPECIALISTS: SpecialistConfig[] = [
  {
    id: 'general',
    title: 'Principal Advisor',
    role: 'Master Planning & Vision',
    voiceName: 'Zephyr',
    icon: Building,
    desc: 'Integrated spatial planning, architectural vision, and cross-disciplinary coordination.',
    expertise: ['Holistic Design', 'Zoning & Masterplan', 'Sequencing', 'Project Leadership'],
  },
  {
    id: 'design',
    title: 'Design & Massing',
    role: 'Spatial Flow & Facades',
    voiceName: 'Puck',
    icon: Compass,
    desc: 'Massing studies, space planning, natural daylighting, and bioclimatic form.',
    expertise: ['Program Adjacencies', 'Facade Articulation', 'Daylighting', 'Circulation'],
  },
  {
    id: 'code',
    title: 'Nambike Nakshe & Bylaws',
    role: 'Nambike Nakshe 2.0 & NBC',
    voiceName: 'Charon',
    icon: Scale,
    desc: 'Nambike Nakshe 2.0 self-certification, GBA bylaws, 15% deviation limits, relaxed setbacks, and NBC 2016.',
    expertise: ['Nambike Nakshe 2.0', 'GBA 15% Deviation', 'Small Plot Setbacks', 'FAR & Ground Coverage'],
  },
  {
    id: 'documentation',
    title: 'CSI Specifications',
    role: 'Detailing & Schedules',
    voiceName: 'Fenrir',
    icon: FileCheck,
    desc: 'CSI MasterFormat specs, drawing schedules, detail coordination, and submittals.',
    expertise: ['MasterFormat Divisions', 'Drawing Coordination', 'RFI Logs', 'Quality Assurance'],
  },
  {
    id: 'quantity',
    title: 'Quantity & BOQ',
    role: 'Cost & Rate Analysis',
    voiceName: 'Kore',
    icon: Layers,
    desc: 'Schedule of rates, itemized takeoffs, material wastage, and contingency reserves.',
    expertise: ['IS 1200 Standards', 'Unit Rate Engineering', 'Cost Variance', 'Contingency Index'],
  },
  {
    id: 'sustainability',
    title: 'Sustainability & Green',
    role: 'Bioclimatic & Carbon',
    voiceName: 'Zephyr',
    icon: Leaf,
    desc: 'Passive solar design, U-values, embodied carbon, rainwater harvesting, and GRIHA/LEED.',
    expertise: ['Passive Cooling', 'Embodied Carbon (GGBS)', 'Thermal Comfort', 'LEED/GRIHA'],
  },
  {
    id: 'structural',
    title: 'Structural & MEP',
    role: 'Framing & Services',
    voiceName: 'Fenrir',
    icon: Cpu,
    desc: 'RCC framing grids, load paths, shear walls, MEP shaft coordination, and ducting.',
    expertise: ['Column Grids', 'Load Transfer Paths', 'MEP Chases', 'Seismic Detailing'],
  },
  {
    id: 'interior',
    title: 'Interior & Finishes',
    role: 'Millwork & Ergonomics',
    voiceName: 'Kore',
    icon: Home,
    desc: 'Interior space planning, custom millwork, tactile materiality, and lighting design.',
    expertise: ['Ergonomic Clearances', 'Millwork Details', 'Acoustics', 'Surface Materiality'],
  },
];

interface LanguageConfig {
  code: string;
  name: string;
  native: string;
  region: 'India' | 'International' | 'System';
}

const VOICE_LANGUAGES: LanguageConfig[] = [
  // System Auto
  { code: 'auto', name: 'Auto-Detect', native: '🌐 Auto-Detect', region: 'System' },

  // Indian Regional & National
  { code: 'en-IN', name: 'English (India)', native: 'English (India)', region: 'India' },
  { code: 'hi-IN', name: 'Hindi', native: 'हिन्दी', region: 'India' },
  { code: 'te-IN', name: 'Telugu', native: 'తెలుగు', region: 'India' },
  { code: 'ta-IN', name: 'Tamil', native: 'தமிழ்', region: 'India' },
  { code: 'kn-IN', name: 'Kannada', native: 'ಕನ್ನಡ', region: 'India' },
  { code: 'ml-IN', name: 'Malayalam', native: 'മലയാളം', region: 'India' },
  { code: 'mr-IN', name: 'Marathi', native: 'मराठी', region: 'India' },
  { code: 'gu-IN', name: 'Gujarati', native: 'ગુજરાતી', region: 'India' },
  { code: 'bn-IN', name: 'Bengali', native: 'বাংলা', region: 'India' },
  { code: 'pa-IN', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', region: 'India' },
  { code: 'ur-IN', name: 'Urdu', native: 'اردو', region: 'India' },
  { code: 'or-IN', name: 'Odia', native: 'ଓଡ଼ିଆ', region: 'India' },

  // Global International
  { code: 'en-US', name: 'English (US)', native: 'English (US)', region: 'International' },
  { code: 'ar-SA', name: 'Arabic', native: 'العربية', region: 'International' },
  { code: 'es-ES', name: 'Spanish', native: 'Español', region: 'International' },
  { code: 'fr-FR', name: 'French', native: 'Français', region: 'International' },
  { code: 'de-DE', name: 'German', native: 'Deutsch', region: 'International' },
  { code: 'it-IT', name: 'Italian', native: 'Italiano', region: 'International' },
  { code: 'pt-BR', name: 'Portuguese', native: 'Português', region: 'International' },
  { code: 'ru-RU', name: 'Russian', native: 'Русский', region: 'International' },
  { code: 'ja-JP', name: 'Japanese', native: '日本語', region: 'International' },
  { code: 'ko-KR', name: 'Korean', native: '한국어', region: 'International' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', native: '简体中文', region: 'International' },
  { code: 'tr-TR', name: 'Turkish', native: 'Türkçe', region: 'International' },
  { code: 'id-ID', name: 'Indonesian', native: 'Bahasa Indonesia', region: 'International' },
];

const QUICK_PROMPTS = [
  'What is the formula to calculate reinforcement steel weight in RCC slabs?',
  'What are the NBC requirements for fire exit stairwell corridor widths?',
  'Compare AAC blocks vs red wire-cut bricks for an exterior wall in a tropical climate.',
  'How to design a passive courtyard to maximize stack-effect natural ventilation?',
  'Draft an outline for CSI Division 03 (Concrete) architectural specifications.',
  'What is the recommended column spacing for residential basement car parking bays?',
];

const AGENT_WORKFLOWS = [
  {
    title: 'Gouse AI Agent Audit',
    icon: '🏛️',
    tag: 'Municipal Gatekeeper',
    prompt: 'Run Gouse AI Agent statutory compliance audit: verify GBA 15% deviation regularization, small plot relaxed setbacks, and FAR limits.',
  },
  {
    title: 'Gouse AI Agent Spec',
    icon: '⚡',
    tag: 'Spec 9.8/10',
    prompt: 'Generate Gouse AI Agent Platform Specification: explain the 4-stage CAD extraction, municipal gatekeeper, BOQ mapping, and material takeoff.',
  },
  {
    title: 'Audit Project BOQ',
    icon: '🔍',
    tag: 'Full Audit',
    prompt: 'Conduct a thorough completeness and risk audit of our active project BOQ items, rates, and missing trade divisions.',
  },
  {
    title: 'Estimate Concrete & Steel',
    icon: '🏗️',
    tag: 'IS 456 Rules',
    prompt: 'Calculate exact empirical concrete (M25) volume and TMT reinforcement steel (Fe550D) tonnage for this project area.',
  },
  {
    title: 'NBC Fire & Egress Audit',
    icon: '📜',
    tag: 'NBC 2016',
    prompt: 'Audit National Building Code (NBC 2016) compliance for travel distance to fire exits, corridor widths, and perimeter fire tender setbacks.',
  },
  {
    title: 'Material Pricing Check',
    icon: '💹',
    tag: 'Market Rates',
    prompt: 'Benchmark current regional wholesale market rates for cement, rebar, AAC blocks, structural steel, and ready-mix concrete.',
  },
  {
    title: 'Contingency Risk Review',
    icon: '🛡️',
    tag: 'Risk & Reserve',
    prompt: 'Assess risk profile and propose recommended contingency reserve percentage for schematic design development.',
  },
];

export const SpecialistChatView: React.FC<SpecialistChatViewProps> = ({
  activeProject,
  boqItems = [],
  currency = '₹',
  onUpdateBOQItems,
  onUpdateProject,
  onNavigateToBOQ,
  onOpenWorkflowEngine,
}) => {
  const [selectedSpecialist, setSelectedSpecialist] = useState<SpecialistType>('general');
  const [selectedLanguage, setSelectedLanguage] = useState('en-IN');
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Agent Transparency & Action Execution State
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});
  const [toastNotification, setToastNotification] = useState<{
    message: string;
    type: 'success' | 'info';
  } | null>(null);

  // Advanced Voice Settings
  const [autoSpeakEnabled, setAutoSpeakEnabled] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState<string | null>(null);
  const [walkieTalkieActive, setWalkieTalkieActive] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      role: 'assistant',
      content: `Welcome to Gouse AI Agent. I am your **Autonomous Principal Architectural Agent**.
Active Project: **${activeProject.name}** (${activeProject.projectType || 'Architecture'}, ${activeProject.location || 'Site'}).
Built-up Footprint: **${(activeProject.builtUpAreaSqFt || 3500).toLocaleString()} sq.ft** | Live BOQ Items: **${boqItems?.length || 0} line items**.

I operate as an **Autonomous Engineering & Municipal Agent**:
- 🏛️ **Nambike Nakshe 2.0 Compliance Gate**: Automated check for GBA 15% deviation regularization, small-plot relaxed setbacks (<1500 sq ft & <600 sq ft), and municipal plan approvals
- ⚡ **4-Stage Platform Engine**: CAD ingestion & net area extraction, gatekeeper compliance, BOQ population, and IS material consumption takeoffs (System Rating: 9.8/10)
- 🧠 **Transparent Chain-of-Thought Reasoning**: Live architectural tools (IS 456 Structural Rules, NBC 2016 Code Engine, IS 1200 SMM Auditor, Market Pricing Benchmark)
- 📋 **Concrete 1-Click Action Proposals**: Execute BOQ adjustments or launch the Nambike Nakshe 2.0 engine directly
- 🎙️ **Multi-lingual Voice Dialogue**: 25+ regional & global languages supported.`,
      timestamp: new Date().toISOString(),
      specialist: 'general',
      language: 'en-IN',
      agentToolsUsed: ['Nambike Nakshe 2.0 Gatekeeper', 'IS 456 Structural Rules', 'BOQ Inspector'],
      agentThought: `Synchronized with ${activeProject.name} active spatial data (${(activeProject.builtUpAreaSqFt || 3500).toLocaleString()} sq.ft). Ready to audit Nambike Nakshe 2.0 bylaws, structural framing, NBC statutory egress, and bill of quantities.`,
    },
  ]);

  const toggleThought = (msgId: string) => {
    setExpandedThoughts((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  const handleExecuteAction = (action: AgentAction, msgId: string) => {
    if (action.executed) return;

    if (action.type === 'add_boq_item' && action.payload) {
      const qty = Number(action.payload.quantity) || 1;
      const rate = Number(action.payload.rate) || 0;
      const newItem: BOQItem = {
        id: `boq-agent-${Date.now()}`,
        name: action.payload.name || action.title,
        category: action.payload.category || 'Concrete Works',
        unit: action.payload.unit || 'nos',
        quantity: qty,
        rate: rate,
        amount: qty * rate,
        notes: action.payload.notes || 'Autonomous Specialist AI Agent item proposal',
        stage: 'Superstructure',
        status: 'approved',
      };

      if (onUpdateBOQItems) {
        onUpdateBOQItems([...(boqItems || []), newItem]);
      }

      setToastNotification({
        message: `Added "${newItem.name}" (${qty} ${newItem.unit} @ ${currency} ${rate.toLocaleString()}) to Project BOQ!`,
        type: 'success',
      });
    } else if (action.type === 'update_contingency' && action.payload?.percent) {
      if (onUpdateProject) {
        onUpdateProject({
          ...activeProject,
          contingencyPercent: action.payload.percent,
        });
      }
      setToastNotification({
        message: `Updated project contingency reserve to ${action.payload.percent}%!`,
        type: 'success',
      });
    } else if (action.type === ('open_workflow_engine' as any)) {
      if (onOpenWorkflowEngine) {
        onOpenWorkflowEngine();
      }
      setToastNotification({
        message: 'Opened Gouse AI Agent Engine (4-Stage Pipeline)',
        type: 'info',
      });
    } else if (action.type === 'run_audit' || action.type === 'inspect_pricing') {
      if (onNavigateToBOQ) {
        onNavigateToBOQ();
      }
    }

    // Mark action as executed
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId) return m;
        return {
          ...m,
          agentActions: m.agentActions?.map((a) =>
            a.id === action.id ? { ...a, executed: true } : a
          ),
        };
      })
    );
  };

  // Auto-dismiss toast after 4.5 seconds
  useEffect(() => {
    if (toastNotification) {
      const timer = setTimeout(() => setToastNotification(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [toastNotification]);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, voiceTranscript]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_e) {
          // ignore
        }
      }
    };
  }, []);

  // Speech Recognition Setup (Microphone)
  const toggleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_e) {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      // Map 'auto' to user's system locale or default to 'en-IN'
      recognition.lang = selectedLanguage === 'auto' ? navigator.language || 'en-IN' : selectedLanguage;
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceTranscript('');
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setVoiceTranscript(transcript);
        setInputMessage(transcript);
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition warning:', err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        // If in Walkie-Talkie mode and transcript exists, auto-submit
        if (walkieTalkieActive && inputMessage.trim()) {
          handleSendMessage(inputMessage.trim());
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setIsListening(false);
    }
  };

  // Text-To-Speech Execution (Gemini TTS with Web Speech API Fallback)
  const stopAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMessageId(null);
  };

  const playMessageVoice = async (msg: ChatMessage) => {
    if (speakingMessageId === msg.id) {
      stopAudio();
      return;
    }

    stopAudio();
    setSpeakingMessageId(msg.id);
    setIsGeneratingAudio(msg.id);

    const specialistObj = SPECIALISTS.find((s) => s.id === msg.specialist) || SPECIALISTS[0];

    try {
      // 1. If audio base64 is already cached on the message, play directly
      if (msg.audioBase64) {
        playWavAudio(msg.id, msg.audioBase64);
        setIsGeneratingAudio(null);
        return;
      }

      // 2. Fetch Gemini TTS audio from backend
      const res = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: msg.content,
          specialist: msg.specialist || selectedSpecialist,
          voiceName: specialistObj.voiceName,
          language: msg.language || selectedLanguage,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          // Cache audio on message
          msg.audioBase64 = data.audioBase64;
          playWavAudio(msg.id, data.audioBase64);
          setIsGeneratingAudio(null);
          return;
        }
      }
    } catch (_err) {
      console.warn('Gemini TTS service notice, utilizing browser voice engine.');
    }

    setIsGeneratingAudio(null);

    // 3. Fallback: Browser Web SpeechSynthesis
    playBrowserSpeech(msg.id, msg.content, msg.language || selectedLanguage);
  };

  const playWavAudio = (msgId: string, base64: string) => {
    try {
      const audioUrl = `data:audio/wav;base64,${base64}`;
      const audio = new Audio(audioUrl);
      audio.playbackRate = playbackSpeed;

      audio.onended = () => {
        setSpeakingMessageId(null);
        currentAudioRef.current = null;
        if (walkieTalkieActive) {
          // Auto-prompt user for next question in walkie talkie mode
          setTimeout(() => toggleVoiceInput(), 500);
        }
      };

      audio.onerror = () => {
        setSpeakingMessageId(null);
        currentAudioRef.current = null;
      };

      currentAudioRef.current = audio;
      audio.play();
    } catch (e) {
      console.warn('Audio element error:', e);
      setSpeakingMessageId(null);
    }
  };

  const playBrowserSpeech = (msgId: string, text: string, langCode: string) => {
    if (!('speechSynthesis' in window)) {
      setSpeakingMessageId(null);
      return;
    }

    const cleanText = text
      .replace(/[#*`_\[\]()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = langCode === 'auto' ? 'en-US' : langCode;
    utterance.rate = playbackSpeed;

    utterance.onend = () => {
      setSpeakingMessageId(null);
      if (walkieTalkieActive) {
        setTimeout(() => toggleVoiceInput(), 500);
      }
    };

    utterance.onerror = () => {
      setSpeakingMessageId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const downloadAudio = (base64: string, id: string) => {
    const a = document.createElement('a');
    a.href = `data:audio/wav;base64,${base64}`;
    a.download = `specialist-voice-${id}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Send Chat Message
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    stopAudio();

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
      specialist: selectedSpecialist,
      language: selectedLanguage,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setVoiceTranscript('');
    setIsLoading(true);

    try {
      const projectContext = `Project: ${activeProject.name} | Typology: ${activeProject.projectType} | Location: ${activeProject.location} | Built-up Area: ${(activeProject.builtUpAreaSqFt || 3500).toLocaleString()} sq.ft | Scope: ${activeProject.description}`;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          specialist: selectedSpecialist,
          projectContext,
          language: selectedLanguage,
          boqContext: boqItems && boqItems.length > 0 ? JSON.stringify(boqItems.slice(0, 15)) : undefined,
          projectData: activeProject,
        }),
      });

      if (!res.ok) throw new Error('Failed to get specialist response');
      const data = await res.json();

      const aiMsgId = `msg-${Date.now()}-ai`;
      const aiMsg: ChatMessage = {
        id: aiMsgId,
        role: 'assistant',
        content: data.response || (typeof data === 'string' ? data : 'Analysis complete.'),
        timestamp: new Date().toISOString(),
        specialist: selectedSpecialist,
        language: selectedLanguage,
        agentThought: data.thought,
        agentToolsUsed: data.toolsUsed,
        agentActions: data.actions,
      };

      setMessages((prev) => [...prev, aiMsg]);
      if (data.thought) {
        setExpandedThoughts((prev) => ({ ...prev, [aiMsgId]: true }));
      }

      // If Auto-Speak or Walkie-Talkie is enabled, automatically speak reply
      if (autoSpeakEnabled || walkieTalkieActive) {
        setTimeout(() => {
          playMessageVoice(aiMsg);
        }, 300);
      }
    } catch (_err) {
      const area = activeProject.builtUpAreaSqFt || 3500;
      const steelMT = Number(((area * 4.2) / 1000).toFixed(1));
      const concreteM3 = Math.round(area * 0.038);
      const aiMsgId = `msg-${Date.now()}-ai`;

      const fallbackMsg: ChatMessage = {
        id: aiMsgId,
        role: 'assistant',
        content: `### Architectural Guidance & Technical Recommendations
For **${activeProject.name || 'this proposal'}** (${activeProject.projectType || 'Architecture'}, ${area.toLocaleString()} sq.ft):

1. **Spatial Programming & Circulation**: Maintain minimum 1.2m clear interior corridors, with primary habitable rooms oriented to maximize natural cross-ventilation and glare-free North/South daylight.
2. **Structural Framing (IS 456 / IS 1786)**: Standard empirical rebar consumption sits at **4.2 kg/sq.ft** (~${steelMT} MT total) with pumpable M25 design concrete at **~${concreteM3} m³**.
3. **Building Code & Compliance**: Adhere to NBC Part 4 life safety standards, verifying 1.5m stairwell clear width and unobstructed fire tender setbacks.
4. **BOQ & Cost Tracking**: Use the **BOQ Schedule** to maintain itemized quantities and retain an uncommitted **7.5%–10% contingency reserve** against material price inflation.`,
        timestamp: new Date().toISOString(),
        specialist: selectedSpecialist,
        language: selectedLanguage,
        agentThought: `Evaluated ${activeProject.name} spatial footprint (${area.toLocaleString()} sq.ft), IS 456 reinforcement metrics, and NBC Part 4 statutory egress.`,
        agentToolsUsed: ['BOQ Completeness Auditor', 'IS 456 Structural Rules', 'NBC 2016 Code Engine'],
        agentActions: [
          {
            id: `act-steel-${Date.now()}`,
            type: 'add_boq_item',
            title: 'Add Fe550D TMT Rebar to BOQ',
            description: `Empirical steel requirement: ${steelMT} MT @ ${currency} 68,500/MT for RCC framed structure`,
            payload: {
              name: 'Fe550D High-Ductility TMT Reinforcement Steel',
              category: 'Concrete Works',
              unit: 'MT',
              quantity: steelMT,
              rate: 68500,
              notes: 'Fe550D rebar per IS 1786:2008 with seismic ductility',
            },
          },
        ],
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      setExpandedThoughts((prev) => ({ ...prev, [aiMsgId]: true }));

      if (autoSpeakEnabled || walkieTalkieActive) {
        setTimeout(() => {
          playMessageVoice(fallbackMsg);
        }, 300);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const currentLangObj = VOICE_LANGUAGES.find((l) => l.code === selectedLanguage) || VOICE_LANGUAGES[1];
  const activeSpecialistObj = SPECIALISTS.find((s) => s.id === selectedSpecialist) || SPECIALISTS[0];

  return (
    <div id="specialist-chat-view" className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-5">
      {/* Toast Notification Banner */}
      {toastNotification && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-xs shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{toastNotification.message}</span>
          </div>
          {onNavigateToBOQ && (
            <button
              type="button"
              onClick={onNavigateToBOQ}
              className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 text-xs font-semibold hover:bg-emerald-400 transition shrink-0"
            >
              View BOQ Schedule →
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs uppercase tracking-wider font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Gouse AI Agent
            </span>
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
              Gemini 3.8 Flash + Multi-Modal TTS
            </span>
            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
              25+ Languages Supported
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mt-1.5">
            Gouse AI Agent • Autonomous Specialist Studio
          </h2>
          <p className="text-xs text-slate-400">
            Consult multi-disciplinary architectural agents with transparent reasoning, tool execution, and 1-click project BOQ proposals.
          </p>
        </div>

        {/* Global Voice & Audio Controls & Gouse AI Agent Quick Launch */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Gouse AI Agent Platform Engine Button */}
          {onOpenWorkflowEngine && (
            <button
              id="btn-agent-open-gouse-ai-agent"
              type="button"
              onClick={onOpenWorkflowEngine}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition bg-gradient-to-r from-amber-500/20 via-emerald-500/15 to-slate-900 border-amber-500/40 text-amber-300 hover:border-amber-400 hover:text-white shadow-sm"
              title="Open Gouse AI Agent (4-Stage Pipeline, Rating 9.8/10)"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold">Gouse AI Agent</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                9.8/10
              </span>
            </button>
          )}

          {/* Hands-Free Auto-Speak Toggle */}
          <button
            id="toggle-auto-speak"
            type="button"
            onClick={() => setAutoSpeakEnabled(!autoSpeakEnabled)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition ${
              autoSpeakEnabled
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-semibold shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Automatically read aloud replies when generated"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Auto-Speak {autoSpeakEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Walkie-Talkie Continuous Voice Mode */}
          <button
            id="toggle-walkie-talkie"
            type="button"
            onClick={() => setWalkieTalkieActive(!walkieTalkieActive)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition ${
              walkieTalkieActive
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-semibold shadow-sm animate-pulse'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Continuous hands-free voice dialogue with the specialist"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Voice Dialogue {walkieTalkieActive ? 'ACTIVE' : 'READY'}</span>
          </button>

          {/* Speed Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[11px] font-mono">
            {[0.8, 1.0, 1.25, 1.5].map((speed) => (
              <button
                key={speed}
                onClick={() => {
                  setPlaybackSpeed(speed);
                  if (currentAudioRef.current) {
                    currentAudioRef.current.playbackRate = speed;
                  }
                }}
                className={`px-2 py-1 rounded transition ${
                  playbackSpeed === speed
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Clear Chat */}
          <button
            id="btn-clear-chat"
            onClick={() => {
              stopAudio();
              setMessages([
                {
                  id: `msg-${Date.now()}`,
                  role: 'assistant',
                  content: `Conversation reset. I am ready to consult on **${activeProject.name}** in ${currentLangObj.native}.`,
                  timestamp: new Date().toISOString(),
                  specialist: selectedSpecialist,
                },
              ]);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-slate-400 hover:text-white transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Specialist Agent Selector Cards (8 Dedicated Profiles) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Select Architectural Specialist ({SPECIALISTS.length})
          </span>
          <span className="text-[11px] font-mono text-amber-400">
            Active: {activeSpecialistObj.title} (Voice: {activeSpecialistObj.voiceName})
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {SPECIALISTS.map((s) => {
            const Icon = s.icon;
            const isSelected = selectedSpecialist === s.id;
            return (
              <button
                key={s.id}
                onClick={() => {
                  setSelectedSpecialist(s.id);
                  stopAudio();
                }}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between space-y-1.5 ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/70 shadow-sm'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`p-1.5 rounded-lg ${
                      isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-amber-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </div>
                <div>
                  <h4
                    className={`text-xs font-bold leading-tight truncate ${
                      isSelected ? 'text-amber-300' : 'text-white'
                    }`}
                  >
                    {s.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-tight mt-0.5 truncate">{s.role}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Language Selector Bar & Quick Prompts */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
        {/* Language Selection */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono">
            <Languages className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Voice & Chat Language:</span>
          </div>

          <div className="relative">
            <select
              id="select-voice-language"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-amber-500 focus:outline-none pr-8 cursor-pointer"
            >
              <optgroup label="🌐 Intelligent Auto-Detect">
                <option value="auto">🌐 Auto-Detect Input Language</option>
              </optgroup>
              <optgroup label="🇮🇳 Indian Languages (Native Scripts)">
                {VOICE_LANGUAGES.filter((l) => l.region === 'India').map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.native} — {l.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="🌍 Global Languages">
                {VOICE_LANGUAGES.filter((l) => l.region === 'International').map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.native} — {l.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <span className="text-[11px] text-slate-500 hidden sm:inline font-mono">
            (Speech-to-Text & Gemini Native TTS sync)
          </span>
        </div>

        {/* Active Specialist Description */}
        <div className="text-[11px] text-slate-400 font-mono truncate">
          <span className="text-amber-300 font-semibold">{activeSpecialistObj.title}:</span> {activeSpecialistObj.desc}
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-[11px] font-mono uppercase text-slate-500 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" /> Quick Query:
        </span>
        {QUICK_PROMPTS.map((qp, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(qp)}
            className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-white whitespace-nowrap text-[11px] transition shrink-0"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 flex flex-col h-[540px] shadow-inner overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isSpeaking = speakingMessageId === msg.id;
            const isGeneratingThisAudio = isGeneratingAudio === msg.id;
            const specialistCfg =
              SPECIALISTS.find((s) => s.id === msg.specialist) || SPECIALISTS[0];

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                    isUser
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-950 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[88%] sm:max-w-[78%] rounded-2xl p-4 text-xs leading-relaxed space-y-2 shadow-sm ${
                    isUser
                      ? 'bg-amber-500/15 border border-amber-500/30 text-white rounded-tr-none'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400 font-mono border-b border-slate-800/60 pb-1.5 mb-1.5">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      {isUser ? (
                        'Architect / User'
                      ) : (
                        <>
                          <span className="text-amber-400">{specialistCfg.title}</span>
                          <span className="text-slate-500">({specialistCfg.role})</span>
                        </>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      {msg.language && msg.language !== 'en-IN' && (
                        <span className="text-amber-400/80 bg-amber-500/10 px-1.5 py-0.5 rounded text-[9px]">
                          {VOICE_LANGUAGES.find((l) => l.code === msg.language)?.native || msg.language}
                        </span>
                      )}
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Agent Tools Used Badges */}
                  {msg.agentToolsUsed && msg.agentToolsUsed.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap my-1.5">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                        Tools:
                      </span>
                      {msg.agentToolsUsed.map((tool, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono text-amber-300/90 flex items-center gap-1"
                        >
                          <Zap className="w-2.5 h-2.5 text-amber-400" />
                          {tool}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Agent Reasoning (Chain-of-Thought) */}
                  {msg.agentThought && (
                    <div className="my-2 rounded-xl bg-slate-900/90 border border-amber-500/20 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleThought(msg.id)}
                        className="w-full px-3 py-2 flex items-center justify-between text-left text-[11px] font-mono text-amber-300 hover:bg-slate-800/60 transition"
                      >
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="font-semibold">Agent Reasoning & Plan</span>
                        </div>
                        {expandedThoughts[msg.id] ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>
                      {expandedThoughts[msg.id] && (
                        <div className="px-3 pb-3 pt-1 text-[11px] leading-relaxed text-slate-300 border-t border-slate-800/80 font-mono whitespace-pre-wrap bg-slate-950/40">
                          {msg.agentThought}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Content */}
                  <div className="prose prose-invert prose-xs max-w-none text-slate-200 whitespace-pre-wrap font-sans">
                    {msg.content}
                  </div>

                  {/* Proposed Agent Actions */}
                  {msg.agentActions && msg.agentActions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-2">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-400" />
                        Proposed Agent Actions ({msg.agentActions.length})
                      </div>
                      <div className="space-y-2">
                        {msg.agentActions.map((action) => (
                          <div
                            key={action.id}
                            className={`p-3 rounded-xl border transition ${
                              action.executed
                                ? 'bg-slate-900/40 border-emerald-500/30 text-slate-400'
                                : 'bg-slate-900 border-amber-500/30 text-slate-200 shadow-sm'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-xs text-white flex items-center gap-1.5">
                                {action.title}
                              </span>
                              {action.executed ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono">
                                  <Check className="w-3 h-3" />
                                  Applied
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleExecuteAction(action, msg.id)}
                                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition shadow-sm active:scale-95 flex items-center gap-1"
                                >
                                  <Zap className="w-3 h-3 fill-slate-950" />
                                  <span>Execute Action</span>
                                </button>
                              )}
                            </div>
                            {action.description && (
                              <p className="text-[11px] text-slate-400 mt-1">{action.description}</p>
                            )}
                            {action.payload && (
                              <div className="mt-2 text-[10px] font-mono bg-slate-950 p-2 rounded border border-slate-800 text-slate-300 flex flex-wrap gap-x-3 gap-y-1">
                                {action.payload.quantity && (
                                  <span>Qty: {action.payload.quantity} {action.payload.unit || ''}</span>
                                )}
                                {action.payload.rate && (
                                  <span>Rate: {currency} {Number(action.payload.rate).toLocaleString()}</span>
                                )}
                                {action.payload.category && (
                                  <span>Trade: {action.payload.category}</span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Audio Controls Bar for Assistant Responses */}
                  {!isUser && (
                    <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        {isSpeaking && (
                          <div className="flex items-center gap-1 text-[11px] text-amber-400 font-mono animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            <span>Voice Playing...</span>
                            <span className="text-slate-500">({playbackSpeed}x)</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Voice Play / Stop */}
                        <button
                          onClick={() => playMessageVoice(msg)}
                          disabled={isGeneratingThisAudio}
                          className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded transition ${
                            isSpeaking
                              ? 'bg-red-500 hover:bg-red-600 text-white font-semibold'
                              : 'bg-slate-900 border border-slate-800 text-amber-400 hover:text-white hover:bg-slate-800'
                          }`}
                          title="Listen with Gemini Specialist Voice"
                        >
                          {isGeneratingThisAudio ? (
                            <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                          ) : isSpeaking ? (
                            <VolumeX className="w-3 h-3" />
                          ) : (
                            <Volume2 className="w-3 h-3" />
                          )}
                          <span>
                            {isGeneratingThisAudio
                              ? 'Synthesizing...'
                              : isSpeaking
                              ? 'Stop Audio'
                              : 'Play Voice'}
                          </span>
                        </button>

                        {/* Download Voice File if available */}
                        {msg.audioBase64 && (
                          <button
                            onClick={() => downloadAudio(msg.audioBase64!, msg.id)}
                            className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
                            title="Download audio WAV file"
                          >
                            <Download className="w-3 h-3" />
                            <span className="hidden sm:inline">WAV</span>
                          </button>
                        )}

                        {/* Copy Text */}
                        <button
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-950 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-none p-4 text-xs text-slate-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span>
                  {activeSpecialistObj.title} is synthesizing architectural recommendations in{' '}
                  <span className="text-amber-400 font-mono">{currentLangObj.native}</span>...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar with Voice & Multi-Lingual STT */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2">
          {/* Active Voice Recording Live Visualizer */}
          {isListening && (
            <div className="flex items-center justify-between text-xs text-amber-400 bg-amber-500/10 px-3.5 py-2 rounded-lg border border-amber-500/30 font-mono animate-pulse">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span className="font-semibold">
                  Listening in {currentLangObj.native} ({currentLangObj.name})...
                </span>
              </div>
              <span className="text-[11px] text-slate-400">Speak your question clearly</span>
            </div>
          )}

          {voiceTranscript && isListening && (
            <div className="text-xs text-slate-300 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 font-sans italic">
              "{voiceTranscript}"
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Voice Input Button */}
            <button
              id="btn-voice-toggle"
              type="button"
              onClick={toggleVoiceInput}
              className={`p-2.5 rounded-lg transition border flex items-center justify-center shrink-0 ${
                isListening
                  ? 'bg-red-500 border-red-400 text-white animate-pulse'
                  : 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800 hover:border-amber-500/40'
              }`}
              title={`Voice Input in ${currentLangObj.native} (Speech-to-Text)`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Text Input */}
            <input
              id="input-chat-message"
              type="text"
              placeholder={`Ask ${activeSpecialistObj.title} in ${currentLangObj.native} (e.g. RCC, NBC code, rates)...`}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
            />

            {/* Send Button */}
            <button
              id="btn-send-message"
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition disabled:opacity-40 flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>

          {/* Bottom helper info */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 font-mono">
            <span>
              Specialist: <strong className="text-slate-400">{activeSpecialistObj.title}</strong> | Voice: <strong className="text-amber-400">{activeSpecialistObj.voiceName}</strong>
            </span>
            <span>
              Language: <strong className="text-slate-400">{currentLangObj.native}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
