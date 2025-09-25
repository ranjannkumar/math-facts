import dayjs from 'dayjs';
import DailySummary from '../models/DailySummary.js';

export async function incDaily(userId, addCorrect = 0, addActiveMs = 0) {
  const date = dayjs().format('YYYY-MM-DD');
  const doc = await DailySummary.findOneAndUpdate(
    { user: userId, date },
    { $inc: { correctCount: addCorrect, totalActiveMs: addActiveMs } },
    { upsert: true, new: true }
  );
  return doc;
}

export async function getToday(userId) {
  const date = dayjs().format('YYYY-MM-DD');
  const doc = await DailySummary.findOne({ user: userId, date });
  return doc || { correctCount: 0, totalActiveMs: 0 };
}
