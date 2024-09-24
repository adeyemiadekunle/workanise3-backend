// src/routes/gameRoutes.ts

import { Router } from 'express';
import gameController from '../controllers/gameController';

const router = Router();

// Define routes for game actions
router.post('/session/create', gameController.createSession);
router.post('/session/start', gameController.startSession);
router.post('/session/end', gameController.endSession);
router.post('/earnings/claim', gameController.claimEarnings);
router.post('/penalty/apply', gameController.applyPenalty);
router.post('/reward/consistency', gameController.rewardConsistency);

export default router;
