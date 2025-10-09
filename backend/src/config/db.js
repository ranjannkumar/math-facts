import mongoose from 'mongoose';
import { cacheCanonicalPairs } from '../services/question.service.js'; 

export default async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI not set');
  await mongoose.connect(uri, { autoIndex: true });
  console.log('🗄️  MongoDB connected: ', uri);
   await cacheCanonicalPairs(); 
}
