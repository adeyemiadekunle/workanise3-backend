import { Request } from "express";
export interface AuthenticatedRequest extends Request {
        user?: {
          id: string;
          telegramId: string;
          firstName?: string;
          lastName?: string;
          username?: string;
          chatInstance?: string;
          photoUrl?: string;
          isPremium?:boolean;
        };
      }
    
export interface JwtPayload {
  userId: string;
  telegramId: string;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}


