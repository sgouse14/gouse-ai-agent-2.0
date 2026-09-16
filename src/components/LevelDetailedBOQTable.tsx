import React, { useState } from 'react';
import { BOQItem, BuildingFloor, FloorWiseTotal } from '../types';
import { formatCurrency, CurrencyCode } from '../utils/formatters';
import {
  Layers,
  Plus,
  Trash2,
  Copy,
  SlidersHorizontal,
  ArrowRight,
  TrendingUp,
  Building,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface LevelDetailedBOQTableProps {
  floor: BuildingFloor;
  floorTotal?: FloorWiseTotal;
  items: BOQItem[];
  allFloors: BuildingFloor[];
  currency: CurrencyCode;
  contingencyPercent: number;
  onUpdateFloorQty: (itemId: string, floorId: string, newQty: number) => void;
  onUpdateRate: (itemId: string, newRate: number) => void;
  onCopyFromFloor: (sourceFloorId: string, targetFloorId: string) => void;
  onOpenItemDistribution: (item: BOQItem) => void;
}

export const LevelDetailedBOQTable: React.FC<LevelDetailedBOQTableProps> = ({
  floor,
  floorTotal,
  items,
  allFloors,
  currency,
  contingencyPercent,
  onUpdateFloorQty,
  onUpdateRate,
  onCopyFromFloor,
  onOpenItemDistribution,
}) => {
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  const [copySourceFloorId, setCopySourceFloorId] = useState<string>(
    allFloors.find((f) => f.id !== floor.id)?.id || ''
  );
  const [showCopyConfirm, setShowCopyConfirm] = useState(false);

  const levelItems = items.filter((item) => {
    const qty = (item.floorBreakdown && item.floorBreakdown[floor.id]) || 0;
    return showOnlyActive ? qty > 0 : true;
  });

  const levelSubtotal = floorTotal?.subtotal || 0;
  const contingencyAmount = Math.round(levelSubtotal * (contingencyPercent / 100));
  const levelGrandTotal = levelSubtotal + contingencyAmount;
  const ratePerSqFt = floor.areaSqFt > 0 ? Math.round(levelSubtotal / floor.areaSqFt) : 0;

  const handleCopy = () => {
    if (copySourceFloorId) {
      onCopyFromFloor(copySourceFloorId, floor.id);
      setShowCopyConfirm(false);
    }
  };

  return (
    <div id={`level-boq-table-${floor.id}`} className="space-y-4">
      {/* Floor Hero / Metric Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-mono font-bold">
                {floor.shortCode}
              </span>
              <h3 className="text-lg font-bold text-slate-100">{floor.name}</h3>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-xs border border-slate-700">
                Elev: {floor.elevation}
              </span>
            </div>
            {floor.description && (
              <p className="text-xs text-slate-400 max-w-2xl">{floor.description}</p>
            )}
          </div>

          {/* Quick Copy typical floor quantities */}
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-lg p-2">
            <Copy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-xs text-slate-300 font-medium">Duplicate Takeoff:</span>
            <select
              value={copySourceFloorId}
              onChange={(e) => setCopySourceFloorId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none"
            >
              {allFloors
                .filter((f) => f.id !== floor.id)
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    From {f.shortCode} ({f.name.replace(/\(.*\)/, '').trim()})
                  </option>
                ))}
            </select>
            <button
              type="button"
              id="btn-confirm-copy-floor"
              onClick={() => setShowCopyConfirm(true)}
              className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm"
              title="Copy quantities from selected floor into this floor"
            >
              Apply Copy
            </button>
          </div>
        </div>

        {/* Level Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/60">
            <div className="text-[11px] text-slate-400 uppercase font-mono">Floor Slab Area</div>
            <div className="text-base font-mono font-bold text-slate-100 mt-0.5">
              {floor.areaSqFt.toLocaleString()} <span className="text-xs font-normal text-slate-400">sq.ft</span>
            </div>
          </div>

          <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/60">
            <div className="text-[11px] text-slate-400 uppercase font-mono">Level Subtotal</div>
            <div className="text-base font-mono font-bold text-amber-400 mt-0.5">
              {formatCurrency(levelSubtotal, currency)}
            </div>
          </div>

          <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/60">
            <div className="text-[11px] text-slate-400 uppercase font-mono">Rate per Sq.Ft</div>
            <div className="text-base font-mono font-bold text-emerald-400 mt-0.5">
              ₹{ratePerSqFt.toLocaleString()} <span className="text-xs font-normal text-slate-400">/sq.ft</span>
            </div>
          </div>

          <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/60">
            <div className="text-[11px] text-slate-400 uppercase font-mono">% of Building Cost</div>
            <div className="text-base font-mono font-bold text-sky-400 mt-0.5">
              {floorTotal?.percentageOfBuilding || 0}%
            </div>
          </div>
        </div>

        {/* Copy confirmation banner */}
        {showCopyConfirm && (
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-between gap-3 text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Copying from <strong>{allFloors.find((f) => f.id === copySourceFloorId)?.name}</strong> will overwrite current quantities for <strong>{floor.name}</strong>. Continue?
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs"
              >
                Yes, Overwrite
              </button>
              <button
                type="button"
                onClick={() => setShowCopyConfirm(false)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table Toolbar */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              id="chk-show-only-active-floor-items"
              checked={showOnlyActive}
              onChange={(e) => setShowOnlyActive(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500"
            />
            <span>Show only items active on this level ({levelItems.length})</span>
          </label>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Schedule for Level: <span className="text-amber-400 font-bold">{floor.name}</span>
        </div>
      </div>

      {/* Level BOQ Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 font-mono text-[11px] text-slate-400">
                <th className="py-3 px-3 w-12 text-center">#</th>
                <th className="py-3 px-4 min-w-[280px]">Item Description</th>
                <th className="py-3 px-3 w-32">Category</th>
                <th className="py-3 px-3 w-24 text-center">Unit</th>
                <th className="py-3 px-3 w-32 text-right text-amber-300">Level Qty</th>
                <th className="py-3 px-3 w-32 text-right">Unit Rate (₹)</th>
                <th className="py-3 px-4 w-36 text-right font-bold text-slate-200">Level Amount</th>
                <th className="py-3 px-3 w-28 text-right">% of Level</th>
                <th className="py-3 px-2 w-16 text-center">Tools</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {levelItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    No items allocated to {floor.name}. Uncheck "Show only active items" above to assign quantities from the master schedule.
                  </td>
                </tr>
              ) : (
                levelItems.map((item, index) => {
                  const floorQty = (item.floorBreakdown && item.floorBreakdown[floor.id]) || 0;
                  const itemCost = Math.round(floorQty * item.rate);
                  const pctOfFloor = levelSubtotal > 0 ? Math.round((itemCost / levelSubtotal) * 1000) / 10 : 0;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-800/40 transition ${
                        floorQty === 0 ? 'opacity-50' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                        {index + 1}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-medium text-slate-200">{item.name}</div>
                        {item.notes && (
                          <div className="text-[11px] text-slate-400 italic mt-0.5 line-clamp-1">
                            {item.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-300">
                        {item.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            step={item.unit === 'MT' || item.unit === 'm3' ? '0.1' : '1'}
                            value={floorQty}
                            onChange={(e) =>
                              onUpdateFloorQty(item.id, floor.id, parseFloat(e.target.value) || 0)
                            }
                            className="w-24 bg-slate-950 border border-slate-700/80 rounded px-2 py-1 text-right font-mono text-xs font-semibold text-amber-300 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-slate-500 font-mono text-[10px]">₹</span>
                          <input
                            type="number"
                            value={item.rate}
                            onChange={(e) => onUpdateRate(item.id, Number(e.target.value) || 0)}
                            className="w-20 bg-slate-950/70 border border-slate-700/80 rounded px-1.5 py-1 text-right font-mono text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-100">
                        {formatCurrency(itemCost, currency)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-400 text-xs">
                        {pctOfFloor}%
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => onOpenItemDistribution(item)}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition"
                          title="Open distribution for this item"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot className="border-t-2 border-slate-700 font-mono text-xs bg-slate-950/90">
              <tr className="border-b border-slate-800">
                <td colSpan={6} className="py-3 px-4 text-right font-bold text-slate-300">
                  {floor.name} Subtotal:
                </td>
                <td className="py-3 px-4 text-right font-bold text-amber-400 text-sm">
                  {formatCurrency(levelSubtotal, currency)}
                </td>
                <td colSpan={2}></td>
              </tr>
              <tr className="border-b border-slate-800 text-slate-400">
                <td colSpan={6} className="py-2 px-4 text-right">
                  Contingency ({contingencyPercent}%):
                </td>
                <td className="py-2 px-4 text-right text-slate-300">
                  {formatCurrency(contingencyAmount, currency)}
                </td>
                <td colSpan={2}></td>
              </tr>
              <tr className="bg-amber-500/10 font-bold text-slate-100">
                <td colSpan={6} className="py-3.5 px-4 text-right text-amber-400 uppercase tracking-wider text-xs">
                  {floor.name} Total with Contingency:
                </td>
                <td className="py-3.5 px-4 text-right text-amber-400 text-base font-extrabold">
                  {formatCurrency(levelGrandTotal, currency)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
