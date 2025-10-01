import mongoose from 'mongoose';

const BeltStatusSchema = new mongoose.Schema({
  completed: { type: Boolean, default: false },
  unlocked: { type: Boolean, default: false },
}, { _id: false });

const BlackProgressSchema = new mongoose.Schema({
  unlocked: { type: Boolean, default: false },
  completedDegrees: [{ type: Number }]
}, { _id: false });

const ProgressSchema = new mongoose.Schema({
  level: { type: Number, required: true },
  completed: { type: Boolean, default: false },
  unlocked: { type: Boolean, default: false },

  // FIX: Explicitly define fields for all belts to ensure they persist correctly
  white: { type: BeltStatusSchema, default: {} },
  yellow: { type: BeltStatusSchema, default: {} },
  green: { type: BeltStatusSchema, default: {} },
  blue: { type: BeltStatusSchema, default: {} },
  red: { type: BeltStatusSchema, default: {} },
  brown: { type: BeltStatusSchema, default: {} },
  
  // black progression
  black: { type: BlackProgressSchema, default: {} },
}, { _id: false });

const DailyStatsSchema = new mongoose.Schema({
  date: { type: String, index: true }, // YYYY-MM-DD
  correctCount: { type: Number, default: 0 },
  totalActiveMs: { type: Number, default: 0 }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  pin: { type: String, required: true, unique: true, index: true },
  name: { type: String },
  theme: { type: String, default: 'animals' },
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
