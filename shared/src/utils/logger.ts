import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

/**
 * Custom log format for structured logging
 */
const logFormat = printf(({ level, message, timestamp, correlationId, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    const corrId = correlationId ? `[${correlationId}]` : '';
    return `${timestamp} ${level} ${corrId} ${message} ${metaStr}`;
});

/**
 * Create a Winston logger instance
 */
export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        errors({ stack: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
    ),
    defaultMeta: { service: process.env.SERVICE_NAME || 'unknown-service' },
    transports: [
        // Console transport with colors for development
        new winston.transports.Console({
            format: combine(
                colorize(),
                logFormat
            )
        })
    ]
});

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
    logger.add(new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error'
    }));
    logger.add(new winston.transports.File({
        filename: 'logs/combined.log'
    }));
}

/**
 * Create child logger with correlation ID
 */
export const createChildLogger = (correlationId: string) => {
    return logger.child({ correlationId });
};

export default logger;
