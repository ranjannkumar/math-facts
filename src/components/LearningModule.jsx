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
  const isGameModeLearning = isGameMode && isGameModePractice;

  if (!isGameModeLearning && isPreQuizFlow && isShowingFact && practiceQ) {
    const line = buildSpokenFact(practiceQ);
    if (line) speak(line);
  } else {
    // Either not pre-quiz flow, or we are in Game Mode → no speech
    stopSpeaking();
  }

  return () => stopSpeaking();
}, [isPreQuizFlow, isShowingFact, practiceQ, isGameMode, isGameModePractice]);


  
  
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

  const handlePracticeAnswerClick = async (answer) => {
    if (selectedAnswer !== null || !practiceQ) return;
    
    setSelectedAnswer(answer);

    const isCorrect = answer === practiceQ.correctAnswer;
    
    if (isCorrect) {
        audioManager.playCorrectSound?.();
        setPracticeMsg('Correct!');
        if (isGameMode && isGameModePractice) {
             const out = await handlePracticeAnswer(practiceQ.id, answer);

             if (out.resume) {
                 // Success: hook handles navigation back to /game-mode and state reset
                 setIsClosing(true);
                 setInterventionQuestion(null);
                 setShowLearningModule(false);
                 navigate('/game-mode', { replace: true });
             } else {
                 console.error("Game Mode Practice failed to resume.");
             }
             
             return; 
        }

        try {
          const out = await handlePracticeAnswer(practiceQ.id, answer);

          if (isPreQuizFlow) {
            const nextIndex = currentPracticeIndex + 1;
            const isLastFact = nextIndex >= preQuizPracticeItems.length;

            if (isLastFact) {
              // This was the final practice. Now we show the Start Quiz button.
              // setShowAdvanceButton(true);
             if (!isClosing && !isQuizStarting) { 
                  setIsQuizStarting(true);
                  setIsClosing(true); 
                  setShowLearningModule(false);
                  startActualQuiz(quizRunId);
                }
              return;
            } else {
              // Not the last one — do NOT flash the Start Quiz button.
              setShowAdvanceButton(false);

              const mappedQ = mapQuestionToFrontend(preQuizPracticeItems[nextIndex]);

                setCurrentPracticeIndex(nextIndex);
                setPracticeQ(mappedQ);
                setIsShowingFact(true);          // back to Fact for the next item
                setSelectedAnswer(null);
                setPracticeMsg('');
                setShowAdvanceButton(false);
            }
            return;
          }

          if (isIntervention) {
            if (out.completed) {
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
            setShowWayToGoAfterFailure(true);;
                navigate('/way-to-go', { replace: true });
                return;
            }
            if (out.resume) {
              setIsClosing(true);                 
              setInterventionQuestion(null);      
              setShowLearningModule(false);       
              navigate('/quiz', { replace: true });
              return;
            }
          }
        } catch (e) {
          const msg = e.message || 'Error submitting practice.';
          console.error('Practice submission failed:', msg);
          setPracticeMsg('Error submitting practice: ' + msg);
        }
      } else {
        audioManager.playWrongSound?.();
        setPracticeMsg('Wrong! Try again.');
        setShowAdvanceButton(false);  
        setTimeout(() => {
          setSelectedAnswer(null);
          setIsShowingFact(true); 
          setPracticeMsg('');
        }, 5);
      }
    };

const renderPracticeInteractions = (answers, currentCorrectAnswer) => (
  <>
    <div className="grid grid-cols-2 gap-4 mt-4 w-full">
      {answers.map((answer, index) => (
        <button
          key={index}
          onClick={() => handlePracticeAnswerClick(answer)}
          disabled={!!selectedAnswer}
          className={[
            'py-4 rounded-xl text-2xl font-bold shadow-md',
            'bg-gray-200 text-gray-800 border-2 border-gray-300',
            'transition-none select-none',
            'disabled:bg-gray-200 disabled:text-gray-800 disabled:opacity-100 disabled:cursor-default',
            'focus:outline-none focus:ring-0 active:outline-none active:ring-0'
          ].join(' ')}
          style={{
            WebkitTapHighlightColor: 'transparent'
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {answer}
        </button>
      ))}
    </div>
  </>
);


  const renderBody = () => {
    if (!practiceQ) {
        return (
            <div className="text-center">
                <h3 className="text-xl font-bold text-center text-blue-700 mb-4">Loading Module</h3>
                <p>Preparing content or already starting quiz...</p>
            </div>
        );
    }
    
    const currentCorrectAnswer = practiceQ.correctAnswer;
    const practiceAnswers = practiceQ.answers || []; // Safely access answers

    // --- 1. Intervention Flow (Show Fact -> Practice -> Resume) ---
    if (isIntervention) {
      if (isShowingFact) {
         if (isClosing) return null;
        // Fact screen
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
            <div className="text-7xl font-extrabold text-green-600 text-center mb-4 whitespace-pre-line">
              {extractQuestion(practiceQ)}
            </div>
            
            {renderPracticeInteractions(practiceAnswers, currentCorrectAnswer)}

          </>
        );
      }
    }
    
    // --- 2. Pre-Quiz Flow (Show Fact -> Practice -> Next Fact/Quiz) ---
    if (isPreQuizFlow) {
      const isLastFact = currentPracticeIndex === preQuizPracticeItems.length - 1;
      
      if (isShowingFact) {
        // Fact screen
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
        // Practice screen (Pre-Quiz)
        const buttonText = 'Start Game';

        return (
          <>
            <div className="text-7xl font-extrabold text-green-600 text-center mb-4 whitespace-pre-line">
              {extractQuestion(practiceQ)}
            </div>

            {renderPracticeInteractions(practiceAnswers, currentCorrectAnswer)}
            
            {/* {showAdvanceButton && (
                <div className="flex justify-center mt-4">
                    <button
                        type="button"
                        onClick={handleAdvancePreQuizFlow}
                        disabled={isStartingQuiz}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
                    >
                        {buttonText}
                    </button>
                </div>
            )} */}
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