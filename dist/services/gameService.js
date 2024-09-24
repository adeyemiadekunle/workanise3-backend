"use strict";
// src/services/gameService.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var db_1 = __importDefault(require("../db"));
var client_1 = require("@prisma/client"); // Import the enum
var logger_1 = __importDefault(require("../utils/logger"));
var async_lock_1 = __importDefault(require("async-lock"));
var logger = (0, logger_1.default)('GameService');
var lock = new async_lock_1.default();
var GameService = /** @class */ (function () {
    function GameService() {
        this.activeSessionDuration = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
        this.cooldownDuration = 30 * 60 * 1000; // 30 minutes in milliseconds
        this.clients = new Map();
    }
    GameService.prototype.createSession = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, lock.acquire(userId, function () { return __awaiter(_this, void 0, void 0, function () {
                        var activeSession, lastSession, newSession, error_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 4, , 5]);
                                    return [4 /*yield*/, db_1.default.session.findFirst({
                                            where: { userId: userId, status: client_1.SessionStatus.ACTIVE }
                                        })];
                                case 1:
                                    activeSession = _a.sent();
                                    if (activeSession) {
                                        logger.logWarning("User ".concat(userId, " already has an active session."));
                                        throw new Error('User already has an active session.');
                                    }
                                    return [4 /*yield*/, db_1.default.session.findFirst({
                                            where: { userId: userId },
                                            orderBy: { endTime: 'desc' }
                                        })];
                                case 2:
                                    lastSession = _a.sent();
                                    if (lastSession && new Date().getTime() - new Date(lastSession.endTime).getTime() < this.cooldownDuration) {
                                        logger.logWarning("Cooldown period still active for user ".concat(userId, "."));
                                        throw new Error('Cooldown period is still active. Please wait before starting a new session.');
                                    }
                                    return [4 /*yield*/, db_1.default.session.create({
                                            data: {
                                                userId: userId,
                                                status: client_1.SessionStatus.READY,
                                                createdAt: new Date(),
                                            }
                                        })];
                                case 3:
                                    newSession = _a.sent();
                                    logger.logInfo("New session created for user ".concat(userId), { sessionId: newSession.id });
                                    return [2 /*return*/, newSession];
                                case 4:
                                    error_1 = _a.sent();
                                    logger.logError('Error in createSession', error_1, { userId: userId });
                                    throw error_1;
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    GameService.prototype.startSession = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, lock.acquire(userId, function () { return __awaiter(_this, void 0, void 0, function () {
                        var session, updatedSession, error_2;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    return [4 /*yield*/, db_1.default.session.findFirst({
                                            where: { userId: userId, status: client_1.SessionStatus.READY }
                                        })];
                                case 1:
                                    session = _a.sent();
                                    if (!session) {
                                        logger.logWarning("No ready session found for user ".concat(userId));
                                        throw new Error('No session available to start.');
                                    }
                                    return [4 /*yield*/, db_1.default.session.update({
                                            where: { id: session.id },
                                            data: {
                                                startTime: new Date(),
                                                status: client_1.SessionStatus.ACTIVE,
                                                active: true
                                            }
                                        })];
                                case 2:
                                    updatedSession = _a.sent();
                                    logger.logInfo("Session started for user ".concat(userId), { sessionId: updatedSession.id });
                                    return [2 /*return*/, updatedSession];
                                case 3:
                                    error_2 = _a.sent();
                                    logger.logError('Error in startSession', error_2, { userId: userId });
                                    throw error_2;
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    GameService.prototype.endSession = function (sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, lock.acquire(sessionId, function () { return __awaiter(_this, void 0, void 0, function () {
                        var session, updatedSession, error_3;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    return [4 /*yield*/, db_1.default.session.findUnique({
                                            where: { id: sessionId },
                                            include: { user: true }
                                        })];
                                case 1:
                                    session = _a.sent();
                                    if (!session || session.status !== client_1.SessionStatus.ACTIVE) {
                                        logger.logWarning("No active session found for session ".concat(sessionId));
                                        throw new Error('No active session found for this session.');
                                    }
                                    return [4 /*yield*/, db_1.default.session.update({
                                            where: { id: sessionId },
                                            data: {
                                                endTime: new Date(),
                                                status: client_1.SessionStatus.COMPLETED,
                                                active: false
                                            }
                                        })];
                                case 2:
                                    updatedSession = _a.sent();
                                    logger.logInfo("Session ended", { sessionId: sessionId, userId: session.userId, earnedPoints: updatedSession.earnedPoints });
                                    return [2 /*return*/, {
                                            sessionId: sessionId,
                                            earnedPoints: updatedSession.earnedPoints,
                                            status: client_1.SessionStatus.COMPLETED
                                        }];
                                case 3:
                                    error_3 = _a.sent();
                                    logger.logError('Error in endSession', error_3, { sessionId: sessionId });
                                    throw error_3;
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    GameService.prototype.claimEarnings = function (userId, sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, lock.acquire("".concat(userId, "-").concat(sessionId), function () { return __awaiter(_this, void 0, void 0, function () {
                        var session, earnedPoints, error_4;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 4, , 5]);
                                    return [4 /*yield*/, db_1.default.session.findFirst({
                                            where: { id: sessionId, userId: userId, status: client_1.SessionStatus.COMPLETED },
                                            select: { earnedPoints: true, id: true, claimed: true }
                                        })];
                                case 1:
                                    session = _a.sent();
                                    if (!session) {
                                        logger.logWarning("No completed session found for user ".concat(userId, " and session ").concat(sessionId));
                                        throw new Error('No completed session found for this user or session.');
                                    }
                                    if (session.claimed) {
                                        logger.logWarning("Earnings already claimed for session ".concat(sessionId));
                                        throw new Error('Earnings from this session have already been claimed.');
                                    }
                                    earnedPoints = session.earnedPoints;
                                    return [4 /*yield*/, db_1.default.user.update({
                                            where: { id: userId },
                                            data: {
                                                balance: {
                                                    increment: earnedPoints
                                                }
                                            }
                                        })];
                                case 2:
                                    _a.sent();
                                    return [4 /*yield*/, db_1.default.session.update({
                                            where: { id: session.id },
                                            data: { claimed: true }
                                        })];
                                case 3:
                                    _a.sent();
                                    logger.logInfo("Earnings claimed", { userId: userId, sessionId: sessionId, earnedPoints: earnedPoints });
                                    return [2 /*return*/, { earnedPoints: earnedPoints }];
                                case 4:
                                    error_4 = _a.sent();
                                    logger.logError('Error in claimEarnings', error_4, { userId: userId, sessionId: sessionId });
                                    throw error_4;
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    GameService.prototype.applyPenalty = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.default.user.findUnique({ where: { id: userId } })];
                    case 1:
                        user = _a.sent();
                        if (!((user === null || user === void 0 ? void 0 : user.missedSessions) && user.missedSessions > 0)) return [3 /*break*/, 3];
                        return [4 /*yield*/, db_1.default.user.update({
                                where: { id: userId },
                                data: {
                                    miningRate: Math.floor(user.miningRate * 0.9),
                                    missedSessions: 0
                                }
                            })];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    GameService.prototype.rewardConsistency = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var sessions;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.default.session.findMany({
                            where: { userId: userId, status: client_1.SessionStatus.COMPLETED }, // Use the enum here
                            orderBy: { endTime: 'desc' },
                            take: 5
                        })];
                    case 1:
                        sessions = _a.sent();
                        if (!(sessions.length === 5 && sessions.every(function (session) { return !session.active; }))) return [3 /*break*/, 3];
                        return [4 /*yield*/, db_1.default.reward.create({
                                data: {
                                    userId: userId,
                                    rewardType: 'Consistency Bonus',
                                    rewardAmount: 5000
                                }
                            })];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    GameService.prototype.getSession = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var session, sessionData, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, db_1.default.session.findFirst({
                                where: { userId: userId, status: client_1.SessionStatus.ACTIVE },
                                include: { user: true }
                            })];
                    case 1:
                        session = _a.sent();
                        if (!session) {
                            logger.logWarning("No active session found for user ".concat(userId));
                            throw new Error('No active session found for this user.');
                        }
                        sessionData = this.calculateSessionData(session);
                        logger.logInfo("Session data retrieved for user ".concat(userId), { sessionId: session.id });
                        return [2 /*return*/, sessionData];
                    case 2:
                        error_5 = _a.sent();
                        logger.logError('Error in getSession', error_5, { userId: userId });
                        throw error_5;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    GameService.prototype.calculateSessionData = function (session) {
        var now = new Date();
        var elapsedTime = (now.getTime() - new Date(session.startTime).getTime()) / 1000; // in seconds
        var realTimeEarnedPoints = Math.floor(elapsedTime * (session.user.miningRate / 3600)); // points per second
        return {
            session: session,
            earningPoints: realTimeEarnedPoints,
        };
    };
    GameService.prototype.addClient = function (userId, ws) {
        this.clients.set(userId, ws);
        logger.logInfo("WebSocket client added for user ".concat(userId));
    };
    GameService.prototype.removeClient = function (userId) {
        this.clients.delete(userId);
        logger.logInfo("WebSocket client removed for user ".concat(userId));
    };
    GameService.prototype.broadcastSessionUpdate = function (userId) {
        var ws = this.clients.get(userId);
        if (ws) {
            this.getSession(userId)
                .then(function (sessionData) {
                ws.send(JSON.stringify(sessionData));
                logger.logDebug("Session update broadcasted to user ".concat(userId));
            })
                .catch(function (error) {
                logger.logError('Error broadcasting session update', error, { userId: userId });
            });
        }
    };
    return GameService;
}());
exports.default = new GameService();
//# sourceMappingURL=gameService.js.map