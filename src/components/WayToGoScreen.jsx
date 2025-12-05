import React, { useEffect, useContext, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';
import { MathGameContext } from '../App.jsx';

const WayToGoScreen = () => {
    const navigate = useNavigate();
    const {
        selectedDifficulty,
        selectedTable,
        sessionCorrectCount, 
        correctCount, 
        grandTotalCorrect, 
        startQuizWithDifficulty,
        setQuizRunId, 
        setSelectedDifficulty,
        setSelectedTable,
        isQuizStarting,
        showWayToGoAfterFailure,

    } = useContext(MathGameContext);

    const [displaySessionScore] = useState(sessionCorrectCount); 

    const [displayTimeSecs] = useState(() => { 
        const ls = Number(localStorage.getItem('math-last-quiz-duration') || 0); 
        return Number.isFinite(ls) ? ls : 0; 
    });

    const hasRestarted = useRef(false);


    const [countdown, setCountdown] = useState(5); 
        
    const sessionTimeSecs = Math.round(displayTimeSecs);
    // Using seconds format as per previous context to fit tiles better on mobile
    const sessionTimeLabel = `${sessionTimeSecs}s`; 

    useEffect(() => {
     if (hasRestarted.current || !selectedTable || !selectedDifficulty) return;
        let intervalId;
        if (countdown > 0) {
            // Start the decrementing interval
            intervalId = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        } else if (countdown === 0) {
            
             if (hasRestarted.current) return;
                hasRestarted.current = true;

                // If this was a failed quiz → go to GAME MODE intro
                if (showWayToGoAfterFailure) {
                    localStorage.setItem('game-mode-belt', selectedDifficulty);
                    localStorage.setItem('game-mode-table', String(selectedTable));
                     navigate('/game-mode-video', { replace: true }); 
                    return;
                }

                // Otherwise → normal belt retry flow
                localStorage.removeItem('math-last-quiz-duration');
                if (selectedTable && selectedDifficulty) {
                    startQuizWithDifficulty(selectedDifficulty, selectedTable);
                } else {
                    navigate('/belts');
                }
        }
        // Cleanup function
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    // Re-run the effect when countdown changes (to trigger the final action at 0)
    }, [countdown, navigate, selectedDifficulty, selectedTable, startQuizWithDifficulty]);
    
    const handleBackToBelts = () => {
        hasRestarted.current = true;
        setQuizRunId(null);
        setSelectedDifficulty(null);
        const isBlackBelt = String(selectedDifficulty).startsWith('black');
        if (isBlackBelt) {
            navigate('/black'); 
        } else {
            navigate('/belts'); 
        }
    }

    const beltName = String(selectedDifficulty).startsWith('black') 
        ? `Black (Degree ${selectedDifficulty.split('-')[1]})` 
        : selectedDifficulty?.charAt(0).toUpperCase() + selectedDifficulty?.slice(1);

    const isDisabled = isQuizStarting;

    return (
        <div 
            className="min-h-screen full-height-safe w-full relative px-4 py-6 flex items-center justify-center overflow-auto" // Increased horizontal padding
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
                    className="mx-auto mb-4 sm:mb-6 rounded-xl px-4 py-2 sm:px-6 sm:py-3 celebration-animation"
                    style={{
                        maxWidth: 520,
                        background:
                            "linear-gradient(90deg, #F87171 0%, #DC2626 100%)", // Red gradient
                        boxShadow: "0 8px 24px rgba(0,0,0,.12)"
                    }}
                >
                    <h2
                        className="m-0 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-wide text-white" // Responsive font size
                        style={{ letterSpacing: '0.06em' }}
                    >
                        WAY TO GO!
                    </h2>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 justify-center max-w-xl mx-auto mb-6 sm:mb-8">
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-3 sm:p-4 shadow">
                        <div className="text-gray-500 text-xs sm:text-sm">Session Score</div>
                        <div className="wordart-number text-3xl sm:text-4xl mt-1">{displaySessionScore}</div>
                    </div>
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-3 sm:p-4 shadow">
                        <div className="text-gray-500 text-xs sm:text-sm">Time Taken </div>
                        <div className="wordart-number text-3xl sm:text-4xl mt-1">{sessionTimeLabel}</div>
                    </div>
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-3 sm:p-4 shadow">
                        <div className="text-gray-500 text-xs sm:text-sm">Today's Score</div>
                        <div className="wordart-number text-3xl sm:text-4xl mt-1">{correctCount}</div>
                    </div>
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-3 sm:p-4 shadow">
                        <div className="text-gray-500 text-xs sm:text-sm">Total Score</div>
                        <div className="wordart-number text-3xl sm:text-4xl mt-1">{grandTotalCorrect}</div>
                    </div>
                </div>

                <div className="mb-4 sm:mb-6">
                    <button
                        type="button"
                        className="kid-btn animate-fade-in-up text-base sm:text-lg md:text-xl px-4 sm:px-6 py-2 sm:py-3" // Responsive button size
                        aria-label="belt-earned"
                    >
                        Keep going on the {beltName} Belt!
                    </button>
                </div>
                
                 <p className="text-gray-600 mb-4 sm:mb-6 text-xl sm:text-2xl font-bold">
                    Game Mode In <span className="font-extrabold text-red-600">{countdown}</span> seconds...
                </p>

                <div className="flex justify-center">
                    <button
                        className="px-6 py-3 rounded-2xl bg-green-600 text-white font-semibold hover:opacity-90 transition text-base sm:text-lg"
                        onClick={handleBackToBelts}
                        disabled={isDisabled}
                    >
                        Back to Belts
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WayToGoScreen;