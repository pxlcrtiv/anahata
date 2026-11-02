import { describe, it, expect, vi, beforeAll } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAudioEngine } from '../useAudioEngine';
import type { EvaluatedState, ChannelState } from '../../sequencer/types';

function makeChannel(overrides: Partial<ChannelState> = {}): ChannelState {
  return {
    frequency: 440,
    waveform: 'sine',
    amplitude: 0.5,
    ...overrides,
  };
}

function makeState(overrides: Partial<EvaluatedState> = {}): EvaluatedState {
  return {
    left: makeChannel(),
    right: makeChannel(),
    masterVolume: 0.7,
    ...overrides,
  };
}

describe('useAudioEngine', () => {
  beforeAll(() => {
    class MockAudioContext {
      state = 'running';
      currentTime = 0;
      sampleRate = 44100;
      async resume() {}

      createOscillator() {
        const osc = {
          frequency: { setValueAtTime: vi.fn() },
          type: '',
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
          disconnect: vi.fn(),
        };
        return osc;
      }

      createGain() {
        return {
          gain: {
            value: 0.7,
            cancelScheduledValues: vi.fn(),
            setValueAtTime: vi.fn(),
            linearRampToValueAtTime: vi.fn(),
          },
          connect: vi.fn(),
          disconnect: vi.fn(),
        };
      }

      createAnalyser() {
        return {
          fftSize: 2048,
          smoothingTimeConstant: 0,
          frequencyBinCount: 1024,
          connect: vi.fn(),
          disconnect: vi.fn(),
          getByteTimeDomainData: vi.fn(),
        };
      }

      createChannelMerger() {
        return { connect: vi.fn(), disconnect: vi.fn() };
      }

      createBuffer() {
        return {
          numberOfChannels: 2,
          sampleRate: 44100,
          getChannelData: () => new Float32Array(100),
        };
      }

      destination = {};
      close = vi.fn();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).AudioContext = MockAudioContext;
  });

  it('applyState is a no-op when AudioContext is not initialized', () => {
    const { result } = renderHook(() => useAudioEngine());

    expect(() => {
      act(() => {
        result.current.applyState(
          makeState({
            left: makeChannel({ frequency: 300 }),
            right: makeChannel({ frequency: 300 }),
            masterVolume: 0.5,
          }),
        );
      });
    }).not.toThrow();
  });

  it('applyState updates frequency, waveform, amplitude, and master volume', async () => {
    const { result } = renderHook(() => useAudioEngine());

    await act(async () => {
      await result.current.startAudio({
        leftChannel: makeChannel({ frequency: 200, waveform: 'sine', amplitude: 0.5 }),
        rightChannel: makeChannel({ frequency: 200, waveform: 'sine', amplitude: 0.5 }),
        masterVolume: 0.7,
      });
    });

    const nodes = result.current.getCreatedNodes();

    // startAudio creates 2 oscillators + 2 channel gains (+ master gain from initializeAudioContext)
    expect(nodes.oscillators.length).toBe(2);
    expect(nodes.gains.length).toBeGreaterThanOrEqual(2); // left + right
    expect(nodes.analysers.length).toBe(2);
    expect(nodes.masterGain).not.toBeNull();

    // Snapshot the nodes before applyState (nodesRef is stable)
    const leftOsc = nodes.oscillators[0];
    const rightOsc = nodes.oscillators[1];
    const leftGain = nodes.gains[0];
    const rightGain = nodes.gains[1];

    // Now applyState with new values
    await act(async () => {
      result.current.applyState(
        makeState({
          left: makeChannel({ frequency: 300, waveform: 'square', amplitude: 0.8 }),
          right: makeChannel({ frequency: 350, waveform: 'triangle', amplitude: 0.6 }),
          masterVolume: 0.5,
        }),
      );
    });

    // Frequency: last call should reflect new state
    expect(leftOsc.frequency.setValueAtTime).toHaveBeenLastCalledWith(300, expect.any(Number));
    expect(rightOsc.frequency.setValueAtTime).toHaveBeenLastCalledWith(350, expect.any(Number));

    // Waveform type
    expect(leftOsc.type).toBe('square');
    expect(rightOsc.type).toBe('triangle');

    // Amplitude — the last call to each gain should be from applyState
    expect(leftGain.gain.setValueAtTime).toHaveBeenLastCalledWith(0.8, expect.any(Number));
    expect(rightGain.gain.setValueAtTime).toHaveBeenLastCalledWith(0.6, expect.any(Number));

    // Master volume — use the explicitly-tracked masterGain
    expect(nodes.masterGain!.gain.setValueAtTime).toHaveBeenLastCalledWith(0.5, expect.any(Number));
  });

  it('applyState is safe when isPlaying is false', async () => {
    const { result } = renderHook(() => useAudioEngine());

    expect(() => {
      act(() => {
        result.current.applyState(makeState());
      });
    }).not.toThrow();
  });

  it('getWaveformData returns typed arrays from analysers', async () => {
    const { result } = renderHook(() => useAudioEngine());

    await act(async () => {
      await result.current.startAudio({
        leftChannel: makeChannel(),
        rightChannel: makeChannel(),
        masterVolume: 0.7,
      });
    });

    const nodes = result.current.getCreatedNodes();
    const data = result.current.getWaveformData();
    expect(data.left).toBeInstanceOf(Uint8Array);
    expect(data.right).toBeInstanceOf(Uint8Array);
    expect(nodes.analysers[0].getByteTimeDomainData).toHaveBeenCalled();
    expect(nodes.analysers[1].getByteTimeDomainData).toHaveBeenCalled();
  });

  it('stopAudio stops and disconnects all oscillators and nodes', async () => {
    const { result } = renderHook(() => useAudioEngine());

    await act(async () => {
      await result.current.startAudio({
        leftChannel: makeChannel(),
        rightChannel: makeChannel(),
        masterVolume: 0.7,
      });
    });

    // Snapshot nodes BEFORE stopAudio (nodesRef stays stable, arrays get cleared in place)
    const nodesBefore = result.current.getCreatedNodes();
    const oscsBefore = [...nodesBefore.oscillators];
    const gainsBefore = [...nodesBefore.gains];
    const analysersBefore = [...nodesBefore.analysers];

    expect(oscsBefore.length).toBeGreaterThan(0);
    expect(gainsBefore.length).toBeGreaterThan(0);
    expect(analysersBefore.length).toBeGreaterThan(0);

    act(() => {
      result.current.stopAudio();
    });

    // All oscillators should be stopped and disconnected
    for (const osc of oscsBefore) {
      expect(osc.stop).toHaveBeenCalledTimes(1);
      expect(osc.disconnect).toHaveBeenCalledTimes(1);
    }
    // All gains should be disconnected
    for (const g of gainsBefore) {
      expect(g.disconnect).toHaveBeenCalledTimes(1);
    }
    // All analysers should be disconnected
    for (const a of analysersBefore) {
      expect(a.disconnect).toHaveBeenCalledTimes(1);
    }

    // After stopAudio, node arrays are cleared in place
    expect(result.current.getCreatedNodes().oscillators.length).toBe(0);
    expect(result.current.getCreatedNodes().gains.length).toBe(0);
    expect(result.current.getCreatedNodes().analysers.length).toBe(0);
  });
});
