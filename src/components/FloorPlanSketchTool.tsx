import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Compass,
  Sparkles,
  Layers,
  Ruler,
  Download,
  Share2,
  Printer,
  Maximize2,
  Minimize2,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Eye,
  Check,
  Undo,
  Pencil,
  Eraser,
  Square,
  Minus,
  Move,
  Info,
  Building2,
  FolderKanban,
  Zap,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { Project, BOQItem, FloorPlanRoom, FloorPlanSketchResult } from '../types';
import { CurrencyCode, formatCurrency } from '../utils/formatters';

interface FloorPlanSketchToolProps {
  activeProject: Project;
  onUpdateProject: (updated: Project) => void;
  boqItems?: BOQItem[];
  onUpdateBOQItems?: (items: BOQItem[]) => void;
  currency?: CurrencyCode;
  onNavigateToBOQ?: () => void;
}

type SketchTool = 'select' | 'pen' | 'highlighter' | 'eraser' | 'wall' | 'room' | 'measure';
type StyleTheme = 'sketch' | 'blueprint' | 'minimal' | 'watercolor';

interface FreehandStroke {
  id: string;
  tool: 'pen' | 'highlighter';
  color: string;
  width: number;
  points: Array<{ x: number; y: number }>;
}

interface CustomWall {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness: number;
}

