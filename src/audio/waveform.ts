import type { EvaluatedState } from '../sequencer/types';

/**
 * Pure function: generate left/right waveform sample arrays for an EvaluatedState.
 *
 * This is the shared waveform math extracted from useAudioEngine's exportWAV.
 * It has no side effects and is trivially testable.
 */
export function generateWaveformSamples(
  state: EvaluatedState,
  sampleRate: number,
  numSamples: number,
): { left: Float32Array; right: Float32Array } {
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const time = i / sampleRate;

    left[i] = sampleValue(state.left, time) * state.left.amplitude * state.masterVolume;
    right[i] = sampleValue(state.right, time) * state.right.amplitude * state.masterVolume;
  }

  return { left, right };
}

function sampleValue(channel: { frequency: number; waveform: string }, time: number): number {
  const { frequency, waveform } = channel;
  const phase = 2 * Math.PI * frequency * time;

  switch (waveform) {
    case 'sine':
      return Math.sin(phase);
    case 'square':
      return Math.sign(Math.sin(phase));
    case 'triangle':
      return (2 / Math.PI) * Math.asin(Math.sin(phase));
    case 'sawtooth':
      return 2 * (frequency * time - Math.floor(frequency * time + 0.5));
    default:
      return 0;
  }
}
