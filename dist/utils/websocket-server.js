"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupWebSocketServer = setupWebSocketServer;
var ws_1 = require("ws");
var gameService_1 = __importDefault(require("../services/gameService"));
var logger_1 = __importDefault(require("../utils/logger"));
var logger = (0, logger_1.default)('WebSocketServer');
function setupWebSocketServer(server) {
    var wss = new ws_1.WebSocketServer({ server: server });
    wss.on('connection', function (ws, req) {
        var _a;
        var userId = (_a = req.url) === null || _a === void 0 ? void 0 : _a.split('/').pop();
        if (!userId) {
            logger.logWarning('WebSocket connection attempt without userId');
            ws.close();
            return;
        }
        gameService_1.default.addClient(userId, ws);
        ws.on('message', function (message) {
            logger.logDebug("Received message from user ".concat(userId), { message: message.toString() });
            // Handle incoming messages if needed
        });
        ws.on('close', function () {
            gameService_1.default.removeClient(userId);
        });
        // Send initial session data
        gameService_1.default.getSession(userId)
            .then(function (sessionData) {
            ws.send(JSON.stringify(sessionData));
            logger.logInfo("Initial session data sent to user ".concat(userId));
        })
            .catch(function (error) {
            logger.logError('Error sending initial session data', error, { userId: userId });
        });
    });
    logger.logInfo('WebSocket server set up successfully');
}
//# sourceMappingURL=websocket-server.js.map