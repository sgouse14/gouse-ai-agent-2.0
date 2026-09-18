import * as XLSX from 'xlsx';
import { BOQItem, BuildingFloor, FloorWiseTotal } from '../types';
import { calculateFloorWiseTotals, ensureItemFloorBreakdown, DEFAULT_BUILDING_FLOORS } from './floorTakeoffEngine';
import { MaterialTakeoffReport } from './materialTakeoffEngine';

export interface ExcelExportOptions {
  items: BOQItem[];
  floors?: BuildingFloor[];
  projectName?: string;
  currency?: string;
  contingencyPercent?: number;
  builtUpAreaSqFt?: number;
}

/**
 * Downloads a binary ArrayBuffer as a file in the browser
 */
function downloadBlob(data: Uint8Array, fileName: string, mimeType: string) {
  const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  const blob = new Blob([buffer], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports a multi-sheet Microsoft Excel (.xlsx) workbook containing:
 * 1. Floor-Wise BOQ Schedule (item quantities & amounts by level)
 * 2. Building Level Summary (area, cost, rate/sqft per floor)
 * 3. Consolidated Master BOQ (traditional quantity surveyor format)
 */
export function exportBOQToExcel({
  items,
  floors = DEFAULT_BUILDING_FLOORS,
  projectName = 'Building_Project',
  currency = 'INR',
  contingencyPercent = 10,
  builtUpAreaSqFt = 4500,
}: ExcelExportOptions): void {
  const ensuredItems = items.map((it) => ensureItemFloorBreakdown(it, floors));
  const {
    floorTotals,
    buildingSubtotal,
    contingencyAmount,
    grandTotal,
    totalAreaSqFt,
    overallRatePerSqFt,
  } = calculateFloorWiseTotals(ensuredItems, floors, contingencyPercent);

  const cleanProjectName = (projectName || 'Building_Project').trim().replace(/[/\\?%*:|"<>]/g, '_');
  const sanitizedFileName = `${cleanProjectName}_Schedule_of_Rates_Quantities.xlsx`;

  // Create new Excel workbook
  const wb = XLSX.utils.book_new();

  // ==========================================
  // SHEET 1: FLOOR-WISE DETAILED MATRIX
  // ==========================================
  const matrixData: (string | number)[][] = [];

  // Title & Metadata header
  matrixData.push(['SCHEDULE OF RATES & QUANTITIES (DETAILED FLOOR-WISE FORMAT)']);
  matrixData.push(['Project:', projectName, '', 'Date:', new Date().toLocaleDateString(), 'Currency:', currency]);
  matrixData.push(['Total Built-Up Area:', `${totalAreaSqFt} sq.ft`, '', 'Contingency Allowance:', `${contingencyPercent}%`, 'Grand Total Estimate:', grandTotal]);
  matrixData.push([]); // blank row

  // Table Headers
  const headerRow: (string | number)[] = [
    'Item #',
    'Item Description / Specification',
    'Category',
    'Unit',
    `Rate (${currency})`,
  ];

  floors.forEach((f) => {
    headerRow.push(`${f.shortCode} Qty (${f.name})`);
    headerRow.push(`${f.shortCode} Amount (${currency})`);
  });

  headerRow.push('Total Qty');
  headerRow.push(`Total Amount (${currency})`);
  headerRow.push('% of Budget');
  headerRow.push('Notes / Specification Remarks');

  matrixData.push(headerRow);

  // Line items
  ensuredItems.forEach((it, idx) => {
    const itemAmt = Math.round(it.quantity * it.rate * 100) / 100;
    const pct = buildingSubtotal > 0 ? `${((itemAmt / buildingSubtotal) * 100).toFixed(1)}%` : '0.0%';

    const row: (string | number)[] = [
      idx + 1,
      it.name || '',
      it.category || 'General',
      it.unit || '',
      it.rate || 0,
    ];

    floors.forEach((f) => {
      const q = (it.floorBreakdown && it.floorBreakdown[f.id]) || 0;
      const amt = Math.round(q * it.rate * 100) / 100;
      row.push(q);
      row.push(amt);
    });

    row.push(it.quantity || 0);
    row.push(itemAmt);
    row.push(pct);
    row.push(it.notes || '');

    matrixData.push(row);
  });

  // Empty separator
  matrixData.push([]);

  // Summary Rows
  const subtotalRow: (string | number)[] = ['', 'FLOOR SUBTOTAL', '', '', ''];
  floors.forEach((f) => {
    const ft = floorTotals.find((t) => t.floorId === f.id);
    subtotalRow.push('-');
    subtotalRow.push(ft?.subtotal || 0);
  });
  subtotalRow.push('-');
  subtotalRow.push(buildingSubtotal);
  subtotalRow.push('100.0%');
  subtotalRow.push('Direct Cost Subtotal');
  matrixData.push(subtotalRow);

  // Floor Area Row
  const areaRow: (string | number)[] = ['', 'FLOOR BUILT-UP AREA (SQ.FT)', '', '', ''];
  floors.forEach((f) => {
    areaRow.push('-');
    areaRow.push(f.areaSqFt);
  });
  areaRow.push('-');
  areaRow.push(totalAreaSqFt);
  areaRow.push('-');
  areaRow.push('Gross Plinth & Slab Area');
  matrixData.push(areaRow);

  // Rate per sq.ft Row
  const ratePerSqFtRow: (string | number)[] = ['', `RATE PER SQ.FT (${currency}/SQ.FT)`, '', '', ''];
  floors.forEach((f) => {
    const ft = floorTotals.find((t) => t.floorId === f.id);
    ratePerSqFtRow.push('-');
    ratePerSqFtRow.push(ft?.ratePerSqFt || 0);
  });
  ratePerSqFtRow.push('-');
  ratePerSqFtRow.push(overallRatePerSqFt);
  ratePerSqFtRow.push('-');
  ratePerSqFtRow.push(`Cost efficiency per level`);
  matrixData.push(ratePerSqFtRow);

  // Contingency & Grand Total Rows
  matrixData.push(['', `Contingency Reserve (${contingencyPercent}%)`, '', '', '', ...Array(floors.length * 2).fill(''), '-', contingencyAmount, `${contingencyPercent}%`, 'Project risk allowance']);
  matrixData.push(['', 'GRAND TOTAL ESTIMATE (WITH CONTINGENCY)', '', '', '', ...Array(floors.length * 2).fill(''), '-', grandTotal, '', 'Complete turnkey tender estimate']);

  const wsMatrix = XLSX.utils.aoa_to_sheet(matrixData);

  // Set column widths for Sheet 1
  const matrixCols: { wch: number }[] = [
    { wch: 8 },  // Item #
    { wch: 38 }, // Description
    { wch: 20 }, // Category
    { wch: 10 }, // Unit
    { wch: 14 }, // Rate
  ];
  floors.forEach(() => {
    matrixCols.push({ wch: 14 }); // Qty
    matrixCols.push({ wch: 16 }); // Amount
  });
  matrixCols.push({ wch: 14 }); // Total Qty
  matrixCols.push({ wch: 18 }); // Total Amount
  matrixCols.push({ wch: 12 }); // % of Budget
  matrixCols.push({ wch: 32 }); // Notes

  wsMatrix['!cols'] = matrixCols;
  XLSX.utils.book_append_sheet(wb, wsMatrix, 'Floor-Wise BOQ Schedule');

  // ==========================================
  // SHEET 2: LEVEL SUMMARY
  // ==========================================
  const summaryData: (string | number)[][] = [];
  summaryData.push(['BUILDING LEVEL & FLOOR COST SUMMARY']);
  summaryData.push(['Project:', projectName]);
  summaryData.push(['Total Built-Up Area:', `${totalAreaSqFt} sq.ft`]);
  summaryData.push(['Overall Unit Rate:', `${overallRatePerSqFt} ${currency}/sq.ft`]);
  summaryData.push([]);

  summaryData.push([
    'Level Code',
    'Building Floor Name',
    'Elevation (m)',
    'Slab Area (sq.ft)',
    `Level Subtotal (${currency})`,
    `Rate per Sq.Ft (${currency}/sq.ft)`,
    '% of Direct Cost',
  ]);

  floorTotals.forEach((ft) => {
    const floor = floors.find((f) => f.id === ft.floorId);
    summaryData.push([
      floor?.shortCode || ft.floorId,
      floor?.name || ft.floorName,
      floor?.elevation || ft.elevation || '-',
      floor?.areaSqFt ?? ft.areaSqFt ?? 0,
      ft.subtotal,
      ft.ratePerSqFt,
      `${ft.percentageOfBuilding}%`,
    ]);
  });

  summaryData.push([]);
  summaryData.push([
    'TOTAL',
    'Building Direct Subtotal',
    '-',
    totalAreaSqFt,
    buildingSubtotal,
    overallRatePerSqFt,
    '100.0%',
  ]);
  summaryData.push([
    'CONTINGENCY',
    `Contingency Reserve (${contingencyPercent}%)`,
    '-',
    '-',
    contingencyAmount,
    Math.round(contingencyAmount / (totalAreaSqFt || 1)),
    `${contingencyPercent}%`,
  ]);
  summaryData.push([
    'GRAND TOTAL',
    'Turnkey Project Estimate',
    '-',
    totalAreaSqFt,
    grandTotal,
    Math.round(grandTotal / (totalAreaSqFt || 1)),
    '-',
  ]);

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [
    { wch: 14 },
    { wch: 28 },
    { wch: 14 },
    { wch: 18 },
    { wch: 22 },
    { wch: 22 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Level Cost Summary');

  // ==========================================
  // SHEET 3: CONSOLIDATED MASTER BOQ
  // ==========================================
  const masterData: (string | number)[][] = [];
  masterData.push(['CONSOLIDATED SCHEDULE OF RATES & QUANTITIES']);
  masterData.push(['Project:', projectName, 'Built-Up Area:', `${builtUpAreaSqFt} sq.ft`]);
  masterData.push([]);

  masterData.push([
    'Item #',
    'Category',
    'Item Description',
    'Unit',
    'Quantity',
    `Unit Rate (${currency})`,
    `Total Amount (${currency})`,
    'Stage / Notes',
  ]);

  ensuredItems.forEach((it, idx) => {
    masterData.push([
      idx + 1,
      it.category || 'General',
      it.name || '',
      it.unit || '',
      it.quantity || 0,
      it.rate || 0,
      Math.round((it.quantity || 0) * (it.rate || 0) * 100) / 100,
      it.notes || '',
    ]);
  });

  masterData.push([]);
  masterData.push(['', '', 'SUBTOTAL', '', '', '', buildingSubtotal, '']);
  masterData.push(['', '', `Contingency Allowance (${contingencyPercent}%)`, '', '', '', contingencyAmount, '']);
  masterData.push(['', '', 'GRAND ESTIMATED TOTAL', '', '', '', grandTotal, '']);
  masterData.push(['', '', `Rate per sq.ft (${totalAreaSqFt} sq.ft)`, '', '', '', overallRatePerSqFt, '']);

  const wsMaster = XLSX.utils.aoa_to_sheet(masterData);
  wsMaster['!cols'] = [
    { wch: 8 },
    { wch: 22 },
    { wch: 44 },
    { wch: 10 },
    { wch: 14 },
    { wch: 16 },
    { wch: 20 },
    { wch: 32 },
  ];
  XLSX.utils.book_append_sheet(wb, wsMaster, 'Consolidated BOQ');

  // Write workbook to binary buffer
  const excelBuffer = XLSX.write(wb, {
    bookType: 'xlsx',
    type: 'array',
  });

  // Trigger download
  downloadBlob(
    new Uint8Array(excelBuffer),
    sanitizedFileName,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
}

/**
 * Generates an Excel-ready UTF-8 CSV with Byte Order Mark (BOM)
 * so Microsoft Excel opens it immediately with correct encoding,
 * delimiters, and clean table formatting without the text import wizard.
 */
export function exportBOQToExcelCSV({
  items,
  floors = DEFAULT_BUILDING_FLOORS,
  projectName = 'Building_Project',
  currency = 'INR',
  contingencyPercent = 10,
}: ExcelExportOptions): void {
  const ensuredItems = items.map((it) => ensureItemFloorBreakdown(it, floors));
  const {
    floorTotals,
    buildingSubtotal,
    contingencyAmount,
    grandTotal,
    totalAreaSqFt,
    overallRatePerSqFt,
  } = calculateFloorWiseTotals(ensuredItems, floors, contingencyPercent);

  const cleanProjectName = (projectName || 'Building_Project').trim().replace(/[/\\?%*:|"<>]/g, '_');
  const fileName = `${cleanProjectName}_FloorWise_Schedule_of_Rates_Quantities_Excel.csv`;

  const lines: string[] = [];

  // Title header for Excel
  lines.push(`"SCHEDULE OF RATES & QUANTITIES - DETAILED FLOOR-WISE BREAKDOWN"`);
  lines.push(`"Project:","${cleanProjectName}","Date:","${new Date().toLocaleDateString()}","Currency:","${currency}"`);
  lines.push(`"Total Built-Up Area:","${totalAreaSqFt} sq.ft","Contingency:","${contingencyPercent}%","Grand Total:","${grandTotal}"`);
  lines.push('');

  // Table Column Headers
  const headers = ['#', 'Item Description', 'Category', 'Unit', `Unit Rate (${currency})`];
  floors.forEach((f) => {
    headers.push(`${f.shortCode} Qty (${f.name})`);
    headers.push(`${f.shortCode} Amount (${currency})`);
  });
  headers.push('Total Quantity');
  headers.push(`Total Amount (${currency})`);
  headers.push('% of Subtotal');
  headers.push('Notes / Specification');

  lines.push(headers.map((h) => `"${h}"`).join(','));

  // Data rows
  ensuredItems.forEach((it, idx) => {
    const itemAmt = Math.round(it.quantity * it.rate * 100) / 100;
    const pct = buildingSubtotal > 0 ? `${((itemAmt / buildingSubtotal) * 100).toFixed(1)}%` : '0.0%';

    const row = [
      String(idx + 1),
      `"${(it.name || '').replace(/"/g, '""')}"`,
      `"${it.category || 'General'}"`,
      `"${it.unit || ''}"`,
      String(it.rate),
    ];

    floors.forEach((f) => {
      const q = (it.floorBreakdown && it.floorBreakdown[f.id]) || 0;
      const amt = Math.round(q * it.rate * 100) / 100;
      row.push(String(q));
      row.push(String(amt));
    });

    row.push(String(it.quantity));
    row.push(String(itemAmt));
    row.push(`"${pct}"`);
    row.push(`"${(it.notes || '').replace(/"/g, '""')}"`);

    lines.push(row.join(','));
  });

  // Empty row
  lines.push('');

  // Floor Subtotals
  const subtotalRow = ['', '"FLOOR DIRECT SUBTOTAL"', '', '', ''];
  floors.forEach((f) => {
    const ft = floorTotals.find((t) => t.floorId === f.id);
    subtotalRow.push('-');
    subtotalRow.push(String(ft?.subtotal || 0));
  });
  subtotalRow.push('-');
  subtotalRow.push(String(buildingSubtotal));
  subtotalRow.push('"100.0%"');
  subtotalRow.push('"Direct Subtotal"');
  lines.push(subtotalRow.join(','));

  // Floor Built-Up Area
  const areaRow = ['', '"FLOOR BUILT-UP AREA (SQ.FT)"', '', '', ''];
  floors.forEach((f) => {
    areaRow.push('-');
    areaRow.push(`"${f.areaSqFt} sq.ft"`);
  });
  areaRow.push('-');
  areaRow.push(`"${totalAreaSqFt} sq.ft"`);
  areaRow.push('-');
  areaRow.push('"Gross Area"');
  lines.push(areaRow.join(','));

  // Floor Rate per Sq.Ft
  const rateRow = ['', `"FLOOR RATE PER SQ.FT (${currency}/SQ.FT)"`, '', '', ''];
  floors.forEach((f) => {
    const ft = floorTotals.find((t) => t.floorId === f.id);
    rateRow.push('-');
    rateRow.push(`"${currency} ${ft?.ratePerSqFt || 0}/sq.ft"`);
  });
  rateRow.push('-');
  rateRow.push(`"${currency} ${overallRatePerSqFt}/sq.ft"`);
  rateRow.push('-');
  rateRow.push('"Unit Cost"');
  lines.push(rateRow.join(','));

  // Contingency & Grand Total
  lines.push('');
  lines.push(`"","Contingency Reserve (${contingencyPercent}%)","","","","","","","","","","","","","${contingencyAmount}",""`);
  lines.push(`"","GRAND TOTAL ESTIMATE (WITH CONTINGENCY)","","","","","","","","","","","","","${grandTotal}",""`);

  // Microsoft Excel UTF-8 Byte Order Mark (BOM) \uFEFF + CRLF
  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface MaterialTakeoffExcelExportOptions {
  report: MaterialTakeoffReport;
  floors?: BuildingFloor[];
  projectName?: string;
  currency?: string;
}

/**
 * Exports a multi-sheet Microsoft Excel (.xlsx) workbook for Material Area Takeoff & Quantities:
 * Sheet 1: Material Quantities Takeoff Schedule (Itemized with Floor-Wise breakdown, Brands, IS codes & Spot Prices)
 * Sheet 2: Floor-Wise Allocation Summary (Area, Cost, Rate/sq.ft and major structural consumption per level)
 * Sheet 3: Category & Structural Volumes Breakdown (Category totals and high-level key volume aggregates)
 */
export function exportMaterialTakeoffToExcel({
  report,
  floors = report.floors,
  projectName = 'Building_Project',
  currency = 'INR',
}: MaterialTakeoffExcelExportOptions): void {
  const cleanProjectName = (projectName || 'Building_Project').trim().replace(/[/\\?%*:|"<>]/g, '_');
  const sanitizedFileName = `${cleanProjectName}_Material_Takeoff_${report.areaSqFt}sqft_${report.region.id}.xlsx`;

  // Create new Excel workbook
  const wb = XLSX.utils.book_new();

  // ==========================================
  // SHEET 1: MATERIAL TAKEOFF SCHEDULE
  // ==========================================
  const scheduleData: (string | number)[][] = [];

  // Title Block
  scheduleData.push(['MATERIAL AREA TAKEOFF & QUANTITIES SCHEDULE (FLOOR-WISE SPECIFICATIONS)']);
  scheduleData.push([
    'Project:',
    projectName,
    '',
    'Date:',
    new Date().toLocaleDateString(),
    'Built-Up Area:',
    `${report.areaSqFt.toLocaleString()} sq.ft (${Math.round(report.areaSqFt * 0.092903).toLocaleString()} m²)`,
  ]);
  scheduleData.push([
    'Pricing Region:',
    report.region.name,
    '',
    'Specification Tier:',
    report.tier,
    'Procurement Basis:',
    report.pricingBasis,
  ]);
  scheduleData.push([
    'Total Material Cost:',
    report.totalMaterialCost,
    'Cost per sq.ft:',
    `${currency} ${report.materialCostPerSqFt}/sq.ft`,
    'Floors Configured:',
    floors.length,
  ]);
  scheduleData.push([]); // blank separator

  // Table Headers
  const headerRow: (string | number)[] = [
    'Item #',
    'Material Name',
    'Category',
    'IS Code / Standard',
    'Engineering Norm',
    'Wastage %',
    'Assigned Brand / Make',
    'Brand Tier',
    `Rate (${currency})`,
    'Total Quantity',
    'Unit',
    `Total Material Cost (${currency})`,
    `Cost / sq.ft (${currency})`,
    '% of Budget',
  ];

  floors.forEach((f) => {
    headerRow.push(`${f.shortCode} Qty (${f.name})`);
    headerRow.push(`${f.shortCode} Cost (${currency})`);
  });

  headerRow.push('Distribution Rule');
  headerRow.push('Applicable Floors');
  headerRow.push('Engineering Floor Notes');

  scheduleData.push(headerRow);

  // Line Items
  report.items.forEach((item, idx) => {
    const brandName = item.selectedBrand || (item.norm.brands && item.norm.brands[0]) || 'Standard';
    const brandCategory = item.selectedBrandCategory || 'National';

    const row: (string | number)[] = [
      idx + 1,
      item.norm.name,
      item.norm.category,
      item.norm.isCodeRef || 'IS Standard',
      item.norm.normDescription,
      item.effectiveWastagePercent,
      brandName,
      brandCategory,
      item.marketRate,
      item.roundedQuantity,
      item.unit,
      item.totalCost,
      item.costPerSqFt,
      `${item.percentOfTotalMaterialBudget}%`,
    ];

    floors.forEach((f) => {
      const bd = item.floorBreakdown[f.id];
      row.push(bd?.roundedQuantity ?? 0);
      row.push(bd?.cost ?? 0);
    });

    row.push(item.norm.floorDistributionType || 'proportional_area');
    row.push((item.norm.applicableFloors || []).join(', '));
    row.push(item.norm.floorNotes || '');

    scheduleData.push(row);
  });

  // Empty separator
  scheduleData.push([]);

  // Subtotal row
  const subtotalRow: (string | number)[] = [
    '',
    'TOTAL MATERIAL COST',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    report.totalMaterialCost,
    report.materialCostPerSqFt,
    '100.0%',
  ];

  floors.forEach((f) => {
    const ft = report.floorTotals.find((t) => t.floorId === f.id);
    subtotalRow.push('-');
    subtotalRow.push(ft?.subtotal || 0);
  });

  subtotalRow.push('');
  subtotalRow.push('');
  subtotalRow.push('Floor-Wise Direct Material Cost Total');
  scheduleData.push(subtotalRow);

  const wsSchedule = XLSX.utils.aoa_to_sheet(scheduleData);

  // Column Widths for Sheet 1
  const colWidths: { wch: number }[] = [
    { wch: 8 },  // Item #
    { wch: 32 }, // Material Name
    { wch: 22 }, // Category
    { wch: 18 }, // IS Code
    { wch: 28 }, // Norm
    { wch: 12 }, // Wastage %
    { wch: 24 }, // Brand
    { wch: 14 }, // Brand Tier
    { wch: 14 }, // Rate
    { wch: 14 }, // Total Qty
    { wch: 10 }, // Unit
    { wch: 18 }, // Total Cost
    { wch: 14 }, // Cost/sqft
    { wch: 12 }, // % of Budget
  ];

  floors.forEach(() => {
    colWidths.push({ wch: 16 }); // Floor Qty
    colWidths.push({ wch: 18 }); // Floor Cost
  });

  colWidths.push({ wch: 22 }); // Distribution Rule
  colWidths.push({ wch: 26 }); // Applicable Floors
  colWidths.push({ wch: 34 }); // Notes

  wsSchedule['!cols'] = colWidths;
  XLSX.utils.book_append_sheet(wb, wsSchedule, 'Material Schedule');

  // ==========================================
  // SHEET 2: FLOOR-WISE ALLOCATION SUMMARY
  // ==========================================
  const summaryData: (string | number)[][] = [];

  summaryData.push(['BUILDING FLOOR-WISE MATERIAL ALLOCATION & COST SUMMARY']);
  summaryData.push([
    'Project:',
    projectName,
    '',
    'Total Built-Up Area:',
    `${report.areaSqFt.toLocaleString()} sq.ft`,
    'Material Budget:',
    report.totalMaterialCost,
  ]);
  summaryData.push([]); // blank separator

  const summaryHeaders: (string | number)[] = [
    'Level / Floor',
    'Code',
    'Elevation',
    'Slab Area (sq.ft)',
    'Area Share (%)',
    `Material Subtotal (${currency})`,
    `Cost / sq.ft (${currency})`,
    'Budget Share (%)',
    'Allocated Items',
    'Cement (Bags)',
    'Steel (MT)',
    'Concrete (m³)',
    'Masonry (m³)',
    'Tiles (sq.ft)',
    'Paint (Liters)',
  ];
  summaryData.push(summaryHeaders);

  report.floorTotals.forEach((ft) => {
    const areaPct = report.areaSqFt > 0 ? `${Math.round((ft.areaSqFt / report.areaSqFt) * 100)}%` : '0%';
    summaryData.push([
      ft.floorName,
      ft.shortCode,
      ft.elevation,
      ft.areaSqFt,
      areaPct,
      ft.subtotal,
      ft.costPerSqFt,
      `${ft.percentOfTotal}%`,
      ft.itemCount,
      ft.keyVolumes.cementBags,
      ft.keyVolumes.steelMetricTonnes,
      ft.keyVolumes.concreteM3,
      ft.keyVolumes.blocksM3,
      ft.keyVolumes.tilesSqFt,
      ft.keyVolumes.paintLiters,
    ]);
  });

  // Building Totals row
  summaryData.push([]);
  summaryData.push([
    'BUILDING GRAND TOTAL',
    'ALL',
    '-',
    report.areaSqFt,
    '100.0%',
    report.totalMaterialCost,
    report.materialCostPerSqFt,
    '100.0%',
    report.items.length,
    report.keyMaterialVolumes.cementBags,
    report.keyMaterialVolumes.steelMetricTonnes,
    report.keyMaterialVolumes.concreteM3,
    report.keyMaterialVolumes.blocksM3,
    report.keyMaterialVolumes.tilesSqFt,
    report.keyMaterialVolumes.paintLiters,
  ]);

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [
    { wch: 22 }, // Level
    { wch: 10 }, // Code
    { wch: 16 }, // Elevation
    { wch: 18 }, // Slab Area
    { wch: 14 }, // Area Share
    { wch: 22 }, // Subtotal
    { wch: 16 }, // Cost/sqft
    { wch: 14 }, // Budget Share
    { wch: 14 }, // Items
    { wch: 14 }, // Cement
    { wch: 14 }, // Steel
    { wch: 14 }, // Concrete
    { wch: 14 }, // Masonry
    { wch: 14 }, // Tiles
    { wch: 14 }, // Paint
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Floor Summary');

  // ==========================================
  // SHEET 3: CATEGORY & VOLUME AGGREGATES
  // ==========================================
  const categoryData: (string | number)[][] = [];

  categoryData.push(['MATERIAL CATEGORY BREAKDOWN & STRUCTURAL VOLUMES']);
  categoryData.push([
    'Pricing Region:',
    report.region.name,
    'Specification Quality:',
    report.tier,
    'Procurement Basis:',
    report.pricingBasis,
  ]);
  categoryData.push([]); // blank

  categoryData.push(['CATEGORY BREAKDOWN']);
  categoryData.push([
    'Material Category',
    'Item Count',
    `Total Cost (${currency})`,
    `Cost / sq.ft (${currency})`,
    'Budget Share (%)',
  ]);

  Object.entries(report.categoryBreakdown).forEach(([cat, val]) => {
    const costPerSqFt = Math.round((val.cost / (report.areaSqFt || 1)) * 100) / 100;
    categoryData.push([
      cat,
      val.itemsCount,
      val.cost,
      costPerSqFt,
      `${val.percent}%`,
    ]);
  });

  categoryData.push([
    'Total Direct Materials',
    report.items.length,
    report.totalMaterialCost,
    report.materialCostPerSqFt,
    '100.0%',
  ]);

  categoryData.push([]); // blank
  categoryData.push(['HIGH-LEVEL STRUCTURAL VOLUME BENCHMARKS']);
  categoryData.push([
    'Material Component',
    'Estimated Total Volume',
    'Unit of Measurement',
    'Standard Rule-of-Thumb Benchmark',
  ]);

  categoryData.push([
    'OPC / PPC Cement',
    report.keyMaterialVolumes.cementBags,
    'Bags (50 kg)',
    '~0.40 - 0.45 bags per sq.ft built-up area',
  ]);
  categoryData.push([
    'Fe550D TMT Reinforcement Steel',
    report.keyMaterialVolumes.steelMetricTonnes,
    'Metric Tonnes (MT)',
    '~3.5 - 4.2 kg per sq.ft built-up area',
  ]);
  categoryData.push([
    'River / Manufactured Sand (M-Sand)',
    report.keyMaterialVolumes.sandTonnes,
    'Tonnes',
    '~1.8 - 2.1 tonnes per 100 sq.ft built-up area',
  ]);
  categoryData.push([
    'Structural Concrete (M20 / M25)',
    report.keyMaterialVolumes.concreteM3,
    'Cubic Meters (m³)',
    '~0.033 - 0.038 m³ per sq.ft built-up area',
  ]);
  categoryData.push([
    'Masonry (Concrete Blocks / AAC)',
    report.keyMaterialVolumes.blocksM3,
    'Cubic Meters (m³)',
    '~0.045 - 0.052 m³ per sq.ft built-up area',
  ]);
  categoryData.push([
    'Flooring & Wall Vitrified Tiles',
    report.keyMaterialVolumes.tilesSqFt,
    'Square Feet (sq.ft)',
    '~1.15 - 1.25x carpet area coverage',
  ]);
  categoryData.push([
    'Paints (Primer + Acrylic Emulsion)',
    report.keyMaterialVolumes.paintLiters,
    'Liters',
    '~0.18 - 0.22 L per sq.ft wall & ceiling surface',
  ]);

  const wsCategory = XLSX.utils.aoa_to_sheet(categoryData);
  wsCategory['!cols'] = [
    { wch: 32 }, // Component
    { wch: 22 }, // Volume / Count
    { wch: 22 }, // Unit / Cost
    { wch: 42 }, // Benchmark / Share
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsCategory, 'Categories & Volumes');

  // Write workbook to binary buffer
  const excelBuffer = XLSX.write(wb, {
    bookType: 'xlsx',
    type: 'array',
  });

  // Trigger download
  downloadBlob(
    new Uint8Array(excelBuffer),
    sanitizedFileName,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
}
