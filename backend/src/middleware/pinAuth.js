// Very lightweight "session" based on PIN put in token header for simplicity.
// In production, switch to proper JWT if you prefer.
import User from '../models/User.js';

export default async function pinAuth(req, res, next) {
  try {
    const pin = req.header('x-pin');
    if (!pin) return res.status(401).json({ error: 'PIN missing' });
    const user = await User.findOne({ pin });
    if (!user) return res.status(401).json({ error: 'Invalid PIN' });
    req.user = user;
    next();
  } catch (e) {
    next(e);
  }
}
