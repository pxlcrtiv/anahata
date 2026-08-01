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
});
