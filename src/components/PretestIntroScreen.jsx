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
    <div className="min-h-screen w-full fixed inset-0 flex items-center justify-center p-4 bg-emerald-600">
      <div className="relative bg-brown rounded-3xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)] max-w-lg w-full text-center">
        <div className="inline-flex items-center justify-center px-6 py-4 rounded-2xl bg-black text-white shadow-lg mb-6">
          <h2 className="text-4xl sm:text-4xl font-extrabold tracking-wide">
            Welcome to the Pretest!
          </h2>
        </div>

        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-500 text-white font-semibold shadow">
            {questions} Questions
          </span>
          <span className="inline-flex items-center px-4 py-2 rounded-full bg-lime-400 text-black font-semibold shadow">
            {seconds}s Limit
          </span>
        </div>

        <div className="flex flex-col items-center gap-2 text-white/80">
          <div className="h-2 w-44 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full w-2/3 bg-white animate-pulse" />
          </div>
          <p className="text-sm">{isPretestIntroVisible ? 'Preparing your pretest…' : 'Starting…'}</p>
        </div>
      </div>
    </div>
  );
};

export default PretestIntroScreen;
