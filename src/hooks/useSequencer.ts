import { useState, useRef, useCallback, useEffect } from 'react';
import { prepareSession, evaluatePrepared } from '../sequencer/evaluate';
import type { Session, EvaluatedState } from '../sequencer/types';

const DEFAULT_SESSION: Session = {
  id: '',
  name: 'Untitled',
  durationMs: 10000,
  loop: false,
  events: [],
};

export function useSequencer(onTick: (state: EvaluatedState) => void, onEnd?: () => void) {
  const [session, setSessionState] = useState<Session>(DEFAULT_SESSION);
  const [positionMs, setPositionMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const sessionRef = useRef(session);
  const positionRef = useRef(positionMs);
  const isPlayingRef = useRef(isPlaying);
  const rafRef = useRef<number | null>(null);
  const startTimestampRef = useRef<number | null>(null);
  const startOffsetRef = useRef(0);
  const onTickRef = useRef(onTick);
  const onEndRef = useRef(onEnd);
  // The transport evaluates its position every frame — prepare the session
  // once per change instead of re-sorting its events on every tick.
  const preparedRef = useRef(prepareSession(DEFAULT_SESSION));

  sessionRef.current = session;
  positionRef.current = positionMs;
  isPlayingRef.current = isPlaying;
  onTickRef.current = onTick;
  onEndRef.current = onEnd;

  /** Session updates keep the prepared form in step. */
  const setSession = useCallback((next: Session | ((prev: Session) => Session)) => {
    setSessionState((prev) => {
      const resolved = typeof next === 'function' ? (next as (p: Session) => Session)(prev) : next;
      preparedRef.current = prepareSession(resolved);
      return resolved;
    });
  }, []);

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
      // Natural end: stop the transport, keep the position ref and state
      // in agreement, apply the final state, then emit the end transition.
      isPlayingRef.current = false;
      setIsPlaying(false);
      positionRef.current = dur;
      setPositionMs(dur);
      const state = evaluatePrepared(preparedRef.current, dur);
      onTickRef.current(state);
      onEndRef.current?.();
      return;
    }

    positionRef.current = currentMs;
    setPositionMs(currentMs);

    const state = evaluatePrepared(preparedRef.current, currentMs);
    onTickRef.current(state);

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const play = useCallback(() => {
    if (isPlayingRef.current) return;
    // Replaying from the end of a finished non-loop session restarts
    // from the top instead of staying latched at the end position.
    if (!sessionRef.current.loop && positionRef.current >= sessionRef.current.durationMs) {
      positionRef.current = 0;
      setPositionMs(0);
    }
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
