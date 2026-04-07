import React from 'react';
import DailyStatsCounter from './DailyStatsCounter.jsx';
import SessionTimer from './SessionTimer.jsx';
import { useMathGamePick } from '../../store/mathGameBridgeStore.js';

const ScreenStatsDock = () => {
  const { isTimerPaused, quizStartTime, pausedTime, totalTimeToday, elapsedTime } =
    useMathGamePick((ctx) => ({
      isTimerPaused: Boolean(ctx.isTimerPaused),
      quizStartTime: ctx.quizStartTime || null,
      pausedTime: ctx.pausedTime || 0,
      totalTimeToday: Number.isFinite(ctx.totalTimeToday) ? ctx.totalTimeToday : 0,
      elapsedTime: Number.isFinite(ctx.elapsedTime) ? ctx.elapsedTime : 0,
    }));

  const effectiveAccumulatedTime =
    typeof totalTimeToday === 'number' ? totalTimeToday : elapsedTime || 0;

  return (
    <div className="screen-stats-dock" aria-label="Daily stats">
      <DailyStatsCounter
        style={{
          width: '100%',
          maxWidth: '280px',
        }}
      />
      <SessionTimer
        isActive={!!quizStartTime}
        startTime={quizStartTime}
        isPaused={isTimerPaused}
        pauseStartTime={pausedTime}
        accumulatedTime={effectiveAccumulatedTime}
        style={{
          width: '100%',
          maxWidth: '280px',
        }}
      />
    </div>
  );
};

export default ScreenStatsDock;
