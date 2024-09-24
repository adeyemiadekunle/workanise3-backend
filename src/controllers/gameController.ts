// src/controllers/gameController.ts

import { Request, Response } from 'express';
import gameService from '../services/gameService';

class GameController {
  async createSession(req: Request, res: Response) {
    try {
      const { userId } = req.body;
      const session = await gameService.createSession(userId);
      res.status(201).json({ session });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async startSession(req: Request, res: Response) {
    try {
      const { userId } = req.body;
      const session = await gameService.startSession(userId);
      res.status(200).json({ session });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async endSession(req: Request, res: Response) {
    try {
      const { sessionId } = req.body;
      await gameService.endSession(sessionId);
      res.status(200).json({ message: 'Session ended successfully.' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async claimEarnings(req: Request, res: Response) {
    try {
      const { userId } = req.body;
      const { totalEarnings } = await gameService.claimEarnings(userId);
      res.status(200).json({ message: `Earnings claimed: ${totalEarnings}` });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async applyPenalty(req: Request, res: Response) {
    try {
      const { userId } = req.body;
      await gameService.applyPenalty(userId);
      res.status(200).json({ message: 'Penalty applied.' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async rewardConsistency(req: Request, res: Response) {
    try {
      const { userId } = req.body;
      await gameService.rewardConsistency(userId);
      res.status(200).json({ message: 'Consistency reward applied.' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new GameController();
