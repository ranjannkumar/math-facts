import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import QuestionTemplate from '../models/QuestionTemplate.js';
import Catalog from '../models/Catalog.js';

// This SPEC mirrors the frontend specFacts (one canonical pair per belt).
// We read the *first* fact of each belt from the frontend table and store that
// single canonical pair in DB. (For identical pairs it will be a==b.)
const SPEC = {
  1: {
    white: [0,0],
    yellow: [0,1],
    green:  [0,2],
    blue:   [0,3],
    red:    [0,4],
    brown:  [0,5],
  },
  2: {
    white: [1,1],
    yellow:[1,2],
    green: [1,3],
    blue:  [1,4],
    red:   [2,2],
    brown: [2,3],
  },
  3: {
    white: [0,6],
    yellow:[0,7],
    green: [0,8],
    blue:  [9,0],
    red:   [1,5],
    brown: [2,4],
  },
  4: {
    white: [1,6],
    yellow:[1,7],
    green: [1,8],
    blue:  [1,9],
    red:   [2,4],
    brown: [2,5],
  },
  5: {
    white: [2,6],
    yellow:[2,7],
    green: [2,8],
    blue:  [3,3],
    red:   [3,4],
    brown: [3,5],
  },
  6: {
    white: [3,6],
    yellow:[3,7],
    green: [4,4],
    blue:  [4,5],
    red:   [4,6],
    brown: [5,5],
  },
};

const ADD = 'add';
const BELTS = ['white','yellow','green','blue','red','brown'];
const identical = (a,b) => a===b;

async function seedLevel(level) {
  for (const belt of BELTS) {
    const pair = SPEC[level]?.[belt];
    if (!pair) continue;
    const [a,b] = pair;

    // Store one canonical pair per belt in Catalog
    await Catalog.findOneAndUpdate(
      { operation: ADD, level, belt },
      { operation: ADD, level, belt, facts: [{ a, b, identical: identical(a,b) }] },
      { upsert: true }
    );

    // Store one QuestionTemplate per belt
    await QuestionTemplate.findOneAndUpdate(
      { operation: ADD, level, beltOrDegree: belt },
      {
        operation: ADD,
        level,
        beltOrDegree: belt,
        a, b,
        isIdenticalPair: identical(a,b),
        factType: identical(a,b) ? 'identical' : 'non-identical',
        metadata: {}
      },
      { upsert: true }
    );
  }
}

(async () => {
  await connectDB();
  for (let lvl=1; lvl<=6; lvl++) {
    await seedLevel(lvl);
  }
  console.log('✅ Seeded one canonical (a,b) per belt for levels 1..6 (addition)');
  await mongoose.disconnect();
})();
