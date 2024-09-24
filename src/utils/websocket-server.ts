import { Server } from 'http';
import { WebSocketServer } from 'ws';
import GameService from '../services/gameService';
import createLogger from '../utils/logger';

const logger = createLogger('WebSocketServer');

export function setupWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    const userId = req.url?.split('/').pop();

    if (!userId) {
      logger.logWarning('WebSocket connection attempt without userId');
      ws.close();
      return;
    }

    GameService.addClient(userId, ws);

    ws.on('message', (message) => {
      logger.logDebug(`Received message from user ${userId}`, { message: message.toString() });
      // Handle incoming messages if needed
    });

    ws.on('close', () => {
      GameService.removeClient(userId);
    });

    // Send initial session data
    GameService.getSession(userId)
      .then(sessionData => {
        ws.send(JSON.stringify(sessionData));
        logger.logInfo(`Initial session data sent to user ${userId}`);
      })
      .catch(error => {
        logger.logError('Error sending initial session data', error as Error, { userId });
      });
  });

  logger.logInfo('WebSocket server set up successfully');
}