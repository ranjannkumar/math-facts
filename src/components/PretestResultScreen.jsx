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
    <div className={`min-h-screen w-full fixed inset-0 flex items-center justify-center p-4 ${passed ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
      <div className="bg-black/90 text-white rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)] max-w-md w-full text-center">
        {passed ? (
          <>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-2">Congrats!</h2>
            <p className="text-white/80 mb-6">
              Welcome to level {nextLevel ?? 'next'}.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-2">Welcome to the belts!</h2>
            <p className="text-white/80 mb-6">Keep going and earn your belts.</p>
          </>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-xl p-3">
            <div className="text-xs text-white/70">Correct</div>
            <div className="text-2xl font-bold">{correct}</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <div className="text-xs text-white/70">Time Taken</div>
            <div className="text-2xl font-bold">{timeUsedLabel}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PretestResultScreen;
