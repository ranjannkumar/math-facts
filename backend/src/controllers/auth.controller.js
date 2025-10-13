// backend/src/controllers/auth.controller.js
import User from '../models/User.js';
import { getToday as getTodaySvc, getGrandTotalCorrect as getGrandTotalCorrectSvc } from '../services/daily.service.js';

export async function loginPin(req, res, next) {
  try {
    const { pin, name } = req.body || {};
    if (!pin) return res.status(400).json({ error: 'PIN required' });

    let user = await User.findOne({ pin });
    if (!user) {
      user = await User.create({ pin, name: name || 'Player' });
      // unlock first level + white belt by default
      const key = 'L1';
      user.progress.set(key, { 
          level: 1, 
          unlocked: true, // Mark level as unlocked
          white: { unlocked: true, completed: false } // Mark white belt as unlocked for L1
      });
      await user.save();
    }

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
        }
      }, 
      token: pin 
    }); 
  } catch (e) {
    next(e);
  }
}
