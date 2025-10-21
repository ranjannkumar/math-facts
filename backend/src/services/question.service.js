// backend/src/services/question.service.js

import QuestionTemplate from '../models/QuestionTemplate.js';
import GeneratedQuestion from '../models/GeneratedQuestion.js';
import Catalog from '../models/Catalog.js';
import { isBlack, getBlackTiming } from '../utils/belts.js';
import { newSeed } from '../utils/helpers.js';

// --- In-memory cache for canonical pairs to drastically speed up quiz generation ---
let canonicalPairsCache = null;

// Function to populate the cache
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

//  Function for bulk insert (Used once per quiz set)
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

      // Search forward (i+1 to end) for a suitable non-identical question
      for (let j = i + 1; j < result.length; j++) {
        if (result[j].question !== targetQuestion) {
          swapIndex = j;
          break;
        }
      }
      
      //  If no forward candidate found, search backward (0 to i-2).
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

//Function to create an in-memory question object (no DB call)
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

// --- START NEW HELPER FUNCTIONS FOR BLACK BELT LOGIC ---
const BELTS = ['white','yellow','green','blue','red','brown'];

/* --- Get all canonical pairs for a specific level (all 6 colored belts) ----*/
async function getCanonicalPairsForLevel(operation, level){
  const pairs = [];
  for (const b of BELTS){
      const p = await getCanonicalPair(operation, level, b);
      if (p) pairs.push(p);
  }
  return pairs;
}

/* ---  Get all canonical pairs from previous levels (1 to level-1) ----*/
async function getCanonicalPairsUpToLevelMinusOne(operation, level){
  const pairs = [];
  for (let l=1; l<level; l++){
    for (const b of BELTS){
      const p = await getCanonicalPair(operation, l, b);
      if (p) pairs.push(p);
    }
  }
  return pairs;
}

/* --- Create all question variations (a+b, b+a) from a list of [a,b] pairs ----*/
async function createAllQuestionsFromPairs(operation, level, beltOrDegree, pairs, source) {
  const questionObjects = [];
  for (const [a, b] of pairs) {
    // 1. Always include a + b
    questionObjects.push(await createQuestionObject(operation, level, beltOrDegree, a, b, source));
    // 2. If a != b, include b + a (the commutated fact)
    if (a !== b) {
      questionObjects.push(await createQuestionObject(operation, level, beltOrDegree, b, a, source));
    }
  }
  return questionObjects;
}

/* ---  Sample a set of questions for black belt quiz from a pool ----*/
function sampleBlackQuestionsFromPool(pool, n, source, level, beltOrDegree){
  if (!pool.length || n <= 0) return [];
  const out = [];
  for (let i=0;i<n;i++){
    // Sample a random pair from the pool
    const [a,b] = pool[Math.floor(Math.random()*pool.length)];
    // Randomly decide between a+b and b+a for non-identical pairs, 
    // ensuring identical pairs remain a+a.
    const [qA, qB] = (a !== b && Math.random() < 0.5) ? [b, a] : [a, b]; 

    out.push({
      operation: 'add',
      level, 
      beltOrDegree,
      params: { a: qA, b: qB },
      question: `${qA} + ${qB}`,
      correctAnswer: qA + qB,
      choices: choiceSet(qA + qB),
      source,
      seed: newSeed()
    }); 
  }
  return out;
}

// Helper to build the black belt question array (in-memory objects)
async function buildQuizForBlackObject(operation, level, beltOrDegree){
  const { questions: totalQuestions } = getBlackTiming(beltOrDegree); 
  
  let questionObjects = [];
  // L1 Black Belt has 3 digit recognition questions in addition to canonical questions
  const numDigitQuestions = (level === 1) ? 3 : 0;

 // --- 1. Mandatory: Include ALL facts questions for the CURRENT level (white-brown) ---
  const currentLevelCanonicalPairs = await getCanonicalPairsForLevel(operation, level);
  const mandatoryQuestions = await createAllQuestionsFromPairs(
      operation, 
      level, 
      beltOrDegree, 
      currentLevelCanonicalPairs, 
      'current'
  );
  questionObjects.push(...mandatoryQuestions);

  // --- 2. Calculate remaining canonical questions needed ---
  const questionsNeeded = totalQuestions - numDigitQuestions;
  const alreadyIncluded = questionObjects.length;
  let remainingNeeded = questionsNeeded - alreadyIncluded;

  if (remainingNeeded > 0) {
    
    // --- 3. Remaining from PREVIOUS levels (Levels 1 to level - 1) ---
    let fillPool = await getCanonicalPairsUpToLevelMinusOne(operation, level);
    let source = 'previous';

    // --- 4. Fallback: If previous levels yield no facts, sample from the CURRENT level's canonical pairs ---
    if (fillPool.length === 0) {
        fillPool = currentLevelCanonicalPairs;
        source = 'current';
    }
    
    // --- 5. Sample the remaining questions from the determined pool ---
    if (fillPool.length > 0) {
        const remainingQuestions = sampleBlackQuestionsFromPool(
            fillPool, 
            remainingNeeded, 
            source, 
            level, 
            beltOrDegree
        );
        questionObjects.push(...remainingQuestions);
    }
  }

  // --- 6. Add L1 Digit Recognition Questions if necessary ---
  if (level === 1) {
    for (let i = 0; i < numDigitQuestions; i++) {
        const d = Math.floor(Math.random() * 10);
        // Digit questions are always considered 'previous' for tracking purposes
        questionObjects.push(await createDigitQuestionObject(level, beltOrDegree, d));
    }
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
//This function now collects all questions and uses bulkCreateQuestions.
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
    
    // questions from current belt:
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


  //  Perform BULK INSERT - This is the primary optimization for quiz start latency
  const insertedQuestions = await bulkCreateQuestions(questionObjects); 

  // Shuffle and reorder for the final set
  const shuffledInsertedQuestions = shuffle(insertedQuestions);
  return reorderNoConsecutiveDuplicates(shuffledInsertedQuestions);
}


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