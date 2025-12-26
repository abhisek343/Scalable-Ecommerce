import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import orderRoutes from '../src/routes/order.routes';
import { errorHandler } from '../src/middleware/error.middleware';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/orders', orderRoutes);
app.use(errorHandler);

// Helper to generate auth token
const generateToken = (userId: string = '507f1f77bcf86cd799439011') => {
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'test-secret-key-12345');
};

// Mock RabbitMQ methods
jest.mock('@ecommerce/shared', () => ({
    getChannel: jest.fn(),
    publishToQueue: jest.fn().mockResolvedValue(true),
    initRabbitMQ: jest.fn().mockResolvedValue(true),
}));

describe('Order Service API', () => {
    let authToken: string;

    beforeAll(() => {
        authToken = generateToken();
    });

    describe('GET /api/orders/health', () => {
        it('should return healthy status', async () => {
            const response = await request(app)
                .get('/api/orders/health');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.service).toBe('order-service');
            expect(response.body.status).toBe('healthy');
        });
    });

    describe('POST /api/orders/:userId', () => {
        const userId = '507f1f77bcf86cd799439011';

        it('should fail without authorization', async () => {
            const response = await request(app)
                .post(`/api/orders/${userId}`)
                .send({
                    items: [{ productId: '507f1f77bcf86cd799439012', quantity: 2 }],
                    totalAmount: 199.99
                });

            expect(response.status).toBe(401);
        });

        it('should fail with invalid userId format', async () => {
            const response = await request(app)
                .post('/api/orders/invalid-id')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    items: [{ productId: '507f1f77bcf86cd799439012', quantity: 2 }],
                    totalAmount: 199.99
                });

            expect(response.status).toBe(400);
        });

        it('should fail with missing required fields', async () => {
            const response = await request(app)
                .post(`/api/orders/${userId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({});

            expect(response.status).toBe(400);
        });

        it('should fail with invalid items array', async () => {
            const response = await request(app)
                .post(`/api/orders/${userId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    items: [],
                    totalAmount: 100
                });

            expect(response.status).toBe(400);
        });

        it('should fail with negative totalAmount', async () => {
            const response = await request(app)
                .post(`/api/orders/${userId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    items: [{ productId: '507f1f77bcf86cd799439012', quantity: 1 }],
                    totalAmount: -50
                });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/orders/:userId', () => {
        const userId = '507f1f77bcf86cd799439011';

        it('should fail without authorization', async () => {
            const response = await request(app)
                .get(`/api/orders/${userId}`);

            expect(response.status).toBe(401);
        });

        it('should fail with invalid userId format', async () => {
            const response = await request(app)
                .get('/api/orders/invalid-id')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(400);
        });
    });

    describe('PUT /api/orders/:orderId/status', () => {
        const orderId = '507f1f77bcf86cd799439013';

        it('should fail without authorization', async () => {
            const response = await request(app)
                .put(`/api/orders/${orderId}/status`)
                .send({ status: 'Processing' });

            expect(response.status).toBe(401);
        });

        it('should fail with invalid status value', async () => {
            const response = await request(app)
                .put(`/api/orders/${orderId}/status`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ status: 'InvalidStatus' });

            expect(response.status).toBe(400);
        });

        it('should fail with missing status', async () => {
            const response = await request(app)
                .put(`/api/orders/${orderId}/status`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({});

            expect(response.status).toBe(400);
        });
    });

    // Add new test case for async order placement
    describe('POST /api/orders/:userId (Async)', () => {
        const userId = '507f1f77bcf86cd799439011';

        it('should accept valid order and return 202 Queued', async () => {
            const response = await request(app)
                .post(`/api/orders/${userId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    items: [{ productId: '507f1f77bcf86cd799439012', quantity: 2 }],
                    totalAmount: 199.99
                });

            expect(response.status).toBe(202);
            expect(response.body.success).toBe(true);
            expect(response.body.status).toBe('Queued');
            expect(response.body.message).toContain('Order placed successfully');
        });
    });
});
