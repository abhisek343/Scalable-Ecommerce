import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
    userId: string;
    iat?: number;
    exp?: number;
}

export interface AuthenticatedRequest extends Request {
    user?: JwtPayload;
}

/**
 * Middleware to verify JWT tokens from Authorization header.
 * Extracts user information and attaches to request.
 * 
 * Usage:
 *   router.get('/protected', authenticate, handler)
 *   router.post('/admin', authenticate, authorize('admin'), handler)
 */
export const authenticate = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            res.status(401).json({
                success: false,
                error: 'Authorization header is required'
            });
            return;
        }

        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            res.status(401).json({
                success: false,
                error: 'Authorization header must be: Bearer <token>'
            });
            return;
        }

        const token = parts[1];
        const secret = process.env.JWT_SECRET;

        if (!secret) {
            console.error('JWT_SECRET is not defined in environment variables');
            res.status(500).json({
                success: false,
                error: 'Server configuration error'
            });
            return;
        }

        const decoded = jwt.verify(token, secret) as JwtPayload;
        req.user = decoded;
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({
                success: false,
                error: 'Token has expired'
            });
            return;
        }
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: 'Authentication failed'
        });
    }
};

/**
 * Optional authentication - doesn't fail if no token present
 * but will attach user if valid token exists
 */
export const optionalAuth = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        next();
        return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        next();
        return;
    }

    const token = parts[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        next();
        return;
    }

    try {
        const decoded = jwt.verify(token, secret) as JwtPayload;
        req.user = decoded;
    } catch {
        // Token invalid but we don't fail - just continue without user
    }

    next();
};
