// src/components/ui/TopStreakCounter.jsx
import React, { useContext } from 'react';
import { MathGameContext } from '../../App.jsx';

const DailyStreakCounter = () => {
    const { currentStreak } = useContext(MathGameContext);

    if (currentStreak === 0) return null;

    return (
        <div 
            className="fixed z-50 bg-red-600/80 hover:bg-red-700 text-white font-bold rounded-full p-2 shadow-lg border-2 border-red-500 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center"
            style={{
                top: 'max(env(safe-area-inset-top), 2.3rem)',
                 right: 'max(env(safe-area-inset-right), 15.5rem)', // Shift right from the back button
            }}
        >
            <span className="text-xl leading-none">🔥</span>
            <span className="text-md font-semibold ml-1 mr-1">{currentStreak}</span>
        </div>
    );
};

export default DailyStreakCounter;