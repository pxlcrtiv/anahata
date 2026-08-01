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

  // Track "pre-ramp" values for interpolation
  let prevLeft: ChannelState = { ...BASELINE.left };
  let prevRight: ChannelState = { ...BASELINE.right };
  let prevMasterVolume = BASELINE.masterVolume;

  for (const event of sorted) {
    if (event.timeMs > t) break;

    // Snapshot values before this event applies
    const snapshotLeft = { ...left };
    const snapshotRight = { ...right };
    const snapshotMaster = masterVolume;

    // Apply discrete changes (waveform always snaps immediately)
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

    // If ramp is active, interpolate from pre-ramp snapshot to target
    if (event.rampMs && event.rampMs > 0) {
      const elapsed = t - event.timeMs;
      const progress = Math.max(0, Math.min(1, elapsed / event.rampMs));

      if (event.left) {
        if (event.left.frequency !== undefined) {
          left.frequency = snapshotLeft.frequency + (left.frequency - snapshotLeft.frequency) * progress;
        }
        if (event.left.amplitude !== undefined) {
          left.amplitude = snapshotLeft.amplitude + (left.amplitude - snapshotLeft.amplitude) * progress;
        }
        // Waveform snaps immediately — already applied above, no interpolation
      }
      if (event.right) {
        if (event.right.frequency !== undefined) {
          right.frequency = snapshotRight.frequency + (right.frequency - snapshotRight.frequency) * progress;
        }
        if (event.right.amplitude !== undefined) {
          right.amplitude = snapshotRight.amplitude + (right.amplitude - snapshotRight.amplitude) * progress;
        }
      }
      if (event.masterVolume !== undefined) {
        masterVolume = snapshotMaster + (masterVolume - snapshotMaster) * progress;
      }
    }

    prevLeft = { ...left };
    prevRight = { ...right };
    prevMasterVolume = masterVolume;
  }

  return { left, right, masterVolume };
}
