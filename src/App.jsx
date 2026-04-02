import React, { useEffect, createContext, lazy, Suspense, useMemo } from 'react'; 
import useMathGame from './hooks/useMathGame.jsx';
import DailyStreakAnimation from './components/DailyStreakAnimation.jsx';
import GetReadyScreen from './components/GetReadyScreen.jsx';

// NEW: Lazy loading imports for Code Splitting
import SiblingCheckModal from './components/SiblingCheckModal.jsx';
const StartScreen = lazy(() => import('./components/StartScreen.jsx'));
const NameForm = lazy(() => import('./components/NameForm.jsx'));
const ThemePicker = lazy(() => import('./components/ThemePicker.jsx'));
const OperationPicker = lazy(() => import('./components/OperationPicker.jsx'));
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
const GameModeSurfVideoScreen = lazy(() => import('./components/GameModeSurfVideoScreen.jsx'));
const GameModeSurfIntroScreen = lazy(() => import('./components/GameModeSurfIntroScreen.jsx'));
const GameModeSurfCompleteScreen = lazy(() => import('./components/GameModeSurfCompleteScreen.jsx'));
const GameModeLightningCompleteScreen = lazy(() => import('./components/GameModeLightningCompleteScreen.jsx'));
const GameModeRocketVideoScreen = lazy(() => import('./components/GameModeRocketVideoScreen.jsx'));
const GameModeRocketIntroScreen = lazy(() => import('./components/GameModeRocketIntroScreen.jsx'));
const UserQuestionStats = lazy(() => import('./components/UserQuestionStats.jsx'));
const AnalyticsScreen = lazy(() => import('./components/AnalyticsScreen.jsx'));
const AdminSettings = lazy(() => import('./components/AdminSettings.jsx'));

const SpeedTestScreen = lazy(() => import('./components/ui/SpeedTestScreen.jsx'));

