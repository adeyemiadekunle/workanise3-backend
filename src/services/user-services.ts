//user service
import prisma from "../db";
import createLogger from "../utils/logger";
import { User } from '@prisma/client';

const logger = createLogger("UserService");

export class UserService {
 
  static async getUserByTelegramId(telegramId: string) {
    return prisma.user.findUnique({ where: { telegramId } });
  }

  static async updateUser(userId: string, data: Partial<User>) {
    logger.logInfo(`Updating user with ID: ${userId}`);
    return prisma.user.update({ where: { id: userId }, data });
  }
}


