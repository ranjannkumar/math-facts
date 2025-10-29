// backend/src/controllers/admin.controller.js

import User from '../models/User.js';
import DailySummary from '../models/DailySummary.js';
import { getGrandTotalActiveMs } from '../services/daily.service.js';
import dayjs from 'dayjs';

import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
dayjs.extend(utc);
dayjs.extend(timezone);

const PACIFIC_TIMEZONE = 'America/Los_Angeles';

export async function getTodayStats(req, res, next) {
  try {
    const today = dayjs().tz(PACIFIC_TIMEZONE).format('YYYY-MM-DD');

    // 1. Find all users
    const allUsers = await User.find({}).select('pin name grandTotalCorrect lastLoginDate').lean();
    const userIds = allUsers.map(u => u._id);

    const allTimeActiveMsPromises = userIds.map(id => getGrandTotalActiveMs(id)); 
    const allTimeActiveMsResults = await Promise.all(allTimeActiveMsPromises); 
    const allTimeActiveMsMap = userIds.reduce((map, id, index) => { 
        map[id.toString()] = allTimeActiveMsResults[index]; 
        return map;
    }, {});

    // 2. Fetch today's summary for all relevant users
    const todaySummaries = await DailySummary.find({
        user: { $in: userIds },
        date: today
    }).lean();

    const summaryMap = todaySummaries.reduce((map, summary) => {
        map[summary.user.toString()] = {
            todayCorrect: summary.correctCount,
            todayActiveMs: summary.totalActiveMs
        };
        return map;
    }, {});

    // 3. Combine user data with today's activity
    let adminDashboardData = allUsers.map(user => {
      const todayData = summaryMap[user._id.toString()] || { todayCorrect: 0, todayActiveMs: 0 };
      
      const loggedInToday = user.lastLoginDate === today;

      return {
        _id: user._id,
        name: user.name,
        pin: user.pin,
        loggedInToday: loggedInToday,
        // Daily Stats
        todayCorrect: todayData.todayCorrect,
        todayActiveMs: todayData.todayActiveMs,
        // Total Stats
        grandTotalCorrect: user.grandTotalCorrect,
        grandTotalActiveMs: allTimeActiveMsMap[user._id.toString()] || 0,
        // The grandTotalActiveMs requires querying all DailySummary entries for a user, 
        // which can be slow.
      };
    });;

    adminDashboardData = adminDashboardData.filter(student => student.loggedInToday && (student.todayActiveMs > 0 || student.todayCorrect > 0));

    res.json(adminDashboardData);
  } catch (e) {
    next(e);
  }
}