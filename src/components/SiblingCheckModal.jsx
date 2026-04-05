import React from 'react';
import { useMathGamePick } from '../store/mathGameBridgeStore.js';

const SiblingCheckModal = () => {
    const { 
        showSiblingCheck, 
        loginPendingName, 
        handleSiblingCheck 
    } = useMathGamePick((ctx) => ({
        showSiblingCheck: Boolean(ctx.showSiblingCheck),
        loginPendingName: ctx.loginPendingName,
        handleSiblingCheck: ctx.handleSiblingCheck || (() => {}),
    }));

    // Only render if the flag is true and we have a name
    if (!showSiblingCheck || !loginPendingName) {
        return null;
    }
    
    const userName = loginPendingName || 'this user';
    const userNameDisplay = userName.toUpperCase();
    
    const handleYes = () => handleSiblingCheck(true);
    const handleNo = () => handleSiblingCheck(false);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 animate-fade-in">
            <div className="relative w-full max-w-[520px] animate-pop-in">
                <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-emerald-300/38 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-cyan-300/28 blur-2xl" />

                <div className="rounded-[28px] bg-gradient-to-br from-emerald-300/72 via-cyan-300/58 to-lime-200/70 p-[1.5px] shadow-[0_18px_48px_rgba(4,12,10,0.6)]">
                    <div className="relative overflow-hidden rounded-[26px] border border-white/15 bg-slate-950/58 backdrop-blur-md">
                        <div className="pointer-events-none absolute -top-14 -right-12 h-28 w-28 rounded-full bg-emerald-400/20 blur-2xl" />
                        <div className="pointer-events-none absolute -bottom-16 -left-12 h-32 w-32 rounded-full bg-cyan-400/16 blur-2xl" />

                        <div className="relative p-5 sm:p-6">
                            <div className="mx-auto mb-5 w-full rounded-2xl border border-emerald-100/15 bg-black/42 px-4 py-4 shadow-[inset_0_0_24px_rgba(16,185,129,0.14)]">
                                <h2
                                    className="text-center font-extrabold text-white leading-tight text-[clamp(1.55rem,4.7vw,2.25rem)]"
                                    style={{ fontFamily: 'Baloo 2, Comic Neue, cursive' }}
                                >
                                    Are you <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">{userNameDisplay}</span> ?
                                </h2>
                            </div>

                            <div className="flex w-full gap-3 sm:gap-4">
                                <button
                                    className="h-14 flex-1 rounded-xl border border-emerald-200/40 bg-emerald-500 text-base sm:text-lg font-black tracking-wide text-white shadow-lg shadow-emerald-900/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-400 active:translate-y-0"
                                    onClick={handleYes}
                                >
                                    YES
                                </button>
                                <button
                                    className="h-14 flex-1 rounded-xl border border-white/25 bg-slate-100 text-base sm:text-lg font-black tracking-wide text-slate-700 shadow-lg shadow-slate-900/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white active:translate-y-0"
                                    onClick={handleNo}
                                >
                                    NO
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SiblingCheckModal;
