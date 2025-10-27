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

  return (
    <div
      className="App min-h-screen w-full relative"
      style={{
        background: 'linear-gradient(135deg, #23272f 0%, #18181b 60%, #111113 100%)',
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

      <Outlet />

       {shouldRenderStats && (
        <div
          style={{
            position: 'fixed',
            right: 'max(env(safe-area-inset-right), 1rem)',
            bottom: 'max(env(safe-area-inset-bottom), 1rem)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 'clamp(0.5rem, 2vw, 1rem)',
          }}
        >
          <DailyStatsCounter />
          <SessionTimer
            isActive={!!quizStartTime}
            startTime={quizStartTime}
            isPaused={isTimerPaused}
            pauseStartTime={pausedTime}
            accumulatedTime={totalTimeToday}
          />
        </div>
      )}

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
