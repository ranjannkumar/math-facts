// ranjannkumar/math-facts/math-facts-53836cb507e63890a9c757d863525a6cb3341e86/src/components/LearningModule.jsx
import { useContext, useEffect, useMemo, useState } from 'react';
import { mapQuestionToFrontend } from '../api/mathApi.js';
import { MathGameContext } from '../App.jsx';
import audioManager from '../utils/audioUtils.js';
import { normalizeDifficulty } from '../utils/mathGameLogic.js';

/**
 * Learning flow:
 * Pre-Quiz: Fact#1 (from /prepare) -> Practice#1 -> Fact#2 -> Practice#2 -> Start Quiz
 * Intervention: Intervention Question -> Practice -> Resume Quiz
 */

// ---- verbalize maths facts (pleasant voice) ----

// Cache across renders
let _cachedVoices = [];
let _cachedPreferredVoice = null;

const loadVoices = () =>
  new Promise((resolve) => {
    try {
      const synth = window?.speechSynthesis;
      if (!synth) return resolve([]);
      let voices = synth.getVoices();
      if (voices && voices.length) return resolve(voices);

      // voices load async on many browsers
      const onVoicesChanged = () => {
        voices = synth.getVoices();
        synth.removeEventListener?.('voiceschanged', onVoicesChanged);
        resolve(voices || []);
      };
      synth.addEventListener?.('voiceschanged', onVoicesChanged);
      // Fallback timeout
      setTimeout(() => {
        synth.removeEventListener?.('voiceschanged', onVoicesChanged);
        resolve(synth.getVoices() || []);
      }, 1200);
    } catch {
      resolve([]);
    }
  });

/**
 * Try to pick a modern, pleasant, natural voice.
 * Priority list includes Google/Microsoft/iOS high-quality voices.
 */
function choosePleasantVoice(voices) {
  if (!voices?.length) return null;

  // Normalized name matcher
  const n = (v) => (v?.name || '').toLowerCase();

  // 1) Hard-preferred voices (very natural on Chrome/Edge/iOS/macOS)
  const preferredNames = [
    // Google voices (Chrome)
    'google us english', 'google uk english female', 'google uk english male',
    // Microsoft neural voices (Edge on Windows)
    'microsoft aria online', 'microsoft aria', 'microsoft jenny online', 'microsoft jenny',
    // Apple voices (Safari/macOS/iOS)
    'samantha', 'victoria', 'serena', 'karen', 'olivia', 'ava'
  ];

  for (const pname of preferredNames) {
    const hit = voices.find(v => n(v).includes(pname));
    if (hit) return hit;
  }

  // 2) Prefer en-US / en-GB female-like voices
  const enVoices = voices.filter(v =>
    (v.lang || '').toLowerCase().startsWith('en') || /english/i.test(v.lang || v.name)
  );

  // Some engines mark "female" in name/voiceURI
  const likelyPleasant = enVoices.find(v =>
    /female|samantha|victoria|serena|karen|aria|jenny/i.test(v.name + ' ' + v.voiceURI)
  );
  if (likelyPleasant) return likelyPleasant;

  // 3) Otherwise just grab first good English voice
  return enVoices[0] || voices[0] || null;
}

/** Build a natural sentence from a fact like "0 + 1 = 1" */
const buildSpokenFact = (q) => {
  if (!q) return '';
  const expr = String(q.question ?? '').trim();
  const cleaned = expr.replace(/\s+/g, '');

  // Accept + - x × * / ÷
  const m = cleaned.match(/^(-?\d+)\s*([+\-x×*/÷])\s*(-?\d+)$/i);
  if (m) {
    const a = m[1];
    const op = m[2];
    const b = m[3];
    const opWord =
      op === '+' ? 'plus' :
      op === '-' ? 'minus' :
      (op === 'x' || op === '×' || op === '*') ? 'times' :
      (op === '/' || op === '÷') ? 'divided by' : '';
    return `${a} ${opWord} ${b} equals ${q.correctAnswer}`;
  }

  // Fallback
  return `${expr} equals ${q.correctAnswer}`;
};

const stopSpeaking = () => {
  try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch {}
};

