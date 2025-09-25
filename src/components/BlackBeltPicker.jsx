// src/components/BlackBeltPicker.jsx
import React, { useContext, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MathGameContext } from '../App.jsx';

const degrees = [1, 2, 3, 4, 5, 6, 7];

const BlackBeltPicker = () => {
  const navigate = useNavigate();
  const {
    selectedTable,
    unlockedDegrees,
    completedBlackBeltDegrees,
    setUnlockedDegrees,
    startActualQuiz,
    tableProgress,
  } = useContext(MathGameContext);

  // Guard direct entry
  useEffect(() => {
    if (!selectedTable) navigate('/belts');
  }, [selectedTable, navigate]);

  // Helper: read LS list for this level
  const readLsUnlockedForLevel = () => {
    if (!selectedTable) return [];
    try {
      const raw = localStorage.getItem(`math-l${selectedTable}-unlocked-degrees`);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };

  // Safety: ensure degree 1 is unlocked if Brown is done (per-level)
  useEffect(() => {
    if (!selectedTable) return;
    const lvl = String(selectedTable);
    const brownDone =
      !!tableProgress?.[lvl]?.brown?.completed ||
      localStorage.getItem(`math-table-progress-${lvl}-brown`) !== null;

    if (!brownDone) return;

    const ls = readLsUnlockedForLevel();
    const stateArr = Array.isArray(unlockedDegrees) ? unlockedDegrees : [];
    if (!ls.includes(1) || !stateArr.includes(1)) {
      const next = Array.from(new Set([1, ...stateArr, ...ls])).sort((a, b) => a - b);
      setUnlockedDegrees(next);
      localStorage.setItem(`math-l${selectedTable}-unlocked-degrees`, JSON.stringify(next));
    }
  }, [selectedTable, tableProgress, unlockedDegrees, setUnlockedDegrees]);

  // Compute EFFECTIVE unlocks from state + LS + completed list (all per-level)
  const { effectiveMaxUnlocked, effectiveSet, completedSet } = useMemo(() => {
    const ls = readLsUnlockedForLevel();
    const fromState = Array.isArray(unlockedDegrees) ? unlockedDegrees : [];
    const fromCompleted = Array.isArray(completedBlackBeltDegrees)
      ? completedBlackBeltDegrees
      : [];

    const base = new Set();
    fromState.forEach((d) => base.add(d));
    ls.forEach((d) => base.add(d));
    if (base.size === 0) base.add(1);

    if (fromCompleted.length) {
      const maxCompleted = Math.max(...fromCompleted);
      const next = Math.min(7, maxCompleted + 1);
      base.add(next);
    }

    const arr = Array.from(base).filter((d) => d >= 1 && d <= 7);
    const max = arr.length ? Math.max(...arr) : 1;

    return {
      effectiveMaxUnlocked: Math.max(1, max),
      effectiveSet: new Set(arr),
      completedSet: new Set(fromCompleted),
    };
  }, [unlockedDegrees, completedBlackBeltDegrees, selectedTable]);

  const isUnlocked = (deg) => deg <= effectiveMaxUnlocked || effectiveSet.has(deg);
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
