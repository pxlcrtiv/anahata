import { useRef, useState, useCallback } from 'react';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { useSequencer } from '../hooks/useSequencer';
import { useRecording } from '../audio/recording';
import { interpolateState, DEFAULT_CROSSFADE_MS } from '../sequencer/crossfade';
import { evaluateSession } from '../sequencer/evaluate';
import type { Session, EvaluatedState, ChannelState } from '../sequencer/types';

/**
 * The transport — the single owner of play state, engine lifecycle, recorder
 * lifecycle, and the crossfade machine.
 *
 * One mode ref ('idle' | 'manual' | 'sequencer') decides who writes the
 * engine, so exactly one writer can be live at a time: sequencer ticks,
 * manual edits (gated), or nobody. Every stop path — player stop, transport
 * stop, pause, natural end — passes through here, so the engine, the
 * sequencer, and the recorder can never disagree about what is playing.
 */

type Mode = 'idle' | 'manual' | 'sequencer';

export interface ManualConfig {
  left: ChannelState;
  right: ChannelState;
  masterVolume: number;
}

export function useTransport() {
  const { startAudio, stopAudio, applyState, getWaveformData, getAudioContext, getMasterGain } = useAudioEngine();
  const { startRecording, stopRecording, isRecording } = useRecording();

  const modeRef = useRef<Mode>('idle');
  const latchRef = useRef(false); // sequencer: start the engine on the first tick only
  const crossfadeRef = useRef<{
    from: EvaluatedState;
    to: EvaluatedState;
    startTime: number;
    duration: number;
  } | null>(null);
  const lastTickStateRef = useRef<EvaluatedState | null>(null);
  const crossfadeDurationRef = useRef(DEFAULT_CROSSFADE_MS);

  const [engineLive, setEngineLive] = useState(false);

  const stopRecordingIfRolling = useCallback(() => {
    if (isRecording) stopRecording();
  }, [isRecording, stopRecording]);

  // The sequencer's tick — the only sequencer → engine writer.
  const handleTick = useCallback(
    (state: EvaluatedState) => {
      let effectiveState = state;

      if (crossfadeRef.current) {
        const elapsed = performance.now() - crossfadeRef.current.startTime;
        const progress = Math.min(1, elapsed / crossfadeRef.current.duration);
        effectiveState = interpolateState(crossfadeRef.current.from, crossfadeRef.current.to, progress);
        if (progress >= 1) crossfadeRef.current = null;
      }

      lastTickStateRef.current = effectiveState;
      modeRef.current = 'sequencer';

      if (!latchRef.current) {
        startAudio({
          leftChannel: { ...effectiveState.left },
          rightChannel: { ...effectiveState.right },
          masterVolume: effectiveState.masterVolume,
        });
        latchRef.current = true;
        setEngineLive(true);
      } else {
        applyState(effectiveState);
      }
    },
    [startAudio, applyState],
  );

  // Natural end of a non-loop session: stop everything this transport owns.
  const handleEnd = useCallback(() => {
    latchRef.current = false;
    crossfadeRef.current = null;
    modeRef.current = 'idle';
    stopAudio();
    setEngineLive(false);
    stopRecordingIfRolling();
  }, [stopAudio, stopRecordingIfRolling]);

  const sequencer = useSequencer(handleTick, handleEnd);

  // ---- manual mode ----

  const playManual = useCallback(
    async (config: ManualConfig) => {
      if (modeRef.current === 'sequencer') {
        // Manual play takes the engine: pause the sequencer first (one writer).
        sequencer.pause();
        latchRef.current = false;
        crossfadeRef.current = null;
      }
      await startAudio(config);
      modeRef.current = 'manual';
      setEngineLive(true);
    },
    [startAudio, sequencer.pause],
  );

  const pauseManual = useCallback(() => {
    stopAudio();
    modeRef.current = 'idle';
    setEngineLive(false);
  }, [stopAudio]);

  /** Manual parameter writes are gated to manual mode — the sequencer owns
   *  the engine while it plays, so a mixer edit can never be written and
   *  then reverted by the next tick. */
  const applyManual = useCallback(
    (state: EvaluatedState) => {
      if (modeRef.current !== 'manual') return;
      applyState(state);
    },
    [applyState],
  );

  // ---- sequencer mode ----

  const playSequencer = useCallback(() => {
    if (modeRef.current === 'manual') {
      stopAudio(); // drop the manual engine before the sequencer takes over
      setEngineLive(false);
    }
    modeRef.current = 'sequencer';
    latchRef.current = false; // a fresh start begins on the first tick
    sequencer.play();
    setEngineLive(true);
  }, [sequencer.play, stopAudio]);

  const pauseSequencer = useCallback(() => {
    sequencer.pause();
    latchRef.current = false;
    crossfadeRef.current = null;
    modeRef.current = 'idle';
    stopAudio();
    setEngineLive(false);
  }, [sequencer.pause, stopAudio]);

  /** The one stop: sequencer, engine, and recorder together. */
  const stopTransport = useCallback(() => {
    sequencer.stop();
    latchRef.current = false;
    crossfadeRef.current = null;
    modeRef.current = 'idle';
    stopAudio();
    setEngineLive(false);
    stopRecordingIfRolling();
  }, [sequencer.stop, stopAudio, stopRecordingIfRolling]);

  // ---- session edits (the crossfade machine lives here too) ----

  const changeSession = useCallback(
    (newSession: Session) => {
      if (modeRef.current === 'sequencer' && latchRef.current && lastTickStateRef.current) {
        crossfadeRef.current = {
          from: lastTickStateRef.current,
          to: evaluateSession(newSession, 0),
          startTime: performance.now(),
          duration: crossfadeDurationRef.current,
        };
      }
      sequencer.setSession(newSession);
    },
    [sequencer.setSession],
  );

  const setCrossfadeDuration = useCallback((ms: number) => {
    crossfadeDurationRef.current = ms;
  }, []);

  // ---- recording ----

  const toggleRecord = useCallback(() => {
    if (isRecording) {
      stopRecording();
      return;
    }
    const ctx = getAudioContext();
    const master = getMasterGain();
    if (ctx && master) startRecording(ctx, master);
  }, [isRecording, stopRecording, getAudioContext, getMasterGain, startRecording]);

  // ---- display: what is actually sounding ----

  const getDisplayState = useCallback((fallback: EvaluatedState): EvaluatedState => {
    if (modeRef.current === 'sequencer' && lastTickStateRef.current) {
      return lastTickStateRef.current;
    }
    return fallback;
  }, []);

  return {
    // sequencer surface (TransportBar + editors)
    session: sequencer.session,
    setSession: changeSession,
    positionMs: sequencer.positionMs,
    seek: sequencer.seek,
    sequencerPlaying: sequencer.isPlaying,
    play: playSequencer,
    pause: pauseSequencer,
    stop: stopTransport,
    // manual surface (PlayerControls + mixer)
    engineLive,
    playManual,
    pauseManual,
    applyManual,
    // recording
    isRecording,
    toggleRecord,
    // display + data
    getDisplayState,
    getWaveformData,
    setCrossfadeDuration,
  };
}
