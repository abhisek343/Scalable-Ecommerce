import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import notificationRoutes from '../src/routes/notification.routes';
import { errorHandler } from '../src/middleware/error.middleware';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/notifications', notificationRoutes);
app.use(errorHandler);

// Helper to generate auth token
const generateToken = (userId: string = '507f1f77bcf86cd799439011') => {
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'test-secret-key-12345');
};

describe('Notification Service API', () => {
    let authToken: string;

    beforeAll(() => {
        authToken = generateToken();
    });

    describe('GET /api/notifications/health', () => {
        it('should return healthy status', async () => {
            const response = await request(app)
                .get('/api/notifications/health');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.service).toBe('notification-service');
            expect(response.body.status).toBe('healthy');
        });
    });

    describe('POST /api/notifications/email', () => {
        it('should fail without authorization', async () => {
            const response = await request(app)
                .post('/api/notifications/email')
                .send({
                    to: 'test@example.com',
                    subject: 'Test Subject',
                    text: 'Test message body'
                });

            expect(response.status).toBe(401);
        });

        it('should fail with missing to field', async () => {
            const response = await request(app)
                .post('/api/notifications/email')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    subject: 'Test Subject',
                    text: 'Test message body'
                });

            expect(response.status).toBe(400);
        });

        it('should fail with invalid email format', async () => {
            const response = await request(app)
                .post('/api/notifications/email')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    to: 'invalid-email',
                    subject: 'Test Subject',
                    text: 'Test message body'
                });

            expect(response.status).toBe(400);
        });

        it('should fail with missing subject', async () => {
            const response = await request(app)
                .post('/api/notifications/email')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    to: 'test@example.com',
                    text: 'Test message body'
                });

            expect(response.status).toBe(400);
        });

        it('should fail with missing text', async () => {
            const response = await request(app)
                .post('/api/notifications/email')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    to: 'test@example.com',
                    subject: 'Test Subject'
                });

            expect(response.status).toBe(400);
        });

        it('should fail with empty fields', async () => {
            const response = await request(app)
                .post('/api/notifications/email')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    to: '',
                    subject: '',
                    text: ''
                });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/notifications/sms', () => {
        it('should fail without authorization', async () => {
            const response = await request(app)
                .post('/api/notifications/sms')
                .send({
                    to: '+1234567890',
                    message: 'Test SMS message'
                });

            expect(response.status).toBe(401);
        });

        it('should fail with missing to field', async () => {
            const response = await request(app)
                .post('/api/notifications/sms')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    message: 'Test SMS message'
                });

            expect(response.status).toBe(400);
        });

        it('should fail with missing message', async () => {
            const response = await request(app)
                .post('/api/notifications/sms')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    to: '+1234567890'
                });

            expect(response.status).toBe(400);
        });

        it('should fail with empty fields', async () => {
            const response = await request(app)
                .post('/api/notifications/sms')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    to: '',
                    message: ''
                });

            expect(response.status).toBe(400);
        });
    });
});
