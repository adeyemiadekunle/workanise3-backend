import { Request, Response } from "express";
import { AuthenticatedRequest } from "../types";
import prisma from "../db";
import createLogger from "../utils/logger";
import jwt, { JwtPayload } from "jsonwebtoken";
import { RewardService } from "./reward-service";

const ACCESS_TOKEN_EXPIRY = "10m"; // Short-lived access token
const REFRESH_TOKEN_EXPIRY = "1d"; // Long-lived refresh token
const JWT_SECRET = process.env.JWT_SECRET!;

const logger = createLogger("Auth");

const loginOrSignup = async (req: AuthenticatedRequest, res: Response) => {
  try {
    logger.logInfo("Received login/signup request", { user: req.user, body: req.body });

    const { id: telegramId, firstName, lastName, username, photoUrl, isPremium, chatInstance  } = req.user!;
    const { referralCode } = req?.body;

    if (!telegramId ) {
      logger.logError(
        "Missing required fields",
        new Error("telegramId  is missing"),
        { telegramId }
      );
      return res.status(400).json({ error: "Missing required fields" });
    }

    let user = await prisma.user.findUnique({
      where: { telegramId: telegramId.toString() },
    });

    if (!user) {
      logger.logInfo("User not found, creating new user", { telegramId });

      let referredBy: string | undefined;
      if (referralCode) {
        const referrer = await prisma.user.findFirst({
          where: { referralCode: referralCode },
        });
        if (referrer) {
          referredBy = referrer.id;
        }
      }

      user = await prisma.user.create({
        data: {
          telegramId: telegramId.toString(), // Convert to string
          firstName,
          lastName,
          username,
          photoUrl,
          isPremium: isPremium ?? false, // Use nullish coalescing
          referralCode: generateReferralCode(parseInt(telegramId)),
          referredBy: referredBy ? { connect: { id: referredBy } } : undefined, // Use connect for relation
          chatInstance, // Remove 'as string' cast
        },
      });

      if (referredBy) {
        try {
          await RewardService.distributeReferralReward(referredBy, referralCode);
        } catch (error) {
          logger.logError(
            "Error distributing referral reward",
            error as Error,
            { referrerId: referredBy, referralCode }
          );
        }
      }
    } else {
      logger.logInfo("User found, updating information", { userId: user.id });
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName,
          lastName,
          username,
          photoUrl,
          isPremium: isPremium ?? user.isPremium, // Update isPremium if provided
        },
      });
    }

    const accessToken = generateAccessToken(user.id, user.telegramId);
    const refreshToken = generateRefreshToken(user.id, user.telegramId);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    logger.logInfo("Login/signup successful", { userId: user.id });
    return res.status(200).json({
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          telegramId: user.telegramId,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          photoUrl: user.photoUrl,
          referralCode: user.referralCode,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    logger.logError("Error in loginOrSignup", error as Error);
    res.status(500).json({ error: "Internal server error" });
  }
};



const generateAccessToken = (userId: string, telegramId: string): string => {
  return jwt.sign({ userId, telegramId }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
};

const generateRefreshToken = (userId: string, telegramId: string): string => {
  return jwt.sign({ userId, telegramId }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
};

const generateReferralCode = (telegramId: number): string => {
  return `${telegramId.toString(36).toUpperCase()}${Date.now()
    .toString(36)
    .slice(-4)
    .toUpperCase()}`;
};

const refreshAccessToken = async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  const refreshToken = authHeader && authHeader.split(" ")[1];

  if (!refreshToken) {
    logger.logWarning("Refresh token missing from request");
    return res.status(400).json({ error: "Refresh token required" });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as JwtPayload & { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || user.refreshToken !== refreshToken) {
      logger.logWarning("Invalid refresh token", { userId: decoded.userId });
      return res.status(403).json({ error: "Invalid refresh token" });
    }

    const newAccessToken = generateAccessToken(user.id, user.telegramId);
    const newRefreshToken = generateRefreshToken(user.id, user.telegramId);

    // Update the user's refresh token in the database
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    logger.logInfo("Access token refreshed successfully", { userId: user.id });
    return res.status(200).json({
      message: "Access token retrieved successfully",
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      }
    });
  } catch (error) {
    logger.logError("Error refreshing access token", error as Error);
    return res.status(403).json({ error: "Invalid or expired refresh token" });
  }
};

export { refreshAccessToken, loginOrSignup };
