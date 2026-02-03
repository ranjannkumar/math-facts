import React, { useContext, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { MathGameContext } from '../App.jsx';

const formatMs = (ms) => {
  if (!Number.isFinite(ms)) return '--:--';
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const PretestResultScreen = () => {
  const {
    pretestResult,
    selectedTable,
    setPretestResult,
    setIsPretest,
    navigate,
  } = useContext(MathGameContext);
  const location = useLocation();

  const effectiveResult = useMemo(() => {
    const fromState = location?.state?.pretestResult;
    return pretestResult || fromState || null;
  }, [pretestResult, location]);

  useEffect(() => {
    if (!effectiveResult) {
      const fallbackTimer = setTimeout(() => {
        if (!pretestResult) navigate('/levels', { replace: true });
      }, 200);
      return () => clearTimeout(fallbackTimer);
    }

    const timer = setTimeout(() => {
      setPretestResult(null);
      setIsPretest(false);
      if (effectiveResult.passed === true) {
        navigate('/levels', { replace: true });
      } else {
        navigate('/belts', { replace: true, state: { level: selectedTable } });
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [effectiveResult, pretestResult, navigate, selectedTable, setPretestResult, setIsPretest]);

  if (!effectiveResult) return null;

  const { passed, summary, totalTimeMs } = effectiveResult;

  const correct = summary?.correct ?? 0;
  const timeUsedLabel = formatMs(totalTimeMs ?? summary?.totalActiveMs);
  const nextLevel = Number.isFinite(selectedTable) ? selectedTable + 1 : null;

  return (
    <div
      className="min-h-screen full-height-safe w-full relative px-4 py-6 flex items-center justify-center overflow-auto"
      style={{
        background:
          'linear-gradient(180deg, #2a2a2a 0%, #1f1f1f 55%, #161616 100%)',
      }}
    >
      {/* Falling stars only when PASS */}
      {passed && (
        <>
          <style>{`
            @keyframes fall {
              0%   { transform: translate3d(0,-20vh,0) rotate(0deg); opacity: 0; }
              10%  { opacity: 1; }
              100% { transform: translate3d(0,120vh,0) rotate(280deg); opacity: 0; }
            }
            @keyframes shimmer {
              0%,100% { opacity: .35; filter: drop-shadow(0 0 0 rgba(255,255,255,0)); }
              50%     { opacity: .95; filter: drop-shadow(0 6px 14px rgba(255,255,255,.35)); }
            }
            .falling-star {
              position: absolute;
              top: -20vh;
              z-index: 1;
              pointer-events: none;
              animation-name: fall, shimmer;
              animation-timing-function: linear, ease-in-out;
              animation-iteration-count: infinite, infinite;
              will-change: transform, opacity;
            }
          `}</style>

          <div
            className="falling-star text-2xl sm:text-3xl"
            style={{
              left: '10%',
              animationDuration: '2.8s, 1.2s',
              animationDelay: '0s, .1s',
            }}
          >
            ★
          </div>
          <div
            className="falling-star text-3xl sm:text-4xl"
            style={{
              left: '28%',
              animationDuration: '3.4s, 1.6s',
              animationDelay: '.3s, .2s',
            }}
          >
            ★
          </div>
          <div
            className="falling-star text-xl sm:text-2xl"
            style={{
              left: '52%',
              animationDuration: '3.1s, 1.3s',
              animationDelay: '.6s, .15s',
            }}
          >
            ★
          </div>
          <div
            className="falling-star text-4xl sm:text-5xl"
            style={{
              left: '72%',
              animationDuration: '3.8s, 1.8s',
              animationDelay: '.15s, .25s',
            }}
          >
            ★
          </div>
          <div
            className="falling-star text-2xl sm:text-3xl"
            style={{
              left: '88%',
              animationDuration: '3.0s, 1.4s',
              animationDelay: '.9s, .05s',
            }}
          >
            ★
          </div>
        </>
      )}

      <div
        className={[
          'relative z-10 w-full max-w-lg lg:max-w-xl text-center rounded-3xl shadow-2xl',
          'p-4 sm:p-6 md:p-8',
        ].join(' ')}
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.06) 100%)',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 24px 60px rgba(0,0,0,.55)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        {/* Title pill */}
        <div
          className="mx-auto mb-4 sm:mb-6 rounded-2xl px-4 py-3 sm:px-6 sm:py-3"
          style={{
            maxWidth: 520,
            background: passed
              ? 'linear-gradient(90deg, rgba(139,236,152,.95) 0%, rgba(255,183,3,.95) 100%)'
              : 'linear-gradient(90deg, rgba(124,58,237,.95) 0%, rgba(56,189,248,.95) 100%)',
            boxShadow: '0 10px 26px rgba(0,0,0,.28)',
          }}
        >
          <h2
            className="m-0 text-base sm:text-xl md:text-2xl font-black tracking-wide text-center truncate"
            style={{ letterSpacing: '0.06em', color: '#101827' }}
            title={passed ? 'CONGRATULATONS' : 'WELCOME TO THE BELTS'}
          >
            {passed ? 'CONGRATULATONS' : 'WELCOME TO THE BELTS'}
          </h2>
          <p
            className="mt-1 text-xs sm:text-sm font-semibold text-center truncate"
            style={{ color: 'rgba(16, 24, 39, .85)' }}
            title={passed ? 'Perfect score — you cleared the pretest!' : ' belts mode is next!'}
          >
            {passed ? 'Perfect score — you cleared the pretest!' : ''}
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-5 justify-center max-w-xl mx-auto">
          <div
            className="rounded-2xl p-4 sm:p-5 text-left"
            style={{
              background: 'rgba(20, 20, 20, 0.35)',
              border: '1px solid rgba(255,255,255,0.10)',
              boxShadow: '0 10px 22px rgba(0,0,0,.30)',
            }}
          >
            <div className="text-xs sm:text-sm font-bold tracking-wide uppercase truncate text-white/80">
              Correct
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-white truncate">
              {correct}
            </div>
          </div>

          <div
            className="rounded-2xl p-4 sm:p-5 text-left"
            style={{
              background: 'rgba(20, 20, 20, 0.35)',
              border: '1px solid rgba(255,255,255,0.10)',
              boxShadow: '0 10px 22px rgba(0,0,0,.30)',
            }}
          >
            <div className="text-xs sm:text-sm font-bold tracking-wide uppercase truncate text-white/80">
              Time Taken
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-white truncate">
              {timeUsedLabel}
            </div>
          </div>
        </div>

        {/* Footer message */}
        {passed ? (
          <div
            className="mt-5 sm:mt-7 rounded-2xl px-4 py-3 sm:px-5 sm:py-4 mx-auto max-w-md w-full"
            style={{
              background: 'rgba(34,197,94,0.12)',
              border: '1px solid rgba(34,197,94,0.35)',
              boxShadow: '0 12px 26px rgba(0,0,0,.28)',
            }}
          >
            <p
              className="m-0 text-sm sm:text-lg md:text-xl font-extrabold text-center truncate"
              style={{ color: 'rgba(187, 247, 208, 0.98)' }}
              title={`Welcome to level ${nextLevel ?? 'next'}`}
            >
              Welcome to level {nextLevel ?? 'next'}
            </p>
            <p
              className="m-0 mt-1 text-xs sm:text-sm font-semibold text-center truncate"
              style={{ color: 'rgba(187, 247, 208, 0.80)' }}
              title="Redirecting back to Levels..."
            >
              Redirecting back to Levels...
            </p>
          </div>
        ) : (
          <div
            className="mt-5 sm:mt-7 rounded-2xl px-4 py-3 sm:px-5 sm:py-4 mx-auto max-w-md w-full"
            style={{
              background: 'rgba(56,189,248,0.12)',
              border: '1px solid rgba(56,189,248,0.35)',
              boxShadow: '0 12px 26px rgba(0,0,0,.28)',
            }}
          >
            <p
              className="m-0 text-sm sm:text-lg md:text-xl font-extrabold text-center truncate"
              style={{ color: 'rgba(186, 230, 253, 0.98)' }}
              title="Keep going and earn your belts!"
            >
              Keep going and earn your belts
            </p>
            <p
              className="m-0 mt-1 text-xs sm:text-sm font-semibold text-center truncate"
              style={{ color: 'rgba(186, 230, 253, 0.80)' }}
              title="Taking you to Belts..."
            >
              Taking you to Belts...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PretestResultScreen;
