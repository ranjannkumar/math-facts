import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMathGamePick } from '../store/mathGameBridgeStore.js';

const GameModeExitScreen = () => {
  const navigate = useNavigate();
  const { setIsQuizStarting, hardResetQuizState } = useMathGamePick((ctx) => ({
    setIsQuizStarting: ctx.setIsQuizStarting || (() => {}),
    hardResetQuizState: ctx.hardResetQuizState || (() => {}),
  }));

  useEffect(() => {
    const belt = localStorage.getItem('game-mode-belt');
    console.log("DEBUG belt from game mode:", belt);
   
    let targetRoute = '/belts'; // Default fall-back

    if (belt) {
      const lowerBelt = belt.toLowerCase();

      // 1. If user just finished Brown, they unlocked Black -> Go to /black
      if (lowerBelt === 'brown') {
        targetRoute = '/black';
      } 
      // 2. If user just finished a Black belt degree
      else if (lowerBelt.includes('black')) {
        // Extract degree number (e.g., "black-1" -> 1)
        const parts = lowerBelt.split('-');
        const degree = parts.length > 1 ? parseInt(parts[1], 10) : 0;

        // If they finished Degree 7, they completed the Level -> Go to /levels
        if (degree === 7) {
          targetRoute = '/levels';
        } else {
          // Otherwise (Degree 1-6), go to the Black Belt degree list -> /black
          targetRoute = '/black';
        }
      } 
      // 3. For White, Yellow, Green, Blue, Red -> Go to /belts
      else {
        targetRoute = '/belts';
      }
    }

    const timer = setTimeout(() => {
      // Clean up stored game-mode info
      localStorage.removeItem('game-mode-belt');
      localStorage.removeItem('game-mode-table');
      localStorage.removeItem('game-mode-operation');

      if (hardResetQuizState) {
        hardResetQuizState(); 
      }

      if (setIsQuizStarting) {
        setIsQuizStarting(false);
      }

      navigate(targetRoute, { replace: true });
    }, 2000); // 2 seconds to show the "MODE COMPLETE" screen

    return () => clearTimeout(timer);
  }, [navigate, setIsQuizStarting, hardResetQuizState]);

  return (
    <div className="fixed inset-0 z-[100] bg-orange-950 flex flex-col items-center justify-center">
      <div className="text-center p-8 bg-white/90 rounded-3xl shadow-2xl border-4 border-orange-500 transform scale-110">
        <h1 className="text-6xl sm:text-7xl font-black text-orange-700 mb-4">ROCKET </h1>
        <h1 className="text-6xl sm:text-7xl font-black text-orange-700 mb-4">GAME COMPLETED</h1>
      </div>
    </div>
  );
};

export default GameModeExitScreen;
