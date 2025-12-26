import { Request, Response, NextFunction } from 'express';

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

export class NotFoundError extends AppError {
    constructor(message = 'Resource not found') { super(message, 404, 'NOT_FOUND'); }
}

export class BadRequestError extends AppError {
    constructor(message = 'Bad request') { super(message, 400, 'BAD_REQUEST'); }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') { super(message, 401, 'UNAUTHORIZED'); }
}

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({ success: false, error: err.message, code: err.code });
        return;
    }

    if ((err as any).code === 11000) {
        res.status(409).json({ success: false, error: 'Duplicate resource', code: 'DUPLICATE_KEY' });
        return;
    }

    if (err.name === 'CastError') {
        res.status(400).json({ success: false, error: 'Invalid ID format', code: 'INVALID_ID' });
        return;
    }

    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' });
};
