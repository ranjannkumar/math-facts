import React, { useContext, useEffect } from 'react';
import { MathGameContext } from '../App.jsx';

const PretestIntroScreen = () => {
  const { isPretest, pretestQuestionCount, pretestTimeLimitMs, navigate, isQuittingRef } =
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
        background: 'linear-gradient(180deg, #242424 0%, #1c1c1c 55%, #151515 100%)',
      }}
    >
      <div className="w-full max-w-md sm:max-w-lg">
        {/* Card */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#1b1f24]/90 shadow-[0_24px_70px_rgba(0,0,0,0.55)] backdrop-blur">
          {/* subtle accent glow */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-emerald-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-28 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />

          <div className="relative p-5 sm:p-6">
            {/* Title pill */}
            <div className="mx-auto mb-5 w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-4 shadow-lg">
              <h2 className="text-center font-extrabold tracking-wide text-white whitespace-nowrap text-[22px] sm:text-3xl">
                READY FOR THE PRETEST 
              </h2>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-gradient-to-r from-sky-500/25 to-indigo-500/25 px-4 py-2 font-semibold text-white shadow-[0_10px_25px_rgba(0,0,0,0.35)]">
                <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-sky-400/80 px-2 text-sm font-extrabold text-black">
                  {questions}
                </span>
                <span className="whitespace-nowrap">Questions</span>
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-gradient-to-r from-fuchsia-500/20 to-amber-400/20 px-4 py-2 font-semibold text-white shadow-[0_10px_25px_rgba(0,0,0,0.35)]">
                <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-amber-300/90 px-2 text-sm font-extrabold text-black">
                  {seconds}s
                </span>
                <span className="whitespace-nowrap">Limit</span>
              </span>
            </div>
          </div>

          {/* bottom accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-emerald-500/70 via-sky-500/70 to-fuchsia-500/70" />
        </div>
      </div>
    </div>
  );
};

export default PretestIntroScreen;
