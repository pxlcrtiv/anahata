
import { useRef, useCallback, useEffect } from 'react';
import type { EvaluatedState, Waveform } from '../sequencer/types';

export interface AudioEngineConfig {
  leftChannel: {
    frequency: number;
    waveform: Waveform;
    amplitude: number;
  };
  rightChannel: {
    frequency: number;
    waveform: Waveform;
    amplitude: number;
  };
  masterVolume: number;
}

export const useAudioEngine = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const leftOscillatorRef = useRef<OscillatorNode | null>(null);
  const rightOscillatorRef = useRef<OscillatorNode | null>(null);
  const leftGainRef = useRef<GainNode | null>(null);
  const rightGainRef = useRef<GainNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const leftAnalyserRef = useRef<AnalyserNode | null>(null);
  const rightAnalyserRef = useRef<AnalyserNode | null>(null);
  const isPlayingRef = useRef(false);

  // Peaks the most recent per-channel time-domain sample (0..1) for visualization.
  // Kept in refs so the visualizer can read them without re-rendering React.
  const leftDataRef = useRef<Uint8Array | null>(null);
  const rightDataRef = useRef<Uint8Array | null>(null);

  const nodesRef = useRef<{
    oscillators: OscillatorNode[];
    gains: GainNode[];
    analysers: AnalyserNode[];
    masterGain: GainNode | null;
  }>({ oscillators: [], gains: [], analysers: [], masterGain: null });

  const initializeAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Create master gain node
      masterGainRef.current = audioContextRef.current.createGain();
      nodesRef.current.masterGain = masterGainRef.current;
      masterGainRef.current.connect(audioContextRef.current.destination);
    }

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
  }, []);

  const startAudio = useCallback(async (config: AudioEngineConfig) => {
    await initializeAudioContext();
    if (!audioContextRef.current || !masterGainRef.current) return;

    // Stop existing oscillators
    stopAudio();

    const merger = audioContextRef.current.createChannelMerger(2);

    // Left channel: oscillator -> gain -> analyser -> merger
    leftOscillatorRef.current = audioContextRef.current.createOscillator();
    nodesRef.current.oscillators.push(leftOscillatorRef.current);
    leftGainRef.current = audioContextRef.current.createGain();
    nodesRef.current.gains.push(leftGainRef.current);
    leftAnalyserRef.current = audioContextRef.current.createAnalyser();
    nodesRef.current.analysers.push(leftAnalyserRef.current);
    leftAnalyserRef.current.fftSize = 2048;
    leftAnalyserRef.current.smoothingTimeConstant = 0.4;
    // 1024 samples gives a window of ~23ms at 44.1kHz — enough to show a few
    // cycles of low binaural beats while staying responsive.
    leftDataRef.current = new Uint8Array(leftAnalyserRef.current.frequencyBinCount);

    leftOscillatorRef.current.frequency.setValueAtTime(config.leftChannel.frequency, audioContextRef.current.currentTime);
    leftOscillatorRef.current.type = config.leftChannel.waveform;
    leftGainRef.current.gain.setValueAtTime(config.leftChannel.amplitude, audioContextRef.current.currentTime);

    leftOscillatorRef.current.connect(leftGainRef.current);
    leftGainRef.current.connect(leftAnalyserRef.current);
    leftAnalyserRef.current.connect(merger, 0, 0);

    // Right channel: oscillator -> gain -> analyser -> merger
    rightOscillatorRef.current = audioContextRef.current.createOscillator();
    nodesRef.current.oscillators.push(rightOscillatorRef.current);
    rightGainRef.current = audioContextRef.current.createGain();
    nodesRef.current.gains.push(rightGainRef.current);
    rightAnalyserRef.current = audioContextRef.current.createAnalyser();
    nodesRef.current.analysers.push(rightAnalyserRef.current);
    rightAnalyserRef.current.fftSize = 2048;
    rightAnalyserRef.current.smoothingTimeConstant = 0.4;
    rightDataRef.current = new Uint8Array(rightAnalyserRef.current.frequencyBinCount);

    rightOscillatorRef.current.frequency.setValueAtTime(config.rightChannel.frequency, audioContextRef.current.currentTime);
    rightOscillatorRef.current.type = config.rightChannel.waveform;
    rightGainRef.current.gain.setValueAtTime(config.rightChannel.amplitude, audioContextRef.current.currentTime);

    rightOscillatorRef.current.connect(rightGainRef.current);
    rightGainRef.current.connect(rightAnalyserRef.current);
    rightAnalyserRef.current.connect(merger, 0, 1);

    // Connect to master gain
    merger.connect(masterGainRef.current);
    masterGainRef.current.gain.setValueAtTime(config.masterVolume, audioContextRef.current.currentTime);

    // Start oscillators
    leftOscillatorRef.current.start();
    rightOscillatorRef.current.start();

    isPlayingRef.current = true;
  }, [initializeAudioContext]);

  const stopAudio = useCallback(() => {
    const now = audioContextRef.current?.currentTime ?? 0;

    // Quick fade to avoid a click, then tear down.
    if (masterGainRef.current && audioContextRef.current) {
      masterGainRef.current.gain.cancelScheduledValues(now);
      masterGainRef.current.gain.setValueAtTime(masterGainRef.current.gain.value, now);
      masterGainRef.current.gain.linearRampToValueAtTime(0, now + 0.02);
    }

    [leftOscillatorRef, rightOscillatorRef].forEach((ref) => {
      const osc = ref.current;
      if (osc) {
        try { osc.stop(now + 0.03); } catch { /* already stopped */ }
        osc.disconnect();
        ref.current = null;
      }
    });

    [leftGainRef, rightGainRef, leftAnalyserRef, rightAnalyserRef].forEach((ref) => {
      if (ref.current) {
        ref.current.disconnect();
        ref.current = null;
      }
    });
    leftDataRef.current = null;
    rightDataRef.current = null;

    if (masterGainRef.current) {
      masterGainRef.current.gain.setValueAtTime(0.7, now);
    }
    isPlayingRef.current = false;
    nodesRef.current.oscillators.length = 0;
    nodesRef.current.gains.length = 0;
    nodesRef.current.analysers.length = 0;
    // Note: masterGain ref is preserved so startAudio can reuse the AudioContext
  }, []);

  /**
   * Apply a fully-evaluated state to the running audio graph.
   * Idempotent — safe to call whether or not audio is currently playing.
   */
  const applyState = useCallback((state: EvaluatedState) => {
    if (!audioContextRef.current || !isPlayingRef.current) return;
    const now = audioContextRef.current.currentTime;

    if (leftOscillatorRef.current) {
      leftOscillatorRef.current.frequency.setValueAtTime(state.left.frequency, now);
      leftOscillatorRef.current.type = state.left.waveform;
    }
    if (rightOscillatorRef.current) {
      rightOscillatorRef.current.frequency.setValueAtTime(state.right.frequency, now);
      rightOscillatorRef.current.type = state.right.waveform;
    }
    if (leftGainRef.current) {
      leftGainRef.current.gain.setValueAtTime(state.left.amplitude, now);
    }
    if (rightGainRef.current) {
      rightGainRef.current.gain.setValueAtTime(state.right.amplitude, now);
    }
    if (masterGainRef.current) {
      masterGainRef.current.gain.setValueAtTime(state.masterVolume, now);
    }
  }, []);

  const getWaveformData = useCallback(() => {
    if (leftAnalyserRef.current && leftDataRef.current) {
      leftAnalyserRef.current.getByteTimeDomainData(leftDataRef.current);
    }
    if (rightAnalyserRef.current && rightDataRef.current) {
      rightAnalyserRef.current.getByteTimeDomainData(rightDataRef.current);
    }
    return { left: leftDataRef.current, right: rightDataRef.current };
  }, []);

  useEffect(() => {
    return () => {
      stopAudio();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopAudio]);

  /** Routes an off-master tap: connects the node to the master bus and
   *  returns a teardown that removes it. This is the only seam outside
   *  code gets to the graph — the graph itself stays private. The tap's
   *  output is muted before the destination, so the bus is never routed
   *  to the speakers twice. */
  const createMasterTap = useCallback(
    (onProcess: (e: AudioProcessingEvent) => void): (() => void) | null => {
      const ctx = audioContextRef.current;
      const master = masterGainRef.current;
      if (!ctx || !master) return null;

      // ScriptProcessorNode: deprecated, but adequate for a lightweight
      // accumulate-on-stop tap (no real-time rendering needs). AudioWorklet
      // is the recorded follow-up if recording jank is ever measured.
      const processor = ctx.createScriptProcessor(4096, 2, 2);
      processor.onaudioprocess = onProcess;
      const sink = ctx.createGain();
      sink.gain.value = 0;
      master.connect(processor);
      processor.connect(sink);
      sink.connect(ctx.destination);

      return () => {
        processor.onaudioprocess = null;
        try { processor.disconnect(); } catch { /* already gone */ }
        try { master.disconnect(processor); } catch { /* already gone */ }
        try { sink.disconnect(); } catch { /* already gone */ }
      };
    },
    [],
  );

  return {
    startAudio,
    stopAudio,
    applyState,
    getWaveformData,
    isPlaying: isPlayingRef.current,
    createMasterTap,
    getCreatedNodes: () => nodesRef.current,
  };
};
