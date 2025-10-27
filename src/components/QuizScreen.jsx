// src/components/QuizScreen.jsx
import React, { useRef, useEffect, useContext, useState } from 'react';
import { MathGameContext } from '../App.jsx';
// import StreakAnimation from './StreakAnimation.jsx';
import { motion, AnimatePresence } from "framer-motion";

const QuizScreen = () => {
  const {
    currentQuestion,
    quizProgress,
    answerSymbols,
    handleAnswer,
    isAnimating,
    showResult,
    selectedDifficulty,
    isTimerPaused,
    // <<< NEW CONTEXT PROPS
    transientStreakMessage,
    streakPosition,
    isAwaitingInactivityResponse,
  } = useContext(MathGameContext);

  const answerRefs = useRef([]);
  
  const lastClickRef = useRef({ qid: null, t: 0 });
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

  useEffect(() => {
    if (currentQuestion) {
      answerRefs.current = currentQuestion.answers.map((_, i) => answerRefs.current[i] || React.createRef());
      setIsAnswerSubmitted(false);
      lastClickRef.current = { qid: currentQuestion.id, t: 0 };
    }
  }, [currentQuestion]);

  const handleAnswerClick = (answer) => {
  // Don’t proceed if UI is animating/paused/etc.
  if (isAnswerSubmitted || isAnimating || showResult || isTimerPaused || !currentQuestion ) return;

  // --- NEW: Ignore rapid re-clicks on the same question BEFORE locking the UI ---
  const now = Date.now();
  if (lastClickRef.current.qid === currentQuestion.id && now - lastClickRef.current.t < 700) {
    return; // just ignore; do NOT lock
  }
  lastClickRef.current = { qid: currentQuestion.id, t: now };

  setIsAnswerSubmitted(true); // lock for this question
  // Call into hook; add a small failsafe to auto-unlock if question didn't advance
  Promise.resolve(handleAnswer(answer))
    .finally(() => {
      // Safety unlock: if question hasn't changed after ~1.2s, re-enable buttons
      setTimeout(() => {
        if (currentQuestion && lastClickRef.current.qid === currentQuestion.id) {
          setIsAnswerSubmitted(false);
        }
      }, 200);
    });
};


  const maxQuestions =
    selectedDifficulty === 'brown'
      ? 10
      : selectedDifficulty && selectedDifficulty.startsWith('black')
      ? 20
      : 10;

  return (
    <div
      className="App min-h-screen w-full relative landscape-optimized portrait-optimized ios-notch"
      style={{
        background: 'linear-gradient(135deg, #23272f 0%, #18181b 60%, #111113 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        transition: 'background 0.5s ease',
        paddingTop: 'max(env(safe-area-inset-top), 1rem)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)'
      }}
    >
      <div className="w-full min-h-screen flex flex-col items-center justify-center relative">
        <div className="w-full max-w-lg sm:max-w-xl mx-auto px-1 sm:px-2 md:px-4 mb-4 sm:mb-6">
          
         {/* --- STREAK MESSAGE & PROGRESS BAR CONTAINER --- */}
          <div className="relative h-20 mb-4">
            
            {/* Answer Symbols (shifted slightly up) */}
            <div className="flex justify-center items-center absolute w-full top-0 space-x-1">
              {answerSymbols.map((answer, index) => (
                <span
                  key={`answer-${index}`}
                  className={`text-2xl font-bold ${
                    answer.symbol === '⚡'
                      ? 'text-yellow-400'
                      : answer.symbol === '✓'
                      ? 'text-green-500'
                      : answer.symbol.trim() === ''
                      ? 'text-transparent'
                      : 'text-red-500'
                  }`}
                  title={`${answer.timeTaken.toFixed(1)}s - ${answer.isCorrect ? 'Correct' : 'Wrong'}`}
                  style={{ minWidth: answer.symbol.trim() === '' ? '0' : 'auto' }}
                >
                  {answer.symbol}
                </span>
              ))}
            </div>

            {/* Transient Streak Message (Above the bar, dynamically positioned) */}
            <AnimatePresence>
              {transientStreakMessage && (
                <motion.div
                  key="streak-message-box"
                  // Fade + slight vertical rise only. No horizontal animation.
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="absolute z-20 bottom-4 sm:bottom-5 text-2xl font-black whitespace-nowrap"
                  style={{
                    // Keep left anchored to progress position, but DO NOT animate it.
                    left: `${Math.min(70, Math.max(10, streakPosition))}%`,
                    transform: 'translateX(-50%)', // center on the point without x tweening
                    color: transientStreakMessage.symbolType === 'lightning' ? '#FBBF24' : '#10B981',
                    textShadow: '0 0 4px rgba(0,0,0,0.5)',
                    fontWeight: 900, 
                  }}
                >
                  {transientStreakMessage.text}
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Progress Bar (Positioned at the bottom of this container) */}
            <div className="absolute bottom-0 w-full bg-gray-300 rounded-full h-3 sm:h-4 overflow-hidden shadow-lg">
              <div
                className="bg-green-500 h-full rounded-full transition-all duration-500 ease-out shadow-sm"
                style={{ width: `${quizProgress}%` }}
              />
            </div>

          </div>
          {/* <div className="text-center mt-1 text-xs text-gray-300">{answerSymbols.length}/{maxQuestions}</div> */}
        </div>

        <div className="w-full max-w-lg sm:max-w-xl mx-auto px-1 sm:px-2 md:px-4">
          <div className="bg-white backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 border-2 border-gray-200 min-h-[200px] sm:min-h-[300px] md:min-h-[400px] flex flex-col justify-center">
            <div className="text-center mb-3 sm:mb-4 md:mb-6">
              <h3 className="text-7xl font-extrabold text-green-600 mb-1 sm:mb-2 drop-shadow-lg">
                {currentQuestion?.question || '1 + 1'}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-1.5 sm:gap-2 md:gap-3 w-full">
              {(currentQuestion?.answers || [1, 2, 3, 4]).map((answer, index) => (
                <button
                  key={index}
                  ref={answerRefs.current[index]}
                  onClick={() => handleAnswerClick(answer)}
                  disabled={isAnimating || !currentQuestion || showResult || isTimerPaused || isAnswerSubmitted || isAwaitingInactivityResponse}
                  className={
                    [
                      // Base look
                      'w-full bg-gray-200/80 border-gray-300/80 backdrop-blur-sm rounded-lg sm:rounded-xl',
                      'p-3 sm:p-4 md:p-6 border-2',
                      // Freeze visuals completely
                      'transition-none select-none',
                      // Keep identical look even when disabled
                      'disabled:bg-gray-200/80 disabled:opacity-100 disabled:cursor-default disabled:shadow-none',
                      // Remove focus/active visual artifacts
                      'focus:outline-none focus:ring-0 active:outline-none active:ring-0'
                    ].join(' ')
                  }
                  style={{
                    WebkitTapHighlightColor: 'transparent' // prevent mobile tap highlight
                  }}
                  // Prevents some browsers from applying :active styles visually
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizScreen;