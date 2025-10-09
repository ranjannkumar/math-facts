import { Router } from 'express';
import pinAuth from '../middleware/pinAuth.js';
import * as UserCtrl from '../controllers/user.controller.js';

const r = Router();
r.use(pinAuth);

r.get('/daily', UserCtrl.getToday);
r.get('/progress', UserCtrl.getProgress);
r.post('/reset', UserCtrl.resetProgress); 
r.post('/theme', UserCtrl.updateTheme); 


export default r;
