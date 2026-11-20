import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import WaveGenerator from '../WaveGenerator';
import { saveAutosave } from '../../storage/sessionStorage';

// The audio engine and recorder are the browser seam — mock them so the
// transport's behaviour through the component tree is what's under test.
const startAudio = vi.fn();
const stopAudio = vi.fn();
const applyState = vi.fn();

vi.mock('../../hooks/useAudioEngine', () => ({
  useAudioEngine: () => ({
    startAudio,
    stopAudio,
    applyState,
    getWaveformData: () => ({ left: null, right: null }),
    getAudioContext: () => null,
    getMasterGain: () => null,
  }),
}));

// Recording state varies per test — hoisted so the mock factory can read it.
const mock = vi.hoisted(() => ({ isRecording: false }));
const startRecording = vi.fn();
const stopRecording = vi.fn();

vi.mock('../../audio/recording', () => ({
  useRecording: () => ({
    startRecording,
    stopRecording,
    isRecording: mock.isRecording,
  }),
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
  mock.isRecording = false;
});

let now: number;
let rafQueue: FrameRequestCallback[];

const fireFrame = (deltaMs: number) => {
  now += deltaMs;
  const callbacks = rafQueue;
  rafQueue = [];
  for (const cb of callbacks) cb(now);
};

describe('WaveGenerator transport — integration (engine mocked)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    now = 0;
    rafQueue = [];
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
      rafQueue.push(cb);
      return rafQueue.length;
    });
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    vi.clearAllMocks();
    mock.isRecording = false;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('play drives the engine: start on the first tick, apply on later ticks', () => {
    render(<WaveGenerator />);

    fireEvent.click(screen.getByRole('button', { name: 'Play', exact: true }));

    act(() => {
      fireFrame(16);
    });
    expect(startAudio).toHaveBeenCalledTimes(1);

    act(() => {
      fireFrame(16);
    });
    expect(applyState).toHaveBeenCalled();
  });

  it('natural end stops the engine exactly once and returns the UI to Play', () => {
    render(<WaveGenerator />);

    // Shorten the session to 100ms (the duration input shares the transport row).
    const transportRow = screen.getByRole('button', { name: 'Play', exact: true }).parentElement!;
    const durationInput = transportRow.querySelector('input[type="number"]') as HTMLInputElement;
    fireEvent.change(durationInput, { target: { value: '100' } });

    fireEvent.click(screen.getByRole('button', { name: 'Play', exact: true }));

    act(() => {
      fireFrame(60);
    });
    act(() => {
      fireFrame(60); // 120ms >= 100ms — natural end
    });

    expect(stopAudio).toHaveBeenCalledTimes(1);
    // The transport shows Play again — the end transition reached the UI.
    expect(screen.getByRole('button', { name: 'Play', exact: true })).toBeTruthy();
  });

  it('replay after natural end produces audible engine work again', () => {
    render(<WaveGenerator />);

    fireEvent.click(screen.getByRole('button', { name: 'Play', exact: true }));
    act(() => {
      fireFrame(20000); // first frame overshoots the 10s default
    });
    expect(stopAudio).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Play', exact: true }));
    act(() => {
      fireFrame(16);
    });
    // The latch was reset by the end transition: the engine starts again.
    expect(startAudio).toHaveBeenCalledTimes(2);
  });

  it('Stop during sequencer playback halts the sequencer, the engine, and the recorder', () => {
    mock.isRecording = true;
    render(<WaveGenerator />);

    fireEvent.click(screen.getByRole('button', { name: 'Play', exact: true }));
    act(() => {
      fireFrame(16);
    });
    expect(startAudio).toHaveBeenCalledTimes(1);

    // The player-card Stop (aria-label "Stop tone").
    fireEvent.click(screen.getByRole('button', { name: 'Stop tone' }));

    expect(stopAudio).toHaveBeenCalled();
    expect(stopRecording).toHaveBeenCalledTimes(1);

    // No zombie: the transport is back to Play, and later frames write nothing.
    expect(screen.getByRole('button', { name: 'Play', exact: true })).toBeTruthy();
    const writes = applyState.mock.calls.length + startAudio.mock.calls.length;
    act(() => {
      fireFrame(16);
    });
    expect(applyState.mock.calls.length + startAudio.mock.calls.length).toBe(writes);
  });

  it('mixer edits do not reach the engine while the sequencer owns it', () => {
    const { container } = render(<WaveGenerator />);

    fireEvent.click(screen.getByRole('button', { name: 'Play', exact: true }));
    act(() => {
      fireFrame(16);
    });
    act(() => {
      fireFrame(16);
    });
    const writes = applyState.mock.calls.length;

    const input = container.querySelector('#left-frequency') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '300' } });

    // One writer per mode: the sequencer owns the engine right now.
    expect(applyState.mock.calls.length).toBe(writes);
  });

  it('pausing from the player card pauses the sequencer, not just the engine', () => {
    render(<WaveGenerator />);

    fireEvent.click(screen.getByRole('button', { name: 'Play', exact: true }));
    act(() => {
      fireFrame(16);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Pause tone' }));

    // The transport is back to Play — the sequencer actually paused.
    expect(screen.getByRole('button', { name: 'Play', exact: true })).toBeTruthy();
  });

  it('player labels describe what the sequencer is sounding', () => {
    // The manual settings say 528; the session's t=0 event sounds 300.
    saveAutosave({
      session: {
        id: 's',
        name: 'T',
        durationMs: 10000,
        loop: false,
        events: [{ id: 'e1', timeMs: 0, left: { frequency: 300 } }],
      },
      settings: {
        left: { frequency: 528, waveform: 'sine', amplitude: 0.5 },
        right: { frequency: 528, waveform: 'sine', amplitude: 0.5 },
        linked: true,
        masterVolume: 0.7,
        crossfadeMs: 250,
      },
    });

    render(<WaveGenerator />);
    fireEvent.click(screen.getByRole('button', { name: 'Play', exact: true }));
    act(() => {
      fireFrame(16);
    });

    expect(screen.getAllByText(/L: 300Hz/).length).toBeGreaterThan(0);
  });
});
