import cron from 'node-cron';
import GameService from '../services/gameService';
import prisma from '../db';
import { SessionStatus } from '@prisma/client';
import createLogger from '../utils/logger';
import AsyncLock from 'async-lock';

const logger = createLogger('SessionScheduler');
const lock = new AsyncLock();

const startSessionScheduler = () => {
  // Schedule a job to run every minute to check for active sessions and cooldown eligibility
  cron.schedule('* * * * *', async () => {
    logger.logInfo('Checking for active sessions and users eligible for a new session...');

    try {
      const now = new Date();

      // Check for active sessions to end after the defined activeSessionDuration
      const activeSessions = await prisma.session.findMany({
        where: {
          status: SessionStatus.ACTIVE,
          startTime: {
            lte: new Date(now.getTime() - GameService.activeSessionDuration)
          }
        }
      });

      for (const session of activeSessions) {
        await lock.acquire(session.id, async () => {
          try {
            await GameService.endSession(session.id);
            logger.logInfo(`Session ended`, { userId: session.userId, sessionId: session.id });
          } catch (error) {
            logger.logError('Error ending session', error as Error, { sessionId: session.id });
          }
        });
      }

      // Check for users eligible for a new session
      const users = await prisma.user.findMany();

      for (const user of users) {
        await lock.acquire(user.id, async () => {
          try {
            const lastSession = await prisma.session.findFirst({
              where: { userId: user.id },
              orderBy: { endTime: 'desc' }
            });

            if (lastSession) {
              const lastSessionEndTime = new Date(lastSession.endTime!).getTime();

              // Check if the cooldown period has passed
              if (now.getTime() - lastSessionEndTime >= GameService.cooldownDuration) {
                const newSession = await GameService.createSession(user.id);
                logger.logInfo(`New session created`, { userId: user.id, sessionId: newSession.id });
              }
            } else {
              const newSession = await GameService.createSession(user.id);
              logger.logInfo(`First session created for user`, { userId: user.id, sessionId: newSession.id });
            }
          } catch (error) {
            logger.logError('Error creating new session', error as Error, { userId: user.id });
          }
        });
      }
    } catch (error) {
      logger.logError('Error in session scheduler', error as Error);
    }
  });

  // Run a background job to update points every second
  cron.schedule('* * * * * *', async () => {
    try {
      const activeSessions = await prisma.session.findMany({
        where: { status: SessionStatus.ACTIVE },
        include: { user: true }
      });

      for (const session of activeSessions) {
        await lock.acquire(session.id, async () => {
          try {
            const now = new Date();
            const elapsedTime = (now.getTime() - new Date(session.startTime!).getTime()) / 1000; // in seconds
            const realTimeEarnedPoints = Math.floor(elapsedTime * (session.user.miningRate / 3600)); // points per second

            await prisma.session.update({
              where: { id: session.id },
              data: { earnedPoints: realTimeEarnedPoints }
            });

            // Broadcast the update to the connected client
            GameService.broadcastSessionUpdate(session.userId);

            logger.logDebug(`Updated and broadcasted points for session`, { sessionId: session.id, earnedPoints: realTimeEarnedPoints });
          } catch (error) {
            logger.logError('Error updating and broadcasting session points', error as Error, { sessionId: session.id });
          }
        });
      }
    } catch (error) {
      logger.logError('Error in points update job', error as Error);
    }
  });

  // Schedule a daily job at midnight to apply penalties for missed sessions
  cron.schedule('0 0 * * *', async () => {
    logger.logInfo('Running daily penalty check');

    try {
      const users = await prisma.user.findMany();

      for (const user of users) {
        await lock.acquire(user.id, async () => {
          try {
            const lastSession = await prisma.session.findFirst({
              where: { userId: user.id },
              orderBy: { endTime: 'desc' }
            });

            if (lastSession) {
              const lastSessionEndTime = new Date(lastSession.endTime!).getTime();
              const now = new Date().getTime();

              // Check if the user missed a session (i.e., didn't start a session after the cooldown)
              if (now - lastSessionEndTime > GameService.cooldownDuration) {
                await prisma.user.update({
                  where: { id: user.id },
                  data: {
                    miningRate: Math.floor(user.miningRate * 0.9), // Apply a 10% reduction penalty
                    missedSessions: { increment: 1 }
                  }
                });

                logger.logInfo(`Penalty applied to user`, { userId: user.id, newMiningRate: Math.floor(user.miningRate * 0.9) });
              }
            }
          } catch (error) {
            logger.logError('Error applying penalty', error as Error, { userId: user.id });
          }
        });
      }
    } catch (error) {
      logger.logError('Error in daily penalty job', error as Error);
    }
  });
};

export default startSessionScheduler;