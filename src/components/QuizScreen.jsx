// src/components/QuizScreen.jsx
import React, { useRef, useEffect, useContext } from 'react';
import { MathGameContext } from '../App.jsx';

const QuizScreen = () => {
  const {
    currentQuestion,
    quizProgress,
    answerSymbols,
    handleAnswer,
    isAnimating,
    showResult,
    selectedDifficulty,
    isTimerPaused
  } = useContext(MathGameContext);

  const answerRefs = useRef([]);

  useEffect(() => {
    if (currentQuestion) {
      answerRefs.current = currentQuestion.answers.map((_, i) => answerRefs.current[i] || React.createRef());
    }
  }, [currentQuestion]);

  const maxQuestions =
    selectedDifficulty === 'brown'
      ? 10
      : selectedDifficulty && selectedDifficulty.startsWith('black')
      ? selectedDifficulty.endsWith('7')
        ? 30
        : 20
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
          <div className="flex justify-center items-center mb-2 space-x-1">
            {answerSymbols.map((answer, index) => (
              <span
                key={`answer-${index}`}
                className={`text-2xl font-bold ${
                  answer.symbol === '⚡'
                    ? 'text-yellow-400'
                    : answer.symbol === '⭐'
                    ? 'text-yellow-500'
                    : answer.symbol === '✓'
                    ? 'text-green-500'
                    : 'text-red-500'
                }`}
                title={`${answer.timeTaken.toFixed(1)}s - ${answer.isCorrect ? 'Correct' : 'Wrong'}`}
              >
                {answer.symbol}
              </span>
            ))}
          </div>

          <div className="bg-gray-300 rounded-full h-3 sm:h-4 overflow-hidden shadow-lg">
            <div
              className="bg-green-500 h-full rounded-full transition-all duration-500 ease-out shadow-sm"
              style={{ width: `${quizProgress}%` }}
            ></div>
          </div>
          <div className="text-center mt-1 text-xs text-gray-300">{answerSymbols.length}/{maxQuestions}</div>
        </div>

        <div className="w-full max-w-lg sm:max-w-xl mx-auto px-1 sm:px-2 md:px-4">
          <div className="bg-white backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 border-2 border-gray-200 min-h-[200px] sm:min-h-[300px] md:min-h-[400px] flex flex-col justify-center">
            <div className="text-center mb-3 sm:mb-4 md:mb-6">
              <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-blue-600 mb-1 sm:mb-2 drop-shadow-lg">
                {currentQuestion?.question || '1 + 1'}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-1.5 sm:gap-2 md:gap-3 w-full">
              {(currentQuestion?.answers || [1, 2, 3, 4]).map((answer, index) => (
                <button
                  key={index}
                  ref={answerRefs.current[index]}
                  onClick={() => handleAnswer(answer, index)}
                  disabled={isAnimating || !currentQuestion || showResult || isTimerPaused}
                  className={`w-full bg-gray-200/80 border-gray-300/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border-2 no-transition ${
                    isAnimating || !currentQuestion || showResult || isTimerPaused ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
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
