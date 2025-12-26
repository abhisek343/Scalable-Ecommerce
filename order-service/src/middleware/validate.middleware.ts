import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';

export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const data = req[source];
            const parsed = schema.parse(data);
            req[source] = parsed;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const formattedErrors = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message
                }));
                res.status(400).json({ success: false, error: 'Validation failed', details: formattedErrors });
                return;
            }
            res.status(500).json({ success: false, error: 'Validation error occurred' });
        }
    };
};
