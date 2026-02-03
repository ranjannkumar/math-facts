// src/hooks/useMathGame.jsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import audioManager from '../utils/audioUtils.js';
import { themeConfigs } from '../utils/mathGameLogic.js';

// Import API functions
import {
  authLogin,
  mapQuestionToFrontend,
  quizHandleInactivity,
  quizPracticeAnswer,
  quizPrepare,
  quizStart,
  quizSubmitAnswer,
  userGetProgress,
  userResetProgress,
  userUpdateTheme,
} from '../api/mathApi.js';

// Auto-import all game mode videos and thumbnails from public/game-videos
const videoModules = import.meta.glob('/public/game-videos/*.mp4', { as: 'url' });
const thumbJpgModules = import.meta.glob('/public/game-videos/*.jpg', { as: 'url' });
const thumbPngModules = import.meta.glob('/public/game-videos/*.png', { as: 'url' });
const surfVideoModules = import.meta.glob('/public/surf-videos/*.mp4', { as: 'url' });
const surfThumbJpgModules = import.meta.glob('/public/surf-videos/*.jpg', { as: 'url' });
const surfThumbPngModules = import.meta.glob('/public/surf-videos/*.png', { as: 'url' });

// Default config values used before backend config is loaded.
const DEFAULT_INACTIVITY_TIMEOUT_MS = 5000;
const DEFAULT_LIGHTNING_TARGET = 100;
const DEFAULT_LIGHTNING_FAST_MS = 2000;
const DEFAULT_PRETEST_QUESTION_COUNT = 20;
const DEFAULT_PRETEST_TIME_LIMIT_MS = 50000;
const INACTIVITY_TIMEOUT_STORAGE_KEY = 'math-inactivity-ms';
const LIGHTNING_TARGET_STORAGE_KEY = 'math-lightning-target';
const LIGHTNING_FAST_MS_STORAGE_KEY = 'math-lightning-fast-ms';

const readStoredNumber = (key, fallback) => {
  const stored = Number.parseInt(localStorage.getItem(key), 10);
  return Number.isFinite(stored) ? stored : fallback;
};

