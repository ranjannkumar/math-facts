// src/components/TablePicker.jsx
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { MathGameContext } from '../App.jsx';
import { themeConfigs } from '../utils/mathGameLogic.js';

const TOTAL_LEVELS = 6; // only 6 levels as required
const COLOR_BELTS = ['white', 'yellow', 'green', 'blue', 'red', 'brown'];

/* ----------------- Progress helpers (Updated to rely on Context/Hook) ----------------- */
function areColorBeltsCompleted(level, tableProgress) {
  const lvlKey = `L${level}`;
  const levelProgress = tableProgress?.[lvlKey];
  if (!levelProgress) return false;
  return COLOR_BELTS.every((belt) => !!levelProgress[belt]?.completed);
}
function countCompletedBelts(level, tableProgress) {
  const lvlKey = `L${level}`;
  const levelProgress = tableProgress?.[lvlKey];
  if (!levelProgress) return 0;
  return COLOR_BELTS.filter((belt) => !!levelProgress[belt]?.completed).length;
}
function isPreviousLevelCompleted(level, tableProgress) {
  const prevLevel = level - 1;
  if (prevLevel < 1) return true; // Level 1 is always unlocked
  
  // A level is unlocked if the previous one is marked 'completed' (by Black Belt Degree 7 completion)
  // OR if the current level is explicitly marked 'unlocked' (e.g., L1 is unlocked on login).
  const prevLvlKey = `L${prevLevel}`;
  return !!tableProgress?.[prevLvlKey]?.completed || !!tableProgress?.[`L${level}`]?.unlocked;
}

/* ----------------- Theme resolver (Keep existing logic) ----------------- */
const THEME_LS_KEYS = ['math-selected-theme', 'selected-theme', 'selectedTheme', 'theme', 'themeKey'];
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z]/g, '');
const safeParse = (s) => { try { return JSON.parse(s); } catch { return null; } };

function resolveThemeKey(preferredFromContext) {
  const keys = Object.keys(themeConfigs);

  if (preferredFromContext && typeof preferredFromContext === 'object') {
    const k = preferredFromContext.key || preferredFromContext.id || preferredFromContext.name;
    if (k && themeConfigs[k]) return k;
  }
  if (preferredFromContext && typeof preferredFromContext === 'string') {
    if (themeConfigs[preferredFromContext]) return preferredFromContext;
  }
  if (typeof window !== 'undefined') {
    for (const lsKey of THEME_LS_KEYS) {
      const raw = localStorage.getItem(lsKey);
      if (!raw) continue;
      let candidate = raw;
      if (raw.trim().startsWith('{')) {
        const obj = safeParse(raw);
        candidate = obj?.key || obj?.value || obj?.name || obj?.id || '';
      }
      if (themeConfigs[candidate]) return candidate;
    }
  }
  return keys[0];
}

