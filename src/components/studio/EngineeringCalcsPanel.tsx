import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Droplets,
  Leaf,
  PlusCircle,
  Check,
  Zap,
  Sun,
} from 'lucide-react';
import { Project, BOQItem } from '../../types';
import { CurrencyCode, formatCurrency } from '../../utils/formatters';
import { ensureItemFloorBreakdown } from '../../utils/floorTakeoffEngine';

export interface EngineeringCalcsPanelProps {
  activeProject: Project;
  boqItems: BOQItem[];
  currency: CurrencyCode;
  onUpdateBOQItems: (items: BOQItem[]) => void;
  onUpdateProject: (updated: Project) => void;
}

type CalcMode = 'concrete' | 'mep_solar' | 'carbon';

const CONCRETE_GRADES: Record<
  string,
  { cementBagsPerCum: number; sandCftPerCum: number; aggCftPerCum: number; ratePerCum: number }
> = {
  M20: { cementBagsPerCum: 8.0, sandCftPerCum: 15.5, aggCftPerCum: 31.0, ratePerCum: 5100 },
  M25: { cementBagsPerCum: 9.2, sandCftPerCum: 14.8, aggCftPerCum: 29.6, ratePerCum: 5450 },
  M30: { cementBagsPerCum: 10.4, sandCftPerCum: 14.2, aggCftPerCum: 28.4, ratePerCum: 6050 },
};

