import mongoose from 'mongoose';

const ProgressSchema = new mongoose.Schema({
  level: { type: Number, required: true }, // 1..6 (colored), then black degrees stored separately
  belt: { type: String, enum: ['white','yellow','green','blue','red','brown'], required: false },
  completed: { type: Boolean, default: false },
  unlocked: { type: Boolean, default: false },
  // black progression
  black: {
    unlocked: { type: Boolean, default: false },
    completedDegrees: [{ type: Number }] // e.g., [1,2,3]
  }
}, { _id: false });

const DailyStatsSchema = new mongoose.Schema({
  date: { type: String, index: true }, // YYYY-MM-DD
  correctCount: { type: Number, default: 0 },
  totalActiveMs: { type: Number, default: 0 }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  pin: { type: String, required: true, unique: true, index: true },
  name: { type: String },
  theme: { type: String, default: 'default' },
  progress: {
    type: Map,
    of: ProgressSchema, // key like "L1", "L2"
    default: {}
  },
  dailyStats: {
    type: Map,
    of: DailyStatsSchema,
    default: {}
  }
}, { timestamps: true });

export default mongoose.model('User', UserSchema);