/* ----------------- Component ----------------- */
const TablePicker = () => {
  const navigate = useNavigate();
  const { setSelectedTable, tableProgress, childName, selectedTheme } = useContext(MathGameContext);

  // Resolve theme
  const themeKey = resolveThemeKey(selectedTheme);
  const currentTheme = themeConfigs[themeKey] || {};

  // Unlocked levels (recompute each render)
  const unlockedLevels = (() => {
    const arr = new Array(TOTAL_LEVELS).fill(false);
    arr[0] = true; // Level 1 is always unlocked
    for (let lvl = 2; lvl <= TOTAL_LEVELS; lvl++) {
        arr[lvl - 1] = isPreviousLevelCompleted(lvl, tableProgress);
    }
    return arr;
  })();

  // one-at-a-time nav + animation direction
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [animDir, setAnimDir] = React.useState(null); // 'left' | 'right' | null
  const maxIdx = TOTAL_LEVELS - 1;

  const goPrev = () => {
    if (activeIdx === 0) return;
    setAnimDir('left');
    setActiveIdx((i) => Math.max(0, i - 1));
  };
  const goNext = () => {
    if (activeIdx === maxIdx) return;
    setAnimDir('right');
    setActiveIdx((i) => Math.min(maxIdx, i + 1));
  };

  // Clear the slide animation class shortly after index changes
  React.useEffect(() => {
    if (!animDir) return;
    const t = setTimeout(() => setAnimDir(null), 320);
    return () => clearTimeout(t);
  }, [activeIdx, animDir]);

  const levelNumber = activeIdx + 1;
  const unlocked = unlockedLevels[activeIdx];
  const completedBelts = countCompletedBelts(levelNumber, tableProgress);
  const starDisplay = '⭐'.repeat(completedBelts) + '☆'.repeat(COLOR_BELTS.length - completedBelts);

  // Theme-driven visuals for THIS level (index 0..5)
  const idx = Math.max(0, Math.min(TOTAL_LEVELS - 1, activeIdx));
  const emojiForLevel = currentTheme?.tableEmojis?.[idx] ?? '⭐';
  const nameForLevel  = currentTheme?.tableNames?.[idx]  ?? 'Level';
  const colorForLevel = currentTheme?.tableColors?.[idx] ?? 'bg-white border-gray-300';

  // Extract bg class; fill card; yellow ring like :3000
  const bgMatch = colorForLevel.match(/\bbg-[\w-]+\b/);
  const cardBgCls = bgMatch ? bgMatch[0] : 'bg-white';
  const ringCls = 'ring-yellow-300';
  const badgeBgCls = cardBgCls;

  const handleSelect = (levelIndex) => {
    if (!unlockedLevels[levelIndex]) return;
    const lvl = levelIndex + 1;
    setSelectedTable(lvl);
    navigate('/belts');
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
      {/* Back button fixed top-left */}
      <button
        className="fixed z-50 bg-white/80 hover:bg-gray-200 text-gray-700 rounded-full p-2 shadow-lg border-2 border-gray-400 focus:outline-none transition-all duration-300 transform hover:scale-110 active:scale-95"
        style={{
          fontSize: 'clamp(1rem, 4vw, 1.5rem)',
          top: 'max(env(safe-area-inset-top), 0.5rem)',
          left: 'max(env(safe-area-inset-left), 0.5rem)',
        }}
        onClick={() => navigate('/theme')}
        aria-label="Back to theme"
      >
        <FaArrowLeft size={24} />
      </button>

      {/* Centered column: Welcome + Card controls */}
      <div className="w-full max-w-5xl flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
        <h1 className="text-white text-3xl sm:text-4xl font-extrabold drop-shadow mb-6 text-center animate-fade-in">
          Welcome, {childName || ''}!
        </h1>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={goPrev}
            disabled={activeIdx === 0}
            className="px-4 py-2 rounded-full bg-white/90 shadow-lg border border-gray-300 disabled:opacity-50 active:scale-95 transition-transform"
            aria-label="Previous Level"
          >
            ◀
          </button>

          {/* Animated card wrapper */}
          <div
            className={`transition-transform ${
              animDir === 'left' ? 'animate-slide-left' : animDir === 'right' ? 'animate-slide-right' : ''
            }`}
            key={`card-${activeIdx}`}
          >
            <button
              onClick={() => unlocked && handleSelect(activeIdx)}
              className={`relative rounded-2xl p-6 ${cardBgCls} text-white shadow-xl min-w-[280px] sm:min-w-[380px] ring-4 ${ringCls} ${
                unlocked ? 'hover:shadow-2xl hover:-translate-y-0.5 transition-transform' : 'opacity-60 grayscale cursor-not-allowed'
              }`}
              aria-label={`Open Level ${levelNumber}`}
            >
              <div className="absolute top-2 right-3 text-xl">{unlocked ? '🔓' : '🔒'}</div>

              {/* Emoji badge (pop-in) */}
              <div className="w-20 h-20 bg-black/10 rounded-full shadow-md flex items-center justify-center text-4xl select-none animate-pop">
                <span aria-hidden="true">{emojiForLevel}</span>
              </div>

              {/* Themed table name */}
              <div className="text-3xl font-extrabold drop-shadow-sm text-center">{nameForLevel}</div>

              {/* Level line */}
              <div className="text-lg font-semibold mt-1 text-center opacity-95">Level {levelNumber}</div>

              {/* Stars */}
              <div className="text-2xl mt-2 text-center">{starDisplay}</div>
            </button>
          </div>

          <button
            onClick={goNext}
            disabled={activeIdx === maxIdx}
            className="px-4 py-2 rounded-full bg-white/90 shadow-lg border border-gray-300 disabled:opacity-50 active:scale-95 transition-transform"
            aria-label="Next Level"
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
};

export default TablePicker;