// src/controllers/user.controller.js
import { getToday as getTodaySvc, getGrandTotalCorrect as getGrandTotalCorrectSvc } from '../services/daily.service.js';
import { resetAllProgress as resetAllProgressSvc } from '../services/progression.service.js';
import User from '../models/User.js'; 

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

export async function updateTheme(req, res, next) {
  try {
    const { themeKey } = req.body;
    if (!themeKey) return res.status(400).json({ error: 'Theme key required' });

    // Check if theme is already set (not null/empty string)
    if (req.user.theme && req.user.theme.length > 0) {
        // Theme already selected, user cannot change it
        return res.status(403).json({ error: 'Theme selection is locked after first choice.' });
    }
    
    // Save the new theme for the first time
    req.user.theme = themeKey;
    await req.user.save();

    res.status(200).json({ success: true, theme: req.user.theme });
  } catch (e) { next(e); }
}
