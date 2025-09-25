// src/hooks/useMathGame.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { buildQuizForBelt, getLearningModuleContent } from '../utils/mathGameLogic.js';
import audioManager from '../utils/audioUtils.js';
import { useNavigate } from 'react-router-dom';

const useMathGame = () => {
  const navigate = useNavigate();

  // ---------- global nav/state ----------
  const [screen, setScreen] = useState('start');
  const [currentPage, setCurrentPage] = useState('picker');
  const [selectedTable, setSelectedTable] = useState(null); // level (1..6)
  const [selectedDifficulty, setSelectedDifficulty] = useState(null); // belt or black-x
  const [showDifficultyPicker, setShowDifficultyPicker] = useState(false);

  // Learning module
  const [showLearningModule, setShowLearningModule] = useState(false);
  const [learningModuleContent, setLearningModuleContent] = useState('');
  const [showLearningQuestion, setShowLearningQuestion] = useState(false);
  const [learningQuestion, setLearningQuestion] = useState(null);
  const [learningQuestionIndex, setLearningQuestionIndex] = useState(0);

  // Quiz/result UI
  const [isAnimating, setIsAnimating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [quizProgress, setQuizProgress] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [questionTimes, setQuestionTimes] = useState([]);
  const [slowQuestions, setSlowQuestions] = useState(new Set());
  const [correctCountForCompletion, setCorrectCountForCompletion] = useState(0);
  const [answerSymbols, setAnswerSymbols] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [lastQuestion, setLastQuestion] = useState('');
  const [lastWhiteBeltNumber, setLastWhiteBeltNumber] = useState(null);

  // Timers
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [pausedTime, setPausedTime] = useState(0);
  const [isTimerPaused, setIsTimerPaused] = useState(false);

  // Misc UI
  const [countdown, setCountdown] = useState(5);
  const [showSettings, setShowSettings] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [childName, setChildName] = useState(() => localStorage.getItem('math-child-name') || '');
  const [childAge, setChildAge] = useState(() => localStorage.getItem('math-child-age') || '');
  const [childPin, setChildPin] = useState(() => localStorage.getItem('math-child-pin') || '');

  // Pre-test
  const [showPreTestPopup, setShowPreTestPopup] = useState(false);
  const [preTestSection, setPreTestSection] = useState('addition');
  const [preTestQuestions, setPreTestQuestions] = useState([]);
  const [preTestCurrentQuestion, setPreTestCurrentQuestion] = useState(0);
  const [preTestScore, setPreTestScore] = useState(0);
  const [preTestInputValue, setPreTestInputValue] = useState('');
  const [preTestTimer, setPreTestTimer] = useState(0);
  const [preTestTimerActive, setPreTestTimerActive] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [preTestResults, setPreTestResults] = useState(null);
  const [completedSections, setCompletedSections] = useState({});

  // Black belt (per-level arrays)
  const [isBlackUnlocked, setIsBlackUnlocked] = useState(false);
  const [showBlackBeltDegrees, setShowBlackBeltDegrees] = useState(false);
  const [unlockedDegrees, setUnlockedDegrees] = useState([]); // current level only
  const [completedBlackBeltDegrees, setCompletedBlackBeltDegrees] = useState([]); // current level
  const [currentDegree, setCurrentDegree] = useState(1);

  // Belt progress (levels → belts)
  const [tableProgress, setTableProgress] = useState({});

  // Speed test
  const [showSpeedTest, setShowSpeedTest] = useState(false);
  const [speedTestPopupVisible, setSpeedTestPopupVisible] = useState(false);
  const [speedTestPopupAnimation, setSpeedTestPopupAnimation] = useState('animate-pop-in');
  const [speedTestNumbers, setSpeedTestNumbers] = useState([]);
  const [currentSpeedTestIndex, setCurrentSpeedTestIndex] = useState(-1);
  const [speedTestStartTime, setSpeedTestStartTime] = useState(null);
  const [speedTestTimes, setSpeedTestTimes] = useState([]);
  const [speedTestComplete, setSpeedTestComplete] = useState(false);
  const [speedTestStarted, setSpeedTestStarted] = useState(false);
  const [speedTestCorrectCount, setSpeedTestCorrectCount] = useState(0);
  const [speedTestShowTick, setSpeedTestShowTick] = useState(false);
  const [studentReactionSpeed, setStudentReactionSpeed] = useState(() =>
    parseFloat(localStorage.getItem('math-reaction-speed') || '1.0')
  );

  // Learning / intervention
  const [pendingDifficulty, setPendingDifficulty] = useState(null);

  // ---------- quiz control ----------
  const questionTimeoutId = useRef(null);
  const questionStartTimestamp = useRef(null);
  const answeredQuestions = useRef(new Set());
  const quizQuestions = useRef([]);

  const maxQuestions =
    selectedDifficulty && selectedDifficulty.startsWith('black')
      ? (selectedDifficulty.endsWith('7') ? 30 : 20)
      : 10;

  // Load belt progress once from LS
  useEffect(() => {
    const loaded = {};
    for (let table = 1; table <= 12; table++) {
      loaded[table] = {};
      ['white', 'yellow', 'green', 'blue', 'red', 'brown'].forEach((belt) => {
        const key = `math-table-progress-${table}-${belt}`;
        const saved = localStorage.getItem(key);
        if (!saved) return;
        try {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            loaded[table][belt] = {
              completed: !!parsed.completed,
              perfectPerformance: !!parsed.perfectPerformance,
            };
          }
        } catch {
          if (saved === 'completed') loaded[table][belt] = { completed: true, perfectPerformance: false };
          if (saved === 'perfect')   loaded[table][belt] = { completed: true, perfectPerformance: true };
        }
      });
    }
    setTableProgress(loaded);
  }, []);

  // Load per-level black progress when level changes
  useEffect(() => {
    if (!selectedTable) return;
    try {
      const u = JSON.parse(localStorage.getItem(`math-l${selectedTable}-unlocked-degrees`) || '[]');
      setUnlockedDegrees(Array.isArray(u) ? u : []);
    } catch { setUnlockedDegrees([]); }
    try {
      const c = JSON.parse(localStorage.getItem(`math-l${selectedTable}-completed-black-degrees`) || '[]');
      setCompletedBlackBeltDegrees(Array.isArray(c) ? c : []);
    } catch { setCompletedBlackBeltDegrees([]); }
  }, [selectedTable]);

  // Persist per-level black progress
  useEffect(() => {
    if (!selectedTable) return;
    localStorage.setItem(`math-l${selectedTable}-unlocked-degrees`, JSON.stringify(unlockedDegrees || []));
  }, [unlockedDegrees, selectedTable]);

  useEffect(() => {
    if (!selectedTable) return;
    localStorage.setItem(
      `math-l${selectedTable}-completed-black-degrees`,
      JSON.stringify(completedBlackBeltDegrees || [])
    );
  }, [completedBlackBeltDegrees, selectedTable]);

  // ----- HARD RESET of quiz state (helper) -----
  const hardResetQuizState = useCallback(() => {
    setQuizProgress(0);
    setAnswerSymbols([]);
    setCorrectCount(0);
    setWrongCount(0);
    setQuestionTimes([]);
    setSlowQuestions(new Set());
    setCorrectCountForCompletion(0);

    quizQuestions.current = [];
    answeredQuestions.current = new Set();
    setCurrentQuestion(null);
    setCurrentQuestionIndex(0);
    setLastQuestion('');

    setQuizStartTime(null);
    setElapsedTime(0);
    setPausedTime(0);
    setIsTimerPaused(false);

    setShowResult(false);
    setIsAnimating(false);
    setShowLearningQuestion(false);
  }, []);

  // ====== NEW: handle New PIN ======
  const clearAllLearnerProgressFromLS = useCallback(() => {
    // remove all colored belt progress
    for (let table = 1; table <= 12; table++) {
      ['white', 'yellow', 'green', 'blue', 'red', 'brown'].forEach((belt) => {
        localStorage.removeItem(`math-table-progress-${table}-${belt}`);
      });
      // remove black per-level arrays
      localStorage.removeItem(`math-l${table}-unlocked-degrees`);
      localStorage.removeItem(`math-l${table}-completed-black-degrees`);
    }
    // legacy/global keys if any
    localStorage.removeItem('math-unlocked-degrees');
    localStorage.removeItem('math-completed-black-belt-degrees');
    // daily counters
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith('math-daily-correct-')) localStorage.removeItem(k);
    });
  }, []);

  const resetStateForNewLearner = useCallback(() => {
    // Only Level 1 selectable; no belts completed; black locked
    setTableProgress({});
    setSelectedTable(1);
    setSelectedDifficulty(null);
    setUnlockedDegrees([]);
    setCompletedBlackBeltDegrees([]);
    setShowBlackBeltDegrees(false);
    setIsBlackUnlocked(false);
    hardResetQuizState();
  }, [hardResetQuizState]);

  /** Call this from NameForm when the user submits PIN */
  const handlePinSubmit = useCallback(
    (pinValue) => {
      const oldPin = localStorage.getItem('math-child-pin');
      if (oldPin !== pinValue) {
        // New learner → wipe progress and reset state
        clearAllLearnerProgressFromLS();
        resetStateForNewLearner();
      }
      localStorage.setItem('math-child-pin', pinValue);
      setChildPin(pinValue);

      // Persist name/age if available (optional)
      if (childName.trim()) localStorage.setItem('math-child-name', childName.trim());
      if (childAge) localStorage.setItem('math-child-age', childAge);

      // Go to pre-test or theme as per your flow
      navigate('/pre-test-popup');
    },
    [childAge, childName, clearAllLearnerProgressFromLS, resetStateForNewLearner, navigate]
  );
  // ====== /NEW ======

  // Launch learning sequence BEFORE quiz
  const startQuizWithDifficulty = useCallback(
    (difficulty) => {
      hardResetQuizState();
      setSelectedDifficulty(difficulty);
      setLearningQuestionIndex(0);
      const content = getLearningModuleContent(difficulty, selectedTable);
      setLearningModuleContent(content);
      setPendingDifficulty(difficulty);
      setShowLearningModule(true);
      navigate('/learning');
    },
    [navigate, selectedTable, hardResetQuizState]
  );

  // Start actual quiz (after learning)
  const startActualQuiz = useCallback(
    (difficulty, table) => {
      hardResetQuizState();
      setSelectedDifficulty(difficulty);
      setSelectedTable(table);

      quizQuestions.current = buildQuizForBelt(table, difficulty);
      if (quizQuestions.current.length === 0) quizQuestions.current = buildQuizForBelt(1, 'white');

      setCurrentQuestionIndex(0);
      const first = quizQuestions.current[0];
      setCurrentQuestion(first);
      answeredQuestions.current.add(first.question);

      setQuizStartTime(Date.now());
      questionStartTimestamp.current = Date.now();
    },
    [hardResetQuizState]
  );

  const handleNextQuestion = useCallback(() => {
    const total = Math.min(maxQuestions, quizQuestions.current.length);
    if (currentQuestionIndex + 1 >= total) {
      setShowResult(true);
      navigate('/results');
      return;
    }
    const nextIdx = currentQuestionIndex + 1;
    setCurrentQuestionIndex(nextIdx);
    const nextQ = quizQuestions.current[nextIdx];
    setCurrentQuestion(nextQ);
    answeredQuestions.current.add(nextQ.question);
    setLastQuestion(nextQ.question);
    questionStartTimestamp.current = Date.now();
    setIsTimerPaused(false);
    setPausedTime(0);
  }, [currentQuestionIndex, maxQuestions, navigate]);

  // Timer
  useEffect(() => {
    let timer;
    if (!isTimerPaused && quizStartTime) {
      timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - quizStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTimerPaused, quizStartTime]);

  const handleNameSubmit = useCallback(() => {
    if (childName.trim()) {
      localStorage.setItem('math-child-name', childName.trim());
      navigate('/pre-test-popup');
    }
  }, [childName, navigate]);

  const handleAnswer = useCallback(
    (selectedAnswer) => {
      if (isAnimating || showResult) return;
      if (questionTimeoutId.current) {
        clearTimeout(questionTimeoutId.current);
        questionTimeoutId.current = null;
      }
      if (!currentQuestion) return;
      setIsAnimating(true);

      const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
      const timeTaken = (Date.now() - questionStartTimestamp.current) / 1000;
      setQuestionTimes((times) => [...times, timeTaken]);

      if (isCorrect) {
        setCorrectCount((c) => c + 1);
        audioManager.playCorrectSound();
        setQuizProgress((prev) => Math.min(prev + 100 / maxQuestions, 100));
        setCorrectCountForCompletion((prev) => prev + 1);

        const today = new Date().toLocaleDateString();
        const daily = parseInt(localStorage.getItem(`math-daily-correct-${today}`) || '0', 10);
        localStorage.setItem(`math-daily-correct-${today}`, daily + 1);

        if (timeTaken <= 1.5)
          setAnswerSymbols((prev) => [...prev, { symbol: '⚡', isCorrect: true, timeTaken }]);
        else if (timeTaken <= 2)
          setAnswerSymbols((prev) => [...prev, { symbol: '⭐', isCorrect: true, timeTaken }]);
        else if (timeTaken <= 5)
          setAnswerSymbols((prev) => [...prev, { symbol: '✓', isCorrect: true, timeTaken }]);
        else {
          setAnswerSymbols((prev) => [...prev, { symbol: '❌', isCorrect: true, timeTaken }]);
          setSlowQuestions((prev) => new Set(prev).add(currentQuestion.question));
        }
      } else {
        setWrongCount((w) => w + 1);
        audioManager.playWrongSound();
        setAnswerSymbols((prev) => [...prev, { symbol: '❌', isCorrect: false, timeTaken }]);
        setIsTimerPaused(true);
        setPausedTime(Date.now());
        setPendingDifficulty(selectedDifficulty);
        navigate('/learning');
      }

      setTimeout(() => {
        setIsAnimating(false);
        if (isCorrect) handleNextQuestion();
      }, 500);

      if (isCorrect) {
        setIsTimerPaused(false);
        setQuizStartTime((prev) => (prev ? prev + (Date.now() - pausedTime) : prev));
      }
    },
    [currentQuestion, isAnimating, showResult, maxQuestions, pausedTime, selectedDifficulty, navigate, handleNextQuestion]
  );

  useEffect(() => {
    if (!currentQuestion || isTimerPaused || showResult) return;

    if (questionTimeoutId.current) clearTimeout(questionTimeoutId.current);

    questionTimeoutId.current = setTimeout(() => {
        // Trigger inactivity logic
        setIsTimerPaused(true);
        setPausedTime(Date.now());
        setPendingDifficulty(selectedDifficulty);
        // This is a new state to pass the question to the learning module
        // setInterventionQuestion(currentQuestion);
        setShowLearningModule(true);
        navigate('/learning');
    }, 5000); // 5 seconds
}, [currentQuestion, isTimerPaused, showResult, selectedDifficulty, navigate]);

  const handleBackToThemePicker = useCallback(() => navigate('/theme'), [navigate]);
  const handleBackToNameForm = useCallback(() => navigate('/name'), [navigate]);

  const resumeQuizAfterIntervention = useCallback(() => {
    setIsTimerPaused(false);
    if (pausedTime && quizStartTime)
      setQuizStartTime((prev) => (prev ? prev + (Date.now() - pausedTime) : prev));
    handleNextQuestion();
  }, [handleNextQuestion, pausedTime, quizStartTime]);

  const handleConfirmQuit = useCallback(() => navigate('/'), [navigate]);
  const handleCancelQuit = useCallback(() => setShowQuitModal(false), []);

  const handleResetProgress = useCallback(() => {
    localStorage.clear();
    setScreen('start');
    setCurrentPage('picker');
    resetStateForNewLearner();
    navigate('/');
  }, [navigate, resetStateForNewLearner]);

  const handleNameChange = useCallback((e) => setChildName(e.target.value), []);
  const handleAgeChange = useCallback((e) => setChildAge(e.target.value), []);
  const handlePinChange = useCallback((e) => setChildPin(e.target.value), []);

  // const getQuizTimeLimit = useCallback(() => {
  //   if (!selectedDifficulty) return 0;
  //   if (selectedDifficulty.startsWith('black')) return selectedDifficulty.endsWith('7') ? 30 : 60;
  //   return 0;
  // }, [selectedDifficulty]);
  const getQuizTimeLimit = useCallback(() => {
    if (!selectedDifficulty || !selectedDifficulty.startsWith('black')) {
        return 0;
    }
    const degree = parseInt(selectedDifficulty.split('-')[1]);
    switch (degree) {
        case 1: return 60;
        case 2: return 55;
        case 3: return 50;
        case 4: return 45;
        case 5: return 40;
        case 6: return 35;
        case 7: return 30;
        default: return 0;
    }
  }, [selectedDifficulty]);

  return {
    // nav/state
    currentPage, setCurrentPage,
    selectedTable, setSelectedTable,
    selectedDifficulty, setSelectedDifficulty,
    showDifficultyPicker, setShowDifficultyPicker,

    // learning
    showLearningModule, setShowLearningModule,
    learningModuleContent, setLearningModuleContent,
    showLearningQuestion, setShowLearningQuestion,
    learningQuestion, setLearningQuestion,
    learningQuestionIndex, setLearningQuestionIndex,
    pendingDifficulty, setPendingDifficulty,

    // UI & progress
    isAnimating, setIsAnimating,
    showResult, setShowResult,
    quizProgress, setQuizProgress,
    correctCount, setCorrectCount,
    wrongCount, setWrongCount,
    questionTimes, setQuestionTimes,
    slowQuestions, setSlowQuestions,
    correctCountForCompletion, setCorrectCountForCompletion,
    answerSymbols, setAnswerSymbols,
    currentQuestion, setCurrentQuestion,
    currentQuestionIndex, setCurrentQuestionIndex,
    lastQuestion, setLastQuestion,
    lastWhiteBeltNumber, setLastWhiteBeltNumber,
    quizStartTime, setQuizStartTime,
    elapsedTime, setElapsedTime,
    pausedTime, setPausedTime,
    isTimerPaused, setIsTimerPaused,
    countdown, setCountdown,
    showSettings, setShowSettings,
    showQuitModal, setShowQuitModal,
    selectedTheme, setSelectedTheme,

    // identity
    childName, setChildName, handleNameChange,
    childAge, setChildAge, handleAgeChange,
    childPin, setChildPin, handlePinChange,

    // pre-test
    showPreTestPopup, setShowPreTestPopup,
    preTestSection, setPreTestSection,
    preTestQuestions, setPreTestQuestions,
    preTestCurrentQuestion, setPreTestCurrentQuestion,
    preTestScore, setPreTestScore,
    preTestInputValue, setPreTestInputValue,
    preTestTimer, setPreTestTimer,
    preTestTimerActive, setPreTestTimerActive,
    showResultsModal, setShowResultsModal,
    preTestResults, setPreTestResults,
    completedSections, setCompletedSections,

    // actions
    startQuizWithDifficulty,
    startActualQuiz,
    handleAnswer,
    handleResetProgress,
    handleBackToThemePicker,
    handleBackToNameForm,
    handleConfirmQuit,
    handleCancelQuit,
    resumeQuizAfterIntervention,

    // black belt (current level only)
    isBlackUnlocked, setIsBlackUnlocked,
    showBlackBeltDegrees, setShowBlackBeltDegrees,
    unlockedDegrees, setUnlockedDegrees,
    completedBlackBeltDegrees, setCompletedBlackBeltDegrees,
    currentDegree, setCurrentDegree,

    // speed test
    showSpeedTest, setShowSpeedTest,
    speedTestPopupVisible, setSpeedTestPopupVisible,
    speedTestPopupAnimation, setSpeedTestPopupAnimation,
    speedTestNumbers, setSpeedTestNumbers,
    currentSpeedTestIndex, setCurrentSpeedTestIndex,
    speedTestStartTime, setSpeedTestStartTime,
    speedTestTimes, setSpeedTestTimes,
    speedTestComplete, setSpeedTestComplete,
    speedTestStarted, setSpeedTestStarted,
    speedTestCorrectCount, setSpeedTestCorrectCount,
    speedTestShowTick, setSpeedTestShowTick,
    studentReactionSpeed, setStudentReactionSpeed,

    // misc
    tableProgress, setTableProgress,
    maxQuestions,
    getQuizTimeLimit,

    // NEW: PIN submit handler
    handlePinSubmit,

    // router
    navigate,
  };
};

export default useMathGame;
