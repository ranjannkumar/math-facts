// src/components/PreTestScreen.jsx
import React, { useState, useEffect, useContext } from 'react';
import audioManager from '../utils/audioUtils.js';
import { MathGameContext } from '../App.jsx';
import { generatePreTestQuestions } from '../utils/pretestUtils.js';

async function sendPreTestResults(payload) {
  try {
    // Stub for backend; safe no-op
    return true;
  } catch {
    return false;
  }
}

const SECTION_LABELS = {
  addition: 'Addition',
  subtraction: 'Subtraction',
  multiplication: 'Multiplication',
  division: 'Division',
};

const PreTestScreen = () => {
  const {
    preTestSection,
    preTestQuestions,
    preTestCurrentQuestion,
    preTestScore,
    setPreTestScore,
    setPreTestCurrentQuestion,
    setPreTestTimerActive,
    preTestTimerActive,
    preTestTimer,
    setPreTestTimer,
    setPreTestResults,
    setPreTestQuestions,       // <-- we’ll use this to backfill if empty
    childName,
    navigate,
  } = useContext(MathGameContext);

  // === INIT: if user landed here without going through popup, ensure we have questions ===
  useEffect(() => {
    if ((!preTestQuestions || preTestQuestions.length === 0) && preTestSection) {
      const qs = generatePreTestQuestions(preTestSection);
      if (qs.length) {
        setPreTestQuestions(qs);
        setPreTestCurrentQuestion(0);
        setPreTestScore(0);
        setPreTestTimerActive(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preTestSection, preTestQuestions?.length]);

  const question = preTestQuestions[preTestCurrentQuestion];
  const [inputValue, setInputValue] = useState('');
  const [message, setMessage] = useState('');
  const [wasCorrect, setWasCorrect] = useState(null);

  useEffect(() => {
    if (preTestTimerActive) {
      const interval = setInterval(() => setPreTestTimer((prev) => prev + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [preTestTimerActive, setPreTestTimer]);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (inputValue === '' || !question) return;

    const answer = Number(inputValue);
    const correct = answer === question.correctAnswer;

    if (correct) {
      audioManager.playCorrectSound();
      setPreTestScore(preTestScore + 1);
      setWasCorrect(true);
      setMessage('Correct!');
    } else {
      audioManager.playWrongSound();
      setWasCorrect(false);
      setMessage(`Wrong! Correct answer is ${question.correctAnswer}.`);
    }

    setTimeout(async () => {
      if (preTestCurrentQuestion < preTestQuestions.length - 1) {
        setPreTestCurrentQuestion(preTestCurrentQuestion + 1);
        setInputValue('');
        setMessage('');
        setWasCorrect(null);
      } else {
        setPreTestTimerActive(false);
        const finalScore = preTestScore + (wasCorrect ? 1 : 0);
        const results = {
          childName,
          section: preTestSection,
          score: finalScore,
          totalQuestions: preTestQuestions.length,
          timeTaken: preTestTimer,
          accuracy: Math.round((finalScore / preTestQuestions.length) * 100),
        };
        setPreTestResults(results);
        await sendPreTestResults(results);
        navigate('/theme');
      }
    }, 800);
  };

  const title = SECTION_LABELS[preTestSection] || 'Pre-Test';
  const KEYS = [0, 1, 2, 3, 4, 5];

  const pickValue = (v) => setInputValue(String(v));
  const clearValue = () => {
    setInputValue('');
    setMessage('');
    setWasCorrect(null);
  };

  // If still no questions, keep the UI but show safe counts
  const totalQ = preTestQuestions?.length ?? 0;

  return (
    <div
      className="min-h-screen w-full fixed inset-0 flex items-center justify-center p-4"
      style={{
        backgroundImage: "url('/night_sky_landscape.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Card styled like 3000 */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.25)] max-w-md w-full">
        {/* Small green subtitle */}
        <h3 className="text-center text-green-700 font-extrabold mb-2">
          {preTestSection === 'addition' ? 'Sums up to 5' : `${title} Pre-Test`}
        </h3>

        {/* Big equation */}
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600 font-semibold">
            Question {Math.min(preTestCurrentQuestion + 1, Math.max(totalQ, 1))} of {Math.max(totalQ, 1)}
          </p>
          <p className="text-5xl font-extrabold my-4 text-indigo-700 leading-none select-none">
            {question?.question ?? '—'}
          </p>
        </div>

        {/* Answer display box (green border) */}
        <div className="w-full flex justify-center mb-6">
          <div
            className={`w-32 h-24 rounded-xl border-4 ${
              inputValue !== '' ? 'border-green-500' : 'border-green-300'
            } bg-white flex items-center justify-center text-4xl font-extrabold text-gray-800 shadow-md`}
          >
            {inputValue === '' ? <span className="text-gray-400"></span> : inputValue}
          </div>
        </div>

        {/* 0–5 keypad (rounded green buttons with soft shadow) */}
        <div className="grid grid-cols-3 gap-6 place-items-center mb-8">
          {KEYS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => pickValue(k)}
              className={`w-16 h-16 rounded-full font-extrabold text-xl text-white shadow-[0_10px_20px_rgba(16,185,129,0.35)] transition-all duration-200
                ${String(k) === inputValue ? 'bg-green-600 scale-105' : 'bg-green-500 hover:bg-green-600 hover:scale-105 active:scale-95'}`}
              aria-label={`choose ${k}`}
            >
              {k}
            </button>
          ))}
        </div>

        {/* Submit / Clear (dark + gray pills like 3000) */}
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={inputValue === '' || !question}
            className={`px-6 py-3 rounded-xl text-white font-semibold shadow-md transition-all duration-200
              ${inputValue !== '' && question
                ? 'bg-gray-800 hover:bg-gray-900 hover:scale-105 active:scale-95'
                : 'bg-gray-400 cursor-not-allowed'}`}
          >
            Submit
          </button>
          <button
            type="button"
            onClick={clearValue}
            className="px-6 py-3 rounded-xl bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
          >
            Clear
          </button>
        </div>

        {/* Feedback */}
        {message && (
          <p
            className={`text-center mt-4 font-semibold ${
              wasCorrect ? 'text-green-700' : 'text-red-700'
            }`}
          >
            {message}
          </p>
        )}

        {/* Hidden input to keep structure if needed */}
        <input type="hidden" value={inputValue} readOnly />
      </div>
    </div>
  );
};

export default PreTestScreen;
