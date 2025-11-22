import React, { useContext } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { FaCog } from 'react-icons/fa';
import DailyStatsCounter from './ui/DailyStatsCounter';
import SessionTimer from './ui/SessionTimer';
import SettingsModal from './SettingsModal';
import { MathGameContext } from '../App.jsx';
import UserInfoBadge from './ui/UserInfoBadge.jsx';
import DailyStreakCounter from './ui/DailyStreakCounter.jsx';

const MainLayout = ({ hideStats }) => {
  const {
    showSettings,
    setShowSettings,
    isTimerPaused,
    quizStartTime,
    pausedTime,
    totalTimeToday,
    elapsedTime,
    handleQuit,
    handleResetProgress,
  } = useContext(MathGameContext);

  const location = useLocation();

  const showStats = !(location.pathname === '/' || location.pathname === '/name');
  const shouldRenderStats = showStats && !hideStats;

  // Fallback so we always pass a number down to SessionTimer
  const effectiveAccumulatedTime =
    typeof totalTimeToday === 'number' ? totalTimeToday : elapsedTime || 0;

  return (
    <div
      className="App min-h-screen w-full relative layout-has-stats"
      style={{
        background:
          'linear-gradient(135deg, #23272f 0%, #18181b 60%, #111113 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        transition: 'background 0.5s ease',
      }}
    >
      <button
        className="fixed top-4 right-4 z-50 bg-white/80 hover:bg-gray-200 text-gray-700 rounded-full p-3 shadow-lg border-4 border-gray-400 focus:outline-none transition-all duration-300 transform hover:scale-110 active:scale-95"
        style={{ fontSize: '2rem', borderWidth: '4px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
        onClick={() => setShowSettings(true)}
        aria-label="Settings"
      >
        <FaCog />
      </button>

      <UserInfoBadge />
      <DailyStreakCounter />

      {/* Routed pages */}
      <div className="w-full min-h-screen flex flex-col">
        <div className="flex-1 w-full">
          <Outlet />
        </div>

        {/* Responsive stats bar (score + time) */}
        {shouldRenderStats && (
          <div className="stats-floating">
            <DailyStatsCounter
              style={{
                width: '100%',
                maxWidth: '280px',
              }}
            />
            <SessionTimer
              isActive={!!quizStartTime}
              startTime={quizStartTime}
              isPaused={isTimerPaused}
              pauseStartTime={pausedTime}
              accumulatedTime={effectiveAccumulatedTime}
              style={{
                width: '100%',
                maxWidth: '280px',
              }}
            />
          </div>
        )}
      </div>

      {showSettings && (
        <SettingsModal
          handleQuit={handleQuit}
          handleResetProgress={handleResetProgress}
          setShowSettings={setShowSettings}
        />
      )}
    </div>
  );
};

export default MainLayout;
