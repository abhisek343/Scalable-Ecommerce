import { z } from 'zod';

/**
 * Payment Processing Schema
 */
export const createPaymentSchema = z.object({
    amount: z
        .number({ required_error: 'Amount is required' })
        .positive('Amount must be positive')
        .max(500000, 'Amount cannot exceed 5,00,000 INR'),
    paymentMethodId: z
        .string()
        .optional() // Made optional for Razorpay flow
});

/**
 * Payment ID Parameter Schema
 */
export const paymentIdSchema = z.object({
    paymentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid payment ID format')
});

/**
 * Order ID Parameter Schema
 */
export const orderIdSchema = z.object({
    orderId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid order ID format')
});

// Type exports
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
