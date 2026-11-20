import { describe, it, expect } from 'vitest';
import { serializeSession, deserializeSession } from '../session';
import type { Session } from '../types';

describe('serializeSession / deserializeSession', () => {
  const sampleSession: Session = {
    id: 'test-1',
    name: 'My Session',
    durationMs: 10000,
    loop: true,
    events: [
      {
        id: 'e1',
        timeMs: 0,
        left: { frequency: 200, waveform: 'square', amplitude: 0.8 },
        masterVolume: 0.5,
      },
      {
        id: 'e2',
        timeMs: 5000,
        right: { frequency: 400, waveform: 'sawtooth' },
        rampMs: 1000,
      },
    ],
  };

  it('round-trips a session through serialize/deserialize', () => {
    const json = serializeSession(sampleSession);
    const restored = deserializeSession(json);

    expect(restored).toEqual(sampleSession);
  });

  it('handles a session with no events', () => {
    const empty: Session = {
      id: 'empty',
      name: 'Empty',
      durationMs: 5000,
      loop: false,
      events: [],
    };

    const restored = deserializeSession(serializeSession(empty));
    expect(restored).toEqual(empty);
  });

  it('throws on invalid JSON', () => {
    expect(() => deserializeSession('not json')).toThrow();
  });

  it('throws on missing required fields', () => {
    expect(() => deserializeSession('{}')).toThrow();
  });

  it('rejects a non-finite durationMs (1e999 parses to Infinity)', () => {
    const raw = '{"id":"s","name":"N","durationMs":1e999,"loop":false,"events":[]}';
    expect(() => deserializeSession(raw)).toThrow('Invalid session JSON');
  });
});

describe('event-item validation', () => {
  const base = { id: 's', name: 'N', durationMs: 1000, loop: false };

  const withEvent = (event: unknown) =>
    JSON.stringify({ ...base, events: [event] });

  it('rejects a non-numeric timeMs', () => {
    expect(() => deserializeSession(withEvent({ id: 'e1', timeMs: 'abc' }))).toThrow(/timeMs/);
  });

  it('rejects a non-numeric frequency (string)', () => {
    expect(() =>
      deserializeSession(withEvent({ id: 'e1', timeMs: 0, left: { frequency: '440' } })),
    ).toThrow(/frequency/);
  });

  it('rejects a NaN frequency (serializes to null)', () => {
    expect(() =>
      deserializeSession(withEvent({ id: 'e1', timeMs: 0, left: { frequency: NaN } })),
    ).toThrow(/frequency/);
  });

  it('rejects an unknown waveform', () => {
    expect(() =>
      deserializeSession(withEvent({ id: 'e1', timeMs: 0, left: { waveform: 'wobble' } })),
    ).toThrow(/waveform/);
  });

  it('rejects a non-numeric rampMs', () => {
    expect(() => deserializeSession(withEvent({ id: 'e1', timeMs: 0, rampMs: '100' }))).toThrow(/rampMs/);
  });

  it('rejects a non-numeric masterVolume', () => {
    expect(() =>
      deserializeSession(withEvent({ id: 'e1', timeMs: 0, masterVolume: '0.5' })),
    ).toThrow(/masterVolume/);
  });

  it('rejects a non-numeric amplitude', () => {
    expect(() =>
      deserializeSession(withEvent({ id: 'e1', timeMs: 0, right: { amplitude: null } })),
    ).toThrow(/amplitude/);
  });

  it('round-trips a valid partial event unchanged', () => {
    const event = { id: 'e1', timeMs: 0, left: { frequency: 200 } };
    const restored = deserializeSession(withEvent(event));
    expect(restored.events).toEqual([event]);
  });

  it('round-trips a valid full event with a ramp unchanged', () => {
    const event = {
      id: 'e1',
      timeMs: 500,
      left: { frequency: 300, waveform: 'square', amplitude: 0.8 },
      right: { frequency: 310, waveform: 'sine' },
      masterVolume: 0.4,
      rampMs: 1000,
    };
    const restored = deserializeSession(withEvent(event));
    expect(restored.events).toEqual([event]);
  });
});
