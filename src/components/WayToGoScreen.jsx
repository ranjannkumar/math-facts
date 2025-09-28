// src/components/WayToGoScreen.jsx
import React, { useEffect, useContext, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';
import { MathGameContext } from '../App.jsx';
import audioManager from '../utils/audioUtils.js';

const WayToGoScreen = () => {
    const navigate = useNavigate();
    const {
        selectedDifficulty,
        selectedTable,
        sessionCorrectCount, 
        correctCount,
        startQuizWithDifficulty, // Use the new API-backed start flow
    } = useContext(MathGameContext);

    // This ensures the quiz restarts only once.
    const hasRestarted = useRef(false);
    const [timeSecs, setTimeSecs] = useState(() => {
            const ls = Number(localStorage.getItem('math-last-quiz-duration') || 0);
            return Number.isFinite(ls) ? ls : 0;
        });
        // FIX: Format total time today in minutes and seconds
    const sessionTimeSecs = Math.round(timeSecs);
    const sessionTimeLabel = `${Math.floor(sessionTimeSecs / 60)}m ${Math.floor(sessionTimeSecs % 60)}s`; 
    useEffect(() => {
        audioManager.playWrongSound?.(); 
        if (hasRestarted.current) return;
        
        const timer = setTimeout(() => {
            if (selectedTable && selectedDifficulty) {
                // Call the API-backed quiz start flow. 
                startQuizWithDifficulty(selectedDifficulty, selectedTable); 
            } else {
                navigate('/belts');
            }
            hasRestarted.current = true;
        }, 5000); 
        
        return () => clearTimeout(timer);
    }, [navigate, selectedDifficulty, selectedTable, startQuizWithDifficulty]);
    
    const handleBackToBelts = () => {
        navigate('/belts');
    };

    const beltName = String(selectedDifficulty).startsWith('black') 
        ? `Black (Degree ${selectedDifficulty.split('-')[1]})` 
        : selectedDifficulty?.charAt(0).toUpperCase() + selectedDifficulty?.slice(1);

    const maxQuestions = String(selectedDifficulty).startsWith('black') 
        ? (selectedDifficulty.endsWith('7') ? 30 : 20) 
        : 10;

    return (
        <div 
            className="min-h-screen full-height-safe w-full relative px-3 py-6 flex items-center justify-center"
        >
            <Confetti
                width={window.innerWidth}
                height={window.innerHeight}
                numberOfPieces={160} 
                gravity={0.5}
                run
                recycle={false}
                style={{ position: 'fixed', inset: 0, zIndex: 40, pointerEvents: 'none' }}
            />

            <div className="kid-bg-star star1">★</div>
            <div className="kid-bg-star star2">★</div>
            <div className="kid-bg-star star3">★</div>
            <div className="kid-bg-star star4">★</div>
            <div className="kid-bg-star star5">★</div>

            <div
                className={[
                    "relative z-10 w-full max-w-3xl text-center rounded-3xl shadow-2xl",
                    "bg-white popup-zoom-in animate-pop-in",
                    "p-8 md:p-10"
                ].join(" ")}
            >
                <div
                    className="mx-auto mb-6 rounded-xl px-6 py-3 celebration-animation"
                    style={{
                        maxWidth: 520,
                        background:
                            "linear-gradient(90deg, #F87171 0%, #DC2626 100%)", // Red gradient
                        boxShadow: "0 8px 24px rgba(0,0,0,.12)"
                    }}
                >
                    <h2
                        className="m-0 text-3xl md:text-4xl font-extrabold tracking-wide text-white"
                        style={{ letterSpacing: '0.06em' }}
                    >
                        WAY TO GO!
                    </h2>
                </div>

                <p className="text-red-600 font-semibold mb-6">
                    Keep practicing, you'll get it next time!
                </p>

                <div className="grid grid-cols-2 gap-4 md:gap-6 justify-center max-w-xl mx-auto mb-8">
                    <div className="bg-white rounded-2xl border-2 border-gray-200 p-4 md:p-5 shadow">
                        <div className="text-gray-500 text-sm">Session Score</div>
                        <div className="wordart-number mt-1">{sessionCorrectCount}</div>
                    </div>
                    <div className="bg-white rounded-2xl border-2 border-gray-200 p-4 md:p-5 shadow">
                        <div className="text-gray-500 text-sm">Time Taken (Session)</div>
                        <div className="wordart-number mt-1">{sessionTimeLabel}</div>
                    </div>
                </div>

                <div className="mb-6">
                    <button
                        type="button"
                        className="kid-btn animate-fade-in-up"
                        aria-label="belt-earned"
                    >
                        Keep going on the {beltName} Belt!
                    </button>
                </div>
                
                <p className="text-gray-600 mb-6 text-sm">Restarting in 5 seconds...</p>

                <div className="flex justify-center">
                    <button
                        className="px-6 py-3 rounded-2xl bg-gray-900 text-white font-semibold hover:opacity-90 transition"
                        onClick={handleBackToBelts}
                    >
                        Back to Belts
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WayToGoScreen;