import { useEffect } from 'react';

export const usePretestCountdownEffect = ({
  pretestTimerRunning,
  pretestTimerStartRef,
  pretestTimerInitialRef,
  setPretestRemainingMs,
}) => {
  useEffect(() => {
    if (!pretestTimerRunning) return;

    const interval = setInterval(() => {
      const startedAt = pretestTimerStartRef.current;
      const initialMs = pretestTimerInitialRef.current;
      if (!Number.isFinite(initialMs) || !Number.isFinite(startedAt)) return;

      const elapsed = Date.now() - startedAt;
      const nextRemaining = Math.max(0, initialMs - elapsed);
      setPretestRemainingMs(nextRemaining);
    }, 250);

    return () => clearInterval(interval);
  }, [pretestTimerRunning, pretestTimerStartRef, pretestTimerInitialRef, setPretestRemainingMs]);
};
