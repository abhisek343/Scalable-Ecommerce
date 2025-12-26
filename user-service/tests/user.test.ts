import request from 'supertest';
import express from 'express';
import userRoutes from '../src/routes/user.routes';
import { errorHandler } from '../src/middleware/error.middleware';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);
app.use(errorHandler);

describe('User Service API', () => {
    describe('POST /api/users/register', () => {
        it('should register a new user successfully', async () => {
            const userData = {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'Password123'
            };

            const response = await request(app)
                .post('/api/users/register')
                .send(userData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.token).toBeDefined();
            expect(response.body.data.user.email).toBe(userData.email);
            expect(response.body.data.user.name).toBe(userData.name);
        });

        it('should fail with invalid email format', async () => {
            const userData = {
                name: 'John Doe',
                email: 'invalid-email',
                password: 'Password123'
            };

            const response = await request(app)
                .post('/api/users/register')
                .send(userData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Validation failed');
            expect(response.body.details).toContainEqual(
                expect.objectContaining({ field: 'email' })
            );
        });

        it('should fail with weak password', async () => {
            const userData = {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'weak'
            };

            const response = await request(app)
                .post('/api/users/register')
                .send(userData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should fail with missing required fields', async () => {
            const response = await request(app)
                .post('/api/users/register')
                .send({ email: 'john@example.com' });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should fail when registering duplicate email', async () => {
            const userData = {
                name: 'John Doe',
                email: 'duplicate@example.com',
                password: 'Password123'
            };

            // First registration
            await request(app)
                .post('/api/users/register')
                .send(userData);

            // Duplicate registration
            const response = await request(app)
                .post('/api/users/register')
                .send(userData);

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('already exists');
        });
    });

    describe('POST /api/users/login', () => {
        beforeEach(async () => {
            // Register a user for login tests
            await request(app)
                .post('/api/users/register')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'Password123'
                });
        });

        it('should login successfully with valid credentials', async () => {
            const response = await request(app)
                .post('/api/users/login')
                .send({
                    email: 'test@example.com',
                    password: 'Password123'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.token).toBeDefined();
            expect(response.body.data.user.email).toBe('test@example.com');
        });

        it('should fail with wrong password', async () => {
            const response = await request(app)
                .post('/api/users/login')
                .send({
                    email: 'test@example.com',
                    password: 'WrongPassword123'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Invalid email or password');
        });

        it('should fail with non-existent email', async () => {
            const response = await request(app)
                .post('/api/users/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'Password123'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should fail with missing credentials', async () => {
            const response = await request(app)
                .post('/api/users/login')
                .send({ email: 'test@example.com' });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/users/me', () => {
        let authToken: string;

        beforeEach(async () => {
            // Register and login to get token
            const registerResponse = await request(app)
                .post('/api/users/register')
                .send({
                    name: 'Auth User',
                    email: 'auth@example.com',
                    password: 'Password123'
                });

            authToken = registerResponse.body.data.token;
        });

        it('should return user profile with valid token', async () => {
            const response = await request(app)
                .get('/api/users/me')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.email).toBe('auth@example.com');
            expect(response.body.data.name).toBe('Auth User');
        });

        it('should fail without authorization header', async () => {
            const response = await request(app)
                .get('/api/users/me');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should fail with invalid token', async () => {
            const response = await request(app)
                .get('/api/users/me')
                .set('Authorization', 'Bearer invalid-token');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should fail with malformed authorization header', async () => {
            const response = await request(app)
                .get('/api/users/me')
                .set('Authorization', 'InvalidFormat');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/users/health', () => {
        it('should return healthy status', async () => {
            const response = await request(app)
                .get('/api/users/health');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.service).toBe('user-service');
            expect(response.body.status).toBe('healthy');
            expect(response.body.timestamp).toBeDefined();
        });
    });
});
