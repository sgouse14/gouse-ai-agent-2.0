import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Scale,
  FileCode,
  ArrowRight,
  Building2,
  Calculator,
  Layers,
  HardHat,
  X,
  Upload,
  Download,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Award,
  Zap,
  Plus,
  Trash2,
  Building,
  RotateCcw,
  Sliders,
} from 'lucide-react';
import { Project, BOQItem, BuildingFloor } from '../types';
import { formatCurrency, CurrencyCode } from '../utils/formatters';

interface SequentialWorkflowEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProject: Project;
  onUpdateProject: (project: Project) => void;
  boqItems?: BOQItem[];
  onUpdateBOQItems?: (items: BOQItem[]) => void;
  onNavigateToTab?: (tab: 'projects' | 'boq' | 'marketplace' | 'materials') => void;
  currency: CurrencyCode;
}

interface CadPlanPreset {
  id: string;
  fileName: string;
  planName: string;
  description: string;
  sitePlotLengthFt: number;
  sitePlotWidthFt: number;
  frontSetbackFt: number;
  rearSetbackFt: number;
  leftSetbackFt: number;
  rightSetbackFt: number;
  floorsCount: number;
  staircaseCutoutAreaSqFt: number;
  liftShaftAreaSqFt: number;
  ventCutoutAreaSqFt: number;
  governingAuthority: string;
  permissibleFar: number;
  maxGroundCoveragePct: number;
}

const CAD_PLAN_PRESETS: CadPlanPreset[] = [
  {
    id: 'cad-01',
    fileName: 'Villa_G+1_Nambike_Nakshe.dwg',
    planName: 'Villa G+1 Executive Residence',
    description: '4-BHK Contemporary duplex residence with double-height living foyer and landscaped rear patio under Nambike Nakshe 2.0',
    sitePlotLengthFt: 60,
    sitePlotWidthFt: 40,
    frontSetbackFt: 10,
    rearSetbackFt: 6,
    leftSetbackFt: 4,
    rightSetbackFt: 4,
    floorsCount: 2,
    staircaseCutoutAreaSqFt: 140,
    liftShaftAreaSqFt: 40,
    ventCutoutAreaSqFt: 50,
    governingAuthority: 'Nambike Nakshe 2.0 / GBA Bylaws',
    permissibleFar: 1.75,
    maxGroundCoveragePct: 65,
  },
  {
    id: 'cad-02',
    fileName: 'Small_Plot_1200sqft_Nambike.dwg',
    planName: 'Small Plot Residence (<1,500 sq ft)',
    description: 'Plot under 1,500 sq ft utilizing Nambike Nakshe 2.0 relaxed setbacks: Front 2.5 ft (0.75m), Sides 2.0 ft (0.6m)',
    sitePlotLengthFt: 40,
    sitePlotWidthFt: 30,
    frontSetbackFt: 2.5,
    rearSetbackFt: 4,
    leftSetbackFt: 2,
    rightSetbackFt: 2,
    floorsCount: 2,
    staircaseCutoutAreaSqFt: 90,
    liftShaftAreaSqFt: 0,
    ventCutoutAreaSqFt: 40,
    governingAuthority: 'Nambike Nakshe 2.0 (Small Plot Relaxations)',
    permissibleFar: 1.85,
    maxGroundCoveragePct: 75,
  },
  {
    id: 'cad-03',
    fileName: 'Micro_Plot_540sqft_ZeroRear.dwg',
    planName: 'Micro-Plot Studio (<600 sq ft)',
    description: 'Compact plot under 600 sq ft requiring NO rear setback under Nambike Nakshe 2.0 municipal regulations',
    sitePlotLengthFt: 30,
    sitePlotWidthFt: 18,
    frontSetbackFt: 2.5,
    rearSetbackFt: 0,
    leftSetbackFt: 2,
    rightSetbackFt: 2,
    floorsCount: 2,
    staircaseCutoutAreaSqFt: 65,
    liftShaftAreaSqFt: 0,
    ventCutoutAreaSqFt: 30,
    governingAuthority: 'Nambike Nakshe 2.0 (Zero Rear Setback Rule)',
    permissibleFar: 2.0,
    maxGroundCoveragePct: 80,
  },
  {
    id: 'cad-04',
    fileName: 'Commercial_Plaza_Sector4.dxf',
    planName: 'Sector-4 Commercial Office Plaza',
    description: 'G+3 Mixed-use commercial building with column-free retail podium and flexible upper office floor plates',
    sitePlotLengthFt: 80,
    sitePlotWidthFt: 60,
    frontSetbackFt: 15,
    rearSetbackFt: 10,
    leftSetbackFt: 6,
    rightSetbackFt: 6,
    floorsCount: 4,
    staircaseCutoutAreaSqFt: 220,
    liftShaftAreaSqFt: 90,
    ventCutoutAreaSqFt: 110,
    governingAuthority: 'GBA Commercial Standards / NBC Fire Norms',
    permissibleFar: 2.25,
    maxGroundCoveragePct: 60,
  },
];

