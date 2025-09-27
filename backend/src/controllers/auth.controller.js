import User from '../models/User.js';

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
    res.json({ user, token: pin }); // simple: frontend sends x-pin header with this pin
  } catch (e) {
    next(e);
  }
}
