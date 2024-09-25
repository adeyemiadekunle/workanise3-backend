// user controller
import { Request, Response } from 'express';
import { UserService } from '../services/user-services';
import { AuthenticatedRequest } from '../types';
import createLogger from '../utils/logger';

const logger = createLogger('UserController');


class UserController {
  async getUser(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      const user = await UserService.getUserByTelegramId(authReq.user.telegramId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      logger.logError('Error in getUser:', error as Error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      const updatedUser = await UserService.updateUser(authReq.user.id, req.body);
      res.json(updatedUser);
    } catch (error) {
      logger.logError('Error in updateUser:', error as Error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  
}

export default new UserController();

