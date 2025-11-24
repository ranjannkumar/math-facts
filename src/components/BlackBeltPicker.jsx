// src/components/BlackBeltPicker.jsx
import React, { useContext, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MathGameContext } from '../App.jsx';
import { FaArrowLeft } from 'react-icons/fa';

const degrees = [1, 2, 3, 4, 5, 6, 7];

const BlackBeltPicker = () => {
  const navigate = useNavigate();
  const {
    selectedTable,
    startQuizWithDifficulty,
    tableProgress,
    isQuizStarting,
  } = useContext(MathGameContext);


  useEffect(() => {
    if (!selectedTable) {
        navigate('/levels');
    }
  }, [selectedTable, navigate]);

// 
  if (!selectedTable) return null;


  // Compute EFFECTIVE unlocks from state (based on backend source of truth)
 const { effectiveMaxUnlocked, completedSet } = useMemo(() => {
    if (!selectedTable) return { effectiveMaxUnlocked: 1, completedSet: new Set() };

    const lvlKey = `L${selectedTable}`;
    const levelProg = tableProgress?.[lvlKey]?.black;

    const fromCompleted = Array.isArray(levelProg?.completedDegrees)
      ? levelProg.completedDegrees
      : [];

    const maxCompleted = fromCompleted.length ? Math.max(...fromCompleted) : 0;
    const nextUnlocked = Math.min(7, maxCompleted + 1);

    return {
      effectiveMaxUnlocked: Math.max(1, nextUnlocked),
      completedSet: new Set(fromCompleted),
    };
  }, [selectedTable, tableProgress]); 

   const isUnlocked = (deg) => deg <= effectiveMaxUnlocked; 
  const isCompleted = (deg) => completedSet.has(deg);

  const handlePick = (deg) => {
    if (!isUnlocked(deg) || isQuizStarting) return; 
    startQuizWithDifficulty(`black-${deg}`, selectedTable);
    // navigate('/quiz');
  };

  const CardShell = ({ children, locked, stripColor, highlighted }) => (
    <div
      className={[
        'relative rounded-2xl shadow-xl border border-slate-300',
        'w-[180px] h-[200px]',
        'bg-slate-100 hover:bg-slate-50 transition',
        highlighted ? 'ring-2 ring-white' : '',
        locked ? 'opacity-70' : '',
      ].join(' ')}
    >
      <div className={`h-2 ${stripColor} rounded-t-2xl`} />
      <div className="absolute top-2 right-2">
        <div className=" shadow flex items-center justify-center text-slate-700 text-[13px]">
          {locked ? '🔒' : ''}
        </div>
      </div>
      <div className="p-5 flex flex-col items-center justify-start">{children}</div>
    </div>
  );

   

  return (
    <div
      className="min-h-screen w-full px-4 py-6 flex flex-col items-center"
      style={{
        backgroundImage: "url('/night_sky_landscape.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
        <div className="flex items-center justify-between mb-4">
          <button
            className="fixed z-50 bg-white/80 hover:bg-gray-200 text-gray-700 rounded-full p-2 shadow-lg border-2 border-gray-400 transition-all duration-300 transform hover:scale-110 active:scale-95"
            style={{
              top: 'max(env(safe-area-inset-top), 0.5rem)',
              left: 'max(env(safe-area-inset-left), 0.5rem)',
            }}
            onClick={() => navigate('/belts')}
            aria-label="Back"
          >
            <FaArrowLeft size={24} />
          </button>
        </div>

        <h1 className="text-white text-3xl font-extrabold drop-shadow mb-3 text-center">
          Level {selectedTable}
        </h1>

        <h1 className="text-white text-3xl font-extrabold drop-shadow text-center mb-4">
          Black Belt Degrees
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-0 w-full max-w-2xl  place-items-center justify-items-center">
        {degrees.map((deg) => {
          if (isCompleted(deg)) return null;

          const locked = !isUnlocked(deg);
          const isDisabled = locked || isQuizStarting;

          return (
            <button
              key={deg}
              onClick={() => handlePick(deg)}
              disabled={isDisabled}
              className="text-center"
            >
              <CardShell
                locked={locked}
                highlighted={false}
                stripColor="bg-gray-900"   
              >
                <h3 className="text-[24px] leading-6 font-extrabold text-slate-900 mt-1 mb-2">
                  Degree {deg}
                </h3>

                {/* BLACK BELT IMAGE ON EVERY DEGREE */}
                <img
                  src="/judo_black_belt.png"
                  alt="Black belt"
                  className="h-8 mx-auto my-1 drop-shadow"
                />

                {/* STAR ICON (same as difficulty picker) */}
                <div className="text-[18px] mb-1">{locked ? '☆' : '☆'}</div>

                {/* QUESTION COUNT */}
                <div className="text-slate-800 text-[20px]">20 Questions</div>
              </CardShell>
            </button>
          );
        })}

        </div>
      </div>
    </div>
  );
};

export default BlackBeltPicker;
