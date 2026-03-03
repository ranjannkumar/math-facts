import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const GameModeRocketCompleteScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/game-mode-exit', { replace: true });
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="fixed inset-0 z-[100] bg-orange-950 flex flex-col items-center justify-center">
      <div className="text-center p-8 bg-white/90 rounded-3xl shadow-2xl border-4 border-orange-500 transform scale-110">
        <h1 className="text-6xl sm:text-7xl font-black text-orange-700 mb-4">ROCKET MODE</h1>
        <h1 className="text-6xl sm:text-7xl font-black text-orange-700 mb-4">GAME COMPLETED</h1>
      </div>
    </div>
  );
};

export default GameModeRocketCompleteScreen;
