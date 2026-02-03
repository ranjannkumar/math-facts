import React, { useContext, useEffect } from 'react';
import { MathGameContext } from '../App.jsx';

const PretestIntroScreen = () => {
  const { isPretest, isPretestIntroVisible, pretestQuestionCount, pretestTimeLimitMs, navigate, isQuittingRef } =
    useContext(MathGameContext);

  useEffect(() => {
    if (!isPretest) {
      if (isQuittingRef?.current) {
        navigate('/', { replace: true });
        return;
      }
      navigate('/levels', { replace: true });
    }
  }, [isPretest, navigate, isQuittingRef]);

  if (!isPretest) return null;

  const questions = pretestQuestionCount || 20;
  const seconds = Math.round((pretestTimeLimitMs || 50000) / 1000);

  return (
    <div
      className="min-h-screen w-full fixed inset-0 flex items-center justify-center p-4"
      style={{
        background:
          'linear-gradient(180deg, #242424 0%, #1c1c1c 55%, #151515 100%)',
      }}
    >
      <div className="relative bg-gradient-to-br from-emerald-500 via-emerald-400 to-teal-500 border border-emerald-300/70 rounded-3xl p-4 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] max-w-lg w-full text-center">
        <div className="inline-flex items-center justify-center px-4 sm:px-6 py-3 sm:py-4 rounded-2xl bg-slate-900 text-white shadow-lg mb-5 sm:mb-6">
          <h2 className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-wide whitespace-nowrap">
            Welcome to the Pretest!
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-5 sm:mb-6">
          <span className="inline-flex items-center px-4 py-2 rounded-full bg-cyan-500 text-white font-extrabold shadow">
            {questions} Questions
          </span>
          <span className="inline-flex items-center px-4 py-2 rounded-full bg-amber-400 text-slate-900 font-extrabold shadow">
            {seconds}s Limit
          </span>
        </div>

      </div>
    </div>
  );
};

export default PretestIntroScreen;
