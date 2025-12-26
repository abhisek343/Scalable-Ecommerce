import { Request, Response, NextFunction } from 'express';

/**
 * Wrapper for async route handlers to avoid try/catch boilerplate.
 */
export const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

export default asyncHandler;
