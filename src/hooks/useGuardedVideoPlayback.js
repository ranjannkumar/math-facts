import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_SHOW_GATE_AFTER_MS = 1000;
const DEFAULT_HARD_TIMEOUT_MS = 4000;

export default function useGuardedVideoPlayback({
  videoRef,
  enabled = true,
  deps = [],
  hardTimeoutMs = DEFAULT_HARD_TIMEOUT_MS,
  showGateAfterMs = DEFAULT_SHOW_GATE_AFTER_MS,
  onHardTimeout,
}) {
  const [showTapToPlay, setShowTapToPlay] = useState(false);
  const isPlayingRef = useRef(false);
  const hardTimeoutTriggeredRef = useRef(false);
  const gateTimerRef = useRef(null);
  const hardTimerRef = useRef(null);

  const clearTimers = useCallback(() => {
    if (gateTimerRef.current) {
      clearTimeout(gateTimerRef.current);
      gateTimerRef.current = null;
    }
    if (hardTimerRef.current) {
      clearTimeout(hardTimerRef.current);
      hardTimerRef.current = null;
    }
  }, []);

  const scheduleGateTimer = useCallback(() => {
    if (gateTimerRef.current) clearTimeout(gateTimerRef.current);
    gateTimerRef.current = setTimeout(() => {
      if (!isPlayingRef.current && !hardTimeoutTriggeredRef.current) {
        setShowTapToPlay(true);
      }
    }, showGateAfterMs);
  }, [showGateAfterMs]);

  const scheduleHardTimer = useCallback(() => {
    if (hardTimerRef.current) clearTimeout(hardTimerRef.current);
    hardTimerRef.current = setTimeout(() => {
      if (isPlayingRef.current || hardTimeoutTriggeredRef.current) return;
      hardTimeoutTriggeredRef.current = true;
      setShowTapToPlay(false);
      onHardTimeout?.();
    }, hardTimeoutMs);
  }, [hardTimeoutMs, onHardTimeout]);

  const tryPlay = useCallback(() => {
    const v = videoRef?.current;
    if (!v) return;

    v.muted = false;
    v.setAttribute('playsinline', 'true');

    const playPromise = v.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        if (!isPlayingRef.current && !hardTimeoutTriggeredRef.current) {
          setShowTapToPlay(true);
        }
      });
    }
  }, [videoRef]);

  const handleTapToPlay = useCallback(() => {
    if (!enabled || hardTimeoutTriggeredRef.current) return;
    setShowTapToPlay(false);
    scheduleGateTimer();
    scheduleHardTimer();
    tryPlay();
  }, [enabled, tryPlay, scheduleGateTimer, scheduleHardTimer]);

  useEffect(() => {
    if (!enabled) {
      clearTimers();
      setShowTapToPlay(false);
      isPlayingRef.current = false;
      hardTimeoutTriggeredRef.current = false;
      return;
    }

    const v = videoRef?.current;
    if (!v) return;

    isPlayingRef.current = false;
    hardTimeoutTriggeredRef.current = false;
    setShowTapToPlay(false);

    const onPlaying = () => {
      isPlayingRef.current = true;
      setShowTapToPlay(false);
      clearTimers();
    };

    v.addEventListener('playing', onPlaying);

    tryPlay();
    scheduleGateTimer();
    scheduleHardTimer();

    return () => {
      v.removeEventListener('playing', onPlaying);
      clearTimers();
    };
  }, [enabled, videoRef, tryPlay, clearTimers, scheduleGateTimer, scheduleHardTimer, ...deps]);

  return {
    showTapToPlay,
    handleTapToPlay,
  };
}
