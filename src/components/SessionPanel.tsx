import React, { useState, useEffect } from 'react';
import { focusRing } from '@/lib/focus';
import { serializeSession, deserializeSession } from '../sequencer/session';
import { downloadBlob } from '../audio/downloadBlob';
import type { Session } from '../sequencer/types';

interface SessionPanelProps {
  session: Session;
  onChangeSession: (session: Session) => void;
  crossfadeMs: number;
  onCrossfadeMsChange: (ms: number) => void;
}

const STORAGE_KEY = 'anahata.sessions';

const loadSessions = (): Session[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Each saved entry is a serialized session; corrupt entries are skipped.
    return parsed
      .filter((entry): entry is string => typeof entry === 'string')
      .map((entry) => {
        try {
          return deserializeSession(entry);
        } catch {
          return null;
        }
      })
      .filter((session): session is Session => session !== null);
  } catch {
    return [];
  }
};

const saveSessions = (sessions: Session[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.map(serializeSession)));
};

const SessionPanel: React.FC<SessionPanelProps> = ({ session, onChangeSession, crossfadeMs, onCrossfadeMsChange }) => {
  const [name, setName] = useState(session.name);
  const [savedList, setSavedList] = useState<Session[]>(loadSessions);
  const [error, setError] = useState('');

  // Track the session identity as it changes (restore on mount, load, import).
  // Typing only touches local state, so this never clobbers the input.
  useEffect(() => {
    setName(session.name);
  }, [session.name]);

  const handleSave = () => {
    setError('');
    const toSave = { ...session, name };
    const existing = savedList.findIndex((s) => s.id === toSave.id);
    const next = existing >= 0
      ? savedList.map((s, i) => (i === existing ? toSave : s))
      : [...savedList, toSave];
    saveSessions(next);
    setSavedList(next);
    onChangeSession(toSave);
  };

  const handleLoad = (s: Session) => {
    setError('');
    onChangeSession(s);
    setName(s.name);
  };

  const handleDelete = (id: string) => {
    const next = savedList.filter((s) => s.id !== id);
    saveSessions(next);
    setSavedList(next);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `${session.name || 'session'}.json`);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = deserializeSession(reader.result as string);
        onChangeSession(imported);
        setName(imported.name);
      } catch {
        setError('Invalid session file: not a valid Anahata session');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-300">Session</h3>
      <div className="flex items-center gap-2">
        <input
          value={name}
          aria-label="Session name"
          onChange={(e) => setName(e.target.value)}
          className="bg-gray-700 rounded px-3 py-1 text-sm flex-1"
          placeholder="Session name"
        />
        <button onClick={handleSave} className={`px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm text-white ${focusRing} focus-visible:ring-blue-400`}>
          Save
        </button>
        <button onClick={handleExport} className={`px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm text-white ${focusRing} focus-visible:ring-white`}>
          Export
        </button>
        <label className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm text-white cursor-pointer focus-within:ring-2 focus-within:ring-white focus-within:ring-offset-2">
          Import
          <input type="file" accept=".json" onChange={handleImport} className="sr-only" />
        </label>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <label className="text-gray-400">Crossfade</label>
        <input
          type="number"
          min={0}
          max={2000}
          step={50}
          value={crossfadeMs}
          onChange={(e) => onCrossfadeMsChange(Number(e.target.value))}
          className="bg-gray-700 rounded px-2 py-1 w-20 text-sm"
        />
        <span className="text-gray-500">ms</span>
      </div>
      {error && <p className="text-red-400 text-xs" role="alert">{error}</p>}
      {savedList.length > 0 && (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {savedList.map((s) => (
            <div key={s.id} className="flex items-center gap-2 text-sm">
              <button onClick={() => handleLoad(s)} className={`flex-1 text-left hover:text-blue-400 truncate text-gray-300 rounded px-1 ${focusRing} focus-visible:ring-white`}>
                {s.name}
              </button>
              <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-300 text-xs">
                Del
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SessionPanel;
