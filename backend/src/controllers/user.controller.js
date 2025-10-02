// src/controllers/user.controller.js
import { getToday as getTodaySvc, getGrandTotalCorrect as getGrandTotalCorrectSvc } from '../services/daily.service.js';

export async function getToday(req, res, next) {
  try {
    const todayDoc = await getTodaySvc(req.user._id);
    const grandTotal = await getGrandTotalCorrectSvc(req.user._id); // Fetch grand total
    res.json({ 
        ...todayDoc.toObject(), // Spread existing fields (correctCount, totalActiveMs)
        grandTotal: grandTotal // Add grand total
    });
  } catch (e) { next(e); }
}

export async function getProgress(req, res, next) {
  try {
    res.json({ progress: Object.fromEntries(req.user.progress) });
  } catch (e) { next(e); }
}
