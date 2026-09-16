import React, { useState } from 'react';
import { BOQItem, BuildingFloor } from '../types';
import {
  SlidersHorizontal,
  X,
  Check,
  Copy,
  Percent,
  Sparkles,
  Layers,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import {
  distributeItemQuantityByFloorArea,
  copyFloorQuantitiesAcrossItems,
  getStandardFloorDistribution,
  ensureItemFloorBreakdown
} from '../utils/floorTakeoffEngine';

interface FloorDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  floors: BuildingFloor[];
  activeItem?: BOQItem | null;
  allItems: BOQItem[];
  onUpdateItem: (updatedItem: BOQItem) => void;
  onUpdateAllItems: (updatedItems: BOQItem[]) => void;
}

export const FloorDistributionModal: React.FC<FloorDistributionModalProps> = ({
  isOpen,
  onClose,
  floors,
  activeItem,
  allItems,
  onUpdateItem,
  onUpdateAllItems,
}) => {
  const [activeTab, setActiveTab] = useState<'item_split' | 'copy_floor' | 'bulk_area'>('item_split');

  // Item custom split state
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>(() => {
    if (activeItem?.floorBreakdown) {
      return { ...activeItem.floorBreakdown };
    }
    return {};
  });

  // Copy floor state
  const [sourceFloorId, setSourceFloorId] = useState<string>(floors[1]?.id || floors[0]?.id || '');
  const [targetFloorId, setTargetFloorId] = useState<string>(floors[2]?.id || floors[1]?.id || '');

  // Status message
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Total area
  const totalArea = floors.reduce((sum, f) => sum + f.areaSqFt, 0);

  // If activeItem changed, sync quantities
  const currentItem = activeItem ? ensureItemFloorBreakdown(activeItem, floors) : null;
  const currentBreakdown = itemQuantities;

  // Handle single item floor input change
  const handleItemFloorChange = (floorId: string, val: number) => {
    setItemQuantities((prev) => ({
      ...prev,
      [floorId]: Math.max(0, Number(val) || 0),
    }));
  };

  // Reset to area-proportional split for this item
  const handleResetToAreaSplit = () => {
    if (!currentItem) return;
    const distributed = distributeItemQuantityByFloorArea(currentItem, currentItem.quantity, floors);
    setItemQuantities(distributed.floorBreakdown || {});
    setBannerMessage('Item quantities distributed proportionally by floor slab area.');
  };

  // Reset to standard QS engineering split for this item
  const handleResetToStandardQSSplit = () => {
    if (!currentItem) return;
    const fractions = getStandardFloorDistribution(currentItem, floors);
    const newBreakdown: Record<string, number> = {};
    floors.forEach((f) => {
      const frac = fractions[f.id] || 0;
      newBreakdown[f.id] = Math.round(currentItem.quantity * frac * 10) / 10;
    });
    setItemQuantities(newBreakdown);
    setBannerMessage('Item quantities calibrated with civil engineering trade rules.');
  };

  // Save single item breakdown
  const handleSaveItemBreakdown = () => {
    if (!currentItem) return;
    const totalQty = Object.values(itemQuantities).reduce((sum, q) => sum + (Number(q) || 0), 0);
    const updated: BOQItem = {
      ...currentItem,
      quantity: totalQty,
      amount: Math.round(totalQty * currentItem.rate * 100) / 100,
      floorBreakdown: itemQuantities,
    };
    onUpdateItem(updated);
    onClose();
  };

  // Execute Copy Floor
  const handleExecuteCopyFloor = () => {
    if (sourceFloorId === targetFloorId) {
      setBannerMessage('Source and target floors must be different.');
      return;
    }
    const updated = copyFloorQuantitiesAcrossItems(allItems, sourceFloorId, targetFloorId, floors);
    onUpdateAllItems(updated);
    const src = floors.find((f) => f.id === sourceFloorId)?.name;
    const tgt = floors.find((f) => f.id === targetFloorId)?.name;
    setBannerMessage(`Successfully duplicated all takeoff quantities from ${src} to ${tgt}.`);
  };

  // Execute Bulk Area-Proportional Distribution for all items
  const handleExecuteBulkAreaDistribution = () => {
    const updated = allItems.map((item) => {
      const ensured = ensureItemFloorBreakdown(item, floors);
      return distributeItemQuantityByFloorArea(ensured, ensured.quantity, floors);
    });
    onUpdateAllItems(updated);
    setBannerMessage('All schedule items distributed across floors based on slab area proportions.');
  };

  const itemSum = Object.values(itemQuantities).reduce((sum, q) => sum + (Number(q) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Floor-Wise Quantity Distribution Tools
              </h2>
              <p className="text-xs text-slate-400">
                Specify, split, or duplicate quantities across building elevations
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 pt-2">
          {activeItem && (
            <button
              type="button"
              onClick={() => setActiveTab('item_split')}
              className={`px-3.5 py-2 text-xs font-medium border-b-2 transition ${
                activeTab === 'item_split'
                  ? 'border-amber-400 text-amber-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Active Item Level Breakdown
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('copy_floor')}
            className={`px-3.5 py-2 text-xs font-medium border-b-2 transition ${
              activeTab === 'copy_floor'
                ? 'border-amber-400 text-amber-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Duplicate Typical Floor Takeoff
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bulk_area')}
            className={`px-3.5 py-2 text-xs font-medium border-b-2 transition ${
              activeTab === 'bulk_area'
                ? 'border-amber-400 text-amber-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Proportional Area Distribution
          </button>
        </div>

        {/* Banner notification */}
        {bannerMessage && (
          <div className="mx-4 mt-3 p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
            <span>{bannerMessage}</span>
            <button
              type="button"
              onClick={() => setBannerMessage(null)}
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'item_split' && currentItem && (
            <div className="space-y-4">
              {/* Item Info Banner */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <div className="text-xs font-semibold text-slate-200">{currentItem.name}</div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                  <span>Category: <strong className="text-slate-300">{currentItem.category}</strong></span>
                  <span>Unit: <strong className="text-amber-400">{currentItem.unit}</strong></span>
                  <span>Rate: <strong className="text-emerald-400">₹{currentItem.rate}</strong></span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleResetToAreaSplit}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
                >
                  <Percent className="w-3 h-3 text-amber-400" />
                  <span>Split by Floor Area</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetToStandardQSSplit}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Standard Construction Allocation</span>
                </button>
              </div>

              {/* Levels Sliders / Inputs */}
              <div className="space-y-2.5">
                <div className="text-xs font-mono text-slate-400 uppercase">
                  Level Quantities ({currentItem.unit})
                </div>

                {floors.map((floor) => {
                  const val = itemQuantities[floor.id] !== undefined ? itemQuantities[floor.id] : 0;
                  const floorCost = Math.round(val * currentItem.rate);
                  const pct = itemSum > 0 ? Math.round((val / itemSum) * 100) : 0;

                  return (
                    <div
                      key={floor.id}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-[140px]">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono font-bold text-amber-400 border border-slate-700">
                            {floor.shortCode}
                          </span>
                          <span className="text-xs font-medium text-slate-200">{floor.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {floor.areaSqFt} sq.ft ({floor.elevation})
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <input
                            type="number"
                            step={currentItem.unit === 'MT' || currentItem.unit === 'm3' ? '0.1' : '1'}
                            value={val}
                            onChange={(e) =>
                              handleItemFloorChange(floor.id, parseFloat(e.target.value) || 0)
                            }
                            className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-right font-mono font-semibold text-xs text-amber-400 focus:outline-none focus:border-amber-500"
                          />
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            ₹{floorCost.toLocaleString()} ({pct}%)
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total Qty Check */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-medium">Total Item Quantity Across Floors:</span>
                <span className="text-sm font-bold text-amber-400">
                  {Math.round(itemSum * 100) / 100} {currentItem.unit} (₹{Math.round(itemSum * currentItem.rate).toLocaleString()})
                </span>
              </div>
            </div>
          )}

          {activeTab === 'copy_floor' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                In multi-story construction, upper levels (e.g. 1st Floor, 2nd Floor) often share identical structural layouts, masonry wall lengths, and finishes with the typical lower level. Duplicate takeoff quantities in one click.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                  <label className="block text-xs font-mono text-slate-400">
                    Source Floor (Copy From)
                  </label>
                  <select
                    value={sourceFloorId}
                    onChange={(e) => setSourceFloorId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    {floors.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.shortCode} - {f.name} ({f.areaSqFt} sq.ft)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                  <label className="block text-xs font-mono text-slate-400">
                    Target Floor (Overwrite To)
                  </label>
                  <select
                    value={targetFloorId}
                    onChange={(e) => setTargetFloorId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    {floors.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.shortCode} - {f.name} ({f.areaSqFt} sq.ft)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExecuteCopyFloor}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
              >
                <Copy className="w-4 h-4" />
                <span>Duplicate Quantities Across Master Schedule</span>
              </button>
            </div>
          )}

          {activeTab === 'bulk_area' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                Automatically partition every master line item's total quantity across all configured building levels strictly based on each floor's relative slab built-up area:
              </div>

              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <div className="text-xs font-mono text-slate-400 mb-1">
                  CURRENT FLOOR AREA PROPORTIONS:
                </div>
                {floors.map((f) => {
                  const frac = totalArea > 0 ? (f.areaSqFt / totalArea) * 100 : 0;
                  return (
                    <div key={f.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60">
                      <span className="text-slate-300">{f.name}</span>
                      <span className="font-mono text-amber-400 font-semibold">
                        {f.areaSqFt.toLocaleString()} sq.ft ({Math.round(frac)}%)
                      </span>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleExecuteBulkAreaDistribution}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
              >
                <Percent className="w-4 h-4" />
                <span>Apply Area Distribution to All Items</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            Close
          </button>
          {activeTab === 'item_split' && currentItem && (
            <button
              type="button"
              onClick={handleSaveItemBreakdown}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm"
            >
              Apply Item Breakdown
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
