// src/components/SettingsModal.jsx
import React, { useState, useContext } from 'react';
import { MathGameContext } from '../App.jsx';

const SettingsModal = () => {
    const { handleQuit, setShowSettings } = useContext(MathGameContext);
    const [isClosingSettings, setIsClosingSettings] = useState(false);

    const handleCloseSettings = () => {
        setIsClosingSettings(true);
        setTimeout(() => {
            setShowSettings(false);
            setIsClosingSettings(false);
        }, 400);
    };

    return (
        <div className="fixed inset-0 z-50 p-4 animate-fade-in">
            <div
                className="absolute inset-0 bg-black"
                style={{
                    backgroundImage: "url('/night_sky_landscape.jpg')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                }}
            />
            <div className="absolute inset-0 bg-black/30" />
            <div className="relative flex h-full items-center justify-center">
            <div className={`relative w-full max-w-[420px] ${isClosingSettings ? 'animate-pop-out' : 'animate-pop-in'}`}>
                <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-cyan-300/30 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-sky-300/20 blur-2xl" />

                <div className="rounded-[28px] bg-gradient-to-br from-cyan-300/70 via-teal-300/56 to-sky-300/62 p-[1.5px] shadow-[0_18px_48px_rgba(4,12,20,0.6)]">
                    <div className="relative overflow-hidden rounded-[26px] border border-white/15 bg-slate-900/62 backdrop-blur-md">
                        <div className="pointer-events-none absolute -top-14 -right-12 h-28 w-28 rounded-full bg-cyan-300/18 blur-2xl" />
                        <div className="pointer-events-none absolute -bottom-16 -left-12 h-32 w-32 rounded-full bg-sky-300/12 blur-2xl" />

                        <div className="relative p-5 sm:p-6">
                            <div className="mx-auto mb-5 w-full rounded-2xl border border-cyan-100/15 bg-slate-950/48 px-4 py-4 text-center shadow-[inset_0_0_24px_rgba(34,211,238,0.12)]">
                                <h2 className="text-2xl sm:text-3xl font-extrabold text-white" style={{ fontFamily: 'Baloo 2, Comic Neue, cursive' }}>
                                    Settings
                                </h2>
                            </div>

                            <div className="flex flex-col items-center gap-3 sm:gap-4">
                                <button
                                    className="h-12  w-[78%] rounded-xl border border-emerald-100/35 bg-gradient-to-r from-emerald-500 to-teal-500 text-sm sm:h-13 sm:text-base font-black tracking-wide text-white shadow-lg shadow-emerald-900/30 transition-all duration-200 hover:-translate-y-0.5 hover:from-emerald-400 hover:to-teal-400 active:translate-y-0"
                                    onClick={() => {
                                        handleQuit();
                                        handleCloseSettings();
                                    }}
                                >
                                    Quit
                                </button>

                                <button
                                    className="h-12  w-[78%] rounded-xl border border-emerald-100/35 bg-gradient-to-r from-emerald-500 to-teal-500 text-sm sm:h-13 sm:text-base font-black tracking-wide text-white shadow-lg shadow-emerald-900/30 transition-all duration-200 hover:-translate-y-0.5 hover:from-emerald-400 hover:to-teal-400 active:translate-y-0"
                                    onClick={handleCloseSettings}
                                >
                                    Back to Game
                                </button>
                            </div>
                        </div>
                        <div className="h-[2px] w-full bg-gradient-to-r from-cyan-300/72 via-teal-300/66 to-sky-300/72" />
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
};

export default SettingsModal;
