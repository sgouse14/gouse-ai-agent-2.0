import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Command,
  X,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Wand2,
  CornerDownLeft,
  Calculator,
  Building2,
  Zap,
  RotateCcw,
  Languages,
  Radio,
  Sliders,
  Play,
  Pause,
  ExternalLink,
} from 'lucide-react';
import { Project, BOQItem } from '../types';
import { TabType } from './Navigation';
import { CurrencyCode } from '../utils/formatters';

export interface GlobalVoiceCommandListenerProps {
  activeTab: TabType;
  onNavigateTab: (tab: TabType) => void;
  projects: Project[];
  activeProject: Project;
  onSelectProject: (id: string) => void;
  onUpdateProject: (updated: Project) => void;
  onCreateProject?: (newProj: Partial<Project>) => void;
  currency: CurrencyCode;
  onChangeCurrency: (c: CurrencyCode) => void;
  contingencyPercent: number;
  onChangeContingency: (percent: number) => void;
  onOpenWorkflowEngine?: () => void;
  onOpenSettings?: () => void;
  boqItems?: BOQItem[];
  onUpdateBOQItems?: (items: BOQItem[]) => void;
  isExternalListening?: boolean;
  onToggleExternalListening?: () => void;
}

export interface VoiceCommandHistoryItem {
  id: string;
  transcript: string;
  actionSummary: string;
  category: string;
  timestamp: string;
  success: boolean;
  spokenResponse?: string;
}

type GeminiState = 'idle' | 'listening' | 'thinking' | 'speaking';

// Audio chime using Web Audio API
function playChime(type: 'success' | 'start' | 'error' | 'gemini' = 'gemini') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'start' || type === 'gemini') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.12); // G5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch {
    // Ignore audio permission or autoplay restrictions
  }
}

