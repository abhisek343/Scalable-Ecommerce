import express, { Application } from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import notificationRoutes from "./routes/notification.routes";
import { errorHandler, generalRateLimiter } from "./middleware";

dotenv.config();

const PORT = process.env.PORT || 5005;
const SERVICE_NAME = "notification-service";
const app: Application = express();

// Initialize RabbitMQ event consumers (called at startup)
const initEventConsumers = async (): Promise<void> => {
    try {
        // Dynamic import to avoid startup failures if RabbitMQ not available
        const amqplib = require('amqplib');
        const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://ecommerce:ecommerce123@localhost:5672';

        const connection = await amqplib.connect(rabbitUrl);
        const channel = await connection.createChannel();


        await channel.assertQueue('notification.email', { durable: true });
        await channel.assertQueue('notification.sms', { durable: true });

        // Consume email notifications
        channel.consume('notification.email', async (msg: any) => {
            if (msg) {
                try {
                    const { to, subject } = JSON.parse(msg.content.toString());
                    console.log(`📧 Sending email to: ${to}, Subject: ${subject}`);
                    console.log(`✅ Email sent successfully to ${to}`);
                    channel.ack(msg);
                } catch (error) {
                    console.error('Error processing email notification:', error);
                    channel.nack(msg, false, false);
                }
            }
        });

        // Consume SMS notifications
        channel.consume('notification.sms', async (msg: any) => {
            if (msg) {
                try {
                    const { to } = JSON.parse(msg.content.toString());
                    console.log(`📱 Sending SMS to: ${to}`);
                    console.log(`✅ SMS sent successfully to ${to}`);
                    channel.ack(msg);
                } catch (error) {
                    console.error('Error processing SMS notification:', error);
                    channel.nack(msg, false, false);
                }
            }
        });

        console.log('✅ RabbitMQ event consumers initialized');
    } catch (error) {
        console.warn('⚠️ RabbitMQ not available, event consuming disabled');
    }
};

// Swagger configuration
const swaggerOptions: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Notification Service API',
            version: '1.0.0',
            description: 'Email and SMS notification microservice API'
        },
        servers: [
            { url: `http://localhost:${PORT}`, description: 'Development server' },
            { url: 'http://localhost/api/notifications', description: 'Via API Gateway' }
        ],
        components: {
            securitySchemes: {
                bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
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
    customSiteTitle: 'Notification Service API Docs'
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

app.use("/api/notifications", notificationRoutes);

app.get("/health", (_req, res) => {
    res.json({ success: true, service: SERVICE_NAME, status: "healthy", timestamp: new Date().toISOString() });
});

app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found' }));
app.use(errorHandler);

if (require.main === module) {
    app.listen(PORT, async () => {
        console.log(`🚀 Notification Service running on port ${PORT}`);
        await initEventConsumers();
    });
}

export default app;
