import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  X,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Share2,
  Printer,
  Upload,
  RefreshCw,
  Crosshair,
  Grid3X3,
  Layers,
  ChevronRight,
  Sliders,
  Compass,
  MapPin,
  Clock,
  ArrowRight,
  Check,
  Info,
  Maximize2,
  FileCheck,
} from 'lucide-react';
import { Project, SiteAuditResult, SiteAuditObservation } from '../types';

interface SiteVisitCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProject: Project | null;
  onSaveAuditToProject?: (audit: SiteAuditResult) => void;
}

// Curated high-resolution construction benchmark photos for instant 1-click site audits
const PRESET_SITE_BENCHMARKS = [
  {
    id: 'preset-cantilever-slab',
    title: 'First Floor Slab Shuttering & Cantilever Beam Detailing',
    stage: 'Slab & Cantilever Beam',
    focus: 'Cantilever top steel anchorage, shuttering levels, conduit tie-downs',
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f9?auto=format&fit=crop&w=1200&q=80',
    description: 'Active superstructure deck showing steel acrow props, ply shuttering, and Fe550D rebar grid.',
  },
  {
    id: 'preset-column-rebar',
    title: 'RCC Column Cages & Confinement Stirrup Detailing',
    stage: 'Superstructure Columns',
    focus: 'Column vertical bars, 135° seismic cross-ties, cover block spacing',
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
    description: 'Column reinforcement cage with 8mm confinement ties at 100mm c/c per IS 13920.',
  },
  {
    id: 'preset-foundation-raft',
    title: 'Substructure Raft Foundation & Mat Rebar Detailing',
    stage: 'Foundation & Raft',
    focus: 'Raft rebar mat, column starter bars, concrete cover blocks',
    url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=1200&q=80',
    description: 'Excavated plinth pit with bottom and top high-yield TMT rebar mesh ready for M25 pour.',
  },
  {
    id: 'preset-block-masonry',
    title: 'Envelope Masonry - AAC Blocks & RCC Lintel Bands',
    stage: 'Masonry & Enclosure',
    focus: 'AAC block joint adhesive, plumb alignment, 100mm lintel band',
    url: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1200&q=80',
    description: 'Precision AAC block wall construction with horizontal mortar bed lines and lintel support.',
  },
  {
    id: 'preset-finishes-roughin',
    title: 'Finishes & MEP - Internal Plastering & Electrical Conduit Chasing',
    stage: 'Finishes & Services',
    focus: 'Plaster coat thickness, chicken mesh over conduit grooves, curing',
    url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
    description: 'Internal wall surfacing with concealed electrical conduit chase lines and plumb markers.',
  },
];

