// src/utils/logger.ts

import winston from 'winston';

const createLogger = (serviceName: string) => {
  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    defaultMeta: { service: serviceName },
    transports: [
      new winston.transports.File({ filename: 'error.log', level: 'error' }),
      new winston.transports.File({ filename: 'combined.log' }),
    ],
  });

  if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
      format: winston.format.simple(),
    }));
  }

  return {
    logInfo: (message: string, meta?: object) => {
      logger.info(message, meta);
    },

    logError: (message: string, error: Error, meta?: object) => {
      logger.error(message, { ...meta, error: error.message, stack: error.stack });
    },

    logWarning: (message: string, meta?: object) => {
      logger.warn(message, meta);
    },

    logDebug: (message: string, meta?: object) => {
      logger.debug(message, meta);
    }
  };
};

export default createLogger;