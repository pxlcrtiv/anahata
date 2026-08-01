import type { Session, EvaluatedState, ChannelState, Waveform } from './types';

const BASELINE: EvaluatedState = {
  left: { frequency: 528, waveform: 'sine', amplitude: 0.5 },
  right: { frequency: 528, waveform: 'sine', amplitude: 0.5 },
  masterVolume: 0.7,
};

export function evaluateSession(session: Session, timeMs: number): EvaluatedState {
  const t = session.loop ? timeMs % session.durationMs : timeMs;

  const sorted = [...session.events].sort((a, b) => a.timeMs - b.timeMs);

  const left: ChannelState = { ...BASELINE.left };
  const right: ChannelState = { ...BASELINE.right };
  let masterVolume = BASELINE.masterVolume;

  for (const event of sorted) {
    if (event.timeMs > t) break;

    if (event.left) {
      if (event.left.frequency !== undefined) left.frequency = event.left.frequency;
      if (event.left.waveform !== undefined) left.waveform = event.left.waveform as Waveform;
      if (event.left.amplitude !== undefined) left.amplitude = event.left.amplitude;
    }
    if (event.right) {
      if (event.right.frequency !== undefined) right.frequency = event.right.frequency;
      if (event.right.waveform !== undefined) right.waveform = event.right.waveform as Waveform;
      if (event.right.amplitude !== undefined) right.amplitude = event.right.amplitude;
    }
    if (event.masterVolume !== undefined) {
      masterVolume = event.masterVolume;
    }
  }

  return { left, right, masterVolume };
}
