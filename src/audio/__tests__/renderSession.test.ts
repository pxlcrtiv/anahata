import { describe, it, expect } from 'vitest';
import { renderSessionToStereo } from '../renderSession';
import type { Session } from '../../sequencer/types';

const SR = 1000; // 1 kHz — keeps the math cheap and exact
const TWO_PI_IN_TEST = 2 * Math.PI;

function makeSession(overrides: Partial<Session>): Session {
  return { id: 's', name: 'Test', durationMs: 1000, loop: false, events: [], ...overrides };
}

function countZeroCrossings(samples: Float32Array, from: number, to: number): number {
  let crossings = 0;
  for (let i = from + 1; i < to; i++) {
    if ((samples[i - 1] < 0 && samples[i] >= 0) || (samples[i - 1] >= 0 && samples[i] < 0)) {
      crossings++;
    }
  }
  return crossings;
}

function rms(samples: Float32Array, from: number, to: number): number {
  let sum = 0;
  for (let i = from; i < to; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / (to - from));
}

describe('renderSessionToStereo', () => {
  it('renders exactly the session duration', () => {
    const out = renderSessionToStereo(makeSession({ durationMs: 1500 }), SR);
    expect(out.left.length).toBe(1500);
    expect(out.right.length).toBe(1500);
    expect(out.sampleRate).toBe(SR);
    expect(out.durationMs).toBe(1500);
  });

  it('renders one cycle for a looping session, not infinity', () => {
    const out = renderSessionToStereo(makeSession({ loop: true }), SR);
    expect(out.left.length).toBe(1000);
  });

  it('renders silence when master volume is zero', () => {
    const session = makeSession({ events: [{ id: 'e1', timeMs: 0, masterVolume: 0 }] });
    const out = renderSessionToStereo(session, SR);
    for (let i = 0; i < out.left.length; i++) {
      // -0 is a valid float; compare magnitudes.
      expect(Math.abs(out.left[i])).toBe(0);
      expect(Math.abs(out.right[i])).toBe(0);
    }
  });

  it('honors a mid-session master volume event', () => {
    const session = makeSession({
      durationMs: 1000,
      events: [{ id: 'e1', timeMs: 500, masterVolume: 0.1 }],
    });
    const out = renderSessionToStereo(session, SR);

    // Baseline master volume is 0.7; after 500ms it drops to 0.1.
    const before = rms(out.left, 0, 500);
    const after = rms(out.left, 500, 1000);
    expect(before).toBeGreaterThan(0.01);
    expect(after).toBeLessThan(before * 0.2);
  });

  it('honors a frequency ramp — crossings decelerate through a downward ramp', () => {
    // Baseline left frequency is 528; the event ramps it down to 40 over
    // 500ms. Windows are kept inside Nyquist (SR/2 = 500 Hz).
    const session = makeSession({
      events: [{ id: 'e1', timeMs: 0, left: { frequency: 40 }, rampMs: 500 }],
    });
    const out = renderSessionToStereo(session, SR);

    const early = countZeroCrossings(out.left, 100, 300); // freq ~434 -> ~237
    const late = countZeroCrossings(out.left, 700, 900);  // settled at 40 Hz
    expect(early).toBeGreaterThan(late);
  });

  it('is phase-continuous — adjacent samples obey the smoothness bound of the instantaneous frequency', () => {
    // A constant 40 Hz tone at 1 kHz: adjacent samples of a clean sine can
    // differ by at most amplitude * 2π * f / SR ≈ 0.35 * 0.251 ≈ 0.088.
    // A phase discontinuity would blow far past that bound.
    const session = makeSession({
      events: [{ id: 'e1', timeMs: 0, left: { frequency: 40 } }],
    });
    const out = renderSessionToStereo(session, SR);

    const peak = 0.5 * 0.7;
    const bound = peak * TWO_PI_IN_TEST * 40 / SR;
    for (let i = 1; i < out.left.length; i++) {
      expect(Math.abs(out.left[i] - out.left[i - 1])).toBeLessThan(bound * 1.1 + 1e-9);
    }
  });

  it('renders square waves at full amplitude values', () => {
    const session = makeSession({
      events: [{ id: 'e1', timeMs: 0, left: { waveform: 'square' } }],
    });
    const out = renderSessionToStereo(session, SR);
    const peak = 0.5 * 0.7;
    let maxAbs = 0;
    for (let i = 0; i < out.left.length; i++) {
      maxAbs = Math.max(maxAbs, Math.abs(out.left[i]));
    }
    expect(maxAbs).toBeCloseTo(peak, 5);
  });
});