const speak = async (text) => {
  try {
    if (!('speechSynthesis' in window) || !text) return;
    const synth = window.speechSynthesis;

    // Cancel anything already speaking
    synth.cancel();

    // Load/cache voices
    if (!_cachedVoices.length) _cachedVoices = await loadVoices();
    if (!_cachedPreferredVoice) _cachedPreferredVoice = choosePleasantVoice(_cachedVoices);

    const u = new SpeechSynthesisUtterance(text);

    // Assign the pleasant voice if found
    if (_cachedPreferredVoice) u.voice = _cachedPreferredVoice;

    // Tuned for clarity & warmth
    u.lang = (u.voice?.lang) || 'en-US';
    u.rate = 0.95;   // slightly slower than default
    u.pitch = 1.0;   // natural
    u.volume = 1.0;  // full volume

    synth.speak(u);
  } catch {}
};



const LearningModule = () => {
  const {
    pendingDifficulty,
    selectedTable,
    setShowLearningModule,
    startActualQuiz,
    navigate,
    interventionQuestion,
    setInterventionQuestion,
    preQuizPracticeItems, 
    quizRunId,
    handlePracticeAnswer, 
    isQuizStarting,     // <--- ADD THIS LINE
    setIsQuizStarting,
    isGameMode,
    isGameModePractice,
    setIsAnimating,
    setQuizStartTime,
    setSessionCorrectCount,
    setShowWayToGoAfterFailure,
    selectedDifficulty,
  } = useContext(MathGameContext);

  const diff = useMemo(() => normalizeDifficulty(pendingDifficulty), [pendingDifficulty]);

  const [isShowingFact, setIsShowingFact] = useState(true);
  const [currentPracticeIndex, setCurrentPracticeIndex] = useState(0);
  const [practiceQ, setPracticeQ] = useState(null); 
  const [practiceMsg, setPracticeMsg] = useState('');
  const [showAdvanceButton, setShowAdvanceButton] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null); // Tracks the button click answer
  const [typedInput, setTypedInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [practiceStatus, setPracticeStatus] = useState(null); // null | 'success' | 'error'
  // const [isStartingQuiz, setIsStartingQuiz] = useState(false); // Prevent double starts 

  const isIntervention = !!interventionQuestion;
  const isPreQuizFlow = !isIntervention && preQuizPracticeItems?.length > 0;

  const [isClosing, setIsClosing] = useState(false);

  // Warm up voices once so the first spoken fact uses the pleasant voice
useEffect(() => {
  (async () => {
    try {
      if (!('speechSynthesis' in window)) return;
      if (!_cachedVoices.length) _cachedVoices = await loadVoices();
      if (!_cachedPreferredVoice) _cachedPreferredVoice = choosePleasantVoice(_cachedVoices);
    } catch {}
  })();
}, []);

  
  // --- INIT & RESET ---
  useEffect(() => {
    // Helper to map and set practice question details
    if (isClosing) return;
    const initializePractice = (rawQuestion) => {
        const mappedQ = mapQuestionToFrontend(rawQuestion);
        // console.log('Initialized Practice Question:', mappedQ);
        setPracticeQ(mappedQ);
        setSelectedAnswer(null); 
        setShowAdvanceButton(false);
        setPracticeMsg('');
        setTypedInput('');
        setIsSubmitting(false);
        setPracticeStatus(null);
    };

    if (isIntervention && interventionQuestion) {
      // Intervention flow: Always starts on the Fact Screen (isShowingFact: true)
      initializePractice(interventionQuestion);
      setIsShowingFact(true);
    } else if (isPreQuizFlow) {
      if (preQuizPracticeItems.length > 0) {
        // Pre-quiz starts with the Fact Screen for the first item
        const mappedItems = preQuizPracticeItems.map(mapQuestionToFrontend);
        setPracticeQ(mappedItems[0]);
        setCurrentPracticeIndex(0);
        setIsShowingFact(true);
      } else {
        setShowLearningModule(false);
        startActualQuiz(quizRunId);
      }
    } else {
      if (!isIntervention && !isPreQuizFlow) navigate('/belts');
    }
    
  }, [isIntervention, interventionQuestion, isPreQuizFlow, preQuizPracticeItems, navigate, startActualQuiz, setShowLearningModule, quizRunId,isClosing]);
  
  useEffect(() => {
      if (!isIntervention && (!selectedTable || !diff) && !isPreQuizFlow) {
          setShowLearningModule(false);
          navigate('/belts');
      }
  }, [selectedTable, diff, isPreQuizFlow, isIntervention, setShowLearningModule, navigate]);

// Speak the math fact during Pre-Quiz Fact screen
//  Disabled during Game Mode learning/practice
useEffect(() => {
  // If we are in ANY Game Mode flow, never speak
  if (isGameMode) {
    stopSpeaking();
    return () => stopSpeaking();
  }

  if (isPreQuizFlow && isShowingFact && practiceQ) {
    const line = buildSpokenFact(practiceQ);
    if (line) speak(line);
  } else {
    // Either not pre-quiz, or not on fact screen → no speech
    stopSpeaking();
  }

  return () => stopSpeaking();
}, [isPreQuizFlow, isShowingFact, practiceQ, isGameMode]);



  
  
  // --- HELPERS ---
  const extractQuestion = (q) => {
    if (!q) return '—';
    // If the question field is just a digit (for L1 white belt), display it clearly
    if (!isNaN(Number(q.question)) && q.question.length === 1 && q.question !== '0') {
         return q.question;
    }
    return q.question;
  }
  
  const extractFactDisplay = (q) => {
      if (!q) return '—';
      const questionPart = extractQuestion(q);
      return `${questionPart} = ${q.correctAnswer}`;
  }

  const handleNext = () => {
    if (!practiceQ) return;
    audioManager.playButtonClick?.();
    setPracticeMsg('');
    setIsShowingFact(false); // Move from Fact Screen to Practice Screen

    // UPDATE: make sure the Start Quiz / advance button is never visible when entering practice
    setShowAdvanceButton(false);
     setSelectedAnswer(null);  
     setTypedInput('');
     setIsSubmitting(false);
     setPracticeStatus(null);
  };
  
  // Handler for Pre-Quiz flow: moves to next fact or starts quiz
  const handleAdvancePreQuizFlow = () => {
    audioManager.playButtonClick?.();
    const nextIndex = currentPracticeIndex + 1;
    if (nextIndex < preQuizPracticeItems.length) {
        // Map the next raw question from the list
        const mappedQ = mapQuestionToFrontend(preQuizPracticeItems[nextIndex]);
        
        setCurrentPracticeIndex(nextIndex);
        setPracticeQ(mappedQ);
        setIsShowingFact(true); // Move back to Fact screen for the next fact
        setShowAdvanceButton(false);
        setSelectedAnswer(null);
    } else {
        // Last practice item is done, start quiz
        setIsStartingQuiz(true);
        setShowLearningModule(false);
        startActualQuiz(quizRunId);
    }
  };

  const handleDigitPress = (digit) => {
    if (isSubmitting) return;
    setPracticeMsg('');
    setPracticeStatus(null);
    setTypedInput((prev) => (prev.length < 4 ? prev + String(digit) : prev));
  };

  const handleClear = () => {
    if (isSubmitting) return;
    setPracticeMsg('');
    setTypedInput('');
    setPracticeStatus(null);
  };

  const handleSubmitTypedAnswer = async () => {
    if (!practiceQ || typedInput.trim() === '' || isSubmitting) return;

    const answerNumber = Number(typedInput);
    if (!Number.isFinite(answerNumber)) {
      setPracticeMsg('Enter a number.');
      return;
    }

    setIsSubmitting(true);

    const isCorrect = answerNumber === practiceQ.correctAnswer;

    if (!isCorrect) {
      audioManager.playWrongSound?.();
      // Show the fact again (answer visible) without red error text
      setIsShowingFact(true);
      setPracticeMsg('');
      setPracticeStatus(null);
      setTypedInput('');
      setIsSubmitting(false);
      return;
    }

    audioManager.playCorrectSound?.();
    setPracticeMsg('Correct!');
    setPracticeStatus('success');

    if (isGameMode && isGameModePractice) {
      const out = await handlePracticeAnswer(practiceQ.id, answerNumber);

      if (out.resume || out.surfQuizRestarted) {
        setIsClosing(true);
        setInterventionQuestion(null);
        setShowLearningModule(false);

        if (out.resume) {
          navigate('/game-mode', { replace: true });
        }
      } else {
        console.error('Game Mode Practice failed to resume.');
      }

      setIsSubmitting(false);
      return;
    }

    try {
      const out = await handlePracticeAnswer(practiceQ.id, answerNumber);

      if (isPreQuizFlow) {
        const nextIndex = currentPracticeIndex + 1;
        const isLastFact = nextIndex >= preQuizPracticeItems.length;

        if (isLastFact) {
          if (!isClosing && !isQuizStarting) {
            setIsQuizStarting(true);
            setIsClosing(true);
            setShowLearningModule(false);
            startActualQuiz(quizRunId);
          }
          setIsSubmitting(false);
          return;
        } else {
          setShowAdvanceButton(false);

          const mappedQ = mapQuestionToFrontend(preQuizPracticeItems[nextIndex]);

          setCurrentPracticeIndex(nextIndex);
          setPracticeQ(mappedQ);
          setIsShowingFact(true);
          setSelectedAnswer(null);
          setPracticeMsg('');
          setShowAdvanceButton(false);
          setTypedInput('');
          setIsSubmitting(false);
          setPracticeStatus(null);
        }
        return;
      }

      if (isIntervention) {
        if (out.completed) {
          if (selectedDifficulty && selectedTable != null) {
            localStorage.setItem('game-mode-belt', selectedDifficulty);
            localStorage.setItem('game-mode-table', String(selectedTable));
          } else {
            console.log('FAIL DEBUG missing selectedDifficulty/table at fail moment:', {
              selectedDifficulty,
              selectedTable,
            });
          }
          setIsAnimating(false);
          setQuizStartTime(null);
          setSessionCorrectCount(out.sessionCorrectCount || 0);
          localStorage.setItem(
            'math-last-quiz-duration',
            Math.round((out.summary?.totalActiveMs || 0) / 1000)
          );
          setShowWayToGoAfterFailure(true);
          navigate('/way-to-go', { replace: true });
          setIsSubmitting(false);
          return;
        }
        if (out.resume) {
          setIsClosing(true);
          setInterventionQuestion(null);
          setShowLearningModule(false);
          navigate('/quiz', { replace: true });
          setIsSubmitting(false);
          return;
        }
      }
      setIsSubmitting(false);
    } catch (e) {
      const msg = e.message || 'Error submitting practice.';
      console.error('Practice submission failed:', msg);
      setPracticeMsg('Error submitting practice: ' + msg);
      setIsSubmitting(false);
      setPracticeStatus('error');
    }
  };

  const handlePreQuizChoice = async (answer) => {
    if (!practiceQ || isSubmitting) return;
    setIsSubmitting(true);

    const isCorrect = answer === practiceQ.correctAnswer;

    if (!isCorrect) {
      audioManager.playWrongSound?.();
      // Show the fact again so they can see the answer
      setIsShowingFact(true);
      setPracticeMsg('');
      setIsSubmitting(false);
      return;
    }

    audioManager.playCorrectSound?.();

    try {
      const out = await handlePracticeAnswer(practiceQ.id, answer);
      const nextIndex = currentPracticeIndex + 1;
      const isLastFact = nextIndex >= preQuizPracticeItems.length;

      if (isLastFact) {
        if (!isClosing && !isQuizStarting) {
          setIsQuizStarting(true);
          setIsClosing(true);
          setShowLearningModule(false);
          startActualQuiz(quizRunId);
        }
      } else {
        setShowAdvanceButton(false);
        const mappedQ = mapQuestionToFrontend(preQuizPracticeItems[nextIndex]);
        setCurrentPracticeIndex(nextIndex);
        setPracticeQ(mappedQ);
        setIsShowingFact(true); // back to fact view for the next item
        setSelectedAnswer(null);
        setPracticeMsg('');
        setShowAdvanceButton(false);
        setTypedInput('');
        setPracticeStatus(null);
      }
    } catch (e) {
      const msg = e.message || 'Error submitting practice.';
      console.error('Practice submission failed:', msg);
      setPracticeMsg('Error submitting practice: ' + msg);
    } finally {
      setIsSubmitting(false);
    }
  };
  const renderBody = () => {
    if (!practiceQ) {
        return (
            <div className="text-center">
                <h3 className="text-xl font-bold text-center text-blue-700 mb-4">Loading Module</h3>
                <p>Preparing content or already starting quiz...</p>
            </div>
        );
    }
    
    // --- 1. Intervention Flow (Show Fact -> Practice -> Resume) ---
    if (isIntervention) {
      if (isShowingFact) {
         if (isClosing) return null;
        return (
          <>
            <div className="text-8xl sm:text-10xl md:text-6xl lg:text-7xl font-bold text-green-600 mb-4 whitespace-pre-line text-center">
              {extractFactDisplay(practiceQ)}
            </div>
            <div className="flex justify-center">
              <button
                className="bg-green-600 hover:bg-green-800 text-white font-bold py-2 px-6 sm:px-8 rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 text-base sm:text-lg shadow-lg"
                onClick={handleNext}
              >
                Next
              </button>
            </div>
          </>
        );
      } else {
        return (
          <>
            <div className="text-6xl sm:text-7xl font-extrabold text-green-500 text-center mb-6 whitespace-pre-line drop-shadow">
              {extractQuestion(practiceQ)}
            </div>

            <div className="w-full max-w-sm mx-auto mb-4">
              <div
                className={[
                  'w-full bg-white rounded-2xl h-24 flex items-center justify-center text-4xl font-extrabold shadow-lg',
                  practiceStatus === 'success' ? 'border-4 border-green-500 text-green-600' : '',
                  practiceStatus === 'error' ? 'border-4 border-red-400 text-red-600' : '',
                  !practiceStatus ? 'border-4 border-green-300 text-gray-800' : ''
                ].join(' ')}
              >
                {typedInput === '' ? <span className="text-gray-400">Type answer</span> : typedInput}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 w-full max-w-sm mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  onClick={() => handleDigitPress(n)}
                  disabled={isSubmitting}
                  className="bg-gray-100 text-gray-900 font-bold py-3 rounded-xl shadow-md hover:bg-gray-200 active:scale-95 transition select-none border border-gray-200"
                >
                  {n}
                </button>
              ))}
              <button
                onClick={handleClear}
                disabled={isSubmitting}
                className="bg-gray-200 text-gray-800 font-semibold py-3 rounded-xl shadow-md hover:bg-gray-300 active:scale-95 transition col-span-1 border border-gray-300"
              >
                Clear
              </button>
              <button
                onClick={() => handleDigitPress(0)}
                disabled={isSubmitting}
                className="bg-gray-100 text-gray-900 font-bold py-3 rounded-xl shadow-md hover:bg-gray-200 active:scale-95 transition border border-gray-200"
              >
                0
              </button>
              <button
                onClick={handleSubmitTypedAnswer}
                disabled={isSubmitting || typedInput === ''}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 rounded-xl shadow-md hover:from-green-600 hover:to-emerald-700 active:scale-95 transition col-span-1"
              >
                Submit
              </button>
            </div>

            {/* no error text for intervention typed flow */}
          </>
        );
      }
    }

    // --- 2. Pre-Quiz Flow (Show Fact -> Practice -> Next Fact/Quiz) ---
    if (isPreQuizFlow) {
      if (isShowingFact) {
        return (
          <>
            <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-green-600 mb-4 whitespace-pre-line text-center">
              {extractFactDisplay(practiceQ)}
            </div>
            <div className="flex justify-center">
              <button
                className="bg-green-600 hover:bg-green-800 text-white font-bold py-2 px-6 sm:px-8 rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 text-base sm:text-lg shadow-lg"
                onClick={handleNext}
              >
                Next
              </button>
            </div>
          </>
        );
      } else {
        const answers = practiceQ.answers || [];
        return (
          <>
            <div className="text-6xl sm:text-7xl font-extrabold text-green-500 text-center mb-6 whitespace-pre-line drop-shadow">
              {extractQuestion(practiceQ)}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full max-w-md mx-auto">
              {answers.map((ans, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePreQuizChoice(ans)}
                  disabled={isSubmitting}
                  className="w-full bg-gray-100 text-gray-900 font-bold py-4 sm:py-5 rounded-xl shadow-md hover:bg-gray-200 active:scale-95 transition select-none border border-gray-200 text-2xl"
                >
                  {ans}
                </button>
              ))}
            </div>

            {/* no error text for pre-quiz; fallback fact view handles wrong answers */}
          </>
        );
      }
    }

    return null;

  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div 
        className="fixed inset-0" 
        style={{
          backgroundImage: `url('/night_sky_landscape.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          zIndex: -1, 
        }}
      />
      {/* Modal/Popup Container */}
      <div className="bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl max-w-sm sm:max-w-md w-full mx-2 sm:mx-4 border border-blue-200/30 popup-zoom-in">
        {renderBody()}
      </div>
    </div>
  );
};

export default LearningModule;
