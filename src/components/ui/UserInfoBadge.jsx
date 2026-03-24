import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { MathGameContext } from '../../App.jsx';
import { userGetDailyStats, userGetProgress } from '../../api/mathApi.js';
import { normalizeOperation } from '../../config/modulesConfig.js';

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
    currentBelt = `Black Degree ${currentDegree}`;
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
    level: `${opLabel} L${currentLevelInfo.level}`,
    belt: getBeltLabel(currentLevelInfo.data),
  };
};

const UserInfoBadge = () => {
  const { childName, childPin, grandTotalCorrect, selectedOperation } = useContext(MathGameContext);
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
      className="fixed z-50 select-none"
      style={{
        top: 'max(env(safe-area-inset-top), 1.8rem)',
        right: 'max(env(safe-area-inset-right), 6.75rem)',
        transform: 'translateY(-2px)',
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="Open user stats"
        className="
          rounded-2xl px-3.5 py-2.5
          bg-gradient-to-br from-slate-800/85 to-slate-700/70
          backdrop-blur-md
          ring-1 ring-white/15 shadow-lg
          hover:from-slate-800/95 hover:to-slate-700/90
          transition-all duration-300 group
          flex items-center
        "
      >
        <span className="flex flex-col items-start text-left leading-snug text-white drop-shadow-sm">
          <span
            className="text-base font-bold tracking-normal max-w-[11rem] sm:max-w-[12rem] truncate"
            title={childName}
          >
            {childName}
          </span>

          <span className="mt-0.5 text-[17px] font-bold tabular-nums opacity-90">#{childPin}</span>
        </span>
      </button>

      {isOpen && (
        <div
          className="
            absolute right-0 mt-2 w-[240px]
            rounded-2xl p-3
            bg-slate-900/95 text-white
            ring-1 ring-white/15 shadow-2xl
            backdrop-blur-md
          "
        >
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-300">Total Score</span>
              <span className="font-extrabold tabular-nums">{totalScore}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-300">Total Time</span>
              <span className="font-extrabold tabular-nums">{totalTime}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-300">Level</span>
              <span className="font-bold">{progressInfo.level}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-300">Belt</span>
              <span className="font-bold">{progressInfo.belt}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserInfoBadge;
