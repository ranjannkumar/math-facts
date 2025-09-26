// src/components/BlackBeltPicker.jsx
import React, { useContext, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MathGameContext } from '../App.jsx';

const degrees = [1, 2, 3, 4, 5, 6, 7];

const BlackBeltPicker = () => {
  const navigate = useNavigate();
  const {
    selectedTable,
    startActualQuiz,
    tableProgress,
  } = useContext(MathGameContext);

  // Guard direct entry
  useEffect(() => {
    if (!selectedTable) navigate('/belts');
  }, [selectedTable, navigate]);




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

   const isUnlocked = (deg) => deg <= effectiveMaxUnlocked; // Simplified check
  const isCompleted = (deg) => completedSet.has(deg);

  const handlePick = (deg) => {
    if (!isUnlocked(deg)) return;
    startActualQuiz(`black-${deg}`, selectedTable);
    navigate('/quiz');
  };

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
      <div className="w-full max-w-5xl">
        <div className="flex items-center justify-between mb-4">
          <button
            className="bg-white/80 hover:bg-white text-gray-800 font-semibold px-4 py-2 rounded-xl shadow transition"
            onClick={() => navigate('/belts')}
          >
            ⟵ Belts
          </button>
        </div>

        <h1 className="text-white text-3xl font-extrabold drop-shadow text-center mb-4">
          Black Belt Degrees
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {degrees.map((deg) => {
            const locked = !isUnlocked(deg);
            return (
              <button
                key={deg}
                onClick={() => handlePick(deg)}
                className={`relative rounded-2xl p-6 bg-white/90 shadow-xl hover:bg-white transition
                  ${locked ? 'opacity-60 grayscale cursor-not-allowed' : ''}`}
              >
                <div className="absolute top-2 right-3 text-xl">
                  {locked ? '🔒' : '🔓'}
                </div>
                <div className="text-center">
                  <div className="text-3xl font-extrabold">Degree {deg}</div>
                  <div className="text-xl mt-2">
                    {deg === 7 ? '30 Questions' : '20 Questions'}
                  </div>
                  {isCompleted(deg) && (
                    <div className="mt-2 text-green-600 font-semibold">Completed ✅</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BlackBeltPicker;
