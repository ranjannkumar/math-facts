// src/components/LearningModule.jsx
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

  const [step, setStep] = useState(0); 
  const [practiceQ, setPracticeQ] = useState(null); 
  const [practiceInput, setPracticeInput] = useState('');
  const [practiceMsg, setPracticeMsg] = useState('');

  const isIntervention = !!interventionQuestion;
  const isPreQuizFlow = !isIntervention && preQuizPracticeItems?.length > 0;
  
  const fact1 = isPreQuizFlow && preQuizPracticeItems[0];
  const fact2 = isPreQuizFlow && preQuizPracticeItems[isPreQuizFlow ? preQuizPracticeItems.length - 1 : 1];


  // --- INIT & RESET ---
  useEffect(() => {
    if (isIntervention && interventionQuestion) {
      setPracticeQ(interventionQuestion);
      setStep(1); 
    } else if (isPreQuizFlow) {
      setStep(0);
      setPracticeQ(null);
    } else {
      if (!isIntervention && !isPreQuizFlow) navigate('/belts');
    }
    
    setPracticeInput('');
    setPracticeMsg('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isIntervention, interventionQuestion, isPreQuizFlow]);
  
  useEffect(() => {
      if (!isIntervention && (!selectedTable || !diff) && !isPreQuizFlow) {
          setShowLearningModule(false);
          navigate('/belts');
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTable, diff, isPreQuizFlow, isIntervention]);
  
  
  // --- HELPERS ---
  const extractQuestion = (q) => {
    if (!q) return '—';
    // The backend provides the full question string in the object if the object is from /answer or /inactivity.
    // If it's a practice object from /prepare, it might just have params. We default to the mapQuestionToFrontend behavior.
    return q.question || `${q.params.a} + ${q.params.b}`;
  }


  // --- NAVIGATION LOGIC ---
  const handleNext = () => {
    audioManager.playButtonClick?.();
    setPracticeInput('');
    setPracticeMsg('');

    if (isPreQuizFlow) {
        if (step === 0) {
          setPracticeQ(fact1);
          setStep(1);
        } else if (step === 2) {
          setPracticeQ(fact2);
          setStep(3);
        } else if (step === 3) {
          setShowLearningModule(false);
          startActualQuiz(quizRunId);
        }
    }
  };

  const handlePracticeSubmit = async (e) => {
    e?.preventDefault?.();
    const val = Number(practiceInput);
    if (!practiceQ || !quizRunId || !childPin) return;

    if (val === practiceQ.correctAnswer) {
      audioManager.playCorrectSound?.();
      setPracticeMsg('Correct!');
      
      try {
        const out = await quizPracticeAnswer(quizRunId, practiceQ.id, val, childPin);

        setTimeout(() => {
            if (isIntervention) {
                if (out.resume) {
                    setIsTimerPaused(false);
                    if (pausedTime) setQuizStartTime((prev) => (prev ? prev + (Date.now() - pausedTime) : prev));
                    setInterventionQuestion(null);
                    setShowLearningModule(false);
                    
                    if (out.resume !== true) { 
                        setCurrentQuestion(mapQuestionToFrontend(out.resume));
                        setCurrentQuestionIndex(prev => prev + 1);
                        setQuizProgress((prev) => Math.min(prev + 100 / maxQuestions, 100)); 
                    } else {
                        navigate('/results', { replace: true }); // Should only happen if completed exactly after practice
                    }
                    
                    navigate('/quiz'); 

                } else if (out.completed) {
                    navigate('/results', { replace: true });
                }
                
            } else if (isPreQuizFlow) {
                if (step === 1) {
                    setStep(2); 
                    setPracticeQ(null);
                } else if (step === 3) {
                    setShowLearningModule(false);
                    startActualQuiz(quizRunId);
                }
            }
            setPracticeInput('');
            setPracticeMsg('');

        }, 300);

      } catch (e) {
        console.error('Practice submission failed:', e.message);
        setPracticeMsg('Error submitting practice: ' + e.message);
      }

    } else {
      audioManager.playWrongSound?.();
      setPracticeMsg('Try again.');
    }
  };


  const renderBody = () => {
    // 1. Intervention Practice Screen
    if (isIntervention) {
      if (!practiceQ) return <p className="text-white">Loading practice question...</p>;
      const isCorrect = practiceInput && Number(practiceInput) === practiceQ.correctAnswer;
      
      return (
        <>
          <h3 className="text-xl font-bold text-center text-red-700 mb-4">You missed this fact:</h3>
          <div className="text-4xl font-extrabold text-green-600 text-center mb-4 whitespace-pre-line">
            {extractQuestion(practiceQ)} = {practiceQ.correctAnswer}
          </div>
          <form onSubmit={handlePracticeSubmit} className="flex flex-col items-center gap-3">
            <div className="text-lg font-semibold text-gray-700">{extractQuestion(practiceQ)}</div>
            <input
              type="number"
              value={practiceInput}
              onChange={(e) => setPracticeInput(e.target.value)}
              className="w-28 text-center text-2xl border-2 border-gray-300 rounded-lg px-3 py-2"
              required
            />
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
              disabled={isCorrect}
            >
              Practice
            </button>
            {practiceMsg && (
              <p className={`mt-2 font-semibold ${practiceMsg === 'Correct!' ? 'text-green-700' : 'text-red-700'}`}>
                {practiceMsg}
              </p>
            )}
            
          </form>
        </>
      );
    }
    
    // 2. Pre-Quiz Fact Screens (0 and 2)
    if (isPreQuizFlow && (step === 0 || step === 2)) {
      const fact = step === 0 ? fact1 : fact2;
      const progressText = step === 0 ? 'Fact 1 of 2' : 'Fact 2 of 2';
      if (!fact) return <p className="text-white">Loading fact...</p>;

      return (
        <>
          <h3 className="text-xl font-bold text-center text-blue-700 mb-4">{progressText}</h3>
          <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-green-600 mb-4 whitespace-pre-line text-center">
            {extractQuestion(fact)} = {fact.correctAnswer}
          </div>
          <div className="flex justify-center">
            <button
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-6 sm:px-8 rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 text-base sm:text-lg shadow-lg"
              onClick={handleNext}
            >
              {step === 0 ? 'Practice Fact 1' : 'Practice Fact 2'}
            </button>
          </div>
        </>
      );
    }

    // 3. Pre-Quiz Practice Screens (1 and 3)
    if (isPreQuizFlow && (step === 1 || step === 3)) {
      if (!practiceQ) return <p className="text-white">Loading practice question...</p>;
      
      const buttonText = step === 1 ? 'Next Fact' : 'Start Quiz';
      const isCorrect = practiceInput && Number(practiceInput) === practiceQ.correctAnswer;

      return (
        <>
          <h3 className="text-xl font-bold text-center text-blue-700 mb-2">Practice Time</h3>
          <div className="text-4xl font-extrabold text-green-600 text-center mb-4 whitespace-pre-line">
            {extractQuestion(practiceQ)}
          </div>
          <form onSubmit={handlePracticeSubmit} className="flex flex-col items-center gap-3">
            <input
              type="number"
              value={practiceInput}
              onChange={(e) => setPracticeInput(e.target.value)}
              className="w-28 text-center text-2xl border-2 border-gray-300 rounded-lg px-3 py-2"
              required
            />
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
              disabled={isCorrect}
            >
              Check
            </button>
            {practiceMsg && (
              <p className={`mt-2 font-semibold ${practiceMsg === 'Correct!' ? 'text-green-700' : 'text-red-700'}`}>
                {practiceMsg}
              </p>
            )}
            
            {practiceMsg === 'Correct!' && (
                 <button
                    type="button"
                    onClick={handleNext}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg mt-4"
                >
                    {buttonText}
                </button>
            )}
            
          </form>
        </>
      );
    }
    
    return (
        <div className="text-center">
            <h3 className="text-xl font-bold text-center text-blue-700 mb-4">Loading Module</h3>
            <p>Preparing content or already starting quiz...</p>
        </div>
    );
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