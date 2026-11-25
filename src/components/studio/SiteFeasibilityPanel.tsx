import React, { useState, useMemo } from 'react';
import {
  Check,
  ArrowRight,
  Compass,
  Building2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { Project, BuildingFloor } from '../../types';
import { CurrencyCode, formatCurrency } from '../../utils/formatters';

interface ZoningPreset {
  id: string;
  label: string;
  maxFar: number;
  maxCoveragePct: number;
  frontSetbackFt: number;
  rearSetbackFt: number;
  sideSetbackFt: number;
  defaultCostPerSqFt: number;
  defaultRentPerSqFtMonth: number;
}

const ZONING_PRESETS: ZoningPreset[] = [
  {
    id: 'bbmp',
    label: 'Bangalore · BBMP / Nambike Nakshe',
    maxFar: 2.25,
    maxCoveragePct: 65,
    frontSetbackFt: 10,
    rearSetbackFt: 6,
    sideSetbackFt: 5,
    defaultCostPerSqFt: 2450,
    defaultRentPerSqFtMonth: 58,
  },
  {
    id: 'ghmc',
    label: 'Hyderabad · GHMC',
    maxFar: 2.5,
    maxCoveragePct: 60,
    frontSetbackFt: 10,
    rearSetbackFt: 6.5,
    sideSetbackFt: 5,
    defaultCostPerSqFt: 2300,
    defaultRentPerSqFtMonth: 52,
  },
  {
    id: 'mcgm',
    label: 'Mumbai · MCGM DCPR',
    maxFar: 2.7,
    maxCoveragePct: 55,
    frontSetbackFt: 12,
    rearSetbackFt: 8,
    sideSetbackFt: 6,
    defaultCostPerSqFt: 3250,
    defaultRentPerSqFtMonth: 115,
  },
  {
    id: 'mcd',
    label: 'Delhi NCR · MCD / MPD',
    maxFar: 2.0,
    maxCoveragePct: 66,
    frontSetbackFt: 10,
    rearSetbackFt: 6,
    sideSetbackFt: 4,
    defaultCostPerSqFt: 2550,
    defaultRentPerSqFtMonth: 62,
  },
  {
    id: 'dubai',
    label: 'Dubai · DDA / Trakhees',
    maxFar: 3.0,
    maxCoveragePct: 50,
    frontSetbackFt: 15,
    rearSetbackFt: 10,
    sideSetbackFt: 8,
    defaultCostPerSqFt: 5200,
    defaultRentPerSqFtMonth: 145,
  },
];

type TypologyOption = 'villa' | 'pg_coliving' | 'apartments' | 'commercial';

export interface SiteFeasibilityPanelProps {
  activeProject: Project;
  boqSubtotal: number;
  currency: CurrencyCode;
  onUpdateProject: (updated: Project) => void;
  onNavigateTab: (tab: 'projects' | 'boq' | 'broker') => void;
  onCloseModal: () => void;
}

export const SiteFeasibilityPanel: React.FC<SiteFeasibilityPanelProps> = ({
  activeProject,
  boqSubtotal,
  currency,
  onUpdateProject,
  onNavigateTab,
  onCloseModal,
}) => {
  const initialTypology: TypologyOption = useMemo(() => {
    const t = `${activeProject.projectType} ${activeProject.name}`.toLowerCase();
    if (t.includes('pg') || t.includes('co-living') || t.includes('coliving')) return 'pg_coliving';
    if (t.includes('commercial') || t.includes('office') || t.includes('retail')) return 'commercial';
    if (t.includes('apartment') || t.includes('mixed')) return 'apartments';
    return 'villa';
  }, [activeProject.projectType, activeProject.name]);

  const [presetId, setPresetId] = useState<string>('bbmp');
  const [typology, setTypology] = useState<TypologyOption>(initialTypology);
  const [plotWidthFt, setPlotWidthFt] = useState<number>(40);
  const [plotDepthFt, setPlotDepthFt] = useState<number>(60);
  const [roadWidthFt, setRoadWidthFt] = useState<number>(40);
  const [floorsCount, setFloorsCount] = useState<number>(
    Math.max(2, activeProject.floors?.filter((f) => f.levelIndex >= 0 && f.shortCode !== 'RF').length || 3)
  );
  const [maxFar, setMaxFar] = useState<number>(2.25);
  const [frontSetbackFt, setFrontSetbackFt] = useState<number>(10);
  const [rearSetbackFt, setRearSetbackFt] = useState<number>(6);
  const [sideSetbackFt, setSideSetbackFt] = useState<number>(5);

  const liveBoqRate =
    boqSubtotal > 0 && (activeProject.builtUpAreaSqFt || 0) > 0
      ? Math.round(boqSubtotal / (activeProject.builtUpAreaSqFt || 1))
      : 2450;

  const [costPerSqFt, setCostPerSqFt] = useState<number>(liveBoqRate);
  const [rentPerSqFtMonth, setRentPerSqFtMonth] = useState<number>(58);
  const [syncedToProject, setSyncedToProject] = useState<boolean>(false);

  const handlePresetChange = (id: string) => {
    setPresetId(id);
    const p = ZONING_PRESETS.find((z) => z.id === id);
    if (!p) return;
    setMaxFar(p.maxFar);
    setFrontSetbackFt(p.frontSetbackFt);
    setRearSetbackFt(p.rearSetbackFt);
    setSideSetbackFt(p.sideSetbackFt);
    setRentPerSqFtMonth(p.defaultRentPerSqFtMonth);
  };

  const calc = useMemo(() => {
    const plotArea = Math.max(400, plotWidthFt * plotDepthFt);
    const buildableW = Math.max(8, plotWidthFt - sideSetbackFt * 2);
    const buildableD = Math.max(10, plotDepthFt - frontSetbackFt - rearSetbackFt);
    const footprintSqFt = Math.round(buildableW * buildableD);
    const groundCoveragePct = Math.round((footprintSqFt / plotArea) * 1000) / 10;

    const maxPermissibleArea = Math.round(plotArea * maxFar);
    const proposedBuiltUpArea = Math.round(footprintSqFt * floorsCount);
    const achievedFar = Math.round((proposedBuiltUpArea / plotArea) * 100) / 100;

    const preset = ZONING_PRESETS.find((z) => z.id === presetId) || ZONING_PRESETS[0];
    const farCompliant = proposedBuiltUpArea <= maxPermissibleArea;
    const coverageCompliant = groundCoveragePct <= preset.maxCoveragePct;
    const roadCompliant = roadWidthFt >= 30 || floorsCount <= 3;

    // Net usable efficiency (excluding circulation/shafts/walls)
    const efficiency = typology === 'villa' ? 0.84 : typology === 'pg_coliving' ? 0.78 : 0.76;
    const netUsableSqFt = Math.round(proposedBuiltUpArea * efficiency);

    // Yield estimates
    const estimatedUnits =
      typology === 'pg_coliving'
        ? Math.max(6, Math.floor(netUsableSqFt / 135)) // beds
        : typology === 'apartments'
        ? Math.max(2, Math.floor(netUsableSqFt / 1150)) // 2BHK units
        : typology === 'commercial'
        ? Math.max(2, Math.floor(netUsableSqFt / 850)) // office/retail bays
        : 1; // single villa

    const parkingBays = Math.max(1, Math.floor((plotWidthFt - sideSetbackFt * 2) / 9));

    // Financial pro forma
    const totalBuildCost = Math.round(proposedBuiltUpArea * costPerSqFt);
    const monthlyGrossIncome =
      typology === 'pg_coliving'
        ? estimatedUnits * 11500
        : Math.round(netUsableSqFt * rentPerSqFtMonth);
    const annualGrossIncome = monthlyGrossIncome * 12;
    const grossYieldPct =
      totalBuildCost > 0 ? Math.round((annualGrossIncome / totalBuildCost) * 1000) / 10 : 0;
    const paybackYears =
      annualGrossIncome > 0 ? Math.round((totalBuildCost / annualGrossIncome) * 10) / 10 : 0;

    return {
      plotArea,
      buildableW,
      buildableD,
      footprintSqFt,
      groundCoveragePct,
      maxPermissibleArea,
      proposedBuiltUpArea,
      achievedFar,
      farCompliant,
      coverageCompliant,
      roadCompliant,
      netUsableSqFt,
      estimatedUnits,
      parkingBays,
      totalBuildCost,
      monthlyGrossIncome,
      annualGrossIncome,
      grossYieldPct,
      paybackYears,
      maxCoveragePct: preset.maxCoveragePct,
    };
  }, [
    plotWidthFt,
    plotDepthFt,
    roadWidthFt,
    floorsCount,
    maxFar,
    frontSetbackFt,
    rearSetbackFt,
    sideSetbackFt,
    typology,
    presetId,
    costPerSqFt,
    rentPerSqFtMonth,
  ]);

  const handleApplyToProject = () => {
    const newFloors: BuildingFloor[] = [
      {
        id: 'substructure',
        name: 'Substructure & Foundation',
        shortCode: 'SUB',
        levelIndex: -1,
        elevation: '-2.50m',
        areaSqFt: calc.footprintSqFt,
        heightMeters: 2.5,
        description: `Footings & sump sized for ${calc.footprintSqFt.toLocaleString()} sq.ft footprint`,
      },
    ];

    for (let i = 0; i < floorsCount; i++) {
      const id =
        i === 0 ? 'ground_floor' : i === 1 ? 'first_floor' : i === 2 ? 'second_floor' : `floor_${i}`;
      const shortCode = i === 0 ? 'GF' : `${i}F`;
      const name =
        i === 0
          ? 'Ground Floor (Level 0)'
          : i === 1
          ? 'First Floor (Level 1)'
          : i === 2
          ? 'Second Floor (Level 2)'
          : `Floor ${i} (Level ${i})`;
      newFloors.push({
        id,
        name,
        shortCode,
        levelIndex: i,
        elevation: i === 0 ? '±0.00m' : `+${(i * 3.3).toFixed(2)}m`,
        areaSqFt: calc.footprintSqFt,
        heightMeters: 3.3,
        description:
          i === 0
            ? `Stilt / ground entry (${calc.parkingBays} vehicle bays) within ${frontSetbackFt}ft front setback`
            : `Typical floor plate (${calc.footprintSqFt.toLocaleString()} sq.ft)`,
      });
    }

    newFloors.push({
      id: 'terrace',
      name: 'Terrace & Roof Level',
      shortCode: 'RF',
      levelIndex: floorsCount,
      elevation: `+${(floorsCount * 3.3).toFixed(2)}m`,
      areaSqFt: Math.round(calc.footprintSqFt * 0.65),
      heightMeters: 1.2,
      description: 'OHT, solar PV pergola & waterproofing deck',
    });

    onUpdateProject({
      ...activeProject,
      builtUpAreaSqFt: calc.proposedBuiltUpArea,
      floors: newFloors,
      auditLogs: [
        {
          id: `log-feas-${Date.now()}`,
          projectId: activeProject.id,
          actor: 'Site Feasibility Desk',
          action: 'Synced Plot Massing & Floor Schedule',
          details: `Plot ${plotWidthFt}×${plotDepthFt}ft (${calc.plotArea.toLocaleString()} sq.ft) → ${calc.proposedBuiltUpArea.toLocaleString()} sq.ft across ${floorsCount} floors (FAR ${calc.achievedFar})`,
          timestamp: new Date().toISOString(),
        },
        ...(activeProject.auditLogs || []),
      ],
      updatedAt: new Date().toISOString(),
    });

    setSyncedToProject(true);
    setTimeout(() => setSyncedToProject(false), 3000);
  };

  // Scaled SVG blueprint coordinates (viewport 360 x 260)
  const svgMetrics = useMemo(() => {
    const maxBoxW = 240;
    const maxBoxH = 165;
    const scale = Math.min(maxBoxW / Math.max(10, plotWidthFt), maxBoxH / Math.max(10, plotDepthFt));
    const pW = plotWidthFt * scale;
    const pH = plotDepthFt * scale;
    const pX = (360 - pW) / 2;
    const pY = 26;

    const sLeft = sideSetbackFt * scale;
    const sRear = rearSetbackFt * scale;
    const sFront = frontSetbackFt * scale;
    const bW = Math.max(8, pW - sLeft * 2);
    const bH = Math.max(8, pH - sRear - sFront);
    const bX = pX + sLeft;
    const bY = pY + sRear;

    return { pX, pY, pW, pH, bX, bY, bW, bH, sFront };
  }, [plotWidthFt, plotDepthFt, sideSetbackFt, rearSetbackFt, frontSetbackFt]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Left Column: Controls */}
      <div className="lg:col-span-5 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white">
              Site Feasibility &amp; Plot Yield Modeler
            </h3>
            <p className="text-xs text-slate-400">
              Test zoning setbacks, FAR capacity, parking bays, and rental ROI before drafting.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCostPerSqFt(liveBoqRate)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-600 text-[11px] font-medium text-slate-300 hover:text-white inline-flex items-center gap-1 whitespace-nowrap shrink-0 transition"
            title="Sync build rate from active project BOQ"
          >
            <RefreshCw className="w-3 h-3 text-amber-400" />
            <span>Use BOQ Rate</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Municipal Zoning Code
            </label>
            <select
              value={presetId}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              {ZONING_PRESETS.map((z) => (
                <option key={z.id} value={z.id} className="bg-slate-900">
                  {z.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Development Typology
            </label>
            <select
              value={typology}
              onChange={(e) => setTypology(e.target.value as TypologyOption)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="villa" className="bg-slate-900">Residential Villa / Bungalow</option>
              <option value="pg_coliving" className="bg-slate-900">PG &amp; Co-Living Yield Block</option>
              <option value="apartments" className="bg-slate-900">Multi-Unit Rental Apartments</option>
              <option value="commercial" className="bg-slate-900">Mixed-Use Commercial</option>
            </select>
          </div>
        </div>

        {/* Plot & Floors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Plot Width (ft)</label>
            <input
              type="number"
              min={15}
              max={400}
              value={plotWidthFt}
              onChange={(e) => setPlotWidthFt(Math.max(15, Number(e.target.value) || 15))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Plot Depth (ft)</label>
            <input
              type="number"
              min={20}
              max={400}
              value={plotDepthFt}
              onChange={(e) => setPlotDepthFt(Math.max(20, Number(e.target.value) || 20))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Road Width (ft)</label>
            <input
              type="number"
              min={15}
              max={150}
              value={roadWidthFt}
              onChange={(e) => setRoadWidthFt(Math.max(15, Number(e.target.value) || 15))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Floors (Incl. GF)</label>
            <input
              type="number"
              min={1}
              max={12}
              value={floorsCount}
              onChange={(e) => setFloorsCount(Math.min(12, Math.max(1, Number(e.target.value) || 1)))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Setbacks & FAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Max FAR</label>
            <input
              type="number"
              step={0.1}
              min={0.8}
              max={6}
              value={maxFar}
              onChange={(e) => setMaxFar(Math.max(0.5, Number(e.target.value) || 1))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Front Setback (ft)</label>
            <input
              type="number"
              min={0}
              max={40}
              value={frontSetbackFt}
              onChange={(e) => setFrontSetbackFt(Math.max(0, Number(e.target.value) || 0))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Rear Setback (ft)</label>
            <input
              type="number"
              min={0}
              max={30}
              value={rearSetbackFt}
              onChange={(e) => setRearSetbackFt(Math.max(0, Number(e.target.value) || 0))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Side Setback (ft)</label>
            <input
              type="number"
              min={0}
              max={25}
              value={sideSetbackFt}
              onChange={(e) => setSideSetbackFt(Math.max(0, Number(e.target.value) || 0))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Pro Forma Financial Assumptions */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Build Cost / sq.ft ({currency})
            </label>
            <input
              type="number"
              min={500}
              step={50}
              value={costPerSqFt}
              onChange={(e) => setCostPerSqFt(Math.max(100, Number(e.target.value) || 0))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Monthly Rent / sq.ft ({currency})
            </label>
            <input
              type="number"
              min={10}
              step={2}
              value={rentPerSqFtMonth}
              onChange={(e) => setRentPerSqFtMonth(Math.max(1, Number(e.target.value) || 0))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Sync Actions */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            id="btn-feasibility-sync-project"
            type="button"
            onClick={handleApplyToProject}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition whitespace-nowrap shrink-0"
          >
            {syncedToProject ? <Check className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
            <span>{syncedToProject ? 'Synced Area & Floors' : 'Apply Massing to Active Project'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onCloseModal();
              onNavigateTab(typology === 'pg_coliving' ? 'broker' : 'boq');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-600 text-xs font-medium text-slate-200 transition whitespace-nowrap shrink-0"
          >
            <span>{typology === 'pg_coliving' ? 'Open Property & PG Hub' : 'Open BOQ Table'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right Column: Live 2D Plot Envelope Blueprint & Pro Forma Numbers */}
      <div className="lg:col-span-7 space-y-4">
        {/* Interactive 2D Plot Blueprint */}
        <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-white">
              Live Setback &amp; Buildable Footprint Diagram
            </span>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono tabular-nums">
              <span>{plotWidthFt} × {plotDepthFt} ft</span>
              <span aria-hidden="true">·</span>
              <span>{floorsCount} Floors</span>
            </div>
          </div>

          <div className="w-full rounded-lg bg-slate-900/90 border border-slate-800 overflow-hidden">
            <svg viewBox="0 0 360 250" className="w-full h-56 block">
              <defs>
                <pattern id="feasibilityGrid" width="18" height="18" patternUnits="userSpaceOnUse">
                  <path d="M 18 0 L 0 0 0 18" fill="none" stroke="rgba(148,163,184,0.08)" strokeWidth="0.7" />
                </pattern>
              </defs>
              <rect width="360" height="250" fill="url(#feasibilityGrid)" />

              {/* North indicator */}
              <g transform="translate(324, 28)">
                <circle cx="0" cy="0" r="12" fill="none" stroke="rgba(148,163,184,0.35)" strokeWidth="1" />
                <path d="M 0 -8 L 3.5 3 L 0 0.5 L -3.5 3 Z" fill="#f59e0b" />
                <text x="0" y="21" textAnchor="middle" fontSize="8" fill="#94a3b8" fontFamily="monospace">
                  N
                </text>
              </g>

              {/* Plot Boundary */}
              <rect
                x={svgMetrics.pX}
                y={svgMetrics.pY}
                width={svgMetrics.pW}
                height={svgMetrics.pH}
                fill="rgba(30,41,59,0.45)"
                stroke="#64748b"
                strokeWidth="1.2"
                strokeDasharray="4 3"
              />

              {/* Buildable Footprint */}
              <rect
                x={svgMetrics.bX}
                y={svgMetrics.bY}
                width={svgMetrics.bW}
                height={svgMetrics.bH}
                fill={calc.farCompliant ? 'rgba(245,158,11,0.16)' : 'rgba(239,68,68,0.16)'}
                stroke={calc.farCompliant ? '#f59e0b' : '#ef4444'}
                strokeWidth="1.8"
              />

              {/* Footprint Dimensions Text */}
              <text
                x={svgMetrics.bX + svgMetrics.bW / 2}
                y={svgMetrics.bY + svgMetrics.bH / 2 - 4}
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill="#f8fafc"
                fontFamily="monospace"
              >
                {calc.buildableW.toFixed(0)} × {calc.buildableD.toFixed(0)} ft
              </text>
              <text
                x={svgMetrics.bX + svgMetrics.bW / 2}
                y={svgMetrics.bY + svgMetrics.bH / 2 + 10}
                textAnchor="middle"
                fontSize="9"
                fill="#fbbf24"
                fontFamily="monospace"
              >
                {calc.footprintSqFt.toLocaleString()} sq.ft/floor
              </text>

              {/* Road Carriageway along Front */}
              <rect
                x={20}
                y={svgMetrics.pY + svgMetrics.pH + 10}
                width={320}
                height={26}
                rx={3}
                fill="rgba(15,23,42,0.9)"
                stroke="#334155"
                strokeWidth="1"
              />
              <line
                x1={32}
                y1={svgMetrics.pY + svgMetrics.pH + 23}
                x2={328}
                y2={svgMetrics.pY + svgMetrics.pH + 23}
                stroke="#475569"
                strokeWidth="1"
                strokeDasharray="8 6"
              />
              <text
                x={180}
                y={svgMetrics.pY + svgMetrics.pH + 26}
                textAnchor="middle"
                fontSize="8.5"
                fill="#cbd5e1"
                fontFamily="monospace"
              >
                FRONT APPROACH ROAD ({roadWidthFt} ft WIDE) · FRONT SETBACK {frontSetbackFt} ft
              </text>

              {/* Top plot label */}
              <text
                x={svgMetrics.pX + svgMetrics.pW / 2}
                y={svgMetrics.pY - 7}
                textAnchor="middle"
                fontSize="8.5"
                fill="#94a3b8"
                fontFamily="monospace"
              >
                REAR SETBACK {rearSetbackFt} ft · SIDE SETBACK {sideSetbackFt} ft EACH
              </text>
            </svg>
          </div>

          {/* Compliance Check Row (Hue + Explicit Text + Icon) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div
              className={`px-3 py-2 rounded-lg border flex items-center gap-2 ${
                calc.farCompliant
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {calc.farCompliant ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="truncate font-medium tabular-nums">
                FAR {calc.achievedFar} / {maxFar} max
              </span>
            </div>

            <div
              className={`px-3 py-2 rounded-lg border flex items-center gap-2 ${
                calc.coverageCompliant
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              {calc.coverageCompliant ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="truncate font-medium tabular-nums">
                Coverage {calc.groundCoveragePct}% ({calc.maxCoveragePct}% cap)
              </span>
            </div>

            <div className="px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate font-medium tabular-nums">
                {calc.parkingBays} Stilt Parking Bays
              </span>
            </div>
          </div>
        </div>

        {/* Pro Forma Capacity & ROI Table */}
        <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-800">
            <div className="p-3.5">
              <span className="text-[11px] text-slate-400 block">Plot / Max FAR Area</span>
              <span className="text-sm font-bold text-white tabular-nums">
                {calc.plotArea.toLocaleString()} / {calc.maxPermissibleArea.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-500 block">sq.ft</span>
            </div>
            <div className="p-3.5">
              <span className="text-[11px] text-slate-400 block">Proposed Built-Up</span>
              <span className="text-sm font-bold text-amber-300 tabular-nums">
                {calc.proposedBuiltUpArea.toLocaleString()} sq.ft
              </span>
              <span className="text-[11px] text-slate-500 block tabular-nums">
                Net usable {calc.netUsableSqFt.toLocaleString()} sq.ft
              </span>
            </div>
            <div className="p-3.5">
              <span className="text-[11px] text-slate-400 block">
                {typology === 'pg_coliving'
                  ? 'PG Capacity'
                  : typology === 'apartments'
                  ? 'Est. 2BHK Units'
                  : typology === 'commercial'
                  ? 'Commercial Bays'
                  : 'Estimated Build Cost'}
              </span>
              <span className="text-sm font-bold text-white tabular-nums">
                {typology === 'villa'
                  ? formatCurrency(calc.totalBuildCost, currency)
                  : `${calc.estimatedUnits} ${typology === 'pg_coliving' ? 'Beds' : 'Units'}`}
              </span>
              <span className="text-[11px] text-slate-500 block tabular-nums">
                Build {formatCurrency(calc.totalBuildCost, currency)}
              </span>
            </div>
            <div className="p-3.5">
              <span className="text-[11px] text-slate-400 block">Projected Gross Yield</span>
              <span className="text-sm font-bold text-emerald-400 tabular-nums">
                {calc.grossYieldPct}% / yr
              </span>
              <span className="text-[11px] text-slate-500 block tabular-nums">
                ~{formatCurrency(calc.monthlyGrossIncome, currency)}/mo · {calc.paybackYears}y payback
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
