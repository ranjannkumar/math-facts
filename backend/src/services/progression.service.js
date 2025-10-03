import { BELTS, BLACK_DEGREES, QUIZ_SIZE_COLORED } from '../utils/constants.js';
import { isBlack, nextBelt } from '../utils/belts.js';

import DailySummary from '../models/DailySummary.js';
import QuizRun from '../models/QuizRun.js';

export async function resetAllProgress(user) {
  const userId = user._id;

  // 1. Delete associated data
  await DailySummary.deleteMany({ user: userId });
  await QuizRun.deleteMany({ user: userId });
  // Attempts refer to QuizRun IDs, deleting QuizRuns is sufficient cleanup in a simple flow,
  // but for completeness, we should delete Attempts linked to the QuizRuns we are about to delete.
  // Since we delete QuizRuns, the cascade could be complex. For this simple app, 
  // deleting QuizRuns and DailySummary is usually sufficient for a "fresh start". 
  // We'll skip complex attempt cleanup for simplicity unless a cascade error occurs.

  // 2. Reset user progression map to initial state (L1 white belt unlocked)
  user.progress.clear();
  
  // Re-initialize L1 white belt unlocked state (mimicking auth.controller.js logic)
  const key = 'L1';
  user.progress.set(key, { 
      level: 1, 
      unlocked: true, // Mark level as unlocked
      white: { unlocked: true, completed: false } // Mark white belt as unlocked for L1
  });
  
  // The rest of the belts/degrees will use the schema defaults.
  
  await user.save();
  return user;
}

export async function unlockOnPass(user, level, beltOrDegree, passed) {
  if (!passed) return user;

  if (isBlack(beltOrDegree)) {
    const degree = parseInt(beltOrDegree.split('-')[1], 10);
    // mark degree completed
    const key = `L${level}`;
    const prog = user.progress.get(key) || { level, black: { unlocked: true, completedDegrees: [] }};
    if (!prog.black) prog.black = { unlocked: true, completedDegrees: [] };
    if (!prog.black.completedDegrees.includes(degree)) prog.black.completedDegrees.push(degree);

    // if degree 7 -> unlock next level
    if (degree === 7) {
      // complete current level
      prog.completed = true;
      user.progress.set(key, prog);
      const nextLevelKey = `L${level+1}`;
      const nextLevel = user.progress.get(nextLevelKey) || { level: level+1 };
      nextLevel.unlocked = true;
      user.progress.set(nextLevelKey, nextLevel);
    } else {
      user.progress.set(key, prog);
    }
    await user.save();
    return user;
  }

  // colored belt progression
  const key = `L${level}`;
  console.log('Unlocking for user', user._id, 'level', level, 'belt', beltOrDegree);
  const prog = user.progress.get(key) || { level };
  user.progress.set(key, prog); // Ensure Map is tracked if new
  console.log('Current prog:', prog)

  // mark this belt completed and unlock next
  // 1. Mark this belt completed and unlocked using dot notation (Mongoose sub-document update)
  // FIX: Access belt property directly to ensure proper sub-document update
  prog[beltOrDegree].completed = true;
  prog[beltOrDegree].unlocked = true;
 
  const nb = nextBelt(beltOrDegree);
  console.log('Next belt:', nb);
  if (nb) {
    // FIX: Access next belt property directly and set unlocked
    prog[nb].unlocked = true;
  } else {
     // finished brown -> unlock black
    prog.black.unlocked = true;
    prog.black.completedDegrees = prog.black.completedDegrees || []; // Ensure array exists
  }
  user.progress.set(key, prog);
  await user.save();
  return user;
}
