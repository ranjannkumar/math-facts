// src/components/DifficultyPicker.jsx
import React, { useContext, useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { MathGameContext } from '../App.jsx';

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

const DifficultyPicker = () => {
  const navigate = useNavigate();
  const {
    selectedTable,
    tableProgress,
    startQuizWithDifficulty,
  } = useContext(MathGameContext);

  const [isLoading, setIsLoading] = useState(false);



  useEffect(() => {
    if (!selectedTable) {
      navigate('/levels');
    }
  }, [selectedTable, navigate]);

  if (!selectedTable) {
    return null; 
  }


  // --- PROGRESS LOGIC: Rely entirely on `tableProgress` from context ---
  const unlockedMap = useMemo(() => {
    const lvlKey = `L${selectedTable}`;
    const map = {};
    const levelProgress = tableProgress?.[lvlKey] || {};
    
    // L1 is always unlocked. L2+ is unlocked if L(n-1) Black Belt Degree 7 is completed.
    const isLevelUnlocked = selectedTable === 1 || !!levelProgress.unlocked;

    COLOR_BELTS.forEach((belt, idx) => {
        // White belt is unlocked if the entire level is unlocked
        if (belt === 'white') { 
            map[belt] = isLevelUnlocked;
        } else {
            // All other colored belts: unlocked if the previous belt is COMPLETED.
            const prevBelt = COLOR_BELTS[idx - 1];
            console.log('Checking unlock for', belt, 'prev:', prevBelt, 'levelProgress:', levelProgress);
            const isPrevCompleted = !!levelProgress?.[prevBelt]?.completed;
            
            // Fallback: Also include the explicit 'unlocked' flag from the backend
            // for resilience, but the primary mechanism is the previous belt's completion.
            const isExplicitlyUnlocked = !!levelProgress?.[belt]?.unlocked;

            map[belt] = isPrevCompleted || isExplicitlyUnlocked;
        }
    });

    // 2. Black Belt: unlocked if the 'brown' belt is completed.
    const isBrownCompleted = !!levelProgress?.brown?.completed;
    // Check brown completion OR if the black belt is explicitly marked unlocked (e.g., L1 after Brown completion).
    map.black = isBrownCompleted || !!levelProgress?.black?.unlocked;
    
    return map;
  }, [selectedTable, tableProgress]);


  const handlePick = (belt, locked) => {
    if (locked || isLoading) return;
    setIsLoading(true);
    if (belt === 'black') {
      navigate('/black');
       setIsLoading(false);
    }
     else {
        startQuizWithDifficulty(belt, selectedTable)
            .finally(() => setIsLoading(false)); // Ensure loading stops on completion/failure
    }
  };

  const getBeltProgress = (belt) => {
    const lvlKey = `L${selectedTable}`;
    const ctx = tableProgress?.[lvlKey]?.[belt];
    const hasCompleted = !!ctx?.completed;
    const hasPerfect = false; // Perfect tracking removed from core logic
    return { hasCompleted, hasPerfect };
  };

  const CardShell = ({ children, locked, stripColor, highlighted, isDisabled }) => (
    <div
      className={[
        'relative rounded-2xl shadow-xl border border-slate-300',
        'w-[180px] h-[200px]',
        'bg-slate-100 hover:bg-slate-50 transition',
        highlighted ? 'ring-2 ring-white' : '',
        locked || isDisabled ? 'opacity-70 cursor-not-allowed' : '', 
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

  const renderCard = (belt) => {
    const locked = !unlockedMap[belt];
    const { hasCompleted } = getBeltProgress(belt);
    const isDisabled = isLoading || locked;

    return (
      <button
        key={belt}
        onClick={() => handlePick(belt, locked)}
        className="text-center"
        disabled={isDisabled}
      >
        <CardShell
          locked={locked}
          highlighted={belt === 'white'}
          stripColor={BELT_STRIP[belt]}
          isDisabled={isDisabled}
        >
          <h3 className="text-[25px] leading-6 font-extrabold text-slate-1000 mt-1 mb-2">
            {beltPretty(belt)} <span className="font-extrabold">Belt</span>
          </h3>
          <img src={beltImages[belt]} alt={`${belt} belt`} className="h-8 mx-auto my-1 drop-shadow" />
          <div className="text-[18px] mb-1">{hasCompleted ? '⭐' : '☆'}</div>
          <div className="text-slate-800 text-[20px]">10 Questions</div>
        </CardShell>
      </button>
    );
  };

  const renderBlackBeltCard = () => {
    const locked = !unlockedMap.black;
    const isDisabled = isLoading || locked;
    return (
      <button
        key="black"
        onClick={() => handlePick('black', locked)}
        className="text-center md:col-start-2 lg:col-start-2 justify-self-center"
        disabled={isDisabled}
      >
        <CardShell locked={locked} stripColor={BELT_STRIP.black} isDisabled={isDisabled}>
          <h3 className="text-[20px] leading-6 font-extrabold text-slate-800 mt-1 mb-2">Black Belt</h3>
          <img src={beltImages.black} alt="Black belt" className="h-8 mx-auto my-1 drop-shadow" />
          <div className="text-[18px] mb-1">{unlockedMap.black ? '🔓' : '☆'}</div> 
          <div className="text-slate-800 text-[20px]">Degrees 1–7</div>
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
        disabled={isLoading}
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