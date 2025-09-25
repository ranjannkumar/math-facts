import { Router } from 'express';
import * as Auth from '../controllers/auth.controller.js';

const r = Router();
r.post('/login-pin', Auth.loginPin);
export default r;
