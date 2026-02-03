// src/components/TablePicker.jsx
import React, { useContext,useEffect,useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { MathGameContext } from '../App.jsx';
import { themeConfigs } from '../utils/mathGameLogic.js';
// import UserInfoBadge from './ui/UserInfoBadge.jsx';
// import DailyStreakCounter from './ui/DailyStreakCounter.jsx';

const TOTAL_LEVELS = 19; // only 12 levels as required
const COLOR_BELTS = ['white', 'yellow', 'green', 'blue', 'red', 'brown'];
const ALL_BELTS_FOR_DISPLAY = ['white', 'yellow', 'green', 'blue', 'red', 'brown', 'black'];

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
  
  // Count the first six color belts completed
  let completedCount = COLOR_BELTS.filter((belt) => !!levelProgress[belt]?.completed).length; 
  
  // Check if the Black Belt section is fully completed (Degree 7)
  const isBlackCompleted = levelProgress?.black?.completedDegrees?.includes(7);
  if (isBlackCompleted) {
    completedCount = ALL_BELTS_FOR_DISPLAY.length; // Max out the stars
  } else if (completedCount === COLOR_BELTS.length && levelProgress?.black?.unlocked) {
  }
  
  //  Use the total number of belts for the maximum display count
  const totalStars = ALL_BELTS_FOR_DISPLAY.length; 
  let currentStars = completedCount;
  
  if (!!levelProgress?.black?.completedDegrees?.includes(7)) {
    currentStars = 7;
  } else if (!!levelProgress?.brown?.completed) {
    currentStars = 6;
  }

  return currentStars;
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
  // Fallback to the first theme defined if no preference found
  return keys[0];
}

const getFactVideoPath = (level) => {
  if (level === 1) return '/fact_level1.mp4';
  if (level === 2) return '/fact_level2.mp4';
  if (level === 5) return '/fact_level5.mp4';
  return '/fact1.mp4';
};

/* ----------------- Component ----------------- */
const TablePicker = () => {
  const navigate = useNavigate();
  const { startLevelEntry, tableProgress, childName, selectedTheme,showDailyStreakAnimation,  playFactVideoAfterStreak,
  setPlayFactVideoAfterStreak,setHideStatsUI, isInitialPrepLoading
} = useContext(MathGameContext);

  // Resolve theme
  const themeKey = resolveThemeKey(selectedTheme);
  const currentTheme = themeConfigs[themeKey] || {};

// 1. Generate a Memoized list of unlocked level NUMBERS (1, 2, 3...)
  const unlockedLevelsList = useMemo(() => {
    const list = [];
    for (let lvl = 1; lvl <= TOTAL_LEVELS; lvl++) {
      if (lvl === 1 || isPreviousLevelCompleted(lvl, tableProgress)) {
        list.push(lvl);
      }
    }
    return list;
  }, [tableProgress]);

  // Part 7: Always focus on the highest unlocked level.
  const maxUnlockedIndex = unlockedLevelsList.length > 0 ? unlockedLevelsList.length - 1 : 0;
  // State variables for sliding animation and index selection are removed.
  // The effective level is always the highest unlocked one.
  const levelNumber = unlockedLevelsList[maxUnlockedIndex] || 1; // Default to Level 1
  const unlocked = !!levelNumber; 

  const [showFactVideo, setShowFactVideo] = useState(false);
  useEffect(() => {
  if (playFactVideoAfterStreak && !showDailyStreakAnimation) {
    setShowFactVideo(true);
    setHideStatsUI(true);
    setPlayFactVideoAfterStreak(false); 
  }
}, [playFactVideoAfterStreak, showDailyStreakAnimation]);

  
  // The rest of the state and handlers for navigation (goPrev/goNext) are removed.
  
  const completedBelts = countCompletedBelts(levelNumber, tableProgress);
  const starDisplay = '⭐'.repeat(completedBelts) + '☆'.repeat(ALL_BELTS_FOR_DISPLAY.length - completedBelts);
  // Theme-driven visuals for THIS level (index is levelNumber - 1)
  const themeIdx = levelNumber > 0 ? levelNumber - 1 : 0;
  const emojiForLevel = currentTheme?.tableEmojis?.[themeIdx] ?? '⭐';
  const nameForLevel  = currentTheme?.tableNames?.[themeIdx]  ?? 'Level';
  const colorForLevel = currentTheme?.tableColors?.[themeIdx] ?? 'bg-white border-gray-300';

   // Extract bg class; fill card; yellow ring like :3000
  const bgMatch = colorForLevel.match(/\bbg-[\w-]+\b/);
  const cardBgCls = bgMatch ? bgMatch[0] : 'bg-white';
  const ringCls = 'ring-yellow-300';
  const lvlKey = `L${levelNumber}`;
  const levelProgress = tableProgress?.[lvlKey];
  const isBlackBeltUnlocked = !!levelProgress?.black?.unlocked;

  const handleSelect = () => {
    if (!unlocked || isInitialPrepLoading) return; // Safeguard
    startLevelEntry(levelNumber, { isBlackBeltUnlocked });
  };

  const factVideoSrc = getFactVideoPath(levelNumber);

  if (showFactVideo && factVideoSrc && !showDailyStreakAnimation) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
  <div className="w-full h-full flex items-center justify-center px-4">
    <video
      src={factVideoSrc}
      autoPlay
      playsInline
      className="
        max-w-full
        max-h-full
        w-auto
        h-auto
        object-contain
      "
      onEnded={() => {
        setShowFactVideo(false);
        setHideStatsUI(false);
      }}
    />
  </div>

  {/* SKIP BUTTON */}
  <button
    onClick={() => {
      setShowFactVideo(false);
      setHideStatsUI(false);
    }}
    className="
      absolute
      top-4 right-4
      z-[200]
      bg-black/70
      text-white
      px-4 py-2
      rounded-full
      text-sm font-semibold
    "
  >
    Skip
  </button>
</div>


    );
  }

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

      {/* <UserInfoBadge /> */}

      {/* <DailyStreakCounter /> */}

      {/* Centered column: Welcome + Card controls */}
      <div className="w-full max-w-5xl flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
        <h1 className="text-white text-3xl sm:text-4xl font-extrabold drop-shadow mb-6 text-center animate-fade-in">
          Welcome, {childName || ''}!
        </h1>

        {/* Part 7: Removed side buttons. Only the card wrapper remains. */}
        <div className="flex items-center justify-center gap-4">
          
          <div
            className={`transition-transform`}
            key={`card-${levelNumber}`}
          >
            {levelNumber ? ( 
              <button
                onClick={handleSelect}
                className={`relative rounded-2xl p-6 ${cardBgCls} text-white shadow-xl min-w-[280px] sm:min-w-[380px] ring-4 ${ringCls} 
                  hover:shadow-2xl hover:-translate-y-0.5 transition-transform`}
                aria-label={`Open Level ${levelNumber}`}
              >
                <div className="absolute top-2 right-3 text-xl">{''}</div>

                {/* Emoji badge (pop-in) */}
                  <div className="w-20 h-20 bg-black/10 rounded-full shadow-md flex items-center justify-center text-5xl select-none mx-auto">
                    <span aria-hidden="true" className="leading-none">
                      {emojiForLevel}
                    </span>
                  </div>


                {/* Themed table name */}
                <div className="text-3xl font-extrabold drop-shadow-sm text-center">{nameForLevel}</div>

                {/* Level line */}
                <div className="text-lg font-semibold mt-1 text-center opacity-95">Level {levelNumber}</div>

                {/* Stars */}
                <div className="text-2xl mt-2 text-center">{starDisplay}</div>
              </button>
            ) : (
                <div className="text-white text-3xl font-extrabold drop-shadow-lg text-center">
                    No Levels Available
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TablePicker;
