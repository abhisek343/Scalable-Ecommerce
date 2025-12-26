// Mock for @ecommerce/shared
export const getChannel = jest.fn();
export const publishToQueue = jest.fn().mockResolvedValue(true);
export const initRabbitMQ = jest.fn().mockResolvedValue(true);
export const consumeFromQueue = jest.fn();

// Auth middleware mock
export const authenticate = (req: any, res: any, next: any) => {
    req.user = { userId: '507f1f77bcf86cd799439011' };
    next();
};

export const optionalAuth = (req: any, res: any, next: any) => next();

// Error classes mock
export class AppError extends Error { }
export class NotFoundError extends Error { }
export class BadRequestError extends Error { }
export class UnauthorizedError extends Error { }
export class ForbiddenError extends Error { }
export class ConflictError extends Error { }

// Other exports
export const errorHandler = (err: any, req: any, res: any, next: any) => {
    res.status(500).json({ error: err.message });
};

export const validate = () => (req: any, res: any, next: any) => next();
export const asyncHandler = (fn: any) => fn;
export const logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };
