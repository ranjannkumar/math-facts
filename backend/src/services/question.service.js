// backend/src/services/question.service.js

import QuestionTemplate from '../models/QuestionTemplate.js';
import GeneratedQuestion from '../models/GeneratedQuestion.js';
import Catalog from '../models/Catalog.js';
import { isBlack, getBlackTiming } from '../utils/belts.js';
import { newSeed } from '../utils/helpers.js';

// --- NEW: In-memory cache for canonical pairs to drastically speed up quiz generation ---
let canonicalPairsCache = null;

// NEW: Function to populate the cache
export async function cacheCanonicalPairs() {
  console.log('Starting canonical pair cache warm...');
  const allCatalogs = await Catalog.find({}).lean();
  const cache = {};
  for (const cat of allCatalogs) {
    // Key format: operation_Llevel_belt (e.g., 'add_L1_white')
    const key = `${cat.operation}_L${cat.level}_${cat.belt}`;
    if (cat.facts?.length) {
      cache[key] = [cat.facts[0].a, cat.facts[0].b]; // Store just the canonical pair: [a, b]
    }
  }
  canonicalPairsCache = cache;
  console.log(`Canonical pair cache warmed. ${Object.keys(cache).length} entries loaded.`);
  return cache;
}

/* ---- helpers for choices ---- */
function shuffle(arr){ return [...arr].sort(()=>Math.random()-0.5); }
function choiceSet(correct){
  // frontend uses nearby sums [ans, ans+1, ans-1, ans+2] clipped >= 0
  const base = [correct, correct+1, Math.max(0, correct-1), correct+2];
  // ensure 4 unique
  const uniq = new Set(base);
  while (uniq.size < 4) uniq.add(correct + uniq.size);
  return shuffle(Array.from(uniq).slice(0,4));
}

// 💥 NEW: Function for bulk insert (Used once per quiz set)
export async function bulkCreateQuestions(questionObjects){
    // Use insertMany to perform a single, efficient database write
    const docs = await GeneratedQuestion.insertMany(questionObjects, { ordered: false });
    // Return the inserted documents with the MongoDB _id populated
    return docs.map(doc => doc.toObject());
}


/* ---load canonical pair for a belt ----*/
async function getCanonicalPair(operation, level, belt){
  if (!canonicalPairsCache) {
      await cacheCanonicalPairs(); 
  }
  
  const key = `${operation}_L${level}_${belt}`;
  const cachedPair = canonicalPairsCache?.[key];
  if (cachedPair) {
      return cachedPair; 
  }

  const cat = await Catalog.findOne({ operation, level, belt });
  if (!cat || !cat.facts?.length) return null;
   
  const pair = [cat.facts[0].a, cat.facts[0].b];
  if (canonicalPairsCache) {
      canonicalPairsCache[key] = pair; 
  }
  return pair;
}

/*
 * Reorders a quiz array to ensure no two consecutive questions have the same question string.
 */
function reorderNoConsecutiveDuplicates(questions) {
  const result = [...questions];
  const maxAttempts = result.length * 2; 

  for (let i = 1; i < result.length; i++) {
    let attempts = 0;
    while (result[i].question === result[i - 1].question && attempts < maxAttempts) {
      let swapIndex = -1;
      const targetQuestion = result[i - 1].question;
      const questionToMove = result[i].question; // This is the duplicate question string

      // 1. Search forward (i+1 to end) for a suitable non-identical question
      for (let j = i + 1; j < result.length; j++) {
        if (result[j].question !== targetQuestion) {
          swapIndex = j;
          break;
        }
      }
      
      // 2. FALLBACK: If no forward candidate found, search backward (0 to i-2).
      if (swapIndex === -1) {
          for (let j = 0; j < i - 1; j++) {
              const candidateQuestion = result[j].question;
              
              if (candidateQuestion !== targetQuestion) {
                   if (j === 0 || questionToMove !== result[j - 1].question) {
                       swapIndex = j;
                       break;
                   }
              }
          }
      }

      if (swapIndex !== -1) {
        [result[i], result[swapIndex]] = [result[swapIndex], result[i]];
      } else {
        break; 
      }
      attempts++;
    }
  }
  return result;
}

// 1. MODIFIED: Function to create an in-memory question object (no DB call)
async function createQuestionObject(operation, level, beltOrDegree, a, b, source, questionStringOverride = null){
  const correct = a+b;
  const choices = choiceSet(correct);

  const displayQuestion = questionStringOverride 
    ? questionStringOverride 
    : `${a} + ${b}`; 

  return {
    operation,
    level,
    beltOrDegree,
    params: { a, b },
    question: displayQuestion, 
    correctAnswer: correct,
    choices,
    source,
    seed: newSeed()
  };
}


/* ---------- current belt: practice facts ---------- */
export async function practiceFactsForBelt(operation, level, beltOrDegree){
  if (isBlack(beltOrDegree)) {
    // Returns in-memory objects
    return [];
  }
  // L1 white special: practice == 1 item for 0+0
  if (level === 1 && beltOrDegree === 'white') {
    const q = await createQuestionObject('add', level, 'white', 0, 0, 'current');
    return [q]; 
  }

  const pair = await getCanonicalPair(operation, level, beltOrDegree);
  if (!pair) return [];
  const [a,b] = pair;
  const isIdentical = a===b;

  if (isIdentical) {
    return [await createQuestionObject(operation, level, beltOrDegree, a, b, 'current')];
  } else {
    const q1 = await createQuestionObject(operation, level, beltOrDegree, a, b, 'current');
    const q2 = await createQuestionObject(operation, level, beltOrDegree, b, a, 'current');
    return [q1, q2];
  }
}

