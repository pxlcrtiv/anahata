import { useRef, useCallback, useState } from 'react';
import { encodeStereoBlob } from './wavEncoder';

/**
 * A tap factory routes an on-process handler off the master bus (the
 * engine provides it) and returns a teardown that removes the route.
 * The recorder never sees the graph itself.
 */
export type TapFactory = (onProcess: (e: AudioProcessingEvent) => void) => (() => void) | null;

/**
 * Capture + encode, no delivery: accumulates master-bus frames through
 * the provided tap and yields a 16-bit stereo WAV Blob on stop. The
 * caller decides what to do with the Blob (download it through the
 * downloadBlob seam, toast about it, …).
 */
export function createRecorder(createTap: TapFactory) {
  const leftChunks: Float32Array[] = [];
  const rightChunks: Float32Array[] = [];
  let sampleRate = 44100;

  const stopTap = createTap((e) => {
    sampleRate = e.inputBuffer.sampleRate;
    leftChunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
    rightChunks.push(new Float32Array(e.inputBuffer.getChannelData(1)));
  });

  return {
    stop(): Blob | null {
      stopTap?.();
      if (leftChunks.length === 0) return null;

      // Concatenate chunks (lengths may differ — the last chunk is often
      // short), then hand the channels to the shared WAV-Blob builder.
      const frames = leftChunks.reduce((n, chunk) => n + chunk.length, 0);
      const left = new Float32Array(frames);
      const right = new Float32Array(frames);
      let offset = 0;
      for (let i = 0; i < leftChunks.length; i++) {
        left.set(leftChunks[i], offset);
        right.set(rightChunks[i], offset);
        offset += leftChunks[i].length;
      }

      leftChunks.length = 0;
      rightChunks.length = 0;
      return encodeStereoBlob(left, right, sampleRate);
    },
  };
}

/** The recording file-name policy — pure, so it is testable. */
export function recordingFilename(startedAtMs: number, nowMs: number): string {
  const durationSec = Math.max(0, Math.round((nowMs - startedAtMs) / 1000));
  const ts = new Date(nowMs).toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `recording-${ts}-${durationSec}s.wav`;
}

/**
 * React glue around createRecorder: tracks the armed state and hands the
 * capture through. stopRecording returns the encoded Blob (or null) and
 * performs no DOM work — delivery belongs to the caller.
 */
export function useRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<ReturnType<typeof createRecorder> | null>(null);

  const startRecording = useCallback((createTap: TapFactory) => {
    if (recorderRef.current) return;
    recorderRef.current = createRecorder(createTap);
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback((): Blob | null => {
    const recorder = recorderRef.current;
    if (!recorder) return null;
    recorderRef.current = null;
    setIsRecording(false);
    return recorder.stop();
  }, []);

  return { startRecording, stopRecording, isRecording };
}
