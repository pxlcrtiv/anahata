import { useRef, useCallback, useState } from 'react';
import { encodeWAV } from './wavEncoder';

/**
 * Captures live audio from a master GainNode and exports as a 16-bit stereo WAV.
 *
 * Usage:
 *   const { startRecording, stopRecording, isRecording } = useRecording();
 *   startRecording(audioContext, masterGainNode);
 *   // ... later ...
 *   stopRecording(); // encodes and triggers download
 */
export function useRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const samplesRef = useRef<Float32Array[]>([]);
  const startTimeRef = useRef(0);
  const processorContextRef = useRef<AudioContext | null>(null);

  const startRecording = useCallback(
    (audioContext: AudioContext, masterGain: GainNode) => {
      if (processorRef.current) return;

      const bufferSize = 4096;
      const processor = audioContext.createScriptProcessor(bufferSize, 2, 2);

      samplesRef.current = [];
      startTimeRef.current = performance.now();
      processorContextRef.current = audioContext;

      processor.onaudioprocess = (e: AudioProcessingEvent) => {
        const left = new Float32Array(e.inputBuffer.getChannelData(0));
        const right = new Float32Array(e.inputBuffer.getChannelData(1));
        samplesRef.current.push(left, right);
      };

      masterGain.connect(processor);
      processor.connect(audioContext.destination);
      processorRef.current = processor;
      setIsRecording(true);
    },
    [],
  );

  const stopRecording = useCallback((): Blob | null => {
    const processor = processorRef.current;
    if (!processor) return null;

    const ctx = processorContextRef.current;

    // Disconnect first to prevent further callbacks
    processor.disconnect();
    processor.onaudioprocess = null;
    processorRef.current = null;
    processorContextRef.current = null;
    setIsRecording(false);

    if (samplesRef.current.length === 0) return null;

    // Interleave L/R channels into a single Float32Array
    const numFrames = samplesRef.current[0].length;
    const numChunks = samplesRef.current.length / 2;
    const totalFrames = numChunks * numFrames;
    const interleaved = new Float32Array(totalFrames * 2);

    for (let chunk = 0; chunk < numChunks; chunk++) {
      const left = samplesRef.current[chunk * 2];
      const right = samplesRef.current[chunk * 2 + 1];
      for (let i = 0; i < numFrames; i++) {
        const idx = (chunk * numFrames + i) * 2;
        interleaved[idx] = left[i];
        interleaved[idx + 1] = right[i];
      }
    }

    const sampleRate = ctx?.sampleRate ?? 44100;
    const wavBuffer = encodeWAV(interleaved, 2, sampleRate);
    const blob = new Blob([wavBuffer], { type: 'audio/wav' });

    // Trigger download
    const durationMs = performance.now() - startTimeRef.current;
    const durationSec = Math.round(durationMs / 1000);
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `recording-${ts}-${durationSec}s.wav`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    return blob;
  }, []);

  return { startRecording, stopRecording, isRecording };
}
