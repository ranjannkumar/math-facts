import { Router } from 'express';
import pinAuth from '../middleware/pinAuth.js';
import * as Quiz from '../controllers/quiz.controller.js';

const r = Router();
r.use(pinAuth);

r.post('/prepare', Quiz.prepare);
r.post('/practice/answer', Quiz.practiceAnswer);
r.post('/start', Quiz.start);
r.post('/answer', Quiz.answer);
r.post('/inactivity', Quiz.inactivity);
r.post('/complete', Quiz.complete);

export default r;
