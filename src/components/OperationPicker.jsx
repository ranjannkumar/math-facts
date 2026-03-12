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

const OperationPicker = () => {
  const navigate = useNavigate();
  const {
    operationsMeta,
    progressByOperation,
    flowMode,
    setSelectedOperation,
    refreshOperationAndProgress,
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
      className="min-h-screen w-full px-4 flex items-center justify-center"
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

      <div className="w-full max-w-3xl mx-auto flex items-center justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl place-items-center">
          {visibleOperations.map((operation) => (
            <button
              key={operation}
              onClick={() => handleSelect(operation)}
              className="bg-green-600 hover:bg-green-700 rounded-2xl shadow-xl border-2 border-green-400 transition-all duration-200 hover:scale-[1.01] w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center text-center"
            >
              <div className="text-2xl font-extrabold text-white">
                {getOperationLabel(operation)}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OperationPicker;
