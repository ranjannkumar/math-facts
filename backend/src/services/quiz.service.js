import QuizRun from '../models/QuizRun.js';
import Attempt from '../models/Attempt.js';
import GeneratedQuestion from '../models/GeneratedQuestion.js';
import { practiceFactsForBelt, buildQuizSet } from './question.service.js';
import { startTimer, pauseTimer, resumeTimer, isTimeUp } from './timer.service.js';
import { getBlackTiming, isBlack } from '../utils/belts.js';
import { incDaily } from './daily.service.js';

// ------------- PREPARE -------------
export async function prepare(user, { level, beltOrDegree, operation }) {
  // create empty quiz run (prepared)
  const run = await QuizRun.create({
    user: user._id,
    operation,
    level,
    beltOrDegree,
    status: 'prepared',
    items: [],
    currentIndex: 0,
    totalActiveMs: 0,
    stats: { correct: 0, wrong: 0 }, // FIX: Explicitly initialize stats
    timer: (() => {
      if (isBlack(beltOrDegree)) {
        const { limitMs } = getBlackTiming(beltOrDegree);
        return { limitMs, remainingMs: limitMs };
      }
      return { limitMs: 0, remainingMs: 0 };
    })()
  });

  // practice items (1 if identical; else 2)
  const practice = await practiceFactsForBelt(operation, level, beltOrDegree);
  return { run, practice };
}

// ------------- START -------------
export async function start(runId) {
  const run = await QuizRun.findById(runId);
  if (!run) throw new Error('Quiz run not found');
  if (run.status !== 'prepared') throw new Error('Quiz already started');

  const set = await buildQuizSet(run.operation, run.level, run.beltOrDegree);
  run.items = set.map(q => ({ questionId: q._id }));
  run.status = 'in-progress';
  startTimer(run);
  await run.save();

  const firstQ = await GeneratedQuestion.findById(run.items[0].questionId);
  return { run, question: firstQ };
}

// ------------- ANSWER -------------
// ranjannkumar/math-facts/math-facts-53836cb507e63890a9c757d863525a6cb3341e86/backend/src/services/quiz.service.js

// ... (existing imports, ensure incDaily and others are present)

// ------------- ANSWER -------------
export async function submitAnswer(runId, questionId, answer, responseMs) {
  const run = await QuizRun.findById(runId);
  if (!run) throw new Error('Quiz run not found');
  if (run.status !== 'in-progress') throw new Error('Quiz not in progress');

  if (isTimeUp(run)) {
    pauseTimer(run);
    run.status = 'failed';
    await run.save();
    return { completed: true, passed: false, reason: 'timeup' };
  }

  const item = run.items[run.currentIndex];
  // Check if the submitted answer is for the current question
  if (!item || String(item.questionId) !== String(questionId)) {
    throw new Error('Not the current question');
  }

  const q = await GeneratedQuestion.findById(questionId);
  const isCorrect = Number(answer) === q.correctAnswer;

  // record attempt
  await Attempt.create({
    quizRun: run._id,
    questionId: q._id,
    userAnswer: answer,
    isCorrect,
    responseMs,
    reason: 'answer'
  });

  if (!isCorrect) {
    // Wrong answer: pause timer, set practice required, and return question for intervention.
    pauseTimer(run);
    run.stats.wrong += 1; 
    item.practiceRequired = true;
    // Do NOT advance index
    await run.save();
    return { practice: q.toObject(), reason: 'wrong' }; // <--- This triggers the LearningModule intervention
  }

  // Correct answer: advance
  run.stats.correct += 1;
  // add to daily (this is where the daily count increases)
  await incDaily(run.user, 1, 0); //

  // next index
  run.currentIndex += 1;

  // if finished
  if (run.currentIndex >= run.items.length) {
    pauseTimer(run);
    run.status = 'completed';
    
    // Determine pass status: requires a perfect score (all questions correct)
    const passed = run.stats.correct === run.items.length; 

    const summary = { 
        correct: run.stats.correct, 
        totalActiveMs: run.totalActiveMs,
        level: run.level,
        beltOrDegree: run.beltOrDegree
    };

    
    await run.save();
    // FIX (B14): Return sessionCorrectCount explicitly for front-end
    return { completed: true, passed, summary, sessionCorrectCount: run.stats.correct };
  }

  // continue: resume timer, return next question
  resumeTimer(run);
  await run.save();
  const nextQ = await GeneratedQuestion.findById(run.items[run.currentIndex].questionId);
  return { next: nextQ };
}

// ------------- INACTIVITY -------------
export async function inactivity(runId, questionId) {
  const run = await QuizRun.findById(runId);
  if (!run || run.status !== 'in-progress') throw new Error('Invalid run');
  const item = run.items[run.currentIndex];
  if (!item || String(item.questionId) !== String(questionId)) throw new Error('Not current question');

  pauseTimer(run);
  item.practiceRequired = true;

  // record attempt as inactivity trigger
  await Attempt.create({
    quizRun: run._id,
    questionId,
    triggeredPractice: true,
    reason: 'inactivity'
  });

  await run.save();
  const q = await GeneratedQuestion.findById(questionId);
  return { practice: q.toObject()};
}

// ------------- PRACTICE ANSWER -------------
export async function practiceAnswer(runId, questionId, answer) {
  const run = await QuizRun.findById(runId);
  if (!run) throw new Error('Run not found');
  
  const q = await GeneratedQuestion.findById(questionId);
  if (!q) throw new Error('Practice question not found');
  const correct = Number(answer) === q.correctAnswer;

  // --- MODIFIED LOGIC START ---
  if (run.status === 'in-progress') {
    // Intervention flow: check for index match
    const item = run.items[run.currentIndex];
    if (!item || String(item.questionId) !== String(questionId)) {
      throw new Error('Not current question');
    }
  } else if (run.status !== 'prepared') {
    // If not prepared and not in-progress, reject.
    throw new Error('Quiz run status not valid for practice');
  }
  // --- MODIFIED LOGIC END ---


  // update last practice attempt
  await Attempt.create({
    quizRun: run._id,
    questionId,
    userAnswer: answer,
    isCorrect: correct,
    practiceCompleted: correct,
    reason: 'answer'
  });

  if (!correct) {
    // stay in practice; timer remains paused
    return { practice: q, stillPracticing: true };
  }

  // correct practice: 
  if (run.status === 'in-progress') {
    // Intervention flow: mark practiced, do not advance index, resume timer, return current question.
    const item = run.items[run.currentIndex];
    item.practiceRequired = false;
    item.practiced = true;
    resumeTimer(run);
    await run.save();
    return { resume: q };
  }
  
  // Pre-quiz flow: simply signal successful practice to the frontend.
  // The frontend handles progression through the practice items and calling quizStart.
  await run.save();
  return { resume: true };
}

// ------------- COMPLETE -------------
export async function complete(runId) {
  const run = await QuizRun.findById(runId);
  if (!run) throw new Error('Run not found');

  // finalize time if running
  if (run.status === 'in-progress') {
    // if still in-progress, pause and mark completed by force
    // (frontend can call this at quiz end)
    pauseTimer(run);
    run.status = 'completed';
  }
  await run.save();

  return {
    completed: true,
    result: {
      correct: run.stats.correct,
      wrong: run.stats.wrong,
      totalActiveMs: run.totalActiveMs,
      passed: run.status === 'completed'
    }
  };
}