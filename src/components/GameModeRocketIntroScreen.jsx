import React, { useEffect, useRef } from 'react';
import { useMathGamePick } from '../store/mathGameBridgeStore.js';

const GameModeRocketIntroScreen = () => {
  const { startOrResumeGameModeRun, navigate, setIsTimerPaused, setPausedTime } =
    useMathGamePick((ctx) => ({
      startOrResumeGameModeRun: ctx.startOrResumeGameModeRun || (() => Promise.resolve(false)),
      navigate: ctx.navigate || (() => {}),
      setIsTimerPaused: ctx.setIsTimerPaused || (() => {}),
      setPausedTime: ctx.setPausedTime || (() => {}),
    }));
  const didStartRef = useRef(false);

  useEffect(() => {
    if (didStartRef.current) return;
    didStartRef.current = true;

    setIsTimerPaused(true);
    setPausedTime(Date.now());

    (async () => {
      const started = await startOrResumeGameModeRun({
        gameModeType: 'rocket',
        navigateToGameMode: true,
        suppressStartError: true,
      });

      if (!started) {
        navigate('/game-mode-exit', { replace: true });
      }
    })();
  }, [startOrResumeGameModeRun, navigate, setIsTimerPaused, setPausedTime]);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-fade-in-up">
      <div className="text-center p-10 bg-white/90 rounded-3xl shadow-2xl border-4 border-orange-500 transform scale-105">
        <h1 className="text-6xl sm:text-7xl font-black text-orange-700 mb-4">ROCKET MODE</h1>
      </div>
      <div className="mt-8" aria-hidden="true">
        <div className="h-10 w-10 rounded-full border-4 border-orange-200/40 border-t-orange-500 animate-spin" />
      </div>
    </div>
  );
};

export default GameModeRocketIntroScreen;
