import { describe, it, expect } from 'vitest';
import { generateWaveformSamples } from '../waveform';
import type { EvaluatedState, ChannelState } from '../types';

function makeChannel(overrides: Partial<ChannelState> = {}): ChannelState {
  return {
    frequency: 440,
    waveform: 'sine',
    amplitude: 0.5,
    ...overrides,
  };
}

describe('generateWaveformSamples', () => {
  const sampleRate = 44100;
  const duration = 0.01; // 10 ms
  const numSamples = Math.floor(sampleRate * duration); // 441 samples

  it('returns two typed arrays (left and right)', () => {
    const state: EvaluatedState = {
      left: makeChannel(),
      right: makeChannel(),
      masterVolume: 0.7,
    };
    const result = generateWaveformSamples(state, sampleRate, numSamples);
    expect(result.left).toBeInstanceOf(Float32Array);
    expect(result.right).toBeInstanceOf(Float32Array);
    expect(result.left.length).toBe(numSamples);
    expect(result.right.length).toBe(numSamples);
  });

  it('produces silence for zero amplitude', () => {
    const state: EvaluatedState = {
      left: makeChannel({ amplitude: 0 }),
      right: makeChannel({ amplitude: 0 }),
      masterVolume: 1,
    };
    const result = generateWaveformSamples(state, sampleRate, numSamples);
    expect(result.left.every((v) => v === 0)).toBe(true);
    expect(result.right.every((v) => v === 0)).toBe(true);
  });

  describe('sine waveform', () => {
    it('produces values in [-1, 1]', () => {
      const state: EvaluatedState = {
        left: makeChannel({ waveform: 'sine', frequency: 440, amplitude: 1 }),
        right: makeChannel({ waveform: 'sine', frequency: 440, amplitude: 1 }),
        masterVolume: 1,
      };
      const result = generateWaveformSamples(state, sampleRate, numSamples);
      for (const v of result.left) {
        expect(v).toBeGreaterThanOrEqual(-1);
        expect(v).toBeLessThanOrEqual(1);
      }
    });

    it('scales by amplitude and masterVolume', () => {
      const state: EvaluatedState = {
        left: makeChannel({ waveform: 'sine', frequency: 440, amplitude: 0.5 }),
        right: makeChannel({ waveform: 'sine', frequency: 440, amplitude: 0.5 }),
        masterVolume: 0.8,
      };
      const result = generateWaveformSamples(state, sampleRate, numSamples);
      const maxLeft = Math.max(...result.left.map(Math.abs));
      const maxRight = Math.max(...result.right.map(Math.abs));
      // max expected value = 0.5 * 0.8 = 0.4
      expect(maxLeft).toBeCloseTo(0.4, 1);
      expect(maxRight).toBeCloseTo(0.4, 1);
    });

    it('first sample is sin(0) = 0', () => {
      const state: EvaluatedState = {
        left: makeChannel({ waveform: 'sine', frequency: 440, amplitude: 1 }),
        right: makeChannel({ waveform: 'sine', frequency: 440, amplitude: 1 }),
        masterVolume: 1,
      };
      const result = generateWaveformSamples(state, sampleRate, 1);
      expect(result.left[0]).toBeCloseTo(0, 5);
      expect(result.right[0]).toBeCloseTo(0, 5);
    });
  });

  describe('square waveform', () => {
    it('produces only +1 or -1 values (before amplitude scaling)', () => {
      const state: EvaluatedState = {
        left: makeChannel({ waveform: 'square', frequency: 440, amplitude: 1 }),
        right: makeChannel({ waveform: 'square', frequency: 440, amplitude: 1 }),
        masterVolume: 1,
      };
      const result = generateWaveformSamples(state, sampleRate, numSamples);
      for (const v of result.left) {
        expect(v === 1 || v === -1 || Math.abs(v) < 1e-10).toBe(true);
      }
    });
  });

  describe('triangle waveform', () => {
    it('produces values in [-1, 1]', () => {
      const state: EvaluatedState = {
        left: makeChannel({ waveform: 'triangle', frequency: 440, amplitude: 1 }),
        right: makeChannel({ waveform: 'triangle', frequency: 440, amplitude: 1 }),
        masterVolume: 1,
      };
      const result = generateWaveformSamples(state, sampleRate, numSamples);
      for (const v of result.left) {
        expect(v).toBeGreaterThanOrEqual(-1);
        expect(v).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('sawtooth waveform', () => {
    it('produces values in [-1, 1]', () => {
      const state: EvaluatedState = {
        left: makeChannel({ waveform: 'sawtooth', frequency: 440, amplitude: 1 }),
        right: makeChannel({ waveform: 'sawtooth', frequency: 440, amplitude: 1 }),
        masterVolume: 1,
      };
      const result = generateWaveformSamples(state, sampleRate, numSamples);
      for (const v of result.left) {
        expect(v).toBeGreaterThanOrEqual(-1);
        expect(v).toBeLessThanOrEqual(1);
      }
    });
  });

  it('applies different waveforms per channel independently', () => {
    const state: EvaluatedState = {
      left: makeChannel({ waveform: 'sine', frequency: 100, amplitude: 1 }),
      right: makeChannel({ waveform: 'square', frequency: 100, amplitude: 1 }),
      masterVolume: 1,
    };
    const result = generateWaveformSamples(state, sampleRate, numSamples);
    // At t=0, sine is 0, square is sign(sin(0)) = 0
    expect(result.left[0]).toBeCloseTo(0, 5);
    expect(result.right[0]).toBeCloseTo(0, 5);
    // At t=1/(4*f)=0.0025, sine is 1, square is 1
    const idxQuarter = Math.floor(0.0025 * sampleRate);
    if (idxQuarter < numSamples) {
      expect(result.left[idxQuarter]).toBeCloseTo(1, 1);
      expect(result.right[idxQuarter]).toBeCloseTo(1, 1);
    }
  });

  it('handles zero samples (empty buffer)', () => {
    const state: EvaluatedState = {
      left: makeChannel(),
      right: makeChannel(),
      masterVolume: 0.7,
    };
    const result = generateWaveformSamples(state, sampleRate, 0);
    expect(result.left.length).toBe(0);
    expect(result.right.length).toBe(0);
  });

  it('respects different sample rates', () => {
    const state: EvaluatedState = {
      left: makeChannel({ waveform: 'sine', frequency: 1000, amplitude: 1 }),
      right: makeChannel({ waveform: 'sine', frequency: 1000, amplitude: 1 }),
      masterVolume: 1,
    };
    const n = 48000; // 1 second at 48kHz
    const result = generateWaveformSamples(state, 48000, n);
    expect(result.left.length).toBe(n);
    expect(result.right.length).toBe(n);
  });
});
