import mongoose from 'mongoose';

const AttemptSchema = new mongoose.Schema({
  quizRun: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizRun', index: true },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'GeneratedQuestion' },
  userAnswer: { type: Number },
  isCorrect: { type: Boolean },
  respondedAt: { type: Date, default: Date.now },
  responseMs: { type: Number, default: 0 },
  triggeredPractice: { type: Boolean, default: false },
  practiceCompleted: { type: Boolean, default: false },
  reason: { type: String, enum: ['answer','inactivity'] } // why attempt/practice triggered
}, { timestamps: true });

export default mongoose.model('Attempt', AttemptSchema);
