import { describe, it, expect } from 'vitest';
import { renderToneSample } from '../synth';

describe('renderToneSample', () => {
  it('renders a sine at time 0 as silence', () => {
    expect(renderToneSample('sine', 528, 0.5, 0.7, 0)).toBe(0);
  });

  it('renders a sine at its first quarter period at full amplitude', () => {
    // f=2Hz, t=0.125 -> phase = pi/2 -> sin = 1
    expect(renderToneSample('sine', 2, 1, 1, 0.125)).toBeCloseTo(1, 5);
  });

  it('scales by amplitude and master volume', () => {
    // f=2Hz, t=0.125 -> raw sample 1, amplitude 0.5, masterVolume 0.5 -> 0.25
    expect(renderToneSample('sine', 2, 0.5, 0.5, 0.125)).toBeCloseTo(0.25, 5);
  });

  it('renders a square wave at +1 and -1', () => {
    // f=2Hz, phase steps of pi/2
    expect(renderToneSample('square', 2, 1, 1, 0.125)).toBe(1);
    expect(renderToneSample('square', 2, 1, 1, 0.375)).toBe(-1);
  });

  it('renders a triangle wave peaking at 1', () => {
    // f=2Hz, t=0.125 -> phase = pi/2 -> triangle peak = 1
    expect(renderToneSample('triangle', 2, 1, 1, 0.125)).toBeCloseTo(1, 5);
  });

  it('renders a sawtooth wave', () => {
    // f=2Hz, t=0.25 -> phase = pi -> sawtooth = 2 * (0.5 - floor(1.0)) = -1
    expect(renderToneSample('sawtooth', 2, 1, 1, 0.25)).toBe(-1);
    expect(renderToneSample('sawtooth', 2, 1, 1, 0)).toBe(0);
  });
});
