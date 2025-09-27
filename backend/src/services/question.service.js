import QuestionTemplate from '../models/QuestionTemplate.js';
import GeneratedQuestion from '../models/GeneratedQuestion.js';
import Catalog from '../models/Catalog.js';
import { isBlack, getBlackTiming } from '../utils/belts.js';
import { newSeed } from '../utils/helpers.js';

/* ---------- helpers for choices (mirror frontend style) ---------- */
function shuffle(arr){ return [...arr].sort(()=>Math.random()-0.5); }
function choiceSet(correct){
  // frontend uses nearby sums [ans, ans+1, ans-1, ans+2] clipped >= 0
  const base = [correct, correct+1, Math.max(0, correct-1), correct+2];
  // ensure 4 unique
  const uniq = [...new Set(base)];
  while (uniq.length < 4) uniq.push(correct + uniq.length);
  return shuffle(uniq.slice(0,4));
}

/* ---------- load canonical pair for a belt ---------- */
async function getCanonicalPair(operation, level, belt){
  const cat = await Catalog.findOne({ operation, level, belt });
  if (!cat || !cat.facts?.length) return null;
  return [cat.facts[0].a, cat.facts[0].b]; // one canonical pair per belt
}

/* ---------- current belt: practice facts ---------- */
export async function practiceFactsForBelt(operation, level, beltOrDegree){
  if (isBlack(beltOrDegree)) {
    // Black degrees don't have intro practice in the frontend flow; return empty
    return [];
  }
  // L1 white special: practice == 1 item for 0+0 (frontend returns two 0+0 new items later)
  if (level === 1 && beltOrDegree === 'white') {
    const q = await makeGenQuestion('add', level, 'white', 0, 0, 'current');
    return [q]; // one practice item
  }

  const pair = await getCanonicalPair(operation, level, beltOrDegree);
  if (!pair) return [];
  const [a,b] = pair;
  const isIdentical = a===b;

  if (isIdentical) {
    // one practice question (same fact)
    return [await makeGenQuestion(operation, level, beltOrDegree, a, b, 'current')];
  } else {
    // two practice questions (a+b) and (b+a)
    const q1 = await makeGenQuestion(operation, level, beltOrDegree, a, b, 'current');
    const q2 = await makeGenQuestion(operation, level, beltOrDegree, b, a, 'current');
    return [q1, q2];
  }
}

/* ---------- buildQuizSet for a belt/degree ---------- */
export async function buildQuizSet(operation, level, beltOrDegree){
  // L1 white special: 2×(0+0) + 8 digit-recognition [0..9]
  if (!isBlack(beltOrDegree) && level===1 && beltOrDegree==='white') {
    const out = [];
    // two new 0+0
    out.push(await makeGenQuestion(operation, level, beltOrDegree, 0, 0, 'current','0 + 0'));
    out.push(await makeGenQuestion(operation, level, beltOrDegree, 0, 0, 'current','0 + 0'));
    // eight digit recognition
    for (let i=0;i<8;i++){
      const d = Math.floor(Math.random()*10);
      out.push(await makeDigitQuestion(level, beltOrDegree, d));
    }
    return shuffle(out);
  }

  if (isBlack(beltOrDegree)) {
    return buildQuizForBlack(operation, level, beltOrDegree);
  }

  // colored belt:
  const pair = await getCanonicalPair(operation, level, beltOrDegree);
  if (!pair) return [];
  const [a,b] = pair;
  const isIdentical = a===b;

  // NEW questions from current belt:
  // - identical → 2 new (same order twice)
  // - non-identical → 4 new (two per order)
  const news = [];
  if (isIdentical) {
    news.push(await makeGenQuestion(operation, level, beltOrDegree, a, b, 'current'));
    news.push(await makeGenQuestion(operation, level, beltOrDegree, a, b, 'current'));
  } else {
    news.push(await makeGenQuestion(operation, level, beltOrDegree, a, b, 'current'));
    news.push(await makeGenQuestion(operation, level, beltOrDegree, a, b, 'current'));
    news.push(await makeGenQuestion(operation, level, beltOrDegree, b, a, 'current'));
    news.push(await makeGenQuestion(operation, level, beltOrDegree, b, a, 'current'));
  }

  // PREVIOUS pool: all earlier belts in same level + all belts in earlier levels
  const needPrev = 10 - news.length;
  const prevPool = await getPreviousPool(operation, level, beltOrDegree);
  const prevQs = await samplePrevious(prevPool, needPrev);

  // Interleave new among previous like the frontend interleave (positions randomized)
  return interleave(news, prevQs);
}

