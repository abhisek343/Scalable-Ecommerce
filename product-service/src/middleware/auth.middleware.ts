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
            // For product service, we might need a shared secret or public key
            // Assuming same secret for now for simplicity in this mono-repo setup
            console.error('JWT_SECRET is not defined');
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
