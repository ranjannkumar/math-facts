// Choice generator & safe random helpers
import { randomUUID } from 'crypto';

export function sum(a,b){ return a+b; }

export function makeChoicesAdd(correct) {
  // always 4 unique: 1 correct + 3 plausible distractors
  const set = new Set([correct]);
  let tries = 0;
  while (set.size < 4 && tries < 100) {
    tries++;
    // nearby sums / common mistakes
    const delta = Math.floor(Math.random() * 5) - 2; // -2..+2
    let cand = correct + delta;
    if (cand < 0) cand = Math.abs(delta); // no negative
    set.add(cand);
  }
  // Fallback uniqueness if needed
  while (set.size < 4) set.add(correct + set.size);
  // shuffle
  const arr = Array.from(set);
  for (let i=arr.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function newSeed() { return randomUUID(); }
