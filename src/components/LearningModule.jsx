// src/components/LearningModule.jsx
import React, { useEffect, useMemo, useState, useContext } from 'react';
import { MathGameContext } from '../App.jsx';
import {
  getTwoFactsForBelt,
  getLearningModuleContent,
  normalizeDifficulty,
} from '../utils/mathGameLogic.js';
import audioManager from '../utils/audioUtils.js';

/**
 * Learning flow:
 * Fact#1 -> Practice#1 -> Fact#2 -> Practice#2 -> Start Quiz
 * Also used as a single-practice “intervention” for inactivity/wrong answers.
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
  } = useContext(MathGameContext);

  const diff = useMemo(() => normalizeDifficulty(pendingDifficulty), [pendingDifficulty]);

  const [step, setStep] = useState(0);
  const [practiceQ, setPracticeQ] = useState(null);
  const [practiceInput, setPracticeInput] = useState('');
  const [practiceMsg, setPracticeMsg] = useState('');

  const isIntervention = !!interventionQuestion;

  // Build a safe facts array:
  // - If intervention: no intro facts (we only practice the exact question)
  // - If diff/level not ready: return a small default so UI never crashes
  const facts = useMemo(() => {
    if (isIntervention) return [];
    if (!diff || !selectedTable) return [[0, 1], [1, 0]]; // safe default
    const pairs = getTwoFactsForBelt(selectedTable, diff);
    return Array.isArray(pairs) && pairs.length >= 2 ? pairs : [[0, 1], [1, 0]];
  }, [diff, selectedTable, isIntervention]);

  // Reset state when inputs change
  useEffect(() => {
    if (isIntervention) {
      const q = {
        question: interventionQuestion.question,
        correctAnswer: interventionQuestion.correctAnswer,
      };
      setPracticeQ(q);
      setPracticeInput('');
      setPracticeMsg('');
      setStep(1); // intervention is a practice step
      return;
    }

    if (diff && selectedTable) {
      setStep(0);
      setPracticeQ(null);
      setPracticeInput('');
      setPracticeMsg('');
    } else {
      // if we were navigated here too early, close cleanly
      setShowLearningModule(false);
    }
  }, [isIntervention, interventionQuestion, diff, selectedTable, setShowLearningModule]);

  const headline = useMemo(() => {
    if (isIntervention && practiceQ) {
      const [a, , b] = String(practiceQ.question).split(' ');
      const aa = Number(a);
      const bb = Number(b);
      if (Number.isFinite(aa) && Number.isFinite(bb)) {
        return `${aa} + ${bb} = ${aa + bb}`;
      }
      return practiceQ.question;
    }
    if (diff && selectedTable) {
      return getLearningModuleContent(diff, selectedTable);
    }
    return '';
  }, [diff, selectedTable, isIntervention, practiceQ]);

  const makePracticeFromFact = (pair) => {
    if (!pair || pair.length < 2) return null;
    const [a, b] = pair;
    return { question: `${a} + ${b}`, correctAnswer: a + b };
  };

  const handleNext = () => {
    audioManager.playButtonClick?.();
    if (isIntervention) return; // intervention is already in a practice step

    if (step === 0) {
      const q = makePracticeFromFact(facts[0]);
      if (!q) return; // defensive: avoid crashes
      setPracticeQ(q);
      setStep(1);
      return;
    }

    if (step === 2) {
      const q = makePracticeFromFact(facts[1]);
      if (!q) return;
      setPracticeQ(q);
      setStep(3);
      return;
    }
  };

  const handlePracticeSubmit = (e) => {
    e.preventDefault();
    const val = Number(practiceInput);
    if (!practiceQ) return;

    if (val === practiceQ.correctAnswer) {
      audioManager.playCorrectSound?.();
      setPracticeMsg('Correct!');
      setTimeout(() => {
        if (isIntervention) {
          setShowLearningModule(false);
          setInterventionQuestion(null);
          return;
        }
        if (step === 1) {
          // move to Fact #2
          setPracticeQ(null);
          setPracticeInput('');
          setPracticeMsg('');
          setStep(2);
        } else if (step === 3) {
          // start the actual quiz now
          setShowLearningModule(false);
          startActualQuiz(diff, selectedTable);
          navigate('/quiz');
        }
      }, 300);
    } else {
      audioManager.playWrongSound?.();
      setPracticeMsg('Try again.');
    }
  };

  const renderBody = () => {
    // Intervention path: headline + practice only
    if (isIntervention && practiceQ) {
      return (
        <>
          <h3 className="text-xl font-bold text-center text-blue-700 mb-4">Quick Tip</h3>
          <div className="text-4xl font-extrabold text-green-600 text-center mb-4 whitespace-pre-line">
            {headline}
          </div>
          <form onSubmit={handlePracticeSubmit} className="flex flex-col items-center gap-3">
            <div className="text-lg font-semibold text-gray-700">{practiceQ.question}</div>
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

    // Fact screens (0 and 2)
    if (step === 0 || step === 2) {
      const idx = step === 0 ? 0 : 1;
      const [a, b] = facts[idx] || [0, 1];
      return (
        <>
          <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-green-600 mb-4 whitespace-pre-line text-center">
            {`${a} + ${b} = ${a + b}`}
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
    }

    // Practice screens (1 and 3)
    if (step === 1 || step === 3) {
      return (
        <>
          <h3 className="text-xl font-bold text-center text-blue-700 mb-2">Practice</h3>
          <div className="text-4xl font-extrabold text-green-600 text-center mb-4 whitespace-pre-line">
            {practiceQ ? `${practiceQ.question}` : ''}
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
            >
              Check
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
