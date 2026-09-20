import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Building,
  ShieldCheck,
  Tag,
  Coins,
  Copy,
  Check,
  ArrowRight,
  BookOpen,
  FileCode,
  Droplets,
  HardHat,
} from 'lucide-react';
import { LiveMaterialPrice } from '../types';

export interface ExtractedVariant {
  name: string;
  type: string;
  coveragePerUnit: string;
  spotPriceEstimate: number;
  unit: string;
  recommendedUse: string;
  dilutionOrWaterRatio?: string;
  dryingTimeOrCuring?: string;
  vocOrPurityGrade?: string;
}

export interface ExtractedMaterialStandard {
  brandName: string;
  parentCompany: string;
  category: string;
  subCategory?: string;
  isCodeStandards: string[];
  technicalDescription: string;
  recommendedUse: string;
  productVariants: ExtractedVariant[];
  testingCertificates: string[];
  applicationGuidelines: string[];
  summary: string;
  applicableNormId?: string;
  sourceType?: 'gemini_pdf_extract' | 'domain_calibrated_preset';
}

interface MaterialPdfSpecUpdaterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyStandards: (
    standards: ExtractedMaterialStandard,
    createdLivePrices?: LiveMaterialPrice[]
  ) => void;
}

export const MaterialPdfSpecUpdaterModal: React.FC<MaterialPdfSpecUpdaterModalProps> = ({
  isOpen,
  onClose,
  onApplyStandards,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedMaterialStandard | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    setErrorMsg(null);

    // Read file
    if (file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf')) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Strip data:application/pdf;base64,
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        setFileBase64(base64);
      };
      reader.readAsDataURL(file);
    } else {
      // Plain text / markdown / CSV
      const reader = new FileReader();
      reader.onload = () => {
        setRawText(reader.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handlePresetBirlaOpus = () => {
    setSelectedFile(null);
    setFileBase64(null);
    setErrorMsg(null);
    setRawText(`BIRLA OPUS PAINTS - TECHNICAL SPECIFICATION & ARCHITECTURAL STANDARDS
Manufacturer: Grasim Industries Limited (Aditya Birla Group)
Products & Variants:
1. Birla Opus Calista (Ultra-Luxury Interior Emulsion)
   - Coverage: 120 - 140 sq.ft/liter in 2 coats
   - Spot Rate: ₹ 395/Liter
   - Scrub resistance: >10,000 cycles (ASTM D2486)
   - Dilution: 40-45% potable water by volume
   - Recoat time: 4 hours
   - VOC: < 18 g/L (Ultra-Low VOC, Zero added lead/mercury)
2. Birla Opus One (Luxury Interior & Exterior Acrylic Emulsion)
   - Coverage: 130 - 150 sq.ft/liter in 2 coats
   - Spot Rate: ₹ 345/Liter
   - Finish: Rich velvet sheen, cross-linking micro-acrylics
3. Birla Opus Style (Premium Emulsion)
   - Coverage: 140 - 160 sq.ft/liter in 2 coats
   - Spot Rate: ₹ 285/Liter
4. Birla Opus AllDry (Elastomeric Exterior Waterproof Dampproof Barrier)
   - Coverage: 45 - 55 sq.ft/liter in 3 coats
   - Spot Rate: ₹ 420/Liter
   - 10-Year Water Barrier Guarantee, 2.5mm crack bridging
5. Birla White Wall Care Putty (HP Technology Polymer Fortified)
   - Coverage: 18 - 22 sq.ft/kg (2 coats, 1.5mm)
   - Spot Rate: ₹ 68/kg (₹ 920 per 40kg bag)
   - Anti-efflorescence, high adhesion

Conforming Standards: IS 15489:2004, IS 5410, IS 2932, GreenPro Ecofriendly Certified`);
  };

  const handlePresetBirlaOPC = () => {
    setSelectedFile(null);
    setFileBase64(null);
    setErrorMsg(null);
    setRawText(`BIRLA A1 / ULTRATECH OPC 53 GRADE CEMENT TECHNICAL SPECIFICATIONS
Manufacturer: Aditya Birla Group / Birla Corporation
Grade: Ordinary Portland Cement (OPC 53 Grade & 43 Grade)
Conforming Standards: IS 269:2015, IS 12269:2013, IS 456:2000
Compressive Strength Requirements:
- 3 Days: > 27 MPa (Actual batch test: 34 MPa)
- 7 Days: > 37 MPa (Actual batch test: 46 MPa)
- 28 Days: > 53 MPa (Actual batch test: 62 MPa)
Physical Characteristics:
- Fineness (Specific Surface - Blaine): 320 m²/kg (Min 225 m²/kg)
- Initial Setting Time: 45 minutes (Min 30 mins)
- Final Setting Time: 280 minutes (Max 600 mins)
- Soundness (Le-Chatelier Expansion): 1.5 mm (Max 10.0 mm)
Applications:
- Multi-storey RCC framing, high-strength columns, transfer girders, precast PT slabs
Packaging: 50 kg HDPE bags
Spot Rate: ₹ 385 per 50 kg bag (Wholesale benchmark: ₹ 365 - 415)`);
  };

  const handleExtract = async () => {
    if (!fileBase64 && !rawText.trim() && !selectedFile) {
      setErrorMsg('Please upload a PDF file or select one of the Birla presets.');
      return;
    }

    setIsExtracting(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/materials/parse-pdf-specs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64: fileBase64 || undefined,
          text: rawText || undefined,
          fileName: selectedFile?.name || 'Birla_Specifications_TDS.pdf',
          mimeType: selectedFile?.type || 'application/pdf',
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned error ${response.status}`);
      }

      const result: ExtractedMaterialStandard = await response.json();
      setExtractedData(result);
    } catch (err: any) {
      console.error('Extraction error:', err);
      setErrorMsg('Could not process PDF automatically. Please check document contents or try the preset.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleApply = () => {
    if (!extractedData) return;

    // Convert product variants into LiveMaterialPrice entries
    const generatedLivePrices: LiveMaterialPrice[] = (extractedData.productVariants || []).map(
      (variant, idx) => ({
        id: `custom-pdf-${Date.now()}-${idx}`,
        name: variant.name,
        category:
          extractedData.category === 'Paints & Waterproofing'
            ? 'Finishes & Coatings'
            : 'Cement & Concrete',
        brands: [variant.name, extractedData.brandName],
        unit: variant.unit,
        currentPrice: variant.spotPriceEstimate,
        minPrice: Math.round(variant.spotPriceEstimate * 0.92),
        maxPrice: Math.round(variant.spotPriceEstimate * 1.12),
        changePercent: 0,
        trend: 'stable',
        trendReason: `Parsed from verified technical data sheet (${extractedData.brandName})`,
        location: 'Pan-India Distribution / National Catalog',
        updatedAt: new Date().toISOString(),
        marketNotes: `${variant.recommendedUse}. Theoretical Coverage: ${variant.coveragePerUnit}. Compliant with ${extractedData.isCodeStandards.join(', ')}.`,
      })
    );

    // Save to local storage for persistence across reloads
    try {
      const existing = localStorage.getItem('gouse_ai_custom_material_standards');
      const list = existing ? JSON.parse(existing) : [];
      list.unshift({
        extractedAt: new Date().toISOString(),
        ...extractedData,
      });
      localStorage.setItem('gouse_ai_custom_material_standards', JSON.stringify(list));
    } catch (_e) {}

    onApplyStandards(extractedData, generatedLivePrices);
    onClose();
  };

  const handleCopySummary = () => {
    if (!extractedData) return;
    const textToCopy = `MATERIAL SPECIFICATION SHEET: ${extractedData.brandName}
Category: ${extractedData.category}
IS Codes: ${extractedData.isCodeStandards.join(', ')}

VARIANTS & COVERAGE:
${extractedData.productVariants
  .map(
    (v) =>
      `• ${v.name}: Rate ₹${v.spotPriceEstimate}/${v.unit} | Coverage: ${v.coveragePerUnit} | ${v.recommendedUse}`
  )
  .join('\n')}

GUIDELINES:
${extractedData.applicationGuidelines.join('\n')}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="modal-pdf-material-updater-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <div
        id="modal-pdf-material-updater"
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-100">
                  Update Material & Standards from PDF / Technical Datasheet
                </h2>
                <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                  Birla OPS & OPC Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Upload or paste Technical Datasheets (TDS), brochures, or IS code specifications to auto-update the Master Catalog.
              </p>
            </div>
          </div>
          <button
            id="btn-close-pdf-modal"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Preset Bar */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>Quick Spec Presets:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="btn-preset-birla-opus"
                  onClick={handlePresetBirlaOpus}
                  type="button"
                  className="flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-300 hover:bg-purple-500/20 hover:border-purple-500/50 transition-colors"
                >
                  <Droplets className="h-3.5 w-3.5" />
                  <span>Birla Opus (OPS) Paints TDS</span>
                </button>
                <button
                  id="btn-preset-birla-opc"
                  onClick={handlePresetBirlaOPC}
                  type="button"
                  className="flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-300 hover:bg-sky-500/20 hover:border-sky-500/50 transition-colors"
                >
                  <HardHat className="h-3.5 w-3.5" />
                  <span>Birla A1 / UltraTech OPC 53 Grade TDS</span>
                </button>
              </div>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div
            id="dropzone-pdf-materials"
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all ${
              isDragOver
                ? 'border-amber-400 bg-amber-500/10'
                : 'border-slate-700 bg-slate-950/40 hover:border-slate-600 hover:bg-slate-950/80'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.docx,.csv"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileChange(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-amber-400">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">
                  {selectedFile ? (
                    <span className="text-amber-300 font-semibold">{selectedFile.name} (Ready to parse)</span>
                  ) : (
                    <span>Click or drag and drop your Birla Opus / OPC specification PDF here</span>
                  )}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports .pdf, .txt, .csv (TDS Technical Data Sheets, Mill Test Certificates, Manufacturer Brochures)
                </p>
              </div>
            </div>
          </div>

          {/* Raw Text Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Or Paste Technical Specifications Text Directly:
              </label>
              {rawText && (
                <button
                  type="button"
                  onClick={() => setRawText('')}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Clear
                </button>
              )}
            </div>
            <textarea
              id="textarea-pdf-spec-content"
              rows={5}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste manufacturer product descriptions, IS code conformance, theoretical coverage, variants, and pricing here..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Action Trigger */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400">
              {errorMsg ? (
                <span className="text-rose-400 font-medium flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errorMsg}
                </span>
              ) : (
                <span>AI extraction structures variants, coverage norms, and Indian IS codes automatically.</span>
              )}
            </div>
            <button
              id="btn-parse-pdf-specs"
              onClick={handleExtract}
              disabled={isExtracting}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-medium text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400 disabled:opacity-50 transition-colors"
            >
              {isExtracting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                  <span>Extracting with Gemini AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Parse & Ingest PDF Standards</span>
                </>
              )}
            </button>
          </div>

          {/* Extracted Data View */}
          {extractedData && (
            <div className="space-y-4 rounded-xl border border-slate-700 bg-slate-950/80 p-5">
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-300">
                      {extractedData.category}
                    </span>
                    <h3 className="text-base font-semibold text-slate-100">
                      {extractedData.brandName}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Parent: {extractedData.parentCompany} • {extractedData.subCategory || 'Market Leader'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Specs'}</span>
                </button>
              </div>

              {/* IS Codes & Standards */}
              <div>
                <div className="text-xs font-medium text-slate-400 mb-1.5">Conforming BIS Standards & Certifications:</div>
                <div className="flex flex-wrap gap-1.5">
                  {extractedData.isCodeStandards.map((code, idx) => (
                    <span
                      key={idx}
                      className="rounded-md border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-300"
                    >
                      {code}
                    </span>
                  ))}
                </div>
              </div>

              {/* Technical Description */}
              <p className="text-xs leading-relaxed text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                {extractedData.technicalDescription}
              </p>

              {/* Product Variants Table */}
              <div>
                <div className="text-xs font-medium text-slate-400 mb-2">Extracted Product Variants & Coverage Benchmarks:</div>
                <div className="overflow-x-auto rounded-lg border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-800 bg-slate-900 text-slate-400">
                      <tr>
                        <th className="px-3 py-2 font-medium">Variant Name</th>
                        <th className="px-3 py-2 font-medium">Type</th>
                        <th className="px-3 py-2 font-medium">Coverage Norm</th>
                        <th className="px-3 py-2 font-medium">Spot Benchmark</th>
                        <th className="px-3 py-2 font-medium">Application</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {extractedData.productVariants.map((v, i) => (
                        <tr key={i} className="hover:bg-slate-900/40">
                          <td className="px-3 py-2.5 font-semibold text-slate-200">{v.name}</td>
                          <td className="px-3 py-2.5 text-slate-400">{v.type}</td>
                          <td className="px-3 py-2.5 text-emerald-400 font-medium">{v.coveragePerUnit}</td>
                          <td className="px-3 py-2.5 text-amber-400 font-semibold">₹ {v.spotPriceEstimate} / {v.unit}</td>
                          <td className="px-3 py-2.5 text-slate-300">{v.recommendedUse}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Guidelines */}
              {extractedData.applicationGuidelines && extractedData.applicationGuidelines.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-slate-400 mb-1">Application & Curing Guidelines:</div>
                  <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                    {extractedData.applicationGuidelines.map((guide, idx) => (
                      <li key={idx}>{guide}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Apply Button */}
              <div className="pt-2">
                <button
                  id="btn-apply-pdf-specs-to-materials"
                  onClick={handleApply}
                  type="button"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-colors"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Apply & Update Material & Standards Master Catalog</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
