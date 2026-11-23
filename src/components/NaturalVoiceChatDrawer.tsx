import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Volume2,
  VolumeX,
  Send,
  X,
  AudioWaveform,
  Languages,
  Loader2,
  RotateCcw,
  Hand,
  ArrowUpRight,
} from 'lucide-react';
import { Project, BOQItem } from '../types';
import { TabType } from './Navigation';
import { CurrencyCode, formatCurrency } from '../utils/formatters';
import { ensureItemFloorBreakdown } from '../utils/floorTakeoffEngine';

export interface VoiceChatTurn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  audioBase64?: string | null;
  actionNote?: string;
}

export interface NaturalVoiceChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: TabType;
  activeProject: Project;
  boqItems: BOQItem[];
  contingencyPercent: number;
  currency: CurrencyCode;
  onNavigateTab: (tab: TabType) => void;
  onUpdateProject: (updated: Project) => void;
  onUpdateBOQItems: (items: BOQItem[]) => void;
  onChangeContingency: (nextPercent: number) => void;
  onChangeCurrency: (nextCurrency: CurrencyCode) => void;
}

const VOICE_PERSONAS = [
  { id: 'Zephyr', label: 'Zephyr · Studio Lead' },
  { id: 'Kore', label: 'Kore · Design Director' },
  { id: 'Puck', label: 'Puck · Project Guide' },
  { id: 'Charon', label: 'Charon · Structural Advisor' },
  { id: 'Fenrir', label: 'Fenrir · Field Engineer' },
];

const CHAT_LANGUAGES = [
  { code: 'auto', label: 'Auto-Detect Language' },
  { code: 'en-IN', label: 'English (India)' },
  { code: 'kn-IN', label: 'Kannada (ಕನ್ನಡ)' },
  { code: 'hi-IN', label: 'Hindi (हिन्दी)' },
  { code: 'te-IN', label: 'Telugu (తెలుగు)' },
  { code: 'ta-IN', label: 'Tamil (தமிழ்)' },
  { code: 'ml-IN', label: 'Malayalam (മലയാളം)' },
  { code: 'mr-IN', label: 'Marathi (मराठी)' },
  { code: 'ur-IN', label: 'Urdu (اردو)' },
  { code: 'ar-SA', label: 'Arabic (العربية)' },
];

const CONVERSATION_STARTERS = [
  'How is our BOQ budget looking right now?',
  'Check live cement and steel rates for this project.',
  'Walk me through structural checks before slab pour.',
  'Open Realstate Media so we can share this project.',
];

