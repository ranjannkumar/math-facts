import QuizRun from '../models/QuizRun.js';
import Attempt from '../models/Attempt.js';
import User from '../models/User.js';
import GeneratedQuestion from '../models/GeneratedQuestion.js';
import { practiceFactsForBelt, buildQuizSet, bulkCreateQuestions } from './question.service.js';
import { startTimer, pauseTimer, resumeTimer, isTimeUp } from './timer.service.js';
import { getBlackTiming, isBlack } from '../utils/belts.js';
import { incDaily } from './daily.service.js';
import dayjs from 'dayjs';

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
    stats: { correct: 0, wrong: 0 }, //  Explicitly initialize stats
    timer: (() => {
      if (isBlack(beltOrDegree)) {
        const { limitMs } = getBlackTiming(beltOrDegree);
        return { limitMs, remainingMs: limitMs };
      }
      return { limitMs: 0, remainingMs: 0 };
    })()
  });

 const practiceObjects = await practiceFactsForBelt(operation, level, beltOrDegree);
  
  //Save practice items to DB now, using bulk insert
  // This is required to get the MongoDB _id for client-side practice tracking.
  const savedPractice = await bulkCreateQuestions(practiceObjects);

  // Return the saved practice documents (with IDs)
  return { run, practice: savedPractice };
}

// ------------- START -------------
export async function start(runId) {
  const run = await QuizRun.findById(runId);
  if (!run) throw new Error('Quiz run not found');
  if (run.status !== 'prepared') throw new Error('Quiz already started');

  // Generate the full quiz set of SAVED documents
  // buildQuizSet now returns the list of *saved* GeneratedQuestion documents.
  const quizQuestions = await buildQuizSet(run.operation, run.level, run.beltOrDegree);
  
  // Use the actual _id from the inserted documents
  run.items = quizQuestions.map(q => ({ questionId: q._id }));
  run.status = 'in-progress';
  startTimer(run);
  await run.save();

   return { run, questions: quizQuestions };
}

// ------------- ANSWER -------------
export async function submitAnswer(runId, questionId, answer, responseMs) {
  const run = await QuizRun.findById(runId);
  if (!run) throw new Error('Quiz run not found');
  if (run.status !== 'in-progress') throw new Error('Quiz not in progress');

  const isBlackBeltRun = isBlack(run.beltOrDegree);

  if (isTimeUp(run)) {
    pauseTimer(run);
    run.status = 'failed';
    await run.save();
    return { completed: true, passed: false, reason: 'timeup',sessionCorrectCount:  Number(run.stats.correct)};
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
    // Wrong  answer:pause timer, set practice required, and return question for intervention.
    pauseTimer(run);
    run.stats.wrong += 1; 
    item.practiceRequired = true;
    // Do NOT advance index
    await run.save();
    const practiceQ = await GeneratedQuestion.findById(questionId).lean();
    // For Black Belt, a wrong answer means immediate failure (WayToGoScreen)
    if (isBlackBeltRun) {
        run.status = 'failed';
        await run.save();
        // Use 'wrong' reason for WayToGoScreen logic
        return { completed: true, passed: false, reason: 'wrong', sessionCorrectCount:  Number(run.stats.correct), summary: { totalActiveMs: run.totalActiveMs } };
    }
    return { practice: practiceQ, reason: 'wrong' }; // This triggers the LearningModule intervention
  }

  // Correct answer: advance
  run.stats.correct += 1;
    // Accumulate time for the just-answered question locally in the run object ---
  let timeDelta = 0;
  if (run.startedAt) {
      const now = dayjs();
      timeDelta = now.diff(run.startedAt); // Time spent on current question
      run.totalActiveMs += timeDelta;
  }

   // 1. Non-blocking: Record attempt
  Attempt.create({
    quizRun: run._id,
    questionId: q._id,
    userAnswer: answer,
    isCorrect,
    responseMs,
    reason: 'answer'
  }).catch(err => console.error('Attempt creation failed non-blocking:', err));

  // 2. Non-blocking: Atomically increment the grand total on the User document
  User.findByIdAndUpdate(run.user, { $inc: { grandTotalCorrect: 1 } }).catch(err => console.error('User grand total update failed non-blocking:', err));

  const updatedDaily = await incDaily(run.user, 1, timeDelta);

  // Atomically increment the grand total on the User document
  await User.findByIdAndUpdate(run.user, { $inc: { grandTotalCorrect: 1 } }); 
  

  // next index
  run.currentIndex += 1;

  // if finished
  if (run.currentIndex >= run.items.length) {
    pauseTimer(run);
    run.status = 'completed';
    
    // Determine pass status: requires a perfect score (all questions correct)
    let passed = run.stats.wrong === 0; 

     // For Black Belt, also check the timer
    if (isBlackBeltRun) {
      const { limitMs } = getBlackTiming(run.beltOrDegree);
      // Pass if perfect score AND totalActiveMs <= limitMs
      passed = passed && (run.totalActiveMs <= limitMs);

      // If failed due to time limit, change status to 'failed' for accurate records
      if (isTimeUp(run) || (isBlackBeltRun && run.totalActiveMs > limitMs && passed)) {
          run.status = 'failed';
          passed = false;
      }
    }

    const finalDaily = updatedDaily;

    const summary = { 
        correct: run.stats.correct, 
        totalActiveMs: run.totalActiveMs,
        level: run.level,
        beltOrDegree: run.beltOrDegree
    };

    // console.log('Quiz completed for user', run.user, 'Level:', run.level, 'Belt/Degree:', run.beltOrDegree, 'Passed:', passed, 'Summary:', summary);

    
    await run.save();
    return { completed: true, passed, summary, sessionCorrectCount:  Number(run.stats.correct) ,dailyStats: finalDaily};
  }

  // continue: resume timer, return next question
  resumeTimer(run);
    await run.save(); 
  
  return { 
      nextIndex: run.currentIndex, // New field for client to advance
      dailyStats: updatedDaily 
  };
}

