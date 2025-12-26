import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import { Request, Response, NextFunction } from 'express';

// Create a custom registry
export const metricsRegistry = new Registry();

// Collect default metrics (CPU, memory, etc.)
collectDefaultMetrics({ register: metricsRegistry });

// HTTP request counter
export const httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'path', 'status_code', 'service'],
    registers: [metricsRegistry]
});

// HTTP request duration histogram
export const httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'path', 'status_code', 'service'],
    buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
    registers: [metricsRegistry]
});

// Active connections gauge
export const activeConnections = new Gauge({
    name: 'active_connections',
    help: 'Number of active connections',
    labelNames: ['service'],
    registers: [metricsRegistry]
});

// Database operation counter
export const dbOperationsTotal = new Counter({
    name: 'db_operations_total',
    help: 'Total number of database operations',
    labelNames: ['operation', 'collection', 'status', 'service'],
    registers: [metricsRegistry]
});

// Cache hit/miss counter
export const cacheOperationsTotal = new Counter({
    name: 'cache_operations_total',
    help: 'Total number of cache operations',
    labelNames: ['operation', 'result', 'service'],
    registers: [metricsRegistry]
});

// Queue message counter
export const queueMessagesTotal = new Counter({
    name: 'queue_messages_total',
    help: 'Total number of queue messages',
    labelNames: ['queue', 'operation', 'status', 'service'],
    registers: [metricsRegistry]
});

/**
 * Middleware to collect HTTP metrics
 */
export const metricsMiddleware = (serviceName: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const startTime = Date.now();

        // Increment active connections
        activeConnections.inc({ service: serviceName });

        // Track response
        res.on('finish', () => {
            const duration = (Date.now() - startTime) / 1000;
            const path = normalizePath(req.path);

            // Record metrics
            httpRequestsTotal.inc({
                method: req.method,
                path,
                status_code: res.statusCode,
                service: serviceName
            });

            httpRequestDuration.observe(
                {
                    method: req.method,
                    path,
                    status_code: res.statusCode,
                    service: serviceName
                },
                duration
            );

            // Decrement active connections
            activeConnections.dec({ service: serviceName });
        });

        next();
    };
};

/**
 * Normalize path to prevent high cardinality
 */
const normalizePath = (path: string): string => {
    // Replace IDs with placeholders
    return path
        .replace(/\/[0-9a-fA-F]{24}/g, '/:id') // MongoDB ObjectIds
        .replace(/\/\d+/g, '/:id') // Numeric IDs
        .replace(/\/[0-9a-f-]{36}/g, '/:uuid'); // UUIDs
};

/**
 * Express route handler for /metrics endpoint
 */
export const metricsHandler = async (_req: Request, res: Response) => {
    try {
        res.set('Content-Type', metricsRegistry.contentType);
        res.end(await metricsRegistry.metrics());
    } catch (error) {
        res.status(500).end('Error collecting metrics');
    }
};

/**
 * Record a database operation
 */
export const recordDbOperation = (
    serviceName: string,
    operation: 'find' | 'insert' | 'update' | 'delete',
    collection: string,
    success: boolean
) => {
    dbOperationsTotal.inc({
        operation,
        collection,
        status: success ? 'success' : 'error',
        service: serviceName
    });
};

/**
 * Record a cache operation
 */
export const recordCacheOperation = (
    serviceName: string,
    operation: 'get' | 'set' | 'delete',
    hit: boolean
) => {
    cacheOperationsTotal.inc({
        operation,
        result: hit ? 'hit' : 'miss',
        service: serviceName
    });
};

/**
 * Record a queue message
 */
export const recordQueueMessage = (
    serviceName: string,
    queue: string,
    operation: 'publish' | 'consume',
    success: boolean
) => {
    queueMessagesTotal.inc({
        queue,
        operation,
        status: success ? 'success' : 'error',
        service: serviceName
    });
};
