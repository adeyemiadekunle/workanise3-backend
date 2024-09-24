// src/routes/appRoutes.ts

import { Router } from 'express';
import gameRoutes from './routes/gameRoute';

const router = Router();

// Register all route modules
router.use('/game', gameRoutes);

export default router;
