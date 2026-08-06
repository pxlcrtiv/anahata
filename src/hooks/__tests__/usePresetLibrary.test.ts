import { describe, it, expect, beforeEach } from 'vitest';
import {
  serializePresets,
  deserializePresets,
  DEFAULT_PRESETS,
  validateFrequency,
  STORAGE_KEY,
} from '../usePresetLibrary';
import type { Preset } from '../usePresetLibrary';

describe('serializePresets / deserializePresets', () => {
  const samplePresets: Preset[] = [
    { id: 'test-1', name: 'Test Tone', freq: 440, desc: 'A4 note', color: 'from-red-500 to-orange-600' },
    { id: 'test-2', name: 'Low Hum', freq: 60, desc: 'Grounding', color: 'from-gray-500 to-gray-700' },
  ];

  it('round-trips presets through serialize/deserialize', () => {
    const json = serializePresets(samplePresets);
    const restored = deserializePresets(json);
    expect(restored).toEqual(samplePresets);
  });

  it('handles an empty array', () => {
    const restored = deserializePresets(serializePresets([]));
    expect(restored).toEqual([]);
  });

  it('throws on invalid JSON', () => {
    expect(() => deserializePresets('not json')).toThrow();
  });

  it('throws when JSON is not an array', () => {
    expect(() => deserializePresets('{}')).toThrow('expected array');
  });

  it('throws when a preset is missing required fields', () => {
    const bad = JSON.stringify([{ id: 'x', name: 'Y' }]);
    expect(() => deserializePresets(bad)).toThrow('missing required fields');
  });
});

describe('validateFrequency', () => {
  it('accepts valid frequencies', () => {
    expect(validateFrequency(1)).toBe(true);
    expect(validateFrequency(440)).toBe(true);
    expect(validateFrequency(20000)).toBe(true);
  });

  it('rejects out-of-range frequencies', () => {
    expect(validateFrequency(0)).toBe(false);
    expect(validateFrequency(-10)).toBe(false);
    expect(validateFrequency(20001)).toBe(false);
  });

  it('rejects non-finite values', () => {
    expect(validateFrequency(NaN)).toBe(false);
    expect(validateFrequency(Infinity)).toBe(false);
  });
});

describe('DEFAULT_PRESETS', () => {
  it('has at least one preset', () => {
    expect(DEFAULT_PRESETS.length).toBeGreaterThan(0);
  });

  it('all presets have required fields', () => {
    for (const p of DEFAULT_PRESETS) {
      expect(typeof p.id).toBe('string');
      expect(typeof p.name).toBe('string');
      expect(typeof p.freq).toBe('number');
      expect(typeof p.desc).toBe('string');
      expect(typeof p.color).toBe('string');
    }
  });

  it('all frequencies are within valid range', () => {
    for (const p of DEFAULT_PRESETS) {
      expect(validateFrequency(p.freq)).toBe(true);
    }
  });
});
