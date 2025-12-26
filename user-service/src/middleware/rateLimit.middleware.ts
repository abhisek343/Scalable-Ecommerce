import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

/**
 * Skip rate limiting in test environment
 */
const skipInTests = (req: Request, res: Response): boolean => {
    return process.env.NODE_ENV === 'test';
};

/**
 * Create a strict rate limiter for sensitive endpoints
 */
export const createStrictRateLimiter = (
    windowMs = 15 * 60 * 1000,
    max = 5
) => {
    // Skip in test environment
    if (process.env.NODE_ENV === 'test') {
        return (_req: Request, _res: Response, next: NextFunction) => next();
    }

    return rateLimit({
        windowMs,
        max,
        message: {
            success: false,
            error: 'Too many attempts, please try again later',
            code: 'RATE_LIMIT_EXCEEDED'
        },
        standardHeaders: true,
        legacyHeaders: false,
        skip: skipInTests
    });
};

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
