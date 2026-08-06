import { describe, it, expect } from 'vitest';
import { encodeWAV } from '../wavEncoder';

describe('encodeWAV', () => {
  it('writes correct RIFF/WAVE header for 1 channel', () => {
    const samples = new Float32Array([0, 0.5, -0.5, 1]);
    const buf = encodeWAV(samples, 1, 44100);
    const view = new DataView(buf);

    // RIFF header
    expect(view.getUint32(0, true)).toBe(0x46464952); // "RIFF"
    expect(view.getUint32(4, true)).toBe(buf.byteLength - 8);
    expect(view.getUint32(8, true)).toBe(0x45564157); // "WAVE"

    // fmt chunk
    expect(view.getUint32(12, true)).toBe(0x20746d66); // "fmt "
    expect(view.getUint32(16, true)).toBe(16); // chunk size
    expect(view.getUint16(20, true)).toBe(1); // PCM
    expect(view.getUint16(22, true)).toBe(1); // mono
    expect(view.getUint32(24, true)).toBe(44100); // sample rate
    expect(view.getUint32(28, true)).toBe(44100 * 2); // byte rate
    expect(view.getUint16(32, true)).toBe(2); // block align
    expect(view.getUint16(34, true)).toBe(16); // bits per sample

    // data chunk
    expect(view.getUint32(36, true)).toBe(0x61746164); // "data"
    expect(view.getUint32(40, true)).toBe(samples.length * 2); // data size
  });

  it('writes correct RIFF/WAVE header for 2 channels', () => {
    const samples = new Float32Array([0, 0, 0.5, -0.5]);
    const buf = encodeWAV(samples, 2, 44100);
    const view = new DataView(buf);

    expect(view.getUint16(22, true)).toBe(2); // stereo
    expect(view.getUint32(28, true)).toBe(44100 * 4); // byte rate
    expect(view.getUint16(32, true)).toBe(4); // block align
    expect(view.getUint32(40, true)).toBe(samples.length * 2); // data size
  });

  it('returns correct byte length for mono', () => {
    const numSamples = 100;
    const samples = new Float32Array(numSamples);
    const buf = encodeWAV(samples, 1, 22050);
    expect(buf.byteLength).toBe(44 + numSamples * 2);
  });

  it('returns correct byte length for stereo', () => {
    const numSamples = 200; // interleaved L/R
    const samples = new Float32Array(numSamples);
    const buf = encodeWAV(samples, 2, 44100);
    expect(buf.byteLength).toBe(44 + numSamples * 2);
  });

  it('encodes positive sample correctly', () => {
    const samples = new Float32Array([0.5]);
    const buf = encodeWAV(samples, 1, 44100);
    const view = new DataView(buf);
    const sample = view.getInt16(44, true);
    // 0.5 * 32767 = 16383.5 -> 16383
    expect(sample).toBe(16383);
  });

  it('encodes negative sample correctly', () => {
    const samples = new Float32Array([-0.5]);
    const buf = encodeWAV(samples, 1, 44100);
    const view = new DataView(buf);
    const sample = view.getInt16(44, true);
    // -0.5 < 0: s * 32768 = -16384
    expect(sample).toBe(-16384);
  });

  it('clamps values outside [-1, 1]', () => {
    const samples = new Float32Array([1.5, -1.5]);
    const buf = encodeWAV(samples, 1, 44100);
    const view = new DataView(buf);
    expect(view.getInt16(44, true)).toBe(32767);  // clamped to 1
    expect(view.getInt16(46, true)).toBe(-32768);  // clamped to -1
  });

  it('encodes silence as zeros', () => {
    const samples = new Float32Array([0, 0, 0]);
    const buf = encodeWAV(samples, 1, 44100);
    const view = new DataView(buf);
    for (let i = 0; i < samples.length; i++) {
      expect(view.getInt16(44 + i * 2, true)).toBe(0);
    }
  });

  it('handles different sample rates', () => {
    const samples = new Float32Array([0]);
    const buf = encodeWAV(samples, 1, 22050);
    const view = new DataView(buf);
    expect(view.getUint32(24, true)).toBe(22050);
    expect(view.getUint32(28, true)).toBe(22050 * 2);
  });

  it('round-trips known value through encode', () => {
    const val = 0.25;
    const samples = new Float32Array([val]);
    const buf = encodeWAV(samples, 1, 48000);
    const view = new DataView(buf);
    const encoded = view.getInt16(44, true);
    // 0.25 >= 0: s * 32767 = 8191.75, |0 = 8191
    expect(encoded).toBe((val * 32767) | 0);
  });

  it('produces expected file size for known duration', () => {
    const sampleRate = 44100;
    const durationSec = 1;
    const numSamples = sampleRate * durationSec; // mono: 44100 samples
    const samples = new Float32Array(numSamples);
    const buf = encodeWAV(samples, 1, sampleRate);
    // 44 header + 44100 * 2 data = 88244
    expect(buf.byteLength).toBe(44 + numSamples * 2);
  });
});
