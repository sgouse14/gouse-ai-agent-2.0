import React, { useState } from 'react';
import { BuildingFloor } from '../types';
import { Layers, Plus, Trash2, X, Check, Building, AlertTriangle } from 'lucide-react';

interface BuildingFloorManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  floors: BuildingFloor[];
  onSaveFloors: (newFloors: BuildingFloor[]) => void;
}

export const BuildingFloorManagerModal: React.FC<BuildingFloorManagerModalProps> = ({
  isOpen,
  onClose,
  floors,
  onSaveFloors,
}) => {
  const [localFloors, setLocalFloors] = useState<BuildingFloor[]>(floors);
  const [newFloorName, setNewFloorName] = useState('');
  const [newFloorCode, setNewFloorCode] = useState('');
  const [newFloorElevation, setNewFloorElevation] = useState('+12.00m');
  const [newFloorArea, setNewFloorArea] = useState<number>(1000);
  const [newFloorDesc, setNewFloorDesc] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const totalArea = localFloors.reduce((sum, f) => sum + (Number(f.areaSqFt) || 0), 0);

  const handleUpdateFloor = (id: string, field: keyof BuildingFloor, val: any) => {
    setLocalFloors((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          return { ...f, [field]: field === 'areaSqFt' ? Number(val) || 0 : val };
        }
        return f;
      })
    );
  };

  const handleDeleteFloor = (id: string) => {
    if (localFloors.length <= 1) {
      setErrorMsg('A building must have at least one level.');
      return;
    }
    setErrorMsg('');
    setLocalFloors((prev) => prev.filter((f) => f.id !== id));
  };

  const handleAddFloor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFloorName.trim()) {
      setErrorMsg('Please enter a level / floor name.');
      return;
    }
    const cleanId = `floor_${Date.now().toString(36)}`;
    const shortCode = newFloorCode.trim() || `L${localFloors.length}`;

    const newFloor: BuildingFloor = {
      id: cleanId,
      name: newFloorName.trim(),
      shortCode: shortCode.toUpperCase(),
      levelIndex: localFloors.length,
      elevation: newFloorElevation.trim() || '±0.00m',
      areaSqFt: Number(newFloorArea) || 1000,
      description: newFloorDesc.trim() || undefined,
    };

    setLocalFloors((prev) => [...prev, newFloor]);
    setNewFloorName('');
    setNewFloorCode('');
    setNewFloorDesc('');
    setErrorMsg('');
  };

  const handleSave = () => {
    if (localFloors.length === 0) {
      setErrorMsg('At least one building floor is required.');
      return;
    }
    onSaveFloors(localFloors);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Configure Building Levels & Floor Areas
              </h2>
              <p className="text-xs text-slate-400">
                Define vertical building levels, elevations, and built-up slab areas
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

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Current Levels Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>EXISTING BUILDING LEVELS ({localFloors.length})</span>
              <span>
                Total Built-Up Area:{' '}
                <strong className="text-amber-400 font-bold">{totalArea.toLocaleString()} sq.ft</strong>
              </span>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 font-mono text-[11px] text-slate-400">
                    <th className="py-2.5 px-3 w-16 text-center">Code</th>
                    <th className="py-2.5 px-3 min-w-[180px]">Floor Name</th>
                    <th className="py-2.5 px-3 w-28">Elevation</th>
                    <th className="py-2.5 px-3 w-32 text-right">Slab Area (sq.ft)</th>
                    <th className="py-2.5 px-3 min-w-[160px]">Description</th>
                    <th className="py-2.5 px-2 w-12 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {localFloors.map((floor) => (
                    <tr key={floor.id} className="hover:bg-slate-800/30">
                      <td className="py-2 px-2 text-center">
                        <input
                          type="text"
                          value={floor.shortCode}
                          onChange={(e) => handleUpdateFloor(floor.id, 'shortCode', e.target.value)}
                          className="w-12 bg-slate-900 border border-slate-700/80 rounded px-1.5 py-1 text-center font-mono font-bold text-amber-400 text-xs focus:outline-none focus:border-amber-500 uppercase"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={floor.name}
                          onChange={(e) => handleUpdateFloor(floor.id, 'name', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-xs text-slate-100 font-medium focus:outline-none focus:border-amber-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={floor.elevation}
                          onChange={(e) => handleUpdateFloor(floor.id, 'elevation', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-xs font-mono text-slate-300 focus:outline-none focus:border-amber-500"
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <input
                          type="number"
                          value={floor.areaSqFt}
                          onChange={(e) => handleUpdateFloor(floor.id, 'areaSqFt', e.target.value)}
                          className="w-24 bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-right font-mono text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={floor.description || ''}
                          onChange={(e) => handleUpdateFloor(floor.id, 'description', e.target.value)}
                          placeholder="e.g. Living, dining, bedrooms..."
                          className="w-full bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteFloor(floor.id)}
                          className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition"
                          title="Delete floor level"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add New Floor Level Form */}
          <form
            onSubmit={handleAddFloor}
            className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Add New Level / Elevation to Building</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Floor Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Third Floor (Level 3)"
                  value={newFloorName}
                  onChange={(e) => setNewFloorName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Short Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. 3F"
                  value={newFloorCode}
                  onChange={(e) => setNewFloorCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono uppercase text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Elevation
                </label>
                <input
                  type="text"
                  placeholder="e.g. +9.90m"
                  value={newFloorElevation}
                  onChange={(e) => setNewFloorElevation(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Slab Area (sq.ft)
                </label>
                <input
                  type="number"
                  placeholder="1000"
                  value={newFloorArea}
                  onChange={(e) => setNewFloorArea(Number(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Description / Typical Architectural Program
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Master suite, studio, terrace garden..."
                  value={newFloorDesc}
                  onChange={(e) => setNewFloorDesc(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold rounded-lg text-xs border border-amber-500/30 transition shrink-0"
                >
                  Add Level
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            {localFloors.length} levels configured • {totalArea.toLocaleString()} total sq.ft
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              type="button"
              id="btn-save-building-floors"
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm"
            >
              Save Building Levels
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
