import React, { useState } from 'react';
import type { Session } from '../sequencer/types';

interface SessionPanelProps {
  session: Session;
  onChangeSession: (session: Session) => void;
}

const STORAGE_KEY = 'anahata.sessions';

const loadSessions = (): Session[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveSessions = (sessions: Session[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
};

const SessionPanel: React.FC<SessionPanelProps> = ({ session, onChangeSession }) => {
  const [name, setName] = useState(session.name);
  const [savedList, setSavedList] = useState<Session[]>(loadSessions);

  const handleSave = () => {
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
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.name || 'session'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result as string) as Session;
        onChangeSession(imported);
        setName(imported.name);
      } catch {
        alert('Invalid JSON file');
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
          onChange={(e) => setName(e.target.value)}
          className="bg-gray-700 rounded px-3 py-1 text-sm flex-1"
          placeholder="Session name"
        />
        <button onClick={handleSave} className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm text-white">
          Save
        </button>
        <button onClick={handleExport} className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm">
          Export
        </button>
        <label className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm cursor-pointer">
          Import
          <input type="file" accept=".json" onChange={handleImport} className="hidden" />
        </label>
      </div>
      {savedList.length > 0 && (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {savedList.map((s) => (
            <div key={s.id} className="flex items-center gap-2 text-sm">
              <button onClick={() => handleLoad(s)} className="flex-1 text-left hover:text-blue-400 truncate">
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
