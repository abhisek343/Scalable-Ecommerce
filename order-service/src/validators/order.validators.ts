import { z } from 'zod';

/**
 * Order Item Schema
 */
const orderItemSchema = z.object({
    productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format'),
    quantity: z.number().int().positive('Quantity must be at least 1'),
    price: z.number().positive().optional()
});

/**
 * Create Order Schema
 */
export const createOrderSchema = z.object({
    items: z
        .array(orderItemSchema)
        .min(1, 'Order must contain at least one item')
        .max(50, 'Order cannot exceed 50 items'),
    totalAmount: z
        .number({ required_error: 'Total amount is required' })
        .positive('Total amount must be positive')
});

/**
 * Update Order Status Schema
 */
export const updateOrderStatusSchema = z.object({
    status: z.enum([
        'Pending',
        'Confirmed',
        'Processing',
        'Shipped',
        'Delivered',
        'Cancelled',
        'Refunded'
    ], { errorMap: () => ({ message: 'Invalid order status' }) })
});

/**
 * Order ID Parameter Schema
 */
export const orderIdSchema = z.object({
    orderId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid order ID format')
});

/**
 * User ID Parameter Schema
 */
export const userIdSchema = z.object({
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format')
});

// Type exports
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
