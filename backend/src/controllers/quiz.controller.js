import * as QuizSvc from '../services/quiz.service.js';
import * as ProgressSvc from '../services/progression.service.js';

export async function prepare(req, res, next) {
  try {
    const { level, beltOrDegree, operation = 'add' } = req.body;
    const { run, practice } = await QuizSvc.prepare(req.user, { level, beltOrDegree, operation });
    res.json({ quizRunId: run._id, practice });
  } catch (e) { next(e); }
}

export async function start(req, res, next) {
  try {
    const { quizRunId } = req.body;
    const { run, question } = await QuizSvc.start(quizRunId);
    res.json({ quizRunId: run._id, question, timer: run.timer });
  } catch (e) { next(e); }
}

export async function answer(req, res, next) {
  try {
    const { quizRunId, questionId, answer, responseMs } = req.body;
    const out = await QuizSvc.submitAnswer(quizRunId, questionId, answer, responseMs);
    
    if (out.completed && out.passed && out.summary) { //  Check for summary existence
     const updatedUser = await ProgressSvc.unlockOnPass( 
          req.user, 
          out.summary.level,
          out.summary.beltOrDegree,
          true
      );
      out.updatedProgress = Object.fromEntries(updatedUser.progress);
    }

    // Ensure we pass back the session time from the quiz service response
    if (out.completed && out.sessionTotalMs) {
        // This is only needed by the client for display, so include it here.
        out.summary.sessionTotalMs = out.sessionTotalMs; 
    }
    res.json(out);
  } catch (e) { next(e); }
}

export async function inactivity(req, res, next) {
  try {
    const { quizRunId, questionId } = req.body;
    const out = await QuizSvc.inactivity(quizRunId, questionId);
    res.json(out);
  } catch (e) { next(e); }
}

export async function practiceAnswer(req, res, next) {
  try {
    const { quizRunId, questionId, answer } = req.body;
    const out = await QuizSvc.practiceAnswer(quizRunId, questionId, answer);
    res.json(out);
  } catch (e) { next(e); }
}

export async function complete(req, res, next) {
  try {
    const { quizRunId } = req.body;
    const out = await QuizSvc.complete(quizRunId);
    // unlock progression when completed+passed (colored belts & black degrees handled in quiz.start/answer path typically)
    res.json(out);
  } catch (e) { next(e); }
}
