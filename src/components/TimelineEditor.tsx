import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { focusRing } from '@/lib/focus';
import { BASELINE } from '../sequencer/evaluate';
import { WAVEFORMS } from '../sequencer/types';
import type { Session, SessionEvent, Waveform } from '../sequencer/types';

interface TimelineEditorProps {
  session: Session;
  positionMs: number;
  onChange: (session: Session) => void;
  onSeek: (ms: number) => void;
}

let nextId = 1;
const genId = () => `evt_${Date.now()}_${nextId++}`;

const TimelineEditor: React.FC<TimelineEditorProps> = ({
  session,
  positionMs,
  onChange,
  onSeek,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editTimeMs, setEditTimeMs] = useState('');
  const [editFreqL, setEditFreqL] = useState('');
  const [editFreqR, setEditFreqR] = useState('');
  const [editAmpL, setEditAmpL] = useState('');
  const [editAmpR, setEditAmpR] = useState('');
  const [editWaveL, setEditWaveL] = useState<Waveform | ''>('');
  const [editWaveR, setEditWaveR] = useState<Waveform | ''>('');
  const [editMasterVol, setEditMasterVol] = useState('');
  const [editRampMs, setEditRampMs] = useState('');

  const selected = session.events.find((e) => e.id === selectedId) ?? null;

  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = (e.clientX - rect.left) / rect.width;
    const ms = Math.round(fraction * session.durationMs);
    onSeek(ms);
  };

  const handleAddEvent = () => {
    const newEvent: SessionEvent = {
      id: genId(),
      timeMs: positionMs,
      left: { ...BASELINE.left },
      right: { ...BASELINE.right },
    };
    onChange({ ...session, events: [...session.events, newEvent].sort((a, b) => a.timeMs - b.timeMs) });
    setSelectedId(newEvent.id);
    loadEditFields(newEvent);
  };

  const loadEditFields = (evt: SessionEvent) => {
    setEditTimeMs(String(evt.timeMs));
    setEditFreqL(evt.left?.frequency !== undefined ? String(evt.left.frequency) : '');
    setEditFreqR(evt.right?.frequency !== undefined ? String(evt.right.frequency) : '');
    setEditAmpL(evt.left?.amplitude !== undefined ? String(evt.left.amplitude) : '');
    setEditAmpR(evt.right?.amplitude !== undefined ? String(evt.right.amplitude) : '');
    setEditWaveL(evt.left?.waveform ?? '');
    setEditWaveR(evt.right?.waveform ?? '');
    setEditMasterVol(evt.masterVolume !== undefined ? String(evt.masterVolume) : '');
    setEditRampMs(evt.rampMs !== undefined ? String(evt.rampMs) : '');
  };

  const handleSelectEvent = (evt: SessionEvent) => {
    setSelectedId(evt.id);
    loadEditFields(evt);
  };

  const handleSaveEdit = () => {
    if (!selectedId) return;
    const updated = session.events.map((evt) => {
      if (evt.id !== selectedId) return evt;
      const left: Partial<{ frequency: number; waveform: Waveform; amplitude: number }> = {};
      if (editFreqL !== '') left.frequency = Number(editFreqL);
      if (editAmpL !== '') left.amplitude = Number(editAmpL);
      if (editWaveL !== '') left.waveform = editWaveL;

      const right: Partial<{ frequency: number; waveform: Waveform; amplitude: number }> = {};
      if (editFreqR !== '') right.frequency = Number(editFreqR);
      if (editAmpR !== '') right.amplitude = Number(editAmpR);
      if (editWaveR !== '') right.waveform = editWaveR;

      return {
        ...evt,
        timeMs: Number(editTimeMs),
        left: Object.keys(left).length ? left : undefined,
        right: Object.keys(right).length ? right : undefined,
        masterVolume: editMasterVol !== '' ? Number(editMasterVol) : undefined,
        rampMs: editRampMs !== '' ? Number(editRampMs) : undefined,
      };
    });
    onChange({ ...session, events: updated.sort((a, b) => a.timeMs - b.timeMs) });
  };

  const handleDelete = () => {
    if (!selectedId) return;
    onChange({ ...session, events: session.events.filter((e) => e.id !== selectedId) });
    setSelectedId(null);
  };

  const rulerWidth = 100; // percent

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">Timeline</h3>
        <button onClick={handleAddEvent} className={`px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded inline-flex items-center gap-1 ${focusRing} focus-visible:ring-white`}>
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          Add Event
        </button>
      </div>

      {/* Ruler */}
      <div
        className="relative h-8 bg-gray-700 rounded cursor-crosshair"
        onClick={handleRulerClick}
      >
        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500"
          style={{ left: `${(positionMs / session.durationMs) * rulerWidth}%` }}
        />
        {/* Duration labels */}
        <span className="absolute left-1 top-0.5 text-xs text-gray-400">0</span>
        <span className="absolute right-1 top-0.5 text-xs text-gray-400">{session.durationMs}ms</span>
      </div>

      {/* Event tracks */}
      <div className="space-y-1">
        {session.events.map((evt) => {
          const left = (evt.left?.frequency ?? BASELINE.left.frequency);
          const pct = (evt.timeMs / session.durationMs) * 100;
          return (
            <div
              key={evt.id}
              className={`relative h-6 bg-gray-700 rounded cursor-pointer ${selectedId === evt.id ? 'ring-2 ring-blue-400' : ''}`}
              onClick={() => handleSelectEvent(evt)}
            >
              <div
                className="absolute top-0.5 bottom-0.5 w-auto min-w-4 px-1 bg-blue-500 rounded text-xs text-white flex items-center justify-center"
                style={{ left: `${pct}%` }}
                title={`${evt.timeMs}ms — L:${left}Hz`}
              >
                {evt.timeMs}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit panel */}
      {selected && (
        <div className="bg-gray-700 rounded p-3 space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <label className="text-gray-300 w-16">Time(ms)</label>
            <input aria-label="Event time (ms)" value={editTimeMs} onChange={(e) => setEditTimeMs(e.target.value)} className="bg-gray-700 rounded px-2 py-1 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-gray-300 w-16">L Freq</label>
            <input aria-label="Left frequency" value={editFreqL} onChange={(e) => setEditFreqL(e.target.value)} className="bg-gray-700 rounded px-2 py-1 w-24" />
            <label className="text-gray-300">Amp</label>
            <input aria-label="Left amplitude" value={editAmpL} onChange={(e) => setEditAmpL(e.target.value)} className="bg-gray-700 rounded px-2 py-1 w-16" />
            <select aria-label="Left waveform" value={editWaveL} onChange={(e) => setEditWaveL(e.target.value as Waveform | '')} className="bg-gray-700 rounded px-2 py-1">
              <option value="">(unchanged)</option>
              {WAVEFORMS.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-gray-300 w-16">R Freq</label>
            <input aria-label="Right frequency" value={editFreqR} onChange={(e) => setEditFreqR(e.target.value)} className="bg-gray-700 rounded px-2 py-1 w-24" />
            <label className="text-gray-300">Amp</label>
            <input aria-label="Right amplitude" value={editAmpR} onChange={(e) => setEditAmpR(e.target.value)} className="bg-gray-700 rounded px-2 py-1 w-16" />
            <select aria-label="Right waveform" value={editWaveR} onChange={(e) => setEditWaveR(e.target.value as Waveform | '')} className="bg-gray-700 rounded px-2 py-1">
              <option value="">(unchanged)</option>
              {WAVEFORMS.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-gray-300 w-16">Master</label>
            <input aria-label="Master volume" value={editMasterVol} onChange={(e) => setEditMasterVol(e.target.value)} className="bg-gray-700 rounded px-2 py-1 w-16" />
            <label className="text-gray-300">Ramp(ms)</label>
            <input aria-label="Ramp (ms)" value={editRampMs} onChange={(e) => setEditRampMs(e.target.value)} className="bg-gray-700 rounded px-2 py-1 w-16" />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleSaveEdit} className={`px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-white ${focusRing} focus-visible:ring-blue-400`}>Save</button>
            <button onClick={handleDelete} className={`px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-white ${focusRing} focus-visible:ring-red-400`}>Delete</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineEditor;
