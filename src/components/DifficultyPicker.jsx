// src/components/DifficultyPicker.jsx
import React, { useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { MathGameContext } from '../App.jsx';
import { tableBgColors, themeConfigs } from '../utils/mathGameLogic.js';

const COLOR_BELTS = ['white', 'yellow', 'green', 'blue', 'red', 'brown'];
const beltImages = {
  white: '/judo_white_belt.png',
  yellow: '/judo_yellow_belt.png',
  green: '/judo_green_belt.png',
  blue: '/judo_blue_belt.png',
  red: '/judo_red_belt.png',
  brown: '/judo_brown_belt.png',
  black: '/judo_black_belt.png',
};

const beltPretty = (b) => b.charAt(0).toUpperCase() + b.slice(1);

const BELT_STRIP = {
  white: 'bg-gray-200',
  yellow: 'bg-yellow-400',
  green: 'bg-green-500',
  blue: 'bg-blue-600',
  red: 'bg-red-600',
  brown: 'bg-amber-800',
  black: 'bg-gray-900',
};

function readLSProgress(level, belt) {
  try {
    const raw = localStorage.getItem(`math-table-progress-${level}-${belt}`);
    if (!raw) return null;
    if (raw === 'completed') return { completed: true, perfectPerformance: false };
    if (raw === 'perfect') return { completed: true, perfectPerformance: true };
    const obj = JSON.parse(raw);
    return obj && typeof obj === 'object' ? obj : null;
  } catch {
    return null;
  }
}

const DifficultyPicker = () => {
  const navigate = useNavigate();
  const {
    selectedTable,
    selectedTheme,
    tableProgress,
    startQuizWithDifficulty,
  } = useContext(MathGameContext);

  if (!selectedTable) {
    navigate('/levels');
    return null;
  }

  const theme = selectedTheme?.key ? themeConfigs[selectedTheme.key] : null;

  const unlockedMap = useMemo(() => {
    const lvlKey = String(selectedTable);
    const map = { white: true };
    COLOR_BELTS.forEach((belt, idx) => {
      if (idx === 0) return;
      const prev = COLOR_BELTS[idx - 1];
      const ctxPrev = tableProgress?.[lvlKey]?.[prev];
      const lsPrev = readLSProgress(lvlKey, prev);
      map[belt] = !!(ctxPrev?.completed || lsPrev?.completed);
    });
    const ctxBrown = tableProgress?.[lvlKey]?.brown;
    const lsBrown = readLSProgress(lvlKey, 'brown');
    map.black = !!(ctxBrown?.completed || lsBrown?.completed);
    return map;
  }, [selectedTable, tableProgress]);

  const handlePick = (belt, locked) => {
    if (locked) return;
    if (belt === 'black') navigate('/black');
    else startQuizWithDifficulty(belt);
  };

  const getBeltProgress = (belt) => {
    const lvlKey = String(selectedTable);
    const ctx = tableProgress?.[lvlKey]?.[belt];
    const ls = readLSProgress(lvlKey, belt);
    const hasCompleted = !!(ctx?.completed || ls?.completed);
    const hasPerfect = !!(ctx?.perfectPerformance || ls?.perfectPerformance);
    return { hasCompleted, hasPerfect };
  };

  const CardShell = ({ children, locked, stripColor, highlighted }) => (
    <div
      className={[
        'relative rounded-2xl shadow-xl border border-slate-300',
        'w-[220px] h-[260px]',
        'bg-slate-100 hover:bg-slate-50 transition',
        highlighted ? 'ring-2 ring-white' : '',
        locked ? 'opacity-70' : '',
      ].join(' ')}
    >
      <div className={`h-2 ${stripColor} rounded-t-2xl`} />
      <div className="absolute top-2 right-2">
        <div className="w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center text-slate-700 text-[13px]">
          {locked ? '🔒' : '🔓'}
        </div>
      </div>
      <div className="p-5 flex flex-col items-center justify-start">{children}</div>
    </div>
  );

  const renderCard = (belt) => {
    const locked = !unlockedMap[belt];
    const { hasCompleted } = getBeltProgress(belt);

    return (
      <button
        key={belt}
        onClick={() => handlePick(belt, locked)}
        className="text-center"
      >
        <CardShell
          locked={locked}
          highlighted={belt === 'white'}
          stripColor={BELT_STRIP[belt]}
        >
          <h3 className="text-[20px] leading-6 font-extrabold text-slate-800 mt-1 mb-2">
            {beltPretty(belt)} <span className="font-extrabold">Belt</span>
          </h3>
          <img src={beltImages[belt]} alt={`${belt} belt`} className="h-12 mx-auto my-1 drop-shadow" />
          <div className="text-[18px] mb-1">{hasCompleted ? '⭐' : '☆'}</div>
          <div className="text-slate-700 text-[13px]">10 Questions</div>
        </CardShell>
      </button>
    );
  };

  const renderBlackBeltCard = () => {
    const locked = !unlockedMap.black;
    return (
      <button
        key="black"
        onClick={() => handlePick('black', locked)}
        className="text-center md:col-start-2 lg:col-start-2 justify-self-center"
      >
        <CardShell locked={locked} stripColor={BELT_STRIP.black}>
          <h3 className="text-[20px] leading-6 font-extrabold text-slate-800 mt-1 mb-2">Black Belt</h3>
          <img src={beltImages.black} alt="Black belt" className="h-12 mx-auto my-1 drop-shadow" />
          <div className="text-[18px] mb-1">☆</div>
          <div className="text-slate-700 text-[13px]">Degrees 1–7</div>
        </CardShell>
      </button>
    );
  };

  return (
    <div
      className="min-h-screen w-full px-4 py-6 flex items-center justify-center"
      style={{
        backgroundImage: "url('/night_sky_landscape.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Fixed back button (doesn't affect centering) */}
      <button
        className="fixed z-50 bg-white/80 hover:bg-gray-200 text-gray-700 rounded-full p-2 shadow-lg border-2 border-gray-400 transition-all duration-300 transform hover:scale-110 active:scale-95"
        style={{
          top: 'max(env(safe-area-inset-top), 0.5rem)',
          left: 'max(env(safe-area-inset-left), 0.5rem)',
        }}
        onClick={() => navigate('/levels')}
        aria-label="Back"
      >
        <FaArrowLeft size={24} />
      </button>

      {/* Centered content (title + grid) */}
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
        <h1 className="text-white text-3xl font-extrabold drop-shadow mb-3 text-center">
          Level {selectedTable}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-0  place-items-center justify-items-center">
          {COLOR_BELTS.map((b) => renderCard(b))}
          {renderBlackBeltCard()}
        </div>
      </div>
    </div>
  );
};

export default DifficultyPicker;