// ------------- INACTIVITY -------------
export async function inactivity(runId, questionId) {
  const run = await QuizRun.findById(runId);
  if (!run) throw new Error('Quiz run not found');

   if (run.status !== 'in-progress') {
    const isPassed = run.status === 'completed';
    // Return a completion signal so the frontend can safely navigate away
    // This immediately stops the frontend quiz and navigates based on final status.
    return { 
        completed: true, 
        passed: isPassed, 
        reason: 'late-inactivity', 
        sessionCorrectCount: run.stats.correct || 0 
    };
  }
  const item = run.items[run.currentIndex];
  if (!item || String(item.questionId) !== String(questionId)) throw new Error('Not current question');

  pauseTimer(run);
  item.practiceRequired = true;
  run.stats.wrong += 1; 

  // record attempt as inactivity trigger
  await Attempt.create({
    quizRun: run._id,
    questionId,
    triggeredPractice: true,
    reason: 'inactivity'
  });
  
  const isBlackBeltRun = isBlack(run.beltOrDegree);

  // If Black Belt, inactivity is immediate failure (no intervention/practice)
  if (isBlackBeltRun) {
    run.status = 'failed';
    await run.save();
    // Return completion response to trigger WayToGoScreen on the frontend
    return { completed: true, passed: false, reason: 'inactivity-fail', sessionCorrectCount:  Number(run.stats.correct), summary: { totalActiveMs: run.totalActiveMs }};
  }

  // Colored belt: proceed to practice intervention
  await run.save();
  const q = await GeneratedQuestion.findById(questionId).lean();
  return { practice: q};
}

// ------------- PRACTICE ANSWER -------------
export async function practiceAnswer(runId, questionId, answer) {
  const run = await QuizRun.findById(runId);
  if (!run) throw new Error('Run not found');
  
  const q = await GeneratedQuestion.findById(questionId);
  if (!q) throw new Error('Practice question not found');
  const correct = Number(answer) === q.correctAnswer;

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
    await run.save();
    return { practice: q.toObject(), stillPracticing: true };
  }

  // correct practice: 
  if (run.status === 'in-progress') {
    // Intervention flow: mark practiced, advance index, resume timer, and return the next question.
    const item = run.items[run.currentIndex];
    item.practiceRequired = false;
    item.practiced = true;
    
    // Advance index to the next question
    run.currentIndex += 1;

    // Check if finished
    if (run.currentIndex >= run.items.length) {
        resumeTimer(run); 
        pauseTimer(run);
        
        // Since a previous wrong answer/inactivity occurred, this leads to WayToGoScreen
        run.status = 'failed'; 

        const summary = { 
            correct: run.stats.correct, 
            totalActiveMs: run.totalActiveMs,
            level: run.level,
            beltOrDegree: run.beltOrDegree
        };
        
        await run.save();
        // Return completion signal
        return { completed: true, passed: false, summary, sessionCorrectCount:  Number(run.stats.correct)}; 
    }

    // Continue to next question
    resumeTimer(run);
   const [_, nextQ] = await Promise.all([
        run.save(),
        GeneratedQuestion.findById(run.items[run.currentIndex].questionId).lean()
    ]);
    
    return { 
        resume:  true,
        next: nextQ,
    };
  }
  
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
    const timeDelta = run.totalActiveMs - previousTotalActiveMs;

    run.status = 'completed';
    await incDaily(run.user, 0, timeDelta);
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