import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_SHOW_GATE_AFTER_MS = 1000;
const DEFAULT_HARD_TIMEOUT_MS = 7000;
const STALL_CHECK_INTERVAL_MS = 500;
const STALL_THRESHOLD_MS = 1800;
const STARTUP_STALL_THRESHOLD_MS = 2200;

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
  const needsRecoveryRef = useRef(false);
  const hardTimeoutTriggeredRef = useRef(false);
  const hasStartedPlaybackRef = useRef(false);
  const lastProgressTimeRef = useRef(0);
  const lastProgressAtRef = useRef(0);
  const startupAttemptAtRef = useRef(0);
  const stalledSinceRef = useRef(0);
  const gateTimerRef = useRef(null);
  const hardTimerRef = useRef(null);
  const stallIntervalRef = useRef(null);

  const clearRecoveryTimers = useCallback(() => {
    if (gateTimerRef.current) {
      clearTimeout(gateTimerRef.current);
      gateTimerRef.current = null;
    }
    if (hardTimerRef.current) {
      clearTimeout(hardTimerRef.current);
      hardTimerRef.current = null;
    }
  }, []);

  const clearStallWatch = useCallback(() => {
    if (stallIntervalRef.current) {
      clearInterval(stallIntervalRef.current);
      stallIntervalRef.current = null;
    }
  }, []);

  const scheduleGateTimer = useCallback((delayMs) => {
    if (gateTimerRef.current) clearTimeout(gateTimerRef.current);
    gateTimerRef.current = setTimeout(() => {
      if (needsRecoveryRef.current && !hardTimeoutTriggeredRef.current) {
        setShowTapToPlay(true);
      }
    }, delayMs);
  }, []);

  const markProgress = useCallback((v) => {
    const ct = Number(v?.currentTime || 0);
    if (ct >= 0) {
      lastProgressTimeRef.current = ct;
      lastProgressAtRef.current = Date.now();
    }
  }, []);

  const scheduleHardTimer = useCallback(() => {
    if (hardTimerRef.current) clearTimeout(hardTimerRef.current);
    hardTimerRef.current = setTimeout(() => {
      if (!needsRecoveryRef.current || hardTimeoutTriggeredRef.current) return;
      hardTimeoutTriggeredRef.current = true;
      needsRecoveryRef.current = false;
      setShowTapToPlay(false);
      onHardTimeout?.();
    }, hardTimeoutMs);
  }, [hardTimeoutMs, onHardTimeout]);

  const onRecoveredPlaying = useCallback(() => {
    isPlayingRef.current = true;
    needsRecoveryRef.current = false;
    hasStartedPlaybackRef.current = true;
    stalledSinceRef.current = 0;
    setShowTapToPlay(false);
    clearRecoveryTimers();
  }, [clearRecoveryTimers]);

  const beginRecovery = useCallback(
    ({ showGateDelayMs = showGateAfterMs } = {}) => {
      if (hardTimeoutTriggeredRef.current) return;
      needsRecoveryRef.current = true;
      isPlayingRef.current = false;
      scheduleGateTimer(showGateDelayMs);
      scheduleHardTimer();
    },
    [scheduleGateTimer, scheduleHardTimer, showGateAfterMs]
  );

  const tryPlay = useCallback(() => {
    const v = videoRef?.current;
    if (!v) return;

    v.muted = false;
    v.setAttribute('playsinline', 'true');

    const playPromise = v.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        beginRecovery({ showGateDelayMs: 0 });
      });
    }
  }, [videoRef, beginRecovery]);

  const handleTapToPlay = useCallback(() => {
    if (!enabled || hardTimeoutTriggeredRef.current) return;
    setShowTapToPlay(false);
    beginRecovery({ showGateDelayMs: showGateAfterMs });
    tryPlay();
  }, [enabled, tryPlay, beginRecovery, showGateAfterMs]);

  useEffect(() => {
    if (!enabled) {
      clearRecoveryTimers();
      clearStallWatch();
      setShowTapToPlay(false);
      isPlayingRef.current = false;
      needsRecoveryRef.current = false;
      hardTimeoutTriggeredRef.current = false;
      hasStartedPlaybackRef.current = false;
      lastProgressTimeRef.current = 0;
      lastProgressAtRef.current = 0;
      startupAttemptAtRef.current = 0;
      stalledSinceRef.current = 0;
      return;
    }

    const v = videoRef?.current;
    if (!v) return;

    isPlayingRef.current = false;
    needsRecoveryRef.current = false;
    hardTimeoutTriggeredRef.current = false;
    hasStartedPlaybackRef.current = false;
    setShowTapToPlay(false);
    startupAttemptAtRef.current = Date.now();
    stalledSinceRef.current = 0;
    markProgress(v);

    const onPlaying = () => {
      markProgress(v);
      onRecoveredPlaying();
    };

    const onTimeUpdate = () => {
      markProgress(v);
      if ((v.currentTime || 0) > 0.01) {
        hasStartedPlaybackRef.current = true;
        stalledSinceRef.current = 0;
      }
    };

    const onWaitingOrStalled = () => {
      if (!hasStartedPlaybackRef.current || v.ended || hardTimeoutTriggeredRef.current) return;
      if (!stalledSinceRef.current) stalledSinceRef.current = Date.now();
    };

    const onPause = () => {
      if (!hasStartedPlaybackRef.current || v.ended || document.hidden) return;
      if (!stalledSinceRef.current) stalledSinceRef.current = Date.now();
    };

    v.addEventListener('playing', onPlaying);
    v.addEventListener('timeupdate', onTimeUpdate);
    v.addEventListener('waiting', onWaitingOrStalled);
    v.addEventListener('stalled', onWaitingOrStalled);
    v.addEventListener('suspend', onWaitingOrStalled);
    v.addEventListener('pause', onPause);

    tryPlay();

    stallIntervalRef.current = setInterval(() => {
      if (!enabled || hardTimeoutTriggeredRef.current || v.ended) return;

      const now = Date.now();
      const currentTime = Number(v.currentTime || 0);
      const advanced = currentTime > lastProgressTimeRef.current + 0.01;

      if (advanced) {
        lastProgressTimeRef.current = currentTime;
        lastProgressAtRef.current = now;
        if (currentTime > 0.01) {
          hasStartedPlaybackRef.current = true;
          stalledSinceRef.current = 0;
        }
        if (needsRecoveryRef.current) {
          onRecoveredPlaying();
        }
        return;
      }

      if (!hasStartedPlaybackRef.current) {
        if (now - startupAttemptAtRef.current >= STARTUP_STALL_THRESHOLD_MS) {
          beginRecovery({ showGateDelayMs: 0 });
          tryPlay();
        }
        return;
      }

      const noProgressFor = now - lastProgressAtRef.current;
      const pausedWithoutEnd = v.paused && !v.ended && !document.hidden;
      if (pausedWithoutEnd && !stalledSinceRef.current) {
        stalledSinceRef.current = now;
      }
      const hasStallSignal =
        stalledSinceRef.current > 0 && now - stalledSinceRef.current >= STALL_THRESHOLD_MS;

      if (noProgressFor >= STALL_THRESHOLD_MS || hasStallSignal) {
        beginRecovery({ showGateDelayMs: 0 });
        tryPlay();
      }
    }, STALL_CHECK_INTERVAL_MS);

    return () => {
      v.removeEventListener('playing', onPlaying);
      v.removeEventListener('timeupdate', onTimeUpdate);
      v.removeEventListener('waiting', onWaitingOrStalled);
      v.removeEventListener('stalled', onWaitingOrStalled);
      v.removeEventListener('suspend', onWaitingOrStalled);
      v.removeEventListener('pause', onPause);
      clearRecoveryTimers();
      clearStallWatch();
    };
  }, [
    enabled,
    videoRef,
    tryPlay,
    beginRecovery,
    clearRecoveryTimers,
    clearStallWatch,
    onRecoveredPlaying,
    markProgress,
    showGateAfterMs,
    ...deps,
  ]);

  return {
    showTapToPlay,
    handleTapToPlay,
  };
}
