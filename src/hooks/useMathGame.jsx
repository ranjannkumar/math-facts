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
    // setIsDemoMode(false);
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
          console.error("Cannot start quiz: quizRunId is missing.");
           setIsQuizStarting(false);
          navigate('/belts');
          return;
      }
      try {
       const { questions: backendQuestions } = await quizStart(idToUse, childPin);

        if (!backendQuestions || backendQuestions.length === 0) throw new Error("No questions returned from quiz start.");
        const mappedQuestions = backendQuestions.map(mapQuestionToFrontend);
        setQuizQuestions(mappedQuestions); // Cache all questions
        setCurrentQuestionIndex(0);
        setCurrentQuestion(mappedQuestions[0]); // Set first question

        setQuizStartTime(Date.now());
        questionStartTimestamp.current = Date.now();
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
    [navigate, childPin, quizRunId, mapQuestionToFrontend]
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
      if( String(difficulty).startsWith('black')) {
        setIsInitialPrepLoading(false);
      }

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

        setIsInitialPrepLoading(false);
        
        //  Implement Black Belt skip logic
        const isBlackBelt = String(difficulty).startsWith('black');

        if (!isBlackBelt && practiceItems && practiceItems.length > 0) {
          setShowLearningModule(true);
          setIsQuizStarting(false);
          navigate('/learning');
        } else {
          // Black Belt or no practice items, go straight to quiz start
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

  // 3. Answer
  const handleAnswer = useCallback(
    async (selectedAnswer) => {
      if (isAnimating || showResult || isTimerPaused || !currentQuestion || !quizRunId) return;
      setIsAnimating(true);
      setTransientStreakMessage(null);
      
      const responseMs = Date.now() - questionStartTimestamp.current;
      const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
      const questionId = currentQuestion.id;
      
      if (inactivityTimeoutId.current) {
        clearTimeout(inactivityTimeoutId.current);
        inactivityTimeoutId.current = null;
      }

     // --- STREAK TRACKING ---
      let newQuizStreak = currentQuizStreak;
      let symbol;
      let triggerStreakMessage = null; 
      const timeTaken = responseMs / 1000;
      const streakMilestone = [3,5,10,15,20]; // Milestones to check
       // Calculate next progress step for streak positioning
      const nextIndex = currentQuestionIndex + 1;
      const newProgress = Math.min(nextIndex * (100 / maxQuestions), 100);
      // const isStreakMilestoneHit = streakMilestone.includes(newQuizStreak);
      // --- END STREAK TRACKING ---
      
      // Update client-side UI first (optimistic symbol)
       if (isCorrect) {
        newQuizStreak += 1; // Increment streak
        const isStreakMilestoneHit = streakMilestone.includes(newQuizStreak);
        
        // Determine symbol and color
        if (timeTaken <= 1.5) {
            symbol = '⚡';
            // Only play 'lightning' sound if it's NOT a streak milestone.
            if (!isStreakMilestoneHit) { 
                 audioManager.playLightningSound();
            } 
        } 
        else {
            symbol = '✓';
            // Only play 'complete' sound if it's NOT a streak milestone.
            if (!isStreakMilestoneHit) {
                audioManager.playCompleteSound();
            } 
        }

       // Check for streak milestone (3, 5, 10)
        if (isStreakMilestoneHit) {
            // Check previous symbols to see if the streak is "perfect" (all lightning)
            // Use the last (N-1) symbols from answerSymbols + the current one
            const streakSlice = answerSymbols.slice(-newQuizStreak + 1);
            const isLightningStreak = streakSlice.every(a => a.symbol === '⚡') && symbol === '⚡';
            
            triggerStreakMessage = {
                text: `${newQuizStreak} IN A ROW`,
                symbolType: isLightningStreak ? 'lightning' : 'check', // 'lightning' or 'check'
                count: newQuizStreak,
            };
               // Play streak sound ---
            if (isLightningStreak) {
                audioManager.playLightningStreakSound(newQuizStreak);
            } else {
                audioManager.playStreakSound(newQuizStreak);
            }
        }
        // Update streak states
        setCurrentQuizStreak(newQuizStreak);
        setAnswerSymbols((prev) => [...prev, { symbol, isCorrect: true, timeTaken }]);
        // setQuizProgress((prev) => Math.min(prev + 100 / maxQuestions, 100));
        // setQuizProgress(newProgress); 
        setSessionCorrectCount(s => s + 1); // Optimistically update session score
      } else {
        // Wrong answer: Reset streak
        newQuizStreak = 0;
        setCurrentQuizStreak(0);
        symbol = '';
        audioManager.playWrongSound();
        setWrongCount((w) => w + 1);
        setAnswerSymbols((prev) => [...prev, { symbol, isCorrect: false, timeTaken }]);
        setTransientStreakMessage(null);
      }

      setQuizProgress(newProgress);
      
      // ---   UI ADVANCE FOR INSTANT TRANSITION ---
      // const nextIndex = currentQuestionIndex + 1;
      let uiAdvancedOptimistically = false;
      
      if (isCorrect && nextIndex < quizQuestions.length) {
          // Immediately update UI to the next question
          setCurrentQuestion(quizQuestions[nextIndex]); 
          setCurrentQuestionIndex(nextIndex);
          questionStartTimestamp.current = Date.now();

          // Set the transient streak message if triggered, and clear it on the new question.
          setTransientStreakMessage(triggerStreakMessage); 
          
          // Unlock the UI immediately (before the slow API call returns)
          // setIsAnimating(false); 
          uiAdvancedOptimistically = true;
          
          // Optimistically update session score for accurate UI display 
          setSessionCorrectCount(s => s + 1);
      } else {
          // Last question answered (correctly or incorrectly)
          // setIsAnimating(false);
          setTransientStreakMessage(triggerStreakMessage); 
          if (triggerStreakMessage) {
               // If it's the last question, clear the message quickly so it doesn't linger 
              setTimeout(() => setTransientStreakMessage(null), 500); 
          }
      }
      // ---  UI ADVANCE ---
      
      // Send answer to backend to get next state (Awaited for terminal/stat updates)
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

          // --- HANDLE SERVER RESPONSE (For terminal states and authoritative stats) ---
          
          if (out.completed) {
              // Server signals completion (either perfect score or black belt failure/intervention failure)
              const totalTimeMs = out.summary?.totalActiveMs || (elapsedTime * 1000);
              const sessionTimeSeconds = Math.round(totalTimeMs / 1000); 
              
              // Ensure UI is unlocked
              setIsAnimating(false);

              localStorage.setItem('math-last-quiz-duration', sessionTimeSeconds);
              setShowResult(true);
              setQuizStartTime(null);  
              
              // Set final authoritative scores
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
              navigate(out.passed ? '/results' : '/way-to-go', { replace: true,state: { sessionTimeSeconds } });
              
          } else if (out.practice) {
              // Incorrect answer (or inactivity fail on non-black belt), triggers intervention
              // This is necessary because optimistic advance should not happen on incorrect/intervention.
              
              // Set state for intervention
              setIsTimerPaused(true);
              setPausedTime(Date.now());
              setInterventionQuestion(mapQuestionToFrontend(out.practice));
              setShowLearningModule(true);
              
              // Navigate and ensure UI is unlocked
              navigate('/learning');
              setIsAnimating(false); 

          } else if (uiAdvancedOptimistically) {
              // UI already advanced. Server confirmed 'continue' and sent stats.
              // Only update authoritative stats.
              if (out.dailyStats) {
                  setCorrectCount(out.dailyStats.correctCount);
                  setDailyTotalMs(out.dailyStats.totalActiveMs);
                  if (out.dailyStats.grandTotal !== undefined) {
                      setGrandTotalCorrect(out.dailyStats.grandTotal); 
                  }
                  if (out.dailyStats.currentStreak !== undefined) {
                      setCurrentStreak(out.dailyStats.currentStreak); 
                  }
                  setQuizStartTime(Date.now()); // Ensure timer base is correct
              }
              setIsAnimating(false);
          } else {
              // Fallback for non-optimistic, non-terminal cases (should not occur if logic is right)
               console.warn("Quiz is in an unexpected non-terminal, non-advancing state.");
               setIsAnimating(false);
          }
      } catch (e) {
         console.error('Quiz Answer/State update failed:', e.message);

          // Benign race: ignore quietly and just unlock UI
          if (String(e.message || '').toLowerCase().includes('not the current question')) {
            setIsAnimating(false);
            return;
          }

          // Real errors: show a message and navigate away if that’s your current flow
          setIsAnimating(false);
          alert('Error during quiz: ' + (e.message || 'Unknown error'));
          navigate('/belts');
      }

    },
    [currentQuestion, isAnimating, showResult, isTimerPaused, quizRunId, childPin, selectedTable, selectedDifficulty, navigate, maxQuestions, quizQuestions, currentQuestionIndex,currentQuizStreak]
  );
  
  // 4. Handle Practice Answer Submission (for LearningModule intervention)
  const handlePracticeAnswer = useCallback(async (questionId, answer) => {
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
  }, [quizRunId, childPin, pausedTime]);


  // 5. Inactivity Timer Effect
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
      audioManager.playSoftClick();
      setAnswerSymbols((prev) => [
            ...prev, 
            { symbol: '', isCorrect: false, timeTaken: INACTIVITY_TIMEOUT_MS / 1000, reason: 'inactivity' }
        ]);
        if (inactivityTimeoutId.current) {
            clearTimeout(inactivityTimeoutId.current);
            inactivityTimeoutId.current = null;
        }

        //  Advance progress bar for inactivity failure ---
        // const nextIndex = currentQuestionIndex + 1;
        // const newProgress = Math.min(nextIndex * (100 / maxQuestions), 100);
        // setQuizProgress(newProgress);
        // Set block flag immediately before API call 
        setIsAwaitingInactivityResponse(true);
        try {
            const out = await quizHandleInactivity(quizRunId, currentQuestion.id, childPin);
            setCurrentQuizStreak(0);
            setTransientStreakMessage(null);

             if (out.completed) { // Check for immediate completion flag
                 // Black belt immediate failure due to inactivity/time up (handled by backend logic)
                setQuizStartTime(null); // Stop timer
                setSessionCorrectCount(out.sessionCorrectCount || 0);
                setIsAwaitingInactivityResponse(false);
                // navigate to way-to-go on inactivity fail for black belt
                navigate('/way-to-go', { replace: true });
                return;
            }
            
            if (out.practice) {
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
    navigate('/');
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

  };
};

export default useMathGame;