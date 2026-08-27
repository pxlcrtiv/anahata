
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePresetLibrary, validateFrequency } from '@/hooks/usePresetLibrary';

interface FrequencyPresetsProps {
  onFrequencySelect: (frequency: number) => void;
}

interface FormData {
  name: string;
  freq: string;
  desc: string;
}

const emptyForm: FormData = { name: '', freq: '', desc: '' };

const FrequencyPresets: React.FC<FrequencyPresetsProps> = ({ onFrequencySelect }) => {
  const { presets, addPreset, updatePreset, deletePreset } = usePresetLibrary();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [error, setError] = useState('');

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const handleAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError('');
  };

  const handleEditStart = (id: string) => {
    const preset = presets.find(p => p.id === id);
    if (!preset) return;
    setEditingId(id);
    setForm({ name: preset.name, freq: String(preset.freq), desc: preset.desc });
    setShowForm(true);
    setError('');
  };

  const handleSubmit = () => {
    const freqNum = Number(form.freq);
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!validateFrequency(freqNum)) {
      setError('Frequency must be between 1 and 20000 Hz');
      return;
    }
    if (editingId) {
      updatePreset(editingId, { name: form.name.trim(), freq: freqNum, desc: form.desc.trim() });
    } else {
      const colors = [
        'from-green-500 to-emerald-600',
        'from-blue-500 to-cyan-600',
        'from-purple-500 to-violet-600',
        'from-yellow-500 to-orange-600',
        'from-indigo-500 to-purple-600',
        'from-pink-500 to-rose-600',
        'from-red-500 to-orange-600',
        'from-teal-500 to-cyan-600',
      ];
      addPreset({
        name: form.name.trim(),
        freq: freqNum,
        desc: form.desc.trim(),
        color: colors[presets.length % colors.length],
      });
    }
    resetForm();
  };

  const handleDelete = (id: string) => {
    deletePreset(id);
    if (editingId === id) resetForm();
  };

  return (
    <Card className="bg-black/60 backdrop-blur-sm border-gray-800">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-lg">Frequency Presets</h3>
          <Button variant="outline" size="sm" onClick={handleAdd} className="text-green-400 border-green-400/30 hover:bg-green-400/10">
            + Add Preset
          </Button>
        </div>

        {showForm && (
          <div className="mb-4 p-4 bg-white/5 rounded-lg border border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <input
                type="text"
                placeholder="Name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:border-green-400 focus:outline-none"
              />
              <input
                type="number"
                placeholder="Frequency (1-20000)"
                value={form.freq}
                onChange={e => setForm(f => ({ ...f, freq: e.target.value }))}
                className="px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:border-green-400 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={form.desc}
                onChange={e => setForm(f => ({ ...f, desc: e.target.value }))}
                className="px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:border-green-400 focus:outline-none"
              />
            </div>
            {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 text-white">
                {editingId ? 'Save' : 'Add'}
              </Button>
              <Button size="sm" variant="outline" onClick={resetForm} className="text-gray-400 border-gray-600">
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {presets.map((preset) => (
            <div key={preset.id} className="relative group">
              <Button
                onClick={() => onFrequencySelect(preset.freq)}
                variant="outline"
                className={`w-full h-auto p-4 bg-gradient-to-br ${preset.color} border-0 hover:scale-105 transition-all duration-200 text-white`}
              >
                <div className="text-center">
                  <div className="font-semibold text-sm">{preset.name}</div>
                  <div className="text-lg font-bold">{preset.freq}Hz</div>
                  <div className="text-xs opacity-90">{preset.desc}</div>
                </div>
              </Button>
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); handleEditStart(preset.id); }}
                  className="bg-black/60 hover:bg-black/80 text-white rounded px-1.5 py-0.5 text-xs"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(preset.id); }}
                  className="bg-red-900/60 hover:bg-red-900/80 text-white rounded px-1.5 py-0.5 text-xs"
                >
                  Del
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default FrequencyPresets;
