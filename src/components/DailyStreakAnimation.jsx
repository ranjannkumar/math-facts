// src/components/DailyStreakAnimation.jsx
import React, { useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MathGameContext } from '../App.jsx';

const TOTAL_DURATION_VISIBLE_MS = 2000; 
const ANIMATION_TIMINGS = {
    fadeIn: 200,
    fadeOut: 200,
};

export default function DailyStreakAnimation({ streakCount }) {
    if (streakCount <= 0) return null;

    const { handleDailyStreakNext } = useContext(MathGameContext);
    const [isExiting, setIsExiting] = useState(false);

    const handleNextClick = () => { 
      setIsExiting(true); 
      setTimeout(handleDailyStreakNext, ANIMATION_TIMINGS.fadeOut); 
    }; 

    return (
        <AnimatePresence>
            <motion.div
                key={`daily-streak-overlay-${streakCount}`}
                className="fixed inset-0 z-[1000] flex items-center justify-center select-none pointer-events-none bg-black/70"
                // Fade in and out the backdrop
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: ANIMATION_TIMINGS.fadeIn / 1000 } }}
                exit={{ opacity: 0, transition: { duration: ANIMATION_TIMINGS.fadeOut / 1000 } }}
            >
                <motion.div
                    className="flex flex-col items-center justify-center p-6 rounded-3xl shadow-2xl border-4 border-yellow-400"
                    style={{ 
                        width: '380px', 
                        height: '320px',
                        background: 'linear-gradient(145deg, #FFD700 0%, #FF9800 100%)', // Gold/Orange for visual appeal
                    }}
                    // Card pop-in/pop-out animation
                    initial={{ scale: 0.5, rotate: -10, opacity: 0 }}
                    animate={{ 
                        scale: 1, 
                        rotate: 0, 
                        opacity: 1,
                        transition: { 
                            type: 'spring', 
                            stiffness: 200, 
                            damping: 15,
                            duration: ANIMATION_TIMINGS.fadeIn / 1000
                        }
                    }}
                    exit={{ 
                        scale: 0.5, 
                        rotate: 10, 
                        opacity: 0,
                        transition: { 
                            duration: ANIMATION_TIMINGS.fadeOut / 1000, 
                            ease: 'easeIn'
                        }
                    }}
                >
                    {/* Fire Emoji with "live waving" pulse effect */}
                    <motion.span
                        className="text-6xl drop-shadow-lg"
                        animate={{ scale: [1, 1.15, 1] }} // Subtle pulse/wave effect
                        transition={{
                            duration: 0.4,
                            repeat: Infinity,
                            ease: "easeInOut",
                            repeatType: "reverse",
                        }}
                    >
                        🔥
                    </motion.span>
                    
                    <span className="text-7xl font-black tracking-tight text-white drop-shadow-md mt-2">
                        {streakCount}
                    </span>

                    <span className="text-lg font-bold tracking-wider text-black drop-shadow-sm mt-1 uppercase">
                        DAYS STREAK
                    </span>

                    <button
                        onClick={handleNextClick}
                        disabled={isExiting}
                       className=" bg-green-600 hover:bg-green-500 text-white font-bold text-lg px-6 py-2 rounded-full mt-4 shadow-md transition-all duration-300" 
                        style={{ pointerEvents: 'auto' }}
                    >
                        NEXT
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}