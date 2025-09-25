// src/components/ui/SpeedTestScreen.jsx
import React, { useState, useEffect, useContext } from 'react';
import audioManager from '../../utils/audioUtils';
import { MathGameContext } from '../../App.jsx';

const SpeedTestScreen = () => {
    const {
        showSpeedTest,
        speedTestPopupVisible,
        speedTestPopupAnimation,
        speedTestNumbers,
        currentSpeedTestIndex,
        speedTestStartTime,
        speedTestComplete,
        speedTestStarted,
        speedTestCorrectCount,
        speedTestShowTick,
        studentReactionSpeed,
        setSpeedTestPopupVisible,
        setSpeedTestPopupAnimation,
        setShowSpeedTest,
        handleSpeedTestInput,
        startSpeedTest,
    } = useContext(MathGameContext);

    // Set up keyboard event listener
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!speedTestStarted || speedTestComplete) return;

            const key = parseInt(e.key);
            if (!isNaN(key) && key >= 1 && key <= 9) {
                handleSpeedTestInput(key);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        speedTestNumbers,
        currentSpeedTestIndex,
        speedTestStartTime,
        speedTestComplete,
        speedTestStarted,
        handleSpeedTestInput,
    ]);

    if (!speedTestPopupVisible) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
            <div
                className={`bg-white/90 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl max-w-md w-full flex flex-col items-center ${speedTestPopupAnimation} mx-2 sm:mx-4`}
            >
                <button
                    onClick={() => {
                        setSpeedTestPopupAnimation('animate-pop-out');
                        setTimeout(() => {
                            setShowSpeedTest(false);
                            setSpeedTestPopupVisible(false);
                        }, 500);
                        audioManager.playButtonClick();
                    }}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                    aria-label="Close"
                >
                    ×
                </button>

                <h1 className="text-2xl sm:text-3xl font-baloo text-blue-700 mb-3 sm:mb-4 drop-shadow-lg">
                    Speed Calibration
                </h1>

                {speedTestComplete ? (
                    <div className="text-center">
                        <div className="relative text-3xl sm:text-4xl md:text-5xl mb-4 sm:mb-6 font-bold">
                            <div className={`${speedTestShowTick ? 'animate-bounce' : ''}`}>
                                🎮
                            </div>
                            {speedTestShowTick && (
                                <div className="absolute top-0 right-0 text-2xl sm:text-3xl md:text-4xl text-green-500 animate-scale-in">
                                    ✓
                                </div>
                            )}
                        </div>
                        <p className="text-lg sm:text-xl text-blue-800 mb-3 sm:mb-4">
                            Great job!
                        </p>
                        <p className="text-base sm:text-lg text-blue-700 mb-4 sm:mb-6">
                            Your speed has been calibrated.
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-4 mb-6 overflow-hidden">
                            <div
                                className="bg-blue-600 h-4 rounded-full transition-all duration-1000"
                                style={{ width: '100%' }}
                            ></div>
                        </div>
                        <p className="text-blue-600 mb-2">
                            {studentReactionSpeed < 0.8
                                ? 'Super fast! 🚀'
                                : studentReactionSpeed < 1.0
                                    ? 'Quick! ⚡'
                                    : studentReactionSpeed < 1.2
                                        ? 'Good pace! 👍'
                                        : 'Steady! 🐢'}
                        </p>
                    </div>
                ) : !speedTestStarted ? (
                    <div className="text-center">
                        <div className="text-4xl sm:text-5xl md:text-6xl mb-4 sm:mb-6 font-bold">
                            🎯
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-blue-700 mb-3 sm:mb-4">
                            Let's Test Your Speed!
                        </h2>
                        <p className="text-base sm:text-lg text-blue-600 mb-6 sm:mb-8">
                            You'll see 5 numbers one by one.
                            <br />
                            Click or press the matching number as fast as you can!
                        </p>
                        <button
                            onClick={startSpeedTest}
                            className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-bold py-2 sm:py-3 px-6 sm:px-8 rounded-xl text-lg sm:text-xl shadow-lg transform transition-all hover:scale-105 hover:shadow-xl"
                        >
                            Start Test
                        </button>
                    </div>
                ) : (
                    <>
                        <p className="text-base sm:text-lg text-blue-700 mb-3 sm:mb-4">
                            Correct: {speedTestCorrectCount} of 5
                        </p>

                        <p className="text-base sm:text-lg text-blue-600 mb-4 sm:mb-6">
                            Click or press the number:
                        </p>

                        <div className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 sm:mb-8 animate-bounce">
                            {speedTestNumbers[currentSpeedTestIndex]}
                        </div>

                        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 w-full max-w-xs">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                <button
                                    key={num}
                                    className="bg-white hover:bg-blue-100 text-blue-700 font-bold text-lg sm:text-xl md:text-2xl rounded-lg p-2 sm:p-3 md:p-4 shadow-md transition-all border border-blue-200"
                                    onClick={() => handleSpeedTestInput(num)}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>

                        <div className="mt-6 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(speedTestCorrectCount / 5) * 100}%` }}
                            ></div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default SpeedTestScreen;