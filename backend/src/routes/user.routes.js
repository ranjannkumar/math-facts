import { Router } from 'express';
import pinAuth from '../middleware/pinAuth.js';
import * as UserCtrl from '../controllers/user.controller.js';

const r = Router();
r.use(pinAuth);

r.get('/daily', UserCtrl.getToday);
r.get('/progress', UserCtrl.getProgress);

export default r;
