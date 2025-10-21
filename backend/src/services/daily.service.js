import dayjs from 'dayjs';
import DailySummary from '../models/DailySummary.js';

import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
dayjs.extend(utc);
dayjs.extend(timezone);

const PACIFIC_TIMEZONE = 'America/Los_Angeles'; // US Pacific Time Zone

// HELPER TO GET NOW IN PST/PDT
const nowInPacific = () => dayjs().tz(PACIFIC_TIMEZONE);

// Sentinel value to track report sending status globally.
// This is used as a hardcoded ID for a non-user specific DailySummary entry.
const REPORT_SENTINEL_USER_ID = '000000000000000000000000';

export async function incDaily(userId, addCorrect = 0, addActiveMs = 0) {
  const date = nowInPacific().format('YYYY-MM-DD');
  const doc = await DailySummary.findOneAndUpdate(
    { user: userId, date },
    { $inc: { correctCount: addCorrect, totalActiveMs: addActiveMs } },
    { upsert: true, new: true }
  );
  const grandTotal = await getGrandTotalCorrect(userId);
  return { ...doc.toObject(), grandTotal }; 
}

export async function getToday(userId) {
  const date = nowInPacific().format('YYYY-MM-DD');
  const doc = await DailySummary.findOne({ user: userId, date });
  return doc || { correctCount: 0, totalActiveMs: 0 };
}

// NEW FUNCTION: Check if the daily report was already marked as sent for a given date
export async function isReportSent(date) {
    const doc = await DailySummary.findOne({ 
        user: REPORT_SENTINEL_USER_ID, 
        date 
    });
    return !!doc;
}

// NEW FUNCTION: Mark the daily report as sent for a given date
export async function setReportSent(date) {
    await DailySummary.findOneAndUpdate(
        { user: REPORT_SENTINEL_USER_ID, date },
        { $set: { correctCount: 1 } }, // Use a simple field update
        { upsert: true }
    );
}

// NEW FUNCTION: Calculate the grand total correct score
export async function getGrandTotalCorrect(userId) {
  if (userId === REPORT_SENTINEL_USER_ID) return 0;
  const result = await DailySummary.aggregate([
    { $match: { user: userId } },
    { $group: { _id: null, grandTotal: { $sum: '$correctCount' } } }
  ]);
  return result[0]?.grandTotal || 0;
}

export async function getDailySummariesForYesterday() {
 const yesterday = nowInPacific().subtract(1, 'day').format('YYYY-MM-DD');
  
  // Populate the 'user' field to include the user's name and pin
  const summaries = await DailySummary.find({
     date: yesterday ,
      user: { $ne: REPORT_SENTINEL_USER_ID }
   })
      .populate('user', 'name pin') 
      .lean(); 

  return summaries;
}
