import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BOQItem, BuildingFloor, FloorWiseTotal, Project } from '../types';
import { CurrencyCode } from '../utils/formatters';

export interface PDFExportOptions {
  project: Project;
  items: BOQItem[];
  floors: BuildingFloor[];
  floorTotals: FloorWiseTotal[];
  currency?: CurrencyCode;
  contingencyPercent?: number;
}

/**
 * Generates and downloads an official Architectural & Engineering
 * Schedule of Rates & Quantities (Floor-Wise) PDF report.
 */
export function exportFloorWiseReportToPDF({
  project,
  items,
  floors,
  floorTotals,
  currency = 'INR',
  contingencyPercent = 5,
}: PDFExportOptions): void {
  // Use A4 Landscape to accommodate multi-level columns with excellent readability
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const currencySymbol =
    currency === 'INR'
      ? 'Rs. '
      : currency === 'USD'
      ? '$'
      : currency === 'AED'
      ? 'AED '
      : currency === 'EUR'
      ? '€'
      : currency === 'GBP'
      ? '£'
      : `${currency} `;

  const buildingSubtotal = floorTotals.reduce((sum, f) => sum + f.subtotal, 0);
  const contingencyAmount = Math.round(buildingSubtotal * (contingencyPercent / 100));
  const grandTotal = buildingSubtotal + contingencyAmount;
  const totalAreaSqFt = floors.reduce((sum, f) => sum + f.areaSqFt, 0);
  const overallRatePerSqFt = totalAreaSqFt > 0 ? Math.round(grandTotal / totalAreaSqFt) : 0;
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;

  // --- Document Header ---
  // Top Banner Bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 18, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(245, 158, 11); // amber-500
  doc.text('GOUSE AI  •  ARCHITECTURE, ENGINEERING & CONSTRUCTION INTELLIGENCE', margin, 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('OFFICIAL TENDER SCHEDULE OF RATES & QUANTITIES  |  IS 456 & CPWD NORMS COMPLIANT', margin, 13);

  // Document Title & Project Metadata (Below Top Banner)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('FLOOR-WISE SCHEDULE OF RATES & QUANTITIES REPORT', margin, 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Project: ${project.name || 'Untitled Project'}   |   Type: ${project.projectType || 'General Construction'}   |   Location: ${project.location || 'India'}   |   Built-up Area: ${totalAreaSqFt.toLocaleString()} sq.ft`,
    margin,
    31
  );

  // Reference & Date Box on the Right
  const refText = `Doc Ref: SOR-FLR-${(project.id || 'GEN').substring(0, 8).toUpperCase()}`;
  const dateText = `Date: ${currentDate}   |   Status: Approved Tender Draft`;
  doc.setFont('helvetica', 'bold');
  doc.text(refText, pageWidth - margin - doc.getTextWidth(refText), 26);
  doc.setFont('helvetica', 'normal');
  doc.text(dateText, pageWidth - margin - doc.getTextWidth(dateText), 31);

  // Divider Line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(margin, 34, pageWidth - margin, 34);

  let currentY = 38;

  // --- SECTION 1: Building Levels Executive Summary Table ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text('1. EXECUTIVE SUMMARY OF BUILDING LEVELS & SLAB COSTS', margin, currentY);
  currentY += 3;

  const floorSummaryHeaders = [
    'Level Code',
    'Building Level Name',
    'Elevation',
    'Slab Area (sq.ft)',
    `Floor Cost (${currency})`,
    'Rate / Sq.Ft',
    '% Share of Total',
  ];

  const floorSummaryRows = floors.map((fl) => {
    const ft = floorTotals.find((t) => t.floorId === fl.id);
    return [
      fl.shortCode,
      fl.name,
      fl.elevation || '0.00m',
      (fl.areaSqFt || 0).toLocaleString(),
      `${currencySymbol}${(ft?.subtotal || 0).toLocaleString()}`,
      `${currencySymbol}${(ft?.ratePerSqFt || 0).toLocaleString()}/sq.ft`,
      `${ft?.percentageOfBuilding || 0}%`,
    ];
  });

  // Footer for summary
  floorSummaryRows.push([
    'TOTAL',
    'CONSOLIDATED BUILDING TOTAL',
    '-',
    totalAreaSqFt.toLocaleString(),
    `${currencySymbol}${buildingSubtotal.toLocaleString()}`,
    `${currencySymbol}${overallRatePerSqFt.toLocaleString()}/sq.ft`,
    '100%',
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [floorSummaryHeaders],
    body: floorSummaryRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: { halign: 'center', fontStyle: 'bold', cellWidth: 22 },
      1: { halign: 'left', fontStyle: 'bold', cellWidth: 60 },
      2: { halign: 'center', cellWidth: 24 },
      3: { halign: 'right', cellWidth: 32 },
      4: { halign: 'right', fontStyle: 'bold', cellWidth: 42 },
      5: { halign: 'right', cellWidth: 32 },
      6: { halign: 'right', fontStyle: 'bold', cellWidth: 30 },
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8,
    },
    margin: { left: margin, right: margin },
  });

  // @ts-ignore - jspdf-autotable attaches lastAutoTable
  currentY = doc.lastAutoTable.finalY + 8;

  // --- SECTION 2: Detailed Schedule of Rates & Level-by-Level Quantities ---
  // Check if we need a page break before starting section 2
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 16;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text('2. DETAILED SCHEDULE OF RATES & LEVEL-BY-LEVEL QUANTITIES', margin, currentY);
  currentY += 3;

  // Build dynamic headers based on project floors
  const itemHeaders = [
    '#',
    'Item Description',
    'Category',
    'Unit',
    `Rate (${currency})`,
    ...floors.map((f) => `${f.shortCode}`),
    'Total Qty',
    `Total (${currency})`,
  ];

  const itemRows = items.map((it, idx) => {
    const bd = it.floorBreakdown || {};
    const floorCols = floors.map((f) => {
      const q = bd[f.id] || 0;
      return q > 0 ? q.toLocaleString() : '-';
    });
    const totalCost = Math.round(it.quantity * it.rate);

    return [
      String(idx + 1),
      it.name,
      it.category || 'General',
      it.unit,
      `${currencySymbol}${it.rate.toLocaleString()}`,
      ...floorCols,
      it.quantity.toLocaleString(),
      `${currencySymbol}${totalCost.toLocaleString()}`,
    ];
  });

  // Level subtotals footer row
  const floorSubtotalCols = floors.map((f) => {
    const ft = floorTotals.find((t) => t.floorId === f.id);
    return `${currencySymbol}${(ft?.subtotal || 0).toLocaleString()}`;
  });

  itemRows.push([
    '',
    'LEVEL SUBTOTALS',
    '-',
    '-',
    '-',
    ...floorSubtotalCols,
    '-',
    `${currencySymbol}${buildingSubtotal.toLocaleString()}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [itemHeaders],
    body: itemRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59],
      cellPadding: 1.6,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left', fontStyle: 'bold', cellWidth: 62 },
      2: { halign: 'left', cellWidth: 26 },
      3: { halign: 'center', cellWidth: 14 },
      4: { halign: 'right', cellWidth: 22 },
      // floor columns are auto-spaced
    },
    margin: { left: margin, right: margin },
  });

  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 6;

  // --- SECTION 3: Financial Summary & Contingency Box ---
  if (currentY > pageHeight - 55) {
    doc.addPage();
    currentY = 16;
  }

  const boxWidth = 90;
  const boxX = pageWidth - margin - boxWidth;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(boxX, currentY, boxWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Building Works Subtotal:', boxX + 4, currentY + 6);
  doc.text(`Contingency & Supervision (${contingencyPercent}%):`, boxX + 4, currentY + 12);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${currencySymbol}${buildingSubtotal.toLocaleString()}`, boxX + boxWidth - 4, currentY + 6, { align: 'right' });
  doc.text(`${currencySymbol}${contingencyAmount.toLocaleString()}`, boxX + boxWidth - 4, currentY + 12, { align: 'right' });

  doc.setDrawColor(226, 232, 240);
  doc.line(boxX + 4, currentY + 15, boxX + boxWidth - 4, currentY + 15);

  doc.setFontSize(9.5);
  doc.setTextColor(180, 83, 9); // amber-700
  doc.text('Grand Total Estimate:', boxX + 4, currentY + 20.5);
  doc.text(`${currencySymbol}${grandTotal.toLocaleString()}`, boxX + boxWidth - 4, currentY + 20.5, { align: 'right' });

  currentY += 32;

  // --- SECTION 4: Engineering Sign-off Block ---
  if (currentY > pageHeight - 35) {
    doc.addPage();
    currentY = 20;
  }

  const sigColWidth = (pageWidth - margin * 2) / 4;
  const sigTitles = [
    { role: 'Lead Quantity Surveyor', org: 'Gouse AI Agent Q.S. Division' },
    { role: 'Principal Architect', org: 'Ar. S. Gouse & Partners' },
    { role: 'Structural Consultant', org: 'IS 456 Structural Audit' },
    { role: 'Client / Employer', org: 'Acceptance & Sign-off' },
  ];

  sigTitles.forEach((sig, idx) => {
    const xPos = margin + idx * sigColWidth;
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.3);
    doc.line(xPos + 4, currentY, xPos + sigColWidth - 4, currentY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(sig.role, xPos + sigColWidth / 2, currentY + 5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(sig.org, xPos + sigColWidth / 2, currentY + 9, { align: 'center' });
  });

  // --- Add Page Numbers to all pages ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Official Floor-Wise Schedule of Rates & Quantities  |  Project: ${project.name}  |  Doc Ref: SOR-FLR-${(project.id || 'GEN').substring(0, 8).toUpperCase()}`,
      margin,
      pageHeight - 6
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  // Sanitize filename and save
  const sanitizedName = (project.name || 'Project')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_{2,}/g, '_');
  const fileName = `${sanitizedName}_Floor_Wise_SOR_Report.pdf`;

  doc.save(fileName);
}
