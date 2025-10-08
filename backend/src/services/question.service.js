import QuestionTemplate from '../models/QuestionTemplate.js';
import GeneratedQuestion from '../models/GeneratedQuestion.js';
import Catalog from '../models/Catalog.js';
import { isBlack, getBlackTiming } from '../utils/belts.js';
import { newSeed } from '../utils/helpers.js';

/* ---- helpers for choices ---- */
function shuffle(arr){ return [...arr].sort(()=>Math.random()-0.5); }
function choiceSet(correct){
  // frontend uses nearby sums [ans, ans+1, ans-1, ans+2] clipped >= 0
  const base = [correct, correct+1, Math.max(0, correct-1), correct+2];
  // ensure 4 unique
  const uniq = [...new Set(base)];
  while (uniq.length < 4) uniq.push(correct + uniq.length);
  return shuffle(uniq.slice(0,4));
}

/* ---load canonical pair for a belt ----*/
async function getCanonicalPair(operation, level, belt){
  const cat = await Catalog.findOne({ operation, level, belt });
  if (!cat || !cat.facts?.length) return null;
  return [cat.facts[0].a, cat.facts[0].b]; // one canonical pair per belt
}

/*
 * Reorders a quiz array to ensure no two consecutive questions have the same question string.
 * It now includes a fallback search to the beginning of the array if no non-duplicate is found towards the end.
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

      // 1. Search forward (i+1 to end) for a suitable non-identical question (Original strategy)
      for (let j = i + 1; j < result.length; j++) {
        // A suitable question is one that is NOT the target (result[i-1])
        if (result[j].question !== targetQuestion) {
          swapIndex = j;
          break;
        }
      }
      
      // 2. FALLBACK: If no forward candidate found, search backward (0 to i-2).
      if (swapIndex === -1) {
          // Search the portion of the array that is already considered 'fixed'
          // We exclude 'i-1' because that is the immediate duplicate neighbor.
          for (let j = 0; j < i - 1; j++) {
              const candidateQuestion = result[j].question;
              
              // Candidate must fix the problem at i (q_j != q_i-1)
              if (candidateQuestion !== targetQuestion) {
                   // Safety Check: ensure the question *at* 'i' (the duplicate)
                   // won't create a new duplicate at position 'j' when moved there.
                   if (j === 0 || questionToMove !== result[j - 1].question) {
                       swapIndex = j;
                       break;
                   }
              }
          }
      }
      // --- END FALLBACK LOGIC ---

      if (swapIndex !== -1) {
        // Perform swap
        [result[i], result[swapIndex]] = [result[swapIndex], result[i]];
      } else {
        // Cannot fix: break out of inner while loop. The array is unfixable given the constraints.
        break; 
      }
      attempts++;
    }
  }
  return result;
}



// Returns a Promise for a Mongoose Document
function _makeGenQuestionCreatePromise(operation, level, beltOrDegree, a, b, source, questionStringOverride = null){
  const correct = a+b;
  const choices = choiceSet(correct);

  const displayQuestion = questionStringOverride 
    ? questionStringOverride 
    : `${a} + ${b}`; 

  // Return the promise immediately, without awaiting or converting to object
  return GeneratedQuestion.create({
    operation,
    level,
    beltOrDegree,
    params: { a, b },
    question: displayQuestion, 
    correctAnswer: correct,
    choices,
    source,
    seed: newSeed()
  });
}

// Returns a Promise for a Mongoose Document
function _makeDigitQuestionCreatePromise(level, beltOrDegree, d){
  // The logic for choices inside makeGenQuestion will ensure proper distractors for the answer 'd'
  return _makeGenQuestionCreatePromise(
    'add', 
    level, 
    beltOrDegree, 
    d, 
    0, 
    'previous', 
    String(d) 
  );
}

/* ---------- current belt: practice facts ---------- */
export async function practiceFactsForBelt(operation, level, beltOrDegree){
  if (isBlack(beltOrDegree)) {
    // Black degrees don't have intro practice in the frontend flow; return empty
    return [];
  }
  
  const promises = []; // Collect promises

  // L1 white special: practice == 1 item for 0+0 (frontend returns two 0+0 new items later)
  if (level === 1 && beltOrDegree === 'white') {
    promises.push(_makeGenQuestionCreatePromise('add', level, 'white', 0, 0, 'current'));
    // return [await makeGenQuestion('add', level, 'white', 0, 0, 'current')]; // old single item logic
  } else {
    const pair = await getCanonicalPair(operation, level, beltOrDegree);
    if (!pair) return [];
    const [a,b] = pair;
    const isIdentical = a===b;

    if (isIdentical) {
      // one practice question (same fact)
      promises.push(_makeGenQuestionCreatePromise(operation, level, beltOrDegree, a, b, 'current'));
    } else {
      // two practice questions (a+b) and (b+a)
      promises.push(_makeGenQuestionCreatePromise(operation, level, beltOrDegree, a, b, 'current'));
      promises.push(_makeGenQuestionCreatePromise(operation, level, beltOrDegree, b, a, 'current'));
    }
  }
  
  // <<< NEW: Execute all creations concurrently
  const docs = await Promise.all(promises);
  // Return array of plain JS objects
  return docs.map(doc => doc.toObject()); 
}

