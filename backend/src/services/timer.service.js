import dayjs from 'dayjs';

export function startTimer(quizRun) {
  if (quizRun.timer.limitMs > 0) {
    // black degree: set remaining if not set
    if (!quizRun.timer.remainingMs) quizRun.timer.remainingMs = quizRun.timer.limitMs;
  }
  quizRun.startedAt = new Date();
}

export function pauseTimer(quizRun) {
  // accumulate active ms and, for black, decrement remaining
  if (!quizRun.startedAt) return;
  const now = dayjs();
  const delta = now.diff(quizRun.startedAt);
  quizRun.totalActiveMs += delta;
  if (quizRun.timer.limitMs > 0) {
    quizRun.timer.remainingMs = Math.max(0, quizRun.timer.remainingMs - delta);
  }
  quizRun.startedAt = null;
  quizRun.pausedAt = now.toDate();
}

export function resumeTimer(quizRun) {
  quizRun.startedAt = new Date();
  quizRun.pausedAt = null;
}

export function isTimeUp(quizRun) {
  if (quizRun.timer.limitMs <= 0) return false;
  return quizRun.timer.remainingMs <= 0;
}