// Category color mappings
const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; fill: string }> = {
  living: { bg: 'bg-amber-500/15', border: 'border-amber-500/40', text: 'text-amber-300', fill: 'rgba(245, 158, 11, 0.12)' },
  bedroom: { bg: 'bg-indigo-500/15', border: 'border-indigo-500/40', text: 'text-indigo-300', fill: 'rgba(99, 102, 241, 0.12)' },
  kitchen: { bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', text: 'text-emerald-300', fill: 'rgba(16, 185, 129, 0.12)' },
  bathroom: { bg: 'bg-cyan-500/15', border: 'border-cyan-500/40', text: 'text-cyan-300', fill: 'rgba(6, 182, 212, 0.12)' },
  utility: { bg: 'bg-teal-500/15', border: 'border-teal-500/40', text: 'text-teal-300', fill: 'rgba(20, 184, 166, 0.12)' },
  balcony: { bg: 'bg-lime-500/15', border: 'border-lime-500/40', text: 'text-lime-300', fill: 'rgba(132, 204, 22, 0.12)' },
  circulation: { bg: 'bg-slate-500/15', border: 'border-slate-500/40', text: 'text-slate-300', fill: 'rgba(100, 116, 139, 0.12)' },
  pooja: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-300', fill: 'rgba(234, 179, 8, 0.16)' },
  office: { bg: 'bg-blue-500/15', border: 'border-blue-500/40', text: 'text-blue-300', fill: 'rgba(59, 130, 246, 0.12)' },
};

export const FloorPlanSketchTool: React.FC<FloorPlanSketchToolProps> = ({
  activeProject,
  onUpdateProject,
  boqItems = [],
  onUpdateBOQItems,
  currency = 'INR',
  onNavigateToBOQ,
}) => {
  // Input parameters
  const [builtUpArea, setBuiltUpArea] = useState<number>(activeProject.builtUpAreaSqFt || 2400);
  const [projectType, setProjectType] = useState<string>(activeProject.projectType || 'Residential Villa');
  const [facing, setFacing] = useState<string>('North');
  const [styleTheme, setStyleTheme] = useState<StyleTheme>('sketch');
  const [userRequirements, setUserRequirements] = useState<string>('');

  // Generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [planResult, setPlanResult] = useState<FloorPlanSketchResult | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Sketch-to-Design Toolkit state
  const [activeTool, setActiveTool] = useState<SketchTool>('select');
  const [penColor, setPenColor] = useState<string>('#ef4444');
  const [penWidth, setPenWidth] = useState<number>(2.5);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [freehandStrokes, setFreehandStrokes] = useState<FreehandStroke[]>([]);
  const [customWalls, setCustomWalls] = useState<CustomWall[]>([]);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [showVastuTags, setShowVastuTags] = useState<boolean>(true);
  const [showFurniture, setShowFurniture] = useState<boolean>(true);
  const [measurePoints, setMeasurePoints] = useState<Array<{ x: number; y: number }>>([]);
  const [isConvertingSketch, setIsConvertingSketch] = useState<boolean>(false);

  // Canvas drawing ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const currentStrokeRef = useRef<FreehandStroke | null>(null);

  // Generate conceptual floor plan sketch
  const handleGeneratePlan = useCallback(
    async (sketchEditsText?: string) => {
      setIsGenerating(true);
      setSyncFeedback(null);

      try {
        const response = await fetch('/api/architecture/generate-floorplan-sketch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            builtUpAreaSqFt: builtUpArea,
            projectType,
            facing,
            style: styleTheme,
            requirements: userRequirements,
            sketchEdits: sketchEditsText || (freehandStrokes.length > 0 ? `${freehandStrokes.length} user sketch strokes drawn` : ''),
          }),
        });

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const data: FloorPlanSketchResult = await response.json();
        setPlanResult(data);
      } catch (err) {
        console.error('[FloorPlan] Generation error:', err);
      } finally {
        setIsGenerating(false);
      }
    },
    [builtUpArea, projectType, facing, styleTheme, userRequirements, freehandStrokes.length]
  );

  // Initial load generation
  useEffect(() => {
    handleGeneratePlan();
  }, []);

  // Update builtUpArea when activeProject changes
  useEffect(() => {
    if (activeProject.builtUpAreaSqFt && activeProject.builtUpAreaSqFt !== builtUpArea) {
      setBuiltUpArea(activeProject.builtUpAreaSqFt);
    }
    if (activeProject.projectType && activeProject.projectType !== projectType) {
      setProjectType(activeProject.projectType);
    }
  }, [activeProject.id]);

  // Redraw freehand canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all completed strokes
    freehandStrokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (stroke.tool === 'highlighter') {
        ctx.globalAlpha = 0.35;
      } else {
        ctx.globalAlpha = 0.9;
      }

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });

    // Draw custom added walls
    customWalls.forEach((wall) => {
      ctx.beginPath();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = wall.thickness;
      ctx.lineCap = 'square';
      ctx.globalAlpha = 1.0;
      ctx.moveTo(wall.x1, wall.y1);
      ctx.lineTo(wall.x2, wall.y2);
      ctx.stroke();
    });

    // Draw measure tool line
    if (measurePoints.length === 2) {
      ctx.beginPath();
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.moveTo(measurePoints[0].x, measurePoints[0].y);
      ctx.lineTo(measurePoints[1].x, measurePoints[1].y);
      ctx.stroke();
      ctx.setLineDash([]);

      const dx = measurePoints[1].x - measurePoints[0].x;
      const dy = measurePoints[1].y - measurePoints[0].y;
      const distPx = Math.sqrt(dx * dx + dy * dy);
      const distFt = (distPx / 15).toFixed(1); // 15px approx 1 foot

      const midX = (measurePoints[0].x + measurePoints[1].x) / 2;
      const midY = (measurePoints[0].y + measurePoints[1].y) / 2;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(midX - 30, midY - 12, 60, 20);
      ctx.fillStyle = '#22d3ee';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`${distFt} ft`, midX - 18, midY + 3);
    }

    ctx.globalAlpha = 1.0;
  }, [freehandStrokes, customWalls, measurePoints]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Canvas Mouse / Touch Handlers for Freehand Sketching
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === 'select') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    if (activeTool === 'pen' || activeTool === 'highlighter') {
      isDrawingRef.current = true;
      currentStrokeRef.current = {
        id: `strk-${Date.now()}`,
        tool: activeTool,
        color: activeTool === 'highlighter' ? '#fbbf24' : penColor,
        width: activeTool === 'highlighter' ? 14 : penWidth,
        points: [{ x, y }],
      };
    } else if (activeTool === 'measure') {
      if (measurePoints.length === 0 || measurePoints.length === 2) {
        setMeasurePoints([{ x, y }]);
      } else {
        setMeasurePoints((prev) => [...prev, { x, y }]);
      }
    } else if (activeTool === 'eraser') {
      // Remove strokes near this point
      setFreehandStrokes((prev) =>
        prev.filter((stroke) => {
          const hasClosePoint = stroke.points.some(
            (pt) => Math.hypot(pt.x - x, pt.y - y) < 25
          );
          return !hasClosePoint;
        })
      );
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    currentStrokeRef.current.points.push({ x, y });

    // Live draw current stroke
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = currentStrokeRef.current.color;
    ctx.lineWidth = currentStrokeRef.current.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = currentStrokeRef.current.tool === 'highlighter' ? 0.35 : 0.9;
    const pts = currentStrokeRef.current.points;
    if (pts.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
  };

  const handleMouseUp = () => {
    if (isDrawingRef.current && currentStrokeRef.current) {
      const stroke = currentStrokeRef.current;
      setFreehandStrokes((prev) => [...prev, stroke]);
      isDrawingRef.current = false;
      currentStrokeRef.current = null;
    }
  };

  // Convert Sketch to Design (AI synthesis)
  const handleConvertSketchToDesign = async () => {
    setIsConvertingSketch(true);
    const annotationsCount = freehandStrokes.length + customWalls.length;
    const synthesisNote = `User added ${annotationsCount} freehand modifications, including internal partition adjustments and room zoning markings. Synthesize into refined architectural plan.`;

    await handleGeneratePlan(synthesisNote);
    setIsConvertingSketch(false);
    setActiveTool('select');
  };

  // Sync with project & BOQ
  const handleSyncToProjectAndBOQ = () => {
    if (!planResult) return;

    // 1. Update project built-up area and notes
    const updatedProject: Project = {
      ...activeProject,
      builtUpAreaSqFt: planResult.builtUpAreaSqFt,
      description: `${activeProject.description || ''}\n[AI 2D Floor Plan]: ${planResult.planTitle} (${planResult.plotDimensions}) with ${planResult.rooms.length} rooms and ${planResult.efficiencyRatio}% efficiency.`.trim(),
      updatedAt: new Date().toISOString(),
      auditLogs: [
        {
          id: `log-fp-${Date.now()}`,
          projectId: activeProject.id,
          actor: 'Gouse AI Floor Plan Sketch Studio',
          action: '2D Floor Plan Concept Generated & Synced',
          details: `Generated ${planResult.planTitle} (${planResult.builtUpAreaSqFt} sq.ft, ${planResult.rooms.length} rooms). Carpet Area: ${planResult.netCarpetAreaSqFt} sq.ft.`,
          timestamp: new Date().toISOString(),
        },
        ...(activeProject.auditLogs || []),
      ],
    };
    onUpdateProject(updatedProject);

    // 2. Inject or update corresponding BOQ line items
    if (onUpdateBOQItems) {
      const boqUpdates: BOQItem[] = [
        {
          id: `boq-sketch-masonry-${Date.now()}`,
          name: `Autoclaved Aerated Concrete (AAC) Block Masonry (per ${planResult.planTitle})`,
          category: 'Masonry',
          unit: 'sq.m',
          quantity: Math.round(planResult.boqEstimates.wallMasonrySqFt / 10.764),
          rate: 1850,
          amount: Math.round((planResult.boqEstimates.wallMasonrySqFt / 10.764) * 1850),
          notes: `Precision wall perimeter computed from AI 2D Floor Plan Sketch (${planResult.plotDimensions})`,
        },
        {
          id: `boq-sketch-flooring-${Date.now()}`,
          name: `Vitrified Flooring & Skirting (Carpet Area: ${planResult.netCarpetAreaSqFt} sq.ft)`,
          category: 'Finishes',
          unit: 'sq.ft',
          quantity: planResult.netCarpetAreaSqFt,
          rate: 165,
          amount: Math.round(planResult.netCarpetAreaSqFt * 165),
          notes: `Net room flooring computed across ${planResult.rooms.length} functional spaces`,
        },
        {
          id: `boq-sketch-doors-${Date.now()}`,
          name: `Flush Doors with Teak Wood Frames & Hardware`,
          category: 'Finishes',
          unit: 'Nos',
          quantity: planResult.boqEstimates.doorCount,
          rate: 14500,
          amount: planResult.boqEstimates.doorCount * 14500,
          notes: `Internal access door assemblies per floor plan opening schedule`,
        },
      ];

      // Merge into BOQ items
      const existingIds = new Set(boqItems.map((b) => b.id));
      const filtered = boqItems.filter((b) => !b.name.includes('AI 2D Floor Plan'));
      onUpdateBOQItems([...filtered, ...boqUpdates]);
    }

    setSyncFeedback('✓ Successfully synchronized floor plan & injected BOQ takeoff line items!');
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  // WhatsApp share
  const handleWhatsAppShare = () => {
    if (!planResult) return;
    const roomList = planResult.rooms.map((r) => `• ${r.name}: ${r.dimensionsFt} (${r.areaSqFt} sq.ft)`).join('\n');
    const text = encodeURIComponent(
      `*GOUSE AI 2D FLOOR PLAN CONCEPTUAL SKETCH*\n` +
        `Project: ${activeProject.name} (${planResult.projectType})\n` +
        `Built-Up: ${planResult.builtUpAreaSqFt.toLocaleString()} sq.ft | Carpet: ${planResult.netCarpetAreaSqFt.toLocaleString()} sq.ft (${planResult.efficiencyRatio}% efficiency)\n` +
        `Plot Envelope: ${planResult.plotDimensions} • Facing: ${planResult.facing}\n\n` +
        `*Room Schedule:*\n${roomList}\n\n` +
        `Design by Ar. S. Gouse Architectural Practice (+91 8073947241)`
    );
    window.open(`https://wa.me/918073947241?text=${text}`, '_blank');
  };

  // Print drawing sheet
  const handlePrint = () => {
    window.print();
  };

  // Download SVG
  const handleDownloadSVG = () => {
    const svgElem = document.getElementById('floorplan-sketch-svg');
    if (!svgElem) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgElem);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeProject.name.toLowerCase().replace(/\s+/g, '_')}_floorplan_sketch.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Style background classes
  const getCanvasBgClass = () => {
    switch (styleTheme) {
      case 'blueprint':
        return 'bg-[#0f2438] border-cyan-900/60 shadow-inner';
      case 'watercolor':
        return 'bg-[#fcfaf2] border-amber-900/20 text-slate-900 shadow-sm';
      case 'minimal':
        return 'bg-slate-950 border-slate-800 shadow-inner';
      case 'sketch':
      default:
        return 'bg-[#181d24] border-slate-800 shadow-inner';
    }
  };

  const getCanvasGridStroke = () => {
    switch (styleTheme) {
      case 'blueprint':
        return 'rgba(6, 182, 212, 0.12)';
      case 'watercolor':
        return 'rgba(180, 83, 9, 0.08)';
      case 'minimal':
        return 'rgba(255, 255, 255, 0.05)';
      case 'sketch':
      default:
        return 'rgba(245, 158, 11, 0.08)';
    }
  };

  const getWallStrokeColor = () => {
    switch (styleTheme) {
      case 'blueprint':
        return '#38bdf8';
      case 'watercolor':
        return '#451a03';
      case 'minimal':
        return '#f1f5f9';
      case 'sketch':
      default:
        return '#f59e0b';
    }
  };

  return (
    <div id="floorplan-sketch-tool-root" className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & PARAMETRIC CONTROL DECK                                  */}
      {/* ========================================================================= */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="h-8 w-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Compass className="w-4 h-4 stroke-[2.2]" />
              </span>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>AI 2D Floor Plan Conceptual Sketcher</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                  Sketch-to-Design
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Generates calibrated 2D architectural conceptual sketches based on built-up area and typology with interactive hand-sketch overlay
            </p>
          </div>

          {/* Quick Active Project Details */}
          <div className="flex items-center gap-3 text-xs font-mono bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2">
            <FolderKanban className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="text-slate-400">Project: </span>
              <strong className="text-white">{activeProject.name}</strong>
              <span className="text-slate-500"> ({activeProject.location || 'Bangalore'})</span>
            </div>
          </div>
        </div>

        {/* Parametric Input Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-800/80">
          {/* Built-up area */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono uppercase text-slate-400 block font-semibold">
              Built-Up Area (sq.ft)
            </label>
            <div className="flex items-center gap-1.5">
              <input
                id="input-sketch-builtup-area"
                type="number"
                min={600}
                max={20000}
                step={100}
                value={builtUpArea}
                onChange={(e) => setBuiltUpArea(Number(e.target.value) || 2400)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pt-0.5">
              {[1200, 2400, 3500, 4800].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setBuiltUpArea(preset)}
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded transition ${
                    builtUpArea === preset
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Typology */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono uppercase text-slate-400 block font-semibold">
              Project Typology
            </label>
            <select
              id="select-sketch-typology"
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="Residential Villa">Residential Villa (G+1)</option>
              <option value="Luxury Duplex 4BHK">Luxury Duplex 4BHK</option>
              <option value="Compact 3BHK Apartment">Compact 3BHK Apartment</option>
              <option value="Commercial Office Suite">Commercial Corporate Office</option>
              <option value="PG & Co-Living Unit">PG &amp; Co-Living 12-Bed Floor</option>
              <option value="Boutique Clinic & Pharmacy">Boutique Clinic / Retail</option>
            </select>
          </div>

          {/* Facing */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono uppercase text-slate-400 block font-semibold">
              Plot Road Facing (Vastu)
            </label>
            <select
              id="select-sketch-facing"
              value={facing}
              onChange={(e) => setFacing(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none font-mono"
            >
              <option value="North">North (Kuber / Prosperous)</option>
              <option value="East">East (Surya / Auspicious)</option>
              <option value="West">West (Varuna / Elevated)</option>
              <option value="South">South (Yama / Commercial)</option>
            </select>
          </div>

          {/* Style Theme */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono uppercase text-slate-400 block font-semibold">
              Sketch Presentation Style
            </label>
            <select
              id="select-sketch-style"
              value={styleTheme}
              onChange={(e) => setStyleTheme(e.target.value as StyleTheme)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="sketch">✏️ Architectural Sketch Paper</option>
              <option value="blueprint">📐 Cyanotype Blueprint CAD</option>
              <option value="minimal">🏛️ Modern Minimal Presentation</option>
              <option value="watercolor">🎨 Watercolor Spatial Wash</option>
            </select>
          </div>

          {/* Primary Action Button */}
          <div className="flex flex-col justify-end">
            <button
              id="btn-generate-floorplan-sketch"
              type="button"
              onClick={() => handleGeneratePlan()}
              disabled={isGenerating}
              className="w-full py-2 px-3.5 rounded-lg bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 hover:from-amber-400 hover:to-yellow-200 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 transition disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Generating Sketch...' : 'Generate 2D Sketch'}</span>
            </button>
          </div>
        </div>

        {/* Custom Program Requirements input */}
        <div className="pt-2 flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            id="input-sketch-custom-requirements"
            type="text"
            placeholder="Custom requirements (e.g. 4 bedrooms, open kitchen with island, double-height living, central courtyard)..."
            value={userRequirements}
            onChange={(e) => setUserRequirements(e.target.value)}
            className="flex-1 bg-slate-950/70 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500/60"
          />
          {userRequirements && (
            <button
              type="button"
              onClick={() => setUserRequirements('')}
              className="text-xs text-slate-400 hover:text-white px-2"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Sync Feedback Toast */}
      {syncFeedback && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-medium flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
          {onNavigateToBOQ && (
            <button
              type="button"
              onClick={onNavigateToBOQ}
              className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition"
            >
              View in BOQ Schedule
            </button>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MAIN SKETCH-TO-DESIGN WORKSPACE (CANVAS + TOOLKIT)                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Interactive Drawing Canvas & Tools */}
        <div className="lg:col-span-8 space-y-3">
          {/* Sketch-to-Design Toolbar */}
          <div className="flex items-center justify-between gap-2 p-2 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto scrollbar-none">
            {/* Drawing Tool Selectors */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTool('select')}
                className={`p-2 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                  activeTool === 'select'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="Select & Inspect Room"
              >
                <Move className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Select</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTool('pen')}
                className={`p-2 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                  activeTool === 'pen'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="Freehand Sketch Pen - Doodle modifications"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sketch Pen</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTool('highlighter')}
                className={`p-2 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                  activeTool === 'highlighter'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="Highlighter Wash - Highlight spatial zones"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Highlight</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTool('eraser')}
                className={`p-2 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                  activeTool === 'eraser'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="Eraser - Erase sketch marks"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Eraser</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTool('measure')}
                className={`p-2 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                  activeTool === 'measure'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="Measure Distance Ruler"
              >
                <Ruler className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Measure</span>
              </button>
            </div>

            {/* Pen Color Picker & Clear */}
            <div className="flex items-center gap-2">
              {activeTool === 'pen' && (
                <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                  {['#ef4444', '#f59e0b', '#06b6d4', '#10b981', '#f1f5f9'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setPenColor(c)}
                      className={`w-3.5 h-3.5 rounded-full transition-transform ${
                        penColor === c ? 'scale-125 ring-2 ring-white/60' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              )}

              {freehandStrokes.length > 0 && (
                <button
                  type="button"
                  onClick={() => setFreehandStrokes([])}
                  className="px-2 py-1 rounded text-[11px] text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="Clear Freehand Markups"
                >
                  Clear Sketch ({freehandStrokes.length})
                </button>
              )}

              {/* AI Sketch-to-Design Synthesis CTA */}
              <button
                id="btn-convert-sketch-to-design"
                type="button"
                onClick={handleConvertSketchToDesign}
                disabled={isConvertingSketch}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white font-bold text-xs shadow transition flex items-center gap-1.5 shrink-0"
                title="Convert Hand-Drawn Sketch Annotations to Formal CAD Geometry"
              >
                <Zap className={`w-3.5 h-3.5 ${isConvertingSketch ? 'animate-spin' : ''}`} />
                <span>{isConvertingSketch ? 'Synthesizing...' : 'Convert Sketch to Design'}</span>
              </button>
            </div>
          </div>

          {/* Interactive SVG + Canvas Layer Viewport */}
          <div
            className={`relative w-full aspect-[4/3] rounded-2xl overflow-hidden border transition-colors select-none ${getCanvasBgClass()}`}
          >
            {/* SVG Architectural CAD Layer */}
            <svg
              id="floorplan-sketch-svg"
              viewBox="0 0 800 560"
              className="absolute inset-0 w-full h-full pointer-events-auto"
            >
              <defs>
                {/* Architectural Drafting Grid */}
                <pattern
                  id="sketch-grid-pattern"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 20 0 L 0 0 0 20"
                    fill="none"
                    stroke={getCanvasGridStroke()}
                    strokeWidth="0.75"
                  />
                </pattern>

                {/* Wall Hatch Pattern */}
                <pattern
                  id="wall-hatch-pattern"
                  width="8"
                  height="8"
                  patternTransform="rotate(45 0 0)"
                  patternUnits="userSpaceOnUse"
                >
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="8"
                    stroke={styleTheme === 'blueprint' ? '#0284c7' : '#94a3b8'}
                    strokeWidth="1.2"
                  />
                </pattern>
              </defs>

              {/* Grid Background */}
              <rect width="800" height="560" fill="url(#sketch-grid-pattern)" />

              {/* Plot Boundary with Setback Lines */}
              <rect
                x="50"
                y="40"
                width="700"
                height="480"
                fill="none"
                stroke={styleTheme === 'blueprint' ? '#0ea5e9' : '#64748b'}
                strokeWidth="1"
                strokeDasharray="6,4"
              />
              <text
                x="60"
                y="55"
                fill={styleTheme === 'blueprint' ? '#38bdf8' : '#94a3b8'}
                fontSize="10"
                fontFamily="monospace"
              >
                PLOT ENVELOPE: {planResult?.plotDimensions || "40'0\" x 60'0\""} (Front Setback 3.0m • Sides 1.2m)
              </text>

              {/* Render Room Blocks */}
              {planResult?.rooms.map((room) => {
                const colors = CATEGORY_COLORS[room.category] || CATEGORY_COLORS.living;
                const isSelected = selectedRoomId === room.id;

                return (
                  <g
                    key={room.id}
                    onClick={() => setSelectedRoomId(room.id)}
                    className="cursor-pointer transition-opacity"
                  >
                    {/* Room Floor Fill */}
                    <rect
                      x={room.x}
                      y={room.y}
                      width={room.width}
                      height={room.height}
                      fill={colors.fill}
                      stroke={isSelected ? '#f59e0b' : getWallStrokeColor()}
                      strokeWidth={isSelected ? '2.5' : '1.5'}
                      rx="2"
                    />

                    {/* Room Hatch Header Strip */}
                    <rect
                      x={room.x}
                      y={room.y}
                      width={room.width}
                      height="22"
                      fill={isSelected ? 'rgba(245, 158, 11, 0.25)' : colors.fill}
                    />

                    {/* Room Name Label */}
                    <text
                      x={room.x + 8}
                      y={room.y + 15}
                      fill={styleTheme === 'watercolor' ? '#0f172a' : '#f8fafc'}
                      fontSize="11"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                    >
                      {room.name}
                    </text>

                    {/* Dimensions & Area Label */}
                    {showDimensions && (
                      <text
                        x={room.x + 8}
                        y={room.y + 36}
                        fill={styleTheme === 'blueprint' ? '#38bdf8' : '#cbd5e1'}
                        fontSize="10"
                        fontFamily="monospace"
                      >
                        {room.dimensionsFt} • {room.areaSqFt} sq.ft
                      </text>
                    )}

                    {/* Vastu Direction Tag */}
                    {showVastuTags && room.vastuDirection && (
                      <text
                        x={room.x + 8}
                        y={room.y + room.height - 8}
                        fill={styleTheme === 'blueprint' ? '#06b6d4' : '#f59e0b'}
                        fontSize="8.5"
                        fontFamily="monospace"
                        fontWeight="600"
                      >
                        🧭 {room.vastuDirection}
                      </text>
                    )}

                    {/* Architectural Door Swing Symbol */}
                    <path
                      d={`M ${room.x + 10} ${room.y + room.height} A 18 18 0 0 1 ${room.x + 28} ${room.y + room.height - 18}`}
                      fill="none"
                      stroke={styleTheme === 'blueprint' ? '#38bdf8' : '#94a3b8'}
                      strokeWidth="1.2"
                    />
                    <line
                      x1={room.x + 10}
                      y1={room.y + room.height}
                      x2={room.x + 10}
                      y2={room.y + room.height - 18}
                      stroke={styleTheme === 'blueprint' ? '#38bdf8' : '#94a3b8'}
                      strokeWidth="1.2"
                    />

                    {/* Window Symbol along Outer Wall */}
                    <rect
                      x={room.x + room.width / 2 - 20}
                      y={room.y - 2}
                      width="40"
                      height="4"
                      fill={styleTheme === 'blueprint' ? '#38bdf8' : '#cbd5e1'}
                    />
                  </g>
                );
              })}

              {/* Exterior Dimension String & Ticks along Bottom */}
              <line
                x1="70"
                y1="530"
                x2="730"
                y2="530"
                stroke={styleTheme === 'blueprint' ? '#38bdf8' : '#94a3b8'}
                strokeWidth="1"
              />
              <line x1="70" y1="524" x2="70" y2="536" stroke={styleTheme === 'blueprint' ? '#38bdf8' : '#94a3b8'} strokeWidth="1.5" />
              <line x1="730" y1="524" x2="730" y2="536" stroke={styleTheme === 'blueprint' ? '#38bdf8' : '#94a3b8'} strokeWidth="1.5" />
              <text
                x="370"
                y="544"
                fill={styleTheme === 'blueprint' ? '#38bdf8' : '#94a3b8'}
                fontSize="10"
                fontFamily="monospace"
                textAnchor="middle"
              >
                FRONT PLOT FACING: {facing.toUpperCase()} • 40&apos;0&quot;
              </text>

              {/* Compass Rose */}
              <g transform="translate(735, 80)">
                <circle r="18" fill="none" stroke={styleTheme === 'blueprint' ? '#38bdf8' : '#f59e0b'} strokeWidth="1" />
                <polygon points="0,-16 -4,0 4,0" fill="#ef4444" />
                <polygon points="0,16 -4,0 4,0" fill="#94a3b8" />
                <text x="0" y="-19" fill="#ef4444" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                  N
                </text>
              </g>

              {/* Title Block & Ar. S. Gouse Registration Stamp */}
              <g transform="translate(560, 480)">
                <rect width="180" height="42" fill="rgba(15, 23, 42, 0.85)" stroke="#475569" strokeWidth="0.75" rx="3" />
                <text x="8" y="14" fill="#f59e0b" fontSize="9" fontWeight="bold" fontFamily="monospace">
                  GOUSE AI ARCHITECTURAL STUDIO
                </text>
                <text x="8" y="26" fill="#f8fafc" fontSize="8" fontFamily="sans-serif">
                  Ar. S. Gouse | Reg: CA/2016
                </text>
                <text x="8" y="36" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">
                  Scale 1:100 • {new Date().toLocaleDateString('en-IN')}
                </text>
              </g>
            </svg>

            {/* Freehand HTML5 Canvas Overlay for Doodles & Sketches */}
            <canvas
              ref={canvasRef}
              width={800}
              height={560}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className={`absolute inset-0 w-full h-full ${
                activeTool === 'select'
                  ? 'pointer-events-none'
                  : 'pointer-events-auto cursor-crosshair'
              }`}
            />

            {/* Active Drawing Tool Watermark Pill */}
            {activeTool !== 'select' && (
              <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur border border-amber-500/40 text-[10px] font-mono text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>
                  Tool: <strong>{activeTool.toUpperCase()}</strong> (Doodle on plan, then click Convert to Design)
                </span>
              </div>
            )}
          </div>

          {/* Canvas View Options Bar */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-1">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDimensions}
                  onChange={(e) => setShowDimensions(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
                />
                <span>Dimensions</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showVastuTags}
                  onChange={(e) => setShowVastuTags(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
                />
                <span>Vastu Direction Tags</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadSVG}
                className="hover:text-amber-400 flex items-center gap-1 transition"
                title="Download Vector SVG Drawing"
              >
                <Download className="w-3.5 h-3.5" />
                <span>SVG</span>
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={handlePrint}
                className="hover:text-amber-400 flex items-center gap-1 transition"
                title="Print Floor Plan Drawing"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
                title="WhatsApp Layout to Client or Ar. S. Gouse"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Room Schedule, Metrics & BOQ Sync */}
        <div className="lg:col-span-4 space-y-4">
          {/* Spatial Efficiency Card */}
          {planResult && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-slate-400">
                  Spatial Efficiency Metrics
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  {planResult.efficiencyRatio}% Carpet Efficiency
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-mono">Gross Built-Up</span>
                  <span className="text-lg font-bold font-mono text-white">
                    {planResult.builtUpAreaSqFt.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400"> sq.ft</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-mono">Net Carpet Area</span>
                  <span className="text-lg font-bold font-mono text-amber-400">
                    {planResult.netCarpetAreaSqFt.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400"> sq.ft</span>
                </div>
              </div>

              {/* Synchronize to Project & BOQ CTA */}
              <button
                id="btn-sync-floorplan-to-project"
                type="button"
                onClick={handleSyncToProjectAndBOQ}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Sync to Project &amp; Update BOQ</span>
              </button>
            </div>
          )}

          {/* Room Schedule & Dimensions Table */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Room Schedule ({planResult?.rooms.length || 0})</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">IS 456 Standards</span>
            </div>

            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {planResult?.rooms.map((room) => {
                const colors = CATEGORY_COLORS[room.category] || CATEGORY_COLORS.living;
                const isSelected = selectedRoomId === room.id;

                return (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`p-2 rounded-xl transition border cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/50'
                        : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${colors.bg}`} />
                        <span className="font-semibold text-slate-200 truncate">{room.name}</span>
                      </div>
                      <span className="font-mono text-slate-400 text-[11px] shrink-0">
                        {room.dimensionsFt}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 font-mono">
                      <span>Area: <strong className="text-amber-300">{room.areaSqFt} sq.ft</strong></span>
                      {room.vastuDirection && (
                        <span className="text-emerald-400">{room.vastuDirection.split(' ')[0]}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Vastu & Architectural Design Rationale */}
          {planResult && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
              <h4 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Design &amp; Vastu Principles</span>
              </h4>

              <ul className="space-y-1.5 text-slate-300">
                {planResult.vastuNotes.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-400 shrink-0 font-bold">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                  BOQ Material Takeoff Estimates:
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono text-slate-300">
                  <div>Masonry: <strong className="text-white">{planResult.boqEstimates.wallMasonrySqFt} sq.ft</strong></div>
                  <div>Doors: <strong className="text-white">{planResult.boqEstimates.doorCount} Nos</strong></div>
                  <div>Flooring: <strong className="text-white">{planResult.boqEstimates.flooringSqFt} sq.ft</strong></div>
                  <div>Windows: <strong className="text-white">{planResult.boqEstimates.windowCount} Nos</strong></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
