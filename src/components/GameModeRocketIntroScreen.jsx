import React, { useContext, useEffect, useRef } from 'react';
import { MathGameContext } from '../App.jsx';

const GameModeRocketIntroScreen = () => {
  const { startOrResumeGameModeRun, navigate, setIsTimerPaused, setPausedTime } =
    useContext(MathGameContext);
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
        <h1 className="text-4xl sm:text-5xl font-black text-orange-700 mb-2">Rocket Mode</h1>
      </div>
    </div>
  );
};

export default GameModeRocketIntroScreen;
