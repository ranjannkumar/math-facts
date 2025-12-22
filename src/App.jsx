import React, { useEffect, createContext, lazy, Suspense } from 'react'; 
import useMathGame from './hooks/useMathGame.jsx';
import DailyStreakAnimation from './components/DailyStreakAnimation.jsx';
import GetReadyScreen from './components/GetReadyScreen.jsx';

// NEW: Lazy loading imports for Code Splitting
import SiblingCheckModal from './components/SiblingCheckModal.jsx';
const StartScreen = lazy(() => import('./components/StartScreen.jsx'));
const NameForm = lazy(() => import('./components/NameForm.jsx'));
const ThemePicker = lazy(() => import('./components/ThemePicker.jsx'));
const TablePicker = lazy(() => import('./components/TablePicker.jsx'));
const DifficultyPicker = lazy(() => import('./components/DifficultyPicker.jsx'));
const BlackBeltPicker = lazy(() => import('./components/BlackBeltPicker.jsx')); 
const QuizScreen = lazy(() => import('./components/QuizScreen.jsx'));
const ResultsScreen = lazy(() => import('./components/ResultsScreen.jsx'));
const WayToGoScreen = lazy(() => import('./components/WayToGoScreen.jsx'));
const LearningModule = lazy(() => import('./components/LearningModule.jsx'));
const MainLayout = lazy(() => import('./components/MainLayout.jsx'));
const VideoPlayerScreen = lazy(() => import('./components/VideoPlayerScreen.jsx'));
const GameModeIntroScreen = lazy(() => import('./components/GameModeIntroScreen.jsx'));
const GameModeScreen = lazy(() => import('./components/GameModeScreen.jsx'));
const GameModeExitScreen = lazy(() => import('./components/GameModeExitScreen.jsx'));
const GameModeVideoScreen = lazy(() => import('./components/GameModeVideoScreen.jsx'));
const GameModeVideoPlayer = lazy(() => import('./components/GameModeVideoPlayer.jsx'));
const GameModeVideoSelectScreen = lazy(() => import('./components/GameModeVideoSelectScreen.jsx'));
const UserQuestionStats = lazy(() => import('./components/UserQuestionStats.jsx'));
const AnalyticsScreen = lazy(() => import('./components/AnalyticsScreen.jsx'));

const SpeedTestScreen = lazy(() => import('./components/ui/SpeedTestScreen.jsx'));

import PreTestPopup from './components/PreTestPopup.jsx';
import PreTestScreen from './components/PreTestScreen.jsx';
import SettingsModal from './components/SettingsModal.jsx';

import { clearShootingStars } from './utils/mathGameLogic.js';
import audioManager from './utils/audioUtils.js';

import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
const AdminDashboard = lazy(() => import('./components/AdminDashboard.jsx'));

export const MathGameContext = createContext({});

