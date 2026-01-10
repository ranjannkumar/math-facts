import React, { useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MathGameContext } from '../App.jsx';

const GameModeIntroScreen = () => {
  const navigate = useNavigate();
  const { setIsGameMode, startOrResumeGameModeRun } =
    useContext(MathGameContext);

  // Ref to track if we have triggered the game start
  const hasStartedRef = useRef(false);

  useEffect(() => {
    // 1. Guard: Ensure this logic runs only once per mount cycle
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    // 2. Set UI state
    setIsGameMode(true);

    // 3. Start Game & Navigate ONLY when backend is ready
    // We pass 'navigateToGameMode: true' so the hook handles the navigation
    // immediately after the API successfully returns the questions.
    startOrResumeGameModeRun({ navigateToGameMode: true, gameModeType: 'lightning' });

  }, [setIsGameMode, startOrResumeGameModeRun]);

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900 flex flex-col items-center justify-center animate-fade-in-up">
      <div className="text-center p-8 bg-black/70 rounded-3xl shadow-2xl border-4 border-yellow-400 transform scale-110">
        <h1 className="text-6xl sm:text-7xl font-black text-yellow-400 mb-4 animate-pulse">
          ⚡ GAME MODE ⚡
        </h1>
      </div>
    </div>
  );
};

export default GameModeIntroScreen;
