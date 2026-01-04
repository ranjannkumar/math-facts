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

useEffect(() => {
    setIsTimerPaused(false);
  }, [setIsTimerPaused]);


  const answerRefs = useRef([]);
  const lastClickRef = useRef({ qid: null, t: 0 });
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

  useEffect(() => {
  if (currentQuestion) {
    answerRefs.current = currentQuestion.answers.map(
      (_, i) => answerRefs.current[i] || React.createRef()
    );
    setIsAnswerSubmitted(false);
    lastClickRef.current = { qid: currentQuestion.id, t: 0 };

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

  return (
    <div
      className="App min-h-screen w-full relative landscape-optimized portrait-optimized ios-notch"
      style={{
        // Using a distinct dark theme for Game Mode
        background: 'linear-gradient(135deg, #1A237E 0%, #303F9F 60%, #3F51B5 100%)', 
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

        
        <div className="w-full max-w-lg sm:max-w-xl mx-auto px-1 sm:px-2 md:px-4 mb-4 sm:mb-6">
          
         {/* --- LIGHTNING COUNTER & STREAK MESSAGE CONTAINER (Modified) --- */}
          <div className="relative h-5 mb-2 flex flex-col justify-end">
             
            {/* TOP: Lightning Bolt Counter */}
            <div className="w-full flex justify-between items-center bg-yellow-900/50 rounded-lg p-2 mb-20 shadow-inner">
                <span className="text-xl font-bold text-yellow-400">⚡ Bolts:</span>
                <span className="text-3xl font-black text-white">{lightningCount % 5}</span>
            </div>

            {/* Middle: Transient Symbol Display */}
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
        </div>

        <div className="w-full max-w-lg sm:max-w-xl mx-auto px-1 sm:px-2 md:px-4">
          <div className="bg-white backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 border-2 border-gray-200 min-h-[200px] sm:min-h-[300px] md:min-h-[400px] flex flex-col justify-center">
            <div className="text-center mb-3 sm:mb-4 md:mb-6">
              <h3 className="text-7xl font-extrabold text-blue-600 mb-1 sm:mb-2 drop-shadow-lg">
                {currentQuestion?.question || '1 + 1'}
              </h3>
            </div>

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