import React, { useEffect } from 'react';
import { useMathGamePick } from '../store/mathGameBridgeStore.js';

const PretestIntroScreen = () => {
  const { isPretest, selectedTable, navigate, isQuittingRef } =
    useMathGamePick((ctx) => ({
      isPretest: Boolean(ctx.isPretest),
      selectedTable: ctx.selectedTable,
      navigate: ctx.navigate || (() => {}),
      isQuittingRef: ctx.isQuittingRef || { current: false },
    }));

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

  const levelLabel = selectedTable ?? '_';

  return (
    <div
      className="min-h-screen w-full fixed inset-0 flex items-center justify-center p-4 overflow-hidden"
      style={{
        backgroundImage: "url('/night_sky_landscape.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[14%] left-[18%] h-2 w-2 rounded-full bg-white/50 animate-pulse" />
        <div className="absolute top-[24%] right-[22%] h-1.5 w-1.5 rounded-full bg-emerald-200/70 animate-pulse" />
        <div className="absolute bottom-[22%] left-[28%] h-2 w-2 rounded-full bg-cyan-200/55 animate-pulse" />
        <div className="absolute bottom-[16%] right-[30%] h-1.5 w-1.5 rounded-full bg-white/45 animate-pulse" />
      </div>

      <div className="relative w-full max-w-[560px] md:max-w-[700px] lg:max-w-[820px] xl:max-w-[900px]">
        <div className="absolute -top-10 -right-8 h-28 w-28 rounded-full bg-emerald-300/30 blur-2xl" />
        <div className="absolute -bottom-12 -left-10 h-32 w-32 rounded-full bg-cyan-300/20 blur-2xl" />

        <div className="rounded-[28px] md:rounded-[32px] bg-gradient-to-br from-emerald-300/70 via-cyan-300/55 to-lime-200/65 p-[1.5px] shadow-[0_18px_48px_rgba(4,12,10,0.6)]">
          <div className="relative min-h-[220px] md:min-h-[260px] lg:min-h-[300px] overflow-hidden rounded-[26px] md:rounded-[30px] border border-white/15 bg-slate-950/58 backdrop-blur-md animate-pulse [animation-duration:2.2s]">
            <div className="absolute -top-16 -right-16 h-36 w-36 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-cyan-400/16 blur-3xl" />

            <span className="pointer-events-none absolute top-3 left-4 text-emerald-100/60 text-xl font-black animate-pulse">+</span>
            <span className="pointer-events-none absolute top-4 right-5 text-cyan-100/60 text-xl font-black animate-pulse">-</span>
            <span className="pointer-events-none absolute bottom-14 left-5 text-lime-100/60 text-xl font-black animate-pulse">×</span>
            <span className="pointer-events-none absolute bottom-14 right-5 text-sky-100/65 text-xl font-black animate-pulse">÷</span>

            <div className="relative p-5 sm:p-6 md:p-8 lg:p-9">
              <div className="mx-auto mb-6 md:mb-8 w-full rounded-2xl md:rounded-3xl border border-emerald-100/15 bg-black/42 px-4 py-4 sm:px-5 md:px-7 lg:px-8 md:py-5 lg:py-6 shadow-[inset_0_0_24px_rgba(16,185,129,0.14)]">
                <h2
                  className="mx-auto w-full text-center font-extrabold tracking-tight text-white whitespace-normal break-words leading-tight text-[clamp(1.05rem,4vw,1.72rem)] sm:text-[clamp(1.3rem,2.9vw,1.95rem)] md:text-[clamp(1.6rem,2.8vw,2.4rem)]"
                  style={{ fontFamily: 'Baloo 2, Comic Neue, cursive' }}
                >
                  <span className="block whitespace-normal break-words text-[clamp(1.4rem,5vw,2.45rem)] sm:text-[clamp(1.8rem,3.4vw,2.7rem)] md:text-[clamp(2.2rem,4vw,3.25rem)] leading-[1.1]">
                    {`LEVEL ${levelLabel} PREVIEW`}
                  </span>
                  <span className="mt-1.5 md:mt-2 block whitespace-normal break-words text-[clamp(0.82rem,2.8vw,1.4rem)] sm:text-[clamp(0.95rem,2vw,1.5rem)] md:text-[clamp(1.15rem,1.9vw,1.85rem)] leading-[1.15]">
                    ANSWER AS FAST AS YOU CAN
                  </span>
                </h2>
              </div>

              <div className="flex items-center justify-center pb-3 md:pb-4">
                <div className="relative h-11 w-11 md:h-14 md:w-14">
                  <div className="absolute inset-0 rounded-full border-[3px] border-emerald-100/20" />
                  <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-emerald-300 border-r-cyan-300 animate-spin" />
                  <div className="absolute inset-[9px] rounded-full bg-emerald-300/28 animate-pulse" />
                </div>
              </div>
            </div>
            <div className="h-1 w-full bg-gradient-to-r from-emerald-300/75 via-cyan-300/70 to-lime-200/75" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PretestIntroScreen;