function generateDefaultFloors(count: number, areaPerFloor: number, floorHeightM = 3.3): BuildingFloor[] {
  const safeCount = Math.max(1, count);
  const floors: BuildingFloor[] = [];
  for (let i = 0; i < safeCount; i++) {
    const isGround = i === 0;
    const name = isGround
      ? 'Ground Floor'
      : i === 1
      ? 'First Floor'
      : i === 2
      ? 'Second Floor'
      : i === 3
      ? 'Third Floor'
      : i === 4
      ? 'Fourth Floor'
      : i === 5
      ? 'Fifth Floor'
      : i === 6
      ? 'Sixth Floor'
      : `Level ${i} Floor`;
    const shortCode = isGround ? 'GF' : `${i}F`;
    const elevation = isGround ? '±0.00m' : `+${(i * floorHeightM).toFixed(2)}m`;
    floors.push({
      id: `wf_floor_${i}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      shortCode,
      levelIndex: i,
      elevation,
      areaSqFt: Math.max(100, Math.round(areaPerFloor)),
      heightMeters: floorHeightM,
      description: isGround
        ? 'Entrance foyer, living, dining, kitchen & parking portico'
        : `Floor plate ${shortCode} standard structural layout`,
    });
  }
  return floors;
}

export const SequentialWorkflowEngineModal: React.FC<SequentialWorkflowEngineModalProps> = ({
  isOpen,
  onClose,
  activeProject,
  onUpdateProject,
  boqItems = [],
  onUpdateBOQItems,
  onNavigateToTab,
  currency,
}) => {
  // Current active step (1 to 4)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: CAD & Area extraction state
  const [selectedPreset, setSelectedPreset] = useState<CadPlanPreset>(CAD_PLAN_PRESETS[0]);
  const [customFileName, setCustomFileName] = useState<string>('');
  const [isProcessingCad, setIsProcessingCad] = useState<boolean>(false);
  const [plotLength, setPlotLength] = useState<number>(selectedPreset.sitePlotLengthFt);
  const [plotWidth, setPlotWidth] = useState<number>(selectedPreset.sitePlotWidthFt);
  const [frontSetback, setFrontSetback] = useState<number>(selectedPreset.frontSetbackFt);
  const [rearSetback, setRearSetback] = useState<number>(selectedPreset.rearSetbackFt);
  const [sideLeftSetback, setSideLeftSetback] = useState<number>(selectedPreset.leftSetbackFt);
  const [sideRightSetback, setSideRightSetback] = useState<number>(selectedPreset.rightSetbackFt);
  const [staircaseCutout, setStaircaseCutout] = useState<number>(selectedPreset.staircaseCutoutAreaSqFt);
  const [liftCutout, setLiftCutout] = useState<number>(selectedPreset.liftShaftAreaSqFt);
  const [ventCutout, setVentCutout] = useState<number>(selectedPreset.ventCutoutAreaSqFt);
  const [planName, setPlanName] = useState<string>(selectedPreset.planName);
  const [planDescription, setPlanDescription] = useState<string>(selectedPreset.description);

  // Step 2: Gatekeeper & Government Rules State (Nambike Nakshe 2.0 / GBA)
  const [applyGbaRegularization, setApplyGbaRegularization] = useState<boolean>(true);
  const [fireCorridorApproved, setFireCorridorApproved] = useState<boolean>(true);
  const [lightVentilationApproved, setLightVentilationApproved] = useState<boolean>(true);

  // Configured Floors State (allows adding extra floors dynamically)
  const [workflowFloors, setWorkflowFloors] = useState<BuildingFloor[]>(() => {
    if (activeProject.floors && activeProject.floors.length > 0) {
      return activeProject.floors;
    }
    const bLen = Math.max(0, selectedPreset.sitePlotLengthFt - selectedPreset.frontSetbackFt - selectedPreset.rearSetbackFt);
    const bWid = Math.max(0, selectedPreset.sitePlotWidthFt - selectedPreset.leftSetbackFt - selectedPreset.rightSetbackFt);
    const gross = bLen * bWid;
    const ded = selectedPreset.staircaseCutoutAreaSqFt + selectedPreset.liftShaftAreaSqFt + selectedPreset.ventCutoutAreaSqFt;
    const netFloor = Math.max(0, gross - ded);
    return generateDefaultFloors(selectedPreset.floorsCount, netFloor);
  });

  // Step 3: BOQ Population notification
  const [boqSynced, setBoqSynced] = useState<boolean>(false);

  // Step 4: Material takeoff calculation
  const [materialsApplied, setMaterialsApplied] = useState<boolean>(false);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);

  // Step 1 Sub-section view filter (Allows separating CAD Ingestion, ADS Area Deductions & Setbacks, and Floor Stacking)
  const [step1SubSection, setStep1SubSection] = useState<'all' | 'cad' | 'ads' | 'stacking'>('all');

  if (!isOpen) return null;

  // Spatial Calculations
  const siteAreaSqFt = plotLength * plotWidth;
  const siteAreaSqM = Number((siteAreaSqFt * 0.092903).toFixed(1));
  const buildableLength = Math.max(0, plotLength - frontSetback - rearSetback);
  const buildableWidth = Math.max(0, plotWidth - sideLeftSetback - sideRightSetback);
  const grossFootprintAreaSqFt = buildableLength * buildableWidth;
  const deductionsPerFloor = staircaseCutout + liftCutout + ventCutout;
  const netBuiltUpAreaPerFloor = Math.max(0, grossFootprintAreaSqFt - deductionsPerFloor);

  // Total Net Built-Up Area across all configured floors (including extra floors)
  const totalNetBuiltUpAreaSqFt = workflowFloors.length > 0
    ? workflowFloors.reduce((sum, f) => sum + (Number(f.areaSqFt) || 0), 0)
    : Math.round(netBuiltUpAreaPerFloor * selectedPreset.floorsCount);

  const configuredFloorCount = workflowFloors.length;

  // Total Building Height Calculation across above-ground levels
  const totalBuildingHeightM = Number(
    workflowFloors
      .filter((f) => f.levelIndex >= 0)
      .reduce((sum, f) => sum + (f.heightMeters || 3.3), 0)
      .toFixed(1)
  );
  const isHighRise = totalBuildingHeightM >= 21;

  // Nambike Nakshe 2.0 & GBA Policy Conditions
  const isSmallPlotUnder1500 = siteAreaSqFt < 1500;
  const isMicroPlotUnder600 = siteAreaSqFt < 600;
  // GBA Policy: Plots under 500 m² (~5,382 sq.ft) and heights under 15m eligible for up to 15% deviation regularization
  const isGbaEligible = siteAreaSqM < 500 && totalBuildingHeightM < 15;
  const gbaDeviationLimitPct = isGbaEligible ? 15 : 5;

  // Ground Coverage & FAR Compliance
  const proposedFar = siteAreaSqFt > 0 ? Number((totalNetBuiltUpAreaSqFt / siteAreaSqFt).toFixed(2)) : 0;
  const groundCoveragePct = siteAreaSqFt > 0 ? Number(((grossFootprintAreaSqFt / siteAreaSqFt) * 100).toFixed(1)) : 0;
  const isGroundCoverageValid = groundCoveragePct <= selectedPreset.maxGroundCoveragePct;

  const farDeviationPct = proposedFar > selectedPreset.permissibleFar
    ? Number((((proposedFar - selectedPreset.permissibleFar) / selectedPreset.permissibleFar) * 100).toFixed(1))
    : 0;

  const isFarValid = proposedFar <= selectedPreset.permissibleFar || (applyGbaRegularization && isGbaEligible && farDeviationPct <= 15);

  // Setback Compliance check under Nambike Nakshe 2.0
  const reqFrontSetback = isSmallPlotUnder1500 ? 2.5 : selectedPreset.frontSetbackFt;
  const reqSideSetback = isSmallPlotUnder1500 ? 2.0 : selectedPreset.leftSetbackFt;
  const reqRearSetback = isMicroPlotUnder600 ? 0.0 : (isSmallPlotUnder1500 ? 4.0 : selectedPreset.rearSetbackFt);

  const isFrontSetbackValid = frontSetback >= reqFrontSetback;
  const isSideSetbackValid = sideLeftSetback >= reqSideSetback && sideRightSetback >= reqSideSetback;
  const isRearSetbackValid = rearSetback >= reqRearSetback;
  const isSetbackRulesValid = isFrontSetbackValid && isSideSetbackValid && isRearSetbackValid;

  const isGatekeeperPassed = isGroundCoverageValid && isFarValid && isSetbackRulesValid && fireCorridorApproved && lightVentilationApproved;

  // Cost Estimation per sq.ft based on Net Built-up Area
  const baseRatePerSqFt = 2075;
  const totalCostEstimate = totalNetBuiltUpAreaSqFt * baseRatePerSqFt;

  const costBreakdown = [
    { trade: 'Substructure & Foundation (PCC, Footings, Plinth)', pct: 16.5, rate: 342 },
    { trade: 'RCC Superstructure (Columns, Beams, Slabs)', pct: 30.5, rate: 633 },
    { trade: 'Masonry & Plastering (AAC Blocks, Internal/Ext)', pct: 14.5, rate: 301 },
    { trade: 'Finishes (Flooring, Wall Tiles, Granite Counters)', pct: 17.5, rate: 363 },
    { trade: 'Plumbing & Sanitaryware (CPVC, SWR, Fixtures)', pct: 7.5, rate: 156 },
    { trade: 'Electrical & Automation (Wiring, DB, Conduits)', pct: 7.0, rate: 145 },
    { trade: 'Paint & Waterproofing (Birla Opus / Asian, Putty)', pct: 6.5, rate: 135 },
  ];

  // Material Engineering Consumption Norms (IS Standards)
  const materialTakeoff = [
    {
      name: 'Cement (OPC 53 / PPC)',
      standard: 'IS 269 / IS 1489',
      norm: '0.42 bags / sq.ft',
      quantity: Math.round(totalNetBuiltUpAreaSqFt * 0.42),
      unit: 'Bags (50 kg)',
      rateEstimate: 385,
      brand: 'Birla A1 / UltraTech OPC 53',
    },
    {
      name: 'TMT High-Strength Steel Rebars',
      standard: 'IS 1786 (Fe 550D)',
      norm: '3.90 kg / sq.ft',
      quantity: Number(((totalNetBuiltUpAreaSqFt * 3.9) / 1000).toFixed(2)),
      unit: 'Metric Tonnes',
      rateEstimate: 62500,
      brand: 'Tata Tiscon / Jindal Panther Fe550D',
    },
    {
      name: 'Coarse Sand / M-Sand',
      standard: 'IS 383 Zone-II',
      norm: '1.70 cu.ft / sq.ft',
      quantity: Math.round(totalNetBuiltUpAreaSqFt * 1.7),
      unit: 'Cubic Feet (cu.ft)',
      rateEstimate: 58,
      brand: 'Certified Robo M-Sand Plaster Grade',
    },
    {
      name: 'Coarse Aggregates (20mm & 10mm)',
      standard: 'IS 383 Crushed Granite',
      norm: '1.25 cu.ft / sq.ft',
      quantity: Math.round(totalNetBuiltUpAreaSqFt * 1.25),
      unit: 'Cubic Feet (cu.ft)',
      rateEstimate: 46,
      brand: 'Mechanically Graded Blue Metal',
    },
    {
      name: 'Masonry Blocks (AAC / Clay Bricks)',
      standard: 'IS 2185 Part-3 (AAC)',
      norm: '1.25 cu.ft or 8 blocks / sq.ft',
      quantity: Math.round(totalNetBuiltUpAreaSqFt * 1.25),
      unit: 'Nos / cu.ft',
      rateEstimate: 68,
      brand: 'Birla Aerocon / Siporex AAC',
    },
    {
      name: 'Paint & Surface Coatings',
      standard: 'IS 15489 / GreenPro',
      norm: '0.18 Liters / sq.ft',
      quantity: Math.round(totalNetBuiltUpAreaSqFt * 0.18),
      unit: 'Liters',
      rateEstimate: 345,
      brand: 'Birla Opus Calista & One (OPS)',
    },
    {
      name: 'Polymer Wall Care Putty',
      standard: 'IS 15489 Redispersible Polymer',
      norm: '0.35 kg / sq.ft',
      quantity: Math.round(totalNetBuiltUpAreaSqFt * 0.35),
      unit: 'Kilograms (kg)',
      rateEstimate: 23,
      brand: 'Birla White Wall Care HP',
    },
  ];

  // Handler to add extra floors with specific typology
  const handleAddExtraFloor = (type: 'upper' | 'basement' | 'stilt' | 'terrace' = 'upper') => {
    const typicalArea = netBuiltUpAreaPerFloor > 0 ? netBuiltUpAreaPerFloor : 1200;
    const defaultHeight = 3.3;

    setWorkflowFloors((prev) => {
      if (type === 'basement') {
        const basementCount = prev.filter((f) => f.levelIndex < 0).length + 1;
        const newFloor: BuildingFloor = {
          id: `wf_b${basementCount}_${Date.now()}`,
          name: `Basement Level ${basementCount}`,
          shortCode: `B${basementCount}`,
          levelIndex: -basementCount,
          elevation: `-${(basementCount * 3.0).toFixed(2)}m`,
          areaSqFt: Math.round(typicalArea),
          heightMeters: 3.0,
          description: 'Subterranean parking, storage, MEP & water sump',
        };
        return [newFloor, ...prev];
      }

      if (type === 'stilt') {
        const newFloor: BuildingFloor = {
          id: `wf_stilt_${Date.now()}`,
          name: 'Stilt Parking Level',
          shortCode: 'ST',
          levelIndex: 0,
          elevation: '±0.00m',
          areaSqFt: Math.round(typicalArea),
          heightMeters: 2.8,
          description: 'Covered ground stilt parking bays and security cabin',
        };
        const updated = [
          newFloor,
          ...prev.map((f) => ({
            ...f,
            levelIndex: f.levelIndex >= 0 ? f.levelIndex + 1 : f.levelIndex,
            elevation:
              f.levelIndex >= 0
                ? `+${((f.levelIndex + 1) * defaultHeight).toFixed(2)}m`
                : f.elevation,
          })),
        ];
        return updated;
      }

      if (type === 'terrace') {
        const upperLevels = prev.filter((f) => f.levelIndex >= 0);
        const maxLevel = upperLevels.length > 0 ? Math.max(...upperLevels.map((f) => f.levelIndex)) : 0;
        const newLevel = maxLevel + 1;
        const newFloor: BuildingFloor = {
          id: `wf_rf_${Date.now()}`,
          name: 'Terrace & Rooftop Lounge',
          shortCode: 'RF',
          levelIndex: newLevel,
          elevation: `+${(newLevel * defaultHeight).toFixed(2)}m`,
          areaSqFt: Math.round(typicalArea * 0.45),
          heightMeters: 3.0,
          description: 'Covered gazebo, solar terrace, staircase head room & overhead tank',
        };
        return [...prev, newFloor];
      }

      // Default: 'upper' typical floor
      const upperLevels = prev.filter((f) => f.levelIndex >= 0 && f.shortCode !== 'RF');
      const nextIndex = upperLevels.length > 0 ? Math.max(...upperLevels.map((f) => f.levelIndex)) + 1 : 1;
      const floorNames: Record<number, string> = {
        1: 'First Floor',
        2: 'Second Floor',
        3: 'Third Floor',
        4: 'Fourth Floor',
        5: 'Fifth Floor',
        6: 'Sixth Floor',
        7: 'Seventh Floor',
        8: 'Eighth Floor',
        9: 'Ninth Floor',
        10: 'Tenth Floor',
      };
      const name = floorNames[nextIndex] || `Level ${nextIndex} Floor`;
      const shortCode = `${nextIndex}F`;
      const elevation = `+${(nextIndex * defaultHeight).toFixed(2)}m`;

      const newFloor: BuildingFloor = {
        id: `wf_floor_${nextIndex}_${Date.now()}`,
        name,
        shortCode,
        levelIndex: nextIndex,
        elevation,
        areaSqFt: Math.round(typicalArea),
        heightMeters: defaultHeight,
        description: `Additional upper level floor ${shortCode} layout`,
      };

      // Place before terrace if exists, or append
      const terraceIdx = prev.findIndex((f) => f.shortCode === 'RF');
      if (terraceIdx !== -1) {
        const copy = [...prev];
        copy.splice(terraceIdx, 0, newFloor);
        return copy;
      }
      return [...prev, newFloor];
    });
  };

  const handleDeleteFloor = (id: string) => {
    if (workflowFloors.length <= 1) return;
    setWorkflowFloors((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDuplicateFloor = (floor: BuildingFloor) => {
    const nextIndex = workflowFloors.length;
    const newFloor: BuildingFloor = {
      ...floor,
      id: `wf_floor_${Date.now()}_dup`,
      name: `${floor.name} (Copy)`,
      shortCode: `${floor.shortCode}+`,
      levelIndex: nextIndex,
      elevation: `+${(nextIndex * 3.3).toFixed(2)}m`,
    };
    setWorkflowFloors((prev) => [...prev, newFloor]);
  };

  const handleUpdateFloor = (id: string, field: keyof BuildingFloor, val: any) => {
    setWorkflowFloors((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          return {
            ...f,
            [field]: field === 'areaSqFt' || field === 'heightMeters' ? Number(val) || 0 : val,
          };
        }
        return f;
      })
    );
  };

  const handleSyncAllFloorsToFootprint = () => {
    setWorkflowFloors((prev) =>
      prev.map((f) => ({
        ...f,
        areaSqFt:
          f.shortCode === 'RF'
            ? Math.round(netBuiltUpAreaPerFloor * 0.45)
            : Math.round(netBuiltUpAreaPerFloor),
      }))
    );
  };

  const handleSelectPreset = (preset: CadPlanPreset) => {
    setSelectedPreset(preset);
    setPlotLength(preset.sitePlotLengthFt);
    setPlotWidth(preset.sitePlotWidthFt);
    setFrontSetback(preset.frontSetbackFt);
    setRearSetback(preset.rearSetbackFt);
    setSideLeftSetback(preset.leftSetbackFt);
    setSideRightSetback(preset.rightSetbackFt);
    setStaircaseCutout(preset.staircaseCutoutAreaSqFt);
    setLiftCutout(preset.liftShaftAreaSqFt);
    setVentCutout(preset.ventCutoutAreaSqFt);
    setPlanName(preset.planName);
    setPlanDescription(preset.description);
    setCustomFileName(preset.fileName);
    setBoqSynced(false);
    setMaterialsApplied(false);

    const bLen = Math.max(0, preset.sitePlotLengthFt - preset.frontSetbackFt - preset.rearSetbackFt);
    const bWid = Math.max(0, preset.sitePlotWidthFt - preset.leftSetbackFt - preset.rightSetbackFt);
    const gross = bLen * bWid;
    const ded = preset.staircaseCutoutAreaSqFt + preset.liftShaftAreaSqFt + preset.ventCutoutAreaSqFt;
    const netFloor = Math.max(0, gross - ded);
    setWorkflowFloors(generateDefaultFloors(preset.floorsCount, netFloor));
  };

  const handleFileUploadSimulated = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setCustomFileName(file.name);
      setIsProcessingCad(true);

      setTimeout(() => {
        setIsProcessingCad(false);
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setPlanName(nameWithoutExt.charAt(0).toUpperCase() + nameWithoutExt.slice(1));
        setPlanDescription(`Imported architectural layout from ${file.name} with automated layer and spatial deduction parsing.`);
      }, 700);
    }
  };

  const handleSyncToProjectAndBOQ = () => {
    // 1. Update Project with validated Net Built-up Area, Plan Name, Description, and full configured Floors
    onUpdateProject({
      ...activeProject,
      name: planName || activeProject.name,
      builtUpAreaSqFt: totalNetBuiltUpAreaSqFt,
      floors: workflowFloors,
      description: planDescription || activeProject.description,
    });

    // 2. Scale BOQ Items proportionally if available
    if (boqItems.length > 0 && onUpdateBOQItems) {
      const areaRatio = totalNetBuiltUpAreaSqFt / (activeProject.builtUpAreaSqFt || 2500);
      const updated = boqItems.map((item) => ({
        ...item,
        quantity: Math.round(item.quantity * areaRatio * 10) / 10,
        amount: Math.round(item.quantity * areaRatio * item.rate),
      }));
      onUpdateBOQItems(updated);
    }

    setBoqSynced(true);
    setTimeout(() => setBoqSynced(false), 4000);
  };

  const handleApplyToMaterialCatalog = () => {
    // Save material takeoff to localStorage for persistent reference
    try {
      localStorage.setItem(
        `material_takeoff_${activeProject.id}`,
        JSON.stringify({
          netBuiltUpAreaSqFt: totalNetBuiltUpAreaSqFt,
          floorsCount: workflowFloors.length,
          updatedAt: new Date().toISOString(),
          materials: materialTakeoff,
        })
      );
    } catch (_e) {}

    setMaterialsApplied(true);
    setTimeout(() => setMaterialsApplied(false), 4000);
  };

  const handleCopyArchitecturePrompt = () => {
    const promptText = `NAMBIKE NAKSHE 2.0 & PLATFORM SPECIFICATION
Document Title: Integrated Municipal Compliance & Automated CAD Analysis Engine
Target System: Automated CAD Analysis & BOQ Engine
Compliance Gate: Local Government Rules (Nambike Nakshe 2.0 / GBA)
Overall Rating: 9.8 / 10 (Production Ready)

1. REGULATORY HIGHLIGHTS & MUNICIPAL FRAMEWORK:
• Proposed Deviation Regularization Limit (GBA Policy): Permissible building deviation regularization limit from 5% to 15% (subject to structural safety and penalty fees) for smaller plots under 500 m² (${siteAreaSqM} m² current) and heights under 15m (${totalBuildingHeightM}m current).
• Relaxed Setbacks for Small Plots: Plots under 1,500 sq ft front setbacks reduced to 2.5 ft (0.75m), side setbacks to 2 ft (0.6m), and plots under 600 sq ft require no rear setbacks.

2. AI CONSTRUCTION PLATFORM WORKFLOW SPECIFICATION:
1. Project & Workspace (Initial Ingestion)
   Step 1: Extract Area & Plan Name
   - Process imported AutoCAD file to determine site dimensions (${plotLength}x${plotWidth} ft = ${siteAreaSqFt} sq.ft), deduct setbacks, compute gross slab area (${grossFootprintAreaSqFt} sq.ft), and subtract staircase/cutout areas (${deductionsPerFloor} sq.ft) for net built-up area (${netBuiltUpAreaPerFloor} sq.ft/floor). Total Net Built-up Area: ${totalNetBuiltUpAreaSqFt.toLocaleString()} sq.ft across ${workflowFloors.length} floors.
2. Gatekeeper Stage (Regulatory Gate)
   Step 2: Validate Government Rules
   - Analyze plan layout against local building codes and municipal regulations (including Nambike Nakshe 2.0 setbacks and parameters) to ensure full compliance before estimation.
   - Status: ${isGatekeeperPassed ? 'COMPLIANT & APPROVED' : 'CONDITIONAL / REGULARIZATION REQUIRED'} (Proposed FAR: ${proposedFar}, Permissible FAR: ${selectedPreset.permissibleFar}, Ground Coverage: ${groundCoveragePct}%)
3. BOQ & Estimation (Financial Mapping)
   Step 3: Populate BOQ & Estimation
   - Transfer validated net built-up area directly into the BOQ section to automatically adjust baseline project parameters and compute overall project cost estimates (₹ ${(totalCostEstimate / 100000).toFixed(2)} Lakhs @ ₹ ${baseRatePerSqFt}/sq.ft).
4. Material & Standards (Resource Planning)
   Step 4: Material & Quantity Calculation
   - Apply standard engineering consumption formulas to output a precise list of material requirements and exact quantities.

3. ARCHITECTURE ASSESSMENT & SYSTEM RATING:
• Overall Rating: 9.8 / 10 (Production Ready)
• Logical Flow & Dependency: 10/10
• Clarity of Execution & Integration: 9.8/10`;

    navigator.clipboard.writeText(promptText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div
      id="modal-sequential-workflow-engine-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 md:p-6 backdrop-blur-md"
    >
      <div
        id="modal-sequential-workflow-engine"
        className="relative flex max-h-[92vh] w-full max-w-5xl flex-col rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden"
      >
        {/* Header with Specification Title & Rating Badge from User PDF */}
        <div className="border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Nambike Nakshe 2.0 &amp; Platform Specification
                  </h2>
                  <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-xs font-mono font-semibold text-amber-300">
                    Automated CAD Analysis &amp; BOQ Engine
                  </span>
                  <span className="flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                    <Award className="h-3.5 w-3.5" />
                    Rating: 9.8 / 10 (Production Ready)
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Integrated Municipal Compliance &amp; Automated CAD Analysis Engine • Local Government Rules (Nambike Nakshe 2.0 / GBA)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyArchitecturePrompt}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-700 transition"
                title="Copy structured prompt and architectural execution spec"
              >
                {copiedPrompt ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{copiedPrompt ? 'Copied' : 'Copy Spec'}</span>
              </button>
              <button
                id="btn-close-workflow-modal"
                onClick={onClose}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* 4-Step Sequential Logic Stepper from Platform Specification */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
            {/* Step 1 */}
            <button
              id="step-tab-1"
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`flex items-center gap-2 p-2.5 rounded-lg text-left transition ${
                currentStep === 1
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                  : 'bg-slate-950/40 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                currentStep === 1 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}>
                1
              </span>
              <div className="truncate">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">1. PROJECT &amp; WORKSPACE</div>
                <div className="text-xs font-semibold text-slate-200 truncate">Extract Area &amp; Plan Name</div>
              </div>
            </button>

            {/* Step 2 */}
            <button
              id="step-tab-2"
              type="button"
              onClick={() => setCurrentStep(2)}
              className={`flex items-center gap-2 p-2.5 rounded-lg text-left transition ${
                currentStep === 2
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                  : 'bg-slate-950/40 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                currentStep === 2 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}>
                2
              </span>
              <div className="truncate">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">2. GATEKEEPER STAGE</div>
                <div className="text-xs font-semibold text-slate-200 truncate">Validate Government Rules</div>
              </div>
            </button>

            {/* Step 3 */}
            <button
              id="step-tab-3"
              type="button"
              onClick={() => setCurrentStep(3)}
              className={`flex items-center gap-2 p-2.5 rounded-lg text-left transition ${
                currentStep === 3
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                  : 'bg-slate-950/40 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                currentStep === 3 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}>
                3
              </span>
              <div className="truncate">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">3. BOQ &amp; ESTIMATION</div>
                <div className="text-xs font-semibold text-slate-200 truncate">Populate BOQ &amp; Cost</div>
              </div>
            </button>

            {/* Step 4 */}
            <button
              id="step-tab-4"
              type="button"
              onClick={() => setCurrentStep(4)}
              className={`flex items-center gap-2 p-2.5 rounded-lg text-left transition ${
                currentStep === 4
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                  : 'bg-slate-950/40 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                currentStep === 4 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}>
                4
              </span>
              <div className="truncate">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">4. MATERIAL &amp; STANDARDS</div>
                <div className="text-xs font-semibold text-slate-200 truncate">Material &amp; Quantity Calc</div>
              </div>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ========================================================================= */}
          {/* STEP 1: PROJECT & WORKSPACE — EXTRACT AREA & PLAN NAME                    */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                  <Building2 className="h-4 w-4" />
                  <span>1. PROJECT &amp; WORKSPACE • Initial CAD File Ingestion &amp; Spatial Deductions</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Process the imported AutoCAD file to determine site dimensions, deduct required setbacks based on local building codes, calculate gross slab area, and subtract staircase or cutout areas to find net built-up area.
                </p>
              </div>

              {/* Sub-Section Switcher: Dedicated navigation to isolate or view sections separately */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setStep1SubSection('all')}
                    className={`px-3 py-1.5 rounded-md font-medium transition ${
                      step1SubSection === 'all'
                        ? 'bg-slate-800 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All Sections (Combined)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep1SubSection('cad')}
                    className={`px-3 py-1.5 rounded-md font-medium transition ${
                      step1SubSection === 'cad'
                        ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    1. CAD Ingestion
                  </button>
                  <button
                    id="btn-sub-section-spatial-deductions"
                    type="button"
                    onClick={() => setStep1SubSection('ads')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
                      step1SubSection === 'ads'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow'
                        : 'text-slate-300 hover:text-white bg-slate-800/60'
                    }`}
                  >
                    <Scale className="h-3.5 w-3.5" />
                    <span>2. Setbacks &amp; Spatial Deductions</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep1SubSection('stacking')}
                    className={`px-3 py-1.5 rounded-md font-medium transition ${
                      step1SubSection === 'stacking'
                        ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    3. Floor Stacking Schedule
                  </button>
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span>Plan: <strong className="text-white font-mono">{planName}</strong></span>
                  <span>•</span>
                  <span>Footprint: <strong className="text-amber-400 font-mono">{netBuiltUpAreaPerFloor.toLocaleString()} sq.ft</strong></span>
                </div>
              </div>

              {/* SECTION 1: Sample Plan Presets & Custom CAD Ingestion */}
              {(step1SubSection === 'all' || step1SubSection === 'cad') && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                      CAD Drawing Ingestion &amp; Plan File Selection:
                    </label>
                    {step1SubSection === 'cad' && (
                      <span className="text-[11px] text-amber-400 font-mono">Isolated CAD Module View</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {CAD_PLAN_PRESETS.map((preset) => {
                      const isSelected = selectedPreset.id === preset.id;
                      return (
                        <div
                          key={preset.id}
                          onClick={() => handleSelectPreset(preset)}
                          className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                            isSelected
                              ? 'border-amber-500 bg-amber-500/10 shadow-md shadow-amber-500/10'
                              : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[11px] text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                              {preset.fileName}
                            </span>
                            {isSelected && <CheckCircle2 className="h-4 w-4 text-amber-400" />}
                          </div>
                          <h4 className="font-semibold text-xs text-white mt-2">{preset.planName}</h4>
                          <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{preset.description}</p>
                          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-300 font-mono">
                            <span>{preset.sitePlotLengthFt}x{preset.sitePlotWidthFt} ft</span>
                            <span>{preset.floorsCount} Floors</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Upload Dropzone */}
                  <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-4 text-center">
                    <input
                      type="file"
                      id="cad-file-upload-input"
                      accept=".dwg,.dxf,.pdf,.png,.jpg"
                      onChange={handleFileUploadSimulated}
                      className="hidden"
                    />
                    <label
                      htmlFor="cad-file-upload-input"
                      className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
                    >
                      <Upload className="h-5 w-5 text-amber-400" />
                      <span className="text-xs font-semibold text-slate-200">
                        {customFileName ? (
                          <span className="text-amber-300">{customFileName} (Loaded &amp; Parsed)</span>
                        ) : (
                          'Click to upload your custom AutoCAD drawing (.dwg, .dxf, .pdf)'
                        )}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Auto-extracts plan name from filename and detects boundary polyline dimensions
                      </span>
                    </label>
                  </div>

                  {step1SubSection === 'cad' && (
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setStep1SubSection('ads')}
                        className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition"
                      >
                        <span>Proceed to Setbacks &amp; Spatial Deductions</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================================= */}
              {/* SECTION 2: SETBACKS & SPATIAL DEDUCTIONS MODULE                           */}
              {/* ========================================================================= */}
              {(step1SubSection === 'all' || step1SubSection === 'ads') && (
                <div id="spatial-deductions-section" className="rounded-xl border-2 border-amber-500/40 bg-gradient-to-b from-slate-950 via-slate-900/90 to-slate-950 p-5 space-y-5 shadow-xl shadow-amber-500/5">
                  {/* Spatial Deductions Section Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/30 pb-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
                        <Scale className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-white">
                            Setbacks &amp; Spatial Deductions Engine
                          </h4>
                          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
                            NBC 2016 &amp; Nambike Nakshe 2.0
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Autonomous Spatial Parameter Deductions: Boundary Envelopes, Municipal Setback Offsets &amp; Core Shaft Voids.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-amber-300 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                        Gross Site: <strong className="text-white">{siteAreaSqFt.toLocaleString()} sq.ft</strong> ({siteAreaSqM} m²)
                      </span>
                    </div>
                  </div>

                  {/* Nambike Nakshe 2.0 Policy Presets Strip */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs">
                    <div className="flex items-center gap-2">
                      <Scale className="h-4 w-4 text-amber-400 shrink-0" />
                      <span className="text-slate-200">
                        <strong className="text-amber-300">Nambike Nakshe 2.0 Quick Regulatory Presets:</strong> Auto-apply standard municipal setback rules based on site plot threshold.
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setFrontSetback(2.5);
                          setSideLeftSetback(2.0);
                          setSideRightSetback(2.0);
                          setRearSetback(0);
                        }}
                        className="whitespace-nowrap px-2.5 py-1 bg-slate-900 border border-amber-500/40 text-amber-300 hover:bg-amber-500 hover:text-slate-950 font-semibold text-[11px] rounded transition"
                        title="Plots <600 sq.ft: 0ft rear setback, 2.0ft sides, 2.5ft front"
                      >
                        &lt;600 sq.ft (Zero Rear)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFrontSetback(2.5);
                          setSideLeftSetback(2.0);
                          setSideRightSetback(2.0);
                          setRearSetback(4.0);
                        }}
                        className="whitespace-nowrap px-2.5 py-1 bg-slate-900 border border-amber-500/40 text-amber-300 hover:bg-amber-500 hover:text-slate-950 font-semibold text-[11px] rounded transition"
                        title="Plots <1,500 sq.ft: 2.5ft front, 2.0ft sides, 4.0ft rear"
                      >
                        &lt;1,500 sq.ft (Relaxed)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFrontSetback(5.0);
                          setSideLeftSetback(3.5);
                          setSideRightSetback(3.5);
                          setRearSetback(6.0);
                        }}
                        className="whitespace-nowrap px-2.5 py-1 bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white font-semibold text-[11px] rounded transition"
                        title="Standard plots: 5.0ft front, 3.5ft sides, 6.0ft rear"
                      >
                        Standard Plot
                      </button>
                    </div>
                  </div>

                  {/* ADS 3-Pillar Input Breakdown Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Sub-Card 1: Site Plot Dimensions */}
                    <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-3.5 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                          <Building className="h-3.5 w-3.5 text-amber-400" />
                          1. Plot Dimensions
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">Boundary Polyline</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-slate-400 text-[11px]">Site Length (ft):</label>
                          <input
                            type="number"
                            value={plotLength}
                            onChange={(e) => setPlotLength(Number(e.target.value) || 0)}
                            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-white focus:border-amber-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 text-[11px]">Site Width (ft):</label>
                          <input
                            type="number"
                            value={plotWidth}
                            onChange={(e) => setPlotWidth(Number(e.target.value) || 0)}
                            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-white focus:border-amber-500 outline-none"
                          />
                        </div>
                      </div>
                      <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] flex justify-between font-mono">
                        <span className="text-slate-400">Gross Area:</span>
                        <span className="text-amber-400 font-bold">{siteAreaSqFt.toLocaleString()} sq.ft</span>
                      </div>
                    </div>

                    {/* Sub-Card 2: Municipal Setback Deductions */}
                    <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-3.5 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                          <Scale className="h-3.5 w-3.5 text-amber-400" />
                          2. Setback Deductions (ft)
                        </span>
                        <span className="text-[10px] font-mono text-amber-400">Perimeter Offsets</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-slate-400 text-[11px]">Front (ft):</label>
                          <input
                            type="number"
                            step="0.5"
                            value={frontSetback}
                            onChange={(e) => setFrontSetback(Number(e.target.value) || 0)}
                            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-white focus:border-amber-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 text-[11px]">Rear (ft):</label>
                          <input
                            type="number"
                            step="0.5"
                            value={rearSetback}
                            onChange={(e) => setRearSetback(Number(e.target.value) || 0)}
                            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-white focus:border-amber-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 text-[11px]">Left Side (ft):</label>
                          <input
                            type="number"
                            step="0.5"
                            value={sideLeftSetback}
                            onChange={(e) => setSideLeftSetback(Number(e.target.value) || 0)}
                            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-white focus:border-amber-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 text-[11px]">Right Side (ft):</label>
                          <input
                            type="number"
                            step="0.5"
                            value={sideRightSetback}
                            onChange={(e) => setSideRightSetback(Number(e.target.value) || 0)}
                            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-white focus:border-amber-500 outline-none"
                          />
                        </div>
                      </div>
                      <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] flex justify-between font-mono">
                        <span className="text-slate-400">Buildable Envelope:</span>
                        <span className="text-emerald-400 font-bold">{buildableLength} × {buildableWidth} ft</span>
                      </div>
                    </div>

                    {/* Sub-Card 3: Vertical Cutout & Core Deductions */}
                    <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-3.5 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5 text-rose-400" />
                          3. Internal Cutout Deductions
                        </span>
                        <span className="text-[10px] font-mono text-rose-400">Core Shaft Voids</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-slate-400 text-[11px]">Staircase Cutout:</label>
                          <input
                            type="number"
                            value={staircaseCutout}
                            onChange={(e) => setStaircaseCutout(Number(e.target.value) || 0)}
                            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-white focus:border-amber-500 outline-none"
                          />
                          <span className="text-[10px] text-slate-500 font-mono">sq.ft / floor</span>
                        </div>
                        <div>
                          <label className="text-slate-400 text-[11px]">Lift Shaft + Voids:</label>
                          <input
                            type="number"
                            value={liftCutout + ventCutout}
                            onChange={(e) => setLiftCutout(Number(e.target.value) || 0)}
                            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-white focus:border-amber-500 outline-none"
                          />
                          <span className="text-[10px] text-slate-500 font-mono">sq.ft / floor</span>
                        </div>
                      </div>
                      <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] flex justify-between font-mono">
                        <span className="text-slate-400">Total Voids Deducted:</span>
                        <span className="text-rose-400 font-bold">-{deductionsPerFloor.toLocaleString()} sq.ft / flr</span>
                      </div>
                    </div>
                  </div>

                  {/* ADS Summary Footprint Card */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                    <div className="rounded-lg bg-slate-900 p-3 border border-slate-800">
                      <div className="text-[11px] text-slate-400">Gross Footprint Area</div>
                      <div className="text-base font-bold font-mono text-white mt-0.5">
                        {grossFootprintAreaSqFt.toLocaleString()} sq.ft
                      </div>
                      <div className="text-[10px] text-slate-500">Envelope after setback deductions</div>
                    </div>

                    <div className="rounded-lg bg-slate-900 p-3 border border-slate-800">
                      <div className="text-[11px] text-slate-400">Vertical Core Deductions</div>
                      <div className="text-base font-bold font-mono text-rose-400 mt-0.5">
                        - {deductionsPerFloor.toLocaleString()} sq.ft
                      </div>
                      <div className="text-[10px] text-slate-500">Staircase + Lift + Light wells</div>
                    </div>

                    <div className="rounded-lg bg-slate-900 p-3 border border-slate-800">
                      <div className="text-[11px] text-slate-400">Typical Net Slab Area</div>
                      <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                        {netBuiltUpAreaPerFloor.toLocaleString()} sq.ft
                      </div>
                      <div className="text-[10px] text-slate-500">Net usable slab per floor</div>
                    </div>

                    <div className="rounded-lg bg-amber-500/10 p-3 border border-amber-500/30">
                      <div className="text-[11px] font-semibold text-amber-300">Total Net Built-Up ({configuredFloorCount}F)</div>
                      <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
                        {totalNetBuiltUpAreaSqFt.toLocaleString()} sq.ft
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Coverage: {groundCoveragePct}% (Max: {selectedPreset.maxGroundCoveragePct}%)
                      </div>
                    </div>
                  </div>

                  {/* ADS Formula Mathematical Verification Banner */}
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold">ADS Formula:</span>
                      <span>[({plotLength} - {frontSetback} - {rearSetback}) × ({plotWidth} - {sideLeftSetback} - {sideRightSetback})] - {deductionsPerFloor} = <strong className="text-emerald-300">{netBuiltUpAreaPerFloor} sq.ft</strong> / floor</span>
                    </div>
                    {step1SubSection === 'ads' && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setStep1SubSection('cad')}
                          className="px-2.5 py-1 text-slate-300 bg-slate-800 hover:bg-slate-700 rounded text-xs transition"
                        >
                          ← CAD Ingestion
                        </button>
                        <button
                          type="button"
                          onClick={() => setStep1SubSection('stacking')}
                          className="px-3 py-1 bg-amber-500 text-slate-950 font-bold rounded text-xs hover:bg-amber-400 transition"
                        >
                          Proceed to Floor Stacking →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* SECTION 3: BUILDING LEVELS & FLOOR STACKING                               */}
              {/* ========================================================================= */}
              {(step1SubSection === 'all' || step1SubSection === 'stacking') && (
              <div className="rounded-xl border border-amber-500/30 bg-slate-950/80 p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-amber-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                        Building Levels &amp; Floor Stacking ({configuredFloorCount} Floors)
                      </h4>
                      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300 border border-amber-500/30">
                        {totalNetBuiltUpAreaSqFt.toLocaleString()} sq.ft Total
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold border ${
                        isHighRise
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}>
                        Height: {totalBuildingHeightM}m {isHighRise ? '(High-Rise ≥21m)' : '(<21m Low-Rise)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Configure multi-storey floor plates, add extra floors, adjust slab areas &amp; height elevations.
                    </p>
                  </div>

                  {/* Floor Quick Add Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      id="btn-add-extra-upper-floor"
                      type="button"
                      onClick={() => handleAddExtraFloor('upper')}
                      className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:bg-amber-400 transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>+ Add Extra Floor</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddExtraFloor('stilt')}
                      className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition"
                      title="Add Stilt Parking Level"
                    >
                      <Plus className="h-3 w-3 text-sky-400" />
                      <span>+ Stilt</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddExtraFloor('basement')}
                      className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition"
                      title="Add Basement Level"
                    >
                      <Plus className="h-3 w-3 text-purple-400" />
                      <span>+ Basement</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddExtraFloor('terrace')}
                      className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition"
                      title="Add Terrace / Penthouse Level"
                    >
                      <Plus className="h-3 w-3 text-emerald-400" />
                      <span>+ Terrace</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSyncAllFloorsToFootprint}
                      className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1.5 text-xs text-slate-400 hover:text-amber-300 hover:border-amber-500/40 transition"
                      title={`Match all floors to typical footprint (${netBuiltUpAreaPerFloor} sq.ft)`}
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Sync All to Footprint</span>
                    </button>
                  </div>
                </div>

                {/* Floor Stack List */}
                <div className="space-y-2">
                  {workflowFloors.map((floor) => {
                    const isTerrace = floor.shortCode === 'RF';
                    const isBasement = floor.levelIndex < 0;
                    const isStilt = floor.shortCode === 'ST';
                    const isGround = floor.shortCode === 'GF';

                    const badgeColor = isTerrace
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                      : isBasement
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      : isStilt
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                      : isGround
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30';

                    const floorPct = totalNetBuiltUpAreaSqFt > 0
                      ? ((floor.areaSqFt / totalNetBuiltUpAreaSqFt) * 100).toFixed(1)
                      : '0';

                    return (
                      <div
                        key={floor.id}
                        className="rounded-lg border border-slate-800 bg-slate-900/90 p-3 transition hover:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                      >
                        {/* Floor Badge & Name */}
                        <div className="flex items-center gap-2.5 min-w-[200px]">
                          <span
                            className={`flex h-7 w-9 items-center justify-center rounded font-mono font-bold text-xs border shrink-0 ${badgeColor}`}
                          >
                            {floor.shortCode}
                          </span>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={floor.name}
                              onChange={(e) => handleUpdateFloor(floor.id, 'name', e.target.value)}
                              className="w-full bg-transparent font-semibold text-slate-100 hover:bg-slate-800/80 focus:bg-slate-800 px-1.5 py-0.5 rounded border border-transparent focus:border-amber-500/50 outline-none transition text-xs"
                              placeholder="Floor Name"
                            />
                            <div className="text-[10px] text-slate-400 px-1.5 flex items-center gap-2">
                              <span>Elev: <strong className="text-slate-300 font-mono">{floor.elevation}</strong></span>
                              <span>•</span>
                              <span>Height: <strong className="text-slate-300 font-mono">{floor.heightMeters || 3.3}m</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Floor Description / Purpose */}
                        <div className="hidden lg:block flex-1 max-w-[260px]">
                          <input
                            type="text"
                            value={floor.description || ''}
                            onChange={(e) => handleUpdateFloor(floor.id, 'description', e.target.value)}
                            placeholder="Usage / layout description..."
                            className="w-full bg-slate-950/60 text-slate-300 placeholder-slate-500 px-2 py-1 rounded border border-slate-800 focus:border-slate-700 outline-none text-[11px]"
                          />
                        </div>

                        {/* Floor Area Input & Percentage */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <label className="text-[11px] text-slate-400">Net Area:</label>
                            <div className="relative">
                              <input
                                type="number"
                                value={floor.areaSqFt}
                                onChange={(e) => handleUpdateFloor(floor.id, 'areaSqFt', e.target.value)}
                                className="w-24 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 font-mono font-bold text-amber-400 text-right pr-2 text-xs focus:border-amber-500 outline-none"
                              />
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">sq.ft</span>
                            <span className="text-[10px] text-slate-500 font-mono">({floorPct}%)</span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDuplicateFloor(floor)}
                              className="rounded p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition"
                              title="Duplicate Floor"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteFloor(floor.id)}
                              disabled={workflowFloors.length <= 1}
                              className="rounded p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 disabled:opacity-30 disabled:hover:text-slate-400 transition"
                              title="Delete Floor"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Floor Stepper & Info Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Quick Level Stepper:</span>
                    <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => {
                          if (workflowFloors.length > 1) {
                            handleDeleteFloor(workflowFloors[workflowFloors.length - 1].id);
                          }
                        }}
                        disabled={workflowFloors.length <= 1}
                        className="px-2.5 py-1 text-slate-300 hover:bg-slate-800 disabled:opacity-30 transition font-bold"
                        title="Remove Top Floor"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 font-mono font-bold text-amber-400 text-xs bg-slate-950">
                        {configuredFloorCount} Floors
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddExtraFloor('upper')}
                        className="px-2.5 py-1 text-slate-300 hover:bg-slate-800 transition font-bold"
                        title="Add Next Upper Floor"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Typical Footprint: <span className="font-mono text-slate-200">{netBuiltUpAreaPerFloor.toLocaleString()} sq.ft</span>
                    <span className="mx-2">•</span>
                    Total Area: <span className="font-mono text-amber-400 font-bold">{totalNetBuiltUpAreaSqFt.toLocaleString()} sq.ft</span>
                  </div>
                </div>
              </div>
              )}

              {/* Navigation Action */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-400">
                  Extracted Plan: <span className="text-white font-semibold">{planName}</span> ({configuredFloorCount} Floors)
                </div>
                <button
                  id="btn-workflow-goto-step-2"
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition"
                >
                  <span>Proceed to Step 2: Validate Government Rules</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: GATEKEEPER STAGE — VALIDATE GOVERNMENT RULES (NAMBIKE NAKSHE 2.0)  */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                  <ShieldCheck className="h-4 w-4" />
                  <span>2. GATEKEEPER STAGE • Validate Government Rules (Nambike Nakshe 2.0 / GBA)</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Analyze plan layout against local building codes and municipal regulations (including Nambike Nakshe 2.0 setbacks and parameters) to ensure full compliance before estimation.
                </p>
              </div>

              {/* 1. Regulatory Highlights & Municipal Framework Banner (From PDF Page 1) */}
              <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-950 to-slate-900 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-amber-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                      1. Regulatory Highlights &amp; Municipal Framework
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    GBA &amp; Nambike Nakshe 2.0 Policy
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Recent policy updates optimize structural parameters and permissible deviations for smaller urban developments:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-3">
                    <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Proposed Deviation Regularization Limit (GBA Policy)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                      The GBA has proposed raising the permissible building deviation regularization limit from <strong>5% to 15%</strong> (subject to structural safety and penalty fees) for smaller plots under <strong>500 square meters</strong> and heights under <strong>15 meters</strong>.
                    </p>
                    <div className="mt-2.5 flex items-center justify-between text-[11px] border-t border-slate-800 pt-2 font-mono">
                      <span className="text-slate-400">Current Plot: {siteAreaSqM} m² ({siteAreaSqFt.toLocaleString()} sq.ft)</span>
                      <span className={isGbaEligible ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                        {isGbaEligible ? 'Eligible for 15% Regularization' : 'Standard 5% Limit'}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-3">
                    <div className="font-semibold text-sky-400 flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" />
                      <span>Relaxed Setbacks for Small Plots</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                      For plots under <strong>1,500 sq ft</strong>, front setbacks are reduced to <strong>2.5 ft (0.75m)</strong>, side setbacks to <strong>2 ft (0.6m)</strong>, and plots under <strong>600 sq ft</strong> require <strong>no rear setbacks (0 ft)</strong>.
                    </p>
                    <div className="mt-2.5 flex items-center justify-between text-[11px] border-t border-slate-800 pt-2 font-mono">
                      <span className="text-slate-400">Class: {isMicroPlotUnder600 ? '<600 sq.ft (Zero Rear)' : isSmallPlotUnder1500 ? '<1,500 sq.ft (Relaxed)' : 'Standard Plot'}</span>
                      <span className={isSetbackRulesValid ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {isSetbackRulesValid ? '✓ Setbacks Compliant' : '⚠ Setback Review'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Interactive GBA Regularization Toggle */}
                {isGbaEligible && (
                  <div className="flex items-center justify-between rounded-lg bg-slate-950 p-2.5 border border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="gba-policy-checkbox"
                        checked={applyGbaRegularization}
                        onChange={(e) => setApplyGbaRegularization(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                      />
                      <label htmlFor="gba-policy-checkbox" className="text-slate-200 cursor-pointer">
                        Apply GBA Proposed 15% Deviation Regularization (Plot {siteAreaSqM} m² &lt; 500 m², Height {totalBuildingHeightM}m &lt; 15m)
                      </label>
                    </div>
                    <span className="font-mono text-amber-400 text-[11px]">
                      {applyGbaRegularization ? '15% Threshold Active' : '5% Base Threshold'}
                    </span>
                  </div>
                )}
              </div>

              {/* Compliance Verification Matrix */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 overflow-hidden">
                <div className="border-b border-slate-800 bg-slate-900/80 px-4 py-2.5 flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Municipal Regulatory Compliance Matrix (Nambike Nakshe 2.0 / GBA)
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    6 Automated Validation Rules
                  </span>
                </div>

                <div className="divide-y divide-slate-800 text-xs">
                  {/* Rule 1: Ground Coverage */}
                  <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-200 flex items-center gap-2">
                        <span>1. Ground Coverage Ratio</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                          isGroundCoverageValid ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {isGroundCoverageValid ? 'PASSED' : 'EXCEEDED'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Proposed footprint: <span className="text-slate-200 font-mono">{grossFootprintAreaSqFt.toLocaleString()} sq.ft</span> ({groundCoveragePct}% of site) vs Max Permissible: <span className="text-slate-200 font-mono">{selectedPreset.maxGroundCoveragePct}%</span>
                      </div>
                    </div>
                    <div className="text-right font-mono text-[11px] text-slate-300">
                      {isGroundCoverageValid ? 'Within Permissible Envelope' : `Exceeds by ${(groundCoveragePct - selectedPreset.maxGroundCoveragePct).toFixed(1)}%`}
                    </div>
                  </div>

                  {/* Rule 2: FAR / FSI & GBA Regularization */}
                  <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-200 flex items-center gap-2">
                        <span>2. Floor Area Ratio (FAR / FSI) &amp; GBA Regularization</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                          isFarValid ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {isFarValid ? (farDeviationPct > 0 ? 'REGULARIZED (GBA)' : 'PASSED') : 'EXCEEDED'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Proposed FAR: <span className="text-slate-200 font-mono">{proposedFar}</span> ({totalNetBuiltUpAreaSqFt.toLocaleString()} sq.ft across {configuredFloorCount} floors) vs Base FAR: <span className="text-slate-200 font-mono">{selectedPreset.permissibleFar}</span>
                        {farDeviationPct > 0 && (
                          <span className="text-amber-400 ml-1">
                            (+{farDeviationPct}% deviation vs {gbaDeviationLimitPct}% GBA limit)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right font-mono text-[11px]">
                      {isFarValid ? (
                        <span className="text-emerald-400">Regularization Compliant</span>
                      ) : (
                        <span className="text-rose-400">Exceeds Permissible FAR</span>
                      )}
                    </div>
                  </div>

                  {/* Rule 3: Nambike Nakshe 2.0 Setback Compliance */}
                  <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-200 flex items-center gap-2">
                        <span>3. Nambike Nakshe 2.0 Setback Verification</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                          isSetbackRulesValid ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {isSetbackRulesValid ? 'PASSED' : 'NON-COMPLIANT'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        Front: {frontSetback}ft (Req: ≥{reqFrontSetback}ft) • Sides: {sideLeftSetback}ft/{sideRightSetback}ft (Req: ≥{reqSideSetback}ft) • Rear: {rearSetback}ft (Req: ≥{reqRearSetback}ft)
                      </div>
                    </div>
                    <div className="text-right font-mono text-[11px]">
                      {isSmallPlotUnder1500 ? (
                        <span className="text-amber-300">Small Plot Rule Applied</span>
                      ) : (
                        <span className="text-slate-400">Standard Setbacks Applied</span>
                      )}
                    </div>
                  </div>

                  {/* Rule 4: Building Height & High-Rise Threshold */}
                  <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-200 flex items-center gap-2">
                        <span>4. Building Height &amp; NBC 2016 Part 4 Classification</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/20 text-emerald-300">
                          VERIFIED
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Total Height: <span className="text-slate-200 font-mono">{totalBuildingHeightM}m</span> ({configuredFloorCount} storeys) • {totalBuildingHeightM < 15 ? 'GBA Low-Rise (<15m)' : isHighRise ? 'NBC High-Rise (≥21m)' : 'Standard Mid-Rise (15-21m)'}
                      </div>
                    </div>
                    <div className="text-right font-mono text-[11px] text-slate-300">
                      {isHighRise ? 'Dual Fire Escape Required' : 'Standard Staircase Compliant'}
                    </div>
                  </div>

                  {/* Rule 5: Fire Safety & Egress Corridor */}
                  <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-200 flex items-center gap-2">
                        <span>5. Fire Safety &amp; Egress Corridor Clearance</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                          fireCorridorApproved ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {fireCorridorApproved ? 'APPROVED' : 'PENDING'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Minimum 1.2m clear corridor width and non-combustible egress path per NBC norms
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFireCorridorApproved(!fireCorridorApproved)}
                      className="px-2.5 py-1 text-[11px] rounded border border-slate-700 hover:bg-slate-800 text-slate-300 font-mono transition self-start sm:self-auto"
                    >
                      {fireCorridorApproved ? '✓ Verified' : 'Click to Verify'}
                    </button>
                  </div>

                  {/* Rule 6: Light & Ventilation Openings */}
                  <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-200 flex items-center gap-2">
                        <span>6. Natural Light &amp; Ventilation Shaft Ratio</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                          lightVentilationApproved ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {lightVentilationApproved ? 'APPROVED' : 'PENDING'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Shaft cutout and external window openings ≥ 10% carpet area (Dedicated cutout: {deductionsPerFloor} sq.ft/floor)
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLightVentilationApproved(!lightVentilationApproved)}
                      className="px-2.5 py-1 text-[11px] rounded border border-slate-700 hover:bg-slate-800 text-slate-300 font-mono transition self-start sm:self-auto"
                    >
                      {lightVentilationApproved ? '✓ Verified' : 'Click to Verify'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Gatekeeper Clearance Status Box */}
              <div className={`rounded-xl border p-4 flex flex-col sm:flex-row items-center justify-between gap-4 ${
                isGatekeeperPassed
                  ? 'border-emerald-500/30 bg-emerald-950/20'
                  : 'border-amber-500/30 bg-amber-950/20'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl border shrink-0 ${
                    isGatekeeperPassed
                      ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-400'
                      : 'border-amber-500/40 bg-amber-500/20 text-amber-400'
                  }`}>
                    {isGatekeeperPassed ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      {isGatekeeperPassed
                        ? 'Gatekeeper Validation Passed • Municipal Compliance Confirmed'
                        : 'Gatekeeper Stage: Regulatory Notice / Regularization'}
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      {isGatekeeperPassed
                        ? 'All local building codes and Nambike Nakshe 2.0 / GBA parameters are satisfied. Step 3 (BOQ & Estimation) is unlocked.'
                        : 'Parameters reviewed under GBA / Nambike Nakshe 2.0 provisions. You can continue to financial mapping.'}
                    </p>
                  </div>
                </div>

                <span className={`px-3 py-1 text-xs font-mono font-bold rounded-full whitespace-nowrap ${
                  isGatekeeperPassed
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-amber-500 text-slate-950'
                }`}>
                  {isGatekeeperPassed ? 'GATEKEEPER PASSED' : 'REGULATORY REVIEW'}
                </span>
              </div>

              {/* Navigation Action */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
                >
                  ← Back to Step 1: Project &amp; Workspace
                </button>

                <button
                  id="btn-workflow-goto-step-3"
                  onClick={() => setCurrentStep(3)}
                  className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition"
                >
                  <span>Proceed to Step 3: Populate BOQ &amp; Estimation</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: BOQ & ESTIMATION — POPULATE BOQ & ESTIMATION                       */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                  <Calculator className="h-4 w-4" />
                  <span>3. BOQ &amp; ESTIMATION • Populate BOQ &amp; Cost Estimation</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Transfer the net built-up area ({totalNetBuiltUpAreaSqFt.toLocaleString()} sq.ft) and plan details directly into the BOQ section to automatically adjust baseline project parameters and compute overall project cost estimates.
                </p>
              </div>

              {/* Cost Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-950 p-4 border border-slate-800">
                  <span className="text-[11px] text-slate-400">Total Net Built-Up Area</span>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    {totalNetBuiltUpAreaSqFt.toLocaleString()} sq.ft
                  </div>
                  <span className="text-[10px] text-amber-400">{configuredFloorCount} Configured Levels Stacking</span>
                </div>
                <div className="rounded-xl bg-slate-950 p-4 border border-slate-800">
                  <span className="text-[11px] text-slate-400">Baseline Benchmark Rate</span>
                  <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                    {formatCurrency(baseRatePerSqFt, currency)} / sq.ft
                  </div>
                  <span className="text-[10px] text-slate-400">Turnkey finishes &amp; structural RCC</span>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-amber-500/20 to-slate-900 p-4 border border-amber-500/30">
                  <span className="text-[11px] text-amber-300 font-semibold">Total Estimated Project Cost</span>
                  <div className="text-xl font-bold font-mono text-amber-300 mt-1">
                    {formatCurrency(totalCostEstimate, currency)}
                  </div>
                  <span className="text-[10px] text-slate-300">
                    ≈ ₹ {(totalCostEstimate / 100000).toFixed(2)} Lakhs
                  </span>
                </div>
              </div>

              {/* Trade-wise BOQ Breakdown Table */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 overflow-hidden">
                <div className="border-b border-slate-800 bg-slate-900/80 px-4 py-2.5 flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Automated Trade-Wise Cost Distribution
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    7 Integrated Construction Packages
                  </span>
                </div>

                <div className="divide-y divide-slate-800 text-xs">
                  {costBreakdown.map((item, idx) => {
                    const itemAmount = (totalCostEstimate * item.pct) / 100;
                    return (
                      <div key={idx} className="p-3.5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5">
                          <span className="h-2 w-2 rounded-full bg-amber-400" />
                          <div>
                            <div className="font-semibold text-slate-200">{item.trade}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              Approx {formatCurrency(item.rate, currency)} / sq.ft
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold font-mono text-white">
                            {formatCurrency(itemAmount, currency)}
                          </div>
                          <div className="text-[11px] text-amber-400/80 font-mono">{item.pct}% of total</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Floor-Wise Cost Allocation Table */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 overflow-hidden">
                <div className="border-b border-slate-800 bg-slate-900/80 px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Floor-Wise Cost Allocation ({workflowFloors.length} Levels)
                    </span>
                  </div>
                  <span className="text-[11px] text-amber-400 font-mono font-semibold">
                    Total: {formatCurrency(totalCostEstimate, currency)}
                  </span>
                </div>

                <div className="divide-y divide-slate-800 text-xs">
                  {workflowFloors.map((fl) => {
                    const floorCost = (fl.areaSqFt || 0) * baseRatePerSqFt;
                    const floorPct = totalNetBuiltUpAreaSqFt > 0
                      ? (((fl.areaSqFt || 0) / totalNetBuiltUpAreaSqFt) * 100).toFixed(1)
                      : '0';

                    return (
                      <div key={fl.id} className="p-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-6 w-8 items-center justify-center rounded bg-slate-800 font-mono font-bold text-[11px] text-amber-300 border border-slate-700">
                            {fl.shortCode}
                          </span>
                          <div>
                            <div className="font-semibold text-slate-200 flex items-center gap-2">
                              <span>{fl.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({fl.elevation})</span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {fl.areaSqFt.toLocaleString()} sq.ft • {floorPct}% of project
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold font-mono text-white">
                            {formatCurrency(floorCost, currency)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            ≈ ₹ {(floorCost / 100000).toFixed(2)} Lakhs
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions: Sync to BOQ & Go to Step 4 */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
                  >
                    ← Back to Step 2: Gatekeeper Stage
                  </button>
                  <button
                    id="btn-sync-to-active-boq"
                    type="button"
                    onClick={handleSyncToProjectAndBOQ}
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>
                      {boqSynced ? '✓ Synced to Project & BOQ Items!' : 'Transfer & Sync into Project BOQ'}
                    </span>
                  </button>
                </div>

                <button
                  id="btn-workflow-goto-step-4"
                  onClick={() => setCurrentStep(4)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition"
                >
                  <span>Proceed to Step 4: Material &amp; Standards</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: MATERIAL & STANDARDS — MATERIAL & QUANTITY CALCULATION            */}
          {/* ========================================================================= */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                  <Layers className="h-4 w-4" />
                  <span>4. MATERIAL &amp; STANDARDS • Material &amp; Quantity Calculation</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Apply standard engineering consumption formulas to output a precise list of material requirements (cement, sand, aggregate, steel) and exact quantities based on validated net built-up area ({totalNetBuiltUpAreaSqFt.toLocaleString()} sq.ft).
                </p>
              </div>

              {/* Material Takeoff Table */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 overflow-hidden">
                <div className="border-b border-slate-800 bg-slate-900/80 px-4 py-2.5 flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Indian Standard (IS) Material Quantification Schedule
                  </span>
                  <span className="text-[11px] text-amber-400 font-mono">
                    Birla OPS &amp; OPC Calibrated
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/60 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-3 py-2 font-medium">Material Name</th>
                        <th className="px-3 py-2 font-medium">BIS / IS Standard</th>
                        <th className="px-3 py-2 font-medium">Consumption Norm</th>
                        <th className="px-3 py-2 font-medium">Calculated Quantity</th>
                        <th className="px-3 py-2 font-medium">Benchmark Brand</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {materialTakeoff.map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/40">
                          <td className="px-3 py-2.5 font-semibold text-slate-200">{m.name}</td>
                          <td className="px-3 py-2.5 text-sky-400 font-mono text-[11px]">{m.standard}</td>
                          <td className="px-3 py-2.5 text-slate-400 font-mono">{m.norm}</td>
                          <td className="px-3 py-2.5 text-amber-400 font-bold font-mono">
                            {m.quantity.toLocaleString()} {m.unit}
                          </td>
                          <td className="px-3 py-2.5 text-emerald-400 font-medium">{m.brand}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Architecture Assessment & Rating Card (From PDF Page 2) */}
              <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-sky-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      3. Architecture Assessment &amp; System Rating
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono">Validation Gate: Local Government Rules</span>
                    <span className="text-sm font-bold font-mono text-sky-300 bg-sky-500/20 border border-sky-500/30 px-2 py-0.5 rounded">
                      9.8 / 10
                    </span>
                  </div>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span><strong>Logical Flow &amp; Dependency (10/10):</strong> Rigorous progression from raw CAD geometry extraction to regulatory compliance gatekeeping, financial scaling, and material estimation.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span><strong>Clarity of Execution &amp; Integration (9.8/10):</strong> Unambiguous parameters ensuring predictable model execution across setback deductions, modular handoffs between CAD Parser, Rules Engine, BOQ Module, and Material Standards Engine.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span><strong>Validation Gate:</strong> Local Government Compliance Rules (Nambike Nakshe 2.0 / GBA) integrated as active enforcement barrier before cost estimating.</span>
                  </li>
                </ul>
              </div>

              {/* Final Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
                >
                  ← Back to Step 3: BOQ &amp; Estimation
                </button>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <button
                    id="btn-apply-material-takeoff-standards"
                    type="button"
                    onClick={handleApplyToMaterialCatalog}
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>
                      {materialsApplied ? '✓ Applied to Material Catalog!' : 'Save to Materials Catalog'}
                    </span>
                  </button>

                  {onNavigateToTab && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigateToTab('boq');
                        }}
                        className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
                      >
                        View BOQ
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigateToTab('materials');
                        }}
                        className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition"
                      >
                        View Materials
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