/* ---------- black degrees ---------- */
async function buildQuizForBlack(operation, level, beltOrDegree){
  const { questions } = getBlackTiming(beltOrDegree); // 20 or 30
  const pool = await getAllCanonicalPairsUpToLevel(operation, level); // union up to current level
  if (!pool.length) return [];
  const out = [];
  for (let i=0;i<questions;i++){
    const [a,b] = pool[Math.floor(Math.random()*pool.length)];
    out.push(await makeGenQuestion(operation, level, beltOrDegree, a, b, 'previous')); // tag as pulled from pool
  }
  return shuffle(out);
}

/* ---------- build helper questions ---------- */
async function makeGenQuestion(operation, level, beltOrDegree, a, b, source, questionStringOverride = null){
  const correct = a+b;
  const choices = choiceSet(correct);

  return GeneratedQuestion.create({
    operation,
    level,
    beltOrDegree,
    params: { a, b },
    question: questionStringOverride, // <--- Use override if present
    correctAnswer: correct,
    choices,
    source,
    seed: newSeed()
  });
}

async function makeDigitQuestion(level, beltOrDegree, d){
  const correct = d;
  const base = [correct, (correct+1)%10, (correct+2)%10, (correct+3)%10];
  const choices = shuffle([...new Set(base)]).slice(0,4);
 return makeGenQuestion(
    'add', 
    level, 
    beltOrDegree, 
    d, 
    0, 
    'previous', 
    String(d) // <--- Use the digit 'd' as the question string
  );
}

/* ---------- previous pool builders (frontend-compliant) ---------- */
const BELTS = ['white','yellow','green','blue','red','brown'];

async function getPreviousPool(operation, level, belt){
  const idx = BELTS.indexOf(belt);
  const sameLevelPrevBelts = idx>0 ? BELTS.slice(0, idx) : [];
  const pairs = [];

  // previous belts in same level
  for (const b of sameLevelPrevBelts){
    const p = await getCanonicalPair(operation, level, b);
    if (p) pairs.push(p);
  }
  // all belts in earlier levels
  for (let l=1; l<level; l++){
    for (const b of BELTS){
      const p = await getCanonicalPair(operation, l, b);
      if (p) pairs.push(p);
    }
  }
  return pairs;
}

async function samplePrevious(pool, n){
  if (!pool.length) return [];
  const out = [];
  for (let i=0;i<n;i++){
    const [a,b] = pool[Math.floor(Math.random()*pool.length)];
    // IMPORTANT: we DO NOT mirror here; the frontend’s pool already includes order where needed.
    out.push(await makeGenQuestion('add', 0, 'prev', a, b, 'previous')); // level/belt saved in params; source=previous
  }
  return out;
}

/* ---------- interleave new with previous (random positions for new) ---------- */
function interleave(newQs, prevQs){
  const total = newQs.length + prevQs.length;
  const slots = Array(total).fill(null);

  // choose positions for new
  const newCount = newQs.length;
  const picked = new Set();
  while (picked.size < newCount){
    picked.add(Math.floor(Math.random()*total));
  }
  const newPos = [...picked].sort((a,b)=>a-b);
  const shuffledNew = shuffle(newQs);
  const shuffledPrev = shuffle(prevQs);

  newPos.forEach((pos,i)=>{ slots[pos] = shuffledNew[i]; });

  let pi = 0;
  for (let i=0;i<total;i++){
    if (!slots[i]) slots[i] = shuffledPrev[pi++];
  }
  return slots;
}

/* ---------- union of canonical pairs up to a level ---------- */
async function getAllCanonicalPairsUpToLevel(operation, level){
  const pairs = [];
  for (let l=1; l<=level; l++){
    for (const b of BELTS){
      const p = await getCanonicalPair(operation, l, b);
      if (p) pairs.push(p);
    }
  }
  return pairs;
}
