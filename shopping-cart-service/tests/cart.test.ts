import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import cartRoutes from '../src/routes/cart.routes';
import { errorHandler } from '../src/middleware/error.middleware';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/cart', cartRoutes);
app.use(errorHandler);

// Helper to generate auth token
const generateToken = (userId: string = '507f1f77bcf86cd799439011') => {
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'test-secret-key-12345');
};

describe('Shopping Cart Service API', () => {
    let authToken: string;

    beforeAll(() => {
        authToken = generateToken();
    });

    describe('GET /api/cart/health', () => {
        it('should return healthy status', async () => {
            const response = await request(app)
                .get('/api/cart/health');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.service).toBe('cart-service');
            expect(response.body.status).toBe('healthy');
        });
    });

    describe('POST /api/cart/:userId/add', () => {
        const userId = '507f1f77bcf86cd799439011';

        it('should fail without authorization', async () => {
            const response = await request(app)
                .post(`/api/cart/${userId}/add`)
                .send({
                    productId: '507f1f77bcf86cd799439012',
                    quantity: 2
                });

            expect(response.status).toBe(401);
        });

        it('should fail with invalid userId format', async () => {
            const response = await request(app)
                .post('/api/cart/invalid-id/add')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    productId: '507f1f77bcf86cd799439012',
                    quantity: 2
                });

            expect(response.status).toBe(400);
        });

        it('should fail with missing productId', async () => {
            const response = await request(app)
                .post(`/api/cart/${userId}/add`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ quantity: 2 });

            expect(response.status).toBe(400);
        });

        it('should fail with invalid quantity', async () => {
            const response = await request(app)
                .post(`/api/cart/${userId}/add`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    productId: '507f1f77bcf86cd799439012',
                    quantity: -1
                });

            expect(response.status).toBe(400);
        });

        it('should fail with zero quantity', async () => {
            const response = await request(app)
                .post(`/api/cart/${userId}/add`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    productId: '507f1f77bcf86cd799439012',
                    quantity: 0
                });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/cart/:userId', () => {
        const userId = '507f1f77bcf86cd799439011';

        it('should fail without authorization', async () => {
            const response = await request(app)
                .get(`/api/cart/${userId}`);

            expect(response.status).toBe(401);
        });

        it('should fail with invalid userId format', async () => {
            const response = await request(app)
                .get('/api/cart/invalid-id')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(400);
        });
    });

    describe('DELETE /api/cart/:userId/remove/:productId', () => {
        const userId = '507f1f77bcf86cd799439011';
        const productId = '507f1f77bcf86cd799439012';

        it('should fail without authorization', async () => {
            const response = await request(app)
                .delete(`/api/cart/${userId}/remove/${productId}`);

            expect(response.status).toBe(401);
        });
    });

    describe('PUT /api/cart/:userId/update/:productId', () => {
        const userId = '507f1f77bcf86cd799439011';
        const productId = '507f1f77bcf86cd799439012';

        it('should fail without authorization', async () => {
            const response = await request(app)
                .put(`/api/cart/${userId}/update/${productId}`)
                .send({ quantity: 5 });

            expect(response.status).toBe(401);
        });

        it('should fail with missing quantity', async () => {
            const response = await request(app)
                .put(`/api/cart/${userId}/update/${productId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({});

            expect(response.status).toBe(400);
        });

        it('should fail with invalid quantity', async () => {
            const response = await request(app)
                .put(`/api/cart/${userId}/update/${productId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ quantity: -5 });

            expect(response.status).toBe(400);
        });
    });

    describe('DELETE /api/cart/:userId/clear', () => {
        const userId = '507f1f77bcf86cd799439011';

        it('should fail without authorization', async () => {
            const response = await request(app)
                .delete(`/api/cart/${userId}/clear`);

            expect(response.status).toBe(401);
        });

        it('should fail with invalid userId format', async () => {
            const response = await request(app)
                .delete('/api/cart/invalid-id/clear')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(400);
        });
    });
});
