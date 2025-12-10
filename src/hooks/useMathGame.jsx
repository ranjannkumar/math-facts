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
  userResetProgress,
  userUpdateTheme, 
} from '../api/mathApi.js';

// Constant for inactivity timeout (same as backend, 5000ms)
const INACTIVITY_TIMEOUT_MS = 5000;
const LIGHTNING_GOAL = 100; 

const useMathGame = () => {
  const navigate = useNavigate();

  // ---------- global nav/state ----------
  const [selectedTable, setSelectedTable] = useState(null); // level (1..6)
  const [selectedDifficulty, setSelectedDifficulty] = useState(null); // belt or black-x
  const [quizRunId, setQuizRunId] = useState(null); //  Backend quiz run ID

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
  const [currentQuestion, setCurrentQuestion] = useState(null); // Full question object (from mapQuestionToFrontend)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [maxQuestions, setMaxQuestions] = useState(10);

   const [quizQuestions, setQuizQuestions] = useState([]);

     // --- GAME MODE STATE ---
  const [isGameMode, setIsGameMode] = useState(false);
  const [lightningCount, setLightningCount] = useState(0);
  const [showWayToGoAfterFailure, setShowWayToGoAfterFailure] = useState(false);
  const [gameModeLevel, setGameModeLevel] = useState(1);
  const [shouldExitAfterVideo, setShouldExitAfterVideo] = useState(false);


  // { symbol: '⚡' | '✓' | '✗', isCorrect: boolean }
  const [currentAnswerSymbol, setCurrentAnswerSymbol] = useState(null);

  const [isGameModePractice, setIsGameModePractice] = useState(false); // Flag for client-side practice flow
  const [gameModeInterventionIndex, setGameModeInterventionIndex] = useState(null); // Index of the question that caused intervention


   // --- ADD STREAK STATE ---
   const [currentQuizStreak, setCurrentQuizStreak] = useState(0); // Current streak in the running quiz
   const [transientStreakMessage, setTransientStreakMessage] = useState(null);
   //  calculated position of the streak message above the progress bar
    const [streakPosition, setStreakPosition] = useState(0);

  // Timers
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [dailyTotalMs, setDailyTotalMs] = useState(0); //  Base MS from backend (for daily total calculation)
  const [totalTimeToday, setTotalTimeToday] = useState(0); //  Total accumulated time in seconds
  const [pausedTime, setPausedTime] = useState(0);
  const [isTimerPaused, setIsTimerPaused] = useState(false);

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

   //   DEMO STATE
  //  const [isDemoMode, setIsDemoMode] = useState(false);

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
  const isQuittingRef = useRef(false);
  
  // --- CLIENT-SIDE HELPERS ---

  const determineMaxQuestions = useCallback((difficulty) => {
    if (difficulty && difficulty.startsWith('black')) {
      return 20; 
    }
    return 10;
  }, []);
  
  const hardResetQuizState = useCallback(() => {
    if (inactivityTimeoutId.current) {
      clearTimeout(inactivityTimeoutId.current);
      inactivityTimeoutId.current = null;
    }
    // setChildName('');
    setQuizQuestions([]);
    setQuizRunId(null);
    setPreQuizPracticeItems([]);
    setQuizProgress(0);
    setAnswerSymbols([]);
    // setCorrectCount(0);
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

    setCurrentQuizStreak(0); // Reset quiz streak
    setStreakPosition(0);
    // Also reset sibling check and loading states
    setIsLoginLoading(false); 
    setShowSiblingCheck(false); 
    setLoginPendingName(null);
    setLoginPendingResponse(null);
    setTransientStreakMessage(null);
    // setIsDemoMode(false);

    // Reset Game Mode state
    setIsGameMode(false);
    setLightningCount(0);
    setCurrentAnswerSymbol(null);
    setIsGameModePractice(false);
    setGameModeInterventionIndex(null);
  }, []);

  // --- API / LIFECYCLE ---

   //  Ensure totalTimeToday reflects the daily base time when no quiz is running.
  useEffect(() => {
      if (!quizStartTime) {
          // When the quiz timer is off, totalTimeToday should equal the completed daily total.
          setTotalTimeToday(Math.floor(dailyTotalMs / 1000));
      }
  }, [quizStartTime, dailyTotalMs]); // Triggers on login fetch or quiz completion update.

  // --- Calculate Streak Position whenever quizProgress changes ---
  useEffect(() => {
      // Calculate position as a percentage of the bar width
      // We want the text to align with the END of the progress bar (i.e., at quizProgress)
      // The logic for the bar's width is quizProgress%.
      setStreakPosition(quizProgress);
  }, [quizProgress]);

  // ---  Final step of login, called after sibling check confirmation ---
  const processLoginFinal = useCallback((loginResponse) => {

    // localStorage.setItem('math-child-name', loginResponse.user.name);
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
    setDailyTotalMs(stats?.totalActiveMs || 0); 
    setCorrectCount(stats?.correctCount || 0); 
    setGrandTotalCorrect(stats?.grandTotal || 0); 
    const newStreak = loginResponse.user.currentStreak || 0; 
    setCurrentStreak(newStreak); 

    if (newStreak > 0) {
      setStreakCountToDisplay(newStreak);
      setShowDailyStreakAnimation(true);
      // setTimeout(() => setShowDailyStreakAnimation(false), 2000); 
    }

    // Final Navigation
    if (themeKeyFromBackend && themeKeyFromBackend.length > 0 && themeKeyFromBackend !== 'null') {
         navigate('/levels');
    } else {
         navigate('/theme');
    }

  }, [navigate, setChildName, setTableProgress, setDailyTotalMs, setCorrectCount, setGrandTotalCorrect, setCurrentStreak]);

  //  DISMISS STREAK ANIMATION 
  const handleDailyStreakNext = useCallback(() => {
    setShowDailyStreakAnimation(false);
  }, []);


  // ---Handler for Sibling Check Modal ---
  const handleSiblingCheck = useCallback(async (isConfirmed) => {
    // Clear pending states regardless of the outcome
    setShowSiblingCheck(false);
    
    if (isConfirmed && loginPendingResponse) {
      // YES: Proceed with the final login logic
      processLoginFinal(loginPendingResponse);
    } else {
      // NO: Log out (clear stored PIN/Name) and navigate to the home screen
      localStorage.removeItem('math-child-pin');
      setChildPin('');
      setChildName('');
      navigate('/');
    }
    setLoginPendingName(null);
    setLoginPendingResponse(null);
  }, [navigate, processLoginFinal, setChildPin, setChildName, loginPendingResponse]);
  // --- END  Sibling Check Modal Handler ---

  
  const handlePinSubmit = useCallback(
    async (pinValue,nameValue) => {
      const oldPin = localStorage.getItem('math-child-pin');
      localStorage.setItem('math-child-pin', pinValue);
      setChildPin(pinValue);

      try {
        setIsLoginLoading(true);
        // setIsDemoMode(false);
        // 1. Login first to get user data
       const loginResponse = await authLogin(pinValue, nameValue.trim());
       // ---  SIBLING CHECK LOGIC ---
        // Store the successful login info temporarily
        setLoginPendingName(loginResponse.user.name);
        setLoginPendingResponse(loginResponse);
        setShowSiblingCheck(true);
        setIsLoginLoading(false); // STOP LOADING once we have the response and show the modal
        // --- END SIBLING CHECK LOGIC ---

        // localStorage.setItem('math-child-name', loginResponse.user.name);
        setChildName(loginResponse.user.name);

        // 2. Process results - ADD THEME RETRIEVAL
        const themeKeyFromBackend = loginResponse.user.theme || null;
        setUserThemeKey(themeKeyFromBackend); // Store theme key from backend
        
        // Set the active theme object based on backend
        if (themeKeyFromBackend && themeKeyFromBackend.length > 0) {
            const config = themeConfigs[themeKeyFromBackend];
             if (config) setSelectedTheme({ key: themeKeyFromBackend, ...config });
        } else {
             setSelectedTheme(null); // No theme saved yet
        }
        const progressResponse = loginResponse.user.progress || {};
        const stats = loginResponse.user.dailyStats || {};

        
        // 3. Process results
        setTableProgress(progressResponse);
        
        setDailyTotalMs(stats?.totalActiveMs || 0); 
        setCorrectCount(stats?.correctCount || 0); 
        setGrandTotalCorrect(stats?.grandTotal || 0); // Store Grand Total

        setCurrentStreak(loginResponse.user.currentStreak || 0);

        // navigate('/pre-test-popup');
        if (themeKeyFromBackend && themeKeyFromBackend.length > 0 && themeKeyFromBackend !== 'null') {
             navigate('/levels');
        } else {
             navigate('/theme');
        }

      } catch (e) {
        setIsLoginLoading(false); // STOP LOADING on error
        // localStorage.removeItem('math-child-name');
        localStorage.removeItem('math-child-pin');
        setChildPin('');
        setChildName(''); // Keep the name input value on the screen
        
        throw new Error(e.message || 'Login failed.');
      }
    },
    [navigate, setChildPin, setChildName]
  );

  const handleDemoLogin = useCallback(() => {
    // and save progress/theme like a normal PIN.
    const demoPin = '77777';
    const demoName = 'Demo';
    
    // Call the standard submit handler to handle login, state update, and navigation.
    handlePinSubmit(demoPin, demoName)
        .catch(err => {
            console.error('Demo Login failed:', err.message);
            alert('Demo Login failed: ' + err.message);
        });
        
  }, [handlePinSubmit]);

  //New function to persist theme to backend and navigate
  const updateThemeAndNavigate = useCallback(async (themeObject) => {
      const themeKey = themeObject?.key;
      if (!themeKey) return;
      // 1. Persist to backend (will fail with 403 if theme is already locked)
      try {
          await userUpdateTheme(themeKey, childPin);
          // 2. Update local state
          setUserThemeKey(themeKey); 
          setSelectedTheme(themeObject);
          // 3. Navigate to next screen
          navigate('/levels');
      } catch (e) {
          console.error('Failed to save theme:', e.message);
          // If the failure is due to the theme being locked (403), we still proceed.
          // The selectedTheme is still set to the new one for the current session.
          setSelectedTheme(themeObject);
          navigate('/levels');
      }
  }, [childPin, navigate]);

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
        const {
          questions: backendQuestions,
          resumed = false,
          currentIndex,
          mainFlowCorrect,
          wrong,
        } = await quizStart(idToUse, childPin);

        if (!backendQuestions || backendQuestions.length === 0) {
          throw new Error('No questions returned from quiz start.');
        }

        const mappedQuestions = backendQuestions.map(mapQuestionToFrontend);
        setQuizQuestions(mappedQuestions); // Cache all questions

        // --- Resume support ---
        let startIndex = 0;

        if (resumed && typeof currentIndex === 'number') {
          // Clamp currentIndex into a safe range
          startIndex = Math.min(
            Math.max(currentIndex, 0),
            mappedQuestions.length - 1
          );

          const safeCorrect =
            typeof mainFlowCorrect === 'number' ? mainFlowCorrect : 0;
          const safeWrong = typeof wrong === 'number' ? wrong : 0;

          // Restore score counters
          setSessionCorrectCount(safeCorrect);
          setWrongCount(safeWrong);

          const answeredSoFar = safeCorrect + safeWrong;

          // Restore progress bar based on how many questions were answered
          const totalForProgress =
            maxQuestions ||
            mappedQuestions.length ||
            determineMaxQuestions(selectedDifficulty);

          if (totalForProgress > 0) {
            const restoredProgress = Math.min(
              (answeredSoFar / totalForProgress) * 100,
              100
            );
            setQuizProgress(restoredProgress);
          }
        }

        // Start quiz from the right question
        setCurrentQuestionIndex(startIndex);
        setCurrentQuestion(mappedQuestions[startIndex]);

        // Timer setup
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
    [
      navigate,
      childPin,
      quizRunId,
      mapQuestionToFrontend,
      maxQuestions,
      selectedDifficulty,
      determineMaxQuestions,
    ]
  );


  // 1. Prepare (called from DifficultyPicker/BlackBeltPicker -> startQuizWithDifficulty)
   const startQuizWithDifficulty = useCallback(
    async (difficulty, table) => {
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
        const {
          quizRunId: newRunId,
          practice: practiceItems,
          resumed = false,
        } = await quizPrepare(table, difficulty, childPin);

        setQuizRunId(newRunId);
        setPreQuizPracticeItems(practiceItems || []);

        // Generic learning text; actual questions come from practiceItems
        const content = `${
          difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
        } Belt Quiz at Level ${table}.`;
        setLearningModuleContent(content);

        setIsInitialPrepLoading(false);

        const isBlackBelt = String(difficulty).startsWith('black');

        // If resuming OR no practice items → skip practice and go straight to quiz
        if (!isBlackBelt && !resumed && practiceItems && practiceItems.length > 0) {
          setShowLearningModule(true);
          setIsQuizStarting(false);
          navigate('/learning');
        } else {
          // Black belt, no practice, or resumed quiz
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
    [navigate, childPin, hardResetQuizState, determineMaxQuestions, startActualQuiz]
  );


    // --- Helper: enter GAME MODE after a failed belt ---
  const enterGameModeAfterFailure = useCallback((backendOut) => {
    // Persist belt & table so GameModeExit can restart the same quiz
    if (selectedDifficulty && selectedTable != null) {
      localStorage.setItem('game-mode-belt', selectedDifficulty);
      localStorage.setItem('game-mode-table', String(selectedTable));
    }

    // Update daily stats/progress from backend response so UI stays consistent
    if (backendOut?.dailyStats) {
      const stats = backendOut.dailyStats;
      if (typeof stats.correctCount === 'number') setCorrectCount(stats.correctCount);
      if (typeof stats.totalActiveMs === 'number') setDailyTotalMs(stats.totalActiveMs);
      if (typeof stats.grandTotal === 'number') setGrandTotalCorrect(stats.grandTotal);
      if (typeof stats.currentStreak === 'number') setCurrentStreak(stats.currentStreak);
    }
    if (backendOut?.updatedProgress) {
      setTableProgress(backendOut.updatedProgress);
    }

    // Switch to GAME MODE using the same cached questions
    setIsGameMode(true);
    setLightningCount(0);
    setCurrentQuizStreak(0);
    setTransientStreakMessage(null);
    setCurrentAnswerSymbol(null);
    setShowResult(false);
    setQuizProgress(0);

    // Stop quiz/inactivity logic
    setQuizRunId(null);

    if (quizQuestions && quizQuestions.length > 0) {
      setCurrentQuestionIndex(0);
      setCurrentQuestion(quizQuestions[0]);
      questionStartTimestamp.current = Date.now();
    }

    // Stop the official quiz timer – Game Mode has no score screen
    setQuizStartTime(null);
    setElapsedTime(0);
    setPausedTime(0);
    setIsTimerPaused(false);

    // Show GAME MODE animation first
    navigate('/game-mode-intro', { replace: true });
  }, [
    selectedDifficulty,
    selectedTable,
    quizQuestions,
    navigate,
    setTableProgress,
    setCorrectCount,
    setDailyTotalMs,
    setGrandTotalCorrect,
    setCurrentStreak,
  ]);


  // 3. Answer
  const handleAnswer = useCallback(
    async (selectedAnswer) => {
      if (
        isAnimating ||
        showResult ||
        isTimerPaused ||
        !currentQuestion ||
        (!quizRunId && !isGameMode)
      ) {
        return;
      }

      setIsAnimating(true);
      setTransientStreakMessage(null);

      const now = Date.now();
      const responseMs =
        questionStartTimestamp.current != null
          ? now - questionStartTimestamp.current
          : 0;
      const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
      const timeTaken = responseMs / 1000;

      if (inactivityTimeoutId.current) {
        clearTimeout(inactivityTimeoutId.current);
        inactivityTimeoutId.current = null;
      }

      // Shared streak helpers
      let newQuizStreak = currentQuizStreak;
      let symbol;
      let triggerStreakMessage = null;
      const streakMilestones = [3, 5, 10, 15, 20];

      // ------------ GAME MODE BRANCH ------------
      if (isGameMode) {
        let newLightningCount = lightningCount;

        if (isCorrect) {
          newQuizStreak += 1;

          const isMilestone = streakMilestones.includes(newQuizStreak);

          if (timeTaken <= 1.5) {
            symbol = '⚡';
            newLightningCount += 1;
            if (!isMilestone) {
              audioManager.playLightningSound();
            }
          } else {
            symbol = '✓';
            if (!isMilestone) {
              audioManager.playCompleteSound();
            }
          }

          if (isMilestone) {
            triggerStreakMessage = {
              text: `${newQuizStreak} IN A ROW`,
              symbolType: symbol === '⚡' ? 'lightning' : 'check',
              count: newQuizStreak,
            };
            if (symbol === '⚡') {
              audioManager.playLightningStreakSound?.(newQuizStreak);
            } else {
              audioManager.playStreakSound?.(newQuizStreak);
            }
          }
        } else {
          // Wrong in Game Mode → reset streak, play wrong sound
          newQuizStreak = 0;
          symbol = '✗';
          audioManager.playWrongSound();
          // NEW: Trigger Game Mode Intervention on wrong answer
          setGameModeInterventionIndex(currentQuestionIndex);
          setInterventionQuestion(currentQuestion); // Set the question object for LearningModule
          setIsGameModePractice(true); 
          
          setIsAnimating(false);
          setIsTimerPaused(true); // Pause the client timer during practice
          setPausedTime(Date.now()); // Record pause time

          // Clear any current inactivity timer
          if (inactivityTimeoutId.current) {
              clearTimeout(inactivityTimeoutId.current);
              inactivityTimeoutId.current = null;
          }
          audioManager.stopAll();

          // Navigate to practice/learning module
          navigate('/learning');
          return;
        }

        setCurrentQuizStreak(newQuizStreak);
        setLightningCount(newLightningCount);
        setCurrentAnswerSymbol(
          symbol ? { symbol, isCorrect } : null
        );
        setTransientStreakMessage(triggerStreakMessage);

        if ((newLightningCount % 10) === 0 && newLightningCount !== 0) {

            setIsTimerPaused(true);

            if (newLightningCount >= LIGHTNING_GOAL) {
                setShouldExitAfterVideo(true);
            }

            const targetLevel = gameModeLevel;
            setGameModeLevel(prev => prev + 1);

            navigate(`/game-mode-video/${targetLevel}`, { replace: true });

            setCurrentAnswerSymbol(null);
            if (triggerStreakMessage) setTransientStreakMessage(null);

            setIsAnimating(false);
            return;
        }


        if (newLightningCount >= LIGHTNING_GOAL) {
         try {
            // Send the last answer with forcePass = true
            if (childPin) {
              await quizSubmitAnswer(
                quizRunId, 
                currentQuestion.id,                 
                selectedAnswer,             
                responseMs,                 
                selectedTable,              // level
                selectedDifficulty,         // belt or degree
                childPin,
                true                        // forcePass for this answer
              );
            }
          } catch (e) {
            console.error('Failed to send forcePass answer in Game Mode:', e);
          }

          setIsAnimating(false);
          setIsGameMode(false);

          if (newLightningCount % 10 === 0) {
              setShouldExitAfterVideo(true);

              setIsTimerPaused(true);
              return;
          }

          // CASE B: Not aligned → exit immediately
          setShouldExitAfterVideo(false);
          navigate('/game-mode-exit', { replace: true });
          return;
        }

        // Rotate through the SAME quiz questions endlessly
        if (quizQuestions && quizQuestions.length > 0) {
          const nextIndex =
            (currentQuestionIndex + 1) % quizQuestions.length;
          const nextQuestion = quizQuestions[nextIndex];

          // Wait a bit so tick/⚡ is visible, then move to next question and clear symbol
          setTimeout(() => {
            setCurrentQuestionIndex(nextIndex);
            setCurrentQuestion(nextQuestion);
            questionStartTimestamp.current = Date.now();
            setCurrentAnswerSymbol(null);
            if (triggerStreakMessage) {
              setTransientStreakMessage(null);
            }
            setIsAnimating(false);
          }, 400);
        } else {
          // Defensive: no cached questions, just unlock UI
          setIsAnimating(false);
        }

        return; 
      }

      // NORMAL QUIZ BRANCH 

      const questionId = currentQuestion.id;

      // For normal quiz, still track answer history and progress bar
      const nextIndex = currentQuestionIndex + 1;
      const newProgress = Math.min(nextIndex * (100 / maxQuestions), 100);

      if (isCorrect) {
        newQuizStreak += 1;
        const isStreakMilestoneHit = streakMilestones.includes(newQuizStreak);

        if (timeTaken <= 1.5) {
          symbol = '⚡';
          if (!isStreakMilestoneHit) {
            audioManager.playLightningSound();
          }
        } else {
          symbol = '✓';
          if (!isStreakMilestoneHit) {
            audioManager.playCompleteSound();
          }
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
        setAnswerSymbols((prev) => [
          ...prev,
          { symbol, isCorrect: true, timeTaken },
        ]);
        setSessionCorrectCount((s) => s + 1);
      } else {
        newQuizStreak = 0;
        setCurrentQuizStreak(0);
        symbol = '';
        audioManager.playWrongSound();
        setWrongCount((w) => w + 1);
        setAnswerSymbols((prev) => [
          ...prev,
          { symbol, isCorrect: false, timeTaken },
        ]);
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
        if (triggerStreakMessage) {
          setTimeout(() => setTransientStreakMessage(null), 500);
        }
      }

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

        if (out.completed) {
          // Server signals quiz completion (pass or fail)
          const totalTimeMs =
            out.summary?.totalActiveMs || elapsedTime * 1000;
          const sessionTimeSeconds = Math.round(totalTimeMs / 1000);

          setIsAnimating(false);
          localStorage.setItem(
            'math-last-quiz-duration',
            sessionTimeSeconds
          );
          setQuizStartTime(null);
          setSessionCorrectCount(out.sessionCorrectCount || 0);

          if (out.dailyStats) {
            setCorrectCount(out.dailyStats.correctCount);
            setDailyTotalMs(out.dailyStats.totalActiveMs);
            if (out.dailyStats.grandTotal !== undefined) {
              setGrandTotalCorrect(out.dailyStats.grandTotal);
            }
            if (out.dailyStats.currentStreak !== undefined) {
              setCurrentStreak(out.dailyStats.currentStreak);
            }
          }
          if (out.updatedProgress) {
            setTableProgress(out.updatedProgress);
          }

          if (out.passed) {
            //  Passed belt → normal Results flow
            setShowResult(true);
            navigate('/results', {
              replace: true,
              state: { sessionTimeSeconds },
            });
          } else {
                if (selectedDifficulty && selectedTable != null) {
                    localStorage.setItem('game-mode-belt', selectedDifficulty);
                    localStorage.setItem('game-mode-table', String(selectedTable));
              } else {
                  console.log("FAIL DEBUG — no selectedDifficulty/table at fail moment:", {
                      selectedDifficulty, selectedTable
                });
                }
           // 1️ Stop quiz timer
            setIsAnimating(false);
            setQuizStartTime(null);

            // 2️ Save session for WayToGo page
            setSessionCorrectCount(out.sessionCorrectCount || 0);
            localStorage.setItem('math-last-quiz-duration', Math.round((out.summary?.totalActiveMs || 0) / 1000));

            // 3️ Set flag so WayToGo knows this is a failed quiz
            setShowWayToGoAfterFailure(true);

            // 4️ Navigate to Way-To-Go screen
            navigate('/way-to-go');
          }
        } else if (out.practice) {
          // Incorrect answer triggers intervention learning
          setIsTimerPaused(true);
          setPausedTime(Date.now());
          setInterventionQuestion(mapQuestionToFrontend(out.practice));
          setShowLearningModule(true);
          navigate('/learning');
          setIsAnimating(false);
        } else if (uiAdvancedOptimistically) {
          if (out.dailyStats) {
            setCorrectCount(out.dailyStats.correctCount);
            setDailyTotalMs(out.dailyStats.totalActiveMs);
            if (out.dailyStats.grandTotal !== undefined) {
              setGrandTotalCorrect(out.dailyStats.grandTotal);
            }
            if (out.dailyStats.currentStreak !== undefined) {
              setCurrentStreak(out.dailyStats.currentStreak);
            }
            setQuizStartTime(Date.now());
          }
          setIsAnimating(false);
        } else {
          console.warn(
            'Quiz is in an unexpected non-terminal, non-advancing state.'
          );
          setIsAnimating(false);
        }
      } catch (e) {
        console.error('Quiz Answer/State update failed:', e.message);

        if (
          String(e.message || '')
            .toLowerCase()
            .includes('not the current question')
        ) {
          setIsAnimating(false);
          return;
        }

        setIsAnimating(false);
        alert('Error during quiz: ' + (e.message || 'Unknown error'));
        navigate('/belts');
      }
    },
    [
      currentQuestion,
      isAnimating,
      showResult,
      isTimerPaused,
      quizRunId,
      childPin,
      selectedTable,
      selectedDifficulty,
      navigate,
      maxQuestions,
      quizQuestions,
      currentQuestionIndex,
      currentQuizStreak,
      answerSymbols,
      elapsedTime,
      isGameMode,
      lightningCount,
      enterGameModeAfterFailure,
      setInterventionQuestion,
    ]
  );

  
  // 4. Handle Practice Answer Submission (for LearningModule intervention)
  const handlePracticeAnswer = useCallback(async (questionId, answer) => {

    //  Handle Game Mode Practice Client-Side
    if (isGameMode && isGameModePractice) {
      audioManager.stopAll();
        // We rely on the context's `interventionQuestion` which holds the question to be practiced.
        const practiceQuestion = interventionQuestion;

        if (!practiceQuestion) {
            console.error('No intervention question found for game mode practice resume.');
             // Fallback: End practice, resume game mode on current question
             if (pausedTime) setQuizStartTime((prev) => (prev ? prev + (Date.now() - pausedTime) : prev));
             setIsTimerPaused(false);
             setInterventionQuestion(null);
             setShowLearningModule(false);
             setIsGameModePractice(false);
             setGameModeInterventionIndex(null);
             navigate('/game-mode', { replace: true });
            return { stillPracticing: false, completed: false, resume: true };
        }
        
        const isCorrect = answer === practiceQuestion.correctAnswer;
        
        if (isCorrect) {
            // Success: Resume Game Mode on the next question
            const questionsArray = quizQuestions; 
            // The intervention index is the index of the question that *caused* the practice
            const nextIndex = (gameModeInterventionIndex + 1) % questionsArray.length;
            const nextQuestion = questionsArray[nextIndex];
            
            // 1. Update state to resume
            setCurrentQuestion(nextQuestion);
            setCurrentQuestionIndex(nextIndex);
            setInterventionQuestion(null);
            setShowLearningModule(false);
            setIsGameModePractice(false);
            setGameModeInterventionIndex(null);

            // 2. Resume timer by correcting quizStartTime
            questionStartTimestamp.current = Date.now();
            if (pausedTime) setQuizStartTime((prev) => (prev ? prev + (Date.now() - pausedTime) : prev));
            setIsTimerPaused(false);
            
            // 3. Navigate back to Game Mode
            // navigate('/game-mode', { replace: true });
            return { resume: true, next: nextQuestion }; // Mock resume response
            
        } else {
            // Incorrect: Keep the practice flow going (LearningModule handles re-showing fact)
            // audioManager.stopAll();
            return { stillPracticing: true, completed: false };
        }
    }

    if (!quizRunId || !childPin) {
      console.error('Quiz not active for practice answer.');
      return { stillPracticing: true, completed: false };
    }
    
    try {
      const out = await quizPracticeAnswer(quizRunId, questionId, answer, childPin);

       if (out.completed) { 
        // This path is triggered when the practice answer is correct on the *last* question,
        // leading to quiz failure/completion (WayToGoScreen navigation) on the backend.
        
        setQuizStartTime(null); // Stop timer
        setIsTimerPaused(false);
        setElapsedTime(0);
        
        //  Update session score from backend response before LearningModule navigates
        setSessionCorrectCount(out.sessionCorrectCount || 0); 
        
        return out; 
      } 
      
      if (out.resume) {
        // Correct answer, quiz is resumed/cleared on backend.
        setIsTimerPaused(false);
        // Resume timer client-side by correcting quizStartTime
        if (pausedTime) setQuizStartTime((prev) => (prev ? prev + (Date.now() - pausedTime) : prev));
        if (out.next) {
            setCurrentQuestion(mapQuestionToFrontend(out.next));
            setCurrentQuestionIndex(prev => prev + 1); // Increment index to match the server
            // Ensure timestamp is reset for the new question
            questionStartTimestamp.current = Date.now();
        }
        setInterventionQuestion(null);
        setShowLearningModule(false);
      }

      return out;
    } catch (e) {
      console.error('Practice submission failed:', e.message);
      // If server failed for some reason, re-pause the timer and keep asking
      setIsTimerPaused(true);
      setPausedTime(Date.now());
      return { stillPracticing: true, error: e.message };
    }
  }, [quizRunId, 
    childPin, 
    pausedTime, 
    isGameMode, 
    isGameModePractice, 
    interventionQuestion, 
    quizQuestions, 
    gameModeInterventionIndex, 
    setCurrentQuestion, 
    setCurrentQuestionIndex, 
    setInterventionQuestion, 
    setShowLearningModule, 
    setIsGameModePractice, 
    setGameModeInterventionIndex, 
    navigate, 
    setQuizStartTime]);


  // 5. Inactivity Timer Effect
  useEffect(() => {
    if (isQuittingRef.current) {
      if (inactivityTimeoutId.current) {
        clearTimeout(inactivityTimeoutId.current);
        inactivityTimeoutId.current = null;
      }
      return;     
    }

    // if (!currentQuestion || isTimerPaused || showResult || !quizRunId) {
    //   if (inactivityTimeoutId.current) {
    //     clearTimeout(inactivityTimeoutId.current);
    //     inactivityTimeoutId.current = null;
    //   }
    //   return;
    // }

    // Check if we are in normal quiz (quizRunId) or Game Mode
    const isActiveScreen = (!!quizRunId || isGameMode) && !!currentQuestion && !isTimerPaused && !showResult;
    
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

        // ---------------- NEW: GAME MODE INACTIVITY INTERVENTION ----------------
      if (isGameMode) {
          console.log('Game Mode Inactivity Triggered.');
          setAnswerSymbols((prev) => [
              ...prev, 
              { symbol: '!', isCorrect: false, timeTaken: INACTIVITY_TIMEOUT_MS / 1000, reason: 'inactivity-gm' }
          ]);
          setCurrentQuizStreak(0);
          setTransientStreakMessage(null);
          
          setGameModeInterventionIndex(currentQuestionIndex);
          setInterventionQuestion(currentQuestion); // Set the question object for LearningModule
          setIsGameModePractice(true); 
          
          setIsTimerPaused(true); // Pause the client timer during practice
          setPausedTime(Date.now()); // Record pause time

          navigate('/learning');
          return;
      }
      // ---------------- END NEW: GAME MODE INACTIVITY INTERVENTION


        setAnswerSymbols((prev) => [
            ...prev, 
            { symbol: '', isCorrect: false, timeTaken: INACTIVITY_TIMEOUT_MS / 1000, reason: 'inactivity' }
        ]);

        //  Advance progress bar for inactivity failure ---
        // const nextIndex = currentQuestionIndex + 1;
        // const newProgress = Math.min(nextIndex * (100 / maxQuestions), 100);
        // setQuizProgress(newProgress);
        // Set block flag immediately before API call 
        setIsAwaitingInactivityResponse(true);
        try {
            const out = await quizHandleInactivity(quizRunId, currentQuestion.id, childPin);
            if (isQuittingRef.current) {
                console.log('Inactivity API response returned, but quit confirmed. Aborting navigation.');
                setIsAwaitingInactivityResponse(false);
                return; 
            }
            setCurrentQuizStreak(0);
            setTransientStreakMessage(null);

            if (out.completed) {
                // Treat as failed belt → enter GAME MODE
                // setQuizStartTime(null); // Stop timer
                // setSessionCorrectCount(out.sessionCorrectCount || 0);
                // setIsAwaitingInactivityResponse(false);
                // enterGameModeAfterFailure(out);
                // return;

                 if (selectedDifficulty && selectedTable != null) {
                    localStorage.setItem('game-mode-belt', selectedDifficulty);
                    localStorage.setItem('game-mode-table', String(selectedTable));
              } else {
                  console.log("FAIL DEBUG — no selectedDifficulty/table at fail moment:", {
                      selectedDifficulty, selectedTable
                });
                }
                setQuizStartTime(null);

                  // 2️ Save session score and time for WayToGo
                  setSessionCorrectCount(out.sessionCorrectCount || 0);
                  localStorage.setItem(
                      'math-last-quiz-duration',
                      Math.round((out.summary?.totalActiveMs || 0) / 1000)
                  );

                  // 3️ Show Way-To-Go (same as wrong-answer fail)
                  // setShowWayToGoAfterFailure(true);

                  setIsAwaitingInactivityResponse(false);

                  // 4️ Navigate to Way-To-Go screen
                  // navigate('/way-to-go');
                  // return;
            }

            
            if (out.practice) {
              if (isQuittingRef.current) {
              console.log("Quit in progress, ignoring practice navigation.");
              setIsAwaitingInactivityResponse(false);
              return;
             }
                setIsTimerPaused(true);
                setPausedTime(Date.now());
                setInterventionQuestion(mapQuestionToFrontend(out.practice));
                setShowLearningModule(true);
                setIsAwaitingInactivityResponse(false);
                navigate('/learning');
            }
        } catch(e) {
            console.error('Inactivity API failed:', e.message);
            setIsTimerPaused(true);
            setPausedTime(Date.now());
            setIsAwaitingInactivityResponse(false);
            navigate('/');
        }
    }, INACTIVITY_TIMEOUT_MS); 

    return () => {
      if (inactivityTimeoutId.current) {
          clearTimeout(inactivityTimeoutId.current);
          inactivityTimeoutId.current = null;
      }
    };
  }, [currentQuestion, isTimerPaused, showResult, quizRunId, childPin, navigate, enterGameModeAfterFailure, isGameMode, currentQuestionIndex, setInterventionQuestion, setIsGameModePractice, setGameModeInterventionIndex]);


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


  const handleConfirmQuit = useCallback(() =>{ 
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
        // 1. Reset progress on the backend (clear DB data)
        await userResetProgress(childPin);
      } catch (e) {
        console.error('Backend progress reset failed:', e.message);
        // Continue to client-side reset/logout even if backend failed
      }
    }
    
    // 2. Reset client-side state and logout (clear local storage)
    localStorage.clear();
    hardResetQuizState();
    setChildPin('');
    setChildName('');
    setChildAge('');
    setTableProgress({});
    setShowResetModal(false); // Close the modal
    navigate('/', { replace: true }); // Use replace to prevent back button from returning to previous screen
  }, [navigate, hardResetQuizState, childPin]);


  const handleNameChange = useCallback((e) => setChildName(e.target.value), []);
  const handleAgeChange = useCallback((e) => setChildAge(e.target.value), []);
  const handlePinChange = useCallback((e) => setChildPin(e.target.value), []);

  // --- Define getQuizTimeLimit logic ---
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
    transientStreakMessage,
    streakPosition, 
    tempNextRoute,
    setTempNextRoute,

        // GAME MODE
    isGameMode,
    setIsGameMode,
    lightningCount,
    setLightningCount,
    currentAnswerSymbol,
    setCurrentAnswerSymbol,
    LIGHTNING_GOAL,
    isGameModePractice,
    gameModeInterventionIndex,
    showWayToGoAfterFailure,
    setShowWayToGoAfterFailure,
    questionStartTimestamp, 
    shouldExitAfterVideo,
    setShouldExitAfterVideo,


    // UI & Progress
    isAnimating, setIsAnimating,
    showResult, setShowResult,
    quizProgress, setQuizProgress,
    correctCount, setCorrectCount, // Daily total correct count
    sessionCorrectCount, // Session correct count (for result screens)
    grandTotalCorrect, // New Grand Total Correct Count
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
    totalTimeToday, //  Export total time today for MainLayout/SessionTimer
    getQuizTimeLimit: () => quizTimeLimit,
    // Learning/Practice
    isInitialPrepLoading,
    isQuizStarting,
    setIsQuizStarting,
    isAwaitingInactivityResponse,
    showLearningModule, setShowLearningModule,
    learningModuleContent, setLearningModuleContent,
    pendingDifficulty, setPendingDifficulty,
    preQuizPracticeItems, setPreQuizPracticeItems,
    interventionQuestion, setInterventionQuestion,
    handlePracticeAnswer, //  Function for intervention practice submission
    // Identity & Settings
    childName, setChildName, handleNameChange,
    childAge, setChildAge, handleAgeChange,
    childPin, setChildPin, handlePinChange,
    handlePinSubmit,
    handleDemoLogin,
    userSavedThemeKey: userThemeKey, // EXPOSED: Key to check if theme is locked
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
    handleConfirmReset, handleCancelReset,
    handleConfirmQuit, handleCancelQuit,
    handleQuit: handleInitiateQuit,
    showQuitModal, setShowQuitModal, showResetModal, setShowResetModal,
    showSettings, setShowSettings,
    // Progression Data
    tableProgress, setTableProgress,
    preTestSection, setPreTestSection,
    preTestQuestions, setPreTestQuestions,
    preTestCurrentQuestion, setPreTestCurrentQuestion,
    preTestScore, setPreTestScore,
    preTestTimer, setPreTestTimer,
    preTestTimerActive, setPreTestTimerActive,
    preTestResults, setPreTestResults,
    completedSections,
    showPreTestPopup,
    navigate, lastQuestion,
    showSpeedTest,
    speedTestPopupVisible, speedTestPopupAnimation, speedTestNumbers,
    currentSpeedTestIndex, speedTestStartTime, speedTestTimes,
    speedTestComplete, speedTestStarted, speedTestCorrectCount,
    speedTestShowTick, studentReactionSpeed, 
    currentStreak, 
    hardResetQuizState,
    selectedDifficulty,
    selectedTable,
    sessionCorrectCount,
    setSessionCorrectCount,


  };
};

export default useMathGame;