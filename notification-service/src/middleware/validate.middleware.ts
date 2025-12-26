import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction): void => {
    try { req.body = schema.parse(req.body); next(); }
    catch (error) {
        if (error instanceof ZodError) { res.status(400).json({ success: false, error: 'Validation failed', details: error.errors }); return; }
        res.status(500).json({ success: false, error: 'Validation error' });
    }
};
