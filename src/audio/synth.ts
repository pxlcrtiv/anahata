import type { Waveform } from '../sequencer/types';

/**
 * Render the tone sample for one channel at `time` seconds, scaled by the
 * channel amplitude and the master volume.
 *
 * Pure synthesis for generated audio (WAV export). Live playback renders
 * through the Web Audio oscillator graph in `useAudioEngine`; this module is
 * the single source of truth for the tone math, so exported audio cannot drift
 * from what playback produces.
 */
export function renderToneSample(
  waveform: Waveform,
  frequency: number,
  amplitude: number,
  masterVolume: number,
  time: number,
): number {
  const phase = 2 * Math.PI * frequency * time;

  let sample: number;
  switch (waveform) {
    case 'sine':
      sample = Math.sin(phase);
      break;
    case 'square':
      sample = Math.sign(Math.sin(phase));
      break;
    case 'triangle':
      sample = (2 / Math.PI) * Math.asin(Math.sin(phase));
      break;
    case 'sawtooth':
      sample = 2 * (frequency * time - Math.floor(frequency * time + 0.5));
      break;
  }

  return sample * amplitude * masterVolume;
}
