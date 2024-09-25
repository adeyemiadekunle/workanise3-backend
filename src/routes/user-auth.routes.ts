// user auth routes
import { Router } from 'express';
import UserAuthController from '../controllers/user-auth-controller';
import { verifyTelegramWebAppData } from '../middlewares/telegram-auth-middleware';


const router = Router();

router.post('/login', verifyTelegramWebAppData, UserAuthController.authenticate);

router.post('/refresh', UserAuthController.refreshToken);


export default router;
