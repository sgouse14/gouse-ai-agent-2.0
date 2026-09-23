import React, { useRef, useState } from 'react';
import { BOQItem, BuildingFloor, FloorWiseTotal, Project } from '../types';
import { formatCurrency, CurrencyCode } from '../utils/formatters';
import { Printer, X, Download, FileSpreadsheet, Building2, CheckCircle2, FileDown, FileText, Loader2 } from 'lucide-react';
import { generateFloorWiseCSV } from '../utils/floorTakeoffEngine';
import { exportBOQToExcel, exportBOQToExcelCSV } from '../utils/excelExport';
import { exportFloorWiseReportToPDF } from '../utils/pdfExport';

interface FloorWisePrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  items: BOQItem[];
  floors: BuildingFloor[];
  floorTotals: FloorWiseTotal[];
  currency: CurrencyCode;
  contingencyPercent: number;
}

export const FloorWisePrintReportModal: React.FC<FloorWisePrintReportModalProps> = ({
  isOpen,
  onClose,
  project,
  items,
  floors,
  floorTotals,
  currency,
  contingencyPercent,
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [printNotice, setPrintNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const buildingSubtotal = floorTotals.reduce((sum, f) => sum + f.subtotal, 0);
  const contingencyAmount = Math.round(buildingSubtotal * (contingencyPercent / 100));
  const grandTotal = buildingSubtotal + contingencyAmount;
  const totalAreaSqFt = floors.reduce((sum, f) => sum + f.areaSqFt, 0);
  const overallRatePerSqFt = totalAreaSqFt > 0 ? Math.round(grandTotal / totalAreaSqFt) : 0;

  const handleExportPDF = () => {
    try {
      setIsGeneratingPDF(true);
      exportFloorWiseReportToPDF({
        project,
        items,
        floors,
        floorTotals,
        currency,
        contingencyPercent,
      });
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    try {
      const inIframe = window.self !== window.top;
      if (inIframe) {
        setPrintNotice('Print dialog invoked. In browser preview mode, you can also use "Convert to PDF" for an instant, formatted PDF document.');
        setTimeout(() => setPrintNotice(null), 8000);
      }
      window.print();
    } catch (err) {
      console.warn('Print triggered:', err);
    }
  };

  const handleExportExcel = () => {
    exportBOQToExcel({
      items,
      floors,
      projectName: project.name,
      currency,
      contingencyPercent,
      builtUpAreaSqFt: totalAreaSqFt,
    });
  };

  const handleDownloadCSV = () => {
    exportBOQToExcelCSV({
      items,
      floors,
      projectName: project.name,
      currency,
      contingencyPercent,
      builtUpAreaSqFt: totalAreaSqFt,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Toolbar (hidden when printed) */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 print:hidden flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Floor-Wise Schedule of Rates & Quantities Report</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  PDF & Print Ready
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Official architectural & quantity surveying report itemized by level
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Convert to PDF Button */}
            <button
              id="btn-convert-floor-pdf"
              type="button"
              onClick={handleExportPDF}
              disabled={isGeneratingPDF}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white text-xs font-bold transition shadow-sm"
              title="Convert and download floor-wise schedule report directly as an official vector PDF document"
            >
              {isGeneratingPDF ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : pdfSuccess ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )}
              <span>{pdfSuccess ? 'PDF Downloaded!' : isGeneratingPDF ? 'Converting...' : 'Convert to PDF'}</span>
            </button>

            {/* Print Button */}
            <button
              id="btn-print-floor-document"
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm"
              title="Open browser print dialogue (or save as PDF from print menu)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            {/* Export Excel (.xlsx) */}
            <button
              id="btn-export-floor-excel"
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
              title="Download Schedule of Rates and Quantities in Microsoft Excel (.xlsx) format"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-100" />
              <span>Excel (.xlsx)</span>
            </button>

            {/* CSV Export */}
            <button
              id="btn-export-floor-csv"
              type="button"
              onClick={handleDownloadCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
              title="Download Excel-compatible CSV with UTF-8 BOM"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Informational notification for iframe environments */}
        {printNotice && (
          <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
            <span>{printNotice}</span>
            <button onClick={() => setPrintNotice(null)} className="text-slate-400 hover:text-white ml-2 text-sm">×</button>
          </div>
        )}

        {/* Printable Document Sheet */}
        <div
          ref={printAreaRef}
          className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 bg-white text-slate-900 font-sans print:p-0 print:m-0"
        >
          {/* Document Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
            <div>
              <div className="text-[11px] font-mono tracking-widest uppercase text-amber-700 font-bold">
                Gouse AI Agent • Engineering & Construction Intelligence
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-950 tracking-tight mt-0.5">
                SCHEDULE OF RATES & QUANTITIES (FLOOR-WISE BREAKDOWN)
              </h1>
              <div className="text-xs text-slate-600 font-medium mt-1">
                Project: <strong className="text-slate-900">{project.name}</strong> • Location: {project.location}
              </div>
            </div>
            <div className="text-right font-mono text-xs text-slate-600">
              <div>Doc Ref: <strong className="text-slate-900">SOR-FLR-{project.id.toUpperCase()}</strong></div>
              <div>Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
              <div>Status: Approved Tender Draft</div>
            </div>
          </div>

          {/* Building Levels Summary Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold font-mono tracking-wider text-slate-800 uppercase">
              1. Executive Summary of Building Levels & Slab Costs
            </h3>
            <table className="w-full text-left border-collapse text-xs border border-slate-300">
              <thead className="bg-slate-100 font-mono text-[10px] text-slate-700 uppercase">
                <tr className="border-b border-slate-300">
                  <th className="py-2 px-3 border-r border-slate-300">Level Code</th>
                  <th className="py-2 px-3 border-r border-slate-300">Building Level Name</th>
                  <th className="py-2 px-3 border-r border-slate-300">Elevation</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">Slab Area (sq.ft)</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">Floor Cost (INR)</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">Rate / Sq.Ft</th>
                  <th className="py-2 px-3 text-right">% of Building</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {floors.map((floor) => {
                  const ft = floorTotals.find((t) => t.floorId === floor.id);
                  return (
                    <tr key={floor.id} className="hover:bg-slate-50">
                      <td className="py-1.5 px-3 font-mono font-bold border-r border-slate-300">
                        {floor.shortCode}
                      </td>
                      <td className="py-1.5 px-3 font-medium border-r border-slate-300">
                        {floor.name}
                      </td>
                      <td className="py-1.5 px-3 font-mono text-slate-600 border-r border-slate-300">
                        {floor.elevation}
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono border-r border-slate-300">
                        {floor.areaSqFt.toLocaleString()} sq.ft
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono font-semibold border-r border-slate-300">
                        ₹{(ft?.subtotal || 0).toLocaleString()}
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono text-emerald-800 border-r border-slate-300">
                        ₹{ft?.ratePerSqFt || 0}/sq.ft
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-700">
                        {ft?.percentageOfBuilding}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-slate-900 bg-slate-100 font-mono text-xs font-bold">
                <tr>
                  <td colSpan={3} className="py-2 px-3 text-left border-r border-slate-300">
                    CONSOLIDATED BUILDING TOTAL
                  </td>
                  <td className="py-2 px-3 text-right border-r border-slate-300">
                    {totalAreaSqFt.toLocaleString()} sq.ft
                  </td>
                  <td className="py-2 px-3 text-right border-r border-slate-300 text-amber-900">
                    ₹{buildingSubtotal.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right border-r border-slate-300 text-emerald-900">
                    ₹{overallRatePerSqFt}/sq.ft
                  </td>
                  <td className="py-2 px-3 text-right">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Itemized Floor-Wise Schedule Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold font-mono tracking-wider text-slate-800 uppercase">
              2. Detailed Schedule of Rates & Level-by-Level Quantities
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px] border border-slate-300">
                <thead className="bg-slate-100 font-mono text-[10px] text-slate-800">
                  <tr className="border-b border-slate-300">
                    <th className="py-2 px-2 w-8 text-center border-r border-slate-300">#</th>
                    <th className="py-2 px-3 min-w-[200px] border-r border-slate-300">Description</th>
                    <th className="py-2 px-2 w-14 text-center border-r border-slate-300">Unit</th>
                    <th className="py-2 px-2 w-20 text-right border-r border-slate-300">Rate (₹)</th>
                    {floors.map((f) => (
                      <th
                        key={f.id}
                        className="py-2 px-2 text-right border-r border-slate-300 font-bold bg-amber-50"
                        title={f.name}
                      >
                        {f.shortCode} Qty
                      </th>
                    ))}
                    <th className="py-2 px-2 w-20 text-right border-r border-slate-300 font-bold">
                      Total Qty
                    </th>
                    <th className="py-2 px-3 w-24 text-right font-bold">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.map((item, idx) => {
                    const breakdown = item.floorBreakdown || {};
                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-1.5 px-2 text-center font-mono text-slate-500 border-r border-slate-300">
                          {idx + 1}
                        </td>
                        <td className="py-1.5 px-3 border-r border-slate-300">
                          <div className="font-medium text-slate-950">{item.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{item.category}</div>
                        </td>
                        <td className="py-1.5 px-2 text-center font-mono border-r border-slate-300">
                          {item.unit}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono border-r border-slate-300">
                          ₹{item.rate.toLocaleString()}
                        </td>
                        {floors.map((f) => {
                          const q = breakdown[f.id] || 0;
                          return (
                            <td
                              key={f.id}
                              className={`py-1.5 px-2 text-right font-mono border-r border-slate-300 ${
                                q > 0 ? 'font-semibold text-slate-900 bg-amber-50/40' : 'text-slate-400'
                              }`}
                            >
                              {q > 0 ? q.toLocaleString() : '-'}
                            </td>
                          );
                        })}
                        <td className="py-1.5 px-2 text-right font-mono font-bold text-amber-900 border-r border-slate-300">
                          {item.quantity.toLocaleString()}
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-950">
                          ₹{Math.round(item.quantity * item.rate).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t-2 border-slate-900 bg-slate-100 font-mono text-xs font-bold">
                  <tr>
                    <td colSpan={4} className="py-2.5 px-3 text-left border-r border-slate-300">
                      LEVEL SUBTOTALS
                    </td>
                    {floors.map((f) => {
                      const ft = floorTotals.find((t) => t.floorId === f.id);
                      return (
                        <td key={f.id} className="py-2.5 px-2 text-right border-r border-slate-300 text-slate-900">
                          ₹{(ft?.subtotal || 0).toLocaleString()}
                        </td>
                      );
                    })}
                    <td className="py-2.5 px-2 text-right border-r border-slate-300">-</td>
                    <td className="py-2.5 px-3 text-right text-amber-900">
                      ₹{buildingSubtotal.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Grand Total Breakdown Block */}
          <div className="flex justify-end pt-2">
            <div className="w-72 border border-slate-300 rounded-lg p-3 bg-slate-50 font-mono text-xs space-y-1.5">
              <div className="flex justify-between text-slate-700">
                <span>Building Works Subtotal:</span>
                <span className="font-bold">₹{buildingSubtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Contingency ({contingencyPercent}%):</span>
                <span>₹{contingencyAmount.toLocaleString()}</span>
              </div>
              <div className="border-t border-slate-300 pt-1.5 flex justify-between text-sm font-bold text-slate-950">
                <span>Grand Total:</span>
                <span className="text-amber-800">₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Engineering Sign-Off Block */}
          <div className="pt-8 border-t border-slate-300 grid grid-cols-4 gap-4 text-center text-xs">
            <div className="border-t border-slate-400 pt-2 font-mono">
              <div className="font-bold text-slate-900">Lead Quantity Surveyor</div>
              <div className="text-[10px] text-slate-500">Gouse AI Agent Q.S. Division</div>
            </div>
            <div className="border-t border-slate-400 pt-2 font-mono">
              <div className="font-bold text-slate-900">Principal Architect</div>
              <div className="text-[10px] text-slate-500">Ar. S. Gouse</div>
            </div>
            <div className="border-t border-slate-400 pt-2 font-mono">
              <div className="font-bold text-slate-900">Structural Consultant</div>
              <div className="text-[10px] text-slate-500">Verified & Approved</div>
            </div>
            <div className="border-t border-slate-400 pt-2 font-mono">
              <div className="font-bold text-slate-900">Client / Employer</div>
              <div className="text-[10px] text-slate-500">Sign & Acceptance</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