/* ---------- buildQuizSet for a belt/degree ---------- */
export async function buildQuizSet(operation, level, beltOrDegree){
  const newPromises = []; // <<< NEW: Collect new question promises
  let prevQs = [];
  const outPromises = []; // To collect ALL promises eventually

  // L1 white special: 2×(0+0) + 8 digit-recognition [0..9]
  if (!isBlack(beltOrDegree) && level===1 && beltOrDegree==='white') {
    // two new 0+0
    newPromises.push(_makeGenQuestionCreatePromise(operation, level, beltOrDegree, 0, 0, 'current','0 + 0'));
    newPromises.push(_makeGenQuestionCreatePromise(operation, level, beltOrDegree, 0, 0, 'current','0 + 0'));
    // eight digit recognition
    for (let i=0;i<8;i++){
      const d = Math.floor(Math.random()*10);
      newPromises.push(_makeDigitQuestionCreatePromise(level, beltOrDegree, d));
    }
    
    const docs = await Promise.all(newPromises);
    const out = docs.map(doc => doc.toObject());
    return reorderNoConsecutiveDuplicates(shuffle(out));
  }

  if (isBlack(beltOrDegree)) {
     const out = await buildQuizForBlack(operation, level, beltOrDegree);
    const shuffledOut = shuffle(out);
    return reorderNoConsecutiveDuplicates(shuffledOut);
  }

  // colored belt:
  const pair = await getCanonicalPair(operation, level, beltOrDegree);
  if (!pair) return [];
  const [a,b] = pair;
  const isIdentical = a===b;

  // NEW questions from current belt:
  if (isIdentical) {
    newPromises.push(_makeGenQuestionCreatePromise(operation, level, beltOrDegree, a, b, 'current'));
    newPromises.push(_makeGenQuestionCreatePromise(operation, level, beltOrDegree, a, b, 'current'));
  } else {
    newPromises.push(_makeGenQuestionCreatePromise(operation, level, beltOrDegree, a, b, 'current'));
    newPromises.push(_makeGenQuestionCreatePromise(operation, level, beltOrDegree, a, b, 'current'));
    newPromises.push(_makeGenQuestionCreatePromise(operation, level, beltOrDegree, b, a, 'current'));
    newPromises.push(_makeGenQuestionCreatePromise(operation, level, beltOrDegree, b, a, 'current'));
  }

  // Await the creation of new questions only
  const news = (await Promise.all(newPromises)).map(doc => doc.toObject()); // <<< NEW: Wait for batch creation
  
  // PREVIOUS pool: all earlier belts in same level + all belts in earlier levels
  const needPrev = 10 - news.length;
  
  if (level === 1 && beltOrDegree !== 'white') {
    // Inject digit recognition questions (4 out of the needed N) to mix in with L1 White's facts.
    const DIGIT_Q_COUNT = Math.min(4, needPrev); 
    const neededFromCanonical = Math.max(0, needPrev - DIGIT_Q_COUNT);
    
    // 1. Generate Digit Recognition Questions
    const digitPromises = [];
    for (let i = 0; i < DIGIT_Q_COUNT; i++) {
      const d = Math.floor(Math.random() * 10);
      digitPromises.push(_makeDigitQuestionCreatePromise(level, beltOrDegree, d)); 
    }
    const digitQs = (await Promise.all(digitPromises)).map(doc => doc.toObject()); // <<< NEW
    prevQs = prevQs.concat(digitQs);
    
    // 2. Get the remaining previous questions from the canonical facts pool 
    if (neededFromCanonical > 0) {
      const canonicalPool = await getPreviousPool(operation, level, beltOrDegree);
      const canonicalPrevQs = await samplePrevious(canonicalPool, neededFromCanonical); // already uses Promise.all internally
      prevQs = prevQs.concat(canonicalPrevQs);
    }
    
  } else {
    // Normal previous question logic (only canonical facts)
    const prevPool = await getPreviousPool(operation, level, beltOrDegree);
    prevQs = await samplePrevious(prevPool, needPrev); // already uses Promise.all internally
  }

  // Interleave new among previous like the frontend interleave (positions randomized)
  const finalQuizSet = interleave(news, prevQs);
  
  return reorderNoConsecutiveDuplicates(finalQuizSet);
}

