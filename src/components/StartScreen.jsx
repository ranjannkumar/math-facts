import React, { useContext } from 'react';
import { MathGameContext } from '../App.jsx';

const APP_VERSION = '6.3';
const APP_RELEASE_DATE_BY_VERSION = {
    '6.2': '2026-04-02',
    '6.3': '2026-04-03',
};

const StartScreen = () => {
    const { navigate } = useContext(MathGameContext);
    const releaseDateIso = APP_RELEASE_DATE_BY_VERSION[APP_VERSION] || '2026-04-01';
    const releaseDateDisplay = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(`${releaseDateIso}T12:00:00Z`));
  
    const handleStartClick = () => {
        navigate('/name');
    };

    return (
        <div
            className="flex flex-col items-center justify-center relative landscape-optimized portrait-optimized ios-notch overflow-hidden"
            style={{
                width: '100%',
                height: '100vh',
                minHeight: '100vh',
                paddingTop: 'max(env(safe-area-inset-top), 1rem)',
                paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)',
                paddingLeft: 'max(env(safe-area-inset-left), 0.5rem)',
                paddingRight: 'max(env(safe-area-inset-right), 0.5rem)',
                backgroundImage: "url('/night_sky_landscape.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
        >
            <div className="absolute inset-0 z-0 overflow-hidden">
                <iframe
                    src="/clock-logo.html"
                    title="Clock Logo Animation"
                    width="100%"
                    height="100%"
                    style={{
                        border: 'none',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        maxWidth: '100%',
                        maxHeight: '100%',
                    }}
                />
            </div>
      
            <div className="flex flex-col items-center justify-center w-full h-full relative z-10 px-2 sm:px-4" style={{ userSelect: 'none' }}>
                <div style={{ height: 'clamp(15vh, 20vw, 30vh)' }} />
        
                <div className="absolute bottom-[5%] left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-4 sm:gap-6">
                    <div className="px-2 sm:px-4">
                        <button
                            className="text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 font-semibold"
                            style={{ 
                                fontFamily: 'Arial, sans-serif',
                                letterSpacing: '0.05em',
                                fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)'
                            }}
                            inputMode="none"
                            tabIndex="-1"
                        >
                            Version {APP_VERSION}
                        </button>
                        <p
                            className="mt-1 text-center text-white/85"
                            style={{
                                fontFamily: 'Arial, sans-serif',
                                fontSize: 'clamp(0.68rem, 2.2vw, 0.8rem)',
                                letterSpacing: '0.03em',
                            }}
                        >
                            {releaseDateDisplay}
                        </p>
                    </div>
          
                    <div className="px-2 sm:px-4">
                        <button
                            onClick={handleStartClick}
                            className="bg-green-800 hover:bg-green-900 text-white font-bold py-2 sm:py-3 px-6 sm:px-8 rounded-xl sm:rounded-2xl text-base sm:text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
                            inputMode="none"
                            tabIndex="-1"
                        >
                            Start
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StartScreen;
