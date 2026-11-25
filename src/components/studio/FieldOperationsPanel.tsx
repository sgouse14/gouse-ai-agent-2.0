import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileWarning,
  ArrowUpRight,
  Download,
  Trash2,
  Check,
} from 'lucide-react';
import { Project, BOQItem, FieldOperationItem } from '../../types';
import { CurrencyCode, formatCurrency } from '../../utils/formatters';
import { ensureItemFloorBreakdown } from '../../utils/floorTakeoffEngine';

export interface FieldOperationsPanelProps {
  activeProject: Project;
  boqItems: BOQItem[];
  currency: CurrencyCode;
  onUpdateProject: (updated: Project) => void;
  onUpdateBOQItems: (items: BOQItem[]) => void;
}

const DEFAULT_SEED_ITEMS = (project: Project): FieldOperationItem[] => {
  const lead = project.members?.[0]?.name || 'Gouse AI';
  const qs = project.members?.[1]?.name || 'Engineering & QS Team';
  return [
    {
      id: `field-rfi-${project.id}-1`,
      code: 'RFI-001',
      type: 'rfi',
      title: 'Confirm Fe550D column starter bar lap length & stirrup spacing at Grid B4',
      trade: 'Structural',
      priority: 'high',
      status: 'in_review',
      assignee: lead,
      costImpact: 0,
      scheduleDays: 1,
      dueDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
      notes: 'Verify 50D splice per IS 456 before shuttering closure.',
      createdAt: new Date().toISOString(),
    },
    {
      id: `field-co-${project.id}-2`,
      code: 'CO-002',
      type: 'change_order',
      title: 'Upgrade West facade windows to 24mm Low-E DGU acoustic double glazing',
      trade: 'Finishes',
      priority: 'medium',
      status: 'approved',
      assignee: qs,
      costImpact: 58000,
      scheduleDays: 4,
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      notes: 'Reduces afternoon HVAC heat gain by ~22% on West elevation.',
      createdAt: new Date().toISOString(),
    },
    {
      id: `field-snag-${project.id}-3`,
      code: 'SNG-003',
      type: 'snag',
      title: 'Complete 72-hour terrace & sunken bathroom ponding test before screed',
      trade: 'Waterproofing',
      priority: 'high',
      status: 'open',
      assignee: qs,
      costImpact: 14500,
      scheduleDays: 3,
      dueDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
      notes: 'Crystalline two-coat waterproofing sign-off required prior to tile bed.',
      createdAt: new Date().toISOString(),
    },
  ];
};

