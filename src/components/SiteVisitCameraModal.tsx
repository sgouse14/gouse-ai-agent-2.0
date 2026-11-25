import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Camera,
  X,
  RotateCcw,
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
  MapPin,
  Check,
  FileCheck,
  Columns,
  Pin,
  Trash2,
  Copy,
  Download,
  Plus,
  Search,
  Flashlight,
  FlipHorizontal2,
  ClipboardList,
  History,
  CheckSquare,
  Square,
} from 'lucide-react';
import {
  Project,
  SiteAuditResult,
  SiteAuditObservation,
  SitePhotoAnnotation,
  SiteSnagItem,
} from '../types';
import { PROJECT_MEDIA } from '../utils/mediaAssets';

interface SiteVisitCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProject: Project | null;
  onSaveAuditToProject?: (audit: SiteAuditResult) => void;
}

type ModalTab = 'capture' | 'history' | 'punch_list';

interface CapturedFrameItem {
  id: string;
  imageUrl: string;
  filename: string;
  zoneFloor: string;
  capturedAt: string;
}

const ZONE_OPTIONS = [
  'Foundation & Substructure',
  'Ground Floor Deck',
  'First Floor Slab & Cantilever',
  'Terrace & Parapet',
  'Kitchen & Living Interior',
  'Master Suite & Wet Area',
  'Exterior Facade & Elevation',
];

const FOCUS_OPTIONS = [
  {
    label: 'Comprehensive Structural & Safety Audit',
    value: 'Structural progress, RCC framing, rebar binding, masonry alignment, safety compliance',
  },
  {
    label: 'Rebar Detailing & Confinement (IS 13920)',
    value: 'Rebar confinement, stirrup hooks (135 degree), cover block depth (IS 456 Table 16)',
  },
  {
    label: 'Formwork & Shuttering Stability',
    value: 'Formwork plumb, prop spacing, deshuttering stability and cold joint risk',
  },
  {
    label: 'Envelope Masonry & Lintel Band',
    value: 'AAC block masonry work, mortar bed joints, lintel band casting',
  },
  {
    label: 'Wet Area Waterproofing & Tiling',
    value: 'Waterproofing membrane upstand, bathroom ponding slope, epoxy tile grout',
  },
  {
    label: 'Interior Millwork, Kitchen & False Ceiling',
    value: 'Interior modular kitchen carpentry, BWR plywood edge banding, GI false ceiling and lighting',
  },
  {
    label: 'MEP Conduit Chasing & Plastering',
    value: 'MEP concealed electrical conduit, plumbing pressure check and internal wall plastering',
  },
  {
    label: 'Site Safety & NBC 2016 Gates',
    value: 'Safety PPE, perimeter net, scaffolding toe boards (NBC 2016 Part 7)',
  },
];

const TRADE_OPTIONS = [
  'RCC / Rebar',
  'Formwork',
  'Masonry',
  'Waterproofing',
  'MEP & Lighting',
  'Interior Millwork',
  'Finishes & Paint',
  'Safety / HSE',
];

const PRESET_SITE_BENCHMARKS = [
  {
    id: 'preset-cantilever-slab',
    title: 'First Floor Slab & Cantilever Beams',
    stage: 'Slab & Rebar',
    zone: 'First Floor Slab & Cantilever',
    focus: 'Structural progress, RCC framing, rebar binding, formwork props, cantilever top steel',
    url: PROJECT_MEDIA.siteRccFraming,
  },
  {
    id: 'preset-column-rebar',
    title: 'RCC Column Cages & 135° Confinement',
    stage: 'Columns',
    zone: 'Ground Floor Deck',
    focus: 'Rebar confinement, column vertical bars, 135 degree seismic stirrups, cover blocks',
    url: PROJECT_MEDIA.builderProj1,
  },
  {
    id: 'preset-foundation-raft',
    title: 'Substructure Raft Mat Reinforcement',
    stage: 'Foundation',
    zone: 'Foundation & Substructure',
    focus: 'Foundation raft rebar mat, starter bars, clear cover blocks',
    url: PROJECT_MEDIA.builderProj2,
  },
  {
    id: 'preset-block-masonry',
    title: 'AAC Block Envelope & Lintel Bands',
    stage: 'Masonry',
    zone: 'Ground Floor Deck',
    focus: 'AAC block masonry joints, plumb alignment, 100mm RCC lintel band',
    url: PROJECT_MEDIA.builderProj3,
  },
  {
    id: 'preset-waterproof-bath',
    title: 'Wet Area Waterproofing & Stone Tiling',
    stage: 'Waterproofing',
    zone: 'Master Suite & Wet Area',
    focus: 'Waterproofing membrane upstand, bathroom sunken slab slope, tile epoxy grout',
    url: PROJECT_MEDIA.pgBathroom,
  },
  {
    id: 'preset-finishes-mep',
    title: 'MEP Rough-In & Wall Surfacing',
    stage: 'MEP & Plaster',
    zone: 'Ground Floor Deck',
    focus: 'MEP conduit chasing, internal wall plastering, lighting points',
    url: PROJECT_MEDIA.pgDining,
  },
  {
    id: 'preset-interior-kitchen',
    title: 'Modular Kitchen & Quartz Millwork',
    stage: 'Kitchen Interior',
    zone: 'Kitchen & Living Interior',
    focus: 'Interior modular kitchen carpentry, quartz countertop, edge banding and MEP sockets',
    url: PROJECT_MEDIA.modularQuartzKitchen,
  },
  {
    id: 'preset-interior-living',
    title: 'Oak Living Ceiling & Architectural Lighting',
    stage: 'Living Fitout',
    zone: 'Kitchen & Living Interior',
    focus: 'Interior living room false ceiling, warm oak joinery, stone floor finishing',
    url: PROJECT_MEDIA.luxuryInteriorLiving,
  },
];

