import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Custom application error with status code
 */
export class AppError extends Error {
    public statusCode: number;
    public isOperational: boolean;
    public code?: string;

    constructor(message: string, statusCode: number, code?: string) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.code = code;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Common error types for convenience
 */
export class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404, 'NOT_FOUND');
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401, 'UNAUTHORIZED');
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'Access forbidden') {
        super(message, 403, 'FORBIDDEN');
    }
}

export class BadRequestError extends AppError {
    constructor(message = 'Bad request') {
        super(message, 400, 'BAD_REQUEST');
    }
}

export class ConflictError extends AppError {
    constructor(message = 'Resource already exists') {
        super(message, 409, 'CONFLICT');
    }
}

/**
 * Global error handler middleware.
 * Should be registered last in the middleware chain.
 * 
 * Handles:
 * - AppError (known errors with status codes)
 * - MongoDB validation/duplicate errors
 * - Unknown errors (logged as 500)
 */
export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    // Log error with request context
    const correlationId = req.headers['x-correlation-id'] || 'unknown';

    // Handle AppError (operational errors)
    if (err instanceof AppError) {
        logger.warn({
            message: err.message,
            statusCode: err.statusCode,
            code: err.code,
            correlationId,
            path: req.path,
            method: req.method
        });

        res.status(err.statusCode).json({
            success: false,
            error: err.message,
            code: err.code
        });
        return;
    }

    // Handle MongoDB duplicate key error
    if ((err as any).code === 11000) {
        const field = Object.keys((err as any).keyValue || {})[0];
        res.status(409).json({
            success: false,
            error: `Duplicate value for field: ${field}`,
            code: 'DUPLICATE_KEY'
        });
        return;
    }

    // Handle MongoDB validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values((err as any).errors).map((e: any) => ({
            field: e.path,
            message: e.message
        }));

        res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors
        });
        return;
    }

    // Handle MongoDB CastError (invalid ObjectId)
    if (err.name === 'CastError') {
        res.status(400).json({
            success: false,
            error: 'Invalid ID format',
            code: 'INVALID_ID'
        });
        return;
    }

    // Unknown error - log full stack trace
    logger.error({
        message: 'Unhandled error',
        error: err.message,
        stack: err.stack,
        correlationId,
        path: req.path,
        method: req.method
    });

    // Don't leak error details in production
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message;

    res.status(500).json({
        success: false,
        error: message,
        code: 'INTERNAL_ERROR'
    });
};

/**
 * Handle 404 Not Found for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
    res.status(404).json({
        success: false,
        error: `Route ${req.method} ${req.path} not found`,
        code: 'ROUTE_NOT_FOUND'
    });
};