const useMathGame = () => {
  const navigate = useNavigate();

  // ---------- global nav/state ----------
  const [selectedTable, setSelectedTable] = useState(null); // level (1..6)
  const [selectedDifficulty, setSelectedDifficulty] = useState(null); // belt or black-x
  const [quizRunId, setQuizRunId] = useState(null); // Backend quiz run ID
  const [playFactVideoAfterStreak, setPlayFactVideoAfterStreak] = useState(false);
  const [hideStatsUI, setHideStatsUI] = useState(false);

  // Learning module/Practice state
  const [showLearningModule, setShowLearningModule] = useState(false);
  const [learningModuleContent, setLearningModuleContent] = useState('');
  const [pendingDifficulty, setPendingDifficulty] = useState(null);
  const [interventionQuestion, setInterventionQuestion] = useState(null); // Question object for intervention
  const [preQuizPracticeItems, setPreQuizPracticeItems] = useState([]); // Questions array from /prepare

  // Quiz/result UI
  const [isAnimating, setIsAnimating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [quizProgress, setQuizProgress] = useState(0);
  const [correctCount, setCorrectCount] = useState(0); // Daily total score
  const [sessionCorrectCount, setSessionCorrectCount] = useState(0); // Session Score
  const [grandTotalCorrect, setGrandTotalCorrect] = useState(0); // New Grand Total Score
  const [wrongCount, setWrongCount] = useState(0);
  const [questionTimes, setQuestionTimes] = useState([]);
  const [answerSymbols, setAnswerSymbols] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null); // Full question object
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [maxQuestions, setMaxQuestions] = useState(10);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [lightningTargetCorrect, setLightningTargetCorrect] = useState(() =>
    readStoredNumber(LIGHTNING_TARGET_STORAGE_KEY, DEFAULT_LIGHTNING_TARGET)
  );
  const [lightningFastThresholdMs, setLightningFastThresholdMs] = useState(() =>
    readStoredNumber(LIGHTNING_FAST_MS_STORAGE_KEY, DEFAULT_LIGHTNING_FAST_MS)
  );
  const [inactivityTimeoutMs, setInactivityTimeoutMs] = useState(() => {
    return readStoredNumber(INACTIVITY_TIMEOUT_STORAGE_KEY, DEFAULT_INACTIVITY_TIMEOUT_MS);
  });

  // --- GAME MODE STATE ---
  const [isGameMode, setIsGameMode] = useState(false);
  const [gameModeType, setGameModeType] = useState(null); // 'lightning' | 'surf'
  const [lightningCount, setLightningCount] = useState(0);
  const [lightningCycleStart, setLightningCycleStart] = useState(0);
  const [showWayToGoAfterFailure, setShowWayToGoAfterFailure] = useState(false);
  const [gameModeLevel, setGameModeLevel] = useState(1);
  const [shouldExitAfterVideo, setShouldExitAfterVideo] = useState(false);
  const [pendingSurfPractice, setPendingSurfPractice] = useState(false);
  const [surfResumeAfterVideo, setSurfResumeAfterVideo] = useState(false);
  const [videoOptions, setVideoOptions] = useState(null); // { option1, option2 }
  const [videoList, setVideoList] = useState([]);
  const [surfVideoList, setSurfVideoList] = useState([]);
  const [lastAnswerMeta, setLastAnswerMeta] = useState(null);
  const [shouldGoToLightningCompleteAfterVideo, setShouldGoToLightningCompleteAfterVideo] = useState(false);

// { isCorrect, isFast }

  // Surf mode progress (backend-driven)
  const [surfQuizNumber, setSurfQuizNumber] = useState(1);
  const [surfCorrectStreak, setSurfCorrectStreak] = useState(0);
  const [completedSurfQuizzes, setCompletedSurfQuizzes] = useState(0);
  const [surfQuizzesRequired, setSurfQuizzesRequired] = useState(5);
  const [questionsPerQuiz, setQuestionsPerQuiz] = useState(4);


  // { symbol: '⚡' | '✓' | '✗', isCorrect: boolean }
  const [currentAnswerSymbol, setCurrentAnswerSymbol] = useState(null);

  // These are kept for minimal UI breakage. We now let backend decide "practice" needs.
  const [isGameModePractice, setIsGameModePractice] = useState(false);
  const [gameModeInterventionIndex, setGameModeInterventionIndex] = useState(null);

  // --- STREAK STATE ---
  const [currentQuizStreak, setCurrentQuizStreak] = useState(0);
  const [transientStreakMessage, setTransientStreakMessage] = useState(null);
  const [streakPosition, setStreakPosition] = useState(0);

  // Timers
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [dailyTotalMs, setDailyTotalMs] = useState(0);
  const [totalTimeToday, setTotalTimeToday] = useState(0);
  const [pausedTime, setPausedTime] = useState(0);
  const [isTimerPaused, setIsTimerPaused] = useState(false);

  const updateDailyTotalMs = useCallback((nextMs, { force = false } = {}) => {
    if (!Number.isFinite(nextMs)) return;
    setDailyTotalMs((prev) => (force ? nextMs : Math.max(prev, nextMs)));
  }, []);

  const applyDailyStatsTotalMs = useCallback(
    (totalActiveMs, { force = false, skipSessionAdjust = false } = {}) => {
      if (!Number.isFinite(totalActiveMs)) return;
      let nextBase = totalActiveMs;
      if (!skipSessionAdjust && quizStartTime && !isTimerPaused) {
        const sessionElapsedMs = Date.now() - quizStartTime;
        nextBase = Math.max(0, totalActiveMs - sessionElapsedMs);
      }
      updateDailyTotalMs(nextBase, { force });
    },
    [quizStartTime, isTimerPaused, updateDailyTotalMs]
  );

  // Identity and Progress
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [userThemeKey, setUserThemeKey] = useState(null);
  const [childName, setChildName] = useState(() => localStorage.getItem('math-child-name') || '');
  const [childAge, setChildAge] = useState(() => localStorage.getItem('math-child-age') || '');
  const [childPin, setChildPin] = useState(() => localStorage.getItem('math-child-pin') || '');
  const [tableProgress, setTableProgress] = useState({});

  const [currentStreak, setCurrentStreak] = useState(0);
  const [showDailyStreakAnimation, setShowDailyStreakAnimation] = useState(false);
  const [streakCountToDisplay, setStreakCountToDisplay] = useState(0);

  const [tempNextRoute, setTempNextRoute] = useState(null);

  // Misc UI
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // LOGIN & SIBLING CHECK STATE
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [showSiblingCheck, setShowSiblingCheck] = useState(false);
  const [loginPendingName, setLoginPendingName] = useState(null);
  const [loginPendingResponse, setLoginPendingResponse] = useState(null);

  const [isQuizStarting, setIsQuizStarting] = useState(false);
  const [isAwaitingInactivityResponse, setIsAwaitingInactivityResponse] = useState(false);

  const [isInitialPrepLoading, setIsInitialPrepLoading] = useState(false);

  // --- PRE-TEST STATE (unchanged) ---
  const [preTestSection, setPreTestSection] = useState('addition');
  const [preTestQuestions, setPreTestQuestions] = useState([]);
  const [preTestCurrentQuestion, setPreTestCurrentQuestion] = useState(0);
  const [preTestScore, setPreTestScore] = useState(0);
  const [preTestTimerActive, setPreTestTimerActive] = useState(false);
  const [preTestTimer, setPreTestTimer] = useState(0);
  const [preTestResults, setPreTestResults] = useState(null);
  const [completedSections, setCompletedSections] = useState({});
  const [showPreTestPopup, setShowPreTestPopup] = useState(false);

  // --- PRETEST STATE (backend-driven) ---
  const [isPretest, setIsPretest] = useState(false);
  const [pretestQuestionCount, setPretestQuestionCount] = useState(DEFAULT_PRETEST_QUESTION_COUNT);
  const [pretestTimeLimitMs, setPretestTimeLimitMs] = useState(DEFAULT_PRETEST_TIME_LIMIT_MS);
  const [pretestRemainingMs, setPretestRemainingMs] = useState(null);
  const [pretestResult, setPretestResult] = useState(null);
  const [selectedOperation, setSelectedOperation] = useState('add');
  const [pretestTimerRunning, setPretestTimerRunning] = useState(false);
  const [isPretestIntroVisible, setIsPretestIntroVisible] = useState(false);

  const [showSpeedTest] = useState(false);
  const [speedTestPopupVisible] = useState(false);
  const [speedTestPopupAnimation] = useState('animate-pop-in');
  const [speedTestNumbers] = useState([]);
  const [currentSpeedTestIndex] = useState(-1);
  const [speedTestStartTime] = useState(null);
  const [speedTestTimes] = useState([]);
  const [speedTestComplete] = useState(false);
  const [speedTestStarted] = useState(false);
  const [speedTestCorrectCount] = useState(0);
  const [speedTestShowTick] = useState(false);
  const [studentReactionSpeed] = useState(1.0);
  const [lastQuestion, setLastQuestion] = useState('');

  // Internal state for timer/network
  const questionStartTimestamp = useRef(null);
  const pretestTimerStartRef = useRef(null);
  const pretestTimerInitialRef = useRef(null);
  const inactivityTimeoutId = useRef(null);
  const isQuittingRef = useRef(false);

  // --- CLIENT-SIDE HELPERS ---
  const determineMaxQuestions = useCallback((difficulty) => {
    if (difficulty && difficulty.startsWith('black')) return 20;
    return 10;
  }, []);

  const symbolTimeoutRef = useRef(null);

const showAnswerSymbolFor300ms = useCallback((payload) => {
  // clear any previous timeout (prevents overlap)
  if (symbolTimeoutRef.current) {
    clearTimeout(symbolTimeoutRef.current);
  }

  setCurrentAnswerSymbol(payload);

  symbolTimeoutRef.current = setTimeout(() => {
    setCurrentAnswerSymbol(null);
    symbolTimeoutRef.current = null;
  }, 500);
}, []);

  const applySurfState = useCallback((payload) => {
    if (!payload) return;
    if (typeof payload.surfQuizNumber === 'number') setSurfQuizNumber(payload.surfQuizNumber);
    if (typeof payload.surfCorrectStreak === 'number') setSurfCorrectStreak(payload.surfCorrectStreak);
    if (typeof payload.completedSurfQuizzes === 'number') setCompletedSurfQuizzes(payload.completedSurfQuizzes);
    if (typeof payload.surfQuizzesRequired === 'number') setSurfQuizzesRequired(payload.surfQuizzesRequired);
    if (typeof payload.questionsPerQuiz === 'number') setQuestionsPerQuiz(payload.questionsPerQuiz);
  }, []);

  const applyLightningTarget = useCallback((payload) => {
    if (!payload) return;
    const nextTarget =
      typeof payload.lightningTargetCorrect === 'number'
        ? payload.lightningTargetCorrect
        : typeof payload.targetCorrect === 'number'
          ? payload.targetCorrect
          : typeof payload.lightningMode?.targetCorrect === 'number'
            ? payload.lightningMode.targetCorrect
            : typeof payload.gameMode?.targetCorrect === 'number'
              ? payload.gameMode.targetCorrect
              : null;

    if (typeof nextTarget === 'number') {
      setLightningTargetCorrect(nextTarget);
    }
  }, []);

  const syncConfigFromStorage = useCallback(() => {
    setLightningTargetCorrect(
      readStoredNumber(LIGHTNING_TARGET_STORAGE_KEY, DEFAULT_LIGHTNING_TARGET)
    );
    setLightningFastThresholdMs(
      readStoredNumber(LIGHTNING_FAST_MS_STORAGE_KEY, DEFAULT_LIGHTNING_FAST_MS)
    );
    setInactivityTimeoutMs(
      readStoredNumber(INACTIVITY_TIMEOUT_STORAGE_KEY, DEFAULT_INACTIVITY_TIMEOUT_MS)
    );
  }, []);

  const stopPretestTimer = useCallback(() => {
    pretestTimerStartRef.current = null;
    pretestTimerInitialRef.current = null;
    setPretestTimerRunning(false);
    setPretestRemainingMs(null);
  }, []);

  const startPretestTimer = useCallback((limitMs, remainingMs) => {
    const safeLimit = Number.isFinite(limitMs) ? limitMs : DEFAULT_PRETEST_TIME_LIMIT_MS;
    const safeRemaining = Number.isFinite(remainingMs) ? remainingMs : safeLimit;

    pretestTimerInitialRef.current = safeRemaining;
    pretestTimerStartRef.current = Date.now();
    setPretestTimeLimitMs(safeLimit);
    setPretestRemainingMs(safeRemaining);
    setPretestTimerRunning(true);
  }, []);


  const hardResetQuizState = useCallback(() => {
    if (inactivityTimeoutId.current) {
      clearTimeout(inactivityTimeoutId.current);
      inactivityTimeoutId.current = null;
    }

    stopPretestTimer();
    setIsPretest(false);
    setIsPretestIntroVisible(false);

    setQuizQuestions([]);
    setQuizRunId(null);
    setPreQuizPracticeItems([]);
    setQuizProgress(0);
    setAnswerSymbols([]);
    setSessionCorrectCount(0);
    setWrongCount(0);
    setQuestionTimes([]);
    setCurrentQuestion(null);
    setCurrentQuestionIndex(0);
    setLastQuestion('');
    setQuizStartTime(null);
    setElapsedTime(0);
    setPausedTime(0);
    setIsTimerPaused(false);
    setShowResult(false);
    setIsAnimating(false);
    setInterventionQuestion(null);

    setCurrentQuizStreak(0);
    setStreakPosition(0);

    setIsLoginLoading(false);
    setShowSiblingCheck(false);
    setLoginPendingName(null);
    setLoginPendingResponse(null);
    setTransientStreakMessage(null);

    // Reset Game Mode state
    setIsGameMode(false);
    setGameModeType(null);
    setLightningCount(0);
    setLightningCycleStart(0);
    setCurrentAnswerSymbol(null);
    setIsGameModePractice(false);
    setGameModeInterventionIndex(null);
    setSurfQuizNumber(1);
    setSurfCorrectStreak(0);
    setCompletedSurfQuizzes(0);
    setSurfQuizzesRequired(5);
    setQuestionsPerQuiz(4);

    setVideoOptions(null);
    setShouldExitAfterVideo(false);
    setPendingSurfPractice(false);
    setSurfResumeAfterVideo(false);
    setGameModeLevel(1);
  }, []);

  // Ensure totalTimeToday reflects the daily base time when no quiz is running.
  useEffect(() => {
    if (!quizStartTime) {
      setTotalTimeToday(Math.floor(dailyTotalMs / 1000));
    }
  }, [quizStartTime, dailyTotalMs]);

  // Calculate Streak Position whenever quizProgress changes
  useEffect(() => {
    setStreakPosition(quizProgress);
  }, [quizProgress]);

  // --- FINAL step of login (unchanged) ---
  const processLoginFinal = useCallback(
    (loginResponse) => {
      setChildName(loginResponse.user.name);

      const themeKeyFromBackend = loginResponse.user.theme || null;
      setUserThemeKey(themeKeyFromBackend);

      if (themeKeyFromBackend && themeKeyFromBackend.length > 0) {
        const config = themeConfigs[themeKeyFromBackend];
        if (config) setSelectedTheme({ key: themeKeyFromBackend, ...config });
      } else {
        setSelectedTheme(null);
      }

      const progressResponse = loginResponse.user.progress || {};
      const stats = loginResponse.user.dailyStats || {};

      setTableProgress(progressResponse);
      applyDailyStatsTotalMs(stats?.totalActiveMs || 0, { force: true });
      setCorrectCount(stats?.correctCount || 0);
      setGrandTotalCorrect(stats?.grandTotal || 0);

      const newStreak = loginResponse.user.currentStreak || 0;
      setCurrentStreak(newStreak);

      if (newStreak > 0) {
        setStreakCountToDisplay(newStreak);
        setShowDailyStreakAnimation(true);
      }

      if (themeKeyFromBackend && themeKeyFromBackend.length > 0 && themeKeyFromBackend !== 'null') {
        navigate('/levels');
      } else {
        navigate('/theme');
      }
    },
    [navigate, applyDailyStatsTotalMs]
  );

  const handleDailyStreakNext = useCallback(() => {
    setShowDailyStreakAnimation(false);
  }, []);

  const handleSiblingCheck = useCallback(
    async (isConfirmed) => {
      setShowSiblingCheck(false);

      if (isConfirmed && loginPendingResponse) {
        processLoginFinal(loginPendingResponse);
      } else {
        localStorage.removeItem('math-child-pin');
        setChildPin('');
        setChildName('');
        navigate('/');
      }
      setLoginPendingName(null);
      setLoginPendingResponse(null);
    },
    [navigate, processLoginFinal, loginPendingResponse]
  );

  // Load videos/thumbs (lightning + surf)
  useEffect(() => {
    const loadVideoSet = async (modules, jpgModules, pngModules) => {
      const videoEntries = Object.entries(modules);
      if (videoEntries.length === 0) return [];

      const videoUrls = await Promise.all(videoEntries.map(([_, loader]) => loader()));

      const jpgEntries = Object.entries(jpgModules);
      const jpgUrls = await Promise.all(jpgEntries.map(([_, loader]) => loader()));
      const jpgMap = new Map();
      jpgEntries.forEach(([path], idx) => {
        const base = path.split('/').pop().replace('.jpg', '');
        jpgMap.set(base, jpgUrls[idx]);
      });

      const pngEntries = Object.entries(pngModules);
      const pngUrls = await Promise.all(pngEntries.map(([_, loader]) => loader()));
      const pngMap = new Map();
      pngEntries.forEach(([path], idx) => {
        const base = path.split('/').pop().replace('.png', '');
        pngMap.set(base, pngUrls[idx]);
      });

      return videoEntries.map(([path], idx) => {
        const name = path.split('/').pop().replace('.mp4', '');
        const url = videoUrls[idx];
        const thumbUrl = jpgMap.get(name) || pngMap.get(name) || null;
        return { name, url, thumbnailUrl: thumbUrl };
      });
    };

    const loadVideosAndThumbs = async () => {
      const [lightningVideos, surfVideos] = await Promise.all([
        loadVideoSet(videoModules, thumbJpgModules, thumbPngModules),
        loadVideoSet(surfVideoModules, surfThumbJpgModules, surfThumbPngModules),
      ]);

      setVideoList(lightningVideos);
      setSurfVideoList(surfVideos);

      console.log('[GameMode] Detected lightning videos:', lightningVideos);
      console.log('[GameMode] Detected surf videos:', surfVideos);
    };

    loadVideosAndThumbs();
  }, []);

  const generateRandomVideoOptions = (list = videoList) => {
    if (!list || list.length === 0) return null;
    if (list.length === 1) {
      return { option1: list[0], option2: list[0] };
    }
    const shuffled = [...list].sort(() => Math.random() - 0.5);
    return { option1: shuffled[0], option2: shuffled[1] };
  };

  const handleVideoSelection = useCallback(
    (videoObject) => {
      navigate(`/game-mode-video-play/${videoObject.name}`, {
        replace: true,
        state: { videoUrl: videoObject.url },
      });
    },
    [navigate]
  );

  // ---------------- LOGIN ----------------
  const handlePinSubmit = useCallback(
    async (pinValue, nameValue) => {
      const oldPin = localStorage.getItem('math-child-pin');
      localStorage.setItem('math-child-pin', pinValue);
      setChildPin(pinValue);

      try {
        setIsLoginLoading(true);

        const loginResponse = await authLogin(pinValue, nameValue.trim());

        setLoginPendingName(loginResponse.user.name);
        setLoginPendingResponse(loginResponse);
        setShowSiblingCheck(true);
        setIsLoginLoading(false);

        setChildName(loginResponse.user.name);

        const themeKeyFromBackend = loginResponse.user.theme || null;
        setUserThemeKey(themeKeyFromBackend);

        if (themeKeyFromBackend && themeKeyFromBackend.length > 0) {
          const config = themeConfigs[themeKeyFromBackend];
          if (config) setSelectedTheme({ key: themeKeyFromBackend, ...config });
        } else {
          setSelectedTheme(null);
        }

        const progressResponse = loginResponse.user.progress || {};
        const stats = loginResponse.user.dailyStats || {};

        setTableProgress(progressResponse);
        applyDailyStatsTotalMs(stats?.totalActiveMs || 0, { force: true });
        setCorrectCount(stats?.correctCount || 0);
        setGrandTotalCorrect(stats?.grandTotal || 0);
        setCurrentStreak(loginResponse.user.currentStreak || 0);

        if (themeKeyFromBackend && themeKeyFromBackend.length > 0 && themeKeyFromBackend !== 'null') {
          navigate('/levels');
        } else {
          navigate('/theme');
        }
      } catch (e) {
        setIsLoginLoading(false);
        localStorage.removeItem('math-child-pin');
        setChildPin('');
        setChildName('');
        throw new Error(e.message || 'Login failed.');
      }
    },
    [navigate, applyDailyStatsTotalMs]
  );

  const handleDemoLogin = useCallback(() => {
    const demoPin = '77777';
    const demoName = 'Demo';
    handlePinSubmit(demoPin, demoName).catch((err) => {
      console.error('Demo Login failed:', err.message);
      alert('Demo Login failed: ' + err.message);
    });
  }, [handlePinSubmit]);

  // Persist theme
  const updateThemeAndNavigate = useCallback(
    async (themeObject) => {
      const themeKey = themeObject?.key;
      if (!themeKey) return;

      try {
        await userUpdateTheme(themeKey, childPin);
        setUserThemeKey(themeKey);
        setSelectedTheme(themeObject);
        navigate('/levels');
      } catch (e) {
        console.error('Failed to save theme:', e.message);
        setSelectedTheme(themeObject);
        navigate('/levels');
      }
    },
    [childPin, navigate]
  );

  // ---------------- NORMAL QUIZ START ----------------
  const startActualQuiz = useCallback(
    async (runId) => {
      const idToUse = runId || quizRunId;
      if (!idToUse) {
        console.error('Cannot start quiz: quizRunId is missing.');
        setIsQuizStarting(false);
        navigate('/belts');
        return;
      }

      try {
        const { questions: backendQuestions, resumed = false, currentIndex, mainFlowCorrect, wrong } =
          await quizStart(idToUse, childPin);

        if (!backendQuestions || backendQuestions.length === 0) {
          throw new Error('No questions returned from quiz start.');
        }

        const mappedQuestions = backendQuestions.map(mapQuestionToFrontend);
        setQuizQuestions(mappedQuestions);

        let startIndex = 0;

        if (resumed && typeof currentIndex === 'number') {
          startIndex = Math.min(Math.max(currentIndex, 0), mappedQuestions.length - 1);

          const safeCorrect = typeof mainFlowCorrect === 'number' ? mainFlowCorrect : 0;
          const safeWrong = typeof wrong === 'number' ? wrong : 0;

          setSessionCorrectCount(safeCorrect);
          setWrongCount(safeWrong);

          const answeredSoFar = safeCorrect + safeWrong;

          const totalForProgress =
            maxQuestions || mappedQuestions.length || determineMaxQuestions(selectedDifficulty);

          if (totalForProgress > 0) {
            const restoredProgress = Math.min((answeredSoFar / totalForProgress) * 100, 100);
            setQuizProgress(restoredProgress);
          }
        }

        setCurrentQuestionIndex(startIndex);
        setCurrentQuestion(mappedQuestions[startIndex]);

        const now = Date.now();
        setQuizStartTime(now);
        questionStartTimestamp.current = now;
        setIsTimerPaused(false);
        setElapsedTime(0);
        setPausedTime(0);

        setIsQuizStarting(false);
        navigate('/quiz');
      } catch (e) {
        console.error('Quiz Start failed:', e.message);
        alert('Failed to start quiz: ' + e.message);
        setIsQuizStarting(false);
        navigate('/belts');
      }
    },
    [navigate, childPin, quizRunId, maxQuestions, selectedDifficulty, determineMaxQuestions]
  );

  /**
    Backend-driven Game Mode starter/resumer
   * - If backend has an active Game Mode run, /quiz/prepare returns it.
   * - Then /quiz/start returns questions + currentIndex to resume.
   * - We set lightningCount from backend totalCorrect.
   */
  const startOrResumeGameModeRun = useCallback(
    async ({
      level,
      beltOrDegree,
      operation = 'add',
      navigateToGameMode = false,
      navigateToIntro = false,
      gameModeType: requestedGameModeType = 'lightning',
    } = {}) => {
      syncConfigFromStorage();

      const reqLevel =
        level != null
          ? level
          : selectedTable != null
            ? selectedTable
            : (() => {
                const v = localStorage.getItem('game-mode-table');
                return v != null ? Number(v) : null;
              })();

      const reqBelt =
        beltOrDegree != null
          ? beltOrDegree
          : selectedDifficulty || localStorage.getItem('game-mode-belt') || null;

      if (!childPin || reqLevel == null || !reqBelt) {
        console.warn('[GameMode] Missing childPin/level/beltOrDegree – cannot start/resume.', {
          childPin,
          reqLevel,
          reqBelt,
        });
        return;
      }

      // Clear question UI before we load the backend state
      setQuizQuestions([]);
      setCurrentQuestion(null);
      setCurrentQuestionIndex(0);
      setQuizRunId(null);
      setCurrentQuizStreak(0);
      setStreakPosition(0);
      setAnswerSymbols([]);
      setTransientStreakMessage(null);
      setSurfResumeAfterVideo(false);

      // Enter game mode state
      setIsGameMode(true);
      setGameModeType(requestedGameModeType || 'lightning');
      setIsGameModePractice(false);
      setInterventionQuestion(null);
      setGameModeInterventionIndex(null);

      // Persist settings so resume works after reload
      localStorage.setItem('game-mode-belt', reqBelt);
      localStorage.setItem('game-mode-table', String(reqLevel));

      try {
        const targetCorrect = null;
        const prep = await quizPrepare(
          reqLevel,
          reqBelt,
          childPin,
          operation,
          true,
          targetCorrect,
          requestedGameModeType
        );

        setQuizRunId(prep.quizRunId);
        const totalCorrect = typeof prep.totalCorrect === 'number' ? prep.totalCorrect : 0;
        setLightningCount(totalCorrect);
        setLightningCycleStart(Math.floor(totalCorrect / 5) * 5);
        if (prep?.gameModeType) setGameModeType(prep.gameModeType);
        applyLightningTarget(prep);
        applySurfState(prep);

        const started = await quizStart(prep.quizRunId, childPin);

        const backendQuestions = started?.questions || started?.run?.questions || [];
        if (!backendQuestions || backendQuestions.length === 0) {
          throw new Error('No questions returned from quizStart for Game Mode.');
        }

        const mapped = backendQuestions.map(mapQuestionToFrontend);
        if (started?.gameModeType) setGameModeType(started.gameModeType);
        applyLightningTarget(started);
        applySurfState(started);

        const startIndex =
          typeof started?.currentIndex === 'number'
            ? started.currentIndex
            : typeof started?.run?.currentIndex === 'number'
              ? started.run.currentIndex
              : 0;

        const safeIndex = Math.min(Math.max(startIndex, 0), mapped.length - 1);

        setQuizQuestions(mapped);
        setCurrentQuestionIndex(safeIndex);
        setCurrentQuestion(mapped[safeIndex]);
        questionStartTimestamp.current = Date.now();

        if (navigateToIntro) {
          navigate('/game-mode-intro', { replace: true });
        } else if (navigateToGameMode) {
          // Requirement: user should directly start where they left off
          navigate('/game-mode', { replace: true });
        }
      } catch (e) {
        console.error('[GameMode] Failed to start/resume:', e);
      }
    },
    [
      childPin,
      selectedTable,
      selectedDifficulty,
      navigate,
      applySurfState,
      applyLightningTarget,
      syncConfigFromStorage,
    ]
  );

  const startSurfNextQuiz = useCallback(
    async ({ navigateToGameMode = true } = {}) => {
      if (!quizRunId || !childPin) return;

      try {
        const started = await quizStart(quizRunId, childPin);
        const backendQuestions = started?.questions || started?.run?.questions || [];

        if (!backendQuestions || backendQuestions.length === 0) {
          throw new Error('No questions returned from quizStart for Surf Mode.');
        }

        const mapped = backendQuestions.map(mapQuestionToFrontend);
        if (started?.gameModeType) setGameModeType(started.gameModeType);
        applySurfState(started);

        setQuizQuestions(mapped);
        setCurrentQuestionIndex(0);
        setCurrentQuestion(mapped[0]);
        questionStartTimestamp.current = Date.now();

        if (navigateToGameMode) navigate('/game-mode', { replace: true });
      } catch (e) {
        console.error('[SurfMode] Failed to start next quiz:', e);
      }
    },
    [quizRunId, childPin, navigate, applySurfState]
  );

  const startPretestRun = useCallback(
    async ({ prep, level, operation } = {}) => {
      const runId = prep?.quizRunId;
      if (!runId || !childPin) {
        console.error('Cannot start pretest: missing quizRunId or childPin.');
        setIsInitialPrepLoading(false);
        navigate('/levels');
        return;
      }

      setIsPretest(true);
      setPretestResult(null);
      setIsPretestIntroVisible(true);
      setSelectedOperation(operation || selectedOperation);
      if (level != null) setSelectedTable(level);
      setSelectedDifficulty('pretest');
      setIsGameMode(false);
      setGameModeType(null);
      setQuizRunId(runId);
      setIsInitialPrepLoading(false);

      const countFromPrep =
        typeof prep?.pretestQuestionCount === 'number'
          ? prep.pretestQuestionCount
          : DEFAULT_PRETEST_QUESTION_COUNT;
      setPretestQuestionCount(countFromPrep);
      setMaxQuestions(countFromPrep);

      try {
        navigate('/pretest-intro', { replace: true });
        const started = await quizStart(runId, childPin);
        const backendQuestions = started?.questions || started?.run?.questions || [];
        if (!backendQuestions || backendQuestions.length === 0) {
          throw new Error('No questions returned from pretest start.');
        }

        const mapped = backendQuestions.map(mapQuestionToFrontend);
        const countFromStart =
          typeof started?.pretestQuestionCount === 'number' ? started.pretestQuestionCount : countFromPrep;
        setPretestQuestionCount(countFromStart);
        setMaxQuestions(countFromStart);
        setQuizQuestions(mapped);

        const resumedIndex =
          typeof started?.currentIndex === 'number'
            ? started.currentIndex
            : typeof prep?.currentIndex === 'number'
              ? prep.currentIndex
              : 0;

        let startIndex = 0;
        if ((started?.resumed || prep?.resumed) && typeof resumedIndex === 'number') {
          startIndex = Math.min(Math.max(resumedIndex, 0), mapped.length - 1);

          const safeCorrect =
            typeof prep?.mainFlowCorrect === 'number'
              ? prep.mainFlowCorrect
              : typeof started?.mainFlowCorrect === 'number'
                ? started.mainFlowCorrect
                : 0;
          const safeWrong =
            typeof prep?.wrong === 'number' ? prep.wrong : typeof started?.wrong === 'number' ? started.wrong : 0;

          setSessionCorrectCount(safeCorrect);
          setWrongCount(safeWrong);

          const answeredSoFar = safeCorrect + safeWrong;
          const totalForProgress = countFromStart || mapped.length;

          if (totalForProgress > 0) {
            const restoredProgress = Math.min((answeredSoFar / totalForProgress) * 100, 100);
            setQuizProgress(restoredProgress);
          }
        } else {
          setQuizProgress(0);
          setSessionCorrectCount(0);
          setWrongCount(0);
        }

        setCurrentQuestionIndex(startIndex);
        setCurrentQuestion(mapped[startIndex]);

        const now = Date.now();
        setQuizStartTime(now);
        questionStartTimestamp.current = now;
        setIsTimerPaused(false);
        setElapsedTime(0);
        setPausedTime(0);

        const limitFromStart =
          typeof started?.pretestTimeLimitMs === 'number'
            ? started.pretestTimeLimitMs
            : typeof prep?.pretestTimeLimitMs === 'number'
              ? prep.pretestTimeLimitMs
              : started?.timer?.limitMs;

        const remainingFromStart =
          typeof started?.timer?.remainingMs === 'number'
            ? started.timer.remainingMs
            : limitFromStart;

        startPretestTimer(limitFromStart, remainingFromStart);

        setIsInitialPrepLoading(false);
        setIsPretestIntroVisible(false);
        navigate('/pretest', { replace: true });
      } catch (e) {
        console.error('Pretest start failed:', e.message);
        setIsInitialPrepLoading(false);
        stopPretestTimer();
        setIsPretest(false);
        setIsPretestIntroVisible(false);
        alert('Failed to start pretest: ' + (e.message || 'Unknown error'));
        navigate('/levels');
      }
    },
    [
      childPin,
      navigate,
      selectedOperation,
      setSelectedTable,
      setSelectedOperation,
      startPretestTimer,
      stopPretestTimer,
    ]
  );

  const startLevelEntry = useCallback(
    async (level, { isBlackBeltUnlocked = false, operation = selectedOperation } = {}) => {
      if (!childPin || level == null) {
        console.warn('Missing childPin/level; cannot start level entry.');
        navigate('/');
        return;
      }

      syncConfigFromStorage();
      hardResetQuizState();
      setSelectedTable(level);
      setSelectedDifficulty(null);
      setPendingDifficulty(null);
      setSelectedOperation(operation);
      setIsInitialPrepLoading(true);

      try {
        const levelKey = `L${level}`;
        let progressSnapshot = tableProgress;

        try {
          const latestProgress = await userGetProgress(childPin);
          if (latestProgress && typeof latestProgress === 'object') {
            const normalizedProgress =
              latestProgress?.progress && typeof latestProgress.progress === 'object'
                ? latestProgress.progress
                : latestProgress;
            setTableProgress(normalizedProgress);
            progressSnapshot = normalizedProgress;
          }
        } catch (err) {
          console.warn('Could not refresh progress before pretest check:', err?.message || err);
        }

        const pretestStatus = progressSnapshot?.[levelKey]?.pretest?.[operation];
        const pretestAlreadyTaken = pretestStatus?.taken === true;
        const levelCompleted = !!progressSnapshot?.[levelKey]?.completed;

        if (pretestAlreadyTaken || levelCompleted) {
          setIsInitialPrepLoading(false);
          if (isBlackBeltUnlocked) {
            navigate('/black');
          } else {
            navigate('/belts');
          }
          return;
        }

        const prep = await quizPrepare(level, 'white', childPin, operation);

        if (prep?.pretestMode || prep?.gameModeType === 'pretest') {
          await startPretestRun({ prep, level, operation });
          return;
        }

        setIsInitialPrepLoading(false);
        if (isBlackBeltUnlocked) {
          navigate('/black');
        } else {
          navigate('/belts');
        }
      } catch (e) {
        console.error('Level entry prepare failed:', e.message);
        setIsInitialPrepLoading(false);
        alert('Failed to prepare level: ' + (e.message || 'Unknown error'));
        navigate('/levels');
      }
    },
    [
      childPin,
      navigate,
      hardResetQuizState,
      selectedOperation,
      setSelectedOperation,
      startPretestRun,
      syncConfigFromStorage,
      tableProgress,
      setTableProgress,
      userGetProgress,
    ]
  );

  /**
   * Prepare called from belt/black picker
   * if backend returns an active Game Mode run, jump straight into Game Mode resume
   */
  const startQuizWithDifficulty = useCallback(
    async (difficulty, table) => {
      syncConfigFromStorage();
      hardResetQuizState();
      setSelectedDifficulty(difficulty);
      setSelectedTable(table);
      setPendingDifficulty(difficulty);
      setMaxQuestions(determineMaxQuestions(difficulty));

      setIsInitialPrepLoading(true);
      if (String(difficulty).startsWith('black')) {
        setIsInitialPrepLoading(false);
      }

      try {
        const prep = await quizPrepare(table, difficulty, childPin, selectedOperation);

        if (prep?.pretestMode || prep?.gameModeType === 'pretest') {
          setIsInitialPrepLoading(false);
          alert('Pretest is required. Please start it from the Level screen.');
          navigate('/levels');
          return;
        }

        //  If backend says "gameMode", resume it immediately (no new quiz client-side)
        if (prep?.gameMode === true) {
          setIsInitialPrepLoading(false);
          // direct resume into game mode question screen
          await startOrResumeGameModeRun({
            level: table,
            beltOrDegree: difficulty,
            gameModeType: prep?.gameModeType || 'lightning',
            navigateToGameMode: true,
          });
          return;
        }

        const { quizRunId: newRunId, practice: practiceItems, resumed = false } = prep;

        setQuizRunId(newRunId);
        setPreQuizPracticeItems(practiceItems || []);

        const content = `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Belt Quiz at Level ${table}.`;
        setLearningModuleContent(content);

        setIsInitialPrepLoading(false);

        const isBlackBelt = String(difficulty).startsWith('black');

        if (!isBlackBelt && !resumed && practiceItems && practiceItems.length > 0) {
          setShowLearningModule(true);
          setIsQuizStarting(false);
          navigate('/learning');
        } else {
          setIsQuizStarting(true);
          startActualQuiz(newRunId);
        }
      } catch (e) {
        console.error('Quiz Prepare failed:', e.message);
        alert('Failed to prepare quiz: ' + e.message);
        setIsQuizStarting(false);
        navigate('/belts');
      }
    },
    [
      navigate,
      childPin,
      hardResetQuizState,
      determineMaxQuestions,
      startActualQuiz,
      startOrResumeGameModeRun,
      syncConfigFromStorage,
      selectedOperation,
    ]
  );

  // ---------------- ANSWER HANDLER ----------------
  const handleAnswer = useCallback(
    async (selectedAnswer) => {
      if (
        isAnimating ||
        showResult ||
        isTimerPaused ||
        !currentQuestion ||
        !quizRunId // blocks until backend run exists (both quiz and game mode)
      ) {
        return;
      }

      setIsAnimating(true);
      setTransientStreakMessage(null);

      const now = Date.now();
      const responseMs =
        questionStartTimestamp.current != null ? now - questionStartTimestamp.current : 0;

      if (inactivityTimeoutId.current) {
        clearTimeout(inactivityTimeoutId.current);
        inactivityTimeoutId.current = null;
      }

      const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
      const questionId = currentQuestion.id;

      // ------------ GAME MODE BRANCH (BACKEND-DRIVEN) ------------
      if (isGameMode) {
  try {
    // revent double-submits (sounds overlap + double navigation)
    // isAnimating is already checked before entering handleAnswer, but keep it safe here too
    if (isAnimating) return;

    const out = await quizSubmitAnswer(
      quizRunId,
      questionId,
      selectedAnswer,
      responseMs,
      childPin,
      {
        level: selectedTable,
        beltOrDegree: selectedDifficulty,
        forcePass: false,
      }
    );

    // practice (backend decides) -> go learning
    if (out?.practice) {
      // reset streak on interruption (matches quiz feel)
      setCurrentQuizStreak(0);
      setTransientStreakMessage(null);

      setIsTimerPaused(true);
      setPausedTime(Date.now());
      setInterventionQuestion(mapQuestionToFrontend(out.practice));
      setShowLearningModule(true);
      setIsGameModePractice(true);
      setGameModeInterventionIndex(currentQuestionIndex);
      setIsAnimating(false);
      const practiceMode = out?.gameModeType || gameModeType;
      if (isGameMode && practiceMode === 'surf') {
        setPendingSurfPractice(true);
        navigate('/game-mode-surf-video/lose', { replace: true });
        return;
      }
      navigate('/learning');
      return;
    }

    const resolvedGameModeType = out?.gameModeType || gameModeType || 'lightning';
    if (resolvedGameModeType && resolvedGameModeType !== gameModeType) {
      setGameModeType(resolvedGameModeType);
    }
    if (resolvedGameModeType === 'surf') {
      setGameModeType('surf');
      applySurfState(out);
      setCurrentQuizStreak(0);
      setTransientStreakMessage(null);

      if (out?.dailyStats) {
        setCorrectCount(out.dailyStats.correctCount);
        applyDailyStatsTotalMs(out.dailyStats.totalActiveMs);
        if (out.dailyStats.grandTotal !== undefined) setGrandTotalCorrect(out.dailyStats.grandTotal);
        if (out.dailyStats.currentStreak !== undefined) setCurrentStreak(out.dailyStats.currentStreak);
      }
      if (out?.updatedProgress) setTableProgress(out.updatedProgress);

      const surfCompleted = !!out?.completed && (out?.beltAwarded || out?.passed);
      if (surfCompleted) {
        setIsGameMode(false);
        setIsAnimating(false);

        setIsTimerPaused(true);
        setPausedTime(Date.now());
        const surfOptions = generateRandomVideoOptions(surfVideoList);
        if (surfOptions) {
          setShouldExitAfterVideo(true);
          setSurfResumeAfterVideo(false);
          setVideoOptions(surfOptions);
          navigate('/game-mode-video-select', { replace: true });
          return;
        }

        setSurfResumeAfterVideo(false);
        setShouldExitAfterVideo(false);
        navigate('/game-mode-exit', { replace: true });
        return;
      }

      const surfPassed = !!out?.surfQuizPassed;
      if (surfPassed) {
        setIsTimerPaused(true);
        setPausedTime(Date.now());
        setIsAnimating(false);

        const surfOptions = generateRandomVideoOptions(surfVideoList);
        if (surfOptions) {
          setShouldExitAfterVideo(false);
          setSurfResumeAfterVideo(true);
          setVideoOptions(surfOptions);
          navigate('/game-mode-video-select', { replace: true });
          return;
        }

        setSurfResumeAfterVideo(false);
        await startSurfNextQuiz({ navigateToGameMode: true });
        return;
      }

      // No answer symbol in Surf Mode 2
      if (!isCorrect) audioManager.playWrongSound();
      if (isCorrect) audioManager.playCompleteSound();

      const nextIndex =
        typeof out?.nextIndex === 'number' ? out.nextIndex : currentQuestionIndex + 1;

      if (!quizQuestions || quizQuestions.length === 0 || nextIndex >= quizQuestions.length) {
        await startSurfNextQuiz({ navigateToGameMode: false });
        setIsAnimating(false);
        return;
      }

      setCurrentQuestionIndex(nextIndex);
      setCurrentQuestion(quizQuestions[nextIndex]);
      questionStartTimestamp.current = Date.now();
      setIsAnimating(false);
      return;
    }

    // Update lightning from backend authority first so we can infer fast answers.
    const prevTotal = lightningCount;
    const nextTotal = typeof out?.totalCorrect === 'number' ? out.totalCorrect : prevTotal;
    setLightningCount(nextTotal);

    // Determine fast/slow using backend lightning counter when available.
    // Backend increments totalCorrect only for "fast" answers.
    const backendMarkedFast = isCorrect && nextTotal > prevTotal;
    const isFastAnswer = backendMarkedFast || responseMs <= lightningFastThresholdMs;

    //  Symbol + sound logic (lightning mode only shows lightning)
    let symbol = null;
    const lightningSymbol = '\u26A1';

    if (!isCorrect) {
      audioManager.playWrongSound();
      setCurrentQuizStreak(0);
      setTransientStreakMessage(null);
    } else if (isFastAnswer && !out?.slow) {
      symbol = lightningSymbol;
      audioManager.playLightningSound();
      setCurrentQuizStreak((prev) => prev + 1);
      setTransientStreakMessage(null);
    } else {
      audioManager.playCompleteSound();
      setCurrentQuizStreak((prev) => prev + 1);
      setTransientStreakMessage(null);
    }

    // Keep symbol visible briefly; lightning mode only shows the lightning symbol.
    if (symbol) {
      showAnswerSymbolFor300ms({ symbol, isCorrect });
    }

    // lightningCount already updated above

    // Video should trigger ONLY when:
    // - user answered fast (⚡)
    // - and backend totalCorrect increased to a new multiple of 5
    // This prevents "loop at 5" even if totalCorrect stays the same on slow answers.
    const reachedNewMilestone =
      symbol === lightningSymbol &&
      nextTotal > prevTotal &&
      nextTotal > 0 &&
      nextTotal % 5 === 0;

    // If backend completed the run, exit after optional final milestone video
    if (out?.completed) {
      if (out?.updatedProgress) {
        setTableProgress(out.updatedProgress);
      }

      if (out?.dailyStats) {
        setCorrectCount(out.dailyStats.correctCount);
        applyDailyStatsTotalMs(out.dailyStats.totalActiveMs);
        if (out.dailyStats.grandTotal !== undefined) setGrandTotalCorrect(out.dailyStats.grandTotal);
        if (out.dailyStats.currentStreak !== undefined) setCurrentStreak(out.dailyStats.currentStreak);
      }
      if (out?.lightningComplete && out?.surfRequired) {
        setIsTimerPaused(true);
        setPausedTime(Date.now());
        setQuizQuestions([]);
        setCurrentQuestion(null);
        setCurrentQuestionIndex(0);

        const options = generateRandomVideoOptions();

        // If we have bonus videos, ALWAYS play them at lightning completion (100),
        // even if the last answer was not ⚡ (because 100 is also a 5-milestone).
        if (options) {
          setVideoOptions(options);

          // after the selected video ends, go to Lightning Complete screen
          setShouldGoToLightningCompleteAfterVideo(true);

          // make sure we don't accidentally route to /game-mode-exit
          setShouldExitAfterVideo(false);

          setIsAnimating(false);
          navigate('/game-mode-video-select', { replace: true });
          return;
        }

        // Fallback: no videos available
        setIsAnimating(false);
        navigate('/game-mode-lightning-complete', { replace: true });
        return;
      }


      if (reachedNewMilestone) {
        setShouldExitAfterVideo(true);
        setIsTimerPaused(true);
        setPausedTime(Date.now());

        const options = generateRandomVideoOptions();
        if (options) setVideoOptions(options);

        setIsAnimating(false);
        navigate('/game-mode-video-select', { replace: true });
        return;
      }

      setIsAnimating(false);
      setIsGameMode(false);
      navigate('/game-mode-exit', { replace: true });
      return;
    }

    // Not completed: show video on new milestone only
    if (reachedNewMilestone) {
      setIsTimerPaused(true);
      setPausedTime(Date.now());
      setShouldExitAfterVideo(false);

      const options = generateRandomVideoOptions();
      if (options) setVideoOptions(options);

      setGameModeLevel((prev) => prev + 1);

      // Advance to the next question before showing the video so we don't repeat it after return
      const nextIndex =
        typeof out?.nextIndex === 'number' ? out.nextIndex : currentQuestionIndex + 1;

      if (!quizQuestions || quizQuestions.length === 0 || nextIndex >= quizQuestions.length) {
        const restarted = await quizStart(quizRunId, childPin);
        const backendQuestions = restarted?.questions || restarted?.run?.questions || [];
        const mapped = backendQuestions.map(mapQuestionToFrontend);

        const startIndex =
          typeof restarted?.currentIndex === 'number'
            ? restarted.currentIndex
            : typeof restarted?.run?.currentIndex === 'number'
              ? restarted.run.currentIndex
              : 0;

        const safeIndex = Math.min(Math.max(startIndex, 0), mapped.length - 1);

        setQuizQuestions(mapped);
        setCurrentQuestionIndex(safeIndex);
        setCurrentQuestion(mapped[safeIndex]);
      } else {
        setCurrentQuestionIndex(nextIndex);
        setCurrentQuestion(quizQuestions[nextIndex]);
      }

      questionStartTimestamp.current = Date.now();

      setIsAnimating(false);
      navigate('/game-mode-video-select', { replace: true });
      return;
    }

    // Advance to next question using backend nextIndex
    const nextIndex =
      typeof out?.nextIndex === 'number' ? out.nextIndex : currentQuestionIndex + 1;

    // If we ran out of cached questions, refresh from backend (same run)
    if (!quizQuestions || quizQuestions.length === 0 || nextIndex >= quizQuestions.length) {
      const restarted = await quizStart(quizRunId, childPin);
      const backendQuestions = restarted?.questions || restarted?.run?.questions || [];
      const mapped = backendQuestions.map(mapQuestionToFrontend);

      const startIndex =
        typeof restarted?.currentIndex === 'number'
          ? restarted.currentIndex
          : typeof restarted?.run?.currentIndex === 'number'
            ? restarted.run.currentIndex
            : 0;

      const safeIndex = Math.min(Math.max(startIndex, 0), mapped.length - 1);

      setQuizQuestions(mapped);
      setCurrentQuestionIndex(safeIndex);
      setCurrentQuestion(mapped[safeIndex]);

      // reset timing for the new question
      questionStartTimestamp.current = Date.now();

      setIsAnimating(false);
      return;
    }

    // Normal next question
    setCurrentQuestionIndex(nextIndex);
    setCurrentQuestion(quizQuestions[nextIndex]);

    // reset timing for the new question
    questionStartTimestamp.current = Date.now();

    setIsAnimating(false);
    return;
  } catch (e) {
    console.error('[GameMode] Failed to submit answer:', e);
    setIsAnimating(false);
    return;
  }
}


      // ------------ NORMAL QUIZ BRANCH (mostly unchanged) ------------
      const timeTaken = responseMs / 1000;
      const nextIndex = currentQuestionIndex + 1;
      const newProgress = Math.min(nextIndex * (100 / maxQuestions), 100);

      const streakMilestones = [3, 5, 10, 15, 20];
      let newQuizStreak = currentQuizStreak;
      let symbol;
      let triggerStreakMessage = null;

      if (isCorrect) {
        newQuizStreak += 1;
        const isStreakMilestoneHit = streakMilestones.includes(newQuizStreak);

        if (timeTaken <= 2.0) {
          symbol = '⚡';
          if (!isStreakMilestoneHit) audioManager.playLightningSound();
        } else {
          symbol = '✓';
          if (!isStreakMilestoneHit) audioManager.playCompleteSound();
        }

        if (isStreakMilestoneHit) {
          const streakSlice = answerSymbols.slice(-newQuizStreak + 1);
          const isLightningStreak =
            streakSlice.every((a) => a.symbol === '⚡') && symbol === '⚡';

          triggerStreakMessage = {
            text: `${newQuizStreak} IN A ROW`,
            symbolType: isLightningStreak ? 'lightning' : 'check',
            count: newQuizStreak,
          };

          if (isLightningStreak) {
            audioManager.playLightningStreakSound(newQuizStreak);
          } else {
            audioManager.playStreakSound(newQuizStreak);
          }
        }

        setCurrentQuizStreak(newQuizStreak);
        setAnswerSymbols((prev) => [...prev, { symbol, isCorrect: true, timeTaken }]);
        setSessionCorrectCount((s) => s + 1);
      } else {
        newQuizStreak = 0;
        setCurrentQuizStreak(0);
        symbol = '';
        audioManager.playWrongSound();
        setWrongCount((w) => w + 1);
        setAnswerSymbols((prev) => [...prev, { symbol, isCorrect: false, timeTaken }]);
        setTransientStreakMessage(null);
      }

      setQuizProgress(newProgress);

      let uiAdvancedOptimistically = false;

      if (isCorrect && nextIndex < quizQuestions.length) {
        setCurrentQuestion(quizQuestions[nextIndex]);
        setCurrentQuestionIndex(nextIndex);
        questionStartTimestamp.current = Date.now();
        setTransientStreakMessage(triggerStreakMessage);
        uiAdvancedOptimistically = true;
      } else {
        setTransientStreakMessage(triggerStreakMessage);
        if (triggerStreakMessage) setTimeout(() => setTransientStreakMessage(null), 500);
      }

      try {
        const answerOptions = isPretest
          ? {}
          : {
              level: selectedTable,
              beltOrDegree: selectedDifficulty,
              forcePass: false,
            };

        const out = await quizSubmitAnswer(
          quizRunId,
          questionId,
          selectedAnswer,
          responseMs,
          childPin,
          answerOptions
        );

        if (out.completed) {
          const totalTimeMs = out.summary?.totalActiveMs || elapsedTime * 1000;
          const sessionTimeSeconds = Math.round(totalTimeMs / 1000);

          setIsAnimating(false);
          localStorage.setItem('math-last-quiz-duration', sessionTimeSeconds);
          setQuizStartTime(null);
          setSessionCorrectCount(out.sessionCorrectCount || 0);

          if (out.dailyStats) {
            setCorrectCount(out.dailyStats.correctCount);
            applyDailyStatsTotalMs(out.dailyStats.totalActiveMs, { skipSessionAdjust: true });
            if (out.dailyStats.grandTotal !== undefined) setGrandTotalCorrect(out.dailyStats.grandTotal);
            if (out.dailyStats.currentStreak !== undefined) setCurrentStreak(out.dailyStats.currentStreak);
          }
          if (out.updatedProgress) setTableProgress(out.updatedProgress);

          const isBlackDegree7 = selectedDifficulty && String(selectedDifficulty).startsWith('black-7');

          if (isPretest) {
            stopPretestTimer();
            setIsTimerPaused(true);

            const resultPayload = {
              passed: out.passed === true,
              failReason: out.failReason || null,
              summary: out.summary || null,
              totalTimeMs: out.totalTimeMs ?? out.summary?.totalActiveMs ?? totalTimeMs,
              timeLimitMs: out.timeLimitMs ?? out.pretestTimeLimitMs ?? pretestTimeLimitMs,
              level: selectedTable,
              operation: selectedOperation,
              levelAwarded: out.levelAwarded,
              pretestSkipped: out.pretestSkipped,
            };

            setPretestResult(resultPayload);

            navigate('/pretest-result', {
              replace: true,
              state: { sessionTimeSeconds, pretestResult: resultPayload },
            });
            return;
          }

          if (out.passed) {
            setShowResult(true);
            navigate('/results', { replace: true, state: { sessionTimeSeconds } });
          } else {
            if (!isBlackDegree7 && selectedDifficulty && selectedTable != null) {
              localStorage.setItem('game-mode-belt', selectedDifficulty);
              localStorage.setItem('game-mode-table', String(selectedTable));
            }

            setIsAnimating(false);
            setQuizStartTime(null);
            setSessionCorrectCount(out.sessionCorrectCount || 0);
            localStorage.setItem(
              'math-last-quiz-duration',
              Math.round((out.summary?.totalActiveMs || 0) / 1000)
            );
            setIsTimerPaused(true);

            setShowWayToGoAfterFailure(true);
            navigate('/way-to-go');
          }
        } else if (out.practice) {
          setIsTimerPaused(true);
          setPausedTime(Date.now());
          setInterventionQuestion(mapQuestionToFrontend(out.practice));
          setShowLearningModule(true);
          navigate('/learning');
          setIsAnimating(false);
        } else if (uiAdvancedOptimistically) {
          if (out.dailyStats) {
            setCorrectCount(out.dailyStats.correctCount);
            applyDailyStatsTotalMs(out.dailyStats.totalActiveMs);
            if (out.dailyStats.grandTotal !== undefined) setGrandTotalCorrect(out.dailyStats.grandTotal);
            if (out.dailyStats.currentStreak !== undefined) setCurrentStreak(out.dailyStats.currentStreak);
          }
          setIsAnimating(false);
        } else {
          console.warn('Quiz is in an unexpected non-terminal, non-advancing state.');
          setIsAnimating(false);
        }
      } catch (e) {
        console.error('Quiz Answer/State update failed:', e.message);
        if (String(e.message || '').toLowerCase().includes('not the current question')) {
          setIsAnimating(false);
          return;
        }
        setIsAnimating(false);
        alert('Error during quiz: ' + (e.message || 'Unknown error'));
        navigate('/belts');
      }
    },
    [
      isAnimating,
      showResult,
      isTimerPaused,
      currentQuestion,
      quizRunId,
      childPin,
      selectedTable,
      selectedDifficulty,
      currentQuestionIndex,
      quizQuestions,
      maxQuestions,
      currentQuizStreak,
      answerSymbols,
      elapsedTime,
      isGameMode,
      gameModeType,
      lightningCount,
      lightningFastThresholdMs,
      navigate,
      applySurfState,
      startSurfNextQuiz,
      setShouldExitAfterVideo,
      setSurfResumeAfterVideo,
      setVideoOptions,
      generateRandomVideoOptions,
      surfVideoList,
      setIsTimerPaused,
      setPausedTime,
      isPretest,
      stopPretestTimer,
      pretestTimeLimitMs,
      selectedOperation,
    ]
  );

  // ---------------- PRACTICE ANSWER ----------------
  const handlePracticeAnswer = useCallback(
    async (questionId, answer) => {
      if (!quizRunId || !childPin) {
        console.error('Quiz not active for practice answer.');
        return { stillPracticing: true, completed: false };
      }

      try {
        const out = await quizPracticeAnswer(quizRunId, questionId, answer, childPin);

        if (out.completed) {
          setQuizStartTime(null);
          setIsTimerPaused(false);
          setElapsedTime(0);
          setSessionCorrectCount(out.sessionCorrectCount || 0);
          return out;
        }

        if (out?.surfQuizRestarted) {
          if (out?.questions && Array.isArray(out.questions)) {
            const mapped = out.questions.map(mapQuestionToFrontend);
            setQuizQuestions(mapped);
            setCurrentQuestionIndex(0);
            setCurrentQuestion(mapped[0]);
            questionStartTimestamp.current = Date.now();
          }

          setGameModeType('surf');
          applySurfState(out);
          if (typeof out?.surfCorrectStreak !== 'number') {
            setSurfCorrectStreak(0);
          }
          setIsGameModePractice(false);

          navigate('/game-mode', { replace: true });
          return out;
        }

        if (out.resume) {
          setIsTimerPaused(false);

          if (pausedTime) {
            setQuizStartTime((prev) => (prev ? prev + (Date.now() - pausedTime) : prev));
          }

          if (out.next) {
            // backend gives next question
            const nextQ = mapQuestionToFrontend(out.next);
            setCurrentQuestion(nextQ);
          }

          questionStartTimestamp.current = Date.now();

          setInterventionQuestion(null);
          setShowLearningModule(false);

          if (isGameMode) {
            setIsGameModePractice(false);
            navigate('/game-mode', { replace: true });
          }
        }

        return out;
      } catch (e) {
        console.error('Practice submission failed:', e.message);
        setIsTimerPaused(true);
        setPausedTime(Date.now());
        return { stillPracticing: true, error: e.message };
      }
    },
    [quizRunId, childPin, pausedTime, isGameMode, navigate, applySurfState, applyDailyStatsTotalMs]
  );

  useEffect(() => {
    syncConfigFromStorage();
  }, [syncConfigFromStorage]);

  useEffect(() => {
    const trackedKeys = new Set([
      INACTIVITY_TIMEOUT_STORAGE_KEY,
      LIGHTNING_TARGET_STORAGE_KEY,
      LIGHTNING_FAST_MS_STORAGE_KEY,
    ]);

    const handleStorage = (event) => {
      if (!trackedKeys.has(event.key)) return;
      syncConfigFromStorage();
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [syncConfigFromStorage]);

  // ---------------- INACTIVITY TIMER ----------------
  useEffect(() => {
    if (isQuittingRef.current) {
      if (inactivityTimeoutId.current) {
        clearTimeout(inactivityTimeoutId.current);
        inactivityTimeoutId.current = null;
      }
      return;
    }

    const isActiveScreen = !!quizRunId && !!currentQuestion && !isTimerPaused && !showResult;

    if (!isActiveScreen) {
      if (inactivityTimeoutId.current) {
        clearTimeout(inactivityTimeoutId.current);
        inactivityTimeoutId.current = null;
      }
      return;
    }

    if (inactivityTimeoutId.current) clearTimeout(inactivityTimeoutId.current);

    inactivityTimeoutId.current = setTimeout(async () => {
      if (isQuittingRef.current) return;
      audioManager.playSoftClick();

      if (inactivityTimeoutId.current) {
        clearTimeout(inactivityTimeoutId.current);
        inactivityTimeoutId.current = null;
      }

      setIsAwaitingInactivityResponse(true);

      try {
        //  Contract-style inactivity: only quizRunId (pin passed separately by api wrapper)
        const out = await quizHandleInactivity(quizRunId, childPin);

        if (isQuittingRef.current) {
          setIsAwaitingInactivityResponse(false);
          return;
        }

        setCurrentQuizStreak(0);
        setTransientStreakMessage(null);

        if (out?.practice) {
          setIsTimerPaused(true);
          setPausedTime(Date.now());
          setInterventionQuestion(mapQuestionToFrontend(out.practice));
          setShowLearningModule(true);

          if (isGameMode) {
            setIsGameModePractice(true);
            setGameModeInterventionIndex(currentQuestionIndex);
          }

          setIsAwaitingInactivityResponse(false);
          if (isGameMode && gameModeType === 'surf') {
            setPendingSurfPractice(true);
            navigate('/game-mode-surf-video/lose', { replace: true });
            return;
          }
          navigate('/learning');
          return;
        }

        if (out?.completed && !isGameMode) {
          // Quiz completed by inactivity -> pretest result or WayToGo
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

        // If completed in game mode, exit (backend is authoritative)
        if (out?.completed && isGameMode) {
          setIsAwaitingInactivityResponse(false);
          setIsGameMode(false);
          navigate('/game-mode-exit', { replace: true });
          return;
        }

        setIsAwaitingInactivityResponse(false);
      } catch (e) {
        console.error('Inactivity API failed:', e.message);
        setIsTimerPaused(true);
        setPausedTime(Date.now());
        setIsAwaitingInactivityResponse(false);
        navigate('/');
      }
    }, inactivityTimeoutMs);

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
    quizRunId,
    childPin,
    navigate,
    isGameMode,
    currentQuestionIndex,
    inactivityTimeoutMs,
    isPretest,
    stopPretestTimer,
    pretestTimeLimitMs,
    selectedOperation,
    selectedTable,
  ]);

  // Timer Effect (client-side time tracking)
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
  }, [isTimerPaused, quizStartTime, dailyTotalMs]);

  // Pretest countdown (wall-clock; does not pause during practice)
  useEffect(() => {
    if (!pretestTimerRunning) return;

    const interval = setInterval(() => {
      const startedAt = pretestTimerStartRef.current;
      const initialMs = pretestTimerInitialRef.current;
      if (!Number.isFinite(initialMs) || !Number.isFinite(startedAt)) return;

      const elapsed = Date.now() - startedAt;
      const nextRemaining = Math.max(0, initialMs - elapsed);
      setPretestRemainingMs(nextRemaining);
    }, 250);

    return () => clearInterval(interval);
  }, [pretestTimerRunning]);

  // ---------------- QUIT/RESET ----------------
  const handleConfirmQuit = useCallback(() => {
    setShowQuitModal(false);
    hardResetQuizState();
    isQuittingRef.current = true;
    navigate('/', { replace: true });

    setTimeout(() => {
      isQuittingRef.current = false;
    }, 3000);
  }, [navigate, hardResetQuizState]);

  const handleCancelQuit = useCallback(() => setShowQuitModal(false), []);

  const handleInitiateQuit = useCallback(() => setShowQuitModal(true), []);
  const handleInitiateReset = useCallback(() => setShowResetModal(true), []);
  const handleCancelReset = useCallback(() => setShowResetModal(false), []);

  const handleConfirmReset = useCallback(async () => {
    if (childPin) {
      try {
        await userResetProgress(childPin);
      } catch (e) {
        console.error('Backend progress reset failed:', e.message);
      }
    }

    localStorage.clear();
    hardResetQuizState();
    setChildPin('');
    setChildName('');
    setChildAge('');
    setTableProgress({});
    setShowResetModal(false);
    navigate('/', { replace: true });
  }, [navigate, hardResetQuizState, childPin]);

  const handleNameChange = useCallback((e) => setChildName(e.target.value), []);
  const handleAgeChange = useCallback((e) => setChildAge(e.target.value), []);
  const handlePinChange = useCallback((e) => setChildPin(e.target.value), []);

  // Quiz time limit (unchanged)
  const quizTimeLimit = (() => {
    if (!selectedDifficulty || !selectedDifficulty.startsWith('black')) return 0;
    const degree = parseInt(selectedDifficulty.split('-')[1]);
    switch (degree) {
      case 1:
        return 60;
      case 2:
        return 55;
      case 3:
        return 50;
      case 4:
        return 45;
      case 5:
        return 40;
      case 6:
        return 35;
      case 7:
        return 30;
      default:
        return 0;
    }
  })();

  return {
    // Core Quiz State & Actions
    selectedTable,
    setSelectedTable,
    selectedDifficulty,
    setSelectedDifficulty,
    quizRunId,
    setQuizRunId,
    startLevelEntry,
    startQuizWithDifficulty,
    startActualQuiz,
    handleAnswer,
    transientStreakMessage,
    streakPosition,
    tempNextRoute,
    setTempNextRoute,

    // GAME MODE
    isGameMode,
    setIsGameMode,
    gameModeType,
    setGameModeType,
    lightningCount,
    setLightningCount,
    lightningCycleStart,
    setLightningCycleStart,
    lightningTargetCorrect,
    surfQuizNumber,
    surfCorrectStreak,
    completedSurfQuizzes,
    surfQuizzesRequired,
    questionsPerQuiz,
    currentAnswerSymbol,
    setCurrentAnswerSymbol,
    isGameModePractice,
    gameModeInterventionIndex,
    showWayToGoAfterFailure,
    setShowWayToGoAfterFailure,
    questionStartTimestamp,
    shouldExitAfterVideo,
    setShouldExitAfterVideo,
    pendingSurfPractice,
    setPendingSurfPractice,
    surfResumeAfterVideo,
    setSurfResumeAfterVideo,
    videoOptions,
    setVideoOptions,
    handleVideoSelection,
    videoList,
    surfVideoList,
    startSurfNextQuiz,
    shouldGoToLightningCompleteAfterVideo,
    setShouldGoToLightningCompleteAfterVideo,


    // backend-driven starter
    startOrResumeGameModeRun,

    // UI & Progress
    isAnimating,
    setIsAnimating,
    showResult,
    setShowResult,
    quizProgress,
    setQuizProgress,
    correctCount,
    setCorrectCount,
    sessionCorrectCount,
    grandTotalCorrect,
    wrongCount,
    setWrongCount,
    answerSymbols,
    setAnswerSymbols,
    currentQuestion,
    setCurrentQuestion,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    maxQuestions,

    // Timers
    quizStartTime,
    setQuizStartTime,
    elapsedTime,
    setElapsedTime,
    pausedTime,
    setPausedTime,
    isTimerPaused,
    setIsTimerPaused,
    totalTimeToday,
    getQuizTimeLimit: () => quizTimeLimit,

    // Learning/Practice
    isInitialPrepLoading,
    isQuizStarting,
    setIsQuizStarting,
    isAwaitingInactivityResponse,
    showLearningModule,
    setShowLearningModule,
    learningModuleContent,
    setLearningModuleContent,
    pendingDifficulty,
    setPendingDifficulty,
    preQuizPracticeItems,
    setPreQuizPracticeItems,
    interventionQuestion,
    setInterventionQuestion,
    handlePracticeAnswer,

    // Identity & Settings
    childName,
    setChildName,
    handleNameChange,
    childAge,
    setChildAge,
    handleAgeChange,
    childPin,
    setChildPin,
    handlePinChange,
    handlePinSubmit,
    handleDemoLogin,
    userSavedThemeKey: userThemeKey,
    selectedTheme,
    setSelectedTheme: updateThemeAndNavigate,

    isLoginLoading,
    showSiblingCheck,
    loginPendingName,
    handleSiblingCheck,

    showDailyStreakAnimation,
    streakCountToDisplay,
    handleDailyStreakNext,

    handleResetProgress: handleInitiateReset,
    handleConfirmReset,
    handleCancelReset,
    handleConfirmQuit,
    handleCancelQuit,
    handleQuit: handleInitiateQuit,

    showQuitModal,
    setShowQuitModal,
    showResetModal,
    setShowResetModal,
    showSettings,
    setShowSettings,
    isQuittingRef,

    // Progression Data
    tableProgress,
    setTableProgress,

    // Pre-test exports
    preTestSection,
    setPreTestSection,
    preTestQuestions,
    setPreTestQuestions,
    preTestCurrentQuestion,
    setPreTestCurrentQuestion,
    preTestScore,
    setPreTestScore,
    preTestTimer,
    setPreTestTimer,
    preTestTimerActive,
    setPreTestTimerActive,
    preTestResults,
    setPreTestResults,
    completedSections,
    showPreTestPopup,

    // Pretest (backend-driven)
    isPretest,
    isPretestIntroVisible,
    setIsPretest,
    pretestQuestionCount,
    pretestTimeLimitMs,
    pretestRemainingMs,
    pretestResult,
    setPretestResult,
    setIsPretestIntroVisible,
    stopPretestTimer,
    selectedOperation,
    setSelectedOperation,

    navigate,
    lastQuestion,
    showSpeedTest,
    speedTestPopupVisible,
    speedTestPopupAnimation,
    speedTestNumbers,
    currentSpeedTestIndex,
    speedTestStartTime,
    speedTestTimes,
    speedTestComplete,
    speedTestStarted,
    speedTestCorrectCount,
    speedTestShowTick,
    studentReactionSpeed,

    currentStreak,
    hardResetQuizState,

    playFactVideoAfterStreak,
    setPlayFactVideoAfterStreak,
    hideStatsUI,
    setHideStatsUI,

    // kept exports (minimal breakage)
    setSessionCorrectCount,
  };
};

export default useMathGame;
