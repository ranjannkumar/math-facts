// src/components/PreTestPopup.jsx
import React, { useContext } from 'react';
import { MathGameContext } from '../App.jsx';
import { generatePreTestQuestions } from '../utils/pretestUtils.js';

const PreTestPopup = () => {
  const {
    setPreTestQuestions,
    setPreTestCurrentQuestion,
    setPreTestScore,
    setPreTestTimerActive,
    setPreTestSection,
    setPreTestTimer,  
    navigate,
  } = useContext(MathGameContext);

  const startSection = (sectionKey) => {
    const qs = generatePreTestQuestions(sectionKey);
    if (!qs.length) return;
    setPreTestSection(sectionKey);
    setPreTestQuestions(qs);
    setPreTestCurrentQuestion(0);
    setPreTestScore(0);
    setPreTestTimerActive(true);
    navigate('/pre-test');
  };

  const handleSkip = () => {
    setPreTestTimerActive(false);
    setPreTestQuestions([]);
    navigate('/theme');
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-4"
      style={{
        backgroundImage: "url('/night_sky_landscape.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Card */}
      <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 sm:p-8 shadow-2xl max-w-md w-full mx-2 popup-zoom-in">
        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-baloo text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 drop-shadow">
          Pre-Test
        </h2>

        {/* Subtext */}
        <p className="text-center text-gray-700 mb-6">
          Choose a section for your quick pre-test.
        </p>

        {/* 2×2 grid tiles (match style of 3000 page) */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => startSection('addition')}
            className="flex flex-col items-center justify-center rounded-2xl bg-blue-200/80 hover:bg-blue-300 text-blue-800 font-semibold py-6 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
          >
            <span className="text-3xl mb-2">＋</span>
            <span>Addition</span>
          </button>

          <button
            onClick={() => startSection('subtraction')}
            className="flex flex-col items-center justify-center rounded-2xl bg-indigo-200/80 hover:bg-indigo-300 text-indigo-800 font-semibold py-6 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
          >
            <span className="text-3xl mb-2">－</span>
            <span>Subtraction</span>
          </button>

          <button
            onClick={() => startSection('multiplication')}
            className="flex flex-col items-center justify-center rounded-2xl bg-cyan-200/80 hover:bg-cyan-300 text-cyan-900 font-semibold py-6 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
          >
            <span className="text-3xl mb-2">✖</span>
            <span>Multiplication</span>
          </button>

          <button
            onClick={() => startSection('division')}
            className="flex flex-col items-center justify-center rounded-2xl bg-sky-200/80 hover:bg-sky-300 text-sky-900 font-semibold py-6 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
          >
            <span className="text-3xl mb-2">÷</span>
            <span>Division</span>
          </button>
        </div>

        {/* Footer actions like the 3000 page */}
        <div className="flex items-center justify-center gap-3">
          {/* Keep logic the same: continue also skips the pre-test */}
          <button
            onClick={handleSkip}
            className="px-5 py-2.5 rounded-lg bg-green-700 hover:bg-green-800 text-white font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
          >
            Continue to Game <span className="ml-1">🎮</span>
          </button>

          <button
            onClick={handleSkip}
            className="px-5 py-2.5 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
          >
            Skip Test
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreTestPopup;
