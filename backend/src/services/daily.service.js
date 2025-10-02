import dayjs from 'dayjs';
import DailySummary from '../models/DailySummary.js';

export async function incDaily(userId, addCorrect = 0, addActiveMs = 0) {
  const date = dayjs().format('YYYY-MM-DD');
  const doc = await DailySummary.findOneAndUpdate(
    { user: userId, date },
    { $inc: { correctCount: addCorrect, totalActiveMs: addActiveMs } },
    { upsert: true, new: true }
  );
  const grandTotal = await getGrandTotalCorrect(userId);
  return { ...doc.toObject(), grandTotal }; 
}

export async function getToday(userId) {
  const date = dayjs().format('YYYY-MM-DD');
  const doc = await DailySummary.findOne({ user: userId, date });
  return doc || { correctCount: 0, totalActiveMs: 0 };
}

// NEW FUNCTION: Calculate the grand total correct score
export async function getGrandTotalCorrect(userId) {
  const result = await DailySummary.aggregate([
    { $match: { user: userId } },
    { $group: { _id: null, grandTotal: { $sum: '$correctCount' } } }
  ]);
  return result[0]?.grandTotal || 0;
}
