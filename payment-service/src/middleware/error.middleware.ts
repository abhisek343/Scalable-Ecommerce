import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
    constructor(public message: string, public statusCode: number, public code?: string) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
    }
}

export class NotFoundError extends AppError { constructor(message = 'Not found') { super(message, 404, 'NOT_FOUND'); } }
export class BadRequestError extends AppError { constructor(message = 'Bad request') { super(message, 400, 'BAD_REQUEST'); } }

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
    if (err instanceof AppError) { res.status(err.statusCode).json({ success: false, error: err.message, code: err.code }); return; }
    if ((err as any).code === 11000) { res.status(409).json({ success: false, error: 'Duplicate', code: 'DUPLICATE' }); return; }
    console.error('Error:', err);
    res.status(500).json({ success: false, error: 'Internal error' });
};
