// backend/src/routes/admin.routes.js

import { Router } from 'express';
import * as AdminCtrl from '../controllers/admin.controller.js';
import * as PinAuth from '../middleware/pinAuth.js'; // [!code ++]

const r = Router();

// Middleware to check for the hardcoded admin PIN
const adminPinAuth = (req, res, next) => {
  const pin = req.header('x-pin');
  // Hardcoded admin PIN: 7878
  if (pin === '7878') {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized: Invalid Admin PIN' });
};

r.use(adminPinAuth);

// Endpoint to get all student stats
r.get('/today-stats', AdminCtrl.getTodayStats);


export default r;