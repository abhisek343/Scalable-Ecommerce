import express, { Application } from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import helmet from "helmet";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import cartRoutes from "./routes/cart.routes";
import { errorHandler, generalRateLimiter } from "./middleware";

dotenv.config();

const PORT = process.env.PORT || 5002;
const app: Application = express();

// Swagger configuration
const swaggerOptions: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Shopping Cart Service API',
            version: '1.0.0',
            description: 'Shopping cart management microservice API'
        },
        servers: [
            { url: `http://localhost:${PORT}`, description: 'Development server' },
            { url: 'http://localhost/api/cart', description: 'Via API Gateway' }
        ],
        components: {
            securitySchemes: {
                bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
            },
            schemas: {
                Cart: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        userId: { type: 'string' },
                        items: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    productId: { type: 'string' },
                                    quantity: { type: 'integer' }
                                }
                            }
                        }
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
    customSiteTitle: 'Cart Service API Docs'
}));

app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.use("/api/cart", cartRoutes);

app.get("/health", (_req, res) => {
    res.json({ success: true, service: "cart-service", status: "healthy", timestamp: new Date().toISOString() });
});

app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found' }));
app.use(errorHandler);

const mongoURI = process.env.MONGO_URI || "";

if (require.main === module) {
    if (!mongoURI) { console.error("MONGO_URI not defined"); process.exit(1); }
    mongoose.connect(mongoURI).then(() => {
        console.log("✅ Cart Service connected to MongoDB");
        app.listen(PORT, () => console.log(`🚀 Cart Service running on port ${PORT}`));
    }).catch(err => { console.error("DB connection failed", err); process.exit(1); });
}

process.on('SIGTERM', () => { mongoose.connection.close(); process.exit(0); });

export default app;
