import React, { useState, useEffect, useContext, useCallback } from 'react';
import { MathGameContext } from '../../App.jsx';
import { userGetDailyStats } from '../../api/mathApi.js';

const DailyStatsCounter = ({ style }) => {
    const { childPin } = useContext(MathGameContext);
    const [dailyCorrect, setDailyCorrect] = useState(0);

    // FIX 1: Wrap updateCount in useCallback to prevent recreation on every render
    const updateCount = useCallback(async () => {
        if (!childPin) {
            setDailyCorrect(0);
            return;
        }
        
        try {
            // NOTE: Assuming userGetDailyStats accepts PIN/ID and returns { correctCount }
            const stats = await userGetDailyStats(childPin);
            setDailyCorrect(stats?.correctCount || 0);
        } catch (e) {
            console.error('Error fetching daily stats:', e.message);
            setDailyCorrect(0);
        }
    }, [childPin]); // Depend only on childPin

    useEffect(() => {
      // FIX 2: Call the stable function
      updateCount();
      
      // Poll every 5 seconds to keep the counter somewhat fresh during a session
      const intervalId = setInterval(updateCount, 5000); 
      return () => clearInterval(intervalId);
    }, [childPin, updateCount]); // FIX 3: Include updateCount in the dependency array

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