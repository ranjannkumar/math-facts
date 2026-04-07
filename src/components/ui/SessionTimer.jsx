import React from 'react';

const SessionTimer = ({ isActive, startTime, style, isPaused, pauseStartTime, accumulatedTime = 0 }) => {
  void startTime;
  void pauseStartTime;

  const totalTimeSeconds = accumulatedTime;
  const hours = Math.floor(totalTimeSeconds / 3600);
  const mins = Math.floor((totalTimeSeconds % 3600) / 60);
  const secs = totalTimeSeconds % 60;

  return (
    <div style={style}>
      <div
        className={`w-full min-w-0 text-white font-bold rounded-lg sm:rounded-xl shadow-lg px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 flex items-center sm:min-w-[180px] md:min-w-[200px] min-h-[40px] sm:min-h-[50px] md:min-h-[60px] ${
          !isActive && totalTimeSeconds === 0 ? 'bg-gray-400' : isPaused ? 'bg-gray-500' : 'bg-blue-500'
        }`}
      >
        <div className="mr-1 sm:mr-2 md:mr-3 text-lg sm:text-xl md:text-2xl">
          {!isActive ? '\u23F0' : isPaused ? '\u23F8\uFE0F' : '\u23F0'}
        </div>
        <div className="min-w-0">
          <div className="text-xs sm:text-xs md:text-sm opacity-80">Time Today</div>
          <div className="text-sm sm:text-base md:text-lg lg:text-xl leading-tight">
            {hours.toString().padStart(2, '0')}:{mins.toString().padStart(2, '0')}:{secs
              .toString()
              .padStart(2, '0')}
          </div>
          {!isActive && totalTimeSeconds === 0 && <div className="text-xs sm:text-xs opacity-70">Not Started</div>}
          {isActive && isPaused && <div className="text-xs sm:text-xs opacity-70">Paused</div>}
        </div>
      </div>
    </div>
  );
};

export default SessionTimer;
