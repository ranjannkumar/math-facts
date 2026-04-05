import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import {
  DEFAULT_OPERATION,
  MODULE_META,
  MODULE_SEQUENCE,
  getOperationLabel,
  getOperationMaxLevel,
  normalizeOperation,
} from '../config/modulesConfig.js';
import { useMathGamePick } from '../store/mathGameBridgeStore.js';

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
    useMathGamePick((ctx) => ({
      operationsMeta: ctx.operationsMeta || {},
      progressByOperation: ctx.progressByOperation || {},
      flowMode: ctx.flowMode,
      setSelectedOperation: ctx.setSelectedOperation || (() => {}),
      refreshOperationAndProgress: ctx.refreshOperationAndProgress || (() => Promise.resolve()),
      childName: ctx.childName || '',
    }));
  const childNameDisplay = (childName || '').toUpperCase();

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

  const isMultiOperation = visibleOperations.length > 1;
  const gridClass = isMultiOperation
    ? 'grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 w-full max-w-xl lg:max-w-[58rem] place-items-center'
    : 'grid-cols-1 gap-4 lg:gap-6 w-full max-w-xl lg:max-w-[40rem] place-items-center';
  const cardSizeClass = isMultiOperation
    ? 'w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 xl:w-72 xl:h-72'
    : 'w-48 h-48 sm:w-56 sm:h-56 lg:w-72 lg:h-72 xl:w-80 xl:h-80';
  const badgeSizeClass = isMultiOperation
    ? 'w-12 h-12 text-3xl lg:w-14 lg:h-14 lg:text-4xl'
    : 'w-12 h-12 text-3xl lg:w-16 lg:h-16 lg:text-5xl';
  const labelSizeClass = isMultiOperation
    ? 'text-2xl lg:text-[1.75rem]'
    : 'text-2xl lg:text-[2.2rem]';

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

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 sm:gap-8 lg:gap-10 pt-20 sm:pt-24 lg:pt-28 pb-24">
        <h1 className="z-10 text-white text-3xl sm:text-4xl lg:text-5xl font-extrabold drop-shadow text-center animate-fade-in">
          WELCOME, {childNameDisplay}
        </h1>

        <div className={`grid ${gridClass}`}>
          {visibleOperations.map((operation) => (
            <button
              key={operation}
              onClick={() => handleSelect(operation)}
              className={`bg-green-600 hover:bg-green-700 rounded-2xl shadow-xl border-2 border-green-400 transition-all duration-200 hover:scale-[1.01] ${cardSizeClass} flex items-center justify-center text-center`}
            >
              <div className="flex flex-col items-center gap-4 lg:gap-5 px-3">
                <div
                  className={`${badgeSizeClass} rounded-full border-2 shadow-md flex items-center justify-center font-black ${OPERATION_UI[operation]?.badgeClass || 'bg-white text-green-700 border-green-100'}`}
                  style={{ textShadow: '0 1px 0 rgba(0,0,0,0.18)' }}
                >
                  {OPERATION_UI[operation]?.symbol || '?'}
                </div>
                <div
                  className={`${labelSizeClass} leading-tight font-black tracking-wide text-center ${OPERATION_UI[operation]?.textClass || 'text-white'}`}
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
