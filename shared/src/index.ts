// Middleware exports
export { authenticate, optionalAuth, AuthenticatedRequest, JwtPayload } from './middleware/auth.middleware';
export { validate, validateMultiple } from './middleware/validate.middleware';
export {
    errorHandler,
    notFoundHandler,
    AppError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError,
    BadRequestError,
    ConflictError
} from './middleware/error.middleware';
export { applySecurity, createStrictRateLimiter, SecurityOptions } from './middleware/security.middleware';

// Utility exports
export { logger, createChildLogger } from './utils/logger';
export { asyncHandler } from './utils/asyncHandler';
export { correlationMiddleware, requestLogger, RequestWithCorrelation } from './utils/correlation';

// Swagger exports
export { createSwaggerSpec, swaggerUiOptions, SwaggerOptions } from './swagger/swagger.config';

// Cache exports
export * from './cache/redis.client';

// Messaging exports
export * from './messaging/rabbitmq.client';

// Metrics exports
export * from './metrics/prometheus';

// Discovery exports
export * from './discovery/consul.client';

// Events exports
export * from './events/event-publisher';
export * from './events/event-consumer';