export const FieldOperationsPanel: React.FC<FieldOperationsPanelProps> = ({
  activeProject,
  boqItems,
  currency,
  onUpdateProject,
  onUpdateBOQItems,
}) => {
  const items: FieldOperationItem[] = useMemo(() => {
    if (Array.isArray(activeProject.fieldItems)) {
      return activeProject.fieldItems;
    }
    return DEFAULT_SEED_ITEMS(activeProject);
  }, [activeProject]);

  const [typeFilter, setTypeFilter] = useState<'all' | 'rfi' | 'change_order' | 'snag'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_review' | 'approved' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAdding, setIsAdding] = useState<boolean>(false);

  // New item form state
  const [newType, setNewType] = useState<'rfi' | 'change_order' | 'snag'>('rfi');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newTrade, setNewTrade] = useState<FieldOperationItem['trade']>('Structural');
  const [newPriority, setNewPriority] = useState<FieldOperationItem['priority']>('medium');
  const [newAssignee, setNewAssignee] = useState<string>(activeProject.members?.[0]?.name || 'Gouse AI');
  const [newCostImpact, setNewCostImpact] = useState<number>(0);
  const [newScheduleDays, setNewScheduleDays] = useState<number>(0);
  const [newNotes, setNewNotes] = useState<string>('');

  const persistItems = (nextItems: FieldOperationItem[], logAction?: string, logDetails?: string) => {
    onUpdateProject({
      ...activeProject,
      fieldItems: nextItems,
      auditLogs: logAction
        ? [
            {
              id: `log-field-${Date.now()}`,
              projectId: activeProject.id,
              actor: 'Field Operations Desk',
              action: logAction,
              details: logDetails || '',
              timestamp: new Date().toISOString(),
            },
            ...(activeProject.auditLogs || []),
          ]
        : activeProject.auditLogs,
      updatedAt: new Date().toISOString(),
    });
  };

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((it) => {
      if (typeFilter !== 'all' && it.type !== typeFilter) return false;
      if (statusFilter !== 'all' && it.status !== statusFilter) return false;
      if (q && !`${it.code} ${it.title} ${it.trade} ${it.assignee} ${it.notes}`.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [items, typeFilter, statusFilter, searchQuery]);

  const summary = useMemo(() => {
    const openCount = items.filter((i) => i.status === 'open' || i.status === 'in_review').length;
    const totalCostImpact = items.reduce((sum, i) => sum + (Number(i.costImpact) || 0), 0);
    const totalScheduleDays = items.reduce((sum, i) => sum + (Number(i.scheduleDays) || 0), 0);
    return { total: items.length, openCount, totalCostImpact, totalScheduleDays };
  }, [items]);

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const prefix = newType === 'rfi' ? 'RFI' : newType === 'change_order' ? 'CO' : 'SNG';
    const nextCode = `${prefix}-${String(items.length + 1).padStart(3, '0')}`;
    const created: FieldOperationItem = {
      id: `field-${Date.now()}`,
      code: nextCode,
      type: newType,
      title: newTitle.trim(),
      trade: newTrade,
      priority: newPriority,
      status: 'open',
      assignee: newAssignee,
      costImpact: Number(newCostImpact) || 0,
      scheduleDays: Number(newScheduleDays) || 0,
      dueDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
      notes: newNotes.trim(),
      createdAt: new Date().toISOString(),
    };
    persistItems([created, ...items], `Logged ${nextCode}`, created.title);
    setNewTitle('');
    setNewCostImpact(0);
    setNewScheduleDays(0);
    setNewNotes('');
    setIsAdding(false);
  };

  const handleStatusChange = (id: string, nextStatus: FieldOperationItem['status']) => {
    const next = items.map((it) => (it.id === id ? { ...it, status: nextStatus } : it));
    persistItems(next);
  };

  const handleDelete = (id: string) => {
    persistItems(items.filter((it) => it.id !== id));
  };

  const handlePushToBoq = (item: FieldOperationItem) => {
    const cost = Math.max(1000, Math.abs(item.costImpact));
    const boqId = `boq-co-${item.id}`;
    const raw: BOQItem = {
      id: boqId,
      name: `${item.code}: ${item.title}`,
      category: item.trade === 'MEP' ? 'MEP & Services' : item.trade === 'Finishes' ? 'Finishes' : 'Civil & Masonry',
      unit: 'Lump Sum',
      quantity: 1,
      rate: cost,
      amount: cost,
      notes: `Field ${item.type.replace('_', ' ').toUpperCase()} (${item.trade}) · ${item.notes || 'Approved via Studio Field Ops'}`,
      stage: item.trade === 'Structural' ? 'Superstructure' : 'Finishes',
      status: item.status === 'approved' ? 'approved' : 'estimated',
    };
    const withFloors = ensureItemFloorBreakdown(raw, activeProject.floors);
    const exists = boqItems.some((b) => b.id === boqId);
    const nextBoq = exists ? boqItems.map((b) => (b.id === boqId ? withFloors : b)) : [withFloors, ...boqItems];
    onUpdateBOQItems(nextBoq);

    const nextField = items.map((f) => (f.id === item.id ? { ...f, syncedToBoq: true } : f));
    persistItems(
      nextField,
      `Synced ${item.code} to BOQ`,
      `${item.title} · ${formatCurrency(cost, currency)}`
    );
  };

  const handleExportCsv = () => {
    const header = ['Code', 'Type', 'Title', 'Trade', 'Priority', 'Status', 'Assignee', 'Cost Impact', 'Schedule Days', 'Due Date'];
    const rows = items.map((i) => [
      i.code,
      i.type,
      `"${i.title.replace(/"/g, '""')}"`,
      i.trade,
      i.priority,
      i.status,
      `"${i.assignee.replace(/"/g, '""')}"`,
      String(i.costImpact),
      String(i.scheduleDays),
      i.dueDate,
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeProject.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-field-ops.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header & Metrics Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white">
            Field RFIs, Change Orders &amp; Site Snag Register
          </h3>
          <p className="text-xs text-slate-400">
            Track contractor RFIs, cost change orders, and snag punch-lists with one-click BOQ sync.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-600 text-xs font-medium text-slate-200 transition whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>
          <button
            id="btn-field-ops-add"
            type="button"
            onClick={() => setIsAdding((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAdding ? 'Close Form' : 'Log RFI / Change Order'}</span>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 rounded-xl bg-slate-950 border border-slate-800 divide-y sm:divide-y-0 sm:divide-x divide-slate-800">
        <div className="p-3.5">
          <span className="text-[11px] text-slate-400 block">Tracked Register Items</span>
          <span className="text-base font-bold text-white tabular-nums">{summary.total}</span>
        </div>
        <div className="p-3.5">
          <span className="text-[11px] text-slate-400 block">Open / Pending Review</span>
          <span className="text-base font-bold text-amber-300 tabular-nums">{summary.openCount}</span>
        </div>
        <div className="p-3.5">
          <span className="text-[11px] text-slate-400 block">Net Cost Variance</span>
          <span className="text-base font-bold text-white tabular-nums">
            {formatCurrency(summary.totalCostImpact, currency)}
          </span>
        </div>
        <div className="p-3.5">
          <span className="text-[11px] text-slate-400 block">Schedule Impact</span>
          <span className="text-base font-bold text-slate-200 tabular-nums">
            {summary.totalScheduleDays} days
          </span>
        </div>
      </div>

      {/* Add Form */}
      {isAdding && (
        <form
          onSubmit={handleCreateItem}
          className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Entry Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as FieldOperationItem['type'])}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="rfi">RFI (Clarification)</option>
                <option value="change_order">Change Order (Cost/Scope)</option>
                <option value="snag">Site Snag / Punch Item</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] text-slate-400 mb-1">Summary Title</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Add acoustic baffle ceiling in double-height lounge"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Trade</label>
              <select
                value={newTrade}
                onChange={(e) => setNewTrade(e.target.value as FieldOperationItem['trade'])}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Structural">Structural</option>
                <option value="Civil & Masonry">Civil &amp; Masonry</option>
                <option value="MEP">MEP</option>
                <option value="Finishes">Finishes</option>
                <option value="Waterproofing">Waterproofing</option>
                <option value="Bylaws">Bylaws</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Priority</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as FieldOperationItem['priority'])}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Assignee</label>
              <input
                type="text"
                value={newAssignee}
                onChange={(e) => setNewAssignee(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Cost Delta ({currency})</label>
              <input
                type="number"
                value={newCostImpact}
                onChange={(e) => setNewCostImpact(Number(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Schedule Days</label>
              <input
                type="number"
                value={newScheduleDays}
                onChange={(e) => setNewScheduleDays(Number(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="text"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Technical notes, drawing sheet ref, or vendor instructions..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs whitespace-nowrap"
            >
              Save to Project Register
            </button>
          </div>
        </form>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg overflow-x-auto">
          {[
            { id: 'all' as const, label: 'All Entries' },
            { id: 'rfi' as const, label: 'RFIs' },
            { id: 'change_order' as const, label: 'Change Orders' },
            { id: 'snag' as const, label: 'Site Snags' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setTypeFilter(f.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition ${
                typeFilter === f.id
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter code, trade, title..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_review">In Review</option>
            <option value="approved">Approved</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Register Table */}
      <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-x-auto">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <FileWarning className="w-6 h-6 text-slate-500 mx-auto" />
            <p className="text-xs text-slate-400">
              No matching RFIs, change orders, or site snags found.
            </p>
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-medium text-amber-300 hover:border-amber-500/60"
            >
              Log First Entry
            </button>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] text-slate-400 bg-slate-900/60">
                <th className="py-2.5 px-3 font-medium whitespace-nowrap">Ref</th>
                <th className="py-2.5 px-3 font-medium">Description &amp; Trade</th>
                <th className="py-2.5 px-3 font-medium whitespace-nowrap">Status</th>
                <th className="py-2.5 px-3 font-medium text-right whitespace-nowrap">Cost Impact</th>
                <th className="py-2.5 px-3 font-medium text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredItems.map((it) => {
                const statusIcon =
                  it.status === 'resolved' || it.status === 'approved' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : it.status === 'in_review' ? (
                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  );

                return (
                  <tr key={it.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-amber-300 whitespace-nowrap align-top">
                      {it.code}
                    </td>
                    <td className="py-2.5 px-3 align-top">
                      <div className="font-medium text-slate-100">{it.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-1.5">
                        <span>{it.trade}</span>
                        <span aria-hidden="true">·</span>
                        <span>{it.assignee}</span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">{it.priority} priority</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">Due {it.dueDate}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 align-top whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {statusIcon}
                        <select
                          value={it.status}
                          onChange={(e) =>
                            handleStatusChange(it.id, e.target.value as FieldOperationItem['status'])
                          }
                          className="bg-slate-900 border border-slate-800 rounded-md px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-amber-500"
                        >
                          <option value="open">Open</option>
                          <option value="in_review">In Review</option>
                          <option value="approved">Approved</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums align-top whitespace-nowrap text-slate-200">
                      {it.costImpact !== 0 ? formatCurrency(it.costImpact, currency) : '—'}
                      {it.scheduleDays > 0 && (
                        <div className="text-[10px] text-slate-500">+{it.scheduleDays}d</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right align-top whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {it.costImpact !== 0 && (
                          <button
                            type="button"
                            onClick={() => handlePushToBoq(it)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-[11px] font-medium transition ${
                              it.syncedToBoq
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                : 'bg-slate-900 border-slate-700 hover:border-amber-500/60 text-amber-300'
                            }`}
                          >
                            {it.syncedToBoq ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>In BOQ</span>
                              </>
                            ) : (
                              <>
                                <ArrowUpRight className="w-3 h-3" />
                                <span>Push to BOQ</span>
                              </>
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(it.id)}
                          aria-label={`Remove ${it.code}`}
                          className="p-1.5 rounded-md text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
