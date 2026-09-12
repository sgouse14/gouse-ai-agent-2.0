import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  CheckSquare,
  Leaf,
  Flame,
  Clock,
  Coins,
  Copy,
  Check,
  Building,
  Camera,
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import { MATERIAL_CATALOG, BUILDING_TYPOLOGY_CHECKLISTS } from '../data/initialData';
import { Project } from '../types';
import { formatCurrency, CurrencyCode } from '../utils/formatters';

interface MaterialsViewProps {
  activeProject: Project;
  currency: CurrencyCode;
}

export const MaterialsView: React.FC<MaterialsViewProps> = ({ activeProject, currency }) => {
  const [activeSection, setActiveSection] = useState<'comparison' | 'checklists' | 'render'>('comparison');

  // Comparison filter
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Interactive Material Calculator
  const [calcMaterialId, setCalcMaterialId] = useState<string>(MATERIAL_CATALOG[0].id);
  const [calcQuantity, setCalcQuantity] = useState<number>(100);

  // Checklists state
  const typologies = Object.keys(BUILDING_TYPOLOGY_CHECKLISTS);
  const [selectedTypology, setSelectedTypology] = useState<string>(typologies[0]);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Render Prompt Studio state
  const [renderDesc, setRenderDesc] = useState(
    activeProject.description || 'Tropical contemporary residence with courtyard, exposed board-marked concrete, and teak louvers'
  );
  const [renderStyle, setRenderStyle] = useState('photorealistic');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Material calculation
  const calcMaterial = MATERIAL_CATALOG.find((m) => m.id === calcMaterialId) || MATERIAL_CATALOG[0];
  const totalCost = calcQuantity * calcMaterial.estimatedRate;
  const totalCarbon = calcQuantity * calcMaterial.embodiedCarbonKg;

  const currentChecklist = BUILDING_TYPOLOGY_CHECKLISTS[selectedTypology] || [];
  const checkedCount = currentChecklist.filter((_, idx) => checkedItems[`${selectedTypology}-${idx}`]).length;
  const checklistProgress = currentChecklist.length > 0 ? Math.round((checkedCount / currentChecklist.length) * 100) : 0;

  const toggleCheck = (idx: number) => {
    const key = `${selectedTypology}-${idx}`;
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGenerateRenderPrompt = async () => {
    if (!renderDesc.trim()) return;
    setIsGeneratingPrompt(true);

    try {
      const res = await fetch('/api/architecture/render-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: renderDesc,
          style: renderStyle,
        }),
      });
      const data = await res.json();
      setGeneratedPrompt(data.prompt);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleCopyPrompt = () => {
    if (!generatedPrompt) return;
    navigator.clipboard.writeText(generatedPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const filteredMaterials =
    selectedCategory === 'all'
      ? MATERIAL_CATALOG
      : MATERIAL_CATALOG.filter((m) => m.category === selectedCategory);

  return (
    <div id="materials-standards-view" className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Building Science & Specifications
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
            Materials, Typology Checklists & Visual Studio
          </h2>
          <p className="text-xs text-slate-400">
            Material lifecycle comparison, regulatory building checklists, and architectural rendering prompts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSection('comparison')}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
              activeSection === 'comparison'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Material Matrix
          </button>
          <button
            onClick={() => setActiveSection('checklists')}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
              activeSection === 'checklists'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Typology Checklists
          </button>
          <button
            onClick={() => setActiveSection('render')}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
              activeSection === 'render'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            3D Render Prompt Studio
          </button>
        </div>
      </div>

      {/* Section 1: Material Comparison Matrix & Carbon Calculator */}
      {activeSection === 'comparison' && (
        <div className="space-y-6">
          {/* Quick interactive estimator widget */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div>
              <span className="text-xs text-slate-400 font-mono">Select Material:</span>
              <select
                value={calcMaterialId}
                onChange={(e) => setCalcMaterialId(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {MATERIAL_CATALOG.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-xs text-slate-400 font-mono">Quantity ({calcMaterial.unit}):</span>
              <input
                type="number"
                min={1}
                value={calcQuantity}
                onChange={(e) => setCalcQuantity(Math.max(1, Number(e.target.value) || 1))}
                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-mono">Estimated Material Cost:</span>
              <p className="text-lg font-bold font-mono text-amber-400">
                {formatCurrency(totalCost, currency)}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                <Leaf className="w-3 h-3 text-emerald-400" />
                Embodied Carbon Footprint:
              </span>
              <p className="text-lg font-bold font-mono text-emerald-400">
                {totalCarbon.toLocaleString()} kg CO₂e
              </p>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMaterials.map((mat) => (
              <div
                key={mat.id}
                className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {mat.category}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-1.5">{mat.name}</h4>
                    </div>
                  </div>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400">Rate:</span>
                      <p className="font-bold text-amber-400">
                        {formatCurrency(mat.estimatedRate, currency)} / {mat.unit}
                      </p>
                    </div>

                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400">Embodied Carbon:</span>
                      <p className="font-bold text-emerald-400">
                        {mat.embodiedCarbonKg} kg CO₂e
                      </p>
                    </div>

                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400">Durability:</span>
                      <p className="font-bold text-slate-200">
                        {mat.durabilityYears} Years
                      </p>
                    </div>

                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400">Thermal U-Value:</span>
                      <p className="font-bold text-sky-400">
                        {mat.uValue} W/m²K
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400">Optimal Architectural Use:</span>
                    <p className="text-xs text-slate-300 italic">{mat.bestUse}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-emerald-400">Key Advantages:</span>
                    <ul className="text-[11px] text-slate-300 space-y-0.5 list-disc list-inside">
                      {mat.pros.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Fire Rating: {mat.fireRating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 2: Building Typology Checklists */}
      {activeSection === 'checklists' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {typologies.map((typ) => (
                <button
                  key={typ}
                  onClick={() => setSelectedTypology(typ)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                    selectedTypology === typ
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {typ}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono">
              <span className="text-slate-400">Progress:</span>
              <span className="text-amber-400 font-bold">{checkedCount} / {currentChecklist.length}</span>
              <span className="text-slate-400">({checklistProgress}%)</span>
            </div>
          </div>

          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="bg-amber-400 h-full transition-all duration-300"
              style={{ width: `${checklistProgress}%` }}
            />
          </div>

          <div className="rounded-xl bg-slate-900 border border-slate-800 divide-y divide-slate-800/80">
            {currentChecklist.map((item, idx) => {
              const isChecked = !!checkedItems[`${selectedTypology}-${idx}`];
              return (
                <div
                  key={idx}
                  onClick={() => toggleCheck(idx)}
                  className={`p-4 flex items-start gap-3.5 cursor-pointer transition ${
                    isChecked ? 'bg-amber-500/5' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className={`mt-0.5 rounded border p-0.5 ${isChecked ? 'bg-amber-500 border-amber-500 text-slate-950' : 'border-slate-700 bg-slate-950'}`}>
                    <Check className={`w-3.5 h-3.5 ${isChecked ? 'opacity-100' : 'opacity-0'}`} />
                  </div>
                  <div className="flex-1">
                    <span className={`text-xs ${isChecked ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                      {item}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section 3: 3D Render Prompt Studio */}
      {activeSection === 'render' && (
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 max-w-3xl mx-auto space-y-5">
          <div>
            <h3 className="text-base font-bold text-white font-serif-classic flex items-center gap-2">
              <Camera className="w-5 h-5 text-amber-400" />
              Architectural Visualization & Render Prompt Studio
            </h3>
            <p className="text-xs text-slate-400">
              Generate detailed, photorealistic visual prompts for generative architectural AI tools (Midjourney, DALL-E 3, Imagen, Stable Diffusion).
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-300 mb-1">Architectural Brief / Concept Description</label>
              <textarea
                rows={3}
                value={renderDesc}
                onChange={(e) => setRenderDesc(e.target.value)}
                placeholder="Describe spatial massing, materials, exterior context, lighting, and mood..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Visual Render Style</label>
                <select
                  value={renderStyle}
                  onChange={(e) => setRenderStyle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="photorealistic architectural photography">Photorealistic Architectural Photography (Golden Hour)</option>
                  <option value="dramatic twilight exterior with interior warm cove lighting">Twilight Cinematic Architectural Lighting</option>
                  <option value="blueprint technical CAD draft with axonometric exploded isometric">Technical Blueprint & Axonometric CAD</option>
                  <option value="minimalist charcoal sketch with watercolor wash">Minimalist Charcoal & Watercolor Wash</option>
                  <option value="Scandinavian warm timber and board-formed concrete pavilion">Scandinavian Warm Timber & Biophilic Concrete</option>
                  <option value="contemporary parametric double-skin glass curtain wall">Contemporary Parametric High-Rise</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  id="btn-generate-render-prompt"
                  onClick={handleGenerateRenderPrompt}
                  disabled={isGeneratingPrompt}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${isGeneratingPrompt ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingPrompt ? 'Synthesizing Prompt...' : 'Generate Render Prompt'}</span>
                </button>
              </div>
            </div>

            {generatedPrompt && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider font-mono">
                    Ready-to-Use Visualization Prompt
                  </span>
                  <button
                    onClick={handleCopyPrompt}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedPrompt ? 'Copied to Clipboard' : 'Copy Prompt'}</span>
                  </button>
                </div>

                <p className="text-xs text-slate-300 font-mono leading-relaxed bg-slate-900 p-3 rounded-lg border border-slate-800 select-all">
                  {generatedPrompt}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
