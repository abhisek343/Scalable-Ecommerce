import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger';

export interface RequestWithCorrelation extends Request {
    correlationId: string;
}

/**
 * Middleware to add correlation ID to requests for distributed tracing.
 * Uses existing X-Correlation-ID header or generates new one.
 */
export const correlationMiddleware = (
    req: RequestWithCorrelation,
    res: Response,
    next: NextFunction
): void => {
    const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();
    req.correlationId = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);
    next();
};

/**
 * Request logging middleware
 */
export const requestLogger = (
    req: RequestWithCorrelation,
    res: Response,
    next: NextFunction
): void => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info({
            message: `${req.method} ${req.path}`,
            correlationId: req.correlationId,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            userAgent: req.headers['user-agent'],
            ip: req.ip
        });
    });

    next();
};
