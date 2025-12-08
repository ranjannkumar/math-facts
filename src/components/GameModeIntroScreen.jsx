import React, { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { MathGameContext } from '../App.jsx';

const GameModeIntroScreen = () => {
  const navigate = useNavigate();
  const { setIsGameMode, setLightningCount } = useContext(MathGameContext);

  useEffect(() => {
    // Reset counter and set mode state
    setLightningCount(0);
    setIsGameMode(true); 

    // Auto-navigate to the game screen after a short animation delay
    const timer = setTimeout(() => {
      navigate('/game-mode', { replace: true });
    }, 2500); // 2.5 seconds for animation

    return () => clearTimeout(timer);
  }, [navigate, setIsGameMode, setLightningCount]);

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900 flex flex-col items-center justify-center animate-fade-in-up">
      <div className="text-center p-8 bg-black/70 rounded-3xl shadow-2xl border-4 border-yellow-400 transform scale-110">
        <h1 className="text-6xl sm:text-7xl font-black text-yellow-400 mb-4 animate-pulse">
          ⚡ GAME MODE ⚡
        </h1>
        {/* <p className="text-3xl text-white font-semibold">
          Get **100 Lightning Bolts** to complete this game!
        </p> */}
        {/*  */}
      </div>
    </div>
  );
};

export default GameModeIntroScreen;