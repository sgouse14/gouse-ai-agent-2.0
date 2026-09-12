import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Plus,
  Trash2,
  Sparkles,
  Download,
  Printer,
  Sliders,
  DollarSign,
  Layers,
  FileSpreadsheet,
  Check,
  AlertCircle
} from 'lucide-react';
import { BOQItem, Project } from '../types';
import { formatCurrency, CurrencyCode } from '../utils/formatters';

interface BOQViewProps {
  items: BOQItem[];
  contingencyPercent: number;
  currency: CurrencyCode;
  activeProject: Project;
  onUpdateItems: (items: BOQItem[]) => void;
  onChangeContingency: (val: number) => void;
}

const CATEGORIES = [
  'Substructure',
  'Concrete Works',
  'Masonry',
  'Doors & Windows',
  'Finishes',
  'MEP & Electrical',
  'Plumbing',
  'Waterproofing',
  'External Works',
  'General',
];

const UNITS = ['m3', 'sq.m', 'r.m', 'MT', 'nos', 'kg', 'lump sum', 'sq.ft'];

export const BOQView: React.FC<BOQViewProps> = ({
  items,
  contingencyPercent,
  currency,
  activeProject,
  onUpdateItems,
  onChangeContingency,
}) => {
  // Modal states
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiDescription, setAiDescription] = useState(activeProject.description || '');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{
    project_summary: string;
    assumptions: string[];
    items: any[];
  } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // New item form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState(CATEGORIES[0]);
  const [newItemUnit, setNewItemUnit] = useState(UNITS[0]);
  const [newItemQty, setNewItemQty] = useState<number>(10);
  const [newItemRate, setNewItemRate] = useState<number>(500);
  const [newItemNotes, setNewItemNotes] = useState('');

  // Selected category filter
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  }, [items]);

  const contingencyAmount = useMemo(() => {
    return (subtotal * contingencyPercent) / 100;
  }, [subtotal, contingencyPercent]);

  const totalEstimate = useMemo(() => {
    return subtotal + contingencyAmount;
  }, [subtotal, contingencyAmount]);

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    items.forEach((item) => {
      totals[item.category] = (totals[item.category] || 0) + (item.quantity * item.rate);
    });
    return totals;
  }, [items]);

  const filteredItems = useMemo(() => {
    if (filterCategory === 'all') return items;
    return items.filter((item) => item.category === filterCategory);
  }, [items, filterCategory]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const qty = Math.max(0, Number(newItemQty) || 0);
    const rate = Math.max(0, Number(newItemRate) || 0);

    const newItem: BOQItem = {
      id: `boq-${Date.now()}`,
      name: newItemName.trim(),
      category: newItemCategory,
      unit: newItemUnit,
      quantity: qty,
      rate: rate,
      amount: qty * rate,
      notes: newItemNotes.trim(),
    };

    onUpdateItems([...items, newItem]);
    setNewItemName('');
    setNewItemNotes('');
    setIsAddingItem(false);
  };

  const handleUpdateItemField = (id: string, field: keyof BOQItem, value: any) => {
    const updated = items.map((item) => {
      if (item.id !== id) return item;
      const updatedItem = { ...item, [field]: value };
      if (field === 'quantity' || field === 'rate') {
        const q = field === 'quantity' ? Math.max(0, Number(value) || 0) : item.quantity;
        const r = field === 'rate' ? Math.max(0, Number(value) || 0) : item.rate;
        updatedItem.amount = q * r;
      }
      return updatedItem;
    });
    onUpdateItems(updated);
  };

  const handleDeleteItem = (id: string) => {
    onUpdateItems(items.filter((item) => item.id !== id));
  };

  const handleGenerateAI = async () => {
    if (!aiDescription.trim()) return;
    setAiLoading(true);
    setAiError(null);

    try {
      const res = await fetch('/api/boq/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: aiDescription,
          projectType: activeProject.projectType,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate BOQ from AI');
      const data = await res.json();
      setAiResult(data);
    } catch (err: any) {
      setAiError(err.message || 'Error generating BOQ');
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAIBOQ = (replace: boolean) => {
    if (!aiResult || !aiResult.items) return;

    const formatted: BOQItem[] = aiResult.items.map((it, idx) => ({
      id: `boq-ai-${Date.now()}-${idx}`,
      name: it.name,
      category: it.category || 'General',
      unit: it.unit || 'nos',
      quantity: Number(it.quantity) || 0,
      rate: Number(it.rate) || 0,
      amount: (Number(it.quantity) || 0) * (Number(it.rate) || 0),
      notes: it.notes || '',
    }));

    if (replace) {
      onUpdateItems(formatted);
    } else {
      onUpdateItems([...items, ...formatted]);
    }

    setIsGeneratingAI(false);
    setAiResult(null);
  };

  const handleExportCSV = () => {
    const headers = ['Item Name', 'Category', 'Unit', 'Quantity', 'Rate', 'Amount', 'Notes'];
    const rows = items.map((i) => [
      `"${i.name.replace(/"/g, '""')}"`,
      `"${i.category}"`,
      `"${i.unit}"`,
      i.quantity,
      i.rate,
      i.amount,
      `"${i.notes.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeProject.name.replace(/\s+/g, '_')}_BOQ_Estimate.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="boq-estimation-view" className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Quantity Surveying
            </span>
            <span className="text-xs text-slate-400">
              {activeProject.name}
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
            Bill of Quantities & Cost Estimation
          </h2>
          <p className="text-xs text-slate-400">
            Interactive schedule of rates, dynamic contingency calculation, and automated AI generation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-open-ai-boq"
            onClick={() => setIsGeneratingAI(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 text-xs font-medium transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate with AI</span>
          </button>

          <button
            id="btn-open-add-boq"
            onClick={() => setIsAddingItem(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Line Item</span>
          </button>

          <button
            id="btn-export-csv"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            id="btn-print-boq"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Sheet</span>
          </button>
        </div>
      </div>

      {/* Summary metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Subtotal Civil & Finishes</span>
          <p className="text-xl font-bold font-mono text-white">
            {formatCurrency(subtotal, currency)}
          </p>
          <p className="text-[11px] text-slate-400 font-mono">{items.length} line items specified</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Design Contingency</span>
            <span className="text-xs font-mono font-bold text-amber-400">{contingencyPercent}%</span>
          </div>
          <p className="text-xl font-bold font-mono text-amber-400">
            {formatCurrency(contingencyAmount, currency)}
          </p>
          <div className="pt-1">
            <input
              id="slider-contingency"
              type="range"
              min={0}
              max={25}
              step={0.5}
              value={contingencyPercent}
              onChange={(e) => onChangeContingency(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 bg-amber-500/5 space-y-1">
          <span className="text-xs text-amber-300 font-medium">Estimated Grand Total</span>
          <p className="text-2xl font-bold font-mono text-amber-400">
            {formatCurrency(totalEstimate, currency)}
          </p>
          <p className="text-[11px] text-slate-400">Includes all works + {contingencyPercent}% reserve</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Unit Rate per sq.ft</span>
          <p className="text-xl font-bold font-mono text-emerald-400">
            {activeProject.builtUpAreaSqFt
              ? `${formatCurrency(totalEstimate / activeProject.builtUpAreaSqFt, currency)} / sq.ft`
              : 'N/A'}
          </p>
          <p className="text-[11px] text-slate-400 font-mono">
            {activeProject.builtUpAreaSqFt ? `${activeProject.builtUpAreaSqFt.toLocaleString()} sq.ft plinth` : 'Set area in project brief'}
          </p>
        </div>
      </div>

      {/* Category Totals Chips */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
            Category Breakdown
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-2 py-0.5 text-xs rounded transition ${
                filterCategory === 'all'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Categories
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {Object.entries(categoryTotals).map(([cat, amt]) => {
            const isSelected = filterCategory === cat;
            const pct = subtotal > 0 ? ((amt / subtotal) * 100).toFixed(1) : '0';
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(isSelected ? 'all' : cat)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition border ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500 text-white font-medium'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span>{cat}</span>
                <span className="font-mono text-amber-400">{formatCurrency(amt, currency)}</span>
                <span className="text-[10px] text-slate-500 font-mono">({pct}%)</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Add Item Modal */}
      {isAddingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white font-serif-classic">
                Add BOQ Line Item
              </h3>
              <button onClick={() => setIsAddingItem(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Item Description *</label>
                <input
                  id="input-boq-name"
                  type="text"
                  required
                  placeholder="e.g. Reinforced Cement Concrete M25 in Grade Beams"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    id="select-boq-category"
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Measurement Unit</label>
                  <select
                    id="select-boq-unit"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Quantity</label>
                  <input
                    id="input-boq-qty"
                    type="number"
                    min={0}
                    step={0.01}
                    required
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Unit Rate (in INR)</label>
                  <input
                    id="input-boq-rate"
                    type="number"
                    min={0}
                    step={0.01}
                    required
                    value={newItemRate}
                    onChange={(e) => setNewItemRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Specification / Notes</label>
                <input
                  id="input-boq-notes"
                  type="text"
                  placeholder="e.g. Centering, shuttering, 28-day curing included"
                  value={newItemNotes}
                  onChange={(e) => setNewItemNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingItem(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-boq-item"
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition"
                >
                  Add to Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI BOQ Generator Modal */}
      {isGeneratingAI && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white font-serif-classic">
                  AI Bill of Quantities Generator
                </h3>
              </div>
              <button onClick={() => setIsGeneratingAI(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Provide an architectural scope description. The AI quantity surveyor will generate itemized lines with benchmark quantities, units, and rates.
              </p>

              <textarea
                id="textarea-ai-boq-desc"
                rows={4}
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
                placeholder="Describe building typology, foundation type, walling materials, finishes, glazing, etc."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-amber-500"
              />

              <div className="flex justify-end">
                <button
                  id="btn-run-ai-boq"
                  onClick={handleGenerateAI}
                  disabled={aiLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${aiLoading ? 'animate-spin' : ''}`} />
                  <span>{aiLoading ? 'Generating Quantities...' : 'Generate Preliminary BOQ'}</span>
                </button>
              </div>

              {aiError && (
                <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}

              {aiResult && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 mt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider font-mono">
                      Generated {aiResult.items.length} Preliminary Items
                    </h4>
                  </div>

                  <p className="text-xs text-slate-300">{aiResult.project_summary}</p>

                  {aiResult.assumptions && aiResult.assumptions.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400">Key Assumptions:</span>
                      <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-0.5">
                        {aiResult.assumptions.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-800 rounded-lg p-2 bg-slate-900">
                    {aiResult.items.map((it, i) => (
                      <div key={i} className="text-xs flex items-center justify-between py-1 border-b border-slate-800 last:border-0">
                        <span className="text-slate-200 truncate max-w-[280px]">{it.name}</span>
                        <div className="flex items-center gap-3 font-mono text-slate-400 text-[11px]">
                          <span>{it.quantity} {it.unit}</span>
                          <span>@ ₹{it.rate}</span>
                          <span className="text-amber-400 font-semibold">₹{(it.quantity * it.rate).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      id="btn-append-ai-boq"
                      onClick={() => handleApplyAIBOQ(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-amber-300 border border-amber-500/30 transition"
                    >
                      Append to Existing BOQ
                    </button>
                    <button
                      id="btn-replace-ai-boq"
                      onClick={() => handleApplyAIBOQ(true)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition"
                    >
                      Replace Current Schedule
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main BOQ Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 font-mono text-[11px] text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4 min-w-[240px]">Item Description</th>
                <th className="py-3 px-3 w-32">Category</th>
                <th className="py-3 px-3 w-20 text-center">Unit</th>
                <th className="py-3 px-3 w-24 text-right">Qty</th>
                <th className="py-3 px-3 w-28 text-right">Rate</th>
                <th className="py-3 px-4 w-32 text-right">Amount</th>
                <th className="py-3 px-3 w-16 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    No items in this view. Click "Add Line Item" or "Generate with AI".
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition group">
                    <td className="py-2.5 px-4 text-center font-mono text-slate-500">
                      {index + 1}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-medium text-slate-200">{item.name}</div>
                      {item.notes && (
                        <div className="text-[11px] text-slate-400 italic mt-0.5">{item.notes}</div>
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
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        value={item.quantity}
                        onChange={(e) => handleUpdateItemField(item.id, 'quantity', e.target.value)}
                        className="w-20 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-right text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={item.rate}
                        onChange={(e) => handleUpdateItemField(item.id, 'rate', e.target.value)}
                        className="w-24 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-right text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-amber-400">
                      {formatCurrency(item.quantity * item.rate, currency)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-slate-500 hover:text-red-400 transition p-1"
                        title="Delete line item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-700 bg-slate-950 font-mono font-bold text-xs">
                <td colSpan={6} className="py-3 px-4 text-right text-slate-300">
                  Subtotal:
                </td>
                <td className="py-3 px-4 text-right text-white">
                  {formatCurrency(subtotal, currency)}
                </td>
                <td></td>
              </tr>
              <tr className="bg-slate-950 font-mono text-xs">
                <td colSpan={6} className="py-2 px-4 text-right text-amber-400 font-medium">
                  Contingency Reserve ({contingencyPercent}%):
                </td>
                <td className="py-2 px-4 text-right text-amber-400 font-bold">
                  {formatCurrency(contingencyAmount, currency)}
                </td>
                <td></td>
              </tr>
              <tr className="bg-slate-950/90 font-mono text-sm border-t border-slate-700">
                <td colSpan={6} className="py-3 px-4 text-right text-amber-400 font-bold uppercase tracking-wider">
                  Grand Estimated Total:
                </td>
                <td className="py-3 px-4 text-right text-amber-400 font-extrabold text-base">
                  {formatCurrency(totalEstimate, currency)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
