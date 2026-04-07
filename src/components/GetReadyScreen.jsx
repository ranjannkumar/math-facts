import React, { useEffect, useState } from 'react';

const GetReadyScreen = () => {
  const [loadingDots, setLoadingDots] = useState(1);

  useEffect(() => {
    const dotsTimer = setInterval(() => {
      setLoadingDots((prev) => (prev >= 3 ? 1 : prev + 1));
    }, 420);

    return () => clearInterval(dotsTimer);
  }, []);

  const loadingText = `Loading${'.'.repeat(loadingDots)}`;

  return (
    <div
      className="fixed inset-0 z-[100200] flex items-center justify-center px-4"
      style={{
        backgroundImage: "url('/night_sky_landscape.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
      aria-modal="true"
      role="dialog"
      aria-live="polite"
    >
      <style>
        {`
          @keyframes mascot-float {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-8px) scale(1.05); }
          }
          @keyframes ring-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      <div className="w-[92vw] max-w-[18rem] sm:max-w-[21rem] lg:max-w-[24rem] rounded-[1.5rem] sm:rounded-[1.9rem] border border-cyan-200/35 bg-slate-950/70 px-5 py-6 sm:px-7 sm:py-8 lg:px-8 lg:py-9 text-white shadow-2xl backdrop-blur-md">
        <div className="mb-4 sm:mb-5 flex justify-center">
          <div className="relative h-20 w-20 sm:h-24 sm:w-24 lg:h-28 lg:w-28">
            <div
              className="absolute inset-0 rounded-full border-2 border-cyan-200/45"
              style={{ animation: 'ring-spin 3s linear infinite' }}
            />
            <div className="absolute inset-[8px] rounded-full bg-gradient-to-br from-emerald-300 to-cyan-300 shadow-lg" />
            <div
              className="absolute inset-0 flex items-center justify-center text-4xl sm:text-5xl lg:text-6xl"
              style={{ animation: 'mascot-float 2s ease-in-out infinite' }}
              aria-hidden="true"
            >
              {'\u{1F419}'}
            </div>
          </div>
        </div>

        <div className="text-center text-xl sm:text-2xl lg:text-3xl font-extrabold text-cyan-100 min-h-[2rem] sm:min-h-[2.7rem]">
          {loadingText}
        </div>
      </div>
    </div>
  );
};

export default GetReadyScreen;
