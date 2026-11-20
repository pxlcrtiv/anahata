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

const loadSessions = (): { sessions: Session[]; skipped: number } => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { sessions: [], skipped: 0 };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { sessions: [], skipped: 0 };
    // Each saved entry is a serialized session; corrupt entries are
    // counted so the UI can say so instead of dropping them silently.
    const sessions: Session[] = [];
    let skipped = 0;
    for (const entry of parsed) {
      if (typeof entry !== 'string') {
        skipped += 1;
        continue;
      }
      try {
        sessions.push(deserializeSession(entry));
      } catch {
        skipped += 1;
      }
    }
    return { sessions, skipped };
  } catch {
    return { sessions: [], skipped: 0 };
  }
};

const saveSessions = (sessions: Session[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.map(serializeSession)));
};

const SessionPanel: React.FC<SessionPanelProps> = ({ session, onChangeSession, crossfadeMs, onCrossfadeMsChange }) => {
  const [name, setName] = useState(session.name);
  const [saved, setSaved] = useState(loadSessions);
  const [error, setError] = useState('');

  // Track the session identity as it changes (restore on mount, load, import).
  // Typing only touches local state, so this never clobbers the input.
  useEffect(() => {
    setName(session.name);
  }, [session.name]);

  const handleSave = () => {
    setError('');
    const toSave = { ...session, name };
    const existing = saved.sessions.findIndex((s) => s.id === toSave.id);
    const next = existing >= 0
      ? saved.sessions.map((s, i) => (i === existing ? toSave : s))
      : [...saved.sessions, toSave];
    saveSessions(next);
    setSaved({ sessions: next, skipped: saved.skipped });
    onChangeSession(toSave);
  };

  const handleLoad = (s: Session) => {
    setError('');
    onChangeSession(s);
    setName(s.name);
  };

  const handleDelete = (id: string) => {
    const next = saved.sessions.filter((s) => s.id !== id);
    saveSessions(next);
    setSaved({ sessions: next, skipped: saved.skipped });
  };

  const handleExport = () => {
    // Routed through the canonical serializer, then pretty-printed for humans.
    const blob = new Blob([JSON.stringify(JSON.parse(serializeSession(session)), null, 2)], { type: 'application/json' });
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
      {saved.skipped > 0 && (
        <p className="text-amber-400 text-xs" role="status">
          {saved.skipped} saved {saved.skipped === 1 ? 'entry was' : 'entries were'} invalid and skipped
        </p>
      )}
      {saved.sessions.length > 0 && (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {saved.sessions.map((s) => (
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
