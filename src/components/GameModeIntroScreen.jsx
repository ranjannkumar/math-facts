import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMathGamePick } from '../store/mathGameBridgeStore.js';

const GameModeIntroScreen = () => {
  const navigate = useNavigate();
  const { setIsGameMode, startOrResumeGameModeRun } =
    useMathGamePick((ctx) => ({
      setIsGameMode: ctx.setIsGameMode || (() => {}),
      startOrResumeGameModeRun: ctx.startOrResumeGameModeRun || (() => Promise.resolve(false)),
    }));

  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    setIsGameMode(true);
    startOrResumeGameModeRun({ navigateToGameMode: true, gameModeType: 'lightning' });
  }, [setIsGameMode, startOrResumeGameModeRun]);

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900 flex flex-col items-center justify-center animate-fade-in-up">
      <div className="text-center p-8 bg-black/70 rounded-3xl shadow-2xl border-4 border-yellow-400 transform scale-110">
        <h1 className="text-6xl sm:text-7xl font-black text-yellow-400 mb-4 animate-pulse">
           ⚡ GAME MODE ⚡
        </h1>
      </div>
      <div className="mt-8" aria-hidden="true">
        <div className="h-10 w-10 rounded-full border-4 border-yellow-200/30 border-t-yellow-300 animate-spin" />
      </div>
    </div>
  );
};

export default GameModeIntroScreen;