/* ---------- black degrees ---------- */
async function buildQuizForBlack(operation, level, beltOrDegree){
  const { questions: totalQuestions } = getBlackTiming(beltOrDegree); // 20 or 30
  
  let numDigitQuestions = 0;
  const outPromises = []; // <<< NEW: Collect all promises here

  if (level === 1) {
    numDigitQuestions = 3; 
    // Generate the digit questions promises
    for (let i = 0; i < numDigitQuestions; i++) {
        const d = Math.floor(Math.random() * 10);
        outPromises.push(_makeDigitQuestionCreatePromise(level, beltOrDegree, d)); // <<< Push Promise
    }
  }

  const numCanonicalQuestions = totalQuestions - numDigitQuestions;
  if (numCanonicalQuestions <= 0) return []; // Return empty array if no canonical questions needed

  const pool = await getAllCanonicalPairsUpToLevel(operation, level); // union up to current level
  if (!pool.length) return [];

  // Generate canonical question promises
  for (let i = 0; i < numCanonicalQuestions; i++) {
    const [a,b] = pool[Math.floor(Math.random()*pool.length)];
    outPromises.push(_makeGenQuestionCreatePromise(operation, level, beltOrDegree, a, b, 'previous')); // <<< Push Promise
  }
  
  // <<< NEW: Execute all creations concurrently
  const docs = await Promise.all(outPromises);
  return docs.map(doc => doc.toObject()); // Return array of plain JS objects
}

/* ---------- sample previous pool (updated to use Promise.all)  ---------- */
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

// Uses the promise returning function and Promise.all
async function samplePrevious(pool, n){
  if (!pool.length) return [];
  const outPromises = [];
  for (let i=0;i<n;i++){
    const [a,b] = pool[Math.floor(Math.random()*pool.length)];
    outPromises.push(_makeGenQuestionCreatePromise('add', 0, 'prev', a, b, 'previous')); // push promise
  }
  const docs = await Promise.all(outPromises); // <<< NEW: Execute all concurrently
  return docs.map(doc => doc.toObject()); // Return array of plain JS objects
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
