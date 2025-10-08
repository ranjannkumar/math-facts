// src/components/ResultsScreen.jsx
import React, { useEffect, useContext, useRef, useState } from 'react';
import Confetti from 'react-confetti';
import { showShootingStars, clearShootingStars } from '../utils/mathGameLogic';
import { MathGameContext } from '../App.jsx';
import { useNavigate } from 'react-router-dom';
import { quizComplete } from '../api/mathApi.js';

const ResultsScreen = () => {
    const navigate = useNavigate();
    const [leaving, setLeaving] = useState(false);

    const {
        selectedDifficulty,
        selectedTable,
        sessionCorrectCount,
        correctCount,
        grandTotalCorrect,
        setShowResult,
        quizRunId,
        childPin,
       setQuizRunId, 
    } = useContext(MathGameContext);

    // --- Quiz Info ---
    const isBlack = String(selectedDifficulty).startsWith('black');
    const degree = isBlack ? parseInt(String(selectedDifficulty).split('-')[1] || '1', 10) : null;
    const maxQuestions = isBlack ? (degree === 7 ? 30 : 20) : 10;
    const allCorrect = sessionCorrectCount === maxQuestions;  

    // 1. Redirect if not perfect score
    useEffect(() => {
        // Redundant safeguard: navigation in hook should prevent this.
        if (!allCorrect) {
            navigate('/way-to-go', { replace: true });
        }
    }, [allCorrect, navigate]);
    
    // 2. Mark complete on the backend (optional, but good for final record keeping)
    const completionSentRef = useRef(false);
    useEffect(() => {
        if (allCorrect && !completionSentRef.current && quizRunId) {
            completionSentRef.current = true;
            // Progression already handled by the final /quiz/answer call. This is non-critical.
            quizComplete(quizRunId, childPin).catch(console.error);
        }
    }, [allCorrect, quizRunId, childPin]);

    // 3. Shooting stars/Confetti (client-side visual effect)
    const starsShownRef = useRef(false);
    useEffect(() => {
        if (allCorrect && !starsShownRef.current) {
            starsShownRef.current = true;
            showShootingStars();
        }
        return () => clearShootingStars();
    }, [allCorrect]);


    // Only proceed with the rest of the logic if allCorrect is true
    if (!allCorrect) {
        return null;
    }

    const [timeSecs, setTimeSecs] = useState(() => {
        const ls = Number(localStorage.getItem('math-last-quiz-duration') || 0);
        return Number.isFinite(ls) ? ls : 0;
    });
    // FIX: Format total time today in minutes and seconds
    const sessionTimeSecs = Math.round(timeSecs);
    const mins = Math.floor(sessionTimeSecs / 60); //
    const secs = sessionTimeSecs % 60; //
    // Using seconds format as per previous context to fit tiles better on mobile
    const timeLabel = `${sessionTimeSecs}s`; 

    // --- Black Belt Degree 7 completion auto-nav ---
    useEffect(() => {
        if (isBlack && degree === 7 && allCorrect) {
            const t = setTimeout(() => navigate('/levels', { replace: true }), 3000);
            return () => clearTimeout(t);
        }
    }, [isBlack, degree, allCorrect, navigate]);


    // --- Display Logic ---
    const beltName = (() => {
        if (isBlack) return `Black (Degree ${degree})`;
        switch (selectedDifficulty) {
            case 'white': return 'White';
            case 'yellow': return 'Yellow';
            case 'green': return 'Green';
            case 'blue': return 'Blue';
            case 'red': return 'Red';
            case 'brown': return 'Brown';
            default: return 'Unknown';
        }
    })();
    // NOTE: pointsEarned calculation here is flawed as `correctCount` is the daily total, 
    // but preserving the logic as requested not to remove anything else.
    const handlePrimary = () => {
        setShowResult(false);
        clearShootingStars();
        setLeaving(true);
       setQuizRunId(null); 
        if (isBlack) navigate('/black', { replace: true });
        else if (selectedDifficulty === 'brown') navigate('/black', { replace: true });
        else navigate('/belts', { replace: true });
    };

    if (leaving) return null;
    const pointsEarned = maxQuestions;
    return (
        <div
            className={
                "min-h-screen full-height-safe w-full relative px-4 py-6 flex items-center justify-center overflow-auto" // Increased horizontal padding
            }
        >
            <Confetti
                width={window.innerWidth}
                height={window.innerHeight}
                numberOfPieces={allCorrect ? 280 : 160}
                gravity={0.5}
                recycle={false}
                style={{ position: 'fixed', inset: 0, zIndex: 40, pointerEvents: 'none' }}
            />
            {/* Adjusted star positions for safer display on smaller screens */}
            <div className="kid-bg-star star1 top-5 left-5 text-4xl sm:text-5xl">★</div>
            <div className="kid-bg-star star2 top-20 right-10 text-3xl sm:text-4xl">★</div>
            <div className="kid-bg-star star3 bottom-20 left-10 text-5xl sm:text-6xl">★</div>
            <div className="kid-bg-star star4 top-50 right-5 text-2xl sm:text-3xl">★</div>
            <div className="kid-bg-star star5 bottom-5 right-20 text-4xl sm:text-5xl">★</div>
            <div
                className={[
                    "relative z-10 w-full max-w-lg lg:max-w-xl text-center rounded-3xl shadow-2xl", // Constrained max width
                    "bg-white popup-zoom-in animate-pop-in",
                    "p-5 sm:p-8 md:p-10" // Responsive padding
                ].join(" ")}
            >
                <div
                    className="mx-auto mb-4 sm:mb-6 rounded-xl px-4 py-2 sm:px-6 sm:py-2 celebration-animation" // Responsive padding
                    style={{
                        maxWidth: 400,
                        background:
                            "linear-gradient(90deg, #8BEC98 0%, #FFB703 100%)",
                        boxShadow: "0 8px 24px rgba(0,0,0,.12)"
                    }}
                >
                    <h2
                        className="m-0 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-wide" // Responsive font size
                        style={{ letterSpacing: '0.06em', color: '#273444' }}
                    >
                        CONGRATULATIONS
                    </h2>
                </div>
                {/* 👇 NEW Wrapper DIV for the Popup Box Style */}
                  <div className="bg-green-100/70 border-2 border-green-300 rounded-2xl py-2 sm:py-6 px-2 mb-6 sm:mb-8 mx-auto max-w-md w-full shadow-lg">
                    <p className="text-green-700 font-extrabold text-2xl sm:text-3xl md:text-4xl">
                        You earned <span className="font-extrabold text-green-1000">{pointsEarned}</span> points!
                    </p>
                </div>
                 {/* Adjusted grid to ensure tiles fit well on mobile (text size clamp will handle width) */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 justify-center max-w-xl mx-auto mb-6 sm:mb-8">
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-3 sm:p-4 shadow">
                        <div className="text-gray-500 text-xs sm:text-sm">Session Score</div>
                        <div className="wordart-number text-2xl sm:text-4xl mt-1">{sessionCorrectCount}</div>
                    </div>
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-3 sm:p-4 shadow">
                        <div className="text-gray-500 text-xs sm:text-sm">Time Taken</div>
                        <div className="wordart-number text-2xl sm:text-4xl mt-1">{timeLabel}</div>
                    </div>
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-3 sm:p-4 shadow">
                        <div className="text-gray-500 text-xs sm:text-sm">Today's Score</div>
                        <div className="wordart-number text-2xl sm:text-4xl mt-1">{correctCount}</div>
                    </div>
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-3 sm:p-4 shadow">
                        <div className="text-gray-500 text-xs sm:text-sm">Total Score</div>
                        <div className="wordart-number text-2xl sm:text-4xl mt-1">{grandTotalCorrect}</div>
                    </div>
                </div>
                <div className=" mb-4 sm:mb-6">
                    <button
                        type="button"
                        className=" bg-green-100/70 kid-btn animate-fade-in-up text-base sm:text-lg md:text-xl px-4 sm:px-6 py-2 sm:py-3" // Responsive button size
                        aria-label="belt-earned"
                    >
                        🎉 You earned the {beltName} Belt!
                    </button>
                </div>
                <div className="flex justify-center">
                    <button
                        className="px-6 py-3 rounded-2xl bg-green-600 text-white font-semibold hover:opacity-90 transition text-base sm:text-lg"
                        onClick={handlePrimary}
                    >
                        {isBlack ? 'Go to Degrees' : 'Go to Belts'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResultsScreen;
