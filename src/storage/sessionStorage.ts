import { serializeSession, deserializeSession } from '../sequencer/session';
import type { Session, ChannelState } from '../sequencer/types';
import { WAVEFORMS } from '../sequencer/types';

export const AUTOSAVE_KEY = 'anahata.autosave';

export interface StoredSettings {
  left: ChannelState;
  right: ChannelState;
  linked: boolean;
  masterVolume: number;
  crossfadeMs: number;
}

function isChannelState(value: unknown): value is ChannelState {
  if (typeof value !== 'object' || value === null) return false;
  const channel = value as ChannelState;
  return (
    typeof channel.frequency === 'number' &&
    Number.isFinite(channel.frequency) &&
    WAVEFORMS.includes(channel.waveform) &&
    typeof channel.amplitude === 'number' &&
    Number.isFinite(channel.amplitude)
  );
}

function isStoredSettings(value: unknown): value is StoredSettings {
  if (typeof value !== 'object' || value === null) return false;
  const settings = value as StoredSettings;
  return (
    isChannelState(settings.left) &&
    isChannelState(settings.right) &&
    typeof settings.linked === 'boolean' &&
    typeof settings.masterVolume === 'number' &&
    Number.isFinite(settings.masterVolume) &&
    typeof settings.crossfadeMs === 'number' &&
    Number.isFinite(settings.crossfadeMs)
  );
}

interface StoredAutosave {
  sessionJson: string;
  settings: StoredSettings;
}

export function saveAutosave(autosave: { session: Session; settings: StoredSettings }): void {
  const stored: StoredAutosave = {
    sessionJson: serializeSession(autosave.session),
    settings: autosave.settings,
  };
  localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(stored));
}

/** Returns the last autosaved session and settings, or null when absent or invalid. */
export function loadAutosave(): { session: Session; settings: StoredSettings } | null {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (raw === null) return null;
    const parsed = JSON.parse(raw) as Partial<StoredAutosave>;
    if (!isStoredSettings(parsed.settings)) return null;
    if (typeof parsed.sessionJson !== 'string') return null;
    const session = deserializeSession(parsed.sessionJson);
    return { session, settings: parsed.settings };
  } catch {
    return null;
  }
}
