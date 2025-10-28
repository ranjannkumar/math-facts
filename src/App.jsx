import React, { useEffect, createContext, lazy, Suspense } from 'react'; 
import useMathGame from './hooks/useMathGame.jsx';
import DailyStreakAnimation from './components/DailyStreakAnimation.jsx';

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
const SpeedTestScreen = lazy(() => import('./components/ui/SpeedTestScreen.jsx'));
import PreTestPopup from './components/PreTestPopup.jsx';
import PreTestScreen from './components/PreTestScreen.jsx';
import SettingsModal from './components/SettingsModal.jsx';

import { clearShootingStars } from './utils/mathGameLogic.js';
import audioManager from './utils/audioUtils.js';

import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';

export const MathGameContext = createContext({});

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
        {/* <Route path="/pre-test-popup" element={<PreTestPopup />} /> */}
        {/* <Route path="/pre-test" element={<PreTestScreen />} /> */}

        <Route path="/video" element={<VideoPlayerScreen />} />

        <Route element={<MainLayout hideStats={showSiblingCheck} />}> 
          <Route path="/levels" element={<TablePicker />} />
          <Route path="/belts" element={<DifficultyPicker />} />
          <Route path="/black" element={<BlackBeltPicker />} /> {/* ✅ BLACK ROUTE */}
          <Route path="/learning" element={<LearningModule />} />
          <Route path="/quiz" element={<QuizScreen />} />
          <Route path="/way-to-go" element={<WayToGoScreen />} />
          <Route path="/results" element={<ResultsScreen />} />
          <Route path="/theme" element={<ThemePicker />} />



        </Route>
      </Routes>
      </Suspense>

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