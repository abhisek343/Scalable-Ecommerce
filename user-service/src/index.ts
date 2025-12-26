import express, { Application } from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import helmet from "helmet";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import userRoutes from "./routes/user.routes";
import { errorHandler, generalRateLimiter } from "./middleware";

// Load environment variables first
dotenv.config();

const PORT: string | number = process.env.PORT || 5000;
const SERVICE_NAME = "user-service";
const app: Application = express();

// Optional: Initialize Redis (graceful degradation if unavailable)
let redisAvailable = false;
const initializeRedis = async () => {
    try {
        const { initRedis } = await import("./cache/redis.client");
        await initRedis();
        redisAvailable = true;
        console.log("✅ Redis connected");
    } catch (error) {
        console.warn("⚠️ Redis not available, caching disabled");
    }
};

// Swagger configuration
const swaggerOptions: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'User Service API',
            version: '1.0.0',
            description: 'User authentication and management microservice API',
            contact: { name: 'API Support', email: 'support@ecommerce.com' },
            license: { name: 'ISC', url: 'https://opensource.org/licenses/ISC' }
        },
        servers: [
            { url: `http://localhost:${PORT}`, description: 'Development server' },
            { url: 'http://localhost/api/users', description: 'Via API Gateway' }
        ],
        components: {
            securitySchemes: {
                bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        error: { type: 'string' }
                    }
                },
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        role: { type: 'string', enum: ['user', 'admin'] },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                }
            }
        }
    },
    apis: ['./src/routes/*.ts', './src/swagger/*.yaml']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Trust first proxy (nginx)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));

// Rate limiting
app.use(generalRateLimiter);

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Prometheus metrics middleware (optional)
try {
    const { metricsMiddleware, metricsHandler } = require("./metrics/prometheus");
    app.use(metricsMiddleware(SERVICE_NAME));
    app.get('/metrics', metricsHandler);
} catch {
    console.warn("⚠️ Metrics not available");
}

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'User Service API Docs'
}));

// Swagger JSON endpoint
app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// Structured logging
app.use((req, _res, next) => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        service: SERVICE_NAME,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('user-agent')
    };
    console.log(JSON.stringify(logEntry));
    next();
});

// Routes
app.use("/api/users", userRoutes);

// Health check
app.get("/health", (_req, res) => {
    res.json({
        success: true,
        service: SERVICE_NAME,
        status: "healthy",
        timestamp: new Date().toISOString(),
        redis: redisAvailable
    });
});

// 404 handler
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// Global error handler (must be last)
app.use(errorHandler);

// Database connection
const mongoURI: string = process.env.MONGO_URI || "";

if (!mongoURI) {
    console.error("🚫 MONGO_URI is not defined in environment variables for User Service.");
    process.exit(1);
}

mongoose
    .connect(mongoURI)
    .then(async () => {
        console.log("✅ User Service is Connected to MongoDB");

        // Initialize Redis (non-blocking)
        await initializeRedis();

        app.listen(PORT, () => {
            console.log(`🚀 User Service running on port ${PORT}`);
            console.log(`📋 Health check: http://localhost:${PORT}/health`);
            console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
        });
    })
    .catch((err: Error) => {
        console.error("🚫 Failed to connect to Database -> User Service", err);
        process.exit(1);
    });

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    try {
        const { closeRedis } = await import("./cache/redis.client");
        await closeRedis();
    } catch { }
    mongoose.connection.close();
    process.exit(0);
});

export default app;
