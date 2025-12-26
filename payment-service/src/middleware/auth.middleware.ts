import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload { userId: string; iat?: number; exp?: number; }
export interface AuthenticatedRequest extends Request { user?: JwtPayload; }

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) { res.status(401).json({ success: false, error: 'Authorization required' }); return; }
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') { res.status(401).json({ success: false, error: 'Invalid auth format' }); return; }
        const secret = process.env.JWT_SECRET;
        if (!secret) { res.status(500).json({ success: false, error: 'Server error' }); return; }
        req.user = jwt.verify(parts[1], secret) as JwtPayload;
        next();
    } catch (error) {
        res.status(401).json({ success: false, error: error instanceof jwt.TokenExpiredError ? 'Token expired' : 'Invalid token' });
    }
};
