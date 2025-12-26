import express, { Application } from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import helmet from "helmet";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import orderRoutes from "./routes/order.routes";
import { errorHandler, generalRateLimiter } from "./middleware";

dotenv.config();

const PORT = process.env.PORT || 5003;
const app: Application = express();

// Swagger configuration
const swaggerOptions: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Order Service API',
            version: '1.0.0',
            description: 'Order management microservice API'
        },
        servers: [
            { url: `http://localhost:${PORT}`, description: 'Development server' },
            { url: 'http://localhost/api/orders', description: 'Via API Gateway' }
        ],
        components: {
            securitySchemes: {
                bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
            },
            schemas: {
                Order: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        userId: { type: 'string' },
                        items: { type: 'array', items: { type: 'object' } },
                        totalAmount: { type: 'number' },
                        status: { type: 'string', enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] }
                    }
                }
            }
        }
    },
    apis: ['./src/routes/*.ts']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Trust first proxy (nginx)
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(generalRateLimiter);
app.use(express.json({ limit: '10kb' }));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Order Service API Docs'
}));

app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.use("/api/orders", orderRoutes);

app.get("/health", (_req, res) => {
    res.json({ success: true, service: "order-service", status: "healthy", timestamp: new Date().toISOString() });
});

app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});

app.use(errorHandler);

const mongoURI = process.env.MONGO_URI || "";

if (require.main === module) {
    if (!mongoURI) {
        console.error("MONGO_URI is not defined");
        process.exit(1);
    }

    mongoose.connect(mongoURI).then(async () => {
        console.log("✅ Order Service connected to MongoDB");

        // Initialize RabbitMQ and Consumer
        try {
            const { initRabbitMQ } = await import('@ecommerce/shared');
            const { startOrderConsumer } = await import('./events/order.consumer');
            await initRabbitMQ();
            await startOrderConsumer();
        } catch (err) {
            console.error("❌ Failed to start RabbitMQ consumer", err);
        }

        app.listen(PORT, () => console.log(`🚀 Order Service running on port ${PORT}`));
    }).catch((err) => {
        console.error("Failed to connect to DB", err);
        process.exit(1);
    });
}

process.on('SIGTERM', () => {
    mongoose.connection.close();
    process.exit(0);
});

export default app;
