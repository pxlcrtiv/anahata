import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSequencer } from '../useSequencer';
import type { Session } from '../../sequencer/types';

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'test-session',
    name: 'Test Session',
    durationMs: 100,
    loop: false,
    events: [],
    ...overrides,
  };
}

describe('useSequencer', () => {
  let now: number;
  let rafQueue: FrameRequestCallback[];

  beforeEach(() => {
    now = 0;
    rafQueue = [];
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
      rafQueue.push(cb);
      return rafQueue.length;
    });
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});
    vi.spyOn(performance, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Advances the transport deterministically: bumps the clock by deltaMs
  // and runs every scheduled animation frame at that timestamp.
  const fireFrame = (deltaMs: number) => {
    now += deltaMs;
    const callbacks = rafQueue;
    rafQueue = [];
    for (const cb of callbacks) cb(now);
  };

  it('fires onEnd when a non-loop session reaches its natural end', () => {
    const onTick = vi.fn();
    const onEnd = vi.fn();
    const { result } = renderHook(() => useSequencer(onTick, onEnd));

    act(() => {
      result.current.setSession(makeSession({ durationMs: 100 }));
    });
    act(() => {
      result.current.play();
    });

    act(() => {
      fireFrame(60);
    });
    expect(onEnd).not.toHaveBeenCalled();
    expect(result.current.isPlaying).toBe(true);

    // 120ms >= 100ms — terminal branch
    act(() => {
      fireFrame(60);
    });
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.positionMs).toBe(100);

    // No further frames are scheduled after the end — the transition
    // must not fire again.
    act(() => {
      fireFrame(60);
    });
    expect(onEnd).toHaveBeenCalledTimes(1);

    // The end state was still applied via onTick before the transition.
    expect(onTick).toHaveBeenCalled();
  });

  it('does not fire onEnd for loop sessions — position wraps instead', () => {
    const onEnd = vi.fn();
    const { result } = renderHook(() => useSequencer(vi.fn(), onEnd));

    act(() => {
      result.current.setSession(makeSession({ durationMs: 100, loop: true }));
    });
    act(() => {
      result.current.play();
    });

    act(() => {
      fireFrame(60);
    });
    act(() => {
      fireFrame(60); // 120ms wraps to 20ms
    });

    expect(onEnd).not.toHaveBeenCalled();
    expect(result.current.isPlaying).toBe(true);
    expect(result.current.positionMs).toBe(20);
  });

  it('does not fire onEnd on manual pause or stop', () => {
    const onEnd = vi.fn();
    const { result } = renderHook(() => useSequencer(vi.fn(), onEnd));

    act(() => {
      result.current.setSession(makeSession({ durationMs: 100 }));
    });
    act(() => {
      result.current.play();
    });
    act(() => {
      fireFrame(30);
    });

    act(() => {
      result.current.pause();
    });
    act(() => {
      fireFrame(30);
    });
    expect(onEnd).not.toHaveBeenCalled();

    act(() => {
      result.current.play();
    });
    act(() => {
      result.current.stop();
    });
    expect(onEnd).not.toHaveBeenCalled();
  });

  it('play() from the end position of a finished non-loop session restarts from 0', () => {
    const { result } = renderHook(() => useSequencer(vi.fn(), vi.fn()));

    act(() => {
      result.current.setSession(makeSession({ durationMs: 100 }));
    });
    act(() => {
      result.current.play();
    });

    // First frame already overshoots the end.
    act(() => {
      fireFrame(120);
    });
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.positionMs).toBe(100);

    // Replay: the transport starts from the top, not from the end latch.
    act(() => {
      result.current.play();
    });
    expect(result.current.isPlaying).toBe(true);
    expect(result.current.positionMs).toBe(0);
  });
});
