// src/services/gameService.ts

import prisma from "../db";
import { SessionStatus } from '@prisma/client'; // Import the enum
import createLogger from '../utils/logger';
import AsyncLock from 'async-lock';
import { WebSocket } from 'ws';

const logger = createLogger('GameService');
const lock = new AsyncLock();

class GameService {
  public activeSessionDuration = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
  public cooldownDuration = 30 * 60 * 1000; // 30 minutes in milliseconds
  private clients: Map<string, WebSocket> = new Map();


  async createSession(userId: string) {
    return lock.acquire(userId, async () => {
      try {
        const activeSession = await prisma.session.findFirst({
          where: { userId, status: SessionStatus.ACTIVE }
        });

        if (activeSession) {
          logger.logWarning(`User ${userId} already has an active session.`);
          throw new Error('User already has an active session.');
        }

        const lastSession = await prisma.session.findFirst({
          where: { userId },
          orderBy: { endTime: 'desc' }
        });

        if (lastSession && new Date().getTime() - new Date(lastSession.endTime!).getTime() < this.cooldownDuration) {
          logger.logWarning(`Cooldown period still active for user ${userId}.`);
          throw new Error('Cooldown period is still active. Please wait before starting a new session.');
        }

        const newSession = await prisma.session.create({
          data: {
            userId,
            status: SessionStatus.READY,
            createdAt: new Date(),
          }
        });

        logger.logInfo(`New session created for user ${userId}`, { sessionId: newSession.id });
        return newSession;
      } catch (error) {
        logger.logError('Error in createSession', error as Error, { userId });
        throw error;
      }
    });
  }

  async startSession(userId: string) {
    return lock.acquire(userId, async () => {
      try {
        const session = await prisma.session.findFirst({
          where: { userId, status: SessionStatus.READY }
        });

        if (!session) {
          logger.logWarning(`No ready session found for user ${userId}`);
          throw new Error('No session available to start.');
        }

        const updatedSession = await prisma.session.update({
          where: { id: session.id },
          data: {
            startTime: new Date(),
            status: SessionStatus.ACTIVE,
            active: true
          }
        });

        logger.logInfo(`Session started for user ${userId}`, { sessionId: updatedSession.id });
        return updatedSession;
      } catch (error) {
        logger.logError('Error in startSession', error as Error, { userId });
        throw error;
      }
    });
  }

  async endSession(sessionId: string) {
    return lock.acquire(sessionId, async () => {
      try {
        const session = await prisma.session.findUnique({
          where: { id: sessionId },
          include: { user: true }
        });

        if (!session || session.status !== SessionStatus.ACTIVE) {
          logger.logWarning(`No active session found for session ${sessionId}`);
          throw new Error('No active session found for this session.');
        }

        const updatedSession = await prisma.session.update({
          where: { id: sessionId },
          data: {
            endTime: new Date(),
            status: SessionStatus.COMPLETED,
            active: false
          }
        });

        logger.logInfo(`Session ended`, { sessionId, userId: session.userId, earnedPoints: updatedSession.earnedPoints });
        return {
          sessionId,
          earnedPoints: updatedSession.earnedPoints,
          status: SessionStatus.COMPLETED
        };
      } catch (error) {
        logger.logError('Error in endSession', error as Error, { sessionId });
        throw error;
      }
    });
  }

  async claimEarnings(userId: string, sessionId: string) {
    return lock.acquire(`${userId}-${sessionId}`, async () => {
      try {
        const session = await prisma.session.findFirst({
          where: { id: sessionId, userId, status: SessionStatus.COMPLETED },
          select: { earnedPoints: true, id: true, claimed: true }
        });

        if (!session) {
          logger.logWarning(`No completed session found for user ${userId} and session ${sessionId}`);
          throw new Error('No completed session found for this user or session.');
        }

        if (session.claimed) {
          logger.logWarning(`Earnings already claimed for session ${sessionId}`);
          throw new Error('Earnings from this session have already been claimed.');
        }

        const earnedPoints = session.earnedPoints;

        await prisma.user.update({
          where: { id: userId },
          data: {
            balance: {
              increment: earnedPoints
            }
          }
        });

        await prisma.session.update({
          where: { id: session.id },
          data: { claimed: true }
        });

        logger.logInfo(`Earnings claimed`, { userId, sessionId, earnedPoints });
        return { earnedPoints };
      } catch (error) {
        logger.logError('Error in claimEarnings', error as Error, { userId, sessionId });
        throw error;
      }
    });
  }

  async applyPenalty(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (user?.missedSessions && user.missedSessions > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          miningRate: Math.floor(user.miningRate * 0.9),
          missedSessions: 0
        }
      });
    }
  }

  async rewardConsistency(userId: string) {
    const sessions = await prisma.session.findMany({
      where: { userId, status: SessionStatus.COMPLETED }, // Use the enum here
      orderBy: { endTime: 'desc' },
      take: 5
    });

    if (sessions.length === 5 && sessions.every(session => !session.active)) {
      await prisma.reward.create({
        data: {
          userId,
          rewardType: 'Consistency Bonus',
          rewardAmount: 5000
        }
      });
    }
  }


  async getSession(userId: string) {
    try {
      const session = await prisma.session.findFirst({
        where: { userId, status: SessionStatus.ACTIVE },
        include: { user: true }
      });

      if (!session) {
        logger.logWarning(`No active session found for user ${userId}`);
        throw new Error('No active session found for this user.');
      }

      const sessionData = this.calculateSessionData(session);
      logger.logInfo(`Session data retrieved for user ${userId}`, { sessionId: session.id });
      return sessionData;
    } catch (error) {
      logger.logError('Error in getSession', error as Error, { userId });
      throw error;
    }
  }

  calculateSessionData(session: any) {
    const now = new Date();
    const elapsedTime = (now.getTime() - new Date(session.startTime!).getTime()) / 1000; // in seconds
    const realTimeEarnedPoints = Math.floor(elapsedTime * (session.user.miningRate / 3600)); // points per second

    return {
      session,
      earningPoints: realTimeEarnedPoints,
    };
  }

  addClient(userId: string, ws: WebSocket) {
    this.clients.set(userId, ws);
    logger.logInfo(`WebSocket client added for user ${userId}`);
  }

  removeClient(userId: string) {
    this.clients.delete(userId);
    logger.logInfo(`WebSocket client removed for user ${userId}`);
  }

  broadcastSessionUpdate(userId: string) {
    const ws = this.clients.get(userId);
    if (ws) {
      this.getSession(userId)
        .then(sessionData => {
          ws.send(JSON.stringify(sessionData));
          logger.logDebug(`Session update broadcasted to user ${userId}`);
        })
        .catch(error => {
          logger.logError('Error broadcasting session update', error as Error, { userId });
        });
    }
  }


}

export default new GameService();