export const NaturalVoiceChatDrawer: React.FC<NaturalVoiceChatDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  activeProject,
  boqItems,
  contingencyPercent,
  currency,
  onNavigateTab,
  onUpdateProject,
  onUpdateBOQItems,
  onChangeContingency,
  onChangeCurrency,
}) => {
  const [turns, setTurns] = useState<VoiceChatTurn[]>(() => [
    {
      id: 'welcome-voice-turn',
      role: 'assistant',
      text: `Hi! I'm tuned into ${activeProject.name}. Tap Start Voice Call whenever you'd like to talk through your BOQ, site materials, or design ideas naturally.`,
      timestamp: new Date().toISOString(),
    },
  ]);

  const [voiceName, setVoiceName] = useState<string>('Zephyr');
  const [language, setLanguage] = useState<string>('auto');
  const [isHandsFree, setIsHandsFree] = useState<boolean>(true);
  const [isMutedOutput, setIsMutedOutput] = useState<boolean>(false);
  const [textDraft, setTextDraft] = useState<string>('');

  // Live Call Lifecycle States
  const [callState, setCallState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [isManualRecording, setIsManualRecording] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [waveformBars, setWaveformBars] = useState<number[]>(() => new Array(24).fill(12));

  // Refs to prevent stale closures inside VAD / MediaRecorder / Audio callbacks
  const callActiveRef = useRef<boolean>(false);
  const handsFreeRef = useRef<boolean>(isHandsFree);
  const mutedRef = useRef<boolean>(isMutedOutput);
  const voiceNameRef = useRef<string>(voiceName);
  const languageRef = useRef<string>(language);
  const turnsRef = useRef<VoiceChatTurn[]>(turns);

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const rafRef = useRef<number | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);

  // VAD turn-taking refs
  const speechFramesRef = useRef<number>(0);
  const hasSpeechRef = useRef<boolean>(false);
  const silenceStartRef = useRef<number | null>(null);
  const turnStartRef = useRef<number>(0);
  const discardOnStopRef = useRef<boolean>(false);

  useEffect(() => {
    handsFreeRef.current = isHandsFree;
  }, [isHandsFree]);

  useEffect(() => {
    mutedRef.current = isMutedOutput;
  }, [isMutedOutput]);

  useEffect(() => {
    voiceNameRef.current = voiceName;
  }, [voiceName]);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    turnsRef.current = turns;
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, callState]);

  const boqSummary = useMemo(() => {
    const subtotal = boqItems.reduce((sum, i) => sum + (i.amount || i.quantity * i.rate || 0), 0);
    const grandTotal = subtotal + Math.round((subtotal * contingencyPercent) / 100);
    return {
      lineItemsCount: boqItems.length,
      subtotal,
      grandTotal,
      topItems: boqItems.slice(0, 5).map((i) => `${i.name} (${i.quantity} ${i.unit})`),
    };
  }, [boqItems, contingencyPercent]);

  const stopPlayback = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.onended = null;
      currentAudioRef.current.onerror = null;
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const cleanupAudioGraph = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      discardOnStopRef.current = true;
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    mediaRecorderRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
    analyserRef.current = null;
    setWaveformBars(new Array(24).fill(12));
  };

  const endVoiceCall = () => {
    callActiveRef.current = false;
    setIsManualRecording(false);
    stopPlayback();
    cleanupAudioGraph();
    setCallState('idle');
  };

  useEffect(() => {
    return () => {
      endVoiceCall();
    };
  }, []);

  const applyWorkspaceAction = (action: any): string | undefined => {
    if (!action || action.type === 'none') return undefined;

    if (action.type === 'navigate' && action.targetTab) {
      onNavigateTab(action.targetTab as TabType);
      return `Opened ${action.targetTab.replace(/_/g, ' ')}`;
    }

    if (action.type === 'add_boq_item' && action.newBOQItem?.name) {
      const qty = Math.max(1, Number(action.newBOQItem.quantity) || 10);
      const rate = Math.max(1, Number(action.newBOQItem.rate) || 500);
      const raw: BOQItem = {
        id: `boq-voice-${Date.now()}`,
        name: action.newBOQItem.name,
        category: action.newBOQItem.category || 'Civil & Masonry',
        unit: action.newBOQItem.unit || 'nos',
        quantity: qty,
        rate,
        amount: Math.round(qty * rate),
        notes: 'Added during natural voice conversation',
        stage: 'Superstructure',
        status: 'estimated',
      };
      const nextItem = ensureItemFloorBreakdown(raw, activeProject.floors);
      onUpdateBOQItems([nextItem, ...boqItems]);
      return `Added ${qty} ${nextItem.unit} of ${nextItem.name} to BOQ`;
    }

    if (action.type === 'update_area' && Number(action.builtUpAreaSqFt) > 100) {
      const nextArea = Number(action.builtUpAreaSqFt);
      onUpdateProject({
        ...activeProject,
        builtUpAreaSqFt: nextArea,
        updatedAt: new Date().toISOString(),
      });
      return `Updated built-up area to ${nextArea.toLocaleString()} sq.ft`;
    }

    if (action.type === 'update_contingency' && typeof action.contingencyPercent === 'number') {
      const nextPct = Math.min(30, Math.max(0, action.contingencyPercent));
      onChangeContingency(nextPct);
      return `Updated contingency reserve to ${nextPct}%`;
    }

    if (action.type === 'change_currency' && action.currency) {
      onChangeCurrency(action.currency as CurrencyCode);
      return `Switched currency to ${action.currency}`;
    }

    return undefined;
  };

  const playReplyAudio = (
    spokenText: string,
    audioBase64?: string | null,
    detectedLang?: string
  ) => {
    stopPlayback();

    const finishSpeaking = () => {
      currentAudioRef.current = null;
      if (callActiveRef.current && handsFreeRef.current) {
        setTimeout(() => {
          if (callActiveRef.current && handsFreeRef.current) {
            beginListeningTurn();
          }
        }, 320);
      } else {
        setCallState('idle');
      }
    };

    if (mutedRef.current) {
      finishSpeaking();
      return;
    }

    setCallState('speaking');

    if (audioBase64) {
      try {
        const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
        currentAudioRef.current = audio;
        audio.onended = finishSpeaking;
        audio.onerror = () => {
          speakWithBrowserFallback(spokenText, detectedLang, finishSpeaking);
        };
        audio.play().catch(() => {
          speakWithBrowserFallback(spokenText, detectedLang, finishSpeaking);
        });
        return;
      } catch {
        // fallback below
      }
    }

    speakWithBrowserFallback(spokenText, detectedLang, finishSpeaking);
  };

  const replayTurnAudio = async (turn: VoiceChatTurn) => {
    if (turn.audioBase64) {
      playReplyAudio(turn.text, turn.audioBase64, languageRef.current);
      return;
    }
    try {
      const res = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: turn.text,
          voiceName: voiceNameRef.current,
          language: languageRef.current,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          setTurns((prev) =>
            prev.map((t) => (t.id === turn.id ? { ...t, audioBase64: data.audioBase64 } : t))
          );
          playReplyAudio(turn.text, data.audioBase64, languageRef.current);
          return;
        }
      }
    } catch {
      // fallback to browser speech below
    }
    playReplyAudio(turn.text, null, languageRef.current);
  };

  const speakWithBrowserFallback = (
    spokenText: string,
    detectedLang: string | undefined,
    onDone: () => void
  ) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onDone();
      return;
    }
    try {
      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.lang =
        detectedLang && detectedLang !== 'auto'
          ? detectedLang
          : languageRef.current === 'auto'
          ? 'en-IN'
          : languageRef.current;
      utterance.rate = 1.02;
      utterance.onend = onDone;
      utterance.onerror = onDone;
      window.speechSynthesis.speak(utterance);
    } catch {
      onDone();
    }
  };

  const sendVoiceTurn = async (payload: {
    audioBase64?: string;
    mimeType?: string;
    text?: string;
  }) => {
    setCallState('thinking');
    setMicError(null);

    const historyForApi = turnsRef.current.slice(-8).map((t) => ({
      role: t.role,
      text: t.text,
    }));

    // If text was provided directly, add optimistic user bubble immediately
    let optimisticUserTurnId: string | null = null;
    if (payload.text && !payload.audioBase64) {
      optimisticUserTurnId = `turn-u-${Date.now()}`;
      setTurns((prev) => [
        ...prev,
        {
          id: optimisticUserTurnId!,
          role: 'user',
          text: payload.text!,
          timestamp: new Date().toISOString(),
        },
      ]);
    }

    try {
      const res = await fetch('/api/voice/natural-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          history: historyForApi,
          activeTab,
          activeProject,
          boqSummary,
          currency,
          contingencyPercent,
          language: languageRef.current,
          voiceName: voiceNameRef.current,
          specialist: 'general',
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const userTranscript = (data.transcript || payload.text || '').trim();
      const replyText = (data.displayText || data.spokenReply || '').trim();
      const spokenReply = (data.spokenReply || replyText).trim();
      const actionNote = applyWorkspaceAction(data.workspaceAction);

      if (payload.audioBase64 && userTranscript) {
        setTurns((prev) => [
          ...prev,
          {
            id: `turn-u-${Date.now()}`,
            role: 'user',
            text: userTranscript,
            timestamp: new Date().toISOString(),
          },
        ]);
      }

      if (replyText) {
        setTurns((prev) => [
          ...prev,
          {
            id: `turn-a-${Date.now()}`,
            role: 'assistant',
            text: replyText,
            timestamp: new Date().toISOString(),
            audioBase64: data.audioBase64 || null,
            actionNote,
          },
        ]);
      }

      playReplyAudio(spokenReply || replyText, data.audioBase64, data.detectedLanguage);
    } catch {
      setMicError('Could not reach the voice service right now. Please try again.');
      if (callActiveRef.current && handsFreeRef.current) {
        beginListeningTurn();
      } else {
        setCallState('idle');
      }
    }
  };

  const beginListeningTurn = async () => {
    setMicError(null);
    stopPlayback();

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setMicError('Microphone access is not available in this browser environment.');
      setCallState('idle');
      callActiveRef.current = false;
      return;
    }

    try {
      if (!streamRef.current || streamRef.current.getTracks().every((t) => t.readyState === 'ended')) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        streamRef.current = stream;

        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new Ctx();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;
      }

      const stream = streamRef.current!;
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      }

      audioChunksRef.current = [];
      discardOnStopRef.current = false;
      hasSpeechRef.current = false;
      speechFramesRef.current = 0;
      silenceStartRef.current = null;
      turnStartRef.current = Date.now();

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          audioChunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = () => {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        setWaveformBars(new Array(24).fill(12));

        if (discardOnStopRef.current || audioChunksRef.current.length === 0) {
          audioChunksRef.current = [];
          return;
        }

        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];
        if (blob.size < 1000) {
          if (callActiveRef.current && handsFreeRef.current) {
            beginListeningTurn();
          } else {
            setCallState('idle');
          }
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string)?.split(',')[1];
          if (base64) {
            sendVoiceTurn({ audioBase64: base64, mimeType });
          }
        };
        reader.readAsDataURL(blob);
      };

      recorder.start(200);
      setCallState('listening');

      // Real-time AnalyserNode waveform + VAD loop
      const analyser = analyserRef.current;
      if (analyser) {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
            return;
          }
          analyser.getByteTimeDomainData(dataArray);
          let sumSq = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const norm = (dataArray[i] - 128) / 128;
            sumSq += norm * norm;
          }
          const rms = Math.sqrt(sumSq / dataArray.length);

          // Update 24 visual bars from live spectrum buckets
          const freq = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(freq);
          const bars: number[] = [];
          const step = Math.max(1, Math.floor(freq.length / 24));
          for (let b = 0; b < 24; b++) {
            const val = freq[b * step] || 0;
            bars.push(Math.max(10, Math.min(100, Math.round((val / 255) * 100))));
          }
          setWaveformBars(bars);

          // Automatic end-of-utterance turn taking in Hands-Free Call mode
          if (callActiveRef.current && handsFreeRef.current) {
            const now = Date.now();
            if (rms > 0.024) {
              speechFramesRef.current += 1;
              if (speechFramesRef.current >= 4) {
                hasSpeechRef.current = true;
              }
              silenceStartRef.current = null;
            } else if (hasSpeechRef.current) {
              if (silenceStartRef.current === null) {
                silenceStartRef.current = now;
              } else if (now - silenceStartRef.current > 1200) {
                // Natural pause detected -> send turn!
                if (mediaRecorderRef.current?.state === 'recording') {
                  mediaRecorderRef.current.stop();
                }
                return;
              }
            }

            if (hasSpeechRef.current && now - turnStartRef.current > 22000) {
              if (mediaRecorderRef.current?.state === 'recording') {
                mediaRecorderRef.current.stop();
              }
              return;
            }
          }

          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      }
    } catch {
      setMicError('Please allow microphone access in your browser to talk naturally.');
      callActiveRef.current = false;
      setCallState('idle');
    }
  };

  const handleToggleCall = () => {
    if (callActiveRef.current) {
      endVoiceCall();
    } else {
      callActiveRef.current = true;
      setIsHandsFree(true);
      handsFreeRef.current = true;
      beginListeningTurn();
    }
  };

  const handleTapToTalk = () => {
    if (callState === 'speaking') {
      // Barge-in interrupt!
      stopPlayback();
      if (callActiveRef.current && isHandsFree) {
        beginListeningTurn();
        return;
      }
    }

    if (isManualRecording && mediaRecorderRef.current?.state === 'recording') {
      setIsManualRecording(false);
      mediaRecorderRef.current.stop();
      return;
    }

    callActiveRef.current = false;
    setIsHandsFree(false);
    handsFreeRef.current = false;
    setIsManualRecording(true);
    beginListeningTurn();
  };

  const handleSendTextTurn = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = textDraft.trim();
    if (!q || callState === 'thinking') return;
    setTextDraft('');
    stopPlayback();
    sendVoiceTurn({ text: q });
  };

  const handleCloseDrawer = () => {
    endVoiceCall();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex justify-end"
      onClick={handleCloseDrawer}
    >
      <aside
        className="w-full max-w-lg h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-white truncate">
              Gouse AI Natural Voice Chat
            </h2>
            <p className="text-xs text-slate-400 truncate">
              {activeProject.name} · BOQ {formatCurrency(boqSummary.grandTotal, currency)}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                const next = !isMutedOutput;
                setIsMutedOutput(next);
                if (next) stopPlayback();
              }}
              title={isMutedOutput ? 'Unmute assistant voice' : 'Mute assistant voice'}
              className={`p-2 rounded-lg border text-xs transition ${
                isMutedOutput
                  ? 'bg-slate-900 border-slate-700 text-rose-400'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {isMutedOutput ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => {
                stopPlayback();
                setTurns([
                  {
                    id: `reset-${Date.now()}`,
                    role: 'assistant',
                    text: `Fresh conversation started for ${activeProject.name}. Go ahead whenever you're ready.`,
                    timestamp: new Date().toISOString(),
                  },
                ]);
              }}
              title="Reset conversation"
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleCloseDrawer}
              aria-label="Close Voice Chat"
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Voice Persona & Language Controls */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/40 grid grid-cols-2 gap-2.5 shrink-0">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Voice Partner
            </label>
            <select
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              {VOICE_PERSONAS.map((v) => (
                <option key={v.id} value={v.id} className="bg-slate-900">
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
              <Languages className="w-3 h-3 text-amber-400" />
              <span>Spoken Language</span>
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              {CHAT_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-slate-900">
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Voice Call Panel + Waveform */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 space-y-3 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-medium text-slate-300">
              {callState === 'listening'
                ? isHandsFree
                  ? 'Listening naturally — pause when finished speaking'
                  : 'Recording your turn — tap Stop & Send when done'
                : callState === 'thinking'
                ? 'Thinking through your project context...'
                : callState === 'speaking'
                ? `${voiceName} is speaking...`
                : 'Ready for natural two-way voice conversation'}
            </div>
            <span className="text-[11px] font-mono text-amber-300 tabular-nums shrink-0">
              {callState === 'idle' ? 'Standby' : callState.toUpperCase()}
            </span>
          </div>

          {/* Real Audio Signal Bars */}
          <div
            className="h-12 px-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-1"
            aria-hidden="true"
          >
            {waveformBars.map((val, idx) => {
              const barHeight =
                callState === 'listening'
                  ? `${Math.max(14, val)}%`
                  : callState === 'speaking'
                  ? `${24 + ((idx * 19 + 17) % 58)}%`
                  : '14%';
              return (
                <div
                  key={idx}
                  className={`flex-1 rounded-full transition-all duration-100 ${
                    callState === 'listening'
                      ? 'bg-amber-400'
                      : callState === 'speaking'
                      ? 'bg-emerald-400'
                      : callState === 'thinking'
                      ? 'bg-cyan-400/70'
                      : 'bg-slate-700'
                  }`}
                  style={{ height: barHeight }}
                />
              );
            })}
          </div>

          {/* Primary Call & Tap-to-Talk Actions */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              id="btn-voice-call-toggle"
              type="button"
              onClick={handleToggleCall}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
                callActiveRef.current || (isHandsFree && callState !== 'idle' && !isManualRecording)
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
              }`}
            >
              {callActiveRef.current || (isHandsFree && callState !== 'idle' && !isManualRecording) ? (
                <>
                  <PhoneOff className="w-4 h-4" />
                  <span>End Voice Call</span>
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4" />
                  <span>Start Voice Call</span>
                </>
              )}
            </button>

            <button
              id="btn-voice-tap-talk"
              type="button"
              onClick={handleTapToTalk}
              disabled={callState === 'thinking'}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition disabled:opacity-50 ${
                callState === 'speaking'
                  ? 'bg-slate-800 border-amber-500/60 text-amber-300 hover:bg-slate-700'
                  : isManualRecording
                  ? 'bg-rose-600/20 border-rose-500 text-rose-300'
                  : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-slate-500'
              }`}
            >
              {callState === 'speaking' ? (
                <>
                  <Hand className="w-4 h-4" />
                  <span>Interrupt &amp; Speak</span>
                </>
              ) : isManualRecording ? (
                <>
                  <MicOff className="w-4 h-4" />
                  <span>Stop &amp; Send</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-amber-400" />
                  <span>Tap to Talk</span>
                </>
              )}
            </button>
          </div>

          {micError && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
              {micError}
            </p>
          )}
        </div>

        {/* Conversation Transcript */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
          {turns.map((turn) => {
            const isUser = turn.role === 'user';
            return (
              <div
                key={turn.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed border ${
                    isUser
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-medium'
                      : 'bg-slate-950 text-slate-100 border-slate-800'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{turn.text}</p>
                  {turn.actionNote && (
                    <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-amber-300 flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3 shrink-0" />
                      <span>{turn.actionNote}</span>
                    </div>
                  )}
                </div>

                {!isUser && (
                  <button
                    type="button"
                    onClick={() => replayTurnAudio(turn)}
                    className="mt-1 px-2 py-0.5 text-[11px] text-slate-400 hover:text-amber-300 inline-flex items-center gap-1 transition"
                  >
                    <AudioWaveform className="w-3 h-3" />
                    <span>Play voice</span>
                  </button>
                )}
              </div>
            );
          })}

          {callState === 'thinking' && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span>Preparing spoken reply...</span>
            </div>
          )}

          {turns.length <= 1 && (
            <div className="pt-2 space-y-1.5">
              <span className="block text-[11px] font-medium text-slate-500">
                Try asking naturally
              </span>
              <div className="flex flex-col gap-1.5">
                {CONVERSATION_STARTERS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => sendVoiceTurn({ text: q })}
                    className="text-left px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-600 text-xs text-slate-300 hover:text-white transition"
                  >
                    “{q}”
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={scrollAnchorRef} />
        </div>

        {/* Typed Message Fallback in Same Voice Thread */}
        <form
          onSubmit={handleSendTextTurn}
          className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={textDraft}
            onChange={(e) => setTextDraft(e.target.value)}
            placeholder="Or type a message to hear a voice reply..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            disabled={!textDraft.trim() || callState === 'thinking'}
            className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-semibold text-xs inline-flex items-center gap-1.5 transition shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </aside>
    </div>
  );
};
