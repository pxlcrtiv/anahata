import { useState, useCallback } from 'react';

export interface Preset {
  id: string;
  name: string;
  freq: number;
  desc: string;
  color: string;
}

export const DEFAULT_PRESETS: Preset[] = [
  { id: 'solfeggio', name: 'Solfeggio', freq: 528, desc: 'Love & Healing', color: 'from-green-500 to-emerald-600' },
  { id: 'earth-tone', name: 'Earth Tone', freq: 432, desc: 'Natural Harmony', color: 'from-blue-500 to-cyan-600' },
  { id: 'crown-chakra', name: 'Crown Chakra', freq: 963, desc: 'Spiritual Connection', color: 'from-purple-500 to-violet-600' },
  { id: 'ce5-contact', name: 'CE5 Contact', freq: 1111, desc: 'ET Communication', color: 'from-yellow-500 to-orange-600' },
  { id: 'alpha-waves', name: 'Alpha Waves', freq: 10, desc: 'Relaxation', color: 'from-indigo-500 to-purple-600' },
  { id: 'theta-waves', name: 'Theta Waves', freq: 6, desc: 'Deep Meditation', color: 'from-pink-500 to-rose-600' },
];

export const STORAGE_KEY = 'anahata.presets';

export function serializePresets(presets: Preset[]): string {
  return JSON.stringify(presets);
}

export function deserializePresets(json: string): Preset[] {
  const parsed = JSON.parse(json);
  if (!Array.isArray(parsed)) {
    throw new Error('Invalid presets JSON: expected array');
  }
  for (const item of parsed) {
    if (
      typeof item !== 'object' || item === null ||
      typeof item.id !== 'string' ||
      typeof item.name !== 'string' ||
      typeof item.freq !== 'number' ||
      typeof item.desc !== 'string' ||
      typeof item.color !== 'string'
    ) {
      throw new Error('Invalid preset: missing required fields');
    }
  }
  return parsed as Preset[];
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function loadFromStorage(storageKey: string): Preset[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw === null) return DEFAULT_PRESETS;
    return deserializePresets(raw);
  } catch {
    return DEFAULT_PRESETS;
  }
}

function saveToStorage(storageKey: string, presets: Preset[]): void {
  localStorage.setItem(storageKey, serializePresets(presets));
}

export function validateFrequency(freq: number): boolean {
  return Number.isFinite(freq) && freq >= 1 && freq <= 20000;
}

export function usePresetLibrary(storageKey: string = STORAGE_KEY) {
  const [presets, setPresets] = useState<Preset[]>(() => loadFromStorage(storageKey));

  const persist = useCallback((next: Preset[]) => {
    saveToStorage(storageKey, next);
    setPresets(next);
  }, [storageKey]);

  const addPreset = useCallback((input: Omit<Preset, 'id'>) => {
    const newPreset: Preset = { ...input, id: generateId() };
    persist([...presets, newPreset]);
    return newPreset;
  }, [presets, persist]);

  const updatePreset = useCallback((id: string, changes: Partial<Omit<Preset, 'id'>>) => {
    persist(presets.map(p => p.id === id ? { ...p, ...changes } : p));
  }, [presets, persist]);

  const deletePreset = useCallback((id: string) => {
    persist(presets.filter(p => p.id !== id));
  }, [presets, persist]);

  return { presets, addPreset, updatePreset, deletePreset };
}
