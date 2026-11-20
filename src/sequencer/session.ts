import { WAVEFORMS } from './types';
import type { Session } from './types';

export function serializeSession(session: Session): string {
  return JSON.stringify(session);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function validateChannelSide(side: unknown, label: string): void {
  if (side === undefined) return;
  if (typeof side !== 'object' || side === null) {
    throw new Error(`Invalid event: ${label} must be an object`);
  }
  const channel = side as Record<string, unknown>;
  if (channel.frequency !== undefined && !isFiniteNumber(channel.frequency)) {
    throw new Error(`Invalid event: ${label}.frequency must be a finite number`);
  }
  if (
    channel.waveform !== undefined &&
    !(typeof channel.waveform === 'string' && (WAVEFORMS as readonly string[]).includes(channel.waveform))
  ) {
    throw new Error(`Invalid event: ${label}.waveform must be one of ${WAVEFORMS.join(', ')}`);
  }
  if (channel.amplitude !== undefined && !isFiniteNumber(channel.amplitude)) {
    throw new Error(`Invalid event: ${label}.amplitude must be a finite number`);
  }
}

function validateEvent(event: unknown, index: number): void {
  if (typeof event !== 'object' || event === null) {
    throw new Error(`Invalid event #${index}: must be an object`);
  }
  const e = event as Record<string, unknown>;
  if (typeof e.id !== 'string') {
    throw new Error(`Invalid event #${index}: id must be a string`);
  }
  if (!isFiniteNumber(e.timeMs)) {
    throw new Error(`Invalid event #${index}: timeMs must be a finite number`);
  }
  if (e.rampMs !== undefined && !isFiniteNumber(e.rampMs)) {
    throw new Error('Invalid event: rampMs must be a finite number');
  }
  if (e.masterVolume !== undefined && !isFiniteNumber(e.masterVolume)) {
    throw new Error('Invalid event: masterVolume must be a finite number');
  }
  validateChannelSide(e.left, 'left');
  validateChannelSide(e.right, 'right');
}

/**
 * Validates a session JSON string and returns the Session.
 *
 * The guarantee every consumer trusts: after this returns, every event's
 * fields are the right shape — numeric where the graph and the encoder
 * need numbers, an known waveform where they need a waveform. Garbage
 * (strings, nulls, NaN-as-null) throws at this boundary instead of
 * reaching setValueAtTime or the WAV encoder.
 */
export function deserializeSession(json: string): Session {
  const parsed = JSON.parse(json);

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    typeof parsed.id !== 'string' ||
    typeof parsed.name !== 'string' ||
    !isFiniteNumber(parsed.durationMs) ||
    typeof parsed.loop !== 'boolean' ||
    !Array.isArray(parsed.events)
  ) {
    throw new Error('Invalid session JSON: missing required fields');
  }

  parsed.events.forEach(validateEvent);

  return parsed as Session;
}
