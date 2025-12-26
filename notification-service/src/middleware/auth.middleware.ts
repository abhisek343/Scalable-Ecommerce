import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload { userId: string; }
export interface AuthenticatedRequest extends Request { user?: JwtPayload; }

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) { res.status(401).json({ success: false, error: 'Authorization required' }); return; }
        const secret = process.env.JWT_SECRET;
        if (!secret) { res.status(500).json({ success: false, error: 'Server error' }); return; }
        req.user = jwt.verify(authHeader.split(' ')[1], secret) as JwtPayload;
        next();
    } catch { res.status(401).json({ success: false, error: 'Invalid token' }); }
};
