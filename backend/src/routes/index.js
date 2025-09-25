import { Router } from 'express';
import authRoutes from './auth.routes.js';
import quizRoutes from './quiz.routes.js';
import userRoutes from './user.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/quiz', quizRoutes);
router.use('/user', userRoutes);

export default router;
