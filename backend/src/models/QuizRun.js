import mongoose from 'mongoose';

const QuizItemSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'GeneratedQuestion', required: true },
  practiceRequired: { type: Boolean, default: false },
  practiced: { type: Boolean, default: false }
}, { _id: false });

const StatsSchema = new mongoose.Schema({
  correct: { type: Number, default: 0 },
  wrong: { type: Number, default: 0 }
}, { _id: false });

const QuizRunSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  operation: { type: String, enum: ['add','sub','mul','div'], required: true },
  level: { type: Number, required: true },
  beltOrDegree: { type: String, required: true }, // belts or black-N
  status: { type: String, enum: ['prepared','in-progress','completed','failed'], default: 'prepared' },
  items: [QuizItemSchema],
  currentIndex: { type: Number, default: 0 },
  startedAt: { type: Date },
  pausedAt: { type: Date },
  totalActiveMs: { type: Number, default: 0 },
  stats: StatsSchema,
  timer: {
    // for black degrees: limitMs > 0; for color belts: limitMs = 0 (no hard cutoff)
    limitMs: { type: Number, default: 0 },
    remainingMs: { type: Number, default: 0 }
  }
}, { timestamps: true });

QuizRunSchema.index({ user:1, status:1 });

export default mongoose.model('QuizRun', QuizRunSchema);
