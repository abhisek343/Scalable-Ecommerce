// Local Prometheus metrics for user-service
import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import { Request, Response, NextFunction } from 'express';

export const metricsRegistry = new Registry();
collectDefaultMetrics({ register: metricsRegistry });

export const httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'path', 'status_code', 'service'],
    registers: [metricsRegistry]
});

export const httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'path', 'status_code', 'service'],
    buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
    registers: [metricsRegistry]
});

export const activeConnections = new Gauge({
    name: 'active_connections',
    help: 'Number of active connections',
    labelNames: ['service'],
    registers: [metricsRegistry]
});

const normalizePath = (path: string): string => {
    return path
        .replace(/\/[0-9a-fA-F]{24}/g, '/:id')
        .replace(/\/\d+/g, '/:id')
        .replace(/\/[0-9a-f-]{36}/g, '/:uuid');
};

export const metricsMiddleware = (serviceName: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const startTime = Date.now();
        activeConnections.inc({ service: serviceName });

        res.on('finish', () => {
            const duration = (Date.now() - startTime) / 1000;
            const path = normalizePath(req.path);

            httpRequestsTotal.inc({
                method: req.method,
                path,
                status_code: res.statusCode,
                service: serviceName
            });

            httpRequestDuration.observe(
                { method: req.method, path, status_code: res.statusCode, service: serviceName },
                duration
            );

            activeConnections.dec({ service: serviceName });
        });

        next();
    };
};

export const metricsHandler = async (_req: Request, res: Response) => {
    try {
        res.set('Content-Type', metricsRegistry.contentType);
        res.end(await metricsRegistry.metrics());
    } catch {
        res.status(500).end('Error collecting metrics');
    }
};
