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
        correctCount, // <-- Daily total correct score
        grandTotalCorrect, // <-- Grand total correct score
        startQuizWithDifficulty,
    } = useContext(MathGameContext);

    // This ensures the quiz restarts only once.
    const hasRestarted = useRef(false);
    const [timeSecs, setTimeSecs] = useState(() => {
            const ls = Number(localStorage.getItem('math-last-quiz-duration') || 0);
            return Number.isFinite(ls) ? ls : 0;
        });
        
    const sessionTimeSecs = Math.round(timeSecs);
    // Using seconds format as per previous context to fit tiles better on mobile
    const sessionTimeLabel = `${sessionTimeSecs}s`; 

    useEffect(() => {
        // audioManager.playWrongSound?.(); // Assuming audio manager is available and handles sound logic
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
                        <div className="wordart-number text-3xl sm:text-4xl mt-1">{sessionCorrectCount}</div>
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
                        <div className="text-gray-500 text-xs sm:text-sm">Grand Total</div>
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
                
                <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">Restarting in 5 seconds...</p>

                <div className="flex justify-center">
                    <button
                        className="px-6 py-3 rounded-2xl bg-gray-900 text-white font-semibold hover:opacity-90 transition text-base sm:text-lg"
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