import PreTestScreen from './components/PreTestScreen.jsx';
import PretestIntroScreen from './components/PretestIntroScreen.jsx';
import PretestResultScreen from './components/PretestResultScreen.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import StatusModal from './components/StatusModal.jsx';

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

  const providerValue = useMemo(() => ({ ...ctx, navigate }), [ctx, navigate]);

  return (
    <MathGameContext.Provider value={providerValue}>
      {/* NEW: Use Suspense to show a fallback while waiting for code to load */}
      <Suspense fallback={<InitialLoadingScreen />}>
      <Routes>
        <Route path="/" element={<StartScreen />} />
        <Route path="/name" element={<NameForm />} />
        
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin-settings" element={<AdminSettings />} />
        <Route path="/admin/user-stats/:pin/:name" element={<UserQuestionStats />} />
        <Route
            path="/admin/students/:pin/analytics"
            element={<AnalyticsScreen />}
          />

        {/* <Route path="/pretest" element={<PreTestScreen />} /> */}
        <Route path="/pretest-intro" element={<PretestIntroScreen />} />
        <Route path="/pretest-result" element={<PretestResultScreen />} />

        <Route path="/video" element={<VideoPlayerScreen />} />
        <Route path="/game-mode-video" element={<GameModeVideoScreen />} />  
        <Route path="/game-mode-video-select" element={<GameModeVideoSelectScreen />} /> 
        {/* Update this route to use the new path for the player */}
        <Route path="/game-mode-video-play/:videoName" element={<GameModeVideoPlayer />} />
        <Route path="/game-mode-lightning-complete" element={<GameModeLightningCompleteScreen />} />
        <Route path="/game-mode-surf-intro" element={<GameModeSurfIntroScreen />} />
        <Route path="/game-mode-surf-video/:kind" element={<GameModeSurfVideoScreen />} />
        <Route path="/game-mode-surf-complete" element={<GameModeSurfCompleteScreen />} />
        <Route path="/game-mode-rocket-intro" element={<GameModeRocketIntroScreen />} />
        <Route path="/game-mode-rocket-video/:kind" element={<GameModeRocketVideoScreen />} />


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
          <Route path="/pretest" element={<PreTestScreen />} />
          <Route path="/operations" element={<OperationPicker />} />

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
        <div className="fixed inset-0 z-50 p-4 animate-fade-in">
          <div
            className="absolute inset-0 bg-black"
            style={{
              backgroundImage: "url('/night_sky_landscape.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative flex h-full items-center justify-center">
          <div className="relative w-full max-w-[520px] animate-pop-in">
            <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-cyan-300/30 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-sky-300/20 blur-2xl" />
            <div className="rounded-[28px] bg-gradient-to-br from-cyan-300/70 via-teal-300/56 to-sky-300/62 p-[1.5px] shadow-[0_18px_48px_rgba(4,12,20,0.6)]">
              <div className="relative overflow-hidden rounded-[26px] border border-white/15 bg-slate-900/62 backdrop-blur-md">
                <div className="pointer-events-none absolute -top-14 -right-12 h-28 w-28 rounded-full bg-cyan-300/18 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-16 -left-12 h-32 w-32 rounded-full bg-sky-300/12 blur-2xl" />
                <div className="relative p-5 sm:p-6">
                  <div className="mx-auto mb-5 w-full rounded-2xl border border-cyan-100/15 bg-slate-950/48 px-4 py-4 text-center shadow-[inset_0_0_24px_rgba(34,211,238,0.12)]">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white" style={{ fontFamily: 'Baloo 2, Comic Neue, cursive' }}>
                      Confirm To Quit ?
                    </h2>
                  </div>
                  <div className="flex w-full gap-3 sm:gap-4">
                    <button
                      className="h-14 flex-1 rounded-xl border border-emerald-100/35 bg-gradient-to-r from-emerald-500 to-teal-500 text-base sm:text-lg font-black tracking-wide text-white shadow-lg shadow-emerald-900/30 transition-all duration-200 hover:-translate-y-0.5 hover:from-emerald-400 hover:to-teal-400 active:translate-y-0"
                      onClick={ctx.handleConfirmQuit}
                    >
                      Yes
                    </button>
                    <button
                      className="h-14 flex-1 rounded-xl border border-white/25 bg-slate-100 text-base sm:text-lg font-black tracking-wide text-slate-700 shadow-lg shadow-slate-900/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white active:translate-y-0"
                      onClick={ctx.handleCancelQuit}
                    >
                      No
                    </button>
                  </div>
                </div>
                <div className="h-[2px] w-full bg-gradient-to-r from-cyan-300/72 via-teal-300/66 to-sky-300/72" />
              </div>
            </div>
          </div>
          </div>
        </div>
      )}

      {ctx.showResetModal && (
        <div className="fixed inset-0 z-50 p-4 animate-fade-in">
          <div
            className="absolute inset-0 bg-black"
            style={{
              backgroundImage: "url('/night_sky_landscape.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative flex h-full items-center justify-center">
          <div className="relative w-full max-w-[520px] animate-pop-in">
            <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-cyan-300/30 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-sky-300/20 blur-2xl" />
            <div className="rounded-[28px] bg-gradient-to-br from-cyan-300/70 via-teal-300/56 to-sky-300/62 p-[1.5px] shadow-[0_18px_48px_rgba(4,12,20,0.6)]">
              <div className="relative overflow-hidden rounded-[26px] border border-white/15 bg-slate-900/62 backdrop-blur-md">
                <div className="pointer-events-none absolute -top-14 -right-12 h-28 w-28 rounded-full bg-cyan-300/18 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-16 -left-12 h-32 w-32 rounded-full bg-sky-300/12 blur-2xl" />
                <div className="relative p-5 sm:p-6">
                  <div className="mx-auto mb-5 w-full rounded-2xl border border-cyan-100/15 bg-slate-950/48 px-4 py-4 text-center shadow-[inset_0_0_24px_rgba(34,211,238,0.12)]">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white" style={{ fontFamily: 'Baloo 2, Comic Neue, cursive' }}>
                      Confirm Reset Progress ?
                    </h2>
                  </div>
                  <div className="flex w-full gap-3 sm:gap-4">
                    <button
                      className="h-14 flex-1 rounded-xl border border-red-200/45 bg-red-600 text-base sm:text-lg font-black tracking-wide text-white shadow-lg shadow-red-900/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-500 active:translate-y-0"
                      onClick={ctx.handleConfirmReset}
                    >
                      Yes
                    </button>
                    <button
                      className="h-14 flex-1 rounded-xl border border-white/25 bg-slate-100 text-base sm:text-lg font-black tracking-wide text-slate-700 shadow-lg shadow-slate-900/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white active:translate-y-0"
                      onClick={ctx.handleCancelReset}
                    >
                      No
                    </button>
                  </div>
                </div>
                <div className="h-[2px] w-full bg-gradient-to-r from-cyan-300/72 via-teal-300/66 to-sky-300/72" />
              </div>
            </div>
          </div>
          </div>
        </div>
      )}

      {ctx.uiMessage && (
        <StatusModal
          type={ctx.uiMessage.type}
          title={ctx.uiMessage.title}
          message={ctx.uiMessage.message}
          enableAutoClose={ctx.uiMessage.type === 'error' || Boolean(ctx.uiMessage.navigateTo)}
          autoCloseMs={5000}
          primaryLabel={
            ctx.uiMessage.primaryLabel || (ctx.uiMessage.navigateTo ? 'Back' : 'OK')
          }
          secondaryLabel={ctx.uiMessage.secondaryLabel}
          onPrimary={() => {
            const target = ctx.uiMessage.navigateTo;
            ctx.clearUiMessage();
            if (target) {
              ctx.navigate(target);
            }
          }}
          onSecondary={() => ctx.clearUiMessage()}
        />
      )}
    </MathGameContext.Provider>
  );
};

export default App;
