// src/routes/gameRoutes.ts

import { RequestHandler, Router } from 'express';
import gameController from '../controllers/game -controller';
import { authenticateToken } from '../middlewares/telegram-auth-middleware';

const router = Router();

// middleware to check if the user is authenticated
// Apply authentication middleware to all routes
router.use(authenticateToken as RequestHandler);


router.post('/session/start', gameController.startSession);

router.post('/earnings/claim', gameController.claimEarnings);


export default router;
