import { Request, Response, NextFunction } from 'express';

export class AppError extends Error { constructor(public message: string, public statusCode: number) { super(message); } }
export class BadRequestError extends AppError { constructor(message = 'Bad request') { super(message, 400); } }

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
    if (err instanceof AppError) { res.status(err.statusCode).json({ success: false, error: err.message }); return; }
    console.error('Error:', err);
    res.status(500).json({ success: false, error: 'Internal error' });
};