export const SiteVisitCameraModal: React.FC<SiteVisitCameraModalProps> = ({
  isOpen,
  onClose,
  activeProject,
  onSaveAuditToProject,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const projectId = activeProject?.id || 'default';
  const auditsStorageKey = `gouse_ai_site_audits_${projectId}`;
  const snagsStorageKey = `gouse_ai_site_snags_${projectId}`;

  const [activeTab, setActiveTab] = useState<ModalTab>('capture');

  // Camera state
  const [cameraState, setCameraState] = useState<'idle' | 'starting' | 'active' | 'denied' | 'unsupported'>('idle');
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [digitalZoom, setDigitalZoom] = useState<number>(1);
  const [isMirrored, setIsMirrored] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showPlumbCrosshairs, setShowPlumbCrosshairs] = useState<boolean>(true);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [hasTorchCapability, setHasTorchCapability] = useState<boolean>(false);
  const [flashEffect, setFlashEffect] = useState<boolean>(false);

  // Field metadata
  const [zoneFloor, setZoneFloor] = useState<string>('First Floor Slab & Cantilever');
  const [selectedFocus, setSelectedFocus] = useState<string>(FOCUS_OPTIONS[0].value);
  const [inspectorName, setInspectorName] = useState<string>('Site QA Lead');
  const [gpsCoordinates, setGpsCoordinates] = useState<string>('');
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'ready' | 'unavailable'>('idle');

  // Multi-photo tray + active capture
  const [sessionFrames, setSessionFrames] = useState<CapturedFrameItem[]>([]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFilename, setCapturedFilename] = useState<string>('');
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditProgressStep, setAuditProgressStep] = useState<string>('');
  const [auditResult, setAuditResult] = useState<SiteAuditResult | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [copiedFeedback, setCopiedFeedback] = useState<string | null>(null);

  // Review tools (Zoom, Annotations / Pins, Compare, Observation Filter, Verification Checkboxes)
  const [reviewZoom, setReviewZoom] = useState<1 | 1.5 | 2>(1);
  const [isPinMode, setIsPinMode] = useState<boolean>(false);
  const [showPins, setShowPins] = useState<boolean>(true);
  const [annotations, setAnnotations] = useState<SitePhotoAnnotation[]>([]);
  const [pendingPinCoords, setPendingPinCoords] = useState<{ x: number; y: number } | null>(null);
  const [pinLabelInput, setPinLabelInput] = useState<string>('');
  const [pinSeverityInput, setPinSeverityInput] = useState<'info' | 'warning' | 'critical'>('warning');
  const [pinTradeInput, setPinTradeInput] = useState<string>(TRADE_OPTIONS[0]);
  const [obsFilter, setObsFilter] = useState<'all' | 'passed' | 'warning' | 'critical'>('all');
  const [verifiedChecklist, setVerifiedChecklist] = useState<Record<number, boolean>>({});
  const [compareAuditId, setCompareAuditId] = useState<string>('');

  // History & Punch list state
  const [auditHistory, setAuditHistory] = useState<SiteAuditResult[]>([]);
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyGradeFilter, setHistoryGradeFilter] = useState<'all' | 'grade_a' | 'rectify'>('all');
  const [comparePairIds, setComparePairIds] = useState<string[]>([]);

  const [snagList, setSnagList] = useState<SiteSnagItem[]>([]);
  const [snagFilter, setSnagFilter] = useState<'all' | 'open' | 'in_review' | 'resolved'>('all');
  const [snagSearch, setSnagSearch] = useState<string>('');
  const [showNewSnagForm, setShowNewSnagForm] = useState<boolean>(false);
  const [newSnagTitle, setNewSnagTitle] = useState<string>('');
  const [newSnagTrade, setNewSnagTrade] = useState<string>(TRADE_OPTIONS[0]);
  const [newSnagSeverity, setNewSnagSeverity] = useState<'low' | 'medium' | 'critical'>('medium');
  const [newSnagNote, setNewSnagNote] = useState<string>('');

  // Sync saved audits & snags when project changes or modal opens
  useEffect(() => {
    if (!isOpen) return;
    try {
      const rawAudits = localStorage.getItem(auditsStorageKey);
      const localAudits: SiteAuditResult[] = rawAudits ? JSON.parse(rawAudits) : [];
      const projectAudits = activeProject?.siteAudits || [];
      const seen = new Set<string>();
      const merged: SiteAuditResult[] = [];
      for (const item of [...projectAudits, ...localAudits]) {
        if (item?.auditId && !seen.has(item.auditId)) {
          seen.add(item.auditId);
          merged.push(item);
        }
      }
      setAuditHistory(merged);
    } catch {
      setAuditHistory(activeProject?.siteAudits || []);
    }

    try {
      const rawSnags = localStorage.getItem(snagsStorageKey);
      const parsedSnags: SiteSnagItem[] = rawSnags ? JSON.parse(rawSnags) : [];
      setSnagList(Array.isArray(parsedSnags) ? parsedSnags : []);
    } catch {
      setSnagList([]);
    }
  }, [isOpen, auditsStorageKey, snagsStorageKey, activeProject?.siteAudits]);

  const persistSnagList = useCallback(
    (next: SiteSnagItem[]) => {
      setSnagList(next);
      try {
        localStorage.setItem(snagsStorageKey, JSON.stringify(next.slice(0, 100)));
      } catch {
        // ignore quota error
      }
    },
    [snagsStorageKey]
  );

  // Sound synthesis for shutter click
  const playShutterSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(820, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, audioCtx.currentTime + 0.07);
      gain.gain.setValueAtTime(0.22, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.07);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch {
      // Audio muted or unsupported
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsTorchOn(false);
    setHasTorchCapability(false);
    setCameraState('idle');
  }, []);

  const refreshDeviceList = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setVideoDevices(devices.filter((d) => d.kind === 'videoinput'));
    } catch {
      // ignore enumeration errors
    }
  }, []);

  const startCamera = useCallback(
    async (facing: 'environment' | 'user' = 'environment', explicitDeviceId?: string) => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraState('unsupported');
        return;
      }

      setCameraState('starting');
      setAuditError(null);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      try {
        const videoConstraints: MediaTrackConstraints = explicitDeviceId
          ? { deviceId: { exact: explicitDeviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
          : { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } };

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });

        streamRef.current = mediaStream;
        setCameraState('active');

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(() => {});
        }

        const videoTrack = mediaStream.getVideoTracks()[0];
        if (videoTrack) {
          const capabilities = (videoTrack.getCapabilities ? videoTrack.getCapabilities() : {}) as { torch?: boolean };
          setHasTorchCapability(Boolean(capabilities?.torch));
        }
        refreshDeviceList();
      } catch (err: unknown) {
        const errorName = (err as { name?: string })?.name;
        if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
          setCameraState('denied');
          return;
        }
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          streamRef.current = fallbackStream;
          setCameraState('active');
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            videoRef.current.play().catch(() => {});
          }
          refreshDeviceList();
        } catch {
          setCameraState('denied');
        }
      }
    },
    [refreshDeviceList]
  );

  const toggleTorch = useCallback(async () => {
    const activeStream = streamRef.current;
    if (!activeStream || !hasTorchCapability) return;
    const track = activeStream.getVideoTracks()[0];
    if (!track) return;
    try {
      const nextState = !isTorchOn;
      await track.applyConstraints({
        advanced: [{ torch: nextState } as MediaTrackConstraintSet],
      });
      setIsTorchOn(nextState);
    } catch {
      // torch toggle unsupported on active device
    }
  }, [hasTorchCapability, isTorchOn]);

  const switchCameraFacing = useCallback(() => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    setSelectedDeviceId('');
    setIsMirrored(nextFacing === 'user');
    startCamera(nextFacing);
  }, [cameraFacing, startCamera]);

  const requestGpsLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus('unavailable');
      return;
    }
    setGpsStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(5);
        const lng = pos.coords.longitude.toFixed(5);
        setGpsCoordinates(`${lat}, ${lng}`);
        setGpsStatus('ready');
      },
      () => {
        setGpsStatus('unavailable');
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );
  }, []);

  // Lifecycle management
  useEffect(() => {
    if (isOpen && activeTab === 'capture' && !capturedImage) {
      startCamera(cameraFacing, selectedDeviceId || undefined);
    } else if (!isOpen || activeTab !== 'capture' || capturedImage) {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeTab, capturedImage]);

  useEffect(() => {
    if (!isOpen) {
      setCapturedImage(null);
      setAuditResult(null);
      setIsAuditing(false);
      setIsSaved(false);
      setAnnotations([]);
      setPendingPinCoords(null);
      setIsPinMode(false);
      setCompareAuditId('');
      setReviewZoom(1);
    }
  }, [isOpen]);

  // Visual audit API call
  const triggerVisualAudit = useCallback(
    async (imageData: string, filename: string, focusOverride?: string, zoneOverride?: string) => {
      setIsAuditing(true);
      setAuditError(null);
      setAuditResult(null);
      setIsSaved(false);
      setVerifiedChecklist({});
      setObsFilter('all');

      setAuditProgressStep('Inspecting visible framing, finishes & geometry...');
      const stepTimer1 = setTimeout(() => {
        setAuditProgressStep('Checking IS 456 / IS 13920 / fitout code tolerances...');
      }, 650);
      const stepTimer2 = setTimeout(() => {
        setAuditProgressStep('Compiling BOQ milestone clearance & snag directives...');
      }, 1300);

      try {
        const response = await fetch('/api/architecture/analyze-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: imageData,
            filename,
            focus: focusOverride || selectedFocus,
            projectName: activeProject?.name || 'Active Construction Site',
            projectType: activeProject?.projectType || 'Residential / Commercial',
            projectContext: `${activeProject?.location || 'Site Location'} · Status: ${
              activeProject?.status || 'in_progress'
            }`,
            zoneFloor: zoneOverride || zoneFloor,
            gpsCoordinates: gpsCoordinates || undefined,
            inspectorName: inspectorName.trim() || undefined,
          }),
        });

        if (!response.ok) {
          throw new Error(`Visual audit endpoint returned HTTP ${response.status}`);
        }

        const data: SiteAuditResult = await response.json();
        setAuditResult({
          ...data,
          zoneFloor: data.zoneFloor || zoneOverride || zoneFloor,
          gpsCoordinates: data.gpsCoordinates || gpsCoordinates || undefined,
          inspectorName: data.inspectorName || inspectorName.trim() || undefined,
        });
      } catch (err: unknown) {
        setAuditError((err as { message?: string })?.message || 'Unable to complete visual audit.');
      } finally {
        clearTimeout(stepTimer1);
        clearTimeout(stepTimer2);
        setIsAuditing(false);
        setAuditProgressStep('');
      }
    },
    [activeProject, selectedFocus, zoneFloor, gpsCoordinates, inspectorName]
  );

  // Snap photo from live stream (honoring zoom & mirror) and optionally run audit immediately
  const captureSnapshot = useCallback(
    (autoAudit: boolean) => {
      if (!videoRef.current) return;
      const video = videoRef.current;

      setFlashEffect(true);
      playShutterSound();
      setTimeout(() => setFlashEffect(false), 180);

      const canvas = canvasRef.current || document.createElement('canvas');
      const vw = video.videoWidth || 1280;
      const vh = video.videoHeight || 720;
      canvas.width = vw;
      canvas.height = vh;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const cropW = vw / digitalZoom;
      const cropH = vh / digitalZoom;
      const sx = (vw - cropW) / 2;
      const sy = (vh - cropH) / 2;

      ctx.save();
      if (isMirrored) {
        ctx.translate(vw, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, sx, sy, cropW, cropH, 0, 0, vw, vh);
      ctx.restore();

      // Engineering chain-of-custody stamp
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const stampWidth = Math.min(vw - 32, 620);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
      ctx.fillRect(16, vh - 76, stampWidth, 60);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(
        `${(activeProject?.name || 'SITE VISIT').toUpperCase()} · ${zoneFloor.toUpperCase()}`,
        28,
        vh - 52
      );

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '12px sans-serif';
      const metaLine = [
        dateStr,
        activeProject?.location || 'Site Capture',
        gpsCoordinates ? `GPS ${gpsCoordinates}` : null,
        digitalZoom > 1 ? `${digitalZoom.toFixed(1)}x` : null,
      ]
        .filter(Boolean)
        .join(' · ');
      ctx.fillText(metaLine, 28, vh - 30);

      const base64Data = canvas.toDataURL('image/jpeg', 0.9);
      const fname = `site_${Date.now()}.jpg`;
      const frameItem: CapturedFrameItem = {
        id: `frame-${Date.now()}`,
        imageUrl: base64Data,
        filename: fname,
        zoneFloor,
        capturedAt: now.toISOString(),
      };
      setSessionFrames((prev) => [frameItem, ...prev].slice(0, 8));

      if (autoAudit) {
        setCapturedImage(base64Data);
        setCapturedFilename(fname);
        setAnnotations([]);
        triggerVisualAudit(base64Data, fname);
      }
    },
    [activeProject, digitalZoom, gpsCoordinates, isMirrored, playShutterSound, triggerVisualAudit, zoneFloor]
  );

  // Multi-file upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (!base64) return;
        const item: CapturedFrameItem = {
          id: `upload-${Date.now()}-${index}`,
          imageUrl: base64,
          filename: file.name,
          zoneFloor,
          capturedAt: new Date().toISOString(),
        };
        setSessionFrames((prev) => [item, ...prev].slice(0, 8));
        if (index === 0) {
          setCapturedImage(base64);
          setCapturedFilename(file.name);
          setAnnotations([]);
          triggerVisualAudit(base64, file.name);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleSelectSessionFrame = (frame: CapturedFrameItem) => {
    setCapturedImage(frame.imageUrl);
    setCapturedFilename(frame.filename);
    setZoneFloor(frame.zoneFloor);
    setAnnotations([]);
    triggerVisualAudit(frame.imageUrl, frame.filename, undefined, frame.zoneFloor);
  };

  const handleSelectPreset = async (preset: (typeof PRESET_SITE_BENCHMARKS)[0]) => {
    setZoneFloor(preset.zone);
    setSelectedFocus(preset.focus);
    setCapturedFilename(`${preset.id}.jpg`);
    setCapturedImage(preset.url);
    setAnnotations([]);

    try {
      const resp = await fetch(preset.url);
      const blob = await resp.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setCapturedImage(base64);
        triggerVisualAudit(base64, `${preset.id}.jpg`, preset.focus, preset.zone);
      };
      reader.readAsDataURL(blob);
    } catch {
      triggerVisualAudit(preset.url, `${preset.id}.jpg`, preset.focus, preset.zone);
    }
  };

  // Save audit to project + localStorage history
  const handleSaveAudit = () => {
    if (!auditResult) return;
    const enrichedAudit: SiteAuditResult = {
      ...auditResult,
      imageUrl: capturedImage || auditResult.imageUrl,
      annotations: annotations.length > 0 ? annotations : auditResult.annotations,
      zoneFloor,
      gpsCoordinates: gpsCoordinates || auditResult.gpsCoordinates,
      inspectorName: inspectorName.trim() || auditResult.inspectorName,
    };

    if (onSaveAuditToProject) {
      onSaveAuditToProject(enrichedAudit);
    }

    try {
      const nextHistory = [
        enrichedAudit,
        ...auditHistory.filter((item) => item.auditId !== enrichedAudit.auditId),
      ].slice(0, 25);
      setAuditHistory(nextHistory);
      localStorage.setItem(auditsStorageKey, JSON.stringify(nextHistory));
    } catch {
      // ignore storage quota errors
    }

    setAuditResult(enrichedAudit);
    setIsSaved(true);
  };

  const handleDeleteHistoryAudit = (auditIdToDelete: string) => {
    const next = auditHistory.filter((item) => item.auditId !== auditIdToDelete);
    setAuditHistory(next);
    setComparePairIds((prev) => prev.filter((id) => id !== auditIdToDelete));
    try {
      localStorage.setItem(auditsStorageKey, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const handleOpenHistoryAudit = (item: SiteAuditResult) => {
    setCapturedImage(item.imageUrl || PROJECT_MEDIA.siteRccFraming);
    setCapturedFilename(item.filename || `${item.auditId}.jpg`);
    setAuditResult(item);
    setAnnotations(item.annotations || []);
    if (item.zoneFloor) setZoneFloor(item.zoneFloor);
    setIsSaved(true);
    setActiveTab('capture');
  };

  // Click on captured photo to add pin when Pin Mode is active
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPinMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPercent = Number((((e.clientX - rect.left) / rect.width) * 100).toFixed(1));
    const yPercent = Number((((e.clientY - rect.top) / rect.height) * 100).toFixed(1));
    setPendingPinCoords({ x: xPercent, y: yPercent });
  };

  const handleConfirmPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingPinCoords || !pinLabelInput.trim()) return;
    const newPin: SitePhotoAnnotation = {
      id: `pin-${Date.now()}`,
      xPercent: pendingPinCoords.x,
      yPercent: pendingPinCoords.y,
      label: pinLabelInput.trim(),
      severity: pinSeverityInput,
      trade: pinTradeInput,
    };
    setAnnotations((prev) => [...prev, newPin]);
    setPinLabelInput('');
    setPendingPinCoords(null);
    setIsSaved(false);
  };

  const handleSendPinToSnags = (pin: SitePhotoAnnotation) => {
    const snag: SiteSnagItem = {
      id: `snag-${Date.now()}`,
      title: pin.label,
      zoneFloor,
      trade: pin.trade || 'Site General',
      severity: pin.severity === 'critical' ? 'critical' : pin.severity === 'warning' ? 'medium' : 'low',
      status: 'open',
      note: `Pinned on site photo at (${pin.xPercent}%, ${pin.yPercent}%) · ${capturedFilename || 'Capture'}`,
      createdAt: new Date().toISOString(),
      auditId: auditResult?.auditId,
      imageUrl: capturedImage || undefined,
    };
    persistSnagList([snag, ...snagList]);
    setCopiedFeedback('Added pin to Punch List');
    setTimeout(() => setCopiedFeedback(null), 1800);
  };

  const handleAddObservationToSnags = (obs: SiteAuditObservation) => {
    const snag: SiteSnagItem = {
      id: `snag-${Date.now()}`,
      title: obs.title,
      zoneFloor: auditResult?.zoneFloor || zoneFloor,
      trade: obs.category.toUpperCase(),
      severity: obs.status === 'critical' ? 'critical' : obs.status === 'warning' ? 'medium' : 'low',
      status: 'open',
      codeRef: obs.isCodeStandard,
      note: obs.recommendation || obs.description,
      createdAt: new Date().toISOString(),
      auditId: auditResult?.auditId,
      imageUrl: capturedImage || undefined,
    };
    persistSnagList([snag, ...snagList]);
    setCopiedFeedback('Observation logged to Punch List');
    setTimeout(() => setCopiedFeedback(null), 1800);
  };

  const handleAddManualSnag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSnagTitle.trim()) return;
    const snag: SiteSnagItem = {
      id: `snag-${Date.now()}`,
      title: newSnagTitle.trim(),
      zoneFloor,
      trade: newSnagTrade,
      severity: newSnagSeverity,
      status: 'open',
      note: newSnagNote.trim() || 'Logged during site camera walkthrough',
      createdAt: new Date().toISOString(),
    };
    persistSnagList([snag, ...snagList]);
    setNewSnagTitle('');
    setNewSnagNote('');
    setShowNewSnagForm(false);
  };

  const handleCycleSnagStatus = (id: string) => {
    const next = snagList.map((item) => {
      if (item.id !== id) return item;
      const nextStatus: SiteSnagItem['status'] =
        item.status === 'open' ? 'in_review' : item.status === 'in_review' ? 'resolved' : 'open';
      return { ...item, status: nextStatus };
    });
    persistSnagList(next);
  };

  const handleExportSnagsCsv = () => {
    const headers = ['Title', 'Zone', 'Trade', 'Severity', 'Status', 'Code Ref', 'Note', 'Logged At'];
    const rows = snagList.map((s) =>
      [s.title, s.zoneFloor, s.trade, s.severity, s.status, s.codeRef || '', s.note, s.createdAt]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `site_punch_list_${projectId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy, Download & Share handlers
  const buildMemoText = (res: SiteAuditResult) => {
    const obsLines = res.observations
      .map((o, idx) => `${idx + 1}. [${o.status.toUpperCase()}] ${o.title} (${o.isCodeStandard || o.category}) — ${o.recommendation || o.description}`)
      .join('\n');
    return [
      `SITE VISIT VISUAL AUDIT MEMO`,
      `Project: ${res.projectName}`,
      `Zone / Floor: ${res.zoneFloor || zoneFloor}`,
      `Stage: ${res.stageName}`,
      `Progress: ${res.completionPercentage}% | Quality: ${res.qualityScore}/10 | ${res.complianceGrade}`,
      res.gpsCoordinates ? `GPS: ${res.gpsCoordinates}` : null,
      res.inspectorName ? `Inspector: ${res.inspectorName}` : null,
      ``,
      `Summary: ${res.summary}`,
      ``,
      `Observations:`,
      obsLines,
      ``,
      `BOQ Milestone: ${res.boqMilestoneRecommendations.recommendedMilestone} (${res.boqMilestoneRecommendations.action})`,
    ]
      .filter((line) => line !== null)
      .join('\n');
  };

  const handleCopySummary = async () => {
    if (!auditResult) return;
    try {
      await navigator.clipboard.writeText(buildMemoText(auditResult));
      setCopiedFeedback('Audit memo copied to clipboard');
      setTimeout(() => setCopiedFeedback(null), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleDownloadReport = () => {
    if (!auditResult) return;
    const content = buildMemoText(auditResult);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `site_audit_${auditResult.auditId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShareWhatsApp = () => {
    if (!auditResult) return;
    const text = encodeURIComponent(buildMemoText(auditResult));
    const a = document.createElement('a');
    a.href = `https://wa.me/?text=${text}`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setAuditResult(null);
    setIsAuditing(false);
    setIsSaved(false);
    setAnnotations([]);
    setPendingPinCoords(null);
    setIsPinMode(false);
    setCompareAuditId('');
    setReviewZoom(1);
    startCamera(cameraFacing, selectedDeviceId || undefined);
  };

  const filteredObservations = useMemo(() => {
    if (!auditResult) return [];
    if (obsFilter === 'all') return auditResult.observations;
    return auditResult.observations.filter((o) => o.status === obsFilter);
  }, [auditResult, obsFilter]);

  const filteredHistory = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    return auditHistory.filter((item) => {
      if (historyGradeFilter === 'grade_a' && !item.complianceGrade.includes('Grade A')) return false;
      if (historyGradeFilter === 'rectify' && item.complianceGrade.includes('Grade A')) return false;
      if (!q) return true;
      return (
        item.stageName.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        (item.zoneFloor || '').toLowerCase().includes(q)
      );
    });
  }, [auditHistory, historySearch, historyGradeFilter]);

  const filteredSnags = useMemo(() => {
    const q = snagSearch.trim().toLowerCase();
    return snagList.filter((item) => {
      if (snagFilter !== 'all' && item.status !== snagFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.trade.toLowerCase().includes(q) ||
        item.zoneFloor.toLowerCase().includes(q)
      );
    });
  }, [snagList, snagFilter, snagSearch]);

  const compareReferenceAudit = useMemo(
    () => auditHistory.find((a) => a.auditId === compareAuditId) || null,
    [auditHistory, compareAuditId]
  );

  const openSnagsCount = useMemo(
    () => snagList.filter((s) => s.status !== 'resolved').length,
    [snagList]
  );

  if (!isOpen) return null;

  return (
    <div
      id="site-visit-camera-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto"
    >
      <div
        id="site-visit-camera-modal-dialog"
        className="relative w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[94vh]"
      >
        <canvas ref={canvasRef} className="hidden" />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />

        {flashEffect && (
          <div className="absolute inset-0 bg-white/80 z-50 pointer-events-none transition-opacity duration-150" />
        )}

        {/* Top Modal Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-white tracking-tight truncate">
                Site Visit Camera &amp; Field Inspector
              </h2>
              <p className="text-xs text-slate-400 truncate">
                {activeProject ? `${activeProject.name} · ${activeProject.location}` : 'Active Project Site'}
              </p>
            </div>
          </div>

          {/* Segmented Workspace Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('capture')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'capture'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Capture &amp; Audit</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 tabular-nums ${
                activeTab === 'history'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit History ({auditHistory.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('punch_list')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 tabular-nums ${
                activeTab === 'punch_list'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Punch List ({openSnagsCount})</span>
            </button>
          </div>

          <button
            id="btn-close-site-visit-camera"
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            title="Close Site Camera"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Feedback Strip */}
        {copiedFeedback && (
          <div className="px-4 sm:px-6 py-2 bg-emerald-950/60 border-b border-emerald-800 text-xs text-emerald-300 flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{copiedFeedback}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {activeTab === 'capture' && !capturedImage && (
            <div className="space-y-4">
              {/* Field Tagging Bar */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-950 border border-slate-800 rounded-xl p-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Zone / Floor</label>
                  <select
                    value={zoneFloor}
                    onChange={(e) => setZoneFloor(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-amber-500"
                  >
                    {ZONE_OPTIONS.map((z) => (
                      <option key={z} value={z}>
                        {z}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Audit Focus</label>
                  <select
                    value={selectedFocus}
                    onChange={(e) => setSelectedFocus(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-amber-500"
                  >
                    {FOCUS_OPTIONS.map((opt) => (
                      <option key={opt.label} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Inspector / Engineer</label>
                  <input
                    type="text"
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    placeholder="Site Engineer Name"
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Location Geo-Stamp</label>
                  <button
                    type="button"
                    onClick={requestGpsLocation}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 flex items-center justify-between gap-2 transition-colors whitespace-nowrap"
                  >
                    <span className="flex items-center gap-1.5 truncate tabular-nums">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      {gpsStatus === 'locating'
                        ? 'Acquiring GPS...'
                        : gpsCoordinates
                        ? gpsCoordinates
                        : gpsStatus === 'unavailable'
                        ? 'GPS unavailable'
                        : 'Stamp Live GPS'}
                    </span>
                    <span className="text-[11px] text-amber-400 shrink-0">
                      {gpsCoordinates ? 'Update' : 'Capture'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Camera Viewport */}
              <div className="relative aspect-video sm:aspect-[16/9] max-h-[420px] w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                {cameraState === 'active' && (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transition-transform duration-150"
                    style={{
                      transform: `scale(${digitalZoom}) ${isMirrored ? 'scaleX(-1)' : ''}`,
                    }}
                  />
                )}

                {cameraState === 'starting' && (
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <RefreshCw className="w-7 h-7 animate-spin text-amber-400" />
                    <p className="text-sm font-medium">Starting site camera...</p>
                  </div>
                )}

                {(cameraState === 'denied' || cameraState === 'unsupported') && (
                  <div className="flex flex-col items-center gap-3 text-center px-6 max-w-md">
                    <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        {cameraState === 'unsupported'
                          ? 'Camera stream unavailable on this browser'
                          : 'Camera access is standby or blocked'}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Upload site photos from your device gallery or select a benchmark stage below to run an immediate inspection.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-semibold text-xs hover:bg-amber-400 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Upload Site Photos</span>
                      </button>
                      {cameraState === 'denied' && (
                        <button
                          type="button"
                          onClick={() => startCamera(cameraFacing, selectedDeviceId || undefined)}
                          className="px-3.5 py-2 rounded-lg bg-slate-800 text-slate-200 text-xs hover:bg-slate-700 transition-colors whitespace-nowrap"
                        >
                          Retry Camera
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Active Camera Overlays */}
                {cameraState === 'active' && (
                  <>
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

                    {showPlumbCrosshairs && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="relative w-36 h-36 border border-amber-400/50 rounded-lg flex items-center justify-center">
                          <div className="absolute w-full h-px bg-amber-400/50" />
                          <div className="absolute h-full w-px bg-amber-400/50" />
                          <div className="w-2 h-2 rounded-full bg-amber-400" />
                          <span className="absolute top-1 left-2 text-[10px] font-mono text-amber-300 tabular-nums">
                            90.0° PLUMB
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Top Viewfinder HUD */}
                    <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 pointer-events-none">
                      <div className="px-2.5 py-1 rounded-lg bg-black/70 border border-white/10 text-[11px] font-mono text-slate-200 tabular-nums">
                        {cameraFacing === 'environment' ? 'Rear Lens' : 'Front Lens'} · {digitalZoom.toFixed(1)}x · {zoneFloor}
                      </div>

                      <div className="flex items-center gap-1.5 pointer-events-auto">
                        {videoDevices.length > 1 && (
                          <select
                            value={selectedDeviceId}
                            onChange={(e) => {
                              setSelectedDeviceId(e.target.value);
                              startCamera(cameraFacing, e.target.value || undefined);
                            }}
                            className="px-2 py-1.5 rounded-lg bg-black/70 text-white border border-white/15 text-xs focus:outline-none max-w-[150px]"
                            title="Select Camera Input"
                          >
                            <option value="">Default Camera</option>
                            {videoDevices.map((d, i) => (
                              <option key={d.deviceId} value={d.deviceId}>
                                {d.label || `Camera ${i + 1}`}
                              </option>
                            ))}
                          </select>
                        )}

                        {hasTorchCapability && (
                          <button
                            type="button"
                            onClick={toggleTorch}
                            className={`p-2 rounded-lg border transition-colors ${
                              isTorchOn
                                ? 'bg-amber-400 text-slate-950 border-amber-300'
                                : 'bg-black/70 text-white border-white/15 hover:bg-black/90'
                            }`}
                            title="Toggle Flashlight"
                          >
                            <Flashlight className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setIsMirrored((prev) => !prev)}
                          className={`p-2 rounded-lg border transition-colors ${
                            isMirrored
                              ? 'bg-amber-500/30 text-amber-300 border-amber-500/40'
                              : 'bg-black/70 text-white border-white/15 hover:bg-black/90'
                          }`}
                          title="Mirror Preview"
                        >
                          <FlipHorizontal2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowGrid((prev) => !prev)}
                          className={`p-2 rounded-lg border transition-colors ${
                            showGrid
                              ? 'bg-amber-500/30 text-amber-300 border-amber-500/40'
                              : 'bg-black/70 text-white border-white/15 hover:bg-black/90'
                          }`}
                          title="Toggle Alignment Grid"
                        >
                          <Grid3X3 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowPlumbCrosshairs((prev) => !prev)}
                          className={`p-2 rounded-lg border transition-colors ${
                            showPlumbCrosshairs
                              ? 'bg-amber-500/30 text-amber-300 border-amber-500/40'
                              : 'bg-black/70 text-white border-white/15 hover:bg-black/90'
                          }`}
                          title="Toggle Plumb Crosshair"
                        >
                          <Crosshair className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={switchCameraFacing}
                          className="p-2 rounded-lg bg-black/70 text-white border border-white/15 hover:bg-black/90 transition-colors"
                          title="Switch Front / Rear Camera"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Digital Zoom Selector inside bottom viewfinder */}
                    <div className="absolute bottom-3 inset-x-3 flex items-center justify-between gap-2 pointer-events-none">
                      <div className="px-2.5 py-1 rounded-lg bg-black/70 border border-white/10 text-[11px] font-mono text-slate-300 tabular-nums">
                        {activeProject?.location || 'Site Capture'}
                        {gpsCoordinates ? ` · ${gpsCoordinates}` : ''}
                      </div>
                      <div className="flex items-center gap-1 p-1 rounded-lg bg-black/75 border border-white/15 pointer-events-auto">
                        {[1, 1.5, 2, 3].map((z) => (
                          <button
                            key={z}
                            type="button"
                            onClick={() => setDigitalZoom(z)}
                            className={`px-2 py-0.5 rounded text-[11px] font-mono tabular-nums transition-colors ${
                              digitalZoom === z ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            {z}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Shutter & Capture Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950 border border-slate-800 rounded-xl p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors whitespace-nowrap"
                  >
                    <Upload className="w-4 h-4 text-amber-400" />
                    <span>Upload Photos</span>
                  </button>
                  {cameraState === 'active' && (
                    <button
                      type="button"
                      onClick={() => captureSnapshot(false)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700 transition-colors whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-400" />
                      <span>Add Angle to Tray</span>
                    </button>
                  )}
                </div>

                <button
                  id="btn-snap-site-photo"
                  type="button"
                  onClick={cameraState === 'active' ? () => captureSnapshot(true) : () => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition-colors whitespace-nowrap shrink-0"
                >
                  <Camera className="w-4 h-4" />
                  <span>{cameraState === 'active' ? 'Snap & Run Visual Audit' : 'Select Site Photo'}</span>
                </button>
              </div>

              {/* Session Multi-Angle Filmstrip */}
              {sessionFrames.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-slate-300 tabular-nums">
                      Session Angles ({sessionFrames.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => setSessionFrames([])}
                      className="text-xs text-slate-400 hover:text-slate-200"
                    >
                      Clear Tray
                    </button>
                  </div>
                  <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                    {sessionFrames.map((frame) => (
                      <button
                        key={frame.id}
                        type="button"
                        onClick={() => handleSelectSessionFrame(frame)}
                        className="group relative w-32 shrink-0 rounded-lg overflow-hidden border border-slate-800 hover:border-amber-500/60 bg-slate-950 text-left transition-colors"
                      >
                        <div className="aspect-video w-full bg-slate-900 overflow-hidden">
                          <img src={frame.imageUrl} alt={frame.filename} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-1.5">
                          <p className="text-[11px] font-medium text-slate-200 truncate">{frame.zoneFloor}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Benchmark Site Stages (Structural + Waterproofing + MEP + Interior) */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-300">
                    Stage Reference Audits · Civil, MEP &amp; Interior
                  </h3>
                  <span className="text-xs text-slate-400">Select any stage to run visual QA</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {PRESET_SITE_BENCHMARKS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className="group flex flex-col text-left bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/50 rounded-xl overflow-hidden transition-colors"
                    >
                      <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                        <img
                          src={preset.url}
                          alt={preset.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/80 to-transparent" />
                        <span className="absolute bottom-1.5 left-2 text-[11px] font-medium text-amber-300">
                          {preset.stage}
                        </span>
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-medium text-slate-200 line-clamp-2 leading-snug group-hover:text-white">
                          {preset.title}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: CAPTURED PHOTO REVIEW, PIN ANNOTATIONS & VISUAL AUDIT REPORT */}
          {activeTab === 'capture' && capturedImage && (
            <div className="space-y-4">
              {isAuditing && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/40 flex items-center gap-3">
                  <RefreshCw className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-amber-300">Visual Inspection Running</p>
                    <p className="text-xs text-slate-400 truncate">{auditProgressStep}</p>
                  </div>
                </div>
              )}

              {auditError && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{auditError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => triggerVisualAudit(capturedImage, capturedFilename)}
                    className="px-3 py-1 rounded-md bg-red-900/60 hover:bg-red-800 text-xs text-white whitespace-nowrap"
                  >
                    Retry Audit
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Left Column: Photo Inspector + Defect Pinning + Compare */}
                <div className="lg:col-span-5 space-y-3">
                  {/* Photo Tools Strip */}
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950 border border-slate-800 rounded-xl p-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsPinMode((prev) => !prev);
                          setPendingPinCoords(null);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                          isPinMode
                            ? 'bg-amber-500 text-slate-950 font-semibold'
                            : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                        <span>{isPinMode ? 'Click Photo to Pin' : 'Drop Snag Pin'}</span>
                      </button>

                      {annotations.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowPins((prev) => !prev)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white whitespace-nowrap tabular-nums"
                        >
                          {showPins ? `Hide Pins (${annotations.length})` : `Show Pins (${annotations.length})`}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {([1, 1.5, 2] as const).map((z) => (
                        <button
                          key={z}
                          type="button"
                          onClick={() => setReviewZoom(z)}
                          className={`px-2 py-1 rounded text-xs font-mono tabular-nums transition-colors ${
                            reviewZoom === z
                              ? 'bg-slate-800 text-amber-300 border border-slate-700'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {z === 1 ? 'Fit' : `${z}x`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interactive Photo Viewport */}
                  <div
                    onClick={handleImageClick}
                    className={`relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-950 border ${
                      isPinMode ? 'border-amber-500 cursor-crosshair' : 'border-slate-800'
                    }`}
                  >
                    <div
                      className="w-full h-full transition-transform duration-150 origin-center"
                      style={{ transform: `scale(${reviewZoom})` }}
                    >
                      <img
                        src={capturedImage}
                        alt="Site capture preview"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover select-none"
                      />

                      {/* Rendered Defect Pins */}
                      {showPins &&
                        annotations.map((pin, idx) => (
                          <div
                            key={pin.id}
                            style={{ left: `${pin.xPercent}%`, top: `${pin.yPercent}%` }}
                            onClick={(ev) => ev.stopPropagation()}
                            className="absolute -translate-x-1/2 -translate-y-1/2 group z-10"
                          >
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono font-bold border-2 border-white shadow-md tabular-nums ${
                                pin.severity === 'critical'
                                  ? 'bg-red-600 text-white'
                                  : pin.severity === 'warning'
                                  ? 'bg-amber-500 text-slate-950'
                                  : 'bg-emerald-600 text-white'
                              }`}
                              title={`${pin.label} (${pin.trade || 'General'})`}
                            >
                              {idx + 1}
                            </div>
                          </div>
                        ))}
                    </div>

                    <div className="absolute bottom-0 inset-x-0 px-3 py-2 bg-gradient-to-t from-black/85 via-black/45 to-transparent flex items-center justify-between text-xs text-slate-200 pointer-events-none">
                      <span className="truncate font-medium">{zoneFloor}</span>
                      <span className="font-mono text-[11px] text-slate-300 truncate max-w-[160px]">
                        {capturedFilename}
                      </span>
                    </div>
                  </div>

                  {/* New Pin Inline Form */}
                  {pendingPinCoords && (
                    <form
                      onSubmit={handleConfirmPin}
                      className="p-3 rounded-xl bg-slate-950 border border-amber-500/40 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-amber-300 tabular-nums">
                          New Pin at ({pendingPinCoords.x}%, {pendingPinCoords.y}%)
                        </span>
                        <button
                          type="button"
                          onClick={() => setPendingPinCoords(null)}
                          className="text-xs text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                      <input
                        type="text"
                        value={pinLabelInput}
                        onChange={(e) => setPinLabelInput(e.target.value)}
                        placeholder="Describe issue (e.g., Missing 40mm cover block)"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                        autoFocus
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={pinTradeInput}
                          onChange={(e) => setPinTradeInput(e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200"
                        >
                          {TRADE_OPTIONS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <select
                          value={pinSeverityInput}
                          onChange={(e) => setPinSeverityInput(e.target.value as 'info' | 'warning' | 'critical')}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200"
                        >
                          <option value="info">Info Note</option>
                          <option value="warning">Warning / Snag</option>
                          <option value="critical">Critical Hold</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        className="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold"
                      >
                        Place Inspection Pin
                      </button>
                    </form>
                  )}

                  {/* Annotated Pins List */}
                  {annotations.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-medium text-slate-400 tabular-nums">
                        Photo Pins ({annotations.length})
                      </span>
                      <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl bg-slate-950 overflow-hidden">
                        {annotations.map((pin, idx) => (
                          <div key={pin.id} className="px-3 py-2 flex items-center justify-between gap-2 text-xs">
                            <div className="min-w-0">
                              <p className="text-slate-200 font-medium truncate tabular-nums">
                                #{idx + 1} · {pin.label}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {pin.trade} · {pin.severity.toUpperCase()}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleSendPinToSnags(pin)}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-amber-300 whitespace-nowrap"
                              >
                                + Punch List
                              </button>
                              <button
                                type="button"
                                onClick={() => setAnnotations((prev) => prev.filter((p) => p.id !== pin.id))}
                                className="p-1 text-slate-400 hover:text-red-400"
                                title="Remove pin"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Side-by-Side Comparison Picker */}
                  {auditHistory.length > 0 && (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                          <Columns className="w-3.5 h-3.5 text-amber-400" />
                          <span>Compare vs Past Audit</span>
                        </span>
                        <select
                          value={compareAuditId}
                          onChange={(e) => setCompareAuditId(e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 max-w-[180px]"
                        >
                          <option value="">Off</option>
                          {auditHistory.map((item) => (
                            <option key={item.auditId} value={item.auditId}>
                              {item.stageName.slice(0, 28)} ({item.completionPercentage}%)
                            </option>
                          ))}
                        </select>
                      </div>

                      {compareReferenceAudit && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div className="space-y-1">
                            <div className="aspect-[4/3] rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
                              <img
                                src={compareReferenceAudit.imageUrl || PROJECT_MEDIA.siteRccFraming}
                                alt="Previous audit"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-[11px] text-slate-400 truncate tabular-nums">
                              Prior: {compareReferenceAudit.completionPercentage}% · {compareReferenceAudit.qualityScore}/10
                            </p>
                          </div>
                          <div className="space-y-1">
                            <div className="aspect-[4/3] rounded-lg overflow-hidden border border-amber-500/40 bg-slate-900">
                              <img src={capturedImage} alt="Current capture" className="w-full h-full object-cover" />
                            </div>
                            <p className="text-[11px] text-amber-300 truncate tabular-nums">
                              Current: {auditResult ? `${auditResult.completionPercentage}% · ${auditResult.qualityScore}/10` : 'Auditing'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Retake & Re-Audit Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRetake}
                      className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                      <span>Retake / New Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerVisualAudit(capturedImage, capturedFilename)}
                      disabled={isAuditing}
                      className="py-2 px-3 rounded-lg bg-slate-950 hover:bg-slate-800 text-amber-300 text-xs font-medium border border-slate-700 flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
                      <span>Re-Audit</span>
                    </button>
                  </div>
                </div>

                {/* Right Column: Audit Metrics, Filtered Observations & Milestone Verification */}
                <div className="lg:col-span-7 space-y-4">
                  {auditResult ? (
                    <div className="space-y-4">
                      {/* 3 KPI Summary Strip */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[11px] text-slate-400 block">Stage Progress</span>
                          <span className="text-2xl font-bold font-mono text-amber-400 tabular-nums mt-1 block">
                            {auditResult.completionPercentage}%
                          </span>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full"
                              style={{ width: `${auditResult.completionPercentage}%` }}
                            />
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[11px] text-slate-400 block">Quality Score</span>
                          <div className="flex items-baseline gap-1 mt-1 tabular-nums">
                            <span className="text-2xl font-bold font-mono text-emerald-400">
                              {auditResult.qualityScore}
                            </span>
                            <span className="text-xs text-slate-400">/ 10</span>
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-1.5 tabular-nums">
                            Safety PPE: {auditResult.safetyCompliance?.ppeComplianceScore ?? 92}%
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[11px] text-slate-400 block">Compliance Status</span>
                          <p
                            className={`text-sm font-semibold mt-1.5 ${
                              auditResult.complianceGrade.includes('Grade A')
                                ? 'text-emerald-400'
                                : auditResult.complianceGrade.includes('Grade B')
                                ? 'text-amber-400'
                                : 'text-red-400'
                            }`}
                          >
                            {auditResult.complianceGrade}
                          </p>
                          <span className="text-[11px] text-slate-400 block mt-1 truncate">
                            {auditResult.zoneFloor || zoneFloor}
                          </span>
                        </div>
                      </div>

                      {/* Identified Stage & Summary */}
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                            <Layers className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>{auditResult.stageName}</span>
                          </h4>
                          <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                            {new Date(auditResult.timestamp).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{auditResult.summary}</p>
                        {(auditResult.inspectorName || auditResult.gpsCoordinates) && (
                          <p className="text-[11px] text-slate-400 pt-1 tabular-nums">
                            {[
                              auditResult.inspectorName ? `Inspector: ${auditResult.inspectorName}` : null,
                              auditResult.gpsCoordinates ? `GPS: ${auditResult.gpsCoordinates}` : null,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        )}
                      </div>

                      {/* Filterable Observations List */}
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-xs font-semibold text-slate-200 tabular-nums">
                            Inspection Observations ({filteredObservations.length})
                          </h4>
                          <div className="flex items-center gap-1 p-0.5 bg-slate-950 border border-slate-800 rounded-lg">
                            {(['all', 'passed', 'warning', 'critical'] as const).map((statusKey) => (
                              <button
                                key={statusKey}
                                type="button"
                                onClick={() => setObsFilter(statusKey)}
                                className={`px-2.5 py-1 rounded text-[11px] font-medium capitalize transition-colors ${
                                  obsFilter === statusKey
                                    ? 'bg-slate-800 text-white'
                                    : 'text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                {statusKey}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl bg-slate-950 max-h-64 overflow-y-auto">
                          {filteredObservations.length === 0 ? (
                            <div className="p-4 text-xs text-slate-400 text-center">
                              No observations match the selected status filter.
                            </div>
                          ) : (
                            filteredObservations.map((obs) => (
                              <div key={obs.id} className="p-3.5 space-y-1.5">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-2 min-w-0">
                                    {obs.status === 'passed' ? (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                    ) : obs.status === 'warning' ? (
                                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                    ) : (
                                      <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                    )}
                                    <div className="min-w-0">
                                      <h5 className="text-xs font-semibold text-slate-100">{obs.title}</h5>
                                      <p className="text-[11px] text-slate-400 mt-0.5">
                                        {obs.category.toUpperCase()}
                                        {obs.isCodeStandard ? ` · ${obs.isCodeStandard}` : ''}
                                      </p>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleAddObservationToSnags(obs)}
                                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] text-amber-300 shrink-0 whitespace-nowrap"
                                  >
                                    + Punch List
                                  </button>
                                </div>

                                <p className="text-xs text-slate-300 leading-relaxed pl-6">{obs.description}</p>
                                {obs.recommendation && (
                                  <p className="text-[11px] text-amber-300/90 pl-6">
                                    Directive: {obs.recommendation}
                                  </p>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* BOQ Milestone Sign-off + Interactive Verification Checklist */}
                      {auditResult.boqMilestoneRecommendations && (
                        <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                              <FileCheck className="w-4 h-4 text-emerald-400" />
                              <span>BOQ Milestone Directive</span>
                            </h4>
                            {auditResult.boqMilestoneRecommendations.suggestedReleasePercentage !== undefined && (
                              <span className="text-xs font-mono font-semibold text-emerald-300 tabular-nums">
                                Suggested Release: {auditResult.boqMilestoneRecommendations.suggestedReleasePercentage}%
                              </span>
                            )}
                          </div>

                          <p className="text-xs font-medium text-white">
                            {auditResult.boqMilestoneRecommendations.recommendedMilestone}
                          </p>
                          <p className="text-xs text-slate-400">
                            {auditResult.boqMilestoneRecommendations.action}
                          </p>

                          {auditResult.boqMilestoneRecommendations.itemsToVerify?.length > 0 && (
                            <div className="pt-2 border-t border-slate-800 space-y-1.5">
                              <span className="text-[11px] font-medium text-slate-400 block">
                                Pre-Sign-Off Verification Checklist
                              </span>
                              {auditResult.boqMilestoneRecommendations.itemsToVerify.map((item, idx) => {
                                const checked = Boolean(verifiedChecklist[idx]);
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() =>
                                      setVerifiedChecklist((prev) => ({ ...prev, [idx]: !prev[idx] }))
                                    }
                                    className="w-full text-left flex items-start gap-2 text-xs text-slate-300 hover:text-white py-0.5"
                                  >
                                    {checked ? (
                                      <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                    ) : (
                                      <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                                    )}
                                    <span className={checked ? 'line-through text-slate-500' : ''}>{item}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-72 flex flex-col items-center justify-center text-slate-400 gap-2 border border-dashed border-slate-800 rounded-xl bg-slate-950">
                      <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                      <p className="text-xs">Analyzing captured site image...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action & Export Footer */}
              {auditResult && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Audit ID: {auditResult.auditId}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveAudit}
                      disabled={isSaved}
                      className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                        isSaved
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                          : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isSaved ? 'Saved to Project' : 'Save to Project Audits'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopySummary}
                      className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Memo</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadReport}
                      className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .txt</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleShareWhatsApp}
                      className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SAVED AUDIT HISTORY & BEFORE/AFTER STAGE COMPARISON */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search saved audits by stage, zone, or summary..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
                  {[
                    { id: 'all', label: 'All Grades' },
                    { id: 'grade_a', label: 'Grade A' },
                    { id: 'rectify', label: 'Needs Rectification' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setHistoryGradeFilter(f.id as 'all' | 'grade_a' | 'rectify')}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                        historyGradeFilter === f.id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Side-by-Side Comparison Matrix when 2 audits are selected */}
              {comparePairIds.length === 2 && (() => {
                const first = auditHistory.find((a) => a.auditId === comparePairIds[0]);
                const second = auditHistory.find((a) => a.auditId === comparePairIds[1]);
                if (!first || !second) return null;
                return (
                  <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                        <Columns className="w-4 h-4" />
                        <span>Side-by-Side Stage Comparison</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => setComparePairIds([])}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Clear Comparison
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[first, second].map((item) => (
                        <div key={item.auditId} className="space-y-2">
                          <div className="aspect-video rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
                            <img
                              src={item.imageUrl || PROJECT_MEDIA.siteRccFraming}
                              alt={item.stageName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-semibold text-white truncate">{item.stageName}</span>
                            <span className="font-mono text-amber-400 shrink-0 tabular-nums">
                              {item.completionPercentage}% · {item.qualityScore}/10
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-2">{item.summary}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {filteredHistory.length === 0 ? (
                <div className="p-10 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-3">
                  <Camera className="w-7 h-7 text-slate-500 mx-auto" />
                  <p className="text-sm font-medium text-slate-200">No saved site audits yet</p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Snap a live photo or run a stage benchmark audit, then click Save to Project Audits to build a permanent photo log.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('capture')}
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold"
                  >
                    Go to Camera Capture
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredHistory.map((item) => {
                    const isSelectedForCompare = comparePairIds.includes(item.auditId);
                    return (
                      <div
                        key={item.auditId}
                        className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex gap-3 items-start"
                      >
                        <div className="w-24 h-20 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
                          <img
                            src={item.imageUrl || PROJECT_MEDIA.siteRccFraming}
                            alt={item.stageName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="text-xs font-semibold text-white truncate">{item.stageName}</h5>
                            <span className="text-xs font-mono font-semibold text-amber-400 shrink-0 tabular-nums">
                              {item.completionPercentage}%
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 tabular-nums">
                            Score {item.qualityScore}/10 · {item.zoneFloor || 'Site Deck'} ·{' '}
                            {new Date(item.timestamp).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </p>
                          <p className="text-xs text-slate-300 line-clamp-2">{item.summary}</p>
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleOpenHistoryAudit(item)}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-white font-medium"
                            >
                              Open Audit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setComparePairIds((prev) =>
                                  prev.includes(item.auditId)
                                    ? prev.filter((id) => id !== item.auditId)
                                    : [...prev, item.auditId].slice(-2)
                                );
                              }}
                              className={`px-2.5 py-1 rounded text-[11px] font-medium border ${
                                isSelectedForCompare
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                              }`}
                            >
                              {isSelectedForCompare ? 'Selected to Compare' : 'Compare'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteHistoryAudit(item.auditId)}
                              className="p-1 text-slate-400 hover:text-red-400 ml-auto"
                              title="Delete audit"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SITE SNAG & PUNCH LIST TRACKER */}
          {activeTab === 'punch_list' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={snagSearch}
                    onChange={(e) => setSnagSearch(e.target.value)}
                    placeholder="Filter punch list by item, trade, or zone..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
                    {(['all', 'open', 'in_review', 'resolved'] as const).map((statusKey) => (
                      <button
                        key={statusKey}
                        type="button"
                        onClick={() => setSnagFilter(statusKey)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                          snagFilter === statusKey ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {statusKey.replace('_', ' ')}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowNewSnagForm((prev) => !prev)}
                    className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Snag</span>
                  </button>

                  {snagList.length > 0 && (
                    <button
                      type="button"
                      onClick={handleExportSnagsCsv}
                      className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </button>
                  )}
                </div>
              </div>

              {showNewSnagForm && (
                <form
                  onSubmit={handleAddManualSnag}
                  className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 grid grid-cols-1 md:grid-cols-4 gap-3"
                >
                  <div className="md:col-span-2">
                    <label className="block text-[11px] text-slate-400 mb-1">Snag / Defect Title</label>
                    <input
                      type="text"
                      value={newSnagTitle}
                      onChange={(e) => setNewSnagTitle(e.target.value)}
                      placeholder="e.g., Add diagonal prop bracing at NE cantilever"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Trade</label>
                    <select
                      value={newSnagTrade}
                      onChange={(e) => setNewSnagTrade(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-200"
                    >
                      {TRADE_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Severity</label>
                    <select
                      value={newSnagSeverity}
                      onChange={(e) => setNewSnagSeverity(e.target.value as 'low' | 'medium' | 'critical')}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-200"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <input
                      type="text"
                      value={newSnagNote}
                      onChange={(e) => setNewSnagNote(e.target.value)}
                      placeholder="Corrective instruction or IS code reference..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold"
                    >
                      Save Snag
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewSnagForm(false)}
                      className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {filteredSnags.length === 0 ? (
                <div className="p-10 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-3">
                  <ClipboardList className="w-7 h-7 text-slate-500 mx-auto" />
                  <p className="text-sm font-medium text-slate-200">No snag items logged</p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Drop pins on captured site photos or click + Punch List next to any audit observation to track field rectifications.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-800 rounded-xl bg-slate-950 overflow-hidden divide-y divide-slate-800">
                  {filteredSnags.map((snag) => (
                    <div key={snag.id} className="p-3.5 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {snag.imageUrl && (
                          <img
                            src={snag.imageUrl}
                            alt={snag.title}
                            className="w-12 h-12 rounded-lg object-cover border border-slate-800 shrink-0"
                          />
                        )}
                        <div className="min-w-0 space-y-0.5">
                          <h5 className="text-xs font-semibold text-white">{snag.title}</h5>
                          <p className="text-[11px] text-slate-400">
                            {snag.trade} · {snag.zoneFloor} · Severity: {snag.severity.toUpperCase()}
                            {snag.codeRef ? ` · ${snag.codeRef}` : ''}
                          </p>
                          <p className="text-xs text-slate-300">{snag.note}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCycleSnagStatus(snag.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                            snag.status === 'resolved'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : snag.status === 'in_review'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : 'bg-red-500/15 text-red-300 border-red-500/30'
                          }`}
                          title="Click to cycle status: Open -> In Review -> Resolved"
                        >
                          {snag.status === 'resolved'
                            ? 'Resolved'
                            : snag.status === 'in_review'
                            ? 'In Review'
                            : 'Open'}
                        </button>
                        <button
                          type="button"
                          onClick={() => persistSnagList(snagList.filter((s) => s.id !== snag.id))}
                          className="p-1.5 text-slate-400 hover:text-red-400"
                          title="Delete snag"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
