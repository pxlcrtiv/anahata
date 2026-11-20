import { prepareSession, evaluatePrepared } from '../sequencer/evaluate';
import type { Session, Waveform } from '../sequencer/types';

const TWO_PI = 2 * Math.PI;

export interface RenderedSession {
  left: Float32Array;
  right: Float32Array;
  sampleRate: number;
  durationMs: number;
}

/**
 * Renders a Session to stereo sample arrays, honoring events, ramps, and
 * duration — exactly what the transport plays.
 *
 * Frequency changes (including ramps) are phase-continuous: each sample
 * advances the channel phase by the *instantaneous* frequency, so a ramped
 * tone glides instead of warbling the way time-based sin(2πft) does when f
 * changes. Loop sessions render exactly one cycle.
 *
 * Synchronous rendering on the caller's thread is a documented decision
 * (issue #45): after the sort removal, typical sessions render in well
 * under a second; a worker or chunked render is the recorded follow-up
 * if long sessions ever need it.
 */
export function renderSessionToStereo(session: Session, sampleRate: number): RenderedSession {
  const total = Math.max(1, Math.floor((session.durationMs / 1000) * sampleRate));
  const left = new Float32Array(total);
  const right = new Float32Array(total);

  // Prepare once: the sample loop evaluates thousands of times, and each
  // call must not re-sort the session's events.
  const prepared = prepareSession(session);

  const dt = 1 / sampleRate;
  const dtMs = (1 / sampleRate) * 1000;
  let phaseL = 0;
  let phaseR = 0;
  let tMs = 0;

  for (let i = 0; i < total; i++) {
    const state = evaluatePrepared(prepared, tMs);

    phaseL += TWO_PI * state.left.frequency * dt;
    phaseR += TWO_PI * state.right.frequency * dt;

    left[i] = waveSample(state.left.waveform, phaseL) * state.left.amplitude * state.masterVolume;
    right[i] = waveSample(state.right.waveform, phaseR) * state.right.amplitude * state.masterVolume;

    tMs += dtMs;
  }

  return { left, right, sampleRate, durationMs: session.durationMs };
}

function waveSample(waveform: Waveform, phase: number): number {
  switch (waveform) {
    case 'sine':
      return Math.sin(phase);
    case 'square':
      return Math.sign(Math.sin(phase));
    case 'triangle':
      return (2 / Math.PI) * Math.asin(Math.sin(phase));
    case 'sawtooth': {
      const cycle = phase / TWO_PI;
      return 2 * (cycle - Math.floor(cycle + 0.5));
    }
  }
}

/** Interleaves left/right sample arrays into one L,R,L,R,… array —
 *  see wavEncoder, which owns the WAV-prep helpers. */
