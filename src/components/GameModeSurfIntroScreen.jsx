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
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-fade-in-up">
      <button
        type="button"
        className="text-center p-10 bg-white/90 rounded-3xl shadow-2xl border-4 border-emerald-500 transform scale-105 cursor-default"
        aria-label="Surf mode loading"
      >
        <h1 className="text-4xl sm:text-5xl font-black text-emerald-700 mb-3">
          Don't fall off 
        </h1>
        <h1 className="text-4xl sm:text-5xl font-black text-emerald-700 mb-3">
           the Surfboard
        </h1>
        
      </button>
    </div>
  );
};

export default GameModeSurfIntroScreen;
