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
  Check,
  Building,
  Compass,
  FileCheck,
  Scale,
  Leaf,
  Layers
} from 'lucide-react';
import { SpecialistType, ChatMessage, Project } from '../types';

interface SpecialistChatViewProps {
  activeProject: Project;
}

const SPECIALISTS: Array<{
  id: SpecialistType;
  title: string;
  role: string;
  icon: any;
  desc: string;
}> = [
  {
    id: 'general',
    title: 'Principal Advisor',
    role: 'Holistic Architecture',
    icon: Building,
    desc: 'Integrated spatial planning, architectural vision, and project coordination.',
  },
  {
    id: 'design',
    title: 'Design Specialist',
    role: 'Concept & Adjacencies',
    icon: Compass,
    desc: 'Massing, space planning, circulation, daylighting, and programmatic flow.',
  },
  {
    id: 'code',
    title: 'Code & Regulations',
    role: 'Statutory Compliance',
    icon: Scale,
    desc: 'NBC / IBC building codes, FSI/FAR ratios, egress, setbacks, and fire ratings.',
  },
  {
    id: 'documentation',
    title: 'Documentation Specialist',
    role: 'Specifications & Detailing',
    icon: FileCheck,
    desc: 'CSI MasterFormat specs, drawing schedules, submittals, and RFI tracking.',
  },
  {
    id: 'quantity',
    title: 'Quantity & BOQ Specialist',
    role: 'Cost & Quantities',
    icon: Layers,
    desc: 'Schedule of rates, itemized quantities, material takeoff, and contingency.',
  },
  {
    id: 'sustainability',
    title: 'Sustainability Specialist',
    role: 'Green & Bioclimatic',
    icon: Leaf,
    desc: 'Passive solar design, U-values, embodied carbon, and GRIHA/LEED strategies.',
  },
];

const VOICE_LANGUAGES = [
  { code: 'en-IN', name: 'English (India)' },
  { code: 'hi-IN', name: 'हिन्दी — Hindi' },
  { code: 'kn-IN', name: 'ಕನ್ನಡ — Kannada' },
  { code: 'te-IN', name: 'తెలుగు — Telugu' },
  { code: 'ta-IN', name: 'தமிழ் — Tamil' },
  { code: 'ml-IN', name: 'മലയാളം — Malayalam' },
  { code: 'mr-IN', name: 'मराठी — Marathi' },
  { code: 'gu-IN', name: 'ગુજરાતી — Gujarati' },
  { code: 'bn-IN', name: 'বাংলা — Bengali' },
  { code: 'pa-IN', name: 'ਪੰਜਾਬੀ — Punjabi' },
  { code: 'ur-IN', name: 'اردو — Urdu' },
  { code: 'or-IN', name: 'ଓଡ଼ିଆ — Odia' },
  { code: 'en-US', name: 'English (US)' },
];

const QUICK_PROMPTS = [
  'What is the formula to calculate reinforcement steel weight in RCC slabs?',
  'What are the NBC requirements for fire exit stairwell corridor widths?',
  'Compare AAC blocks vs red wire-cut bricks for an exterior wall in a tropical climate.',
  'How to design a passive courtyard to maximize stack-effect natural ventilation?',
  'Draft an outline for CSI Division 03 (Concrete) architectural specifications.',
];