// Helper to create the digit recognition object (in-memory)
async function createDigitQuestionObject(level, beltOrDegree, d){
  const correct = d;
  const choices = choiceSet(correct);

  return createQuestionObject(
    'add', 
    level, 
    beltOrDegree, 
    d, 
    0, 
    'previous', 
    String(d) 
  );
}

// Helper to build the black belt question array (in-memory objects)
async function buildQuizForBlackObject(operation, level, beltOrDegree){
  const { questions: totalQuestions } = getBlackTiming(beltOrDegree); 
  
  let numDigitQuestions = 0;
  let questionObjects = [];

  if (level === 1) {
    numDigitQuestions = 3; 
    for (let i = 0; i < numDigitQuestions; i++) {
        const d = Math.floor(Math.random() * 10);
        questionObjects.push(await createDigitQuestionObject(level, beltOrDegree, d));
    }
  }

  const numCanonicalQuestions = totalQuestions - numDigitQuestions;
  if (numCanonicalQuestions <= 0) return questionObjects; 

  const pool = await getAllCanonicalPairsUpToLevel(operation, level); 
  if (!pool.length) return questionObjects;

  for (let i = 0; i < numCanonicalQuestions; i++) {
    const [a,b] = pool[Math.floor(Math.random()*pool.length)];
    questionObjects.push(await createQuestionObject(operation, level, beltOrDegree, a, b, 'previous')); 
  }
  
  return questionObjects; 
}

// Helper to return in-memory question objects (no DB call)
function samplePreviousObject(pool, n){
  if (!pool.length) return [];
  const out = [];
  for (let i=0;i<n;i++){
    const [a,b] = pool[Math.floor(Math.random()*pool.length)];
    out.push({
      operation: 'add',
      level: 0, 
      beltOrDegree: 'prev',
      params: { a, b },
      question: `${a} + ${b}`,
      correctAnswer: a + b,
      choices: choiceSet(a + b),
      source: 'previous',
      seed: newSeed()
    }); 
  }
  return out;
}


/* ---------- buildQuizSet for a belt/degree (The orchestrator) ---------- */
// MODIFIED: This function now collects all questions and uses bulkCreateQuestions.
export async function buildQuizSet(operation, level, beltOrDegree){
  let questionObjects = [];
  const pool = await getPreviousPool(operation, level, beltOrDegree);

  // --- L1 white special ---
  if (!isBlack(beltOrDegree) && level===1 && beltOrDegree==='white') {
    // two new 0+0
    questionObjects.push(await createQuestionObject(operation, level, beltOrDegree, 0, 0, 'current','0 + 0'));
    questionObjects.push(await createQuestionObject(operation, level, beltOrDegree, 0, 0, 'current','0 + 0'));
    // eight digit recognition
    for (let i=0;i<8;i++){
      const d = Math.floor(Math.random()*10);
      questionObjects.push(await createDigitQuestionObject(level, beltOrDegree, d));
    }
  } 
  // --- Black belt ---
  else if (isBlack(beltOrDegree)) {
     questionObjects = await buildQuizForBlackObject(operation, level, beltOrDegree);
  }
  // --- Colored belt (other than L1 White) ---
  else {
    const pair = await getCanonicalPair(operation, level, beltOrDegree);
    if (!pair) return [];
    const [a,b] = pair;
    const isIdentical = a===b;
    
    // NEW questions from current belt:
    const news = [];
    if (isIdentical) {
      news.push(await createQuestionObject(operation, level, beltOrDegree, a, b, 'current'));
      news.push(await createQuestionObject(operation, level, beltOrDegree, a, b, 'current'));
    } else {
      news.push(await createQuestionObject(operation, level, beltOrDegree, a, b, 'current'));
      news.push(await createQuestionObject(operation, level, beltOrDegree, a, b, 'current'));
      news.push(await createQuestionObject(operation, level, beltOrDegree, b, a, 'current'));
      news.push(await createQuestionObject(operation, level, beltOrDegree, b, a, 'current'));
    }

    // PREVIOUS pool: 
    const needPrev = 10 - news.length;
    let prevQs = [];
    
    if (level === 1 && beltOrDegree !== 'white') {
      const DIGIT_Q_COUNT = Math.min(4, needPrev); 
      const neededFromCanonical = Math.max(0, needPrev - DIGIT_Q_COUNT);
      
      for (let i = 0; i < DIGIT_Q_COUNT; i++) {
        const d = Math.floor(Math.random() * 10);
        prevQs.push(await createDigitQuestionObject(level, beltOrDegree, d)); 
      }
      
      if (neededFromCanonical > 0) {
        const canonicalPrevQs = samplePreviousObject(pool, neededFromCanonical); 
        prevQs = prevQs.concat(canonicalPrevQs);
      }
    } else {
      prevQs = samplePreviousObject(pool, needPrev);
    }
    
    // Interleave new among previous
    questionObjects = interleave(news, prevQs);
  }


  // 💥 Perform BULK INSERT - This is the primary optimization for quiz start latency
  const insertedQuestions = await bulkCreateQuestions(questionObjects); 

  // Shuffle and reorder for the final set
  const shuffledInsertedQuestions = shuffle(insertedQuestions);
  return reorderNoConsecutiveDuplicates(shuffledInsertedQuestions);
}

/* ---------- previous pool builders and helpers (remain mostly same) ---------- */
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


/* ---------- interleave new with previous (random positions for new) ---------- */
function interleave(newQs, prevQs){
  const total = newQs.length + prevQs.length;
  const slots = Array(total).fill(null);

  // choose positions for new
  const newCount = newQs.length;
  const picked = new Set();
  while (picked.size < total && picked.size < newCount){
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