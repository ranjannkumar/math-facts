// backend/src/controllers/auth.controller.js
import User from '../models/User.js';
import { getToday as getTodaySvc, getGrandTotalCorrect as getGrandTotalCorrectSvc } from '../services/daily.service.js';
import dayjs from 'dayjs';


function updateStreak(user) {
    const today = dayjs().format('YYYY-MM-DD');
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

    if (user.lastLoginDate === today) {
        // Already logged in today, streak is preserved
        return user.currentStreak;
    }
    
    if (user.lastLoginDate === yesterday) {
        // Logged in yesterday, increment streak
        user.currentStreak = (user.currentStreak || 0) + 1;
    } else {
        // Missed a day or first login, start/reset streak
        user.currentStreak = 1;
    }
    
    user.lastLoginDate = today;
    return user.currentStreak;
}


export async function loginPin(req, res, next) {
  try {
    const { pin, name } = req.body || {};
    if (!pin) return res.status(400).json({ error: 'PIN required' });

    let user = await User.findOne({ pin });
    if (user) {
      // Existing User: Check if the provided name matches the stored name
      if (user.name.toLowerCase() !== name.toLowerCase()) {
        // UPDATED: Return a specific 401 response with a descriptive error message
        return res.status(401).json({ 
          error: { 
            message: 'Pin already exists, please enter correct name.',
            code: 'INCORRECT_NAME' // Add a custom code for easier debugging if needed
          }
        });
      }
      // If it matches, continue with login
    } else {
      // New User: Create new user with the provided pin and name
      if (!name) {
          // Safety check: Should not happen if frontend validates name
          return res.status(400).json({ error: 'Name required for new user signup.' });
      }
      user = await User.create({ pin, name });
      
      // unlock first level + white belt by default
      const key = 'L1';
      user.progress.set(key, { 
          level: 1, 
          unlocked: true, // Mark level as unlocked
          white: { unlocked: true, completed: false } // Mark white belt as unlocked for L1
      });
      await user.save();
    }

     const newStreak = updateStreak(user);

     // Fetch required daily stats and embed into single response ---
    const [todayDoc] = await Promise.all([
      getTodaySvc(user._id),
    ]);

    // Part 3: Return user object including theme, progress, and dailyStats in one payload
    res.json({ 
      user: { 
        ...user.toObject(), 
        theme: user.theme,
        // NEW: Read the denormalized total from the user object
        grandTotal: user.grandTotalCorrect,
        // Embed progress data (converted from Mongoose Map)
        progress: Object.fromEntries(user.progress), 
        // Embed daily stats data
        dailyStats: { 
          correctCount: todayDoc.correctCount || 0,
          totalActiveMs: todayDoc.totalActiveMs || 0,
        },
        currentStreak: newStreak,
      }, 
      token: pin 
    }); 
  } catch (e) {
    if (e.code === 11000) { // MongoDB duplicate key error (PIN already exists)
        return res.status(409).json({ error: 'Passcode already in use. Please enter your name with that passcode.' });
    }
    next(e);
  }
}