const InitialLoadingScreen = () => (
    <div 
            className="fixed inset-0 z-[99] bg-black/90 flex flex-col items-center justify-center "
            style={{ 
                backgroundImage: "url('/night_sky_landscape.jpg')", 
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
    >
        <svg className="animate-spin h-12 w-12 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className=" text-2xl font-semibold text-white-700 ">Loading...</p>
    </div>
);

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const ctx = useMathGame();

    const { showSiblingCheck } = ctx;

  useEffect(() => () => clearShootingStars(), []);

  // stop sounds when leaving interactive screens
  useEffect(() => {
    if (location.pathname !== '/quiz' && location.pathname !== '/learning') {
      audioManager.stopAll?.();
    }
  }, [location.pathname]);

  const MODAL_STYLE = {
    background: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    border: '4px solid white',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25), 0 0 0 2px rgba(255, 255, 255, 0.2) inset'
  };


  return (
    <MathGameContext.Provider value={{ ...ctx, navigate }}>
      {/* NEW: Use Suspense to show a fallback while waiting for code to load */}
      <Suspense>
      <Routes>
        <Route path="/" element={<StartScreen />} />
        <Route path="/name" element={<NameForm />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin/user-stats/:pin/:name" element={<UserQuestionStats />} />
        <Route
            path="/admin/students/:pin/analytics"
            element={<AnalyticsScreen />}
          />

        {/* <Route path="/pre-test-popup" element={<PreTestPopup />} /> */}
        {/* <Route path="/pre-test" element={<PreTestScreen />} /> */}

        <Route path="/video" element={<VideoPlayerScreen />} />
        <Route path="/game-mode-video" element={<GameModeVideoScreen />} />  
        <Route path="/game-mode-video-select" element={<GameModeVideoSelectScreen />} /> 
        {/* Update this route to use the new path for the player */}
        <Route path="/game-mode-video-play/:videoName" element={<GameModeVideoPlayer />} />


        <Route path="/game-mode-intro" element={<GameModeIntroScreen />} />
        <Route path="/game-mode-exit" element={<GameModeExitScreen />} />
         <Route path="/game-mode" element={<GameModeScreen />} />
        <Route path="/learning" element={<LearningModule />} />



        <Route element={<MainLayout hideStats={showSiblingCheck || ctx.hideStatsUI} />}> 
          <Route path="/levels" element={<TablePicker />} />
          <Route path="/belts" element={<DifficultyPicker />} />
          <Route path="/black" element={<BlackBeltPicker />} /> {/* ✅ BLACK ROUTE */}
          <Route path="/quiz" element={<QuizScreen />} />
          <Route path="/way-to-go" element={<WayToGoScreen />} />
          <Route path="/results" element={<ResultsScreen />} />
          <Route path="/theme" element={<ThemePicker />} />

        </Route>
      </Routes>
      </Suspense>

     {ctx.isInitialPrepLoading && <InitialLoadingScreen />}

      {/* 2. Show "GET READY" only right before the quiz starts (post-practice or black belt) */}
      {ctx.isQuizStarting && <GetReadyScreen />}

     {/* --- DAILY STREAK ANIMATION OVERLAY (NEW COMPONENT) --- */}
      {ctx.showDailyStreakAnimation && ctx.streakCountToDisplay > 0 && (
        <DailyStreakAnimation
          streakCount={ctx.streakCountToDisplay}
        />
      )}
      
        {showSiblingCheck && (
        <div 
            className="fixed inset-0 z-[99] bg-black/90"
            style={{ 
                backgroundImage: "url('/night_sky_landscape.jpg')", 
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
        >
             <SiblingCheckModal />
        </div>
      )}


      {/* Optional overlays kept here if you use them */}
      {ctx.showQuitModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in">
          <div 
          className="bg-white rounded-2xl p-8 shadow-2xl max-w-lg w-full flex flex-col items-center animate-pop-in"
          style={MODAL_STYLE}>
            <h2 className="text-3xl font-bold mb-4">Confirm To Quit ?</h2>
            <div className="flex justify-between text-center w-80 space-x-10">
                <button className="kid-btn bg-yellow-500 hover:bg-yellow-600 text-white flex-1" onClick={ctx.handleConfirmQuit}>
                    Yes
                </button>
                <button className="kid-btn bg-blue-400 hover:bg-blue-500 text-white flex-1" onClick={ctx.handleCancelQuit}>
                    No
                </button>
            </div>
          </div>
        </div>
      )}

      {ctx.showResetModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in">
          <div 
          className="bg-white rounded-2xl p-8 shadow-2xl max-w-lg w-full flex flex-col items-center animate-pop-in"
          style={MODAL_STYLE}>
            <h2 className="text-3xl font-bold mb-4">Confirm Reset Progress ?</h2>
            {/* --- HORIZONTAL BUTTON WRAPPER --- */}
            <div className="flex justify-between w-80 space-x-4">
                <button className="kid-btn bg-red-600 hover:bg-red-700 text-white flex-1" onClick={ctx.handleConfirmReset}>
                    Yes
                </button>
                <button className="kid-btn bg-blue-400 hover:bg-blue-500 text-white flex-1" onClick={ctx.handleCancelReset}>
                    No
                </button>
            </div>
          </div>
        </div>
      )}
    </MathGameContext.Provider>
  );
};

export default App;