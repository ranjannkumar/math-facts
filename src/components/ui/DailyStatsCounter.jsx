import React, { useState, useEffect } from 'react';

const DailyStatsCounter = ({ style }) => {
    const [dailyCorrect, setDailyCorrect] = useState(0);

    const getTodayString = () => new Date().toLocaleDateString();

    const updateCount = () => {
        const today = getTodayString();
        const count = parseInt(localStorage.getItem(`math-daily-correct-${today}`) || '0');
        setDailyCorrect(count);
    };

    useEffect(() => {
      updateCount();
      const intervalId = setInterval(updateCount, 1000); // Check every second for updates
      return () => clearInterval(intervalId);
    }, []);

    return (
      <div style={style}>
        <div className="bg-blue-500 text-white font-bold rounded-lg sm:rounded-xl shadow-lg px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 flex items-center min-w-[150px] sm:min-w-[180px] md:min-w-[200px] min-h-[40px] sm:min-h-[50px] md:min-h-[60px]">
          <div className="mr-1 sm:mr-2 md:mr-3 text-lg sm:text-xl md:text-2xl">📝</div>
          <div>
            <div className="text-xs sm:text-xs md:text-sm opacity-80">Today's Score</div>
            <div className="text-sm sm:text-base md:text-lg lg:text-xl">{dailyCorrect} correct</div>
          </div>
        </div>
      </div>
    );
};

export default DailyStatsCounter;