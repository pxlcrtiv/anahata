import type { Session, SessionEvent, EvaluatedState, ChannelState, Waveform } from './types';

/** The baseline state a session starts from — the single home for the
 *  default channel values and master volume. */
export const BASELINE: EvaluatedState = {
  left: { frequency: 528, waveform: 'sine', amplitude: 0.5 },
  right: { frequency: 528, waveform: 'sine', amplitude: 0.5 },
  masterVolume: 0.7,
};

/**
 * A session with its events sorted once, ready for repeated evaluation.
 * The per-sample export and the per-frame transport both evaluate a
 * session thousands of times; preparing once removes the repeated sort
 * (and the allocation behind it) from every subsequent call.
 */
export interface PreparedSession {
  session: Session;
  sortedEvents: SessionEvent[];
}

export function prepareSession(session: Session): PreparedSession {
  return {
    session,
    sortedEvents: [...session.events].sort((a, b) => a.timeMs - b.timeMs),
  };
}

/** Evaluates a prepared session at timeMs. Identical semantics to
 *  evaluateSession — the equivalence tests pin the two together. */
export function evaluatePrepared(prepared: PreparedSession, timeMs: number): EvaluatedState {
  const { session, sortedEvents } = prepared;
  const t = session.loop ? timeMs % session.durationMs : timeMs;

  const left: ChannelState = { ...BASELINE.left };
  const right: ChannelState = { ...BASELINE.right };
  let masterVolume = BASELINE.masterVolume;

  // Track "pre-ramp" values for interpolation
  let prevLeft: ChannelState = { ...BASELINE.left };
  let prevRight: ChannelState = { ...BASELINE.right };
  let prevMasterVolume = BASELINE.masterVolume;

  for (const event of sortedEvents) {
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

/**
 * Convenience one-shot: prepare and evaluate. Correct but sorts on every
 * call — hot paths (the exporter's sample loop, the transport's tick)
 * should prepare once and call evaluatePrepared.
 */
export function evaluateSession(session: Session, timeMs: number): EvaluatedState {
  return evaluatePrepared(prepareSession(session), timeMs);
}
