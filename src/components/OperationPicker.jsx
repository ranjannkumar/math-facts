import React, { useContext, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { MathGameContext } from '../App.jsx';
import {
  DEFAULT_OPERATION,
  MODULE_META,
  MODULE_SEQUENCE,
  getOperationLabel,
  getOperationMaxLevel,
  normalizeOperation,
} from '../config/modulesConfig.js';

const OPERATION_UI = {
  add: {
    symbol: '+',
    textClass: 'text-yellow-200',
    badgeClass: 'bg-amber-400 text-amber-900 border-amber-200',
  },
  sub: {
    symbol: '-',
    textClass: 'text-cyan-100',
    badgeClass: 'bg-cyan-300 text-cyan-900 border-cyan-100',
  },
  mul: {
    symbol: 'x',
    textClass: 'text-fuchsia-100',
    badgeClass: 'bg-fuchsia-300 text-fuchsia-900 border-fuchsia-100',
  },
  div: {
    symbol: '÷',
    textClass: 'text-rose-100',
    badgeClass: 'bg-rose-300 text-rose-900 border-rose-100',
  },
};

const OperationPicker = () => {
  const navigate = useNavigate();
  const {
    operationsMeta,
    progressByOperation,
    flowMode,
    setSelectedOperation,
    refreshOperationAndProgress,
    childName,
  } =
    useContext(MathGameContext);

  useEffect(() => {
    refreshOperationAndProgress?.();
  }, [refreshOperationAndProgress]);

  const isOperationComplete = (operation) => {
    const op = normalizeOperation(operation);
    const opProgress = progressByOperation?.[op] || {};
    const maxLevel = operationsMeta?.[op]?.maxLevel || getOperationMaxLevel(op, 19);
    if (!Number.isFinite(maxLevel) || maxLevel < 1) return false;
    const finalLevel = opProgress?.[`L${maxLevel}`];
    return !!finalLevel?.completed;
  };

  const visibleOperations = useMemo(() => {
    const enabledUnlocked = MODULE_SEQUENCE.filter((op) => {
      const meta = operationsMeta?.[op];
      if (!meta) return MODULE_META[op]?.enabled && op === DEFAULT_OPERATION;
      return meta.enabled !== false && meta.unlocked !== false;
    });

    if (flowMode !== 'sequential') return enabledUnlocked;
    if (enabledUnlocked.length === 0) return [DEFAULT_OPERATION];

    // In sequential mode, trust backend unlock state and surface the highest
    // unlocked incomplete operation. This avoids blocking Sub when backend has
    // already unlocked it.
    const highestUnlockedIncomplete = [...enabledUnlocked]
      .reverse()
      .find((op) => !isOperationComplete(op));
    const fallback = enabledUnlocked[enabledUnlocked.length - 1];
    return [highestUnlockedIncomplete || fallback];
  }, [operationsMeta, flowMode, progressByOperation]);

  const handleSelect = (operation) => {
    setSelectedOperation(operation);
    navigate('/levels');
  };

  return (
    <div
      className="relative min-h-screen w-full px-4"
      style={{
        backgroundImage: "url('/night_sky_landscape.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
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

      <h1 className="absolute left-1/2 top-[30%] z-10 -translate-x-1/2 -translate-y-full text-white text-3xl sm:text-4xl font-extrabold drop-shadow text-center animate-fade-in">
        Welcome, {childName || ''}!
      </h1>

      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`grid grid-cols-1 ${visibleOperations.length > 1 ? 'sm:grid-cols-2' : 'sm:grid-cols-1'} gap-4 w-full max-w-xl place-items-center`}
        >
          {visibleOperations.map((operation) => (
            <button
              key={operation}
              onClick={() => handleSelect(operation)}
              className="bg-green-600 hover:bg-green-700 rounded-2xl shadow-xl border-2 border-green-400 transition-all duration-200 hover:scale-[1.01] w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center text-center"
            >
              <div className="flex flex-col items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-full border-2 shadow-md flex items-center justify-center text-3xl font-black ${OPERATION_UI[operation]?.badgeClass || 'bg-white text-green-700 border-green-100'}`}
                  style={{ textShadow: '0 1px 0 rgba(0,0,0,0.18)' }}
                >
                  {OPERATION_UI[operation]?.symbol || '?'}
                </div>
                <div
                  className={`text-4xl font-black tracking-wide ${OPERATION_UI[operation]?.textClass || 'text-white'}`}
                  style={{ textShadow: '0 1px 0 rgba(0,0,0,0.2)' }}
                >
                  {getOperationLabel(operation).toUpperCase()}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OperationPicker;
