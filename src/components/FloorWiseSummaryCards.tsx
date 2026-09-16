import React from 'react';
import { BuildingFloor, FloorWiseTotal } from '../types';
import { formatCurrency, CurrencyCode } from '../utils/formatters';
import { Layers, ArrowUpRight, TrendingUp, SlidersHorizontal } from 'lucide-react';

interface FloorWiseSummaryCardsProps {
  floors: BuildingFloor[];
  floorTotals: FloorWiseTotal[];
  selectedFloorId: string | 'all';
  onSelectFloor: (floorId: string | 'all') => void;
  currency: CurrencyCode;
  onOpenFloorManager: () => void;
  onOpenDistributionModal: () => void;
}

export const FloorWiseSummaryCards: React.FC<FloorWiseSummaryCardsProps> = ({
  floors,
  floorTotals,
  selectedFloorId,
  onSelectFloor,
  currency,
  onOpenFloorManager,
  onOpenDistributionModal,
}) => {
  const totalBuildingCost = floorTotals.reduce((sum, f) => sum + f.subtotal, 0);

  return (
    <div id="floor-wise-summary-container" className="space-y-3">
      {/* Top Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Building Levels & Floor Breakdown
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {floors.length} Levels
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Quantities and rates individually itemized by vertical building elevation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-open-distribution-tools"
            onClick={onOpenDistributionModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition"
            title="Auto-distribute quantities or duplicate typical floor takeoffs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span>Distribution Tools</span>
          </button>

          <button
            type="button"
            id="btn-manage-building-floors"
            onClick={onOpenFloorManager}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-medium transition"
            title="Configure building levels, slab areas, and elevations"
          >
            <span>Configure Levels</span>
          </button>
        </div>
      </div>

      {/* Level Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* All Levels Consolidated Card */}
        <button
          type="button"
          id="btn-filter-all-levels"
          onClick={() => onSelectFloor('all')}
          className={`p-3 rounded-xl text-left transition relative border ${
            selectedFloorId === 'all'
              ? 'bg-amber-500/15 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
              : 'bg-slate-900/80 hover:bg-slate-800/60 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              ALL
            </span>
            <span className="text-[10px] font-mono text-amber-400 font-semibold">100%</span>
          </div>
          <div className="text-xs font-semibold text-slate-100 truncate">Entire Building</div>
          <div className="text-sm font-mono font-bold text-amber-400 mt-1">
            {formatCurrency(totalBuildingCost, currency)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Matrix Format</span>
            <ArrowUpRight className="w-3 h-3 text-slate-500" />
          </div>
        </button>

        {/* Individual Floor Cards */}
        {floors.map((floor) => {
          const stats = floorTotals.find((t) => t.floorId === floor.id);
          const isSelected = selectedFloorId === floor.id;
          const subtotal = stats?.subtotal || 0;
          const pct = stats?.percentageOfBuilding || 0;
          const ratePerSqFt = stats?.ratePerSqFt || 0;

          return (
            <button
              key={floor.id}
              type="button"
              id={`btn-filter-floor-${floor.id}`}
              onClick={() => onSelectFloor(floor.id)}
              className={`p-3 rounded-xl text-left transition relative border group ${
                isSelected
                  ? 'bg-amber-500/15 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                  : 'bg-slate-900/80 hover:bg-slate-800/60 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                  {floor.shortCode}
                </span>
                <span className="text-[10px] font-mono text-slate-400">{floor.elevation}</span>
              </div>
              <div className="text-xs font-semibold text-slate-100 truncate group-hover:text-amber-300">
                {floor.name.replace(/\(.*\)/, '').trim()}
              </div>
              <div className="text-sm font-mono font-bold text-slate-200 mt-1">
                {formatCurrency(subtotal, currency)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between font-mono">
                <span>{floor.areaSqFt} sq.ft</span>
                <span className="text-amber-400/90 font-semibold">{pct}%</span>
              </div>
              <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                ₹{ratePerSqFt}/sq.ft
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
