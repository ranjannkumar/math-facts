// src/controllers/user.controller.js
import { getToday as getTodaySvc, getGrandTotalCorrect as getGrandTotalCorrectSvc } from '../services/daily.service.js';
import { resetAllProgress as resetAllProgressSvc } from '../services/progression.service.js';

export async function getToday(req, res, next) {
  try {
    const todayDoc = await getTodaySvc(req.user._id);
    const grandTotal = await getGrandTotalCorrectSvc(req.user._id); // Fetch grand total
    // Check if todayDoc is a Mongoose document before calling toObject()
    const todayData = todayDoc.toObject 
        ? todayDoc.toObject() 
        : todayDoc;
        
    res.json({ 
        ...todayData, // Use the extracted data
        grandTotal: grandTotal // Add grand total
    });
  } catch (e) { next(e); }
}

export async function getProgress(req, res, next) {
  try {
    res.json({ progress: Object.fromEntries(req.user.progress) });
  } catch (e) { next(e); }
}

// --- ADD THIS FUNCTION ---
export async function resetProgress(req, res, next) {
  try {
    const updatedUser = await resetAllProgressSvc(req.user);
    // Respond with a 204 No Content or success message
    res.status(200).json({ success: true, message: 'Progress reset successfully.', user: updatedUser });
  } catch (e) { 
    next(e); 
  }
}
