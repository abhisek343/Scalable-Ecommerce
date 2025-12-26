import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

export const generalRateLimiter = process.env.NODE_ENV === 'test'
    ? (_req: Request, _res: Response, next: NextFunction) => next()
    : rateLimit({ windowMs: 15 * 60 * 1000, max: 50, message: { success: false, error: 'Too many requests' } });