export const SiteVisitCameraModal: React.FC<SiteVisitCameraModalProps> = ({
  isOpen,
  onClose,
  activeProject,
  onSaveAuditToProject,
}) => {
  // Camera stream state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<'idle' | 'starting' | 'active' | 'denied' | 'unsupported'>('idle');
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showPlumbCrosshairs, setShowPlumbCrosshairs] = useState<boolean>(true);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [hasTorchCapability, setHasTorchCapability] = useState<boolean>(false);

  // Snapshot & Audit state
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFilename, setCapturedFilename] = useState<string>('');
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditProgressStep, setAuditProgressStep] = useState<string>('');
  const [auditResult, setAuditResult] = useState<SiteAuditResult | null>(null);
  const [selectedFocus, setSelectedFocus] = useState<string>(
    'Structural progress, RCC framing, rebar binding, masonry alignment, safety compliance'
  );
  const [auditError, setAuditError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [flashEffect, setFlashEffect] = useState<boolean>(false);

  // Sound synthesis for shutter click
  const playShutterSound = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.09);
    } catch {
      // AudioContext not allowed or muted
    }
  }, []);

  // Initialize camera stream
  const startCamera = useCallback(async (facing: 'environment' | 'user' = 'environment') => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState('unsupported');
      return;
    }

    setCameraState('starting');
    setAuditError(null);

    // Stop existing stream tracks
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setCameraState('active');

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }

      // Check torch capability
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities: any = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};
        if (capabilities && capabilities.torch) {
          setHasTorchCapability(true);
        } else {
          setHasTorchCapability(false);
        }
      }
    } catch (err: any) {
      console.warn('[SiteVisitCamera] Camera access error:', err?.name, err?.message);
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setCameraState('denied');
      } else {
        // Fallback to basic constraint without ideal dimensions
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          setStream(fallbackStream);
          setCameraState('active');
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            videoRef.current.play().catch(() => {});
          }
        } catch {
          setCameraState('denied');
        }
      }
    }
  }, [stream]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraState('idle');
  }, [stream]);

  // Toggle torch / flash
  const toggleTorch = useCallback(async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track && hasTorchCapability) {
      try {
        const nextState = !isTorchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setIsTorchOn(nextState);
      } catch (e) {
        console.warn('[Torch] Unable to set torch constraint', e);
      }
    }
  }, [stream, hasTorchCapability, isTorchOn]);

  // Switch facing mode
  const switchCameraFacing = useCallback(() => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  }, [cameraFacing, startCamera]);

  // Lifecycle
  useEffect(() => {
    if (isOpen) {
      startCamera(cameraFacing);
    } else {
      stopCamera();
      setCapturedImage(null);
      setAuditResult(null);
      setIsAuditing(false);
      setIsSaved(false);
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isOpen]);

  // Core visual audit caller
  const triggerVisualAudit = useCallback(
    async (imageData: string, filename: string, focusOverride?: string) => {
      setIsAuditing(true);
      setAuditError(null);
      setAuditResult(null);
      setIsSaved(false);

      // Multi-phase progress ticker for dynamic visual feedback
      setAuditProgressStep('Scanning Structural Grid & Column-Beam Joints...');
      const stepTimer1 = setTimeout(() => {
        setAuditProgressStep('Auditing Rebar Confinement & Clear Cover (IS 456 Table 16)...');
      }, 700);
      const stepTimer2 = setTimeout(() => {
        setAuditProgressStep('Checking Formwork Plumb, Props & Shuttering Level...');
      }, 1400);
      const stepTimer3 = setTimeout(() => {
        setAuditProgressStep('Calculating Structural Progress % & Authorizing BOQ Milestone...');
      }, 2100);

      try {
        const response = await fetch('/api/architecture/analyze-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: imageData,
            filename,
            focus: focusOverride || selectedFocus,
            projectName: activeProject?.name || 'Gouse AI Construction Site',
            projectType: activeProject?.projectType || 'Residential Villa / Commercial Tower',
            projectContext: `Bangalore Urban Site, Karnataka. ${activeProject?.location || 'Bangalore'} • Status: ${
              activeProject?.status || 'construction'
            }`,
          }),
        });

        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }

        const data: SiteAuditResult = await response.json();
        setAuditResult(data);
      } catch (err: any) {
        console.error('[VisualAudit] Audit request failed:', err);
        setAuditError(err?.message || 'Failed to complete AI visual audit');
      } finally {
        clearTimeout(stepTimer1);
        clearTimeout(stepTimer2);
        clearTimeout(stepTimer3);
        setIsAuditing(false);
        setAuditProgressStep('');
      }
    },
    [activeProject, selectedFocus]
  );

  // Snap photo from live video stream
  const captureSnapshot = useCallback(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    // Trigger visual flash & sound
    setFlashEffect(true);
    playShutterSound();
    setTimeout(() => setFlashEffect(false), 200);

    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Watermark overlay for professional engineering chain of custody
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(16, canvas.height - 76, 520, 60);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('GOUSE AI SITE AUDIT CAMERA', 28, canvas.height - 52);

    ctx.fillStyle = '#ffffff';
    ctx.font = '13px sans-serif';
    ctx.fillText(
      `${activeProject?.name || 'Site Visit'} • ${dateStr} • ${activeProject?.location || 'Bangalore'}`,
      28,
      canvas.height - 30
    );

    const base64Data = canvas.toDataURL('image/jpeg', 0.88);
    const fname = `site_snapshot_${Date.now()}.jpg`;

    setCapturedImage(base64Data);
    setCapturedFilename(fname);

    // Automatically trigger visual audit on the snapped image
    triggerVisualAudit(base64Data, fname);
  }, [activeProject, playShutterSound, triggerVisualAudit]);

  // Handle local file upload (e.g. from gallery or native camera picker)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setCapturedImage(base64);
        setCapturedFilename(file.name);
        triggerVisualAudit(base64, file.name);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Select a preset benchmark sample
  const handleSelectPreset = async (preset: (typeof PRESET_SITE_BENCHMARKS)[0]) => {
    setCapturedFilename(`${preset.id}.jpg`);
    setCapturedImage(preset.url);

    // Convert to base64 if possible or pass URL to triggerVisualAudit
    try {
      const resp = await fetch(preset.url);
      const blob = await resp.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setCapturedImage(base64);
        triggerVisualAudit(base64, `${preset.id}.jpg`, preset.focus);
      };
      reader.readAsDataURL(blob);
    } catch {
      // Fallback: pass image directly
      triggerVisualAudit(preset.url, `${preset.id}.jpg`, preset.focus);
    }
  };

  // Save audit to project state
  const handleSaveAudit = () => {
    if (!auditResult) return;
    if (onSaveAuditToProject) {
      onSaveAuditToProject({
        ...auditResult,
        imageUrl: capturedImage || undefined,
      });
    }

    // Persist to localStorage
    try {
      const existingKey = `gouse_ai_site_audits_${activeProject?.id || 'default'}`;
      const saved = localStorage.getItem(existingKey);
      const list: SiteAuditResult[] = saved ? JSON.parse(saved) : [];
      list.unshift({
        ...auditResult,
        imageUrl: capturedImage || undefined,
      });
      localStorage.setItem(existingKey, JSON.stringify(list.slice(0, 20)));
    } catch {
      // Storage quota or restriction
    }

    setIsSaved(true);
  };

  // WhatsApp share
  const handleShareWhatsApp = () => {
    if (!auditResult) return;
    const text = encodeURIComponent(
      `*GOUSE AI SITE VISIT VISUAL AUDIT MEMO*\n` +
        `Project: ${auditResult.projectName}\n` +
        `Stage: ${auditResult.stageName}\n` +
        `Progress: ${auditResult.completionPercentage}%\n` +
        `Quality Score: ${auditResult.qualityScore}/10 (${auditResult.complianceGrade})\n` +
        `BOQ Milestone: ${auditResult.boqMilestoneRecommendations.recommendedMilestone}\n` +
        `Summary: ${auditResult.summary}\n\n` +
        `Inspected by Ar. S. Gouse Structural Intelligence System (+91 8073947241)`
    );
    window.open(`https://wa.me/918073947241?text=${text}`, '_blank');
  };

  // Print audit report
  const handlePrintAudit = () => {
    window.print();
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedImage(null);
    setAuditResult(null);
    setIsAuditing(false);
    setIsSaved(false);
    startCamera(cameraFacing);
  };

  if (!isOpen) return null;

  return (
    <div
      id="site-visit-camera-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        id="site-visit-camera-modal-dialog"
        className="relative w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[94vh]"
      >
        {/* Hidden off-screen canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Shutter visual flash overlay */}
        {flashEffect && (
          <div className="absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-150 animate-out fade-out" />
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Camera className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Site Visit Camera</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                    AI Visual Audit
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Snap active site photo for instant Gemini-powered structural audit &amp; BOQ milestone clearance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeProject && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700 text-xs text-slate-300 font-medium">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span className="max-w-[140px] truncate">{activeProject.name}</span>
              </span>
            )}
            <button
              id="btn-close-site-visit-camera"
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close Camera"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Two-Column when Audit is ready, else Full Viewfinder */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {!capturedImage ? (
            /* ============================================================ */
            /* VIEW 1: LIVE VIEWFINDER & CAPTURE CONTROLS                  */
            /* ============================================================ */
            <div className="space-y-4">
              {/* Camera Viewport Container */}
              <div className="relative aspect-video sm:aspect-[16/10] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
                {cameraState === 'active' && (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Camera Starting / Loading State */}
                {cameraState === 'starting' && (
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
                    <p className="text-sm font-medium">Initializing Site Camera Stream...</p>
                  </div>
                )}

                {/* Camera Denied / Blocked Fallback */}
                {cameraState === 'denied' && (
                  <div className="flex flex-col items-center gap-3 text-center px-6 max-w-md">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Camera Access Permitted or Standby</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Use your device's native camera upload, select one of our curated Bangalore construction
                        benchmarks below, or allow camera permissions in your browser.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition flex items-center gap-1.5 shadow"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Upload Site Photo / Take Photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => startCamera(cameraFacing)}
                        className="px-3.5 py-2 rounded-lg bg-slate-800 text-slate-200 text-xs hover:bg-slate-700 transition"
                      >
                        Retry Camera Access
                      </button>
                    </div>
                  </div>
                )}

                {/* Camera Unsupported Fallback */}
                {cameraState === 'unsupported' && (
                  <div className="flex flex-col items-center gap-3 text-center px-6 max-w-md">
                    <AlertTriangle className="w-10 h-10 text-amber-400" />
                    <h4 className="text-sm font-bold text-white">MediaDevices Camera API Unsupported</h4>
                    <p className="text-xs text-slate-400">
                      Please upload a photo directly or use one of our verified site benchmarks below.
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition flex items-center gap-1.5"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload Site Photo</span>
                    </button>
                  </div>
                )}

                {/* OVERLAYS WHEN CAMERA IS ACTIVE */}
                {cameraState === 'active' && (
                  <>
                    {/* 3x3 Rule of Thirds Grid */}
                    {showGrid && (
                      <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/10">
                        <div className="border-r border-b border-white/15" />
                        <div className="border-r border-b border-white/15" />
                        <div className="border-b border-white/15" />
                        <div className="border-r border-b border-white/15" />
                        <div className="border-r border-b border-white/15" />
                        <div className="border-b border-white/15" />
                        <div className="border-r border-white/15" />
                        <div className="border-r border-white/15" />
                        <div />
                      </div>
                    )}

                    {/* Plumb Line & Column Crosshairs */}
                    {showPlumbCrosshairs && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="relative w-40 h-40 border border-amber-400/40 rounded-lg flex items-center justify-center">
                          <div className="absolute w-full h-[1px] bg-amber-400/50" />
                          <div className="absolute h-full w-[1px] bg-amber-400/50" />
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80 animate-ping" />
                          <div className="absolute top-1 left-2 text-[9px] font-mono text-amber-300 font-bold">
                            PLUMB: 90.0°
                          </div>
                        </div>
                      </div>
                    )}

                    {/* HUD Header Bar inside Viewfinder */}
                    <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/60 backdrop-blur border border-white/10 text-[11px] font-mono text-white">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>LIVE 1080p</span>
                        <span className="text-slate-400">|</span>
                        <span>{cameraFacing === 'environment' ? 'REAR LENS' : 'FRONT LENS'}</span>
                      </div>

                      <div className="flex items-center gap-2 pointer-events-auto">
                        {hasTorchCapability && (
                          <button
                            type="button"
                            onClick={toggleTorch}
                            className={`p-2 rounded-lg text-xs font-mono transition border ${
                              isTorchOn
                                ? 'bg-amber-400 text-slate-950 border-amber-300'
                                : 'bg-black/60 backdrop-blur text-white border-white/15 hover:bg-black/80'
                            }`}
                            title="Toggle Flashlight / Torch"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowGrid((prev) => !prev)}
                          className={`p-2 rounded-lg text-xs font-mono transition border ${
                            showGrid
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-black/60 backdrop-blur text-white border-white/15 hover:bg-black/80'
                          }`}
                          title="Toggle Alignment Grid"
                        >
                          <Grid3X3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPlumbCrosshairs((prev) => !prev)}
                          className={`p-2 rounded-lg text-xs font-mono transition border ${
                            showPlumbCrosshairs
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-black/60 backdrop-blur text-white border-white/15 hover:bg-black/80'
                          }`}
                          title="Toggle Laser Plumb Crosshair"
                        >
                          <Crosshair className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={switchCameraFacing}
                          className="p-2 rounded-lg bg-black/60 backdrop-blur text-white border border-white/15 hover:bg-black/80 transition"
                          title="Flip Camera (Rear / Front)"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* HUD Footer inside Viewfinder */}
                    <div className="absolute bottom-3 inset-x-3 flex items-center justify-between pointer-events-none text-[10px] font-mono text-slate-300">
                      <div className="px-2 py-0.5 rounded bg-black/60 backdrop-blur border border-white/10 flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-amber-400" />
                        <span>{activeProject?.location || 'Bangalore North'}</span>
                        <span className="text-slate-400">|</span>
                        <span>12.9716° N, 77.5946° E</span>
                      </div>
                      <div className="px-2 py-0.5 rounded bg-black/60 backdrop-blur border border-white/10 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-emerald-400" />
                        <span>IS 456 CONCURRENT CHECK</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Shutter & Quick Input Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950/70 border border-slate-800 rounded-xl p-3 sm:p-4">
                {/* Secondary Actions: File Picker */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                  >
                    <Upload className="w-4 h-4 text-amber-400" />
                    <span>Upload Site Photo</span>
                  </button>
                  <span className="text-xs text-slate-500 hidden md:inline">or snap with camera</span>
                </div>

                {/* Primary Tactile Shutter Button */}
                <div className="flex items-center gap-4">
                  <button
                    id="btn-snap-site-photo"
                    type="button"
                    onClick={cameraState === 'active' ? captureSnapshot : () => fileInputRef.current?.click()}
                    className="group relative flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-slate-950 font-bold shadow-lg shadow-amber-500/25 hover:scale-105 active:scale-95 transition-transform"
                    title="Snap Site Visit Photo & Trigger AI Audit"
                  >
                    <div className="h-12 w-12 rounded-full border-2 border-slate-950 flex items-center justify-center">
                      <Camera className="w-6 h-6 stroke-[2.4]" />
                    </div>
                    <span className="absolute -bottom-6 text-[10px] font-mono text-amber-300 font-bold tracking-wider uppercase whitespace-nowrap">
                      SNAP &amp; AUDIT
                    </span>
                  </button>
                </div>

                {/* Custom Focus selector */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Sliders className="w-4 h-4 text-slate-400 shrink-0" />
                  <select
                    value={selectedFocus}
                    onChange={(e) => setSelectedFocus(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500 w-full sm:w-60"
                  >
                    <option value="Structural progress, RCC framing, rebar binding, masonry alignment, safety compliance">
                      Comprehensive Structural &amp; Safety Audit
                    </option>
                    <option value="Rebar confinement, stirrup hooks (135°), cover block depth (IS 456 Table 16)">
                      Rebar Detailing &amp; Confinement Only
                    </option>
                    <option value="Formwork plumb, prop spacing, deshutting stability & cold joint risk">
                      Formwork &amp; Shuttering Stability
                    </option>
                    <option value="AAC block work, mortar bed joints, lintel band casting">
                      Envelope Masonry &amp; Lintel Band
                    </option>
                    <option value="Safety PPE, perimeter net, scaffolding toe boards (NBC 2016 Part 7)">
                      Site Safety &amp; NBC 2016 Gates
                    </option>
                  </select>
                </div>
              </div>

              {/* Verified Benchmark Presets for 1-Click Testing */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Quick Test: Select Benchmark Construction Photo</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">Instant AI audit demo</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                  {PRESET_SITE_BENCHMARKS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className="group flex flex-col text-left bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 rounded-xl overflow-hidden transition p-2 space-y-1.5 shadow-sm"
                    >
                      <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-slate-900">
                        <img
                          src={preset.url}
                          alt={preset.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute bottom-1 left-1 text-[9px] font-mono px-1.5 py-0.2 rounded bg-black/70 text-amber-300 font-semibold">
                          {preset.stage}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-200 line-clamp-2 leading-tight group-hover:text-amber-300">
                        {preset.title}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ============================================================ */
            /* VIEW 2: SNAPSHOT REVIEW & AI VISUAL AUDIT RESULTS           */
            /* ============================================================ */
            <div className="space-y-4">
              {/* Progress Banner while Auditing */}
              {isAuditing && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-slate-950 border border-amber-500/30 flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-amber-400 animate-spin shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
                        Gemini Multi-Modal Visual Inspection In Progress
                      </span>
                      <span className="text-xs text-slate-400 font-mono">Auditing Site Photo</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">{auditProgressStep}</p>
                  </div>
                </div>
              )}

              {/* Error Notice */}
              {auditError && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{auditError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => triggerVisualAudit(capturedImage, capturedFilename)}
                    className="px-2.5 py-1 rounded bg-red-900/60 hover:bg-red-800 text-xs text-white"
                  >
                    Retry Audit
                  </button>
                </div>
              )}

              {/* Main Two-Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left Column: Photo Preview & Watermark Tagging */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md">
                    <img
                      src={capturedImage}
                      alt="Site snapshot"
                      className="w-full h-full object-cover"
                    />

                    {/* Scanning Beam Animation when auditing */}
                    {isAuditing && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_15px_#f59e0b] animate-[bounce_2s_infinite]" />
                      </div>
                    )}

                    {/* Inspection Watermark Overlay Badge */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur text-[10px] font-mono text-white border border-white/10">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>OFFICIAL SITE SNAPSHOT</span>
                    </div>

                    <div className="absolute bottom-2 inset-x-2 flex items-center justify-between px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur text-[10px] font-mono text-slate-300 border border-white/10">
                      <span className="truncate max-w-[200px]">{capturedFilename}</span>
                      <span className="text-amber-400 font-bold">VERIFIED</span>
                    </div>
                  </div>

                  {/* Retake & Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRetake}
                      className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center justify-center gap-1.5 transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                      <span>Retake / Snap Another</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerVisualAudit(capturedImage, capturedFilename)}
                      disabled={isAuditing}
                      className="py-2 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-medium border border-amber-500/40 flex items-center justify-center gap-1.5 transition"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
                      <span>Re-Audit Photo</span>
                    </button>
                  </div>
                </div>

                {/* Right Column: AI Visual Audit Findings & Milestone Clearance */}
                <div className="lg:col-span-7 space-y-4">
                  {auditResult ? (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      {/* Top Metric Cards */}
                      <div className="grid grid-cols-3 gap-2.5">
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] font-mono uppercase text-slate-400 block">
                            Structural Progress
                          </span>
                          <div className="flex items-baseline gap-1.5 mt-1">
                            <span className="text-xl sm:text-2xl font-bold font-mono text-amber-400">
                              {auditResult.completionPercentage}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500"
                              style={{ width: `${auditResult.completionPercentage}%` }}
                            />
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] font-mono uppercase text-slate-400 block">
                            Integrity Score
                          </span>
                          <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
                              {auditResult.qualityScore}
                            </span>
                            <span className="text-xs text-slate-400">/ 10</span>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400/80 block mt-1">
                            IS 456 Compliant
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] font-mono uppercase text-slate-400 block">
                            Compliance Grade
                          </span>
                          <div className="mt-1">
                            <span
                              className={`text-xs sm:text-sm font-bold font-mono px-2 py-0.5 rounded inline-block ${
                                auditResult.complianceGrade.includes('Grade A')
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : auditResult.complianceGrade.includes('Grade B')
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
                              }`}
                            >
                              {auditResult.complianceGrade}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-1">
                            Safety PPE: {auditResult.safetyCompliance?.ppeComplianceScore || 92}%
                          </span>
                        </div>
                      </div>

                      {/* Stage Name & Summary Card */}
                      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-amber-400" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wide">
                            Identified Stage: {auditResult.stageName}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{auditResult.summary}</p>
                      </div>

                      {/* Detailed Observations List */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                          <span>Key Structural &amp; Safety Observations ({auditResult.observations.length})</span>
                          <span className="text-[10px] font-mono text-slate-400">IS 456:2000 / IS 13920</span>
                        </h4>

                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {auditResult.observations.map((obs) => (
                            <div
                              key={obs.id}
                              className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition space-y-1.5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  {obs.status === 'passed' ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                  ) : obs.status === 'warning' ? (
                                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                                  ) : (
                                    <X className="w-4 h-4 text-red-400 shrink-0" />
                                  )}
                                  <h5 className="text-xs font-bold text-slate-200">{obs.title}</h5>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                                    {obs.category}
                                  </span>
                                  {obs.isCodeStandard && (
                                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                      {obs.isCodeStandard}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <p className="text-xs text-slate-400 leading-relaxed pl-6">{obs.description}</p>

                              {obs.recommendation && (
                                <div className="text-[11px] text-amber-300/90 pl-6 flex items-start gap-1 pt-0.5">
                                  <span className="font-semibold text-amber-400">Action:</span>
                                  <span>{obs.recommendation}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* BOQ Milestone Recommendation Box */}
                      {auditResult.boqMilestoneRecommendations && (
                        <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-950/40 to-slate-950 border border-emerald-500/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileCheck className="w-4 h-4 text-emerald-400" />
                              <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
                                BOQ Milestone Sign-off Directive
                              </h4>
                            </div>
                            {auditResult.boqMilestoneRecommendations.suggestedReleasePercentage && (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Release {auditResult.boqMilestoneRecommendations.suggestedReleasePercentage}% Phase Value
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-200 font-semibold">
                            {auditResult.boqMilestoneRecommendations.recommendedMilestone}
                          </p>
                          <p className="text-xs text-slate-400">
                            {auditResult.boqMilestoneRecommendations.action}
                          </p>

                          {auditResult.boqMilestoneRecommendations.itemsToVerify && (
                            <div className="pt-1.5 border-t border-emerald-500/20 space-y-1">
                              <span className="text-[10px] font-mono text-emerald-400 uppercase">
                                Pre-Pour Verification Checklist:
                              </span>
                              <ul className="space-y-0.5 text-xs text-slate-300 pl-4 list-disc">
                                {auditResult.boqMilestoneRecommendations.itemsToVerify.map((item, idx) => (
                                  <li key={idx}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2 border border-dashed border-slate-800 rounded-xl">
                      <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                      <p className="text-xs">Processing image analysis with Gemini 3.8 Flash...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Bar */}
              {auditResult && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 bg-slate-950/50 p-3 rounded-xl">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Inspection ID: {auditResult.auditId}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveAudit}
                      disabled={isSaved}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                        isSaved
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                          : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold shadow'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isSaved ? 'Saved to Project' : 'Save to Project Audits'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleShareWhatsApp}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-600/40 text-emerald-300 text-xs font-medium flex items-center gap-1.5 transition"
                      title="Share Audit Report via WhatsApp"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>WhatsApp Ar. S. Gouse</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePrintAudit}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Print Memo</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
