import { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

export interface SecurityOptions {
    corsOrigins?: string | string[];
    rateLimitWindowMs?: number;
    rateLimitMax?: number;
    enableHelmet?: boolean;
}

/**
 * Apply all security middleware to an Express app.
 * 
 * Usage:
 *   import { applySecurity } from '@ecommerce/shared';
 *   applySecurity(app, { corsOrigins: 'http://localhost:3000' });
 */
export const applySecurity = (
    app: Application,
    options: SecurityOptions = {}
): void => {
    const {
        corsOrigins = '*',
        rateLimitWindowMs = 15 * 60 * 1000, // 15 minutes
        rateLimitMax = 100, // 100 requests per window
        enableHelmet = true
    } = options;

    // Helmet - Security headers
    if (enableHelmet) {
        app.use(helmet({
            contentSecurityPolicy: process.env.NODE_ENV === 'production',
            crossOriginEmbedderPolicy: false
        }));
    }

    // CORS - Cross-Origin Resource Sharing
    app.use(cors({
        origin: corsOrigins,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
        credentials: true
    }));

    // Rate Limiting
    const limiter = rateLimit({
        windowMs: rateLimitWindowMs,
        max: rateLimitMax,
        message: {
            success: false,
            error: 'Too many requests, please try again later',
            code: 'RATE_LIMIT_EXCEEDED'
        },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => {
            // Use X-Forwarded-For if behind proxy, otherwise use IP
            return (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
                req.ip ||
                'unknown';
        }
    });

    app.use(limiter);
};

/**
 * Create a stricter rate limiter for sensitive endpoints
 * (e.g., login, register, password reset)
 */
export const createStrictRateLimiter = (
    windowMs = 15 * 60 * 1000,
    max = 5
) => {
    return rateLimit({
        windowMs,
        max,
        message: {
            success: false,
            error: 'Too many attempts, please try again later',
            code: 'RATE_LIMIT_EXCEEDED'
        },
        standardHeaders: true,
        legacyHeaders: false
    });
};
