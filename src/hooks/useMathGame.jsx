// src/hooks/useMathGame.jsx
import { useState, useEffect, useRef, useCallback, useContext} from 'react';
import audioManager from '../utils/audioUtils.js';
import { useNavigate } from 'react-router-dom';
// const { getQuizTimeLimit } = useContext(MathGameContext);
// import { buildQuizForBelt, getLearningModuleContent } from '../utils/mathGameLogic.js';
// Import API functions
import {
  authLogin,
  quizPrepare,
  quizStart,
  quizSubmitAnswer,
  quizHandleInactivity,
  userGetProgress,
  mapQuestionToFrontend,
} from '../api/mathApi.js';

// Constant for inactivity timeout (same as backend, 5000ms)
const INACTIVITY_TIMEOUT_MS = 5000;

const useMathGame = () => {
  const navigate = useNavigate();

  // ---------- global nav/state ----------
  const [selectedTable, setSelectedTable] = useState(null); // level (1..6)
  const [selectedDifficulty, setSelectedDifficulty] = useState(null); // belt or black-x
  const [quizRunId, setQuizRunId] = useState(null); // ✅ NEW: Backend quiz run ID

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
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [questionTimes, setQuestionTimes] = useState([]);
  const [answerSymbols, setAnswerSymbols] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null); // Full question object (from mapQuestionToFrontend)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [maxQuestions, setMaxQuestions] = useState(10);

  // Timers
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [pausedTime, setPausedTime] = useState(0);
  const [isTimerPaused, setIsTimerPaused] = useState(false);

  // Identity and Progress
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [childName, setChildName] = useState(() => localStorage.getItem('math-child-name') || '');
  const [childAge, setChildAge] = useState(() => localStorage.getItem('math-child-age') || '');
  const [childPin, setChildPin] = useState(() => localStorage.getItem('math-child-pin') || '');
  const [tableProgress, setTableProgress] = useState({});
  // const [unlockedDegrees, setUnlockedDegrees] = useState([]);
  // const [completedBlackBeltDegrees, setCompletedBlackBeltDegrees] = useState([]);
  // const [currentDegree, setCurrentDegree] = useState(1);

  // Misc UI
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // --- ADD MISSING PRE-TEST STATE DECLARATIONS ---
  const [preTestSection, setPreTestSection] = useState('addition');
  const [preTestQuestions, setPreTestQuestions] = useState([]);
  const [preTestCurrentQuestion, setPreTestCurrentQuestion] = useState(0);
  const [preTestScore, setPreTestScore] = useState(0);
  const [preTestTimerActive, setPreTestTimerActive] = useState(false);
  const [preTestTimer, setPreTestTimer] = useState(0);
  const [preTestResults, setPreTestResults] = useState(null);
  const [completedSections, setCompletedSections] = useState({});
  const [showPreTestPopup, setShowPreTestPopup] = useState(false);
  // --- END ADDITIONS ---
  
  // (omitted speed/pre-test state for brevity, keeping original structure)
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
  const [lastQuestion, setLastQuestion] = useState(''); // Kept for minimal change in ResultsScreen state destructuring

  // Internal state for timer/network
  const questionStartTimestamp = useRef(null);
  const inactivityTimeoutId = useRef(null);
  
  // --- CLIENT-SIDE HELPERS ---

  const determineMaxQuestions = useCallback((difficulty) => {
    if (difficulty && difficulty.startsWith('black')) {
      return difficulty.endsWith('7') ? 30 : 20;
    }
    return 10;
  }, []);
  
  const hardResetQuizState = useCallback(() => {
    if (inactivityTimeoutId.current) {
      clearTimeout(inactivityTimeoutId.current);
      inactivityTimeoutId.current = null;
    }

    setQuizRunId(null);
    setPreQuizPracticeItems([]);
    setQuizProgress(0);
    setAnswerSymbols([]);
    setCorrectCount(0);
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
  }, []);

  // --- API / LIFECYCLE ---

  const fetchProgress = useCallback(async (pin) => {
    if (!pin) return;
    try {
      const { progress } = await userGetProgress(pin);
      // Map the backend structure (which uses L1, L2 keys) directly into state
      setTableProgress(progress || {});
    } catch (e) {
      console.error('Error fetching progress:', e.message);
    }
  }, []);

  const handlePinSubmit = useCallback(
    async (pinValue) => {
      const oldPin = localStorage.getItem('math-child-pin');
      if (oldPin !== pinValue) {
        // Reset local state for new user
        hardResetQuizState();
        setTableProgress({});
        // Local storage clear is handled in handleResetProgress, but we clear the pin here.
      }
      
      localStorage.setItem('math-child-pin', pinValue);
      setChildPin(pinValue);

      try {
        const { user } = await authLogin(pinValue, childName.trim() || 'Player');
        localStorage.setItem('math-child-name', user.name);
        setChildName(user.name);
        
        await fetchProgress(pinValue); // Fetch initial progression

        navigate('/pre-test-popup');

      } catch (e) {
        throw new Error(e.message || 'Login failed.');
      }
    },
    [childName, navigate, hardResetQuizState, fetchProgress]
  );


  // 1. Prepare (called from DifficultyPicker/BlackBeltPicker -> startQuizWithDifficulty)
  const startQuizWithDifficulty = useCallback(
    async (difficulty, table) => {
      hardResetQuizState();
      setSelectedDifficulty(difficulty);
      setSelectedTable(table);
      setPendingDifficulty(difficulty);
      setMaxQuestions(determineMaxQuestions(difficulty));

      try {
        const { quizRunId: newRunId, practice: practiceItems } = await quizPrepare(
          table,
          difficulty,
          childPin
        );
        
        setQuizRunId(newRunId);
        setPreQuizPracticeItems(practiceItems || []);

        // Use a generic placeholder content since the actual facts are in practiceItems
        const content = `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Belt Quiz at Level ${table}.`;
        setLearningModuleContent(content);
        
        if (practiceItems && practiceItems.length > 0) {
          setShowLearningModule(true);
          navigate('/learning');
        } else {
          startActualQuiz(newRunId);
        }
        
      } catch (e) {
        console.error('Quiz Prepare failed:', e.message);
        alert('Failed to prepare quiz: ' + e.message);
        navigate('/belts');
      }
    },
    [navigate, childPin, hardResetQuizState, determineMaxQuestions]
  );
  
  // 2. Start (called from LearningModule after practice is completed)
  const startActualQuiz = useCallback(
    async (runId) => {
      try {
        const idToUse = runId || quizRunId;
        const { question: backendQuestion } = await quizStart(idToUse, childPin);
        
        if (!backendQuestion) throw new Error("No question returned from quiz start.");

        setCurrentQuestionIndex(0);
        const firstQ = mapQuestionToFrontend(backendQuestion);
        setCurrentQuestion(firstQ);

        setQuizStartTime(Date.now());
        questionStartTimestamp.current = Date.now();
        setIsTimerPaused(false);
        setElapsedTime(0);
        setPausedTime(0);

        navigate('/quiz');

      } catch (e) {
        console.error('Quiz Start failed:', e.message);
        alert('Failed to start quiz: ' + e.message);
        navigate('/belts');
      }
    },
    [navigate, childPin, quizRunId]
  );

  // 3. Answer
  const handleAnswer = useCallback(
    async (selectedAnswer) => {
      if (isAnimating || showResult || isTimerPaused || !currentQuestion || !quizRunId) return;
      setIsAnimating(true);
      
      const responseMs = Date.now() - questionStartTimestamp.current;
      const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
      const questionId = currentQuestion.id;
      
      if (inactivityTimeoutId.current) {
        clearTimeout(inactivityTimeoutId.current);
        inactivityTimeoutId.current = null;
      }
      
      // Update client-side UI first (optimistic symbol)
      const timeTaken = responseMs / 1000;
      let symbol;
      if (isCorrect) {
        if (timeTaken <= 1.5) symbol = '⚡';
        else if (timeTaken <= 2) symbol = '⭐';
        else if (timeTaken <= 5) symbol = '✓';
        else symbol = '✓';
        audioManager.playCorrectSound();
        setCorrectCount((c) => c + 1);
        setAnswerSymbols((prev) => [...prev, { symbol, isCorrect: true, timeTaken }]);
      } else {
        symbol = '❌';
        audioManager.playWrongSound();
        setWrongCount((w) => w + 1);
        setAnswerSymbols((prev) => [...prev, { symbol, isCorrect: false, timeTaken }]);
      }
      
      // Send answer to backend to get next state
      try {
          const out = await quizSubmitAnswer(
              quizRunId,
              questionId,
              selectedAnswer,
              responseMs,
              selectedTable,
              selectedDifficulty,
              childPin
          );

          // Handle server response
          if (out.completed) {
              setTimeout(async () => {
                  setShowResult(true);
                  setIsAnimating(false);
                  await fetchProgress(childPin); // Update progress after completion
                  navigate(out.passed ? '/results' : '/way-to-go');
                  localStorage.setItem('math-last-session-seconds', out.summary.totalActiveMs / 1000);
              }, 500);
          } else if (out.next) {
              setTimeout(() => {
                  setCurrentQuestion(mapQuestionToFrontend(out.next));
                  setCurrentQuestionIndex(prev => prev + 1);
                  questionStartTimestamp.current = Date.now();
                  setIsAnimating(false);
                  setQuizProgress((prev) => Math.min(prev + 100 / maxQuestions, 100));
              }, 500);
          } else if (out.practice) {
              setTimeout(() => {
                  setIsTimerPaused(true);
                  setPausedTime(Date.now());
                  setInterventionQuestion(mapQuestionToFrontend(out.practice));
                  setShowLearningModule(true);
                  navigate('/learning');
                  setIsAnimating(false);
              }, 500);
          }
      } catch (e) {
          console.error('Quiz Answer/State update failed:', e.message);
          alert('Error during quiz: ' + e.message);
          setIsAnimating(false);
          navigate('/belts');
      }
    },
    [currentQuestion, isAnimating, showResult, isTimerPaused, quizRunId, childPin, selectedTable, selectedDifficulty, navigate, fetchProgress, maxQuestions]
  );
  
  // 4. Inactivity Timer Effect
  useEffect(() => {
    if (!currentQuestion || isTimerPaused || showResult || !quizRunId) {
      if (inactivityTimeoutId.current) {
        clearTimeout(inactivityTimeoutId.current);
        inactivityTimeoutId.current = null;
      }
      return;
    }

    if (inactivityTimeoutId.current) clearTimeout(inactivityTimeoutId.current);

    inactivityTimeoutId.current = setTimeout(async () => {
        try {
            const out = await quizHandleInactivity(quizRunId, currentQuestion.id, childPin);
            
            if (out.practice) {
                setIsTimerPaused(true);
                setPausedTime(Date.now());
                setInterventionQuestion(mapQuestionToFrontend(out.practice));
                setShowLearningModule(true);
                navigate('/learning');
            }
        } catch(e) {
            console.error('Inactivity API failed:', e.message);
            setIsTimerPaused(true);
            setPausedTime(Date.now());
            navigate('/belts');
        }
    }, INACTIVITY_TIMEOUT_MS); 

    return () => {
      if (inactivityTimeoutId.current) {
          clearTimeout(inactivityTimeoutId.current);
          inactivityTimeoutId.current = null;
      }
    };
  }, [currentQuestion, isTimerPaused, showResult, quizRunId, childPin, navigate]);

  // Timer Effect (client-side time tracking)
  useEffect(() => {
    let timer;
    if (!isTimerPaused && quizStartTime) {
      timer = setInterval(() => {
        const currentElapsed = Math.floor((Date.now() - quizStartTime) / 1000);
        setElapsedTime(currentElapsed);
        localStorage.setItem('math-last-session-seconds', currentElapsed);
      }, 1000);
    }
    return () => {
      clearInterval(timer);
      localStorage.setItem('math-last-session-seconds', elapsedTime);
    };
  }, [isTimerPaused, quizStartTime, elapsedTime]);


  const handleConfirmQuit = useCallback(() => navigate('/'), [navigate]);
  const handleCancelQuit = useCallback(() => setShowQuitModal(false), []);
  const handleResetProgress = useCallback(() => {
    localStorage.clear();
    hardResetQuizState();
    setChildPin('');
    setChildName('');
    setChildAge('');
    setTableProgress({});
    setUnlockedDegrees([]);
    setCompletedBlackBeltDegrees([]);
    navigate('/');
  }, [navigate, hardResetQuizState]);

  const handleNameChange = useCallback((e) => setChildName(e.target.value), []);
  const handleAgeChange = useCallback((e) => setChildAge(e.target.value), []);
  const handlePinChange = useCallback((e) => setChildPin(e.target.value), []);

  const resumeQuizAfterIntervention = useCallback(() => {
    // This function is now largely obsolete as resume is handled directly in LearningModule.jsx 
    // after a successful quizPracticeAnswer API call.
  }, []);

  // --- FIX 3: Define getQuizTimeLimit logic or a simple placeholder inside the hook ---
  const quizTimeLimit = (() => {
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
  })();

  return {
    // Core Quiz State & Actions
    selectedTable, setSelectedTable,
    selectedDifficulty, setSelectedDifficulty,
    quizRunId, setQuizRunId,
    startQuizWithDifficulty,
    startActualQuiz,
    handleAnswer,
    // UI & Progress
    isAnimating, setIsAnimating,
    showResult, setShowResult,
    quizProgress, setQuizProgress,
    correctCount, setCorrectCount,
    wrongCount, setWrongCount,
    answerSymbols, setAnswerSymbols,
    currentQuestion, setCurrentQuestion,
    currentQuestionIndex, setCurrentQuestionIndex,
    maxQuestions,
    // Timers
    quizStartTime, setQuizStartTime,
    elapsedTime, setElapsedTime,
    pausedTime, setPausedTime,
    isTimerPaused, setIsTimerPaused,
    getQuizTimeLimit: () => quizTimeLimit,
    // Learning/Practice
    showLearningModule, setShowLearningModule,
    learningModuleContent, setLearningModuleContent,
    pendingDifficulty, setPendingDifficulty,
    preQuizPracticeItems, setPreQuizPracticeItems,
    interventionQuestion, setInterventionQuestion,
    resumeQuizAfterIntervention,
    // Identity & Settings
    childName, setChildName, handleNameChange,
    childAge, setChildAge, handleAgeChange,
    childPin, setChildPin, handlePinChange,
    handlePinSubmit,
    handleResetProgress,
    handleConfirmQuit, handleCancelQuit,
    showSettings, setShowSettings,
    // Progression Data
    tableProgress, setTableProgress,
    // unlockedDegrees, setUnlockedDegrees,
    // completedBlackBeltDegrees, setCompletedBlackBeltDegrees,
    // Pre-test specific exports (re-add these)
    preTestSection, setPreTestSection,
    preTestQuestions, setPreTestQuestions,
    preTestCurrentQuestion, setPreTestCurrentQuestion,
    preTestScore, setPreTestScore,
    preTestTimer, setPreTestTimer,
    preTestTimerActive, setPreTestTimerActive,
    preTestResults, setPreTestResults,
    completedSections,
    showPreTestPopup,
    // Passthrough/Misc (omitted for brevity, keep for compatibility)
    navigate, lastQuestion,
    showQuitModal, setShowQuitModal, showSpeedTest,
    speedTestPopupVisible, speedTestPopupAnimation, speedTestNumbers,
    currentSpeedTestIndex, speedTestStartTime, speedTestTimes,
    speedTestComplete, speedTestStarted, speedTestCorrectCount,
    speedTestShowTick, studentReactionSpeed, selectedTheme,
    // currentDegree, setLastQuestion,
    // ... all other original exports ...
  };
};

export default useMathGame;