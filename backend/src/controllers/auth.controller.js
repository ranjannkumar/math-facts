// backend/src/controllers/auth.controller.js
import User from '../models/User.js';

/**
 * Fast PIN login:
 * - Read path uses .select(...).lean() for minimal overhead.
 * - Create path returns a small plain object (no extra populate/hydration).
 * - Ensures theme fallback and initializes L1/white belt when creating.
 */
export async function loginPin(req, res, next) {
  try {
    const { pin, name } = req.body || {};
    if (!pin) return res.status(400).json({ error: 'PIN required' });

    // Only fetch what we need; lean = plain object (faster, no doc hydration)
    const FIELDS = '_id pin name theme progress';
    let user = await User.findOne({ pin }).select(FIELDS).lean();

    if (!user) {
      // Create new user with initial progress (object to match common schemas)
      const created = await User.create({
        pin,
        name: (typeof name === 'string' && name.trim()) ? name.trim() : 'Player',
        progress: {
          L1: {
            level: 1,
            unlocked: true,
            white: { unlocked: true, completed: false }
          }
        }
      });

      // Return a small plain object (no toObject needed for lean consistency)
      user = {
        _id: created._id,
        pin: created.pin,
        name: created.name,
        theme: created.theme ?? 'animals',
        progress: created.progress
      };
    } else {
      // Ensure theme fallback for existing users
      if (!user.theme) user.theme = 'animals';
    }

    res.json({ user, token: pin });
  } catch (e) {
    next(e);
  }
}
