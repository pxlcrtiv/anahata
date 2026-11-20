import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import WaveGenerator from '../WaveGenerator';
import { saveAutosave, AUTOSAVE_KEY } from '../../storage/sessionStorage';
import { deserializeSession } from '../../sequencer/session';
import type { Session } from '../../sequencer/types';

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('WaveGenerator — persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('restores the last session and settings on load', () => {
    const session: Session = {
      id: 'a1',
      name: 'Evening',
      durationMs: 8000,
      loop: false,
      events: [],
    };
    saveAutosave({
      session,
      settings: {
        left: { frequency: 200, waveform: 'sine', amplitude: 0.4 },
        right: { frequency: 210, waveform: 'square', amplitude: 0.5 },
        linked: false,
        masterVolume: 0.6,
        crossfadeMs: 250,
      },
    });

    render(<WaveGenerator />);

    expect(screen.getByDisplayValue('200')).toBeTruthy();
    expect(screen.getByDisplayValue('210')).toBeTruthy();
    expect(screen.getByText('Independent')).toBeTruthy();
    expect(screen.getByText('60%')).toBeTruthy();
    expect(screen.getByDisplayValue('Evening')).toBeTruthy();
  });

  it('autosaves changes after the debounce', () => {
    render(<WaveGenerator />);

    // A preset click changes the working state; linked by default.
    fireEvent.click(screen.getByText('Solfeggio'));

    act(() => {
      vi.advanceTimersByTime(600);
    });

    const stored = JSON.parse(localStorage.getItem(AUTOSAVE_KEY)!);
    expect(stored.settings.left.frequency).toBe(528);
    expect(stored.settings.linked).toBe(true);
    expect(deserializeSession(stored.sessionJson).name).toBe('Untitled');
  });
});
