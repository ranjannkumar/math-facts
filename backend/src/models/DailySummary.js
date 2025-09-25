import mongoose from 'mongoose';

const DailySummarySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  date: { type: String, index: true }, // YYYY-MM-DD
  correctCount: { type: Number, default: 0 },
  totalActiveMs: { type: Number, default: 0 }
}, { timestamps: true });

DailySummarySchema.index({ user:1, date:1 }, { unique: true });

export default mongoose.model('DailySummary', DailySummarySchema);
