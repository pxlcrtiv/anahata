import { describe, it, expect, beforeEach } from 'vitest';
import { saveAutosave, loadAutosave, AUTOSAVE_KEY } from '../sessionStorage';
import type { Session } from '../../sequencer/types';
import type { StoredSettings } from '../sessionStorage';

const settings: StoredSettings = {
  left: { frequency: 200, waveform: 'sine', amplitude: 0.5 },
  right: { frequency: 210, waveform: 'sine', amplitude: 0.5 },
  linked: false,
  masterVolume: 0.6,
  crossfadeMs: 250,
};

const session: Session = {
  id: 's1',
  name: 'Evening',
  durationMs: 8000,
  loop: false,
  events: [{ id: 'e1', timeMs: 0, left: { frequency: 200 } }],
};

beforeEach(() => {
  localStorage.clear();
});

describe('autosave storage', () => {
  it('round-trips a session with its settings', () => {
    saveAutosave({ session, settings });
    const restored = loadAutosave();
    expect(restored).not.toBeNull();
    expect(restored!.session).toEqual(session);
    expect(restored!.settings).toEqual(settings);
  });

  it('returns null when nothing is stored', () => {
    expect(loadAutosave()).toBeNull();
  });

  it('returns null on corrupt JSON', () => {
    localStorage.setItem(AUTOSAVE_KEY, 'garbage');
    expect(loadAutosave()).toBeNull();
  });

  it('rejects settings with an invalid waveform', () => {
    const bad = { ...settings, left: { ...settings.left, waveform: 'wobble' as never } };
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ sessionJson: JSON.stringify(session), settings: bad }));
    expect(loadAutosave()).toBeNull();
  });

  it('rejects a structurally invalid session', () => {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ sessionJson: JSON.stringify({ id: 'x' }), settings }));
    expect(loadAutosave()).toBeNull();
  });

  it('rejects an autosave whose session carries invalid event fields', () => {
    const sessionJson = JSON.stringify({
      id: 'x',
      name: 'N',
      durationMs: 1000,
      loop: false,
      events: [{ id: 'e1', timeMs: 'abc' }],
    });
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ sessionJson, settings }));
    expect(loadAutosave()).toBeNull();
  });

  it('rejects an autosave missing the session payload', () => {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ settings }));
    expect(loadAutosave()).toBeNull();
  });
});
