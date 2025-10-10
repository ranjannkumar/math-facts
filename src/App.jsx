import React, { useEffect, createContext } from 'react';
import useMathGame from './hooks/useMathGame.jsx';

import StartScreen from './components/StartScreen.jsx';
import NameForm from './components/NameForm.jsx';
import ThemePicker from './components/ThemePicker.jsx';
import TablePicker from './components/TablePicker.jsx';
import DifficultyPicker from './components/DifficultyPicker.jsx';
import BlackBeltPicker from './components/BlackBeltPicker.jsx'; 
import QuizScreen from './components/QuizScreen.jsx';
import ResultsScreen from './components/ResultsScreen.jsx';
import WayToGoScreen from './components/WayToGoScreen.jsx';
import LearningModule from './components/LearningModule.jsx';
import SpeedTestScreen from './components/ui/SpeedTestScreen.jsx';
import PreTestPopup from './components/PreTestPopup.jsx';
import PreTestScreen from './components/PreTestScreen.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import MainLayout from './components/MainLayout.jsx';

import StreakAnimation from './components/ui/StreakAnimation.jsx';

import { clearShootingStars } from './utils/mathGameLogic.js';
import audioManager from './utils/audioUtils.js';

import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';

export const MathGameContext = createContext({});

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const ctx = useMathGame();

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
      <Routes>
        <Route path="/" element={<StartScreen />} />
        <Route path="/name" element={<NameForm />} />
        {/* <Route path="/pre-test-popup" element={<PreTestPopup />} /> */}
        {/* <Route path="/pre-test" element={<PreTestScreen />} /> */}

        <Route element={<MainLayout />}>
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

        
      {/* NEW: Streak Animation Overlay */}
      {ctx.showStreakAnimation && <StreakAnimation />} 
    </MathGameContext.Provider>
  );
};

export default App;
