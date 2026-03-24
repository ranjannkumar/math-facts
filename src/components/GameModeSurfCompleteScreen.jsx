import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MathGameContext } from '../App.jsx';

const GameModeSurfCompleteScreen = () => {
  const navigate = useNavigate();
  const { setIsTimerPaused, setPausedTime } = useContext(MathGameContext);

  useEffect(() => {
    setIsTimerPaused(true);
    setPausedTime(Date.now());
    const timer = setTimeout(() => {
      navigate('/game-mode-rocket-video/intro', { replace: true });
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate, setIsTimerPaused, setPausedTime]);

  return (
    <div className="fixed inset-0 z-[100] bg-teal-950 flex flex-col items-center justify-center">
      <div className="text-center p-8 bg-white/90 rounded-3xl shadow-2xl border-4 border-teal-500 transform scale-110">
        <h1 className="text-6xl sm:text-7xl font-black text-teal-700 mb-4">SURF MODE</h1>
        <h1 className="text-6xl sm:text-7xl font-black text-teal-700 mb-4">GAME COMPLETED</h1>
      </div>
    </div>
  );
};

export default GameModeSurfCompleteScreen;
