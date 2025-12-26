import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';

export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            req[source] = schema.parse(req[source]);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({ success: false, error: 'Validation failed', details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) });
                return;
            }
            res.status(500).json({ success: false, error: 'Validation error' });
        }
    };
};
