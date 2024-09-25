// src/controllers/gameController.ts

import { Request, Response } from "express";
import GameService from "../services/game-service";
import { AuthenticatedRequest } from "../types";
import createLogger from "../utils/logger";

const logger = createLogger("GameController");

class GameController {
  async startSession(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      const session = await GameService.startSession(authReq.user.id);
      res.status(200).json({ session });
    } catch (error) {
      logger.logError("Error in startSession:", error as Error);
      res.status(400).json({ error: "Failed to start session" });
    }
  }

  async claimEarnings(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      const { sessionId } = req.body;
      const earnedPoints = await GameService.claimEarnings(authReq.user.id, sessionId);
      res.status(200).json({ message: `Earnings claimed: ${earnedPoints}` });
    } catch (error) {
      logger.logError("Error in claimEarnings:", error as Error);
      res.status(400).json({ error: "Failed to claim earnings" });
    }
  }
}

export default new GameController();
