// src/components/ui/TopStreakCounter.jsx
import React from 'react';
import { useMathGameSelector } from '../../store/mathGameBridgeStore.js';

const DailyStreakCounter = () => {
  const currentStreak = useMathGameSelector((ctx) => ctx.currentStreak ?? 0);

  if (currentStreak === 0) return null;

  return (
    <div className="relative z-50 mt-2 shrink-0 flex items-center rounded-full border-2 border-red-500 bg-red-600/80 p-2 font-bold text-white shadow-lg transition-all duration-300 hover:bg-red-700 active:scale-95">
      <span className="text-xl leading-none">{'\u{1F525}'}</span>
      <span className="ml-1 mr-1 text-md font-semibold">{currentStreak}</span>
    </div>
  );
};

export default DailyStreakCounter;
