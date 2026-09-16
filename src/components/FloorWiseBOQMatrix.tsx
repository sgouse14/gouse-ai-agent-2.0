import React, { useState } from 'react';
import { BOQItem, BuildingFloor, FloorWiseTotal } from '../types';
import { formatCurrency, CurrencyCode } from '../utils/formatters';
import {
  Trash2,
  Sliders,
  AlertTriangle,
  Info,
  Maximize2,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Layers,
  ArrowRight,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { ItemAuditStatus } from './BOQView';
import { exportBOQToExcel, exportBOQToExcelCSV } from '../utils/excelExport';

interface FloorWiseBOQMatrixProps {
  items: BOQItem[];
  floors: BuildingFloor[];
  floorTotals: FloorWiseTotal[];
  currency: CurrencyCode;
  contingencyPercent: number;
  auditResults?: Record<string, ItemAuditStatus>;
  isAuditActive?: boolean;
  onUpdateFloorQty: (itemId: string, floorId: string, newQty: number) => void;
  onUpdateRate: (itemId: string, newRate: number) => void;
  onDeleteItem: (itemId: string) => void;
  onOpenItemDistribution: (item: BOQItem) => void;
}

export const FloorWiseBOQMatrix: React.FC<FloorWiseBOQMatrixProps> = ({
  items,
  floors,
  floorTotals,
  currency,
  contingencyPercent,
  auditResults = {},
  isAuditActive = false,
  onUpdateFloorQty,
  onUpdateRate,
  onDeleteItem,
  onOpenItemDistribution,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = Array.from(new Set(items.map((i) => i.category || 'General')));

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate building totals
  const buildingSubtotal = floorTotals.reduce((sum, f) => sum + f.subtotal, 0);
  const contingencyAmount = Math.round(buildingSubtotal * (contingencyPercent / 100));
  const grandTotal = buildingSubtotal + contingencyAmount;
  const totalAreaSqFt = floors.reduce((sum, f) => sum + f.areaSqFt, 0);
  const overallRatePerSqFt = totalAreaSqFt > 0 ? Math.round(grandTotal / totalAreaSqFt) : 0;

  return (
    <div id="floor-wise-boq-matrix-panel" className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* Search & Category Filter Toolbar */}
      <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              id="input-search-floor-matrix"
              placeholder="Search schedule item by name or spec..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
            <Filter className="w-3 h-3 text-slate-400" />
            <select
              id="select-category-floor-matrix"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs"
            >
              <option value="all" className="bg-slate-900">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c} className="bg-slate-900">
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-slate-300 font-semibold">{filteredItems.length}</span>
            <span>of {items.length} items</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              id="btn-matrix-export-excel"
              onClick={() =>
                exportBOQToExcel({
                  items,
                  floors,
                  projectName: 'FloorWise_Building_BOQ',
                  currency,
                  contingencyPercent,
                  builtUpAreaSqFt: totalAreaSqFt,
                })
              }
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600/90 hover:bg-emerald-500 text-white font-medium text-xs transition shadow-sm"
              title="Export complete schedule into Microsoft Excel (.xlsx) workbook"
            >
              <FileSpreadsheet className="w-3 h-3 text-emerald-100" />
              <span>Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              id="btn-matrix-export-csv"
              onClick={() =>
                exportBOQToExcelCSV({
                  items,
                  floors,
                  projectName: 'FloorWise_Building_BOQ',
                  currency,
                  contingencyPercent,
                  builtUpAreaSqFt: totalAreaSqFt,
                })
              }
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition border border-slate-700"
              title="Export schedule into Excel-compatible CSV format"
            >
              <Download className="w-3 h-3 text-emerald-400" />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Floor-Wise Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            {/* Super-Header for Levels */}
            <tr className="border-b border-slate-800 bg-slate-950 font-mono text-[11px] text-slate-400">
              <th colSpan={4} className="py-2.5 px-3 text-left border-r border-slate-800/80">
                <span className="text-slate-300 font-semibold uppercase tracking-wider">
                  Schedule of Rates (SOR) Specifications
                </span>
              </th>
              <th
                colSpan={floors.length}
                className="py-2.5 px-3 text-center border-r border-slate-800/80 bg-amber-500/5 text-amber-400 font-semibold uppercase tracking-wider"
              >
                Quantities Required by Individual Building Level
              </th>
              <th colSpan={3} className="py-2.5 px-3 text-right bg-slate-950">
                <span className="text-slate-300 font-semibold uppercase tracking-wider">
                  Total Schedule of Quantities
                </span>
              </th>
            </tr>

            {/* Sub-Header Column Labels */}
            <tr className="border-b border-slate-800 bg-slate-900/90 font-mono text-[11px] text-slate-300 sticky top-0 z-10 shadow-sm">
              <th className="py-3 px-3 w-10 text-center font-bold">#</th>
              <th className="py-3 px-3 min-w-[260px] font-bold">Item Description & Work Stage</th>
              <th className="py-3 px-2 w-20 text-center font-bold">Unit</th>
              <th className="py-3 px-2 w-24 text-right font-bold border-r border-slate-800/80">Unit Rate</th>

              {/* Individual Floor Columns */}
              {floors.map((floor) => (
                <th
                  key={floor.id}
                  className="py-2.5 px-2 min-w-[105px] max-w-[125px] text-right bg-slate-900/60 border-r border-slate-800/60 font-mono"
                >
                  <div className="flex flex-col items-end">
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                      {floor.shortCode}
                    </span>
                    <span className="text-[10px] text-slate-200 font-medium truncate max-w-[100px] mt-0.5" title={floor.name}>
                      {floor.name.replace(/\(.*\)/, '').trim()}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {floor.elevation} ({floor.areaSqFt} sq.ft)
                    </span>
                  </div>
                </th>
              ))}

              {/* Summary Columns */}
              <th className="py-3 px-3 w-28 text-right font-bold text-amber-300">Total Qty</th>
              <th className="py-3 px-3 w-32 text-right font-bold text-slate-100">Total Amount</th>
              <th className="py-3 px-2 w-16 text-center font-bold">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60 font-sans">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7 + floors.length} className="py-12 text-center text-slate-400 text-xs">
                  No matching schedule items found.
                </td>
              </tr>
            ) : (
              filteredItems.map((item, index) => {
                const audit = isAuditActive ? auditResults[item.id] : null;
                const hasAuditError = isAuditActive && !!audit?.hasIssues;
                const breakdown = item.floorBreakdown || {};

                return (
                  <tr
                    key={item.id}
                    className={`transition hover:bg-slate-800/40 group ${
                      hasAuditError ? 'bg-red-950/20 border-l-2 border-l-red-500' : ''
                    }`}
                  >
                    {/* Index */}
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                      {index + 1}
                    </td>

                    {/* Item Description */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-start gap-1.5 flex-wrap">
                        <span className="text-slate-100 font-medium leading-snug">
                          {item.name}
                        </span>
                        {item.stage && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {item.stage}
                          </span>
                        )}
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {item.category}
                        </span>
                        {hasAuditError && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/40">
                            AUDIT
                          </span>
                        )}
                      </div>
                      {item.notes && (
                        <div className="text-[11px] text-slate-400 italic mt-0.5 line-clamp-1" title={item.notes}>
                          {item.notes}
                        </div>
                      )}
                    </td>

                    {/* Unit */}
                    <td className="py-2.5 px-2 text-center font-mono text-slate-300 font-semibold">
                      {item.unit}
                    </td>

                    {/* Unit Rate */}
                    <td className="py-2.5 px-2 text-right border-r border-slate-800/80">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-slate-400 font-mono text-[10px]">₹</span>
                        <input
                          type="number"
                          id={`input-rate-${item.id}`}
                          value={item.rate}
                          onChange={(e) => onUpdateRate(item.id, Number(e.target.value) || 0)}
                          className="w-20 bg-slate-950/70 border border-slate-700/80 rounded px-1.5 py-1 text-right font-mono text-xs text-amber-300 font-semibold focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </td>

                    {/* Floor Columns with Inline Editable Quantity Inputs */}
                    {floors.map((floor) => {
                      const floorQty = breakdown[floor.id] !== undefined ? breakdown[floor.id] : 0;
                      const floorCost = Math.round(floorQty * item.rate);
                      const isZero = floorQty === 0;

                      return (
                        <td
                          key={floor.id}
                          className={`py-2 px-2 text-right border-r border-slate-800/60 ${
                            isZero ? 'bg-slate-950/30' : 'bg-slate-900/40'
                          }`}
                        >
                          <div className="flex flex-col items-end">
                            <input
                              type="number"
                              id={`input-floor-qty-${item.id}-${floor.id}`}
                              step={item.unit === 'MT' || item.unit === 'm3' ? '0.1' : '1'}
                              value={floorQty}
                              onChange={(e) =>
                                onUpdateFloorQty(item.id, floor.id, parseFloat(e.target.value) || 0)
                              }
                              className={`w-18 bg-slate-950 border rounded px-1.5 py-0.5 text-right font-mono text-xs transition focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                                isZero
                                  ? 'text-slate-400 border-slate-800 hover:border-slate-700 focus:text-slate-200'
                                  : 'text-slate-100 font-semibold border-slate-700/80 bg-slate-900 focus:border-amber-500'
                              }`}
                              title={`${floor.name} quantity for ${item.name}`}
                            />
                            <span
                              className={`text-[10px] font-mono mt-0.5 ${
                                isZero ? 'text-slate-400' : 'text-slate-400'
                              }`}
                            >
                              {floorCost > 0 ? `₹${floorCost.toLocaleString()}` : '-'}
                            </span>
                          </div>
                        </td>
                      );
                    })}

                    {/* Total Quantity */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-300 bg-amber-500/5">
                      <div className="text-xs">
                        {item.quantity.toLocaleString()}
                        <span className="text-[10px] text-amber-400/70 ml-1 font-normal font-sans">
                          {item.unit}
                        </span>
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-100">
                      {formatCurrency(item.quantity * item.rate, currency)}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          id={`btn-distribute-item-${item.id}`}
                          onClick={() => onOpenItemDistribution(item)}
                          className="p-1 rounded hover:bg-slate-700/70 text-slate-400 hover:text-amber-400 transition"
                          title="Open floor distribution calculator for this item"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          id={`btn-delete-item-${item.id}`}
                          onClick={() => onDeleteItem(item.id)}
                          className="p-1 rounded hover:bg-red-950/60 text-slate-400 hover:text-red-400 transition"
                          title="Delete line item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Detailed Summary Footer Rows */}
          <tfoot className="border-t-2 border-slate-700 font-mono text-xs">
            {/* 1. Floor Subtotals */}
            <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-200">
              <td colSpan={4} className="py-3 px-3 font-bold text-left border-r border-slate-800">
                <span className="text-amber-400 uppercase tracking-wider text-[11px]">
                  Floor Level Subtotal
                </span>
              </td>
              {floors.map((floor) => {
                const ft = floorTotals.find((t) => t.floorId === floor.id);
                const sub = ft?.subtotal || 0;
                return (
                  <td
                    key={floor.id}
                    className="py-3 px-2 text-right border-r border-slate-800/80 font-bold text-slate-100 bg-slate-900/40"
                  >
                    <div className="text-xs">₹{sub.toLocaleString()}</div>
                    <div className="text-[10px] text-amber-400 font-normal">
                      {ft?.percentageOfBuilding}%
                    </div>
                  </td>
                );
              })}
              <td className="py-3 px-3 text-right font-bold text-slate-400 bg-amber-500/5">
                Consolidated
              </td>
              <td className="py-3 px-3 text-right font-bold text-amber-400 text-sm">
                {formatCurrency(buildingSubtotal, currency)}
              </td>
              <td></td>
            </tr>

            {/* 2. Floor Slab Area & % */}
            <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-300">
              <td colSpan={4} className="py-2.5 px-3 text-left border-r border-slate-800 text-[11px]">
                Built-Up Slab Area (sq.ft)
              </td>
              {floors.map((floor) => (
                <td
                  key={floor.id}
                  className="py-2.5 px-2 text-right border-r border-slate-800/80 font-mono text-slate-300"
                >
                  <div>{floor.areaSqFt.toLocaleString()} sq.ft</div>
                  <div className="text-[10px] text-slate-400">
                    {totalAreaSqFt > 0 ? `${Math.round((floor.areaSqFt / totalAreaSqFt) * 100)}%` : '0%'}
                  </div>
                </td>
              ))}
              <td className="py-2.5 px-3 text-right font-mono text-slate-400 bg-amber-500/5">
                Total Area
              </td>
              <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-200">
                {totalAreaSqFt.toLocaleString()} sq.ft
              </td>
              <td></td>
            </tr>

            {/* 3. Cost Per Sq.Ft by Floor */}
            <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-300">
              <td colSpan={4} className="py-2.5 px-3 text-left border-r border-slate-800 text-[11px]">
                Level Unit Rate per Sq.Ft
              </td>
              {floors.map((floor) => {
                const ft = floorTotals.find((t) => t.floorId === floor.id);
                return (
                  <td
                    key={floor.id}
                    className="py-2.5 px-2 text-right border-r border-slate-800/80 font-mono font-semibold text-emerald-400"
                  >
                    ₹{ft?.ratePerSqFt || 0}/sq.ft
                  </td>
                );
              })}
              <td className="py-2.5 px-3 text-right font-mono text-slate-400 bg-amber-500/5">
                Avg Rate
              </td>
              <td className="py-2.5 px-3 text-right font-bold font-mono text-emerald-400">
                ₹{overallRatePerSqFt}/sq.ft
              </td>
              <td></td>
            </tr>

            {/* 4. Contingency Allowance */}
            <tr className="bg-slate-900/40 border-b border-slate-800 text-slate-300">
              <td colSpan={4} className="py-2 px-3 text-left border-r border-slate-800 text-[11px]">
                Contingency & Price Escalation ({contingencyPercent}%)
              </td>
              {floors.map((floor) => {
                const ft = floorTotals.find((t) => t.floorId === floor.id);
                const floorContingency = Math.round((ft?.subtotal || 0) * (contingencyPercent / 100));
                return (
                  <td key={floor.id} className="py-2 px-2 text-right border-r border-slate-800/80 text-slate-400 text-[11px]">
                    +₹{floorContingency.toLocaleString()}
                  </td>
                );
              })}
              <td className="py-2 px-3 text-right text-slate-400 bg-amber-500/5">-</td>
              <td className="py-2 px-3 text-right font-mono text-amber-300">
                {formatCurrency(contingencyAmount, currency)}
              </td>
              <td></td>
            </tr>

            {/* 5. Grand Total */}
            <tr className="bg-amber-500/10 text-slate-100 font-bold text-sm">
              <td colSpan={4} className="py-3.5 px-3 text-left border-r border-slate-800 uppercase tracking-wider text-amber-400">
                Grand Total with Contingency
              </td>
              {floors.map((floor) => {
                const ft = floorTotals.find((t) => t.floorId === floor.id);
                const floorGrand = Math.round((ft?.subtotal || 0) * (1 + contingencyPercent / 100));
                return (
                  <td key={floor.id} className="py-3.5 px-2 text-right border-r border-slate-800/80 text-amber-300 font-mono">
                    ₹{floorGrand.toLocaleString()}
                  </td>
                );
              })}
              <td className="py-3.5 px-3 text-right text-slate-300 bg-amber-500/10 font-mono text-xs">
                All Levels
              </td>
              <td className="py-3.5 px-3 text-right text-amber-400 text-base font-extrabold">
                {formatCurrency(grandTotal, currency)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
