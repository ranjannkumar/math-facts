import React, { useEffect, useMemo, useRef, useState } from 'react';
import { userGetDailyStats, userGetProgress } from '../../api/mathApi.js';
import { normalizeOperation } from '../../config/modulesConfig.js';
import { useMathGamePick } from '../../store/mathGameBridgeStore.js';

const OPERATION_ORDER = ['add', 'sub', 'mul', 'div'];
const MS_PER_SEC = 1000;

const formatTime = (ms) => {
  if (ms < MS_PER_SEC) return '0s';
  const totalSeconds = Math.round(ms / MS_PER_SEC);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

const getBeltLabel = (levelData = {}) => {
  const beltsOrder = ['white', 'yellow', 'green', 'blue', 'red', 'brown'];
  let currentBelt = '--';

  for (const beltName of beltsOrder) {
    if (levelData?.[beltName]?.unlocked || levelData?.[beltName]?.completed) {
      currentBelt = `${beltName.charAt(0).toUpperCase()}${beltName.slice(1)}`;
    }
  }

  if (levelData.black?.unlocked) {
    const completedDegrees = Array.isArray(levelData.black?.completedDegrees)
      ? levelData.black.completedDegrees
      : [];
    const currentDegree = Math.min(completedDegrees.length + 1, 7);
    currentBelt = `Black Belt Degree ${currentDegree}`;
  }

  if (levelData.completed && !levelData.black?.unlocked) {
    return 'Level Mastered';
  }
  return currentBelt;
};

const parseLevelsFromNode = (node = {}) =>
  Object.keys(node)
    .filter((k) => k.startsWith('L'))
    .map((k) => ({ key: k, level: parseInt(k.substring(1), 10), data: node[k] }))
    .filter((x) => Number.isFinite(x.level))
    .sort((a, b) => a.level - b.level);

const hasFlatLevelKeys = (node) =>
  !!node &&
  typeof node === 'object' &&
  Object.keys(node).some((key) => /^L\d+$/i.test(key));

const pickCurrentLevelFromLevels = (levelsAsc = []) => {
  if (!levelsAsc.length) return null;
  const unlockedLevels = levelsAsc.filter((l) => !!l.data?.unlocked);
  const highestUnlockedIncomplete = [...unlockedLevels]
    .reverse()
    .find((l) => !l.data?.completed);
  return highestUnlockedIncomplete || unlockedLevels[unlockedLevels.length - 1] || levelsAsc[0];
};

const getCurrentProgressFromBackend = (progress, selectedOperation) => {
  if (!progress || typeof progress !== 'object') return { level: '--', belt: '--' };

  let scoped = progress;
  if (!hasFlatLevelKeys(progress)) {
    const normalizedOp = normalizeOperation(selectedOperation || 'add');
    if (progress?.[normalizedOp] && typeof progress[normalizedOp] === 'object') {
      scoped = progress[normalizedOp];
    } else {
      const fallbackOp = OPERATION_ORDER.find((op) => progress?.[op] && typeof progress[op] === 'object');
      scoped = fallbackOp ? progress[fallbackOp] : {};
    }
  }

  const levels = parseLevelsFromNode(scoped);
  if (!levels.length) return { level: '--', belt: '--' };
  const currentLevelInfo = pickCurrentLevelFromLevels(levels);
  if (!currentLevelInfo) return { level: '--', belt: '--' };

  const opLabelMap = { add: 'Addition', sub: 'Subtraction', mul: 'Multiplication', div: 'Division' };
  const normalizedOp = normalizeOperation(selectedOperation || 'add');
  const opLabel = opLabelMap[normalizedOp] || normalizedOp;

  return {
    level: `${opLabel} Level ${currentLevelInfo.level}`,
    belt: getBeltLabel(currentLevelInfo.data),
  };
};

const formatBeltDisplay = (belt) => {
  if (!belt || belt === '--' || belt === 'Level Mastered') return belt;
  if (String(belt).startsWith('Black Belt Degree')) return belt;
  return `${belt} Belt`;
};

const UserInfoBadge = () => {
  const { childName, childPin, grandTotalCorrect, selectedOperation } = useMathGamePick((ctx) => ({
    childName: ctx.childName || '',
    childPin: ctx.childPin || '',
    grandTotalCorrect: Number.isFinite(ctx.grandTotalCorrect) ? ctx.grandTotalCorrect : 0,
    selectedOperation: ctx.selectedOperation || 'add',
  }));
  const [isOpen, setIsOpen] = useState(false);
  const [remoteDaily, setRemoteDaily] = useState(null);
  const [remoteProgress, setRemoteProgress] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !childPin) return;

    let cancelled = false;
    const loadRemoteStats = async () => {
      setIsLoadingStats(true);
      try {
        const [dailyPayload, progressPayload] = await Promise.all([
          userGetDailyStats(childPin),
          userGetProgress(childPin),
        ]);
        if (cancelled) return;
        setRemoteDaily(dailyPayload || null);
        setRemoteProgress(progressPayload?.progress || progressPayload || null);
      } catch (err) {
        if (cancelled) return;
        console.warn('UserInfoBadge stats fetch failed:', err?.message || err);
      } finally {
        if (!cancelled) setIsLoadingStats(false);
      }
    };

    loadRemoteStats();
    return () => {
      cancelled = true;
    };
  }, [isOpen, childPin]);

  const progressInfo = useMemo(() => {
    return getCurrentProgressFromBackend(remoteProgress, selectedOperation);
  }, [remoteProgress, selectedOperation]);

  const totalScore = useMemo(() => {
    const backendTotal = Number(remoteDaily?.grandTotal);
    if (Number.isFinite(backendTotal)) return backendTotal;
    return Number(grandTotalCorrect) || 0;
  }, [remoteDaily, grandTotalCorrect]);

  const totalTime = useMemo(() => {
    const backendTotalMs = Number(remoteDaily?.grandTotalActiveMs);
    if (Number.isFinite(backendTotalMs) && backendTotalMs >= 0) {
      return formatTime(backendTotalMs);
    }
    return '0s';
  }, [remoteDaily]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  if (!childPin || !childName) return null;

  return (
    <div
      ref={wrapperRef}
      className="relative z-50 select-none"
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="Open user stats"
        className="
          w-[7.4rem] sm:w-[9.6rem] md:w-[11.2rem]
          rounded-2xl px-2.5 sm:px-3.5 py-2 sm:py-2.5
          bg-gradient-to-br from-slate-900/82 to-slate-800/72
          backdrop-blur-md
          ring-1 ring-white/20 shadow-lg
          hover:from-slate-900/94 hover:to-slate-800/86
          transition-all duration-300 group
          flex items-center
        "
      >
        <span className="flex w-full flex-col items-start text-left leading-snug text-white drop-shadow-sm">
          <span
            className="text-sm sm:text-base font-bold tracking-normal w-full truncate"
            title={childName}
          >
            {childName}
          </span>

          <span className="mt-0.5 text-[15px] sm:text-[17px] font-bold tabular-nums opacity-90">#{childPin}</span>
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[248px]">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-300/65 via-cyan-300/50 to-lime-200/58 p-[1.5px] shadow-[0_14px_34px_rgba(4,12,10,0.52)]">
            <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-slate-950/82 text-white backdrop-blur-md">
              <div className="pointer-events-none absolute -top-14 -right-12 h-28 w-28 rounded-full bg-emerald-400/16 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-16 -left-12 h-32 w-32 rounded-full bg-cyan-400/12 blur-2xl" />
              <span className="pointer-events-none absolute top-2.5 left-3 text-[12px] font-black text-emerald-100/45">+</span>
              <span className="pointer-events-none absolute top-2.5 right-3 text-[12px] font-black text-cyan-100/45">-</span>

              <div className="relative space-y-2 p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-300">Total Score</span>
                  <span className="font-extrabold tabular-nums">{totalScore}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-300">Total Time</span>
                  <span className="font-extrabold tabular-nums">{totalTime}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold">{progressInfo.level}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold">{formatBeltDisplay(progressInfo.belt)}</span>
                </div>
                {isLoadingStats && (
                  <div className="pt-1 text-xs text-emerald-100/70">Updating...</div>
                )}
              </div>
              <div className="h-[2px] w-full bg-gradient-to-r from-emerald-300/65 via-cyan-300/60 to-lime-200/68" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserInfoBadge;
