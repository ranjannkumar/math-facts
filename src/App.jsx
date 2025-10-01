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
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-lg w-full flex flex-col items-center animate-pop-in">
            <h2 className="text-xl font-bold mb-4">Are you sure you want to quit?</h2>
            <button className="kid-btn bg-red-400 hover:bg-red-500 text-white mb-4" onClick={ctx.handleConfirmQuit}>
              Yes, Quit
            </button>
            <button className="kid-btn bg-gray-300 hover:bg-gray-400 text-gray-800" onClick={ctx.handleCancelQuit}>
              No, Resume
            </button>
          </div>
        </div>
      )}
    </MathGameContext.Provider>
  );
};

export default App;