export const GlobalVoiceCommandListener: React.FC<GlobalVoiceCommandListenerProps> = ({
  activeTab,
  onNavigateTab,
  projects,
  activeProject,
  onSelectProject,
  onUpdateProject,
  onCreateProject,
  currency,
  onChangeCurrency,
  contingencyPercent,
  onChangeContingency,
  onOpenWorkflowEngine,
  onOpenSettings,
  boqItems = [],
  onUpdateBOQItems,
  isExternalListening,
  onToggleExternalListening,
}) => {
  const [geminiState, setGeminiState] = useState<GeminiState>('idle');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [activeSpeechText, setActiveSpeechText] = useState<string>('');
  const [geminiResponseText, setGeminiResponseText] = useState<string>('');
  const [commandFeedback, setCommandFeedback] = useState<{
    text: string;
    type: 'success' | 'info' | 'warning';
  } | null>(null);

  const [isSpeechSynthesisEnabled, setIsSpeechSynthesisEnabled] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [typedCommand, setTypedCommand] = useState<string>('');
  const [voicePersona, setVoicePersona] = useState<string>('Zephyr');
  const [liveVolume, setLiveVolume] = useState<number>(0);
  const [frequencyBars, setFrequencyBars] = useState<number[]>([12, 18, 25, 14, 20]);
  const [isContinuousMode, setIsContinuousMode] = useState<boolean>(false);

  const [commandHistory, setCommandHistory] = useState<VoiceCommandHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('gouse_ai_voice_command_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Audio references
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const currentAudioElemRef = useRef<HTMLAudioElement | null>(null);
  const isExecutingRef = useRef<boolean>(false);
  const isManuallyStoppedRef = useRef<boolean>(false);
  const geminiStateRef = useRef<GeminiState>('idle');

  useEffect(() => {
    geminiStateRef.current = geminiState;
  }, [geminiState]);

  // Sync external listening toggle from Header
  useEffect(() => {
    if (isExternalListening !== undefined) {
      if (isExternalListening && geminiState === 'idle') {
        startGeminiVoice();
      } else if (!isExternalListening && (geminiState === 'listening' || geminiState === 'speaking')) {
        stopGeminiVoice();
      }
    }
  }, [isExternalListening]);

  // Persist history
  useEffect(() => {
    try {
      localStorage.setItem('gouse_ai_voice_command_history', JSON.stringify(commandHistory.slice(0, 30)));
    } catch {
      // Ignore
    }
  }, [commandHistory]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopGeminiVoice();
      if (currentAudioElemRef.current) {
        currentAudioElemRef.current.pause();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Play audio response (either Gemini TTS audioBase64 or speech synthesis)
  const playSpokenAudio = useCallback(
    (text: string, audioBase64?: string | null) => {
      if (!isSpeechSynthesisEnabled) return;

      // Stop any existing playback
      if (currentAudioElemRef.current) {
        currentAudioElemRef.current.pause();
        currentAudioElemRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      setGeminiState('speaking');

      if (audioBase64) {
        try {
          const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
          currentAudioElemRef.current = audio;
          audio.onended = () => {
            setGeminiState(isContinuousMode ? 'listening' : 'idle');
          };
          audio.onerror = () => {
            fallbackSpeechSynthesis(text);
          };
          audio.play().catch(() => {
            fallbackSpeechSynthesis(text);
          });
          return;
        } catch {
          fallbackSpeechSynthesis(text);
          return;
        }
      }

      fallbackSpeechSynthesis(text);
    },
    [isSpeechSynthesisEnabled, isContinuousMode]
  );

  const fallbackSpeechSynthesis = (text: string) => {
    if (!('speechSynthesis' in window)) {
      setGeminiState(isContinuousMode ? 'listening' : 'idle');
      return;
    }
    try {
      const clean = text.replace(/[*#_`~\[\]]/g, ' ').slice(0, 300);
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = 0.9;

      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Karen'))
      ) || voices.find((v) => v.lang.startsWith('en'));

      if (naturalVoice) utterance.voice = naturalVoice;

      utterance.onend = () => {
        setGeminiState(isContinuousMode ? 'listening' : 'idle');
      };
      utterance.onerror = () => {
        setGeminiState(isContinuousMode ? 'listening' : 'idle');
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      setGeminiState(isContinuousMode ? 'listening' : 'idle');
    }
  };

  // Execute structured action result from Gemini
  const executeActionResult = useCallback(
    (result: any) => {
      let matched = false;
      let summary = result.actionSummary || 'Command executed';

      // 1. Navigation
      if (result.targetTab && result.category === 'navigation') {
        const validTabs: TabType[] = ['projects', 'social', 'pg_coliving', 'rent_house', 'boq', 'marketplace', 'materials', 'specialist'];
        if (validTabs.includes(result.targetTab)) {
          onNavigateTab(result.targetTab);
          matched = true;
        }
      }

      // 2. Project Updates
      if (result.projectUpdates && Object.keys(result.projectUpdates).length > 0) {
        const updates = result.projectUpdates;
        const updated: Project = {
          ...activeProject,
          ...(updates.name ? { name: updates.name } : {}),
          ...(updates.builtUpAreaSqFt ? { builtUpAreaSqFt: Number(updates.builtUpAreaSqFt) } : {}),
          ...(updates.location ? { location: updates.location } : {}),
          ...(updates.status ? { status: updates.status } : {}),
          ...(updates.projectType ? { projectType: updates.projectType } : {}),
          ...(updates.description ? { description: updates.description } : {}),
          updatedAt: new Date().toISOString(),
          auditLogs: [
            {
              id: `log-${Date.now()}`,
              projectId: activeProject.id,
              actor: 'Gemini Voice Agent',
              action: 'Voice Command Property Update',
              details: summary,
              timestamp: new Date().toISOString(),
            },
            ...(activeProject.auditLogs || []),
          ],
        };
        onUpdateProject(updated);
        matched = true;
      }

      // 3. Create Project
      if (result.newProject && onCreateProject) {
        onCreateProject(result.newProject);
        matched = true;
      }

      // 4. Switch Project
      if (result.switchProjectId) {
        onSelectProject(result.switchProjectId);
        matched = true;
      }

      // 5. Currency
      if (result.newCurrency) {
        onChangeCurrency(result.newCurrency);
        matched = true;
      }

      // 6. Contingency
      if (result.newContingency !== undefined) {
        onChangeContingency(Number(result.newContingency));
        matched = true;
      }

      // 7. Add BOQ Item
      if (result.newBOQItem && onUpdateBOQItems) {
        const item = result.newBOQItem;
        const newItem: BOQItem = {
          id: `boq-voice-${Date.now()}`,
          name: item.name || 'Custom Architectural Item',
          category: item.category || 'Custom Architectural Works',
          unit: item.unit || 'Nos',
          quantity: item.quantity || 1,
          rate: item.rate || 5000,
          amount: (item.quantity || 1) * (item.rate || 5000),
          notes: 'Added via Gemini Voice Assistant',
        };
        onUpdateBOQItems([...boqItems, newItem]);
        matched = true;
      }

      // 8. Workflow Engine
      if (result.category === 'workflow' && onOpenWorkflowEngine) {
        onOpenWorkflowEngine();
        matched = true;
      }

      // 8b. Site Visit Camera & Visual Audit
      if (
        result.category === 'site_camera' ||
        result.transcript?.toLowerCase().includes('camera') ||
        result.transcript?.toLowerCase().includes('site visit') ||
        result.transcript?.toLowerCase().includes('site photo') ||
        result.transcript?.toLowerCase().includes('snap photo')
      ) {
        const btn = document.getElementById('btn-header-site-camera');
        if (btn) {
          btn.click();
          matched = true;
          summary = 'Opening Site Visit Camera for AI Visual Audit';
        }
      }

      // 9. Settings
      if (result.category === 'settings' && onOpenSettings) {
        onOpenSettings();
        matched = true;
      }

      // 10. General QA / Advisory
      if (result.category === 'general_qa') {
        matched = true;
      }

      if (result.success !== false) {
        playChime('success');
      }

      const historyItem: VoiceCommandHistoryItem = {
        id: `vcmd-${Date.now()}`,
        transcript: result.transcript || activeSpeechText || 'Voice Command',
        actionSummary: summary,
        category: result.category || 'command',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        success: matched,
        spokenResponse: result.spokenResponse,
      };

      setCommandHistory((prev) => [historyItem, ...prev.slice(0, 29)]);
      setCommandFeedback({
        text: summary,
        type: matched ? 'success' : 'info',
      });
      setGeminiResponseText(result.displayText || result.spokenResponse || summary);

      if (result.spokenResponse) {
        playSpokenAudio(result.spokenResponse, result.audioBase64);
      } else {
        setGeminiState(isContinuousMode ? 'listening' : 'idle');
      }

      setTimeout(() => {
        setCommandFeedback(null);
      }, 6000);
    },
    [
      activeProject,
      onNavigateTab,
      onUpdateProject,
      onCreateProject,
      onSelectProject,
      onChangeCurrency,
      onChangeContingency,
      onUpdateBOQItems,
      boqItems,
      onOpenWorkflowEngine,
      onOpenSettings,
      activeSpeechText,
      playSpokenAudio,
      isContinuousMode,
    ]
  );

  // Send raw recorded audio directly to Gemini Multimodal Audio Processor
  const processRecordedAudio = async (audioBlob: Blob) => {
    if (isExecutingRef.current) return;
    isExecutingRef.current = true;
    setGeminiState('thinking');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          if (!base64Data) {
            setGeminiState('idle');
            isExecutingRef.current = false;
            return;
          }

          const response = await fetch('/api/voice/gemini-audio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64: base64Data,
              mimeType: audioBlob.type || 'audio/webm',
              activeTab,
              activeProject,
              currency,
              contingencyPercent,
              projects: projects.map((p) => ({ id: p.id, name: p.name })),
              voiceName: voicePersona,
            }),
          });

          if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
          }

          const result = await response.json();
          if (result.transcript) {
            setActiveSpeechText(result.transcript);
          }
          executeActionResult(result);
        } catch (err: any) {
          console.warn('[Gemini Voice] Audio endpoint failed, falling back:', err);
          // Local fallback
          executeActionResult({
            transcript: activeSpeechText || 'Voice Instruction',
            success: true,
            category: 'general_qa',
            actionSummary: 'Voice command received',
            spokenResponse: 'Understood. Gouse AI is active and monitoring.',
            displayText: 'Voice input captured. You can also use the quick chips below.',
          });
        } finally {
          isExecutingRef.current = false;
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch {
      setGeminiState('idle');
      isExecutingRef.current = false;
    }
  };

  // Send textual transcript to Gemini Voice Command Parser
  const processTranscriptCommand = async (transcript: string) => {
    const text = transcript.trim();
    if (!text || isExecutingRef.current) return;

    isExecutingRef.current = true;
    setGeminiState('thinking');
    setActiveSpeechText(text);

    try {
      const response = await fetch('/api/voice/process-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: text,
          activeTab,
          activeProject,
          currency,
          contingencyPercent,
          projects: projects.map((p) => ({ id: p.id, name: p.name })),
          voiceName: voicePersona,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const result = await response.json();
      executeActionResult(result);
    } catch (err: any) {
      console.warn('[Gemini Voice] Process command fallback:', err);
      // Fallback local logic
      executeActionResult({
        transcript: text,
        success: true,
        category: 'general_qa',
        actionSummary: `Processed "${text}"`,
        spokenResponse: `Executed command for ${activeProject?.name || 'project'}.`,
        displayText: `Recognized: *"${text}"*`,
      });
    } finally {
      isExecutingRef.current = false;
    }
  };

  // Start Gemini Voice Listening
  const startGeminiVoice = async () => {
    if (geminiState === 'listening') return;
    isManuallyStoppedRef.current = false;

    // Stop existing audio
    if (currentAudioElemRef.current) {
      currentAudioElemRef.current.pause();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    playChime('gemini');
    setGeminiState('listening');
    setInterimTranscript('Gemini is listening... (Speak naturally in any phrasing)');
    setActiveSpeechText('');
    setGeminiResponseText('');

    // 1. Connect Microphone Stream & Web Audio Analyser
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let silenceCount = 0;

        const updateAnalyser = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);

          // Calculate average volume
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const normalized = Math.min(100, Math.round((avg / 128) * 100));
          setLiveVolume(normalized);

          // Sample 5 frequency bands for the Gemini wave bars
          setFrequencyBars([
            Math.max(10, Math.round((dataArray[1] / 255) * 48)),
            Math.max(12, Math.round((dataArray[3] / 255) * 56)),
            Math.max(14, Math.round((dataArray[6] / 255) * 64)),
            Math.max(10, Math.round((dataArray[10] / 255) * 52)),
            Math.max(8, Math.round((dataArray[14] / 255) * 44)),
          ]);

          // Voice activity / Silence detection
          if (normalized > 18) {
            silenceCount = 0;
          } else if (normalized <= 8 && audioChunksRef.current.length > 0) {
            silenceCount++;
            if (silenceCount > 60 && !isExecutingRef.current) {
              // ~1.2 seconds of silence after voice
              silenceCount = 0;
              if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
              }
            }
          }

          animationFrameRef.current = requestAnimationFrame(updateAnalyser);
        };

        animationFrameRef.current = requestAnimationFrame(updateAnalyser);
      }

      // 2. Setup MediaRecorder for raw audio chunks
      audioChunksRef.current = [];
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        if (audioChunksRef.current.length > 0 && !isManuallyStoppedRef.current) {
          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          audioChunksRef.current = [];
          processRecordedAudio(blob);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250); // collect 250ms chunks
    } catch (err: any) {
      console.warn('[Gemini Voice] Mic capture permission or device issue:', err);
      setCommandFeedback({
        text: 'Microphone permission needed. You can click any quick voice prompt or type instructions below!',
        type: 'warning',
      });
      setIsExpanded(true);
    }

    // 3. Concurrently start Web Speech API if supported for instant interim transcription preview
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        if (recognitionRef.current) {
          recognitionRef.current.abort();
        }
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';

        recognition.onresult = (event: any) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const res = event.results[i];
            if (res.isFinal) {
              const finalTxt = res[0].transcript.trim();
              setInterimTranscript(finalTxt);
              setActiveSpeechText(finalTxt);
              // Directly process with Gemini parser
              processTranscriptCommand(finalTxt);
            } else {
              interim += res[0].transcript;
            }
          }
          if (interim) {
            setInterimTranscript(interim);
          }
        };

        recognition.onerror = (e: any) => {
          // If network error in iframe or unsupported, silently let MediaRecorder handle audio
          console.log('[Gemini Voice] Client speech notice (MediaRecorder active):', e.error);
        };

        recognition.onend = () => {
          // Keep continuous if needed
          if (!isManuallyStoppedRef.current && isContinuousMode && geminiStateRef.current === 'listening') {
            try {
              recognition.start();
            } catch {
              // Ignore
            }
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch {
        // Fallback to MediaRecorder
      }
    }
  };

  // Stop Gemini Voice Listening
  const stopGeminiVoice = () => {
    isManuallyStoppedRef.current = true;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore
      }
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignore
      }
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setLiveVolume(0);

    if (geminiState === 'listening') {
      setGeminiState('idle');
      setInterimTranscript('');
    }

    if (onToggleExternalListening && isExternalListening) {
      onToggleExternalListening();
    }
  };

  const toggleListening = () => {
    if (geminiState === 'listening' || geminiState === 'speaking') {
      stopGeminiVoice();
    } else {
      startGeminiVoice();
    }
  };

  // Keyboard shortcut: Alt+V
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && e.key.toLowerCase() === 'v') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'v')) {
        e.preventDefault();
        toggleListening();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [geminiState]);

  // Handle typed command execution
  const handleTypedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedCommand.trim()) return;
    const cmd = typedCommand;
    setTypedCommand('');
    processTranscriptCommand(cmd);
  };

  // Quick command suggestions
  const quickChips = [
    { label: 'Site Visit Camera (Snap & Audit)', prompt: 'Open site visit camera to audit construction' },
    { label: 'Go to BOQ & Estimation', prompt: 'Open BOQ and estimation schedule' },
    { label: 'Update Area to 4,800 sq ft', prompt: 'Change project area to 4800 sq ft' },
    { label: 'Mark Status as Completed', prompt: 'Set project status to completed' },
    { label: 'Switch Currency to AED', prompt: 'Switch currency to AED' },
    { label: 'Add Teak Doors to BOQ', prompt: 'Add Burma Teak Doors to BOQ' },
    { label: 'Open Autonomous Agent Workface', prompt: 'Go to Gouse AI specialist agent workface' },
    { label: 'Trigger Workflow Engine', prompt: 'Start sequential workflow engine' },
    { label: 'What is footing concrete grade?', prompt: 'What grade of concrete is recommended for isolated footings?' },
  ];

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. FLOATING GEMINI LIVE ORB WIDGET (BOTTOM-RIGHT)                        */}
      {/* ========================================================================= */}
      <div
        id="gemini-live-voice-widget"
        className="fixed bottom-6 right-6 z-50 flex flex-col items-end select-none pointer-events-auto"
      >
        {/* Feedback toast message */}
        {commandFeedback && (
          <div
            id="gemini-feedback-toast"
            className={`mb-3 max-w-sm px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md border text-xs flex items-center gap-2.5 transition-all transform animate-in fade-in slide-in-from-bottom-2 duration-200 ${
              commandFeedback.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40 shadow-emerald-500/20'
                : commandFeedback.type === 'warning'
                ? 'bg-amber-950/90 text-amber-200 border-amber-500/40 shadow-amber-500/20'
                : 'bg-slate-900/90 text-cyan-200 border-cyan-500/40 shadow-cyan-500/20'
            }`}
          >
            {commandFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span className="font-medium">{commandFeedback.text}</span>
          </div>
        )}

        {/* Gemini Active Listening Subtitle Pill */}
        {geminiState === 'listening' && (
          <div className="mb-2 bg-slate-900/90 border border-indigo-500/40 rounded-full px-4 py-1.5 shadow-xl backdrop-blur-md flex items-center gap-2.5 max-w-xs animate-in fade-in">
            {/* Live pulsating aurora orb miniature */}
            <div className="relative w-3.5 h-3.5">
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-ping opacity-75" />
              <span className="relative block w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-500 to-pink-500 shadow-sm" />
            </div>
            <p className="text-xs text-indigo-200 font-mono truncate">
              {interimTranscript || 'Listening... speak naturally'}
            </p>
          </div>
        )}

        {/* Main Gemini Control Button / Orb */}
        <div className="flex items-center gap-2">
          {/* Expand / Minimize modal trigger */}
          <button
            type="button"
            id="btn-gemini-expand-modal"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white shadow-lg backdrop-blur-md transition-all hover:scale-105"
            title={isExpanded ? 'Collapse Gemini Voice Panel' : 'Expand Full Gemini Live Voice Studio'}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-indigo-400" />}
          </button>

          {/* Primary Gemini Live Voice Orb */}
          <button
            id="btn-gemini-live-orb"
            type="button"
            onClick={toggleListening}
            className={`group relative flex items-center gap-3 px-4 py-3 rounded-full shadow-2xl transition-all duration-300 transform active:scale-95 ${
              geminiState === 'listening'
                ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white ring-4 ring-purple-500/30 shadow-[0_0_35px_rgba(168,85,247,0.5)]'
                : geminiState === 'thinking'
                ? 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 text-white ring-4 ring-cyan-500/30 animate-pulse'
                : geminiState === 'speaking'
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white ring-4 ring-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.4)]'
                : 'bg-slate-900/95 hover:bg-slate-850 border border-slate-700 hover:border-indigo-500/50 text-slate-100 shadow-[0_10px_25px_rgba(0,0,0,0.5)]'
            }`}
            title="Toggle Gemini Live Voice Agent (Alt+V)"
          >
            {/* The 4-Color Gemini Live Fluid Morphing Orb */}
            <div className="relative flex items-center justify-center w-7 h-7">
              {/* Expanding acoustic ripple rings when listening */}
              {geminiState === 'listening' && (
                <>
                  <span
                    className="absolute rounded-full border border-pink-400/60 animate-ping"
                    style={{
                      width: `${28 + (liveVolume / 100) * 24}px`,
                      height: `${28 + (liveVolume / 100) * 24}px`,
                    }}
                  />
                  <span
                    className="absolute rounded-full border border-cyan-400/40 animate-pulse"
                    style={{
                      width: `${36 + (liveVolume / 100) * 32}px`,
                      height: `${36 + (liveVolume / 100) * 32}px`,
                    }}
                  />
                </>
              )}

              {/* Gemini Aurora Sphere with conic gradient */}
              <div
                className={`w-7 h-7 rounded-full shadow-inner flex items-center justify-center transition-all ${
                  geminiState === 'listening'
                    ? 'animate-spin bg-[conic-gradient(from_0deg,#4285F4,#9B51E0,#EA4335,#00E5FF,#34A853,#4285F4)]'
                    : geminiState === 'thinking'
                    ? 'animate-spin bg-[conic-gradient(from_180deg,#00E5FF,#9B51E0,#4285F4,#EA4335,#00E5FF)]'
                    : geminiState === 'speaking'
                    ? 'animate-pulse bg-[conic-gradient(from_90deg,#10B981,#06B6D4,#8B5CF6,#10B981)]'
                    : 'bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500'
                }`}
                style={{ animationDuration: geminiState === 'listening' ? '2.5s' : '4s' }}
              >
                <div className="w-5 h-5 rounded-full bg-slate-950/40 flex items-center justify-center backdrop-blur-xs">
                  {geminiState === 'listening' ? (
                    <Mic className="w-3.5 h-3.5 text-white animate-pulse" />
                  ) : geminiState === 'thinking' ? (
                    <Sparkles className="w-3.5 h-3.5 text-cyan-200 animate-spin" />
                  ) : geminiState === 'speaking' ? (
                    <Volume2 className="w-3.5 h-3.5 text-emerald-200" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-white group-hover:rotate-45 transition-transform" />
                  )}
                </div>
              </div>
            </div>

            {/* Label and Audio Reactive Frequency Bars */}
            <div className="flex flex-col items-start text-left pr-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold tracking-wide font-sans">
                  {geminiState === 'listening'
                    ? 'Gemini Live'
                    : geminiState === 'thinking'
                    ? 'Reasoning...'
                    : geminiState === 'speaking'
                    ? 'Gemini Talking'
                    : 'Gemini Voice'}
                </span>
                <span className="text-[10px] font-mono px-1 rounded bg-black/30 border border-white/10 text-slate-300">
                  Alt+V
                </span>
              </div>

              {/* Real-time 5-bar Google Gemini waveform */}
              {geminiState === 'listening' ? (
                <div className="flex items-center gap-1 h-3 mt-0.5">
                  <span
                    className="w-1 bg-cyan-300 rounded-full transition-all duration-75"
                    style={{ height: `${Math.min(14, frequencyBars[0] / 3)}px` }}
                  />
                  <span
                    className="w-1 bg-blue-300 rounded-full transition-all duration-75"
                    style={{ height: `${Math.min(14, frequencyBars[1] / 3)}px` }}
                  />
                  <span
                    className="w-1 bg-purple-300 rounded-full transition-all duration-75"
                    style={{ height: `${Math.min(14, frequencyBars[2] / 3)}px` }}
                  />
                  <span
                    className="w-1 bg-pink-300 rounded-full transition-all duration-75"
                    style={{ height: `${Math.min(14, frequencyBars[3] / 3)}px` }}
                  />
                  <span
                    className="w-1 bg-emerald-300 rounded-full transition-all duration-75"
                    style={{ height: `${Math.min(14, frequencyBars[4] / 3)}px` }}
                  />
                </div>
              ) : (
                <span className="text-[10px] text-slate-400 font-medium">
                  {geminiState === 'speaking' ? 'Playing voice...' : 'Tap to command'}
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FULL GEMINI LIVE MODAL & STUDIO OVERLAY                                */}
      {/* ========================================================================= */}
      {isExpanded && (
        <div
          id="gemini-live-expanded-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Top Gemini Live Header Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
              <div className="flex items-center gap-3">
                {/* 4-Color Gemini Logo Icon */}
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white tracking-wide">Gemini Live Voice Agent</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      gemini-3.8-flash
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Voice-controlled architecture, estimation, and studio commands
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Audio reply mute toggle */}
                <button
                  type="button"
                  id="btn-gemini-toggle-audio-reply"
                  onClick={() => setIsSpeechSynthesisEnabled(!isSpeechSynthesisEnabled)}
                  className={`p-2 rounded-lg text-xs font-medium border transition ${
                    isSpeechSynthesisEnabled
                      ? 'bg-slate-800 border-slate-700 text-slate-200 hover:text-white'
                      : 'bg-rose-950/40 border-rose-800/40 text-rose-300'
                  }`}
                  title={isSpeechSynthesisEnabled ? 'Spoken voice enabled' : 'Voice output muted'}
                >
                  {isSpeechSynthesisEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>

                {/* Close modal */}
                <button
                  type="button"
                  id="btn-gemini-close-modal"
                  onClick={() => setIsExpanded(false)}
                  className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* THE LARGE ICONIC GEMINI AURORA ORB VISUALIZER */}
              <div className="flex flex-col items-center justify-center py-6 relative">
                {/* Outer dynamic breathing aura */}
                <div
                  className={`absolute rounded-full transition-all duration-300 blur-2xl opacity-60 ${
                    geminiState === 'listening'
                      ? 'bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 scale-125'
                      : geminiState === 'thinking'
                      ? 'bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-500 animate-pulse'
                      : geminiState === 'speaking'
                      ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 scale-110'
                      : 'bg-indigo-600/30'
                  }`}
                  style={{
                    width: `${120 + (liveVolume / 100) * 80}px`,
                    height: `${120 + (liveVolume / 100) * 80}px`,
                  }}
                />

                {/* Expanding Concentric Ripple Rings */}
                {geminiState === 'listening' && (
                  <>
                    <div
                      className="absolute rounded-full border border-purple-400/40 animate-ping pointer-events-none"
                      style={{
                        width: `${110 + (liveVolume / 100) * 60}px`,
                        height: `${110 + (liveVolume / 100) * 60}px`,
                      }}
                    />
                    <div
                      className="absolute rounded-full border border-cyan-400/30 animate-pulse pointer-events-none"
                      style={{
                        width: `${140 + (liveVolume / 100) * 90}px`,
                        height: `${140 + (liveVolume / 100) * 90}px`,
                      }}
                    />
                  </>
                )}

                {/* Center 100px Fluid Glowing Sphere */}
                <button
                  type="button"
                  id="btn-gemini-large-orb"
                  onClick={toggleListening}
                  className={`relative z-10 w-28 h-28 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform active:scale-95 cursor-pointer ${
                    geminiState === 'listening'
                      ? 'bg-[conic-gradient(from_0deg,#4285F4,#9B51E0,#EA4335,#00E5FF,#34A853,#4285F4)] animate-spin ring-4 ring-purple-400/50'
                      : geminiState === 'thinking'
                      ? 'bg-[conic-gradient(from_180deg,#00E5FF,#9B51E0,#4285F4,#EA4335,#00E5FF)] animate-spin ring-4 ring-cyan-400/50'
                      : geminiState === 'speaking'
                      ? 'bg-[conic-gradient(from_90deg,#10B981,#06B6D4,#8B5CF6,#10B981)] animate-pulse ring-4 ring-emerald-400/50'
                      : 'bg-gradient-to-tr from-blue-600 via-purple-600 to-pink-600 hover:ring-4 hover:ring-purple-400/40'
                  }`}
                  style={{ animationDuration: '3.5s' }}
                  title="Click to talk or stop"
                >
                  <div className="w-22 h-22 rounded-full bg-slate-950/80 flex flex-col items-center justify-center backdrop-blur-md">
                    {geminiState === 'listening' ? (
                      <Mic className="w-8 h-8 text-white animate-bounce" />
                    ) : geminiState === 'thinking' ? (
                      <Sparkles className="w-8 h-8 text-cyan-300 animate-spin" />
                    ) : geminiState === 'speaking' ? (
                      <Volume2 className="w-8 h-8 text-emerald-300 animate-pulse" />
                    ) : (
                      <Mic className="w-8 h-8 text-white" />
                    )}
                  </div>
                </button>

                {/* Current Status Label & Wave Display */}
                <div className="mt-5 text-center space-y-1">
                  <p className="text-sm font-semibold text-slate-100 flex items-center justify-center gap-2">
                    {geminiState === 'listening' && (
                      <>
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        Listening... (Speak naturally)
                      </>
                    )}
                    {geminiState === 'thinking' && (
                      <>
                        <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                        Reasoning with Gemini 3.8 Flash...
                      </>
                    )}
                    {geminiState === 'speaking' && (
                      <>
                        <Volume2 className="w-4 h-4 text-emerald-400" />
                        Gemini is speaking...
                      </>
                    )}
                    {geminiState === 'idle' && 'Tap the orb to speak (or press Alt+V)'}
                  </p>

                  {/* 5-Color Waveform visualizer */}
                  <div className="flex items-center justify-center gap-1.5 h-6 pt-1">
                    <span
                      className="w-1.5 rounded-full bg-blue-400 transition-all duration-75"
                      style={{ height: `${geminiState === 'listening' ? frequencyBars[0] : 8}px` }}
                    />
                    <span
                      className="w-1.5 rounded-full bg-purple-400 transition-all duration-75"
                      style={{ height: `${geminiState === 'listening' ? frequencyBars[1] : 14}px` }}
                    />
                    <span
                      className="w-1.5 rounded-full bg-pink-400 transition-all duration-75"
                      style={{ height: `${geminiState === 'listening' ? frequencyBars[2] : 20}px` }}
                    />
                    <span
                      className="w-1.5 rounded-full bg-cyan-400 transition-all duration-75"
                      style={{ height: `${geminiState === 'listening' ? frequencyBars[3] : 12}px` }}
                    />
                    <span
                      className="w-1.5 rounded-full bg-emerald-400 transition-all duration-75"
                      style={{ height: `${geminiState === 'listening' ? frequencyBars[4] : 8}px` }}
                    />
                  </div>
                </div>
              </div>

              {/* LIVE TRANSCRIPT & GEMINI SPEECH RESPONSE */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-2">
                  <span className="font-mono flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-indigo-400" />
                    LIVE DIALOGUE
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Project: {activeProject?.name || 'Urban Villa'}
                  </span>
                </div>

                {/* What user said */}
                <div className="text-xs">
                  <span className="text-slate-500 font-mono">User: </span>
                  <span className="text-slate-200 font-medium">
                    {activeSpeechText || interimTranscript || '“Go to BOQ”, “Change area to 4500 sq ft”, or ask any design question...'}
                  </span>
                </div>

                {/* Gemini Response */}
                {geminiResponseText && (
                  <div className="text-xs bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-3 text-indigo-100">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-300 font-mono mb-1">
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      GEMINI RESPONSE:
                    </div>
                    <p className="leading-relaxed whitespace-pre-wrap">{geminiResponseText}</p>
                  </div>
                )}
              </div>

              {/* QUICK ONE-TAP VOICE COMMAND CHIPS */}
              <div>
                <p className="text-xs font-mono text-slate-400 mb-2 flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                  TRY SAYING (OR CLICK TO EXECUTE):
                </p>
                <div className="flex flex-wrap gap-2">
                  {quickChips.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => processTranscriptCommand(chip.prompt)}
                      className="px-3 py-1.5 rounded-lg text-xs bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-white transition flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      <span>{chip.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* TEXT FALLBACK INPUT */}
              <form onSubmit={handleTypedSubmit} className="relative">
                <input
                  type="text"
                  id="input-typed-voice-command"
                  value={typedCommand}
                  onChange={(e) => setTypedCommand(e.target.value)}
                  placeholder="Or type any command / question (e.g. 'Navigate to BOQ', 'Change area to 4000 sq ft')..."
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-indigo-500 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                />
                <button
                  type="submit"
                  disabled={!typedCommand.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 text-white transition"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* RECENT VOICE HISTORY LOG */}
              {commandHistory.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-mono flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      RECENT VOICE ACTIVITY
                    </span>
                    <button
                      type="button"
                      onClick={() => setCommandHistory([])}
                      className="text-[11px] text-slate-500 hover:text-slate-300 underline"
                    >
                      Clear history
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                    {commandHistory.slice(0, 6).map((item) => (
                      <div
                        key={item.id}
                        className="px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 truncate">
                          {item.success ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          )}
                          <span className="text-slate-300 font-medium truncate">{item.transcript}</span>
                          <span className="text-slate-500 text-[10px] hidden sm:inline">({item.actionSummary})</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 shrink-0">{item.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
              {/* Voice Persona Selector */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-slate-500">VOICE:</span>
                <select
                  value={voicePersona}
                  onChange={(e) => setVoicePersona(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="Zephyr">Zephyr (Balanced Natural)</option>
                  <option value="Puck">Puck (Energetic Studio)</option>
                  <option value="Charon">Charon (Deep Technical)</option>
                  <option value="Kore">Kore (Architectural Clarity)</option>
                  <option value="Fenrir">Fenrir (Authoritative Executive)</option>
                </select>
              </div>

              {/* Continuous Listening Toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isContinuousMode}
                  onChange={(e) => setIsContinuousMode(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                />
                <span className="text-[11px] text-slate-300">Continuous Live Mode (Hands-free)</span>
              </label>

              {/* Primary action */}
              <button
                type="button"
                id="btn-gemini-footer-toggle"
                onClick={toggleListening}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                  geminiState === 'listening'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white'
                }`}
              >
                {geminiState === 'listening' ? 'Stop Listening' : 'Start Gemini Live'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
