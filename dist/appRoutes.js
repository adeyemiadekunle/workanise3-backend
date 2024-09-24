"use strict";
// src/routes/appRoutes.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var gameRoute_1 = __importDefault(require("./routes/gameRoute"));
var router = (0, express_1.Router)();
// Register all route modules
router.use('/game', gameRoute_1.default);
exports.default = router;
//# sourceMappingURL=appRoutes.js.map