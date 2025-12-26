import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import productRoutes from '../src/routes/product.routes';
import { errorHandler } from '../src/middleware/error.middleware';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/products', productRoutes);
app.use(errorHandler);

// Helper to generate auth token
const generateToken = () => {
    return jwt.sign({ userId: '507f1f77bcf86cd799439011' }, process.env.JWT_SECRET || 'test-secret-key-12345');
};

describe('Product Service API', () => {
    let authToken: string;

    beforeAll(() => {
        authToken = generateToken();
    });

    describe('POST /api/products/create', () => {
        it('should create a new product successfully', async () => {
            const productData = {
                name: 'Test Product',
                description: 'This is a test product description',
                price: 99.99,
                category: 'Electronics',
                stock: 10
            };

            const response = await request(app)
                .post('/api/products/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send(productData);

            expect(response.status).toBe(201);
            expect(response.body.name).toBe(productData.name);
            expect(response.body.stock).toBe(productData.stock);
            expect(response.body._id).toBeDefined();
        });

        it('should fail without authorization', async () => {
            const response = await request(app)
                .post('/api/products/create')
                .send({});

            expect(response.status).toBe(401);
        });

        it('should fail with invalid input', async () => {
            const invalidData = {
                name: 'A', // Too short
                price: -10 // Negative
            };

            const response = await request(app)
                .post('/api/products/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Validation failed');
        });
    });

    describe('GET /api/products', () => {
        beforeEach(async () => {
            // Seed some products
            await request(app)
                .post('/api/products/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Product 1',
                    description: 'Description 1',
                    price: 10,
                    category: 'Cat1',
                    stock: 5
                });

            await request(app)
                .post('/api/products/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Product 2',
                    description: 'Description 2',
                    price: 20,
                    category: 'Cat2',
                    stock: 10
                });
        });

        it('should get all products with pagination', async () => {
            const response = await request(app).get('/api/products');

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(2);
            expect(response.body.total).toBe(2);
        });

        it('should filter by query params (limit)', async () => {
            const response = await request(app).get('/api/products?limit=1');

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(1);
        });
    });

    describe('GET /api/products/:id', () => {
        let productId: string;

        beforeEach(async () => {
            const res = await request(app)
                .post('/api/products/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Target Product',
                    description: 'Target Description',
                    price: 50,
                    category: 'Target',
                    stock: 100
                });
            productId = res.body._id;
        });

        it('should get product by ID', async () => {
            const response = await request(app).get(`/api/products/${productId}`);

            expect(response.status).toBe(200);
            expect(response.body.name).toBe('Target Product');
        });

        it('should return 404 for non-existent ID', async () => {
            const fakeId = '507f1f77bcf86cd799439000'; // Valid format but unused
            const response = await request(app).get(`/api/products/${fakeId}`);

            expect(response.status).toBe(404);
        });

        it('should return 400 for invalid ID format', async () => {
            const response = await request(app).get('/api/products/invalid-id');

            expect(response.status).toBe(400);
        });
    });

    describe('PUT /api/products/:id/deduct', () => {
        let productId: string;

        beforeEach(async () => {
            const res = await request(app)
                .post('/api/products/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Stock Product',
                    description: 'Stock Description',
                    price: 50,
                    category: 'Stock',
                    stock: 10
                });
            productId = res.body._id;
        });

        it('should deduct stock successfully', async () => {
            const response = await request(app)
                .put(`/api/products/${productId}/deduct`)
                .send({ quantity: 5 });

            expect(response.status).toBe(200);
            expect(response.body.stock).toBe(5);
        });

        it('should fail if insufficient stock', async () => {
            const response = await request(app)
                .put(`/api/products/${productId}/deduct`)
                .send({ quantity: 15 });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Insufficient stock');
        });
    });
});
