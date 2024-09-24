"use strict";
// src/routes/gameRoutes.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var gameController_1 = __importDefault(require("../controllers/gameController"));
var router = (0, express_1.Router)();
// Define routes for game actions
router.post('/session/create', gameController_1.default.createSession);
router.post('/session/start', gameController_1.default.startSession);
router.post('/session/end', gameController_1.default.endSession);
router.post('/earnings/claim', gameController_1.default.claimEarnings);
router.post('/penalty/apply', gameController_1.default.applyPenalty);
router.post('/reward/consistency', gameController_1.default.rewardConsistency);
exports.default = router;
//# sourceMappingURL=gameRoute.js.map