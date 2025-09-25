import React, { useState, useEffect } from 'react';

const SessionTimer = ({ isActive, startTime, style, isPaused, pauseStartTime, accumulatedTime = 0 }) => {
    const [elapsed, setElapsed] = useState(0);
    const [pausedElapsed, setPausedElapsed] = useState(0);
    
    useEffect(() => {
        if (!isActive || !startTime) return;
        
        const update = () => {
            if (isPaused && pauseStartTime) {
                const timeBeforePause = Math.floor((pauseStartTime - startTime) / 1000);
                setPausedElapsed(timeBeforePause);
            } else {
                const currentElapsed = Math.floor((Date.now() - startTime) / 1000);
                setElapsed(currentElapsed);
            }
        };
        
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [isActive, startTime, isPaused, pauseStartTime]);
    
    const currentTime = isPaused ? pausedElapsed : elapsed;
    const displayTime = accumulatedTime + currentTime;
    const hours = Math.floor(displayTime / 3600);
    const mins = Math.floor((displayTime % 3600) / 60);
    const secs = displayTime % 60;
    
    return (
        <div style={style}>
            <div className={`text-white font-bold rounded-lg sm:rounded-xl shadow-lg px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 flex items-center min-w-[150px] sm:min-w-[180px] md:min-w-[200px] min-h-[40px] sm:min-h-[50px] md:min-h-[60px] ${!isActive && displayTime === 0 ? 'bg-gray-400' : isPaused ? 'bg-gray-500' : 'bg-blue-500'}`}>
                <div className="mr-1 sm:mr-2 md:mr-3 text-lg sm:text-xl md:text-2xl">{!isActive ? '⏰' : isPaused ? '⏸️' : '⏰'}</div>
                <div>
                    <div className="text-xs sm:text-xs md:text-sm opacity-80">Time Today</div>
                    <div className="text-sm sm:text-base md:text-lg lg:text-xl">{hours.toString().padStart(2, '0')}:{mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}</div>
                    {!isActive && displayTime === 0 && <div className="text-xs sm:text-xs opacity-70">Not Started</div>}
                    {isActive && isPaused && <div className="text-xs sm:text-xs opacity-70">Paused</div>}
                </div>
            </div>
        </div>
    );
};

export default SessionTimer;