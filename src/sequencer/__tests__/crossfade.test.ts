import { describe, it, expect } from 'vitest';
import { interpolateState, DEFAULT_CROSSFADE_MS } from '../crossfade';
import type { EvaluatedState } from '../types';

const fromState: EvaluatedState = {
  left: { frequency: 432, waveform: 'sine', amplitude: 0.3 },
  right: { frequency: 440, waveform: 'triangle', amplitude: 0.6 },
  masterVolume: 0.5,
};

const toState: EvaluatedState = {
  left: { frequency: 528, waveform: 'sine', amplitude: 0.8 },
  right: { frequency: 536, waveform: 'sine', amplitude: 0.2 },
  masterVolume: 1.0,
};

describe('interpolateState', () => {
  it('returns fromState at progress=0', () => {
    const result = interpolateState(fromState, toState, 0);
    expect(result.left.frequency).toBe(432);
    expect(result.left.amplitude).toBe(0.3);
    expect(result.right.frequency).toBe(440);
    expect(result.right.amplitude).toBe(0.6);
    expect(result.masterVolume).toBe(0.5);
  });

  it('returns toState at progress=1', () => {
    const result = interpolateState(fromState, toState, 1);
    expect(result.left.frequency).toBe(528);
    expect(result.left.amplitude).toBe(0.8);
    expect(result.right.frequency).toBe(536);
    expect(result.right.amplitude).toBe(0.2);
    expect(result.masterVolume).toBe(1.0);
  });

  it('interpolates linearly at progress=0.5', () => {
    const result = interpolateState(fromState, toState, 0.5);
    expect(result.left.frequency).toBeCloseTo(480, 1); // 432 + (528-432)*0.5
    expect(result.left.amplitude).toBeCloseTo(0.55, 2); // 0.3 + (0.8-0.3)*0.5
    expect(result.right.frequency).toBeCloseTo(488, 1); // 440 + (536-440)*0.5
    expect(result.right.amplitude).toBeCloseTo(0.4, 2); // 0.6 + (0.2-0.6)*0.5
    expect(result.masterVolume).toBeCloseTo(0.75, 2); // 0.5 + (1.0-0.5)*0.5
  });

  it('takes the target waveform at any progress > 0', () => {
    const fromWaveformState: EvaluatedState = {
      left: { frequency: 432, waveform: 'square', amplitude: 0.3 },
      right: { frequency: 440, waveform: 'triangle', amplitude: 0.6 },
      masterVolume: 0.5,
    };
    const toWaveformState: EvaluatedState = {
      left: { frequency: 528, waveform: 'sine', amplitude: 0.8 },
      right: { frequency: 536, waveform: 'sawtooth', amplitude: 0.2 },
      masterVolume: 1.0,
    };

    const result = interpolateState(fromWaveformState, toWaveformState, 0.5);
    expect(result.left.waveform).toBe('sine');
    expect(result.right.waveform).toBe('sawtooth');
  });

  it('clamps progress values outside [0,1]', () => {
    const resultNeg = interpolateState(fromState, toState, -0.5);
    expect(resultNeg.left.frequency).toBe(432);

    const resultOver = interpolateState(fromState, toState, 1.5);
    expect(resultOver.left.frequency).toBe(528);
  });

  it('interpolates all fields correctly at progress=0.25', () => {
    const result = interpolateState(fromState, toState, 0.25);
    expect(result.left.frequency).toBeCloseTo(456, 1); // 432 + 96*0.25
    expect(result.left.amplitude).toBeCloseTo(0.425, 3); // 0.3 + 0.5*0.25
    expect(result.right.frequency).toBeCloseTo(464, 1); // 440 + 96*0.25
    expect(result.right.amplitude).toBeCloseTo(0.5, 2); // 0.6 + (-0.4)*0.25
    expect(result.masterVolume).toBeCloseTo(0.625, 3); // 0.5 + 0.5*0.25
  });

  it('handles identical states (from === to)', () => {
    const same: EvaluatedState = {
      left: { frequency: 528, waveform: 'sine', amplitude: 0.5 },
      right: { frequency: 528, waveform: 'sine', amplitude: 0.5 },
      masterVolume: 0.7,
    };
    const result = interpolateState(same, same, 0.5);
    expect(result.left.frequency).toBe(528);
    expect(result.right.frequency).toBe(528);
    expect(result.masterVolume).toBe(0.7);
  });
});

describe('DEFAULT_CROSSFADE_MS', () => {
  it('is a positive number', () => {
    expect(DEFAULT_CROSSFADE_MS).toBeGreaterThan(0);
  });

  it('defaults to 300', () => {
    expect(DEFAULT_CROSSFADE_MS).toBe(300);
  });
});
