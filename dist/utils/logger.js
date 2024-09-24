"use strict";
// src/utils/logger.ts
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var winston_1 = __importDefault(require("winston"));
var createLogger = function (serviceName) {
    var logger = winston_1.default.createLogger({
        level: 'info',
        format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
        defaultMeta: { service: serviceName },
        transports: [
            new winston_1.default.transports.File({ filename: 'error.log', level: 'error' }),
            new winston_1.default.transports.File({ filename: 'combined.log' }),
        ],
    });
    if (process.env.NODE_ENV !== 'production') {
        logger.add(new winston_1.default.transports.Console({
            format: winston_1.default.format.simple(),
        }));
    }
    return {
        logInfo: function (message, meta) {
            logger.info(message, meta);
        },
        logError: function (message, error, meta) {
            logger.error(message, __assign(__assign({}, meta), { error: error.message, stack: error.stack }));
        },
        logWarning: function (message, meta) {
            logger.warn(message, meta);
        },
        logDebug: function (message, meta) {
            logger.debug(message, meta);
        }
    };
};
exports.default = createLogger;
//# sourceMappingURL=logger.js.map