export const SpecialistChatView: React.FC<SpecialistChatViewProps> = ({ activeProject }) => {
  const [selectedSpecialist, setSelectedSpecialist] = useState<SpecialistType>('general');
  const [selectedLanguage, setSelectedLanguage] = useState('en-IN');
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      role: 'assistant',
      content: `Welcome to Gouse AI Architecture Studio. I am your **${
        SPECIALISTS.find((s) => s.id === selectedSpecialist)?.title
      }**.
Active Project: **${activeProject.name}** (${activeProject.projectType}).

How can I assist your architectural workflow today? You can query spatial programming, building regulations, BOQ calculations, or speak directly using multi-lingual voice commands below.`,
      timestamp: new Date().toISOString(),
      specialist: 'general',
    },
  ]);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Voice speech recognition setup
  const startVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported by your browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = selectedLanguage;
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputMessage(transcript);
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  // Text to Speech
  const toggleSpeech = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingMessageId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[#*`_\[\]]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = selectedLanguage.startsWith('en') ? 'en-US' : selectedLanguage;
    utterance.rate = 1.0;

    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(id);
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
      specialist: selectedSpecialist,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const projectContext = `Project: ${activeProject.name} | Typology: ${activeProject.projectType} | Location: ${activeProject.location} | Scope: ${activeProject.description}`;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          specialist: selectedSpecialist,
          projectContext,
        }),
      });

      if (!res.ok) throw new Error('Failed to get specialist response');
      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
        specialist: selectedSpecialist,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        role: 'assistant',
        content: `Error generating response: ${err.message || 'Please check network connection'}.`,
        timestamp: new Date().toISOString(),
        specialist: selectedSpecialist,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div id="specialist-chat-view" className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              ArchAgent 2.0
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Model: Gemini 3.8 Flash
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
            Specialist Architectural AI & Voice Consultation
          </h2>
          <p className="text-xs text-slate-400">
            Consult specialized architectural agents with multi-lingual voice recognition and speech synthesis.
          </p>
        </div>

        <button
          onClick={() => {
            if (window.confirm('Clear conversation history?')) {
              setMessages([]);
            }
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-slate-400 hover:text-white transition self-start sm:self-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Chat</span>
        </button>
      </div>

      {/* Specialist Agent Selector Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {SPECIALISTS.map((s) => {
          const Icon = s.icon;
          const isSelected = selectedSpecialist === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSelectedSpecialist(s.id)}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between space-y-2 ${
                isSelected
                  ? 'bg-amber-500/15 border-amber-500/60 shadow-sm'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-amber-400'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                )}
              </div>
              <div>
                <h4 className={`text-xs font-bold leading-tight ${isSelected ? 'text-amber-300' : 'text-white'}`}>
                  {s.title}
                </h4>
                <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{s.role}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Prompts */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-[11px] font-mono uppercase text-slate-500 shrink-0">Quick Consult:</span>
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
      <div className="rounded-xl bg-slate-900 border border-slate-800 flex flex-col h-[520px] shadow-inner overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isSpeaking = speakingMessageId === msg.id;

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
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs leading-relaxed space-y-2 shadow-sm ${
                    isUser
                      ? 'bg-amber-500/15 border border-amber-500/30 text-white rounded-tr-none'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400 font-mono border-b border-slate-800/60 pb-1.5 mb-1.5">
                    <span className="font-semibold text-slate-300">
                      {isUser ? 'Architect' : 'Gouse AI Specialist'}
                    </span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div className="prose prose-invert prose-xs max-w-none text-slate-200 whitespace-pre-wrap font-sans">
                    {msg.content}
                  </div>

                  {!isUser && (
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleSpeech(msg.id, msg.content)}
                        className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded transition ${
                          isSpeaking
                            ? 'bg-amber-500 text-slate-950 font-semibold'
                            : 'text-slate-400 hover:text-white bg-slate-900'
                        }`}
                        title="Listen to audio"
                      >
                        {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                        <span>{isSpeaking ? 'Stop Audio' : 'Speak'}</span>
                      </button>

                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded text-slate-400 hover:text-white bg-slate-900 transition"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-950 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-none p-4 text-xs text-slate-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span>Specialist is synthesizing architectural recommendations...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar with Multi-Lingual Voice */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2">
          {isListening && (
            <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 font-mono animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>
                Listening in{' '}
                {VOICE_LANGUAGES.find((l) => l.code === selectedLanguage)?.name || selectedLanguage}...
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <select
              id="select-voice-language"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2.5 text-xs text-slate-300 font-mono focus:border-amber-500 focus:outline-none max-w-[130px] sm:max-w-[170px] truncate"
              title="Select voice speech recognition language"
            >
              {VOICE_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                  {l.name}
                </option>
              ))}
            </select>

            {/* Voice Command Button */}
            <button
              id="btn-voice-toggle"
              type="button"
              onClick={startVoiceInput}
              className={`p-2.5 rounded-lg transition border flex items-center justify-center shrink-0 ${
                isListening
                  ? 'bg-red-500 border-red-400 text-white animate-pulse'
                  : 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800 hover:border-amber-500/30'
              }`}
              title="Voice Input (Speech-to-Text)"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Text Input */}
            <input
              id="input-chat-message"
              type="text"
              placeholder={`Ask ${SPECIALISTS.find((s) => s.id === selectedSpecialist)?.title} about architecture, codes, BOQ...`}
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
        </div>
      </div>
    </div>
  );
};
