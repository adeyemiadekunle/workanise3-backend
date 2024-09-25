// user routes
import { Router } from 'express';
import UserController from '../controllers/user-controller';
import { authenticateToken } from '../middlewares/telegram-auth-middleware';

const router = Router();


router.get('/', authenticateToken, UserController.getUser);

router.put('/', authenticateToken, UserController.updateUser);

export default router;
