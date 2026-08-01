import { useState, useRef, useCallback, useEffect } from 'react';
import { evaluateSession } from '../sequencer/evaluate';
import type { Session, EvaluatedState } from '../sequencer/types';

const BASELINE_STATE: EvaluatedState = {
  left: { frequency: 528, waveform: 'sine', amplitude: 0.5 },
  right: { frequency: 528, waveform: 'sine', amplitude: 0.5 },
  masterVolume: 0.7,
};

const DEFAULT_SESSION: Session = {
  id: '',
  name: 'Untitled',
  durationMs: 10000,
  loop: false,
  events: [],
};

export function useSequencer(onTick: (state: EvaluatedState) => void) {
  const [session, setSession] = useState<Session>(DEFAULT_SESSION);
  const [positionMs, setPositionMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const sessionRef = useRef(session);
  const positionRef = useRef(positionMs);
  const isPlayingRef = useRef(isPlaying);
  const rafRef = useRef<number | null>(null);
  const startTimestampRef = useRef<number | null>(null);
  const startOffsetRef = useRef(0);
  const onTickRef = useRef(onTick);

  sessionRef.current = session;
  positionRef.current = positionMs;
  isPlayingRef.current = isPlaying;
  onTickRef.current = onTick;

  const tick = useCallback(() => {
    if (!isPlayingRef.current) return;

    const now = performance.now();
    const elapsed = now - (startTimestampRef.current ?? now);
    let currentMs = startOffsetRef.current + elapsed;

    const dur = sessionRef.current.durationMs;

    if (sessionRef.current.loop) {
      currentMs = currentMs % dur;
    } else if (currentMs >= dur) {
      currentMs = dur;
      // Stop at end
      isPlayingRef.current = false;
      setIsPlaying(false);
      setPositionMs(dur);
      const state = evaluateSession(sessionRef.current, dur);
      onTickRef.current(state);
      return;
    }

    positionRef.current = currentMs;
    setPositionMs(currentMs);

    const state = evaluateSession(sessionRef.current, currentMs);
    onTickRef.current(state);

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const play = useCallback(() => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;
    setIsPlaying(true);
    startTimestampRef.current = performance.now();
    startOffsetRef.current = positionRef.current;
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const pause = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    pause();
    positionRef.current = 0;
    setPositionMs(0);
  }, [pause]);

  const seek = useCallback((ms: number) => {
    positionRef.current = ms;
    setPositionMs(ms);
    if (isPlayingRef.current) {
      startTimestampRef.current = performance.now();
      startOffsetRef.current = ms;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return {
    session,
    setSession,
    positionMs,
    isPlaying,
    play,
    pause,
    stop,
    seek,
  };
}
