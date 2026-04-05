import { useEffect } from 'react';

export const useQuizTimerEffect = ({
  isTimerPaused,
  quizStartTime,
  dailyTotalMs,
  setElapsedTime,
  setTotalTimeToday,
}) => {
  useEffect(() => {
    let timer;
    if (!isTimerPaused && quizStartTime) {
      timer = setInterval(() => {
        const sessionElapsedMs = Date.now() - quizStartTime;
        const totalElapsedSeconds = Math.floor((dailyTotalMs + sessionElapsedMs) / 1000);

        setElapsedTime(sessionElapsedMs / 1000);
        setTotalTimeToday(totalElapsedSeconds);
      }, 100);
    }
    return () => {
      clearInterval(timer);
    };
  }, [isTimerPaused, quizStartTime, dailyTotalMs, setElapsedTime, setTotalTimeToday]);
};
