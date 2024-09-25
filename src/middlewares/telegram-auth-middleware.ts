import { Request, Response, NextFunction, RequestHandler } from "express";
import crypto from "crypto";
import jwt, { JwtPayload } from "jsonwebtoken";
import prisma from "../db";
import createLogger from "../utils/logger";
import { AuthenticatedRequest, TelegramUser } from "../types";
import { parse, validate } from "@telegram-apps/init-data-node";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const JWT_SECRET = process.env.JWT_SECRET!;
const logger = createLogger("AuthMiddleware");

const verifyTelegramWebAppData: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authReq = req as AuthenticatedRequest;

  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('TelegramWebAppData ')) {
    return res.status(401).json({ error: "No Telegram Web App init data provided" });
  }

  const initData = authHeader.slice('TelegramWebAppData '.length);

  try {
    // Validate the init data
    validate(initData, BOT_TOKEN);

    // If validation passes, parse the init data
    const parsedData = parse(initData);

    if (!parsedData.user) {
      return res.status(401).json({ error: "No user data found in init data" });
    }

    // Attach the verified Telegram user data to the request
    authReq.user = {
      id: parsedData.user.id.toString(),
      telegramId: parsedData.user.id.toString(),
      firstName: parsedData.user.firstName,
      lastName: parsedData.user.lastName,
      username: parsedData.user.username,
      chatInstance: parsedData.chatInstance,
      photoUrl: parsedData.user.photoUrl,
      isPremium: parsedData.user.isPremium,
    };

    next();
  } catch (error) {
    logger.logError("Error validating Telegram Web App data", error as Error);
    return res.status(401).json({ error: "Invalid Telegram Web App data" });
  }
};

const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    logger.logInfo("Access attempt without token");
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Verify the user exists in the database with both id and telegramId
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.userId,
        telegramId: decoded.telegramId,
      },
    });

    if (!user) {
      logger.logWarning("User not found in the database");
      return res.status(403).json({ error: "User not found" });
    }

    req.user = {
      id: decoded.userId,
      telegramId: decoded.telegramId,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.logWarning("Invalid token", { error: error.message });
      return res.status(403).json({ error: "Invalid token" });
    } else if (error instanceof jwt.TokenExpiredError) {
      logger.logInfo("Expired token");
      return res.status(403).json({ error: "Token expired" });
    } else {
      logger.logError("Unexpected error in token verification", error as Error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
};

export {
  verifyTelegramWebAppData,
  authenticateToken,
  AuthenticatedRequest,
};
