import { BELTS, BLACK_DEGREES, QUIZ_SIZE_COLORED } from '../utils/constants.js';
import { isBlack, nextBelt } from '../utils/belts.js';

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
