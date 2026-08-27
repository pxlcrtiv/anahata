import { describe, it, expect } from 'vitest';
import { encodeWAV } from '../wavEncoder';

describe('recording WAV output', () => {
  it('produces correct file size for a known-duration stereo recording', () => {
    const sampleRate = 44100;
    const durationSec = 2;
    const totalFrames = sampleRate * durationSec;

    // Simulate what useRecording.stopRecording does: interleave L/R
    const left = new Float32Array(totalFrames).fill(0.5);
    const right = new Float32Array(totalFrames).fill(-0.5);
    const interleaved = new Float32Array(totalFrames * 2);
    for (let i = 0; i < totalFrames; i++) {
      interleaved[i * 2] = left[i];
      interleaved[i * 2 + 1] = right[i];
    }

    const buf = encodeWAV(interleaved, 2, sampleRate);
    const expectedBytes = 44 + interleaved.length * 2;
    expect(buf.byteLength).toBe(expectedBytes);
  });

  it('blob from recorded data is non-empty and has expected type', () => {
    const sampleRate = 44100;
    const totalFrames = sampleRate; // 1 second
    const interleaved = new Float32Array(totalFrames * 2);

    const buf = encodeWAV(interleaved, 2, sampleRate);
    const blob = new Blob([buf], { type: 'audio/wav' });
    expect(blob.size).toBeGreaterThan(44);
    expect(blob.type).toBe('audio/wav');
  });

  it('silence recording produces correct-sized WAV', () => {
    const sampleRate = 22050;
    const totalFrames = sampleRate * 3; // 3 seconds
    const interleaved = new Float32Array(totalFrames * 2); // all zeros

    const buf = encodeWAV(interleaved, 2, sampleRate);
    // 44 header + (3*22050*2) * 2 data bytes = 44 + 264600 = 264644
    expect(buf.byteLength).toBe(44 + totalFrames * 2 * 2);
  });
});
