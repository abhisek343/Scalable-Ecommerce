import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

/**
 * General rate limiter for regular endpoints
 */
export const generalRateLimiter = process.env.NODE_ENV === 'test'
    ? (_req: Request, _res: Response, next: NextFunction) => next()
    : rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 20000, // 20000 requests per window
        message: {
            success: false,
            error: 'Too many requests, please try again later',
            code: 'RATE_LIMIT_EXCEEDED'
        },
        standardHeaders: true,
        legacyHeaders: false
    });
