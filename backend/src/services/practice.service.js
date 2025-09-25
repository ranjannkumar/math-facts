import Attempt from '../models/Attempt.js';
import GeneratedQuestion from '../models/GeneratedQuestion.js';

// record wrong/inactivity and serve practice with SAME fact
export async function makePracticeForQuestion(quizRun, questionId, reason='answer') {
  const q = await GeneratedQuestion.findById(questionId);
  if (!q) throw new Error('Question not found');

  // create attempt entry that flags practice required
  await Attempt.create({
    quizRun: quizRun._id,
    questionId,
    triggeredPractice: true,
    reason
  });

  // mark current item requires practice
  const item = quizRun.items[quizRun.currentIndex];
  if (item && String(item.questionId) === String(questionId)) {
    item.practiceRequired = true;
  }
  return q;
}
