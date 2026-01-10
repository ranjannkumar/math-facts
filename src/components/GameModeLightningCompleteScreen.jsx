import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const GameModeLightningCompleteScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/game-mode-surf-video/intro', { replace: true });
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="fixed inset-0 z-[100] bg-green-900 flex flex-col items-center justify-center animate-fade-in-up">
      <div className="text-center p-8 bg-white/90 rounded-3xl shadow-2xl border-4 border-green-500 transform scale-110">
        <h1 className="text-6xl sm:text-7xl font-black text-brown-700 mb-4 animate-bounce">
           LIGHTNING BOLTS
        </h1>
        <h1 className="text-6xl sm:text-7xl font-black text-brown-700 mb-4 animate-bounce">
           GAME COMPLETED
        </h1>
      </div>
    </div>
  );
};

export default GameModeLightningCompleteScreen;
