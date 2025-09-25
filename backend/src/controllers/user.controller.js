// src/controllers/user.controller.js
import { getToday as getTodaySvc } from '../services/daily.service.js';

export async function getToday(req, res, next) {
  try {
    const doc = await getTodaySvc(req.user._id);
    res.json(doc);
  } catch (e) { next(e); }
}

export async function getProgress(req, res, next) {
  try {
    res.json({ progress: Object.fromEntries(req.user.progress) });
  } catch (e) { next(e); }
}
