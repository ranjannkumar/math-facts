import React, { useEffect, useMemo, useState, useContext } from 'react';
import { MathGameContext } from '../App.jsx';
import { normalizeDifficulty } from '../utils/mathGameLogic.js';
import audioManager from '../utils/audioUtils.js';
import { quizPracticeAnswer, mapQuestionToFrontend } from '../api/mathApi.js';

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
  } = useContext(MathGameContext);

  const diff = useMemo(() => normalizeDifficulty(pendingDifficulty), [pendingDifficulty]);

  const [isShowingFact, setIsShowingFact] = useState(true);
  const [currentPracticeIndex, setCurrentPracticeIndex] = useState(0);
  const [practiceQ, setPracticeQ] = useState(null); 
  const [practiceMsg, setPracticeMsg] = useState('');
  const [showAdvanceButton, setShowAdvanceButton] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null); // Tracks the button click answer

  const isIntervention = !!interventionQuestion;
  const isPreQuizFlow = !isIntervention && preQuizPracticeItems?.length > 0;
  
  // --- INIT & RESET ---
  useEffect(() => {
    // Helper to map and set practice question details
    const initializePractice = (rawQuestion) => {
        const mappedQ = mapQuestionToFrontend(rawQuestion);
        console.log('Initialized Practice Question:', mappedQ);
        setPracticeQ(mappedQ);
        setSelectedAnswer(null); // Reset selection
        setShowAdvanceButton(false);
        setPracticeMsg('');
    };

    if (isIntervention && interventionQuestion) {
      // Intervention always starts with the Fact Screen (isShowingFact: true)
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
    
  }, [isIntervention, interventionQuestion, isPreQuizFlow, preQuizPracticeItems, navigate, startActualQuiz, setShowLearningModule, quizRunId]);
  
  useEffect(() => {
      if (!isIntervention && (!selectedTable || !diff) && !isPreQuizFlow) {
          setShowLearningModule(false);
          navigate('/belts');
      }
  }, [selectedTable, diff, isPreQuizFlow, isIntervention, setShowLearningModule, navigate]);
  
  
  // --- HELPERS ---
  const extractQuestion = (q) => {
    if (!q) return '—';
    // Question string is now correctly formatted (e.g., "9" or "0 + 0") by mapQuestionToFrontend
    return q.question;
  }
  
  const extractFactDisplay = (q) => {
      if (!q) return '—';
      const questionPart = extractQuestion(q);
      
      // If the question is a simple digit (like '9'), show '9 = 9' for the fact screen
      if (questionPart.includes('+')) {
          // Normal math fact: "A + B = C"
          return `${questionPart} = ${q.correctAnswer}`;
      }
      // Otherwise, show the full equation
      return `${questionPart} = ${q.correctAnswer}`;
  }


  // --- NAVIGATION LOGIC ---
  const handleNext = () => {
    // FIX: Only transition to practice screen if answers are available
    if (!practiceQ) return;
    audioManager.playButtonClick?.();
    setPracticeMsg('');
    setIsShowingFact(false); // Move from Fact Screen to Practice Screen

    if (isPreQuizFlow && (!practiceQ.answers || practiceQ.answers.length === 0)) {
        handleAdvancePreQuizFlow();
    } else if (!isIntervention && !isPreQuizFlow) {
        // If somehow triggered outside of flow
        navigate('/belts');
    }

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
        setShowLearningModule(false);
        startActualQuiz(quizRunId);
    }
  };
  
  // Handler for Intervention flow: resumes the paused quiz
  const handleResumeIntervention = () => {
    audioManager.playButtonClick?.();
    
    // Clear intervention state and resume timer/navigation
    setIsTimerPaused(false);
    if (pausedTime) setQuizStartTime((prev) => (prev ? prev + (Date.now() - pausedTime) : prev));
    setInterventionQuestion(null);
    setShowLearningModule(false);
    
    // Resume the quiz on the same question
    navigate('/quiz'); 
  }

  const handlePracticeAnswerClick = async (answer) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(answer);

    if (!practiceQ || !practiceQ.id || !quizRunId || !childPin) {
        setPracticeMsg('Error submitting practice: Practice question not found');
        return;
    }

    const isCorrect = answer === practiceQ.correctAnswer;
    
    if (isCorrect) {
      audioManager.playCorrectSound?.();
      setPracticeMsg('Correct!');
      setShowAdvanceButton(true);
      
      try {
        const out = await quizPracticeAnswer(quizRunId, practiceQ.id, answer, childPin); 
        
        if (isIntervention) {
            // Check for quiz completion immediately after practice (rare, but possible)
            if (out.completed) {
                 setTimeout(() => navigate('/results', { replace: true }), 300);
            }
        }

      } catch (e) {
        const msg = e.message || 'Error submitting practice: Not current question';
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
            <h3 className="text-xl font-bold text-center text-red-700 mb-4">You missed this fact:</h3>
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
        // Practice screen (Intervention) || [];
        const practiceAnswers = practiceQ.answers;
        console.log('Practice Answers:', practiceAnswers);
        return (
          <>
            <h3 className="text-xl font-bold text-center text-red-700 mb-4">Practice Time</h3>
            <div className="text-4xl font-extrabold text-green-600 text-center mb-4 whitespace-pre-line">
              {extractQuestion(practiceQ)}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 w-full">
              {practiceAnswers.map((answer, index) => (
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
            {practiceMsg && (
              <p className={`mt-4 font-semibold text-center ${practiceMsg === 'Correct!' ? 'text-green-700' : 'text-red-700'}`}>
                {practiceMsg}
              </p>
            )}
            {showAdvanceButton && (
                <div className="flex justify-center mt-4">
                    <button
                        type="button"
                        onClick={handleResumeIntervention}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
                    >
                        Resume Quiz
                    </button>
                </div>
            )}
          </>
        );
      }
    }
    
    // --- 2. Pre-Quiz Flow (Show Fact -> Practice -> Next Fact/Quiz) ---
    if (isPreQuizFlow) {
      const isLastFact = currentPracticeIndex === preQuizPracticeItems.length - 1;
      const progressText = `Fact ${currentPracticeIndex + 1} of ${preQuizPracticeItems.length}`;
      
      if (isShowingFact) {
        // Fact screen
        return (
          <>
            <h3 className="text-xl font-bold text-center text-blue-700 mb-4">{progressText}</h3>
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
        const buttonText = isLastFact ? 'Start Quiz' : 'Next Fact';

        return (
          <>
            <h3 className="text-xl font-bold text-center text-blue-700 mb-2">Practice Time ({progressText})</h3>
            <div className="text-4xl font-extrabold text-green-600 text-center mb-4 whitespace-pre-line">
              {extractQuestion(practiceQ)}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 w-full">
              {practiceAnswers.map((answer, index) => (
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
            {practiceMsg && (
              <p className={`mt-4 font-semibold text-center ${practiceMsg === 'Correct!' ? 'text-green-700' : 'text-red-700'}`}>
                {practiceMsg}
              </p>
            )}
            {showAdvanceButton && (
                <div className="flex justify-center mt-4">
                    <button
                        type="button"
                        onClick={handleAdvancePreQuizFlow}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
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