export const EngineeringCalcsPanel: React.FC<EngineeringCalcsPanelProps> = ({
  activeProject,
  boqItems,
  currency,
  onUpdateBOQItems,
  onUpdateProject,
}) => {
  const [mode, setMode] = useState<CalcMode>('concrete');

  // 1. Concrete & Rebar Mix state
  const [elementName, setElementName] = useState<'RCC Slab' | 'Columns' | 'Footings' | 'Beams'>('RCC Slab');
  const [lengthM, setLengthM] = useState<number>(12);
  const [widthM, setWidthM] = useState<number>(9);
  const [thicknessMm, setThicknessMm] = useState<number>(150);
  const [grade, setGrade] = useState<'M20' | 'M25' | 'M30'>('M25');
  const [steelDensityKgPerCum, setSteelDensityKgPerCum] = useState<number>(95);
  const [injectedConcrete, setInjectedConcrete] = useState<boolean>(false);

  const concreteCalc = useMemo(() => {
    const wetVol = Math.max(0.1, lengthM * widthM * (thicknessMm / 1000));
    const spec = CONCRETE_GRADES[grade] || CONCRETE_GRADES.M25;
    const cementBags = Math.ceil(wetVol * spec.cementBagsPerCum);
    const sandCft = Math.round(wetVol * spec.sandCftPerCum);
    const aggCft = Math.round(wetVol * spec.aggCftPerCum);
    const steelKg = Math.round(wetVol * steelDensityKgPerCum);
    const cementCost = cementBags * 375;
    const steelCost = steelKg * 68;
    const rmcTotalCost = Math.round(wetVol * spec.ratePerCum + steelCost);
    return {
      wetVol: Math.round(wetVol * 100) / 100,
      cementBags,
      sandCft,
      aggCft,
      steelKg,
      cementCost,
      steelCost,
      rmcTotalCost,
    };
  }, [lengthM, widthM, thicknessMm, grade, steelDensityKgPerCum]);

  const handleInjectConcreteToBoq = () => {
    const rmcItem = ensureItemFloorBreakdown(
      {
        id: `boq-calc-rmc-${Date.now()}`,
        name: `${grade} Design Mix RCC (${elementName} Batch)`,
        category: 'Concrete Works',
        unit: 'cum',
        quantity: concreteCalc.wetVol,
        rate: CONCRETE_GRADES[grade].ratePerCum,
        amount: Math.round(concreteCalc.wetVol * CONCRETE_GRADES[grade].ratePerCum),
        notes: `${lengthM}m × ${widthM}m × ${thicknessMm}mm · Eqv. ${concreteCalc.cementBags} bags cement, ${concreteCalc.sandCft} CFT sand`,
        stage: elementName === 'Footings' ? 'Substructure' : 'Superstructure',
        status: 'estimated',
      },
      activeProject.floors
    );

    const rebarItem = ensureItemFloorBreakdown(
      {
        id: `boq-calc-rebar-${Date.now() + 1}`,
        name: `Fe550D TMT Reinforcement Rebar (${elementName})`,
        category: 'Steel & Rebar',
        unit: 'kg',
        quantity: concreteCalc.steelKg,
        rate: 68,
        amount: concreteCalc.steelCost,
        notes: `${steelDensityKgPerCum} kg/m³ reinforcement ratio per IS 456`,
        stage: elementName === 'Footings' ? 'Substructure' : 'Superstructure',
        status: 'estimated',
      },
      activeProject.floors
    );

    onUpdateBOQItems([rmcItem, rebarItem, ...boqItems]);
    onUpdateProject({
      ...activeProject,
      auditLogs: [
        {
          id: `log-calc-rcc-${Date.now()}`,
          projectId: activeProject.id,
          actor: 'Engineering Calculator',
          action: `Injected ${elementName} Concrete & Rebar`,
          details: `${concreteCalc.wetVol} m³ ${grade} + ${concreteCalc.steelKg} kg Fe550D rebar added to BOQ`,
          timestamp: new Date().toISOString(),
        },
        ...(activeProject.auditLogs || []),
      ],
    });
    setInjectedConcrete(true);
    setTimeout(() => setInjectedConcrete(false), 3000);
  };

  // 2. MEP, Water & Solar Sizing (NBC 2016)
  const pgBedsCount =
    activeProject.pgPropertyDetails?.rooms?.reduce((sum, r: any) => sum + (Number(r.totalBeds) || Number(r.beds) || 1), 0) || 0;
  const [occupants, setOccupants] = useState<number>(
    pgBedsCount > 0 ? pgBedsCount : Math.max(6, Math.round((activeProject.builtUpAreaSqFt || 3200) / 320))
  );
  const [roofAreaSqFt, setRoofAreaSqFt] = useState<number>(
    Math.round((activeProject.builtUpAreaSqFt || 3200) / Math.max(2, activeProject.floors?.length || 3))
  );
  const [annualRainfallMm, setAnnualRainfallMm] = useState<number>(920);
  const [injectedSolar, setInjectedSolar] = useState<boolean>(false);

  const mepCalc = useMemo(() => {
    const area = activeProject.builtUpAreaSqFt || 3200;
    const connectedLoadKw = Math.round((area * 0.011) * 10) / 10; // ~11 W/sq.ft modern residential/co-living
    const dgBackupKva = Math.ceil((connectedLoadKw * 0.65) / 5) * 5;
    const hvacTr = Math.round((area * 0.6 / 165) * 10) / 10; // 60% conditioned @ 165 sq.ft/TR
    const dailyWaterLiters = occupants * 135; // NBC 2016 domestic norm
    const recommendedSumpLiters = Math.ceil((dailyWaterLiters * 2) / 1000) * 1000;
    const recommendedOhtLiters = Math.ceil(dailyWaterLiters / 500) * 500;
    const roofSqM = roofAreaSqFt * 0.0929;
    const annualRwhLiters = Math.round(roofSqM * annualRainfallMm * 0.85);
    const solarKwp = Math.max(2, Math.floor((roofAreaSqFt * 0.45) / 95));
    const annualSolarUnitsKwh = solarKwp * 1450;
    const solarCost = solarKwp * 54000;
    const annualSolarSavings = annualSolarUnitsKwh * 8;
    return {
      connectedLoadKw,
      dgBackupKva,
      hvacTr,
      dailyWaterLiters,
      recommendedSumpLiters,
      recommendedOhtLiters,
      annualRwhLiters,
      solarKwp,
      annualSolarUnitsKwh,
      solarCost,
      annualSolarSavings,
    };
  }, [activeProject.builtUpAreaSqFt, occupants, roofAreaSqFt, annualRainfallMm]);

  const handleInjectSolarToBoq = () => {
    const solarItem = ensureItemFloorBreakdown(
      {
        id: 'boq-calc-solar-pv',
        name: `${mepCalc.solarKwp} kWp Rooftop Bifacial Solar PV System (Net-Metered)`,
        category: 'MEP & Services',
        unit: 'kWp',
        quantity: mepCalc.solarKwp,
        rate: 54000,
        amount: mepCalc.solarCost,
        notes: `Generates ~${mepCalc.annualSolarUnitsKwh.toLocaleString()} kWh/yr (~${formatCurrency(mepCalc.annualSolarSavings, currency)}/yr utility offset)`,
        stage: 'Services',
        status: 'estimated',
      },
      activeProject.floors
    );
    const exists = boqItems.some((b) => b.id === 'boq-calc-solar-pv');
    const next = exists ? boqItems.map((b) => (b.id === 'boq-calc-solar-pv' ? solarItem : b)) : [solarItem, ...boqItems];
    onUpdateBOQItems(next);
    setInjectedSolar(true);
    setTimeout(() => setInjectedSolar(false), 3000);
  };

  // 3. Embodied Carbon & Envelope Audit (from actual BOQ items)
  const [wwrPct, setWwrPct] = useState<number>(28);
  const [useGreenMix, setUseGreenMix] = useState<boolean>(true);

  const carbonCalc = useMemo(() => {
    const areaSqFt = Math.max(500, activeProject.builtUpAreaSqFt || 3200);
    // Estimate embodied kgCO2e from live BOQ items
    let cementKgCo2 = 0;
    let steelKgCo2 = 0;
    let masonryFinishCo2 = 0;

    boqItems.forEach((item) => {
      const n = item.name.toLowerCase();
      const qty = Number(item.quantity) || 0;
      if (n.includes('cement')) {
        cementKgCo2 += qty * (item.unit.toLowerCase().includes('bag') ? 41 : 820);
      } else if (n.includes('concrete') || n.includes('rmc') || n.includes('pcc')) {
        cementKgCo2 += qty * 310;
      } else if (n.includes('steel') || n.includes('rebar') || n.includes('tmt')) {
        steelKgCo2 += qty * (item.unit.toLowerCase().includes('mt') ? 1850 : 1.85);
      } else if (n.includes('brick') || n.includes('aac') || n.includes('block')) {
        masonryFinishCo2 += qty * 110;
      } else {
        masonryFinishCo2 += 240;
      }
    });

    if (cementKgCo2 === 0 && steelKgCo2 === 0) {
      // Fallback geometric baseline when BOQ is empty
      cementKgCo2 = areaSqFt * 24;
      steelKgCo2 = areaSqFt * 7.8;
      masonryFinishCo2 = areaSqFt * 5.2;
    }

    const totalBaselineTons = Math.round(((cementKgCo2 + steelKgCo2 + masonryFinishCo2) / 1000) * 10) / 10;
    const savingsTons = useGreenMix
      ? Math.round(((cementKgCo2 * 0.28 + masonryFinishCo2 * 0.22) / 1000) * 10) / 10
      : 0;
    const netTons = Math.round((totalBaselineTons - savingsTons) * 10) / 10;
    const intensityPerSqFt = Math.round(((netTons * 1000) / areaSqFt) * 10) / 10;
    const envelopeHeatPenalty = wwrPct > 30 ? 'High solar gain (>30% WWR)' : 'Within ECBC 30% envelope target';

    return { totalBaselineTons, savingsTons, netTons, intensityPerSqFt, envelopeHeatPenalty };
  }, [boqItems, activeProject.builtUpAreaSqFt, useGreenMix, wwrPct]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white">
            Structural, MEP &amp; Embodied Carbon Calculators
          </h3>
          <p className="text-xs text-slate-400">
            IS-code engineering takeoffs and sustainability metrics linked directly to your BOQ.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg overflow-x-auto shrink-0">
          {[
            { id: 'concrete' as const, label: 'Concrete & Rebar', icon: Calculator },
            { id: 'mep_solar' as const, label: 'MEP, Water & Solar', icon: Droplets },
            { id: 'carbon' as const, label: 'Embodied Carbon', icon: Leaf },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMode(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition ${
                  mode === tab.id
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MODE 1: CONCRETE & REBAR MIX */}
      {mode === 'concrete' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-6 rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Structural Element</label>
                <select
                  value={elementName}
                  onChange={(e) => setElementName(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="RCC Slab">RCC Slab</option>
                  <option value="Columns">Columns</option>
                  <option value="Footings">Footings</option>
                  <option value="Beams">Beams</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Concrete Grade (IS 456)</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="M20">M20 (1 : 1.5 : 3)</option>
                  <option value="M25">M25 (1 : 1 : 2 / Design)</option>
                  <option value="M30">M30 (High-Strength RCC)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Length (m)</label>
                <input
                  type="number"
                  step={0.5}
                  min={0.5}
                  value={lengthM}
                  onChange={(e) => setLengthM(Math.max(0.2, Number(e.target.value) || 0.2))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Width (m)</label>
                <input
                  type="number"
                  step={0.5}
                  min={0.3}
                  value={widthM}
                  onChange={(e) => setWidthM(Math.max(0.2, Number(e.target.value) || 0.2))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Depth/Thick (mm)</label>
                <input
                  type="number"
                  step={25}
                  min={75}
                  value={thicknessMm}
                  onChange={(e) => setThicknessMm(Math.max(50, Number(e.target.value) || 50))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Rebar (kg/m³)</label>
                <input
                  type="number"
                  step={5}
                  min={40}
                  max={220}
                  value={steelDensityKgPerCum}
                  onChange={(e) => setSteelDensityKgPerCum(Math.max(20, Number(e.target.value) || 20))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              id="btn-calc-inject-concrete"
              type="button"
              onClick={handleInjectConcreteToBoq}
              className="w-full py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs inline-flex items-center justify-center gap-2 transition"
            >
              {injectedConcrete ? <Check className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
              <span>
                {injectedConcrete
                  ? 'Concrete & Rebar Added to BOQ'
                  : `Add ${concreteCalc.wetVol} m³ ${grade} + ${concreteCalc.steelKg} kg Steel to BOQ`}
              </span>
            </button>
          </div>

          <div className="lg:col-span-6 rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-semibold text-white">
                Material Takeoff Breakdown
              </span>
              <span className="text-xs font-mono text-amber-300 tabular-nums">
                Wet Volume {concreteCalc.wetVol} m³
              </span>
            </div>

            <div className="divide-y divide-slate-800/80 text-xs">
              <div className="py-2 flex justify-between">
                <span className="text-slate-300">Cement Required (50 kg bags)</span>
                <span className="font-mono font-bold text-white tabular-nums">
                  {concreteCalc.cementBags} bags
                </span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-300">M-Sand / River Sand</span>
                <span className="font-mono font-bold text-white tabular-nums">
                  {concreteCalc.sandCft} CFT
                </span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-300">20mm Coarse Aggregate</span>
                <span className="font-mono font-bold text-white tabular-nums">
                  {concreteCalc.aggCft} CFT
                </span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-300">Fe550D TMT Reinforcement Rebar</span>
                <span className="font-mono font-bold text-white tabular-nums">
                  {concreteCalc.steelKg.toLocaleString()} kg
                </span>
              </div>
              <div className="py-2.5 flex justify-between font-semibold">
                <span className="text-amber-300">Estimated Batch Cost (RMC + Rebar)</span>
                <span className="font-mono text-amber-300 tabular-nums">
                  {formatCurrency(concreteCalc.rmcTotalCost, currency)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: MEP, WATER & SOLAR SIZING */}
      {mode === 'mep_solar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-3">
            <div className="text-xs font-semibold text-white border-b border-slate-800 pb-2">
              Building Load Inputs ({(activeProject.builtUpAreaSqFt || 3200).toLocaleString()} sq.ft)
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Design Occupants / Residents</label>
                <input
                  type="number"
                  min={2}
                  max={500}
                  value={occupants}
                  onChange={(e) => setOccupants(Math.max(2, Number(e.target.value) || 2))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Effective Roof Catchment (sq.ft)</label>
                <input
                  type="number"
                  min={200}
                  step={50}
                  value={roofAreaSqFt}
                  onChange={(e) => setRoofAreaSqFt(Math.max(200, Number(e.target.value) || 200))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Annual City Rainfall (mm)</label>
                <input
                  type="number"
                  min={200}
                  max={3500}
                  value={annualRainfallMm}
                  onChange={(e) => setAnnualRainfallMm(Math.max(100, Number(e.target.value) || 100))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              id="btn-calc-inject-solar"
              type="button"
              onClick={handleInjectSolarToBoq}
              className="w-full py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs inline-flex items-center justify-center gap-2 transition"
            >
              {injectedSolar ? <Check className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              <span>
                {injectedSolar
                  ? 'Solar PV Package Synced to BOQ'
                  : `Add ${mepCalc.solarKwp} kWp Solar PV to BOQ`}
              </span>
            </button>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                <Zap className="w-3.5 h-3.5" />
                <span>Electrical &amp; HVAC Demand</span>
              </div>
              <div className="pt-1 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Sanctioned Load</span>
                  <span className="font-mono font-bold text-white tabular-nums">{mepCalc.connectedLoadKw} kW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">DG Backup Sizing</span>
                  <span className="font-mono font-bold text-white tabular-nums">{mepCalc.dgBackupKva} kVA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Peak Cooling Load</span>
                  <span className="font-mono font-bold text-white tabular-nums">{mepCalc.hvacTr} TR</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300">
                <Droplets className="w-3.5 h-3.5" />
                <span>Water &amp; Rainwater Harvesting</span>
              </div>
              <div className="pt-1 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Daily Demand (NBC)</span>
                  <span className="font-mono font-bold text-white tabular-nums">
                    {mepCalc.dailyWaterLiters.toLocaleString()} L/day
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">UG Sump / OHT</span>
                  <span className="font-mono font-bold text-white tabular-nums">
                    {(mepCalc.recommendedSumpLiters / 1000).toFixed(0)}kL / {(mepCalc.recommendedOhtLiters / 1000).toFixed(1)}kL
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Annual RWH Capture</span>
                  <span className="font-mono font-bold text-emerald-400 tabular-nums">
                    {mepCalc.annualRwhLiters.toLocaleString()} L/yr
                  </span>
                </div>
              </div>
            </div>

            <div className="sm:col-span-2 rounded-xl bg-slate-950 border border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-white">
                  Rooftop Solar PV Yield Estimate ({mepCalc.solarKwp} kWp Array)
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                  Produces ~{mepCalc.annualSolarUnitsKwh.toLocaleString()} kWh/yr · Est. savings{' '}
                  {formatCurrency(mepCalc.annualSolarSavings, currency)}/yr
                </p>
              </div>
              <div className="text-right font-mono tabular-nums">
                <span className="text-[11px] text-slate-400 block">Turnkey Capex</span>
                <span className="text-sm font-bold text-amber-300">
                  {formatCurrency(mepCalc.solarCost, currency)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: EMBODIED CARBON & ENVELOPE AUDIT */}
      {mode === 'carbon' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-6 rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Window-to-Wall Ratio (WWR)</span>
                <span className="font-mono font-bold text-amber-300 tabular-nums">{wwrPct}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={65}
                value={wwrPct}
                onChange={(e) => setWwrPct(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">{carbonCalc.envelopeHeatPenalty}</p>
            </div>

            <label className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={useGreenMix}
                onChange={(e) => setUseGreenMix(e.target.checked)}
                className="mt-0.5 accent-emerald-500"
              />
              <div className="text-xs">
                <div className="font-medium text-white">
                  Specify Green PSC Slag Cement &amp; AAC Blocks
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Replaces clinker-heavy OPC 53 &amp; clay bricks to cut embodied structural carbon by ~25%.
                </div>
              </div>
            </label>
          </div>

          <div className="lg:col-span-6 rounded-xl bg-slate-950 border border-slate-800 p-4 grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Baseline Structure Footprint</span>
              <span className="text-base font-bold text-white tabular-nums">
                {carbonCalc.totalBaselineTons} tCO₂e
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Net Optimized Embodied Carbon</span>
              <span className="text-base font-bold text-emerald-400 tabular-nums">
                {carbonCalc.netTons} tCO₂e
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Carbon Intensity</span>
              <span className="text-base font-bold text-amber-300 tabular-nums">
                {carbonCalc.intensityPerSqFt} kg/sq.ft
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Green Spec Reduction</span>
              <span className="text-base font-bold text-emerald-300 tabular-nums">
                -{carbonCalc.savingsTons} tCO₂e
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
