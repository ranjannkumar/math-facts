import React, { useRef, useEffect, useContext, useState } from 'react';
import { MathGameContext } from '../App.jsx';
import { motion, AnimatePresence } from "framer-motion";
import { FaCog } from "react-icons/fa";
import SettingsModal from "./SettingsModal.jsx";

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
  transientStreakMessage,
  lightningCount,
  currentAnswerSymbol,
  setCurrentAnswerSymbol,
  questionStartTimestamp,
  LIGHTNING_GOAL,
  showSettings,
  setShowSettings,
  handleQuit,
  handleResetProgress,
  setIsTimerPaused,
} = useContext(MathGameContext);

const isSurfMode = gameModeType === 'surf' || (currentQuestion?.answers || []).length === 0;

useEffect(() => {
    setIsTimerPaused(false);
  }, [setIsTimerPaused]);

  useEffect(() => {
    if (isSurfMode) {
      setCurrentAnswerSymbol(null);
    }
  }, [isSurfMode, setCurrentAnswerSymbol]);


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
    setTypedInput((prev) => (prev.length < 4 ? prev + String(digit) : prev));
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


  return (
    <div
      className="App min-h-screen w-full relative landscape-optimized portrait-optimized ios-notch"
      style={{
        // Game Mode 2 background should feel distinct
        background: isSurfMode
          ? 'radial-gradient(circle at 20% 20%, #2dd4bf 0%, #1e3a8a 38%, #0f172a 100%)'
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
             
            {/* TOP: Counter */}
            {isSurfMode ? (
              <div className="w-full flex justify-between items-center bg-emerald-900/40 rounded-lg p-2 mb-4 sm:mb-6 shadow-inner">
                <span className="text-lg font-bold text-emerald-200">
                  Surfboard:  
                </span>
                <span className="text-lg font-bold text-emerald-200">
                  {surfCorrectStreak}/{questionsPerQuiz}
                </span>
              </div>
            ) : (
              <div className="w-full flex justify-between items-center bg-yellow-900/50 rounded-lg p-2 mb-12 sm:mb-16 shadow-inner">
                <span className="text-xl font-bold text-yellow-400">⚡ Bolts:</span>
                <span className="text-3xl font-black text-white">{lightningCount % 5}</span>
              </div>
            )}

            {/* Middle: Transient Symbol Display */}
            {!isSurfMode && (
              <div className="flex justify-center items-center absolute w-full top-15">
                <AnimatePresence>
                {currentAnswerSymbol && (
                  <motion.span
                      key="answer-symbol"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.5 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className={`text-5xl font-black drop-shadow-lg ${
                        currentAnswerSymbol.symbol === '⚡'
                          ? 'text-yellow-400'
                          : currentAnswerSymbol.symbol === '✓'
                          ? 'text-green-500'
                          : 'text-red-500'
                      }`}
                  >
                    {currentAnswerSymbol.symbol}
                  </motion.span>
                )}
                </AnimatePresence>
              </div>
            )}


            {/* BOTTOM: Transient Streak Message (Positioned over the answer area) */}
            <AnimatePresence>
              {transientStreakMessage && (
                <motion.div
                  key="streak-message-box"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="absolute z-20 top-4 text-3xl font-black whitespace-nowrap w-full text-center"
                  style={{
                    color: transientStreakMessage.symbolType === 'lightning' ? '#FBBF24' : '#10B981',
                    textShadow: '0 0 6px rgba(0,0,0,0.7), 0 0 3px rgba(0,0,0,0.5)',
                    fontWeight: 900, 
                  }}
                >
                  {transientStreakMessage.text}
                </motion.div>
              )}
            </AnimatePresence>
            
          </div>

          {isSurfMode && surfCorrectStreak > 0 && (
            <div className="flex justify-center items-center gap-2 mt-2 sm:mt-3 text-2xl sm:text-3xl">
              {Array.from({ length: surfCorrectStreak }).map((_, index) => (
                <span key={`surf-emoji-${index}`} role="img" aria-label="surfboard rider">
                  🏄
                </span>
              ))}
            </div>
          )}
        </div>

        <div
          className={`w-full mx-auto px-1 sm:px-2 md:px-4 ${
            isSurfMode ? 'max-w-md sm:max-w-lg md:max-w-xl' : 'max-w-lg sm:max-w-xl'
          }`}
        >
          <div
            className={`${
              isSurfMode
                ? 'bg-gray-500/80 border border-gray-500/60 backdrop-blur-md'
                : 'bg-white border-2 border-gray-200 backdrop-blur-sm'
            } rounded-xl sm:rounded-2xl mb-4 sm:mb-6 flex flex-col justify-center ${
              isSurfMode
                ? 'p-4 sm:p-5 md:p-6 min-h-[200px] sm:min-h-[260px] md:min-h-[320px]'
                : 'p-3 sm:p-4 md:p-6 min-h-[200px] sm:min-h-[300px] md:min-h-[400px]'
            }`}
          >
            <div className="text-center mb-4 sm:mb-5 md:mb-6">
              <h3
                className={`font-extrabold mb-1 sm:mb-2 drop-shadow-lg ${
                  isSurfMode ? 'text-7xl sm:text-8xl text-green-600' : 'text-7xl sm:text-8xl text-blue-600'
                }`}
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
                      className="text-xl sm:text-2xl md:text-3xl font-baloo text-gray-800 drop-shadow-md"
                      style={{ fontFamily: 'Baloo 2, Comic Neue, cursive', letterSpacing: 2 }}
                    >
                      {answer}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {isSurfMode && (
              <div className="w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto">
                <div className="relative px-3 sm:px-4 py-2">
                  <div className="w-full bg-gray-800/60 rounded-xl sm:rounded-2xl h-11 sm:h-12 md:h-14 flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-extrabold text-white shadow mb-3 sm:mb-4">
                    {typedInput === '' ? <span className="text-gray-400">Type answer</span> : typedInput}
                  </div>

                  <div className="grid grid-cols-4 gap-2 sm:gap-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <button
                        key={n}
                        onClick={() => handleDigitPress(n)}
                        disabled={isAnimating || isTimerPaused || isAnswerSubmitted}
                        className="h-16 sm:h-20 w-full bg-gray-700 hover:bg-gray-800 text-white text-center font-bold text-xl rounded-xl transition-all duration-150 transform hover:scale-[1.03] active:scale-[0.98] shadow-md flex items-center justify-center select-none"
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      onClick={() => handleDigitPress(9)}
                      disabled={isAnimating || isTimerPaused || isAnswerSubmitted}
                      className="h-16 sm:h-20 w-full bg-gray-700 hover:bg-gray-800 text-white text-center font-bold text-xl rounded-xl transition-all duration-150 transform hover:scale-[1.03] active:scale-[0.98] shadow-md flex items-center justify-center select-none"
                    >
                      9
                    </button>
                    <button
                      onClick={() => handleDigitPress(0)}
                      disabled={isAnimating || isTimerPaused || isAnswerSubmitted}
                      className="h-16 sm:h-20 w-full bg-gray-700 hover:bg-gray-800 text-white text-center font-bold text-xl rounded-xl transition-all duration-150 transform hover:scale-[1.03] active:scale-[0.98] shadow-md flex items-center justify-center select-none"
                    >
                      0
                    </button>
                    <button
                      onClick={handleClear}
                      disabled={isAnimating || isTimerPaused || isAnswerSubmitted}
                      className="h-16 sm:h-20 w-full bg-gray-700 hover:bg-gray-800 text-white text-center font-bold text-xl rounded-xl transition-all duration-150 transform hover:scale-[1.03] active:scale-[0.98] shadow-md flex items-center justify-center select-none col-span-2"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="flex justify-center mt-3 sm:mt-4">
                    <button
                      onClick={handleSubmitTyped}
                      disabled={
                        isAnimating ||
                        isTimerPaused ||
                        isAnswerSubmitted ||
                        typedInput === ''
                      }
                      className="bg-green-800 hover:bg-green-900 text-white font-bold py-3 rounded-2xl duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
                    >
                      Submit
                    </button>
                  </div>
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
