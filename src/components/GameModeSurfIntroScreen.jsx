import React, { useEffect, useRef, useContext } from 'react';
import { MathGameContext } from '../App.jsx';

const GameModeSurfIntroScreen = () => {
  const { startOrResumeGameModeRun, setIsTimerPaused, setPausedTime } = useContext(MathGameContext);
  const didStartRef = useRef(false);

  useEffect(() => {
    if (didStartRef.current) return;
    didStartRef.current = true;
    setIsTimerPaused(true);
    setPausedTime(Date.now());
    startOrResumeGameModeRun({ gameModeType: 'surf', navigateToGameMode: true }).catch((e) => {
      console.error('[SurfIntro] Failed to start surf mode:', e);
    });
  }, [startOrResumeGameModeRun, setIsTimerPaused, setPausedTime]);

  return (
    <div className="fixed inset-0 z-[100] bg-teal-950 flex flex-col items-center justify-center animate-fade-in-up">
      <div className="text-center p-8 bg-white/90 rounded-3xl shadow-2xl border-4 border-teal-500 transform scale-110">
        <h1 className="text-6xl sm:text-7xl font-black text-teal-700 mb-4">
          SURF MODE
        </h1>
      </div>
      <div className="mt-8" aria-hidden="true">
        <div className="h-10 w-10 rounded-full border-4 border-teal-200/40 border-t-teal-500 animate-spin" />
      </div>
    </div>
  );
};

export default GameModeSurfIntroScreen;
