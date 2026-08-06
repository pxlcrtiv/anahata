import type { EvaluatedState } from './types';

export const DEFAULT_CROSSFADE_MS = 300;

export function interpolateState(
  from: EvaluatedState,
  to: EvaluatedState,
  progress: number,
): EvaluatedState {
  const t = Math.max(0, Math.min(1, progress));

  const lerp = (a: number, b: number) => a + (b - a) * t;

  return {
    left: {
      frequency: lerp(from.left.frequency, to.left.frequency),
      waveform: t > 0 ? to.left.waveform : from.left.waveform,
      amplitude: lerp(from.left.amplitude, to.left.amplitude),
    },
    right: {
      frequency: lerp(from.right.frequency, to.right.frequency),
      waveform: t > 0 ? to.right.waveform : from.right.waveform,
      amplitude: lerp(from.right.amplitude, to.right.amplitude),
    },
    masterVolume: lerp(from.masterVolume, to.masterVolume),
  };
}
