// src/routes/appRoutes.ts

import { Router } from 'express';
import gameRoutes from './routes/game.routes';
import userRoutes from './routes/user.routes';
import userAuthRoutes from './routes/user-auth.routes';
import taskRoutes from './routes/task.routes';

const router = Router();

// Register all route modules
router.use('/game', gameRoutes);
router.use('/user', userRoutes);
router.use('/auth', userAuthRoutes);
router.use('/task', taskRoutes);



export default router;
