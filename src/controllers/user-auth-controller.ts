import { Response, Request } from 'express';
import { AuthenticatedRequest } from '../middlewares/telegram-auth-middleware';
import { loginOrSignup, refreshAccessToken } from '../services/user-auth-service';

class UserAuthController {
  async authenticate(req: Request, res: Response) {
    try {
      // Proposal the type to AuthenticatedRequest to match the expected type for middleware
      const authReq = req as AuthenticatedRequest;

      await loginOrSignup(authReq, res);
    } catch (error) {
      console.error('Error in authenticate:', error);
      res.status(500).json({ error: 'Internal server error during authentication' });
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      // Proposal the type to AuthenticatedRequest
      const authReq = req as AuthenticatedRequest;

      await refreshAccessToken(authReq, res);
    } catch (error) {
      console.error('Error in refreshToken:', error);
      res.status(500).json({ error: 'Internal server error during token refresh' });
    }
  }
}

export default new UserAuthController();
