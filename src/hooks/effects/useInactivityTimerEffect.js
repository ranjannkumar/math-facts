import { useEffect } from 'react';

export const useInactivityTimerEffect = ({
  isQuittingRef,
  inactivityTimeoutId,
  quizRunId,
  currentQuestion,
  isTimerPaused,
  showResult,
  isAwaitingInactivityResponse,
  isPretest,
  pretestInactivityTimeoutMs,
  inactivityTimeoutMs,
  pretestQuestionCount,
  maxQuestions,
  setQuizProgress,
  setIsAwaitingInactivityResponse,
  onPlayInactivityClick,
  onRegisterQuizDisruption,
  handleInactivityApi,
  childPin,
  setCurrentQuizStreak,
  setTransientStreakMessage,
  setPausedTime,
  setInterventionQuestion,
  setShowLearningModule,
  isGameMode,
  setIsGameModePractice,
  setGameModeInterventionIndex,
  currentQuestionIndex,
  gameModeType,
  setRocketPracticeFact,
  setRocketPracticeReverse,
  setPendingSurfPractice,
  setPendingRocketPractice,
  navigate,
  setQuizStartTime,
  setSessionCorrectCount,
  stopPretestTimer,
  pretestTimeLimitMs,
  selectedTable,
  selectedOperation,
  setPretestResult,
  setIsGameMode,
  setIsTimerPaused,
  getRecoveryRoute,
  logClientError,
  showUiMessage,
}) => {
  useEffect(() => {
    if (isQuittingRef.current) {
      if (inactivityTimeoutId.current) {
        clearTimeout(inactivityTimeoutId.current);
        inactivityTimeoutId.current = null;
      }
      return;
    }

    const isActiveScreen =
      !!quizRunId &&
      !!currentQuestion &&
      !isTimerPaused &&
      !showResult &&
      !isAwaitingInactivityResponse;

    if (!isActiveScreen) {
      if (inactivityTimeoutId.current) {
        clearTimeout(inactivityTimeoutId.current);
        inactivityTimeoutId.current = null;
      }
      return;
    }

    const effectiveInactivityTimeoutMs = isPretest
      ? pretestInactivityTimeoutMs
      : inactivityTimeoutMs;

    if (inactivityTimeoutId.current) clearTimeout(inactivityTimeoutId.current);

    inactivityTimeoutId.current = setTimeout(async () => {
      if (isQuittingRef.current) return;
      onPlayInactivityClick?.();

      if (inactivityTimeoutId.current) {
        clearTimeout(inactivityTimeoutId.current);
        inactivityTimeoutId.current = null;
      }

      const totalForProgress = isPretest ? pretestQuestionCount || 20 : maxQuestions;
      if (totalForProgress > 0) {
        const step = 100 / totalForProgress;
        setQuizProgress((prev) => Math.min(prev + step, 100));
      }

      onRegisterQuizDisruption?.();
      setIsAwaitingInactivityResponse(true);

      try {
        const out = await handleInactivityApi(quizRunId, childPin);

        if (isQuittingRef.current) {
          setIsAwaitingInactivityResponse(false);
          return;
        }

        setCurrentQuizStreak(0);
        setTransientStreakMessage(null);

        if (out?.practice) {
          setIsTimerPaused(true);
          setPausedTime(Date.now());
          setInterventionQuestion(out.practice);
          setShowLearningModule(true);

          if (isGameMode) {
            setIsGameModePractice(true);
            setGameModeInterventionIndex(currentQuestionIndex);
          }

          setIsAwaitingInactivityResponse(false);
          if (isGameMode && gameModeType === 'surf') {
            setRocketPracticeFact(null);
            setRocketPracticeReverse(null);
            setPendingSurfPractice(false);
            navigate('/learning', { replace: true });
            return;
          }
          if (isGameMode && gameModeType === 'rocket') {
            setRocketPracticeFact(null);
            setRocketPracticeReverse(null);
            setPendingRocketPractice(false);
            navigate('/learning', { replace: true });
            return;
          }
          setRocketPracticeFact(null);
          setRocketPracticeReverse(null);
          navigate('/learning');
          return;
        }

        if (out?.completed && !isGameMode) {
          setQuizStartTime(null);

          setSessionCorrectCount(out.sessionCorrectCount || 0);
          localStorage.setItem(
            'math-last-quiz-duration',
            Math.round((out.summary?.totalActiveMs || 0) / 1000)
          );
          setIsTimerPaused(true);

          setIsAwaitingInactivityResponse(false);

          if (isPretest) {
            stopPretestTimer();
            const resultPayload = {
              passed: out.passed === true,
              failReason: out.failReason || 'time',
              summary: out.summary || null,
              totalTimeMs: out.totalTimeMs ?? out.summary?.totalActiveMs ?? 0,
              timeLimitMs: out.timeLimitMs ?? out.pretestTimeLimitMs ?? pretestTimeLimitMs,
              level: selectedTable,
              operation: selectedOperation,
              levelAwarded: out.levelAwarded,
              pretestSkipped: out.pretestSkipped,
            };
            setPretestResult(resultPayload);
            navigate('/pretest-result', { replace: true, state: { pretestResult: resultPayload } });
            return;
          }

          navigate('/way-to-go');
          return;
        }

        if (out?.completed && isGameMode) {
          setIsAwaitingInactivityResponse(false);
          setIsGameMode(false);
          if (gameModeType === 'rocket') {
            navigate('/game-mode-exit', { replace: true });
            return;
          }
          navigate('/game-mode-exit', { replace: true });
          return;
        }

        setIsAwaitingInactivityResponse(false);
      } catch (e) {
        const fallbackRoute = getRecoveryRoute();
        logClientError('Inactivity API failed', e, { quizRunId, isGameMode, isPretest });
        setIsTimerPaused(true);
        setPausedTime(Date.now());
        setIsAwaitingInactivityResponse(false);
        showUiMessage({
          type: 'error',
          title: 'Something went wrong',
          message: 'Please try again.',
        });
        navigate(fallbackRoute, { replace: true });
      }
    }, effectiveInactivityTimeoutMs);

    return () => {
      if (inactivityTimeoutId.current) {
        clearTimeout(inactivityTimeoutId.current);
        inactivityTimeoutId.current = null;
      }
    };
  }, [
    currentQuestion,
    isTimerPaused,
    showResult,
    isAwaitingInactivityResponse,
    quizRunId,
    childPin,
    navigate,
    isGameMode,
    gameModeType,
    currentQuestionIndex,
    maxQuestions,
    pretestQuestionCount,
    inactivityTimeoutMs,
    pretestInactivityTimeoutMs,
    isPretest,
    stopPretestTimer,
    pretestTimeLimitMs,
    selectedOperation,
    selectedTable,
    getRecoveryRoute,
    logClientError,
    showUiMessage,
    isQuittingRef,
    inactivityTimeoutId,
    setQuizProgress,
    setIsAwaitingInactivityResponse,
    onPlayInactivityClick,
    onRegisterQuizDisruption,
    handleInactivityApi,
    setCurrentQuizStreak,
    setTransientStreakMessage,
    setPausedTime,
    setInterventionQuestion,
    setShowLearningModule,
    setIsGameModePractice,
    setGameModeInterventionIndex,
    setRocketPracticeFact,
    setRocketPracticeReverse,
    setPendingSurfPractice,
    setPendingRocketPractice,
    setQuizStartTime,
    setSessionCorrectCount,
    setPretestResult,
    setIsGameMode,
    setIsTimerPaused,
  ]);
};
