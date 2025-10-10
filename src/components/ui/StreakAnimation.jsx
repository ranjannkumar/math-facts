import React, { useContext } from 'react';
import { MathGameContext } from '../../App.jsx';
import { FaBolt, FaCheckCircle } from 'react-icons/fa';

const StreakAnimation = () => {
    const { showStreakAnimation, streakType, streakPoints } = useContext(MathGameContext);

    if (!showStreakAnimation) return null;

    const isHighSpeed = streakType === 'high-speed';
    const pointsText = `+${streakPoints}`;
    const streakText = `${streakPoints} IN A ROW`;

    // High-Speed (⚡) style: Yellow/Orange, Bolt icon
    const highSpeedStyle = {
        // Base color for the animated bubble
        background: 'linear-gradient(135deg, #FFC107 0%, #FF9800 100%)', 
        icon: <FaBolt className="text-3xl sm:text-4xl text-white" />,
    };

    // Standard (✓) style: Green, Check icon
    const standardStyle = {
        // Base color for the animated bubble
        background: 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)', 
        icon: <FaCheckCircle className="text-3xl sm:text-4xl text-white" />,
    };

    const style = isHighSpeed ? highSpeedStyle : standardStyle;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-fade-in">
            <div 
                className="flex flex-col items-center justify-center animate-pop-in" 
                style={{ animationDuration: '0.5s' }}
            >
                {/* Streak Text Banner (e.g., 10 IN A ROW) */}
                <div 
                    className={`text-2xl sm:text-3xl font-extrabold px-6 py-2 mb-4 rounded-full shadow-lg text-white animate-stamp`}
                    style={{ 
                        // Use distinct banner colors
                        background: isHighSpeed ? 'linear-gradient(90deg, #FF5722 0%, #FF9800 100%)' : 'linear-gradient(90deg, #3F51B5 0%, #03A9F4 100%)', 
                        border: '2px solid white',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
                        animationDelay: '0.1s'
                    }}
                >
                    {streakText}
                </div>
                
                {/* Animated Score Bubble (Duo Lingo Style: +3, +5, +10) */}
                <div 
                    // Leveraging existing CSS classes: `float-animation` and `animate-pop-in` for the effect
                    className={`flex items-center justify-center p-4 rounded-full shadow-2xl font-baloo float-animation`}
                    style={{
                        ...style,
                        fontSize: 'clamp(2rem, 8vw, 4rem)',
                        minWidth: 'clamp(150px, 40vw, 250px)',
                        minHeight: 'clamp(100px, 25vw, 150px)',
                        // Add a subtle glow for visual pop
                        boxShadow: `0 0 30px ${isHighSpeed ? 'rgba(255, 165, 0, 0.7)' : 'rgba(76, 175, 80, 0.7)'}`,
                        background: style.background,
                    }}
                >
                    {style.icon}
                    <span className="ml-3 text-white drop-shadow-md">{pointsText}</span>
                </div>
            </div>
        </div>
    );
};

export default StreakAnimation;