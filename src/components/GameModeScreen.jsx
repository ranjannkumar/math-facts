import React, { useRef, useEffect, useState } from 'react';
import { FaCog } from "react-icons/fa";
import SettingsModal from "./SettingsModal.jsx";
import { useMathGamePick } from '../store/mathGameBridgeStore.js';

const GameModeScreen = () => {

  const {
  currentQuestion,
  handleAnswer,
  isAnimating,
  isTimerPaused,
  gameModeType,
  surfCorrectStreak,
  completedSurfQuizzes,
  surfQuizzesRequired,
  questionsPerQuiz,
  rocketCorrectStreak,
  completedRocketQuizzes,
  rocketQuizzesRequired,
  rocketQuestionsPerQuiz,
  lightningCount,
  lightningCycleStart,
  questionStartTimestamp,
  showSettings,
  setShowSettings,
  handleQuit,
  handleResetProgress,
} = useMathGamePick((ctx) => ({
  currentQuestion: ctx.currentQuestion || null,
  handleAnswer: ctx.handleAnswer || (() => {}),
  isAnimating: Boolean(ctx.isAnimating),
  isTimerPaused: Boolean(ctx.isTimerPaused),
  gameModeType: ctx.gameModeType,
  surfCorrectStreak: Number.isFinite(ctx.surfCorrectStreak) ? ctx.surfCorrectStreak : 0,
  completedSurfQuizzes: Number.isFinite(ctx.completedSurfQuizzes) ? ctx.completedSurfQuizzes : 0,
  surfQuizzesRequired: Number.isFinite(ctx.surfQuizzesRequired) ? ctx.surfQuizzesRequired : 0,
  questionsPerQuiz: Number.isFinite(ctx.questionsPerQuiz) ? ctx.questionsPerQuiz : 0,
  rocketCorrectStreak: Number.isFinite(ctx.rocketCorrectStreak) ? ctx.rocketCorrectStreak : 0,
  completedRocketQuizzes: Number.isFinite(ctx.completedRocketQuizzes) ? ctx.completedRocketQuizzes : 0,
  rocketQuizzesRequired: Number.isFinite(ctx.rocketQuizzesRequired) ? ctx.rocketQuizzesRequired : 0,
  rocketQuestionsPerQuiz: Number.isFinite(ctx.rocketQuestionsPerQuiz) ? ctx.rocketQuestionsPerQuiz : 0,
  lightningCount: Number.isFinite(ctx.lightningCount) ? ctx.lightningCount : 0,
  lightningCycleStart: Number.isFinite(ctx.lightningCycleStart) ? ctx.lightningCycleStart : 0,
  questionStartTimestamp: ctx.questionStartTimestamp || { current: null },
  showSettings: Boolean(ctx.showSettings),
  setShowSettings: ctx.setShowSettings || (() => {}),
  handleQuit: ctx.handleQuit || (() => {}),
  handleResetProgress: ctx.handleResetProgress || (() => {}),
}));

const isSurfMode = gameModeType === 'surf';
const isRocketMode = gameModeType === 'rocket';
const isLightningMode = gameModeType === 'lightning' && !isSurfMode;

  const answerRefs = useRef([]);
  const lastClickRef = useRef({ qid: null, t: 0 });
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [typedInput, setTypedInput] = useState('');

  useEffect(() => {
  if (currentQuestion) {
    answerRefs.current = Array.isArray(currentQuestion.answers)
      ? currentQuestion.answers.map((_, i) => answerRefs.current[i] || React.createRef())
      : [];
    setIsAnswerSubmitted(false);
    lastClickRef.current = { qid: currentQuestion.id, t: 0 };
    setTypedInput('');

    // DO NOT clear symbol here
    // Symbol must persist until next answer

    if (questionStartTimestamp?.current) {
      questionStartTimestamp.current = Date.now();
    }
  }
}, [currentQuestion]);



  const handleAnswerClick = (answer) => {
    if (isAnswerSubmitted || isAnimating || isTimerPaused || !currentQuestion ) return;

    const now = Date.now();
    if (lastClickRef.current.qid === currentQuestion.id && now - lastClickRef.current.t < 700) {
      return; 
    }
    lastClickRef.current = { qid: currentQuestion.id, t: now };

    setIsAnswerSubmitted(true); 
    Promise.resolve(handleAnswer(answer))
      .finally(() => {
        setTimeout(() => {
          if (currentQuestion && lastClickRef.current.qid === currentQuestion.id) {
            setIsAnswerSubmitted(false);
          }
        }, 200);
      });
  };

  const handleDigitPress = (digit) => {
    if (isAnswerSubmitted || isAnimating || isTimerPaused || !currentQuestion) return;
    setTypedInput((prev) => {
      const raw = String(digit);
      const digitCount = prev.length;
      if (digitCount >= 4) return prev;
      return `${prev}${raw}`;
    });
  };

  const handleClear = () => {
    if (isAnswerSubmitted || isAnimating || isTimerPaused || !currentQuestion) return;
    setTypedInput('');
  };

  const handleSubmitTyped = () => {
    if (!typedInput || isAnswerSubmitted || isAnimating || isTimerPaused || !currentQuestion) return;
    const numericAnswer = Number(typedInput);
    if (!Number.isFinite(numericAnswer)) return;
    setIsAnswerSubmitted(true);
    Promise.resolve(handleAnswer(numericAnswer)).finally(() => {
      setTimeout(() => setIsAnswerSubmitted(false), 200);
    });
  };

  const surfEmojiCount = Math.max(
    0,
    Math.min(
      Number.isFinite(surfCorrectStreak) ? surfCorrectStreak : 0,
      Number.isFinite(questionsPerQuiz) ? questionsPerQuiz : 10
    )
  );
  const lightningSymbol = '\u26A1';
  const lightningCycleCount = Math.max(0, lightningCount - lightningCycleStart);
  const lightningCycleRemainder = lightningCycleCount % 5;
  const lightningDisplayCount =
    lightningCycleCount === 0 ? 0 : lightningCycleRemainder === 0 ? 5 : lightningCycleRemainder;
  const lightningDisplay = lightningSymbol.repeat(lightningDisplayCount);
  const rocketEmojiCount = Math.max(
    0,
    Math.min(
      Number.isFinite(rocketCorrectStreak) ? rocketCorrectStreak : 0,
      Number.isFinite(rocketQuestionsPerQuiz) ? rocketQuestionsPerQuiz : 10
    )
  );


  return (
    <div
      className="App min-h-screen w-full relative landscape-optimized portrait-optimized ios-notch"
      style={{
        // Game Mode 2 background should feel distinct
        background: isSurfMode
          ? 'radial-gradient(circle at 20% 20%, #2dd4bf 0%, #1e3a8a 38%, #0f172a 100%)'
          : isRocketMode
            ? 'radial-gradient(circle at 20% 20%, #fb923c 0%, #7c2d12 45%, #111827 100%)'
          : 'linear-gradient(135deg, #1A237E 0%, #303F9F 60%, #3F51B5 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        transition: 'background 0.5s ease',
        paddingTop: 'max(env(safe-area-inset-top), 1rem)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)'
      }}
    >
      <div className="w-full min-h-screen flex flex-col items-center justify-center relative">

        {/* --- TOP RIGHT SETTINGS / QUIT BUTTON --- */}
        <div
          className="absolute top-3 right-3 z-50"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <button
            onClick={() => setShowSettings(true)}
            aria-label="Game Mode Settings"
            className="bg-black/30 hover:bg-black/40 text-white rounded-full p-2 backdrop-blur-sm shadow-md"
          >
            <FaCog size={22} />
          </button>
        </div>

        
        <div className="w-full max-w-lg sm:max-w-xl mx-auto px-1 sm:px-2 md:px-4 mb-3 sm:mb-4">
          
         {/* --- LIGHTNING COUNTER & STREAK MESSAGE CONTAINER (Modified) --- */}
          <div className="relative h-4 sm:h-5 mb-1 sm:mb-2 flex flex-col justify-end">
            {isLightningMode && (
              <div className="flex justify-center items-center min-h-[2.5rem] sm:min-h-[3rem]">
                <span className="text-4xl sm:text-5xl font-black text-yellow-400 drop-shadow-lg inline-block scale-150" style={{ transformOrigin: 'center' }}>
                  {lightningDisplay}
                </span>
              </div>
            )}
          </div>

          {isSurfMode && surfCorrectStreak > 0 && (
            <div className="flex justify-center items-center gap-8 mt-2 sm:mt-3 mb-4 sm:mb-5 text-2xl sm:text-3xl">
              {Array.from({ length: surfCorrectStreak }).map((_, index) => (
                <span key={`surf-emoji-${index}`} role="img" aria-label="surfboard rider" className="inline-block" style={{ transform: 'scale(2.5)', transformOrigin: 'center' }}>
                  🏄🏽‍♂️
                </span>
              ))}
            </div>
          )}
          {isRocketMode && rocketEmojiCount > 0 && (
            <div className="flex justify-center items-center gap-8 mt-2 sm:mt-3 mb-4 sm:mb-5 text-2xl sm:text-3xl">
              {Array.from({ length: rocketEmojiCount }).map((_, index) => (
                <span key={`rocket-emoji-${index}`} role="img" aria-label="rocket" className="inline-block" style={{ transform: 'scale(2.5)', transformOrigin: 'center' }}>
                  {String.fromCodePoint(0x1f680)}
                </span>
              ))}
            </div>
          )}
        </div>

        <div
          className={`w-full mx-auto px-1 sm:px-2 md:px-4 ${
            isSurfMode ? 'max-w-sm sm:max-w-md' : 'max-w-lg sm:max-w-xl'
          }`}
        >
          <div
            className={
              isSurfMode
                ? 'bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl w-full mx-auto border border-blue-200/30 min-h-[200px] sm:min-h-[260px] md:min-h-[320px] flex flex-col justify-center'
                : 'bg-white backdrop-blur-sm rounded-xl sm:rounded-2xl mb-4 sm:mb-6 border-2 border-gray-200 flex flex-col justify-center p-3 sm:p-4 md:p-6 min-h-[200px] sm:min-h-[300px] md:min-h-[400px]'
            }
          >
            <div className="text-center mb-4 sm:mb-5 md:mb-6">
              <h3
                className={
                  isSurfMode
                    ? 'text-6xl sm:text-7xl font-extrabold text-green-500 text-center mb-6 whitespace-pre-line drop-shadow'
                    : 'font-extrabold text-green-500 mb-1 sm:mb-2 drop-shadow-lg text-7xl'
                }
              >
                {currentQuestion?.question || '1 + 1'}
              </h3>
            </div>

            {!isSurfMode && (
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2 md:gap-3 w-full">
                {(currentQuestion?.answers || [1, 2, 3, 4]).map((answer, index) => (
                  <button
                    key={index}
                    ref={answerRefs.current[index]}
                    onClick={() => handleAnswerClick(answer)}
                    disabled={isAnimating || !currentQuestion || isTimerPaused || isAnswerSubmitted}
                    className={
                      [
                        'w-full bg-gray-200/80 border-gray-300/80 backdrop-blur-sm rounded-lg sm:rounded-xl',
                        'p-3 sm:p-4 md:p-6 border-2',
                        'transition-none select-none',
                        'disabled:bg-gray-200/80 disabled:opacity-100 disabled:cursor-default disabled:shadow-none',
                        'focus:outline-none focus:ring-0 active:outline-none active:ring-0'
                      ].join(' ')
                    }
                    style={{
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <div
                      className="text-xl sm:text-2xl md:text-3xl font-baloo text-gray-700 drop-shadow-md"
                      style={{ fontFamily: 'Baloo 2, Comic Neue, cursive', letterSpacing: 2 }}
                    >
                      {currentQuestion?.answerLabels?.[answer] ?? answer}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {isSurfMode && (
              <div className="w-full max-w-sm mx-auto">
                <div className="w-full bg-white rounded-2xl h-24 flex items-center justify-center text-4xl font-extrabold shadow-lg border-4 border-green-300 text-gray-800 mb-4">
                  {typedInput === '' ? <span className="text-gray-400">Type answer</span> : typedInput}
                </div>

                <div className="grid gap-3 w-full max-w-sm mx-auto grid-cols-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                    <button
                      key={n}
                      onClick={() => handleDigitPress(n)}
                      disabled={isAnimating || isTimerPaused || isAnswerSubmitted}
                      className="bg-gray-100 text-gray-900 font-bold text-2xl py-2 rounded-xl shadow-md hover:bg-gray-200 active:scale-95 transition select-none border border-gray-200"
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={handleClear}
                    disabled={isAnimating || isTimerPaused || isAnswerSubmitted}
                    className="bg-gray-200 text-gray-800 font-semibold py-2 rounded-xl shadow-md hover:bg-gray-300 active:scale-95 transition col-span-1 border border-gray-300"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => handleDigitPress(0)}
                    disabled={isAnimating || isTimerPaused || isAnswerSubmitted}
                    className="bg-gray-100 text-gray-900 font-bold text-2xl py-2 rounded-xl shadow-md hover:bg-gray-200 active:scale-95 transition border border-gray-200"
                  >
                    0
                  </button>
                  <button
                    onClick={handleSubmitTyped}
                    disabled={
                      isAnimating ||
                      isTimerPaused ||
                      isAnswerSubmitted ||
                      typedInput === ''
                    }
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-2 rounded-xl shadow-md hover:from-green-600 hover:to-emerald-700 active:scale-95 transition col-span-1"
                  >
                    Submit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* --- SETTINGS / QUIT MODAL --- */}
          {showSettings && (
            <SettingsModal
              handleQuit={handleQuit}
              handleResetProgress={handleResetProgress}
              setShowSettings={setShowSettings}
            />
          )}

      </div>
    </div>
  );
};

export default GameModeScreen;
