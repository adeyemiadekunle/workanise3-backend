// reward service
import prisma from "../db";
import { REFERRAL_REWARD } from "../constants";
import createLogger from '../utils/logger';

const logger = createLogger('RewardService');



export class RewardService {
  static async distributeReferralReward(referrerId: string, referralCode: string) {
    try {
      const referrer = await prisma.user.findFirst({
        where: {
          referralCode: referralCode,
        },
      });

      if (!referrer) {
        throw new Error("Referrer not found");
      }  

      const referral = await prisma.user.findFirst({
        where: {
          referredBy: {
            some: {
              id: referrer.id,
            },
          },
        },
      });

      if (!referral) {
        throw new Error("Referral not found");
      }

      await prisma.user.update({
        where: {
          id: referral.id,
        },
        data: {
          balance: {
            increment: REFERRAL_REWARD,
          },
        },
      });   

      logger.logInfo("Referral reward distributed", {
        referrerId,
        amount: REFERRAL_REWARD,
      });
    } catch (error) {
      logger.logError("Error distributing referral reward", error as Error, { referrerId });
     
    }
  }
}

