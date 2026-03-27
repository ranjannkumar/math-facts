import React, { useContext, useEffect,useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MathGameContext } from '../App.jsx';

const GameModeSurfCompleteScreen = () => {
  const navigate = useNavigate();
  const { setIsTimerPaused, setPausedTime } = useContext(MathGameContext);

  const didNavigateRef = useRef(false);

  const goNext = () => {
    if (didNavigateRef.current) return;
    didNavigateRef.current = true;
    navigate('/game-mode-rocket-video/intro', { replace: true });
  };

 useEffect(() => {
    setIsTimerPaused(true);
    setPausedTime(Date.now());
  }, [setIsTimerPaused, setPausedTime]);

  useEffect(() => {
    const timer = setTimeout(() => {
      goNext();
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-teal-950 flex flex-col items-center justify-center">
      <div className="text-center p-8 bg-white/90 rounded-3xl shadow-2xl border-4 border-teal-500 transform scale-110">
        <h1 className="text-6xl sm:text-7xl font-black text-teal-700 mb-4">SURF MODE</h1>
        <h1 className="text-6xl sm:text-7xl font-black text-teal-700 mb-4">GAME COMPLETED</h1>
      </div>
       <button
        type="button"
        onClick={goNext}
        className="mt-10 px-6 py-3 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-extrabold shadow-lg transition"
      >
        Next
      </button>
    </div>
  );
};

export default GameModeSurfCompleteScreen;
