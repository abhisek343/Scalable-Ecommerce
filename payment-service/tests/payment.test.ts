import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import paymentRoutes from '../src/routes/payment.routes';
import { errorHandler } from '../src/middleware/error.middleware';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/payments', paymentRoutes);
app.use(errorHandler);

// Helper to generate auth token
const generateToken = (userId: string = '507f1f77bcf86cd799439011') => {
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'test-secret-key-12345');
};

describe('Payment Service API', () => {
    let authToken: string;

    beforeAll(() => {
        authToken = generateToken();
    });

    describe('GET /api/payments/health', () => {
        it('should return healthy status', async () => {
            const response = await request(app)
                .get('/api/payments/health');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.service).toBe('payment-service');
            expect(response.body.status).toBe('healthy');
        });
    });

    describe('POST /api/payments/:orderId/create', () => {
        const orderId = '507f1f77bcf86cd799439012';

        it('should fail without authorization', async () => {
            const response = await request(app)
                .post(`/api/payments/${orderId}/create`)
                .send({
                    amount: 9999
                });

            expect(response.status).toBe(401);
        });

        it('should fail with invalid orderId format', async () => {
            const response = await request(app)
                .post('/api/payments/invalid-id/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    amount: 9999
                });

            expect(response.status).toBe(400);
        });

        it('should fail with missing amount', async () => {
            const response = await request(app)
                .post(`/api/payments/${orderId}/create`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({});

            expect(response.status).toBe(400);
        });

        it('should create payment successfully with valid data', async () => {
            const response = await request(app)
                .post(`/api/payments/${orderId}/create`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    amount: 9999
                });

            // Should succeed with mock mode (201) since razorpay is mocked
            expect([200, 201]).toContain(response.status);
        });

        it('should fail with negative amount', async () => {
            const response = await request(app)
                .post(`/api/payments/${orderId}/create`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    amount: -100
                });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/payments/:paymentId', () => {
        const paymentId = '507f1f77bcf86cd799439013';

        it('should fail without authorization', async () => {
            const response = await request(app)
                .get(`/api/payments/${paymentId}`);

            expect(response.status).toBe(401);
        });

        it('should fail with invalid paymentId format', async () => {
            const response = await request(app)
                .get('/api/payments/invalid-id')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/payments/order/:orderId', () => {
        const orderId = '507f1f77bcf86cd799439012';

        it('should fail without authorization', async () => {
            const response = await request(app)
                .get(`/api/payments/order/${orderId}`);

            expect(response.status).toBe(401);
        });

        it('should fail with invalid orderId format', async () => {
            const response = await request(app)
                .get('/api/payments/order/invalid-id')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(400);
        });
    });
});
