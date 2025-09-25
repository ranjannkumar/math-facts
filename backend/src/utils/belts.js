import { BELTS, BLACK_DEGREES, QUIZ_SIZE_COLORED } from './constants.js';

// returns true if 'beltOrDegree' is a black degree string like 'black-1'
export function isBlack(beltOrDegree) {
  return /^black-\d$/.test(String(beltOrDegree));
}

export function getBlackTiming(beltOrDegree) {
  if (!isBlack(beltOrDegree)) return { questions: 0, limitMs: 0 };
  const d = parseInt(beltOrDegree.split('-')[1], 10);
  const row = BLACK_DEGREES.find(x => x.degree === d);
  return { questions: row.questions, limitMs: row.seconds * 1000 };
}

export function getColoredQuizSize() {
  return QUIZ_SIZE_COLORED;
}

export function nextBelt(belt) {
  const idx = BELTS.indexOf(belt);
  if (idx === -1) return null;
  return BELTS[idx + 1] || null;
}
