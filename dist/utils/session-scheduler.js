"use strict";
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
var node_cron_1 = __importDefault(require("node-cron"));
var gameService_1 = __importDefault(require("../services/gameService"));
var db_1 = __importDefault(require("../db"));
var client_1 = require("@prisma/client");
var logger_1 = __importDefault(require("../utils/logger"));
var async_lock_1 = __importDefault(require("async-lock"));
var logger = (0, logger_1.default)('SessionScheduler');
var lock = new async_lock_1.default();
var startSessionScheduler = function () {
    // Schedule a job to run every minute to check for active sessions and cooldown eligibility
    node_cron_1.default.schedule('* * * * *', function () { return __awaiter(void 0, void 0, void 0, function () {
        var now_1, activeSessions, _loop_1, _i, activeSessions_1, session, users, _loop_2, _a, users_1, user, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    logger.logInfo('Checking for active sessions and users eligible for a new session...');
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 12, , 13]);
                    now_1 = new Date();
                    return [4 /*yield*/, db_1.default.session.findMany({
                            where: {
                                status: client_1.SessionStatus.ACTIVE,
                                startTime: {
                                    lte: new Date(now_1.getTime() - gameService_1.default.activeSessionDuration)
                                }
                            }
                        })];
                case 2:
                    activeSessions = _b.sent();
                    _loop_1 = function (session) {
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0: return [4 /*yield*/, lock.acquire(session.id, function () { return __awaiter(void 0, void 0, void 0, function () {
                                        var error_2;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    _a.trys.push([0, 2, , 3]);
                                                    return [4 /*yield*/, gameService_1.default.endSession(session.id)];
                                                case 1:
                                                    _a.sent();
                                                    logger.logInfo("Session ended", { userId: session.userId, sessionId: session.id });
                                                    return [3 /*break*/, 3];
                                                case 2:
                                                    error_2 = _a.sent();
                                                    logger.logError('Error ending session', error_2, { sessionId: session.id });
                                                    return [3 /*break*/, 3];
                                                case 3: return [2 /*return*/];
                                            }
                                        });
                                    }); })];
                                case 1:
                                    _c.sent();
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, activeSessions_1 = activeSessions;
                    _b.label = 3;
                case 3:
                    if (!(_i < activeSessions_1.length)) return [3 /*break*/, 6];
                    session = activeSessions_1[_i];
                    return [5 /*yield**/, _loop_1(session)];
                case 4:
                    _b.sent();
                    _b.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: return [4 /*yield*/, db_1.default.user.findMany()];
                case 7:
                    users = _b.sent();
                    _loop_2 = function (user) {
                        return __generator(this, function (_d) {
                            switch (_d.label) {
                                case 0: return [4 /*yield*/, lock.acquire(user.id, function () { return __awaiter(void 0, void 0, void 0, function () {
                                        var lastSession, lastSessionEndTime, newSession, newSession, error_3;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    _a.trys.push([0, 7, , 8]);
                                                    return [4 /*yield*/, db_1.default.session.findFirst({
                                                            where: { userId: user.id },
                                                            orderBy: { endTime: 'desc' }
                                                        })];
                                                case 1:
                                                    lastSession = _a.sent();
                                                    if (!lastSession) return [3 /*break*/, 4];
                                                    lastSessionEndTime = new Date(lastSession.endTime).getTime();
                                                    if (!(now_1.getTime() - lastSessionEndTime >= gameService_1.default.cooldownDuration)) return [3 /*break*/, 3];
                                                    return [4 /*yield*/, gameService_1.default.createSession(user.id)];
                                                case 2:
                                                    newSession = _a.sent();
                                                    logger.logInfo("New session created", { userId: user.id, sessionId: newSession.id });
                                                    _a.label = 3;
                                                case 3: return [3 /*break*/, 6];
                                                case 4: return [4 /*yield*/, gameService_1.default.createSession(user.id)];
                                                case 5:
                                                    newSession = _a.sent();
                                                    logger.logInfo("First session created for user", { userId: user.id, sessionId: newSession.id });
                                                    _a.label = 6;
                                                case 6: return [3 /*break*/, 8];
                                                case 7:
                                                    error_3 = _a.sent();
                                                    logger.logError('Error creating new session', error_3, { userId: user.id });
                                                    return [3 /*break*/, 8];
                                                case 8: return [2 /*return*/];
                                            }
                                        });
                                    }); })];
                                case 1:
                                    _d.sent();
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _a = 0, users_1 = users;
                    _b.label = 8;
                case 8:
                    if (!(_a < users_1.length)) return [3 /*break*/, 11];
                    user = users_1[_a];
                    return [5 /*yield**/, _loop_2(user)];
                case 9:
                    _b.sent();
                    _b.label = 10;
                case 10:
                    _a++;
                    return [3 /*break*/, 8];
                case 11: return [3 /*break*/, 13];
                case 12:
                    error_1 = _b.sent();
                    logger.logError('Error in session scheduler', error_1);
                    return [3 /*break*/, 13];
                case 13: return [2 /*return*/];
            }
        });
    }); });
    // Run a background job to update points every second
    node_cron_1.default.schedule('* * * * * *', function () { return __awaiter(void 0, void 0, void 0, function () {
        var activeSessions, _loop_3, _i, activeSessions_2, session, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    return [4 /*yield*/, db_1.default.session.findMany({
                            where: { status: client_1.SessionStatus.ACTIVE },
                            include: { user: true }
                        })];
                case 1:
                    activeSessions = _a.sent();
                    _loop_3 = function (session) {
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, lock.acquire(session.id, function () { return __awaiter(void 0, void 0, void 0, function () {
                                        var now, elapsedTime, realTimeEarnedPoints, error_5;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    _a.trys.push([0, 2, , 3]);
                                                    now = new Date();
                                                    elapsedTime = (now.getTime() - new Date(session.startTime).getTime()) / 1000;
                                                    realTimeEarnedPoints = Math.floor(elapsedTime * (session.user.miningRate / 3600));
                                                    return [4 /*yield*/, db_1.default.session.update({
                                                            where: { id: session.id },
                                                            data: { earnedPoints: realTimeEarnedPoints }
                                                        })];
                                                case 1:
                                                    _a.sent();
                                                    // Broadcast the update to the connected client
                                                    gameService_1.default.broadcastSessionUpdate(session.userId);
                                                    logger.logDebug("Updated and broadcasted points for session", { sessionId: session.id, earnedPoints: realTimeEarnedPoints });
                                                    return [3 /*break*/, 3];
                                                case 2:
                                                    error_5 = _a.sent();
                                                    logger.logError('Error updating and broadcasting session points', error_5, { sessionId: session.id });
                                                    return [3 /*break*/, 3];
                                                case 3: return [2 /*return*/];
                                            }
                                        });
                                    }); })];
                                case 1:
                                    _b.sent();
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, activeSessions_2 = activeSessions;
                    _a.label = 2;
                case 2:
                    if (!(_i < activeSessions_2.length)) return [3 /*break*/, 5];
                    session = activeSessions_2[_i];
                    return [5 /*yield**/, _loop_3(session)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [3 /*break*/, 7];
                case 6:
                    error_4 = _a.sent();
                    logger.logError('Error in points update job', error_4);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); });
    // Schedule a daily job at midnight to apply penalties for missed sessions
    node_cron_1.default.schedule('0 0 * * *', function () { return __awaiter(void 0, void 0, void 0, function () {
        var users, _loop_4, _i, users_2, user, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    logger.logInfo('Running daily penalty check');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 7, , 8]);
                    return [4 /*yield*/, db_1.default.user.findMany()];
                case 2:
                    users = _a.sent();
                    _loop_4 = function (user) {
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, lock.acquire(user.id, function () { return __awaiter(void 0, void 0, void 0, function () {
                                        var lastSession, lastSessionEndTime, now, error_7;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    _a.trys.push([0, 4, , 5]);
                                                    return [4 /*yield*/, db_1.default.session.findFirst({
                                                            where: { userId: user.id },
                                                            orderBy: { endTime: 'desc' }
                                                        })];
                                                case 1:
                                                    lastSession = _a.sent();
                                                    if (!lastSession) return [3 /*break*/, 3];
                                                    lastSessionEndTime = new Date(lastSession.endTime).getTime();
                                                    now = new Date().getTime();
                                                    if (!(now - lastSessionEndTime > gameService_1.default.cooldownDuration)) return [3 /*break*/, 3];
                                                    return [4 /*yield*/, db_1.default.user.update({
                                                            where: { id: user.id },
                                                            data: {
                                                                miningRate: Math.floor(user.miningRate * 0.9), // Apply a 10% reduction penalty
                                                                missedSessions: { increment: 1 }
                                                            }
                                                        })];
                                                case 2:
                                                    _a.sent();
                                                    logger.logInfo("Penalty applied to user", { userId: user.id, newMiningRate: Math.floor(user.miningRate * 0.9) });
                                                    _a.label = 3;
                                                case 3: return [3 /*break*/, 5];
                                                case 4:
                                                    error_7 = _a.sent();
                                                    logger.logError('Error applying penalty', error_7, { userId: user.id });
                                                    return [3 /*break*/, 5];
                                                case 5: return [2 /*return*/];
                                            }
                                        });
                                    }); })];
                                case 1:
                                    _b.sent();
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, users_2 = users;
                    _a.label = 3;
                case 3:
                    if (!(_i < users_2.length)) return [3 /*break*/, 6];
                    user = users_2[_i];
                    return [5 /*yield**/, _loop_4(user)];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: return [3 /*break*/, 8];
                case 7:
                    error_6 = _a.sent();
                    logger.logError('Error in daily penalty job', error_6);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    }); });
};
exports.default = startSessionScheduler;
//# sourceMappingURL=session-scheduler.js.map