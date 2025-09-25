import React, { useState, useContext } from 'react';
import { MathGameContext } from '../App.jsx';

const SettingsModal = () => {
    const { handleQuit, handleResetProgress, setShowSettings } = useContext(MathGameContext);
    const [isClosingSettings, setIsClosingSettings] = useState(false);

    const handleCloseSettings = () => {
        setIsClosingSettings(true);
        setTimeout(() => {
            setShowSettings(false);
            setIsClosingSettings(false);
        }, 400);
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in">
            <div 
                className={`rounded-2xl p-8 shadow-xl max-w-xs w-full flex flex-col items-center ${isClosingSettings ? 'animate-pop-out' : 'animate-pop-in'}`}
                style={{
                    background: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
                    border: '4px solid white',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25), 0 0 0 2px rgba(255, 255, 255, 0.2) inset'
                }}
            >
                <h2 className="text-2xl font-bold mb-6 text-center font-baloo text-white drop-shadow-md">
                    Settings
                </h2>
                <button
                    className="kid-btn bg-red-400 hover:bg-red-500 text-white mb-4 w-full transform transition-transform hover:scale-105"
                    onClick={handleResetProgress}
                    style={{
                        boxShadow: '0 4px 10px rgba(0,0,0,0.15), 0 -2px 0 rgba(255,255,255,0.3) inset'
                    }}
                >
                    Reset Progress
                </button>
                <button
                    className="kid-btn bg-yellow-500 hover:bg-yellow-600 text-white mb-4 w-full transform transition-transform hover:scale-105"
                    onClick={handleQuit}
                    style={{
                        boxShadow: '0 4px 10px rgba(0,0,0,0.15), 0 -2px 0 rgba(255,255,255,0.3) inset'
                    }}
                >
                    Quit
                </button>
                <button
                    className="kid-btn bg-blue-400 hover:bg-blue-500 text-white w-full transform transition-transform hover:scale-105"
                    onClick={handleCloseSettings}
                    style={{
                        boxShadow: '0 4px 10px rgba(0,0,0,0.15), 0 -2px 0 rgba(255,255,255,0.3) inset'
                    }}
                >
                    Back to Game
                </button>
            </div>
        </div>
    );
};

export default SettingsModal;