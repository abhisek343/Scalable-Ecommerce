import express, { Application } from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import helmet from "helmet";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import productRoutes from "./routes/product.routes";
import { errorHandler, generalRateLimiter } from "./middleware";

// Load environment variables first
dotenv.config();

const PORT: string | number = process.env.PORT || 5001; // Default to 5001 for product service
const app: Application = express();

// Swagger configuration
const swaggerOptions: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Product Service API',
            version: '1.0.0',
            description: 'Product catalog microservice API',
            contact: { name: 'API Support', email: 'support@ecommerce.com' },
            license: { name: 'ISC', url: 'https://opensource.org/licenses/ISC' }
        },
        servers: [
            { url: `http://localhost:${PORT}`, description: 'Development server' },
            { url: 'http://localhost/api/products', description: 'Via API Gateway' }
        ],
        components: {
            securitySchemes: {
                bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
            },
            schemas: {
                Product: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        price: { type: 'number' },
                        category: { type: 'string' },
                        stock: { type: 'integer' },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        error: { type: 'string' }
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

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Product Service API Docs'
}));

app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// Request logging
app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Routes
app.use("/api/products", productRoutes);

// Health check
app.get("/health", (_req, res) => {
    res.json({
        success: true,
        service: "product-service",
        status: "healthy",
        timestamp: new Date().toISOString()
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
    console.error("🚫 MONGO_URI is not defined in environment variables for Product Service.");
    // Don't exit here in test mode to allow simple usage
    if (process.env.NODE_ENV !== 'test') {
        process.exit(1);
    }
}

// Only connect and listen if file is run directly (not imported for tests)
if (require.main === module) {
    mongoose
        .connect(mongoURI)
        .then(() => {
            console.log("✅ Product Service is Connected to MongoDB");
            app.listen(PORT, () => {
                console.log(`🚀 Product Service running on port ${PORT}`);
                console.log(`📋 Health check: http://localhost:${PORT}/health`);
            });
        })
        .catch((err: any) => {
            console.error("🚫 Failed to connect to Database -> Product Service", err);
            process.exit(1);
        });
}

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    mongoose.connection.close();
    process.exit(0);
});

export default app;
