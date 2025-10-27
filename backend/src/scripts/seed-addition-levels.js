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
  7: {
    white: [0,11],
    yellow:[0,12],
    green: [0,13],
    blue:  [0,14],
    red:   [0,15],
    brown: [1,10],
  },
  8: {
    white: [1,11],
    yellow:[1,12],
    green: [1,13],
    blue:  [1,14],
    red:   [2,9],
    brown: [2,10],
  },
  9: {
    white: [2,11],
    yellow:[2,12],
    green: [2,13],
    blue:  [3,8],
    red:   [3,9],
    brown: [3,10],
  },
  10: {
    white: [3,11],
    yellow:[3,12],
    green: [4,7],
    blue:  [4,8],
    red:   [4,9],
    brown: [4,10],
  },
  11: {
    white: [4,11],
    yellow:[5,6],
    green: [5,7],
    blue:  [5,8],
    red:   [5,9],
    brown: [5,10],
  },
  12: {
    white: [6,6],
    yellow:[6,7],
    green: [6,8],
    blue:  [6,9],
    red:   [7,7],
    brown: [7,8],
  },
  13: {
     white: [0, 16],
     yellow: [0, 17],
     green: [0, 18],
     blue: [0, 19],
     red: [0, 20],
     brown: [1, 15],
  },
  14: { 
    white: [1, 16], 
    yellow: [1, 17],
    green: [1, 18],
    blue: [2, 14],
    red: [2, 15],
    brown: [2, 16],
  },
  15: { 
    white: [2, 17], 
    yellow: [3, 13], 
    green: [3, 14], 
    blue: [3, 15], 
    red: [3, 16], 
    brown: [4, 12], 
  },
  16: { 
    white: [4, 13], 
    yellow: [4, 14], 
    green: [4, 15], 
    blue: [5, 11], 
    red: [5, 12], 
    brown: [5, 13],
  },
  17: { 
    white: [5, 14], 
    yellow: [6, 10], 
    green: [6, 11], 
    blue: [6, 12], 
    red: [6, 13], 
    brown: [7, 9] 
  },
  18: { 
    white: [7, 10], 
    yellow: [7, 11], 
    green: [7, 12], 
    blue: [8, 8], 
    red: [8, 9], 
    brown: [8, 10],
  },
  19: { 
    white: [8, 11], 
    yellow: [9, 9], 
    green: [9, 10], 
    blue: [10, 10], 
    red: [10, 11], 
    brown: [10, 12], 
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
  for (let lvl=1; lvl<=19; lvl++) {
    await seedLevel(lvl);
  }
  console.log('✅ Seeded one canonical (a,b) per belt for levels 1..19 (addition)');
  await mongoose.disconnect();
})();
