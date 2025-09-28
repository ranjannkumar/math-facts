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
        sessionCorrectCount, // FIX: Import session correct count
        //elapsedTime, // FIX: Import session elapsed time
        correctCount,
        setShowResult,
        quizRunId,
        childPin,
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
    const timeLabel = `${mins}m ${secs}s`; // 
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
         if (isBlack) navigate('/black', { replace: true });
        else if (selectedDifficulty === 'brown') navigate('/black', { replace: true });
        else navigate('/belts', { replace: true });
    };

    if (leaving) return null;
    const pointsEarned = 10;    
    return (
        <div
            className={
                "min-h-screen full-height-safe w-full relative px-3 py-6 flex items-center justify-center"
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
                            "linear-gradient(90deg, #8BEC98 0%, #FFB703 100%)",
                        boxShadow: "0 8px 24px rgba(0,0,0,.12)"
                    }}
                >
                    <h2
                        className="m-0 text-3xl md:text-4xl font-extrabold tracking-wide"
                        style={{ letterSpacing: '0.06em', color: '#273444' }}
                    >
                        CONGRATULATIONS
                    </h2>
                </div>
                <p className="text-green-600 font-semibold mb-6">
                    You earned <span className="font-bold">+{pointsEarned}</span> points
                </p>
                <div className="grid grid-cols-2 gap-4 md:gap-6 justify-center max-w-xl mx-auto mb-8">
                    <div className="bg-white rounded-2xl border-2 border-gray-200 p-4 md:p-5 shadow">
                        <div className="text-gray-500 text-sm">Session Score</div>
                        <div className="wordart-number mt-1">{sessionCorrectCount}</div> {/* FIX: Display session score */}
                    </div>
                    <div className="bg-white rounded-2xl border-2 border-gray-200 p-4 md:p-5 shadow">
                        <div className="text-gray-500 text-sm">Time Taken (Session)</div>
                        <div className="wordart-number mt-1">{timeLabel}</div> {/* FIX: Display session time */}
                    </div>
                </div>
                <div className="mb-6">
                    <button
                        type="button"
                        className="kid-btn animate-fade-in-up"
                        aria-label="belt-earned"
                    >
                        🎉 Amazing! You got the {beltName} Belt!
                    </button>
                </div>
                <div className="flex justify-center">
                    <button
                        className="px-6 py-3 rounded-2xl bg-gray-900 text-white font-semibold hover:opacity-90 transition"
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