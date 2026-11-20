import { describe, it, expect, vi } from 'vitest';
import { createRecorder, recordingFilename } from '../recording';

function fakeEvent(channels: [Float32Array, Float32Array], sampleRate: number): AudioProcessingEvent {
  return {
    inputBuffer: {
      sampleRate,
      getChannelData: (i: number) => channels[i],
    },
  } as unknown as AudioProcessingEvent;
}

describe('createRecorder', () => {
  it('returns null when nothing was captured, and tears the tap down', () => {
    let onProcess: ((e: AudioProcessingEvent) => void) | null = null;
    const teardown = vi.fn();

    const recorder = createRecorder((cb) => {
      onProcess = cb;
      return teardown;
    });
    void onProcess;

    expect(recorder.stop()).toBeNull();
    expect(teardown).toHaveBeenCalledTimes(1);
  });

  it('encodes captured frames to a stereo WAV blob of the exact size', () => {
    let onProcess: ((e: AudioProcessingEvent) => void) | null = null;
    const teardown = vi.fn();
    const recorder = createRecorder((cb) => {
      onProcess = cb;
      return teardown;
    });

    // Two chunks, the second shorter than the first — concatenation must
    // honour per-chunk lengths (the old interleave assumed equal chunks).
    onProcess!(fakeEvent([new Float32Array([0.5, -0.5, 0.25]), new Float32Array([-0.5, 0.5, -0.25])], 22050));
    onProcess!(fakeEvent([new Float32Array([0.1]), new Float32Array([-0.1])], 22050));

    const blob = recorder.stop()!;
    expect(teardown).toHaveBeenCalledTimes(1);
    expect(blob.type).toBe('audio/wav');
    // 44-byte header + 4 frames x 2 channels x 2 bytes.
    expect(blob.size).toBe(44 + 4 * 2 * 2);
  });

  it('uses the sample rate the tap reported', async () => {
    let onProcess: ((e: AudioProcessingEvent) => void) | null = null;
    const recorder = createRecorder((cb) => {
      onProcess = cb;
      return null;
    });

    onProcess!(fakeEvent([new Float32Array([0]), new Float32Array([0])], 22050));
    const blob = (await recorder.stop()!.arrayBuffer()) as ArrayBuffer;

    // WAV header: sample rate is a uint32 at byte offset 24.
    expect(new DataView(blob).getUint32(24, true)).toBe(22050);
  });

  it('a second stop after teardown returns null', () => {
    let onProcess: ((e: AudioProcessingEvent) => void) | null = null;
    const recorder = createRecorder((cb) => {
      onProcess = cb;
      return vi.fn();
    });
    onProcess!(fakeEvent([new Float32Array([1]), new Float32Array([-1])], 44100));

    const first = recorder.stop();
    expect(first).not.toBeNull();
    // The recorder is spent: chunks are cleared, a second stop yields nothing.
    expect(recorder.stop()).toBeNull();
  });
});

describe('recordingFilename', () => {
  it('names by ISO timestamp and rounded duration', () => {
    const started = Date.parse('2026-11-20T04:00:00.000Z');
    const now = started + 12_400;
    expect(recordingFilename(started, now)).toBe('recording-2026-11-20T04-00-12-12s.wav');
  });

  it('rounds sub-second durations to 0s', () => {
    const started = Date.parse('2026-11-20T04:00:00.000Z');
    expect(recordingFilename(started, started + 400)).toContain('-0s.wav');
  });
});
