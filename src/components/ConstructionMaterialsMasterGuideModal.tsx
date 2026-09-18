import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  X,
  Search,
  Check,
  Building2,
  ShieldCheck,
  Sparkles,
  Layers,
  ArrowRight,
  ExternalLink,
  Award,
  Sliders,
  Filter,
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  Tag,
  Coins,
} from 'lucide-react';
import {
  CONSTRUCTION_MATERIALS_MASTER_GUIDE,
  MaterialGuideSection,
  MaterialGuideBrand,
} from '../data/constructionMaterialsGuide';

interface ConstructionMaterialsMasterGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetNormId?: string;
  targetMaterialName?: string;
  selectedBrandName?: string;
  onSelectBrand?: (brand: MaterialGuideBrand, section: MaterialGuideSection) => void;
}

export const ConstructionMaterialsMasterGuideModal: React.FC<ConstructionMaterialsMasterGuideModalProps> = ({
  isOpen,
  onClose,
  targetNormId,
  targetMaterialName,
  selectedBrandName,
  onSelectBrand,
}) => {
  const [selectedSectionId, setSelectedSectionId] = useState<string>(() => {
    if (targetNormId) {
      const match = CONSTRUCTION_MATERIALS_MASTER_GUIDE.find((sec) =>
        sec.applicableNormIds.includes(targetNormId)
      );
      if (match) return match.id;
    }
    return 'all';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<'all' | 'National' | 'Regional'>('all');
  const [selectedTrend, setSelectedTrend] = useState<'all' | 'up' | 'down' | 'stable'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc'>('default');

  // Filter sections and brands
  const filteredSections = useMemo(() => {
    return CONSTRUCTION_MATERIALS_MASTER_GUIDE.map((section) => {
      let brands = [...section.brands];

      if (selectedTier !== 'all') {
        brands = brands.filter((b) => b.category === selectedTier);
      }

      if (selectedTrend !== 'all') {
        brands = brands.filter((b) => b.trend === selectedTrend);
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        brands = brands.filter(
          (b) =>
            b.brandName.toLowerCase().includes(q) ||
            b.keyVariantsAndDescription.toLowerCase().includes(q) ||
            (b.recommendedUse && b.recommendedUse.toLowerCase().includes(q)) ||
            (b.isCodeRef && b.isCodeRef.toLowerCase().includes(q)) ||
            (b.marketHub && b.marketHub.toLowerCase().includes(q))
        );
      }

      if (sortBy === 'price_asc') {
        brands.sort((a, b) => a.spotPrice - b.spotPrice);
      } else if (sortBy === 'price_desc') {
        brands.sort((a, b) => b.spotPrice - a.spotPrice);
      }

      return {
        ...section,
        brands,
      };
    }).filter((section) => {
      const matchesSection = selectedSectionId === 'all' || section.id === selectedSectionId;
      return matchesSection && section.brands.length > 0;
    });
  }, [selectedSectionId, searchQuery, selectedTier, selectedTrend, sortBy]);

  if (!isOpen) return null;

  return (
    <div
      id="construction-materials-master-guide-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-950/90 border-b border-slate-800 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Construction Materials Master Guide</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                IS Code & Specification Standards
              </span>
              {targetMaterialName && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Assigning to: {targetMaterialName}
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Comprehensive Directory: Cement, Steel, Electricals, Plumbing, Tiles, Glass & Glazing, and Paints
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              National market leaders and regional specialist brands with certified product variants, ductility grades, and engineering use-cases.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Close Guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-3 sm:p-4 bg-slate-950/50 border-b border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search brand, variant, IS code, hub..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>

          {/* Filters & Sorting */}
          <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-end">
            {/* Origin */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedTier('all')}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono transition ${
                  selectedTier === 'all'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                All Origins
              </button>
              <button
                onClick={() => setSelectedTier('National')}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono transition ${
                  selectedTier === 'National'
                    ? 'bg-blue-500 text-white font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                National
              </button>
              <button
                onClick={() => setSelectedTier('Regional')}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono transition ${
                  selectedTier === 'Regional'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Regional
              </button>
            </div>

            {/* Trend Filter */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedTrend('all')}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono transition ${
                  selectedTrend === 'all'
                    ? 'bg-slate-700 text-white font-bold'
                    : 'bg-slate-850 text-slate-400 hover:bg-slate-800'
                }`}
              >
                All Trends
              </button>
              <button
                onClick={() => setSelectedTrend('up')}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono transition flex items-center gap-0.5 ${
                  selectedTrend === 'up'
                    ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50 font-bold'
                    : 'bg-slate-850 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <TrendingUp className="w-3 h-3 text-rose-400" />
                <span>Rising</span>
              </button>
              <button
                onClick={() => setSelectedTrend('down')}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono transition flex items-center gap-0.5 ${
                  selectedTrend === 'down'
                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 font-bold'
                    : 'bg-slate-850 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <TrendingDown className="w-3 h-3 text-emerald-400" />
                <span>Falling</span>
              </button>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[10px] font-mono text-slate-300 focus:outline-none focus:border-amber-400"
            >
              <option value="default">Sort: Default</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Category Navigation Pills */}
        <div className="px-3 sm:px-4 py-2 bg-slate-950/30 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedSectionId('all')}
            className={`px-3 py-1 rounded-lg text-xs font-mono whitespace-nowrap transition ${
              selectedSectionId === 'all'
                ? 'bg-slate-800 text-amber-300 font-bold border border-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            All 7 Categories
          </button>
          {CONSTRUCTION_MATERIALS_MASTER_GUIDE.map((section) => (
            <button
              key={section.id}
              onClick={() => setSelectedSectionId(section.id)}
              className={`px-3 py-1 rounded-lg text-xs font-mono whitespace-nowrap transition ${
                selectedSectionId === section.id
                  ? 'bg-slate-800 text-amber-300 font-bold border border-amber-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              {section.shortTitle}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {filteredSections.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-mono text-xs">
              No brands match your filter criteria. Try adjusting the search term or category filters.
            </div>
          ) : (
            filteredSections.map((section) => (
              <div
                key={section.id}
                className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4 shadow-sm"
              >
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs flex items-center justify-center font-mono">
                        {section.sectionNumber}
                      </span>
                      <span>{section.title}</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 font-mono">{section.description}</p>
                  </div>

                  {/* IS Code Tags */}
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {section.isCodeStandards.map((code, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-700/60 text-slate-300"
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Brands Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {section.brands.map((brand) => {
                    const isSelected =
                      selectedBrandName &&
                      (selectedBrandName.toLowerCase().includes(brand.brandName.toLowerCase()) ||
                        brand.brandName.toLowerCase().includes(selectedBrandName.toLowerCase()));

                    return (
                      <div
                        key={brand.id}
                        className={`p-3.5 rounded-xl border font-mono text-xs flex flex-col justify-between transition ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/50 shadow-md ring-1 ring-amber-500/40'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="font-bold text-white text-sm block">
                                {brand.brandName}
                              </span>
                              {brand.isCodeRef && (
                                <span className="text-[10px] text-slate-400">
                                  Spec: {brand.isCodeRef}
                                </span>
                              )}
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                brand.category === 'National'
                                  ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              }`}
                            >
                              {brand.category}
                            </span>
                          </div>

                          {/* Live Spot Market Price & Trend Panel */}
                          <div className="p-2.5 rounded-lg bg-slate-950/90 border border-amber-500/30">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <span className="text-[9px] uppercase font-bold text-slate-400 block">
                                  Live Spot Price
                                </span>
                                <div className="text-amber-300 font-bold text-sm sm:text-base flex items-baseline gap-1">
                                  <span>₹{brand.spotPrice.toLocaleString()}</span>
                                  <span className="text-[10px] text-slate-400 font-normal">/ {brand.unit}</span>
                                </div>
                              </div>

                              {/* Trend Badge */}
                              <div className="text-right">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                    brand.trend === 'up'
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                      : brand.trend === 'down'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                                  }`}
                                >
                                  {brand.trend === 'up' && <TrendingUp className="w-3 h-3 text-rose-400" />}
                                  {brand.trend === 'down' && <TrendingDown className="w-3 h-3 text-emerald-400" />}
                                  {brand.trend === 'stable' && <Minus className="w-3 h-3 text-slate-400" />}
                                  <span>
                                    {brand.changePercent > 0 ? `+${brand.changePercent}%` : brand.changePercent < 0 ? `${brand.changePercent}%` : 'Stable'}
                                  </span>
                                </span>
                                <span className="block text-[9px] text-slate-400 mt-0.5">
                                  📍 {brand.marketHub}
                                </span>
                              </div>
                            </div>

                            {/* Range & Reason */}
                            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 flex-wrap gap-1">
                              <span>Range: ₹{brand.minPrice.toLocaleString()} - ₹{brand.maxPrice.toLocaleString()}</span>
                              <span className="text-slate-500 truncate max-w-[200px]" title={brand.trendReason}>
                                {brand.trendReason}
                              </span>
                            </div>
                          </div>

                          {/* Key Variants & Description from PDF */}
                          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] text-slate-200">
                            <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">
                              Key Variants & Description:
                            </span>
                            {brand.keyVariantsAndDescription}
                          </div>

                          {/* Recommended Application */}
                          {brand.recommendedUse && (
                            <div className="text-[11px] text-slate-400">
                              <span className="text-amber-400/90 font-semibold">Recommended Use: </span>
                              {brand.recommendedUse}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        {onSelectBrand && (
                          <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between">
                            <span className="text-[10px] text-slate-500">
                              {isSelected ? 'Currently Selected Brand' : 'Click to apply brand'}
                            </span>
                            <button
                              onClick={() => {
                                onSelectBrand(brand, section);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-amber-500 text-slate-950'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white'
                              }`}
                            >
                              {isSelected ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Active Brand</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Apply Brand (₹{brand.spotPrice.toLocaleString()})</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}

          {/* Footer Note from PDF Page 3 */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono text-slate-400 space-y-1">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Specification Compliance & Procurement Advisory</span>
            </div>
            <p className="text-[11px]">
              Note: Specifications and availability vary based on regional distributor networks, project requirements, and technical grades. All structural reinforcement and binding materials must be accompanied by Manufacturer Batch Test Certificates (MTC) conforming to IS 456:2000 and SP 34 standards.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            <span>14 National Leaders</span>
            <span>•</span>
            <span>7 Regional Specialists</span>
            <span>•</span>
            <span>7 Construction Categories</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition text-xs font-bold"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
