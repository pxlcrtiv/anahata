import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import WaveGenerator from '../WaveGenerator';

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

const startRecording = vi.fn();
const stopRecording = vi.fn();

vi.mock('../../audio/recording', () => ({
  useRecording: () => ({
    startRecording,
    stopRecording,
    isRecording: false,
  }),
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
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
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('play drives the engine: start on the first tick, apply on later ticks', () => {
    render(<WaveGenerator />);

    // Transport Play (the bar shows "Play" while stopped).
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));

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
    const transportRow = screen.getByRole('button', { name: 'Play' }).parentElement!;
    const durationInput = transportRow.querySelector('input[type="number"]') as HTMLInputElement;
    fireEvent.change(durationInput, { target: { value: '100' } });

    fireEvent.click(screen.getByRole('button', { name: 'Play' }));

    act(() => {
      fireFrame(60);
    });
    act(() => {
      fireFrame(60); // 120ms >= 100ms — natural end
    });

    expect(stopAudio).toHaveBeenCalledTimes(1);
    // The transport shows Play again — the end transition reached the UI.
    expect(screen.getByRole('button', { name: 'Play' })).toBeTruthy();
  });

  it('replay after natural end produces audible engine work again', () => {
    render(<WaveGenerator />);

    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    act(() => {
      fireFrame(20000); // first frame overshoots the 10s default
    });
    expect(stopAudio).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    act(() => {
      fireFrame(16);
    });
    // The latch was reset by the end transition: the engine starts again.
    expect(startAudio).toHaveBeenCalledTimes(2);
  });
});
