// ranjannkumar/math-facts/math-facts-53836cb507e63890a9c757d863525a6cb3341e86/src/components/LearningModule.jsx
import React, { useEffect, useMemo, useState, useContext } from 'react';
import { MathGameContext } from '../App.jsx';
import { normalizeDifficulty } from '../utils/mathGameLogic.js';
import audioManager from '../utils/audioUtils.js';
import { mapQuestionToFrontend } from '../api/mathApi.js'; // Removed unused quizPracticeAnswer import

/**
 * Learning flow:
 * Pre-Quiz: Fact#1 (from /prepare) -> Practice#1 -> Fact#2 -> Practice#2 -> Start Quiz
 * Intervention: Intervention Question -> Practice -> Resume Quiz
 */


const LearningModule = () => {
  const {
    pendingDifficulty,
    selectedTable,
    setShowLearningModule,
    startActualQuiz,
    navigate,
    interventionQuestion,
    setInterventionQuestion,
    preQuizPracticeItems, 
    quizRunId,
    childPin,
    setIsTimerPaused,
    setQuizStartTime,
    pausedTime,
    setCurrentQuestion,
    setCurrentQuestionIndex,
    setQuizProgress,
    maxQuestions,
    handlePracticeAnswer, // <--- Import the new function from useMathGame
  } = useContext(MathGameContext);

  const diff = useMemo(() => normalizeDifficulty(pendingDifficulty), [pendingDifficulty]);

  const [isShowingFact, setIsShowingFact] = useState(true);
  const [currentPracticeIndex, setCurrentPracticeIndex] = useState(0);
  const [practiceQ, setPracticeQ] = useState(null); 
  const [practiceMsg, setPracticeMsg] = useState('');
  const [showAdvanceButton, setShowAdvanceButton] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null); // Tracks the button click answer //
  const [isStartingQuiz, setIsStartingQuiz] = useState(false); // Prevent double starts //

  const isIntervention = !!interventionQuestion;
  const isPreQuizFlow = !isIntervention && preQuizPracticeItems?.length > 0;

  const [isClosing, setIsClosing] = useState(false);
  
  // --- INIT & RESET ---
  useEffect(() => {
    // Helper to map and set practice question details
    if (isClosing) return;
    const initializePractice = (rawQuestion) => {
        const mappedQ = mapQuestionToFrontend(rawQuestion);
        console.log('Initialized Practice Question:', mappedQ);
        setPracticeQ(mappedQ);
        setSelectedAnswer(null); 
        setShowAdvanceButton(false);
        setPracticeMsg('');
    };

    if (isIntervention && interventionQuestion) {
      // Intervention flow: Always starts on the Fact Screen (isShowingFact: true)
      initializePractice(interventionQuestion);
      setIsShowingFact(true);
    } else if (isPreQuizFlow) {
      if (preQuizPracticeItems.length > 0) {
        // Pre-quiz starts with the Fact Screen for the first item
        const mappedItems = preQuizPracticeItems.map(mapQuestionToFrontend);
        setPracticeQ(mappedItems[0]);
        setCurrentPracticeIndex(0);
        setIsShowingFact(true);
      } else {
        setShowLearningModule(false);
        startActualQuiz(quizRunId);
      }
    } else {
      if (!isIntervention && !isPreQuizFlow) navigate('/belts');
    }
    
  }, [isIntervention, interventionQuestion, isPreQuizFlow, preQuizPracticeItems, navigate, startActualQuiz, setShowLearningModule, quizRunId,isClosing]);
  
  useEffect(() => {
      if (!isIntervention && (!selectedTable || !diff) && !isPreQuizFlow) {
          setShowLearningModule(false);
          navigate('/belts');
      }
  }, [selectedTable, diff, isPreQuizFlow, isIntervention, setShowLearningModule, navigate]);
  
  
  // --- HELPERS ---
  const extractQuestion = (q) => {
    if (!q) return '—';
    // If the question field is just a digit (for L1 white belt), display it clearly
    if (!isNaN(Number(q.question)) && q.question.length === 1 && q.question !== '0') {
         return q.question;
    }
    return q.question;
  }
  
  const extractFactDisplay = (q) => {
      if (!q) return '—';
      const questionPart = extractQuestion(q);
      
      // Handle digit recognition case (e.g., Q: "9", Fact: "9 = 9")
      if (!questionPart.includes('+') && !questionPart.includes('-') && !questionPart.includes('×') && !questionPart.includes('÷')) {
          return `${questionPart} = ${q.correctAnswer}`;
      }
      
      // Otherwise, show the full equation (e.g., "A + B = C")
      return `${questionPart} = ${q.correctAnswer}`;
  }

  const handleNext = () => {
    if (!practiceQ) return;
    audioManager.playButtonClick?.();
    setPracticeMsg('');
    setIsShowingFact(false); // Move from Fact Screen to Practice Screen
  };
  
  // Handler for Pre-Quiz flow: moves to next fact or starts quiz
  const handleAdvancePreQuizFlow = () => {
    audioManager.playButtonClick?.();
    const nextIndex = currentPracticeIndex + 1;
    if (nextIndex < preQuizPracticeItems.length) {
        // Map the next raw question from the list
        const mappedQ = mapQuestionToFrontend(preQuizPracticeItems[nextIndex]);
        
        setCurrentPracticeIndex(nextIndex);
        setPracticeQ(mappedQ);
        setIsShowingFact(true); // Move back to Fact screen for the next fact
        setShowAdvanceButton(false);
        setSelectedAnswer(null);
    } else {
        // Last practice item is done, start quiz
        setIsStartingQuiz(true);
        setShowLearningModule(false);
        startActualQuiz(quizRunId);
    }
  };

  const handlePracticeAnswerClick = async (answer) => {
    if (selectedAnswer !== null || !practiceQ) return;
    
    setSelectedAnswer(answer);

    const isCorrect = answer === practiceQ.correctAnswer;
    
    if (isCorrect) {
        audioManager.playCorrectSound?.();
        setPracticeMsg('Correct!');
        setShowAdvanceButton(true);

        try {
          const out = await handlePracticeAnswer(practiceQ.id, answer);

          if (isPreQuizFlow) {
            // Pre-quiz: let the advance button control flow
            return;
          }

          if (isIntervention) {
            // FIX: If API confirmed resume, navigate immediately.
            if (out.resume) {
              setIsClosing(true);                 
              setInterventionQuestion(null);      
              setShowLearningModule(false);       
              navigate('/quiz', { replace: true });
              return;
            }
          }
        } catch (e) {
          const msg = e.message || 'Error submitting practice.';
          console.error('Practice submission failed:', msg);
          setPracticeMsg('Error submitting practice: ' + msg);
        }
      } else {
        audioManager.playWrongSound?.();
        setPracticeMsg('Wrong! Try again.');
        setTimeout(() => {
          setSelectedAnswer(null);
          setPracticeMsg('');
        }, 1000);
      }
    };

  const renderPracticeInteractions = (answers, currentCorrectAnswer) => (
      <>
          <div className="grid grid-cols-2 gap-4 mt-4 w-full">
              {answers.map((answer, index) => (
                  <button
                      key={index}
                      onClick={() => handlePracticeAnswerClick(answer)}
                      disabled={!!selectedAnswer}
                      className={`py-4 rounded-xl text-2xl font-bold shadow-md transition-all duration-200
                      ${
                          selectedAnswer === null
                              ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                              : answer === currentCorrectAnswer
                                  ? 'bg-green-500 text-white'
                                  : answer === selectedAnswer
                                      ? 'bg-red-500 text-white'
                                      : 'bg-gray-200 text-gray-800 opacity-50'
                      }`}
                  >
                      {answer}
                  </button>
              ))}
          </div>
      </>
  );

  const renderBody = () => {
    if (!practiceQ) {
        return (
            <div className="text-center">
                <h3 className="text-xl font-bold text-center text-blue-700 mb-4">Loading Module</h3>
                <p>Preparing content or already starting quiz...</p>
            </div>
        );
    }
    
    const currentCorrectAnswer = practiceQ.correctAnswer;
    const practiceAnswers = practiceQ.answers || []; // Safely access answers

    // --- 1. Intervention Flow (Show Fact -> Practice -> Resume) ---
    if (isIntervention) {
      if (isShowingFact) {
        // Fact screen
        return (
          <>
            <div className="text-8xl sm:text-10xl md:text-6xl lg:text-7xl font-bold text-green-600 mb-4 whitespace-pre-line text-center">
              {extractFactDisplay(practiceQ)}
            </div>
            <div className="flex justify-center">
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-6 sm:px-8 rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 text-base sm:text-lg shadow-lg"
                onClick={handleNext}
              >
                Next
              </button>
            </div>
          </>
        );
      } else {
        return (
          <>
            <div className="text-7xl font-extrabold text-green-600 text-center mb-4 whitespace-pre-line">
              {extractQuestion(practiceQ)}
            </div>
            
            {renderPracticeInteractions(practiceAnswers, currentCorrectAnswer)}

          </>
        );
      }
    }
    
    // --- 2. Pre-Quiz Flow (Show Fact -> Practice -> Next Fact/Quiz) ---
    if (isPreQuizFlow) {
      const isLastFact = currentPracticeIndex === preQuizPracticeItems.length - 1;
      
      if (isShowingFact) {
        // Fact screen
        return (
          <>
            <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-green-600 mb-4 whitespace-pre-line text-center">
              {extractFactDisplay(practiceQ)}
            </div>
            <div className="flex justify-center">
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-6 sm:px-8 rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 text-base sm:text-lg shadow-lg"
                onClick={handleNext}
              >
                Next
              </button>
            </div>
          </>
        );
      } else {
        // Practice screen (Pre-Quiz)
        const buttonText = isLastFact ? 'Start Quiz' : 'Next';

        return (
          <>
            <div className="text-7xl font-extrabold text-green-600 text-center mb-4 whitespace-pre-line">
              {extractQuestion(practiceQ)}
            </div>

            {renderPracticeInteractions(practiceAnswers, currentCorrectAnswer)}
            
            {showAdvanceButton && (
                <div className="flex justify-center mt-4">
                    <button
                        type="button"
                        onClick={handleAdvancePreQuizFlow}
                        disabled={isStartingQuiz}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
                    >
                        {buttonText}
                    </button>
                </div>
            )}
          </>
        );
      }
    }
    
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl max-w-sm sm:max-w-md w-full mx-2 sm:mx-4 border border-blue-200/30 popup-zoom-in">
        {renderBody()}
      </div>
    </div>
  );
};

export default LearningModule;