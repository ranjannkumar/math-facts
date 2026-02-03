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
    <div className="min-h-screen full-height-safe w-full relative px-4 py-6 flex items-center justify-center overflow-auto">
      <div className="kid-bg-star star1 top-5 left-5 text-4xl sm:text-5xl">★</div>
      <div className="kid-bg-star star2 top-20 right-10 text-3xl sm:text-4xl">★</div>
      <div className="kid-bg-star star3 bottom-20 left-10 text-5xl sm:text-6xl">★</div>
      <div className="kid-bg-star star4 top-50 right-5 text-2xl sm:text-3xl">★</div>
      <div className="kid-bg-star star5 bottom-5 right-20 text-4xl sm:text-5xl">★</div>

      <div
        className={[
          'relative z-10 w-full max-w-lg lg:max-w-xl text-center rounded-3xl shadow-2xl',
          'bg-white popup-zoom-in animate-pop-in',
          'p-5 sm:p-8 md:p-10',
        ].join(' ')}
      >
        <div
          className="mx-auto mb-4 sm:mb-6 rounded-xl px-4 py-2 sm:px-6 sm:py-2 celebration-animation"
          style={{
            maxWidth: 420,
            background: passed
              ? 'linear-gradient(90deg, #8BEC98 0%, #FFB703 100%)'
              : 'linear-gradient(90deg, #7C3AED 0%, #38BDF8 100%)',
            boxShadow: '0 8px 24px rgba(0,0,0,.12)',
          }}
        >
          <h2
            className="m-0 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-wide"
            style={{ letterSpacing: '0.06em', color: '#273444' }}
          >
            {passed ? 'CONGRATS!' : 'WELCOME TO THE BELTS!'}
          </h2>
        </div>

        {passed ? (
          <div className="bg-green-100/70 border-2 border-green-300 rounded-2xl py-2 sm:py-4 px-3 mb-6 sm:mb-8 mx-auto max-w-md w-full shadow-lg">
            <p className="text-green-700 font-extrabold text-2xl sm:text-3xl md:text-4xl">
              Welcome to level {nextLevel ?? 'next'}.
            </p>
          </div>
        ) : (
          <div className="bg-blue-100/70 border-2 border-blue-300 rounded-2xl py-2 sm:py-4 px-3 mb-6 sm:mb-8 mx-auto max-w-md w-full shadow-lg">
            <p className="text-blue-700 font-extrabold text-2xl sm:text-3xl md:text-4xl">
              Keep going and earn your belts.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 justify-center max-w-xl mx-auto">
          <div className="bg-white rounded-xl border-2 border-gray-200 p-3 sm:p-4 shadow">
            <div className="text-gray-500 text-xs sm:text-sm">Correct</div>
            <div className="wordart-number text-2xl sm:text-4xl mt-1">{correct}</div>
          </div>
          <div className="bg-white rounded-xl border-2 border-gray-200 p-3 sm:p-4 shadow">
            <div className="text-gray-500 text-xs sm:text-sm">Time Taken</div>
            <div className="wordart-number text-2xl sm:text-4xl mt-1">{timeUsedLabel}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PretestResultScreen;
